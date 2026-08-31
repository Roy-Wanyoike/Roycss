/**
 * Observatory service — Prisma-backed Roy Observatory (RUM + Core Web
 * Vitals monitoring).
 *
 * Persisted via the Prisma `ObservatorySite` model. Seeds 3 monitored
 * sites with CWV snapshots. Alerts and trends remain static in-memory
 * seeds (no Prisma models for them).
 *
 * Field-mapping: the Prisma `ObservatorySite` model exposes (url, name,
 * lighthouseScore, lastChecked, metricsJson). The domain shape's `name`
 * and `url` map directly; the extra fields (status, region, cwv,
 * samples, lastSeen) are JSON-encoded inside `metricsJson` as a wrapper.
 * `lighthouseScore` is set to the CWV-derived score (rounded average);
 * `lastChecked ← lastSeen`.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  ObservatoryAlert,
  ObservatorySite,
  ObservatoryTrend,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("observatory");

const SITES_KEY = "observatory:sites";
const ALERTS_KEY = "observatory:alerts";
const trendKey = (id: string): string => `observatory:trend:${id}`;
const siteKey = (id: string): string => `observatory:site:${id}`;

// ─── Seed: 3 monitored sites ────────────────────────────────────────────
const SEED_SITES: ObservatorySite[] = [
  {
    id: "obs-site-aurora",
    name: "Aurora Labs",
    url: "https://aurora.example.com",
    status: "healthy",
    region: "us-east-1",
    cwv: {
      lcp: 1_820,
      inp: 142,
      cls: 0.06,
      ttfb: 412,
      fcp: 980,
    },
    samples: 18_421,
    lastSeen: "2025-02-19T08:00:00.000Z",
  },
  {
    id: "obs-site-medtech",
    name: "MedTech Records",
    url: "https://medtech.example.com",
    status: "degraded",
    region: "eu-west-1",
    cwv: {
      lcp: 3_120,
      inp: 284,
      cls: 0.18,
      ttfb: 812,
      fcp: 1_640,
    },
    samples: 8_204,
    lastSeen: "2025-02-19T08:00:00.000Z",
  },
  {
    id: "obs-site-gaming-portal",
    name: "Gaming Portal",
    url: "https://games.example.com",
    status: "healthy",
    region: "ap-south-1",
    cwv: {
      lcp: 2_140,
      inp: 96,
      cls: 0.02,
      ttfb: 530,
      fcp: 1_120,
    },
    samples: 24_812,
    lastSeen: "2025-02-19T08:00:00.000Z",
  },
];

// ─── Seed: 5 alerts (static — no Prisma model) ─────────────────────────
const SEED_ALERTS: ObservatoryAlert[] = [
  {
    id: "alert-001",
    siteId: "obs-site-medtech",
    severity: "critical",
    metric: "LCP",
    message: "LCP p75 exceeded 2.5s for the last 6 hours.",
    value: 3120,
    threshold: 2500,
    triggeredAt: "2025-02-19T02:00:00.000Z",
    resolved: false,
  },
  {
    id: "alert-002",
    siteId: "obs-site-medtech",
    severity: "warning",
    metric: "INP",
    message: "INP p75 above 200ms for the last 3 hours.",
    value: 284,
    threshold: 200,
    triggeredAt: "2025-02-19T05:00:00.000Z",
    resolved: false,
  },
  {
    id: "alert-003",
    siteId: "obs-site-aurora",
    severity: "info",
    metric: "TTFB",
    message: "TTFB p75 trending up by 12% week-over-week.",
    value: 412,
    threshold: 380,
    triggeredAt: "2025-02-18T22:00:00.000Z",
    resolved: false,
  },
  {
    id: "alert-004",
    siteId: "obs-site-gaming-portal",
    severity: "info",
    metric: "CLS",
    message: "CLS p75 below 0.05 — keep up the good work!",
    value: 0.02,
    threshold: 0.1,
    triggeredAt: "2025-02-18T18:00:00.000Z",
    resolved: true,
  },
  {
    id: "alert-005",
    siteId: "obs-site-aurora",
    severity: "warning",
    metric: "LCP",
    message: "LCP p75 spike detected on mobile.",
    value: 2480,
    threshold: 2500,
    triggeredAt: "2025-02-17T11:00:00.000Z",
    resolved: true,
  },
];

interface SiteWrapper {
  status: ObservatorySite["status"];
  region: string;
  cwv: ObservatorySite["cwv"];
  samples: number;
  lastSeen: string;
}

function toDbRow(s: ObservatorySite) {
  const wrapper: SiteWrapper = {
    status: s.status,
    region: s.region,
    cwv: s.cwv,
    samples: s.samples,
    lastSeen: s.lastSeen,
  };
  // Lighthouse-ish score: 100 - average CWV penalty (rough proxy).
  const lighthouseScore = Math.round(
    Math.max(
      0,
      100 -
        Math.max(0, s.cwv.lcp - 2500) / 50 -
        Math.max(0, s.cwv.inp - 200) / 10 -
        Math.max(0, s.cwv.cls - 0.1) * 100,
    ),
  );
  return {
    id: s.id,
    url: s.url,
    name: s.name,
    lighthouseScore,
    lastChecked: new Date(s.lastSeen),
    metricsJson: JSON.stringify(wrapper),
  };
}

function toDomain(row: {
  id: string;
  url: string;
  name: string;
  lighthouseScore: number | null;
  lastChecked: Date | null;
  metricsJson: string | null;
}): ObservatorySite {
  let wrapper: SiteWrapper = {
    status: "healthy",
    region: "us-east-1",
    cwv: { lcp: 0, inp: 0, cls: 0, ttfb: 0, fcp: 0 },
    samples: 0,
    lastSeen: row.lastChecked ? row.lastChecked.toISOString() : new Date(0).toISOString(),
  };
  if (row.metricsJson) {
    try {
      wrapper = JSON.parse(row.metricsJson) as SiteWrapper;
    } catch {
      // Keep defaults.
    }
  }
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    status: wrapper.status,
    region: wrapper.region,
    cwv: wrapper.cwv,
    samples: wrapper.samples,
    lastSeen: wrapper.lastSeen,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.observatorySite.count();
    if (count === 0) {
      await db.observatorySite.createMany({
        data: SEED_SITES.map(toDbRow),
      });
      log.info("Observatory sites seeded", { count: SEED_SITES.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all monitored sites. Cached. */
