/**
 * scripts/perf-budget.ts — RoyCSS page performance budget gate (issue #84 / PF-006)
 * ============================================================================
 *
 * Reads `perf/budget.json` (the single source of truth for page-level
 * performance budgets), measures the CURRENT values for every metric, prints
 * a comparison table (measured vs budget vs issue-#84 goal) plus a violations
 * table, writes `perf/results/budget-report.json`, and exits:
 *
 *   0 — every measured metric is within budget
 *   1 — at least one metric violates its budget (or a required source is missing)
 *   2 — setup/measurement error (no build, server won't start, browser missing)
 *
 * Measurement sources
 * -------------------
 *   runtime   — headless Chromium (Playwright) loads the production build
 *               (`next start`) and measures what the page actually ships:
 *               CSS/JS bytes (raw + gzip), web-font files, requests, DOM nodes,
 *               active CSS animations, elements with backdrop-filter.
 *   lighthouse— parsed from Lighthouse-LHR JSON reports written by
 *               `lhci collect`/`autorun` into `.lighthouseci/` (the
 *               `.github/workflows/lighthouse.yml` PR workflow). When several
 *               runs exist, the WORST value per metric is used (gate
 *               semantics). LCP / TBT / CLS come from here.
 *   field     — INP is a field (real-user) metric; lab Lighthouse cannot
 *               measure it. It is only enforced when field data is supplied
 *   via `perf/results/field-inp.json` or the PERF_FIELD_INP_MS env var.
 *   TBT gates the same responsiveness dimension in the lab.
 *
 * Usage
 * -----
 *   bun run perf:budget                          # measure + gate everything possible
 *   bun run perf:budget --require-lighthouse     # fail unless LCP/CLS/TBT reports exist (CI)
 *   bun run perf:budget --url http://localhost:3000/   # skip server start
 *   bun run perf:budget --skip-runtime           # CSS-from-build only, no browser/server
 *   bun run perf:budget --port 3310              # server port for the built-in next start
 *
 * Requires a production build (`bun run build`) — the script checks
 * `.next/BUILD_ID` before measuring.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const BUDGET_PATH = join(PROJECT_ROOT, "perf", "budget.json");
const REPORT_PATH = join(PROJECT_ROOT, "perf", "results", "budget-report.json");
const LHCI_DIR = join(PROJECT_ROOT, ".lighthouseci");
const FIELD_INP_PATH = join(PROJECT_ROOT, "perf", "results", "field-inp.json");

// ─── Types ─────────────────────────────────────────────────────────────────

type Comparator = "lt" | "lte" | "gt" | "gte" | "eq";
type Source = "runtime" | "lighthouse" | "field";

interface BudgetMetric {
  /** Enforced ceiling/floor — fails the gate when breached. */
  budget: number;
  /** Issue #84 target (informational north-star; may not be met today). */
  goal?: number;
  unit: "bytes" | "ms" | "count" | "ratio";
  comparator: Comparator;
  source: Source;
  note?: string;
}

interface BudgetFile {
  schema: string;
  page: string;
  metrics: Record<string, BudgetMetric>;
}

interface Measurement {
  value: number;
  /** Where the number came from; undefined = not measured in this run. */
  measured?: Source;
  /** Extra context for the report (e.g. number of runs, file counts). */
  detail?: string;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): boolean {
  return args.includes(`--${name}`);
}
function flagValue(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}
const OPT = {
  requireLighthouse: flag("require-lighthouse"),
  skipRuntime: flag("skip-runtime"),
  url: flagValue("url") ?? process.env.PERF_BUDGET_URL,
  port: Number(flagValue("port") ?? process.env.PERF_BUDGET_PORT ?? 3310),
  settleMs: Number(process.env.PERF_BUDGET_SETTLE_MS ?? 2500),
};

// ─── Formatting helpers ────────────────────────────────────────────────────

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtValue(n: number, unit: BudgetMetric["unit"]): string {
  switch (unit) {
    case "bytes": return fmtBytes(n);
    case "ms": return `${Math.round(n * 100) / 100} ms`;
    case "ratio": return n.toFixed(4);
    default: return String(Math.round(n));
  }
}

function fmtComparator(c: Comparator): string {
  switch (c) {
    case "lt": return "<";
    case "lte": return "≤";
    case "gt": return ">";
    case "gte": return "≥";
    case "eq": return "=";
  }
}

