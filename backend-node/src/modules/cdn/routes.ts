/**
 * CDN routes — /api/v1/cdn
 *
 *   GET  /stats       top-line CDN metrics (requests, bandwidth, hit rate)
 *   GET  /resources   list CDN-tracked resources
 *   GET  /edges       list all edge locations
 *   POST /purge       purge CDN cache for paths or all
 *
 * Order matters: static routes (`/stats`, `/resources`, `/edges`, `/purge`)
 * are declared before any param routes (currently none).
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import {
  getStats,
  listEdges,
  listResources,
  purgeCache,
} from "./service.js";
import { CDNPurgeSchema } from "./schema.js";

export const cdnRouter = Router();

cdnRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await getStats();
    res.json({ data: stats });
  }),
);

cdnRouter.get(
  "/resources",
  asyncHandler(async (_req, res) => {
    const items = await listResources();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

cdnRouter.get(
  "/edges",
  asyncHandler(async (_req, res) => {
    const items = await listEdges();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

cdnRouter.post(
  "/purge",
  validateBody(CDNPurgeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CDNPurgeSchema>;
    const result = await purgeCache({
      paths: input.paths,
      all: input.all,
    });
    res.json({ data: result });
  }),
);
