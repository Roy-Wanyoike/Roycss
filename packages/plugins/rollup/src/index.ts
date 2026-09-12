/**
 * @roycss/plugin-rollup — Rollup plugin for RoyCSS.
 *
 * Ships only the CSS your classes need instead of the full 1,959-effect
 * stylesheet (~1.6 MB), using the same two consumption modes as the Vite
 * adapter (Rollup's plugin API is the API Vite builds on):
 *
 *   • `import "virtual:roycss/css"` — resolved to a virtual module whose
 *     `load` serves the extracted subset (AOT);
 *   • `import "roycss.css"` — the real stylesheet module is swapped in
 *     place by the `transform` hook.
 *
 *   • The `transform` hook also performs the "marking" scan: it registers
 *     `r-*`/`roycss-*` usage found in module code and never rewrites it
 *     (returns null), so the plugin is watch-safe.
 *   • `buildStart` resolves the stylesheet (default: the shipped artifact)
 *     and pre-scans the project tree (default `<root>/src` +
 *     `<root>/index.html`, plus the `scan` option).
 *   • `emit: true` additionally emits the subset as a Rollup asset
 *     (`assetName`, default `"roycss.css"`) from `generateBundle` — for
 *     setups that reference the stylesheet via a `<link>` tag instead of
 *     an import. Importing AND emitting the same CSS would duplicate it;
 *     `emit` defaults to false.
 *
 * Rollup has no dev server — extraction is always AOT (there is no `dev`
 * option by design; see the README compatibility notes).
 *
 * Honesty note: Rollup is not a dependency of this repo's dev tree, so the
 * `Plugin` types below are STRUCTURAL mirrors of Rollup's documented
 * plugin API (hook names + `this.emitFile`), not the generated
 * `rollup`/@types/rollup types.
 */

import { existsSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import {
  collectSourceFiles,
  defaultStylesheetCandidates,
  extractStylesheet,
  loadStylesheet,
  readSourceFiles,
  resolveStylesheet,
  scanClasses,
} from "../../core/src/index";

export interface RoyCssRollupOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /** Roots (dirs or files) scanned for class usage (replaces the default roots). Default: `<cwd>/src` + `<cwd>/index.html`. */
  scan?: string[];
  /** Classes always treated as used (escape hatch for dynamic class names). */
  include?: string[];
  /** Also emit the subset as a Rollup asset (for `<link>`-tag consumers). Default: false. */
  emit?: boolean;
  /** File name of the emitted asset when `emit: true`. Default: `"roycss.css"`. */
  assetName?: string;
}

/**
 * Structural mirror of the Rollup plugin context (`this` inside hooks) —
 * only `emitFile` is used.
 */
export interface RollupPluginContextLike {
  emitFile(reference: { type: "asset"; name?: string; fileName?: string; source: string | Buffer }): string;
}

/** Structural mirror of the Rollup `Plugin` interface (the hooks this plugin uses). */
export interface RollupPluginLike {
  name: string;
  buildStart(this: RollupPluginContextLike, options: { input?: unknown }): void;
  resolveId(source: string, importer?: string): string | null;
  load(id: string): string | null;
  transform(this: RollupPluginContextLike, code: string, id: string): { code: string; map: null } | null;
  generateBundle(this: RollupPluginContextLike, options: { dir?: string }, bundle: Record<string, unknown>): void;
}

/** Import this module id in your entry: `import "virtual:roycss/css"`. */
export const ROYCSS_VIRTUAL_MODULE = "virtual:roycss/css";
const RESOLVED_VIRTUAL_MODULE = "\0virtual:roycss/css";

function defaultScanRoots(root: string): string[] {
  return [join(root, "src"), join(root, "index.html")].filter((p) => existsSync(p));
}

/** Create the RoyCSS Rollup plugin. */
export default function roycssRollup(options: RoyCssRollupOptions = {}): RollupPluginLike {
  let cssPath = "";
  let fullCss = "";
  const used = new Set<string>(options.include ?? []);
  const warnState = { warned: false };

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

  return {
    name: "@roycss/plugin-rollup",

    buildStart() {
      // Rollup runs with cwd = project root (like PostCSS inside Next.js);
      // plugins have no root signal of their own.
      const root = process.cwd();
      cssPath = options.css ? resolvePath(root, options.css) : resolveStylesheet(defaultStylesheetCandidates(root));
      fullCss = loadStylesheet(cssPath);

      // `scan` REPLACES the default roots (same semantics as the Next.js
      // adapter — pass explicit roots when your project layout is custom).
      const scanRoots = options.scan ?? defaultScanRoots(root);
      for (const text of readSourceFiles(collectSourceFiles(scanRoots))) {
        for (const cls of scanClasses(text)) used.add(cls);
      }
    },

    resolveId(source) {
      if (source === ROYCSS_VIRTUAL_MODULE) return RESOLVED_VIRTUAL_MODULE;
      return null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE) return extractCss();
      return null;
    },

    transform(code, id) {
      // Swap the real stylesheet in place (for `import "roycss.css"` users).
      if (cssPath && id.split("?")[0] === cssPath) {
        return { code: extractCss(), map: null };
      }

      // Marking transform: register classes found in scannable source modules.
      const clean = id.split("?")[0];
      if (clean.startsWith("\0") || clean.includes("/node_modules/")) return null;
      if (!/\.(?:[cm]?[jt]sx?|vue|svelte|astro|html?|mdx|md)$/.test(clean)) return null;
      for (const cls of scanClasses(code)) used.add(cls);
      return null; // module code is never rewritten → watch-safe
    },

    generateBundle() {
      if (!options.emit) return;
      this.emitFile({
        type: "asset",
        name: options.assetName ?? "roycss.css",
        source: extractCss(),
      });
    },
  };
}

/** Named export (preferred by some setups over the default export). */
export const roycss = roycssRollup;
