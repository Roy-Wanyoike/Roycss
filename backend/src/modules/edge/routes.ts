/**
 * Edge routes — /api/v1/edge
 *
 *   GET  /regions       list all edge regions
 *   GET  /config        current edge config (TTL, cache strategy)
 *   GET  /performance   edge-vs-origin latency comparison
 *   POST /deploy        deploy a new edge config
 *
 * Order matters: static routes (`/regions`, `/config`, `/performance`,
 * `/deploy`) are declared before any param routes (currently none).
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import {
  deployConfig,
  getConfig,
  getPerformance,
  listRegions,
} from "./service.js";
import { EdgeDeploySchema } from "./schema.js";

export const edgeRouter = Router();

edgeRouter.get(
  "/regions",
  asyncHandler(async (_req, res) => {
    const items = await listRegions();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

edgeRouter.get(
  "/config",
  asyncHandler(async (_req, res) => {
    const config = await getConfig();
    res.json({ data: config });
  }),
);

edgeRouter.get(
  "/performance",
  asyncHandler(async (_req, res) => {
    const items = await getPerformance();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

edgeRouter.post(
  "/deploy",
  validateBody(EdgeDeploySchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof EdgeDeploySchema>;
    const config = await deployConfig({
      defaultTtl: input.defaultTtl,
      cacheStrategy: input.cacheStrategy,
      purgeOnDeploy: input.purgeOnDeploy,
      customHeaders: input.customHeaders,
    });
    res.json({ data: config });
  }),
);
