"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

interface LazyMountProps {
  children: ReactNode;
  /**
   * Margin around the viewport that triggers pre-loading. The wrapper
   * observes itself with an IntersectionObserver configured with this
   * rootMargin. Default: `"200px"` — children mount when the wrapper is
   * within 200px of the viewport edge.
   */
  rootMargin?: string;
  /**
   * Optional placeholder rendered before the children mount. Use this to
   * preserve layout (e.g., a fixed-height skeleton) and avoid CLS.
   * Defaults to `null` (no placeholder).
   */
  fallback?: ReactNode;
  /** Class applied to the wrapper div. */
  className?: string;
}

/**
 * LazyMount — only renders its children once they are near the viewport.
 *
 * Uses an IntersectionObserver with a 200px rootMargin. Once the wrapper
 * enters the pre-load zone, the children are mounted and the observer is
 * disconnected (one-shot — children stay mounted after that). Before
 * triggering, only the lightweight placeholder (or `null`) is rendered,
 * keeping the DOM small for offscreen cards.
 *
 * Why this matters for the effects grid:
 *  - `VirtualScrollGrid` already renders ~24 cards at a time
 *  - But only ~4–8 of those are visible above the fold
 *  - The other ~16–20 are mounted-but-offscreen, each contributing a
 *    `LivePreview` with 2–7 nested DOM nodes
 *  - Wrapping `LivePreview` in `LazyMount` defers those ~80–140 nodes
 *    until the card actually scrolls near the viewport
 *
 * SSR / no-IO fallback: if `IntersectionObserver` is not available
 * (e.g., server render, legacy browser), children are mounted
 * immediately so SSR HTML is unaffected and there's no flash of empty
 * content.
 *
 * Used by `EffectCard` to lazily mount the (heavy) `LivePreview`. Could
 * also be used to lazily mount WebGL `<canvas>` effects, deep code
 * blocks, or any heavyweight subtree that lives inside a virtualized
 * grid.
 */
export function LazyMount({
  children,
  rootMargin = "200px",
  fallback = null,
  className,
}: LazyMountProps) {
  // Lazy initial state: if IntersectionObserver is unavailable at first
  // client render (legacy browser), start mounted so the subtree is
  // always available. On the server, `window` is undefined and we start
  // unmounted so SSR emits only the lightweight placeholder.
  const [shouldMount, setShouldMount] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof IntersectionObserver === "undefined",
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Already mounted (no IO available) — nothing to observe.
    if (shouldMount) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The wrapper observes itself, so there's only one entry.
        if (entries[0]?.isIntersecting) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, shouldMount]);

  return (
    <div ref={ref} className={className}>
      {shouldMount ? children : fallback}
    </div>
  );
}
