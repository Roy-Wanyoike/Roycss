/**
 * Enterprise service — in-memory RoyCSS Enterprise account store.
 *
 * Mock backend (no DB). Seeds 3 organizations, 5 teams, 4 licenses, and
 * 8 audit-log entries. All reads are LRU-cached; creating an organization
 * invalidates the org list cache.
 *
 * Future: persist via Prisma `Organization`/`Team`/`License`/`AuditLog`
 * models and gate writes behind an admin role + SSO.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  AuditLogEntry,
  License,
  Organization,
  Team,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { CreateOrganizationInput } from "./schema.js";

const log = createLogger("enterprise");

const ORGS_KEY = "enterprise:orgs";
const detailKey = (id: string): string => `enterprise:org:${id}`;
const TEAMS_KEY = "enterprise:teams";
const LICENSES_KEY = "enterprise:licenses";
const AUDIT_KEY = "enterprise:audit";

function invalidateOrgs(id?: string): void {
  cache.delete(ORGS_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 3 organizations ───────────────────────────────────────────────
const SEED_ORGS: Organization[] = [
  {
    id: "org-acme-corp",
    name: "Acme Corp",
    plan: "enterprise",
    seats: 500,
    seatsUsed: 312,
    ownerId: "user-acme-admin",
    createdAt: "2024-09-04T00:00:00.000Z",
  },
  {
    id: "org-globex",
    name: "Globex",
    plan: "business",
    seats: 50,
    seatsUsed: 38,
    ownerId: "user-globex-admin",
    createdAt: "2024-11-12T00:00:00.000Z",
  },
  {
    id: "org-initech",
    name: "Initech",
    plan: "team",
    seats: 10,
    seatsUsed: 7,
    ownerId: "user-initech-admin",
    createdAt: "2025-01-08T00:00:00.000Z",
  },
];

// ─── Seed: 5 teams ───────────────────────────────────────────────────────
const SEED_TEAMS: Team[] = [
  { id: "team-acme-design", orgId: "org-acme-corp", name: "Design Systems", memberCount: 24, createdAt: "2024-09-10T00:00:00.000Z" },
  { id: "team-acme-platform", orgId: "org-acme-corp", name: "Platform", memberCount: 41, createdAt: "2024-09-10T00:00:00.000Z" },
  { id: "team-acme-marketing", orgId: "org-acme-corp", name: "Marketing", memberCount: 12, createdAt: "2024-10-02T00:00:00.000Z" },
  { id: "team-globex-eng", orgId: "org-globex", name: "Engineering", memberCount: 28, createdAt: "2024-11-15T00:00:00.000Z" },
  { id: "team-initech-frontend", orgId: "org-initech", name: "Frontend", memberCount: 7, createdAt: "2025-01-09T00:00:00.000Z" },
];

// ─── Seed: 4 licenses ────────────────────────────────────────────────────
const SEED_LICENSES: License[] = [
  { id: "lic-acme-annual", orgId: "org-acme-corp", type: "annual", status: "active", seats: 500, expiresAt: "2025-12-31T23:59:59.000Z" },
  { id: "lic-acme-eval", orgId: "org-acme-corp", type: "evaluation", status: "expired", seats: 25, expiresAt: "2024-10-04T00:00:00.000Z" },
  { id: "lic-globex-perpetual", orgId: "org-globex", type: "perpetual", status: "active", seats: 50, expiresAt: "9999-12-31T23:59:59.000Z" },
  { id: "lic-initech-annual", orgId: "org-initech", type: "annual", status: "active", seats: 10, expiresAt: "2026-01-08T00:00:00.000Z" },
];

// ─── Seed: 8 audit-log entries ───────────────────────────────────────────
const SEED_AUDIT: AuditLogEntry[] = [
  { id: "audit-1", orgId: "org-acme-corp", actor: "user-acme-admin", action: "org.create", resource: "org-acme-corp", ip: "192.0.2.10", timestamp: "2024-09-04T14:02:11.000Z" },
  { id: "audit-2", orgId: "org-acme-corp", actor: "user-acme-admin", action: "license.purchase", resource: "lic-acme-annual", ip: "192.0.2.10", timestamp: "2024-09-04T14:08:42.000Z" },
  { id: "audit-3", orgId: "org-acme-corp", actor: "user-acme-admin", action: "team.create", resource: "team-acme-design", ip: "192.0.2.10", timestamp: "2024-09-10T09:14:00.000Z" },
  { id: "audit-4", orgId: "org-acme-corp", actor: "user-acme-platform-lead", action: "member.invite", resource: "team-acme-platform", ip: "198.51.100.22", timestamp: "2024-09-12T11:30:00.000Z" },
  { id: "audit-5", orgId: "org-globex", actor: "user-globex-admin", action: "org.create", resource: "org-globex", ip: "203.0.113.5", timestamp: "2024-11-12T16:00:00.000Z" },
  { id: "audit-6", orgId: "org-globex", actor: "user-globex-admin", action: "license.purchase", resource: "lic-globex-perpetual", ip: "203.0.113.5", timestamp: "2024-11-13T08:42:00.000Z" },
  { id: "audit-7", orgId: "org-initech", actor: "user-initech-admin", action: "org.create", resource: "org-initech", ip: "198.51.100.99", timestamp: "2025-01-08T13:11:00.000Z" },
  { id: "audit-8", orgId: "org-acme-corp", actor: "user-acme-design-lead", action: "theme.publish", resource: "theme-healthcare", ip: "192.0.2.55", timestamp: "2025-02-18T10:25:00.000Z" },
];

let orgs: Organization[] = SEED_ORGS.map((o) => ({ ...o }));
const teams: Team[] = SEED_TEAMS.map((t) => ({ ...t }));
const licenses: License[] = SEED_LICENSES.map((l) => ({ ...l }));
const auditLog: AuditLogEntry[] = SEED_AUDIT.map((a) => ({ ...a }));

/** List all organizations. Cached. */
export async function listOrganizations(): Promise<Organization[]> {
  return cacheWrap(
    ORGS_KEY,
    () => Promise.resolve(orgs.map((o) => ({ ...o }))),
    CACHE_TTL.enterpriseOrganizations,
  );
}

