/**
 * Themes routes — /api/v1/themes
 *
 *   GET    /            list all themes
 *   GET    /:id         single theme by id
 *   POST   /            create a new theme        (auth: Bearer token)
 *   PUT    /:id         update an existing theme  (auth: Bearer token)
 *   DELETE /:id         delete a theme            (auth: Bearer token)
 *
 * Mutating routes require authentication (issue #64) — themes persist
 * to the `Theme` Prisma model. Read routes stay public for the
 * marketing/demo site.
 *
 * Order matters: static routes (`/`) are declared before param routes
 * so `/foo` isn't captured as an id.
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
  createTheme,
  deleteTheme,
  getThemeById,
  listThemes,
  updateTheme,
} from "./service.js";
import {
  CreateThemeSchema,
  ThemeParamsSchema,
  UpdateThemeSchema,
} from "./schema.js";

export const themesRouter = Router();

themesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listThemes();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

themesRouter.post(
  "/",
  requireAuth,
  validateBody(CreateThemeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CreateThemeSchema>;
    const theme = await createTheme(input);
    res.status(201).json({ data: theme });
  }),
);

themesRouter.get(
  "/:id",
  validateParams(ThemeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof ThemeParamsSchema>;
    const theme = await getThemeById(id);
    res.json({ data: theme });
  }),
);

themesRouter.put(
  "/:id",
  requireAuth,
  validateParams(ThemeParamsSchema),
  validateBody(UpdateThemeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof ThemeParamsSchema>;
    const input = req.body as unknown as z.infer<typeof UpdateThemeSchema>;
    const theme = await updateTheme(id, input);
    res.json({ data: theme });
  }),
);

themesRouter.delete(
  "/:id",
  requireAuth,
  validateParams(ThemeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof ThemeParamsSchema>;
    await deleteTheme(id);
    res.status(204).end();
  }),
);
