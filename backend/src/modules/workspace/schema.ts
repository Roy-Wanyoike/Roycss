/**
 * Zod schemas for the workspace module.
 *
 * Defines the invite-payload shape and the route params for /resources/:type.
 * The `WorkspaceResourceType`/`WorkspaceTeamMember` domain types live in
 * `../../types/index.ts`.
 */
import { z } from "zod";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Route params for /workspace/resources/:type. */
export const WorkspaceResourceTypeParamsSchema = z.object({
  type: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "type must be a kebab-case identifier (a-z, 0-9, hyphens)",
    ),
});

/** Body for POST /workspace/invite — invite a new team member. */
export const WorkspaceInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "email is required")
    .max(160, "email must be at most 160 characters")
    .regex(EMAIL_RE, "email must be a valid email address"),
  name: z
    .string()
    .trim()
    .max(120, "name must be at most 120 characters")
    .optional()
    .or(z.literal("")),
  role: z
    .enum(["owner", "admin", "editor", "viewer"])
    .default("viewer"),
});
export type WorkspaceInviteInput = z.infer<typeof WorkspaceInviteSchema>;
