/**
 * Deploy service — Prisma-backed Roy Deploy platform + history store.
 *
 * Persisted via the Prisma `Deployment` model (shared with the cloud
 * module). Seeds 6 deployment platforms (static — no Prisma model), 5
 * historical deployments, and 3 configured environments (static). The
 * 5 seed deployments are persisted as `Deployment` rows tagged with
 * `source: "deploy"` inside the `logsUrl` wrapper so they can be
 * filtered apart from the cloud module's Deployment rows.
 *
 * Field-mapping: the Prisma `Deployment` model exposes (projectId,
 * environment, status, url, logsUrl). The domain shape's `projectId`
 * maps directly; `environment ← environment`, `status ← status`,
 * `url ← url`; the extra fields (platform, commit, branch, duration,
 * timestamp) are JSON-encoded inside `logsUrl` as a wrapper that also
 * carries a `source` discriminator.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
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

// ─── Seed: 6 platforms (static — no Prisma model) ──────────────────────
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
    description: "Firebase Hosting with global CDN and rollback support.",
    connected: false,
    regions: ["us-central1", "europe-west1", "asia-east1"],
    features: ["hosting", "functions", "emulators"],
  },
];

// ─── Seed: 3 environments (static — no Prisma model) ───────────────────
const SEED_ENVIRONMENTS: DeployEnvironment[] = [
  {
    id: "env-prod",
    name: "Production",
    branch: "main",
    platformId: "vercel",
    url: "https://roycss.cloud",
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

// ─── Seed: 5 historical deployments ─────────────────────────────────────
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

interface HistoryWrapper {
  source: "deploy";
  platform: string;
  commit: string;
  branch: string;
  duration: number;
  timestamp: string;
}

function toDbRow(h: DeployHistoryEntry) {
  const wrapper: HistoryWrapper = {
    source: "deploy",
    platform: h.platform,
    commit: h.commit,
    branch: h.branch,
    duration: h.duration,
    timestamp: h.timestamp,
  };
  return {
    id: h.id,
    projectId: h.projectId,
    environment: h.environment,
    status: h.status,
    url: h.url,
    logsUrl: JSON.stringify(wrapper),
  };
}

function toDomain(row: {
  id: string;
  projectId: string | null;
  environment: string;
  status: string;
  url: string | null;
  logsUrl: string | null;
  createdAt: Date;
}): DeployHistoryEntry | null {
  if (!row.logsUrl) return null;
  let wrapper: HistoryWrapper;
  try {
    wrapper = JSON.parse(row.logsUrl) as HistoryWrapper;
  } catch {
    return null;
  }
  if (wrapper.source !== "deploy") return null;
  return {
    id: row.id,
    projectId: row.projectId ?? "",
    environment: row.environment,
    platform: wrapper.platform,
    status: row.status as DeployHistoryEntry["status"],
    commit: wrapper.commit,
    branch: wrapper.branch,
    duration: wrapper.duration,
    timestamp: wrapper.timestamp,
    url: row.url ?? "",
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    // Count deploy-tagged rows specifically (the table is shared with cloud).
    const all = await db.deployment.findMany();
    const deployRows = all.filter((r) => {
      if (!r.logsUrl) return false;
      try {
        const w = JSON.parse(r.logsUrl) as { source?: string };
        return w.source === "deploy";
      } catch {
        return false;
      }
    });
    if (deployRows.length === 0) {
      await db.deployment.createMany({
        data: SEED_HISTORY.map(toDbRow),
      });
      log.info("Deploy history seeded", { count: SEED_HISTORY.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List configured deployment platforms. Cached. */
export async function listPlatforms(): Promise<DeployPlatform[]> {
  return cacheWrap(
    PLATFORMS_KEY,
    () => Promise.resolve(SEED_PLATFORMS.map((p) => ({ ...p, regions: [...p.regions], features: [...p.features] }))),
    CACHE_TTL.deployPlatforms,
  );
}

/** List configured environments. Cached. */
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
    async () => {
      await seedIfEmpty();
      const rows = await db.deployment.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows
        .map(toDomain)
        .filter((d): d is DeployHistoryEntry => d !== null);
    },
    CACHE_TTL.deployHistory,
  );
}

/** Get a single deployment by id. Cached. Throws 404 if missing. */
export async function getHistoryById(
  id: string,
): Promise<DeployHistoryEntry> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.deployment.findUnique({ where: { id } });
      const entry = row ? toDomain(row) : null;
      if (!entry) throw AppError.notFound(`Deployment '${id}' not found`);
      return entry;
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
  await db.deployment.create({ data: toDbRow(entry) });
  invalidateHistory(id);
  log.info("Deployment created", { id, platform: platform.name });
  return entry;
}

/** Number of deployments in the history. Sync stub — real count is in DB. */
export function historyCount(): number {
  return SEED_HISTORY.length;
}

/** Test-only: reset to seed. */
export function _resetDeployForTest(): void {
  seedPromise = null;
  invalidateHistory();
}

log.debug("Deploy module loaded", {
  platforms: SEED_PLATFORMS.length,
  environments: SEED_ENVIRONMENTS.length,
  history: SEED_HISTORY.length,
});
