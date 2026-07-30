#!/usr/bin/env bun
/**
 * axe-audit.ts — Run axe-core against the live RoyCSS site.
 *
 * Strategy:
 *   1. Verify the dev server is up at http://localhost:3000/ (curl).
 *   2. Open the page with agent-browser.
 *   3. Inject axe-core (already a devDependency) via `<script src="/__axe.min.js">`.
 *   4. Run `axe.run()` with the wcag2a + wcag2aa + best-practice tags.
 *   5. Save the full result (violations, passes, incomplete, inapplicable) to
 *      tests/a11y/results/axe-results.json.
 *   6. Categorise violations by impact: critical / serious / moderate / minor.
 *   7. Print a human-readable summary.
 *   8. Exit 0 if 0 critical + 0 serious, 1 otherwise.
 *
 * Usage:
 *   bun run tests/a11y/axe-audit.ts
 *   URL=http://localhost:3001 bun run tests/a11y/axe-audit.ts
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync, copyFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, "..", "..");
const RESULTS_DIR = join(HERE, "results");
const AXE_SRC_PATH = join(PROJECT_ROOT, "node_modules", "axe-core", "axe.min.js");
const AXE_PUBLIC_PATH = join(PROJECT_ROOT, "public", "__axe.min.js");

const TARGET_URL = process.env.URL ?? "http://localhost:3000/";

mkdirSync(RESULTS_DIR, { recursive: true });

/* ─── 1. Verify dev server is up ───────────────────────────────────────── */

function isServerUp(url: string): boolean {
  const r = spawnSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "10", url], {
    encoding: "utf-8",
  });
  return r.stdout.trim() === "200";
}

// Retry the server-up check up to 6 times (60s total). The dev server can be
// slow to compile the first request, and on memory-constrained CI machines it
// may need to be restarted externally.
let serverUp = false;
for (let attempt = 1; attempt <= 6; attempt++) {
  if (isServerUp(TARGET_URL)) {
    serverUp = true;
    break;
  }
  console.error(`⚠ server not up (attempt ${attempt}/6), retrying in 10s …`);
  if (attempt < 6) {
    spawnSync("sleep", ["10"]);
  }
}
if (!serverUp) {
  console.error(`✗ no server at ${TARGET_URL} after 6 attempts. Start the dev server first:  bun run dev`);
  process.exit(1);
}
console.error(`✓ dev server is up at ${TARGET_URL}`);

/* ─── 2. Ensure axe.min.js is served from /__axe.min.js ─────────────────── */

function ensureAxeInPublic(): void {
  if (!existsSync(AXE_SRC_PATH)) {
    console.error(`✗ axe-core not found at ${AXE_SRC_PATH}. Run \`bun add -d axe-core\` first.`);
    process.exit(1);
  }
  let needCopy = true;
  if (existsSync(AXE_PUBLIC_PATH)) {
    const srcSize = readFileSync(AXE_SRC_PATH).length;
    const dstSize = readFileSync(AXE_PUBLIC_PATH).length;
    needCopy = srcSize !== dstSize;
  }
  if (needCopy) {
    try {
      copyFileSync(AXE_SRC_PATH, AXE_PUBLIC_PATH);
      console.error(`✓ copied axe.min.js → public/__axe.min.js`);
    } catch {
      console.error(`⚠ could not copy axe.min.js to public/ — falling back to inline injection may fail`);
    }
  }
}

ensureAxeInPublic();

/* ─── 3. agent-browser helpers ─────────────────────────────────────────── */

