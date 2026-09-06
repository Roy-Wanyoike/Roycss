/**
 * Zod schemas for the analytics module.
 *
 * Analytics endpoints are read-only and currently accept no params, but
 * we expose a small `TrafficQuerySchema` so clients can request a
 * shorter traffic window in the future.
 */
import { z } from "zod";

/** Query params for GET /analytics/traffic — reserved for future use. */
export const TrafficQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

export type TrafficQuery = z.infer<typeof TrafficQuerySchema>;

// ─── PF-009 / issue #94 (A7) — job queue endpoints ────────────────────────

/** Body for POST /analytics/jobs — aggregation window (days). */
export const AnalyticsJobSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

export type AnalyticsJobInput = z.infer<typeof AnalyticsJobSchema>;

/** Params for GET /analytics/jobs/:id. */
export const JobParamsSchema = z.object({
  id: z.string().min(1),
});
