/**
 * Integration tests — /api/v1/icons (PF-007, issue #93 module 11/15).
 *
 * Static catalog (curated 50 icons), full pagination + filters:
 *
 *   1. GET /                          → 200 { data, meta: page/limit/total/totalPages }
 *   2. GET /?search=arrow&limit=3     → name/tag search narrows results
 *   3. GET /?category=navigation      → category filter
 *   4. GET /:name (seeded)            → 200 single envelope with svgPath
 *   5. GET /:name (unknown)           → 404 error envelope
 *   6. invalid category value         → 400 VALIDATION_ERROR (enum)
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("icons", () => {
  it("1. GET / — paginated icon catalog (50 curated icons)", async () => {
    const res = await hit(app, "get", "/api/v1/icons?limit=2");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 50, totalPages: 25 });
    const first = res.body.data[0];
    expect(typeof first.name).toBe("string");
    expect(typeof first.category).toBe("string");
    expect(Array.isArray(first.tags)).toBe(true);
    expect(typeof first.svgPath).toBe("string");
    expect(Array.isArray(first.sizes)).toBe(true);
  });

  it("2. GET /?search=arrow — search narrows to matching icons", async () => {
    const res = await hit(app, "get", "/api/v1/icons?search=arrow&limit=10");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.total).toBeLessThan(50);
    for (const icon of res.body.data) {
      const matches =
        icon.name.includes("arrow") || icon.tags.some((t: string) => t.includes("arrow"));
      expect(matches).toBe(true);
    }
  });

  it("3. GET /?category=navigation — every icon is from that category", async () => {
    const res = await hit(app, "get", "/api/v1/icons?category=navigation&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(8);
    for (const icon of res.body.data) {
      expect(icon.category).toBe("navigation");
    }
  });

  it("4. GET /:name — seeded icon 200 single envelope", async () => {
    const res = await hit(app, "get", "/api/v1/icons/house");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.name).toBe("house");
    expect(typeof res.body.data.svgPath).toBe("string");
  });

  it("5. GET /:name unknown → 404 NOT_FOUND error envelope", async () => {
    const res = await hit(app, "get", "/api/v1/icons/probe-123");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("6. invalid category → 400 VALIDATION_ERROR (enum guard)", async () => {
    const res = await hit(app, "get", "/api/v1/icons?category=not-a-category");
    expect(res.status).toBe(400);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
