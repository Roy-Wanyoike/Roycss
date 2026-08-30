/**
 * apiClient — centralized fetch wrapper for backend (Express + Prisma)
 * API calls routed through the Caddy gateway.
 *
 * Why centralized?
 *   - One place to enforce the gateway convention (`?XTransformPort=4000`)
 *   - One place to normalize the `{ error: { message } }` error envelope
 *     returned by all 68 backend modules (see backend/src/server/middleware/error.ts)
 *   - One place to apply a request timeout + cancellation (AbortController)
 *   - One place to emit dev-only request logs (console.debug in dev)
 *
 * URL contract:
 *   - If `path` starts with "http" (absolute URL), it is used verbatim.
 *   - Otherwise the path is treated as a backend route segment and is
 *     prefixed with `/api/v1/` and routed to the backend via the gateway
 *     query param `?XTransformPort=4000` (Caddy rewrites this to
 *     http://localhost:4000/api/v1/<path>).
 *
 * Frontend proxy routes (`/api/auth/*`, `/api/health`, `/api/contact`,
 * `/api/ai-playground`, `/api/css-doctor`, `/api/ai-migration`) are a
 * SEPARATE abstraction — they target Next.js API routes on port 3000
 * (which handle httpOnly cookies, the z-ai-web-dev-sdk, etc.) and must
 * NOT be routed through this client. They are intentionally left as
 * direct `fetch` calls. See `docs/PERFORMANCE-AUDIT.md`.
 *
 * Error envelope:
 *   Backend modules return `{ error: { message: string } }` on non-2xx.
 *   This client unwraps `message` into `ApiResult.error` so callers get
 *   a plain string regardless of the response shape.
 *
 * Success envelope:
 *   Backend modules return `{ data: T }` on 2xx (or a bare value for
 *   legacy routes). This client unwraps `data` into `ApiResult.data`,
 *   falling back to the whole body if `data` is absent.
 */

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const IS_DEV = process.env.NODE_ENV !== "production";

export async function apiClient<T>(
  path: string,
  options?: RequestInit & { timeout?: number },
): Promise<ApiResult<T>> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const method = (fetchOptions.method ?? "GET").toUpperCase();
  const url = path.startsWith("http")
    ? path
    : `/api/v1/${path}?XTransformPort=4000`;

  if (IS_DEV) {
    console.debug("[apiClient] →", method, url);
  }

  const started = IS_DEV ? performance.now() : 0;

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    // `res.json()` returns `Promise<any>`; `res.text()` returns `Promise<string>`.
    // The union collapses to `any`, so `body?.error?.message` / `body?.data` type-check.
    const body = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        isJson && body?.error?.message
          ? body.error.message
          : typeof body === "string" && body
            ? body
            : `HTTP ${res.status}`;
      if (IS_DEV) {
        console.debug(
          `[apiClient] ← ${res.status} ${method} ${url} (${Math.round(performance.now() - started)}ms)`,
        );
      }
      return { data: null, error: message, status: res.status };
    }

    if (IS_DEV) {
      console.debug(
        `[apiClient] ← ${res.status} ${method} ${url} (${Math.round(performance.now() - started)}ms)`,
      );
    }
    return { data: (body?.data ?? body) as T, error: null, status: res.status };
  } catch (err) {
    // AbortError fires when the AbortController's timeout fires OR when a
    // caller manually aborts via the supplied signal. Normalize both to a
    // human-readable message so callers don't have to instanceof-check.
    const isAbort =
      err instanceof DOMException && err.name === "AbortError";
    const message = isAbort
      ? `Request timed out after ${timeout}ms`
      : err instanceof Error
        ? err.message
        : "Network error";
    if (IS_DEV) {
      console.debug(
        `[apiClient] ✖ ${method} ${url} — ${message} (${Math.round(performance.now() - started)}ms)`,
      );
    }
    return { data: null, error: message, status: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
}
