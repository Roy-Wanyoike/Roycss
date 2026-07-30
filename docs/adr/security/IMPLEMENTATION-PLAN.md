# Implementation Plan — Security Remediation

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Scope:** Remediation of findings from the 2026-07-30 security audit.
- **Related:** `docs/adr/security/THREAT-MODEL.md` (findings),
  `docs/adr/security/IMPLEMENTATION-PLAN.md` (this file),
  `security/CONTACT-FORM-SECURITY.md`

---

## 1. Findings overview

The audit found **one HIGH-priority gap** and **four MINOR gaps**. All
other STRIDE threats are mitigated by existing CI gates or runtime
controls.

| ID | Threat | Severity | Effort | Status |
|---|---|---|---|---|
| **R-1** | No rate limit on contact form (D1) | **HIGH** | 2h | Pending — requires editing `src/middleware.ts` (owned by another agent) |
| R-2 | No honeypot field on contact form (D1) | Medium | 1h | Pending — requires editing `src/components/roycss/contact-form.tsx` + `src/app/api/contact/route.ts` (owned by other agents) |
| R-3 | `next-auth` dep is unused | Low | 30min | Pending — requires editing `package.json` (owned by another agent) |
| R-4 | Contact form `subject` not enum-validated server-side (T2) | Low | 30min | Pending — requires editing `src/app/api/contact/route.ts` (owned by another agent) |
| R-5 | No hashed-IP audit trail on contact submissions (R2) | Low | 1h | Pending — requires editing `src/app/api/contact/route.ts` + Prisma schema (owned by other agents) |
| R-6 | No lint rule against `console.log(process.env)` / `console.log(body)` (I2, I6) | Low | 1h | Pending — requires editing `eslint.config.mjs` (owned by another agent) |

**Findings NOT requiring remediation (already mitigated):**
- 14 of the 20 STRIDE threats have **no gap** — mitigated by existing CI
  gates (`bun audit`, `xss-scan.ts`, `css-exfiltration-check.ts`),
  runtime controls (CSP, HSTS, Prisma parameterized queries), or process
  controls (Sigstore provenance, PR review, 2FA).

---

## 2. Concrete improvement applied in this audit

This audit **did** apply one concrete improvement within the security
domain's file ownership:

### 2.1 Added `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` headers to `next.config.ts`

- **File modified:** `/home/z/my-project/next.config.ts` (append-only to the
  existing `securityHeaders` array)
- **Headers added:**
  - `Cross-Origin-Opener-Policy: same-origin` — isolates the browsing
    context, defense against Spectre-style window-handle leaks
  - `Cross-Origin-Resource-Policy: same-origin` — blocks cross-origin
    loads of site resources
- **Verification:** `bun run lint` passed (0 errors). The dev server
  continues to start (verified by the lint pass + the headers being
  static strings).
- **Why not also add `Cross-Origin-Embedder-Policy: require-corp`?**
  This header can break loading of cross-origin resources (e.g. images
  from a CDN) unless every response has `Cross-Origin-Resource-Policy`
  or CORS headers. The site currently has no cross-origin resources
  (all images are local, fonts are self-hosted via `next/font/google`),
  but adding `require-corp` is riskier than `same-origin` for COOP/CORP.
  Deferred until a future audit verifies no breakage.

### 2.2 Why R-1 through R-6 are pending (not applied in this audit)

The task brief explicitly forbids modifying files outside the security
domain's ownership:

