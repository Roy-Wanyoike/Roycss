/**
 * Embedded read-only API — the public `/api/v1` catalog surface, served
 * directly from the embedded effect catalog (no external backend).
 *
 * Issue #83: production had `/api/v1/*` hard-wired to a dead `BACKEND_URL`
 * (vercel.json baked `https://roycss.onrender.com`), so every API call on
 * Vercel returned 503. This module implements the documented public
 * read-only surface (API.md — no drift) from data the Next.js site already
 * ships:
 *
 *   GET /api/v1                      → static route index
 *   GET /api/v1/health               → service health (embedded flavor)
 *   GET /api/v1/effects              → list + filter + paginate + sort
 *   GET /api/v1/effects/search       → scored search
 *   GET /api/v1/effects/categories   → distinct categories
 *   GET /api/v1/effects/tags         → distinct tags
 *   GET /api/v1/effects/:id          → single effect
 *   GET /api/v1/recipes              → list + filter + paginate
 *   GET /api/v1/recipes/:id          → single recipe
 *   GET /api/v1/patterns             → list + filter + paginate
 *   GET /api/v1/patterns/:id         → single pattern
 *
 * Everything the catalog cannot serve (auth, themes, search index, …) is
 * deliberately NOT embedded — the gateway answers those with
 * `503 { error: { code: "EMBEDDED_MODE_UNSUPPORTED" } }` and self-hosted
 * deployments keep them via proxy mode.
 *
 * Contract parity: schemas, filter/sort/search semantics, pagination math,
 * envelopes and error shapes mirror `backend-node/src/modules/{effects,
 * recipes,patterns}` and `backend-node/src/server/middleware/{validate,
 * error}.ts` — see each "mirror" comment below.
 *
 * This module is pure: no Next.js imports, no I/O. Unit tests import the
 * handler directly (tests/unit/embedded-api.test.ts).
 */

import { z } from "zod";

import { effects, type CSSEffect, type EffectCategory, type PreviewType } from "./roycss-effects";
import { recipes, type Recipe } from "./roycss-recipes";
import { patterns, type Pattern } from "./roycss-patterns";
import { EMBEDDED_SERVICE_NAME } from "./api-mode";

// ─── Response contract types ────────────────────────────────────────────────

export interface EmbeddedApiResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

/** Error envelope — mirrors backend `ErrorResponseBody`. */
export interface EmbeddedApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

/** Operational error — mirrors backend `AppError`. */
export class EmbeddedApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "EmbeddedApiError";
  }
}

/** Request id — mirrors backend `generateRequestId()` (12–16 chars). */
function generateRequestId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(16).slice(2, 10)
  ).slice(0, 16);
}

// ─── Zod schemas — mirrors of the backend module schemas ────────────────────

// mirror of backend-node/src/modules/effects/schema.ts (EffectCategoryEnum)
const EFFECT_CATEGORIES = [
  "animations",
  "hover",
  "text",
  "backgrounds",
  "loaders",
  "3d-transforms",
  "buttons",
  "cards",
  "borders",
  "filters",
  "forms",
  "navigation",
  "scroll",
  "cursor",
  "page-transitions",
  "glass-ui",
  "particles",
  "microinteractions",
  "visual",
  "misc",
  "advanced-text",
  "audio",
  "data-viz",
  "immersive",
  "liquid",
  "morphing",
  "physics",
  "retro",
  "status-state",
] as const;

// mirror of backend-node/src/modules/effects/schema.ts (PreviewTypeEnum)
const PREVIEW_TYPES = [
  "box",
  "text",
  "button",
  "loader",
  "card",
  "background",
] as const;

// mirror of backend-node/src/config/constants.ts (PAGINATION)
const PAGINATION = { defaultLimit: 24, maxLimit: 200 } as const;

const ListEffectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(PAGINATION.defaultLimit),
  category: z.enum(EFFECT_CATEGORIES).optional(),
  tag: z.string().optional(),
  previewType: z.enum(PREVIEW_TYPES).optional(),
  sort: z.enum(["name", "name-desc", "category", "id"]).optional().default("id"),
});

const SearchEffectsQuerySchema = z.object({
  q: z.string().min(1, "Search query (q) is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(PAGINATION.defaultLimit),
  category: z.enum(EFFECT_CATEGORIES).optional(),
});

const IdParamSchema = z.object({ id: z.string().min(1) });

// mirror of backend-node/src/modules/recipes/schema.ts
const RECIPE_CATEGORIES = [
  "hero-sections",
  "loading-states",
  "cards",
  "navigation",
  "forms",
  "notifications",
  "empty-states",
  "buttons",
] as const;

const ListRecipesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(PAGINATION.defaultLimit),
  category: z.enum(RECIPE_CATEGORIES).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tag: z.string().optional(),
});

