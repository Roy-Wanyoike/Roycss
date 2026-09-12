/**
 * @roycss/plugin-webpack — webpack 5 plugin for RoyCSS.
 *
 * Ships only the CSS your classes need instead of the full 1,959-effect
 * stylesheet (~1.6 MB):
 *
 *   • `apply(compiler)` taps `compilation.hooks.processAssets` at the
 *     PRE_PROCESS stage (before any other plugin touches assets) with
 *     `additionalAssets: true`.
 *   • The project source tree (default `<root>/src` + `<root>/index.html`,
 *     plus the `scan` option) is (re-)scanned on every compilation, so
 *     watch-mode rebuilds pick up new classes.
 *   • Asset matching: an emitted asset whose name ends in
 *     `roycss.css`/`roycss.min.css` AND whose content is byte-identical to
 *     the resolved full stylesheet is *the* stylesheet asset — it is
 *     replaced in place (`compilation.updateAsset`) with the extracted
 *     subset. A name match alone is not enough (a user-vendored, modified
 *     `roycss.css` is never clobbered).
 *   • If no asset matches, the subset is emitted as a new asset
 *     (`roycss.css` by default, or `assetName`) — unless `emit: false`.
 *   • `mode: "development"` serves the full stylesheet by default
 *     (HMR/refresh-safe); opt into live extraction with `dev: "extract"`.
 *
 * webpack 5 asset-map shape (verified against the bundled webpack 5
 * implementation in `next/dist/compiled/webpack/bundle5.js` —
 * `emitAsset(v,I,P={}){…this.assets[v]…}`):
 * `compilation.assets[name]` values ARE the Source objects —
 * `assets[name].source()` returns `string | Buffer`. They are NOT
 * `{ source: Source }` wrappers; that shape belongs to the chunk-asset
 * info records. The read below therefore calls `.source()` on the asset
 * itself, with Buffer tolerance.
 *
 * Honesty note: webpack is not a dependency of this repo's dev tree, so
 * the Compiler/Compilation/Source types below are STRUCTURAL mirrors of
 * webpack 5's documented plugin API (`tapable` hook shapes), verified
 * against the webpack 5 sources bundled with Next.js — not against a
 * live webpack build. The test harnesses in `tests/unit/plugins-webpack.test.ts`
 * replicate the real asset-map shape (Source objects, including a
 * Buffer-returning Source regression test) so the two cannot drift.
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

export interface RoyCssWebpackOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /** Extra roots (dirs or files) scanned on every compilation. Default: `<root>/src` + `<root>/index.html`. */
  scan?: string[];
  /** Classes always treated as used (escape hatch for dynamic class names). */
  include?: string[];
  /**
   * Development behaviour (`mode: "development"`):
   *   • `"full"` (default) — keep the full stylesheet asset (HMR/refresh-safe);
   *   • `"extract"` — replace it with the extracted subset on every rebuild.
   */
  dev?: "full" | "extract";
  /** Emit the subset as a new asset when no stylesheet asset is found. Default: true. */
  emit?: boolean;
  /** Name of the emitted asset when `emit` fires. Default: `"roycss.css"`. */
  assetName?: string;
}

/**
 * Structural mirror of webpack's `Source` contract: `source()` returns the
 * asset contents as `string | Buffer`.
 */
export interface WebpackAssetSourceLike {
  source(): string | Buffer;
  size?(): number;
}

/** Structural mirror of the webpack 5 `Compilation` surface this plugin uses. */
export interface WebpackCompilationLike {
  /** Asset map — webpack 5: the values ARE the Source objects (`assets[name].source()`). */
  assets: Record<string, WebpackAssetSourceLike>;
  hooks: {
    processAssets: {
      tap(options: { name: string; stage?: number; additionalAssets?: boolean }, fn: (assets: Record<string, WebpackAssetSourceLike>) => void): void;
    };
  };
  emitAsset(name: string, source: WebpackAssetSourceLike, assetInfo?: unknown): void;
  updateAsset(name: string, source: WebpackAssetSourceLike, assetInfo?: unknown): void;
}

/** Structural mirror of the webpack 5 `Compiler` surface this plugin uses. */
export interface WebpackCompilerLike {
  options?: { mode?: string | undefined };
  context?: string | undefined;
  hooks: {
    compilation: {
      tap(name: string, fn: (compilation: WebpackCompilationLike) => void): void;
    };
  };
}

/** Structural mirror of a webpack 5 plugin. */
export interface WebpackPluginLike {
  name: string;
  apply(compiler: WebpackCompilerLike): void;
}

/**
 * Minimal structural equivalent of `webpack-sources`' `RawSource` (the
 * dependency is not bundled — webpack accepts any `{ source, size }`
 * object as an asset Source).
 */
