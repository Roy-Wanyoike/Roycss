"use client";

/**
 * ProductGrid — filterable, searchable grid of all 62 platform products.
 *
 * Features:
 *   - 6 category tabs (Build, Design, AI, DevTools, Enterprise, Learning)
 *   - 4 tier tabs (All, Free, Pro, Team, Enterprise)
 *   - 4 status tabs (All, Live, Beta, Coming Soon)
 *   - Live search (filters by name, description, tags)
 *   - Uses ProductCard
 *   - Lazy-loads product components via next/dynamic when a card is opened
 *     in a modal (Dialog)
 *
 * The grid owns NO product data — it imports from
 * `src/lib/product-registry.ts` (the single source of truth).
 *
 * Next.js limitation: `next/dynamic(() => import(path))` requires the path
 * to be statically analyzable. We therefore keep a static lookup map of
 * `componentPath` → lazy component (`PRODUCT_LAZY` below). The registry's
 * `componentPath` string is the lookup key — keeping the registry itself a
 * pure-data file that other consumers (search, etc.) can import without
 * pulling in 62 lazy chunks.
 */

import { useState, useMemo, useCallback, lazy, Suspense, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Search as SearchIcon,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PRODUCT_REGISTRY,
  PRODUCT_CATEGORIES,
  PRODUCT_TIER_META,
  PRODUCT_STATUS_META,
  PRODUCT_CATEGORY_COUNTS,
  type ProductEntry,
  type ProductTier,
  type ProductStatus,
  type ProductCategory,
} from "@/lib/product-registry";
import { ProductCard, resolveProductIcon } from "@/components/roycss/product-card";

/* ═══════════════════════════════════════════════════════════════
   STATIC LAZY LOADERS — keyed by the registry's `componentPath` string.
   Each entry is `next/dynamic(() => import("<path>").then(m => ({ default: m[<exportName>] })), { ssr: false })`
   so the chunk only downloads when the user opens that product's modal.
   ═══════════════════════════════════════════════════════════════ */

type LazyComponent = ComponentType<unknown>;

