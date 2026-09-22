import type { MetadataRoute } from "next";

/**
 * Next.js metadata route — generates /robots.txt.
 * Uses the canonical domain for the sitemap.
 *
 * Issue #188 item 2: crawl budget + noindex hygiene — the JSON API
 * surface has no search value (and the OG endpoint must stay crawlable
 * for social previews), and /verify-email + /reset-password are token
 * pages that are already noindex'd at the metadata layer.
 *
 * Allow/Disallow precedence: crawlers (Google et al.) match the MOST
 * SPECIFIC (longest) path, so `/api/og` wins over the `/api/` prefix.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/og"],
      disallow: ["/api/", "/verify-email", "/reset-password"],
    },
    sitemap: "https://roycss.com/sitemap.xml",
  };
}
