/**
 * Benchmark routes — /api/v1/benchmark
 *
 *   POST  /run               run a benchmark suite
 *   GET   /results/:id       fetch a benchmark result by id
 *   GET   /comparisons       list benchmark comparisons vs industry average
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getBenchmarkResultById,
  listComparisons,
  runBenchmark,
} from "./service.js";
import { BenchmarkRunSchema, IdParamsSchema } from "./schema.js";

export const benchmarkRouter = Router();

benchmarkRouter.get(
  "/comparisons",
  asyncHandler(async (_req, res) => {
    const items = await listComparisons();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

benchmarkRouter.post(
  "/run",
  validateBody(BenchmarkRunSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof BenchmarkRunSchema>;
    const result = await runBenchmark(input);
    res.status(202).json({ data: result });
  }),
);

benchmarkRouter.get(
  "/results/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const result = await getBenchmarkResultById(id);
    res.json({ data: result });
  }),
);
