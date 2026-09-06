/**
 * Rate limiting behind a swappable interface (PF-009 / issue #94 A5).
 *
 * ─── Interface ────────────────────────────────────────────────────────
 * `RateLimiter` abstracts the counter store so the in-memory default
 * can be swapped for Redis (PF-003 / PF-008) without touching any call
 * site: middleware reads `consume()` and sets the same headers either
 * way. A Redis adapter implements the same two methods.
 *
 * ─── Implementation ───────────────────────────────────────────────────
 * Why sliding window (not fixed window):
 *   A fixed-window limiter allows 2× the limit at window boundaries
 *   (e.g. 5 requests at 0:59 and 5 more at 1:00 = 10 requests in one
 *   second). The sliding-window approach records the timestamp of
 *   every request and counts only those within the last `windowMs`,
 *   which gives accurate limiting at any moment.
 *
 * Why in-memory (not Redis):
 *   No external dependency for dev. Each backend process keeps its
 *   own counters — fine for a single-instance backend. For
 *   multi-instance prod, call `setRateLimiter(tier, adapter)` with a
 *   Redis-backed `RateLimiter`; the public API stays the same.
 *
 * ─── Tiers ────────────────────────────────────────────────────────────
 * Per-route tiers: `general | auth | contact | ai | search`, each with
 * its own window/limit and its own limiter instance:
 *   general — every request (global, mounted in app.ts)
 *   auth    — credential endpoints (register/login/refresh/api-keys)
 *   contact — contact form submissions
 *   ai      — LLM-backed generation endpoints
 *   search  — search query endpoints
 *
 * Keying:
 *   - Defaults to `req.ip` (client IP).
 *   - Override with a custom key function (e.g. to key by user id when
 *     authenticated) by passing `keyFn`.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { RATE_LIMIT } from "../../config/constants.js";
import { AppError } from "./error.js";

// ─── Interface (swappable for Redis in PF-003 / PF-008) ───────────────────

export interface RateLimitResult {
  /** Whether the request is inside the limit. */
  allowed: boolean;
  /** Configured max requests per window. */
  limit: number;
  /** Requests remaining in the window (>= 0). */
  remaining: number;
  /** Epoch ms when the window fully resets. */
  resetAt: number;
  /** Seconds until retry is possible (set when !allowed). */
  retryAfterSec: number;
}

/**
 * A rate limiter store. The default is in-process; PF-003/PF-008 will
 * provide a Redis-backed implementation with the exact same shape.
 */
export interface RateLimiter {
  /** Tier name this limiter serves (for logging/diagnostics). */
  readonly tier: RateLimitTier;
  /** Record a hit for `key` and report the verdict. */
  consume(key: string): Promise<RateLimitResult>;
  /** Drop counters for `key` (or the whole tier when omitted). */
  reset(key?: string): void;
}

export type RateLimitTier = "general" | "auth" | "contact" | "ai" | "search";

export interface RateLimitOptions {
  /** Window size in ms. Default: RATE_LIMIT.windowMs */
  windowMs?: number;
  /** Max requests per window. */
  max: number;
  /** Custom key function. Default: req.ip */
  keyFn?: (req: Request) => string;
  /** Message returned when limit is exceeded. */
  message?: string;
  /** Optional tier tag — useful for logging + tier registry. */
  scope?: string;
}

// ─── In-memory sliding-window implementation (default) ────────────────────

interface Bucket {
  /** Sorted (ascending) timestamps of requests within the window. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

/** Sweep buckets whose only entries are stale, to keep memory bounded. */
function sweepStaleBuckets(now: number, windowMs: number): void {
  if (buckets.size < 500) return;
  const cutoff = now - windowMs;
  for (const [key, bucket] of buckets) {
    const fresh = bucket.hits.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      bucket.hits = fresh;
    }
  }
}

/**
 * In-memory sliding-window limiter. One instance per (tier) — buckets
 * are keyed `<tier>:<key>` so tiers never share counters.
 */
export class InMemoryRateLimiter implements RateLimiter {
  readonly tier: RateLimitTier;
  private readonly windowMs: number;
  private readonly max: number;

  constructor(tier: RateLimitTier, options: { windowMs?: number; max: number }) {
    this.tier = tier;
    this.windowMs = options.windowMs ?? RATE_LIMIT.windowMs;
    this.max = options.max;
  }

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const bucketKey = `${this.tier}:${key}`;

    // Cheap periodic GC to keep memory bounded under high cardinality.
    if (buckets.size > 5000) {
      sweepStaleBuckets(now, this.windowMs);
    }

    let bucket = buckets.get(bucketKey);
    if (!bucket) {
      bucket = { hits: [] };
      buckets.set(bucketKey, bucket);
    }

    // Drop stale hits — keeps the array small and the count accurate.
    bucket.hits = bucket.hits.filter((t) => t > cutoff);

    const remaining = Math.max(0, this.max - bucket.hits.length);
    const result: RateLimitResult = {
      allowed: bucket.hits.length < this.max,
      limit: this.max,
      // Pre-hit remaining — matches the historical header values
      // (first request in a fresh bucket reports `max` remaining).
      remaining,
      resetAt: now + this.windowMs,
      retryAfterSec: Math.ceil(this.windowMs / 1000),
    };

    if (result.allowed) {
      bucket.hits.push(now);
    }
    return result;
  }

  reset(key?: string): void {
    if (key === undefined) {
      for (const [k, bucket] of buckets) {
        if (k.startsWith(`${this.tier}:`)) buckets.delete(k);
      }
      return;
    }
    buckets.delete(`${this.tier}:${key}`);
  }
}

