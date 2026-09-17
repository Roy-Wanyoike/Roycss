/**
 * Redis-backed rate-limiter adapters behind the existing seams
 * (issue #118 / PRD-F10).
 *
 * ─── What this module adds ──────────────────────────────────────────
 * The five route tiers (`server/middleware/rateLimit.ts`) and the
 * per-API-key limiter (`server/api-key-rate-limit.ts`) default to
 * in-process sliding windows: counters reset on every deploy and halve
 * when the backend scales past one replica. When `REDIS_URL` is set,
 * `initRedisRateLimiting()` — called once at startup from
 * `src/index.ts` — installs Redis-backed adapters through the SAME
 * injection seams, so no route or middleware call site changes:
 *
 *   setRateLimiter(tier, new RedisRateLimiter(...))        × 5 tiers
 *   setApiKeyRateLimiter(new RedisApiKeyRateLimiter(...))  × 1
 *
 * Ad-hoc `rateLimit({ ... })` limiters (private, options-scoped) stay
 * in-process by design — they are per-middleware-instance tools, not
 * cross-replica state.
 *
 * ─── Algorithm — atomic Lua sliding window ──────────────────────────
 * One EVAL per check, executing atomically on the server. A MULTI/
 * pipeline of ZREMRANGEBYSCORE → ZCARD → ZADD would interleave between
 * concurrent requests (check-then-record race over-admitting at the
 * limit boundary); a script cannot interleave, so the verdict and the
 * recorded hit are one indivisible step:
 *
 *   1. ZREMRANGEBYSCORE key 0 (now − window)  — drop hits that slid out
 *   2. ZCARD key                              — count surviving hits
 *   3. verdict: count < limit ?               — PRE-hit, like in-memory
 *   4. if allowed: ZADD key now <member>      — record THIS hit
 *   5. PEXPIRE key (window + grace)           — reclaim idle buckets
 *
 * `now` comes from the API process (Date.now()), not the Redis server —
 * replicas with skewed clocks shift window edges slightly; that is true
 * of every client-timestamped sliding-window store.
 *
 * ─── Failure semantics — never crash the API ────────────────────────
 *   Boot:     lazyConnect + an explicit `connect()`. On failure the
 *             adapters are NOT installed — one error log, and the
 *             in-memory limiters keep serving (single-replica
 *             behavior).
 *   Runtime:  an unreachable/unhealthy Redis rejects `eval()`; the
 *             adapter serves that one check from a private in-memory
 *             fallback limiter (limits stay enforced per-process) and
 *             logs at most one warn per 10 s. ioredis keeps retrying in
 *             the background (bounded, see retryStrategy); once it
 *             reconnects, checks flow back to Redis.
 *
 * ─── Testability ────────────────────────────────────────────────────
 * The client comes from an injectable factory (`RedisClientFactory`)
 * so unit tests pass fakes instead of a real Redis; the default factory
 * wraps `ioredis`. The Lua source is exported for assertions.
 */
import { randomUUID } from "node:crypto";

// Named import — under NodeNext the default-import typing of the CJS
// ioredis build resolves to the module namespace, not the class.
import { Redis } from "ioredis";

import { env } from "../config/env.js";
import { createLogger } from "../lib/logger.js";
import {
  InMemoryApiKeyRateLimiter,
  setApiKeyRateLimiter,
  type ApiKeyRateLimitDecision,
  type ApiKeyRateLimiter,
  type RateLimitTier as ApiKeyTierConfig,
} from "./api-key-rate-limit.js";
import {
  InMemoryRateLimiter,
  rateLimitTierConfig,
  rateLimitTiers,
  setRateLimiter,
  type RateLimitResult,
  type RateLimiter,
  type RateLimitTier,
} from "./middleware/rateLimit.js";

const log = createLogger("rate-limit-redis");

// ─── Lua: atomic sliding-window check + record ────────────────────────────

/**
 * KEYS[1] : bucket key          e.g. roycss:rl:auth:203.0.113.7
 * ARGV[1] : now                 epoch ms (client clock)
 * ARGV[2] : window              ms
 * ARGV[3] : limit               max requests per window
 * ARGV[4] : nonce               unique-per-call member suffix
 * ARGV[5] : ttl                 bucket TTL in ms (window + grace)
 * Returns : { allowed (0|1), count_after }
 *
 * Exported for test assertions (the script must carry the key + window
 * parameters and implement the exact sliding-window semantics above).
 */