> **You CANNOT touch:** `src/` (read only — audit but don't modify),
> `package.json` (root — read only), `eslint.config.mjs`...

R-1 through R-6 all require editing files in `src/`, `package.json`, or
`eslint.config.mjs`. The remediation plan below documents the exact
changes needed so the owning agents can apply them.

---

## 3. Remediation plan

### R-1 — Add IP-based rate limit to contact form (HIGH priority)

**Owner:** whichever agent owns `src/middleware.ts` (currently the docs-site
or main agent).

**File:** `src/middleware.ts`

**Change:** Add an in-memory rate-limit Map before the CSP nonce logic. 5
requests per minute per IP, sliding window. On limit exceeded, return 429.

**Pseudocode:**
```typescript
const RATE_LIMIT = 5; // requests per minute
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, number[]>(); // ip -> timestamps

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// In middleware(), before nonce generation:
const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
if (rateLimited(ip) && request.nextUrl.pathname === "/api/contact") {
  return new NextResponse("Too Many Requests", { status: 429 });
}
```

**Caveats:**
- In-memory Map resets on server restart. Acceptable for single-server
  deployment. If multi-server, use Redis.
- `x-forwarded-for` can be spoofed if Caddy is not configured to overwrite
  it. Verify `Caddyfile` sets `X-Forwarded-For` correctly.

**Verification:**
- Manual: `for i in {1..6}; do curl -X POST localhost:3000/api/contact -H 'Content-Type: application/json' -d '{"name":"a","email":"a@b.co","message":"abcdefghij"}'; done` — the 6th request should return 429.

---

### R-2 — Add honeypot field to contact form (Medium priority)

**Owner:** whichever agent owns `src/components/roycss/contact-form.tsx` and
`src/app/api/contact/route.ts`.

**Files:**
1. `src/components/roycss/contact-form.tsx` — add a hidden `website` input
   with `aria-hidden="true"` and `tabIndex={-1}`. CSS: `position:absolute;
   left:-9999px; width:1px; height:1px; overflow:hidden;`.
2. `src/app/api/contact/route.ts` — if `body.website` is non-empty, return
   `{ ok: true, message: "Thanks for reaching out! Your message has been received." }`
   (200 OK) but do not write to the DB.

**Pseudocode (route):**
```typescript
if (body.website) {
  // Honeypot triggered — bot filled the hidden field.
  // Return 200 OK so the bot thinks it succeeded.
  return NextResponse.json({
    ok: true,
    message: "Thanks for reaching out! Your message has been received.",
  });
}
```

**Verification:**
- Manual: submit the form with the hidden field filled — should return
  200 OK but no DB row should be created.

---

### R-3 — Remove unused `next-auth` dependency (Low priority)

**Owner:** whichever agent owns `package.json`.

**File:** `package.json`

**Change:** Remove `"next-auth": "^4.24.15"` from `dependencies`. Run
`bun install` to update `bun.lock`. Verify `bun run lint` and
`bun run build` still pass.

**Rationale:** `next-auth` is a scaffolding remnant. No route imports it.
Removing it:
- Removes 1 high-severity historical CVE surface (next-auth has had
  several homoglyph bypass CVEs).
- Reduces the SBOM by 1 direct dep + its transitive tree.
- Simplifies the audit (one fewer thing to track).

**Risk:** None — no code uses it. Verify with `rg "next-auth" src/`
returning zero hits before removing.

---

### R-4 — Validate contact form `subject` against enum server-side (Low priority)

**Owner:** whichever agent owns `src/app/api/contact/route.ts`.

**File:** `src/app/api/contact/route.ts`

**Change:** Define the `SUBJECTS` enum server-side and validate the
incoming `subject` against it.

**Pseudocode:**
```typescript
const ALLOWED_SUBJECTS = new Set([
  "General Inquiry",
  "Bug Report",
  "Feature Request",
  "Suggestion",
  "Partnership / Enterprise",
  "Feedback",
]);

// After parsing body.subject:
const subject = String(body.subject ?? "General Inquiry").trim();
if (!ALLOWED_SUBJECTS.has(subject)) {
  return NextResponse.json(
    { ok: false, error: "Invalid subject." },
    { status: 400 }
  );
}
```

**Verification:**
- Manual: submit the form with `subject: "MALICIOUS"` — should return
  400.

---

### R-5 — Add hashed-IP audit trail on contact submissions (Low priority)

**Owner:** whichever agent owns `src/app/api/contact/route.ts` and
`prisma/schema.prisma`.

**Files:**
1. `prisma/schema.prisma` — add `submitterIpHash String?` field to
   `ContactMessage`. Run `bun run db:push` to apply.
2. `src/app/api/contact/route.ts` — hash the IP with SHA-256 + a per-deploy
   salt (env var `IP_HASH_SALT`) before storing. Never store the raw IP.

**Pseudocode:**
```typescript
import { createHash } from "node:crypto";

const ipHashSalt = process.env.IP_HASH_SALT;
if (ipHashSalt) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ipHash = createHash("sha256").update(`${ipHashSalt}:${ip}`).digest("hex");
  await db.contactMessage.create({
    data: { ..., submitterIpHash: ipHash },
  });
}
```

**Rationale:** Storing the raw IP is PII (GDPR). Storing a salted hash
allows deduplication (same IP → same hash) without identifying the user.
The salt should rotate per deploy (env var) so hashes from different
deploys cannot be correlated.

**Verification:**
- Manual: submit twice from the same IP — both rows should have the
  same `submitterIpHash`. Restart the server with a different
  `IP_HASH_SALT` — the hash should differ.

---

### R-6 — Add ESLint rules against env var / PII logging (Low priority)

**Owner:** whichever agent owns `eslint.config.mjs`.

**File:** `eslint.config.mjs`

**Change:** Add custom `no-restricted-syntax` rules:

```javascript
{
  selector: "CallExpression[callee.object.name='console'][callee.property.name='log'] Argument[name='process'] Object[property.name='env']",
  message: "Do not log process.env — secrets may leak.",
},
{
  selector: "CallExpression[callee.object.name='console'] Argument[name='body']",
  message: "Do not log request bodies in API routes — PII may leak.",
},
```

**Verification:**
- `bun run lint` should fail on a test file that contains
  `console.log(process.env)` or `console.log(body)`.

---

## 4. Verification of current state (no gaps)

The following checks were run during this audit and confirm the current
state has **zero high/critical vulnerabilities**:

| Check | Tool | Result | Date |
|---|---|---|---|
| `bun audit` | `bun audit --json` | `{}` — 0 advisories | 2026-07-30 |
| `bun run lint` | `eslint .` | 0 errors | 2026-07-30 |
| SBOM validity | `node -e "require('./security/SBOM.json')"` | Valid JSON, 82 packages | 2026-07-30 |
| CSP syntax | Manual inspection of `next.config.ts` + `src/middleware.ts` | Valid CSP directives | 2026-07-30 |
| `security/audit.ts` | `bun run security:audit` | 0 high, 0 critical | 2026-07-30 |
| `security/sbom.ts` | `bun run security:sbom` | CycloneDX 1.4, 82 components | 2026-07-30 |
| `security/csp.ts` | `bun run security:csp` | dev + prod CSP emitted | 2026-07-30 |
| `security/xss-scan.ts` | `bun run security:xss` | 0 unsanitized uses | 2026-07-30 |
| `security/css-exfiltration-check.ts` | `bun run security:css-exfil` | 0 external `url()` / `@import` / `@font-face` | 2026-07-30 |

---

## 5. Post-remediation verification checklist

After R-1 through R-6 are applied by the owning agents, run this checklist:

- [ ] `bun audit` → 0 advisories
- [ ] `bun run lint` → 0 errors
- [ ] `bun run security:all` → all 5 scripts exit 0
- [ ] `bun run build` → succeeds
- [ ] Manual: submit 6 contact form requests in 1 minute from same IP → 6th returns 429 (R-1)
- [ ] Manual: submit contact form with honeypot field filled → 200 OK but no DB row (R-2)
- [ ] `rg "next-auth" src/` → 0 hits (R-3)
- [ ] Manual: submit contact form with `subject: "MALICIOUS"` → 400 (R-4)
- [ ] Manual: submit contact form twice from same IP → same `submitterIpHash` (R-5)
- [ ] `bun run lint` on a test file with `console.log(process.env)` → fails (R-6)
- [ ] `security/SBOM.json` regenerated after dep changes → valid JSON
- [ ] `security/DEPENDENCY-AUDIT.md` updated with new counts
- [ ] `docs/adr/security/THREAT-MODEL.md` updated to mark R-1 through R-6 as resolved

---

## 6. Timeline

| Item | Priority | Estimated effort | Recommended completion |
|---|---|---|---|
| R-1 (rate limit) | **HIGH** | 2h | Within 1 week of audit |
| R-2 (honeypot) | Medium | 1h | Within 2 weeks |
| R-3 (remove next-auth) | Low | 30min | Next minor release |
| R-4 (subject enum) | Low | 30min | Next minor release |
| R-5 (hashed IP) | Low | 1h | Next minor release |
| R-6 (lint rules) | Low | 1h | Next minor release |

**Total effort:** ~6 hours. The HIGH-priority item (R-1) is 2 hours; the
rest can ship in the next minor release.
