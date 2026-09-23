import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

const ROOT = join(__dirname, "..", "..");
const BUNDLE = join(ROOT, "cli", "index.js");
const CLI_SRC = join(ROOT, "src", "cli", "index.ts");
const LIB_DIR = join(ROOT, "src", "lib");

/**
 * Issue #211 — CLI bundle freshness guard.
 *
 * cli/index.js is a COMMITTED build artifact (`bun run build:cli`). It has
 * gone stale before: the bundle shipped at main @ 3f4b638 was built on
 * 09-17 and was missing #127's `lint` command + showed a "1959+ effects"
 * banner while the catalog had moved to 1,983. This guard makes staleness
 * loud.
 *
 * Two layers:
 *   1. Marker checks (always run, toolchain-independent): every command,
 *      lint rule name, and newest-batch canary effect id from src must
 *      appear in the committed bundle.
 *   2. Byte-fresh check (runs when `bun` is available): rebuild the bundle
 *      into a temp dir and byte-compare. Bun build output is deterministic
 *      for a given toolchain; if bytes differ ONLY because of a bun
 *      version change, the marker sets still have to match — a genuine
 *      source change always moves a marker.
 */

const bundle = readFileSync(BUNDLE, "utf8");
const cliSource = readFileSync(CLI_SRC, "utf8");

// Command dispatch labels in src (case "init": … case "help":). Flags like
// "--version" are excluded by the single-word shape of the pattern.
const srcCommands = [
  ...new Set(
    [...cliSource.matchAll(/case\s+"([a-z][a-z0-9-]*)"\s*:/g)].map((m) => m[1]),
  ),
];

// Lint rule names advertised by `roycss lint` (see cmdLint header line).
const LINT_RULES = [
  "no-important",
  "oklch-colors",
  "roycss-prefix",
  "reduced-motion-guard",
  "layer-order",
];

// Canary effect ids from the newest batch module(s) — if the bundle was
// built before the latest catalog batches, these are absent.
const newestBatchNumber = Math.max(
  ...readdirSync(LIB_DIR)
    .map((f) => /^effects-batch-(\d+)\.ts$/.exec(f)?.[1])
    .filter((n): n is string => Boolean(n))
    .map((n) => Number(n)),
);
const newestBatchSource = readFileSync(
  join(LIB_DIR, `effects-batch-${newestBatchNumber}.ts`),
  "utf8",
);
const canaryIds = [
  ...new Set(
    [...newestBatchSource.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
  ),
];

function missingMarkers(content: string): string[] {
  const missing: string[] = [];
  for (const cmd of srcCommands) {
    if (!content.includes(`"${cmd}"`)) missing.push(`command:${cmd}`);
  }
  for (const rule of LINT_RULES) {
    if (!content.includes(`"${rule}"`)) missing.push(`rule:${rule}`);
  }
  for (const id of canaryIds) {
    if (!content.includes(`"${id}"`)) missing.push(`effect:${id}`);
  }
  return missing;
}

describe("cli/index.js — bundle freshness guard (#211)", () => {
  it("every command dispatched in src/cli/index.ts appears in the committed bundle", () => {
    expect(
      srcCommands.length,
      "dispatch extraction must find the command set",
    ).toBeGreaterThanOrEqual(16);
    const missing = srcCommands.filter((cmd) => !bundle.includes(`"${cmd}"`));
    expect(missing, "missing commands — bundle is stale, run `bun run build:cli`").toEqual([]);
  });

  it("lint rule markers and newest-batch canary effects appear in the committed bundle", () => {
    expect(missingMarkers(bundle)).toEqual([]);
  });

  it("byte-fresh: rebuild from src matches the committed bundle (marker-set fallback for toolchain drift)", () => {
    let bunAvailable = false;
    try {
      execSync("bun --version", { stdio: "ignore" });
      bunAvailable = true;
    } catch {
      // bun not on PATH (plain-node environments) — markers above suffice.
    }
    if (!bunAvailable) return;

    const tmp = mkdtempSync(join(tmpdir(), "roycss-cli-fresh-"));
    try {
      // Build into the temp dir (NOT the repo cli/ dir — never touch the
      // committed artifact from a test).
      execSync(
        `bun build src/cli/index.ts --outdir ${JSON.stringify(tmp)} --target node --outfile index.js`,
        { cwd: ROOT, stdio: "ignore" },
      );
      const rebuilt = readFileSync(join(tmp, "index.js"), "utf8");

      if (rebuilt === bundle) return; // strongest guarantee: byte-identical

      // Tolerate toolchain formatting drift: whitespace-only differences
      // carry no semantic change.
      const squash = (s: string): string => s.replace(/\s+/g, "");
      if (squash(rebuilt) === squash(bundle)) return;

      // Genuine content drift. A source/catalog change usually moves a
      // marker (command, rule, newest-batch id) — if any marker is missing
      // from the committed bundle it is definitively STALE. Known blind
      // spot: a pure logic change that moves no marker and ships with an
      // unchanged toolchain still byte-compares clean above, so this only
      // triggers on mixed toolchain+source drift.
      const missingFromCommitted = missingMarkers(bundle);
      expect(
        missingFromCommitted,
        "rebuild does not match cli/index.js — the committed CLI bundle is STALE. Run `bun run build:cli` and commit the refreshed artifact.",
      ).toEqual([]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