function ab(args: string[], opts?: { input?: string; timeout?: number }): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync("agent-browser", args, {
    encoding: "utf-8",
    input: opts?.input,
    timeout: opts?.timeout ?? 60_000,
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}

function abOpen(url: string): void {
  // Close any stale session first to avoid "browser already open" issues.
  ab(["close", "--all"], { timeout: 15_000 });
  const r = ab(["open", url, "--timeout", "90000"], { timeout: 150_000 });
  // agent-browser open prints "✓ <title>" on success. We tolerate status=null
  // (spawnSync timeout) as long as stdout contains the success marker.
  const ok = r.status === 0 || (r.stdout && r.stdout.includes("✓"));
  if (!ok) {
    console.error(`✗ agent-browser open failed (exit ${r.status}): ${r.stderr || r.stdout || "(no output)"}`);
    process.exit(1);
  }
  // Verify we actually navigated to the target URL. agent-browser's `open`
  // can return success while leaving the tab on about:blank if the browser
  // was just launched. Force-navigate if needed.
  try {
    const check = abEvalStdin<string>(`location.href`, 10_000);
    if (!check.includes(url.replace(/^https?:\/\//, "").replace(/\/$/, ""))) {
      console.error(`⚠ browser is on ${check}, forcing navigation to ${url} …`);
      abEvalStdin<string>(`location.href = ${JSON.stringify(url)}; ''`, 10_000);
      ab(["wait", "3000"], { timeout: 10_000 });
    }
  } catch {
    // ignore — the page-ready check below will catch persistent issues
  }
}

interface AbResult<T> {
  success: boolean;
  data: { result: T; origin: string } | null;
  error: string | null;
}

function abEvalStdin<T>(script: string, timeoutMs: number): T {
  // We pass --timeout to agent-browser so it self-terminates; spawnSync's
  // own timeout is set generously (+30s buffer) but we tolerate `status: null`
  // because spawnSync returns null when its timeout fires — even if the child
  // has already written a complete response to stdout. We look at the JSON
  // payload's `success` field to decide.
  const r = ab(["eval", "--stdin", "--json", "--timeout", String(timeoutMs)], { input: script, timeout: timeoutMs + 30_000 });
  if (!r.stdout) {
    console.error(`✗ agent-browser eval produced no stdout (exit ${r.status}): ${r.stderr}`);
    process.exit(1);
  }
  let outer: AbResult<T>;
  try {
    outer = JSON.parse(r.stdout) as AbResult<T>;
  } catch (e) {
    console.error(`✗ could not parse agent-browser JSON output. First 500 chars:\n${r.stdout.slice(0, 500)}`);
    process.exit(1);
  }
  if (!outer.success || !outer.data) {
    console.error(`✗ agent-browser eval unsuccessful: ${outer.error ?? "(no error)"}`);
    process.exit(1);
  }
  return outer.data.result;
}

/* ─── 4. Open the page + run axe ───────────────────────────────────────── */

abOpen(TARGET_URL);
// Wait for the page to settle (network idle + a short buffer).
ab(["wait", "--load", "networkidle", "--timeout", "60000"], { timeout: 70_000 });
ab(["wait", "1500"], { timeout: 10_000 });

// Verify the page actually loaded with content. agent-browser's networkidle
// wait can return prematurely on a Next.js dev server (HMR websockets keep
// the network "active"). We poll until document.body has children and the
// URL matches what we expect.
console.error("→ verifying page actually loaded …");
let pageReady = false;
for (let attempt = 1; attempt <= 10; attempt++) {
  const check = abEvalStdin<string>(
    `JSON.stringify({ url: location.href, readyState: document.readyState, bodyChildCount: document.body ? document.body.childElementCount : -1, hasMain: !!document.querySelector('main'), hasTitle: !!document.querySelector('title'), htmlLang: document.documentElement.getAttribute('lang') || '' })`,
    10_000,
  );
  const parsed = JSON.parse(check) as { url: string; readyState: string; bodyChildCount: number; hasMain: boolean; hasTitle: boolean; htmlLang: string };
  console.error(`  attempt ${attempt}: url=${parsed.url} ready=${parsed.readyState} bodyChildren=${parsed.bodyChildCount} hasMain=${parsed.hasMain} hasTitle=${parsed.hasTitle} lang=${parsed.htmlLang}`);
  if (parsed.bodyChildCount > 0 && parsed.hasMain && parsed.hasTitle && parsed.htmlLang) {
    pageReady = true;
    break;
  }
  ab(["wait", "1500"], { timeout: 10_000 });
}
if (!pageReady) {
  console.error(`✗ page did not reach ready state after 10 attempts. The audit would produce false positives on an empty document.`);
  process.exit(1);
}

console.error("→ injecting axe-core + running axe.run() …");

// Pre-fetch axe.min.js content so we can inject it inline (more reliable than
// <script src> which can fail silently under agent-browser's CDP harness).
const axeSource = readFileSync(AXE_PUBLIC_PATH, "utf-8");
console.error(`  axe.min.js source: ${axeSource.length} bytes`);

// We split the source into chunks because agent-browser eval stdin has a
// practical size limit. We store the full source in a window-global by
// concatenating chunks, then eval it once.
const CHUNK_SIZE = 60_000;
const chunks: string[] = [];
for (let i = 0; i < axeSource.length; i += CHUNK_SIZE) {
  chunks.push(axeSource.slice(i, i + CHUNK_SIZE));
}
console.error(`  injecting axe source in ${chunks.length} chunks …`);

// Send each chunk via a separate eval that appends to window.__axeSrc.
for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const isLast = i === chunks.length - 1;
  // The chunk is passed as a JSON-encoded string literal to avoid escaping
  // issues. We use a small wrapper that appends to a global string.
  const setter = `(() => {
    window.__axeSrc = (window.__axeSrc || '') + ${JSON.stringify(chunk)};
    return JSON.stringify({ ok: true, i: ${i}, isLast: ${isLast}, len: ${chunk.length} });
  })()`;
  abEvalStdin<string>(setter, 30_000);
}
console.error("  all chunks sent; evaluating axe source …");

const runner = `
(async () => {
  try {
    if (!window.__axeLoaded) {
      // Eval the assembled source.
      // eslint-disable-next-line no-eval
      (0, eval)(window.__axeSrc);
      window.__axeLoaded = true;
      delete window.__axeSrc;
    }
    if (typeof window.axe !== 'object' || typeof window.axe.run !== 'function') {
      return JSON.stringify({ error: 'axe global not available after eval (typeof axe=' + typeof window.axe + ')' });
    }
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
      resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
    });
    // Trim node details to keep the response small enough for the
    // agent-browser eval stdout buffer. We keep ALL rule-level info
    // (id, impact, help, helpUrl, tags, description) but only retain
    // the first 10 nodes per rule, and for each node only keep html,
    // target, and a trimmed failureSummary.
    const trimNodes = (nodes) => (nodes || []).slice(0, 10).map(n => ({
      html: (n.html || '').slice(0, 400),
      target: n.target || [],
      failureSummary: n.failureSummary ? n.failureSummary.slice(0, 500) : undefined,
      impact: n.impact,
    }));
    const trimRule = (r) => ({
      id: r.id, impact: r.impact, description: r.description, help: r.help,
      helpUrl: r.helpUrl, tags: r.tags, nodeCount: (r.nodes || []).length,
      nodes: trimNodes(r.nodes),
    });
    const trimmed = {
      testEngine: result.testEngine,
      testRunner: result.testRunner,
      testEnvironment: result.testEnvironment,
      url: result.url,
      timestamp: result.timestamp,
      violations: (result.violations || []).map(trimRule),
      passes: (result.passes || []).map(p => ({ id: p.id, impact: p.impact, tags: p.tags, nodeCount: (p.nodes || []).length })),
      incomplete: (result.incomplete || []).map(p => ({ id: p.id, impact: p.impact, tags: p.tags, nodeCount: (p.nodes || []).length })),
      inapplicable: (result.inapplicable || []).map(p => ({ id: p.id, tags: p.tags })),
    };
    return JSON.stringify(trimmed);
  } catch (e) {
    return JSON.stringify({ error: String(e && e.message || e) });
  }
})()
`;

const rawResult = abEvalStdin<string>(runner, 180_000);

let parsed: unknown;
try {
  parsed = JSON.parse(rawResult);
} catch {
  console.error(`✗ axe output was not valid JSON. First 500 chars:\n${rawResult.slice(0, 500)}`);
  process.exit(1);
}

if (parsed && typeof parsed === "object" && "error" in (parsed as Record<string, unknown>)) {
  console.error(`✗ axe.run() threw: ${(parsed as { error: string }).error}`);
  process.exit(1);
}

const axeResult = parsed as AxeResult;

/* ─── 5. Categorise + report ───────────────────────────────────────────── */

interface SeverityCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  none: number;
}

function categorize(result: AxeResult): SeverityCounts {
  const counts: SeverityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0, none: 0 };
  for (const v of result.violations) {
    const impact = v.impact ?? "none";
    if (impact in counts) counts[impact as keyof SeverityCounts]++;
  }
  return counts;
}

