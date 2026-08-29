# Plan 05 — Performance Engineering

**Status:** Active · **Date:** 2026-07-30
**Owner:** Distinguished Engineer — Performance Engineering domain
**Companion docs:** `docs/adr/05-performance-engineering.md`,
`docs/threat-models/05-performance-engineering.md`,
`docs/benchmarks/05-performance-engineering.md`,
`docs/checklists/05-performance-engineering.md`.

---

## 1. Goals

1. **Measure everything.** Every performance claim about RoyCSS must be
   backed by a real measured number, captured in
   `perf/results/benchmark-report.json`.
2. **Guard against regressions.** The benchmark harness and regression
   test suite must run in CI on every PR that touches `dist/` or
   `src/lib/effects-batch-*.ts`.
3. **Optimize hot paths.** The critical-CSS extractor and the
   duplicate-`@keyframes` codemod deliver measurable bundle-size
   reductions.
4. **Document the design.** The ADR captures every architectural
   decision; the threat model captures every security-as-performance
   concern.

---

## 2. File inventory

### 2.1 `perf/` directory (10 files, 2,014 lines total)

| File | Lines | Purpose |
|---|---|---|
| `perf/README.md` | ~75 | How to run benchmarks, budget table, output formats |
| `perf/benchmark.ts` | 224 | Main harness — runs every benchmark, writes JSON, exits 0/1 |
| `perf/benchmarks/bundle-size.ts` | 97 | `fs.statSync` on dist/ artifacts |
| `perf/benchmarks/effect-count.ts` | 290 | Catalog counts, dupes, color coverage |
| `perf/benchmarks/css-injection.ts` | 154 | `DynamicEffectCSS` injection timing |
| `perf/benchmarks/virtual-scroll.ts` | 110 | `VirtualScrollGrid` render cost |
| `perf/benchmarks/animation-jank.ts` | 217 | Theoretical fps for top 20 effects |
| `perf/benchmarks/memory-footprint.ts` | 153 | Per-effect heap cost |
| `perf/optimize/extract-critical-css.ts` | 155 | Builds `dist/roycss-critical.css` |
| `perf/regression.test.ts` | 307 | 21 bun:test tests (2 `test.failing` for known issues) |
| `perf/results/benchmark-report.json` | 389 | Last run results (auto-generated) |

### 2.2 `docs/` files (5 files)

| File | Purpose |
|---|---|
| `docs/adr/05-performance-engineering.md` | Decision record |
| `docs/threat-models/05-performance-engineering.md` | STRIDE analysis |
| `docs/benchmarks/05-performance-engineering.md` | Real measured numbers |
| `docs/plans/05-performance-engineering.md` | This file |
| `docs/checklists/05-performance-engineering.md` | Merge-gate checklist |

---

## 3. Phase 1 — Shipped (2026-07-30)

### 3.1 Benchmark harness

- [x] `perf/benchmark.ts` — main harness with JSON output + human table + exit code.
- [x] `perf/benchmarks/bundle-size.ts` — 7 results (6 with budgets, 1 info).
- [x] `perf/benchmarks/effect-count.ts` — 12 results (9 with budgets, 3 info).
- [x] `perf/benchmarks/css-injection.ts` — 4 results (3 with budgets, 1 info).
- [x] `perf/benchmarks/virtual-scroll.ts` — 3 results (all with budgets).
- [x] `perf/benchmarks/animation-jank.ts` — 5 results (3 with budgets, 2 info).
- [x] `perf/benchmarks/memory-footprint.ts` — 5 results (3 with budgets, 2 info).
- [x] Total: 36 results, 25 pass, 3 fail (known issues), 8 info.

### 3.2 Optimization — critical CSS extractor

- [x] `perf/optimize/extract-critical-css.ts` — builds `dist/roycss-critical.css`.
- [x] Output: 17.25 KB (50 effects + base CSS), 1.5% of full bundle.
- [x] Budget: 80 KB (within budget).
- [x] Usage documentation in `perf/README.md`.

### 3.3 Regression tests

- [x] `perf/regression.test.ts` — 21 tests via `bun:test`.
- [x] 19 tests pass outright.
- [x] 2 tests marked `test.failing` for known issues (duplicate @keyframes,
      color-mix count).
