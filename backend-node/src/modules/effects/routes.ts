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
 *
 * API-key scope enforcement (issue #65): every route mounts
 * `requireApiKeyScope("effects:read")`. These reads stay PUBLIC for
 * browser/anonymous traffic, but a request presenting `X-API-Key` must
 * hold the `effects:read` (or `*`) scope — 403 otherwise — and is
 * subject to the per-key rate limit.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireApiKeyScope } from "../../server/middleware/api-key.js";
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

const effectsScope = requireApiKeyScope("effects:read");

export const effectsRouter = Router();

effectsRouter.get(
  "/",
  effectsScope,
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
  effectsScope,
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
  effectsScope,
  asyncHandler(async (_req, res) => {
    const categories = listCategories();
    res.json({ data: categories, meta: { count: categories.length } });
  }),
);

effectsRouter.get(
  "/tags",
  effectsScope,
  asyncHandler(async (_req, res) => {
    const tags = listTags();
    res.json({ data: tags, meta: { count: tags.length } });
  }),
);

effectsRouter.get(
  "/:id",
  effectsScope,
  validateParams(EffectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof EffectParamsSchema>;
    const effect = await getEffectById(id);
    res.json({ data: effect });
  }),
);
