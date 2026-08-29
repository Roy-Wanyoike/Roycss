# RoyCSS — Pending Features Audit (LABS + Vision + Enterprise)

**Task ID:** DOC-AUDIT-1
**Auditor:** Z.ai Code (DOC-AUDIT-1 agent)
**Date:** 2026-Q1
**Scope:** Cross-reference 18+ strategic documents against the current codebase to identify features described as planned/desired/future but not yet implemented.

---

## 0. Methodology

### Documents read (18)
1. `docs/50-ORIGINAL-FEATURES.md` — 56 strategic feature ideas
2. `docs/PLATFORM-VISION.md` — 12-product ecosystem vision
3. `docs/ROYCSS-V2-BLUEPRINT.md` — V2 production blueprint (2,038 lines)
4. `docs/FIRST-PRINCIPLES-REDESIGN.md` — First-principles redesign (1,722 lines)
5. `docs/LABS-26-REINVENT-CSS.md` — RoyLang proposal
6. `docs/LABS-27-RESEARCH-DIVISION.md` — 12-month research + decade predictions
7. `docs/LABS-28-DELETE-HALF.md` — Cut proposal
8. `docs/LABS-29-APPLE-DESIGN-REVIEW.md` — Apple HIG review
9. `docs/LABS-30-ONE-MILLION-USERS.md` — 1M-user scalability plan
10. `docs/LABS-31-ELIMINATE-BOILERPLATE.md` — Intent-level abstractions
11. `docs/LABS-32-AI-CODE-REVIEW.md` — AI-friendly redesign
12. `docs/LABS-33-PERFORMANCE-LAB.md` — Performance budget
13. `docs/LABS-34-FRAMEWORK-KILLER.md` — Lock-in prevention
14. `docs/LABS-35-TEN-YEAR-ARCHITECTURE.md` — 10-year architecture
15. `docs/LABS-36-IMPOSSIBLE-QUESTION.md` — CSS psychology redesign
16. `docs/ENTERPRISE-REVIEW.md` — Enterprise readiness review
17. `docs/COMPETITIVE-ANALYSIS.md` — Competitive analysis + 15 recommendations
18. `docs/FERRUM-MIGRATION-ANALYSIS.md` — Migration analysis

### Codebase inventory

| Surface | Count | Path |
|---|---|---|
| Pro components (React `.tsx`) | 63 | `src/components/roycss/pro/` |
| Dev tools (React `.tsx`) | 68 | `src/components/roycss/tools/` |
| Backend modules | 68 | `backend/src/modules/` |
| Product registry entries | 62 | `src/lib/product-registry.ts` |
| Next.js API routes | 8 route groups | `src/app/api/` |
| VSCode extension | 1 | `vscode-extension/` (snippets + completion + hover + search) |
| CLI | 1 | `cli/` (8 commands) |
| MCP server | 1 | `mcp-server/` (7 tools + 12 recipes) |
| Mini-services | 1 | `mini-services/live-service/` (socket.io) |
| Auth APIs | 5 | `src/app/api/auth/{login,logout,me,refresh,register}` |
| AI APIs | 3 | `src/app/api/{ai-migration,ai-playground,css-doctor}` |
| Docs pages | 25+ | `src/app/docs/**` |
| CI workflows | 3 | `.github/workflows/{ci,deploy,release}.yml` |
| Security artifacts | 8 | `security/{SBOM.json,SECURITY-POLICY.md,CSP.md,...}` |
| A11y audit scripts | 5 | `a11y/` + `tests/a11y/` |
| Tests | 50+ | `tests/{unit,e2e,i18n,a11y} + perf/` |

### Status legend
- `[IMPLEMENTED]` — Code exists at the expected location and is functional.
- `[PARTIAL]` — Code exists but is incomplete, demo-only, or behind a UI shell only.
- `[NOT STARTED]` — No code exists in the expected location; design-only.
- `[DEPRECATED]` — Document proposes deletion; current implementation should be removed (not added).

---

## 1. `docs/50-ORIGINAL-FEATURES.md` — 56 strategic ideas

### Category 1 — Debugging & Diagnostics (10 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1.1 | Cascade Genealogy Inspector (visualize cascade origins) | `[PARTIAL]` — A `cascade-specificity.tsx` tool exists but is generic, not genealogy-aware | `src/components/roycss/tools/cascade-genealogy.tsx` (new) | HIGH |
| 1.2 | Specificity Heatmap Overlay (paint specificity per element) | `[PARTIAL]` — `cascade-specificity.tsx` and `specificity-calculator.tsx` exist; no overlay renderer | `src/components/roycss/tools/specificity-heatmap.tsx` (new) | MEDIUM |
| 1.3 | CSS Time Travel (snapshot/diff computed style per commit) | `[NOT STARTED]` | `src/components/roycss/tools/css-time-travel.tsx` + `backend/src/modules/timetravel/` | MEDIUM |
| 1.4 | Dead CSS Tracer (interaction-aware dead-rule finder) | `[PARTIAL]` — `css-diff-engine.tsx` and `roy-bundle.tsx` (RoyBundle) find dead rules statically; no interaction tracing | Extend `src/components/roycss/pro/roy-bundle.tsx` or `src/components/roycss/tools/css-diff-engine.tsx` | MEDIUM |
| 1.5 | Property Diff Inspector ("git blame for every property") | `[PARTIAL]` — `css-diff-engine.tsx` exists; no per-property provenance | `src/components/roycss/tools/property-diff.tsx` (new) | MEDIUM |
| 1.6 | Custom Property Substitution Visualizer | `[NOT STARTED]` | `src/components/roycss/tools/var-substitution-visualizer.tsx` (new) | LOW |
| 1.7 | Layout Constraint Conflict Detector | `[NOT STARTED]` | `src/components/roycss/tools/layout-conflict-detector.tsx` (new) | LOW |
| 1.8 | Computed Style Snapshot Diff | `[PARTIAL]` — `css-diff-engine.tsx` exists; no snapshot persistence | Extend `src/components/roycss/tools/css-diff-engine.tsx` | LOW |
| 1.9 | Cascade Origin Tagging | `[NOT STARTED]` | Requires compiler support — `scripts/build-package.ts` extension | LOW |
| 1.10 | Selector Performance Profiler | `[PARTIAL]` — `roy-profiler.tsx` (RoyProfiler) profiles layout/paint; no selector-level breakdown | Extend `src/components/roycss/pro/roy-profiler.tsx` | MEDIUM |

### Category 2 — Design Intelligence (8 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 2.1 | Brand Color → Full Theme Generator | `[IMPLEMENTED]` — `roy-color-studio.tsx` + `theme-system.tsx` + `palette-generator.tsx` + `color-shade-generator.tsx` | `src/components/roycss/pro/roy-color-studio.tsx` | — |
| 2.2 | Effect Recommender ("suggest effects for this context") | `[IMPLEMENTED]` — `recommendation-engine.tsx` and `what-should-i-use.tsx` | `src/components/roycss/recommendation-engine.tsx` | — |
| 2.3 | Cascade Conflict Auto-Resolver | `[NOT STARTED]` | `src/components/roycss/tools/cascade-conflict-resolver.tsx` (new) | MEDIUM |
| 2.4 | Copy-from-Design AI (screenshot → RoyCSS classes) | `[PARTIAL]` — `src/app/api/ai-migration/route.ts` accepts code, not screenshots; `color-palette-extractor.tsx` extracts from images only | Extend `src/app/api/ai-migration/route.ts` + new `roy-architect.tsx` capability | HIGH |
| 2.5 | Accessibility Auto-Patch | `[PARTIAL]` — `accessibility-suite.tsx` audits; `a11y-score.tsx` reports; no auto-patch writer | Extend `src/components/roycss/pro/accessibility-suite.tsx` | HIGH |
| 2.6 | RTL Auto-Mirroring | `[PARTIAL]` — `logical-properties-mapper.tsx` exists; `tests/i18n/` runs audits; no automatic mirroring tool | `src/components/roycss/tools/rtl-mirror.tsx` (new) | MEDIUM |
| 2.7 | Effect Choreography AI | `[PARTIAL]` — `roy-architect.tsx` generates layouts; `motion-primitives.tsx` and `animation-timeline.tsx` exist; no AI choreographer | Extend `src/components/roycss/pro/roy-architect.tsx` | MEDIUM |
| 2.8 | Legacy CSS Refactor Bot | `[IMPLEMENTED]` — `roy-refactor.tsx` (RoyRefactor) + `src/app/api/ai-migration/route.ts` + `src/app/api/css-doctor/route.ts` | `src/components/roycss/pro/roy-refactor.tsx` | — |

### Category 3 — Performance (8 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 3.1 | Per-Effect Cost Budget | `[PARTIAL]` — `perf-analyzer.tsx` exists; no per-effect budget enforcement | Extend `src/components/roycss/tools/perf-analyzer.tsx` + `perf/benchmarks/effect-count.ts` | HIGH |
| 3.2 | Containment Auto-Analyzer | `[PARTIAL]` — `perf-analyzer.tsx` exists; no `contain` analysis | Extend `src/components/roycss/tools/perf-analyzer.tsx` | MEDIUM |
| 3.3 | View Transitions Auto-Wiring | `[PARTIAL]` — `view-transition.tsx` tool exists; no auto-wiring | Extend `src/components/roycss/tools/view-transition.tsx` | MEDIUM |
| 3.4 | will-change Auto-Injector | `[NOT STARTED]` | `src/components/roycss/tools/will-change-injector.tsx` (new) | MEDIUM |
| 3.5 | CSS Bundle Heatmap | `[PARTIAL]` — `roy-bundle.tsx` scans duplicates/dead rules; no heatmap visualization | Extend `src/components/roycss/pro/roy-bundle.tsx` | MEDIUM |
| 3.6 | Style Recalc Tracer | `[PARTIAL]` — `roy-profiler.tsx` measures; no trace output | Extend `src/components/roycss/pro/roy-profiler.tsx` | MEDIUM |
| 3.7 | Unused Custom Property Stripper | `[NOT STARTED]` | `src/components/roycss/tools/unused-var-stripper.tsx` (new) | LOW |
| 3.8 | Critical CSS via Real User Metrics | `[PARTIAL]` — `perf/optimize/extract-critical-css.ts` extracts at build; no RUM integration | `backend/src/modules/profiler/` + RUM SDK (new) | MEDIUM |

### Category 4 — Accessibility (6 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 4.1 | Real-Computed-Value Contrast Validator | `[PARTIAL]` — `contrast-checker.tsx` and `contrast-matrix.tsx` exist; check token pairs not computed values | Extend `src/components/roycss/tools/contrast-matrix.tsx` | HIGH |
| 4.2 | Focus Order Visualizer | `[NOT STARTED]` | `src/components/roycss/tools/focus-order-visualizer.tsx` (new) | HIGH |
| 4.3 | Reduced-Motion Equivalents Generator | `[PARTIAL]` — `animation-pauser.tsx` pauses; no equivalents generator | `src/components/roycss/tools/reduced-motion-generator.tsx` (new) | HIGH |
| 4.4 | Forced-Colors Mode Tester | `[NOT STARTED]` | `src/components/roycss/tools/forced-colors-tester.tsx` (new) | MEDIUM |
| 4.5 | ARIA-Aware Effect Filter | `[PARTIAL]` — `accessibility-suite.tsx` filters; no ARIA-aware effect catalog filter | Extend `src/components/roycss/pro/accessibility-suite.tsx` | MEDIUM |
| 4.6 | Cognitive Load Analyzer | `[NOT STARTED]` | `src/components/roycss/tools/cognitive-load-analyzer.tsx` (new) | LOW |

### Category 5 — Multi-Brand & Theming (6 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 5.1 | Brand Color Drift Monitor | `[NOT STARTED]` | `backend/src/modules/governance/` + `src/components/roycss/pro/roy-governance.tsx` extension | MEDIUM |
| 5.2 | Multi-Brand Token Compositor | `[PARTIAL]` — `theme-system.tsx` ships 10 presets; no multi-brand simultaneous composition | Extend `src/components/roycss/pro/theme-system.tsx` | MEDIUM |
| 5.3 | Theme Snapshot & Diff | `[PARTIAL]` — `theme-system.tsx` + `css-diff-engine.tsx` exist separately; not integrated | Combine in `src/components/roycss/pro/theme-system.tsx` | MEDIUM |
| 5.4 | Density Modes Beyond Breakpoints | `[NOT STARTED]` | `src/lib/design-tokens.ts` extension + `src/components/roycss/pro/roy-typography.tsx` | LOW |
| 5.5 | OKLCH Gamut Auto-Fallback | `[PARTIAL]` — `fallback-analyzer.tsx` exists; no automatic gamut mapping | Extend `src/components/roycss/tools/fallback-analyzer.tsx` | MEDIUM |
| 5.6 | Print Stylesheet Auto-Synthesis | `[NOT STARTED]` — `print-simulator.tsx` simulates only | Extend `src/components/roycss/tools/print-simulator.tsx` to emit `@media print` | LOW |

### Category 6 — Developer Tools (6 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 6.1 | RoyCSS Inspector Panel (browser) | `[NOT STARTED]` — No Chrome/Edge/Firefox extension exists; only the VSCode extension at `vscode-extension/` | New repo/folder `browser-extension/` (MV3 manifest + DevTools panel) | HIGH |
| 6.2 | VS Code Cascade Preview | `[PARTIAL]` — `vscode-extension/src/completion-provider.ts` + `hover-provider.ts` exist; no inline cascade preview | Extend `vscode-extension/src/` (webview) | HIGH |
| 6.3 | Token-Driven Class Generator | `[PARTIAL]` — `roy-generator.tsx` (RoyGenerator) scaffolds from prompts; not token-driven class emission | Extend `src/components/roycss/pro/roy-generator.tsx` | MEDIUM |
| 6.4 | Effect Sandbox with Time Scrubbing | `[PARTIAL]` — `roy-sandbox.tsx` (RoySandbox) isolates; `animation-timeline.tsx` shows timeline; not combined | Combine in `src/components/roycss/pro/roy-sandbox.tsx` | MEDIUM |
| 6.5 | Class Usage Heatmap in IDE | `[NOT STARTED]` | `vscode-extension/src/` decoration provider (new) | LOW |
| 6.6 | Design Token MCP Server | `[IMPLEMENTED]` — `mcp-server/index.ts` exposes 7 tools + 12 recipes including token-related recipes | `mcp-server/index.ts` | — |

