# RoyCSS Performance Methodology — DESIGN

> **Status:** Accepted
> **Owner:** Performance Engineering domain
> **Last updated:** 2026-07-31
> **Scope:** `/home/z/my-project/performance/`, `/home/z/my-project/scripts/bench/`, `/home/z/my-project/docs/adr/performance/`

---

## 1. Purpose

This document defines **what we measure, how we measure it, and what "good" looks like** for the RoyCSS marketing site + library distribution. It is the canonical methodology referenced by:

- `performance/bundle-size.ts` — static artifact sizing
- `performance/runtime-bench.ts` — Core Web Vitals via Playwright + Chrome DevTools Protocol
- `performance/effect-render-bench.ts` — scaling render-time / DOM-count / memory for 10→1000 cards
- `performance/budgets.json` — the JSON-encoded gate thresholds
- `scripts/bench/run.ts` — orchestrator that produces `performance/REPORT.md`

The companion `ADR.md` records the *decisions*; this document records the *method*. `BENCHMARKS.md` records the *measured numbers*. `IMPLEMENTATION-PLAN.md` records *how we wire it into CI*. `REVIEW-CHECKLIST.md` records *how a reviewer double-checks a run*.

---

## 2. What we measure

Performance is sliced into four orthogonal axes. A regression in any one is a release blocker.

### 2.1 Bundle size (distribution cost)

The bytes that ship from CDN to every visitor, whether they ever see the effects grid or not. We measure both **raw** and **compressed** sizes because the wire cost is what users on 3G/4G actually pay.

| Artifact | Why it matters |
|---|---|
| `dist/roycss.css` | Full unminified source. Dev tools, debugging, sourcemap backstop. |
| `dist/roycss.min.css` | Production wire payload. The single most-watched number. |
| `dist/effects.json` | Effect metadata (id, name, category, tags, previewType). Loaded eagerly by the marketing site. |
| `cli/index.js` | Bundled CLI — affects `npx roycss` cold-start time. |
| `mcp-server/index.js` | MCP server bundle. (Source is `.ts`; we measure after a transient build.) |

For each artifact we record three sizes:
- **raw** — `fs.statSync(path).size`
- **gzipped** — `zlib.gzipSync(buf, { level: 9 })`
- **brotlied** — `zlib.brotliCompressSync(buf, { quality: 11 })` (CSS/JS only; skipped for JSON where gzip is the standard)

Per-category CSS breakdown is computed by parsing `dist/roycss.css` for `.roycss-<id>` selector blocks and grouping by `effects.json`'s `category` field. This surfaces which categories dominate the bundle so optimizations target the heaviest hitters.

### 2.2 Time-to-interactive (load cost)

Standard Core Web Vitals captured against `http://localhost:3000/` in a headless Chromium:

| Metric | Definition | Source |
|---|---|---|
| **TTFB** | Time To First Byte — `navigation.responseStart - navigation.requestStart` | Performance API |
| **FCP** | First Contentful Paint | `PerformanceObserver('paint')` |
| **LCP** | Largest Contentful Paint | `PerformanceObserver('largest-contentful-paint')` |
| **TTI** | Time to Interactive — approximated as `max(FCP, last long task end)` | Performance API + longtask |
| **TBT** | Total Blocking Time — `Σ(duration − 50ms)` for every long task between FCP and TTI | `PerformanceObserver('longtask')` |
| **CLS** | Cumulative Layout Shift — `Σ(entry.value)` for non-input layout-shift entries | `PerformanceObserver('layout-shift')` |

Observers are installed via `page.add_init_script` *before* navigation so we capture the entire load. We then read the buffered entries after `networkidle`.

### 2.3 Runtime performance (interaction cost)

After the page is interactive, we measure three runtime health signals:

