/**
 * RoyCSS publish — package validator.
 *
 * Standalone validator. Run:
 *
 *   bun run scripts/publish/validate.ts
 *
 * Behavior:
 *   1. Reads the root `package.json` (the published "roycss" manifest).
 *   2. Checks every non-negated entry in the `files` array exists on disk.
 *   3. Reports the total unpacked size (sum of bytes of all included files).
 *   4. Count-drift gate (issue #212): parses the npm description of every
 *      publishable package.json (root, cli/, mcp-server/, vscode-extension/),
 *      extracts the advertised effects count and compares it against the
 *      length of dist/effects.json. Any drift fails validation — this is
 *      the gate that would have caught the 1,959→1,983 description staleness
 *      after batches 53/54.
 *   5. Runs `npm pack --dry-run --json` in a temp dir (package.json copied
 *      over, files array entries copied into temp dir).
 *   6. Reports the compressed tarball size, file count, and full file list.
 *   7. Exits 0 if all file checks pass; 1 otherwise.
 *
 * Exit codes:
 *   0 — all required files present, counts in sync, sizes reported
 *   1 — at least one required file missing, a description count drifted
 *       from dist/effects.json, or npm pack failed
 */

import { readFileSync, existsSync, statSync, cpSync, rmSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { checkDescriptionCounts, extractEffectsCount } from "./count-gate";

const ROOT = resolve(import.meta.dir, "..", "..");
const PKG_JSON_PATH = join(ROOT, "package.json");
const DIST_DIR = join(ROOT, "dist");

// ── ANSI colors ───────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(label: string, msg: string, color = C.reset): void {
  console.log(`${color}${C.bold}${label}${C.reset} ${msg}`);
}

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Read package.json (the root manifest IS the published manifest) ──
if (!existsSync(PKG_JSON_PATH)) {
  log("✗", `package.json not found at ${PKG_JSON_PATH}`, C.red);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8"));
// `!`-prefixed entries are npm tarball negations (e.g.
// "!dist/pro-components.json") — they exclude paths from the tarball, so
// they never need to exist on disk and are skipped when copying.
const filesArray: string[] = (Array.isArray(pkg.files) ? pkg.files : []).filter(
  (f: string) => !f.startsWith("!"),
);

log("📦", `Validating package: ${pkg.name}@${pkg.version}`, C.cyan);
log("→", `files array: [ ${filesArray.map((f) => `"${f}"`).join(", ")} ]`, C.dim);
console.log();

// ── 1. Check every entry in the `files` array exists ──────────────
let missingCount = 0;
let unpackedTotal = 0;
const fileRows: { path: string; exists: boolean; size: number; isDir: boolean }[] = [];

for (const entry of filesArray) {
  const abs = join(ROOT, entry);
  if (!existsSync(abs)) {
    fileRows.push({ path: entry, exists: false, size: 0, isDir: false });
    missingCount += 1;
    continue;
  }
  const stat = statSync(abs);
  if (stat.isDirectory()) {
    // Walk the directory and sum sizes
    let dirTotal = 0;
    const walk = (dir: string): void => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          walk(full);
        } else {
          dirTotal += statSync(full).size;
        }
      }
    };
    walk(abs);
    unpackedTotal += dirTotal;
    fileRows.push({ path: entry, exists: true, size: dirTotal, isDir: true });
  } else {
    unpackedTotal += stat.size;
    fileRows.push({ path: entry, exists: true, size: stat.size, isDir: false });
  }
}

console.log(`${C.bold}── Unpacked file sizes ──${C.reset}`);
for (const row of fileRows) {
  if (!row.exists) {
    log("  ✗", `${row.path.padEnd(28)} MISSING`, C.red);
  } else {
    const tag = row.isDir ? " (dir)" : "";
    log("  ✓", `${row.path.padEnd(28)} ${bytes(row.size).padStart(10)}${tag}`, C.green);
  }
}
console.log();
log("Σ", `Total unpacked size: ${bytes(unpackedTotal)}`, C.bold);
console.log();

