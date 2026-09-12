/**
 * @roycss/plugin-rspack — Rspack plugin for RoyCSS.
 *
 * Rspack implements the webpack 5 plugin API (including
 * `compiler.hooks.compilation` and `compilation.hooks.processAssets` with
 * the same stage constants and asset-map semantics), so this adapter IS
 * the webpack engine from `@roycss/plugin-webpack`, rebranded and tapped
 * under its own plugin name. See that package for the full behaviour
 * description (asset matching by name + content identity, in-place
 * `updateAsset` replacement, `mode: "development"` full-stylesheet
 * default, `emit`/`assetName` fallback emission).
 *
 * Honesty note: Rspack is NOT a dependency of this repo's dev tree and is
 * NOT typechecked against a live Rspack build — the types resolve through
 * `@roycss/plugin-webpack`'s structural mirrors of the webpack 5 plugin
 * API, which is the compatibility target Rspack documents. The unit
 * tests drive the plugin through a Rspack-shaped harness replicating the
 * real asset-map shape (Source objects, string | Buffer).
 */

import {
  createRoyCssWebpackEngine,
  type RoyCssWebpackOptions,
  type WebpackPluginLike,
} from "../../webpack/src/index";

export {
  roycssStringSource,
  type RoyCssWebpackOptions,
  type WebpackAssetSourceLike,
  type WebpackCompilationLike,
  type WebpackCompilerLike,
  type WebpackPluginLike,
} from "../../webpack/src/index";

/** Options are identical to the webpack adapter's (shared engine). */
export type RoyCssRspackOptions = RoyCssWebpackOptions;

/** Create the RoyCSS Rspack plugin (the webpack 5 engine, Rspack-branded). */
export default function roycssRspack(options: RoyCssRspackOptions = {}): WebpackPluginLike {
  return createRoyCssWebpackEngine("@roycss/plugin-rspack", options);
}

/** Named export (preferred by some setups over the default export). */
export const roycss = roycssRspack;
