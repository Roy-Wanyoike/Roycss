/**
 * Rate limiting + CSRF origin verification for Next.js API routes (#159).
 *
 * ─── What this module provides ──────────────────────────────────────
 * `checkRateLimit`  — in-memory sliding-window limiter, one bucket per
 *                     `route:ip` pair. Mirrors the semantics of the
 *                     backend-node limiter (backend-node/src/server/
 *                     middleware/rateLimit.ts): pre-hit `remaining`,
 *                     denied requests are NOT recorded, capacity
 *                     returns as old hits slide out of the window.
 * `verifyOrigin`    — strict same-origin check for state-changing
 *                     requests (browsers always attach Origin to
 *                     non-GET/HEAD requests; a missing or mismatched
 *                     Origin therefore fails CLOSED — see #159).
 * `getClientIP`     — best-effort client IP from proxy headers.
 * `guardApiWrite`   — one-call wiring for write routes: origin
 *                     verification (403) then rate limit (429), with
 *                     generic JSON error bodies + X-Request-Id.
 *
 * ─── Store: in-memory now, Redis later ──────────────────────────────
 * The in-memory store matches the existing helper this module extends
 * and is correct for single-instance deploys (Vercel lambdas are
 * per-instance — acceptable for the tiers in use). To go multi-instance,
 * replace the `rateLimitStore` Map with a Redis-backed sliding window;
 * the established precedent is backend-node/src/server/rate-limit-redis.ts
 * (atomic Lua ZSET sliding window + in-memory fallback behind a
 * `setRateLimiter`-style seam). Because every route goes through
 * `guardApiWrite`, that swap touches THIS FILE ONLY — no route changes.
 */

// ─── Sliding-window rate limiter ───────────────────────────────────────────

interface SlidingWindowBucket {
  /** Timestamps (epoch ms) of recorded hits, ascending. */
  hits: number[];
}

const rateLimitStore = new Map<string, SlidingWindowBucket>();

/** Default window for write tiers (1 minute, matching backend tiers). */
const DEFAULT_WINDOW_MS = 60_000;

/**
 * Per-IP write tiers for the Next.js routes (#159). Mirrors the
 * backend-node defaults (RATE_LIMIT_MAX_CONTACT=5, RATE_LIMIT_MAX_AI=20,
 * window 60s) so both layers enforce the same numbers.
 */
export const API_RATE_TIERS = {
  /** Anonymous contact-form submissions. */
  contact: { limit: 5, windowMs: DEFAULT_WINDOW_MS },
  /** Paid-LLM routes (ai-playground, ai-migration, css-doctor). */
  ai: { limit: 20, windowMs: DEFAULT_WINDOW_MS },
} as const;

/** Buckets above this size trigger a stale-entry sweep (memory bound). */
const SWEEP_THRESHOLD = 5_000;

/** Idle buckets are dropped by the periodic sweeper after this long. */
const SWEEP_MAX_BUCKET_AGE_MS = 5 * 60_000;

/**
 * Drop hits that slid out of the window and delete fully-stale buckets.
 * Cheap GC to keep memory bounded under high IP cardinality.
 */
function sweepStaleBuckets(now: number, windowMs: number): void {
  const cutoff = now - Math.max(windowMs, SWEEP_MAX_BUCKET_AGE_MS);
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.hits.length === 0 || bucket.hits[bucket.hits.length - 1]! <= cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

// Periodic GC (kept from the original helper — the size-based sweep in
// checkRateLimit only runs under load).
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    sweepStaleBuckets(Date.now(), SWEEP_MAX_BUCKET_AGE_MS);
  }, 60_000).unref?.();
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Requests remaining in the window (pre-hit convention; 0 when denied). */
  remaining: number;
  /** Epoch ms when the current window fully resets. */
  resetAt: number;
  /** Seconds until retry is possible (safe upper bound; set when denied). */
  retryAfterSec: number;
}

/**
 * Record a hit for `identifier` and return the sliding-window verdict.
 *
 * Semantics (same as backend-node/src/server/middleware/rateLimit.ts):
 * a fixed window allows 2× the limit at boundaries, so hits are stored
 * as timestamps and only those inside `windowMs` count. Denied requests
 * are NOT recorded — hammering a 429 never extends the lockout.
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitVerdict {
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = rateLimitStore.get(identifier);
  if (!bucket) {
    bucket = { hits: [] };
    rateLimitStore.set(identifier, bucket);
  }
  if (bucket.hits.length > 0 && bucket.hits[0]! <= cutoff) {
    bucket.hits = bucket.hits.filter((t) => t > cutoff);
  }
  if (rateLimitStore.size > SWEEP_THRESHOLD) {
    sweepStaleBuckets(now, windowMs);
  }

  const allowed = bucket.hits.length < limit;
  if (allowed) bucket.hits.push(now);

  return {
    allowed,
    remaining: allowed
      ? Math.max(0, limit - bucket.hits.length)
      : 0,
    // Same convention as the backend limiter: window end relative to the
    // verdict time (a safe upper bound for clients).
    resetAt: now + windowMs,
    retryAfterSec: Math.ceil(windowMs / 1000),
  };
}

/** Test-only: clear every bucket (production code must never call this). */
export function _resetRateLimitStoreForTest(): void {
  rateLimitStore.clear();
}

// ─── Client IP ─────────────────────────────────────────────────────────────

