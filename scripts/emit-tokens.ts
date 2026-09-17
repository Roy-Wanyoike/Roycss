/**
 * RoyCSS Design-Token Artifact Emitter (PF-030 / issue #123).
 *
 * Emits the token TYPE SYSTEM from the design-token source of truth
 * (src/lib/design-tokens.ts — 12 TokenCategory groups, read-only here):
 *
 *   1. dist/tokens.d.ts
 *      Declaration-only TypeScript artifact: typed CSS custom-property
 *      CONSTANTS (nested `readonly` literal maps whose values are
 *      `var(--roy-<category>-<name>)` references) + TOKEN_COUNT /
 *      TOKEN_CATEGORIES + helper types, so consumers get autocomplete
 *      and literal-level type-safety for every token name.
 *
 *      NOTE: `as const` object initializers are illegal in ambient
 *      declarations (tsc error TS1254 — "a 'const' initializer in an
 *      ambient context must be a string or numeric literal"), so the
 *      generator emits the equivalent explicit `readonly` literal type
 *      annotation. Same literal types, valid .d.ts.
 *
 *   2. dist/tokens.dtcg.json
 *      W3C Design Tokens Community Group interchange format
 *      (https://design-tokens.github.io/community-group/format/):
 *      one group per token category, one {$value, $type, $description}
 *      entry per token. $value is ALWAYS the verbatim source string
 *      (round-trip guarantee); $type is the closest standard DTCG type
 *      inferred per token — see dtcgTypeFor() for the mapping and its
 *      documented simplifications (numeric tokens keep their CSS string
 *      form; shadow/strokeStyle values stay raw CSS strings rather than
 *      the fully structured DTCG objects — Style Dictionary and Tokens
 *      Studio both accept string values for these types).
 *
 * Deterministic: no timestamps, no environment data, source order
 * preserved — running the emitter twice is byte-stable, which is what
 * makes the drift gates below meaningful.
 *
 * Usage:
 *   bun run tokens:emit                          (package.json alias)
 *   bun run scripts/emit-tokens.ts               (equivalent)
 *   bun run tokens:check                         (--check drift gate)
 *
 * Wiring: chained at the end of scripts/build-package.ts (same pattern
 * as generate-build-artifacts.ts) so a `bun run build:package` /
 * `prepublishOnly` can never ship a stale token artifact.
 *
 * Drift guards (mirror the docs-class-api / proxy-effect-404 patterns):
 *   - `bun run tokens:check` regenerates in memory and fails (exit 1)
 *     if the on-disk artifacts differ from the generator output.
 *   - tests/unit/tokens-emission.test.ts pins the committed artifacts
 *     to the source corpus (byte-equality + round-trip + DTCG shape +
 *     tsc compile check), so CI fails if src/lib/design-tokens.ts
 *     changes without a regeneration.
 *
 * Post-emit validation: main() re-reads and re-parses both emitted
 * files and verifies EVERY source token is present with an exact-value
 * match (and that no extra tokens appeared) before exiting 0 — see
 * validateRoundTrip().
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { designTokens, type TokenCategory } from "../src/lib/design-tokens";

const ROOT = import.meta.dir + "/..";
const DIST_DIR = join(ROOT, "dist");
const DTS_PATH = join(DIST_DIR, "tokens.d.ts");
const DTCG_PATH = join(DIST_DIR, "tokens.dtcg.json");

/* ─── Token helpers (shared with the emitted artifacts' semantics) ── */

/** CSS custom-property name for a token, mirroring generateCSSVariables(). */
export function cssCustomPropertyName(cat: TokenCategory, name: string): string {
  return `--roy-${cat.id}-${name}`;
}

/** CSS var() reference for a token — the value shape used in tokens.d.ts. */
export function cssVarReference(cat: TokenCategory, name: string): string {
  return `var(${cssCustomPropertyName(cat, name)})`;
}

/** Total token count across all categories. */
export function tokenCount(): number {
  return designTokens.reduce((n, cat) => n + Object.keys(cat.tokens).length, 0);
}

