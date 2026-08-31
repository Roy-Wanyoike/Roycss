/**
 * Zod schemas for the scope module.
 *
 * Defines the body shape for POST /scope/analyze — analyze a @scope rule
 * against a sample DOM tree.
 */
import { z } from "zod";

const SELECTOR_RE = /^[a-zA-Z0-9_\s.:>#\[\]="'()*+~^$|-]*$/;

/** A single DOM node in the test tree. */
export const ScopeNodeSchema: z.ZodType<ScopeNodeShape> = z.lazy(() =>
  z.object({
    tag: z
      .string()
      .trim()
      .min(1, "tag is required")
      .max(20, "tag must be at most 20 characters"),
    id: z.string().trim().max(60).optional(),
    class: z.string().trim().max(200).optional(),
    /** Inner text content (used only for the explanation, not matching). */
    text: z.string().trim().max(200).optional(),
    children: z.array(ScopeNodeSchema).max(50).default([]),
  }),
);

export interface ScopeNodeShape {
  tag: string;
  id?: string;
  class?: string;
  text?: string;
  children?: ScopeNodeShape[];
}

/** Body for POST /scope/analyze. */
export const ScopeAnalyzeSchema = z.object({
  /** @scope root selector (the lower bound). */
  root: z
    .string()
    .trim()
    .min(1, "root is required")
    .max(200, "root must be at most 200 characters")
    .regex(SELECTOR_RE, "root contains invalid selector characters"),
  /** @scope limit selector (the upper bound, optional). */
  limit: z
    .string()
    .trim()
    .max(200, "limit must be at most 200 characters")
    .regex(SELECTOR_RE, "limit contains invalid selector characters")
    .optional(),
  /** Inner CSS declarations to apply inside the scope. */
  declarations: z
    .record(z.string(), z.string())
    .refine((o) => Object.keys(o).length > 0, "declarations must not be empty"),
  /** Test DOM tree to evaluate. */
  dom: ScopeNodeSchema,
});
export type ScopeAnalyzeInput = z.infer<typeof ScopeAnalyzeSchema>;
