export interface DocPage {
  slug: string;
  title: string;
  category: string;
  description: string;
}

export interface DocCategory {
  id: string;
  label: string;
  icon: string;
  pages: DocPage[];
}

export const DOCS_CATEGORIES: DocCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "Rocket",
    pages: [
      {
        slug: "/docs/getting-started",
        title: "Overview",
        category: "getting-started",
        description: "What is RoyCSS and how to get started",
      },
      {
        slug: "/docs/getting-started/installation",
        title: "Installation",
        category: "getting-started",
        description: "Install via npm, pnpm, yarn, bun, CDN",
      },
      {
        slug: "/docs/getting-started/importing",
        title: "Importing",
        category: "getting-started",
        description: "Global, tree-shaking, per-category imports",
      },
      {
        slug: "/docs/getting-started/first-effect",
        title: "Your First Effect",
        category: "getting-started",
        description: "Step-by-step tutorial",
      },
      {
        slug: "/docs/getting-started/frameworks",
        title: "Framework Guides",
        category: "getting-started",
        description: "React, Vue, Svelte, Angular, Astro",
      },
      {
        slug: "/docs/getting-started/vscode-snippets",
        title: "VS Code Snippets",
        category: "getting-started",
        description: "IDE integration",
      },
      {
        slug: "/docs/getting-started/mcp-server",
        title: "MCP Server",
        category: "getting-started",
        description: "AI assistant integration",
      },
      {
        slug: "/docs/getting-started/cli",
        title: "CLI",
        category: "getting-started",
        description: "Command-line interface",
      },
    ],
  },
  {
    id: "concepts",
    label: "Concepts",
    icon: "Lightbulb",
    pages: [
      {
        slug: "/docs/concepts/css-first",
        title: "CSS-First Architecture",
        category: "concepts",
        description: "Zero JS runtime philosophy",
      },
      {
        slug: "/docs/concepts/oklch-colors",
        title: "OKLCH Colors",
        category: "concepts",
        description: "Perceptual color system",
      },
      {
        slug: "/docs/concepts/custom-properties",
        title: "Custom Properties",
        category: "concepts",
        description: "CSS variable system",
      },
      {
        slug: "/docs/concepts/class-naming",
        title: "Class Naming",
        category: "concepts",
        description: "Naming conventions",
      },
      {
        slug: "/docs/concepts/performance",
        title: "Performance",
        category: "concepts",
        description: "GPU acceleration, no layout thrash",
      },
      {
        slug: "/docs/concepts/accessibility",
        title: "Accessibility",
        category: "concepts",
        description: "Reduced motion, ARIA, focus",
      },
      {
        slug: "/docs/concepts/browser-support",
        title: "Browser Support",
        category: "concepts",
        description: "Compatibility matrix",
      },
    ],
  },
  {
    id: "api",
    label: "API Reference",
    icon: "Code2",
    pages: [
      {
        slug: "/docs/api/effects",
        title: "Effects API",
        category: "api",
        description: "How effect classes work",
      },
      {
        slug: "/docs/api/effects/hover",
        title: "Hover Effects",
        category: "api",
        description: "Hover effect classes",
      },
      {
        slug: "/docs/api/effects/text",
        title: "Text Effects",
        category: "api",
        description: "Text effect classes",
      },
      {
        slug: "/docs/api/effects/backgrounds",
        title: "Backgrounds",
        category: "api",
        description: "Background effect classes",
      },
      {
        slug: "/docs/api/effects/loaders",
        title: "Loaders",
        category: "api",
        description: "Loading animations",
      },
      {
        slug: "/docs/api/effects/buttons",
        title: "Buttons",
        category: "api",
        description: "Button effect classes",
      },
      {
        slug: "/docs/api/effects/cards",
        title: "Cards",
        category: "api",
        description: "Card effect classes",
      },
      {
        slug: "/docs/api/effects/borders",
        title: "Borders",
        category: "api",
        description: "Border effect classes",
      },
      {
        slug: "/docs/api/roymotion",
        title: "RoyMotion",
        category: "api",
        description: "Animation subsystem",
      },
      {
        slug: "/docs/api/customization",
        title: "Customization",
        category: "api",
        description: "Theming and overrides",
      },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    icon: "BookOpen",
    pages: [
      {
        slug: "/docs/guides",
        title: "Guides Overview",
        category: "guides",
        description: "Browse all RoyCSS guides",
      },
      {
        slug: "/docs/guides/creating-custom-effects",
        title: "Custom Effects",
        category: "guides",
        description: "Build your own effects",
      },
      {
        slug: "/docs/guides/theming",
        title: "Theming",
        category: "guides",
        description: "Complete theming guide",
      },
      {
        slug: "/docs/guides/migration",
        title: "Migration",
        category: "guides",
        description: "Migrate from other libraries",
      },
      {
        slug: "/docs/guides/tree-shaking",
        title: "Tree Shaking",
        category: "guides",
        description: "Bundle optimization",
      },
      {
        slug: "/docs/guides/performance-optimization",
        title: "Performance",
        category: "guides",
        description: "Advanced optimization",
      },
      {
        slug: "/docs/guides/ai-workflow",
        title: "AI Workflow",
        category: "guides",
        description: "Using RoyCSS with AI",
      },
      {
        slug: "/docs/guides/contributing",
        title: "Contributing",
        category: "guides",
        description: "How to contribute",
      },
      {
        slug: "/docs/guides/changelog",
        title: "Changelog",
        category: "guides",
        description: "Version history",
      },
    ],
  },
];

