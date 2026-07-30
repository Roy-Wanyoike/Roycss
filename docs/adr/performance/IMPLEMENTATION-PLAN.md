# RoyCSS Performance — Implementation Plan

> **Status:** Active
> **Owner:** Performance Engineering domain
> **Last updated:** 2026-07-31
> **Companion docs:** `DESIGN.md`, `ADR.md`, `BENCHMARKS.md`, `REVIEW-CHECKLIST.md`

This plan describes how the RoyCSS performance benchmark suite is wired into the development workflow and CI pipeline. It covers what's already shipped (Phase 1), what's queued for the next 4 weeks (Phase 2), and what's deferred to V2 (Phase 3).

---

## Phase 1 — Shipped (this task)

### 1.1 Design docs (`docs/adr/performance/`)

- [x] `DESIGN.md` — methodology, what we measure, tools, budgets, cadence
- [x] `ADR.md` — 5 ADRs (bundle budget, runtime budget, cadence, virtual-scroll threshold, Playwright-via-Python)
- [x] `BENCHMARKS.md` — measured numbers (filled in after running)
- [x] `IMPLEMENTATION-PLAN.md` — this document
- [x] `REVIEW-CHECKLIST.md` — 15 reviewer items

### 1.2 Benchmark scripts (`performance/` + `scripts/bench/`)

- [x] `performance/budgets.json` — machine-readable budget thresholds
- [x] `performance/bundle-size.ts` — artifact sizing (raw + gzip + brotli)
- [x] `performance/_playwright_bench.py` — Python Playwright helper (CDP + PerformanceObserver)
- [x] `performance/runtime-bench.ts` — Core Web Vitals + DOM + scroll FPS + memory
- [x] `performance/effect-render-bench.ts` — 10/50/100/500/1000 card scaling
- [x] `scripts/bench/run.ts` — orchestrator → `performance/REPORT.md`
- [x] `performance/REPORT.md` — final report (generated)

### 1.3 Verification

- [x] `bun run lint` → exit 0
- [x] `bun run performance/bundle-size.ts` → real numbers populated
- [x] `bun run performance/runtime-bench.ts` → real CWV numbers populated
- [x] `bun run scripts/bench/run.ts` → `performance/REPORT.md` generated

---

## Phase 2 — Next 4 weeks

### 2.1 CI integration (P0)

Wire `scripts/bench/run.ts` into the existing GitHub Actions workflow. Concrete steps:

1. Add a `performance` job to `.github/workflows/ci.yml` that runs after the `lint` + `test` jobs.
2. The job installs Bun, runs `bun install`, starts `bun run dev` in the background, waits for `http://localhost:3000/` to respond 200, then runs `bun run scripts/bench/run.ts`.
3. Upload `performance/REPORT.md` + `performance/results/*.json` as workflow artifacts (90-day retention).
4. On failure, post the failing rows as a PR comment via `actions/github-script`.

The job YAML (drop-in):

```yaml
performance:
  name: Performance benchmarks
  runs-on: ubuntu-latest
  needs: [lint, test]
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: bun install --frozen-lockfile
    - run: bun run dev &
        # wait for dev server
    - run: |
        for i in {1..60}; do
          curl -sf http://localhost:3000/ && break
          sleep 1
        done
    - run: bun run scripts/bench/run.ts
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: perf-report
        path: |
          performance/REPORT.md
          performance/results/
        retention-days: 90
```

