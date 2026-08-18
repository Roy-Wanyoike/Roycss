import { NextResponse } from "next/server";

/**
 * Health check endpoint.
 *
 * Aggregates liveness of the core dependencies of the RoyCSS stack:
 *  - The effect library count (statically known).
 *  - The SQLite database (always `ok` in dev — `db` from `@/lib/db`
 *    is a Prisma client that connects lazily and only on first query;
 *    we treat it as healthy until a query actually fails).
 *  - The Express backend on port 4000 (the 68-module dev tooling API).
 *  - The Socket.io Live service on port 3003 (Roy Live).
 *
 * The aggregate `status` is `ok` only when every sub-service reports
 * `ok`; it degrades to `degraded` (never `down`) as long as the core
 * Next.js process can answer the request.
 *
 * Cached for 10 seconds in-memory and via `Cache-Control: max-age=10`
 * to avoid hammering the downstream services on every request.
 */
export const runtime = "nodejs";
// Always render fresh — but the in-memory cache below handles
// de-duplication across concurrent requests within 10s.
export const dynamic = "force-dynamic";

const VERSION = "1.0.0";
const EFFECTS_COUNT = 1749;
const CACHE_TTL_MS = 10_000;
const PING_TIMEOUT_MS = 2000;

const BACKEND_HEALTH_URL = "http://localhost:4000/api/v1/health";
const LIVE_HEALTH_URL = "http://localhost:3003/health";

type HealthStatus = "ok" | "degraded" | "down";

interface HealthResponse {
  status: HealthStatus;
  effectsCount: number;
  dbStatus: HealthStatus;
  backendStatus: HealthStatus;
  liveServiceStatus: HealthStatus;
  timestamp: string;
  version: string;
}

let cache: { at: number; payload: HealthResponse } | null = null;

async function ping(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        cache: "no-store",
      });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

async function checkBackend(): Promise<HealthStatus> {
  const ok = await ping(BACKEND_HEALTH_URL);
  return ok ? "ok" : "degraded";
}

async function checkLive(): Promise<HealthStatus> {
  const ok = await ping(LIVE_HEALTH_URL);
  return ok ? "ok" : "degraded";
}

function aggregate(parts: HealthStatus[]): HealthStatus {
  if (parts.every((p) => p === "ok")) return "ok";
  if (parts.some((p) => p === "down")) return "down";
  return "degraded";
}

export async function GET() {
  // Short-circuit from the in-memory cache when available.
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=10",
        "X-RoyCSS-Health": "cached",
      },
    });
  }

  const [backendStatus, liveServiceStatus] = await Promise.all([
    checkBackend(),
    checkLive(),
  ]);

  // SQLite in dev: Prisma connects lazily; we report `ok` until a real
  // query actually fails. (See `src/lib/db.ts`.)
  const dbStatus: HealthStatus = "ok";

  const status = aggregate([dbStatus, backendStatus, liveServiceStatus]);

  const payload: HealthResponse = {
    status,
    effectsCount: EFFECTS_COUNT,
    dbStatus,
    backendStatus,
    liveServiceStatus,
    timestamp: new Date().toISOString(),
    version: VERSION,
  };

  cache = { at: Date.now(), payload };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=10",
      "X-RoyCSS-Health": "fresh",
    },
  });
}
