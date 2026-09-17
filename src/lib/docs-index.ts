/**
 * RoyCSS Docs Search Index — GENERATED FILE. DO NOT EDIT BY HAND.
 *
 * Regenerate with:  bun run scripts/generate-docs-index.ts
 *
 * Source: the real /docs route pages (every page.tsx under src/app/docs —
 * their metadata exports: title/description). The /docs routes are the single
 * source of truth for documentation (issue #112): this slim index exists only
 * so the client-side search overlay can offer docs results WITHOUT shipping
 * page bodies or walking the filesystem at runtime.
 *
 * Entries: 35 content routes (1 redirect route skipped:
 *   /docs → /docs/getting-started
 * ).
 */

export interface DocsIndexEntry {
  /** Absolute route path, e.g. "/docs/concepts/oklch-colors". */
  route: string;
  /** Page title (metadata title minus the "— RoyCSS Docs" suffix). */
  title: string;
  /** Route section id, e.g. "concepts". */
  section: string;
  /** Human-readable section label, e.g. "Concepts". */
  sectionLabel: string;
  /** One-line description from the page metadata (search preview snippet). */
  description: string;
  /** Lowercase search keywords derived from the route, title, and synonyms. */
  keywords: string[];
}

export const DOCS_INDEX: DocsIndexEntry[] = [
  {
    route: "/docs/getting-started",
    title: "Overview",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "What is RoyCSS and how to get started — 1,959 production-ready CSS effects with zero JS runtime and OKLCH colors.",
    keywords: ["getting","started","overview"],
  },
  {
    route: "/docs/getting-started/cli",
    title: "CLI",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "The roycss command-line interface: scaffold projects, add and export effects, search the catalog, and check project health.",
    keywords: ["cli","command line","terminal","npx"],
  },
  {
    route: "/docs/getting-started/first-effect",
    title: "Your First Effect",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "Step-by-step tutorial: add a hover lift effect with an emerald glow, all in pure CSS with zero JS.",
    keywords: ["first","effect"],
  },
  {
    route: "/docs/getting-started/frameworks",
    title: "Framework Guides",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "Use RoyCSS with React, Vue, Svelte, Angular, and Astro. Plain CSS — no framework adapter required.",
    keywords: ["frameworks","framework","guides"],
  },
  {
    route: "/docs/getting-started/importing",
    title: "Importing",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "What the roycss package exports: the global stylesheet, the minified variant, data files, and how to ship only the effects you use.",
    keywords: ["importing"],
  },
  {
    route: "/docs/getting-started/installation",
    title: "Installation",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "Install RoyCSS via npm, pnpm, yarn, bun, or CDN. One global stylesheet, a minified variant, and data subpath exports.",
    keywords: ["installation"],
  },
  {
    route: "/docs/getting-started/mcp-server",
    title: "MCP Server",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "Connect AI assistants (Claude, Cursor, Copilot) to RoyCSS via the Model Context Protocol server in the RoyCSS monorepo.",
    keywords: ["mcp","server","ai","assistant","claude","cursor","copilot"],
  },
  {
    route: "/docs/getting-started/vscode-snippets",
    title: "VS Code Snippets",
    section: "getting-started",
    sectionLabel: "Getting Started",
    description: "Install the RoyCSS VS Code extension for class autocompletion, snippets, and live preview.",
    keywords: ["vscode","snippets","vs","code","editor","extension","autocomplete"],
  },
  {
    route: "/docs/concepts/accessibility",
    title: "Accessibility",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "RoyCSS accessibility: per-effect reduced-motion guards, focus-visible utilities, sr-only helpers, and how not to encode meaning in motion.",
    keywords: ["accessibility","a11y","wcag","reduced motion","screen reader"],
  },
  {
    route: "/docs/concepts/browser-support",
    title: "Browser Support",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "RoyCSS browser support matrix with automatic @supports fallbacks for older engines.",
    keywords: ["browser","support","fallbacks","supports","compatibility"],
  },
  {
    route: "/docs/concepts/class-naming",
    title: "Class Naming",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "RoyCSS class naming conventions: the roycss- prefix, kebab-case, category-led names, and variant suffixes.",
    keywords: ["class","naming"],
  },
  {
    route: "/docs/concepts/css-first",
    title: "CSS-First Architecture",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "Why RoyCSS is built with zero JavaScript runtime. The CSS-first philosophy, tradeoffs, and when to break the rule.",
    keywords: ["css","first","architecture"],
  },
  {
    route: "/docs/concepts/custom-properties",
    title: "Custom Properties",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "How RoyCSS actually uses CSS custom properties: registered --roy-* @property values that effects animate, and what that means for you.",
    keywords: ["custom","properties"],
  },
  {
    route: "/docs/concepts/oklch-colors",
    title: "OKLCH Colors",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "Why RoyCSS uses OKLCH, the perceptual color space. Predictable lightness ramps, accessible contrasts.",
    keywords: ["oklch","colors","color","perceptual","palette"],
  },
  {
    route: "/docs/concepts/performance",
    title: "Performance",
    section: "concepts",
    sectionLabel: "Concepts",
    description: "How RoyCSS stays fast: GPU-composited transforms, no layout thrash, registered properties that animate, and subset exports.",
    keywords: ["performance","gpu","fast","optimization"],
  },
  {
    route: "/docs/api",
    title: "API Reference",
    section: "api",
    sectionLabel: "API Reference",
    description: "The RoyCSS class system: the .roycss-* namespace, OKLCH colors, and zero-runtime conventions across 1,959 effects in 29 categories.",
    keywords: ["api","reference"],
  },
  {
    route: "/docs/api/customization",
    title: "Customization",
    section: "api",
    sectionLabel: "API Reference",
    description: "Customize RoyCSS honestly: copy an effect's CSS and edit it, override registered @property values, bridge to your design tokens, and disable motion.",
    keywords: ["customization"],
  },
  {
    route: "/docs/api/effects",
    title: "Effects API",
    section: "api",
    sectionLabel: "API Reference",
    description: "How RoyCSS effect classes work: the single stylesheet, class anatomy, self-contained classes, and the per-category API pages.",
    keywords: ["effects","api","classes","reference"],
  },
  {
    route: "/docs/api/roymotion",
    title: "RoyMotion",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyMotion: the 775-effect motion subset of the RoyCSS catalog — keyframed, hover, scroll-driven, and transition effects. All pure CSS.",
    keywords: ["roymotion"],
  },
  {
    route: "/docs/api/effects/backgrounds",
    title: "Background Effects",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS background effect classes: aurora, mesh gradient, starfield, gradient sweep, grid lines. Pure CSS.",
    keywords: ["backgrounds","background","effects"],
  },
  {
    route: "/docs/api/effects/borders",
    title: "Borders",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS border effect classes: marching ants, animated gradients, dashed draw, neon pulse, corner brackets.",
    keywords: ["borders"],
  },
  {
    route: "/docs/api/effects/buttons",
    title: "Buttons",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS button effect classes: glow, pulse, shine sweep, fill slide, 3D push, neon. Each one self-contained.",
    keywords: ["buttons"],
  },
  {
    route: "/docs/api/effects/cards",
    title: "Cards",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS card effect classes: gradient border, hover glow, spotlight, reveal, neumorphic, glassmorphism.",
    keywords: ["cards"],
  },
  {
    route: "/docs/api/effects/hover",
    title: "Hover Effects",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS hover effect classes: push-up, scale, glow border, tilt, underline. All pure CSS.",
    keywords: ["hover","effects"],
  },
  {
    route: "/docs/api/effects/loaders",
    title: "Loaders",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS loader classes: ring-spin, dots, bars, equalizer, orbit, pulse ring. Accessible by composition.",
    keywords: ["loaders"],
  },
  {
    route: "/docs/api/effects/text",
    title: "Text Effects",
    section: "api",
    sectionLabel: "API Reference",
    description: "RoyCSS text effect classes: shimmer, gradient, neon glow, typewriter, blur reveal. Pure CSS keyframes.",
    keywords: ["text","effects"],
  },
  {
    route: "/docs/guides",
    title: "Guides Overview",
    section: "guides",
    sectionLabel: "Guides",
    description: "Browse all RoyCSS guides — custom effects, theming, migration, tree-shaking, performance, AI workflow, contributing, changelog.",
    keywords: ["guides","overview"],
  },
  {
    route: "/docs/guides/ai-workflow",
    title: "AI Workflow",
    section: "guides",
    sectionLabel: "Guides",
    description: "Use RoyCSS with AI assistants: MCP server, prompts, class validation, and review workflow.",
    keywords: ["ai","workflow","prompts","mcp","llm"],
  },
  {
    route: "/docs/guides/changelog",
    title: "Changelog",
    section: "guides",
    sectionLabel: "Guides",
    description: "RoyCSS version history, from the repo's CHANGELOG.md. Semver, Keep-a-Changelog format.",
    keywords: ["changelog"],
  },
  {
    route: "/docs/guides/contributing",
    title: "Contributing",
    section: "guides",
    sectionLabel: "Guides",
    description: "How to contribute to RoyCSS: repo layout, effect conventions, PR checklist, and release process.",
    keywords: ["contributing"],
  },
  {
    route: "/docs/guides/creating-custom-effects",
    title: "Custom Effects",
    section: "guides",
    sectionLabel: "Guides",
    description: "Build your own RoyCSS-style effect: naming, reduced-motion guards, @property where needed, and keeping the CSS-first discipline.",
    keywords: ["creating","custom","effects"],
  },
  {
    route: "/docs/guides/migration",
    title: "Migration",
    section: "guides",
    sectionLabel: "Guides",
    description: "Migrate from other animation libraries (Animate.css, GSAP, Framer Motion) to RoyCSS with real class mappings.",
    keywords: ["migration","animate css","gsap","framer"],
  },
  {
    route: "/docs/guides/performance-optimization",
    title: "Performance Optimization",
    section: "guides",
    sectionLabel: "Guides",
    description: "Advanced optimization: critical-CSS layering, content-visibility, GPU layer budget, and the benchmark harness.",
    keywords: ["performance","optimization","critical css","layers","benchmark"],
  },
  {
    route: "/docs/guides/theming",
    title: "Theming",
    section: "guides",
    sectionLabel: "Guides",
    description: "A brand-color migration, done honestly: vendor the effects you use, convert your palette to OKLCH, and keep contrast in check.",
    keywords: ["theming","brand","dark mode","theme"],
  },
  {
    route: "/docs/guides/tree-shaking",
    title: "Tree Shaking",
    section: "guides",
    sectionLabel: "Guides",
    description: "CSS doesn't tree-shake — RoyCSS subsets explicitly instead: export hand-picked effects or categories with the CLI, and measure the result.",
    keywords: ["tree","shaking","bundle","subset","size"],
  },
];

/**
 * Search the docs index by title / description / keywords / route.
 *
 * Honest scope (issue #112): the retired DocsViewer sheet searched full
 * markdown bodies; this index covers title + description + keywords only.
 * Matching mirrors the search overlay's other groups (substring,
 * case-insensitive), ranked in canonical docs order.
 */
export function searchDocs(query: string, limit = 5): DocsIndexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DOCS_INDEX.filter((entry) => {
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.keywords.some((k) => k.includes(q)) ||
      entry.route.toLowerCase().includes(q)
    );
  }).slice(0, limit);
}