/* ─── DTCG $type inference ───────────────────────────────────────────
   The source's own generateJSONTokens() maps types per CATEGORY in a
   Style-Dictionary-ish vocabulary ("opacity", "other", …) that is not
   DTCG. The mapping below starts from those categories but infers per
   TOKEN to the closest *standard* DTCG type, so every $value/$type pair
   is at least vocabulary-valid DTCG. Simplifications (documented, kept
   for round-trip fidelity — values stay verbatim source strings):
     - number tokens (opacity/elevation/zIndex/leading-*) carry their
       CSS string form ("0.25", not 0.25).
     - shadow / strokeStyle / cubicBezier tokens keep raw CSS strings
       instead of DTCG's fully structured objects/arrays. */
const DTCG_NUMERIC_CATEGORIES = new Set(["opacity", "elevation", "zIndex"]);
const DTCG_DIMENSION_CATEGORIES = new Set(["spacing", "radius", "breakpoint", "container"]);

export function dtcgTypeFor(categoryId: string, name: string): string {
  switch (categoryId) {
    case "color":
      return "color";
    case "typography":
      if (name.startsWith("font-")) return "fontFamily";
      if (name.startsWith("text-")) return "dimension";
      if (name.startsWith("leading-")) return "number"; // unitless line-heights
      if (name.startsWith("tracking-")) return "dimension";
      return "string";
    case "shadow":
      return "shadow";
    case "border":
      return name.startsWith("border-width-") ? "dimension" : "strokeStyle";
    case "motion":
      return name.startsWith("ease-") ? "cubicBezier" : "duration";
    default:
      if (DTCG_NUMERIC_CATEGORIES.has(categoryId)) return "number";
      if (DTCG_DIMENSION_CATEGORIES.has(categoryId)) return "dimension";
      return "string";
  }
}

/* ─── dist/tokens.d.ts builder (pure — used by the drift test) ────── */

/** Bare identifier if safe, else a double-quoted key. */
function tsKey(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : `"${name}"`;
}

export function buildTokensDts(): string {
  const count = tokenCount();
  const ids = designTokens.map((c) => c.id);
  const lines: string[] = [];

  lines.push("// AUTO-GENERATED by scripts/emit-tokens.ts — DO NOT EDIT BY HAND.");
  lines.push("// Regenerate after src/lib/design-tokens.ts changes: bun run tokens:emit");
  lines.push("// Drift guards: `bun run tokens:check` + tests/unit/tokens-emission.test.ts.");
  lines.push("//");
  lines.push(`// Source of truth: src/lib/design-tokens.ts — ${count} tokens across`);
  lines.push(`// ${ids.length} categories (${ids.join(", ")}).`);
  lines.push("//");
  lines.push("// Values are CSS custom-property REFERENCES (var(--roy-<category>-<name>))");
  lines.push("// matching generateCSSVariables(), so they stay live against the :root");
  lines.push("// custom properties — theming overrides keep working.");
  lines.push("//");
  lines.push("// Declaration-only artifact (no dist/tokens.js runtime): consume with");
  lines.push("// `import type` / `typeof` for autocomplete + literal-level type-safety:");
  lines.push("//");
  lines.push('//   import type { tokens, RoyCustomPropertyName } from "roycss/dist/tokens";');
  lines.push('//   type ColorToken = keyof (typeof tokens)["color"];');
  lines.push("//   const name: RoyCustomPropertyName = \"--roy-color-primary\";");
  lines.push("");
  lines.push("/** Total number of RoyCSS design tokens. */");
  lines.push(`export declare const TOKEN_COUNT: ${count};`);
  lines.push("");
  lines.push("/** RoyCSS token category ids, in source order. */");
  lines.push(
    `export declare const TOKEN_CATEGORIES: readonly [${ids.map((id) => `"${id}"`).join(", ")}];`,
  );
  lines.push("");
  lines.push("/**");
  lines.push(" * Typed CSS custom-property constants, nested by token category.");
  lines.push(" * Every leaf value is the `var()` reference for that token, e.g.");
  lines.push(" * tokens.color.primary === \"var(--roy-color-primary)\".");
  lines.push(" */");
  lines.push("export declare const tokens: {");
  for (const cat of designTokens) {
    lines.push(`  /** ${cat.label}${cat.description ? ` — ${cat.description}` : ""} */`);
    lines.push(`  readonly ${tsKey(cat.id)}: {`);
    for (const name of Object.keys(cat.tokens)) {
      lines.push(`    readonly ${tsKey(name)}: ${JSON.stringify(cssVarReference(cat, name))};`);
    }
    lines.push("  };");
  }
  lines.push("};");
  lines.push("");
  lines.push("/** Union of every RoyCSS token category id. */");
  lines.push("export type TokenCategoryId = (typeof TOKEN_CATEGORIES)[number];");
  lines.push("");
  lines.push("/** Token names within a given category (e.g. TokenName<\"color\">). */");
  lines.push("export type TokenName<C extends TokenCategoryId> = keyof (typeof tokens)[C];");
  lines.push("");
  lines.push("/** Union of every RoyCSS CSS custom-property name. */");
  lines.push("export type RoyCustomPropertyName =");
  const varNames = designTokens.flatMap((cat) =>
    Object.keys(cat.tokens).map((name) => cssCustomPropertyName(cat, name)),
  );
  varNames.forEach((varName, i) => {
    lines.push(`  | ${JSON.stringify(varName)}${i === varNames.length - 1 ? ";" : ""}`);
  });
  lines.push("");
  return lines.join("\n");
}

