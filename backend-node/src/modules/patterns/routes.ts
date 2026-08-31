/**
 * Patterns routes — /api/v1/patterns
 *
 *   GET  /            list + filter (category, tag) + paginate
 *   GET  /:id         single pattern by id
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams, validateQuery } from "../../server/middleware/validate.js";
import { getPatternById, listPatterns } from "./service.js";
import { ListPatternsQuerySchema, PatternParamsSchema } from "./schema.js";

export const patternsRouter = Router();

patternsRouter.get(
  "/",
  validateQuery(ListPatternsQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<typeof ListPatternsQuerySchema>;
    const result = await listPatterns(input);
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

patternsRouter.get(
  "/:id",
  validateParams(PatternParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof PatternParamsSchema>;
    const pattern = await getPatternById(id);
    res.json({ data: pattern });
  }),
);
