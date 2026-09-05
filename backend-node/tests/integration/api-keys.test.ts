/**
 * Integration tests — API key management (issue #65 / PF-002).
 *
 * Full lifecycle over supertest against the real app + SQLite:
 *   create → use (X-API-Key on effects) → list (masked) → revoke → 401
 *
 * Coverage matrix:
 *   1.  create  — POST /auth/api-keys with Bearer JWT → 201 + plaintext
 *       key shown exactly once; bcrypt hash + SHA-256 lookup handle at
 *       rest; plaintext never persisted.
 *   2.  use     — GET /effects with X-API-Key → 200 (scope: effects:read);
 *       lastUsedAt is touched fire-and-forget.
 *   3.  scope   — a recipes:read-only key on /effects → 403 FORBIDDEN.
 *   4.  list    — GET /auth/api-keys → masked keys only (no plaintext,
 *       no hash) and owner-scoped (other users don't see them).
 *   5.  revoke  — DELETE /auth/api-keys/:id → 200 revokedAt set; the key
 *       then yields 401; double-revoke → 409; foreign key id → 404.
 *   6.  requireAuth composition — a `*` key authenticates on a protected
 *       route (GET /auth/me) as its owner; a narrow key gets 403.
 *   7.  guards  — create/list/revoke require Bearer (401 anonymous, 401
 *       with an X-API-Key credential), unknown scope → 400, duplicate
 *       name → 409.
 *   8.  rate limit — per-key 429 + Retry-After via the pluggable limiter
 *       seam (stub tier, restored afterwards).
 *
 * Conventions follow auth.test.ts / authz.test.ts: unique emails, unique
 * X-Forwarded-For IPs per request so the per-IP limiters never trip.
 */
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import {
  InMemoryApiKeyRateLimiter,
  getApiKeyRateLimiter,
  setApiKeyRateLimiter,
  type ApiKeyRateLimiter,
  type ApiKeyRateLimitDecision,
  type RateLimitTier,
} from "../../src/server/api-key-rate-limit.js";

const app = createApp();

/** Generate a unique email so tests don't collide on `User.email` @unique. */
function uniqueEmail(prefix = "user"): string {
  return `${prefix}+${crypto.randomUUID()}@example.com`;
}

/** Unique IP per request so the in-memory rate limiter never trips. */
function uniqueIp(): string {
  // 198.51.100.0/24 is reserved for documentation/testing (RFC 5737).
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9";

/** Register a fresh user via the public API and return id + access token. */
async function registerUser(prefix: string): Promise<{ id: string; accessToken: string }> {
  const email = uniqueEmail(prefix);
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD, name: `${prefix} User` });
  expect(res.status).toBe(201);
  return {
    id: res.body.data.user.id as string,
    accessToken: res.body.data.accessToken as string,
  };
}

/** Mint an API key for `user` with the given scopes. Returns the plaintext. */
async function mintKey(
  user: { accessToken: string },
  name: string,
  scopes: string[] | undefined,
): Promise<{ id: string; plaintext: string; masked: string; scopes: string[] }> {
  const res = await request(app)
    .post("/api/v1/auth/api-keys")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Forwarded-For", uniqueIp())
    .send(scopes === undefined ? { name } : { name, scopes });
  expect(res.status).toBe(201);
  return {
    id: res.body.data.apiKey.id as string,
    plaintext: res.body.data.key as string,
    masked: res.body.data.apiKey.masked as string,
    scopes: res.body.data.apiKey.scopes as string[],
  };
}

/** GET /effects with an X-API-Key credential. */
function getEffects(apiKey: string) {
  return request(app)
    .get("/api/v1/effects")
    .set("X-Forwarded-For", uniqueIp())
    .set("X-API-Key", apiKey)
    .query({ limit: 1 });
}

/** Poll until `check` passes (fire-and-forget lastUsedAt writes). */
async function waitFor(
  check: () => Promise<boolean>,
  timeoutMs = 2_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return await check();
}

// Restore a fresh default in-memory limiter no matter how the run ends —
// the stub installed by the rate-limit test is process-global and the
// worker is shared with the other test files.
afterAll(() => {
  setApiKeyRateLimiter(new InMemoryApiKeyRateLimiter());
});

