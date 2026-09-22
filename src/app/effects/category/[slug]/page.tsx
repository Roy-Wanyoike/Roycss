import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { effects, categoryMeta, categoryOrder } from "@/lib/roycss-effects";
import type { CSSEffect, EffectCategory } from "@/lib/roycss-types";
import { categoryHref, explorerHref } from "@/lib/search-targets";
import {
  categoryPageTitle,
  categoryPageDescription,
  categoryPageKeywords,
  categoryLabel,
  CATEGORY_OG_IMAGE,
} from "@/lib/category-seo";
import { Badge } from "@/components/ui/badge";
import { SITE_URL } from "../../_lib/static-effects";

/**
 * Category landing page (issue #198) — /effects/category/<slug>.
 *
 * One indexable ISR document per catalog category (29): keyword-rich
 * titles ("CSS Hover Effects — 120 Copy-Paste Examples | RoyCSS"),
 * self-canonical, BreadcrumbList + ItemList JSON-LD, and a server-rendered
 * grid of every effect in the category. This is the crawlable link target
 * the /effects index headers and the effect-page category badges point at;
 * the interactive explorer stays a home-page UI state (/?category=x#effects).
 *
 * Route segment config mirrors src/app/effects/page.tsx (the root layout's
 * dead headers() read forces dynamic streaming app-wide; force-static opts
 * this deterministic catalog page back into build-time prerendering).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

/** Group the catalog by category once (catalog order preserved). */
const byCategory = new Map<EffectCategory, CSSEffect[]>();
for (const effect of effects) {
  const list = byCategory.get(effect.category);
  if (list) list.push(effect);
  else byCategory.set(effect.category, [effect]);
}

export function generateStaticParams(): { slug: string }[] {
  return categoryOrder.map((category) => ({ slug: category }));
}

/**
 * Resolve a slug to a category, or null for the not-found contract:
 * unknown slugs hard-404 exactly like /effects/<id> (documented there) —
 * no soft-200 shells for crawlers.
 */
