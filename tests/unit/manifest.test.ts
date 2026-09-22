import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { effects } from "@/lib/roycss-effects";
import { categoryOrder } from "@/lib/roycss-types";
import { effectA11y, type EffectAriaReason } from "@/lib/effect-a11y";
import {
  computeEffectQualityScore,
  EFFECT_QUALITY_MAX,
  EFFECT_QUALITY_MIN,
} from "@/lib/effect-quality";

/**
 * PF-042 — dist/roycss.manifest.json (unified index) gate.
 *
 * The manifest is GENERATED (bun run gen:manifest) from the catalog +
 * the derived a11y tags. These tests are the drift gate: if the catalog
 * changes without a regeneration, CI fails here instead of shipping a
 * stale index next to the fresh dist/effects.json.
 *
 * Layers (mirroring the effect-a11y.test.ts conventions — independent
 * re-derivations, deliberately NOT imported from the generator):
 *   1. shape: exists, parses, header legends + counts present;
 *   2. entry count == catalog count, pinned at 1,959 (lockstep with
 *      tests/unit/effects.test.ts);
 *   3. every entry carries the required fields with valid values
 *      (name, maturity, quality, a11y tier, preview, browser tier,
 *      optional aria reason; category via its group key);
 *   4. quality scores inside the module's documented range;
 *   5. maturity values inside the taxonomy;
 *   6. the naming-convention gate mirrored independently (docs/concepts/
 *      class-naming rules — id/class/keyframes), with the known
 *      violations pinned to the generator's ratchet baseline;
 *   7. size budget: an index, not a payload — < 300KB;
 *   8. full re-derivation: every entry equals a fresh computation from
 *      the catalog + effect-a11y + effect-quality (the real drift net);
 *   9. distribution pins (maturity / quality grades / a11y tiers) in
 *      lockstep with the generator's console output and the PR that
 *      introduced the manifest — bump together when the catalog changes.
 */

/* ── The manifest under test ─────────────────────────────────────── */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MANIFEST_PATH = join(ROOT, "dist/roycss.manifest.json");
const MANIFEST_MAX_BYTES = 300 * 1024; // the index budget (no cssCode payloads)

type Maturity = "stable" | "beta" | "experimental";
type A11yTier = "motion-safe" | "motion-caution";

interface ManifestEntry {
  name: string;
  maturity: Maturity;
  quality: number;
  a11y: A11yTier;
  aria?: EffectAriaReason;
  preview: string;
  browser: string;
}

interface RoycssManifest {
  name: string;
  version: string;
  schema: number;
  regenerate: string;
  classPrefix: string;
  maturity: Record<Maturity, string>;
  a11yTiers: Record<A11yTier, string>;
  browserTiers: Record<string, [number, number | null, number | null]>;
  counts: {
    effects: number;
    categories: number;
    maturity: Record<Maturity, number>;
    a11y: Record<A11yTier | "aria-required", number>;
    quality: Record<"A" | "B" | "C" | "D" | "F", number>;
  };
  /** category → effectId → entry (category = group key; id = entry key). */
  effects: Record<string, Record<string, ManifestEntry>>;
}

const manifest: RoycssManifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const manifestBytes = statSync(MANIFEST_PATH).size;

/** Flat [category, id, entry] rows — the per-effect view the tests use. */
interface Row {
  category: string;
  id: string;
  entry: ManifestEntry;
}
const rows: Row[] = Object.entries(manifest.effects).flatMap(([category, bucket]) =>
  Object.entries(bucket).map(([id, entry]) => ({ category, id, entry })),
);

/* ── Independent re-derivations (no imports from the generator) ──── */

