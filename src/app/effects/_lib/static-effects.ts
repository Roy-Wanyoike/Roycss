/**
 * Shared helpers for the /effects routes (issue #67, PF-014).
 *
 * Used by:
 *   • src/app/effects/page.tsx          — category index
 *   • src/app/effects/[id]/page.tsx     — per-effect detail page (ISR)
 *   • src/app/sitemap.ts                — sitemap effect URLs
 *
 * Since the ISR switch (see getFeaturedEffectPageIds below) the page set
 * and the sitemap set are intentionally different: the sitemap lists
 * EVERY catalog id (all 1,959 URLs stay indexable), while build-time
 * pages are only the featured set. Both still derive from the single
 * `effects` catalog below, so ids can never drift between them.
 */

import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";

/**
 * Canonical production origin (issue #113 / UIX-F12): https://roycss.com,
 * matching src/app/layout.tsx metadataBase + OG url, the JSON-LD url, and
 * src/app/robots.ts — every indexing signal agrees, so canonical URLs, OG
 * URLs and sitemap URLs never disagree. (The alternate domain is
 * 301-redirected at the edge by the owner — see issue #113.) Effect pages
 * emit ABSOLUTE URLs so they are unaffected by metadataBase fallback
 * behavior on Vercel preview deployments.
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
 * Every effect id in the catalog, in catalog order — used by the SITEMAP
 * (src/app/sitemap.ts) so all 1,959 /effects/<id> URLs stay listed.
 *
 * The page set and the sitemap set are deliberately DIFFERENT now:
 *
 *   • Sitemap: every id. On-demand-ISR pages are still real, indexable
 *     URLs (rendered on first request, then cached for 24 h) — dropping
 *     them from the sitemap would be an SEO regression, so nothing
 *     changes here.
 *   • Build-time pages: only the featured set below (empty today).
 *     Enumerating all 1,959 ids here previously produced 1,959
 *     prerendered page bundles (~370 MB of .next/server/app/effects —
     * over half of the entire build output) on every deploy. That
     * enumeration was this repo's single biggest deployment-size cost.
 *
 * The historical "soft-404" reason for enumerating everything
 * (dynamicParams = false) is obsolete: it depended on the root layout
 * reading headers(), which streamed a 200 shell before notFound()
 * could throw. That header read was removed in #54 —
 * src/app/layout.tsx no longer touches dynamic APIs — and the page
 * deliberately does NOT set dynamic = "force-static" (which would
 * bake notFound() fallbacks into cached 200 responses), so unknown
 * ids keep their hard HTTP 404. Verified empirically in this repo.
 */
export function getEffectPageIds(): string[] {
  return effects.map((e) => e.id);
}

/**
 * The small build-time prerender set for /effects/[id] (ISR-on-demand).
 *
 * Returns [] today: the catalog (CSSEffect) marks no "featured" field,
 * and the homepage's 10-effect curation lives in a client component
 * (featured-effects.tsx) whose module exports are client references —
 * not importable values for server code. An empty set +
 * `dynamicParams = true` is the smallest possible deployment footprint:
 * zero prerendered effect pages; every effect page renders once on
 * first visit and is then ISR-cached for 24 h (see the [id] page's
 * comment block). If the catalog ever grows a featured marker, return
 * those ids here (cap ~12) and they will be prerendered at build time.
 */
export function getFeaturedEffectPageIds(): string[] {
  return [];
}
