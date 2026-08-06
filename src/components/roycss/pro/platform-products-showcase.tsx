"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Grid3x3, KanbanSquare, Calendar, BarChart3, Palette, Shapes,
  Sparkles, Accessibility, Bot, LayoutGrid, Store, GraduationCap,
  LineChart, Code2, Users, Package, Blocks, Building2, Plug,
  BookOpen, FormInput, Search, Trophy, Layers, Wrench,
  ChevronRight, X,
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
import { ProDataGrid } from "@/components/roycss/pro/data-grid";
import { ProKanbanBoard } from "@/components/roycss/pro/kanban-board";
import { ProScheduler } from "@/components/roycss/pro/scheduler";
import { ProCharts } from "@/components/roycss/pro/charts";
import { ThemeSystem } from "@/components/roycss/pro/theme-system";
import { IconPack } from "@/components/roycss/pro/icon-pack";
import { MotionLibrary } from "@/components/roycss/pro/motion-library";
import { AccessibilitySuite } from "@/components/roycss/pro/accessibility-suite";
import { RoyAI } from "@/components/roycss/pro/roy-ai";
import { VisualStudio } from "@/components/roycss/pro/visual-studio";
import { Marketplace } from "@/components/roycss/pro/marketplace";
import { Academy } from "@/components/roycss/pro/academy";
import { AnalyticsDashboard } from "@/components/roycss/pro/analytics-dashboard";
import { TemplateLibrary } from "@/components/roycss/pro/template-library";
import { CommunityHub } from "@/components/roycss/pro/community-hub";
import { PatternLibrary } from "@/components/roycss/pro/pattern-library";
import { RoyBlocks } from "@/components/roycss/pro/roy-blocks";
import { RoyBlueprints } from "@/components/roycss/pro/roy-blueprints";
import { PluginHub } from "@/components/roycss/pro/plugin-hub";
import { RoyAgents } from "@/components/roycss/pro/roy-agents";
import { RoyStorybook } from "@/components/roycss/pro/roy-storybook";
import { RoyForms } from "@/components/roycss/pro/roy-forms";
import { RoySearch } from "@/components/roycss/pro/roy-search";
import { RoyShowcase } from "@/components/roycss/pro/roy-showcase";

type ProductCategory = "Components" | "Design" | "AI" | "Content" | "Marketplace" | "Community" | "Tools";

interface ProductEntry {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  icon: React.ComponentType<{ className?: string }>;
  status: "ready" | "beta" | "roadmap";
  Component: React.ComponentType;
}

