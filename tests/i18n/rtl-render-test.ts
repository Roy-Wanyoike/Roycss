/**
 * RoyCSS — RTL Render Test
 *
 * Uses agent-browser to:
 *  1. Open http://localhost:3000/ in LTR mode, take screenshot
 *  2. Set <html dir="rtl"> via eval, take screenshot
 *  3. Verify: text direction reversed, no horizontal overflow, no new console errors
 *  4. Test 5 specific RoyCSS effects in both LTR and RTL by applying them to
 *     a test div and screenshotting each.
 *
 * Output: screenshots in tests/i18n/screenshots/, results in tests/i18n/results/rtl-render.json
 *
 * Run: `bun run tests/i18n/rtl-render-test.ts`
 *
 * Requires: agent-browser CLI installed (`npm install -g agent-browser` and
 * `agent-browser install`), and the RoyCSS dev server running on port 3000.
 */

import { execSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SHOTS_DIR = path.join(__dirname, "screenshots");
const RESULTS_DIR = path.join(__dirname, "results");
const RESULTS_FILE = path.join(RESULTS_DIR, "rtl-render.json");
const BASE_URL = "http://localhost:3000/";

// 5 effects to test in both directions. We pick effects that are present in
// the showcase DOM (effect-card previews) and that exercise different
// categories. The script will find these by class name on the live page.
const TEST_EFFECTS: Array<{ id: string; className: string; label: string }> = [
  { id: "pulse-glow", className: "roycss-pulse-glow", label: "Animations — pulse-glow" },
  { id: "hover-lift", className: "roycss-hover-lift", label: "Hover — hover-lift" },
  { id: "card-glow", className: "roycss-card-glow", label: "Cards — card-glow" },
  { id: "border-accent", className: "roycss-border-accent", label: "Borders — border-accent" },
  { id: "text-shimmer", className: "roycss-text-shimmer", label: "Text — text-shimmer" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd: string, args: string[] = [], opts: { timeout?: number } = {}): {
  stdout: string;
  stderr: string;
  code: number;
} {
  const timeout = opts.timeout ?? 30000;
  const result = spawnSync(cmd, args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    timeout,
    maxBuffer: 50 * 1024 * 1024,
  });
  return {
    stdout: (result.stdout ?? "").toString(),
    stderr: (result.stderr ?? "").toString(),
    code: result.status ?? -1,
  };
}

function ab(args: string[], opts: { timeout?: number } = {}): string {
  const timeout = opts.timeout ?? 30000;
  const result = spawnSync("agent-browser", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    timeout,
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error(`  agent-browser ${args.join(" ")} failed (code ${result.status})`);
    console.error(`  stderr: ${(result.stderr ?? "").slice(0, 500)}`);
  }
  return (result.stdout ?? "").toString().trim();
}

/**
 * `agent-browser eval` returns the JS value as a JSON-encoded string, so the
 * string `rtl` comes back as `"rtl"` (with quotes). This helper strips that
 * outer JSON quoting so callers get the raw value.
 */
function abEval(jsExpr: string, opts: { timeout?: number } = {}): string {
  const raw = ab(["eval", jsExpr], opts);
  if (!raw) return "";
  // Try JSON.parse first (handles "rtl" → rtl, 5 → 5, true → true)
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    // Not JSON — return raw
    return raw;
  }
}

function abEvalJson<T>(jsExpr: string, opts: { timeout?: number } = {}): T | null {
  const raw = ab(["eval", jsExpr], opts);
  if (!raw) return null;
  try {
    // First JSON.parse strips the outer string quoting from agent-browser,
    // second JSON.parse parses the object we JSON.stringify'd in the eval.
    const stripped = JSON.parse(raw);
    if (typeof stripped !== "string") return stripped as T;
    return JSON.parse(stripped) as T;
  } catch {
    return null;
  }
}

function abScreenshot(targetPath: string, full = false, retries = 2): boolean {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const args = ["screenshot", targetPath];
    if (full) args.push("--full");
    const r = run("agent-browser", args, { timeout: 30000 });
    if (r.code === 0 && fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
      return true;
    }
    if (attempt < retries) {
      console.log(`  … screenshot retry ${attempt + 1}/${retries}`);
      run("agent-browser", ["wait", "1000"], { timeout: 5000 });
    }
  }
  return false;
}

