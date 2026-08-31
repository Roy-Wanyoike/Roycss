/**
 * Zod schemas for the property-registrar module.
 *
 * Defines the body shape for POST /property-registrar/generate — generate
 * a @property (CSS Houdini) rule from a name + syntax + inherits +
 * initialValue configuration, plus an unregistered-variable fallback.
 */
import { z } from "zod";

const PROPERTY_NAME_RE = /^--[a-zA-Z_][\w-]*$/;

/** The 11 supported CSS syntax strings accepted by @property. */
export const SYNTAX_VALUES = [
  "<color>",
  "<length>",
  "<percentage>",
  "<length-percentage>",
  "<number>",
  "<integer>",
  "<angle>",
  "<time>",
  "<resolution>",
  "<url>",
  "*",
] as const;

/** Body for POST /property-registrar/generate. */
export const PropertyRegistrarGenerateSchema = z.object({
  /** Custom property name (must start with --). */
  name: z
    .string()
    .trim()
    .min(3, "name is required")
    .max(80, "name must be at most 80 characters")
    .regex(PROPERTY_NAME_RE, "name must be a custom property like --foo"),
  /** One of the 11 CSS syntax strings. */
  syntax: z.enum(SYNTAX_VALUES),
  /** Whether the property inherits down the DOM tree. */
  inherits: z.boolean(),
  /** Initial value. Forbidden for the universal `*` syntax. */
  initialValue: z.string().trim().max(200).optional(),
  /** Optional selector where the property is consumed in a demo. */
  demoSelector: z
    .string()
    .trim()
    .max(120)
    .regex(
      /^[a-zA-Z0-9_\s.:>#\[\]="'()*+~^$|-]+$/,
      "demoSelector contains invalid characters",
    )
    .default(":root"),
  /** Optional CSS property that consumes the var (e.g. background, color). */
  demoProperty: z
    .string()
    .trim()
    .max(80)
    .default("background"),
  /** Optional hover/state value to demonstrate smooth interpolation. */
  demoValue: z
    .string()
    .trim()
    .max(120)
    .optional(),
});
export type PropertyRegistrarGenerateInput = z.infer<
  typeof PropertyRegistrarGenerateSchema
>;
