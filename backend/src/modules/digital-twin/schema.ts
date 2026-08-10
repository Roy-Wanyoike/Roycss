/**
 * Zod schemas for the digital-twin module.
 */
import { z } from "zod";

/** Body for POST /digital-twin/create. */
export const CreateTwinSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  /** Optional target devices (e.g. ["iphone-se", "ipad-pro"]). */
  devices: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  /** Optional journey name to simulate (e.g. "checkout"). */
  journey: z.string().trim().min(1).max(120).optional(),
});
export type CreateTwinInput = z.infer<typeof CreateTwinSchema>;

/** Route params for /digital-twin/results/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
