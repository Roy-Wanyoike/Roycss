/**
 * Search service — Roy Search (unified cross-content search).
 *
 * Mock backend (no DB). Seeds 54 searchable items across 8 content
 * types (Components, Effects, Recipes, Templates, Plugins, Documentation,
 * Community, Blueprints). Search runs an in-memory substring + tag match
 * and returns ranked results.
 *
 * Reads are LRU-cached per query string.
 *
 * Future: persist via Prisma `SearchIndex` model backed by Postgres
 * full-text search or an external search engine (e.g. Meilisearch).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  RecentSearch,
  SearchResult,
  SearchableItem,
} from "../../types/index.js";

const log = createLogger("search");

const RECENT_KEY = "search:recent";
const suggestionKey = (q: string): string => `search:suggest:${q}`;
const searchKey = (q: string, types: string[], limit: number): string =>
  `search:q:${q}:${types.join(",")}:${limit}`;

function item(
  id: string,
  type: SearchableItem["type"],
  title: string,
  description: string,
  url: string,
  tags: string[],
): SearchableItem {
  return { id, type, title, description, url, tags };
}

// ─── Seed: 54 searchable items (≈7 per content type) ────────────────────
const SEED_ITEMS: SearchableItem[] = [
  // Components (7)
  item("c-button", "components", "Button", "Primary, secondary, ghost, and destructive button variants.", "/docs/components/button", ["button", "form", "action"]),
  item("c-card", "components", "Card", "Composable card container with header, body, and footer slots.", "/docs/components/card", ["card", "container", "layout"]),
  item("c-modal", "components", "Modal", "Accessible modal dialog with focus trap and ESC dismissal.", "/docs/components/modal", ["modal", "dialog", "overlay"]),
  item("c-tooltip", "components", "Tooltip", "Hover/focus tooltip with smart positioning.", "/docs/components/tooltip", ["tooltip", "popover", "hint"]),
  item("c-tabs", "components", "Tabs", "Accessible horizontal and vertical tabs.", "/docs/components/tabs", ["tabs", "navigation"]),
  item("c-accordion", "components", "Accordion", "Single/multi open accordion with keyboard nav.", "/docs/components/accordion", ["accordion", "collapse"]),
  item("c-datagrid", "components", "DataGrid", "Virtualized data grid with sorting and filtering.", "/docs/components/datagrid", ["datagrid", "table", "virtual"]),

  // Effects (7)
  item("e-glass", "effects", "Glassmorphism", "Backdrop-blur glass effect with layered shadows.", "/effects/glass", ["glass", "blur", "backdrop"]),
  item("e-neon", "effects", "Neon Glow", "Vibrant neon glow for gaming and nightlife UIs.", "/effects/neon", ["neon", "glow", "gaming"]),
  item("e-shadow-soft", "effects", "Soft Shadow", "Soft layered shadow for material surfaces.", "/effects/soft-shadow", ["shadow", "soft", "material"]),
  item("e-gradient-mesh", "effects", "Mesh Gradient", "Multi-stop mesh gradient backgrounds.", "/effects/mesh-gradient", ["gradient", "mesh", "background"]),
  item("e-text-gradient", "effects", "Text Gradient", "Gradient-clipped text with animation hooks.", "/effects/text-gradient", ["text", "gradient", "typography"]),
  item("e-noise", "effects", "Noise Overlay", "Subtle SVG noise overlay for tactile surfaces.", "/effects/noise", ["noise", "overlay", "texture"]),
  item("e-aurora", "effects", "Aurora", "Animated aurora gradient for hero sections.", "/effects/aurora", ["aurora", "gradient", "hero"]),

  // Recipes (7)
  item("r-glass-dashboard", "recipes", "Glass Dashboard", "Recipe combining glass + soft shadow + grid.", "/recipes/glass-dashboard", ["glass", "dashboard", "recipe"]),
  item("r-pricing-cards", "recipes", "Pricing Cards", "Three-tier pricing card recipe with badges.", "/recipes/pricing-cards", ["pricing", "cards", "saas"]),
  item("r-hero-aurora", "recipes", "Aurora Hero", "Animated aurora hero with CTA stack.", "/recipes/aurora-hero", ["hero", "aurora", "landing"]),
  item("r-feature-grid", "recipes", "Feature Grid", "Three-column feature grid with icons.", "/recipes/feature-grid", ["features", "grid", "marketing"]),
  item("r-testimonial", "recipes", "Testimonial", "Customer testimonial card with avatar.", "/recipes/testimonial", ["testimonial", "social-proof"]),
  item("r-stats-bar", "recipes", "Stats Bar", "Inline KPI stats bar with count-up.", "/recipes/stats-bar", ["stats", "kpi", "marketing"]),
  item("r-faq", "recipes", "FAQ", "Accordion-driven FAQ section.", "/recipes/faq", ["faq", "accordion"]),

  // Templates (7)
  item("t-saas-landing", "templates", "SaaS Landing", "Production-ready SaaS landing page template.", "/templates/saas-landing", ["saas", "landing", "marketing"]),
  item("t-portfolio", "templates", "Portfolio", "Designer portfolio with case studies.", "/templates/portfolio", ["portfolio", "designer"]),
  item("t-docs-site", "templates", "Docs Site", "Documentation site template with sidebar + TOC.", "/templates/docs-site", ["docs", "sidebar", "toc"]),
  item("t-dashboard", "templates", "Dashboard", "Admin dashboard shell with sidebar nav.", "/templates/dashboard", ["dashboard", "admin"]),
  item("t-blog", "templates", "Blog", "Minimal blog template with MDX.", "/templates/blog", ["blog", "mdx"]),
  item("t-ecommerce", "templates", "E-commerce", "Storefront template with cart drawer.", "/templates/ecommerce", ["ecommerce", "storefront"]),
  item("t-auth-flow", "templates", "Auth Flow", "Login, signup, and MFA screen templates.", "/templates/auth-flow", ["auth", "login", "signup"]),

  // Plugins (7)
  item("p-stripe", "plugins", "Stripe Plugin", "Stripe checkout and billing components.", "/plugins/stripe", ["stripe", "payments"]),
  item("p-clerk", "plugins", "Clerk Plugin", "Clerk-powered authentication.", "/plugins/clerk", ["clerk", "auth"]),
  item("p-supabase", "plugins", "Supabase Plugin", "Supabase data and auth bindings.", "/plugins/supabase", ["supabase", "backend"]),
  item("p-mapbox", "plugins", "Mapbox Plugin", "Mapbox maps and geocoding.", "/plugins/mapbox", ["mapbox", "maps"]),
  item("p-chartjs", "plugins", "Chart.js Plugin", "Chart.js wrappers with RoyCSS themes.", "/plugins/chartjs", ["chartjs", "charts"]),
  item("p-tiptap", "plugins", "TipTap Plugin", "TipTap rich-text editor integration.", "/plugins/tiptap", ["tiptap", "editor"]),
  item("p-sentry", "plugins", "Sentry Plugin", "Sentry error monitoring.", "/plugins/sentry", ["sentry", "monitoring"]),

  // Documentation (7)
  item("d-getting-started", "documentation", "Getting Started", "Install RoyCSS and ship your first effect in 5 minutes.", "/docs/getting-started", ["intro", "install", "quickstart"]),
  item("d-tokens", "documentation", "Design Tokens", "Color, spacing, typography, and radius tokens.", "/docs/tokens", ["tokens", "design", "variables"]),
  item("d-effects-api", "documentation", "Effects API", "The full effects catalog and how to import them.", "/docs/effects", ["effects", "api"]),
  item("d-theming", "documentation", "Theming Guide", "How to build and ship a custom RoyCSS theme.", "/docs/theming", ["theme", "colors", "dark-mode"]),
  item("d-recipes", "documentation", "Recipes Guide", "Composing effects into reusable recipes.", "/docs/recipes", ["recipes", "composition"]),
  item("d-cli", "documentation", "CLI Reference", "The roycss CLI: scaffold, build, and inspect.", "/docs/cli", ["cli", "scaffold"]),
  item("d-migration", "documentation", "Migration Guide", "Migrating from Tailwind, Bootstrap, and Material.", "/docs/migration", ["migration", "tailwind", "bootstrap"]),

  // Community (6)
  item("cm-aurora-case", "community", "Aurora Labs case study", "How Aurora rebuilt their marketing site in 9 days.", "/community/aurora", ["case-study", "marketing"]),
  item("cm-mira-recipe", "community", "Glass dashboard recipe", "Community recipe from @miracss.", "/community/glass-dashboard", ["recipe", "glass"]),
  item("cm-cssconf-talk", "community", "CSSConf talk", "'Designing CSS for a million users' by Roy.", "/community/cssconf", ["talk", "cssconf"]),
  item("cm-healthcare-showcase", "community", "Healthcare showcase", "HIPAA-ready patient dashboard by MedTech Inc.", "/community/medtech", ["showcase", "healthcare"]),
  item("cm-container-tutorial", "community", "Container queries tutorial", "20-minute tutorial on container-query utilities.", "/community/container-queries", ["tutorial", "container-queries"]),
  item("cm-tailwind-compat", "community", "Tailwind compat milestone", "Tailwind compat preset hit 10k weekly downloads.", "/community/tailwind-compat", ["milestone", "npm"]),

  // Blueprints (6)
  item("bp-hospital", "blueprints", "Hospital Blueprint", "End-to-end hospital management blueprint.", "/blueprints/hospital", ["healthcare", "hospital"]),
  item("bp-pos", "blueprints", "POS Blueprint", "In-store point-of-sale blueprint.", "/blueprints/pos", ["retail", "pos"]),
  item("bp-erp", "blueprints", "ERP Blueprint", "Modular ERP suite blueprint.", "/blueprints/erp", ["enterprise", "erp"]),
  item("bp-banking", "blueprints", "Banking Blueprint", "Consumer digital banking blueprint.", "/blueprints/banking", ["fintech", "banking"]),
  item("bp-education", "blueprints", "Education Blueprint", "LMS blueprint for K-12 and higher ed.", "/blueprints/education", ["education", "lms"]),
  item("bp-logistics", "blueprints", "Logistics Blueprint", "Fleet and shipment tracking blueprint.", "/blueprints/logistics", ["logistics", "fleet"]),
];

const SEED_RECENT: RecentSearch[] = [
  { id: "rs-1", query: "glass", results: 12, ts: "2025-02-19T07:30:00.000Z" },
  { id: "rs-2", query: "container queries", results: 4, ts: "2025-02-19T06:00:00.000Z" },
  { id: "rs-3", query: "billing", results: 6, ts: "2025-02-18T22:00:00.000Z" },
  { id: "rs-4", query: "dark mode", results: 9, ts: "2025-02-18T18:00:00.000Z" },
  { id: "rs-5", query: "auth", results: 11, ts: "2025-02-18T11:00:00.000Z" },
];

const items: SearchableItem[] = SEED_ITEMS.map((i) => ({ ...i, tags: [...i.tags] }));

function scoreItem(item: SearchableItem, q: string): number {
  const lower = q.toLowerCase();
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  const tags = item.tags.map((t) => t.toLowerCase());
  if (title === lower) return 100;
  if (title.startsWith(lower)) return 90;
  if (title.includes(lower)) return 75;
  if (tags.some((t) => t === lower)) return 70;
  if (tags.some((t) => t.includes(lower))) return 55;
  if (desc.includes(lower)) return 40;
  return 0;
}

export interface SearchResponse {
  query: string;
  items: SearchResult[];
  total: number;
  took: number;
}

/** Run a search. Cached per (query, types, limit). */
export async function search(input: {
  query: string;
  types?: SearchableItem["type"][];
  limit?: number;
}): Promise<SearchResponse> {
  const q = input.query.trim();
  const types = input.types ?? [];
  const limit = input.limit ?? 20;
  const cacheK = searchKey(q, types, limit);
  return cacheWrap(
    cacheK,
    () => {
      const start = Date.now();
      const typeSet = types.length === 0 ? null : new Set(types);
      const matched = items
        .filter((i) => (typeSet ? typeSet.has(i.type) : true))
        .map((i) => ({ item: i, score: scoreItem(i, q) }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((m) => ({
          id: m.item.id,
          type: m.item.type,
          title: m.item.title,
          description: m.item.description,
          url: m.item.url,
          tags: [...m.item.tags],
          score: m.score,
        }));
      return Promise.resolve({
        query: q,
        items: matched,
        total: matched.length,
        took: Date.now() - start,
      });
    },
    CACHE_TTL.searchQuery,
  );
}

/** Get search suggestions for a prefix. Cached per prefix. */
export async function getSuggestions(prefix: string): Promise<string[]> {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];
  return cacheWrap(
    suggestionKey(p),
    () => {
      const set = new Set<string>();
      for (const it of items) {
        if (it.title.toLowerCase().includes(p)) set.add(it.title);
        for (const t of it.tags) {
          if (t.includes(p)) set.add(t);
        }
        if (set.size >= 10) break;
      }
      return Promise.resolve([...set].slice(0, 10));
    },
    CACHE_TTL.searchSuggestions,
  );
}

/** List recent searches (mock). Cached. */
export async function getRecentSearches(): Promise<RecentSearch[]> {
  return cacheWrap(
    RECENT_KEY,
    () => Promise.resolve(SEED_RECENT.map((r) => ({ ...r }))),
    CACHE_TTL.searchRecent,
  );
}

log.debug("Search module loaded", { items: items.length });
