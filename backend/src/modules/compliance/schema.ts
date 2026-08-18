/**
 * Zod schemas for the compliance module.
 *
 * Defines the scan-payload shape and the route params for /results/:id.
 * The `ComplianceStandard`/`ComplianceScanResult`/`ComplianceReport`
 * domain types live in `../../types/index.ts`.
 */
import { z } from "zod";

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Route params for /compliance/results/:id. */
export const ComplianceResultParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /compliance/scan — kick off a compliance scan. */
export const ComplianceScanSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "url is required")
    .regex(URL_RE, "url must be a valid http(s) URL"),
  /** Standard id to scan against (e.g. "wcag-22-aa"). Defaults to WCAG 2.2 AA. */
  standardId: z
    .string()
    .trim()
    .min(1, "standardId is required")
    .max(80, "standardId must be at most 80 characters")
    .default("wcag-22-aa"),
  /** Optional depth: quick = surface only, full = full DOM walk. */
  depth: z.enum(["quick", "full"]).default("quick"),
});
export type ComplianceScanInput = z.infer<typeof ComplianceScanSchema>;
