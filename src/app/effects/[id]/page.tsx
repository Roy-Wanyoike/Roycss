import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Layers,
  Tag,
} from "lucide-react";
import { effects, categoryMeta } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { explorerHref, categoryHref } from "@/lib/search-targets";
import { effectPageTitle, effectPageDescription } from "@/lib/effect-page-metadata";
import { getBrowserSupport, formatBrowserSupport } from "@/lib/browser-support";
import { getRequiredMarkup, getReducedMotionNote } from "@/lib/effect-page-content";
import { getEffectA11y } from "@/lib/effect-a11y";
import { getEffectPageA11yBadges, type EffectA11yBadge } from "@/lib/effect-a11y-badges";
import { getFrameworkExamples } from "@/lib/framework-adapters";
import { COPY_FORMATS } from "@/lib/copy-formats";
import { LivePreview } from "@/components/roycss/effect-card";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { CopyFormatButton } from "@/components/roycss/copy-format-button";
import { Badge } from "@/components/ui/badge";
import {
  SITE_URL,
  EFFECT_COUNT,
  getEffect,
  getFeaturedEffectPageIds,
} from "../_lib/static-effects";

/* ═══════════════════════════════════════════════════════════════
   Route segment config — ISR-ON-DEMAND (deployment-size fix)

   • dynamicParams = true + generateStaticParams() → [] (see
     _lib/static-effects.ts): effect pages render ON DEMAND at request
     time, then are ISR-cached. This replaces the previous build-time
     enumeration of ALL 1,983 ids, which emitted 1,983 prerendered
     page bundles (~210 KB each: HTML + RSC + meta + segments ≈
     370 MB of .next/server/app/effects — over half of the entire
     build output) into every deployment. Same URLs, same canonicals,
     same revalidate semantics — only the build artifact shrinks.
   • 404 GUARANTEE (unchanged in status, changed in mechanism):
     unknown ids resolve to nothing in the bundled catalog and both
     generateMetadata and the page call notFound() → HTTP 404.
     Two preconditions make that hold, both verified empirically here:
       1. The root layout must not read dynamic APIs. The historical
          soft-404 (200 shell streamed before notFound() could throw)
          was caused by the layout's dead headers() read, removed in
          #54 — src/app/layout.tsx is static again.
       2. This route must NOT set dynamic = "force-static". With
          force-static, Next treats the request-time render as static
          generation and bakes the notFound() fallback into a CACHED
          200 RESPONSE (verified: unknown id → 200 + "Page Not Found"
          body). Without it, the default 'auto' mode keeps on-demand
          renders cacheable ISR output while letting notFound() set
          the real status: unknown id → 404.
   • revalidate = 86400 — effect CSS is immutable per id and the
     catalog only changes on deploy (which rebuilds anyway); a daily
     revalidation window is plenty. TRADE-OFF: the FIRST visit to each
     effect id pays one server render (~0.1–0.8 s measured); every
     visit for the next 24 h is a cache hit. The sitemap still lists
     all 1,983 ids, so crawlers discover and index exactly the same
     URLs as before.
   ═══════════════════════════════════════════════════════════════ */
export const dynamicParams = true;
export const revalidate = 86400;

/**
 * ISR-on-demand: prerender NOTHING at build time — the catalog marks
 * no featured set (see _lib/static-effects.ts getFeaturedEffectPageIds,
 * which documents why [] is the right value today). Every
 * /effects/<id> page renders once on first request and is then cached
 * for `revalidate` seconds. Effect ids still resolve from the bundled
 * batches (the getEffect Map) — no fs at request time.
 */
export function generateStaticParams(): { id: string }[] {
  return getFeaturedEffectPageIds().map((id) => ({ id }));
}

