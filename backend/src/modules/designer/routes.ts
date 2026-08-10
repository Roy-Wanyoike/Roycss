/**
 * Designer routes — /api/v1/designer
 *
 *   POST  /generate       kick off a design generation (mock)
 *   GET   /results/:id    single design result by id
 *   GET   /presets        design presets catalog
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import { generateDesign, getResultById, listPresets } from "./service.js";
import { DesignerParamsSchema, GenerateDesignSchema } from "./schema.js";

export const designerRouter = Router();

designerRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

designerRouter.post(
  "/generate",
  validateBody(GenerateDesignSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof GenerateDesignSchema>;
    const result = await generateDesign(input);
    res.status(201).json({ data: result });
  }),
);

designerRouter.get(
  "/results/:id",
  validateParams(DesignerParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof DesignerParamsSchema
    >;
    const result = await getResultById(id);
    res.json({ data: result });
  }),
);
