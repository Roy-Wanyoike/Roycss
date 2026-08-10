/**
 * Review routes — /api/v1/review
 *
 *   POST  /code           submit code for review (mock)
 *   GET   /results/:id    single review result by id
 *   GET   /rules          review rules catalog
 *   GET   /history        list all historical review results
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getResultById,
  listHistory,
  listRules,
  reviewCode,
} from "./service.js";
import { ReviewCodeSchema, ReviewParamsSchema } from "./schema.js";

export const reviewRouter = Router();

reviewRouter.post(
  "/code",
  validateBody(ReviewCodeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ReviewCodeSchema>;
    const result = await reviewCode(input);
    res.status(201).json({ data: result });
  }),
);

reviewRouter.get(
  "/rules",
  asyncHandler(async (_req, res) => {
    const rules = await listRules();
    res.json({ data: rules, meta: { count: rules.length } });
  }),
);

reviewRouter.get(
  "/history",
  asyncHandler(async (_req, res) => {
    const items = await listHistory();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

reviewRouter.get(
  "/results/:id",
  validateParams(ReviewParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof ReviewParamsSchema>;
    const result = await getResultById(id);
    res.json({ data: result });
  }),
);
