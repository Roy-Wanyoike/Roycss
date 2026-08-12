import type { MetadataRoute } from "next";

/**
 * Next.js metadata route — generates /robots.txt
 * Uses the canonical domain for the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://roycss.com/sitemap.xml",
  };
}
