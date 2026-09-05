/**
 * @roycss/plugin-next — Next.js (app router) integration for RoyCSS.
 *
 * Exports the documented plugin API shape:
 *
 *   • `withRoyCss(nextConfig, options)` — drop-in `next.config` wrapper.
 *     At config-eval time (every `next dev` / `next build` start) it scans
 *     the app source tree, extracts the used-CSS subset and writes it to
 *     `.roycss/roycss.css`; your `app/layout.tsx` imports that file.
 *     In dev the full stylesheet is written instead (always HMR-safe);
 *     in `next build` the extracted subset is written (AOT).
 *
 *   • `createRoyCssPostcssPlugin()` — the PostCSS-style pipeline option:
 *     a real PostCSS plugin that rewrites `@import "roycss.css"` inside
 *     your `globals.css` into the extracted subset at CSS-compile time
 *     (wire it from `postcss.config.mjs`).
 *
 *   • `roycssCriticalStyle()` / `roycssCriticalStyleTag()` — SSR
 *     critical-CSS injection hooks for server components.
 *
 * Zero-config: the shipped stylesheet is resolved from
 * `node_modules/roycss/dist/roycss.css` / `dist/roycss.css` / `roycss.css`
 * (override with the `css` option — the default is the shipped artifact).
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { NextConfig } from "next";
import type { AtRule as PostcssAtRule, PluginCreator, Root } from "postcss";
import {
  collectSourceFiles,
  createRoyCssPipeline,
  defaultStylesheetCandidates,
  isRoyCssImportUrl,
  parseImportLayer,
  resolveStylesheet,
  type RoyCssPipeline,
  type RoyCssPipelineOptions,
  type SourceWalkOptions,
} from "../../core/src/index";

export { createRoyCssPipeline } from "../../core/src/index";
export type { RoyCssPipeline, RoyCssPipelineOptions } from "../../core/src/index";

export interface RoyCssNextOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /**
   * Generation strategy:
   *   • `"generate"` (default) — write `.roycss/roycss.css` at config-eval
   *     time (dev: full stylesheet, build: extracted subset);
   *   • `"postcss"` — no file is written; use `createRoyCssPostcssPlugin()`
   *     in `postcss.config.mjs` and keep `@import "roycss.css"` in your
   *     `globals.css`.
   */
  pipeline?: "generate" | "postcss";
  /** Roots (dirs or files) scanned for class usage. Default: `app`, `src`, `pages`, `components`, `lib`, `index.html` under the project root. */
  scan?: string[];
  /** Classes always treated as used (escape hatch for dynamic class names). */
  include?: string[];
  /** Output directory for the generated stylesheet. Default: `<root>/.roycss`. */
  outDir?: string;
}

export interface RoyCssCriticalOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /** Restrict critical CSS to these classes. Default: every class found by scanning the default roots. */
  classes?: string[];
  /** Roots (dirs or files) scanned when `classes` is not provided. */
  scan?: string[];
  /** Classes always included on top of `classes`. */
  include?: string[];
  /** Keep class-less base rules (resets, tokens, a11y guards). Default: true. */
  includeBase?: boolean;
}

/** Conventional app-router / pages-router source locations. */
function defaultScanRoots(root: string): string[] {
  return [
    join(root, "app"),
    join(root, "src"),
    join(root, "pages"),
    join(root, "components"),
    join(root, "lib"),
    join(root, "index.html"),
  ].filter((p) => existsSync(p));
}

function resolveStylesheetPath(css: string | undefined, root: string): string {
  return css ? resolve(root, css) : resolveStylesheet(defaultStylesheetCandidates(root));
}

/** `next dev` runs with NODE_ENV=development — serve the full stylesheet there. */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export interface RoyCssGenerateResult {
  /** Absolute path of the generated stylesheet. */
  outPath: string;
  /** Generated CSS (full in dev, extracted subset in build). */
  css: string;
  /** Whether the full stylesheet was emitted (dev mode). */
  isDev: boolean;
  /** Classes discovered by scanning. */
  classes: string[];
  /** Extraction stats (zeros in dev mode, where nothing is extracted). */
  stats: { keptRules: number; totalRules: number; outputBytes: number; inputBytes: number };
}

/**
 * Scan + extract + write the RoyCSS stylesheet artifact.
 * Called by `withRoyCss`; exported for manual / programmatic use.
 */
export function generateRoyCssStylesheet(
  options: RoyCssNextOptions = {},
  root: string = process.cwd(),
): RoyCssGenerateResult {
  const stylesheetPath = resolveStylesheetPath(options.css, root);
  const pipeline = createRoyCssPipeline({ stylesheet: stylesheetPath, include: options.include });

  const scanRoots = options.scan ?? defaultScanRoots(root);
  pipeline.scanDirectories(scanRoots);

  const classes = pipeline.classes();
  const dev = isDevelopment();
  const result = pipeline.extract();
  const css = dev || classes.length === 0 ? pipeline.source : result.css;

  const outDir = options.outDir ? resolve(root, options.outDir) : join(root, ".roycss");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "roycss.css");
  writeFileSync(outPath, css);

  if (classes.length === 0) {
    console.warn(
      `[roycss] withRoyCss found no r-*/roycss-* classes in ${scanRoots.join(", ")} — ` +
        `the full stylesheet was written to ${outPath}. Check the \`scan\` roots or add an \`include\` list.`,
    );
  }

  return {
    outPath,
    css,
    isDev: dev,
    classes,
    stats: {
      keptRules: dev ? 0 : result.keptRules,
      totalRules: dev ? 0 : result.totalRules,
      outputBytes: dev ? 0 : result.outputBytes,
      inputBytes: dev ? 0 : result.inputBytes,
    },
  };
}

