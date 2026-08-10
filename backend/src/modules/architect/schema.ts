/**
 * Zod schemas for the architect module.
 *
 * Defines the body shape for POST /architect/generate and route params
 * for /architect/templates/:id and /architect/results/:id.
 */
import { z } from "zod";

/** Body for POST /architect/generate — kick off an architecture generation. */
export const GenerateArchitectureSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
  /** Optional template to base the generation on. */
  templateId: z.string().trim().min(1).optional(),
  /** Optional desired stack (e.g. ["next", "prisma", "redis"]). */
  stack: z.array(z.string().trim().min(1)).max(20).optional(),
});
export type GenerateArchitectureInput = z.infer<
  typeof GenerateArchitectureSchema
>;

/** Route params for /architect/templates/:id and /architect/results/:id. */
export const ArchitectureParamsSchema = z.object({
  id: z.string().min(1),
});
