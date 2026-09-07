/**
 * Integration tests — /api/v1/analytics (PF-007, issue #93 module 13/15).
 *
 * Four read-only stat endpoints (all static snapshots):
 *
 *   1. GET /overview → 200 { data: object } — platform KPIs + geoData
 *   2. GET /effects  → 200 { data: array, meta } — top effects usage
 *   3. GET /traffic  → 200 { data: array, meta } — traffic timeseries
 *   4. GET /devices  → 200 { data: object } — device split (sums to 1)
 *
 * Note: overview/devices return SINGLETON envelopes (data object, meta
 * optional) — pinned honestly, per API.md "single-resource responses
 * omit meta".
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("analytics", () => {
  it("1. GET /overview — platform KPI singleton envelope", async () => {
    const res = await hit(app, "get", "/api/v1/analytics/overview");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(Array.isArray(res.body.data)).toBe(false);
    expect(typeof res.body.data.totalUsers).toBe("number");
    expect(typeof res.body.data.apiCalls).toBe("number");
    expect(typeof res.body.data.avgResponseTime).toBe("number");
    expect(typeof res.body.data.activeEffects).toBe("number");
    expect(Array.isArray(res.body.data.geoData)).toBe(true);
    const geo = res.body.data.geoData[0];
    expect(typeof geo.country).toBe("string");
    expect(typeof geo.visitors).toBe("number");
    expect(typeof geo.share).toBe("number");
  });

  it("2. GET /effects — top-effects collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/analytics/effects");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.uses).toBe("number");
    expect(typeof res.body.meta.count).toBe("number");
  });

  it("3. GET /traffic — traffic timeseries collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/analytics/traffic");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(typeof first.date).toBe("string");
    expect(typeof first.visitors).toBe("number");
    expect(typeof first.pageViews).toBe("number");
    expect(typeof res.body.meta.totalVisitors).toBe("number");
    expect(typeof res.body.meta.totalPageViews).toBe("number");
  });

  it("4. GET /devices — device split singleton, shares sum to 1", async () => {
    const res = await hit(app, "get", "/api/v1/analytics/devices");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data).toHaveProperty("desktop");
    expect(res.body.data).toHaveProperty("mobile");
    expect(res.body.data).toHaveProperty("tablet");
    const sum =
      res.body.data.desktop + res.body.data.mobile + res.body.data.tablet;
    expect(sum).toBeCloseTo(1, 2);
  });
});
