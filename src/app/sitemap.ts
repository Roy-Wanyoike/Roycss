import type { MetadataRoute } from "next";
import { SITE_URL, getEffectPageIds } from "./effects/_lib/static-effects";

/**
 * Sitemap — homepage, /effects index, and one URL per effect page.
 *
 * /effects/<id> pages enumerate the entire catalog (1,959 routes,
 * statically prerendered — see src/app/effects/_lib/static-effects.ts),
 * so every effect page is listed. Total URL count (~1,961) is far
 * below the 50k-per-sitemap limit — no chunking needed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/effects`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const id of getEffectPageIds()) {
    entries.push({
      url: `${SITE_URL}/effects/${id}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
