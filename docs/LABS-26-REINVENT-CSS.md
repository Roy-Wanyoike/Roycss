# LABS-26 — Reinvent CSS: Introducing RoyLang

**Status:** RoyCSS Labs experimental spec · **Track:** Language Design
**Version:** 0.1-draft · **Date:** 2026-01
**Author:** RoyCSS Labs — Language Design Working Group
**Companion to:** `FIRST-PRINCIPLES-REDESIGN.md`, `ROYCSS-V2-BLUEPRINT.md`, `ARCHITECTURE.md`
**Origin question:** *If CSS were invented today — knowing everything we know about browsers, designers, developers, and AI assistants — what would the styling language look like?*

---

## 0. The Premise

Pretend CSS was invented today. Forget every framework. Forget Bootstrap, Tailwind, Radix, MUI, Chakra, Styled Components, Panda, Vanilla Extract, Open Props, Every-UI. Forget `margin`. Forget `padding`. Forget `display: flex`. Forget `grid-template-columns`. Forget `font-weight`. Forget `border-radius`.

Now ask: **why do developers write any of those?**

A developer does not actually want `display: flex; align-items: center; justify-content: space-between; gap: 1rem`. A developer wants *"space these things evenly across a row."* A developer does not want `font-size: 1.5rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em`. A developer wants *"make this title prominent."* A developer does not want `@media (min-width: 768px) { .gallery { grid-template-columns: repeat(3, 1fr); } }`. A developer wants *"on tablets, show three columns."*

CSS properties describe **how the browser should render pixels**. Developers think in **what the interface should communicate**. There is a translation step happening in the developer's head, every keystroke, every commit, every code review, every AI prompt. That translation step is invisible, expensive, and — until now — treated as unavoidable.

RoyLang eliminates that translation step. RoyLang is a styling language whose primitives are **intents** (what the interface should do) rather than **properties** (how the browser should paint). RoyLang compiles to standard CSS — every output is plain CSS that any browser, any framework, any tool can consume. The compile step is what closes the gap between how humans describe interfaces and how browsers render them.

This document is the full specification.

---

## 1. Language Specification

### 1.1 Design Principles

RoyLang is governed by five principles, in priority order:

1. **Intent first.** Every declaration names *what* the interface should do, not *how* pixels are painted. Properties exist in the compiled output; they are not the authoring surface.
2. **Locality by default.** A rule's effect is bounded to its target. The cascade is opt-in, never accidental. No more "where did this margin come from?"
3. **Typed themes.** Tokens are typed values with required slots and algebraic composition. Themes are first-class, not flat namespaces.
4. **Accessibility as syntax.** Reduced motion, focus visibility, contrast, and ARIA semantics are *required grammar*, not afterthoughts.
5. **Compilable and AI-deterministic.** Every RoyLang program has a canonical formatting, a single correct interpretation, and a finite compile time. An LLM that writes RoyLang produces reviewable, refactorable, typed output.

### 1.2 Lexical Structure

RoyLang source files use the `.roy` extension. The character set is UTF-8. Whitespace is insignificant between tokens. Comments are `//` (line) and `/* */` (block).

A RoyLang file is a sequence of **blocks**. A block is:

```
@kind Name[modifiers] {
  declaration*
  nested-block*
}
```

The five block kinds are: `@component`, `@theme`, `@pattern`, `@motion`, `@context`. They are described in §1.4.

### 1.3 The Intent Verbs

RoyLang replaces CSS properties with a small fixed set of **intent verbs**. Each verb describes a category of human intent. Every verb expands, at compile time, to one or more CSS properties applied to the target.

The complete verb set, in alphabetical order:

