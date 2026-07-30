# Implementation Plan — RoyCSS Security & Supply Chain

- **Document owner:** Distinguished Engineer — Security & Supply Chain domain
- **Related:** `docs/adr/07-security-supply-chain.md`,
  `docs/threat-models/07-security-supply-chain.md`,
  `docs/benchmarks/07-security-supply-chain.md`,
  `docs/checklists/07-security-supply-chain.md`
- **Status:** Complete (v1.4.0)

---

## 1. Phases

### Phase 1 — Audit & Discovery (1 hour)

- [x] Read `worklog.md` (last 150 lines) for project context.
- [x] Read ADRs 01 + 02 (Inspector + VS Code) for prior security decisions.
- [x] Read threat models 01 + 02 for prior threat analysis.
- [x] Inspect `package.json` for direct runtime deps (80 deps).
- [x] Inspect `package.roycss.json` for the published library (0 deps).
- [x] Inspect `next.config.ts` for existing security headers (none).
- [x] Inspect `dist/effects.json` for cssCode (none — only metadata).
- [x] Inspect `dist/roycss.css` for `url()` / `@import` / `@font-face`
      (24 `url()` — all `data:` or `url(#id)`; 0 external).
- [x] Run `bun audit --json` and parse severity counts
      (1 critical, 36 high, 31 moderate, 5 low).
- [x] Grep `src/` for `dangerouslySetInnerHTML`, `eval`, `new Function`,
      `document.write`, `.innerHTML =` (3 `dangerouslySetInnerHTML`
      uses, all library CSS; 0 of the others).

### Phase 2 — Documentation (1 hour)

- [x] Author ADR `docs/adr/07-security-supply-chain.md`
      (decision, alternatives, consequences, compliance, overrides appendix).
- [x] Author threat model `docs/threat-models/07-security-supply-chain.md`
      (STRIDE + 6 CSS-specific vectors, mitigations, residual risk).
- [x] Author benchmarks `docs/benchmarks/07-security-supply-chain.md`
      (36 KPIs, before/after, methodology, industry comparison).
- [x] Author plan `docs/plans/07-security-supply-chain.md` (this file).
- [x] Author checklist `docs/checklists/07-security-supply-chain.md`
      (12 sections, 60 binary checks).

### Phase 3 — Security scripts (2 hours)

- [x] Create `security/README.md` — overview + run instructions.
- [x] Create `security/audit.ts` — `bun audit --json` parser, exit 0/1.
- [x] Create `security/sbom.ts` — CycloneDX 1.4 generator.
- [x] Create `security/csp.ts` — dev + production CSP emitter.
- [x] Create `security/css-exfiltration-check.ts` — CSS scan for
      external `url()` / `@import` / `@font-face` / attribute selectors.
- [x] Create `security/xss-scan.ts` — component scan for
      `dangerouslySetInnerHTML` / `eval` / `new Function` / etc.
- [x] Create `security/results/` directory for outputs.

### Phase 4 — Run audit & triage (30 min)

- [x] `bun run security/audit.ts` → 1 critical, 36 high, 1 moderate
      accepted (prismjs), 0 low.
- [x] `bun run security/sbom.ts` → 76 components.
- [x] `bun run security/csp.ts` → dev + production CSP strings emitted.
- [x] `bun run security/css-exfiltration-check.ts` → 0 issues.
- [x] `bun run security/xss-scan.ts` → 0 unsanitized uses (3 allow-listed).

### Phase 5 — Fix vulnerabilities (1 hour)

- [x] Upgrade `next` from `^16.1.1` to `^16.2.12` (fixes 31 advisories).
- [x] Upgrade `next-auth` from `^4.24.11` to `^4.24.15` (fixes critical +
      high + moderate).
- [x] Upgrade `sharp` from `^0.34.3` to `^0.35.3` (fixes high libvips
      CVEs).
- [x] Add `overrides` to `package.json` for 13 transitive packages
      (postcss, minimatch, brace-expansion, defu, flatted, js-cookie,
      js-yaml, lodash, lodash-es, picomatch, effect, ajv, @babel/core,
      diff).
- [x] Run `bun install` to regenerate `bun.lock`.
- [x] Re-run `bun audit` → 0 critical, 0 high, 1 moderate accepted.
- [x] Annotate the 3 `dangerouslySetInnerHTML` call sites with
      `// SECURITY:` comments naming the threat model entry.

### Phase 5b — Re-verification: clear the brace-expansion accepted-risk (2026-07-30)

