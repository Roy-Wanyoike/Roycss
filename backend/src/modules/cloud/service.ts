/**
 * Cloud service — Prisma-backed Roy Cloud project + deployment store.
 *
 * Persisted via the `CloudProject` + `Deployment` Prisma models. Seeds
 * 4 deployed projects and 5 historical deployments on first access.
 * All reads are LRU-cached; deploying or deleting a project
 * invalidates the project list, storage, and deployment history caches.
 *
 * Field-mapping: the Prisma `CloudProject` model exposes (userId,
 * name, provider, region, status, configJson). The domain shape's
 * `name` and `status` map directly; the extra fields
 * (url, lastDeployed, environment, size) are JSON-encoded inside
 * `configJson` as a wrapper. The Prisma `Deployment` model exposes
 * (projectId, environment, status, url, logsUrl) — the extra fields
 * (commit, branch, duration, timestamp) are JSON-encoded inside
 * `logsUrl` as a wrapper.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { CloudProject, Deployment } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { DeployCloudProjectInput } from "./schema.js";

const log = createLogger("cloud");

const STATUS_KEY = "cloud:status";
const PROJECTS_KEY = "cloud:projects";
const detailKey = (id: string): string => `cloud:project:${id}`;
const STORAGE_KEY = "cloud:storage";
const DEPLOYMENTS_KEY = "cloud:deployments";

function invalidate(id?: string): void {
  cache.delete(STATUS_KEY);
  cache.delete(PROJECTS_KEY);
  cache.delete(STORAGE_KEY);
  cache.delete(DEPLOYMENTS_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 4 cloud projects + 5 deployments ──────────────────────────────
const SEED_PROJECTS: CloudProject[] = [
  {
    id: "cloud-proj-marketing-site",
    name: "Marketing Site",
    status: "live",
    url: "https://marketing.roycss.cloud",
    lastDeployed: "2025-02-26T14:32:00.000Z",
    environment: "production",
    size: 18_432_000,
  },
  {
    id: "cloud-proj-docs-portal",
    name: "Docs Portal",
    status: "live",
    url: "https://docs.roycss.cloud",
    lastDeployed: "2025-02-25T09:12:00.000Z",
    environment: "production",
    size: 42_980_000,
  },
  {
    id: "cloud-proj-staging-app",
    name: "Staging App",
    status: "building",
    url: "https://staging-app.roycss.cloud",
    lastDeployed: "2025-02-28T11:00:00.000Z",
    environment: "staging",
    size: 7_680_000,
  },
  {
    id: "cloud-proj-preview-pr-248",
    name: "PR #248 Preview",
    status: "idle",
    url: "https://pr-248.roycss.cloud",
    lastDeployed: "2025-02-27T16:45:00.000Z",
    environment: "preview",
    size: 5_120_000,
  },
];

const SEED_DEPLOYMENTS: Deployment[] = [
  {
    id: "deploy-1",
    projectId: "cloud-proj-marketing-site",
    commit: "a1b2c3d",
    branch: "main",
    status: "success",
    duration: 42_000,
    timestamp: "2025-02-26T14:31:18.000Z",
  },
  {
    id: "deploy-2",
    projectId: "cloud-proj-docs-portal",
    commit: "e4f5g6h",
    branch: "main",
    status: "success",
    duration: 58_200,
    timestamp: "2025-02-25T09:11:02.000Z",
  },
  {
    id: "deploy-3",
    projectId: "cloud-proj-staging-app",
    commit: "i7j8k9l",
    branch: "release/2.0",
    status: "building",
    duration: 0,
    timestamp: "2025-02-28T11:00:00.000Z",
  },
  {
    id: "deploy-4",
    projectId: "cloud-proj-preview-pr-248",
    commit: "m0n1o2p",
    branch: "feature/inline-edit",
    status: "success",
    duration: 31_400,
    timestamp: "2025-02-27T16:44:29.000Z",
  },
  {
    id: "deploy-5",
    projectId: "cloud-proj-marketing-site",
    commit: "q3r4s5t",
    branch: "hotfix/typo",
    status: "failed",
    duration: 12_800,
    timestamp: "2025-02-24T18:22:45.000Z",
  },
];

interface ProjectWrapper {
  url: string;
  lastDeployed: string;
  environment: CloudProject["environment"];
  size: number;
  provider: string;
  region: string;
}

interface DeploymentWrapper {
  source: "cloud";
  commit: string;
  branch: string;
  duration: number;
  timestamp: string;
}

function projectToDb(p: CloudProject) {
  const wrapper: ProjectWrapper = {
    url: p.url,
    lastDeployed: p.lastDeployed,
    environment: p.environment,
    size: p.size,
    provider: "roycss-cloud",
    region: "us-east-1",
  };
  return {
    id: p.id,
    userId: null,
    name: p.name,
    provider: wrapper.provider,
    region: wrapper.region,
    status: p.status,
    configJson: JSON.stringify(wrapper),
  };
}

function projectToDomain(row: {
  id: string;
  name: string;
  status: string;
  configJson: string;
}): CloudProject {
  let wrapper: ProjectWrapper;
  try {
    wrapper = JSON.parse(row.configJson) as ProjectWrapper;
  } catch {
    wrapper = {
      url: "",
      lastDeployed: new Date(0).toISOString(),
      environment: "production",
      size: 0,
      provider: "roycss-cloud",
      region: "us-east-1",
    };
  }
  return {
    id: row.id,
    name: row.name,
    status: row.status as CloudProject["status"],
    url: wrapper.url,
    lastDeployed: wrapper.lastDeployed,
    environment: wrapper.environment,
    size: wrapper.size,
  };
}

function deploymentToDb(d: Deployment) {
  const wrapper: DeploymentWrapper = {
    source: "cloud",
    commit: d.commit,
    branch: d.branch,
    duration: d.duration,
    timestamp: d.timestamp,
  };
  return {
    id: d.id,
    projectId: d.projectId,
    environment: d.branch,
    status: d.status,
    url: null,
    logsUrl: JSON.stringify(wrapper),
  };
}

function deploymentToDomain(row: {
  id: string;
  projectId: string | null;
  environment: string;
  status: string;
  url: string | null;
  logsUrl: string | null;
  createdAt: Date;
}): Deployment | null {
  if (!row.logsUrl) return null;
  let wrapper: DeploymentWrapper;
  try {
    wrapper = JSON.parse(row.logsUrl) as DeploymentWrapper;
  } catch {
    return null;
  }
  if (wrapper.source !== "cloud") return null;
  return {
    id: row.id,
    projectId: row.projectId ?? "",
    commit: wrapper.commit,
    branch: wrapper.branch,
    status: row.status as Deployment["status"],
    duration: wrapper.duration,
    timestamp: wrapper.timestamp,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const projectCount = await db.cloudProject.count();
    if (projectCount === 0) {
      await db.cloudProject.createMany({
        data: SEED_PROJECTS.map(projectToDb),
      });
    }
    const deploymentCount = await db.deployment.count();
    if (deploymentCount === 0) {
      await db.deployment.createMany({
        data: SEED_DEPLOYMENTS.map(deploymentToDb),
      });
    }
    log.info("Cloud seeded", {
      projects: SEED_PROJECTS.length,
      deployments: SEED_DEPLOYMENTS.length,
    });
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** Get cloud service status. Cached (1min — freshness matters). */
export async function getStatus(): Promise<{
  status: "operational" | "degraded" | "down";
  region: string;
  projects: number;
  lastIncident: string | null;
}> {
  return cacheWrap(
    STATUS_KEY,
    async () => {
      await seedIfEmpty();
      const count = await db.cloudProject.count();
      return {
        status: "operational" as const,
        region: "us-east-1",
        projects: count,
        lastIncident: null,
      };
    },
    CACHE_TTL.cloudStatus,
  );
}

