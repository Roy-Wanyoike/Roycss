/**
 * Zod schemas for the effects module.
 *
 * These schemas define:
 *   - The EffectCategory union (mirrors src/lib/roycss-types.ts)
 *   - The PreviewType union
 *   - The Effect domain model (parsed from dist/effects.json)
 *   - The request shapes for list/search/get endpoints
 *   - The response shapes returned by the API
 */
import { z } from "zod";

export const EffectCategoryEnum = z.enum([
  "animations",
  "hover",
  "text",
  "backgrounds",
  "loaders",
  "3d-transforms",
  "buttons",
  "cards",
  "borders",
  "filters",
  "forms",
  "navigation",
  "scroll",
  "cursor",
  "page-transitions",
  "glass-ui",
  "particles",
  "microinteractions",
  "visual",
  "misc",
]);
export type EffectCategory = z.infer<typeof EffectCategoryEnum>;

export const PreviewTypeEnum = z.enum([
  "box",
  "text",
  "button",
  "loader",
  "card",
  "background",
]);
export type PreviewType = z.infer<typeof PreviewTypeEnum>;

/** Shape of an entry in dist/effects.json. */
export const EffectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: EffectCategoryEnum,
  description: z.string(),
  tags: z.array(z.string()),
  previewType: PreviewTypeEnum,
  previewText: z.string().nullable().optional(),
  childCount: z.number().int().nullable().optional(),
  cssCode: z.string().optional(),
});
export type EffectDTO = z.infer<typeof EffectSchema>;

/** Query params for GET /effects */
export const ListEffectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
  category: EffectCategoryEnum.optional(),
  tag: z.string().optional(),
  previewType: PreviewTypeEnum.optional(),
  sort: z
    .enum(["name", "name-desc", "category", "id"])
    .optional()
    .default("id"),
});

/** Query params for GET /effects/search */
export const SearchEffectsQuerySchema = z.object({
  q: z.string().min(1, "Search query (q) is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
  category: EffectCategoryEnum.optional(),
});

/** Route params for GET /effects/:id */
export const EffectParamsSchema = z.object({
  id: z.string().min(1),
});
