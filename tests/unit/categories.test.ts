import { describe, it, expect } from "vitest";
import {
  categoryMeta,
  categoryOrder,
  type EffectCategory,
} from "@/lib/roycss-types";
import { effects } from "@/lib/roycss-effects";

/**
 * Locks the 20-category taxonomy: every `categoryMeta` entry must appear in
 * `categoryOrder`, every effect's `category` must resolve to a `categoryMeta`
 * entry, and `categoryOrder` must be exactly 20 entries long (the number the
 * marketing site, the CLI, and the inspector extension all hard-code).
 */
describe("category taxonomy", () => {
  it("ships exactly 20 categories in categoryOrder", () => {
    expect(categoryOrder).toHaveLength(20);
  });

  it("categoryOrder contains no duplicates", () => {
    const seen = new Set<EffectCategory>();
    for (const c of categoryOrder) {
      expect(seen.has(c), `duplicate category in categoryOrder: ${c}`).toBe(false);
      seen.add(c);
    }
    expect(seen.size).toBe(categoryOrder.length);
  });

  it("has a categoryMeta entry for every category in categoryOrder", () => {
    for (const c of categoryOrder) {
      expect(categoryMeta[c], `missing categoryMeta for ${c}`).toBeDefined();
    }
  });

  it("has no categoryMeta entries outside categoryOrder", () => {
    const metaKeys = new Set(Object.keys(categoryMeta));
    const orderKeys = new Set(categoryOrder);
    for (const k of metaKeys) {
      expect(orderKeys.has(k as EffectCategory), `orphan categoryMeta key: ${k}`).toBe(true);
    }
    expect(metaKeys.size).toBe(orderKeys.size);
  });

  it("gives every category a non-empty label, icon, color, and description", () => {
    for (const c of categoryOrder) {
      const meta = categoryMeta[c];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.color.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
    }
  });

  it("uses unique labels across categories (UI pill labels must not collide)", () => {
    const labels = categoryOrder.map((c) => categoryMeta[c].label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("uses unique icons across categories (nav icons must not collide)", () => {
    const icons = categoryOrder.map((c) => categoryMeta[c].icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("assigns every effect a category that exists in categoryOrder", () => {
    const valid = new Set<string>(categoryOrder);
    const invalid = effects
      .filter((e) => !valid.has(e.category))
      .map((e) => `${e.id} → ${e.category}`);
    expect(invalid).toEqual([]);
  });

  it("puts at least one effect in every category", () => {
    const covered = new Set(effects.map((e) => e.category));
    const empty = categoryOrder.filter((c) => !covered.has(c));
    expect(empty, `categories with zero effects: ${empty.join(", ")}`).toEqual([]);
  });

  it("matches the documented top-level ordering (animations first, misc last)", () => {
    expect(categoryOrder[0]).toBe("animations");
    expect(categoryOrder[categoryOrder.length - 1]).toBe("misc");
  });
});
