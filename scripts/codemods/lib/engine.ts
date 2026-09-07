/**
 * engine.ts — shared codemod core (PF-015, issue #95)
 *
 * The machinery every codemod shares:
 *   - `CodemodDefinition`: id / metadata / per-file transform
 *   - `defineTableCodemod`: builds a definition from a plain MappingTable
 *   - `globToFiles`: dependency-free glob → file list (no minimatch)
 *   - `runCodemodOnFiles`: dry-run / --write execution + reporter glue
 *   - `cliMain`: standalone `bun scripts/codemods/<x>.ts <glob> [--write]`
 *
 * Conventions (issue #95):
 *   - dry-run is the default; `--write` applies changes
 *   - unknown / no-equivalent classes are NEVER transformed, always reported
 *   - reporter output format is identical for all codemods
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, resolve, relative, sep } from "path";

import { applyMapping, type MappingTable, type Replacement } from "./mapper";
import { formatFileReport, formatSummary, summarize, type FileReport, type Summary } from "./reporter";

// ─── Codemod definition ───────────────────────────────────────────────────

export interface CodemodTransformResult {
  output: string;
  replaced: Replacement[];
  unknown: string[];
  kept: string[];
  ignored: string[];
  alreadyRoycss: string[];
  approximate: string[];
  /** Deduped plain-CSS blocks emitted by outbound to-vanilla-css. */
  cssBlocks?: string[];
  /** Joined `cssBlocks` (informational, per file). */
  css?: string;
}

export interface CodemodDefinition {
  /** CLI id: `roycss migrate <id> <glob>` — kebab-case. */
  id: string;
  /** Migration direction. */
  kind: "inbound" | "outbound" | "scaffold";
  /** Human label including direction, e.g. "Bootstrap 5 → RoyCSS". */
  label: string;
  /** One-line description shown in help output. */
  description: string;
  /** Report-only codemods refuse --write (v1-to-v2 before PF-042). */
  reportOnly?: boolean;
  /** Why --write is refused (printed with the guard message). */
  reportOnlyReason?: string;
  /** Number of non-null mappings (table codemods). */
  mappingCount?: () => number;
  /** Transform one file's source. Pure: no I/O. */
  transform: (source: string) => CodemodTransformResult;
}

export interface TableCodemodConfig {
  id: string;
  kind: "inbound" | "outbound" | "scaffold";
  label: string;
  description: string;
  mappings: MappingTable;
  /** Framework utility patterns that intentionally stay as-is. */
  ignore?: RegExp[];
  /** Source classes whose mapping is approximate — always reported. */
  approximate?: readonly string[];
  /** See MappingOptions.skipRoycss. Outbound codemods pass false. */
  skipRoycss?: boolean;
  reportOnly?: boolean;
  reportOnlyReason?: string;
}

/** Build a codemod from a plain mapping table. */
export function defineTableCodemod(config: TableCodemodConfig): CodemodDefinition {
  const approximateSet = new Set(config.approximate ?? []);
  return {
    id: config.id,
    kind: config.kind,
    label: config.label,
    description: config.description,
    reportOnly: config.reportOnly,
    reportOnlyReason: config.reportOnlyReason,
    mappingCount: () => Object.values(config.mappings).filter((v) => v !== null && v !== undefined).length,
    transform: (source) => {
      const result = applyMapping(source, config.mappings, {
        ignore: config.ignore,
        skipRoycss: config.skipRoycss,
      });
      const approximate = result.replaced
        .map((r) => r.from)
        .filter((from) => approximateSet.has(from));
      return { ...result, approximate };
    },
  };
}

/** Apply a codemod to one source string; pure, no I/O. */
export function transformSource(def: CodemodDefinition, source: string): CodemodTransformResult {
  return def.transform(source);
}

// ─── Glob → files (dependency-free) ───────────────────────────────────────

const MIGRATE_EXTENSIONS = new Set([
  ".html", ".htm", ".jsx", ".tsx", ".ts", ".js", ".mjs", ".cjs",
  ".vue", ".svelte", ".astro", ".md", ".mdx",
]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache", "coverage", ".turbo"]);

function hasMagic(pattern: string): boolean {
  return /[*?]/.test(pattern);
}

function globToRegexSource(pattern: string): string {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        i++;
        if (pattern[i + 1] === "/") {
          i++;
          out += "(?:.*/)?";
        } else {
          out += ".*";
        }
      } else {
        out += "[^/]*";
      }
    } else if (ch === "?") {
      out += "[^/]";
    } else if (/[.*+?^${}()|[\]\\]/.test(ch)) {
      out += "\\" + ch;
    } else {
      out += ch;
    }
  }
  return out;
}

function walkFiles(dir: string, base: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
      walkFiles(full, base, out);
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
      if (MIGRATE_EXTENSIONS.has(ext)) out.push(full);
    }
  }
}

/**
 * Resolve a glob to a list of file paths (absolute). Supports `*`, `**` and
 * `?`. A magic-free pattern is treated as a literal file or directory. When
 * a literal directory is given, it is walked for markup/code extensions.
 */
