import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractStylesheet,
  isBalancedCss,
  scanClasses,
} from "../../packages/plugins/core/src/index";

/**
 * Extraction against the REAL shipped stylesheet (`dist/roycss.css`,
 * 1959 effects / ~1.6 MB) — the same artifact the plugins default to.
 */

const REPO_ROOT = join(__dirname, "..", "..");
const FULL_CSS = readFileSync(join(REPO_ROOT, "dist", "roycss.css"), "utf8");

const SAMPLE_JSX = `
export function Card() {
  return (
    <div className="roycss-pulse-glow">
      <span className="roycss-shake r-btn">hi</span>
    </div>
  );
}
`;

// A class whose effect lives inside an @supports fallback block with a
// nested @keyframes (roycss-property-hue-cycle → roy-b10-phc-fb).
const SAMPLE_WITH_SUPPORTS = 'className="roycss-property-hue-cycle"';

// An effect with a dedicated prefers-reduced-motion block in @media.
const SAMPLE_WITH_MEDIA = 'className="roycss-anim-liquid-metal-b18"';

describe("extractStylesheet (real shipped stylesheet)", () => {
  const result = extractStylesheet(FULL_CSS, scanClasses(SAMPLE_JSX));

  it("finds the used classes via the scanner first", () => {
    expect(scanClasses(SAMPLE_JSX)).toEqual(["r-btn", "roycss-pulse-glow", "roycss-shake"]);
  });

  it("keeps the used rules and their @keyframes, drops the rest", () => {
    expect(result.css).toContain(".roycss-pulse-glow");
    expect(result.css).toContain("@keyframes roy-pulse-glow");
    expect(result.css).toContain(".roycss-shake");
    expect(result.css).toContain("@keyframes roy-shake");
    expect(result.css).not.toContain(".roycss-fade-in-up");
    expect(result.css).not.toContain("@keyframes roy-fade-in-up");
  });

  it("produces a valid, dramatically smaller subset", () => {
    expect(isBalancedCss(result.css)).toBe(true);
    expect(result.outputBytes).toBeLessThan(result.inputBytes / 20); // < 5 %
    expect(result.keptRules).toBeLessThan(result.totalRules / 20);
  });

  it("keeps the global a11y guard and base reset", () => {
    expect(result.css).toContain('[class^="roycss-"]');
    expect(result.css).toContain("prefers-reduced-motion");
    expect(result.css).toContain("box-sizing: border-box");
  });

  it("keeps per-effect @media blocks only for used effects", () => {
    const withMedia = extractStylesheet(FULL_CSS, scanClasses(SAMPLE_WITH_MEDIA));
    expect(withMedia.css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.roycss-anim-liquid-metal-b18/,
    );
    expect(withMedia.css).not.toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.roycss-pulse-glow/,
    );
  });

  it("resolves nested @keyframes inside @supports fallback blocks", () => {
    const withSupports = extractStylesheet(FULL_CSS, scanClasses(SAMPLE_WITH_SUPPORTS));
    expect(withSupports.css).toContain(".roycss-property-hue-cycle");
    expect(withSupports.css).toContain("@supports not (background: hsl(from red h s l))");
    expect(withSupports.css).toContain("@keyframes roy-b10-phc-fb");
    // The @property registered effects stay out unless referenced.
    expect(withSupports.css).not.toContain("@property --roy-b10-ppb-progress");
  });

  it("keeps @property registrations referenced by kept rules", () => {
    // .roycss-property-progress-bar animates --roy-b10-ppb-progress.
    const withProperty = extractStylesheet(FULL_CSS, ["roycss-property-progress-bar"]);
    expect(withProperty.css).toContain(".roycss-property-progress-bar");
    expect(withProperty.css).toContain("@property --roy-b10-ppb-progress");
    expect(withProperty.css).toContain("@keyframes roy-b10-ppb-fill");
  });

  it("returns empty CSS for an empty usage set", () => {
    const empty = extractStylesheet(FULL_CSS, []);
    expect(empty.css).toBe("");
  });

  it("ignores unknown classes safely (r-* shorthand has no rules yet)", () => {
    const partial = extractStylesheet(FULL_CSS, ["r-btn", "roycss-pulse-glow"]);
    expect(partial.matchedClasses).toEqual(["roycss-pulse-glow"]);
    expect(partial.unmatchedClasses).toEqual(["r-btn"]);
    expect(partial.css).toContain(".roycss-pulse-glow");
  });

  it("is idempotent on the real stylesheet", () => {
    const classes = scanClasses(SAMPLE_JSX);
    const first = extractStylesheet(FULL_CSS, classes);
    const second = extractStylesheet(first.css, classes);
    expect(second.css).toBe(first.css);
  });

  it("extraction scales: ~40 effects still stay far under 5 % of the stylesheet", () => {
    const many = Array.from({ length: 40 }, (_, i) => `roycss-fx-${i}`); // unknown
    const mixed = extractStylesheet(FULL_CSS, [
      ...scanClasses(SAMPLE_JSX),
      ...many,
      "roycss-property-hue-cycle",
      "roycss-anim-liquid-metal-b18",
    ]);
    expect(mixed.outputBytes).toBeLessThan(mixed.inputBytes / 20);
  });
});
