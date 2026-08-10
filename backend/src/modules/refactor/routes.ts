/**
 * Refactor routes — /api/v1/refactor
 *
 *   POST  /transform       submit code for refactoring (mock)
 *   GET   /frameworks      source frameworks catalog
 *   GET   /results/:id     single refactor result by id
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
import { getResultById, listFrameworks, transform } from "./service.js";
import { RefactorParamsSchema, RefactorTransformSchema } from "./schema.js";

export const refactorRouter = Router();

refactorRouter.post(
  "/transform",
  validateBody(RefactorTransformSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof RefactorTransformSchema
    >;
    const result = await transform(input);
    res.status(201).json({ data: result });
  }),
);

refactorRouter.get(
  "/frameworks",
  asyncHandler(async (_req, res) => {
    const items = await listFrameworks();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

refactorRouter.get(
  "/results/:id",
  validateParams(RefactorParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof RefactorParamsSchema
    >;
    const result = await getResultById(id);
    res.json({ data: result });
  }),
);
