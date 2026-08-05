/**
 * Zod schemas for the patterns module.
 */
import { z } from "zod";

export const PatternCategorySchema = z.enum(["states", "feedback", "layouts"]);

export const ListPatternsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
  category: PatternCategorySchema.optional(),
  tag: z.string().optional(),
});

export const PatternParamsSchema = z.object({
  id: z.string().min(1),
});
