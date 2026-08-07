/**
 * Analytics service — in-memory mock analytics data.
 *
 * Returns platform KPIs (totalUsers, activeEffects, apiCalls,
 * avgResponseTime), 30-day traffic, top 10 effects by usage, device
 * breakdown, and top 5 countries. All values are static snapshots
 * suitable for the dashboard preview — no real telemetry is collected.
 *
 * All reads are LRU-cached for 5 minutes.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import type {
  AnalyticsOverview,
  DeviceBreakdown,
  GeoData,
  TopEffect,
  TrafficDataPoint,
} from "../../types/index.js";

// ─── Static mock dataset ─────────────────────────────────────────────────

const OVERVIEW: AnalyticsOverview = {
  totalUsers: 48_217,
  activeEffects: 1_284,
  apiCalls: 9_412_886,
  avgResponseTime: 87, // ms
  totalUsersChange: 12.4, // %
  activeEffectsChange: 8.1,
  apiCallsChange: 23.7,
  avgResponseTimeChange: -4.2, // faster
};

const DEVICE_BREAKDOWN: DeviceBreakdown = {
  desktop: 0.58,
  mobile: 0.34,
  tablet: 0.08,
};

const GEO_DATA: GeoData[] = [
  { country: "United States", code: "US", visitors: 18_420, share: 0.382 },
  { country: "India", code: "IN", visitors: 8_910, share: 0.185 },
  { country: "Germany", code: "DE", visitors: 5_240, share: 0.109 },
  { country: "Brazil", code: "BR", visitors: 3_860, share: 0.080 },
  { country: "Japan", code: "JP", visitors: 2_980, share: 0.062 },
];

const TOP_EFFECTS: TopEffect[] = [
  { id: "text-gradient", name: "Text Gradient", category: "text", uses: 184_220, trend: 14.2 },
  { id: "card-glassmorphism", name: "Glassmorphism Card", category: "cards", uses: 162_540, trend: 9.8 },
  { id: "fade-in-up", name: "Fade In Up", category: "animations", uses: 151_880, trend: 6.4 },
  { id: "pulse-glow", name: "Pulse Glow", category: "hover", uses: 138_220, trend: 11.1 },
  { id: "loader-shimmer", name: "Shimmer Loader", category: "loaders", uses: 124_010, trend: 3.2 },
  { id: "input-glow-focus", name: "Input Glow Focus", category: "forms", uses: 112_440, trend: 7.9 },
  { id: "slide-in-right", name: "Slide In Right", category: "animations", uses: 98_760, trend: 5.1 },
  { id: "anim-breathing-orb-b18", name: "Breathing Orb", category: "animations", uses: 87_330, trend: 18.6 },
  { id: "particles-confetti-burst", name: "Confetti Burst", category: "particles", uses: 76_980, trend: 22.4 },
  { id: "micro-shake-error", name: "Shake Error", category: "microinteractions", uses: 64_120, trend: 2.8 },
];

// 30 days of traffic, generated deterministically (no Math.random —
// keeps the cached snapshot stable across requests within TTL).
const TRAFFIC_DATA: TrafficDataPoint[] = buildTrafficSeries(30);

function buildTrafficSeries(days: number): TrafficDataPoint[] {
  const out: TrafficDataPoint[] = [];
  const today = new Date("2025-02-28T00:00:00.000Z");
  // Smooth pseudo-random walk seeded by the day index — stable across runs.
  let visitors = 5_200;
  let pageViews = 14_400;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);

    // Stable wave: combine day-of-week + slow growth.
    const dow = d.getUTCDay(); // 0..6
    const weekendDip = dow === 0 || dow === 6 ? 0.78 : 1;
    const growth = 1 + (days - i) * 0.004;
    const wiggle = 1 + Math.sin(i * 0.9) * 0.05;

    visitors = Math.round(5_200 * weekendDip * growth * wiggle);
    pageViews = Math.round(visitors * (2.7 + Math.cos(i * 0.6) * 0.15));

    out.push({
      date: d.toISOString().slice(0, 10),
      visitors,
      pageViews,
    });
  }
  return out;
}

// ─── Service functions ───────────────────────────────────────────────────

/** Top-line KPIs. Cached. */
export async function getOverview(): Promise<AnalyticsOverview> {
  return cacheWrap(
    "analytics:overview",
    () => Promise.resolve({ ...OVERVIEW }),
    CACHE_TTL.analytics,
  );
}

/** Top 10 effects by usage. Cached. */
export async function getTopEffects(): Promise<TopEffect[]> {
  return cacheWrap(
    "analytics:top-effects",
    () => Promise.resolve(TOP_EFFECTS.map((e) => ({ ...e }))),
    CACHE_TTL.analytics,
  );
}

/** Traffic chart data (30 days). Cached. */
export async function getTrafficData(): Promise<TrafficDataPoint[]> {
  return cacheWrap(
    "analytics:traffic",
    () => Promise.resolve(TRAFFIC_DATA.map((p) => ({ ...p }))),
    CACHE_TTL.analytics,
  );
}

/** Device breakdown (desktop/mobile/tablet). Cached. */
export async function getDeviceBreakdown(): Promise<DeviceBreakdown> {
  return cacheWrap(
    "analytics:devices",
    () => Promise.resolve({ ...DEVICE_BREAKDOWN }),
    CACHE_TTL.analytics,
  );
}

/** Geo data (top 5 countries). Cached. */
export async function getGeoData(): Promise<GeoData[]> {
  return cacheWrap(
    "analytics:geo",
    () => Promise.resolve(GEO_DATA.map((g) => ({ ...g }))),
    CACHE_TTL.analytics,
  );
}