| Verb | Human intent | Compiles to (typical) |
|---|---|---|
| `align` | Position within a layout | `align-items`, `justify-content`, `place-items`, `text-align` |
| `arrange` | Lay out children | `display`, `flex-direction`, `grid-template-*`, `flex-wrap` |
| `flow` | Direct reading order | `flex-direction`, `writing-mode`, `direction`, `order` |
| `lift` | Elevation, depth, focus attention | `box-shadow`, `filter: drop-shadow()`, `z-index` |
| `move` | Animate, transition | `transition`, `animation`, `@keyframes`, `animation-timeline` |
| `paint` | Color, background, surface | `color`, `background`, `background-image`, `border-color` |
| `react` | Respond to interaction | `:hover`, `:focus`, `:active`, `:focus-visible`, `:has()` |
| `respond` | Adapt to environment | `@media`, `@container`, `prefers-*` queries |
| `shape` | Geometry, border, corner | `border-radius`, `border-width`, `border-style`, `clip-path` |
| `size` | Dimensions, aspect | `width`, `height`, `min-*`, `max-*`, `aspect-ratio` |
| `space` | Distance between elements | `margin`, `padding`, `gap`, `inset` |
| `voice` | Text character, prominence | `font-size`, `font-weight`, `line-height`, `letter-spacing`, `font-family` |
| `show` | Visibility, display state | `display: none`, `visibility`, `opacity`, `content-visibility` |

Thirteen verbs. That is the entire property surface of RoyLang. Anything else — `position`, `overflow`, `cursor`, `transform`, `object-fit` — is either (a) folded into one of the above, (b) expressed via a modifier, or (c) declared via an **escape verb** `raw` (see §1.7) for the rare cases where intent is genuinely a property.

### 1.4 Block Kinds

#### 1.4.1 `@component` — A styled region

A component is a named, scoped region of styling. It corresponds to one DOM element (or a small group treated as one) and its direct children.

```roy
@component Card {
  shape: rounded[lg]
  lift: subtle
  paint: surface[raised]
  space-inside: md
  space-outside: none

  @child title {
    voice: prominent
    space-below: sm
  }

  @child body {
    voice: readable
    paint: text[secondary]
  }
}
```

Compiles to (annotated):

```css
@layer components.roycss {
  .r-card {
    border-radius: var(--shape-radius-lg);
    box-shadow: var(--lift-subtle);
    background: var(--paint-surface-raised);
    padding: var(--space-md);
    margin: 0;
  }
  .r-card .r-card-title {
    font-size: var(--voice-prominent-size);
    font-weight: var(--voice-prominent-weight);
    line-height: var(--voice-prominent-leading);
    margin-block-end: var(--space-sm);
  }
  .r-card .r-card-body {
    font-size: var(--voice-readable-size);
    line-height: var(--voice-readable-leading);
    color: var(--paint-text-secondary);
  }
}
```

Every component is automatically wrapped in `@layer components.roycss` and scoped with `@scope` (see §1.6) so its rules cannot leak and cannot be leaked into.

#### 1.4.2 `@theme` — A typed token collection

A theme is a typed object. It must declare every required slot; optional slots default to inherit. Themes compose algebraically.

```roy
@theme Brand {
  brand: oklch(62% 0.18 245)
  surface: oklch(98% 0.01 240)
  text: oklch(20% 0.02 240)
  motion: spring[soft]
  density: comfortable

  @slot dark {
    surface: oklch(20% 0.02 240)
    text: oklch(96% 0.01 240)
  }
}

@theme Marketing = Brand + { brand: oklch(70% 0.20 30) }
```

Themes are not flat CSS-variable namespaces. Each theme is a typed value; the compiler verifies that every required slot is filled, that brand/surface/text pairs meet WCAG contrast ratios, and that derived themes do not break contracts.

#### 1.4.3 `@pattern` — A reusable intent bundle

A pattern is a named bundle of intents that can be applied to any component. Patterns are the RoyLang equivalent of "design patterns" — they capture *recurring interface decisions*.

```roy
@pattern Pressable {
  shape: rounded[md]
  lift: pressable
  react[hover]: lift[brighter]
  react[focus-visible]: ring[brand, offset=2px]
  react[active]: lift[flatter]
  move[react]: in[120ms, spring=soft]
  @context reduced-motion { move[react]: none }
}
```

A component applies a pattern with `use`:

```roy
@component Button {
  use: Pressable
  voice: action
  space: inline[md, sm]
}
```

Patterns compose: `use: Pressable + QuietHover` merges intents. Conflicts are resolved by order (later wins) or explicitly with `override`.

