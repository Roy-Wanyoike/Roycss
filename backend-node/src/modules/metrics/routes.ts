/**
 * Metrics routes — /api/v1/metrics (PF-009 / issue #94 A9)
 *
 *   GET /routes   per-route latency histograms (p50/p95/p99),
 *                 auth + platform-ADMIN guarded
 *
 * The histograms are in-memory and process-local: they describe THIS
 * instance's recent traffic (bounded sample window). Redis-backed
 * aggregation lands with PF-003.
 */
import { Router } from "express";

import { requireAuth, requirePlatformRole } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { getRouteMetrics } from "../../lib/route-metrics.js";

export const metricsRouter = Router();

metricsRouter.get(
  "/routes",
  requireAuth,
  requirePlatformRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const routes = getRouteMetrics();
    res.json({
      data: routes,
      meta: {
        count: routes.length,
        generatedAt: new Date().toISOString(),
      },
    });
  }),
);
