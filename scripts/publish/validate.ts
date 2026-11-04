
/**
 * RoyCSS publish — package validator.
 *
 * Run:
 *   bun run scripts/publish/validate.ts
 *
 * Checks:
 *   1. Reads the root package.json.
 *   2. Checks every non-negated files entry exists.
 *   3. Calculates unpacked package size.
 *   4. Checks advertised effect counts against dist/effects.json.
 *   5. Runs npm pack --dry-run --json in an isolated temp directory.
 *   6. Supports npm JSON output as either an array or object.
 *   7. Checks forbidden artifacts.
 *   8. Checks package size and file-count benchmarks.
 */

import {
  readFileSync,
  existsSync,
  statSync,
  cpSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
} from "node:fs";

import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

import {
  checkDescriptionCounts,
  extractEffectsCount,
} from "./count-gate";

// ------------------------------------------------------------
// Paths
// ------------------------------------------------------------

const ROOT = resolve(import.meta.dir, "..", "..");
const PKG_JSON_PATH = join(ROOT, "package.json");
const DIST_DIR = join(ROOT, "dist");

// ------------------------------------------------------------
// ANSI colors
// ------------------------------------------------------------

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

function log(
  label: string,
  msg: string,
  color = C.reset,
): void {
  console.log(`${color}${C.bold}${label}${C.reset} ${msg}`);
}

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;

  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// ------------------------------------------------------------
// Package types
// ------------------------------------------------------------

type PackageManifest = {
  name: string;
  version: string;
  description?: string;
  files?: string[];
};

type PackFile = {
  path: string;
  size: number;
  mode: number;
};

type PackResult = {
  id?: string;
  name: string;
  version: string;
  filename: string;
  size: number;
  unpackedSize: number;
  entryCount?: number;
  files: PackFile[];
};

type PackOutput =
  | PackResult[]
  | Record<string, PackResult>;

// ------------------------------------------------------------
// Read package.json
// ------------------------------------------------------------

if (!existsSync(PKG_JSON_PATH)) {
  log(
    "✗",
    `package.json not found at ${PKG_JSON_PATH}`,
    C.red,
  );

  process.exit(1);
}

const pkg = JSON.parse(
  readFileSync(PKG_JSON_PATH, "utf-8"),
) as PackageManifest;

const filesArray = (
  Array.isArray(pkg.files) ? pkg.files : []
).filter((f) => !f.startsWith("!"));

log(
  "📦",
  `Validating package: ${pkg.name}@${pkg.version}`,
  C.cyan,
);

log(
  "→",
  `files array: [ ${filesArray
    .map((f) => `"${f}"`)
    .join(", ")} ]`,
  C.dim,
);

console.log();

// ------------------------------------------------------------
// 1. Check files array entries
// ------------------------------------------------------------

let missingCount = 0;
let unpackedTotal = 0;

const fileRows: {
  path: string;
  exists: boolean;
  size: number;
  isDir: boolean;
}[] = [];

for (const entry of filesArray) {
  const abs = join(ROOT, entry);

  if (!existsSync(abs)) {
    fileRows.push({
      path: entry,
      exists: false,
      size: 0,
      isDir: false,
    });

    missingCount++;
    continue;
  }

  const stat = statSync(abs);

  if (stat.isDirectory()) {
    let dirTotal = 0;

    const walk = (dir: string): void => {
      const entries = readdirSync(dir, {
        withFileTypes: true,
      });

      for (const e of entries) {
        const full = join(dir, e.name);

        if (e.isDirectory()) {
          walk(full);
        } else if (e.isFile()) {
          dirTotal += statSync(full).size;
        }
      }
    };

    walk(abs);

    unpackedTotal += dirTotal;

    fileRows.push({
      path: entry,
      exists: true,
      size: dirTotal,
      isDir: true,
    });
  } else {
    unpackedTotal += stat.size;

    fileRows.push({
      path: entry,
      exists: true,
      size: stat.size,
      isDir: false,
    });
  }
}

console.log(`${C.bold}── Unpacked file sizes ──${C.reset}`);

for (const row of fileRows) {
  if (!row.exists) {
    log(
      "  ✗",
      `${row.path.padEnd(28)} MISSING`,
      C.red,
    );
  } else {
    const tag = row.isDir ? " (dir)" : "";

    log(
      "  ✓",
      `${row.path.padEnd(28)} ${bytes(row.size).padStart(10)}${tag}`,
      C.green,
    );
  }
}

console.log();

log(
  "Σ",
  `Total unpacked size: ${bytes(unpackedTotal)}`,
  C.bold,
);

console.log();

if (missingCount > 0) {
  log(
    "✗",
    `${missingCount} file(s) missing from files array. Aborting.`,
    C.red,
  );

  process.exit(1);
}

