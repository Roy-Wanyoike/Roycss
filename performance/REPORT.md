# RoyCSS Performance Report

> **Generated:** 2026-07-30T13:57:10.155Z
> **Orchestrator:** `scripts/bench/run.ts`
> **Run metadata:**
>   - Base URL: `http://localhost:3000/` (Next.js dev server)
>   - Browser: Chromium 1228 (headless, via Playwright Python 1.57.0)
>   - Viewport: 1280 × 800
>   - Runtime runs: 3 (median reported)
>   - Node: v24.3.0, Bun: 1.3.14

## 1. Summary

| Benchmark | Script | Exit | Duration | Status |
|---|---|---|---|---|
| bundle-size | `/home/z/my-project/performance/bundle-size.ts` | 0 | 11491 ms | ✅ PASS |
| runtime-bench | `/home/z/my-project/performance/runtime-bench.ts` | 1 | 28782 ms | ❌ FAIL |
| effect-render-bench | `/home/z/my-project/performance/effect-render-bench.ts` | 0 | 7652 ms | ✅ PASS |

## 2. Bundle size

### 2.1 Artifact sizes (raw / gzip / brotli)

| Artifact | Raw | Gzip (-9) | Brotli (11) | Status |
|---|---|---|---|---|
| dist/roycss.css (raw) | 1.153 MB | 170.28 KB | 115.22 KB | ✅ PASS |
| dist/roycss.min.css (raw) | 989.69 KB | 148.23 KB | 100.75 KB | ✅ PASS |
| dist/roycss.min.css (gzipped) | 148.23 KB | — | — | ✅ PASS |
| dist/roycss.min.css (brotlied) | 100.75 KB | — | — | 🔵 INFO |
| dist/effects.json (raw) | 534.25 KB | 66.98 KB | — | ✅ PASS |
| dist/effects.json (gzipped) | 66.98 KB | — | — | ✅ PASS |
| cli/index.js (raw) | 1.623 MB | 255.17 KB | 176.20 KB | ✅ PASS |
| mcp-server/index.ts (source — not built) | 97.01 KB | 23.51 KB | 19.51 KB | 🔵 INFO |

### 2.2 Per-category CSS breakdown

| Category | Effects | Bytes | % | Bar |
|---|---|---|---|---|
| visual | 265 | 239.26 KB | 20.4% | `██████                        ` |
| animations | 324 | 191.93 KB | 16.3% | `█████                         ` |
| backgrounds | 133 | 138.61 KB | 11.8% | `████                          ` |
| loaders | 68 | 77.27 KB | 6.6% | `██                            ` |
| text | 106 | 75.89 KB | 6.5% | `██                            ` |
| particles | 52 | 73.51 KB | 6.3% | `██                            ` |
| microinteractions | 104 | 72.29 KB | 6.2% | `██                            ` |
| hover | 109 | 44.77 KB | 3.8% | `█                             ` |
| cards | 55 | 35.52 KB | 3.0% | `█                             ` |
| forms | 57 | 28.48 KB | 2.4% | `█                             ` |
| glass-ui | 50 | 27.66 KB | 2.4% | `█                             ` |
| buttons | 55 | 27.20 KB | 2.3% | `█                             ` |
| scroll | 60 | 25.79 KB | 2.2% | `█                             ` |
| navigation | 34 | 20.18 KB | 1.7% | `█                             ` |
| misc | 36 | 20.04 KB | 1.7% | `█                             ` |
| borders | 30 | 18.88 KB | 1.6% | `                              ` |
| page-transitions | 39 | 18.52 KB | 1.6% | `                              ` |
| cursor | 24 | 17.12 KB | 1.5% | `                              ` |
| 3d-transforms | 31 | 14.36 KB | 1.2% | `                              ` |
| filters | 15 | 4.81 KB | 0.4% | `                              ` |
| uncategorized | 12 | 3.13 KB | 0.3% | `                              ` |

## 3. Runtime (Core Web Vitals + DOM + scroll + memory)

**URL:** http://localhost:3000/  |  **Runs:** 3 (median reported)