/* ── Metadata ──────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const effect = getEffect(id);
  // 404 guarantee (ISR): with dynamicParams = true unknown ids DO
  // reach the page — this explicit miss path is what keeps them at
  // HTTP 404. Verified empirically (the root layout no longer reads
  // headers(), and the route must not set dynamic = "force-static",
  // which would bake this fallback into a cached 200).
  if (!effect) notFound();

  const url = `${SITE_URL}/effects/${effect.id}`;
  // Issue #188 (item 4): keyword-first template + punctuation-safe
  // description join — both live in src/lib/effect-page-metadata.ts.
  const title = effectPageTitle(effect.name);
  const description = effectPageDescription(effect.description);

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [...effect.tags, effect.name, "CSS", "RoyCSS"],
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "RoyCSS",
      images: [
        {
          // Per-effect OG card (#116): /api/og renders this effect's
          // name, category badge and a demo element styled by its own
          // CSS via ImageResponse. Absolute URL via SITE_URL (same
          // origin as the canonical above).
          url: `${SITE_URL}/api/og?effect=${effect.id}`,
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
      images: [`${SITE_URL}/api/og?effect=${effect.id}`],
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

/* ── Shared section chrome ─────────────────────────────────── */

const SECTION_HEADING =
  "font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground";

/* ── A11y badge row (server-rendered; issue #190) ──────────── */

/**
 * Issue #213: light-mode text tones bumped one step so every badge
 * clears WCAG AA 4.5:1 (amber-600 was 2.88:1, emerald-600 3.25:1 on
 * their 10%-tint backgrounds; amber-700 = 4.56:1, emerald-700 = 4.76:1).
 * Dark tones keep the -400 values (9.1:1 / 10.2:1 — verified unchanged).
 */
const BADGE_TONE_CLASS: Record<EffectA11yBadge["tone"], string> = {
  // Issue #213 (extended): amber-600 measured 2.88:1 in light mode on the
  // 10%-tint pill — amber-700 = 4.56:1 (dark keeps amber-400 at 10.2:1).
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  muted: "border-border/60 bg-muted/50 text-muted-foreground",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  // Issue #213 (extended): emerald-600 measured 3.25:1 in light mode on the
  // 10%-tint pill — emerald-700 = 4.76:1 (dark keeps emerald-400 at 9.1:1).
  positive:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

function A11yRow({ effect }: { effect: CSSEffect }) {
  const badges = getEffectPageA11yBadges(effect.id);
  const motionNote = getReducedMotionNote(
    effect.cssCode,
    getEffectA11y(effect.id)?.motionSafe ?? false
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {badges.map((badge) => (
          <Badge
            key={badge.key}
            variant="outline"
            title={badge.title}
            className={`text-xs px-2 py-0.5 ${BADGE_TONE_CLASS[badge.tone]}`}
          >
            {badge.label}
          </Badge>
        ))}
      </div>
      {motionNote && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-2xl">
          {motionNote}
        </p>
      )}
    </div>
  );
}

/* ── Required markup block (server-rendered; issue #190) ───── */

function RequiredMarkupSection({
  effect,
  markup,
}: {
  effect: CSSEffect;
  markup: NonNullable<ReturnType<typeof getRequiredMarkup>>;
}) {
  return (
    <section className="mt-6" aria-labelledby="markup-heading">
      <h2 id="markup-heading" className={SECTION_HEADING}>
        Required markup
      </h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {markup.intro ??
          (markup.exact
            ? `This effect's CSS expects exactly ${markup.spanCount} child <span> element${
                markup.spanCount === 1 ? "" : "s"
              } — paste this markup inside the element that carries the roycss-${effect.id} class:`
            : `This effect's CSS styles every child <span> inside the element that carries the roycss-${effect.id} class — add one per item (e.g. per letter or dot):`)}
      </p>
      <CodeBlock
        code={markup.snippet}
        language="html"
        filename={`${effect.id}-markup.html`}
      />
    </section>
  );
}

/* ── Framework usage (server-rendered tabs; issue #190) ────── */

/**
 * Crawlable framework tabs: every framework's install/import/usage code is
 * in the server-rendered HTML (no JS needed to read or switch — plain
 * <details> panels; the exclusive-accordion `name` attribute makes them
 * behave like tabs where supported). Each panel's snippets reuse the
 * client CodeBlock (with its copy button), so all six frameworks have
 * copyable snippets without any tab state in React.
 */
