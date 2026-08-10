/**
 * Zod schemas for the initial-letter module.
 *
 * Defines the body shape for POST /initial-letter/generate — generate
 * ::first-letter CSS for a drop cap from size/sink/font config.
 */
import { z } from "zod";

const SELECTOR_RE = /^[a-zA-Z0-9_\s.:>#\[\]="'()*+~^$|-]+$/;

/** Body for POST /initial-letter/generate. */
export const InitialLetterGenerateSchema = z.object({
  /** Selector to apply the ::first-letter rule to. */
  selector: z
    .string()
    .trim()
    .min(1, "selector is required")
    .max(120, "selector must be at most 120 characters")
    .regex(SELECTOR_RE, "selector contains invalid characters"),
  /** Drop-cap size in lines (1..6). */
  size: z.number().int().min(1).max(6),
  /** Sink in lines (0 = raised cap; otherwise typically = size). */
  sink: z.number().int().min(0).max(6),
  /** Whether to emit the `drop` keyword (forces a drop cap even when size<2). */
  dropCap: z.boolean().default(false),
  /** Font family for the drop cap. */
  fontFamily: z
    .enum(["serif", "sans-serif", "monospace", "display"])
    .default("serif"),
  /** Font weight (100..900). */
  fontWeight: z.number().int().min(100).max(900).default(700),
  /** Drop-cap color (hex). */
  color: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "color must be hex")
    .default("#5b8def"),
  /** Font-size multiplier applied on top of initial-letter (1..4). */
  multiplier: z.number().min(1).max(4).default(1),
  /** initial-letter-align value. */
  align: z.enum(["first-baseline", "leading", "auto"]).default("leading"),
});
export type InitialLetterGenerateInput = z.infer<
  typeof InitialLetterGenerateSchema
>;
