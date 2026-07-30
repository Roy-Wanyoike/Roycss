/**
 * bundle-size.ts — Measure dist/ artifacts with fs.statSync.
 *
 * Reads:
 *   - dist/roycss.css       (full bundle, 1.18 MB target)
 *   - dist/roycss.min.css   (minified, 990 KB target)
 *   - dist/effects.json     (effect metadata, <700 KB)
 *   - dist/effects.js       (loader module, <10 KB)
 *   - dist/effects.cjs      (CommonJS loader, <10 KB)
 *
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
      target: 1.5 * 1024 * 1024,
      comparator: "lt",
      details: "Initial CSS bundle (all 1569 effects)",
    },
    {
      id: "bundle-size/roycss.min.css",
      label: "roycss.min.css",
      value: min,
      unit: "bytes",
      target: 1.1 * 1024 * 1024,
      comparator: "lt",
      details: "Minified production bundle",
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
      label: "effects.js (ESM loader)",
      value: js,
      unit: "bytes",
      target: 10 * 1024,
      comparator: "lt",
      details: "ESM loader that reads effects.json at runtime",
    },
    {
      id: "bundle-size/effects.cjs",
      label: "effects.cjs (CJS loader)",
      value: cjs,
      unit: "bytes",
      target: 10 * 1024,
      comparator: "lt",
      details: "CommonJS loader (mirror of effects.js)",
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
