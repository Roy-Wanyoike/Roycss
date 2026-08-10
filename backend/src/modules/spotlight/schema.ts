/**
 * Zod schemas for the spotlight module.
 */
import { z } from "zod";

const SPOTLIGHT_TYPES = [
  "case-study",
  "recipe",
  "talk",
  "tutorial",
  "milestone",
  "showcase",
  "article",
  "plugin",
] as const;

/** Body for POST /spotlight/submit. */
export const SpotlightSubmitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  type: z.enum(SPOTLIGHT_TYPES),
  author: z.string().trim().min(1).max(120),
  url: z.string().url("Must be a valid URL"),
  description: z.string().trim().min(10).max(2000),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});
export type SpotlightSubmitInput = z.infer<typeof SpotlightSubmitSchema>;

/** Route params for /spotlight/items/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
