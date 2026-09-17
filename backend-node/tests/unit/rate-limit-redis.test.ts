/**
 * Unit tests — Redis rate-limiter adapters behind the store seams
 * (issue #118 / PRD-F10, src/server/rate-limit-redis.ts).
 *
 * No real Redis anywhere: the client is a fake object injected through
 * the `RedisClientFactory` seam (and `ioredis` itself is vi.mock'ed so
 * even the default factory can be asserted without touching the network).
 *
 *   1. The Lua script implements the sliding window (source-level)
 *   2. RedisRateLimiter EVALs key + window params in one atomic call
 *   3. Result mapping mirrors the in-memory tier limiter (PRE-hit remaining)
 *   4. RedisApiKeyRateLimiter mapping mirrors the in-memory per-key
 *      limiter (POST-hit remaining, retryAfterSec floored at 1)
 *   5. Runtime Redis failure → in-memory fallback + throttled warn log
 *   6. Startup selection: REDIS_URL set → Redis adapters installed for
 *      all five tiers + the per-key seam; unset/blank → in-memory
 *   7. Connection failure at boot → falls back to in-memory + error log
 *   8. The default factory constructs ioredis with lazyConnect etc.
 *   9. The sync enforcement hook refuses async limiters loudly; the
 *      async hook applies headers/429 either way
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import { _resetEnvCacheForTest } from "../../src/config/env.js";
import {
  InMemoryApiKeyRateLimiter,
  enforceApiKeyRateLimit,
  enforceApiKeyRateLimitAsync,
  getApiKeyRateLimiter,
  setApiKeyRateLimiter,
  type RateLimitTier as ApiKeyTier,
} from "../../src/server/api-key-rate-limit.js";
import {
  InMemoryRateLimiter,
  _resetRateLimitersForTest,
  getRateLimiter,
} from "../../src/server/middleware/rateLimit.js";
import {
  RedisApiKeyRateLimiter,
  RedisRateLimiter,
  SLIDING_WINDOW_LUA,
  defaultRedisClientFactory,
  initRedisRateLimiting,
  _resetRedisRateLimitForTest,
  type RedisClientFactory,
  type RedisClientLike,
} from "../../src/server/rate-limit-redis.js";

// ─── Module mocks (hoisted) ────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  // One shared child logger for every createLogger() call in the module
  // under test, so warn/error/info assertions survive clearAllMocks().
  const child = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  return { child, RedisCtor: vi.fn() };
});

vi.mock("ioredis", () => ({ Redis: mocks.RedisCtor }));

vi.mock("../../src/lib/logger.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/lib/logger.js")>();
  return { ...actual, createLogger: () => mocks.child };
});

// ─── Fake Redis client (no server, no ioredis) ─────────────────────────────

interface FakeClientOptions {
  /** Sequential EVAL replies ([allowed, count_after]); [0, 0] once exhausted. */
  replies?: unknown[][];
  /** When set, every EVAL rejects (simulates an unreachable Redis). */
  evalError?: Error;
  /** When set, connect() rejects (simulates a refused connection). */
  connectError?: Error;
}

/** A structural RedisClientLike double that records command traffic. */
function makeFakeClient(options: FakeClientOptions = {}) {
  const evalCalls: unknown[][] = [];
  const delCalls: string[][] = [];
  const scanCalls: unknown[][] = [];
  const errorListeners: Array<(err: Error) => void> = [];
  const replyQueue = options.replies ? [...options.replies] : [[1, 1]];

  const client = {
    eval: vi.fn(async (...args: unknown[]) => {
      evalCalls.push(args);
      if (options.evalError) throw options.evalError;
      return replyQueue.length > 0 ? replyQueue.shift() : [0, 0];
    }),
    del: vi.fn(async (...keys: string[]) => {
      delCalls.push(keys);
      return keys.length;
    }),
    scan: vi.fn(async (...args: unknown[]) => {
      scanCalls.push(args);
      return ["0", []] as [string, string[]];
    }),
    quit: vi.fn(async () => undefined),
    on: vi.fn((event: string, listener: (err: Error) => void) => {
      if (event === "error") errorListeners.push(listener);
      return client;
    }),
    connect: vi.fn(async () => {
      if (options.connectError) throw options.connectError;
    }),
    status: "wait",
  };

  return {
    client: client as unknown as RedisClientLike,
    evalCalls,
    delCalls,
    scanCalls,
    errorListeners,
    /** Emit a connection-level error, like ioredis would. */
    emitError(err: Error): void {
      for (const listener of errorListeners) listener(err);
    },
  };
}

