/**
 * Zod schemas for the profiler module.
 */
import { z } from "zod";

/** Body for POST /profiler/start. */
export const StartProfilingSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  /** Sample rate in Hz (10–60). */
  sampleRate: z.number().int().min(10).max(60).optional(),
  /** Max duration in seconds. */
  durationSec: z.number().int().min(5).max(300).optional(),
});
export type StartProfilingInput = z.infer<typeof StartProfilingSchema>;

/** Route params for /profiler/results/:id. */
export const IdParamsSchema = z.object({
  id: z.string().min(1),
});
