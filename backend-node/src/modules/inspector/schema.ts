/**
 * Zod schemas for the inspector module.
 *
 * Defines the query shape for GET /inspector/analyze and the response
 * shapes for all three inspector endpoints. Unlike effects/contact,
 * the inspector is a self-contained read-only analyzer with no DB
 * dependency, so its domain types (InspectorCheck, InspectorFinding,
 * InspectorSummary) are inferred HERE instead of living in
 * `../../types/index.ts` — that keeps the module boundary tight and
 * avoids widening the shared types file for a demo-tier service.
 */
import { z } from "zod";

/** Max accepted CSS snippet length (chars) — keeps query strings sane. */
export const MAX_CSS_LENGTH = 20_000;

const SEVERITY = z.enum(["error", "warning", "info"]);

/** Query params for GET /inspector/analyze. */
export const InspectorAnalyzeQuerySchema = z.object({
  css: z
    .string()
    .min(1, "css is required — pass the snippet as ?css=<encodeURIComponent(css)>")
    .max(MAX_CSS_LENGTH, `css must be at most ${MAX_CSS_LENGTH} characters`),
});
export type InspectorAnalyzeQuery = z.infer<typeof InspectorAnalyzeQuerySchema>;

/** One lint-style finding produced by an inspection check. */
export const InspectorFindingSchema = z.object({
  /** Rule id — matches an entry in the /checks catalog. */
  rule: z.string().min(1),
  severity: SEVERITY,
  message: z.string().min(1),
  /** 1-based line in the submitted snippet where the finding applies. */
  line: z.number().int().positive().optional(),
});
export type InspectorFinding = z.infer<typeof InspectorFindingSchema>;
export type InspectorSeverity = z.infer<typeof SEVERITY>;

/** Counters for a single analyze run. */
export const InspectorSummarySchema = z.object({
  /** Lines in the submitted snippet. */
  lines: z.number().int().min(0),
  /** Number of checks from the catalog that ran (all of them). */
  checksExecuted: z.number().int().positive(),
  /** Total findings across severities. */
  findings: z.number().int().min(0),
  errors: z.number().int().min(0),
  warnings: z.number().int().min(0),
  infos: z.number().int().min(0),
});
export type InspectorSummary = z.infer<typeof InspectorSummarySchema>;

/** Catalog entry for one inspection check. */
export const InspectorCheckSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
});
export type InspectorCheck = z.infer<typeof InspectorCheckSchema>;

/** Result body for GET /inspector/analyze. */
export const InspectorAnalyzeResultSchema = z.object({
  findings: z.array(InspectorFindingSchema),
  summary: InspectorSummarySchema,
});
export type InspectorAnalyzeResult = z.infer<typeof InspectorAnalyzeResultSchema>;

/** Response envelope for GET /inspector/checks. */
export const InspectorChecksResponseSchema = z.object({
  data: z.array(InspectorCheckSchema),
  meta: z.object({ count: z.number().int().min(0) }),
});
export type InspectorChecksResponse = z.infer<typeof InspectorChecksResponseSchema>;

/** Response envelope for GET /inspector/analyze. */
export const InspectorAnalyzeResponseSchema = z.object({
  data: InspectorAnalyzeResultSchema,
  meta: z.object({ count: z.number().int().min(0) }),
});
export type InspectorAnalyzeResponse = z.infer<typeof InspectorAnalyzeResponseSchema>;

/** Response envelope for GET /inspector/health. */
export const InspectorHealthResponseSchema = z.object({
  data: z.object({
    status: z.enum(["ok"]),
    module: z.literal("inspector"),
    checks: z.number().int().positive(),
    time: z.string(),
  }),
});
export type InspectorHealthResponse = z.infer<typeof InspectorHealthResponseSchema>;