// ─── Budget loading + validation ───────────────────────────────────────────

function loadBudget(): BudgetFile {
  if (!existsSync(BUDGET_PATH)) {
    console.error(`✗ budget file missing: ${BUDGET_PATH}`);
    process.exit(2);
  }
  const raw: unknown = JSON.parse(readFileSync(BUDGET_PATH, "utf-8"));
  if (typeof raw !== "object" || raw === null) bail("budget.json: top level must be an object");
  const file = raw as Partial<BudgetFile>;
  if (file.schema !== "roycss.perf-budget.v1") bail(`budget.json: unexpected schema ${String(file.schema)}`);
  if (typeof file.page !== "string") bail("budget.json: missing string field 'page'");
  if (typeof file.metrics !== "object" || file.metrics === null) bail("budget.json: missing 'metrics' object");
  for (const [id, m] of Object.entries(file.metrics)) {
    if (typeof m?.budget !== "number") bail(`budget.json: metric '${id}' has no numeric 'budget'`);
    if (typeof m.unit !== "string" || !["bytes", "ms", "count", "ratio"].includes(m.unit)) {
      bail(`budget.json: metric '${id}' has invalid 'unit'`);
    }
    if (typeof m.comparator !== "string" || !["lt", "lte", "gt", "gte", "eq"].includes(m.comparator)) {
      bail(`budget.json: metric '${id}' has invalid 'comparator'`);
    }
    if (!["runtime", "lighthouse", "field"].includes(m.source)) {
      bail(`budget.json: metric '${id}' has invalid 'source' (runtime|lighthouse|field)`);
    }
    if (m.goal !== undefined && typeof m.goal !== "number") bail(`budget.json: metric '${id}' goal must be a number`);
  }
  return file as BudgetFile;
}

function bail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(2);
}

// ─── Measurement: production server ────────────────────────────────────────

let server: ChildProcess | undefined;

async function startServer(port: number): Promise<string> {
  const buildId = join(PROJECT_ROOT, ".next", "BUILD_ID");
  if (!existsSync(buildId)) {
    console.error("✗ no production build found (.next/BUILD_ID missing). Run `bun run build` first.");
    process.exit(2);
  }
  console.log(`▶ starting production server on :${port} (bunx next start)`);
  // detached: own process group, so stopServer() can kill bunx AND the
  // next-server grandchild in one shot (SIGTERM to the wrapper alone
  // leaves the server orphaned and the port busy).
  server = spawn("bunx", ["next", "start", "-p", String(port)], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });
  let log = "";
  server.stdout?.on("data", (d) => (log += d));
  server.stderr?.on("data", (d) => (log += d));

  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) {
        console.log(`  server ready (HTTP ${res.status})`);
        return url;
      }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.error(`✗ next start never became ready on :${port}\n${log}`);
  process.exit(2);
}

function stopServer(): void {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM"); // whole process group (bunx + next-server)
    } catch {
      try { server.kill("SIGTERM"); } catch { /* already gone */ }
    }
    server = undefined;
  }
}
process.on("exit", stopServer);
process.on("SIGINT", () => { stopServer(); process.exit(130); });
process.on("SIGTERM", () => { stopServer(); process.exit(143); });

// ─── Measurement: runtime (Playwright headless) ────────────────────────────

interface LoadedResource {
  type: string;
  raw: number;
  gzip: number;
  atLoad: boolean;
}

interface RuntimeMetrics {
  cssRaw: number;
  cssGzip: number;
  jsGzip: number;
  jsRaw: number;
  webFonts: number;
  webFontBytes: number;
  requests: number;
  domNodes: number;
  activeAnimations: number;
  backdropFilterElements: number;
  fontFacesDeclared: number;
}

