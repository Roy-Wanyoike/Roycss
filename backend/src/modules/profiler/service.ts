/**
 * Profiler service — Roy Profiler (runtime performance tracing).
 *
 * Mock backend (no DB). Seeds 1 profiling result with 5 render phases,
 * CLS entries, memory samples, and FPS data. Starting a new session
 * returns a synthetic result keyed on the requested URL.
 *
 * Reads are LRU-cached; new sessions invalidate the results list.
 *
 * Future: persist via Prisma `ProfilerResult` model and stream live
 * samples over a WebSocket from a browser agent.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

// ─── Seed: profiler metrics ─────────────────────────────────────────────
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

let results: ProfilerResult[] = SEED_RESULTS.map((r) => ({ ...r }));
const metrics: ProfilerMetric[] = SEED_METRICS.map((m) => ({ ...m }));

/** List profiler metrics. Cached. */
export async function listProfilerMetrics(): Promise<ProfilerMetric[]> {
  return cacheWrap(
    METRICS_KEY,
    () => Promise.resolve(metrics.map((m) => ({ ...m }))),
    CACHE_TTL.profilerMetrics,
  );
}

/** List all profiling results. Cached. */
export async function listProfilerResults(): Promise<ProfilerResult[]> {
  return cacheWrap(
    RESULTS_KEY,
    () => Promise.resolve(results.map((r) => ({ ...r }))),
    CACHE_TTL.profilerResults,
  );
}

/** Get a single profiling result by id. Throws 404 if missing. */
export async function getProfilerResultById(
  id: string,
): Promise<ProfilerResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Profiler result '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.profilerResultDetail,
  );
}

/** Start a new profiling session. Returns a synthetic complete result. */
export async function startProfiling(
  input: StartProfilingInput,
): Promise<ProfilerResult> {
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
  results = [result, ...results].slice(0, 50);
  invalidateResults(id);
  log.info("Profiler started", { id, url: input.url });
  return result;
}

/** Test-only: reset to seed. */
export function _resetProfilerForTest(): void {
  results = SEED_RESULTS.map((r) => ({ ...r }));
  invalidateResults();
  cache.delete(METRICS_KEY);
}
