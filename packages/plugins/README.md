# RoyCSS Build Plugins

First-party build plugins for [RoyCSS](https://github.com/Roy-Wanyoike/Roycss) —
scan your source for the `r-*` / `roycss-*` classes you actually use, then ship
**only the CSS those classes need** instead of the full 1,959-effect stylesheet
(~1.6 MB).

Nine packages, one shared engine — 8 of 8 bundler adapters shipped:

| Package | What it is |
| --- | --- |
| **`@roycss/plugin-core`** | The shared scan/extract engine (no bundler knowledge). |
| **`@roycss/plugin-vite`** | Zero-config Vite plugin — dev-safe, AOT extraction at build. |
| **`@roycss/plugin-next`** | Next.js (app router) integration — `withRoyCss(nextConfig)`, a PostCSS-style pipeline, and an SSR critical-CSS hook. |
| **`@roycss/plugin-astro`** | Astro integration — injects the Vite plugin into Astro's Vite pipeline (`astro sync` is a no-op). |
| **`@roycss/plugin-webpack`** | webpack 5 plugin — replaces the stylesheet asset with the extracted subset before any other asset pipeline stage. |
| **`@roycss/plugin-rspack`** | Rspack plugin — the webpack engine, rebranded (Rspack implements the webpack 5 plugin API). |
| **`@roycss/plugin-esbuild`** | esbuild plugin — onLoad stylesheet swap with `watchFiles` wiring for watch mode. |
| **`@roycss/plugin-rollup`** | Rollup plugin — `virtual:roycss/css` module or in-place swap; always AOT (Rollup has no dev server). |
| **`@roycss/plugin-turbopack`** | **HONEST SUBSET** — the bundler-agnostic generation pipeline; no native Turbopack hooks (frozen support contract). |

## How it works

1. **Scan** — a token-based scanner reads your JSX/TSX/JS/HTML/Vue/Svelte/Astro
   sources and collects every `roycss-*` (full effect class) and `r-*`
   (utility shorthand) token: string attributes, template literals,
   `className` arrays, `clsx(...)` calls, conditional expressions. A false
   positive is harmless (a few extra rules survive); a false negative would
   silently drop styles, so the scanner is deliberately generous.
2. **Extract** — a dependency-aware extractor parses the full stylesheet into
   top-level nodes (rules, `@keyframes`, `@property`, `@media`/`@supports`
   groups) and keeps:
   - every rule whose selector references a used class (compound/descendant
     selectors kept whole);
   - `@keyframes` **referenced by kept CSS** — including keyframes nested
     inside `@supports` fallback blocks;
   - `@property` registrations for custom properties used by kept CSS;
   - root custom-property (design token) definitions that kept CSS still
     references via `var(--roy-*)`;
   - group at-rules (`@media`, `@supports`, `@container`, …) pruned to their
     surviving children;
   - class-less "base" rules (universal reset, the
     `[class^="roycss-"]` prefers-reduced-motion a11y guard, `:root` tokens)
     whenever the output is non-empty, so extracted pages render identically.
   
   Kept nodes are re-emitted byte-for-byte from the original source, so output
   is deterministic, order-preserving and idempotent
   (`extract(extract(css)) === extract(css)`).
3. **Inject** — each adapter feeds the subset into your bundler: a virtual
   module / in-place stylesheet swap (Vite, Rollup), an asset-map
   replacement (webpack, Rspack), served module contents (esbuild), a
   generated `.roycss/roycss.css` or inlined `@import` rewrite (Next.js,
   Turbopack), Vite-config injection (Astro), or a `<style>` critical-CSS
   tag for SSR.

### The stylesheet source

The plugins default to the **shipped artifact**, resolved in this order:

1. `<root>/node_modules/roycss/dist/roycss.css` (npm install)
2. `<root>/node_modules/roycss/roycss.css`
3. `<root>/dist/roycss.css` (this repo's layout)
4. `<root>/roycss.css` (vendored copy)

Every plugin accepts a `css` option (absolute or root-relative path) to point
at a different build of the stylesheet — e.g. your own fork or a minified
copy. The stylesheet path is **configurable; the default is the shipped
artifact**, not the repo-internal `src/app/roycss.css` demo file.

---

## `@roycss/plugin-vite` — Vite

### Install

```bash
npm install @roycss/plugin-vite   # vite is a peer dependency — bring your own
```

The plugin has **zero runtime dependencies**; `vite` itself is a peer
dependency (`^5 || ^6 || ^7 || ^8`).

### Usage (zero config)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import roycss from "@roycss/plugin-vite";

export default defineConfig({
  plugins: [roycss()],
});
```

Then use RoyCSS classes normally and import the CSS one of two ways:

```ts
// Option A — virtual module (recommended; works even without the package installed)
import "virtual:roycss/css";

// Option B — your usual import (the plugin swaps the file's contents in place)
import "roycss.css";
```

**Dev (`vite dev`):** every transformed module is scanned (a *marking*
transform — it never rewrites module code, so HMR stays untouched) and the
**full stylesheet is served** by default: always correct, zero HMR risk.
**Build (`vite build`):** the project tree is pre-scanned, per-module
transforms add anything the walk missed, and the stylesheet is replaced with
the extracted subset (AOT).

### Options

```ts
roycss({
  css: "/path/to/roycss.css", // custom stylesheet (default: auto-resolved shipped artifact)
  scan: ["./src", "./index.html"], // extra scan roots (default: <root>/src + <root>/index.html)
  include: ["roycss-float"], // classes always treated as used (dynamic class names)
  dev: "full" | "extract", // dev behaviour (default "full"; "extract" live-extracts + full-reloads on new classes)
  inject: true, // inline the extracted CSS into the HTML entry at build time
})
```

### Troubleshooting (Vite)

| Symptom | Fix |
| --- | --- |
| `[roycss] No r-*/roycss-* classes were found — emitting the FULL stylesheet` | The scan roots don't cover your code. Pass `scan: [__dirname + "/src"]` (or wherever your components live) or list the dynamic classes in `include`. |
| An effect is missing in the built CSS | Its class name is built dynamically (`` `r-${size}` ``). The scanner can't see interpolations — add the concrete names to `include`. |
| Styles missing only in `vite dev` with `dev: "extract"` | New classes trigger a full page reload; if your tab was open before the class appeared, hard-refresh once. When in doubt, keep the default `dev: "full"`. |
| `[roycss] No RoyCSS stylesheet found` | The stylesheet wasn't auto-resolved. Install the `roycss` package, or pass `css: "/abs/path/roycss.css"`. |
| Plugin seems to run before my other CSS plugins | It is `enforce: "pre"` by design — it must see modules before they're transformed. |

---

## `@roycss/plugin-next` — Next.js

### Install

```bash
npm install @roycss/plugin-next   # next is a peer dependency (>= 13)
```

### Usage 1 — `withRoyCss` (default, zero config)

```ts
// next.config.ts
import { withRoyCss } from "@roycss/plugin-next";

export default withRoyCss({
  reactStrictMode: true, // your config passes through untouched
});
```

At config-eval time (every `next dev` / `next build` start) the plugin scans
your app tree, extracts the used subset and writes it to `.roycss/roycss.css`.
Import it **once**, in your root layout:

```tsx
// app/layout.tsx
import "../.roycss/roycss.css";
```

- `next dev` (NODE_ENV=development) writes the **full** stylesheet — always
  HMR-safe.
- `next build` writes the **extracted subset** (AOT).
- No bundler-specific hooks are used, so it works with both Webpack and
  Turbopack. Add `.roycss/` to `.gitignore`.

### Usage 2 — PostCSS-style pipeline

Keep your existing `@import "roycss.css"` in `app/globals.css` and let a real
PostCSS plugin inline the subset at CSS-compile time:

```js
// postcss.config.mjs
import { createRoyCssPostcssPlugin } from "@roycss/plugin-next";

export default {
  plugins: [
    createRoyCssPostcssPlugin(), // options: { css, scan, include }
    // …your other plugins
  ],
};
```

`layer(…)` qualifiers are preserved
(`@import "roycss.css" layer(effects);` → `@layer effects { …subset… }`), and
non-RoyCSS imports pass through untouched. In dev the import is replaced with
the full stylesheet so HMR never goes stale.

### Usage 3 — SSR critical CSS

Inline the subset for above-the-fold components from a **server component**:

```tsx
// app/page.tsx (server component)
import { roycssCriticalStyleTag } from "@roycss/plugin-next";

export default function Page() {
  return (
    <>
      <head dangerouslySetInnerHTML={{ __html: roycssCriticalStyleTag({ classes: ["roycss-hero-glow"] }) }} />
      <main className="roycss-hero-glow">…</main>
    </>
  );
}
```

`roycssCriticalStyle(options)` returns the raw CSS; `roycssCriticalStyleTag`
wraps it in a `<style data-roycss-critical>` tag (with `</style` escaped). By
default the critical set is derived by scanning the conventional roots
(`app`, `src`, `pages`, `components`, `lib`); pass `classes` to restrict it
and `include` to add extras. With no usage found, both return `""` (never
inject an empty tag).

### Options

```ts
withRoyCss(nextConfig, {
  css: "/path/to/roycss.css", // custom stylesheet (default: auto-resolved shipped artifact)
  pipeline: "generate" | "postcss", // default "generate" (write .roycss/roycss.css); "postcss" = no file written
  scan: ["./app", "./components"], // scan roots (default: conventional Next.js locations)
  include: ["roycss-float"], // classes always treated as used
  outDir: ".roycss", // output directory for the generated stylesheet
});
```

### Troubleshooting (Next.js)

| Symptom | Fix |
| --- | --- |
| `[roycss] withRoyCss found no r-*/roycss-* classes` | Your code lives outside the conventional roots — pass `scan: [__dirname + "/app"]` or list classes in `include`. The full stylesheet is written as a fallback, so nothing breaks meanwhile. |
| `Module not found: Can't resolve '../.roycss/roycss.css'` | The `pipeline: "generate"` write happens at config-eval time; make sure `withRoyCss` is actually applied to the exported config and the layout import path matches `outDir`. |
| Stale styles after adding a class in `next dev` | Expected: dev serves the **full** stylesheet, so new classes already work; if you still see stale CSS, restart `next dev` (config re-eval regenerates `.roycss/roycss.css`). |
| PostCSS plugin doesn't inline anything | It only rewrites imports it recognizes (`roycss.css`, `roycss.min.css`, `roycss`, `roycss/css`, `roycss/dist/…`). Your import string must match one of those forms. |
| Extraction works locally but not in CI | CI runs `next build` from a different cwd — pass an absolute `css` path or ensure `node_modules/roycss` is installed. |
| `[roycss] stylesheet generation failed: …` | The stylesheet couldn't be read/resolved. `withRoyCss` never crashes the build on generation failure — check the `css` option. |

---

## `@roycss/plugin-astro` — Astro

Astro builds on Vite, so the RoyCSS pipeline for Astro **is** the Vite
plugin: the integration's `astro:config:setup` hook injects
`@roycss/plugin-vite` into Astro's Vite config and everything after that is
the Vite plugin's documented behaviour (dev serves the full stylesheet,
build extracts the subset AOT).

### Install

```bash
npm install @roycss/plugin-astro   # astro is a peer dependency (>= 2)
```

### Usage (zero config)

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import roycss from "@roycss/plugin-astro";

export default defineConfig({
  integrations: [roycss()],
});
```

Then use RoyCSS classes normally and import the CSS one of two ways:

```astro
---
// Option A — virtual module (recommended)
import "virtual:roycss/css";
// Option B — your usual import (the plugin swaps the file's contents in place)
import "roycss.css";
---
```

- `astro dev` serves the **full** stylesheet (HMR-safe marking transform);
  `astro build` extracts the subset (AOT).
- **`astro sync` is a no-op** — the hook returns before resolving anything,
  so type generation never touches the filesystem and never crashes in a
  project that has no RoyCSS stylesheet artifact yet.

### Options

```js
roycss({
  css: "/path/to/roycss.css", // custom stylesheet (default: auto-resolved shipped artifact)
  scan: ["./src"], // extra Vite scan roots (default: <root>/src + <root>/index.html, plus Astro's srcDir when customized)
  include: ["roycss-float"], // classes always treated as used (dynamic class names)
  dev: "full" | "extract", // dev behaviour (default "full"; "extract" live-extracts + full-reloads on new classes)
  inject: true, // inline the extracted CSS into the HTML entry at build time
})
```

### Troubleshooting (Astro)

| Symptom | Fix |
| --- | --- |
| `[roycss] No RoyCSS stylesheet found` in dev/build | Install the `roycss` package or pass `css: "/abs/path/roycss.css"`. (Never happens for `astro sync` — it's a no-op.) |
| `[roycss] No r-*/roycss-* classes were found` | Your code lives outside `<root>/src` — pass `scan: ["./src"]` or list the dynamic classes in `include`. |
| An effect is missing in the built CSS | Its class name is built dynamically (`` `r-${size}` ``) — add the concrete names to `include`. |
| Custom `srcDir` isn't scanned | It is, by default (added as an extra scan root when you customize it). If you pass your own `scan` list it REPLACES the defaults — include the srcDir yourself. |

---

## `@roycss/plugin-webpack` — webpack 5

Taps `compilation.hooks.processAssets` at the `PRE_PROCESS` stage (before
any other asset-pipeline plugin runs). The project tree is re-scanned on
**every compilation**, so watch-mode rebuilds pick up new classes.

Asset matching: an emitted asset whose name ends in `roycss.css` /
`roycss.min.css` **and** whose content is byte-identical to the resolved
full stylesheet is *the* stylesheet asset — it is replaced in place
(`updateAsset`) with the extracted subset. A name match alone is never
enough: a user-vendored, modified `roycss.css` is not clobbered. If no
asset matches, the subset is emitted as a new asset (`roycss.css` by
default) — refer to it from a `<link>` tag, or disable with `emit: false`.

### Install

```bash
npm install @roycss/plugin-webpack   # webpack 5 is a peer dependency
```

### Usage (zero config)

```js
// webpack.config.js
const roycss = require("@roycss/plugin-webpack");

module.exports = {
  // …your config…
  plugins: [roycss()],
};
```

- `mode: "development"` keeps the **full** stylesheet asset (HMR/refresh-safe);
  `mode: "production"` / `"none"` replaces it with the extracted subset (AOT).
  Opt into live extraction in development with `dev: "extract"`.
- The plugin reads asset contents through webpack 5's Source contract
  (`assets[name].source()` → `string | Buffer`) — both return types are
  handled.

### Options

```js
roycss({
  css: "/path/to/roycss.css", // custom stylesheet (default: auto-resolved shipped artifact)
  scan: ["./app"], // EXTRA scan roots on every compilation (default: <root>/src + <root>/index.html)
  include: ["roycss-float"], // classes always treated as used (dynamic class names)
  dev: "full" | "extract", // development-mode behaviour (default "full")
  emit: true, // emit the subset as a new asset when no stylesheet asset is found (default true)
  assetName: "roycss.css", // name of the emitted asset (default "roycss.css")
})
```

### Troubleshooting (webpack)

| Symptom | Fix |
| --- | --- |
| `[roycss] No r-*/roycss-* classes were found — emitting the FULL stylesheet` | The scan roots don't cover your code — pass `scan: [path.resolve(__dirname, "src")]` or list the dynamic classes in `include`. |
| A `roycss.css` asset exists but is never replaced | Its content differs from the resolved stylesheet (you vendored/modified it) — replacement is skipped by design. Point the `css` option at the right file. |
| `[roycss] An asset named "roycss.css" already exists but does not match…` | Something else owns the emit name. Rename yours, pass `assetName: "roycss-subset.css"`, or set `emit: false`. |
| Full stylesheet still shipped in development builds | Expected — `mode: "development"` is HMR-safe by default. Pass `dev: "extract"` to extract there too. |
| `[roycss] No RoyCSS stylesheet found` | The stylesheet wasn't auto-resolved from `compiler.context` — install `roycss` or pass `css: "/abs/path/roycss.css"`. |

---

## `@roycss/plugin-rspack` — Rspack

Rspack implements the webpack 5 plugin API — including
`compiler.hooks.compilation`, `compilation.hooks.processAssets`, the stage
constants and the asset-map semantics — so this adapter **is** the webpack
engine from `@roycss/plugin-webpack`, tapped under its own plugin name.
Every option and behaviour described in the webpack section above applies
verbatim.

> **Honesty note:** Rspack is not a dependency of this repo's dev tree, so
> this adapter is typechecked structurally — against the webpack 5 plugin
> API that Rspack documents as its compatibility target — not against a
> live Rspack build. The unit tests drive it through a harness replicating
> the real asset-map shape (Source objects, `string | Buffer`).

### Install

```bash
npm install @roycss/plugin-rspack   # rspack is a peer dependency (>= 0.7)
```

### Usage (zero config)

```js
// rspack.config.js
const roycss = require("@roycss/plugin-rspack");

module.exports = {
  // …your config…
  plugins: [roycss()],
};
```

### Options

Identical to the webpack adapter's (`css`, `scan`, `include`, `dev`,
`emit`, `assetName`) — see the webpack section above.

### Troubleshooting (Rspack)

See the webpack table above — the engines (and the failure modes) are the
same. If an Rspack release ever diverges from the webpack 5 asset-map
contract, the structural types in `@roycss/plugin-webpack`'s source are the
single place to update both adapters.

---

## `@roycss/plugin-esbuild` — esbuild

Registers two `onLoad` callbacks at `setup`:

1. **Stylesheet swap** — the resolved `roycss.css` / `roycss.min.css` is
   served the extracted subset in place of its file contents (one-shot
   builds extract AOT). A vendored copy under a matching name is left
   untouched (path identity is checked).
2. **Marking** — scannable modules (js/ts/tsx/jsx/vue/svelte/astro/html/md)
   outside `node_modules` are read, scanned for `r-*`/`roycss-*` usage and
   served verbatim.

**`watchFiles` wiring:** esbuild only auto-watches files it reads itself —
a file whose contents a plugin serves is invisible to the watcher unless
the plugin returns it in `watchFiles`. Both content-serving onLoads above
return `watchFiles`, so watch-mode rebuilds keep firing when your modules
or the stylesheet change.

### Install

```bash
npm install @roycss/plugin-esbuild   # esbuild is a peer dependency (>= 0.16)
```

### Usage (zero config)

```ts
import * as esbuild from "esbuild";
import roycss from "@roycss/plugin-esbuild";

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outdir: "dist",
  plugins: [roycss()], // import "roycss.css" from your entry
});
```

- One-shot builds serve the extracted subset (AOT).
- `watch: true` serves the **full** stylesheet by default so rebuilds never
  go stale; opt into the live subset with `dev: "extract"` (note: the
  stylesheet onLoad only re-runs when a watched file changes, so a
  newly-used class may need one more rebuild to appear).

### Options

```ts
roycss({
  css: "/path/to/roycss.css", // custom stylesheet (default: auto-resolved shipped artifact)
  scan: ["./src"], // extra scan roots at setup time (default: <root>/src + <root>/index.html)
  include: ["roycss-float"], // classes always treated as used (dynamic class names)
  dev: "full" | "extract", // watch-mode behaviour (default "full")
})
```

### Troubleshooting (esbuild)

| Symptom | Fix |
| --- | --- |
| `[roycss] No r-*/roycss-* classes were found — emitting the FULL stylesheet` | The scan roots don't cover your code — pass `scan: [./src]` or list the dynamic classes in `include`. |
| New class doesn't appear under `watch` with `dev: "extract"` | Expected: the stylesheet onLoad re-runs on watched-file changes — save once more (or keep the default full mode). |
| A vendored `roycss.css` is never swapped | By design — only the resolved stylesheet (the `css` option or the shipped artifact) is swapped, never a copy you modified. |
| `[roycss] No RoyCSS stylesheet found` | The stylesheet wasn't auto-resolved from `absWorkingDir` — install `roycss` or pass `css: "/abs/path/roycss.css"`. |

---

## `@roycss/plugin-rollup` — Rollup

Rollup's plugin API is the API Vite builds on, so this adapter offers the
same two consumption modes as Vite:

```ts
import "virtual:roycss/css"; // Option A — virtual module (recommended)
import "roycss.css"; // Option B — the real module, swapped in place by transform
```

The `transform` hook also performs the marking scan (it never rewrites
module code — the plugin is watch-safe). Rollup has **no dev server**,
so extraction is always AOT; there is no `dev` option by design.

### Install

```bash
npm install @roycss/plugin-rollup   # rollup is a peer dependency (>= 2)
```

### Usage (zero config)

```js
// rollup.config.mjs
import roycss from "@roycss/plugin-rollup";

