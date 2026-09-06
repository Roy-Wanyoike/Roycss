/**
 * Analytics routes — /api/v1/analytics
 *
 *   GET  /overview    top-line KPIs (totalUsers, activeEffects, apiCalls, avgResponseTime)
 *   GET  /effects     top 10 effects by usage
 *   GET  /traffic     30-day traffic chart data
 *   GET  /devices     device breakdown (desktop/mobile/tablet)
 *   POST /jobs        enqueue an aggregation job → { jobId } (A7)
 *   GET  /jobs/:id    job status + result (A7)
 *
 * All endpoints return static mock snapshots cached for 5 minutes.
 *
 * Note: `GET /geo` is intentionally not exposed as a route — the task
 * specifies four endpoints (overview, effects, traffic, devices) — but
 * the geo dataset is exposed as part of the overview payload for
 * convenience. The service still exposes `getGeoData()` for future use.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  getDeviceBreakdown,
  getGeoData,
  getOverview,
  getTopEffects,
  getTrafficData,
} from "./service.js";
import { AnalyticsJobSchema, JobParamsSchema } from "./schema.js";
import { getJobQueue } from "../../lib/queue.js";
import { AppError } from "../../server/middleware/error.js";
import { validateBody, validateParams } from "../../server/middleware/validate.js";

export const analyticsRouter = Router();

// ─── Job queue endpoints (PF-009 / issue #94 A7) ──────────────────────────
// Long-running analytics aggregation through the job-queue abstraction.
// Inline execution by default (no worker configured) — PF-003 swaps in
// a Redis-backed worker without changing these routes.

analyticsRouter.post(
  "/jobs",
  validateBody(AnalyticsJobSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof AnalyticsJobSchema>;
    const jobId = await getJobQueue().enqueue(
      "analytics.aggregate",
      async () => {
        const [overview, geo, traffic, devices, topEffects] =
          await Promise.all([
            getOverview(),
            getGeoData(),
            getTrafficData(),
            getDeviceBreakdown(),
            getTopEffects(),
          ]);
        const window = traffic.slice(-input.days);
        return {
          overview,
          geo,
          devices,
          topEffects,
          days: input.days,
          traffic: window,
          totals: {
            visitors: window.reduce((s, p) => s + p.visitors, 0),
            pageViews: window.reduce((s, p) => s + p.pageViews, 0),
          },
        };
      },
      { requestId: req.requestId },
    );
    res.status(201).json({ data: { jobId } });
  }),
);

analyticsRouter.get(
  "/jobs/:id",
  validateParams(JobParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof JobParamsSchema>;
    const job = getJobQueue().getJob(id);
    if (!job) throw AppError.notFound(`Job '${id}' not found`);
    res.json({ data: job });
  }),
);

analyticsRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const [overview, geo] = await Promise.all([
      getOverview(),
      getGeoData(),
    ]);
    res.json({ data: { ...overview, geoData: geo } });
  }),
);

analyticsRouter.get(
  "/effects",
  asyncHandler(async (_req, res) => {
    const effects = await getTopEffects();
    res.json({ data: effects, meta: { count: effects.length } });
  }),
);

analyticsRouter.get(
  "/traffic",
  asyncHandler(async (_req, res) => {
    const traffic = await getTrafficData();
    res.json({
      data: traffic,
      meta: {
        count: traffic.length,
        totalVisitors: traffic.reduce((s, p) => s + p.visitors, 0),
        totalPageViews: traffic.reduce((s, p) => s + p.pageViews, 0),
      },
    });
  }),
);

analyticsRouter.get(
  "/devices",
  asyncHandler(async (_req, res) => {
    const devices = await getDeviceBreakdown();
    res.json({ data: devices });
  }),
);