export function globToFiles(glob: string, cwd: string): string[] {
  const pattern = glob.replace(/^\.\//, "").replace(/\/+$/, "");
  if (!hasMagic(pattern)) {
    const literal = resolve(cwd, pattern);
    if (!existsSync(literal)) return [];
    const st = statSync(literal);
    if (st.isFile()) return [literal];
    if (st.isDirectory()) {
      const out: string[] = [];
      walkFiles(literal, literal, out);
      return out;
    }
    return [];
  }
  // Walk from the deepest magic-free directory prefix to keep scans cheap.
  const segments = pattern.split("/");
  let prefix = "";
  let i = 0;
  while (i < segments.length && !hasMagic(segments[i])) {
    prefix = prefix ? `${prefix}/${segments[i]}` : segments[i];
    i++;
  }
  const baseDir = prefix ? resolve(cwd, prefix) : resolve(cwd);
  if (!existsSync(baseDir) || !statSync(baseDir).isDirectory()) return [];
  const re = new RegExp(`^${globToRegexSource(pattern)}$`);
  const collected: string[] = [];
  const walkDir = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
        walkDir(full);
      } else if (entry.isFile()) {
        const rel = relative(resolve(cwd), full).split(sep).join("/");
        if (re.test(rel)) collected.push(full);
      }
    }
  };
  walkDir(baseDir);
  return collected.sort();
}

// ─── Execution ────────────────────────────────────────────────────────────

export interface RunOptions {
  cwd?: string;
  /** Apply changes (default: dry-run). */
  write?: boolean;
  /** Output path for the emitted CSS artifact (to-vanilla-css). */
  cssOut?: string;
}

export interface RunResult {
  reports: FileReport[];
  summary: Summary;
  /** Path the CSS artifact was written to (to-vanilla-css with --write). */
  cssPath?: string;
  /** Deduped emitted CSS (to-vanilla-css). */
  css?: string;
}

/**
 * Run a codemod over a list of files. Dry-run by default; `--write` applies
 * the transformed sources (and, for to-vanilla-css, the emitted CSS block).
 */
export function runCodemodOnFiles(def: CodemodDefinition, files: string[], options: RunOptions = {}): RunResult {
  const write = options.write === true && !def.reportOnly;
  const reports: FileReport[] = [];
  const cssBlocks: string[] = [];
  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(file, "utf-8");
    } catch (err) {
      process.stderr.write(`⚠ skipping unreadable file ${file}: ${err instanceof Error ? err.message : String(err)}\n`);
      continue;
    }
    const result = def.transform(source);
    const changed = result.output !== source;
    reports.push({
      file,
      changed,
      replaced: result.replaced,
      unknown: result.unknown,
      kept: result.kept,
      ignored: result.ignored,
      alreadyRoycss: result.alreadyRoycss,
      approximate: result.approximate ?? [],
      css: result.css,
    });
    for (const block of result.cssBlocks ?? []) {
      if (!cssBlocks.includes(block)) cssBlocks.push(block);
    }
    if (write && changed) {
      writeFileSync(file, result.output, "utf-8");
    }
  }
  const css = cssBlocks.length
    ? `/* RoyCSS → plain CSS — generated by \`roycss migrate ${def.id}\`\n * Self-contained: no RoyCSS package required beyond this file.\n */\n\n${cssBlocks.join("\n\n")}\n`
    : undefined;
  let cssPath: string | undefined;
  if (css && write) {
    cssPath = resolve(options.cwd ?? process.cwd(), options.cssOut ?? "roycss-vanilla.css");
    writeFileSync(cssPath, css, "utf-8");
  } else if (css) {
    cssPath = resolve(options.cwd ?? process.cwd(), options.cssOut ?? "roycss-vanilla.css");
  }
  return { reports, summary: summarize(def.id, reports, write), cssPath, css };
}

// ─── Standalone script entry (`bun scripts/codemods/<id>.ts <glob>`) ──────

export interface CliMainOptions {
  /** Default CSS artifact path for --out. */
  defaultCssOut?: string;
}

export function cliMain(def: CodemodDefinition, argv: string[], options: CliMainOptions = {}): number {
  const positional: string[] = [];
  let write = false;
  let cssOut: string | undefined;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--write") write = true;
    else if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--out") {
      cssOut = argv[++i];
      if (!cssOut) {
        process.stderr.write("error: --out requires a file path\n");
        return 1;
      }
    } else positional.push(arg);
  }
  const usage = `usage: roycss migrate ${def.id} <glob> [--write]${def.id === "to-vanilla-css" ? " [--out <file>]" : ""}\n  ${def.description}`;
  if (help || positional.length === 0) {
    process.stdout.write(usage + "\n");
    return help ? 0 : 1;
  }
  if (def.reportOnly && write) {
    process.stderr.write(
      `✗ ${def.id} is report-only: ${def.reportOnlyReason ?? "transformation not available yet"}\n` +
        `  run without --write for the report.\n`,
    );
    return 1;
  }
  const cwd = process.cwd();
  const files = globToFiles(positional[0], cwd);
  if (files.length === 0) {
    process.stderr.write(`✗ no files matched: ${positional[0]}\n`);
    return 1;
  }
  if (def.reportOnly) {
    process.stdout.write(`⚠ ${def.reportOnlyReason ?? "report-only codemod"}\n\n`);
  }
  process.stdout.write(`migrate ${def.id} — ${def.label} (${files.length} files, ${write ? "write" : "dry-run"})\n\n`);
  const result = runCodemodOnFiles(def, files, { cwd, write, cssOut: cssOut ?? options.defaultCssOut });
  for (const report of result.reports) {
    process.stdout.write(formatFileReport(report, report.changed) + "\n");
  }
  process.stdout.write("\n" + formatSummary(result.summary) + "\n");
  if (result.cssPath) {
    process.stdout.write(
      `\n  css artifact: ${result.cssPath}${write ? "" : " (dry-run — written with --write)"}\n`,
    );
  }
  return 0;
}
