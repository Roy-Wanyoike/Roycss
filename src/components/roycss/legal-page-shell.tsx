import Link from "next/link";
import type { ReactNode } from "react";

/**
 * LegalPageShell — shared chrome for the static legal pages
 * (`/privacy`, `/terms`).
 *
 * A pure server component (zero client JS) that follows the site's
 * standalone-page conventions:
 *   - sticky top header with the RoyCSS mark and a link home (mirrors
 *     the docs TopBar in `src/app/docs/layout.tsx`),
 *   - a single centered prose column, hand-styled with the site's
 *     design tokens (`bg-background`, `text-foreground`,
 *     `text-muted-foreground`, `text-primary`) so light/dark themes
 *     and reduced-motion preferences are inherited for free.
 *
 * Pages using this shell are prerendered at build time via
 * `export const dynamic = "force-static"` in each page file.
 */

interface LegalPageShellProps {
  /** Page H1, e.g. "Privacy Policy". */
  title: string;
  /** One-paragraph plain-language summary under the H1. */
  lead: string;
  /** Last-updated stamp, e.g. "September 12, 2026". */
  lastUpdated: string;
  /** Short label shown above the H1, e.g. "Legal". */
  eyebrow: string;
  children: ReactNode;
}

/** One numbered/legal section: an anchored H2 + body content. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h2
        id={`${id}-heading`}
        className="font-display text-xl font-semibold text-foreground"
      >
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

export function LegalPageShell({
  title,
  lead,
  lastUpdated,
  eyebrow,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header — mirrors the docs TopBar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
            aria-label="RoyCSS — back to home"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            <span className="hidden sm:inline">RoyCSS</span>
          </Link>
          <nav
            aria-label="Legal pages"
            className="flex items-center gap-4 text-xs text-muted-foreground"
          >
            <Link
              href="/privacy"
              className="transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-primary"
            >
              Terms
            </Link>
          </nav>
        </div>
      </header>

      {/* Centered prose column */}
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {lead}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-10 space-y-10 border-t border-border/60 pt-10">
          {children}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} RoyCSS</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
