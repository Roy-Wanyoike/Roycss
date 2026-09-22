import { describe, expect, it } from "vitest";
import { effects } from "@/lib/roycss-effects";
import {
  BROWSER_BASELINE,
  formatBrowserSupport,
  getBrowserSupport,
} from "@/lib/browser-support";

/**
 * Issue #190 — the "Browser support" one-liner on /effects/[id].
 *
 * Pure feature scan over the effect's own cssCode; the audit (task 9-c)
 * found browser-support info missing on every effect page. The notes are
 * honest, short platform flags — not a caniuse replacement.
 */
describe("getBrowserSupport", () => {
  it("always reports the modern-browsers baseline", () => {
    const s = getBrowserSupport(".x { color: red; }");
    expect(s.baseline).toBe("Modern browsers (Chrome/Edge/Firefox/Safari)");
    expect(BROWSER_BASELINE).toBe(s.baseline);
    expect(s.notes).toEqual([]);
  });

  it("formats the baseline-only line without a trailing dash", () => {
    expect(formatBrowserSupport(getBrowserSupport(".x { color: red; }"))).toBe(
      "Browser support: Modern browsers (Chrome/Edge/Firefox/Safari)"
    );
  });

  it.each([
    [
      ":has()",
      ".x:has(> img) { outline: 2px solid red; }",
      ":has() requires 2023+ browsers (Firefox 121+)",
    ],
    [
      "scroll-driven animations",
      ".x { animation-timeline: scroll(); }",
      "scroll-driven animations require Chrome/Edge 115+ or Firefox 121+ (2023+)",
    ],
    [
      "scroll-driven animations (view())",
      ".x { animation-timeline: view(); }",
      "scroll-driven animations require Chrome/Edge 115+ or Firefox 121+ (2023+)",
    ],
    [
      "anchor positioning",
      ".tip { position-anchor: --btn; top: anchor(bottom); }",
      "CSS anchor positioning is Chromium-only right now (Chrome/Edge 125+)",
    ],
    [
      "color-mix()",
      ".x { color: color-mix(in oklch, red, blue); }",
      "color-mix() requires 2023+ browsers",
    ],
    [
      "oklch()",
      ".x { color: oklch(0.7 0.1 200); }",
      "oklch() colors require Chrome/Edge 111+, Safari 15.4+, Firefox 113+ (2023)",
    ],
    [
      "@property",
      "@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }",
      "@property requires Chrome/Edge 85+, Safari 16.4+, Firefox 128+",
    ],
    [
      "container queries",
      "@container (min-width: 400px) { .x { color: red; } }",
      "container queries require 2023+ browsers",
    ],
    [
      "@starting-style",
      ".x { @starting-style { opacity: 1; } }",
      "@starting-style is Chromium-only today (Chrome/Edge 117+)",
    ],
    [
      "view transitions",
      ".x { view-transition-name: card; }",
      "view transitions are Chromium-only today (Chrome/Edge 111+)",
    ],
    [
      "light-dark()",
      ".x { color: light-dark(red, blue); }",
      "light-dark() requires 2024+ browsers",
    ],
    [
      "@scope",
      "@scope (.card) { p { color: red; } }",
      "@scope is Chromium-only today (Chrome/Edge 118+)",
    ],
    [
      "text-box",
      ".x { text-box: trim-both cap alphabetic; }",
      "text-box trimming is Chromium-only today (Chrome/Edge 133+)",
    ],
    [
      "interpolate-size",
      ":root { interpolate-size: allow-keywords; }",
      "interpolate-size is Chromium-only today (Chrome/Edge 129+)",
    ],
  ])("flags $1", (_label, css, expectedNote) => {
    const s = getBrowserSupport(css);
    expect(s.notes).toContain(expectedNote);
  });

  it("flags unprefixed backdrop-filter but skips it when the -webkit- mirror ships", () => {
    const note = "backdrop-filter needs the -webkit- prefix on older Safari";
    expect(getBrowserSupport(".x { backdrop-filter: blur(4px); }").notes).toContain(note);
    expect(
      getBrowserSupport(
        ".x { -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }"
      ).notes
    ).not.toContain(note);
  });

  it("never flags a property mentioned only inside a comment", () => {
    expect(
      getBrowserSupport("/* use :has() someday */ .x { color: red; }").notes
    ).toEqual([]);
  });

  it("does not confuse linear-gradient with other `view(`/`scroll(` tokens", () => {
    expect(
      getBrowserSupport(".x { background: linear-gradient(red, blue); }").notes
    ).toEqual([]);
  });

  it("orders notes newest-riskiest first and joins them on one line", () => {
    const css = ".x { color: color-mix(in srgb, red, blue); backdrop-filter: blur(2px); }";
    const s = getBrowserSupport(css);
    expect(s.notes[0]).toContain("color-mix()");
    const line = formatBrowserSupport(s);
    expect(line).toMatch(/^Browser support: Modern browsers \(Chrome\/Edge\/Firefox\/Safari\) — /);
    expect(line.endsWith(".")).toBe(true);
  });

  it("produces at least the baseline for EVERY catalog effect (no crashes, sane notes)", () => {
    for (const effect of effects) {
      const s = getBrowserSupport(effect.cssCode);
      expect(s.baseline, effect.id).toBe(BROWSER_BASELINE);
      // No duplicate notes for a single effect.
      expect(new Set(s.notes).size, effect.id).toBe(s.notes.length);
      // Every note is a non-empty sentence fragment.
      for (const note of s.notes) expect(note.length, effect.id).toBeGreaterThan(10);
    }
  });
});
