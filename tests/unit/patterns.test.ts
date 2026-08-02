import { describe, it, expect } from "vitest";
import {
  patterns,
  patternCategoryMeta,
  patternCategoryOrder,
  searchPatterns,
  type Pattern,
} from "@/lib/roycss-patterns";
import { effects } from "@/lib/roycss-effects";

const EFFECT_IDS = new Set(effects.map((e) => e.id));

/**
 * Patterns are UI-state templates (empty / loading / error / success / etc).
 * Like recipes, their main failure mode is dangling effectIds — caught here.
 */
describe("patterns corpus", () => {
  it("ships exactly 10 patterns (the documented count)", () => {
    expect(patterns).toHaveLength(10);
  });

  it("uses unique pattern ids", () => {
    const ids = patterns.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique pattern names", () => {
    const names = patterns.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every pattern non-empty html, description, whenToUse, and at least one effectId", () => {
    for (const p of patterns) {
      expect(p.html.trim().length, `empty html in ${p.id}`).toBeGreaterThan(0);
      expect(p.description.trim().length, `empty description in ${p.id}`).toBeGreaterThan(0);
      expect(p.whenToUse.trim().length, `empty whenToUse in ${p.id}`).toBeGreaterThan(0);
      expect(p.effectIds.length, `no effectIds in ${p.id}`).toBeGreaterThan(0);
    }
  });

  it("resolves every pattern.effectId to a real effect id", () => {
    // ─────────────────────────────────────────────────────────────────────
    // FIXED: All 7 previously-dangling pattern.effectIds were remapped to
    // existing effects (the -b20 batch-20 IDs were renamed/removed during
    // the FerrumCSS merge). Now every pattern.effectId resolves to a real
    // effect. This test ensures no new orphans are introduced.
    // ─────────────────────────────────────────────────────────────────────
    const missing: string[] = [];
    for (const p of patterns) {
      for (const id of p.effectIds) {
        if (!EFFECT_IDS.has(id)) {
          missing.push(`${p.id} → ${id}`);
        }
      }
    }
    expect(missing, `dangling pattern.effectIds: ${missing.join("; ")}`).toEqual([]);
  });

  it("tags every pattern with at least one tag", () => {
    const untagged = patterns.filter((p) => p.tags.length === 0).map((p) => p.id);
    expect(untagged).toEqual([]);
  });

  it("places every pattern in a known pattern category (states | feedback | layouts)", () => {
    const valid = new Set(["states", "feedback", "layouts"]);
    const invalid = patterns.filter((p) => !valid.has(p.category)).map((p) => `${p.id} → ${p.category}`);
    expect(invalid).toEqual([]);
  });

  it("has a patternCategoryMeta entry for every patternCategoryOrder entry", () => {
    for (const c of patternCategoryOrder) {
      expect(patternCategoryMeta[c], `missing patternCategoryMeta for ${c}`).toBeDefined();
    }
  });

  it("covers every patternCategoryOrder category with at least one pattern", () => {
    const covered = new Set<string>(patterns.map((p) => p.category));
    const empty = patternCategoryOrder.filter((c) => !covered.has(c));
    expect(empty, `empty pattern categories: ${empty.join(", ")}`).toEqual([]);
  });
});

describe("searchPatterns", () => {
  it("returns all patterns when query is empty and no category filter", () => {
    expect(searchPatterns("")).toHaveLength(patterns.length);
    expect(searchPatterns("   ")).toHaveLength(patterns.length);
    expect(searchPatterns("", null)).toHaveLength(patterns.length);
  });

  it("filters by case-insensitive name substring", () => {
    const results = searchPatterns("state");
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters by tag substring", () => {
    const results = searchPatterns("loading");
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters by category argument alone", () => {
    const results = searchPatterns("", "states");
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) expect(p.category).toBe("states");
  });

  it("combines query and category filter", () => {
    const all = searchPatterns("", "states");
    const narrowed = searchPatterns("empty", "states");
    expect(narrowed.length).toBeLessThanOrEqual(all.length);
  });

  it("returns an empty array for a query that matches nothing", () => {
    expect(searchPatterns("zzz-no-such-pattern-xyz")).toEqual([]);
  });

  it("accepts null as the category argument (used by UI when 'all' is selected)", () => {
    const results = searchPatterns("", null);
    expect(results).toHaveLength(patterns.length);
  });

  it("does not mutate the underlying patterns array", () => {
    const before = patterns.length;
    searchPatterns("state");
    searchPatterns("", "layouts");
    expect(patterns).toHaveLength(before);
  });

  it("preserves the Pattern type contract on returned items", () => {
    const results = searchPatterns("");
    for (const p of results) {
      const _typecheck: Pattern = p;
      expect(_typecheck.id).toBeDefined();
    }
  });
});
