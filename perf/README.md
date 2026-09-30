# RoyCSS Performance Engineering

This directory owns **performance measurement, regression testing, and
optimization** for the RoyCSS catalog (1,983 effects, 1.42 MB CSS bundle —
`dist/roycss.min.css` = 1,486,452 B).

## Layout

```
perf/
├── README.md                         this file
├── benchmark.ts                      main harness — runs every benchmark
├── benchmarks/
│   ├── bundle-size.ts                fs.statSync on dist/ artifacts
│   ├── effect-count.ts               catalog counts, dupes, color coverage
│   ├── css-injection.ts              DynamicEffectCSS injection timing
│   ├── virtual-scroll.ts             VirtualScrollGrid render cost
│   ├── animation-jank.ts             theoretical fps for top 20 effects
│   └── memory-footprint.ts           per-effect heap cost
├── budget.json                       page-level budgets enforced by the CI perf-gate
├── optimize/
│   └── extract-critical-css.ts       builds dist/roycss-critical.css (top 50)
└── results/
    └── benchmark-report.json         last run results (auto-generated, gitignored)
```

## Quick start

```bash
# 1. Ensure dist/ is built (contains roycss.css, roycss.min.css, effects.json).
bun run build:package

# 2. Run the full benchmark suite.
bun run perf/benchmark.ts

# 3. (Optional) Regenerate the critical-CSS extract.
bun run perf/optimize/extract-critical-css.ts
```

## Benchmark budgets

| Benchmark | Target | Comparator |
|---|---|---|
| `roycss.css` size | <1.9 MB (measured 1.72 MB) | `<` |
| `roycss.min.css` size | <1.55 MB (measured 1.42 MB) | `<` |
| `effects.json` size | <700 KB (measured 692 KB) | `<` |
| `effects.js` / `effects.cjs` | <570 KB each (measured ≈525 KB — full metadata bundles, see note) | `<` |
| Total effects | =1983 | `eq` |
| Distinct categories | =29 | `eq` |
| Per-effect CSS avg | <1 KB | `<` |
| Per-effect JSON avg | <0.4 KB | `<` |
| Duplicate cssCode blocks | =0 | `<` (i.e. `< 1`) |
| Duplicate @keyframes names | =0 | `<` (i.e. `< 1`) |
| prefers-reduced-motion coverage | ≥100% | `gte` |
| color-mix() occurrences | >5000 | `gt` |
| OKLCH color ratio | >90% | `gt` |
| Inject 1 effect | <0.2 ms | `<` |
| Inject 10 effects | <2 ms | `<` |
| Inject 100 effects | <20 ms | `<` |
| Render 100 cards | <0.5 ms | `<` |
| Render 1983 cards | <8 ms | `<` |
| GPU-accelerated ratio (top 20) | ≥80% | `gte` |
| Catalog heap | <1 MB | `<` |
| Per-effect metadata heap | <2 KB | `<` |
| JSON.parse(effects.json) | <50 ms | `<` |

The harness exits 0 if every benchmark with a budget is within budget, or 1
if any fail. Use this as a CI gate.

> **Budget re-basing (issue #272):** the previous bundle targets
> (<1.5 MB raw / <1.1 MB min / <10 KB `effects.js` loader) predate catalog
> batches 35–54 and were breached by every build since (the 10 KB "loader"
> goal predates bundling the full effects metadata into `effects.js`).
> Targets above are the current measured sizes plus headroom — the same
> convention `perf/budget.json` uses. These bundle rows are enforced only
> by the manual `bun run perf:benchmark` harness (`perf/benchmarks/bundle-size.ts`);
> the CI **perf-gate** job enforces the separate page-level budgets in
> [`perf/budget.json`](budget.json) via `bun run perf:budget`.

## Output formats

`bun run perf/benchmark.ts` produces:

1. A human-readable table on stdout (one table per benchmark suite).
2. A JSON report at `perf/results/benchmark-report.json` with the schema:

```json
{
  "schema": "roycss.perf.v1",
  "startedAt": "ISO timestamp",
  "finishedAt": "ISO timestamp",
  "elapsedMs": 123.45,
  "summary": { "total": N, "pass": N, "fail": N, "info": N, "exitCode": 0|1 },
  "suites": [{ "name": "...", "results": [BenchmarkResult, ...] }]
}
```

Each `BenchmarkResult` is:

```ts
{
  id: string;            // stable identifier e.g. "bundle-size/roycss.css"
  label: string;         // human-readable table label
  value: number;         // measured value
  unit: "bytes" | "ms" | "count" | "ratio" | "fps";
  target?: number;       // budget threshold
  comparator?: "lt" | "lte" | "gt" | "gte" | "eq";
  status: "pass" | "fail" | "info";
  details?: string;
}
```

## Regression guards

`perf/regression.test.ts` was **removed** (2026-10, issue #272): it was a
`bun:test` suite never wired into any CI workflow, its cssCode extractor
capped at batches 1–34 (the catalog has 54), and its bundle thresholds
(<1.5 MB raw / <1.1 MB min) were stale against the shipped artifacts.
Its still-relevant assertions live in gates that actually run:

- **CI perf-gate job** — `bun run perf:budget` against
  [`perf/budget.json`](budget.json) (page-level budgets; the Lighthouse
  PR workflow covers the same page from the lab side).
- **Catalog invariants** — [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts)
  pins exactly 1,983 effects; [`tests/unit/categories.test.ts`](../tests/unit/categories.test.ts)
  pins 29; [`tests/unit/design-tokens.test.ts`](../tests/unit/design-tokens.test.ts)
  guards OKLCH-only colors / `color-mix()` usage (the old hex/rgba
  assertions).
- **Manual bundle benchmarks** — `bun run perf:benchmark`
  (`perf/benchmarks/bundle-size.ts`) with the re-based budgets above.

## Optimization: critical CSS

`perf/optimize/extract-critical-css.ts` builds
`dist/roycss-critical.css` containing:

- The base CSS (reset, sr-only, global prefers-reduced-motion block).
- The first 50 effect cssCodes (the above-the-fold set).

Measured size: ~18 KB (the top-50 above-the-fold extract — vs the
1.72 MB full bundle that is a ~99% reduction). Inline
this in `<head>` for sub-200ms first paint; lazy-load the full bundle
after `DOMContentLoaded`.

## Performance design references

- `perf/budget.json` — the page-level budget ratchet enforced by the CI
  perf-gate job (`bun run perf:budget`, `.github/workflows/ci.yml`).
- `scripts/perf-budget.ts` — the gate implementation (Playwright + LHCI
  measurements, budget report artifact).
- `docs/benchmarks/04-npm-publish-pipeline.md` — measured numbers for the
  npm publish pipeline (tarball size, artifact inventory).
- `bun run size` (size-limit) — consumer-facing bundle budget for the
  critical CSS + effects loader.
- `perf/benchmark.ts` — the manual benchmark harness (this directory).