/**
 * Best-effort client IP from proxy headers.
 *
 * `x-vercel-forwarded-for` first (Vercel's edge overwrites it — a client
 * cannot spoof it there), then the standard `x-forwarded-for` leftmost
 * entry, then `x-real-ip`. Self-hosted deployments MUST sanitize these
 * headers at the reverse proxy, otherwise clients can rotate spoofed
 * IPs to sidestep per-IP limits (same trust model as the backend).
 * When nothing is present the bucket falls back to one shared "unknown"
 * key — fail-closed: header-less clients are throttled together rather
 * than let through unthrottled.
 */
export function getClientIP(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// ─── Origin verification (CSRF defense-in-depth) ───────────────────────────

/**
 * Strict same-origin check for state-changing requests (#159).
 *
 * Browsers attach an `Origin` header to every non-GET/HEAD request, so
 * a missing Origin means a non-browser client — which the issue
 * explicitly fails closed (403) alongside cross-origin mismatches.
 * GET/HEAD are exempt (not state-changing); the routes only call this
 * from write handlers, and `guardApiWrite` re-checks the method.
 *
 * The expected origin is derived from `x-forwarded-host` (set by the
 * Vercel edge / reverse proxies) falling back to `Host`, with both
 * schemes allowed. Returns false — never throws — on any missing input.
 *
 * NOTE: this is defense-in-depth for browser CSRF, not authentication;
 * a non-browser client can forge Origin/Host freely. Rate limiting is
 * the abuse boundary; this only closes the cross-site browser vector.
 */
export function verifyOrigin(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return true; // exempt

  const origin = req.headers.get("origin");
  if (!origin) return false; // fail-closed on missing Origin (writes)

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = (forwardedHost ? forwardedHost.split(",")[0]!.trim() : null) ?? req.headers.get("host");
  if (!host) return false;

  const normalized = host.toLowerCase();
  return (
    origin.toLowerCase() === `http://${normalized}` ||
    origin.toLowerCase() === `https://${normalized}`
  );
}

// ─── Write-route guard (origin → rate limit) ───────────────────────────────

/** Short request id, mirroring src/lib/embedded-api.ts / backend format. */
function generateRequestId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(16).slice(2, 10)
  ).slice(0, 16);
}

export interface ApiWriteGuardConfig {
  /** Bucket namespace + log tag, e.g. "contact" or "ai-playground". */
  route: string;
  /** Max requests per IP inside `windowMs` (see API_RATE_TIERS). */
  limit: number;
  /** Window size in ms. Default: 60_000. */
  windowMs?: number;
}

/**
 * Wire one guard call at the top of a write route handler (#159):
 *
 *   const denied = guardApiWrite(req, { route: "contact", ...API_RATE_TIERS.contact });
 *   if (denied) return denied;
 *
 * Order matters: origin is verified BEFORE the rate limit so that
 * rejected cross-origin requests never consume (or exhaust) a bucket,
 * and per-IP 429s always reflect same-origin traffic.
 *
 * Failure policy (#159): fail-closed on both axes. Origin mismatch or
 * missing Origin on a write → 403; over-tier → 429 with Retry-After.
 * A limiter-internal error (not expected with the in-memory store) is
 * logged and denies with 503 rather than silently allowing. Responses
 * are generic — no store internals, no echo of the rejected origin —
 * and carry `requestId` (+ X-Request-Id header) for log correlation.
 * GET/HEAD never reach this via the routes' own handlers, and the
 * origin check inside exempts them regardless.
 *
 * Returns null when the request may proceed; otherwise the Response the
 * route must return.
 */
export function guardApiWrite(
  req: Request,
  config: ApiWriteGuardConfig,
): Response | null {
  const requestId = generateRequestId();
  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;

  // 1) Origin verification — fail-closed 403 for state-changing methods.
  if (!verifyOrigin(req)) {
    console.warn(
      `[api-security] blocked write (origin mismatch/missing): route=${config.route} method=${req.method} ip=${getClientIP(req)} requestId=${requestId}`,
    );
    return jsonResponse(403, "Request origin is not allowed.", requestId);
  }

  // 2) Rate limit — fail-closed 429 over tier, keyed per route + IP.
  const ip = getClientIP(req);
  try {
    const verdict = checkRateLimit(`${config.route}:${ip}`, config.limit, windowMs);
    if (!verdict.allowed) {
      console.warn(
        `[api-security] rate limited: route=${config.route} ip=${ip} requestId=${requestId}`,
      );
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Too many requests. Please try again later.",
          requestId,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(verdict.retryAfterSec),
            ...rateLimitHeaders(verdict.remaining, verdict.resetAt),
            "X-Request-Id": requestId,
          },
        },
      );
    }
    return null;
  } catch (err) {
    // The in-memory limiter cannot realistically throw; if a future Redis
    // adapter does, deny (fail-closed) instead of allowing the write.
    console.error(
      `[api-security] rate limiter failure — denying request: route=${config.route} ip=${ip} requestId=${requestId}`,
      err,
    );
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unable to process the request right now. Please try again later.",
        requestId,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-Request-Id": requestId,
        },
      },
    );
  }
}

/** Generic JSON error body shared by guard denials. */
function jsonResponse(status: 403, error: string, requestId: string): Response {
  return new Response(JSON.stringify({ ok: false, error, requestId }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
    },
  });
}

/**
 * Rate limit headers for the response.
 */
export function rateLimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
  };
}
