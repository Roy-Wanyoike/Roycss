/**
 * Zod schemas for the text-wrap module.
 *
 * Defines the body shape for POST /text-wrap/analyze — analyze text
 * wrapping for given properties + sample text.
 */
import { z } from "zod";

/** Body for POST /text-wrap/analyze. */
export const TextWrapAnalyzeSchema = z.object({
  /** Sample text to wrap. */
  text: z
    .string()
    .trim()
    .min(1, "text is required")
    .max(10_000, "text must be at most 10000 characters"),
  /** Container width in px (the box text wraps inside). */
  containerWidth: z.number().int().min(120).max(2000),
  /** Font size in px (assumed for line-height computation). */
  fontSize: z.number().min(8).max(96).default(16),
  /** Line-height multiplier. */
  lineHeight: z.number().min(0.8).max(3).default(1.5),
  /** Wrap-related properties. */
  properties: z.object({
    textWrap: z
      .enum(["wrap", "nowrap", "balance", "pretty", "stable"])
      .default("wrap"),
    textWrapMode: z.enum(["wrap", "nowrap"]).default("wrap"),
    lineBreak: z
      .enum(["auto", "loose", "normal", "strict", "anywhere"])
      .default("auto"),
    wordBreak: z
      .enum(["normal", "break-all", "keep-all", "auto-phrase", "break-word"])
      .default("normal"),
    overflowWrap: z
      .enum(["normal", "break-word", "anywhere"])
      .default("normal"),
    hyphens: z.enum(["none", "manual", "auto"]).default("none"),
    hangingPunctuation: z
      .string()
      .regex(/^(none|first|last|force-end|allow-end)(\s+(first|last|force-end|allow-end))*$/, "hanging-punctuation must be a space-separated list of: none, first, last, force-end, allow-end")
      .default("none"),
    textAlign: z
      .enum(["start", "end", "left", "right", "center", "justify"])
      .default("start"),
  }),
});
export type TextWrapAnalyzeInput = z.infer<typeof TextWrapAnalyzeSchema>;
