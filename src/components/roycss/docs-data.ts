/**
 * RoyCSS Documentation Taxonomy — 5-category reorganization
 * ─────────────────────────────────────────────────────────────────
 * Curated index that organizes RoyCSS documentation into the 5 brief-
 * specified categories:
 *
 *   GET STARTED   → Installation, Quick Start, Configuration, Concepts
 *   FOUNDATIONS   → CSS, Utilities, Layout, Tokens, Themes, Responsive Design
 *   UI            → Components, Effects, Patterns, Templates
 *   TOOLS         → CLI, Inspector, DevTools, Playground, AI / MCP
 *   ADVANCED      → Accessibility, Performance, Architecture, Migration, Troubleshooting
 *
 * This file is the canonical taxonomy surface for the docs section. It
 * is intentionally self-contained — it does NOT import the generated
 * `src/lib/docs-data.ts` blob (which holds full markdown content for
 * the 19 architecture/lab/blueprint documents) so that the taxonomy
 * can be rendered cheaply on the homepage and elsewhere.
 *
 * Cross-reference:
 *   - `refSlug` on a DocsEntry points to the slug of the same document
 *     in `src/lib/docs-data.ts` (when status === "ready"). The
 *     docs-viewer Sheet uses that slug to load full content.
 *   - Entries with `status === "coming-soon"` are placeholder topics
 *     on the planned roadmap — they have no backing markdown yet.
 *
 * See: docs/adr/03-docs-site.md (original docs taxonomy ADR).
 */

/* ─── Types ────────────────────────────────────────────────────── */

export type DocsCategoryId =
  | "get-started"
  | "foundations"
  | "ui"
  | "tools"
  | "advanced";

export type DocsStatus = "ready" | "coming-soon";

export interface DocsEntry {
  /** URL-safe identifier, e.g. "installation". */
  slug: string;
  /** Display title, e.g. "Installation". */
  title: string;
  /** Category ID. */
  category: DocsCategoryId;
  /** Human-readable category label, e.g. "Get Started". */
  categoryLabel: string;
  /** Short one-line description shown in the index. */
  description: string;
  /** Readiness flag — "ready" links to live content, "coming-soon" is a placeholder. */
  status: DocsStatus;
  /** Optional: slug of the backing markdown doc in src/lib/docs-data.ts. */
  refSlug?: string;
  /** Optional: word count of the backing markdown doc. */
  wordCount?: number;
  /** Optional: H2 count (table-of-contents depth) of the backing doc. */
  tocCount?: number;
}

export interface DocsCategoryMeta {
  /** Human-readable label. */
  label: string;
  /** Short tagline shown under the category header. */
  description: string;
  /** Lucide icon name (resolved by the consumer). */
  icon: string;
  /** Display order — lower numbers appear first. */
  order: number;
}

/* ─── Category metadata ────────────────────────────────────────── */

export const categoryOrder: DocsCategoryId[] = [
  "get-started",
  "foundations",
  "ui",
  "tools",
  "advanced",
];

export const categoryMeta: Record<DocsCategoryId, DocsCategoryMeta> = {
  "get-started": {
    label: "Get Started",
    description: "Install RoyCSS and ship your first effect in minutes.",
    icon: "Rocket",
    order: 1,
  },
  foundations: {
    label: "Foundations",
    description: "The CSS primitives, tokens, and layout model RoyCSS builds on.",
    icon: "Layers",
    order: 2,
  },
  ui: {
    label: "UI",
    description: "Components, effects, patterns, and templates — the building blocks.",
    icon: "Component",
    order: 3,
  },
  tools: {
    label: "Tools",
    description: "CLI, inspector, DevTools, playground, and AI / MCP integrations.",
    icon: "Wrench",
    order: 4,
  },
  advanced: {
    label: "Advanced",
    description: "Accessibility, performance, architecture, migration, troubleshooting.",
    icon: "GraduationCap",
    order: 5,
  },
};

/* ─── Helpers ──────────────────────────────────────────────────── */

/** Return the human-readable label for a category ID. */
export function getCategoryLabel(id: DocsCategoryId): string {
  return categoryMeta[id].label;
}

