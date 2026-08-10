/**
 * Zod schemas for the scaffold module.
 *
 * Defines the body shape for POST /scaffold/generate and route params
 * for /scaffold/types/:id.
 */
import { z } from "zod";

/** Body for POST /scaffold/generate — generate a project scaffold (mock). */
export const ScaffoldGenerateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(120, "name must be at most 120 characters")
    .regex(/^[a-z0-9-]+$/, "name must be lowercase kebab-case"),
  projectType: z
    .string()
    .trim()
    .min(1, "projectType is required")
    .max(80, "projectType must be at most 80 characters"),
  framework: z
    .string()
    .trim()
    .min(1, "framework is required")
    .max(80, "framework must be at most 80 characters"),
  /** Optional additional features to include (e.g. ["auth", "analytics"]). */
  features: z.array(z.string().trim().min(1)).max(20).default([]),
  /** Optional output language override. */
  language: z.enum(["typescript", "javascript"]).default("typescript"),
});
export type ScaffoldGenerateInput = z.infer<typeof ScaffoldGenerateSchema>;

/** Route params for /scaffold/types/:id. */
export const ScaffoldParamsSchema = z.object({
  id: z.string().min(1),
});
