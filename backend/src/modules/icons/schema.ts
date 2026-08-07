/**
 * Zod schemas for the icons module.
 *
 * The `Icon` domain type lives in `../../types/index.ts`; here we define
 * only the request shapes (query + params) and the category union used
 * for validation/filtering.
 */
import { z } from "zod";

export const IconCategoryEnum = z.enum([
  "navigation",
  "action",
  "communication",
  "media",
  "files",
  "user",
  "status",
]);
export type IconCategoryLiteral = z.infer<typeof IconCategoryEnum>;

/** Query params for GET /icons */
export const ListIconsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  category: IconCategoryEnum.optional(),
  search: z.string().trim().optional(),
});

/** Route params for /icons/:name — names are kebab-case. */
export const IconNameParamsSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Icon name must be kebab-case"),
});
