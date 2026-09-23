/**
 * Bounded server-side fetch for every Next.js → backend-node proxy hop
 * (issue #245).
 *
 * The browser-side auth wrapper (src/lib/auth-request.ts, issue #163) caps
 * the CLIENT's wait at ~15 s, but the server-side proxy routes under
 * `src/app/api/auth/*` and the `/api/v1/*` gateway (src/lib/api-gateway.ts)
 * called plain `fetch` — a backend that accepts the TCP connection and
 * then never answers (hung socket, stalled process, half-open LB) would
 * hang the route handler indefinitely, pinning the server function.
 *
 * `backendFetch` mirrors the repo's established deadline pattern
 * (AbortSignal.timeout in the api-mode reachability probe, src/lib/api-mode.ts)
 * with the same ceiling the client already assumes (#163: 15 s). A deadline
 * abort rejects fetch with a `TimeoutError`, which route catch-blocks map to
 * a clean 503 JSON in each route's OWN envelope:
 *
 *   - /api/auth/*   → `{ error: string }` (the shape auth-context.tsx and the
 *                     login sheet already parse and display)
 *   - /api/v1/*     → `{ error: { code: "BACKEND_UNAVAILABLE", message } }`
 *                     (the gateway's existing catch envelope)
 *
 * Network-refused failures (ECONNREFUSED) keep their existing handling —
 * they already fail fast; only the HANG is new behavior.
 */

/**
 * Hard ceiling for one proxied backend call — matches the browser-side
 * AUTH_REQUEST_TIMEOUT_MS in src/lib/auth-request.ts (issue #163: ~15 s).
 */
export const BACKEND_FETCH_TIMEOUT_MS = 15_000;

/** User-facing message for the 503 the auth proxy routes return on timeout. */
export const BACKEND_TIMEOUT_MESSAGE =
  "The service is temporarily unavailable — please try again shortly.";

/**
 * fetch with a hard server-side deadline. `init` passes through unchanged
 * (cache: "no-store", method, headers, body, …) with only the signal
 * defaulted — no caller currently supplies its own signal.
 */
export function backendFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS),
  });
}

/**
 * True when a thrown value is the deadline abort from `AbortSignal.timeout`
 * (fetch rejects with a DOMException named "TimeoutError"; DOMException
 * extends Error on every supported runtime).
 */
export function isBackendTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.name === "TimeoutError";
}

/** The clean 503 the auth proxy routes return when the backend times out. */
export function backendTimeoutResponse(): Response {
  return Response.json({ error: BACKEND_TIMEOUT_MESSAGE }, { status: 503 });
}
