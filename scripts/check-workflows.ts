/**
 * Workflow trigger lint — malformed-trigger guard (audit F-09).
 *
 * A mangled `branches:` value in a workflow trigger (e.g. a truncated
 * flow list) still parses as valid YAML, so GitHub Actions never
 * surfaces an error — the workflow just silently never runs. This
 * guard fails CI instead.
 *
 * WHAT IT CATCHES (line-based, exactly):
 *   1. Inline trigger values with an unbalanced bracket count:
 *        branches: ain]        ← the F-09 typo class (opener eaten)
 *        branches: [main       ← closer eaten
 *        branches: [main]]      ← extra closer
 *        branches: ]main[       ← inverted
 *   2. Brackets that do not form an inline flow list:
 *        branches: ma[in]       ← brackets mid-value
 *   3. Bracket-free values containing characters that no branch/tag/
 *      workflow-name glob can contain (spaces, stray punctuation):
 *        branches: main extra
 *   4. Multi-line list items under a trigger key with the same rules:
 *        branches:
 *          - ain]              ← caught too
 *
 * WHAT IT ACCEPTS (sane forms, mirroring ci.yml):
 *     branches: [main]
 *     branches: ["main", "develop"]
 *     branches: main
 *     tags: ["v*"]
 *     workflows: ["CI"]
 *     types: [completed]
 *     paths-style globs in bare values: backend-node/src/modules/**
 *
 * KNOWN LIMITATIONS (documented, deliberate): the check is syntactic —
 * it validates the SHAPE of trigger values, not whether the branch
 * names themselves exist. Keys are only linted under their trigger
 * spelling (`branches`, `branches-ignore`, `tags`, `tags-ignore`,
 * `workflows`, `types`); a same-named key inside `with:` inputs with a
 * valid shape passes anyway (no false positives observed in practice).
 *
 * Usage:  bun run scripts/check-workflows.ts   (from repo root)
 * Exit:   0 = all trigger values well-formed, 1 = violations listed.
 *
 * Pure static analysis — no dependencies, no YAML parser needed
 * (runs before `bun install` in CI).
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url)); // scripts/
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
export const WORKFLOWS_DIR = resolve(REPO_ROOT, ".github", "workflows");

/** Trigger keys whose values are branch/tag/workflow-name lists. */
const TRIGGER_KEYS = new Set([
  "branches",
  "branches-ignore",
  "tags",
  "tags-ignore",
  "workflows",
  "types",
]);

export interface TriggerViolation {
  file: string;
  line: number;
  value: string;
  reason: string;
}

/**
 * Validate one trigger value (the text after `branches:` / a list item
 * dash). Returns null when the value is sane, a human-readable reason
 * when mangled.
 */
export function validateTriggerValue(rawValue: string): string | null {
  const value = rawValue.trim().replace(/,+$/, "").trim();
  // Strip one pair of surrounding quotes: 'main' / "v*" / "CI".
  const unquoted = /^(['"])(.*)\1$/.exec(value)?.[2] ?? value;
  if (unquoted === "") return null; // `key:` alone → multi-line form

  const opens = (unquoted.match(/\[/g) ?? []).length;
  const closes = (unquoted.match(/\]/g) ?? []).length;

  if (opens + closes === 0) {
    // Bare glob — branch/tag/workflow names may contain word chars,
    // glob metacharacters, slashes, dashes and commas only.
    if (!/^[A-Za-z0-9_.*!,$/-]+$/.test(unquoted)) {
      return `bare value has unexpected characters: ${JSON.stringify(unquoted)}`;
    }
    return null;
  }

  if (opens !== closes) {
    return `unbalanced brackets (${opens} "[", ${closes} "]")`;
  }
  if (unquoted.startsWith("[") && unquoted.endsWith("]")) {
    return null; // well-formed inline flow list
  }
  return `brackets do not form an inline list (e.g. branches: [main])`;
}

/**
 * Lint the trigger values of one workflow file's lines.
 *
 * Handles both the inline form (`branches: [main]`) and the multi-line
 * list form (`branches:` followed by deeper-indented `- item` lines,
 * which are validated as bare values).
 */
export function lintWorkflowTriggers(
  lines: string[],
  file: string,
): TriggerViolation[] {
  const violations: TriggerViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const m = /^(\s*)([A-Za-z-]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, indent, key, rest] = m;
    if (key === undefined || indent === undefined || rest === undefined) {
      continue;
    }
    if (!TRIGGER_KEYS.has(key)) continue;

    if (rest.trim() !== "") {
      const reason = validateTriggerValue(rest);
      if (reason) {
        violations.push({ file, line: i + 1, value: rest.trim(), reason });
      }
      continue;
    }

    // `key:` with no inline value → multi-line list items below it.
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j]!;
      if (next.trim() === "") continue; // blank lines don't end the block
      const item = /^(\s+)-\s+(.*)$/.exec(next);
      if (item && item[1]!.length > indent.length) {
        const reason = validateTriggerValue(item[2]!);
        if (reason) {
          violations.push({
            file,
            line: j + 1,
            value: item[2]!.trim(),
            reason,
          });
        }
        continue;
      }
      break; // not a deeper list item → end of the trigger block
    }
  }
  return violations;
}

/** Scan a directory of workflow files. Returns files linted + violations. */
export function lintWorkflowFiles(dir: string): {
  files: string[];
  violations: TriggerViolation[];
} {
  const names = readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .sort();
  const violations: TriggerViolation[] = [];
  for (const name of names) {
    const lines = readFileSync(resolve(dir, name), "utf8").split("\n");
    violations.push(...lintWorkflowTriggers(lines, name));
  }
  return { files: names, violations };
}

// ─── CLI ─────────────────────────────────────────────────────────────────

function main(): void {
  const { files, violations } = lintWorkflowFiles(WORKFLOWS_DIR);

  if (files.length === 0) {
    console.error(`✖ no workflow files found under ${WORKFLOWS_DIR}`);
    process.exit(1);
  }

  console.log(`workflow trigger lint — ${files.length} file(s): ${files.join(", ")}`);

  if (violations.length > 0) {
    console.error(`\n✖ ${violations.length} malformed trigger value(s):`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.value}  — ${v.reason}`);
    }
    console.error(
      "\nA mangled trigger value parses as valid YAML but matches no real " +
        "branch/tag, so the workflow silently never runs (audit F-09). " +
        "Fix it to mirror the sane form in ci.yml:  branches: [main]",
    );
    process.exit(1);
  }

  console.log("✓ all workflow trigger values are well-formed.");
}

// Run only when executed directly (importing for tests is side-effect-free).
const isMain =
  typeof process !== "undefined" &&
  !!process.argv[1] &&
  import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href;
if (isMain) main();
