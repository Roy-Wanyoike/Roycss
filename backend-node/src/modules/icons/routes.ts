/**
 * Icons routes — /api/v1/icons
 *
 *   GET  /                  list with optional category filter + search
 *   GET  /categories        distinct categories with counts
 *   GET  /:name             single icon by name
 *
 * Order matters: /categories must be declared before /:name so the
 * literal path isn't captured as an icon name.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams, validateQuery } from "../../server/middleware/validate.js";
import { getIconByName, listCategories, listIcons } from "./service.js";
import { IconNameParamsSchema, ListIconsQuerySchema } from "./schema.js";

export const iconsRouter = Router();

iconsRouter.get(
  "/",
  validateQuery(ListIconsQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<typeof ListIconsQuerySchema>;
    const result = await listIcons(input);
    res.json({
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),
);

iconsRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await listCategories();
    res.json({ data: categories, meta: { count: categories.length } });
  }),
);

iconsRouter.get(
  "/:name",
  validateParams(IconNameParamsSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.params as unknown as z.infer<
      typeof IconNameParamsSchema
    >;
    const icon = await getIconByName(name);
    res.json({ data: icon });
  }),
);
