import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Tag,
} from "lucide-react";
import { effects, categoryMeta } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Badge } from "@/components/ui/badge";
import {
  SITE_URL,
  EFFECT_COUNT,
  getEffect,
  getEffectPageIds,
} from "../_lib/static-effects";

/* ═══════════════════════════════════════════════════════════════
   Route segment config (issue #67 — per-effect pages for SEO)

   • dynamic = "force-static" — the app's root layout reads headers()
     (a leftover from the removed CSP-nonce machinery — the header it
     reads, x-nonce, no longer exists), which forces EVERY route to
     dynamic streaming app-wide. force-static opts these pages back
     into build-time prerendering (headers() returns empty values,
     which is exactly the dead code's runtime behavior). Static HTML
     is the best-case outcome for the SEO/shareability goal of #67.
   • dynamicParams = false — unknown ids are rejected at the ROUTER
     level with a hard 404. This matters: with dynamicParams = true,
     on-demand renders stream the shell as HTTP 200 before notFound()
     can throw, producing soft-404s (verified empirically in this
     repo). Router-level rejection was verified to return 404.
   • revalidate = 86400 — effect CSS is immutable per id and the
     catalog only changes on deploy (which rebuilds anyway); a daily
     revalidation window is plenty.
   ═══════════════════════════════════════════════════════════════ */
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

/**
 * Enumerate ALL 1,959 effect ids — with dynamicParams = false only
 * enumerated ids are reachable, and the issue demands a page for every
 * effect. MEASURED build cost: ~3s per 256 pages → ~25s for the whole
 * catalog (total build ≈ 1.5 min on this 1-worker setup, far under the
 * 4-minute budget). See _lib/static-effects.ts for the full rationale.
 */
export function generateStaticParams(): { id: string }[] {
  return getEffectPageIds().map((id) => ({ id }));
}

/* ── Metadata ──────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const effect = getEffect(id);
  // Safety net: with dynamicParams = false unknown ids never reach the
  // page (router-level 404), but notFound() here keeps the guard correct
  // if segment config ever changes.
  if (!effect) notFound();

  const url = `${SITE_URL}/effects/${effect.id}`;
  const title = `${effect.name} — RoyCSS CSS Effect`;
  const description = `${effect.description} Pure CSS, zero JavaScript. See the live preview and copy the code on RoyCSS.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [...effect.tags, effect.name, "CSS", "RoyCSS"],
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: "RoyCSS",
      images: [
        {
          // The existing OG image route (static 1200×630 PNG).
          url: `${SITE_URL}/api/og`,
          width: 1200,
          height: 630,
          alt: `${effect.name} — RoyCSS CSS effect`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/api/og`],
    },
  };
}

/* ── JSON-LD ───────────────────────────────────────────────── */

/**
 * Structured data: SoftwareSourceCode (the effect's CSS, machine-
 * readable) + BreadcrumbList for rich results.
 *
 * `replace(/</g, "\\u003c")` keeps the JSON safe inside a <script> tag
 * even if a cssCode/description ever contained `</script>` (none do
 * today — verified over the whole catalog — this is belt-and-braces).
 */
function buildJsonLd(effect: CSSEffect): string {
  const url = `${SITE_URL}/effects/${effect.id}`;
  const graph = [
    {
      "@type": "SoftwareSourceCode",
      name: effect.name,
      description: effect.description,
      url,
      codeRepository: "https://github.com/Roy-Wanyoike/Roycss",
      programmingLanguage: "CSS",
      keywords: effect.tags.join(", "),
      text: effect.cssCode,
      isPartOf: {
        "@type": "WebSite",
        name: "RoyCSS",
        url: SITE_URL,
      },
      author: { "@type": "Person", name: "Royford Wanyoike Wamaitha" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "RoyCSS", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Effects",
          item: `${SITE_URL}/effects`,
        },
        { "@type": "ListItem", position: 3, name: effect.name, item: url },
      ],
    },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
    /</g,
    "\\u003c"
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function EffectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const effect = getEffect(id);
  if (!effect) notFound();

  // Prev/next in catalog order (circular so every page has both links).
  const idx = effects.indexOf(effect);
  const prev = effects[(idx - 1 + effects.length) % effects.length];
  const next = effects[(idx + 1) % effects.length];

  const category = categoryMeta[effect.category];
  const jsonLd = buildJsonLd(effect);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/*
        The effect's own CSS, server-rendered so the LivePreview below
        works on this page without the homepage's DynamicEffectCSS
        injector (which only exists on /). Self-contained: keyframes and
        custom properties are part of every cssCode (verified catalog-
        wide). Inline <style> is allowed by the static-safe CSP
        (style-src 'self' 'unsafe-inline').
      */}
      <style
        dangerouslySetInnerHTML={{ __html: effect.cssCode }}
        data-roycss-effect-css={effect.id}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                RoyCSS
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              <ChevronRight className="size-3" />
            </li>
            <li>
              <Link
                href="/effects"
                className="hover:text-foreground transition-colors"
              >
                Effects
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              <ChevronRight className="size-3" />
            </li>
            <li
              aria-current="page"
              className="text-foreground font-medium truncate"
            >
              {effect.name}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
              {effect.name}
            </h1>
            <Link
              href="/#effects"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title={`Browse ${category.label} in the effects explorer`}
            >
              {category.label}
            </Link>
          </div>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {effect.description}
          </p>
        </header>

        {/* Live preview */}
        <section className="mt-8" aria-labelledby="preview-heading">
          <h2
            id="preview-heading"
            className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Live preview
          </h2>
          <div className="mt-2 rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20">
            <div className="h-64 sm:h-80">
              <LivePreview effect={effect} />
            </div>
          </div>
        </section>

        {/* Usage */}
        <section className="mt-6" aria-labelledby="usage-heading">
          <h2
            id="usage-heading"
            className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Usage
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Pure CSS — no JavaScript. Add the class to any element:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              &lt;div class="roycss-{effect.id}"&gt;
            </code>
            . Copy the full source below and paste it into your stylesheet.
          </p>
        </section>

        {/* Code (copy button included) */}
        <section className="mt-2" aria-label="CSS source code">
          <CodeBlock
            code={effect.cssCode}
            language="css"
            filename={`${effect.id}.css`}
          />
        </section>

        {/* Tags */}
        <section className="mt-6" aria-labelledby="tags-heading">
          <h2
            id="tags-heading"
            className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Tags
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {effect.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-muted/80 text-muted-foreground"
              >
                <Tag className="size-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {/* Prev / next navigation (catalog order) */}
        <nav
          aria-label="Effect navigation"
          className="mt-10 grid gap-3 sm:grid-cols-2"
        >
          <Link
            href={`/effects/${prev.id}`}
            rel="prev"
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
          >
            <ArrowLeft className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">
                Previous effect
              </span>
              <span className="block truncate text-sm font-medium text-foreground">
                {prev.name}
              </span>
            </span>
          </Link>
          <Link
            href={`/effects/${next.id}`}
            rel="next"
            className="group flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 text-right hover:border-primary/40 transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">
                Next effect
              </span>
              <span className="block truncate text-sm font-medium text-foreground">
                {next.name}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </nav>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <Link
            href="/effects"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ArrowLeft className="size-4" />
            All effect categories
          </Link>
          <Link
            href="/#effects"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Browse all {EFFECT_COUNT.toLocaleString("en-US")} effects
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
