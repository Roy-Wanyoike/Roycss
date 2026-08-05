/**
 * Effects routes — /api/v1/effects
 *
 *   GET    /                  list + filter + paginate
 *   GET    /search?q=...      full-text search
 *   GET    /categories        distinct categories
 *   GET    /tags              distinct tags
 *   GET    /:id               single effect by id
 *
 * Order matters: /search, /categories, /tags must come before /:id
 * or they'd be captured as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams, validateQuery } from "../../server/middleware/validate.js";
import {
  getEffectById,
  listCategories,
  listEffects,
  listTags,
  searchEffects,
} from "./service.js";
import {
  EffectParamsSchema,
  ListEffectsQuerySchema,
  SearchEffectsQuerySchema,
} from "./schema.js";

export const effectsRouter = Router();

effectsRouter.get(
  "/",
  validateQuery(ListEffectsQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<typeof ListEffectsQuerySchema>;
    const result = await listEffects(input);
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

effectsRouter.get(
  "/search",
  validateQuery(SearchEffectsQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<typeof SearchEffectsQuerySchema>;
    const result = await searchEffects(input);
    res.json({
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        query: input.q,
      },
    });
  }),
);

effectsRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = listCategories();
    res.json({ data: categories, meta: { count: categories.length } });
  }),
);

effectsRouter.get(
  "/tags",
  asyncHandler(async (_req, res) => {
    const tags = listTags();
    res.json({ data: tags, meta: { count: tags.length } });
  }),
);

effectsRouter.get(
  "/:id",
  validateParams(EffectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof EffectParamsSchema>;
    const effect = await getEffectById(id);
    res.json({ data: effect });
  }),
);
