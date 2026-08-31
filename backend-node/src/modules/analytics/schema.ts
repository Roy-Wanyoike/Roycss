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
