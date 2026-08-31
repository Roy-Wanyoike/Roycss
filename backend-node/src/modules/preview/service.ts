/**
 * Preview service — Prisma-backed Roy Preview branch deployment store.
 *
 * Persisted via the Prisma `PreviewBranch` model. Seeds 4 preview
 * branches with URLs and status on first access. All reads are
 * LRU-cached; creating or deleting a preview invalidates the list cache.
 *
 * Field-mapping: the Prisma `PreviewBranch` model exposes (projectId,
 * branchName, previewUrl, status). The domain shape's `branch ←
 * branchName`, `url ← previewUrl`, `project ← projectId`, `status ←
 * status` map directly; the extra fields (commit, createdAt, expiresAt)
 * are JSON-encoded inside `previewUrl`? no — `previewUrl` carries the
 * URL itself, so we wrap the extra fields inside `branchName` as a
 * JSON envelope that also carries the original branch name.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { PreviewBranch } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("preview");

const LIST_KEY = "preview:list";
const detailKey = (id: string): string => `preview:${id}`;

function invalidate(id?: string): void {
  cache.delete(LIST_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 4 preview branches ────────────────────────────────────────────
const SEED_PREVIEWS: PreviewBranch[] = [
  {
    id: "preview-1",
    branch: "feature/inline-edit",
    project: "prj-docs",
    url: "https://preview-docs-feature-inline-edit.roycss.cloud",
    status: "ready",
    commit: "a1b2c3d",
    createdAt: "2025-02-27T16:44:29.000Z",
    expiresAt: "2025-03-06T16:44:29.000Z",
  },
  {
    id: "preview-2",
    branch: "feature/dark-mode",
    project: "prj-marketing",
    url: "https://preview-marketing-feature-dark-mode.roycss.cloud",
    status: "building",
    commit: "e4f5g6h",
    createdAt: "2025-02-28T11:00:00.000Z",
    expiresAt: "2025-03-07T11:00:00.000Z",
  },
  {
    id: "preview-3",
    branch: "fix/chart-render",
    project: "prj-dashboard",
    url: "https://preview-dashboard-fix-chart-render.roycss.cloud",
    status: "ready",
    commit: "i7j8k9l",
    createdAt: "2025-02-26T09:30:00.000Z",
    expiresAt: "2025-03-05T09:30:00.000Z",
  },
  {
    id: "preview-4",
    branch: "experiment/redesign",
    project: "prj-blog",
    url: "https://preview-blog-experiment-redesign.roycss.cloud",
    status: "error",
    commit: "m0n1o2p",
    createdAt: "2025-02-25T14:00:00.000Z",
    expiresAt: "2025-03-04T14:00:00.000Z",
  },
];

interface BranchWrapper {
  branch: string;
  commit: string;
  createdAt: string;
  expiresAt: string;
}

function toDbRow(p: PreviewBranch) {
  const wrapper: BranchWrapper = {
    branch: p.branch,
    commit: p.commit,
    createdAt: p.createdAt,
    expiresAt: p.expiresAt,
  };
  return {
    id: p.id,
    projectId: p.project,
    branchName: JSON.stringify(wrapper),
    previewUrl: p.url,
    status: p.status,
  };
}

function toDomain(row: {
  id: string;
  projectId: string | null;
  branchName: string;
  previewUrl: string;
  status: string;
  createdAt: Date;
}): PreviewBranch {
  let wrapper: BranchWrapper = {
    branch: row.branchName,
    commit: "",
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.createdAt.toISOString(),
  };
  try {
    wrapper = JSON.parse(row.branchName) as BranchWrapper;
  } catch {
    // Keep defaults — branchName was not a JSON wrapper.
    wrapper.branch = row.branchName;
  }
  return {
    id: row.id,
    branch: wrapper.branch,
    project: row.projectId ?? "",
    url: row.previewUrl,
    status: row.status as PreviewBranch["status"],
    commit: wrapper.commit,
    createdAt: wrapper.createdAt,
    expiresAt: wrapper.expiresAt,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.previewBranch.count();
    if (count === 0) {
      await db.previewBranch.createMany({
        data: SEED_PREVIEWS.map(toDbRow),
      });
      log.info("Preview branches seeded", { count: SEED_PREVIEWS.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all preview branches. Cached. */
export async function listPreviews(): Promise<PreviewBranch[]> {
  return cacheWrap(
    LIST_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.previewBranch.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(toDomain);
    },
    CACHE_TTL.previewList,
  );
}

/** Get a single preview by id. Cached. Throws 404 if missing. */
export async function getPreviewById(id: string): Promise<PreviewBranch> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.previewBranch.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Preview '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.previewDetail,
  );
}

/** Create a new preview branch deployment. Invalidates list cache. */
export async function createPreview(input: {
  branch: string;
  project: string;
  commit?: string;
}): Promise<PreviewBranch> {
  await seedIfEmpty();
  const id = `preview-${randomUUID()}`;
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const slug = input.branch.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const preview: PreviewBranch = {
    id,
    branch: input.branch,
    project: input.project,
    url: `https://preview-${input.project}-${slug}.roycss.cloud`,
    status: "building",
    commit: input.commit ?? randomUUID().slice(0, 7),
    createdAt: now,
    expiresAt: expires,
  };
  await db.previewBranch.create({ data: toDbRow(preview) });
  invalidate(id);
  log.info("Preview created", { id, branch: input.branch });
  return preview;
}

/** Delete a preview branch by id. Invalidates caches. */
export async function deletePreview(id: string): Promise<void> {
  await seedIfEmpty();
  const row = await db.previewBranch.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Preview '${id}' not found`);
  await db.previewBranch.delete({ where: { id } });
  invalidate(id);
  log.info("Preview deleted", { id });
}

/** Number of previews in the store. Sync stub — real count is in DB. */
export function previewsCount(): number {
  return SEED_PREVIEWS.length;
}

/** Test-only: reset to seed. */
export function _resetPreviewForTest(): void {
  seedPromise = null;
  invalidate();
}

log.debug("Preview module loaded", { previews: SEED_PREVIEWS.length });
