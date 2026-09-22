/**
 * Site-wide truth constants — single source of truth for every count,
 * version, and size the user-facing site renders (audit finding F-03).
 *
 * Rules:
 *   1. Never hardcode an effect/tool/product count or a version string in
 *      a component, metadata block, or JSON file. Import it from here.
 *      (The homepage hero in roycss-page.tsx already followed this
 *      pattern for the effect count — this module extends it to every
 *      other number the site claims.)
 *   2. The effect count and category count are DERIVED from the real
 *      catalog (src/lib/roycss-effects.ts — the same data that builds
 *      dist/roycss.css), so the site can never disagree with the package.
 *   3. The version is read from package.json — the same file `npm
 *      publish` reads — so the site can never claim a version that was
 *      never released.
 *
 * TOOL_COUNT is the one hand-maintained number: it counts the tool
 * registry in src/components/roycss/tool-registry.ts (the `ToolType`
 * union + TOOL_META behind the platform Tools sheet AND the browsable
 * <DevToolsGallery/> — single source of truth since issue #185). It
 * cannot be imported here (that file imports lucide icons — fine for
 * client bundles, not for metadata-only server code), so
 * tests/unit/tool-registry.test.ts pins it to the registry source and
 * fails CI when a tool is added without updating this constant.
 *
 * public/manifest.json is static JSON and cannot import this module —
 * the same test pins its numbers to the catalog as well.
 */

import { effects } from "./roycss-effects";
import { PRODUCTS } from "./product-registry";
import pkg from "../../package.json";

/** Total shipped effects — derived from the real catalog. */
export const EFFECT_COUNT = effects.length; // 1,959

/** "1,959" — pre-formatted for display copy. */
export const EFFECT_COUNT_FORMATTED =
  EFFECT_COUNT.toLocaleString("en-US");

/** Number of distinct effect categories in the catalog. */
export const CATEGORY_COUNT = new Set(
  effects.map((e) => e.category),
).size; // 29

/** Platform products — derived from src/lib/product-registry.ts. */
export const PRODUCT_COUNT = PRODUCTS.length; // 62

/**
 * Developer tools in the platform Tools sheet — hand-maintained mirror
 * of the `ToolType` union in platform-tools.tsx (pinned by unit test).
 */
export const TOOL_COUNT = 70;

/** Package version — same file npm publish reads. */
export const VERSION = pkg.version; // "2.0.0"

/** "v2.0" — short badge form (major.minor) for the nav badge. */
export const VERSION_BADGE = `v${VERSION.split(".")[0]}.${VERSION.split(".")[1]}`;

/** Sizes of the shipped stylesheet, for honest docs/FAQ copy. */
export const FULL_CSS_MIN_BYTES = 1_352_590; // dist/roycss.min.css (pinned by test)
export const FULL_CSS_MIN_GZ_KB = 201; // gzip of dist/roycss.min.css (pinned by test)
