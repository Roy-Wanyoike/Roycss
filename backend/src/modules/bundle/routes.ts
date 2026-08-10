/**
 * Bundle routes — /api/v1/bundle
 *
 *   POST  /analyze             analyze a bundle (returns a result id)
 *   GET   /results/:id         fetch a bundle analysis result
 *   GET   /duplicates          list duplicate modules across the bundle
 *   GET   /dead-css            list unused CSS rules
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import { analyzeBundle, getBundleResultById, listDeadCss, listDuplicates } from "./service.js";
import { AnalyzeBundleSchema, IdParamsSchema } from "./schema.js";

export const bundleRouter = Router();

bundleRouter.get(
  "/duplicates",
  asyncHandler(async (_req, res) => {
    const items = await listDuplicates();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

bundleRouter.get(
  "/dead-css",
  asyncHandler(async (_req, res) => {
    const items = await listDeadCss();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

bundleRouter.post(
  "/analyze",
  validateBody(AnalyzeBundleSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof AnalyzeBundleSchema>;
    const result = await analyzeBundle(input);
    res.status(202).json({ data: result });
  }),
);

bundleRouter.get(
  "/results/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const result = await getBundleResultById(id);
    res.json({ data: result });
  }),
);
