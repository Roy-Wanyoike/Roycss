/**
 * Deploy service — in-memory Roy Deploy platform + history store.
 *
 * Mock backend (no DB). Seeds 6 deployment platforms (Vercel, Netlify,
 * Cloudflare, AWS, Azure, GCP), 5 historical deployments, and 3
 * configured environments. All reads are LRU-cached; deploying a new
 * build invalidates the history cache.
 *
 * Future: swap the in-memory arrays for a Prisma `Deployment` model
 * backed by webhook events from the real platforms.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  DeployEnvironment,
  DeployHistoryEntry,
  DeployPlatform,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("deploy");

const PLATFORMS_KEY = "deploy:platforms";
const ENVIRONMENTS_KEY = "deploy:environments";
const HISTORY_KEY = "deploy:history";
const detailKey = (id: string): string => `deploy:history:${id}`;

function invalidateHistory(id?: string): void {
  cache.delete(HISTORY_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 6 platforms ───────────────────────────────────────────────────
const SEED_PLATFORMS: DeployPlatform[] = [
  {
    id: "vercel",
    name: "Vercel",
    description: "Edge-first platform optimized for Next.js / front-end apps.",
    connected: true,
    regions: ["iad1", "sfo1", "hnd1", "fra1"],
    features: ["edge-functions", "preview-deploys", "automatic-https"],
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Static + serverless platform with global CDN.",
    connected: true,
    regions: ["us-east", "us-west", "eu-central", "ap-southeast"],
    features: ["forms", "functions", "split-testing"],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Pages",
    description: "Pages deployed to Cloudflare's global edge network.",
    connected: true,
    regions: ["auto"],
    features: ["workers", "kv", "r2-storage"],
  },
  {
    id: "aws",
    name: "AWS (Amplify / S3+CloudFront)",
    description: "Deploy to AWS Amplify Hosting or static S3 + CloudFront.",
    connected: false,
    regions: ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"],
    features: ["amplify", "s3-hosting", "cloudfront", "lambda"],
  },
  {
    id: "azure",
    name: "Azure Static Web Apps",
    description: "Static Web Apps with managed TLS and global CDN.",
    connected: false,
    regions: ["eastus", "westeurope", "southeastasia"],
    features: ["managed-tls", "functions", "auth"],
  },
  {
    id: "gcp",
    name: "Google Cloud (Firebase)",
    description: "Firebase Hosting with global CDN and SSL.",
    connected: false,
    regions: ["us-central", "europe-west", "asia-east"],
    features: ["firebase", "cloud-functions", "cloud-run"],
  },
];

// ─── Seed: 3 environments ────────────────────────────────────────────────
const SEED_ENVIRONMENTS: DeployEnvironment[] = [
  {
    id: "env-production",
    name: "Production",
    branch: "main",
    platformId: "vercel",
    url: "https://marketing.roycss.cloud",
    autoDeploy: true,
  },
  {
    id: "env-staging",
    name: "Staging",
    branch: "release/*",
    platformId: "netlify",
    url: "https://staging.roycss.cloud",
    autoDeploy: true,
  },
  {
    id: "env-preview",
    name: "Preview",
    branch: "feature/*",
    platformId: "cloudflare",
    url: "https://preview.roycss.cloud",
    autoDeploy: false,
  },
];

// ─── Seed: 5 deployments ─────────────────────────────────────────────────
const SEED_HISTORY: DeployHistoryEntry[] = [
  {
    id: "deploy-hist-1",
    projectId: "prj-marketing",
    environment: "Production",
    platform: "Vercel",
    status: "success",
    commit: "a1b2c3d",
    branch: "main",
    duration: 42_000,
    timestamp: "2025-02-26T14:31:18.000Z",
    url: "https://marketing.roycss.cloud",
  },
  {
    id: "deploy-hist-2",
    projectId: "prj-docs",
    environment: "Production",
    platform: "Vercel",
    status: "success",
    commit: "e4f5g6h",
    branch: "main",
    duration: 58_200,
    timestamp: "2025-02-25T09:11:02.000Z",
    url: "https://docs.roycss.cloud",
  },
  {
    id: "deploy-hist-3",
    projectId: "prj-staging",
    environment: "Staging",
    platform: "Netlify",
    status: "building",
    commit: "i7j8k9l",
    branch: "release/2.0",
    duration: 0,
    timestamp: "2025-02-28T11:00:00.000Z",
    url: "https://staging.roycss.cloud",
  },
  {
    id: "deploy-hist-4",
    projectId: "prj-preview",
    environment: "Preview",
    platform: "Cloudflare Pages",
    status: "success",
    commit: "m0n1o2p",
    branch: "feature/inline-edit",
    duration: 31_400,
    timestamp: "2025-02-27T16:44:29.000Z",
    url: "https://preview.roycss.cloud",
  },
  {
    id: "deploy-hist-5",
    projectId: "prj-marketing",
    environment: "Production",
    platform: "Vercel",
    status: "failed",
    commit: "q3r4s5t",
    branch: "hotfix/typo",
    duration: 12_800,
    timestamp: "2025-02-24T18:22:45.000Z",
    url: "https://marketing.roycss.cloud",
  },
];

let history: DeployHistoryEntry[] = SEED_HISTORY.map((h) => ({ ...h }));

/** List all configured platforms. Cached. */
export async function listPlatforms(): Promise<DeployPlatform[]> {
  return cacheWrap(
    PLATFORMS_KEY,
    () => Promise.resolve(SEED_PLATFORMS.map((p) => ({ ...p, regions: [...p.regions], features: [...p.features] }))),
    CACHE_TTL.deployPlatforms,
  );
}