const PRODUCT_LAZY: Record<string, LazyComponent> = {
  "@/components/roycss/pro/data-grid": dynamic(() =>
    import("@/components/roycss/pro/data-grid").then((m) => ({ default: m.ProDataGrid as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/kanban-board": dynamic(() =>
    import("@/components/roycss/pro/kanban-board").then((m) => ({ default: m.ProKanbanBoard as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/scheduler": dynamic(() =>
    import("@/components/roycss/pro/scheduler").then((m) => ({ default: m.ProScheduler as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/charts": dynamic(() =>
    import("@/components/roycss/pro/charts").then((m) => ({ default: m.ProCharts as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-blocks": dynamic(() =>
    import("@/components/roycss/pro/roy-blocks").then((m) => ({ default: m.RoyBlocks as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/pattern-library": dynamic(() =>
    import("@/components/roycss/pro/pattern-library").then((m) => ({ default: m.PatternLibrary as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/template-library": dynamic(() =>
    import("@/components/roycss/pro/template-library").then((m) => ({ default: m.TemplateLibrary as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-blueprints": dynamic(() =>
    import("@/components/roycss/pro/roy-blueprints").then((m) => ({ default: m.RoyBlueprints as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/marketplace": dynamic(() =>
    import("@/components/roycss/pro/marketplace").then((m) => ({ default: m.Marketplace as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/plugin-hub": dynamic(() =>
    import("@/components/roycss/pro/plugin-hub").then((m) => ({ default: m.PluginHub as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-forms": dynamic(() =>
    import("@/components/roycss/pro/roy-forms").then((m) => ({ default: m.RoyForms as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-storybook": dynamic(() =>
    import("@/components/roycss/pro/roy-storybook").then((m) => ({ default: m.RoyStorybook as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/visual-studio": dynamic(() =>
    import("@/components/roycss/pro/visual-studio").then((m) => ({ default: m.VisualStudio as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/theme-system": dynamic(() =>
    import("@/components/roycss/pro/theme-system").then((m) => ({ default: m.ThemeSystem as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-color-studio": dynamic(() =>
    import("@/components/roycss/pro/roy-color-studio").then((m) => ({ default: m.RoyColorStudio as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-gradient-studio": dynamic(() =>
    import("@/components/roycss/pro/roy-gradient-studio").then((m) => ({ default: m.RoyGradientStudio as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-typography": dynamic(() =>
    import("@/components/roycss/pro/roy-typography").then((m) => ({ default: m.RoyTypography as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-layout-studio": dynamic(() =>
    import("@/components/roycss/pro/roy-layout-studio").then((m) => ({ default: m.RoyLayoutStudio as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-motion-studio": dynamic(() =>
    import("@/components/roycss/pro/roy-motion-studio").then((m) => ({ default: m.RoyMotionStudio as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/motion-library": dynamic(() =>
    import("@/components/roycss/pro/motion-library").then((m) => ({ default: m.MotionLibrary as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/icon-pack": dynamic(() =>
    import("@/components/roycss/pro/icon-pack").then((m) => ({ default: m.IconPack as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/accessibility-suite": dynamic(() =>
    import("@/components/roycss/pro/accessibility-suite").then((m) => ({ default: m.AccessibilitySuite as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-ai": dynamic(() =>
    import("@/components/roycss/pro/roy-ai").then((m) => ({ default: m.RoyAI as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-agents": dynamic(() =>
    import("@/components/roycss/pro/roy-agents").then((m) => ({ default: m.RoyAgents as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-architect": dynamic(() =>
    import("@/components/roycss/pro/roy-architect").then((m) => ({ default: m.RoyArchitect as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-review": dynamic(() =>
    import("@/components/roycss/pro/roy-review").then((m) => ({ default: m.RoyReview as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-refactor": dynamic(() =>
    import("@/components/roycss/pro/roy-refactor").then((m) => ({ default: m.RoyRefactor as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-pair": dynamic(() =>
    import("@/components/roycss/pro/roy-pair").then((m) => ({ default: m.RoyPair as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-designer": dynamic(() =>
    import("@/components/roycss/pro/roy-designer").then((m) => ({ default: m.RoyDesigner as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-generator": dynamic(() =>
    import("@/components/roycss/pro/roy-generator").then((m) => ({ default: m.RoyGenerator as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-search": dynamic(() =>
    import("@/components/roycss/pro/roy-search").then((m) => ({ default: m.RoySearch as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-sandbox": dynamic(() =>
    import("@/components/roycss/pro/roy-sandbox").then((m) => ({ default: m.RoySandbox as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-scaffold": dynamic(() =>
    import("@/components/roycss/pro/roy-scaffold").then((m) => ({ default: m.RoyScaffold as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-sync": dynamic(() =>
    import("@/components/roycss/pro/roy-sync").then((m) => ({ default: m.RoySync as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-version": dynamic(() =>
    import("@/components/roycss/pro/roy-version").then((m) => ({ default: m.RoyVersion as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-registry": dynamic(() =>
    import("@/components/roycss/pro/roy-registry").then((m) => ({ default: m.RoyRegistry as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-bundle": dynamic(() =>
    import("@/components/roycss/pro/roy-bundle").then((m) => ({ default: m.RoyBundle as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-profiler": dynamic(() =>
    import("@/components/roycss/pro/roy-profiler").then((m) => ({ default: m.RoyProfiler as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-benchmark": dynamic(() =>
    import("@/components/roycss/pro/roy-benchmark").then((m) => ({ default: m.RoyBenchmark as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-observatory": dynamic(() =>
    import("@/components/roycss/pro/roy-observatory").then((m) => ({ default: m.RoyObservatory as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/analytics-dashboard": dynamic(() =>
    import("@/components/roycss/pro/analytics-dashboard").then((m) => ({ default: m.AnalyticsDashboard as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-mentor": dynamic(() =>
    import("@/components/roycss/pro/roy-mentor").then((m) => ({ default: m.RoyMentor as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-challenges": dynamic(() =>
    import("@/components/roycss/pro/roy-challenges").then((m) => ({ default: m.RoyChallenges as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-certifications": dynamic(() =>
    import("@/components/roycss/pro/roy-certifications").then((m) => ({ default: m.RoyCertifications as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-open": dynamic(() =>
    import("@/components/roycss/pro/roy-open").then((m) => ({ default: m.RoyOpen as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-spotlight": dynamic(() =>
    import("@/components/roycss/pro/roy-spotlight").then((m) => ({ default: m.RoySpotlight as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-governance": dynamic(() =>
    import("@/components/roycss/pro/roy-governance").then((m) => ({ default: m.RoyGovernance as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-compliance": dynamic(() =>
    import("@/components/roycss/pro/roy-compliance").then((m) => ({ default: m.RoyCompliance as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-audit-center": dynamic(() =>
    import("@/components/roycss/pro/roy-audit-center").then((m) => ({ default: m.RoyAuditCenter as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-fleet": dynamic(() =>
    import("@/components/roycss/pro/roy-fleet").then((m) => ({ default: m.RoyFleet as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-workspace": dynamic(() =>
    import("@/components/roycss/pro/roy-workspace").then((m) => ({ default: m.RoyWorkspace as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-deploy": dynamic(() =>
    import("@/components/roycss/pro/roy-deploy").then((m) => ({ default: m.RoyDeploy as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-preview": dynamic(() =>
    import("@/components/roycss/pro/roy-preview").then((m) => ({ default: m.RoyPreview as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-cdn": dynamic(() =>
    import("@/components/roycss/pro/roy-cdn").then((m) => ({ default: m.RoyCDN as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-storage": dynamic(() =>
    import("@/components/roycss/pro/roy-storage").then((m) => ({ default: m.RoyStorage as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-edge": dynamic(() =>
    import("@/components/roycss/pro/roy-edge").then((m) => ({ default: m.RoyEdge as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-digital-twin": dynamic(() =>
    import("@/components/roycss/pro/roy-digital-twin").then((m) => ({ default: m.RoyDigitalTwin as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-os": dynamic(() =>
    import("@/components/roycss/pro/roy-os").then((m) => ({ default: m.RoyOS as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-live": dynamic(() =>
    import("@/components/roycss/pro/roy-live").then((m) => ({ default: m.RoyLive as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/academy": dynamic(() =>
    import("@/components/roycss/pro/academy").then((m) => ({ default: m.Academy as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/community-hub": dynamic(() =>
    import("@/components/roycss/pro/community-hub").then((m) => ({ default: m.CommunityHub as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
  "@/components/roycss/pro/roy-showcase": dynamic(() =>
    import("@/components/roycss/pro/roy-showcase").then((m) => ({ default: m.RoyShowcase as ComponentType<unknown> })),
    { ssr: false, loading: ProductLoaderFallback },
  ),
};

/** Shared loading fallback shown by `next/dynamic` while chunks download. */
function ProductLoaderFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading product…</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type CategoryFilter = ProductCategory | "all";
type TierFilter = "all" | ProductTier;
type StatusFilter = "all" | ProductStatus;

/* ═══════════════════════════════════════════════════════════════
   PRODUCT GRID COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export interface ProductGridProps {
  /** Optional callback when a product's "Open in tool sheet" action is invoked. */
  onLaunchTool?: (toolId: string) => void;
  /** Customizable empty-state message. */
  emptyStateMessage?: string;
}

export function ProductGrid({
  onLaunchTool,
  emptyStateMessage = "Try a different search term or pick another pillar.",
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeTier, setActiveTier] = useState<TierFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry | null>(null);

  const counts = useMemo(() => PRODUCT_CATEGORY_COUNTS(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRODUCT_REGISTRY.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;
      const matchesTier = activeTier === "all" || p.tier === activeTier;
      const matchesStatus = activeStatus === "all" || p.status === activeStatus;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.longDescription.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchesCategory && matchesTier && matchesStatus && matchesSearch;
    });
  }, [activeCategory, activeTier, activeStatus, search]);

  const handleOpen = useCallback((product: ProductEntry) => {
    setSelectedProduct(product);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const activeCategoryMeta = PRODUCT_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div>
      {/* ─── Search ──────────────────────────────────────────── */}
      <div className="relative max-w-md mx-auto w-full mb-5">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search 62 products by name, tag, or pillar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-full glass"
          aria-label="Search platform products"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ─── Category Tabs ───────────────────────────────────── */}
      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as CategoryFilter)}
        className="mb-4"
      >
        <div className="flex justify-center">
          <TabsList
            aria-label="Platform product categories"
            className="h-auto flex-wrap gap-1 p-1.5 bg-muted/60 backdrop-blur rounded-xl"
          >
            <TabsTrigger
              value="all"
              className="flex-1 sm:flex-none rounded-lg px-3 py-2 text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-105 data-[state=active]:shadow-primary/30"
            >
              <Layers className="size-3.5" />
              All
              <span className="ml-1 text-[10px] tabular-nums opacity-70">
                {PRODUCT_REGISTRY.length}
              </span>
            </TabsTrigger>
            {PRODUCT_CATEGORIES.map((cat) => {
              const Icon = resolveProductIcon(cat.icon);
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex-1 sm:flex-none rounded-lg px-3 py-2 text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-105 data-[state=active]:shadow-primary/30"
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="sm:hidden">{cat.shortLabel}</span>
                  <span className="ml-1 text-[10px] tabular-nums opacity-70">
                    {counts[cat.id]}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      {/* ─── Tier + Status sub-filters ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-xs">
        {/* Tier */}
        <div
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-0.5"
          role="group"
          aria-label="Filter by tier"
        >
          <FilterPill
            label="All"
            active={activeTier === "all"}
            onClick={() => setActiveTier("all")}
          />
          {(["free", "pro", "team", "enterprise"] as ProductTier[]).map((t) => (
            <FilterPill
              key={t}
              label={PRODUCT_TIER_META[t].label}
              active={activeTier === t}
              onClick={() => setActiveTier(t)}
            />
          ))}
        </div>

        {/* Status */}
        <div
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-0.5"
          role="group"
          aria-label="Filter by status"
        >
          <FilterPill
            label="All"
            active={activeStatus === "all"}
            onClick={() => setActiveStatus("all")}
          />
          <FilterPill
            label="Live"
            active={activeStatus === "live"}
            onClick={() => setActiveStatus("live")}
          />
          <FilterPill
            label="Beta"
            active={activeStatus === "beta"}
            onClick={() => setActiveStatus("beta")}
          />
          <FilterPill
            label="Soon"
            active={activeStatus === "coming-soon"}
            onClick={() => setActiveStatus("coming-soon")}
          />
        </div>
      </div>

      {/* ─── Active category description ────────────────────── */}
      <div className="text-center mb-6 min-h-[1.5rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${activeCategory}-${activeTier}-${activeStatus}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            {activeCategory === "all" ? (
              <>
                Showing{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {filtered.length}
                </span>{" "}
                of {PRODUCT_REGISTRY.length} products
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {activeCategoryMeta?.label}
                </span>{" "}
                — {activeCategoryMeta?.description} ·{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "product" : "products"}
              </>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ─── Grid ────────────────────────────────────────────── */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <ProductCard product={product} onOpen={handleOpen} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ─── Empty state ────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-muted/60 mb-4">
            <SearchIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            No products found
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {emptyStateMessage}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setActiveCategory("all");
              setActiveTier("all");
              setActiveStatus("all");
            }}
          >
            Reset filters
          </Button>
        </div>
      )}

      {/* ─── Product detail Dialog ──────────────────────────── */}
      <ProductModal
        product={selectedProduct}
        onClose={handleClose}
        onLaunchTool={onLaunchTool}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT MODAL — renders the lazy-loaded component for the chosen
   product. Looks the component up in `PRODUCT_LAZY` keyed by the
   product's `componentPath` (the string from the registry).
   ═══════════════════════════════════════════════════════════════ */

interface ProductModalProps {
  product: ProductEntry | null;
  onClose: () => void;
  onLaunchTool?: (toolId: string) => void;
}

function ProductModal({ product, onClose, onLaunchTool }: ProductModalProps) {
  if (!product) return null;

  const LazyComponent = PRODUCT_LAZY[product.componentPath];

  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-3 sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <ProductModalIcon product={product} />
            <span>{product.name}</span>
            <span
              className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${PRODUCT_STATUS_META[product.status].className}`}
            >
              {PRODUCT_STATUS_META[product.status].label}
            </span>
            <span
              className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${PRODUCT_TIER_META[product.tier].className}`}
            >
              {PRODUCT_TIER_META[product.tier].label}
            </span>
          </DialogTitle>
          <DialogDescription>{product.longDescription}</DialogDescription>
        </DialogHeader>
        <div className="p-5">
          {LazyComponent ? (
            <Suspense fallback={<ProductLoaderFallback />}>
              <LazyComponent />
            </Suspense>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Component &ldquo;{product.exportName}&rdquo; not registered for
              path{" "}
              <code className="font-mono text-foreground">
                {product.componentPath}
              </code>
              .
            </div>
          )}
        </div>

        {/* ─── Dialog footer: secondary launch action ──────── */}
        {onLaunchTool && (
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 p-4 bg-background/95 backdrop-blur border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLaunchTool(product.id)}
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              Open in tool sheet
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductModalIcon({ product }: { product: ProductEntry }) {
  const Icon = resolveProductIcon(product.icon);
  return <Icon className="size-5 text-primary" />;
}

/* ═══════════════════════════════════════════════════════════════
   FILTER PILL — small filter chip used by tier & status groups
   ═══════════════════════════════════════════════════════════════ */

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground transition-all"
          : "px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
      }
    >
      {label}
    </button>
  );
}

export default ProductGrid;
