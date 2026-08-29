# RoyCSS — First-Principles Redesign

**Status:** Authoritative design thesis · **Version:** 3.0-draft · **Date:** 2026-01
**Author:** First-Principles Redesign Panel (10 experts)
**Audience:** RoyCSS maintainers, framework architects, and the next decade of CSS authors
**Companion to:** `ARCHITECTURE.md`, `ROYCSS-V2-BLUEPRINT.md`, `50-ORIGINAL-FEATURES.md`, `COMPETITIVE-ANALYSIS.md`

> **Thesis.** RoyCSS V1 was an effects library (700+ effects, OKLCH tokens, framework-agnostic). RoyCSS V2 (per the Blueprint) became a 30-package monorepo with headless components, an AI CLI, and RUM. Both iterations are *accretive* — they add more on top of conventions inherited from Tailwind (utility-first), Bootstrap (component-first), Radix (headless), and Material (tokens). This document rejects accretion. It asks: **if CSS, browsers, developer tools, and AI assistants all evolved into their 2026 forms, what would a framework look like if we designed it from zero?** The answer is not "more effects" or "more packages." It is a fundamentally different contract between author, browser, and machine.

---

## Part 1 — First Principles (10 Expert Perspectives)

Each panel member was asked one question: *what must RoyCSS get right from first principles, and which inherited convention should we reject?* Their answers follow.

### 1. CSS Working Group member — *What CSS capabilities are we underusing?*

Frameworks still behave as if the platform is broken. It is not. As of 2026, every evergreen browser ships: `oklch()` and `oklab()`, `color-mix()` and relative color syntax (`oklch(from var(--brand) l c h / 0.5)`), native CSS Nesting, `:has()`, `:where()`, container queries (size *and* style), `@property` with typed custom properties, `@layer`, `@scope`, `@starting-style`, `light-dark()`, CSS Anchor Positioning (`anchor()`, `position-area`), the Popover API (`popover` attribute, `popovertarget`), View Transitions (cross-document in Chrome 126+, in-progress elsewhere), scroll-driven animations (`animation-timeline: view()`, `scroll()`), CSS trigonometric functions (`sin()`, `cos()`, `tan()`, `atan2()`), `interpolate-size: allow-keywords` (animating to `height: auto`), `field-sizing: content`, and the structured `::view-transition-group()` pseudo-element tree. The Working Group has shipped more usable CSS in the last 36 months than in the previous decade.

RoyCSS V2 uses some of these. It underuses most. The real first principle: **a 2026 framework should not abstract over the platform; it should expose it.** Every "primitive" RoyCSS ships — popover, tooltip, dropdown, accordion, modal — should be a thin ergonomics layer over the native primitive (`popover`, `anchor()`, `<details>`, `<dialog>`), not a JS-driven reimplementation. Every "responsive" utility should be a container query, not a media query. Every animation should declare `animation-timeline` where possible. Every "dark mode" should be `light-dark()`, not a `[data-theme]` attribute toggle. Every overlay should be `position-area`, not JavaScript `getBoundingClientRect`.

The convention to reject: the "framework as polyfill" mindset. Polyfilling is now a niche concern; the platform caught up. The new framework's job is **curating the platform's surface** into coherent patterns, not replacing it.

### 2. Tailwind CSS creator — *What's wrong with utility-first as it exists?*

I built Tailwind to remove context-switching between markup and stylesheet. That trade-off — class verbosity in exchange for authoring speed — was correct in 2017 and is still correct in 2026 for many use cases. But utility-first has three structural failures the industry has not addressed.

First, **class lists are not refactorable.** A 25-utility class string cannot be "extracted" into a reusable component without copying the string or moving to a CSS-in-JS layer. The result is either duplication or framework escape hatches (`@apply`, `cva`, recipes). Second, **utilities do not compose semantically.** `flex items-center gap-4` means nothing to a designer, a recruiter, or an AI assistant. The semantic gap forces every team to invent its own component layer on top — defeating the "no components" purity. Third, **AI assistants write terrible Tailwind.** LLMs emit 30-class strings that work but are unreadable, unmaintainable, and unreviewable. The utility-first DX that was great for humans is hostile to AI pair-programming.

The first principle RoyCSS must adopt: **the unit of styling should be intent, not property.** Intent is what humans think in ("a primary button, large, with a subtle press animation"), what designers spec, and what AI assistants can generate deterministically. Properties are the compiler's concern. A 2026 framework should let authors write `r-btn:primary:lg` (intent) and have a build-time compiler emit the equivalent utility string — invisible to the author, optimizable, refactorable. Utilities become an intermediate representation, not an authoring surface.

### 3. Bootstrap creator — *What's wrong with component-first as it exists?*

Bootstrap shipped components because, in 2011, jQuery-era developers wanted a navbar they could paste in. That was right then. Component-first as it exists now has two fatal flaws.

First, **components bake in visual opinions that age.** Bootstrap 3's gradients, Bootstrap 4's flat surfaces, Bootstrap 5's revised shadows — every version looks dated within four years because the *component* is the unit of styling. You cannot update Bootstrap's navbar without rewriting it; you cannot theme it without fighting it. Second, **components are coupled to markup structure.** Bootstrap's `.card` requires `.card-body` requires `.card-title`. Change the structure and the component breaks. This couples design to DOM in a way that blocks semantic HTML evolution.

The first principle: **components are not the right unit.** The right unit is the *pattern* — a named, intent-declared composition of tokens, motion, and accessibility behavior that compiles to whatever DOM the author chooses. `<Card variant="premium">` is not a component; it is a *pattern contract* that says "this region is a premium-tier card; apply premium tokens, lift-on-hover motion, and ARIA `role="region"` with an accessible name." Whether the author renders `<div>`, `<article>`, or a custom element is their concern. RoyCSS must ship *patterns*, not components — and patterns must be AI-authorable, version-controlled, and design-token-addressable.

### 4. Apple Human Interface designer — *What's wrong with motion in CSS frameworks?*

Motion in CSS frameworks is broken in three ways nobody talks about.

First, **easings are cargo-culted.** Every framework ships `ease-in`, `ease-out`, `ease-in-out`, maybe a `cubic-bezier(0.4, 0, 0.2, 1)`. These curves are not designed for *feel*; they are inherited from CSS defaults and Material motion specs. Apple's spring curves, by contrast, are derived from physics — mass, stiffness, damping — and they *feel* like the gesture that triggered them. A button press should bounce differently from a drawer settling. No framework ships this. Second, **motion is decorative, not informative.** Frameworks ship "fade-in-up" as an entrance effect. Apple uses motion to *explain* where an element came from and where it went — shared element transitions, gesture-driven reveals, parallax that responds to scroll velocity. CSS frameworks treat motion as garnish. Third, **reduced-motion is a fallback, not a first-class variant.** Every animation in a CSS framework has a "reduced motion" version that is just… the animation turned off. That is not accessibility; that is erasure. Reduced-motion users still benefit from informative motion — just shorter, simpler, less vestibularly provocative.

The first principle: **motion is intent, expressed in physics.** RoyCSS must declare `intent: "drawer-settle"` and compile to a spring curve with parameters tuned for a drawer. Reduced-motion is not "off"; it is a different intent — `intent: "drawer-settle/reduced"` — that compresses the spring, removes parallax, and keeps the directional cue. Motion declarations without an intent name should be a build warning. Motion without a reduced variant should be a build error.

### 5. Google Material Design engineer — *What's wrong with theming systems?*

Theming systems in CSS frameworks are flat. They expose `--color-primary`, `--color-secondary`, maybe a `--color-surface`. This was adequate when themes were "light" and "dark." It is inadequate in 2026, when products ship:

- **Multi-brand theming** (white-label SaaS where each tenant has its own brand).
- **Dynamic color** (Material You pulls a palette from the user's wallpaper; iOS 18 adapts to the user's tinted icon color).
- **Contextual theming** (a health app's "focus mode" shifts saturation; an enterprise dashboard's "high-density" mode shifts spacing and color simultaneously).
- **Per-component theming** (a single page might have a primary button, a destructive button, and a "marketing-only" gold button — each with its own complete token set).

Flat token systems cannot express any of this. The convention to reject: the `--color-primary` flat namespace. The first principle: **themes are typed, composable, and contextual.** A theme is a typed object with required slots (brand, surface, text, motion, density), composable with other themes (a base theme + a "marketing" overlay + a "high-contrast" overlay), and contextual (a theme can be scoped to a container, not just the document). RoyCSS must treat themes as first-class typed values, not as a flat CSS-variable namespace. Theme composition should be algebraic: `theme.marketing ∘ theme.high-contrast` produces a derived theme with provable contrast properties.

### 6. Microsoft Fluent Design engineer — *What's wrong with cross-platform CSS?*

CSS frameworks pretend the web is the only surface. Fluent ships to Windows native (WinUI), macOS (via Catalyst and AppKit), iOS, Android, and the web. We learned the hard way: a "design system" that lives only in CSS is not a design system — it is a website. Real cross-platform design systems need tokens that emit to:

- **Web CSS** (CSS custom properties, OKLCH)
- **iOS** (Swift `Color`, `cgFloat`, dynamic type)
- **Android** (Jetpack Compose `Color`, `Dp`, Material 3 tokens)
- **Windows** (XAML `StaticResource`, `AcrylicBrush`)
- **Figma** (Variables, Modes)
- **Flutter** (Material 3 `ColorScheme`)

Each platform has different color gamuts (DCI-P3 vs sRGB vs Display P3 on Apple), different density units (px vs pt vs dp vs sp vs DIP), different motion models (Core Animation vs Compose vs CSS), and different accessibility surfaces (VoiceOver vs TalkBack vs NVDA vs Switch Access). Every framework that ships "web-only tokens" forces the cross-platform team to manually translate, drift, and reconcile.

The first principle: **tokens are a single source of truth with platform-correct emission.** RoyCSS must define tokens once (in a typed, validated source format) and emit platform-correct artifacts. The web emission is one output among many. Gamut mapping happens at emission time (OKLCH → sRGB fallback for old browsers, OKLCH → Display P3 for modern Apple, OKLCH → DCI-P3 for HDR-capable Android). The convention to reject: the assumption that "cross-platform" means "React + React Native." It does not. It means "any combination of surfaces, each with its own correct primitives."

### 7. Staff Frontend Engineer — *What's wrong with DX in CSS frameworks?*

I build real apps. My DX pain with CSS frameworks is not "I can't find the right class." It is, in order of weekly time cost:

1. **Bundle size regressions** — someone adds a component, CSS jumps 12 KB, no one notices until staging.
2. **SSR hydration mismatches** — the server rendered with theme A, the client hydrated with theme B, the page flashed.
3. **Cascade conflicts** — a third-party widget's CSS leaks into my component, or vice versa, and I spend two hours finding the cause.
4. **AI assistant output** — Copilot suggests a 40-class Tailwind string. It works. It is unreviewable. Six months later, no one knows what it does.
5. **Type safety** — `cn("p-4", maybeWrongClass)` is `string`. TypeScript cannot help me. The bug surfaces at runtime.
6. **Version churn** — Tailwind v3 → v4 broke `@apply` semantics. MUI v5 → v6 changed the styling engine. Every major version is a multi-week migration.
7. **Documentation rot** — the docs say to use class X. The codebase uses class Y. The PR that introduced Y did not update docs. Now I do not trust the docs.

The first principle: **DX is a measurable contract, not a feeling.** RoyCSS must ship with: per-route CSS budgets enforced in CI (regression = build failure); SSR-safe theme initialization (server and client compute the same theme, or the build fails); cascade isolation by default (every component is `@scope`-encapsulated, leakage is impossible); AI-assistant guidance (a `roycss.rules.md` file that LLMs read to produce deterministic, reviewable output); TypeScript types for every class, token, and variant; semver with a formal deprecation policy (deprecate in N, remove in N+2, codemod shipped at deprecation time); and docs generated from the source of truth (no separate docs site to drift).

### 8. Browser rendering engineer — *What's wrong with CSS performance guidance?*

Most CSS performance advice is cargo-culted. "Use `will-change: transform`" — only if you actually need a compositor layer; otherwise you are burning GPU memory. "Avoid `@media` queries" — irrelevant; media queries are free. "Use `transform` instead of `top`" — true for animation, irrelevant for static positioning. The real performance costs in 2026 are:

1. **Layout thrashing** from JS that reads then writes then reads then writes the DOM. No CSS framework detects this.
2. **Style recalc cascades** — a single `:has()` selector on `body` can force a full-document style recalc on every DOM mutation. No CSS framework warns about this.
3. **Paint complexity** — large box-shadows, backdrop-filters, and gradients are GPU-expensive. No CSS framework ships a paint-cost budget.
4. **Composite layer explosion** — too many `will-change` or `transform` layers exhaust GPU memory, especially on mid-range Android. No CSS framework counts layers.
5. **Font loading** — `@font-face` without `font-display: optional` causes FOIT or FOUT. No CSS framework enforces this.
6. **Container query over-subscription** — a container query on `body` cascades into every child. No CSS framework warns.
7. **Initial layout cost** — the CSS that loads on the first paint is the only CSS that matters for LCP. Most frameworks load too much.

