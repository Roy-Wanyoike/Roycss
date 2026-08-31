/**
 * Effects service — reads effect metadata from dist/effects.json.
 *
 * The backend is intentionally decoupled from the RoyCSS TypeScript
 * source: it reads a JSON file produced by `bun run scripts/build-package.ts`
 * in the parent project. This keeps the backend self-contained and
 * lets the effects data update without rebuilding the backend.
 *
 * If the file is missing or unreadable, the service degrades to an
 * empty dataset and logs a warning — the server still starts and
 * every endpoint returns a clear empty result rather than crashing.
 *
 * All responses are LRU-cached with TTLs from constants.CACHE_TTL.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { z } from "zod";

import { CACHE_TTL, EFFECTS_DATA_PATH, PAGINATION } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { Effect, Paginated } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import {
  EffectSchema,
  ListEffectsQuerySchema,
  SearchEffectsQuerySchema,
  type EffectCategory,
  type EffectDTO,
  type PreviewType,
} from "./schema.js";

const log = createLogger("effects");

const __dirname = dirname(fileURLToPath(import.meta.url));
// src/modules/effects/service.ts → ../../.. = backend root
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");

let cachedEffects: Effect[] | null = null;
let cachedCategories: EffectCategory[] = [];
let cachedTags: string[] = [];

/**
 * Load + validate the effects JSON file.
 * Cached in memory after first load.
 */
export function loadEffects(): Effect[] {
  if (cachedEffects) return cachedEffects;

  const absPath = resolve(BACKEND_ROOT, EFFECTS_DATA_PATH);
  log.info("Loading effects data", { path: absPath });

  let raw: string;
  try {
    raw = readFileSync(absPath, "utf-8");
  } catch (err) {
    log.error(
      "Failed to read effects data file — running with empty dataset",
      {
        path: absPath,
        err: err instanceof Error ? err.message : String(err),
      },
    );
    cachedEffects = [];
    cachedCategories = [];
    cachedTags = [];
    return cachedEffects;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log.error("Effects JSON is malformed — running with empty dataset", {
      path: absPath,
      err: err instanceof Error ? err.message : String(err),
    });
    cachedEffects = [];
    return cachedEffects;
  }

  const arrayResult = EffectSchema.array().safeParse(parsed);
  if (!arrayResult.success) {
    log.error("Effects JSON failed schema validation", {
      path: absPath,
      issueCount: arrayResult.error.issues.length,
      firstIssue: arrayResult.error.issues[0],
    });
    cachedEffects = [];
    return cachedEffects;
  }

  cachedEffects = arrayResult.data as Effect[];
  cachedCategories = Array.from(
    new Set(cachedEffects.map((e) => e.category)),
  ) as EffectCategory[];
  cachedTags = Array.from(
    new Set(cachedEffects.flatMap((e) => e.tags ?? [])),
  ).sort();

  log.info("Effects data loaded", {
    count: cachedEffects.length,
    categories: cachedCategories.length,
    tags: cachedTags.length,
  });

  return cachedEffects;
}

/** Get a single effect by id. Cached. Throws 404 if missing. */
export async function getEffectById(id: string): Promise<Effect> {
  const cacheKey = `effect:${id}`;
  return cacheWrap(
    cacheKey,
    () => {
      const all = loadEffects();
      const found = all.find((e) => e.id === id);
      if (!found) {
        throw AppError.notFound(`Effect '${id}' not found`);
      }
      return found;
    },
    CACHE_TTL.effectDetail,
  );
}

export type ListEffectsInput = z.infer<typeof ListEffectsQuerySchema>;
export type SearchEffectsInput = z.infer<typeof SearchEffectsQuerySchema>;

/** List effects with optional filtering + pagination. Cached. */
export async function listEffects(
  input: ListEffectsInput,
): Promise<Paginated<Effect>> {
  const cacheKey = `effects:list:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const all = loadEffects();
      let filtered = all;

      if (input.category) {
        filtered = filtered.filter((e) => e.category === input.category);
      }
      if (input.tag) {
        filtered = filtered.filter((e) => e.tags?.includes(input.tag!));
      }
      if (input.previewType) {
        filtered = filtered.filter(
          (e) => e.previewType === input.previewType,
        );
      }

      filtered = sortEffects(filtered, input.sort);

      return paginate(filtered, input.page, input.limit);
    },
    CACHE_TTL.effectsList,
  );
}

/** Full-text-ish search across name, description, tags, category. Cached. */
export async function searchEffects(
  input: SearchEffectsInput,
): Promise<Paginated<Effect>> {
  const cacheKey = `effects:search:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const all = loadEffects();
      const q = input.q.toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);

      let scored = all
        .map((e) => {
          const haystack = (
            e.name +
            " " +
            e.description +
            " " +
            e.category +
            " " +
            (e.tags ?? []).join(" ")
          ).toLowerCase();

          let score = 0;
          for (const term of terms) {
            if (e.name.toLowerCase().includes(term)) score += 10;
            if (e.id.toLowerCase().includes(term)) score += 8;
            if (haystack.includes(term)) score += 1;
            if ((e.tags ?? []).some((t) => t.toLowerCase() === term)) {
              score += 5;
            }
          }
          return { e, score };
        })
        .filter((s) => s.score > 0);

      if (input.category) {
        scored = scored.filter((s) => s.e.category === input.category);
      }

      scored.sort((a, b) => b.score - a.score);
      const filtered = scored.map((s) => s.e);

      return paginate(filtered, input.page, input.limit);
    },
    CACHE_TTL.effectsList,
  );
}

/** Return distinct categories present in the dataset. */
export function listCategories(): EffectCategory[] {
  loadEffects();
  return cachedCategories;
}

/** Return distinct tags present in the dataset. */
export function listTags(): string[] {
  loadEffects();
  return cachedTags;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function sortEffects(
  effects: Effect[],
  sort: "name" | "name-desc" | "category" | "id",
): Effect[] {
  const arr = [...effects];
  switch (sort) {
    case "name":
      arr.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      arr.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "category":
      arr.sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
      );
      break;
    case "id":
    default:
      arr.sort((a, b) => a.id.localeCompare(b.id));
      break;
  }
  return arr;
}

function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): Paginated<T> {
  const safeLimit = Math.min(Math.max(limit, 1), PAGINATION.maxLimit);
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * safeLimit;
  const slice = items.slice(start, start + safeLimit);
  return {
    items: slice,
    page: safePage,
    limit: safeLimit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
  };
}

/** Number of effects loaded — useful for the health/info endpoint. */
export function effectsCount(): number {
  return loadEffects().length;
}

export type { EffectDTO, EffectCategory, PreviewType };