// mirror of backend-node/src/modules/patterns/schema.ts
const ListPatternsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(PAGINATION.defaultLimit),
  category: z.enum(["states", "feedback", "layouts"]).optional(),
  tag: z.string().optional(),
});

// ─── DTO mapping ────────────────────────────────────────────────────────────

/**
 * Wire shape of an effect — mirrors an entry of `dist/effects.json` (what
 * the backend parses and returns): metadata only, `previewText`/`childCount`
 * normalized to explicit null, and NO `cssCode`.
 */
export interface EffectDTO {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  previewType: PreviewType;
  previewText: string | null;
  childCount: number | null;
}

function toEffectDTO(e: CSSEffect): EffectDTO {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    description: e.description,
    tags: e.tags,
    previewType: e.previewType,
    previewText: e.previewText ?? null,
    childCount: e.childCount ?? null,
  };
}

const EFFECT_DTOS: EffectDTO[] = effects.map(toEffectDTO);
const EFFECT_BY_ID = new Map<string, EffectDTO>(EFFECT_DTOS.map((e) => [e.id, e]));

/** Distinct categories, first-appearance order — mirrors `loadEffects()`. */
const EFFECT_CATEGORIES_PRESENT: string[] = Array.from(
  new Set(EFFECT_DTOS.map((e) => e.category)),
);
/** Distinct tags, sorted — mirrors `loadEffects()`. */
const EFFECT_TAGS_PRESENT: string[] = Array.from(
  new Set(EFFECT_DTOS.flatMap((e) => e.tags)),
).sort();

/** Catalog size — sourced from the real catalog, never hardcoded (PF-012 F16). */
export function effectsCount(): number {
  return EFFECT_DTOS.length;
}

// ─── Effects service — mirrors backend effects service ──────────────────────

interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** mirror of backend `paginate()` (belt-and-braces clamping). */
function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const safeLimit = Math.min(Math.max(limit, 1), PAGINATION.maxLimit);
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * safeLimit;
  return {
    items: items.slice(start, start + safeLimit),
    page: safePage,
    limit: safeLimit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
  };
}

/** mirror of backend `sortEffects()`. */
function sortEffects(
  list: EffectDTO[],
  sort: "name" | "name-desc" | "category" | "id",
): EffectDTO[] {
  const arr = [...list];
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

export function listEffects(
  input: z.infer<typeof ListEffectsQuerySchema>,
): Paginated<EffectDTO> {
  let filtered = EFFECT_DTOS;
  if (input.category) filtered = filtered.filter((e) => e.category === input.category);
  if (input.tag) filtered = filtered.filter((e) => e.tags.includes(input.tag!));
  if (input.previewType) filtered = filtered.filter((e) => e.previewType === input.previewType);
  return paginate(sortEffects(filtered, input.sort), input.page, input.limit);
}

/** mirror of backend `searchEffects()` scoring. */
export function searchEffects(
  input: z.infer<typeof SearchEffectsQuerySchema>,
): Paginated<EffectDTO> {
  const q = input.q.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  let scored = EFFECT_DTOS.map((e) => {
    const haystack = (
      e.name + " " + e.description + " " + e.category + " " + e.tags.join(" ")
    ).toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (e.name.toLowerCase().includes(term)) score += 10;
      if (e.id.toLowerCase().includes(term)) score += 8;
      if (haystack.includes(term)) score += 1;
      if (e.tags.some((t) => t.toLowerCase() === term)) score += 5;
    }
    return { e, score };
  }).filter((s) => s.score > 0);

  if (input.category) scored = scored.filter((s) => s.e.category === input.category);

  scored.sort((a, b) => b.score - a.score);
  return paginate(
    scored.map((s) => s.e),
    input.page,
    input.limit,
  );
}

export function getEffectById(id: string): EffectDTO {
  const found = EFFECT_BY_ID.get(id);
  if (!found) throw new EmbeddedApiError("NOT_FOUND", `Effect '${id}' not found`, 404);
  return found;
}

export function listEffectCategories(): string[] {
  return EFFECT_CATEGORIES_PRESENT;
}

export function listEffectTags(): string[] {
  return EFFECT_TAGS_PRESENT;
}

// ─── Recipes / patterns services — mirror backend snapshots ─────────────────

