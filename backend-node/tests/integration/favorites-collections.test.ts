/**
 * Integration tests — /api/v1/favorites + /api/v1/collections
 * (PF-007, issue #93 modules 3/15 and 4/15).
 *
 * HONESTY PIN: as of this PR there are NO HTTP routes for favorites or
 * collections — the Prisma schema defines the `EffectFavorite` and
 * `Collection` models (with enforced FKs to User, see prisma/schema.prisma
 * and the test-DB wipe list in tests/integration/setup.ts), but no module
 * mounts a router for them. The contract harness confirms the absence
 * from the live route table; these tests pin that absence on the wire so
 * the day a router appears, this suite forces a deliberate update
 * (fail-on-missing in both directions).
 *
 *   GET /api/v1/favorites   → 404 NOT_FOUND (documented error envelope)
 *   GET /api/v1/collections → 404 NOT_FOUND (documented error envelope)
 *   POST /api/v1/favorites  → 404 (no mutating surface either)
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { listRoutes } from "../helpers/route-walker.js";
import { hit, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("favorites + collections — HTTP surface honestly absent today", () => {
  it("the live router registers no favorites/collections routes (Prisma models only)", () => {
    const paths = listRoutes(app).map((r) => r.path);
    const favorites = paths.filter((p) => p.includes("favorite"));
    const collections = paths.filter((p) => /\/collections(\/|$)/.test(p));
    expect(favorites, "no favorites route may be mounted yet").toEqual([]);
    expect(collections, "no collections route may be mounted yet").toEqual([]);
  });

  it("GET /api/v1/favorites — 404 NOT_FOUND error envelope (route not found)", async () => {
    const res = await hit(app, "get", "/api/v1/favorites");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /api/v1/collections — 404 NOT_FOUND error envelope (route not found)", async () => {
    const res = await hit(app, "get", "/api/v1/collections");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST /api/v1/favorites — 404 too (no mutating surface either)", async () => {
    const res = await hit(app, "post", "/api/v1/favorites", { body: {} });
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
  });
});
