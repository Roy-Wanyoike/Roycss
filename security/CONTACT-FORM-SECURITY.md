# Contact Form Security Audit

- **Audit date:** 2026-07-30
- **Auditor:** Security Engineering & Supply Chain domain agent
- **Scope:** `src/app/api/contact/route.ts` (the API route) +
  `src/components/roycss/contact-form.tsx` (the client component) +
  `prisma/schema.prisma` (the data model) + `src/lib/db.ts` (the Prisma
  client singleton)
- **Related:** `docs/adr/security/THREAT-MODEL.md` (T1, T2, I6, D1, R2),
  `docs/adr/security/IMPLEMENTATION-PLAN.md` (R-1, R-2, R-4, R-5),
  `docs/adr/security/ADR.md` ADR-S3 (spam prevention)

---

## 1. Executive summary

The contact form is the **only** user-driven write path on the RoyCSS
marketing site. It accepts `{ name, email, subject, message }` and
persists to a SQLite database via Prisma.

| Control | Status | Notes |
|---|---|---|
| Input validation | ✅ Sufficient | 4 layers: JSON parse → type check → field validation → length truncation |
| Rate limiting | ❌ **Missing** | **HIGH-priority gap (R-1)** — no rate limit on `/api/contact` |
| SQL injection | ✅ Safe | Prisma parameterized queries; no raw SQL anywhere |
| XSS (output encoding) | ✅ Safe | React JSX auto-escaping; no `dangerouslySetInnerHTML` with user content |
| CSRF (same-origin) | ✅ Mitigated | Same-origin POST + `form-action 'self'` in CSP; no `Origin` header check (R-4-adjacent, low priority) |
| Spam prevention (honeypot) | ❌ Missing | Medium-priority gap (R-2) — no honeypot field |
| Spam prevention (CAPTCHA) | ⏸ Deferred | Defer until spam volume warrants it (ADR-S3) |
| Subject enum validation | ⚠ Partial | Client sends enum label; server accepts any string ≤160 chars (R-4) |
| PII audit trail | ⚠ Partial | `createdAt` + cuid only; no hashed IP (R-5) |
| Error handling | ✅ Safe | No stack traces or env vars in 500 response |
| Logging | ✅ Safe | No PII logged; only generic error messages |

**Verdict:** The contact form is **safe against injection and XSS** but
has **one HIGH-priority gap** (no rate limit) and **three minor gaps**
(no honeypot, no subject enum, no hashed IP audit trail). See
`docs/adr/security/IMPLEMENTATION-PLAN.md` for the remediation plan.

---

## 2. Code under audit

### 2.1 `src/app/api/contact/route.ts` (73 lines, read-only)

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Name, email and message are required." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    if (message.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }

    try {
      await db.contactMessage.create({
        data: {
          name: name.slice(0, 120),
          email: email.slice(0, 160),
          subject: (subject || "General Inquiry").slice(0, 160),
          message: message.slice(0, 5000),
        },
      });
    } catch {
      // DB write is best-effort; we still respond OK so the UX is smooth.
      console.error("[contact] Failed to persist message to DB");
    }

    return NextResponse.json({
      ok: true,
      message: "Thanks for reaching out! Your message has been received.",
    });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Contact endpoint is live. Send a POST with { name, email, subject, message }.",
  });
}
```

### 2.2 `prisma/schema.prisma` (relevant model)

```prisma
model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  subject   String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### 2.3 `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### 2.4 `src/components/roycss/contact-form.tsx` (client, 315 lines)

Submits via:

```typescript
const res = await fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: name.trim(),
    email: email.trim(),
    subject: SUBJECTS.find((s) => s.value === subject)?.label ?? "General Inquiry",
    message: message.trim(),
  }),
});
```

Where `SUBJECTS` is an array of 6 `{ value, label }` pairs (General
Inquiry, Bug Report, Feature Request, Suggestion, Partnership / Enterprise,
Feedback).

---

## 3. Input validation — is it sufficient?

### 3.1 The 4 layers (defense in depth)

```
Layer 1: JSON body parse — `req.json().catch(() => null)`
         └─ Rejects malformed JSON with 400.

Layer 2: Type narrowing — `typeof body === "object"`
         └─ Rejects arrays, strings, numbers with 400.

Layer 3: Field-level validation
         ├─ name, email, message required (non-empty after trim)
         ├─ email regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
         └─ message.length >= 10

Layer 4: Length truncation before Prisma write
         ├─ name.slice(0, 120)
         ├─ email.slice(0, 160)
         ├─ subject.slice(0, 160)
         └─ message.slice(0, 5000)
```

### 3.2 Verdict: ✅ Sufficient

The 4 layers cover:
- Malformed JSON (Layer 1)
- Wrong type (Layer 2)
- Missing fields (Layer 3)
- Bad email format (Layer 3)
- Too-short message (Layer 3)
- Too-long fields (Layer 4 — Prisma's `String` type maps to SQLite `TEXT`
  which has no length limit, so the truncation is the only length cap)