// Fail fast if files are missing — npm pack would fail anyway.
if (missingCount > 0) {
  log("✗", `${missingCount} file(s) missing from \`files\` array. Aborting.`, C.red);
  process.exit(1);
}

// ── 1b. Count-drift gate (issue #212) ─────────────────────────────
// The npm-facing descriptions advertise the catalog size. If the catalog
// grows (new effects-batch-*.ts) and the descriptions don't, npm listings
// go stale. Compare every publishable manifest's stated count against
// dist/effects.json and fail on drift.
const PUBLISHABLE_PKG_JSONS = [
  "package.json", // roycss (npm)
  "cli/package.json", // roycss-cli
  "mcp-server/package.json", // roycss-mcp
  "vscode-extension/package.json", // RoyCSS VS Code extension
];
const EFFECTS_JSON_PATH = join(DIST_DIR, "effects.json");

console.log(`${C.bold}── Count-drift gate (descriptions vs dist/effects.json) ──${C.reset}`);
if (!existsSync(EFFECTS_JSON_PATH)) {
  log("✗", `dist/effects.json not found at ${EFFECTS_JSON_PATH} — run \`bun run build:package\` first.`, C.red);
  process.exit(1);
}
const actualEffects = JSON.parse(readFileSync(EFFECTS_JSON_PATH, "utf-8")).length as number;

const statedCounts = PUBLISHABLE_PKG_JSONS.map((rel) => {
  const manifest = JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as { description?: string };
  return { path: rel, description: String(manifest.description ?? "") };
});

for (const s of statedCounts) {
  const stated = extractEffectsCount(s.description);
  if (stated === null) {
    log("•", `${s.path.padEnd(32)} no effects count advertised — skipped`, C.dim);
  } else {
    const drifted = stated !== actualEffects;
    log(
      drifted ? "✗" : "✓",
      `${s.path.padEnd(32)} states ${stated} vs catalog ${actualEffects}${drifted ? "  DRIFT" : ""}`,
      drifted ? C.red : C.green,
    );
  }
}

const countViolations = checkDescriptionCounts(statedCounts, actualEffects);
console.log();
if (countViolations.length > 0) {
  for (const v of countViolations) {
    log("✗", `${v.path}: description says ${v.stated} effects but dist/effects.json has ${v.actual}.`, C.red);
  }
  log("✗", "Count-drift gate FAILED — update the npm descriptions (and README) to the catalog size, then re-run.", C.red);
  process.exit(1);
}
log("✓", `Count-drift gate PASSED — all advertised counts match the ${actualEffects}-effect catalog.`, C.green);
console.log();

// ── 2. Run `npm pack --dry-run --json` in a temp dir ─────────────
log("🧪", "Running `npm pack --dry-run --json` in isolated temp dir…", C.cyan);

const TMP = join(tmpdir(), `roycss-validate-${Date.now()}`);
mkdirSync(TMP, { recursive: true });

