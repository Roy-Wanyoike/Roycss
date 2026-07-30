# RoyCSS Performance ADRs

> **Status:** Accepted
> **Owner:** Performance Engineering domain
> **Last updated:** 2026-07-31
> **Companion docs:** `DESIGN.md` (methodology), `BENCHMARKS.md` (measured numbers), `IMPLEMENTATION-PLAN.md` (CI wiring), `REVIEW-CHECKLIST.md` (reviewer steps)

This file records the architectural decisions behind the RoyCSS performance benchmark suite. Each ADR follows the [MADR](https://adr.github.io/madr/) template-lite: Context → Decision → Consequences → Alternatives → Status.

---

## ADR-001: Bundle size budget — 150 KB gzipped CSS, 100 KB gzipped metadata

### Context

RoyCSS ships **1,569 effects** across 20 categories. The unminified `roycss.css` is 1.153 MB; the minified `roycss.min.css` is 989.69 KB raw / **99.04 KB gzipped**. `effects.json` is 534.25 KB raw / **63.39 KB gzipped**.

If we set no ceiling, the bundle drifts upward with every effect addition. The LABS-33 performance lab documented V1 at 704.9 KB and the V2 target at 280 KB; the current catalog is 1.6× larger than V1's 700 effects, so the absolute size has grown but per-effect bytes have shrunk.

### Decision

Adopt the following budgets as CI gate failures:

| Artifact | Budget (gzipped) | Budget (raw) |
|---|---|---|
| `dist/roycss.min.css` | **< 150 KB** | < 1.1 MB |
| `dist/effects.json` | **< 100 KB** | < 700 KB |
| `dist/roycss.css` | — | < 1.5 MB (dev backstop) |
| `cli/index.js` | — | < 2.0 MB |
| `mcp-server/index.js` (after build) | — | < 100 KB |

### Consequences

- **+** Every PR that adds an effect either stays under budget or explicitly raises the budget (with written justification).
- **+** The 150 KB / 100 KB ceilings leave headroom for ~50% catalog growth before we hit them.
- **−** When we approach the ceiling, we'll need either critical-CSS extraction (already shipped as `dist/roycss-critical.css`, 17 KB) or per-category code-splitting.

### Alternatives considered

- **"No budgets, ship everything"** — rejected. Without a ceiling, the bundle grows monotonically. LABS-33 documented V1 hitting 704.9 KB and jank DoS at 521 simultaneous animations.
- **Per-effect file shipping** — rejected for the marketing site (HTTP/2 multiplexing helps, but 1569 requests still costs ~1.5 s of TCP/setup). Kept as a future option for the npm package (where consumers tree-shake).
- **CSS-by-category files** — deferred. Would require a build change to emit `roycss-animations.css`, `roycss-loaders.css`, etc. Per-category sizing is *reported* in `bundle-size.ts` (informs future splitting) but not yet shipped.

### Status

**Accepted.** Live in `performance/budgets.json`. Currently passing: roycss.min.css.gz = 99.04 KB (< 150 KB ✓), effects.json.gz = 63.39 KB (< 100 KB ✓).

---

## ADR-002: Runtime perf budget — CWV "Good" thresholds + DOM ceiling

### Context

Lighthouse "Good" thresholds for Core Web Vitals are widely published: LCP < 2.5 s, TBT < 200 ms, CLS < 0.1, FCP < 1.8 s, TTI < 3.8 s. We adopt these as the floor.

The RoyCSS-specific concern is DOM node count. With 1569 effects × ~25 nodes per `EffectCard`, an unwindowed grid would render ~39,000 DOM nodes. `VirtualScrollGrid` (`src/components/roycss/virtual-scroll-grid.tsx`) batches renders in `BATCH_SIZE = 24` and grows on sentinel intersection. The marketing site's hero, nav, sidebar, and footer add another ~1000 baseline nodes.

### Decision

| Metric | Budget | Source |
|---|---|---|
| LCP | `< 2.5 s` | CWV |
| FCP | `< 1.8 s` | CWV |
| TTI | `< 3.8 s` | CWV |
| TBT | `< 200 ms` | CWV |
| CLS | `< 0.1` | CWV |
| **DOM nodes (initial load)** | **< 1000** | RoyCSS-specific |
| **Scroll FPS (5 s avg)** | **≥ 50 fps** | RoyCSS-specific |

The DOM ceiling is the more meaningful gate for this codebase — it directly verifies virtual scrolling. CWV numbers from a dev-server run are useful as a regression baseline but won't match production CDN numbers exactly.

### Consequences

- **+** A broken virtual-scroll implementation (e.g. someone removes the IntersectionObserver) shows up as `DOM nodes = ~39000` and fails CI immediately.
- **+** Scroll FPS catches animation-storm regressions where too many `will-change` or `backdrop-filter` effects enter the viewport simultaneously.
- **−** CWV numbers from `next dev` include HMR + sourcemap overhead and are ~30% worse than `next build`. The budget is calibrated for dev; production should beat it.

### Alternatives considered

- **Lighthouse-only** — rejected. Lighthouse doesn't expose DOM count or memory metrics without plugins, and adds 45 s to CI.
- **RUM-only (no lab)** — rejected. RUM has too much variance to gate PRs on; lab is the floor, RUM is the ceiling.
- **DOM ceiling = 600 (strict)** — rejected after measurement. The actual initial-load DOM count is ~4124 (hero + nav + sidebar + 24-48 effect cards × ~25 nodes). A 600 ceiling would require removing marketing content, not just virtual scrolling. We keep 1000 as the floor and document the actual number in BENCHMARKS.md as a known finding.

### Status

**Accepted.** The strict CWV rows are passing in dev. The DOM count of 4124 currently **fails** the `< 1000` budget — this is a real measurement, documented in BENCHMARKS.md §3, and a Phase 2 optimization candidate (collapse the hero, lazy-render the docs section).

---

## ADR-003: Measurement cadence — every PR, full suite, no skip flags

### Context

CI gates only work if they actually run. Skipping "just this once" is how 704.9 KB grew to 1.153 MB. We need a cadence that makes skipping impossible without a visible change.

### Decision

- **Every PR** touching `src/components/roycss/`, `src/lib/effects-batch-*.ts`, `dist/`, `public/`, or `next.config.ts` must run `bun run scripts/bench/run.ts` and exit 0.
- **Every release tag** archives `performance/REPORT.md` to `performance/results/<timestamp>-REPORT.md` for trend analysis.
- The orchestrator takes no `--skip-bundle` / `--skip-runtime` flags. If a benchmark can't run (e.g. dev server down), it fails loudly.
- Budget changes require a written justification in the PR description and an updated ADR row.

### Consequences

- **+** No silent regressions. A 10 KB CSS bump fails the build until either the effect is optimized or the budget is raised with justification.
- **+** Archived reports give us a trend line — we can see "LCP was 1.2 s in v1.2, 1.4 s in v1.3, 1.8 s in v1.4" and catch slow drift.
- **−** Adds ~10 s to every CI run. Acceptable; bundle-size is <1 s, runtime is ~8 s.
- **−** Developers must keep `localhost:3000` running for the runtime bench. CI must start a dev server in the background.

### Alternatives considered

- **Weekly cadence** — rejected. By the time a regression is caught, dozens of PRs have stacked on top; bisection is painful.
- **Nightly cadence** — rejected. Same problem, smaller window.
- **PRs that touch only `docs/` skip the gate** — rejected. A docs change can still add a heavy image to `public/` and inflate the bundle.

### Status

**Accepted.** Live as a GitHub Actions job (see `IMPLEMENTATION-PLAN.md` for the workflow YAML).

---

## ADR-004: Virtual scrolling threshold — 24 cards × 4 columns, sentinel-based, no real windowing

### Context

`VirtualScrollGrid` (`src/components/roycss/virtual-scroll-grid.tsx`) is **not** a true virtual scroller. It's a lazy loader: it renders `visibleCount` cards linearly (starting at 24, growing by 24 each sentinel intersection). Once a card is rendered, it stays in the DOM. This is a deliberate trade-off — true windowing (with absolute positioning + spacer divs) is complex to integrate with framer-motion's `useInView` per-card reveal animation.

The current implementation:
- `BATCH_SIZE = 24` (initial + increment)
- `OVERSCAN = 8` (declared but unused in the render path)
- `IntersectionObserver` with `rootMargin: "400px"` (pre-loads ~1 batch early)
- Listens for `roycss-load-all-cards` event to fully expand when a user clicks a nav link below the grid (so smooth-scroll target stays stable)

### Decision

**Keep the lazy-loader architecture.** Add a benchmark that verifies the initial render is `≤ BATCH_SIZE × 2 = 48` cards (the IntersectionObserver's 400px rootMargin may trigger one pre-load on initial mount). The threshold check is:

```
initialCardCount ≤ 48  →  virtual scrolling is working
initialCardCount > 48   →  FAIL, virtual scrolling is broken
```

We do **not** adopt true DOM windowing in this ADR. The performance budget (DOM `< 1000` nodes) is the contract; the implementation is free to meet it however it likes. If a future effect-card design pushes per-card DOM count above ~20 nodes, the budget will fail and we'll reconsider windowing at that point.

### Consequences

- **+** Lazy loading is simple, debuggable, and preserves framer-motion's per-card reveal animations.
- **+** The `roycss-load-all-cards` event gives us stable smooth-scroll targets without a windowing-position-calculation tax.
- **−** DOM count grows linearly with scroll depth. A user who scrolls to the bottom has 1569 cards × 25 nodes ≈ 39,000 nodes in the DOM. This is acceptable for the marketing site (the user explicitly chose to browse everything) but would be unacceptable for a dashboard.
- **−** The declared `OVERSCAN = 8` is dead code. Should be removed in a future cleanup.

### Alternatives considered

- **True virtual scrolling (windowing)** — rejected. Requires absolute positioning, spacer divs, and breaks framer-motion's `useInView` trigger (cards would unmount when scrolled out of view, re-triggering the entrance animation on every re-entry). The complexity isn't worth it for a marketing site.
- **Pagination (24 per page, click "next")** — rejected. Worse UX than infinite scroll for a browsing catalog.
- **Increase BATCH_SIZE to 48 or 96** — deferred. 24 is responsive on a 4-column desktop grid (6 rows). If scroll FPS benchmarks show jank at the batch boundary, we'll revisit.

### Status

**Accepted.** The `effect-render-bench.ts` script verifies the threshold on every run.

---

## ADR-005: Playwright via Python subprocess, not `@playwright/test` npm package

### Context

The task constraint says "don't modify `package.json`" but also "use the existing playwright if it's already there." `@playwright/test` is **not** in `node_modules`. However, the sandbox has Python Playwright installed at `/home/z/.venv/bin/playwright` (v1.57.0) with `chromium-1228` browsers cached at `/home/z/.cache/ms-playwright/`.

### Decision

Bridge to Python Playwright via `Bun.spawn(["/home/z/.venv/bin/python", "performance/_playwright_bench.py", ...])`. The TypeScript orchestrator (`runtime-bench.ts`, `effect-render-bench.ts`) spawns the Python helper, passes JSON config via argv, and reads JSON results from stdout. This:

- Adds **zero** npm dependencies
- Adds **zero** bytes to `package.json`
- Reuses a battle-tested Playwright install
- Keeps the report-generation logic in TypeScript (consistent with the rest of the perf harness)

### Consequences

- **+** No lockfile churn, no `bun install` needed, no version drift between `@playwright/test` and `playwright` Python.
- **+** Python's `sync_playwright` API is simpler than `@playwright/test`'s fixture-based test runner for our use case (we're benchmarking, not asserting).
- **−** Two languages in the perf suite. Mitigated by keeping the Python helper small (~250 lines, pure I/O) and the TypeScript orchestrators as the source of truth for budget logic + report formatting.
- **−** The Python venv path is hard-coded (`/home/z/.venv/bin/python`). If a CI runner doesn't have this exact path, the harness falls back to `python3` on `PATH`, and if that fails, falls back to `agent-browser` (per DESIGN.md §3.3).

### Alternatives considered

- **`bun add -d @playwright/test`** — rejected. Modifies `package.json`'s devDependencies (the task explicitly forbids this) and pulls in ~50 MB of browser binaries.
- **`agent-browser` only** — rejected. Doesn't expose CDP (no memory metrics) and doesn't support `PerformanceObserver` longtask tracking (no TBT). Kept as a fallback.
- **Pure Node `child_process` spawning `chromium` directly** — rejected. Reinvents wheel; loses Playwright's auto-waiting and selector engine.

### Status

**Accepted.** The Python helper is at `performance/_playwright_bench.py`; the bridge is `Bun.spawn` in `runtime-bench.ts` / `effect-render-bench.ts`.
