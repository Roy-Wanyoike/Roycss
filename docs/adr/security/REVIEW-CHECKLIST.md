# Security Review Checklist — 20 items

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Purpose:** Pre-merge and pre-release security review. Each item is
  binary (pass/fail). Any fail blocks merge/release.
- **Related:** `security/CHECKLIST.md` (pre-release checklist, 20+ items,
  broader scope), `docs/adr/security/THREAT-MODEL.md`,
  `docs/checklists/07-security-supply-chain.md` (pre-existing 60-item checklist)

---

## How to use

- **Pre-merge (every PR):** items 1–10.
- **Pre-release (every `npm publish`):** items 1–20.

A fail on any item blocks the action. Document fails in the PR description
with a remediation plan and an accepted-risk reference (if applicable).

---

## Items

### 1. `bun audit` is clean (0 high, 0 critical)

```bash
cd /home/z/my-project && bun audit
```

- **Pass:** "No vulnerabilities found" OR `security/results/audit-report.json`
  shows `summary.critical === 0 && summary.high === 0`.
- **Fail:** any high or critical advisory not in the `ACCEPTED_ADVISORIES`
  array of `security/audit.ts`.

### 2. `bun run lint` is clean (0 errors)

```bash
cd /home/z/my-project && bun run lint
```

- **Pass:** `eslint .` exits 0.
- **Fail:** any error. (Warnings are allowed but should be tracked.)

### 3. `security/xss-scan.ts` passes (0 unsanitized `dangerouslySetInnerHTML`)

```bash
cd /home/z/my-project && bun run security:xss
```

- **Pass:** 0 unsanitized uses. Every `dangerouslySetInnerHTML` has a
  `// SECURITY:` comment naming the threat model entry that justifies it.
- **Fail:** any `dangerouslySetInnerHTML` without the comment, or any
  `eval(`, `new Function(`, `document.write`, `setTimeout(string)`.

### 4. `security/css-exfiltration-check.ts` passes (0 external `url()`)

```bash
cd /home/z/my-project && bun run security:css-exfil
```

- **Pass:** 0 external `url(http`, `url(https`, `url(//`, 0 `@import`, 0
  `@font-face` with external `src`, 0 attribute-selector + `url()` combos.
- **Fail:** any of the above.

### 5. CSP is present on every route (dev + prod)

- **Dev:** `next.config.ts` `headers()` sets `Content-Security-Policy` on
  `/:path*`.
- **Prod:** `src/middleware.ts` overrides with per-request nonce CSP.
- **Verify:** `curl -I https://roycss.com/` returns `content-security-policy`
  header. The dev policy includes `'unsafe-inline' 'unsafe-eval'` for
  `script-src`; the prod policy includes `nonce-` and `'strict-dynamic'`.

### 6. HSTS is set with preload

- **Header:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **Verify:** `curl -I https://roycss.com/` returns the header.
- **Pass:** max-age ≥ 63072000 (2 years), includeSubDomains present, preload
  present.

### 7. `frame-ancestors 'none'` and `X-Frame-Options: DENY` are both set

- **Why both:** `frame-ancestors` is CSP-level (modern); `X-Frame-Options`
  is legacy (IE11). Belt + suspenders.
- **Verify:** `curl -I` shows both headers.

### 8. No secrets in code or logs

- **Check:** `rg "process.env.NPM_TOKEN|process.env.GITHUB_TOKEN" src/`
  returns 0 hits (these are CI-only secrets).
- **Check:** `rg "console.log(process.env|console.log(body|console.log(req.body" src/`
  returns 0 hits.
- **Pass:** all hits are in `security/` (the audit scripts) or
  `scripts/publish/` (the publish flow), both of which are reviewed
  separately.

### 9. SBOM is regenerated and valid

```bash
cd /home/z/my-project && bun run security:sbom && node -e "require('./security/results/sbom.json')"
node -e "require('./security/SBOM.json')"
```

- **Pass:** both `security/results/sbom.json` (CycloneDX 1.4) and
  `security/SBOM.json` (SPDX 2.3) are valid JSON and contain the current
  `package.json` version.
- **Fail:** JSON parse error, or version mismatch with `package.json`.

### 10. No new direct runtime dep without checklist entry

- **Check:** `git diff main -- package.json` shows no new entries in
  `dependencies` without a corresponding entry in
  `docs/checklists/07-security-supply-chain.md` documenting the use case,
  license, and transitive dep count.
- **Pass:** every new dep has a checklist entry.
- **Fail:** any new dep without a checklist entry.

### 11. `npm publish --provenance` is the only publish command

