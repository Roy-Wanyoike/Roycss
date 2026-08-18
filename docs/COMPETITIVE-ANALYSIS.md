# RoyCSS — Competitive Analysis: CSS Frameworks Landscape Q1 FY26

**Prepared by:** RoyCSS Strategy & Engineering
**Subject:** RoyCSS v1.0.0 vs. 8 market-leading CSS frameworks
**Review date:** Q1 FY26
**Classification:** Public — Strategic Planning
**Document version:** 1.0
**Author:** Royford Wanyoike, Principal CSS Framework Engineer

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [RoyCSS Profile](#2-roycss-profile)
3. [Competitive Landscape Overview](#3-competitive-landscape-overview)
4. [Per-Framework Analysis](#4-per-framework-analysis)
   - 4.1 Tailwind CSS
   - 4.2 Bootstrap
   - 4.3 UnoCSS
   - 4.4 Panda CSS
   - 4.5 StyleX
   - 4.6 Bulma
   - 4.7 Foundation
   - 4.8 Material UI (CSS layer)
5. [Comparison Matrix (8 × 10, scored 1–5)](#5-comparison-matrix)
6. [Competitive Gap Analysis](#6-competitive-gap-analysis)
7. [15 Recommended Features for Market Leadership](#7-15-recommended-features-for-market-leadership)
8. [Strategic Positioning & Conclusion](#8-strategic-positioning--conclusion)

---

## 1. Executive Summary

RoyCSS enters the CSS framework market at a moment of historic inflection. The web platform has, for the first time in a decade, given developers a genuinely new primitive surface — `oklch()`, `color-mix()`, relative color syntax, CSS Nesting, `:has()`, `:where()`, container queries, `@property`, `light-dark()`, View Transitions API, and scroll-driven animations are all shipping in evergreen browsers as of 2025–2026. Every established framework in this analysis predates that surface; RoyCSS is the first framework engineered **natively** on top of it.

The competitive landscape divides into four camps:

- **Atomic utility frameworks** (Tailwind CSS, UnoCSS, Panda CSS, StyleX) — compose styles at build time from tiny primitives
- **Component frameworks** (Bootstrap, Foundation, Bulma, Material UI) — ship pre-built UI patterns with opinionated visual languages
- **Hybrid libraries** — mix utilities with components (Panda CSS, Material UI's `sx`/CSS layer)
- **Effect-focused libraries** — Animate.css, Motion One, Framer Motion (adjacent, not direct competitors)

RoyCSS is uniquely **a hybrid effects-led framework**: 700+ production-ready effects, a 24-component first-party library, a dedicated RoyMotion animation system, an OKLCH-native token architecture, framework-agnostic bindings for React/Vue/Angular/Svelte/vanilla, plus a CLI and planned LSP-powered VS Code extension. No other framework in this analysis combines all five of those pillars.

The findings of this analysis are unambiguous on three points:

1. **RoyCSS is materially ahead of every competitor on Modern CSS adoption and Innovation.** No surveyed framework ships native `oklch()`, relative color syntax, `light-dark()`, scroll-driven animations, and View Transitions API integration simultaneously. RoyCSS does all five.
2. **RoyCSS is materially behind on Community, Documentation maturity, and Enterprise governance maturity.** Single-author project, v1.0.0, no LTS policy, no public RFC process, no commercial backing.
3. **RoyCSS can become the preferred choice for motion-rich, design-system-driven, modern-CSS-first teams** by closing 15 specific gaps documented in Section 7 — none of which require reinventing the framework, only operationalizing what already exists.

---

## 2. RoyCSS Profile

| Attribute | Value |
|---|---|
| Version | 1.0.0 |
| License | MIT |
| Author | Royford Wanyoike (solo maintainer) |
| Effect count | 700+ across 20 categories |
| Component library | 24 first-party components across 8 categories (foundation, layout, forms, navigation, feedback, data display, charts, plus planned commerce/dashboard/auth/healthcare/admin) |
| Animation system | RoyMotion — entrance, exit, hover, scroll, page, loaders, skeleton, microinteractions, stagger |
| Color system | OKLCH-native, relative color syntax, `color-mix()` |
| Layout primitives | Container queries, logical properties throughout |
| Modern CSS surface | `oklch()`, `color-mix()`, relative colors, `@property`, CSS Nesting, `:where()`, `:has()`, `light-dark()`, View Transitions, scroll-driven animations |
| Accessibility | `prefers-reduced-motion` enforced globally, planned `prefers-contrast: high`, WCAG 2.1 AA color contrast targets |
| Framework bindings | React, Vue, Angular, Svelte, vanilla HTML |
| Tooling | CLI (`init`, `add`, `search`, `list`, `categories`, `info`), planned VS Code LSP extension |
| Token architecture | 12 token categories — Style Dictionary-compatible JSON export, Tailwind config export |
| Migration tooling | `migrate-colors.ts`, `migrate-logical.ts` |
| Security posture | No inline JS, no `eval`, no dynamic CSS injection, strict CSP-compatible |

---

## 3. Competitive Landscape Overview

The 8 frameworks compared below represent ~98% of intentional CSS-framework adoption in production codebases today (per npm download share and GitHub star concentration). They fall along a spectrum from **pure utility** (Tailwind, UnoCSS) through **hybrid** (Panda, StyleX) to **pure component** (Bulma, Foundation, Material UI). Bootstrap sits ambiguously in the middle — utilities plus components.

| Framework | Stars (approx.) | Weekly npm downloads | First released | Latest major | Primary model |
|---|---|---|---|---|---|
| Tailwind CSS | ~84k | ~7.0M | 2017 | v4.0 (2025) | Atomic utility |
| Bootstrap | ~171k | ~5.0M | 2011 | v5.3 (2024) | Component + utility |
| UnoCSS | ~17k | ~430k | 2021 | v0.65+ (2025) | Atomic utility (engine) |
| Panda CSS | ~6.0k | ~390k | 2023 | v1.x (2025) | Build-time CSS-in-JS |
| StyleX | ~5.0k | ~220k | 2023 (open-sourced) | v0.7+ (2025) | Atomic CSS-in-JS |
| Bulma | ~49k | ~250k | 2016 | v1.0 (2024) | Component (Sass) |
| Foundation | ~29k | ~150k | 2011 | v6.9 (2024, community) | Component (Sass) |
| Material UI | ~95k | ~5.0M | 2014 | v6 (2024) | Component + `sx`/CSS layer |

All eight predate the 2023 baseline landing of `oklch()`, `:has()`, and container queries in all evergreen browsers. None of the eight ship native View Transitions API integration, scroll-driven animations, or `light-dark()` in their core distribution today. This is the single largest strategic opening for RoyCSS.

---

## 4. Per-Framework Analysis

### 4.1 Tailwind CSS

**Strengths**
- **Atomic utility model** — fastest path from intent to styled element; no context-switching between markup and stylesheet
- **Build-time JIT engine** — only the classes you use end up in the bundle; production CSS routinely under 10 kB gzipped
- **Configuration-as-code** — `tailwind.config.ts` is the industry's most copied theming pattern; rich plugin ecosystem (~600+ plugins)
- **Documentation quality** — tailwindcss.com is widely considered the gold standard for developer docs in the CSS space
- **Headless UI + ecosystem** — `@headlessui/react`, Catalyst, Tailwind UI templates create a commercial moat

**Weaknesses**
- **Markup verbosity** — class lists of 20+ utilities are common; readability and review suffer
- **Modern CSS adoption lag** — v4 added `oklch()` defaults and `color-mix()`, but no first-party View Transitions, scroll-driven animations, or `light-dark()` primitives
- **No animation system** — relies on third-party `tailwindcss-animate` or `tw-animate-css` plugins; no spring easings, no scroll-timeline utilities
- **No effect library** — visual effects (glassmorphism, particles, 3D transforms) require hand-authored CSS or third-party plugins
- **Component story is delegated** — Tailwind UI and Catalyst are commercial; the open-source distribution ships no components

**Best use case:** Teams who want maximum styling control with minimal CSS authoring and are willing to manage class verbosity.

**Market position:** Dominant atomic utility framework; the default choice for new greenfield projects since 2022. Increasingly challenged by UnoCSS on engine performance and by Panda/StyleX on type-safety.

---

### 4.2 Bootstrap

**Strengths**
- **Ubiquity** — the most widely deployed CSS framework in history; present in ~20% of the top 1M websites
- **Component completeness** — navbar, card, modal, carousel, accordion, alert, toast, dropdown, offcanvas, pagination, all battle-tested
- **Sass-driven theming** — variable overrides are well-understood by enterprise teams
- **Accessibility baseline** — WCAG-conscious component markup, focus management, ARIA patterns
- **Enterprise familiarity** — every frontend recruiter, every QA team, every design system owner knows Bootstrap

**Weaknesses**
- **Legacy CSS** — still ships `rgb()`/`hex` colors, no `oklch()`, no `color-mix()`, no relative color syntax, no container queries in core components
- **Bundle weight** — full Bootstrap CSS is ~190 kB unminified, ~30 kB gzipped; tree-shaking requires Sass build configuration
- **No CSS Nesting in distribution** — relies on Sass nesting preprocessor
- **No animation system** — only `transition` utilities; no spring easings, no scroll-driven, no View Transitions
- **Visual identity is dated** — the "Bootstrap look" is recognizable and hard to escape without heavy overrides

**Best use case:** Internal tooling, admin panels, marketing sites where team familiarity and component completeness matter more than visual differentiation.

**Market position:** Mature, declining slowly in new greenfield adoption but with enormous installed base. Bootstrap 6 (in planning) is the wildcard.

---

### 4.3 UnoCSS

**Strengths**
- **Engine performance** — built on a custom regex/preset engine; build times 5–10× faster than Tailwind v3 JIT
- **Presets over opinions** — `@unocss/preset-tailwind`, `preset-wind`, `preset-mini`, `preset-uno`, `preset-web-fonts`, `preset-icons` — fully composable
- **Attributify mode** — `<button text="sm white" bg="primary">` is an ergonomic alternative to class lists
- **Runtime variants** — works at build time and runtime; ideal for plugins, MDX, dynamic content
- **Modern CSS aware** — preset-wind ships `oklch()`, container queries, `:has()` utilities

**Weaknesses**
- **Documentation fragmentation** — each preset has its own docs; no single canonical reference
- **Effect library is absent** — UnoCSS provides utilities, not 700+ ready-made effects
- **No component layer** — completely headless; teams must build or adopt components separately
- **No animation system** — relies on user-supplied keyframes
- **Smaller commercial ecosystem** — no equivalent to Tailwind UI; template market is thin

**Best use case:** Teams who want Tailwind ergonomics with faster builds and the option of attributify mode, and who don't need a component or effects layer.

**Market position:** The leading Tailwind alternative among performance-conscious and configuration-curious teams. Growing share, especially in Vue and Vite-native ecosystems.

---

### 4.4 Panda CSS

**Strengths**
- **Type-safe tokens** — design tokens are TypeScript; the compiler guarantees theme/type/scale consistency at build time
- **Build-time CSS-in-JS** — runtime cost is zero; styles are extracted at build
- **Authoring ergonomics** — `css()`, `cva()`, `sva()`, recipes, patterns, and slot recipes give a rich API surface
- **Built by the Chakra UI team** — inherits years of accessibility and theming lessons
- **Modern CSS aware** — ships `oklch()` defaults, container queries, logical properties

**Weaknesses**
- **React/JS-first** — vanilla HTML and other frameworks are second-class
- **No effect library** — Panda ships recipes and patterns, not 700+ effects
- **No animation system** — `motion` recipe is user-defined; no spring or scroll-timeline primitives
- **Smaller ecosystem** — plugins, templates, and learning resources are far thinner than Tailwind
- **Documentation is good but not great** — examples skew toward Chakra-style patterns

**Best use case:** React/Next.js teams who want type-safe design tokens and zero-runtime CSS-in-JS with a recipe API.

**Market position:** Niche but influential; growing in the Chakra UI diaspora and among teams migrating off styled-components/emotion.

---

### 4.5 StyleX

**Strengths**
- **Meta provenance** — battle-tested at Facebook-scale across thousands of components
- **Type-safe atomic CSS-in-JS** — `stylex.create()` produces collocated, analyzable styles
- **Build-time extraction** — zero runtime cost; styles are static CSS
- **Themability** — `stylex.defineVars()` and `stylex.createTheme()` provide a token contract that survives bundling
- **Cross-file deduplication** — same style used in 1,000 components emits one CSS rule

**Weaknesses**
- **React/JS-only** — not framework-agnostic in any meaningful sense
- **Documentation is sparse** — examples are minimal; the "Meta way" is implicit, not explained
- **No effect library, no component library** — purely a styling primitive
- **No animation primitives** — no springs, no scroll-driven, no View Transitions
- **Learning curve** — colocation + atomic + theming is conceptually heavy for newcomers

**Best use case:** Large React codebases (Facebook, WhatsApp, Threads-scale) that need build-time extraction with full type safety.

**Market position:** Niche enterprise-grade primitive; adoption is concentrated in Meta-adjacent teams. Slow community growth despite enormous credibility.

---

### 4.6 Bulma

**Strengths**
- **Pure Sass, no JavaScript** — framework-agnostic by design; works in any stack
- **Readability** — class names like `is-primary`, `is-large`, `has-text-centered` are the most beginner-friendly in the industry
- **Modern CSS in v1.0** — the 2024 release added CSS variables, `light-dark()`, and Sass modern API
- **Flexbox-native** — column and grid system is clean and predictable
- **Lightweight** — ~200 kB unminified Sass source, importing only what you need

**Weaknesses**
- **No JavaScript** — interactivity (dropdowns, modals, tabs) must be wired by the developer
- **No utility framework** — Bulma is component-only; spacing and color utilities are minimal
- **No animation system** — no springs, no scroll-driven, no View Transitions
- **No effect library** — visual effects are out of scope
- **Smaller ecosystem than Bootstrap** — fewer templates, fewer plugins, less enterprise familiarity

**Best use case:** Prototypes and content sites where Sass readability and no-JS purity matter.

**Market position:** Stable niche; beloved by Sass loyalists but losing share to utility frameworks. The 1.0 modernization was well-received.

---

### 4.7 Foundation

**Strengths**
- **Mature component library** — accordion, drilldown menu, dropdown, equalizer, interchange, orbit, reveal, sticky, tabs, toggler — decades of edge-case handling
- **Accessibility heritage** — Foundation was early to ARIA patterns and keyboard navigation
- **Sass architecture** — well-organized partials, mixins, and functions for advanced theming
- **XY Grid** — flexbox + grid hybrid that prefigured modern CSS Grid adoption
- **Enterprise installed base** — large legacy footprint in finance, government, healthcare

**Weaknesses**
- **Effectively unmaintained** — ZURB ended active development; community maintainership is sporadic
- **Modern CSS absent** — no `oklch()`, no `color-mix()`, no container queries, no `:has()`, no nesting
- **Bundle weight** — full import is heavier than Bootstrap
- **No animation system, no effect library** —
- **No clear migration path forward** — teams on Foundation are migrating off, not onto it

**Best use case:** Legacy maintenance; not recommended for greenfield.

**Market position:** End-of-life-adjacent. The honest market position is "the framework you migrate away from."

---

### 4.8 Material UI (CSS layer)

**Strengths**
- **Material Design 3 system** — the most thoroughly specified design system in commercial use
- **Component completeness** — 50+ components, advanced patterns (data grid, date pickers, tree views, charts) shipped first-party
- **`sx` prop + `styled()` + CSS layer** — flexible API for ad-hoc styling without leaving the React tree
- **Theme provider** — mature, deeply nestable theming with light/dark built in
- **Commercial backing** — MUI the company offers paid templates, X components, and support

**Weaknesses**
- **React-only** — no Vue, Angular, Svelte, or vanilla HTML bindings
- **Bundle size** — Material UI + emotion runtime is substantial; code-splitting is mandatory
- **Modern CSS adoption is partial** — `oklch()` is opt-in via theme, not native; no View Transitions, no scroll-driven animations, no `light-dark()`
- **No effect library** — Material Design elevation and motion are present, but not 700+ effects
- **Opinionated visual language** — escaping the Material look requires heavy customization

**Best use case:** React apps that want a complete, opinionated, Google-grade design system out of the box.

**Market position:** The dominant React component library; commercial success is the envy of the CSS framework world. Slowly losing share to shadcn/ui and Radix-based patterns, but still the largest React CSS-component install base.

---

## 5. Comparison Matrix

Scoring: **1 = absent/poor**, **2 = below average**, **3 = average**, **4 = above average**, **5 = best in class**.

| Dimension | RoyCSS | Tailwind | Bootstrap | UnoCSS | Panda | StyleX | Bulma | Foundation | Material UI |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1. API design | 4 | 5 | 4 | 4 | 4 | 4 | 5 | 3 | 4 |
| 2. Performance | 4 | 5 | 3 | 5 | 5 | 5 | 4 | 2 | 3 |
| 3. Learning curve | 3 | 4 | 5 | 3 | 3 | 2 | 5 | 4 | 3 |
| 4. Community | 1 | 5 | 5 | 4 | 3 | 3 | 4 | 2 | 5 |
| 5. Documentation | 3 | 5 | 4 | 3 | 4 | 2 | 4 | 3 | 5 |
| 6. Accessibility | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 5 |
| 7. Developer Experience | 4 | 5 | 4 | 4 | 4 | 3 | 3 | 2 | 4 |
| 8. Modern CSS adoption | **5** | 4 | 2 | 4 | 4 | 3 | 4 | 1 | 3 |
| 9. Innovation | **5** | 4 | 2 | 4 | 4 | 4 | 3 | 1 | 3 |
| 10. Enterprise readiness | 3 | 4 | 4 | 3 | 4 | 4 | 3 | 2 | 5 |
| **Total (out of 50)** | **36** | **45** | **37** | **37** | **39** | **34** | **39** | **26** | **40** |

**Reading the matrix.** RoyCSS scores **5/5 on the two dimensions where modern CSS matters most** — Modern CSS adoption and Innovation — and is competitive on API, Performance, Accessibility, and Developer Experience. The matrix is unambiguous on RoyCSS's two structural deficits: **Community (1/5)** and **Documentation maturity (3/5)**. RoyCSS is also behind on Enterprise readiness (3/5) versus Material UI (5/5) and Tailwind (4/5).

---

## 6. Competitive Gap Analysis

This section enumerates every gap, in both directions, against the eight surveyed frameworks. "Behind" means RoyCSS must close the gap to compete; "Ahead" means RoyCSS should defend and amplify the advantage.

### 6.1 Where RoyCSS is Behind

| # | Gap | Evidence | Severity |
|---|---|---|---|
| B1 | Community size | Single maintainer, no GitHub star base comparable to Tailwind (84k) or Bootstrap (171k); npm downloads near zero vs. competitors at millions/week | **Critical** |
| B2 | Documentation site | Planned (per `DOCUMENTATION-SITE.md`) but not yet shipped; competitors have multi-year head start | **Critical** |
| B3 | VS Code / IDE tooling | LSP extension planned (`VSCODE-EXTENSION.md`) but not published; Tailwind IntelliSense is the bar | **High** |
| B4 | Component library breadth | 24 components vs. Material UI's 50+, Bootstrap's 30+, Foundation's 20+ (but more mature) | **High** |
| B5 | LTS / versioning policy | No public LTS, no semver guarantee documentation, no breaking-change RFC process | **High** |
| B6 | Enterprise governance | No security policy document, no SBOM, no commercial support option, no SLA | **High** |
| B7 | Plugin / preset ecosystem | No plugin API documented; Tailwind has ~600+ plugins, UnoCSS has 30+ presets | **Medium** |
| B8 | Template / starter gallery | No official templates; Tailwind UI, Catalyst, MUI templates are commercial moats | **Medium** |
| B9 | Testing infrastructure | No visual regression tests, no Playwright a11y audit suite, no CrossBrowserTesting integration | **Medium** |
| B10 | i18n / RTL verification | Logical properties are in place but no automated RTL test fixtures or i18n guidance docs | **Medium** |
| B11 | Build integrations | No first-party Vite, webpack, Turbopack, esbuild plugins; manual CSS import only | **Medium** |
| B12 | Figma / design tool bridge | Tokens export to JSON (Style Dictionary-compatible) but no Figma plugin | **Medium** |
| B13 | Headless UI pairings | No Radix, Headless UI, Ark UI, or React Aria adapter packages | **Medium** |
| B14 | Storybook integration | No Storybook addon, no MDX docs addon, no Chromatic CI example | **Low** |
| B15 | Analytics / telemetry | No opt-in telemetry to inform roadmap (Tailwind, MUI both have this) | **Low** |
| B16 | Migration tooling inbound | `migrate-colors.ts` and `migrate-logical.ts` exist for self, but no Animate.css → RoyCSS, Bootstrap → RoyCSS, or Tailwind → RoyCSS automated migrations | **Medium** |
| B17 | Bundle budget tooling | No `bundle-stats` integration, no Lighthouse CI preset, no per-effect size report | **Low** |
| B18 | Browser support matrix | No documented baseline (e.g., Baseline 2024), no polyfill strategy doc | **Low** |

### 6.2 Where RoyCSS is Ahead

| # | Advantage | Evidence | Defensibility |
|---|---|---|---|
| A1 | OKLCH-native throughout | Every color token is `oklch()`; relative color syntax used for derived shades with `@supports` fallbacks. No competitor matches this depth. | **High** — competitors would require breaking changes to match |
| A2 | `color-mix()` everywhere alpha is needed | Used in shadows, glows, overlays, borders; no `rgba()`/`hsla()` legacy | **High** |
| A3 | `light-dark()` automatic theming | Native CSS theme switching; competitors use JS-driven class toggling | **High** |
| A4 | View Transitions API first-class | `::view-transition-old(root)` / `::view-transition-new(root)` shipped in RoyMotion; no competitor ships this | **Very High** |
| A5 | Scroll-driven animations | `animation-timeline: view()` with `@supports` fallback; no competitor ships this | **Very High** |
| A6 | Relative color syntax for derived shades | `oklch(from var(--roy-primary) calc(l * 0.6) c h)` is unique; competitors hardcode shades | **High** |
| A7 | `@property` typed custom props | `--roy-angle` registered with `<angle>` syntax for smooth animation; no competitor documents this pattern at scale | **High** |
| A8 | 700+ effect library | No competitor ships an effect library of this size. Closest is Animate.css (~80 effects) and Motion One (~50 primitives) | **Very High** |
| A9 | RoyMotion animation system | Spring easings (3 variants), stagger utilities, entrance/exit/hover/scroll/page/load/skeleton/micro taxonomy — no competitor has an equivalent first-party motion system | **Very High** |
| A10 | 20-category effect taxonomy | Animations, hover, text, backgrounds, loaders, 3D, buttons, cards, borders, filters, forms, navigation, scroll, cursor, page transitions, glass UI, particles, microinteractions, visual, misc — competitors have at most 3–4 | **High** |
| A11 | `:where()` zero-specificity base styles | Allows user overrides without `!important`; competitors rely on source order | **Medium-High** |
| A12 | CSS Nesting in distribution | Native nesting, no preprocessor required | **Medium** — competitors will catch up |
| A13 | Logical properties everywhere | `inset-inline`, `inset-block`, `inline-size`, `block-size`, `margin-inline` throughout; Bootstrap and Bulma still ship physical properties in many components | **Medium-High** |
| A14 | Container queries in primitives | Layout components are container-query-aware; competitors are viewport-only | **High** |
| A15 | Framework-agnostic bindings | React, Vue, Angular, Svelte, vanilla HTML — Material UI is React-only, StyleX is React-only, Panda is React-first | **High** |
| A16 | Migration scripts ship in-repo | `migrate-colors.ts`, `migrate-logical.ts` are operational maturity signals rare in v1.0 | **Medium** |
| A17 | Style Dictionary-compatible token JSON | Token system round-trips with design tooling; competitors have bespoke formats | **Medium** |
| A18 | Strict CSP compatibility | No inline JS, no `eval`, no dynamic injection; Material UI and StyleX require runtime JS | **High** |
| A19 | CLI with effect search | `roycss search/list/info` is unmatched; no competitor has a class search CLI | **Medium-High** |
| A20 | Single-author coherence | No design-by-committee inconsistencies; competitors all show signs of multi-author drift | **Low-Medium** — but a single point of failure |

**Summary.** RoyCSS leads on 20 measurable dimensions, trailed by gaps on 18. The leads are concentrated in **modern CSS surface, motion, and effects** — the three areas the web platform is most actively expanding. The gaps are concentrated in **community, documentation, and enterprise operations** — the three areas that determine adoption velocity in mid-to-large organizations.

---

## 7. 15 Recommended Features for Market Leadership

The recommendations below are prioritized by **leverage** — the ratio of market impact to engineering effort. Each includes rationale, success metric, and target quarter. None of them require rearchitecting RoyCSS; all extend or operationalize what already exists.

### R1. Ship the documentation site with version pinning and live playgrounds

**Rationale.** Documentation is RoyCSS's #2 critical gap (per Section 6.1). The `DOCUMENTATION-SITE.md` architecture is complete and ambitious; shipping it closes the largest perception gap with Tailwind and Material UI. Version pinning (per `G6` in the docs plan) is a prerequisite for enterprise adoption — teams must be able to read docs for the exact version they have installed.

**Success metric:** Lighthouse ≥ 98 on every docs route; Cmd+K search returns rendered preview in ≤ 120 ms p95.

**Target:** Q2 FY26.

### R2. Publish the VS Code LSP extension on Marketplace + Open VSX

**Rationale.** IDE integration is the #3 critical gap. The `VSCODE-EXTENSION.md` plan delivers hover previews, completion, diagnostics, dead-class detection, a11y hints, and migration code actions. Tailwind IntelliSense sets the bar; RoyCSS can clear it with OKLCH swatches, effect previews inline, and the migration map (Animate.css/Bootstrap → RoyCSS). Open VSX publication ensures VSCodium, Cursor, Windsurf, and Codespaces support out of the box.

**Success metric:** 10,000 installs in first 90 days; ≥ 4.5-star rating; < 1% crash rate.

**Target:** Q2 FY26.

### R3. Ship automated migration CLI: `roycss migrate from-bootstrap` / `from-animate-css` / `from-tailwind`

**Rationale.** Migration is the #1 friction for any team adopting a new CSS framework. An automated migration CLI turns "rewrite all our classes" into "run a command and review the diff." `migrate-colors.ts` and `migrate-logical.ts` already prove the pattern; extending it to consume competitor class names is a force multiplier. The migration map JSON is already specified in the VS Code extension plan.

**Success metric:** ≥ 80% of Bootstrap utility classes auto-migrated with zero manual edits; ≥ 90% of Animate.css classes mapped.

**Target:** Q3 FY26.

### R4. Publish a Baseline 2024 browser support matrix with polyfill recommendations

**Rationale.** Enterprise teams cannot adopt RoyCSS without a documented support matrix. The Web Platform Baseline 2024 standard is the industry-neutral reference. Pairing it with a polyfill decision tree (`@supports` fallbacks already in RoyCSS, plus `@property` and container query polyfills) removes the #1 procurement objection.

**Success metric:** Single-page support matrix published; CI runs BrowserStack on Baseline 2024 set.

**Target:** Q2 FY26.

### R5. Add a public security policy, SBOM, and signed npm releases

**Rationale.** Enterprise governance gap (B6). A `SECURITY.md` with a disclosed vulnerability reporting process, a generated SBOM (via `npm sbom` or Syft), and signed releases (`npm publish --provenance`) meet the bar set by Tailwind, MUI, and Bootstrap. Supply-chain attacks make this table stakes for any 2026 framework.

**Success metric:** SLSA Level 2+ provenance; public security policy; 100% of releases signed.

**Target:** Q2 FY26.

### R6. Ship first-party build plugins: Vite, Next.js, Astro, webpack, Turbopack, esbuild

**Rationale.** Build integration gap (B11). Today RoyCSS requires a manual `@import "roycss.css"`. A Vite plugin with HMR-aware effect injection, a Next.js PostCSS plugin, an Astro integration, and a webpack loader would match UnoCSS and Tailwind's installation ergonomics.

**Success metric:** Five official plugins; `npm create roycss@latest` scaffolds a working app in ≤ 30 seconds.

**Target:** Q3 FY26.

### R7. Add a Radix UI / Headless UI / React Aria adapter package

**Rationale.** Headless UI pairings gap (B13). Modern component libraries are headless-behavior + RoyCSS-styles. An adapter package that wires RoyCSS classes to Radix primitives, Headless UI, and React Aria would give teams a 50-component library without RoyCSS authoring 50 components itself.

**Success metric:** Three adapter packages; ≥ 30 Radix primitives styled.

**Target:** Q4 FY26.

### R8. Ship a Storybook addon with MDX docs and Chromatic visual regression

**Rationale.** Testing infrastructure gap (B9) and Storybook integration gap (B14). A Storybook addon that auto-generates stories for every effect, with Chromatic CI for visual regression, gives enterprise teams the testing story they require. Material UI's Storybook is the bar.

**Success metric:** 1 story per effect (700+ stories); Chromatic snapshot on every PR.

**Target:** Q3 FY26.

### R9. Add a Figma plugin that syncs OKLCH tokens both directions

**Rationale.** Figma bridge gap (B12). Designers and developers must agree on tokens. Style Dictionary-compatible JSON exists; a Figma plugin that reads it (Variables API) and writes back designer edits closes the loop. No competitor has a two-way Figma plugin today.

**Success metric:** Plugin published to Figma Community; round-trip demo with RoyCSS design file.

**Target:** Q4 FY26.

### R10. Ship a public RFC process and semver commitment

**Rationale.** LTS / versioning policy gap (B5). A `rfcs/` repo, an RFC template, a public roadmap, and a published semver commitment (no breaking changes in minor, deprecation policy with 2 minor versions of warning) meet the enterprise bar. Tailwind and MUI both have this; RoyCSS does not.

**Success metric:** RFC process live; first 3 RFCs merged; semver policy in README.

**Target:** Q2 FY26.

### R11. Add opt-in telemetry with public dashboard

**Rationale.** Analytics gap (B15) and Community size signal (B1). Opt-in telemetry (`roycss telemetry enable`) collecting framework, version, build tool, and effect count — never source code — would inform roadmap and produce a public adoption dashboard. Tailwind and MUI both do this.

**Success metric:** ≥ 5% opt-in rate; public dashboard at `roycss.dev/stats`.

**Target:** Q3 FY26.

### R12. Ship a starter template gallery: `roycss.dev/templates`

**Rationale.** Template gallery gap (B8). Tailwind UI, Catalyst, MUI templates are commercial moats. RoyCSS should ship 12 free, MIT-licensed starters (marketing site, SaaS dashboard, admin panel, docs site, e-commerce, blog, portfolio, auth flow, error pages, email, presentation, kiosk) to neutralize the moat.

**Success metric:** 12 templates shipped; `npm create roycss@latest --template saas` works.

**Target:** Q4 FY26.

### R13. Add a plugin API and ship 5 first-party plugins as references

**Rationale.** Plugin / preset ecosystem gap (B7). Document a plugin contract (`roycss.plugin({ name, effects, tokens, transformers })`) and ship reference plugins: `@roycss/plugin-rtl`, `@roycss/plugin-print`, `@roycss/plugin-a11y-strict`, `@roycss/plugin-brand-colors`, `@roycss/plugin-tailwind-compat`. UnoCSS's preset model is the inspiration.

**Success metric:** Plugin contract documented; 5 plugins shipped; ≥ 10 community plugins within 6 months.

**Target:** Q3 FY26.

### R14. Ship a `roycss doctor` command: a11y, performance, and modern-CSS audit

**Rationale.** DX differentiation. A `roycss doctor` CLI command that scans a project's usage of RoyCSS classes and reports: WCAG contrast failures, `prefers-reduced-motion` gaps, effects that could be replaced with modern CSS (e.g., a JS-driven fade → `roy-in-fade`), and bundle-size opportunities. No competitor has this.

**Success metric:** `roycss doctor` exits non-zero on any WCAG AA failure; reports 5 actionable findings on a typical project.

**Target:** Q4 FY26.

### R15. Establish a RoyCSS Working Group with public meetings and notes

**Rationale.** Community size is the single hardest gap to close, and it cannot be closed by code alone. A public working group (monthly video calls, published notes, rotating chair, contributor ladder from Triager to Maintainer) is the proven model (Tailwind, MUI, Chakra, Radix all do this). It signals seriousness to enterprises and on-ramps contributors.

**Success metric:** First 6 meetings held; ≥ 5 non-author contributors merged PRs; contributor ladder published.

**Target:** Q2 FY26.

---

## 8. Strategic Positioning & Conclusion

RoyCSS occupies a position no competitor can claim without breaking changes: a **modern-CSS-native, effects-led, framework-agnostic CSS platform** with a first-party motion system, a token architecture designed for the `oklch()` era, and View Transitions plus scroll-driven animations as first-class primitives. The technical foundation is sound; the gaps are operational, not architectural.

The competitive matrix total (RoyCSS 36, Material UI 40, Panda 39, Bulma 39, Bootstrap 37, UnoCSS 37, Tailwind 45, StyleX 34, Foundation 26) understates RoyCSS's strategic position because it weights Community and Documentation equally with Modern CSS and Innovation. In any team whose procurement criteria prioritize **modern CSS surface and motion richness** — design-system teams, motion-engineering teams, marketing and brand teams, and any team targeting Baseline 2024+ — RoyCSS already leads on the dimensions that matter most.

The 15 recommendations in Section 7 are sequenced to convert that technical lead into adoption velocity. R1 (docs), R2 (IDE), R3 (migrations), R10 (RFC/semver), and R5 (security) are the highest-leverage moves and should be the Q2 FY26 focus. R6 (build plugins), R7 (headless adapters), R8 (Storybook), R11 (telemetry), R13 (plugin API), and R15 (working group) are the Q3 FY26 wave that converts adoption into ecosystem. R9 (Figma), R12 (templates), R14 (`doctor`), and the remaining items are the Q4 FY26 wave that converts ecosystem into market leadership.

The thesis is simple: **the web platform finally gave us a new primitive surface; RoyCSS is the first framework built on it; the only thing standing between RoyCSS and category leadership is execution on operational maturity.** Every gap in Section 6.1 is closable. Every advantage in Section 6.2 is defensible. The path forward is clear.

---

*End of document. Word count: ~3,800. Prepared for internal strategic planning and external publication after R1 (documentation site) ships.*
