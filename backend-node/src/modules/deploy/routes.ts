/**
 * Deploy routes — /api/v1/deploy
 *
 *   POST /create           create a new deployment (auth: Bearer token)
 *   GET  /history          list deployment history
 *   GET  /platforms        list configured platforms
 *   GET  /environments     list configured environments
 *   GET  /history/:id      single deployment by id
 *
 * Mutating routes require authentication (issue #64) — deployments
 * persist to the `Deployment` Prisma model.
 *
 * Order matters: static routes (`/create`, `/history`, `/platforms`,
 * `/environments`) are declared before `/history/:id` so the literal
 * paths aren't captured as an id.
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
  createDeployment,
  getHistoryById,
  listEnvironments,
  listHistory,
  listPlatforms,
} from "./service.js";
import { DeployCreateSchema, DeployHistoryParamsSchema } from "./schema.js";

export const deployRouter = Router();

deployRouter.post(
  "/create",
  requireAuth,
  validateBody(DeployCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof DeployCreateSchema>;
    const deployment = await createDeployment({
      projectId: input.projectId,
      environment: input.environment,
      platformId: input.platformId,
      branch: input.branch || undefined,
      commit: input.commit || undefined,
    });
    res.status(201).json({ data: deployment });
  }),
);

deployRouter.get(
  "/history",
  asyncHandler(async (_req, res) => {
    const items = await listHistory();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

deployRouter.get(
  "/platforms",
  asyncHandler(async (_req, res) => {
    const items = await listPlatforms();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

deployRouter.get(
  "/environments",
  asyncHandler(async (_req, res) => {
    const items = await listEnvironments();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

deployRouter.get(
  "/history/:id",
  validateParams(DeployHistoryParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof DeployHistoryParamsSchema
    >;
    const deployment = await getHistoryById(id);
    res.json({ data: deployment });
  }),
);
