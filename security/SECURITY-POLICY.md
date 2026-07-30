# Security Policy — RoyCSS

- **Version:** 1.0
- **Last updated:** 2026-07-30
- **Scope:** All code shipped under `/home/z/my-project/` — the `roycss`
  npm package, the Next.js marketing site (roycss.com), the VS Code
  extension, the Chrome Inspector extension, the CLI, and the MCP server.
- **Related:** `docs/adr/security/SECURITY-POLICY.md` (design rationale),
  `security/DEPENDENCY-AUDIT.md`, `security/CSP.md`,
  `security/CONTACT-FORM-SECURITY.md`

---

## 1. Reporting a vulnerability

We take security vulnerabilities seriously. Thank you for taking the time
to report them responsibly.

### 1.1 How to report

**Preferred:** Email **security@roycss.com** with:

1. A description of the vulnerability
2. Steps to reproduce (or a proof-of-concept)
3. The affected component (npm package, marketing site, VS Code ext,
   Inspector ext, CLI, MCP server)
4. The affected version (or git commit SHA)
5. Your assessment of severity (Critical / High / Medium / Low)
6. (Optional) Suggested fix

**Alternative:** Open a private security advisory on GitHub at
<https://github.com/roycss/roycss/security/advisories/new>.

### 1.2 What to expect

- **Acknowledgement:** within **24 hours** (we'll confirm receipt and
  assign a tracking ID).
- **Initial assessment:** within **72 hours** (we'll confirm whether we
  agree it's a vulnerability and assign a severity).
- **Fix timeline:** see §3 below (varies by severity).
- **Credit:** we'll credit you in the CVE and the release notes (unless
  you prefer to remain anonymous).

### 1.3 What NOT to do

- **Do not** open a public GitHub issue for security vulnerabilities.
- **Do not** disclose the vulnerability publicly until we've shipped a
  fix (or 90 days have passed since your report, per the Google Project
  Zero convention).
- **Do not** test vulnerabilities against the production marketing site
  (`roycss.com`) in a way that affects other users. Use a local clone.
- **Do not** exfiltrate user data, even for demonstration purposes.

### 1.4 Safe harbor

We will not take legal action against security researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of
  data, and interruption or degradation of our services.
- Only interact with accounts they own or with explicit permission of the
  owner.
- Do not exploit the vulnerability beyond what is necessary to
  demonstrate it.
- Give us reasonable time to fix the issue before public disclosure.

---

## 2. Supported versions

RoyCSS follows semantic versioning. Security fixes are backported to the
latest minor release of the current major.

| Version | Supported | Until |
|---|---|---|
| `1.4.x` (current) | ✅ Security + bug fixes | Until `1.5.0` release |
| `1.3.x` | ⚠️ Security fixes only | 30 days after `1.5.0` release |
| `1.2.x` and earlier | ❌ Unsupported | — |
| `2.x.x` (future) | TBD | — |

**NPM package:** Only the latest `1.4.x` patch release is supported.
Pin to `"roycss": "^1.4.0"` to receive security patches automatically.

**Marketing site:** The production deployment at `roycss.com` is always
the latest `main` branch. Security fixes are deployed within the SLAs
in §3.

**VS Code extension:** Only the latest version on the VS Code
Marketplace is supported. Auto-update is enabled by default.

**Chrome Inspector:** Only the latest version in the Chrome Web Store is
supported. Auto-update is enabled by default.

---

## 3. Response time SLAs

| Severity | Acknowledge | Initial assessment | Fix shipped | Public disclosure |
|---|---|---|---|---|
| **Critical** (RCE, auth bypass, mass PII leak) | 24h | 72h | 7 days | 90 days or fix+30, whichever is first |
| **High** (XSS, CSRF, SQL injection with limited impact) | 24h | 72h | 14 days | 90 days or fix+30, whichever is first |
| **Medium** (DoS, info leak with no PII) | 48h | 7 days | 30 days | 90 days or fix+30, whichever is first |
| **Low** (defense-in-depth improvements) | 72h | 14 days | Next minor release | At our discretion |

### 3.1 Severity definitions

- **Critical:** Remote code execution, authentication bypass, mass PII
  leak, supply-chain compromise (backdoored tarball).
- **High:** Cross-site scripting (XSS), cross-site request forgery
  (CSRF), SQL injection with limited impact, CSS data exfiltration from
  the published library.
- **Medium:** Denial of service (rate-limit bypass), information
  disclosure with no PII (e.g. stack trace in error response).
- **Low:** Defense-in-depth improvements, missing best-practice headers,
  minor input validation gaps.

### 3.2 Exception: dependency vulnerabilities

For vulnerabilities in third-party dependencies (reported via `bun audit`
or directly to us):

- We follow the upstream package's fix timeline.
- If the upstream package has no fix, we apply an `override` to a forked
  version or document an accepted risk.
- See `docs/adr/07-security-supply-chain.md` §6 for the current
  `overrides` table.

---

## 4. Contact

