"use client";

/**
 * DocsSidebar — Left navigation rail.
 *
 * Renders all 19 docs grouped by their 5 categories (Architecture, Product,
 * Quality, Growth, Tooling). Each doc item shows its title (truncated) and
 * a word-count badge. The currently-selected doc is highlighted.
 *
 * Categories are collapsible — click the category header to expand/collapse.
 * State is persisted to localStorage so the user's preference survives
 * across sessions.
 */

import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Boxes,
  Target,
  Gauge,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  categoryOrder,
  categoryMeta,
  type DocEntry,
  type DocsCategoryId,
} from "./docs-data";

interface DocsSidebarProps {
  docs: DocEntry[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

const CATEGORY_ICONS: Record<DocsCategoryId, LucideIcon> = {
  architecture: Boxes,
  product: Target,
  quality: Gauge,
  growth: TrendingUp,
  tooling: Wrench,
  uncategorized: FileText,
};

/** Group docs by category, preserving the order in `categoryOrder`. */
function groupByCategory(docs: DocEntry[]): Array<{ id: DocsCategoryId; docs: DocEntry[] }> {
  const groups = new Map<DocsCategoryId, DocEntry[]>();
  for (const cat of categoryOrder) groups.set(cat, []);
  for (const doc of docs) {
    const cat = (groups.has(doc.category as DocsCategoryId)
      ? doc.category
      : "uncategorized") as DocsCategoryId;
    groups.get(cat)!.push(doc);
  }
  return categoryOrder
    .filter((cat) => (groups.get(cat)?.length ?? 0) > 0)
    .map((cat) => ({ id: cat, docs: groups.get(cat)! }));
}

const COLLAPSE_STORAGE_KEY = "roycss-docs-collapsed-categories";

export function DocsSidebar({ docs, selectedSlug, onSelect }: DocsSidebarProps) {
  // Track which categories are collapsed. Empty = all expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Load persisted collapse state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage hydration on mount
        setCollapsed(new Set(arr));
      }
    } catch {
      // ignore — fall back to all-expanded default
    }
  }, []);

  // Persist collapse state changes
  const toggleCategory = (catId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore — non-critical
      }
      return next;
    });
  };

  const groups = useMemo(() => groupByCategory(docs), [docs]);

  // Auto-expand the category containing the selected doc
  useEffect(() => {
    if (!selectedSlug) return;
    const doc = docs.find((d) => d.slug === selectedSlug);
    if (!doc) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand selected doc's category
    setCollapsed((prev) => {
      if (!prev.has(doc.category)) return prev;
      const next = new Set(prev);
      next.delete(doc.category);
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, [selectedSlug, docs]);

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border/40 bg-card/30 overflow-y-auto scrollbar-thin">
      <div className="p-3 sticky top-0 bg-card/80 backdrop-blur-sm z-10 border-b border-border/40">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          {docs.length} architecture docs
        </p>
      </div>
      <nav className="flex flex-col gap-3 p-2">
        {groups.map((group) => {
          const meta = categoryMeta[group.id];
          const Icon = CATEGORY_ICONS[group.id] ?? FileText;
          const isCollapsed = collapsed.has(group.id);
          return (
            <div key={group.id} className="flex flex-col">
              <button
                onClick={() => toggleCategory(group.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="size-3.5 shrink-0" />
                )}
                <Icon className="size-3.5 shrink-0 text-primary/70" />
                <span className="truncate">{meta.label}</span>
                <span className="ml-auto text-[10px] font-normal text-muted-foreground/70 tabular-nums">
                  {group.docs.length}
                </span>
              </button>
              {!isCollapsed && (
                <ul className="flex flex-col gap-0.5 mt-1">
                  {group.docs.map((doc) => {
                    const isActive = doc.slug === selectedSlug;
                    return (
                      <li key={doc.slug}>
                        <button
                          onClick={() => onSelect(doc.slug)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-xs leading-snug transition-all cursor-pointer group",
                            isActive
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent",
                          )}
                          title={doc.title}
                        >
                          <span className="line-clamp-2">{doc.title}</span>
                          <span className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground/70">
                            <FileText className="size-2.5" />
                            {doc.wordCount.toLocaleString()} words
                          </span>
                        </button>
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
