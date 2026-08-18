import { describe, it, expect } from "vitest";
import {
  allEffectCSS,
  getClass,
  getCSS,
  getByCategory,
  search,
  getAllCSS,
  getCSSForEffects,
  // NOTE: `effects`, `categoryMeta`, `categoryOrder` are NOT imported here
  // because their re-exports from roycss-index are currently broken (see
  // the "known defect" test at the bottom of this file). We import the
  // canonical versions from roycss-effects / roycss-types instead.
} from "@/lib/roycss-index";
import { effects as canonicalEffects } from "@/lib/roycss-effects";
import type { EffectCategory } from "@/lib/roycss-types";

/**
 * Framework-agnostic public API — the surface npm consumers hit first when
 * they `import { getClass, getCSS } from "roycss"`. Locks the documented
 * contract from the module's JSDoc.
 */
describe("roycss-index public API", () => {
  describe("getClass", () => {
    it("prefixes the effect id with `roycss-`", () => {
      expect(getClass("pulse-glow")).toBe("roycss-pulse-glow");
      expect(getClass("btn-shine")).toBe("roycss-btn-shine");
    });

    it("returns the prefix even for unknown ids (it is a pure formatter)", () => {
      expect(getClass("does-not-exist")).toBe("roycss-does-not-exist");
      expect(getClass("")).toBe("roycss-");
    });
  });

  describe("getCSS", () => {
    it("returns the cssCode for a known effect id", () => {
      const css = getCSS("pulse-glow");
      expect(typeof css).toBe("string");
      expect(css.length).toBeGreaterThan(0);
      expect(css).toContain(".roycss-pulse-glow");
    });

    it("returns an empty string for an unknown id", () => {
      expect(getCSS("does-not-exist-xyz")).toBe("");
    });

    it("returns an empty string for an empty id", () => {
      expect(getCSS("")).toBe("");
    });
  });

  describe("getByCategory", () => {
    it("returns only effects matching the category", () => {
      const animations = getByCategory("animations" as EffectCategory);
      expect(animations.length).toBeGreaterThan(0);
      for (const e of animations) {
        expect(e.category).toBe("animations");
      }
    });

    it("returns an empty array for a category with no effects (shouldn't happen, but contract)", () => {
      // All 20 categories have effects, but assert the contract.
      const result = getByCategory("misc" as EffectCategory);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("search", () => {
    it("returns effects whose name, description, or tags match the query (case-insensitive)", () => {
      const results = search("glow");
      expect(results.length).toBeGreaterThan(0);
      for (const e of results) {
        const matches =
          e.name.toLowerCase().includes("glow") ||
          e.description.toLowerCase().includes("glow") ||
          e.tags.some((t) => t.toLowerCase().includes("glow"));
        expect(matches).toBe(true);
      }
    });

    it("returns an empty array for a query that matches nothing", () => {
      expect(search("zzz-no-such-effect-xyz")).toEqual([]);
    });

    it("returns the full corpus for an empty query (every effect's name includes '')", () => {
      expect(search("")).toHaveLength(canonicalEffects.length);
    });
  });

  describe("getAllCSS", () => {
    it("returns the same string as allEffectCSS", () => {
      expect(getAllCSS()).toBe(allEffectCSS);
    });

    it("returns a non-empty string", () => {
      expect(getAllCSS().length).toBeGreaterThan(0);
    });
  });

  describe("getCSSForEffects", () => {
    it("returns the cssCode for each requested id, joined by double-newlines", () => {
      const ids = ["pulse-glow", "bounce-in"];
      const css = getCSSForEffects(ids);
      expect(css).toContain(".roycss-pulse-glow");
      expect(css).toContain(".roycss-bounce-in");
      // The two effects' CSS should be separated by a blank line.
      expect(css).toMatch(/\.roycss-pulse-glow[\s\S]+\n\n\/\*[\s\S]*\.roycss-bounce-in/);
    });

    it("silently drops unknown ids (does not throw)", () => {
      const css = getCSSForEffects(["pulse-glow", "does-not-exist-xyz"]);
      expect(css).toContain(".roycss-pulse-glow");
      expect(css).not.toContain("does-not-exist-xyz");
    });

    it("returns an empty string for an empty id list", () => {
      expect(getCSSForEffects([])).toBe("");
    });

    it("returns a string shorter than allEffectCSS (tree-shaking contract)", () => {
      const ids = ["pulse-glow"];
      const css = getCSSForEffects(ids);
      expect(css.length).toBeLessThan(allEffectCSS.length);
    });
  });
});

/**
 * FIXED: The `effects` re-export from roycss-index.ts was previously broken
 * (it used `allEffects as effects` in a `from "./roycss-effects"` clause,
 * but roycss-effects.ts exports `effects`, not `allEffects`). The fix was
 * to change the re-export to `export { effects, ... } from "./roycss-effects"`.
 * These tests now verify the fix holds.
 */
describe("roycss-index re-exports", () => {
  it("exports `effects` as a defined array (fix verified)", async () => {
    const mod = await import("@/lib/roycss-index");
    expect(mod.effects).toBeDefined();
    expect(Array.isArray(mod.effects)).toBe(true);
    expect(mod.effects.length).toBeGreaterThan(0);
  });

  it("exports `allEffectCSS` correctly", async () => {
    const mod = await import("@/lib/roycss-index");
    expect(typeof mod.allEffectCSS).toBe("string");
    expect(mod.allEffectCSS.length).toBeGreaterThan(0);
  });

  it("exports `categoryMeta` and `categoryOrder` correctly", async () => {
    const mod = await import("@/lib/roycss-index");
    expect(mod.categoryMeta).toBeDefined();
    expect(mod.categoryOrder).toBeInstanceOf(Array);
    expect(mod.categoryOrder.length).toBe(20);
  });
});
