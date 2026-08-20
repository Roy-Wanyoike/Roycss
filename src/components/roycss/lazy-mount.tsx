"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

/**
 * LazyMount — defers mounting of children until the wrapper enters
 * the viewport (with a 200px rootMargin). Useful for heavy widgets
 * that should not contribute to initial DOM/hydration cost.
 *
 * After the first intersection, the children render once and stay mounted.
 * Falls back to immediate mount when IntersectionObserver is unavailable
 * (SSR / very old browsers).
 */
export interface LazyMountProps {
  children: ReactNode;
  /** Render a fallback (e.g. skeleton) before mount. Default null. */
  fallback?: ReactNode;
  /** rootMargin forwarded to IntersectionObserver. Default "200px". */
  rootMargin?: string;
  /** Threshold forwarded to IntersectionObserver. Default 0. */
  threshold?: number;
  /** Wrapper element tag. Default "div". */
  as?: ElementType;
  className?: string;
  id?: string;
  /** aria-hidden while collapsed — set false to keep semantic. */
  keepAriaHidden?: boolean;
}

export function LazyMount({
  children,
  fallback = null,
  rootMargin = "200px",
  threshold = 0,
  as: Tag = "div",
  className,
  id,
  keepAriaHidden = true,
}: LazyMountProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setShouldMount(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldMount(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMount, rootMargin, threshold]);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      id={id}
      aria-hidden={keepAriaHidden && !shouldMount ? true : undefined}
    >
      {shouldMount ? children : fallback}
    </Tag>
  );
}
