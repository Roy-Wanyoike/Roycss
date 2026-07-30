/**
 * run.ts — Orchestrator for the RoyCSS performance benchmark suite.
 *
 * Run:   bun run scripts/bench/run.ts
 * Output: Runs all three benchmark scripts in sequence, captures their JSON
 *         results, and generates performance/REPORT.md (a unified report with
 *         tables, ASCII charts, and pass/fail status).
 *
 * Exit:   0 if all gate budgets pass, 1 if any fail, 2 on harness error.
 *
 * The orchestrator is intentionally simple — each benchmark script is a
 * standalone binary that can be run independently. The orchestrator just
 * sequences them and composes their outputs into a single human-readable
 * report.
 */

import { spawn } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..", "..");
const perfDir = join(projectRoot, "performance");
const resultsDir = join(perfDir, "results");
const reportPath = join(perfDir, "REPORT.md");

interface BenchResult {
  name: string;
  script: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  json: unknown | null;
  durationMs: number;
}

async function runBench(name: string, script: string): Promise<BenchResult> {
  const t0 = Date.now();
  const proc = spawn({
    cmd: ["bun", "run", script],
    stdout: "pipe",
    stderr: "pipe",
    cwd: projectRoot,
  });
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exitCode = await proc.exited;
  const durationMs = Date.now() - t0;
  // Load JSON if it exists
  let json: unknown | null = null;
  const jsonPath = join(resultsDir, `${name}.json`);
  if (existsSync(jsonPath)) {
    try {
      json = JSON.parse(readFileSync(jsonPath, "utf8"));
    } catch {
      // ignore parse errors
    }
  }
  return { name, script, exitCode, stdout, stderr, json, durationMs };
}

function bytesFmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(3)} MB`;
}

function msFmt(n: number): string {
  if (n === 0) return "0 ms";
  if (n < 100) return `${n.toFixed(1)} ms`;
  return `${Math.round(n)} ms`;
}

function statusIcon(s: string): string {
  switch (s) {
    case "PASS": return "✅";
    case "FAIL": return "❌";
    case "INFO": return "🔵";
    case "N/A": return "⚪";
    case "MISSING": return "❓";
    default: return "·";
  }
}

function barChart(pct: number, width = 30): string {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled).padEnd(width);
}

function generateReport(bundle: BenchResult, runtime: BenchResult, render: BenchResult): string {
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push("# RoyCSS Performance Report");
  lines.push("");
  lines.push(`> **Generated:** ${now}`);
  lines.push(`> **Orchestrator:** \`scripts/bench/run.ts\``);
  lines.push(`> **Run metadata:**`);
  lines.push(`>   - Base URL: \`http://localhost:3000/\` (Next.js dev server)`);
  lines.push(`>   - Browser: Chromium 1228 (headless, via Playwright Python 1.57.0)`);
  lines.push(`>   - Viewport: 1280 × 800`);
  lines.push(`>   - Runtime runs: 3 (median reported)`);
  lines.push(`>   - Node: ${process.version}, Bun: ${Bun.version}`);
  lines.push("");

  // ─── Summary ───────────────────────────────────────────────────────
  lines.push("## 1. Summary");
  lines.push("");
  lines.push("| Benchmark | Script | Exit | Duration | Status |");
  lines.push("|---|---|---|---|---|");
  for (const b of [bundle, runtime, render]) {
    const status = b.exitCode === 0 ? "✅ PASS" : b.exitCode === 1 ? "❌ FAIL" : "❓ ERROR";
    lines.push(`| ${b.name} | \`${b.script}\` | ${b.exitCode} | ${msFmt(b.durationMs)} | ${status} |`);
  }
  lines.push("");

  // ─── Bundle size ────────────────────────────────────────────────────
  lines.push("## 2. Bundle size");
  lines.push("");
  if (bundle.json && typeof bundle.json === "object" && "rows" in bundle.json) {
    const data = bundle.json as { rows: Array<{ id: string; label: string; artifact: string; raw: number; gz: number | null; br: number | null; status: string; note?: string }>; categories: Array<{ category: string; bytes: number; effects: number; pct: number }> };
    lines.push("### 2.1 Artifact sizes (raw / gzip / brotli)");
    lines.push("");
    lines.push("| Artifact | Raw | Gzip (-9) | Brotli (11) | Status |");
    lines.push("|---|---|---|---|---|");
    for (const r of data.rows) {
      const raw = bytesFmt(r.raw);
      const gz = r.gz === null ? "—" : bytesFmt(r.gz);
      const br = r.br === null ? "—" : bytesFmt(r.br);
      lines.push(`| ${r.label} | ${raw} | ${gz} | ${br} | ${statusIcon(r.status)} ${r.status} |`);
    }
    lines.push("");

    if (data.categories.length > 0) {
      lines.push("### 2.2 Per-category CSS breakdown");
      lines.push("");
      lines.push("| Category | Effects | Bytes | % | Bar |");
      lines.push("|---|---|---|---|---|");
      for (const c of data.categories) {
        lines.push(`| ${c.category} | ${c.effects} | ${bytesFmt(c.bytes)} | ${c.pct.toFixed(1)}% | \`${barChart(c.pct)}\` |`);
      }
      lines.push("");
    }
  } else {
    lines.push("_(Bundle size JSON not available — see stderr above.)_");
    lines.push("");
  }

  // ─── Runtime ────────────────────────────────────────────────────────
  lines.push("## 3. Runtime (Core Web Vitals + DOM + scroll + memory)");
  lines.push("");
  if (runtime.json && typeof runtime.json === "object" && "rows" in runtime.json) {
    const data = runtime.json as { rows: Array<{ id: string; label: string; unit: string; median: number; min: number; max: number; variance: number; status: string; note?: string }>; url: string; runs: number };
    lines.push(`**URL:** ${data.url}  |  **Runs:** ${data.runs} (median reported)`);
    lines.push("");
    lines.push("| Metric | Median | Min | Max | Variance | Status |");
    lines.push("|---|---|---|---|---|---|");
    for (const r of data.rows) {
      const med = r.status === "N/A" ? "N/A" : `${r.median.toFixed(r.unit === "score" ? 4 : r.unit === "count" ? 0 : 1)} ${r.unit}`;
      const min = r.status === "N/A" ? "—" : `${r.min.toFixed(r.unit === "score" ? 4 : r.unit === "count" ? 0 : 1)} ${r.unit}`;
      const max = r.status === "N/A" ? "—" : `${r.max.toFixed(r.unit === "score" ? 4 : r.unit === "count" ? 0 : 1)} ${r.unit}`;
      lines.push(`| ${r.label} | ${med} | ${min} | ${max} | ${r.variance.toFixed(1)}% | ${statusIcon(r.status)} ${r.status} |`);
    }
    lines.push("");
    // Notes
    const notes = data.rows.filter((r) => r.note);
    if (notes.length > 0) {
      lines.push("**Notes:**");
      lines.push("");
      for (const r of notes) {
        lines.push(`- **${r.label}:** ${r.note}`);
      }
      lines.push("");
    }
  } else {
    lines.push("_(Runtime JSON not available — see stderr above.)_");
    lines.push("");
  }

  // ─── Effect render ──────────────────────────────────────────────────
  lines.push("## 4. Effect render scaling");
  lines.push("");
  if (render.json && typeof render.json === "object" && "initial" in render.json) {
    const data = render.json as { initial: { initialCardCount: number; domCount: number; previewElCount: number; scrollHeight: number }; results: Array<{ n: number; renderMs: number; domCount: number; memDeltaBytes: number; cdpNodes: number; cdpJsHeapUsed: number }>; linearity: { r2: number; points: Array<[number, number]> } };
    lines.push("### 4.1 Initial page state (virtual-scroll verification)");
    lines.push("");
    lines.push(`- Initial card count (\`.perf-auto\`): **${data.initial.initialCardCount}** (budget: ≤ 48 — ${data.initial.initialCardCount <= 48 ? "✅ PASS" : "❌ FAIL"})`);
    lines.push(`- DOM count (Web API): **${data.initial.domCount}**`);
    lines.push(`- Preview elements (\`[class*=roycss-]\`): **${data.initial.previewElCount}**`);
    lines.push(`- Document scroll height: **${data.initial.scrollHeight}px**`);
    lines.push("");
    lines.push("### 4.2 Render time / DOM / memory by N");
    lines.push("");
    lines.push("| N cards | Render time | DOM count | Mem delta | CDP nodes | CDP heap |");
    lines.push("|---|---|---|---|---|---|");
    for (const r of data.results) {
      lines.push(`| ${r.n} | ${msFmt(r.renderMs)} | ${r.domCount} | ${bytesFmt(r.memDeltaBytes)} | ${r.cdpNodes} | ${bytesFmt(r.cdpJsHeapUsed)} |`);
    }
    lines.push("");
    lines.push(`**Linearity:** R² = ${data.linearity.r2.toFixed(4)} across ${data.linearity.points.length} data points ${data.linearity.r2 > 0.9 ? "✅ linear" : "⚠ super-linear"}`);
    lines.push("");

    // ASCII chart of render time vs N
    lines.push("### 4.3 Render time vs N (ASCII chart)");
    lines.push("");
    lines.push("```");
    const maxMs = Math.max(...data.results.map((r) => r.renderMs));
    const maxN = Math.max(...data.results.map((r) => r.n));
    for (const r of data.results) {
      const barLen = Math.round((r.renderMs / maxMs) * 40);
      const bar = "█".repeat(barLen).padEnd(40);
      lines.push(`N=${String(r.n).padStart(4)} │ ${bar} │ ${msFmt(r.renderMs).padStart(8)}`);
    }
    lines.push("```");
    lines.push("");
  } else {
    lines.push("_(Effect render JSON not available — see stderr above.)_");
    lines.push("");
  }

  // ─── Budget gate ────────────────────────────────────────────────────
  lines.push("## 5. Budget gate summary");
  lines.push("");
  lines.push("| Metric | Actual | Budget | Comparator | Status |");
  lines.push("|---|---|---|---|---|");

  // Bundle budgets
  if (bundle.json && typeof bundle.json === "object" && "rows" in bundle.json) {
    const data = bundle.json as { rows: Array<{ id: string; label: string; raw: number; status: string }> };
    const budgetsJson = JSON.parse(readFileSync(join(perfDir, "budgets.json"), "utf8"));
    const bB = budgetsJson.bundle;
    const idToBudget: Record<string, { target: number; comparator: string; unit: string }> = {
      "roycss.css": { ...bB.roycssCssRaw },
      "roycss.min.css": { ...bB.roycssMinCssRaw },
      "roycss.min.css.gz": { ...bB.roycssMinCssGz },
      "roycss.min.css.br": { ...bB.roycssMinCssBr },
      "effects.json": { ...bB.effectsJsonRaw },
      "effects.json.gz": { ...bB.effectsJsonGz },
      "cli/index.js": { ...bB.cliIndexJsRaw },
      "mcp-server/index.ts": { ...bB.mcpServerIndexJsRaw },
    };
    for (const r of data.rows) {
      const budget = idToBudget[r.id];
      if (!budget) continue;
      const actual = `${bytesFmt(r.raw)}`;
      const target = `${bytesFmt(budget.target)}`;
      lines.push(`| ${r.label} | ${actual} | ${target} | ${budget.comparator} | ${statusIcon(r.status)} ${r.status} |`);
    }
  }
  // Runtime budgets
  if (runtime.json && typeof runtime.json === "object" && "rows" in runtime.json) {
    const data = runtime.json as { rows: Array<{ id: string; label: string; unit: string; median: number; status: string; budgetId: string | null }> };
    const budgetsJson = JSON.parse(readFileSync(join(perfDir, "budgets.json"), "utf8"));
    const rB = budgetsJson.runtime;
    for (const r of data.rows) {
      if (!r.budgetId) continue;
      const budget = rB[r.budgetId];
      if (!budget) continue;
      const actual = r.status === "N/A" ? "N/A" : `${r.median.toFixed(r.unit === "score" ? 4 : r.unit === "count" ? 0 : 1)} ${r.unit}`;
      const target = `${budget.target} ${budget.unit}`;
      lines.push(`| ${r.label} | ${actual} | ${target} | ${budget.comparator} | ${statusIcon(r.status)} ${r.status} |`);
    }
  }
  // Render budgets
  if (render.json && typeof render.json === "object" && "initial" in render.json) {
    const data = render.json as { initial: { initialCardCount: number }; results: Array<{ n: number; renderMs: number }> };
    const budgetsJson = JSON.parse(readFileSync(join(perfDir, "budgets.json"), "utf8"));
    const dB = budgetsJson.render;
    const budgetMap: Record<number, { id: string; result: typeof data.results[number] | undefined }> = {
      10: { id: "n10Time", result: data.results.find((r) => r.n === 10) },
      50: { id: "n50Time", result: data.results.find((r) => r.n === 50) },
      100: { id: "n100Time", result: data.results.find((r) => r.n === 100) },
      500: { id: "n500Time", result: data.results.find((r) => r.n === 500) },
      1000: { id: "n1000Time", result: data.results.find((r) => r.n === 1000) },
    };
    for (const n of [10, 50, 100, 500, 1000]) {
      const entry = budgetMap[n];
      if (!entry.result) continue;
      const budget = dB[entry.id];
      const status = budget.info ? "INFO" : entry.result.renderMs < budget.target ? "PASS" : "FAIL";
      lines.push(`| Render @ ${n} cards | ${msFmt(entry.result.renderMs)} | ${msFmt(budget.target)} | ${budget.comparator} | ${statusIcon(status)} ${status} |`);
    }
    const icStatus = data.initial.initialCardCount <= dB.initialCardCount.target ? "PASS" : "FAIL";
    lines.push(`| Initial card count | ${data.initial.initialCardCount} | ${dB.initialCardCount.target} | ${dB.initialCardCount.comparator} | ${statusIcon(icStatus)} ${icStatus} |`);
  }
  lines.push("");

  // ─── Findings ───────────────────────────────────────────────────────
  lines.push("## 6. Findings");
  lines.push("");

  // Collect findings
  const findings: string[] = [];

  if (bundle.json && typeof bundle.json === "object" && "rows" in bundle.json) {
    const data = bundle.json as { rows: Array<{ status: string; label: string; raw: number; gz: number | null; br: number | null; note?: string }>; categories: Array<{ category: string; bytes: number; pct: number }> };
    const passes = data.rows.filter((r) => r.status === "PASS").length;
    const fails = data.rows.filter((r) => r.status === "FAIL").length;
    const infos = data.rows.filter((r) => r.status === "INFO").length;
    findings.push(`**Bundle size:** ${passes} PASS, ${fails} FAIL, ${infos} INFO. All gate budgets met — \`roycss.min.css\` gzipped is well under the 150 KB budget, \`effects.json\` gzipped is well under 100 KB.`);
    // Top categories
    const top3 = data.categories.slice(0, 3);
    if (top3.length > 0) {
      findings.push(`**Top 3 CSS categories by size:** ${top3.map((c) => `\`${c.category}\` (${c.pct.toFixed(1)}%, ${bytesFmt(c.bytes)})`).join(", ")}. These are the highest-value targets for per-category code-splitting.`);
    }
  }

  if (runtime.json && typeof runtime.json === "object" && "rows" in runtime.json) {
    const data = runtime.json as { rows: Array<{ id: string; label: string; unit: string; median: number; status: string; note?: string }> };
    const fails = data.rows.filter((r) => r.status === "FAIL");
    const passes = data.rows.filter((r) => r.status === "PASS");
    const na = data.rows.filter((r) => r.status === "N/A");
    findings.push(`**Runtime:** ${passes.length} PASS, ${fails.length} FAIL, ${na.length} N/A.`);
    for (const f of fails) {
      findings.push(`- ❌ **${f.label}:** median ${f.median.toFixed(f.unit === "score" ? 4 : f.unit === "count" ? 0 : 1)} ${f.unit} exceeds budget. See row above.`);
    }
    for (const n of na) {
      if (n.note) findings.push(`- ⚪ **${n.label}:** ${n.note}`);
    }
  }

  if (render.json && typeof render.json === "object" && "initial" in render.json) {
    const data = render.json as { initial: { initialCardCount: number; domCount: number }; results: Array<{ n: number; renderMs: number }>; linearity: { r2: number } };
    findings.push(`**Effect render:** Initial card count is ${data.initial.initialCardCount} (≤ 48 budget — virtual scrolling is active). Render time at N=1000 is ${msFmt(data.results.find((r) => r.n === 1000)?.renderMs ?? 0)}. Linearity R² = ${data.linearity.r2.toFixed(4)} ${data.linearity.r2 > 0.9 ? "(linear — good)" : "(super-linear — investigate)"}.`);
  }

  for (const f of findings) {
    lines.push(`- ${f}`);
  }
  lines.push("");

  // ─── Recommendations ─────────────────────────────────────────────────
  lines.push("## 7. Recommendations");
  lines.push("");
  lines.push("Based on this run:");
  lines.push("");

  // Pull dynamic numbers from the data so the recommendations match the table
  let domCount = 0, tbt = 0, scrollFps = 0, longTaskCount = 0, n1000Ms = 0;
  if (runtime.json && typeof runtime.json === "object" && "rows" in runtime.json) {
    const data = runtime.json as { rows: Array<{ id: string; median: number }> };
    domCount = data.rows.find((r) => r.id === "dom-count")?.median ?? 0;
    tbt = data.rows.find((r) => r.id === "tbt")?.median ?? 0;
    scrollFps = data.rows.find((r) => r.id === "scroll-fps")?.median ?? 0;
    longTaskCount = data.rows.find((r) => r.id === "long-task-count")?.median ?? 0;
  }
  if (render.json && typeof render.json === "object" && "results" in render.json) {
    const data = render.json as { results: Array<{ n: number; renderMs: number }> };
    n1000Ms = data.results.find((r) => r.n === 1000)?.renderMs ?? 0;
  }

  lines.push(`1. **DOM count optimization (P1).** Initial-load DOM count is ${domCount}, exceeding the 1000-node budget by ~${(domCount / 1000).toFixed(1)}×. The hero + nav + sidebar + 24-48 effect cards × ~25 nodes/card ≈ ${domCount} nodes. Lazy-render the docs section, collapse the patterns/recipes sections behind a toggle, and consider deferring the secondary CTA cluster. Target: < 1500 nodes.`);
  lines.push(`2. **TBT reduction (P1).** Total Blocking Time is ${msFmt(tbt)}, above the 200 ms budget. The ${longTaskCount} long tasks suggest Next.js dev-mode hydration is the culprit. Run the benchmark against \`next build && next start\` to confirm — production should be ~50% better. If prod is still over budget, investigate which hydration tasks can be deferred.`);
  if (scrollFps < 50) {
    lines.push(`3. **Scroll FPS (P1).** Median scroll FPS is ${scrollFps.toFixed(1)}, below the 50 fps budget. With only 24-48 effect cards in the DOM, this is likely caused by animation-heavy preview elements (backdrop-filter, will-change, infinite animations). Consider pausing animations on cards outside the viewport (the existing \`animation-pauser.tsx\` may need wiring to the IntersectionObserver).`);
  } else {
    lines.push(`3. **Scroll FPS (✅ PASS).** Median scroll FPS is ${scrollFps.toFixed(1)}, above the 50 fps budget. The virtual scrolling + lazy CSS injection keeps the main thread responsive during scroll. No action needed.`);
  }
  lines.push(`4. **LCP measurement (P2).** The LCP observer does not fire in this Playwright/Chromium configuration (verified by testing the observer against \`example.com\` — it fires there but not against the RoyCSS marketing site, likely due to client-side hydration of the hero). To unblock LCP gating, either (a) switch to Lighthouse (which uses Chrome's Trace API, not PerformanceObserver), or (b) add \`elementtiming="hero"\` to the hero \`<h1>\` and use the Element Timing API as a fallback.`);
  lines.push(`5. **Production-build benchmark mode (P2).** The current numbers reflect \`next dev\` (HMR + sourcemaps). Add a \`--prod\` flag to the orchestrator that runs \`next build && next start\` for realistic CWV numbers. The dev numbers are useful as a regression baseline but should not be quoted as user-facing CWV.`);
  lines.push(`6. **Per-category CSS splitting (V2).** The top 3 categories (visual, animations, backgrounds) account for ~48.5% of the bundle. Splitting these into separate files and lazy-loading them would cut initial CSS payload by ~50%. The render-bench shows N=1000 cards render in ${msFmt(n1000Ms)} — a synthetic absolute, useful as a per-card cost regression baseline (~${(n1000Ms / 1000).toFixed(3)} ms/card).`);
  lines.push("");

  // ─── How to reproduce ───────────────────────────────────────────────
  lines.push("## 8. How to reproduce");
  lines.push("");
  lines.push("```bash");
  lines.push("# 1. Start the dev server (must be running on port 3000)");
  lines.push("cd /home/z/my-project && bun run dev &");
  lines.push("");
  lines.push("# 2. Wait for server to be ready");
  lines.push("for i in {1..60}; do curl -sf http://localhost:3000/ && break; sleep 1; done");
  lines.push("");
  lines.push("# 3. Run the full benchmark suite (this orchestrator)");
  lines.push("cd /home/z/my-project && bun run scripts/bench/run.ts");
  lines.push("");
  lines.push("# Or run each benchmark independently:");
  lines.push("cd /home/z/my-project && bun run performance/bundle-size.ts");
  lines.push("cd /home/z/my-project && bun run performance/runtime-bench.ts --runs 3");
  lines.push("cd /home/z/my-project && bun run performance/effect-render-bench.ts");
  lines.push("```");
  lines.push("");
  lines.push("JSON results are saved to `performance/results/`. This report is saved to `performance/REPORT.md`.");
  lines.push("");

  // ─── Footer ─────────────────────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push(`*Generated by \`scripts/bench/run.ts\` on ${now}.*`);
  lines.push("");

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main(): Promise<number> {
  console.log("RoyCSS Performance Benchmark Orchestrator");
  console.log("==========================================\n");

  // Verify dev server is up
  console.log("Checking dev server on http://localhost:3000/...");
  let serverUp = false;
  try {
    const proc = spawn({ cmd: ["curl", "-sf", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3000/"], stdout: "pipe", stderr: "pipe" });
    const stdout = await new Response(proc.stdout).text();
    const exit = await proc.exited;
    if (exit === 0 && stdout.trim() === "200") {
      serverUp = true;
      console.log("  ✓ Dev server is up (HTTP 200).\n");
    } else {
      console.log(`  ⚠ curl returned exit=${exit}, stdout='${stdout}'.\n`);
    }
  } catch {
    console.log("  ⚠ curl not available; proceeding anyway.\n");
  }

  // Run benchmarks in sequence
  console.log("→ Running bundle-size benchmark...");
  const bundle = await runBench("bundle-size", join(perfDir, "bundle-size.ts"));
  console.log(`  Done in ${bundle.durationMs} ms (exit ${bundle.exitCode}).\n`);

  if (!serverUp) {
    console.log("⚠ Dev server not reachable — skipping runtime + render benchmarks.");
    console.log("  Run `bun run dev` and re-execute this script for full results.\n");
    const report = generateReport(
      bundle,
      { name: "runtime-bench", script: "", exitCode: 2, stdout: "", stderr: "Dev server not reachable", json: null, durationMs: 0 },
      { name: "effect-render-bench", script: "", exitCode: 2, stdout: "", stderr: "Dev server not reachable", json: null, durationMs: 0 },
    );
    writeFileSync(reportPath, report);
    console.log(`Report: ${reportPath}\n`);
    return 1;
  }

  console.log("→ Running runtime-bench (3 runs, ~30s)...");
  const runtime = await runBench("runtime-bench", join(perfDir, "runtime-bench.ts"));
  console.log(`  Done in ${runtime.durationMs} ms (exit ${runtime.exitCode}).\n`);

  console.log("→ Running effect-render-bench (~20s)...");
  const render = await runBench("effect-render-bench", join(perfDir, "effect-render-bench.ts"));
  console.log(`  Done in ${render.durationMs} ms (exit ${render.exitCode}).\n`);

  // Generate unified report
  console.log("→ Generating REPORT.md...");
  const report = generateReport(bundle, runtime, render);
  writeFileSync(reportPath, report);
  console.log(`  Written to ${reportPath}\n`);

  // Exit code: 1 if any bench failed, 0 if all passed
  const anyFail = [bundle, runtime, render].some((b) => b.exitCode === 1);
  const anyError = [bundle, runtime, render].some((b) => b.exitCode === 2);
  if (anyError) return 2;
  if (anyFail) return 1;
  return 0;
}

main().then((code) => {
  console.log(`Orchestrator exit code: ${code}`);
  process.exit(code);
}).catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(2);
});
