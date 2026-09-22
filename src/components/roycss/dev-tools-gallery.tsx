"use client";

/**
 * DevToolsGallery — browsable UI for every developer tool in the registry.
 *
 * Resolves issue #185: the 70 tools in the <PlatformTools/> sheet were
 * reachable only via #tool=<id> deep links (plus a single header dropdown
 * item). This gallery renders TOOL_META from the tool-registry (single
 * source of truth) as a filterable card grid; every card click opens the
 * real tool sheet via onLaunchTool.
 */

import { useMemo, useState } from "react";
import { LayoutGrid, Search, Wrench, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterTools,
  TOOL_CATEGORY,
  TOOL_CATEGORY_META,
  TOOL_IDS,
  TOOL_META,
  type ToolCategoryId,
  type ToolCategoryFilter,
  type ToolType,
} from "@/components/roycss/tool-registry";

/** Category accent classes — literal strings so Tailwind can see them. */
const CATEGORY_ACCENT: Record<ToolCategoryId, { bar: string; chip: string }> = {
  ai: { bar: "bg-emerald-500/70", chip: "data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-700 dark:data-[active=true]:text-emerald-300 data-[active=true]:border-emerald-500/40" },
  diagnostics: { bar: "bg-rose-500/70", chip: "data-[active=true]:bg-rose-500/15 data-[active=true]:text-rose-700 dark:data-[active=true]:text-rose-300 data-[active=true]:border-rose-500/40" },
  layout: { bar: "bg-amber-500/70", chip: "data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-700 dark:data-[active=true]:text-amber-300 data-[active=true]:border-amber-500/40" },
  color: { bar: "bg-fuchsia-500/70", chip: "data-[active=true]:bg-fuchsia-500/15 data-[active=true]:text-fuchsia-700 dark:data-[active=true]:text-fuchsia-300 data-[active=true]:border-fuchsia-500/40" },
  motion: { bar: "bg-violet-500/70", chip: "data-[active=true]:bg-violet-500/15 data-[active=true]:text-violet-700 dark:data-[active=true]:text-violet-300 data-[active=true]:border-violet-500/40" },
  generators: { bar: "bg-teal-500/70", chip: "data-[active=true]:bg-teal-500/15 data-[active=true]:text-teal-700 dark:data-[active=true]:text-teal-300 data-[active=true]:border-teal-500/40" },
  typography: { bar: "bg-orange-500/70", chip: "data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-700 dark:data-[active=true]:text-orange-300 data-[active=true]:border-orange-500/40" },
  selectors: { bar: "bg-pink-500/70", chip: "data-[active=true]:bg-pink-500/15 data-[active=true]:text-pink-700 dark:data-[active=true]:text-pink-300 data-[active=true]:border-pink-500/40" },
  utilities: { bar: "bg-stone-500/70", chip: "data-[active=true]:bg-stone-500/15 data-[active=true]:text-stone-700 dark:data-[active=true]:text-stone-300 data-[active=true]:border-stone-500/40" },
};

const CATEGORY_ORDER: ToolCategoryId[] = ["ai", "diagnostics", "layout", "color", "motion", "generators", "typography", "selectors", "utilities"];

export function DevToolsGallery({ onLaunchTool }: { onLaunchTool: (toolId: ToolType) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategoryFilter>("all");

  const visible = useMemo(() => filterTools(query, category), [query, category]);
  const isFiltered = query.trim() !== "" || category !== "all";

  return (
    <section id="dev-tools" aria-labelledby="dev-tools-heading" className="py-12 sm:py-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <Wrench className="size-3.5" aria-hidden="true" />
            {TOOL_IDS.length} interactive tools
          </div>
          <h2 id="dev-tools-heading" className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Developer Tools
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Every tool runs in-browser — search or filter by category and click any card to launch it.
          </p>
        </div>

        {/* Controls: search + category chips */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools… (e.g. gradient, specificity, clamp)"
              aria-label="Search developer tools"
              className="pl-9 pr-9 h-10 rounded-full bg-background/60"
            />
            {query !== "" && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter tools by category"
            className="flex flex-wrap justify-center gap-1.5"
          >
            <CategoryChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              label={`All (${TOOL_IDS.length})`}
              accent=""
            />
            {CATEGORY_ORDER.map((cat) => (
              <CategoryChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(category === cat ? "all" : cat)}
                label={TOOL_CATEGORY_META[cat].label}
                accent={CATEGORY_ACCENT[cat].chip}
              />
            ))}
          </div>
        </div>

        {/* Result count — announced to screen readers on change */}
        <p aria-live="polite" className="sr-only">
          Showing {visible.length} of {TOOL_IDS.length} tools
        </p>

        {/* Grid */}
        {visible.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 list-none">
            {visible.map((id) => {
              const meta = TOOL_META[id];
              const cat = TOOL_CATEGORY[id];
              const Icon = meta.icon;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onLaunchTool(id)}
                    aria-label={`Launch ${meta.title} — ${TOOL_CATEGORY_META[cat].label}`}
                    className="group relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-xl border bg-card p-4 pl-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {/* Category left-accent */}
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity ${CATEGORY_ACCENT[cat].bar}`} />
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <Badge variant="outline" className="shrink-0 text-xs font-medium text-muted-foreground">
                        {TOOL_CATEGORY_META[cat].label}
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold leading-snug line-clamp-1">{meta.title}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{meta.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed py-16 text-center" role="status">
            <LayoutGrid className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">No tools match your filters</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different keyword or category.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}

        {isFiltered && visible.length > 0 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="text-xs text-muted-foreground"
            >
              <X className="size-3.5 mr-1" aria-hidden="true" />
              Clear filters — showing {visible.length} of {TOOL_IDS.length}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryChip({ active, onClick, label, accent }: { active: boolean; onClick: () => void; label: string; accent: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:border-primary/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${accent}`}
    >
      {label}
    </button>
  );
}

export default DevToolsGallery;
