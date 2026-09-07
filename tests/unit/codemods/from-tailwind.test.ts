/**
 * from-tailwind.test.ts — Tailwind → RoyCSS inbound codemod (PF-015, #95)
 */

import { describe, it, expect } from "vitest";

import { codemod, MAPPINGS } from "../../../scripts/codemods/from-tailwind";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "tailwind-input.txt",
  expectedFixture: "tailwind-expected.txt",
  sample: { from: "animate-pulse", to: "roycss-pulse-soft" },
  unknownClass: "definitely-not-a-tailwind-class",
});

describe("from-tailwind — semantics", () => {
  it("maps the animate-* family to RoyCSS animations", () => {
    const r = codemod.transform(`<div class="animate-pulse animate-spin">x</div>`);
    expect(r.output).toBe(`<div class="roycss-pulse-soft roycss-rotate-spin">x</div>`);
  });

  it("maps the shadow-* scale onto the Material elevation steps", () => {
    const r = codemod.transform(`<div class="shadow-sm shadow-xl">x</div>`);
    expect(r.output).toBe(`<div class="roycss-material-elevation-1 roycss-material-elevation-5">x</div>`);
  });

  it("maps every backdrop-blur-* step to the frosted-glass family", () => {
    const r = codemod.transform(`<div class="backdrop-blur-sm backdrop-blur-2xl">x</div>`);
    expect(r.output).toBe(`<div class="roycss-glass-frosted roycss-glass-frosted">x</div>`);
  });

  it("keeps Tailwind layout utilities as-is and reports them as ignored, never unknown", () => {
    const src = `<div class="flex items-center gap-4 p-6 w-1/2 text-sm">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.ignored).toEqual(
      expect.arrayContaining(["flex", "items-center", "gap-4", "p-6", "w-1/2", "text-sm"]),
    );
    expect(r.unknown).toEqual([]);
  });

  it("recognizes blur/ring but keeps them (no honest equivalent), distinct from unknown", () => {
    const src = `<div class="blur-md ring-2 mystery-blur">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(expect.arrayContaining(["blur-md", "ring-2"]));
    expect(r.unknown).toEqual(["mystery-blur"]);
  });

  it("never touches classes that are already RoyCSS", () => {
    const src = `<div class="roycss-pulse-glow roycss-card-glassmorphism">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.replaced).toEqual([]);
    expect(r.alreadyRoycss).toEqual(["roycss-pulse-glow", "roycss-card-glassmorphism"]);
  });

  it("exposes a non-null mapping count matching the exported table", () => {
    const nonNull = Object.values(MAPPINGS).filter((v) => v !== null && v !== undefined).length;
    expect(codemod.mappingCount?.()).toBe(nonNull);
    expect(codemod.kind).toBe("inbound");
    expect(codemod.id).toBe("from-tailwind");
  });
});
