/**
 * Pro Components routes — /api/v1/pro-components
 *
 *   GET  /                  list all pro components
 *   GET  /categories        component categories with counts
 *   GET  /:id               single component (with props)
 *   GET  /:id/code          component source code
 *
 * Order matters: /categories is declared before /:id so the literal path
 * isn't captured as a component id.
 *
 * Read-only — no mutation endpoints.
 */
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams } from "../../server/middleware/validate.js";
import {
  getComponentById,
  getComponentCode,
  listCategories,
  listComponents,
} from "./service.js";

export const ProComponentParamsSchema = z.object({
  id: z.string().min(1),
});

export const proComponentsRouter = Router();

proComponentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listComponents();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

proComponentsRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await listCategories();
    res.json({ data: categories, meta: { count: categories.length } });
  }),
);

proComponentsRouter.get(
  "/:id",
  validateParams(ProComponentParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ProComponentParamsSchema
    >;
    const component = await getComponentById(id);
    res.json({ data: component });
  }),
);

proComponentsRouter.get(
  "/:id/code",
  validateParams(ProComponentParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ProComponentParamsSchema
    >;
    const code = await getComponentCode(id);
    res.json({ data: code });
  }),
);
