/**
 * Zod schemas for the bundle module.
 */
import { z } from "zod";

/** Body for POST /bundle/analyze. */
export const AnalyzeBundleSchema = z.object({
  entry: z
    .string()
    .trim()
    .min(1, "Entry point is required")
    .max(200, "Entry must be at most 200 characters"),
  /** Optional repository URL for cross-repo analysis. */
  repo: z.string().url().optional(),
  /** Optional commit SHA. */
  commit: z.string().trim().min(7).max(40).optional(),
});
export type AnalyzeBundleInput = z.infer<typeof AnalyzeBundleSchema>;

/** Route params for /bundle/results/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
