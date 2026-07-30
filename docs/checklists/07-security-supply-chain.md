# Review Checklist — RoyCSS Security & Supply Chain

- **Document owner:** Distinguished Engineer — Security & Supply Chain domain
- **Use:** Run this checklist before every release that touches
  `package.json`, `next.config.ts`, `src/middleware.ts`, any file under
  `security/`, or any file under `src/components/**/*.tsx` that adds
  `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, or
  `document.write`.
- **Related:** `docs/adr/07-security-supply-chain.md`,
  `docs/threat-models/07-security-supply-chain.md`,
  `docs/benchmarks/07-security-supply-chain.md`,
  `docs/plans/07-security-supply-chain.md`

---

## 1. Dependency posture

- [ ] `package.roycss.json` `dependencies` is `{}` or absent (zero runtime deps for the publishable library).
  ```bash
  node -e "console.log(JSON.stringify(require('./package.roycss.json').dependencies || {}))"
  # Expected: {}
  ```
- [ ] `vscode-extension/package.json` `dependencies` is `{}` or absent.
- [ ] `inspector/manifest.json` declares no `externally_connectable`.
- [ ] `cli/package.json` `dependencies` is `{}` or absent.
- [ ] `mcp-server/package.json` `dependencies` is `{}` or absent (or lists only the MCP SDK, which is bundled).
- [ ] No dep in `package.json` `dependencies` has a `postinstall`, `preinstall`, `install`, or `prepare` script.
  ```bash
  for d in $(node -e "console.log(Object.keys(require('./package.json').dependencies).join('\n'))"); do
    node -e "const p=require('./node_modules/$d/package.json'); if (p.scripts && (p.scripts.postinstall || p.scripts.preinstall || p.scripts.install || p.scripts.prepare)) { console.log('FAIL: $d has install lifecycle script'); process.exit(1); }"
  done
  ```
- [ ] `bun.lock` is committed and reproducible (`bun install` produces no diff).

## 2. `bun audit`

- [ ] `bun run security/audit.ts` exits 0.
- [ ] `security/results/audit-report.json` has `summary.critical === 0`.
- [ ] `security/results/audit-report.json` has `summary.high === 0`.
- [ ] Any `moderate` or `low` advisory is documented in `docs/threat-models/07-security-supply-chain.md` §6 (residual risk).
- [ ] `bun audit` CLI output (not just the JSON) shows 0 advisories.
- [ ] If `security/audit.ts` `ACCEPTED_ADVISORIES` is non-empty, every
      entry has an `id`, `package`, `reason`, and `threatModelRef`, AND
      the threat model §6 references the advisory back. (As of
      2026-07-30 the list is empty — every previously-accepted CVE has
      been resolved by an upgrade or override.)

## 3. SBOM

- [ ] `bun run security/sbom.ts` exits 0.
- [ ] `security/results/sbom.json` is valid CycloneDX 1.4:
  ```bash
  node -e "const b=require('./security/results/sbom.json'); console.assert(b.bomFormat==='CycloneDX'); console.assert(b.specVersion==='1.4'); console.assert(Array.isArray(b.components)); console.log('components:', b.components.length);"
  ```
- [ ] Every component has `name`, `version`, `type`, `bom-ref`, `purl`, and `licenses` fields.
- [ ] SBOM is regenerated on every release (file mtime > last release tag).

## 4. CSP

- [ ] `bun run security/csp.ts` exits 0.
- [ ] `security/results/csp.txt` (dev) contains `script-src 'self' 'unsafe-inline'`.
- [ ] `security/results/csp-production.txt` contains `script-src 'self' 'nonce-` and `'strict-dynamic'` and **does not** contain `unsafe-inline` for scripts.
- [ ] `next.config.ts` `headers()` returns the production CSP header (with nonce placeholder).
- [ ] `src/middleware.ts` generates a 16-byte random nonce per request and sets it in the response header.
- [ ] `next.config.ts` `headers()` returns `X-Frame-Options: DENY`.
- [ ] `next.config.ts` `headers()` returns `X-Content-Type-Options: nosniff`.
- [ ] `next.config.ts` `headers()` returns `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `next.config.ts` `headers()` returns `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- [ ] Browser smoke test (agent-browser) confirms all 6 headers are present in the response.

## 5. CSS exfiltration

- [ ] `bun run security/css-exfiltration-check.ts` exits 0.
- [ ] `security/results/css-exfiltration-report.json` `issues` array is empty.
- [ ] `dist/roycss.css` has 0 `url(http`, `url(https`, `url(//` matches.
  ```bash
  grep -oE 'url\(\s*["\x27]?(https?:|//)' dist/roycss.css | wc -l
  # Expected: 0
  ```
- [ ] `dist/roycss.css` has 0 `@import` matches.
- [ ] `dist/roycss.css` has 0 `@font-face` rules with external `src: url(http…)`.
- [ ] `dist/roycss.css` has 0 attribute selectors (`[name^=]`, `[name$=]`, `[name*=]`) combined with `url()` in the same rule.
- [ ] All `url()` references in `dist/roycss.css` are `data:` URIs or `url(#id)` SVG fragment references.