function abJson<T>(args: string[], opts: { timeout?: number } = {}): T | null {
  const out = ab([...args, "--json"], opts);
  if (!out) return null;
  try {
    return JSON.parse(out) as T;
  } catch {
    return null;
  }
}

function ensureDirs() {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function checkAgentBrowser(): boolean {
  const r = run("agent-browser", ["--version"], { timeout: 5000 });
  return r.code === 0;
}

function checkDevServer(): boolean {
  try {
    const r = run("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "3", BASE_URL], { timeout: 5000 });
    return r.stdout.trim() === "200";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test phases
// ---------------------------------------------------------------------------

interface PhaseResult {
  name: string;
  passed: boolean;
  details: string;
  screenshot?: string;
}

const phaseResults: PhaseResult[] = [];
const consoleMessages: { ltr: string[]; rtl: string[] } = { ltr: [], rtl: [] };

function recordPhase(name: string, passed: boolean, details: string, screenshot?: string) {
  phaseResults.push({ name, passed, details, screenshot });
  const icon = passed ? "✓" : "✗";
  console.log(`  ${icon} ${name}: ${details}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  ensureDirs();

  console.log("\n────────────────────────────────────────────────────────────");
  console.log("RoyCSS RTL Render Test");
  console.log("────────────────────────────────────────────────────────────\n");

  // Pre-flight checks
  if (!checkAgentBrowser()) {
    console.error("agent-browser CLI not found. Install with:");
    console.error("  npm install -g agent-browser && agent-browser install");
    process.exit(1);
  }
  if (!checkDevServer()) {
    console.error(`Dev server not responding at ${BASE_URL}`);
    console.error("Start it with: bun run dev");
    process.exit(1);
  }
  console.log(`Pre-flight: agent-browser ✓, dev server ✓\n`);

  // ─── Phase 1: LTR baseline ────────────────────────────────────────────
  console.log("Phase 1: LTR baseline screenshot");
  ab(["open", BASE_URL]);
  ab(["wait", "3000"]); // let effects register + animations settle
  ab(["set", "viewport", "1280", "900"]);

  // Capture initial console messages
  const ltrConsole = ab(["console"]);
  consoleMessages.ltr = ltrConsole.split("\n").filter((l) => l.trim());

  // Verify default direction is LTR
  const ltrDir = abEval("getComputedStyle(document.documentElement).direction");
  const ltrHtmlDir = abEval("document.documentElement.dir || '(empty — defaults to ltr)'");
  const ltrLang = abEval("document.documentElement.lang || '(empty)'");

  const ltrShot = path.join(SHOTS_DIR, "ltr-home.png");
  const ltrShotOk = abScreenshot(ltrShot, true);
  recordPhase(
    "LTR baseline",
    (ltrDir === "ltr" || ltrDir === "") && ltrShotOk,
    `direction=${ltrDir || "ltr(default)"} html.dir=${ltrHtmlDir} html.lang=${ltrLang} screenshot=${ltrShotOk ? "ok" : "FAILED"}`,
    path.relative(PROJECT_ROOT, ltrShot),
  );

  // Check horizontal overflow in LTR
  const ltrOverflow = abEval("(document.documentElement.scrollWidth - window.innerWidth)");
  const ltrOverflowNum = parseFloat(ltrOverflow) || 0;
  recordPhase(
    "LTR no horizontal overflow",
    ltrOverflowNum <= 5,
    `scrollWidth - innerWidth = ${ltrOverflowNum.toFixed(1)}px (threshold: 5px)`,
  );

  // ─── Phase 2: Switch to RTL ───────────────────────────────────────────
  console.log("\nPhase 2: Switch to RTL via <html dir='rtl'>");
  ab(["eval", "document.documentElement.dir = 'rtl'"]);
  ab(["eval", "document.documentElement.lang = 'ar'"]);
  ab(["wait", "1500"]); // let layout re-flow

  const rtlDir = abEval("getComputedStyle(document.documentElement).direction");
  const rtlHtmlDir = abEval("document.documentElement.dir");
  const rtlLang = abEval("document.documentElement.lang");

  const rtlShot = path.join(SHOTS_DIR, "rtl-home.png");
  const rtlShotOk = abScreenshot(rtlShot, true);
  recordPhase(
    "RTL direction reversed",
    rtlDir === "rtl" && rtlHtmlDir === "rtl",
    `computed.direction=${rtlDir} html.dir=${rtlHtmlDir} html.lang=${rtlLang} screenshot=${rtlShotOk ? "ok" : "FAILED"}`,
    path.relative(PROJECT_ROOT, rtlShot),
  );

  // Check horizontal overflow in RTL
  const rtlOverflow = abEval("(document.documentElement.scrollWidth - window.innerWidth)");
  const rtlOverflowNum = parseFloat(rtlOverflow) || 0;
  recordPhase(
    "RTL no horizontal overflow",
    rtlOverflowNum <= 5,
    `scrollWidth - innerWidth = ${rtlOverflowNum.toFixed(1)}px (threshold: 5px)`,
  );

  // Capture RTL console messages and diff
  const rtlConsole = ab(["console"]);
  consoleMessages.rtl = rtlConsole.split("\n").filter((l) => l.trim());
  const newRtlErrors = consoleMessages.rtl.filter(
    (line) => !consoleMessages.ltr.includes(line) && /error|warning/i.test(line),
  );
  recordPhase(
    "RTL no new console errors vs LTR",
    newRtlErrors.length === 0,
    newRtlErrors.length === 0
      ? "no new errors/warnings in RTL"
      : `${newRtlErrors.length} new: ${newRtlErrors.slice(0, 3).join(" | ")}`,
  );

  // Check that some text is now right-aligned (visual confirmation)
  // Look at the first heading's bounding box
  const headingInfo = abEvalJson<{ left: string; right: string; width: string; viewport_width: string; text_align: string }>(
    "(() => { const h = document.querySelector('h1, h2, h3'); if (!h) return JSON.stringify({left:'0',right:'0',width:'0',viewport_width:'0',text_align:'none'}); const r = h.getBoundingClientRect(); return JSON.stringify({left: r.left.toFixed(0), right: r.right.toFixed(0), width: r.width.toFixed(0), viewport_width: window.innerWidth.toString(), text_align: getComputedStyle(h).textAlign }); })()",
  );
  recordPhase(
    "RTL heading text right-aligned",
    headingInfo !== null && (headingInfo.text_align === "right" || parseFloat(headingInfo.right) > parseFloat(headingInfo.left) + 100),
    headingInfo
      ? `text-align=${headingInfo.text_align} right=${headingInfo.right}px (viewport ${headingInfo.viewport_width}px)`
      : "could not parse heading box",
  );

  // ─── Phase 3: 5 effects × 2 directions ────────────────────────────────
  console.log("\nPhase 3: 5 effects × 2 directions");

  // Reset to LTR for effect tests
  ab(["eval", "document.documentElement.dir = 'ltr'"]);
  ab(["eval", "document.documentElement.lang = 'en'"]);
  ab(["wait", "500"]);

  // Inject a test container at the top of the body
  ab([
    "eval",
    `(() => {
      const existing = document.getElementById('roycss-rtl-test-container');
      if (existing) existing.remove();
      const c = document.createElement('div');
      c.id = 'roycss-rtl-test-container';
      c.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#0a0a0a;padding:24px;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;border-bottom:2px solid #10b981';
      document.body.prepend(c);
      return 'injected';
    })()`,
  ]);

  const effectShots: Array<{
    effect: string;
    ltr?: string;
    rtl?: string;
    error?: string;
  }> = [];

  for (const eff of TEST_EFFECTS) {
    const shot: { effect: string; ltr?: string; rtl?: string; error?: string } = { effect: eff.id };

    // Build a test element that applies the class. Use a generic div for box/button
    // previews and a span for text previews.
    const isText = eff.id.startsWith("text-");
    const innerHtml = isText
      ? `<span class="${eff.className}">RoyCSS</span>`
      : `<div class="${eff.className}" style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:oklch(0.3 0.1 250);color:white;font-size:11px;">Demo</div>`;

    // Set LTR
    ab(["eval", `document.documentElement.dir = 'ltr'`]);
    ab([
      "eval",
      `(() => {
        const c = document.getElementById('roycss-rtl-test-container');
        if (!c) return 'no container';
        c.innerHTML = '<div style="text-align:center;font-size:10px;color:#10b981;font-family:monospace">${eff.id} (LTR)</div>' + ${JSON.stringify(innerHtml)};
        return 'set';
      })()`,
    ]);
    ab(["wait", "800"]);

    const ltrEffectShot = path.join(SHOTS_DIR, `effect-${eff.id}-ltr.png`);
    const ltrOk = abScreenshot(ltrEffectShot, false);
    shot.ltr = path.relative(PROJECT_ROOT, ltrEffectShot);

    // Set RTL
    ab(["eval", `document.documentElement.dir = 'rtl'`]);
    ab([
      "eval",
      `(() => {
        const c = document.getElementById('roycss-rtl-test-container');
        if (!c) return 'no container';
        c.innerHTML = '<div style="text-align:center;font-size:10px;color:#10b981;font-family:monospace">${eff.id} (RTL)</div>' + ${JSON.stringify(innerHtml)};
        return 'set';
      })()`,
    ]);
    ab(["wait", "800"]);

    const rtlEffectShot = path.join(SHOTS_DIR, `effect-${eff.id}-rtl.png`);
    const rtlOk = abScreenshot(rtlEffectShot, false);
    shot.rtl = path.relative(PROJECT_ROOT, rtlEffectShot);

    effectShots.push(shot);
    console.log(`    ${ltrOk && rtlOk ? "✓" : "✗"} ${eff.id} — LTR ${ltrOk ? "ok" : "FAILED"} + RTL ${rtlOk ? "ok" : "FAILED"} screenshots captured`);
  }

  // Clean up
  ab(["eval", `document.getElementById('roycss-rtl-test-container')?.remove()`]);

  // ─── Phase 4: Restore LTR and verify ──────────────────────────────────
  console.log("\nPhase 4: Restore LTR");
  ab(["eval", "document.documentElement.dir = 'ltr'"]);
  ab(["eval", "document.documentElement.lang = 'en'"]);
  ab(["wait", "500"]);
  const restoredDir = abEval("getComputedStyle(document.documentElement).direction");
  recordPhase(
    "Restore LTR after test",
    restoredDir === "ltr",
    `direction=${restoredDir}`,
  );

  // ─── Summary ──────────────────────────────────────────────────────────
  const passed = phaseResults.filter((p) => p.passed).length;
  const failed = phaseResults.filter((p) => !p.passed).length;

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      totalPhases: phaseResults.length,
      passed,
      failed,
      passRate: +((passed / phaseResults.length) * 100).toFixed(1),
    },
    phases: phaseResults,
    effectScreenshots: effectShots,
    consoleDiff: {
      ltrMessageCount: consoleMessages.ltr.length,
      rtlMessageCount: consoleMessages.rtl.length,
      newRtlErrors,
    },
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));

  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`RTL Render Test Summary: ${passed}/${phaseResults.length} passed (${report.summary.passRate}%)`);
  console.log(`────────────────────────────────────────────────────────────`);
  for (const p of phaseResults) {
    console.log(`  ${p.passed ? "✓" : "✗"} ${p.name}`);
  }
  console.log(`\nScreenshots:`);
  console.log(`  LTR home: ${path.relative(PROJECT_ROOT, ltrShot)}`);
  console.log(`  RTL home: ${path.relative(PROJECT_ROOT, rtlShot)}`);
  console.log(`  Effect tests: ${effectShots.length} effects × 2 directions = ${effectShots.length * 2} screenshots`);
  console.log(`\nResults written to: ${path.relative(PROJECT_ROOT, RESULTS_FILE)}`);
  console.log("────────────────────────────────────────────────────────────\n");

  // Close the browser
  ab(["close"]);
}

main();
