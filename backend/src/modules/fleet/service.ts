/**
 * Fleet service — Prisma-backed Roy Fleet project + health store.
 *
 * Persisted via the Prisma `FleetProject` model. Seeds 8 monitored
 * projects with health scores, uptime, and region info on first access.
 * All reads are LRU-cached.
 *
 * Field-mapping: the Prisma `FleetProject` model exposes (userId,
 * name, description, serviceCount, status). The domain shape's `name`
 * and `status` map directly; `description ← url`; `serviceCount ←
 * healthScore`; the extra fields (url, uptime, lastCheck, region)
 * are JSON-encoded inside `description` as a wrapper that also
 * carries the seed `healthScore` (so reads round-trip correctly even
 * though `serviceCount` shadows it).
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { FleetHealth, FleetProject } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("fleet");

const PROJECTS_KEY = "fleet:projects";
const detailKey = (id: string): string => `fleet:project:${id}`;
const HEALTH_KEY = "fleet:health";

function invalidate(id?: string): void {
  cache.delete(PROJECTS_KEY);
  cache.delete(HEALTH_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 8 fleet projects ──────────────────────────────────────────────
const SEED_PROJECTS: FleetProject[] = [
  {
    id: "fleet-marketing",
    name: "Marketing Site",
    url: "https://marketing.roycss.cloud",
    healthScore: 98,
    status: "healthy",
    uptime: 99.99,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "us-east-1",
  },
  {
    id: "fleet-docs",
    name: "Docs Portal",
    url: "https://docs.roycss.cloud",
    healthScore: 94,
    status: "healthy",
    uptime: 99.95,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "us-east-1",
  },
  {
    id: "fleet-shop",
    name: "Shop Frontend",
    url: "https://shop.roycss.cloud",
    healthScore: 91,
    status: "healthy",
    uptime: 99.92,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "eu-west-1",
  },
  {
    id: "fleet-blog",
    name: "Engineering Blog",
    url: "https://blog.roycss.cloud",
    healthScore: 85,
    status: "degraded",
    uptime: 99.45,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "us-west-2",
  },
  {
    id: "fleet-staging",
    name: "Staging App",
    url: "https://staging-app.roycss.cloud",
    healthScore: 72,
    status: "degraded",
    uptime: 98.10,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "us-east-1",
  },
  {
    id: "fleet-dashboard",
    name: "Internal Dashboard",
    url: "https://dashboard.roycss.cloud",
    healthScore: 64,
    status: "critical",
    uptime: 96.30,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "ap-south-1",
  },
  {
    id: "fleet-status",
    name: "Status Page",
    url: "https://status.roycss.cloud",
    healthScore: 99,
    status: "healthy",
    uptime: 100,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "eu-west-1",
  },
  {
    id: "fleet-legacy",
    name: "Legacy Site",
    url: "https://legacy.roycss.cloud",
    healthScore: 0,
    status: "offline",
    uptime: 88.50,
    lastCheck: "2025-02-28T11:00:00.000Z",
    region: "us-west-2",
  },
];

interface FleetWrapper {
  url: string;
  healthScore: number;
  uptime: number;
  lastCheck: string;
  region: string;
}

function toDbRow(p: FleetProject) {
  const wrapper: FleetWrapper = {
    url: p.url,
    healthScore: p.healthScore,
    uptime: p.uptime,
    lastCheck: p.lastCheck,
    region: p.region,
  };
  return {
    id: p.id,
    userId: null,
    name: p.name,
    description: JSON.stringify(wrapper),
    serviceCount: p.healthScore,
    status: p.status,
  };
}

function toDomain(row: {
  id: string;
  name: string;
  description: string;
  serviceCount: number;
  status: string;
  createdAt: Date;
}): FleetProject {
  let wrapper: FleetWrapper;
  try {
    wrapper = JSON.parse(row.description) as FleetWrapper;
  } catch {
    wrapper = {
      url: "",
      healthScore: row.serviceCount,
      uptime: 0,
      lastCheck: row.createdAt.toISOString(),
      region: "us-east-1",
    };
  }
  return {
    id: row.id,
    name: row.name,
    url: wrapper.url,
    healthScore: wrapper.healthScore,
    status: row.status as FleetProject["status"],
    uptime: wrapper.uptime,
    lastCheck: wrapper.lastCheck,
    region: wrapper.region,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.fleetProject.count();
    if (count === 0) {
      await db.fleetProject.createMany({
        data: SEED_PROJECTS.map(toDbRow),
      });
      log.info("Fleet projects seeded", { count: SEED_PROJECTS.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all fleet projects. Cached. */
