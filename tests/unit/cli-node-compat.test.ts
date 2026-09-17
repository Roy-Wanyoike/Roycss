import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const CLI_ENTRY = join(ROOT, "cli", "index.js");
const CLI_MANIFEST = join(ROOT, "cli", "package.json");
const ROOT_MANIFEST = join(ROOT, "package.json");

/**
 * Issue #131 — roycss-cli node compatibility (source contract).
 *
 * The CLI bundle (cli/index.js) is a built artifact that used to be
 * Bun-only: `#!/usr/bin/env bun` shebang + Bun.spawn clipboard calls.
 * It must now run under plain Node (>= 18) so `roycss-cli` can be
 * published as its own dependency-free npm package. These tests pin
 * the source-level contract so a future `bun build` of the CLI cannot
 * silently reintroduce Bun-only APIs.
 */
describe("cli/index.js — node compatibility contract", () => {
  const source = readFileSync(CLI_ENTRY, "utf8");

  it("starts with a node shebang", () => {
    expect(source.startsWith("#!/usr/bin/env node\n")).toBe(true);
  });

  it("contains no Bun API references (Bun.spawn, Bun.file, import.meta.main, @bun marker)", () => {
    // Bun.* namespace calls (spawn/file/write/serve/…)
    expect(source).not.toMatch(/\bBun\s*\./);
    // Bun-only entry-point idiom `import.meta.main`
    expect(source).not.toMatch(/import\.meta\.main/);
    // Bun build/transpile marker comment
    expect(source).not.toMatch(/^\/\/\s*@bun\b/);
    // No `env bun` shebang anywhere in the first line
    expect(source.split("\n")[0]).not.toContain("bun");
  });

  it("uses node:child_process for the clipboard (spawnSync)", () => {
    // The de-Bun'd copyToClipboard must delegate to a node stdlib spawn.
    expect(source).toMatch(
      /import\s*\{[^}]*spawnSync[^}]*\}\s*from\s*["']child_process["']/,
    );
    // Platform clipboard tools invoked through spawnSync, preserving the
    // xclip → pbcopy fallback chain for identical user-facing behavior.
    expect(source).toMatch(/spawnSync\(\s*["']xclip["']/);
    expect(source).toMatch(/spawnSync\(\s*["']pbcopy["']/);
  });
});

describe("cli/package.json — publishable standalone package manifest", () => {
  const pkg = JSON.parse(readFileSync(CLI_MANIFEST, "utf8"));
  const rootPkg = JSON.parse(readFileSync(ROOT_MANIFEST, "utf8"));

  it("is named roycss-cli and versions in lockstep with the root package", () => {
    expect(pkg.name).toBe("roycss-cli");
    expect(pkg.version).toBe(rootPkg.version);
  });

  it("exposes a bin entry pointing at the bundle", () => {
    expect(pkg.bin).toBeDefined();
    const bin = typeof pkg.bin === "string" ? pkg.bin : Object.values(pkg.bin);
    const targets = Array.isArray(bin) ? bin : [bin];
    expect(targets).toContain("./index.js");
  });

  it("declares zero dependencies of every kind", () => {
    for (const field of [
      "dependencies",
      "peerDependencies",
      "optionalDependencies",
      "devDependencies",
    ] as const) {
      expect(pkg[field] ?? {}, `${field} must be empty`).toEqual({});
    }
  });

  it("declares engines.node >= 18 and an MIT license", () => {
    expect(pkg.engines?.node).toMatch(/^>=\s*18/);
    expect(pkg.license).toBe("MIT");
  });
});
