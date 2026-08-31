/**
 * Analytics routes — /api/v1/analytics
 *
 *   GET  /overview    top-line KPIs (totalUsers, activeEffects, apiCalls, avgResponseTime)
 *   GET  /effects     top 10 effects by usage
 *   GET  /traffic     30-day traffic chart data
 *   GET  /devices     device breakdown (desktop/mobile/tablet)
 *
 * All endpoints return static mock snapshots cached for 5 minutes.
 *
 * Note: `GET /geo` is intentionally not exposed as a route — the task
 * specifies four endpoints (overview, effects, traffic, devices) — but
 * the geo dataset is exposed as part of the overview payload for
 * convenience. The service still exposes `getGeoData()` for future use.
 */
import { Router } from "express";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  getDeviceBreakdown,
  getGeoData,
  getOverview,
  getTopEffects,
  getTrafficData,
} from "./service.js";

export const analyticsRouter = Router();

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
