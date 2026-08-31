/**
 * Zod schemas for the studio module.
 *
 * Defines the create/update payload shape and the route params for
 * /projects/:id. The `StudioProject`/`StudioTemplate` domain types live
 * in `../../types/index.ts`.
 */
import { z } from "zod";

import type { StudioComponent } from "../../types/index.js";

/** Route params for /studio/projects/:id. */
export const StudioProjectParamsSchema = z.object({
  id: z.string().min(1),
});

/**
 * A single component node — used inside the create/update payload.
 *
 * Declared as a recursive `z.lazy()` schema and explicitly typed against
 * the `StudioComponent` domain type so the inferred payload matches what
 * the service expects (and so callers don't get `unknown[]` for children).
 */
export const StudioComponentSchema: z.ZodType<StudioComponent> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().trim().min(1).max(60),
    props: z.record(z.string(), z.unknown()).default({}),
    children: z.array(StudioComponentSchema).optional(),
  }),
);

/** Body for POST /studio/projects — create a new project. */
export const CreateStudioProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(120, "Name must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .default(""),
  components: z.array(StudioComponentSchema).default([]),
});
export type CreateStudioProjectInput = z.infer<typeof CreateStudioProjectSchema>;

/** Body for PUT /studio/projects/:id — partial update. */
export const UpdateStudioProjectSchema = CreateStudioProjectSchema.partial();
export type UpdateStudioProjectInput = z.infer<typeof UpdateStudioProjectSchema>;
