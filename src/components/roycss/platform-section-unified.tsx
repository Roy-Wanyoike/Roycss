"use client";

/**
 * PlatformSectionUnified — single, authoritative "RoyCSS Platform" section.
 *
 * Replaces BOTH:
 *   - PlatformEcosystem (16 vision products — repurposed as "Why RoyCSS")
 *   - PlatformProductsShowcase (62 live products — this file inherits them)
 *
 * All 62 lazy-loaded products are re-categorized into 6 clear pillars:
 *   Build · Design · AI · Developer Tools · Enterprise · Learning & Community
 *
 * Clicking a card opens a Dialog with the lazy-loaded component (Suspense
 * fallback shows a spinner). The optional `onLaunchTool` prop is surfaced as a
 * secondary "Open in tool sheet" action inside the dialog — reserved for the
 * ~70 differentiator tools that live in the legacy PlatformEcosystem file.
 */

import { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3x3, KanbanSquare, Calendar, BarChart3, Palette, Shapes,
  Sparkles, Accessibility, Bot, LayoutGrid, Store, GraduationCap,
  LineChart, Code2, Users, Package, Blocks, Building2, Plug,
  BookOpen, FormInput, Search as SearchIcon, Trophy, Layers, Wrench,
  ChevronRight, Shield, Award, Loader2, BrainCircuit, Hammer,
  X, ExternalLink,
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

/* ═══════════════════════════════════════════════════════════════
   LAZY IMPORTS — copied verbatim from pro/platform-products-showcase.tsx
   (single source of truth for the 62 live product components)
   ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type UnifiedCategory =
  | "Build"
  | "Design"
  | "AI"
  | "Developer Tools"
  | "Enterprise"
  | "Learning & Community";

type ProductTier = "free" | "pro" | "enterprise" | "cloud";

type ProductStatus = "ready" | "beta" | "roadmap";

interface ProductEntry {
  id: string;
  name: string;
  description: string;
  category: UnifiedCategory;
  tier: ProductTier;
  icon: React.ComponentType<{ className?: string }>;
  status: ProductStatus;
  Component: React.ComponentType;
}

interface CategoryMeta {
  id: UnifiedCategory;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY METADATA — 6 pillars
   ═══════════════════════════════════════════════════════════════ */
const CATEGORY_META: CategoryMeta[] = [
  {
    id: "Build",
    label: "Build",
    shortLabel: "Build",
    icon: Hammer,
    description: "Components, blocks, patterns, templates & marketplace",
  },
  {
    id: "Design",
    label: "Design",
    shortLabel: "Design",
    icon: Palette,
    description: "Studios for theme, color, type, layout, motion & icons",
  },
  {
    id: "AI",
    label: "AI",
    shortLabel: "AI",
    icon: BrainCircuit,
    description: "Assistants, agents & code intelligence",
  },
  {
    id: "Developer Tools",
    label: "Developer Tools",
    shortLabel: "DevTools",
    icon: Wrench,
    description: "Scaffold, sync, ship, profile & benchmark",
  },
  {
    id: "Enterprise",
    label: "Enterprise",
    shortLabel: "Enterprise",
    icon: Building2,
    description: "Governance, compliance, fleet, cloud & ops",
  },
  {
    id: "Learning & Community",
    label: "Learning & Community",
    shortLabel: "Learning",
    icon: GraduationCap,
    description: "Academy, community hub & showcase",
  },
];

/* ═══════════════════════════════════════════════════════════════
   PRODUCTS — 62 entries re-categorized into the 6 pillars
   ═══════════════════════════════════════════════════════════════ */
const PRODUCTS: ProductEntry[] = [
  /* ── Build (12) ─────────────────────────────────────────────── */
  { id: "data-grid", name: "Pro Data Grid", description: "Sortable, filterable, paginated data table with 50 rows, row selection, and column visibility.", category: "Build", icon: Grid3x3, status: "ready", Component: ProDataGrid, tier: "pro" },
  { id: "kanban", name: "Kanban Board", description: "Drag-and-drop board with 4 columns, 14 cards, priority badges, and inline editing.", category: "Build", icon: KanbanSquare, status: "ready", Component: ProKanbanBoard, tier: "pro" },
  { id: "scheduler", name: "Calendar Scheduler", description: "Month + week views with 11 events, overlap-aware layout, and live 'now' indicator.", category: "Build", icon: Calendar, status: "ready", Component: ProScheduler, tier: "pro" },
  { id: "charts", name: "Pro Charts", description: "Line, bar, donut, and area charts using recharts with OKLCH colors.", category: "Build", icon: BarChart3, status: "ready", Component: ProCharts, tier: "pro" },
  { id: "blocks", name: "Roy Blocks", description: "10 application blocks (Auth, Billing, CRM, Healthcare, Analytics) with live previews.", category: "Build", icon: Blocks, status: "ready", Component: RoyBlocks, tier: "pro" },
  { id: "patterns", name: "Pattern Library", description: "12 interactive UI patterns (Accordion, Toast, CommandMenu, FileUpload, etc.).", category: "Build", icon: Package, status: "ready", Component: PatternLibrary, tier: "pro" },
  { id: "template-library", name: "Template Library", description: "8 live template previews (Hero, FeatureGrid, Pricing, Testimonial, etc.).", category: "Build", icon: LayoutGrid, status: "ready", Component: TemplateLibrary, tier: "pro" },
  { id: "blueprints", name: "Roy Blueprints", description: "8 complete app architectures (Hospital, POS, ERP, HR, Banking) with folder trees.", category: "Build", icon: Building2, status: "ready", Component: RoyBlueprints, tier: "pro" },
  { id: "marketplace", name: "Marketplace", description: "12 templates with search, filter, sort, detail dialogs, and install toasts.", category: "Build", icon: Store, status: "ready", Component: Marketplace, tier: "pro" },
  { id: "plugin-hub", name: "Plugin Hub", description: "12 plugins (Stripe, Clerk, Supabase, Firebase) with install commands and changelogs.", category: "Build", icon: Plug, status: "ready", Component: PluginHub, tier: "pro" },
  { id: "forms", name: "Roy Forms", description: "Visual form builder with 10 field types, multi-step, conditional logic, code export.", category: "Build", icon: FormInput, status: "ready", Component: RoyForms, tier: "pro" },
  { id: "storybook", name: "Roy Storybook", description: "Component documentation with 10 components, variants, states, props, a11y notes.", category: "Build", icon: BookOpen, status: "ready", Component: RoyStorybook, tier: "pro" },

  /* ── Design (10) ───────────────────────────────────────────── */
  { id: "visual-studio", name: "Visual Studio", description: "Drag-and-drop page builder with 8 component types, properties panel, export HTML.", category: "Design", icon: Layers, status: "ready", Component: VisualStudio, tier: "pro" },
  { id: "theme-system", name: "Theme System", description: "10 production-ready OKLCH theme presets with live preview and CSS variable export.", category: "Design", icon: Palette, status: "ready", Component: ThemeSystem, tier: "pro" },
  { id: "color-studio", name: "Color Studio", description: "Enterprise color management — 11-step OKLCH scale, WCAG validation, brand generation.", category: "Design", icon: Palette, status: "ready", Component: RoyColorStudio, tier: "pro" },
  { id: "gradient-studio", name: "Gradient Studio", description: "Advanced gradients — Linear/Radial/Conic/Mesh, noise texture, animated, aurora, 6 presets.", category: "Design", icon: Palette, status: "ready", Component: RoyGradientStudio, tier: "pro" },
  { id: "typography", name: "Roy Typography", description: "Type scale generator — fluid clamp, modular ratios, variable font config, reading tips.", category: "Design", icon: Palette, status: "ready", Component: RoyTypography, tier: "pro" },
  { id: "layout-studio", name: "Layout Studio", description: "Visual grid builder — CSS Grid template-areas, Flexbox, Masonry, Container Queries.", category: "Design", icon: LayoutGrid, status: "ready", Component: RoyLayoutStudio, tier: "pro" },
  { id: "motion-studio", name: "Motion Studio", description: "Visual animation builder — 5-track timeline, draggable keyframes, easing, live preview, export.", category: "Design", icon: Sparkles, status: "ready", Component: RoyMotionStudio, tier: "pro" },
  { id: "motion-library", name: "Motion Library", description: "12 framer-motion animation primitives with speed control and code snippets.", category: "Design", icon: Sparkles, status: "ready", Component: MotionLibrary, tier: "pro" },
  { id: "icon-pack", name: "Icon Pack", description: "158 icons across 7 categories with search, size selector, and click-to-copy imports.", category: "Design", icon: Shapes, status: "ready", Component: IconPack, tier: "pro" },
  { id: "accessibility", name: "Accessibility Suite", description: "Live DOM audit (10 WCAG checks), a11y score, contrast checker, tab order visualizer.", category: "Design", icon: Accessibility, status: "ready", Component: AccessibilitySuite, tier: "pro" },

  /* ── AI (10) ───────────────────────────────────────────────── */
  { id: "roy-ai", name: "RoyAI Assistant", description: "Chat assistant that generates CSS, answers questions, and helps with RoyCSS usage.", category: "AI", icon: Bot, status: "ready", Component: RoyAI, tier: "pro" },
  { id: "roy-agents", name: "Roy Agents", description: "8 specialized AI agents for accessibility, performance, docs, refactoring, security.", category: "AI", icon: Wrench, status: "ready", Component: RoyAgents, tier: "pro" },
  { id: "architect", name: "Roy Architect", description: "AI application architect — generates folder structure, tech stack, APIs, and deployment plans from requirements.", category: "AI", icon: Building2, status: "ready", Component: RoyArchitect, tier: "enterprise" },
  { id: "review", name: "Roy Review", description: "AI code reviewer — paste code, get score, findings by severity, and fix recommendations.", category: "AI", icon: Wrench, status: "ready", Component: RoyReview, tier: "enterprise" },
  { id: "refactor", name: "Roy Refactor", description: "Code modernizer — Bootstrap/Tailwind/Material → RoyCSS with OKLCH, logical properties, diff view.", category: "AI", icon: Wrench, status: "ready", Component: RoyRefactor, tier: "pro" },
  { id: "pair", name: "Roy Pair", description: "AI pair programmer chat — specialized for RoyCSS, code highlighting, suggestion chips.", category: "AI", icon: Bot, status: "ready", Component: RoyPair, tier: "pro" },
  { id: "designer", name: "Roy Designer", description: "AI UI designer — prompt → mockup preview, color palette, typography, component list.", category: "AI", icon: Bot, status: "ready", Component: RoyDesigner, tier: "enterprise" },
  { id: "generator", name: "Roy Generator", description: "Code generator — Component/Form/CRUD/Table/Dashboard/API with configurable options.", category: "AI", icon: Code2, status: "ready", Component: RoyGenerator, tier: "pro" },
  { id: "search", name: "Roy Search", description: "Universal AI search across 54 items in 8 content types with keyboard nav and highlighting.", category: "AI", icon: SearchIcon, status: "ready", Component: RoySearch, tier: "pro" },
  { id: "sandbox", name: "Roy Sandbox", description: "Online dev environment — HTML/CSS/JS editors, live iframe preview, templates, share.", category: "AI", icon: Code2, status: "ready", Component: RoySandbox, tier: "cloud" },

  /* ── Developer Tools (14) ─────────────────────────────────── */
  { id: "scaffold", name: "Roy Scaffold", description: "Project scaffolding — 8 project types, framework/db/auth selectors, folder tree generation.", category: "Developer Tools", icon: Layers, status: "ready", Component: RoyScaffold, tier: "pro" },
  { id: "sync", name: "Roy Sync", description: "Sync hub — Figma, GitHub, Tokens, Theme with status, sync log, sync all.", category: "Developer Tools", icon: Layers, status: "ready", Component: RoySync, tier: "enterprise" },
  { id: "version", name: "Roy Version", description: "Version management — current/latest, dependency graph, breaking changes, upgrade simulator.", category: "Developer Tools", icon: Layers, status: "ready", Component: RoyVersion, tier: "pro" },
  { id: "registry", name: "Roy Registry", description: "Package registry — 10 packages, public/private/internal, publish, detail dialog.", category: "Developer Tools", icon: Package, status: "ready", Component: RoyRegistry, tier: "enterprise" },
  { id: "bundle", name: "Roy Bundle", description: "Bundle optimizer — size breakdown, duplicates, dead CSS, oversized, before/after.", category: "Developer Tools", icon: Package, status: "ready", Component: RoyBundle, tier: "pro" },
  { id: "profiler", name: "Roy Profiler", description: "Frontend profiler — render phases, CLS, memory, FPS, recommendations.", category: "Developer Tools", icon: LineChart, status: "ready", Component: RoyProfiler, tier: "pro" },
  { id: "benchmark", name: "Roy Benchmark", description: "Benchmarking platform — compare against industry averages and best-in-class.", category: "Developer Tools", icon: LineChart, status: "beta", Component: RoyBenchmark, tier: "pro" },
  { id: "observatory", name: "Roy Observatory", description: "Production monitoring — CWV, error rate, uptime, alerts, 7-day trend.", category: "Developer Tools", icon: LineChart, status: "ready", Component: RoyObservatory, tier: "cloud" },
  { id: "analytics", name: "Analytics Dashboard", description: "KPI cards, traffic chart, top effects, geo distribution, device donut, time ranges.", category: "Developer Tools", icon: LineChart, status: "ready", Component: AnalyticsDashboard, tier: "pro" },
  { id: "mentor", name: "Roy Mentor", description: "AI tutor chat — skill levels, topic chips, code examples, XP tracker.", category: "Developer Tools", icon: GraduationCap, status: "ready", Component: RoyMentor, tier: "free" },
  { id: "challenges", name: "Roy Challenges", description: "Coding challenges — 8 challenges, difficulty, validator, leaderboard, XP.", category: "Developer Tools", icon: Trophy, status: "ready", Component: RoyChallenges, tier: "free" },
  { id: "certifications", name: "Roy Certifications", description: "Certification platform — 4 levels, exam scheduling, verification, earned certs.", category: "Developer Tools", icon: Award, status: "ready", Component: RoyCertifications, tier: "pro" },
  { id: "open", name: "Roy Open", description: "Open-source hub — good first issues, RFCs, roadmap, contributor stats.", category: "Developer Tools", icon: Users, status: "ready", Component: RoyOpen, tier: "free" },
  { id: "spotlight", name: "Roy Spotlight", description: "Featured developer showcase — templates, components, plugins, projects, submit.", category: "Developer Tools", icon: Trophy, status: "ready", Component: RoySpotlight, tier: "free" },

  /* ── Enterprise (13) ──────────────────────────────────────── */
  { id: "governance", name: "Roy Governance", description: "Design system governance — approval queue, team, policies, audit log.", category: "Enterprise", icon: Shield, status: "ready", Component: RoyGovernance, tier: "enterprise" },
  { id: "compliance", name: "Roy Compliance", description: "Compliance reporting — WCAG/ADA/Section 508, scan, findings, report download.", category: "Enterprise", icon: Shield, status: "ready", Component: RoyCompliance, tier: "enterprise" },
  { id: "audit-center", name: "Audit Center", description: "Enterprise audit dashboard — 5 projects, a11y/perf/security scores, trend, issues.", category: "Enterprise", icon: Shield, status: "ready", Component: RoyAuditCenter, tier: "enterprise" },
  { id: "fleet", name: "Roy Fleet", description: "Manage hundreds of RoyCSS projects — status, version, health score, scan all.", category: "Enterprise", icon: Layers, status: "ready", Component: RoyFleet, tier: "enterprise" },
  { id: "workspace", name: "Roy Workspace", description: "Company workspace — shared templates, tokens, components, projects, team members.", category: "Enterprise", icon: Users, status: "ready", Component: RoyWorkspace, tier: "enterprise" },
  { id: "deploy", name: "Roy Deploy", description: "One-click deployment — Vercel/Netlify/Cloudflare/AWS/Azure/GCP, history, env vars.", category: "Enterprise", icon: Layers, status: "ready", Component: RoyDeploy, tier: "cloud" },
  { id: "preview", name: "Roy Preview", description: "Shareable preview environments for branches and pull requests.", category: "Enterprise", icon: Layers, status: "ready", Component: RoyPreview, tier: "cloud" },
  { id: "cdn", name: "Roy CDN", description: "CDN dashboard — requests, bandwidth, cache hit rate, edge locations, purge cache.", category: "Enterprise", icon: Layers, status: "ready", Component: RoyCDN, tier: "cloud" },
  { id: "storage", name: "Roy Storage", description: "Cloud storage — file browser, upload, usage bar, breadcrumb, search.", category: "Enterprise", icon: Package, status: "ready", Component: RoyStorage, tier: "cloud" },
  { id: "edge", name: "Roy Edge", description: "Edge deployment — 6 regions, latency, TTL, cache strategy, edge-vs-origin comparison.", category: "Enterprise", icon: Layers, status: "ready", Component: RoyEdge, tier: "cloud" },
  { id: "digital-twin", name: "Roy Digital Twin", description: "Digital twin simulator — performance, accessibility, user journeys, device compatibility.", category: "Enterprise", icon: Layers, status: "beta", Component: RoyDigitalTwin, tier: "enterprise" },
  { id: "os", name: "Roy OS", description: "Unified workspace dashboard — 12 product tiles, quick actions, activity feed, global search.", category: "Enterprise", icon: Layers, status: "beta", Component: RoyOS, tier: "enterprise" },
  { id: "live", name: "Roy Live", description: "Real-time collaboration — multiplayer editing, presence cursors, comments, share.", category: "Enterprise", icon: Users, status: "beta", Component: RoyLive, tier: "cloud" },

  /* ── Learning & Community (3) ─────────────────────────────── */
  { id: "academy", name: "Roy Academy", description: "4 learning paths, 60 lessons, 4 certifications, progress tracking.", category: "Learning & Community", icon: GraduationCap, status: "ready", Component: Academy, tier: "pro" },
  { id: "community", name: "Community Hub", description: "Stats, 6 contributors, activity feed, leaderboard, discussions, 3 tabs.", category: "Learning & Community", icon: Users, status: "ready", Component: CommunityHub, tier: "pro" },
  { id: "showcase", name: "Roy Showcase", description: "12 curated projects with performance/a11y scores, industry filters, submit form.", category: "Learning & Community", icon: Trophy, status: "ready", Component: RoyShowcase, tier: "pro" },
];

/* ═══════════════════════════════════════════════════════════════
   STATUS & TIER METADATA
   ═══════════════════════════════════════════════════════════════ */
const STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  beta: { label: "Beta", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  roadmap: { label: "Coming Soon", className: "bg-muted text-muted-foreground" },
};

const TIER_META: Record<ProductTier, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-primary/10 text-primary" },
  pro: { label: "Pro", className: "bg-foreground/10 text-foreground" },
  enterprise: { label: "Enterprise", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  cloud: { label: "Cloud", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
};

type CategoryFilter = UnifiedCategory | "All";

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function PlatformSectionUnified({
  onLaunchTool,
}: {
  onLaunchTool?: (toolId: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const counts = useMemo(() => {
    const map: Record<CategoryFilter, number> = {
      All: PRODUCTS.length,
      Build: 0,
      Design: 0,
      AI: 0,
      "Developer Tools": 0,
      Enterprise: 0,
      "Learning & Community": 0,
    };
    for (const p of PRODUCTS) {
      map[p.category] += 1;
    }
    return map;
  }, []);

  const activeCategoryMeta = CATEGORY_META.find((c) => c.id === activeCategory);

  return (
    <section
      id="platform"
      aria-label="The RoyCSS Platform"
      className="py-16 sm:py-20 scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* ─── Heading ──────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <Layers className="size-3.5" />
            The RoyCSS Platform
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tight">
            The RoyCSS Platform
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Everything you need to design, build, ship and scale modern interfaces.
          </p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            <span className="font-semibold text-foreground tabular-nums">{PRODUCTS.length}</span>{" "}
            live products across{" "}
            <span className="font-semibold text-foreground">6 pillars</span> — click any card to try it.
          </p>
        </div>

        {/* ─── Search ──────────────────────────────────────────── */}
        <div className="relative max-w-md mx-auto w-full mb-5">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search 62 products by name, description or pillar…"
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
          className="mb-8"
        >
          <div className="flex justify-center">
            <TabsList className="h-auto flex-wrap gap-1 p-1 bg-muted/60 backdrop-blur">
              <TabsTrigger
                value="All"
                className="flex-1 sm:flex-none rounded-md px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Layers className="size-3.5" />
                All
                <span className="ml-1 text-[10px] tabular-nums opacity-70">{counts.All}</span>
              </TabsTrigger>
              {CATEGORY_META.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="flex-1 sm:flex-none rounded-md px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.shortLabel}</span>
                    <span className="ml-1 text-[10px] tabular-nums opacity-70">{counts[cat.id]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>

        {/* ─── Active category description ────────────────────── */}
        <div className="text-center mb-6 min-h-[1.5rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeCategory}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {activeCategory === "All" ? (
                <>Showing all <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span> products</>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{activeCategoryMeta?.label}</span>{" "}
                  — {activeCategoryMeta?.description} ·{" "}
                  <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "product" : "products"}
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ─── Product Grid ───────────────────────────────────── */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => {
              const Icon = product.icon;
              const statusMeta = STATUS_META[product.status];
              const tierMeta = TIER_META[product.tier];
              return (
                <motion.button
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedProduct(product)}
                  className="group text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer perf-auto flex flex-col"
                  aria-label={`Open ${product.name}`}
                >
                  {/* Header row: icon + name + chevron */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-foreground text-sm leading-tight truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span
                            className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${tierMeta.className}`}
                          >
                            {tierMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                  </p>

                  {/* Footer: category badge + Try it button */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50">
                    <Badge variant="secondary" className="text-[10px] bg-muted/60 text-muted-foreground">
                      {product.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                      Try it
                      <ChevronRight className="size-3" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ─── Empty state ────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-muted/60 mb-4">
              <SearchIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">No products found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Try a different search term or pick another pillar.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}

        {/* ─── Product detail Dialog ──────────────────────────── */}
        <Dialog
          open={!!selectedProduct}
          onOpenChange={(open) => {
            if (!open) setSelectedProduct(null);
          }}
        >
          <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-5 pb-3 sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
              <DialogTitle className="flex items-center gap-2 font-display text-lg">
                {selectedProduct && (() => {
                  const Icon = selectedProduct.icon;
                  return <Icon className="size-5 text-primary" />;
                })()}
                <span>{selectedProduct?.name}</span>
                {selectedProduct && (
                  <>
                    <span
                      className={`ml-1 inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${STATUS_META[selectedProduct.status].className}`}
                    >
                      {STATUS_META[selectedProduct.status].label}
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${TIER_META[selectedProduct.tier].className}`}
                    >
                      {TIER_META[selectedProduct.tier].label}
                    </span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>{selectedProduct?.description}</DialogDescription>
            </DialogHeader>
            <div className="p-5">
              {selectedProduct && (
                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading {selectedProduct.name}…</p>
                    </div>
                  }
                >
                  {(() => {
                    const ProductComponent = selectedProduct.Component;
                    return <ProductComponent />;
                  })()}
                </Suspense>
              )}
            </div>

            {/* ─── Dialog footer: secondary launch action ──────── */}
            {selectedProduct && onLaunchTool && (
              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 p-4 bg-background/95 backdrop-blur border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLaunchTool(selectedProduct.id)}
                >
                  <ExternalLink className="size-3.5 mr-1.5" />
                  Open in tool sheet
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

export default PlatformSectionUnified;
