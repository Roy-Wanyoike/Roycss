/**
 * Version routes — /api/v1/version
 *
 *   GET   /current            get the current platform version
 *   GET   /latest             get the latest available version
 *   GET   /changelog          get the full changelog
 *   GET   /breaking-changes   get all known breaking changes
 *   POST  /check-upgrade      check whether an upgrade is available
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import {
  checkUpgrade,
  getBreakingChanges,
  getChangelog,
  getCurrentVersion,
  getLatestVersion,
} from "./service.js";
import { CheckUpgradeSchema } from "./schema.js";

export const versionRouter = Router();

versionRouter.get(
  "/current",
  asyncHandler(async (_req, res) => {
    const data = await getCurrentVersion();
    res.json({ data });
  }),
);

versionRouter.get(
  "/latest",
  asyncHandler(async (_req, res) => {
    const data = await getLatestVersion();
    res.json({ data });
  }),
);

versionRouter.get(
  "/changelog",
  asyncHandler(async (_req, res) => {
    const items = await getChangelog();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

versionRouter.get(
  "/breaking-changes",
  asyncHandler(async (_req, res) => {
    const items = await getBreakingChanges();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

versionRouter.post(
  "/check-upgrade",
  validateBody(CheckUpgradeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CheckUpgradeSchema>;
    const result = await checkUpgrade(input);
    res.json({ data: result });
  }),
);
