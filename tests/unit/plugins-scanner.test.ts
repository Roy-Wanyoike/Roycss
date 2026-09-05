import { describe, expect, it } from "vitest";
import { isRoyCssClass, scanClasses, scanSources } from "../../packages/plugins/core/src/index";

/**
 * Scanner tests — the plugin must find `r-*` / `roycss-*` usage in realistic
 * JSX/TSX/template-literal/HTML/className-array sources, and must NOT be
 * fooled by CSS-ish words (`pointer-events`, `filter-`, `prefers-…`),
 * custom properties, keyframes names, or interpolated class fragments.
 */

const JSX_SAMPLE = `
import { clsx } from "clsx";

type Tone = "light" | "dark";

export function PricingCard({ featured, tone }: { featured: boolean; tone: Tone }) {
  const cardClass = [
    "roycss-card-3d",
    featured && "roycss-shine-border-wrap",
    tone === "dark" ? "roycss-glass-dark" : "roycss-glass-light",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClass}>
      <h2 className={\`roycss-animated-gradient-text \${featured ? "roycss-pulse-glow" : ""}\`}>
        Pro plan
      </h2>
      <button className={clsx("r-btn r-btn-primary", "roycss-bounce-in", { "r-pressed": featured })}>
        Choose plan
      </button>
    </section>
  );
}
`;

const HTML_SAMPLE = `
<!doctype html>
<html lang="en">
  <body>
    <div class="roycss-float r-hidden">Hello</div>
    <a class="roycss-underline-draw" href="#docs">Docs</a>
    <div class="roycss-marquee-wrapper" data-pause-on-hover="true"></div>
  </body>
</html>
`;

describe("scanClasses", () => {
  it("finds roycss-* classes in string className attributes", () => {
    const found = scanClasses('<div className="roycss-pulse-glow roycss-shake"></div>');
    expect(found).toEqual(["roycss-pulse-glow", "roycss-shake"]);
  });

  it("finds r-* utility shorthand classes", () => {
    const found = scanClasses('<div className="r-btn r-btn-primary r-grid-2"></div>');
    expect(found).toEqual(["r-btn", "r-btn-primary", "r-grid-2"]);
  });

  it("finds classes inside template literals with interpolation", () => {
    const found = scanClasses(
      'const cls = `roycss-card-3d ${active ? "roycss-pulse-glow" : "roycss-shake"}`;',
    );
    expect(found).toEqual(["roycss-card-3d", "roycss-pulse-glow", "roycss-shake"]);
  });

  it("finds classes inside className arrays, joins and conditionals", () => {
    const found = scanClasses(
      'const cls = ["roycss-card-3d", featured && "roycss-shine-border-wrap"].filter(Boolean).join(" ");',
    );
    expect(found).toContain("roycss-card-3d");
    expect(found).toContain("roycss-shine-border-wrap");
    expect(found).toHaveLength(2);
  });

  it("finds classes in plain HTML class attributes (multi-valued)", () => {
    const found = scanClasses(HTML_SAMPLE);
    expect(found).toEqual([
      "r-hidden",
      "roycss-float",
      "roycss-marquee-wrapper",
      "roycss-underline-draw",
    ]);
  });

  it("finds classes in a realistic TSX component (fixture parity)", () => {
    const found = scanClasses(JSX_SAMPLE);
    expect(found).toEqual([
      "r-btn",
      "r-btn-primary",
      "r-pressed",
      "roycss-animated-gradient-text",
      "roycss-bounce-in",
      "roycss-card-3d",
      "roycss-glass-dark",
      "roycss-glass-light",
      "roycss-pulse-glow",
      "roycss-shine-border-wrap",
    ]);
  });

  it("finds Svelte/Astro-style class directives", () => {
    const found = scanClasses('class:roycss-float={active} class:r-hidden={!active}');
    expect(found).toEqual(["r-hidden", "roycss-float"]);
  });

  it("de-duplicates and returns a sorted, deterministic result", () => {
    const a = scanClasses('className="roycss-shake roycss-float roycss-shake"');
    const b = scanClasses('className="roycss-float roycss-shake"');
    expect(a).toEqual(["roycss-float", "roycss-shake"]);
    expect(a).toEqual(b);
  });

  it("ignores CSS-ish words that merely contain r- or roycss substrings", () => {
    const source = [
      "pointer-events: none;",
      "filter: blur(2px);",
      "@media (prefers-reduced-motion: reduce) {}",
      "transition: transform 200ms linear;",
      "background: linear-gradient(to inline-end, red, blue);",
      "color: var(--roy-primary);",
      "@keyframes roy-bounce-in { from { opacity: 0; } }",
      "animation: roy-pulse-glow 2s infinite;",
      "border-radius: inherit;",
      "user-select: none;",
      'content: "pour-over coffee";',
      "const errorMessage = 'error-message';",
    ].join("\n");
    expect(scanClasses(source)).toEqual([]);
  });

  it("does not match partially-interpolated dynamic class names", () => {
    // `r-${size}` cannot be resolved statically — documented limitation.
    expect(scanClasses('className={`r-${size} roycss-fixed`}' )).toEqual(["roycss-fixed"]);
  });

  it("returns an empty array for empty or class-free input", () => {
    expect(scanClasses("")).toEqual([]);
    expect(scanClasses("const x = 1; // no classes here")).toEqual([]);
  });

  it("handles prefixed lookalikes without crossing token boundaries", () => {
    // `roycss-pulse-glow-x` is one token — not `roycss-pulse-glow`.
    expect(scanClasses('className="roycss-pulse-glow-x"')).toEqual(["roycss-pulse-glow-x"]);
    expect(scanClasses('className=".roycss-literal"')).toEqual(["roycss-literal"]);
  });
});

describe("scanSources", () => {
  it("unions classes across many sources with de-duplication", () => {
    const found = scanSources([JSX_SAMPLE, HTML_SAMPLE, 'className="roycss-float"']);
    expect(found).toContain("roycss-underline-draw");
    expect(found).toContain("roycss-bounce-in");
    expect(found.filter((c) => c === "roycss-float")).toHaveLength(1);
  });
});

describe("isRoyCssClass", () => {
  it("accepts roycss-* and r-* tokens", () => {
    expect(isRoyCssClass("roycss-pulse-glow")).toBe(true);
    expect(isRoyCssClass("r-grid")).toBe(true);
  });

  it("rejects non-RoyCSS tokens", () => {
    expect(isRoyCssClass("pointer-events")).toBe(false);
    expect(isRoyCssClass("--roy-primary")).toBe(false);
    expect(isRoyCssClass("")).toBe(false);
  });
});
