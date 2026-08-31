/**
 * Starting-style routes — /api/v1/starting-style
 *
 *   POST  /generate   generate @starting-style CSS (base + hidden + @starting-style)
 *   GET   /presets    4 starting-style presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { generateStartingStyle, listPresets } from "./service.js";
import { StartingStyleGenerateSchema } from "./schema.js";

export const startingStyleRouter = Router();

startingStyleRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

startingStyleRouter.post(
  "/generate",
  validateBody(StartingStyleGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof StartingStyleGenerateSchema
    >;
    const result = await generateStartingStyle(input);
    res.status(201).json({ data: result });
  }),
);
