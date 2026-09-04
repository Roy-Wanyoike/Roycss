import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Command, Search } from "lucide-react";
import { effects, categoryMeta, categoryOrder } from "@/lib/roycss-effects";
import type { CSSEffect, EffectCategory } from "@/lib/roycss-types";
import {
  SITE_URL,
  EFFECT_COUNT,
  INDEX_SAMPLES_PER_CATEGORY,
} from "./_lib/static-effects";
import { Badge } from "@/components/ui/badge";

/**
 * Route segment config — see src/app/effects/[id]/page.tsx for the full
 * rationale (root layout's dead headers() read forces dynamic streaming
 * app-wide; force-static opts this deterministic catalog page back into
 * build-time prerendering). The page is pure catalog data → static HTML
 * + daily revalidation is the ideal serving mode for SEO.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "CSS Effects Library — Browse RoyCSS Effects by Category",
  description: `Browse all ${EFFECT_COUNT.toLocaleString("en-US")} RoyCSS CSS effects across ${categoryOrder.length} categories — animations, hover, text, backgrounds, loaders, glassmorphism, and more. Live previews with copyable CSS on every effect page.`,
  alternates: { canonical: `${SITE_URL}/effects` },
  keywords: [
    "CSS effects",
    "CSS animations",
    "CSS library",
    "RoyCSS effects",
    "hover effects",
    "CSS loaders",
    "glassmorphism CSS",
  ],
  openGraph: {
    title: "CSS Effects Library — RoyCSS",
    description: `All ${EFFECT_COUNT.toLocaleString("en-US")} RoyCSS CSS effects by category, each with a live preview and copyable CSS.`,
    type: "website",
    url: `${SITE_URL}/effects`,
    siteName: "RoyCSS",
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "RoyCSS — CSS Effects Library",
        type: "image/png",
      },
    ],
  },
};

/** Group the catalog by category once (catalog order preserved). */
const byCategory = new Map<EffectCategory, CSSEffect[]>();
for (const effect of effects) {
  const list = byCategory.get(effect.category);
  if (list) list.push(effect);
  else byCategory.set(effect.category, [effect]);
}

export default function EffectsIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                RoyCSS
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              Effects
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mt-6">
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
            CSS Effects Library
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            All {EFFECT_COUNT.toLocaleString("en-US")} RoyCSS effects across{" "}
            {categoryOrder.length} categories — pure CSS, zero JavaScript
            runtime. Every effect has its own page with a live preview and
            copyable source.
          </p>
        </header>

        {/* Search hint */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Search className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground flex-1 min-w-[16rem]">
            Looking for something specific? Open the full effects explorer and
            press{" "}
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              <Command className="size-3" aria-hidden="true" />K
            </kbd>{" "}
            to search the whole catalog.
          </p>
          <Link
            href="/#effects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            Open explorer
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Category sections */}
        <div className="mt-10 space-y-8">
          {categoryOrder.map((category) => {
            const meta = categoryMeta[category];
            const list = byCategory.get(category) ?? [];
            const samples = list.slice(0, INDEX_SAMPLES_PER_CATEGORY);

            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id={`cat-${category}`}
                    className="font-display text-lg font-semibold text-foreground"
                  >
                    {meta.label}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 bg-muted/80 text-muted-foreground"
                  >
                    {list.length}{" "}
                    {list.length === 1 ? "effect" : "effects"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {meta.description}
                </p>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {samples.map((effect) => (
                    <li key={effect.id}>
                      <Link
                        href={`/effects/${effect.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {effect.name}
                      </Link>
                    </li>
                  ))}
                  {list.length > samples.length && (
                    <li aria-hidden="true">
                      <span className="inline-flex items-center rounded-full px-2 py-1.5 text-xs text-muted-foreground">
                        +{list.length - samples.length} more
                      </span>
                    </li>
                  )}
                </ul>

                <Link
                  href="/#effects"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Browse all {meta.label.toLowerCase()} in the explorer
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </section>
            );
          })}
        </div>

        {/* Footer link */}
        <div className="mt-12 pt-6 border-t border-border/60">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
            Back to RoyCSS
          </Link>
        </div>
      </div>
    </div>
  );
}
