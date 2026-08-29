"use client";

import { useMemo, useState, lazy, Suspense, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PRODUCTS,
  PRODUCT_CATEGORIES,
  PRODUCT_TIERS,
  PRODUCT_STATUSES,
  type ProductEntry,
  type ProductCategory,
  type ProductTier,
  type ProductStatus,
} from "@/lib/product-registry";
import { ProductCard } from "./product-card";

/* ── Per-product lazy loaders ──────────────────────────────────
   Each entry maps a product id → a lazy() that imports the actual
   pro component chunk on demand. The grid only ever mounts one at
   a time (inside the modal), so this is the only chunk fetched. */
type LazyComp = ComponentType<Record<string, never>>;
const LOADERS: Record<string, LazyComp> = {
  "roy-ai": lazy(() => import("@/components/roycss/pro/roy-ai").then(m => ({ default: m.RoyAI }))),
  "roy-architect": lazy(() => import("@/components/roycss/pro/roy-architect").then(m => ({ default: m.RoyArchitect }))),
  "roy-agents": lazy(() => import("@/components/roycss/pro/roy-agents").then(m => ({ default: m.RoyAgents }))),
  "roy-pair": lazy(() => import("@/components/roycss/pro/roy-pair").then(m => ({ default: m.RoyPair }))),
  "roy-mentor": lazy(() => import("@/components/roycss/pro/roy-mentor").then(m => ({ default: m.RoyMentor }))),
  "roy-review": lazy(() => import("@/components/roycss/pro/roy-review").then(m => ({ default: m.RoyReview }))),
  "roy-refactor": lazy(() => import("@/components/roycss/pro/roy-refactor").then(m => ({ default: m.RoyRefactor }))),
  "roy-generator": lazy(() => import("@/components/roycss/pro/roy-generator").then(m => ({ default: m.RoyGenerator }))),
  "roy-scaffold": lazy(() => import("@/components/roycss/pro/roy-scaffold").then(m => ({ default: m.RoyScaffold }))),
  "roy-search": lazy(() => import("@/components/roycss/pro/roy-search").then(m => ({ default: m.RoySearch }))),
  "roy-blocks": lazy(() => import("@/components/roycss/pro/roy-blocks").then(m => ({ default: m.RoyBlocks }))),
  "pattern-library": lazy(() => import("@/components/roycss/pro/pattern-library").then(m => ({ default: m.PatternLibrary }))),
  "template-library": lazy(() => import("@/components/roycss/pro/template-library").then(m => ({ default: m.TemplateLibrary }))),
  "marketplace": lazy(() => import("@/components/roycss/pro/marketplace").then(m => ({ default: m.Marketplace }))),
  "roy-blueprints": lazy(() => import("@/components/roycss/pro/roy-blueprints").then(m => ({ default: m.RoyBlueprints }))),
  "roy-forms": lazy(() => import("@/components/roycss/pro/roy-forms").then(m => ({ default: m.RoyForms }))),
  "data-grid": lazy(() => import("@/components/roycss/pro/data-grid").then(m => ({ default: m.ProDataGrid }))),
  "kanban-board": lazy(() => import("@/components/roycss/pro/kanban-board").then(m => ({ default: m.ProKanbanBoard }))),
  "scheduler": lazy(() => import("@/components/roycss/pro/scheduler").then(m => ({ default: m.ProScheduler }))),
  "charts": lazy(() => import("@/components/roycss/pro/charts").then(m => ({ default: m.ProCharts }))),
  "roy-storybook": lazy(() => import("@/components/roycss/pro/roy-storybook").then(m => ({ default: m.RoyStorybook }))),
  "roy-showcase": lazy(() => import("@/components/roycss/pro/roy-showcase").then(m => ({ default: m.RoyShowcase }))),
  "roy-bundle": lazy(() => import("@/components/roycss/pro/roy-bundle").then(m => ({ default: m.RoyBundle }))),
  "roy-profiler": lazy(() => import("@/components/roycss/pro/roy-profiler").then(m => ({ default: m.RoyProfiler }))),
  "roy-benchmark": lazy(() => import("@/components/roycss/pro/roy-benchmark").then(m => ({ default: m.RoyBenchmark }))),
  "roy-observatory": lazy(() => import("@/components/roycss/pro/roy-observatory").then(m => ({ default: m.RoyObservatory }))),
  "roy-sandbox": lazy(() => import("@/components/roycss/pro/roy-sandbox").then(m => ({ default: m.RoySandbox }))),
  "roy-preview": lazy(() => import("@/components/roycss/pro/roy-preview").then(m => ({ default: m.RoyPreview }))),
  "roy-cdn": lazy(() => import("@/components/roycss/pro/roy-cdn").then(m => ({ default: m.RoyCDN }))),
  "roy-edge": lazy(() => import("@/components/roycss/pro/roy-edge").then(m => ({ default: m.RoyEdge }))),
  "roy-storage": lazy(() => import("@/components/roycss/pro/roy-storage").then(m => ({ default: m.RoyStorage }))),
  "roy-sync": lazy(() => import("@/components/roycss/pro/roy-sync").then(m => ({ default: m.RoySync }))),
  "roy-version": lazy(() => import("@/components/roycss/pro/roy-version").then(m => ({ default: m.RoyVersion }))),
  "roy-deploy": lazy(() => import("@/components/roycss/pro/roy-deploy").then(m => ({ default: m.RoyDeploy }))),
  "roy-live": lazy(() => import("@/components/roycss/pro/roy-live").then(m => ({ default: m.RoyLive }))),
  "roy-open": lazy(() => import("@/components/roycss/pro/roy-open").then(m => ({ default: m.RoyOpen }))),
  "roy-governance": lazy(() => import("@/components/roycss/pro/roy-governance").then(m => ({ default: m.RoyGovernance }))),
  "roy-compliance": lazy(() => import("@/components/roycss/pro/roy-compliance").then(m => ({ default: m.RoyCompliance }))),
  "roy-audit-center": lazy(() => import("@/components/roycss/pro/roy-audit-center").then(m => ({ default: m.RoyAuditCenter }))),
  "roy-fleet": lazy(() => import("@/components/roycss/pro/roy-fleet").then(m => ({ default: m.RoyFleet }))),
  "roy-os": lazy(() => import("@/components/roycss/pro/roy-os").then(m => ({ default: m.RoyOS }))),
  "roy-workspace": lazy(() => import("@/components/roycss/pro/roy-workspace").then(m => ({ default: m.RoyWorkspace }))),
  "roy-digital-twin": lazy(() => import("@/components/roycss/pro/roy-digital-twin").then(m => ({ default: m.RoyDigitalTwin }))),
  "roy-registry": lazy(() => import("@/components/roycss/pro/roy-registry").then(m => ({ default: m.RoyRegistry }))),
  "roy-spotlight": lazy(() => import("@/components/roycss/pro/roy-spotlight").then(m => ({ default: m.RoySpotlight }))),
  "roy-challenges": lazy(() => import("@/components/roycss/pro/roy-challenges").then(m => ({ default: m.RoyChallenges }))),
  "roy-certifications": lazy(() => import("@/components/roycss/pro/roy-certifications").then(m => ({ default: m.RoyCertifications }))),
  "academy": lazy(() => import("@/components/roycss/pro/academy").then(m => ({ default: m.Academy }))),
  "community-hub": lazy(() => import("@/components/roycss/pro/community-hub").then(m => ({ default: m.CommunityHub }))),
  "analytics-dashboard": lazy(() => import("@/components/roycss/pro/analytics-dashboard").then(m => ({ default: m.AnalyticsDashboard }))),
  "accessibility-suite": lazy(() => import("@/components/roycss/pro/accessibility-suite").then(m => ({ default: m.AccessibilitySuite }))),
  "theme-system": lazy(() => import("@/components/roycss/pro/theme-system").then(m => ({ default: m.ThemeSystem }))),
  "icon-pack": lazy(() => import("@/components/roycss/pro/icon-pack").then(m => ({ default: m.IconPack }))),
  "motion-library": lazy(() => import("@/components/roycss/pro/motion-library").then(m => ({ default: m.MotionLibrary }))),
  "visual-studio": lazy(() => import("@/components/roycss/pro/visual-studio").then(m => ({ default: m.VisualStudio }))),
  "roy-color-studio": lazy(() => import("@/components/roycss/pro/roy-color-studio").then(m => ({ default: m.RoyColorStudio }))),
  "roy-typography": lazy(() => import("@/components/roycss/pro/roy-typography").then(m => ({ default: m.RoyTypography }))),
  "roy-motion-studio": lazy(() => import("@/components/roycss/pro/roy-motion-studio").then(m => ({ default: m.RoyMotionStudio }))),
  "roy-gradient-studio": lazy(() => import("@/components/roycss/pro/roy-gradient-studio").then(m => ({ default: m.RoyGradientStudio }))),
  "roy-layout-studio": lazy(() => import("@/components/roycss/pro/roy-layout-studio").then(m => ({ default: m.RoyLayoutStudio }))),
  "roy-designer": lazy(() => import("@/components/roycss/pro/roy-designer").then(m => ({ default: m.RoyDesigner }))),
  "plugin-hub": lazy(() => import("@/components/roycss/pro/plugin-hub").then(m => ({ default: m.PluginHub }))),
};