/* ─── dist/tokens.dtcg.json builder (pure — used by the drift test) ── */

/** A DTCG token node: $value + $type + $description. */
export interface DtcgTokenNode {
  $value: string;
  $type: string;
  $description: string;
}

/** A DTCG group node: optional $description + token (or nested) nodes. */
export interface DtcgGroupNode {
  $description?: string;
  [token: string]: DtcgTokenNode | DtcgGroupNode | string | undefined;
}

/** Root DTCG document: $schema + one group per token category. */
export interface DtcgDocument {
  $schema: string;
  $description?: string;
  [group: string]: DtcgGroupNode | string | undefined;
}

export function buildTokensDtcg(): DtcgDocument {
  const doc: DtcgDocument = {
    $schema: "https://design-tokens.github.io/community-group/format/",
    $description: `RoyCSS design tokens (${tokenCount()} tokens, ${designTokens.length} categories). Generated from src/lib/design-tokens.ts by scripts/emit-tokens.ts — do not edit by hand.`,
  };
  for (const cat of designTokens) {
    const group: DtcgGroupNode = {
      $description: `${cat.label}${cat.description ? ` — ${cat.description}` : ""}`,
    };
    for (const [name, value] of Object.entries(cat.tokens)) {
      group[name] = {
        $value: String(value),
        $type: dtcgTypeFor(cat.id, name),
        $description: `CSS custom property ${cssCustomPropertyName(cat, name)}.`,
      };
    }
    doc[cat.id] = group;
  }
  return doc;
}

export function buildTokensDtcgJsonText(): string {
  return JSON.stringify(buildTokensDtcg(), null, 2) + "\n";
}

/* ─── Round-trip validation (post-emit) ───────────────────────────── */

/**
 * Re-reads and re-parses both emitted artifacts and verifies the token
 * corpus round-trips exactly:
 *   - dist/tokens.dtcg.json parses as JSON and contains EVERY source
 *     token (category + name + verbatim $value + non-empty $type) —
 *     and no extra tokens.
 *   - dist/tokens.d.ts contains the var() reference for every token,
 *     the RoyCustomPropertyName union member for every custom property,
 *     and the TOKEN_COUNT literal.
 * Throws (→ non-zero exit) on any mismatch, so the build chain fails
 * loudly instead of shipping a bad artifact.
 */
