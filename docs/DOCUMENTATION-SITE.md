# RoyCSS Documentation Site — Architecture & Design

> **Mission:** Build the best CSS-effects documentation site ever shipped — surpassing Tailwind CSS, Animate.css, and Bootstrap docs in depth, interactivity, accessibility, and developer productivity. RoyCSS ships **700+ production-ready effects** across 20 categories; the docs must make every one of them discoverable, understandable, copyable, and verifiable in under 30 seconds.

---

## Table of Contents

1. [Goals](#1-goals)
2. [Information Architecture](#2-information-architecture)
3. [Page Layouts](#3-page-layouts)
4. [Search System](#4-search-system)
5. [Interactive Features](#5-interactive-features)
6. [Keyboard Shortcuts](#6-keyboard-shortcuts)
7. [AI Integration](#7-ai-integration)
8. [Migration System](#8-migration-system)
9. [Versioning](#9-versioning)
10. [Performance Budget](#10-performance-budget)
11. [Accessibility](#11-accessibility)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Goals

### 1.1 Primary Goals

| # | Goal | Success Metric |
|---|------|----------------|
| G1 | **Every effect discoverable in <30s** | Median time-to-effect ≤ 30s from landing |
| G2 | **Every effect usable without reading prose** | Live preview + copyable code on every page |
| G3 | **Best-in-class search** | Cmd+K → typed query → preview rendered ≤ 120ms p95 |
| G4 | **Zero-accessibility surprises** | WCAG 2.1 AA + reduced-motion notes on every effect |
| G5 | **Framework-agnostic onboarding** | React, Vue, Angular, Svelte, vanilla HTML tabs per page |
| G6 | **Performance transparency** | Bundle size + render cost shown for every effect |
| G7 | **AI-native authoring** | Prompt → working snippet in ≤ 5s |
| G8 | **Sub-1s TTI globally** | Lighthouse ≥ 98 on every docs route |

### 1.2 Design Principles

1. **Show, don't tell.** Every concept opens with a live preview. Prose comes second.
2. **Copy-first.** Every code block has Copy HTML, Copy CSS, Copy JSX, Copy URL actions.
3. **Progressive disclosure.** Default view = preview + class name. Expand for accessibility, performance, variants, source.
4. **Keyboard complete.** The entire site is operable from the keyboard, with documented shortcuts.
5. **Theme honest.** Light, dark, and system themes are first-class — every preview validates in all three.
6. **Versioned truth.** Every page is pinned to a version; switching versions re-renders content.
7. **AI as collaborator.** AI is not a chatbot bolted on; it's woven into search, snippets, and migration.

### 1.3 Non-Goals

- We are not building a CMS. Content lives in Markdown + TypeScript data files in the repo.
- We are not building a community forum. Discussions link to GitHub Discussions.
- We are not building a CDN playground. Sandboxes embed StackBlitz / CodeSandbox iframes.

---

## 2. Information Architecture

### 2.1 Top-Level Navigation

```
RoyCSS
├── Docs
│   ├── Getting Started
│   │   ├── Installation
│   │   ├── Quick Start (5-minute tour)
│   │   ├── Framework Guides (React / Vue / Angular / Svelte / Vanilla)
│   │   ├── CLI Reference
│   │   └── Editor Setup (VS Code, JetBrains, Neovim)
│   ├── Core Concepts
│   │   ├── Design Tokens
│   │   ├── OKLCH & color-mix()
│   │   ├── Logical Properties
│   │   ├── Container Queries
│   │   ├── @property Registration
│   │   ├── prefers-reduced-motion
│   │   └── Naming Conventions (roycss-{category}-{name}[-variant])
│   ├── Effects Library        ← 700+ effects, the heart of the site
│   │   ├── Component Explorer (browse by visual)
│   │   ├── Utility Explorer   (browse by class name)
│   │   ├── By Category        (20 categories)
│   │   ├── By Use Case        (hero, loader, error, success, hover…)
│   │   └── By Complexity      (CSS-only / JS-optional / Container-query)
│   ├── API Reference
│   │   ├── TypeScript Types
│   │   ├── JavaScript API (effects registry, generators)
│   │   ├── CSS Custom Properties
│   │   └── CLI Commands
│   ├── Migration Guides
│   │   ├── From Animate.css
│   │   ├── From Tailwind
│   │   ├── From Bootstrap
│   │   └── Version-to-Version (1.x → 2.x changelogs)
│   ├── AI Playground
│   ├── Roadmap
│   └── Changelog
├── Components         ← First-party component library
├── Examples           ← Real-world compositions
├── Blog
└── GitHub ↗
```

### 2.2 Effect Taxonomy

Each of the 700+ effects carries this metadata (sourced from `src/lib/roycss-types.ts`):

```typescript
interface EffectDoc extends CSSEffect {
  slug: string;                    // URL-safe identifier
  versionAdded: string;            // e.g. "1.0.0"
  versionDeprecated?: string;
  replacementFor?: string[];       // renamed effects
  bundleBytes: number;             // gzipped CSS bytes
  renderCost: "low" | "medium" | "high";  // compositor / layout / paint
  triggersLayout: boolean;
  triggersPaint: boolean;
  triggersCompositor: boolean;
  accessibility: {
    motionSafe: boolean;           // honors prefers-reduced-motion
    contrastSafe: boolean;         // WCAG AA on default surfaces
    flashSafe: boolean;            // no >3Hz flashing
    screenReaderNeutral: boolean;  // decorative-only
  };
  variants: string[];              // e.g. ["-soft", "-strong", "-slow"]
  frameworkSnippets: {
    html: string;
    react: string;
    vue: string;
    svelte: string;
    angular: string;
  };
  relatedEffects: string[];        // slugs
  realWorldUsage: string[];        // e.g. ["loading state", "hero CTA"]
  aiPromptHints: string[];         // surfaces in AI search
}
```

### 2.3 URL Scheme

```
/docs/effects/[category]/[effect-slug]           ← single effect
/docs/effects/[category]                          ← category index
/docs/explorer/components                         ← visual browser
/docs/explorer/utilities                          ← class-name browser
/docs/api/[type]/[name]                           ← API reference
/docs/migration/[from]-to-roycss                  ← migration guide
/docs/[version]/...                               ← versioned snapshot
```

Canonical URLs always point to the latest stable; `?v=1.2.0` or `/v1.2.0/` pins a version.

---

## 3. Page Layouts

### 3.1 Global Shell

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]  Docs  Components  Examples  AI  Roadmap   [Search ⌘K]  │
│                                                   [v1.4.0 ▾] [☾] │
├───────────────┬──────────────────────────────────────────────────┤
│               │                                                  │
│  Sidebar      │   Main Content                                   │
│  (sticky,     │                                                  │
│   collapsible,│                                                  │
│   searchable) │                                                  │
│               │                                                  │
│  [On this     │                                                  │
│   page ▸]     │                                                  │
│               │                                                  │
└───────────────┴──────────────────────────────────────────────────┘
                                          [⌘K] [Copy Page] [Feedback]
```

- **Top bar (h=56px):** logo, primary nav, global search, version selector, theme toggle.
- **Sidebar (w=280px):** hierarchy with section icons, in-place fuzzy filter, "On this page" outline below.
- **Main column (max-w=896px):** prose, previews, code blocks.
- **Right rail (w=240px, ≥1280px only):** live TOC, page metadata (last updated, version), "Edit on GitHub", "Report issue".
- **Mobile:** sidebar becomes a drawer; right rail collapses into a "Page info" sheet.

### 3.2 Effect Detail Page

The most important page in the entire site. Every effect gets this layout:

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Animations / Pulse Glow                       ★ Favorite  ⋯  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  # Pulse Glow                                                    │
│  A smooth pulsing glow effect that draws attention.              │
│                                                                  │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐ │
│  │                             │  │ Class                     │ │
│  │     [LIVE PREVIEW]          │  │ roycss-pulse-glow         │ │
│  │                             │  │ [Copy] [Permalink]        │ │
│  │  ▶ Play  ⏸ Pause  ⟲ Reset   │  │                           │ │
│  │                             │  │ Variant                   │ │
│  └─────────────────────────────┘  │ ◯ Default                 │ │
│                                   │ ◯ -soft                    │ │
│  Theme: ◉ System  ○ Light  ○ Dark │ ◯ -strong                 │ │
│  Background: [surface options ▾]  │ ◯ -slow                    │ │
│  Speed:    [────●──────] 1.0×     │ ◯ -fast                    │ │
│  Color:    [■ primary ▾]          │                           │ │
│                                   │ Source                    │ │
│  [Edit in Playground →]           │ roycss-pulse-glow         │ │
│                                   │ since v1.0.0 · 0.42 kB gz  │ │
│                                   │ Render: compositor only    │ │
│                                   │ Motion safe: ✅            │ │
│                                   └───────────────────────────┘ │
│                                                                  │
│  ┌─ Tabs: [HTML] [React] [Vue] [Svelte] [Angular] [CSS] ─────┐  │
│  │                                                            │  │
│  │  <div class="roycss-pulse-glow">                          │  │
│  │    Hover or focus me                                       │  │
│  │  </div>                                                    │  │
│  │                                                            │  │
│  │  [Copy HTML] [Copy CSS] [Copy JSX] [Copy URL] [Export ⋯] │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ## Accessibility                                                │
│  - ✅ Honors `prefers-reduced-motion` (animation pauses).        │
│  - ✅ Decorative — no semantic content affected.                 │
│  - ⚠️ Avoid on elements with `aria-live`; pulse may distract.    │
│  - WCAG 2.1 AA contrast preserved on default surfaces.           │
│                                                                  │
│  ## Performance                                                  │
│  | Metric               | Value   | Notes                      | │
│  |----------------------|---------|-----------------------------| │
│  | Gzipped size         | 0.42 kB | keyframes + selector        | │
│  | Layout trigger       | No      | compositor-only             | │
│  | Paint trigger        | No      | box-shadow animates         | │
│  | Compositor trigger   | Yes     | opacity + box-shadow        | │
│  | Recommended max      | 5 el.   | beyond 5, consider stagger  | │
│                                                                  │
│  ## Variants                                                     │
│  | Class                  | Duration | Intensity |              | │
│  |------------------------|----------|-----------|              | │
│  | roycss-pulse-glow      | 2.0s     | default   |              | │
│  | roycss-pulse-glow-soft | 3.0s     | 50%       |              | │
│  | roycss-pulse-glow-strong | 1.2s   | 150%      |              | │
│                                                                  │
│  ## Related                                                      │
│  • Breathe · Pulse Ring · Neon Flicker · Hover Glow Border       │
│                                                                  │
│  ## Used In                                                      │
│  • Hero CTA · Notification badge · Live indicator                │
│                                                                  │
│  ## AI Prompt                                                    │
│  > "Add a subtle attention pulse to the submit button"           │
│  → generates the class + HTML scaffold                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Layout rules:**

- The live preview is **always above the fold** on desktop, never pushed below prose.
- The **Class** sidebar is sticky on scroll, so the class name is always visible while reading.
- Tabs persist the user's last framework choice via `localStorage` (cross-page consistency).
- Every code block supports **click-to-copy** with a 2-second toast, no animation, no flash.
- The **Export** menu offers: "Add to collection", "Download .css", "Download .html", "Open in StackBlitz", "Open in CodeSandbox".

### 3.3 Component Explorer (Visual Browser)

A full-screen gallery for browsing by *what it looks like* rather than by name.

```
┌──────────────────────────────────────────────────────────────────┐
│  Component Explorer                                              │
│                                                                  │
│  [Search visuals…]  Category ▾   Motion ▾   Theme ▾   Sort ▾    │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ ▶    │ │ ▶    │ │ ▶    │ │ ▶    │ │ ▶    │ │ ▶    │         │
│  │pulse │ │fade  │ │shake │ │glow  │ │float │ │jello │         │
│  │ glow │ │ in-up│ │      │ │      │ │      │ │      │         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ ▶    │ │ ▶    │ │ ▶    │ │ ▶    │ │ ▶    │ │ ▶    │         │
│  ...                                                             │
│                                                                  │
│  Showing 1–24 of 700 · [Load more] or press ]                   │
└──────────────────────────────────────────────────────────────────┘
```

- Each tile auto-plays its effect on hover (paused when off-screen via `IntersectionObserver`).
- `prefers-reduced-motion: reduce` → tiles render static with a play button.
- Keyboard: arrow keys move focus, `Enter` opens detail, `]` loads more.
- Filter chips: **category**, **motion cost** (low/med/high), **theme**, **newest**, **most-copied**.
- "Most copied" is computed from anonymized Copy events; this surfaces what the community actually uses.

### 3.4 Utility Explorer (Class-Name Browser)

For users who think in class names (the Tailwind mental model).

```
┌──────────────────────────────────────────────────────────────────┐
│  Utility Explorer                                                │
│                                                                  │
│  Prefix: ( anim- ) ( hover- ) ( text- ) ( bg- ) ( load- ) ...   │
│  Filter: roycss-[____________]                                   │
│                                                                  │
│  roycss-anim-pulse-glow          · Animations · 0.42 kB · ▶     │
│  roycss-anim-fade-in-up          · Animations · 0.31 kB · ▶     │
│  roycss-anim-bounce-in           · Animations · 0.55 kB · ▶     │
│  roycss-hover-scale              · Hover       · 0.18 kB · ▶     │
│  roycss-hover-underline-slide    · Hover       · 0.27 kB · ▶     │
│  roycss-text-gradient            · Text        · 0.36 kB · ▶     │
│  ...                                                             │
└──────────────────────────────────────────────────────────────────┘
```

- Behaves like an IDE symbol list: type-to-filter with fuzzy match.
- Prefix toggle chips instantly narrow to a category namespace.
- `Enter` opens the detail page; `Cmd+Enter` opens in a new tab.
- Each row shows the class, category, gzipped size, and a hover-only preview swatch.

### 3.5 Getting Started Page

A linear, single-page onboarding with sticky progress bar (0% → 100% across 5 steps):

1. **Install** — `npm install roycss` (or Bun/pnpm/Yarn tabs), 1-line import.
2. **First effect** — copy `roycss-pulse-glow` into an existing project, see it work.
3. **Theme it** — override `--roy-color-primary` in OKLCH, watch the site re-theme live.
4. **Pick a framework** — show the right import snippet.
5. **Explore** — CTA into Component Explorer.

---

## 4. Search System

### 4.1 Goals

- **Instant (<120ms p95)** — results appear as the user types, before they finish.
- **Fuzzy** — `plsGlow` matches `pulse-glow`; `hdrglow` matches `hover-glow-border`.
- **Multi-modal** — searches effects, utilities, API symbols, docs pages, and AI prompts.
- **Keyboard-native** — `Cmd+K` opens, arrow keys navigate, `Enter` jumps, `Esc` closes.
- **Previewable** — hovering a result shows a live mini-preview, not just text.

### 4.2 Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Build Time (Node script in /scripts/build-search-index.ts) │
│                                                            │
│  effects.json + docs/*.md + api/*.ts                       │
│        │                                                   │
│        ▼                                                   │
│  ┌──────────────┐    ┌────────────────┐                    │
│  │ MiniSearch   │    │ Embeddings     │                    │
│  │ (lexical,    │    │ (vector, 384d, │                    │
│  │  fuzzy, BM25)│    │  MiniLM)       │                    │
│  └──────────────┘    └────────────────┘                    │
│        │                     │                             │
│        ▼                     ▼                             │
│  search-index.json     embeddings.bin (binary, ~2MB)       │
│        │                     │                             │
│        └──────────┬──────────┘                             │
│                   ▼                                        │
│          Static export to /public/search/                  │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼  (loaded once, cached)
┌────────────────────────────────────────────────────────────┐
│  Runtime (in-browser)                                      │
│                                                            │
│  User query → ┌─────────────┐  ┌──────────────────────┐    │
│               │ MiniSearch  │  │ Vector similarity    │    │
│               │ (lexical)   │  │ (cosine, top-50)     │    │
│               └──────┬──────┘  └──────────┬───────────┘    │
│                      └──────┬─────────────┘                │
│                             ▼                              │
│                    Reciprocal Rank Fusion                  │
│                             │                              │
│                             ▼                              │
│               Ranked results + AI prompt path              │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Search Modal UX

```
┌────────────────────────────────────────────────────────────┐
│  🔍  pulse glow                                       Esc  │
│                                                            │
│  Effects                                                   │
│  ─────────                                                 │
│  ▸ roycss-anim-pulse-glow        Animations   ▶ preview    │
│    roycss-anim-pulse-soft        Animations                 │
│    roycss-anim-pulse-ring        Animations                 │
│    roycss-hover-glow-border      Hover                      │
│                                                            │
│  AI Prompt                                                 │
│  ─────────                                                 │
│  ⚡ "Add a subtle attention pulse to the submit button"    │
│     ↵ to generate                                         │
│                                                            │
│  Docs                                                      │
│  ─────────                                                 │
│  📄 Design Tokens › Color › Primary OKLCH                  │
│  📄 prefers-reduced-motion › How RoyCSS respects it        │
│                                                            │
│  API                                                       │
│  ─────────                                                 │
│  {} CSSEffect (interface)                                  │
│  {} getEffect(id: string): CSSEffect | undefined           │
│                                                            │
│  Recent: fade-in-up · jello · roycss-glass                 │
│                                                            │
│  ↑↓ navigate  ↵ open  ⌘↵ new tab  ⌘c copy class  esc close │
└────────────────────────────────────────────────────────────┘
```

**UX rules:**

- Modal opens in 1 frame (`opacity` transition only, no transform).
- First result is auto-selected; `Enter` opens it.
- `Tab` cycles sections (Effects → AI → Docs → API).
- `Cmd+Enter` opens the selection in a new tab.
- `Cmd+C` while a class is selected copies the class name (no need to open the page).
- Recent searches persist in `localStorage` (last 8, deduped).
- AI prompt path: if the query reads like intent ("add a glow to my button"), surface the AI suggestion above lexical results.

### 4.4 Ranking Signals

Each result score combines:

| Signal | Weight | Notes |
|--------|--------|-------|
| Lexical BM25 (MiniSearch) | 0.35 | exact + fuzzy |
| Vector similarity | 0.30 | semantic match |
| Tag match | 0.10 | `tags[]` field |
| Popularity (copy count) | 0.10 | global usage signal |
| Recency boost | 0.05 | new in last 2 versions |
| Page-rank (internal links) | 0.05 | docs graph centrality |
| Exact-class match | 0.05 | `roycss-pulse-glow` exact |

---

## 5. Interactive Features

### 5.1 Live Editing Playground

Every effect page has an **Edit in Playground** action that opens a full-page editor:

```
┌────────────────────────────────────────────────────────────┐
│  Files: [index.html ▾] [style.css] [script.js]    [Run ▶] │
├────────────────────────────────┬───────────────────────────┤
│  <div class="roycss-pulse-     │                           │
│    glow">                      │                           │
│    Hover or focus me           │      [LIVE PREVIEW]       │
│  </div>                        │                           │
│                                │      ▶ pulse-glow         │
│  <style>                       │                           │
│    @import "roycss";           │                           │
│    :root {                     │                           │
│      --roy-color-primary:      │                           │
│        oklch(0.7 0.14 165);    │                           │
│    }                           │                           │
│  </style>                      │                           │
│                                │                           │
│  [Auto-run on change ☑]        │  [Copy] [Share URL]       │
└────────────────────────────────┴───────────────────────────┘
```

- **Monaco editor** (the same editor as VS Code) for syntax highlighting + IntelliSense.
- **Auto-run** with 300ms debounce — preview re-renders on every keystroke.
- **Share URL** encodes the entire sketch in a compressed query string (LZ-string + base64).
- **Permalink** to any state — useful for bug reports and Discord help.
- **No backend** — runs entirely in the browser; CDN serves the `roycss` package.

### 5.2 Code Generation

Beyond copy-paste, the site generates framework-specific code:

- **HTML** — semantic markup with the class applied.
- **React** — `className="roycss-pulse-glow"` with TypeScript props.
- **Vue** — `<template>` + scoped `<style>` import.
- **Svelte** — `<div class="roycss-pulse-glow">` with `import "roycss/css"`.
- **Angular** — `class="roycss-pulse-glow"` + `angular.json` styles hint.
- **Astro** — Astro-flavored snippet.
- **Plain CSS** — just the `@keyframes` + selector for self-contained copy.

The generator is a pure function of `(effect, framework, options)` so the same input always produces identical output (deterministic snapshots for tests).

### 5.3 Color Customizer

A side panel on every effect page lets users override the OKLCH palette:

```
┌──────────────────────────────────────┐
│  Color Customizer                    │
│                                      │
│  Primary    [■ oklch(0.7 0.14 165)]  │
│  Secondary  [■ oklch(0.7 0.12 205)]  │
│  Accent     [■ oklch(0.6 0.23 283)]  │
│                                      │
│  [Reset]  [Copy :root]  [Share]      │
└──────────────────────────────────────┘
```

- Pickers use the OKLCH color wheel (lightness × chroma × hue).
- `Copy :root` outputs the entire token override block.
- Preview re-renders live via CSS custom property updates — no rebuild.

### 5.4 Collection Export

Users can star effects into a personal collection, then export:

- **Single CSS file** — only the effects in the collection (tree-shaken).
- **JSON manifest** — list of class names + metadata, for build pipelines.
- **HTML demo page** — standalone `.html` with all previews.
- **Tailwind plugin config** — generates a `tailwind.config.js` extension snippet.
- **Figma tokens** — Style-Dictionary-compatible JSON for design tools.

Collections are stored locally (no account needed) and sync via URL share.

### 5.5 Copy Actions Matrix

Every code block has a consistent action bar:

| Action | Behavior |
|--------|----------|
| Copy HTML | Copies markup with current framework's attribute style |
| Copy CSS | Copies the effect's CSS (keyframes + selector) |
| Copy JSX | React/JSX flavored |
| Copy URL | Permalink to this exact preview state |
| Copy Markdown | `[Pulse Glow](https://roycss.dev/effects/animations/pulse-glow)` |
| Export ▾ | Opens the export menu (see 5.4) |

All copies fire a 2-second toast with a `Cmd+V` hint and a "View copied" affordance.

---

## 6. Keyboard Shortcuts

### 6.1 Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `Cmd+/` | Open keyboard shortcut cheat sheet |
| `Cmd+.` | Toggle theme (system → light → dark) |
| `Cmd+Shift+L` | Open Command Palette (page actions) |
| `Cmd+[` / `Cmd+]` | Navigate back / forward |
| `g` then `e` | Go to Effect Explorer |
| `g` then `u` | Go to Utility Explorer |
| `g` then `d` | Go to Docs home |
| `g` then `r` | Go to Roadmap |
| `g` then `c` | Go to Changelog |
| `?` | Show contextual help |
| `Esc` | Close any overlay / modal |

### 6.2 Search Modal

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Move selection |
| `Enter` | Open selection in current tab |
| `Cmd+Enter` | Open in new tab |
| `Cmd+C` | Copy selected class name |
| `Tab` | Cycle result sections |
| `Shift+Tab` | Cycle sections backward |
| `/` | Focus search from anywhere |

### 6.3 Effect Detail Page

| Shortcut | Action |
|----------|--------|
| `p` | Play / pause preview |
| `r` | Reset preview |
| `c` | Copy current tab's code |
| `v` | Cycle variants |
| `t` | Cycle theme on preview |
| `←` / `→` | Previous / next effect in category |
| `s` | Star / unstar effect |
| `e` | Open Edit in Playground |

### 6.4 Explorer Pages

| Shortcut | Action |
|----------|--------|
| `↑` `↓` `←` `→` | Move tile focus |
| `Enter` | Open tile |
| `Space` | Preview tile (hold) |
| `]` | Load more |
| `[` | Load previous |
| `f` | Focus filter input |

### 6.5 Shortcut Discoverability

- A persistent `?` button in the bottom-right opens the cheat sheet.
- First-time visitors see a one-time coach mark: "Press `Cmd+K` to search 700+ effects".
- The cheat sheet is fully keyboard-navigable and screen-reader friendly.

---

## 7. AI Integration

### 7.1 Philosophy

AI is a **first-class authoring surface**, not a chatbot sidebar. Three integration points:

1. **Search** — intent detection routes natural-language queries to a generation path.
2. **Snippet generation** — users ask for an outcome; the site returns working code.
3. **Migration** — paste Animate.css / Tailwind code, get RoyCSS equivalent.

### 7.2 Prompt Examples (Built-In Library)

The AI Playground ships with 40+ curated prompts, each linked to real effects:

| Prompt | Generated Output |
|--------|------------------|
| "Generate a hero section with glow effect" | `<section>` + `roycss-anim-pulse-glow` + gradient overlay |
| "Make my button shake on error" | `roycss-anim-shake` + error-state CSS |
| "Add a loader to my async card" | `roycss-load-spinner` + skeleton fallback |
| "Underline my nav links on hover with a slide" | `roycss-hover-underline-slide` applied to `<a>` |
| "Glassmorphism sidebar" | `roycss-glass-frosted` + `backdrop-filter` note |
| "3D tilt card on hover" | `roycss-transform-3d-tilt` + perspective container |
| "Animate counter from 0 to 1000" | `roycss-anim-count-up` + JS hook |
| "Page transition fade between routes" | `roycss-page-fade` + framework router snippet |

### 7.3 Generation Pipeline

```
User prompt
     │
     ▼
[1] Intent classification
    (hero | loader | hover | transition | microinteraction | error | success)
     │
     ▼
[2] Effect retrieval (vector search over effect descriptions)
    top-5 candidate effects
     │
     ▼
[3] Composition planner
    (which effects combine, in what DOM structure, with what tokens)
     │
     ▼
[4] Code generator
    (HTML + framework-specific attribute layer + CSS imports)
     │
     ▼
[5] Validator (headless browser, 2s budget)
    ✓ compiles?  ✓ visible?  ✓ motion-safe?
     │
     ▼
[6] Rendered snippet + explanation + "open in Playground" CTA
```

### 7.4 AI in Search

When a query matches intent patterns (verbs like "add", "make", "generate"; outcomes like "glow", "loader", "transition"), the search modal surfaces an **AI Prompt** section above lexical results:

```
┌────────────────────────────────────────────────────────────┐
│  🔍  add a glow to my button                          Esc  │
│                                                            │
│  AI Prompt                                                 │
│  ─────────                                                 │
│  ⚡ "Add a glow to my button"                              │
│     ↵ generate · uses: roycss-anim-pulse-glow             │
│                                                            │
│  Effects                                                   │
│  ─────────                                                 │
│    roycss-anim-pulse-glow        Animations                │
│    roycss-hover-glow-border      Hover                     │
│    roycss-anim-neon-flicker      Animations                │
└────────────────────────────────────────────────────────────┘
```

### 7.5 AI in Migration

The migration pages accept pasted source code and return RoyCSS equivalents:

```
┌────────────────────────────────────────────────────────────┐
│  Paste your Animate.css code:                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ <div class="animate__animated animate__bounce">      │  │
│  │   Hello                                              │  │
│  │ </div>                                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [Migrate →]                                               │
│                                                            │
│  RoyCSS equivalent:                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ <div class="roycss-anim-bounce-in">Hello</div>       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Notes:                                                    │
│  • `animate__bounce` → `roycss-anim-bounce-in`            │
│  • No JS import needed; RoyCSS is pure CSS                │
│  • Honors prefers-reduced-motion by default               │
└────────────────────────────────────────────────────────────┘
```

The mapping table is curated and versioned; AI fills gaps with a "low confidence" badge when no exact mapping exists.

### 7.6 Privacy & Cost

- All AI inference runs server-side via the RoyCSS AI endpoint.
- No user code is stored; prompts are ephemeral and logged only for abuse detection.
- Free tier: 50 generations/day per anonymous visitor (rate-limited by IP + fingerprint).
- Pro tier (future): unlimited generations, saved prompts, team collections.

---

## 8. Migration System

### 8.1 From Animate.css

A side-by-side mapping table for all 75 Animate.css classes:

| Animate.css | RoyCSS | Notes |
|-------------|--------|-------|
| `animate__bounce` | `roycss-anim-bounce-in` | entrance direction differs; see docs |
| `animate__flash` | `roycss-anim-flash` | 1:1 |
| `animate__pulse` | `roycss-anim-pulse-soft` | softer by default |
| `animate__rubberBand` | `roycss-anim-rubber-band` | 1:1 |
| `animate__shake` | `roycss-anim-shake` | 1:1 |
| `animate__swing` | `roycss-anim-swing` | 1:1 |
| `animate__tada` | `roycss-anim-tada` | 1:1 |
| `animate__wobble` | `roycss-anim-wobble` | 1:1 |
| `animate__fadeIn` | `roycss-anim-fade-in` | 1:1 |
| `animate__fadeInUp` | `roycss-anim-fade-in-up` | 1:1 |
| `animate__zoomIn` | `roycss-anim-zoom-in` | 1:1 |
| `animate__slideInLeft` | `roycss-anim-slide-in-left` | 1:1 |
| `animate__flipInX` | `roycss-anim-flip-in-x` | 1:1 |
| ... | ... | full table on the migration page |

The migration page also includes:

- **Drop-in replacement CSS** — a compatibility layer that maps Animate.css class names to RoyCSS effects for incremental migration.
- **Codemod** — `npx roycss migrate animate-css ./src` rewrites class names in place.
- **Behavioral differences** — e.g. RoyCSS's `bounce-in` includes a subtle shadow drop Animate.css doesn't.

### 8.2 From Tailwind CSS

Tailwind doesn't ship animations beyond `animate-spin/ping/pulse/bounce`. The migration guide:

1. **Coexistence** — RoyCSS sits alongside Tailwind; both classes work.
2. **Token bridge** — paste RoyCSS's Tailwind config export (see `design-tokens.ts` `generateTailwindConfig()`) into `tailwind.config.js`.
3. **Animation mapping** — Tailwind's `animate-pulse` → `roycss-anim-pulse-soft`; `animate-bounce` → `roycss-anim-bounce-in`.
4. **Custom animations** — replace `tailwind.config.js` `keyframes` blocks with RoyCSS classes; remove the duplication.

### 8.3 From Bootstrap

Bootstrap's built-in animations are limited (`fade`, `show`). Migration:

- `fade` → `roycss-anim-fade-in`
- `show` (modal) → `roycss-anim-fade-in` + `roycss-page-scale-in`
- Custom Bootstrap hover effects → `roycss-hover-*` equivalents
- Spinner border/grow → `roycss-load-spinner` / `roycss-load-grow`

Plus a token mapping from Bootstrap's SCSS variables to RoyCSS OKLCH custom properties.

### 8.4 Version-to-Version

Every minor release ships a migration guide. Example for 1.x → 2.x:

- Renamed classes (`roycss-float` → `roycss-anim-float`).
- Deprecated variants marked with a banner on the effect page.
- Codemod `npx roycss migrate v2 ./src` performs all renames.
- `replacementFor` metadata powers automatic redirects from old URLs.

---

## 9. Versioning

### 9.1 Version Selector

The top-right version dropdown lists:

```
v1.4.0  (current)  ←
v1.3.2
v1.3.1
v1.3.0
v1.2.x
v1.1.x
v1.0.x
─────────────
main (nightly)
```

Selecting a version:

- Re-routes to `/v1.3.2/docs/...` (fully static, served from `public/versions/`).
- Adds a yellow banner: "You're viewing v1.3.2. [Switch to latest →]"
- The class data, snippets, and even design tokens are version-scoped — a v1.0 effect that was renamed in v1.2 shows its old name in v1.0 docs.

### 9.2 Changelog Generation

Changelogs are generated from:

1. **Conventional Commits** — `feat:`, `fix:`, `docs:`, `perf:`.
2. **Effect metadata** — `versionAdded`, `versionDeprecated`.
3. **Codemod availability** — whether a rename has an automated migration.

Output formats:

- Markdown (`/docs/changelog`) — human-readable, grouped by category.
- RSS (`/changelog.rss`) — subscribe in feed readers.
- JSON (`/api/changelog.json`) — machine-readable for tooling.

### 9.3 Long-Term Support

- The latest two minor versions receive docs backports for critical fixes.
- Older versions remain readable but carry a "unmaintained" banner.
- Effect deprecations live for two minor versions before removal.

---

## 10. Performance Budget

### 10.1 Per-Route Budgets

| Route | JS (gz) | CSS (gz) | LCP | TTI | CLS |
|-------|---------|----------|-----|-----|-----|
| Landing | 80 kB | 14 kB | 1.0s | 1.2s | 0 |
| Effect detail | 90 kB | 18 kB | 1.1s | 1.3s | 0 |
| Explorer | 110 kB | 20 kB | 1.4s | 1.8s | 0 |
| Search modal | +12 kB lazy | — | — | — | 0 |
| Playground | +180 kB lazy | — | 1.8s | 2.2s | 0 |

### 10.2 Strategies

- **Route-level code splitting** — Playground, AI, and Explorer load on demand.
- **Effect CSS lazy-loading** — only the visible effect's CSS is inlined; others load on hover (prefetch) or on click.
- **Search index** — `search-index.json` (~120 kB gz) loads on idle; embeddings binary loads on first search open.
- **Fonts** — Geist Sans/Mono via `next/font` with `display: swap`.
- **Images** — only the logo and og:image; everything else is CSS-rendered.
- **Preconnect** — to StackBlitz, CodeSandbox, GitHub for embed warmup.
- **HTTP/3 + Brotli** — Caddyfile already configured for Brotli; add HTTP/3.
- **Edge cache** — static assets cached 1 year; HTML cached 5 minutes.

### 10.3 Render-Cost Transparency

Every effect page surfaces render cost (see §3.2 Performance table). This metadata is computed at build time by:

1. Parsing each effect's CSS via `lightningcss`.
2. Detecting animated properties (`transform`, `opacity` → compositor; `box-shadow`, `color` → paint; `width`, `top` → layout).
3. Estimating `bundleBytes` via `gzip` of the effect's CSS string.

### 10.4 Monitoring

- **Lighthouse CI** runs on every PR; budget regressions block merge.
- **Real User Monitoring** via a privacy-preserving beacon (no cookies) — p75 LCP, p75 INP, p75 CLS reported to Grafana.
- **Bundle analyzer** visualized at `/docs/internals/bundle` (public, for transparency).

---

## 11. Accessibility

### 11.1 Standards

- **WCAG 2.1 AA** for all pages, including color contrast, focus visibility, and text resizing.
- **WCAG 2.1 AAA** target for body text contrast (7:1) where the design permits.
- **WAI-ARIA Authoring Practices** for all interactive widgets (search modal, tabs, explorers).
- **Section 508** and **EN 301 549** compliance via the above.

### 11.2 Per-Effect Accessibility Notes

Every effect page documents:

- `prefers-reduced-motion` behavior — what happens when the user opts out.
- Flash safety — effects flashing >3 Hz are flagged "not photosensitive-safe".
- Screen reader impact — whether the effect is decorative or affects semantics.
- Keyboard operability — whether the effect interferes with focus rings.
- Color contrast — whether the effect changes contrast on default surfaces.

Effects that violate any rule carry a warning badge in the explorer and detail page.

### 11.3 Site-Wide Accessibility Features

- **Skip to content** link on every page (first focusable element).
- **Focus ring** — always visible, OKLCH primary, 3px outline offset.
- **Live region** — announces search result counts, copy confirmations, theme changes.
- **Reduced motion site-wide** — when `prefers-reduced-motion: reduce`, all preview tiles render static; previews show a play button instead of auto-playing.
- **High contrast mode** — `prefers-contrast: high` swaps tokens to maximize contrast.
- **Screen reader testing** — automated via axe-core in CI; manual NVDA + VoiceOver + JAWS audits each release.
- **Keyboard trap audit** — every modal, drawer, and dialog traps focus correctly and restores focus on close.

### 11.4 Cognitive Accessibility

- Plain-language summaries at the top of every concept page (≤ 8th-grade reading level).
- Consistent navigation — same shell, same shortcuts, same patterns everywhere.
- No surprise motion — previews play only on user interaction or hover, never on scroll-into-view (except explorer tiles, which pause when off-screen).
- Predictable copy actions — every code block has the same action bar in the same order.

---

## 12. Implementation Roadmap

### 12.1 Phases

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| **P1 — Foundation** | 1–3 | Next.js app shell, design tokens, theme switcher, sidebar, top bar, version selector stub |
| **P2 — Effect Pages** | 4–6 | Effect detail page, live preview, copy actions, framework tabs, accessibility/performance tables |
| **P3 — Explorers** | 7–9 | Component Explorer, Utility Explorer, keyboard navigation, infinite scroll |
| **P4 — Search** | 10–12 | MiniSearch lexical index, vector embeddings, Cmd+K modal, reciprocal rank fusion |
| **P5 — Playground** | 13–15 | Monaco editor, live preview, share-URL encoding, color customizer |
| **P6 — AI** | 16–18 | Prompt library, intent classification, snippet generation, validator, AI-in-search |
| **P7 — Migration** | 19–20 | Animate.css / Tailwind / Bootstrap mapping tables, codemod, AI paste-migrate |
| **P8 — Versioning** | 21–22 | Versioned builds, changelog generation, RSS, deprecation banners |
| **P9 — Polish** | 23–24 | Lighthouse 98+ on every route, a11y audit, RUM, public roadmap page |

### 12.2 Public Milestones

The `/docs/roadmap` page exposes milestones with status (`planned`, `in-progress`, `shipped`, `deferred`):

- **Q1:** Foundation + Effect Pages (P1–P2) — "Every effect documented"
- **Q2:** Explorers + Search (P3–P4) — "Every effect discoverable in <30s"
- **Q3:** Playground + AI (P5–P6) — "Every effect composable via prompt"
- **Q4:** Migration + Versioning + Polish (P7–P9) — "Every framework migratable"

Each milestone links to a GitHub Project board; users can subscribe to milestones for notifications.

### 12.3 Definition of Done

A phase ships only when:

- ✅ Lighthouse ≥ 98 on all new routes.
- ✅ axe-core reports zero violations.
- ✅ Keyboard-only walkthrough passes (no mouse used).
- ✅ Screen reader walkthrough passes (NVDA + VoiceOver).
- ✅ Bundle budgets respected (see §10.1).
- ✅ Docs for the new feature exist and are reviewed.
- ✅ Public changelog entry merged.

### 12.4 Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Vector embeddings too heavy at runtime | Medium | Binary format + lazy load; fall back to lexical-only on slow devices |
| Monaco editor bloats Playground bundle | High | Load Monaco from CDN; ship a CodeMirror fallback for low-end devices |
| AI generation cost | Medium | Aggressive caching of common prompts; rate-limit anonymous tier |
| Version sprawl (10+ versions) | Low | Hard cap supported versions to latest 3; older versions are read-only |
| Effect preview flicker on theme switch | Medium | All previews use CSS custom properties; theme switch is one class swap |

---

## Appendix A: Tech Stack

- **Framework:** Next.js (App Router, RSC) on Node 20+
- **Styling:** Native CSS + `@layer`, RoyCSS tokens, no CSS-in-JS
- **Search:** MiniSearch (lexical) + Transformers.js MiniLM (vector)
- **Editor:** Monaco (CDN) with CodeMirror fallback
- **Markdown:** MDX with remark/rehype plugins
- **Icons:** Lucide (tree-shaken)
- **Hosting:** Caddy (HTTP/3, Brotli) + Cloudflare CDN
- **CI:** GitHub Actions (lint → test → build → Lighthouse → deploy)
- **Analytics:** Plausible (privacy-preserving, no cookies)

## Appendix B: File Layout

```
apps/docs/
├── app/
│   ├── (site)/
│   │   ├── layout.tsx              ← global shell
│   │   ├── page.tsx                ← landing
│   │   ├── docs/
│   │   │   ├── layout.tsx          ← docs sidebar
│   │   │   ├── getting-started/
│   │   │   ├── concepts/
│   │   │   ├── effects/[category]/[slug]/page.tsx
│   │   │   ├── explorer/
│   │   │   │   ├── components/page.tsx
│   │   │   │   └── utilities/page.tsx
│   │   │   ├── api/[type]/[name]/page.tsx
│   │   │   ├── migration/[from]/page.tsx
│   │   │   ├── roadmap/page.tsx
│   │   │   └── changelog/page.tsx
│   │   └── ai/page.tsx             ← AI playground
│   ├── api/
│   │   ├── search/route.ts         ← optional server search
│   │   ├── ai/generate/route.ts
│   │   └── migrate/route.ts
│   └── v[version]/                 ← versioned snapshots
├── components/
│   ├── shell/                      ← TopBar, Sidebar, RightRail
│   ├── search/                     ← SearchModal, useSearch
│   ├── effect/                     ← EffectDetail, LivePreview, CodeTabs
│   ├── explorer/                   ← ComponentExplorer, UtilityExplorer
│   ├── playground/                 ← MonacoEditor, PreviewFrame
│   ├── ai/                         ← PromptLibrary, SnippetGenerator
│   └── ui/                         ← shared primitives
├── lib/
│   ├── effects-data.ts             ← compiled effect metadata
│   ├── search-index.ts             ← MiniSearch + embeddings loader
│   ├── codegen/                    ← framework snippet generators
│   └── analytics.ts                ← Plausible + RUM beacon
├── content/                        ← MDX for prose pages
├── public/
│   ├── search/
│   │   ├── search-index.json
│   │   └── embeddings.bin
│   └── versions/                   ← versioned static snapshots
└── scripts/
    ├── build-search-index.ts
    ├── build-embeddings.ts
    └── compute-render-cost.ts
```

---

*This document is the canonical specification for the RoyCSS documentation site. All implementation PRs must reference the section they implement. Last updated: RoyCSS v1.0.0.*
