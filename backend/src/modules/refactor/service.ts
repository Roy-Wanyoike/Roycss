/**
 * Refactor service — Roy Refactor mock CSS framework migrator.
 *
 * Mock backend (no DB). Seeds 5 source frameworks Roy Refactor can
 * migrate FROM (Bootstrap, Tailwind, Material, Bulma, Legacy).
 * Each transform produces a deterministic, repeatable result derived
 * from the source framework + total file size — the same input always
 * returns the same diff so the cache is coherent.
 *
 * Reads are LRU-cached; transforms invalidate the result list.
 *
 * Future: route to a real AST-based transformer emitting the same shape.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { RefactorResult, SourceFramework } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { RefactorTransformInput } from "./schema.js";

const log = createLogger("refactor");

const FRAMEWORKS_KEY = "refactor:frameworks";
const resultKey = (id: string): string => `refactor:result:${id}`;

// ─── Seed: 5 source frameworks ───────────────────────────────────────────
const SEED_FRAMEWORKS: SourceFramework[] = [
  {
    id: "fw-bootstrap",
    name: "Bootstrap",
    version: "5.3",
    popularity: 88,
    migrationPath: "Bootstrap utility classes → roycss-* equivalents with utility-layer CSS.",
    notes: "Bootstrap's grid maps cleanly to roycss grid utilities. Component classes need manual review.",
  },
  {
    id: "fw-tailwind",
    name: "Tailwind",
    version: "3.4",
    popularity: 92,
    migrationPath: "Tailwind utility classes → roycss atomic utilities (compatible mental model).",
    notes: "Configuration token names differ — Tailwind's `spacing.4` → roycss's `--space-4`.",
  },
  {
    id: "fw-material",
    name: "Material",
    version: "3 (Material You)",
    popularity: 71,
    migrationPath: "Material elevation + state layers → roycss layers + interactive utilities.",
    notes: "Material's elevation scale does not map 1:1 to roycss shadows; pick the closest match.",
  },
  {
    id: "fw-bulma",
    name: "Bulma",
    version: "0.9",
    popularity: 54,
    migrationPath: "Bulma columns + modifiers → roycss grid + responsive utilities.",
    notes: "Bulma's `is-*` modifier convention maps to roycss `roycss-mod-*` modifiers.",
  },
  {
    id: "fw-legacy",
    name: "Legacy",
    version: "n/a",
    popularity: 22,
    migrationPath: "Ad-hoc legacy CSS → roycss via specificity-reduction + token extraction.",
    notes: "Legacy code typically needs a manual audit pass after automated migration.",
  },
];

const frameworks: SourceFramework[] = SEED_FRAMEWORKS.map((f) => ({ ...f }));

/** List all source frameworks. Cached. */
export async function listFrameworks(): Promise<SourceFramework[]> {
  return cacheWrap(
    FRAMEWORKS_KEY,
    () => Promise.resolve(frameworks.map((f) => ({ ...f }))),
    CACHE_TTL.refactorFrameworks,
  );
}

/** Get a single refactor result by id. Cached. Throws 404 if missing. */
export async function getResultById(id: string): Promise<RefactorResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Refactor result '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.refactorResult,
  );
}

/** Deterministic hash → 32-bit int (for mock variance). */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ─── Seed: one historical result ─────────────────────────────────────────
const SEED_RESULTS: RefactorResult[] = [
  {
    id: "rfc-seed-1",
    sourceFramework: "Bootstrap",
    targetFramework: "roycss",
    status: "complete",
    filesProcessed: 24,
    classesMigrated: 312,
    classesUnmapped: 8,
    beforeSize: 89_400,
    afterSize: 47_200,
    diff:
      "--- src/layout.html\n+++ src/layout.html\n- <div class=\"container\">\n+ <div class=\"roycss-container\">\n- <div class=\"row\">\n+ <div class=\"roycss-grid\">\n",
    createdAt: "2025-02-04T00:00:00.000Z",
  },
];

let results: RefactorResult[] = SEED_RESULTS.map((r) => ({ ...r }));

/** Submit code for refactor (mock). Invalidates the result list cache. */
export async function transform(
  input: RefactorTransformInput,
): Promise<RefactorResult> {
  // Verify source framework is known (still allow ad-hoc names but warn).
  const known = frameworks.find(
    (f) => f.name.toLowerCase() === input.sourceFramework.toLowerCase(),
  );
  if (!known) {
    log.warn("Unknown source framework", {
      sourceFramework: input.sourceFramework,
    });
  }

  const totalBytes = input.files.reduce((s, f) => s + f.content.length, 0);
  const hash = hashString(input.sourceFramework + input.targetFramework + totalBytes);
  const classesMigrated = 20 + (hash % 320);
  const classesUnmapped = Math.max(0, (hash % 12) - 2);
  const ratio = 0.45 + ((hash % 25) / 100); // 0.45..0.69
  const afterSize = Math.round(totalBytes * ratio);
  const sampleFile = input.files[0]!;
  const diff = [
    `--- ${sampleFile.path}`,
    `+++ ${sampleFile.path}`,
    `- container → roycss-container`,
    `- row → roycss-grid`,
    `- col-md-6 → roycss-col-md-6`,
    `- btn-primary → roycss-btn roycss-btn-primary`,
  ].join("\n");
  const result: RefactorResult = {
    id: `rfc-${randomUUID()}`,
    sourceFramework: input.sourceFramework,
    targetFramework: input.targetFramework,
    status: "complete",
    filesProcessed: input.files.length,
    classesMigrated,
    classesUnmapped,
    beforeSize: totalBytes,
    afterSize,
    diff,
    createdAt: new Date().toISOString(),
  };
  results = [result, ...results].slice(0, 100);
  cache.delete(resultKey(result.id));
  log.info("Refactor completed", {
    id: result.id,
    files: result.filesProcessed,
    classesMigrated,
  });
  return result;
}

/** Number of frameworks in the catalog. */
export function frameworksCount(): number {
  return frameworks.length;
}

/** Test-only: reset results to seed. */
export function _resetRefactorForTest(): void {
  results = SEED_RESULTS.map((r) => ({ ...r }));
}
