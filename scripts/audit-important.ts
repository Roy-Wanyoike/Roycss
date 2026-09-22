#!/usr/bin/env bun
/**
 * RoyCSS !important + @layer cascade audit (PF-035 V1 slice — issue #128).
 *
 * Audits the built framework stylesheet (dist/roycss.css by default) for:
 *  1. !important usage — categorized by policy:
 *       a11y-guard      inside @media (prefers-reduced-motion: reduce) → allowed
 *       effect-internal inside a `.roycss-*` selector (component-internal pin) → tracked
 *       unjustified     anywhere else → must be justified or removed
 *  2. @layer ordering — presence + declared order vs the recommended skeleton.
 *
 * Modes:
 *   bun run scripts/audit-important.ts            human report (JSON to stdout)
 *   bun run scripts/audit-important.ts --check    exit 1 on policy regression
 *                                                 (unjustified count grows, or
 *                                                  layer order invalid)
 *   bun run scripts/audit-important.ts --json     machine report only
 *   bun run scripts/audit-important.ts --file x.css
 *
 * The baseline is stored in scripts/important-baseline.json; --check fails
 * when the unjustified/effect-internal counts exceed the baseline (ratchet:
 * numbers may go down, never up).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractLayerStatement, RECOMMENDED_LAYER_ORDER } from "../src/lib/css-lint";

/** Script directory — fileURLToPath works in both Bun and Node/Vitest. */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Pure audit core (exported for unit tests)
// ============================================================

export interface ImportantOccurrence {
  /** 1-based line number. */
  line: number;
  property: string;
  value: string;
  category: "a11y-guard" | "effect-internal" | "unjustified";
  selector: string;
}

export interface ImportantAuditReport {
  file: string;
  totalImportant: number;
  byCategory: Record<"a11y-guard" | "effect-internal" | "unjustified", number>;
  occurrences: ImportantOccurrence[];
  layer: {
    hasLayerStatement: boolean;
    declaredOrder: string[] | null;
    expectedOrder: string[];
    orderValid: boolean;
    unknownLayers: string[];
  };
  /** ISO date of the audit run. */
  auditedAt: string;
}

/** Extract the nearest preceding selector for a declaration index. */
function nearestSelector(css: string, index: number): string {
  const upto = css.slice(0, index);
  const m = upto.match(/([^{}]+)\{[^{}]*$/);
  return m ? m[1].replace(/[\r\n]+/g, " ").trim().slice(0, 120) : "(unknown)";
}

/** Is the character offset inside a prefers-reduced-motion media block? */
function isInsideReducedMotionGuard(css: string, index: number): boolean {
  const re = /@media[^{]*\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    if (!/prefers-reduced-motion\s*:\s*reduce/i.test(match[0])) continue;
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    if (index >= match.index && index < i) return true;
    re.lastIndex = i;
  }
  return false;
}

function lineAt(css: string, index: number): number {
  return css.slice(0, index).split("\n").length;
}

/** Parse a `prop: value !important` declaration around the match index. */
function parseDeclaration(css: string, index: number): { property: string; value: string } {
  const upto = css.slice(0, index);
  const lastSemi = upto.lastIndexOf(";");
  const lastBrace = upto.lastIndexOf("{");
  const start = Math.max(lastSemi, lastBrace) + 1;
  const decl = css.slice(start, index).trim();
  const colon = decl.indexOf(":");
  if (colon === -1) return { property: "(unknown)", value: "" };
  return {
    property: decl.slice(0, colon).trim(),
    value: decl.slice(colon + 1).trim(),
  };
}

export function auditImportant(css: string, fileName = "roycss.css"): ImportantAuditReport {
  const occurrences: ImportantOccurrence[] = [];
  const re = /!important/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const idx = match.index;
    const selector = nearestSelector(css, idx);
    const inGuard = isInsideReducedMotionGuard(css, idx);
    const isEffectInternal = /\.roycss-[a-z0-9-]+/i.test(selector);
    const category: ImportantOccurrence["category"] = inGuard
      ? "a11y-guard"
      : isEffectInternal
        ? "effect-internal"
        : "unjustified";
    const decl = parseDeclaration(css, idx);
    occurrences.push({
      line: lineAt(css, idx),
      property: decl.property,
      value: decl.value,
      category,
      selector,
    });
  }

  const byCategory = { "a11y-guard": 0, "effect-internal": 0, unjustified: 0 };
  for (const o of occurrences) byCategory[o.category]++;

  const declaredOrder = extractLayerStatement(css);
  const unknownLayers = (declaredOrder ?? []).filter(
    (l) => !(RECOMMENDED_LAYER_ORDER as readonly string[]).includes(l),
  );
  // Order valid = every known layer appears in recommended relative order.
  let lastIdx = -1;
  let orderValid = true;
  for (const name of declaredOrder ?? []) {
    const idx = (RECOMMENDED_LAYER_ORDER as readonly string[]).indexOf(name);
    if (idx === -1) continue;
    if (idx < lastIdx) orderValid = false;
    lastIdx = Math.max(lastIdx, idx);
  }

  return {
    file: fileName,
    totalImportant: occurrences.length,
    byCategory,
    occurrences,
    layer: {
      hasLayerStatement: declaredOrder !== null,
      declaredOrder,
      expectedOrder: [...RECOMMENDED_LAYER_ORDER],
      orderValid,
      unknownLayers,
    },
    auditedAt: new Date().toISOString(),
  };
}

