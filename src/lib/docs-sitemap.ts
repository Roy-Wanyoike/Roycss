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
