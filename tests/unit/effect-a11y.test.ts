import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { effects } from "@/lib/roycss-effects";
import {
  effectA11y,
  effectA11yStats,
  getEffectA11y,
  type EffectAriaReason,
} from "@/lib/effect-a11y";
import {
  ARIA_REASON_GUIDANCE,
  getEffectA11yBadges,
  isMotionSafeEffect,
} from "@/lib/effect-a11y-badges";

/**
 * PF-004 — per-effect accessibility tags (derived data gate).
 *
 * src/lib/effect-a11y.ts is GENERATED (bun run gen:a11y). These tests are
 * the drift gate promised by docs/EFFECT-A11Y-TIERS.md §3: if the catalog
 * changes without a regeneration, CI fails here instead of shipping stale
 * a11y tags to the card pills and the Motion-safe filter.
 *
 * Layers:
 *   1. id-set equality (both directions) + entry shape;
 *   2. motionSafe cross-checked TWO ways against the catalog — a per-effect
 *      literal-string derivation over cssCode, and a file-level grep of the
 *      52 batch sources on disk (id → source-slice map);
 *   3. decorationOnly / requiresAria full-corpus rule cross-checks with the
 *      methodology numbers pinned (303 interactive · 1,656 decorative · 89
 *      aria-required — post-#189 catalog-quality wave);
 *   4. cssCode-pinned spot checks across five categories;
 *   5. badge-derivation helper logic — including the 1,578 filter count that
 *      backs the grid chip in roycss-page.tsx (no component tests exist in
 *      this repo: node environment, the helper is React-free by design).
 */

/* ── Independent re-derivations (deliberately NOT imported from the
      generator — a shared implementation could not catch drift) ── */

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const HOVER_FOCUS_ACTIVE = /:(hover|active|focus)\b/;

const FORM_STATE_PSEUDO = [
  ":checked", ":indeterminate", ":invalid", ":valid", ":required", ":optional",
  ":disabled", ":enabled", ":read-only", ":read-write", ":placeholder-shown",
  ":default", ":in-range", ":out-of-range", ":autofill",
];

function isInteractiveCss(css: string): boolean {
  return (
    HOVER_FOCUS_ACTIVE.test(css) ||
    FORM_STATE_PSEUDO.some((p) => css.includes(p))
  );
}

