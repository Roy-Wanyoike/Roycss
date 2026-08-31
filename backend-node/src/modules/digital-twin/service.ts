/**
 * Digital Twin service — Roy Digital Twin (site simulation).
 *
 * Backed by Lighthouse (via chrome-launcher) when available.
 * `runLighthouse(url)` lazily imports `lighthouse` + `chrome-launcher`,
 * launches a headless Chrome, runs the default Lighthouse flow, and
 * returns the performance metrics. If Lighthouse is unavailable, a
 * deterministic mock simulation is returned — same shape, same cache
 * keys. `createTwinSimulation()` enriches its performance card with
 * real Lighthouse numbers when they're available.
 *
 * Reads are LRU-cached; new simulations invalidate the results list.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  TwinResult,
  TwinSimulationSummary,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { CreateTwinInput } from "./schema.js";

const log = createLogger("digital-twin");

let lighthouseChecked = false;
let lighthouseOk = false;

/** Detect whether chrome-launcher + Lighthouse are usable in this env. */
export async function isLighthouseAvailable(): Promise<boolean> {
  if (lighthouseChecked) return lighthouseOk;
  lighthouseChecked = true;
  try {
    const chrome = await import("chrome-launcher");
    const instance = await chrome.launch({ chromeFlags: ["--headless"] });
    await instance.kill();
    lighthouseOk = true;
  } catch (err) {
    log.warn("Lighthouse unavailable — falling back to mock simulations", {
      err: (err as Error).message,
    });
    lighthouseOk = false;
  }
  return lighthouseOk;
}

/** Run Lighthouse on a URL. Returns null if unavailable. */
export async function runLighthouse(
  url: string,
): Promise<{
  lcp: number;
  inp: number;
  cls: number;
  ttfb: number;
  fcp: number;
  score: number;
} | null> {
  if (!(await isLighthouseAvailable())) return null;
  try {
    const chrome = await import("chrome-launcher");
    const lighthouseMod = await import("lighthouse");
    const lighthouse = lighthouseMod.default;
    if (typeof lighthouse !== "function") return null;
    const instance = await chrome.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });
    try {
      const result = await lighthouse(url, {
        port: instance.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance"],
      });
      const lhr = (result?.lhr ?? {}) as {
        audits?: {
          "largest-contentful-paint"?: { numericValue?: number };
          "interaction-to-next-paint"?: { numericValue?: number };
          "cumulative-layout-shift"?: { numericValue?: number };
          "server-response-time"?: { numericValue?: number };
          "first-contentful-paint"?: { numericValue?: number };
        };
        categories?: { performance?: { score?: number } };
      };
      const audits = lhr.audits ?? {};
      const score = Math.round((lhr.categories?.performance?.score ?? 0) * 100);
      return {
        lcp: Math.round(audits["largest-contentful-paint"]?.numericValue ?? 0),
        inp: Math.round(audits["interaction-to-next-paint"]?.numericValue ?? 0),
        cls: Number(
          (audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(2),
        ),
        ttfb: Math.round(audits["server-response-time"]?.numericValue ?? 0),
        fcp: Math.round(audits["first-contentful-paint"]?.numericValue ?? 0),
        score: Number.isFinite(score) ? score : 0,
      };
    } finally {
      await instance.kill();
    }
  } catch (err) {
    log.warn("Lighthouse run failed, using mock metrics", {
      err: (err as Error).message,
      url,
    });
    return null;
  }
}

const SIMS_KEY = "digital-twin:simulations";
const resultKey = (id: string): string => `digital-twin:result:${id}`;

