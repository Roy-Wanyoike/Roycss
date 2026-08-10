/**
 * Zod schemas for the style-query module.
 *
 * Defines the body shape for POST /style-query/generate — build a
 * @container style() query CSS block from a property+value+selector.
 */
import { z } from "zod";

const IDENT_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const SELECTOR_RE = /^[a-zA-Z0-9_\s.:>#\[\]="'()*+~^$|-]+$/;

/** Body for POST /style-query/generate — build a style() container query. */
export const StyleQueryGenerateSchema = z.object({
  /** Container name (optional). If omitted, the closest ancestor container is used. */
  containerName: z
    .string()
    .trim()
    .max(60, "containerName must be at most 60 characters")
    .regex(IDENT_RE, "containerName must be a CSS identifier")
    .optional(),
  /** Custom property or built-in property to test (e.g. "--theme" or "font-weight"). */
  property: z
    .string()
    .trim()
    .min(1, "property is required")
    .max(80, "property must be at most 80 characters"),
  /** Value to match (e.g. "dark", "700", "compact"). */
  value: z
    .string()
    .trim()
    .min(1, "value is required")
    .max(120, "value must be at most 120 characters"),
  /** Selector for the rule body that applies when the query matches. */
  selector: z
    .string()
    .trim()
    .min(1, "selector is required")
    .max(200, "selector must be at most 200 characters")
    .regex(SELECTOR_RE, "selector contains invalid characters"),
  /** Block of declarations to apply when the style query matches. */
  declarations: z
    .record(z.string(), z.string())
    .refine((o) => Object.keys(o).length > 0, "declarations must not be empty"),
  /** Optional fallback selector that applies when @supports fails. */
  fallbackDeclarations: z
    .record(z.string(), z.string())
    .optional(),
});
export type StyleQueryGenerateInput = z.infer<typeof StyleQueryGenerateSchema>;
