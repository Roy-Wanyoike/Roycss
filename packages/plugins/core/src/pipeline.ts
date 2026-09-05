/**
 * The RoyCSS build pipeline — the shared engine behind every first-party
 * build plugin.
 *
 * A pipeline owns:
 *   • the full compiled stylesheet (from disk, configurable),
 *   • a registry of "used classes" discovered by scanning consumer source,
 *   • `extract()` — the dependency-aware subset extraction (see extractor),
 *   • `process(css)` — a PostCSS-style *string* pipeline that rewrites any
 *     `@import "roycss.css"` inside a stylesheet into the extracted subset
 *     (preserving `layer(…)` qualifiers and all surrounding CSS verbatim).
 */

import { scanClasses } from "./scanner";
import {
  collectSourceFiles,
  loadStylesheet,
  readSourceFiles,
  type SourceWalkOptions,
} from "./resolve";
import { type ExtractOptions, type ExtractResult, extractStylesheet } from "./extractor";

export interface RoyCssPipelineOptions {
  /** Absolute path to the compiled RoyCSS stylesheet. Default: resolved from the conventional locations. */
  stylesheet?: string;
  /** Classes always treated as used (escape hatch for dynamically-built class names). */
  include?: string[];
}

export interface RoyCssPipeline {
  /** Absolute path of the stylesheet backing this pipeline. */
  readonly stylesheetPath: string;
  /** The full stylesheet text. */
  readonly source: string;
  /** Add classes to the used-set. Returns how many were new. */
  addClasses(classes: Iterable<string>): number;
  /** Scan a source string (JSX/TSX/HTML/…) and register found classes. Returns how many were new. */
  scanSource(source: string): number;
  /** Scan files from disk. Returns how many classes were new. */
  scanFiles(files: readonly string[]): number;
  /** Walk `roots` (dirs or files) and scan every source file found. Returns how many classes were new. */
  scanDirectories(roots: readonly string[], options?: SourceWalkOptions): number;
  /** Current used-class registry (sorted). */
  classes(): string[];
  /** Run the dependency-aware extraction. */
  extract(options?: ExtractOptions): ExtractResult;
  /**
   * PostCSS-style string pipeline: replaces `@import "roycss.css"` (and
   * `layer(…)`-qualified variants) inside `css` with the extracted subset.
   * Non-RoyCSS imports and all other CSS pass through untouched.
   */
  process(css: string, options?: ExtractOptions): string;
}

/** Matches `@import "roycss.css";`, `@import url(./roycss.css);`, `@import "roycss/css" layer(effects);` … */
const CSS_IMPORT_RE =
  /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*(?:layer\s*\(\s*([A-Za-z0-9_-]+)\s*\))?[^;]*;/gi;

/** True when an `@import` URL points at the RoyCSS stylesheet (npm export, dist file or vendored copy). */
export function isRoyCssImportUrl(url: string): boolean {
  const normalized = url.replace(/^\.\//, "").toLowerCase();
  const basename = normalized.split("/").pop() ?? "";
  return (
    normalized === "roycss" ||
    normalized === "roycss/css" ||
    basename === "roycss.css" ||
    basename === "roycss.min.css" ||
    normalized.includes("roycss/dist/")
  );
}

/** Extract a `layer(name)` qualifier from an `@import` prelude, if present. */
export function parseImportLayer(prelude: string): string | undefined {
  const match = /layer\s*\(\s*([A-Za-z0-9_-]+)\s*\)/i.exec(prelude);
  return match?.[1];
}

/**
 * Create a pipeline bound to a stylesheet and (optionally) a set of classes
 * that are always used.
 */
export function createRoyCssPipeline(options: RoyCssPipelineOptions = {}): RoyCssPipeline {
  const stylesheetPath = options.stylesheet ?? "";
  if (!stylesheetPath) {
    throw new Error("[roycss] createRoyCssPipeline requires a `stylesheet` path.");
  }
  const source = loadStylesheet(stylesheetPath);
  const used = new Set<string>(options.include ?? []);

  const register = (classes: readonly string[]): number => {
    let added = 0;
    for (const cls of classes) {
      if (cls && !used.has(cls)) {
        used.add(cls);
        added++;
      }
    }
    return added;
  };

  return {
    stylesheetPath,
    source,
    addClasses(classes) {
      return register([...classes]);
    },
    scanSource(sourceText) {
      return register(scanClasses(sourceText));
    },
    scanFiles(files) {
      let added = 0;
      for (const text of readSourceFiles(files)) added += register(scanClasses(text));
      return added;
    },
    scanDirectories(roots, walkOptions) {
      return register(scanFilesFrom(roots, walkOptions));
    },
    classes() {
      return [...used].sort();
    },
    extract(extractOptions) {
      return extractStylesheet(source, used, extractOptions);
    },
    process(css, extractOptions) {
      const classes = [...used];
      if (classes.length === 0) {
        // Nothing scanned yet — leave the stylesheet untouched (see README).
        return css;
      }
      const extracted = extractStylesheet(source, used, extractOptions).css;
      return css.replace(CSS_IMPORT_RE, (match, url: string) => {
        if (!isRoyCssImportUrl(url)) return match;
        const layer = parseImportLayer(match);
        return layer ? `@layer ${layer} {\n${extracted}}` : extracted;
      });
    },
  };
}

function scanFilesFrom(roots: readonly string[], options?: SourceWalkOptions): string[] {
  const files = collectSourceFiles(roots, options);
  const found = new Set<string>();
  for (const text of readSourceFiles(files)) {
    for (const cls of scanClasses(text)) found.add(cls);
  }
  return [...found].sort();
}
