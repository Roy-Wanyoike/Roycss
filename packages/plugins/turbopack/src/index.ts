/**
 * @roycss/plugin-turbopack — Turbopack integration for RoyCSS.
 *
 * ⚠ HONEST SUBSET — the support contract is frozen in
 * `ROYCSS_TURBOPACK_SUPPORT` (below) and pinned by tests:
 *
 *   • `generation: true` — the stylesheet-generation pipeline works: it
 *     scans your app tree at config-eval time, extracts the used-CSS
 *     subset and writes `.roycss/roycss.css` for your root layout to
 *     import. Turbopack consumes that import like any other CSS file.
 *   • `bundlerHooks: false` — Turbopack has no stable public plugin API,
 *     and this adapter uses none. It is the Next.js generation pipeline
 *     (`@roycss/plugin-next`'s `withRoyCss` — no bundler-specific
 *     hooks, which is exactly why it works unchanged under Turbopack).
 *   • `postcssPipeline: "untested"` — the PostCSS-style pipeline is
 *     re-exported from the Next.js adapter for convenience; PostCSS runs
 *     before the bundler, so it should be bundler-agnostic, but it has
 *     NOT been verified against a live Turbopack build.
 *
 * When Turbopack's plugin API stabilizes, the hooks land here and the
 * contract thaws.
 */

import type { NextConfig } from "next";
import {
  createRoyCssPostcssPlugin,
  generateRoyCssStylesheet,
  withRoyCss,
  type RoyCssNextOptions,
} from "../../next/src/index";

export {
  createRoyCssPipeline,
  generateRoyCssStylesheet,
  roycssCriticalStyle,
  roycssCriticalStyleTag,
  withRoyCss,
  type RoyCssCriticalOptions,
  type RoyCssGenerateResult,
  type RoyCssNextOptions,
} from "../../next/src/index";

/**
 * The frozen Turbopack support contract. `generation` works today; native
 * bundler hooks are NOT implemented (Turbopack has no stable public
 * plugin API); the PostCSS pipeline is provided but untested against a
 * live Turbopack build.
 */
export const ROYCSS_TURBOPACK_SUPPORT = {
  generation: true,
  bundlerHooks: false,
  postcssPipeline: "untested",
} as const;

/** The PostCSS-style pipeline, re-exported for Turbopack users (untested against a live Turbopack build). */
export const createRoyCssTurbopackPostcssPlugin = createRoyCssPostcssPlugin;

/** The stylesheet-generation pipeline, re-exported for Turbopack users. */
export const generateRoyCssTurbopackStylesheet = generateRoyCssStylesheet;

/** Options are identical to the Next.js adapter's (the engines are shared). */
export type RoyCssTurbopackOptions = RoyCssNextOptions;
export type RoyCssTurbopackCriticalOptions = import("../../next/src/index").RoyCssCriticalOptions;
export type RoyCssTurbopackGenerateResult = import("../../next/src/index").RoyCssGenerateResult;

/**
 * Wrap a Next.js config with RoyCSS support, for Turbopack builds
 * (`next dev --turbo` / `next build --turbopack`).
 *
 * ```ts
 * // next.config.ts
 * import { withRoyCssTurbopack } from "@roycss/plugin-turbopack";
 * export default withRoyCssTurbopack({ reactStrictMode: true });
 * ```
 *
 * Then import the generated stylesheet once, in `app/layout.tsx`:
 * `import "../.roycss/roycss.css";`
 *
 * This is the bundler-agnostic generation pipeline (zero Turbopack
 * hooks — see `ROYCSS_TURBOPACK_SUPPORT`); the config passes through
 * untouched.
 */
export function withRoyCssTurbopack(
  nextConfig: NextConfig = {},
  options: RoyCssTurbopackOptions = {},
): NextConfig {
  return withRoyCss(nextConfig, options);
}

/** Default export — the adapter entry point (consistent with the other adapters). */
export default withRoyCssTurbopack;

/** Named alias (preferred by some setups over the default export). */
export const roycss = withRoyCssTurbopack;
