import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkDescriptionCounts,
  extractEffectsCount,
  type StatedCount,
} from "../../scripts/publish/count-gate";

const ROOT = join(__dirname, "..", "..");

/**
 * Issue #212 — publish count-drift gate.
 *
 * The four publishable package.json descriptions advertise the catalog
 * size ("1,983 production-ready CSS effects…"). Before this gate the
 * descriptions drifted to 1,959 while the catalog moved to 1,983 with
 * batches 53/54 — nothing failed. Now `bun run publish:validate` parses
 * every description and fails when the stated count disagrees with
 * dist/effects.json (both tracked in-repo, so this works in CI).
 *
 * The gate logic is pure (scripts/publish/count-gate.ts); these tests
 * cover the parser shapes, the mutated-fixture drift detection, and the
 * live "real manifests vs real catalog" invariant.
 */

const PUBLISHABLE_PKG_JSONS = [
  "package.json",
  "cli/package.json",
  "mcp-server/package.json",
  "vscode-extension/package.json",
];

function readStatedCount(rel: string): StatedCount {
  const manifest = JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as {
    description?: string;
  };
  return { path: rel, description: String(manifest.description ?? "") };
}

describe("extractEffectsCount — description parser", () => {
  it("parses every description shape used by the publishable manifests", () => {
    expect(
      extractEffectsCount(
        "RoyCSS — 1,983 production-ready CSS effects. Zero JavaScript runtime.",
      ),
    ).toBe(1983); // root (comma-formatted, em-dash prefix)
    expect(
      extractEffectsCount(
        "CLI tool for RoyCSS — search, add, and manage 1,983 production-ready CSS effects.",
      ),
    ).toBe(1983); // cli
    expect(
      extractEffectsCount(
        "MCP server v2 for RoyCSS — gives AI assistants access to 1,983 effects, 10 UI patterns, 12 recipes.",
      ),
    ).toBe(1983); // mcp-server (count first, other numbers after)
    expect(
      extractEffectsCount(
        "RoyCSS — completion, hover docs, snippets, and commands for all 1983 production-ready CSS effects.",
      ),
    ).toBe(1983); // vscode-extension (unformatted number)
  });

  it("returns null when no effects count is advertised (gate skips)", () => {
    expect(extractEffectsCount("A tiny utility with 29 categories and 10 patterns.")).toBeNull();
    expect(extractEffectsCount("")).toBeNull();
  });

  it("does not confuse the effects count with later numbers in the string", () => {
    // "10 UI patterns, 12 recipes" must not override the effects count.
    expect(extractEffectsCount("access to 1,983 effects, 10 UI patterns")).toBe(1983);
  });
});

describe("checkDescriptionCounts — drift detection (mutated fixture)", () => {
  const actualEffects = 1983;

  it("passes a manifest whose stated count matches the catalog", () => {
    const ok: StatedCount[] = [
      { path: "fixture/package.json", description: "1,983 production-ready CSS effects, ready to paste." },
    ];
    expect(checkDescriptionCounts(ok, actualEffects)).toEqual([]);
  });

  it("flags the exact 1,959→1,983 drift that shipped before #212", () => {
    // MUTATED FIXTURE: the real root description with the count rolled
    // back to the stale 1,959 value that batches 53/54 left behind.
    const real = readStatedCount("package.json");
    const mutated: StatedCount = {
      path: "fixture/package.json",
      description: real.description.replace("1,983", "1,959"),
    };
    expect(mutated.description).toContain("1,959"); // mutation actually applied

    const violations = checkDescriptionCounts([mutated], actualEffects);
    expect(violations).toEqual([
      { path: "fixture/package.json", stated: 1959, actual: 1983 },
    ]);
  });

  it("flags every drifted manifest and skips count-less descriptions", () => {
    const mixed: StatedCount[] = [
      { path: "a/package.json", description: "all 1000 production-ready CSS effects" },
      { path: "b/package.json", description: "no count here at all" },
      { path: "c/package.json", description: "covers 1,983 effects" },
    ];
    const violations = checkDescriptionCounts(mixed, actualEffects);
    expect(violations).toEqual([
      { path: "a/package.json", stated: 1000, actual: 1983 },
    ]);
  });
});

describe("live manifests — count-drift invariant (#212)", () => {
  const actualEffects = JSON.parse(
    readFileSync(join(ROOT, "dist", "effects.json"), "utf-8"),
  ).length as number;

  it("all four publishable descriptions advertise an effects count", () => {
    // Guards the gate against regex rot: if a description changes shape
    // and stops parsing, the gate would silently skip it forever.
    for (const rel of PUBLISHABLE_PKG_JSONS) {
      expect(extractEffectsCount(readStatedCount(rel).description), rel).not.toBeNull();
    }
  });

  it("no publishable description drifts from dist/effects.json", () => {
    const stated = PUBLISHABLE_PKG_JSONS.map(readStatedCount);
    expect(checkDescriptionCounts(stated, actualEffects)).toEqual([]);
  });
});
