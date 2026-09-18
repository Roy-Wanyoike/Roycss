/**
 * Unit tests — style-query service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the @container style() query builder — the
 * branches the integration happy path never reaches:
 *   - the 400 validation branch for a non-styleable, non-custom property
 *     (service-level check on top of the Zod layer)
 *   - case-insensitive built-in property matching
 *   - named vs anonymous container conditions (with the whitespace
 *     collapse in the condition builder)
 *   - fallback block present vs absent
 *   - LRU cache hit (same reference)
 *   - Zod rejection boundaries (ident regex, empty declarations, charset)
 */
import { describe, expect, it } from "vitest";

import {
  generateStyleQuery,
  listPresets,
} from "../../src/modules/style-query/service.js";
import {
  StyleQueryGenerateSchema,
  type StyleQueryGenerateInput,
} from "../../src/modules/style-query/schema.js";

function input(
  over: Partial<StyleQueryGenerateInput> = {},
): StyleQueryGenerateInput {
  return {
    containerName: "card",
    property: "--mode",
    value: "dark",
    selector: ".card__body",
    declarations: { background: "#1c1c1e" },
    ...over,
  };
}

describe("generateStyleQuery — styleable-property validation", () => {
  it("1. a non-custom, non-styleable property is a 400 before any emission", async () => {
    await expect(
      generateStyleQuery(input({ property: "margin" })),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: expect.stringContaining(
        'Property "margin" is not styleable in a style() query',
      ),
    });
  });

  it("2. custom properties (--foo) are always allowed", async () => {
    const result = await generateStyleQuery(input({ property: "--anything" }));
    expect(result.css).toContain("style(--anything: dark)");
  });

  it("3. built-in styleable properties match case-insensitively", async () => {
    const lower = await generateStyleQuery(input({ property: "font-weight" }));
    expect(lower.css).toContain("style(font-weight: dark)");

    const upper = await generateStyleQuery(input({ property: "FONT-WEIGHT" }));
    expect(upper.css).toContain("style(FONT-WEIGHT: dark)");
  });
});

describe("generateStyleQuery — condition + emission branches", () => {
  it("4. a named container emits name(<ident>) in the condition", async () => {
    const result = await generateStyleQuery(input());
    expect(result.condition).toBe("@container name(card) style(--mode: dark)");
    expect(result.css).toBe(
      [
        "@container name(card) style(--mode: dark) {",
        ".card__body {",
        "  background: #1c1c1e;",
        "  }",
        "}",
      ].join("\n"),
    );
    expect(result.explanation).toContain('named "card"');
  });

  it("5. an anonymous container targets the nearest ancestor (whitespace collapsed)", async () => {
    const result = await generateStyleQuery(
      input({ containerName: undefined }),
    );
    expect(result.condition).toBe("@container style(--mode: dark)");
    expect(result.explanation).toContain("nearest ancestor container");
  });

  it("6. fallback declarations render a separate block; absent → empty string", async () => {
    const withFallback = await generateStyleQuery(
      input({ fallbackDeclarations: { background: "#f2f2f7" } }),
    );
    expect(withFallback.fallbackCss).toContain(
      "/* Fallback for browsers without style() query support */",
    );
    expect(withFallback.fallbackCss).toContain(".card__body {");
    expect(withFallback.fallbackCss).toContain("background: #f2f2f7;");

    const without = await generateStyleQuery(input());
    expect(without.fallbackCss).toBe("");
  });
});

describe("generateStyleQuery — cache + presets", () => {
  it("7. identical input returns the cached object (same reference)", async () => {
    const a = input({ value: "neon", property: "--theme" });
    const first = await generateStyleQuery(a);
    const second = await generateStyleQuery(a);
    expect(second).toBe(first);
  });

  it("8. returns the 4 seeded presets", async () => {
    const presets = await listPresets();
    expect(presets.map((p) => p.id)).toEqual([
      "preset-mode-dark",
      "preset-theme-neon",
      "preset-size-large",
      "preset-density-compact",
    ]);
  });
});

describe("StyleQueryGenerateSchema — Zod rejection boundaries", () => {
  const valid = {
    property: "--mode",
    value: "dark",
    selector: ".card__body",
    declarations: { background: "#1c1c1e" },
  };

  it("9. property and value are required non-empty strings", () => {
    expect(
      StyleQueryGenerateSchema.safeParse({ ...valid, property: "" }).success,
    ).toBe(false);
    expect(
      StyleQueryGenerateSchema.safeParse({ ...valid, value: "  " }).success,
    ).toBe(false);
  });

  it("10. containerName must be a CSS identifier", () => {
    expect(
      StyleQueryGenerateSchema.safeParse({ ...valid, containerName: "1bad" })
        .success,
    ).toBe(false);
    expect(
      StyleQueryGenerateSchema.safeParse({ ...valid, containerName: "a b" })
        .success,
    ).toBe(false);
  });

  it("11. declarations must be non-empty; selector must match the charset", () => {
    expect(
      StyleQueryGenerateSchema.safeParse({ ...valid, declarations: {} })
        .success,
    ).toBe(false);
    expect(
      StyleQueryGenerateSchema.safeParse({ ...valid, selector: "a, b!" })
        .success,
    ).toBe(false);
  });
});
