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
 * Ownership (audit F-06): POST attributes the new theme to the
 * authenticated caller (`req.user.sub`); PUT/DELETE only ever touch
 * the caller's OWN themes — foreign and seeded platform presets
 * (owner `null`, read-only) read as a flat 404.
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
    // Attribution = the verified token subject, never a body field (F-07).
    const theme = await createTheme(input, req.user!.sub);
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
    // Ownership is enforced server-side against the token subject (F-06):
    // foreign ids and read-only platform presets read as flat 404s.
    const theme = await updateTheme(id, req.user!.sub, input);
    res.json({ data: theme });
  }),
);

themesRouter.delete(
  "/:id",
  requireAuth,
  validateParams(ThemeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof ThemeParamsSchema>;
    await deleteTheme(id, req.user!.sub);
    res.status(204).end();
  }),
);
