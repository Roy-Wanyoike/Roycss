/**
 * Motion routes — /api/v1/motion
 *
 *   GET  /effects          list all motion effects
 *   GET  /effects/:id      single motion effect
 *   GET  /presets          named animation preset combos
 *   GET  /categories       effect categories with counts
 *
 * Order matters: /presets and /categories are declared before /effects/:id
 * so the literal paths aren't captured as an effect id.
 *
 * Read-only — no mutation endpoints.
 */
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams } from "../../server/middleware/validate.js";
import {
  getEffectById,
  listCategories,
  listEffects,
  listPresets,
} from "./service.js";

const MotionParamsSchema = z.object({
  id: z.string().min(1),
});

export const motionRouter = Router();

motionRouter.get(
  "/effects",
  asyncHandler(async (_req, res) => {
    const items = await listEffects();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

motionRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const presets = await listPresets();
    res.json({ data: presets, meta: { count: presets.length } });
  }),
);

motionRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await listCategories();
    res.json({ data: categories, meta: { count: categories.length } });
  }),
);

motionRouter.get(
  "/effects/:id",
  validateParams(MotionParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof MotionParamsSchema>;
    const effect = await getEffectById(id);
    res.json({ data: effect });
  }),
);
