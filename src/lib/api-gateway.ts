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
 *
 * Session auth (issue #122 / PRD-F21): the browser keeps its JWTs in
 * httpOnly cookies (src/lib/auth-client.ts), so browser requests arrive
 * with a Cookie header but no Authorization header. On the proxy path the
 * access cookie is promoted to `Authorization: Bearer …` — see
 * src/lib/session-bearer.ts — so authenticated backend endpoints
 * (/auth/api-keys, …) work through this one seam. An explicit
 * Authorization header always wins and is forwarded verbatim (CLI/SDK
 * callers keep full control); a cookie-derived 401 gets exactly ONE
 * refresh+retry, the same policy as /api/auth/me.
 */

import { NextRequest, NextResponse } from "next/server";

import { API_PROBE_HEADER, getProxyTargetUrl, resolveApiMode } from "./api-mode";
import { handleEmbeddedApi, type EmbeddedApiResponse } from "./embedded-api";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "./auth-client";
import { accessCookieValue, refreshCookieValue } from "./session-bearer";

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

/** Cookie lifetimes, mirroring the /api/auth/* proxy routes. */
const ACCESS_COOKIE_MAX_AGE = 60 * 15; // 15 minutes
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** A rotated token pair returned by the backend /auth/refresh endpoint. */
interface RefreshedSession {
  accessToken: string;
  refreshToken: string | null;
}

/**
 * Redeem the refresh cookie for a fresh access token (ONE attempt).
 * Returns null on any failure — the caller then surfaces the original 401.
 */
async function refreshSession(
  backendUrl: string,
  cookieHeader: string | null,
): Promise<RefreshedSession | null> {
  const refreshToken = refreshCookieValue(cookieHeader);
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as
      | { data?: { accessToken?: unknown; refreshToken?: unknown } }
      | null;
    const accessToken = json?.data?.accessToken;
    if (typeof accessToken !== "string" || accessToken.length === 0) return null;
    const rotated = json?.data?.refreshToken;
    return {
      accessToken,
      refreshToken: typeof rotated === "string" && rotated.length > 0 ? rotated : null,
    };
  } catch {
    return null;
  }
}

/** Stamp rotated session cookies onto a proxied response. */
function setRotatedCookies(
  response: NextResponse,
  session: RefreshedSession,
): void {
  response.cookies.set(ACCESS_COOKIE, session.accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  if (session.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
}

/**
 * Copy a backend fetch Response into a NextResponse (content-type +
 * cache-control passthrough).
 */
async function toProxyResponse(backendRes: Response): Promise<NextResponse> {
  const contentType = backendRes.headers.get("content-type") || "application/json";
  const body = backendRes.body === null ? null : await backendRes.text();
  return new NextResponse(body, {
    status: backendRes.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": backendRes.headers.get("cache-control") || "no-store",
    },
  });
}

/**
 * Forward a request verbatim to the Express backend — the pre-embedded-mode
 * behavior, preserved for proxy mode (API_MODE=proxy, or auto with a
 * reachable BACKEND_URL).
 *
 * When the caller sent no Authorization header, the httpOnly access cookie
 * is promoted to one (src/lib/session-bearer.ts) so browser sessions work
 * on authenticated backend endpoints. A 401 for such a promoted token gets
 * ONE refresh+retry with rotated cookies set on the final response.
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
    const cookie = req.headers.get("cookie");
    // Session promotion — only when the caller sent no Authorization header
    // of its own; an explicit header always wins and is forwarded verbatim.
    const sessionToken = authHeader ? null : accessCookieValue(cookie);
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }
    if (cookie) headers["Cookie"] = cookie;

    const fetchOptions: RequestInit = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      // Read ONCE into a string so a refresh-retry can re-send it.
      fetchOptions.body = await req.text();
    }

    let backendRes = await fetch(targetUrl, fetchOptions);

    // One refresh+retry when a cookie-derived token was rejected (expired
    // access token) — mirrors /api/auth/me. Explicit Authorization headers
    // are never refreshed here: their 401 belongs to the caller.
    if (backendRes.status === 401 && sessionToken !== null) {
      // Release the rejected response before any retry attempt.
      if (backendRes.body) await backendRes.body.cancel().catch(() => undefined);
      const refreshed = await refreshSession(backendUrl, cookie);
      if (refreshed) {
        headers["Authorization"] = `Bearer ${refreshed.accessToken}`;
        backendRes = await fetch(targetUrl, fetchOptions);
        const response = await toProxyResponse(backendRes);
        setRotatedCookies(response, refreshed);
        return response;
      }
    }

    return await toProxyResponse(backendRes);
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "Backend service is not running." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
