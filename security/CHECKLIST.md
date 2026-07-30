# Pre-Release Security Checklist — RoyCSS

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Purpose:** Pre-release checklist for every `npm publish` of the
  `roycss` package, every deploy of the marketing site, and every
  release of the VS Code extension / Chrome Inspector / CLI / MCP server.
- **Related:** `docs/adr/security/REVIEW-CHECKLIST.md` (20-item pre-merge
  review checklist), `docs/checklists/07-security-supply-chain.md`
  (pre-existing 60-item checklist),
  `security/SECURITY-POLICY.md`, `security/DEPENDENCY-AUDIT.md`

---

## How to use

Run this checklist before every release. Every item must be ✅. Items
that are ❌ block the release. Items that are N/A must be explained.

**Release engineer:** ____________________  **Date:** ____________

**Release version:** ____________________  **Artifact(s):** ____________

---

## 1. Dependency audit (5 items)

- [ ] **1.1** `bun audit` reports 0 high, 0 critical vulnerabilities.
  ```bash
  cd /home/z/my-project && bun audit
  ```
  - ✅ "No vulnerabilities found"
  - ❌ Any high/critical advisory not in `ACCEPTED_ADVISORIES`

- [ ] **1.2** `bun run security:audit` exits 0 and writes a fresh
      `security/results/audit-report.json`.
  ```bash
  cd /home/z/my-project && bun run security:audit
  ```
  - ✅ Exit 0, `summary.critical === 0 && summary.high === 0`
  - ❌ Exit 1 (any high/critical)

- [ ] **1.3** `bun.lock` is committed and `bun install` is a no-op
      (no lockfile changes).
  ```bash
  cd /home/z/my-project && bun install
  git status -- bun.lock
  ```
  - ✅ `bun.lock` not modified
  - ❌ `bun.lock` modified (means `package.json` changed without re-installing)

- [ ] **1.4** No new direct runtime dep in `package.json` without a
      checklist entry in `docs/checklists/07-security-supply-chain.md`.
  ```bash
  cd /home/z/my-project && git diff main -- package.json
  ```
  - ✅ Every new dep in `dependencies` has a corresponding checklist entry
  - ❌ Any new dep without a checklist entry

- [ ] **1.5** `overrides` in `package.json` matches the table in
      `docs/adr/07-security-supply-chain.md` §6 (no drift).
  - ✅ Every override documented with rationale
  - ❌ Any override without rationale, or any rationale without override

---

## 2. SBOM (3 items)

- [ ] **2.1** `security/results/sbom.json` (CycloneDX 1.4) is regenerated
      and valid JSON.
  ```bash
  cd /home/z/my-project && bun run security:sbom && node -e "require('./security/results/sbom.json')"
  ```
  - ✅ Valid JSON, `metadata.component.version` matches `package.json`
  - ❌ JSON parse error, or version mismatch

- [ ] **2.2** `security/SBOM.json` (SPDX 2.3) is regenerated and valid JSON.
  ```bash
  cd /home/z/my-project && node -e "const s = require('./security/SBOM.json'); console.log(s.spdxVersion, s.packages.length)"
  ```
  - ✅ `SPDX-2.3`, ≥82 packages, root package version matches `package.json`
  - ❌ JSON parse error, or version mismatch

- [ ] **2.3** Both SBOMs are attached to the GitHub Release as build
      artifacts.
  - ✅ Both files attached
  - ❌ Either file missing

---

## 3. CSP and security headers (5 items)

- [ ] **3.1** `security/csp.ts` exits 0 and writes fresh
      `security/results/csp.txt` (dev) and `csp-production.txt` (prod).
  ```bash
  cd /home/z/my-project && bun run security:csp
  ```
  - ✅ Both files written, exit 0
  - ❌ Either file missing, or exit ≠ 0

