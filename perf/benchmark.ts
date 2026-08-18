/**
 * RoyCSS Performance Benchmark Harness
 * =====================================
 *
 * Runs every benchmark in `perf/benchmarks/` in sequence, aggregates the
 * results, prints a human-readable table, writes a JSON report to
 * `perf/results/benchmark-report.json`, and exits 0 if all benchmarks with
 * a budget are within budget, or 1 if any fail.
 *
 * Run:
 *   cd /home/z/my-project && bun run perf/benchmark.ts
 */

import { runBundleSizeBenchmark } from "./benchmarks/bundle-size";
import { runEffectCountBenchmark } from "./benchmarks/effect-count";
import { runCssInjectionBenchmark } from "./benchmarks/css-injection";
import { runVirtualScrollBenchmark } from "./benchmarks/virtual-scroll";
import { runAnimationJankBenchmark } from "./benchmarks/animation-jank";
import { runMemoryFootprintBenchmark } from "./benchmarks/memory-footprint";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type Status = "pass" | "fail" | "info";

export interface BenchmarkResult {
  /** Stable identifier, e.g. "bundle-size/roycss.css". */
  id: string;
  /** Human-readable label for tables. */
  label: string;
  /** Measured value. */
  value: number;
  /** Unit, e.g. "bytes", "ms", "count", "ratio". */
  unit: string;
  /** Budget threshold (optional — `info` rows omit this). */
  target?: number;
  /** How to compare value to target. Defaults to "lt". */
  comparator?: "lt" | "lte" | "gt" | "gte" | "eq";
  /** Computed status: pass/fail if target present, otherwise info.
   *  Optional at construction time — the `evaluate` function below fills
   *  this in based on `target` and `comparator`. Individual benchmark
   *  modules therefore do not need to set `status` themselves. */
  status?: Status;
  /** Free-form details string. */
  details?: string;
}

export type BenchmarkSuite = BenchmarkResult[];

