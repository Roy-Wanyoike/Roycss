/**
 * Studio routes — /api/v1/studio
 *
 *   GET    /projects          list user's visual-builder projects
 *   POST   /projects          create a new project
 *   GET    /projects/:id      single project (with component tree)
 *   PUT    /projects/:id      update a project
 *   DELETE /projects/:id      delete a project
 *   GET    /templates         studio starter templates
 *
 * Order matters: /projects and /templates are declared before /projects/:id
 * so the literal paths aren't captured as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  listTemplates,
  updateProject,
} from "./service.js";
import {
  CreateStudioProjectSchema,
  StudioProjectParamsSchema,
  UpdateStudioProjectSchema,
} from "./schema.js";

export const studioRouter = Router();

studioRouter.get(
  "/projects",
  asyncHandler(async (_req, res) => {
    const items = await listProjects();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

studioRouter.post(
  "/projects",
  validateBody(CreateStudioProjectSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof CreateStudioProjectSchema
    >;
    const project = await createProject(input);
    res.status(201).json({ data: project });
  }),
);

studioRouter.get(
  "/templates",
  asyncHandler(async (_req, res) => {
    const items = await listTemplates();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

studioRouter.get(
  "/projects/:id",
  validateParams(StudioProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StudioProjectParamsSchema
    >;
    const project = await getProjectById(id);
    res.json({ data: project });
  }),
);

studioRouter.put(
  "/projects/:id",
  validateParams(StudioProjectParamsSchema),
  validateBody(UpdateStudioProjectSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StudioProjectParamsSchema
    >;
    const input = req.body as unknown as z.infer<
      typeof UpdateStudioProjectSchema
    >;
    const project = await updateProject(id, input);
    res.json({ data: project });
  }),
);

studioRouter.delete(
  "/projects/:id",
  validateParams(StudioProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StudioProjectParamsSchema
    >;
    await deleteProject(id);
    res.status(204).end();
  }),
);
