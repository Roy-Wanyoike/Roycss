# RoyCSS Performance Engineering

This directory owns **performance measurement, regression testing, and
optimization** for the RoyCSS catalog (1,569 effects, 1.18 MB CSS bundle).

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
├── optimize/
│   └── extract-critical-css.ts       builds dist/roycss-critical.css (top 50)
├── regression.test.ts                bun:test suite — guards against regressions
└── results/
    └── benchmark-report.json         last run results (auto-generated)
```

## Quick start

```bash
# 1. Ensure dist/ is built (contains roycss.css, roycss.min.css, effects.json).
bun run build:package

# 2. Run the full benchmark suite.
bun run perf/benchmark.ts

# 3. Run the regression tests.
bun test perf/regression.test.ts

# 4. (Optional) Regenerate the critical-CSS extract.
bun run perf/optimize/extract-critical-css.ts
```

## Benchmark budgets

| Benchmark | Target | Comparator |
|---|---|---|
| `roycss.css` size | <1.5 MB | `<` |
| `roycss.min.css` size | <1.1 MB | `<` |
| `effects.json` size | <700 KB | `<` |
| `effects.js` loader | <10 KB | `<` |
| Total effects | =1569 | `eq` |
| Distinct categories | =20 | `eq` |
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
| Render 1569 cards | <8 ms | `<` |
| GPU-accelerated ratio (top 20) | ≥80% | `gte` |
| Catalog heap | <1 MB | `<` |
| Per-effect metadata heap | <2 KB | `<` |
| JSON.parse(effects.json) | <50 ms | `<` |

The harness exits 0 if every benchmark with a budget is within budget, or 1
if any fail. Use this as a CI gate.

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

## Regression tests

`perf/regression.test.ts` (run with `bun test`) asserts:

- `dist/effects.json` has exactly 1,569 effects.
- `dist/roycss.css` is <1.5 MB.
- `dist/roycss.min.css` is <1.1 MB.
- Every effect has a non-empty `cssCode` (no broken exports).
- No effect uses raw `#hex` colors (must use OKLCH). One documented
  exception: `#fff` in `mask:` / `-webkit-mask:` properties, where it
  represents a luminance marker, not a design color.
- No effect uses raw `rgba()` (must use `color-mix()`).

These run independently of the benchmark harness and do not require
`process.hrtime.bigint()` to be stable.

## Optimization: critical CSS

`perf/optimize/extract-critical-css.ts` builds
`dist/roycss-critical.css` containing:

- The base CSS (reset, sr-only, global prefers-reduced-motion block).
- The first 50 effect cssCodes (the above-the-fold set).

Measured size: ~40–60 KB (vs 1.18 MB full bundle = 95% reduction). Inline
this in `<head>` for sub-200ms first paint; lazy-load the full bundle
after `DOMContentLoaded`.

## Performance design references

- `docs/adr/05-performance-engineering.md` — decision record.
- `docs/threat-models/05-performance-engineering.md` — perf-as-security.
- `docs/benchmarks/05-performance-engineering.md` — full measured numbers.
- `docs/plans/05-performance-engineering.md` — implementation plan.
- `docs/checklists/05-performance-engineering.md` — merge gate.
- `docs/LABS-33-PERFORMANCE-LAB.md` — the original V2 performance lab
  report (the design context for everything in this directory).
