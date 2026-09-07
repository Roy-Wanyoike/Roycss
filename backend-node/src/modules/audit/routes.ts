/**
 * Audit routes — /api/v1/audit (PF-009 / issue #94 A6)
 *
 *   GET / ?actor=&action=&since=&limit=&offset=   admin audit-trail query
 *
 * Guards: `requireAuth` + `requirePlatformRole("ADMIN")` — the caller
 * must hold ADMIN (or OWNER) in at least one organization. Reads are
 * never public: the audit trail can contain actor ids, resource ids,
 * and request metadata.
 *
 * Writes do NOT go through this router — mutating routes across the
 * audited modules call `recordAuditEvent()` inline (see
 * modules/audit/service.ts) so every mutation is recorded at the
 * moment it commits.
 */
import { Router } from "express";
import { z } from "zod";

import { requireAuth, requirePlatformRole } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import { validateQuery } from "../../server/middleware/validate.js";
import { queryAuditLog } from "./service.js";

export const AuditQuerySchema = z.object({
  actor: z.string().trim().min(1).max(120).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const auditRouter = Router();

auditRouter.get(
  "/",
  requireAuth,
  requirePlatformRole("ADMIN"),
  validateQuery(AuditQuerySchema),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof AuditQuerySchema>;
    const { items, total } = await queryAuditLog({
      actor: q.actor,
      action: q.action,
      since: q.since ? new Date(q.since) : undefined,
      limit: q.limit,
      offset: q.offset,
    });
    res.json({
      data: items,
      meta: {
        count: items.length,
        total,
        limit: q.limit,
        offset: q.offset,
      },
    });
  }),
);
