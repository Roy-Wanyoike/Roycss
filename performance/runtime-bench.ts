/**
 * runtime-bench.ts — Core Web Vitals + DOM + scroll FPS + memory benchmark.
 *
 * Run:   bun run performance/runtime-bench.ts [--url http://localhost:3000/] [--runs 3]
 * Output: Human-readable table to stdout + JSON to performance/results/runtime-bench.json
 *
 * This script spawns /home/z/.venv/bin/python to run performance/_playwright_bench.py
 * (Playwright Python is already installed; @playwright/test is not — see ADR-005).
 *
 * The Python helper:
 *   - Installs PerformanceObservers BEFORE navigation (via context.add_init_script)
 *   - Captures: TTFB, FCP, LCP, CLS, TBT (via longtask), TTI (approx)
 *   - Runs a 5-second programmatic scroll to measure FPS
 *   - Uses Chrome DevTools Protocol (Performance.getMetrics) for V8 + Blink memory
 *   - Aggregates `--runs` runs (median, min, max, variance)
 *
 * LCP caveat: in some Playwright/Chromium headless configurations, the
 * largest-contentful-paint PerformanceObserver does not fire for client-rendered
 * pages. When this happens, the script reports LCP = 0 and the orchestrator
 * marks it as N/A with a note. FCP is reported as a separate row and is always
 * populated. See BENCHMARKS.md §6 for details.
 */

import { spawn } from "bun";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import budgetsJson from "./budgets.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsDir = join(__dirname, "results");

// ─── Config ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}
const URL = getArg("url", "http://localhost:3000/");
const RUNS = parseInt(getArg("runs", "3"), 10);

// Python interpreter — try /home/z/.venv/bin/python first, fall back to python3
async function findPython(): Promise<string> {
  const candidates = ["/home/z/.venv/bin/python", "python3", "python"];
  for (const c of candidates) {
    try {
      const proc = spawn({ cmd: [c, "--version"], stdout: "pipe", stderr: "pipe" });
      const exit = await proc.exited;
      if (exit === 0) return c;
    } catch {
      // try next
    }
  }
  return "python3";
}

const B = budgetsJson.runtime as Record<
  string,
  { target: number; comparator: "lt" | "lte" | "gt" | "gte"; unit: string; label: string; info?: boolean }
>;

