/**
 * ProductRegistry — single source of truth for the 62 RoyCSS platform products.
 *
 * Each entry is a self-describing record (no JSX, no component imports) so
 * that the same registry can be used by:
 *   - The ProductGrid (filtering, badges, CTA)
 *   - The ComponentComposer (effect composition tool)
 *   - The /api/og social card generator
 *   - The JSON-LD structured data in src/app/layout.tsx
 *
 * Components themselves are loaded lazily by `product-grid.tsx` via the
 * `componentPath` field — which is the bare module specifier under
 * `@/components/roycss/pro/`. This keeps this file free of any client-side
 * import graph and makes it usable on the server.
 *
 * Categories (62 total):
 *   ai (10) · components (12) · devtools (14) · enterprise (13) ·
 *   integrations (3) · design (10)
 */

export type ProductCategory =
  | "ai"
  | "components"
  | "devtools"
  | "enterprise"
  | "integrations"
  | "design";

export type ProductTier = "free" | "pro" | "enterprise" | "cloud";
export type ProductStatus = "ready" | "beta" | "roadmap" | "experimental";

export interface ProductEntry {
  id: string;
  name: string;
  category: ProductCategory;
  tier: ProductTier;
  status: ProductStatus;
  icon: string; // lucide icon name, resolved in product-card.tsx
  shortDescription: string;
  longDescription: string;
  cta: string;
  componentPath: string; // e.g. "@/components/roycss/pro/roy-blocks"
  tags: string[];
}

/** helper to reduce per-entry boilerplate (positional args + sensible defaults). */
function entry(
  id: string,
  name: string,
  category: ProductCategory,
  tier: ProductTier,
  status: ProductStatus,
  icon: string,
  shortDescription: string,
  longDescription: string,
  cta: string,
  componentPath: string,
  tags: string[],
): ProductEntry {
  return { id, name, category, tier, status, icon, shortDescription, longDescription, cta, componentPath, tags };
}

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; description: string }[] = [
  { id: "ai", label: "AI", description: "AI agents, AI migration, AI playground, MCP server & code review" },
  { id: "components", label: "Components", description: "Blocks, patterns, templates, marketplace & layout studio" },
  { id: "devtools", label: "Dev Tools", description: "Specificity, generators, visualizers, analyzers & studios" },
  { id: "enterprise", label: "Enterprise", description: "Governance, compliance, observatory, fleet & OS" },
  { id: "integrations", label: "Integrations", description: "Registry, CDN, sync, deploy & edge" },
  { id: "design", label: "Design", description: "Theme, color, type, motion, gradients & icons" },
];

export const PRODUCT_TIERS: { id: ProductTier; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "pro", label: "Pro" },
  { id: "enterprise", label: "Enterprise" },
  { id: "cloud", label: "Cloud" },
];

export const PRODUCT_STATUSES: { id: ProductStatus; label: string }[] = [
  { id: "ready", label: "Ready" },
  { id: "beta", label: "Beta" },
  { id: "experimental", label: "Experimental" },
  { id: "roadmap", label: "Roadmap" },
];

