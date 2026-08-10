/**
 * Fallback routes — /api/v1/fallback
 *
 *   GET  /properties       list all 20 modern properties (summary form)
 *   GET  /properties/:id   single property's full fallback chain
 *   GET  /presets          6 fallback scenarios (full CSS included)
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams } from "../../server/middleware/validate.js";
import { getPropertyById, listPresets, listProperties } from "./service.js";
import { FallbackParamsSchema } from "./schema.js";

export const fallbackRouter = Router();

fallbackRouter.get(
  "/properties",
  asyncHandler(async (_req, res) => {
    const items = await listProperties();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

fallbackRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

fallbackRouter.get(
  "/properties/:id",
  validateParams(FallbackParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof FallbackParamsSchema
    >;
    const item = await getPropertyById(id);
    res.json({ data: item });
  }),
);
