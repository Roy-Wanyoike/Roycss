"use client";

/**
 * DocsTOC — Right sidebar "On this page" rail.
 *
 * Accepts an optional `headings` prop. If omitted, it auto-discovers all
 * `<h2 id="...">` headings inside the `[data-docs-content]` container on
 * mount and observes the DOM for late-arriving content (code-split pages,
 * client effects, etc.).
 *
 * Highlights the heading currently nearest the top of the viewport using
 * an IntersectionObserver, and smooth-scrolls to a heading on click.
 *
 * Hidden below `lg` (where there's no room for a 200px right rail).
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface DocsTOCProps {
  /** Pre-parsed headings. If omitted, TOC auto-extracts from the DOM. */
  headings?: TocHeading[];
  /** Selector for the scroll container holding the rendered H2s. */
  contentSelector?: string;
  /** Reset state when the route changes. */
  routeKey?: string;
}

function extractHeadings(selector: string): TocHeading[] {
  if (typeof document === "undefined") return [];
  const container = document.querySelector(selector);
  if (!container) return [];
  return Array.from(container.querySelectorAll("h2[id]")).map((el) => {
    const htmlEl = el as HTMLElement;
    return {
      id: htmlEl.id,
      text: htmlEl.textContent?.trim() ?? "",
      level: 2,
    };
  });
}

export function DocsTOC({
  headings,
  contentSelector = "[data-docs-content]",
  routeKey,
}: DocsTOCProps) {
  const [discovered, setDiscovered] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = headings ?? discovered;

  // Auto-discover headings from the DOM when no `headings` prop was given.
  useEffect(() => {
    if (headings) return;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const found = extractHeadings(contentSelector);
      setDiscovered((prev) => {
        // Avoid spurious re-renders if the list is unchanged.
        if (
          prev.length === found.length &&
          prev.every((p, i) => p.id === found[i]?.id)
        ) {
          return prev;
        }
        return found;
      });
    };

    // Run on next tick so children have hydrated.
    run();
    const raf = requestAnimationFrame(run);

    // Observe late-arriving content (code-split, dynamic imports).
    const container = document.querySelector(contentSelector);
    const mo = container
      ? new MutationObserver(() => run())
      : null;
    if (mo && container) {
      mo.observe(container, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      mo?.disconnect();
    };
  }, [headings, contentSelector, routeKey]);

  // Reset active when the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on route change
    setActiveId(null);
  }, [routeKey]);

  // Track the heading closest to the top of the viewport.
  useEffect(() => {
    if (!list.length) return;
    const headingsEls = list
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headingsEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) {
          setActiveId(visible[0].target.getAttribute("id"));
        }
      },
      {
        // Trigger when a heading is within the top 20% of the viewport.
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0, 1],
      },
    );

    headingsEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [list]);

  const handleClick = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Update the URL hash without jumping.
        if (typeof history !== "undefined") {
          history.replaceState(null, "", `#${id}`);
        }
        setActiveId(id);
      }
    },
    [],
  );

  const sorted = useMemo(() => [...list], [list]);

  return (
    <aside
      aria-label="On this page"
      className="hidden lg:block w-[200px] shrink-0 self-start sticky top-20"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          On this page
        </p>
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground/70 italic">
            No sections on this page.
          </p>
        ) : (
          <nav className="flex flex-col gap-0.5">
            {sorted.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item.id)}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  "text-left text-xs leading-relaxed py-1 pl-3 pr-2 rounded-md transition-all cursor-pointer border-l-2",
                  activeId === item.id
                    ? "text-primary border-primary bg-primary/5 font-medium"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/40",
                )}
                title={item.text}
              >
                <span className="line-clamp-2">{item.text}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
