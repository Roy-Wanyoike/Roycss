/**
 * Plugin Hub service — Roy Plugin Hub.
 *
 * Mock backend (no DB). Seeds 12 plugins (Stripe, Clerk, Supabase,
 * Firebase, Auth0, Mapbox, Chart.js, TipTap, Uploadthing, Resend,
 * PostHog, Sentry) plus a changelog per plugin and a category index.
 *
 * Reads are LRU-cached; create mutates state and invalidates the list.
 *
 * Future: persist via Prisma `Plugin` model and sync versions from npm.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  Plugin,
  PluginCategory,
  PluginChangelogEntry,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { PluginCreateInput } from "./schema.js";

const log = createLogger("plugin-hub");

const PLUGINS_KEY = "plugins:list";
const CATEGORIES_KEY = "plugins:categories";
const pluginKey = (id: string): string => `plugin:${id}`;
const changelogKey = (id: string): string => `plugin:${id}:changelog`;

function invalidate(id?: string): void {
  cache.delete(PLUGINS_KEY);
  cache.delete(CATEGORIES_KEY);
  if (id) {
    cache.delete(pluginKey(id));
    cache.delete(changelogKey(id));
  }
}

function plugin(
  id: string,
  name: string,
  slug: string,
  category: string,
  description: string,
  author: string,
  version: string,
  downloads: number,
  rating: number,
  verified: boolean,
  tags: string[],
): Plugin {
  return {
    id,
    name,
    slug,
    category,
    description,
    author,
    version,
    downloads,
    rating,
    verified,
    tags,
    license: "MIT",
    createdAt: "2024-09-01T00:00:00.000Z",
    updatedAt: "2025-02-01T00:00:00.000Z",
  };
}

// ─── Seed: 12 plugins ───────────────────────────────────────────────────
const SEED_PLUGINS: Plugin[] = [
  plugin("plugin-stripe", "Stripe", "roycss-plugin-stripe", "payments", "Drop-in Stripe checkout, billing, and subscription components.", "RoyCSS", "1.4.0", 48_120, 4.9, true, ["stripe", "payments", "billing"]),
  plugin("plugin-clerk", "Clerk", "roycss-plugin-clerk", "auth", "Clerk-powered authentication with prebuilt RoyCSS-styled components.", "RoyCSS", "2.1.0", 31_410, 4.8, true, ["clerk", "auth", "mfa"]),
  plugin("plugin-supabase", "Supabase", "roycss-plugin-supabase", "backend", "Supabase data, auth, and storage bindings for Roy Blocks.", "RoyCSS", "3.0.2", 52_900, 4.9, true, ["supabase", "postgres", "realtime"]),
  plugin("plugin-firebase", "Firebase", "roycss-plugin-firebase", "backend", "Firebase Auth, Firestore, and Storage bindings.", "RoyCSS", "2.4.1", 28_840, 4.6, true, ["firebase", "firestore", "auth"]),
  plugin("plugin-auth0", "Auth0", "roycss-plugin-auth0", "auth", "Enterprise SSO via Auth0 with RoyCSS-styled login flows.", "RoyCSS", "1.8.0", 19_220, 4.7, true, ["auth0", "sso", "enterprise"]),
  plugin("plugin-mapbox", "Mapbox", "roycss-plugin-mapbox", "maps", "Mapbox-powered maps, geocoding, and routing components.", "RoyCSS", "1.2.0", 14_080, 4.5, true, ["mapbox", "maps", "geo"]),
  plugin("plugin-chartjs", "Chart.js", "roycss-plugin-chartjs", "data", "Chart.js wrappers with RoyCSS-styled themes and tooltips.", "RoyCSS", "3.1.0", 41_620, 4.8, true, ["chartjs", "charts", "data"]),
  plugin("plugin-tiptap", "TipTap", "roycss-plugin-tiptap", "editor", "TipTap rich-text editor with RoyCSS toolbar and shortcuts.", "RoyCSS", "2.0.0", 22_510, 4.7, true, ["tiptap", "editor", "rich-text"]),
  plugin("plugin-uploadthing", "Uploadthing", "roycss-plugin-uploadthing", "files", "Uploadthing file upload with progress and previews.", "RoyCSS", "1.1.0", 9_240, 4.6, true, ["uploadthing", "files", "upload"]),
  plugin("plugin-resend", "Resend", "roycss-plugin-resend", "email", "Resend transactional email templates styled with RoyCSS.", "RoyCSS", "0.9.0", 7_180, 4.5, true, ["resend", "email", "transactional"]),
  plugin("plugin-posthog", "PostHog", "roycss-plugin-posthog", "analytics", "PostHog product analytics, feature flags, and session replay.", "RoyCSS", "1.5.2", 12_410, 4.7, true, ["posthog", "analytics", "flags"]),
  plugin("plugin-sentry", "Sentry", "roycss-plugin-sentry", "monitoring", "Sentry error monitoring and performance tracing for Roy Apps.", "RoyCSS", "1.3.0", 16_890, 4.8, true, ["sentry", "errors", "tracing"]),
];

// ─── Seed: categories ───────────────────────────────────────────────────
const SEED_CATEGORIES: PluginCategory[] = [
  { id: "cat-payments", name: "Payments", count: 1, icon: "credit-card" },
  { id: "cat-auth", name: "Authentication", count: 2, icon: "lock" },
  { id: "cat-backend", name: "Backend", count: 2, icon: "server" },
  { id: "cat-maps", name: "Maps", count: 1, icon: "map" },
  { id: "cat-data", name: "Data & Charts", count: 1, icon: "bar-chart" },
  { id: "cat-editor", name: "Editor", count: 1, icon: "edit" },
  { id: "cat-files", name: "Files", count: 1, icon: "upload" },
  { id: "cat-email", name: "Email", count: 1, icon: "mail" },
  { id: "cat-analytics", name: "Analytics", count: 1, icon: "line-chart" },
  { id: "cat-monitoring", name: "Monitoring", count: 1, icon: "activity" },
];

// ─── Seed: changelogs (one entry per plugin for brevity) ────────────────
function buildChangelog(pluginId: string, version: string): PluginChangelogEntry[] {
  return [
    {
      pluginId,
      version,
      publishedAt: "2025-02-01T00:00:00.000Z",
      type: "minor",
      notes: [
        "RoyCSS 2.x compatibility",
        "Improved TypeScript types",
        "Reduced bundle by 12%",
      ],
    },
    {
      pluginId,
      version: "1.0.0",
      publishedAt: "2024-09-01T00:00:00.000Z",
      type: "major",
      notes: ["Initial public release."],
    },
  ];
}

const SEED_CHANGELOGS: Record<string, PluginChangelogEntry[]> =
  Object.fromEntries(
    SEED_PLUGINS.map((p) => [
      p.id,
      buildChangelog(p.id, p.version).map((c) => ({
        ...c,
        notes: [...c.notes],
      })),
    ]),
  );

let plugins: Plugin[] = SEED_PLUGINS.map((p) => ({
  ...p,
  tags: [...p.tags],
}));

/** List all plugins. Cached. */
export async function listPlugins(): Promise<Plugin[]> {
  return cacheWrap(
    PLUGINS_KEY,
    () =>
      Promise.resolve(
        plugins.map((p) => ({ ...p, tags: [...p.tags] })),
      ),
    CACHE_TTL.pluginsList,
  );
}

