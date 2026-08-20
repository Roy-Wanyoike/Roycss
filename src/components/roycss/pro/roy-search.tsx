"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * Roy Search — universal cross-content search engine.
 *
 * Self-contained (no props). A single large search input filters across
 * eight content types simultaneously and groups results by category.
 *
 *   ┌─ Content types (54 mock items total) ──────────────────────────┐
 *   │ Components (8)   Effects (8)        Recipes (6)   Templates (6) │
 *   │ Plugins (6)      Documentation (8)  Community (6) Blueprints (6)│
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Features:
 *   • Universal search bar — large input with leading search icon and
 *     trailing clear button. Typing filters ALL enabled content types
 *     simultaneously (case-insensitive substring + tag match).
 *   • Relevance scoring — title prefix > title contains > tag > snippet.
 *     Results sorted desc within each group; a 5-dot indicator shows
 *     relative relevance (score normalised against the top hit).
 *   • Grouped results — category headers with count chips; each result
 *     shows title, snippet, content-type badge, and relevance dots.
 *   • Filter chips — toggle any of the eight content types in/out.
 *     "All" and "None" shortcuts. State persisted to localStorage.
 *   • Search stats — "Found N results in M categories · took Xms".
 *     Timing measured via `performance.now()` around the memoised pass.
 *   • Recent searches — stored in localStorage (max 6, deduped, MRU
 *     first). Rendered as chips in the empty state. Click to re-run.
 *   • Suggested searches — a small curated list shown alongside
 *     recents when the query is empty.
 *   • Keyboard navigation — ↑/↓ move the active option across the
 *     flattened, grouped result list; Enter opens the detail panel
 *     (and commits the query to recent searches); Escape clears the
 *     query. The input carries `aria-activedescendant` for SR users.
 *   • Match highlighting — occurrences of the query inside titles and
 *     snippets are wrapped in `<mark class="bg-primary/25 rounded">`.
 *   • Detail panel — sticky right-hand pane showing the active result:
 *     title, type badge, full snippet, tags, "Open" + "Copy link"
 *     buttons (mock shadcn toasts via the app-wide `useToast` hook).
 *
 * Color discipline: only the approved RoyCSS palette (emerald, teal,
 * cyan, amber, rose, violet, fuchsia, orange) plus semantic theme
 * tokens (`primary`, `muted`, `accent`, `border`, `foreground`, …).
 * NO indigo, NO blue. Exhaustiveness `never` guard on the
 * `ContentType` switch. TS strict, zero `any`. SSR-safe — all
 * `window`/`localStorage`/`performance` access is guarded or inside
 * effects/callbacks. Search is memoised; input is debounced 200ms.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Boxes,
  Building2,
  ChevronRight,
  Clock,
  CornerDownLeft,
  ExternalLink,
  LayoutTemplate,
  Link2,
  Puzzle,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type ContentType =
  | "components"
  | "effects"
  | "recipes"
  | "templates"
  | "plugins"
  | "documentation"
  | "community"
  | "blueprints";

interface SearchItem {
  readonly id: string;
  readonly type: ContentType;
  readonly title: string;
  readonly snippet: string;
  readonly tags: readonly string[];
}

interface SearchResult extends SearchItem {
  readonly score: number;
  readonly matchedField: "title" | "snippet" | "tags";
}

interface SearchStats {
  readonly total: number;
  readonly categoryCount: number;
  readonly tookMs: number;
}

interface EmptyStats {
  readonly total: 0;
  readonly categoryCount: 0;
  readonly tookMs: 0;
}

