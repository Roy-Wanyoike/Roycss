import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getEffect,
  getEffectPageIds,
  getFeaturedEffectPageIds,
} from "@/app/effects/_lib/static-effects";

const ROOT = join(__dirname, "..", "..");
const PAGE_SRC = join(ROOT, "src/app/effects/[id]/page.tsx");
const LIB_SRC = join(ROOT, "src/app/effects/_lib/static-effects.ts");
const SITEMAP_SRC = join(ROOT, "src/app/sitemap.ts");

/**
 * ISR-on-demand contract for /effects/[id] (deployment-size fix).
 *
 * The page used to enumerate ALL 1,959 ids at build time
 * (dynamicParams = false + full generateStaticParams), emitting
 * ~370 MB of prerendered page bundles into every deployment. It now
 * renders effect pages on demand (dynamicParams = true, featured-only
 * build set, revalidate = 86400) while preserving:
 *   • the 404 guarantee — unknown ids hit an explicit notFound() miss
 *     path in BOTH generateMetadata and the page component,
 *   • the sitemap contract — all 1,959 ids stay listed (ISR pages are
 *     real, indexable URLs),
 *   • catalog-only resolution (bundled batches, no fs at request time).
 */
describe("effects/[id] ISR segment config", () => {
  const src = readFileSync(PAGE_SRC, "utf8");

  it("opts into on-demand rendering: dynamicParams = true", () => {
    expect(src).toContain("export const dynamicParams = true;");
    expect(src).not.toContain("export const dynamicParams = false;");
  });

  it("keeps revalidate = 86400 exactly as before", () => {
    expect(src).toContain("export const revalidate = 86400;");
  });

  it("does NOT set dynamic = \"force-static\" (it bakes notFound() into cached 200s)", () => {
    // Verified empirically: with force-static + dynamicParams = true an
    // unknown id renders the not-found page body with status 200 (a
    // cached soft-404). The default 'auto' mode keeps ISR caching while
    // letting notFound() set the real 404 status.
    expect(src).not.toContain('export const dynamic = "force-static";');
  });

  it("prerenders only the featured set at build time", () => {
    expect(src).toContain(
      "return getFeaturedEffectPageIds().map((id) => ({ id }));",
    );
    expect(src).not.toContain("getEffectPageIds().map");
  });

  it("404 contract: explicit notFound() miss paths in generateMetadata AND the page", () => {
    // Two guards: the metadata resolver and the page component.
    expect(src.match(/if \(!effect\) notFound\(\);/g)?.length).toBe(2);
    // The page must keep resolving ids from the bundled catalog.
    expect(src).toContain("const effect = getEffect(id);");
    // No request-time filesystem: the page only touches the catalog.
    expect(src).not.toMatch(/from "node:fs"/);
  });
});

describe("static-effects — page set vs sitemap set", () => {
  it("featured build set is empty and small-capped (≤ 12)", () => {
    const featured = getFeaturedEffectPageIds();
    expect(featured).toEqual([]);
    expect(featured.length).toBeLessThanOrEqual(12);
  });

  it("every featured id still resolves in the catalog (no drift)", () => {
    for (const id of getFeaturedEffectPageIds()) {
      expect(getEffect(id)).toBeDefined();
    }
  });

  it("sitemap set still enumerates the entire catalog (1,973 URLs)", () => {
    expect(getEffectPageIds().length).toBe(1973);
  });

  it("sitemap keeps deriving effect URLs from getEffectPageIds", () => {
    const sitemap = readFileSync(SITEMAP_SRC, "utf8");
    expect(sitemap).toContain("getEffectPageIds()");
    // ISR must not have shrunk the sitemap.
    expect(sitemap).toContain("for (const id of getEffectPageIds())");
  });

  it("lib documents the ISR rationale (obsoleted soft-404 note)", () => {
    const lib = readFileSync(LIB_SRC, "utf8");
    expect(lib).toContain("getFeaturedEffectPageIds");
    // The old "must enumerate everything" contract is gone.
    expect(lib).not.toContain("WHY ALL 1,959");
  });
});
