/**
 * Zod schemas for the search module.
 */
import { z } from "zod";

const CONTENT_TYPES = [
  "components",
  "effects",
  "recipes",
  "templates",
  "plugins",
  "documentation",
  "community",
  "blueprints",
] as const;

/** Body for POST /search. */
export const SearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Query must be at least 1 character")
    .max(200, "Query must be at most 200 characters"),
  /** Optional filter by content type. */
  types: z.array(z.enum(CONTENT_TYPES)).max(8).optional(),
  /** Maximum number of results to return (default 20, max 50). */
  limit: z.number().int().min(1).max(50).optional(),
});
export type SearchInput = z.infer<typeof SearchSchema>;

/** Query string for GET /search/suggestions?q=prefix. */
export const SuggestionQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "q is required")
    .max(200, "q must be at most 200 characters"),
});
export type SearchQueryInput = z.infer<typeof SuggestionQuerySchema>;
