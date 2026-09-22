import type { Metadata } from "next";

/**
 * Per-page metadata composer — issue #187.
 *
 * The root layout deliberately does NOT set `alternates.canonical` (that
 * default made every non-overriding page — all 37 docs pages, /roadmap,
 * /privacy, /terms — emit `canonical: https://roycss.com`, folding ~40
 * content pages into the homepage for Google). Pages that want a correct
 * self-canonical call this helper instead.
 *
 * All relative URLs (canonical path, OG url, OG image) resolve against the
 * root layout's `metadataBase` (https://roycss.com), so a single origin
 * stays in control of every absolute URL Next emits (issue #113 contract,
 * pinned by tests/unit/origin-unified.test.ts).
 */

const SITE_NAME = "RoyCSS";

/** Default social card — the satori OG endpoint (image/png 1200×630). */
const DEFAULT_OG_IMAGE = "/api/og";

export type PageMetaInput = {
  /** Page title — rendered as-is (no layout template exists; every page owns its full title). */
  title: string;
  /** Meta description (also reused for OG + Twitter). */
  description: string;
  /** Canonical path, e.g. "/roadmap" or "/docs/getting-started/cli". */
  path: string;
  /** Optional social-card image path/URL; defaults to the /api/og endpoint. */
  ogImage?: string;
};

/**
 * Compose title/description + self-canonical + OpenGraph + Twitter card
 * metadata for a page. `alternates.canonical` is the relative `path`,
 * which Next resolves against metadataBase → an absolute self-canonical.
 */
export function pageMeta({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
}: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