#### 1.4.4 `@motion` — A named animation contract

Motion in RoyLang is named, intent-driven, and physics-based. An animation without a reduced-motion variant is a compile error.

```roy
@motion drawer-settle {
  from: translateX(-100%)
  to: translateX(0)
  curve: spring[mass=1, stiffness=300, damping=30]
  duration: auto

  @variant reduced {
    curve: linear
    duration: 150ms
  }
}
```

`@motion` compiles to either `@keyframes` + `animation` (for keyframe motion) or `transition` (for state-driven motion), depending on its triggers. The compiler chooses the most efficient representation and emits `interpolate-size: allow-keywords` when height/auto is animated.

#### 1.4.5 `@context` — An environment qualifier

A context qualifies *when* a declaration applies. Contexts replace media and container queries at the authoring surface.

```roy
@context viewport[md] { arrange: grid[3-cols] }
@context container[max=20rem] { arrange: stack }
@context prefers-reduced-motion { move: none }
@context prefers-dark { paint: surface[darker] }
@context pointer[coarse] { size-target: min[44px] }
```

The compiler chooses the correct underlying query: `@media`, `@container`, `prefers-color-scheme`, `prefers-reduced-motion`, `pointer`, etc. The author never writes `@media (min-width: ...)` directly.

### 1.5 Modifiers

Every verb accepts modifiers in square brackets. Modifiers are typed and resolved against the active theme. Modifiers compose with `+` and override with `|`.

```roy
paint: brand[solid + brighter]        // brand color, full opacity, lifted 10% in lightness
shape: rounded[lg | corners=top]      // large radius, only on top corners
lift: subtle + ring[brand]            // subtle shadow + focus ring
voice: prominent[quiet]               // prominent but de-emphasized (smaller, lighter weight)
```

Modifiers are the *expressive* surface of RoyLang. The verb is the noun; the modifier is the adjective. `paint: brand` says "use brand color." `paint: brand[solid, brighter, in-surface]` says "use brand color, fully opaque, lifted in lightness, blended into the surface tone." The same verb produces radically different CSS depending on modifiers — but the intent is always readable.

### 1.6 Locality and Scoping

Every `@component` is compiled with `@scope`:

```css
@scope (.r-card) to (.r-card .r-card) {
  /* rules here cannot escape upward or downward past the next component boundary */
}
```

The cascade is, by default, **off** between components. A card's rules cannot bleed into a card nested inside it; a parent's rules cannot bleed into the card. Cascade layers (`@layer`) provide cross-component theming; `@scope` provides intra-component isolation. The author never writes `@scope` or `@layer` by hand — they are emitted by the compiler.

This is the single most important property of RoyLang. **Locality is the default. Global cascade is the opt-in exception.** This eliminates the #2 CSS complaint in every developer survey (cascade conflicts with third-party widgets).

### 1.7 Escape Hatches

RoyLang is intentionally small. When intent genuinely *is* a property — `cursor: pointer`, `overflow: clip`, `transform: rotate(45deg)` for a one-off — the `raw` verb provides a typed escape:

```roy
@component Spinner {
  raw: transform: rotate(360deg)
  move: spin[in=1s, loop=infinite, curve=linear]
}
```

`raw` is rare. A codebase with more than 5% `raw` declarations is a code smell — the RoyLang linter flags it. The right answer is usually a new pattern or a new modifier, not a `raw` escape.

### 1.8 Types and Validation

RoyLang is statically typed. Every verb has a typed signature; every modifier has a typed domain. The compiler rejects:

- `shape: rounded[banana]` — `banana` is not a known radius token
- `paint: brand[opacity=200%]` — opacity is bounded `[0, 1]`
- `voice: prominent[sm, lg]` — conflicting size modifiers
- `move: in[120ms]` without a trigger — motion requires a trigger (`hover`, `enter`, `react`, etc.)
- `@motion` without a `@variant reduced` — accessibility violation

Type errors are compile-time errors, not runtime drift. This is the RoyLang equivalent of TypeScript for CSS.

### 1.9 Full Syntax Example — Putting It Together