export function listRecipes(
  input: z.infer<typeof ListRecipesQuerySchema>,
): Paginated<Recipe> {
  let filtered = recipes;
  if (input.category) filtered = filtered.filter((r) => r.category === input.category);
  if (input.difficulty) filtered = filtered.filter((r) => r.difficulty === input.difficulty);
  if (input.tag) filtered = filtered.filter((r) => r.tags.includes(input.tag!));
  return paginate(filtered, input.page, input.limit);
}

export function getRecipeById(id: string): Recipe {
  const found = recipes.find((r) => r.id === id);
  if (!found) throw new EmbeddedApiError("NOT_FOUND", `Recipe '${id}' not found`, 404);
  return found;
}

export function listPatterns(
  input: z.infer<typeof ListPatternsQuerySchema>,
): Paginated<Pattern> {
  let filtered = patterns;
  if (input.category) filtered = filtered.filter((p) => p.category === input.category);
  if (input.tag) filtered = filtered.filter((p) => p.tags.includes(input.tag!));
  return paginate(filtered, input.page, input.limit);
}

export function getPatternById(id: string): Pattern {
  const found = patterns.find((p) => p.id === id);
  if (!found) throw new EmbeddedApiError("NOT_FOUND", `Pattern '${id}' not found`, 404);
  return found;
}

// ─── Health + index — mirrors backend health/index shapes ───────────────────

const STARTED_AT = Date.now();

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

/**
 * Embedded `/api/v1/health` — same shape as the backend health route
 * (`{ status, service, version, uptime, time, checks }`) with no database
 * dependency to report. `service` doubles as the "this is an embedded
 * instance, not a backend" marker used by the auto-mode probe.
 */
export function embeddedHealth(): Record<string, unknown> {
  const uptimeMs = Date.now() - STARTED_AT;
  const mem = process.memoryUsage();
  const toMb = (b: number): number => Math.round((b / 1024 / 1024) * 100) / 100;
  return {
    status: "ok",
    service: EMBEDDED_SERVICE_NAME,
    version: "1.0.0",
    uptime: {
      ms: uptimeMs,
      seconds: Math.floor(uptimeMs / 1000),
      human: formatUptime(uptimeMs),
    },
    time: new Date().toISOString(),
    checks: {
      database: "embedded",
      memory: {
        rssMb: toMb(mem.rss),
        heapUsedMb: toMb(mem.heapUsed),
        heapTotalMb: toMb(mem.heapTotal),
      },
    },
  };
}

/** Static route index — mirrors the backend root endpoint shape. */
export function embeddedApiIndex(): Record<string, unknown> {
  return {
    name: EMBEDDED_SERVICE_NAME,
    version: "1.0.0",
    endpoints: [
      "GET    /api/v1/health",
      "GET    /api/v1/effects",
      "GET    /api/v1/effects/search",
      "GET    /api/v1/effects/categories",
      "GET    /api/v1/effects/tags",
      "GET    /api/v1/effects/:id",
      "GET    /api/v1/recipes",
      "GET    /api/v1/recipes/:id",
      "GET    /api/v1/patterns",
      "GET    /api/v1/patterns/:id",
    ],
  };
}

// ─── Request dispatch ────────────────────────────────────────────────────────

export interface EmbeddedApiRequest {
  /** HTTP method, e.g. "GET". */
  method: string;
  /** Sub-path after `/api/v1` ("" for the index, "/effects" etc.). */
  path: string;
  /** Query params. */
  search: URLSearchParams | Record<string, string>;
}

function toRecord(search: URLSearchParams | Record<string, string>): Record<string, string> {
  return search instanceof URLSearchParams
    ? Object.fromEntries(search.entries())
    : search;
}

