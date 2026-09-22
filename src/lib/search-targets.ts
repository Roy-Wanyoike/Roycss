import { categoryMeta, categoryOrder, type EffectCategory } from "./roycss-types";

/**
 * Search & navigation target builders — issue #161.
 *
 * Two navigation defects are fixed by routing ALL cross-page links through
 * the helpers in this module instead of hand-written hrefs:
 *
 * 1. Explorer dead-end (issue #161 part 1): the /effects catalog, effect
 *    detail pages and the 404 recovery page pointed at "/#effects". The
 *    home page's #effects section hosts the interactive explorer
 *    (CategoryExplorer + category pills + filtered grid), but arriving via
 *    a bare anchor gave no category context. `explorerHref()` builds the
 *    deep-link form `/?category=<slug>#effects`, and
 *    `parseExplorerCategory()` is the mirror-image reader used by the home
 *    page (roycss-page.tsx) to pre-select the category pill and scroll to
 *    the explorer. Both the query form and the `#effects?category=<slug>`
 *    hash form are accepted.
 *
 * 2. ⌘K result targets (issue #161 part 2): effect results in the search
 *    overlay were the only non-navigating kind (a home-state modal trigger
 *    interleaved among real docs <Link>s). `effectDetailHref()` maps every
 *    effect result to its real /effects/<id> detail page (title matches the
 *    clicked result), matching how effect URLs are built everywhere else
 *    (src/app/effects/[id]/page.tsx, sitemap.ts).
 */

/** URL of the interactive explorer hosted by the home page's #effects section. */
export function explorerHref(category?: EffectCategory | null): string {
  if (!category) return "/#effects";
  return `/?category=${encodeURIComponent(category)}#effects`;
}

/** URL of an effect's detail page (the same shape as src/app/effects/[id]). */
export function effectDetailHref(effectId: string): string {
  return `/effects/${encodeURIComponent(effectId)}`;
}

/**
 * Read the explorer category from a URL, mirroring `explorerHref()`.
 *
 * Accepted forms (search param wins when both are present):
 *   /?category=<slug|#Label>#effects      — canonical (what explorerHref emits)
 *   /#effects?category=<slug|#Label>      — params inside the hash
 *
 * Category matching is case-insensitive and also accepts the exact
 * categoryMeta label (e.g. "Hover", "Glass UI") so hand-written or shared
 * links still resolve. Returns null for absent/unknown categories — the
 * caller then just keeps the default "all" filter.
 */
export function parseExplorerCategory(
  search: string,
  hash: string,
): EffectCategory | null {
  const params = new URLSearchParams(search);
  const hashQuery = hash.match(/^#effects\?(.+)$/)?.[1];
  if (hashQuery) {
    for (const [key, value] of new URLSearchParams(hashQuery)) {
      if (key === "category" && !params.has("category")) {
        params.set(key, value);
      }
    }
  }

  const raw = params.get("category");
  if (!raw) return null;

  const slug = raw.toLowerCase();
  if ((categoryOrder as readonly string[]).includes(slug)) {
    return slug as EffectCategory;
  }
  // Best-effort label form ("Hover", "Glass UI", ...).
  const byLabel = categoryOrder.find(
    (cat) => categoryMeta[cat].label.toLowerCase() === slug,
  );
  return byLabel ?? null;
}
