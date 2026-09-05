/**
 * Filesystem helpers shared by the build plugins: stylesheet loading and
 * default resolution, plus a small source-tree walker used for pre-scanning
 * consumer apps.
 */

import { type Dirent, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Source file extensions the plugins scan for class usage. */
export const DEFAULT_SOURCE_EXTENSIONS: readonly string[] = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".astro",
  ".html",
  ".htm",
  ".mdx",
  ".md",
];

/** Directory names never entered while walking source roots. */
export const DEFAULT_IGNORE_DIRS: readonly string[] = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  "playwright-report",
  ".turbo",
  ".cache",
  ".vercel",
  ".roycss",
];

/**
 * Default candidates for the shipped RoyCSS stylesheet, in priority order:
 * the npm package layout first (`roycss/css`), then the repo layout used by
 * this repository (`dist/roycss.css`), then a vendored copy at the root.
 */
export function defaultStylesheetCandidates(root: string): string[] {
  return [
    join(root, "node_modules", "roycss", "dist", "roycss.css"),
    join(root, "node_modules", "roycss", "roycss.css"),
    join(root, "dist", "roycss.css"),
    join(root, "roycss.css"),
  ];
}

/** Read a stylesheet from disk (UTF-8) with a helpful error message. */
export function loadStylesheet(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`[roycss] Could not read stylesheet at ${path}`);
  }
}

/** First existing candidate among `candidates`; throws with all paths listed when none exists. */
export function resolveStylesheet(candidates: readonly string[]): string {
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `[roycss] No RoyCSS stylesheet found. Tried:\n${candidates.map((c) => `  - ${c}`).join("\n")}\n` +
      "Pass an explicit `css` option pointing at your roycss.css.",
  );
}

export interface SourceWalkOptions {
  extensions?: readonly string[];
  ignoreDirs?: readonly string[];
  /** Safety cap so a misconfigured root can't walk a monorepo forever. */
  maxFiles?: number;
}

/** True when `path` exists and is a directory. */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Collect scannable source files under `roots` (files are passed through,
 * directories are walked recursively). Order is deterministic.
 */
export function collectSourceFiles(
  roots: readonly string[],
  options: SourceWalkOptions = {},
): string[] {
  const extensions = options.extensions ?? DEFAULT_SOURCE_EXTENSIONS;
  const ignoreDirs = new Set(options.ignoreDirs ?? DEFAULT_IGNORE_DIRS);
  const maxFiles = options.maxFiles ?? 20_000;
  const files: string[] = [];

  const walkDir = (dir: string): void => {
    if (files.length >= maxFiles) return;
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (files.length >= maxFiles) return;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) walkDir(full);
      } else if (entry.isFile() && extensions.includes(extOf(entry.name))) {
        files.push(full);
      }
    }
  };

  for (const root of roots) {
    if (files.length >= maxFiles) break;
    if (!existsSync(root)) continue;
    if (isDirectory(root)) {
      walkDir(root);
    } else {
      files.push(root);
    }
  }
  return files;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/** Read + concatenate files (used with {@link collectSourceFiles}). */
export function readSourceFiles(files: readonly string[]): string[] {
  const sources: string[] = [];
  for (const file of files) {
    try {
      sources.push(readFileSync(file, "utf8"));
    } catch {
      // Unreadable files are skipped — a scan must never break a build.
    }
  }
  return sources;
}
