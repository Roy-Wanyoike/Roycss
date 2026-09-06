/**
 * Integration tests — /api/v1/motion (PF-007, issue #93 module 12/15).
 *
 * Static motion library:
 *
 *   1. GET /effects       → 200 envelope, full motion effect catalog
 *   2. GET /presets       → 200 envelope, 8 curated presets
 *   3. GET /categories    → 200 envelope, 5 categories (covered in
 *                           categories.test.ts too — pinned here for the
 *                           motion module story)
 *   4. GET /effects/:id   → 200 single envelope (keyframes + cssCode) · 404 unknown
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("motion", () => {
  it("1. GET /effects — large motion catalog envelope", async () => {
    const res = await hit(app, "get", "/api/v1/motion/effects");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(100);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.category).toBe("string");
    expect(typeof first.duration).toBe("number");
    expect(typeof first.keyframes).toBe("string");
    expect(typeof first.cssCode).toBe("string");
  });

  it("2. GET /presets — 8 curated preset combinations", async () => {
    const res = await hit(app, "get", "/api/v1/motion/presets");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.meta.count).toBe(8);
    const first = res.body.data[0];
    expect(typeof first.name).toBe("string");
    expect(Array.isArray(first.effects)).toBe(true);
    expect(first.effects.length).toBeGreaterThan(0);
    expect(typeof first.description).toBe("string");
  });

  it("3. GET /categories — 5 category buckets with counts", async () => {
    const res = await hit(app, "get", "/api/v1/motion/categories");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.meta.count).toBe(5);
    const buckets = res.body.data as Array<{ category: string; count: number }>;
    const total = buckets.reduce((acc, b) => acc + b.count, 0);
    // The 5 category counts must cover the whole catalog.
    const all = await hit(app, "get", "/api/v1/motion/effects");
    expect(total).toBe(all.body.data.length);
  });

  it("4. GET /effects/:id — seeded effect 200 single envelope; unknown 404", async () => {
    const ok = await hit(app, "get", "/api/v1/motion/effects/pulse-glow");
    expect(ok.status).toBe(200);
    expectSuccessEnvelope(ok);
    expect(ok.body.data.id).toBe("pulse-glow");
    expect(typeof ok.body.data.keyframes).toBe("string");

    const missing = await hit(app, "get", "/api/v1/motion/effects/probe-123");
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });
});