| Metric | Median | Min | Max | Variance | Status |
|---|---|---|---|---|---|
| Time to First Byte | 245.4 ms | 222.3 ms | 402.3 ms | 73.3% | 🔵 INFO |
| First Contentful Paint | 740.0 ms | 704.0 ms | 1320.0 ms | 83.2% | ✅ PASS |
| Largest Contentful Paint | N/A | — | — | 0.0% | ⚪ N/A |
| Time to Interactive (approx) | 3270.0 ms | 2567.8 ms | 4044.3 ms | 45.2% | ✅ PASS |
| Total Blocking Time | 374.0 ms | 195.0 ms | 577.0 ms | 102.1% | ❌ FAIL |
| Cumulative Layout Shift | 0.0000 score | 0.0000 score | 0.1053 score | 0.0% | ✅ PASS |
| DOM nodes on initial load | 4124 count | 4124 count | 4124 count | 0.0% | ❌ FAIL |
| Scroll FPS (5s average) | 35.3 fps | 33.7 fps | 59.9 fps | 74.4% | ❌ FAIL |
| scrollP95FrameMs | 66.7 ms | 16.7 ms | 66.7 ms | 75.0% | 🔵 INFO |
| scrollMaxFrameMs | 100.0 ms | 16.8 ms | 166.7 ms | 149.9% | 🔵 INFO |
| jsHeapUsedSize | 58355640.0 bytes | 55141208.0 bytes | 59295328.0 bytes | 7.1% | 🔵 INFO |
| domNodesCdp | 15428 count | 15428 count | 15428 count | 0.0% | 🔵 INFO |
| layoutCount | 0 count | 0 count | 0 count | 0.0% | 🔵 INFO |
| recalcStyleCount | 0 count | 0 count | 0 count | 0.0% | 🔵 INFO |
| scriptDuration | 0.0 ms | 0.0 ms | 0.0 ms | 0.0% | 🔵 INFO |
| taskDuration | 0.0 ms | 0.0 ms | 0.0 ms | 23553.8% | 🔵 INFO |
| longTaskCount | 7 count | 6 count | 8 count | 28.6% | 🔵 INFO |

**Notes:**

- **Largest Contentful Paint:** LCP observer did not fire in this Playwright/Chromium configuration (known headless limitation). See BENCHMARKS.md §6.

## 4. Effect render scaling

### 4.1 Initial page state (virtual-scroll verification)

- Initial card count (`.perf-auto`): **40** (budget: ≤ 48 — ✅ PASS)
- DOM count (Web API): **4124**
- Preview elements (`[class*=roycss-]`): **99**
- Document scroll height: **18710px**

### 4.2 Render time / DOM / memory by N

| N cards | Render time | DOM count | Mem delta | CDP nodes | CDP heap |
|---|---|---|---|---|---|
| 10 | 1.2 ms | 4245 | 0 B | 15773 | 48.296 MB |
| 50 | 5.7 ms | 4725 | 0 B | 17374 | 48.642 MB |
| 100 | 9.7 ms | 5325 | 0 B | 20575 | 48.857 MB |
| 500 | 217 ms | 10125 | 0 B | 36576 | 49.656 MB |
| 1000 | 99.2 ms | 16125 | 0 B | 63429 | 35.144 MB |

**Linearity:** R² = 0.3907 across 5 data points ⚠ super-linear

### 4.3 Render time vs N (ASCII chart)

```
N=  10 │                                          │   1.2 ms
N=  50 │ █                                        │   5.7 ms
N= 100 │ ██                                       │   9.7 ms
N= 500 │ ████████████████████████████████████████ │   217 ms
N=1000 │ ██████████████████                       │  99.2 ms
```

## 5. Budget gate summary

| Metric | Actual | Budget | Comparator | Status |
|---|---|---|---|---|
| dist/roycss.css (raw) | 1.153 MB | 1.500 MB | lt | ✅ PASS |
| dist/roycss.min.css (raw) | 989.69 KB | 1.100 MB | lt | ✅ PASS |
| dist/roycss.min.css (gzipped) | 148.23 KB | 150.00 KB | lt | ✅ PASS |
| dist/roycss.min.css (brotlied) | 100.75 KB | 126.95 KB | lt | 🔵 INFO |
| dist/effects.json (raw) | 534.25 KB | 700.00 KB | lt | ✅ PASS |
| dist/effects.json (gzipped) | 66.98 KB | 100.00 KB | lt | ✅ PASS |
| cli/index.js (raw) | 1.623 MB | 2.000 MB | lt | ✅ PASS |
| mcp-server/index.ts (source — not built) | 97.01 KB | 100.00 KB | lt | 🔵 INFO |
| Time to First Byte | 245.4 ms | 800 ms | lt | 🔵 INFO |
| First Contentful Paint | 740.0 ms | 1800 ms | lt | ✅ PASS |
| Largest Contentful Paint | N/A | 2500 ms | lt | ⚪ N/A |
| Time to Interactive (approx) | 3270.0 ms | 3800 ms | lt | ✅ PASS |
| Total Blocking Time | 374.0 ms | 200 ms | lt | ❌ FAIL |
| Cumulative Layout Shift | 0.0000 score | 0.1 score | lt | ✅ PASS |
| DOM nodes on initial load | 4124 count | 1000 count | lt | ❌ FAIL |
| Scroll FPS (5s average) | 35.3 fps | 50 fps | gte | ❌ FAIL |
| Render @ 10 cards | 1.2 ms | 20.0 ms | lt | 🔵 INFO |
| Render @ 50 cards | 5.7 ms | 50.0 ms | lt | 🔵 INFO |
| Render @ 100 cards | 9.7 ms | 80.0 ms | lt | 🔵 INFO |
| Render @ 500 cards | 217 ms | 150 ms | lt | 🔵 INFO |
| Render @ 1000 cards | 99.2 ms | 200 ms | lt | ✅ PASS |
| Initial card count | 40 | 48 | lte | ✅ PASS |

