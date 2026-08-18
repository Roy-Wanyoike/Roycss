/**
 * product-registry.ts — SINGLE SOURCE OF TRUTH for the 62 RoyCSS platform
 * products.
 *
 * Each entry carries full product metadata:
 *   - identity (id, name)
 *   - classification (category, tier, status)
 *   - display (icon, shortDescription, longDescription)
 *   - action (cta)
 *   - loading (componentPath for dynamic import, tags for search, metrics)
 *
 * Consumers (product-card, product-grid, component-composer,
 * platform-section-unified) MUST import their metadata from here — never
 * duplicate product data elsewhere. The previous `products-catalog.ts`
 * file is now a thin compatibility re-exporter of this registry.
 *
 * IMPORTANT: `componentPath` is a STRING path to a module that default-exports
 * the React component. Consumers use a static lookup map (see
 * `product-loaders.tsx` or the inline map in `product-grid.tsx`) that resolves
 * this string into an actual `import()` call. This is a Next.js limitation:
 * dynamic imports must be statically analyzable.
 */

import type { ComponentType } from "react";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type ProductCategory =
  | "ai"
  | "components"
  | "devtools"
  | "enterprise"
  | "integrations"
  | "design";

export type ProductTier = "free" | "pro" | "team" | "enterprise";

export type ProductStatus = "live" | "beta" | "coming-soon";

export interface ProductCta {
  label: string;
  /** Internal route — rendered via next/link if present. */
  href?: string;
  /** Custom client-side action key — rendered via onAction callback. */
  action?: string;
}

