# Checklist 05 — Performance Engineering

**Status:** Active · **Date:** 2026-07-30
**Use:** Run every item before merging a PR that touches `dist/`,
`src/lib/effects-batch-*.ts`, `src/components/roycss/virtual-scroll-grid.tsx`,
`src/components/roycss/dynamic-effect-css.tsx`, or `perf/`.

**Companion docs:** `docs/adr/05-performance-engineering.md`,
`docs/threat-models/05-performance-engineering.md`,
`docs/benchmarks/05-performance-engineering.md`,
`docs/plans/05-performance-engineering.md`.

---

## 1. Build artifacts

Verify `dist/` contains every required artifact and nothing extra.

```bash
ls -la dist/
```

- [ ] `dist/roycss.css` exists and is between 1.0 MB and 1.5 MB.
- [ ] `dist/roycss.min.css` exists and is between 900 KB and 1.1 MB.
- [ ] `dist/effects.json` exists and is between 400 KB and 700 KB.
- [ ] `dist/effects.js` exists and is < 10 KB.
- [ ] `dist/effects.cjs` exists and is < 10 KB.
- [ ] `dist/effects.d.ts` exists (TypeScript declarations).
- [ ] `dist/roycss-critical.css` exists and is < 80 KB (run
      `bun run perf/optimize/extract-critical-css.ts` if missing).
- [ ] No unexpected files in `dist/` (no `.map` files except
      `roycss.min.css.map`, no temp files, no `.DS_Store`).

```bash
# Quick size summary
wc -c dist/*
```

---

## 2. Benchmark harness

Run the full benchmark suite. The harness must exit 0 on `main` (after
Phase 2 fixes land). On a feature branch, the 3 known-issue failures
(duplicate @keyframes, color-mix count, modern-translucency count) are
acceptable — they are documented in `docs/benchmarks/05-performance-engineering.md`
§9. Any OTHER failure blocks the PR.

```bash
cd /home/z/my-project && bun run perf/benchmark.ts
```

- [ ] Harness runs without crashing (exit code 0 or 1, not 2).
- [ ] `perf/results/benchmark-report.json` is written and is valid JSON.
- [ ] `summary.total` is 36 (or higher if new benchmarks were added).
- [ ] `summary.fail` is exactly 3 (the known issues) on a clean branch.
      If higher, investigate the new failure.
- [ ] All `bundle-size/*` benchmarks pass.
- [ ] All `effect-count/*` benchmarks pass except the 3 known issues.
- [ ] All `css-injection/*` benchmarks pass.
- [ ] All `virtual-scroll/*` benchmarks pass.
- [ ] All `animation-jank/*` benchmarks pass.
- [ ] All `memory-footprint/*` benchmarks pass.

```bash
# Verify the JSON report
cat perf/results/benchmark-report.json | python3 -m json.tool | head -20
```

---

## 3. Regression tests

```bash
cd /home/z/my-project && bun test perf/regression.test.ts
```

- [ ] All 21 tests pass (19 outright + 2 `test.failing`).
- [ ] No new `test.failing` entries added without an ADR update.
- [ ] The 6 task-required tests all pass:
  - [ ] `dist/effects.json has exactly 1569 effects`
  - [ ] `dist/effects.json has exactly 20 categories`
  - [ ] `dist/roycss.css is < 1.5 MB`
  - [ ] `dist/roycss.min.css is < 1.1 MB`
  - [ ] `every effect has a non-empty cssCode`
  - [ ] `no effect uses raw #hex colors (except #fff/#000 in mask contexts)`
  - [ ] `no effect uses raw rgba() (must use color-mix)`

---

## 4. Lint

```bash
cd /home/z/my-project && bun run lint
```

- [ ] Exit code 0.
- [ ] 0 errors.
- [ ] 0 warnings.

---

## 5. Critical CSS

If the PR touches any effect's `cssCode` or the base CSS, rebuild the
critical CSS extract:

```bash
cd /home/z/my-project && bun run perf/optimize/extract-critical-css.ts
```