/* Status tabs: All + ready + beta + experimental (skipping roadmap — no entries use it). */
const STATUS_TABS: { id: ProductStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  ...PRODUCT_STATUSES.filter((s) => s.id !== "roadmap").map((s) => ({ id: s.id, label: s.label })),
];

export function ProductGrid() {
  const [activeCat, setActiveCat] = useState<ProductCategory>("ai");
  const [activeTier, setActiveTier] = useState<ProductTier | "all">("all");
  const [activeStatus, setActiveStatus] = useState<ProductStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openProduct, setOpenProduct] = useState<ProductEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (p.category !== activeCat) return false;
      if (activeTier !== "all" && p.tier !== activeTier) return false;
      if (activeStatus !== "all" && p.status !== activeStatus) return false;
      if (q) {
        const haystack = `${p.name} ${p.shortDescription} ${p.longDescription} ${p.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeCat, activeTier, activeStatus, search]);

  const activeCatMeta = PRODUCT_CATEGORIES.find((c) => c.id === activeCat)!;

  return (
    <div className="space-y-6">
      {/* Header: counts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground capitalize">
            {activeCatMeta.label}
          </h3>
          <p className="text-sm text-muted-foreground">{activeCatMeta.description}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} of {PRODUCTS.length} products
        </Badge>
      </div>

      {/* Category tabs */}
      <div role="tablist" aria-label="Product category" className="flex flex-wrap gap-1.5">
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCat === cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer",
              "min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              activeCat === cat.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters: tier + status + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Product tier" className="flex flex-wrap gap-1">
            {[{ id: "all" as const, label: "All" }, ...PRODUCT_TIERS].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTier === t.id}
                onClick={() => setActiveTier(t.id)}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                  "min-h-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  activeTier === t.id ? "text-primary underline underline-offset-4" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="hidden sm:block size-px h-4 bg-border" aria-hidden />
          <div role="tablist" aria-label="Product status" className="flex flex-wrap gap-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={activeStatus === s.id}
                onClick={() => setActiveStatus(s.id)}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                  "min-h-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  activeStatus === s.id ? "text-primary underline underline-offset-4" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            aria-label="Search products"
          />
        </div>
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={setOpenProduct} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-sm">No products match the current filters.</p>
          <Button variant="link" size="sm" className="mt-2 text-xs"
            onClick={() => { setSearch(""); setActiveTier("all"); setActiveStatus("all"); }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Modal with backdrop close (Radix Dialog handles this natively). */}
      <Dialog open={!!openProduct} onOpenChange={(o) => { if (!o) setOpenProduct(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {openProduct && (
            <>
              <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {openProduct.name}
                  <Badge variant="outline" className="text-[10px] capitalize">{openProduct.tier}</Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">{openProduct.status}</Badge>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {openProduct.longDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto bg-muted/30 p-3 sm:p-4">
                <Suspense fallback={<ModalLoading />}>
                  {(() => {
                    const Loader = LOADERS[openProduct.id];
                    if (!Loader) return <MissingComponent id={openProduct.id} />;
                    const C = Loader as ComponentType;
                    return <C />;
                  })()}
                </Suspense>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModalLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground" role="status">
      <Loader2 className="size-5 mr-2 animate-spin" />
      <span className="text-sm">Loading product...</span>
    </div>
  );
}

function MissingComponent({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <X className="size-6 mb-2" />
      <p className="text-sm">Component not registered for product <code className="text-xs px-1.5 py-0.5 rounded bg-muted">{id}</code>.</p>
    </div>
  );
}