// ─── Tier registry ────────────────────────────────────────────────────────

const TIER_DEFAULTS: Record<
  RateLimitTier,
  { max: number; windowMs?: number; message: string }
> = {
  general: {
    max: RATE_LIMIT.general,
    message: "Too many requests. Please slow down.",
  },
  auth: {
    max: RATE_LIMIT.auth,
    message: "Too many authentication attempts. Please try again later.",
  },
  contact: {
    max: RATE_LIMIT.contact,
    message: "Too many contact submissions. Please try again later.",
  },
  ai: {
    max: RATE_LIMIT.ai,
    message: "Too many AI generation requests. Please try again later.",
  },
  search: {
    max: RATE_LIMIT.search,
    message: "Too many search requests. Please slow down.",
  },
};

/** Active limiter per tier. Defaults are in-memory sliding windows. */
const tierLimiters = new Map<RateLimitTier, RateLimiter>(
  (Object.keys(TIER_DEFAULTS) as RateLimitTier[]).map((tier) => [
    tier,
    new InMemoryRateLimiter(tier, TIER_DEFAULTS[tier]),
  ]),
);

/**
 * Swap the limiter for a tier (e.g. install a Redis-backed adapter in
 * PF-003 / PF-008). Existing middleware call sites keep working — they
 * look the tier up on every request.
 */
export function setRateLimiter(tier: RateLimitTier, limiter: RateLimiter): void {
  tierLimiters.set(tier, limiter);
}

/** The limiter currently serving a tier. */
export function getRateLimiter(tier: RateLimitTier): RateLimiter {
  const limiter = tierLimiters.get(tier);
  if (!limiter) {
    throw new Error(`No rate limiter registered for tier '${tier}'`);
  }
  return limiter;
}

/** All tiers with a registered limiter (diagnostics/tests). */
export function rateLimitTiers(): RateLimitTier[] {
  return [...tierLimiters.keys()];
}

/** Test-only: restore the in-memory default for every tier. */
export function _resetRateLimitersForTest(): void {
  for (const tier of Object.keys(TIER_DEFAULTS) as RateLimitTier[]) {
    tierLimiters.set(tier, new InMemoryRateLimiter(tier, TIER_DEFAULTS[tier]));
  }
}

// ─── Express middleware ───────────────────────────────────────────────────

/**
 * Build rate-limit middleware bound to a limiter instance. Callers may
 * pass a tier (uses the tier registry — swap-aware) or an ad-hoc
 * options object (creates its own limiter).
 */
export function rateLimit(options: RateLimitOptions): RequestHandler;

export function rateLimit(tier: RateLimitTier): RequestHandler;

export function rateLimit(
  optionsOrTier: RateLimitOptions | RateLimitTier,
): RequestHandler {
  const isTier = typeof optionsOrTier === "string";
  const options = isTier
    ? TIER_DEFAULTS[optionsOrTier]
    : (optionsOrTier as RateLimitOptions);
  const tier: RateLimitTier = isTier
    ? (optionsOrTier as RateLimitTier)
    : ((optionsOrTier as RateLimitOptions).scope as RateLimitTier | undefined) ??
      "general";
  const scope = isTier ? tier : ((options as RateLimitOptions).scope ?? "default");
  const keyFn =
    (options as RateLimitOptions).keyFn ?? ((req) => req.ip ?? "anonymous");
  const message = (options as RateLimitOptions).message ?? options.message;

  const limiter = isTier ? getRateLimiter(tier) : undefined;
  // Ad-hoc options get a private limiter; tier calls resolve the tier
  // limiter per request so `setRateLimiter` swaps take effect immediately.
  const adHoc = !isTier
    ? new InMemoryRateLimiter(tier, {
        windowMs: (options as RateLimitOptions).windowMs,
        max: (options as RateLimitOptions).max,
      })
    : null;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyFn(req);
    const active = limiter ?? adHoc ?? getRateLimiter(tier);
    void active
      .consume(key)
      .then((result) => {
        // Always attach rate-limit headers so clients can back off gracefully.
        res.setHeader("X-RateLimit-Limit", String(result.limit));
        res.setHeader("X-RateLimit-Remaining", String(result.remaining));
        res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

        if (!result.allowed) {
          res.setHeader("Retry-After", String(result.retryAfterSec));
          next(
            AppError.rateLimited(message, {
              scope,
              windowMs: result.resetAt - Date.now(),
              max: result.limit,
              retryAfter: result.retryAfterSec,
            }),
          );
          return;
        }
        next();
      })
      .catch(next);
  };
}

// ─── Pre-configured middleware for the five tiers ─────────────────────────
// Call sites are UNCHANGED: the existing named exports keep their exact
// behavior; they now route through the tier registry so a Redis adapter
// installed via setRateLimiter("auth", …) takes effect everywhere at once.

/** general — global limiter mounted in app.ts (100/min/IP default). */
export const generalRateLimit = rateLimit("general");

/** auth — credential endpoints (10/min/IP default). */
export const authRateLimit = rateLimit("auth");

/** contact — contact form submissions (5/min/IP default). */
export const contactRateLimit = rateLimit("contact");

/** ai — LLM-backed generation endpoints (20/min/IP default). */
export const aiRateLimit = rateLimit("ai");

/** search — search query endpoints (60/min/IP default). */
export const searchRateLimit = rateLimit("search");
