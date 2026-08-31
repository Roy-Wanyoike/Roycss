/**
 * Zod schemas for the plugin-hub module.
 */
import { z } from "zod";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Body for POST /plugins. */
export const PluginCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(120, "Slug must be at most 120 characters")
    .regex(SLUG_RE, "Slug must be kebab-case (e.g. roycss-plugin-stripe)"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(60, "Category must be at most 60 characters"),
  description: z.string().trim().min(10).max(2000),
  author: z.string().trim().min(1).max(120).optional(),
  version: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^\d+\.\d+\.\d+/, "Version must be semver")
    .optional(),
  license: z.string().trim().min(1).max(40).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});
export type PluginCreateInput = z.infer<typeof PluginCreateSchema>;

/** Route params for /plugins/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
