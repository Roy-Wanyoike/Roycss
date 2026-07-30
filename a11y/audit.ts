#!/usr/bin/env bun
/**
 * audit.ts — Run axe-core against the live RoyCSS site.
 *
 * Strategy:
 *   1. Ensure the dev server is running on http://localhost:3000/
 *      (start it as a child process if it's not).
 *   2. Open the page with agent-browser.
 *   3. Inject axe-core (already a devDependency) into the page via a <script> tag.
 *   4. Run `axe.run()` with the wcag2a + wcag2aa tags.
 *   5. Categorize violations by impact: critical, serious, moderate, minor.
 *   6. Write the full report to a11y/results/audit.json.
 *   7. Print a human-readable summary.
 *   8. Exit 0 if 0 critical + 0 serious, 1 otherwise.
 *
 * Usage:
 *   bun run a11y/audit.ts
 *   URL=http://localhost:3001 bun run a11y/audit.ts   # override URL
 *   KEEP_SERVER=1 bun run a11y/audit.ts               # don't kill the spawned server
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, "..");
const RESULTS_DIR = join(HERE, "results");
const AXE_SRC_PATH = join(PROJECT_ROOT, "node_modules", "axe-core", "axe.min.js");
const AXE_PUBLIC_PATH = join(PROJECT_ROOT, "public", "__axe.min.js");

const TARGET_URL = process.env.URL ?? "http://localhost:3000/";
const KEEP_SERVER = process.env.KEEP_SERVER === "1";

mkdirSync(RESULTS_DIR, { recursive: true });

/* ─── 1. Ensure dev server is running ──────────────────────────────────── */

function isServerUp(url: string): boolean {
  const r = spawnSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "2", url], {
    encoding: "utf-8",
  });
  return r.stdout.trim() === "200";
}

let serverProc: ChildProcess | null = null;
let weStartedServer = false;

