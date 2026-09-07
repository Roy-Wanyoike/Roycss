/**
 * Unit tests — RateLimiter interface + in-memory sliding window
 * (PF-009 / issue #94 A5).
 *
 *   1. Sliding window: max within window, 429 semantics after
 *   2. Window slides — stale hits expire (fake clock)
 *   3. reset() drops counters
 *   4. Tier registry: all five tiers registered; setRateLimiter swaps
 *      the implementation (the PF-003 Redis hook) without call-site
 *      changes; _reset restores the in-memory default
 *   5. Tier middleware: headers + 429 envelope through the Express
 *      wrapper
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

import { errorHandler } from "../../src/server/middleware/error.js";
import {
  InMemoryRateLimiter,
  _resetRateLimitersForTest,
  getRateLimiter,
  rateLimit,
  rateLimitTiers,
  setRateLimiter,
  type RateLimiter,
} from "../../src/server/middleware/rateLimit.js";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
  _resetRateLimitersForTest();
});

afterEach(() => {
  vi.useRealTimers();
  _resetRateLimitersForTest();
});

describe("InMemoryRateLimiter sliding window (issue #94 A5)", () => {
  it("1. allows up to max per window, then denies", async () => {
    const limiter = new InMemoryRateLimiter("general", { max: 3, windowMs: 60_000 });
    const verdicts: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      verdicts.push((await limiter.consume("ip-1")).allowed);
    }
    expect(verdicts).toEqual([true, true, true, false, false]);

    const denied = await limiter.consume("ip-1");
    expect(denied.limit).toBe(3);
    expect(denied.remaining).toBe(0);
    expect(denied.retryAfterSec).toBe(60);
  });

  it("2. window slides — stale hits expire and counting resumes", async () => {
    const limiter = new InMemoryRateLimiter("auth", { max: 2, windowMs: 10_000 });
    await limiter.consume("ip-2");
    await limiter.consume("ip-2");
    expect((await limiter.consume("ip-2")).allowed).toBe(false);

    // Advance past the window: every recorded hit is now stale.
    vi.advanceTimersByTime(10_001);
    expect((await limiter.consume("ip-2")).allowed).toBe(true);
  });

  it("3. reset(key) and reset() drop counters", async () => {
    const limiter = new InMemoryRateLimiter("contact", { max: 1, windowMs: 60_000 });
    await limiter.consume("ip-3");
    expect((await limiter.consume("ip-3")).allowed).toBe(false);
    limiter.reset("ip-3");
    expect((await limiter.consume("ip-3")).allowed).toBe(true);

    await limiter.consume("ip-4");
    limiter.reset(); // whole tier
    expect((await limiter.consume("ip-4")).allowed).toBe(true);
  });
});

describe("RateLimiter tier registry (issue #94 A5)", () => {
  beforeEach(() => {
    // These tests drive a real HTTP server via supertest, which needs
    // real timers (fake timers starve Node's socket machinery). Clock
    // control isn't needed here — verdicts are computed within the same
    // instant.
    vi.useRealTimers();
  });

  it("4. all five tiers are registered and swappable without call-site changes", async () => {
    expect(rateLimitTiers().sort()).toEqual([
      "ai",
      "auth",
      "contact",
      "general",
      "search",
    ]);

    // Install a fake "Redis" adapter for the ai tier.
    const calls: string[] = [];
    const fakeRedisAdapter: RateLimiter = {
      tier: "ai",
      consume: async (key) => {
        calls.push(key);
        return {
          allowed: true,
          limit: 99,
          remaining: 98,
          resetAt: Date.now() + 1000,
          retryAfterSec: 1,
        };
      },
      reset: () => undefined,
    };
    setRateLimiter("ai", fakeRedisAdapter);
    expect(getRateLimiter("ai")).toBe(fakeRedisAdapter);

    // The pre-built middleware now routes through the adapter.
    // `trust proxy` mirrors production app.ts so req.ip is the
    // X-Forwarded-For value, exactly as behind the edge proxy.
    const app: Express = express();
    app.set("trust proxy", 1);
    app.post("/ai", rateLimit("ai"), (_req, res) => res.json({ ok: true }));
    const res = await request(app).post("/ai").set("X-Forwarded-For", "203.0.113.7");
    expect(res.status).toBe(200);
    expect(res.headers["x-ratelimit-limit"]).toBe("99");
    expect(calls).toContain("203.0.113.7");

    // Restoring the default takes effect immediately (swap is dynamic).
    _resetRateLimitersForTest();
    expect(getRateLimiter("ai")).not.toBe(fakeRedisAdapter);
  });

  it("5. tier middleware sets headers and returns the 429 error envelope", async () => {
    const app: Express = express();
    app.set("trust proxy", 1);
    // Private ad-hoc limiter so this test can't be affected by the
    // shared tier buckets (same mechanics as the tier path). The real
    // errorHandler renders the AppError as the public JSON envelope.
    app.post(
      "/burst",
      rateLimit({ max: 2, windowMs: 60_000, scope: "burst-test" }),
      (_req, res) => res.json({ ok: true }),
    );
    app.use(errorHandler);
    const ip = { "X-Forwarded-For": "203.0.113.9" };
    const first = await request(app).post("/burst").set(ip);
    const second = await request(app).post("/burst").set(ip);
    const third = await request(app).post("/burst").set(ip);

    expect(first.status).toBe(200);
    expect(first.headers["x-ratelimit-limit"]).toBe("2");
    expect(first.headers["x-ratelimit-remaining"]).toBe("2");
    expect(second.headers["x-ratelimit-remaining"]).toBe("1");

    expect(third.status).toBe(429);
    expect(third.headers["retry-after"]).toBeDefined();
    expect(third.body.error.code).toBe("RATE_LIMITED");
    expect(third.body.error.message).toMatch(/Too many/i);
  });
});