const counts = categorize(axeResult);
// nodeCount is set by our trim step (true count); fall back to nodes.length for safety.
const nodeCountOf = (v: AxeViolation): number =>
  typeof (v as AxeViolation & { nodeCount?: number }).nodeCount === "number"
    ? (v as AxeViolation & { nodeCount?: number }).nodeCount as number
    : v.nodes.length;
const totalNodeViolations = axeResult.violations.reduce((sum, v) => sum + nodeCountOf(v), 0);

function printSummary(): void {
  console.log("\n" + "═".repeat(78));
  console.log("  axe-core Accessibility Audit — " + TARGET_URL);
  console.log("  axe " + axeResult.testEngine.version + " · " + axeResult.timestamp);
  console.log("═".repeat(78));
  console.log("  Violations by impact:");
  console.log(`    🔴 critical : ${counts.critical}`);
  console.log(`    🟠 serious  : ${counts.serious}`);
  console.log(`    🟡 moderate : ${counts.moderate}`);
  console.log(`    🔵 minor    : ${counts.minor}`);
  console.log(`    ⚪ none     : ${counts.none}`);
  console.log(`    ──────────────`);
  console.log(`    total rules violated: ${axeResult.violations.length}`);
  console.log(`    total node violations: ${totalNodeViolations}`);
  console.log(
    `  Passes: ${axeResult.passes.length} rules · ` +
      `Incomplete: ${axeResult.incomplete.length} · ` +
      `Inapplicable: ${axeResult.inapplicable.length}`,
  );
  console.log("═".repeat(78));

  if (axeResult.violations.length > 0) {
    console.log("  Top violations:");
    const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3, "": 4 };
    const sorted = [...axeResult.violations].sort(
      (a, b) => (order[a.impact ?? ""] ?? 4) - (order[b.impact ?? ""] ?? 4),
    );
    for (const v of sorted.slice(0, 15)) {
      const icon =
        v.impact === "critical" ? "🔴" : v.impact === "serious" ? "🟠" : v.impact === "moderate" ? "🟡" : v.impact === "minor" ? "🔵" : "⚪";
      const nc = nodeCountOf(v);
      console.log(
        `  ${icon} [${v.impact ?? "none"}] ${v.id} — ${v.help} (${nc} node${nc === 1 ? "" : "s"})`,
      );
      console.log(`     ${v.helpUrl}`);
    }
    if (axeResult.violations.length > 15) {
      console.log(`  … and ${axeResult.violations.length - 15} more (see tests/a11y/results/axe-results.json).`);
    }
    console.log("═".repeat(78) + "\n");
  }
}

