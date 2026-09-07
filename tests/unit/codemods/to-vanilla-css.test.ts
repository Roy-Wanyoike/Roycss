/**
 * to-vanilla-css.test.ts — RoyCSS → plain CSS outbound codemod (PF-015, #95)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import { codemod, transformToVanilla } from "../../../scripts/codemods/to-vanilla-css";
import { runCodemodOnFiles } from "../../../scripts/codemods/lib/engine";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "vanilla-input.html",
  expectedFixture: "vanilla-expected.html",
  sample: { from: "roycss-fade-in", to: "fade-in" },
  unknownClass: "roycss-definitely-not-in-catalog",
});

describe("to-vanilla-css — semantics", () => {
  it("strips the roycss- prefix and leaves user classes untouched", () => {
    const r = codemod.transform(`<div class="roycss-btn-glow my-own btn-primary">x</div>`);
    expect(r.output).toBe(`<div class="btn-glow my-own btn-primary">x</div>`);
    expect(r.ignored).toEqual(expect.arrayContaining(["my-own", "btn-primary"]));
  });

  it("emits a rewritten, self-contained CSS block per used effect", () => {
    const source = readFileSync(join(__dirname, "fixtures", "vanilla-input.html"), "utf-8");
    const r = codemod.transform(source);
    expect(r.cssBlocks).toHaveLength(2);
    expect(r.css).toContain(".fade-in {");
    expect(r.css).toContain(".card-glassmorphism {");
    expect(r.css).toContain("@keyframes roy-fade-in"); // keyframe names are kept (already namespaced)
    expect(r.css).not.toContain(".roycss-"); // no roycss selectors survive
  });

  it("emits each effect's CSS once, even when a class repeats", () => {
    const r = codemod.transform(
      `<div class="roycss-fade-in"></div><div class="roycss-fade-in"></div><span class="roycss-fade-in">x</span>`,
    );
    expect(r.cssBlocks).toHaveLength(1);
    expect(r.replaced).toEqual([{ from: "roycss-fade-in", to: "fade-in" }]);
  });

  it("emits helper selectors of multi-class effects consistently stripped", () => {
    // card-flip defines .roycss-card-flip plus -inner/-front/-back helpers
    const r = codemod.transform(`<div class="roycss-card-flip">x</div>`);
    expect(r.output).toBe(`<div class="card-flip">x</div>`);
    expect(r.css).toContain(".card-flip {");
    expect(r.css).toContain(".card-flip-front");
    expect(r.css).not.toContain(".roycss-");
  });

  it("reports unknown roycss-* classes (not in catalog) and never guesses", () => {
    const src = `<div class="roycss-nope-not-real">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.unknown).toEqual(["roycss-nope-not-real"]);
    expect(r.cssBlocks).toEqual([]);
  });

  it("engine run collects a deduped CSS artifact; dry-run writes nothing", () => {
    const file = join(__dirname, "fixtures", "vanilla-input.html");
    const before = readFileSync(file, "utf-8");
    const result = runCodemodOnFiles(codemod, [file], { write: false });
    expect(result.css).toContain(".fade-in {");
    expect(result.cssPath).toBeDefined();
    // dry-run: neither the source file nor the CSS artifact is written
    expect(readFileSync(file, "utf-8")).toBe(before);
    expect(result.cssPath && !exists(result.cssPath)).toBe(true);
  });

  it("covers the full catalog: every mapping target is the stripped key", () => {
    expect(codemod.mappingCount?.()).toBeGreaterThan(1900); // 1,976 shipped classes
    const r = transformToVanilla(`<div class="roycss-tada">x</div>`);
    expect(r.output).toBe(`<div class="tada">x</div>`);
    expect(r.css).toContain("@keyframes roy-tada");
  });
});

function exists(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}
