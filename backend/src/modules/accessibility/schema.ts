/**
 * Zod schemas for the accessibility module.
 *
 * Defines the body shape for POST /accessibility/scan and the route
 * params for /accessibility/audit/:url and /accessibility/contrast/:fg/:bg.
 * The `WCAGRule` and `AccessibilityAudit` domain types live in
 * `../../types/index.ts`.
 */
import { z } from "zod";

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Body for POST /accessibility/scan — run a mock audit on a URL. */
export const A11yScanSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "url is required")
    .regex(URL_RE, "url must be a valid http(s) URL"),
  /** Desired conformance level to evaluate against. */
  level: z.enum(["A", "AA", "AAA"]).default("AA"),
  /** Optional maximum number of violations to surface. */
  maxViolations: z.coerce.number().int().min(1).max(500).default(50),
});
export type A11yScanInput = z.infer<typeof A11yScanSchema>;

/** Route params for /accessibility/audit/:url. The url is captured raw. */
export const AuditUrlParamsSchema = z.object({
  url: z.string().min(1, "url is required"),
});

/** Route params for /accessibility/contrast/:fg/:bg. */
export const ContrastParamsSchema = z.object({
  fg: z
    .string()
    .min(1, "fg is required")
    .regex(HEX_RE, "fg must be a 3- or 6-digit hex color (e.g. #fff or #ffffff)"),
  bg: z
    .string()
    .min(1, "bg is required")
    .regex(HEX_RE, "bg must be a 3- or 6-digit hex color (e.g. #fff or #ffffff)"),
});
