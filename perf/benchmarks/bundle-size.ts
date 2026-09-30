/**
 * bundle-size.ts — Measure dist/ artifacts with fs.statSync.
 *
 * Reads:
 *   - dist/roycss.css       (full bundle — measured 1.72 MB, budget 1.9 MB)
 *   - dist/roycss.min.css   (minified — measured 1.42 MB, budget 1.55 MB)
 *   - dist/effects.json     (effect metadata — measured 692 KB, budget <700 KB)
 *   - dist/effects.js       (full effects metadata as ESM — measured ≈525 KB)
 *   - dist/effects.cjs      (CommonJS mirror — same size)
 *
 * Targets re-based to measured + headroom in issue #272 (the old 1.5/1.1 MB
 * and 10 KB-loader targets predate catalog batches 35–54). The consumer-
 * facing ratchet for these same artifacts is `.size-limit.json` (`bun run size`).
 * The minification ratio (min/raw) is also reported as an info row to
 * surface any regression in the CSS minifier's effectiveness.
 */

import { statSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkResult } from "../benchmark";

function size(path: string): number {
  if (!existsSync(path)) {
    throw new Error(`Required dist artifact missing: ${path}`);
  }
  return statSync(path).size;
}

export function runBundleSizeBenchmark(distDir: string): BenchmarkResult[] {
  const raw = size(join(distDir, "roycss.css"));
  const min = size(join(distDir, "roycss.min.css"));
  const json = size(join(distDir, "effects.json"));
  const js = size(join(distDir, "effects.js"));
  const cjs = size(join(distDir, "effects.cjs"));
  const minRatio = min / raw;

  return [
    {
      id: "bundle-size/roycss.css",
      label: "roycss.css (raw)",
      value: raw,
      unit: "bytes",
      target: 1.9 * 1024 * 1024,
      comparator: "lt",
      details: "Full CSS bundle (all 1,983 effects; re-based issue #272)",
    },
    {
      id: "bundle-size/roycss.min.css",
      label: "roycss.min.css",
      value: min,
      unit: "bytes",
      target: 1.55 * 1024 * 1024,
      comparator: "lt",
      details: "Minified production bundle (re-based issue #272)",
    },
    {
      id: "bundle-size/effects.json",
      label: "effects.json",
      value: json,
      unit: "bytes",
      target: 700 * 1024,
      comparator: "lt",
      details: "Effect metadata (no cssCode — CSS lives in roycss.css)",
    },
    {
      id: "bundle-size/effects.js",
      label: "effects.js (ESM metadata)",
      value: js,
      unit: "bytes",
      target: 570 * 1024,
      comparator: "lt",
      details: "Full effects metadata bundled as ESM (auto-generated; measured ≈525 KB) — the old <10 KB loader goal predates bundling the corpus",
    },
    {
      id: "bundle-size/effects.cjs",
      label: "effects.cjs (CJS metadata)",
      value: cjs,
      unit: "bytes",
      target: 570 * 1024,
      comparator: "lt",
      details: "CommonJS mirror of effects.js (re-based issue #272)",
    },
    {
      id: "bundle-size/min-ratio",
      label: "min/raw ratio",
      value: minRatio,
      unit: "ratio",
      target: 0.95,
      comparator: "lt",
      details: "Lower is better — how aggressive is the minifier",
    },
    {
      id: "bundle-size/total-dist",
      label: "total dist/ size",
      value: raw + min + json + js + cjs,
      unit: "bytes",
      details: "Sum of all published artifacts (raw + min + json + js + cjs)",
    },
  ];
}
