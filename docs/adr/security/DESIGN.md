# RoyCSS Security Architecture — DESIGN

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Scope:** All code shipped under `/home/z/my-project/` — the `roycss` npm
  package, the Next.js marketing site, the VS Code extension, the Chrome
  Inspector, the CLI, and the MCP server.
- **Status:** Approved
- **Last reviewed:** 2026-07-30
- **Related:**
  - `docs/adr/security/ADR.md` — 5 concrete architecture decisions
  - `docs/adr/security/THREAT-MODEL.md` — STRIDE-based threat model
  - `docs/adr/security/IMPLEMENTATION-PLAN.md` — remediation plan
  - `docs/adr/security/REVIEW-CHECKLIST.md` — 20 review items
  - `docs/adr/07-security-supply-chain.md` — pre-existing cross-cutting ADR
  - `docs/threat-models/07-security-supply-chain.md` — pre-existing STRIDE model
  - `security/` — automated audit scripts and reports

---

## 1. Goals & non-goals

### 1.1 Goals

1. **Confidentiality of contact-form PII.** Names + emails + messages must not
   leak to attackers or to logs.
2. **Integrity of published artifacts.** The `roycss` npm tarball, VS Code
   `.vsix`, Inspector extension, CLI binary, and MCP server must be byte-for-byte
   identical to what CI built; tampering must be detectable by consumers.
3. **Availability of the marketing site.** No single attacker request should
   be able to take the site down or fill the database.
4. **Zero CSS-driven data exfiltration.** RoyCSS ships 1,569 effects across
   1.17 MB of CSS. A single malicious `url()` or attribute selector could turn
   every consumer page into an exfiltration channel. The library must be
   verifiably free of these vectors.
5. **Supply-chain verifiability.** Consumers must be able to inspect the SBOM,
  verify npm provenance signatures, and audit `bun audit` results.

### 1.2 Non-goals

- **End-user authentication.** The marketing site has no logins; `next-auth`
  is a dependency only because the docs-site scaffolder installed it. It is
  not invoked by any route.
- **Payment security.** No payments are processed.
- **Multi-tenant isolation.** No tenant boundary exists; the site is a
  single-tenant marketing surface.
- **Browser exploit mitigation.** Out of scope — TLS, HSTS, and CSP are
  in scope; hardening the browser itself is not.

---