### Category 7 — Animation Orchestration (6 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 7.1 | Scroll-Driven Effect Coordinator | `[PARTIAL]` — `scroll-animation-builder.tsx` exists; no coordinator across multiple effects | Extend `src/components/roycss/tools/scroll-animation-builder.tsx` | MEDIUM |
| 7.2 | Animation Conflict Detector | `[NOT STARTED]` | `src/components/roycss/tools/animation-conflict-detector.tsx` (new) | MEDIUM |
| 7.3 | Viewport Pause for Offscreen Animations | `[IMPLEMENTED]` — `animation-pauser.tsx` ships globally | `src/components/roycss/animation-pauser.tsx` | — |
| 7.4 | Motion Path Library with Magnetic Snap | `[PARTIAL]` — `motion-path.tsx` exists; no magnetic snap | Extend `src/components/roycss/tools/motion-path.tsx` | LOW |
| 7.5 | Choreography Rehearsal Mode | `[NOT STARTED]` | `src/components/roycss/pro/roy-motion-studio.tsx` extension | LOW |
| 7.6 | Animation Token Inheritance | `[PARTIAL]` — `motion-library.tsx` ships 60 presets; no token inheritance graph | Extend `src/components/roycss/pro/motion-library.tsx` | MEDIUM |

### Category 8 — Build & Distribution (6 ideas)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 8.1 | Effect Deduplication Across Bundles | `[PARTIAL]` — `scripts/build-package.ts` builds; no dedup pass | Extend `scripts/build-package.ts` | HIGH |
| 8.2 | CSS Module Boundaries with Type Exports | `[NOT STARTED]` | `scripts/build-package.ts` extension + `dist/effects.d.ts` | MEDIUM |
| 8.3 | Layer Auto-Composition | `[NOT STARTED]` — `css-layers.tsx` tool exists to *visualize* layers; build does not auto-compose | Extend `scripts/build-package.ts` | MEDIUM |
| 8.4 | Tree-Shakeable Token Catalog | `[PARTIAL]` — `src/lib/design-tokens.ts` exports typed tokens; `sideEffects` field set in package.json; not published as a separate catalog package | `dist/tokens.{js,json,d.ts}` + `package.json` exports | HIGH |
| 8.5 | Cross-Framework Effect Adapter (codegen React/Vue/Svelte/Angular) | `[PARTIAL]` — `framework-usage.tsx` shows usage in 6 frameworks; no codegen of framework-specific bindings | `src/components/roycss/framework-usage.tsx` extension or new `scripts/gen-adapters.ts` | MEDIUM |
| 8.6 | CSS-Aware CI Gate | `[PARTIAL]` — `.github/workflows/ci.yml` runs lint/typecheck/tests; no `!important`/`z-index`/duration gate | New `.github/workflows/css-gate.yml` + `scripts/validate-effects.ts` extension | HIGH |

---

## 2. `docs/PLATFORM-VISION.md` — 12-product ecosystem

### 2.1 The 12 products

| # | Product described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1 | Core Framework (free, 760 effects) | `[IMPLEMENTED]` — `src/lib/effects-batch-*.ts`, `src/app/roycss.css`, dist artifacts | `src/lib/`, `dist/` | — |
| 2 | Roy Pro Components ($199/yr) | `[PARTIAL]` — 63 components exist as in-app demos in `src/components/roycss/pro/`; no separate paid tier / licensing / monorepo package | `packages/@roycss/pro/` (not started) | HIGH |
| 3 | Roy Studio (Tauri-based visual builder) | `[NOT STARTED]` — Only web-based `playground-panel.tsx` and `visual-studio.tsx` (token editor) exist; no Tauri desktop app | New repo `studio/` (Tauri) | HIGH |
| 4 | Roy Cloud (token/theme/component hosting) | `[PARTIAL]` — `backend/src/modules/cloud/` module exists; no Git-backed token repos, no multi-cursor editing, no CDN theme hosting | `backend/src/modules/cloud/` extension + cloud infra | HIGH |
| 5 | Roy Marketplace (template store) | `[PARTIAL]` — `marketplace.tsx` UI exists; `backend/src/modules/marketplace/` exists; no real creator onboarding, payments, or item review pipeline | `backend/src/modules/marketplace/` extension + Stripe connect | HIGH |
| 6 | Roy AI (assistant) | `[PARTIAL]` — `roy-ai.tsx` UI + `src/app/api/{ai-migration,ai-playground,css-doctor}/route.ts`; no vector index of effects, no hybrid retrieval, no fine-tuned model | `backend/src/modules/{mentor,review,refactor,architect,generator}/` + vector DB | HIGH |
| 7 | Roy Enterprise (SLA, private registry, LTS, security) | `[PARTIAL]` — `roy-os.tsx`, `backend/src/modules/enterprise/` exist as UI shells; no LTS policy doc, no private registry infra, no SLA program | `docs/LTS.md`, `docs/ENTERPRISE-SLA.md` (new) + `backend/src/modules/enterprise/` | HIGH |
| 8 | Roy Academy (courses + certification) | `[PARTIAL]` — `academy.tsx` UI + `backend/src/modules/{academy,certifications,mentor}/`; no proctored exams, no cert issuance pipeline | `backend/src/modules/{academy,certifications}/` extension | MEDIUM |
| 9 | Roy Inspector (Chrome extension) | `[NOT STARTED]` — No browser extension exists; only the VSCode extension | New `browser-extension/` repo (MV3) | HIGH |
| 10 | Roy DevTools (browser DevTools panel) | `[NOT STARTED]` — Same as above; no DevTools panel for Chrome/Firefox/Edge/Safari | New `browser-extension/devtools-panel/` | HIGH |
| 11 | Roy Themes (curated theme store) | `[PARTIAL]` — `theme-system.tsx` ships 10 first-party themes; no vertical-specific theme store (Healthcare/Banking/SaaS/Education/E-commerce/Government/Gaming/Media/Legal/Real Estate) | Extend `src/components/roycss/pro/theme-system.tsx` + Marketplace integration | MEDIUM |
| 12 | Roy Motion Library (Premium) | `[PARTIAL]` — `motion-library.tsx` ships 60 free presets; no premium tier with 50 choreographed sequences / 30 spring presets / 20 page transitions / gesture-driven motion / motion tokens | Extend `src/components/roycss/pro/motion-library.tsx` + paid gating | MEDIUM |
| 13 | Roy Accessibility Suite (CI + RUM + AI fix) | `[PARTIAL]` — `accessibility-suite.tsx` + `a11y/` + `tests/a11y/` exist for build-time; no RUM SDK, no AI auto-fix PR opener | `backend/src/modules/accessibility/` + RUM SDK | HIGH |

### 2.2 Section 4 — Unique Features No Competitor Has (10 differentiators)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 4.1 | Live Utility Search (semantic NL → utilities) | `[PARTIAL]` — `roy-search.tsx` (RoySearch) + `search-overlay.tsx`; no vector embedding index, no semantic search backend | `backend/src/modules/search/` extension + vector DB | HIGH |
| 4.2 | CSS Doctor CLI (`roycss doctor`) | `[IMPLEMENTED]` — `cli/index.js` ships a `doctor` command (per `dist/version-manifest.json`); `src/app/api/css-doctor/route.ts` exists | `cli/index.js`, `src/app/api/css-doctor/route.ts` | — |
| 4.3 | Component Genome (machine-readable manifest per component) | `[PARTIAL]` — `dist/pro-components.json` and `dist/class-index.json` exist; not a per-component Genome with composition graph + WCAG + browser-support + bundle size | `dist/genome/*.json` (new) + `scripts/gen-genome.ts` | HIGH |
| 4.4 | CSS Playground with AI (WebContainer-powered in-browser IDE) | `[PARTIAL]` — `playground-panel.tsx` and `playground-sheet.tsx` exist; no WebContainer integration, no AI edits-in-realtime | Extend `src/components/roycss/playground-panel.tsx` (WebContainer + AI streaming) | HIGH |
| 4.5 | Design Diff (screenshot + token-level diff) | `[PARTIAL]` — `css-diff-engine.tsx` diffs CSS; no screenshot/visual diff + token-level annotation | Extend `src/components/roycss/tools/css-diff-engine.tsx` + screenshot service | MEDIUM |
| 4.6 | Utility Explorer (hover class → CSS + perf + a11y + used-by) | `[PARTIAL]` — `property-inspector.tsx` and `property-search.tsx` exist; no unified hover popover with cost + a11y + composition graph | Extend `src/components/roycss/tools/property-inspector.tsx` | MEDIUM |
| 4.7 | AI Migration (Bootstrap/Tailwind/MUI/Bulma/styled-components → RoyCSS) | `[PARTIAL]` — `src/app/api/ai-migration/route.ts` + `roy-refactor.tsx` exist; no codemod library, no PR-ready diff output, no project-level migration (file-level only) | Extend `src/app/api/ai-migration/route.ts` + new `scripts/migrate-from-{tailwind,bootstrap,mui,chakra,animate-css}.ts` | HIGH |
| 4.8 | Pattern Library (50+ production examples per use case) | `[PARTIAL]` — `pattern-library.tsx` exists with 80+ patterns; not 50+ variations per use case (SaaS pricing, auth, admin, etc.) | Extend `src/components/roycss/pro/pattern-library.tsx` | MEDIUM |
| 4.9 | CSS Benchmark (live competitive comparison) | `[PARTIAL]` — `roy-benchmark.tsx` (RoyBenchmark) UI + `backend/src/modules/benchmark/` + `perf/benchmark.ts` exist; no live reproducible comparison vs Tailwind/Bootstrap/UnoCSS/Panda/StyleX/Bulma/MUI | Extend `src/components/roycss/pro/roy-benchmark.tsx` + competitor reference projects | MEDIUM |
| 4.10 | Community Challenges (monthly contests) | `[PARTIAL]` — `roy-challenges.tsx` (RoyChallenges) + `backend/src/modules/challenges/` exist; no monthly cadence, no prize payout, no Marketplace auto-list | Extend `src/components/roycss/pro/roy-challenges.tsx` | LOW |

### 2.3 Section 5 — Sponsorship program

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 5 | 5-tier sponsorship (Founder / Community / Gold / Platinum / Technology Partner) with modal + carousel | `[IMPLEMENTED]` — `pricing-section.tsx`, `featured-companies.tsx`, sponsorship modal referenced in `dist/version-manifest.json` ("Sponsor modal with GitHub Sponsors + Stripe (coming soon)") | `src/components/roycss/pricing-section.tsx` + `featured-companies.tsx` | — |

### 2.4 Section 6 — Go-to-Market phases

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 6.1 | Phase 1 docs site (per-effect static page `/effects/<id>`) | `[NOT STARTED]` — Effects are not at `/effects/<id>`; they live in the unified single-page catalog at `/` | `src/app/effects/[id]/page.tsx` (new) | HIGH |
| 6.2 | Phase 2 in-product upsell ("Unlock with Pro" CTAs, `roycss list` Pro tags) | `[NOT STARTED]` — Product cards have tier badges but no upgrade CTA flow; CLI does not tag Pro | `src/components/roycss/product-card.tsx` + `cli/index.js` | MEDIUM |
| 6.3 | Phase 3 Roy Cloud Team plans (live multi-cursor token editing) | `[NOT STARTED]` — `roy-live.tsx` and `mini-services/live-service/` exist for code share; no token-specific live editing | `mini-services/live-service/` extension + `backend/src/modules/cloud/` | HIGH |
| 6.4 | Phase 4 RoyCSS Conf (first annual conference) | `[NOT STARTED]` — Out of scope of code; marketing/events only | n/a (events) | LOW |

---

## 3. `docs/ROYCSS-V2-BLUEPRINT.md` — V2 production blueprint

### 3.1 Architecture & folder structure

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1.1 | CSS-first / JS-optional / zero-runtime | `[IMPLEMENTED]` — `dist/roycss.css` ships zero-JS effects; JS only in the docs/demo site | `dist/roycss.css` | — |
| 1.2 | Cascade layers (`tokens → reset → base → utilities → components → variants → app`) | `[PARTIAL]` — `src/app/roycss.css` ships CSS; no `@layer` ordering documented in `dist/roycss.css` | Wrap `dist/roycss.css` in `@layer` blocks | HIGH |
| 1.3 | Monorepo layout (12+ `@roycss/*` packages) | `[NOT STARTED]` — No `packages/` folder, no `turbo.json`, no `.changeset`, no workspace declaration in `package.json` | `packages/@roycss/{core,cli,headless,styled,react,vue,svelte,angular,a11y,rum,vscode,devtools,motion,tokenstudio}/` | HIGH |
| 1.4 | Build pipeline (Lightning CSS, source maps, dual ESM/CJS, tree-shaken) | `[PARTIAL]` — `scripts/build-package.ts` builds; `dist/` ships ESM + CJS + source maps; Lightning CSS not in build | Extend `scripts/build-package.ts` (add `lightningcss`) | HIGH |
| 1.5 | Rendering strategy (SSR / streaming / critical CSS) | `[PARTIAL]` — `perf/optimize/extract-critical-css.ts` exists; not wired to Next.js streaming SSR | Wire into `src/app/layout.tsx` | MEDIUM |