- **Check:** `package.json` `publish:ci` script is
  `NPM_TOKEN=$NPM_TOKEN npm publish --provenance --access public`.
- **Check:** `scripts/publish/release.ts` calls `publish:ci` (not
  `publish` directly).
- **Pass:** both conditions met.
- **Fail:** any path that publishes without `--provenance`.

### 12. No `postinstall` scripts in Tier A artifacts

- **Tier A:** `package.roycss.json`, `vscode-extension/package.json`,
  `inspector/package.json`, `mcp-server/package.json`, `cli/package.json`.
- **Check:** none of these have a `scripts.postinstall` (or `preinstall`,
  `install`, `prepare`).
- **Pass:** all Tier A artifacts have zero install scripts.
- **Fail:** any Tier A artifact with an install script.

### 13. `bun.lock` is committed and matches `package.json`

- **Check:** `git status` shows `bun.lock` is tracked and not modified
  after `bun install`.
- **Pass:** `bun install` is a no-op (lockfile up to date).
- **Fail:** `bun install` modifies `bun.lock` (means `package.json` was
  changed without re-installing).

### 14. `overrides` in `package.json` matches ADR §6

- **Check:** `package.json` `overrides` field matches the table in
  `docs/adr/07-security-supply-chain.md` §6.
- **Pass:** every override is documented with a rationale.
- **Fail:** any override without a rationale, or any rationale without
  the override.

### 15. Contact form input validation is in place

- **Check:** `src/app/api/contact/route.ts` has:
  - JSON body parse with `.catch(() => null)`
  - Type check `typeof body === "object"`
  - Field-level validation (name, email, message required; email regex;
    message length ≥ 10)
  - Length truncation before Prisma write (`.slice(0, N)`)
- **Pass:** all 4 layers present.
- **Fail:** any layer missing.

### 16. Prisma queries are parameterized (no raw SQL)

- **Check:** `rg "prisma\.\$queryRaw|prisma\.\$executeRaw" src/` returns
  0 hits.
- **Pass:** all Prisma calls use the typed client (`db.contactMessage.create`,
  etc.).
- **Fail:** any `$queryRaw` or `$executeRaw` without a `// SECURITY:` comment
  justifying why raw SQL is needed and confirming the inputs are
  parameterized.

### 17. No `eval` / `new Function` / `document.write` / `setTimeout(string)`

- **Check:** `security/xss-scan.ts` covers all of these.
- **Pass:** 0 hits.
- **Fail:** any hit (the CI gate already enforces this).

### 18. `Referrer-Policy: strict-origin-when-cross-origin` is set

- **Verify:** `curl -I https://roycss.com/` returns the header.
- **Pass:** header present with the exact value.

### 19. `Permissions-Policy` disables unused device APIs

- **Verify:** `curl -I https://roycss.com/` returns
  `permissions-policy: camera=(), microphone=(), geolocation=()`.
- **Pass:** all three APIs disabled.
- **Fail:** any API not disabled, or any new API added to the site without
  being added to the `Permissions-Policy` allowlist.

### 20. Threat model is reviewed and up-to-date

- **Check:** `docs/adr/security/THREAT-MODEL.md` `Last reviewed` date is
  within the last 6 months, OR a major change has been made that warrants
  re-review (new direct dep, new CSP directive, new auth surface, new
  external service).
- **Pass:** date is recent or a review note explains why it's still
  current.
- **Fail:** date is stale (>6 months) and no review note exists.

---

## Pre-release additional checks (items 21–25, from `security/CHECKLIST.md`)

For the full pre-release checklist (25+ items), see `security/CHECKLIST.md`.
Items 21–25 below are a summary; the full list lives in `security/CHECKLIST.md`.

21. `npm audit signatures` shows valid Sigstore signatures on the
    published tarball.
22. CHANGELOG.md documents the version bump and any security-relevant
    changes.
23. git tag `vX.Y.Z` matches `package.json` `version`.
24. GitHub Release is created from the tag, with the SBOM attached.
25. `bun run security:all` exits 0 (all 5 audit scripts pass).

---

## Sign-off

| Reviewer | Role | Date | Items passed |
|---|---|---|---|
| Security agent | Security Engineering | 2026-07-30 | 1–20 (item 15 has HIGH-priority gap R-1; see THREAT-MODEL.md) |
| | | | |
| | | | |

---

## References

- `docs/adr/security/THREAT-MODEL.md` — STRIDE threats and gaps
- `docs/adr/security/IMPLEMENTATION-PLAN.md` — remediation plan for R-1 through R-6
- `security/CHECKLIST.md` — pre-release checklist (25+ items)
- `docs/checklists/07-security-supply-chain.md` — pre-existing 60-item checklist
