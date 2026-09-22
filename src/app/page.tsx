import RoyCSSPage from "@/components/roycss/roycss-page";
import { faqPageJsonLd } from "@/lib/faq-data";

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