export interface ProductEntry {
  /** Stable kebab-case identifier — used as React key & loader lookup. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** One of the 6 platform categories. */
  category: ProductCategory;
  /** Pricing tier. */
  tier: ProductTier;
  /** Lifecycle status. */
  status: ProductStatus;
  /** Lucide icon name (string) — consumer maps to the actual icon component. */
  icon: string;
  /** ≤80 chars — used on cards. */
  shortDescription: string;
  /** 1–2 sentences — used in modal/dialog. */
  longDescription: string;
  /** Primary call-to-action. */
  cta: ProductCta;
  /** String module path for dynamic import (e.g. "@/components/roycss/pro/data-grid"). */
  componentPath: string;
  /** Named export from the module (e.g. "ProDataGrid"). */
  exportName: string;
  /** Discoverability tags — surfaced in search & filter. */
  tags: string[];
  /** Optional quantitative metrics like "62 effects" or "1.2MB bundle". */
  metrics?: string;
  /** ISO date string — only set when status === "coming-soon". */
  comingSoonAt?: string;
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY METADATA (6 pillars)
   ═══════════════════════════════════════════════════════════════ */

export interface CategoryMeta {
  id: ProductCategory;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const PRODUCT_CATEGORIES: CategoryMeta[] = [
  {
    id: "components",
    label: "Build",
    shortLabel: "Build",
    icon: "Hammer",
    description: "Components, blocks, patterns, templates & marketplace",
  },
  {
    id: "design",
    label: "Design",
    shortLabel: "Design",
    icon: "Palette",
    description: "Studios for theme, color, type, layout, motion & icons",
  },
  {
    id: "ai",
    label: "AI",
    shortLabel: "AI",
    icon: "BrainCircuit",
    description: "Assistants, agents & code intelligence",
  },
  {
    id: "devtools",
    label: "Developer Tools",
    shortLabel: "DevTools",
    icon: "Wrench",
    description: "Scaffold, sync, ship, profile & benchmark",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    shortLabel: "Enterprise",
    icon: "Building2",
    description: "Governance, compliance, fleet, cloud & ops",
  },
  {
    id: "integrations",
    label: "Learning & Community",
    shortLabel: "Learning",
    icon: "GraduationCap",
    description: "Academy, community hub & showcase",
  },
];

/* ═══════════════════════════════════════════════════════════════
   TIER & STATUS METADATA
   ═══════════════════════════════════════════════════════════════ */

export const PRODUCT_TIER_META: Record<
  ProductTier,
  { label: string; className: string }
> = {
  free: { label: "Free", className: "bg-primary/10 text-primary" },
  pro: { label: "Pro", className: "bg-foreground/10 text-foreground" },
  team: { label: "Team", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  enterprise: {
    label: "Enterprise",
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
};

export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  live: {
    label: "Live",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  beta: {
    label: "Beta",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  "coming-soon": {
    label: "Coming Soon",
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * Legacy status aliases — keep the old "ready" / "roadmap" strings usable
 * for downstream consumers (e.g. search-overlay imports the catalog) without
 * forcing a refactor of every call-site.
 */
export function normalizeStatus(
  s: "ready" | "beta" | "roadmap" | ProductStatus,
): ProductStatus {
  if (s === "ready") return "live";
  if (s === "roadmap") return "coming-soon";
  return s;
}

/**
 * Legacy tier alias — `cloud` was used in the old catalog; we map it onto
 * the closest tier (`enterprise`) so the new registry stays clean.
 */
export function normalizeTier(
  t: "free" | "pro" | "enterprise" | "cloud" | "team",
): ProductTier {
  if (t === "cloud") return "enterprise";
  return t;
}

/* ═══════════════════════════════════════════════════════════════
   THE REGISTRY — 62 platform products
   ═══════════════════════════════════════════════════════════════ */

export const PRODUCT_REGISTRY: ProductEntry[] = [
  /* ── Build / components (12) ─────────────────────────────── */
  {
    id: "data-grid",
    name: "Pro Data Grid",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Grid3x3",
    shortDescription: "Sortable, filterable, paginated data table with row selection.",
    longDescription:
      "Production-grade data table with 50 rows, sortable columns, multi-filter, row selection, and column visibility toggles.",
    cta: { label: "Try it", action: "open:data-grid" },
    componentPath: "@/components/roycss/pro/data-grid",
    exportName: "ProDataGrid",
    tags: ["table", "grid", "data", "filter", "sort", "pagination"],
    metrics: "50 rows",
  },
  {
    id: "kanban",
    name: "Kanban Board",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "KanbanSquare",
    shortDescription: "Drag-and-drop board with priority badges and inline editing.",
    longDescription:
      "Visual project board with 4 columns, 14 cards, drag-and-drop reordering, priority badges, and inline editing.",
    cta: { label: "Try it", action: "open:kanban" },
    componentPath: "@/components/roycss/pro/kanban-board",
    exportName: "ProKanbanBoard",
    tags: ["kanban", "board", "drag-drop", "project-management"],
    metrics: "14 cards",
  },
  {
    id: "scheduler",
    name: "Calendar Scheduler",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Calendar",
    shortDescription: "Month + week views with overlap-aware layout.",
    longDescription:
      "Calendar scheduler with month & week views, 11 events, overlap-aware layout, and a live 'now' indicator.",
    cta: { label: "Try it", action: "open:scheduler" },
    componentPath: "@/components/roycss/pro/scheduler",
    exportName: "ProScheduler",
    tags: ["calendar", "scheduler", "events", "date"],
    metrics: "11 events",
  },
  {
    id: "charts",
    name: "Pro Charts",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "BarChart3",
    shortDescription: "Line, bar, donut, and area charts with OKLCH colors.",
    longDescription:
      "Chart library built on recharts with line, bar, donut, and area charts using OKLCH color tokens for theming.",
    cta: { label: "Try it", action: "open:charts" },
    componentPath: "@/components/roycss/pro/charts",
    exportName: "ProCharts",
    tags: ["charts", "graphs", "recharts", "data-viz"],
    metrics: "4 chart types",
  },
  {
    id: "blocks",
    name: "Roy Blocks",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Blocks",
    shortDescription: "10 application blocks (Auth, Billing, CRM, Healthcare, Analytics).",
    longDescription:
      "Pre-built application blocks for Auth, Billing, CRM, Healthcare, Analytics with live previews and code export.",
    cta: { label: "Try it", action: "open:blocks" },
    componentPath: "@/components/roycss/pro/roy-blocks",
    exportName: "RoyBlocks",
    tags: ["blocks", "sections", "templates", "ui"],
    metrics: "10 blocks",
  },
  {
    id: "patterns",
    name: "Pattern Library",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Package",
    shortDescription: "12 interactive UI patterns (Accordion, Toast, CommandMenu).",
    longDescription:
      "Curated interactive UI patterns — Accordion, Toast, CommandMenu, FileUpload and 8 more, each with live preview.",
    cta: { label: "Try it", action: "open:patterns" },
    componentPath: "@/components/roycss/pro/pattern-library",
    exportName: "PatternLibrary",
    tags: ["patterns", "ui", "components", "library"],
    metrics: "12 patterns",
  },
  {
    id: "template-library",
    name: "Template Library",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "LayoutGrid",
    shortDescription: "8 live template previews (Hero, Pricing, Testimonial).",
    longDescription:
      "Drop-in page templates — Hero, FeatureGrid, Pricing, Testimonial and 4 more, each rendered live and exportable.",
    cta: { label: "Try it", action: "open:template-library" },
    componentPath: "@/components/roycss/pro/template-library",
    exportName: "TemplateLibrary",
    tags: ["templates", "landing", "hero", "pricing"],
    metrics: "8 templates",
  },
  {
    id: "blueprints",
    name: "Roy Blueprints",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Building2",
    shortDescription: "8 complete app architectures with folder trees.",
    longDescription:
      "Full application blueprints — Hospital, POS, ERP, HR, Banking and 3 more — each with folder tree and tech stack.",
    cta: { label: "Try it", action: "open:blueprints" },
    componentPath: "@/components/roycss/pro/roy-blueprints",
    exportName: "RoyBlueprints",
    tags: ["blueprints", "architecture", "apps", "starter"],
    metrics: "8 blueprints",
  },
  {
    id: "marketplace",
    name: "Marketplace",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Store",
    shortDescription: "12 templates with search, filter, and install toasts.",
    longDescription:
      "Community template marketplace — 12 templates, search/filter/sort, detail dialogs, and one-click install toasts.",
    cta: { label: "Try it", action: "open:marketplace" },
    componentPath: "@/components/roycss/pro/marketplace",
    exportName: "Marketplace",
    tags: ["marketplace", "templates", "community"],
    metrics: "12 templates",
  },
  {
    id: "plugin-hub",
    name: "Plugin Hub",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "Plug",
    shortDescription: "12 plugins (Stripe, Clerk, Supabase, Firebase).",
    longDescription:
      "Plugin hub with 12 first-class integrations — Stripe, Clerk, Supabase, Firebase and 8 more — install commands and changelogs.",
    cta: { label: "Try it", action: "open:plugin-hub" },
    componentPath: "@/components/roycss/pro/plugin-hub",
    exportName: "PluginHub",
    tags: ["plugins", "integrations", "stripe", "supabase", "firebase"],
    metrics: "12 plugins",
  },
  {
    id: "forms",
    name: "Roy Forms",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "FormInput",
    shortDescription: "Visual form builder with 10 field types & code export.",
    longDescription:
      "Drag-and-drop form builder with 10 field types, multi-step, conditional logic, validation, and code export.",
    cta: { label: "Try it", action: "open:forms" },
    componentPath: "@/components/roycss/pro/roy-forms",
    exportName: "RoyForms",
    tags: ["forms", "builder", "inputs", "validation"],
    metrics: "10 field types",
  },
  {
    id: "storybook",
    name: "Roy Storybook",
    category: "components",
    tier: "pro",
    status: "live",
    icon: "BookOpen",
    shortDescription: "Component docs: 10 components, variants, a11y notes.",
    longDescription:
      "In-app component documentation — 10 components, variants, states, props tables, and a11y notes.",
    cta: { label: "Try it", action: "open:storybook" },
    componentPath: "@/components/roycss/pro/roy-storybook",
    exportName: "RoyStorybook",
    tags: ["storybook", "docs", "components", "variants"],
    metrics: "10 components",
  },

  /* ── Design (10) ───────────────────────────────────────── */
  {
    id: "visual-studio",
    name: "Visual Studio",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Layers",
    shortDescription: "Drag-and-drop page builder with HTML export.",
    longDescription:
      "Visual page builder with 8 component types, properties panel, layer tree, and one-click HTML export.",
    cta: { label: "Try it", action: "open:visual-studio" },
    componentPath: "@/components/roycss/pro/visual-studio",
    exportName: "VisualStudio",
    tags: ["builder", "visual", "drag-drop", "page", "html"],
    metrics: "8 component types",
  },
  {
    id: "theme-system",
    name: "Theme System",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Palette",
    shortDescription: "10 production-ready OKLCH theme presets.",
    longDescription:
      "Theme system with 10 production-ready OKLCH theme presets, live preview, and CSS variable export.",
    cta: { label: "Try it", action: "open:theme-system" },
    componentPath: "@/components/roycss/pro/theme-system",
    exportName: "ThemeSystem",
    tags: ["theme", "oklch", "design-tokens", "colors"],
    metrics: "10 presets",
  },
  {
    id: "color-studio",
    name: "Color Studio",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Palette",
    shortDescription: "Enterprise color management with WCAG validation.",
    longDescription:
      "Enterprise color management — 11-step OKLCH scale, WCAG contrast validation, and brand generation.",
    cta: { label: "Try it", action: "open:color-studio" },
    componentPath: "@/components/roycss/pro/roy-color-studio",
    exportName: "RoyColorStudio",
    tags: ["color", "oklch", "wcag", "contrast", "brand"],
    metrics: "11-step scale",
  },
  {
    id: "gradient-studio",
    name: "Gradient Studio",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Palette",
    shortDescription: "Linear/Radial/Conic/Mesh gradients with 6 presets.",
    longDescription:
      "Advanced gradient editor — Linear, Radial, Conic, Mesh, noise texture, animated, and aurora — with 6 presets.",
    cta: { label: "Try it", action: "open:gradient-studio" },
    componentPath: "@/components/roycss/pro/roy-gradient-studio",
    exportName: "RoyGradientStudio",
    tags: ["gradient", "mesh", "conic", "aurora", "design"],
    metrics: "6 presets",
  },
  {
    id: "typography",
    name: "Roy Typography",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Type",
    shortDescription: "Fluid clamp type scale with modular ratios.",
    longDescription:
      "Type scale generator with fluid clamp(), modular ratios, variable font config, and reading tips.",
    cta: { label: "Try it", action: "open:typography" },
    componentPath: "@/components/roycss/pro/roy-typography",
    exportName: "RoyTypography",
    tags: ["typography", "fonts", "fluid", "scale"],
  },
  {
    id: "layout-studio",
    name: "Layout Studio",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "LayoutGrid",
    shortDescription: "Visual grid builder with Container Queries.",
    longDescription:
      "Visual layout builder — CSS Grid template-areas, Flexbox, Masonry, and Container Queries — with live preview.",
    cta: { label: "Try it", action: "open:layout-studio" },
    componentPath: "@/components/roycss/pro/roy-layout-studio",
    exportName: "RoyLayoutStudio",
    tags: ["layout", "grid", "flexbox", "masonry", "container-queries"],
  },
  {
    id: "motion-studio",
    name: "Motion Studio",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Sparkles",
    shortDescription: "Visual animation builder with draggable keyframes.",
    longDescription:
      "Visual animation builder — 5-track timeline, draggable keyframes, easing curves, live preview, and CSS export.",
    cta: { label: "Try it", action: "open:motion-studio" },
    componentPath: "@/components/roycss/pro/roy-motion-studio",
    exportName: "RoyMotionStudio",
    tags: ["animation", "keyframes", "motion", "timeline"],
    metrics: "5 tracks",
  },
  {
    id: "motion-library",
    name: "Motion Library",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Sparkles",
    shortDescription: "12 framer-motion animation primitives.",
    longDescription:
      "12 framer-motion animation primitives with speed control and copy-ready code snippets.",
    cta: { label: "Try it", action: "open:motion-library" },
    componentPath: "@/components/roycss/pro/motion-library",
    exportName: "MotionLibrary",
    tags: ["motion", "framer", "animations", "primitives"],
    metrics: "12 primitives",
  },
  {
    id: "icon-pack",
    name: "Icon Pack",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Shapes",
    shortDescription: "158 icons across 7 categories with click-to-copy.",
    longDescription:
      "RoyCSS icon pack — 158 icons across 7 categories with search, size selector, and click-to-copy imports.",
    cta: { label: "Try it", action: "open:icon-pack" },
    componentPath: "@/components/roycss/pro/icon-pack",
    exportName: "IconPack",
    tags: ["icons", "svg", "lucide", "search"],
    metrics: "158 icons",
  },
  {
    id: "accessibility",
    name: "Accessibility Suite",
    category: "design",
    tier: "pro",
    status: "live",
    icon: "Accessibility",
    shortDescription: "Live DOM audit, a11y score, contrast & tab order.",
    longDescription:
      "Live DOM audit running 10 WCAG checks, an a11y score, contrast checker, and a tab-order visualizer.",
    cta: { label: "Try it", action: "open:accessibility" },
    componentPath: "@/components/roycss/pro/accessibility-suite",
    exportName: "AccessibilitySuite",
    tags: ["a11y", "wcag", "audit", "contrast"],
    metrics: "10 checks",
  },

  /* ── AI (10) ───────────────────────────────────────────── */
  {
    id: "roy-ai",
    name: "RoyAI Assistant",
    category: "ai",
    tier: "pro",
    status: "live",
    icon: "Bot",
    shortDescription: "Chat assistant that generates CSS and answers questions.",
    longDescription:
      "RoyAI chat assistant that generates CSS, answers RoyCSS usage questions, and suggests effects from natural language.",
    cta: { label: "Try it", action: "open:roy-ai" },
    componentPath: "@/components/roycss/pro/roy-ai",
    exportName: "RoyAI",
    tags: ["ai", "chat", "assistant", "css", "llm"],
  },
  {
    id: "roy-agents",
    name: "Roy Agents",
    category: "ai",
    tier: "pro",
    status: "live",
    icon: "Wrench",
    shortDescription: "8 specialized AI agents (a11y, perf, refactor).",
    longDescription:
      "8 specialized AI agents for accessibility, performance, docs, refactoring, security, and more.",
    cta: { label: "Try it", action: "open:roy-agents" },
    componentPath: "@/components/roycss/pro/roy-agents",
    exportName: "RoyAgents",
    tags: ["ai", "agents", "automation"],
    metrics: "8 agents",
  },
  {
    id: "architect",
    name: "Roy Architect",
    category: "ai",
    tier: "enterprise",
    status: "live",
    icon: "Building2",
    shortDescription: "AI app architect: requirements → folder, stack, APIs.",
    longDescription:
      "AI application architect — generates folder structure, tech stack, APIs, and deployment plans from natural-language requirements.",
    cta: { label: "Try it", action: "open:architect" },
    componentPath: "@/components/roycss/pro/roy-architect",
    exportName: "RoyArchitect",
    tags: ["ai", "architect", "scaffold", "stack"],
  },
  {
    id: "review",
    name: "Roy Review",
    category: "ai",
    tier: "enterprise",
    status: "live",
    icon: "Wrench",
    shortDescription: "AI code reviewer with severity findings & fixes.",
    longDescription:
      "AI code reviewer — paste code, get a score, findings by severity, and concrete fix recommendations.",
    cta: { label: "Try it", action: "open:review" },
    componentPath: "@/components/roycss/pro/roy-review",
    exportName: "RoyReview",
    tags: ["ai", "review", "code-quality", "lint"],
  },
  {
    id: "refactor",
    name: "Roy Refactor",
    category: "ai",
    tier: "pro",
    status: "live",
    icon: "Wrench",
    shortDescription: "Modernize Bootstrap/Tailwind → RoyCSS with diff view.",
    longDescription:
      "Code modernizer — converts Bootstrap/Tailwind/Material markup into RoyCSS with OKLCH, logical properties, and a diff view.",
    cta: { label: "Try it", action: "open:refactor" },
    componentPath: "@/components/roycss/pro/roy-refactor",
    exportName: "RoyRefactor",
    tags: ["ai", "refactor", "migration", "modernize"],
  },
  {
    id: "pair",
    name: "Roy Pair",
    category: "ai",
    tier: "pro",
    status: "live",
    icon: "Bot",
    shortDescription: "AI pair programmer chat specialized for RoyCSS.",
    longDescription:
      "AI pair programmer chat specialized for RoyCSS — code highlighting, suggestion chips, and inline previews.",
    cta: { label: "Try it", action: "open:pair" },
    componentPath: "@/components/roycss/pro/roy-pair",
    exportName: "RoyPair",
    tags: ["ai", "pair", "chat", "copilot"],
  },
  {
    id: "designer",
    name: "Roy Designer",
    category: "ai",
    tier: "enterprise",
    status: "live",
    icon: "Bot",
    shortDescription: "AI UI designer: prompt → mockup + palette + type.",
    longDescription:
      "AI UI designer — prompt → mockup preview, color palette, typography, and a recommended component list.",
    cta: { label: "Try it", action: "open:designer" },
    componentPath: "@/components/roycss/pro/roy-designer",
    exportName: "RoyDesigner",
    tags: ["ai", "design", "mockup", "palette"],
  },
  {
    id: "generator",
    name: "Roy Generator",
    category: "ai",
    tier: "pro",
    status: "live",
    icon: "Code2",
    shortDescription: "Code generator for Component/Form/CRUD/API.",
    longDescription:
      "Code generator — Component/Form/CRUD/Table/Dashboard/API with configurable options and copy-ready output.",
    cta: { label: "Try it", action: "open:generator" },
    componentPath: "@/components/roycss/pro/roy-generator",
    exportName: "RoyGenerator",
    tags: ["ai", "generator", "scaffold", "crud"],
  },
  {
    id: "search",
    name: "Roy Search",
    category: "ai",
    tier: "pro",
    status: "live",
    icon: "Search",
    shortDescription: "Universal AI search across 8 content types.",
    longDescription:
      "Universal AI search across 54 items in 8 content types with keyboard navigation and result highlighting.",
    cta: { label: "Try it", action: "open:search" },
    componentPath: "@/components/roycss/pro/roy-search",
    exportName: "RoySearch",
    tags: ["search", "ai", "fuzzy", "command-palette"],
    metrics: "54 items",
  },
  {
    id: "sandbox",
    name: "Roy Sandbox",
    category: "ai",
    tier: "enterprise",
    status: "live",
    icon: "Code2",
    shortDescription: "Online dev environment with live iframe preview.",
    longDescription:
      "Online dev environment — HTML/CSS/JS editors, live iframe preview, templates, and share links.",
    cta: { label: "Try it", action: "open:sandbox" },
    componentPath: "@/components/roycss/pro/roy-sandbox",
    exportName: "RoySandbox",
    tags: ["sandbox", "playground", "editor", "ide"],
  },

  /* ── Developer Tools / devtools (14) ────────────────────── */
  {
    id: "scaffold",
    name: "Roy Scaffold",
    category: "devtools",
    tier: "pro",
    status: "live",
    icon: "Layers",
    shortDescription: "Project scaffolding for 8 project types.",
    longDescription:
      "Project scaffolding — 8 project types, framework/db/auth selectors, and folder tree generation.",
    cta: { label: "Try it", action: "open:scaffold" },
    componentPath: "@/components/roycss/pro/roy-scaffold",
    exportName: "RoyScaffold",
    tags: ["scaffold", "cli", "starter", "project"],
    metrics: "8 project types",
  },
  {
    id: "sync",
    name: "Roy Sync",
    category: "devtools",
    tier: "enterprise",
    status: "live",
    icon: "Layers",
    shortDescription: "Sync hub for Figma, GitHub, Tokens, Theme.",
    longDescription:
      "Sync hub — Figma, GitHub, Tokens, Theme sync status, sync log, and a one-click sync-all action.",
    cta: { label: "Try it", action: "open:sync" },
    componentPath: "@/components/roycss/pro/roy-sync",
    exportName: "RoySync",
    tags: ["sync", "figma", "github", "tokens"],
  },
  {
    id: "version",
    name: "Roy Version",
    category: "devtools",
    tier: "pro",
    status: "live",
    icon: "Layers",
    shortDescription: "Version management with upgrade simulator.",
    longDescription:
      "Version management — current/latest, dependency graph, breaking changes, and an upgrade simulator.",
    cta: { label: "Try it", action: "open:version" },
    componentPath: "@/components/roycss/pro/roy-version",
    exportName: "RoyVersion",
    tags: ["version", "upgrade", "semver", "dependencies"],
  },
  {
    id: "registry",
    name: "Roy Registry",
    category: "devtools",
    tier: "enterprise",
    status: "live",
    icon: "Package",
    shortDescription: "Package registry with public/private/internal.",
    longDescription:
      "Package registry — 10 packages, public/private/internal scopes, publish actions, and a detail dialog.",
    cta: { label: "Try it", action: "open:registry" },
    componentPath: "@/components/roycss/pro/roy-registry",
    exportName: "RoyRegistry",
    tags: ["registry", "npm", "packages", "publish"],
    metrics: "10 packages",
  },
  {
    id: "bundle",
    name: "Roy Bundle",
    category: "devtools",
    tier: "pro",
    status: "live",
    icon: "Package",
    shortDescription: "Bundle optimizer: size, duplicates, dead CSS.",
    longDescription:
      "Bundle optimizer — size breakdown, duplicates, dead CSS, oversized chunks, and before/after comparison.",
    cta: { label: "Try it", action: "open:bundle" },
    componentPath: "@/components/roycss/pro/roy-bundle",
    exportName: "RoyBundle",
    tags: ["bundle", "size", "webpack", "vite", "tree-shake"],
  },
  {
    id: "profiler",
    name: "Roy Profiler",
    category: "devtools",
    tier: "pro",
    status: "live",
    icon: "LineChart",
    shortDescription: "Frontend profiler: render phases, CLS, FPS.",
    longDescription:
      "Frontend profiler — render phases, CLS, memory, FPS, and prioritized recommendations.",
    cta: { label: "Try it", action: "open:profiler" },
    componentPath: "@/components/roycss/pro/roy-profiler",
    exportName: "RoyProfiler",
    tags: ["profiler", "performance", "cls", "fps", "render"],
  },
  {
    id: "benchmark",
    name: "Roy Benchmark",
    category: "devtools",
    tier: "pro",
    status: "beta",
    icon: "LineChart",
    shortDescription: "Benchmark against industry averages & best-in-class.",
    longDescription:
      "Benchmarking platform — compare your metrics against industry averages and best-in-class targets.",
    cta: { label: "Try it", action: "open:benchmark" },
    componentPath: "@/components/roycss/pro/roy-benchmark",
    exportName: "RoyBenchmark",
    tags: ["benchmark", "performance", "comparison"],
  },
  {
    id: "observatory",
    name: "Roy Observatory",
    category: "devtools",
    tier: "enterprise",
    status: "live",
    icon: "LineChart",
    shortDescription: "Production monitoring: CWV, errors, uptime.",
    longDescription:
      "Production monitoring — Core Web Vitals, error rate, uptime, alerts, and a 7-day trend chart.",
    cta: { label: "Try it", action: "open:observatory" },
    componentPath: "@/components/roycss/pro/roy-observatory",
    exportName: "RoyObservatory",
    tags: ["monitoring", "observability", "cwv", "alerts"],
  },
  {
    id: "analytics",
    name: "Analytics Dashboard",
    category: "devtools",
    tier: "pro",
    status: "live",
    icon: "LineChart",
    shortDescription: "KPI cards, traffic, top effects, geo, devices.",
    longDescription:
      "Analytics dashboard — KPI cards, traffic chart, top effects, geo distribution, device donut, and time ranges.",
    cta: { label: "Try it", action: "open:analytics" },
    componentPath: "@/components/roycss/pro/analytics-dashboard",
    exportName: "AnalyticsDashboard",
    tags: ["analytics", "kpi", "traffic", "dashboard"],
  },
  {
    id: "mentor",
    name: "Roy Mentor",
    category: "devtools",
    tier: "free",
    status: "live",
    icon: "GraduationCap",
    shortDescription: "AI tutor chat with XP tracker.",
    longDescription:
      "AI tutor chat — skill levels, topic chips, code examples, and an XP tracker that rewards progress.",
    cta: { label: "Try it", action: "open:mentor" },
    componentPath: "@/components/roycss/pro/roy-mentor",
    exportName: "RoyMentor",
    tags: ["mentor", "learning", "tutor", "xp"],
  },
  {
    id: "challenges",
    name: "Roy Challenges",
    category: "devtools",
    tier: "free",
    status: "live",
    icon: "Trophy",
    shortDescription: "8 coding challenges with validator & leaderboard.",
    longDescription:
      "Coding challenges — 8 challenges, difficulty levels, validator, leaderboard, and XP rewards.",
    cta: { label: "Try it", action: "open:challenges" },
    componentPath: "@/components/roycss/pro/roy-challenges",
    exportName: "RoyChallenges",
    tags: ["challenges", "kata", "leaderboard", "practice"],
    metrics: "8 challenges",
  },
  {
    id: "certifications",
    name: "Roy Certifications",
    category: "devtools",
    tier: "pro",
    status: "live",
    icon: "Award",
    shortDescription: "4 certification levels with exam scheduling.",
    longDescription:
      "Certification platform — 4 levels, exam scheduling, verification, and earned-cert tracking.",
    cta: { label: "Try it", action: "open:certifications" },
    componentPath: "@/components/roycss/pro/roy-certifications",
    exportName: "RoyCertifications",
    tags: ["certifications", "exams", "credentials"],
    metrics: "4 levels",
  },
  {
    id: "open",
    name: "Roy Open",
    category: "devtools",
    tier: "free",
    status: "live",
    icon: "Users",
    shortDescription: "Open-source hub: good first issues, RFCs, roadmap.",
    longDescription:
      "Open-source hub — good first issues, RFCs, public roadmap, and contributor stats.",
    cta: { label: "Try it", action: "open:open" },
    componentPath: "@/components/roycss/pro/roy-open",
    exportName: "RoyOpen",
    tags: ["opensource", "rfc", "roadmap", "contributors"],
  },
  {
    id: "spotlight",
    name: "Roy Spotlight",
    category: "devtools",
    tier: "free",
    status: "live",
    icon: "Trophy",
    shortDescription: "Featured developer showcase with submit form.",
    longDescription:
      "Featured developer showcase — templates, components, plugins, projects, and a submit form.",
    cta: { label: "Try it", action: "open:spotlight" },
    componentPath: "@/components/roycss/pro/roy-spotlight",
    exportName: "RoySpotlight",
    tags: ["spotlight", "showcase", "community"],
  },

  /* ── Enterprise (13) ──────────────────────────────────── */
  {
    id: "governance",
    name: "Roy Governance",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Shield",
    shortDescription: "Design system governance with audit log.",
    longDescription:
      "Design system governance — approval queue, team roster, policies, and an audit log.",
    cta: { label: "Try it", action: "open:governance" },
    componentPath: "@/components/roycss/pro/roy-governance",
    exportName: "RoyGovernance",
    tags: ["governance", "approval", "audit", "policy"],
  },
  {
    id: "compliance",
    name: "Roy Compliance",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Shield",
    shortDescription: "WCAG/ADA/Section 508 compliance reporting.",
    longDescription:
      "Compliance reporting — WCAG, ADA, and Section 508 — with scan, findings, and report download.",
    cta: { label: "Try it", action: "open:compliance" },
    componentPath: "@/components/roycss/pro/roy-compliance",
    exportName: "RoyCompliance",
    tags: ["compliance", "wcag", "ada", "section-508"],
  },
  {
    id: "audit-center",
    name: "Audit Center",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Shield",
    shortDescription: "Enterprise audit dashboard across 5 projects.",
    longDescription:
      "Enterprise audit dashboard — 5 projects, a11y/perf/security scores, trend chart, and issues.",
    cta: { label: "Try it", action: "open:audit-center" },
    componentPath: "@/components/roycss/pro/roy-audit-center",
    exportName: "RoyAuditCenter",
    tags: ["audit", "a11y", "security", "performance"],
    metrics: "5 projects",
  },
  {
    id: "fleet",
    name: "Roy Fleet",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Layers",
    shortDescription: "Manage hundreds of RoyCSS projects at scale.",
    longDescription:
      "Manage hundreds of RoyCSS projects — status, version, health score, and one-click scan-all.",
    cta: { label: "Try it", action: "open:fleet" },
    componentPath: "@/components/roycss/pro/roy-fleet",
    exportName: "RoyFleet",
    tags: ["fleet", "projects", "scale", "health"],
  },
  {
    id: "workspace",
    name: "Roy Workspace",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Users",
    shortDescription: "Company workspace with shared templates & team.",
    longDescription:
      "Company workspace — shared templates, tokens, components, projects, and team members.",
    cta: { label: "Try it", action: "open:workspace" },
    componentPath: "@/components/roycss/pro/roy-workspace",
    exportName: "RoyWorkspace",
    tags: ["workspace", "team", "shared", "company"],
  },
  {
    id: "deploy",
    name: "Roy Deploy",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Layers",
    shortDescription: "One-click deploy to Vercel/Netlify/Cloudflare/AWS.",
    longDescription:
      "One-click deployment — Vercel, Netlify, Cloudflare, AWS, Azure, GCP — with history and env vars.",
    cta: { label: "Try it", action: "open:deploy" },
    componentPath: "@/components/roycss/pro/roy-deploy",
    exportName: "RoyDeploy",
    tags: ["deploy", "vercel", "netlify", "cloudflare", "aws"],
  },
  {
    id: "preview",
    name: "Roy Preview",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Layers",
    shortDescription: "Shareable preview environments for PRs.",
    longDescription:
      "Shareable preview environments for branches and pull requests — ephemeral URLs and a history list.",
    cta: { label: "Try it", action: "open:preview" },
    componentPath: "@/components/roycss/pro/roy-preview",
    exportName: "RoyPreview",
    tags: ["preview", "pr", "ephemeral", "deploy"],
  },
  {
    id: "cdn",
    name: "Roy CDN",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Layers",
    shortDescription: "CDN dashboard with cache hit rate & purge.",
    longDescription:
      "CDN dashboard — requests, bandwidth, cache hit rate, edge locations, and one-click cache purge.",
    cta: { label: "Try it", action: "open:cdn" },
    componentPath: "@/components/roycss/pro/roy-cdn",
    exportName: "RoyCDN",
    tags: ["cdn", "cache", "edge", "purge"],
  },
  {
    id: "storage",
    name: "Roy Storage",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Package",
    shortDescription: "Cloud storage with file browser & search.",
    longDescription:
      "Cloud storage — file browser, upload, usage bar, breadcrumb navigation, and search.",
    cta: { label: "Try it", action: "open:storage" },
    componentPath: "@/components/roycss/pro/roy-storage",
    exportName: "RoyStorage",
    tags: ["storage", "files", "upload", "cloud"],
  },
  {
    id: "edge",
    name: "Roy Edge",
    category: "enterprise",
    tier: "enterprise",
    status: "live",
    icon: "Layers",
    shortDescription: "Edge deployment across 6 regions.",
    longDescription:
      "Edge deployment — 6 regions, latency, TTL, cache strategy, and an edge-vs-origin comparison.",
    cta: { label: "Try it", action: "open:edge" },
    componentPath: "@/components/roycss/pro/roy-edge",
    exportName: "RoyEdge",
    tags: ["edge", "regions", "latency", "cache"],
    metrics: "6 regions",
  },
  {
    id: "digital-twin",
    name: "Roy Digital Twin",
    category: "enterprise",
    tier: "enterprise",
    status: "beta",
    icon: "Layers",
    shortDescription: "Digital twin simulator for performance & a11y.",
    longDescription:
      "Digital twin simulator — performance, accessibility, user journeys, and device compatibility.",
    cta: { label: "Try it", action: "open:digital-twin" },
    componentPath: "@/components/roycss/pro/roy-digital-twin",
    exportName: "RoyDigitalTwin",
    tags: ["digital-twin", "simulator", "performance"],
  },
  {
    id: "os",
    name: "Roy OS",
    category: "enterprise",
    tier: "enterprise",
    status: "beta",
    icon: "Layers",
    shortDescription: "Unified workspace dashboard with global search.",
    longDescription:
      "Unified workspace dashboard — 12 product tiles, quick actions, activity feed, and global search.",
    cta: { label: "Try it", action: "open:os" },
    componentPath: "@/components/roycss/pro/roy-os",
    exportName: "RoyOS",
    tags: ["os", "workspace", "dashboard", "search"],
    metrics: "12 tiles",
  },
  {
    id: "live",
    name: "Roy Live",
    category: "enterprise",
    tier: "enterprise",
    status: "beta",
    icon: "Users",
    shortDescription: "Real-time collaboration with multiplayer cursors.",
    longDescription:
      "Real-time collaboration — multiplayer editing, presence cursors, comments, and share links.",
    cta: { label: "Try it", action: "open:live" },
    componentPath: "@/components/roycss/pro/roy-live",
    exportName: "RoyLive",
    tags: ["live", "collaboration", "realtime", "presence"],
  },

  /* ── Learning & Community / integrations (3) ──────────── */
  {
    id: "academy",
    name: "Roy Academy",
    category: "integrations",
    tier: "pro",
    status: "live",
    icon: "GraduationCap",
    shortDescription: "4 learning paths, 60 lessons, 4 certifications.",
    longDescription:
      "Roy Academy — 4 learning paths, 60 lessons, 4 certifications, and progress tracking.",
    cta: { label: "Try it", action: "open:academy" },
    componentPath: "@/components/roycss/pro/academy",
    exportName: "Academy",
    tags: ["academy", "courses", "learning", "certifications"],
    metrics: "60 lessons",
  },
  {
    id: "community",
    name: "Community Hub",
    category: "integrations",
    tier: "pro",
    status: "live",
    icon: "Users",
    shortDescription: "Stats, contributors, feed, leaderboard, discussions.",
    longDescription:
      "Community hub — stats, 6 contributors, activity feed, leaderboard, and discussions across 3 tabs.",
    cta: { label: "Try it", action: "open:community" },
    componentPath: "@/components/roycss/pro/community-hub",
    exportName: "CommunityHub",
    tags: ["community", "contributors", "discussions", "leaderboard"],
    metrics: "6 contributors",
  },
  {
    id: "showcase",
    name: "Roy Showcase",
    category: "integrations",
    tier: "pro",
    status: "live",
    icon: "Trophy",
    shortDescription: "12 curated projects with perf/a11y scores.",
    longDescription:
      "12 curated projects with performance and a11y scores, industry filters, and a submit form.",
    cta: { label: "Try it", action: "open:showcase" },
    componentPath: "@/components/roycss/pro/roy-showcase",
    exportName: "RoyShowcase",
    tags: ["showcase", "projects", "portfolio"],
    metrics: "12 projects",
  },
];

/* ═══════════════════════════════════════════════════════════════
   CONVENIENCE LOOKUPS
   ═══════════════════════════════════════════════════════════════ */

/** Fast O(1) lookup from id → entry. */
export const PRODUCT_MAP: ReadonlyMap<string, ProductEntry> = new Map(
  PRODUCT_REGISTRY.map((p) => [p.id, p]),
);

/** Lookup by component path string. */
export const PRODUCT_BY_PATH: ReadonlyMap<string, ProductEntry> = new Map(
  PRODUCT_REGISTRY.map((p) => [p.componentPath, p]),
);

/** Get a single product by id (returns undefined if not found). */
export function getProductById(id: string): ProductEntry | undefined {
  return PRODUCT_MAP.get(id);
}

/** All category ids in display order. */
export const PRODUCT_CATEGORY_IDS: ProductCategory[] =
  PRODUCT_CATEGORIES.map((c) => c.id);

/** Filter products by category. */
export function getProductsByCategory(category: ProductCategory): ProductEntry[] {
  return PRODUCT_REGISTRY.filter((p) => p.category === category);
}

/** Counts per category — useful for tab labels. */
export function PRODUCT_CATEGORY_COUNTS(): Record<ProductCategory, number> {
  const counts: Record<ProductCategory, number> = {
    ai: 0,
    components: 0,
    devtools: 0,
    enterprise: 0,
    integrations: 0,
    design: 0,
  };
  for (const p of PRODUCT_REGISTRY) {
    counts[p.category] += 1;
  }
  return counts;
}

/* ═══════════════════════════════════════════════════════════════
   TYPE-ONLY RE-EXPORT (so consumers can `import type` cleanly)
   ═══════════════════════════════════════════════════════════════ */

export type ProductLoader = () => Promise<{ default: ComponentType<unknown> }>;