export default {
  input: "src/main.js",
  plugins: [roycss()],
};
```

`buildStart` resolves the stylesheet and pre-scans the project (Rollup
runs plugins with `cwd` = project root). For `<link>`-tag setups, `emit:
true` additionally emits the subset as a Rollup **asset** from
`generateBundle` — importing AND emitting the same CSS would duplicate it,
so `emit` defaults to false.

### Options

```js
roycss({
  css: "/path/to/roycss.css", // custom stylesheet (default: auto-resolved shipped artifact)
  scan: ["src", "index.html"], // scan roots — REPLACES the defaults (default: <cwd>/src + <cwd>/index.html)
  include: ["roycss-float"], // classes always treated as used (dynamic class names)
  emit: false, // also emit the subset as an asset for <link>-tag consumers (default false)
  assetName: "roycss.css", // file name of the emitted asset (default "roycss.css")
})
```

### Troubleshooting (Rollup)

| Symptom | Fix |
| --- | --- |
| `[roycss] No r-*/roycss-* classes were found — emitting the FULL stylesheet` | Your code lives outside `<cwd>/src` — pass `scan: ["app"]` (this REPLACES the default roots) or list classes in `include`. |
| `[roycss] Could not read stylesheet at …` | The `css` path is wrong or unresolvable from the project root — point it at your `roycss.css`. |
| CSS shipped twice | You both `import` the CSS and set `emit: true` — pick one (import for bundling, emit for a `<link>` tag). |
| The emitted asset should have a different name | Pass `assetName: "effects.css"`. |

---

## `@roycss/plugin-turbopack` — Turbopack

> **HONEST SUBSET.** Turbopack has no stable public plugin API, so this
> adapter uses **no bundler hooks at all**. What it ships is the
> bundler-agnostic stylesheet-generation pipeline from `@roycss/plugin-next`
> — which is exactly why it works unchanged under Turbopack. The support
> surface is frozen in an exported contract, pinned by tests:

```ts
import { ROYCSS_TURBOPACK_SUPPORT } from "@roycss/plugin-turbopack";
// { generation: true, bundlerHooks: false, postcssPipeline: "untested" }
```

- `generation: true` — scans your app tree at config-eval time, extracts
  the used-CSS subset and writes `.roycss/roycss.css`; Turbopack consumes
  that import like any other CSS file.
- `bundlerHooks: false` — no `turbopack` config is touched; the wrapper
  merges your `next.config` untouched.
- `postcssPipeline: "untested"` — the PostCSS-style pipeline is re-exported
  for convenience (`createRoyCssTurbopackPostcssPlugin`); PostCSS runs
  before the bundler so it should be bundler-agnostic, but it has NOT been
  verified against a live Turbopack build.

When Turbopack's plugin API stabilizes, the hooks land here and the
contract thaws.

### Install

```bash
npm install @roycss/plugin-turbopack   # next is a peer dependency (>= 13)
```

### Usage (zero config)

```ts
// next.config.ts
import { withRoyCssTurbopack } from "@roycss/plugin-turbopack";

