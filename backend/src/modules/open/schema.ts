/**
 * Zod schemas for the open module.
 *
 * Defines the body shape for RFC votes and the shared id param schema.
 */
import { z } from "zod";

/** Body for POST /open/rfcs/:id/vote. */
export const RfcVoteSchema = z.object({
  vote: z.enum(["for", "against", "neutral"]),
  /** Optional voter handle for audit purposes. */
  voter: z.string().trim().min(1).max(120).optional(),
});
export type RfcVoteInput = z.infer<typeof RfcVoteSchema>;

/** Route params for /open/issues/:id and /open/rfcs/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
