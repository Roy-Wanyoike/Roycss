import type { MetadataRoute } from "next";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL, getEffectPageIds } from "./effects/_lib/static-effects";
import { categoryOrder } from "@/lib/roycss-effects";

/**
 * Sitemap — homepage, /effects index, 29 category landing pages (issue
 * #198), one URL per effect page, every /docs route, and the standalone
 * info pages (/roadmap, /privacy, /terms — issue #188 item 1).
 *
 * /effects/<id> pages enumerate the entire catalog (1,973 routes,
 * statically prerendered — see src/app/effects/_lib/static-effects.ts),
 * and the /docs tree is walked at build time so new docs pages are
 * picked up automatically. Total URL count (~2,029) is far below the
 * 50k-per-sitemap limit — no chunking needed.
 *
 * lastModified is a MODULE-LEVEL deploy-date constant (issue #188 item 1):
 * `new Date()` per build made every URL's lastmod non-deterministic and
 * meaningless (Google re-crawls on lastmod churn). Bump the constant when
 * content actually changes.
 */
const LAST_MODIFIED = new Date("2026-09-22T00:00:00.000Z");

function listDocsRoutes(dir: string, base = "/docs"): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // docs dir absent (e.g. trimmed CI checkout) — skip
  }
  for (const entry of entries) {
    if (entry.startsWith("_")) continue; // _lib co-located helpers
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listDocsRoutes(full, `${base}/${entry}`));
    } else if (entry === "page.tsx") {
      out.push(base);
    }
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const docsRoutes = listDocsRoutes(join(process.cwd(), "src", "app", "docs"));

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/effects`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Category landing pages (issue #198) — one indexable document per
    // catalog category (29), the long-tail query targets.
    ...categoryOrder.map((category) => ({
      url: `${SITE_URL}/effects/category/${category}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    // Standalone info pages (issue #188 item 1) — previously missing.
    {
      url: `${SITE_URL}/roadmap`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  for (const id of getEffectPageIds()) {
    entries.push({
      url: `${SITE_URL}/effects/${id}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const route of docsRoutes) {
    // /docs itself 308s to /docs/getting-started (next.config redirects,
    // issue #187) — redirecting URLs don't belong in a sitemap.
    if (route === "/docs") continue;
    entries.push({
      url: `${SITE_URL}${route}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