- [ ] **3.2** `next.config.ts` `securityHeaders` array includes all of:
      `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`,
      `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
  - ✅ All 8 headers present
  - ❌ Any header missing

- [ ] **3.3** `src/middleware.ts` generates a per-request nonce and
      overrides the dev CSP in production with
      `script-src 'self' 'nonce-{nonce}' 'strict-dynamic'`.
  - ✅ Nonce generated via `crypto.getRandomValues(16)`, prod CSP overrides dev
  - ❌ Nonce missing, or prod CSP not overriding dev

- [ ] **3.4** Agent-browser smoke test verifies the CSP header is present
      on `https://roycss.com/` and contains `nonce-` + `'strict-dynamic'`.
  - ✅ Both substrings present in the response header
  - ❌ Either missing

- [ ] **3.5** No CSP violations in the browser console during the smoke
      test.
  - ✅ Zero violations
  - ❌ Any violation (block the release; investigate)

---

## 4. XSS and CSS exfiltration (3 items)

- [ ] **4.1** `security/xss-scan.ts` exits 0 (0 unsanitized
      `dangerouslySetInnerHTML`).
  ```bash
  cd /home/z/my-project && bun run security:xss
  ```
  - ✅ Exit 0, 0 unsanitized uses
  - ❌ Exit 1 (any `dangerouslySetInnerHTML` without `// SECURITY:`, or any
    `eval`/`new Function`/`document.write`)

- [ ] **4.2** `security/css-exfiltration-check.ts` exits 0 (0 external
      `url()`, 0 `@import`, 0 `@font-face` external `src`, 0 attribute-
      selector + `url()` combos).
  ```bash
  cd /home/z/my-project && bun run security:css-exfil
  ```
  - ✅ Exit 0, 0 issues
  - ❌ Exit 1 (any external `url()`, `@import`, etc.)

- [ ] **4.3** No `eval`, `new Function`, `document.write`, or
      `setTimeout(string)` in `src/`.
  ```bash
  cd /home/z/my-project && rg "eval\(|new Function\(|document\.write|setTimeout\(['\"]" src/ --type ts --type tsx
  ```
  - ✅ 0 hits
  - ❌ Any hit (the CI gate already enforces this, but double-check)

---

## 5. Lint and build (3 items)

- [ ] **5.1** `bun run lint` exits 0 (0 errors).
  ```bash
  cd /home/z/my-project && bun run lint
  ```
  - ✅ Exit 0
  - ❌ Any error

- [ ] **5.2** `bun run build` succeeds (Next.js build).
  ```bash
  cd /home/z/my-project && bun run build
  ```
  - ✅ Build succeeds, `.next/standalone/` exists
  - ❌ Build fails

- [ ] **5.3** `bun run build:package` succeeds (npm package build).
  ```bash
  cd /home/z/my-project && bun run build:package
  ```
  - ✅ `dist/roycss.min.css`, `dist/effects.json`, `dist/effects.js` exist
  - ❌ Any file missing

---

## 6. Supply chain (4 items)

- [ ] **6.1** `npm publish --provenance --access public` is the only
      publish command (in `package.json` `publish:ci` and
      `scripts/publish/release.ts`).
  - ✅ Both call `publish:ci` with `--provenance --access public`
  - ❌ Any path that publishes without `--provenance`

- [ ] **6.2** After publish, `npm audit signatures` shows a valid
      Sigstore signature.
  ```bash
  npm audit signatures@roycss@<version>
  ```
  - ✅ Valid signature
  - ❌ No signature, or signature invalid

- [ ] **6.3** Git tag `vX.Y.Z` matches `package.json` `version`.
  ```bash
  cd /home/z/my-project && git describe --tags
  ```
  - ✅ Tag matches version
  - ❌ Tag missing, or version mismatch

- [ ] **6.4** `CHANGELOG.md` documents the version bump and any
      security-relevant changes.
  - ✅ Entry exists for the version
  - ❌ No entry

---

## 7. Contact form (3 items)

- [ ] **7.1** Contact form input validation is in place (4 layers:
      JSON parse, type check, field validation, length truncation).
  - File: `src/app/api/contact/route.ts`
  - ✅ All 4 layers present
  - ❌ Any layer missing

