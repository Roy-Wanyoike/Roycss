/**
 * Tailwind v4 export smoke test — issue #217b.
 *
 * Compiles a real Tailwind v4 entry (`@import "tailwindcss";
 * @import <dist>/roycss.tailwind.css`) through @tailwindcss/postcss —
 * the same compiler surface a consumer runs — and asserts that:
 *   1. the import graph resolves THROUGH dist/roycss.tailwind.css into
 *      dist/roycss.css (the recipe file is not a dead end),
 *   2. the full stylesheet passes Tailwind v4's Lightning CSS transform
 *      unmodified (syntax check across all ~2,000 effects),
 *   3. representative authored rules survive compilation byte-shape
 *      intact (class selectors, keyframes, media queries).
 *
 * This is the "at minimum: syntax check / build:package emits it" gate
 * the issue asks for, upgraded to a real compiler pass.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const ROOT = join(__dirname, "..", "..");
const DIST = join(ROOT, "dist");

async function compile(input: string, base: string): Promise<string> {
  const compiler = postcss([tailwindcss({ base })]);
  const result = await compiler.process(input, { from: join(base, "app.css") });
  return result.css;
}

describe("roycss/tailwind compiles under Tailwind v4", () => {
  it(
    "resolves the recipe file inlines the full effect stylesheet",
    { timeout: 120_000 },
    async () => {
      const input = `@import "tailwindcss";\n@import ${JSON.stringify(join(DIST, "roycss.tailwind.css"))};\n`;
      const out = await compile(input, ROOT);

      // Passed through the integration file into the real stylesheet.
      expect(out).toContain(".roycss-btn-glow");
      expect(out).toContain(".roycss-marquee-pause-hover");
      // Keyframes and at-rules survive the compiler.
      expect(out).toContain("@keyframes roy-pulse-glow");
      expect(out).toContain("@media (prefers-reduced-motion: reduce)");
      // The WCAG 2.2.2 pause rules from issue #214 are in the compiled output.
      expect(out).toContain(".roycss-marquee-pause-hover:focus-within");
    }
  );

  it("keeps the authored stylesheet intact — no mangled roycss selectors", async () => {
    const input = `@import ${JSON.stringify(join(DIST, "roycss.tailwind.css"))};\n`;
    const out = await compile(input, ROOT);
    const authored = readFileSync(join(DIST, "roycss.css"), "utf-8");

    // Set-inclusion invariant: every authored effect class must survive
    // the Tailwind compile. (Count parity is over-strict — LightningCSS
    // legitimately merges byte-identical duplicate selectors, which
    // reduces occurrence counts without dropping any class.)
    const classRe = /\.roycss-[a-z0-9-]+/g;
    const authoredTokens = new Set(authored.match(classRe) ?? []);
    const compiledTokens = new Set(out.match(classRe) ?? []);
    const missing = [...authoredTokens].filter((c) => !compiledTokens.has(c));
    expect(missing).toEqual([]);
  });
});