- [x] All 6 task-required tests pass:
  - `dist/effects.json` has exactly 1569 effects ✓
  - `dist/roycss.css` < 1.5 MB ✓
  - `dist/roycss.min.css` < 1.1 MB ✓
  - Every effect has non-empty cssCode ✓
  - No effect uses raw #hex (except mask context) ✓
  - No effect uses raw rgba() ✓

### 3.4 Documentation

- [x] ADR — 6 sections (Context, Decision, Alternatives, Consequences,
      Compliance, References).
- [x] Threat model — 8 sections (Why perf is security, Assets, Adversaries,
      STRIDE, Attack surface reduction, Ongoing controls, Incident
      response, Residual risk summary).
- [x] Benchmarks doc — 12 sections (Summary, Bundle size, Effect count,
      CSS injection, Virtual scroll, Animation jank, Memory footprint,
      Aggregate table, Known issues, LABS-33 comparison, Reproduce,
      Change log).
- [x] Plan — this file.
- [x] Checklist — merge-gate with exact verification commands.

---

## 4. Phase 2 — Planned (next 4 weeks)

### 4.1 Duplicate `@keyframes` codemod

**Goal:** Eliminate the 150 duplicate `@keyframes` declarations,
saving ~75 KB (6.2% of bundle).

**Approach:**
1. Write `perf/optimize/dedupe-keyframes.ts` that:
   - Parses `dist/roycss.css` into a list of `@keyframes roy-X { body }` blocks.
   - Hashes each body via SHA-256.
   - For each `(name, body)` pair that appears more than once, removes
     all but the first occurrence.
   - Writes the deduplicated `dist/roycss.css`.
2. Wire into `scripts/build-package.ts` so it runs after the CSS is
   concatenated but before minification.
3. Flip the `test.failing("no duplicate @keyframes names")` to `test`.
4. Update `effect-count/keyframes-duplicates` benchmark — should now
   pass with value 0.

**Estimated effort:** 1 engineer-day.
**Risk:** Low — bodies are identical, so no visual change.

### 4.2 Wire critical CSS into the marketing site

**Goal:** Inline `dist/roycss-critical.css` in `<head>` for instant
first paint; preload the full bundle for after-paint load.

**Approach:**
1. In `src/app/page.tsx` (or the layout), import the critical CSS as
   an inline string:
   ```tsx
   import criticalCss from "roycss/dist/roycss-critical.css?inline";
   // …
   <head>
     <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
     <link rel="preload" href="/roycss.css" as="style" />
     <link rel="stylesheet" href="/roycss.css" media="print"
           onLoad="this.media='all'" />
   </head>
   ```
2. Verify in Chrome DevTools that first paint drops from ~400 ms
   (full bundle) to ~50 ms (critical inline).
3. Add a Lighthouse CI budget: LCP < 1.5 s on Slow 4G + 4× CPU.

**Estimated effort:** 2 engineer-days (including Lighthouse CI setup).
**Risk:** Medium — Next.js 16 has specific patterns for inlining CSS;
may require `next.config.ts` changes.

### 4.3 CI integration

**Goal:** Run the benchmark harness and regression tests on every PR.

**Approach:**
1. Add a GitHub Actions workflow `.github/workflows/perf.yml`:
   ```yaml
   on: { pull_request: { paths: ['dist/**', 'src/lib/effects-batch-*.ts', 'perf/**'] } }
   jobs:
     perf:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: oven-sh/setup-bun@v1
         - run: bun install
         - run: bun run build:package
         - run: bun run perf/optimize/extract-critical-css.ts
         - run: bun run perf/benchmark.ts
         - run: bun test perf/regression.test.ts
         - uses: actions/upload-artifact@v4
           with: { name: benchmark-report, path: perf/results/ }
   ```
2. The benchmark step exits 1 if any budget fails — this blocks the PR
   unless the failure is a documented known issue (the 3 current
   failures would block; see §4.1 for the fix).
3. Add a PR-comment bot that posts the benchmark diff vs `main`.

**Estimated effort:** 2 engineer-days.
**Risk:** Low.

### 4.4 Additional benchmarks (stretch)

