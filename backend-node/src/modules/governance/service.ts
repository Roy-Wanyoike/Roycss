/**
 * Governance service — Prisma-backed Roy Governance approval workflow.
 *
 * Persisted via the `GovernancePolicy` + `GovernanceApproval` Prisma
 * models. Seeds 5 pending approvals, 3 policies, and 8 audit-log
 * entries. The audit log has no Prisma model — it remains a static
 * in-memory seed (cached).
 *
 * Field-mapping: the Prisma `GovernancePolicy` model exposes (orgId,
 * name, rulesJson). The domain shape's `name` maps directly; the extra
 * fields (category, description, enforcement, severity) are JSON-encoded
 * inside `rulesJson` as a wrapper. The Prisma `GovernanceApproval`
 * model exposes (policyId, userId, resourceType, resourceId, decision,
 * reason). The domain shape's `type → resourceType`, `resource →
 * resourceId`, `status → decision`, `requester → userId`, `policyId ←
 * id`; the extra fields (reason, risk, reviewer, decidedAt, createdAt)
 * are JSON-encoded inside `reason` as a wrapper.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  GovernanceApproval,
  GovernanceAuditEntry,
  GovernancePolicy,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ApproveInput, RejectInput } from "./schema.js";

const log = createLogger("governance");

const APPROVALS_KEY = "governance:approvals";
const POLICIES_KEY = "governance:policies";
const AUDIT_KEY = "governance:audit";
const approvalKey = (id: string): string => `governance:approval:${id}`;

function invalidateApprovals(id?: string): void {
  cache.delete(APPROVALS_KEY);
  cache.delete(AUDIT_KEY);
  if (id) cache.delete(approvalKey(id));
}

// ─── Seed: 5 pending approvals ───────────────────────────────────────────
const SEED_APPROVALS: GovernanceApproval[] = [
  {
    id: "appr-publish-healthcare-theme",
    type: "publish",
    resource: "theme-healthcare",
    requester: "user-asha",
    reviewer: null,
    status: "pending",
    reason: "Publishing the new healthcare theme to the marketplace.",
    risk: "low",
    createdAt: "2025-02-15T10:00:00.000Z",
    decidedAt: null,
  },
  {
    id: "appr-delete-legacy-util",
    type: "delete",
    resource: "roycss-util-display",
    requester: "user-devon",
    reviewer: null,
    status: "pending",
    reason: "Removing the deprecated legacy utility classes from the runtime.",
    risk: "high",
    createdAt: "2025-02-16T14:30:00.000Z",
    decidedAt: null,
  },
  {
    id: "appr-feature-flag-ai-migration",
    type: "feature-flag",
    resource: "feature:ai-migration",
    requester: "user-mira",
    reviewer: null,
    status: "pending",
    reason: "Enabling AI migration assistant for 10% of users.",
    risk: "medium",
    createdAt: "2025-02-17T09:15:00.000Z",
    decidedAt: null,
  },
  {
    id: "appr-deploy-v2-1-0",
    type: "deployment",
    resource: "release:2.1.0",
    requester: "user-roy",
    reviewer: null,
    status: "pending",
    reason: "Deploying RoyCSS v2.1.0 to production.",
    risk: "high",
    createdAt: "2025-02-18T08:00:00.000Z",
    decidedAt: null,
  },
  {
    id: "appr-config-csp-strict",
    type: "configuration",
    resource: "config:csp-strict",
    requester: "user-priya",
    reviewer: null,
    status: "pending",
    reason: "Tightening the production CSP to disallow inline scripts.",
    risk: "medium",
    createdAt: "2025-02-18T11:45:00.000Z",
    decidedAt: null,
  },
];

// ─── Seed: 3 policies ────────────────────────────────────────────────────
const SEED_POLICIES: GovernancePolicy[] = [
  {
    id: "pol-deploy-require-approval",
    name: "Production deployments require approval",
    category: "deployment",
    description:
      "Any deployment targeting the production environment requires approval from at least one reviewer with the deployer role.",
    enforcement: "manual",
    severity: "blocking",
  },
  {
    id: "pol-content-no-pii",
    name: "No PII in published content",
    category: "content",
    description:
      "Published themes, templates, and effects must not embed personally identifiable information (PII).",
    enforcement: "automatic",
    severity: "warning",
  },
  {
    id: "pol-access-least-privilege",
    name: "Least-privilege access",
    category: "access",
    description:
      "Access to production resources is granted on a least-privilege basis and reviewed quarterly.",
    enforcement: "manual",
    severity: "info",
  },
];

// ─── Seed: 8 audit-log entries (static — no Prisma model) ──────────────
const SEED_AUDIT: GovernanceAuditEntry[] = [
  { id: "gov-audit-1", actor: "user-roy", action: "approval.create", resource: "appr-publish-healthcare-theme", result: "success", ip: "192.0.2.10", timestamp: "2025-02-15T10:00:00.000Z" },
  { id: "gov-audit-2", actor: "user-devon", action: "approval.create", resource: "appr-delete-legacy-util", result: "success", ip: "192.0.2.22", timestamp: "2025-02-16T14:30:00.000Z" },
  { id: "gov-audit-3", actor: "user-mira", action: "approval.create", resource: "appr-feature-flag-ai-migration", result: "success", ip: "198.51.100.5", timestamp: "2025-02-17T09:15:00.000Z" },
  { id: "gov-audit-4", actor: "user-roy", action: "approval.create", resource: "appr-deploy-v2-1-0", result: "success", ip: "192.0.2.10", timestamp: "2025-02-18T08:00:00.000Z" },
  { id: "gov-audit-5", actor: "user-priya", action: "approval.create", resource: "appr-config-csp-strict", result: "success", ip: "203.0.113.7", timestamp: "2025-02-18T11:45:00.000Z" },
  { id: "gov-audit-6", actor: "user-admin", action: "policy.publish", resource: "pol-deploy-require-approval", result: "success", ip: "192.0.2.1", timestamp: "2025-01-10T12:00:00.000Z" },
  { id: "gov-audit-7", actor: "user-admin", action: "policy.publish", resource: "pol-content-no-pii", result: "success", ip: "192.0.2.1", timestamp: "2025-01-15T12:00:00.000Z" },
  { id: "gov-audit-8", actor: "user-asha", action: "approval.withdraw", resource: "appr-old-template-cleanup", result: "success", ip: "198.51.100.42", timestamp: "2025-02-14T16:20:00.000Z" },
];

let auditLog: GovernanceAuditEntry[] = SEED_AUDIT.map((a) => ({ ...a }));

interface PolicyWrapper {
  category: GovernancePolicy["category"];
  description: string;
  enforcement: GovernancePolicy["enforcement"];
  severity: GovernancePolicy["severity"];
}

interface ApprovalWrapper {
  type: GovernanceApproval["type"];
  reason: string;
  risk: GovernanceApproval["risk"];
  requester: string;
  reviewer: string | null;
  decidedAt: string | null;
  createdAt: string;
}

function policyToDb(p: GovernancePolicy) {
  const wrapper: PolicyWrapper = {
    category: p.category,
    description: p.description,
    enforcement: p.enforcement,
    severity: p.severity,
  };
  return {
    id: p.id,
    orgId: null,
    name: p.name,
    rulesJson: JSON.stringify(wrapper),
  };
}

function policyToDomain(row: {
  id: string;
  name: string;
  rulesJson: string;
}): GovernancePolicy {
  let wrapper: PolicyWrapper = {
    category: "deployment",
    description: "",
    enforcement: "manual",
    severity: "info",
  };
  try {
    wrapper = JSON.parse(row.rulesJson) as PolicyWrapper;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    name: row.name,
    category: wrapper.category,
    description: wrapper.description,
    enforcement: wrapper.enforcement,
    severity: wrapper.severity,
  };
}

function approvalToDb(a: GovernanceApproval) {
  const wrapper: ApprovalWrapper = {
    type: a.type,
    reason: a.reason,
    risk: a.risk,
    requester: a.requester,
    reviewer: a.reviewer,
    decidedAt: a.decidedAt,
    createdAt: a.createdAt,
  };
  return {
    id: a.id,
    policyId: a.id, // self-reference (no foreign-key constraint on the column)
    userId: a.requester,
    resourceType: a.type,
    resourceId: a.resource,
    decision: a.status,
    reason: JSON.stringify(wrapper),
  };
}

function approvalToDomain(row: {
  id: string;
  userId: string | null;
  resourceType: string;
  resourceId: string;
  decision: string;
  reason: string | null;
  createdAt: Date;
}): GovernanceApproval {
  let wrapper: ApprovalWrapper = {
    type: row.resourceType as GovernanceApproval["type"],
    reason: "",
    risk: "low",
    requester: row.userId ?? "",
    reviewer: null,
    decidedAt: null,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.reason) {
    try {
      wrapper = JSON.parse(row.reason) as ApprovalWrapper;
    } catch {
      // Keep defaults.
    }
  }
  return {
    id: row.id,
    type: wrapper.type,
    resource: row.resourceId,
    requester: wrapper.requester,
    reviewer: wrapper.reviewer,
    status: row.decision as GovernanceApproval["status"],
    reason: wrapper.reason,
    risk: wrapper.risk,
    createdAt: wrapper.createdAt,
    decidedAt: wrapper.decidedAt,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if ((await db.governancePolicy.count()) === 0) {
      await db.governancePolicy.createMany({
        data: SEED_POLICIES.map(policyToDb),
      });
    }
    if ((await db.governanceApproval.count()) === 0) {
      await db.governanceApproval.createMany({
        data: SEED_APPROVALS.map(approvalToDb),
      });
    }
    log.info("Governance seeded", {
      policies: SEED_POLICIES.length,
      approvals: SEED_APPROVALS.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all approvals. Cached. */