export const SLIDING_WINDOW_LUA = `-- Atomic sliding-window rate-limit check + record (issue #118 / PRD-F10).
-- Runs as ONE script so the ZCARD verdict and the ZADD record cannot
-- interleave with another request's (a MULTI pipeline can interleave
-- between commands and over-admit at the limit boundary).
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])

-- 1. Drop hits at or before the cutoff — the in-memory limiter keeps
--    hits with t > cutoff, so the max bound here is inclusive.
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - window)

-- 2. Count surviving hits.
local count = redis.call('ZCARD', KEYS[1])

-- 3. Verdict, PRE-hit — identical semantics to the in-memory limiter.
local allowed = 0
if count < limit then
  allowed = 1
  -- 4. Record THIS hit. Members must stay unique within the same ms:
  --    score = now, member = now-<rank>-<nonce>. Atomicity already
  --    prevents two in-flight checks from reading the same count; the
  --    nonce additionally separates same-ms hits from different
  --    processes whose clocks agree.
  redis.call('ZADD', KEYS[1], now, tostring(now) .. '-' .. tostring(count + 1) .. '-' .. ARGV[4])
  count = count + 1
end

-- 5. Reap the bucket once it can no longer matter.
redis.call('PEXPIRE', KEYS[1], ARGV[5])

return {allowed, count}`;

// ─── Client seam (dependency-injectable for tests) ────────────────────────

/**
 * The slice of the ioredis client the adapters actually use. Keeping it
 * structural means unit tests inject a plain fake object and never
 * touch a real Redis — the default factory below is the only place the
 * real `ioredis` class appears.
 */
export interface RedisClientLike {
  /** EVAL a script — ioredis argument order: script, numKeys, key, …args. */
  eval(
    script: string,
    numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown>;
  /** DEL one or more keys. */
  del(...keys: string[]): Promise<unknown>;
  /** SCAN for keys matching a pattern (cursor-based iteration). */
  scan(cursor: string, ...args: string[]): Promise<[string, string[]]>;
  /** Close the connection gracefully (shutdown). */
  quit(): Promise<unknown>;
  /**
   * Connection-level errors land here. MUST be attached before
   * connecting: an unhandled "error" event crashes the process.
   */
  on(event: "error", listener: (err: Error) => void): unknown;
  /** Explicitly open the connection (used with lazyConnect). */
  connect(): Promise<void>;
  /** ioredis connection status ("wait" | "connecting" | "ready" | …). */
  readonly status?: string;
}

/** Creates the Redis client for a URL — injectable for tests. */
export type RedisClientFactory = (url: string) => RedisClientLike;

/**
 * Default factory — the real ioredis client. Fail-fast tuned: boot must
 * not hang on a dead Redis (lazyConnect + bounded retryStrategy +
 * connectTimeout), and a request must never stall on an offline client
 * (enableOfflineQueue: false → commands reject immediately → the
 * adapter's per-request in-memory fallback serves the check instead).
 */
export const defaultRedisClientFactory: RedisClientFactory = (url) =>
  new Redis(url, {
    lazyConnect: true,
    connectTimeout: 3_000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times: number) =>
      times > 3 ? null : Math.min(times * 200, 1_000),
  }) as unknown as RedisClientLike;

// ─── Shared helpers ───────────────────────────────────────────────────────

/** All Redis bucket keys live under this prefix (one namespace to flush). */
const DEFAULT_KEY_PREFIX = "roycss:rl:";

/** Idle buckets are reaped one grace period after the window ends. */
const BUCKET_TTL_GRACE_MS = 5_000;

/** At most one fallback warn per this window, so outages don't flood logs. */
const REDIS_FAILURE_LOG_INTERVAL_MS = 10_000;
let lastFailureLogAt = 0;

function errMsg(err: unknown): string {
  if (err instanceof Error) {
    // ioredis emits some connection errors with an empty message —
    // fall back to the class name so logs stay useful.
    return err.message || err.name;
  }
  return String(err);
}

/** Log-safe URL summary — drops credentials, keeps scheme/host/port. */
function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "<invalid-redis-url>";
  }
}

/** Throttled warn — the fallback itself is silent per request. */
function logRedisFailure(scope: string, err: unknown): void {
  const now = Date.now();
  if (now - lastFailureLogAt < REDIS_FAILURE_LOG_INTERVAL_MS) return;
  lastFailureLogAt = now;
  log.warn("Redis rate-limiter unavailable — serving this check from the in-process fallback limiter", {
    scope,
    err: errMsg(err),
  });
}

/** Parse the script reply `[allowed, count_after]`. */
function parseEvalReply(
  raw: unknown,
  scope: string,
): { allowed: boolean; countAfter: number } {
  if (Array.isArray(raw) && raw.length >= 2) {
    const allowed = Number(raw[0]) === 1;
    const countAfter = Number(raw[1]);
    if (Number.isFinite(countAfter)) return { allowed, countAfter };
  }
  throw new Error(
    `Unexpected reply from the Redis rate-limit script (${scope}): ${JSON.stringify(raw)}`,
  );
}