## 6. XSS scan

- [ ] `bun run security/xss-scan.ts` exits 0.
- [ ] `security/results/xss-report.json` `unsanitized` array is empty.
- [ ] Every `dangerouslySetInnerHTML` in `src/components/**/*.tsx` has a `// SECURITY:` comment on the line above naming a threat model entry.
- [ ] 0 `eval(` calls in `src/**/*.{ts,tsx}`.
  ```bash
  rg -n "\beval\s*\(" src/ --type ts --type tsx
  # Expected: 0 matches
  ```
- [ ] 0 `new Function(` calls in `src/**/*.{ts,tsx}`.
- [ ] 0 `document.write` calls in `src/**/*.{ts,tsx}`.
- [ ] 0 `.innerHTML =` assignments in `src/**/*.{ts,tsx}`.

## 7. Middleware & nonces

- [ ] `src/middleware.ts` exports a default function with the Next.js middleware signature.
- [ ] The middleware runs on every request (`matcher` config covers all routes except `/_next/static/` and `/_next/images/`).
- [ ] The nonce is 16 bytes (32 hex chars) generated via `crypto.randomBytes(16)`.
- [ ] The nonce is set in the `Content-Security-Policy` response header.
- [ ] The nonce is **not** logged.
- [ ] The nonce is **not** persisted across requests (no global cache).
- [ ] The middleware does not block the request (it only adds headers).

## 8. Build & lint

- [ ] `bun run lint` exits 0 with 0 errors and 0 warnings.
- [ ] `bun run build` exits 0 (Next.js standalone build succeeds).
- [ ] `bun run build:package` exits 0 (the `roycss` npm package builds).
- [ ] No new TypeScript errors after dependency upgrades.

## 9. Browser smoke test

- [ ] `bun run dev` starts the dev server on port 3000.
- [ ] `curl -sI http://localhost:3000/` returns HTTP 200.
- [ ] `curl -sI http://localhost:3000/` includes `Content-Security-Policy`.
- [ ] `curl -sI http://localhost:3000/` includes `X-Frame-Options: DENY`.
- [ ] `curl -sI http://localhost:3000/` includes `X-Content-Type-Options: nosniff`.
- [ ] `curl -sI http://localhost:3000/` includes `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `curl -sI http://localhost:3000/` includes `Permissions-Policy`.
- [ ] agent-browser loads `http://localhost:3000/` with HTTP 200.
- [ ] Browser console has 0 CSP violation warnings.
- [ ] Search overlay opens, returns results for "glow".
- [ ] Playground panel opens, animation plays.
- [ ] Recipes section renders ≥ 1 recipe card.
- [ ] Patterns section renders ≥ 1 pattern card.
- [ ] Docs overlay opens, renders a markdown doc.
- [ ] Effect detail dialog opens (click any effect card).
- [ ] Contact form renders (no need to submit).
- [ ] Page scrolls smoothly, no layout shift.

## 10. Release pipeline

- [ ] `package.json` `publish:ci` script uses `npm publish --provenance --access public`.
- [ ] The release tag matches `package.json` `version`.
- [ ] The CHANGELOG has an entry for the new version.
- [ ] `security/results/sbom.json` is regenerated and committed alongside the release tag.
- [ ] `security/results/audit-report.json` shows 0 critical + 0 high at release time.
- [ ] All 5 security scripts (`audit`, `sbom`, `csp`, `css-exfiltration-check`, `xss-scan`) exit 0 in CI before `npm publish`.

## 11. Documentation

- [ ] ADR `docs/adr/07-security-supply-chain.md` exists and Status is `Accepted`.
- [ ] Threat model `docs/threat-models/07-security-supply-chain.md` exists and covers all 6 CSS-specific vectors.
- [ ] Benchmarks `docs/benchmarks/07-security-supply-chain.md` exists and lists every KPI in §1.
- [ ] Plan `docs/plans/07-security-supply-chain.md` exists and is up to date.
- [ ] This checklist exists and has been run end-to-end.
- [ ] `security/README.md` exists and documents how to run the scripts.
- [ ] Every `dangerouslySetInnerHTML` call site has a `// SECURITY:` comment that references a threat model entry by ID (e.g. `T5`).

## 12. Sign-off

| Reviewer | Role | Date | Status |
|---|---|---|---|
| Distinguished Engineer (Security & Supply Chain) | Author | 2025-02-04 | Accepted |
| Distinguished Engineer (Security & Supply Chain) | Re-verification | 2026-07-30 | Accepted — brace-expansion DoS cleared via minimatch@10 + brace-expansion@5.0.9 upgrade; ACCEPTED_ADVISORIES list is empty |
| Release Manager | Reviewer | TBD | Pending release |

---

## Quick run (one-liner)

```bash
cd /home/z/my-project && \
  bun run security/audit.ts && \
  bun run security/sbom.ts && \
  bun run security/csp.ts && \
  bun run security/css-exfiltration-check.ts && \
  bun run security/xss-scan.ts && \
  bun run lint && \
  echo "✅ All security gates passed."
```

All 5 scripts + lint must exit 0 before `npm publish`.
