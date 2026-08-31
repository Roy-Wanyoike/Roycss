/**
 * Workspace routes — /api/v1/workspace
 *
 *   GET  /resources           list all resource types (with items)
 *   GET  /team                list team members
 *   POST /invite              invite a new team member
 *   GET  /resources/:type     single resource type with its items
 *
 * Order matters: static routes (`/resources`, `/team`, `/invite`) are
 * declared before `/resources/:type` so the literal paths aren't captured
 * as a type identifier.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  inviteMember,
  listResources,
  listResourcesByType,
  listTeam,
} from "./service.js";
import {
  WorkspaceInviteSchema,
  WorkspaceResourceTypeParamsSchema,
} from "./schema.js";

export const workspaceRouter = Router();

workspaceRouter.get(
  "/resources",
  asyncHandler(async (_req, res) => {
    const items = await listResources();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

workspaceRouter.get(
  "/team",
  asyncHandler(async (_req, res) => {
    const items = await listTeam();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

workspaceRouter.post(
  "/invite",
  validateBody(WorkspaceInviteSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof WorkspaceInviteSchema>;
    const member = await inviteMember({
      email: input.email,
      name: input.name || undefined,
      role: input.role,
    });
    res.status(201).json({ data: member });
  }),
);

workspaceRouter.get(
  "/resources/:type",
  validateParams(WorkspaceResourceTypeParamsSchema),
  asyncHandler(async (req, res) => {
    const { type } = req.params as unknown as z.infer<
      typeof WorkspaceResourceTypeParamsSchema
    >;
    const result = await listResourcesByType(type);
    res.json({ data: result });
  }),
);
