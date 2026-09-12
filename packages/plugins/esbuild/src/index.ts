/**
 * @roycss/plugin-esbuild — esbuild plugin for RoyCSS.
 *
 * Ships only the CSS your classes need instead of the full 1,959-effect
 * stylesheet (~1.6 MB):
 *
 *   • `setup(build)` resolves the stylesheet (default: the shipped
 *     artifact, from `build.initialOptions.absWorkingDir`), pre-scans the
 *     project tree (default `<root>/src` + `<root>/index.html`, plus the
 *     `scan` option) and registers two `onLoad` callbacks:
 *
 *   • Stylesheet swap — any `roycss.css` / `roycss.min.css` file that IS
 *     the resolved stylesheet is served the extracted subset in place of
 *     its file contents (one-shot builds extract AOT; `watch: true`
 *     serves the full stylesheet by default so rebuilds never go stale —
 *     opt into live extraction with `dev: "extract"`).
 *
 *   • Marking — scannable modules (js/ts/tsx/jsx/vue/svelte/astro/html/md)
 *     outside `node_modules` are read here, scanned for `r-*`/`roycss-*`
 *     usage and served verbatim.
 *
 * watchFiles (the important part): esbuild only AUTO-watches files it
 * reads itself. Any file whose contents THIS plugin serves is invisible
 * to esbuild's watcher unless we return it in `watchFiles` — without it,
 * plugin-served modules would never trigger watch rebuilds. Both
 * content-serving onLoads below therefore return `watchFiles` alongside
 * `contents` (pinned by tests).
 *
 * Zero-config: the shipped stylesheet is resolved from
 * `node_modules/roycss/dist/roycss.css` / `dist/roycss.css` / `roycss.css`
 * (override with the `css` option — the default is the shipped artifact).
 *
 * Honesty note: esbuild is not a dependency of this repo's dev tree, so
 * the `Plugin`/`Build`/`OnLoadResult` types below are STRUCTURAL mirrors
 * of esbuild's documented plugin API — not the generated
 * `esbuild`/`@types/esbuild` types.
 */

import { existsSync, readFileSync } from "node:fs";
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

export interface RoyCssEsbuildOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /** Extra roots (dirs or files) scanned at setup time. Default: `<root>/src` + `<root>/index.html`. */
  scan?: string[];
  /** Classes always treated as used (escape hatch for dynamic class names). */
  include?: string[];
  /**
   * Watch-mode behaviour (`watch: true`):
   *   • `"full"` (default) — serve the full stylesheet; rebuilds never serve a stale subset;
   *   • `"extract"` — serve the live-extracted subset. NOTE: esbuild only re-runs the
     * stylesheet onLoad when a watched file changes, so a newly-used class
     * may need one more rebuild (or the default full mode) to appear.
   */
  dev?: "full" | "extract";
}

/** Structural mirror of esbuild's `OnLoadArgs`. */
export interface EsbuildOnLoadArgsLike {
  path: string;
  namespace: string;
  suffix: string;
  pluginData: unknown;
}

/** Structural mirror of esbuild's `OnLoadResult` (contents + watch wiring). */
export interface EsbuildOnLoadResultLike {
  contents: string;
  loader?: string;
  watchFiles?: string[];
  watchDirs?: string[];
  resolveDir?: string;
}

/** Structural mirror of the esbuild `Plugin` interface. */
export interface EsbuildPluginLike {
  name: string;
  setup(build: EsbuildBuildLike): void;
}

/** Structural mirror of the esbuild `Build` plugin-facade passed to `setup`. */
export interface EsbuildBuildLike {
  initialOptions: {
    absWorkingDir?: string | undefined;
    watch?: boolean | unknown | undefined;
  };
  onLoad(filter: RegExp, callback: (args: EsbuildOnLoadArgsLike) => EsbuildOnLoadResultLike | null | undefined): void;
  onResolve(
    filter: RegExp,
    callback: (args: { path: string; importer: string; namespace: string; pluginData: unknown; resolveDir: string }) =>
      | { path: string; namespace?: string }
      | null
      | undefined,
  ): void;
}

function defaultScanRoots(root: string): string[] {
  return [join(root, "src"), join(root, "index.html")].filter((p) => existsSync(p));
}

/** Basename must be exactly `roycss.css` / `roycss.min.css` (the shipped artifact names). */
const STYLESHEET_FILTER = /(?:^|[/\\])roycss(?:\.min)?\.css$/;
/** Scannable source files — .css is deliberately absent (handled by the stylesheet onLoad). */
const SCANNABLE_FILTER = /\.(?:[cm]?[jt]sx?|vue|svelte|astro|html?|mdx|md)$/;

/** Create the RoyCSS esbuild plugin. */
export default function roycssEsbuild(options: RoyCssEsbuildOptions = {}): EsbuildPluginLike {
  return {
    name: "@roycss/plugin-esbuild",
    setup(build) {
      const root = build.initialOptions.absWorkingDir ?? process.cwd();
      const cssPath = options.css
        ? resolvePath(root, options.css)
        : resolveStylesheet(defaultStylesheetCandidates(root));
      const fullCss = loadStylesheet(cssPath);
      const used = new Set<string>(options.include ?? []);
      const warnState = { warned: false };

      // Pre-scan the project tree at setup time (mirrors vite's
      // configResolved pre-scan — onLoad only sees modules esbuild loads).
      const scanRoots = [...defaultScanRoots(root), ...(options.scan ?? [])];
      for (const text of readSourceFiles(collectSourceFiles(scanRoots))) {
        for (const cls of scanClasses(text)) used.add(cls);
      }

      const watching = Boolean(build.initialOptions.watch);
      const serveFull = watching && (options.dev ?? "full") === "full";

      const cssToServe = (): string => {
        if (serveFull || used.size === 0) {
          if (!serveFull && used.size === 0 && !warnState.warned) {
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

      // onLoad 1 — stylesheet swap: the resolved stylesheet is served the
      // subset (AOT in one-shot builds, full by default under watch).
      // esbuild only auto-watches files it reads itself — a served
      // stylesheet must be returned with `watchFiles` or watch mode would
      // never rebuild when it changes.
      build.onLoad(STYLESHEET_FILTER, (args) => {
        if (args.path !== cssPath) return null; // only swap OUR stylesheet, never a vendored copy
        return { contents: cssToServe(), watchFiles: [cssPath] };
      });

      // onLoad 2 — marking: scannable modules are read + scanned here and
      // served verbatim. Served modules are invisible to esbuild's watcher
      // without `watchFiles` — returning the path alongside `contents` is
      // what keeps watch-mode rebuilds working.
      build.onLoad(SCANNABLE_FILTER, (args) => {
        if (args.path.includes("/node_modules/")) return null;
        if (args.path === cssPath) return null; // (unreachable — .css is not scannable — kept for clarity)
        let code: string;
        try {
          code = readFileSync(args.path, "utf8");
        } catch {
          return null; // Unreadable file — decline so esbuild reports it / fails open.
        }
        for (const cls of scanClasses(code)) used.add(cls);
        return { contents: code, watchFiles: [args.path] };
      });
    },
  };
}

/** Named export (preferred by some setups over the default export). */
export const roycss = roycssEsbuild;
