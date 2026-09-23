import Link from "next/link";
import { Home, Search, Sparkles, Box, Zap, BookOpen } from "lucide-react";
import { EFFECT_COUNT_FORMATTED, PRODUCT_COUNT } from "@/lib/site-stats";
import { explorerHref } from "@/lib/search-targets";

/**
 * Issue #165: the 404 surface must not inherit the generic home
 * <title>. Next.js 16 supports `metadata` on `not-found.tsx`, which
 * overrides the root layout title for this boundary (matches the
 * `export const metadata` convention used by every page).
 */
export const metadata = { title: "Page not found — RoyCSS" };

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col bg-background px-4 pt-16 pb-8">
      <div className="max-w-lg w-full mx-auto text-center space-y-8 my-auto">
        {/* 404 big number with glow */}
        <div className="relative inline-block">
          <div className="font-display text-8xl sm:text-9xl font-bold text-primary" style={{ textShadow: "0 0 40px rgba(16, 185, 129, 0.3)" }}>
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-32 sm:size-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>

        {/* Heading + description */}
        <div className="space-y-3">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist. Browse the
            full effect catalog, dig into the docs, or head back to
            the homepage below.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer h-11"
          >
            <Home className="size-4" />
            Back to RoyCSS
          </Link>
          <Link
            href="/effects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer h-11"
          >
            <Search className="size-4" />
            Browse Effects
          </Link>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer h-11"
          >
            <BookOpen className="size-4" />
            Search the Docs
          </Link>
        </div>

        {/* Popular sections */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Popular Sections
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href={explorerHref()}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Sparkles className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{EFFECT_COUNT_FORMATTED} Effects</span>
            </Link>
            <Link
              href="/#platform"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Box className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{PRODUCT_COUNT} Products</span>
            </Link>
            <Link
              href="/#get-started"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Zap className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">Get Started</span>
            </Link>
            <Link
              href="/#docs"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <BookOpen className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">Docs</span>
            </Link>
            <Link
              href="/#webgl-effects"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Sparkles className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">WebGL Effects</span>
            </Link>
            <Link
              href="/#faq"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Search className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">FAQ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Issue #216 item 2: contentinfo parity — the 404 surface previously
          had no footer at all (browser-QA P2). Compact footer: the full home
          footer lives in roycss-page.tsx; 404 gets nav + legal essentials. */}
      <footer aria-label="Site footer" className="mt-auto border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto w-full px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RoyCSS — MIT License
          </p>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link href="/effects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Effects
            </Link>
            <Link href="/docs/getting-started" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/security/hall-of-fame" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Security
            </Link>
            <a
              href="https://github.com/Roy-Wanyoike/roycss"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
