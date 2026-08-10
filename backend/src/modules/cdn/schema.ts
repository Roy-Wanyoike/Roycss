/**
 * Zod schemas for the CDN module.
 *
 * Defines the purge-payload shape.
 * The `CDNStats`/`CDNResource`/`CDNEdge` domain types live in
 * `../../types/index.ts`.
 */
import { z } from "zod";

/** Body for POST /cdn/purge — purge CDN cache for paths or all. */
export const CDNPurgeSchema = z
  .object({
    paths: z.array(z.string().trim().min(1).max(500)).max(100).optional(),
    all: z.boolean().optional(),
  })
  .refine((data) => data.all === true || (data.paths ?? []).length > 0, {
    message: "Either 'paths' (non-empty) or 'all: true' must be provided",
  });
export type CDNPurgeInput = z.infer<typeof CDNPurgeSchema>;
