/**
 * Zod schemas for the inspector module.
 *
 * Defines the scan-payload shape and the route params for /classes/:name.
 * The `InspectorClass`/`ScanResult` domain types live in `../../types/index.ts`.
 */
import { z } from "zod";

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Route params for /inspector/classes/:name. */
export const ClassNameParamsSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^roycss-[a-z0-9-]+$/, "Class name must be a roycss-* kebab-case"),
});

/** Body for POST /inspector/scan — scan a page URL for roycss classes. */
export const ScanPageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "url is required")
    .regex(URL_RE, "url must be a valid http(s) URL"),
  /** Optional category filter for the returned matches. */
  category: z.string().trim().max(60).optional().or(z.literal("")),
});
export type ScanPageInput = z.infer<typeof ScanPageSchema>;
