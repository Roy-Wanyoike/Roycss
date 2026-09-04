/**
 * Spotlight routes — /api/v1/spotlight
 *
 *   GET   /featured             list featured spotlight items
 *   GET   /items                list all spotlight items
 *   GET   /items/:id            single spotlight item by id
 *   POST  /submit               submit a new spotlight candidate (auth: Bearer token)
 *   GET   /weekly               the current weekly spotlight
 *
 * Mutating routes require authentication (issue #64) — submissions
 * persist to the `SpotlightItem` Prisma model.
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getSpotlightItemById,
  getWeeklySpotlight,
  listFeaturedSpotlight,
  listSpotlightItems,
  submitSpotlight,
} from "./service.js";
import { IdParamsSchema, SpotlightSubmitSchema } from "./schema.js";

export const spotlightRouter = Router();

spotlightRouter.get(
  "/featured",
  asyncHandler(async (_req, res) => {
    const items = await listFeaturedSpotlight();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

spotlightRouter.get(
  "/items",
  asyncHandler(async (_req, res) => {
    const items = await listSpotlightItems();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

spotlightRouter.get(
  "/weekly",
  asyncHandler(async (_req, res) => {
    const weekly = await getWeeklySpotlight();
    res.json({ data: weekly });
  }),
);

spotlightRouter.post(
  "/submit",
  requireAuth,
  validateBody(SpotlightSubmitSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof SpotlightSubmitSchema
    >;
    const item = await submitSpotlight(input);
    res.status(201).json({ data: item });
  }),
);

spotlightRouter.get(
  "/items/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const item = await getSpotlightItemById(id);
    res.json({ data: item });
  }),
);
