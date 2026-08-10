/**
 * Zod schemas for the fallback module.
 *
 * Route params for /fallback/properties/:id — no POST routes here.
 */
import { z } from "zod";

/** Route params for /fallback/properties/:id. */
export const FallbackParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "id is required")
    .max(80, "id must be at most 80 characters"),
});
