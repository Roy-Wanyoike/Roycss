import { NextResponse } from "next/server";

import { resolveApiModeInfo, type ApiModeInfo, type BackendProbe } from "@/lib/api-mode";
import { effectsCount } from "@/lib/embedded-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — honest platform health (issue #83, PF-012 F16).
 *
 * - `apiMode`: the RESOLVED API mode ("embedded" | "proxy") — what
 *   /api/v1/* is actually serving with right now.
 * - `backendStatus`: real backend reachability (shared 60 s-cached probe —
 *   see src/lib/api-mode.ts), or "not configured" when standalone.
 * - `effectsCount`: sourced from the actual embedded catalog — never a
 *   hardcoded number.
 * - `status`: "ok" when the site can serve its full public API surface
 *   (embedded standalone or healthy proxy); "degraded" when a configured
 *   backend is down.
 */
export async function GET() {
  const info = await resolveApiModeInfo();

  const backendStatus = backendStatusFor(info);

  // Embedded standalone (no BACKEND_URL) is fully functional → "ok".
  // Embedded with a configured-but-down backend is honest about it → "degraded".
  // Proxy mode is only healthy when the backend actually answers.
  const degraded =
    info.mode === "proxy"
      ? !info.probe?.reachable
      : Boolean(info.backendUrl && info.probe && !info.probe.reachable);

  return NextResponse.json(
    {
      status: degraded ? "degraded" : "ok",
      apiMode: info.mode,
      effectsCount: effectsCount(),
      // Embedded mode has no database in the request path at all.
      dbStatus: info.mode === "proxy" ? (info.probe?.reachable ? "ok" : "down") : "n/a",
      backendStatus,
      timestamp: new Date().toISOString(),
      version: "2.1.0",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function backendStatusFor(info: ApiModeInfo): { status: string; error?: string } {
  const probe: BackendProbe | null = info.probe;
  if (probe?.reachable) return { status: "ok" };
  if (probe) return { status: "down", error: probe.error ?? "unreachable" };
  return {
    status: "down",
    error: "BACKEND_URL not configured — serving embedded API",
  };
}
