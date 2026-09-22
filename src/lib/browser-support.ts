/**
 * browser-support.ts
 *
 * Derives the /effects/[id] "Browser support" one-liner from the effect's
 * own cssCode (issue #190 — the audit found no browser-support info on any
 * of the 1,959 effect pages).
 *
 * Pure function over the CSS text: scans for modern-platform features and
 * returns (a) the always-true baseline line and (b) per-feature caveats.
 * This is intentionally NOT a full caniuse — it documents the features that
 * make an effect degrade or fail on older engines, in honest, short flags.
 * Keep the notes conservative; when in doubt the feature ships "2023+"
 * phrasing (see the :has() example in issue #190).
 */

export interface BrowserSupport {
  /** The baseline sentence every effect page shows. */
  baseline: string;
  /** One caveat per detected platform feature, newest-riskiest first. */
  notes: string[];
}

/** Strip /* ... *​/ comments so commented-out code never triggers a flag. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Feature table: detection regex → the caveat line shown on the page.
 * ORDER MATTERS — it is the display order (newest / riskiest first).
 */
const FEATURES: ReadonlyArray<{ pattern: RegExp; note: string }> = [
  {
    // anchor() / anchor-size() functions and the position-anchor family.
    pattern: /\banchor\(|position-anchor\s*:|position-area\s*:|position-try\s*:/i,
    note: "CSS anchor positioning is Chromium-only right now (Chrome/Edge 125+)",
  },
  {
    pattern: /view-transition/i,
    note: "view transitions are Chromium-only today (Chrome/Edge 111+)",
  },
  {
    pattern: /@starting-style\b/i,
    note: "@starting-style is Chromium-only today (Chrome/Edge 117+)",
  },
  {
    pattern: /@scope\b/i,
    note: "@scope is Chromium-only today (Chrome/Edge 118+)",
  },
  {
    pattern: /\btext-box\b|\btext-box-trim\b|\btext-box-edge\b/i,
    note: "text-box trimming is Chromium-only today (Chrome/Edge 133+)",
  },
  {
    pattern: /\binterpolate-size\b/i,
    note: "interpolate-size is Chromium-only today (Chrome/Edge 129+)",
  },
  {
    pattern: /\blight-dark\(/i,
    note: "light-dark() requires 2024+ browsers",
  },
  {
    // animation-timeline: scroll()/view() scroll-driven animations.
    pattern: /animation-timeline|\bscroll\(|\bview\(/i,
    note: "scroll-driven animations require Chrome/Edge 115+ or Firefox 121+ (2023+)",
  },
  {
    pattern: /@container\b/i,
    note: "container queries require 2023+ browsers",
  },
  {
    pattern: /@property\b/i,
    note: "@property requires Chrome/Edge 85+, Safari 16.4+, Firefox 128+",
  },
  {
    pattern: /:has\(/i,
    note: ":has() requires 2023+ browsers (Firefox 121+)",
  },
  {
    pattern: /\bcolor-mix\(/i,
    note: "color-mix() requires 2023+ browsers",
  },
  {
    pattern: /\boklch\(/i,
    note: "oklch() colors require Chrome/Edge 111+, Safari 15.4+, Firefox 113+ (2023)",
  },
  {
    // Flagged specially below — the note is skipped when the cssCode already
    // ships the -webkit- mirror (the author handled the legacy engine).
    pattern: /backdrop-filter\s*:/i,
    note: "backdrop-filter needs the -webkit- prefix on older Safari",
  },
];

/** Baseline shown on every effect page (all catalog effects are modern-CSS). */
export const BROWSER_BASELINE = "Modern browsers (Chrome/Edge/Firefox/Safari)";

/**
 * Derive browser-support info from an effect's CSS.
 *
 * @example getBrowserSupport(".x { color: oklch(70% 0.1 200); }")
 *   → { baseline: "Modern browsers (Chrome/Edge/Firefox/Safari)",
 *       notes: ["oklch() colors require Chrome/Edge 111+, Safari 15.4+, Firefox 113+ (2023)"] }
 */
export function getBrowserSupport(cssCode: string): BrowserSupport {
  const css = stripComments(cssCode);
  const notes: string[] = [];
  for (const { pattern, note } of FEATURES) {
    if (!pattern.test(css)) continue;
    // The backdrop-filter caveat only matters when the effect does NOT
    // already include the -webkit- mirror of the property.
    if (note.startsWith("backdrop-filter") && /-webkit-backdrop-filter\s*:/i.test(css)) {
      continue;
    }
    notes.push(note);
  }
  return { baseline: BROWSER_BASELINE, notes };
}

/**
 * Render the one-liner shown on the page:
 * "Browser support: Modern browsers (Chrome/Edge/Firefox/Safari) — <flag>; <flag>."
 */
export function formatBrowserSupport(support: BrowserSupport): string {
  const base = `Browser support: ${support.baseline}`;
  if (support.notes.length === 0) return base;
  return `${base} — ${support.notes.join("; ")}.`;
}
