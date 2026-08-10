/**
 * Zod schemas for the blueprints module.
 *
 * No POST/PUT endpoints — blueprints are a read-only curated catalog.
 * Only the id param schema is needed.
 */
import { z } from "zod";

/** Route params for /blueprints/:id and /blueprints/:id/architecture. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
