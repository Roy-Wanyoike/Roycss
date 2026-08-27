"use client";

/**
 * DocsSidebar — Left navigation rail for /docs/*.
 *
 * Renders the 4 DOCS_CATEGORIES (Getting Started, Concepts, API Reference,
 * Guides) as collapsible accordions. The current page is highlighted with
 * the primary accent + a left border. Categories default to expanded; the
 * user's collapse choices are persisted to localStorage so they survive
 * across sessions, and the active page's category is always expanded
 * automatically.
 *
 * NO indigo/blue — uses the emerald `primary` token (see globals.css).
 */

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Rocket,
  Lightbulb,
  Code2,
  BookOpen,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_CATEGORIES } from "@/lib/docs-sitemap";

/** Map sitemap icon strings → Lucide components. */
const ICON_MAP: Record<string, LucideIcon> = {
  Rocket,
  Lightbulb,
  Code2,
  BookOpen,
};

const STORAGE_KEY = "roycss-docs-sidebar-collapsed";

interface DocsSidebarProps {
  /** Override the current path (defaults to usePathname()). */
  activeSlug?: string;
  /** Called when a nav link is clicked — used by the mobile drawer to close. */
  onNavigate?: () => void;
}

export function DocsSidebar({ activeSlug, onNavigate }: DocsSidebarProps) {
  const pathname = usePathname();
  const current = activeSlug ?? pathname ?? "";

  // Track which categories are collapsed. Empty set = all expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Hydrate persisted collapse state on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage hydration
        setCollapsed(new Set(arr));
      }
    } catch {
      // ignore — fall back to all-expanded default
    }
  }, []);

  // Auto-expand the category containing the current page so the active
  // item is never hidden behind a collapsed accordion.
  useEffect(() => {
    const cat = DOCS_CATEGORIES.find((c) =>
      c.pages.some((p) => p.slug === current),
    );
    if (!cat) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand active page's category
    setCollapsed((prev) => {
      if (!prev.has(cat.id)) return prev;
      const next = new Set(prev);
      next.delete(cat.id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, [current]);

  const toggleCategory = (catId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore — non-critical
      }
      return next;
    });
  };

  const categories = useMemo(() => DOCS_CATEGORIES, []);

  return (
    <aside
      aria-label="Documentation sidebar"
      className="flex flex-col w-[280px] shrink-0 h-full bg-card/30 border-r border-border/40 overflow-y-auto scrollbar-thin"
    >
      <div className="p-4 sticky top-0 bg-card/80 backdrop-blur-sm z-10 border-b border-border/40">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documentation
        </p>
      </div>
      <nav className="flex flex-col gap-4 p-3">
        {categories.map((category) => {
          const Icon = ICON_MAP[category.icon] ?? FileText;
          const isCollapsed = collapsed.has(category.id);
          return (
            <div key={category.id} className="flex flex-col">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer w-full"
                aria-expanded={!isCollapsed}
                aria-controls={`docs-cat-${category.id}`}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="size-3.5 shrink-0" />
                )}
                <Icon className="size-3.5 shrink-0 text-primary/70" />
                <span className="truncate">{category.label}</span>
                <span className="ml-auto text-[10px] font-normal text-muted-foreground/70 tabular-nums">
                  {category.pages.length}
                </span>
              </button>
              {!isCollapsed && (
                <ul
                  id={`docs-cat-${category.id}`}
                  className="flex flex-col gap-0.5 mt-1 ml-1"
                >
                  {category.pages.map((page) => {
                    const isActive = page.slug === current;
                    return (
                      <li key={page.slug}>
                        <Link
                          href={page.slug}
                          onClick={onNavigate}
                          aria-current={isActive ? "page" : undefined}
                          title={page.description}
                          className={cn(
                            "flex flex-col gap-0.5 w-full text-left px-3 py-2 rounded-md text-sm leading-snug transition-all border-l-2",
                            isActive
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
                          )}
                        >
                          <span className="line-clamp-2">{page.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
