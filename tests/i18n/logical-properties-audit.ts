/**
 * RoyCSS — Logical Properties Audit
 *
 * Reads all `src/lib/effects-batch-*.ts` files, scans each effect's `cssCode`
 * for physical (LTR-only) CSS properties, and records violations with
 * suggested logical replacements.
 *
 * Output: `tests/i18n/results/physical-properties.json`
 *
 * Run: `bun run tests/i18n/logical-properties-audit.ts`
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const BATCH_GLOB_DIR = path.join(PROJECT_ROOT, "src", "lib");
const RESULTS_DIR = path.join(__dirname, "results");
const RESULTS_FILE = path.join(RESULTS_DIR, "physical-properties.json");

// Physical property → logical replacement map (order matters: longer keys first)
const PHYSICAL_PROPERTIES: Array<{
  pattern: RegExp;
  property: string;
  replacement: string;
  category: "margin" | "padding" | "border" | "inset" | "text-align" | "float" | "transform";
  notes?: string;
}> = [
  // Margins
  {
    pattern: /\bmargin-left\b/g,
    property: "margin-left",
    replacement: "margin-inline-start",
    category: "margin",
  },
  {
    pattern: /\bmargin-right\b/g,
    property: "margin-right",
    replacement: "margin-inline-end",
    category: "margin",
  },
  // Padding
  {
    pattern: /\bpadding-left\b/g,
    property: "padding-left",
    replacement: "padding-inline-start",
    category: "padding",
  },
  {
    pattern: /\bpadding-right\b/g,
    property: "padding-right",
    replacement: "padding-inline-end",
    category: "padding",
  },
  // Borders (covers -width, -color, -style shorthand)
  {
    pattern: /\bborder-left\b/g,
    property: "border-left",
    replacement: "border-inline-start",
    category: "border",
  },
  {
    pattern: /\bborder-right\b/g,
    property: "border-right",
    replacement: "border-inline-end",
    category: "border",
  },
  // Positioned offsets — bare `left:` / `right:` as CSS property (not inside function).
  // Match `left:` or `right:` at start of line (after whitespace) OR after `{` / `;`.
  {
    pattern: /(^|[\s;{])left\s*:/g,
    property: "left",
    replacement: "inset-inline-start",
    category: "inset",
    notes: "Bare `left:` declaration — verify it's a positioned offset, not a keyframe selector",
  },
  {
    pattern: /(^|[\s;{])right\s*:/g,
    property: "right",
    replacement: "inset-inline-end",
    category: "inset",
    notes: "Bare `right:` declaration — verify it's a positioned offset, not a keyframe selector",
  },
  // Text alignment
  {
    pattern: /\btext-align:\s*left\b/gi,
    property: "text-align: left",
    replacement: "text-align: start",
    category: "text-align",
  },
  {
    pattern: /\btext-align:\s*right\b/gi,
    property: "text-align: right",
    replacement: "text-align: end",
    category: "text-align",
  },
  // Float
  {
    pattern: /\bfloat:\s*left\b/gi,
    property: "float: left",
    replacement: "float: inline-start",
    category: "float",
  },
  {
    pattern: /\bfloat:\s*right\b/gi,
    property: "float: right",
    replacement: "float: inline-end",
    category: "float",
  },
  // transform: translateX() — flagged for human review per ADR-03
  {
    pattern: /\btranslateX\s*\(/g,
    property: "translateX(",
    replacement: "(review needed — see ADR-03)",
    category: "transform",
    notes: "translateX is a transform, not a directional CSS property. Flag for human review: positional animations are OK, directional slides need :dir(rtl) override.",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Violation {
  file: string;
  effectId: string;
  effectCategory: string;
  line: number;
  column: number;
  lineContent: string;
  property: string;
  category: string;
  suggestedReplacement: string;
  notes?: string;
}

interface EffectSummary {
  totalEffects: number;
  effectsWithViolations: number;
  totalViolations: number;
  violationsByCategory: Record<string, number>;
  violationsByFile: Record<string, number>;
  topViolations: Array<{ effectId: string; file: string; count: number; category: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listBatchFiles(): string[] {
  return fs
    .readdirSync(BATCH_GLOB_DIR)
    .filter((f) => /^effects-batch-\d+\.ts$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)![0], 10);
      const nb = parseInt(b.match(/\d+/)![0], 10);
      return na - nb;
    })
    .map((f) => path.join(BATCH_GLOB_DIR, f));
}

/**
 * Parse a batch file and return an array of { id, category, cssCode, cssLineOffset }
 * where cssLineOffset is the line number in the source file where cssCode starts
 * (1-based) — used to translate offsets within cssCode back to source lines.
 *
 * We do a lightweight regex parse rather than importing the TS module, because:
 *  - We don't want to execute the module (side effects, missing imports, etc.)
 *  - We just need the strings.
 */
