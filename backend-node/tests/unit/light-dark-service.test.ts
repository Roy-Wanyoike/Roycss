/**
 * Unit tests — light-dark service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the light-dark() generator — the branches the
 * integration happy path never reaches:
 *   - color-scheme "light dark" (auto) vs fixed "light"/"dark" branches
 *     (explanation wording + the `auto` flag)
 *   - full CSS + legacy @media emission with custom selectors
 *   - LRU cache hit (same reference)
 *   - Zod rejection boundaries (colorScheme enum, token hex pairs,
 *     selector charset) and defaults for the nested selectors
 */
import { describe, expect, it } from "vitest";

import {
  generateLightDark,
  listPresets,
} from "../../src/modules/light-dark/service.js";
import {
  LightDarkGenerateSchema,
  type LightDarkGenerateInput,
} from "../../src/modules/light-dark/schema.js";

const TOKENS: LightDarkGenerateInput["tokens"] = {
  background: { light: "#ffffff", dark: "#18181b" },
  foreground: { light: "#18181b", dark: "#fafafa" },
  primary: { light: "#7c3aed", dark: "#c084fc" },
  muted: { light: "#71717a", dark: "#a1a1aa" },
  border: { light: "#e4e4e7", dark: "#27272a" },
};

function input(
  over: Partial<LightDarkGenerateInput> = {},
): LightDarkGenerateInput {
  return {
    selector: ".card",
    colorScheme: "light dark",
    tokens: TOKENS,
    primarySelector: ".btn",
    mutedSelector: ".muted",
    ...over,
  };
}

describe("generateLightDark — color-scheme branches", () => {
  it("1. 'light dark' (auto) flips the auto flag and explains the inherited switch", async () => {
    const result = await generateLightDark(input());
    expect(result.auto).toBe(true);
    expect(result.explanation).toContain("adapts between light and dark");
    expect(result.explanation).toContain("INHERITED");
  });

  it("2. a fixed scheme explains the locked branch", async () => {
    const dark = await generateLightDark(input({ colorScheme: "dark" }));
    expect(dark.auto).toBe(false);
    expect(dark.explanation).toContain("Because the color-scheme is fixed");
    expect(dark.explanation).toContain("dark branch");

    const light = await generateLightDark(input({ colorScheme: "light" }));
    expect(light.auto).toBe(false);
    expect(light.explanation).toContain("light branch");
  });
});

describe("generateLightDark — CSS emission", () => {
  it("3. the css block carries the scheme, 4 light-dark() declarations, and a color-mix hover", async () => {
    const result = await generateLightDark(input());
    expect(result.css).toContain(".card {");
    expect(result.css).toContain("color-scheme: light dark;");
    expect(result.css).toContain(
      "background: light-dark(#ffffff, #18181b);",
    );
    expect(result.css).toContain("color: light-dark(#18181b, #fafafa);");
    expect(result.css).toContain(
      "border-color: light-dark(#e4e4e7, #27272a);",
    );
    expect(result.css).toContain(".btn {");
    expect(result.css).toContain("background: light-dark(#7c3aed, #c084fc);");
    expect(result.css).toContain(
      "--primary-hover: light-dark(color-mix(in srgb, #7c3aed 88%, #ffffff), color-mix(in srgb, #c084fc 88%, #18181b));",
    );
    expect(result.css).toContain(".muted {");
    expect(result.css).toContain("color: light-dark(#71717a, #a1a1aa);");
  });

  it("4. the legacy css serves light values and a prefers-color-scheme dark block", async () => {
    const result = await generateLightDark(input());
    expect(result.legacyCss).toContain("background: #ffffff;");
    expect(result.legacyCss).toContain("color: #18181b;");
    expect(result.legacyCss).toContain("@media (prefers-color-scheme: dark) {");
    expect(result.legacyCss).toContain("background: #18181b;");
    expect(result.legacyCss).toContain("color: #fafafa;");
    expect(result.legacyCss).toContain("--primary-hover: color-mix(in srgb, #c084fc 88%, #18181b);");
  });
});

describe("generateLightDark — cache", () => {
  it("5. identical input returns the cached object (same reference)", async () => {
    const a = input({ selector: ".cached" });
    const first = await generateLightDark(a);
    const second = await generateLightDark(a);
    expect(second).toBe(first);
  });
});

describe("listPresets", () => {
  it("6. returns the 6 seeded light-dark() presets", async () => {
    const presets = await listPresets();
    expect(presets).toHaveLength(6);
    expect(presets.every((p) => p.input.tokens.background.light)).toBe(true);
  });
});

describe("LightDarkGenerateSchema — Zod rejection boundaries", () => {
  const valid = {
    selector: ".card",
    colorScheme: "light dark",
    tokens: TOKENS,
  };

  it("7. colorScheme must be one of the three supported values", () => {
    expect(
      LightDarkGenerateSchema.safeParse({ ...valid, colorScheme: "auto" })
        .success,
    ).toBe(false);
  });

  it("8. every token needs both a light and a dark 3/6-digit hex", () => {
    expect(
      LightDarkGenerateSchema.safeParse({
        ...valid,
        tokens: { ...TOKENS, primary: { light: "#fff", dark: "white" } },
      }).success,
    ).toBe(false);
    expect(
      LightDarkGenerateSchema.safeParse({
        ...valid,
        tokens: { ...TOKENS, border: { light: "#12345" } },
      }).success,
    ).toBe(false);
  });

  it("9. selectors must match the selector charset", () => {
    expect(
      LightDarkGenerateSchema.safeParse({ ...valid, selector: "a, b!" })
        .success,
    ).toBe(false);
  });

  it("10. a minimal valid payload defaults the nested selectors", () => {
    const parsed = LightDarkGenerateSchema.parse(valid);
    expect(parsed.primarySelector).toBe(".btn");
    expect(parsed.mutedSelector).toBe(".muted");
  });
});