/** Response double recording setHeader calls (pattern of the #65 tests). */
function fakeRes(): { res: Response; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = String(v);
    },
  };
  return { res: res as unknown as Response, headers };
}

const REDIS_TEST_URL = "redis://localhost:6379";

beforeEach(() => {
  vi.clearAllMocks();
  _resetRedisRateLimitForTest();
  _resetRateLimitersForTest();
  setApiKeyRateLimiter(new InMemoryApiKeyRateLimiter());
  _resetEnvCacheForTest();
  delete process.env.REDIS_URL;
});

afterEach(() => {
  _resetEnvCacheForTest();
  delete process.env.REDIS_URL;
  _resetRateLimitersForTest();
  setApiKeyRateLimiter(new InMemoryApiKeyRateLimiter());
});

// ─── 1. The Lua script ─────────────────────────────────────────────────────

describe("SLIDING_WINDOW_LUA (atomic sliding window)", () => {
  it("implements the documented sliding-window command sequence", () => {
    // Drop stale → count → verdict → record → expire, all in one EVAL.
    expect(SLIDING_WINDOW_LUA).toContain("ZREMRANGEBYSCORE");
    expect(SLIDING_WINDOW_LUA).toContain("ZCARD");
    expect(SLIDING_WINDOW_LUA).toContain("ZADD");
    expect(SLIDING_WINDOW_LUA).toContain("PEXPIRE");
    // The script is parameterized by the bucket key + window/limit/ttl.
    expect(SLIDING_WINDOW_LUA).toContain("KEYS[1]");
    expect(SLIDING_WINDOW_LUA).toContain("ARGV[1]"); // now
    expect(SLIDING_WINDOW_LUA).toContain("ARGV[2]"); // window
    expect(SLIDING_WINDOW_LUA).toContain("ARGV[3]"); // limit
    expect(SLIDING_WINDOW_LUA).toContain("ARGV[5]"); // ttl
    // Pre-hit verdict, matching the in-memory limiter's semantics.
    expect(SLIDING_WINDOW_LUA).toContain("count < limit");
  });
});

// ─── 2–5. Route-tier adapter ───────────────────────────────────────────────

