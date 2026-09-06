/**
 * Integration tests — observability (PF-009 / issue #94 A9).
 *
 *   1. GET /health/ready → 200 { status, checks } with db/registry/
 *      search all `connected` (SQLite + effects.json + SearchIndex are
 *      all live in the test environment)
 *   2. requestId is echoed end-to-end: an inbound X-Request-Id is
 *      returned as X-Request-Id on the response
 *   3. GET /metrics/routes — 401 anonymous, 403 non-admin, 200 admin
 *      with per-route p50/p95/p99 latency entries
 *   4. Recorded latencies land under the ROUTE PATTERN (not the
 *      concrete URL) — :id params are bucketed by pattern
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";

const app = createApp();

function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.${Math.floor(Math.random() * 250)}.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9";

interface RegisteredUser {
  id: string;
  accessToken: string;
}

async function registerUser(prefix: string): Promise<RegisteredUser> {
  const email = `${prefix}+${randomUUID()}@example.com`;
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

/** Create an org + an ADMIN membership for the given user. */
async function makeAdmin(userId: string): Promise<string> {
  const orgId = `org-${randomUUID()}`;
  await db.organization.create({
    data: { id: orgId, slug: orgId, name: `Org ${orgId.slice(0, 8)}`, plan: "team", seats: 10 },
  });
  await db.membership.create({
    data: { orgId, userId, role: "ADMIN" },
  });
  return orgId;
}

describe("GET /api/v1/health/ready (issue #94 A9)", () => {
  it("1. reports db + registry + search checks, 200 when all connected", async () => {
    const res = await request(app)
      .get("/api/v1/health/ready")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body.checks).toEqual({
      db: "connected",
      registry: "connected",
      search: "connected",
    });
    // Registry detail: effects dataset is registered and indexed.
    expect(res.body.registry.items).toBeGreaterThan(1000);
    expect(res.body.registry.types).toContain("effect");
    expect(res.body.search.indexed).toBeGreaterThan(0);
  });

  it("2. echoes the inbound X-Request-Id (requestId propagation)", async () => {
    const res = await request(app)
      .get("/api/v1/health/ready")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-Request-Id", "req-test-4242");

    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBe("req-test-4242");
    // Generated when absent (non-empty string).
    const bare = await request(app)
      .get("/api/v1/health/ready")
      .set("X-Forwarded-For", uniqueIp());
    expect(typeof bare.headers["x-request-id"]).toBe("string");
    expect((bare.headers["x-request-id"] as string).length).toBeGreaterThan(0);
  });
});

describe("GET /api/v1/metrics/routes (issue #94 A9)", () => {
  it("3. auth + platform-ADMIN guarded; admin sees latency histograms", async () => {
    // Anonymous → 401.
    const anon = await request(app)
      .get("/api/v1/metrics/routes")
      .set("X-Forwarded-For", uniqueIp());
    expect(anon.status).toBe(401);

    // Authenticated but no membership → 403.
    const plain = await registerUser("metricsplain");
    const noRole = await request(app)
      .get("/api/v1/metrics/routes")
      .set("Authorization", `Bearer ${plain.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(noRole.status).toBe(403);
    expect(noRole.body.error.message).toMatch(
      /ADMIN or higher in at least one organization/i,
    );

    // Make some traffic, then query as an admin.
    await request(app)
      .get("/api/v1/effects?page=1&limit=5")
      .set("X-Forwarded-For", uniqueIp());
    const effectId = (await request(app)
      .get("/api/v1/effects?page=1&limit=5")
      .set("X-Forwarded-For", uniqueIp())).body.data[0].id as string;
    await request(app)
      .get(`/api/v1/effects/${effectId}`)
      .set("X-Forwarded-For", uniqueIp());

    const admin = await registerUser("metricsadmin");
    await makeAdmin(admin.id);
    const ok = await request(app)
      .get("/api/v1/metrics/routes")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body.data)).toBe(true);
    expect(ok.body.meta.count).toBeGreaterThan(0);

    const entry = (ok.body.data as Array<Record<string, unknown>>).find(
      (e) => e.route === "/api/v1/effects/:id" && e.method === "GET",
    );
    expect(entry).toBeDefined();
    expect(entry!.count).toBeGreaterThanOrEqual(1);
    for (const key of ["p50Ms", "p95Ms", "p99Ms", "avgMs", "minMs", "maxMs"]) {
      expect(typeof entry![key]).toBe("number");
    }
    expect(entry!.lastStatus).toBe(200);
  });

  it("4. latencies are bucketed by route PATTERN, not concrete URL", async () => {
    const admin = await registerUser("metricsadmin2");
    await makeAdmin(admin.id);

    // Hit the same route pattern with DIFFERENT concrete ids.
    const firstId = (await request(app)
      .get("/api/v1/effects?page=1&limit=2")
      .set("X-Forwarded-For", uniqueIp())).body.data[0].id as string;
    const secondId = (await request(app)
      .get("/api/v1/effects?page=2&limit=2")
      .set("X-Forwarded-For", uniqueIp())).body.data[0].id as string;
    await request(app)
      .get(`/api/v1/effects/${firstId}`)
      .set("X-Forwarded-For", uniqueIp());
    await request(app)
      .get(`/api/v1/effects/${secondId}`)
      .set("X-Forwarded-For", uniqueIp());
    await request(app)
      .get("/api/v1/effects/totally-bogous-id-xyz")
      .set("X-Forwarded-For", uniqueIp());

    const res = await request(app)
      .get("/api/v1/metrics/routes")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());

    const entry = (res.body.data as Array<Record<string, number | string>>).find(
      (e) => e.route === "/api/v1/effects/:id" && e.method === "GET",
    );
    // 2 hits + 1 (404) — all bucketed under the same pattern.
    expect((entry!.count as number)).toBeGreaterThanOrEqual(3);
    // The concrete ids must NOT appear as separate buckets.
    const routes = (res.body.data as Array<{ route: string }>).map(
      (e) => e.route,
    );
    expect(routes).not.toContain(`/api/v1/effects/${firstId}`);
  });
});
