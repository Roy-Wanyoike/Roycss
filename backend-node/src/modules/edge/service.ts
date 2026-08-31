/**
 * Edge service — in-memory Roy Edge regions / config / performance store.
 *
 * Mock backend (no DB). Seeds 6 edge regions, a default edge config
 * (TTL, cache strategy, custom headers), and an edge-vs-origin latency
 * comparison. All reads are LRU-cached; deploying a new edge config
 * invalidates the config cache.
 *
 * Future: swap the in-memory state for a real edge-platform API
 * (Cloudflare Workers, Vercel Edge, Deno Deploy).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  EdgeConfig,
  EdgePerformancePoint,
  EdgeRegion,
} from "../../types/index.js";

const log = createLogger("edge");

const REGIONS_KEY = "edge:regions";
const CONFIG_KEY = "edge:config";
const PERFORMANCE_KEY = "edge:performance";

function invalidateConfig(): void {
  cache.delete(CONFIG_KEY);
}

// ─── Seed: 6 edge regions ────────────────────────────────────────────────
const SEED_REGIONS: EdgeRegion[] = [
  {
    id: "edge-iad",
    name: "US East (Ashburn)",
    city: "Ashburn",
    country: "United States",
    code: "IAD",
    latency: 12,
    status: "active",
    requests24h: 5_812_002,
  },
  {
    id: "edge-sfo",
    name: "US West (San Francisco)",
    city: "San Francisco",
    country: "United States",
    code: "SFO",
    latency: 18,
    status: "active",
    requests24h: 3_204_118,
  },
  {
    id: "edge-fra",
    name: "EU Central (Frankfurt)",
    city: "Frankfurt",
    country: "Germany",
    code: "FRA",
    latency: 22,
    status: "active",
    requests24h: 4_512_998,
  },
  {
    id: "edge-hnd",
    name: "Asia Pacific (Tokyo)",
    city: "Tokyo",
    country: "Japan",
    code: "HND",
    latency: 28,
    status: "active",
    requests24h: 2_881_004,
  },
  {
    id: "edge-sin",
    name: "Southeast Asia (Singapore)",
    city: "Singapore",
    country: "Singapore",
    code: "SIN",
    latency: 42,
    status: "syncing",
    requests24h: 1_402_887,
  },
  {
    id: "edge-syd",
    name: "Oceania (Sydney)",
    city: "Sydney",
    country: "Australia",
    code: "SYD",
    latency: 51,
    status: "disabled",
    requests24h: 0,
  },
];

// ─── Default edge config (mutable) ───────────────────────────────────────
let currentConfig: EdgeConfig = {
  defaultTtl: 60, // 60s
  cacheStrategy: "stale-while-revalidate",
  purgeOnDeploy: true,
  customHeaders: {
    "Cache-Tag": "roycss-edge",
    "X-Edge-Version": "v1",
  },
};

// ─── Seed: performance comparison (edge vs origin) ───────────────────────
const SEED_PERFORMANCE: EdgePerformancePoint[] = SEED_REGIONS.map((r) => ({
  region: r.code,
  edgeLatency: r.latency,
  originLatency: r.latency + 180, // mock: origin is ~180ms slower
  improvement: Math.round((180 / (r.latency + 180)) * 100),
}));

/** List all edge regions. Cached. */
export async function listRegions(): Promise<EdgeRegion[]> {
  return cacheWrap(
    REGIONS_KEY,
    () => Promise.resolve(SEED_REGIONS.map((r) => ({ ...r }))),
    CACHE_TTL.edgeRegions,
  );
}

/** Get the current edge config. Cached. */
export async function getConfig(): Promise<EdgeConfig> {
  return cacheWrap(
    CONFIG_KEY,
    () =>
      Promise.resolve({
        ...currentConfig,
        customHeaders: { ...currentConfig.customHeaders },
      }),
    CACHE_TTL.edgeConfig,
  );
}

/** Deploy a new edge config. Invalidates the config cache. */
export async function deployConfig(input: {
  defaultTtl?: number;
  cacheStrategy?: EdgeConfig["cacheStrategy"];
  purgeOnDeploy?: boolean;
  customHeaders?: Record<string, string>;
}): Promise<EdgeConfig> {
  currentConfig = {
    defaultTtl: input.defaultTtl ?? currentConfig.defaultTtl,
    cacheStrategy: input.cacheStrategy ?? currentConfig.cacheStrategy,
    purgeOnDeploy: input.purgeOnDeploy ?? currentConfig.purgeOnDeploy,
    customHeaders: input.customHeaders ?? currentConfig.customHeaders,
  };
  invalidateConfig();
  log.info("Edge config deployed", {
    ttl: currentConfig.defaultTtl,
    strategy: currentConfig.cacheStrategy,
  });
  return {
    ...currentConfig,
    customHeaders: { ...currentConfig.customHeaders },
  };
}

/** Edge vs origin performance comparison. Cached. */
export async function getPerformance(): Promise<EdgePerformancePoint[]> {
  return cacheWrap(
    PERFORMANCE_KEY,
    () => Promise.resolve(SEED_PERFORMANCE.map((p) => ({ ...p }))),
    CACHE_TTL.edgePerformance,
  );
}

/** Number of regions in the store. */
export function regionsCount(): number {
  return SEED_REGIONS.length;
}

/** Test-only: reset config to defaults. */
export function _resetEdgeForTest(): void {
  currentConfig = {
    defaultTtl: 60,
    cacheStrategy: "stale-while-revalidate",
    purgeOnDeploy: true,
    customHeaders: {
      "Cache-Tag": "roycss-edge",
      "X-Edge-Version": "v1",
    },
  };
  invalidateConfig();
}

log.debug("Edge module loaded", { regions: SEED_REGIONS.length });
