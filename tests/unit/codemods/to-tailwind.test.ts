/**
 * to-tailwind.test.ts — RoyCSS → Tailwind outbound codemod (PF-015, #95)
 */

import { describe, it, expect } from "vitest";

import { codemod, MAPPINGS } from "../../../scripts/codemods/to-tailwind";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "to-tailwind-input.txt",
  expectedFixture: "to-tailwind-expected.txt",
  sample: { from: "roycss-rotate-spin", to: "animate-spin" },
  unknownClass: "roycss-definitely-not-in-catalog",
});

describe("to-tailwind — semantics", () => {
  it("maps the animation families onto the four core Tailwind keyframe utilities", () => {
    const r = codemod.transform(`<div class="roycss-rotate-spin roycss-pulse-soft roycss-float">x</div>`);
    expect(r.output).toBe(`<div class="animate-spin animate-pulse animate-bounce">x</div>`);
  });

  it("maps the elevation scale onto the Tailwind shadow scale", () => {
    const r = codemod.transform(`<div class="roycss-material-elevation-1 roycss-material-elevation-5">x</div>`);
    expect(r.output).toBe(`<div class="shadow-sm shadow-lg">x</div>`);
  });

  it("flags every approximate mapping so nothing silently loses fidelity", () => {
    const r = codemod.transform(`<div class="roycss-pulse-soft roycss-glass-frosted">x</div>`);
    expect(r.approximate).toEqual(expect.arrayContaining(["roycss-pulse-soft", "roycss-glass-frosted"]));
  });

  it("keeps classes with no core Tailwind equivalent (entrances, components) and reports them", () => {
    const src = `<div class="roycss-fade-in roycss-btn-glow roycss-card-glassmorphism">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(
      expect.arrayContaining(["roycss-fade-in", "roycss-btn-glow", "roycss-card-glassmorphism"]),
    );
    expect(r.unknown).toEqual([]);
  });

  it("never touches the user's own (non-roycss) classes", () => {
    const src = `<div class="my-own hero animate-spin">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.replaced).toEqual([]);
    expect(r.ignored).toEqual(expect.arrayContaining(["my-own", "hero", "animate-spin"]));
  });

  it("is honest about round-trips: from-tailwind targets map back", () => {
    // animate-spin ↔ roycss-rotate-spin, animate-pulse ↔ roycss-pulse-soft
    expect(MAPPINGS["roycss-rotate-spin"]).toBe("animate-spin");
    expect(MAPPINGS["roycss-pulse-soft"]).toBe("animate-pulse");
  });

  it("exposes a non-null mapping count matching the exported table", () => {
    const nonNull = Object.values(MAPPINGS).filter((v) => v !== null && v !== undefined).length;
    expect(codemod.mappingCount?.()).toBe(nonNull);
    expect(codemod.kind).toBe("outbound");
    expect(codemod.id).toBe("to-tailwind");
  });
});
