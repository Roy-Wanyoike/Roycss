/**
 * Sliding-window in-memory rate limiter.
 *
 * Why sliding window (not fixed window):
 *   A fixed-window limiter allows 2× the limit at window boundaries
 *   (e.g. 5 requests at 0:59 and 5 more at 1:00 = 10 requests in one
 *   second). The sliding-window approach records the timestamp of
 *   every request and counts only those within the last `windowMs`,
 *   which gives accurate limiting at any moment.
 *
 * Why in-memory (not Redis):
 *   No external dependency for dev. Each backend process keeps its
 *   own counter — for a single-instance backend this is fine. For
 *   multi-instance prod, swap the `Bucket` interface for a Redis-
 *   backed implementation; the public API stays the same.
 *
 * Keying:
 *   - Defaults to `req.ip` (client IP).
 *   - Override with a custom key function (e.g. to key by user id when
 *     authenticated) by passing `keyFn`.
 */
import type { NextFunction, Request, Response } from "express";

import { RATE_LIMIT } from "../../config/constants.js";
import { AppError } from "./error.js";

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

export interface RateLimitOptions {
  /** Window size in ms. Default: RATE_LIMIT.windowMs */
  windowMs?: number;
  /** Max requests per window. */
  max: number;
  /** Custom key function. Default: req.ip */
  keyFn?: (req: Request) => string;
  /** Message returned when limit is exceeded. */
  message?: string;
  /** Optional scope tag — useful for logging. */
  scope?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const windowMs = options.windowMs ?? RATE_LIMIT.windowMs;
  const max = options.max;
  const keyFn = options.keyFn ?? ((req) => req.ip ?? "anonymous");
  const message = options.message ?? "Too many requests, please try again later.";
  const scope = options.scope ?? "default";

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const cutoff = now - windowMs;

    // Cheap periodic GC to keep memory bounded under high cardinality.
    if (buckets.size > 5000) {
      sweepStaleBuckets(now, windowMs);
    }

    const key = `${scope}:${keyFn(req)}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { hits: [] };
      buckets.set(key, bucket);
    }

    // Drop stale hits — keeps the array small and the count accurate.
    bucket.hits = bucket.hits.filter((t) => t > cutoff);

    const remaining = Math.max(0, max - bucket.hits.length);
    const retryAfterSec = Math.ceil(windowMs / 1000);

    // Always attach rate-limit headers so clients can back off gracefully.
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil((now + windowMs) / 1000)));

    if (bucket.hits.length >= max) {
      res.setHeader("Retry-After", String(retryAfterSec));
      next(
        AppError.rateLimited(message, {
          scope,
          windowMs,
          max,
          retryAfter: retryAfterSec,
        }),
      );
      return;
    }

    bucket.hits.push(now);
    next();
  };
}

/** Pre-configured limiter instances for common scopes. */
export const generalRateLimit = rateLimit({
  max: RATE_LIMIT.general,
  scope: "general",
  message: "Too many requests. Please slow down.",
});

export const authRateLimit = rateLimit({
  max: RATE_LIMIT.auth,
  scope: "auth",
  message: "Too many authentication attempts. Please try again later.",
});

export const contactRateLimit = rateLimit({
  max: RATE_LIMIT.contact,
  scope: "contact",
  message: "Too many contact submissions. Please try again later.",
});
