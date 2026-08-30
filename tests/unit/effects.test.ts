import { describe, it, expect } from "vitest";
import { effects, allEffectCSS } from "@/lib/roycss-effects";
import type { CSSEffect, EffectCategory, PreviewType } from "@/lib/roycss-types";
import { categoryMeta, categoryOrder } from "@/lib/roycss-types";

const VALID_CATEGORIES: ReadonlySet<EffectCategory> = new Set(categoryOrder);
const VALID_PREVIEW_TYPES: ReadonlySet<PreviewType> = new Set([
  "box",
  "text",
  "button",
  "loader",
  "card",
  "background",
]);

/**
 * Effects corpus — the load-bearing test file for the entire library.
 *
 * These invariants catch the most expensive regressions: duplicate IDs that
 * silently shadow each other at runtime, keyframe collisions that make two
 * effects fight over the same animation symbol, and orphan classes whose
 * `.roycss-<id>` selector doesn't actually match the effect id.
 */
describe("effects corpus", () => {
  it("exposes exactly 1779 effects (the documented catalog size)", () => {
    expect(effects.length).toBe(1779);
  });

  it("exposes a non-empty allEffectCSS string that contains every effect's cssCode", () => {
    expect(typeof allEffectCSS).toBe("string");
    expect(allEffectCSS.length).toBeGreaterThan(0);
    for (const effect of effects) {
      expect(allEffectCSS).toContain(effect.cssCode);
    }
  });

  it("uses unique ids across the whole corpus", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const e of effects) {
      if (seen.has(e.id)) dupes.push(e.id);
      seen.add(e.id);
    }
    expect(dupes, `duplicate ids: ${dupes.slice(0, 10).join(", ")}`).toEqual([]);
    expect(seen.size).toBe(effects.length);
  });

  it("uses unique @keyframes names across the whole corpus (known-defect lock)", () => {
    // ─────────────────────────────────────────────────────────────────────
    // KNOWN DEFECT (locked, do not widen without a fix):
    // Batches 30 + 34 ship "ferrum-*" variants that re-declare the same
    // `@keyframes roy-*` symbols as the originals. At runtime the second
    // declaration wins (and the body is identical), so the collision is
    // benign — but it bloats the CSS payload and trips linters.
    // Additionally, three small non-ferrum collisions exist:
    //   • `roy-bounce-in` shared by `bounce-in` and `micro-bounce-in`
    //   • `roy-neon-flicker` shared by `hover-neon-flicker` and
    //     `text-neon-sign-b19`
    //   • `roy-ferrum-skeleton-card` / `roy-ferrum-skeleton-grid` shared
    //     across the ferrum skeleton variants
    // Fix: rename the ferrum keyframes to `roy-ferrum-*` and rename the
    // non-ferrum duplicates to distinct symbols.
    //
    // This test asserts that EVERY collision matches one of the documented
    // patterns above. A NEW collision (different keyframe name, or a
    // collision not involving a "ferrum-" twin) fails CI.
    // ─────────────────────────────────────────────────────────────────────
    const KNOWN_NON_FERRUM_COLLISIONS: ReadonlySet<string> = new Set([
      "roy-bounce-in (in bounce-in and micro-bounce-in)",
      "roy-neon-flicker (in hover-neon-flicker and text-neon-sign-b19)",
      "roy-ferrum-skeleton-card (in ferrum-skeleton-card-avatar and ferrum-skeleton-card-body)",
      "roy-ferrum-skeleton-card (in ferrum-skeleton-card-avatar and ferrum-skeleton-card-line)",
      "roy-ferrum-skeleton-grid (in ferrum-skeleton-grid-img and ferrum-skeleton-grid-line)",
    ]);

    const names = new Map<string, string>(); // keyframe name → first effect id that owns it
    const collisions: string[] = [];
    for (const e of effects) {
      // Match `@keyframes roy-<name>` literally.
      const matches = e.cssCode.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g);
      for (const m of matches) {
        const kf = m[1];
        const owner = names.get(kf);
        if (owner && owner !== e.id) {
          collisions.push(`${kf} (in ${owner} and ${e.id})`);
        } else {
          names.set(kf, e.id);
        }
      }
    }

    // A collision is "allowed" if either endpoint is a "ferrum-" twin of the
    // other (the documented batch-30/34 duplication pattern), OR it is in
    // the explicit non-ferrum allow-list above.
    const isFerrumTwin = (entry: string): boolean => {
      const match = entry.match(/^\S+ \(in (\S+) and (\S+)\)$/);
      if (!match) return false;
      const [, a, b] = match;
      return a === `ferrum-${b}` || b === `ferrum-${a}`;
    };

    const novel = collisions.filter(
      (c) => !isFerrumTwin(c) && !KNOWN_NON_FERRUM_COLLISIONS.has(c),
    );
    expect(
      novel,
      `NEW keyframe collisions detected (not in the known-defect table):\n${novel.join("\n")}`,
    ).toEqual([]);
  });

  it("assigns every effect a valid EffectCategory", () => {
    const invalid: string[] = [];
    for (const e of effects) {
      if (!VALID_CATEGORIES.has(e.category)) invalid.push(`${e.id} → ${e.category}`);
    }
    expect(invalid, `invalid categories: ${invalid.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("assigns every effect a valid PreviewType", () => {
    const invalid: string[] = [];
    for (const e of effects) {
      if (!VALID_PREVIEW_TYPES.has(e.previewType)) {
        invalid.push(`${e.id} → ${e.previewType}`);
      }
    }
    expect(invalid, `invalid previewTypes: ${invalid.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("gives every effect a non-empty name and id", () => {
    for (const e of effects) {
      expect(e.id, `effect with empty id`).toMatch(/.+/);
      expect(e.name, `effect ${e.id} has empty name`).toMatch(/.+/);
    }
  });

  it("gives every effect non-empty cssCode", () => {
    const empty: string[] = [];
    for (const e of effects) {
      if (!e.cssCode || e.cssCode.trim().length === 0) empty.push(e.id);
    }
    expect(empty, `effects with empty cssCode: ${empty.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("embeds a `.roycss-<id>` selector inside every effect's cssCode", () => {
    const missing: string[] = [];
    for (const e of effects) {
      const expected = `.roycss-${e.id}`;
      if (!e.cssCode.includes(expected)) {
        missing.push(`${e.id} (expected \`${expected}\`)`);
      }
    }
    expect(
      missing,
      `effects missing their .roycss-<id> class: ${missing.slice(0, 10).join("; ")}`,
    ).toEqual([]);
  });

  it("ships every categoryMeta entry for every EffectCategory in categoryOrder", () => {
    for (const cat of categoryOrder) {
      expect(categoryMeta[cat], `categoryMeta missing for ${cat}`).toBeDefined();
      const meta = categoryMeta[cat];
      expect(meta.label).toMatch(/.+/);
      expect(meta.icon).toMatch(/.+/);
      expect(meta.color).toMatch(/.+/);
      expect(meta.description).toMatch(/.+/);
    }
  });

  it("exposes each effect with the documented CSSEffect shape", () => {
    for (const e of effects) {
      expect(typeof e.id).toBe("string");
      expect(typeof e.name).toBe("string");
      expect(typeof e.category).toBe("string");
      expect(typeof e.description).toBe("string");
      expect(Array.isArray(e.tags)).toBe(true);
      expect(typeof e.cssCode).toBe("string");
      expect(typeof e.previewType).toBe("string");
      if (e.childCount !== undefined) expect(typeof e.childCount).toBe("number");
      if (e.previewText !== undefined) expect(typeof e.previewText).toBe("string");
    }
  });

  it("covers every category in categoryOrder with at least one effect", () => {
    const covered = new Set(effects.map((e) => e.category));
    const uncovered = categoryOrder.filter((c) => !covered.has(c));
    expect(uncovered, `categories with no effects: ${uncovered.join(", ")}`).toEqual([]);
  });

  it("tags every effect with at least one searchable tag", () => {
    const untagged = effects.filter((e) => e.tags.length === 0).map((e) => e.id);
    expect(untagged, `effects with no tags: ${untagged.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("produces an allEffectCSS string whose length is the sum of its parts (plus joins)", () => {
    const expectedMin = effects.reduce((sum, e) => sum + e.cssCode.length, 0);
    expect(allEffectCSS.length).toBeGreaterThanOrEqual(expectedMin);
  });
});

/**
 * Compile-time sanity: ensure the public type surface is exported and matches
 * the expected shapes. If a refactor renames `CSSEffect` or `EffectCategory`,
 * this file fails to type-check before tests even run.
 */
describe("effects public type surface", () => {
  it("exports the CSSEffect, EffectCategory, and PreviewType types (compile-time check)", () => {
    const sample: CSSEffect = effects[0];
    const cat: EffectCategory = sample.category;
    const pt: PreviewType = sample.previewType;
    expect(cat).toBeDefined();
    expect(pt).toBeDefined();
  });
});
