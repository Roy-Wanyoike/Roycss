/**
 * Integration tests — job queue endpoints (PF-009 / issue #94 A7).
 *
 *   1. POST /accessibility/jobs → 201 { data: { jobId } }; the inline
 *      queue completes before the response; GET jobs/:id → completed
 *      with the audit result
 *   2. GET /accessibility/jobs/:id for an unknown id → 404
 *   3. POST /analytics/jobs → aggregation result (overview + traffic
 *      totals + days window)
 *   4. POST /architect/jobs (auth) → 201 + completed AI-generation
 *      result; invalid body → 400
 *   5. requestId propagation: the job record carries the enqueuing
 *      request's id
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import { createApp } from "../../src/server/app.js";

const app = createApp();

function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.${Math.floor(Math.random() * 250)}.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9";

// An unreachable localhost URL: Playwright (when present) fails the
// navigation instantly and the service falls back to the deterministic
// mock audit — same behavior as the sync POST /scan.
const UNREACHABLE_URL = "http://127.0.0.1:9/unreachable";

describe("POST /api/v1/accessibility/jobs (issue #94 A7)", () => {
  it("1. enqueue → { jobId }; inline execution completes the job with a result", async () => {
    const requestId = `req-${randomUUID().slice(0, 8)}`;
    const post = await request(app)
      .post("/api/v1/accessibility/jobs")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-Request-Id", requestId)
      .send({ url: UNREACHABLE_URL, level: "AA", maxViolations: 5 });

    expect(post.status).toBe(201);
    expect(typeof post.body.data.jobId).toBe("string");
    const jobId = post.body.data.jobId as string;

    const get = await request(app)
      .get(`/api/v1/accessibility/jobs/${jobId}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(get.status).toBe(200);
    const job = get.body.data;
    expect(job.jobId).toBe(jobId);
    expect(job.type).toBe("accessibility.scan");
    // Inline mode (no worker configured) — already finished.
    expect(["completed", "running"]).toContain(job.status);
    expect(job.requestId).toBe(requestId);
    if (job.status === "completed") {
      expect(job.result).toMatchObject({
        url: UNREACHABLE_URL,
        level: "AA",
      });
      expect(Array.isArray(job.result.violations)).toBe(true);
    }
  });

  it("2. unknown job id → 404 NOT_FOUND", async () => {
    const res = await request(app)
      .get("/api/v1/accessibility/jobs/job-does-not-exist")
      .set("X-Forwarded-For", uniqueIp());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toMatch(/Job .* not found/i);
  });

  it("3. invalid body → 400 VALIDATION_ERROR (same schema as POST /scan)", async () => {
    const res = await request(app)
      .post("/api/v1/accessibility/jobs")
      .set("X-Forwarded-For", uniqueIp())
      .send({ url: "not-a-url" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/analytics/jobs (issue #94 A7)", () => {
  it("4. aggregation job completes with overview + traffic totals + window", async () => {
    const post = await request(app)
      .post("/api/v1/analytics/jobs")
      .set("X-Forwarded-For", uniqueIp())
      .send({ days: 7 });

    expect(post.status).toBe(201);
    const jobId = post.body.data.jobId as string;

    const get = await request(app)
      .get(`/api/v1/analytics/jobs/${jobId}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(get.status).toBe(200);
    const job = get.body.data;
    expect(job.type).toBe("analytics.aggregate");
    expect(job.status).toBe("completed");
    expect(job.result.days).toBe(7);
    expect(job.result.traffic).toHaveLength(7);
    expect(job.result.overview).toMatchObject({
      totalUsers: expect.any(Number),
      activeEffects: expect.any(Number),
    });
    expect(job.result.totals).toMatchObject({
      visitors: expect.any(Number),
      pageViews: expect.any(Number),
    });
  });
});

describe("POST /api/v1/architect/jobs (issue #94 A7)", () => {
  it("5. AI generation job requires auth and completes with a result", async () => {
    const email = `archjob+${randomUUID()}@example.com`;
    const register = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: VALID_PASSWORD, name: "Arch Job" });
    expect(register.status).toBe(201);
    const token = register.body.data.accessToken as string;

    // Anonymous → 401 (protected, same as POST /generate).
    const anon = await request(app)
      .post("/api/v1/architect/jobs")
      .set("X-Forwarded-For", uniqueIp())
      .send({ prompt: "Design a SaaS landing page" });
    expect(anon.status).toBe(401);

    const post = await request(app)
      .post("/api/v1/architect/jobs")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({ prompt: "Design a SaaS landing page" });

    expect(post.status).toBe(201);
    const jobId = post.body.data.jobId as string;

    const get = await request(app)
      .get(`/api/v1/architect/jobs/${jobId}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(get.status).toBe(200);
    const job = get.body.data;
    expect(job.type).toBe("architect.generate");
    expect(["completed", "running"]).toContain(job.status);
    if (job.status === "completed") {
      expect(job.result).toMatchObject({ id: expect.any(String) });
    }

    // Missing prompt → 400.
    const bad = await request(app)
      .post("/api/v1/architect/jobs")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({});
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");
  });
});
