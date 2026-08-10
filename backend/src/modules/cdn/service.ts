/**
 * CDN service — in-memory Roy CDN stats / resources / edges store.
 *
 * Mock backend (no DB). Seeds CDN stats (requests, bandwidth, hit rate),
 * 4 resource types, and 6 edge locations. All reads are LRU-cached;
 * purging the cache invalidates the stats and resources caches.
 *
 * Future: swap the in-memory stats for a real CDN provider API
 * (Cloudflare, Fastly, AWS CloudFront) with a periodic ingestion job.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { CDNEdge, CDNResource, CDNStats } from "../../types/index.js";

const log = createLogger("cdn");

const STATS_KEY = "cdn:stats";
const RESOURCES_KEY = "cdn:resources";
const EDGES_KEY = "cdn:edges";

function invalidateStats(): void {
  cache.delete(STATS_KEY);
  cache.delete(RESOURCES_KEY);
}

// ─── Seed: stats ─────────────────────────────────────────────────────────
const SEED_STATS: CDNStats = {
  requests: 18_400_223,
  bandwidth: 2_412_881_034_752, // ~2.4 TB
  hitRate: 0.974,
  cacheHits: 17_921_817,
  cacheMisses: 478_406,
  avgResponseTime: 38, // ms
  window: "24h",
};

// ─── Seed: 4 resource types ──────────────────────────────────────────────
const SEED_RESOURCES: CDNResource[] = [
  {
    id: "cdn-res-css",
    path: "/assets/roycss.min.css",
    type: "asset",
    size: 48_213,
    hits: 4_812_002,
    edgeHits: 4_691_422,
    lastAccessed: "2025-02-28T10:59:42.000Z",
  },
  {
    id: "cdn-res-logo",
    path: "/images/roycss-logo-mark.png",
    type: "image",
    size: 12_840,
    hits: 2_113_448,
    edgeHits: 2_098_812,
    lastAccessed: "2025-02-28T10:58:11.000Z",
  },
  {
    id: "cdn-res-font",
    path: "/fonts/inter-var.woff2",
    type: "font",
    size: 86_042,
    hits: 9_402_118,
    edgeHits: 9_281_440,
    lastAccessed: "2025-02-28T10:59:59.000Z",
  },
  {
    id: "cdn-res-hero",
    path: "/videos/hero.mp4",
    type: "video",
    size: 4_812_002,
    hits: 142_882,
    edgeHits: 134_001,
    lastAccessed: "2025-02-28T09:42:18.000Z",
  },
];

// ─── Seed: 6 edge locations ──────────────────────────────────────────────
const SEED_EDGES: CDNEdge[] = [
  {
    id: "edge-iad",
    city: "Ashburn",
    country: "United States",
    code: "IAD",
    latency: 12,
    requests: 5_812_002,
    status: "online",
  },
  {
    id: "edge-sfo",
    city: "San Francisco",
    country: "United States",
    code: "SFO",
    latency: 18,
    requests: 3_204_118,
    status: "online",
  },
  {
    id: "edge-fra",
    city: "Frankfurt",
    country: "Germany",
    code: "FRA",
    latency: 22,
    requests: 4_512_998,
    status: "online",
  },
  {
    id: "edge-hnd",
    city: "Tokyo",
    country: "Japan",
    code: "HND",
    latency: 28,
    requests: 2_881_004,
    status: "online",
  },
  {
    id: "edge-sin",
    city: "Singapore",
    country: "Singapore",
    code: "SIN",
    latency: 42,
    requests: 1_402_887,
    status: "degraded",
  },
  {
    id: "edge-syd",
    city: "Sydney",
    country: "Australia",
    code: "SYD",
    latency: 51,
    requests: 587_214,
    status: "online",
  },
];

/** Get top-line CDN stats. Cached (1min — freshness matters). */
export async function getStats(): Promise<CDNStats> {
  return cacheWrap(
    STATS_KEY,
    () => Promise.resolve({ ...SEED_STATS }),
    CACHE_TTL.cdnStats,
  );
}

/** List all CDN-tracked resources. Cached. */
export async function listResources(): Promise<CDNResource[]> {
  return cacheWrap(
    RESOURCES_KEY,
    () => Promise.resolve(SEED_RESOURCES.map((r) => ({ ...r }))),
    CACHE_TTL.cdnResources,
  );
}

/** List all CDN edge locations. Cached. */
export async function listEdges(): Promise<CDNEdge[]> {
  return cacheWrap(
    EDGES_KEY,
    () => Promise.resolve(SEED_EDGES.map((e) => ({ ...e }))),
    CACHE_TTL.cdnEdges,
  );
}

/** Purge the CDN cache. Invalidates stats + resources caches. */
export async function purgeCache(input: {
  paths?: string[];
  all?: boolean;
}): Promise<{ purged: number; purgedAt: string }> {
  const purgedAt = new Date().toISOString();
  const purged =
    input.all === true
      ? SEED_RESOURCES.length
      : (input.paths ?? []).filter((p) =>
          SEED_RESOURCES.some((r) => r.path === p),
        ).length;
  invalidateStats();
  log.info("CDN cache purged", { purged, all: input.all === true });
  return { purged, purgedAt };
}

/** Number of edges in the store. */
export function edgesCount(): number {
  return SEED_EDGES.length;
}

log.debug("CDN module loaded", {
  resources: SEED_RESOURCES.length,
  edges: SEED_EDGES.length,
});
