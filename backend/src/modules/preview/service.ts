/**
 * Preview service — in-memory Roy Preview branch deployment store.
 *
 * Mock backend (no DB). Seeds 4 preview branches with URLs and status.
 * All reads are LRU-cached; creating or deleting a preview invalidates
 * the list cache.
 *
 * Future: swap the in-memory array for a Prisma `PreviewBranch` model
 * backed by webhook events from the hosting platform.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

let previews: PreviewBranch[] = SEED_PREVIEWS.map((p) => ({ ...p }));

/** List all preview branches. Cached. */
export async function listPreviews(): Promise<PreviewBranch[]> {
  return cacheWrap(
    LIST_KEY,
    () => Promise.resolve(previews.map((p) => ({ ...p }))),
    CACHE_TTL.previewList,
  );
}

/** Get a single preview by id. Cached. Throws 404 if missing. */
export async function getPreviewById(id: string): Promise<PreviewBranch> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = previews.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Preview '${id}' not found`);
      return Promise.resolve({ ...found });
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
  previews.push(preview);
  invalidate(id);
  log.info("Preview created", { id, branch: input.branch });
  return preview;
}

/** Delete a preview branch by id. Invalidates caches. */
export async function deletePreview(id: string): Promise<void> {
  const before = previews.length;
  previews = previews.filter((p) => p.id !== id);
  if (previews.length === before) {
    throw AppError.notFound(`Preview '${id}' not found`);
  }
  invalidate(id);
  log.info("Preview deleted", { id });
}

/** Number of previews in the store. */
export function previewsCount(): number {
  return previews.length;
}

/** Test-only: reset to seed. */
export function _resetPreviewForTest(): void {
  previews = SEED_PREVIEWS.map((p) => ({ ...p }));
  invalidate();
}

log.debug("Preview module loaded", { previews: SEED_PREVIEWS.length });