// ------------------------------------------------------------
// 2. Count-drift gate
// ------------------------------------------------------------

const PUBLISHABLE_PKG_JSONS = [
  "package.json",
  "cli/package.json",
  "mcp-server/package.json",
  "vscode-extension/package.json",
];

const EFFECTS_JSON_PATH = join(
  DIST_DIR,
  "effects.json",
);

console.log(
  `${C.bold}── Count-drift gate (descriptions vs dist/effects.json) ──${C.reset}`,
);

if (!existsSync(EFFECTS_JSON_PATH)) {
  log(
    "✗",
    `dist/effects.json not found at ${EFFECTS_JSON_PATH} — run bun run build:package first.`,
    C.red,
  );

  process.exit(1);
}

const effectsData = JSON.parse(
  readFileSync(EFFECTS_JSON_PATH, "utf-8"),
);

if (!Array.isArray(effectsData)) {
  log(
    "✗",
    "dist/effects.json must contain a JSON array.",
    C.red,
  );

  process.exit(1);
}

const actualEffects = effectsData.length;

const statedCounts = PUBLISHABLE_PKG_JSONS.map(
  (rel) => {
    const manifestPath = join(ROOT, rel);

    if (!existsSync(manifestPath)) {
      log(
        "✗",
        `Manifest not found: ${rel}`,
        C.red,
      );

      process.exit(1);
    }

    const manifest = JSON.parse(
      readFileSync(manifestPath, "utf-8"),
    ) as { description?: string };

    return {
      path: rel,
      description: String(
        manifest.description ?? "",
      ),
    };
  },
);

for (const s of statedCounts) {
  const stated = extractEffectsCount(
    s.description,
  );

  if (stated === null) {
    log(
      "•",
      `${s.path.padEnd(32)} no effects count advertised — skipped`,
      C.dim,
    );
  } else {
    const drifted = stated !== actualEffects;

    log(
      drifted ? "✗" : "✓",
      `${s.path.padEnd(32)} states ${stated} vs catalog ${actualEffects}${drifted ? " DRIFT" : ""}`,
      drifted ? C.red : C.green,
    );
  }
}

const countViolations = checkDescriptionCounts(
  statedCounts,
  actualEffects,
);

console.log();

if (countViolations.length > 0) {
  for (const v of countViolations) {
    log(
      "✗",
      `${v.path}: description says ${v.stated} effects but dist/effects.json has ${v.actual}.`,
      C.red,
    );
  }

  log(
    "✗",
    "Count-drift gate FAILED — update package descriptions and README.",
    C.red,
  );

  process.exit(1);
}

log(
  "✓",
  `Count-drift gate PASSED — all advertised counts match the ${actualEffects}-effect catalog.`,
  C.green,
);

console.log();

// ------------------------------------------------------------
// 3. npm pack in isolated temporary directory
// ------------------------------------------------------------

log(
  "🧪",
  "Running npm pack --dry-run --json in isolated temp dir…",
  C.cyan,
);

const TMP = join(
  tmpdir(),
  `roycss-validate-${Date.now()}`,
);

mkdirSync(TMP, { recursive: true });

