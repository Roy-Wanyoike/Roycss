/**
 * Bundle service — Prisma-backed Roy Bundle (CSS/JS bundle analyzer).
 *
 * Persisted via the Prisma `BundleResult` model. Seeds 1 bundle analysis
 * result with a size breakdown, plus static duplicate-module and
 * dead-CSS-rule lookups (these are not Prisma-backed because there is
 * no Prisma model for them in the current schema).
 *
 * Field-mapping: the Prisma `BundleResult` model exposes (name,
 * sizeBytes, gzipBytes, modulesJson). The domain shape carries extra
 * (entry, status, brotliSize, analyzedAt, breakdown,
 * duplicatesCount, deadCssCount, warnings) which is JSON-encoded
 * inside `modulesJson` as a wrapper object. `entry → name`,
 * `totalSize → sizeBytes`, `gzipSize → gzipBytes` map directly.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  BundleResult,
  DeadCssRule,
  DuplicateModule,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { AnalyzeBundleInput } from "./schema.js";

const log = createLogger("bundle");

const RESULTS_KEY = "bundle:results";
const DUPLICATES_KEY = "bundle:duplicates";
const DEAD_CSS_KEY = "bundle:dead-css";
const resultKey = (id: string): string => `bundle:result:${id}`;

function invalidateResults(id?: string): void {
  cache.delete(RESULTS_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: 3 duplicate modules (static — no Prisma model) ───────────────
const SEED_DUPLICATES: DuplicateModule[] = [
  {
    id: "dup-001",
    name: "lodash.debounce",
    versions: ["4.0.8", "4.17.21"],
    importers: ["@roycss/effects", "@roycss/motion", "@roycss/cli"],
    totalSize: 28_672,
    savingPotential: 14_336,
  },
  {
    id: "dup-002",
    name: "clsx",
    versions: ["2.1.0", "2.1.1"],
    importers: ["@roycss/components", "@roycss/studio"],
    totalSize: 4096,
    savingPotential: 2048,
  },
  {
    id: "dup-003",
    name: "@radix-ui/react-dialog",
    versions: ["1.0.5", "1.1.0"],
    importers: ["@roycss/pro-components", "@roycss/studio"],
    totalSize: 54272,
    savingPotential: 27_136,
  },
];

// ─── Seed: 5 dead CSS rules (static — no Prisma model) ─────────────────
const SEED_DEAD_CSS: DeadCssRule[] = [
  {
    id: "dead-001",
    selector: ".roycss-legacy-grid",
    file: "roycss-fallbacks.css",
    line: 124,
    size: 412,
    lastUsedDaysAgo: 184,
  },
  {
    id: "dead-002",
    selector: ".roycss-pseudo-hover-shim",
    file: "roycss-fallbacks.css",
    line: 256,
    size: 286,
    lastUsedDaysAgo: 412,
  },
  {
    id: "dead-003",
    selector: ".roycss-flex-legacy",
    file: "roycss.css",
    line: 78,
    size: 184,
    lastUsedDaysAgo: 95,
  },
  {
    id: "dead-004",
    selector: ".roycss-color-shim-rgb",
    file: "roycss.css",
    line: 302,
    size: 96,
    lastUsedDaysAgo: 250,
  },
  {
    id: "dead-005",
    selector: ".roycss-old-shadow-flat",
    file: "roycss-fallbacks.css",
    line: 411,
    size: 132,
    lastUsedDaysAgo: 310,
  },
];

// ─── Seed: 1 bundle result ──────────────────────────────────────────────
const SEED_RESULTS: BundleResult[] = [
  {
    id: "bundle-seed-001",
    entry: "src/index.ts",
    status: "complete",
    totalSize: 412_672,
    gzipSize: 128_448,
    brotliSize: 102_912,
    analyzedAt: "2025-02-18T10:00:00.000Z",
    breakdown: [
      { label: "Effects", size: 184_320, share: 0.447 },
      { label: "Recipes", size: 92_160, share: 0.223 },
      { label: "Patterns", size: 61_440, share: 0.149 },
      { label: "Utilities", size: 43_008, share: 0.104 },
      { label: "Themes", size: 21_504, share: 0.052 },
      { label: "Runtime", size: 10_240, share: 0.025 },
    ],
    duplicatesCount: 3,
    deadCssCount: 5,
    warnings: [
      "3 duplicate modules detected — consider deduping via npm overrides.",
      "5 dead CSS rules can be safely removed.",
    ],
  },
];

/** Wrapper persisted in `modulesJson`. */
interface BundleWrapper {
  entry: string;
  status: BundleResult["status"];
  brotliSize: number;
  analyzedAt: string;
  breakdown: BundleResult["breakdown"];
  duplicatesCount: number;
  deadCssCount: number;
  warnings: string[];
}

