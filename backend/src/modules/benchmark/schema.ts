/**
 * Zod schemas for the benchmark module.
 */
import { z } from "zod";

/** Body for POST /benchmark/run. */
export const BenchmarkRunSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  suite: z
    .string()
    .trim()
    .min(1, "Suite is required")
    .max(80, "Suite must be at most 80 characters"),
  runs: z.number().int().min(1).max(20).optional(),
  /** Optional throttling profile (e.g. "4g", "3g-slow"). */
  profile: z.string().trim().min(1).max(40).optional(),
});
export type BenchmarkRunInput = z.infer<typeof BenchmarkRunSchema>;

/** Route params for /benchmark/results/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
