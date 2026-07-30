#!/usr/bin/env bun
/**
 * RoyCSS release — version bumper.
 *
 * Bumps the version field across all four lockstep manifests:
 *
 *   1. package.roycss.json        (main library — source of truth)
 *   2. cli/package.json           (roycss-cli)
 *   3. mcp-server/package.json    (@roycss/mcp-server)
 *   4. vscode-extension/package.json (VS Code extension)
 *
 * Usage:
 *
 *   bun run scripts/release/bump-version.ts --major
 *   bun run scripts/release/bump-version.ts --minor
 *   bun run scripts/release/bump-version.ts --patch
 *   bun run scripts/release/bump-version.ts --version 1.2.3
 *   bun run scripts/release/bump-version.ts --version 2.0.0-rc.1
 *
 * Semver rules:
 *   --major   : 1.2.3 → 2.0.0  (resets minor + patch)
 *   --minor   : 1.2.3 → 1.3.0  (resets patch)
 *   --patch   : 1.2.3 → 1.2.4
 *   --version : use the exact string (must match X.Y.Z or X.Y.Z-<pre>)
 *
 * The script reads the current version from package.roycss.json (the
 * first entry in LOCKSTEP_MANIFESTS) and writes the new version to all
 * four manifests atomically — if any one is missing or unwritable,
 * nothing is written.
 *
 * Exit codes:
 *   0 — all four manifests updated
 *   1 — bad flags, missing manifest, invalid semver, or write failure
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import {
  LOCKSTEP_MANIFESTS,
  MANIFEST_PATH,
  C,
  ok,
  fail,
  banner,
} from "./release.config";

// ── Semver parsing ──────────────────────────────────────────────────
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;

interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

function parseSemver(s: string): Semver | null {
  const m = SEMVER_RE.exec(s.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
}

function formatSemver(v: Semver): string {
  return `${v.major}.${v.minor}.${v.patch}${v.prerelease ? `-${v.prerelease}` : ""}`;
}

function bump(current: Semver, kind: "major" | "minor" | "patch"): Semver {
  switch (kind) {
    case "major":
      return { major: current.major + 1, minor: 0, patch: 0, prerelease: null };
    case "minor":
      return { major: current.major, minor: current.minor + 1, patch: 0, prerelease: null };
    case "patch":
      return { major: current.major, minor: current.minor, patch: current.patch + 1, prerelease: null };
  }
}

// ── Manifest read/write ─────────────────────────────────────────────
interface Manifest {
  path: string;
  json: Record<string, unknown>;
  indent: number;
}

function detectIndent(text: string): number {
  // Look at the first few lines and detect 2 vs 4 space indentation.
  const lines = text.split("\n").slice(0, 20);
  for (const line of lines) {
    const m = /^(\s+)\S/.exec(line);
    if (m) {
      const spaces = m[1].length;
      if (spaces === 2 || spaces === 4) return spaces;
    }
  }
  return 2;
}

function readManifest(path: string): Manifest {
  if (!existsSync(path)) {
    throw new Error(`manifest not found: ${path}`);
  }
  const text = readFileSync(path, "utf-8");
  const json = JSON.parse(text) as Record<string, unknown>;
  const indent = detectIndent(text);
  return { path, json, indent };
}

function writeManifest(m: Manifest): void {
  // JSON.stringify with the detected indent; preserve trailing newline.
  const text = JSON.stringify(m.json, null, m.indent) + "\n";
  writeFileSync(m.path, text, "utf-8");
}

// ── Argument parsing ────────────────────────────────────────────────
interface Args {
  kind?: "major" | "minor" | "patch";
  explicit?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  const bumps: ("major" | "minor" | "patch")[] = [];
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === "--major") bumps.push("major");
    else if (a === "--minor") bumps.push("minor");
    else if (a === "--patch") bumps.push("patch");
    else if (a === "--version") {
      i += 1;
      if (i >= argv.length) {
        throw new Error("--version requires an argument (e.g. --version 1.2.3)");
      }
      args.explicit = argv[i];
    } else if (a === "--help" || a === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a} (try --help)`);
    }
    i += 1;
  }
  if (args.explicit && bumps.length > 0) {
    throw new Error(
      "pass exactly one of --major/--minor/--patch/--version <x.y.z> (got --version + a bump flag)",
    );
  }
  if (bumps.length > 1) {
    throw new Error(
      `pass exactly one of --major/--minor/--patch (got ${bumps.length})`,
    );
  }
  if (bumps.length === 1) {
    args.kind = bumps[0];
  }
  if (!args.explicit && !args.kind) {
    throw new Error(
      "missing required argument: pass one of --major, --minor, --patch, --version <x.y.z>",
    );
  }
  return args;
}

function printUsage(): void {
  console.log(`
RoyCSS version bumper — bumps version across 4 lockstep manifests.

Usage:
  bun run scripts/release/bump-version.ts --major
  bun run scripts/release/bump-version.ts --minor
  bun run scripts/release/bump-version.ts --patch
  bun run scripts/release/bump-version.ts --version <x.y.z[-pre]>

Manifests updated:
${LOCKSTEP_MANIFESTS.map((p) => `  - ${p}`).join("\n")}

Semver:
  --major   bumps the major version, resets minor + patch (1.2.3 → 2.0.0)
  --minor   bumps the minor version, resets patch       (1.2.3 → 1.3.0)
  --patch   bumps the patch version                     (1.2.3 → 1.2.4)
  --version uses the exact string (must match X.Y.Z or X.Y.Z-<pre>)
`.trim());
}

// ── Main ────────────────────────────────────────────────────────────
function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    fail(`Error: ${(err as Error).message}`);
    console.error("");
    printUsage();
    process.exit(1);
  }

  banner(`Bumping version across ${LOCKSTEP_MANIFESTS.length} manifests`);

  // Step 1: read all manifests up front (atomic — if any read fails, we
  // abort before writing anything).
  const manifests: Manifest[] = [];
  for (const path of LOCKSTEP_MANIFESTS) {
    try {
      manifests.push(readManifest(path));
    } catch (err) {
      fail(`could not read manifest: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // Step 2: determine the current + new version from the source manifest
  // (the first entry — package.roycss.json).
  const source = manifests[0];
  const currentStr = String(source.json.version ?? "");
  const current = parseSemver(currentStr);
  if (!current) {
    fail(`current version in ${source.path} is not valid semver: "${currentStr}"`);
    process.exit(1);
  }
  console.log(`${C.dim}  current: ${formatSemver(current)} (from ${source.path.replace(process.cwd() + "/", "")})${C.reset}`);

  let next: Semver;
  if (args.explicit) {
    const parsed = parseSemver(args.explicit);
    if (!parsed) {
      fail(`--version must be X.Y.Z[-pre], got: "${args.explicit}"`);
      process.exit(1);
    }
    next = parsed;
  } else {
    next = bump(current, args.kind!);
  }

  const nextStr = formatSemver(next);
  if (nextStr === currentStr) {
    fail(`new version equals current version (${currentStr}) — nothing to do`);
    process.exit(1);
  }

  // Step 3: write the new version to all manifests. We update the in-memory
  // JSON, then write each file. Writes are best-effort-atomic — if a write
  // fails midway, the user must `git checkout` the manifests.
  for (const m of manifests) {
    m.json.version = nextStr;
  }
  for (const m of manifests) {
    try {
      writeManifest(m);
    } catch (err) {
      fail(`could not write manifest ${m.path}: ${(err as Error).message}`);
      fail("some manifests may already be updated — run `git checkout -- <files>` to revert");
      process.exit(1);
    }
    const rel = m.path.replace(process.cwd() + "/", "");
    ok(`${rel.padEnd(40)} ${currentStr} → ${nextStr}`);
  }

  console.log("");
  console.log(`${C.green}${C.bold}✓ Bumped ${currentStr} → ${nextStr} across ${manifests.length} manifests.${C.reset}`);
  console.log(`${C.dim}  Next: bun run scripts/release/generate-changelog.ts${C.reset}`);
  console.log(`${C.dim}  Then: bun run scripts/release/publish.ts${C.reset}`);
}

main();
