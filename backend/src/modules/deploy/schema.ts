/**
 * Zod schemas for the deploy module.
 *
 * Defines the create-payload shape and the route params for /history/:id.
 * The `DeployPlatform`/`DeployEnvironment`/`DeployHistoryEntry` domain
 * types live in `../../types/index.ts`.
 */
import { z } from "zod";

/** Route params for /deploy/history/:id. */
export const DeployHistoryParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /deploy/create — kick off a new deployment. */
export const DeployCreateSchema = z.object({
  projectId: z
    .string()
    .trim()
    .min(1, "projectId is required")
    .max(80, "projectId must be at most 80 characters"),
  environment: z
    .string()
    .trim()
    .min(1, "environment is required")
    .max(60, "environment must be at most 60 characters"),
  platformId: z
    .string()
    .trim()
    .min(1, "platformId is required")
    .max(60, "platformId must be at most 60 characters"),
  branch: z
    .string()
    .trim()
    .max(120, "branch must be at most 120 characters")
    .optional()
    .or(z.literal("")),
  commit: z
    .string()
    .trim()
    .max(40, "commit must be at most 40 characters")
    .optional()
    .or(z.literal("")),
});
export type DeployCreateInput = z.infer<typeof DeployCreateSchema>;
