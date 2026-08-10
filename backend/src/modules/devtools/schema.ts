/**
 * Zod schemas for the devtools module.
 *
 * Defines the analyze-payload shape and the inspect-query shape.
 * The `DevToolsResult` domain type lives in `../../types/index.ts`.
 */
import { z } from "zod";

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Query params for GET /devtools/inspect. */
export const InspectQuerySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "url is required")
    .regex(URL_RE, "url must be a valid http(s) URL"),
});

/** Body for POST /devtools/analyze — analyze a page's CSS usage. */
export const AnalyzePageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "url is required")
    .regex(URL_RE, "url must be a valid http(s) URL"),
  /** Optional maximum number of issues to surface. */
  maxIssues: z.coerce.number().int().min(1).max(500).default(50),
});
export type AnalyzePageInput = z.infer<typeof AnalyzePageSchema>;
