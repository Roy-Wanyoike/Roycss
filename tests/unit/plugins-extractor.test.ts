import { describe, expect, it } from "vitest";
import { extractStylesheet, isBalancedCss } from "../../packages/plugins/core/src/index";

/**
 * Extractor tests on a synthetic stylesheet that mirrors every structural
 * pattern of the shipped `dist/roycss.css` (top-level rules, `@keyframes`,
 * `@property`, per-effect `@media`, nested `@keyframes` inside `@supports`,
 * `:where(:root)` tokens, the base reset and the global a11y guard) plus a
 * `r-*` utility rule and nesting from `src/app/roycss.css`.
 */

const FIXTURE_CSS = `@charset "UTF-8";

*, *::before, *::after { box-sizing: border-box; }

:where(:root) {
  --roy-primary: oklch(0.7 0.1 200);
  --roy-unused-token: oklch(0.5 0 0);
}

/* Pulse Glow */
.roycss-pulse-glow {
  animation: roy-pulse-glow 2s ease-in-out infinite;
  color: var(--roy-primary);
}

@keyframes roy-pulse-glow {
  0%, 100% { box-shadow: 0 0 5px oklch(0 0 0 / 0.2); }
  50% { box-shadow: 0 0 20px oklch(0 0 0 / 0.4); }
}

/* Shake */
.roycss-shake {
  animation: roy-shake 0.5s ease-in-out;
}

@keyframes roy-shake {
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-4px); }
}

@property --roy-progress {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}

.roycss-progress-ring {
  animation: roy-progress-ring 1s linear;
  transform: translateX(calc(var(--roy-progress) * 100px));
}

@keyframes roy-progress-ring {
  to { transform: translateX(100px); }
}

.r-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.roycss-card-3d .roycss-card-3d-inner {
  transform-style: preserve-3d;
}

.roycss-marquee-wrapper {
  mask-image: linear-gradient(to inline-end, transparent, oklch(0 0 0) 8%);

  & .roycss-marquee-track {
    animation: roycss-marquee var(--marquee-duration, 30s) linear infinite;
  }
}

@keyframes roycss-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@media (prefers-reduced-motion: reduce) {
  [class^="roycss-"],
  [class*=" roycss-"] {
    animation-duration: 0.01ms !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-pulse-glow { animation: none; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-shake { animation: none; }
}

@supports not (offset-path: path("M0 0L1 1")) {
  .roycss-offset-draw::before {
    animation: roy-offset-fb 2.5s ease-in-out infinite;
  }
  @keyframes roy-offset-fb {
    to { transform: translateX(10px); }
  }
}

@media (prefers-contrast: high) {
  .roycss-ferrum-high-contrast-border {
    border-width: 4px;
  }
}
`;

