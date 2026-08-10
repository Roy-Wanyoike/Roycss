/**
 * Benchmark service — Roy Benchmark (perf vs industry).
 *
 * Mock backend (no DB). Seeds 6 benchmark comparisons vs industry
 * averages and 1 historical benchmark result. Run requests synthesize
 * a new result keyed on the requested suite.
 *
 * Reads are LRU-cached; new runs invalidate the results list.
 *
 * Future: persist via Prisma `BenchmarkResult` model and stream live
 * measurements from a CI integration.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  BenchmarkComparison,
  BenchmarkResult,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { BenchmarkRunInput } from "./schema.js";

const log = createLogger("benchmark");

const RESULTS_KEY = "benchmark:results";
const COMPARISONS_KEY = "benchmark:comparisons";
const resultKey = (id: string): string => `benchmark:result:${id}`;

function invalidate(id?: string): void {
  cache.delete(RESULTS_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: 6 benchmark comparisons ──────────────────────────────────────
const SEED_COMPARISONS: BenchmarkComparison[] = [
  {
    id: "cmp-bundle-size",
    metric: "Bundle size",
    unit: "KB",
    roycss: 128,
    industry: 184,
    delta: -30.4,
    better: "lower",
    description: "RoyCSS ships a 30% smaller bundle than the framework average.",
  },
  {
    id: "cmp-first-paint",
    metric: "First Contentful Paint",
    unit: "ms",
    roycss: 980,
    industry: 1620,
    delta: -39.5,
    better: "lower",
    description: "FCP is 39% faster than the industry median.",
  },
  {
    id: "cmp-lcp",
    metric: "Largest Contentful Paint",
    unit: "ms",
    roycss: 1820,
    industry: 2540,
    delta: -28.3,
    better: "lower",
    description: "LCP sits comfortably in the 'good' CWV range.",
  },
  {
    id: "cmp-cls",
    metric: "Cumulative Layout Shift",
    unit: "score",
    roycss: 0.06,
    industry: 0.14,
    delta: -57.1,
    better: "lower",
    description: "CLS is 57% lower than the industry average.",
  },
  {
    id: "cmp-runtime",
    metric: "Runtime overhead",
    unit: "ms",
    roycss: 4,
    industry: 22,
    delta: -81.8,
    better: "lower",
    description: "Almost zero runtime overhead — no JS in the critical path.",
  },
  {
    id: "cmp-maintainability",
    metric: "Maintainability score",
    unit: "/100",
    roycss: 92,
    industry: 68,
    delta: 35.3,
    better: "higher",
    description: "Maintainability index 35% above the industry baseline.",
  },
];

// ─── Seed: 1 historical benchmark result ────────────────────────────────
const SEED_RESULTS: BenchmarkResult[] = [
  {
    id: "bench-seed-001",
    suite: "roycss-default",
    url: "https://app.roycss.dev/dashboard",
    status: "complete",
    runs: 5,
    duration: 18_200,
    createdAt: "2025-02-18T10:00:00.000Z",
    metrics: [
      { name: "FCP", value: 980, unit: "ms", p50: 980, p75: 1080, p99: 1240 },
      { name: "LCP", value: 1820, unit: "ms", p50: 1820, p75: 1980, p99: 2240 },
      { name: "CLS", value: 0.06, unit: "score", p50: 0.06, p75: 0.08, p99: 0.12 },
      { name: "TTFB", value: 412, unit: "ms", p50: 412, p75: 480, p99: 620 },
      { name: "Runtime", value: 4, unit: "ms", p50: 4, p75: 5, p99: 8 },
      { name: "Bundle", value: 128, unit: "KB", p50: 128, p75: 128, p99: 128 },
    ],
    summary: "All metrics in the 'good' Core Web Vitals range.",
  },
];

let results: BenchmarkResult[] = SEED_RESULTS.map((r) => ({
  ...r,
  metrics: r.metrics.map((m) => ({ ...m })),
}));

/** List benchmark comparisons vs industry average. Cached. */
export async function listComparisons(): Promise<BenchmarkComparison[]> {
  return cacheWrap(
    COMPARISONS_KEY,
    () => Promise.resolve(SEED_COMPARISONS.map((c) => ({ ...c }))),
    CACHE_TTL.benchmarkComparisons,
  );
}

/** Get a single benchmark result by id. Throws 404 if missing. */
export async function getBenchmarkResultById(
  id: string,
): Promise<BenchmarkResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Benchmark result '${id}' not found`);
      return Promise.resolve({
        ...found,
        metrics: found.metrics.map((m) => ({ ...m })),
      });
    },
    CACHE_TTL.benchmarkResultDetail,
  );
}

/** Run a benchmark suite. Returns a synthetic complete result. */
export async function runBenchmark(
  input: BenchmarkRunInput,
): Promise<BenchmarkResult> {
  const id = `bench-${randomUUID()}`;
  const result: BenchmarkResult = {
    id,
    suite: input.suite,
    url: input.url,
    status: "complete",
    runs: input.runs ?? 5,
    duration: 14_000 + Math.floor(Math.random() * 8_000),
    createdAt: new Date().toISOString(),
    metrics: [
      { name: "FCP", value: 900 + Math.floor(Math.random() * 200), unit: "ms", p50: 980, p75: 1080, p99: 1240 },
      { name: "LCP", value: 1700 + Math.floor(Math.random() * 400), unit: "ms", p50: 1820, p75: 1980, p99: 2240 },
      { name: "CLS", value: Number((0.04 + Math.random() * 0.08).toFixed(2)), unit: "score", p50: 0.06, p75: 0.08, p99: 0.12 },
      { name: "TTFB", value: 300 + Math.floor(Math.random() * 300), unit: "ms", p50: 412, p75: 480, p99: 620 },
      { name: "Runtime", value: 3 + Math.floor(Math.random() * 4), unit: "ms", p50: 4, p75: 5, p99: 8 },
      { name: "Bundle", value: 120 + Math.floor(Math.random() * 20), unit: "KB", p50: 128, p75: 128, p99: 128 },
    ],
    summary: "All metrics in the 'good' Core Web Vitals range.",
  };
  results = [result, ...results].slice(0, 50);
  invalidate(id);
  log.info("Benchmark run started", { id, suite: input.suite, url: input.url });
  return result;
}

/** Test-only: reset to seed. */
export function _resetBenchmarkForTest(): void {
  results = SEED_RESULTS.map((r) => ({
    ...r,
    metrics: r.metrics.map((m) => ({ ...m })),
  }));
  invalidate();
  cache.delete(COMPARISONS_KEY);
}