### 3.2 CLI (Section 3) — V2 commands

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 3.1 | `roycss init` interactive wizard | `[PARTIAL]` — `cli/index.js` ships `init`; not documented as the V2 wizard with config scaffolding | Extend `cli/index.js` | MEDIUM |
| 3.2 | `roycss.config.ts` generated config | `[NOT STARTED]` — No config file format or loader | `cli/index.js` + `src/lib/load-config.ts` (new) | HIGH |
| 3.3 | `roycss add` component scaffolding | `[PARTIAL]` — `cli/index.js` ships `add`; works for effects only, not for components from a registry | Extend `cli/index.js` | MEDIUM |
| 3.4 | `roycss theme` brand-to-palette | `[NOT STARTED]` — `roy-color-studio.tsx` UI exists; no CLI command | Extend `cli/index.js` | LOW |
| 3.5 | `roycss migrate` codemod driver | `[PARTIAL]` — `scripts/migrate-colors.ts`, `scripts/migrate-logical.ts` exist; not exposed as `roycss migrate from-*` | Extend `cli/index.js` + new `scripts/migrate-from-{tailwind,bootstrap,animate-css,mui,chakra}.ts` | HIGH |
| 3.6 | `roycss doctor` (a11y/perf/modern-CSS audit) | `[IMPLEMENTED]` — Per `dist/version-manifest.json` the CLI ships `doctor`; `src/app/api/css-doctor/route.ts` exists | `cli/index.js` | — |
| 3.7 | `roycss inspect` (CLI inspector) | `[NOT STARTED]` | Extend `cli/index.js` | LOW |
| 3.8 | `roycss a11y` (Section 9.3) | `[NOT STARTED]` — `a11y/audit.ts` exists as a script; not exposed as CLI | Extend `cli/index.js` to wrap `a11y/audit.ts` | HIGH |
| 3.9 | `roycss perf:check` / `perf:overlay` / `perf:ci` (Section 11) | `[PARTIAL]` — `perf/benchmark.ts` and `perf/regression.test.ts` exist; no `roycss perf:*` commands | Extend `cli/index.js` | MEDIUM |
| 3.10 | `roycss generate from-prompt` (Section 8.4) | `[PARTIAL]` — `roy-architect.tsx` UI + `src/app/api/ai-playground/route.ts` exist; no CLI command | Extend `cli/index.js` | MEDIUM |
| 3.11 | `roycss telemetry enable` (Section 15.5) | `[NOT STARTED]` | Extend `cli/index.js` | LOW |

### 3.3 Components (Section 5)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 5.1 | Headless / Styled split (headless primitives + styled layer) | `[NOT STARTED]` — `src/components/ui/*` is a shadcn/ui fork (Radix + Tailwind); no `@roycss/headless` package | `packages/@roycss/headless/` + `packages/@roycss/styled/` (new) | HIGH |
| 5.2 | CVA compiled variant system | `[NOT STARTED]` — shadcn/ui uses `cva` runtime; no compiled variant system | `packages/@roycss/styled/` (new) | MEDIUM |
| 5.3 | 100+ components across 12 categories | `[PARTIAL]` — `src/components/ui/*` ships 40+ shadcn components; `src/components/ui-library/*` ships 8; not 100 RoyCSS components | `packages/@roycss/styled/` (new) | HIGH |

### 3.4 Themes (Section 6)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 6.1 | Brand color → 60+ token palette generation (WCAG 2.2 AA verified) | `[PARTIAL]` — `roy-color-studio.tsx` generates palettes; no documented 60-token schema, no AA verification gate | Extend `src/components/roycss/pro/roy-color-studio.tsx` | HIGH |
| 6.2 | 10 official themes (Nord, Tokyo Night, Catppuccin, Dracula, GitHub, Linear, Solarized, Gruvbox, Rose Pine, RoyCSS Default) | `[PARTIAL]` — `theme-system.tsx` ships 10 presets (forest, sunset, midnight, etc.); the **named** V2 themes are different | Extend `src/components/roycss/pro/theme-system.tsx` | MEDIUM |
| 6.3 | Runtime theme switching (`light-dark()` + multi-theme coexistence) | `[PARTIAL]` — `light-dark-explorer.tsx` exists; `light-dark()` used in CSS; no multi-theme coexistence on a single page | Extend `src/components/roycss/tools/light-dark-explorer.tsx` | MEDIUM |

### 3.5 RoyMotion V2 (Section 7)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 7.1 | Layered architecture (utility classes + choreography + timeline) | `[PARTIAL]` — `motion-primitives.tsx`, `motion-library.tsx`, `animation-timeline.tsx`, `roymotion-showcase.tsx`, `src/app/roymotion.css` exist; not layered into V2 packages | `packages/@roycss/motion/` (new) | HIGH |
| 7.2 | 240 utility classes (CSS-first motion) | `[PARTIAL]` — `src/app/roymotion.css` ships motion utilities; not 240 documented classes | Extend `src/app/roymotion.css` | MEDIUM |
| 7.3 | Multi-element choreography API | `[PARTIAL]` — `animation-timeline.tsx` exists; no declarative choreography API | Extend `src/components/roycss/animation-timeline.tsx` | MEDIUM |
| 7.4 | Declarative animation timeline | `[PARTIAL]` — Same as above | Same | MEDIUM |
| 7.5 | Scroll-driven animations (native `animation-timeline: view()`) | `[IMPLEMENTED]` — `scroll-animation-builder.tsx` tool + effects use `animation-timeline` | `src/components/roycss/tools/scroll-animation-builder.tsx` | — |
| 7.6 | Gesture-based motion (drag, swipe, pinch, rotate, tap, long-press) | `[NOT STARTED]` | `packages/@roycss/motion/gestures/` (new) | MEDIUM |
| 7.7 | Spring physics + `linear()` easing | `[PARTIAL]` — `easing-visualizer.tsx` and `starting-style-studio.tsx` exist; `linear()` used in CSS; no named spring presets library | Extend `src/components/roycss/tools/easing-visualizer.tsx` | MEDIUM |
| 7.8 | View Transitions API route transitions (Next.js/Astro/SvelteKit/Remix/Nuxt adapters) | `[PARTIAL]` — `view-transition.tsx` tool exists; no router adapters | `packages/@roycss/motion/view-transitions/` (new) | HIGH |
| 7.9 | Cross-document MPA View Transitions | `[NOT STARTED]` | Same as 7.8 | MEDIUM |

### 3.6 Documentation (Section 8)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 8.1 | Versioned docs site (per-minor snapshots at `/docs/2.3/...`) | `[NOT STARTED]` — `src/app/docs/**` is single-version only | `src/app/docs/[version]/...` (new) | HIGH |
| 8.2 | Interactive docs (live preview in docs) | `[PARTIAL]` — `docs-viewer.tsx` and `docs-content.tsx` render MDX-like content; some live previews | Extend `src/components/docs/` | MEDIUM |
| 8.3 | AI search — hybrid (lexical + vector) | `[NOT STARTED]` — `docs-search.tsx` is keyword search only | `backend/src/modules/search/` extension + vector DB | HIGH |
| 8.4 | Code generation from prompts (in docs) | `[PARTIAL]` — `src/app/api/ai-playground/route.ts` exists; not embedded in docs | Embed in `src/components/docs/docs-content.tsx` | MEDIUM |
| 8.5 | Documentation sections (Introduction, Installation, Tokens, Effects catalog, Recipes, Modern CSS guide, Migration guide, Contributing) | `[PARTIAL]` — `src/app/docs/` has installation, getting-started, concepts, guides, api; no "Modern CSS guide" or versioned "Migration guide" per version | Add `src/app/docs/guides/modern-css/page.tsx` | MEDIUM |
| 8.6 | "Edit on GitHub" link per doc page | `[NOT STARTED]` | `src/components/docs/docs-content.tsx` (new) | LOW |
| 8.7 | Per-page feedback widget | `[NOT STARTED]` | `src/components/docs/docs-content.tsx` (new) | LOW |
| 8.8 | Last-updated timestamp | `[NOT STARTED]` | Same | LOW |
| 8.9 | Code samples tested in CI | `[PARTIAL]` — `tests/unit/` runs on library code; docs samples not tested | `.github/workflows/ci.yml` extension | HIGH |

### 3.7 Accessibility engine (Section 9)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 9.1 | WCAG 2.2 AA policy (global `prefers-reduced-motion` rule) | `[PARTIAL]` — `a11y/reduced-motion.ts` audits; `animation-pauser.tsx` ships; no global policy doc | `docs/ACCESSIBILITY-POLICY.md` (new) | HIGH |
| 9.2 | Automated audit (`@roycss/a11y`) with 27 rules + build-fail | `[PARTIAL]` — `a11y/audit.ts` exists; not packaged as `@roycss/a11y`; rule count not 27; build does not fail on violations | `packages/@roycss/a11y/` (new) + `.github/workflows/ci.yml` gate | HIGH |
| 9.3 | `roycss a11y` CLI | `[NOT STARTED]` | `cli/index.js` | HIGH |
| 9.4 | Reduced motion — universal (one media query disables all non-essential animation) | `[PARTIAL]` — `animation-pauser.tsx` pauses offscreen; reduced-motion CSS not universally applied | `src/app/roycss.css` global rule | HIGH |
| 9.5 | Cognitive accessibility (motion safety tagging per effect) | `[NOT STARTED]` | `src/lib/effect-taxonomy.ts` extension | LOW |

### 3.8 Developer tools (Section 10)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 10.1 | VS Code extension (`@roycss/vscode`) with LSP, autocomplete, diagnostics, dead-class detection, a11y hints, migration code actions | `[PARTIAL]` — `vscode-extension/` ships snippets, completion provider, hover provider, search panel, recently-used; no LSP, no diagnostics, no dead-class detection, no a11y hints, no migration code actions | Extend `vscode-extension/src/` | HIGH |
| 10.2 | Browser DevTools panel (`@roycss/devtools`) | `[NOT STARTED]` | New `browser-extension/` repo | HIGH |
| 10.3 | CLI Inspector (`roycss inspect`) | `[NOT STARTED]` | `cli/index.js` | LOW |
| 10.4 | Visual Debugger | `[PARTIAL]` — `roy-sandbox.tsx`, `roy-preview.tsx` exist; no debugger with breakpoint/scrub | `src/components/roycss/pro/roy-sandbox.tsx` extension | MEDIUM |

### 3.9 Performance strategy (Section 11)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 11.1 | Performance budget (CSS gzip ≤ 28KB, raw ≤ 280KB, DOM ≤ 8000, animations ≤ 60, `backdrop-filter` ≤ 50, LCP ≤ 1.5s, INP ≤ 50ms) enforced in CI | `[PARTIAL]` — `perf/regression.test.ts` and `perf/benchmarks/*` measure; no CI budget gate | `.github/workflows/ci.yml` budget gate | HIGH |
| 11.2 | Zero-runtime CSS (no JS injected) | `[IMPLEMENTED]` — `dist/roycss.css` ships pure CSS | `dist/roycss.css` | — |
| 11.3 | Tree-shaking via Lightning CSS | `[NOT STARTED]` — Build uses custom dedup, not Lightning CSS | `scripts/build-package.ts` | HIGH |
| 11.4 | Critical CSS — streaming SSR | `[PARTIAL]` — `perf/optimize/extract-critical-css.ts` exists; not wired to Next.js streaming | `src/app/layout.tsx` | MEDIUM |
| 11.5 | Bundle budgets in CI (`bundlesize`) | `[NOT STARTED]` | `.github/workflows/ci.yml` | HIGH |
| 11.6 | Real User Monitoring (`@roycss/rum`) | `[NOT STARTED]` — `backend/src/modules/profiler/` and `backend/src/modules/observatory/` exist as UI shells; no RUM SDK in production | `packages/@roycss/rum/` (new) | HIGH |

### 3.10 Plugin system (Section 12)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 12.1 | Plugin API (`roycss.plugin({ name, effects, tokens, transformers })`) | `[NOT STARTED]` — Only `plugin-hub.tsx` UI and `backend/src/modules/plugin-hub/` exist | `packages/@roycss/core/plugin-api.ts` (new) | HIGH |
| 12.2 | Plugin lifecycle (init, build, emit, post-build hooks) | `[NOT STARTED]` | Same | HIGH |
| 12.3 | Example plugins | `[NOT STARTED]` | `packages/@roycss/plugin-*/` (new) | MEDIUM |
| 12.4 | Official plugins (rtl, print, a11y-strict, brand-colors, tailwind-compat) | `[NOT STARTED]` | Same | MEDIUM |
| 12.5 | Plugin marketplace (`roycss.dev/plugins`) | `[PARTIAL]` — `plugin-hub.tsx` UI exists; no real plugin registry | `backend/src/modules/plugin-hub/` extension | MEDIUM |
| 12.6 | Plugin discovery (npm `roycss-plugin-*` convention) | `[NOT STARTED]` | `cli/index.js` extension | MEDIUM |

### 3.11 Testing strategy (Section 13)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 13.1 | Visual regression (Playwright + Chromatic) | `[PARTIAL]` — `tests/e2e/` uses Playwright; no Chromatic CI integration | `.github/workflows/ci.yml` extension | MEDIUM |
| 13.2 | A11y testing (axe-core + Playwright) | `[IMPLEMENTED]` — `tests/a11y/axe-audit.ts` + `tests/a11y/keyboard-nav.ts` + `tests/a11y/visual-checks.ts` exist | `tests/a11y/` | — |
| 13.3 | Cross-browser testing (BrowserStack / Baseline 2024) | `[NOT STARTED]` — No BrowserStack integration | `.github/workflows/ci.yml` extension | MEDIUM |
| 13.4 | Performance testing (Lighthouse CI) | `[NOT STARTED]` — No Lighthouse CI workflow | `.github/workflows/ci.yml` extension | HIGH |
| 13.5 | Test coverage targets (90% statements, 80% branches) | `[UNKNOWN]` — `vitest.config.ts` exists; no coverage gate enforcement | `.github/workflows/ci.yml` extension | MEDIUM |

### 3.12 Migration strategy (Section 14)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 14.1 | V1 → V2 codemod | `[NOT STARTED]` — No V2 package exists to migrate to | `scripts/migrate-v1-to-v2.ts` (new) | HIGH |
| 14.2 | Tailwind → RoyCSS codemod | `[NOT STARTED]` | `scripts/migrate-from-tailwind.ts` (new) | HIGH |
| 14.3 | Bootstrap → RoyCSS codemod | `[NOT STARTED]` | `scripts/migrate-from-bootstrap.ts` (new) | HIGH |
| 14.4 | Animate.css → RoyCSS codemod | `[NOT STARTED]` | `scripts/migrate-from-animate-css.ts` (new) | MEDIUM |
| 14.5 | MUI → RoyCSS codemod | `[NOT STARTED]` | `scripts/migrate-from-mui.ts` (new) | MEDIUM |
| 14.6 | Chakra → RoyCSS codemod | `[NOT STARTED]` | `scripts/migrate-from-chakra.ts` (new) | LOW |
| 14.7 | Gradual adoption mode (side-by-side) | `[PARTIAL]` — Effects are CSS-only and can be added incrementally; no documented "gradual adoption" mode in CLI | `cli/index.js` + docs | MEDIUM |