/** Get a single plugin by id. Throws 404 if missing. */
export async function getPluginById(id: string): Promise<Plugin> {
  return cacheWrap(
    pluginKey(id),
    () => {
      const found = plugins.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Plugin '${id}' not found`);
      return Promise.resolve({ ...found, tags: [...found.tags] });
    },
    CACHE_TTL.pluginDetail,
  );
}

/** List all plugin categories. Cached. */
export async function listPluginCategories(): Promise<PluginCategory[]> {
  return cacheWrap(
    CATEGORIES_KEY,
    () => Promise.resolve(SEED_CATEGORIES.map((c) => ({ ...c }))),
    CACHE_TTL.pluginCategories,
  );
}

/** Get a plugin's changelog. Throws 404 if plugin missing. */
export async function getPluginChangelog(
  id: string,
): Promise<PluginChangelogEntry[]> {
  return cacheWrap(
    changelogKey(id),
    () => {
      const found = plugins.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Plugin '${id}' not found`);
      const entries = SEED_CHANGELOGS[id] ?? [];
      return Promise.resolve(entries.map((e) => ({ ...e, notes: [...e.notes] })));
    },
    CACHE_TTL.pluginChangelog,
  );
}

/** Register a new plugin. */
export async function createPlugin(
  input: PluginCreateInput,
): Promise<Plugin> {
  const now = new Date().toISOString();
  const plugin: Plugin = {
    id: `plugin-${randomUUID()}`,
    name: input.name,
    slug: input.slug,
    category: input.category,
    description: input.description,
    author: input.author ?? "community",
    version: input.version ?? "0.1.0",
    downloads: 0,
    rating: 0,
    verified: false,
    tags: input.tags ?? [],
    license: input.license ?? "MIT",
    createdAt: now,
    updatedAt: now,
  };
  plugins = [plugin, ...plugins];
  invalidate(plugin.id);
  log.info("Plugin registered", { id: plugin.id, name: plugin.name });
  return plugin;
}

/** Test-only: reset to seed. */
export function _resetPluginsForTest(): void {
  plugins = SEED_PLUGINS.map((p) => ({ ...p, tags: [...p.tags] }));
  invalidate();
}
