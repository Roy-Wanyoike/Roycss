/**
 * Sync routes — /api/v1/sync
 *
 *   GET   /status     list all integration statuses
 *   POST  /figma      pull design tokens from Figma (mock)
 *   POST  /github     push the design system to GitHub (mock)
 *   POST  /tokens     push local design tokens upstream (mock)
 *   GET   /history    list all sync history entries
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import {
  listHistory,
  listStatus,
  syncFigma,
  syncGithub,
  syncTokens,
} from "./service.js";
import {
  SyncFigmaSchema,
  SyncGithubSchema,
  SyncTokensSchema,
} from "./schema.js";

export const syncRouter = Router();

syncRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const items = await listStatus();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

syncRouter.post(
  "/figma",
  validateBody(SyncFigmaSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof SyncFigmaSchema>;
    const entry = await syncFigma(input);
    res.status(201).json({ data: entry });
  }),
);

syncRouter.post(
  "/github",
  validateBody(SyncGithubSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof SyncGithubSchema>;
    const entry = await syncGithub(input);
    res.status(201).json({ data: entry });
  }),
);

syncRouter.post(
  "/tokens",
  validateBody(SyncTokensSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof SyncTokensSchema>;
    const entry = await syncTokens(input);
    res.status(201).json({ data: entry });
  }),
);

syncRouter.get(
  "/history",
  asyncHandler(async (_req, res) => {
    const items = await listHistory();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
