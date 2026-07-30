import { describe, it, expect } from "vitest";
import {
  designTokens,
  generateCSSVariables,
  generateJSONTokens,
  generateTailwindConfig,
  type TokenCategory,
} from "@/lib/design-tokens";

/**
 * RoyCSS's design-token system is OKLCH-first. Hex colors are banned across
 * the library so that color-mix() and relative-color syntax can compose
 * freely. These tests lock that policy at the data layer.
 */
describe("design-tokens corpus", () => {
  it("ships exactly 12 token categories (the documented set)", () => {
    expect(designTokens).toHaveLength(12);
  });

  it("uses unique category ids", () => {
    const ids = designTokens.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique category labels", () => {
    const labels = designTokens.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("gives every category at least one token", () => {
    for (const cat of designTokens) {
      expect(Object.keys(cat.tokens).length, `empty tokens in ${cat.id}`).toBeGreaterThan(0);
    }
  });

  it("ensures every token value is a string or number", () => {
    for (const cat of designTokens) {
      for (const [name, value] of Object.entries(cat.tokens)) {
        expect(
          typeof value === "string" || typeof value === "number",
          `${cat.id}.${name} has invalid type ${typeof value}`,
        ).toBe(true);
      }
    }
  });
});

describe("color tokens are OKLCH-only", () => {
  const colorCat = designTokens.find((c) => c.id === "color");
  expect(colorCat, "color category must exist").toBeDefined();
  if (!colorCat) throw new Error("color category missing");

  const OKLCH_RE = /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*(,\s*[\d.]+\s*)?\)$/i;

  it("emits every color token as an oklch(...) value", () => {
    const bad: string[] = [];
    for (const [name, value] of Object.entries(colorCat!.tokens)) {
      if (typeof value !== "string" || !OKLCH_RE.test(value.trim())) {
        bad.push(`color.${name} = ${JSON.stringify(value)}`);
      }
    }
    expect(bad, `non-OKLCH color tokens:\n${bad.join("\n")}`).toEqual([]);
  });

  it("contains zero hex colors anywhere in the designTokens array", () => {
    const offenders: string[] = [];
    for (const cat of designTokens) {
      for (const [name, value] of Object.entries(cat.tokens)) {
        if (typeof value === "string" && /#[0-9a-fA-F]{3,8}\b/.test(value)) {
          offenders.push(`${cat.id}.${name} = ${value}`);
        }
      }
    }
    expect(offenders, `hex colors found:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("contains zero rgb()/rgba()/hsl()/hsla() color calls", () => {
    const offenders: string[] = [];
    const RE = /\b(rgba?|hsla?)\s*\(/i;
    for (const cat of designTokens) {
      for (const [name, value] of Object.entries(cat.tokens)) {
        if (typeof value === "string" && RE.test(value)) {
          offenders.push(`${cat.id}.${name} = ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("shadow tokens use color-mix(in oklch, …)", () => {
  const shadowCat = designTokens.find((c) => c.id === "shadow");
  expect(shadowCat).toBeDefined();
  if (!shadowCat) throw new Error("shadow category missing");

  it("uses color-mix(in oklch, …) in every non-none shadow token", () => {
    const bad: string[] = [];
    for (const [name, value] of Object.entries(shadowCat!.tokens)) {
      if (typeof value !== "string") continue;
      if (value === "none") continue;
      if (!value.includes("color-mix(in oklch,")) {
        bad.push(`shadow.${name} = ${value}`);
      }
    }
    expect(bad, `shadows not using color-mix(in oklch, …):\n${bad.join("\n")}`).toEqual([]);
  });
});

describe("generateCSSVariables", () => {
  it("returns a non-empty :root { … } block", () => {
    const css = generateCSSVariables();
    expect(css.startsWith(":root {")).toBe(true);
    expect(css.trim().endsWith("}")).toBe(true);
  });

  it("emits one --roy-<category>-<name> custom property per token", () => {
    const css = generateCSSVariables();
    for (const cat of designTokens) {
      for (const name of Object.keys(cat.tokens)) {
        expect(css, `missing CSS var --roy-${cat.id}-${name}`).toContain(
          `--roy-${cat.id}-${name}:`,
        );
      }
    }
  });

  it("does not duplicate any custom property name", () => {
    const css = generateCSSVariables();
    const matches = css.matchAll(/--roy-[\w-]+:/g);
    const names = new Set<string>();
    const dupes: string[] = [];
    for (const m of matches) {
      if (names.has(m[0])) dupes.push(m[0]);
      names.add(m[0]);
    }
    expect(dupes, `duplicate CSS vars: ${dupes.slice(0, 5).join(", ")}`).toEqual([]);
  });
});

describe("generateJSONTokens", () => {
  it("returns one entry per token category", () => {
    const json = generateJSONTokens();
    expect(Object.keys(json).length).toBe(designTokens.length);
    for (const cat of designTokens) {
      expect(json[cat.id]).toBeDefined();
    }
  });

  it("gives every token a { value, type } shape", () => {
    const json = generateJSONTokens();
    for (const cat of designTokens) {
      for (const [name] of Object.entries(cat.tokens)) {
        const entry = json[cat.id][name];
        expect(entry).toBeDefined();
        expect("value" in entry).toBe(true);
        expect("type" in entry).toBe(true);
        expect(typeof entry.type).toBe("string");
      }
    }
  });
});

describe("generateTailwindConfig", () => {
  it("returns a non-empty config object", () => {
    const cfg = generateTailwindConfig();
    expect(Object.keys(cfg).length).toBeGreaterThan(0);
  });

  it("maps every category into a known Tailwind namespace", () => {
    const cfg = generateTailwindConfig();
    const expected = new Set([
      "colors",
      "fontSize",
      "spacing",
      "borderRadius",
      "boxShadow",
      "borderWidth",
      "opacity",
      "zIndex",
      "transitionTimingFunction",
      "screens",
      "maxWidth",
    ]);
    for (const ns of Object.keys(cfg)) {
      // Some categories (e.g. zIndex) may collide on the same Tailwind namespace,
      // so we only assert that every namespace is one we expect.
      expect(expected.has(ns), `unexpected Tailwind namespace: ${ns}`).toBe(true);
    }
  });

  it("emits var(--roy-…) references, not raw values", () => {
    const cfg = generateTailwindConfig();
    for (const [, tokens] of Object.entries(cfg)) {
      for (const [, value] of Object.entries(tokens)) {
        expect(value).toMatch(/^var\(--roy-/);
      }
    }
  });
});

describe("public type surface", () => {
  it("exports the TokenCategory type (compile-time check)", () => {
    const sample: TokenCategory = designTokens[0];
    expect(sample.id).toBeDefined();
  });
});
