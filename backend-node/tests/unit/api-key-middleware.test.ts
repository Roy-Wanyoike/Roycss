/**
 * Unit tests — X-API-Key middleware (src/server/middleware/api-key.ts,
 * issue #65 / PF-002).
 *
 * The Prisma client is mocked (vi.mock) so the resolution pipeline is
 * exercised hermetically: format check → lookupHash query → bcrypt
 * compare → revocation check → rate limit → scope check.
 *
 * The full create → use → revoke lifecycle over the real DB lives in
 * tests/integration/api-keys.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/db.js", () => ({
  db: {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import bcrypt from "bcryptjs";

import { db } from "../../src/lib/db.js";
import {
  getApiKeyRateLimiter,
  setApiKeyRateLimiter,
  type ApiKeyRateLimiter,
  type ApiKeyRateLimitDecision,
  type RateLimitTier,
} from "../../src/server/api-key-rate-limit.js";
import {
  jwtOnly,
  requireApiKeyScope,
} from "../../src/server/middleware/api-key.js";
import { AppError } from "../../src/server/middleware/error.js";
import { lookupHashOf } from "../../src/lib/api-key.js";

const findUnique = vi.mocked(db.apiKey.findUnique);
const update = vi.mocked(db.apiKey.update);

/** A well-formed test key. bcrypt rounds 4 keeps the suite fast. */
const TEST_KEY = "rk_live_" + "Ab09zyXZ".repeat(4);
const TEST_HASH = bcrypt.hashSync(TEST_KEY, 4);

/** A stored row for TEST_KEY as resolveApiKeyRow expects it. */
function storedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "key-123",
    name: "cli-key",
    hash: TEST_HASH,
    prefix: "rk_live",
    last4: TEST_KEY.slice(-4),
    scopesJson: JSON.stringify(["effects:read"]),
    ownerId: "owner-1",
    orgId: null,
    lastUsedAt: null,
    revokedAt: null,
    owner: { id: "owner-1", email: "owner@example.com" },
    ...overrides,
  };
}

interface FakeRes {
  res: never;
  headers: Record<string, string>;
}

function fakeReq(headers: Record<string, string>): never {
  return { headers } as never;
}

function fakeRes(): FakeRes {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
  };
  return { res: res as never, headers };
}

/** Drain the event loop until `next` was invoked (bcrypt compares take
 * real wall-clock time — a single setImmediate tick is not enough). */
