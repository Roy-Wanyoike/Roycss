import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/roycss/site-header";

/**
 * /effects layout — mounts the shared compact SiteHeader (issue #191) and
 * the shared "Site footer" landmark (issue #242).
 *
 * Wraps ALL THREE /effects route types — the catalog index (/effects), the
 * detail routes (/effects/<id>) and the category landing pages
 * (/effects/category/<slug>) — without touching their page files: the
 * header + footer are the only things this layout adds, so the index
 * page's `force-static` + daily-revalidate contract (see
 * src/app/effects/page.tsx) is preserved — the layout renders no dynamic
 * APIs and the header/footer are static markup.
 *
 * Issue #216 item 10: adds a "Skip to content" link (parity with home +
 * /docs) and a focusable content target wrapping the page output.
 *
 * Issue #242: the #164 fix rendered the "Site footer" inline on the INDEX
 * page only, so every /effects/<id> and /effects/category/<slug> page had
 * NO footer (QA 7-a2 P1). The footer moved here so all three route types
 * render exactly ONE footer; effects/page.tsx no longer renders its own
 * (a double footer on /effects would be its own landmark bug).
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

      {/* Site footer (issue #164 markup, relocated by issue #242): the
          shared "Site footer" landmark, byte-identical to the one the home
          page renders inline and the one this layout used to skip. Mirrors
          the minimal footer already used by /roadmap. */}
      <footer aria-label="Site footer" className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} RoyCSS</p>
          <div className="flex items-center gap-4">
            <Link
              href="/docs/getting-started"
              className="transition-colors hover:text-primary"
            >
              Docs
            </Link>
            <Link
              href="/roadmap"
              className="transition-colors hover:text-primary"
            >
              Roadmap
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-primary"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