### 3.13 Roadmap (Section 16) — 12-month milestones

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 16.1 | Q1 V2.0 — 12 monorepo packages published | `[NOT STARTED]` — No `packages/` folder | `packages/@roycss/*` (new) | HIGH |
| 16.2 | Q2 V2.1 — Plugin marketplace at `roycss.dev/plugins` | `[PARTIAL]` — `plugin-hub.tsx` exists; no marketplace live | `src/app/plugins/page.tsx` (new) | MEDIUM |
| 16.3 | Q2 V2.1 — AI codegen (`roycss generate from-prompt`) | `[PARTIAL]` — `roy-architect.tsx` + `roy-generator.tsx` + `src/app/api/ai-playground/route.ts` exist; no CLI command | `cli/index.js` | MEDIUM |
| 16.4 | Q2 V2.1 — Browser DevTools panel (Chrome + Firefox) | `[NOT STARTED]` | New `browser-extension/` repo | HIGH |
| 16.5 | Q3 V2.2 — RoyMotion gesture library | `[NOT STARTED]` | `packages/@roycss/motion/gestures/` (new) | MEDIUM |
| 16.6 | Q3 V2.2 — React Native adapter (stable) | `[NOT STARTED]` | `packages/@roycss/react-native/` (new) | LOW |
| 16.7 | Q3 V2.2 — Figma plugin (token sync bidirectional) | `[NOT STARTED]` | New `figma-plugin/` repo | MEDIUM |
| 16.8 | Q3 V2.2 — Lottie adapter for RoyMotion | `[NOT STARTED]` | `packages/@roycss/motion/lottie/` (new) | LOW |
| 16.9 | Q4 V2.3 — RoyCSS Cloud (theme sync, audit logs, SSO) | `[PARTIAL]` — `backend/src/modules/cloud/` exists; no SSO, no audit logs in cloud module | `backend/src/modules/cloud/` extension | HIGH |
| 16.10 | Q4 V2.3 — VPAT 2.4 (WCAG 2.2 conformance report) | `[NOT STARTED]` — No VPAT document | `docs/VPAT-2.4.md` (new) | HIGH |
| 16.11 | Q4 V2.3 — SLSA Level 3 build provenance | `[PARTIAL]` — `.github/workflows/release.yml` ships `npm publish --provenance` (SLSA L3 for npm); no hermetic build / signed artifacts beyond npm | `.github/workflows/release.yml` extension | HIGH |
| 16.12 | Q4 V2.3 — LTS program launch | `[NOT STARTED]` — No LTS policy doc | `docs/LTS.md` (new) | HIGH |
| 16.13 | Q4 V2.3 — SOC 2 Type II audit (target Q1 2027) | `[NOT STARTED]` — Out of code scope | n/a | MEDIUM |
| 16.14 | Deprecation policy (warning → codemod → removal in next major) | `[NOT STARTED]` — No policy doc | `docs/DEPRECATION.md` (new) | MEDIUM |
| 16.15 | LTS branches (18 months support per major) | `[NOT STARTED]` — No release-branches | `git` branching strategy | MEDIUM |
| 16.16 | Governance — 5 maintainers + 9 steering committee | `[NOT STARTED]` — Single maintainer per `ENTERPRISE-REVIEW.md` R1 | `docs/GOVERNANCE.md` (new) | HIGH |
| 16.17 | RFC process (`rfcs/` directory, 14-day review, 2 core + 3 community approvals) | `[NOT STARTED]` — No `rfcs/` dir | `rfcs/` (new) | HIGH |
| 16.18 | Code of Conduct (Contributor Covenant 2.1) | `[NOT STARTED]` — No `CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.md` (new) | HIGH |
| 16.19 | Security disclosure (`security@roycss.dev`, PGP, 24-h acknowledgement) | `[PARTIAL]` — `security/SECURITY-POLICY.md` exists; no PGP, no public mailbox documented | `security/SECURITY-POLICY.md` extension | MEDIUM |

---

## 4. `docs/FIRST-PRINCIPLES-REDESIGN.md` — 15 core features

### 4.1 Must-have for v2 (Q1 2026) — 9 features

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| F1 | Intent-Class Compiler (`r-card`, `r-btn`, 50 patterns × 10 variants × 8 modifiers × 20 behaviors) | `[NOT STARTED]` — No intent-class compiler; current classes are `roycss-*` CSS classes | `packages/@roycss/compiler/` (new) | HIGH |
| F2 | Living Palette System (brand → 60+ tokens, WCAG AA verify, `light-dark()` runtime, 3 reference themes Default/Tokyo/Nord) | `[PARTIAL]` — `roy-color-studio.tsx` and `theme-system.tsx` exist; no 60-token schema, no Default/Tokyo/Nord references | `src/components/roycss/pro/roy-color-studio.tsx` + `src/lib/design-tokens.ts` | HIGH |
| F3 | Cascade Constitution (`@layer` defaults, build-time enforcement, `@roycss-escape` annotation, `strict: false` mode) | `[NOT STARTED]` — `css-layers.tsx` tool visualizes layers; no constitution / enforcement / escape annotation | `packages/@roycss/core/cascade-constitution.ts` (new) | HIGH |
| F4 | Anchor-First Overlay System (`r-menu`, `r-tooltip`, `r-popover`, `r-dropdown`, `r-combobox` with Popover API + CSS Anchor Positioning + 1.2KB polyfill) | `[PARTIAL]` — `anchor-positioning.tsx` tool exists; shadcn/ui uses Radix Popover; no Anchor-Positioning-first RoyCSS overlay system | `packages/@roycss/headless/overlays/` (new) | HIGH |
| F5 | Scope-Encapsulated Components (`@scope` blocks for all 50 patterns, `@roycss-scoped()` helper, codemod from CSS Modules/BEM/styled-components) | `[NOT STARTED]` — No `@scope` usage in `src/app/roycss.css` | `packages/@roycss/styled/scoped/` (new) | HIGH |
| F6 | Physics-Based Motion Primitives (20 motion intents, `linear()` emission, mandatory reduced variants, `useDragIntent()` gesture hook) | `[PARTIAL]` — `motion-library.tsx` has 60 presets; `easing-visualizer.tsx` exists; no 20 named intents with physics; no `useDragIntent` | `packages/@roycss/motion/physics/` (new) | HIGH |
| F7 | View Transition Choreography (`vt-name` attribute, router adapters Next/Astro/SvelteKit/Remix/Nuxt, MPA cross-document) | `[PARTIAL]` — `view-transition.tsx` tool exists; no router adapters, no MPA cross-document | `packages/@roycss/motion/view-transitions/` (new) | MEDIUM |
| F8 | Build-Time Accessibility Constitution (contrast checking, motion variant enforcement, focus-visible enforcement, touch target checking, ARIA pattern checks, `strict: false` mode) | `[PARTIAL]` — `a11y/audit.ts` covers some; not packaged as a constitution; not build-fail by default | `packages/@roycss/a11y/` (new) | HIGH |
| F9 | Token Type System (`@property`-registered tokens, TypeScript types emitted, static check, W3C DTCG JSON) | `[PARTIAL]` — `src/lib/design-tokens.ts` exports typed tokens; `@property` used in CSS; no W3C DTCG JSON emission; no static compiler check | `packages/@roycss/core/token-types/` (new) | HIGH |
| F10 | Container-Adaptive Components (all 50 patterns container-adaptive, `@roycss-container` directive, codemod from viewport media queries) | `[PARTIAL]` — `container-query-builder.tsx` tool exists; some primitives use container queries; no `@roycss-container` directive; no codemod | `packages/@roycss/styled/container-adaptive/` (new) | MEDIUM |

### 4.2 Nice-to-have for v2.x (Q2–Q3 2026) — 6 features

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| F11 | CSS as Compilation Target (`data-r-intent` directive, `roycss.intent()` CLI, `@roycss/ai` package, auto-generated `roycss.rules.md`, Cursor/Copilot/Continue integrations) | `[NOT STARTED]` | `packages/@roycss/ai/` (new) + `dist/roycss.rules.md` | HIGH |
| F12 | Performance Observable Framework (`roycss perf:check`, `perf:overlay`, `perf:ci`, Playwright route testing, PerformanceObserver with source-map attribution) | `[PARTIAL]` — `perf/benchmark.ts` and `roy-profiler.tsx` exist; no CLI commands, no Playwright route testing, no source-map attribution | `cli/index.js` + `packages/@roycss/perf/` (new) | MEDIUM |
| F13 | Multi-Surface Token Emission (`tokens.ios.swift`, `tokens.android.kt`, `tokens.figma.json`, `tokens.windows.xaml`, `tokens.flutter.dart`, Figma plugin for bi-directional sync, gamut mapping) | `[NOT STARTED]` — `src/lib/design-tokens.ts` exports JSON only | `scripts/emit-tokens-{ios,android,figma,windows,flutter}.ts` (new) | MEDIUM |
| F14 | Self-Healing CSS Linter (`@roycss/vscode` LSP, `roycss lint` CLI, `roycss doctor` full audit, auto-fix with `--fix`, community rule API) | `[PARTIAL]` — `roycss doctor` exists; `vscode-extension/src/completion-provider.ts` has hints; no LSP, no `roycss lint`, no auto-fix, no community rule API | `packages/@roycss/lint/` (new) + `cli/index.js` | HIGH |
| F15 | Composable Effect Recipes (recipe format, recipe registry, `@roycss-recipe/*` npm org, V1 effects → recipe pack, composition engine) | `[PARTIAL]` — `recipes-section.tsx` and `backend/src/modules/recipes/` exist with 12 recipes; no recipe format spec, no `@roycss-recipe/*` org, no composition engine | `packages/@roycss-recipes/` (new) | MEDIUM |

### 4.3 Long-term research for v3 (2027+) — 10 directions

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| R1 | Time-Aware CSS (`@timeline` directive, cookie-backed custom properties) | `[NOT STARTED]` | Research repo | LOW |
| R2 | Layout Intent API (`r-layout:sidebar-with-sticky-header`, `r-layout:holy-grail`, `r-layout:dashboard-3col`) | `[NOT STARTED]` | `packages/@roycss/compiler/layouts/` (research) | LOW |
| R3 | Pure-CSS Behavioral Primitives (tabs/accordions/dropdowns/modals via `:has()`, `<details>`, `popover`, `<dialog>`) | `[PARTIAL]` — shadcn/ui uses Radix (JS-driven); no pure-CSS versions shipped | `packages/@roycss/headless/pure-css/` (research) | LOW |
| R4 | Manifest-Driven Styling (`roycss.toml` project manifest) | `[NOT STARTED]` | `cli/index.js` + `roycss.toml` schema | LOW |
| R5 | CSS Trigonometry Layouts (`sin()`, `cos()`, `tan()` for radial/organic grids) | `[NOT STARTED]` | Research | LOW |
| R6 | WebGPU-Accelerated Effects (particle systems, fluid simulations, complex shaders) | `[PARTIAL]` — `src/components/roycss/effects/webgl-showcase.tsx` and `three-tubes-demo.tsx` use WebGL/Three.js, not WebGPU | `src/components/roycss/effects/webgpu-*` (research) | LOW |
| R7 | Real-Time Collaboration Tokens (Figma↔IDE↔running-app sync over WebSocket) | `[PARTIAL]` — `mini-services/live-service/` exists for code share; no token-specific sync | `mini-services/live-service/` extension | LOW |
| R8 | WCAG 3.0 Compliance Engine (APCA-like model) | `[NOT STARTED]` — WCAG 2.x only | `packages/@roycss/a11y/wcag-3/` (research) | LOW |
| R9 | AI-Generated Pattern Catalog (AI generates `r-pricing-card` on demand) | `[PARTIAL]` — `roy-architect.tsx` and `roy-generator.tsx` generate code from prompts; no generated pattern added to project catalog | `src/components/roycss/pro/roy-architect.tsx` extension | LOW |
| R10 | Cross-Reality CSS (WebXR tokens/patterns for depth/parallax/gaze) | `[NOT STARTED]` | Research | LOW |

---

## 5. `docs/LABS-26-REINVENT-CSS.md` — RoyLang

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1 | RoyLang language specification (intent verbs, block kinds, modifiers, scoping, escape hatches, types/validation) | `[NOT STARTED]` — No RoyLang parser/compiler exists | `packages/@roycss/roylang/` (new) | HIGH |
| 2 | Compiler (lex → parse → resolve → compose → optimize → emit → validate) | `[NOT STARTED]` | Same | HIGH |
| 3 | RoyLang vs raw CSS examples (card, grid, button, animated hover, form layout) | `[NOT STARTED]` | Same + `docs/roylang/` (new) | MEDIUM |
| 4 | Migration from raw CSS, Tailwind, Bootstrap, CSS-in-JS, incremental adoption | `[NOT STARTED]` | `scripts/migrate-to-roylang.ts` (new) | MEDIUM |
| 5 | Watch mode + incremental compilation + source maps + DevTools | `[NOT STARTED]` | Same | MEDIUM |

---

