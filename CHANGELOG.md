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
- Zero runtime dependencies — CSS + data only, zero JavaScript at
  runtime.

### Changed

- Version 2.0.0 continues the public v1 → v2 version line distributed
  through the website (see `DEPRECATION.md` for the v1 → v2 codemod).

[2.0.0]: https://github.com/Roy-Wanyoike/Roycss/releases/tag/v2.0.0