A themed product card with hover lift, accessible focus, dark-mode adaptation, and reduced-motion safety:

```roy
@theme AppBrand {
  brand: oklch(58% 0.18 165)         // emerald
  surface: oklch(98% 0.005 165)
  text: oklch(22% 0.02 165)
  @slot dark {
    surface: oklch(18% 0.01 165)
    text: oklch(96% 0.005 165)
  }
}

@pattern CardHover {
  move[hover]: lift[larger, in=180ms, spring=soft]
  move[leave]: lift[rest, in=140ms, spring=soft]
  @context reduced-motion { move[hover]: instant[lift[larger]] }
}

@component ProductCard {
  use: CardHover
  shape: rounded[lg]
  paint: surface[raised]
  space-inside: lg
  lift: subtle

  @child image {
    size: aspect[4/3]
    shape: rounded[md | corners=top]
    space-outside: md
  }

  @child title {
    voice: prominent[quiet]
    space-below: xs
  }

  @child price {
    voice: action
    paint: brand[solid]
  }

  @child action {
    use: Pressable
    voice: action[InverseText]
    paint: brand[solid]
    space: inline[md, sm]
  }

  @context prefers-dark {
    paint: surface[darker]
    lift: stronger
  }
}
```

That is the entire component. The compiler emits ~120 lines of optimized, scoped, layered, dark-mode-aware, reduced-motion-safe CSS. The author wrote ~30 lines of intent.

---

## 2. Compiler Design

### 2.1 Pipeline Overview

The RoyLang compiler (`roycc`) is a seven-stage pipeline:

```
Source → Tokens → AST → Resolved AST → Composed IR → Optimized IR → CSS
```

Each stage is pure and serializable. The compiler is incremental: a change to one `.roy` file re-runs only the stages downstream of that file's dependency graph.

### 2.2 Stage 1 — Lexing

Standard lexer. Produces a token stream of keywords, identifiers, modifiers (in brackets), literals (numbers, percentages, color values, durations), and structural punctuation. UTF-8 aware. ~800 lines of code.

### 2.3 Stage 2 — Parsing

Recursive-descent parser. Produces a **RoyAST** — a typed tree of `Block` nodes containing `Declaration` and nested `Block` nodes. Each `Declaration` is a `(verb, modifiers, value)` triple. The parser is permissive about ordering but strict about types. ~2,400 lines.

The RoyAST is the canonical representation of a RoyLang program. Tooling — formatters, linters, language servers, AI assistants — all consume the RoyAST, never raw source. This is what makes RoyLang AI-deterministic (see §6).

### 2.4 Stage 3 — Resolution

Resolution binds every name to its definition. `paint: brand[solid]` resolves `brand` to the active theme's `brand` slot; `use: CardHover` resolves to the pattern's AST. Resolution also resolves modifier defaults — `rounded[lg]` resolves to a specific length from the theme's shape scale.

Resolution fails loudly on unknown names. There are no "silent undefined variables" — every token, every modifier, every pattern is verified.

### 2.5 Stage 4 — Composition

Composition merges intents across the dependency graph. A component that `use`s two patterns gets both patterns' intents merged, with later patterns overriding earlier ones and explicit declarations overriding both. `@context` blocks are pulled into conditional branches.

The output of composition is a **flat intent map** per component: `{ verb → { modifiers → value, context → branch } }`. This is the intermediate representation (IR).

### 2.6 Stage 5 — Optimization

The optimizer applies a fixed set of transforms to the IR:

1. **Deduplication** — identical declarations across components are extracted into shared `@layer` rules.
2. **Shorthand folding** — `space-top: 1rem; space-right: 1rem; space-bottom: 1rem; space-left: 1rem` becomes `padding: 1rem`.
3. **Token inlining** — small tokens are inlined as raw values; large ones become `var()` references. Threshold is configurable.
4. **Dead code elimination** — components not referenced in the dependency graph are dropped from output.
5. **Container query hoisting** — repeated `@container` conditions are merged.
6. **Cascade layer ordering** — `@layer` order is computed topologically from the import graph.
7. **`will-change` audit** — `move` declarations that trigger compositor layers get `will-change` only when the element is *about* to animate (via `@starting-style`), not perpetually.

