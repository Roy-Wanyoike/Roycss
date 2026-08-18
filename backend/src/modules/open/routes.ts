/**
 * Open routes — /api/v1/open
 *
 *   GET   /issues                  list all open issues
 *   GET   /issues/:id              single issue by id
 *   GET   /rfcs                    list all open RFCs
 *   GET   /rfcs/:id                single RFC by id
 *   POST  /rfcs/:id/vote           cast a vote on an RFC
 *   GET   /roadmap                 quarterly roadmap
 *   GET   /contributors            top contributors
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getContributors,
  getIssueById,
  getRfcById,
  getRoadmap,
  listIssues,
  listRfcs,
  voteOnRfc,
} from "./service.js";
import { IdParamsSchema, RfcVoteSchema } from "./schema.js";

export const openRouter = Router();

openRouter.get(
  "/issues",
  asyncHandler(async (_req, res) => {
    const items = await listIssues();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

openRouter.get(
  "/rfcs",
  asyncHandler(async (_req, res) => {
    const items = await listRfcs();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

openRouter.get(
  "/roadmap",
  asyncHandler(async (_req, res) => {
    const roadmap = await getRoadmap();
    res.json({ data: roadmap });
  }),
);

openRouter.get(
  "/contributors",
  asyncHandler(async (_req, res) => {
    const items = await getContributors();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

openRouter.get(
  "/issues/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const issue = await getIssueById(id);
    res.json({ data: issue });
  }),
);

openRouter.get(
  "/rfcs/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const rfc = await getRfcById(id);
    res.json({ data: rfc });
  }),
);

openRouter.post(
  "/rfcs/:id/vote",
  validateParams(IdParamsSchema),
  validateBody(RfcVoteSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const input = req.body as unknown as z.infer<typeof RfcVoteSchema>;
    const rfc = await voteOnRfc(id, input);
    res.json({ data: rfc });
  }),
);