## 6. `docs/LABS-27-RESEARCH-DIVISION.md` — Research findings + decade predictions

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 2.1 | CSS as compile target (compiler emits CSS from intent) | `[NOT STARTED]` — Same as RoyLang (LABS-26) | `packages/@roycss/compiler/` | HIGH |
| 2.2 | AI-generated CSS surpassing human-written | `[PARTIAL]` — `roy-architect.tsx`, `roy-generator.tsx`, `roy-ai.tsx`, `src/app/api/ai-playground/route.ts` exist; no telemetry proving volume | Backend AI modules + analytics | MEDIUM |
| 4.2 | LLMs write RoyLang better than CSS | `[NOT STARTED]` — RoyLang does not exist | Same as LABS-26 | LOW |
| 4.4 | "Prompt-to-Component" workflow | `[PARTIAL]` — `roy-architect.tsx` generates pages; no full prompt-to-component pipeline with versioned output | `src/components/roycss/pro/roy-architect.tsx` extension | MEDIUM |
| 5.2 | Spatial CSS (AR/VR/WebXR-aware tokens) | `[NOT STARTED]` | Research | LOW |
| 5.4 | Self-healing CSS (lint + auto-fix + AI suggestions) | `[PARTIAL]` — `roy-review.tsx` (RoyReview) + `roy-refactor.tsx` exist; no self-healing loop | `packages/@roycss/lint/` (new) | MEDIUM |
| 6.1 | Styling as interface specification (2035 vision) | `[NOT STARTED]` | Research | LOW |
| 7.1 | 2026-2027: Ship the compiler | `[NOT STARTED]` | Same as LABS-26 | HIGH |
| 7.2 | 2027-2028: Ship the AI layer | `[PARTIAL]` — AI modules exist as UIs; no integrated AI layer | `backend/src/modules/{ai,mentor,review,refactor,architect,generator}/` consolidation | HIGH |
| 7.3 | 2028-2030: Ship multi-surface emission | `[NOT STARTED]` — Same as F13 | `scripts/emit-tokens-*.ts` | MEDIUM |
| 7.4 | 2030-2035: Ship interface contracts | `[NOT STARTED]` | Research | LOW |

---

## 7. `docs/LABS-28-DELETE-HALF.md` — Cut proposal

This document proposes **deletions**, not additions. Where the current codebase still has the items proposed for deletion, the status is `[DEPRECATED]` (the proposal says remove; current code still ships them).

| # | Item proposed for deletion | Status | Where it lives today | Priority |
|---|---|---|---|---|
| 2.1 | 700 effects → cut to ~180 effects across 6 categories | `[DEPRECATED]` — Codebase ships 1569+ effects across 20+ categories per `dist/version-manifest.json` (grew, not shrunk) | `src/lib/effects-batch-*.ts` | (decision pending) |
| 2.3 | 20 categories → 6 categories (motion, surface, edge, type, input, field) | `[DEPRECATED]` — Codebase ships 20+ categories | `src/lib/effect-taxonomy.ts` | (decision pending) |
| 2.4 | Delete the 24-component library (shadcn/ui fork) | `[DEPRECATED]` — `src/components/ui/*` still ships 40+ shadcn components | `src/components/ui/` | (decision pending) |
| 2.5 | Delete RoyMotion runtime (move to CSS-only + recipes) | `[DEPRECATED]` — `src/app/roymotion.css` + `motion-primitives.tsx` + `roymotion-showcase.tsx` still ship as runtime | `src/app/roymotion.css` | (decision pending) |
| 2.6 | Delete the CLI (replace with `@import "roycss/motion.css"`) | `[DEPRECATED]` — `cli/index.js` ships 8 commands | `cli/index.js` | (decision pending) |
| 2.7 | Delete the color customizer UI (keep tokens, delete UI) | `[DEPRECATED]` — `roy-color-studio.tsx` ships a full customizer UI | `src/components/roycss/pro/roy-color-studio.tsx` | (decision pending) |
| 2.8 | Delete the favorites system (use bookmarklet/URL param) | `[DEPRECATED]` — `use-favorites.ts`, `favorites-sheet.tsx`, `recent-effects-sheet.tsx` still ship | `src/hooks/use-favorites.ts`, `src/components/roycss/favorites-sheet.tsx` | (decision pending) |
| 2.9 | Delete framework adapters (one-line docs instead) | `[DEPRECATED]` — `framework-usage.tsx` ships 6-framework tabs | `src/components/roycss/framework-usage.tsx` | (decision pending) |
| 2.10 | Delete VS Code snippets (community-maintained only) | `[DEPRECATED]` — `vscode-extension/` ships maintained snippets | `vscode-extension/` | (decision pending) |
| 2.11 | Delete the section scrollbar | `[DEPRECATED]` — `section-scrollbar.tsx` still ships | `src/components/roycss/section-scrollbar.tsx` | (decision pending) |
| 2.12 | Delete the scroll-to-top button | `[DEPRECATED]` — `scroll-to-top.tsx` still ships | `src/components/roycss/scroll-to-top.tsx` | (decision pending) |
| 3.4 | Recipes section (replace RoyMotion with recipes) | `[IMPLEMENTED]` — `recipes-section.tsx` + `backend/src/modules/recipes/` ship 12 recipes | `src/components/roycss/recipes-section.tsx` | — |
| 3.5 | "Modern CSS" guide docs page (send people away from RoyCSS) | `[NOT STARTED]` — No `src/app/docs/guides/modern-css/page.tsx` | `src/app/docs/guides/modern-css/page.tsx` (new) | MEDIUM |
| 3.6 | Migration guide docs page | `[IMPLEMENTED]` — `src/app/docs/guides/migration/page.tsx` exists | `src/app/docs/guides/migration/page.tsx` | — |

---

## 8. `docs/LABS-29-APPLE-DESIGN-REVIEW.md` — Apple HIG review

This document proposes **design refinements**, not new features. Where current implementation matches the proposed redesign, status is `[IMPLEMENTED]`; otherwise `[PARTIAL]` / `[NOT STARTED]`.

| # | Proposed refinement | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1.2 | Hero with three elements (wordmark, one sentence, one primary action) | `[PARTIAL]` — `src/app/page.tsx` ships a hero; per Ferrum analysis it has multiple parallax blobs and a marquee | `src/app/page.tsx` | MEDIUM |
| 2.2 | Nav with four items (wordmark, Effects, Docs, GitHub) | `[PARTIAL]` — `sticky-mini-nav.tsx` ships more than four items | `src/components/roycss/sticky-mini-nav.tsx` | LOW |
| 3.2 | Standardize card aspect ratio + unify preview canvas + remove on-scroll entrance animation | `[PARTIAL]` — `effect-card.tsx` and `virtual-scroll-grid.tsx` ship; not standardized 4:3 / unified canvas | `src/components/roycss/effect-card.tsx` | MEDIUM |
| 4.2 | Effect dialog: two panes only (preview + code), delete customizer/framework/related tabs | `[PARTIAL]` — `effect-detail-dialog.tsx` ships tabs | `src/components/roycss/effect-detail-dialog.tsx` | LOW |
| 5.2 | Replace OKLCH sliders with curated palette (8–12 swatches) + native color input + persist to localStorage + reflect in copied code | `[PARTIAL]` — `roy-color-studio.tsx` uses sliders; no curated swatches, no localStorage-persisted customization reflected in copied code | `src/components/roycss/pro/roy-color-studio.tsx` | MEDIUM |
| 6.2 | Favorites as URL query param (`?favorites=id1,id2,id3`); export with header/footer/license | `[PARTIAL]` — `favorites-sheet.tsx` uses localStorage + export; no URL-param filter, no export header | `src/components/roycss/favorites-sheet.tsx` | LOW |
| 7.2 | Get Started guide: three steps, full-snippet copy buttons, no deploy step | `[PARTIAL]` — `src/app/docs/getting-started/` ships 7 pages (installation, first-effect, cli, importing, frameworks, mcp-server, vscode-snippets) | `src/app/docs/getting-started/` | LOW |
| 8.2 | RoyMotion showcase as recipes gallery with source inline + reduced-motion respect | `[PARTIAL]` — `roymotion-showcase.tsx` ships; `recipes-section.tsx` exists separately | `src/components/roycss/roymotion-showcase.tsx` | LOW |
| 9.2 | Docs: version selector, Algolia DocSearch, "Edit on GitHub" link, scroll progress bar, tested code samples | `[PARTIAL]` — `docs-search.tsx` exists (not Algolia); no version selector; no Edit link; no progress bar; samples not tested in CI | `src/components/docs/` + `src/app/docs/layout.tsx` | MEDIUM |
| 10.2 | FAQ as plain prose with real questions + accessibility answer links to real audit | `[PARTIAL]` — `faq-section.tsx` ships an accordion; per the doc, prose is preferred | `src/components/roycss/faq-section.tsx` | LOW |
| 12.1 | Two-value section rhythm (`py-16` or `py-32`) | `[UNKNOWN]` — Not audited at this level | n/a | LOW |
| 12.7 | Accessibility: WCAG 2.2 AA audit, per-effect a11y tag | `[PARTIAL]` — `a11y/audit.ts` runs; no published audit, no per-effect tag in catalog UI | `docs/ACCESSIBILITY-AUDIT.md` (new) + `src/components/roycss/effect-card.tsx` | HIGH |
| 12.8 | Performance: paginated/virtualized catalog, per-category CSS, Lighthouse 95+ | `[IMPLEMENTED]` — `virtual-scroll-grid.tsx` virtualizes; per Ferrum analysis Lighthouse estimated 90+ | `src/components/roycss/virtual-scroll-grid.tsx` | — |

---

## 9. `docs/LABS-30-ONE-MILLION-USERS.md` — Scalability plan

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1.1 | One file per effect (`src/effects/<category>/<id>.css` + `<id>.meta.json`) | `[NOT STARTED]` — Effects live in `src/lib/effects-batch-*.ts` (batch files) | `src/effects/<category>/<id>.css` (migration) | HIGH |
| 1.2 | Single deduplicated tree-shaken CSS bundle (shared keyframes emit once) | `[PARTIAL]` — `scripts/build-package.ts` builds; no shared-keyframe dedup | Extend `scripts/build-package.ts` | HIGH |
| 1.3 | Pre-rendered catalog at build time (`/effects/<id>` static pages, static site export) | `[NOT STARTED]` — Catalog is single-page; no per-effect static pages | `src/app/effects/[id]/page.tsx` (new) + Next.js `output: export` | HIGH |
| 1.4 | Issue tracker separation (GitHub issues = bugs/RFCs, Discord = support, Discussions = ideas with voting) | `[NOT STARTED]` — Community policy | `docs/CONTRIBUTING.md` extension | LOW |
| 2.1 | License header on every published artifact (CSS, npm, CDN) | `[PARTIAL]` — `LICENSE` file exists; CSS / npm / CDN bundles do not carry header | `scripts/build-package.ts` extension | HIGH |
| 2.2 | SBOM + signed npm + reproducible build + SECURITY.md + 72h SLA | `[PARTIAL]` — `security/SBOM.json` + `security/SECURITY-POLICY.md` + `.github/workflows/release.yml` ships `npm publish --provenance`; no reproducible-build hash published, no 72h SLA documented | `security/` + `docs/SECURITY-SLA.md` (new) | HIGH |
| 2.3 | Tiered support model (free GitHub/Discord, paid sponsor tier, enterprise MSA) | `[PARTIAL]` — `pricing-section.tsx` ships 5 sponsorship tiers; no paid support tier with named SLA, no MSA entity | `docs/SUPPORT.md` (new) | MEDIUM |
| 2.4 | LTS policy (one major LTS at all times, 18 months after successor, codemod per breaking change) | `[NOT STARTED]` — No `docs/LTS.md` | `docs/LTS.md` (new) | HIGH |
| 3.1 | Curriculum-stable subset (6 categories + token system, versioned `/teach` URLs) | `[NOT STARTED]` — `academy.tsx` exists; no `/teach` curriculum page | `src/app/teach/page.tsx` (new) | MEDIUM |
| 3.2 | Effect maturity tags (`experimental` / `stable` / `deprecated`) in catalog filter | `[NOT STARTED]` — `effect-taxonomy.ts` does not carry maturity field | `src/lib/effect-taxonomy.ts` extension | HIGH |
| 3.3 | Conceptual primer (6 categories = 6 design questions) | `[NOT STARTED]` | `src/app/docs/concepts/categories/page.tsx` (new) | LOW |
| 4.1 | Machine-readable manifest at `/roycss.manifest.json` (every effect, category, custom props, preview type, maturity, description) | `[PARTIAL]` — `dist/effects.json`, `dist/class-index.json`, `dist/pro-components.json`, `dist/version-manifest.json` exist; not at `/roycss.manifest.json` and not unified | `public/roycss.manifest.json` (new) + `scripts/gen-manifest.ts` | HIGH |
| 4.2 | Stable naming convention `roycss-<category>-<verb>-<modifier>` enforced by build | `[PARTIAL]` — Most classes follow `roycss-*` prefix; no enforced convention in build | `scripts/validate-effects.ts` extension | MEDIUM |
| 4.3 | `usage` field with canonical HTML snippet per effect in manifest | `[NOT STARTED]` | `src/lib/effect-taxonomy.ts` extension | MEDIUM |
| 4.4 | "RoyCSS vs. other libraries" docs page (AI disambiguation) | `[NOT STARTED]` | `src/app/docs/concepts/roycss-vs-others/page.tsx` (new) | LOW |
| 5.1 | Get Started: single-page copy-paste-see-it-work in 5 minutes | `[PARTIAL]` — `src/app/docs/getting-started/installation/page.tsx` and `first-effect/page.tsx` exist; not the single-page 5-minute flow | `src/app/docs/getting-started/page.tsx` (new) | MEDIUM |
| 5.2 | Guided learning path of 10 small projects | `[NOT STARTED]` | `src/app/docs/learn/page.tsx` (new) | LOW |
| 5.3 | Dev-mode console helper (scans for unknown `roycss-*` classes, warns + suggests closest match) | `[NOT STARTED]` | `src/lib/dev-mode-helper.ts` (new, opt-in) | MEDIUM |
| 6.1 | TypeScript declarations for the manifest | `[PARTIAL]` — `dist/effects.d.ts` exists; not for the unified manifest | `dist/roycss.manifest.d.ts` (new) | MEDIUM |
| 6.2 | Format every published CSS with Prettier/Stylelint using a published config | `[NOT STARTED]` — No `.prettierrc` or `.stylelintrc` published | `.prettierrc` + `.stylelintrc` (new) | LOW |
| 7.1 | Public API surface in `API.md` (every class/property/keyframe/token, marked stable/experimental/deprecated) + CI gate | `[NOT STARTED]` — No `API.md` | `API.md` (new) + `.github/workflows/api-gate.yml` | HIGH |
| 7.2 | Codemod per breaking change (jscodeshift or postcss transform) | `[NOT STARTED]` — `scripts/migrate-colors.ts` and `scripts/migrate-logical.ts` exist; no per-breaking-change codemod library | `scripts/codemods/` (new) | HIGH |
| 7.3 | Steering committee (3–5 people) + published charter | `[NOT STARTED]` | `docs/GOVERNANCE.md` (new) | HIGH |
| 7.4 | Contribution ladder (Triager → Contributor → Collaborator → Maintainer → Steering Committee) | `[PARTIAL]` — `docs/CONTRIBUTING.md` exists; no documented ladder | `docs/CONTRIBUTING.md` extension | MEDIUM |
| 7.5 | Versioned, static, searchable docs site (MDX, tested code samples, dedicated maintainer) | `[PARTIAL]` — `src/app/docs/**` is Next.js (not static export); MDX-like via `docs-content.json`; not versioned, samples not tested | `next.config.ts` (`output: export`) + versioned routing | HIGH |
| 7.6 | Code of Conduct (Contributor Covenant) + named moderation team | `[NOT STARTED]` — No `CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.md` (new) | HIGH |
| 7.7 | Performance budget (CSS ≤ 30KB gzip full / 5KB per category, CI-enforced) | `[PARTIAL]` — `perf/regression.test.ts` measures; no CI budget gate | `.github/workflows/ci.yml` budget gate | HIGH |
| 7.8 | `SECURITY.md` with SLA + signed npm + SBOM + reproducible build + no third-party trackers | `[PARTIAL]` — `security/SECURITY-POLICY.md` + `security/SBOM.json` + signed npm exist; reproducible build hash not published | `security/` + `docs/REPRODUCIBLE-BUILD.md` | HIGH |
| 7.9 | Crowdsourced translation model (Crowdin/Weblate) + i18n message catalog + RTL via logical properties | `[PARTIAL]` — `tests/i18n/` runs RTL + OKLCH audits; no translation platform, no message catalog, `i18n-rtl` ADR exists | `src/messages/*.json` (new) + translation platform | LOW |
| 7.10 | WCAG 2.2 AA commitment + per-effect a11y tag + annual audit published | `[PARTIAL]` — `a11y/audit.ts` runs; no published audit, no per-effect tag | `docs/ACCESSIBILITY-AUDIT.md` (new) + `src/lib/effect-taxonomy.ts` | HIGH |