export const PRODUCTS: ProductEntry[] = [
  /* ───────────── AI (10) ───────────── */
  entry("roy-ai", "RoyAI", "ai", "pro", "ready", "Bot",
    "AI assistant for CSS questions & migration.",
    "Conversational AI trained on RoyCSS recipes, effect catalog, and migration paths from Tailwind, Bootstrap, and Radix.",
    "Chat with RoyAI", "@/components/roycss/pro/roy-ai",
    ["ai", "assistant", "chatbot"]),
  entry("roy-architect", "RoyArchitect", "ai", "pro", "beta", "BrainCircuit",
    "AI generator for full-page layouts from prompts.",
    "RoyArchitect turns a single sentence like 'pricing page for a SaaS with 3 tiers' into production-ready JSX wired to the RoyCSS design system.",
    "Generate a page", "@/components/roycss/pro/roy-architect",
    ["ai", "generator", "layout", "prompt"]),
  entry("roy-agents", "RoyAgents", "ai", "enterprise", "beta", "Users",
    "Autonomous agents for audits & refactors.",
    "RoyAgents dispatches a fleet of autonomous agents to audit a codebase, propose refactor patches, and open PRs with human-readable diffs.",
    "Spawn agents", "@/components/roycss/pro/roy-agents",
    ["ai", "agents", "autonomous", "refactor"]),
  entry("roy-pair", "RoyPair", "ai", "pro", "beta", "Sparkles",
    "AI pair-programmer for CSS suggestions.",
    "RoyPair sits beside your editor and proposes class substitutions, accessibility fixes, and performance wins as you type.",
    "Pair with RoyPair", "@/components/roycss/pro/roy-pair",
    ["ai", "pair-programming", "suggestions"]),
  entry("roy-mentor", "RoyMentor", "ai", "pro", "beta", "GraduationCap",
    "Adaptive mentor for learning modern CSS.",
    "RoyMentor generates a personalized curriculum from a 5-minute skill check and walks you through progressive exercises with live previews.",
    "Start learning", "@/components/roycss/pro/roy-mentor",
    ["ai", "learning", "mentor", "curriculum"]),
  entry("roy-review", "RoyReview", "ai", "enterprise", "beta", "Shield",
    "AI code review with rule engine.",
    "RoyReview runs 60+ rules on every PR — accessibility, performance, browser support, color contrast — and posts inline comments with one-click fixes.",
    "Review code", "@/components/roycss/pro/roy-review",
    ["ai", "review", "pr", "accessibility"]),
  entry("roy-refactor", "RoyRefactor", "ai", "pro", "beta", "Wand2",
    "Refactor engine for legacy CSS.",
    "RoyRefactor rewrites legacy CSS into RoyCSS utilities, logical properties, and OKLCH colors with a 3-way merge preview.",
    "Refactor now", "@/components/roycss/pro/roy-refactor",
    ["ai", "refactor", "migration"]),
  entry("roy-generator", "RoyGenerator", "ai", "pro", "beta", "Hammer",
    "Scaffold generators from natural language.",
    "RoyGenerator turns 'auth form with email + magic link' into a complete JSX file with form validation, a11y labels, and preview.",
    "Generate code", "@/components/roycss/pro/roy-generator",
    ["ai", "generator", "scaffold"]),
  entry("roy-scaffold", "RoyScaffold", "ai", "pro", "beta", "Blocks",
    "Project scaffolds with one click.",
    "RoyScaffold bootstraps a Next.js + RoyCSS project with auth, design tokens, and accessibility tooling wired in.",
    "Scaffold a project", "@/components/roycss/pro/roy-scaffold",
    ["ai", "scaffold", "bootstrap"]),
  entry("roy-search", "RoySearch", "ai", "pro", "ready", "Search",
    "AI semantic search across effects & recipes.",
    "RoySearch indexes 1,749 effects and 200+ recipes and lets you search by meaning — 'subtle entrance animation' returns the right 5 cards.",
    "Search RoyCSS", "@/components/roycss/pro/roy-search",
    ["ai", "search", "semantic"]),

  /* ───────────── Components (12) ───────────── */
  entry("roy-blocks", "RoyBlocks", "components", "pro", "ready", "Blocks",
    "Marketplace of production-ready application blocks.",
    "RoyBlocks ships 10 application blocks — Auth, Billing, CRM, Healthcare, Analytics, Admin, Team, Notifications, Onboarding, Dashboard — each with live preview + code view.",
    "Browse blocks", "@/components/roycss/pro/roy-blocks",
    ["blocks", "marketplace", "jsx"]),
  entry("pattern-library", "PatternLibrary", "components", "free", "ready", "Shapes",
    "Curated CSS pattern library with copy-paste recipes.",
    "PatternLibrary contains 80+ design patterns (cards, lists, navigation) — each with HTML, CSS, and a live preview at three breakpoints.",
    "Browse patterns", "@/components/roycss/pro/pattern-library",
    ["patterns", "library", "copy"]),
  entry("template-library", "TemplateLibrary", "components", "pro", "ready", "LayoutGrid",
    "Full-page templates for SaaS, marketing, docs & admin.",
    "TemplateLibrary ships 24 templates — landing pages, pricing, docs, admin dashboards, error pages — built on RoyCSS design tokens.",
    "Browse templates", "@/components/roycss/pro/template-library",
    ["templates", "landing", "dashboard"]),
  entry("marketplace", "Marketplace", "components", "cloud", "beta", "Store",
    "Community marketplace for RoyCSS templates.",
    "Marketplace lets creators publish templates, blocks, and effects — buyers get one-click install with automatic version updates.",
    "Visit marketplace", "@/components/roycss/pro/marketplace",
    ["marketplace", "community", "templates"]),
  entry("roy-blueprints", "RoyBlueprints", "components", "pro", "ready", "BookOpen",
    "Page-level blueprints for design systems.",
    "RoyBlueprints gives you 18 blueprints — pricing, contact, dashboard, blog, marketing — each as a complete page wired to the RoyCSS design system.",
    "Browse blueprints", "@/components/roycss/pro/roy-blueprints",
    ["blueprints", "page", "design-system"]),
  entry("roy-forms", "RoyForms", "components", "pro", "beta", "FormInput",
    "Accessible form components with validation.",
    "RoyForms ships 24 form primitives (input, select, datepicker, toggle, slider) with built-in validation, ARIA, and keyboard nav.",
    "Browse forms", "@/components/roycss/pro/roy-forms",
    ["forms", "validation", "a11y"]),
  entry("data-grid", "DataGrid", "components", "enterprise", "ready", "Table2",
    "High-performance data grid with sorting & filtering.",
    "DataGrid handles 100k rows via virtualization, with column resize, sort, multi-filter, and inline edit — all keyboard accessible.",
    "View data grid", "@/components/roycss/pro/data-grid",
    ["data-grid", "virtualization", "table"]),
  entry("kanban-board", "KanbanBoard", "components", "pro", "ready", "KanbanSquare",
    "Drag-and-drop Kanban board with columns & cards.",
    "KanbanBoard is a fully accessible drag-and-drop board with column reordering, card labels, due dates, and swimlanes.",
    "View Kanban", "@/components/roycss/pro/kanban-board"),
  entry("scheduler", "Scheduler", "components", "pro", "ready", "Calendar",
    "Calendar scheduler with month / week / day views.",
    "Scheduler renders month/week/day views with drag-to-create events, all-day banners, and timezone-aware syncing.",
    "Open scheduler", "@/components/roycss/pro/scheduler",
    ["scheduler", "calendar", "events"]),
  entry("charts", "Charts", "components", "pro", "ready", "BarChart3",
    "Chart library with OKLCH colors & dark mode.",
    "Charts renders area, bar, line, and pie charts using OKLCH colors and respecting the active theme — built on Recharts with a custom theme layer.",
    "View charts", "@/components/roycss/pro/charts",
    ["charts", "data-viz", "oklch"]),
  entry("roy-storybook", "RoyStorybook", "components", "pro", "beta", "BookOpen",
    "Storybook-style playground for components.",
    "RoyStorybook lets you isolate, view, and tweak props on every RoyCSS component without leaving the page.",
    "Open Storybook", "@/components/roycss/pro/roy-storybook",
    ["storybook", "playground", "isolated"]),
  entry("roy-showcase", "RoyShowcase", "components", "free", "ready", "LayoutGrid",
    "Visual showcase of all RoyCSS components.",
    "RoyShowcase is the one-stop gallery of every RoyCSS component — perfect for marketing and onboarding.",
    "Browse showcase", "@/components/roycss/pro/roy-showcase",
    ["showcase", "gallery", "components"]),

  /* ───────────── DevTools (14) ───────────── */
  entry("roy-bundle", "RoyBundle", "devtools", "pro", "ready", "Package",
    "Bundle analyzer for CSS duplicates & dead rules.",
    "RoyBundle scans your CSS for duplicate selectors, dead rules, and unused variables — and produces a one-click patch.",
    "Analyze bundle", "@/components/roycss/pro/roy-bundle",
    ["bundle", "analyzer", "dead-code"]),
  entry("roy-profiler", "RoyProfiler", "devtools", "pro", "ready", "Gauge",
    "Runtime CSS profiler with paint metrics.",
    "RoyProfiler instruments layout, paint, and composite times per CSS rule so you can find what's actually jank.",
    "Profile CSS", "@/components/roycss/pro/roy-profiler",
    ["profiler", "performance", "paint"]),
  entry("roy-benchmark", "RoyBenchmark", "devtools", "pro", "ready", "Activity",
    "Headless benchmarks across browsers & devices.",
    "RoyBenchmark runs your CSS through 12 browsers + 6 devices and produces a support matrix with median paint times.",
    "Run benchmark", "@/components/roycss/pro/roy-benchmark",
    ["benchmark", "browsers", "performance"]),
  entry("roy-observatory", "RoyObservatory", "devtools", "enterprise", "beta", "Eye",
    "Observability for production CSS payloads.",
    "RoyObservatory tracks your production CSS payload size, unused rules, and override rate across every page on your site.",
    "Observe CSS", "@/components/roycss/pro/roy-observatory",
    ["observability", "monitor", "production"]),
  entry("roy-sandbox", "RoySandbox", "devtools", "free", "ready", "Boxes",
    "Isolated sandbox for testing CSS snippets.",
    "RoySandbox spins up an isolated iframe so you can test CSS in pure isolation — no cascade leakage.",
    "Open sandbox", "@/components/roycss/pro/roy-sandbox",
    ["sandbox", "iframe", "test"]),
  entry("roy-preview", "RoyPreview", "devtools", "free", "ready", "Eye",
    "Multi-viewport preview at 6 breakpoints.",
    "RoyPreview renders your component at 6 breakpoints side-by-side so you can spot responsive issues instantly.",
    "Preview component", "@/components/roycss/pro/roy-preview",
    ["preview", "responsive", "breakpoints"]),
  entry("roy-cdn", "RoyCDN", "devtools", "cloud", "ready", "Cloud",
    "CDN distribution for RoyCSS versions.",
    "RoyCDN publishes every tagged version to a multi-region edge network and exposes per-version traffic stats.",
    "View CDN stats", "@/components/roycss/pro/roy-cdn",
    ["cdn", "distribution", "edge"]),
  entry("roy-edge", "RoyEdge", "devtools", "cloud", "beta", "Globe",
    "Edge runtime for per-region CSS overrides.",
    "RoyEdge runs per-region CSS overrides at the edge so EU users get GDPR-friendly defaults without an extra round-trip.",
    "Configure edge", "@/components/roycss/pro/roy-edge",
    ["edge", "runtime", "regions"]),
  entry("roy-storage", "RoyStorage", "devtools", "cloud", "beta", "Database",
    "Object storage for user collections & favorites.",
    "RoyStorage persists user collections, favorites, and copy history to the cloud so they sync across devices.",
    "View storage", "@/components/roycss/pro/roy-storage",
    ["storage", "sync", "cloud"]),
  entry("roy-sync", "RoySync", "devtools", "cloud", "beta", "RefreshCw",
    "Real-time sync for cross-device state.",
    "RoySync pushes collections, favorites, and history changes to every signed-in device in under 200ms via websockets.",
    "View sync status", "@/components/roycss/pro/roy-sync",
    ["sync", "realtime", "websocket"]),
  entry("roy-version", "RoyVersion", "devtools", "free", "ready", "GitBranch",
    "Versioned RoyCSS release explorer.",
    "RoyVersion lets you browse every RoyCSS release, diff any two versions, and pin your CDN link to a specific version.",
    "Browse versions", "@/components/roycss/pro/roy-version",
    ["version", "release", "diff"]),
  entry("roy-deploy", "RoyDeploy", "devtools", "cloud", "beta", "Rocket",
    "One-click deploy of static sites to the edge.",
    "RoyDeploy ships your static site to 14 edge regions in one command with atomic deploys + instant rollbacks.",
    "Deploy now", "@/components/roycss/pro/roy-deploy",
    ["deploy", "edge", "static"]),
  entry("roy-live", "RoyLive", "devtools", "cloud", "beta", "Radio",
    "Live share sessions for pair-programming.",
    "RoyLive lets you share your RoyCSS playground with a teammate in real-time — both cursors, both edits, no merge conflicts.",
    "Start live share", "@/components/roycss/pro/roy-live",
    ["live", "pair", "share"]),
  entry("roy-open", "RoyOpen", "devtools", "free", "ready", "Unlock",
    "Open-source mirror of the RoyCSS repo.",
    "RoyOpen is the public open-source home for RoyCSS — issues, RFCs, and contribution guides.",
    "View repo", "@/components/roycss/pro/roy-open",
    ["open-source", "github", "contributing"]),

  /* ───────────── Enterprise (13) ───────────── */
  entry("roy-governance", "RoyGovernance", "enterprise", "enterprise", "beta", "Shield",
    "Governance policies for design systems.",
    "RoyGovernance enforces your design-token policy at PR time — no off-system colors, no off-system spacing, no surprises in prod.",
    "View policies", "@/components/roycss/pro/roy-governance",
    ["governance", "policy", "design-system"]),
  entry("roy-compliance", "RoyCompliance", "enterprise", "enterprise", "beta", "CheckCircle",
    "Compliance pack for WCAG, GDPR, SOC2.",
    "RoyCompliance ships automated checks for WCAG 2.2 AA, GDPR cookie banners, and SOC2 audit logs.",
    "View compliance", "@/components/roycss/pro/roy-compliance",
    ["compliance", "wcag", "gdpr", "soc2"]),
  entry("roy-audit-center", "RoyAuditCenter", "enterprise", "enterprise", "beta", "ClipboardCheck",
    "Central audit center for accessibility & performance.",
    "RoyAuditCenter aggregates a11y + perf audits across every page on your site, with trend graphs and per-team leaderboards.",
    "Open audit center", "@/components/roycss/pro/roy-audit-center",
    ["audit", "accessibility", "performance"]),
  entry("roy-fleet", "RoyFleet", "enterprise", "enterprise", "beta", "Truck",
    "Multi-site fleet management for RoyCSS deploys.",
    "RoyFleet manages RoyCSS deploys across 100+ sites — atomic, scheduled, with automatic rollback on regression.",
    "View fleet", "@/components/roycss/pro/roy-fleet",
    ["fleet", "multi-site", "deploy"]),
  entry("roy-os", "RoyOS", "enterprise", "enterprise", "beta", "Monitor",
    "Operating system for design system teams.",
    "RoyOS unifies tokens, components, docs, and governance into one workspace with SSO + audit logs.",
    "Open RoyOS", "@/components/roycss/pro/roy-os",
    ["os", "workspace", "design-system"]),
  entry("roy-workspace", "RoyWorkspace", "enterprise", "enterprise", "beta", "LayoutDashboard",
    "Workspace with role-based access control.",
    "RoyWorkspace gives every team a private workspace with RBAC, shared collections, and per-team audit trails.",
    "Open workspace", "@/components/roycss/pro/roy-workspace",
    ["workspace", "rbac", "teams"]),
  entry("roy-digital-twin", "RoyDigitalTwin", "enterprise", "enterprise", "beta", "Boxes",
    "Digital twin of your production frontend.",
    "RoyDigitalTwin mirrors your production frontend in a sandbox so you can run what-if experiments (new tokens, new components) without breaking prod.",
    "View twin", "@/components/roycss/pro/roy-digital-twin",
    ["digital-twin", "simulation", "what-if"]),
  entry("roy-registry", "RoyRegistry", "enterprise", "enterprise", "beta", "Package",
    "Private registry for internal RoyCSS packages.",
    "RoyRegistry hosts your private RoyCSS packages — components, blocks, recipes — with versioning + access control.",
    "Open registry", "@/components/roycss/pro/roy-registry",
    ["registry", "private", "npm"]),
  entry("roy-spotlight", "RoySpotlight", "enterprise", "pro", "beta", "Sparkle",
    "Spotlight search across all RoyCSS resources.",
    "RoySpotlight is a ⌘K-style command bar that searches effects, recipes, components, docs, and your team's private collections in one place.",
    "Open spotlight", "@/components/roycss/pro/roy-spotlight",
    ["spotlight", "search", "command-bar"]),
  entry("roy-challenges", "RoyChallenges", "enterprise", "free", "ready", "Trophy",
    "Daily CSS challenges for teams.",
    "RoyChallenges sends a daily 5-minute CSS challenge to your team — leaderboard, badges, and an end-of-week recap.",
    "View challenges", "@/components/roycss/pro/roy-challenges",
    ["challenges", "team", "leaderboard"]),
  entry("roy-certifications", "RoyCertifications", "enterprise", "pro", "beta", "Award",
    "RoyCSS certifications for individuals & teams.",
    "RoyCertifications offers verified RoyCSS certifications (Foundation, Practitioner, Architect) with online proctored exams.",
    "View certifications", "@/components/roycss/pro/roy-certifications",
    ["certifications", "exam", "badges"]),
  entry("academy", "Academy", "enterprise", "free", "ready", "GraduationCap",
    "Free courses on RoyCSS + modern CSS.",
    "Academy is a free 12-module course covering OKLCH, logical properties, container queries, scroll-driven animations, and RoyCSS best practices.",
    "Start academy", "@/components/roycss/pro/academy",
    ["academy", "courses", "free"]),
  entry("community-hub", "CommunityHub", "enterprise", "free", "ready", "Users",
    "Community hub for RoyCSS users.",
    "CommunityHub is the social home for RoyCSS — forums, showcase, events, and a job board for RoyCSS-certified engineers.",
    "Visit community", "@/components/roycss/pro/community-hub",
    ["community", "forums", "events"]),

  /* ───────────── Integrations (3) ───────────── */
  entry("plugin-hub", "PluginHub", "integrations", "cloud", "beta", "Plug",
    "Plugin hub for VSCode, Figma & browser.",
    "PluginHub is the official marketplace for RoyCSS plugins — VSCode snippets, Figma variables, and a Chrome inspector.",
    "Browse plugins", "@/components/roycss/pro/plugin-hub",
    ["plugins", "vscode", "figma"]),
  entry("analytics-dashboard", "AnalyticsDashboard", "integrations", "cloud", "beta", "LineChart",
    "Analytics dashboard for RoyCSS usage.",
    "AnalyticsDashboard shows which RoyCSS components are used most across your team, plus adoption trends and power-user leaderboards.",
    "View analytics", "@/components/roycss/pro/analytics-dashboard",
    ["analytics", "adoption", "metrics"]),
  entry("accessibility-suite", "AccessibilitySuite", "integrations", "pro", "ready", "Accessibility",
    "Full accessibility suite: axe + manual checks.",
    "AccessibilitySuite bundles automated axe checks with manual keyboard nav and contrast tests, exported as a shareable report.",
    "Run a11y suite", "@/components/roycss/pro/accessibility-suite",
    ["a11y", "wcag", "audit"]),

  /* ───────────── Design (10) ───────────── */
  entry("theme-system", "ThemeSystem", "design", "free", "ready", "Palette",
    "10 theme presets with OKLCH tokens.",
    "ThemeSystem ships 10 curated theme presets (forest, sunset, midnight, etc.) all expressed in OKLCH with auto dark mode.",
    "Browse themes", "@/components/roycss/pro/theme-system",
    ["theme", "presets", "oklch"]),
  entry("icon-pack", "IconPack", "design", "free", "ready", "Sparkle",
    "Curated icon pack with 480 icons.",
    "IconPack ships 480 pixel-perfect icons in 3 weights — all as React components with auto a11y labels.",
    "Browse icons", "@/components/roycss/pro/icon-pack",
    ["icons", "svg", "library"]),
  entry("motion-library", "MotionLibrary", "design", "free", "ready", "Film",
    "Curated motion library with 60 presets.",
    "MotionLibrary contains 60 motion presets — entrance, exit, hover, attention — each as a copy-paste CSS keyframe.",
    "Browse motion", "@/components/roycss/pro/motion-library",
    ["motion", "animation", "presets"]),
  entry("visual-studio", "VisualStudio", "design", "pro", "ready", "Wand2",
    "Visual editor for RoyCSS design tokens.",
    "VisualStudio is a drag-and-drop editor for design tokens — change one color, see the entire system update live.",
    "Open VisualStudio", "@/components/roycss/pro/visual-studio",
    ["visual", "editor", "tokens"]),
  entry("roy-color-studio", "RoyColorStudio", "design", "pro", "ready", "Palette",
    "OKLCH color studio with palette presets.",
    "RoyColorStudio is a full OKLCH color studio — palette generator, contrast checker, and per-preset previews.",
    "Open color studio", "@/components/roycss/pro/roy-color-studio",
    ["color", "oklch", "palette"]),
  entry("roy-typography", "RoyTypography", "design", "pro", "ready", "Type",
    "Type studio with fluid typography.",
    "RoyTypography ships fluid type scales, font pairings, and a clamp() generator with live previews at every breakpoint.",
    "Open type studio", "@/components/roycss/pro/roy-typography",
    ["typography", "fluid", "fonts"]),
  entry("roy-motion-studio", "RoyMotionStudio", "design", "pro", "beta", "Clapperboard",
    "Motion studio with keyframe editor.",
    "RoyMotionStudio is a full visual keyframe editor with timeline, easing curves, and copy-as-CSS export.",
    "Open motion studio", "@/components/roycss/pro/roy-motion-studio",
    ["motion", "keyframes", "editor"]),
  entry("roy-gradient-studio", "RoyGradientStudio", "design", "pro", "ready", "Droplets",
    "Gradient studio with mesh & conic.",
    "RoyGradientStudio generates linear, radial, conic, and mesh gradients with a live preview and copy-as-CSS export.",
    "Open gradient studio", "@/components/roycss/pro/roy-gradient-studio",
    ["gradient", "mesh", "conic"]),
  entry("roy-layout-studio", "RoyLayoutStudio", "design", "pro", "beta", "LayoutTemplate",
    "Layout studio for grid & flexbox.",
    "RoyLayoutStudio is a visual editor for grid + flexbox — drag columns, drop rows, copy the CSS, done.",
    "Open layout studio", "@/components/roycss/pro/roy-layout-studio",
    ["layout", "grid", "flexbox"]),
  entry("roy-designer", "RoyDesigner", "design", "pro", "beta", "PenTool",
    "Full design editor for RoyCSS presets.",
    "RoyDesigner is a full visual design editor — change tokens, preview components live, then export as a theme preset.",
    "Open designer", "@/components/roycss/pro/roy-designer",
    ["designer", "editor", "presets"]),
];

/** Quick lookup helpers — keep functions pure so they're tree-shakeable. */
export function getProductById(id: string): ProductEntry | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(cat: ProductCategory): ProductEntry[] {
  return PRODUCTS.filter((p) => p.category === cat);
}

export function searchProducts(query: string): ProductEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return PRODUCTS;
  return PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.shortDescription.toLowerCase().includes(q) ||
    p.longDescription.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export const PRODUCT_COUNT = PRODUCTS.length;
