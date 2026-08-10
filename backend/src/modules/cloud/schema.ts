/**
 * Zod schemas for the cloud module.
 *
 * Defines the deploy-payload shape and the route params for /projects/:id.
 * The `CloudProject`/`Deployment` domain types live in `../../types/index.ts`.
 */
import { z } from "zod";

export const CloudEnvironmentEnum = z.enum([
  "production",
  "preview",
  "staging",
]);

/** Route params for /cloud/projects/:id. */
export const CloudProjectParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /cloud/projects — deploy a new cloud project. */
export const DeployCloudProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(120, "Name must be at most 120 characters"),
  environment: CloudEnvironmentEnum.default("production"),
  /** Optional source repo or upload id (mock-only). */
  source: z
    .string()
    .trim()
    .max(500, "Source must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});
export type DeployCloudProjectInput = z.infer<typeof DeployCloudProjectSchema>;
