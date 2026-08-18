/**
 * Bundle service — Roy Bundle (CSS/JS bundle analyzer).
 *
 * Mock backend (no DB). Seeds 1 bundle analysis result with a size
 * breakdown, 3 duplicate modules, and 5 dead CSS rules. Analyze requests
 * synthesize a result keyed on the requested entry point.
 *
 * Reads are LRU-cached; new analyses invalidate the results list.
 *
 * Future: persist via Prisma `BundleResult` model and stream live
 * measurements from a CI integration.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
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

// ─── Seed: 3 duplicate modules ──────────────────────────────────────────
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

// ─── Seed: 5 dead CSS rules ─────────────────────────────────────────────
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

let results: BundleResult[] = SEED_RESULTS.map((r) => ({ ...r, breakdown: r.breakdown.map((b) => ({ ...b })), warnings: [...r.warnings] }));

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
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Bundle result '${id}' not found`);
      return Promise.resolve({
        ...found,
        breakdown: found.breakdown.map((b) => ({ ...b })),
        warnings: [...found.warnings],
      });
    },
    CACHE_TTL.bundleResultDetail,
  );
}

/** Analyze a bundle. Returns a synthetic complete result. */
export async function analyzeBundle(
  input: AnalyzeBundleInput,
): Promise<BundleResult> {
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
  results = [result, ...results].slice(0, 50);
  invalidateResults(id);
  log.info("Bundle analyzed", { id, entry: input.entry });
  return result;
}

/** Test-only: reset to seed. */
export function _resetBundleForTest(): void {
  results = SEED_RESULTS.map((r) => ({ ...r, breakdown: r.breakdown.map((b) => ({ ...b })), warnings: [...r.warnings] }));
  invalidateResults();
  cache.delete(DUPLICATES_KEY);
  cache.delete(DEAD_CSS_KEY);
}
