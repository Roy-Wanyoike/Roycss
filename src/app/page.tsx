import type { Metadata } from "next";
import RoyCSSPage from "@/components/roycss/roycss-page";
import { faqPageJsonLd } from "@/lib/faq-data";

/**
 * Home self-canonical (issue #206). Home is the only URL with
 * parameterized variants (`/?category=x#effects` explorer deep-links),
 * so it must declare itself the canonical of its own parameter noise.
 *
 * Deliberately PAGE-level, never root layout: a root-level
 * `alternates.canonical: "/"` was inherited by ~40 pages and folded
 * them into the homepage (issue #187) — each page declares its own.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/**
 * Home page — emits the FAQPage JSON-LD server-side (issue #188 item 5)
 * before the client-rendered RoyCSSPage tree. The Q&A source of truth is
 * src/lib/faq-data.ts, the SAME module the rendered FAQ section consumes,
 * so the structured data matches the visible content exactly.
 */
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd()) }}
      />
      <RoyCSSPage />
    </>
  );
}