The first principle: **performance is a build-time observable, not a runtime hope.** RoyCSS must ship a static analyzer that flags high-cost patterns at build time (a `:has()` selector on `body` is a warning; a `backdrop-filter` on a 2000px element is a warning; a `will-change` declaration not preceded by a transition is a warning). It must ship a runtime profiler that correlates layout-shift, long-paint, and style-recalc entries to specific RoyCSS rules. And it must enforce a per-route CSS budget — landing pages load 8 KB or fewer of CSS, or the build fails.

### 9. Design Systems Architect — *What's wrong with token systems?*

Token systems are too flat, too rigid, and too disconnected from governance.

**Too flat.** Tokens are `color.brand.500`. That tells me nothing about *when* to use this token. Is it for text? Backgrounds? Borders? Icons? "Brand 500" is a value, not a decision. Real design systems have *semantic* tokens (`color.action.primary.default`, `color.surface.raised`, `color.text.subtle`) layered over *primitive* tokens (`color.brand.500`). Most frameworks ship only primitives.

**Too rigid.** Tokens are static values. They cannot express "this token should be 4.5:1 contrast against the surface it sits on, regardless of the surface." They cannot express "this token's hue rotates with the user's brand color but its chroma is capped to keep contrast safe." They are variables, not formulas.

**Too disconnected from governance.** A design system in a real enterprise has versioned tokens, deprecation policies, migration paths, and audit trails. CSS frameworks ship a `tokens.css` file. There is no version. There is no diff. There is no rollback.

The first principle: **tokens are typed, algebraic, and governed.** Typed: every token has a kind (color, length, duration, easing, family, weight) and the type system enforces correct usage (you cannot assign a color token to a duration property). Algebraic: tokens can be defined as functions of other tokens (`--color-on-primary: contrast(min(4.5:1), var(--color-primary))`) — the value is computed, not hardcoded. Governed: tokens live in a versioned repository with semver, deprecation notices, and codemods. RoyCSS must ship a token compiler that statically checks all three properties.

### 10. Developer Experience researcher — *What's wrong with how developers learn CSS frameworks?*

I have watched 200 developers learn Tailwind, Bootstrap, and Material UI over the last five years. The pattern is universal:

1. **Day 1–3:** Excitement. They copy examples from the docs. Things work.
2. **Week 2:** They want to do something the docs do not cover. They search. They find a Stack Overflow answer from 2021 that uses v2 APIs. It does not work in v4.
3. **Month 2:** They have a working knowledge of the 20% of classes they use daily. They do not know the other 80% exist.
4. **Month 6:** A new teammate asks why they used class X. They do not remember. The class is now load-bearing. No one touches it.
5. **Year 2:** The framework releases a new major version. They spend two weeks migrating. They vow to write their own CSS next time.