export function validateRoundTrip(): void {
  const errors: string[] = [];
  const expected = new Set<string>();

  // 1 ── DTCG document re-parses and mirrors the corpus exactly.
  let dtcg: DtcgDocument;
  try {
    dtcg = JSON.parse(readFileSync(DTCG_PATH, "utf8")) as DtcgDocument;
  } catch (err) {
    throw new Error(
      `emit-tokens round-trip: dist/tokens.dtcg.json does not parse as JSON (${err instanceof Error ? err.message : String(err)})`,
    );
  }

  for (const cat of designTokens) {
    const group = dtcg[cat.id];
    if (group === undefined || typeof group !== "object") {
      errors.push(`dtcg: missing category group "${cat.id}"`);
      continue;
    }
    for (const [name, value] of Object.entries(cat.tokens)) {
      const key = `${cat.id}.${name}`;
      expected.add(key);
      const entry = (group as Record<string, unknown>)[name];
      if (entry === undefined || typeof entry !== "object" || entry === null) {
        errors.push(`dtcg: missing token ${key}`);
        continue;
      }
      const token = entry as Record<string, unknown>;
      if (token.$value !== String(value)) {
        errors.push(
          `dtcg: value drift for ${key}: ${JSON.stringify(token.$value)} !== ${JSON.stringify(String(value))}`,
        );
      }
      if (typeof token.$type !== "string" || token.$type.length === 0) {
        errors.push(`dtcg: missing/empty $type for ${key}`);
      }
    }
  }

  // No extra tokens in the emitted document.
  for (const [groupId, group] of Object.entries(dtcg)) {
    if (groupId.startsWith("$")) continue;
    if (typeof group !== "object" || group === null) {
      errors.push(`dtcg: "${groupId}" is not a group object`);
      continue;
    }
    for (const name of Object.keys(group)) {
      if (name.startsWith("$")) continue;
      if (!expected.has(`${groupId}.${name}`)) {
        errors.push(`dtcg: extra token ${groupId}.${name} not present in the source`);
      }
    }
  }

  // 2 ── tokens.d.ts carries every var() reference and union member.
  const dts = readFileSync(DTS_PATH, "utf8");
  for (const cat of designTokens) {
    for (const name of Object.keys(cat.tokens)) {
      const ref = JSON.stringify(cssVarReference(cat, name));
      if (!dts.includes(`: ${ref};`)) {
        errors.push(`dts: missing constant value ${ref} for ${cat.id}.${name}`);
      }
      const unionMember = JSON.stringify(cssCustomPropertyName(cat, name));
      if (!dts.includes(`\n  | ${unionMember}`)) {
        errors.push(`dts: missing RoyCustomPropertyName member ${unionMember}`);
      }
    }
  }
  if (!dts.includes(`export declare const TOKEN_COUNT: ${tokenCount()};`)) {
    errors.push(`dts: TOKEN_COUNT literal is not ${tokenCount()}`);
  }

  if (errors.length > 0) {
    throw new Error(`emit-tokens round-trip validation failed:\n  - ${errors.join("\n  - ")}`);
  }
}

/* ─── CLI entry ───────────────────────────────────────────────────── */

function rel(p: string): string {
  return relative(ROOT, p);
}

function main(): void {
  const checkOnly = process.argv.includes("--check");
  const dts = buildTokensDts();
  const json = buildTokensDtcgJsonText();
  const count = tokenCount();

  if (checkOnly) {
    const drift: string[] = [];
    for (const [path, expectedContent] of [
      [DTS_PATH, dts],
      [DTCG_PATH, json],
    ] as const) {
      if (!existsSync(path)) {
        drift.push(`${rel(path)} is missing`);
        continue;
      }
      if (readFileSync(path, "utf8") !== expectedContent) {
        drift.push(`${rel(path)} is stale (differs from generator output)`);
      }
    }
    if (drift.length > 0) {
      console.error(
        `✗ design-token artifact drift:\n  - ${drift.join("\n  - ")}\n` +
          `Regenerate with: bun run tokens:emit`,
      );
      process.exit(1);
    }
    console.log(
      `✓ dist/tokens.d.ts + dist/tokens.dtcg.json in sync with src/lib/design-tokens.ts (${count} tokens)`,
    );
    return;
  }

  mkdirSync(DIST_DIR, { recursive: true });
  writeFileSync(DTS_PATH, dts, "utf8");
  writeFileSync(DTCG_PATH, json, "utf8");

  // Post-emit validation: the artifacts we just wrote must re-parse and
  // round-trip the full corpus — a broken emission fails the build here.
  validateRoundTrip();

  const dtsKb = (Buffer.byteLength(dts, "utf8") / 1024).toFixed(1);
  const jsonKb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
  console.log(`  ✓ dist/tokens.d.ts (${count} tokens, ${dtsKb}KB)`);
  console.log(`  ✓ dist/tokens.dtcg.json (${count} tokens, ${jsonKb}KB)`);
  console.log(`  ✓ round-trip validation: all ${count} source tokens present in both artifacts`);
}

// Only act when executed directly (`bun run scripts/emit-tokens.ts`) —
// importing this module (e.g. from tests/unit/tokens-emission.test.ts)
// must NOT write files. Under Bun, import.meta.main is true only for
// the entry module; under Node/vitest it is undefined.
if (import.meta.main) {
  main();
}
