/**
 * RoyCSS Platform Constants — Single Source of Truth
 *
 * All counts displayed across the platform derive from these constants.
 * Never hardcode effect/product/tool counts in components — import from here.
 *
 * NOTE: every published number is re-exported from src/lib/site-stats.ts,
 * which derives effect/category/product counts from the real catalog and
 * the version from package.json (audit F-03). Do not fork these values.
 */
export {
  EFFECT_COUNT,
  EFFECT_COUNT_FORMATTED,
  CATEGORY_COUNT,
  PRODUCT_COUNT,
  TOOL_COUNT,
  VERSION,
  VERSION_BADGE,
} from "./site-stats";

export const CSS_LINES = "~22,000";
export const BACKEND_MODULE_COUNT = 68;
export const WEBGL_EFFECT_COUNT = 7;
export const LICENSE = "MIT";
export const AUTHOR = "Royford Wanyoike Wamaitha";
export const REPO_URL = "https://github.com/Roy-Wanyoike/roycss";
export const SITE_URL = "https://roycss.com";

// Tier counts for platform section (matches product-registry categories:
// components 12 · design 10 · ai 10 · devtools 14 · enterprise 13 · integrations 3)
export const TIER_COUNTS = {
  Build: 12,
  Design: 10,
  AI: 10,
  DevTools: 14,
  Enterprise: 13,
  Learning: 3,
} as const;