// ============================================================
// Baseline ratchet
// ============================================================

interface Baseline {
  unjustified: number;
  effectInternal: number;
  total: number;
  note: string;
}

const BASELINE_PATH = resolve(SCRIPT_DIR, "important-baseline.json");

export function loadBaseline(): Baseline {
  if (!existsSync(BASELINE_PATH)) {
    return { unjustified: -1, effectInternal: -1, total: -1, note: "no baseline yet" };
  }
  return JSON.parse(readFileSync(BASELINE_PATH, "utf-8")) as Baseline;
}

export function checkAgainstBaseline(
  report: ImportantAuditReport,
  baseline: Baseline,
): { pass: boolean; failures: string[] } {
  const failures: string[] = [];
  if (baseline.unjustified >= 0 && report.byCategory.unjustified > baseline.unjustified) {
    failures.push(
      `unjustified !important grew: ${report.byCategory.unjustified} > baseline ${baseline.unjustified}`,
    );
  }
  if (baseline.effectInternal >= 0 && report.byCategory["effect-internal"] > baseline.effectInternal) {
    failures.push(
      `effect-internal !important grew: ${report.byCategory["effect-internal"]} > baseline ${baseline.effectInternal}`,
    );
  }
  if (report.layer.hasLayerStatement && !report.layer.orderValid) {
    failures.push(
      `@layer order invalid: [${report.layer.declaredOrder?.join(", ")}] deviates from recommended [${report.layer.expectedOrder.join(", ")}]`,
    );
  }
  return { pass: failures.length === 0, failures };
}

// ============================================================
// CLI (only when executed directly — importing this module runs no I/O)
// ============================================================

function isDirectRun(): boolean {
  // Bun: import.meta.main. Node/Vitest: compare url with argv[1].
  if (typeof (import.meta as { main?: boolean }).main === "boolean") {
    return (import.meta as { main?: boolean }).main === true;
  }
  try {
    return fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
  } catch {
    return false;
  }
}

function main(): number {
  function argValue(flag: string): string | undefined {
    const i = process.argv.indexOf(flag);
    return i !== -1 ? process.argv[i + 1] : undefined;
  }

  const isCheck = process.argv.includes("--check");
  const jsonOnly = process.argv.includes("--json");
  const fileArg = argValue("--file");
  const defaultFile = resolve(SCRIPT_DIR, "../dist/roycss.css");
  const target = fileArg ? resolve(process.cwd(), fileArg) : defaultFile;

  if (!existsSync(target)) {
    console.error(`audit-important: file not found: ${target}`);
    console.error(`Build the package first (bun run build:package) or pass --file <path>.`);
    return 2;
  }

  const css = readFileSync(target, "utf-8");
  const report = auditImportant(css, target);
  const baseline = loadBaseline();
  const gate = checkAgainstBaseline(report, baseline);

  // Persist the machine report next to dist for drift tracking.
  try {
    const outDir = resolve(SCRIPT_DIR, "../dist");
    if (existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        resolve(outDir, "important-audit.json"),
        JSON.stringify({ ...report, gate: { pass: gate.pass, failures: gate.failures, baseline } }, null, 2),
      );
    }
  } catch {
    // report persistence is best-effort
  }

  if (!jsonOnly) {
    console.log(`\n!important + @layer audit — ${report.file}`);
    console.log(`═`.repeat(60));
    console.log(`  total !important:      ${report.totalImportant}`);
    console.log(`  a11y-guard (allowed):  ${report.byCategory["a11y-guard"]}`);
    console.log(`  effect-internal:       ${report.byCategory["effect-internal"]}`);
    console.log(`  unjustified:           ${report.byCategory.unjustified}`);
    console.log(``);
    console.log(`  @layer statement:      ${report.layer.hasLayerStatement ? `present [${report.layer.declaredOrder?.join(", ")}]` : "absent (flat cascade)"}`);
    console.log(`  layer order valid:     ${report.layer.orderValid ? "yes" : "no"}`);
    if (report.byCategory.unjustified > 0) {
      console.log(`\n  unjustified occurrences:`);
      for (const o of report.occurrences.filter((x) => x.category === "unjustified")) {
        console.log(`    line ${o.line}: ${o.property}: ${o.value} !important  (${o.selector})`);
      }
    }
    if (report.byCategory["effect-internal"] > 0) {
      console.log(`\n  effect-internal occurrences (tracked, component pins):`);
      for (const o of report.occurrences.filter((x) => x.category === "effect-internal").slice(0, 10)) {
        console.log(`    line ${o.line}: ${o.property}: ${o.value} !important  (${o.selector})`);
      }
      const rest = report.byCategory["effect-internal"] - 10;
      if (rest > 0) console.log(`    … and ${rest} more (see dist/important-audit.json)`);
    }
    console.log(`\n  baseline: unjustified≤${baseline.unjustified}, effect-internal≤${baseline.effectInternal}`);
    console.log(`  gate:     ${gate.pass ? "PASS" : "FAIL — " + gate.failures.join("; ")}`);
    console.log(``);
  }

  return isCheck && !gate.pass ? 1 : 0;
}

if (isDirectRun()) {
  process.exit(main());
}