/**
 * Wrap a Next.js config with RoyCSS support.
 *
 * ```ts
 * // next.config.ts
 * import { withRoyCss } from "@roycss/plugin-next";
 * export default withRoyCss({ reactStrictMode: true });
 * ```
 *
 * Then import the generated stylesheet once, in `app/layout.tsx`:
 * `import "../.roycss/roycss.css";`
 *
 * The wrapper merges your config untouched (no bundler-specific hooks —
 * works with both Webpack and Turbopack).
 */
export function withRoyCss(nextConfig: NextConfig = {}, options: RoyCssNextOptions = {}): NextConfig {
  const pipelineMode = options.pipeline ?? "generate";
  if (pipelineMode === "generate") {
    try {
      generateRoyCssStylesheet(options);
    } catch (error) {
      console.warn(`[roycss] stylesheet generation failed: ${(error as Error).message}`);
    }
  }
  return { ...nextConfig };
}

/** Raw critical CSS for SSR injection (server-component safe — pure string). */
export function roycssCriticalStyle(options: RoyCssCriticalOptions = {}): string {
  const root = process.cwd();
  const stylesheetPath = resolveStylesheetPath(options.css, root);
  const pipeline = createRoyCssPipeline({ stylesheet: stylesheetPath, include: options.include });

  if (options.classes) {
    pipeline.addClasses(options.classes);
  } else {
    pipeline.scanDirectories(options.scan ?? defaultScanRoots(root));
  }

  const classes = pipeline.classes();
  if (classes.length === 0) return "";
  return pipeline.extract({ includeBase: options.includeBase ?? true }).css;
}

/** Critical CSS wrapped in a `<style data-roycss-critical>` tag (for SSR injection). */
export function roycssCriticalStyleTag(options: RoyCssCriticalOptions = {}): string {
  const css = roycssCriticalStyle(options);
  if (!css) return "";
  const safe = css.replace(/<\/style/gi, "<\\/style");
  return `<style data-roycss-critical>\n${safe}\n</style>`;
}

export interface RoyCssPostcssOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved from the project root). */
  css?: string;
  /** Roots (dirs or files) scanned for class usage. Default: conventional Next.js locations under the project root. */
  scan?: string[];
  /** Classes always treated as used. */
  include?: string[];
}

/** Extract the URL from an `@import` prelude (`"x.css"`, `url(x.css)`, `… layer(l)`). */
function importUrlOf(params: string): string | null {
  const match = /(?:url\(\s*)?["']([^"']+)["']/.exec(params);
  return match ? match[1] : null;
}

/**
 * PostCSS-style pipeline as a real PostCSS plugin: any `@import` of the
 * RoyCSS stylesheet inside the processed CSS is replaced with the extracted
 * subset. Everything else passes through untouched.
 *
 * ```js
 * // postcss.config.mjs
 * import { createRoyCssPostcssPlugin } from "@roycss/plugin-next";
 * export default { plugins: [createRoyCssPostcssPlugin()] };
 * ```
 *
 * In dev (`next dev`) the import is replaced with the full stylesheet so
 * HMR never goes stale; in `next build` the extracted subset is inlined.
 */
export const createRoyCssPostcssPlugin: PluginCreator<RoyCssPostcssOptions> = Object.assign(
  (options: RoyCssPostcssOptions = {}) => {
    let pipeline: RoyCssPipeline | undefined;

    return {
      postcssPlugin: "@roycss/extract",

      Once(root: Root) {
        const imports = (root.nodes ?? []).filter((node): node is PostcssAtRule => {
          if (node.type !== "atrule" || node.name !== "import") return false;
          const url = importUrlOf(node.params);
          return url !== null && isRoyCssImportUrl(url);
        });
        if (imports.length === 0) return;

        if (!pipeline) {
          // PostCSS runs with cwd = project root inside Next.js builds.
          const projectRoot = process.cwd();
          const stylesheetPath = resolveStylesheetPath(options.css, projectRoot);
          pipeline = createRoyCssPipeline({ stylesheet: stylesheetPath, include: options.include });
          pipeline.scanDirectories(options.scan ?? defaultScanRoots(projectRoot));
        }

        const classes = pipeline.classes();
        const dev = isDevelopment();
        const css = dev || classes.length === 0 ? pipeline.source : pipeline.extract().css;

        for (const node of imports) {
          const layer = parseImportLayer(node.params);
          const replacement = layer ? `@layer ${layer} {\n${css}}` : css;
          node.parent?.insertBefore(node, replacement);
          node.remove();
        }
      },
    };
  },
  { postcss: true as const },
);

/** Re-exported scan helpers (used by tests and advanced setups). */
export { collectSourceFiles };
export type { SourceWalkOptions };
