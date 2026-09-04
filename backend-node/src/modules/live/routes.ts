/**
 * Live routes — /api/v1/live
 *
 *   POST  /sessions                  create a live session (auth: Bearer token)
 *   GET   /sessions/:id              fetch a live session by id
 *   GET   /sessions/:id/users        list users in a live session
 *   POST  /sessions/:id/message      post a message     (auth: Bearer token)
 *
 * Mutating routes require authentication (issue #64) — sessions and
 * messages persist to the `LiveSession`/`LiveMessage` Prisma models.
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  createLiveSession,
  getLiveSessionById,
  getSessionMessages,
  getSessionUsers,
  listSessions,
  postSessionMessage,
} from "./service.js";
import {
  CreateSessionSchema,
  IdParamsSchema,
  PostMessageSchema,
} from "./schema.js";

export const liveRouter = Router();

liveRouter.get(
  "/sessions",
  asyncHandler(async (_req, res) => {
    const items = await listSessions();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

liveRouter.post(
  "/sessions",
  requireAuth,
  validateBody(CreateSessionSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CreateSessionSchema>;
    const session = await createLiveSession(input);
    res.status(201).json({ data: session });
  }),
);

liveRouter.get(
  "/sessions/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const session = await getLiveSessionById(id);
    res.json({ data: session });
  }),
);

liveRouter.get(
  "/sessions/:id/users",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const users = await getSessionUsers(id);
    res.json({ data: users, meta: { count: users.length } });
  }),
);

liveRouter.post(
  "/sessions/:id/message",
  requireAuth,
  validateParams(IdParamsSchema),
  validateBody(PostMessageSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const input = req.body as unknown as z.infer<typeof PostMessageSchema>;
    const message = await postSessionMessage(id, input);
    res.status(201).json({ data: message });
  }),
);
