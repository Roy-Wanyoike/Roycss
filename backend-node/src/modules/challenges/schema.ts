/**
 * Zod schemas for the challenges module.
 *
 * Defines the submit-payload shape and the route params for /:id.
 * The `Challenge`/`ChallengeLeaderboardEntry` domain types live in
 * `../../types/index.ts`.
 *
 * Attribution (audit F-07): submissions are attributed to the
 * Bearer-JWT `sub` server-side — there is NO client-supplied
 * `userId` field. A legacy body containing one is silently stripped
 * by Zod and ignored.
 */
import { z } from "zod";

/** Route params for /challenges/:id. */
export const ChallengeParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for POST /challenges/:id/submit — submit a challenge solution.
 *
 * `passed` is the caller's SELF-GRADE claim (demo-integrity-limited):
 * the seeded catalog ships free-form challenges with no checkable
 * answer, so the server cannot grade them itself. The claim is
 * recorded on the submission row ONLY — it can never award score or
 * touch the leaderboard (see service.ts `submitSolution`). When a
 * challenge DOES carry a checkable `solutionCode`, the server grades
 * the submission and the client claim is ignored entirely. */
export const ChallengeSubmitSchema = z.object({
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