/** Decode one path segment; malformed escapes pass through raw. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Validation error — mirrors backend `validateQuery` + `AppError.validation`. */
function validationError(target: "query" | "params", err: z.ZodError): EmbeddedApiError {
  const details = err.issues.map((i) => ({
    target,
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
  return new EmbeddedApiError("VALIDATION_ERROR", "Request validation failed", 400, details);
}

/** Parse+validate a query schema (throws the mirrored 400 on failure). */
function parseQuery<T>(schema: z.ZodType<T>, search: Record<string, string>): T {
  const result = schema.safeParse(search);
  if (!result.success) throw validationError("query", result.error);
  return result.data;
}

/** Validate an :id path segment (throws the mirrored 400 on failure). */
function parseId(id: string): string {
  const result = IdParamSchema.safeParse({ id });
  if (!result.success) throw validationError("params", result.error);
  return result.data.id;
}

function notFoundRoute(method: string, path: string, search: string): EmbeddedApiError {
  const url = search ? `${path}?${search}` : path;
  return new EmbeddedApiError(
    "NOT_FOUND",
    `Route not found: ${method.toUpperCase()} /api/v1${url}`,
    404,
  );
}

function embeddedUnsupported(method: string, path: string): EmbeddedApiError {
  return new EmbeddedApiError(
    "EMBEDDED_MODE_UNSUPPORTED",
    `Endpoint ${method.toUpperCase()} /api/v1${path} is not available in embedded API mode ` +
      `(the embedded API serves read-only catalog data only). ` +
      `Set BACKEND_URL and API_MODE=auto|proxy to enable the full backend.`,
    503,
  );
}

/**
 * Handle a `/api/v1*` request entirely from the embedded catalog.
 *
 * Synchronous and side-effect free (beyond Date/Math.random for request ids)
 * — the gateway route handler wraps the result in a NextResponse.
 */
export function handleEmbeddedApi(req: EmbeddedApiRequest): EmbeddedApiResponse {
  const requestId = generateRequestId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
  };

  const respond = (status: number, body: unknown): EmbeddedApiResponse => ({
    status,
    body,
    headers,
  });

  const errorBody = (err: EmbeddedApiError): EmbeddedApiErrorBody => ({
    error: {
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    },
    requestId,
  });

  try {
    const method = req.method.toUpperCase();

    // CORS preflight for same-origin API consumers — the proxy path forwards
    // OPTIONS to the backend; embedded mode answers directly.
    if (method === "OPTIONS") {
      return {
        status: 204,
        body: null,
        headers: {
          ...headers,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Expose-Headers": "X-Request-Id",
        },
      };
    }

    // Embedded mode is strictly read-only (issue #83: DB-backed endpoints
    // stay proxy-only and must fail loudly, not silently masquerade).
    if (method !== "GET") {
      throw embeddedUnsupported(method, req.path);
    }

    const segments = req.path.split("/").filter(Boolean).map(decodeSegment);
    const search = toRecord(req.search);
    const rawSearch =
      req.search instanceof URLSearchParams ? req.search.toString() : "";

    // GET /api/v1 — index
    if (segments.length === 0) {
      return respond(200, embeddedApiIndex());
    }

    const [moduleName, ...rest] = segments;

    switch (moduleName) {
      case "health": {
        if (rest.length > 0) throw notFoundRoute(method, req.path, rawSearch);
        return respond(200, embeddedHealth());
      }

      case "effects": {
        const [sub, ...deep] = rest;
        if (deep.length > 0) throw notFoundRoute(method, req.path, rawSearch);
        switch (sub) {
          case undefined: {
            // GET /effects — list (route order mirrors the backend: /search,
            // /categories, /tags are matched before /:id)
            const input = parseQuery(ListEffectsQuerySchema, search);
            const result = listEffects(input);
            return respond(200, {
              data: result.items,
              meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
              },
            });
          }
          case "search": {
            const input = parseQuery(SearchEffectsQuerySchema, search);
            const result = searchEffects(input);
            return respond(200, {
              data: result.items,
              meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                query: input.q,
              },
            });
          }
          case "categories": {
            const categories = listEffectCategories();
            return respond(200, { data: categories, meta: { count: categories.length } });
          }
          case "tags": {
            const tags = listEffectTags();
            return respond(200, { data: tags, meta: { count: tags.length } });
          }
          default: {
            const id = parseId(sub);
            return respond(200, { data: getEffectById(id) });
          }
        }
      }

      case "recipes": {
        const [sub, ...deep] = rest;
        if (deep.length > 0) throw notFoundRoute(method, req.path, rawSearch);
        if (sub === undefined) {
          const input = parseQuery(ListRecipesQuerySchema, search);
          const result = listRecipes(input);
          return respond(200, {
            data: result.items,
            meta: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            },
          });
        }
        return respond(200, { data: getRecipeById(parseId(sub)) });
      }

      case "patterns": {
        const [sub, ...deep] = rest;
        if (deep.length > 0) throw notFoundRoute(method, req.path, rawSearch);
        if (sub === undefined) {
          const input = parseQuery(ListPatternsQuerySchema, search);
          const result = listPatterns(input);
          return respond(200, {
            data: result.items,
            meta: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            },
          });
        }
        return respond(200, { data: getPatternById(parseId(sub)) });
      }

      default:
        // A documented backend module the embedded catalog cannot serve
        // (auth, themes, search, …) — clear 503, never a fake response.
        throw embeddedUnsupported(method, req.path);
    }
  } catch (err) {
    if (err instanceof EmbeddedApiError) {
      return respond(err.statusCode, errorBody(err));
    }
    // Unexpected programmer error — mirror the backend's 500 envelope.
    return respond(500, {
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      requestId,
    });
  }
}

export type { CSSEffect, Recipe, Pattern };