async function measureRuntime(url: string): Promise<RuntimeMetrics> {
  let chromium;
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch {
    console.error("✗ @playwright/test is not installed — run `bun install`.");
    process.exit(2);
  }
  console.log("▶ launching headless Chromium (Playwright)");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error(`✗ could not launch Chromium: ${err instanceof Error ? err.message : String(err)}`);
    console.error("  Install it with: bunx playwright install chromium");
    process.exit(2);
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: "no-preference", // deterministic animation count
  });
  // Block the PWA service worker: its registration triggers a controller
  // change → page reload, which would double-count every resource.
  await context.route("**/sw.js", (route) => route.abort());

  const page = await context.newPage();
  const seen = new Map<string, LoadedResource>();
  let loadFired = false;
  page.on("load", () => { loadFired = true; });
  page.on("response", async (res) => {
    const type = res.request().resourceType();
    if (!["stylesheet", "script", "font", "document"].includes(type)) return;
    try {
      const body = await res.body();
      if (!seen.has(res.url())) {
        // gzip level 6 (zlib default) ≈ typical CDN/server gzip config.
        seen.set(res.url(), { type, raw: body.length, gzip: gzipSync(body).length, atLoad: !loadFired });
      }
    } catch { /* body unavailable (e.g. cached response) */ }
  });

  console.log(`▶ loading ${url} (viewport 1280×720, service worker blocked)`);
  const response = await page.goto(url, { waitUntil: "load", timeout: 90_000 });
  if (!response || response.status() >= 400) {
    console.error(`✗ page returned HTTP ${response?.status() ?? "n/a"}`);
    await browser.close();
    process.exit(2);
  }
  // Settle: hydration, entrance animations, virtual-scroll grid.
  await page.waitForTimeout(OPT.settleMs);

  const dom = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("*"));
    let backdropFilterElements = 0;
    let activeAnimations = 0;
    let fontFacesDeclared = 0;
    for (const el of els) {
      const s = getComputedStyle(el);
      if (s.backdropFilter && s.backdropFilter !== "none") backdropFilterElements++;
      // "Active" = a non-`none` CSS animation that is not paused. Transitions
      // (one-shot) are excluded via animationName.
      if (s.animationName && s.animationName !== "none" && s.animationPlayState !== "paused") {
        activeAnimations++;
      }
    }
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = (sheet as CSSStyleSheet).cssRules;
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSFontFaceRule) fontFacesDeclared++;
        }
      } catch { /* cross-origin stylesheet */ }
    }
    const resources = performance.getEntriesByType("resource");
    return { domNodes: els.length, backdropFilterElements, activeAnimations, fontFacesDeclared, requests: resources.length + 1 };
  });

  const all = [...seen.values()];
  const css = all.filter((r) => r.type === "stylesheet");
  // All unique script chunks fetched during load+settle. Route-prefetch
  // chunks (Next.js <Link> prefetch) are included deliberately: they are
  // JS bytes the page ships to the user, and the full-unique set is
  // deterministic run-to-run (the "before load event" subset is racy —
  // hydration timing moves chunks across the boundary).
  const js = all.filter((r) => r.type === "script");
  const jsAtLoad = js.filter((r) => r.atLoad);
  const fonts = all.filter((r) => r.type === "font");

  const metrics: RuntimeMetrics = {
    cssRaw: css.reduce((a, r) => a + r.raw, 0),
    cssGzip: css.reduce((a, r) => a + r.gzip, 0),
    jsRaw: js.reduce((a, r) => a + r.raw, 0),
    jsGzip: js.reduce((a, r) => a + r.gzip, 0),
    webFonts: fonts.length,
    webFontBytes: fonts.reduce((a, r) => a + r.raw, 0),
    requests: dom.requests,
    domNodes: dom.domNodes,
    activeAnimations: dom.activeAnimations,
    backdropFilterElements: dom.backdropFilterElements,
    fontFacesDeclared: dom.fontFacesDeclared,
  };
  console.log(
    `  css=${fmtBytes(metrics.cssRaw)} raw / ${fmtBytes(metrics.cssGzip)} gz (${css.length} files) · ` +
    `js=${fmtBytes(metrics.jsGzip)} gz (${js.length} chunks, ${jsAtLoad.length} at load) · fonts=${metrics.webFonts} · ` +
    `requests=${metrics.requests} · dom=${metrics.domNodes} · anims=${metrics.activeAnimations} · ` +
    `backdrop=${metrics.backdropFilterElements}`
  );

  await browser.close();
  return metrics;
}

/**
 * Browserless fallback for the CSS metrics only: the Next.js build emits all
 * site CSS as global chunks under `.next/static/` (the page loads exactly
 * those files — verified by the runtime probe), so their sizes are a complete
 * CSS measurement without a browser.
 */
