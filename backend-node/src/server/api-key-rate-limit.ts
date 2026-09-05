/**
 * Per-API-key rate limiting (issue #65 / PF-002).
 *
 * Applied whenever a request authenticates via `X-API-Key` — one bucket
 * per key id, IN ADDITION to the global per-IP limiters. Bearer-JWT
 * requests are not affected.
 *
 * Design — pluggable, not a hard dependency:
 *   - `RateLimitTier`          : a plain `{ limit, windowMs }` value.
 *   - `ApiKeyRateLimiter`      : the limiter interface (one method,
 *                                `consume(keyId, tier)` → decision).
 *   - `InMemoryApiKeyRateLimiter` : the dependency-free default — a
 *     sliding-window Map keyed by key id, same algorithm as
 *     `server/middleware/rateLimit.ts`.
 *   - `setApiKeyRateLimiter()` : process-wide injection seam, so tests
 *     can swap in a stub and a future deployment can swap in Redis
 *     without touching call sites.
 *
 * The default tier comes from env (120 req/min/key). Route middleware may
 * pass a custom tier (e.g. a stricter tier for expensive endpoints).
 */
import type { Response } from "express";

import { API_KEY_RATE_LIMIT } from "../config/constants.js";
import { AppError } from "./middleware/error.js";

// ─── Tier + limiter interfaces ────────────────────────────────────────────

/** A rate-limit quota: `limit` requests per `windowMs` milliseconds. */
export interface RateLimitTier {
  limit: number;
  windowMs: number;
}

/** The decision returned by a limiter for one consumed request. */
export interface ApiKeyRateLimitDecision {
  allowed: boolean;
  /** Max requests per window (echoed for response headers). */
  limit: number;
  /** Requests remaining in the current window AFTER this one. */
  remaining: number;
  /** Seconds until the caller may retry (only meaningful when blocked). */
  retryAfterSec: number;
}

/**
 * A per-key rate limiter. Implementations must be synchronous (or
 * internally non-blocking) — the express hook runs inline in the request
 * path and must never await external I/O.
 */
export interface ApiKeyRateLimiter {
  consume(keyId: string, tier: RateLimitTier): ApiKeyRateLimitDecision;
  /** Optional: forget a key's bucket (used by tests / key revocation). */
  reset?(keyId: string): void;
}

// ─── In-memory sliding-window implementation (default) ───────────────────

/**
 * Sliding-window in-memory limiter keyed by API key id.
 *
 * Records the timestamp of every request and counts only those within the
 * last `windowMs` — accurate at window boundaries (a fixed window would
 * allow 2× the limit at the seam). Mirrors the approach and GC strategy
 * of `server/middleware/rateLimit.ts` so the two limiters behave alike.
 */
export class InMemoryApiKeyRateLimiter implements ApiKeyRateLimiter {
  private readonly hits = new Map<string, number[]>();
  /** Buckets above this count are swept opportunistically. */
  private readonly sweepThreshold: number;

  constructor(sweepThreshold = 5_000) {
    this.sweepThreshold = sweepThreshold;
  }

  consume(keyId: string, tier: RateLimitTier): ApiKeyRateLimitDecision {
    const now = Date.now();
    const cutoff = now - tier.windowMs;

    // Cheap periodic GC to keep memory bounded under key churn.
    if (this.hits.size > this.sweepThreshold) {
      this.sweep(now);
    }

    const fresh = (this.hits.get(keyId) ?? []).filter((t) => t > cutoff);
    const allowed = fresh.length < tier.limit;
    if (allowed) {
      fresh.push(now);
    }
    if (fresh.length > 0) {
      this.hits.set(keyId, fresh);
    } else {
      this.hits.delete(keyId);
    }

    return {
      allowed,
      limit: tier.limit,
      remaining: Math.max(0, tier.limit - fresh.length),
      // Worst case wait = a full window; rounded up to whole seconds.
      retryAfterSec: Math.max(1, Math.ceil(tier.windowMs / 1000)),
    };
  }

  reset(keyId: string): void {
    this.hits.delete(keyId);
  }

  /** Drop buckets with no hits inside the window. */
  private sweep(now: number): void {
    // A bucket with zero entries never survives consume(), so sweeping
    // the oldest cutoff (largest windowMs we ever see, 60 s default) is
    // enough to reclaim memory from stale keys.
    const cutoff = now - 60_000;
    for (const [keyId, timestamps] of this.hits) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) this.hits.delete(keyId);
      else this.hits.set(keyId, fresh);
    }
  }
}

// ─── Process-wide default instance + injection seam ───────────────────────

let activeLimiter: ApiKeyRateLimiter = new InMemoryApiKeyRateLimiter();

/** Swap the process-wide limiter (tests, Redis-backed implementation). */
export function setApiKeyRateLimiter(limiter: ApiKeyRateLimiter): void {
  activeLimiter = limiter;
}

/** The active process-wide limiter. */
export function getApiKeyRateLimiter(): ApiKeyRateLimiter {
  return activeLimiter;
}

/** Default tier from env — 120 requests / minute / key. */
export const DEFAULT_API_KEY_TIER: RateLimitTier = {
  limit: API_KEY_RATE_LIMIT.max,
  windowMs: API_KEY_RATE_LIMIT.windowMs,
};

// ─── Express hook ─────────────────────────────────────────────────────────

/**
 * Consume one request of `keyId`'s quota and, when the quota is exceeded,
 * set the standard rate-limit response headers and throw a 429 AppError
 * (the centralized errorHandler turns it into the JSON error envelope).
 *
 * Always attaches X-RateLimit-* headers so well-behaved clients can back
 * off before hitting the 429.
 */
export function enforceApiKeyRateLimit(
  res: Response,
  keyId: string,
  tier: RateLimitTier = DEFAULT_API_KEY_TIER,
): void {
  const decision = getApiKeyRateLimiter().consume(keyId, tier);
  res.setHeader("X-RateLimit-Limit", String(decision.limit));
  res.setHeader("X-RateLimit-Remaining", String(decision.remaining));
  if (!decision.allowed) {
    res.setHeader("Retry-After", String(decision.retryAfterSec));
    throw AppError.rateLimited(
      "API key rate limit exceeded — slow down or use a Bearer token for high-volume access.",
      {
        limit: decision.limit,
        windowMs: tier.windowMs,
        retryAfterSec: decision.retryAfterSec,
      },
    );
  }
}
