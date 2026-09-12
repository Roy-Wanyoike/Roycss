import Link from "next/link";
import type { ReactNode } from "react";

/**
 * AuthActionShell — shared chrome for the standalone account-action
 * pages (`/reset-password`, `/verify-email`): the landing targets of
 * emailed links. Follows the legal-page shell conventions (sticky
 * header with the RoyCSS mark, one centered prose column, minimal
 * footer) so the pages read as part of the site while staying fully
 * self-contained — a user arriving from an email has no session yet.
 *
 * Pure presentational server component (zero client JS of its own).
 */
export function AuthActionShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header — mirrors the legal-page shell */}
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
            aria-label="Account pages"
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

      {/* Centered column */}
      <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {lead}
        </p>
        <div className="mt-8">{children}</div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RoyCSS</p>
          <Link href="/" className="transition-colors hover:text-primary">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
