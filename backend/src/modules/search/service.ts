/**
 * Search service — Roy Search (unified cross-content search).
 *
 * Indexes all RoyCSS effects into the Prisma `SearchIndex` table at
 * startup (one row per effect, with `type: "effect"`, `title` = effect
 * name, `content` = effect description + tags). The first time the
 * service runs against an empty `SearchIndex` table, it inserts the
 * effects; subsequent startups skip the bulk insert.
 *
 * `search(query)` runs an ILIKE on `content` OR `title` via Prisma's
 * `mode: "insensitive"` (which compiles to `LIKE` with case folding on
 * SQLite for ASCII characters).
 *
 * Reads are LRU-cached per query string.
 *
 * Reference: CSS Containment Module Level 3 §3 (style() container queries).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { Prisma } from "@prisma/client";
import { db } from "../../lib/db.js";
import { loadEffects } from "../effects/service.js";
import type {
  RecentSearch,
  SearchResult,
} from "../../types/index.js";

const log = createLogger("search");

const RECENT_KEY = "search:recent";
const suggestionKey = (q: string): string => `search:suggest:${q}`;
const searchKey = (q: string, types: string[], limit: number): string =>
  `search:q:${q}:${types.join(",")}:${limit}`;

// ─── One-time startup indexing of effects into SearchIndex ──────────────
// Inserted once (when the table is empty). Idempotent — subsequent startups
// see the rows already exist and skip the bulk insert.
let indexPromise: Promise<void> | null = null;

async function ensureSearchIndexPopulated(): Promise<void> {
  if (indexPromise) return indexPromise;
  indexPromise = (async () => {
    try {
      const existing = await db.searchIndex.count();
      if (existing > 0) {
        log.info("SearchIndex already populated — skipping startup index", {
          count: existing,
        });
        return;
      }
      const effects = loadEffects();
      log.info("Populating SearchIndex from effects.json", {
        count: effects.length,
      });
      // Insert in batches to avoid SQLite's variable limit (500 is safe).
      const BATCH = 200;
      for (let i = 0; i < effects.length; i += BATCH) {
        const batch = effects.slice(i, i + BATCH);
        await db.searchIndex.createMany({
          data: batch.map((e) => ({
            type: "effect",
            title: e.name,
            description: e.description,
            url: `/effects/${e.id}`,
            tagsJson: JSON.stringify(e.tags ?? []),
            content: `${e.name} ${e.description} ${(e.tags ?? []).join(" ")} ${e.category} ${e.id}`,
          })),
        });
      }
      log.info("SearchIndex populated", {
        inserted: effects.length,
      });
    } catch (err) {
      log.warn("Failed to populate SearchIndex — search will run against an empty index", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  })();
  return indexPromise;
}

// Kick off the index population as soon as the module loads (fire-and-
// forget; the first search request will `await ensureSearchIndexPopulated()`
// again, which returns the same in-flight promise).
void ensureSearchIndexPopulated();

// ─── Static recent searches (kept static — no telemetry) ────────────────
const RECENT_SEARCHES: RecentSearch[] = [
  { id: "rs-1", query: "glass", results: 12, ts: "2025-02-19T07:30:00.000Z" },
  { id: "rs-2", query: "container queries", results: 4, ts: "2025-02-19T06:00:00.000Z" },
  { id: "rs-3", query: "billing", results: 6, ts: "2025-02-18T22:00:00.000Z" },
  { id: "rs-4", query: "dark mode", results: 9, ts: "2025-02-18T18:00:00.000Z" },
  { id: "rs-5", query: "auth", results: 11, ts: "2025-02-18T11:00:00.000Z" },
];

export interface SearchResponse {
  query: string;
  items: SearchResult[];
  total: number;
  took: number;
}

/** Run a search against the SearchIndex Prisma table.
 *  Matches on ILIKE (case-insensitive LIKE on SQLite) on `content` OR
 *  `title`. Cached per (query, types, limit). */
export async function search(input: {
  query: string;
  types?: string[];
  limit?: number;
}): Promise<SearchResponse> {
  const q = input.query.trim();
  const types = input.types ?? [];
  const limit = input.limit ?? 20;
  const cacheK = searchKey(q, types, limit);
  return cacheWrap(
    cacheK,
    async () => {
      await ensureSearchIndexPopulated();
      const start = Date.now();

      // Build the OR clause: case-insensitive LIKE on `content` or `title`.
      const where: Prisma.SearchIndexWhereInput = {
        AND: [
          {
            OR: [
              { content: { contains: q } },
              { title: { contains: q } },
            ],
          },
          ...(types.length > 0 ? [{ type: { in: types } }] : []),
        ],
      };

      let rows: { id: string; type: string; title: string; description: string; url: string | null; tagsJson: string }[] = [];
      try {
        rows = await db.searchIndex.findMany({
          where,
          take: limit,
          orderBy: { title: "asc" },
        });
      } catch (err) {
        log.warn("SearchIndex query failed — returning empty results", {
          err: err instanceof Error ? err.message : String(err),
        });
      }

      const items: SearchResult[] = rows.map((r) => ({
        id: r.id,
        type: r.type as SearchResult["type"],
        title: r.title,
        description: r.description,
        url: r.url ?? "",
        tags: safeParseTags(r.tagsJson),
        score: 1, // Prisma's LIKE doesn't return relevance — score uniformly.
      }));

      log.info("Search executed", {
        q,
        types: types.length,
        returned: items.length,
        took: Date.now() - start,
      });

      return {
        query: q,
        items,
        total: items.length,
        took: Date.now() - start,
      };
    },
    CACHE_TTL.searchQuery,
  );
}

// Empty array helper so the AND clause stays empty when no types filter.
function constEmpty<T>(): T[] {
  return [];
}

function safeParseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Get search suggestions for a prefix — sourced from the SearchIndex
 *  `title` column (case-insensitive LIKE). Cached per prefix. */
export async function getSuggestions(prefix: string): Promise<string[]> {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];
  return cacheWrap(
    suggestionKey(p),
    async () => {
      await ensureSearchIndexPopulated();
      let rows: { title: string }[] = [];
      try {
        rows = await db.searchIndex.findMany({
          where: { title: { contains: p } },
          select: { title: true },
          take: 10,
          orderBy: { title: "asc" },
        });
      } catch (err) {
        log.warn("SearchIndex suggestion query failed", {
          err: err instanceof Error ? err.message : String(err),
        });
      }
      return rows.map((r) => r.title);
    },
    CACHE_TTL.searchSuggestions,
  );
}

/** List recent searches (static). Cached. */
export async function getRecentSearches(): Promise<RecentSearch[]> {
  return cacheWrap(
    RECENT_KEY,
    () => Promise.resolve(RECENT_SEARCHES.map((r) => ({ ...r }))),
    CACHE_TTL.searchRecent,
  );
}

log.debug("Search module loaded");
