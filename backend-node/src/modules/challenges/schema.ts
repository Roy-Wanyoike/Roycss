/**
 * Zod schemas for the challenges module.
 *
 * Defines the submit-payload shape and the route params for /:id.
 * The `Challenge`/`ChallengeLeaderboardEntry` domain types live in
 * `../../types/index.ts`.
 */
import { z } from "zod";

/** Route params for /challenges/:id. */
export const ChallengeParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /challenges/:id/submit — submit a challenge solution. */
export const ChallengeSubmitSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "userId is required")
    .max(80, "userId must be at most 80 characters"),
  code: z
    .string()
    .min(1, "code is required")
    .max(20_000, "code must be at most 20000 characters"),
  passed: z.boolean(),
  timeMs: z
    .number()
    .int("timeMs must be an integer")
    .min(0, "timeMs must be >= 0")
    .optional(),
});
export type ChallengeSubmitInput = z.infer<typeof ChallengeSubmitSchema>;