function ensureServer(): void {
  if (isServerUp(TARGET_URL)) {
    console.error(`✓ dev server already running at ${TARGET_URL}`);
    return;
  }
  if (process.env.NO_START_SERVER === "1") {
    console.error(`✗ no server at ${TARGET_URL} and NO_START_SERVER=1 — aborting.`);
    process.exit(1);
  }
  console.error(`→ starting dev server (bun x next dev -p 3000)…`);
  // `bun run dev` pipes through `tee dev.log` per package.json, which can confuse
  // subprocess management. Run next directly to keep the child clean.
  serverProc = spawn("bun", ["x", "next", "dev", "-p", "3000"], {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  weStartedServer = true;

  // Wait up to 45s for the server to become reachable.
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45_000) {
    if (isServerUp(TARGET_URL)) {
      console.error(`✓ dev server ready after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
      return;
    }
    // Bail early if the subprocess died.
    if (serverProc.exitCode !== null) {
      console.error(`✗ dev server exited with code ${serverProc.exitCode} before becoming ready.`);
      process.exit(1);
    }
    spawnSync("sleep", ["0.5"]);
  }
  console.error(`✗ dev server did not become ready within 45s.`);
  teardownServer();
  process.exit(1);
}

function teardownServer(): void {
  if (!weStartedServer || !serverProc || KEEP_SERVER) return;
  try {
    if (serverProc.pid) {
      process.kill(-serverProc.pid, "SIGTERM");
    }
  } catch {
    try {
      serverProc.kill("SIGTERM");
    } catch {
      /* noop */
    }
  }
}

/* ─── 2. agent-browser helpers ─────────────────────────────────────────── */

function ab(...args: string[]): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync("agent-browser", args, { encoding: "utf-8", timeout: 60_000 });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}

function abJson<T>(...args: string[]): T | null {
  const r = ab(...args, "--json");
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout) as T;
  } catch {
    return null;
  }
}

/* ─── 3. Inject axe-core + run audit ───────────────────────────────────── */

interface AxeViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

interface AxeResult {
  violations: AxeViolation[];
  passes: Array<{ id: string; impact: string | null; tags: string[] }>;
  incomplete: Array<{ id: string; impact: string | null }>;
  inapplicable: Array<{ id: string }>;
  testEngine: { name: string; version: string };
  testRunner: { name: string };
  testEnvironment: Record<string, unknown>;
  url: string;
  timestamp: string;
}

function ensureAxeInPublic(): void {
  // axe.min.js is served from the dev server at /__axe.min.js so we can inject
  // it via a <script src> tag rather than piping 572 KB through stdin.
  if (!existsSync(AXE_SRC_PATH)) {
    console.error(`✗ axe-core not found at ${AXE_SRC_PATH}. Run \`bun add -d axe-core\` first.`);
    teardownServer();
    process.exit(1);
  }
  // Copy if missing or stale.
  let needCopy = true;
  if (existsSync(AXE_PUBLIC_PATH)) {
    const srcStat = readFileSync(AXE_SRC_PATH, { encoding: null }).length;
    const dstStat = readFileSync(AXE_PUBLIC_PATH, { encoding: null }).length;
    needCopy = srcStat !== dstStat;
  }
  if (needCopy) {
    try {
      copyFileSync(AXE_SRC_PATH, AXE_PUBLIC_PATH);
    } catch {
      /* may fail if public/ doesn't exist — fall through, eval will fail loudly */
    }
  }
}

function buildAxeRunnerScript(): string {
  // Inject axe via a <script src="/__axe.min.js"> tag, then call axe.run().
  // This avoids piping 572 KB of axe source through stdin (which is slow and
  // can hit agent-browser's eval timeout).
  return `
(function() {
  return new Promise((resolve, reject) => {
    function run() {
      try {
        window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
          resultTypes: ["violations", "passes", "incomplete", "inapplicable"],
        }).then(
          (result) => resolve(JSON.stringify(result)),
          (err) => reject(JSON.stringify({ error: String(err && err.message || err) }))
        );
      } catch (e) {
        reject(JSON.stringify({ error: String(e && e.message || e) }));
      }
    }
    if (window.axe) { run(); return; }
    var s = document.createElement('script');
    s.src = '/__axe.min.js';
    s.onload = function() {
      if (!window.axe) {
        reject(JSON.stringify({ error: 'axe.js loaded but window.axe is undefined' }));
        return;
      }
      run();
    };
    s.onerror = function() {
      reject(JSON.stringify({ error: 'failed to load /__axe.min.js' }));
    };
    document.head.appendChild(s);
  });
})()
`;
}

function runAxeViaBrowser(): AxeResult {
  // Open the page.
  console.error("→ agent-browser open …");
  const openRes = ab("open", TARGET_URL);
  if (openRes.status !== 0) {
    console.error(`✗ agent-browser open failed: ${openRes.stderr}`);
    teardownServer();
    process.exit(1);
  }
  // Wait for DOMContentLoaded (faster than networkidle) + a short settle.
  ab("wait", "--load", "domcontentloaded");
  ab("wait", "800");

  console.error("→ injecting axe-core + running axe.run() …");
  const runner = buildAxeRunnerScript();

  // Use --stdin to avoid shell-escaping issues with the runner script.
  const r = spawnSync("agent-browser", ["eval", "--stdin"], {
    input: runner,
    encoding: "utf-8",
    timeout: 60_000,
  });

  if (r.status !== 0) {
    console.error(`✗ agent-browser eval failed (exit ${r.status}): ${r.stderr || r.stdout}`);
    teardownServer();
    process.exit(1);
  }

  // The eval returns the Promise's resolved value as a string. agent-browser
  // wraps the result; the actual JSON is in stdout.
  let raw = r.stdout.trim();
  // agent-browser may wrap the result in quotes (JSON-stringified string).
  // Try to parse, and if that fails, treat as a string and parse again.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // If it's not valid JSON, it might be a JSON string wrapped in quotes.
    try {
      const inner = JSON.parse(`"${raw}"`);
      parsed = JSON.parse(inner);
    } catch {
      console.error(`✗ could not parse axe output. First 500 chars:\n${raw.slice(0, 500)}`);
      teardownServer();
      process.exit(1);
    }
  }

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      console.error(`✗ axe output was a string but not valid JSON. First 500 chars:\n${parsed.slice(0, 500)}`);
      teardownServer();
      process.exit(1);
    }
  }

  if (parsed && typeof parsed === "object" && "error" in parsed) {
    console.error(`✗ axe.run() threw: ${(parsed as { error: string }).error}`);
    teardownServer();
    process.exit(1);
  }

  return parsed as AxeResult;
}

/* ─── 4. Categorize + report ───────────────────────────────────────────── */

interface CategoryCount {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  none: number;
}

function categorize(result: AxeResult): CategoryCount {
  const counts: CategoryCount = { critical: 0, serious: 0, moderate: 0, minor: 0, none: 0 };
  for (const v of result.violations) {
    const impact = v.impact ?? "none";
    if (impact in counts) counts[impact as keyof CategoryCount]++;
  }
  return counts;
}

