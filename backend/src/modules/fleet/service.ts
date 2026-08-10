/**
 * Fleet service — in-memory Roy Fleet project + health store.
 *
 * Mock backend (no DB). Seeds 8 monitored projects with health scores,
 * uptime, and region info. All reads are LRU-cached.
 *
 * Future: swap the in-memory array for a Prisma `FleetProject` model
 * backed by scheduled health-check probes.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

let projects: FleetProject[] = SEED_PROJECTS.map((p) => ({ ...p }));

/** List all fleet projects. Cached. */
export async function listProjects(): Promise<FleetProject[]> {
  return cacheWrap(
    PROJECTS_KEY,
    () => Promise.resolve(projects.map((p) => ({ ...p }))),
    CACHE_TTL.fleetProjects,
  );
}

/** Get a single fleet project by id. Cached. Throws 404 if missing. */
export async function getProjectById(id: string): Promise<FleetProject> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = projects.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Fleet project '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.fleetProjectDetail,
  );
}

/** Fleet-wide health summary. Cached (1min — freshness matters). */
export async function getHealth(): Promise<FleetHealth> {
  return cacheWrap(
    HEALTH_KEY,
    () => {
      const total = projects.length;
      const healthy = projects.filter((p) => p.status === "healthy").length;
      const degraded = projects.filter((p) => p.status === "degraded").length;
      const critical = projects.filter((p) => p.status === "critical").length;
      const offline = projects.filter((p) => p.status === "offline").length;
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
      return Promise.resolve({
        total,
        healthy,
        degraded,
        critical,
        offline,
        averageScore,
        uptime,
      });
    },
    CACHE_TTL.fleetHealth,
  );
}

/** Trigger a re-scan of a project. Invalidates list + health caches. */
export async function scanProject(
  id: string,
): Promise<{ id: string; status: FleetProject["status"]; scannedAt: string }> {
  const found = projects.find((p) => p.id === id);
  if (!found) throw AppError.notFound(`Fleet project '${id}' not found`);
  // Mock re-scan — bump lastCheck, leave health/score unchanged.
  const scannedAt = new Date().toISOString();
  found.lastCheck = scannedAt;
  invalidate(id);
  log.info("Fleet project re-scanned", { id });
  return {
    id,
    status: found.status,
    scannedAt,
  };
}

/** Create a new fleet project. Invalidates list + health caches. */
export async function createProject(input: {
  name: string;
  url: string;
  region?: string;
}): Promise<FleetProject> {
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
  projects.push(project);
  invalidate(id);
  log.info("Fleet project added", { id, name: project.name });
  return project;
}

/** Number of projects in the store. */
export function projectsCount(): number {
  return projects.length;
}

/** Test-only: reset to seed. */
export function _resetFleetForTest(): void {
  projects = SEED_PROJECTS.map((p) => ({ ...p }));
  invalidate();
}

log.debug("Fleet module loaded", { projects: SEED_PROJECTS.length });
