/**
 * Pair routes — /api/v1/pair
 *
 *   POST  /chat          send a message to Roy Pair (auth: Bearer token)
 *   GET   /history       list all chat sessions
 *   GET   /suggestions   list proactive suggestions
 *
 * Mutating routes require authentication (issue #64) — chat is
 * LLM-backed when LLM keys are configured (cost/abuse vector) and
 * sessions accumulate in the in-process store.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { chat, listHistory, listSuggestions } from "./service.js";
import { PairChatSchema } from "./schema.js";

export const pairRouter = Router();

pairRouter.post(
  "/chat",
  requireAuth,
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