function printSummary(result: AxeResult, counts: CategoryCount): void {
  const totalViolations = result.violations.length;
  const totalNodeViolations = result.violations.reduce((sum, v) => sum + v.nodes.length, 0);

  console.log("\n" + "═".repeat(78));
  console.log("  axe-core Accessibility Audit — " + TARGET_URL);
  console.log("  axe " + result.testEngine.version + " · " + result.timestamp);
  console.log("═".repeat(78));
  console.log(`  Violations by impact:`);
  console.log(`    🔴 critical : ${counts.critical}`);
  console.log(`    🟠 serious  : ${counts.serious}`);
  console.log(`    🟡 moderate : ${counts.moderate}`);
  console.log(`    🔵 minor    : ${counts.minor}`);
  console.log(`    ⚪ none     : ${counts.none}`);
  console.log(`    ──────────────`);
  console.log(`    total rules violated: ${totalViolations}`);
  console.log(`    total node violations: ${totalNodeViolations}`);
  console.log(`  Passes: ${result.passes.length} rules · ` +
              `Incomplete: ${result.incomplete.length} · ` +
              `Inapplicable: ${result.inapplicable.length}`);
  console.log("═".repeat(78));

  if (totalViolations > 0) {
    console.log("  Top violations:");
    const sorted = [...result.violations].sort((a, b) => {
      const order = { critical: 0, serious: 1, moderate: 2, minor: 3, null: 4 };
      return (order[a.impact as keyof typeof order] ?? 4) - (order[b.impact as keyof typeof order] ?? 4);
    });
    for (const v of sorted.slice(0, 15)) {
      const icon =
        v.impact === "critical" ? "🔴" :
        v.impact === "serious"  ? "🟠" :
        v.impact === "moderate" ? "🟡" :
        v.impact === "minor"    ? "🔵" : "⚪";
      console.log(`  ${icon} [${v.impact ?? "none"}] ${v.id} — ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`);
      console.log(`     ${v.helpUrl}`);
    }
    if (totalViolations > 15) {
      console.log(`  … and ${totalViolations - 15} more (see a11y/results/audit.json).`);
    }
    console.log("═".repeat(78) + "\n");
  }
}

function writeJsonReport(result: AxeResult, counts: CategoryCount): void {
  const outPath = join(RESULTS_DIR, "audit.json");
  const payload = {
    generatedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    axeVersion: result.testEngine.version,
    timestamp: result.timestamp,
    summary: {
      ...counts,
      totalRulesViolated: result.violations.length,
      totalNodeViolations: result.violations.reduce((s, v) => s + v.nodes.length, 0),
      passes: result.passes.length,
      incomplete: result.incomplete.length,
      inapplicable: result.inapplicable.length,
    },
    violations: result.violations,
    passes: result.passes.map((p) => ({ id: p.id, impact: p.impact, tags: p.tags })),
    incomplete: result.incomplete,
    inapplicable: result.inapplicable,
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`JSON written to ${outPath}`);

  // Also write a stable summary file for trend tracking.
  const summaryPath = join(RESULTS_DIR, "audit-summary.json");
  writeFileSync(summaryPath, JSON.stringify({
    generatedAt: payload.generatedAt,
    targetUrl: payload.targetUrl,
    axeVersion: payload.axeVersion,
    summary: payload.summary,
  }, null, 2));
}

/* ─── 5. Main ───────────────────────────────────────────────────────────── */

function main(): void {
  if (!existsSync(AXE_SRC_PATH)) {
    console.error(`✗ axe-core not found at ${AXE_SRC_PATH}. Run \`bun add -d axe-core\` first.`);
    process.exit(1);
  }

  ensureServer();
  ensureAxeInPublic();

  console.log("→ running axe-core audit (this can take 20–40s)…");
  const result = runAxeViaBrowser();
  const counts = categorize(result);

  printSummary(result, counts);
  writeJsonReport(result, counts);

  // Close the browser session.
  ab("close");

  teardownServer();

  const gate = counts.critical === 0 && counts.serious === 0;
  if (gate) {
    console.log("✅ audit: PASS — 0 critical, 0 serious violations.");
    process.exit(0);
  } else {
    console.error(`❌ audit: FAIL — ${counts.critical} critical, ${counts.serious} serious violations.`);
    process.exit(1);
  }
}

main();
