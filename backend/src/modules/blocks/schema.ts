/**
 * Zod schemas for the blocks module.
 */
import { z } from "zod";

/** Body for POST /blocks. */
export const BlockCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(60, "Category must be at most 60 characters"),
  industry: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().min(10).max(2000),
  components: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  author: z.string().trim().min(1).max(120).optional(),
});
export type BlockCreateInput = z.infer<typeof BlockCreateSchema>;

/** Route params for /blocks/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