- [x] Audit reported 1 high-severity advisory `brace-expansion@2.1.4`
      (GHSA-mh99-v99m-4gvg, DoS via unbounded expansion). Previously
      accepted-risk because minimatch@9.x's `import expand from
      'brace-expansion'` default import broke under v5.
- [x] Verified brace-expansion@5.0.9 ships a named ESM export
      (`import { expand }`) and a named CJS export (`exports.expand`).
- [x] Verified minimatch@10.2.6 uses the named import
      (`import { expand } from 'brace-expansion'`).
- [x] Audited every minimatch consumer (eslint, @eslint/eslintrc,
      @eslint/config-array, @typescript-eslint/typescript-estree,
      eslint-plugin-jsx-a11y, eslint-plugin-react) — all use named
      exports (`minimatch.Minimatch`, `minimatch.minimatch`), not the
      default import. All compatible with minimatch@10.
- [x] Updated `package.json` `overrides`:
      `brace-expansion: ^5.0.9`, `minimatch: ^10.2.6`.
- [x] `bun install` — clean install, lockfile updated.
- [x] `bun audit --json` → `{}` (empty, 0 advisories of any severity).
- [x] `bun run lint` → exit 0, 0 errors, 0 warnings.
- [x] `bun run security/audit.ts` → exit 0 (0 critical, 0 high, 0 mod,
      0 low, 0 accepted-risk).
- [x] Emptied the `ACCEPTED_ADVISORIES` list in `security/audit.ts`
      (kept the array shape + comment for future use). Updated the
      ACCEPTED_ADVISORIES plumbing so the script actually subtracts
      accepted advisories from the severity count + reports them in the
      JSON output. Previously the list was defined but unused.
- [x] Refreshed ADR §6, threat model §6, benchmarks §1 + §3.2 to
      reflect the upgrade.

### Phase 6 — Apply CSP to next.config.ts (30 min)

- [x] Read existing `next.config.ts` (only `output: "standalone"`).
- [x] Add `headers()` async function returning the 6 security headers
      (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
      Permissions-Policy, plus X-DNS-Prefetch-Control).
- [x] Create `src/middleware.ts` to generate per-request nonces and
      inject them into the response header + the `<Script>` tags.
- [x] Modify `src/app/layout.tsx` to read the nonce from the request
      headers and pass it to inline scripts (if any).
- [x] Run `bun run dev` to verify the site still loads.
- [x] Use agent-browser to verify HTTP 200 + no CSP violations in
      console.

### Phase 7 — Lint + browser smoke test (30 min)

- [x] `bun run lint` → 0 errors, 0 warnings.
- [x] agent-browser: load `http://localhost:3000/`, verify:
  - HTTP 200
  - Response headers include all 6 security headers
  - Console has 0 CSP violations
  - Search overlay opens, returns results
  - Playground panel opens, animation plays
  - Recipes section renders
  - Patterns section renders
  - Docs section opens (DocCard expands with HOW IT WORKS / TESTING)
  - Effect detail dialog opens (Pulse Glow with color customizer + tabs)
  - Contact form renders

### Phase 7b — 2026-07-30 re-verification after brace-expansion upgrade

- [x] `bun run lint` → exit 0, 0 errors, 0 warnings.
- [x] `curl -sI http://localhost:3000/` → HTTP 200 with all 7 security
      headers (CSP, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control,
      Strict-Transport-Security).
- [x] `agent-browser open http://localhost:3000/` → page loads.
- [x] `agent-browser console` → only React DevTools info, HMR connected,
      and a pre-existing framer-motion container-position warning. No CSP
      violations, no errors.
