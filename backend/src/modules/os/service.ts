/**
 * OS service — Roy OS (the unified launcher / dashboard surface).
 *
 * Mock backend (no DB). Seeds 12 product tiles, 5 activity items, 5
 * quick actions, and a single dashboard layout that composes them.
 *
 * Reads are LRU-cached. No mutation endpoints — Roy OS is a curated
 * launcher surface.
 *
 * Future: persist per-user customization via Prisma `OSDashboard` model.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  OSDashboard,
  OSProductTile,
  OSActivity,
  OSQuickAction,
} from "../../types/index.js";

const log = createLogger("os");

const DASHBOARD_KEY = "os:dashboard";
const PRODUCTS_KEY = "os:products";
const ACTIVITY_KEY = "os:activity";
const QUICK_ACTIONS_KEY = "os:quick-actions";

// ─── Seed: 12 product tiles ─────────────────────────────────────────────
const SEED_PRODUCTS: OSProductTile[] = [
  { id: "p-effects", name: "Effects", icon: "sparkles", category: "library", url: "/effects", color: "#10b981", available: true },
  { id: "p-recipes", name: "Recipes", icon: "book", category: "library", url: "/recipes", color: "#6366f1", available: true },
  { id: "p-patterns", name: "Patterns", icon: "layout-grid", category: "library", url: "/patterns", color: "#f59e0b", available: true },
  { id: "p-themes", name: "Themes", icon: "palette", category: "design", url: "/themes", color: "#ec4899", available: true },
  { id: "p-studio", name: "Studio", icon: "pen-tool", category: "design", url: "/studio", color: "#8b5cf6", available: true },
  { id: "p-architect", name: "Architect", icon: "git-branch", category: "code", url: "/architect", color: "#0ea5e9", available: true },
  { id: "p-blocks", name: "Blocks", icon: "boxes", category: "code", url: "/blocks", color: "#14b8a6", available: true },
  { id: "p-blueprints", name: "Blueprints", icon: "map", category: "code", url: "/blueprints", color: "#f43f5e", available: true },
  { id: "p-observatory", name: "Observatory", icon: "activity", category: "ops", url: "/observatory", color: "#22c55e", available: true },
  { id: "p-cloud", name: "Cloud", icon: "cloud", category: "ops", url: "/cloud", color: "#3b82f6", available: true },
  { id: "p-academy", name: "Academy", icon: "graduation-cap", category: "learn", url: "/academy", color: "#a855f7", available: true },
  { id: "p-marketplace", name: "Marketplace", icon: "shopping-bag", category: "marketplace", url: "/marketplace", color: "#f97316", available: true },
];

// ─── Seed: 5 activity items ─────────────────────────────────────────────
const SEED_ACTIVITY: OSActivity[] = [
  { id: "act-001", type: "deploy", title: "Deployed aurora-marketing to production", actor: "user-roy", ts: "2025-02-19T07:42:00.000Z", meta: { project: "aurora-marketing", environment: "production" } },
  { id: "act-002", type: "publish", title: "Published theme 'Healthcare' to marketplace", actor: "user-asha", ts: "2025-02-19T06:10:00.000Z", meta: { themeId: "theme-healthcare" } },
  { id: "act-003", type: "review", title: "Approved refactor of legacy grid utilities", actor: "user-devon", ts: "2025-02-19T04:55:00.000Z", meta: { reviewId: "rev-1042" } },
  { id: "act-004", type: "comment", title: "Commented on RFC 'Adopt :has() as a first-class selector'", actor: "user-mira", ts: "2025-02-18T22:31:00.000Z", meta: { rfcId: "rfc-002" } },
  { id: "act-005", type: "certify", title: "Earned the RoyCSS Associate certification", actor: "user-priya", ts: "2025-02-18T18:00:00.000Z", meta: { certificationId: "cert-associate" } },
];

// ─── Seed: 5 quick actions ──────────────────────────────────────────────
const SEED_QUICK_ACTIONS: OSQuickAction[] = [
  { id: "qa-new-project", label: "New project", icon: "plus", shortcut: "mod+n", url: "/scaffold" },
  { id: "qa-deploy", label: "Deploy", icon: "upload-cloud", shortcut: "mod+shift+d", url: "/deploy" },
  { id: "qa-search", label: "Search", icon: "search", shortcut: "mod+k", url: "/search" },
  { id: "qa-docs", label: "Open docs", icon: "book-open", shortcut: "mod+/", url: "/docs" },
  { id: "qa-invite", label: "Invite teammate", icon: "user-plus", shortcut: "", url: "/workspace/invite" },
];

/** Compose the dashboard. Cached. */
export async function getDashboard(): Promise<OSDashboard> {
  return cacheWrap(
    DASHBOARD_KEY,
    () =>
      Promise.resolve({
        products: SEED_PRODUCTS.map((p) => ({ ...p })),
        activity: SEED_ACTIVITY.map((a) => ({ ...a, meta: { ...a.meta } })),
        quickActions: SEED_QUICK_ACTIONS.map((q) => ({ ...q })),
        layout: [
          { section: "Pinned", productIds: ["p-effects", "p-recipes", "p-themes"] },
          { section: "Code", productIds: ["p-architect", "p-blocks", "p-blueprints"] },
          { section: "Operations", productIds: ["p-observatory", "p-cloud"] },
          { section: "Learn & Marketplace", productIds: ["p-academy", "p-marketplace"] },
        ],
      }),
    CACHE_TTL.osDashboard,
  );
}

/** List all product tiles. Cached. */
export async function listProducts(): Promise<OSProductTile[]> {
  return cacheWrap(
    PRODUCTS_KEY,
    () => Promise.resolve(SEED_PRODUCTS.map((p) => ({ ...p }))),
    CACHE_TTL.osProducts,
  );
}

/** List recent activity items. Cached. */
export async function listActivity(): Promise<OSActivity[]> {
  return cacheWrap(
    ACTIVITY_KEY,
    () => Promise.resolve(SEED_ACTIVITY.map((a) => ({ ...a, meta: { ...a.meta } }))),
    CACHE_TTL.osActivity,
  );
}

/** List quick actions. Cached. */
export async function listQuickActions(): Promise<OSQuickAction[]> {
  return cacheWrap(
    QUICK_ACTIONS_KEY,
    () => Promise.resolve(SEED_QUICK_ACTIONS.map((q) => ({ ...q }))),
    CACHE_TTL.osQuickActions,
  );
}

log.debug("OS module loaded", {
  products: SEED_PRODUCTS.length,
  activity: SEED_ACTIVITY.length,
  quickActions: SEED_QUICK_ACTIONS.length,
});
