/**
 * Spotlight service — Roy Spotlight (community + featured content).
 *
 * Mock backend (no DB). Seeds 6 featured spotlight items and a weekly
 * spotlight slot. Submissions are appended (status: "pending").
 *
 * Reads are LRU-cached; submissions invalidate the items + featured caches.
 *
 * Future: persist via Prisma `SpotlightItem` model and gate submissions
 * behind an admin moderation queue.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { SpotlightItem, WeeklySpotlight } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { SpotlightSubmitInput } from "./schema.js";

const log = createLogger("spotlight");

const ITEMS_KEY = "spotlight:items";
const FEATURED_KEY = "spotlight:featured";
const WEEKLY_KEY = "spotlight:weekly";
const itemKey = (id: string): string => `spotlight:item:${id}`;

function invalidateItems(id?: string): void {
  cache.delete(ITEMS_KEY);
  cache.delete(FEATURED_KEY);
  if (id) cache.delete(itemKey(id));
}

// ─── Seed: 6 featured items ─────────────────────────────────────────────
const SEED_ITEMS: SpotlightItem[] = [
  {
    id: "spot-001",
    title: "Aurora Labs rebuilds their marketing site with RoyCSS",
    type: "case-study",
    author: "Aurora Labs",
    url: "https://aurora.example.com",
    thumbnail: "https://cdn.roycss.dev/spotlight/aurora.png",
    description:
      "A 12-person startup shipped a full marketing site rebuild in 9 days using RoyCSS effects + recipes.",
    featured: true,
    tags: ["case-study", "marketing", "startup"],
    publishedAt: "2025-02-10T00:00:00.000Z",
  },
  {
    id: "spot-002",
    title: "Community recipe: 'Glassmorphism dashboard'",
    type: "recipe",
    author: "@miracss",
    url: "https://roycss.dev/recipes/glass-dashboard",
    thumbnail: "https://cdn.roycss.dev/spotlight/glass.png",
    description:
      "A community-submitted recipe combining backdrop-blur, layered shadows, and oklch palettes.",
    featured: true,
    tags: ["recipe", "glassmorphism", "dashboard"],
    publishedAt: "2025-02-12T00:00:00.000Z",
  },
  {
    id: "spot-003",
    title: "Talk: 'Designing CSS for a million users' — Roy @ CSSConf",
    type: "talk",
    author: "Roy",
    url: "https://www.youtube.com/watch?v=example",
    thumbnail: "https://cdn.roycss.dev/spotlight/cssconf.png",
    description:
      "A 30-minute deep dive on the architectural decisions behind RoyCSS, recorded at CSSConf 2025.",
    featured: true,
    tags: ["talk", "cssconf", "architecture"],
    publishedAt: "2025-02-14T00:00:00.000Z",
  },
  {
    id: "spot-004",
    title: "Plugin: 'roycss-preset-tailwind-compat' hits 10k downloads",
    type: "milestone",
    author: "@devp",
    url: "https://npmjs.com/package/roycss-preset-tailwind-compat",
    thumbnail: "https://cdn.roycss.dev/spotlight/compat.png",
    description:
      "The Tailwind compatibility preset just crossed 10,000 weekly downloads on npm.",
    featured: true,
    tags: ["plugin", "milestone", "npm"],
    publishedAt: "2025-02-15T00:00:00.000Z",
  },
  {
    id: "spot-005",
    title: "Showcase: Healthcare records dashboard (HIPAA-ready)",
    type: "showcase",
    author: "MedTech Inc.",
    url: "https://medtech.example.com",
    thumbnail: "https://cdn.roycss.dev/spotlight/medtech.png",
    description:
      "A HIPAA-ready patient records dashboard built on the Roy Healthcare theme + Pro Components.",
    featured: true,
    tags: ["showcase", "healthcare", "enterprise"],
    publishedAt: "2025-02-17T00:00:00.000Z",
  },
  {
    id: "spot-006",
    title: "Tutorial: 'Container queries in production with RoyCSS'",
    type: "tutorial",
    author: "@ashadev",
    url: "https://roycss.dev/tutorials/container-queries",
    thumbnail: "https://cdn.roycss.dev/spotlight/cq.png",
    description:
      "A 20-minute tutorial on adopting container-query utilities in a real production codebase.",
    featured: true,
    tags: ["tutorial", "container-queries", "patterns"],
    publishedAt: "2025-02-19T00:00:00.000Z",
  },
];

// ─── Seed: weekly spotlight ─────────────────────────────────────────────
const SEED_WEEKLY: WeeklySpotlight = {
  weekOf: "2025-02-17",
  title: "Glassmorphism is back, and it's accessible",
  summary:
    "Three new recipes and one case study explore how modern backdrop-filter + oklch palettes make glass UIs viable again — without sacrificing contrast.",
  primaryItemId: "spot-002",
  relatedItemIds: ["spot-001", "spot-005"],
  curatedBy: "@roy",
};

let items: SpotlightItem[] = SEED_ITEMS.map((i) => ({ ...i }));
const weekly: WeeklySpotlight = { ...SEED_WEEKLY, relatedItemIds: [...SEED_WEEKLY.relatedItemIds] };

/** List all spotlight items. Cached. */
export async function listSpotlightItems(): Promise<SpotlightItem[]> {
  return cacheWrap(
    ITEMS_KEY,
    () => Promise.resolve(items.map((i) => ({ ...i, tags: [...i.tags] }))),
    CACHE_TTL.spotlightItems,
  );
}

/** List featured spotlight items only. Cached. */
export async function listFeaturedSpotlight(): Promise<SpotlightItem[]> {
  return cacheWrap(
    FEATURED_KEY,
    () =>
      Promise.resolve(
        items
          .filter((i) => i.featured)
          .map((i) => ({ ...i, tags: [...i.tags] })),
      ),
    CACHE_TTL.spotlightFeatured,
  );
}

/** Get a single spotlight item by id. Throws 404 if missing. */
export async function getSpotlightItemById(id: string): Promise<SpotlightItem> {
  return cacheWrap(
    itemKey(id),
    () => {
      const found = items.find((i) => i.id === id);
      if (!found) throw AppError.notFound(`Spotlight item '${id}' not found`);
      return Promise.resolve({ ...found, tags: [...found.tags] });
    },
    CACHE_TTL.spotlightItemDetail,
  );
}

/** Submit a new spotlight candidate. Appends with status "pending". */
export async function submitSpotlight(
  input: SpotlightSubmitInput,
): Promise<SpotlightItem> {
  const item: SpotlightItem = {
    id: `spot-${Date.now()}`,
    title: input.title,
    type: input.type,
    author: input.author,
    url: input.url,
    thumbnail: input.thumbnail ?? "",
    description: input.description,
    featured: false,
    tags: input.tags ?? [],
    publishedAt: new Date().toISOString(),
  };
  items = [item, ...items];
  invalidateItems(item.id);
  log.info("Spotlight submitted", { id: item.id, title: item.title });
  return item;
}

/** Get the current weekly spotlight. Cached. */
export async function getWeeklySpotlight(): Promise<WeeklySpotlight> {
  return cacheWrap(
    WEEKLY_KEY,
    () =>
      Promise.resolve({
        ...weekly,
        relatedItemIds: [...weekly.relatedItemIds],
      }),
    CACHE_TTL.spotlightWeekly,
  );
}

/** Test-only: reset to seed. */
export function _resetSpotlightForTest(): void {
  items = SEED_ITEMS.map((i) => ({ ...i }));
  invalidateItems();
  cache.delete(WEEKLY_KEY);
}
