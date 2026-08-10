/**
 * Zod schemas for the edge module.
 *
 * Defines the deploy-payload shape.
 * The `EdgeRegion`/`EdgeConfig`/`EdgePerformancePoint` domain types live
 * in `../../types/index.ts`.
 */
import { z } from "zod";

const CACHE_STRATEGIES = z.enum([
  "cache-first",
  "stale-while-revalidate",
  "network-first",
]);

/** Body for POST /edge/deploy — deploy a new edge config. */
export const EdgeDeploySchema = z.object({
  defaultTtl: z
    .number()
    .int("defaultTtl must be an integer")
    .min(0, "defaultTtl must be >= 0")
    .max(86_400, "defaultTtl must be <= 86400 (24h)")
    .optional(),
  cacheStrategy: CACHE_STRATEGIES.optional(),
  purgeOnDeploy: z.boolean().optional(),
  customHeaders: z
    .record(z.string(), z.string())
    .optional(),
});
export type EdgeDeployInput = z.infer<typeof EdgeDeploySchema>;
