/**
 * Zod schemas for the observatory module.
 */
import { z } from "zod";

/** Route params for /observatory/sites/:id and /observatory/trends/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