function resolveCategory(slug: string): EffectCategory | null {
  return (categoryOrder as string[]).includes(slug)
    ? (slug as EffectCategory)
    : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = resolveCategory(slug);
  // Unknown slug → the page call notFound(); emit nothing indexable here.
  if (!category) return {};
  const count = byCategory.get(category)?.length ?? 0;
  const title = categoryPageTitle(category, count);
  const description = categoryPageDescription(category, count);

  return {
    title,
    description,
    keywords: categoryPageKeywords(category, count),
    alternates: { canonical: `${SITE_URL}/effects/category/${category}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/effects/category/${category}`,
      siteName: "RoyCSS",
      images: [
        {
          url: `${SITE_URL}${CATEGORY_OG_IMAGE}`,
          width: 1200,
          height: 630,
          alt: `${categoryLabel(category)} — RoyCSS`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}${CATEGORY_OG_IMAGE}`],
    },
  };
}

/**
 * Category accent classes — direct Tailwind palette pairs (same
 * bg-*-500/10 + text-*-700 dark:text-*-300 pattern the codebase already
 * uses for status/category pills). 29 categories share 12 hues via
 * index-driven rotation, so neighboring categories stay visually distinct.
 */
const CATEGORY_ACCENTS: Record<string, { bar: string; pill: string; glow: string }> = {
  emerald: {
    bar: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(16,185,129,0.35)]",
  },
  amber: {
    bar: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(245,158,11,0.35)]",
  },
  rose: {
    bar: "bg-rose-500",
    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(244,63,94,0.35)]",
  },
  violet: {
    bar: "bg-violet-500",
    pill: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(139,92,246,0.35)]",
  },
  sky: {
    bar: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(14,165,233,0.35)]",
  },
  teal: {
    bar: "bg-teal-500",
    pill: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(20,184,166,0.35)]",
  },
  orange: {
    bar: "bg-orange-500",
    pill: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(249,115,22,0.35)]",
  },
  fuchsia: {
    bar: "bg-fuchsia-500",
    pill: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(217,70,239,0.35)]",
  },
  lime: {
    bar: "bg-lime-500",
    pill: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(132,204,22,0.35)]",
  },
  cyan: {
    bar: "bg-cyan-500",
    pill: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(6,182,212,0.35)]",
  },
  red: {
    bar: "bg-red-500",
    pill: "bg-red-500/10 text-red-700 dark:text-red-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(239,68,68,0.35)]",
  },
  indigo: {
    bar: "bg-indigo-500",
    pill: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    glow: "shadow-[0_8px_30px_-12px_rgba(99,102,241,0.35)]",
  },
};

/** Deterministic hue rotation — index-driven so reordering stays stable. */
const ACCENT_HUES = Object.keys(CATEGORY_ACCENTS);
function accentFor(category: EffectCategory) {
  return CATEGORY_ACCENTS[ACCENT_HUES[categoryOrder.indexOf(category) % ACCENT_HUES.length]];
}

export default async function CategoryLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = resolveCategory(slug);
  if (!category) notFound();

  const meta = categoryMeta[category];
  const list = byCategory.get(category) ?? [];
  const count = list.length;
  const accent = accentFor(category);
  const orderIndex = categoryOrder.indexOf(category);
  const prevCategory = orderIndex > 0 ? categoryOrder[orderIndex - 1] : null;
  const nextCategory =
    orderIndex < categoryOrder.length - 1 ? categoryOrder[orderIndex + 1] : null;
  // Sibling categories: neighbors in categoryOrder (±2 around prev/next),
  // compact cross-links for the crawl graph.
  const siblings = categoryOrder.filter(
    (c) =>
      c !== category &&
      c !== prevCategory &&
      c !== nextCategory &&
      Math.abs(categoryOrder.indexOf(c) - orderIndex) <= 3,
  );

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "RoyCSS",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "CSS Effects Library",
        item: `${SITE_URL}/effects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: meta.label,
        item: `${SITE_URL}/effects/category/${category}`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `CSS ${meta.label} — RoyCSS`,
    numberOfItems: count,
    itemListElement: list.map((effect, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: effect.name,
      url: `${SITE_URL}/effects/${effect.id}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                RoyCSS
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/effects"
                className="hover:text-foreground transition-colors"
              >
                Effects
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              {meta.label}
            </li>
          </ol>
        </nav>

        {/* Hero — accent bar + label pill + count, token-consistent */}
        <header className="mt-6">
          <div
            className={`rounded-2xl border border-border bg-card p-5 sm:p-6 ${accent.glow}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-8 w-1.5 rounded-full ${accent.bar}`}
              />
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${accent.pill}`}
              >
                Category
              </span>
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-muted/80 text-muted-foreground"
              >
                {count.toLocaleString("en-US")}{" "}
                {count === 1 ? "effect" : "effects"}
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-2xl sm:text-4xl font-bold tracking-tight">
              CSS {meta.label}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              {meta.description}. Every effect below is pure CSS — zero
              JavaScript runtime — with its own page featuring a live preview,
              copy-paste source, and framework usage for React, Vue, Angular,
              Svelte, and Next.js.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={explorerHref(category)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Compass className="size-3.5" aria-hidden="true" />
                Open in explorer
              </Link>
              <span className="text-xs text-muted-foreground">
                or press{" "}
                <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  ⌘K
                </kbd>{" "}
                anywhere to search all 1,973 effects
              </span>
            </div>
          </div>
        </header>

        {/* Effect grid — full category, server-rendered (crawlable) */}
        <section aria-labelledby="effects-in-category" className="mt-8">
          <h2
            id="effects-in-category"
            className="font-display text-lg font-semibold text-foreground"
          >
            All CSS {meta.label.toLowerCase()}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {count.toLocaleString("en-US")} effects — click any card for its
            live demo and source.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {list.map((effect) => (
              <li key={effect.id}>
                <Link
                  href={`/effects/${effect.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {effect.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Prev / next category navigation */}
        <nav
          aria-label="Category navigation"
          className="mt-10 grid gap-3 sm:grid-cols-2"
        >
          {prevCategory ? (
            <Link
              href={categoryHref(prevCategory)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <ChevronLeft
                className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  Previous category
                </span>
                <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {categoryMeta[prevCategory].label}
                </span>
              </span>
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {nextCategory && (
            <Link
              href={categoryHref(nextCategory)}
              className="group flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 text-right hover:border-primary/40 transition-colors sm:col-start-2"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  Next category
                </span>
                <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {categoryMeta[nextCategory].label}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                aria-hidden="true"
              />
            </Link>
          )}
        </nav>

        {/* Sibling categories — crawl-graph cross-links */}
        {siblings.length > 0 && (
          <section aria-labelledby="related-categories" className="mt-8">
            <h2
              id="related-categories"
              className="text-sm font-semibold text-foreground"
            >
              Related categories
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {siblings.map((c) => (
                <li key={c}>
                  <Link
                    href={categoryHref(c)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {categoryMeta[c].label}
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
