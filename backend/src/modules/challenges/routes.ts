/**
 * Challenges routes — /api/v1/challenges
 *
 *   GET  /                    list all challenges
 *   GET  /leaderboard         global leaderboard
 *   GET  /:id                 single challenge by id
 *   POST /:id/submit          submit a solution for a challenge
 *
 * Order matters: static routes (`/leaderboard`) are declared before
 * `/:id` so the literal path isn't captured as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getChallengeById,
  getLeaderboard,
  listChallenges,
  submitSolution,
} from "./service.js";
import { ChallengeParamsSchema, ChallengeSubmitSchema } from "./schema.js";

export const challengesRouter = Router();

challengesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listChallenges();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

challengesRouter.get(
  "/leaderboard",
  asyncHandler(async (_req, res) => {
    const items = await getLeaderboard();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

challengesRouter.get(
  "/:id",
  validateParams(ChallengeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ChallengeParamsSchema
    >;
    const challenge = await getChallengeById(id);
    res.json({ data: challenge });
  }),
);

challengesRouter.post(
  "/:id/submit",
  validateParams(ChallengeParamsSchema),
  validateBody(ChallengeSubmitSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ChallengeParamsSchema
    >;
    const input = req.body as unknown as z.infer<typeof ChallengeSubmitSchema>;
    const result = await submitSolution({
      challengeId: id,
      userId: input.userId,
      code: input.code,
      passed: input.passed,
      timeMs: input.timeMs,
    });
    res.status(201).json({ data: result });
  }),
);
