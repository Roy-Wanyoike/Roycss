/**
 * Zod schemas + recipe snapshot for the recipes module.
 */
import { z } from "zod";

export const RecipeCategorySchema = z.enum([
  "hero-sections",
  "loading-states",
  "cards",
  "navigation",
  "forms",
  "notifications",
  "empty-states",
  "buttons",
]);

export const ListRecipesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
  category: RecipeCategorySchema.optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tag: z.string().optional(),
});

export const RecipeParamsSchema = z.object({
  id: z.string().min(1),
});
