"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /**
   * Minimum height (in px) of the placeholder rendered before the
   * section enters the pre-load zone. Defaults to 300. Preserves
   * layout space (avoids CLS) and keeps the page scroll height
   * stable so the scrollbar doesn't jump when below-the-fold
   * sections swap from placeholder → real content.
   */
  fallbackHeight?: number;
  /**
   * Margin around the viewport that triggers pre-loading. The wrapper
   * observes itself with an IntersectionObserver configured with
   * this rootMargin. Default: `"400px"` — children mount when the
   * wrapper is within 400px of the viewport edge.
   */
  rootMargin?: string;
  /** Optional id applied to the wrapper div (for anchor links). */
  id?: string;
  /** Optional className applied to the wrapper div. */
  className?: string;
}

/**
 * LazySection — defers client-side rendering of heavy below-the-fold
 * sections until they are within `rootMargin` of the viewport.
 *
 * ## Why this exists
 * Round 2 of the RoyCSS DOM-reduction track. Round 1 (LazyMount +
 * EffectCard simplification) cut ~1,400 nodes off the initial DOM
 * count. Round 2 targets the below-fold sections (RecipesSection,
 * PatternsSection, CollectionsSection, FAQSection, ContentTaxonomy)
 * which still render hundreds of cards / accordion items eagerly
 * after hydration even though the user hasn't scrolled to them.
 *
 * ## SSR contract
 * Server renders the children unconditionally — SEO crawlers see
 * the full content. The client's first render ALSO renders the
 * children (so the initial render matches SSR HTML → no hydration
 * warning). After mount, an `useEffect` flips `mounted` to true;
 * if the wrapper is still outside the pre-load zone, the children
 * are unmounted and a lightweight placeholder div is shown instead.
 * An IntersectionObserver fires when the wrapper enters the
 * `rootMargin` zone, flipping `visible` to true and re-mounting the
 * children. Once mounted, children stay mounted (one-shot — does
 * not unmount on scroll-away, which would re-trigger the IO and
 * cause a flash).
 *
 * ## DOM impact
 * Each below-fold section that contains N cards (e.g., PatternsSection
 * with 25+ cards × ~12 nodes per card = ~300 nodes) contributes 0
 * nodes to the post-hydration DOM until the user scrolls near it.
 * The placeholder contributes ~1 node (a single `<div>`). This is
 * the bulk of the round-2 reduction.
 *
 * ## Used by
 * `src/components/roycss/roycss-page.tsx` wraps RecipesSection,
 * PatternsSection, CollectionsSection, FAQSection, ContentTaxonomy.
 * PlatformTools is intentionally NOT wrapped — it's already loaded
 * via `next/dynamic({ ssr: false })` and its Sheet only mounts
 * content when open, so it contributes 0 SSR nodes already.
 */
export function LazySection({
  children,
  fallbackHeight = 300,
  rootMargin = "400px",
  id,
  className,
}: LazySectionProps) {
  // `mounted` flips from false → true once the client-side useEffect
  // runs. SSR + initial client render both see `mounted = false`, so
  // the first render produces children — matching the server HTML
  // (no hydration mismatch warning). After mount, the post-mount
  // render can switch to the placeholder if `visible` is still false.
  const [mounted, setMounted] = useState(false);
  // `visible` flips to true once the wrapper enters the IO pre-load
  // zone. Stays true for the lifetime of the component (one-shot).
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Mark as client-mounted. This is what triggers the swap from
  // "render children (matching SSR)" → "render placeholder until
  // visible" on the very next render pass.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wire up the IntersectionObserver once mounted. Skip if already
  // visible (one-shot — observer disconnected after first hit).
  // Skip if IntersectionObserver is unavailable (legacy browser) —
  // just set visible=true so children render immediately.
  useEffect(() => {
    if (!mounted || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The wrapper observes itself, so there's exactly one entry.
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, mounted, visible]);

  // SSR (mounted=false) → render children.
  // Client post-mount, not yet visible → render placeholder.
  // Client post-mount, visible → render children.
  const showChildren = !mounted || visible;

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        // Reserve layout space when showing the placeholder so the
        // page scroll height doesn't collapse (which would shift the
        // scrollbar / scroll position and confuse sticky nav).
        minHeight: showChildren ? undefined : fallbackHeight,
      }}
    >
      {showChildren ? (
        children
      ) : (
        <div
          aria-hidden
          className="w-full animate-pulse rounded-xl bg-muted/40"
          style={{ minHeight: fallbackHeight }}
        />
      )}
    </div>
  );
}
