/**
 * Zod schemas for the starting-style module.
 *
 * Defines the body shape for POST /starting-style/generate — generate
 * @starting-style CSS from duration + easing + animated properties +
 * allow-discrete config; returns base/hidden/@starting-style blocks.
 */
import { z } from "zod";

const SELECTOR_RE = /^[a-zA-Z0-9_\s.:>#\[\]="'()*+~^$|-]+$/;

/** Body for POST /starting-style/generate. */
export const StartingStyleGenerateSchema = z.object({
  /** Selector for the animated element. */
  selector: z
    .string()
    .trim()
    .min(1, "selector is required")
    .max(120, "selector must be at most 120 characters")
    .regex(SELECTOR_RE, "selector contains invalid characters"),
  /** Transition duration in milliseconds (0..5000). */
  duration: z.number().int().min(0).max(5000),
  /** Easing function name. */
  easing: z.enum([
    "linear",
    "ease",
    "ease-in",
    "ease-out",
    "ease-in-out",
    "cubic-bezier",
  ]),
  /** Cubic-bezier control points (required when easing === "cubic-bezier"). */
  cubicBezier: z
    .tuple([z.number(), z.number(), z.number(), z.number()])
    .optional(),
  /** Animated properties — at least one required. */
  properties: z
    .array(
      z.enum([
        "opacity",
        "transform",
        "scale",
        "translate",
        "color",
        "background-color",
        "border-color",
      ]),
    )
    .min(1, "at least one property is required"),
  /** translateY in px for the hidden/starting state (used when transform/scale/translate is animated). */
  translateY: z.number().min(-200).max(200).default(20),
  /** Initial scale for the hidden/starting state. */
  scaleFrom: z.number().min(0).max(2).default(0.95),
  /** Whether to include `transition-behavior: allow-discrete` (for display: none animation). */
  allowDiscrete: z.boolean().default(false),
  /** Class name used to toggle the hidden state. */
  hiddenClass: z.string().trim().max(60).default("is-hidden"),
});
export type StartingStyleGenerateInput = z.infer<
  typeof StartingStyleGenerateSchema
>;
