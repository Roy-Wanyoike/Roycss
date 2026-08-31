import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

async function ping(url: string, timeoutMs = 5000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (res.ok) return { status: "ok" as const };
    return { status: "down" as const, error: `HTTP ${res.status}` };
  } catch (err) {
    return { status: "down" as const, error: err instanceof Error ? err.message : "fetch failed" };
  }
}

export async function GET() {
  const backend = await ping(`${BACKEND_URL}/api/v1/health`);
  const dbStatus = backend.status === "ok" ? "ok" : "down";

  return NextResponse.json(
    {
      status: dbStatus === "ok" ? "ok" : "degraded",
      effectsCount: 1959,
      dbStatus,
      backendStatus: backend,
      timestamp: new Date().toISOString(),
      version: "2.1.0",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
