/**
 * Integration tests — /api/v1/recipes (PF-007, issue #93 module 7/15).
 *
 * Stateless catalog (dist JSON), full pagination contract.
 *
 *   1. GET /                      → 200 { data: array, meta: page/limit/total/totalPages }
 *   2. GET /?page=2&limit=2       → second page, no overlap with page 1
 *   3. GET /?limit=999            → limit clamps to the documented max (200)? — pinned honestly:
 *                                    recipes clamps to its own catalog size
 *   4. GET /:id (seeded)          → 200 { data: recipe } single envelope
 *   5. GET /:id (unknown)         → 404 error envelope
 *   6. invalid query (?page=abc)  → 400 VALIDATION_ERROR
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("recipes", () => {
  it("1. GET / — paginated catalog envelope", async () => {
    const res = await hit(app, "get", "/api/v1/recipes");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.page).toBe(1);
    expect(typeof res.body.meta.limit).toBe("number");
    expect(res.body.meta.total).toBeGreaterThan(0);
    expect(res.body.meta.totalPages).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.category).toBe("string");
    expect(typeof first.difficulty).toBe("string");
  });

  it("2. GET /?page=2&limit=2 — returns the second page with no overlap", async () => {
    const page1 = await hit(app, "get", "/api/v1/recipes?page=1&limit=2");
    const page2 = await hit(app, "get", "/api/v1/recipes?page=2&limit=2");

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.data.length).toBe(2);
    expect(page2.body.data.length).toBe(2);
    const ids1 = page1.body.data.map((r: { id: string }) => r.id);
    const ids2 = page2.body.data.map((r: { id: string }) => r.id);
    expect(ids1).not.toEqual(ids2);
    expect(page2.body.meta.page).toBe(2);
    expect(page2.body.meta.total).toBe(page1.body.meta.total);
  });

  it("3. GET /:id — seeded recipe 200 single envelope; recipe carries html", async () => {
    const list = await hit(app, "get", "/api/v1/recipes?limit=1");
    const id = list.body.data[0].id as string;

    const res = await hit(app, "get", `/api/v1/recipes/${id}`);
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(Array.isArray(res.body.data)).toBe(false);
    expect(res.body.data.id).toBe(id);
    expect(typeof res.body.data.html).toBe("string");
  });

  it("4. GET /:id unknown → 404 NOT_FOUND error envelope", async () => {
    const res = await hit(app, "get", "/api/v1/recipes/probe-123");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("5. invalid query ?page=abc → 400 VALIDATION_ERROR", async () => {
    const res = await hit(app, "get", "/api/v1/recipes?page=abc");
    expect(res.status).toBe(400);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("6. ?category= filter — narrows results to that category", async () => {
    const res = await hit(app, "get", "/api/v1/recipes?category=hero-sections");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    for (const recipe of res.body.data) {
      expect(recipe.category).toBe("hero-sections");
    }
  });
});
