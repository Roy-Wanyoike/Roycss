/**
 * SECURITY SUITE (PF-007) — rate limiting.
 *
 * Middleware config (src/server/middleware/rateLimit.ts + src/config/
 * env.ts defaults): sliding window, 60 s, in-memory buckets keyed by
 * `scope:${req.ip}`. Limits: general 100/min (every /api/v1 route except
 * /health), auth 10/min (register/login/refresh/api-keys), contact
 * 5/min. Every response carries X-RateLimit-Limit/-Remaining/-Reset and
 * 429s add Retry-After.
 *
 * Pins:
 *   1. rate-limit headers are present on ordinary responses,
 *   2. bursting the AUTH limiter (10/min) yields 429 + RATE_LIMITED
 *      envelope + Retry-After,
 *   3. bursting the GENERAL limiter (100/min) yields 429,
 *   4. the 429 envelope is the documented error shape.
 *
 * IPs are drawn from the RFC 2544 benchmark range (198.18.0.0/15) —
 * reserved for device benchmarking, disjoint from the RFC 5737 blocks
 * the rest of the suite rotates through, so these bursts can't pollute
 * (or be polluted by) other tests' buckets.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

/** Dedicated IPs for limiter bursts — never reused by the sweeps. */
const AUTH_BURST_IP = "198.18.0.10";
const GENERAL_BURST_IP = "198.18.0.20";

describe("security/rate-limit", () => {
  it("1. ordinary responses carry the X-RateLimit-* advisory headers", async () => {
    const res = await request(app)
      .get("/api/v1/recipes")
      .set("X-Forwarded-For", "198.18.0.1");

    expect(res.status).toBe(200);
    expect(Number(res.headers["x-ratelimit-limit"])).toBeGreaterThan(0);
    expect(Number(res.headers["x-ratelimit-remaining"])).toBeGreaterThanOrEqual(0);
    expect(Number(res.headers["x-ratelimit-reset"])).toBeGreaterThan(0);
  });

  it("2. auth limiter — 11 rapid logins from one IP trip 429 with the documented envelope", async () => {
    let saw429 = false;
    let statuses: number[] = [];

    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("X-Forwarded-For", AUTH_BURST_IP)
        .send({ email: `burst${i}@example.com`, password: "wrong-password-1" });
      statuses.push(res.status);

      if (res.status === 429) {
        saw429 = true;
        // The documented 429 contract: error envelope + Retry-After.
        expectErrorEnvelope(res);
        expect(res.body.error.code).toBe("RATE_LIMITED");
        expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
        expect(Number(res.headers["x-ratelimit-limit"])).toBe(10);
        break; // limiter engaged — no need to keep hammering
      }
    }

    expect(
      saw429,
      `auth limiter never tripped after 11 requests (statuses: ${statuses.join(",")})`,
    ).toBe(true);
    // The first 10 must NOT have been 429 (limit is 10/min).
    expect(statuses.slice(0, 10)).not.toContain(429);
  });

  it("3. general limiter — a 101-request burst on one IP trips 429", async () => {
    let trippedAt: number | null = null;

    for (let i = 0; i < 101; i++) {
      const res = await request(app)
        .get("/api/v1/version/current")
        .set("X-Forwarded-For", GENERAL_BURST_IP);

      if (res.status === 429) {
        trippedAt = i + 1;
        expect(res.body.error.code).toBe("RATE_LIMITED");
        expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
        break;
      }
    }

    expect(
      trippedAt,
      "general limiter never tripped after 101 requests",
    ).not.toBeNull();
    // Documented limit is 100/min — it must trip exactly at request 101.
    expect(trippedAt).toBe(101);
  });
});