describe("issue #65 — API key lifecycle: create → use → list → revoke → 401", () => {
  it("1. create — 201, plaintext shown once, bcrypt hash at rest, plaintext never stored", async () => {
    const user = await registerUser("lifecycle");

    const res = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({ name: "cli-key", scopes: ["effects:read"] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");

    // Plaintext key shown exactly once, in the documented format.
    const plaintext = res.body.data.key as string;
    expect(plaintext).toMatch(/^rk_live_[0-9A-Za-z]{32}$/);

    // Masked record returned alongside it.
    const apiKey = res.body.data.apiKey;
    expect(apiKey.name).toBe("cli-key");
    expect(apiKey.scopes).toEqual(["effects:read"]);
    expect(apiKey.masked).toBe(`rk_live_…${plaintext.slice(-4)}`);
    expect(apiKey.revokedAt).toBeNull();
    expect(apiKey.lastUsedAt).toBeNull();
    // The masked record must never carry secret material.
    expect(apiKey).not.toHaveProperty("hash");
    expect(apiKey).not.toHaveProperty("lookupHash");
    expect(JSON.stringify(apiKey)).not.toContain(plaintext);

    // DB round-trip — hash + lookup handle at rest, plaintext absent.
    const row = await db.apiKey.findUnique({
      where: { id: apiKey.id as string },
    });
    expect(row).not.toBeNull();
    expect(row!.hash.startsWith("$2")).toBe(true); // bcrypt
    expect(row!.hash).not.toBe(plaintext);
    expect(row!.lookupHash).toMatch(/^[0-9a-f]{64}$/); // sha256 handle
    expect(row!.ownerId).toBe(user.id);
    expect(row!.scopesJson).toBe(JSON.stringify(["effects:read"]));
    // Whole row must not contain the plaintext anywhere.
    expect(JSON.stringify(row)).not.toContain(plaintext);
  });

  it("2. use — X-API-Key authenticates on /effects (200) and touches lastUsedAt", async () => {
    const user = await registerUser("use");
    const key = await mintKey(user, "sdk-key", ["effects:read"]);

    const res = await getEffects(key.plaintext);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // lastUsedAt is written fire-and-forget — poll briefly for it.
    const touched = await waitFor(async () => {
      const row = await db.apiKey.findUnique({
        where: { id: key.id },
        select: { lastUsedAt: true },
      });
      return row?.lastUsedAt !== null && row?.lastUsedAt !== undefined;
    });
    expect(touched).toBe(true);
  });

  it("3. scope enforcement — a recipes:read key on /effects is 403 FORBIDDEN", async () => {
    const user = await registerUser("scope");
    const key = await mintKey(user, "recipes-only", ["recipes:read"]);

    const res = await getEffects(key.plaintext);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toContain("effects:read");
    expect(res.body.error.message).toContain("recipes:read");
  });

  it("4. list — masked keys only, owner-scoped", async () => {
    const owner = await registerUser("list-owner");
    const other = await registerUser("list-other");
    const key = await mintKey(owner, "list-me", ["effects:read"]);

    const res = await request(app)
      .get("/api/v1/auth/api-keys")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.count).toBe(1);

    const listed = res.body.data[0];
    expect(listed.id).toBe(key.id);
    expect(listed.masked).toBe(key.masked);
    expect(listed.name).toBe("list-me");
    expect(listed.scopes).toEqual(["effects:read"]);
    // No plaintext, no hash material in the listing.
    expect(JSON.stringify(res.body)).not.toContain(key.plaintext);
    expect(listed).not.toHaveProperty("hash");
    expect(listed).not.toHaveProperty("lookupHash");

    // Owner-scoping — another user's list does not include this key.
    const otherRes = await request(app)
      .get("/api/v1/auth/api-keys")
      .set("Authorization", `Bearer ${other.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(otherRes.status).toBe(200);
    expect(
      (otherRes.body.data as Array<{ id: string }>).some((k) => k.id === key.id),
    ).toBe(false);
  });

  it("5. revoke — 200 with revokedAt; the key then yields 401; double-revoke 409; foreign id 404", async () => {
    const user = await registerUser("revoke");
    const key = await mintKey(user, "revoke-me", ["effects:read"]);

    const del = await request(app)
      .delete(`/api/v1/auth/api-keys/${key.id}`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(del.status).toBe(200);
    expect(del.body.data.revokedAt).not.toBeNull();

    // The revoked record still lists (audit history) with revokedAt set.
    const list = await request(app)
      .get("/api/v1/auth/api-keys")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    const listed = (list.body.data as Array<{ id: string; revokedAt: string | null }>)
      .find((k) => k.id === key.id);
    expect(listed?.revokedAt).not.toBeNull();

    // USE AFTER REVOKE → 401 (the core acceptance criterion).
    const res = await getEffects(key.plaintext);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toMatch(/invalid or revoked api key/i);

    // Double revoke → 409.
    const again = await request(app)
      .delete(`/api/v1/auth/api-keys/${key.id}`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(again.status).toBe(409);

    // Someone else's key id (or a bogus one) reads as 404 — no leak.
    const stranger = await registerUser("revoke-stranger");
    const foreign = await request(app)
      .delete(`/api/v1/auth/api-keys/${key.id}`)
      .set("Authorization", `Bearer ${stranger.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(foreign.status).toBe(404);
  });
});

describe("issue #65 — X-API-Key composes with requireAuth on protected routes", () => {
  it("a wildcard key authenticates on GET /auth/me as its owner", async () => {
    const user = await registerUser("wildcard");
    const key = await mintKey(user, "wildcard-key", ["*"]);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", key.plaintext);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
    expect(res.body.data.email).toBeDefined();
    // No password material ever.
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });

  it("a narrow-scope key is rejected on protected routes with 403 (fail closed)", async () => {
    const user = await registerUser("narrow");
    const key = await mintKey(user, "narrow-key", ["effects:read"]);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", key.plaintext);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toContain("*");
  });

  it("Bearer JWT traffic on protected routes is unchanged", async () => {
    const user = await registerUser("bearer");
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${user.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  it("public effects reads stay public for anonymous callers (regression)", async () => {
    const res = await request(app)
      .get("/api/v1/effects")
      .set("X-Forwarded-For", uniqueIp())
      .query({ limit: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("malformed and unknown keys are 401 on effects", async () => {
    const bad = await getEffects("rk_live_notactuallyakey");
    expect(bad.status).toBe(401);

    const unknown = await getEffects("rk_live_" + "9".repeat(32));
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("issue #65 — management endpoint guards", () => {
  it("create requires a Bearer JWT — 401 anonymous", async () => {
    const res = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("X-Forwarded-For", uniqueIp())
      .send({ name: "anon" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("create rejects X-API-Key credentials — a key must not mint keys", async () => {
    const user = await registerUser("no-selfmint");
    const key = await mintKey(user, "no-selfmint", ["*"]);

    const res = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", key.plaintext)
      .send({ name: "self-minted" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/bearer/i);
  });

  it("list rejects X-API-Key credentials too", async () => {
    const user = await registerUser("no-selflist");
    const key = await mintKey(user, "no-selflist", ["*"]);

    const res = await request(app)
      .get("/api/v1/auth/api-keys")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", key.plaintext);
    expect(res.status).toBe(401);
  });

  it("unknown scope → 400 VALIDATION_ERROR; duplicate name → 409; default scope is effects:read", async () => {
    const user = await registerUser("validation");

    const badScope = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({ name: "bad-scope", scopes: ["totally:bogus"] });
    expect(badScope.status).toBe(400);
    expect(badScope.body.error.code).toBe("VALIDATION_ERROR");

    // Omitted scopes → least-privilege default.
    const defaulted = await mintKey(user, "default-scope", undefined);
    expect(defaulted.scopes).toEqual(["effects:read"]);

    // Duplicate name for the same owner → 409.
    const dup = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({ name: "default-scope", scopes: ["effects:read"] });
    expect(dup.status).toBe(409);
    expect(dup.body.error.message).toMatch(/already exists/i);
  });
});

describe("issue #65 — per-key rate limiting", () => {
  it("exceeding the per-key budget returns 429 + Retry-After (via the pluggable limiter seam)", async () => {
    const original = getApiKeyRateLimiter();
    // A stub tier of 2 — independent of the route's configured tier, so
    // this test proves the seam (any limiter implementation can decide).
    const STUB_LIMIT = 2;
    let used = 0;
    const twoThenBlock: ApiKeyRateLimiter = {
      consume: (_keyId: string, _tier: RateLimitTier): ApiKeyRateLimitDecision => {
        used += 1;
        return {
          allowed: used <= STUB_LIMIT,
          limit: STUB_LIMIT,
          remaining: Math.max(0, STUB_LIMIT - used),
          retryAfterSec: 60,
        };
      },
    };

    try {
      setApiKeyRateLimiter(twoThenBlock);
      const user = await registerUser("ratelimit");
      const key = await mintKey(user, "ratelimited", ["effects:read"]);

      // First two requests pass…
      expect((await getEffects(key.plaintext)).status).toBe(200);
      expect((await getEffects(key.plaintext)).status).toBe(200);

      // …the third is throttled per-key.
      const blocked = await getEffects(key.plaintext);
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe("RATE_LIMITED");
      expect(blocked.headers["retry-after"]).toBe("60");
      expect(blocked.headers["x-ratelimit-limit"]).toBe(String(STUB_LIMIT));
    } finally {
      setApiKeyRateLimiter(original);
    }
  });
});