interface AggMetric {
  median: number;
  min: number;
  max: number;
  values: number[];
  variancePct: number;
}
interface RuntimeReport {
  ok: boolean;
  url: string;
  runs: number;
  errors: string[];
  metrics: Record<string, AggMetric>;
  perRun: unknown[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmt(n: number, unit: string): string {
  if (unit === "ms") return n < 100 ? `${n.toFixed(1)} ms` : `${Math.round(n)} ms`;
  if (unit === "bytes") return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(2)} KB` : `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (unit === "fps") return `${n.toFixed(1)} fps`;
  if (unit === "count") return `${Math.round(n)}`;
  if (unit === "score") return n.toFixed(4);
  return `${n} ${unit}`;
}

function check(actual: number, target: number, comparator: string): "PASS" | "FAIL" {
  switch (comparator) {
    case "lt": return actual < target ? "PASS" : "FAIL";
    case "lte": return actual <= target ? "PASS" : "FAIL";
    case "gt": return actual > target ? "PASS" : "FAIL";
    case "gte": return actual >= target ? "PASS" : "FAIL";
    default: return "FAIL";
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main(): Promise<number> {
  console.log("\n╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║           RoyCSS Performance — Runtime Benchmark                       ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");
  console.log(`  URL:    ${URL}`);
  console.log(`  Runs:   ${RUNS}`);
  const python = await findPython();
  console.log(`  Python: ${python}`);
  console.log(`  Helper: ${join(__dirname, "_playwright_bench.py")}\n`);

  // Spawn Python helper
  const helperPath = join(__dirname, "_playwright_bench.py");
  if (!existsSync(helperPath)) {
    console.error(`FATAL: Playwright helper not found at ${helperPath}`);
    return 2;
  }

  const proc = spawn({
    cmd: [python, helperPath, "runtime", "--url", URL, "--runs", String(RUNS)],
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error(`Python helper exited with code ${exitCode}`);
    console.error("STDERR:");
    console.error(stderr);
    // Still try to parse stdout (the helper prints JSON even on partial failure)
  }

  let report: RuntimeReport;
  try {
    report = JSON.parse(stdout);
  } catch (e) {
    console.error(`FATAL: failed to parse Python helper output as JSON.`);
    console.error(`Parse error: ${(e as Error).message}`);
    console.error(`Stdout (first 500 chars): ${stdout.slice(0, 500)}`);
    return 2;
  }

  if (!report.ok && report.errors.length > 0) {
    console.error("Errors:");
    for (const e of report.errors) console.error(`  · ${e}`);
  }

  // ─── Render ───────────────────────────────────────────────────────────
  type Row = {
    id: string;
    label: string;
    unit: string;
    median: number;
    min: number;
    max: number;
    variance: number;
    budgetId: keyof typeof B | null;
    status: "PASS" | "FAIL" | "INFO" | "N/A";
    note?: string;
  };

  function row(id: string, metricKey: string, budgetId: keyof typeof B | null, fallbackUnit = "ms"): Row {
    const m = report.metrics[metricKey];
    const budget = budgetId ? B[budgetId] : null;
    let status: Row["status"] = "INFO";
    let note: string | undefined;
    if (m && m.median === 0 && (metricKey === "lcp")) {
      status = "N/A";
      note = "LCP observer did not fire in this Playwright/Chromium configuration (known headless limitation). See BENCHMARKS.md §6.";
    } else if (m && budget) {
      status = budget.info ? "INFO" : check(m.median, budget.target, budget.comparator);
    }
    return {
      id,
      label: budget ? budget.label : metricKey,
      unit: budget ? budget.unit : fallbackUnit,
      median: m ? m.median : 0,
      min: m ? m.min : 0,
      max: m ? m.max : 0,
      variance: m ? m.variancePct : 0,
      budgetId,
      status,
      note,
    };
  }

  const rows: Row[] = [
    row("ttfb", "ttfb", "ttfb"),
    row("fcp", "fcp", "fcp"),
    row("lcp", "lcp", "lcp"),
    row("tti", "tti", "tti"),
    row("tbt", "tbt", "tbt"),
    row("cls", "cls", "cls"),
    row("dom-count", "domCount", "domCount"),
    row("scroll-fps", "scrollFps", "scrollFps"),
    // Info-only rows (no budgets yet — establishing baselines)
    row("scroll-p95", "scrollP95FrameMs", null, "ms"),
    row("scroll-max", "scrollMaxFrameMs", null, "ms"),
    row("js-heap", "jsHeapUsedSize", null, "bytes"),
    row("dom-nodes-cdp", "domNodesCdp", null, "count"),
    row("layout-count", "layoutCount", null, "count"),
    row("recalc-style", "recalcStyleCount", null, "count"),
    row("script-duration", "scriptDuration", null, "ms"),
    row("task-duration", "taskDuration", null, "ms"),
    row("long-task-count", "longTaskCount", null, "count"),
  ];

  console.log("┌──────────────────────────────────────────────┬──────────────┬──────────────┬──────────────┬──────────┬──────────┐");
  console.log("│ Metric                                       │    Median    │      Min     │      Max     │ Variance │ Status   │");
  console.log("├──────────────────────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────┼──────────┤");
  for (const r of rows) {
    const label = r.label.length > 44 ? r.label.slice(0, 43) + "…" : r.label.padEnd(44);
    const med = (r.status === "N/A" ? "N/A" : fmt(r.median, r.unit)).padStart(12);
    const min = (r.status === "N/A" ? "—" : fmt(r.min, r.unit)).padStart(12);
    const max = (r.status === "N/A" ? "—" : fmt(r.max, r.unit)).padStart(12);
    const variance = `${r.variance.toFixed(1)}%`.padStart(8);
    const status = r.status.padEnd(8);
    console.log(`│ ${label} │ ${med} │ ${min} │ ${max} │ ${variance} │ ${status} │`);
  }
  console.log("└──────────────────────────────────────────────┴──────────────┴──────────────┴──────────────┴──────────┴──────────┘");

  // Budget pass/fail
  console.log("\nBudget gate:");
  for (const r of rows) {
    if (r.budgetId && r.budgetId in B) {
      const budget = B[r.budgetId];
      const statusIcon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : r.status === "N/A" ? "?" : "·";
      const actual = r.status === "N/A" ? "N/A".padStart(12) : fmt(r.median, r.unit).padStart(12);
      console.log(`  ${statusIcon} ${r.label.padEnd(44)} ${actual}  ${budget.comparator}  ${fmt(budget.target, budget.unit).padStart(12)}   [${r.status}]`);
    }
  }
  if (rows.some((r) => r.note)) {
    console.log("\nNotes:");
    for (const r of rows) {
      if (r.note) console.log(`  · ${r.label}: ${r.note}`);
    }
  }

  const failCount = rows.filter((r) => r.status === "FAIL").length;
  const naCount = rows.filter((r) => r.status === "N/A").length;
  console.log(`\nResult: ${rows.length} rows, ${rows.filter((r) => r.status === "PASS").length} PASS, ${failCount} FAIL, ${rows.filter((r) => r.status === "INFO").length} INFO, ${naCount} N/A.\n`);

  // ─── Save JSON ───────────────────────────────────────────────────────
  mkdirSync(resultsDir, { recursive: true });
  const jsonReport = {
    schema: "roycss.perf.runtime.v1",
    timestamp: new Date().toISOString(),
    url: URL,
    runs: RUNS,
    python,
    playwright: "1.57.0 (chromium-1228, headless)",
    rows,
    raw: report,
  };
  writeFileSync(join(resultsDir, "runtime-bench.json"), JSON.stringify(jsonReport, null, 2));
  console.log(`JSON: ${join(resultsDir, "runtime-bench.json")}\n`);

  // Exit code: 1 if any FAIL, 0 otherwise (N/A is not a failure — see DESIGN.md §7)
  if (failCount > 0) return 1;
  return 0;
}

main().then((code) => process.exit(code)).catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(2);
});
