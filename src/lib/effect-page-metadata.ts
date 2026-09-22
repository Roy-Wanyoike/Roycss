/**
 * effect-page-metadata.ts
 *
 * Title + meta-description templates for /effects/[id] (issue #188, item 4).
 *
 * The audit (task 9-d) found the old template leaving keywords on the table
 * ("Pulse Glow — RoyCSS CSS Effect") and descriptions that concatenated
 * without punctuation ("…elements Pure CSS, zero JavaScript"). This module
 * is the single source of truth for the new copy so the page and its tests
 * agree without string duplication.
 *
 * Templates (issue #188):
 *   title       → `${name} CSS Effect — Copy-Paste Code | RoyCSS`   (≤ 60 chars)
 *   description → `${description}. Pure CSS, zero JavaScript — live
 *                  preview + copy-paste code.`
 */

/** The preferred title suffix (38 chars — names up to 22 chars fit in 60). */
const TITLE_SUFFIX = " CSS Effect — Copy-Paste Code | RoyCSS";

/** Shorter fallback suffix (20 chars) for long effect names. */
const SHORT_TITLE_SUFFIX = " CSS Effect | RoyCSS";

/** Hard cap from the issue's acceptance criteria ("matches template ≤60ch"). */
const TITLE_MAX_LENGTH = 60;

/**
 * Build the /effects/[id] <title> / og:title string.
 *
 * Prefers the full "… — Copy-Paste Code" template; falls back to
 * "… CSS Effect | RoyCSS" when the effect name would push the title past
 * 60 characters (81 of 1,959 catalog names are >22 chars, max 36 — the
 * fallback keeps every one of them inside the cap), and truncates the name
 * with an ellipsis only in the impossible-for-this-catalog >40-char case so
 * the function can never emit an over-long title for future data.
 */
export function effectPageTitle(name: string): string {
  const trimmed = name.trim();
  const full = `${trimmed}${TITLE_SUFFIX}`;
  if (full.length <= TITLE_MAX_LENGTH) return full;

  const short = `${trimmed}${SHORT_TITLE_SUFFIX}`;
  if (short.length <= TITLE_MAX_LENGTH) return short;

  const ellipsis = "…";
  const tail = ` | RoyCSS`;
  const budget = TITLE_MAX_LENGTH - ellipsis.length - tail.length;
  return `${trimmed.slice(0, budget).trimEnd()}${ellipsis}${tail}`;
}

/**
 * Build the /effects/[id] meta description.
 *
 * Fixes the punctuation-join defect from audit 9-d ("…elements Pure CSS,
 * zero JavaScript" ran together): the effect's own description always gets
 * sentence-final punctuation before the fixed suffix, and a trailing period
 * already present in the description is not doubled.
 */
export function effectPageDescription(description: string): string {
  const base = description.trim().replace(/[.]+$/, "");
  return `${base}. Pure CSS, zero JavaScript — live preview + copy-paste code.`;
}
