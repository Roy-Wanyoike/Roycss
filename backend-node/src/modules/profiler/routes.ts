/**
 * Profiler routes — /api/v1/profiler
 *
 *   POST  /start              start a new profiling session (auth: Bearer token)
 *   GET   /results/:id        fetch a profiling result by id
 *   GET   /metrics            list all known profiler metrics
 *
 * Mutating routes require authentication (issue #64) — profiler runs
 * persist to the `ProfilerResult` Prisma model.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import { listProfilerMetrics, listProfilerResults, startProfiling, getProfilerResultById } from "./service.js";
import { IdParamsSchema, StartProfilingSchema } from "./schema.js";

export const profilerRouter = Router();

profilerRouter.get(
  "/metrics",
  asyncHandler(async (_req, res) => {
    const items = await listProfilerMetrics();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

profilerRouter.get(
  "/results",
  asyncHandler(async (_req, res) => {
    const items = await listProfilerResults();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

profilerRouter.post(
  "/start",
  requireAuth,
  validateBody(StartProfilingSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof StartProfilingSchema
    >;
    const result = await startProfiling(input);
    res.status(202).json({ data: result });
  }),
);

profilerRouter.get(
  "/results/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const result = await getProfilerResultById(id);
    res.json({ data: result });
  }),
);
