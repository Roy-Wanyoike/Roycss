/**
 * Recipes routes — /api/v1/recipes
 *
 *   GET  /            list + filter (category, difficulty, tag) + paginate
 *   GET  /:id         single recipe by id
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams, validateQuery } from "../../server/middleware/validate.js";
import { getRecipeById, listRecipes } from "./service.js";
import { ListRecipesQuerySchema, RecipeParamsSchema } from "./schema.js";

export const recipesRouter = Router();

recipesRouter.get(
  "/",
  validateQuery(ListRecipesQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<typeof ListRecipesQuerySchema>;
    const result = await listRecipes(input);
    res.json({
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),
);

recipesRouter.get(
  "/:id",
  validateParams(RecipeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof RecipeParamsSchema>;
    const recipe = await getRecipeById(id);
    res.json({ data: recipe });
  }),
);