- [ ] Output says `Status: ✓ within budget` (size < 80 KB).
- [ ] `dist/roycss-critical.css` is regenerated.
- [ ] The header comment in the file reflects the new effect count (if
      changed) and the current date.
- [ ] No bare `#hex` colors in the file except in `mask:` / `-webkit-mask:`
      contexts.
- [ ] The file starts with the banner comment
      `/*! RoyCSS Critical CSS — auto-generated …`.

```bash
head -20 dist/roycss-critical.css
```

---

## 6. Effect additions

If the PR adds a new effect (or modifies an existing one):

- [ ] The effect's `cssCode` is non-empty.
- [ ] The effect's `cssCode` uses `oklch()` for all colors (no `#hex`
      except in `mask:` context, no `rgba()`, no `hsl()` except modern
      relative-color `hsl(from …)`).
- [ ] The effect's `cssCode` uses `color-mix(in oklch, …)` or
      `oklch(... / alpha)` for translucency — no `rgba()`.
- [ ] If the effect animates, it uses `@keyframes roy-<effect-id>` with
      a UNIQUE name (no duplicates with existing effects).
- [ ] The effect's animation properties are in
      `{transform, opacity, filter}` (GPU-friendly). If not, document
      why in the PR description.
- [ ] `prefers-reduced-motion` is respected (the global rule covers it,
      but if the effect uses pseudo-element animations, add a per-effect
      `@media (prefers-reduced-motion: reduce)` override).
- [ ] The effect's `cssCode` is < 2 KB. If larger, justify in the PR
      description (e.g., complex SVG background, multi-step animation).
- [ ] The effect is added to the correct batch file
      (`src/lib/effects-batch-N.ts`).
- [ ] The effect has a unique `id` (no duplicates with existing effects).
- [ ] The effect's `category` is one of the 20 valid `EffectCategory` values.
- [ ] The effect has at least 2 tags.

```bash
# Quick checks
rg -n "id: \"<new-effect-id>\"" src/lib/effects-batch-*.ts
rg -n "@keyframes roy-<new-effect-id>" src/lib/effects-batch-*.ts
```

---

## 7. Bundle size delta

If the PR adds or modifies effects, the bundle size will change. Verify
the delta is within expectations:

```bash
# Before the PR
wc -c dist/roycss.css

# After building with the PR
bun run build:package && wc -c dist/roycss.css
```

- [ ] The delta is < 5 KB per effect added (typical effect is ~770 B;
      5 KB allows for complex effects with multiple @keyframes).
- [ ] If the delta is > 50 KB, the PR description must justify the
      addition (e.g., a new effect category, a complex visual effect).
- [ ] `dist/roycss.css` remains < 1.5 MB.
- [ ] `dist/roycss.min.css` remains < 1.1 MB.

---

## 8. Color contract

```bash
# Should output 0 (no rgba calls)
rg -o "rgba\(" dist/roycss.css | wc -l

# Should output 2 (the two #fff in -webkit-mask: context)
rg -o "#[0-9a-fA-F]{3,8}\b" dist/roycss.css | wc -l

# Should output the line context for each #hex
rg -n "#[0-9a-fA-F]{3,8}\b" dist/roycss.css
```

- [ ] `rgba(` count is 0.
- [ ] `#hex` count is 2, both in `-webkit-mask:` lines (allowed exception).
- [ ] `oklch(` count is > 5,000 (currently 7,802).
- [ ] `color-mix(` count is > 2,000 (currently 2,156 — known issue,
      tracked in ADR §2.5).
- [ ] OKLCH color ratio is > 90% (currently 99.97%).

---

## 9. Animation contract

