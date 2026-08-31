/**
 * Pair routes — /api/v1/pair
 *
 *   POST  /chat          send a message to Roy Pair (mock)
 *   GET   /history       list all chat sessions
 *   GET   /suggestions   list proactive suggestions
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { chat, listHistory, listSuggestions } from "./service.js";
import { PairChatSchema } from "./schema.js";

export const pairRouter = Router();

pairRouter.post(
  "/chat",
  validateBody(PairChatSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof PairChatSchema>;
    const { session, reply } = await chat(input);
    res.status(201).json({ data: { session, reply } });
  }),
);

pairRouter.get(
  "/history",
  asyncHandler(async (_req, res) => {
    const items = await listHistory();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

pairRouter.get(
  "/suggestions",
  asyncHandler(async (_req, res) => {
    const items = await listSuggestions();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