export async function listProjects(): Promise<FleetProject[]> {
  return cacheWrap(
    PROJECTS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.fleetProject.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(toDomain);
    },
    CACHE_TTL.fleetProjects,
  );
}

/** Get a single fleet project by id. Cached. Throws 404 if missing. */
export async function getProjectById(id: string): Promise<FleetProject> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.fleetProject.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Fleet project '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.fleetProjectDetail,
  );
}

/** Fleet-wide health summary. Cached (1min — freshness matters). */
export async function getHealth(): Promise<FleetHealth> {
  return cacheWrap(
    HEALTH_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.fleetProject.findMany();
      const total = rows.length;
      const statuses = rows.map((r) => r.status);
      const healthy = statuses.filter((s) => s === "healthy").length;
      const degraded = statuses.filter((s) => s === "degraded").length;
      const critical = statuses.filter((s) => s === "critical").length;
      const offline = statuses.filter((s) => s === "offline").length;
      const projects = rows.map(toDomain);
      const averageScore =
        total === 0
          ? 0
          : Math.round(
              projects.reduce((sum, p) => sum + p.healthScore, 0) / total,
            );
      const uptime =
        total === 0
          ? 0
          : Math.round(
              (projects.reduce((sum, p) => sum + p.uptime, 0) / total) * 100,
            ) / 100;
      return {
        total,
        healthy,
        degraded,
        critical,
        offline,
        averageScore,
        uptime,
      };
    },
    CACHE_TTL.fleetHealth,
  );
}

/** Trigger a re-scan of a project. Invalidates list + health caches. */
export async function scanProject(
  id: string,
): Promise<{ id: string; status: FleetProject["status"]; scannedAt: string }> {
  await seedIfEmpty();
  const row = await db.fleetProject.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Fleet project '${id}' not found`);
  // Mock re-scan — bump lastCheck, leave health/score unchanged.
  const scannedAt = new Date().toISOString();
  let wrapper: FleetWrapper;
  try {
    wrapper = JSON.parse(row.description) as FleetWrapper;
  } catch {
    wrapper = {
      url: "",
      healthScore: row.serviceCount,
      uptime: 0,
      lastCheck: scannedAt,
      region: "us-east-1",
    };
  }
  wrapper.lastCheck = scannedAt;
  await db.fleetProject.update({
    where: { id },
    data: { description: JSON.stringify(wrapper) },
  });
  invalidate(id);
  log.info("Fleet project re-scanned", { id });
  return {
    id,
    status: row.status as FleetProject["status"],
    scannedAt,
  };
}

/** Create a new fleet project. Invalidates list + health caches. */
export async function createProject(input: {
  name: string;
  url: string;
  region?: string;
}): Promise<FleetProject> {
  await seedIfEmpty();
  const id = `fleet-${randomUUID()}`;
  const project: FleetProject = {
    id,
    name: input.name,
    url: input.url,
    healthScore: 100,
    status: "healthy",
    uptime: 100,
    lastCheck: new Date().toISOString(),
    region: input.region ?? "us-east-1",
  };
  await db.fleetProject.create({ data: toDbRow(project) });
  invalidate(id);
  log.info("Fleet project added", { id, name: project.name });
  return project;
}

/** Number of projects in the store. Sync stub — real count is in DB. */
export function projectsCount(): number {
  return SEED_PROJECTS.length;
}

/** Test-only: reset to seed. */
export function _resetFleetForTest(): void {
  seedPromise = null;
  invalidate();
}

log.debug("Fleet module loaded", { projects: SEED_PROJECTS.length });
