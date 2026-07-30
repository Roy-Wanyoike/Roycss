# RoyCSS Performance Reviewer Checklist

> **Use this when reviewing:** a PR that touches `src/components/roycss/`, `src/lib/effects-batch-*.ts`, `dist/`, `public/`, `next.config.ts`, or any file under `performance/` or `scripts/bench/`.
> **Pass condition:** every box must be `[x]` before merge.
> **Companion docs:** `DESIGN.md`, `ADR.md`, `BENCHMARKS.md`, `IMPLEMENTATION-PLAN.md`

---

## 1. Bundle size

- [ ] `bun run performance/bundle-size.ts` exits 0
- [ ] `roycss.min.css` gzipped is `< 150 KB` (budget row `bundle/css-gz`)
- [ ] `effects.json` gzipped is `< 100 KB` (budget row `bundle/json-gz`)
- [ ] No new artifact in `dist/` is unaccounted for in the report
- [ ] Per-category CSS breakdown shown in REPORT.md — no category grew >10% without justification

## 2. Core Web Vitals

- [ ] `bun run performance/runtime-bench.ts` exits 0 (or `--allow-na` if Playwright unavailable)
- [ ] LCP `< 2.5 s` (budget row `runtime/lcp`)
- [ ] TBT `< 200 ms` (budget row `runtime/tbt`)
- [ ] CLS `< 0.1` (budget row `runtime/cls`)
- [ ] FCP `< 1.8 s` and TTI `< 3.8 s` reported (info rows, not gate)

## 3. DOM count + virtual scrolling

- [ ] Initial-load DOM count reported in REPORT.md (budget row `runtime/dom-count`)
- [ ] If DOM count > 1000, the PR description explains why (e.g. new hero section) and the ADR has a corresponding entry
- [ ] `effect-render-bench.ts` confirms initial card count ≤ 48 (BATCH_SIZE × 2 — the lazy-load pre-fetch window)
- [ ] No new `IntersectionObserver` was added without a corresponding perf comment explaining why the existing pattern didn't fit

## 4. Memory

- [ ] `JSHeapUsedSize` reported in REPORT.md (info row, no budget yet — establishing baseline)
- [ ] `Nodes` (DOM node count from CDP) reported and within 5% of the `document.querySelectorAll('*').length` value (sanity check that CDP and Web API agree)
- [ ] No new global event listener was added without a cleanup in `useEffect` return

## 5. Render scaling

- [ ] `effect-render-bench.ts` reports render time for N ∈ {10, 50, 100, 500, 1000}
- [ ] Render time at N=1000 is `< 200 ms` (budget row `render/n1000-time`)
- [ ] Render time scales roughly linearly (R² > 0.9 across the 5 data points) — if not, the PR description explains the superlinear cost

## 6. Tooling

- [ ] `bun run lint` exits 0
- [ ] `performance/budgets.json` was NOT modified in this PR (budget changes require an ADR row update + worklog entry)
- [ ] If `performance/budgets.json` WAS modified, the PR description contains a "Budget change justification" section
- [ ] No new npm devDependency was added to `package.json` (if absolutely needed, it's justified in the PR description and an ADR row is added)

## 7. Report integrity

- [ ] `performance/REPORT.md` was regenerated and committed (or attached as a CI artifact if running in CI)
- [ ] Every row in `performance/budgets.json` has a corresponding row in REPORT.md (no missing measurements)
- [ ] No row in REPORT.md shows `N/A` unless `--allow-na` was passed and the PR description explains why
- [ ] The "Run metadata" section at the top of REPORT.md shows the correct timestamp, dev-server URL, and Playwright version

## 8. Reproducibility

- [ ] The PR author ran `bun run scripts/bench/run.ts` locally and pasted the exit code in the PR description
- [ ] If the local run differs from CI by >10% on any metric, the discrepancy is documented
- [ ] The dev server was running on port 3000 during the local run (REPORT.md header confirms `baseURL: http://localhost:3000/`)