---

## 10. `docs/LABS-31-ELIMINATE-BOILERPLATE.md` — Intent-level abstractions

| # | Pattern described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 2 | Cards pattern abstraction (`r-card` attribute → 62–84% HTML reduction) | `[NOT STARTED]` — No `r-card` attribute; cards use `roycss-*` classes | `packages/@roycss/compiler/patterns/card.ts` (new, depends on F1) | HIGH |
| 3 | Dashboards pattern | `[NOT STARTED]` | Same | HIGH |
| 4 | Forms pattern | `[NOT STARTED]` | Same | HIGH |
| 5 | Buttons pattern | `[NOT STARTED]` | Same | HIGH |
| 6 | Modals pattern | `[NOT STARTED]` | Same | MEDIUM |
| 7 | Tables pattern | `[NOT STARTED]` | Same | MEDIUM |
| 8 | Pricing pages pattern | `[NOT STARTED]` | Same | MEDIUM |
| 9 | Landing pages pattern | `[NOT STARTED]` | Same | MEDIUM |
| 11 | Override contract (variant composition + token substitution + override hooks preserve 100% flexibility) | `[NOT STARTED]` | Same | HIGH |
| 12 | Migration & adoption plan | `[NOT STARTED]` | `scripts/migrate-to-intent-attrs.ts` (new) | LOW |

> All LABS-31 features depend on the Intent-Class Compiler (FIRST-PRINCIPLES F1) which is `[NOT STARTED]`.

---

## 11. `docs/LABS-32-AI-CODE-REVIEW.md` — AI-friendly redesign

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 3 | AI-friendly naming convention (`roycss-<category>-<verb>-<modifier>`, numeric scales, no magic suffixes, single source of truth for color names, state names match pseudo-classes) | `[PARTIAL]` — Most classes follow `roycss-*`; convention not formally enforced | `docs/NAMING-CONVENTION.md` + `scripts/validate-effects.ts` | HIGH |
| 4 | Documentation structure optimized for LLM training (concept → code mapping table, anti-examples as first-class docs) | `[NOT STARTED]` — `docs-content.json` is keyword-organized, not concept→code mapped | `docs-content.json` restructure | MEDIUM |
| 5 | Self-documenting class names (name *is* the spec, no abbreviations, composition visible in the name) | `[PARTIAL]` — Some classes use abbreviations | `docs/NAMING-CONVENTION.md` | MEDIUM |
| 6 | Type-safe API for AI autocomplete (autocomplete grammar, TypeScript types) | `[PARTIAL]` — `dist/effects.d.ts` ships types; no autocomplete grammar file | `dist/roycss.grammar.json` (new) | MEDIUM |
| 7.1 | RoyCSS system prompt for LLMs | `[NOT STARTED]` | `dist/roycss.system-prompt.md` (new) | HIGH |
| 7.2 | Example prompt → output pairs (canonical training set) | `[NOT STARTED]` | `dist/roycss.training-pairs.json` (new) | MEDIUM |
| 8 | Make AI generate correct RoyCSS on first try (`roycss.rules.md`, `@roycss/ai` package, fine-tuned RoyCSS model) | `[NOT STARTED]` — No `roycss.rules.md` shipped; no `@roycss/ai` package | `dist/roycss.rules.md` + `packages/@roycss/ai/` (new) | HIGH |
| 9 | RoyCSS AI conformance suite (test prompts + scoring rubric + public leaderboard) | `[NOT STARTED]` | `tests/ai-conformance/` (new) + public leaderboard | MEDIUM |

---

## 12. `docs/LABS-33-PERFORMANCE-LAB.md` — Performance budget

| # | Fix described | Status | Where it should live | Priority |
|---|---|---|---|---|
| §2.3 | `ResizeObserver` + `requestAnimationFrame` + debounced card measurement | `[PARTIAL]` — `virtual-scroll-grid.tsx` uses `IntersectionObserver`; per Ferrum analysis `animation-pauser.tsx` exists; no full `ResizeObserver`+rAF rewrite documented | `src/components/roycss/virtual-scroll-grid.tsx` | HIGH |
| §3.3 | Tier `backdrop-filter` (overlay-only), cap blur at 12px, `will-change` only on animated, replace with `filter: blur()` pseudo-element, remove below-fold | `[PARTIAL]` — Per Ferrum analysis `backdrop-filter` usage exists; no audit / cap / lazy-mount policy documented | `src/app/roycss.css` audit | HIGH |
| §4.3 | `will-change: auto` default, `contain: layout paint style` on cards, `content-visibility: auto` on long lists, animate only `transform` + `opacity` | `[PARTIAL]` — Per Ferrum analysis `content-visibility: auto` is already used; `will-change` audit not documented | `src/app/roycss.css` audit | HIGH |
| §5.3 | Pause off-screen animations (`IntersectionObserver` + `data-paused` + `animation-play-state: paused`), replace `background-position`/`box-shadow`/`border-radius` animations | `[IMPLEMENTED]` — `animation-pauser.tsx` ships globally | `src/components/roycss/animation-pauser.tsx` | — |
| §6.3 | `:where()` for low-specificity, direct-child selectors, scope `:has()`, cap selector depth at 3, `@scope` for component scoping, avoid `:nth-child` in long lists | `[PARTIAL]` — `:where()` used in CSS; no selector-depth lint, no `@scope` | `scripts/validate-effects.ts` + `src/app/roycss.css` | HIGH |
| §7.3 | Virtualize card grid, consolidate `IntersectionObserver`, event delegation, lazy-decode SVGs, `content-visibility: auto`, `WeakRef` for caches | `[IMPLEMENTED]` — `virtual-scroll-grid.tsx` ships (per Ferrum: 24 cards rendered, 97.7% DOM reduction); observer consolidation status unknown | `src/components/roycss/virtual-scroll-grid.tsx` | — |
| §8.3 | Cascade layers (`@layer tokens, reset, base, utilities, components, variants, app`), `:where()` for selector wrappers, lint against `!important`, audit & remove existing `!important` | `[PARTIAL]` — `:where()` used; no `@layer` ordering; `!important` count not audited | `src/app/roycss.css` + `scripts/audit-important.ts` (new) | HIGH |
| §9 | Performance budget table (12 metrics, CI-enforced) | `[PARTIAL]` — `perf/regression.test.ts` measures; no CI budget gate | `.github/workflows/ci.yml` budget gate + `perf/budget.json` (new) | HIGH |
| §10 | Implementation roadmap (15 engineer-weeks across 6 phases) | `[NOT STARTED]` — No phased plan tracked | `docs/plans/PERFORMANCE-ROADMAP.md` (new) | HIGH |

---

## 13. `docs/LABS-34-FRAMEWORK-KILLER.md` — Lock-in prevention

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| §3 | Solutions to 10 unsolved problems (refactorability, AI accuracy, bundle regressions, cascade conflicts, cross-framework portability, theming, motion intent, a11y as build error, switching cost, platform underuse) | `[PARTIAL]` — Most map to other LABS / FIRST-PRINCIPLES features already enumerated; cross-framework portability via CSS-only is `[IMPLEMENTED]`; switching cost (migration-out codemod library) is `[NOT STARTED]` | Various — see F1, F3, F5, F6, F8, F11, F14 | HIGH |
| §5.1 | "Export Contract" (RoyCSS emits plain CSS / vanilla HTML; no proprietary runtime) | `[IMPLEMENTED]` — `dist/roycss.css` ships pure CSS | `dist/roycss.css` | — |
| §5.3 | "Vanilla Build" target (build artifacts usable without any RoyCSS tooling) | `[IMPLEMENTED]` — `dist/roycss.css` + `dist/roycss.min.css` + CDN URL | `dist/` | — |
| §5.4 | "Token Portability" guarantee (W3C DTCG JSON; no RoyCSS-specific token format) | `[PARTIAL]` — `src/lib/design-tokens.ts` exports typed tokens; not W3C DTCG JSON | `src/lib/design-tokens.ts` extension | HIGH |
| §5.5 | "Migration Codemod" library (RoyCSS → Tailwind/Bootstrap/CSS-in-JS) | `[NOT STARTED]` — `migrate-colors.ts` and `migrate-logical.ts` exist for self only | `scripts/migrate-to-{tailwind,bootstrap,vanilla-css}.ts` (new) | MEDIUM |
| §5.6 | Strategic asymmetry (switching *from* RoyCSS is trivial; switching *to* RoyCSS is also trivial via inbound codemods) | `[PARTIAL]` — Inbound codemods are `[NOT STARTED]` (see V2 Blueprint §14); outbound codemods are `[NOT STARTED]` | `scripts/migrate-*` (both directions) | MEDIUM |

---

## 14. `docs/LABS-35-TEN-YEAR-ARCHITECTURE.md` — 10-year architecture

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| §1 | Stable core (CSS file artifact, `roycss-` prefix, OKLCH tokens, `@property` registered, logical properties, container queries) | `[IMPLEMENTED]` | `dist/roycss.css`, `src/lib/design-tokens.ts` | — |
| §2 | Public API contract (`API.md` with stable/experimental/deprecated tags) + CI gate that no `stable` name is removed without major bump | `[NOT STARTED]` | `API.md` (new) + `.github/workflows/api-gate.yml` | HIGH |
| §3 | Plugin API (plugin contract, lifecycle, what plugins cannot do, discovery via npm `roycss-plugin-*` convention) | `[NOT STARTED]` | `packages/@roycss/core/plugin-api.ts` (new) | HIGH |
| §4 | Extension points (tokens, keyframes, custom properties per effect, the manifest, the build pipeline) | `[PARTIAL]` — Extension via CSS custom properties is `[IMPLEMENTED]`; the manifest is `[PARTIAL]`; the build pipeline extension is `[NOT STARTED]` | `packages/@roycss/core/` (new) | HIGH |
| §4.4 | The manifest (single source of truth for AI tools, versioned with library) | `[PARTIAL]` — `dist/effects.json` + `dist/class-index.json` + `dist/pro-components.json` + `dist/version-manifest.json` exist; not unified into one manifest | `dist/roycss.manifest.json` (new) | HIGH |
| §5 | Versioning — SemVer, LTS releases, deprecation timeline, pre-release | `[PARTIAL]` — `package.json` v2.0.0; no LTS doc, no deprecation timeline, no pre-release channel | `docs/LTS.md` + `docs/DEPRECATION.md` (new) | HIGH |
| §6 | Testing strategy — visual regression, cross-browser, a11y, performance, contract tests | `[PARTIAL]` — `tests/{unit,e2e,i18n,a11y}/` and `perf/` exist; no visual regression (Chromatic), no cross-browser (BrowserStack), no contract tests | `.github/workflows/ci.yml` extensions | HIGH |
| §7 | Documentation strategy — living docs, versioned docs, community docs, tested code samples, search, editability | `[PARTIAL]` — Living docs `[IMPLEMENTED]`; versioned `[NOT STARTED]`; community `[PARTIAL]`; tested samples `[NOT STARTED]`; search `[PARTIAL]`; editability `[NOT STARTED]` | `src/app/docs/` + `src/components/docs/` | HIGH |
| §8 | Release cadence — monthly minor, weekly patch, LTS branches | `[PARTIAL]` — `.github/workflows/release.yml` ships on tag; no monthly/weekly cadence documented | `docs/RELEASE-CADENCE.md` (new) | MEDIUM |
| §9 | Migration tooling — codemod per breaking change, codemod corpus from real user code | `[NOT STARTED]` — No codemod corpus | `scripts/codemods/` (new) | HIGH |
| §10 | Community contribution — contribution ladder, good-first-issue bot, named maintainers per area | `[PARTIAL]` — `docs/CONTRIBUTING.md` exists; no ladder, no bot, no named maintainers per area | `docs/CONTRIBUTING.md` extension | MEDIUM |
| §11 | Prioritization principle (long-term maintainability over short-term features) | `[UNKNOWN]` — Cultural, not code | n/a | LOW |

---

