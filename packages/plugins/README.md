# RoyCSS Build Plugins

First-party build plugins for [RoyCSS](https://github.com/Roy-Wanyoike/Roycss) —
scan your source for the `r-*` / `roycss-*` classes you actually use, then ship
**only the CSS those classes need** instead of the full 1,959-effect stylesheet
(~1.6 MB).

Three packages, one shared engine:

| Package | What it is |
| --- | --- |
| **`@roycss/plugin-core`** | The shared scan/extract engine (no bundler knowledge). |
| **`@roycss/plugin-vite`** | Zero-config Vite plugin — dev-safe, AOT extraction at build. |
| **`@roycss/plugin-next`** | Next.js (app router) integration — `withRoyCss(nextConfig)`, a PostCSS-style pipeline, and an SSR critical-CSS hook. |

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
3. **Inject** — each plugin feeds the subset into your bundler: a virtual
   module / in-place stylesheet swap (Vite), a generated `.roycss/roycss.css`
   or inlined `@import` rewrite (Next.js), or a `<style>` critical-CSS tag
   for SSR.

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

## `@roycss/plugin-core` — programmatic API

The engine behind both plugins; usable directly (e.g. from a custom bundler
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
  build-time (AOT) concern.
- **Fail-open design** — unknown classes, unreadable files and generation
  failures never break the build; the worst case is the full stylesheet.
- **Idempotent** — extracting an extraction reproduces it byte-for-byte.
- Tests live in the repo root at `tests/unit/plugins-*.test.ts`, run with
  `bunx vitest run`.

MIT © RoyCSS