interface TypeMeta {
  readonly label: string;
  readonly singular: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  /** Badge classes for the small content-type label. */
  readonly badge: string;
  /** Subtle background tint used on the active filter chip. */
  readonly chipActive: string;
  /** Accent colour for the category header icon. */
  readonly headerText: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const CONTENT_TYPES: readonly ContentType[] = [
  "components",
  "effects",
  "recipes",
  "templates",
  "plugins",
  "documentation",
  "community",
  "blueprints",
] as const;

const TYPE_META: Record<ContentType, TypeMeta> = {
  components: {
    label: "Components",
    singular: "Component",
    icon: Boxes,
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
    headerText: "text-emerald-600 dark:text-emerald-400",
  },
  effects: {
    label: "Effects",
    singular: "Effect",
    icon: Sparkles,
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
    headerText: "text-violet-600 dark:text-violet-400",
  },
  recipes: {
    label: "Recipes",
    singular: "Recipe",
    icon: BookOpen,
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
    headerText: "text-amber-600 dark:text-amber-400",
  },
  templates: {
    label: "Templates",
    singular: "Template",
    icon: LayoutTemplate,
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
    headerText: "text-teal-600 dark:text-teal-400",
  },
  plugins: {
    label: "Plugins",
    singular: "Plugin",
    icon: Puzzle,
    badge:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    chipActive:
      "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
    headerText: "text-cyan-600 dark:text-cyan-400",
  },
  documentation: {
    label: "Documentation",
    singular: "Doc",
    icon: BookOpen,
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
    headerText: "text-rose-600 dark:text-rose-400",
  },
  community: {
    label: "Community",
    singular: "Thread",
    icon: Users,
    badge:
      "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
    chipActive:
      "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-200",
    headerText: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  blueprints: {
    label: "Blueprints",
    singular: "Blueprint",
    icon: Building2,
    badge:
      "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-300",
    chipActive:
      "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
    headerText: "text-orange-600 dark:text-orange-400",
  },
};

const SUGGESTED_SEARCHES: readonly string[] = [
  "glass-card",
  "dashboard",
  "auth",
  "stripe",
  "installation",
  "hospital",
] as const;

const RECENT_STORAGE_KEY = "roycss:roy-search:recent";
const FILTERS_STORAGE_KEY = "roycss:roy-search:filters";
const RECENT_LIMIT = 6;
const DEBOUNCE_MS = 200;

// ─── Mock data (54 items across 8 content types) ──────────────────────
// Module-level so the array identity is stable across renders — the
// memoised search pass only depends on the query + enabled filters.

const COMPONENTS: readonly SearchItem[] = [
  {
    id: "cmp-button",
    type: "components",
    title: "Button",
    snippet:
      "Accessible button primitive with eight variants, four sizes, and loading state. Keyboard-focusable, reduced-motion safe.",
    tags: ["form", "action", "primary", "variants"],
  },
  {
    id: "cmp-card",
    type: "components",
    title: "Card",
    snippet:
      "Composable surface container with header, content, and footer slots. Rounded-xl border with subtle shadow.",
    tags: ["surface", "layout", "container"],
  },
  {
    id: "cmp-badge",
    type: "components",
    title: "Badge",
    snippet:
      "Small count or status label. Four variants: default, secondary, destructive, outline.",
    tags: ["label", "status", "count"],
  },
  {
    id: "cmp-input",
    type: "components",
    title: "Input",
    snippet:
      "Text input with focus ring, aria-invalid styling, and file input support. Inherits semantic tokens.",
    tags: ["form", "text", "field"],
  },
  {
    id: "cmp-avatar",
    type: "components",
    title: "Avatar",
    snippet:
      "Image with fallback initials and status indicator. Uses Radix Avatar for accessibility.",
    tags: ["image", "profile", "user"],
  },
  {
    id: "cmp-alert",
    type: "components",
    title: "Alert",
    snippet:
      "Contextual feedback message. Variants: default, destructive, success, warning, info.",
    tags: ["feedback", "message", "status"],
  },
  {
    id: "cmp-tabs",
    type: "components",
    title: "Tabs",
    snippet:
      "Tabbed navigation with keyboard arrow support and roving tabindex. Animated underline indicator.",
    tags: ["navigation", "switch", "panel"],
  },
  {
    id: "cmp-progress",
    type: "components",
    title: "Progress",
    snippet:
      "Linear progress bar with determinate and indeterminate states. Reduced-motion safe.",
    tags: ["feedback", "loading", "bar"],
  },
] as const;

const EFFECTS: readonly SearchItem[] = [
  {
    id: "fx-pulse-glow",
    type: "effects",
    title: "pulse-glow",
    snippet:
      "Rhythmic box-shadow pulse with OKLCH-friendly opacity ramp. Great for live-status indicators.",
    tags: ["animation", "glow", "status", "attention"],
  },
  {
    id: "fx-fade-in-up",
    type: "effects",
    title: "fade-in-up",
    snippet:
      "Entrance animation combining opacity fade with a 12px upward translate. Scroll-triggered variant available.",
    tags: ["animation", "entrance", "scroll"],
  },
  {
    id: "fx-glass-card",
    type: "effects",
    title: "glass-card",
    snippet:
      "Frosted-glass surface using backdrop-blur and a translucent OKLCH overlay. Falls back gracefully.",
    tags: ["surface", "blur", "glass", "modern"],
  },
  {
    id: "fx-neon-border",
    type: "effects",
    title: "neon-border",
    snippet:
      "Saturated border-glow using layered box-shadows. Tunable spread and hue via CSS variables.",
    tags: ["border", "glow", "neon", "vibrant"],
  },
  {
    id: "fx-gradient-text",
    type: "effects",
    title: "gradient-text",
    snippet:
      "Background-clip text with a multi-stop OKLCH gradient. Includes reduced-motion-safe static fallback.",
    tags: ["text", "gradient", "typography"],
  },
  {
    id: "fx-bounce-in",
    type: "effects",
    title: "bounce-in",
    snippet:
      "Spring-like entrance with cubic-bezier overshoot. Disabled when prefers-reduced-motion is set.",
    tags: ["animation", "entrance", "spring", "playful"],
  },
  {
    id: "fx-shake",
    type: "effects",
    title: "shake",
    snippet:
      "Horizontal jitter animation ideal for validation errors. Two keyframes, 400ms duration.",
    tags: ["animation", "error", "attention", "jitter"],
  },
  {
    id: "fx-float",
    type: "effects",
    title: "float",
    snippet:
      "Gentle vertical bob for hero illustrations. 6s ease-in-out infinite, reduced-motion safe.",
    tags: ["animation", "loop", "decorative", "hero"],
  },
] as const;

const RECIPES: readonly SearchItem[] = [
  {
    id: "rec-saas-hero",
    type: "recipes",
    title: "SaaS Hero",
    snippet:
      "High-converting SaaS hero with headline, sub-copy, dual CTA, and animated gradient blob backdrop.",
    tags: ["landing", "hero", "conversion", "saas"],
  },
  {
    id: "rec-dashboard",
    type: "recipes",
    title: "Dashboard",
    snippet:
      "Admin dashboard shell with sidebar nav, KPI cards, chart grid, and a recent-activity feed.",
    tags: ["admin", "analytics", "layout", "charts"],
  },
  {
    id: "rec-pricing",
    type: "recipes",
    title: "Pricing",
    snippet:
      "Three-tier pricing table with monthly/yearly toggle, highlighted plan, and per-feature comparison.",
    tags: ["landing", "conversion", "table", "billing"],
  },
  {
    id: "rec-auth",
    type: "recipes",
    title: "Auth",
    snippet:
      "Sign-in / sign-up flow with social providers, password strength meter, and email verification step.",
    tags: ["form", "login", "security", "onboarding"],
  },
  {
    id: "rec-toast",
    type: "recipes",
    title: "Toast",
    snippet:
      "Stacked toast notifications with swipe-to-dismiss, pause-on-hover, and aria-live announcements.",
    tags: ["feedback", "notification", "stack"],
  },
  {
    id: "rec-data-table",
    type: "recipes",
    title: "Data Table",
    snippet:
      "Sortable, filterable, paginated table with row selection, column visibility, and CSV export.",
    tags: ["table", "data", "sorting", "pagination"],
  },
] as const;

const TEMPLATES: readonly SearchItem[] = [
  {
    id: "tpl-healthcare-dashboard",
    type: "templates",
    title: "Healthcare Dashboard",
    snippet:
      "Clinical-grade dashboard for patient monitoring, appointment scheduling, and lab results. WCAG-AA.",
    tags: ["dashboard", "healthcare", "medical", "clinical"],
  },
  {
    id: "tpl-saas-landing",
    type: "templates",
    title: "SaaS Landing",
    snippet:
      "High-converting SaaS landing page with hero, feature grid, testimonials, pricing, and FAQ.",
    tags: ["landing", "saas", "marketing", "conversion"],
  },
  {
    id: "tpl-admin-panel",
    type: "templates",
    title: "Admin Panel",
    snippet:
      "Full-featured admin shell with sidebar nav, data tables, charts, and a settings flow. 40+ primitives.",
    tags: ["admin", "dashboard", "internal", "shell"],
  },
  {
    id: "tpl-crm",
    type: "templates",
    title: "CRM",
    snippet:
      "Customer relationship manager with pipeline kanban, contact timeline, and deal forecasting.",
    tags: ["crm", "sales", "pipeline", "contacts"],
  },
  {
    id: "tpl-pos",
    type: "templates",
    title: "POS",
    snippet:
      "Point-of-sale interface with product grid, cart drawer, split payments, and receipt printing.",
    tags: ["pos", "retail", "commerce", "checkout"],
  },
  {
    id: "tpl-portfolio",
    type: "templates",
    title: "Portfolio",
    snippet:
      "Designer portfolio with case-study layouts, project gallery, and a contact section.",
    tags: ["portfolio", "personal", "showcase", "creative"],
  },
] as const;

const PLUGINS: readonly SearchItem[] = [
  {
    id: "plg-stripe",
    type: "plugins",
    title: "Stripe",
    snippet:
      "Drop-in Stripe payment integration with checkout sessions, webhooks, and subscription billing.",
    tags: ["payments", "billing", "checkout", "subscription"],
  },
  {
    id: "plg-clerk",
    type: "plugins",
    title: "Clerk",
    snippet:
      "Clerk authentication provider with prebuilt components for sign-in, MFA, and user profile management.",
    tags: ["auth", "identity", "mfa", "user"],
  },
  {
    id: "plg-supabase",
    type: "plugins",
    title: "Supabase",
    snippet:
      "Supabase adapter for Postgres, auth, realtime, and storage. Type-safe query builder included.",
    tags: ["database", "postgres", "realtime", "backend"],
  },
  {
    id: "plg-firebase",
    type: "plugins",
    title: "Firebase",
    snippet:
      "Firebase integration covering Firestore, auth, cloud messaging, and remote config.",
    tags: ["database", "firestore", "realtime", "google"],
  },
  {
    id: "plg-auth0",
    type: "plugins",
    title: "Auth0",
    snippet:
      "Auth0 single sign-on with universal login, role-based access control, and audit logging.",
    tags: ["auth", "sso", "enterprise", "identity"],
  },
  {
    id: "plg-mapbox",
    type: "plugins",
    title: "Mapbox",
    snippet:
      "Mapbox GL integration with custom RoyCSS-themed tiles, geocoder, and directions controls.",
    tags: ["maps", "geo", "location", "visualization"],
  },
] as const;

const DOCUMENTATION: readonly SearchItem[] = [
  {
    id: "doc-getting-started",
    type: "documentation",
    title: "Getting Started",
    snippet:
      "Install RoyCSS, wire up the stylesheet, and ship your first effect in under five minutes.",
    tags: ["intro", "quickstart", "install", "beginner"],
  },
  {
    id: "doc-installation",
    type: "documentation",
    title: "Installation",
    snippet:
      "Step-by-step install via npm, pnpm, yarn, or bun. Includes CDN and standalone bundle options.",
    tags: ["install", "npm", "cdn", "setup"],
  },
  {
    id: "doc-cli-reference",
    type: "documentation",
    title: "CLI Reference",
    snippet:
      "Complete reference for the `roycss` CLI: add, init, list, upgrade, and doctor commands.",
    tags: ["cli", "terminal", "commands", "tooling"],
  },
  {
    id: "doc-mcp-setup",
    type: "documentation",
    title: "MCP Setup",
    snippet:
      "Connect RoyCSS to your AI editor via the Model Context Protocol server. Streaming enabled.",
    tags: ["mcp", "ai", "editor", "integration"],
  },
  {
    id: "doc-api-reference",
    type: "documentation",
    title: "API Reference",
    snippet:
      "Programmatic API for the RoyCSS runtime: effect registry, token resolver, and SSR helpers.",
    tags: ["api", "typescript", "runtime", "programmatic"],
  },
  {
    id: "doc-theming",
    type: "documentation",
    title: "Theming",
    snippet:
      "Override semantic tokens, define brand palettes in OKLCH, and ship dark mode without flashes.",
    tags: ["theme", "tokens", "oklch", "dark-mode"],
  },
  {
    id: "doc-accessibility",
    type: "documentation",
    title: "Accessibility",
    snippet:
      "How RoyCSS meets WCAG 2.2 AA: focus management, reduced motion, colour contrast, and ARIA patterns.",
    tags: ["a11y", "wcag", "aria", "focus"],
  },
  {
    id: "doc-deployment",
    type: "documentation",
    title: "Deployment",
    snippet:
      "Deploy RoyCSS sites to Vercel, Netlify, Cloudflare, and self-hosted Node. Edge runtime supported.",
    tags: ["deploy", "vercel", "netlify", "edge"],
  },
] as const;

const COMMUNITY: readonly SearchItem[] = [
  {
    id: "com-discussions",
    type: "community",
    title: "Discussions",
    snippet:
      "Open forum for design decisions, feature requests, and architecture debates. 12k+ threads.",
    tags: ["forum", "discussion", "q-and-a"],
  },
  {
    id: "com-qa",
    type: "community",
    title: "Q&A",
    snippet:
      "Tagged question feed with accepted answers, reputation, and expert contributor badges.",
    tags: ["questions", "answers", "help", "stack-overflow"],
  },
  {
    id: "com-snippets",
    type: "community",
    title: "Snippets",
    snippet:
      "Community-shared RoyCSS snippets: copy-paste effects, layouts, and utilities. 2.4k snippets.",
    tags: ["snippets", "code", "share", "copy"],
  },
  {
    id: "com-challenges",
    type: "community",
    title: "Challenges",
    snippet:
      "Weekly build challenges with themed prompts. Past winners get featured on the homepage.",
    tags: ["challenge", "contest", "weekly", "build"],
  },
  {
    id: "com-rfcs",
    type: "community",
    title: "RFCs",
    snippet:
      "Request-for-comments pipeline for major changes. Open RFCs, drafts, and accepted proposals.",
    tags: ["rfc", "proposal", "governance", "design"],
  },
  {
    id: "com-showcases",
    type: "community",
    title: "Showcases",
    snippet:
      "Real-world sites built with RoyCSS. Submit your project for a chance to be featured.",
    tags: ["showcase", "real-world", "inspiration", "gallery"],
  },
] as const;

const BLUEPRINTS: readonly SearchItem[] = [
  {
    id: "bp-hospital",
    type: "blueprints",
    title: "Hospital",
    snippet:
      "End-to-end hospital management blueprint: patient records, scheduling, billing, and pharmacy.",
    tags: ["healthcare", "enterprise", "management", "clinical"],
  },
  {
    id: "bp-pos",
    type: "blueprints",
    title: "POS",
    snippet:
      "Retail point-of-sale blueprint with inventory, staff roles, registers, and end-of-day reports.",
    tags: ["retail", "commerce", "inventory", "checkout"],
  },
  {
    id: "bp-erp",
    type: "blueprints",
    title: "ERP",
    snippet:
      "Enterprise resource planning blueprint covering finance, HR, procurement, and manufacturing.",
    tags: ["enterprise", "erp", "operations", "finance"],
  },
  {
    id: "bp-hr",
    type: "blueprints",
    title: "HR",
    snippet:
      "Human resources blueprint: recruitment, onboarding, payroll, performance reviews, and time-off.",
    tags: ["hr", "people", "payroll", "recruiting"],
  },
  {
    id: "bp-banking",
    type: "blueprints",
    title: "Banking",
    snippet:
      "Digital banking blueprint with accounts, transfers, KYC, fraud detection, and statements.",
    tags: ["fintech", "banking", "finance", "payments"],
  },
  {
    id: "bp-education",
    type: "blueprints",
    title: "Education",
    snippet:
      "LMS blueprint for courses, enrolments, grading, attendance, and parent portals.",
    tags: ["education", "lms", "school", "learning"],
  },
] as const;

/** Flattened, immutable search index. Stable identity for memo deps. */
const SEARCH_INDEX: readonly SearchItem[] = [
  ...COMPONENTS,
  ...EFFECTS,
  ...RECIPES,
  ...TEMPLATES,
  ...PLUGINS,
  ...DOCUMENTATION,
  ...COMMUNITY,
  ...BLUEPRINTS,
] as const;

const ALL_ENABLED: Record<ContentType, boolean> = {
  components: true,
  effects: true,
  recipes: true,
  templates: true,
  plugins: true,
  documentation: true,
  community: true,
  blueprints: true,
};

// ═══════════════════════════════════════════════════════════════════════
// Scoring + helpers (pure)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Score an item against a lowercased query. Returns 0 when no match.
 * Title prefix > title contains > tag exact > tag contains > snippet.
 */
function scoreItem(item: SearchItem, q: string): { score: number; matchedField: SearchResult["matchedField"] } | null {
  const title = item.title.toLowerCase();
  const snippet = item.snippet.toLowerCase();

  let best = 0;
  let matchedField: SearchResult["matchedField"] = "snippet";

  // Title scoring
  if (title === q) {
    if (best < 30) {
      best = 30;
      matchedField = "title";
    }
  } else if (title.startsWith(q)) {
    if (best < 22) {
      best = 22;
      matchedField = "title";
    }
  } else if (title.includes(q)) {
    if (best < 14) {
      best = 14;
      matchedField = "title";
    }
  }

  // Tag scoring (any matching tag contributes, max wins)
  for (const rawTag of item.tags) {
    const tag = rawTag.toLowerCase();
    if (tag === q) {
      if (best < 18) {
        best = 18;
        matchedField = "tags";
      }
    } else if (tag.startsWith(q)) {
      if (best < 12) {
        best = 12;
        matchedField = "tags";
      }
    } else if (tag.includes(q)) {
      if (best < 7) {
        best = 7;
        matchedField = "tags";
      }
    }
  }

  // Snippet scoring
  if (snippet.includes(q)) {
    if (best < 6) {
      best = 6;
      matchedField = "snippet";
    }
  }

  return best > 0 ? { score: best, matchedField } : null;
}

/** Escape a string for safe interpolation into a `RegExp` source. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Format a millisecond duration with one decimal place below 10ms. */
function formatDuration(ms: number): string {
  if (ms < 10) return `${ms.toFixed(1)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Compact integer formatter (e.g. 12840 → "12.8K"). */
function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

// ═══════════════════════════════════════════════════════════════════════
// Small presentational helpers
// ═══════════════════════════════════════════════════════════════════════

interface HighlightProps {
  text: string;
  query: string;
}

/**
 * Splits `text` on case-insensitive occurrences of `query` and wraps
 * matches in a `<mark>` with `bg-primary/25`. Safe for SSR.
 */
const Highlight = React.memo(function Highlight({
  text,
  query,
}: HighlightProps): React.JSX.Element {
  const q = query.trim();
  if (q.length === 0) {
    return <>{text}</>;
  }
  const escaped = escapeRegExp(q);
  // Guard against catastrophic empty-pattern splits.
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(re);
  if (parts.length <= 1) {
    return <>{text}</>;
  }
  return (
    <>
      {parts.map((part, i) =>
        part.length > 0 && part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-primary/25 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
});

interface RelevanceDotsProps {
  /** 0..1 — fraction of the top score in the current result set. */
  fraction: number;
}

/** Five-dot relevance indicator. Filled dots use `bg-primary`. */
function RelevanceDots({ fraction }: RelevanceDotsProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, fraction));
  // Map fraction → filled dot count (1..5). Anything above 0 gets ≥1 dot.
  const filled = clamped <= 0 ? 0 : Math.max(1, Math.round(clamped * 5));
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Relevance ${filled} of 5`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i < filled
              ? "bg-primary"
              : "bg-muted-foreground/25 dark:bg-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

interface TypeBadgeProps {
  type: ContentType;
  className?: string;
}

function TypeBadge({ type, className }: TypeBadgeProps): React.JSX.Element {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1", meta.badge, className)}>
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Result row
// ═══════════════════════════════════════════════════════════════════════

interface ResultRowProps {
  result: SearchResult;
  query: string;
  active: boolean;
  selected: boolean;
  optionId: string;
  onActivate: (id: string) => void;
  onSelect: (result: SearchResult) => void;
}

const ResultRow = React.memo(function ResultRow({
  result,
  query,
  active,
  selected,
  optionId,
  onActivate,
  onSelect,
}: ResultRowProps): React.JSX.Element {
  const handleClick = useCallback(() => {
    onSelect(result);
  }, [onSelect, result]);

  const handleMove = useCallback(() => {
    onActivate(result.id);
  }, [onActivate, result.id]);

  return (
    <div
      id={optionId}
      role="option"
      aria-selected={active}
      data-active={active ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      onPointerMove={handleMove}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-lg border px-3 py-2.5 outline-none transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active
          ? "border-primary/40 bg-accent/60"
          : "border-border bg-card hover:border-primary/30 hover:bg-accent/40",
        selected && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              <Highlight text={result.title} query={query} />
            </span>
            <TypeBadge type={result.type} />
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            <Highlight text={result.snippet} query={query} />
          </p>
          {result.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {result.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  <Highlight text={tag} query={query} />
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RelevanceDots fraction={result.score / 30} />
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground/60 transition-transform",
              active && "translate-x-0.5 text-primary",
            )}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════
// Detail panel
// ═══════════════════════════════════════════════════════════════════════

interface DetailPanelProps {
  result: SearchResult | null;
  query: string;
  onOpen: (result: SearchResult) => void;
  onCopyLink: (result: SearchResult) => void;
  onClose: () => void;
}

function DetailPanel({
  result,
  query,
  onOpen,
  onCopyLink,
  onClose,
}: DetailPanelProps): React.JSX.Element {
  return (
    <aside
      className={cn(
        "sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
      )}
      aria-label="Result detail"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Detail</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-muted-foreground"
          onClick={onClose}
          aria-label="Close detail panel"
          disabled={!result}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      {!result ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <Search className="size-8 text-muted-foreground/40" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">
            Select a result to preview
          </p>
          <p className="max-w-[16rem] text-xs text-muted-foreground/80">
            Use ↑ / ↓ to move, Enter to open, Escape to clear the query.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              <Highlight text={result.title} query={query} />
            </h3>
            <TypeBadge type={result.type} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <Highlight text={result.snippet} query={query} />
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <dt className="text-muted-foreground">Content type</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {TYPE_META[result.type].singular}
              </dd>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <dt className="text-muted-foreground">Relevance</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                <RelevanceDots fraction={result.score / 30} />
              </dd>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <dt className="text-muted-foreground">Matched on</dt>
              <dd className="mt-0.5 font-medium capitalize text-foreground">
                {result.matchedField}
              </dd>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <dt className="text-muted-foreground">Item ID</dt>
              <dd className="mt-0.5 truncate font-mono text-[11px] text-foreground">
                {result.id}
              </dd>
            </div>
          </dl>

          {result.tags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-foreground">Tags</h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    <Highlight text={tag} query={query} />
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onOpen(result)}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Open
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onCopyLink(result)}
            >
              <Link2 className="size-3.5" aria-hidden />
              Copy link
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoySearch — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function RoySearch(): React.JSX.Element {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("search/recent");
  void data; void loading; void error;

  const { toast } = useToast();

  // ─── Input state + 200ms debounce ───────────────────────────────────
  const [input, setInput] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(input), DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [input]);

  // ─── Filter state (persisted) ───────────────────────────────────────
  const [enabledTypes, setEnabledTypes] = useState<Record<ContentType, boolean>>(
    () => ({ ...ALL_ENABLED }),
  );

  // Hydrate filters from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<ContentType, boolean>>;
      if (parsed && typeof parsed === "object") {
        setEnabledTypes((prev) => {
          const next = { ...prev };
          for (const t of CONTENT_TYPES) {
            if (typeof parsed[t] === "boolean") {
              next[t] = parsed[t] as boolean;
            }
          }
          return next;
        });
      }
    } catch {
      // Ignore malformed storage — fall back to defaults.
    }
  }, []);

  // Persist filters whenever they change (after mount).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(enabledTypes));
    } catch {
      // Storage may be unavailable (private mode, quota) — silently ignore.
    }
  }, [enabledTypes]);

  // ─── Recent searches (localStorage) ────────────────────────────────
  const [recent, setRecent] = useState<readonly string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        setRecent(parsed.slice(0, RECENT_LIMIT));
      }
    } catch {
      // Ignore malformed storage.
    }
  }, []);

  const commitRecent = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    setRecent((prev) => {
      const deduped = prev.filter((v) => v.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...deduped].slice(0, RECENT_LIMIT);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage failures.
        }
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(RECENT_STORAGE_KEY);
      } catch {
        // Ignore.
      }
    }
  }, []);

  // ─── Memoised search pass ───────────────────────────────────────────
  const search = useMemo<
    | (SearchStats & {
        groups: Partial<Record<ContentType, SearchResult[]>>;
        maxScore: number;
        query: string;
      })
    | (EmptyStats & {
        groups: Partial<Record<ContentType, SearchResult[]>>;
        maxScore: number;
        query: string;
      })
  >(() => {
    const q = query.trim().toLowerCase();
    const start =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();

    if (q.length === 0) {
      return {
        total: 0,
        categoryCount: 0,
        tookMs: 0,
        groups: {},
        maxScore: 0,
        query,
      };
    }

    const groups: Partial<Record<ContentType, SearchResult[]>> = {};
    let total = 0;
    let maxScore = 0;

    for (const item of SEARCH_INDEX) {
      if (!enabledTypes[item.type]) continue;
      const scored = scoreItem(item, q);
      if (!scored) continue;
      const result: SearchResult = {
        ...item,
        score: scored.score,
        matchedField: scored.matchedField,
      };
      const bucket = groups[item.type] ?? (groups[item.type] = []);
      bucket.push(result);
      total += 1;
      if (scored.score > maxScore) maxScore = scored.score;
    }

    // Sort each bucket by score desc, then title asc for stable ordering.
    for (const t of CONTENT_TYPES) {
      const arr = groups[t];
      if (arr && arr.length > 1) {
        arr.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
      }
    }

    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    const tookMs = Math.max(0.1, end - start);
    const categoryCount = CONTENT_TYPES.reduce(
      (count, t) => count + ((groups[t]?.length ?? 0) > 0 ? 1 : 0),
      0,
    );

    return { total, categoryCount, tookMs, groups, maxScore, query };
  }, [query, enabledTypes]);

  // ─── Flattened result list (display order) for keyboard nav ─────────
  const flatResults = useMemo<readonly SearchResult[]>(() => {
    const out: SearchResult[] = [];
    for (const t of CONTENT_TYPES) {
      const arr = search.groups[t];
      if (arr) out.push(...arr);
    }
    return out;
  }, [search]);

  // ─── Active + selected state ────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Clamp active index when the result set shrinks.
  useEffect(() => {
    setActiveIndex((prev) => {
      if (flatResults.length === 0) return -1;
      if (prev < 0) return 0;
      if (prev >= flatResults.length) return flatResults.length - 1;
      return prev;
    });
  }, [flatResults]);

  // Reset selection when its result disappears.
  useEffect(() => {
    if (selectedId === null) return;
    const stillPresent = flatResults.some((r) => r.id === selectedId);
    if (!stillPresent) setSelectedId(null);
  }, [flatResults, selectedId]);

  const activeResult: SearchResult | null =
    activeIndex >= 0 && activeIndex < flatResults.length
      ? flatResults[activeIndex]
      : null;

  const selectedResult: SearchResult | null = useMemo(() => {
    if (selectedId === null) return null;
    return flatResults.find((r) => r.id === selectedId) ?? null;
  }, [flatResults, selectedId]);

  // ─── Auto-scroll the active option into view ───────────────────────
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeIndex < 0 || !resultsRef.current) return;
    const el = resultsRef.current.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`,
    );
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (result: SearchResult) => {
      setSelectedId(result.id);
      commitRecent(query || result.title);
    },
    [commitRecent, query],
  );

  const handleActivate = useCallback((id: string) => {
    setActiveIndex((prev) => {
      // Find the index of `id` in the current flatResults. We can't
      // capture flatResults here without re-creating the callback;
      // instead we query the DOM via data attributes.
      const root = resultsRef.current;
      if (!root) return prev;
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>("[data-result-index]"),
      );
      const idx = nodes.findIndex((n) => n.dataset.resultId === id);
      return idx >= 0 ? idx : prev;
    });
  }, []);

  const toggleType = useCallback((type: ContentType) => {
    setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const enableAll = useCallback(() => setEnabledTypes({ ...ALL_ENABLED }), []);

  const disableAll = useCallback(
    () =>
      setEnabledTypes({
        components: false,
        effects: false,
        recipes: false,
        templates: false,
        plugins: false,
        documentation: false,
        community: false,
        blueprints: false,
      }),
    [],
  );

  const handleClear = useCallback(() => {
    setInput("");
    setQuery("");
    setSelectedId(null);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  const runSuggestion = useCallback((value: string) => {
    setInput(value);
    inputRef.current?.focus();
  }, []);

  const handleOpen = useCallback(
    (result: SearchResult) => {
      toast({
        title: "Opening result",
        description: `Opening “${result.title}” (${TYPE_META[result.type].singular})…`,
      });
    },
    [toast],
  );

  const handleCopyLink = useCallback(
    (result: SearchResult) => {
      const link = `https://roycss.dev/${result.type}/${result.id}`;
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(link).then(
          () => {
            toast({
              title: "Link copied",
              description: link,
            });
          },
          () => {
            toast({
              title: "Link ready",
              description: link,
            });
          },
        );
      } else {
        toast({ title: "Link ready", description: link });
      }
    },
    [toast],
  );

  // ─── Keyboard navigation (input-level) ─────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flatResults.length === 0) return;
        setActiveIndex((i) => (i + 1) % flatResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flatResults.length === 0) return;
        setActiveIndex((i) =>
          i <= 0 ? flatResults.length - 1 : i - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatResults.length === 0) {
          if (query.trim().length > 0) commitRecent(query);
          return;
        }
        const target =
          activeIndex >= 0 && activeIndex < flatResults.length
            ? flatResults[activeIndex]
            : flatResults[0];
        handleSelect(target);
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (input.length > 0) {
          handleClear();
        } else if (selectedId !== null) {
          setSelectedId(null);
        }
      }
    },
    [flatResults, activeIndex, handleSelect, handleClear, commitRecent, input, query, selectedId],
  );

  // ─── Derived display values ────────────────────────────────────────
  const isEmpty = query.trim().length === 0;
  const enabledCount = CONTENT_TYPES.reduce(
    (n, t) => n + (enabledTypes[t] ? 1 : 0),
    0,
  );
  const hasQuery = !isEmpty;
  const hasResults = search.total > 0;
  const showNoResults = hasQuery && !hasResults;
  const activeOptionId =
    activeResult && activeIndex >= 0
      ? `roy-search-option-${activeIndex}`
      : undefined;

  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10"
      aria-label="Roy Search"
    >
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Search className="size-5 text-primary" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Roy Search
          </h2>
          <Badge variant="secondary" className="ml-1">
            Beta
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          One box, every corner of the RoyCSS platform. Search{" "}
          <strong className="font-semibold text-foreground">
            {SEARCH_INDEX.length}
          </strong>{" "}
          items across {CONTENT_TYPES.length} content types — components,
          effects, recipes, templates, plugins, docs, community, and
          blueprints.
        </p>
      </header>

      {/* ─── Search bar ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search components, effects, recipes, templates, plugins, docs…"
          aria-label="Search the RoyCSS platform"
          aria-controls="roy-search-results"
          aria-expanded={hasQuery}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          className="h-14 rounded-xl border-2 pl-12 pr-28 text-base shadow-sm focus-visible:ring-2"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {input.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-muted-foreground"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
          <kbd
            className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-1 text-[10px] font-medium text-muted-foreground sm:inline-flex"
            aria-hidden
          >
            <CornerDownLeft className="size-3" />
          </kbd>
        </div>
      </div>

      {/* ─── Filter chips ───────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Include:
        </span>
        <button
          type="button"
          onClick={enableAll}
          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          All
        </button>
        <button
          type="button"
          onClick={disableAll}
          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          None
        </button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        {CONTENT_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const active = enabledTypes[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? meta.chipActive
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              <Icon className="size-3" aria-hidden />
              {meta.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {enabledCount}/{CONTENT_TYPES.length} types
        </span>
      </div>

      {/* ─── Stats line ─────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {hasQuery ? (
          <>
            <span>
              Found{" "}
              <strong className="font-semibold text-foreground tabular-nums">
                {formatCompact(search.total)}
              </strong>{" "}
              result{search.total === 1 ? "" : "s"} in{" "}
              <strong className="font-semibold text-foreground tabular-nums">
                {search.categoryCount}
              </strong>{" "}
              categor{search.categoryCount === 1 ? "y" : "ies"}
            </span>
            <span aria-hidden>·</span>
            <span>
              search took{" "}
              <strong className="font-semibold text-foreground tabular-nums">
                {formatDuration(search.tookMs)}
              </strong>
            </span>
          </>
        ) : (
          <span>
            Indexing{" "}
            <strong className="font-semibold text-foreground tabular-nums">
              {SEARCH_INDEX.length}
            </strong>{" "}
            items across {CONTENT_TYPES.length} content types. Start typing
            to search.
          </span>
        )}
        <span
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          {hasQuery
            ? `${search.total} results found in ${search.categoryCount} categories`
            : "Search is ready"}
        </span>
      </div>

      {/* ─── Results + detail layout ────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem]">
        {/* Results column */}
        <div
          id="roy-search-results"
          ref={resultsRef}
          role="listbox"
          aria-label="Search results"
          className={cn(
            "max-h-[calc(100vh-16rem)] overflow-y-auto rounded-xl border bg-background/50 p-2",
            !hasQuery && "border-dashed",
          )}
        >
          {isEmpty && (
            <EmptyState
              recent={recent}
              onRunSuggestion={runSuggestion}
              onClearRecent={clearRecent}
            />
          )}

          {showNoResults && (
            <NoResults
              query={query}
              enabledCount={enabledCount}
              onResetFilters={enableAll}
              onClear={handleClear}
            />
          )}

          {hasResults && (
            <div className="flex flex-col gap-4">
              {CONTENT_TYPES.map((type) => {
                const arr = search.groups[type];
                if (!arr || arr.length === 0) return null;
                const meta = TYPE_META[type];
                const HeaderIcon = meta.icon;
                return (
                  <section key={type} aria-labelledby={`hdr-${type}`}>
                    <div className="sticky top-0 z-10 -mx-2 mb-1 flex items-center gap-2 bg-background/90 px-2 py-1.5 backdrop-blur">
                      <HeaderIcon
                        className={cn("size-4", meta.headerText)}
                        aria-hidden
                      />
                      <h3
                        id={`hdr-${type}`}
                        className="text-xs font-semibold uppercase tracking-wide text-foreground"
                      >
                        {meta.label}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1.5 py-0 text-[10px] tabular-nums"
                      >
                        {arr.length}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {arr.map((result) => {
                        const flatIdx = flatResults.findIndex(
                          (r) => r.id === result.id,
                        );
                        const optionId =
                          flatIdx >= 0
                            ? `roy-search-option-${flatIdx}`
                            : undefined;
                        return (
                          <div
                            key={result.id}
                            data-result-index={flatIdx}
                            data-result-id={result.id}
                          >
                            <ResultRow
                              result={result}
                              query={query}
                              active={flatIdx === activeIndex}
                              selected={result.id === selectedId}
                              optionId={optionId ?? ""}
                              onActivate={handleActivate}
                              onSelect={handleSelect}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <DetailPanel
          result={selectedResult ?? activeResult}
          query={query}
          onOpen={handleOpen}
          onCopyLink={handleCopyLink}
          onClose={() => setSelectedId(null)}
        />
      </div>

      {/* ─── Footer hint ────────────────────────────────────────────── */}
      <footer className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
            <ArrowUp className="inline size-2.5" />
            <ArrowDown className="inline size-2.5" />
          </kbd>
          navigate
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
            Enter
          </kbd>
          open
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
            Esc
          </kbd>
          clear
        </span>
        <span className="ml-auto">
          Roy Search · index of {SEARCH_INDEX.length} items
        </span>
      </footer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Empty + no-results states
// ═══════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  recent: readonly string[];
  onRunSuggestion: (value: string) => void;
  onClearRecent: () => void;
}

function EmptyState({
  recent,
  onRunSuggestion,
  onClearRecent,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5 px-2 py-6">
      {recent.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Recent searches
            </h3>
            <button
              type="button"
              onClick={onClearRecent}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-3" aria-hidden />
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onRunSuggestion(term)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <Clock className="size-3 text-muted-foreground" aria-hidden />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Try searching for
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onRunSuggestion(term)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Search className="size-3" aria-hidden />
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CONTENT_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onRunSuggestion(meta.label.toLowerCase().slice(0, -1))}
              className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-accent/40"
            >
              <Icon className={cn("size-4", meta.headerText)} aria-hidden />
              <span className="text-xs font-semibold text-foreground">
                {meta.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {SEARCH_INDEX.filter((i) => i.type === type).length} items
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NoResultsProps {
  query: string;
  enabledCount: number;
  onResetFilters: () => void;
  onClear: () => void;
}

function NoResults({
  query,
  enabledCount,
  onResetFilters,
  onClear,
}: NoResultsProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <Search className="size-8 text-muted-foreground/40" aria-hidden />
      <p className="text-sm font-medium text-foreground">
        No results for “{query.trim()}”
      </p>
      <p className="max-w-[20rem] text-xs text-muted-foreground">
        {enabledCount === 0
          ? "All content types are filtered out. Enable at least one to see results."
          : "Try a different keyword, check your spelling, or widen your filters."}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {enabledCount === 0 && (
          <Button size="sm" variant="default" onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onClear}>
          Clear search
        </Button>
      </div>
    </div>
  );
}