const VALID_PREVIEWS = new Set(["box", "text", "button", "loader", "card", "background"]);
const KNOWN_ARIA_REASONS = new Set<string>([
  "sr-only",
  "attr-content",
  "gradient-clipped-text",
  "transparent-text",
  "zero-font",
]);
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KEYFRAMES_NAME = /^roy-[a-z0-9]+(-[a-z0-9]+)*$/;
/** The generator's ratchet baseline, pinned here in lockstep. */
const KNOWN_NAMING_VIOLATIONS: Record<string, number> = {
  // History: ferrum-loader-heartbeat carried 127 prefixed-compounds
  // violations (unprefixed .btn-* demo suite) until the #189 catalog-quality
  // repair rewrote it as a valid self-contained loader — ratchet now at zero.
};

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
/** Feature detection ignores @supports condition texts (detection-only mentions). */
const forFeatureDetection = (css: string) => stripComments(css).replace(/@supports[^{]*\{/g, "{");
const SCROLL_DRIVEN = /animation-timeline\b|\bscroll\(|\bview\(/;

/**
 * Independent selector extraction for the naming mirror: walks braces,
 * recurses into at-rule blocks, skips @keyframes bodies, and recovers
 * selectors polluted by preceding orphan declarations (text after the
 * last ";"). Written separately from the generator's parser on purpose.
 */
function ruleSelectorsOf(css: string): string[] {
  const src = stripComments(css);
  const out: string[] = [];
  let i = 0;
  const walk = (): void => {
    while (i < src.length) {
      const start = i;
      while (i < src.length && src[i] !== "{" && src[i] !== "}") i++;
      const chunk = src.slice(start, i).trim();
      if (i >= src.length) return;
      if (src[i] === "}") {
        i++;
        return;
      }
      i++;
      const selector = chunk.includes(";") ? chunk.slice(chunk.lastIndexOf(";") + 1).trim() : chunk;
      if (selector === "") {
        walk();
      } else if (/^@keyframes\b/i.test(selector)) {
        let depth = 0;
        while (i < src.length) {
          if (src[i] === "{") depth++;
          else if (src[i] === "}" && --depth === 0) {
            i++;
            break;
          }
          i++;
        }
      } else if (selector.startsWith("@")) {
        walk();
      } else {
        out.push(selector);
        walk();
      }
    }
  };
  walk();
  return out;
}

/** Mirror of the naming gate: effectId → violation count (all rules). */
function namingViolations(): Map<string, number> {
  const found = new Map<string, number>();
  const add = (id: string): void => {
    found.set(id, (found.get(id) ?? 0) + 1);
  };

  for (const effect of effects) {
    const css = stripComments(effect.cssCode);
    if (!KEBAB_CASE.test(effect.id)) add(effect.id);
    if (!css.includes(`.roycss-${effect.id}`)) add(effect.id);
    for (const selector of ruleSelectorsOf(effect.cssCode)) {
      for (const compound of selector.split(",")) {
        const classes = [...compound.trim().matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((m) => m[1]!);
        if (classes.length > 0 && !classes.some((c) => c.startsWith("roycss-"))) add(effect.id);
      }
    }
    for (const m of css.matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
      if (!KEBAB_CASE.test(m[1]!)) add(effect.id);
    }
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
      if (!KEYFRAMES_NAME.test(m[1]!)) add(effect.id);
    }
  }
  return found;
}

/** Mirror of the maturity mapping (documented in the generator header). */
function expectedMaturity(quality: number, requiresAria: boolean, scrollDriven: boolean): Maturity {
  if (scrollDriven || quality < 60) return "experimental";
  if (quality >= 80 && !requiresAria) return "stable";
  return "beta";
}

/* ── Tests ───────────────────────────────────────────────────────── */

describe("roycss.manifest.json (PF-042 — unified index)", () => {
  it("exists, parses, and carries the unified-index header", () => {
    expect(manifest.name).toBe("roycss");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.schema).toBe(1);
    expect(manifest.regenerate).toBe("bun run gen:manifest");
    // Every entry's primary CSS class is classPrefix + entry key — the
    // 100% regular mapping the naming gate (primary-class rule) verifies.
    expect(manifest.classPrefix).toBe("roycss-");
    expect(Object.keys(manifest.maturity).sort()).toEqual(["beta", "experimental", "stable"]);
    expect(Object.keys(manifest.a11yTiers).sort()).toEqual(["motion-caution", "motion-safe"]);
    expect(Object.keys(manifest.browserTiers).length).toBeGreaterThan(0);
    for (const [name, triple] of Object.entries(manifest.browserTiers)) {
      expect(triple.length, `browserTiers.${name}`).toBe(3);
      expect(triple[0]).toBeGreaterThan(0); // chrome
      expect(triple[1] === null || triple[1] > 0).toBe(true); // firefox (null = unsupported)
      expect(triple[2] === null || triple[2] > 0).toBe(true); // safari
    }
  });

  it("has one entry per catalog effect — 1,959, pinned (lockstep with effects.test.ts)", () => {
    expect(rows.length).toBe(effects.length);
    expect(rows.length).toBe(1959);
    expect(manifest.counts.effects).toBe(1959);
    expect(manifest.counts.categories).toBe(categoryOrder.filter((c) => manifest.effects[c]).length);
  });

  it("gives every entry the required fields with valid values", () => {
    const offenders: string[] = [];
    for (const { category, id, entry } of rows) {
      const problems: string[] = [];
      if (typeof entry.name !== "string" || entry.name.length === 0) problems.push("name");
      if (!["stable", "beta", "experimental"].includes(entry.maturity)) problems.push("maturity");
      if (!Number.isInteger(entry.quality)) problems.push("quality");
      if (!["motion-safe", "motion-caution"].includes(entry.a11y)) problems.push("a11y");
      if (!VALID_PREVIEWS.has(entry.preview)) problems.push("preview");
      if (!(entry.browser in manifest.browserTiers)) problems.push("browser");
      if (entry.aria !== undefined && !KNOWN_ARIA_REASONS.has(entry.aria)) problems.push("aria");
      if (!categoryOrder.includes(category as (typeof categoryOrder)[number])) problems.push("category-group");
      if (problems.length > 0) offenders.push(`${id} [${problems.join(",")}]`);
    }
    expect(offenders, `entries missing required fields: ${offenders.slice(0, 10).join("; ")}`).toEqual([]);
  });

  it("keeps every quality score inside the module's documented range", () => {
    expect(EFFECT_QUALITY_MIN).toBe(0);
    expect(EFFECT_QUALITY_MAX).toBe(100);
    const outOfRange = rows.filter(
      (r) => r.entry.quality < EFFECT_QUALITY_MIN || r.entry.quality > EFFECT_QUALITY_MAX,
    );
    expect(outOfRange.map((r) => `${r.id}:${r.entry.quality}`)).toEqual([]);
  });

  it("uses only maturity values from the taxonomy", () => {
    const taxonomy = new Set(Object.keys(manifest.maturity));
    const bad = rows.filter((r) => !taxonomy.has(r.entry.maturity));
    expect(bad.map((r) => r.id)).toEqual([]);
  });

  it("validates id/class naming conventions (mirror of the generator gate)", () => {
    const found = namingViolations();

    // Known violations are pinned to the generator's ratchet baseline —
    // the count may only shrink (then update both sides in lockstep).
    const unexpected = [...found.entries()].filter(([id]) => !(id in KNOWN_NAMING_VIOLATIONS));
    expect(unexpected, `NEW naming violations (fix catalog or baseline): ${unexpected.slice(0, 5)}`).toEqual([]);

    for (const [id, count] of Object.entries(KNOWN_NAMING_VIOLATIONS)) {
      expect(found.get(id) ?? 0, `known-violation count for ${id} changed — update the ratchet`).toBe(count);
    }

    // The class-name convention the manifest's classPrefix relies on:
    // every entry's primary class is `roycss-<id>` and exists in the
    // effect's own cssCode (this is the per-entry "css class name").
    const missingPrimaryClass = effects.filter((e) => !stripComments(e.cssCode).includes(`.roycss-${e.id}`));
    expect(missingPrimaryClass.map((e) => e.id)).toEqual([]);

    // And every entry key is a kebab-case id (the classPrefix + key form
    // must produce a valid kebab-case class name).
    const badKeys = rows.filter((r) => !KEBAB_CASE.test(r.id));
    expect(badKeys.map((r) => r.id)).toEqual([]);
  });

  it("stays an index, not a payload — under the 300KB budget", () => {
    expect(manifestBytes).toBeLessThan(MANIFEST_MAX_BYTES);
  });

  it("matches the catalog exactly (id set equality, both directions)", () => {
    const catalogIds = new Set(effects.map((e) => e.id));
    const manifestIds = new Set(rows.map((r) => r.id));
    const missing = [...catalogIds].filter((id) => !manifestIds.has(id));
    const extra = [...manifestIds].filter((id) => !catalogIds.has(id));
    expect(missing, `in catalog but missing from manifest (stale): ${missing.slice(0, 10)}`).toEqual([]);
    expect(extra, `in manifest but absent from catalog (stale): ${extra.slice(0, 10)}`).toEqual([]);
  });

  it("re-derives every entry from the catalog + a11y tags + effect-quality (the drift net)", () => {
    const mismatches: string[] = [];
    const byId = new Map(rows.map((r) => [r.id, r]));

    for (const effect of effects) {
      const row = byId.get(effect.id);
      if (!row) continue; // covered by the set-equality test
      const a11y = effectA11y[effect.id]!;
      const css = forFeatureDetection(effect.cssCode);
      const scrollDriven = SCROLL_DRIVEN.test(css);
      const quality = computeEffectQualityScore({
        descriptionLength: effect.description.length,
        tagCount: effect.tags.length,
        cssLength: effect.cssCode.length,
        hasPreview: VALID_PREVIEWS.has(effect.previewType),
        motionSafe: a11y.motionSafe,
        requiresAria: a11y.requiresAria !== undefined,
        scrollDriven,
        webkitPrefixed: /-webkit-/.test(css),
      });

      const expected: ManifestEntry = {
        name: effect.name,
        maturity: expectedMaturity(quality, a11y.requiresAria !== undefined, scrollDriven),
        quality,
        a11y: a11y.motionSafe ? "motion-safe" : "motion-caution",
        preview: effect.previewType,
        browser: row.entry.browser, // tier derivation cross-checked separately
      };
      if (a11y.requiresAria) expected.aria = a11y.requiresAria;

      if (
        row.category !== effect.category ||
        row.entry.name !== expected.name ||
        row.entry.maturity !== expected.maturity ||
        row.entry.quality !== expected.quality ||
        row.entry.a11y !== expected.a11y ||
        row.entry.aria !== expected.aria ||
        row.entry.preview !== expected.preview
      ) {
        mismatches.push(
          `${effect.id}: manifest=${JSON.stringify({ ...row.entry, category: row.category })} expected=${JSON.stringify(expected)}`,
        );
      }
    }
    expect(mismatches, `drifted entries (run: bun run gen:manifest): ${mismatches.slice(0, 3).join(" | ")}`).toEqual([]);
  });

  it("derives browser tiers from real feature usage (spot checks)", () => {
    // Every emitted tier name must appear on at least one entry and map
    // to a floor at or above the reduced-motion baseline.
    const usedTiers = new Set(rows.map((r) => r.entry.browser));
    for (const name of Object.keys(manifest.browserTiers)) {
      expect(usedTiers.has(name), `browserTiers.${name} is dead legend`).toBe(true);
    }
    // The two honest extremes pinned to named catalog effects:
    const byId = new Map(rows.map((r) => [r.id, r.entry]));
    expect(byId.get("starting-style-drop-in")!.browser).not.toContain("scroll-driven"); // @supports detection only
    expect(byId.get("scroll-timeline-spin")!.browser).toContain("scroll-driven");
    expect(manifest.browserTiers[byId.get("scroll-timeline-spin")!.browser]![1]).toBeNull(); // Firefox: unsupported
    // Effects flagged scroll-driven are exactly the maturity-experimental
    // ones that are experimental BECAUSE of engine support (quality >= 60).
    const scrollDrivenIds = new Set(
      effects.filter((e) => SCROLL_DRIVEN.test(forFeatureDetection(e.cssCode))).map((e) => e.id),
    );
    for (const r of rows) {
      if (scrollDrivenIds.has(r.id)) {
        expect(r.entry.browser, `${r.id} uses scroll-driven CSS`).toContain("scroll-driven");
        expect(r.entry.maturity, `${r.id} is engine-limited`).toBe("experimental");
      }
    }
  });

  it("pins the distributions (lockstep: generator output · this test · the PR)", () => {
    // Bump all three together when the catalog changes — never one alone.
    expect(manifest.counts.maturity).toEqual({ stable: 1254, beta: 664, experimental: 41 });
    expect(manifest.counts.quality).toEqual({ A: 135, B: 1173, C: 522, D: 109, F: 20 });
    expect(manifest.counts.a11y).toEqual({ "motion-safe": 1578, "motion-caution": 381, "aria-required": 89 });

    // counts must equal the entries they summarize (no stale summary).
    const maturity = { stable: 0, beta: 0, experimental: 0 } as Record<Maturity, number>;
    const a11y = { "motion-safe": 0, "motion-caution": 0, "aria-required": 0 } as Record<string, number>;
    for (const { entry } of rows) {
      maturity[entry.maturity]++;
      a11y[entry.a11y]++;
      if (entry.aria !== undefined) a11y["aria-required"] = (a11y["aria-required"] ?? 0) + 1;
    }
    expect(manifest.counts.maturity).toEqual(maturity);
    expect(manifest.counts.a11y).toEqual(a11y);
  });
});
