#!/usr/bin/env bun
/**
 * RoyCSS MCP Server
 * ═══════════════════════════════════════════════════════════════
 *
 * Model Context Protocol server for RoyCSS.
 * Gives AI assistants (Claude, ChatGPT, Cursor, Windsurf, Codex)
 * access to official RoyCSS effects, documentation, and framework
 * examples — so every AI produces accurate RoyCSS code.
 *
 * Usage:
 *   bun index.ts                    # Start the MCP server (stdio)
 *   npx @roycss/mcp-server          # After publishing to npm
 *
 * Configure in Claude Desktop / Cursor / Windsurf:
 *   See README.md for setup instructions.
 *
 * Tools exposed:
 *   1. search_effects       — Search effects by keyword, category, or tags
 *   2. get_effect           — Get full CSS code for a specific effect by ID
 *   3. list_categories      — List all categories with effect counts
 *   4. get_install          — Get installation instructions for any package manager
 *   5. get_framework_usage  — Get framework-specific code examples (React, Vue, Angular, Svelte, Next.js, vanilla)
 *   6. get_design_tokens    — Get OKLCH design tokens and color system info
 *   7. get_recipes          — Get curated effect combinations for common UI patterns
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
// Load effect data
// ═══════════════════════════════════════════════════════════════

// Try multiple paths for effects.json (development vs published)
function loadEffects() {
  const paths = [
    join(__dirname, "effects.json"),           // Same directory (bundled)
    join(__dirname, "..", "dist", "effects.json"), // Project dist
    join(__dirname, "..", "..", "dist", "effects.json"), // Root dist
  ];

  for (const p of paths) {
    try {
      const data = readFileSync(p, "utf-8");
      return JSON.parse(data);
    } catch {
      // Try next path
    }
  }

  console.error("[RoyCSS MCP] Could not load effects.json. Checked:", paths);
  return [];
}

const EFFECTS = loadEffects();

// Build category index
const CATEGORIES: Record<string, { count: number; label: string }> = {};
const CATEGORY_LABELS: Record<string, string> = {
  animations: "Animations",
  hover: "Hover Effects",
  text: "Text Effects",
  backgrounds: "Backgrounds",
  loaders: "Loaders",
  "3d-transforms": "3D & Transforms",
  buttons: "Button Effects",
  cards: "Card Effects",
  borders: "Borders",
  filters: "Filters",
  forms: "Forms & Inputs",
  navigation: "Navigation",
  scroll: "Scroll Effects",
  cursor: "Cursor Effects",
  "page-transitions": "Page Transitions",
  "glass-ui": "Glass & Modern UI",
  particles: "Particles",
  microinteractions: "Microinteractions",
  visual: "Visual Effects",
  misc: "Miscellaneous",
};

for (const effect of EFFECTS) {
  if (!CATEGORIES[effect.category]) {
    CATEGORIES[effect.category] = { count: 0, label: CATEGORY_LABELS[effect.category] || effect.category };
  }
  CATEGORIES[effect.category].count++;
}

// ═══════════════════════════════════════════════════════════════
// Curated recipes — combinations of effects for common UI patterns
// ═══════════════════════════════════════════════════════════════

const RECIPES: Record<string, { title: string; description: string; effects: string[]; html: string }> = {
  "hero-animated-gradient": {
    title: "Animated Gradient Hero",
    description: "A modern hero section with animated gradient text, glassmorphism card, and glow button",
    effects: ["text-gradient", "card-glassmorphism", "pulse-glow"],
    html: `<section class="hero">
  <h1 class="roycss-text-gradient">Build Beautiful UIs</h1>
  <div class="roycss-card-glassmorphism" style="max-width: 400px; margin: 2rem auto;">
    <h3>Get Started</h3>
    <button class="roycss-pulse-glow">npm install roycss</button>
  </div>
</section>`,
  },
  "hero-aurora-text": {
    title: "Aurora Text Hero",
    description: "Hero with flowing aurora gradient text and a shine sweep button",
    effects: ["text-aurora-gradient-b18", "btn-shine-sweep"],
    html: `<section class="hero">
  <h1 class="roycss-text-aurora-gradient-b18">Ship Delightful Interfaces</h1>
  <button class="roycss-btn-shine-sweep">Browse Effects</button>
</section>`,
  },
  "loading-triple-spinner": {
    title: "Triple Spinner Loading",
    description: "Three different loading indicators displayed together for a loading screen",
    effects: ["loader-spinner", "loader-dots", "loader-bars"],
    html: `<div style="display: flex; gap: 2rem; align-items: center; justify-content: center;">
  <div class="roycss-loader-spinner"></div>
  <div class="roycss-loader-dots"><span></span><span></span><span></span></div>
  <div class="roycss-loader-bars"><span></span><span></span><span></span><span></span><span></span></div>
</div>`,
  },
  "loading-ring-pulse": {
    title: "Ring + Pulse Loader",
    description: "A spinning ring combined with a pulsing circle — modern loading indicator",
    effects: ["loader-ring-spin", "anim-pulse-ring-expand-b18"],
    html: `<div style="display: flex; gap: 3rem; align-items: center; justify-content: center;">
  <div class="roycss-loader-ring-spin"></div>
  <div class="roycss-anim-pulse-ring-expand-b18"></div>
</div>`,
  },
  "card-feature-grid": {
    title: "Feature Card Grid",
    description: "A grid of feature cards with hover lift, glow, and glassmorphism",
    effects: ["hover-lift-glow-b18", "card-glassmorphism", "glass-badge-pill-b18"],
    html: `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
  <div class="roycss-hover-lift-glow-b18">
    <div class="roycss-card-glassmorphism" style="padding: 1.5rem;">
      <span class="roycss-glass-badge-pill-b18">New</span>
      <h3>Fast</h3>
      <p>Zero JavaScript runtime.</p>
    </div>
  </div>
</div>`,
  },
  "card-glass-hover": {
    title: "Glass Hover Card",
    description: "A glassmorphism card that lifts and glows on hover — premium product card",
    effects: ["card-glass-hover", "vis-frosted-glass-v2-b18"],
    html: `<div class="roycss-card-glass-hover" style="padding: 1.5rem;">
  <div class="roycss-vis-frosted-glass-v2-b18" style="inline-size: 48px; block-size: 48px; border-radius: 0.75rem;"></div>
  <h3>Premium Plan</h3>
  <button>Choose Plan</button>
</div>`,
  },
  "nav-glass-bar": {
    title: "Glass Navigation Bar",
    description: "A floating glassmorphism navigation bar with badge pills and a glass button",
    effects: ["glass-nav-bar-b18", "glass-badge-pill-b18", "btn-glass-press-b18"],
    html: `<nav class="roycss-glass-nav-bar-b18">
  <span class="roycss-glass-badge-pill-b18">RoyCSS</span>
  <button class="roycss-btn-glass-press-b18">Get Started</button>
</nav>`,
  },
  "form-login-glass": {
    title: "Glass Login Form",
    description: "A glassmorphism login form with frosted inputs and a gradient glow button",
    effects: ["card-glassmorphism", "glass-input-field-b18", "btn-gradient-glow-b18"],
    html: `<form class="roycss-card-glassmorphism" style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem;">
  <h3>Sign In</h3>
  <input class="roycss-glass-input-field-b18" type="email" placeholder="Email" />
  <input class="roycss-glass-input-field-b18" type="password" placeholder="Password" />
  <button class="roycss-btn-gradient-glow-b18" type="submit">Sign In</button>
</form>`,
  },
  "notification-pulse-badge": {
    title: "Pulsing Notification Badge",
    description: "A pulsing notification indicator with expanding rings — draws attention",
    effects: ["anim-pulse-ring-expand-b18", "micro-bell-shake-b18"],
    html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
  <span class="roycss-anim-pulse-ring-expand-b18"></span>
  <span class="roycss-micro-bell-shake-b18">🔔</span>
</div>`,
  },
  "notification-toast-glass": {
    title: "Glass Toast Notification",
    description: "A glassmorphism toast notification with a badge and message",
    effects: ["card-glassmorphism", "glass-badge-pill-b18", "micro-fade-up"],
    html: `<div class="roycss-card-glassmorphism roycss-micro-fade-up" style="padding: 1rem 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
  <span class="roycss-glass-badge-pill-b18">Success</span>
  <p>Your changes have been saved.</p>
</div>`,
  },
  "empty-state-glow": {
    title: "Glowing Empty State",
    description: "An empty state with a breathing orb and subtle text — zen-like placeholder",
    effects: ["anim-breathing-orb-b18"],
    html: `<div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
  <div class="roycss-anim-breathing-orb-b18"></div>
  <h3>Nothing here yet</h3>
  <button>Create Item</button>
</div>`,
  },
  "buttons-cta-group": {
    title: "CTA Button Group",
    description: "A group of CTA buttons with different styles — gradient glow, 3D push, and glass",
    effects: ["btn-gradient-glow-b18", "btn-3d-push-b18", "btn-glass-press-b18"],
    html: `<div style="display: flex; gap: 1rem; align-items: center;">
  <button class="roycss-btn-gradient-glow-b18">Primary</button>
  <button class="roycss-btn-3d-push-b18">Action</button>
  <button class="roycss-btn-glass-press-b18">Secondary</button>
</div>`,
  },
};

// ═══════════════════════════════════════════════════════════════
// Design tokens
// ═══════════════════════════════════════════════════════════════

const DESIGN_TOKENS = {
  colors: {
    primary: "oklch(0.696 0.149 162.48)",
    description: "RoyCSS uses OKLCH color space throughout. The primary color is emerald (hue 162.48°). All effects use color-mix() for transparency — no hex or rgba.",
  },
  install: {
    npm: "npm install roycss",
    pnpm: "pnpm add roycss",
    yarn: "yarn add roycss",
    bun: "bun add roycss",
    deno: "deno add npm:roycss",
    cdn: '<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />',
  },
  import: {
    js: 'import "roycss/dist/roycss.min.css";',
    css: '@import "roycss/dist/roycss.min.css";',
    html: '<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />',
  },
  principles: [
    "Zero JavaScript runtime — every effect is 100% CSS",
    "OKLCH color space with color-mix() — no hex or rgba",
    "CSS logical properties (inline-size, block-size) for RTL/I18n",
    "All classes prefixed with .roycss-, all keyframes prefixed with roy-",
    "Every effect respects prefers-reduced-motion",
    "WCAG 2.1 AA compliant",
  ],
};

// ═══════════════════════════════════════════════════════════════
// Framework usage examples
// ═══════════════════════════════════════════════════════════════

function getFrameworkExample(framework: string, effectId: string): string {
  const effect = EFFECTS.find((e) => e.id === effectId);
  const name = effect?.name || "Effect";
  const cls = `roycss-${effectId}`;

  const examples: Record<string, string> = {
    vanilla: `<!-- HTML -->
<button class="${cls}">Click me</button>

<!-- Import the CSS -->
<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />`,

    react: `// React
import "roycss/dist/roycss.min.css";

export function Demo() {
  return (
    <button className="${cls}" type="button">
      ${name}
    </button>
  );
}`,

    vue: `<!-- Vue 3 -->
<!-- src/main.ts -->
import "roycss/dist/roycss.min.css";

<!-- Component -->
<template>
  <button class="${cls}" type="button">${name}</button>
</template>`,

    angular: `// Angular — add to angular.json styles array:
// "node_modules/roycss/dist/roycss.min.css"

// app.component.ts
@Component({
  template: \`<button class="${cls}" type="button">${name}</button>\`,
})
export class AppComponent {}`,

    svelte: `<!-- Svelte -->
<!-- src/main.ts -->
import "roycss/dist/roycss.min.css";

<button class="${cls}">${name}</button>`,

    nextjs: `// Next.js (App Router) — src/app/layout.tsx
import "roycss/dist/roycss.min.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// Then use anywhere:
// <button className="${cls}">${name}</button>`,
  };

  return examples[framework] || examples.vanilla;
}

// ═══════════════════════════════════════════════════════════════
// MCP Server setup
// ═══════════════════════════════════════════════════════════════

const server = new Server(
  {
    name: "roycss-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ═══════════════════════════════════════════════════════════════
// Tool definitions
// ═══════════════════════════════════════════════════════════════

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_effects",
      description:
        "Search RoyCSS effects by keyword, category, or tags. Returns matching effects with their IDs, names, descriptions, categories, and tags. Use this when a user asks for a type of effect (e.g., 'glassmorphism', 'loader', 'neon text', 'hover animation').",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query — matches against effect name, description, tags, and category. Examples: 'glass', 'loader', 'neon', 'hover glow', 'pulse animation'",
          },
          category: {
            type: "string",
            description: "Optional: filter by category. One of: animations, hover, text, backgrounds, loaders, 3d-transforms, buttons, cards, borders, filters, forms, navigation, scroll, cursor, page-transitions, glass-ui, particles, microinteractions, visual, misc",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 20, max: 50)",
            default: 20,
          },
        },
      },
    },
    {
      name: "get_effect",
      description:
        "Get the full CSS code for a specific RoyCSS effect by its ID. Returns the complete CSS (class definition + keyframes) ready to copy-paste. Use this after search_effects when you know the effect ID, or when a user asks for a specific effect by name.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The RoyCSS effect ID (e.g., 'btn-shine', 'text-gradient', 'loader-spinner', 'card-glass'). Use search_effects to find the right ID.",
          },
        },
        required: ["id"],
      },
    },
    {
      name: "list_categories",
      description:
        "List all RoyCSS effect categories with their labels and effect counts. Use this when a user wants to browse effects by category or understand what types of effects are available.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_install",
      description:
        "Get RoyCSS installation instructions for a specific package manager or CDN. Returns the install command, import statement, and a basic usage example. Use this when a user asks how to install or set up RoyCSS.",
      inputSchema: {
        type: "object",
        properties: {
          manager: {
            type: "string",
            description: "Package manager or method: 'npm', 'pnpm', 'yarn', 'bun', 'deno', or 'cdn'",
            default: "npm",
          },
        },
      },
    },
    {
      name: "get_framework_usage",
      description:
        "Get framework-specific code examples for using a RoyCSS effect in React, Vue, Angular, Svelte, Next.js, or vanilla HTML. Returns the install command, import statement, and usage code. Use this when a user asks how to use RoyCSS in a specific framework.",
      inputSchema: {
        type: "object",
        properties: {
          framework: {
            type: "string",
            description: "Framework: 'react', 'vue', 'angular', 'svelte', 'nextjs', or 'vanilla'",
          },
          effect_id: {
            type: "string",
            description: "The RoyCSS effect ID to show usage for (e.g., 'btn-shine', 'card-glass'). If omitted, uses a generic example.",
          },
        },
        required: ["framework"],
      },
    },
    {
      name: "get_design_tokens",
      description:
        "Get RoyCSS design tokens, color system info, and framework principles. Returns OKLCH color values, install commands for all package managers, import statements, and the core principles (zero JS, OKLCH, logical properties, etc.). Use this when a user asks about the design system, color system, or architecture.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_recipes",
      description:
        "Get curated RoyCSS recipes — combinations of effects for common UI patterns like hero sections, loading states, feature cards, navigation bars, and notification badges. Each recipe includes the HTML structure and the effect IDs used. Use this when a user asks to build a specific UI pattern.",
      inputSchema: {
        type: "object",
        properties: {
          recipe: {
            type: "string",
            description: "Optional: specific recipe ID. If omitted, lists all available recipes. Options: 'hero-section', 'loading-state', 'feature-cards', 'notification-badge', 'glass-navigation'",
          },
        },
      },
    },
  ],
}));

// ═══════════════════════════════════════════════════════════════
// Tool handlers
// ═══════════════════════════════════════════════════════════════

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ─── search_effects ───
      case "search_effects": {
        const query = (args?.query || "").toLowerCase().trim();
        const category = args?.category;
        const limit = Math.min(args?.limit || 20, 50);

        let results = EFFECTS;

        // Filter by category
        if (category) {
          results = results.filter((e) => e.category === category);
        }

        // Filter by search query
        if (query) {
          results = results.filter((e) => {
            const inName = e.name.toLowerCase().includes(query);
            const inDesc = e.description.toLowerCase().includes(query);
            const inTags = e.tags.some((t: string) => t.toLowerCase().includes(query));
            const inCategory = e.category.toLowerCase().includes(query);
            const inId = e.id.toLowerCase().includes(query);
            return inName || inDesc || inTags || inCategory || inId;
          });
        }

        const sliced = results.slice(0, limit);
        const formatted = sliced.map((e) => ({
          id: e.id,
          name: e.name,
          category: CATEGORIES[e.category]?.label || e.category,
          description: e.description,
          tags: e.tags,
          previewType: e.previewType,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query: query || "(none)",
                  category: category || "(all)",
                  totalFound: results.length,
                  showing: sliced.length,
                  effects: formatted,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ─── get_effect ───
      case "get_effect": {
        const id = args?.id;
        if (!id) {
          return {
            content: [{ type: "text", text: "Error: 'id' parameter is required." }],
            isError: true,
          };
        }

        const effect = EFFECTS.find((e) => e.id === id);
        if (!effect) {
          // Try fuzzy match
          const fuzzy = EFFECTS.filter((e) => e.id.includes(id) || id.includes(e.id));
          if (fuzzy.length > 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `Effect "${id}" not found. Did you mean one of these?\n${fuzzy.map((e) => `  - ${e.id} (${e.name})`).join("\n")}`,
                },
              ],
            };
          }
          return {
            content: [{ type: "text", text: `Effect "${id}" not found. Use search_effects to find the right ID.` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: effect.id,
                  name: effect.name,
                  category: CATEGORIES[effect.category]?.label || effect.category,
                  description: effect.description,
                  tags: effect.tags,
                  previewType: effect.previewType,
                  previewText: effect.previewText || "RoyCSS",
                  childCount: effect.childCount || 0,
                  cssCode: effect.cssCode,
                  usage: `<element class="roycss-${effect.id}">Content</element>`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ─── list_categories ───
      case "list_categories": {
        const cats = Object.entries(CATEGORIES)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([id, meta]) => ({
            id,
            label: meta.label,
            count: meta.count,
          }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalCategories: cats.length,
                  totalEffects: EFFECTS.length,
                  categories: cats,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ─── get_install ───
      case "get_install": {
        const manager = (args?.manager || "npm").toLowerCase();
        const commands: Record<string, { install: string; description: string }> = {
          npm: { install: "npm install roycss", description: "Install via npm" },
          pnpm: { install: "pnpm add roycss", description: "Install via pnpm" },
          yarn: { install: "yarn add roycss", description: "Install via Yarn" },
          bun: { install: "bun add roycss", description: "Install via Bun" },
          deno: { install: "deno add npm:roycss", description: "Install via Deno" },
          cdn: {
            install: '<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />',
            description: "Use via CDN (no install required)",
          },
        };

        const cmd = commands[manager] || commands.npm;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  manager,
                  install: cmd.install,
                  description: cmd.description,
                  import: manager === "cdn"
                    ? '<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css" />'
                    : 'import "roycss/dist/roycss.min.css";',
                  usage: '<button class="roycss-btn-shine">Click me</button>',
                  allManagers: Object.entries(commands).map(([k, v]) => ({ manager: k, command: v.install })),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ─── get_framework_usage ───
      case "get_framework_usage": {
        const framework = (args?.framework || "vanilla").toLowerCase();
        const effectId = args?.effect_id || "btn-shine";
        const example = getFrameworkExample(framework, effectId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  framework,
                  effectId,
                  install: DESIGN_TOKENS.install[framework === "nextjs" ? "npm" : framework === "vanilla" ? "cdn" : "npm"],
                  example,
                  note: "Import the CSS once at your app root, then use any .roycss-* class anywhere in your app.",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ─── get_design_tokens ───
      case "get_design_tokens": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(DESIGN_TOKENS, null, 2),
            },
          ],
        };
      }

      // ─── get_recipes ───
      case "get_recipes": {
        const recipeId = args?.recipe;

        if (recipeId && RECIPES[recipeId]) {
          const recipe = RECIPES[recipeId];
          const effectDetails = recipe.effects.map((id) => {
            const e = EFFECTS.find((eff) => eff.id === id);
            return e ? { id: e.id, name: e.name, cssCode: e.cssCode } : null;
          }).filter(Boolean);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    recipe: recipeId,
                    title: recipe.title,
                    description: recipe.description,
                    html: recipe.html,
                    effects: effectDetails,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // List all recipes
        const recipes = Object.entries(RECIPES).map(([id, r]) => ({
          id,
          title: r.title,
          description: r.description,
          effects: r.effects,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalRecipes: recipes.length,
                  recipes,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ═══════════════════════════════════════════════════════════════
// Start the server
// ═══════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[RoyCSS MCP] Server running with ${EFFECTS.length} effects across ${Object.keys(CATEGORIES).length} categories`);
}

main().catch((error) => {
  console.error("[RoyCSS MCP] Fatal error:", error);
  process.exit(1);
});
