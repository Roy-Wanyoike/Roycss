import { describe, expect, it } from "vitest";
import { effects } from "@/lib/roycss-effects";
import {
  effectPageDescription,
  effectPageTitle,
} from "@/lib/effect-page-metadata";

/**
 * Issue #188 (item 4) — effect page title/description template.
 *
 * Old template ("Pulse Glow — RoyCSS CSS Effect") left the "copy-paste
 * code" query on the table and descriptions ran together without
 * punctuation ("…elements Pure CSS, zero JavaScript"). These tests pin
 * the new template in src/lib/effect-page-metadata.ts:
 *   title       → `${name} CSS Effect — Copy-Paste Code | RoyCSS` (≤60ch)
 *   description → `${description}. Pure CSS, zero JavaScript — live
 *                  preview + copy-paste code.`
 */
describe("effectPageTitle", () => {
  it("uses the full copy-paste template for short names", () => {
    expect(effectPageTitle("Pulse Glow")).toBe(
      "Pulse Glow CSS Effect — Copy-Paste Code | RoyCSS"
    );
  });

  it("keeps the ≤60 char cap of the issue template", () => {
    expect(effectPageTitle("Pulse Glow").length).toBeLessThanOrEqual(60);
  });

  it("falls back to the short suffix when the name would overflow 60ch", () => {
    // 27-char name: 27 + 38 (full suffix) = 65 > 60 → short template (47ch).
    expect(effectPageTitle("Diagonal Stripes Background")).toBe(
      "Diagonal Stripes Background CSS Effect | RoyCSS"
    );
    // The longest catalog names (36 chars) also stay inside the cap.
    expect(effectPageTitle("CSS Painting — Sunset over Mountains")).toBe(
      "CSS Painting — Sunset over Mountains CSS Effect | RoyCSS"
    );
  });

  it("NEVER emits a title over 60ch for any catalog effect name", () => {
    for (const effect of effects) {
      expect(
        effectPageTitle(effect.name).length,
        `title too long for ${effect.id}`
      ).toBeLessThanOrEqual(60);
    }
  });

  it("keeps the 'CSS Effect' + site keyword in every variant", () => {
    for (const effect of effects) {
      const title = effectPageTitle(effect.name);
      expect(title).toContain("CSS Effect");
      expect(title).toContain("RoyCSS");
    }
  });

  it("is deterministic for repeated/edge names", () => {
    expect(effectPageTitle("  Pulse Glow  ")).toBe(effectPageTitle("Pulse Glow"));
    expect(effectPageTitle("")).toBe(" CSS Effect — Copy-Paste Code | RoyCSS");
  });
});

describe("effectPageDescription", () => {
  const SUFFIX = ". Pure CSS, zero JavaScript — live preview + copy-paste code.";

  it("joins the description with sentence punctuation before the suffix", () => {
    expect(
      effectPageDescription(
        "A smooth pulsing glow effect that draws attention to elements"
      )
    ).toBe(
      "A smooth pulsing glow effect that draws attention to elements. Pure CSS, zero JavaScript — live preview + copy-paste code."
    );
  });

  it("does not double a trailing period", () => {
    expect(effectPageDescription("It ends with a period.")).toBe(
      `It ends with a period${SUFFIX}`
    );
  });

  it("always carries the zero-JavaScript keyword line", () => {
    for (const effect of effects) {
      expect(effectPageDescription(effect.description)).toContain(
        "Pure CSS, zero JavaScript — live preview + copy-paste code."
      );
    }
  });
});
