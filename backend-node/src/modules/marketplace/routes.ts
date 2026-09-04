/**
 * Marketplace routes — /api/v1/marketplace
 *
 *   GET   /templates              list with search + filter (category, rating, free)
 *   GET   /templates/:id          single template by id
 *   POST  /templates              publish a new template (auth: Bearer token)
 *   GET   /templates/:id/reviews  buyer reviews for a template
 *
 * Mutating routes require authentication (issue #64) — templates
 * persist to the `Template` Prisma model.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../server/middleware/validate.js";
import {
  getReviewsForTemplate,
  getTemplateById,
  listTemplates,
  publishTemplate,
} from "./service.js";
import {
  ListTemplatesQuerySchema,
  PublishTemplateSchema,
  TemplateParamsSchema,
} from "./schema.js";

export const marketplaceRouter = Router();

marketplaceRouter.get(
  "/templates",
  validateQuery(ListTemplatesQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<
      typeof ListTemplatesQuerySchema
    >;
    const result = await listTemplates(input);
    res.json({
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),
);

marketplaceRouter.post(
  "/templates",
  requireAuth,
  validateBody(PublishTemplateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof PublishTemplateSchema
    >;
    const template = await publishTemplate(input);
    res.status(201).json({ data: template });
  }),
);

marketplaceRouter.get(
  "/templates/:id",
  validateParams(TemplateParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof TemplateParamsSchema
    >;
    const template = await getTemplateById(id);
    res.json({ data: template });
  }),
);

marketplaceRouter.get(
  "/templates/:id/reviews",
  validateParams(TemplateParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof TemplateParamsSchema
    >;
    const reviews = await getReviewsForTemplate(id);
    res.json({
      data: reviews,
      meta: {
        count: reviews.length,
        average: reviews.length
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0,
      },
    });
  }),
);