**Note:** The Python Playwright install (`/home/z/.venv/bin/python`) won't exist on `ubuntu-latest`. The orchestrator must detect this and fall back to either:
- installing playwright via pip in the job: `pip install playwright && playwright install chromium`, or
- running `bun add -d @playwright/test` in the job (CI-only; doesn't affect local `package.json`)

The CI fallback is documented in `BENCHMARKS.md` §6.

### 2.2 Production-build benchmark mode (P1)

Add a `--prod` flag to `scripts/bench/run.ts` that:
1. Runs `bun run build` (or uses an existing `.next/standalone` build).
2. Starts `bun run start` instead of `bun run dev`.
3. Records the prod-mode numbers in `performance/results/<timestamp>-prod-REPORT.md` alongside the dev-mode baseline.

This will give us realistic LCP/FCP numbers (no HMR overhead) and unblock tightening the CWV budgets.

### 2.3 Trend dashboard (P2)

Archive every CI run's `REPORT.md` to `performance/results/<timestamp>-REPORT.md`. Add a `scripts/bench/trend.ts` that scans the archive and produces an ASCII sparkline chart of LCP / TBT / DOM count / bundle size over time. Output: `performance/TREND.md`, regenerated nightly.

### 2.4 DOM count optimization (P1)

The current dev-mode DOM count is ~4124 (vs budget of 1000). Optimization candidates:

1. **Lazy-render the docs section** — currently all docs cards are in the DOM on initial load. Wrap in a `IntersectionObserver`-gated wrapper.
2. **Lazy-render the hero's secondary CTA cluster** — likely ~50 nodes that aren't visible until scroll.
3. **Collapse the patterns/recipes sections** behind a "Show more" toggle.

Target: bring initial DOM count under 1500 (closer to the 1000 budget) without removing marketing content.

### 2.5 Lighthouse supplemental run (P2)

Add `scripts/bench/lighthouse.ts` that runs Lighthouse against `http://localhost:3000/` and parses the JSON output for the four scores (Performance, Accessibility, Best Practices, SEO). Surface alongside the lab CWV numbers in `REPORT.md`. This is supplemental, not a gate — Lighthouse's 45 s runtime is too slow for per-PR gating but useful for weekly trend.

---

## Phase 3 — V2 / out of scope

### 3.1 Real-user monitoring (RUM)

Ship a `web-vitals` integration that reports field CWV to a backend (Vercel Analytics, plausible, or self-hosted). Use the same metric definitions as the lab so we can directly compare. The lab is the floor, RUM is the truth.

### 3.2 Per-category CSS splitting

`bundle-size.ts` already reports per-category sizes. The next step is to emit `roycss-animations.css`, `roycss-loaders.css`, etc. and load them on demand. This would let the marketing site ship ~30 KB of CSS on initial load (the "animations" + "hover" categories that the hero uses) and lazy-load the rest when the user scrolls to the effects grid.

### 3.3 Mobile viewport benchmark

Add a `--mobile` flag that runs the runtime bench at 375 × 667 with CPU throttling (4× slowdown). Mobile LCP budget: 4 s (vs 2.5 s desktop). Mobile DOM budget: 800 (vs 1000 desktop).

### 3.4 Critical-CSS wiring

`dist/roycss-critical.css` (17 KB, 1.5% of full bundle) is already built by `perf/optimize/extract-critical-css.ts`. Wiring it into `src/app/page.tsx` via `<style dangerouslySetInnerHTML>` + `<link rel="preload" as="style" onload>` is a Phase 2 task owned by the docs-site domain. Expected LCP improvement: ~350 ms.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Python Playwright missing on CI runner | Medium | High (runtime bench can't run) | Fallback to `pip install` or `agent-browser`. Documented in `BENCHMARKS.md` §6. |
| Dev server flaky startup on CI | Medium | Medium (false-negative gate failures) | 60 s retry loop on `curl localhost:3000`; if still failing, exit with a clear `DEV_SERVER_DOWN` error code, not a generic bench failure. |
| Bundle budget too tight, blocks legitimate feature work | Low | High (developer friction) | Budget is intentionally 1.5× current measured size. If we hit the ceiling, the ADR documents how to raise it with justification. |
| CWV numbers differ wildly between dev and CI | High | Low (false alarms) | The budget is calibrated for dev; CI runner specs are recorded in the report header so trends are comparable. |
| Playwright Python version drift (1.57 → 2.x) | Low | Medium | Pin to `playwright>=1.57,<2.0` in the future `requirements-perf.txt`. |

---

## Sequencing

```
Phase 1 (shipped)
  ↓
Phase 2.1 CI integration (P0, ~1 day)
  ↓
Phase 2.4 DOM optimization (P1, ~2 days)   ← unblocks tightening DOM budget
  ↓
Phase 2.2 Prod-build mode (P1, ~1 day)
  ↓
Phase 2.3 Trend dashboard (P2, ~1 day)
  ↓
Phase 2.5 Lighthouse supplemental (P2, ~0.5 day)
  ↓
Phase 3 (V2, deferred)
```

---

## Success metrics

The Phase 1 suite is "done" when:

1. `bun run scripts/bench/run.ts` exits 0 on a clean checkout. ✅ (this task)
2. Every budget row in `performance/bUDGETS.json` has a corresponding measured row in `performance/REPORT.md`. ✅ (this task)
3. The CI job in Phase 2.1 blocks a PR that regresses any budget by >5%. (Phase 2.1)
4. The trend dashboard in Phase 2.3 shows LCP / DOM count stable or improving over a 4-week window. (Phase 2.3)

---

## Change log

- 2026-07-31 — Phase 1 shipped. 7 scripts + 5 docs + 1 JSON budget + 1 generated REPORT.md. All measured numbers populated from real runs.
