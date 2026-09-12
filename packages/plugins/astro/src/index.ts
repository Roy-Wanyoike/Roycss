/**
 * @roycss/plugin-astro — Astro integration for RoyCSS.
 *
 * Astro builds on Vite — so the RoyCSS pipeline for Astro is the RoyCSS
 * Vite plugin. This integration's `astro:config:setup` hook injects
 * `@roycss/plugin-vite` (from this repo's tree, live-typed against the
 * installed `vite`) into Astro's Vite config via `updateConfig`, with
 * the stylesheet resolved against the Astro root (Astro's root and the
 * Vite root it passes to plugins are the same directory in practice,
 * but resolving here keeps the delegation explicit).
 *
 * Everything after injection is the Vite plugin's documented behaviour:
 * dev serves the full stylesheet (HMR-safe, marking transform), build
 * extracts the subset AOT — through `import "virtual:roycss/css"` or an
 * in-place `roycss.css` swap.
 *
 * `astro sync` (type generation) is a NO-OP: the hook early-returns
 * BEFORE resolving the stylesheet, so running `astro sync` in a project
 * that has no RoyCSS stylesheet artifact yet is a silent no-op instead
 * of a crash (the stylesheet resolution happens only for dev/build,
 * where the CSS is actually needed).
 *
 * Honesty note: Astro is not a dependency of this repo's dev tree, so
 * the `AstroIntegration` shell below is a STRUCTURAL mirror of Astro's
 * documented integration API (`astro:config:setup` hook + command +
 * config + updateConfig) — while the actual pipeline that runs is the
 * live-typed Vite plugin. The unit tests drive the injected Vite plugin
 * end-to-end (configResolved → resolveId/load/transform).
 */

import { resolve as resolvePath } from "node:path";
import roycssVite, { type RoyCssViteOptions } from "../../vite/src/index";
import { defaultStylesheetCandidates, resolveStylesheet } from "../../core/src/index";

export interface RoyCssAstroOptions {
  /** Path to the compiled RoyCSS stylesheet. Default: the shipped `roycss.css` (auto-resolved). */
  css?: string;
  /** Extra Vite scan roots. Default: the Vite plugin's roots (`<root>/src` + `<root>/index.html`) plus Astro's `srcDir` when customized. */
  scan?: string[];
  /** Classes always treated as used (escape hatch for dynamic class names). */
  include?: string[];
  /** Dev behaviour: `"full"` (default) serves the full stylesheet; `"extract"` live-extracts with full reloads. */
  dev?: "full" | "extract";
  /** Inline the extracted CSS into the HTML entry at build time. Default: false. */
  inject?: boolean;
}

/** Structural mirror of the pieces of Astro's `AstroConfig` this integration reads. */
export interface AstroConfigLike {
  /** Astro project root (absolute). */
  root?: string | undefined;
  /** Source directory (relative to root, default `"src"`). */
  srcDir?: string | undefined;
}

/** Structural mirror of Astro's `updateConfig` (only the `vite` key is used). */
export interface AstroUpdateConfigLike {
  (config: { vite?: { plugins?: unknown[] } }): void;
}

/** Structural mirror of the `astro:config:setup` hook parameters. */
export interface AstroConfigSetupHookOptions {
  command: "dev" | "build" | "preview" | "sync";
  config: AstroConfigLike;
  updateConfig: AstroUpdateConfigLike;
}

/** Structural mirror of an `AstroIntegration` (the public plugin shape). */
export interface AstroIntegrationLike {
  name: string;
  hooks: {
    "astro:config:setup": (options: AstroConfigSetupHookOptions) => void;
  };
}

/** Create the RoyCSS Astro integration. */
export default function roycssAstro(options: RoyCssAstroOptions = {}): AstroIntegrationLike {
  return {
    name: "@roycss/plugin-astro",
    hooks: {
      "astro:config:setup": ({ command, config, updateConfig }) => {
        // `astro sync` only generates types — inject nothing, resolve
        // nothing, touch no filesystem. This early-return MUST come before
        // any stylesheet resolution: sync in a project without the
        // stylesheet artifact is a no-op, never a crash.
        if (command === "sync") return;

        const root = config.root ? resolvePath(config.root) : process.cwd();

        // Resolve the stylesheet here (not inside the Vite plugin) so the
        // failure message is Astro-flavoured and the delegation explicit.
        const cssPath = options.css
          ? resolvePath(root, options.css)
          : resolveStylesheet(defaultStylesheetCandidates(root));

        // Astro's configurable srcDir is added as an extra scan root when
        // the user hasn't provided their own `scan` list.
        const scan = options.scan ?? (config.srcDir ? [resolvePath(root, config.srcDir)] : undefined);

        // Delegate: the actual pipeline is the live-typed Vite plugin,
        // injected into Astro's Vite config.
        updateConfig({
          vite: {
            plugins: [roycssVite({ css: cssPath, scan, include: options.include, dev: options.dev, inject: options.inject })],
          },
        });
      },
    },
  };
}

/** Named export (preferred by some setups over the default export). */
export const roycss = roycssAstro;
export type { RoyCssViteOptions };
