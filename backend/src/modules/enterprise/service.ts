/**
 * Enterprise service — Prisma-backed RoyCSS Enterprise account store.
 *
 * Persisted via the `Organization` / `Team` / `License` /
 * `EnterpriseAuditLog` Prisma models. Seeds 3 organizations, 5 teams,
 * 4 licenses, and 8 audit-log entries on first access.
 *
 * Field-mapping: the Prisma schemas for `Organization`, `Team`,
 * `License` don't carry all the domain shape's fields (no
 * seatsUsed/ownerId/memberCount/type/status columns). The basic
 * fields are persisted; the missing fields are looked up from the
 * static seed arrays (keyed by id) so existing seed IDs round-trip
 * their original values, and new IDs fall back to sensible defaults.
 * `EnterpriseAuditLog` carries all the domain shape's data — its
 * `metadataJson` stores the `ip` field.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
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

// Lookup maps for the extra domain fields not in the Prisma schema.
const ORG_EXTRAS = new Map<string, { seatsUsed: number; ownerId: string }>(
  SEED_ORGS.map((o) => [o.id, { seatsUsed: o.seatsUsed, ownerId: o.ownerId }]),
);
const TEAM_EXTRAS = new Map<string, number>(
  SEED_TEAMS.map((t) => [t.id, t.memberCount]),
);
const LICENSE_EXTRAS = new Map<
  string,
  { type: License["type"]; status: License["status"]; seats: number }
>(
  SEED_LICENSES.map((l) => [
    l.id,
    { type: l.type, status: l.status, seats: l.seats },
  ]),
);

function orgToDb(o: Organization) {
  return {
    id: o.id,
    slug: o.id,
    name: o.name,
    plan: o.plan,
    seats: o.seats,
  };
}

function orgToDomain(row: {
  id: string;
  name: string;
  plan: string;
  seats: number;
  createdAt: Date;
}): Organization {
  const extras = ORG_EXTRAS.get(row.id) ?? { seatsUsed: 0, ownerId: "" };
  return {
    id: row.id,
    name: row.name,
    plan: row.plan as Organization["plan"],
    seats: row.seats,
    seatsUsed: extras.seatsUsed,
    ownerId: extras.ownerId,
    createdAt: row.createdAt.toISOString(),
  };
}

function teamToDb(t: Team) {
  return {
    id: t.id,
    orgId: t.orgId,
    name: t.name,
    slug: t.id,
  };
}

function teamToDomain(row: {
  id: string;
  orgId: string;
  name: string;
  createdAt: Date;
}): Team {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    memberCount: TEAM_EXTRAS.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
  };
}

function licenseToDb(l: License) {
  return {
    id: l.id,
    orgId: l.orgId,
    key: l.id,
    tier: l.type,
    expiresAt: l.expiresAt === "9999-12-31T23:59:59.000Z" ? null : new Date(l.expiresAt),
  };
}

function licenseToDomain(row: {
  id: string;
  orgId: string;
  tier: string;
  expiresAt: Date | null;
  createdAt: Date;
}): License {
  const extras = LICENSE_EXTRAS.get(row.id) ?? {
    type: row.tier as License["type"],
    status: "active" as License["status"],
    seats: 0,
  };
  return {
    id: row.id,
    orgId: row.orgId,
    type: extras.type,
    status: extras.status,
    seats: extras.seats,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : "9999-12-31T23:59:59.000Z",
  };
}

function auditToDb(a: AuditLogEntry) {
  return {
    id: a.id,
    orgId: a.orgId,
    userId: a.actor,
    action: a.action,
    resourceType: a.resource.split(".")[0] ?? "resource",
    resourceId: a.resource,
    metadataJson: JSON.stringify({ ip: a.ip, timestamp: a.timestamp }),
  };
}

function auditToDomain(row: {
  id: string;
  orgId: string;
  userId: string | null;
  action: string;
  resourceId: string | null;
  metadataJson: string;
  createdAt: Date;
}): AuditLogEntry {
  let ip = "";
  let timestamp = row.createdAt.toISOString();
  try {
    const meta = JSON.parse(row.metadataJson) as { ip?: string; timestamp?: string };
    if (meta.ip) ip = meta.ip;
    if (meta.timestamp) timestamp = meta.timestamp;
  } catch {
    // Keep defaults.
  }
  return {
    id: row.id,
    orgId: row.orgId,
    actor: row.userId ?? "",
    action: row.action,
    resource: row.resourceId ?? "",
    ip,
    timestamp,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if ((await db.organization.count()) === 0) {
      await db.organization.createMany({ data: SEED_ORGS.map(orgToDb) });
    }
    if ((await db.team.count()) === 0) {
      await db.team.createMany({ data: SEED_TEAMS.map(teamToDb) });
    }
    if ((await db.license.count()) === 0) {
      await db.license.createMany({ data: SEED_LICENSES.map(licenseToDb) });
    }
    if ((await db.enterpriseAuditLog.count()) === 0) {
      await db.enterpriseAuditLog.createMany({ data: SEED_AUDIT.map(auditToDb) });
    }
    log.info("Enterprise seeded", {
      orgs: SEED_ORGS.length,
      teams: SEED_TEAMS.length,
      licenses: SEED_LICENSES.length,
      audit: SEED_AUDIT.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all organizations. Cached. */