/** Return only the entries that belong to a given category, in declared order. */
export function getDocsByCategory(id: DocsCategoryId): DocsEntry[] {
  return docsIndex.filter((d) => d.category === id);
}

/** Return the count of "ready" docs in a category. */
export function getReadyCount(id: DocsCategoryId): number {
  return docsIndex.filter((d) => d.category === id && d.status === "ready")
    .length;
}

/* ─── Doc index (24 entries — 5 categories) ──────────────────────
   Existing docs from src/lib/docs-data.ts are mapped to the new
   taxonomy via `refSlug`. Topics without backing content are marked
   status="coming-soon". See file header for the mapping rationale.
   ─────────────────────────────────────────────────────────────────── */

export const docsIndex: DocsEntry[] = [
  /* ── GET STARTED ───────────────────────────────────────────── */
  {
    slug: "installation",
    title: "Installation",
    category: "get-started",
    categoryLabel: "Get Started",
    description:
      "Add RoyCSS to any project via npm, CDN, or zero-build copy-paste — pick the workflow that fits your stack.",
    status: "coming-soon",
  },
  {
    slug: "quick-start",
    title: "Quick Start",
    category: "get-started",
    categoryLabel: "Get Started",
    description:
      "Browse the catalog, customize an effect in the playground, and copy production-ready CSS in under five minutes.",
    status: "coming-soon",
  },
  {
    slug: "configuration",
    title: "Configuration",
    category: "get-started",
    categoryLabel: "Get Started",
    description:
      "Tune theme tokens, layer order, and bundle scope via a single roy.config file — sensible defaults out of the box.",
    status: "coming-soon",
  },
  {
    slug: "concepts",
    title: "Concepts",
    category: "get-started",
    categoryLabel: "Get Started",
    description:
      "RoyCSS platform vision, content taxonomy, and the design philosophy that shapes every primitive.",
    status: "ready",
    refSlug: "platform-vision",
    wordCount: 0,
    tocCount: 0,
  },

  /* ── FOUNDATIONS ───────────────────────────────────────────── */
  {
    slug: "css",
    title: "CSS",
    category: "foundations",
    categoryLabel: "Foundations",
    description:
      "How RoyCSS embraces modern CSS — cascade layers, container queries, :has(), nesting, and custom properties.",
    status: "coming-soon",
  },
  {
    slug: "utilities",
    title: "Utilities",
    category: "foundations",
    categoryLabel: "Foundations",
    description:
      "Atomic, composable utility classes generated from your token set — never write boilerplate CSS again.",
    status: "coming-soon",
  },
  {
    slug: "layout",
    title: "Layout",
    category: "foundations",
    categoryLabel: "Foundations",
    description:
      "Grid, flex, container, and subgrid patterns for responsive, app-grade layouts without a framework.",
    status: "coming-soon",
  },
  {
    slug: "tokens",
    title: "Tokens",
    category: "foundations",
    categoryLabel: "Foundations",
    description:
      "Design tokens (color, space, type, radius, motion) as the single source of truth across themes and components.",
    status: "coming-soon",
  },
  {
    slug: "themes",
    title: "Themes",
    category: "foundations",
    categoryLabel: "Foundations",
    description:
      "Multi-theme, dark mode, brand variants, and runtime theme switching via OKLCH-driven CSS variables.",
    status: "coming-soon",
  },
  {
    slug: "responsive-design",
    title: "Responsive Design",
    category: "foundations",
    categoryLabel: "Foundations",
    description:
      "Fluid type, container queries, and the responsive utilities that adapt any component to its viewport.",
    status: "coming-soon",
  },

  /* ── UI ────────────────────────────────────────────────────── */
  {
    slug: "components",
    title: "Components",
    category: "ui",
    categoryLabel: "UI",
    description:
      "Reusable UI building blocks — buttons, cards, inputs, modals — copy-ready and accessible by default.",
    status: "coming-soon",
  },
  {
    slug: "effects",
    title: "Effects",
    category: "ui",
    categoryLabel: "UI",
    description:
      "Visual interactions and animations — hover states, transitions, motion, and signature CSS effects.",
    status: "coming-soon",
  },
  {
    slug: "patterns",
    title: "Patterns",
    category: "ui",
    categoryLabel: "UI",
    description:
      "Complete UI/UX solutions — auth flows, dashboards, settings panels — composed from components and effects.",
    status: "coming-soon",
  },
  {
    slug: "templates",
    title: "Templates",
    category: "ui",
    categoryLabel: "UI",
    description:
      "Full-page starting points — landing pages, admin layouts, marketing sites — production-ready scaffolds.",
    status: "coming-soon",
  },

  /* ── TOOLS ─────────────────────────────────────────────────── */
  {
    slug: "cli",
    title: "CLI",
    category: "tools",
    categoryLabel: "Tools",
    description:
      "The `roycss` command-line tool — scaffold projects, generate tokens, sync collections, and audit bundles.",
    status: "coming-soon",
  },
  {
    slug: "inspector",
    title: "Inspector",
    category: "tools",
    categoryLabel: "Tools",
    description:
      "Browser DevTools extension that surfaces the cascade, layers, and tokens behind any RoyCSS class.",
    status: "coming-soon",
  },
  {
    slug: "devtools",
    title: "DevTools",
    category: "tools",
    categoryLabel: "Tools",
    description:
      "Official VS Code extension and editor integrations for class autocomplete, hover previews, and refactors.",
    status: "ready",
    refSlug: "vscode-extension",
    wordCount: 0,
    tocCount: 0,
  },
  {
    slug: "playground",
    title: "Playground",
    category: "tools",
    categoryLabel: "Tools",
    description:
      "In-browser playground to customize effects, preview across themes, and export copy-ready CSS or CodePen.",
    status: "coming-soon",
  },
  {
    slug: "ai-mcp",
    title: "AI / MCP",
    category: "tools",
    categoryLabel: "Tools",
    description:
      "MCP server and AI assistant integrations for natural-language effect search, generation, and refactors.",
    status: "coming-soon",
  },

  /* ── ADVANCED ──────────────────────────────────────────────── */
  {
    slug: "accessibility",
    title: "Accessibility",
    category: "advanced",
    categoryLabel: "Advanced",
    description:
      "WCAG-aligned patterns, focus management, reduced-motion defaults, and the accessibility ADRs.",
    status: "coming-soon",
  },
  {
    slug: "performance",
    title: "Performance",
    category: "advanced",
    categoryLabel: "Advanced",
    description:
      "Bundle budgets, render-path audits, animation jank profiling, and the RoyCSS performance lab findings.",
    status: "ready",
    refSlug: "labs-33-performance-lab",
    wordCount: 0,
    tocCount: 0,
  },
  {
    slug: "architecture",
    title: "Architecture",
    category: "advanced",
    categoryLabel: "Advanced",
    description:
      "First-principles redesign, V2 blueprint, ten-year architecture, and the RoyCSS Labs research papers.",
    status: "ready",
    refSlug: "first-principles-redesign",
    wordCount: 0,
    tocCount: 0,
  },
  {
    slug: "migration",
    title: "Migration",
    category: "advanced",
    categoryLabel: "Advanced",
    description:
      "Migrate from Tailwind / Bootstrap / hand-rolled CSS, plus the enterprise readiness review.",
    status: "ready",
    refSlug: "enterprise-review",
    wordCount: 0,
    tocCount: 0,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    category: "advanced",
    categoryLabel: "Advanced",
    description:
      "Common pitfalls, specificity conflicts, layer-order bugs, and how to debug RoyCSS in production.",
    status: "coming-soon",
  },
];

/* ─── Convenience: grouping for renderers ─────────────────────── */

export interface DocsGroup {
  id: DocsCategoryId;
  meta: DocsCategoryMeta;
  entries: DocsEntry[];
}

/** Return the docs grouped by category in canonical display order. */
export function getDocsGroups(): DocsGroup[] {
  return categoryOrder.map((id) => ({
    id,
    meta: categoryMeta[id],
    entries: getDocsByCategory(id),
  }));
}

/** Total entry count across all categories. */
export const totalDocsCount: number = docsIndex.length;

/** Total "ready" doc count (entries with backing markdown). */
export const readyDocsCount: number = docsIndex.filter(
  (d) => d.status === "ready",
).length;