function toDbRow(r: BundleResult) {
  const wrapper: BundleWrapper = {
    entry: r.entry,
    status: r.status,
    brotliSize: r.brotliSize,
    analyzedAt: r.analyzedAt,
    breakdown: r.breakdown,
    duplicatesCount: r.duplicatesCount,
    deadCssCount: r.deadCssCount,
    warnings: r.warnings,
  };
  return {
    id: r.id,
    userId: null,
    name: r.entry,
    sizeBytes: r.totalSize,
    gzipBytes: r.gzipSize,
    modulesJson: JSON.stringify(wrapper),
  };
}

function toDomain(row: {
  id: string;
  name: string;
  sizeBytes: number;
  gzipBytes: number;
  modulesJson: string;
  createdAt: Date;
}): BundleResult {
  let wrapper: BundleWrapper;
  try {
    wrapper = JSON.parse(row.modulesJson) as BundleWrapper;
  } catch {
    wrapper = {
      entry: row.name,
      status: "complete",
      brotliSize: 0,
      analyzedAt: row.createdAt.toISOString(),
      breakdown: [],
      duplicatesCount: 0,
      deadCssCount: 0,
      warnings: [],
    };
  }
  return {
    id: row.id,
    entry: wrapper.entry,
    status: wrapper.status,
    totalSize: row.sizeBytes,
    gzipSize: row.gzipBytes,
    brotliSize: wrapper.brotliSize,
    analyzedAt: wrapper.analyzedAt,
    breakdown: wrapper.breakdown.map((b) => ({ ...b })),
    duplicatesCount: wrapper.duplicatesCount,
    deadCssCount: wrapper.deadCssCount,
    warnings: [...wrapper.warnings],
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.bundleResult.count();
    if (count === 0) {
      await db.bundleResult.createMany({
        data: SEED_RESULTS.map(toDbRow),
      });
      log.info("Bundle results seeded", { count: SEED_RESULTS.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List duplicate modules. Cached. */
export async function listDuplicates(): Promise<DuplicateModule[]> {
  return cacheWrap(
    DUPLICATES_KEY,
    () =>
      Promise.resolve(
        SEED_DUPLICATES.map((d) => ({
          ...d,
          versions: [...d.versions],
          importers: [...d.importers],
        })),
      ),
    CACHE_TTL.bundleDuplicates,
  );
}

/** List dead CSS rules. Cached. */
export async function listDeadCss(): Promise<DeadCssRule[]> {
  return cacheWrap(
    DEAD_CSS_KEY,
    () => Promise.resolve(SEED_DEAD_CSS.map((d) => ({ ...d }))),
    CACHE_TTL.bundleDeadCss,
  );
}

/** Get a single bundle result by id. Throws 404 if missing. */
export async function getBundleResultById(id: string): Promise<BundleResult> {
  return cacheWrap(
    resultKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.bundleResult.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Bundle result '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.bundleResultDetail,
  );
}

/** Analyze a bundle. Returns a synthetic complete result. */
export async function analyzeBundle(
  input: AnalyzeBundleInput,
): Promise<BundleResult> {
  await seedIfEmpty();
  const id = `bundle-${randomUUID()}`;
  const total = 200_000 + Math.floor(Math.random() * 400_000);
  const result: BundleResult = {
    id,
    entry: input.entry,
    status: "complete",
    totalSize: total,
    gzipSize: Math.floor(total * 0.31),
    brotliSize: Math.floor(total * 0.24),
    analyzedAt: new Date().toISOString(),
    breakdown: [
      { label: "Effects", size: Math.floor(total * 0.45), share: 0.45 },
      { label: "Recipes", size: Math.floor(total * 0.22), share: 0.22 },
      { label: "Patterns", size: Math.floor(total * 0.15), share: 0.15 },
      { label: "Utilities", size: Math.floor(total * 0.1), share: 0.1 },
      { label: "Themes", size: Math.floor(total * 0.05), share: 0.05 },
      { label: "Runtime", size: Math.floor(total * 0.03), share: 0.03 },
    ],
    duplicatesCount: 3,
    deadCssCount: 5,
    warnings: [
      "3 duplicate modules detected — consider deduping via npm overrides.",
      "5 dead CSS rules can be safely removed.",
    ],
  };
  await db.bundleResult.create({ data: toDbRow(result) });
  invalidateResults(id);
  log.info("Bundle analyzed", { id, entry: input.entry });
  return result;
}

/** Test-only: reset to seed. */
export function _resetBundleForTest(): void {
  seedPromise = null;
  invalidateResults();
  cache.delete(DUPLICATES_KEY);
  cache.delete(DEAD_CSS_KEY);
}