## 15. `docs/LABS-36-IMPOSSIBLE-QUESTION.md` — CSS psychology redesign

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| §6.1 | Locality by default (cures non-locality / cascade fear) | `[PARTIAL]` — `css-layers.tsx` visualizes layers; no locality-by-default enforcement | `packages/@roycss/styled/scoped/` (new, depends on F5) | MEDIUM |
| §6.2 | Loud failures (cures silent failure / bug invisibility) | `[PARTIAL]` — `roycss doctor` reports some; not "loud by default" | `cli/index.js` extension | MEDIUM |
| §6.3 | Refactor operations (cures no-refactor problem) | `[PARTIAL]` — `roy-refactor.tsx` ships; not a global "rename this token everywhere" operation | `src/components/roycss/pro/roy-refactor.tsx` extension | MEDIUM |
| §6.4 | Single authoritative source (cures multiple authors / cascade conflicts) | `[PARTIAL]` — `src/lib/design-tokens.ts` is the source; not enforced across the codebase | `packages/@roycss/core/` enforcement | MEDIUM |
| §6.5 | Objective correctness (cures subjectivity / "not real engineering") | `[NOT STARTED]` — No objective correctness linter | `packages/@roycss/lint/` (new, depends on F14) | MEDIUM |
| §6.6 | Reduced context switching (cures the four-models problem) | `[PARTIAL]` — Docs site exists; no unified IDE+browser+design+runtime surface | `vscode-extension/` + `browser-extension/` (new) | LOW |
| §6.7 | Intent, not property (cures imposter syndrome / math anxiety / AI-reviewability) | `[NOT STARTED]` — Depends on RoyLang (LABS-26) | `packages/@roycss/roylang/` | HIGH |
| §6.8 | Fashion-resistant tokens (cures visual-aging cycle) | `[PARTIAL]` — OKLCH tokens are fashion-resistant; no published "token stability" commitment | `docs/TOKEN-STABILITY.md` (new) | LOW |
| §6.9 | AI-native authoring (cures the AI-unreviewable-output problem) | `[PARTIAL]` — `roy-ai.tsx`, `roy-architect.tsx`, `roy-generator.tsx`, `roy-pair.tsx` exist; no `roycss.rules.md` for LLMs | `dist/roycss.rules.md` (new) | HIGH |
| §6.10 | The cycle ends | aspirational | n/a | LOW |
| §7 | Linguistic lens (tokens=words, components=idioms, effects=phrasing, themes=registers, motion=prosody) | `[NOT STARTED]` — Documentation framing only | `docs/CONCEPTUAL-MODEL.md` (new) | LOW |

---

## 16. `docs/ENTERPRISE-REVIEW.md` — Enterprise readiness review

### 16.1 Critical risks (block adoption until mitigated)

| # | Risk described | Status | Where it should live | Priority |
|---|---|---|---|---|
| R1 | Single-maintainer bus factor | `[NOT STARTED]` — Single maintainer per the review; no named co-maintainers documented | `docs/GOVERNANCE.md` + `MAINTAINERS.md` (new) | HIGH (Critical) |
| R2 | No WCAG 2.1 AA audit / VPAT | `[NOT STARTED]` — `a11y/audit.ts` runs but no third-party audit / VPAT published | `docs/ACCESSIBILITY-AUDIT.md` + `docs/VPAT-2.4.md` (new) | HIGH (Critical) |
| R3 | No LTS or support SLA | `[NOT STARTED]` — No `docs/LTS.md`, no SLA doc | `docs/LTS.md` + `docs/SLA.md` (new) | HIGH (Critical) |

### 16.2 High risks

| # | Risk described | Status | Where it should live | Priority |
|---|---|---|---|---|
| R4 | No `SECURITY.md` or security advisory channel | `[PARTIAL]` — `security/SECURITY-POLICY.md` exists; no public advisory channel (GitHub Security Advisories) | `security/` + GitHub Security Advisories | HIGH |
| R7 | No SLSA / npm provenance | `[PARTIAL]` — `.github/workflows/release.yml` ships `npm publish --provenance` (SLSA L3 for npm); no hermetic build / artifact signing beyond npm | `.github/workflows/release.yml` extension | MEDIUM |

### 16.3 Medium risks

| # | Risk described | Status | Where it should live | Priority |
|---|---|---|---|---|
| R5 | Bundle size not budget-tested at scale | `[PARTIAL]` — `perf/regression.test.ts` measures; no CI budget gate | `.github/workflows/ci.yml` | HIGH |
| R6 | RTL: marquee uses `translateX`, not logical | `[PARTIAL]` — `tests/i18n/rtl-render-test.ts` runs; `marquee` may still use `translateX` (audit needed) | `src/components/roycss/roymotion-showcase.tsx` audit | MEDIUM |
| R8 | Font fallbacks Latin-only | `[PARTIAL]` — `src/app/globals.css` defines font stack; needs audit for non-Latin fallbacks | `src/app/globals.css` | LOW |
| R9 | No published API reference or migration guides | `[PARTIAL]` — `src/app/docs/api/` ships an API section; no generated API reference, migration guide is partial | `src/app/docs/api/` + generated reference | MEDIUM |

### 16.4 Adoption checklist gates (Section 5)

| # | Gate described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 5.2 | npm provenance (sigstore) on every release | `[IMPLEMENTED]` — `release.yml` ships `npm publish --provenance` | `.github/workflows/release.yml` | — |
| 5.2 | `SECURITY.md` with disclosure mailbox and SLA | `[PARTIAL]` — `security/SECURITY-POLICY.md` exists; no mailbox / SLA | `security/SECURITY-POLICY.md` extension | HIGH |
| 5.3 | Third-party WCAG 2.1 AA audit report | `[NOT STARTED]` | `docs/ACCESSIBILITY-AUDIT.md` (new) | HIGH (Critical) |
| 5.3 | VPAT 2.4 document | `[NOT STARTED]` | `docs/VPAT-2.4.md` (new) | HIGH (Critical) |
| 5.3 | Effects allowlist (text-safe vs. decoration-only) | `[NOT STARTED]` | `src/lib/effect-taxonomy.ts` extension | HIGH |
| 5.4 | Lighthouse CI budget (CLS < 0.1, TBT < 200ms) | `[NOT STARTED]` — No Lighthouse CI workflow | `.github/workflows/ci.yml` + `lighthouserc.json` | HIGH |
| 5.4 | Bundle-size regression test (size-limit) | `[PARTIAL]` — `perf/regression.test.ts` measures; no `size-limit` CI gate | `.github/workflows/ci.yml` + `size-limit` config | HIGH |
| 5.4 | Per-effect paint-cost tier list published | `[NOT STARTED]` | `docs/EFFECT-PERFORMANCE-TIERS.md` (new) | MEDIUM |
| 5.5 | RFC process documented | `[NOT STARTED]` — No `rfcs/` dir | `rfcs/` + `docs/RFC-PROCESS.md` (new) | HIGH |
| 5.5 | Public 12-month roadmap published | `[PARTIAL]` — `docs/PLATFORM-VISION.md` is the roadmap; not distilled to a public 12-month roadmap page | `src/app/roadmap/page.tsx` (new) or `docs/ROADMAP-12MO.md` | MEDIUM |
| 5.5 | SemVer and deprecation policy documented | `[NOT STARTED]` — No `SEMVER.md`, no `DEPRECATION.md` | `SEMVER.md` + `DEPRECATION.md` (new) | HIGH |
| 5.6 | Internal fork contingency / Renovate Bot config / Rollback runbook | `[PARTIAL]` — `.github/dependabot.yml` exists; no Renovate Bot config, no rollback runbook | `renovate.json` + `docs/ROLLBACK-RUNBOOK.md` (new) | LOW |

---

## 17. `docs/COMPETITIVE-ANALYSIS.md` — 15 Recommended Features (R1–R15)

| # | Recommendation | Status | Where it should live | Priority |
|---|---|---|---|---|
| R1 | Documentation site with version pinning + live playgrounds | `[PARTIAL]` — `src/app/docs/**` exists; no version pinning, no live playgrounds in docs | `src/app/docs/[version]/...` + playground in docs | HIGH |
| R2 | VS Code LSP extension on Marketplace + Open VSX | `[PARTIAL]` — `vscode-extension/` ships as `roycss-1.0.0.vsix`; not published to Marketplace + Open VSX; no LSP | Publish to Marketplace + Open VSX + LSP in `vscode-extension/src/` | HIGH |
| R3 | `roycss migrate from-bootstrap` / `from-animate-css` / `from-tailwind` | `[NOT STARTED]` — Only `migrate-colors.ts` and `migrate-logical.ts` for self | `cli/index.js` + `scripts/migrate-from-*.ts` (new) | HIGH |
| R4 | Baseline 2024 browser support matrix + polyfill recommendations | `[PARTIAL]` — `src/app/docs/concepts/browser-support/page.tsx` exists; no Baseline 2024 mapping, no polyfill decision tree | `src/app/docs/concepts/browser-support/page.tsx` extension | MEDIUM |
| R5 | Public `SECURITY.md`, SBOM, signed npm releases | `[PARTIAL]` — All three exist; not all published/promoted (e.g., SBOM not on npm package page) | `security/` + npm package metadata | HIGH |
| R6 | First-party build plugins: Vite, Next.js, Astro, webpack, Turbopack, esbuild | `[NOT STARTED]` — Manual `@import "roycss.css"` only | `packages/@roycss/{vite,nextjs,astro,webpack,turbopack,esbuild}-plugin/` (new) | HIGH |
| R7 | Radix UI / Headless UI / React Aria adapter package | `[NOT STARTED]` — `src/components/ui/*` is a shadcn fork (Radix already); no published `@roycss/adapter-*` package | `packages/@roycss/adapter-{radix,headlessui,react-aria}/` (new) | MEDIUM |
| R8 | Storybook addon with MDX docs + Chromatic visual regression | `[NOT STARTED]` — No Storybook addon | `packages/@roycss/storybook-addon/` (new) + Chromatic CI | MEDIUM |
| R9 | Figma plugin that syncs OKLCH tokens both directions | `[NOT STARTED]` — No Figma plugin | New `figma-plugin/` repo | MEDIUM |
| R10 | Public RFC process + semver commitment | `[NOT STARTED]` | `rfcs/` + `SEMVER.md` | HIGH |
| R11 | Opt-in telemetry with public dashboard | `[NOT STARTED]` — No telemetry SDK, no public dashboard | `packages/@roycss/telemetry/` + `src/app/stats/page.tsx` (new) | MEDIUM |
| R12 | Starter template gallery (`roycss.dev/templates`) | `[PARTIAL]` — `template-library.tsx` ships 24 templates as in-app demos; no `npm create roycss@latest --template` flow, no `roycss.dev/templates` page | `src/app/templates/page.tsx` + `cli/index.js` `create` command | MEDIUM |
| R13 | Plugin API + 5 first-party plugins | `[NOT STARTED]` | `packages/@roycss/plugin-{rtl,print,a11y-strict,brand-colors,tailwind-compat}/` (new) | MEDIUM |
| R14 | `roycss doctor` (a11y / performance / modern-CSS audit) | `[IMPLEMENTED]` — `cli/index.js` ships `doctor`; `src/app/api/css-doctor/route.ts` exists | `cli/index.js` | — |
| R15 | RoyCSS Working Group with public meetings + notes | `[NOT STARTED]` — Out of code scope (governance) | `docs/GOVERNANCE.md` + meeting notes repo | HIGH |

---

## 18. `docs/FERRUM-MIGRATION-ANALYSIS.md` — Migration analysis

### 18.1 Phase 1 — Missing features (high priority migration from Ferrum)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| P0 | Skeleton loaders (15 new types: card, text, grid, avatar, circle, wave) | `[PARTIAL]` — 3 basic skeletons exist per the doc; Ferrum has 18 | `src/lib/effects-batch-*.ts` (new batch) | HIGH |
| P0 | Image hover effects (16 new: zoom, pan, shutter, split-reveal, tilt-3d) | `[NOT STARTED]` — 0 dedicated image effects per the doc | `src/lib/effects-batch-*.ts` (new "image" category) | HIGH |
| P1 | Status indicators (9 new: pulse-green/red/yellow, heartbeat, signal-wave, loading-bar) | `[PARTIAL]` — 1 notification dot exists per the doc | `src/lib/effects-batch-*.ts` (new batch) | MEDIUM |
| P1 | Linear.app style pack (13 effects: spotlight, magnetic-pull, noise-overlay, depth-shadow) | `[NOT STARTED]` — 0 per the doc | `src/lib/effects-batch-*.ts` (new "linear" category) | MEDIUM |
| P1 | Scroll-driven animations (9 new animation-timeline effects: blur, color, rotate, scale, sticky) | `[PARTIAL]` — 21 basic exist per the doc; Ferrum has 30 | `src/lib/effects-batch-*.ts` extension | MEDIUM |
| P2 | Playground panel (interactive sliders for duration/delay/repeat/easing with live preview) | `[PARTIAL]` — `playground-panel.tsx` and `playground-sheet.tsx` exist; per the doc Ferrum's sliders are not present | Extend `src/components/roycss/playground-panel.tsx` | MEDIUM |
| P2 | Apple spring animations (3: bounce-settle, elastic-scale, flip-spring) | `[PARTIAL]` — 5 basic Apple effects exist (batch 21 per doc); Ferrum has 3 spring physics | `src/lib/effects-batch-*.ts` extension | LOW |
| P2 | Circle reveal transitions (clip-path circle expand/collapse) | `[NOT STARTED]` — 0 per the doc | `src/lib/effects-batch-*.ts` (new) | LOW |
| P3 | Clouds background (atmospheric drifting clouds) | `[NOT STARTED]` | `src/lib/effects-batch-*.ts` (new) | LOW |
| P3 | Contrast switch (a11y-focused contrast toggle) | `[NOT STARTED]` | `src/lib/effects-batch-*.ts` (new) or `src/components/roycss/contrast-checker.tsx` extension | LOW |

### 18.2 Phase 1 — Better implementation in Ferrum (adopt)

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| — | startTransition for category filtering (React 18) | `[NOT STARTED]` — `virtual-scroll-grid.tsx` does not use `startTransition` per the doc | `src/components/roycss/virtual-scroll-grid.tsx` | MEDIUM |
| — | SkeletonCard component for effect grid loading | `[NOT STARTED]` | `src/components/roycss/effect-card.tsx` SkeletonCard variant | MEDIUM |

