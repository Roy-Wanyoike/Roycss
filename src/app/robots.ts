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
 *
 * Issue #206: AI-crawler policy. RoyCSS is an AI-native library — its
 * docs, catalog and dist artifacts exist to be read by coding agents —
 * so the AI crawlers (GPTBot, ClaudeBot, CCBot, PerplexityBot) are
 * explicitly ALLOWED instead of left to default-deny policies. They
 * get the same disallow set as human crawlers (the private JSON API
 * surface and token pages); /llms.txt is the machine-readable entry
 * point that tells them where the good stuff lives.
 */
const HUMAN_RULES = {
  userAgent: "*",
  allow: ["/", "/api/og"],
  disallow: ["/api/", "/verify-email", "/reset-password"],
};

/** AI agents are welcome — same private-surface exclusions as humans. */
const AI_CRAWLER_UAGENTS = ["GPTBot", "ClaudeBot", "CCBot", "PerplexityBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      HUMAN_RULES,
      {
        userAgent: AI_CRAWLER_UAGENTS,
        allow: ["/", "/api/og"],
        disallow: ["/api/", "/verify-email", "/reset-password"],
      },
    ],
    sitemap: "https://roycss.com/sitemap.xml",
  };
}
