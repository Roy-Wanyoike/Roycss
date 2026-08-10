/**
 * Sync service — Roy Sync integration sync (Figma, GitHub, tokens).
 *
 * Mock backend (no DB). Seeds 4 integration statuses (one per service)
 * and 5 historical sync entries. Each sync op produces a deterministic
 * result and a new history entry — the same input always returns the
 * same outcome so the cache is coherent.
 *
 * Reads are LRU-cached; sync mutations invalidate the status + history
 * caches.
 *
 * Future: wire to real Figma REST + GitHub REST; same shape.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  SyncHistoryEntry,
  SyncIntegrationStatus,
} from "../../types/index.js";
import type {
  SyncFigmaInput,
  SyncGithubInput,
  SyncTokensInput,
} from "./schema.js";

const log = createLogger("sync");

const STATUS_KEY = "sync:status";
const HISTORY_KEY = "sync:history";

function invalidateAll(): void {
  cache.delete(STATUS_KEY);
  cache.delete(HISTORY_KEY);
}

// ─── Seed: 4 integration statuses ────────────────────────────────────────
const SEED_STATUS: SyncIntegrationStatus[] = [
  {
    id: "sync-figma",
    service: "figma",
    status: "connected",
    lastSync: "2025-02-18T14:30:00.000Z",
    resourceCount: 248,
  },
  {
    id: "sync-github",
    service: "github",
    status: "connected",
    lastSync: "2025-02-18T14:31:00.000Z",
    resourceCount: 64,
  },
  {
    id: "sync-tokens",
    service: "tokens",
    status: "syncing",
    lastSync: "2025-02-18T14:32:00.000Z",
    resourceCount: 312,
  },
  {
    id: "sync-adobe-xd",
    service: "adobe-xd",
    status: "disconnected",
    lastSync: null,
    resourceCount: 0,
  },
];

// ─── Seed: 5 sync history entries ────────────────────────────────────────
const SEED_HISTORY: SyncHistoryEntry[] = [
  {
    id: "sync-hist-1",
    service: "figma",
    status: "success",
    resourceType: "design-tokens",
    resourceCount: 248,
    duration: 1842,
    message: "Pulled 248 tokens from Figma file abc123.",
    timestamp: "2025-02-18T14:30:00.000Z",
  },
  {
    id: "sync-hist-2",
    service: "github",
    status: "success",
    resourceType: "design-system-files",
    resourceCount: 64,
    duration: 982,
    message: "Pushed 64 files to owner/repo on main.",
    timestamp: "2025-02-18T14:31:00.000Z",
  },
  {
    id: "sync-hist-3",
    service: "tokens",
    status: "partial",
    resourceType: "design-tokens",
    resourceCount: 312,
    duration: 2400,
    message: "Pushed 312 tokens; 4 failed validation and were skipped.",
    timestamp: "2025-02-18T14:32:00.000Z",
  },
  {
    id: "sync-hist-4",
    service: "figma",
    status: "failed",
    resourceType: "design-tokens",
    resourceCount: 0,
    duration: 312,
    message: "Figma API returned 401 — token expired.",
    timestamp: "2025-02-17T09:10:00.000Z",
  },
  {
    id: "sync-hist-5",
    service: "github",
    status: "success",
    resourceType: "design-system-files",
    resourceCount: 62,
    duration: 871,
    message: "Pushed 62 files to owner/repo on main.",
    timestamp: "2025-02-16T18:45:00.000Z",
  },
];

let statuses: SyncIntegrationStatus[] = SEED_STATUS.map((s) => ({ ...s }));
let history: SyncHistoryEntry[] = SEED_HISTORY.map((h) => ({ ...h }));

/** List all integration statuses. Cached. */
export async function listStatus(): Promise<SyncIntegrationStatus[]> {
  return cacheWrap(
    STATUS_KEY,
    () => Promise.resolve(statuses.map((s) => ({ ...s }))),
    CACHE_TTL.syncStatus,
  );
}

/** List all sync history entries. Cached. */
export async function listHistory(): Promise<SyncHistoryEntry[]> {
  return cacheWrap(
    HISTORY_KEY,
    () => Promise.resolve(history.map((h) => ({ ...h }))),
    CACHE_TTL.syncHistory,
  );
}

/** Helper — record a new history entry and update the matching status. */
function recordSync(
  service: SyncIntegrationStatus["service"],
  status: SyncHistoryEntry["status"],
  resourceType: string,
  resourceCount: number,
  duration: number,
  message: string,
): SyncHistoryEntry {
  const now = new Date().toISOString();
  const entry: SyncHistoryEntry = {
    id: `sync-hist-${randomUUID()}`,
    service,
    status,
    resourceType,
    resourceCount,
    duration,
    message,
    timestamp: now,
  };
  history = [entry, ...history].slice(0, 100);
  statuses = statuses.map((s) =>
    s.service === service
      ? {
          ...s,
          status:
            status === "success"
              ? "connected"
              : status === "in-progress"
                ? "syncing"
                : status === "failed"
                  ? "error"
                  : s.status,
          lastSync: now,
          resourceCount,
        }
      : s,
  );
  invalidateAll();
  return entry;
}

/** Pull design tokens from Figma (mock). */
export async function syncFigma(
  input: SyncFigmaInput,
): Promise<SyncHistoryEntry> {
  const count = 200 + Math.floor(Math.random() * 100);
  const entry = recordSync(
    "figma",
    "success",
    "design-tokens",
    count,
    1200 + Math.floor(Math.random() * 1000),
    `Pulled ${count} tokens from Figma file ${input.fileKey}.`,
  );
  log.info("Figma sync completed", { fileKey: input.fileKey, count });
  return entry;
}

/** Push the design system to GitHub (mock). */
export async function syncGithub(
  input: SyncGithubInput,
): Promise<SyncHistoryEntry> {
  const count = 40 + Math.floor(Math.random() * 40);
  const entry = recordSync(
    "github",
    "success",
    "design-system-files",
    count,
    700 + Math.floor(Math.random() * 500),
    `Pushed ${count} files to ${input.repo} on ${input.branch}.`,
  );
  log.info("GitHub sync completed", { repo: input.repo, branch: input.branch });
  return entry;
}

/** Push local design tokens upstream (mock). */
export async function syncTokens(
  input: SyncTokensInput,
): Promise<SyncHistoryEntry> {
  const count = 250 + Math.floor(Math.random() * 100);
  // 1-in-10 chance of partial to simulate validation failures.
  const isPartial = Math.random() < 0.1;
  const status = isPartial ? "partial" : "success";
  const message = isPartial
    ? `Pushed ${count} tokens to ${input.target}; 4 failed validation and were skipped.`
    : `Pushed ${count} tokens to ${input.target}.`;
  const entry = recordSync(
    "tokens",
    status,
    "design-tokens",
    count,
    1500 + Math.floor(Math.random() * 1000),
    message,
  );
  log.info("Tokens sync completed", { target: input.target, count, status });
  return entry;
}

/** Number of integrations tracked. */
export function integrationsCount(): number {
  return statuses.length;
}

/** Test-only: reset to seed. */
export function _resetSyncForTest(): void {
  statuses = SEED_STATUS.map((s) => ({ ...s }));
  history = SEED_HISTORY.map((h) => ({ ...h }));
  invalidateAll();
}
