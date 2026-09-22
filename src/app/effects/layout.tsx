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
 */
export default function EffectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
