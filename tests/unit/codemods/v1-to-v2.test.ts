/**
 * v1-to-v2.test.ts — V1 → V2 report-only scaffold codemod (PF-015, #95)
 *
 * The real V1 → V2 transformation requires the V2 @roycss/* packages
 * (PF-042). Until they exist this codemod must: refuse --write, never
 * transform a byte, and still produce a useful migration inventory.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import { codemod, transformV1toV2, V2_GUARD_REASON } from "../../../scripts/codemods/v1-to-v2";
import { runCodemodOnFiles } from "../../../scripts/codemods/lib/engine";
import { cliMain } from "../../../scripts/codemods/lib/engine";

const INPUT = readFileSync(join(__dirname, "fixtures", "v1-to-v2-input.txt"), "utf-8");

describe("v1-to-v2 — report-only scaffold (requires PF-042)", () => {
  it("is marked report-only with the V2-packages guard reason", () => {
    expect(codemod.reportOnly).toBe(true);
    expect(codemod.reportOnlyReason).toBe(V2_GUARD_REASON);
    expect(V2_GUARD_REASON).toContain("PF-042");
    expect(codemod.kind).toBe("scaffold");
  });

  it("never transforms: output is byte-identical to the input", () => {
    const r = transformV1toV2(INPUT);
    expect(r.output).toBe(INPUT);
    expect(r.replaced).toEqual([]);
  });

  it("inventories every roycss-* class in use as 'already roycss'", () => {
    const r = transformV1toV2(INPUT);
    expect(r.alreadyRoycss).toContain("roycss-pulse-glow");
    expect(r.alreadyRoycss).not.toContain("custom-headline");
  });

  it("reports V1 package import wiring a migration would rewrite", () => {
    const r = transformV1toV2(INPUT);
    expect(r.kept).toContain(`import "roycss/dist/roycss.css"`);
    const css = transformV1toV2(`@import "roycss/dist/roycss.min.css";`);
    expect(css.kept).toContain(`@import "roycss/dist/roycss.min.css"`);
  });

  it("idempotency: running twice is still a byte-identical no-op", () => {
    const once = transformV1toV2(INPUT);
    const twice = transformV1toV2(once.output);
    expect(twice.output).toBe(INPUT);
    expect(twice.alreadyRoycss).toEqual(once.alreadyRoycss);
  });

  it("engine guard: --write is refused and the file is never modified", () => {
    const file = join(__dirname, "fixtures", "v1-to-v2-input.txt");
    const before = readFileSync(file, "utf-8");
    // reportOnly definitions refuse writes inside the engine
    const result = runCodemodOnFiles(codemod, [file], { write: true });
    expect(result.summary.wrote).toBe(false);
    expect(readFileSync(file, "utf-8")).toBe(before);
  });

  it("cli guard: --write exits non-zero with the PF-042 message", () => {
    const code = cliMain(codemod, ["some-glob", "--write"]);
    expect(code).toBe(1);
  });

  it("no-op on markup without RoyCSS usage", () => {
    const src = `<div class="plain other">x</div>`;
    const r = transformV1toV2(src);
    expect(r.output).toBe(src);
    expect(r.alreadyRoycss).toEqual([]);
    expect(r.kept).toEqual([]);
  });
});
