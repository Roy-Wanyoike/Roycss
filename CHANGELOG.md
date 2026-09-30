# Changelog

All notable changes to the [RoyCSS](https://github.com/Roy-Wanyoike/Roycss)
npm package (`roycss`) are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org).

## [2.0.0] — 2026-09-13

First npm release of RoyCSS v2 (v1 was distributed via the website only).

### Added

- **1,983 production-ready CSS effects across 29 categories** — OKLCH
  colors, logical properties, container queries, scroll-driven
  animations, and a global `prefers-reduced-motion` kill switch.
- Dual module builds with TypeScript declarations:
  - `import { effects } from "roycss"` (ESM, `dist/effects.js`)
  - `const { effects } = require("roycss")` (CommonJS, `dist/effects.cjs`)
  - `dist/effects.d.ts` types (`CSSEffect` interface).
- Subpath exports: `roycss/css`, `roycss/css/min`, `roycss/effects.json`,
  `roycss/class-index`, `roycss/motion-library`, `roycss/critical.css`,
  `roycss/fallbacks`, `roycss/package.json`.
- **Per-category subpath exports** — `roycss/category/<name>` and
  `roycss/category/<name>/min` for all 29 categories (58 additional
  subpaths mapping to `dist/roycss.<category>.css` /
  `dist/roycss.<category>.min.css`), so consumers can ship a single
  category's CSS.
- **Tailwind v4 recipe exports** — `roycss/tailwind` and
  `roycss/tailwind.css` (both → `dist/roycss.tailwind.css`), the
  `@import "roycss/tailwind"` one-liner the recipe text documents.
- **SRI pin for the minified bundle** — `dist/roycss.min.css.sri.txt`
  ships the subresource-integrity hash for CDN `integrity=` pinning.
- **AI-consumable artifacts in the tarball** — 5 AI artifacts
  (`dist/roycss.rules.md`, `dist/roycss.system-prompt.md`,
  `dist/roycss.grammar.json`, `dist/roycss.training-pairs.jsonl`,
  `dist/roycss.manifest.json`) plus the design-token pair
  (`dist/tokens.d.ts` TypeScript declarations and
  `dist/tokens.dtcg.json` W3C DTCG tokens).
- Zero runtime dependencies — CSS + data only, zero JavaScript at
  runtime.

### Changed

- Version 2.0.0 continues the public v1 → v2 version line distributed
  through the website (see `DEPRECATION.md` for the v1 → v2 codemod).
- The shipped tarball carries the final **1,983-effect** corpus (up from
  the 1,959-effect snapshot this entry was first drafted against); the
  count is drift-gated by `bun run publish:validate`, which fails the
  publish when `package.json` descriptions and `dist/effects.json`
  disagree.

[2.0.0]: https://github.com/Roy-Wanyoike/Roycss/releases/tag/v2.0.0
