/**
 * Zod schemas for the themes module.
 *
 * Defines the shape of create/update payloads and the route params.
 * The `Theme` domain type lives in `../../types/index.ts` so other
 * modules can import it without reaching into this module.
 */
import { z } from "zod";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const colorField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(HEX_RE, `${label} must be a valid hex color (e.g. #10b981)`);

/** Body for POST /themes — create a new theme. */
export const CreateThemeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be at most 80 characters"),
  primary: colorField("Primary"),
  secondary: colorField("Secondary"),
  accent: colorField("Accent"),
  background: colorField("Background"),
  foreground: colorField("Foreground"),
  tokens: z.record(z.string(), z.unknown()).default({}),
});
export type CreateThemeInput = z.infer<typeof CreateThemeSchema>;

/** Body for PUT /themes/:id — partial update, all fields optional. */
export const UpdateThemeSchema = CreateThemeSchema.partial();
export type UpdateThemeInput = z.infer<typeof UpdateThemeSchema>;

/** Route params for /themes/:id. */
export const ThemeParamsSchema = z.object({
  id: z.string().min(1),
});