/** List all configured environments. Cached. */
export async function listEnvironments(): Promise<DeployEnvironment[]> {
  return cacheWrap(
    ENVIRONMENTS_KEY,
    () => Promise.resolve(SEED_ENVIRONMENTS.map((e) => ({ ...e }))),
    CACHE_TTL.deployEnvironments,
  );
}

/** List deployment history. Cached. */
export async function listHistory(): Promise<DeployHistoryEntry[]> {
  return cacheWrap(
    HISTORY_KEY,
    () => Promise.resolve(history.map((h) => ({ ...h }))),
    CACHE_TTL.deployHistory,
  );
}

/** Get a single deployment by id. Cached. Throws 404 if missing. */
export async function getHistoryById(
  id: string,
): Promise<DeployHistoryEntry> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = history.find((h) => h.id === id);
      if (!found)
        throw AppError.notFound(`Deployment '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.deployHistoryDetail,
  );
}

/** Create a new deployment. Invalidates history cache. */
export async function createDeployment(input: {
  projectId: string;
  environment: string;
  platformId: string;
  branch?: string;
  commit?: string;
}): Promise<DeployHistoryEntry> {
  const platform = SEED_PLATFORMS.find((p) => p.id === input.platformId);
  if (!platform) {
    throw AppError.notFound(`Platform '${input.platformId}' not found`);
  }
  const env =
    SEED_ENVIRONMENTS.find((e) => e.name === input.environment) ??
    SEED_ENVIRONMENTS.find((e) => e.id === input.environment);
  const environmentName = env?.name ?? input.environment;

  const id = `deploy-hist-${randomUUID()}`;
  const now = new Date().toISOString();
  const branch = input.branch ?? env?.branch ?? "main";
  const commit = input.commit ?? randomUUID().slice(0, 7);

  const entry: DeployHistoryEntry = {
    id,
    projectId: input.projectId,
    environment: environmentName,
    platform: platform.name,
    status: "building",
    commit,
    branch,
    duration: 0,
    timestamp: now,
    url: `https://${input.projectId}.roycss.cloud`,
  };
  history.push(entry);
  invalidateHistory(id);
  log.info("Deployment created", { id, platform: platform.name });
  return entry;
}

/** Number of deployments in the history. */
export function historyCount(): number {
  return history.length;
}

/** Test-only: reset to seed. */
export function _resetDeployForTest(): void {
  history = SEED_HISTORY.map((h) => ({ ...h }));
  invalidateHistory();
}

log.debug("Deploy module loaded", {
  platforms: SEED_PLATFORMS.length,
  environments: SEED_ENVIRONMENTS.length,
  history: SEED_HISTORY.length,
});