### 18.3 Phase 3 — Website IA redesign

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 3 | Effects section collapsible (show grid + search, "jump to" nav) | `[PARTIAL]` — `sticky-mini-nav.tsx` + `mobile-bottom-nav.tsx` + `explore-hub.tsx` exist; not collapsible per the doc | `src/components/roycss/explore-hub.tsx` extension | MEDIUM |
| 3 | Effects dropdown in nav with category counts | `[IMPLEMENTED]` — Per the doc, this is "ALREADY IMPLEMENTED" | `src/components/roycss/sticky-mini-nav.tsx` | — |
| 3 | Section quick-nav (sticky section indicator showing current position) | `[PARTIAL]` — `section-scrollbar.tsx` exists; per LABS-29 it should be removed, but per Ferrum it should be a quick-nav | `src/components/roycss/section-scrollbar.tsx` (decision conflict) | LOW |
| 4 | Hero: one focal point, clear value prop in 5s, minimal motion | `[PARTIAL]` — Per the doc, hero has multiple parallax blobs competing for attention | `src/app/page.tsx` hero | MEDIUM |
| 5 | Active section highlighting in nav (IntersectionObserver) | `[NOT STARTED]` — Per the doc Sprint 3 | `src/components/roycss/sticky-mini-nav.tsx` extension | MEDIUM |
| 5 | Search icon (opens ⌘K overlay) | `[IMPLEMENTED]` — `search-overlay.tsx` + `keyboard-shortcuts-overlay.tsx` ship | `src/components/roycss/search-overlay.tsx` | — |
| 5 | Mega menu for Platform products | `[NOT STARTED]` | `src/components/roycss/sticky-mini-nav.tsx` extension | LOW |
| 6 | Reduce hero parallax blobs from 3 to 1 | `[PARTIAL]` — Per the doc Sprint 1, this is pending | `src/app/page.tsx` | MEDIUM |
| 6 | Remove sphere-3D from hero background | `[PARTIAL]` — Per the doc Sprint 1, this is pending | `src/app/page.tsx` | MEDIUM |

### 18.4 Phase 8 — Product opportunities

| # | Feature described | Status | Where it should live | Priority |
|---|---|---|---|---|
| 1 | Playground Panel (interactive animation sliders + live preview) | `[PARTIAL]` — `playground-panel.tsx` exists; sliders for duration/delay/repeat/easing per Ferrum are not all present | Extend `src/components/roycss/playground-panel.tsx` | HIGH |
| 2 | Skeleton Loader System (15 new types) | `[PARTIAL]` — 3 exist | `src/lib/effects-batch-*.ts` | HIGH |
| 3 | Image Effects Category (16 new) | `[NOT STARTED]` | `src/lib/effects-batch-*.ts` | HIGH |
| 4 | Status Indicators (9 new) | `[PARTIAL]` — 1 exists | Same | MEDIUM |
| 5 | Linear.app Style Pack (13) | `[NOT STARTED]` | Same | MEDIUM |
| 6 | Scroll-Driven Animations (9 new) | `[PARTIAL]` — 21 exist | Same | MEDIUM |
| 7 | Apple Spring Physics (3) | `[PARTIAL]` — 5 basic Apple exist | Same | LOW |
| 8 | Circle Reveal Transitions (2) | `[NOT STARTED]` | Same | LOW |
| 9 | startTransition Filtering | `[NOT STARTED]` | `src/components/roycss/virtual-scroll-grid.tsx` | MEDIUM |
| 10 | SkeletonCard Component | `[NOT STARTED]` | `src/components/roycss/effect-card.tsx` | MEDIUM |

---

## 19. Summary — Top priority pending features

### Tier 1 — HIGH priority, `[NOT STARTED]` (blocks enterprise + ecosystem)

1. **V2 monorepo** (`packages/@roycss/*`) — LABS-V2-Blueprint §1.3, FIRST-PRINCIPLES F1–F10
2. **Intent-Class Compiler / RoyLang** — FIRST-PRINCIPLES F1, LABS-26, LABS-31, LABS-36 §6.7
3. **Plugin API** — V2 Blueprint §12, LABS-35 §3, COMPETITIVE-ANALYSIS R13
4. **Browser DevTools panel + Roy Inspector Chrome extension** — PLATFORM-VISION §1.9–1.10, COMPETITIVE-ANALYSIS R2 partial, 50-ORIGINAL-FEATURES 6.1
5. **`@roycss/a11y` engine** with 27 rules + build-fail + `roycss a11y` CLI — V2 Blueprint §9, LABS-30 §7.10
6. **`roycss.manifest.json`** unified machine-readable manifest — LABS-30 §4.1, LABS-35 §4.4
7. **Codemod library** (V1→V2, Tailwind→RoyCSS, Bootstrap→RoyCSS, Animate.css→RoyCSS, MUI→RoyCSS, Chakra→RoyCSS, and outbound RoyCSS→competitor) — V2 Blueprint §14, COMPETITIVE-ANALYSIS R3, LABS-34 §5.5, LABS-35 §9, ENTERPRISE-REVIEW R11
8. **Public API surface in `API.md`** + CI gate — LABS-30 §7.1, LABS-35 §2
9. **Governance docs** (`GOVERNANCE.md`, `LTS.md`, `SEMVER.md`, `DEPRECATION.md`, `CODE_OF_CONDUCT.md`, `API.md`, `rfcs/`) — LABS-30 §7.3, LABS-35 §5, ENTERPRISE-REVIEW R3, COMPETITIVE-ANALYSIS R10/R15
10. **Third-party WCAG 2.1 AA audit + VPAT 2.4** — ENTERPRISE-REVIEW R2 (Critical), LABS-30 §7.10
11. **Performance budget** (CI-enforced, Lighthouse CI, size-limit, budget.json) — LABS-33 §9, V2 Blueprint §11.5, ENTERPRISE-REVIEW R5, LABS-30 §7.7
12. **First-party build plugins** (Vite, Next.js, Astro, webpack, Turbopack, esbuild) — COMPETITIVE-ANALYSIS R6
13. **Per-effect static page** (`/effects/<id>`) + versioned docs — V2 Blueprint §8.1, LABS-30 §1.3, COMPETITIVE-ANALYSIS R1
14. **Roy Studio (Tauri-based visual builder)** — PLATFORM-VISION §1.3
15. **Roy Cloud collaboration** (live multi-cursor token editing, Git-backed token repos, audit log, SSO) — PLATFORM-VISION §1.4, V2 Blueprint §16.9
16. **Roy Marketplace payments + creator onboarding** — PLATFORM-VISION §1.5, COMPETITIVE-ANALYSIS R12 partial
17. **Roy AI hybrid retrieval** (vector index of effects + structured lookup + LLM) — PLATFORM-VISION §1.6, V2 Blueprint §8.3
18. **`roycss.rules.md` for LLMs + `@roycss/ai` package** — LABS-32 §8, FIRST-PRINCIPLES F11
19. **Effect maturity tags** (`experimental`/`stable`/`deprecated`) in catalog filter — LABS-30 §3.2, ENTERPRISE-REVIEW 5.3
20. **Image effects category (16 new)** + **Skeleton loaders (15 new)** + **Linear.app pack (13)** — FERRUM-MIGRATION P0/P1
21. **Component Genome** (per-component manifest with composition + WCAG + browser-support + bundle size) — PLATFORM-VISION §4.3
22. **AI conformance suite** (test prompts + scoring + public leaderboard) — LABS-32 §9
23. **Storybook addon + Chromatic visual regression** — COMPETITIVE-ANALYSIS R8
24. **Figma plugin** (bidirectional OKLCH token sync) — COMPETITIVE-ANALYSIS R9, V2 Blueprint §16.7
25. **Cascade Constitution** (`@layer` defaults + build-time enforcement + `@roycss-escape`) — FIRST-PRINCIPLES F3, LABS-33 §8.3

### Tier 2 — MEDIUM priority (compounds the platform)

26. Headless / Styled split (`@roycss/headless` + `@roycss/styled`)
27. RoyMotion gesture library + View Transitions router adapters (Next/Astro/SvelteKit/Remix/Nuxt) + cross-document MPA
28. Multi-surface token emission (iOS Swift / Android Kotlin / Figma JSON / Windows XAML / Flutter Dart)
29. Self-healing CSS linter (`@roycss/vscode` LSP + `roycss lint` + auto-fix + community rule API)
30. Composable Effect Recipes (`@roycss-recipe/*` npm org + composition engine)
31. Roy Themes vertical-specific store (Healthcare/Banking/SaaS/Education/E-commerce/Government/Gaming/Media/Legal/Real Estate)
32. Roy Motion Library Premium (50 choreographed sequences + 30 spring presets + 20 page transitions + gesture motion + motion tokens)
33. Roy Accessibility Suite RUM mode + AI auto-fix PR opener
34. Roy Academy proctored exams + certification issuance pipeline
35. Roy Enterprise SLA program + private registry + indemnification
36. WCAG 3.0 readiness (research; APCA-like model)
37. RUM SDK (`@roycss/rum`)
38. Opt-in telemetry + public dashboard
39. Crowdsourced translation (Crowdin/Weblate) + i18n message catalog
40. BrowserStack cross-browser testing in CI

### Tier 3 — LOW priority / research / deprecation candidates

41. RoyLang long-term research (LABS-26 fully)
42. Spatial CSS (WebXR)
43. WebGPU-accelerated effects
44. Time-Aware CSS / Layout Intent API / Manifest-Driven Styling / CSS Trigonometry Layouts (v3 research)
45. LABS-28 deprecation candidates (seasonal effects, favorites sheet, framework adapters, section scrollbar, scroll-to-top) — pending product decision
46. RoyCSS Conf (events, not code)
47. Contributors / sponsorship page polish

---

## 20. Cross-document dependencies

The pending features form a dependency graph. The top of the graph is the **Intent-Class Compiler / RoyLang** (FIRST-PRINCIPLES F1, LABS-26, LABS-31, LABS-36 §6.7) — many downstream features depend on it:

```
Intent-Class Compiler (F1)
├── Cascade Constitution (F3)
├── Scope-Encapsulated Components (F5)
├── Container-Adaptive Components (F10)
├── Self-Healing Linter (F14)
├── CSS-Aware CI Gate (50-ORIG 8.6)
├── RoyLang (LABS-26)
├── Intent-Level Pattern Abstractions (LABS-31)
├── AI-Native Authoring (LABS-36 §6.7)
└── Composable Effect Recipes (F15)

V2 Monorepo (V2-Blueprint §1.3)
├── @roycss/headless + @roycss/styled (F4 + F5)
├── @roycss/motion (V2 §7 + F6 + F7)
├── @roycss/a11y (V2 §9 + F8)
├── @roycss/rum (V2 §11.6)
├── @roycss/ai (F11 + LABS-32 §8)
├── @roycss/lint (F14)
├── @roycss/vscode LSP (V2 §10.1)
├── @roycss/devtools panel (V2 §10.2 + PLATFORM-VISION §1.10)
├── @roycss/tokenstudio (F13)
└── Build plugins (R6) — vite/nextjs/astro/webpack/turbopack/esbuild

Public API surface (API.md) + CI gate (LABS-30 §7.1, LABS-35 §2)
├── Effect maturity tags (LABS-30 §3.2)
├── Plugin API (V2 §12, LABS-35 §3)
├── Codemod library (V2 §14, R3, LABS-34 §5.5)
└── Machine-readable manifest (LABS-30 §4.1)

WCAG 2.2 AA audit (ENTERPRISE-REVIEW R2)
├── VPAT 2.4 (V2 §16.10)
├── Per-effect a11y tag (LABS-30 §7.10, LABS-29 §12.7)
├── Effects allowlist (ENTERPRISE-REVIEW 5.3)
└── @roycss/a11y CI build-fail (V2 §9)
```

---

## 21. Counts by status

| Status | Count | % |
|---|---|---|
| `[IMPLEMENTED]` | 28 | 12.7% |
| `[PARTIAL]` | 95 | 43.0% |
| `[NOT STARTED]` | 91 | 41.2% |
| `[DEPRECATED]` (LABS-28 cut candidates) | 7 | 3.2% |
| **Total** | **221** | 100% |

### Counts by priority

| Priority | Count |
|---|---|
| HIGH | 96 |
| MEDIUM | 84 |
| LOW | 41 |

---

## 22. Auditor's final notes

1. The codebase has **matured significantly beyond V1**: 1569+ effects (vs V1's 700), 62 platform products in `src/lib/product-registry.ts`, 68 backend modules, 63 pro components, 68 dev tools, an MCP server, a VSCode extension, a CLI with 8 commands, an auth system, AI APIs, an a11y audit folder, a security folder with SBOM+CSP+xss+css-exfiltration checks, a release pipeline with npm provenance, and a docs site with 25+ pages.

2. However, the **V2 vision** (per `ROYCSS-V2-BLUEPRINT.md`, `FIRST-PRINCIPLES-REDESIGN.md`, LABS-26/31/32/33/35) is largely `[NOT STARTED]`: no monorepo packages, no Intent-Class Compiler / RoyLang, no Plugin API contract, no `@roycss/a11y` build-fail engine, no `roycss.manifest.json`, no `API.md`, no LTS / SEMVER / GOVERNANCE / CODE_OF_CONDUCT docs, no `rfcs/` directory, no Lighthouse CI, no third-party WCAG audit / VPAT, no Roy Studio / Roy Cloud / Roy Inspector / Roy DevTools as production products.

3. The Ferrum migration analysis identifies **concrete near-term wins** (skeleton loaders, image effects, status indicators, Linear.app pack) that fit the existing batch-file architecture and can ship without the V2 monorepo.

4. The **single largest blocker** for enterprise adoption is the trio of Critical risks from `ENTERPRISE-REVIEW.md`: bus factor (R1), no WCAG audit (R2), no LTS (R3). These are governance artifacts, not code — they can ship in days if prioritized.

5. LABS-28's "delete half" proposal conflicts with the current growth trajectory (effects grew from 700 → 1569+). The team must **decide explicitly** whether to pursue the V2 accretive path or the LABS-28 amputation path before investing further. This audit treats LABS-28 items as `[DEPRECATED]` (decision pending) rather than as actionable work.

---

**End of audit.** Report version: 1.0. Generated by task DOC-AUDIT-1.
