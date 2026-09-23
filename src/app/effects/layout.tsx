import type { ReactNode } from "react";
import { SiteHeader } from "@/components/roycss/site-header";

/**
 * /effects layout — mounts the shared compact SiteHeader (issue #191).
 *
 * Wraps BOTH the catalog index (/effects) and the detail routes
 * (/effects/<id>) without touching their page files: the header is the
 * only thing this layout adds, so the index page's `force-static` +
 * daily-revalidate contract (see src/app/effects/page.tsx) is preserved —
 * the layout renders no dynamic APIs and the header is a client component
 * with full SSR markup.
 *
 * Issue #216 item 10: adds a "Skip to content" link (parity with home +
 * /docs) and a focusable content target wrapping the page output.
 */
export default function EffectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#effects-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <div id="effects-content" tabIndex={-1} className="focus:outline-none">
        {children}
      </div>
    </>
  );
}