printSummary();

/* ─── 6. Save full JSON report ─────────────────────────────────────────── */

const report = {
  generatedAt: new Date().toISOString(),
  targetUrl: TARGET_URL,
  axeVersion: axeResult.testEngine.version,
  timestamp: axeResult.timestamp,
  summary: {
    ...counts,
    totalRulesViolated: axeResult.violations.length,
    totalNodeViolations,
    passes: axeResult.passes.length,
    incomplete: axeResult.incomplete.length,
    inapplicable: axeResult.inapplicable.length,
  },
  violations: axeResult.violations,
  passes: axeResult.passes, // already trimmed by the runner
  incomplete: axeResult.incomplete,
  inapplicable: axeResult.inapplicable,
};

const outPath = join(RESULTS_DIR, "axe-results.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`JSON written to ${outPath}`);

// Also write a stable summary file for trend tracking.
const summaryPath = join(RESULTS_DIR, "axe-summary.json");
writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      generatedAt: report.generatedAt,
      targetUrl: report.targetUrl,
      axeVersion: report.axeVersion,
      summary: report.summary,
      violations: report.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodeCount: v.nodes.length })),
    },
    null,
    2,
  ),
);
console.log(`Summary written to ${summaryPath}`);

// Close the browser session.
ab(["close", "--all"], { timeout: 15_000 });

/* ─── 7. Exit gate ─────────────────────────────────────────────────────── */

const gate = counts.critical === 0 && counts.serious === 0;
if (gate) {
  console.log("✅ audit: PASS — 0 critical, 0 serious violations.");
  process.exit(0);
} else {
  console.error(`❌ audit: FAIL — ${counts.critical} critical, ${counts.serious} serious violations.`);
  process.exit(1);
}

/* ─── Types ────────────────────────────────────────────────────────────── */

interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

interface AxeViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
  nodeCount?: number;
}

interface AxeResult {
  violations: AxeViolation[];
  passes: Array<{ id: string; impact: string | null; tags: string[]; nodes?: AxeNode[]; nodeCount?: number }>;
  incomplete: Array<{ id: string; impact: string | null; tags: string[]; nodes?: AxeNode[]; nodeCount?: number }>;
  inapplicable: Array<{ id: string; tags: string[] }>;
  testEngine: { name: string; version: string };
  testRunner: { name: string };
  testEnvironment: Record<string, unknown>;
  url: string;
  timestamp: string;
}
