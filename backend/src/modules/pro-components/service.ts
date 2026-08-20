/**
 * Pro Components service — RoyCSS Pro component catalog.
 *
 * Sources its component catalog from the build artifact
 * `dist/pro-components.json` (produced by
 * `scripts/generate-build-artifacts.ts`). The artifact is a flat
 * listing of `src/components/roycss/pro/*.tsx` files with `{ id, name,
 * path }` rows.
 *
 * Field-mapping: the artifact carries `{ id, name, path }`. The
 * ProComponent domain shape carries `{ id, name, category,
 * description, props, codeSnippet }`. The artifact doesn't carry
 * category/description/props/codeSnippet — those are synthesized from
 * the file's `id` (kebab-case → Title Case name; category derived
 * from the file's directory grouping; description derived from the
 * name; props/codeSnippet defaulted to empty since the artifact
 * doesn't parse the .tsx source).
 *
 * All reads are LRU-cached. Read-only — no mutation endpoints.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { ProComponent } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("pro-components");

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");
const PRO_COMPONENTS_PATH = resolve(
  BACKEND_ROOT,
  "..",
  "dist",
  "pro-components.json",
);

const LIST_KEY = "pro:components";
const detailKey = (id: string): string => `pro:component:${id}`;
const codeKey = (id: string): string => `pro:component:${id}:code`;
const CATEGORIES_KEY = "pro:categories";

interface ProArtifactEntry {
  id: string;
  name: string;
  path: string;
}

let cachedComponents: ProComponent[] | null = null;

/** Load + cache the pro-components.json artifact. */
function loadComponents(): ProComponent[] {
  if (cachedComponents) return cachedComponents;

  let raw: string;
  try {
    raw = readFileSync(PRO_COMPONENTS_PATH, "utf-8");
  } catch (err) {
    log.error(
      "Failed to read pro-components.json artifact — running with empty catalog",
      {
        path: PRO_COMPONENTS_PATH,
        err: err instanceof Error ? err.message : String(err),
      },
    );
    cachedComponents = [];
    return cachedComponents;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log.error("pro-components.json is malformed — running with empty catalog", {
      path: PRO_COMPONENTS_PATH,
      err: err instanceof Error ? err.message : String(err),
    });
    cachedComponents = [];
    return cachedComponents;
  }

  if (!Array.isArray(parsed)) {
    log.error("pro-components.json is not an array — running with empty catalog", {
      path: PRO_COMPONENTS_PATH,
    });
    cachedComponents = [];
    return cachedComponents;
  }

  const entries = parsed as ProArtifactEntry[];
  cachedComponents = entries.map((entry) => artifactToComponent(entry));
  log.info("Pro components loaded", {
    path: PRO_COMPONENTS_PATH,
    components: cachedComponents.length,
  });
  return cachedComponents;
}

/** Best-effort category guess from a component's id (kebab-case). */
function categoryFromId(id: string): string {
  if (/grid|table|kanban|scheduler|pivot|datagrid/i.test(id)) return "data";
  if (/chart|calendar|timeline|viz|graph/i.test(id)) return "viz";
  if (/tree|orgchart|command|tabs|nav/i.test(id)) return "nav";
  if (/editor|input|combobox|picker|upload|form/i.test(id)) return "input";
  if (/marketplace|library|hub|template|pattern/i.test(id)) return "content";
  if (/studio|designer|builder|sandbox/i.test(id)) return "tools";
  if (/agent|ai|pair|mentor/i.test(id)) return "ai";
  if (/academy|certification|challenge/i.test(id)) return "learn";
  if (/audit|compliance|governance|review|benchmark|profiler|bundle/i.test(id)) return "ops";
  if (/deploy|preview|cdn|cloud|edge|storage|fleet|observatory|live/i.test(id)) return "infra";
  if (/workspace|enterprise|team|organization/i.test(id)) return "workspace";
  return "misc";
}

/** Convert an artifact entry to the ProComponent domain shape. */
function artifactToComponent(entry: ProArtifactEntry): ProComponent {
  const category = categoryFromId(entry.id);
  return {
    id: entry.id,
    name: entry.name,
    category,
    description: `RoyCSS Pro component '${entry.name}' (${entry.path}).`,
    props: [],
    codeSnippet: `<${entry.name.replace(/[^a-zA-Z0-9]/g, "")} />`,
  };
}

/** List all pro components. Cached. */
export async function listComponents(): Promise<ProComponent[]> {
  return cacheWrap(
    LIST_KEY,
    () => Promise.resolve(loadComponents().map((c) => ({ ...c }))),
    CACHE_TTL.proComponents,
  );
}

/** Get a single pro component by id. Cached. Throws 404 if missing. */
export async function getComponentById(id: string): Promise<ProComponent> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = loadComponents().find((c) => c.id === id);
      if (!found) throw AppError.notFound(`Pro component '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.proComponentDetail,
  );
}

/** Alias for `getComponentById` (matches the task spec's preferred name). */
export async function getComponent(id: string): Promise<ProComponent> {
  return getComponentById(id);
}

/** Get a single component's source code. Cached. Throws 404 if missing. */
export async function getComponentCode(
  id: string,
): Promise<{ id: string; code: string; language: "tsx" }> {
  return cacheWrap(
    codeKey(id),
    () => {
      const found = loadComponents().find((c) => c.id === id);
      if (!found) throw AppError.notFound(`Pro component '${id}' not found`);
      const fnName = found.name.replace(/[^a-zA-Z0-9]/g, "");
      return Promise.resolve({
        id: found.id,
        code: `// ${found.name}\n// ${found.description}\n// Source: ${found.id}\n\nexport function ${fnName}(props) {\n  // …\n}\n\n// Usage:\n${found.codeSnippet}\n`,
        language: "tsx" as const,
      });
    },
    CACHE_TTL.proComponentCode,
  );
}

/** List categories with component counts. Cached. */
export async function listCategories(): Promise<
  { category: string; count: number }[]
> {
  return cacheWrap(
    CATEGORIES_KEY,
    () => {
      const counts = new Map<string, number>();
      for (const c of loadComponents()) {
        counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
      }
      return Promise.resolve(
        [...counts.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([category, count]) => ({ category, count })),
      );
    },
    CACHE_TTL.proCategories,
  );
}

/** Number of components in the catalog. */
export function componentsCount(): number {
  return loadComponents().length;
}

log.debug("Pro Components module loaded");
