/**
 * Registry catalog — the single source of truth for RoyCSS framework
 * content items (PF-009 / issue #94, item A1).
 *
 * Every "content" module (effects, pro-components, patterns, themes,
 * devtools design tokens, icons, motion) registers its dataset here and
 * delegates its read paths through this catalog, so there is exactly ONE
 * code path for resolving framework content by slug:
 *
 *   module service read → catalog.getItemData / listItemData
 *                          → registered ItemSource (module-owned loader)
 *
 * The catalog never imports the content modules — the modules import the
 * catalog and register themselves at module-load time (app.ts imports
 * every module router, so all sources are registered before the first
 * request). This keeps the dependency graph acyclic.
 *
 * On top of raw item data, the catalog exposes the canonical
 * `RegistryItem` shape consumed by `GET /api/v1/registry/resolve/:slug`:
 * type, slug, name, description, `version` + `latestVersion` stamps, and
 * the raw item under `data`.
 *
 * Version stamping is deterministic (a static per-type table mirroring
 * the @roycss/* package seeds) so responses, tests, and the OpenAPI
 * artifact never drift.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("registry:catalog");

// ─── Types ────────────────────────────────────────────────────────────────

/** The framework content types owned by the registry. */
export const REGISTRY_ITEM_TYPES = [
  "effect",
  "component",
  "pattern",
  "theme",
  "token",
  "icon",
  "motion",
] as const;

export type RegistryItemType = (typeof REGISTRY_ITEM_TYPES)[number];

/**
 * Canonical registry item — the envelope returned by
 * `GET /api/v1/registry/resolve/:slug`. `data` carries the raw domain
 * object owned by the source module (Effect, Pattern, Theme, …).
 */
export interface RegistryItem<T = unknown> {
  type: RegistryItemType;
  slug: string;
  name: string | null;
  description: string | null;
  /** Semver of the packaged item (deterministic per type). */
  version: string;
  /** Latest published semver (may be ahead of `version`). */
  latestVersion: string;
  updatedAt: string | null;
  data: T;
}

/**
 * A module-owned dataset. Registered once at module load via
 * `registerSource`. `list()` returns the RAW domain items (already
 * cached by the owning module, so this call is cheap).
 */
export interface ItemSource {
  /** List every raw domain item in the dataset. */
  list(): unknown[] | Promise<unknown[]>;
  /** Canonical slug for a raw item (usually `id` or `name`). */
  slugOf(item: unknown): string;
  /** Optional display name for the resolve envelope. */
  nameOf?(item: unknown): string | null;
  /** Optional description for the resolve envelope. */
  descriptionOf?(item: unknown): string | null;
  /** Optional last-updated ISO timestamp for the resolve envelope. */
  updatedAtOf?(item: unknown): string | null;
}

// ─── Version stamping (deterministic) ─────────────────────────────────────

/**
 * Per-type version stamps. Values mirror the @roycss/* package seeds in
 * the registry module so package versions and content versions tell one
 * coherent story. Deterministic by design — no clock, no randomness.
 */
const TYPE_VERSIONS: Record<RegistryItemType, { version: string; latestVersion: string }> = {
  effect: { version: "2.0.0", latestVersion: "2.1.0" },
  component: { version: "1.0.0", latestVersion: "1.1.0" },
  pattern: { version: "1.0.0", latestVersion: "1.2.0" },
  theme: { version: "2.0.0", latestVersion: "2.0.4" },
  token: { version: "2.0.0", latestVersion: "2.0.2" },
  icon: { version: "1.0.0", latestVersion: "1.1.0" },
  motion: { version: "1.4.0", latestVersion: "1.5.0" },
};

/** Version stamp for a (type, slug) pair. Deterministic. */
export function versionFor(
  type: RegistryItemType,
  _slug: string,
): { version: string; latestVersion: string } {
  return { ...TYPE_VERSIONS[type] };
}

// ─── Source registry ──────────────────────────────────────────────────────

const sources = new Map<RegistryItemType, ItemSource>();

/**
 * Register the dataset for a content type. Called at module load by the
 * owning module's service (idempotent — a re-registration replaces the
 * source, which keeps vitest module re-imports well-behaved).
 */
export function registerSource(
  type: RegistryItemType,
  source: ItemSource,
): void {
  sources.set(type, source);
  // The list cache may hold items from a previous source instance.
  cache.delete(listKey(type));
  log.debug("Registry source registered", { type });
}

/** Types that currently have a registered source. */
export function registeredTypes(): RegistryItemType[] {
  return REGISTRY_ITEM_TYPES.filter((t) => sources.has(t));
}

