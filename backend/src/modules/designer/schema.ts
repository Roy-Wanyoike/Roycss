/**
 * Zod schemas for the designer module.
 *
 * Defines the body shape for POST /designer/generate and route params
 * for /designer/results/:id.
 */
import { z } from "zod";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Body for POST /designer/generate — kick off a design generation (mock). */
export const GenerateDesignSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
  /** Optional preset id to base the design on. */
  presetId: z.string().trim().min(1).optional(),
  /** Optional brand palette override (hex colors). */
  palette: z
    .array(z.string().regex(HEX_RE, "palette entries must be hex colors"))
    .max(8)
    .optional(),
  /** Desired component list (e.g. ["hero", "card", "button"]). */
  components: z
    .array(z.string().trim().min(1))
    .max(20)
    .default(["hero", "card", "button"]),
});
export type GenerateDesignInput = z.infer<typeof GenerateDesignSchema>;

/** Route params for /designer/results/:id. */
export const DesignerParamsSchema = z.object({
  id: z.string().min(1),
});