/** Get a single organization by id. Cached. Throws 404 if missing. */
export async function getOrganizationById(id: string): Promise<Organization> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = orgs.find((o) => o.id === id);
      if (!found) throw AppError.notFound(`Organization '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.enterpriseOrganizations,
  );
}

/** Create a new organization. Invalidates org list cache. */
export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  const org: Organization = {
    id: `org-${randomUUID()}`,
    name: input.name,
    plan: input.plan,
    seats: input.seats,
    seatsUsed: 1, // owner occupies the first seat
    ownerId: input.ownerId,
    createdAt: new Date().toISOString(),
  };
  orgs.push(org);
  invalidateOrgs(org.id);
  log.info("Organization created", { id: org.id, name: org.name });
  return org;
}

/** List all teams (optionally filtered by orgId via service consumer). Cached. */
export async function listTeams(): Promise<Team[]> {
  return cacheWrap(
    TEAMS_KEY,
    () => Promise.resolve(teams.map((t) => ({ ...t }))),
    CACHE_TTL.enterpriseTeams,
  );
}

/** List all licenses. Cached. */
export async function listLicenses(): Promise<License[]> {
  return cacheWrap(
    LICENSES_KEY,
    () => Promise.resolve(licenses.map((l) => ({ ...l }))),
    CACHE_TTL.enterpriseLicenses,
  );
}

/** List all audit log entries. Cached. */
export async function listAuditLog(): Promise<AuditLogEntry[]> {
  return cacheWrap(
    AUDIT_KEY,
    () => Promise.resolve(auditLog.map((a) => ({ ...a }))),
    CACHE_TTL.enterpriseAuditLog,
  );
}

/** Number of organizations in the store. */
export function organizationsCount(): number {
  return orgs.length;
}

/** Test-only: reset to seed. */
export function _resetEnterpriseForTest(): void {
  orgs = SEED_ORGS.map((o) => ({ ...o }));
  invalidateOrgs();
}