describe("RedisRateLimiter (route-tier seam)", () => {
  it("EVALs the script once with the bucket key + window/limit/ttl params", async () => {
    const fake = makeFakeClient();
    const limiter = new RedisRateLimiter(fake.client, "auth", {
      max: 10,
      windowMs: 60_000,
    });
    const before = Date.now();
    await limiter.consume("ip-1");
    const after = Date.now();

    expect(fake.client.eval).toHaveBeenCalledTimes(1);
    expect(fake.client.eval).toHaveBeenCalledWith(
      SLIDING_WINDOW_LUA,
      1,
      "roycss:rl:auth:ip-1",
      expect.any(Number), // now (client clock)
      60_000, // window
      10, // limit
      expect.any(String), // unique member nonce
      65_000, // ttl = window + 5s grace
    );
    // The timestamp passed to the script is the request's Date.now().
    const nowArg = fake.evalCalls[0]?.[3];
    expect(Number(nowArg)).toBeGreaterThanOrEqual(before);
    expect(Number(nowArg)).toBeLessThanOrEqual(after);
  });

  it("maps replies onto the exact in-memory tier-limiter shape (PRE-hit remaining)", async () => {
    const fake = makeFakeClient({ replies: [[1, 1], [1, 2], [0, 2]] });
    const redis = new RedisRateLimiter(fake.client, "auth", {
      max: 2,
      windowMs: 60_000,
    });
    const memory = new InMemoryRateLimiter("auth", { max: 2, windowMs: 60_000 });

    const first = await redis.consume("ip-9");
    const memFirst = await memory.consume("ip-9");
    // Fresh bucket: first request reports the FULL limit remaining.
    expect(first).toMatchObject({
      allowed: true,
      limit: 2,
      remaining: 2,
      retryAfterSec: 60,
    });
    expect(first).toEqual(
      expect.objectContaining({
        allowed: memFirst.allowed,
        limit: memFirst.limit,
        remaining: memFirst.remaining,
        retryAfterSec: memFirst.retryAfterSec,
      }),
    );
    expect(typeof first.resetAt).toBe("number");

    const second = await redis.consume("ip-9");
    const memSecond = await memory.consume("ip-9");
    expect(second.remaining).toBe(1);
    expect(second.remaining).toBe(memSecond.remaining);

    const third = await redis.consume("ip-9");
    const memThird = await memory.consume("ip-9");
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.remaining).toBe(memThird.remaining);
    expect(third.retryAfterSec).toBe(60);
  });

  it("serves from the in-memory fallback and logs when Redis rejects EVAL", async () => {
    const fake = makeFakeClient({
      evalError: new Error("Connection is closed."),
    });
    const limiter = new RedisRateLimiter(fake.client, "auth", {
      max: 2,
      windowMs: 60_000,
    });

    // Never throws — a Redis outage degrades to per-process limiting.
    const first = await limiter.consume("ip-fb");
    const second = await limiter.consume("ip-fb");
    const third = await limiter.consume("ip-fb");
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);

    expect(mocks.child.warn).toHaveBeenCalledTimes(1);
    expect(mocks.child.warn.mock.calls[0]?.[0]).toMatch(
      /Redis rate-limiter unavailable/,
    );
  });

  it("reset(key) DELs the bucket key; reset() SCANs the tier pattern", async () => {
    const fake = makeFakeClient();
    const limiter = new RedisRateLimiter(fake.client, "auth", {
      max: 2,
      windowMs: 60_000,
    });
    limiter.reset("ip-1");
    expect(fake.client.del).toHaveBeenCalledWith("roycss:rl:auth:ip-1");

    limiter.reset(); // whole tier
    expect(fake.client.scan).toHaveBeenCalledWith(
      "0",
      "MATCH",
      "roycss:rl:auth:*",
      "COUNT",
      "100",
    );
  });
});

// ─── Per-API-key adapter ───────────────────────────────────────────────────