### 3.3 What is **not** validated

| Gap | Severity | Reason | Plan |
|---|---|---|---|
| `subject` not validated against enum | Low | Server accepts any string ≤160 chars. Client sends enum label, but a user can change it via DevTools. | R-4 (low priority) |
| Email regex is permissive | Info | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` allows `a@b.c`. Acceptable for a non-auth contact form. | None |
| No phone number / URL validation | Info | The form doesn't collect phone or URL. | None |
| No HTML sanitization on `message` | Info | The message is never rendered as HTML — only stored in the DB and (eventually) read by a maintainer via a future admin UI. React JSX auto-escapes if it's ever rendered. | None |

---

## 4. Rate limiting — is there any?

### 4.1 Verdict: ❌ **None.** HIGH-priority gap (R-1).

There is **no rate limit** on `/api/contact`. An attacker can submit:

- 1,000 messages/second → SQLite file grows until disk fills
- 100,000 messages/hour → DB becomes unusable
- Infinite concurrent requests → event loop exhaustion

### 4.2 Recommended mitigation (R-1)

IP-based rate limit, 5 requests per minute per IP, sliding window. Implement
in `src/middleware.ts` using an in-memory `Map<ip, number[]>` (sufficient
for single-server deployment). On limit exceeded, return 429.

See `docs/adr/security/IMPLEMENTATION-PLAN.md` §3.R-1 for the pseudocode.

### 4.3 Why middleware (not the route)?

- Middleware runs on every request before the route handler — the rate
  limit check happens before any DB work.
- Middleware has access to `request.headers.get("x-forwarded-for")` for
  the IP.
- The middleware already generates the CSP nonce; adding the rate-limit
  Map is a small incremental change.

### 4.4 Caveats

- In-memory Map resets on server restart. Acceptable for single-server
  deployment. If multi-server, use Redis.
- `x-forwarded-for` can be spoofed if Caddy is not configured to overwrite
  it. Verify `Caddyfile` sets `X-Forwarded-For` correctly.
- The rate limit should be path-scoped to `/api/contact` (not global) so
  it doesn't affect static asset requests.

---

## 5. SQL injection — is Prisma parameterized?

### 5.1 Verdict: ✅ Safe.

Prisma uses parameterized queries by default. The route uses:

```typescript
await db.contactMessage.create({
  data: { name: ..., email: ..., subject: ..., message: ... },
});
```

This compiles to a parameterized SQLite statement:

```sql
INSERT INTO "ContactMessage" ("id", "name", "email", "subject", "message", "read", "createdAt")
VALUES (?, ?, ?, ?, ?, ?, ?)
```

The user input is passed as bound parameters, never string-interpolated
into the SQL.

### 5.2 No raw SQL anywhere

`rg "prisma\.\$queryRaw|prisma\.\$executeRaw" src/` returns 0 hits. The
codebase uses only the typed Prisma client.

### 5.3 Schema-level types

All fields are `String` (SQLite `TEXT`). There are no numeric fields where
a type confusion could matter. The `id` is `@default(cuid())` (Prisma-
generated), so the user cannot inject a malicious `id`.

---

## 6. XSS (output encoding)

### 6.1 Verdict: ✅ Safe.

The contact form submission is **never rendered as HTML**:

- **Storage path:** Stored in SQLite via Prisma. No HTML rendering.
- **Response path:** The route returns a JSON object
  `{ ok: true, message: "Thanks for reaching out! Your message has been received." }`.
  The `message` field is a static string, not user input. The user's
  `name`, `email`, `subject`, `message` are **never echoed back**.
- **Future admin UI:** If a future admin UI renders the messages, it
  would use React JSX, which auto-escapes. The 3 existing
  `dangerouslySetInnerHTML` sites (verified by `security/xss-scan.ts`)
  inject library CSS only — never user content.

### 6.2 Defense in depth

- **CSP `script-src 'self' 'nonce-...' 'strict-dynamic'`** (prod) —
  blocks inline script injection even if a future bug echoed user input
  into HTML.
- **CSP `style-src 'self' 'unsafe-inline'`** — allows inline styles (Tailwind
  needs this) but does not enable script execution.
- **`security/xss-scan.ts` CI gate** — fails the build if any
  `dangerouslySetInnerHTML` lacks a `// SECURITY:` comment.
- **No `eval`, `new Function`, `document.write`** — verified by
  `security/xss-scan.ts`.

---

## 7. CSRF (same-origin)

### 7.1 Verdict: ✅ Mitigated (with minor residual risk).

The contact form is **same-origin**:

- The form is rendered at `https://roycss.com/` (the marketing site).
- The form submits to `/api/contact` (same origin).
- The CSP `form-action 'self'` prevents form submissions to attacker
  origins.
