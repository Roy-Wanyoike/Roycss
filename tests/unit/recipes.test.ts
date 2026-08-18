import { describe, it, expect } from "vitest";
import {
  recipes,
  recipeCategoryMeta,
  recipeCategoryOrder,
  searchRecipes,
  getRecipeWithEffects,
  type Recipe,
} from "@/lib/roycss-recipes";
import { effects } from "@/lib/roycss-effects";

const EFFECT_IDS = new Set(effects.map((e) => e.id));

/**
 * Recipes are curated combinations of effects. Their primary failure mode is
 * dangling `effectIds` — when a batch file renames an effect, every recipe
 * that references the old id silently breaks. These tests catch that.
 */
describe("recipes corpus", () => {
  it("ships exactly 12 recipes (the documented count)", () => {
    expect(recipes).toHaveLength(12);
  });

  it("uses unique recipe ids", () => {
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique recipe names", () => {
    const names = recipes.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every recipe non-empty html, description, and at least one effectId", () => {
    for (const r of recipes) {
      expect(r.html.trim().length, `empty html in ${r.id}`).toBeGreaterThan(0);
      expect(r.description.trim().length, `empty description in ${r.id}`).toBeGreaterThan(0);
      expect(r.effectIds.length, `no effectIds in ${r.id}`).toBeGreaterThan(0);
    }
  });

  it("resolves every recipe.effectId to a real effect id", () => {
    const missing: string[] = [];
    for (const r of recipes) {
      for (const id of r.effectIds) {
        if (!EFFECT_IDS.has(id)) {
          missing.push(`${r.id} → ${id}`);
        }
      }
    }
    expect(
      missing,
      `recipes reference unknown effect ids: ${missing.slice(0, 10).join("; ")}`,
    ).toEqual([]);
  });

  it("tags every recipe with at least one tag", () => {
    const untagged = recipes.filter((r) => r.tags.length === 0).map((r) => r.id);
    expect(untagged).toEqual([]);
  });

  it("assigns every recipe a difficulty of beginner | intermediate | advanced", () => {
    const valid = new Set(["beginner", "intermediate", "advanced"]);
    const invalid = recipes.filter((r) => !valid.has(r.difficulty)).map((r) => `${r.id} → ${r.difficulty}`);
    expect(invalid).toEqual([]);
  });

  it("places every recipe in a known recipe category", () => {
    const validCats = new Set(recipeCategoryOrder);
    const invalid = recipes.filter((r) => !validCats.has(r.category)).map((r) => `${r.id} → ${r.category}`);
    expect(invalid).toEqual([]);
  });

  it("has a recipeCategoryMeta entry for every recipeCategoryOrder entry", () => {
    for (const c of recipeCategoryOrder) {
      expect(recipeCategoryMeta[c], `missing recipeCategoryMeta for ${c}`).toBeDefined();
    }
  });
});

describe("searchRecipes", () => {
  it("returns all recipes when query is empty and no category filter", () => {
    expect(searchRecipes("")).toHaveLength(recipes.length);
    expect(searchRecipes("   ")).toHaveLength(recipes.length);
  });

  it("filters by case-insensitive name substring", () => {
    const results = searchRecipes("hero");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(
        r.name.toLowerCase().includes("hero") ||
        r.description.toLowerCase().includes("hero") ||
        r.tags.some((t) => t.includes("hero")) ||
        r.category.includes("hero"),
      ).toBe(true);
    }
  });

  it("filters by tag substring", () => {
    const results = searchRecipes("glass");
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters by category argument alone", () => {
    const results = searchRecipes("", "buttons");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.category).toBe("buttons");
  });

  it("combines query and category filter", () => {
    const all = searchRecipes("", "loading-states");
    const narrowed = searchRecipes("spinner", "loading-states");
    expect(narrowed.length).toBeLessThanOrEqual(all.length);
  });

  it("returns an empty array for a query that matches nothing", () => {
    expect(searchRecipes("zzz-no-such-recipe-xyz")).toEqual([]);
  });

  it("does not mutate the underlying recipes array", () => {
    const before = recipes.length;
    searchRecipes("hero");
    searchRecipes("", "buttons");
    expect(recipes).toHaveLength(before);
  });
});

describe("getRecipeWithEffects", () => {
  it("returns null for an unknown recipe id", () => {
    expect(getRecipeWithEffects("does-not-exist-123")).toBeNull();
  });

  it("returns the recipe plus resolved effect details for a known id", () => {
    const r: Recipe = recipes[0];
    const full = getRecipeWithEffects(r.id);
    expect(full).not.toBeNull();
    expect(full?.id).toBe(r.id);
    expect(Array.isArray(full?.effects)).toBe(true);
  });

  it("exposes cssCode on every resolved effect", () => {
    const full = getRecipeWithEffects(recipes[0].id);
    for (const e of full?.effects ?? []) {
      expect(typeof (e as { cssCode: string }).cssCode).toBe("string");
      expect(((e as { cssCode: string }).cssCode).length).toBeGreaterThan(0);
    }
  });
});
