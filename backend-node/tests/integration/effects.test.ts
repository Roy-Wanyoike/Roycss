/**
 * Integration tests — GET /api/v1/effects + /search + /categories + /:id
 *
 * 6 tests covering the documented happy + error paths:
 *   1. list + paginate — GET /effects returns 1749 total effects with meta
 *   2. page + limit — GET /effects?page=2&limit=10 returns page 2 of 10
 *   3. unknown id 404 — GET /effects/:id with a non-existent id → 404
 *   4. search by query — GET /effects/search?q=pulse returns scored hits
 *   5. empty-q 400 — GET /effects/search?q= → 400 VALIDATION_ERROR
 *   6. categories list — GET /effects/categories returns distinct list
 *
 * Test isolation:
 *   - All effects tests are READ-ONLY against the in-memory effects
 *     catalog (loaded from `dist/effects.json`). They never touch the
 *     Prisma DB so no FK cleanup is needed.
 *   - A unique `X-Forwarded-For` per request keeps the general rate
 *     limiter from tripping.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";

const app = createApp();

/** Unique IP per request — see auth.test.ts for rationale. */
function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.${Math.floor(Math.random() * 250)}.${rand}`;
}

describe("GET /api/v1/effects", () => {
  it("1. list + paginate — returns the full catalog (1959)", async () => {
    const res = await request(app)
      .get("/api/v1/effects")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    // Default limit is 24 per the schema, so the page is bounded.
    expect(res.body.data.length).toBeLessThanOrEqual(24);
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta.total).toBe(1959);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(24);
    // 1749 / 24 = 72.875 → 73 pages
    expect(res.body.meta.totalPages).toBe(82);
  });

  it("2. page + limit — ?page=2&limit=10 returns the second 10-item page", async () => {
    const res = await request(app)
      .get("/api/v1/effects?page=2&limit=10")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(10);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.limit).toBe(10);
    expect(res.body.meta.total).toBe(1959);
    // 1749 / 10 = 174.9 → 175 pages
    expect(res.body.meta.totalPages).toBe(196);

    // Each item in the page should have the canonical Effect shape.
    const first = res.body.data[0];
    expect(first).toHaveProperty("id");
    expect(typeof first.id).toBe("string");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("category");
    expect(first).toHaveProperty("previewType");
  });

  it("3. unknown id 404 — GET /effects/<bogus> returns 404 NOT_FOUND", async () => {
    const res = await request(app)
      .get("/api/v1/effects/this-effect-id-does-not-exist-in-the-catalog")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it("4. search by query — ?q=pulse returns scored hits mentioning 'pulse'", async () => {
    const res = await request(app)
      .get("/api/v1/effects/search?q=pulse")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.query).toBe("pulse");
    // Every hit should mention "pulse" somewhere in its searchable text.
    for (const effect of res.body.data) {
      const haystack = (
        effect.id +
        " " +
        effect.name +
        " " +
        effect.description +
        " " +
        effect.category +
        " " +
        (effect.tags ?? []).join(" ")
      ).toLowerCase();
      expect(haystack).toContain("pulse");
    }
  });

  it("5. empty-q 400 — GET /effects/search?q= returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .get("/api/v1/effects/search?q=")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    // The Zod schema requires `q` to be at least 1 char — find that
    // issue in the details array.
    const details = res.body.error.details as Array<{ path: string; message: string }>;
    expect(Array.isArray(details)).toBe(true);
    const qIssue = details.find((d) => d.path.includes("q"));
    expect(qIssue).toBeDefined();
  });

  it("6. categories list — GET /effects/categories returns a non-empty distinct list", async () => {
    const res = await request(app)
      .get("/api/v1/effects/categories")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.count).toBe(res.body.data.length);

    // Distinct — no duplicates.
    const seen = new Set<string>();
    for (const cat of res.body.data) {
      expect(seen.has(cat)).toBe(false);
      seen.add(cat);
    }

    // Sanity-check that at least one expected category is present
    // (animations is the first effect's category in dist/effects.json).
    expect(res.body.data).toContain("animations");
  });
});
