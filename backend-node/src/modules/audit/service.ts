/**
 * Audit service — enterprise audit-trail coverage (PF-009 / issue #94 A6).
 *
 * Every mutating route in the audited modules (auth, marketplace,
 * enterprise, governance, workspace — billing/favorites/collections/
 * settings do not exist as modules yet) writes an `EnterpriseAuditLog`
 * row through `recordAuditEvent()`, carrying: actor, action, target,
 * timestamp, and the end-to-end requestId (stored in `metadataJson`
 * alongside free-form context).
 *
 * Rows are never allowed to fail the primary request: DB errors are
 * logged and swallowed (the mutation already succeeded).
 *
 * `queryAuditLog()` powers the admin endpoint `GET /api/v1/audit`
 * with actor/action/since filters.
 */
import { db } from "../../lib/db.js";
import { createLogger } from "../../lib/logger.js";

const log = createLogger("audit");

/** Sentinel org for platform-level actions that are not org-scoped. */
export const PLATFORM_ORG_ID = "platform";

/** Input for `recordAuditEvent` — one auditable mutation. */
export interface AuditEventInput {
  /** Actor user id (omit for anonymous/system actions). */
  actor?: string;
  /** Dotted action name, e.g. `auth.user.register`. */
  action: string;
  /** Target resource type, e.g. `user`, `template`, `approval`. */
  resourceType: string;
  /** Target resource id (when known). */
  resourceId?: string;
  /** Org the action targets — defaults to the platform sentinel. */
  orgId?: string;
  /** End-to-end request id from the X-Request-Id middleware. */
  requestId?: string;
  /** Extra structured context (kept small — it is JSON-encoded). */
  metadata?: Record<string, unknown>;
}

/** Domain shape returned by the admin query endpoint. */
export interface AuditLogEntry {
  id: string;
  orgId: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

interface AuditRow {
  id: string;
  orgId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadataJson: string;
  createdAt: Date;
}

function rowToEntry(row: AuditRow): AuditLogEntry {
  let metadata: Record<string, unknown> | null = null;
  try {
    metadata = JSON.parse(row.metadataJson) as Record<string, unknown>;
  } catch {
    metadata = null;
  }
  return {
    id: row.id,
    orgId: row.orgId,
    actor: row.userId ?? "",
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    requestId:
      typeof metadata?.requestId === "string" ? metadata.requestId : null,
    metadata,
    timestamp: row.createdAt.toISOString(),
  };
}

/**
 * Record one audit event. NEVER throws — a failed audit write is
 * logged and the (already-committed) mutation stays untouched.
 * Returns the stored entry, or null when the write failed.
 */
export async function recordAuditEvent(
  input: AuditEventInput,
): Promise<AuditLogEntry | null> {
  const payload = {
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.metadata ?? {}),
  };
  try {
    const row = (await db.enterpriseAuditLog.create({
      data: {
        orgId: input.orgId ?? PLATFORM_ORG_ID,
        userId: input.actor ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metadataJson: JSON.stringify(payload),
      },
    })) as unknown as AuditRow;
    return rowToEntry(row);
  } catch (err) {
    log.warn("Audit write failed — mutation kept, audit row lost", {
      action: input.action,
      requestId: input.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export interface QueryAuditLogInput {
  actor?: string;
  action?: string;
  /** ISO timestamp — only entries at/after this moment. */
  since?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query the audit trail (admin endpoint). Newest first. Supports
 * actor / action / since filters plus limit/offset pagination.
 */
export async function queryAuditLog(
  input: QueryAuditLogInput,
): Promise<{ items: AuditLogEntry[]; total: number }> {
  const where = {
    ...(input.actor ? { userId: input.actor } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.since ? { createdAt: { gte: input.since } } : {}),
  };
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  const [rows, total] = await Promise.all([
    db.enterpriseAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.enterpriseAuditLog.count({ where }),
  ]);

  return {
    items: (rows as unknown as AuditRow[]).map(rowToEntry),
    total,
  };
}