async function waitForNext(
  next: ReturnType<typeof vi.fn>,
  timeoutMs = 3_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (next.mock.calls.length === 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function capturedError(next: ReturnType<typeof vi.fn>): AppError | undefined {
  const first = next.mock.calls[0]?.[0];
  return first instanceof AppError ? first : undefined;
}

const TIER: RateLimitTier = { limit: 1_000, windowMs: 60_000 };

afterEach(async () => {
  // Let any pending async continuation from the just-finished test (a
  // fire-and-forget lastUsedAt touch, a bcrypt compare still resolving)
  // settle BEFORE clearing mocks, so it can't bleed into the next test.
  await new Promise<void>((resolve) => setTimeout(resolve, 20));
  vi.clearAllMocks();
  update.mockReset();
  update.mockResolvedValue({} as never);
});

describe("requireApiKeyScope", () => {
  it("passes through when no X-API-Key header is present (route stays public)", async () => {
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({}), fakeRes().res, next);
    await waitForNext(next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeUndefined();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects a malformed key with 401 before hitting the DB", async () => {
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": "not-a-key" }), fakeRes().res, next);
    await waitForNext(next);
    expect(findUnique).not.toHaveBeenCalled();
    expect(capturedError(next)?.statusCode).toBe(401);
  });

  it("rejects an unknown key with 401 (uniform message, no enumeration)", async () => {
    findUnique.mockResolvedValue(null);
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    await waitForNext(next);
    const err = capturedError(next);
    expect(err?.statusCode).toBe(401);
    expect(err?.message).toBe("Invalid or revoked API key");
  });

  it("rejects a revoked key with 401 (revocation checked before bcrypt)", async () => {
    findUnique.mockResolvedValue(
      storedRow({ revokedAt: new Date() }) as never,
    );
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    await waitForNext(next);
    expect(capturedError(next)?.statusCode).toBe(401);
  });

  it("rejects a hash mismatch with 401", async () => {
    findUnique.mockResolvedValue(
      storedRow({ hash: bcrypt.hashSync("rk_live_" + "b".repeat(32), 4) }) as never,
    );
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    await waitForNext(next);
    expect(capturedError(next)?.statusCode).toBe(401);
  });

  it("authenticates a valid in-scope key, attaches req.apiKey, sets rate headers, touches lastUsedAt", async () => {
    findUnique.mockResolvedValue(storedRow() as never);
    update.mockResolvedValue({} as never);

    const req = fakeReq({ "x-api-key": TEST_KEY }) as { apiKey?: unknown };
    const { res, headers } = fakeRes();
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);

    middleware(req as never, res, next);
    await waitForNext(next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeUndefined();
    // Lookup used the indexed SHA-256 handle — never the plaintext.
    expect(findUnique).toHaveBeenCalledWith({
      where: { lookupHash: lookupHashOf(TEST_KEY) },
      select: expect.any(Object),
    });
    // lastUsedAt touched fire-and-forget, keyed by row id.
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    expect(update).toHaveBeenCalledWith({
      where: { id: "key-123" },
      data: { lastUsedAt: expect.any(Date) },
    });
    expect(headers["X-RateLimit-Limit"]).toBe(String(TIER.limit));
    expect(req.apiKey).toMatchObject({
      keyId: "key-123",
      keyName: "cli-key",
      ownerId: "owner-1",
      masked: `rk_live_…${TEST_KEY.slice(-4)}`,
      scopes: ["effects:read"],
    });
  });

  it("throttles lastUsedAt writes (one per key per 30 s)", async () => {
    const recent = new Date(Date.now() - 1_000);
    findUnique.mockResolvedValue(storedRow({ lastUsedAt: recent }) as never);
    update.mockResolvedValue({} as never);

    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    await waitForNext(next);

    expect(next.mock.calls[0]?.[0]).toBeUndefined();
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    expect(update).not.toHaveBeenCalled(); // too recent — skipped
  });

  it("rejects a valid key that is missing the required scope with 403", async () => {
    findUnique.mockResolvedValue(
      storedRow({ scopesJson: JSON.stringify(["recipes:read"]) }) as never,
    );
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    await waitForNext(next);
    const err = capturedError(next);
    expect(err?.statusCode).toBe(403);
    expect(err?.message).toContain("effects:read");
  });

  it("accepts a wildcard key for any scope", async () => {
    findUnique.mockResolvedValue(
      storedRow({ scopesJson: JSON.stringify(["*"]) }) as never,
    );
    const next = vi.fn();
    const middleware = requireApiKeyScope("effects:read", TIER);
    middleware(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    await waitForNext(next);
    expect(next.mock.calls[0]?.[0]).toBeUndefined();
  });

  it("returns 429 with Retry-After when the per-key budget is spent", async () => {
    const original = getApiKeyRateLimiter();
    const alwaysBlock: ApiKeyRateLimiter = {
      consume: (_keyId: string, tier: RateLimitTier): ApiKeyRateLimitDecision => ({
        allowed: false,
        limit: tier.limit,
        remaining: 0,
        retryAfterSec: 7,
      }),
    };
    try {
      setApiKeyRateLimiter(alwaysBlock);
      findUnique.mockResolvedValue(storedRow() as never);
      const { res, headers } = fakeRes();
      const next = vi.fn();
      const middleware = requireApiKeyScope("effects:read", TIER);
      middleware(fakeReq({ "x-api-key": TEST_KEY }), res, next);
      await waitForNext(next);
      const err = capturedError(next);
      expect(err?.statusCode).toBe(429);
      expect(err?.code).toBe("RATE_LIMITED");
      expect(headers["Retry-After"]).toBe("7");
    } finally {
      setApiKeyRateLimiter(original);
    }
  });
});

describe("jwtOnly (API-key management guard)", () => {
  it("passes when no X-API-Key is present", () => {
    const next = vi.fn();
    jwtOnly(fakeReq({ authorization: "Bearer x" }), fakeRes().res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeUndefined();
  });

  it("rejects X-API-Key credentials with 401", () => {
    const next = vi.fn();
    jwtOnly(fakeReq({ "x-api-key": TEST_KEY }), fakeRes().res, next);
    const err = capturedError(next);
    expect(err?.statusCode).toBe(401);
    expect(err?.message).toContain("Bearer");
  });
});
