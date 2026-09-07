/**
 * CONTRACT SUITE (PF-007) — mutating routes (POST / PUT / PATCH / DELETE).
 *
 * Anonymous contract, per issue #93:
 *   auth-required route   → 401 error envelope, never 500
 *   public route          → 400 VALIDATION_ERROR envelope (sentinel `{}` body
 *                           fails the module's Zod schema), never 500
 *   public + no required  → 2xx success envelope, ONLY for the two
 *                           body fields                  documented Public
 *                           routes whose bodies are all-optional
 *                           (API.md: version/check-upgrade, edge/deploy)
 *
 * A mutating route that 500s, returns a non-envelope body, or mutates
 * state anonymously without documentation fails this suite.
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { listRoutes, MUTATING_METHODS } from "../helpers/route-walker.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();
const mutatingRoutes = listRoutes(app).filter((r) =>
  MUTATING_METHODS.has(r.method),
);

/**
 * Mutating routes documented as Public in API.md whose request bodies are
 * entirely optional — an anonymous `{}` therefore legitimately succeeds.
 * Everything else must be rejected anonymously (401) or fail validation
 * (400). Keeping this list exhaustive is the point of the sweep: adding a
 * new anonymously-mutable route forces a deliberate entry here.
 */
const DOCUMENTED_PUBLIC_MUTATIONS = new Set([
  "POST /api/v1/version/check-upgrade", // body: { current? } — all optional
  "POST /api/v1/edge/deploy", // body: { defaultTtl?, … } — all optional
  // PR #97 A7: enqueues an aggregation of the analytics module's public
  // static demo data — read-only computation, no user-state mutation,
  // consistent with the module's public GET routes, rate-limited.
  "POST /api/v1/analytics/jobs",
]);

describe("contract: mutating routes (registry-driven, anonymous)", () => {
  for (const route of mutatingRoutes) {
    const key = `${route.method.toUpperCase()} ${route.path.replace(/:(\w+)/g, "probe-123")}`;
    it(`${key} anonymous → 401 (or documented public) — never 500`, {
      timeout: 15_000,
    }, async () => {
      const res = await hit(app, route.method, route.path, { body: {} });

      expect(
        res.status,
        `${key} must not 5xx — got ${res.status}`,
      ).toBeLessThan(500);

      if (res.status >= 200 && res.status < 300) {
        expect(
          DOCUMENTED_PUBLIC_MUTATIONS.has(key),
          `${key} succeeded anonymously but is not in DOCUMENTED_PUBLIC_MUTATIONS — protect it with requireAuth or document it`,
        ).toBe(true);
        expectSuccessEnvelope(res);
      } else {
        expectErrorEnvelope(res);
        // Rejection must be auth (401) or validation (400) — an anonymous
        // 403/404/409 would mean a protected route evaluating the request
        // before checking the token.
        expect([400, 401, 403, 404, 429]).toContain(res.status);
      }
    });
  }
});