describe("extractStylesheet (synthetic fixture)", () => {
  it("keeps used class rules and their keyframes, drops everything else", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow"]);
    expect(result.css).toContain(".roycss-pulse-glow");
    expect(result.css).toContain("@keyframes roy-pulse-glow");
    expect(result.css).not.toContain(".roycss-shake");
    expect(result.css).not.toContain("@keyframes roy-shake");
    expect(result.css).not.toContain(".roycss-progress-ring");
    expect(result.css).not.toContain(".roycss-card-3d");
  });

  it("produces a structurally valid, smaller subset", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow"]);
    expect(result.outputBytes).toBeGreaterThan(0);
    expect(result.outputBytes).toBeLessThan(result.inputBytes);
    expect(isBalancedCss(result.css)).toBe(true);
  });

  it("resolves keyframes dependencies transitively (kept rule → its @keyframes)", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-progress-ring"]);
    expect(result.css).toContain(".roycss-progress-ring");
    expect(result.css).toContain("@keyframes roy-progress-ring");
    // @property is kept only because the kept rule references --roy-progress.
    expect(result.css).toContain("@property --roy-progress");
  });

  it("drops @keyframes whose owning class is unused", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-shake"]);
    expect(result.css).toContain("@keyframes roy-shake");
    expect(result.css).not.toContain("@keyframes roy-pulse-glow");
    expect(result.css).not.toContain("@property --roy-progress");
  });

  it("keeps root custom-property definitions only when referenced", () => {
    // includeBase: false isolates the var-dependency logic from the base path.
    const withVar = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow"], { includeBase: false });
    expect(withVar.css).toContain("--roy-primary");
    const withoutVar = extractStylesheet(FIXTURE_CSS, ["roycss-shake"], { includeBase: false });
    expect(withoutVar.css).not.toContain("--roy-primary");
  });

  it("keeps per-class @media blocks for used classes only", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow"]);
    expect(result.css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{\s*\.roycss-pulse-glow/);
    const shakeOnly = extractStylesheet(FIXTURE_CSS, ["roycss-shake"]);
    expect(shakeOnly.css).not.toMatch(/@media[^}]*\.roycss-pulse-glow/);
  });

  it("keeps the global prefers-reduced-motion guard when output is non-empty", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow"]);
    expect(result.css).toContain('[class^="roycss-"]');
    expect(result.css).toContain('[class*=" roycss-"]');
  });

  it("keeps the class-less base reset alongside any kept rule", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-shake"]);
    expect(result.css).toContain("box-sizing: border-box");
    const noBase = extractStylesheet(FIXTURE_CSS, ["roycss-shake"], { includeBase: false });
    expect(noBase.css).not.toContain("box-sizing: border-box");
  });

  it("supports r-* utility classes and descendant selectors", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["r-grid-2", "roycss-card-3d-inner"]);
    expect(result.css).toContain(".r-grid-2");
    // The descendant rule is kept whole when the inner class is used.
    expect(result.css).toContain(".roycss-card-3d .roycss-card-3d-inner");
  });

  it("keeps CSS nesting blocks whose inner class is used", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-marquee-wrapper"]);
    expect(result.css).toContain(".roycss-marquee-wrapper");
    expect(result.css).toContain("& .roycss-marquee-track");
    expect(result.css).toContain("@keyframes roycss-marquee");
  });

  it("keeps nested @keyframes inside @supports together with their rule", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-offset-draw"]);
    expect(result.css).toContain("@supports not (offset-path: path(");
    expect(result.css).toContain(".roycss-offset-draw::before");
    expect(result.css).toContain("@keyframes roy-offset-fb");
  });

  it("ignores unknown classes safely and reports them", () => {
    const result = extractStylesheet(FIXTURE_CSS, [
      "roycss-pulse-glow",
      "roycss-does-not-exist",
      "r-also-unknown",
    ]);
    expect(result.unmatchedClasses).toEqual(["r-also-unknown", "roycss-does-not-exist"]);
    expect(result.matchedClasses).toEqual(["roycss-pulse-glow"]);
    expect(result.css).toContain(".roycss-pulse-glow");
  });

  it("emits an empty stylesheet when no class matches", () => {
    const result = extractStylesheet(FIXTURE_CSS, []);
    expect(result.css).toBe("");
    expect(result.outputBytes).toBe(0);
    const unknown = extractStylesheet(FIXTURE_CSS, ["roycss-does-not-exist"]);
    expect(unknown.css).toBe("");
  });

  it("is idempotent: extracting the extraction yields identical output", () => {
    const first = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow", "roycss-progress-ring"]);
    const second = extractStylesheet(first.css, [
      "roycss-pulse-glow",
      "roycss-progress-ring",
    ]);
    expect(second.css).toBe(first.css);
  });

  it("preserves original rule order and drops comments of dropped rules", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-pulse-glow"]);
    const pulseIdx = result.css.indexOf(".roycss-pulse-glow");
    const kfIdx = result.css.indexOf("@keyframes roy-pulse-glow");
    expect(pulseIdx).toBeGreaterThan(-1);
    expect(kfIdx).toBeGreaterThan(pulseIdx);
    // "/* Shake */" belongs to a dropped rule and must not survive.
    expect(result.css).not.toContain("/* Shake */");
    // "/* Pulse Glow */" belongs to a kept rule and is preserved.
    expect(result.css).toContain("/* Pulse Glow */");
  });

  it("prunes partially-matched group blocks to their kept children", () => {
    const css = `@media (min-width: 600px) {
  .roycss-a { color: red; }
  .roycss-b { color: blue; }
}
`;
    const result = extractStylesheet(css, ["roycss-a"]);
    expect(result.css).toContain(".roycss-a");
    expect(result.css).not.toContain(".roycss-b");
    expect(result.css).toContain("@media (min-width: 600px)");
    expect(isBalancedCss(result.css)).toBe(true);
  });

  it("reports kept/total stats", () => {
    const result = extractStylesheet(FIXTURE_CSS, ["roycss-shake"]);
    // 13 style rules total: 8 top-level + guard + 3 per-class @media rules +
    // the @supports rule + the contrast rule. 5 kept: .roycss-shake, its
    // reduced-motion block, plus the 3 class-less base rules (reset, tokens,
    // a11y guard).
    expect(result.totalRules).toBe(13);
    expect(result.keptRules).toBe(5);
    expect(result.totalKeyframes).toBe(5);
    expect(result.keptKeyframes).toBe(1);
  });

  it("normalizes used classes (leading dot, whitespace, duplicates)", () => {
    const dotted = extractStylesheet(FIXTURE_CSS, [".roycss-shake", " roycss-shake "]);
    expect(dotted.matchedClasses).toEqual(["roycss-shake"]);
  });
});
