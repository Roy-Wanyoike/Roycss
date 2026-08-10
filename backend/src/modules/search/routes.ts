/**
 * Search routes — /api/v1/search
 *
 *   POST  /                perform a search query
 *   GET   /recent          list recent searches (mock)
 *   GET   /suggestions     list search suggestions for a prefix
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody, validateQuery } from "../../server/middleware/validate.js";
import { getRecentSearches, getSuggestions, search } from "./service.js";
import { SearchSchema, SuggestionQuerySchema } from "./schema.js";

export const searchRouter = Router();

searchRouter.get(
  "/recent",
  asyncHandler(async (_req, res) => {
    const items = await getRecentSearches();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

searchRouter.get(
  "/suggestions",
  validateQuery(SuggestionQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof SuggestionQuerySchema>;
    const items = await getSuggestions(query.q);
    res.json({ data: items, meta: { count: items.length, query: query.q } });
  }),
);

searchRouter.post(
  "/",
  validateBody(SearchSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof SearchSchema>;
    const result = await search(input);
    res.json({
      data: result.items,
      meta: {
        count: result.items.length,
        total: result.total,
        query: result.query,
        took: result.took,
      },
    });
  }),
);
