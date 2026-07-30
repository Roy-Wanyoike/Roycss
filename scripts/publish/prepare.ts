/**
 * RoyCSS publish — pre-publish preparation.
 *
 * Run:
 *
 *   bun run scripts/publish/prepare.ts
 *
 * Behavior:
 *   1. Run `bun run lint` — must pass.
 *   2. Run `bun run scripts/build-package.ts` — must succeed.
 *   3. Validate `dist/` contains the 6 required files:
 *        roycss.css, roycss.min.css, effects.json, effects.cjs, effects.js, effects.d.ts
 *   4. Validate `package.roycss.json` has the required manifest fields:
 *        name, version, description, main, module, types, exports, files,
 *        keywords, author, license, repository, homepage, bugs.
 *   5. Run `npm pack --dry-run --json` from an isolated temp dir
 *      (package.roycss.json copied to package.json; files array entries copied in).
 *   6. Assert compressed tarball size < 500 KB.
 *   7. Exit 0 if all checks pass, 1 otherwise.
 *
 * This script does NOT publish. It only validates publish-readiness.
 */

import { readFileSync, existsSync, statSync, cpSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
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

function step(n: number, msg: string): void {
  console.log(`\n${C.cyan}${C.bold}[${n}/6]${C.reset} ${C.bold}${msg}${C.reset}`);
}

function ok(msg: string): void {
  console.log(`${C.green}  ✓${C.reset} ${msg}`);
}

function warn(msg: string): void {
  console.log(`${C.yellow}  ⚠${C.reset} ${msg}`);
}

function fail(msg: string): void {
  console.log(`${C.red}  ✗${C.reset} ${msg}`);
}

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Required ──────────────────────────────────────────────────────
const REQUIRED_DIST_FILES = [
  "roycss.css",
  "roycss.min.css",
  "effects.json",
  "effects.cjs",
  "effects.js",
  "effects.d.ts",
] as const;

const REQUIRED_PKG_FIELDS = [
  "name",
  "version",
  "description",
  "main",
  "module",
  "types",
  "exports",
  "files",
  "keywords",
  "author",
  "license",
  "repository",
  "homepage",
  "bugs",
] as const;

const TARGET_TARBALL_KB = 500;

let failures = 0;

// ── Step 1: lint ──────────────────────────────────────────────────
step(1, "Running `bun run lint`…");
try {
  execSync("bun run lint", { cwd: ROOT, stdio: "inherit" });
  ok("lint passed");
} catch {
  fail("lint failed — see output above");
  failures += 1;
}

// ── Step 2: build ─────────────────────────────────────────────────
step(2, "Running `bun run scripts/build-package.ts`…");
try {
  execSync("bun run scripts/build-package.ts", { cwd: ROOT, stdio: "inherit" });
  ok("build succeeded");
} catch {
  fail("build failed — see output above");
  failures += 1;
}

// ── Step 3: dist files ────────────────────────────────────────────
step(3, `Validating dist/ contains ${REQUIRED_DIST_FILES.length} required files…`);
for (const f of REQUIRED_DIST_FILES) {
  const abs = join(DIST_DIR, f);
  if (existsSync(abs)) {
    const size = statSync(abs).size;
    ok(`${f.padEnd(20)} ${bytes(size).padStart(10)}`);
  } else {
    fail(`${f.padEnd(20)} MISSING`);
    failures += 1;
  }
}

// ── Step 4: package.roycss.json fields ────────────────────────────
step(4, `Validating package.roycss.json has ${REQUIRED_PKG_FIELDS.length} required fields…`);
if (!existsSync(PKG_JSON_PATH)) {
  fail(`package.roycss.json not found at ${PKG_JSON_PATH}`);
  failures += 1;
} else {
  const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8"));
  for (const field of REQUIRED_PKG_FIELDS) {
    if (pkg[field] === undefined || pkg[field] === null || pkg[field] === "") {
      fail(`missing field: ${field}`);
      failures += 1;
    } else {
      const preview =
        typeof pkg[field] === "string"
          ? pkg[field]
          : Array.isArray(pkg[field])
            ? `[${pkg[field].length} entries]`
            : `{${Object.keys(pkg[field]).length} keys}`;
      ok(`${field.padEnd(14)} ${String(preview).slice(0, 60)}`);
    }
  }
}

// ── Step 5: npm pack --dry-run from isolated temp dir ─────────────
step(5, "Running `npm pack --dry-run --json` in isolated temp dir…");
const TMP = join(tmpdir(), `roycss-prepare-${Date.now()}`);
mkdirSync(TMP, { recursive: true });

let compressedKB = 0;
let unpackedKB = 0;
let fileCount = 0;
let tarballFilename = "";

try {
  if (!existsSync(PKG_JSON_PATH)) {
    fail("cannot run npm pack — package.roycss.json missing");
    failures += 1;
  } else {
    const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8"));
    // Copy package.roycss.json → temp/package.json
    writeFileSync(join(TMP, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");

    // Copy every entry in the `files` array from project root → temp dir.
    const filesArray: string[] = Array.isArray(pkg.files) ? pkg.files : [];
    for (const entry of filesArray) {
      const src = join(ROOT, entry);
      const dst = join(TMP, entry);
      if (existsSync(src)) {
        mkdirSync(dirname(dst), { recursive: true });
        cpSync(src, dst, { recursive: true });
      } else {
        fail(`files array entry not found on disk: ${entry}`);
        failures += 1;
      }
    }

    try {
      const packOutput = execSync("npm pack --dry-run --json", {
        cwd: TMP,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const packJson = JSON.parse(packOutput) as Array<{
        name: string;
        version: string;
        filename: string;
        size: number;
        unpackedSize: number;
        entryCount: number;
      }>;
      const result = packJson[0];
      if (!result) {
        fail("npm pack returned no result");
        failures += 1;
      } else {
        compressedKB = result.size / 1024;
        unpackedKB = result.unpackedSize / 1024;
        fileCount = result.entryCount ?? 0;
        tarballFilename = result.filename;
        ok(`tarball: ${result.filename}`);
        ok(`compressed: ${bytes(result.size)} (${compressedKB.toFixed(1)} KB)`);
        ok(`unpacked:   ${bytes(result.unpackedSize)} (${unpackedKB.toFixed(1)} KB)`);
        ok(`file count: ${fileCount}`);
      }
    } catch (err) {
      fail(`npm pack failed: ${(err as Error).message}`);
      failures += 1;
    }
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

// ── Step 6: tarball size gate ─────────────────────────────────────
step(6, `Asserting tarball size < ${TARGET_TARBALL_KB} KB…`);
if (compressedKB === 0) {
  fail("tarball size unknown — npm pack did not run");
  failures += 1;
} else if (compressedKB > TARGET_TARBALL_KB) {
  fail(`tarball ${compressedKB.toFixed(1)} KB exceeds ${TARGET_TARBALL_KB} KB ceiling`);
  failures += 1;
} else {
  ok(`tarball ${compressedKB.toFixed(1)} KB ≤ ${TARGET_TARBALL_KB} KB  PASS`);
}

// Informational warnings (not failures — see docs/benchmarks/04)
if (unpackedKB > 2 * 1024) {
  warn(`unpacked size ${unpackedKB.toFixed(1)} KB exceeds 2 MB target (see docs/benchmarks/04)`);
}
if (fileCount > 15) {
  warn(`file count ${fileCount} exceeds 15-file target`);
}

// ── Summary ───────────────────────────────────────────────────────
console.log("");
if (failures > 0) {
  console.log(`${C.red}${C.bold}✗ PREPARE FAILED — ${failures} check(s) failed.${C.reset}`);
  console.log(`${C.dim}  Tarball: ${tarballFilename || "(unknown)"}${C.reset}`);
  process.exit(1);
} else {
  console.log(`${C.green}${C.bold}✓ PREPARE PASSED — package is publish-ready.${C.reset}`);
  console.log(`${C.dim}  Tarball: ${tarballFilename}  (${compressedKB.toFixed(1)} KB compressed)${C.reset}`);
  process.exit(0);
}
