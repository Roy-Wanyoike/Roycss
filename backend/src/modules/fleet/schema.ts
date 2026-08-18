/**
 * Zod schemas for the fleet module.
 *
 * Defines the scan-payload shape and the route params for /projects/:id.
 * The `FleetProject`/`FleetHealth` domain types live in
 * `../../types/index.ts`.
 */
import { z } from "zod";

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Route params for /fleet/projects/:id. */
export const FleetProjectParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /fleet/scan — kick off a manual re-scan. */
export const FleetScanSchema = z.object({
  projectId: z
    .string()
    .trim()
    .min(1, "projectId is required")
    .max(80, "projectId must be at most 80 characters"),
});
export type FleetScanInput = z.infer<typeof FleetScanSchema>;
