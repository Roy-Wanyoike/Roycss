/**
 * @roycss/plugin-vite — zero-config Vite plugin for RoyCSS.
 *
 * Dev (`vite dev`):
 *   • every transformed module is scanned and its `r-*` / `roycss-*` usage
 *     is registered (the "marking" transform — it never rewrites module
 *     code, so HMR stays untouched);
 *   • by default the stylesheet is served in full — always correct, zero
 *     HMR risk. Opt into live extraction with `dev: "extract"`.
 *
 * Build (`vite build`):
 *   • the project source tree is pre-scanned at `configResolved`, the
 *     per-module transform adds anything the walk missed, and the
 *     stylesheet is swapped for the extracted subset (AOT) — either in
 *     place (for `import "roycss.css"` style usage) or through the
 *     `virtual:roycss/css` module.
 *
 * Zero-config: the shipped stylesheet is resolved from
 * `node_modules/roycss/dist/roycss.css` / `dist/roycss.css` / `roycss.css`
 * (override with the `css` option — the default is the shipped artifact).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import {
  collectSourceFiles,
  defaultStylesheetCandidates,
  extractStylesheet,
  loadStylesheet,
  resolveStylesheet,
  scanClasses,
} from "../../core/src/index";

export interface RoyCssViteOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /** Extra roots (dirs or files) scanned at build time. Default: `<root>/src` + `<root>/index.html`. */
  scan?: string[];
  /** Classes always treated as used (escape hatch for dynamic class names). */
  include?: string[];
  /**
   * Dev behaviour:
   *   • `"full"` (default) — serve the full stylesheet; always HMR-safe;
   *   • `"extract"` — serve the live-extracted subset; a full page reload
   *     is triggered whenever new classes appear (the CSS must refresh).
   */
  dev?: "full" | "extract";
  /** Inline the extracted CSS into the HTML entry at build time. Default: false. */
  inject?: boolean;
}

/** Import this module id in your entry: `import "virtual:roycss/css"`. */
export const ROYCSS_VIRTUAL_MODULE = "virtual:roycss/css";
const RESOLVED_VIRTUAL_MODULE = "\0virtual:roycss/css";

/**
 * Minimal structural view of the Vite dev server (deliberately loose so the
 * plugin's types stay decoupled from any one Vite major).
 */
interface ViteDevServerLike {
  ws?: { send?: (payload: unknown) => void };
}

const SCANNABLE_EXT = /\.(?:[cm]?[jt]sx?|vue|svelte|astro|html?|mdx|md)$/;

function isScannableId(id: string): boolean {
  const clean = id.split("?")[0];
  if (clean.startsWith("\0") || clean.includes("virtual:")) return false;
  if (clean.includes("/node_modules/")) return false;
  if (/\.css(?:$|\?)/.test(clean)) return false;
  return SCANNABLE_EXT.test(clean);
}

function defaultScanRoots(root: string): string[] {
  return [join(root, "src"), join(root, "index.html")].filter((p) => existsSync(p));
}

function readAll(files: readonly string[]): string[] {
  const sources: string[] = [];
  for (const file of files) {
    try {
      sources.push(readFileSync(file, "utf8"));
    } catch {
      // Unreadable files are skipped — scanning must never break a build.
    }
  }
  return sources;
}

/** Create the RoyCSS Vite plugin. */
export default function roycssVite(options: RoyCssViteOptions = {}): Plugin {
  const devMode = options.dev ?? "full";

  let command: "build" | "serve" = "build";
  let cssPath = "";
  let fullCss = "";
  const used = new Set<string>(options.include ?? []);
  const warnState = { warned: false };
  let devServer: ViteDevServerLike | undefined;
  let lastEmittedCss = "";

  const addFound = (classes: readonly string[]): number => {
    let added = 0;
    for (const cls of classes) {
      if (cls && !used.has(cls)) {
        used.add(cls);
        added++;
      }
    }
    return added;
  };

  const extractCss = (): string => {
    if (used.size === 0) {
      if (!warnState.warned) {
        warnState.warned = true;
        console.warn(
          "[roycss] No r-*/roycss-* classes were found — emitting the FULL stylesheet. " +
            "If this is wrong, check the `scan` roots or add an `include` list.",
        );
      }
      return fullCss;
    }
    return extractStylesheet(fullCss, used).css;
  };

  /** Live-extraction is active: `dev: "extract"` in serve mode (build always extracts AOT). */
  const serveExtracted = (): boolean => command === "serve" && devMode === "extract";
  /** CSS to emit: full stylesheet only in dev-full mode; extracted otherwise (AOT). */
  const cssToServe = (): string => (command === "serve" && devMode === "full" ? fullCss : extractCss());

  const reload = (): void => {
    try {
      devServer?.ws?.send?.({ type: "full-reload" });
    } catch {
      // Best-effort: the next full page load picks up the CSS anyway.
    }
  };

  const plugin: Plugin = {
    name: "@roycss/plugin-vite",
    enforce: "pre",

    configResolved(config: { command: "build" | "serve"; root: string }) {
      command = config.command;
      const root = config.root;
      cssPath = options.css ? options.css : resolveStylesheet(defaultStylesheetCandidates(root));
      fullCss = loadStylesheet(cssPath);

      // Build: pre-scan the project so the registry is complete before any
      // CSS module is transformed (transform order is not guaranteed).
      if (command === "build") {
        const roots = [...defaultScanRoots(root), ...(options.scan ?? [])];
        addFound(scanClasses(readAll(collectSourceFiles(roots)).join("\n")));
      }
    },

    resolveId(id: string) {
      if (id === ROYCSS_VIRTUAL_MODULE) return RESOLVED_VIRTUAL_MODULE;
      return null;
    },

    load(id: string) {
      if (id === RESOLVED_VIRTUAL_MODULE) {
        lastEmittedCss = cssToServe();
        return lastEmittedCss;
      }
      return null;
    },

    transform(code: string, id: string) {
      // Swap the real stylesheet in place (for `import "roycss.css"` users).
      if (cssPath && id.split("?")[0] === cssPath) {
        if (command === "serve" && devMode === "full") return null;
        return { code: extractCss(), map: null };
      }

      // Marking transform: register classes found in source modules.
      if (!isScannableId(id)) return null;
      const added = addFound(scanClasses(code));
      if (added > 0 && serveExtracted()) {
        const next = extractCss();
        if (next !== lastEmittedCss) {
          lastEmittedCss = next;
          reload();
        }
      }
      return null; // module code is never rewritten → HMR-safe
    },

    configureServer(server: ViteDevServerLike) {
      devServer = server;
    },
  };

  if (options.inject) {
    plugin.transformIndexHtml = {
      order: "post",
      handler(html: string) {
        if (command !== "build") return html;
        return {
          html,
          tags: [
            {
              tag: "style",
              children: extractCss(),
              injectTo: "head",
            },
          ],
        };
      },
    };
  }

  return plugin;
}

/** Named export (preferred by some setups over the default export). */
export const roycss = roycssVite;