- **DOM node count on initial load** — `document.querySelectorAll('*').length`. Verifies virtual scrolling is doing its job: with 1569 effects and no windowing, this would be ~39,000 nodes; with virtual scrolling it should be well under 1,000 (budget: `< 1000`).
- **Scroll FPS** — over a 5-second programmatic scroll, we count `requestAnimationFrame` callbacks and compute `frames / duration_ms × 1000`. A 60 Hz display with no jank yields ~60 fps. Below 50 fps indicates main-thread blocking during scroll (typically from style recalculation on the lazy-loaded cards).
- **Memory footprint** — Chrome DevTools Protocol `Performance.getMetrics` returns V8 + Blink counters. We capture `JSHeapUsedSize`, `JSHeapTotalSize`, `Nodes`, `LayoutCount`, `RecalcStyleCount`, `ScriptDuration`, `TaskDuration`.

### 2.4 Effect-render scaling (regression cost)

The marketing site's `VirtualScrollGrid` renders cards in batches of `BATCH_SIZE=24`. We answer two questions:

1. **Does virtual scrolling actually kick in?** — Verify the initial card count is `≤ BATCH_SIZE × 2` (the IntersectionObserver with `rootMargin: 400px` may pre-load one extra batch). If the initial count equals the total effect count (1569), virtual scrolling is broken.
2. **How does the page behave as cards accumulate?** — For `N ∈ {10, 50, 100, 500, 1000}` we inject N synthetic effect-card DOM nodes (mirroring the real `EffectCard` markup) into a hidden container, then measure:
   - **render time** — `performance.now()` before/after the synchronous append
   - **DOM count** — `document.querySelectorAll('*').length` after the append
   - **memory delta** — `JSHeapUsedSize` after minus before

This catches regressions where, e.g., a new framer-motion wrapper doubles per-card cost.

---

## 3. Tools

| Tool | Used for | Why this tool |
|---|---|---|
| **Node `zlib`** | gzip + brotli compression of artifacts | No external binary dependency; deterministic across CI runners. |
| **Node `fs.statSync`** | Raw file sizes | Synchronous, no race conditions in the harness. |
| **Python `playwright` (sync API)** | Headless Chromium orchestration | Already installed at `/home/z/.venv/bin/playwright` with `chromium-1228`. Used by the TypeScript orchestrators via `Bun.spawn`. Avoids modifying `package.json`. |
| **Chrome DevTools Protocol** | Memory metrics, long-task timing | `Performance.getMetrics` and `Performance.enable` give us V8 heap + DOM node counts that aren't exposed through the Web Performance API. |
| **Web Performance API** | TTFB/FCP/LCP/CLS/TBT | The browser-native source of truth — same data Lighthouse uses. |
| **Custom orchestrator (`scripts/bench/run.ts`)** | Sequence + report | Single-command `bun run scripts/bench/run.ts` produces `performance/REPORT.md` with tables, ASCII charts, and pass/fail status. |

### 3.1 Why not Lighthouse?

Lighthouse is the gold standard for lab CWV measurement, but:

1. It adds ~45 s to every benchmark run (vs 8 s with raw Playwright).
2. Its `npx lighthouse` invocation requires a separate binary that isn't pinned in the lockfile.
3. We need **memory + DOM count + scroll FPS** in the same run — Lighthouse doesn't expose these in its JSON output without custom plugins.
4. Our Web Performance API + CDP capture is **the same data Lighthouse computes internally** (Lighthouse uses PerformanceObserver + Trace parsing under the hood).

We therefore ship a Lighthouse-equivalent harness with custom extensions. If a future task requires Lighthouse's "SEO" or "Accessibility" scores, it should add Lighthouse as a *supplemental* tool, not a replacement.

### 3.2 Why Python Playwright instead of `@playwright/test`?

The task constraint says "don't modify `package.json`" but also "use the existing playwright if it's already there." `@playwright/test` is not in `node_modules`, but `playwright` Python bindings are installed in the system venv at `/home/z/.venv/bin/python`. We bridge via `Bun.spawn(["/home/z/.venv/bin/python", "performance/_playwright_bench.py", ...])` — zero new JS dependencies, zero `package.json` churn, full Playwright power. See `ADR.md` §3 for the alternatives we rejected.

### 3.3 Fallback: `agent-browser`

If a future CI runner lacks Python+Playwright (e.g. a minimal Docker image), the runtime benchmarks can fall back to `agent-browser`, which uses the same headless Chromium but exposes a smaller API surface. The fallback path is documented in `BENCHMARKS.md` §6. The fallback cannot measure TBT (no longtask observer) or memory (no CDP session) — those rows will be `N/A (fallback mode)` in the report.

