/**
 * Profiler service — Prisma-backed Roy Profiler (runtime performance
 * tracing).
 *
 * Persisted via the Prisma `ProfilerResult` model. Seeds 1 profiling
 * result with 5 render phases, CLS entries, memory samples, and FPS
 * data on first access. Profiler metrics remain a static in-memory
 * seed (no Prisma model). Starting a new session persists a new row.
 *
 * Field-mapping: the Prisma `ProfilerResult` model exposes (userId,
 * url, metricsJson). The domain shape's `url` maps directly; the
 * extra fields (id, status, duration, samples, startedAt,
 * finishedAt, renderPhases, clsEntries, memory, fps, longTasks,
 * interactionLatency, summary) are JSON-encoded inside `metricsJson`
 * as a wrapper.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  ProfilerMetric,
  ProfilerResult,
  ProfilerRenderPhase,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { StartProfilingInput } from "./schema.js";

const log = createLogger("profiler");

const RESULTS_KEY = "profiler:results";
const METRICS_KEY = "profiler:metrics";
const resultKey = (id: string): string => `profiler:result:${id}`;

function invalidateResults(id?: string): void {
  cache.delete(RESULTS_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: profiler metrics (static — no Prisma model) ──────────────────
const SEED_METRICS: ProfilerMetric[] = [
  { id: "m-render", name: "Render phases", unit: "ms", category: "render" },
  { id: "m-cls", name: "Layout shift", unit: "score", category: "layout" },
  { id: "m-memory", name: "JS heap", unit: "MB", category: "memory" },
  { id: "m-fps", name: "Frames per second", unit: "fps", category: "paint" },
  { id: "m-longtask", name: "Long tasks", unit: "count", category: "main-thread" },
  { id: "m-interaction", name: "Interaction latency", unit: "ms", category: "interaction" },
];

// ─── Seed: 1 profiling result ───────────────────────────────────────────
const SEED_RESULTS: ProfilerResult[] = [
  {
    id: "prof-seed-001",
    url: "https://app.roycss.dev/dashboard",
    status: "complete",
    duration: 4280,
    samples: 128,
    startedAt: "2025-02-18T09:30:00.000Z",
    finishedAt: "2025-02-18T09:30:04.280Z",
    renderPhases: [
      { name: "Initial render", duration: 84, componentCount: 42 },
      { name: "Hydration", duration: 156, componentCount: 42 },
      { name: "First paint", duration: 92, componentCount: 42 },
      { name: "Layout", duration: 38, componentCount: 42 },
      { name: "Paint", duration: 47, componentCount: 42 },
    ] satisfies ProfilerRenderPhase[],
    clsEntries: [
      { element: ".hero-banner", score: 0.18, time: 1240 },
      { element: ".data-grid", score: 0.04, time: 2310 },
      { element: ".side-panel", score: 0.02, time: 3120 },
    ],
    memory: [
      { ts: 0, used: 24, total: 64 },
      { ts: 1000, used: 38, total: 64 },
      { ts: 2000, used: 52, total: 96 },
      { ts: 3000, used: 49, total: 96 },
      { ts: 4000, used: 51, total: 96 },
    ],
    fps: [
      { ts: 0, fps: 60 },
      { ts: 500, fps: 58 },
      { ts: 1000, fps: 54 },
      { ts: 1500, fps: 60 },
      { ts: 2000, fps: 41 },
      { ts: 2500, fps: 60 },
      { ts: 3000, fps: 59 },
      { ts: 3500, fps: 60 },
      { ts: 4000, fps: 60 },
    ],
    longTasks: 3,
    interactionLatency: { p50: 92, p75: 184, p99: 412 },
    summary: {
      clsScore: 0.24,
      averageFps: 56.8,
      peakMemoryMb: 52,
      jankRatio: 0.12,
    },
  },
];

/** Wrapper persisted in `metricsJson`. */
interface ProfilerWrapper {
  status: ProfilerResult["status"];
  duration: number;
  samples: number;
  startedAt: string;
  finishedAt: string;
  renderPhases: ProfilerResult["renderPhases"];
  clsEntries: ProfilerResult["clsEntries"];
  memory: ProfilerResult["memory"];
  fps: ProfilerResult["fps"];
  longTasks: number;
  interactionLatency: ProfilerResult["interactionLatency"];
  summary: ProfilerResult["summary"];
}

function toDbRow(r: ProfilerResult) {
  const wrapper: ProfilerWrapper = {
    status: r.status,
    duration: r.duration,
    samples: r.samples,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    renderPhases: r.renderPhases,
    clsEntries: r.clsEntries,
    memory: r.memory,
    fps: r.fps,
    longTasks: r.longTasks,
    interactionLatency: r.interactionLatency,
    summary: r.summary,
  };
  return {
    id: r.id,
    userId: null,
    url: r.url,
    metricsJson: JSON.stringify(wrapper),
  };
}

