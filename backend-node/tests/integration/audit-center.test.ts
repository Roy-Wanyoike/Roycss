/**
 * Integration tests — /api/v1/audit-center (PF-007, issue #93 module 5/15).
 *
 * Audit Center returns a static snapshot (no query params on projects/
 * trends; issues supports ?projectId= and ?status= filters).
 *
 *   1. GET /projects          → 200 envelope, snapshot projects with scores
 *   2. GET /projects/:id      → 200 for a seeded id · 404 error envelope otherwise
 *   3. GET /issues            → 200 envelope; ?projectId= filters the snapshot
 *   4. GET /issues?status=    → filter by status
 *   5. GET /issues?projectId=<bogus> → 200 with empty data (honest empty filter)
 *   6. GET /trends            → 200 6-month trend series
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("audit-center", () => {
  it("1. GET /projects — snapshot projects with per-category scores", async () => {
    const res = await hit(app, "get", "/api/v1/audit-center/projects");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(3);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.score).toBe("number");
    expect(typeof first.status).toBe("string");
    expect(Array.isArray(first.categories)).toBe(true);
    expect(first.categories[0]).toHaveProperty("name");
    expect(first.categories[0]).toHaveProperty("score");
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it("2. GET /projects/:id — seeded id 200; unknown id 404 error envelope", async () => {
    const ok = await hit(app, "get", "/api/v1/audit-center/projects/audit-proj-marketing");
    expect(ok.status).toBe(200);
    expectSuccessEnvelope(ok);
    expect(ok.body.data.id).toBe("audit-proj-marketing");

    const missing = await hit(app, "get", "/api/v1/audit-center/projects/probe-123");
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  it("3. GET /issues — snapshot issues; ?projectId= filters to one project", async () => {
    const all = await hit(app, "get", "/api/v1/audit-center/issues");
    expect(all.status).toBe(200);
    expectSuccessEnvelope(all);
    expect(all.body.data.length).toBeGreaterThan(0);
    expect(typeof all.body.data[0].projectId).toBe("string");
    expect(typeof all.body.data[0].severity).toBe("string");

    const filtered = await hit(
      app,
      "get",
      "/api/v1/audit-center/issues?projectId=audit-proj-docs",
    );
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.length).toBeGreaterThan(0);
    for (const issue of filtered.body.data) {
      expect(issue.projectId).toBe("audit-proj-docs");
    }
  });

  it("4. GET /issues?status=open — status filter narrows the snapshot", async () => {
    const res = await hit(app, "get", "/api/v1/audit-center/issues?status=open");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const issue of res.body.data) {
      expect(issue.status).toBe("open");
    }
  });

  it("5. GET /issues?projectId=<bogus> — honest empty result, not a 404", async () => {
    const res = await hit(
      app,
      "get",
      "/api/v1/audit-center/issues?projectId=does-not-exist",
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.count).toBe(0);
  });

  it("6. GET /trends — 6-month score/issue series", async () => {
    const res = await hit(app, "get", "/api/v1/audit-center/trends");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBe(6);
    const first = res.body.data[0];
    expect(/^\d{4}-\d{2}$/.test(first.month)).toBe(true);
    expect(typeof first.score).toBe("number");
    expect(typeof first.issues).toBe("number");
  });
});