export async function listApprovals(): Promise<GovernanceApproval[]> {
  return cacheWrap(
    APPROVALS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.governanceApproval.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(approvalToDomain);
    },
    CACHE_TTL.governanceApprovals,
  );
}

/** List all policies. Cached. */
export async function listPolicies(): Promise<GovernancePolicy[]> {
  return cacheWrap(
    POLICIES_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.governancePolicy.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(policyToDomain);
    },
    CACHE_TTL.governancePolicies,
  );
}

/** List all audit-log entries. Cached. */
export async function listAuditLog(): Promise<GovernanceAuditEntry[]> {
  return cacheWrap(
    AUDIT_KEY,
    () => Promise.resolve(auditLog.map((a) => ({ ...a }))),
    CACHE_TTL.governanceAuditLog,
  );
}

/** Helper — append an audit-log entry (in-memory only — no Prisma model). */
function recordAudit(
  actor: string,
  action: string,
  resource: string,
  result: GovernanceAuditEntry["result"],
): GovernanceAuditEntry {
  const entry: GovernanceAuditEntry = {
    id: `gov-audit-${randomUUID()}`,
    actor,
    action,
    resource,
    result,
    ip: "0.0.0.0",
    timestamp: new Date().toISOString(),
  };
  auditLog = [entry, ...auditLog].slice(0, 500);
  return entry;
}