function toDomain(row: {
  id: string;
  url: string;
  metricsJson: string;
  createdAt: Date;
}): ProfilerResult {
  let wrapper: ProfilerWrapper;
  try {
    wrapper = JSON.parse(row.metricsJson) as ProfilerWrapper;
  } catch {
    wrapper = {
      status: "complete",
      duration: 0,
      samples: 0,
      startedAt: row.createdAt.toISOString(),
      finishedAt: row.createdAt.toISOString(),
      renderPhases: [],
      clsEntries: [],
      memory: [],
      fps: [],
      longTasks: 0,
      interactionLatency: { p50: 0, p75: 0, p99: 0 },
      summary: { clsScore: 0, averageFps: 0, peakMemoryMb: 0, jankRatio: 0 },
    };
  }
  return {
    id: row.id,
    url: row.url,
    status: wrapper.status,
    duration: wrapper.duration,
    samples: wrapper.samples,
    startedAt: wrapper.startedAt,
    finishedAt: wrapper.finishedAt,
    renderPhases: wrapper.renderPhases,
    clsEntries: wrapper.clsEntries,
    memory: wrapper.memory,
    fps: wrapper.fps,
    longTasks: wrapper.longTasks,
    interactionLatency: wrapper.interactionLatency,
    summary: wrapper.summary,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.profilerResult.count();
    if (count === 0) {
      await db.profilerResult.createMany({
        data: SEED_RESULTS.map(toDbRow),
      });
      log.info("Profiler results seeded", { count: SEED_RESULTS.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List profiler metrics. Cached. */
export async function listProfilerMetrics(): Promise<ProfilerMetric[]> {
  return cacheWrap(
    METRICS_KEY,
    () => Promise.resolve(SEED_METRICS.map((m) => ({ ...m }))),
    CACHE_TTL.profilerMetrics,
  );
}

/** List all profiling results. Cached. */
export async function listProfilerResults(): Promise<ProfilerResult[]> {
  return cacheWrap(
    RESULTS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.profilerResult.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(toDomain);
    },
    CACHE_TTL.profilerResults,
  );
}

/** Get a single profiling result by id. Throws 404 if missing. */
export async function getProfilerResultById(
  id: string,
): Promise<ProfilerResult> {
  return cacheWrap(
    resultKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.profilerResult.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Profiler result '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.profilerResultDetail,
  );
}

/** Start a new profiling session. Returns a synthetic complete result. */
export async function startProfiling(
  input: StartProfilingInput,
): Promise<ProfilerResult> {
  await seedIfEmpty();
  const id = `prof-${randomUUID()}`;
  const now = Date.now();
  const duration = 3500 + Math.floor(Math.random() * 1500);
  const result: ProfilerResult = {
    id,
    url: input.url,
    status: "complete",
    duration,
    samples: 100 + Math.floor(Math.random() * 60),
    startedAt: new Date(now).toISOString(),
    finishedAt: new Date(now + duration).toISOString(),
    renderPhases: [
      { name: "Initial render", duration: 60 + Math.floor(Math.random() * 40), componentCount: 42 },
      { name: "Hydration", duration: 120 + Math.floor(Math.random() * 80), componentCount: 42 },
      { name: "First paint", duration: 70 + Math.floor(Math.random() * 50), componentCount: 42 },
      { name: "Layout", duration: 20 + Math.floor(Math.random() * 30), componentCount: 42 },
      { name: "Paint", duration: 30 + Math.floor(Math.random() * 40), componentCount: 42 },
    ],
    clsEntries: [
      { element: ".hero-banner", score: 0.12, time: 980 },
      { element: ".data-grid", score: 0.03, time: 2100 },
      { element: ".side-panel", score: 0.01, time: 2800 },
    ],
    memory: [
      { ts: 0, used: 22, total: 64 },
      { ts: 1000, used: 36, total: 64 },
      { ts: 2000, used: 48, total: 96 },
      { ts: 3000, used: 46, total: 96 },
    ],
    fps: [
      { ts: 0, fps: 60 },
      { ts: 500, fps: 59 },
      { ts: 1000, fps: 55 },
      { ts: 1500, fps: 60 },
      { ts: 2000, fps: 48 },
      { ts: 2500, fps: 60 },
      { ts: 3000, fps: 58 },
    ],
    longTasks: 1 + Math.floor(Math.random() * 5),
    interactionLatency: {
      p50: 80 + Math.floor(Math.random() * 30),
      p75: 150 + Math.floor(Math.random() * 60),
      p99: 380 + Math.floor(Math.random() * 80),
    },
    summary: {
      clsScore: 0.16,
      averageFps: 57.1,
      peakMemoryMb: 48,
      jankRatio: 0.08,
    },
  };
  await db.profilerResult.create({ data: toDbRow(result) });
  invalidateResults(id);
  log.info("Profiler started", { id, url: input.url });
  return result;
}

/** Test-only: reset to seed. */
export function _resetProfilerForTest(): void {
  seedPromise = null;
  invalidateResults();
  cache.delete(METRICS_KEY);
}