```bash
# Count @keyframes
rg -o "@keyframes " dist/roycss.css | wc -l

# Count duplicate @keyframes names (should be 0 after Phase 2 codemod)
node -e "
const css = require('fs').readFileSync('dist/roycss.css', 'utf-8');
const names = css.match(/@keyframes\s+([\w-]+)/g) ?? [];
const list = names.map(n => n.replace(/^@keyframes\s+/, ''));
const counts = new Map();
for (const n of list) counts.set(n, (counts.get(n) ?? 0) + 1);
const dupes = [...counts.entries()].filter(([, c]) => c > 1);
console.log('Duplicate @keyframes names:', dupes.length);
"

# Count will-change (should be < 50)
rg -o "will-change" dist/roycss.css | wc -l

# Count !important (should be < 20)
rg -o "!important" dist/roycss.css | wc -l

# Count backdrop-filter (should be < 200 — Phase 3 will reduce to < 50)
rg -o "backdrop-filter" dist/roycss.css | wc -l
```

- [ ] Total `@keyframes` count is ~1,082 (or 932 after dedupe codemod).
- [ ] Duplicate `@keyframes` names is 0 (after Phase 2; currently 150 —
      known issue, tracked in ADR §2.4).
- [ ] `will-change` count is < 50 (currently 15).
- [ ] `!important` count is < 20 (currently 14).
- [ ] `backdrop-filter` count is < 200 (currently 126).
- [ ] `prefers-reduced-motion` global rule is present at the top of
      `roycss.css` (covers every `[class^="roycss-"]` element).

---

## 10. ESM loader contract

```bash
cat dist/effects.js
```

- [ ] Imports `readFileSync` from `node:fs`.
- [ ] Reads `effects.json` at runtime via `readFileSync(join(__dirname, "effects.json"), "utf-8")`.
- [ ] Exports `effects`, `categories`, `categoryMeta` as named exports.
- [ ] Exports `effects` as the default export.
- [ ] Does NOT inline the 547 KB JSON into the JS file.
- [ ] File is < 10 KB.

---

## 11. Documentation

If the PR changes any architectural decision:

- [ ] `docs/adr/05-performance-engineering.md` is updated.
- [ ] `docs/threat-models/05-performance-engineering.md` is updated
      (if a new threat is introduced).
- [ ] `docs/benchmarks/05-performance-engineering.md` is updated with
      the new measured numbers.
- [ ] `docs/plans/05-performance-engineering.md` is updated (if a
      Phase 2/3 item is completed or added).
- [ ] `docs/checklists/05-performance-engineering.md` is updated (if
      a new check item is needed).
- [ ] `perf/README.md` is updated (if a new benchmark is added or a
      budget changes).

---

## 12. CI gate (Phase 2 — once wired)

When the GitHub Actions perf workflow is live (`.github/workflows/perf.yml`):

- [ ] The workflow runs on every PR touching `dist/**`,
      `src/lib/effects-batch-*.ts`, or `perf/**`.
- [ ] The workflow runs `bun run perf/benchmark.ts` and the step fails
      if exit code is 1 (any benchmark failure).
- [ ] The workflow runs `bun test perf/regression.test.ts` and the step
      fails if any test fails (excluding `test.failing`).
- [ ] The workflow uploads `perf/results/benchmark-report.json` as an
      artifact for audit.
- [ ] A PR-comment bot posts the benchmark delta vs `main` (planned).

---

## 13. Sign-off

Before merging:

- [ ] All Section 1–11 checks pass.
- [ ] The PR description links to the ADR (if architectural) or
      explains the change (if incremental).
- [ ] At least one reviewer has approved.
- [ ] If the PR adds a known issue (new `test.failing`), the ADR is
      updated with the finding and a remediation plan.

**Reviewer signature:** __________________________ **Date:** ___________

---

## 14. Waivers

If a check fails and the team decides to merge anyway:

| Check failed | Reason | Waiver expiration | Approved by |
|---|---|---|---|
| _(example)_ `dist/roycss.css` is 1.55 MB (over 1.5 MB) | New effect category added; budget to be revisited in V2 | 2026-09-01 | Perf eng lead |
| | | | |

Waivers must be time-bounded and have a remediation plan. A waiver
without an expiration date is a process violation.
