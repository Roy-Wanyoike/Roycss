/**
 * Unit tests — per-API-key rate limiting (issue #65 / PF-002).
 *
 * Covers the pluggable limiter from src/server/api-key-rate-limit.ts:
 *   - InMemoryApiKeyRateLimiter sliding-window semantics (limit, reset,
 *     window expiry, per-key isolation)
 *   - The RateLimitTier interface (custom tiers)
 *   - The setApiKeyRateLimiter/getApiKeyRateLimiter injection seam
 *     (pluggable, not a hard dependency)
 *   - enforceApiKeyRateLimit: 429 AppError + Retry-After header
 *
 * Fake timers control Date.now() so window behaviour is deterministic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_API_KEY_TIER,
  InMemoryApiKeyRateLimiter,
  enforceApiKeyRateLimit,
  getApiKeyRateLimiter,
  setApiKeyRateLimiter,
  type ApiKeyRateLimiter,
  type RateLimitTier,
} from "../../src/server/api-key-rate-limit.js";
import { AppError } from "../../src/server/middleware/error.js";

const TIER: RateLimitTier = { limit: 2, windowMs: 1_000 };

/** A response double that records setHeader calls. */
function fakeRes(): { res: never; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
  };
  return { res: res as never, headers };
}

describe("InMemoryApiKeyRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to `limit` requests per window then blocks", () => {
    const limiter = new InMemoryApiKeyRateLimiter();
    const first = limiter.consume("key-1", TIER);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    const second = limiter.consume("key-1", TIER);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const third = limiter.consume("key-1", TIER);
    expect(third.allowed).toBe(false);
    expect(third.limit).toBe(2);
    expect(third.retryAfterSec).toBe(1); // ceil(1000ms / 1000)
  });

  it("frees the window as time slides (sliding window, not fixed)", () => {
    const limiter = new InMemoryApiKeyRateLimiter();
    limiter.consume("key-1", TIER);
    limiter.consume("key-1", TIER);
    expect(limiter.consume("key-1", TIER).allowed).toBe(false);

    // Advance past the window — the first two hits fall out.
    vi.advanceTimersByTime(1_001);
    const after = limiter.consume("key-1", TIER);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(1);
  });

  it("buckets are isolated per key id", () => {
    const limiter = new InMemoryApiKeyRateLimiter();
    limiter.consume("key-a", TIER);
    limiter.consume("key-a", TIER);
    const other = limiter.consume("key-b", TIER);
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(1);
    expect(limiter.consume("key-a", TIER).allowed).toBe(false);
  });

  it("reset() forgets a key's bucket", () => {
    const limiter = new InMemoryApiKeyRateLimiter();
    limiter.consume("key-1", TIER);
    limiter.consume("key-1", TIER);
    limiter.reset("key-1");
    expect(limiter.consume("key-1", TIER).allowed).toBe(true);
  });

  it("accepts arbitrary custom tiers (pluggable RateLimitTier)", () => {
    const limiter = new InMemoryApiKeyRateLimiter();
    const strict: RateLimitTier = { limit: 1, windowMs: 60_000 };
    expect(limiter.consume("k", strict).allowed).toBe(true);
    const blocked = limiter.consume("k", strict);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(60); // ceil(60s)
  });
});

describe("limiter injection seam", () => {
  it("setApiKeyRateLimiter swaps the active limiter; round-trips back", () => {
    const original = getApiKeyRateLimiter();
    const custom: ApiKeyRateLimiter = {
      consume: (keyId, tier) => ({
        allowed: false,
        limit: tier.limit,
        remaining: 0,
        retryAfterSec: 42,
      }),
    };
    try {
      setApiKeyRateLimiter(custom);
      expect(getApiKeyRateLimiter()).toBe(custom);
      const decision = getApiKeyRateLimiter().consume("k", TIER);
      expect(decision.allowed).toBe(false);
      expect(decision.retryAfterSec).toBe(42);
    } finally {
      setApiKeyRateLimiter(original);
    }
    expect(getApiKeyRateLimiter()).toBe(original);
  });

  it("default tier comes from env defaults (120/min)", () => {
    expect(DEFAULT_API_KEY_TIER).toEqual({ limit: 120, windowMs: 60_000 });
  });
});

describe("enforceApiKeyRateLimit", () => {
  it("passes within budget and sets X-RateLimit-* headers", () => {
    const { res, headers } = fakeRes();
    expect(() => enforceApiKeyRateLimit(res, "key-ok", TIER)).not.toThrow();
    expect(headers["X-RateLimit-Limit"]).toBe("2");
    expect(headers["X-RateLimit-Remaining"]).toBe("1");
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("throws a 429 AppError and sets Retry-After when the budget is spent", () => {
    const { res, headers } = fakeRes();
    enforceApiKeyRateLimit(res, "key-blocked", TIER); // 1st
    enforceApiKeyRateLimit(res, "key-blocked", TIER); // 2nd
    try {
      enforceApiKeyRateLimit(res, "key-blocked", TIER); // 3rd — over
      expect.unreachable("expected a 429 AppError");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(429);
      expect(appErr.code).toBe("RATE_LIMITED");
      // No key material may leak into the error details.
      expect(JSON.stringify(appErr.details ?? {})).not.toContain("key-blocked");
    }
    expect(headers["Retry-After"]).toBe("1");
  });
});
