/**
 * Zod schemas for the refactor module.
 *
 * Defines the body shape for POST /refactor/transform and route
 * params for /refactor/results/:id.
 */
import { z } from "zod";

/** Body for POST /refactor/transform — submit code for refactoring (mock). */
export const RefactorTransformSchema = z.object({
  sourceFramework: z
    .string()
    .trim()
    .min(1, "sourceFramework is required")
    .max(80, "sourceFramework must be at most 80 characters"),
  targetFramework: z
    .string()
    .trim()
    .min(1, "targetFramework is required")
    .max(80, "targetFramework must be at most 80 characters"),
  files: z
    .array(
      z.object({
        path: z.string().trim().min(1).max(500),
        content: z.string().min(1).max(500_000),
      }),
    )
    .min(1, "At least one file is required")
    .max(200, "At most 200 files per request"),
});
export type RefactorTransformInput = z.infer<typeof RefactorTransformSchema>;

/** Route params for /refactor/results/:id. */
export const RefactorParamsSchema = z.object({
  id: z.string().min(1),
});
