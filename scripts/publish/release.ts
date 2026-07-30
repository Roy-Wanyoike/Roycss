/**
 * RoyCSS publish — release orchestration (DRY RUN by default).
 *
 * Run:
 *
 *   bun run scripts/publish/release.ts
 *
 * Behavior:
 *   1. Run prepare.ts checks (lint → build → validate → tarball size gate).
 *   2. Run `bunx changeset version` (bumps version, updates CHANGELOG.md).
 *   3. Run `bunx changeset tag` (creates git tag — may fail if no git repo,
 *      that's OK, we log it and continue).
 *   4. Print the `npm publish --provenance --access public` command
 *      (DO NOT EXECUTE IT).
 *   5. Print: "Dry run complete. To publish for real, run:
 *             NPM_TOKEN=xxx bun run publish:ci"
 *
 * Exit codes:
 *   0 — prepare passed (changeset failures are non-fatal)
 *   1 — prepare failed (lint/build/validation gate failed)
 *
 * This script NEVER publishes to npm. Use `bun run publish:ci` for the real
 * publish (and only from CI with NPM_TOKEN set).
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");

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

function banner(msg: string): void {
  console.log(`\n${C.magenta}${C.bold}═══ ${msg} ═══${C.reset}`);
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

// ── Step 1: prepare ───────────────────────────────────────────────
banner("Step 1 / 3 — prepare.ts (lint + build + validate + tarball gate)");

try {
  execSync("bun run scripts/publish/prepare.ts", { cwd: ROOT, stdio: "inherit" });
  ok("prepare passed");
} catch {
  fail("prepare failed — aborting release (changeset/version/publish will not run)");
  process.exit(1);
}

// ── Step 2: changeset version ─────────────────────────────────────
banner("Step 2 / 3 — changeset version (bump + CHANGELOG.md)");

try {
  execSync("bunx changeset version", { cwd: ROOT, stdio: "inherit" });
  ok("changeset version completed");
} catch (err) {
  // Non-fatal: changeset may fail if there are no pending changesets,
  // or if we're in a non-git sandbox. Log and continue.
  warn(`changeset version failed (non-fatal — likely no pending changesets or no git repo): ${(err as Error).message}`);
}

// ── Step 3: changeset tag ─────────────────────────────────────────
banner("Step 3 / 3 — changeset tag (git tag)");

try {
  execSync("bunx changeset tag", { cwd: ROOT, stdio: "inherit" });
  ok("changeset tag completed");
} catch (err) {
  // Non-fatal: `changeset tag` runs `git tag`, which will fail if there's
  // no git repo (sandbox) or if the tag already exists. Log and continue.
  warn(`changeset tag failed (non-fatal — no git repo or tag already exists): ${(err as Error).message}`);
}

// ── Print the publish command (DRY RUN) ───────────────────────────
banner("DRY RUN COMPLETE — publish command (NOT EXECUTED)");

console.log("");
console.log(`  ${C.cyan}${C.bold}npm publish --provenance --access public${C.reset}`);
console.log("");
console.log(`  ${C.dim}# Or equivalently via the npm script:${C.reset}`);
console.log(`  ${C.cyan}${C.bold}NPM_TOKEN=xxx bun run publish:ci${C.reset}`);
console.log("");
console.log(`  ${C.dim}# Equivalent raw command:${C.reset}`);
console.log(`  ${C.cyan}${C.bold}NPM_TOKEN=$NPM_TOKEN npm publish --provenance --access public${C.reset}`);
console.log("");

console.log(`${C.green}${C.bold}✓ Dry run complete.${C.reset}`);
console.log(`${C.dim}  To publish for real, run:${C.reset}`);
console.log(`  ${C.cyan}${C.bold}NPM_TOKEN=xxx bun run publish:ci${C.reset}`);
console.log("");

// Never actually publish — always exit 0 after dry run.
process.exit(0);