- [ ] `will-change` count (target `< 50`, current 15).
- [ ] `backdrop-filter` count (target `< 50`, current 126 — needs the
      LABS-33 §3 design-language revision).
- [ ] `!important` count (target `< 20`, current 14).
- [ ] Selector depth audit (LABS-33 §6 — target: 0 selectors > 3 segments).
- [ ] `@layer` adoption (LABS-33 §8 — V2 migration).

**Estimated effort:** 1 engineer-day each.

---

## 5. Phase 3 — Future (V2 migration)

These items are tracked in `LABS-33-PERFORMANCE-LAB.md` and are out of
scope for this ADR. They are listed here for cross-reference:

1. **`@layer` cascade isolation** — wrap all rules in
   `@layer roycss { ... }`. Requires consumer codemod.
2. **Selector depth ≤ 3** — enforced via `eslint-plugin-roycss`.
3. **`backdrop-filter` reduction** — from 126 to <50 (LABS-33 §3).
4. **Animation library rewrite** — replace `box-shadow` animations
   with `filter: drop-shadow()` on pseudo-elements where visually
   equivalent.
5. **Per-effect CSS files** — `dist/effects/{id}.css` for npm consumers
   who want granular imports.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CI benchmark flakes due to hardware variance | Medium | Low (PR blocked) | Use generous budgets (current headroom is 50–90%) |
| Critical CSS goes stale (extractor not run) | Medium | Medium (FOUC) | Add extractor to `build:package` script |
| Duplicate-@keyframes codemod breaks a hidden edge case | Low | High (broken effect) | Run codemod in dry-run mode first; diff the output; visual regression test on top 100 effects |
| Lighthouse CI budget too strict | Low | Low (PR blocked) | Start with V2 targets from LABS-33; tighten over time |
| New effect added with 50 KB cssCode | Medium | Medium (bundle bloat) | `per-css-bytes` benchmark catches single-effect bloat; reviewer checklist item |

---

## 7. Out of scope

- **Browser-side frame-rate measurement.** Requires Chrome DevTools
  Protocol; out of scope for a Bun-based harness. Documented as
  "theoretical" in the animation-jank benchmark.
- **Real DOM memory measurement.** Requires jsdom or Puppeteer. The
  current `memory-footprint` benchmark measures JS heap only.
- **Network simulation.** Requires Lighthouse CI or WebPageTest.
  Tracked in Phase 2 §4.2.
- **Visual regression testing.** Requires Playwright + screenshot diff.
  Tracked separately in the testing domain.

---

## 8. Sequencing diagram

```
Phase 1 (shipped, 2026-07-30)
─────────────────────────────
  perf/benchmark.ts            ← runs all 6 benchmark suites
  perf/regression.test.ts      ← 21 tests, 2 known-issue failures
  perf/optimize/extract-critical-css.ts  ← builds dist/roycss-critical.css
  docs/{adr,threat-models,benchmarks,plans,checklists}/05-*  ← 5 docs
                              │
                              ▼
Phase 2 (next 4 weeks)
─────────────────────────────
  perf/optimize/dedupe-keyframes.ts  ← removes 150 dupes, saves 75 KB
  src/app/page.tsx                   ← wires critical CSS into <head>
  .github/workflows/perf.yml         ← CI gate on every PR
  Lighthouse CI budget               ← LCP < 1.5 s on Slow 4G
                              │
                              ▼
Phase 3 (V2 migration, LABS-33)
─────────────────────────────
  @layer roycss { … }                ← cascade isolation
  eslint-plugin-roycss               ← selector depth ≤ 3
  backdrop-filter reduction          ← 126 → <50
  per-effect CSS files               ← dist/effects/{id}.css
```

---

## 9. Success metrics

The plan succeeds when:

1. `bun run perf/benchmark.ts` exits 0 on `main`.
2. `bun test perf/regression.test.ts` passes all 21 tests (0 `failing`).
3. The marketing site's LCP is < 1.5 s on Slow 4G + 4× CPU (Lighthouse CI).
4. `dist/roycss.css` is < 1.1 MB (after dedupe codemod).
5. No PR merges without the perf CI gate passing.

**Current status (2026-07-30):** 1/5 — benchmarks fail on 3 known
issues. Phase 2 work will close the gap.