function hidesText(css: string): boolean {
  const gradientClipped = /background-clip:\s*text\b/.test(css);
  const transparentText =
    /(?<![-a-zA-Z])color:\s*transparent\b/.test(css) ||
    /-webkit-text-fill-color:\s*transparent\b/.test(css);
  const attrContent = /attr\(/.test(css);
  const zeroFont = /font-size:\s*0(?![\d.])/.test(css);
  const srOnly =
    /clip:\s*rect\(/.test(css) ||
    (/width:\s*1px\b/.test(css) &&
      /height:\s*1px\b/.test(css) &&
      /overflow:\s*hidden\b/.test(css));
  return gradientClipped || transparentText || attrContent || zeroFont || srOnly;
}

const KNOWN_REASONS: ReadonlySet<string> = new Set<string>([
  "sr-only",
  "attr-content",
  "gradient-clipped-text",
  "transparent-text",
  "zero-font",
]);

/* ── File-level view of the 52 batch sources (id → raw source slice) ── */

const LIB_DIR = fileURLToPath(new URL("../../src/lib", import.meta.url));
const BATCH_FILES = readdirSync(LIB_DIR)
  .filter((f) => /^effects-batch-\d+\.ts$/.test(f))
  .sort();

/** id → the raw source text of that effect's entry (id marker → next id marker). */
const EFFECT_SOURCE_SLICES: ReadonlyMap<string, string> = (() => {
  const slices = new Map<string, string>();
  for (const file of BATCH_FILES) {
    const raw = readFileSync(join(LIB_DIR, file), "utf8");
    const markers = [...raw.matchAll(/id: "([^"]+)"/g)];
    for (let i = 0; i < markers.length; i++) {
      const from = markers[i].index ?? 0;
      const to = i + 1 < markers.length ? (markers[i + 1].index ?? raw.length) : raw.length;
      slices.set(markers[i][1], raw.slice(from, to));
    }
  }
  return slices;
})();

/* ════════════════════════════════════════════════════════════════
   1. Generated module — id coverage & shape
   ════════════════════════════════════════════════════════════════ */

describe("effect-a11y generated module (id coverage & shape)", () => {
  it("covers every catalog effect id exactly — set equality, both directions", () => {
    expect(Object.keys(effectA11y).length).toBe(effects.length);
    const catalogIds = new Set(effects.map((e) => e.id));
    const moduleIds = new Set(Object.keys(effectA11y));
    const missing = [...catalogIds].filter((id) => !moduleIds.has(id));
    const extra = [...moduleIds].filter((id) => !catalogIds.has(id));
    expect(missing, `ids in catalog but not in effect-a11y: ${missing.slice(0, 10).join(", ")}`).toEqual([]);
    expect(extra, `ids in effect-a11y but not in catalog: ${extra.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("shapes every entry as { motionSafe: boolean, decorationOnly: boolean, requiresAria?: known reason }", () => {
    for (const [id, entry] of Object.entries(effectA11y)) {
      expect(typeof entry.motionSafe, `${id}.motionSafe`).toBe("boolean");
      expect(typeof entry.decorationOnly, `${id}.decorationOnly`).toBe("boolean");
      if (entry.requiresAria !== undefined) {
        expect(typeof entry.requiresAria, `${id}.requiresAria`).toBe("string");
        expect(KNOWN_REASONS.has(entry.requiresAria), `${id}.requiresAria="${entry.requiresAria}"`).toBe(true);
      }
    }
  });

  it("looks up known ids and returns undefined for unknown ids (fail closed)", () => {
    for (const e of effects.slice(0, 25)) {
      expect(getEffectA11y(e.id)).toBe(effectA11y[e.id]);
    }
    expect(getEffectA11y("definitely-not-an-effect-id")).toBeUndefined();
  });

  it("reports stats that match counts recomputed from the record itself", () => {
    const entries = Object.values(effectA11y);
    expect(effectA11yStats.total).toBe(entries.length);
    expect(effectA11yStats.motionSafe).toBe(entries.filter((a) => a.motionSafe).length);
    expect(effectA11yStats.motionCaution).toBe(entries.filter((a) => !a.motionSafe).length);
    expect(effectA11yStats.interactive).toBe(entries.filter((a) => !a.decorationOnly).length);
    expect(effectA11yStats.decorative).toBe(entries.filter((a) => a.decorationOnly).length);
    expect(effectA11yStats.ariaRequired).toBe(entries.filter((a) => a.requiresAria !== undefined).length);
  });
});

/* ════════════════════════════════════════════════════════════════
   2. motionSafe — full-corpus cross-checks (two independent ways)
   ════════════════════════════════════════════════════════════════ */

describe("effect-a11y motionSafe (full-corpus cross-checks)", () => {
  it("matches a per-effect literal-string derivation over every cssCode", () => {
    for (const e of effects) {
      const derived = stripComments(e.cssCode).includes("prefers-reduced-motion");
      expect(
        effectA11y[e.id].motionSafe,
        `${e.id}: cssCode ${derived ? "ships" : "does not ship"} a prefers-reduced-motion guard`,
      ).toBe(derived);
    }
  });

  it("matches a file-level grep of the 52 batch sources on disk (id → file map)", () => {
    // The catalog import could be green while the generated module is stale;
    // reading the raw batch sources on disk closes that hole.
    expect(BATCH_FILES.length).toBe(52);
    expect(EFFECT_SOURCE_SLICES.size).toBe(effects.length);
    for (const e of effects) {
      const slice = EFFECT_SOURCE_SLICES.get(e.id);
      expect(slice, `${e.id}: no source slice in the 52 batch files`).toBeDefined();
      expect(
        slice!.includes("prefers-reduced-motion"),
        `${e.id}: batch-file source disagrees with the generated motionSafe flag`,
      ).toBe(effectA11y[e.id].motionSafe);
    }
  });

  it("pins the motion-safe count at 1,578 (docs §4 + grid chip lockstep) — the #189 catalog-quality wave added data-level reduced-motion guards to 1,148 unguarded effects", () => {
    expect(effectA11yStats.total).toBe(1959);
    expect(effectA11yStats.motionSafe).toBe(1578);
    expect(effectA11yStats.motionCaution).toBe(1959 - 1578);
  });
});

/* ════════════════════════════════════════════════════════════════
   3. decorationOnly — full-corpus rule cross-check
   ════════════════════════════════════════════════════════════════ */

describe("effect-a11y decorationOnly (full-corpus rule cross-check)", () => {
  it("matches !(hover|focus|active || form-state pseudo-classes) for every cssCode", () => {
    for (const e of effects) {
      const interactive = isInteractiveCss(stripComments(e.cssCode));
      expect(
        effectA11y[e.id].decorationOnly,
        `${e.id}: cssCode ${interactive ? "is" : "is not"} interactive`,
      ).toBe(!interactive);
    }
  });

  it("pins the distribution at 303 interactive / 1,656 decorative", () => {
    expect(effectA11yStats.interactive).toBe(303);
    expect(effectA11yStats.decorative).toBe(1656);
    expect(effectA11yStats.interactive + effectA11yStats.decorative).toBe(1959);
  });

  it("reproduces the documented methodology: 302 hover/focus/active + 1 form-only → 303 interactive", () => {
    const hfa = effects.filter((e) => HOVER_FOCUS_ACTIVE.test(stripComments(e.cssCode)));
    const formOnly = effects.filter((e) => {
      const css = stripComments(e.cssCode);
      return !HOVER_FOCUS_ACTIVE.test(css) && FORM_STATE_PSEUDO.some((p) => css.includes(p));
    });
    expect(hfa.length).toBe(302);
    expect(formOnly.map((e) => e.id)).toEqual(["ferrum-accordion-slide"]);
    // 302 + 6 form-state effects (5 of which also match hover/focus/active) = 303.
    expect(effectA11yStats.interactive).toBe(hfa.length + formOnly.length);
  });
});

/* ════════════════════════════════════════════════════════════════
   4. requiresAria — full-corpus rule cross-check
   ════════════════════════════════════════════════════════════════ */

describe("effect-a11y requiresAria (full-corpus rule cross-check)", () => {
  it("flags exactly the union of the five text-hiding patterns for every cssCode", () => {
    for (const e of effects) {
      const hides = hidesText(stripComments(e.cssCode));
      expect(
        effectA11y[e.id].requiresAria !== undefined,
        `${e.id}: cssCode ${hides ? "hides" : "does not hide"} text`,
      ).toBe(hides);
    }
  });

  it("pins the aria-required count at 89", () => {
    expect(effectA11yStats.ariaRequired).toBe(89);
  });

  it("suppresses the redundant transparent-text note under gradient-clipped text", () => {
    // Every background-clip:text effect is flagged, but never with the
    // generic "transparent-text" reason — the transparency is part of the
    // gradient technique, so the effect is reported once.
    const gradientClipped = effects.filter((e) =>
      /background-clip:\s*text\b/.test(stripComments(e.cssCode)),
    );
    expect(gradientClipped.length).toBe(46);
    for (const e of gradientClipped) {
      const reason = effectA11y[e.id].requiresAria as EffectAriaReason;
      expect(reason).toBeDefined();
      expect(reason).not.toBe("transparent-text");
      expect(["gradient-clipped-text", "attr-content", "sr-only"]).toContain(reason);
    }
  });

  it("keeps a note on every font-size: 0 effect (all 23 also make the text transparent)", () => {
    const zeroFont = effects.filter((e) => /font-size:\s*0(?![\d.])/.test(stripComments(e.cssCode)));
    expect(zeroFont.length).toBe(23);
    for (const e of zeroFont) {
      expect(effectA11y[e.id].requiresAria, `${e.id}: font-size:0 without an aria note`).toBeDefined();
    }
  });
});

/* ════════════════════════════════════════════════════════════════
   5. cssCode-pinned spot checks (one per category family)
   ════════════════════════════════════════════════════════════════ */

describe("effect-a11y cssCode-pinned spot checks", () => {
  it("pulse-glow (animations) is motion-safe + decorative — the #189 wave added its data-level reduced-motion guard", () => {
    const effect = effects.find((e) => e.id === "pulse-glow")!;
    expect(effect.category).toBe("animations");
    expect(effect.cssCode).toContain("@media (prefers-reduced-motion: reduce)");
    expect(effect.cssCode).not.toMatch(/:(hover|active|focus)\b/);
    expect(effectA11y["pulse-glow"]).toEqual({
      motionSafe: true,
      decorationOnly: true,
    });
  });

  it("hover-scale (hover) is interactive + motion-safe — :hover IS interaction (honest decision #1) and the #189 wave added its reduced-motion guard", () => {
    const effect = effects.find((e) => e.id === "hover-scale")!;
    expect(effect.category).toBe("hover");
    expect(effect.cssCode).toMatch(/:hover\b/);
    expect(effect.cssCode).toContain("@media (prefers-reduced-motion: reduce)");
    expect(effectA11y["hover-scale"]).toEqual({
      motionSafe: true,
      decorationOnly: false,
    });
  });

  it("text-gradient (text) carries the gradient-clipped-text aria reason", () => {
    const effect = effects.find((e) => e.id === "text-gradient")!;
    expect(effect.category).toBe("text");
    expect(effect.cssCode).toMatch(/background-clip:\s*text\b/);
    expect(effect.cssCode).toMatch(/color:\s*transparent\b/);
    expect(effectA11y["text-gradient"]).toEqual({
      motionSafe: false,
      decorationOnly: true,
      requiresAria: "gradient-clipped-text",
    });
  });

  it("vfx-crt-effect (filters) is motion-safe — it ships its own reduced-motion guard", () => {
    const effect = effects.find((e) => e.id === "vfx-crt-effect")!;
    expect(effect.category).toBe("filters");
    expect(effect.cssCode).toContain("@media (prefers-reduced-motion: reduce)");
    expect(effectA11y["vfx-crt-effect"]).toEqual({
      motionSafe: true,
      decorationOnly: true,
    });
  });

  it("ferrum-sr-only (misc) is the one sr-only helper effect — aria note + interactive focus variant", () => {
    const effect = effects.find((e) => e.id === "ferrum-sr-only")!;
    expect(effect.category).toBe("misc");
    expect(effect.cssCode).toMatch(/clip:\s*rect\(/);
    expect(effect.cssCode).toMatch(/:focus\b/); // the focusable reveal variant
    expect(effectA11y["ferrum-sr-only"]).toEqual({
      motionSafe: false,
      decorationOnly: false,
      requiresAria: "sr-only",
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   6. Badge derivation helper (pure, React-free — node-testable)
   ════════════════════════════════════════════════════════════════ */

describe("effect-a11y badge helper", () => {
  it("yields exactly one muted Decorative badge for a formerly-interactive effect whose foreign focus-ring was stripped (ferrum-curtain-in)", () => {
    // The #189 catalog-quality repair removed the foreign :focus ring that
    // shipped inside curtain-in's cssCode — it is now decoration-only.
    expect(effectA11y["ferrum-curtain-in"]).toEqual({
      motionSafe: true,
      decorationOnly: true,
    });
    const badges = getEffectA11yBadges("ferrum-curtain-in");
    expect(badges).toHaveLength(1);
    expect(badges[0]).toMatchObject({ key: "decorative", label: "Decorative", tone: "muted" });
  });

  it("yields no badges for a motion-safe interactive effect (hover-scale) — guard + interaction cancel both badges", () => {
    const badges = getEffectA11yBadges("hover-scale");
    expect(badges).toEqual([]);
  });

  it("yields exactly one muted Decorative badge for a guarded decoration-only effect (vfx-crt-effect)", () => {
    const badges = getEffectA11yBadges("vfx-crt-effect");
    expect(badges).toHaveLength(1);
    expect(badges[0]).toMatchObject({
      key: "decorative",
      label: "Decorative",
      tone: "muted",
    });
  });

  it("yields the full three-badge set for text-gradient, ending with the violet A11y note", () => {
    const badges = getEffectA11yBadges("text-gradient");
    expect(badges.map((b) => b.key)).toEqual(["motion-caution", "decorative", "a11y-note"]);
    expect(badges[2]).toMatchObject({ label: "A11y note", tone: "violet" });
    expect(badges[2].title).toBe(ARIA_REASON_GUIDANCE["gradient-clipped-text"]);
    // Every reason has non-empty guidance (the tooltip is the guidance).
    for (const guidance of Object.values(ARIA_REASON_GUIDANCE)) {
      expect(guidance.length).toBeGreaterThan(20);
    }
  });

  it("filters the catalog to exactly 1,578 motion-safe effects (backs the grid chip count)", () => {
    const motionSafe = effects.filter((e) => isMotionSafeEffect(e.id));
    expect(motionSafe.length).toBe(1578);
    expect(effectA11yStats.motionSafe).toBe(motionSafe.length);
  });

  it("fails closed on unknown ids — no badges, no motion-safe pass", () => {
    expect(isMotionSafeEffect("definitely-not-an-effect-id")).toBe(false);
    expect(getEffectA11yBadges("definitely-not-an-effect-id")).toEqual([]);
  });
});
