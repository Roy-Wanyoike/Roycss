/**
 * RoyCSS publish — package validator.
 *
 * Standalone validator. Run:
 *
 *   bun run scripts/publish/validate.ts
 *
 * Behavior:
 *   1. Reads `package.roycss.json`.
 *   2. Checks every entry in the `files` array exists on disk.
 *   3. Reports the total unpacked size (sum of bytes of all included files).
 *   4. Runs `npm pack --dry-run --json` in a temp dir (package.roycss.json copied
 *      to package.json, files array entries copied into temp dir).
 *   5. Reports the compressed tarball size, file count, and full file list.
 *   6. Exits 0 if all file checks pass; 1 otherwise.
 *
 * Exit codes:
 *   0 — all required files present, sizes reported
 *   1 — at least one required file missing, or npm pack failed
 */

import { readFileSync, existsSync, statSync, cpSync, rmSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

const ROOT = resolve(import.meta.dir, "..", "..");
const PKG_JSON_PATH = join(ROOT, "package.roycss.json");
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

// ── Read package.roycss.json ──────────────────────────────────────
if (!existsSync(PKG_JSON_PATH)) {
  log("✗", `package.roycss.json not found at ${PKG_JSON_PATH}`, C.red);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8"));
const filesArray: string[] = Array.isArray(pkg.files) ? pkg.files : [];

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

// ── 2. Run `npm pack --dry-run --json` in a temp dir ─────────────
log("🧪", "Running `npm pack --dry-run --json` in isolated temp dir…", C.cyan);

const TMP = join(tmpdir(), `roycss-validate-${Date.now()}`);
mkdirSync(TMP, { recursive: true });

try {
  // Copy package.roycss.json → temp/package.json
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

  // ── 3. Benchmark gates (informational + hard fail on tarball) ──
  const TARGET_TARBALL_KB = 500;
  const TARGET_UNPACKED_KB = 2 * 1024;
  const TARGET_FILE_COUNT = 15;

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
    unpackedPass ? "⚠" : "⚠",
    `Unpacked size ≤ ${TARGET_UNPACKED_KB} KB  →  ${unpackedKB.toFixed(1)} KB  ${unpackedPass ? "PASS" : "WARN (above target — see docs/benchmarks/04)"}`,
    unpackedPass ? C.green : C.yellow,
  );
  log(
    fileCountPass ? "✓" : "✗",
    `File count ≤ ${TARGET_FILE_COUNT}            →  ${fileCount}  ${fileCountPass ? "PASS" : "FAIL"}`,
    fileCountPass ? C.green : C.red,
  );
  console.log();

  if (!tarballPass || !fileCountPass) {
    log("✗", "Validation FAILED — tarball or file count exceeds benchmark targets.", C.red);
    process.exit(1);
  }

  log("✓", `Validation PASSED — package is publish-ready.`, C.green);
  process.exit(0);
} finally {
  // Always clean up the temp dir.
  rmSync(TMP, { recursive: true, force: true });
}
