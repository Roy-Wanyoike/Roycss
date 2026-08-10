/**
 * Style-query routes — /api/v1/style-query
 *
 *   POST  /generate   build a @container style() query CSS block
 *   GET   /presets    3 style-query presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { generateStyleQuery, listPresets } from "./service.js";
import { StyleQueryGenerateSchema } from "./schema.js";

export const styleQueryRouter = Router();

styleQueryRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

styleQueryRouter.post(
  "/generate",
  validateBody(StyleQueryGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof StyleQueryGenerateSchema
    >;
    const result = await generateStyleQuery(input);
    res.status(201).json({ data: result });
  }),
);