## 2. Trust boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│  INTERNET (untrusted)                                            │
│                                                                  │
│   ┌────────────┐        ┌──────────────────────────────────┐      │
│   │  Attacker  │───────▶│  Caddy (TLS, HSTS, rate-limit)   │      │
│   └────────────┘        └────────────┬─────────────────────┘      │
│                                      │                            │
└──────────────────────────────────────┼────────────────────────────┘
                                       │ HTTPS only (HSTS preload)
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  DMZ — Next.js Edge runtime (src/middleware.ts)                  │
│                                                                  │
│   • Generates per-request CSP nonce (crypto.getRandomValues)     │
│   • Sets CSP + x-nonce on every response                         │
│   • Trust boundary: HIGH (executes before any app code)          │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  APP — Next.js Node runtime (src/app/*, src/components/*)        │
│                                                                  │
│   • Public site routes (/, /api/contact, etc.)                   │
│   • Trust boundary: MEDIUM (executes app code, reads user input) │
└──────────────┬───────────────────────────────────┬───────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────┐         ┌─────────────────────────────┐
│  SQLite (prisma/dev.db)  │         │  npm registry (publish)     │
│  Trust boundary: HIGH    │         │  Trust boundary: MEDIUM     │
│  (filesystem-only, no    │         │  (provenance signed,        │
│  network listener)       │         │  Sigstore-verified)         │
└──────────────────────────┘         └─────────────────────────────┘
```

### 2.1 Boundary crossings

| Crossing | Protocol | Authn | Validation |
|---|---|---|---|
| Internet → Caddy | HTTPS | None (public) | TLS termination, HSTS preload, rate-limit (Caddyfile) |
| Caddy → Next.js | HTTP (localhost) | None | None (localhost-only) |
| Next.js middleware → app | in-process | None (Edge runtime) | Per-request nonce attached to response headers |
| App → SQLite | filesystem (no network) | `DATABASE_URL` env var | Prisma parameterized queries; zod input validation |
| App → npm (publish only) | HTTPS + Sigstore | `NPM_TOKEN` (CI secret) | `npm publish --provenance --access public` |
| App → user browser | HTTPS | None | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, COOP, CORP |

---

## 3. Authentication

**There is no end-user authentication.** The marketing site is a public,
read-only surface with a single write path: the contact form. Decisions:

1. **`next-auth` is in `dependencies` but unused.** It is a scaffolding
   remnant from the docs-site generator. Removing it would be ideal, but it
   does not execute and `bun audit` is clean. Removal is tracked as
   recommendation R-3 in `IMPLEMENTATION-PLAN.md`.
2. **No cookies are set.** The site sets no auth, session, tracking, or
   analytics cookies. CSP `connect-src 'self'` blocks any analytics beacon.
3. **No tokens in localStorage / sessionStorage.** The favorites sheet and
   contact form are stateless; nothing is persisted client-side that an XSS
   could exfiltrate.
4. **CSP nonces are per-request, single-use.** Generated in
   `src/middleware.ts` with `crypto.getRandomValues(16)` and attached to the
   response. The nonce lives only in the response header + `<script>` tags
   for the lifetime of that response.

---

## 4. Input validation (contact form)

The contact form is the **only** user-input path that reaches the database.

### 4.1 Validation layers (defense in depth)

```
User browser
   │
   │  HTML form (name, email, subject dropdown, message)
   │  Client-side: required + email pattern + min-length=10
   ▼
POST /api/contact (application/json)
   │
   │  Layer 1: JSON body parse — `req.json().catch(() => null)`
   │  Layer 2: Type narrowing — `typeof body === "object"`
   │  Layer 3: Field-level validation:
   │           • name, email, message required (non-empty after trim)
   │           • email regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   │           • message.length >= 10
   │  Layer 4: Length truncation before Prisma write:
   │           • name.slice(0, 120)
   │           • email.slice(0, 160)
   │           • subject.slice(0, 160)
   │           • message.slice(0, 5000)
   ▼
Prisma `db.contactMessage.create({ data: ... })`
   │
   │  Parameterized query (no string concatenation)
   │  Schema-level types: String (TEXT in SQLite)
   ▼
SQLite (prisma/dev.db, filesystem-only)
```

### 4.2 What is **not** validated today (gaps)

| Gap | Severity | Mitigation plan |
|---|---|---|
| No rate limiting | **High** | R-1 in IMPLEMENTATION-PLAN.md — add IP-based rate limit (5 req/min) in middleware or route |
| No CSRF token | Medium | Same-origin POST + `form-action 'self'` in CSP mitigates; add `Origin`/`Sec-Fetch-Site` check |
| No honeypot field | Medium | R-2 — add a hidden `website` field; reject if non-empty |
| No CAPTCHA | Low | Defer until spam volume warrants it; honeypot + rate-limit first |
| No `zod` schema | Low | Inline validation is sufficient for 4 fields; `zod` is overkill but would be cleaner |
| Subject is free-text (not enum-constrained server-side) | Low | Client sends `SUBJECTS.find(...)?.label ?? "General Inquiry"`; server accepts any string ≤160 chars |
| Email regex is permissive | Low | Allows `a@b.c`; acceptable for a non-auth contact form |
| `message.length < 10` minimum but no maximum enforced before slice | Info | `message.slice(0, 5000)` enforces the max post-validation |

### 4.3 Output encoding

- **All user input rendered in React JSX children** — React auto-escapes.
- **No `dangerouslySetInnerHTML` with user content** — enforced by
  `security/xss-scan.ts` as a CI gate.
- **The 3 `dangerouslySetInnerHTML` sites** (dynamic-effect-css.tsx,
  roycss-page.tsx, chart.tsx) inject library-controlled CSS only, each
  annotated with a `// SECURITY:` comment naming the threat model entry.

---

## 5. Dependency management

### 5.1 Three-tier posture

| Tier | Surface | Runtime deps | Policy |
|---|---|---|---|
| **A — Zero-runtime** | `roycss` npm package, VS Code ext, Inspector ext, CLI, MCP server | **0** | `dependencies: {}` in their package.json. Dev-only deps (TypeScript, types) allowed, pinned to major. |
| **B — Marketing site** | `src/app/*`, `src/components/*` | 69 | Every direct dep: pinned to major (`^N.x.x`), in SBOM, `bun audit` clean, justified in `docs/checklists/07-security-supply-chain.md` |
| **C — Build tooling** | `eslint`, `prisma`, `@changesets/cli`, etc. | 12 (devDeps) | Same as Tier B but not shipped; still in SBOM as `dependency-type=dev` |

### 5.2 Lockfile + overrides

- **`bun.lock`** is committed. Every install is reproducible.
- **`overrides`** in `package.json` force patched versions of 16 transitive
  deps (see `docs/adr/07-security-supply-chain.md` §6 for the full table).
- **No `postinstall` scripts allowed in Tier A artifacts.** The marketing
  site (Tier B) allows `postinstall` for native-binary downloaders (`prisma`,
  `sharp`) — these are documented in `security/results/audit-report.json`.

### 5.3 Upgrade cadence

- **Patch:** allowed if `bun audit` improves or stays neutral.
- **Minor:** requires checklist sign-off that no breaking changes affect our usage.
- **Major:** requires an ADR amendment.
- **New direct runtime dep:** requires SBOM entry + checklist entry +
  `bun audit` clean signal.

### 5.4 Supply-chain verification

| Check | Where | Fails build on |
|---|---|---|
| `bun audit --json` | `security/audit.ts` | Any high/critical advisory |
| SBOM generation | `security/sbom.ts` | Never fails (informational) |
| SBOM SPDX regeneration | `security/SBOM.json` (this task) | Never fails (informational) |
| CSP emit | `security/csp.ts` | Never fails |
| CSS exfiltration scan | `security/css-exfiltration-check.ts` | Any external `url()`, `@import`, `@font-face` external `src`, attribute-selector + `url()` combo |
| XSS scan | `security/xss-scan.ts` | Any `dangerouslySetInnerHTML` without `// SECURITY:` comment; any `eval`, `new Function`, `document.write`, `setTimeout(string)` |
| `npm publish --provenance` | `package.json` `publish:ci` | Sigstore signature must verify |

---

## 6. Secret management

### 6.1 Secrets in this repo

| Secret | Location | Rotation | Exposure |
|---|---|---|---|
| `DATABASE_URL` | `.env` (gitignored) | On compromise | Filesystem-only SQLite; no network listener |
| `NPM_TOKEN` | GitHub Actions secret | Quarterly or on compromise | Used only in `publish:ci`; never written to a file |
| `GITHUB_TOKEN` | GitHub Actions default | Per-run | Used by changesets to create release PRs |

### 6.2 What is **not** a secret

- **CSP nonces** — per-request, single-use, 128 bits of entropy. Not secret
  beyond the lifetime of one HTTP response.
- **SBOM** — public by design (security through obscurity is worse).
- **`bun.lock`** — public.
- **`package.json` overrides** — public.

### 6.3 Secret hygiene rules

1. **No secrets in code.** All secrets via `process.env`. `.env` is gitignored.
2. **No secrets in logs.** `console.error` in the contact route logs only
   `[contact] Failed to persist message to DB` — no PII, no env vars.
3. **No secrets in error messages.** The 500 response says "Something went
   wrong. Please try again later." — no stack trace, no env var name.
4. **No secrets in the SBOM.** The SBOM reads only `name`, `version`,
   `license`, `description`, `homepage`, `repository` — never env vars.
5. **`.env` is loaded by `@next/env`** (Next.js built-in). No `dotenv` dep.

---

## 7. Data flows

### 7.1 Contact form (write path — the only user-driven write)

```
Browser ──HTTPS POST /api/contact──▶ Next.js route
                                      │
                                      ├─ Parse JSON
                                      ├─ Validate (4 layers, see §4.1)
                                      ├─ Truncate to schema max
                                      ├─ Prisma create (parameterized)
                                      │   └─▶ SQLite file (no network)
                                      └─ Return { ok: true, message }
```

No email is sent (no SMTP dep). No webhook fires. The DB row is read-only
from the app layer — there is no admin UI to view messages (TODO: tracked
as a future ops task; out of security scope for v1.4.0).

### 7.2 Effect CSS injection (read path)

```
Browser loads /
   │
   ├─ Initial HTML (no effect CSS — only critical CSS)
   ├─ Hydration → VirtualScrollGrid renders 24 cards
   ├─ IntersectionObserver fires for visible cards
   │   └─▶ DynamicEffectCSS injects <style dangerouslySetInnerHTML>
   │        with effects[i].cssCode (library CSS, NOT user input)
   └─ User scrolls → more cards → more CSS injected on demand
```

The CSS comes from `src/lib/effects-batch-*.ts` (committed source, MIT
licensed, scanned by `css-exfiltration-check.ts`). **No user input ever
reaches `dangerouslySetInnerHTML`.**

### 7.3 npm publish (release path)

```
GitHub Actions (on tag v1.x.x)
   │
   ├─ bun install (reproducible from bun.lock)
   ├─ bun run lint
   ├─ bun run security:all (5 CI gates)
   ├─ bun run build:package (builds dist/roycss.min.css, effects.json, etc.)
   ├─ bun run scripts/publish/prepare.ts
   ├─ bun run scripts/publish/validate.ts
   ├─ npm publish --provenance --access public
   │   └─▶ Sigstore signature attached to tarball
   └─ bun run scripts/publish/release.ts (creates GitHub release)
```

Consumers verify with `npm audit signatures` (Sigstore).

---

## 8. Security headers (current state)

Set in `next.config.ts` `headers()` and applied to every route:

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | dev: `'self' 'unsafe-inline' 'unsafe-eval'`; prod: `'self' 'nonce-{random}' 'strict-dynamic'` | Defeats XSS, clickjacking, MIME-sniffing |
| `X-Frame-Options` | `DENY` | Legacy clickjacking defense (belt + suspenders with `frame-ancestors`) |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak full URL in cross-origin referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused device APIs |
| `X-DNS-Prefetch-Control` | `on` | Enable DNS prefetch for performance (no security impact) |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years, eligible for HSTS preload list |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolate browsing context — defense against Spectre-style window-handle leaks (added by this task) |
| `Cross-Origin-Resource-Policy` | `same-origin` | Block cross-origin loads of site resources (added by this task) |

See `security/CSP.md` for the full CSP directive rationale and
`security/results/csp.txt` / `csp-production.txt` for the generated strings.

---

## 9. Logging & monitoring

- **`console.error("[contact] Failed to persist message to DB")`** — no PII,
  no stack trace. The Prisma error itself is swallowed.
- **`console.error("[contact] Unexpected error:", err)`** — the `err` object
  may include a stack trace, but no PII (validation happens before the DB
  call; the only PII is in the request body which is not logged).
- **CSP violations** — not logged (enforcing mode, no `report-to` directive).
  If a `report-to` endpoint is added later, it must rate-limit.
- **No request logging middleware.** Next.js default dev logging goes to
  `dev.log` (gitignored); prod goes to `server.log` (gitignored).

---

## 10. Open questions (deferred to future ADRs)

1. **Should we ship a `report-to` endpoint for CSP violations?** Pro: real-
   world visibility. Con: another network listener + rate-limit surface.
2. **Should the contact form send an email notification?** Would require an
   SMTP dep + secret; currently out of scope.
3. **Should we add Trusted Types?** Next.js 16 does not yet support them
   natively; revisit when it does.
4. **Should the `next-auth` dep be removed?** Yes (R-3 in IMPLEMENTATION-PLAN),
   but the security risk of leaving it is zero (no route imports it).

---

## 11. References

- `docs/adr/security/ADR.md` — 5 concrete ADRs
- `docs/adr/security/THREAT-MODEL.md` — STRIDE analysis
- `docs/adr/security/IMPLEMENTATION-PLAN.md` — remediation plan
- `docs/adr/security/REVIEW-CHECKLIST.md` — 20 review items
- `docs/adr/07-security-supply-chain.md` — pre-existing cross-cutting ADR
- `docs/threat-models/07-security-supply-chain.md` — pre-existing STRIDE model
- `security/` — automated audit scripts and reports
- `security/CSP.md` — CSP recommendation deep-dive
- `security/CONTACT-FORM-SECURITY.md` — contact form audit
- `security/SECURITY-POLICY.md` — responsible disclosure policy
- `security/DEPENDENCY-AUDIT.md` — `bun audit` + outdated package summary
- `security/SBOM.json` — SPDX 2.3 SBOM
- `security/CHECKLIST.md` — pre-release security checklist
- OWASP Top 10 (2021): <https://owasp.org/Top10/>
- Next.js CSP guide: <https://nextjs.org/docs/app/guides/content-security-policy>
- CycloneDX 1.4: <https://cyclonedx.org/docs/1.4/json/>
- SPDX 2.3: <https://spdx.github.io/spdx-spec/v2.3/>