function requireSource(type: RegistryItemType): ItemSource {
  const source = sources.get(type);
  if (!source) {
    throw AppError.serviceUnavailable(
      `No registry source registered for type '${type}'`,
      { hint: "The owning module must be imported before it can serve items" },
    );
  }
  return source;
}

// ─── Cache keys ───────────────────────────────────────────────────────────

const listKey = (type: RegistryItemType): string => `registry:catalog:${type}`;

/**
 * Invalidate the catalog's list cache for a type (or every type).
 * Mutating modules (e.g. themes CRUD) call this so resolve/list reads
 * observe writes immediately.
 */
export function invalidateCatalog(type?: RegistryItemType): void {
  if (type) {
    cache.delete(listKey(type));
  } else {
    for (const t of REGISTRY_ITEM_TYPES) cache.delete(listKey(t));
  }
}

// ─── Raw data access (used by module service read paths) ─────────────────

/** List the RAW domain items for a type (no registry envelope). */
export async function listItemData(
  type: RegistryItemType,
): Promise<unknown[]> {
  const source = requireSource(type);
  const items = await source.list();
  return Array.isArray(items) ? items : [];
}

/**
 * Get one RAW domain item by slug, or undefined when missing. Module
 * services use this for their detail read paths and keep throwing their
 * own (envelope-preserving) 404 messages.
 */
export async function getItemData(
  type: RegistryItemType,
  slug: string,
): Promise<unknown | undefined> {
  const source = requireSource(type);
  const items = await source.list();
  if (!Array.isArray(items)) return undefined;
  return items.find((item) => source.slugOf(item) === slug);
}

// ─── Canonical resolution (resolve endpoint) ──────────────────────────────

/**
 * List canonical RegistryItems for a type. Cached with a short TTL —
 * the underlying source lists are already module-cached, so this only
 * memoizes the envelope mapping.
 */
export async function listItems(
  type: RegistryItemType,
): Promise<RegistryItem[]> {
  requireSource(type);
  return cacheWrap(
    listKey(type),
    async () => {
      const items = await listItemData(type);
      const source = sources.get(type)!;
      return items.map((item) => toRegistryItem(type, item, source));
    },
    CACHE_TTL.registryCatalog,
  );
}

/**
 * Resolve a slug to its canonical RegistryItem.
 *
 * Search order: when `type` is given, only that type is searched.
 * Otherwise types are searched in canonical REGISTRY_ITEM_TYPES order
 * and the FIRST hit wins (deterministic). Use `?type=` to disambiguate
 * slugs that exist in more than one dataset.
 *
 * Throws 404 when nothing matches.
 */
export async function resolveItem(
  slug: string,
  type?: RegistryItemType,
): Promise<RegistryItem> {
  const types = type ? [type] : REGISTRY_ITEM_TYPES;
  for (const t of types) {
    const source = sources.get(t);
    if (!source) continue;
    const items = await source.list();
    if (!Array.isArray(items)) continue;
    const found = items.find((item) => source.slugOf(item) === slug);
    if (found !== undefined) {
      return toRegistryItem(t, found, source);
    }
  }
  throw AppError.notFound(
    `No registry item found for slug '${slug}'${type ? ` of type '${type}'` : ""}`,
  );
}

/** True when the catalog can serve items for every registered check. */
export async function catalogHealth(): Promise<{
  ok: boolean;
  items: number;
  types: RegistryItemType[];
}> {
  let items = 0;
  const types: RegistryItemType[] = [];
  for (const t of REGISTRY_ITEM_TYPES) {
    const source = sources.get(t);
    if (!source) continue;
    try {
      const list = await source.list();
      if (Array.isArray(list) && list.length > 0) {
        types.push(t);
        items += list.length;
      }
    } catch {
      // A source that throws counts as degraded for that type.
    }
  }
  return { ok: types.length > 0, items, types };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function toRegistryItem(
  type: RegistryItemType,
  item: unknown,
  source: ItemSource,
): RegistryItem {
  return {
    type,
    slug: source.slugOf(item),
    name: source.nameOf ? source.nameOf(item) : null,
    description: source.descriptionOf ? source.descriptionOf(item) : null,
    ...versionFor(type, source.slugOf(item)),
    updatedAt: source.updatedAtOf ? source.updatedAtOf(item) : null,
    data: item,
  };
}

/** Test-only: drop all registered sources. */
export function _resetCatalogForTest(): void {
  sources.clear();
  invalidateCatalog();
}