- The CSP `connect-src 'self'` prevents `fetch()` to attacker origins.

### 7.2 The CSRF threat model

A CSRF attack would look like:

1. Attacker creates a malicious page at `https://attacker.com/`.
2. Victim visits `https://attacker.com/` while logged in to
   `roycss.com` (but RoyCSS has no auth, so this is moot).
3. Attacker's page submits a `POST https://roycss.com/api/contact` with
   attacker-controlled data.
4. The browser sends the request with the victim's cookies (RoyCSS sets
   no cookies) and the victim's IP (the request appears to come from
   the victim).

### 7.3 Why CSRF is low-risk for RoyCSS

- **No auth, no cookies, no sessions.** A CSRF attack cannot hijack a
  user's authenticated session because there are no sessions.
- **The worst case:** an attacker submits a contact form message that
  appears to come from the victim's IP. The message lands in the DB with
  the victim's IP (if R-5 is implemented) or no IP (current state). This
  is a spam vector, not a security breach.
- **Rate limiting (R-1) would bound the attack.** Even if an attacker
  CSRFs 1,000 victims into submitting, each victim's IP can submit only
  5/minute.

### 7.4 Recommended additional CSRF defense (low priority)

If we want belt-and-suspenders CSRF protection:

- **Check `Origin` header:** If `request.headers.get("origin") !==
  "https://roycss.com"`, return 403. This is the modern CSRF defense.
- **Or check `Sec-Fetch-Site`:** If
  `request.headers.get("sec-fetch-site") === "cross-site"`, return 403.

Both are low-effort and would be added in R-4 (alongside the subject
enum validation).

---

## 8. Spam prevention

### 8.1 Current state

- ❌ No honeypot field
- ❌ No CAPTCHA
- ❌ No rate limit (covered in §4)
- ✅ Input validation (rejects malformed bodies, but a determined bot
  can submit well-formed bodies)

### 8.2 Recommended (per ADR-S3)

**Three-layer spam prevention, in priority order:**

1. **Honeypot field (R-2, Medium priority).** Add a hidden `website`
   input to `ContactForm`. If non-empty on submit, return 200 OK but do
   not write to the DB. Catches dumb bots that fill every field.
2. **IP-based rate limit (R-1, HIGH priority).** 5 req/min per IP. Catches
   volume attackers.
3. **CAPTCHA (deferred).** Defer until spam volume exceeds 10
   messages/day after layers 1+2. When needed, use **hCaptcha** (privacy-
   friendlier than reCAPTCHA).

### 8.3 Why honeypot before CAPTCHA

- Honeypot is invisible to humans (zero UX friction).
- Honeypot catches dumb bots (most spammers).
- CAPTCHA adds UX friction + a third-party script + a CSP exception.
- Defer CAPTCHA until honeypot + rate-limit is insufficient.

---

## 9. Recommendations summary

| ID | Recommendation | Priority | Effort | Owner |
|---|---|---|---|---|
| **R-1** | Add IP-based rate limit (5 req/min) in `src/middleware.ts` | **HIGH** | 2h | Middleware owner |
| R-2 | Add honeypot `website` field to `ContactForm` + route | Medium | 1h | Contact form owner |
| R-3 | Remove unused `next-auth` dep (reduces attack surface) | Low | 30min | package.json owner |
| R-4 | Validate `subject` against enum server-side; add `Origin`/`Sec-Fetch-Site` check | Low | 30min | Contact route owner |
| R-5 | Add hashed-IP audit trail (salted SHA-256) | Low | 1h | Contact route + Prisma schema owner |
| R-6 | Add ESLint rule against `console.log(process.env)` / `console.log(body)` | Low | 1h | eslint.config.mjs owner |

**Total estimated effort:** ~6 hours. The HIGH-priority item (R-1) is 2
hours; the rest can ship in the next minor release.

See `docs/adr/security/IMPLEMENTATION-PLAN.md` for full pseudocode and
verification steps for each recommendation.

---

## 10. References

- `src/app/api/contact/route.ts` — the route under audit (read-only)
- `src/components/roycss/contact-form.tsx` — the client component (read-only)
- `prisma/schema.prisma` — the data model (read-only)
- `src/lib/db.ts` — the Prisma client singleton (read-only)
- `docs/adr/security/THREAT-MODEL.md` — STRIDE threats (T1, T2, I6, D1, R2)
- `docs/adr/security/IMPLEMENTATION-PLAN.md` — remediation plan (R-1 to R-6)
- `docs/adr/security/ADR.md` ADR-S3 — spam prevention decision
- `docs/adr/07-security-supply-chain.md` §2.3 — `dangerouslySetInnerHTML` policy
- OWASP Input Validation Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html>
- OWASP CSRF Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
- Prisma SQL injection docs: <https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection>
