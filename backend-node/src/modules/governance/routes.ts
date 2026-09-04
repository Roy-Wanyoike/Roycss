/**
 * Governance routes — /api/v1/governance
 *
 *   GET   /approvals                   list all pending + decided approvals
 *   POST  /approvals/:id/approve       approve a pending approval
 *   POST  /approvals/:id/reject        reject a pending approval
 *   GET   /policies                    list all governance policies
 *   GET   /audit-log                   list all audit-log entries
 *
 * Org-scoped authorization (issue #64): the mutating approve/reject
 * routes are gated by `requireAuth` + `requireRole("ADMIN")`. The org
 * is resolved through the approval's policy: when the policy is
 * org-scoped (orgId set) the caller must hold ADMIN or higher in that
 * org (403 otherwise); when the policy is global (orgId null) any
 * authenticated user may decide. Decisions persist to the
 * `GovernanceApproval` Prisma model.
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { Request } from "express";
import type { z } from "zod";

import { requireAuth, requireRole } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { db } from "../../lib/db.js";
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

/**
 * Org-id resolver for requireRole on approval routes: an approval
 * belongs to a policy, and a policy MAY be org-scoped (orgId set) or
 * global (orgId null / policy row absent). Returning null tells
 * requireRole the resource is not org-scoped — authentication alone
 * then gates the request.
 */
async function orgIdFromApproval(req: Request): Promise<string | null> {
  const id = req.params?.id;
  if (typeof id !== "string" || id.length === 0) return null;
  const approval = await db.governanceApproval.findUnique({
    where: { id },
    select: { policyId: true },
  });
  if (!approval?.policyId) return null;
  const policy = await db.governancePolicy.findUnique({
    where: { id: approval.policyId },
    select: { orgId: true },
  });
  return policy?.orgId ?? null;
}

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
  requireAuth,
  requireRole("ADMIN", { orgIdFrom: orgIdFromApproval }),
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
  requireAuth,
  requireRole("ADMIN", { orgIdFrom: orgIdFromApproval }),
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