function parseBatchFile(
  filePath: string,
): Array<{ id: string; category: string; cssCode: string; cssLineOffset: number }> {
  const src = fs.readFileSync(filePath, "utf8");
  const effects: Array<{ id: string; category: string; cssCode: string; cssLineOffset: number }> = [];

  // Match: { id: "...", name: ..., category: "...", ... cssCode: `...` ... }
  // We walk through and find each `id: "..."` then track until we hit `cssCode: \`...\``.
  const idRegex = /\bid:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;

  const idPositions: Array<{ id: string; pos: number }> = [];
  while ((m = idRegex.exec(src)) !== null) {
    idPositions.push({ id: m[1], pos: m.index });
  }

  for (let i = 0; i < idPositions.length; i++) {
    const { id, pos } = idPositions[i];
    const end = i + 1 < idPositions.length ? idPositions[i + 1].pos : src.length;
    const block = src.slice(pos, end);

    // Extract category
    const catMatch = block.match(/\bcategory:\s*"([^"]+)"/);
    const category = catMatch ? catMatch[1] : "unknown";

    // Extract cssCode (template literal)
    // The template literal may contain `${...}` — for RoyCSS effects it doesn't,
    // but we still need to handle escaped backticks. Use a state machine.
    const cssIdx = block.search(/\bcssCode:\s*`/);
    if (cssIdx === -1) continue;
    const cssStartInBlock = cssIdx + block.slice(cssIdx).indexOf("`") + 1;

    // Find the matching closing backtick, respecting escapes
    let j = cssStartInBlock;
    while (j < block.length) {
      if (block[j] === "\\" && j + 1 < block.length) {
        j += 2;
        continue;
      }
      if (block[j] === "`") break;
      j++;
    }
    const cssCode = block.slice(cssStartInBlock, j);

    // Translate cssStartInBlock back to a line number in the file
    const cssStartInFile = pos + cssStartInBlock;
    const cssLineOffset = src.slice(0, cssStartInFile).split("\n").length;

    effects.push({ id, category, cssCode, cssLineOffset });
  }

  return effects;
}

function findViolations(
  filePath: string,
  effects: Array<{ id: string; category: string; cssCode: string; cssLineOffset: number }>,
): Violation[] {
  const violations: Violation[] = [];
  const fileRel = path.relative(PROJECT_ROOT, filePath);

  for (const eff of effects) {
    const lines = eff.cssCode.split("\n");
    for (const { pattern, property, replacement, category, notes } of PHYSICAL_PROPERTIES) {
      // Reset regex state
      pattern.lastIndex = 0;
      // We scan the whole cssCode at once to get correct column offsets,
      // then map back to line numbers.
      let m: RegExpExecArray | null;
      const text = eff.cssCode;
      while ((m = pattern.exec(text)) !== null) {
        const matchStart = m.index;
        // Compute line + column within cssCode
        let line = 1;
        let col = 1;
        for (let k = 0; k < matchStart; k++) {
          if (text[k] === "\n") {
            line++;
            col = 1;
          } else {
            col++;
          }
        }
        const lineContent = lines[line - 1] ?? "";
        violations.push({
          file: fileRel,
          effectId: eff.id,
          effectCategory: eff.category,
          line: eff.cssLineOffset + line - 1,
          column: col,
          lineContent: lineContent.trim(),
          property,
          category,
          suggestedReplacement: replacement,
          notes,
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const files = listBatchFiles();
  console.log(`\nScanning ${files.length} batch files in ${BATCH_GLOB_DIR}\n`);

  const allViolations: Violation[] = [];
  let totalEffects = 0;

  for (const file of files) {
    const effects = parseBatchFile(file);
    totalEffects += effects.length;
    const violations = findViolations(file, effects);
    allViolations.push(...violations);
    console.log(
      `  ${path.relative(PROJECT_ROOT, file)}: ${effects.length} effects, ${violations.length} violations`,
    );
  }

  // Summaries
  const violationsByCategory: Record<string, number> = {};
  const violationsByFile: Record<string, number> = {};
  const violationsByEffect: Record<string, { count: number; file: string; category: string }> = {};

  for (const v of allViolations) {
    violationsByCategory[v.category] = (violationsByCategory[v.category] ?? 0) + 1;
    violationsByFile[v.file] = (violationsByFile[v.file] ?? 0) + 1;
    const key = `${v.file}::${v.effectId}`;
    if (!violationsByEffect[key]) {
      violationsByEffect[key] = { count: 0, file: v.file, category: v.effectCategory };
    }
    violationsByEffect[key].count++;
  }

  const effectsWithViolations = Object.keys(violationsByEffect).length;

  const topViolations = Object.entries(violationsByEffect)
    .map(([k, v]) => {
      const [file, effectId] = k.split("::");
      return { effectId, file, count: v.count, category: v.category };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const summary: EffectSummary = {
    totalEffects,
    effectsWithViolations,
    totalViolations: allViolations.length,
    violationsByCategory,
    violationsByFile,
    topViolations,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    violations: allViolations,
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));

  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`Logical Properties Audit Summary`);
  console.log(`────────────────────────────────────────────────────────────`);
  console.log(`Total effects scanned:        ${totalEffects}`);
  console.log(`Effects with ≥1 violation:    ${effectsWithViolations} (${((effectsWithViolations / totalEffects) * 100).toFixed(1)}%)`);
  console.log(`Effects fully compliant:      ${totalEffects - effectsWithViolations} (${(((totalEffects - effectsWithViolations) / totalEffects) * 100).toFixed(1)}%)`);
  console.log(`Total violations:             ${allViolations.length}`);
  console.log(`\nViolations by category:`);
  for (const [cat, count] of Object.entries(violationsByCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(15)} ${count}`);
  }
  console.log(`\nTop 10 most-violating effects:`);
  for (const v of topViolations.slice(0, 10)) {
    console.log(`  ${v.count.toString().padStart(3)}× ${v.effectId.padEnd(35)} (${v.file})`);
  }
  console.log(`\nResults written to: ${path.relative(PROJECT_ROOT, RESULTS_FILE)}`);
  console.log(`────────────────────────────────────────────────────────────\n`);
}

main();
