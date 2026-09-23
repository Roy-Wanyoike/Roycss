/**
 * effect-page-content.ts
 *
 * Server-side content helpers for /effects/[id] (issue #190): the required
 * markup block and the prefers-reduced-motion note. Pure functions over the
 * catalog data (CSSEffect) so they run inside the ISR page render and are
 * unit-testable without a DOM (this repo's vitest environment is `node`).
 */

import type { CSSEffect } from "./roycss-types";

/* ═══════════════════════════════════════════════════════════════
   REQUIRED MARKUP
   ═══════════════════════════════════════════════════════════════

   The audit (task 9-c) found two gaps the live preview hides:
     • 57 effects declare childCount (loaders etc.) — the CSS expects an
       exact number of child <span> elements;
     • 81 further effects reference child <span> selectors in their cssCode
       (e.g. `.roycss-text-wave > span:nth-child(1..6)`) WITHOUT declaring
       childCount — copy-paste users got no hint the spans are required.
   The block below renders the exact HTML snippet (with copy) on the page
   whenever either applies.

   Issue #215 added the third source: STRUCTURAL patterns (aside drawers,
   figure/img comparisons, :target lightboxes, …) whose CSS needs specific
   elements, attributes and hierarchy — more than a plain class + spans.
   Those effects author a `requiredMarkup` string on the CSSEffect itself
   (the data side of the in-cssCode REQUIRED MARKUP comments) and it wins
   over the span-derived snippet verbatim. */

/**
 * Default number of <span> children shown when the CSS targets every child
 * span but pins no exact count (no childCount, no nth-child indices).
 */
export const DEFAULT_SPAN_COUNT = 6;

export interface RequiredMarkup {
  /** Number of <span> elements the snippet renders (0 for non-span markup). */
  spanCount: number;
  /**
   * true  — the snippet is the exact expected markup (authored structured
   *         markup, childCount, or a pinned nth-child scan);
   * false — the CSS styles every child span, so the count is illustrative.
   */
  exact: boolean;
  /** The HTML snippet shown in the copyable code block. */
  snippet: string;
  /**
   * Section intro override for structured (authored) markup — the generic
   * span copy on the effect page would be wrong for non-span markup.
   */
  intro?: string;
}

/** Intro copy shown above a structured (authored) required-markup block. */
export const STRUCTURED_MARKUP_INTRO =
  "This effect's CSS targets specific elements, attributes and hierarchy — paste this markup as-is (the outermost element carries the class):";

/** Count the <span> elements in a snippet (0 for non-span markup).
 *  HTML comments (e.g. the illustrative-snippet hint) are stripped first. */
export function countSpanElements(snippet: string): number {
  const withoutComments = snippet.replace(/<!--[\s\S]*?-->/g, "");
  return (withoutComments.match(/<span(?=[\s/>])/g) ?? []).length;
}

/** Strip /* ... *​/ comments (commented examples must not false-positive). */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * True when the CSS uses <span> as an element SELECTOR (`.x > span`,
 * `span.foo`, `span:hover`, …). Only text in selector position is examined —
 * declarations like `grid-column: 2 / span 2` or `span-inline-end` never
 * match, because they sit inside a rule body or carry a word character.
 */
export function usesSpanChildren(cssCode: string): boolean {
  for (const selector of selectorSegments(cssCode)) {
    // "span" at a selector-token boundary: start/combinator/preceding
    // selector, then a selector continuation char (space, class, pseudo,
    // attribute, child combinator, …) or end of the selector.
    if (/(^|[{},>+~\s])span(?=$|[\s.:[{>+~,)])/i.test(selector)) return true;
  }
  return false;
}

/**
 * Split CSS into selector segments (the text between a rule boundary and
 * the following "{"). @keyframes stop selectors ("0%, 100%") and at-rule
 * preludes ("@media (…)") naturally land in segments too; the span-token
 * test above rejects them. Comments are stripped first so commented-out
 * markup examples never match.
 */
function selectorSegments(cssCode: string): string[] {
  const css = stripComments(cssCode);
  const segments: string[] = [];
  const re = /(^|\})[^{}]*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) segments.push(m[0].slice(0, -1));
  return segments;
}

