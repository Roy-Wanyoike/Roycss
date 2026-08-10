/**
 * Zod schemas for the subgrid module.
 *
 * Defines the body shape for POST /subgrid/generate — generate subgrid
 * CSS from parent track config + child span config.
 */
import { z } from "zod";

const IDENT_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

const TrackSizeSchema = z.enum(["fr", "px", "auto", "minmax", "fit-content"]);

/** One child row that may opt into subgrid with a column span. */
export const SubgridChildSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "label is required")
    .max(40, "label must be at most 40 characters"),
  /** Number of parent tracks this child spans. */
  span: z.number().int().min(1).max(12),
  /** Whether the child uses grid-template-columns: subgrid. */
  subgrid: z.boolean().default(true),
  /** When subgrid is true, optional number of inner tracks to render inside
   *  the child (defaults to span). */
  cells: z.number().int().min(1).max(12).optional(),
  /** Color swatch used by the preview UI. */
  color: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "color must be hex")
    .default("#5b8def"),
});

/** Body for POST /subgrid/generate. */
export const SubgridGenerateSchema = z.object({
  parent: z.object({
    /** Number of parent grid tracks (2..12). */
    columns: z.number().int().min(2).max(12),
    /** Track-size strategy. */
    trackSize: TrackSizeSchema.default("fr"),
    /** Fixed track size in px (used when trackSize is "px"). */
    trackPx: z.number().int().min(20).max(400).default(120),
    /** Min size for minmax() (used when trackSize is "minmax"). */
    trackMin: z.number().int().min(20).max(400).default(80),
    /** Gap in px between tracks. */
    gap: z.number().int().min(0).max(48).default(8),
    /** Optional parent container name (CSS identifier). */
    name: z
      .string()
      .trim()
      .max(40)
      .regex(IDENT_RE, "name must be a CSS identifier")
      .optional(),
  }),
  children: z.array(SubgridChildSchema).min(1).max(12),
});
export type SubgridGenerateInput = z.infer<typeof SubgridGenerateSchema>;
