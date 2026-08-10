/**
 * Observatory routes — /api/v1/observatory
 *
 *   GET   /sites             list all monitored sites
 *   GET   /sites/:id         single monitored site by id
 *   GET   /alerts            list active alerts
 *   GET   /trends/:id        7-day trend for a site
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams } from "../../server/middleware/validate.js";
import {
  listAlerts,
  listSites,
  getSiteById,
  getSiteTrend,
} from "./service.js";
import { IdParamsSchema } from "./schema.js";

export const observatoryRouter = Router();

observatoryRouter.get(
  "/sites",
  asyncHandler(async (_req, res) => {
    const items = await listSites();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

observatoryRouter.get(
  "/alerts",
  asyncHandler(async (_req, res) => {
    const items = await listAlerts();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

observatoryRouter.get(
  "/sites/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const site = await getSiteById(id);
    res.json({ data: site });
  }),
);

observatoryRouter.get(
  "/trends/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const trend = await getSiteTrend(id);
    res.json({ data: trend });
  }),
);