const PRODUCTS: ProductEntry[] = [
  // Components
  { id: "data-grid", name: "Pro Data Grid", description: "Sortable, filterable, paginated data table with 50 rows, row selection, and column visibility.", category: "Components", icon: Grid3x3, status: "ready", Component: ProDataGrid },
  { id: "kanban", name: "Kanban Board", description: "Drag-and-drop board with 4 columns, 14 cards, priority badges, and inline editing.", category: "Components", icon: KanbanSquare, status: "ready", Component: ProKanbanBoard },
  { id: "scheduler", name: "Calendar Scheduler", description: "Month + week views with 11 events, overlap-aware layout, and live 'now' indicator.", category: "Components", icon: Calendar, status: "ready", Component: ProScheduler },
  { id: "charts", name: "Pro Charts", description: "Line, bar, donut, and area charts using recharts with OKLCH colors.", category: "Components", icon: BarChart3, status: "ready", Component: ProCharts },

  // Design
  { id: "theme-system", name: "Theme System", description: "10 production-ready OKLCH theme presets with live preview and CSS variable export.", category: "Design", icon: Palette, status: "ready", Component: ThemeSystem },
  { id: "icon-pack", name: "Icon Pack", description: "158 icons across 7 categories with search, size selector, and click-to-copy imports.", category: "Design", icon: Shapes, status: "ready", Component: IconPack },
  { id: "motion-library", name: "Motion Library", description: "12 framer-motion animation primitives with speed control and code snippets.", category: "Design", icon: Sparkles, status: "ready", Component: MotionLibrary },
  { id: "accessibility", name: "Accessibility Suite", description: "Live DOM audit (10 WCAG checks), a11y score, contrast checker, tab order visualizer.", category: "Design", icon: Accessibility, status: "ready", Component: AccessibilitySuite },

  // AI
  { id: "roy-ai", name: "RoyAI Assistant", description: "Chat assistant that generates CSS, answers questions, and helps with RoyCSS usage.", category: "AI", icon: Bot, status: "ready", Component: RoyAI },
  { id: "roy-agents", name: "Roy Agents", description: "8 specialized AI agents for accessibility, performance, docs, refactoring, security.", category: "AI", icon: Wrench, status: "ready", Component: RoyAgents },

  // Content
  { id: "storybook", name: "Roy Storybook", description: "Component documentation with 10 components, variants, states, props, a11y notes.", category: "Content", icon: BookOpen, status: "ready", Component: RoyStorybook },
  { id: "academy", name: "Roy Academy", description: "4 learning paths, 60 lessons, 4 certifications, progress tracking.", category: "Content", icon: GraduationCap, status: "ready", Component: Academy },
  { id: "template-library", name: "Template Library", description: "8 live template previews (Hero, FeatureGrid, Pricing, Testimonial, etc.).", category: "Content", icon: LayoutGrid, status: "ready", Component: TemplateLibrary },
  { id: "blueprints", name: "Roy Blueprints", description: "8 complete app architectures (Hospital, POS, ERP, HR, Banking) with folder trees.", category: "Content", icon: Building2, status: "ready", Component: RoyBlueprints },

  // Marketplace
  { id: "marketplace", name: "Marketplace", description: "12 templates with search, filter, sort, detail dialogs, and install toasts.", category: "Marketplace", icon: Store, status: "ready", Component: Marketplace },
  { id: "blocks", name: "Roy Blocks", description: "10 application blocks (Auth, Billing, CRM, Healthcare, Analytics) with live previews.", category: "Marketplace", icon: Blocks, status: "ready", Component: RoyBlocks },
  { id: "plugin-hub", name: "Plugin Hub", description: "12 plugins (Stripe, Clerk, Supabase, Firebase) with install commands and changelogs.", category: "Marketplace", icon: Plug, status: "ready", Component: PluginHub },
  { id: "showcase", name: "Roy Showcase", description: "12 curated projects with performance/a11y scores, industry filters, submit form.", category: "Marketplace", icon: Trophy, status: "ready", Component: RoyShowcase },

  // Community
  { id: "community", name: "Community Hub", description: "Stats, 6 contributors, activity feed, leaderboard, discussions, 3 tabs.", category: "Community", icon: Users, status: "ready", Component: CommunityHub },

  // Tools
  { id: "visual-studio", name: "Visual Studio", description: "Drag-and-drop page builder with 8 component types, properties panel, export HTML.", category: "Tools", icon: Layers, status: "ready", Component: VisualStudio },
  { id: "forms", name: "Roy Forms", description: "Visual form builder with 10 field types, multi-step, conditional logic, code export.", category: "Tools", icon: FormInput, status: "ready", Component: RoyForms },
  { id: "search", name: "Roy Search", description: "Universal search across 54 items in 8 content types with keyboard nav and highlighting.", category: "Tools", icon: Search, status: "ready", Component: RoySearch },
  { id: "analytics", name: "Analytics Dashboard", description: "KPI cards, traffic chart, top effects, geo distribution, device donut, time ranges.", category: "Tools", icon: LineChart, status: "ready", Component: AnalyticsDashboard },
  { id: "patterns", name: "Pattern Library", description: "12 interactive UI patterns (Accordion, Toast, CommandMenu, FileUpload, etc.).", category: "Tools", icon: Package, status: "ready", Component: PatternLibrary },
];

const CATEGORIES: (ProductCategory | "All")[] = ["All", "Components", "Design", "AI", "Content", "Marketplace", "Community", "Tools"];

const STATUS_META: Record<string, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  beta: { label: "Beta", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  roadmap: { label: "Coming Soon", className: "bg-muted text-muted-foreground" },
};

export function PlatformProductsShowcase() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry | null>(null);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <section id="products" aria-label="Platform Products" className="py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <Layers className="size-3.5" />
            Platform Products
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            24 Production-Ready Products
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            A complete frontend engineering platform — components, design systems, AI tools,
            marketplace, learning, and more. Click any product to try it live.
          </p>
        </div>

        {/* Search + Category filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-full glass"
              aria-label="Search platform products"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mb-6 text-sm text-muted-foreground">
          {filtered.length} of {PRODUCTS.length} products · {CATEGORIES.length - 1} categories
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const Icon = product.icon;
            const statusMeta = STATUS_META[product.status];
            return (
              <motion.button
                key={product.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedProduct(product)}
                className="group text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer perf-auto"
                aria-label={`Open ${product.name}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-foreground text-sm leading-tight truncate">
                        {product.name}
                      </h3>
                      <span className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full mt-0.5 ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <Badge variant="secondary" className="mt-3 text-[10px] bg-muted/60 text-muted-foreground">
                  {product.category}
                </Badge>
              </motion.button>
            );
          })}
        </div>

        {/* Product detail dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-5 pb-3 sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
              <DialogTitle className="flex items-center gap-2 font-display text-lg">
                {selectedProduct && (() => {
                  const Icon = selectedProduct.icon;
                  return <Icon className="size-5 text-primary" />;
                })()}
                {selectedProduct?.name}
              </DialogTitle>
              <DialogDescription>{selectedProduct?.description}</DialogDescription>
            </DialogHeader>
            <div className="p-5">
              {selectedProduct && (() => {
                const ProductComponent = selectedProduct.Component;
                return <ProductComponent />;
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