export function roycssStringSource(text: string): WebpackAssetSourceLike & { size(): number } {
  return {
    source: () => text,
    size: () => Buffer.byteLength(text, "utf8"),
  };
}

/** `webpack.ProcessAssetsStage.PRE_PROCESS` — run before every other asset-pipeline stage. */
const PROCESS_ASSETS_STAGE_PRE_PROCESS = -10000;

/** Asset basenames treated as stylesheet candidates (name match only — content is verified separately). */
const STYLESHEET_BASENAMES = new Set(["roycss.css", "roycss.min.css"]);

function isStylesheetAssetName(name: string): boolean {
  const base = name.split(/[/\\]/).pop() ?? "";
  return STYLESHEET_BASENAMES.has(base.toLowerCase());
}

function defaultScanRoots(root: string): string[] {
  return [join(root, "src"), join(root, "index.html")].filter((p) => existsSync(p));
}

/**
 * Read an asset's text with Buffer tolerance — `Source#source()` may return
 * either `string` or `Buffer` in webpack 5.
 */
function assetText(source: WebpackAssetSourceLike): string {
  const raw = source.source();
  return typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8");
}

/**
 * Build the RoyCSS webpack plugin engine. `pluginName` brands the taps and
 * the returned plugin; `@roycss/plugin-rspack` reuses this exact engine
 * (Rspack implements the webpack 5 plugin API).
 */
export function createRoyCssWebpackEngine(pluginName: string, options: RoyCssWebpackOptions = {}): WebpackPluginLike {
  const devMode = options.dev ?? "full";

  let cssPath = "";
  let fullCss = "";
  let root = "";
  const used = new Set<string>(options.include ?? []);
  const warnState = { noClasses: false, collision: false };

  const extractCss = (): string => {
    if (used.size === 0) {
      if (!warnState.noClasses) {
        warnState.noClasses = true;
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
    name: pluginName,
    apply(compiler) {
      root = compiler.context ?? process.cwd();
      cssPath = options.css ? resolvePath(root, options.css) : resolveStylesheet(defaultStylesheetCandidates(root));
      fullCss = loadStylesheet(cssPath);

      compiler.hooks.compilation.tap(pluginName, (compilation) => {
        compilation.hooks.processAssets.tap(
          { name: pluginName, stage: PROCESS_ASSETS_STAGE_PRE_PROCESS, additionalAssets: true },
          (assets) => {
            // (Re-)scan the project tree on every compilation so watch-mode
            // rebuilds register newly added classes.
            const scanRoots = [...defaultScanRoots(root), ...(options.scan ?? [])];
            for (const text of readSourceFiles(collectSourceFiles(scanRoots))) {
              for (const cls of scanClasses(text)) used.add(cls);
            }

            // Development mode keeps the full stylesheet by default
            // (`mode: "development"` — the webpack-native signal).
            const development = compiler.options?.mode === "development";
            const css = development && devMode === "full" ? fullCss : extractCss();

            // Find the stylesheet asset: name candidates whose content is
            // byte-identical to the resolved full stylesheet. A name match
            // alone never replaces a user-modified vendored copy.
            let matched = false;
            for (const name of Object.keys(assets)) {
              if (!isStylesheetAssetName(name)) continue;
              let text: string;
              try {
                // webpack 5: the asset map values ARE the Source objects —
                // read `.source()` directly (string or Buffer), never a
                // `.source.source()` double-unwrap.
                text = assetText(assets[name]);
              } catch {
                continue; // Unreadable asset — skip, fail-open.
              }
              if (text === fullCss) {
                matched = true;
                if (css !== fullCss) {
                  compilation.updateAsset(name, roycssStringSource(css));
                }
              }
            }

            if (matched) return;

            // No stylesheet asset in the bundle — emit one (unless disabled).
            if (options.emit === false) return;
            const emitName = options.assetName ?? "roycss.css";
            if (assets[emitName] !== undefined) {
              if (!warnState.collision) {
                warnState.collision = true;
                console.warn(
                  `[roycss] An asset named "${emitName}" already exists but does not match the RoyCSS ` +
                    `stylesheet — not emitting over it. Point the \`css\` option at the right file, or pass \`emit: false\`.`,
                );
              }
              return;
            }
            compilation.emitAsset(emitName, roycssStringSource(css));
          },
        );
      });
    },
  };
}

/** Create the RoyCSS webpack 5 plugin. */
export default function roycssWebpack(options: RoyCssWebpackOptions = {}): WebpackPluginLike {
  return createRoyCssWebpackEngine("@roycss/plugin-webpack", options);
}

/** Named export (preferred by some setups over the default export). */
export const roycss = roycssWebpack;
