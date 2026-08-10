/**
 * Governance service — Roy Governance approval workflow.
 *
 * Mock backend (no DB). Seeds 5 pending approvals, 3 policies, and
 * 8 audit-log entries. Approving or rejecting an approval mutates
 * its status and appends a new audit-log entry.
 *
 * Reads are LRU-cached; mutations invalidate the approvals + audit-log
 * caches.
 *
 * Future: persist via Prisma `Approval`/`Policy`/`AuditLog` models
 * and gate writes behind an admin role + SSO.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

// ─── Seed: 8 audit-log entries ───────────────────────────────────────────
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

let approvals: GovernanceApproval[] = SEED_APPROVALS.map((a) => ({ ...a }));
const policies: GovernancePolicy[] = SEED_POLICIES.map((p) => ({ ...p }));
let auditLog: GovernanceAuditEntry[] = SEED_AUDIT.map((a) => ({ ...a }));

/** List all approvals. Cached. */
export async function listApprovals(): Promise<GovernanceApproval[]> {
  return cacheWrap(
    APPROVALS_KEY,
    () => Promise.resolve(approvals.map((a) => ({ ...a }))),
    CACHE_TTL.governanceApprovals,
  );
}

/** List all policies. Cached. */
export async function listPolicies(): Promise<GovernancePolicy[]> {
  return cacheWrap(
    POLICIES_KEY,
    () => Promise.resolve(policies.map((p) => ({ ...p }))),
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

/** Helper — append an audit-log entry. */
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
  const idx = approvals.findIndex((a) => a.id === id);
  if (idx === -1) {
    throw AppError.notFound(`Approval '${id}' not found`);
  }
  const current = approvals[idx]!;
  if (current.status !== "pending") {
    throw AppError.conflict(
      `Approval '${id}' is already ${current.status}`,
      { currentStatus: current.status },
    );
  }
  const reviewer = input.reviewer ?? "system-reviewer";
  const now = new Date().toISOString();
  const updated: GovernanceApproval = {
    ...current,
    reviewer,
    status: "approved",
    decidedAt: now,
  };
  approvals = approvals.map((a) => (a.id === id ? updated : a));
  recordAudit(reviewer, "approval.approve", id, "success");
  invalidateApprovals(id);
  log.info("Approval approved", { id, reviewer });
  return updated;
}

/** Reject a pending approval. Mutates state + appends audit entry. */
export async function rejectApproval(
  id: string,
  input: RejectInput,
): Promise<GovernanceApproval> {
  const idx = approvals.findIndex((a) => a.id === id);
  if (idx === -1) {
    throw AppError.notFound(`Approval '${id}' not found`);
  }
  const current = approvals[idx]!;
  if (current.status !== "pending") {
    throw AppError.conflict(
      `Approval '${id}' is already ${current.status}`,
      { currentStatus: current.status },
    );
  }
  const reviewer = input.reviewer ?? "system-reviewer";
  const now = new Date().toISOString();
  const updated: GovernanceApproval = {
    ...current,
    reviewer,
    status: "rejected",
    decidedAt: now,
    reason: `${current.reason}\n\nRejection reason: ${input.reason}`,
  };
  approvals = approvals.map((a) => (a.id === id ? updated : a));
  recordAudit(reviewer, "approval.reject", id, "success");
  invalidateApprovals(id);
  log.info("Approval rejected", { id, reviewer });
  return updated;
}

/** Number of approvals in the store. */
export function approvalsCount(): number {
  return approvals.length;
}

/** Test-only: reset to seed. */
export function _resetGovernanceForTest(): void {
  approvals = SEED_APPROVALS.map((a) => ({ ...a }));
  auditLog = SEED_AUDIT.map((a) => ({ ...a }));
  invalidateApprovals();
}
