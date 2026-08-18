"use client";

/**
 * DocsToc — Right sidebar table of contents.
 *
 * Renders the pre-parsed H2 headings for the currently selected doc as a
 * vertical list of anchor buttons. Clicking a button smooth-scrolls the
 * main content area to that heading.
 *
 * The TOC is hidden below the `lg` breakpoint (where the layout collapses
 * to 2 columns and there's no room for a right rail).
 *
 * Active section highlighting is driven by an IntersectionObserver that
 * watches the rendered H2 elements inside the main content area.
 */

import { useEffect, useState, useMemo } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocTocItem } from "./docs-data";

interface DocsTocProps {
  toc: DocTocItem[];
  /** The slug of the currently-viewed doc. Used to reset state on doc change. */
  docSlug: string | null;
  /** Selector or ref for the scroll container holding the rendered H2s. */
  contentContainerSelector?: string;
}

export function DocsToc({
  toc,
  docSlug,
  contentContainerSelector = "[data-docs-content]",
}: DocsTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Reset active when doc changes
  useEffect(() => {
     
    setActiveId(null);
  }, [docSlug]);

  // IntersectionObserver: highlight the H2 currently in view
  useEffect(() => {
    if (!toc.length || !docSlug) return;
    const container = document.querySelector(contentContainerSelector);
    if (!container) return;

    const headings = Array.from(container.querySelectorAll("h2[id]"));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top that is intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.getAttribute("id"));
        }
      },
      {
        root: container,
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0, 1],
      },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc, docSlug, contentContainerSelector]);

  const handleClick = (id: string) => {
    // Click within the same content scroll container
    const container = document.querySelector(contentContainerSelector);
    const target = container?.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  const sortedToc = useMemo(() => [...toc], [toc]);

  if (!toc.length) {
    return (
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-l border-border/40 bg-card/30">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <List className="size-3.5" />
            On this page
          </div>
          <p className="text-xs text-muted-foreground/70 italic">
            No sections in this doc.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-l border-border/40 bg-card/30 overflow-y-auto scrollbar-thin">
      <div className="p-4 sticky top-0 bg-card/30 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <List className="size-3.5" />
          On this page
        </div>
        <nav className="flex flex-col gap-0.5">
          {sortedToc.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
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
      </div>
    </aside>
  );
}