/** Approve a pending approval. Mutates state + appends audit entry. */
export async function approveApproval(
  id: string,
  input: ApproveInput,
): Promise<GovernanceApproval> {
  await seedIfEmpty();
  const row = await db.governanceApproval.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Approval '${id}' not found`);
  if (row.decision !== "pending") {
    throw AppError.conflict(
      `Approval '${id}' is already ${row.decision}`,
      { currentStatus: row.decision },
    );
  }
  const reviewer = input.reviewer ?? "system-reviewer";
  const now = new Date().toISOString();
  let wrapper: ApprovalWrapper;
  try {
    wrapper = row.reason
      ? (JSON.parse(row.reason) as ApprovalWrapper)
      : {
          type: row.resourceType as GovernanceApproval["type"],
          reason: "",
          risk: "low",
          requester: row.userId ?? "",
          reviewer: null,
          decidedAt: null,
          createdAt: row.createdAt.toISOString(),
        };
  } catch {
    wrapper = {
      type: row.resourceType as GovernanceApproval["type"],
      reason: "",
      risk: "low",
      requester: row.userId ?? "",
      reviewer: null,
      decidedAt: null,
      createdAt: row.createdAt.toISOString(),
    };
  }
  wrapper.reviewer = reviewer;
  wrapper.decidedAt = now;
  await db.governanceApproval.update({
    where: { id },
    data: {
      decision: "approved",
      reason: JSON.stringify(wrapper),
    },
  });
  recordAudit(reviewer, "approval.approve", id, "success");
  invalidateApprovals(id);
  log.info("Approval approved", { id, reviewer });
  return approvalToDomain({
    ...row,
    decision: "approved",
    reason: JSON.stringify(wrapper),
  });
}

/** Reject a pending approval. Mutates state + appends audit entry. */
export async function rejectApproval(
  id: string,
  input: RejectInput,
): Promise<GovernanceApproval> {
  await seedIfEmpty();
  const row = await db.governanceApproval.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Approval '${id}' not found`);
  if (row.decision !== "pending") {
    throw AppError.conflict(
      `Approval '${id}' is already ${row.decision}`,
      { currentStatus: row.decision },
    );
  }
  const reviewer = input.reviewer ?? "system-reviewer";
  const now = new Date().toISOString();
  let wrapper: ApprovalWrapper;
  try {
    wrapper = row.reason
      ? (JSON.parse(row.reason) as ApprovalWrapper)
      : {
          type: row.resourceType as GovernanceApproval["type"],
          reason: "",
          risk: "low",
          requester: row.userId ?? "",
          reviewer: null,
          decidedAt: null,
          createdAt: row.createdAt.toISOString(),
        };
  } catch {
    wrapper = {
      type: row.resourceType as GovernanceApproval["type"],
      reason: "",
      risk: "low",
      requester: row.userId ?? "",
      reviewer: null,
      decidedAt: null,
      createdAt: row.createdAt.toISOString(),
    };
  }
  wrapper.reviewer = reviewer;
  wrapper.decidedAt = now;
  wrapper.reason = `${wrapper.reason}\n\nRejection reason: ${input.reason}`;
  await db.governanceApproval.update({
    where: { id },
    data: {
      decision: "rejected",
      reason: JSON.stringify(wrapper),
    },
  });
  recordAudit(reviewer, "approval.reject", id, "success");
  invalidateApprovals(id);
  log.info("Approval rejected", { id, reviewer });
  return approvalToDomain({
    ...row,
    decision: "rejected",
    reason: JSON.stringify(wrapper),
  });
}

/** Number of approvals in the store. Sync stub — real count is in DB. */
export function approvalsCount(): number {
  return SEED_APPROVALS.length;
}

/** Test-only: reset to seed. */
export function _resetGovernanceForTest(): void {
  seedPromise = null;
  auditLog = SEED_AUDIT.map((a) => ({ ...a }));
  invalidateApprovals();
}