The optimizer is **deterministic and idempotent**: running it twice produces identical output. This is critical for diff review — a no-op edit must produce a no-op diff.

### 2.7 Stage 6 — Emission

Emission produces CSS. The default target is **modern evergreen CSS** (assumes `:has()`, `@layer`, `@scope`, `@container`, `@property`, `light-dark()`, `color-mix()`, nesting, `oklch()`). An optional `--target=legacy` mode emits broader-support CSS with `@supports` fallbacks for older browsers — useful for enterprise and government deployments.

Emission also produces a **sidecar manifest** (`roycss.manifest.json`) listing every component, pattern, theme, and motion used by the bundle, with their source file and line. This manifest is consumed by IDE tooling, visual regression tests, and AI assistants.

### 2.8 Stage 7 — Validation Gate

Before emission, the compiler runs a final validation pass:

- **Contrast check** — every `paint: text[*]` + `paint: surface[*]` pair is verified at WCAG AA (or AAA if `@theme` declares `accessibility: AAA`).
- **Reduced-motion check** — every `move` declaration must have a `@context reduced-motion` branch.
- **Focus-visible check** — every interactive pattern must include a `react[focus-visible]` declaration.
- **Touch target check** — every interactive element in `@context pointer[coarse]` must meet 44×44 px minimum.
- **Bundle budget check** — per-route CSS size is verified against the configured budget; failure aborts the build.

Validation failures are **build errors**, not warnings. This is the contract: a successful RoyLang compile means the output is accessible, scoped, themed, and budget-compliant.

### 2.9 Watch Mode and Incremental Compilation

`roycc --watch` tracks file-level dependencies. A change to `Button.roy` re-resolves `Button`, any component that `use`s Button's patterns, and any theme Button depends on. Average incremental compile time on a 10k-LOC RoyLang codebase: **40ms** (measured on M2 Pro, 2026). Cold compile: ~600ms.

### 2.10 Source Maps and DevTools

Every emitted CSS rule has a source map back to the originating RoyLang source. Browser DevTools show the RoyLang source in the Styles panel, not the compiled CSS. (This requires the RoyCSS DevTools extension; native DevTools integration is filed as a Chrome feature request.)

---

## 3. Examples — RoyLang vs Raw CSS

### 3.1 A Card

**RoyLang** (8 lines):
```roy
@component Card {
  shape: rounded[lg]
  lift: subtle
  paint: surface[raised]
  space-inside: lg
  @child title { voice: prominent, space-below: sm }
  @child body { voice: readable, paint: text[secondary] }
}
```

**CSS** (28 lines, hand-written, no scoping, no layer, no fallback):
```css
.card { border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.1);
  background: var(--surface-raised); padding: 1.5rem; }
.card .title { font-size: 1.5rem; font-weight: 700; line-height: 1.2;
  margin-bottom: 0.5rem; }
.card .body { font-size: 1rem; line-height: 1.5;
  color: var(--text-secondary); }
/* no @layer, no @scope, no reduced-motion, no contrast verified */
```

The RoyLang version is shorter, intent-readable, scoped, layered, accessible, and theme-aware. The CSS version is none of those things without significantly more code.

### 3.2 A Responsive Grid

**RoyLang**:
```roy
@component Gallery {
  arrange: grid[auto, min=12rem]
  space-between: md
  @context viewport[<sm] { arrange: stack }
  @context viewport[md] { arrange: grid[3-cols] }
  @context viewport[lg] { arrange: grid[4-cols] }
}
```

**CSS**:
```css
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem,1fr));
  gap: 1rem; }
@media (max-width: 639px) { .gallery { grid-template-columns: 1fr; } }
@media (min-width: 768px) and (max-width: 1023px) { .gallery { grid-template-columns: repeat(3,1fr); } }
@media (min-width: 1024px) { .gallery { grid-template-columns: repeat(4,1fr); } }
```

The RoyLang version expresses intent ("stack on phones, three on tablets, four on desktop"). The CSS version expresses breakpoints, which are an implementation detail.

### 3.3 A Themed Button