export async function listSites(): Promise<ObservatorySite[]> {
  return cacheWrap(
    SITES_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.observatorySite.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(toDomain);
    },
    CACHE_TTL.observatorySites,
  );
}

/** Get a single monitored site by id. Throws 404 if missing. */
export async function getSiteById(id: string): Promise<ObservatorySite> {
  return cacheWrap(
    siteKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.observatorySite.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Site '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.observatorySiteDetail,
  );
}

/** List active alerts. Cached. */
export async function listAlerts(): Promise<ObservatoryAlert[]> {
  return cacheWrap(
    ALERTS_KEY,
    () => Promise.resolve(SEED_ALERTS.map((a) => ({ ...a }))),
    CACHE_TTL.observatoryAlerts,
  );
}

/** Get the 7-day trend for a site. Throws 404 if site missing. */
export async function getSiteTrend(id: string): Promise<ObservatoryTrend> {
  // Verify site exists.
  await getSiteById(id);
  return cacheWrap(
    trendKey(id),
    () => {
      const trend: ObservatoryTrend = {
        siteId: id,
        window: "7d",
        points: [
          { date: "2025-02-13", lcp: 1_940, inp: 158, cls: 0.07 },
          { date: "2025-02-14", lcp: 1_880, inp: 152, cls: 0.06 },
          { date: "2025-02-15", lcp: 1_900, inp: 148, cls: 0.06 },
          { date: "2025-02-16", lcp: 1_860, inp: 144, cls: 0.05 },
          { date: "2025-02-17", lcp: 1_840, inp: 140, cls: 0.05 },
          { date: "2025-02-18", lcp: 1_820, inp: 142, cls: 0.06 },
          { date: "2025-02-19", lcp: 1_820, inp: 142, cls: 0.06 },
        ],
      };
      return Promise.resolve(trend);
    },
    CACHE_TTL.observatoryTrend,
  );
}

/** Test-only: clear the read caches. No mutable state to reset. */
export function _resetObservatoryForTest(): void {
  seedPromise = null;
  cache.delete(SITES_KEY);
  cache.delete(ALERTS_KEY);
  for (const s of SEED_SITES) {
    cache.delete(siteKey(s.id));
    cache.delete(trendKey(s.id));
  }
}

log.debug("Observatory module loaded", {
  sites: SEED_SITES.length,
  alerts: SEED_ALERTS.length,
});
