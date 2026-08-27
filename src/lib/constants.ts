/**
 * RoyCSS Platform Constants — Single Source of Truth
 *
 * All counts displayed across the platform should derive from these constants.
 * Never hardcode effect/product/tool counts in components — import from here.
 */
import { effects } from "./roycss-effects";

export const EFFECT_COUNT = effects.length; // 1,869
export const EFFECT_COUNT_FORMATTED = EFFECT_COUNT.toLocaleString(); // "1,869"

export const CATEGORY_COUNT = new Set(effects.map((e) => e.category)).size; // 31

export const PRODUCT_COUNT = 62;
export const TOOL_COUNT = 64;
export const CSS_LINES = "~22,000";
export const BACKEND_MODULE_COUNT = 68;
export const WEBGL_EFFECT_COUNT = 7;

export const VERSION = "1.0.0";
export const LICENSE = "MIT";
export const AUTHOR = "Royford Wanyoike Wamaitha";
export const REPO_URL = "https://github.com/Roy-Wanyoike/roycss";
export const SITE_URL = "https://roycss.space-z.ai";

// Tier counts for platform section
export const TIER_COUNTS = {
  Build: 12,
  Design: 10,
  AI: 10,
  DevTools: 14,
  Enterprise: 13,
  Learning: 3,
} as const;
