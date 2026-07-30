/**
 * RoyCSS release pipeline — shared config.
 *
 * Single source of truth for paths, package names, registry URLs, and
 * benchmark gates used by all release scripts. Every script imports
 * from here — no hardcoded paths elsewhere.
 *
 * Usage:
 *
 *   import { PACKAGE_NAME, MANIFEST_PATH, LOCKSTEP_MANIFESTS } from "./release.config";
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Project paths ────────────────────────────────────────────────────
/** Absolute path to the project root (one level up from scripts/release/). */
export const ROOT = resolve(__dirname, "..", "..");

/** Absolute path to the published package manifest (source of truth for version). */
export const MANIFEST_PATH = resolve(ROOT, "package.roycss.json");

/**
 * All four manifests that version-lockstep together. `bump-version.ts`
 * updates all four atomically (write nothing if any one is missing).
 *
 * Order matters: the main library manifest is first (it's the source
 * of truth for the "current version" read).
 */
export const LOCKSTEP_MANIFESTS = [
  MANIFEST_PATH,
  resolve(ROOT, "cli", "package.json"),
  resolve(ROOT, "mcp-server", "package.json"),
  resolve(ROOT, "vscode-extension", "package.json"),
] as const;

/** Absolute path to the root CHANGELOG.md (the published one). */
export const CHANGELOG_PATH = resolve(ROOT, "CHANGELOG.md");

/** Directory containing unreleased changelog entry .md files. */
export const CHANGELOG_ENTRIES_DIR = resolve(__dirname, "changelog-entries");

/** Directory where consumed (emitted) entry files are moved. */
export const CHANGELOG_CONSUMED_DIR = resolve(CHANGELOG_ENTRIES_DIR, "consumed");

// ── npm registry config ──────────────────────────────────────────────
/** Public package name on npm (unscoped — see ADR-5). */
export const PACKAGE_NAME = "roycss";

/** npm registry URL (only target — no GitHub Packages, no Verdaccio). */
export const REGISTRY = "https://registry.npmjs.org";

/** Access level — public per ADR-5 and the package's existing config. */
export const ACCESS = "public" as const;

/** Whether to attach Sigstore provenance (yes — see ADR-2). */
export const PROVENANCE = true;

// ── Git / GitHub ─────────────────────────────────────────────────────
/** GitHub repository (owner/repo) for changelog linkification. */
export const GITHUB_REPO = "Roy-Wanyoike/roycss";

/** Base URL for GitHub compare / release links. */
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

// ── Benchmark gates ──────────────────────────────────────────────────
/** Maximum acceptable compressed tarball size in KB (informational warning). */
export const TARBALL_MAX_KB = 500;

/** Maximum acceptable file count in the tarball (informational warning). */
export const FILE_COUNT_MAX = 15;

// ── Keep a Changelog section order ──────────────────────────────────
/**
 * The six fixed Keep a Changelog section types, in canonical order.
 * `generate-changelog.ts` emits them in this order (omitting empty
 * sections).
 */
export const CHANGELOG_SECTIONS = [
  "added",
  "changed",
  "deprecated",
  "removed",
  "fixed",
  "security",
] as const;

export type ChangelogSection = (typeof CHANGELOG_SECTIONS)[number];

// ── Helpers ──────────────────────────────────────────────────────────
/** ANSI colors for the release scripts' console output. */
export const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
} as const;

/** Format a byte count as a human-readable string. */
export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Print a banner line (used by the release scripts to delimit phases). */
export function banner(msg: string): void {
  console.log(`\n${C.magenta}${C.bold}═══ ${msg} ═══${C.reset}`);
}

/** Print a success line. */
export function ok(msg: string): void {
  console.log(`${C.green}  ✓${C.reset} ${msg}`);
}

/** Print a warning line. */
export function warn(msg: string): void {
  console.log(`${C.yellow}  ⚠${C.reset} ${msg}`);
}

/** Print a failure line. */
export function fail(msg: string): void {
  console.log(`${C.red}  ✗${C.reset} ${msg}`);
}

// ── Self-test (run with `bun run scripts/release/release.config.ts`) ──
if (import.meta.main) {
  console.log(`${C.cyan}release.config.ts${C.reset} — self-test`);
  console.log(`  ROOT:                 ${ROOT}`);
  console.log(`  MANIFEST_PATH:        ${MANIFEST_PATH}`);
  console.log(`  LOCKSTEP_MANIFESTS:   ${LOCKSTEP_MANIFESTS.length} files`);
  for (const m of LOCKSTEP_MANIFESTS) console.log(`    - ${m}`);
  console.log(`  CHANGELOG_PATH:       ${CHANGELOG_PATH}`);
  console.log(`  ENTRIES_DIR:          ${CHANGELOG_ENTRIES_DIR}`);
  console.log(`  PACKAGE_NAME:         ${PACKAGE_NAME}`);
  console.log(`  REGISTRY:             ${REGISTRY}`);
  console.log(`  ACCESS:               ${ACCESS}`);
  console.log(`  PROVENANCE:           ${PROVENANCE}`);
  console.log(`  GITHUB_REPO:          ${GITHUB_REPO}`);
  console.log(`  TARBALL_MAX_KB:       ${TARBALL_MAX_KB}`);
  console.log(`  FILE_COUNT_MAX:       ${FILE_COUNT_MAX}`);
  console.log(`  CHANGELOG_SECTIONS:   ${CHANGELOG_SECTIONS.join(", ")}`);
  console.log(`${C.green}✓ config OK${C.reset}`);
}
