/**
 * Products Catalog — lightweight product metadata for the RoyCSS Platform.
 *
 * This file is a SEARCH-INDEX source of truth for the 62 platform products.
 * It intentionally duplicates only the metadata (id / name / description /
 * category / tier / status) from `src/components/roycss/platform-section-unified.tsx`
 * so that search and other consumers can import it WITHOUT pulling in the 62
 * lazy component imports (which would bloat any client bundle that imports
 * the catalog).
 *
 * Keep this file in sync with the PRODUCTS array in platform-section-unified.tsx
 * whenever product metadata changes.
 */

export type ProductCategory =
  | "Build"
  | "Design"
  | "AI"
  | "Developer Tools"
  | "Enterprise"
  | "Learning & Community";

export type ProductTier = "free" | "pro" | "enterprise" | "cloud";

export type ProductStatus = "ready" | "beta" | "roadmap";

export interface ProductMeta {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  tier: ProductTier;
  status: ProductStatus;
}

export const PRODUCTS_CATALOG: ProductMeta[] = [
  /* ── Build (12) ─────────────────────────────────────────────── */
  { id: "data-grid", name: "Pro Data Grid", description: "Sortable, filterable, paginated data table with 50 rows, row selection, and column visibility.", category: "Build", tier: "pro", status: "ready" },
  { id: "kanban", name: "Kanban Board", description: "Drag-and-drop board with 4 columns, 14 cards, priority badges, and inline editing.", category: "Build", tier: "pro", status: "ready" },
  { id: "scheduler", name: "Calendar Scheduler", description: "Month + week views with 11 events, overlap-aware layout, and live 'now' indicator.", category: "Build", tier: "pro", status: "ready" },
  { id: "charts", name: "Pro Charts", description: "Line, bar, donut, and area charts using recharts with OKLCH colors.", category: "Build", tier: "pro", status: "ready" },
  { id: "blocks", name: "Roy Blocks", description: "10 application blocks (Auth, Billing, CRM, Healthcare, Analytics) with live previews.", category: "Build", tier: "pro", status: "ready" },
  { id: "patterns", name: "Pattern Library", description: "12 interactive UI patterns (Accordion, Toast, CommandMenu, FileUpload, etc.).", category: "Build", tier: "pro", status: "ready" },
  { id: "template-library", name: "Template Library", description: "8 live template previews (Hero, FeatureGrid, Pricing, Testimonial, etc.).", category: "Build", tier: "pro", status: "ready" },
  { id: "blueprints", name: "Roy Blueprints", description: "8 complete app architectures (Hospital, POS, ERP, HR, Banking) with folder trees.", category: "Build", tier: "pro", status: "ready" },
  { id: "marketplace", name: "Marketplace", description: "12 templates with search, filter, sort, detail dialogs, and install toasts.", category: "Build", tier: "pro", status: "ready" },
  { id: "plugin-hub", name: "Plugin Hub", description: "12 plugins (Stripe, Clerk, Supabase, Firebase) with install commands and changelogs.", category: "Build", tier: "pro", status: "ready" },
  { id: "forms", name: "Roy Forms", description: "Visual form builder with 10 field types, multi-step, conditional logic, code export.", category: "Build", tier: "pro", status: "ready" },
  { id: "storybook", name: "Roy Storybook", description: "Component documentation with 10 components, variants, states, props, a11y notes.", category: "Build", tier: "pro", status: "ready" },

  /* ── Design (10) ───────────────────────────────────────────── */
  { id: "visual-studio", name: "Visual Studio", description: "Drag-and-drop page builder with 8 component types, properties panel, export HTML.", category: "Design", tier: "pro", status: "ready" },
  { id: "theme-system", name: "Theme System", description: "10 production-ready OKLCH theme presets with live preview and CSS variable export.", category: "Design", tier: "pro", status: "ready" },
  { id: "color-studio", name: "Color Studio", description: "Enterprise color management — 11-step OKLCH scale, WCAG validation, brand generation.", category: "Design", tier: "pro", status: "ready" },
  { id: "gradient-studio", name: "Gradient Studio", description: "Advanced gradients — Linear/Radial/Conic/Mesh, noise texture, animated, aurora, 6 presets.", category: "Design", tier: "pro", status: "ready" },
  { id: "typography", name: "Roy Typography", description: "Type scale generator — fluid clamp, modular ratios, variable font config, reading tips.", category: "Design", tier: "pro", status: "ready" },
  { id: "layout-studio", name: "Layout Studio", description: "Visual grid builder — CSS Grid template-areas, Flexbox, Masonry, Container Queries.", category: "Design", tier: "pro", status: "ready" },
  { id: "motion-studio", name: "Motion Studio", description: "Visual animation builder — 5-track timeline, draggable keyframes, easing, live preview, export.", category: "Design", tier: "pro", status: "ready" },
  { id: "motion-library", name: "Motion Library", description: "12 framer-motion animation primitives with speed control and code snippets.", category: "Design", tier: "pro", status: "ready" },
  { id: "icon-pack", name: "Icon Pack", description: "158 icons across 7 categories with search, size selector, and click-to-copy imports.", category: "Design", tier: "pro", status: "ready" },
  { id: "accessibility", name: "Accessibility Suite", description: "Live DOM audit (10 WCAG checks), a11y score, contrast checker, tab order visualizer.", category: "Design", tier: "pro", status: "ready" },

  /* ── AI (10) ───────────────────────────────────────────────── */
  { id: "roy-ai", name: "RoyAI Assistant", description: "Chat assistant that generates CSS, answers questions, and helps with RoyCSS usage.", category: "AI", tier: "pro", status: "ready" },
  { id: "roy-agents", name: "Roy Agents", description: "8 specialized AI agents for accessibility, performance, docs, refactoring, security.", category: "AI", tier: "pro", status: "ready" },
  { id: "architect", name: "Roy Architect", description: "AI application architect — generates folder structure, tech stack, APIs, and deployment plans from requirements.", category: "AI", tier: "enterprise", status: "ready" },
  { id: "review", name: "Roy Review", description: "AI code reviewer — paste code, get score, findings by severity, and fix recommendations.", category: "AI", tier: "enterprise", status: "ready" },
  { id: "refactor", name: "Roy Refactor", description: "Code modernizer — Bootstrap/Tailwind/Material → RoyCSS with OKLCH, logical properties, diff view.", category: "AI", tier: "pro", status: "ready" },
  { id: "pair", name: "Roy Pair", description: "AI pair programmer chat — specialized for RoyCSS, code highlighting, suggestion chips.", category: "AI", tier: "pro", status: "ready" },
  { id: "designer", name: "Roy Designer", description: "AI UI designer — prompt → mockup preview, color palette, typography, component list.", category: "AI", tier: "enterprise", status: "ready" },
  { id: "generator", name: "Roy Generator", description: "Code generator — Component/Form/CRUD/Table/Dashboard/API with configurable options.", category: "AI", tier: "pro", status: "ready" },
  { id: "search", name: "Roy Search", description: "Universal AI search across 54 items in 8 content types with keyboard nav and highlighting.", category: "AI", tier: "pro", status: "ready" },
  { id: "sandbox", name: "Roy Sandbox", description: "Online dev environment — HTML/CSS/JS editors, live iframe preview, templates, share.", category: "AI", tier: "cloud", status: "ready" },

  /* ── Developer Tools (14) ─────────────────────────────────── */
  { id: "scaffold", name: "Roy Scaffold", description: "Project scaffolding — 8 project types, framework/db/auth selectors, folder tree generation.", category: "Developer Tools", tier: "pro", status: "ready" },
  { id: "sync", name: "Roy Sync", description: "Sync hub — Figma, GitHub, Tokens, Theme with status, sync log, sync all.", category: "Developer Tools", tier: "enterprise", status: "ready" },
  { id: "version", name: "Roy Version", description: "Version management — current/latest, dependency graph, breaking changes, upgrade simulator.", category: "Developer Tools", tier: "pro", status: "ready" },
  { id: "registry", name: "Roy Registry", description: "Package registry — 10 packages, public/private/internal, publish, detail dialog.", category: "Developer Tools", tier: "enterprise", status: "ready" },
  { id: "bundle", name: "Roy Bundle", description: "Bundle optimizer — size breakdown, duplicates, dead CSS, oversized, before/after.", category: "Developer Tools", tier: "pro", status: "ready" },
  { id: "profiler", name: "Roy Profiler", description: "Frontend profiler — render phases, CLS, memory, FPS, recommendations.", category: "Developer Tools", tier: "pro", status: "ready" },
  { id: "benchmark", name: "Roy Benchmark", description: "Benchmarking platform — compare against industry averages and best-in-class.", category: "Developer Tools", tier: "pro", status: "beta" },
  { id: "observatory", name: "Roy Observatory", description: "Production monitoring — CWV, error rate, uptime, alerts, 7-day trend.", category: "Developer Tools", tier: "cloud", status: "ready" },
  { id: "analytics", name: "Analytics Dashboard", description: "KPI cards, traffic chart, top effects, geo distribution, device donut, time ranges.", category: "Developer Tools", tier: "pro", status: "ready" },
  { id: "mentor", name: "Roy Mentor", description: "AI tutor chat — skill levels, topic chips, code examples, XP tracker.", category: "Developer Tools", tier: "free", status: "ready" },
  { id: "challenges", name: "Roy Challenges", description: "Coding challenges — 8 challenges, difficulty, validator, leaderboard, XP.", category: "Developer Tools", tier: "free", status: "ready" },
  { id: "certifications", name: "Roy Certifications", description: "Certification platform — 4 levels, exam scheduling, verification, earned certs.", category: "Developer Tools", tier: "pro", status: "ready" },
  { id: "open", name: "Roy Open", description: "Open-source hub — good first issues, RFCs, roadmap, contributor stats.", category: "Developer Tools", tier: "free", status: "ready" },
  { id: "spotlight", name: "Roy Spotlight", description: "Featured developer showcase — templates, components, plugins, projects, submit.", category: "Developer Tools", tier: "free", status: "ready" },

  /* ── Enterprise (13) ──────────────────────────────────────── */
  { id: "governance", name: "Roy Governance", description: "Design system governance — approval queue, team, policies, audit log.", category: "Enterprise", tier: "enterprise", status: "ready" },
  { id: "compliance", name: "Roy Compliance", description: "Compliance reporting — WCAG/ADA/Section 508, scan, findings, report download.", category: "Enterprise", tier: "enterprise", status: "ready" },
  { id: "audit-center", name: "Audit Center", description: "Enterprise audit dashboard — 5 projects, a11y/perf/security scores, trend, issues.", category: "Enterprise", tier: "enterprise", status: "ready" },
  { id: "fleet", name: "Roy Fleet", description: "Manage hundreds of RoyCSS projects — status, version, health score, scan all.", category: "Enterprise", tier: "enterprise", status: "ready" },
  { id: "workspace", name: "Roy Workspace", description: "Company workspace — shared templates, tokens, components, projects, team members.", category: "Enterprise", tier: "enterprise", status: "ready" },
  { id: "deploy", name: "Roy Deploy", description: "One-click deployment — Vercel/Netlify/Cloudflare/AWS/Azure/GCP, history, env vars.", category: "Enterprise", tier: "cloud", status: "ready" },
  { id: "preview", name: "Roy Preview", description: "Shareable preview environments for branches and pull requests.", category: "Enterprise", tier: "cloud", status: "ready" },
  { id: "cdn", name: "Roy CDN", description: "CDN dashboard — requests, bandwidth, cache hit rate, edge locations, purge cache.", category: "Enterprise", tier: "cloud", status: "ready" },
  { id: "storage", name: "Roy Storage", description: "Cloud storage — file browser, upload, usage bar, breadcrumb, search.", category: "Enterprise", tier: "cloud", status: "ready" },
  { id: "edge", name: "Roy Edge", description: "Edge deployment — 6 regions, latency, TTL, cache strategy, edge-vs-origin comparison.", category: "Enterprise", tier: "cloud", status: "ready" },
  { id: "digital-twin", name: "Roy Digital Twin", description: "Digital twin simulator — performance, accessibility, user journeys, device compatibility.", category: "Enterprise", tier: "enterprise", status: "beta" },
  { id: "os", name: "Roy OS", description: "Unified workspace dashboard — 12 product tiles, quick actions, activity feed, global search.", category: "Enterprise", tier: "enterprise", status: "beta" },
  { id: "live", name: "Roy Live", description: "Real-time collaboration — multiplayer editing, presence cursors, comments, share.", category: "Enterprise", tier: "cloud", status: "beta" },

  /* ── Learning & Community (3) ─────────────────────────────── */
  { id: "academy", name: "Roy Academy", description: "4 learning paths, 60 lessons, 4 certifications, progress tracking.", category: "Learning & Community", tier: "pro", status: "ready" },
  { id: "community", name: "Community Hub", description: "Stats, 6 contributors, activity feed, leaderboard, discussions, 3 tabs.", category: "Learning & Community", tier: "pro", status: "ready" },
  { id: "showcase", name: "Roy Showcase", description: "12 curated projects with performance/a11y scores, industry filters, submit form.", category: "Learning & Community", tier: "pro", status: "ready" },
];

/**
 * Tier metadata — kept here so any consumer (e.g. search overlay) can render
 * a consistent tier badge without re-declaring the styling.
 */
export const PRODUCT_TIER_META: Record<ProductTier, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-primary/10 text-primary" },
  pro: { label: "Pro", className: "bg-foreground/10 text-foreground" },
  enterprise: { label: "Enterprise", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  cloud: { label: "Cloud", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
};