try {
  // Copy the root package.json → temp/package.json
  writeFileSync(join(TMP, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");

  // Copy every entry in the `files` array from project root → temp dir.
  for (const entry of filesArray) {
    const src = join(ROOT, entry);
    const dst = join(TMP, entry);
    if (existsSync(src)) {
      mkdirSync(dirname(dst), { recursive: true });
      cpSync(src, dst, { recursive: true });
    }
  }

  // Run npm pack --dry-run --json (cwd = temp dir). Suppress stderr noise.
  let packOutput: string;
  try {
    packOutput = execSync("npm pack --dry-run --json", {
      cwd: TMP,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    log("✗", `npm pack failed: ${(err as Error).message}`, C.red);
    process.exit(1);
  }

  // npm pack --json returns an array of pack results (one per package).
  const packJson = JSON.parse(packOutput) as Array<{
    name: string;
    version: string;
    filename: string;
    size: number;
    unpackedSize: number;
    entryCount: number;
    files: Array<{ path: string; size: number; mode: number }>;
  }>;

  const result = packJson[0];
  if (!result) {
    log("✗", "npm pack returned no result", C.red);
    process.exit(1);
  }

  const compressedKB = result.size / 1024;
  const unpackedKB = result.unpackedSize / 1024;
  const fileCount = result.entryCount ?? result.files.length;

  console.log();
  console.log(`${C.bold}── npm pack --dry-run result ──${C.reset}`);
  log("📦", `Tarball:    ${result.filename}`, C.magenta);
  log("Σ", `Compressed: ${bytes(result.size)}  (${compressedKB.toFixed(1)} KB)`, C.bold);
  log("Σ", `Unpacked:   ${bytes(result.unpackedSize)}  (${unpackedKB.toFixed(1)} KB)`, C.bold);
  log("#", `File count: ${fileCount}`, C.bold);
  console.log();

  console.log(`${C.bold}── Files in tarball (${fileCount} total) ──${C.reset}`);
  for (const f of result.files) {
    log("  •", `${f.path.padEnd(40)} ${bytes(f.size).padStart(10)}`, C.dim);
  }
  console.log();

  // ── 3. Forbidden artifacts ────────────────────────────────────────
  // Machine-generated / gitignored / internal files must never ship in the
  // public tarball even if a `files` negation is accidentally dropped.
  // Each entry is exact (npm pack reports `package.json` as "package.json",
  // dist files as "dist/<name>").
  const FORBIDDEN_ARTIFACTS = [
    "dist/important-audit.json", // gitignored audit snapshot; embeds absolute local paths
    "dist/pro-components.json", // unpublished backend catalog
    ".env",
    ".env.local",
    ".npmrc",
  ];
  const forbiddenHits = result.files.filter((f) => FORBIDDEN_ARTIFACTS.includes(f.path));
  console.log(`${C.bold}── Forbidden artifacts ──${C.reset}`);
  if (forbiddenHits.length === 0) {
    log("✓", `none of ${FORBIDDEN_ARTIFACTS.length} forbidden paths present in tarball`, C.green);
  } else {
    for (const f of forbiddenHits) {
      log("✗", `forbidden artifact shipped in tarball: ${f.path} (${bytes(f.size)})`, C.red);
    }
  }
  console.log();

  // ── 4. Benchmark gates (informational + hard fail on tarball) ────
  // Targets are re-baselined at v2.0.0 catalog reality and documented in
  // docs/benchmarks/04-npm-publish-pipeline.md (rationale + headroom notes).
  const TARGET_TARBALL_KB = 1650;
  const TARGET_UNPACKED_KB = 12 * 1024;
  const TARGET_FILE_COUNT = 88;

  console.log(`${C.bold}── Benchmark gates ──${C.reset}`);
  const tarballPass = compressedKB <= TARGET_TARBALL_KB;
  const unpackedPass = unpackedKB <= TARGET_UNPACKED_KB;
  const fileCountPass = fileCount <= TARGET_FILE_COUNT;

  log(
    tarballPass ? "✓" : "✗",
    `Tarball size ≤ ${TARGET_TARBALL_KB} KB    →  ${compressedKB.toFixed(1)} KB  ${tarballPass ? "PASS" : "FAIL"}`,
    tarballPass ? C.green : C.red,
  );
  log(
    unpackedPass ? "✓" : "⚠",
    `Unpacked size ≤ ${TARGET_UNPACKED_KB} KB  →  ${unpackedKB.toFixed(1)} KB  ${unpackedPass ? "PASS" : "WARN (above target — see docs/benchmarks/04)"}`,
    unpackedPass ? C.green : C.yellow,
  );
  log(
    fileCountPass ? "✓" : "✗",
    `File count ≤ ${TARGET_FILE_COUNT}            →  ${fileCount}  ${fileCountPass ? "PASS" : "FAIL"}`,
    fileCountPass ? C.green : C.red,
  );
  console.log();

  if (!tarballPass || !fileCountPass || forbiddenHits.length > 0) {
    log("✗", "Validation FAILED — tarball/file-count gate breached or forbidden artifact shipped.", C.red);
    process.exit(1);
  }

  log("✓", `Validation PASSED — package is publish-ready.`, C.green);
  process.exit(0);
} finally {
  // Always clean up the temp dir.
  rmSync(TMP, { recursive: true, force: true });
}