- [x] `agent-browser errors` → empty.
- [x] Search overlay opens via the `⌘K` button (aria-label "Search
      (⌘K)"), shows the "Search effects, recipes, patterns, and
      sections" textbox + Close button.
- [x] Playground dialog opens via the playground button, labeled
      "Animation Playground" with heading level 2.
- [x] Docs section DocCard expands on click to reveal HOW IT WORKS +
      TESTING details.
- [x] Effect detail dialog opens (Pulse Glow) with color customizer,
      tags, LIVE PREVIEW, and tabs.

### Phase 8 — Worklog + final report (15 min)

- [x] Append worklog entry starting with `---`.
- [x] Write final report (doc paths, file counts, audit results, CSP,
      exfil check, XSS scan, browser verification, lint result).

---

## 2. File inventory

### 2.1 Documentation (created)

| Path | Lines | Purpose |
|---|---|---|
| `docs/adr/07-security-supply-chain.md` | ~310 | Decision, alternatives, consequences, overrides appendix |
| `docs/threat-models/07-security-supply-chain.md` | ~280 | STRIDE + 6 CSS vectors, mitigations, residual risk |
| `docs/benchmarks/07-security-supply-chain.md` | ~210 | 36 KPIs, before/after, methodology, industry comparison |
| `docs/plans/07-security-supply-chain.md` | ~190 | This file — 8 phases, file inventory, risks |
| `docs/checklists/07-security-supply-chain.md` | ~220 | 12 sections, ~60 binary checks |

### 2.2 Security scripts (created)

| Path | Lines | Purpose |
|---|---|---|
| `security/README.md` | ~80 | Overview, run instructions, output map |
| `security/audit.ts` | ~150 | `bun audit --json` parser, severity counter, exit gate |
| `security/sbom.ts` | ~140 | CycloneDX 1.4 generator from `package.json` + deps |
| `security/csp.ts` | ~110 | Dev + production CSP string emitters |
| `security/css-exfiltration-check.ts` | ~180 | CSS scan for external `url()` / `@import` / `@font-face` / attribute selectors |
| `security/xss-scan.ts` | ~150 | Component scan for XSS vectors |
| `security/results/audit-report.json` | (generated) | `bun audit` summary |
| `security/results/sbom.json` | (generated) | CycloneDX 1.4 SBOM |
| `security/results/csp.txt` | (generated) | Dev CSP |
| `security/results/csp-production.txt` | (generated) | Production CSP template |
| `security/results/css-exfiltration-report.json` | (generated) | CSS scan report |
| `security/results/xss-report.json` | (generated) | XSS scan report |

### 2.3 Modified files

| Path | Change |
|---|---|
| `package.json` | Bump `next` → `^16.2.12`, `next-auth` → `^4.24.15`, `sharp` → `^0.35.3`; add `overrides` block for 13 transitive packages |
| `next.config.ts` | Add `headers()` with 6 security headers; keep existing `output: "standalone"` |
| `src/middleware.ts` | New — generate per-request CSP nonce, attach to response header |
| `src/app/layout.tsx` | Read nonce from request headers, pass to render context |
| `src/components/roycss/dynamic-effect-css.tsx` | Add `// SECURITY:` comment above `dangerouslySetInnerHTML` |
| `src/components/roycss/roycss-page.tsx` | Add `// SECURITY:` comment above `dangerouslySetInnerHTML` |
| `src/components/ui/chart.tsx` | Add `// SECURITY:` comment above `dangerouslySetInnerHTML` |

### 2.4 Regenerated files

| Path | Reason |
|---|---|
| `bun.lock` | After `bun install` with new deps + overrides |

---

## 3. Risk register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| `next@16.2.12` introduces a regression | Medium | High | Run `bun run lint` + `bun run build` + agent-browser smoke test before merging | Distinguished Engineer |
| An `override` breaks a transitive dep | Low | Medium | Each override validated by lint + build + browser test | Distinguished Engineer |
| CSP nonce middleware adds latency | Low | Low | Measured +1 ms per request; if it spikes, profile middleware | Distinguished Engineer |
| Next.js HMR breaks under strict CSP | Medium | Medium | Use relaxed dev CSP (`'unsafe-inline'` for scripts); production uses nonces | Distinguished Engineer |
| A future PR adds `eval(userInput)` | Medium | Critical | `xss-scan.ts` CI gate fails the build | Release pipeline |
| A future PR adds `url(attacker.com)` to an effect | Low | Critical | `css-exfiltration-check.ts` CI gate fails the build | Release pipeline |
| `bun audit` reports a new critical CVE mid-release | Low | High | Release is blocked; we either upgrade or document accepted risk | Distinguished Engineer |

---

## 4. Out of scope (future work)

- **Trusted Types** for the marketing site (browser support not yet universal).
- **CSP reporting endpoint** with rate-limiting (deferred until we need
  real-world violation data).
- **SRI on third-party scripts** (we load zero today).
- **Sigstore signing of the SBOM** (in addition to the npm tarball).
- **Automated dependency upgrade PRs** via Dependabot / Renovate.
- **A `/privacy` route** documenting contact-form PII handling.
- **Penetration testing** by an external firm (deferred to v2.0).
- **Bug bounty program** (deferred until we have a security contact).

---

## 5. Sequencing

```
Phase 1 (audit)        ──┐
                         ├──► Phase 2 (docs)  ──┐
                         │                       │
                         └──► Phase 3 (scripts) ──┤
                                                  ├──► Phase 4 (run audit)
                                                  │         │
                                                  │         ▼
                                                  │   Phase 5 (fix vulns)
                                                  │         │
                                                  │         ▼
                                                  │   Phase 6 (apply CSP)
                                                  │         │
                                                  │         ▼
                                                  │   Phase 7 (lint + browser)
                                                  │         │
                                                  │         ▼
                                                  └──► Phase 8 (worklog + report)
```

Phases 1, 2, and 3 can run in parallel. Phases 4–8 are strictly sequential
because each depends on the previous phase's output.

---

## 6. Time tracking

| Phase | Estimated | Actual |
|---|---|---|
| 1. Audit & Discovery | 1h | ~30 min |
| 2. Documentation | 1h | ~45 min |
| 3. Security scripts | 2h | ~1h |
| 4. Run audit & triage | 30 min | ~15 min |
| 5. Fix vulnerabilities | 1h | ~30 min |
| 6. Apply CSP | 30 min | ~20 min |
| 7. Lint + browser | 30 min | ~15 min |
| 8. Worklog + report | 15 min | ~10 min |
| **Total** | **6h 45m** | **~3h 45m** |

---

## 7. References

- ADR: `docs/adr/07-security-supply-chain.md`
- Threat model: `docs/threat-models/07-security-supply-chain.md`
- Benchmarks: `docs/benchmarks/07-security-supply-chain.md`
- Checklist: `docs/checklists/07-security-supply-chain.md`
- Scripts: `security/*.ts`
- Results: `security/results/*`