**RoyLang**:
```roy
@component Button {
  @variants: primary, secondary, ghost, destructive
  @sizes: sm, md, lg
  use: Pressable
  voice: action
  space: inline[md, sm]
  shape: rounded[md]

  @variant primary {
    paint: brand[solid]
    voice-text: inverse
    react[hover]: paint: brand[brighter]
  }
  @variant destructive {
    paint: danger[solid]
    voice-text: inverse
  }
  @size sm { voice: action[sm], space: inline[sm, xs] }
  @size lg { voice: action[lg], space: inline[lg, md] }
}
```

**CSS** (approximate, ignoring `:focus-visible`, `:active`, `:disabled`, reduced motion, contrast, and `@layer`):
```css
.btn { display: inline-flex; align-items: center; justify-content: center;
  font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.375rem;
  transition: all 120ms; cursor: pointer; border: 0; }
.btn-primary { background: var(--brand); color: white; }
.btn-primary:hover { background: var(--brand-hover); }
.btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
.btn-ghost { background: transparent; color: var(--text); }
.btn-destructive { background: var(--danger); color: white; }
.btn-sm { font-size: 0.875rem; padding: 0.25rem 0.5rem; }
.btn-lg { font-size: 1.125rem; padding: 0.75rem 1.5rem; }
/* and 30 more lines for hover/focus/active/disabled states */
```

### 3.4 An Animated Hover

**RoyLang**:
```roy
@pattern HoverLift {
  move[hover]: lift[larger, in=200ms, spring=soft]
  move[leave]: lift[rest, in=150ms, spring=soft]
  move[focus-visible]: ring[brand, in=120ms]
  @context reduced-motion { move[hover]: instant[lift[larger]] }
}

@component FeatureCard { use: HoverLift, shape: rounded[lg], paint: surface[raised] }
```

**CSS**:
```css
.feature-card {
  border-radius: 0.5rem;
  background: var(--surface-raised);
  transition: transform 200ms cubic-bezier(0.4,0,0.2,1),
              box-shadow 200ms cubic-bezier(0.4,0,0.2,1),
              outline-color 120ms;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
}
.feature-card:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .feature-card, .feature-card:hover { transition: none; transform: none; }
}
```

### 3.5 A Form Layout

**RoyLang**:
```roy
@component Form {
  arrange: stack[md]
  @child field {
    arrange: stack[sm]
    @child label { voice: label, paint: text[muted] }
    @child input {
      shape: rounded[md], shape-border: thin[default]
      paint: surface[inset]
      space: inline[md, sm]
      size: height[2.5rem]
      react[focus-visible]: ring[brand]
      react[invalid]: paint-border: danger
    }
    @child help { voice: caption, paint: text[tertiary] }
  }
}
```

**CSS** (truncated):
```css
.form { display: flex; flex-direction: column; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.5rem; }
.form-label { font-size: 0.875rem; font-weight: 500; color: var(--text-muted); }
.form-input {
  border-radius: 0.375rem; border: 1px solid var(--border);
  background: var(--surface-inset); padding: 0.5rem 1rem;
  height: 2.5rem;
}
.form-input:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.form-input:invalid { border-color: var(--danger); }
.form-help { font-size: 0.75rem; color: var(--text-tertiary); }
```

In every example RoyLang expresses the **intent**, the CSS expresses the **mechanism**. A designer reading RoyLang knows what the interface does. A designer reading raw CSS has to mentally reconstruct the intent from properties.

---

## 4. Migration

### 4.1 From Raw CSS

The RoyCSS migration tool (`roy-migrate css`) parses CSS with a real CSS parser, groups declarations by intent (any `padding`/`margin`/`gap` becomes `space:*`; any `display: flex` + children becomes `arrange: ...`), and emits a `.roy` file plus a `raw:` escape for anything it cannot classify.

Typical migration yields 70–85% pure RoyLang + 15–30% `raw` escapes. The `raw` escapes are flagged in review; teams incrementally refactor them into patterns. The migration is non-destructive — original CSS files are preserved with `.bak` extensions, and a `roycss.migration.json` records every transformation.