function measureCssFromBuild(): { cssRaw: number; cssGzip: number; files: number } {
  const chunksDir = join(PROJECT_ROOT, ".next", "static", "chunks");
  if (!existsSync(chunksDir)) {
    console.error("✗ no production build found (.next/static/chunks missing). Run `bun run build` first.");
    process.exit(2);
  }
  const cssFiles = readdirSync(chunksDir).filter((f) => f.endsWith(".css"));
  let raw = 0;
  let gz = 0;
  for (const f of cssFiles) {
    const body = readFileSync(join(chunksDir, f));
    raw += body.length;
    gz += gzipSync(body).length;
  }
  return { cssRaw: raw, cssGzip: gz, files: cssFiles.length };
}

// ─── Measurement: Lighthouse LHR reports ───────────────────────────────────

interface LighthouseMetrics {
  lcp: number;
  tbt: number;
  cls: number;
  runs: number;
}

const LHR_AUDITS: Record<keyof Omit<LighthouseMetrics, "runs">, string> = {
  lcp: "largest-contentful-paint",
  tbt: "total-blocking-time",
  cls: "cumulative-layout-shift",
};

function measureLighthouse(): LighthouseMetrics | null {
  if (!existsSync(LHCI_DIR)) return null;
  const files = readdirSync(LHCI_DIR).filter((f) => f.startsWith("lhr-") && f.endsWith(".json"));
  if (files.length === 0) return null;
  // Worst run per metric — a gate must fail if ANY run breached the budget.
  const worst: LighthouseMetrics = { lcp: -Infinity, tbt: -Infinity, cls: -Infinity, runs: files.length };
  for (const f of files) {
    let lhr: { audits?: Record<string, { numericValue?: number }> };
    try {
      lhr = JSON.parse(readFileSync(join(LHCI_DIR, f), "utf-8"));
    } catch {
      console.warn(`  ⚠ skipping unparseable LHR: ${f}`);
      continue;
    }
    for (const key of Object.keys(LHR_AUDITS) as (keyof Omit<LighthouseMetrics, "runs">)[]) {
      const numeric = lhr.audits?.[LHR_AUDITS[key]]?.numericValue;
      if (typeof numeric === "number") worst[key] = Math.max(worst[key], numeric);
    }
  }
  if (worst.lcp === -Infinity) return null;
  return worst;
}

// ─── Measurement: field INP ────────────────────────────────────────────────

function measureFieldInp(): { value: number; detail: string } | null {
  const envInp = process.env.PERF_FIELD_INP_MS;
  if (envInp && Number.isFinite(Number(envInp))) {
    return { value: Number(envInp), detail: "PERF_FIELD_INP_MS env var" };
  }
  if (existsSync(FIELD_INP_PATH)) {
    try {
      const data = JSON.parse(readFileSync(FIELD_INP_PATH, "utf-8")) as { inp?: number; source?: string; collectedAt?: string };
      const inp = data.inp;
      if (typeof inp === "number" && Number.isFinite(inp)) {
        return { value: inp, detail: `perf/results/field-inp.json (${data.source ?? "unspecified"}${data.collectedAt ? `, ${data.collectedAt}` : ""})` };
      }
    } catch { /* fall through */ }
  }
  return null;
}

// ─── Evaluation + reporting ────────────────────────────────────────────────

interface Row {
  id: string;
  metric: BudgetMetric;
  measurement: Measurement;
  status: "pass" | "fail" | "info";
}

function evaluate(id: string, metric: BudgetMetric, measurement: Measurement): Row["status"] {
  if (measurement.value === undefined || measurement.measured === undefined) return "info";
  const v = measurement.value;
  switch (metric.comparator) {
    case "lt":  return v <  metric.budget ? "pass" : "fail";
    case "lte": return v <= metric.budget ? "pass" : "fail";
    case "gt":  return v >  metric.budget ? "pass" : "fail";
    case "gte": return v >= metric.budget ? "pass" : "fail";
    case "eq":  return v === metric.budget ? "pass" : "fail";
  }
}