function FrameworkUsageSection({ effect }: { effect: CSSEffect }) {
  const examples = getFrameworkExamples(effect.id, effect.name);

  return (
    <section className="mt-6" aria-labelledby="frameworks-heading">
      <h2 id="frameworks-heading" className={SECTION_HEADING}>
        Use in your framework
      </h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Every RoyCSS effect is plain CSS — install the package once, then use
        the{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          roycss-{effect.id}
        </code>{" "}
        class in any stack.
      </p>
      <div className="mt-3 rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
        {examples.map((example, i) => (
          <details
            key={example.id}
            name="framework-usage"
            open={i === 0}
            className="group"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 min-w-0">
                <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                {example.label}
              </span>
              <span className="hidden sm:block text-xs font-normal text-muted-foreground truncate min-w-0">
                {example.description}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <CodeBlock code={example.install} filename="Install" />
              <CodeBlock code={example.import} filename="Import" />
              <CodeBlock code={example.usage} filename="Usage" />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── Copy-as formats (server-rendered list; issue #190) ────── */

/**
 * The 7 copy-as formats from src/lib/copy-formats.ts. The list markup is
 * server-rendered (crawlable); each row's copy button is a small client
 * island sharing the dialog's formatCss logic via useCopyFormat — the
 * clipboard output is byte-identical to the home dialog's CopyAsDropdown.
 */
function CopyAsSection({ effect }: { effect: CSSEffect }) {
  return (
    <section className="mt-6" aria-labelledby="copy-as-heading">
      <h2 id="copy-as-heading" className={SECTION_HEADING}>
        Copy as
      </h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        The same effect, pre-converted to 7 formats — pick your stack:
      </p>
      <details className="group mt-3 rounded-2xl border border-border bg-card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <ClipboardCopy className="size-3.5 shrink-0 text-muted-foreground" />
            Copy as…
          </span>
          <span className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:block text-xs font-normal text-muted-foreground">
              {COPY_FORMATS.length} formats
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <ul className="divide-y divide-border/60 border-t border-border/60">
          {COPY_FORMATS.map((format) => (
            <li
              key={format.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {format.label}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {format.description}
                </span>
              </div>
              <CopyFormatButton
                css={effect.cssCode}
                effectId={effect.id}
                format={format.id}
                label={format.label}
              />
            </li>
          ))}
        </ul>
      </details>
    </section>
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
  // 404 guarantee (ISR): unknown ids reach the page under
  // dynamicParams = true — this miss path is the hard-404 contract.
  if (!effect) notFound();

  // Prev/next in catalog order (circular so every page has both links).
  const idx = effects.indexOf(effect);
  const prev = effects[(idx - 1 + effects.length) % effects.length];
  const next = effects[(idx + 1) % effects.length];

  const category = categoryMeta[effect.category];
  const jsonLd = buildJsonLd(effect);
  // Issue #190: required markup, framework tabs, copy-as formats and the
  // browser-support line — all derived server-side from the catalog data.
  const requiredMarkup = getRequiredMarkup(effect);
  const browserSupport = formatBrowserSupport(getBrowserSupport(effect.cssCode));

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
              href={categoryHref(effect.category)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title={`Browse all ${category.label.toLowerCase()} — effects landing page`}
            >
              {category.label}
            </Link>
          </div>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {effect.description}
          </p>
          {/* A11y badges + reduced-motion note (derived from the generated
              a11y tags — same source as the card pills, issue #190). */}
          <A11yRow effect={effect} />
        </header>

        {/* Live preview */}
        <section className="mt-8" aria-labelledby="preview-heading">
          <h2
            id="preview-heading"
            className={SECTION_HEADING}
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
            className={SECTION_HEADING}
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

        {/* Required markup (only when the CSS needs child elements) */}
        {requiredMarkup && (
          <RequiredMarkupSection effect={effect} markup={requiredMarkup} />
        )}

        {/* Framework usage — crawlable tabs for all 6 stacks */}
        <FrameworkUsageSection effect={effect} />

        {/* Copy as — 7 formats, server-rendered list + client copy islands */}
        <CopyAsSection effect={effect} />

        {/* Browser support one-liner (derived from the cssCode features) */}
        <section className="mt-6" aria-label="Browser support">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {browserSupport}
          </p>
        </section>

        {/* Tags */}
        <section className="mt-6" aria-labelledby="tags-heading">
          <h2
            id="tags-heading"
            className={SECTION_HEADING}
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
            href={explorerHref()}
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
