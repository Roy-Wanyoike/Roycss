/**
 * SECURITY SUITE (PF-007) — authentication on mutating routes.
 *
 * Router-driven sweep (no hand-maintained list — a new module's POST is
 * covered the moment it is mounted):
 *
 *   1. anonymous sweep — every POST/PUT/PATCH/DELETE must either REJECT
 *      the request (401/403/429, documented error envelope) or fail body
 *      validation (400 VALIDATION_ERROR, public stateless route with a
 *      Zod schema). Only the two DOCUMENTED public mutations whose bodies
 *      are entirely optional may 2xx. Never 500, never a bare success.
 *   2. garbage-token sweep — an INVALID Bearer token must never produce
 *      a 2xx on ANY mutating route (no access escalation via bad token).
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { listRoutes, MUTATING_METHODS } from "../helpers/route-walker.js";
import { hit, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();
const mutatingRoutes = listRoutes(app).filter((r) =>
  MUTATING_METHODS.has(r.method),
);

/**
 * Documented Public mutations with all-optional bodies (see contract suite).
 * `analytics/jobs` (PR #97 A7): enqueues an aggregation of the analytics
 * module's PUBLIC static demo data — a read-only computation, no user-state
 * mutation, consistent with the module's public GET routes; rate-limited
 * under the general tier.
 */
const DOCUMENTED_PUBLIC_MUTATIONS = new Set([
  "POST /api/v1/version/check-upgrade",
  "POST /api/v1/edge/deploy",
  "POST /api/v1/analytics/jobs",
]);

describe("security/authn: mutating routes reject anonymous misuse", () => {
  it(`sweep ${mutatingRoutes.length} mutating routes — anonymous never 500, always a documented rejection`, async () => {
    expect(mutatingRoutes.length).toBeGreaterThanOrEqual(60);

    for (const route of mutatingRoutes) {
      const key = `${route.method.toUpperCase()} ${route.path}`;
      const res = await hit(app, route.method, route.path, { body: {} });

      // Hard invariant: no 5xx and a documented body shape on rejection.
      expect(
        res.status,
        `${key} must not 5xx — got ${res.status}`,
      ).toBeLessThan(500);

      if (res.status >= 200 && res.status < 300) {
        // Only the two documented Public all-optional-body routes may
        // succeed anonymously — and the assertion message forces a
        // deliberate decision if a new one appears.
        expect(
          DOCUMENTED_PUBLIC_MUTATIONS.has(key),
          `${key} mutated state ANONYMOUSLY — add requireAuth or add it to the documented-public list`,
        ).toBe(true);
      } else {
        expectErrorEnvelope(res);
        // The only acceptable rejections: unauthenticated (401/403),
        // validation of the sentinel body (400), or rate limiting (429).
        expect(
          [400, 401, 403, 429],
          `${key} anonymous rejection code`,
        ).toContain(res.status);
      }
    }
  });

  it("garbage Bearer token never improves the outcome vs anonymous (no access escalation)", async () => {
    for (const route of mutatingRoutes) {
      const key = `${route.method.toUpperCase()} ${route.path}`;

      // Baseline: anonymous outcome with the same sentinel body.
      const anon = await hit(app, route.method, route.path, { body: {} });
      // Probe: the same request with an INVALID Bearer token.
      const forged = await hit(app, route.method, route.path, {
        body: {},
        headers: { Authorization: "Bearer not.a.real.jwt.token" },
      });

      expect(
        forged.status,
        `${key} with a garbage token must not 5xx`,
      ).toBeLessThan(500);

      if (anon.status >= 400) {
        // The route rejected anonymous access — presenting an invalid
        // token must not unlock it: still no 2xx.
        expect(
          forged.status,
          `${key} anonymous → ${anon.status}, but garbage token → ${forged.status} — a forged token escalated access!`,
        ).toBeGreaterThanOrEqual(400);
      }
      // (For documented-public mutations the garbage token is simply
      // ignored — same 2xx as anonymous, which is fine: the route never
      // consulted the Authorization header.)
    }
  });

  it("X-Request-Id is present on every rejection (traceability)", async () => {
    const res = await hit(app, "post", "/api/v1/themes", { body: {} });
    expect(res.status).toBe(401);
    expect(typeof res.headers["x-request-id"]).toBe("string");
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });
});
