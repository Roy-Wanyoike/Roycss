"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Grid3x3, KanbanSquare, Calendar, BarChart3, Palette, Shapes,
  Sparkles, Accessibility, Bot, LayoutGrid, Store, GraduationCap,
  LineChart, Code2, Users, Package, Blocks, Building2, Plug,
  BookOpen, FormInput, Search, Trophy, Layers, Wrench,
  ChevronRight, X, Shield, Award, Loader2,
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
// Lazy-load all product components — they only load when a user clicks a product card.
// This prevents 62 heavy components from loading on initial page render.
const ProDataGrid = lazy(() => import("@/components/roycss/pro/data-grid").then(m => ({ default: m.ProDataGrid })));
const ProKanbanBoard = lazy(() => import("@/components/roycss/pro/kanban-board").then(m => ({ default: m.ProKanbanBoard })));
const ProScheduler = lazy(() => import("@/components/roycss/pro/scheduler").then(m => ({ default: m.ProScheduler })));
const ProCharts = lazy(() => import("@/components/roycss/pro/charts").then(m => ({ default: m.ProCharts })));
const ThemeSystem = lazy(() => import("@/components/roycss/pro/theme-system").then(m => ({ default: m.ThemeSystem })));
const IconPack = lazy(() => import("@/components/roycss/pro/icon-pack").then(m => ({ default: m.IconPack })));
const MotionLibrary = lazy(() => import("@/components/roycss/pro/motion-library").then(m => ({ default: m.MotionLibrary })));
const AccessibilitySuite = lazy(() => import("@/components/roycss/pro/accessibility-suite").then(m => ({ default: m.AccessibilitySuite })));
const RoyAI = lazy(() => import("@/components/roycss/pro/roy-ai").then(m => ({ default: m.RoyAI })));
const VisualStudio = lazy(() => import("@/components/roycss/pro/visual-studio").then(m => ({ default: m.VisualStudio })));
const Marketplace = lazy(() => import("@/components/roycss/pro/marketplace").then(m => ({ default: m.Marketplace })));
const Academy = lazy(() => import("@/components/roycss/pro/academy").then(m => ({ default: m.Academy })));
const AnalyticsDashboard = lazy(() => import("@/components/roycss/pro/analytics-dashboard").then(m => ({ default: m.AnalyticsDashboard })));
const TemplateLibrary = lazy(() => import("@/components/roycss/pro/template-library").then(m => ({ default: m.TemplateLibrary })));
const CommunityHub = lazy(() => import("@/components/roycss/pro/community-hub").then(m => ({ default: m.CommunityHub })));
const PatternLibrary = lazy(() => import("@/components/roycss/pro/pattern-library").then(m => ({ default: m.PatternLibrary })));
const RoyBlocks = lazy(() => import("@/components/roycss/pro/roy-blocks").then(m => ({ default: m.RoyBlocks })));
const RoyBlueprints = lazy(() => import("@/components/roycss/pro/roy-blueprints").then(m => ({ default: m.RoyBlueprints })));
const PluginHub = lazy(() => import("@/components/roycss/pro/plugin-hub").then(m => ({ default: m.PluginHub })));
const RoyAgents = lazy(() => import("@/components/roycss/pro/roy-agents").then(m => ({ default: m.RoyAgents })));
const RoyStorybook = lazy(() => import("@/components/roycss/pro/roy-storybook").then(m => ({ default: m.RoyStorybook })));
const RoyForms = lazy(() => import("@/components/roycss/pro/roy-forms").then(m => ({ default: m.RoyForms })));
const RoySearch = lazy(() => import("@/components/roycss/pro/roy-search").then(m => ({ default: m.RoySearch })));
const RoyShowcase = lazy(() => import("@/components/roycss/pro/roy-showcase").then(m => ({ default: m.RoyShowcase })));
const RoyArchitect = lazy(() => import("@/components/roycss/pro/roy-architect").then(m => ({ default: m.RoyArchitect })));
const RoyReview = lazy(() => import("@/components/roycss/pro/roy-review").then(m => ({ default: m.RoyReview })));
const RoyRefactor = lazy(() => import("@/components/roycss/pro/roy-refactor").then(m => ({ default: m.RoyRefactor })));
const RoyPair = lazy(() => import("@/components/roycss/pro/roy-pair").then(m => ({ default: m.RoyPair })));
const RoyDesigner = lazy(() => import("@/components/roycss/pro/roy-designer").then(m => ({ default: m.RoyDesigner })));
const RoyScaffold = lazy(() => import("@/components/roycss/pro/roy-scaffold").then(m => ({ default: m.RoyScaffold })));
const RoyGenerator = lazy(() => import("@/components/roycss/pro/roy-generator").then(m => ({ default: m.RoyGenerator })));
const RoySync = lazy(() => import("@/components/roycss/pro/roy-sync").then(m => ({ default: m.RoySync })));
const RoyVersion = lazy(() => import("@/components/roycss/pro/roy-version").then(m => ({ default: m.RoyVersion })));
const RoyRegistry = lazy(() => import("@/components/roycss/pro/roy-registry").then(m => ({ default: m.RoyRegistry })));
const RoyMotionStudio = lazy(() => import("@/components/roycss/pro/roy-motion-studio").then(m => ({ default: m.RoyMotionStudio })));
const RoyGradientStudio = lazy(() => import("@/components/roycss/pro/roy-gradient-studio").then(m => ({ default: m.RoyGradientStudio })));
const RoyTypography = lazy(() => import("@/components/roycss/pro/roy-typography").then(m => ({ default: m.RoyTypography })));
const RoyColorStudio = lazy(() => import("@/components/roycss/pro/roy-color-studio").then(m => ({ default: m.RoyColorStudio })));
const RoyLayoutStudio = lazy(() => import("@/components/roycss/pro/roy-layout-studio").then(m => ({ default: m.RoyLayoutStudio })));
const RoyGovernance = lazy(() => import("@/components/roycss/pro/roy-governance").then(m => ({ default: m.RoyGovernance })));
const RoyCompliance = lazy(() => import("@/components/roycss/pro/roy-compliance").then(m => ({ default: m.RoyCompliance })));
const RoyAuditCenter = lazy(() => import("@/components/roycss/pro/roy-audit-center").then(m => ({ default: m.RoyAuditCenter })));
const RoySandbox = lazy(() => import("@/components/roycss/pro/roy-sandbox").then(m => ({ default: m.RoySandbox })));
const RoyMentor = lazy(() => import("@/components/roycss/pro/roy-mentor").then(m => ({ default: m.RoyMentor })));
const RoyChallenges = lazy(() => import("@/components/roycss/pro/roy-challenges").then(m => ({ default: m.RoyChallenges })));
const RoyProfiler = lazy(() => import("@/components/roycss/pro/roy-profiler").then(m => ({ default: m.RoyProfiler })));
const RoyBundle = lazy(() => import("@/components/roycss/pro/roy-bundle").then(m => ({ default: m.RoyBundle })));
const RoyObservatory = lazy(() => import("@/components/roycss/pro/roy-observatory").then(m => ({ default: m.RoyObservatory })));
const RoyOS = lazy(() => import("@/components/roycss/pro/roy-os").then(m => ({ default: m.RoyOS })));
const RoyFleet = lazy(() => import("@/components/roycss/pro/roy-fleet").then(m => ({ default: m.RoyFleet })));
const RoyWorkspace = lazy(() => import("@/components/roycss/pro/roy-workspace").then(m => ({ default: m.RoyWorkspace })));
const RoyDeploy = lazy(() => import("@/components/roycss/pro/roy-deploy").then(m => ({ default: m.RoyDeploy })));
const RoyPreview = lazy(() => import("@/components/roycss/pro/roy-preview").then(m => ({ default: m.RoyPreview })));
const RoyCDN = lazy(() => import("@/components/roycss/pro/roy-cdn").then(m => ({ default: m.RoyCDN })));
const RoyStorage = lazy(() => import("@/components/roycss/pro/roy-storage").then(m => ({ default: m.RoyStorage })));
const RoyEdge = lazy(() => import("@/components/roycss/pro/roy-edge").then(m => ({ default: m.RoyEdge })));
const RoyCertifications = lazy(() => import("@/components/roycss/pro/roy-certifications").then(m => ({ default: m.RoyCertifications })));
const RoyOpen = lazy(() => import("@/components/roycss/pro/roy-open").then(m => ({ default: m.RoyOpen })));
const RoySpotlight = lazy(() => import("@/components/roycss/pro/roy-spotlight").then(m => ({ default: m.RoySpotlight })));
const RoyDigitalTwin = lazy(() => import("@/components/roycss/pro/roy-digital-twin").then(m => ({ default: m.RoyDigitalTwin })));
const RoyLive = lazy(() => import("@/components/roycss/pro/roy-live").then(m => ({ default: m.RoyLive })));
const RoyBenchmark = lazy(() => import("@/components/roycss/pro/roy-benchmark").then(m => ({ default: m.RoyBenchmark })));

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

  // AI & Engineering (next-gen)
  { id: "architect", name: "Roy Architect", description: "AI application architect — generates folder structure, tech stack, APIs, and deployment plans from requirements.", category: "AI", icon: Building2, status: "ready", Component: RoyArchitect },
  { id: "review", name: "Roy Review", description: "AI code reviewer — paste code, get score, findings by severity, and fix recommendations.", category: "AI", icon: Wrench, status: "ready", Component: RoyReview },
  { id: "refactor", name: "Roy Refactor", description: "Code modernizer — Bootstrap/Tailwind/Material → RoyCSS with OKLCH, logical properties, diff view.", category: "AI", icon: Wrench, status: "ready", Component: RoyRefactor },
  { id: "pair", name: "Roy Pair", description: "AI pair programmer chat — specialized for RoyCSS, code highlighting, suggestion chips.", category: "AI", icon: Bot, status: "ready", Component: RoyPair },
  { id: "designer", name: "Roy Designer", description: "AI UI designer — prompt → mockup preview, color palette, typography, component list.", category: "AI", icon: Bot, status: "ready", Component: RoyDesigner },

  // Engineering Platform (next-gen)
  { id: "scaffold", name: "Roy Scaffold", description: "Project scaffolding — 8 project types, framework/db/auth selectors, folder tree generation.", category: "Tools", icon: Layers, status: "ready", Component: RoyScaffold },
  { id: "generator", name: "Roy Generator", description: "Code generator — Component/Form/CRUD/Table/Dashboard/API with configurable options.", category: "Tools", icon: Code2, status: "ready", Component: RoyGenerator },
  { id: "sync", name: "Roy Sync", description: "Sync hub — Figma, GitHub, Tokens, Theme with status, sync log, sync all.", category: "Tools", icon: Layers, status: "ready", Component: RoySync },
  { id: "version", name: "Roy Version", description: "Version management — current/latest, dependency graph, breaking changes, upgrade simulator.", category: "Tools", icon: Layers, status: "ready", Component: RoyVersion },
  { id: "registry", name: "Roy Registry", description: "Package registry — 10 packages, public/private/internal, publish, detail dialog.", category: "Tools", icon: Package, status: "ready", Component: RoyRegistry },

  // Design Platform (next-gen)
  { id: "motion-studio", name: "Motion Studio", description: "Visual animation builder — 5-track timeline, draggable keyframes, easing, live preview, export.", category: "Design", icon: Sparkles, status: "ready", Component: RoyMotionStudio },
  { id: "gradient-studio", name: "Gradient Studio", description: "Advanced gradients — Linear/Radial/Conic/Mesh, noise texture, animated, aurora, 6 presets.", category: "Design", icon: Palette, status: "ready", Component: RoyGradientStudio },
  { id: "typography", name: "Roy Typography", description: "Type scale generator — fluid clamp, modular ratios, variable font config, reading tips.", category: "Design", icon: Palette, status: "ready", Component: RoyTypography },
  { id: "color-studio", name: "Color Studio", description: "Enterprise color management — 11-step OKLCH scale, WCAG validation, brand generation.", category: "Design", icon: Palette, status: "ready", Component: RoyColorStudio },
  { id: "layout-studio", name: "Layout Studio", description: "Visual grid builder — CSS Grid template-areas, Flexbox, Masonry, Container Queries.", category: "Design", icon: LayoutGrid, status: "ready", Component: RoyLayoutStudio },

  // Enterprise (next-gen)
  { id: "governance", name: "Roy Governance", description: "Design system governance — approval queue, team, policies, audit log.", category: "Tools", icon: Shield, status: "ready", Component: RoyGovernance },
  { id: "compliance", name: "Roy Compliance", description: "Compliance reporting — WCAG/ADA/Section 508, scan, findings, report download.", category: "Tools", icon: Shield, status: "ready", Component: RoyCompliance },
  { id: "audit-center", name: "Audit Center", description: "Enterprise audit dashboard — 5 projects, a11y/perf/security scores, trend, issues.", category: "Tools", icon: Shield, status: "ready", Component: RoyAuditCenter },
  { id: "fleet", name: "Roy Fleet", description: "Manage hundreds of RoyCSS projects — status, version, health score, scan all.", category: "Tools", icon: Layers, status: "ready", Component: RoyFleet },
  { id: "workspace", name: "Roy Workspace", description: "Company workspace — shared templates, tokens, components, projects, team members.", category: "Community", icon: Users, status: "ready", Component: RoyWorkspace },

  // Cloud (next-gen)
  { id: "sandbox", name: "Roy Sandbox", description: "Online dev environment — HTML/CSS/JS editors, live iframe preview, templates, share.", category: "Tools", icon: Code2, status: "ready", Component: RoySandbox },
  { id: "preview", name: "Roy Preview", description: "Shareable preview environments for branches and pull requests.", category: "Tools", icon: Layers, status: "ready", Component: RoyPreview },
  { id: "cdn", name: "Roy CDN", description: "CDN dashboard — requests, bandwidth, cache hit rate, edge locations, purge cache.", category: "Tools", icon: Layers, status: "ready", Component: RoyCDN },
  { id: "storage", name: "Roy Storage", description: "Cloud storage — file browser, upload, usage bar, breadcrumb, search.", category: "Tools", icon: Package, status: "ready", Component: RoyStorage },
  { id: "edge", name: "Roy Edge", description: "Edge deployment — 6 regions, latency, TTL, cache strategy, edge-vs-origin comparison.", category: "Tools", icon: Layers, status: "ready", Component: RoyEdge },
  { id: "deploy", name: "Roy Deploy", description: "One-click deployment — Vercel/Netlify/Cloudflare/AWS/Azure/GCP, history, env vars.", category: "Tools", icon: Layers, status: "ready", Component: RoyDeploy },

  // Learning (next-gen)
  { id: "mentor", name: "Roy Mentor", description: "AI tutor chat — skill levels, topic chips, code examples, XP tracker.", category: "Content", icon: GraduationCap, status: "ready", Component: RoyMentor },
  { id: "challenges", name: "Roy Challenges", description: "Coding challenges — 8 challenges, difficulty, validator, leaderboard, XP.", category: "Content", icon: Trophy, status: "ready", Component: RoyChallenges },
  { id: "certifications", name: "Roy Certifications", description: "Certification platform — 4 levels, exam scheduling, verification, earned certs.", category: "Content", icon: Award, status: "ready", Component: RoyCertifications },

  // Community (next-gen)
  { id: "open", name: "Roy Open", description: "Open-source hub — good first issues, RFCs, roadmap, contributor stats.", category: "Community", icon: Users, status: "ready", Component: RoyOpen },
  { id: "spotlight", name: "Roy Spotlight", description: "Featured developer showcase — templates, components, plugins, projects, submit.", category: "Community", icon: Trophy, status: "ready", Component: RoySpotlight },

  // Analysis (next-gen)
  { id: "profiler", name: "Roy Profiler", description: "Frontend profiler — render phases, CLS, memory, FPS, recommendations.", category: "Tools", icon: LineChart, status: "ready", Component: RoyProfiler },
  { id: "bundle", name: "Roy Bundle", description: "Bundle optimizer — size breakdown, duplicates, dead CSS, oversized, before/after.", category: "Tools", icon: Package, status: "ready", Component: RoyBundle },
  { id: "observatory", name: "Roy Observatory", description: "Production monitoring — CWV, error rate, uptime, alerts, 7-day trend.", category: "Tools", icon: LineChart, status: "ready", Component: RoyObservatory },

  // Moonshots
  { id: "os", name: "Roy OS", description: "Unified workspace dashboard — 12 product tiles, quick actions, activity feed, global search.", category: "Tools", icon: Layers, status: "beta", Component: RoyOS },
  { id: "digital-twin", name: "Roy Digital Twin", description: "Digital twin simulator — performance, accessibility, user journeys, device compatibility.", category: "Tools", icon: Layers, status: "beta", Component: RoyDigitalTwin },
  { id: "live", name: "Roy Live", description: "Real-time collaboration — multiplayer editing, presence cursors, comments, share.", category: "Community", icon: Users, status: "beta", Component: RoyLive },
  { id: "benchmark", name: "Roy Benchmark", description: "Benchmarking platform — compare against industry averages and best-in-class.", category: "Tools", icon: LineChart, status: "beta", Component: RoyBenchmark },
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
            60+ Platform Products
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            A complete AI-native frontend engineering platform — components, design systems, AI tools,
            marketplace, learning, enterprise, cloud, and more. Click any product to try it live.
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
              {selectedProduct && (
                <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
                  {(() => {
                    const ProductComponent = selectedProduct.Component;
                    return <ProductComponent />;
                  })()}
                </Suspense>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