describe("RedisApiKeyRateLimiter (per-key seam)", () => {
  const TIER: ApiKeyTier = { limit: 2, windowMs: 1_000 };

  it("EVALs with the per-key bucket key + the caller's tier window/limit", async () => {
    const fake = makeFakeClient();
    const limiter = new RedisApiKeyRateLimiter(fake.client);
    await limiter.consume("key-1", TIER);

    expect(fake.client.eval).toHaveBeenCalledTimes(1);
    expect(fake.client.eval).toHaveBeenCalledWith(
      SLIDING_WINDOW_LUA,
      1,
      "roycss:rl:apikey:key-1",
      expect.any(Number),
      1_000, // tier window
      2, // tier limit
      expect.any(String),
      6_000, // ttl = window + 5s grace
    );
  });

  it("maps replies onto the exact in-memory per-key shape (POST-hit remaining)", async () => {
    const fake = makeFakeClient({ replies: [[1, 1], [1, 2], [0, 2]] });
    const redis = new RedisApiKeyRateLimiter(fake.client);
    const memory = new InMemoryApiKeyRateLimiter();

    const first = await redis.consume("key-9", TIER);
    const memFirst = memory.consume("key-9", TIER);
    // First request already counts itself: remaining = limit − 1.
    expect(first).toEqual({
      allowed: true,
      limit: 2,
      remaining: 1,
      retryAfterSec: 1,
    });
    expect(first).toEqual(
      expect.objectContaining({
        allowed: memFirst.allowed,
        limit: memFirst.limit,
        remaining: memFirst.remaining,
        retryAfterSec: memFirst.retryAfterSec,
      }),
    );

    const second = await redis.consume("key-9", TIER);
    const memSecond = memory.consume("key-9", TIER);
    expect(second.remaining).toBe(0);
    expect(second.remaining).toBe(memSecond.remaining);

    const third = await redis.consume("key-9", TIER);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    // retryAfterSec is floored at 1s, like the in-memory original.
    expect(third.retryAfterSec).toBe(1);
  });

  it("falls back to the in-memory limiter + logs when Redis rejects EVAL", async () => {
    const fake = makeFakeClient({
      evalError: new Error("Stream isn't writeable."),
    });
    const limiter = new RedisApiKeyRateLimiter(fake.client);

    const decision = await limiter.consume("key-fb", TIER);
    expect(decision).toEqual({
      allowed: true,
      limit: 2,
      remaining: 1,
      retryAfterSec: 1,
    });
    expect(mocks.child.warn).toHaveBeenCalledTimes(1);
    expect(mocks.child.warn.mock.calls[0]?.[0]).toMatch(
      /Redis rate-limiter unavailable/,
    );
  });
});

// ─── 6–8. Startup selection (env seam) ─────────────────────────────────────

describe("initRedisRateLimiting (startup selection, issue #118)", () => {
  it("installs Redis adapters for all five tiers + the per-key limiter when REDIS_URL is set", async () => {
    process.env.REDIS_URL = REDIS_TEST_URL;
    _resetEnvCacheForTest();
    const fake = makeFakeClient();
    const factory: RedisClientFactory = vi.fn(() => fake.client);

    const handle = await initRedisRateLimiting({ clientFactory: factory });

    expect(handle?.installed).toBe(true);
    expect(factory).toHaveBeenCalledWith(REDIS_TEST_URL);
    expect(fake.client.connect).toHaveBeenCalledTimes(1);
    // The 'error' listener is attached BEFORE connecting (unhandled
    // 'error' events crash the process).
    expect(fake.client.on).toHaveBeenCalledWith("error", expect.any(Function));

    for (const tier of [
      "general",
      "auth",
      "contact",
      "ai",
      "search",
    ] as const) {
      expect(getRateLimiter(tier)).toBeInstanceOf(RedisRateLimiter);
    }
    expect(getApiKeyRateLimiter()).toBeInstanceOf(RedisApiKeyRateLimiter);

    // The installed tier adapter routes checks to the shared client.
    await getRateLimiter("auth").consume("ip-wired");
    expect(fake.client.eval).toHaveBeenCalledWith(
      SLIDING_WINDOW_LUA,
      1,
      "roycss:rl:auth:ip-wired",
      expect.any(Number),
      60_000,
      10, // TIER_DEFAULTS auth max, single source via rateLimitTierConfig()
      expect.any(String),
      65_000,
    );

    // A connection-level error event is logged, not fatal.
    fake.emitError(new Error("ECONNRESET"));
    expect(mocks.child.warn).toHaveBeenCalledWith(
      "Redis rate-limiter connection error",
      expect.objectContaining({ err: "ECONNRESET" }),
    );

    // Graceful shutdown quits the shared client.
    await handle?.quit();
    expect(fake.client.quit).toHaveBeenCalledTimes(1);
  });

  it("keeps the in-memory limiters (and skips Redis entirely) when REDIS_URL is unset", async () => {
    delete process.env.REDIS_URL;
    _resetEnvCacheForTest();
    const factory: RedisClientFactory = vi.fn(() => makeFakeClient().client);

    const handle = await initRedisRateLimiting({ clientFactory: factory });

    expect(handle).toBeNull();
    expect(factory).not.toHaveBeenCalled();
    expect(getRateLimiter("general")).toBeInstanceOf(InMemoryRateLimiter);
    expect(getApiKeyRateLimiter()).toBeInstanceOf(InMemoryApiKeyRateLimiter);
  });

  it("treats a blank REDIS_URL as unset (copied .env.example boots)", async () => {
    process.env.REDIS_URL = "";
    _resetEnvCacheForTest();
    const factory: RedisClientFactory = vi.fn(() => makeFakeClient().client);

    const handle = await initRedisRateLimiting({ clientFactory: factory });

    expect(handle).toBeNull();
    expect(factory).not.toHaveBeenCalled();
    expect(getRateLimiter("general")).toBeInstanceOf(InMemoryRateLimiter);
  });

  it("falls back to in-memory + logs when the connection is refused", async () => {
    process.env.REDIS_URL = REDIS_TEST_URL;
    _resetEnvCacheForTest();
    const fake = makeFakeClient({
      connectError: new Error("connect ECONNREFUSED 127.0.0.1:6379"),
    });

    const handle = await initRedisRateLimiting({
      clientFactory: () => fake.client,
    });

    expect(handle).toBeNull();
    expect(mocks.child.error).toHaveBeenCalledTimes(1);
    expect(mocks.child.error.mock.calls[0]?.[0]).toMatch(
      /Redis rate-limiter connection failed — falling back to in-memory/,
    );
    // The URL is logged without credentials and nothing was installed.
    expect(mocks.child.error.mock.calls[0]?.[1]).toMatchObject({
      url: REDIS_TEST_URL,
    });
    expect(getRateLimiter("general")).toBeInstanceOf(InMemoryRateLimiter);
    expect(getApiKeyRateLimiter()).toBeInstanceOf(InMemoryApiKeyRateLimiter);
    expect(fake.client.eval).not.toHaveBeenCalled();
  });

  it("default factory constructs ioredis with lazyConnect + fail-fast options", () => {
    defaultRedisClientFactory(REDIS_TEST_URL);
    expect(mocks.RedisCtor).toHaveBeenCalledWith(
      REDIS_TEST_URL,
      expect.objectContaining({
        lazyConnect: true,
        connectTimeout: 3_000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      }),
    );
  });
});