---

## 4. Budgets

Budgets live in `performance/budgets.json` so they're machine-readable and CI-gateable. The orchestrator loads them at startup and emits `PASS`/`FAIL` per row. Current values:

| Metric | Budget | Rationale |
|---|---|---|
| `roycss.min.css` (gzipped) | `< 150 KB` | CWV "Good" LCP needs the primary CSS to download in <1s on 3G (1.6 Mbps ≈ 200 KB/s). 150 KB gz leaves headroom for HTML + JS. |
| `effects.json` (gzipped) | `< 100 KB` | Metadata is loaded eagerly; should be a fraction of the CSS. |
| `roycss.css` (raw) | `< 1.5 MB` | Source map / dev experience ceiling. |
| `roycss.min.css` (raw) | `< 1.1 MB` | Minifier should achieve ≥ 83% ratio of raw. |
| LCP | `< 2.5 s` | CWV "Good" threshold (75th percentile). |
| TBT | `< 200 ms` | CWV "Good" threshold. |
| CLS | `< 0.1` | CWV "Good" threshold. |
| FCP | `< 1.8 s` | CWV "Good" threshold. |
| TTI | `< 3.8 s` | CWV "Good" threshold (approximation). |
| DOM nodes (initial load) | `< 1000` | Verifies virtual scrolling. Without it: ~39,000 nodes. |
| Scroll FPS (5 s average) | `≥ 50 fps` | Below 50 = visibly janky. |
| Per-card render time @ 1000 cards | `< 200 ms` | Synthetic append — guards against per-card React cost regression. |

Budgets are **reviewable and adjustable** — bump them only with a written justification in the worklog and an updated ADR.

---

## 5. Measurement cadence

| Cadence | Where | Action |
|---|---|---|
| **Every PR** | CI gate | `bun run scripts/bench/run.ts` — must exit 0. |
| **Every release tag** | Release pipeline | Same as above + archive `performance/REPORT.md` to `performance/results/<timestamp>-REPORT.md` for trend analysis. |
| **Manual** | Developer laptop | `bun run performance/bundle-size.ts` for fast iteration on bundle size only. |

A failed budget row fails the build. There is no "warning" tier — either we ship the budget or we ship a budget change.

---

## 6. Reproducibility

To make runs deterministic:

1. **Single browser launch** per benchmark file — no warmup vs cold-load ambiguity.
2. **Headless Chromium** — no display server variance.
3. **Fixed viewport**: `1280 × 800` (desktop, matches Lighthouse default).
4. **`wait_until: 'domcontentloaded'`** for navigation, then a fixed 3 s settle for `networkidle` to stabilize before reading observers. (Using `networkidle` directly is flaky with Next.js HMR.)
5. **3 runs** for runtime metrics, **median** reported. (Bundle-size is deterministic — single run.)
6. **No CPU throttling** — we measure the *actual* dev machine; CI normalizes by recording machine class in the report header.

---

## 7. Failure modes & honest reporting

The harness must never silently fudge a number. Specific policies:

- **Missing artifact** → `FAIL` with `error: 'file not found'`. Never `0`.
- **Playwright crash** → `FAIL` with `error: '<message>'`. Never omit the row.
- **Budget exceeded** → `FAIL` with `actual` and `budget` printed side-by-side.
- **Budget unmet because of N/A** → `N/A` (not `PASS`, not `FAIL`). The CI gate fails if any row is `N/A` unless `--allow-na` is passed.
- **Median of 3 runs has >10% variance** → flag with `⚠ unstable` in the report. Doesn't fail the gate, but prompts investigation.

---

## 8. Open questions

1. **Should we add a "production build" mode?** Currently we benchmark against `next dev` on port 3000. A `next build` + `next start` would give more realistic numbers (no HMR overhead, no sourcemaps). Future task.
2. **Should we measure on mobile viewport (375 × 667)?** Likely yes; deferred until the desktop baseline is green.
3. **Should we add real-user monitoring (RUM)?** Out of scope for this task; the lab harness is the foundation, RUM is the next layer.
