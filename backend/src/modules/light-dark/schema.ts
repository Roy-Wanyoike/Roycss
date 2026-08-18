/**
 * Zod schemas for the light-dark module.
 *
 * Defines the body shape for POST /light-dark/generate — generate
 * light-dark() CSS from a color-scheme + 5 semantic tokens each with
 * light/dark values.
 */
import { z } from "zod";

const SELECTOR_RE = /^[a-zA-Z0-9_\s.:>#\[\]="'()*+~^$|-]+$/;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** A single semantic token with light + dark hex values. */
const tokenSchema = z.object({
  light: z.string().regex(HEX_RE, "light must be a 3- or 6-digit hex color"),
  dark: z.string().regex(HEX_RE, "dark must be a 3- or 6-digit hex color"),
});

/** Body for POST /light-dark/generate. */
export const LightDarkGenerateSchema = z.object({
  /** Selector for the themed container. */
  selector: z
    .string()
    .trim()
    .min(1, "selector is required")
    .max(120, "selector must be at most 120 characters")
    .regex(SELECTOR_RE, "selector contains invalid characters"),
  /** color-scheme value applied to the container. */
  colorScheme: z.enum(["light", "dark", "light dark"]),
  /** 5 semantic tokens, each with light + dark hex values. */
  tokens: z.object({
    /** Page/canvas background. */
    background: tokenSchema,
    /** Body text color. */
    foreground: tokenSchema,
    /** Primary action/accent color. */
    primary: tokenSchema,
    /** Muted/secondary text color. */
    muted: tokenSchema,
    /** Border / divider color. */
    border: tokenSchema,
  }),
  /** Optional selector for the primary-tinted nested element (e.g. button). */
  primarySelector: z
    .string()
    .trim()
    .max(120)
    .regex(SELECTOR_RE, "primarySelector contains invalid characters")
    .default(".btn"),
  /** Optional selector for the muted nested element. */
  mutedSelector: z
    .string()
    .trim()
    .max(120)
    .regex(SELECTOR_RE, "mutedSelector contains invalid characters")
    .default(".muted"),
});
export type LightDarkGenerateInput = z.infer<typeof LightDarkGenerateSchema>;
