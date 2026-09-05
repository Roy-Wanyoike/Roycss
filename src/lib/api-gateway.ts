/**
 * API gateway — mode-aware dispatch for every `/api/v1*` request.
 *
 * Strategy (issue #83):
 *   1. Probe short-circuit — requests carrying the auto-mode probe header
 *      are answered from the embedded health handler immediately (loop
 *      guard for a BACKEND_URL that points back at this site).
 *   2. `resolveApiMode()` decides "embedded" vs "proxy"
 *      (API_MODE=auto|embedded|proxy — see src/lib/api-mode.ts).
 *   3. Embedded → `handleEmbeddedApi()` answers from the embedded catalog
 *      with the exact API.md envelope. Proxy → forwarded verbatim to
 *      BACKEND_URL (self-hosted deployments keep the full backend).
 *
 * Used by:
 *   - src/app/api/v1/[...path]/route.ts  (everything under /api/v1/*)
 *   - src/app/api/v1/route.ts            (the /api/v1 index endpoint)
 */

import { NextRequest, NextResponse } from "next/server";

import { API_PROBE_HEADER, getProxyTargetUrl, resolveApiMode } from "./api-mode";
import { handleEmbeddedApi, type EmbeddedApiResponse } from "./embedded-api";

export interface GatewayOptions {
  /** true for the bare `/api/v1` index route (no sub-path). */
  root?: boolean;
}

export async function handleApiGateway(
  req: NextRequest,
  options: GatewayOptions = {},
): Promise<NextResponse> {
  // ── 1. Probe short-circuit (loop guard) ────────────────────────────────
  // This request is our own reachability probe looping back (BACKEND_URL
  // pointing at this site). Answering from the embedded health handler —
  // whose `service: "roycss-embedded-api"` marker makes the probing side
  // treat it as "not a backend" — avoids resolving the mode here, which
  // would start another probe and recurse.
  if (req.headers.get(API_PROBE_HEADER)) {
    return toNextResponse(
      handleEmbeddedApi({
        method: "GET",
        path: "/health",
        search: new URL(req.url).searchParams,
      }),
    );
  }

  // ── 2. Resolve the mode ────────────────────────────────────────────────
  const mode = await resolveApiMode();

  // ── 3a. Embedded: answer from the catalog ─────────────────────────────
  if (mode === "embedded") {
    const url = new URL(req.url);
    const path = options.root ? "" : url.pathname.replace(/^\/api\/v1/, "");
    return toNextResponse(
      handleEmbeddedApi({ method: req.method, path, search: url.searchParams }),
    );
  }

  // ── 3b. Proxy: forward to the backend, unchanged ──────────────────────
  return proxyToBackend(req, options);
}

function toNextResponse(res: EmbeddedApiResponse): NextResponse {
  if (res.status === 204 || res.body === null || res.body === undefined) {
    return new NextResponse(null, { status: res.status, headers: res.headers });
  }
  return NextResponse.json(res.body, { status: res.status, headers: res.headers });
}

/**
 * Forward a request verbatim to the Express backend — the pre-embedded-mode
 * behavior, preserved for proxy mode (API_MODE=proxy, or auto with a
 * reachable BACKEND_URL).
 */
async function proxyToBackend(
  req: NextRequest,
  options: GatewayOptions,
): Promise<NextResponse> {
  const url = new URL(req.url);
  const path = options.root ? "" : url.pathname.replace(/^\/api\/v1/, "");
  const backendUrl = getProxyTargetUrl();

  if (!backendUrl) {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "Backend service is not running." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const targetUrl = `${backendUrl}/api/v1${path}${url.search}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
      Accept: req.headers.get("accept") || "application/json",
    };
    const authHeader = req.headers.get("authorization");
    if (authHeader) headers["Authorization"] = authHeader;
    const cookie = req.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const fetchOptions: RequestInit = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.text();
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    const contentType = backendRes.headers.get("content-type") || "application/json";
    const body = await backendRes.text();

    return new NextResponse(body, {
      status: backendRes.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": backendRes.headers.get("cache-control") || "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "Backend service is not running." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
