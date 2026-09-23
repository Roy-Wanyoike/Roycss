import { categoryMeta } from "@/lib/roycss-effects";
import type { EffectCategory } from "@/lib/roycss-types";

/**
 * Category landing-page SEO copy (issue #198) — the pure counterpart of
 * src/lib/effect-page-metadata.ts. Kept as pure functions so unit tests can
 * pin the exact template, the ≤60-character title budget, and the
 * per-category keyword adjacency ("CSS Hover Effects", "CSS Loaders", …)
 * that the landing pages are meant to rank for.
 *
 * Title pattern measures at or under 60 chars for every category in
 * categoryOrder (pinned by tests/unit/category-pages.test.ts):
 *   "CSS Hover Effects — 120 Copy-Paste Examples | RoyCSS"
 *   "CSS Animations — 322 Copy-Paste Examples | RoyCSS"
 */

/** True title-case label ("Hover Effects", "3D Transforms", …). */
export function categoryLabel(category: EffectCategory): string {
  return categoryMeta[category].label;
}

/** SEO title for a category landing page — always ≤ 60 chars. */
export function categoryPageTitle(category: EffectCategory, count: number): string {
  return `CSS ${categoryLabel(category)} — ${count} Copy-Paste Examples | RoyCSS`;
}

/** SEO meta description for a category landing page. */
export function categoryPageDescription(category: EffectCategory, count: number): string {
  return `Browse ${count} free CSS ${categoryMeta[category].label.toLowerCase()} with live previews and copy-paste code. Pure CSS, zero JavaScript — part of the RoyCSS effects library.`;
}

/**
 * og:image for a category landing page (issue #206). /api/og accepts a
 * `category` param and renders a dedicated 1200×630 card (label + effect
 * count + description) — the same contract as the #116 `effect` param.
 * URL stays relative so metadataBase keeps origin control (#113).
 */
export function categoryOgImage(category: EffectCategory): string {
  return `/api/og?category=${category}`;
}

/** Keywords for a category page, mirroring the effect-page keyword strategy. */
export function categoryPageKeywords(category: EffectCategory, count: number): string[] {
  const label = categoryMeta[category].label;
  const singular = label.replace(/ Effects$/i, "").replace(/s$/i, "");
  return [
    `CSS ${label.toLowerCase()}`,
    `CSS ${singular.toLowerCase()} effect`,
    `free CSS ${label.toLowerCase()}`,
    `CSS ${singular.toLowerCase()} code`,
    "copy paste CSS",
    "RoyCSS",
  ];
}