The root cause is not bad docs (Tailwind's docs are excellent). It is that **learning a CSS framework is learning a vocabulary, and vocabulary learning is hostile to AI assistance.** When a developer asks an AI "how do I make a card with a hover effect," the AI responds with a class string. The developer copies it. They learn nothing. The class string works until it doesn't, and then they have no mental model to debug.

The first principle: **the framework should be learnable as concepts, not vocabulary.** RoyCSS should expose ~12 concepts (intent, tokens, motion, scope, layer, anchor, container, contrast, density, motion-variant, platform-emission, governance). Every class, every API, every docs page maps to one of these concepts. A developer who understands the 12 concepts can use 100% of the framework. An AI assistant who understands the 12 concepts can generate any composition deterministically. The vocabulary is the compiler's concern.

---

## Part 2 — The Redesign: 15 Core Features

Each feature below is described against eight axes: problem, why existing frameworks fall short, how RoyCSS solves it, API design with code, performance implications, accessibility considerations, migration path, and long-term maintenance.

---

### Feature 1 — Intent-Class Compiler

**1. Problem.** Authors think in intent ("a primary button, large, with a press animation"). Frameworks force them to think in properties (`bg-blue-600 text-white px-6 py-3 rounded-lg active:scale-95`). The translation happens in the author's head, every time, for every element. AI assistants make this worse: they emit 30-class strings that work but are unreviewable.

**2. Why frameworks fall short.** Tailwind's utility-first is the most extreme case of property-thinking. Bootstrap's component classes (`btn btn-primary btn-lg`) are closer to intent but cannot express the motion, the press behavior, or the accessibility contract. Panda's `cva` recipes are intent-shaped but require a recipe definition per pattern. None of them separate *intent* (author-facing) from *properties* (compiler-emitted).

**3. How RoyCSS solves it.** RoyCSS introduces **intent classes** — a colon-separated syntax that names the pattern, the variant, and the modifier. The compiler turns intent classes into optimized property-level CSS at build time. Intent classes are the authoring surface; property CSS is an intermediate representation, never hand-edited.

```html
<!-- Author writes this -->
<button class="r-btn:primary:lg:press">Save</button>

<!-- Compiler emits this (never seen by author) -->
.r-btn\:primary\:lg\:press {
  background: var(--r-color-action-primary-default);
  color: var(--r-color-on-primary);
  padding: var(--r-space-4) var(--r-space-6);
  font-size: var(--r-font-size-lg);
  border-radius: var(--r-radius-md);
  transition: transform var(--r-dur-fast) var(--r-ease-press);
}
.r-btn\:primary\:lg\:press:active { transform: scale(0.96); }
```

**4. API design.** The intent grammar is `r-{pattern}:{variant}:{modifier}:{behavior}`. Patterns are finite (~50: `btn`, `card`, `input`, `nav`, `dialog`, `tabs`, etc.). Variants are pattern-specific (`primary`, `ghost`, `outline`, `destructive` for `btn`). Modifiers are cross-cutting (`sm`, `lg`, `compact`, `comfortable`). Behaviors are motion or interaction intents (`press`, `lift`, `settle`, `reveal`). The grammar is closed and lintable — invalid intent segments are build errors.

```html
<!-- Composition examples -->
<article class="r-card:premium:hover-lift">…</article>
<input class="r-input:outline:lg:error" />
<nav class="r-nav:sticky:glass">…</nav>
<button class="r-btn:ghost:destructive:press">Delete</button>
```

For programmatic composition (e.g., React props), RoyCSS exposes a typed helper:

```tsx
import { intent } from '@roycss/react';

<Button {...intent('btn', { variant: 'primary', size: 'lg', behavior: 'press' })} />
```

The `intent()` helper returns a stable class string and a TypeScript-typed props object. The compiler statically verifies that the intent resolves.

**5. Performance.** Build-time compilation produces the same output as hand-written utilities — no runtime cost. The compiler deduplicates: `r-btn:primary:lg:press` and `r-btn:primary:lg` share the base rule; only the `:active` differs. Per-route CSS extraction works the same as Tailwind v4 (scan source, emit used classes). Average emitted CSS for a landing page: 6–9 KB gzip, comparable to Tailwind.

**6. Accessibility.** Intent classes map to ARIA contracts. `r-btn:primary` always emits `role="button"` if applied to a non-button element, plus keyboard handler hooks. `r-input:error` emits `aria-invalid="true"` and binds to an error message container via `aria-describedby`. `r-nav:sticky` emits a `<nav>` landmark role if not already present. Accessibility is part of the intent contract, not an opt-in.

**7. Migration path.** From Tailwind: a codemod rewrites common class clusters into intent classes (`bg-blue-600 text-white px-4 py-2 rounded-lg` → `r-btn:primary`). From Bootstrap: a codemod maps `btn btn-primary btn-lg` → `r-btn:primary:lg`. The compiler still emits utility-equivalent CSS, so visual output is identical post-migration. Mixed usage is allowed during migration (intent classes and raw utilities coexist).

**8. Long-term maintenance.** Intent classes are versioned semantically. A pattern's intent grammar is its public API — adding a variant is a minor version; removing one is a major version with a codemod. The pattern catalog is a typed registry; community patterns follow the same contract. Because authors never write property CSS, the framework can refactor its emitted CSS freely between minor versions (e.g., switching from `transition` to `transition-behavior: allow-discrete` when browsers ship it) without breaking author code.

---

### Feature 2 — Living Palette System

**1. Problem.** A brand color is one OKLCH value. A theme needs 50+ derived tokens (primary, on-primary, primary-container, on-primary-container, surface variants, borders, focus rings, shadows, dark-mode counterparts) — all WCAG-compliant, perceptually uniform, and consistent across light/dark. Designers spend days generating these; engineers guess.

**2. Why frameworks fall short.** Tailwind ships a static palette (`blue-500` etc.) — no derivation, no contrast guarantees. Bootstrap ships CSS variables for `--bs-primary` but no derived scale. Material UI ships a theme generator, but it produces hex values and loses perceptual uniformity. None of them guarantee WCAG contrast at derivation time. None of them adapt dynamically to user preferences (tinted mode, focus mode, high-contrast).

**3. How RoyCSS solves it.** RoyCSS ships a **palette compiler** that takes a brand color (one OKLCH value) and emits a complete, contrast-verified token set. The compiler uses OKLCH perceptual uniformity to generate a 9-step lightness scale, derives semantic tokens with guaranteed WCAG 2.2 AA contrast (4.5:1 for text, 3:1 for UI), generates dark-mode counterparts with perceptually-matched contrast, and emits `@property`-registered custom properties with explicit types.

```css
/* Input — one line */
@roycss-brand: oklch(0.62 0.18 165);

/* Output — 60+ tokens, all contrast-verified */
@property --r-color-action-primary-default {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(0.62 0.18 165);
}
@property --r-color-on-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(0.98 0.01 165);  /* verified 7.2:1 against primary */
}
/* …58 more tokens, each contrast-verified at compile time */
```

**4. API design.** The palette is declared in `roycss.theme.toml`:

```toml
[brand]
color = "oklch(0.62 0.18 165)"   # the seed

[preferences]
contrast_target = "AA"            # AA (4.5:1) or AAA (7:1)
density = "comfortable"           # compact | comfortable | spacious
motion = "full"                   # full | reduced | minimal
tinted_mode = false               # Material You-style tinted surfaces

[overrides]
# Optional manual overrides — compiler verifies these still pass contrast
color.surface.raised = "oklch(0.98 0.005 165)"
```

The compiler emits `tokens.css` (CSS custom properties), `tokens.ios.swift`, `tokens.android.xml`, `tokens.figma.json`, and `tokens.types.ts` (TypeScript types for programmatic access). Themes compose: `theme.marketing ∘ theme.high-contrast` produces a derived theme.

At runtime, themes switch via `light-dark()` (no JS):

```css
:root {
  color-scheme: light dark;
  --r-color-surface-default: light-dark(
    oklch(0.99 0.005 165),    /* light */
    oklch(0.18 0.01 165)      /* dark — perceptually matched */
  );
}
```

**5. Performance.** Palette compilation is build-time only; runtime cost is zero. The emitted tokens are CSS custom properties — the browser resolves them natively, with no JS. Theme switching uses `color-scheme` + `light-dark()`, which the browser handles without reflow. Per-theme CSS file: ~3 KB gzip.

**6. Accessibility.** Contrast is verified at compile time — a token that fails WCAG is a build error, not a runtime bug. The compiler reports the failing pair, the computed ratio, and the nearest passing value. `prefers-contrast: more` is honored via a derived theme overlay. `prefers-color-scheme` is honored via `light-dark()`. Tinted mode (Material You-style) is opt-in and never reduces contrast below AA.

**7. Migration path.** From a Tailwind config: the codemod reads `colors.primary.500` from `tailwind.config.ts`, converts hex to OKLCH, and writes the brand seed. From Bootstrap: the codemod reads `$primary` from SCSS variables. From Material UI: the codemod reads `createTheme({ palette: { primary: { main } } })`. Existing custom CSS continues to work — RoyCSS tokens coexist with hand-authored CSS variables.

**8. Long-term maintenance.** The palette compiler's algorithm is versioned (`palette-alg-v1`, `palette-alg-v2`). A new algorithm ships as a major version; existing themes pin to the algorithm they were authored against. The token namespace (`--r-color-*`) is stable across algorithm versions — only the values change. Brand color changes are non-breaking: recompile, ship. WCAG 2.x → 3.x migration (when WCAG 3 ships) is a compiler flag, not a re-authoring exercise.

---

### Feature 3 — Cascade Constitution

**1. Problem.** `!important` wars, specificity escalation, layer-ordering disputes — every team that has worked with a CSS framework for two years hits these. The cascade is a powerful model, but it has no governance. Anyone can write a rule anywhere, and the framework cannot prevent it.

**2. Why frameworks fall short.** Tailwind ships `@layer base, components, utilities` but does not enforce it — a stray `!important` in your app CSS still wins. Bootstrap ships no layering. Material UI's `sx` prop and styled() escape hatch bypass any layering entirely. None of them make cascade conflicts *impossible* — they only make them *less likely*.

**3. How RoyCSS solves it.** RoyCSS ships a **cascade constitution** — a project-level file (`roycss.cascade.toml`) that declares the layer order, what kinds of rules may live in each layer, and what happens when a rule violates the constitution. The compiler enforces this at build time. A rule in the wrong layer is a build error. A `!important` in app CSS is a build error unless explicitly allowlisted.

```toml
# roycss.cascade.toml
[[layers]]
name = "reset"
order = 1
allows = ["element-selectors", "where-wrapping"]
disallows = ["class-selectors", "id-selectors", "important"]

[[layers]]
name = "tokens"
order = 2
allows = ["custom-property-declarations"]
disallows = ["any-property-other-than-custom"]

[[layers]]
name = "base"
order = 3
allows = ["element-selectors", "attribute-selectors"]
disallows = ["class-selectors", "important"]

[[layers]]
name = "patterns"
order = 4
allows = ["class-selectors-with-r-prefix", "where-wrapping"]
disallows = ["element-selectors", "important", "id-selectors"]

[[layers]]
name = "app"
order = 5
allows = ["class-selectors", "where-wrapping"]
disallows = ["important"]   # app CSS may not use !important — period

[[layers]]
name = "overrides"
order = 6
allows = ["class-selectors", "important"]
require_reason = true   # every !important requires a comment explaining why
```

**4. API design.** The constitution is a single file at project root. The compiler reads it, orders `@layer` declarations accordingly, and statically checks every authored CSS file against the rules. Violations surface as build errors with file:line:column and a remediation hint:

```
src/components/Card.module.css:14:3
error [cascade-constitution]: `!important` not allowed in @layer app
hint: move this rule to @layer overrides and add a `/* reason: */` comment
```

For escape hatches, RoyCSS supports a `@roycss-escape` annotation that allows a violation with a required reason:

```css
@roycss-escape important-in-app
/* reason: third-party widget requires override */
.card { z-index: 100 !important; }
```

The annotation is parsed at build time and surfaced in a "constitution violations" report. Teams review these in PR; the constitution file is versioned with semver.

**5. Performance.** Cascade layers are a browser-native feature — zero runtime cost. The compiler's static checks add ~50–100 ms to a typical build, dwarfed by Lightning CSS's other work. The runtime payoff is significant: pages with clean layer order have measurably faster style recalc (no specificity comparisons across layers).

**6. Accessibility.** The constitution can require that `:focus-visible` styles live in a specific layer with elevated priority — preventing the common bug where a `:hover` rule in app CSS accidentally overrides the focus ring. The constitution can also require that reduced-motion overrides live in a layer that wins over all animation declarations.

**7. Migration path.** The constitution is opt-in per route: a project can adopt it gradually. The codemod analyzes existing CSS, suggests a constitution, and reports violations without breaking the build (`strict: false` mode warns, `strict: true` mode fails). Existing Tailwind/Bootstrap projects get a constitution that matches their current behavior as a starting point.

**8. Long-term maintenance.** The constitution file is a contract. Changing it is a major version bump for the project (not for RoyCSS itself). RoyCSS ships a default constitution for new projects — opinionated, strict, and battle-tested. The default constitution's evolution is governed by RFC. Backward compatibility: a constitution file declares its schema version (`schema = 1`), and RoyCSS supports N-1 schemas indefinitely.

---

### Feature 4 — Anchor-First Overlay System

**1. Problem.** Popovers, tooltips, dropdowns, menus, comboboxes — every framework ships these, and every framework implements them with JavaScript. JS measures the trigger element, computes the overlay position, sets `top` and `left` on every scroll and resize, and falls back to "flip" logic when the overlay hits the viewport edge. This is ~5 KB of JS per overlay type, fragile, and inaccessible by default.

**2. Why frameworks fall short.** Floating UI (the de-facto standard) is excellent but is JS. Radix, Headless UI, Ariakit all use JS positioning. Bootstrap's Popper.js integration is JS. None of them use CSS Anchor Positioning, which shipped in Chrome 125 (2024) and is in development in Safari and Firefox. The platform solved this; frameworks have not caught up.

**3. How RoyCSS solves it.** RoyCSS's overlay system is **CSS Anchor Positioning first, JS only as a polyfill**. Authors declare an anchor and a target; the browser positions the target relative to the anchor, with built-in fallback (`@try` rules) for viewport collisions. The Popover API (`popover` attribute) handles layering, dismiss, and focus — no JS for behavior, no JS for positioning.

```html
<button popovertarget="user-menu" class="r-btn:ghost:sm">Menu</button>

<div id="user-menu" popover class="r-menu:default">
  <ul class="r-menu:list">
    <li><a class="r-menu:item" href="/profile">Profile</a></li>
    <li><a class="r-menu:item" href="/settings">Settings</a></li>
    <li><button class="r-menu:item:destructive">Sign out</button></li>
  </ul>
</div>

<style>
  #user-menu {
    anchor-name: --user-menu-anchor;
    position-area: block-start span-inline-end;
    margin: var(--r-space-2);
  }
  [popovertarget="user-menu"] {
    anchor-name: --user-menu-trigger;
  }
  #user-menu {
    position-anchor: --user-menu-trigger;
  }
  /* Fallback for viewport collisions */
  @position-try --menu-below {
    position-area: block-end span-inline-end;
  }
  #user-menu {
    position-try-fallbacks: --menu-below;
    position-try-order: most-height;
  }
</style>
```

**4. API design.** RoyCSS exposes overlay patterns as intent classes: `r-menu`, `r-tooltip`, `r-popover`, `r-dropdown`, `r-combobox`. Each pattern declares its anchor relationship declaratively. For authors who do not want to write CSS, a single data attribute handles everything:

```html
<button data-r-overlay="menu" data-r-overlay-pos="bottom-start">Open</button>
<div data-r-overlay-content class="r-menu:default">…</div>
```

The compiler emits the anchor CSS; a 1 KB runtime polyfill handles browsers without Anchor Positioning (Safari < 18, Firefox < 130). The polyfill is loaded conditionally via `@supports`:

```css
@supports not (anchor-name: --x) {
  /* Polyfill CSS + JS injection */
}
```

**5. Performance.** Native anchor positioning is GPU-composited and runs off the main thread. No scroll listeners, no resize listeners, no `requestAnimationFrame` loops. The polyfill runs only on unsupported browsers, and only when an overlay is open. Net JS cost on modern browsers: 0 bytes. Net JS cost on legacy: ~1.2 KB gzip per overlay type, loaded lazily.

**6. Accessibility.** The Popover API handles focus management, `Esc` to dismiss, click-outside-to-dismiss, and `aria-expanded`/`aria-haspopup` semantics — all natively. RoyCSS's overlay patterns declare the correct ARIA roles (`menu`, `menuitem`, `tooltip`, `listbox`, `option`) automatically. Keyboard navigation (arrow keys, home, end, type-ahead) is a RoyCSS intent behavior (`r-menu:arrow-nav`), implemented as a 200-byte event listener that delegates to the platform where possible.

**7. Migration path.** From Floating UI / Popper.js: the codemod rewrites `<FloatingPortal>` and `useFloating()` calls into Popover API + anchor CSS. From Bootstrap dropdowns: the codemod rewrites `data-bs-toggle="dropdown"` into `popovertarget`. From Radix: the codemod rewrites `<DropdownMenu>` into the RoyCSS equivalent. During migration, JS-driven overlays coexist with anchor-driven ones.

**8. Long-term maintenance.** As browser support for Anchor Positioning grows, the polyfill shrinks. By 2027, the polyfill is removed entirely (older browsers get a degraded but functional `position: absolute` experience). The intent API is stable; the implementation underneath evolves. New overlay patterns (e.g., `r-command-palette`) ship as new intent classes without breaking existing ones.

---

### Feature 5 — Scope-Encapsulated Components

**1. Problem.** CSS leaks. A `.card-title` rule in `Card.css` matches every `.card-title` in the app, including ones inside other components. BEM, CSS Modules, styled-components, CSS-in-JS — all are workarounds for the same root cause: CSS has no native scoping. Shadow DOM provides scoping but is heavy and breaks third-party CSS.

**2. Why frameworks fall short.** Tailwind's utility classes are global by design — leakage is a feature, not a bug, until it is. CSS Modules generate hashed class names, breaking the link between markup and style. styled-components and Emotion add runtime cost. Panda's static extraction is good but still requires a build step to enforce scoping. None of them use `@scope`, which shipped in all evergreen browsers in 2024.

**3. How RoyCSS solves it.** RoyCSS uses **`@scope` as its primary encapsulation primitive**. Every component's CSS is wrapped in a `@scope` block that limits its selectors to descendants of a specific root. No hashing, no runtime, no Shadow DOM. The browser enforces scoping natively.

```css
/* Card.css — authored */
@scope (.r-card) to (.r-card .r-card) {
  .title {
    font-size: var(--r-font-size-lg);
    font-weight: var(--r-font-weight-semibold);
  }
  .body { padding: var(--r-space-4); }
  .footer { border-top: 1px solid var(--r-color-border-subtle); }
}
```

The `to (.r-card .r-card)` clause is the "donut scope" — it prevents a `.r-card` rule from matching inside a nested `.r-card`. This is exactly the encapsulation developers have been simulating with BEM for 15 years, now native.

**4. API design.** RoyCSS's pattern files are authored as `@scope` blocks. The compiler wraps every pattern's CSS in a scope automatically; authors do not write `@scope` manually. For app CSS, RoyCSS provides a `scoped()` helper:

```css
/* App.css — authored */
@roycss-scoped(".user-profile") {
  .avatar { border-radius: 50%; }
  .name { font-weight: 600; }
}
```

The compiler expands this to:

```css
@scope (.user-profile) to (.user-profile .user-profile) {
  .avatar { border-radius: 50%; }
  .name { font-weight: 600; }
}
```

For React/Vue/Svelte, the `scoped` attribute on a `<style>` tag (Svelte has this; Vue has this) is mapped to RoyCSS's `@scope` emission. No new mental model — the framework harmonizes with what authors already know.

**5. Performance.** `@scope` is browser-native; zero runtime cost. Selectors inside a scope are matched only against the scoped subtree, which is faster than the equivalent global selector. The compiler's transformation is a one-line wrap — negligible build cost. Compared to CSS Modules, scope-encapsulated CSS has the same selector specificity as global CSS, so it composes correctly with framework utilities.

**6. Accessibility.** Scope does not affect ARIA semantics — the DOM is unchanged. Screen readers see the same tree. This is a significant advantage over Shadow DOM, which hides content from accessibility trees if misused. Scope is purely a CSS concern.

**7. Migration path.** From CSS Modules: the codemod rewrites `.card-title` (with `:global` and `:local` annotations) into `@scope (.card) { .title { … } }`. From BEM: the codemod rewrites `.card__title` into a `.title` inside a `@scope (.card)`. From styled-components: the codemod extracts CSS into `.css` files wrapped in `@scope`. Mixed usage is allowed during migration.

**8. Long-term maintenance.** `@scope` is a stable CSS feature — it will not change. The compiler's transformation is a one-time emission; no future maintenance burden. New CSS features (e.g., style queries, `@starting-style`) compose correctly inside `@scope` blocks. As more teams adopt `@scope`, RoyCSS's emission becomes indistinguishable from hand-authored modern CSS — the framework becomes invisible.

---

### Feature 6 — Physics-Based Motion Primitives

**1. Problem.** CSS animations use keyframes and cubic-bezier easings. These are *kinematic* — they describe motion as a function of time. Real motion is *dynamic* — it responds to forces. A drawer opened with a fast swipe should overshoot and settle; a drawer opened with a slow drag should follow the finger. CSS keyframes cannot express this. Spring-based motion libraries (Framer Motion, React Spring) can, but they are JS-driven and cost 15–40 KB.

**2. Why frameworks fall short.** Tailwind ships `transition` and `animate-*` utilities — keyframes only. Bootstrap ships `transition` utilities — keyframes only. Material UI's motion system is derived from Material's duration/easing tokens — kinematic. Framer Motion's springs are excellent but JS-only. None of them use `linear()` easing interpolation, which shipped in 2023 and lets CSS express spring curves as a series of linear segments — pure CSS, GPU-composited, zero JS.

**3. How RoyCSS solves it.** RoyCSS ships a **motion intent system**. Authors declare an intent (`drawer-settle`, `button-press`, `card-lift`, `toast-arrive`); the compiler emits a `linear()` easing curve tuned for that intent. Motion intents map to named spring systems with physical parameters (mass, stiffness, damping). Reduced-motion variants are mandatory and emitted alongside the full-motion variant.

```css
/* Authored — intent only */
.r-drawer { transition: transform var(--r-dur-drawer-settle) var(--r-ease-drawer-settle); }
.r-drawer:state(open) { transform: translateX(0); }

/* Compiler emits the linear() curve */
:root {
  --r-ease-drawer-settle: linear(
    0, 0.0036 1.23%, 0.0185 2.43%, 0.0489 3.66%, …
    /* 50 segments approximating a spring with m=1, k=180, c=22 */
  );
  --r-dur-drawer-settle: 460ms;

  /* Reduced-motion variant — compressed, no overshoot */
  @media (prefers-reduced-motion: reduce) {
    --r-ease-drawer-settle: ease-out;
    --r-dur-drawer-settle: 120ms;
  }
}
```

**4. API design.** Motion intents are declared in `roycss.motion.toml`:

```toml
[[motion]]
intent = "drawer-settle"
physics = { mass = 1.0, stiffness = 180, damping = 22 }
duration_cap = 600   # ms — clip long settle tails
reduced = { duration = 120, easing = "ease-out" }

[[motion]]
intent = "button-press"
physics = { mass = 0.5, stiffness = 800, damping = 30 }
reduced = { duration = 0 }   # instant — no motion for reduced

[[motion]]
intent = "card-lift"
physics = { mass = 0.8, stiffness = 240, damping = 26 }
reduced = { duration = 80, easing = "ease-out" }
```

The compiler emits `--r-ease-{intent}` and `--r-dur-{intent}` tokens for every entry. Authors use them via the `:behavior` segment in intent classes:

```html
<button class="r-btn:primary:lg:press">Save</button>
<!-- emits transition with --r-ease-button-press, --r-dur-button-press -->

<div class="r-drawer:settle">…</div>
<!-- emits transition with --r-ease-drawer-settle, --r-dur-drawer-settle -->
```

For gesture-driven motion (drawer follows finger), RoyCSS provides a 1 KB `useDragIntent()` hook that updates a CSS variable (`--drag-progress: 0.6`) on pointer move. The CSS uses the variable directly:

```css
.r-drawer { transform: translateX(calc(var(--drag-progress, 1) * -100%)); }
```

**5. Performance.** `linear()` curves are GPU-composited — the same codepath as cubic-bezier. No JS in the animation loop. The `useDragIntent()` hook uses pointer events and `requestAnimationFrame`, totaling ~1 KB. Compared to Framer Motion's 30 KB, RoyCSS's motion system is 30x smaller for the same feel.

**6. Accessibility.** Every motion intent requires a reduced variant in the config — missing it is a build error. Reduced variants do not simply turn motion off; they compress duration, remove overshoot, and preserve directional cues (a drawer still slides, just faster and without bounce). `prefers-reduced-motion: reduce` is honored via `@media`. `prefers-reduced-transparency` and `prefers-contrast: more` are also honored where they affect motion-related visual properties.

**7. Migration path.** From Framer Motion: the codemod reads `motion.div` declarations and maps `transition={{ type: "spring", stiffness: 180, damping: 22 }}` to a motion intent entry in `roycss.motion.toml`. From Tailwind's `transition-*` utilities: the codemod maps common patterns to intents. From CSS keyframes: the codemod suggests intent names based on the keyframe's shape. Hand-authored keyframes continue to work alongside intents.

**8. Long-term maintenance.** Motion intents are versioned. A change to an existing intent's physics is a major version (visual change). New intents are minor versions. The `linear()` curve generation algorithm is internal — authors specify physics, the compiler emits the curve. As browsers ship native spring easings (currently in CSS WG discussions), the compiler can switch emission without changing the author API.

---

### Feature 7 — View Transition Choreography

**1. Problem.** Single-page app route transitions are jarring. The old page disappears, the new page renders, the user's eye loses context. View Transitions API shipped in 2023, but it is imperative (`document.startViewTransition()`) and requires per-route glue code. Cross-document View Transitions (MPA) shipped in Chrome 126, but authoring the transition is still manual — name elements, write CSS, hope it works.

**2. Why frameworks fall short.** No framework treats View Transitions as a first-class routing primitive. Next.js has experimental support. Astro has a `<ViewTransitions />` component. SvelteKit has `onNavigate`. All are bolted on; none are declarative; none handle shared-element transitions elegantly.

**3. How RoyCSS solves it.** RoyCSS introduces **`vt-name` — a declarative attribute** that names elements for shared-element transitions across routes. The compiler wires up the View Transitions API automatically; the router integration is a thin adapter per framework.

```html
<!-- /products page -->
<article class="r-card:premium:hover-lift" vt-name="product-{{id}}">
  <img vt-name="product-image-{{id}}" src="…" />
  <h3 vt-name="product-title-{{id}}">Widget</h3>
</article>

<!-- /products/{{id}} page -->
<article class="r-product:detail">
  <img vt-name="product-image-{{id}}" src="…" />
  <h1 vt-name="product-title-{{id}}">Widget</h1>
</article>
```

When the user navigates from list to detail, the browser morphs the named elements across the transition. The `{{id}}` is a runtime parameter — RoyCSS's router adapter substitutes it before the transition starts.

**4. API design.** Authors add `vt-name` to any element that should participate in a transition. RoyCSS's framework adapter (`@roycss/next`, `@roycss/astro`, `@roycss/svelte`, etc.) wraps route changes in `document.startViewTransition()` and resolves `vt-name` template parameters. For MPA (cross-document), RoyCSS emits the `<meta name="view-transition" content="same-origin">` tag and uses the native MPA path.

For custom transitions, RoyCSS exposes a `vt()` directive:

```css
::view-transition-old(product-image-{{id}}) {
  animation: var(--r-vt-morph-old);
}
::view-transition-new(product-image-{{id}}) {
  animation: var(--r-vt-morph-new);
}
```

The `--r-vt-morph-*` tokens are motion-intent-addressable (`--r-vt-morph-old: var(--r-ease-card-morph)`).

**5. Performance.** View Transitions run on the compositor — no main-thread cost during the transition. The capture phase snapshots the old and new DOMs as images; the morph is GPU-composited. RoyCSS's adapter adds ~0.5 KB of router glue. The transition itself is free.

**6. Accessibility.** View Transitions can be disorienting for users with vestibular sensitivity. RoyCSS honors `prefers-reduced-motion: reduce` — when set, transitions fall back to a crossfade (the API supports this natively via `::view-transition-old(root)`). Authors can also declare a transition "essential" or "decorative" via `vt-essential="false"` — decorative transitions are skipped entirely under reduced motion.

**7. Migration path.** No codemod is possible (existing apps do not have `vt-name` attributes). RoyCSS provides a "transition audit" CLI command that scans routes and suggests `vt-name` placements. Adoption is incremental — one route at a time. Apps without View Transitions continue to work; the adapter is a no-op when no `vt-name` is present.

**8. Long-term maintenance.** `vt-name` is a RoyCSS attribute; the underlying View Transitions API is browser-native. As the API evolves (e.g., navigation-triggered transitions, shared elements across iframes), RoyCSS's adapter can adopt new features without changing the `vt-name` API. The motion-intent integration means transition feel is tunable without touching app code.

---

### Feature 8 — Build-Time Accessibility Constitution

**1. Problem.** Accessibility is enforced by audits — axe-core in CI, manual screen-reader testing, lawsuits after launch. By the time a contrast failure or missing focus style reaches CI, it has already been merged. The cost of fixing it is 10x the cost of preventing it.

**2. Why frameworks fall short.** axe-core is a runtime audit — it runs against a rendered DOM. Linters (eslint-plugin-jsx-a11y) catch some structural issues but not contrast. No framework makes accessibility a *build-time* concern. No framework fails the build when a token contrast fails, when an animation lacks a reduced variant, or when a focusable element has no `:focus-visible` style.

**3. How RoyCSS solves it.** RoyCSS ships an **accessibility constitution** — a build-time checker that fails the build for: WCAG 2.2 AA contrast failures on any token pair; missing `prefers-reduced-motion` variants for any animation declaration; missing `:focus-visible` styles for any focusable element pattern; missing `aria-label`/`aria-labelledby` on icon-only buttons; missing `alt` on images in patterns; insufficient touch target size (44×44 px minimum) on interactive patterns.

```toml
# roycss.a11y.toml
[contrast]
target = "AA"            # AA (4.5:1 text, 3:1 UI) or AAA (7:1 / 4.5:1)
check_tokens = true      # verify all token pairs
check_components = true  # verify rendered component pairs

[motion]
require_reduced_variant = true
require_intent_name = true

[focus]
require_focus_visible = true
min_contrast = 3.0       # focus ring against background

[touch_targets]
min_size_px = 44
check_patterns = ["btn", "nav", "menu", "tabs", "pagination"]

[icons]
require_label = true     # icon-only buttons must have aria-label
```

**4. API design.** The constitution runs as a compiler pass. Failures produce actionable errors:

```
error [a11y-contrast]: token --r-color-text-subtle on --r-color-surface-default
  computed: 3.8:1 (fails AA at 4.5:1)
  suggested: --r-color-text-subtle: oklch(0.45 0.01 165) → 4.6:1
  source: tokens.css:142

error [a11y-motion]: animation `card-press` has no reduced-motion variant
  source: roycss.motion.toml:23
  hint: add `reduced = { duration = 80 }` to the motion intent

error [a11y-focus]: pattern `r-btn:ghost` has no :focus-visible style
  source: patterns/btn.css:8
  hint: add `:focus-visible { outline: var(--r-focus-ring); }`
```

For "cannot fail the build" environments (legacy codebase onboarding), the constitution supports `strict: false` — warnings only, no build failure. The strictness is per-rule, so teams can ratchet up over time.

**5. Performance.** Build-time only; zero runtime cost. The contrast checker is OKLCH arithmetic — fast. A typical project's a11y check runs in <200 ms. The runtime payoff is significant: a11y bugs caught at build time never reach users.

**6. Accessibility.** This feature *is* accessibility. Beyond WCAG, the constitution can be extended to enforce: ARIA patterns (roving tabindex, `aria-activedescendant` for comboboxes), semantic HTML (button not `<div class="button">`), live regions for dynamic content, skip links, language attributes. The constitution is pluggable — third-party rules (e.g., a cognitive-load estimator) can be added.

**7. Migration path.** The constitution is opt-in per project. New projects get the strict default. Existing projects start with `strict: false`, fix violations at their own pace, then ratchet to strict. The codemod auto-fixes common violations (missing `:focus-visible`, missing reduced-motion variants). The compiler reports a "a11y debt" score per route, helping teams prioritize.

**8. Long-term maintenance.** The constitution's rules evolve with WCAG (2.2 → 3.0). The schema is versioned; new rules ship as opt-in initially, then as warnings, then as errors — a three-release deprecation cycle. The rule set is open — community rules can be published as npm packages and loaded into the constitution. RoyCSS maintains the canonical rule set; the community extends it.

---

### Feature 9 — Token Type System

**1. Problem.** CSS custom properties are untyped. `--space-4` can hold `"1rem"`, `"red"`, or `"banana"`. The browser does not care until it tries to use the value — then it silently falls back. TypeScript cannot help (CSS is not typed). Bugs from typos, unit mismatches, and theme drift surface only at runtime.

**2. Why frameworks fall short.** Tailwind's config is typed (TypeScript), but the emitted CSS is not. Panda CSS has typed tokens but only in JS context. StyleX has typed tokens but does not register `@property`. None of them use `@property` registration with `syntax` to enforce types at the CSS level. None of them statically verify that a color token is never assigned to a length property.

**3. How RoyCSS solves it.** RoyCSS ships a **token type system** built on `@property`. Every token is registered with a syntax (`<color>`, `<length>`, `<duration>`, `<easing-function>`, `<integer>`, etc.). The compiler statically checks every token usage in CSS — assigning a color token to a length property is a build error. TypeScript types are emitted for JS/TS consumers, so `style={{ color: tokens.color.primary }}` is type-checked.

```css
/* Authored — tokens declared with types */
@property --r-color-action-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(0.62 0.18 165);
}
@property --r-space-4 {
  syntax: "<length>";
  inherits: false;
  initial-value: 1rem;
}
@property --r-dur-fast {
  syntax: "<time>";
  inherits: false;
  initial-value: 150ms;
}
@property --r-ease-press {
  syntax: "<easing-function>";
  inherits: false;
  initial-value: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**4. API design.** Tokens are declared in `roycss.tokens.toml`:

```toml
[[color]]
name = "action-primary"
value = "oklch(0.62 0.18 165)"
inherits = true

[[length]]
name = "space-4"
value = "1rem"
inherits = false

[[time]]
name = "dur-fast"
value = "150ms"
inherits = false

[[easing]]
name = "ease-press"
value = "cubic-bezier(0.4, 0, 0.2, 1)"
inherits = false

[[font_family]]
name = "font-display"
value = '"Space Grotesk", system-ui'
inherits = true
```

The compiler emits:

- `tokens.css` — `@property` registrations + `:root` declarations
- `tokens.types.ts` — TypeScript types (`tokens.color.actionPrimary: ColorToken`, `tokens.space.s4: LengthToken`)
- `tokens.json` — W3C DTCG format for Figma / Style Dictionary
- `tokens.swift`, `tokens.android.xml`, `tokens.kotlin` — native platform tokens

Type-checking is enforced at three levels: CSS authoring (compiler pass), TS authoring (emitted types), and runtime (browser `@property` enforcement — invalid values fall back to `initial-value` with a console warning).

**5. Performance.** `@property` registration has a one-time parse cost (~1 ms per token). At runtime, typed tokens are slightly faster than untyped — the browser knows the value's type and skips inference. The compiler's type check runs in <100 ms for typical projects. The runtime payoff: no silent fallbacks, no contrast bugs from a typo like `--color-primary: 1rem`.

**6. Accessibility.** Typed tokens enable the accessibility constitution (Feature 8) to verify contrast — every `<color>` token is contrast-checked against every other `<color>` token it might pair with. Typed durations enable the motion constitution to verify reduced-motion variants. Types are the substrate that accessibility guarantees are built on.

**7. Migration path.** From Tailwind config: the codemod reads `theme.colors`, `theme.spacing`, etc., and emits token entries with inferred types. From Bootstrap SCSS: the codemod reads `$spacer`, `$colors`, etc. From Material UI theme: the codemod reads `palette`, `spacing`, `shape`. Existing CSS variables continue to work — untyped variables coexist with typed tokens; the type system is opt-in per token.

**8. Long-term maintenance.** The token type system is additive — adding a new type (e.g., `<gradient>` if CSS WG adds it) is a minor version. Removing a type is a major version (never happens in practice). Token names follow a strict namespace convention (`--r-{kind}-{role}-{variant}`); the linter enforces this. Renaming a token is a major version with a codemod.

---

### Feature 10 — Container-Adaptive Components

**1. Problem.** Responsive design is broken because it is viewport-driven. A `<Card>` in a 300px sidebar looks wrong; the same card in a 1200px main column looks different. Media queries (`@media (min-width: 768px)`) cannot help — they query the viewport, not the container. So developers write a card variant per layout context (`<Card variant="sidebar">`, `<Card variant="main">`), duplicating logic.

**2. Why frameworks fall short.** Tailwind ships container query utilities (`@container`), but components are not authored to be container-adaptive by default — authors opt in per component. Bootstrap, Material UI, MUI — none ship container-adaptive components. The mental model is still "responsive = viewport breakpoints."

**3. How RoyCSS solves it.** RoyCSS's pattern library is **container-adaptive by default**. Every pattern declares its container needs (min width, orientation, style) and adapts. The same `<Card>` rendered in a 280px sidebar shows a stacked layout; rendered in a 600px column shows a horizontal layout; rendered in a 1200px hero shows a feature layout. No variants, no props — the container drives.

```css
/* Card pattern — container-adaptive */
.r-card { container-type: inline-size; }

@container (width < 24rem) {
  .r-card .media { aspect-ratio: 16 / 9; }
  .r-card .body { padding: var(--r-space-3); }
  .r-card .title { font-size: var(--r-font-size-base); }
}

@container (width >= 24rem) and (width < 48rem) {
  .r-card { display: grid; grid-template-columns: 8rem 1fr; }
  .r-card .media { aspect-ratio: 1; }
}

@container (width >= 48rem) {
  .r-card { display: grid; grid-template-columns: 16rem 1fr; }
  .r-card .body { padding: var(--r-space-6); }
  .r-card .title { font-size: var(--r-font-size-xl); }
}
```

**4. API design.** Authors do not declare container queries — patterns ship with them. The intent class `r-card:premium` is container-adaptive by default. For custom container behavior, RoyCSS exposes a `@container` intent:

```html
<div class="r-container:sidebar">
  <article class="r-card:premium">…</article>
</div>
```

The compiler emits `container-type: inline-size` and a `container-name: sidebar`. The card pattern's `@container` rules reference the named container where appropriate.

For authors writing their own patterns, the `@roycss-container` directive declares needs:

```css
@roycss-pattern("my-card") {
  @roycss-container(min-width: 24rem) {
    /* horizontal layout */
  }
  @roycss-container(max-width: 24rem) {
    /* stacked layout */
  }
}
```

**5. Performance.** Container queries are browser-native; zero runtime cost. Style recalc on container resize is scoped to the container's subtree — cheaper than a media query that triggers a full-document recalc. The compiler emits only the queries actually used by the patterns in the project; unused queries are tree-shaken.

**6. Accessibility.** Container-adaptive components preserve ARIA semantics across layouts — a card is a card is a card, regardless of container. This is a significant accessibility win: screen reader users experience consistent semantics, even as the visual layout adapts. Touch targets remain 44×44 px minimum across all container sizes (enforced by the a11y constitution).

**7. Migration path.** From viewport-based media queries: the codemod rewrites `@media (min-width: 768px)` inside components into `@container (width >= 48rem)`. From Tailwind's `md:` variants: the codemod maps `md:` to `@container (width >= 48rem)` for component-scoped rules. During migration, viewport media queries still work — they are appropriate for page-level layout, just not for component internals.

**8. Long-term maintenance.** Container queries are stable CSS. RoyCSS's pattern library evolves its container breakpoints as new device sizes emerge (foldables, AR glasses) — patterns adopt new breakpoints without authors changing code. The `@roycss-container` directive's API is stable; new query types (e.g., `style()` queries for theme-aware containers) compose correctly.

---

### Feature 11 — CSS as Compilation Target (AI-Native)

**1. Problem.** AI assistants write CSS poorly. Given "make a premium fintech dashboard card with subtle glow," an LLM emits 40 lines of inline CSS or a 30-class Tailwind string. The output works once, is unmaintainable, and the LLM has no way to express design intent — it can only emit properties. The framework's vocabulary is too low-level for AI to produce good output deterministically.

**2. Why frameworks fall short.** Tailwind's utility vocabulary is large (hundreds of classes) — LLMs hallucinate non-existent classes. Bootstrap's component classes are finite but limited — LLMs cannot express novel compositions. Material UI's `sx` prop accepts arbitrary CSS — LLMs emit verbose inline styles. None of them give the LLM a *high-level intent vocabulary* that compiles down to optimized CSS.

**3. How RoyCSS solves it.** RoyCSS exposes an **intent-level natural language API** that LLMs can target. Authors (or AI assistants) describe intent in a structured natural language directive; the compiler resolves it to intent classes, tokens, and motion behaviors. The output is deterministic — same intent, same CSS, every time.

```html
<!-- Authored by AI assistant -->
<div data-r-intent="premium fintech dashboard card; subtle glow on hover; settle animation on mount">
  <h3>Revenue</h3>
  <p class="r-stat:positive-trend">$12.5k ↑ 12%</p>
</div>

<!-- Compiler resolves to -->
<div class="r-card:premium:hover-glow r-anim:settle">
  <h3 class="r-card:title">Revenue</h3>
  <p class="r-stat:positive-trend">$12.5k ↑ 12%</p>
</div>
```

**4. API design.** The natural-language API is exposed via:

1. **`data-r-intent` attribute** — for ad-hoc authoring (AI or human).
2. **`@roycss-intent` CSS directive** — for pattern-level intent.
3. **`roycss.intent()` CLI command** — for codegen ("generate a premium card component").
4. **`@roycss/ai` package** — for programmatic AI integration (Cursor, Copilot, Continue).

The compiler resolves intents against a fixed catalog of ~50 patterns, ~10 variants per pattern, ~8 modifiers, and ~20 behaviors. Resolution is deterministic — the catalog is versioned, and intent names map 1:1 to compiler outputs. LLMs are pointed at a `roycss.rules.md` file that describes the catalog; their output uses intent classes directly, not natural language.

```markdown
# roycss.rules.md (for AI assistants)

When the user asks for a "premium card with hover glow and settle animation,"
emit: <article class="r-card:premium:hover-glow r-anim:settle">…

Available patterns: btn, card, input, nav, dialog, tabs, menu, tooltip,
popover, dropdown, combobox, table, badge, avatar, alert, toast, progress,
skeleton, spinner, stat, chart, form, layout, sidebar, header, footer…

Variants: default, primary, ghost, outline, destructive, premium, glass,
neon, soft, strong…

Modifiers: sm, md, lg, compact, comfortable, spacious, dense…

Behaviors: press, lift, settle, reveal, glow, shimmer, shake, pop…
```

**5. Performance.** Intent resolution is build-time; zero runtime cost. The `data-r-intent` attribute is parsed at build, replaced with class names, and removed from the DOM. The `roycss.intent()` CLI produces the same output every time — cacheable, reproducible builds. AI assistants that target `roycss.rules.md` produce deterministic class strings — no hallucinated utilities.

**6. Accessibility.** The intent catalog encodes accessibility contracts. An AI assistant that emits `r-btn:primary` gets accessible focus styles, keyboard handling, and ARIA semantics for free. The intent "premium card with hover glow" includes a reduced-motion variant for the glow automatically. Accessibility is not something the AI has to remember; it is in the pattern.

**7. Migration path.** No migration needed — the AI-native API is additive. Existing hand-authored intent classes continue to work. The `roycss.rules.md` file is auto-generated from the pattern catalog; AI assistants read it on first project load. For teams without AI assistants, the natural-language directive (`data-r-intent`) is fully optional.

**8. Long-term maintenance.** The pattern catalog evolves; new patterns ship as minor versions. The `roycss.rules.md` file is the AI-facing API contract — its format is versioned and stable. As LLMs improve (better instruction following, longer context), the rules file can grow richer. The compiler's resolution algorithm is deterministic and versioned — same input + same compiler version = same output, forever.

---

### Feature 12 — Performance Observable Framework

**1. Problem.** Performance regressions are detected after launch — by RUM, by user complaints, by Lighthouse runs in CI against a single route. By then, the regression has shipped. No framework treats performance as a build-time and runtime observable that fails the build, alerts on regression, and attributes cost to specific rules.

**2. Why frameworks fall short.** Lighthouse CI runs against a snapshot — it does not catch regressions in PR. Web Vitals RUM collects field data — it does not attribute regressions to CSS rules. Bundle size limits (size-limit, bundlesize) catch JS regressions — CSS is often exempted. No framework ships `PerformanceObserver` instrumentation that correlates layout-shift, long-paint, and style-recalc entries to specific CSS rules.

**3. How RoyCSS solves it.** RoyCSS ships a **performance observability system** at three layers: (1) build-time static analysis flags high-cost patterns (a `:has()` selector on `body`, a `backdrop-filter` on a large element, a `will-change` without a transition); (2) runtime instrumentation in dev mode correlates PerformanceObserver entries to RoyCSS rules via source maps; (3) CI enforcement fails the build if LCP/CLS/INP budgets regress on any route.

```toml
# roycss.perf.toml
[budgets]
landing_css_kb = 8
route_css_kb = 30
total_js_kb = 50   # including RoyCSS runtime if used

[web_vitals]
lcp_ms = 2500
cls = 0.1
inp_ms = 200
tbt_ms = 200

[static_analysis]
warn_has_on_body = true
warn_backdrop_filter_large = true   # > 100,000 px²
warn_will_change_without_transition = true
warn_nth_child_deep = true          # depth > 3
warn_universal_selector = true      # *
```

**4. API design.** Three integration points:

```bash
# Build-time check
roycss perf:check
# → emits warnings/errors for static analysis rules

# Runtime dev-mode overlay
roycss perf:overlay
# → injects a PerformanceObserver-based overlay in dev:
#   - red flashes on layout shifts (CLS > 0.05)
#   - yellow borders on long-paint elements (>50ms)
#   - hover any element to see its style-recalc cost

# CI enforcement
roycss perf:ci --budgets roycss.perf.toml
# → runs Playwright against every route, measures LCP/CLS/INP,
#   fails if any route exceeds budget or regresses from baseline
```

For source attribution, RoyCSS's dev runtime patches `PerformanceObserver` to capture the `long-animation-frame` entries, correlates them to DOM mutations, and walks back to the source CSS rule via source maps. The overlay shows: "this 80ms style recalc was caused by `:has(.active)` in `Nav.css:42`."

**5. Performance.** Build-time checks add ~150 ms to a typical build. Dev overlay adds ~2 KB of instrumentation, only loaded in dev. CI mode runs Playwright against rendered routes — typically 30–90 seconds for a 50-route app. The runtime payoff is significant: performance bugs are caught in PR, not in production.

**6. Accessibility.** Performance *is* accessibility — INP directly affects keyboard users and screen reader users. RoyCSS's perf budgets default to the "Good" Web Vitals thresholds, which are also the accessibility-acceptable thresholds. The static analysis warns on patterns that disproportionately affect low-end devices (older Android, budget Chromebooks) — the platforms where users with disabilities are over-represented.

**7. Migration path.** The performance system is opt-in per project. New projects get the strict defaults. Existing projects start with `warn` mode (no build failures), measure their baselines, then ratchet to `error` mode. The codemod does not exist — this is a process change, not a code change. RoyCSS provides a "perf debt" report to help teams prioritize.

**8. Long-term maintenance.** Performance budgets evolve with hardware. The defaults are reviewed annually; a "good" INP in 2026 may be "mediocre" in 2028. RoyCSS's budget schema is versioned. The static analysis rule set is open — community rules can be published. The runtime overlay's UI evolves with browser DevTools; the underlying instrumentation is stable (PerformanceObserver is a stable API).

---

### Feature 13 — Multi-Surface Token Emission

**1. Problem.** A design system is one set of decisions expressed on many surfaces. Web (CSS), iOS (Swift), Android (Compose), Figma (Variables), Windows (XAML), Flutter (Material 3). Today, these surfaces are maintained by hand — designers update Figma, engineers translate to each platform, drift is constant, audits are quarterly.

**2. Why frameworks fall short.** Style Dictionary is the de-facto token transform tool, but it is configuration-heavy and emits platform-specific formats with no semantic alignment. Tailwind emits only CSS. Bootstrap emits only CSS. Material UI emits only JS/CSS. None of them treat Figma as a first-class emission target. None of them handle gamut mapping (sRGB vs Display P3 vs DCI-P3) at emission time.

**3. How RoyCSS solves it.** RoyCSS ships a **token compiler with first-class multi-surface emission**. Tokens are declared once (in `roycss.tokens.toml`); the compiler emits platform-correct artifacts with gamut mapping, unit conversion, and semantic alignment. Figma Variables are a first-class emission target — designers see token changes in Figma within seconds of a PR merge.

```toml
# roycss.tokens.toml — single source of truth
[[color]]
name = "action-primary"
value = "oklch(0.62 0.18 165)"
gamut = "auto"   # auto | sRGB | display-p3 | dci-p3

[[length]]
name = "space-4"
value = "1rem"
platforms = { web = "1rem", ios = "16pt", android = "16dp", windows = "16px" }
```

**4. API design.** The compiler emits:

- `tokens.css` — `@property`-registered CSS custom properties (OKLCH with sRGB fallback)
- `tokens.ios.swift` — `extension Color { static let actionPrimary = Color(oklch: ...) }` with P3 gamut
- `tokens.android.kt` — `val Color.actionPrimary = Color(0xFF...)` with resource qualifier for P3
- `tokens.figma.json` — Figma Variables API payload with Modes (light/dark)
- `tokens.windows.xaml` — `<Color x:Key="ActionPrimary">#...</Color>` with P3 resource dictionary
- `tokens.flutter.dart` — `static const Color actionPrimary = Color(0xFF...)` with Material 3 `ColorScheme` integration
- `tokens.types.ts` — TypeScript types for web JS consumers

The compiler handles:

- **Gamut mapping** — OKLCH → sRGB fallback for old browsers; OKLCH → Display P3 for Apple platforms; OKLCH → DCI-P3 for HDR-capable Android.
- **Unit conversion** — `1rem` → `16pt` (iOS), `16dp` (Android), `16px` (Windows). Custom ratios per platform.
- **Semantic alignment** — a token named `action-primary` becomes `actionPrimary` (Swift), `action_primary` (Kotlin), `ActionPrimary` (XAML), `actionPrimary` (Dart).
- **Theme variants** — `light` and `dark` variants are emitted as Figma Modes, iOS `UIColor(dynamicProvider:)`, Android `values-night/`, Windows `ThemeResource`.

**5. Performance.** Compilation is build-time only; runtime cost is zero on every platform. The emitted tokens use platform-native primitives (CSS custom properties, Swift Color, Kotlin Color, XAML resources) — no abstraction layer. The Figma Variables payload is small (typically 5–20 KB JSON); the Figma plugin syncs on save.

**6. Accessibility.** Each platform's accessibility surface is honored natively: iOS gets `UIColor` with dynamic type support, Android gets `Color` with `themes.xml` night mode, Web gets `light-dark()` + `prefers-color-scheme`. Contrast is verified at emission — a token that fails WCAG on a platform's default background is a build error.

**7. Migration path.** From Style Dictionary: the codemod reads `tokens.json` (W3C DTCG format) and emits `roycss.tokens.toml`. From a Tailwind config: the codemod reads `theme.colors` and `theme.spacing`. From a Material UI theme: the codemod reads `palette` and `spacing`. Existing platform-specific token files are replaced by emitted artifacts — the source of truth moves to `roycss.tokens.toml`.

**8. Long-term maintenance.** The compiler's emission targets are pluggable — new platforms (e.g., a future SwiftUI-tokens target, a React Native Skia target) ship as minor versions. The token source format is stable; new token types (e.g., `<gradient>` if CSS WG adds it) are additive. The Figma plugin is maintained as a separate package; its API contract (the JSON payload shape) is versioned.

---

### Feature 14 — Self-Healing CSS Linter

**1. Problem.** CSS rots. A token is deprecated but still used in 200 places. A component is renamed but old class names linger. A contrast failure is introduced by a token override. An animation loses its reduced-motion variant during a refactor. No framework detects this continuously and suggests fixes.

**2. Why frameworks fall short.** Stylelint is rule-based but does not understand design tokens. eslint-plugin-css is structural but does not understand intent. Lighthouse audits at runtime but does not suggest fixes. No framework ships a linter that understands the framework's own contracts (intent, tokens, motion, a11y) and suggests actionable fixes.

**3. How RoyCSS solves it.** RoyCSS ships a **self-healing linter** that runs in IDE (LSP), in CI (CLI), and in a "doctor" mode (full-codebase audit). The linter understands the framework's contracts — it can suggest: "this class uses a deprecated token, replace with `--r-color-action-primary`"; "this animation lacks a reduced variant, add `@media (prefers-reduced-motion: reduce) { … }`"; "this contrast pair fails AA, suggested fix: `--r-color-text-subtle: oklch(0.45 0.01 165)`."

```bash
# Run the doctor
roycss doctor

# Output:
# Found 23 issues across 14 files:
#
# ⚠ 12 deprecated token usages (auto-fixable)
#   src/components/Header.css:14  --color-primary → --r-color-action-primary
#   src/components/Footer.css:8   --color-primary → --r-color-action-primary
#   ...
#
# ❌ 3 contrast failures (auto-fixable)
#   src/components/Button.css:22  --r-color-text-on-primary: 3.8:1 (needs 4.5:1)
#   Suggested: oklch(0.98 0.01 165) → 4.6:1
#
# ⚠ 5 animations missing reduced-motion variants (auto-fixable)
# ❌ 3 missing :focus-visible styles (manual review)
#
# Run `roycss doctor --fix` to apply 20 auto-fixable changes.
```

**4. API design.** Three integration points:

1. **IDE (LSP)** — `@roycss/vscode` extension shows inline diagnostics with quick-fixes (`Cmd+.`).
2. **CI (CLI)** — `roycss lint` runs in CI, fails on `error` rules, warns on `warn` rules.
3. **Doctor (full audit)** — `roycss doctor` produces a report with auto-fixable and manual-review items.

The linter's rules are categorized:

- **Token rules** — deprecated tokens, missing tokens, contrast failures, type mismatches.
- **Pattern rules** — deprecated classes, invalid intent segments, missing variants.
- **Motion rules** — missing reduced variants, missing intent names, overly long durations.
- **A11y rules** — missing focus styles, missing ARIA, insufficient touch targets.
- **Perf rules** — high-cost selectors, large box-shadows, will-change without transition.
- **Cascade rules** — constitution violations, layer misplacements, specificity bombs.

Every rule has a `fix` function — either a codemod (for structural fixes) or a suggestion (for semantic fixes requiring human judgment). Auto-fixable rules can be applied in batch via `--fix`.

**5. Performance.** IDE diagnostics run on file save, typically <50 ms per file. CI runs the full linter across the codebase, typically <2 seconds for a 1000-file project. Doctor mode runs all rules plus contrast checks, typically <10 seconds. The linter is built on a fast Rust-based CSS parser (via Lightning CSS bindings) — not regex.

**6. Accessibility.** The linter's a11y rules are the same as the build-time a11y constitution (Feature 8), but applied continuously. This catches regressions introduced by refactors — a developer who removes a `:focus-visible` style sees the error in their IDE immediately. The linter can also detect cognitive-load issues (excessive animation count per page, low text contrast in long-form content).

**7. Migration path.** The linter is opt-in per project. New projects get all rules enabled. Existing projects start with `warn` mode for all rules, then ratchet specific rules to `error`. The codemod auto-fixes common issues. The linter can be configured to ignore third-party CSS (e.g., a vendored Bootstrap file).

**8. Long-term maintenance.** Rules are versioned. New rules ship as opt-in for one minor version, then as `warn` for one minor version, then as `error`. Rule deprecation follows the same pattern. The rule API is open — community rules can be published as npm packages and loaded into the linter. The linter's fix functions are deterministic and idempotent — running twice produces the same output as running once.

---

### Feature 15 — Composable Effect Recipes

**1. Problem.** Effects are coupled to elements. A "card hover lift" is a class on a card. If the same lift feel is wanted on a button, the developer copies the CSS or extracts a utility — losing the semantic intent ("lift feel") and creating two sources of truth. There is no way to version, share, or compose effects as named, intent-bearing units.

**2. Why frameworks fall short.** Tailwind's utilities are property-level — they cannot express "this combination of properties is the lift feel." Bootstrap's effect classes are tied to components. Animate.css's classes are animation-only — no visual effects. None of them treat effects as versioned, composable, shareable units.

**3. How RoyCSS solves it.** RoyCSS introduces **effect recipes** — named, versioned compositions of motion + visual + accessibility behavior, addressable as a single intent. Recipes are first-class packages: `@roycss-recipe/card-press-feedback`, `@roycss-recipe/premium-glow`, `@roycss-recipe/drawer-settle`. Recipes compose: a card can apply `card-press-feedback` and `premium-glow` simultaneously, with the compiler resolving any conflicts.

```toml
# roycss.recipes.toml — project's recipe manifest
[[recipe]]
name = "card-press-feedback"
version = "1.2.0"
source = "@roycss-recipe/card-press-feedback"
applies_to = ["r-card"]

[[recipe]]
name = "premium-glow"
version = "1.0.0"
source = "@roycss-recipe/premium-glow"
applies_to = ["r-card", "r-btn"]

[[recipe]]
name = "drawer-settle"
version = "2.0.0"
source = "@roycss-recipe/drawer-settle"
applies_to = ["r-drawer"]
```

**4. API design.** Authors reference recipes by name in the `:behavior` segment:

```html
<article class="r-card:premium:card-press-feedback:premium-glow">…</article>
<div class="r-drawer:drawer-settle">…</div>
```

The compiler resolves the recipe to its constituent CSS (motion, visual, a11y) and emits it scoped to the element. Recipes are npm packages — installed via `npm install @roycss-recipe/premium-glow`, declared in `roycss.recipes.toml`. Recipe authors publish via the normal npm workflow.

For authors writing their own recipes:

```css
/* @roycss-recipe/premium-glow v1.0.0 */
@roycss-recipe("premium-glow") {
  intent = "glow";
  applies_to = ["r-card", "r-btn"];
  requires_motion = "premium-glow";

  :scope {
    box-shadow:
      0 0 0 1px var(--r-color-border-subtle),
      0 4px 24px -8px color-mix(in oklch, var(--r-color-action-primary) 30%, transparent);
    transition: box-shadow var(--r-dur-premium-glow) var(--r-ease-premium-glow);
  }
  :scope:hover {
    box-shadow:
      0 0 0 1px var(--r-color-action-primary),
      0 8px 36px -8px color-mix(in oklch, var(--r-color-action-primary) 50%, transparent);
  }
  @media (prefers-reduced-motion: reduce) {
    :scope { transition: none; }
  }
}
```

The recipe's `@roycss-recipe` block declares its contract: intent name, applicable patterns, required motion intents, and the CSS body. The compiler verifies the contract — a recipe that declares `requires_motion = "premium-glow"` but the project's `roycss.motion.toml` does not define that intent is a build error.

**5. Performance.** Recipes are compiled at build time; runtime cost is zero. The compiler deduplicates: if two recipes both emit `transition: box-shadow …`, only one rule is emitted. Recipes are tree-shaken — a recipe that is declared but never used in markup is removed from the build. Average recipe size: 200–500 bytes gzip.

**6. Accessibility.** Every recipe must declare its reduced-motion behavior — missing it is a build error. Recipes that affect visibility (e.g., a "fade-in" recipe) must declare their `prefers-reduced-motion` alternative (e.g., "appear instantly"). Recipes that affect color (e.g., a "glow" recipe) are contrast-checked — a glow that reduces text contrast below AA is a build error. Recipes can declare `a11y_considerations` (a human-readable comment) that the linter surfaces in IDE hovers.

**7. Migration path.** No migration needed — recipes are additive. Existing effects in RoyCSS V1 (the 700+ effect library) ship as a recipe pack (`@roycss-recipe/legacy-v1`), preserving backward compatibility. New projects start with a curated recipe set; teams add or remove recipes as needed. The recipe format is open — community recipes can be published without RoyCSS team involvement.

**8. Long-term maintenance.** Recipes are independently versioned via npm. A recipe's `1.x` is backward-compatible; `2.x` may change behavior. RoyCSS's compiler supports N-1 major versions of each recipe simultaneously — a project can pin `premium-glow@1.0.0` while other projects use `2.0.0`. The recipe registry (a `roycss-recipe` npm organization) is curated for quality but open for community submissions. Recipes that gain broad adoption can be "promoted" to the official `@roycss/recipe-*` namespace.

---

## Part 3 — The API

Five concrete API examples illustrate the redesign end-to-end. Each example is shown in three forms: HTML (vanilla), React/TSX, and the equivalent emitted CSS (compiler output). All examples assume the project has `roycss.theme.toml`, `roycss.tokens.toml`, `roycss.cascade.toml`, `roycss.a11y.toml`, `roycss.motion.toml`, and `roycss.recipes.toml` configured.

### Example A — A Button Component

**Intent:** a primary button, large, with a press animation, accessible focus ring, and reduced-motion variant.

```html
<!-- Vanilla HTML -->
<button class="r-btn:primary:lg:press">Save changes</button>
```

```tsx
// React
import { intent } from '@roycss/react';

function SaveButton() {
  return (
    <button {...intent('btn', { variant: 'primary', size: 'lg', behavior: 'press' })}>
      Save changes
    </button>
  );
}
```

```css
/* Compiler-emitted CSS (never hand-edited) */
@layer patterns {
  @scope (.r-btn) to (.r-btn .r-btn) {
    .r-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--r-space-2);
      font-family: var(--r-font-family-default);
      font-weight: var(--r-font-weight-medium);
      border-radius: var(--r-radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition:
        transform var(--r-dur-button-press) var(--r-ease-button-press),
        background-color var(--r-dur-fast) var(--r-ease-default),
        box-shadow var(--r-dur-fast) var(--r-ease-default);
    }
    .r-btn:active { transform: scale(0.96); }
    .r-btn:focus-visible {
      outline: 2px solid var(--r-color-action-primary);
      outline-offset: 2px;
    }
    .r-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Variant: primary */
    .r-btn[data-variant="primary"] {
      background: var(--r-color-action-primary-default);
      color: var(--r-color-on-primary);
    }
    .r-btn[data-variant="primary"]:hover {
      background: light-dark(
        oklch(from var(--r-color-action-primary-default) calc(l - 0.05) c h),
        oklch(from var(--r-color-action-primary-default) calc(l + 0.05) c h)
      );
    }

    /* Size: lg */
    .r-btn[data-size="lg"] {
      padding: var(--r-space-3) var(--r-space-6);
      font-size: var(--r-font-size-lg);
      min-height: 44px;  /* touch target */
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .r-btn { transition-duration: var(--r-dur-instant); }
      .r-btn:active { transform: none; }
    }
  }
}
```

The author wrote 1 attribute (`class="r-btn:primary:lg:press"`). The compiler emitted 30+ lines of CSS with: scope encapsulation, ARIA-compatible focus styles, light-dark variants, touch target sizing, and a reduced-motion variant — all from the intent.

### Example B — A Card with Animation

**Intent:** a premium-tier card with hover lift, settle animation on mount, and a glow recipe applied.

```html
<!-- Vanilla HTML -->
<article
  class="r-card:premium:hover-lift:settle:premium-glow"
  data-r-anim="settle"
>
  <img class="r-card:media" src="/widget.png" alt="Widget product photo" />
  <div class="r-card:body">
    <h3 class="r-card:title">Premium Widget</h3>
    <p class="r-card:description">Hand-finished. Lifetime warranty.</p>
    <button class="r-btn:primary:md:press">Buy — $89</button>
  </div>
</article>
```

```tsx
// React
import { intent, useReveal } from '@roycss/react';

function PremiumCard({ product }: { product: Product }) {
  const ref = useReveal<HTMLImageElement>('settle');
  return (
    <article
      className={intent('card', {
        variant: 'premium',
        behaviors: ['hover-lift', 'settle', 'premium-glow'],
      })}
    >
      <img ref={ref} className="r-card:media" src={product.image} alt={product.alt} />
      <div className="r-card:body">
        <h3 className="r-card:title">{product.name}</h3>
        <p className="r-card:description">{product.description}</p>
        <button className={intent('btn', { variant: 'primary', behavior: 'press' })}>
          Buy — ${product.price}
        </button>
      </div>
    </article>
  );
}
```

```css
/* Compiler-emitted CSS (abridged) */
@layer patterns {
  @scope (.r-card) to (.r-card .r-card) {
    .r-card {
      container-type: inline-size;
      background: var(--r-color-surface-raised);
      border: 1px solid var(--r-color-border-subtle);
      border-radius: var(--r-radius-lg);
      overflow: hidden;
      transition:
        transform var(--r-dur-card-lift) var(--r-ease-card-lift),
        box-shadow var(--r-dur-card-lift) var(--r-ease-card-lift);
    }
    .r-card[data-variant="premium"] {
      border-color: color-mix(in oklch, var(--r-color-action-primary) 30%, transparent);
      background: linear-gradient(
        135deg,
        var(--r-color-surface-raised),
        color-mix(in oklch, var(--r-color-action-primary) 5%, var(--r-color-surface-raised))
      );
    }
    .r-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--r-shadow-lg);
    }

    /* Behavior: settle (mount animation) */
    .r-card[data-behavior="settle"] {
      animation: var(--r-dur-card-settle) var(--r-ease-card-settle) both;
      animation-name: r-card-settle;
    }
    @keyframes r-card-settle {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Recipe: premium-glow */
    .r-card[data-recipe="premium-glow"] {
      box-shadow:
        0 0 0 1px color-mix(in oklch, var(--r-color-action-primary) 20%, transparent),
        0 4px 24px -8px color-mix(in oklch, var(--r-color-action-primary) 30%, transparent);
    }
    .r-card[data-recipe="premium-glow"]:hover {
      box-shadow:
        0 0 0 1px var(--r-color-action-primary),
        0 8px 36px -8px color-mix(in oklch, var(--r-color-action-primary) 50%, transparent);
    }

    /* Container-adaptive layout */
    @container (width < 24rem) {
      .r-card .body { padding: var(--r-space-3); }
    }
    @container (width >= 48rem) {
      .r-card { display: grid; grid-template-columns: 16rem 1fr; }
      .r-card .body { padding: var(--r-space-6); }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .r-card { transition: none; animation: none; }
      .r-card:hover { transform: none; }
    }
  }
}
```

### Example C — A Responsive Grid

**Intent:** a grid that auto-fits cards at a minimum 16rem width, with a 3-column layout at ≥48rem, and a single-column layout below 24rem — driven by container, not viewport.

```html
<!-- Vanilla HTML -->
<section class="r-grid:auto-fit:min(16rem,1fr):gap-4">
  <article class="r-card:default">…</article>
  <article class="r-card:default">…</article>
  <article class="r-card:default">…</article>
  <article class="r-card:default">…</article>
</section>
```

```tsx
// React
import { intent } from '@roycss/react';

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section
      className={intent('grid', {
        cols: 'auto-fit',
        minmax: '16rem',
        gap: 'md',
      })}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </section>
  );
}
```

```css
/* Compiler-emitted CSS */
@layer patterns {
  @scope (.r-grid) to (.r-grid .r-grid) {
    .r-grid {
      container-type: inline-size;
      display: grid;
      gap: var(--r-space-4);
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    }

    /* Container-adaptive refinement */
    @container (width >= 48rem) {
      .r-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @container (width < 24rem) {
      .r-grid { grid-template-columns: 1fr; }
    }

    /* Logical-property aware gap */
    .r-grid { column-gap: var(--r-space-4); row-gap: var(--r-space-4); }
    [dir="rtl"] .r-grid { /* already logical; no override needed */ }
  }
}
```

Note: the grid is container-adaptive. The same `<ProductGrid>` placed in a 600px sidebar shows 2 columns; placed in a 1400px main area shows 3 columns; placed in a 300px mobile drawer shows 1 column — without any prop changes.

### Example D — A Themed Dashboard

**Intent:** a dashboard with: a dark theme by default, a "comfortable" density, premium-tier stat cards, and a marketing-tier hero. The theme composes a base brand + a "high-contrast" overlay for users with `prefers-contrast: more`.

```tsx
// app/dashboard/layout.tsx (Next.js App Router)
import { ThemeProvider } from '@roycss/react';
import { intent } from '@roycss/react';
import './globals.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      brand={oklch(0.62, 0.18, 165)}
      density="comfortable"
      motion="full"
      defaultMode="dark"
      contrastOverlay="high-contrast"  // applied when prefers-contrast: more
    >
      <div className={intent('layout', { variant: 'dashboard' })}>
        <aside className={intent('sidebar', { variant: 'glass' })}>
          <Nav items={navItems} />
        </aside>
        <main className="r-layout:main">
          <section className={intent('hero', { variant: 'marketing' })}>
            <h1>Quarterly Performance</h1>
          </section>
          <section className="r-grid:auto-fit:min(20rem,1fr):gap-4">
            <StatCard label="Revenue" value="$12.5k" trend="+12%" tier="premium" />
            <StatCard label="Active Users" value="3,420" trend="+5%" tier="premium" />
            <StatCard label="Churn" value="2.1%" trend="-0.4%" tier="premium" />
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}
```

```css
/* Compiler-emitted tokens (abridged) */
:root {
  color-scheme: light dark;

  /* Brand-derived palette */
  --r-color-action-primary-default: oklch(0.62 0.18 165);
  --r-color-on-primary: oklch(0.98 0.01 165);
  --r-color-surface-default: light-dark(oklch(0.99 0.005 165), oklch(0.16 0.01 165));
  --r-color-surface-raised: light-dark(oklch(1 0 0), oklch(0.20 0.01 165));
  --r-color-text-default: light-dark(oklch(0.20 0.01 165), oklch(0.95 0.005 165));
  --r-color-text-subtle: light-dark(oklch(0.45 0.01 165), oklch(0.70 0.005 165));

  /* Density: comfortable */
  --r-space-1: 0.25rem;
  --r-space-2: 0.5rem;
  --r-space-3: 0.75rem;
  --r-space-4: 1rem;
  --r-space-6: 1.5rem;
  --r-space-8: 2rem;
}

/* High-contrast overlay (composed when prefers-contrast: more) */
@media (prefers-contrast: more) {
  :root {
    --r-color-text-subtle: light-dark(oklch(0.30 0.01 165), oklch(0.85 0.01 165));
    --r-color-border-subtle: light-dark(oklch(0.30 0 0), oklch(0.70 0 0));
    --r-color-action-primary-default: light-dark(oklch(0.50 0.20 165), oklch(0.70 0.20 165));
  }
}

/* Layout pattern */
@layer patterns {
  @scope (.r-layout) to (.r-layout .r-layout) {
    .r-layout[data-variant="dashboard"] {
      display: grid;
      grid-template-columns: 16rem 1fr;
      min-height: 100vh;
    }
    @container (width < 48rem) {
      .r-layout[data-variant="dashboard"] {
        grid-template-columns: 1fr;
      }
      .r-layout .sidebar { display: none; }  /* replaced by mobile nav */
    }
  }
}
```

The theme composition is algebraic: the `ThemeProvider` resolves `base.brand ∘ prefers-contrast.high-contrast` at runtime, with the contrast overlay redefining only the tokens that need strengthening. The same JSX renders correctly in default mode, dark mode, and high-contrast mode — no conditional rendering, no JS.

### Example E — An Accessible Form

**Intent:** a login form with: floating labels, inline validation, accessible error binding, autofill support, and a submit button that shows loading state. All accessibility built-in.

```tsx
// LoginForm.tsx
'use client';
import { useState } from 'react';
import { intent, useFormField } from '@roycss/react';

export function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const email = useFormField({ name: 'email', validate: validateEmail });
  const password = useFormField({ name: 'password', validate: validatePassword });

  return (
    <form
      className={intent('form', { variant: 'stacked', gap: 'md' })}
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const result = await login(email.value, password.value);
        setSubmitting(false);
        if (result.errors) setErrors(result.errors);
      }}
      noValidate  // RoyCSS handles validation feedback
    >
      <div className="r-form-field:floating-label">
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className={intent('input', {
            variant: 'outline',
            size: 'lg',
            error: !!errors.email,
          })}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          {...email}
        />
        <label htmlFor="email" className="r-form-field:label">Email</label>
        <p id="email-hint" className="r-form-field:hint">We'll never share your email.</p>
        {errors.email && (
          <p id="email-error" className="r-form-field:error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="r-form-field:floating-label">
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className={intent('input', {
            variant: 'outline',
            size: 'lg',
            error: !!errors.password,
          })}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
          {...password}
        />
        <label htmlFor="password" className="r-form-field:label">Password</label>
        <p id="password-hint" className="r-form-field:hint">Minimum 8 characters.</p>
        {errors.password && (
          <p id="password-error" className="r-form-field:error" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={intent('btn', { variant: 'primary', size: 'lg', behavior: 'press' })}
        aria-busy={submitting}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
```

```css
/* Compiler-emitted CSS (abridged) */
@layer patterns {
  @scope (.r-form-field) to (.r-form-field .r-form-field) {
    .r-form-field { position: relative; }

    /* Floating label */
    .r-form-field .r-form-field\:label {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--r-space-4);
      transform: translateY(-50%);
      transition:
        inset-block-start var(--r-dur-fast) var(--r-ease-default),
        font-size var(--r-dur-fast) var(--r-ease-default);
      pointer-events: none;
      color: var(--r-color-text-subtle);
    }
    .r-input:focus + .r-form-field\:label,
    .r-input:not(:placeholder-shown) + .r-form-field\:label {
      inset-block-start: 0;
      font-size: var(--r-font-size-xs);
      background: var(--r-color-surface-default);
      padding-inline: var(--r-space-1);
      color: var(--r-color-action-primary-default);
    }

    /* Error state */
    .r-input[aria-invalid="true"] {
      border-color: var(--r-color-danger-default);
    }
    .r-input[aria-invalid="true"]:focus-visible {
      outline-color: var(--r-color-danger-default);
    }
    .r-form-field\:error {
      color: var(--r-color-danger-default);
      font-size: var(--r-font-size-sm);
      margin-block-start: var(--r-space-1);
    }

    /* Touch target */
    .r-input { min-height: 44px; }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .r-form-field .r-form-field\:label { transition: none; }
    }
  }
}
```

Accessibility built into every layer: `aria-invalid` and `aria-describedby` bindings are part of the intent contract; `role="alert"` on error messages announces to screen readers; `aria-busy` on the submit button announces loading state; `autoComplete` attributes are required (the linter warns if missing); focus-visible styles are emitted automatically; touch targets meet 44 px minimum; reduced motion is honored.

---

## Part 4 — Prioritized Roadmap

The roadmap is divided into three tiers. **Must-have for v2** (ship Q1 2026) is the minimum viable redesign — enough to differentiate RoyCSS from every existing framework. **Nice-to-have for v2.x** (ship Q2–Q3 2026) is the layer that compounds the differentiation. **Long-term research for v3** (2027+) is the layer that ensures RoyCSS stays ahead for five years.

### Must-Have for v2 (Q1 2026)

These nine features are the redesign's spine. Without all nine, the redesign is incomplete.

1. **Intent-Class Compiler** (Feature 1) — the authoring surface. Ships with 50 patterns, 10 variants each, 8 modifiers, 20 behaviors. Tooling: VS Code LSP with autocomplete and inline preview. Codemods for Tailwind, Bootstrap, Material UI.

2. **Living Palette System** (Feature 2) — the theming substrate. Ships with: palette compiler (brand → 60+ tokens), WCAG 2.2 AA verification, `light-dark()` runtime, dark-mode counterpart generation, tinted mode opt-in. Three reference themes (Default, Tokyo, Nord).

3. **Cascade Constitution** (Feature 3) — the governance layer. Ships with a default constitution, build-time enforcement, `@roycss-escape` annotation, and `strict: false` mode for incremental adoption.

4. **Anchor-First Overlay System** (Feature 4) — the overlay primitives. Ships with: `r-menu`, `r-tooltip`, `r-popover`, `r-dropdown`, `r-combobox` patterns; Popover API + CSS Anchor Positioning by default; 1.2 KB polyfill for Safari < 18 and Firefox < 130.

5. **Scope-Encapsulated Components** (Feature 5) — the encapsulation primitive. All 50 patterns ship as `@scope` blocks. `@roycss-scoped()` helper for app CSS. Codemod from CSS Modules, BEM, styled-components.

6. **Physics-Based Motion Primitives** (Feature 6) — the motion system. Ships with 20 motion intents (`button-press`, `card-lift`, `drawer-settle`, `toast-arrive`, etc.), `linear()` curve emission, mandatory reduced variants, `useDragIntent()` hook for gesture-driven motion.

7. **Build-Time Accessibility Constitution** (Feature 8) — the a11y guarantee. Ships with: contrast checking, motion variant enforcement, focus-visible enforcement, touch target checking, ARIA pattern checks. `strict: false` for incremental adoption.

8. **Token Type System** (Feature 9) — the typed substrate. Every token is `@property`-registered. TypeScript types emitted. Compiler statically checks usage. W3C DTCG JSON emitted for tooling.

9. **Container-Adaptive Components** (Feature 10) — the layout primitive. All 50 patterns ship container-adaptive by default. `@roycss-container` directive for custom patterns. Codemod from viewport media queries.

**Bundle targets for v2:**
- Base CSS (`tokens.css` + `reset.css` + `base.css`): 4 KB gzip
- Per-pattern CSS (avg, with all variants): 1–2 KB gzip
- Per-route CSS (typical landing page): 8 KB gzip
- Per-route CSS (typical dashboard route): 18 KB gzip
- Runtime JS (only when used: drag-intent, polyfills): <2 KB gzip per feature
- AI assistant rules file (`roycss.rules.md`): <10 KB

**Team required for v2:**
- 1 lead architect
- 3 senior engineers (compiler, patterns, motion)
- 1 a11y specialist
- 1 DX researcher (running user studies during development)
- 1 technical writer (docs generated from source, but a writer curates)

**Risk:** the intent-class compiler is the keystone. If it ships late, the entire redesign slips. Mitigation: build the compiler first, ship a minimal pattern set (10 patterns) early, expand to 50 over the beta period.

### Nice-to-Have for v2.x (Q2–Q3 2026)

These six features compound the v2 spine. Each can ship independently; together they create a framework no competitor can match within 18 months.

10. **View Transition Choreography** (Feature 7) — `vt-name` attribute, router adapters for Next.js, Astro, SvelteKit, Remix, Nuxt. Cross-document MPA support. Motion-intent integration. Ships in v2.1 (Q2 2026).

11. **CSS as Compilation Target** (Feature 11) — `data-r-intent` directive, `roycss.intent()` CLI, `@roycss/ai` package for LLM integration. Auto-generated `roycss.rules.md`. Cursor / Copilot / Continue integrations. Ships in v2.2 (Q2 2026).

12. **Performance Observable Framework** (Feature 12) — `roycss perf:check`, `roycss perf:overlay`, `roycss perf:ci`. Playwright-based route testing. PerformanceObserver instrumentation with source-map attribution. Ships in v2.2 (Q2 2026).

13. **Multi-Surface Token Emission** (Feature 13) — `tokens.ios.swift`, `tokens.android.kt`, `tokens.figma.json`, `tokens.windows.xaml`, `tokens.flutter.dart`. Figma plugin for bi-directional sync. Gamut mapping (sRGB / Display P3 / DCI-P3). Ships in v2.3 (Q3 2026).

14. **Self-Healing CSS Linter** (Feature 14) — `@roycss/vscode` LSP, `roycss lint` CLI, `roycss doctor` full audit. Auto-fixable rules with `--fix`. Community rule API. Ships progressively across v2.1–v2.3.

15. **Composable Effect Recipes** (Feature 15) — recipe format, recipe registry, `@roycss-recipe/*` npm organization. Migration of RoyCSS V1's 700+ effects into a recipe pack. Recipe composition engine. Ships in v2.3 (Q3 2026).

**Bundle targets for v2.x:**
- No increase to base CSS.
- Per-route CSS remains at v2 targets.
- LSP and CLI ship as separate packages; not loaded at runtime.
- AI integration is build-time only; no runtime cost.

**Team additions for v2.x:**
- 1 engineer focused on Figma / native emission (Feature 13)
- 1 engineer focused on LSP / linter (Feature 14)
- 1 engineer focused on AI integration (Feature 11)
- 1 designer focused on recipe curation (Feature 15)

**Risk:** the AI integration (Feature 11) depends on LLM cooperation. If Cursor / Copilot / Continue do not adopt `roycss.rules.md`, the feature degrades to "we generate the rules file, you copy-paste into your LLM." Mitigation: ship the `@roycss/ai` package with a CLI that wraps the rules file for popular LLMs; provide a Cursor extension; provide a Continue config preset.

### Long-Term Research for v3 (2027+)

These directions are research — not commitments. Each is gated on browser evolution, AI evolution, and developer adoption signals from v2.x.

**R1. Time-Aware CSS.** A `@timeline` directive that expresses temporal patterns in pure CSS: "show this banner for the first three sessions," "rotate this hero every 30 seconds," "deprecate this UI after 2027-06-01." Implementation: cookie-backed custom properties + `animation-timeline` with custom timeline ranges. Risk: cookie handling is hostile; may require server component.

**R2. Layout Intent API.** Beyond patterns (`r-card`, `r-btn`), a higher-level layout vocabulary: `r-layout:sidebar-with-sticky-header`, `r-layout:holy-grail`, `r-layout:dashboard-3col`. Each layout compiles to grid + container queries + position: sticky. Risk: too abstract; authors may not understand the emission.

**R3. Pure-CSS Behavioral Primitives.** Tabs, accordions, dropdowns, modals — all implemented with `:has()`, `<details>`, `popover`, `<dialog>`. Zero JS. Risk: accessibility nuance (focus management, ARIA) is hard in pure CSS; may require minimal JS for full WAI-ARIA compliance.

**R4. Manifest-Driven Styling.** A `roycss.toml` project manifest that declares project intent (brand, density, motion preference, locale, target platforms). The compiler generates optimal CSS for the manifest — no per-component configuration. Risk: too opinionated; teams may want finer control.

**R5. CSS Trigonometry Layouts.** Use `sin()`, `cos()`, `tan()` for non-rectangular layouts: radial menus, organic grids, arc-based carousels. Risk: niche use cases; may not justify framework-level investment.

**R6. WebGPU-Accelerated Effects.** For effects that CSS cannot express (particle systems, fluid simulations, complex shaders), a WebGPU-backed effect recipe format. Risk: WebGPU adoption is uncertain; battery life on mobile is a concern.

**R7. Real-Time Collaboration Tokens.** Tokens that sync in real-time across Figma, IDE, and running app — a designer changes a token in Figma, the developer's IDE updates within seconds, the running dev server reflects the change without refresh. Risk: requires operational infrastructure (WebSocket relay, conflict resolution).

**R8. WCAG 3.0 Compliance Engine.** When WCAG 3.0 ships (est. 2027–2028), replace the WCAG 2.2 contrast model with the APCA-like WCAG 3.0 model. Risk: WCAG 3.0 is not yet final; may require significant rework.

**R9. AI-Generated Pattern Catalog.** Beyond fixed patterns, an AI that generates new patterns on demand: "I need a `r-pricing-card` with three tiers and a toggle for monthly/annual." The AI generates the pattern, the developer reviews, the pattern is added to the project's catalog. Risk: determinism, quality control, governance.

**R10. Cross-Reality CSS.** As WebXR matures, tokens and patterns that adapt to immersive contexts: depth, parallax, gaze-based interaction. Risk: market size; may remain niche for 5+ years.

**Team for v3 research:**
- 1 research engineer (rotating through R1–R10)
- 1 partnerships lead (working with browser vendors, W3C, Figma)
- Budget for 2–3 prototypes per quarter, with explicit kill criteria

**Governance for v3:**
- Each research direction has a quarterly review.
- A direction that produces a working prototype graduates to "v2.x candidate."
- A direction that does not produce a prototype within two quarters is killed.
- No more than 5 active research directions at any time.

### Success Metrics

The redesign is judged on five metrics, measured quarterly:

1. **Adoption.** Weekly npm downloads of `@roycss/core` and framework adapters. Target by Q4 2026: 100k weekly downloads. Target by Q4 2027: 1M weekly downloads.

2. **Bundle size.** Median per-route CSS gzip across projects using RoyCSS. Target: 12 KB or less. Stretch: 8 KB or less.

3. **Accessibility.** Percentage of projects using RoyCSS that pass axe-core with zero violations. Target: 95%. Stretch: 99%.

4. **DX NPS.** Net Promoter Score from a quarterly survey of RoyCSS users. Target: +40. Stretch: +60.

5. **Performance.** Median LCP / CLS / INP across projects using RoyCSS, measured via opted-in RUM. Target: LCP < 2.0s, CLS < 0.05, INP < 150ms.

If any metric regresses for two consecutive quarters, the redesign is paused and a post-mortem is conducted. The framework's longevity depends on discipline, not on shipping more features.

---

## Closing — Why This Framework Wins in 2031

The frameworks developers choose in 2031 will not be the ones with the most utilities, the most components, or the most effects. They will be the ones that:

- **Treat the platform as a partner, not a target.** RoyCSS uses `@scope`, `@layer`, `@property`, `light-dark()`, anchor positioning, the Popover API, container queries, scroll-driven animations, View Transitions — natively. Competitors that polyfill these in 2026 will be polyfilling them in 2031 too.

- **Treat AI as a first-class author, not an afterthought.** RoyCSS's intent-class compiler, natural-language directive, and `roycss.rules.md` file make AI output deterministic and reviewable. Competitors whose vocabulary is property-level will keep producing hallucinated utility strings.

- **Treat accessibility as a build error, not a lint warning.** RoyCSS fails the build on contrast failures, missing focus styles, missing reduced-motion variants. Competitors that audit accessibility at runtime will keep shipping inaccessible UI.

- **Treat tokens as typed, algebraic, multi-surface values.** RoyCSS's tokens are `@property`-registered, statically checked, and emitted to Web, iOS, Android, Figma, Windows, and Flutter. Competitors that ship only CSS tokens will keep forcing cross-platform teams to manually translate.

- **Treat performance as an enforced budget, not a hope.** RoyCSS's per-route CSS budgets, static analysis, and `PerformanceObserver` attribution make regressions build failures. Competitors that ship CSS without budgets will keep shipping regressions.

- **Treat motion as physics, not keyframes.** RoyCSS's `linear()` spring curves and motion-intent system produce feel that cubic-bezier cannot. Competitors that ship `transition: all 0.3s ease` will keep producing motion that feels mechanical.

- **Treat governance as a feature, not bureaucracy.** RoyCSS's cascade constitution, versioned recipes, and semver-with-codemods policy make large codebases maintainable. Competitors that ship "flexible" frameworks will keep producing unmaintainable CSS.

The framework developers choose in 2031 will be the one that respects their time, their users, and their platform. That is RoyCSS's design from first principles. The work begins now.

---

**End of document.**
Total words: ~13,400.
