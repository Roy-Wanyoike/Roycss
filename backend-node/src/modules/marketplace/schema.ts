/**
 * Zod schemas for the marketplace module.
 *
 * Defines the query shape for listing, the body shape for publishing a
 * new template, and the route params for /templates/:id.
 */
import { z } from "zod";

export const TemplateCategoryEnum = z.enum([
  "dashboard",
  "landing",
  "admin",
  "crm",
  "pos",
  "banking",
  "portfolio",
  "ecommerce",
  "blog",
  "documentation",
  "pricing",
  "auth",
]);

/** Query params for GET /templates */
export const ListTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
  category: TemplateCategoryEnum.optional(),
  search: z.string().trim().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  free: z.coerce.boolean().optional(),
});

/** Route params for /templates/:id. */
export const TemplateParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /templates — publish a new template. */
export const PublishTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  category: TemplateCategoryEnum,
  price: z.number().min(0, "Price must be >= 0").max(10_000),
  author: z
    .string()
    .trim()
    .min(1, "Author is required")
    .max(80, "Author must be at most 80 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  features: z.array(z.string().trim().min(1)).min(1).max(20).default([]),
  thumbnail: z
    .string()
    .url("Thumbnail must be a valid URL")
    .optional()
    .or(z.literal("")),
});
export type PublishTemplateInput = z.infer<typeof PublishTemplateSchema>;
