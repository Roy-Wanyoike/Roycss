/**
 * bundle-size.ts — Measure dist/ + cli/ + mcp-server/ artifact sizes
 *                  (raw + gzipped + brotlied) and report budget pass/fail.
 *
 * Run:   bun run performance/bundle-size.ts
 * Output: Human-readable table to stdout + JSON to performance/results/bundle-size.json
 *
 * The script is dependency-free (only Node:fs, Node:zlib, Node:path). It does
 * NOT modify any files in dist/ — it reads them with fs.readFileSync and
 * compresses in-memory.
 *
 * If the mcp-server has not been built (no mcp-server/index.js), we measure
 * the .ts source instead and flag the row as `info` with a note. Building
 * the mcp-server is out of scope for the performance domain (file ownership
 * rules forbid touching mcp-server/).
 */

import { readFileSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, brotliCompressSync } from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const resultsDir = join(__dirname, "results");

// ─── Budgets ──────────────────────────────────────────────────────────────
import budgetsJson from "./budgets.json" with { type: "json" };
const B = budgetsJson.bundle as Record<
  string,
  { target: number; comparator: "lt" | "lte" | "gt" | "gte"; unit: string; label: string; info?: boolean }
>;

// ─── Helpers ──────────────────────────────────────────────────────────────
function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(3)} MB`;
}

function gzipSize(buf: Buffer): number {
  return gzipSync(buf, { level: 9 }).length;
}

function brotliSize(buf: Buffer): number {
  return brotliCompressSync(buf, { quality: 11 } as any).length;
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

interface Row {
  id: string;
  label: string;
  artifact: string;
  raw: number;
  gz: number | null;
  br: number | null;
  budgetId: keyof typeof B | null;
  status: "PASS" | "FAIL" | "INFO" | "MISSING";
  note?: string;
}

// ─── Per-category CSS breakdown ───────────────────────────────────────────
interface EffectMeta { id: string; category: string; }
function perCategorySize(cssPath: string, effectsPath: string): { category: string; bytes: number; effects: number }[] {
  const css = readFileSync(cssPath, "utf8");
  const effects: EffectMeta[] = JSON.parse(readFileSync(effectsPath, "utf8"));
  const byId = new Map(effects.map((e) => [e.id, e.category]));
  // Each effect's CSS block is delimited by `/* === effect-id === */` or `.roycss-<id> {`.
  // We extract the byte range for each effect by scanning for `.roycss-<id>` selectors
  // and slicing until the next `.roycss-` selector OR a balanced `}` at top level.
  // Simpler approach: split on `/* === ` comment markers (used by build-package.ts).
  const markerRe = /\/\*={2,}\s*([a-z0-9-]+)\s*={2,}\*\//gi;
  const markers: { id: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(css)) !== null) {
    markers.push({ id: m[1], start: m.index });
  }
  // Fallback: if no markers, scan for .roycss-<id> {
  if (markers.length === 0) {
    const selRe = /\.roycss-([a-z0-9-]+)\s*[,{]/gi;
    while ((m = selRe.exec(css)) !== null) {
      markers.push({ id: m[1], start: m.index });
    }
  }
  const byCat = new Map<string, { bytes: number; effects: number }>();
  for (let i = 0; i < markers.length; i++) {
    const id = markers[i].id;
    const start = markers[i].start;
    const end = i + 1 < markers.length ? markers[i + 1].start : css.length;
    const slice = css.slice(start, end);
    const cat = byId.get(id) ?? "uncategorized";
    const cur = byCat.get(cat) ?? { bytes: 0, effects: 0 };
    cur.bytes += slice.length;
    cur.effects += 1;
    byCat.set(cat, cur);
  }
  return Array.from(byCat.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.bytes - a.bytes);
}

// ─── Main ─────────────────────────────────────────────────────────────────
function main(): void {
  const rows: Row[] = [];
  const distDir = join(projectRoot, "dist");

  // roycss.css
  const cssPath = join(distDir, "roycss.css");
  if (existsSync(cssPath)) {
    const buf = readFileSync(cssPath);
    rows.push({
      id: "roycss.css",
      label: B.roycssCssRaw.label,
      artifact: "dist/roycss.css",
      raw: buf.length,
      gz: gzipSize(buf),
      br: brotliSize(buf),
      budgetId: "roycssCssRaw",
      status: B.roycssCssRaw.info ? "INFO" : check(buf.length, B.roycssCssRaw.target, B.roycssCssRaw.comparator),
    });
  } else {
    rows.push({ id: "roycss.css", label: "dist/roycss.css (MISSING)", artifact: cssPath, raw: 0, gz: null, br: null, budgetId: null, status: "MISSING" });
  }

  // roycss.min.css
  const minPath = join(distDir, "roycss.min.css");
  if (existsSync(minPath)) {
    const buf = readFileSync(minPath);
    rows.push({
      id: "roycss.min.css",
      label: B.roycssMinCssRaw.label,
      artifact: "dist/roycss.min.css",
      raw: buf.length,
      gz: gzipSize(buf),
      br: brotliSize(buf),
      budgetId: "roycssMinCssRaw",
      status: check(buf.length, B.roycssMinCssRaw.target, B.roycssMinCssRaw.comparator),
    });
    // Add budgeted gzipped row
    rows.push({
      id: "roycss.min.css.gz",
      label: B.roycssMinCssGz.label,
      artifact: "dist/roycss.min.css (gzipped)",
      raw: gzipSize(buf),
      gz: null,
      br: null,
      budgetId: "roycssMinCssGz",
      status: check(gzipSize(buf), B.roycssMinCssGz.target, B.roycssMinCssGz.comparator),
    });
    // Add info brotlied row
    const brSize = brotliSize(buf);
    rows.push({
      id: "roycss.min.css.br",
      label: B.roycssMinCssBr.label,
      artifact: "dist/roycss.min.css (brotlied)",
      raw: brSize,
      gz: null,
      br: null,
      budgetId: "roycssMinCssBr",
      status: B.roycssMinCssBr.info ? "INFO" : check(brSize, B.roycssMinCssBr.target, B.roycssMinCssBr.comparator),
    });
  } else {
    rows.push({ id: "roycss.min.css", label: "dist/roycss.min.css (MISSING)", artifact: minPath, raw: 0, gz: null, br: null, budgetId: null, status: "MISSING" });
  }

  // effects.json
  const jsonPath = join(distDir, "effects.json");
  if (existsSync(jsonPath)) {
    const buf = readFileSync(jsonPath);
    rows.push({
      id: "effects.json",
      label: B.effectsJsonRaw.label,
      artifact: "dist/effects.json",
      raw: buf.length,
      gz: gzipSize(buf),
      br: null, // JSON: skip brotli (gzip is the wire standard)
      budgetId: "effectsJsonRaw",
      status: check(buf.length, B.effectsJsonRaw.target, B.effectsJsonRaw.comparator),
    });
    rows.push({
      id: "effects.json.gz",
      label: B.effectsJsonGz.label,
      artifact: "dist/effects.json (gzipped)",
      raw: gzipSize(buf),
      gz: null,
      br: null,
      budgetId: "effectsJsonGz",
      status: check(gzipSize(buf), B.effectsJsonGz.target, B.effectsJsonGz.comparator),
    });
  } else {
    rows.push({ id: "effects.json", label: "dist/effects.json (MISSING)", artifact: jsonPath, raw: 0, gz: null, br: null, budgetId: null, status: "MISSING" });
  }

  // cli/index.js
  const cliPath = join(projectRoot, "cli", "index.js");
  if (existsSync(cliPath)) {
    const buf = readFileSync(cliPath);
    rows.push({
      id: "cli/index.js",
      label: B.cliIndexJsRaw.label,
      artifact: "cli/index.js",
      raw: buf.length,
      gz: gzipSize(buf),
      br: brotliSize(buf),
      budgetId: "cliIndexJsRaw",
      status: check(buf.length, B.cliIndexJsRaw.target, B.cliIndexJsRaw.comparator),
    });
  } else {
    rows.push({ id: "cli/index.js", label: "cli/index.js (MISSING)", artifact: cliPath, raw: 0, gz: null, br: null, budgetId: null, status: "MISSING" });
  }

  // mcp-server/index.js (after build) OR mcp-server/index.ts (source)
  const mcpJsPath = join(projectRoot, "mcp-server", "index.js");
  const mcpTsPath = join(projectRoot, "mcp-server", "index.ts");
  if (existsSync(mcpJsPath)) {
    const buf = readFileSync(mcpJsPath);
    rows.push({
      id: "mcp-server/index.js",
      label: B.mcpServerIndexJsRaw.label,
      artifact: "mcp-server/index.js (built)",
      raw: buf.length,
      gz: gzipSize(buf),
      br: brotliSize(buf),
      budgetId: "mcpServerIndexJsRaw",
      status: check(buf.length, B.mcpServerIndexJsRaw.target, B.mcpServerIndexJsRaw.comparator),
    });
  } else if (existsSync(mcpTsPath)) {
    // Not built — measure source as info, flag the budget as INFO (cannot PASS a built-size budget against source)
    const buf = readFileSync(mcpTsPath);
    rows.push({
      id: "mcp-server/index.ts",
      label: "mcp-server/index.ts (source — not built)",
      artifact: "mcp-server/index.ts",
      raw: buf.length,
      gz: gzipSize(buf),
      br: brotliSize(buf),
      budgetId: null,
      status: "INFO",
      note: "mcp-server not built; measured .ts source. Build with the mcp-server domain's tooling to populate the budget row.",
    });
  } else {
    rows.push({ id: "mcp-server/index", label: "mcp-server/index.{js,ts} (MISSING)", artifact: mcpJsPath, raw: 0, gz: null, br: null, budgetId: null, status: "MISSING" });
  }

  // Per-category CSS breakdown
  let categoryRows: { category: string; bytes: number; effects: number; pct: number }[] = [];
  if (existsSync(cssPath) && existsSync(jsonPath)) {
    const cats = perCategorySize(cssPath, jsonPath);
    const total = cats.reduce((s, c) => s + c.bytes, 0);
    categoryRows = cats.map((c) => ({ ...c, pct: (c.bytes / total) * 100 }));
  }

  // ─── Render ───────────────────────────────────────────────────────────
  const failCount = rows.filter((r) => r.status === "FAIL").length;
  const missingCount = rows.filter((r) => r.status === "MISSING").length;

  console.log("\n╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║           RoyCSS Performance — Bundle Size Benchmark                   ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");

  console.log("┌────────────────────────────────────────────┬──────────────┬──────────────┬──────────────┬──────────┐");
  console.log("│ Artifact                                   │        Raw   │    Gzip (-9) │   Brotli(11) │ Status   │");
  console.log("├────────────────────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────┤");
  for (const r of rows) {
    const label = r.label.length > 42 ? r.label.slice(0, 41) + "…" : r.label.padEnd(42);
    const raw = bytes(r.raw).padStart(12);
    const gz = r.gz === null ? "       —    " : bytes(r.gz).padStart(12);
    const br = r.br === null ? "       —    " : bytes(r.br).padStart(12);
    const status = r.status.padEnd(8);
    console.log(`│ ${label} │ ${raw} │ ${gz} │ ${br} │ ${status} │`);
  }
  console.log("└────────────────────────────────────────────┴──────────────┴──────────────┴──────────────┴──────────┘");

  // Budget pass/fail
  console.log("\nBudget gate:");
  for (const r of rows) {
    if (r.budgetId && r.budgetId in B) {
      const budget = B[r.budgetId];
      const statusIcon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "·";
      console.log(`  ${statusIcon} ${r.label.padEnd(48)} ${bytes(r.raw).padStart(12)}  ${budget.comparator}  ${bytes(budget.target).padStart(12)}   [${r.status}]`);
    }
  }
  if (rows.some((r) => r.note)) {
    console.log("\nNotes:");
    for (const r of rows) {
      if (r.note) console.log(`  · ${r.label}: ${r.note}`);
    }
  }

  // Per-category
  if (categoryRows.length > 0) {
    console.log("\nPer-category CSS breakdown (by source-marker slices):");
    console.log("┌──────────────────────────┬───────────┬──────────┬──────────┬─────────────────────────────────┐");
    console.log("│ Category                 │  Effects  │    Bytes │      %   │ Bar                             │");
    console.log("├──────────────────────────┼───────────┼──────────┼──────────┼─────────────────────────────────┤");
    for (const c of categoryRows) {
      const cat = c.category.padEnd(24);
      const eff = String(c.effects).padStart(9);
      const b = bytes(c.bytes).padStart(9);
      const pct = `${c.pct.toFixed(1)}%`.padStart(8);
      const bar = "█".repeat(Math.round(c.pct / 2)).padEnd(31);
      console.log(`│ ${cat} │ ${eff} │ ${b} │ ${pct} │ ${bar} │`);
    }
    console.log("└──────────────────────────┴───────────┴──────────┴──────────┴─────────────────────────────────┘");
  }

  console.log(`\nResult: ${rows.length} rows, ${rows.filter((r) => r.status === "PASS").length} PASS, ${failCount} FAIL, ${rows.filter((r) => r.status === "INFO").length} INFO, ${missingCount} MISSING.\n`);

  // ─── Save JSON ───────────────────────────────────────────────────────
  mkdirSync(resultsDir, { recursive: true });
  const report = {
    schema: "roycss.perf.bundle-size.v1",
    timestamp: new Date().toISOString(),
    rows,
    categories: categoryRows,
    summary: {
      total: rows.length,
      pass: rows.filter((r) => r.status === "PASS").length,
      fail: failCount,
      info: rows.filter((r) => r.status === "INFO").length,
      missing: missingCount,
    },
  };
  writeFileSync(join(resultsDir, "bundle-size.json"), JSON.stringify(report, null, 2));
  console.log(`JSON: ${join(resultsDir, "bundle-size.json")}\n`);

  if (failCount > 0 || missingCount > 0) {
    process.exit(1);
  }
}

main();