/** List the user's cloud projects. Cached. */
export async function listProjects(): Promise<CloudProject[]> {
  return cacheWrap(
    PROJECTS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.cloudProject.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(projectToDomain);
    },
    CACHE_TTL.cloudProjects,
  );
}

/** Get a single cloud project by id. Cached. Throws 404 if missing. */
export async function getProjectById(id: string): Promise<CloudProject> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.cloudProject.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Cloud project '${id}' not found`);
      return projectToDomain(row);
    },
    CACHE_TTL.cloudProjectDetail,
  );
}

/** Deploy (create) a new cloud project. Invalidates list + storage + history. */
export async function deployProject(
  input: DeployCloudProjectInput,
): Promise<CloudProject> {
  await seedIfEmpty();
  const id = `cloud-proj-${randomUUID()}`;
  const now = new Date().toISOString();
  const project: CloudProject = {
    id,
    name: input.name,
    status: "building",
    url: `https://${id}.roycss.cloud`,
    lastDeployed: now,
    environment: input.environment,
    size: 0,
  };
  await db.cloudProject.create({ data: projectToDb(project) });

  const deployment: Deployment = {
    id: `deploy-${randomUUID()}`,
    projectId: id,
    commit: "initial",
    branch: input.environment === "preview" ? "preview" : "main",
    status: "building",
    duration: 0,
    timestamp: now,
  };
  await db.deployment.create({ data: deploymentToDb(deployment) });

  invalidate(id);
  log.info("Cloud project deployed", { id, name: project.name });
  return project;
}

/** Delete a cloud project by id. Invalidates caches. */
export async function deleteProject(id: string): Promise<void> {
  await seedIfEmpty();
  const row = await db.cloudProject.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Cloud project '${id}' not found`);
  await db.deployment.deleteMany({ where: { projectId: id } });
  await db.cloudProject.delete({ where: { id } });
  invalidate(id);
  log.info("Cloud project deleted", { id });
}

/** Storage usage summary. Cached. */
export async function getStorage(): Promise<{
  used: number;
  quota: number;
  unit: "bytes";
  projects: number;
}> {
  return cacheWrap(
    STORAGE_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.cloudProject.findMany();
      const used = rows.reduce((sum, r) => {
        try {
          const wrapper = JSON.parse(r.configJson) as ProjectWrapper;
          return sum + (wrapper.size ?? 0);
        } catch {
          return sum;
        }
      }, 0);
      return {
        used,
        quota: 5 * 1024 * 1024 * 1024, // 5 GB
        unit: "bytes",
        projects: rows.length,
      };
    },
    CACHE_TTL.cloudStorage,
  );
}

/** Deployment history across all projects. Cached. */
export async function listDeployments(): Promise<Deployment[]> {
  return cacheWrap(
    DEPLOYMENTS_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.deployment.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows
        .map(deploymentToDomain)
        .filter((d): d is Deployment => d !== null);
    },
    CACHE_TTL.cloudDeployments,
  );
}

/** Number of projects in the store. Sync stub — real count is in DB. */
export function projectsCount(): number {
  return SEED_PROJECTS.length;
}

/** Test-only: reset to seed. */
export function _resetCloudForTest(): void {
  seedPromise = null;
  invalidate();
}
