/**
 * Zod schemas for the color-space module.
 *
 * Defines the body shape for POST /color-space/convert and route params
 * for /color-space/gamut/:hex.
 */
import { z } from "zod";

export const COLOR_SPACES = [
  "srgb",
  "hsl",
  "oklch",
  "oklab",
  "display-p3",
] as const;
export type ColorSpace = (typeof COLOR_SPACES)[number];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Body for POST /color-space/convert — convert a color between spaces. */
export const ColorConvertSchema = z.object({
  from: z.enum(COLOR_SPACES),
  to: z.enum(COLOR_SPACES),
  /**
   * Source color value:
   *   - srgb          → "#rrggbb" or "#rgb" hex
   *   - hsl           → "h(°) s% l%" or "h,s%,l%" (e.g. "210 60% 50%")
   *   - oklch / oklab → "L C H" or "L A B" with values 0..1 / -0.4..0.4
   *   - display-p3    → "#rrggbb" hex interpreted in the P3 gamut
   */
  value: z
    .string()
    .trim()
    .min(1, "value is required")
    .max(80, "value must be at most 80 characters"),
});
export type ColorConvertInput = z.infer<typeof ColorConvertSchema>;

/** Route params for /color-space/gamut/:hex. */
export const HexParamsSchema = z.object({
  hex: z.string().regex(HEX_RE, "hex must be a #rgb or #rrggbb color"),
});
