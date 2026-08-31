/**
 * Refactor service — Roy Refactor CSS framework migrator + pattern catalog.
 *
 * The catalog of refactor patterns covers 6 canonical CSS refactors
 * (vendor-prefix removal, hex → oklch, physical → logical, !important
 * removal, @media → @container, float → flex) — each with `find`, `replace`,
 * `why`, and `example`. The source-frameworks list (Bootstrap, Tailwind,
 * Material, Bulma, Legacy) remains for the transform endpoint.
 *
 * Each transform produces a deterministic, repeatable result derived from
 * the source framework + total file size — the same input always returns
 * the same diff so the cache is coherent.
 *
 * Reads are LRU-cached; transforms invalidate the result list.
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
const PATTERNS_KEY = "refactor:patterns";
const resultKey = (id: string): string => `refactor:result:${id}`;

// ─── 5 source frameworks ───────────────────────────────────────────────
const FRAMEWORKS: SourceFramework[] = [
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

const frameworks: SourceFramework[] = FRAMEWORKS.map((f) => ({ ...f }));

// ─── 6 CSS refactor patterns ─────────────────────────────────────────────
export interface RefactorPattern {
  id: string;
  name: string;
  /** What to search for (regex / selector / property pattern). */
  find: string;
  /** What to replace it with. */
  replace: string;
  /** Why this refactor improves the code. */
  why: string;
  /** A concrete before → after example. */
  example: { before: string; after: string };
}

const PATTERNS: RefactorPattern[] = [
  {
    id: "pattern-vendor-prefix-removal",
    name: "Vendor-Prefix Removal",
    find: "-webkit-/-moz-/-ms-/-o- prefixed properties that are now Baseline-widely-supported",
    replace: "Drop the prefixed declaration; keep the unprefixed standard one.",
    why: "Vendor prefixes were a transition tool. Modern browsers (Chrome 88+, Safari 15+, Firefox 89+) support the unprefixed properties for flex, grid, transition, animation, gradient, etc. — keeping the prefixes only adds bytes and confuses PostCSS tools.",
    example: {
      before: ".btn {\n  -webkit-border-radius: 8px;\n  -moz-border-radius: 8px;\n  border-radius: 8px;\n  -webkit-transition: background 0.2s;\n  transition: background 0.2s;\n}",
      after: ".btn {\n  border-radius: 8px;\n  transition: background 0.2s;\n}",
    },
  },
  {
    id: "pattern-hex-to-oklch",
    name: "Hex → OKLCH",
    find: "Hard-coded hex colors (#5b8def) and rgb()/hsl() literals.",
    replace: "Convert to oklch() for perceptually-uniform lightness/chroma/hue.",
    why: "OKLCH makes color manipulation predictable: `oklch(from var(--base) calc(l + 0.1) c h)` lightens perceptually — hex/rgb do not. OKLCH also gamut-maps gracefully to wide-gamut displays.",
    example: {
      before: ":root {\n  --primary: #5b8def;\n  --primary-hover: #4a7fc7;\n}",
      after: ":root {\n  --primary: oklch(0.62 0.18 250);\n  --primary-hover: oklch(from var(--primary) calc(l - 0.05) c h);\n}",
    },
  },
  {
    id: "pattern-physical-to-logical",
    name: "Physical → Logical Properties",
    find: "margin-left, padding-right, border-top, left, right, width, height, text-align: left/right.",
    replace: "margin-inline-start, padding-inline-end, border-block-start, inset-inline-*, inline-size, block-size, text-align: start/end.",
    why: "Logical properties honor `dir=rtl` automatically, work for vertical writing-modes, and are Baseline 2021+. Physical properties lock the layout to one direction.",
    example: {
      before: ".card { margin-left: 1rem; padding-right: 1rem; text-align: left; width: 320px; }",
      after: ".card { margin-inline-start: 1rem; padding-inline-end: 1rem; text-align: start; inline-size: 320px; }",
    },
  },
  {
    id: "pattern-important-removal",
    name: "!important Removal",
    find: "Declarations using `!important` (usually a specificity escalation).",
    replace: "Increase selector specificity via class composition or `:where()` and drop `!important`.",
    why: "`!important` is a code smell — it indicates the cascade is fighting itself. Removing it (via higher specificity or `@layer`) makes the cascade predictable again.",
    example: {
      before: ".btn.btn-primary { color: white !important; }",
      after: ".btn.btn-primary,\n:where(.btn).btn-primary { color: white; }",
    },
  },
  {
    id: "pattern-media-to-container",
    name: "@media → @container",
    find: "@media (min-width: 600px) { .card { ... } } patterns that should respond to the component's container, not the viewport.",
    replace: "Add `container-type: inline-size` on the container and convert the @media query to an @container query.",
    why: "Container queries make components responsive to where they're placed, not to the viewport. A 200px card in a 1200px viewport shouldn't apply a desktop layout just because the viewport is wide.",
    example: {
      before: ".card { font-size: 1rem; }\n@media (min-width: 600px) {\n  .card { font-size: 1.25rem; }\n}",
      after: ".card-host { container-type: inline-size; }\n.card { font-size: 1rem; }\n@container (min-width: 300px) {\n  .card { font-size: 1.25rem; }\n}",
    },
  },
  {
    id: "pattern-float-to-flex",
    name: "Float → Flex",
    find: "Float-based layouts: `float: left` + `clear: both` + width/height hacks + clearfix pseudo-elements.",
    replace: "Use `display: flex` with `gap`, `flex-direction`, and `align-items` for the same visual layout.",
    why: "Floats were a layout hack from the 2000s — they have no concept of gap, alignment, or true two-dimensional arrangement. Flexbox replaces them with a single declaration that's predictable, RTL-aware, and gap-friendly.",
    example: {
      before: ".row { overflow: hidden; }\n.row > * { float: left; width: 33.33%; padding: 0 8px; box-sizing: border-box; }\n.row::after { content: ''; display: table; clear: both; }",
      after: ".row { display: flex; gap: 16px; }\n.row > * { flex: 1 1 0; }",
    },
  },
];

/** List all 5 source frameworks. Cached. */
export async function listFrameworks(): Promise<SourceFramework[]> {
  return cacheWrap(
    FRAMEWORKS_KEY,
    () => Promise.resolve(frameworks.map((f) => ({ ...f }))),
    CACHE_TTL.refactorFrameworks,
  );
}

/** List all 6 CSS refactor patterns. Cached. */
export async function listPatterns(): Promise<RefactorPattern[]> {
  return cacheWrap(
    PATTERNS_KEY,
    () => Promise.resolve(PATTERNS.map((p) => ({ ...p, example: { ...p.example } }))),
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

// ─── One historical result so the GET /results/:id route works ───────────
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

/** Submit code for refactor. Invalidates the result list cache. */
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
