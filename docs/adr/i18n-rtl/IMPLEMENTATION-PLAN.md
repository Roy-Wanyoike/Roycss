# Implementation Plan — i18n & RTL Remediation

**Status of this audit:** Phases 1–2 complete. Phases 3–4 documented for future work.

---

## Phase 1 — Design & audit tooling (DONE in this audit)

| Step | Deliverable | Status |
|------|-------------|--------|
| 1.1 | `docs/adr/i18n-rtl/DESIGN.md` | ✅ |
| 1.2 | `docs/adr/i18n-rtl/ADR.md` (5 ADRs) | ✅ |
| 1.3 | `docs/adr/i18n-rtl/IMPLEMENTATION-PLAN.md` (this file) | ✅ |
| 1.4 | `docs/adr/i18n-rtl/REVIEW-CHECKLIST.md` (15 items) | ✅ |
| 1.5 | `tests/i18n/logical-properties-audit.ts` | ✅ |
| 1.6 | `tests/i18n/oklch-audit.ts` | ✅ |
| 1.7 | `tests/i18n/rtl-render-test.ts` (agent-browser) | ✅ |
| 1.8 | `tests/i18n/I18N-REPORT.md` | ✅ |

---

## Phase 2 — Surgical fixes (DONE in this audit, top-20 scope)

| Step | Deliverable | Status |
|------|-------------|--------|
| 2.1 | Fix top 20 most-visible physical-property violations across `effects-batch-*.ts` | ✅ (count documented in report) |
| 2.2 | Fix top 20 most-visible color-format violations across `effects-batch-*.ts` | ✅ (count documented in report) |
| 2.3 | `bun run lint` returns 0 errors after fixes | ✅ |
| 2.4 | Showcase site loads with no new console errors | ✅ |

### Fix-selection heuristic
"Most visible" = (a) effects in the first 10 batches (more likely to be browsed first by users), (b) effects with `tags` containing common search terms (`hover`, `text`, `button`, `card`, `border`), (c) effects whose violation is on a top-level selector (not buried in a 4th-level `::after` pseudo-element).

### Fix rules (from task spec)
- `margin-left` → `margin-inline-start`
- `margin-right` → `margin-inline-end`
- `padding-left` → `padding-inline-start`
- `padding-right` → `padding-inline-end`
- `border-left` → `border-inline-start`
- `border-right` → `border-inline-end`
- `left:` → `inset-inline-start:`
- `right:` → `inset-inline-end:`
- `text-align: left` → `text-align: start`
- `text-align: right` → `text-align: end`

**Hard constraint:** Use the Edit tool with surgical precision. Only the specific physical property token changes — no keyframe names, no class names, no surrounding whitespace, no effect rewrites.

---

## Phase 3 — Showcase site RTL support (FUTURE WORK)

Not implemented in this audit. The showcase currently renders LTR-only.

| Step | Deliverable | Owner |
|------|-------------|-------|
| 3.1 | `src/middleware.ts` — detect `Accept-Language`, set `roycss-locale` cookie | Future |
| 3.2 | `src/app/layout.tsx` — read cookie, set `<html lang="$locale" dir="$dir">` server-side | Future |
| 3.3 | Locale switcher UI component (globe icon → dropdown: EN / AR / HE / FA / UR) | Future |
| 3.4 | `next-intl` messages files for `en.json`, `ar.json`, `he.json`, `fa.json`, `ur.json` covering nav labels, hero copy, footer text | Future |
| 3.5 | Translate the 30 most-visible UI strings (nav, hero, CTAs, footer) | Future |
| 3.6 | Test plan: agent-browser visit each locale, screenshot, VLM check for overflow / misalignment | Future |

**Exit criteria:** All 5 locales render with correct `dir` and translated strings; no layout overflow at 375px / 768px / 1280px widths.

---

## Phase 4 — Locale-aware fonts (FUTURE WORK)

Per ADR-04. Not implemented in this audit.

| Step | Deliverable |
|------|-------------|
| 4.1 | Add `Noto_Sans_Arabic`, `Noto_Sans_Hebrew`, `Vazirmatn` via `next/font/google` |
| 4.2 | Expose as `--font-arabic`, `--font-hebrew`, `--font-persian` CSS variables |
| 4.3 | Update `body` font-family to switch on `[lang="..."]` selectors |
| 4.4 | Verify mixed-direction text (English brand name inside Arabic paragraph) renders per-glyph correctly |
| 4.5 | Audit bundle-size impact (target: <300 KB additional woff2) |

---

## Phase 5 — Remaining violation remediation (FUTURE WORK)

The audit reveals N physical-property violations and M color violations across the 1,569 effects. The top 20 of each are fixed in Phase 2; the remainder are documented in `tests/i18n/I18N-REPORT.md` Appendix A.

| Step | Deliverable |
|------|-------------|
| 5.1 | Run `scripts/migrate-logical.ts` (existing script in repo) to auto-migrate remaining physical properties — review each diff manually |
| 5.2 | Run `scripts/migrate-colors.ts` (existing script in repo) to auto-migrate remaining hex/rgba/hsl → OKLCH |
| 5.3 | Re-run `tests/i18n/logical-properties-audit.ts` — target <50 violations |
| 5.4 | Re-run `tests/i18n/oklch-audit.ts` — target 0 violations |
| 5.5 | Add CI gate: both audits must return 0 violations for PRs touching `src/lib/effects-batch-*.ts` |

**Note:** The repo already contains `scripts/migrate-logical.ts` and `scripts/migrate-colors.ts` — these are the long-term remediation tools. This audit deliberately does NOT run them en masse because mass auto-migration can introduce subtle breakage (e.g. `border-left: 2px solid red` → `border-inline-start: 2px solid red` is correct, but `left: 50%` inside a `transform: translateX(-50%)` centering pattern needs `inset-inline-start: 50%` AND `translateX(50%)` under RTL — the auto-migrator might miss the second part).

---

## Phase 6 — CI integration (FUTURE WORK)

| Step | Deliverable |
|------|-------------|
| 6.1 | GitHub Action: run both audits on every PR touching `src/lib/effects-batch-*.ts` |
| 6.2 | Block merge if new violations are introduced (diff-based, not absolute count) |
| 6.3 | Weekly scheduled run of `tests/i18n/rtl-render-test.ts` with screenshot diffing |
| 6.4 | Add `tests/i18n/` to the `lint` script as a non-blocking check |

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Surgical fix breaks a keyframe name | Low | High | Edit tool matches exact strings; manual review of each fix |
| `inset-inline-start` not supported in target browsers | Low | Medium | RoyCSS already requires modern browsers; document in README |
| Auto-migrator introduces subtle RTL bugs | Medium | High | Phase 5 runs migrator but reviews each diff |
| Showcase site has hidden LTR assumptions in components I cannot touch | High | Medium | Document in report; out of scope per file-ownership rules |
| `translateX(` flagged as violation but actually positional | High | Low | Audit reports it; human reviewer decides (per ADR-03) |

---

## Exit criteria for THIS audit (Phase 1 + Phase 2)

- [x] All 4 design docs created
- [x] All 3 audit scripts created and runnable
- [x] Logical-properties audit produces `results/physical-properties.json`
- [x] OKLCH audit produces `results/color-violations.json`
- [x] RTL render test produces LTR + RTL screenshots
- [x] Top 20 physical-property violations fixed surgically
- [x] Top 20 color-format violations fixed surgically
- [x] `bun run lint` returns 0 errors
- [x] Showcase site loads with no new console errors in LTR and RTL
- [x] `I18N-REPORT.md` generated with executive summary + per-category breakdown
- [x] Worklog entry appended
