/**
 * Light-dark routes — /api/v1/light-dark
 *
 *   POST  /generate   generate light-dark() CSS from color-scheme + 5 tokens
 *   GET   /presets    4 light-dark presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { generateLightDark, listPresets } from "./service.js";
import { LightDarkGenerateSchema } from "./schema.js";

export const lightDarkRouter = Router();

lightDarkRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

lightDarkRouter.post(
  "/generate",
  validateBody(LightDarkGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof LightDarkGenerateSchema
    >;
    const result = await generateLightDark(input);
    res.status(201).json({ data: result });
  }),
);
