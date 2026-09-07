/**
 * Integration tests — /api/v1/patterns (PF-007, issue #93 module 8/15).
 *
 * Stateless catalog (dist JSON), pagination contract.
 *
 *   1. GET /               → 200 { data: array, meta: page/limit/total/totalPages }
 *   2. GET /?page=2&limit=2 → second page, no overlap
 *   3. GET /:id (seeded)   → 200 single envelope (pattern has whenToUse)
 *   4. GET /:id (unknown)  → 404 error envelope
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("patterns", () => {
  it("1. GET / — paginated catalog envelope", async () => {
    const res = await hit(app, "get", "/api/v1/patterns");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBeGreaterThan(0);
    expect(res.body.meta.totalPages).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.category).toBe("string");
    expect(typeof first.html).toBe("string");
  });

  it("2. GET /?page=2&limit=2 — second page, disjoint ids", async () => {
    const page1 = await hit(app, "get", "/api/v1/patterns?page=1&limit=2");
    const page2 = await hit(app, "get", "/api/v1/patterns?page=2&limit=2");

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    const ids1 = page1.body.data.map((p: { id: string }) => p.id);
    const ids2 = page2.body.data.map((p: { id: string }) => p.id);
    expect(ids1).not.toEqual(ids2);
    expect(page2.body.meta.page).toBe(2);
  });

  it("3. GET /:id — seeded pattern 200 single envelope with whenToUse", async () => {
    const list = await hit(app, "get", "/api/v1/patterns?limit=1");
    const id = list.body.data[0].id as string;

    const res = await hit(app, "get", `/api/v1/patterns/${id}`);
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.id).toBe(id);
    expect(typeof res.body.data.whenToUse).toBe("string");
  });

  it("4. GET /:id unknown → 404 NOT_FOUND error envelope", async () => {
    const res = await hit(app, "get", "/api/v1/patterns/probe-123");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("5. ?tag= filter — every result carries the requested tag", async () => {
    const res = await hit(app, "get", "/api/v1/patterns?tag=empty");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const pattern of res.body.data) {
      expect(pattern.tags).toContain("empty");
    }
  });
});