function printTable(rows: Row[]): void {
  const metricName = (r: Row) => r.id.replace(/-/g, " ");
  const cols = ["STATUS", "METRIC", "MEASURED", "BUDGET", "GOAL #84", "SOURCE"];
  const cells = rows.map((r) => [
    r.status === "pass" ? "✓ PASS" : r.status === "fail" ? "✗ FAIL" : "  INFO",
    metricName(r),
    r.measurement.value === undefined ? "— not measured" : fmtValue(r.measurement.value, r.metric.unit),
    `${fmtComparator(r.metric.comparator)} ${fmtValue(r.metric.budget, r.metric.unit)}`,
    r.metric.goal === undefined ? "—" : fmtValue(r.metric.goal, r.metric.unit),
    r.measurement.measured ?? r.metric.source,
  ]);
  const widths = cols.map((c, i) => Math.max(c.length, ...cells.map((row) => row[i].length)));
  const line = (row: string[]) => row.map((c, i) => ` ${c.padEnd(widths[i])} `).join("│");
  const rule = "─" + widths.map((w) => "─".repeat(w + 2)).join("┼") + "─";
  console.log(rule);
  console.log(line(cols));
  console.log(rule);
  for (const row of cells) console.log(line(row));
  console.log(rule);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const budget = loadBudget();
  const startedAt = new Date().toISOString();
  const t0 = process.hrtime.bigint();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  RoyCSS Page Performance Budget Gate");
  console.log(`  page:      ${budget.page}`);
  console.log(`  budget:    perf/budget.json (${Object.keys(budget.metrics).length} metrics)`);
  console.log(`  started:   ${startedAt}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // 1. Runtime metrics (browser) or browserless CSS fallback.
  let runtime: RuntimeMetrics | null = null;
  let cssFromBuild: { cssRaw: number; cssGzip: number; files: number } | null = null;
  if (!OPT.skipRuntime) {
    const url = OPT.url ?? (await startServer(OPT.port));
    runtime = await measureRuntime(url);
    if (!OPT.url) stopServer();
  } else {
    console.log("▶ --skip-runtime: measuring CSS from .next/static only");
    cssFromBuild = measureCssFromBuild();
    console.log(`  css=${fmtBytes(cssFromBuild.cssRaw)} raw / ${fmtBytes(cssFromBuild.cssGzip)} gz (${cssFromBuild.files} files)`);
  }

  // 2. Lighthouse metrics (worst run across .lighthouseci/lhr-*.json).
  const lh = measureLighthouse();
  if (lh) {
    console.log(`▶ lighthouse: ${lh.runs} LHR report(s) in .lighthouseci/ — LCP=${lh.lcp.toFixed(0)}ms TBT=${lh.tbt.toFixed(0)}ms CLS=${lh.cls.toFixed(4)} (worst run)`);
  } else {
    console.log("▶ lighthouse: no LHR reports in .lighthouseci/ (run `bunx lhci collect` or the lighthouse workflow)");
    if (OPT.requireLighthouse) {
      console.error("✗ --require-lighthouse set but no Lighthouse report was found — cannot gate LCP/CLS/TBT.");
    }
  }

  // 3. Field INP.
  const fieldInp = measureFieldInp();
  if (fieldInp) {
    console.log(`▶ field INP: ${fieldInp.value} ms (${fieldInp.detail})`);
  } else {
    console.log("▶ field INP: no field data (lab-safe: TBT gates responsiveness; supply perf/results/field-inp.json to enforce)");
  }

  // 4. Resolve measurements per metric id.
  const measurements: Record<string, Measurement> = {};
  if (runtime) {
    measurements["css-raw"] = { value: runtime.cssRaw, measured: "runtime", detail: "sum of stylesheet responses (raw bytes)" };
    measurements["css-gzip"] = { value: runtime.cssGzip, measured: "runtime", detail: "gzip level 6 of stylesheet bodies" };
    measurements["js-gzip"] = { value: runtime.jsGzip, measured: "runtime", detail: `${fmtBytes(runtime.jsRaw)} raw across all script chunks incl. route prefetch` };
    measurements["web-fonts"] = { value: runtime.webFonts, measured: "runtime", detail: `${fmtBytes(runtime.webFontBytes)} of font files; ${runtime.fontFacesDeclared} @font-face rules declared` };
    measurements["requests"] = { value: runtime.requests, measured: "runtime", detail: "navigation + resource entries" };
    measurements["dom-nodes"] = { value: runtime.domNodes, measured: "runtime", detail: "document.querySelectorAll('*')" };
    measurements["active-animations"] = { value: runtime.activeAnimations, measured: "runtime", detail: "elements with running, unpaused CSS animations" };
    measurements["backdrop-filter-elements"] = { value: runtime.backdropFilterElements, measured: "runtime", detail: "computed backdrop-filter !== none" };
  } else if (cssFromBuild) {
    measurements["css-raw"] = { value: cssFromBuild.cssRaw, measured: "runtime", detail: `${cssFromBuild.files} CSS chunks in .next/static (--skip-runtime)` };
    measurements["css-gzip"] = { value: cssFromBuild.cssGzip, measured: "runtime", detail: "gzip level 6 of .next/static CSS chunks (--skip-runtime)" };
  }
  if (lh) {
    measurements["lcp"] = { value: lh.lcp, measured: "lighthouse", detail: `${lh.runs} run(s), worst` };
    measurements["tbt"] = { value: lh.tbt, measured: "lighthouse", detail: `${lh.runs} run(s), worst` };
    measurements["cls"] = { value: lh.cls, measured: "lighthouse", detail: `${lh.runs} run(s), worst` };
  }
  if (fieldInp) measurements["inp"] = { value: fieldInp.value, measured: "field", detail: fieldInp.detail };

  // 5. Evaluate.
  const rows: Row[] = Object.entries(budget.metrics).map(([id, metric]) => {
    const measurement = measurements[id] ?? { value: undefined };
    let status = evaluate(id, metric, measurement);
    // A required but missing source is a failure, not a pass.
    if (status === "info" && OPT.requireLighthouse && metric.source === "lighthouse") status = "fail";
    return { id, metric, measurement, status };
  });

  // 6. Report.
  const elapsedMs = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════════════════════════\n");
  printTable(rows);

  const failures = rows.filter((r) => r.status === "fail");
  const passes = rows.filter((r) => r.status === "pass");
  const infos = rows.filter((r) => r.status === "info");
  console.log(`  SUMMARY   pass=${passes.length}  fail=${failures.length}  info(not measured)=${infos.length}  elapsed=${elapsedMs.toFixed(0)}ms`);

  if (failures.length > 0) {
    console.log("\n  VIOLATIONS:");
    for (const f of failures) {
      const measured = f.measurement.value === undefined
        ? "not measured"
        : `${fmtValue(f.measurement.value, f.metric.unit)} vs ${fmtComparator(f.metric.comparator)} ${fmtValue(f.metric.budget, f.metric.unit)}`;
      console.log(`    ✗ ${f.id}: ${measured}`);
      if (f.metric.note) console.log(`      ${f.metric.note}`);
      if (f.metric.goal !== undefined && f.measurement.value !== undefined) {
        console.log(`      (issue #84 goal: ${fmtComparator(f.metric.comparator)} ${fmtValue(f.metric.goal, f.metric.unit)})`);
      }
    }
  }
  for (const i of infos) {
    if (i.metric.source === "field") {
      console.log(`  ℹ ${i.id}: field-only metric (no field data supplied this run) — lab proxy is TBT`);
    } else if (!runtime) {
      console.log(`  ℹ ${i.id}: runtime skipped (--skip-runtime)`);
    } else if (i.metric.source === "lighthouse") {
      console.log(`  ℹ ${i.id}: no Lighthouse report — run the lighthouse workflow or \`bunx lhci collect\``);
    }
  }
  console.log("");

  // 7. JSON report for CI evidence.
  const report = {
    schema: "roycss.perf-budget.v1",
    startedAt,
    finishedAt: new Date().toISOString(),
    elapsedMs: Number(elapsedMs.toFixed(1)),
    page: budget.page,
    url: OPT.url ?? (OPT.skipRuntime ? "(no server — .next/static)" : `http://localhost:${OPT.port}/`),
    requireLighthouse: OPT.requireLighthouse,
    summary: {
      total: rows.length,
      pass: passes.length,
      fail: failures.length,
      info: infos.length,
      exitCode: failures.length > 0 ? 1 : 0,
    },
    metrics: Object.fromEntries(
      rows.map((r) => [r.id, {
        measured: r.measurement.value ?? null,
        source: r.measurement.measured ?? r.metric.source,
        budget: r.metric.budget,
        goal: r.metric.goal ?? null,
        comparator: r.metric.comparator,
        unit: r.metric.unit,
        status: r.status,
        detail: r.measurement.detail ?? null,
        note: r.metric.note ?? null,
      }])
    ),
  };
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf-8");
  console.log(`▸ JSON report written to ${REPORT_PATH}\n`);

  return failures.length > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    stopServer();
    console.error("perf-budget crashed:", err);
    process.exit(2);
  });
