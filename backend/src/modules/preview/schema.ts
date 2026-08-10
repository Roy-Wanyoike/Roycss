/**
 * Zod schemas for the preview module.
 *
 * Defines the create-payload shape and the route params for /:id.
 * The `PreviewBranch` domain type lives in `../../types/index.ts`.
 */
import { z } from "zod";

/** Route params for /preview/:id. */
export const PreviewParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /preview/create — spin up a preview branch deployment. */
export const PreviewCreateSchema = z.object({
  branch: z
    .string()
    .trim()
    .min(1, "branch is required")
    .max(120, "branch must be at most 120 characters"),
  project: z
    .string()
    .trim()
    .min(1, "project is required")
    .max(80, "project must be at most 80 characters"),
  commit: z
    .string()
    .trim()
    .max(40, "commit must be at most 40 characters")
    .optional()
    .or(z.literal("")),
});
export type PreviewCreateInput = z.infer<typeof PreviewCreateSchema>;