export function getAllDocPages(): DocPage[] {
  return DOCS_CATEGORIES.flatMap((c) => c.pages);
}

export function getDocPage(slug: string): DocPage | undefined {
  return getAllDocPages().find((p) => p.slug === slug);
}

export function getPrevNextPages(
  slug: string,
): { prev?: DocPage; next?: DocPage } {
  const all = getAllDocPages();
  const idx = all.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}

/**
 * Docs versioning (issue #127 / PF-014 acceptance #3).
 *
 * `/docs` always serves the CURRENT version. `/docs/<version>` routes to
 * a per-version snapshot surface: the current version redirects back to
 * the canonical `/docs`, archived versions render an honest snapshot
 * notice with the full catalog linked to the live docs. Slugs are
 * lowercase `v<major>` (optionally `v<major>.<minor>`, e.g. v2.2).
 */
export const DOCS_CURRENT_VERSION = "v2";

export interface DocsVersionInfo {
  /** Version slug, e.g. "v1", "v2", "v2.2". */
  version: string;
  /** Whether this slug resolves to the current docs. */
  current: boolean;
  /** Release line label, e.g. "RoyCSS 2.x". */
  label: string;
  /** Human status shown on the snapshot page. */
  status: "current" | "archived";
  /** What changed, shown on the snapshot page. */
  note: string;
}

/** Known version lines, newest first. Derived versions keep working. */
export const DOCS_VERSIONS: DocsVersionInfo[] = [
  {
    version: "v2",
    current: true,
    label: "RoyCSS 2.x — current",
    status: "current",
    note: "1,973 effects, OKLCH tokens, container queries, scroll-driven animations, RoyAI.",
  },
  {
    version: "v1",
    current: false,
    label: "RoyCSS 1.x — archived",
    status: "archived",
    note: "The original pre-2.0 effect catalog (20-category taxonomy). Superseded by the v2 catalog expansion and token system.",
  },
];

/**
 * Resolve any `/docs/<version>` slug to its snapshot metadata. Unknown
 * versions still resolve (as archived) so old links never 404 — they
 * render the snapshot notice pointing at the live docs.
 */
export function resolveDocsVersion(
  version: string,
): DocsVersionInfo | undefined {
  const slug = version.toLowerCase().replace(/^v?/, "v");
  const known = DOCS_VERSIONS.find((v) => v.version === slug);
  if (known) return known;
  // Per-minor snapshots (e.g. v2.2) inherit their major line's status.
  if (/^v\d+(\.\d+)*$/.test(slug)) {
    const major = DOCS_VERSIONS.find((v) => slug.startsWith(v.version + "."));
    if (major?.current) {
      return {
        version: slug,
        current: true,
        label: `RoyCSS ${slug.slice(1)} — current line`,
        status: "current",
        note: "Part of the current documentation.",
      };
    }
    return {
      version: slug,
      current: false,
      label: `RoyCSS ${slug.slice(1)} — archived`,
      status: "archived",
      note: "Archived documentation snapshot.",
    };
  }
  return undefined;
}

/** Last full docs review pass (drives the per-page "last updated" stamp). */
export const DOCS_LAST_REVIEWED = "2026-09-22";

/** GitHub source root for "Edit this page" links (PF-014 acceptance #4). */
export const DOCS_REPO_EDIT_BASE =
  "https://github.com/Roy-Wanyoike/Roycss/edit/main";

/**
 * Map a live docs pathname (e.g. "/docs/getting-started/installation")
 * to its source file in this repository, or null when the path is not a
 * known docs page. Doc pages are hand-written route segments under
 * `src/app/docs/<segments>/page.tsx`.
 */
export function getDocSourcePath(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, "");
  // The docs landing page is editable too (not part of the sitemap).
  if (clean === "/docs") return "src/app/docs/page.tsx";
  const page = getDocPage(clean);
  if (!page) return null;
  const segments = clean.replace(/^\/docs\/?/, "");
  return `src/app/docs/${segments}/page.tsx`;
}