- [ ] **7.2** Prisma queries are parameterized (no raw SQL).
  ```bash
  cd /home/z/my-project && rg "prisma\.\$queryRaw|prisma\.\$executeRaw" src/
  ```
  - ✅ 0 hits (or hits have `// SECURITY:` comment justifying raw SQL)
  - ❌ Any unjustified hit

- [ ] **7.3** No PII in logs (`console.log(body)`, `console.log(req.body)`,
      `console.log(process.env)`, etc.).
  ```bash
  cd /home/z/my-project && rg "console\.log\(body|console\.log\(req\.body|console\.log\(process\.env" src/
  ```
  - ✅ 0 hits
  - ❌ Any hit

---

## 8. Tier A artifacts (4 items)

(For npm package, VS Code ext, Inspector, CLI, MCP server)

- [ ] **8.1** Tier A artifacts have **zero runtime dependencies**
      (`dependencies: {}` in their `package.json`).
  - Files: `package.roycss.json`, `vscode-extension/package.json`,
    `inspector/package.json`, `mcp-server/package.json`,
    `cli/package.json`
  - ✅ All have `dependencies: {}` or absent
  - ❌ Any runtime dep

- [ ] **8.2** No `postinstall`, `preinstall`, `install`, or `prepare`
      scripts in Tier A artifacts.
  - ✅ None of these scripts in any Tier A package.json
  - ❌ Any of these scripts

- [ ] **8.3** VS Code extension's webview CSP is `default-src 'none'` +
      nonce'd scripts.
  - File: `vscode-extension/src/extension.ts` (webview HTML)
  - ✅ CSP present, no `unsafe-inline`
  - ❌ `unsafe-inline` present, or CSP missing

- [ ] **8.4** Inspector extension's content script uses only
      `createElement` + `textContent` (no `innerHTML`).
  - File: `inspector/src/content.ts`
  - ✅ 0 `innerHTML` uses
  - ❌ Any `innerHTML` use

---

## 9. Documentation (2 items)

- [ ] **9.1** `docs/adr/security/THREAT-MODEL.md` `Last reviewed` date
      is within the last 6 months, OR a review note explains why it's
      still current.
  - ✅ Date recent, or review note present
  - ❌ Date stale, no review note

- [ ] **9.2** `security/SECURITY-POLICY.md` contact email is valid and
      monitored.
  - ✅ Email responds within 24h (verified by sending a test email)
  - ❌ Email bounces, or no response within 24h

---

## 10. Sign-off

- [ ] **10.1** All items above are ✅ or N/A (with explanation).
- [ ] **10.2** Release engineer has signed off.
- [ ] **10.3** (For Critical/High severity fixes) Security domain agent
      has signed off.

---

## Summary

| Section | Items | Required to pass |
|---|---|---|
| 1. Dependency audit | 5 | All ✅ |
| 2. SBOM | 3 | All ✅ |
| 3. CSP and security headers | 5 | All ✅ |
| 4. XSS and CSS exfiltration | 3 | All ✅ |
| 5. Lint and build | 3 | All ✅ |
| 6. Supply chain | 4 | All ✅ |
| 7. Contact form | 3 | All ✅ |
| 8. Tier A artifacts | 4 | All ✅ (or N/A if not releasing a Tier A artifact) |
| 9. Documentation | 2 | All ✅ |
| 10. Sign-off | 3 | All ✅ |
| **Total** | **35** | — |

---

## References

- `docs/adr/security/REVIEW-CHECKLIST.md` — 20-item pre-merge checklist
- `docs/checklists/07-security-supply-chain.md` — pre-existing 60-item checklist
- `security/SECURITY-POLICY.md` — responsible disclosure policy
- `security/DEPENDENCY-AUDIT.md` — dependency audit details
- `security/CSP.md` — CSP recommendation
- `security/CONTACT-FORM-SECURITY.md` — contact form audit
- `security/SBOM.json` — SPDX 2.3 SBOM
- `security/results/sbom.json` — CycloneDX 1.4 SBOM
- `security/results/audit-report.json` — `bun audit` report
- `scripts/publish/release.ts` — release pipeline
