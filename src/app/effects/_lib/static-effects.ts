/**
 * Shared helpers for the /effects routes (issue #67, PF-014).
 *
 * Used by:
 *   • src/app/effects/page.tsx          — category index
 *   • src/app/effects/[id]/page.tsx     — per-effect detail page
 *   • src/app/sitemap.ts                — sitemap effect URLs
 *
 * Keeping these in one `_lib` module guarantees the enumerated page set
 * and the sitemap URLs are IDENTICAL (no drift between
 * generateStaticParams and sitemap entries).
 */

import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";

/**
 * Canonical production origin. Matches the domain already used by
 * src/app/sitemap.ts and src/app/robots.ts (roycss.com) so canonical
 * URLs, OG URLs and sitemap URLs never disagree.
 *
 * NOTE: src/app/layout.tsx metadataBase is currently a different origin
 * (roycss.space-z.ai) — a pre-existing inconsistency that predates this
 * PR. Effect pages emit ABSOLUTE URLs so they are unaffected.
 */
export const SITE_URL = "https://roycss.com";

/** Sample effects per category on the /effects index page. */
export const INDEX_SAMPLES_PER_CATEGORY = 4;

/** id → effect lookup (one Map, built once per server process). */
const byId: ReadonlyMap<string, CSSEffect> = new Map(
  effects.map((e) => [e.id, e] as const)
);

/** Total catalog size (single source of truth for display strings). */
export const EFFECT_COUNT = effects.length;

export function getEffect(id: string): CSSEffect | undefined {
  return byId.get(id);
}

/**
 * Every effect id in the catalog, in catalog order (1,959 pages).
 *
 * WHY ALL 1,959 (not a curated subset + on-demand rendering):
 *
 *   1. The issue demands a page for EACH of the 1,959 effects. With
 *      `dynamicParams = false` (see the page), only enumerated ids are
 *      reachable — anything else must 404 — so every id must be here.
 *   2. MEASURED build cost: this app prerenders ~256 pages in ~3s, so
 *      1,961 pages add ~20s of build time (full build ≈ 1.5 min, well
 *      under the 4-minute budget set for this task).
 *   3. `dynamicParams = true` was prototyped and REJECTED: because the
 *      root layout is dynamic (it reads headers()), on-demand renders
 *      STREAM the document shell as HTTP 200 before notFound() can
 *      throw — unknown ids came back as soft-404s (200 + "Page Not
 *      Found" body), which is an SEO antipattern. Router-level
 *      rejection (dynamicParams = false + full enumeration) returns a
 *      hard 404. Verified empirically in this repo.
 */
export function getEffectPageIds(): string[] {
  return effects.map((e) => e.id);
}
