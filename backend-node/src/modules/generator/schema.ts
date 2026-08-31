/**
 * Zod schemas for the generator module.
 *
 * Defines the body shape for POST /generator/generate and route params
 * for /generator/templates/:type.
 */
import { z } from "zod";

/** Body for POST /generator/generate — generate code (mock). */
export const GenerateCodeSchema = z.object({
  typeId: z
    .string()
    .trim()
    .min(1, "typeId is required")
    .max(80, "typeId must be at most 80 characters"),
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(120, "name must be at most 120 characters")
    // Component / file name — PascalCase or kebab.
    .regex(
      /^[A-Za-z][A-Za-z0-9_-]*$/,
      "name must start with a letter and contain only letters, digits, underscores or hyphens",
    ),
  language: z
    .enum(["typescript", "tsx", "javascript", "jsx"])
    .default("tsx"),
  /** Variable substitutions (e.g. { props: "title" }). */
  variables: z.record(z.string(), z.string()).default({}),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeSchema>;

/** Route params for /generator/templates/:type. */
export const GeneratorParamsSchema = z.object({
  type: z.string().min(1),
});
