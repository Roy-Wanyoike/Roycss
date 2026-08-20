import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const VERSION = "2.1.0";

interface ServiceStatus {
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  error?: string;
}

async function ping(url: string, timeoutMs = 3000): Promise<ServiceStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const latencyMs = Date.now() - start;
    if (res.ok) return { status: "ok", latencyMs };
    return { status: "degraded", latencyMs, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      status: "down",
      error: e instanceof Error ? e.message : "fetch failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET /api/health — overall platform health.
 *
 * - dbStatus: ok (local SQLite always available)
 * - backendStatus: ping http://localhost:4000/api/v1/health
 * - liveServiceStatus: ping http://localhost:3003/health
 * - effectsCount: 1,749 (hardcoded for now — matches source-of-truth)
 *
 * Cache: 10s (short — we want fresh-but-bounded checks).
 */
export async function GET() {
  const [backend, live] = await Promise.all([
    ping("http://localhost:4000/api/v1/health"),
    ping("http://localhost:3003/health"),
  ]);

  const allOk = backend.status === "ok" && live.status === "ok";
  const anyDown = backend.status === "down" || live.status === "down";
  const overall = allOk ? "ok" : anyDown ? "down" : "degraded";

  return NextResponse.json(
    {
      status: overall,
      effectsCount: 1749,
      dbStatus: "ok",
      backendStatus: backend,
      liveServiceStatus: live,
      timestamp: new Date().toISOString(),
      version: VERSION,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=10, s-maxage=10",
        "X-Version": VERSION,
      },
    },
  );
}