/**
 * Highest nth-child/nth-of-type index across the effect's span selectors —
 * the minimum number of child spans the CSS was written for.
 * Returns null when no span selector carries an nth index.
 */
function maxSpanChildIndex(css: string): number | null {
  let max: number | null = null;
  for (const selector of selectorSegments(css)) {
    if (!/(^|[{},>+~\s])span(?=$|[\s.:[{>+~,)])/i.test(selector)) continue;
    let m: RegExpExecArray | null;
    const nth = /nth-(?:child|of-type)\(\s*(\d+)\s*\)/gi;
    while ((m = nth.exec(selector))) {
      max = Math.max(max ?? 0, Number(m[1]));
    }
  }
  return max;
}

/** Build the snippet block shown in the Required-markup code box. */
function buildSpanSnippet(effectId: string, spanCount: number, illustrative: boolean): string {
  const lines: string[] = [];
  if (illustrative) {
    lines.push(
      "<!-- Any number of <span> children works — the CSS styles every child span. -->"
    );
  }
  lines.push(`<div class="roycss-${effectId}">`);
  for (let i = 0; i < spanCount; i++) lines.push("  <span></span>");
  lines.push("</div>");
  return lines.join("\n");
}

/**
 * Derive the required-markup block for an effect, or null when its CSS
 * needs no special markup (the plain `.roycss-<id>` class is enough).
 */
export function getRequiredMarkup(
  effect: Pick<CSSEffect, "id" | "childCount" | "cssCode" | "requiredMarkup">
): RequiredMarkup | null {
  // Issue #215: authored structured markup wins verbatim — it expresses
  // elements/attributes/hierarchy the span generator cannot.
  if (effect.requiredMarkup && effect.requiredMarkup.trim().length > 0) {
    const snippet = effect.requiredMarkup.trim();
    return {
      spanCount: countSpanElements(snippet),
      exact: true,
      snippet,
      intro: STRUCTURED_MARKUP_INTRO,
    };
  }

  const spansInCss = usesSpanChildren(effect.cssCode);

  if (!effect.childCount && !spansInCss) return null;

  if (effect.childCount && effect.childCount > 0) {
    // Declared data wins — the catalog says exactly how many children the
    // preview (and the CSS) expects.
    return {
      spanCount: effect.childCount,
      exact: true,
      snippet: buildSpanSnippet(effect.id, effect.childCount, false),
    };
  }

  const nth = maxSpanChildIndex(effect.cssCode);
  if (nth !== null && nth > 0) {
    return { spanCount: nth, exact: true, snippet: buildSpanSnippet(effect.id, nth, false) };
  }

  // Spans are styled as a group — any count works; show a representative one.
  return {
    spanCount: DEFAULT_SPAN_COUNT,
    exact: false,
    snippet: buildSpanSnippet(effect.id, DEFAULT_SPAN_COUNT, true),
  };
}

/* ═══════════════════════════════════════════════════════════════
   REDUCED-MOTION NOTE
   ═══════════════════════════════════════════════════════════════
   Shown under the a11y badge row whenever the effect animates
   (keyframe-driven motion). Transition-only effects are deliberately
   NOT noted: they only move in direct response to user interaction. */

const MOTION_NOTE_GUARDED =
  "Motion note: this effect animates and ships its own @media (prefers-reduced-motion: reduce) guard — safe to copy-paste standalone.";

const MOTION_NOTE_UNGUARDED =
  "Motion note: this effect animates but has no built-in reduced-motion guard. For standalone use, wrap it in @media (prefers-reduced-motion: no-preference) { … } — the full roycss.css build also ships a global kill-switch.";

/**
 * The prefers-reduced-motion line for the effect page, or null when the
 * effect does not animate. `motionSafe` comes from the generated a11y tags
 * (src/lib/effect-a11y.ts): true = the cssCode already contains its own
 * prefers-reduced-motion guard.
 */
export function getReducedMotionNote(
  cssCode: string,
  motionSafe: boolean
): string | null {
  const css = stripComments(cssCode);
  const animates = /@keyframes\b/.test(css) || /\banimation(?:-name)?\s*:/.test(css);
  if (!animates) return null;
  return motionSafe ? MOTION_NOTE_GUARDED : MOTION_NOTE_UNGUARDED;
}