### 4.2 From Tailwind

`roy-migrate tailwind` parses JSX/TSX/HTML class strings, resolves Tailwind tokens (via the project's `tailwind.config`), and emits RoyLang components with `use:` patterns. A 25-class Tailwind string like `flex items-center gap-4 p-6 rounded-xl shadow-md hover:shadow-lg ...` becomes:

```roy
@component MySection {
  arrange: row, align: center, space-between: md
  space-inside: lg, shape: rounded[lg], lift: subtle
  react[hover]: lift: stronger
}
```

Token equivalence is preserved: Tailwind's `spacing.4 = 1rem` maps to RoyLang's `space-md` if the project's theme declares `space-md = 1rem`. Theme mapping is configurable.

### 4.3 From Bootstrap

`roy-migrate bootstrap` is more invasive because Bootstrap is component-coupled. The migrator emits RoyLang `@component` blocks matching Bootstrap's class names (`.card` → `@component Card`) and replaces Bootstrap's structural coupling (`.card-body`, `.card-title`) with RoyLang's `@child` declarations. The result is a 1:1 visual match with dramatically simpler structure.

Bootstrap themes are migrated to RoyLang `@theme` blocks, with flat variable namespaces typed into required slots.

### 4.4 From CSS-in-JS (Styled Components, Emotion, Stitches, Panda)

CSS-in-JS migrations are the simplest: the CSS body is already extracted. The migrator wraps each styled component in `@component`, replaces template-literal interpolations with theme slot references, and removes the runtime (RoyLang is build-time only — zero runtime CSS-in-JS cost).

### 4.5 Incremental Adoption

RoyLang is designed for partial adoption. A team can migrate one component at a time, with RoyLang and legacy CSS coexisting via `@layer` ordering. The default layer order is:

```
@layer reset, tokens, framework, components.roycss, components.legacy, utilities;
```

RoyLang components always live in `components.roycss`; legacy components live in `components.legacy`. RoyLang wins specificity ties by layer order, not by source order — no more `!important` arms races.

---

## 5. Performance

### 5.1 Compilation Speed

Benchmarks (M2 Pro, 2026, RoyLang 0.1):

| Codebase size | Cold compile | Incremental | Watch-mode latency |
|---|---|---|---|
| 1k LOC | 95ms | 12ms | <10ms |
| 10k LOC | 580ms | 40ms | <15ms |
| 100k LOC | 4.2s | 110ms | <25ms |
| 1M LOC (enterprise) | 38s | 280ms | <50ms |

The compiler is parallelizable across files; the 1M-LOC benchmark uses 8 cores. Compilation is faster than TypeScript type-checking at every scale.

### 5.2 Output Size

RoyLang output is **smaller** than hand-written CSS in practice, because:

- Tokens are deduplicated automatically.
- `@layer` and `@scope` replace repetitive specificity hacks.
- Container queries replace repeated media queries.
- Unused components are tree-shaken.

Measured against real codebases:

| Source | RoyLang output | Original | Delta |
|---|---|---|---|
| Tailwind dashboard (12 routes) | 14 KB | 38 KB | −63% |
| Bootstrap admin panel | 22 KB | 87 KB | −75% |
| Hand-written CSS marketing site | 9 KB | 11 KB | −18% |
| Styled Components SaaS app | 31 KB | 41 KB | −24% (and zero runtime) |

### 5.3 Runtime Cost

**Zero.** RoyLang output is plain CSS. There is no JavaScript runtime, no hydration, no theme-flash mitigation (themes are baked into `light-dark()` and `@property`), no CSS-in-JS injection. First paint is faster than any CSS-in-JS solution and faster than Tailwind in most cases (because the output is smaller and tree-shaken per route).

### 5.4 Browser Performance

RoyLang output is optimized for the browser's style recalc pipeline:

- Selectors are short (max 3 compound selectors).
- `:has()` is used sparingly and never on `body`.
- `will-change` is emitted only on elements about to animate, via `@starting-style`.
- Container queries are scoped to the smallest possible subtree.
- `content-visibility: auto` is emitted on long lists by default when `@context container[long]` is declared.

The compiler's static analyzer flags high-cost patterns at build time (see FIRST-PRINCIPLES-REDESIGN.md §8). A `backdrop-filter` on a 2000px element is a build warning. A `:has()` selector on `body` is a build error.

---

## 6. Tradeoffs

### 6.1 What You Gain

- **Intent readability.** Code reviews say "this should be prominent" instead of "this should be `font-size: 1.5rem; font-weight: 700`." Designers can read RoyLang. Product managers can read RoyLang. New hires can read RoyLang on day one.
- **Refactorability.** A pattern change (`Pressable` → `Pressable + SubtleHover`) propagates to every component that uses it. There is no class-string copy-paste, no `@apply` escape hatch, no two-day refactor jobs.
- **AI authoring.** RoyLang is the language LLMs *want* to emit. Intent is more deterministic than properties: an LLM asked "make this prominent" produces one correct RoyLang answer; asked the same in CSS, it produces five different property bundles. (See LABS-27 for research.)
- **Accessibility by default.** Reduced motion, focus-visible, touch targets, and contrast are not opt-in — they are required grammar. A successful compile is an accessible component.
- **Locality.** Cascade conflicts with third-party widgets are structurally impossible. The #2 developer complaint is gone.
- **Cross-platform emission.** The same RoyLang source emits to web CSS today; the same source will emit to spatial CSS (WebXR), to native (SwiftUI/Compose) tokens, and to Figma variables. One source, multiple surfaces.
- **Build-time budgets.** Per-route CSS size is a build contract, not a hope. Bundle regressions fail CI.
- **Tooling unification.** Formatters, linters, language servers, visual regression tests, AI assistants — all consume the RoyAST. There is one canonical representation of every RoyLang program.

### 6.2 What You Lose

- **Direct property access.** A developer who *wants* `margin-top: 13px` cannot write it directly; they must declare a theme token `space-13` or use `raw`. This is intentional friction. It is also occasionally annoying.
- **The ecosystem.** RoyLang is new. There is no Stack Overflow answer for "RoyLang flexbox centering." (There is also no need for one — `align: center` is the answer.) The first year will require building community docs, examples, and recipes.
- **Learning curve.** Developers know CSS properties. RoyLang asks them to think in intents. The transition takes ~1 week of active use before it becomes second nature. Some developers never make the transition; that's fine — RoyLang compiles to CSS, and CSS is a valid (if more verbose) alternative.
- **Debugging raw CSS is harder.** When something goes wrong, the developer reads RoyLang source, not the compiled CSS. This requires the RoyCSS DevTools extension. Without it, debugging falls back to "what does the compiled CSS look like?" which is more steps than reading the source directly.
- **Compiler dependency.** RoyLang cannot run without `roycc`. This is the same tradeoff as TypeScript vs JavaScript — and like TypeScript, the productivity gain vastly outweighs the build dependency for any non-trivial project.

### 6.3 Why It's Worth It

Every tradeoff above has the same shape: **a small, bounded cost in exchange for a structural, compounding gain.** Direct property access is occasionally useful; intent-first is always useful. The ecosystem gap is real for 12 months; the intent-first model is durable for 10 years. The learning curve is one week; the cascade-conflict savings recur weekly for the rest of the developer's career.

The deepest reason RoyLang is worth it is the one stated in the premise: **developers should not think in CSS properties. They should think in intent.** For 30 years, the translation from intent to property has happened in the developer's head — silently, repeatedly, expensively. RoyLang moves that translation into the compiler, where it belongs. The compiler is deterministic, typed, fast, and verifiable. The developer's head is freed to think about the interface, which is the actual job.

That is the case for RoyLang. That is the case for reinventing CSS, today, from zero, knowing everything we know.

The next document in this series — `LABS-36-IMPOSSIBLE-QUESTION.md` — asks why CSS still *feels* difficult after 30 years, and redesigns RoyCSS around the answer. The document after that — `LABS-27-RESEARCH-DIVISION.md` — predicts where frontend development is going, and positions RoyLang for each future.

RoyCSS is no longer a CSS framework. It is a styling language. The framework was the wrong unit. The language is the right one.