function evaluate(result: BenchmarkResult): BenchmarkResult {
  if (result.target === undefined) {
    return { ...result, status: "info" };
  }
  const cmp = result.comparator ?? "lt";
  let ok = false;
  switch (cmp) {
    case "lt":  ok = result.value <  result.target; break;
    case "lte": ok = result.value <= result.target; break;
    case "gt":  ok = result.value >  result.target; break;
    case "gte": ok = result.value >= result.target; break;
    case "eq":  ok = result.value === result.target; break;
  }
  return { ...result, status: ok ? "pass" : "fail" };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(3)} MB`;
}

function formatValue(r: BenchmarkResult): string {
  switch (r.unit) {
    case "bytes": return formatBytes(r.value);
    case "ms":    return `${r.value.toFixed(2)} ms`;
    case "ratio": return `${(r.value * 100).toFixed(2)}%`;
    case "fps":   return `${r.value.toFixed(1)} fps`;
    default:      return String(r.value);
  }
}

function formatTarget(r: BenchmarkResult): string {
  if (r.target === undefined) return "—";
  let cmp: string;
  switch (r.comparator) {
    case "gt":  cmp = ">";  break;
    case "gte": cmp = "≥";  break;
    case "eq":  cmp = "=";  break;
    case "lte": cmp = "≤";  break;
    default:    cmp = "<";  break;
  }
  switch (r.unit) {
    case "bytes": return `${cmp} ${formatBytes(r.target)}`;
    case "ms":    return `${cmp} ${r.target} ms`;
    case "ratio": return `${cmp} ${(r.target * 100).toFixed(0)}%`;
    case "fps":   return `${cmp} ${r.target} fps`;
    default:      return `${cmp} ${r.target}`;
  }
}

function printTable(results: BenchmarkResult[]): void {
  const cols = ["STATUS", "BENCHMARK", "MEASURED", "BUDGET", "DETAILS"];
  const rows = results.map((r) => [
    r.status === "pass" ? "✓ PASS" : r.status === "fail" ? "✗ FAIL" : "  INFO",
    r.label,
    formatValue(r),
    formatTarget(r),
    (r.details ?? "").slice(0, 60),
  ]);
  const widths = cols.map((c, i) =>
    Math.max(c.length, ...rows.map((r) => r[i].length))
  );
  const sep = "─";
  const line = (cells: string[]) =>
    cells.map((c, i) => ` ${c.padEnd(widths[i]) }`).join(" │ ");
  const rule = "─" + widths.map((w) => sep.repeat(w + 2)).join("─┼─") + "─";
  console.log(rule);
  console.log(line(cols));
  console.log(rule);
  for (const r of rows) console.log(line(r));
  console.log(rule);
}

async function main(): Promise<number> {
  const projectRoot = join(__dirname, "..");
  const distDir = join(projectRoot, "dist");
  const startedAt = new Date().toISOString();
  const t0 = process.hrtime.bigint();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  RoyCSS Performance Benchmark Harness");
  console.log(`  started: ${startedAt}`);
  console.log(`  dist:    ${distDir}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  const suites: { name: string; results: BenchmarkResult[] }[] = [];

  // 1. Bundle size — fs.statSync on every dist artifact.
  console.log("▶ bundle-size  …");
  const bundle = runBundleSizeBenchmark(distDir);
  suites.push({ name: "bundle-size", results: bundle.map(evaluate) });

  // 2. Effect count + per-effect averages + duplicates + keyframe coverage.
  console.log("▶ effect-count …");
  const counts = runEffectCountBenchmark(distDir, projectRoot);
  suites.push({ name: "effect-count", results: counts.map(evaluate) });

  // 3. CSS injection timing — DynamicEffectCSS-equivalent injection for 1/10/100.
  console.log("▶ css-injection …");
  const inject = runCssInjectionBenchmark(projectRoot);
  suites.push({ name: "css-injection", results: inject.map(evaluate) });

  // 4. Virtual scroll render time — synthetic measurement for 100/1000/1569 items.
  console.log("▶ virtual-scroll …");
  const vs = runVirtualScrollBenchmark(projectRoot);
  suites.push({ name: "virtual-scroll", results: vs.map(evaluate) });

  // 5. Animation jank — theoretical frame budget for the top 20 effects.
  console.log("▶ animation-jank …");
  const jank = runAnimationJankBenchmark(projectRoot);
  suites.push({ name: "animation-jank", results: jank.map(evaluate) });

  // 6. Memory footprint — estimate per-effect-card heap cost.
  console.log("▶ memory-footprint …");
  const mem = runMemoryFootprintBenchmark(projectRoot);
  suites.push({ name: "memory-footprint", results: mem.map(evaluate) });

  const t1 = process.hrtime.bigint();
  const elapsedMs = Number(t1 - t0) / 1e6;

  const allResults = suites.flatMap((s) => s.results);
  const failures = allResults.filter((r) => r.status === "fail");
  const passes = allResults.filter((r) => r.status === "pass");
  const infos = allResults.filter((r) => r.status === "info");

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════════════════════════\n");
  for (const s of suites) {
    console.log(`▼ ${s.name}`);
    printTable(s.results);
    console.log();
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  SUMMARY    pass=${passes.length}  fail=${failures.length}  info=${infos.length}  elapsed=${elapsedMs.toFixed(1)}ms`);
  if (failures.length > 0) {
    console.log("  FAILURES:");
    for (const f of failures) {
      console.log(`    ✗ ${f.label}: ${formatValue(f)} (budget ${formatTarget(f)}) — ${f.details ?? ""}`);
    }
  }
  console.log("═══════════════════════════════════════════════════════════════\n");

  const report = {
    schema: "roycss.perf.v1",
    startedAt,
    finishedAt: new Date().toISOString(),
    elapsedMs: Number(elapsedMs.toFixed(2)),
    summary: {
      total: allResults.length,
      pass: passes.length,
      fail: failures.length,
      info: infos.length,
      exitCode: failures.length > 0 ? 1 : 0,
    },
    suites: suites.map((s) => ({ name: s.name, results: s.results })),
  };

  const outDir = join(__dirname, "results");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "benchmark-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf-8");
  console.log(`▸ JSON report written to ${outPath}\n`);

  return failures.length > 0 ? 1 : 0;
}

main().then((code) => {
  process.exit(code);
}).catch((err) => {
  console.error("Benchmark harness crashed:", err);
  process.exit(2);
});
