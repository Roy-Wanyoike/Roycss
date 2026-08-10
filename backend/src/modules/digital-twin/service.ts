/**
 * Digital Twin service — Roy Digital Twin (site simulation).
 *
 * Mock backend (no DB). Seeds 1 simulation result with 4 cards:
 * performance, accessibility, journey, and devices. Create requests
 * synthesize a new result keyed on the requested URL.
 *
 * Reads are LRU-cached; new simulations invalidate the results list.
 *
 * Future: persist via Prisma `TwinResult` model and stream live
 * measurements from a headless browser farm.
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

/** Create a new twin simulation. Returns a synthetic complete result. */
export async function createTwinSimulation(
  input: CreateTwinInput,
): Promise<TwinResult> {
  const id = `twin-${randomUUID()}`;
  const baseScore = 80 + Math.floor(Math.random() * 15);
  const result: TwinResult = {
    id,
    url: input.url,
    status: "complete",
    createdAt: new Date().toISOString(),
    duration: 8_000 + Math.floor(Math.random() * 8_000),
    cards: [
      {
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
      },
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
  log.info("Twin simulation created", { id, url: input.url });
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
