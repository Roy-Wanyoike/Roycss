/**
 * Inspector service — RoyCSS class catalog + page scanner.
 *
 * Sources its class catalog from the build artifact `dist/class-index.json`
 * (produced by `scripts/generate-build-artifacts.ts` at build time). The
 * catalog contains one row per top-level `.{className} { ... }` rule
 * found in any effect's `cssCode`, alongside the originating effect's
 * id and category. The service adapts that raw artifact into the
 * `InspectorClass` domain shape.
 *
 * All reads are LRU-cached. No mutation endpoints — the catalog is a
 * curated platform asset.
 *
 * If the artifact is missing or unreadable, the service degrades to an
 * empty dataset and logs a warning — the server still starts and every
 * endpoint returns a clear empty result rather than crashing.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { InspectorClass, ScanResult } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ScanPageInput } from "./schema.js";

const log = createLogger("inspector");

const __dirname = dirname(fileURLToPath(import.meta.url));
// src/modules/inspector/service.ts → ../../.. = backend root
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");
const CLASS_INDEX_PATH = resolve(BACKEND_ROOT, "..", "dist", "class-index.json");

const CLASSES_KEY = "inspector:classes";
const detailKey = (name: string): string => `inspector:class:${name}`;
const EFFECTS_KEY = "inspector:effects";
const scanKey = (url: string, category: string): string =>
  `inspector:scan:${url}:${category}`;

/** Raw artifact shape produced by generate-build-artifacts.ts. */
interface ClassIndexEntry {
  className: string;
  category: string;
  effectId: string;
  properties: string;
}

let cachedClasses: InspectorClass[] | null = null;
let cachedEffects: { id: string; name: string; category: string }[] = [];

/** Load + cache the class-index.json artifact. */
function loadClasses(): InspectorClass[] {
  if (cachedClasses) return cachedClasses;

  let raw: string;
  try {
    raw = readFileSync(CLASS_INDEX_PATH, "utf-8");
  } catch (err) {
    log.error(
      "Failed to read class-index.json artifact — running with empty catalog",
      {
        path: CLASS_INDEX_PATH,
        err: err instanceof Error ? err.message : String(err),
      },
    );
    cachedClasses = [];
    cachedEffects = [];
    return cachedClasses;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log.error("class-index.json is malformed — running with empty catalog", {
      path: CLASS_INDEX_PATH,
      err: err instanceof Error ? err.message : String(err),
    });
    cachedClasses = [];
    return cachedClasses;
  }

  if (!Array.isArray(parsed)) {
    log.error("class-index.json is not an array — running with empty catalog", {
      path: CLASS_INDEX_PATH,
    });
    cachedClasses = [];
    return cachedClasses;
  }

  const entries = parsed as ClassIndexEntry[];
  const seen = new Set<string>();
  const classes: InspectorClass[] = [];
  const effects: { id: string; name: string; category: string }[] = [];

  for (const entry of entries) {
    if (!entry?.className) continue;
    if (seen.has(entry.className)) continue;
    seen.add(entry.className);
    classes.push({
      name: entry.className,
      category: entry.category,
      description: `CSS class from effect '${entry.effectId}'.`,
      cssSnippet: `.${entry.className}{${entry.properties}}`,
    });
    effects.push({
      id: entry.effectId,
      name: entry.effectId,
      category: entry.category,
    });
  }

  cachedClasses = classes;
  cachedEffects = effects;
  log.info("Class index loaded", {
    path: CLASS_INDEX_PATH,
    classes: classes.length,
    effects: effects.length,
  });
  return cachedClasses;
}

/** List all inspector classes. Cached. */
export async function listClasses(): Promise<InspectorClass[]> {
  return cacheWrap(
    CLASSES_KEY,
    () => Promise.resolve(loadClasses().map((c) => ({ ...c }))),
    CACHE_TTL.inspectorClasses,
  );
}

/** Get a single class by name. Cached. Throws 404 if missing. */
export async function getClassByName(name: string): Promise<InspectorClass> {
  return cacheWrap(
    detailKey(name),
    () => {
      const found = loadClasses().find((c) => c.name === name);
      if (!found) throw AppError.notFound(`Class '${name}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.inspectorClassDetail,
  );
}

/** List inspectable effects (a curated subset derived from class-index). */
export async function listEffects(): Promise<
  { id: string; name: string; category: string }[]
> {
  return cacheWrap(
    EFFECTS_KEY,
    () => Promise.resolve(cachedEffects.map((e) => ({ ...e }))),
    CACHE_TTL.inspectorEffects,
  );
}

/** Scan a page URL — returns a mock ScanResult. Cached per URL+category. */
export async function scanPage(input: ScanPageInput): Promise<ScanResult> {
  return cacheWrap(
    scanKey(input.url, input.category ?? ""),
    () => {
      const all = loadClasses();
      // Pick a deterministic subset of classes to "find" — derive from URL
      // hash so each URL gives a stable result across requests.
      const hash = simpleHash(input.url);
      const take = Math.min(6 + (hash % 6), all.length); // 6..11 classes
      const start = hash % Math.max(1, all.length);
      const picked = all.slice(start, start + take);

      const matched = picked.map((c, i) => ({
        name: c.name,
        category: c.category,
        occurrences: 1 + ((hash + i) % 12),
      }));

      const filtered = input.category
        ? matched.filter((m) => m.category === input.category)
        : matched;

      return Promise.resolve({
        url: input.url,
        scannedAt: new Date().toISOString(),
        totalClasses: matched.length,
        matched: filtered,
        unknown: ["legacy-grid", "old-btn"],
      });
    },
    CACHE_TTL.inspectorScan,
  );
}

/** Alias for `getClassByName` (matches the task spec's preferred name). */
export async function getClass(name: string): Promise<InspectorClass> {
  return getClassByName(name);
}

/** Alias for `scanPage` (matches the task spec's preferred name). */
export async function inspectUrl(url: string): Promise<ScanResult> {
  return scanPage({ url });
}

/** Tiny string-hash — stable and fast; not cryptographic. */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Number of classes in the catalog. */
export function classesCount(): number {
  return loadClasses().length;
}

log.debug("Inspector module loaded");
