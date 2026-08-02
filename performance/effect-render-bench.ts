/**
 * effect-render-bench.ts — Scale-test the page's ability to render N cards.
 *
 * Run:   bun run performance/effect-render-bench.ts [--url http://localhost:3000/] [--counts 10,50,100,500,1000]
 * Output: Human-readable table to stdout + JSON to performance/results/effect-render-bench.json
 *
 * What this verifies:
 *   1. The initial card count on page load is ≤ BATCH_SIZE × 2 = 48 (the
 *      IntersectionObserver's rootMargin: 400px may pre-load one extra batch
 *      of 24). If the initial count equals 1569, virtual scrolling is broken.
 *   2. For each N in [10, 50, 100, 500, 1000], inject N synthetic effect-card
 *      DOM nodes (mirroring the real EffectCard markup) into a hidden container
 *      and measure render time + DOM count + memory delta.
 *   3. Verify render time scales roughly linearly with N (R² > 0.9 across
 *      the 5 data points). Superlinear scaling indicates a per-card regression.
 *
 * The synthetic card HTML is in performance/_playwright_bench.py (EFFECT_CARD_HTML
 * constant). It mirrors the real EffectCard structure: a preview element with a
 * `.roycss-<id>` class, a title, a meta line, tags, and a footer with two buttons.
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
const COUNTS = getArg("counts", "10,50,100,500,1000").split(",").map((s) => parseInt(s, 10));

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

const B = budgetsJson.render as Record<
  string,
  { target: number; comparator: "lt" | "lte" | "gt" | "gte"; unit: string; label: string; info?: boolean }
>;

interface RenderReport {
  ok: boolean;
  url: string;
  counts: number[];
  initial: {
    initialCardCount: number;
    domCount: number;
    previewElCount: number;
    scrollHeight: number;
  };
  results: Array<{
    n: number;
    renderMs: number;
    domCount: number;
    memDeltaBytes: number;
    containerChildCount: number;
    cdpNodes: number;
    cdpJsHeapUsed: number;
    cdpLayoutCount: number;
    cdpRecalcStyleCount: number;
  }>;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmt(n: number, unit: string): string {
  if (unit === "ms") return n < 100 ? `${n.toFixed(2)} ms` : `${Math.round(n)} ms`;
  if (unit === "bytes") return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(2)} KB` : `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (unit === "count") return `${Math.round(n)}`;
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

// Linear regression R² for linearity check
function r2(points: Array<[number, number]>): number {
  const n = points.length;
  if (n < 2) return 1;
  const sumX = points.reduce((s, p) => s + p[0], 0);
  const sumY = points.reduce((s, p) => s + p[1], 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, denX = 0, denY = 0;
  for (const [x, y] of points) {
    num += (x - meanX) * (y - meanY);
    denX += (x - meanX) ** 2;
    denY += (y - meanY) ** 2;
  }
  if (denX === 0 || denY === 0) return 1;
  return (num * num) / (denX * denY);
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main(): Promise<number> {
  console.log("\n╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║           RoyCSS Performance — Effect Render Benchmark                 ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");
  console.log(`  URL:    ${URL}`);
  console.log(`  Counts: ${COUNTS.join(", ")}`);
  const python = await findPython();
  console.log(`  Python: ${python}\n`);

  const helperPath = join(__dirname, "_playwright_bench.py");
  if (!existsSync(helperPath)) {
    console.error(`FATAL: Playwright helper not found at ${helperPath}`);
    return 2;
  }

  const proc = spawn({
    cmd: [python, helperPath, "render", "--url", URL, "--counts", COUNTS.join(",")],
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error(`Python helper exited with code ${exitCode}`);
    console.error("STDERR:");
    console.error(stderr);
  }

  let report: RenderReport;
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

  // ─── Initial state ───────────────────────────────────────────────────
  console.log("Initial page state (verifies virtual scrolling threshold):");
  console.log(`  Initial card count (.perf-auto): ${report.initial.initialCardCount}`);
  console.log(`  DOM count (document.querySelectorAll('*')): ${report.initial.domCount}`);
  console.log(`  Preview elements ([class*=roycss-]): ${report.initial.previewElCount}`);
  console.log(`  Document scroll height: ${report.initial.scrollHeight}px`);
  const initialBudget = B.initialCardCount;
  const initialStatus = check(report.initial.initialCardCount, initialBudget.target, initialBudget.comparator);
  console.log(`  Virtual-scroll threshold: ${initialStatus} (initial card count ${initialBudget.comparator} ${initialBudget.target})`);
  if (initialStatus === "FAIL") {
    console.log(`  ⚠ Virtual scrolling may be broken — expected ≤ ${initialBudget.target} cards, got ${report.initial.initialCardCount}.`);
  } else {
    console.log(`  ✓ Virtual scrolling is active (lazy-loaded batches of 24).`);
  }
  console.log("");

  // ─── Per-count table ─────────────────────────────────────────────────
  console.log("┌──────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐");
  console.log("│       N  │  Render Time │   DOM Count  │  Mem Delta   │  CDP Nodes   │  CDP Heap    │");
  console.log("├──────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤");
  for (const r of report.results) {
    const n = String(r.n).padStart(8);
    const rt = fmt(r.renderMs, "ms").padStart(12);
    const dc = String(r.domCount).padStart(12);
    const md = fmt(r.memDeltaBytes, "bytes").padStart(12);
    const cn = String(r.cdpNodes).padStart(12);
    const ch = fmt(r.cdpJsHeapUsed, "bytes").padStart(12);
    console.log(`│ ${n} │ ${rt} │ ${dc} │ ${md} │ ${cn} │ ${ch} │`);
  }
  console.log("└──────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘");

  // ─── Budget gate ─────────────────────────────────────────────────────
  console.log("\nBudget gate:");
  const budgetMap: Record<string, { id: keyof typeof B; result: typeof report.results[number] | undefined }> = {
    "10": { id: "n10Time", result: report.results.find((r) => r.n === 10) },
    "50": { id: "n50Time", result: report.results.find((r) => r.n === 50) },
    "100": { id: "n100Time", result: report.results.find((r) => r.n === 100) },
    "500": { id: "n500Time", result: report.results.find((r) => r.n === 500) },
    "1000": { id: "n1000Time", result: report.results.find((r) => r.n === 1000) },
  };
  let failCount = 0;
  for (const nStr of ["10", "50", "100", "500", "1000"]) {
    const entry = budgetMap[nStr];
    if (!entry.result) continue;
    const budget = B[entry.id];
    const status = budget.info ? "INFO" : check(entry.result.renderMs, budget.target, budget.comparator);
    if (status === "FAIL") failCount++;
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "·";
    console.log(`  ${icon} Render @ ${nStr.padStart(4)} cards   ${fmt(entry.result.renderMs, "ms").padStart(12)}  ${budget.comparator}  ${fmt(budget.target, "ms").padStart(12)}   [${status}]`);
  }
  // Initial card count budget
  const icStatus = check(report.initial.initialCardCount, B.initialCardCount.target, B.initialCardCount.comparator);
  if (icStatus === "FAIL") failCount++;
  const icIcon = icStatus === "PASS" ? "✓" : "✗";
  console.log(`  ${icIcon} Initial card count        ${String(report.initial.initialCardCount).padStart(12)}  ${B.initialCardCount.comparator}  ${String(B.initialCardCount.target).padStart(12)}   [${icStatus}]`);

  // ─── Linearity check ─────────────────────────────────────────────────
  const points: Array<[number, number]> = report.results.map((r) => [r.n, r.renderMs]);
  const r2Score = r2(points);
  console.log(`\nLinearity: R² = ${r2Score.toFixed(4)} across ${points.length} data points`);
  if (r2Score > 0.9) {
    console.log(`  ✓ Render time scales linearly (R² > 0.9).`);
  } else {
    console.log(`  ⚠ Render time scaling is super-linear (R² < 0.9) — investigate per-card cost.`);
  }

  // Per-card cost
  if (report.results.length > 0) {
    const last = report.results[report.results.length - 1];
    if (last && last.n > 0) {
      const perCard = last.renderMs / last.n;
      console.log(`  Per-card cost @ N=${last.n}: ${perCard.toFixed(4)} ms/card`);
    }
  }

  console.log(`\nResult: ${failCount} budget failures.\n`);

  // ─── Save JSON ───────────────────────────────────────────────────────
  mkdirSync(resultsDir, { recursive: true });
  const jsonReport = {
    schema: "roycss.perf.effect-render.v1",
    timestamp: new Date().toISOString(),
    url: URL,
    counts: COUNTS,
    python,
    initial: report.initial,
    results: report.results,
    linearity: { r2: r2Score, points },
    raw: report,
  };
  writeFileSync(join(resultsDir, "effect-render-bench.json"), JSON.stringify(jsonReport, null, 2));
  console.log(`JSON: ${join(resultsDir, "effect-render-bench.json")}\n`);

  return failCount > 0 ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(2);
});
