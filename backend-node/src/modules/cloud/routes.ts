/**
 * Cloud routes — /api/v1/cloud
 *
 *   GET    /status            cloud service status
 *   GET    /projects          user's cloud projects
 *   POST   /projects          deploy a new project
 *   GET    /projects/:id      single project
 *   DELETE /projects/:id      delete a project
 *   GET    /storage           storage usage summary
 *   GET    /deployments       deployment history
 *
 * Order matters: static routes (`/status`, `/projects`, `/storage`,
 * `/deployments`) are declared before `/projects/:id` so the literal
 * paths aren't captured as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  deleteProject,
  deployProject,
  getProjectById,
  getStatus,
  getStorage,
  listDeployments,
  listProjects,
} from "./service.js";
import {
  CloudProjectParamsSchema,
  DeployCloudProjectSchema,
} from "./schema.js";

export const cloudRouter = Router();

cloudRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const status = await getStatus();
    res.json({ data: status });
  }),
);

cloudRouter.get(
  "/projects",
  asyncHandler(async (_req, res) => {
    const items = await listProjects();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

cloudRouter.post(
  "/projects",
  validateBody(DeployCloudProjectSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof DeployCloudProjectSchema
    >;
    const project = await deployProject(input);
    res.status(201).json({ data: project });
  }),
);

cloudRouter.get(
  "/projects/:id",
  validateParams(CloudProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CloudProjectParamsSchema
    >;
    const project = await getProjectById(id);
    res.json({ data: project });
  }),
);

cloudRouter.delete(
  "/projects/:id",
  validateParams(CloudProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CloudProjectParamsSchema
    >;
    await deleteProject(id);
    res.status(204).end();
  }),
);

cloudRouter.get(
  "/storage",
  asyncHandler(async (_req, res) => {
    const storage = await getStorage();
    res.json({ data: storage });
  }),
);

cloudRouter.get(
  "/deployments",
  asyncHandler(async (_req, res) => {
    const items = await listDeployments();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