## 6. Findings

- **Bundle size:** 6 PASS, 0 FAIL, 2 INFO. All gate budgets met — `roycss.min.css` gzipped is well under the 150 KB budget, `effects.json` gzipped is well under 100 KB.
- **Top 3 CSS categories by size:** `visual` (20.4%, 239.26 KB), `animations` (16.3%, 191.93 KB), `backgrounds` (11.8%, 138.61 KB). These are the highest-value targets for per-category code-splitting.
- **Runtime:** 3 PASS, 3 FAIL, 1 N/A.
- - ❌ **Total Blocking Time:** median 374.0 ms exceeds budget. See row above.
- - ❌ **DOM nodes on initial load:** median 4124 count exceeds budget. See row above.
- - ❌ **Scroll FPS (5s average):** median 35.3 fps exceeds budget. See row above.
- - ⚪ **Largest Contentful Paint:** LCP observer did not fire in this Playwright/Chromium configuration (known headless limitation). See BENCHMARKS.md §6.
- **Effect render:** Initial card count is 40 (≤ 48 budget — virtual scrolling is active). Render time at N=1000 is 99.2 ms. Linearity R² = 0.3907 (super-linear — investigate).

## 7. Recommendations

Based on this run:

1. **DOM count optimization (P1).** Initial-load DOM count is 4124, exceeding the 1000-node budget by ~4.1×. The hero + nav + sidebar + 24-48 effect cards × ~25 nodes/card ≈ 4124 nodes. Lazy-render the docs section, collapse the patterns/recipes sections behind a toggle, and consider deferring the secondary CTA cluster. Target: < 1500 nodes.
2. **TBT reduction (P1).** Total Blocking Time is 374 ms, above the 200 ms budget. The 7 long tasks suggest Next.js dev-mode hydration is the culprit. Run the benchmark against `next build && next start` to confirm — production should be ~50% better. If prod is still over budget, investigate which hydration tasks can be deferred.
3. **Scroll FPS (P1).** Median scroll FPS is 35.3, below the 50 fps budget. With only 24-48 effect cards in the DOM, this is likely caused by animation-heavy preview elements (backdrop-filter, will-change, infinite animations). Consider pausing animations on cards outside the viewport (the existing `animation-pauser.tsx` may need wiring to the IntersectionObserver).
4. **LCP measurement (P2).** The LCP observer does not fire in this Playwright/Chromium configuration (verified by testing the observer against `example.com` — it fires there but not against the RoyCSS marketing site, likely due to client-side hydration of the hero). To unblock LCP gating, either (a) switch to Lighthouse (which uses Chrome's Trace API, not PerformanceObserver), or (b) add `elementtiming="hero"` to the hero `<h1>` and use the Element Timing API as a fallback.
5. **Production-build benchmark mode (P2).** The current numbers reflect `next dev` (HMR + sourcemaps). Add a `--prod` flag to the orchestrator that runs `next build && next start` for realistic CWV numbers. The dev numbers are useful as a regression baseline but should not be quoted as user-facing CWV.
6. **Per-category CSS splitting (V2).** The top 3 categories (visual, animations, backgrounds) account for ~48.5% of the bundle. Splitting these into separate files and lazy-loading them would cut initial CSS payload by ~50%. The render-bench shows N=1000 cards render in 99.2 ms — a synthetic absolute, useful as a per-card cost regression baseline (~0.099 ms/card).

## 8. How to reproduce

```bash
# 1. Start the dev server (must be running on port 3000)
cd /home/z/my-project && bun run dev &

# 2. Wait for server to be ready
for i in {1..60}; do curl -sf http://localhost:3000/ && break; sleep 1; done

# 3. Run the full benchmark suite (this orchestrator)
cd /home/z/my-project && bun run scripts/bench/run.ts

# Or run each benchmark independently:
cd /home/z/my-project && bun run performance/bundle-size.ts
cd /home/z/my-project && bun run performance/runtime-bench.ts --runs 3
cd /home/z/my-project && bun run performance/effect-render-bench.ts
```

JSON results are saved to `performance/results/`. This report is saved to `performance/REPORT.md`.

---

*Generated by `scripts/bench/run.ts` on 2026-07-30T13:57:10.155Z.*
