/**
 * Unit tests — relative-color service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the RCS derive pipeline — the branches the
 * integration happy path never reaches:
 *   - calc-expression evaluator: +, -, *, /, bare numbers, cross-channel
 *     letters, and the identity FALLBACK for unparseable expressions
 *     (defense in depth beyond the Zod layer)
 *   - 3-digit hex expansion, out-of-gamut clamping, alpha modification
 *     (CSS gets a `/ <alpha-expr>` suffix)
 *   - all four output spaces (rgb / hsl / oklch / oklab) round-trips
 *   - LRU cache hit (same reference)
 *   - Zod rejection boundaries (source hex, outputSpace, channel expr)
 */
import { describe, expect, it } from "vitest";

import {
  deriveRelativeColor,
  listChannels,
  listPresets,
} from "../../src/modules/relative-color/service.js";
import { RelativeColorDeriveSchema } from "../../src/modules/relative-color/schema.js";

function hexChannels(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(hex);
  if (!m || !m[1] || !m[2] || !m[3]) throw new Error(`bad hex: ${hex}`);
  return [
    parseInt(m[1], 16),
    parseInt(m[2], 16),
    parseInt(m[3], 16),
  ];
}

describe("deriveRelativeColor — rgb space", () => {
  it("1. identity derivation round-trips the source hex", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: {},
    });

    expect(result.css).toBe("rgb(from #3498db r g b)");
    expect(result.resolvedHex).toBe("#3498db");
    expect(result.sourceValues).toEqual({ r: 52, g: 152, b: 219, alpha: 1 });
    expect(result.resolvedValues).toEqual({ r: 52, g: 152, b: 219, alpha: 1 });
    expect(result.hasAlphaModification).toBe(false);
    expect(result.explanation).toContain("Resolves to #3498db");
  });

  it("2. 3-digit hex sources expand to their 6-digit form", async () => {
    const result = await deriveRelativeColor({
      source: "#f00",
      outputSpace: "rgb",
      channels: {},
    });
    expect(result.sourceValues).toEqual({ r: 255, g: 0, b: 0, alpha: 1 });
    expect(result.resolvedHex).toBe("#ff0000");
  });

  it("3. calc expressions support +, -, * and / per channel", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "calc(r + 20)", g: "calc(g - 20)", b: "calc(b * 2)" },
    });

    expect(result.resolvedValues).toEqual({ r: 72, g: 132, b: 438, alpha: 1 });
    // b = 438 is out of the 0-255 gamut → clamped for the hex only.
    const [r, g, b] = hexChannels(result.resolvedHex);
    expect([r, g, b]).toEqual([72, 132, 255]);
    expect(result.css).toBe(
      "rgb(from #3498db calc(r + 20) calc(g - 20) calc(b * 2))",
    );
  });

  it("4. calc division resolves fractional channels", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "calc(r / 2)" },
    });
    expect(result.resolvedValues.r).toBe(26);
  });

  it("5. bare number literals replace the channel outright", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "128" },
    });
    expect(result.resolvedValues.r).toBe(128);
  });

  it("6. a channel letter cross-references another source channel", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "g" },
    });
    expect(result.resolvedValues.r).toBe(152);
  });

  it("7. unparseable expressions fall back to the identity channel (defense in depth)", async () => {
    // These shapes cannot pass the route schema — the evaluator's own
    // fallback branch must still degrade to identity, never throw.
    const weird = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "calc(r + x)" },
    });
    expect(weird.resolvedValues.r).toBe(52);

    const unknownLetter = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "z" },
    });
    expect(unknownLetter.resolvedValues.r).toBe(52);
  });
});