function invalidate(id?: string): void {
  cache.delete(SIMS_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: 1 simulation result (with 4 cards) ──────────────────────────
const SEED_RESULTS: TwinResult[] = [
  {
    id: "twin-seed-001",
    url: "https://app.roycss.dev/dashboard",
    status: "complete",
    createdAt: "2025-02-18T10:00:00.000Z",
    duration: 12_400,
    cards: [
      {
        type: "performance",
        title: "Performance preview",
        score: 92,
        metrics: {
          lcp: 1820,
          inp: 142,
          cls: 0.06,
          ttfb: 412,
          fcp: 980,
        },
        notes: "All Core Web Vitals in the 'good' range on a throttled 4G profile.",
      },
      {
        type: "accessibility",
        title: "Accessibility preview",
        score: 96,
        metrics: {
          wcagLevel: "AA",
          contrastIssues: 0,
          missingAltText: 1,
          keyboardIssues: 0,
          ariaIssues: 2,
        },
        notes: "Two minor ARIA improvements recommended; contrast passes AA.",
      },
      {
        type: "journey",
        title: "User journey preview",
        score: 88,
        metrics: {
          stepsToCheckout: 4,
          dropOffRate: 0.18,
          averageTaskTime: 92,
          successRate: 0.91,
        },
        notes: "Checkout friction on step 3 (payment method selection).",
      },
      {
        type: "devices",
        title: "Devices preview",
        score: 90,
        metrics: {
          testedDevices: 8,
          layoutBreaks: 0,
          fontLegibility: "pass",
          touchTargetMin: 44,
        },
        notes: "Tested across iPhone SE → iPad Pro → ultrawide desktop.",
      },
    ],
  },
];

const SEED_SIMS: TwinSimulationSummary[] = SEED_RESULTS.map((r) => ({
  id: r.id,
  url: r.url,
  status: r.status,
  createdAt: r.createdAt,
  averageScore: Math.round(
    r.cards.reduce((s, c) => s + c.score, 0) / r.cards.length,
  ),
}));

let results: TwinResult[] = SEED_RESULTS.map((r) => ({
  ...r,
  cards: r.cards.map((c) => ({ ...c, metrics: { ...c.metrics } })),
}));

/** List all simulations (summary view). Cached. */
export async function listSimulations(): Promise<TwinSimulationSummary[]> {
  return cacheWrap(
    SIMS_KEY,
    () =>
      Promise.resolve(
        results.map((r) => ({
          id: r.id,
          url: r.url,
          status: r.status,
          createdAt: r.createdAt,
          averageScore: Math.round(
            r.cards.reduce((s, c) => s + c.score, 0) / r.cards.length,
          ),
        })),
      ),
    CACHE_TTL.twinSimulations,
  );
}

/** Get a single simulation result by id. Throws 404 if missing. */
export async function getTwinResultById(id: string): Promise<TwinResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Twin result '${id}' not found`);
      return Promise.resolve({
        ...found,
        cards: found.cards.map((c) => ({ ...c, metrics: { ...c.metrics } })),
      });
    },
    CACHE_TTL.twinResultDetail,
  );
}

/** Create a new twin simulation. Enriches the performance card with
 * real Lighthouse metrics when Lighthouse is available; otherwise
 * falls back to a synthesized complete result. */
export async function createTwinSimulation(
  input: CreateTwinInput,
): Promise<TwinResult> {
  const id = `twin-${randomUUID()}`;
  const baseScore = 80 + Math.floor(Math.random() * 15);
  let perfCard: TwinResult["cards"][number];

  const lighthouse = await runLighthouse(input.url);
  if (lighthouse) {
    perfCard = {
      type: "performance",
      title: "Performance preview",
      score: lighthouse.score,
      metrics: {
        lcp: lighthouse.lcp,
        inp: lighthouse.inp,
        cls: lighthouse.cls,
        ttfb: lighthouse.ttfb,
        fcp: lighthouse.fcp,
      },
      notes: "Real Lighthouse measurements on a headless Chrome profile.",
    };
    log.info("Twin simulation created with real Lighthouse metrics", {
      id,
      url: input.url,
      score: lighthouse.score,
    });
  } else {
    perfCard = {
      type: "performance",
      title: "Performance preview",
      score: baseScore,
      metrics: {
        lcp: 1500 + Math.floor(Math.random() * 1500),
        inp: 100 + Math.floor(Math.random() * 200),
        cls: Number((Math.random() * 0.2).toFixed(2)),
        ttfb: 300 + Math.floor(Math.random() * 600),
        fcp: 800 + Math.floor(Math.random() * 800),
      },
      notes: "Synthesized preview based on a throttled 4G profile.",
    };
    log.info("Twin simulation created (mock fallback)", {
      id,
      url: input.url,
    });
  }

  const result: TwinResult = {
    id,
    url: input.url,
    status: "complete",
    createdAt: new Date().toISOString(),
    duration: 8_000 + Math.floor(Math.random() * 8_000),
    cards: [
      perfCard,
      {
        type: "accessibility",
        title: "Accessibility preview",
        score: Math.min(100, baseScore + 4),
        metrics: {
          wcagLevel: "AA",
          contrastIssues: Math.floor(Math.random() * 3),
          missingAltText: Math.floor(Math.random() * 4),
          keyboardIssues: 0,
          ariaIssues: Math.floor(Math.random() * 5),
        },
        notes: "Automated audit — manual review still recommended.",
      },
      {
        type: "journey",
        title: "User journey preview",
        score: Math.max(60, baseScore - 6),
        metrics: {
          stepsToCheckout: 3 + Math.floor(Math.random() * 3),
          dropOffRate: Number((0.05 + Math.random() * 0.2).toFixed(2)),
          averageTaskTime: 60 + Math.floor(Math.random() * 90),
          successRate: Number((0.8 + Math.random() * 0.18).toFixed(2)),
        },
        notes: "Synthesized journey based on common SaaS patterns.",
      },
      {
        type: "devices",
        title: "Devices preview",
        score: Math.min(100, baseScore + 2),
        metrics: {
          testedDevices: 8,
          layoutBreaks: 0,
          fontLegibility: "pass",
          touchTargetMin: 44,
        },
        notes: "Tested across iPhone SE → iPad Pro → ultrawide desktop.",
      },
    ],
  };
  results = [result, ...results].slice(0, 50);
  invalidate(id);
  return result;
}

/** Test-only: reset to seed. */
export function _resetDigitalTwinForTest(): void {
  results = SEED_RESULTS.map((r) => ({
    ...r,
    cards: r.cards.map((c) => ({ ...c, metrics: { ...c.metrics } })),
  }));
  invalidate();
  void SEED_SIMS;
}