| Purpose | Contact |
|---|---|
| Security vulnerabilities | **security@roycss.com** (PGP key: TBD) |
| General security questions | GitHub Discussions: <https://github.com/roycss/roycss/discussions> |
| Security advisories (private) | <https://github.com/roycss/roycss/security/advisories/new> |
| Press inquiries about a security release | press@roycss.com |

### 4.1 PGP

(PGP key TBD — to be generated and published before the first security
release. The fingerprint will be listed here and on the `/security` page
of the marketing site.)

---

## 5. Disclosure policy

- **Coordinated disclosure:** we follow the
  [Google Project Zero 90-day disclosure policy](https://www.google.com/about/appsecurity/).
- We will credit the reporter in the CVE and the release notes (unless
  they prefer anonymity).
- We will request a CVE from GitHub Security Advisories (which uses
  MITRE) for any High/Critical vulnerability.
- We will publish a post-mortem for any Critical vulnerability within 30
  days of the fix, describing the root cause, the fix, and the process
  improvements.

---

## 6. Security measures we already have

(For researchers wondering what's already in place — saves you time
probing known-secure surfaces.)

### 6.1 Marketing site (roycss.com)

- **Strict CSP** with per-request nonces (production) and `unsafe-inline`
  for dev only. See `security/CSP.md`.
- **HSTS** with preload (`max-age=63072000; includeSubDomains; preload`).
- **`X-Frame-Options: DENY`** + **`frame-ancestors 'none'`** (belt +
  suspenders clickjacking defense).
- **`X-Content-Type-Options: nosniff`** (MIME-sniffing defense).
- **`Referrer-Policy: strict-origin-when-cross-origin`**.
- **`Permissions-Policy: camera=(), microphone=(), geolocation=()`**.
- **`Cross-Origin-Opener-Policy: same-origin`** + **`Cross-Origin-Resource-Policy: same-origin`**.
- **No third-party scripts.** No analytics, no error reporting SDKs, no
  A/B testing. The site makes zero cross-origin `fetch()` calls.
- **Contact form:** 4-layer input validation, Prisma parameterized
  queries, no `dangerouslySetInnerHTML` with user content. (Rate-limit
  and honeypot are pending — see `security/CONTACT-FORM-SECURITY.md`.)
- **No auth, no cookies, no sessions.** Nothing to hijack.

### 6.2 npm package (`roycss`)

- **Zero runtime dependencies.** `package.json` `dependencies: {}`.
- **`npm publish --provenance`** (Sigstore signature linking tarball to
  GitHub Actions run). Verify with `npm audit signatures`.
- **CSS exfiltration scan** (`security/css-exfiltration-check.ts`) runs
  as a CI gate. Any external `url()`, `@import`, `@font-face` external
  `src`, or attribute-selector + `url()` combo fails the build.
- **XSS scan** (`security/xss-scan.ts`) runs as a CI gate. Any
  `dangerouslySetInnerHTML` without a `// SECURITY:` comment fails the
  build.
- **`bun audit`** runs as a CI gate. Any high/critical advisory fails
  the build.
- **SBOM** (SPDX 2.3 at `security/SBOM.json` + CycloneDX 1.4 at
  `security/results/sbom.json`) generated on every release.

### 6.3 VS Code extension, Chrome Inspector, CLI, MCP server

- All Tier A artifacts ship with **zero runtime dependencies**.
- The VS Code extension's webview CSP is `default-src 'none'` + nonce'd
  scripts (see `docs/adr/02-vscode-extension.md`).
- The Inspector extension's content script reads only `element.classList`
  and builds DOM via `createElement` + `textContent` (see
  `docs/adr/01-inspector-extension.md`).

---

## 7. Bug bounty

We do not currently operate a paid bug bounty program. We do offer:

- **Credit** in the CVE and release notes.
- **Swag** (RoyCSS stickers + t-shirt) for any accepted High/Critical
  report.
- **Hall of fame** listing on `/security/hall-of-fame` (TODO: page not
  yet built; tracked as a future ops task).

---

## 8. Changelog for this policy

| Date | Change |
|---|---|
| 2026-07-30 | Initial version (v1.0). |

---

## 9. References

- `docs/adr/security/DESIGN.md` — security architecture
- `docs/adr/security/ADR.md` — 5 ADRs
- `docs/adr/security/THREAT-MODEL.md` — STRIDE threats
- `docs/adr/security/IMPLEMENTATION-PLAN.md` — remediation plan
- `docs/adr/security/REVIEW-CHECKLIST.md` — 20 review items
- `security/CSP.md` — CSP recommendation deep-dive
- `security/CONTACT-FORM-SECURITY.md` — contact form audit
- `security/DEPENDENCY-AUDIT.md` — `bun audit` + dep summary
- `security/SBOM.json` — SPDX 2.3 SBOM
- `security/CHECKLIST.md` — pre-release checklist
- `docs/adr/07-security-supply-chain.md` — pre-existing cross-cutting ADR
- `docs/threat-models/07-security-supply-chain.md` — pre-existing STRIDE model
- Google Project Zero 90-day disclosure: <https://www.google.com/about/appsecurity/>
- GitHub Security Advisories: <https://docs.github.com/en/code-security/security-advisories>
- Sigstore / npm provenance: <https://docs.npmjs.com/generating-provenance-statements>
