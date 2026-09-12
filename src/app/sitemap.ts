import type { MetadataRoute } from "next";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL, getEffectPageIds } from "./effects/_lib/static-effects";

/**
 * Sitemap — homepage, /effects index, one URL per effect page, and
 * every /docs route.
 *
 * /effects/<id> pages enumerate the entire catalog (1,959 routes,
 * statically prerendered — see src/app/effects/_lib/static-effects.ts),
 * and the /docs tree is walked at build time so new docs pages are
 * picked up automatically. Total URL count (~2,000) is far below the
 * 50k-per-sitemap limit — no chunking needed.
 */
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
  const lastModified = new Date();
  const docsRoutes = listDocsRoutes(join(process.cwd(), "src", "app", "docs"));

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

  for (const route of docsRoutes) {
    entries.push({
      url: `${SITE_URL}${route}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
