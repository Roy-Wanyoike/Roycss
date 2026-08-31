/**
 * Zod schemas for the logical-properties module.
 *
 * Defines the body shape for POST /logical-properties/convert — convert
 * a physical-CSS snippet to logical equivalents.
 */
import { z } from "zod";

/** Body for POST /logical-properties/convert. */
export const LogicalConvertSchema = z.object({
  /** Raw CSS snippet to convert (e.g. ".card { margin-left: 1rem; padding-top: 8px; }"). */
  css: z
    .string()
    .trim()
    .min(1, "css is required")
    .max(20_000, "css must be at most 20000 characters"),
  /** Optional: target writing-mode hint (defaults to horizontal-tb). */
  writingMode: z
    .enum(["horizontal-tb", "vertical-rl", "vertical-lr", "sideways-rl", "sideways-lr"])
    .default("horizontal-tb"),
});
export type LogicalConvertInput = z.infer<typeof LogicalConvertSchema>;
