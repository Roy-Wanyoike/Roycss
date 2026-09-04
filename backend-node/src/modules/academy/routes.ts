/**
 * Academy routes — /api/v1/academy
 *
 *   GET   /paths                list learning paths (summaries)
 *   GET   /paths/:id            single path with full lesson list
 *   GET   /paths/:id/lessons    lessons for a path
 *   POST  /paths/:id/progress   mark a lesson complete (auth: Bearer token)
 *
 * Mutating routes require authentication (issue #64) — progress
 * persists to the `PathProgress` Prisma model.
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
  getLessonsForPath,
  getPathById,
  listPaths,
  recordProgress,
} from "./service.js";
import { PathParamsSchema, ProgressInputSchema } from "./schema.js";

export const academyRouter = Router();

academyRouter.get(
  "/paths",
  asyncHandler(async (_req, res) => {
    const items = await listPaths();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

academyRouter.get(
  "/paths/:id",
  validateParams(PathParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof PathParamsSchema>;
    const path = await getPathById(id);
    res.json({ data: path });
  }),
);

academyRouter.get(
  "/paths/:id/lessons",
  validateParams(PathParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof PathParamsSchema>;
    const lessons = await getLessonsForPath(id);
    res.json({ data: lessons, meta: { count: lessons.length } });
  }),
);

academyRouter.post(
  "/paths/:id/progress",
  requireAuth,
  validateParams(PathParamsSchema),
  validateBody(ProgressInputSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof PathParamsSchema>;
    const input = req.body as unknown as z.infer<typeof ProgressInputSchema>;
    const result = await recordProgress(id, input);
    res.json({ data: result });
  }),
);
