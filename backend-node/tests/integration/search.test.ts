/**
 * Integration tests — /api/v1/search (PF-007, issue #93 module 1/15).
 *
 * Search is Prisma-backed: effects are indexed into the `SearchIndex`
 * table on first use (1959 rows) and queried with a case-insensitive
 * LIKE. `GET /recent` and `GET /suggestions` return static snapshots.
 *
 * Pins (honest, as of this PR):
 *   1. GET  /search?q=neon           → 200 { data: array, meta: count/total/query/took }
 *   2. GET  /search?q=<no match>     → 200 { data: [], meta: { count: 0, total: 0 } }
 *   3. GET  /search (no q)           → 400 documented error envelope (BAD_REQUEST)
 *      — previously a non-standard `{ error: "q is required" }` body; fixed
 *      in this PR (see PR body: production fix #1).
 *   4. GET  /search?limit=2          → meta count respects the limit
 *   5. POST /search (body)           → 200 envelope, same result shape as GET
 *   6. GET  /search/recent           → 200 static snapshot (5 entries)
 *   7. GET  /search/suggestions?q=ne → 200 array + meta { count, query }
 *   8. GET  /search/suggestions (no q) → 400 VALIDATION_ERROR
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("GET /api/v1/search", () => {
  it("1. ?q=neon — 200 envelope with scored effect hits", async () => {
    const res = await hit(app, "get", "/api/v1/search?q=neon");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Each hit: { id, type: "effect", title, description, url, tags, score }
    const first = res.body.data[0];
    expect(first.type).toBe("effect");
    expect(typeof first.title).toBe("string");
    expect(typeof first.score).toBe("number");
    expect(res.body.meta.total).toBeGreaterThan(0);
    expect(res.body.meta.query).toBe("neon");
    expect(typeof res.body.meta.took).toBe("number");
  });

  it("2. ?q=<no-match> — 200 with an empty (honest) result set", async () => {
    const res = await hit(app, "get", "/api/v1/search?q=zzzznomatchxyz");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.count).toBe(0);
    expect(res.body.meta.total).toBe(0);
  });

  it("3. missing q — 400 with the DOCUMENTED error envelope (fix: was non-standard)", async () => {
    const res = await hit(app, "get", "/api/v1/search");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.message).toMatch(/q.*query parameter/i);
    expect(typeof res.body.requestId).toBe("string");
  });

  it("4. ?q=neon&limit=2 — limit caps the returned page", async () => {
    const res = await hit(app, "get", "/api/v1/search?q=neon&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.count).toBeLessThanOrEqual(2);
  });

  it("5. POST / — body search returns the same envelope shape as GET", async () => {
    const res = await hit(app, "post", "/api/v1/search", {
      body: { query: "gradient" },
    });

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.meta.query).toBe("gradient");
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("6. GET /recent — static snapshot, 5 seeded entries", async () => {
    const res = await hit(app, "get", "/api/v1/search/recent");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.meta.count).toBe(5);
    const first = res.body.data[0];
    expect(typeof first.query).toBe("string");
    expect(typeof first.results).toBe("number");
    expect(typeof first.ts).toBe("string");
  });

  it("7. GET /suggestions?q=ne — prefix suggestions with echoed query", async () => {
    const res = await hit(app, "get", "/api/v1/search/suggestions?q=ne");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(typeof res.body.data[0]).toBe("string");
    expect(res.body.meta.query).toBe("ne");
  });

  it("8. GET /suggestions without q — 400 VALIDATION_ERROR", async () => {
    const res = await hit(app, "get", "/api/v1/search/suggestions");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});