try {
  // Copy package.json.

  writeFileSync(
    join(TMP, "package.json"),
    JSON.stringify(pkg, null, 2),
    "utf-8",
  );

  // Copy all included package files.

  for (const entry of filesArray) {
    const src = join(ROOT, entry);
    const dst = join(TMP, entry);

    if (!existsSync(src)) {
      continue;
    }

    cpSync(src, dst, {
      recursive: true,
    });
  }

  // Use npm.cmd on Windows.

  const npmCommand =
    process.platform === "win32"
      ? "npm.cmd pack --dry-run --json"
      : "npm pack --dry-run --json";

  const packOutput = execSync(
    npmCommand,
    {
      cwd: TMP,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    },
  ).trim();

  if (!packOutput) {
    throw new Error(
      "npm pack returned empty output.",
    );
  }

  // ----------------------------------------------------------
  // FIX: Support both npm JSON output formats.
  //
  // Format A:
  // [ { name: "roycss", ... } ]
  //
  // Format B:
  // { "roycss": { name: "roycss", ... } }
  // ----------------------------------------------------------

  let parsed: PackOutput;

  try {
    parsed = JSON.parse(packOutput) as PackOutput;
  } catch (error) {
    throw new Error(
      `Could not parse npm pack JSON: ${
        error instanceof Error
          ? error.message
          : String(error)
      }\nOutput:\n${packOutput}`,
    );
  }

  const result: PackResult | undefined =
    Array.isArray(parsed)
      ? parsed[0]
      : Object.values(parsed)[0];

  if (!result) {
    throw new Error(
      `npm pack returned no result.\nOutput:\n${packOutput}`,
    );
  }

  if (
    !result.name ||
    !result.version ||
    !Array.isArray(result.files)
  ) {
    throw new Error(
      `npm pack returned an unexpected result structure.\nOutput:\n${packOutput}`,
    );
  }

  // ----------------------------------------------------------
  // 4. Report package details
  // ----------------------------------------------------------

  const compressedKB = result.size / 1024;
  const unpackedKB = result.unpackedSize / 1024;

  const fileCount =
    result.entryCount ?? result.files.length;

  console.log();

  console.log(
    `${C.bold}── npm pack --dry-run result ──${C.reset}`,
  );

  log(
    "📦",
    `Package:    ${result.name}@${result.version}`,
    C.magenta,
  );

  log(
    "📦",
    `Tarball:    ${result.filename}`,
    C.magenta,
  );

  log(
    "Σ",
    `Compressed: ${bytes(result.size)} (${compressedKB.toFixed(1)} KB)`,
    C.bold,
  );

  log(
    "Σ",
    `Unpacked:   ${bytes(result.unpackedSize)} (${unpackedKB.toFixed(1)} KB)`,
    C.bold,
  );

  log(
    "#",
    `File count: ${fileCount}`,
    C.bold,
  );

  console.log();

  // ----------------------------------------------------------
  // 5. Print tarball contents
  // ----------------------------------------------------------

  console.log(
    `${C.bold}── Files in tarball (${fileCount} total) ──${C.reset}`,
  );

  for (const f of result.files) {
    log(
      "  •",
      `${f.path.padEnd(40)} ${bytes(f.size).padStart(10)}`,
      C.dim,
    );
  }

  console.log();

  // ----------------------------------------------------------
  // 6. Forbidden artifacts
  // ----------------------------------------------------------

  const FORBIDDEN_ARTIFACTS = [
    "dist/important-audit.json",
    "dist/pro-components.json",
    ".env",
    ".env.local",
    ".npmrc",
  ];

  const forbiddenHits = result.files.filter(
    (f) => FORBIDDEN_ARTIFACTS.includes(f.path),
  );

  console.log(
    `${C.bold}── Forbidden artifacts ──${C.reset}`,
  );

  if (forbiddenHits.length === 0) {
    log(
      "✓",
      `None of ${FORBIDDEN_ARTIFACTS.length} forbidden paths present in tarball.`,
      C.green,
    );
  } else {
    for (const f of forbiddenHits) {
      log(
        "✗",
        `Forbidden artifact shipped: ${f.path} (${bytes(f.size)})`,
        C.red,
      );
    }
  }

  console.log();

  // ----------------------------------------------------------
  // 7. Benchmark gates
  // ----------------------------------------------------------

  const TARGET_TARBALL_KB = 1650;
  const TARGET_UNPACKED_KB = 12 * 1024;
  const TARGET_FILE_COUNT = 88;

  console.log(
    `${C.bold}── Benchmark gates ──${C.reset}`,
  );

  const tarballPass =
    compressedKB <= TARGET_TARBALL_KB;

  const unpackedPass =
    unpackedKB <= TARGET_UNPACKED_KB;

  const fileCountPass =
    fileCount <= TARGET_FILE_COUNT;

  log(
    tarballPass ? "✓" : "✗",
    `Tarball size ≤ ${TARGET_TARBALL_KB} KB → ${compressedKB.toFixed(1)} KB ${tarballPass ? "PASS" : "FAIL"}`,
    tarballPass ? C.green : C.red,
  );

  log(
    unpackedPass ? "✓" : "⚠",
    `Unpacked size ≤ ${TARGET_UNPACKED_KB} KB → ${unpackedKB.toFixed(1)} KB ${unpackedPass ? "PASS" : "WARN (above target)"}`,
    unpackedPass ? C.green : C.yellow,
  );

  log(
    fileCountPass ? "✓" : "✗",
    `File count ≤ ${TARGET_FILE_COUNT} → ${fileCount} ${fileCountPass ? "PASS" : "FAIL"}`,
    fileCountPass ? C.green : C.red,
  );

  console.log();

  // ----------------------------------------------------------
  // 8. Final validation
  // ----------------------------------------------------------

  if (
    !tarballPass ||
    !fileCountPass ||
    forbiddenHits.length > 0
  ) {
    throw new Error(
      "Validation FAILED — tarball/file-count benchmark breached or forbidden artifact shipped.",
    );
  }

  log(
    "✓",
    "Validation PASSED — package is publish-ready.",
    C.green,
  );

} catch (error) {
  console.log();

  log(
    "✗",
    error instanceof Error
      ? error.message
      : String(error),
    C.red,
  );

  process.exitCode = 1;

} finally {
  // Always clean up the temporary directory.

  if (existsSync(TMP)) {
    rmSync(TMP, {
      recursive: true,
      force: true,
    });
  }
}
