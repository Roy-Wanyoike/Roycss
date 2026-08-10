/**
 * Mentor routes — /api/v1/mentor
 *
 *   POST /chat        send a chat message to the mentor
 *   GET  /topics      list all mentor topics
 *   GET  /progress    learner progress snapshot
 *   GET  /levels      list skill levels
 *
 * Order matters: static routes (`/chat`, `/topics`, `/progress`,
 * `/levels`) are declared before any param routes (currently none).
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import {
  getProgress,
  listLevels,
  listTopics,
  sendChat,
} from "./service.js";
import { MentorChatSchema } from "./schema.js";

export const mentorRouter = Router();

mentorRouter.post(
  "/chat",
  validateBody(MentorChatSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof MentorChatSchema>;
    const result = await sendChat({
      message: input.message,
      topicId: input.topicId || undefined,
    });
    res.status(201).json({ data: result });
  }),
);

mentorRouter.get(
  "/topics",
  asyncHandler(async (_req, res) => {
    const items = await listTopics();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

mentorRouter.get(
  "/progress",
  asyncHandler(async (_req, res) => {
    const progress = await getProgress();
    res.json({ data: progress });
  }),
);

mentorRouter.get(
  "/levels",
  asyncHandler(async (_req, res) => {
    const items = await listLevels();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
