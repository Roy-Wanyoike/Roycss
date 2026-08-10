/**
 * Cloud service — in-memory Roy Cloud project + deployment store.
 *
 * Mock backend (no DB). Seeds 4 deployed projects and 5 historical
 * deployments across the user's cloud account. All reads are LRU-cached;
 * deploying a new project invalidates the project list, storage, and
 * deployment history caches.
 *
 * Future: swap the in-memory arrays for a Prisma `CloudProject`/`Deployment`
 * model without changing the route layer.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

let projects: CloudProject[] = SEED_PROJECTS.map((p) => ({ ...p }));
let deployments: Deployment[] = SEED_DEPLOYMENTS.map((d) => ({ ...d }));

/** Get cloud service status. Cached (1min — freshness matters). */
export async function getStatus(): Promise<{
  status: "operational" | "degraded" | "down";
  region: string;
  projects: number;
  lastIncident: string | null;
}> {
  return cacheWrap(
    STATUS_KEY,
    () =>
      Promise.resolve({
        status: "operational" as const,
        region: "us-east-1",
        projects: projects.length,
        lastIncident: null,
      }),
    CACHE_TTL.cloudStatus,
  );
}

/** List the user's cloud projects. Cached. */
export async function listProjects(): Promise<CloudProject[]> {
  return cacheWrap(
    PROJECTS_KEY,
    () => Promise.resolve(projects.map((p) => ({ ...p }))),
    CACHE_TTL.cloudProjects,
  );
}

/** Get a single cloud project by id. Cached. Throws 404 if missing. */
export async function getProjectById(id: string): Promise<CloudProject> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = projects.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Cloud project '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.cloudProjectDetail,
  );
}

/** Deploy (create) a new cloud project. Invalidates list + storage + history. */
export async function deployProject(
  input: DeployCloudProjectInput,
): Promise<CloudProject> {
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
  projects.push(project);

  const deployment: Deployment = {
    id: `deploy-${randomUUID()}`,
    projectId: id,
    commit: "initial",
    branch: input.environment === "preview" ? "preview" : "main",
    status: "building",
    duration: 0,
    timestamp: now,
  };
  deployments.push(deployment);

  invalidate(id);
  log.info("Cloud project deployed", { id, name: project.name });
  return project;
}

/** Delete a cloud project by id. Invalidates caches. */
export async function deleteProject(id: string): Promise<void> {
  const before = projects.length;
  projects = projects.filter((p) => p.id !== id);
  deployments = deployments.filter((d) => d.projectId !== id);
  if (projects.length === before) {
    throw AppError.notFound(`Cloud project '${id}' not found`);
  }
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
    () => {
      const used = projects.reduce((sum, p) => sum + p.size, 0);
      return Promise.resolve({
        used,
        quota: 5 * 1024 * 1024 * 1024, // 5 GB
        unit: "bytes",
        projects: projects.length,
      });
    },
    CACHE_TTL.cloudStorage,
  );
}

/** Deployment history across all projects. Cached. */
export async function listDeployments(): Promise<Deployment[]> {
  return cacheWrap(
    DEPLOYMENTS_KEY,
    () => Promise.resolve(deployments.map((d) => ({ ...d }))),
    CACHE_TTL.cloudDeployments,
  );
}

/** Number of projects in the store. */
export function projectsCount(): number {
  return projects.length;
}

/** Test-only: reset to seed. */
export function _resetCloudForTest(): void {
  projects = SEED_PROJECTS.map((p) => ({ ...p }));
  deployments = SEED_DEPLOYMENTS.map((d) => ({ ...d }));
  invalidate();
}