/** quit() that never rejects — shutdown must not hang on a dead client. */
async function quietQuit(client: RedisClientLike): Promise<void> {
  try {
    await client.quit();
  } catch {
    // Already closed / never connected — nothing to do.
  }
}

/** Best-effort DELETE of every key matching `pattern` (SCAN + DEL loop). */
async function deleteByPattern(
  client: RedisClientLike,
  pattern: string,
): Promise<void> {
  let cursor = "0";
  do {
    const [next, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", "100");
    cursor = next;
    if (keys.length > 0) await client.del(...keys);
  } while (cursor !== "0");
}

/** Fire-and-forget reset error sink (reset() is sync by interface). */
function quietResetError(scope: string): (err: unknown) => void {
  return (err: unknown) => {
    log.debug("Redis rate-limiter reset failed (best-effort)", {
      scope,
      err: errMsg(err),
    });
  };
}

// ─── Route-tier adapter (server/middleware/rateLimit.ts seam) ─────────────

/**
 * Redis-backed sliding-window limiter for one route tier. Implements the
 * exact `RateLimiter` interface the tier registry expects — including
 * the PRE-hit `remaining` convention (a fresh bucket reports the full
 * limit remaining on the first request) so the X-RateLimit-* headers a
 * client sees are identical to the in-memory default's.
 */
export class RedisRateLimiter implements RateLimiter {
  readonly tier: RateLimitTier;
  private readonly client: RedisClientLike;
  private readonly windowMs: number;
  private readonly max: number;
  private readonly keyPrefix: string;
  /** Process-local stand-in, used only while Redis is unreachable. */
  private readonly fallback: InMemoryRateLimiter;

  constructor(
    client: RedisClientLike,
    tier: RateLimitTier,
    options: { windowMs?: number; max: number; keyPrefix?: string },
  ) {
    this.client = client;
    this.tier = tier;
    this.windowMs = options.windowMs ?? rateLimitTierConfig(tier).windowMs;
    this.max = options.max;
    this.keyPrefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX;
    this.fallback = new InMemoryRateLimiter(tier, {
      windowMs: this.windowMs,
      max: this.max,
    });
  }

  async consume(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    try {
      const raw = await this.client.eval(
        SLIDING_WINDOW_LUA,
        1,
        `${this.keyPrefix}${this.tier}:${key}`,
        now,
        this.windowMs,
        this.max,
        randomUUID(),
        this.windowMs + BUCKET_TTL_GRACE_MS,
      );
      const { allowed, countAfter } = parseEvalReply(raw, `tier:${this.tier}`);
      // Mirrors InMemoryRateLimiter.consume exactly: `allowed` and
      // `remaining` are PRE-hit values; `countAfter` includes this hit.
      return {
        allowed,
        limit: this.max,
        remaining: allowed
          ? Math.max(0, this.max - countAfter + 1)
          : Math.max(0, this.max - countAfter),
        resetAt: now + this.windowMs,
        retryAfterSec: Math.ceil(this.windowMs / 1000),
      };
    } catch (err) {
      logRedisFailure(`tier:${this.tier}`, err);
      return this.fallback.consume(key);
    }
  }

  reset(key?: string): void {
    // The interface is sync by design — Redis resets are fire-and-forget.
    if (key !== undefined) {
      void this.client
        .del(`${this.keyPrefix}${this.tier}:${key}`)
        .catch(quietResetError(`tier:${this.tier}`));
    } else {
      void deleteByPattern(
        this.client,
        `${this.keyPrefix}${this.tier}:*`,
      ).catch(quietResetError(`tier:${this.tier}`));
    }
    // Keep the fallback consistent in case Redis drops mid-flight later.
    this.fallback.reset(key);
  }
}

// ─── Per-API-key adapter (server/api-key-rate-limit.ts seam) ──────────────

/**
 * Redis-backed sliding-window limiter for API keys. Implements the
 * `ApiKeyRateLimiter` interface (async `consume` — the union the
 * interface allows since #118). The decision mapping mirrors
 * `InMemoryApiKeyRateLimiter` exactly: POST-hit `remaining` (the first
 * request reports `limit − 1`) and `retryAfterSec` floored at 1 s.
 * One bucket per key id, evaluated against whatever tier the caller
 * passes — same as the in-memory original.
 */
export class RedisApiKeyRateLimiter implements ApiKeyRateLimiter {
  private readonly client: RedisClientLike;
  private readonly keyPrefix: string;
  /** Process-local stand-in, used only while Redis is unreachable. */
  private readonly fallback: InMemoryApiKeyRateLimiter;

  constructor(
    client: RedisClientLike,
    options: { keyPrefix?: string } = {},
  ) {
    this.client = client;
    this.keyPrefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX;
    this.fallback = new InMemoryApiKeyRateLimiter();
  }

  async consume(
    keyId: string,
    tier: ApiKeyTierConfig,
  ): Promise<ApiKeyRateLimitDecision> {
    const now = Date.now();
    try {
      const raw = await this.client.eval(
        SLIDING_WINDOW_LUA,
        1,
        `${this.keyPrefix}apikey:${keyId}`,
        now,
        tier.windowMs,
        tier.limit,
        randomUUID(),
        tier.windowMs + BUCKET_TTL_GRACE_MS,
      );
      const { allowed, countAfter } = parseEvalReply(raw, "apikey");
      // Mirrors InMemoryApiKeyRateLimiter.consume exactly: `countAfter`
      // includes this hit, so `remaining` is the POST-hit value.
      return {
        allowed,
        limit: tier.limit,
        remaining: Math.max(0, tier.limit - countAfter),
        retryAfterSec: Math.max(1, Math.ceil(tier.windowMs / 1000)),
      };
    } catch (err) {
      logRedisFailure("apikey", err);
      return this.fallback.consume(keyId, tier);
    }
  }

  reset(keyId: string): void {
    void this.client
      .del(`${this.keyPrefix}apikey:${keyId}`)
      .catch(quietResetError("apikey"));
    this.fallback.reset(keyId);
  }
}

// ─── Startup selection + graceful shutdown ────────────────────────────────

/** Handle on an installed (or attempted) Redis rate-limit session. */
export interface RedisRateLimitHandle {
  /** Whether the Redis adapters were installed (false = fell back). */
  readonly installed: boolean;
  /** Quit the shared client — call on SIGTERM/SIGINT (never rejects). */
  quit(): Promise<void>;
}

/**
 * Startup selection (issue #118): when `REDIS_URL` is set, connect and
 * install Redis-backed adapters for all five route tiers + the
 * per-API-key limiter through their existing seams. Called once from
 * `src/index.ts` BEFORE the HTTP server starts listening.
 *
 * Any failure — unset var (null), client construction error, or a
 * refused connection — leaves the default in-memory limiters in place:
 * the API never fails to boot because of Redis. Returns null when the
 * Redis adapters are NOT active, or a handle (with `quit()`) when they
 * are.
 */
export async function initRedisRateLimiting(
  deps: { clientFactory?: RedisClientFactory; url?: string } = {},
): Promise<RedisRateLimitHandle | null> {
  // Read lazily (not at module load) so the _resetEnvCacheForTest seam
  // can flip REDIS_URL between test cases.
  const url = deps.url ?? env.REDIS_URL;
  if (!url) {
    log.info("REDIS_URL not set — in-process rate limiters active (default)");
    return null;
  }

  const factory = deps.clientFactory ?? defaultRedisClientFactory;

  let client: RedisClientLike;
  try {
    client = factory(url);
  } catch (err) {
    log.error("Redis rate-limiter client could not be created — staying on in-memory limiters", {
      url: safeUrl(url),
      err: errMsg(err),
    });
    return null;
  }

  // Attach the error listener BEFORE connecting: an unhandled "error"
  // event on the client would crash the whole process.
  client.on("error", (err) => {
    log.warn("Redis rate-limiter connection error", { err: errMsg(err) });
  });

  try {
    await client.connect();
  } catch (err) {
    log.error("Redis rate-limiter connection failed — falling back to in-memory limiters (issue #118)", {
      url: safeUrl(url),
      err: errMsg(err),
    });
    void quietQuit(client);
    return null;
  }

  // Both limiter families, through the seams the modules already expose:
  for (const tier of rateLimitTiers()) {
    const { max, windowMs } = rateLimitTierConfig(tier);
    setRateLimiter(tier, new RedisRateLimiter(client, tier, { max, windowMs }));
  }
  setApiKeyRateLimiter(new RedisApiKeyRateLimiter(client));

  log.info("Redis-backed rate limiters installed (5 route tiers + per-API-key)", {
    url: safeUrl(url),
    tiers: rateLimitTiers(),
  });

  return { installed: true, quit: () => quietQuit(client) };
}

/**
 * Test seam (convention of `_resetRateLimitersForTest` & co.) — clears
 * the failure-log throttle so the next Redis error logs again.
 * Production never calls this.
 */
export function _resetRedisRateLimitForTest(): void {
  lastFailureLogAt = 0;
}
