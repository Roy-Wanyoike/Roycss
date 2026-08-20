"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * LazySection — wraps below-the-fold sections so they only mount when
 * they scroll near the viewport. One-shot: once mounted, stays mounted.
 *
 * Differences from <LazyMount/>:
 *   - Larger default rootMargin ("400px") so chunks of content become
 *     interactive BEFORE they are fully visible.
 *   - Renders a sized placeholder skeleton of the same height to
 *     prevent layout shift (CLS) before mounting.
 *   - Always wraps in a <section> for semantic landmarks.
 *
 * Pass `minHeight` matching the section's typical rendered height
 * (in px). Default 480.
 */
export interface LazySectionProps {
  children: ReactNode;
  /** Placeholder height in px. Default 480. */
  minHeight?: number;
  /** rootMargin. Default "400px". */
  rootMargin?: string;
  /** Optional section id (used by nav anchor scrolling). */
  id?: string;
  /** Optional aria-label. */
  ariaLabel?: string;
  /** Extra wrapper className. */
  className?: string;
  /** Render a custom skeleton. Falls back to a subtle shimmer bar. */
  skeleton?: ReactNode;
}

export function LazySection({
  children,
  minHeight = 480,
  rootMargin = "400px",
  id,
  ariaLabel,
  className,
  skeleton,
}: LazySectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setMounted(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  // Default skeleton — subtle shimmer + gradient block sized to minHeight
  const defaultSkeleton = (
    <div
      className="w-full flex items-center justify-center rounded-2xl border border-border/40 bg-muted/20"
      style={{ minHeight }}
      aria-hidden="true"
    >
      <div className="h-2 w-32 rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse" />
    </div>
  );

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      id={id}
      aria-label={ariaLabel}
      className={className}
    >
      {mounted ? (
        children
      ) : (
        <div style={{ minHeight }} className="w-full">
          {skeleton ?? defaultSkeleton}
        </div>
      )}
    </section>
  );
}