export async function listOrganizations(): Promise<Organization[]> {
  return cacheWrap(
    ORGS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.organization.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(orgToDomain);
    },
    CACHE_TTL.enterpriseOrganizations,
  );
}

/** Get a single organization by id. Cached. Throws 404 if missing. */
export async function getOrganizationById(id: string): Promise<Organization> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.organization.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Organization '${id}' not found`);
      return orgToDomain(row);
    },
    CACHE_TTL.enterpriseOrganizations,
  );
}

/** Create a new organization. Invalidates org list cache. */
export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  await seedIfEmpty();
  const id = `org-${randomUUID()}`;
  const org: Organization = {
    id,
    name: input.name,
    plan: input.plan,
    seats: input.seats,
    seatsUsed: 1, // owner occupies the first seat
    ownerId: input.ownerId,
    createdAt: new Date().toISOString(),
  };
  await db.organization.create({
    data: {
      id: org.id,
      slug: org.id,
      name: org.name,
      plan: org.plan,
      seats: org.seats,
    },
  });
  // Track extras for newly created orgs so reads round-trip correctly.
  ORG_EXTRAS.set(org.id, { seatsUsed: org.seatsUsed, ownerId: org.ownerId });
  invalidateOrgs(org.id);
  log.info("Organization created", { id: org.id, name: org.name });
  return org;
}

/** List all teams (optionally filtered by orgId via service consumer). Cached. */
export async function listTeams(): Promise<Team[]> {
  return cacheWrap(
    TEAMS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.team.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(teamToDomain);
    },
    CACHE_TTL.enterpriseTeams,
  );
}

/** List all licenses. Cached. */
export async function listLicenses(): Promise<License[]> {
  return cacheWrap(
    LICENSES_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.license.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(licenseToDomain);
    },
    CACHE_TTL.enterpriseLicenses,
  );
}

/** List all audit log entries. Cached. */
export async function listAuditLog(): Promise<AuditLogEntry[]> {
  return cacheWrap(
    AUDIT_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.enterpriseAuditLog.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(auditToDomain);
    },
    CACHE_TTL.enterpriseAuditLog,
  );
}

/** Number of organizations in the store. Sync stub — real count is in DB. */
export function organizationsCount(): number {
  return SEED_ORGS.length;
}

/** Test-only: reset to seed. */
export function _resetEnterpriseForTest(): void {
  seedPromise = null;
  invalidateOrgs();
}