export default withRoyCssTurbopack({
  reactStrictMode: true, // your config passes through untouched
});
```

Then import the generated stylesheet once, in your root layout:

```tsx
// app/layout.tsx
import "../.roycss/roycss.css";
```

`next dev` writes the **full** stylesheet (always HMR-safe); `next build`
writes the **extracted subset** (AOT). Add `.roycss/` to `.gitignore`.

### Options

Identical to the Next.js adapter's (`css`, `pipeline`, `scan`, `include`,
`outDir`) — see the Next.js section above. `withRoyCss`,
`generateRoyCssStylesheet` and the SSR critical-CSS hooks are re-exported
under their Next.js names.

> **Packaging note:** all `@roycss/*` plugin packages currently publish
> raw TypeScript (`main`/`types` point at `src/index.ts`, `files: ["src"]`)
> — no compiled `dist/` build-out yet. This is the repo-wide state (see
> Compatibility below), not Turbopack-specific.

### Troubleshooting (Turbopack)

| Symptom | Fix |
| --- | --- |
| "Does this hook Turbopack?" | No — `bundlerHooks: false` by contract. Generation writes `.roycss/roycss.css`, which Turbopack consumes like any CSS import. |
| PostCSS pipeline behaves unexpectedly | It's `postcssPipeline: "untested"` — the supported path is the generation pipeline (`withRoyCssTurbopack`). |
| `[roycss] stylesheet generation failed: …` | The stylesheet couldn't be read/resolved. The wrapper never crashes the build on generation failure — check the `css` option. |
| Stale styles after adding a class in `next dev` | Expected: dev writes the **full** stylesheet, so new classes already work; restart `next dev` if `.roycss/roycss.css` is stale (config re-eval regenerates it). |

---

## `@roycss/plugin-core` — programmatic API

The engine behind every adapter; usable directly (e.g. from a custom bundler
integration or a script):

```ts
import { createRoyCssPipeline } from "@roycss/plugin-core";

const pipeline = createRoyCssPipeline({
  stylesheet: "/abs/path/roycss.css", // required
  include: ["roycss-float"], // always-used classes
});

pipeline.scanDirectories(["./src"]); // or scanSource / scanFiles / addClasses
pipeline.classes(); // ["r-btn", "roycss-float", …]

const result = pipeline.extract();
result.css; // the subset stylesheet
result.keptRules; // e.g. 12
result.totalRules; // e.g. 4,817
result.unmatchedClasses; // classes with no rule in the stylesheet (ignored safely)

// Or PostCSS-style: rewrite `@import "roycss.css";` inside your own CSS:
pipeline.process('@import "roycss.css";\n.app { margin: 0; }');
```

Also exported: `scanClasses` / `scanSources` / `isRoyCssClass` (scanner),
`extractStylesheet` (extractor), `parseStylesheet` / `isBalancedCss`
(CSS structure parser), `isRoyCssImportUrl` / `parseImportLayer`, and the
filesystem helpers (`resolveStylesheet`, `defaultStylesheetCandidates`,
`collectSourceFiles`, …).

### Extraction demo

Run the demo against the real shipped stylesheet:

```bash
bun packages/plugins/core/examples/extract-demo.ts
```

It scans a realistic JSX sample, extracts against `dist/roycss.css`
(1,959 effects, ~1.6 MB) and prints kept-rule counts plus output size vs.
full size.

### Troubleshooting (core)

| Symptom | Fix |
| --- | --- |
| `createRoyCssPipeline requires a stylesheet path` | Pass `stylesheet` (the plugins resolve the default for you). |
| `[roycss] Could not read stylesheet at …` | Path is wrong or unreadable — use `resolveStylesheet(defaultStylesheetCandidates(root))` to auto-pick. |
| `r-*` utility classes land in `unmatchedClasses` | Only utilities that exist as rules in the stylesheet can match; unknown classes are ignored safely by design (forward-compatible with future shorthand additions). |

---

## Compatibility & guarantees

- **Node-only filesystem access** — scanning/extracting happens in the build
  process, never in the browser; shipped CSS stays zero-JS.
- **Dev is always HMR-safe** — full stylesheet by default; extraction is a
  build-time (AOT) concern. (Rollup has no dev server — it is always AOT.)
- **Fail-open design** — unknown classes, unreadable files and generation
  failures never break the build; the worst case is the full stylesheet.
- **Idempotent** — extracting an extraction reproduces it byte-for-byte.
- **Typing: live where possible, structural where not.** `vite` and `next`
  are dependencies of this repo's dev tree, so those two adapters are
  typechecked against the real packages — and the adapters that delegate
  to them inherit that: `astro` injects the live-typed Vite pipeline (its
  own `AstroIntegration` shell is structural — astro isn't installed
  here), and `turbopack` is typed against real `next`. The remaining
  bundlers — `webpack`, `rspack`, `esbuild`, `rollup` — are not installed
  here, so their plugin-API types are **structural mirrors** of each
  bundler's documented plugin API (webpack 5's verified against the
  webpack bundled with Next.js; rspack's via its documented webpack-API
  compatibility). Every adapter's unit-test harness replicates the real
  bundler contract (e.g. webpack 5's asset-map values ARE the `Source`
  objects, `source()` → `string | Buffer`), so the mirrors can't silently
  drift.
- **Honest subset where hooks don't exist.** Turbopack has no stable public
  plugin API — `@roycss/plugin-turbopack` ships the bundler-agnostic
  generation pipeline and freezes its support surface in the exported,
  test-pinned `ROYCSS_TURBOPACK_SUPPORT` contract.
- **Raw TypeScript today.** All `@roycss/*` plugin packages publish raw
  TypeScript (`main`/`types` → `src/index.ts`, `files: ["src"]`) — a
  compiled-`dist/` build-out is a documented follow-up.
- Tests live in the repo root at `tests/unit/plugins-*.test.ts`, run with
  `bunx vitest run`.

MIT © RoyCSS
