/**
 * Zod schemas for the enterprise module.
 *
 * Defines the create-organization payload and route params.
 * The `Organization`/`Team`/`License`/`AuditLogEntry` domain types live
 * in `../../types/index.ts`.
 */
import { z } from "zod";

export const EnterprisePlanEnum = z.enum(["team", "business", "enterprise"]);

/** Route params for /enterprise/organizations/:id. */
export const OrgParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /enterprise/organizations — create an organization. */
export const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(120, "Name must be at most 120 characters"),
  plan: EnterprisePlanEnum.default("team"),
  seats: z.coerce
    .number()
    .int()
    .min(1, "seats must be >= 1")
    .max(10_000, "seats must be <= 10000")
    .default(5),
  ownerId: z
    .string()
    .trim()
    .min(1, "ownerId is required")
    .max(120, "ownerId must be at most 120 characters"),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
