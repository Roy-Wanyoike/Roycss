/**
 * Plugin Hub routes — /api/v1/plugins
 *
 *   GET   /                      list all plugins
 *   GET   /:id                   single plugin by id
 *   POST  /                      register a new plugin
 *   GET   /:id/changelog         changelog for a plugin
 *   GET   /categories            list all plugin categories
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  createPlugin,
  getPluginById,
  getPluginChangelog,
  listPluginCategories,
  listPlugins,
} from "./service.js";
import { IdParamsSchema, PluginCreateSchema } from "./schema.js";

export const pluginHubRouter = Router();

pluginHubRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const items = await listPluginCategories();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

pluginHubRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listPlugins();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

pluginHubRouter.post(
  "/",
  validateBody(PluginCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof PluginCreateSchema>;
    const plugin = await createPlugin(input);
    res.status(201).json({ data: plugin });
  }),
);

pluginHubRouter.get(
  "/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const plugin = await getPluginById(id);
    res.json({ data: plugin });
  }),
);

pluginHubRouter.get(
  "/:id/changelog",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const entries = await getPluginChangelog(id);
    res.json({ data: entries, meta: { count: entries.length } });
  }),
);
