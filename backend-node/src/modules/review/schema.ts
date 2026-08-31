/**
 * Zod schemas for the review module.
 *
 * Defines the body shape for POST /review/code and route params for
 * /review/results/:id.
 */
import { z } from "zod";

const LANG_ENUM = z.enum([
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "css",
  "html",
  "json",
  "python",
  "go",
  "rust",
]);

/** Body for POST /review/code — submit code for review (mock). */
export const ReviewCodeSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, "filename is required")
    .max(255, "filename must be at most 255 characters"),
  language: LANG_ENUM,
  code: z
    .string()
    .min(1, "code is required")
    .max(200_000, "code must be at most 200,000 characters"),
  /** Optional focus areas to prioritize. */
  focus: z
    .array(z.enum(["performance", "accessibility", "security", "maintainability"]))
    .max(4)
    .optional(),
});
export type ReviewCodeInput = z.infer<typeof ReviewCodeSchema>;

/** Route params for /review/results/:id. */
export const ReviewParamsSchema = z.object({
  id: z.string().min(1),
});
