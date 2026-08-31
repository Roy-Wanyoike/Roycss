/**
 * Zod schemas for the relative-color module.
 *
 * Defines the body shape for POST /relative-color/derive — derive a color
 * from a source hex + output space + per-channel calc expressions, using
 * CSS Relative Color Syntax (Baseline 2024).
 */
import { z } from "zod";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const CHANNEL_EXPR_RE = /^(?:[a-z]+|calc\([a-z]+\s*[+\-*/]\s*-?\d+(?:\.\d+)?\)|-?\d+(?:\.\d+)?)$/;

/** A per-channel calc expression. Identity (channel letter), bare number, or calc(...). */
const channelExpr = z
  .string()
  .trim()
  .max(80)
  .regex(
    CHANNEL_EXPR_RE,
    "channel must be a channel letter (e.g. 'r'), a number, or calc(ch +/- N | ch * N | ch / N)",
  );

/** Body for POST /relative-color/derive. */
export const RelativeColorDeriveSchema = z.object({
  /** Source color as a 3- or 6-digit hex string. */
  source: z.string().regex(HEX_RE, "source must be a 3- or 6-digit hex color"),
  /** Output color space the relative-color resolves into. */
  outputSpace: z.enum(["rgb", "hsl", "oklch", "oklab"]),
  /** Per-channel calc expressions. Service picks the 3 relevant channels for the outputSpace. */
  channels: z
    .object({
      /** Red (rgb, 0-255). */
      r: channelExpr.optional(),
      /** Green (rgb, 0-255). */
      g: channelExpr.optional(),
      /** Blue (rgb, 0-255). */
      b: channelExpr.optional(),
      /** Hue (hsl/oklch, 0-360). */
      h: channelExpr.optional(),
      /** Saturation (hsl, 0-100). */
      s: channelExpr.optional(),
      /** Lightness (hsl, 0-100) or OKLab/OKLCH L (0-1). */
      l: channelExpr.optional(),
      /** OKLCH chroma (0-0.4 unbounded). */
      c: channelExpr.optional(),
      /** OKLab a-axis (-0.4 to +0.4 unbounded). */
      a: channelExpr.optional(),
      /** Alpha (0-1, all spaces). */
      alpha: channelExpr.optional(),
    })
    .default({}),
});
export type RelativeColorDeriveInput = z.infer<
  typeof RelativeColorDeriveSchema
>;
