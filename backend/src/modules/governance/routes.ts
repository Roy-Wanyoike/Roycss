/**
 * Governance routes — /api/v1/governance
 *
 *   GET   /approvals                   list all pending + decided approvals
 *   POST  /approvals/:id/approve       approve a pending approval
 *   POST  /approvals/:id/reject        reject a pending approval
 *   GET   /policies                    list all governance policies
 *   GET   /audit-log                   list all audit-log entries
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
  approveApproval,
  listApprovals,
  listAuditLog,
  listPolicies,
  rejectApproval,
} from "./service.js";
import {
  ApproveSchema,
  GovernanceParamsSchema,
  RejectSchema,
} from "./schema.js";

export const governanceRouter = Router();

governanceRouter.get(
  "/approvals",
  asyncHandler(async (_req, res) => {
    const items = await listApprovals();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

governanceRouter.get(
  "/policies",
  asyncHandler(async (_req, res) => {
    const items = await listPolicies();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

governanceRouter.get(
  "/audit-log",
  asyncHandler(async (_req, res) => {
    const items = await listAuditLog();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

governanceRouter.post(
  "/approvals/:id/approve",
  validateParams(GovernanceParamsSchema),
  validateBody(ApproveSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof GovernanceParamsSchema
    >;
    const input = req.body as unknown as z.infer<typeof ApproveSchema>;
    const approval = await approveApproval(id, input);
    res.json({ data: approval });
  }),
);

governanceRouter.post(
  "/approvals/:id/reject",
  validateParams(GovernanceParamsSchema),
  validateBody(RejectSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof GovernanceParamsSchema
    >;
    const input = req.body as unknown as z.infer<typeof RejectSchema>;
    const approval = await rejectApproval(id, input);
    res.json({ data: approval });
  }),
);
