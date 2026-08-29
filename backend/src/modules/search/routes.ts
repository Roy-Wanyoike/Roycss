/**
 * Search routes — /api/v1/search
 *
 *   GET   /                perform a search query (?q=neon&limit=20&types=effects)
 *   POST  /                perform a search query (body: { query, types, limit })
 *   GET   /recent          list recent searches (static)
 *   GET   /suggestions     list search suggestions for a prefix (?q=neon)
 *
 * The GET / route reads `q` (required), `limit` (optional int), and `types`
 * (optional CSV list) from the query string and proxies to the same
 * `search()` function the POST handler uses. This lets curl-driven smoke
 * tests hit `GET /api/v1/search?q=neon` without crafting a JSON body.
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

// GET / — query-string search. Reads `q` (required), `limit` (optional int),
// `types` (optional CSV). Uses the same `search()` function as the POST
// handler so semantics stay identical. Declared AFTER /recent and
// /suggestions so those static paths aren't shadowed.
searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rawQuery = (req.query.q ?? "").toString().trim();
    if (!rawQuery) {
      res.status(400).json({
        error: "q is required",
        message: "GET /api/v1/search requires a `q` query parameter (e.g. ?q=neon)",
      });
      return;
    }
    const rawLimit = (req.query.limit ?? "").toString().trim();
    const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 50) : 20;
    const rawTypes = (req.query.types ?? "").toString().trim();
    const types = rawTypes
      ? rawTypes.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const result = await search({ query: rawQuery, types, limit });
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
