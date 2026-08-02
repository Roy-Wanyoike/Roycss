"use client";

import { useMemo, useState } from "react";
import {
  Globe,
  Search,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

type BrowserKey = "chrome" | "firefox" | "safari" | "edge" | "samsung";
type SupportValue = number | "flag" | null;
type BaselineStatus = "widely" | "newly" | "limited";
type Category =
  | "Color"
  | "Layout"
  | "Typography"
  | "Selectors"
  | "Animation"
  | "Effects"
  | "Sizing"
  | "Other";

interface CssFeature {
  id: string;
  name: string;
  category: Category;
  mdnUrl: string;
  support: Record<BrowserKey, SupportValue>;
  baseline?: BaselineStatus;
  note?: string;
}

interface BrowserMeta {
  key: BrowserKey;
  label: string;
  short: string;
  current: number;
  /** Versions at or above this are considered "recently landed". */
  recentThreshold: number;
}

/* ═══════════════════════════════════════════════════════════════
   Browser metadata (late-2024 stable references)
   ═══════════════════════════════════════════════════════════════ */

const BROWSERS: BrowserMeta[] = [
  { key: "chrome", label: "Chrome", short: "Ch", current: 131, recentThreshold: 129 },
  { key: "firefox", label: "Firefox", short: "Fx", current: 133, recentThreshold: 131 },
  { key: "safari", label: "Safari", short: "Sf", current: 18.2, recentThreshold: 17 },
  { key: "edge", label: "Edge", short: "Ed", current: 131, recentThreshold: 129 },
  { key: "samsung", label: "Samsung", short: "Sa", current: 27, recentThreshold: 25 },
];

const CATEGORIES: Category[] = [
  "Color",
  "Layout",
  "Typography",
  "Selectors",
  "Animation",
  "Effects",
  "Sizing",
  "Other",
];

/* ═══════════════════════════════════════════════════════════════
   Built-in dataset — ~25 commonly used modern CSS features.
   Version numbers are approximate, sourced from MDN / caniuse
   knowledge as of late 2024. Verify before production use.
   ═══════════════════════════════════════════════════════════════ */

const FEATURES: CssFeature[] = [
  {
    id: "oklch",
    name: "oklch() color function",
    category: "Color",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch",
    support: { chrome: 111, firefox: 113, safari: 15.4, edge: 111, samsung: 22 },
    baseline: "widely",
    note: "Perceptually uniform color space (OK Lab).",
  },
  {
    id: "color-mix",
    name: "color-mix() function",
    category: "Color",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix",
    support: { chrome: 111, firefox: 113, safari: 16.2, edge: 111, samsung: 22 },
    baseline: "widely",
    note: "Mix two colors in a given colorspace.",
  },
  {
    id: "lab-lch",
    name: "lab() / lch() color functions",
    category: "Color",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lab",
    support: { chrome: 111, firefox: 113, safari: 15.4, edge: 111, samsung: 22 },
    baseline: "newly",
    note: "CIE Lab / LCH color spaces.",
  },
  {
    id: "has",
    name: ":has() relational selector",
    category: "Selectors",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/:has",
    support: { chrome: 105, firefox: 121, safari: 15.4, edge: 105, samsung: 20 },
    baseline: "widely",
    note: "Parent / ancestor selector (the “parent selector”).",
  },
  {
    id: "is",
    name: ":is() selector",
    category: "Selectors",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/:is",
    support: { chrome: 88, firefox: 78, safari: 14, edge: 88, samsung: 15 },
    baseline: "widely",
    note: "Match-taking list, takes the highest specificity.",
  },
  {
    id: "where",
    name: ":where() selector",
    category: "Selectors",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/:where",
    support: { chrome: 88, firefox: 78, safari: 14, edge: 88, samsung: 15 },
    baseline: "widely",
    note: "Like :is() but with zero specificity.",
  },
  {
    id: "nesting",
    name: "Native CSS nesting",
    category: "Other",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting",
    support: { chrome: 112, firefox: 117, safari: 16.5, edge: 112, samsung: 23 },
    baseline: "widely",
    note: "Nest rules inside other rules without a preprocessor.",
  },
  {
    id: "container-queries",
    name: "Container queries (size)",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/container_queries",
    support: { chrome: 105, firefox: 110, safari: 16, edge: 105, samsung: 20 },
    baseline: "widely",
    note: "Style based on a parent container's size.",
  },
  {
    id: "container-query-units",
    name: "Container query units (cqw, cqh…)",
    category: "Sizing",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/container_queries#container_query_length_units",
    support: { chrome: 105, firefox: 110, safari: 16, edge: 105, samsung: 20 },
    baseline: "newly",
    note: "Length units relative to a query container.",
  },
  {
    id: "subgrid",
    name: "subgrid",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrids",
    support: { chrome: 117, firefox: 71, safari: 16, edge: 117, samsung: 24 },
    baseline: "widely",
    note: "Grid items participate in the parent's grid tracks.",
  },
  {
    id: "cascade-layers",
    name: "@layer cascade layers",
    category: "Other",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/@layer",
    support: { chrome: 99, firefox: 97, safari: 15.4, edge: 99, samsung: 18 },
    baseline: "widely",
    note: "Explicit cascade ordering via named layers.",
  },
  {
    id: "aspect-ratio",
    name: "aspect-ratio",
    category: "Sizing",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio",
    support: { chrome: 88, firefox: 89, safari: 15, edge: 88, samsung: 15 },
    baseline: "widely",
    note: "Box size respects a desired width/height ratio.",
  },
  {
    id: "gap-flexbox",
    name: "gap (flexbox)",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/gap",
    support: { chrome: 84, firefox: 63, safari: 14.1, edge: 84, samsung: 14 },
    baseline: "widely",
    note: "Gutters between flex items (and grid items).",
  },
  {
    id: "inset",
    name: "inset shorthand",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/inset",
    support: { chrome: 87, firefox: 66, safari: 14.1, edge: 87, samsung: 14 },
    baseline: "widely",
    note: "Shorthand for top/right/bottom/left.",
  },
  {
    id: "text-wrap-balance",
    name: "text-wrap: balance",
    category: "Typography",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap",
    support: { chrome: 114, firefox: 121, safari: 17.5, edge: 114, samsung: 23 },
    baseline: "newly",
    note: "Balance text across lines for headings.",
  },
  {
    id: "text-wrap-pretty",
    name: "text-wrap: pretty",
    category: "Typography",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap",
    support: { chrome: 117, firefox: 121, safari: 17.5, edge: 117, samsung: 24 },
    baseline: "newly",
    note: "Avoid orphan words in paragraphs.",
  },
  {
    id: "scrollbar-gutter",
    name: "scrollbar-gutter",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter",
    support: { chrome: 94, firefox: 97, safari: null, edge: 94, samsung: 17 },
    baseline: "newly",
    note: "Reserve space for the scrollbar to prevent layout shift.",
  },
  {
    id: "scroll-driven-animations",
    name: "Scroll-driven animations",
    category: "Animation",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline",
    support: { chrome: 115, firefox: "flag", safari: "flag", edge: 115, samsung: 24 },
    baseline: "limited",
    note: "animation-timeline: scroll() / view().",
  },
  {
    id: "view-transitions",
    name: "View Transitions API",
    category: "Effects",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API",
    support: { chrome: 111, firefox: "flag", safari: 18, edge: 111, samsung: 22 },
    baseline: "limited",
    note: "Smooth DOM-to-DOM transitions via document.startViewTransition().",
  },
  {
    id: "backdrop-filter",
    name: "backdrop-filter",
    category: "Effects",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter",
    support: { chrome: 76, firefox: 103, safari: 18, edge: 17, samsung: 12 },
    baseline: "widely",
    note: "Filter the area behind an element (frosted glass).",
  },
  {
    id: "mask",
    name: "mask / mask-image",
    category: "Effects",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image",
    support: { chrome: 120, firefox: 53, safari: 15.4, edge: 120, samsung: 25 },
    baseline: "widely",
    note: "Unprefixed masking; older versions supported -webkit-mask.",
  },
  {
    id: "clip-path",
    name: "clip-path",
    category: "Effects",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path",
    support: { chrome: 55, firefox: 54, safari: 9.1, edge: 79, samsung: 5 },
    baseline: "widely",
    note: "Clip an element to a shape or SVG path.",
  },
  {
    id: "focus-visible",
    name: ":focus-visible",
    category: "Selectors",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible",
    support: { chrome: 86, firefox: 85, safari: 15.4, edge: 86, samsung: 14 },
    baseline: "widely",
    note: "Focus ring only when the user is keyboard-navigating.",
  },
  {
    id: "accent-color",
    name: "accent-color",
    category: "Other",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color",
    support: { chrome: 93, firefox: 92, safari: 15.4, edge: 93, samsung: 17 },
    baseline: "widely",
    note: "Theme native form controls (checkbox, radio, range).",
  },
  {
    id: "scroll-snap",
    name: "scroll-snap",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap",
    support: { chrome: 69, firefox: 68, safari: 11, edge: 79, samsung: 10 },
    baseline: "widely",
    note: "Magnetic scroll snapping for carousels and galleries.",
  },
  {
    id: "logical-properties",
    name: "Logical properties (margin-inline…)",
    category: "Layout",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values",
    support: { chrome: 87, firefox: 66, safari: 12.1, edge: 79, samsung: 14 },
    baseline: "widely",
    note: "Flow-relative versions of margin/padding/border/inset.",
  },
  {
    id: "scrollbar-styling",
    name: "scrollbar-width / scrollbar-color",
    category: "Other",
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width",
    support: { chrome: 121, firefox: 64, safari: null, edge: 121, samsung: 25 },
    baseline: "newly",
    note: "Style scrollbars without vendor prefixes.",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Support tier helpers
   ═══════════════════════════════════════════════════════════════ */

type SupportTier = "supported" | "recent" | "flag" | "unsupported";

function tierFor(value: SupportValue, recentThreshold: number): SupportTier {
  if (value === null) return "unsupported";
  if (value === "flag") return "flag";
  return value >= recentThreshold ? "recent" : "supported";
}

const TIER_CELL_CLASS: Record<SupportTier, string> = {
  supported: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  recent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  flag: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  unsupported: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

const TIER_DOT_CLASS: Record<SupportTier, string> = {
  supported: "bg-emerald-500",
  recent: "bg-amber-500",
  flag: "bg-amber-500",
  unsupported: "bg-rose-500",
};

const TIER_LABEL: Record<SupportTier, string> = {
  supported: "Widely supported",
  recent: "Recently landed",
  flag: "Behind a runtime flag",
  unsupported: "Not supported",
};

function formatSupportValue(value: SupportValue): string {
  if (value === null) return "—";
  if (value === "flag") return "flag";
  return String(value);
}

const BASELINE_CLASS: Record<BaselineStatus, string> = {
  widely: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  newly: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  limited: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25",
};

const BASELINE_LABEL: Record<BaselineStatus, string> = {
  widely: "Baseline · widely",
  newly: "Baseline · newly",
  limited: "Baseline · limited",
};

const CATEGORY_BADGE_CLASS =
  "bg-muted text-muted-foreground border-border/60";

/* ═══════════════════════════════════════════════════════════════
   Small presentational helpers
   ═══════════════════════════════════════════════════════════════ */

function FeatureDots({ feature }: { feature: CssFeature }) {
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`Global support for ${feature.name}`}
    >
      {BROWSERS.map((b) => {
        const tier = tierFor(feature.support[b.key], b.recentThreshold);
        return (
          <span
            key={b.key}
            title={`${b.label}: ${TIER_LABEL[tier]}`}
            className={cn("size-2 rounded-full", TIER_DOT_CLASS[tier])}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */

export function BrowserSupportMatrix() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");

  // Default selection: a representative mix (one per category-ish).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () =>
      new Set([
        "oklch",
        "has",
        "nesting",
        "container-queries",
        "view-transitions",
        "scroll-driven-animations",
      ]),
  );

  /* ─── Filtered feature list (memoized) ─── */
  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FEATURES.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  /* ─── Selected features in stable canonical order ─── */
  const selectedFeatures = useMemo(
    () => FEATURES.filter((f) => selectedIds.has(f.id)),
    [selectedIds],
  );

  /* ─── Summary counts (fully / partial / unsupported somewhere) ─── */
  const summary = useMemo(() => {
    let fully = 0;
    let partial = 0;
    let unsupported = 0;
    for (const f of selectedFeatures) {
      const tiers = BROWSERS.map((b) =>
        tierFor(f.support[b.key], b.recentThreshold),
      );
      const hasUnsupported = tiers.includes("unsupported");
      const hasFlag = tiers.includes("flag");
      const hasRecent = tiers.includes("recent");
      if (hasUnsupported || hasFlag) {
        unsupported++;
      } else if (hasRecent) {
        partial++;
      } else {
        fully++;
      }
    }
    return { fully, partial, unsupported };
  }, [selectedFeatures]);

  /* ─── Selection helpers ─── */
  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const f of filteredFeatures) next.add(f.id);
      return next;
    });
  };

  const clearAll = () => setSelectedIds(new Set());

  const allVisibleSelected =
    filteredFeatures.length > 0 &&
    filteredFeatures.every((f) => selectedIds.has(f.id));

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Globe className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight text-foreground">
              Browser Support Matrix
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pick modern CSS features to see support across major browsers.
              Cells show first stable version. Amber = recently landed / behind
              a flag. Rose = unsupported.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Info className="size-3.5" />
          <span>
            Current stable: Chrome 131 · Firefox 133 · Safari 18.2 · Edge 131 ·
            Samsung 27
          </span>
        </div>
      </div>

      {/* Body — picker + matrix */}
      <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        {/* ─── Picker ─── */}
        <section
          aria-label="Feature picker"
          className="flex flex-col rounded-xl border border-border bg-card p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search features…"
                aria-label="Search features"
                className="h-9 pl-8"
              />
            </div>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as typeof category)}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filter by category"
                className="h-9 w-[130px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllVisible}
              disabled={filteredFeatures.length === 0 || allVisibleSelected}
              className="h-8 flex-1"
            >
              <CheckCheck className="size-3.5" />
              Select all
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedIds.size === 0}
              className="h-8 flex-1"
            >
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          </div>

          <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span>
              {filteredFeatures.length} of {FEATURES.length} features
            </span>
            <span>{selectedIds.size} selected</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
            <ul className="space-y-0.5">
              {filteredFeatures.map((f) => {
                const checked = selectedIds.has(f.id);
                return (
                  <li key={f.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/60",
                        checked && "bg-muted/40",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(f.id)}
                        aria-label={`Select ${f.name}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {f.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn("px-1.5 py-0 text-[10px]", CATEGORY_BADGE_CLASS)}
                          >
                            {f.category}
                          </Badge>
                          {f.baseline && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 text-[10px] font-medium",
                                BASELINE_CLASS[f.baseline],
                              )}
                            >
                              <ShieldCheck className="size-2.5" />
                              {f.baseline}
                            </Badge>
                          )}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
              {filteredFeatures.length === 0 && (
                <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No features match this filter.
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* ─── Matrix ─── */}
        <section
          aria-label="Support matrix"
          className="flex flex-col rounded-xl border border-border bg-card p-3"
        >
          {selectedFeatures.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Globe className="size-8 opacity-40" />
              <p>
                Select features from the list to build a support matrix.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                className="mt-1"
              >
                <CheckCheck className="size-3.5" />
                Select all features
              </Button>
            </div>
          ) : (
            <>
              {/* Table — horizontally scrollable on small screens */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">
                    Browser support matrix for {selectedFeatures.length}{" "}
                    selected CSS feature
                    {selectedFeatures.length === 1 ? "" : "s"}. Columns: feature
                    name, baseline status, Chrome, Firefox, Safari, Edge,
                    Samsung Internet, and a 5-dot global support indicator.
                  </caption>
                  <thead>
                    <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                      <th
                        scope="col"
                        className="sticky left-0 z-20 bg-muted/60 px-3 py-2 font-semibold"
                      >
                        Feature
                      </th>
                      <th scope="col" className="px-3 py-2 text-center font-semibold">
                        Baseline
                      </th>
                      {BROWSERS.map((b) => (
                        <th
                          key={b.key}
                          scope="col"
                          className="px-3 py-2 text-center font-semibold"
                          title={`${b.label} — current stable v${b.current}`}
                        >
                          <span className="block leading-tight">{b.label}</span>
                          <span className="block text-[10px] font-normal text-muted-foreground/70">
                            v{b.current}
                          </span>
                        </th>
                      ))}
                      <th
                        scope="col"
                        className="sticky right-0 z-20 bg-muted/60 px-3 py-2 text-center font-semibold"
                      >
                        Support
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFeatures.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b border-border last:border-0"
                      >
                        {/* Feature name + MDN link */}
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-card px-3 py-2 text-left align-middle"
                        >
                          <div className="flex flex-col gap-0.5">
                            <a
                              href={f.mdnUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                            >
                              <span className="truncate">{f.name}</span>
                              <ExternalLink className="size-3 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                            </a>
                            <Badge
                              variant="outline"
                              className={cn(
                                "w-fit px-1.5 py-0 text-[10px]",
                                CATEGORY_BADGE_CLASS,
                              )}
                            >
                              {f.category}
                            </Badge>
                          </div>
                        </th>

                        {/* Baseline */}
                        <td className="px-3 py-2 text-center align-middle">
                          {f.baseline ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 text-[10px] font-medium",
                                BASELINE_CLASS[f.baseline],
                              )}
                              title={BASELINE_LABEL[f.baseline]}
                            >
                              <ShieldCheck className="size-2.5" />
                              {f.baseline}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
                              —
                            </span>
                          )}
                        </td>

                        {/* Browser cells */}
                        {BROWSERS.map((b) => {
                          const v = f.support[b.key];
                          const tier = tierFor(v, b.recentThreshold);
                          const cellLabel = formatSupportValue(v);
                          const tooltip = `${f.name} · ${b.label}: ${
                            v === null
                              ? "not supported"
                              : v === "flag"
                                ? "behind a runtime flag"
                                : `v${v}+`
                          } (${TIER_LABEL[tier]})`;
                          return (
                            <td
                              key={b.key}
                              className="px-2 py-1.5 text-center align-middle"
                              title={tooltip}
                            >
                              <span
                                className={cn(
                                  "inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-1 font-mono text-xs font-medium tabular-nums",
                                  TIER_CELL_CLASS[tier],
                                )}
                                aria-label={tooltip}
                              >
                                {cellLabel}
                              </span>
                            </td>
                          );
                        })}

                        {/* Global support dots */}
                        <td className="sticky right-0 z-10 bg-card px-3 py-2 text-center align-middle">
                          <div className="flex flex-col items-center gap-1">
                            <FeatureDots feature={f} />
                            {f.note && (
                              <span className="block max-w-[140px] text-[10px] leading-tight text-muted-foreground">
                                {f.note}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  Widely supported
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-500" />
                  Recently landed / flag
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-500" />
                  Unsupported
                </span>
              </div>

              {/* Summary footer */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="font-medium text-foreground">
                  {selectedFeatures.length} feature
                  {selectedFeatures.length === 1 ? "" : "s"} selected
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {summary.fully} fully supported
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-amber-700 dark:text-amber-400">
                  {summary.partial} partial
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-rose-700 dark:text-rose-400">
                  {summary.unsupported} unsupported somewhere
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Disclaimer */}
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="size-3" />
        Versions approximate — verify on{" "}
        <a
          href="https://caniuse.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          caniuse.com
        </a>{" "}
        for production decisions.
      </p>
    </div>
  );
}