describe("deriveRelativeColor — hsl / oklab / oklch spaces", () => {
  it("8. hsl source values are computed from sRGB and round-trip the hex", async () => {
    const result = await deriveRelativeColor({
      source: "#804020",
      outputSpace: "hsl",
      channels: {},
    });

    expect(result.css).toBe("hsl(from #804020 h s l)");
    expect(result.sourceValues.h).toBeCloseTo(20, 1);
    expect(result.sourceValues.s).toBeCloseTo(60, 1);
    expect(result.sourceValues.l).toBeCloseTo(31.373, 1);

    const [r, g, b] = hexChannels(result.resolvedHex);
    expect(Math.abs(r - 128)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - 64)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 32)).toBeLessThanOrEqual(1);
  });

  it("9. oklab identity round-trips within quantization error", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "oklab",
      channels: {},
    });

    expect(result.css).toBe("oklab(from #3498db l a b)");
    expect(result.sourceValues).toHaveProperty("l");
    const [r, g, b] = hexChannels(result.resolvedHex);
    expect(Math.abs(r - 52)).toBeLessThanOrEqual(2);
    expect(Math.abs(g - 152)).toBeLessThanOrEqual(2);
    expect(Math.abs(b - 219)).toBeLessThanOrEqual(2);
  });

  it("10. oklch hue rotation stays a valid in-gamut hex", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "oklch",
      channels: { h: "calc(h + 180)" },
    });

    expect(result.css).toBe("oklch(from #3498db l c calc(h + 180))");
    expect(result.resolvedHex).toMatch(/^#[0-9a-f]{6}$/);
    // Hue is NOT wrapped mod 360 — the calc result is carried through
    // unwrapped (oklchToOklab handles any angle via cos/sin).
    expect(result.resolvedValues.h).toBeCloseTo(result.sourceValues.h! + 180, 1);
  });

  it("11. far-out-of-gamut oklch values clamp to the sRGB cube corner", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "oklch",
      channels: { l: "2", c: "0.5", h: "30" },
    });
    expect(result.sourceValues.l).toBeCloseTo(0.628, 1); // source, unmodified
    expect(result.resolvedValues.l).toBe(2); // bare-number literal
    expect(result.resolvedHex).toBe("#ffffff");
  });

  it("12. an alpha calc marks hasAlphaModification and emits the slash form", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "rgb",
      channels: { alpha: "calc(alpha * 0.5)" },
    });

    expect(result.hasAlphaModification).toBe(true);
    expect(result.css).toBe("rgb(from #3498db r g b / calc(alpha * 0.5))");
    expect(result.resolvedValues.alpha).toBe(0.5);
    expect(result.explanation).toContain("and alpha");
  });

  it("13. alpha identity keeps the plain (no slash) form", async () => {
    const result = await deriveRelativeColor({
      source: "#3498db",
      outputSpace: "oklch",
      channels: { alpha: "alpha" },
    });
    expect(result.hasAlphaModification).toBe(false);
    expect(result.css).not.toContain(" / ");
    expect(result.resolvedValues.alpha).toBe(1);
  });
});

describe("deriveRelativeColor — cache", () => {
  it("14. identical input returns the cached object (same reference)", async () => {
    const input = {
      source: "#abcdef",
      outputSpace: "rgb" as const,
      channels: {},
    };
    const first = await deriveRelativeColor(input);
    const second = await deriveRelativeColor(input);
    expect(second).toBe(first);
  });
});

describe("catalog endpoints", () => {
  it("15. listChannels returns the 8 curated RCS channel letters", async () => {
    const channels = await listChannels();
    expect(channels.map((c) => c.letter)).toEqual([
      "r",
      "g",
      "b",
      "h",
      "s",
      "l",
      "c",
      "alpha",
    ]);
    expect(channels.every((c) => c.conversionExamples?.length)).toBe(true);
  });

  it("16. listPresets returns the 6 seeded RCS presets", async () => {
    const presets = await listPresets();
    expect(presets).toHaveLength(6);
    expect(presets.map((p) => p.id)).toContain("preset-opacity-half");
    expect(presets.every((p) => Object.keys(p.input.channels).length > 0)).toBe(
      true,
    );
  });
});

describe("RelativeColorDeriveSchema — Zod rejection boundaries", () => {
  it("17. source must be a 3- or 6-digit hex", () => {
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "3498db",
        outputSpace: "rgb",
      }).success,
    ).toBe(false);
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "#12345",
        outputSpace: "rgb",
      }).success,
    ).toBe(false);
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "#3498db",
        outputSpace: "rgb",
      }).success,
    ).toBe(true);
  });

  it("18. outputSpace must be one of the four spaces; channels default to {}", () => {
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "#fff",
        outputSpace: "cmyk",
      }).success,
    ).toBe(false);
    const parsed = RelativeColorDeriveSchema.parse({
      source: "#fff",
      outputSpace: "hsl",
    });
    expect(parsed.channels).toEqual({});
  });

  it("19. channel expressions must be a letter, number, or calc(ch OP N)", () => {
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "#fff",
        outputSpace: "rgb",
        channels: { r: "calc(r + x)" },
      }).success,
    ).toBe(false);
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "#fff",
        outputSpace: "rgb",
        channels: { r: "rgb(1, 2, 3)" },
      }).success,
    ).toBe(false);
    expect(
      RelativeColorDeriveSchema.safeParse({
        source: "#fff",
        outputSpace: "rgb",
        channels: { r: "calc(l + 0.1)" },
      }).success,
    ).toBe(true);
  });
});