// ─── 9. Sync/async enforcement hooks ───────────────────────────────────────

describe("enforcement hooks with an async (Redis) limiter installed", () => {
  it("the sync hook fails loudly instead of silently allowing", () => {
    const fake = makeFakeClient();
    setApiKeyRateLimiter(new RedisApiKeyRateLimiter(fake.client));
    const { res } = fakeRes();

    expect(() =>
      enforceApiKeyRateLimit(res, "key-x", { limit: 2, windowMs: 1_000 }),
    ).toThrow(/cannot block on the installed async \(Redis\) limiter/);
  });

  it("the async hook applies the headers/429 semantics for a Redis limiter", async () => {
    const fake = makeFakeClient({ replies: [[1, 1], [0, 2]] });
    setApiKeyRateLimiter(new RedisApiKeyRateLimiter(fake.client));
    const { res, headers } = fakeRes();
    const TIER: ApiKeyTier = { limit: 2, windowMs: 1_000 };

    // The request path (authenticateApiKey) awaits the async hook.
    await expect(
      enforceApiKeyRateLimitAsync(res, "key-x", TIER),
    ).resolves.toBeUndefined();
    expect(headers["X-RateLimit-Limit"]).toBe("2");
    expect(headers["X-RateLimit-Remaining"]).toBe("1");
    expect(headers["Retry-After"]).toBeUndefined();

    // Over budget → 429 AppError with Retry-After, same as in-memory.
    await expect(
      enforceApiKeyRateLimitAsync(res, "key-x", TIER),
    ).rejects.toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
    });
    expect(headers["Retry-After"]).toBe("1");
  });
});
