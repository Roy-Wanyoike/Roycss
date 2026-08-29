# LABS-28 — Delete Half the Framework

**Status:** Proposal / Internal review
**Author:** RoyCSS Core Team
**Audience:** Maintainers, contributors, design partners
**TL;DR:** RoyCSS has 700 effects, 20 categories, 24 components, a motion system, a CLI, design tokens, a color customizer, a favorites system, framework adapters, VS Code snippets, a section scrollbar, and a scroll-to-top button. At least half of it duplicates something else, adds complexity, has low adoption, or can be replaced with modern CSS. This document proposes a ruthless cut and a redesign of what remains.

---

## 1. The premise

RoyCSS started as a library of CSS effects. It is now a small platform. A library of 700 effects sounds like a feature; in practice it is a liability. Each effect is a file the team must maintain, audit for accessibility, test across browsers, document, and eventually migrate as CSS evolves. The marginal value of effect #700 is close to zero. The marginal cost is real and compounding.

This document imagines we have decided to **remove half of everything**. Not as a refactor, not as a "v2," but as a deliberate amputation. The goal is a framework that a single contributor can hold in their head, that a beginner can learn in an afternoon, and that an enterprise can adopt without a six-week evaluation.

We delete everything that:

- duplicates another feature,
- adds complexity without proportional value,
- has low adoption (no measurable usage signal),
- can be replaced with modern CSS (container queries, `:has()`, view transitions, scroll-driven animations, anchor positioning, `color-mix()`, cascade layers, logical properties),
- is confusing to teach or document,
- requires ongoing maintenance without sufficient return.

Every deletion below follows the same template:

> **What it was** — a one-line description.
> **Why it's deleted** — the criterion it fails.
> **What replaces it** — the modern CSS, the smaller primitive, or "nothing — you don't need this."

---

## 2. The audit

### 2.1 The 700 effects

We start with the headline number. 700 effects across 20 categories. The categories today are: `animations`, `hover`, `text`, `backgrounds`, `loaders`, `3d-transforms`, `buttons`, `cards`, `borders`, `filters`, `forms`, `navigation`, `visual`, `particles`, `shadows`, `gradients`, `scroll`, `seasonal`, `game`, `misc`.

The honest inventory:

- Of 700 effects, roughly 180 are **near-duplicates** of another effect with one parameter changed (a different easing, a different color, a different duration). These were generated in batches of 40 to hit the round number. They inflate the count and exhaust the maintainer.
- Roughly 120 effects are **decorative demos** that have no plausible production use — floating jack-o'-lanterns, Valentine hearts, synthwave suns. They are charming; they are not a library.
- Roughly 60 effects reimplement things CSS now ships natively (scroll-driven animations, `@scroll-timeline`, view transitions, `:has()` selectors, `color-mix()`).
- Roughly 90 effects use deprecated patterns (vendor-prefixed gradients, `-webkit-background-clip: text` without a fallback, `position: sticky` used as a parallax hack).
- The remaining ~250 effects are genuinely useful primitives: a small set of buttons, a small set of cards, a small set of borders, a small set of text treatments, a small set of loaders, a small set of hover affordances.

**Decision:** Cut from 700 to **~180 effects** across **6 categories**.

The surviving categories:

1. `motion` — entrance, exit, scroll-driven, looped. Replaces `animations`, `scroll`, and the scroll-driven subset of `hover`.
2. `surface` — cards, panels, glass, elevation. Replaces `cards`, the surface half of `borders`, `shadows`.
3. `edge` — borders, outlines, masks, clip-paths. Replaces the decorative half of `borders`, `filters`.
4. `type` — text treatments that are not color. Replaces `text`.
5. `input` — buttons, inputs, toggles, focus rings. Replaces `buttons`, `forms`.
6. `field` — backgrounds, gradients, particle-free atmospheres. Replaces `backgrounds`, `gradients`, `particles` (the few that earn their place).

Deleted categories: `3d-transforms` (fold into `motion` with a `transform-3d` flag), `navigation` (use a real component library), `visual` (every item either folds into `surface` or is a demo), `seasonal` (demos), `game` (demos), `misc` (the category that admits it has no theme), `loaders` (fold the 6 good ones into `motion` as `loop` variants).

### 2.2 Deletions in detail

**Effects batch 1 — "120 decorative demos"**

> **What it was:** Seasonal and game-themed effects: falling leaves, snowfall, jack-o'-lanterns, Christmas trees, Valentine hearts, synthwave suns, arcade marquees, Matrix code rain, pixel walks, Mario jumps.
> **Why it's deleted:** Low adoption. These are showpieces for the demo site, not building blocks. A developer shipping a product does not put a Valentine heart on a checkout page. They consume maintenance time (each one has bespoke keyframes that must survive browser changes) and they dilute search results for the effects people actually want.
> **What replaces it:** Nothing. If a developer wants a seasonal flourish, they write 20 lines of CSS or use a one-off CodePen. RoyCSS is not a stock-art site.

**Effects batch 2 — "near-duplicate variants"**

> **What it was:** Five versions of "fade up" that differ only in easing (`ease-out`, `ease-in-out`, `spring(1, 80)`, `cubic-bezier(0.16, 1, 0.3, 1)`, `linear`). Five versions of "glow border" that differ only in color.
> **Why it's deleted:** Duplicates another feature and adds complexity. The easing and the color are parameters. Shipping them as separate effects is the wrong abstraction; it makes the library look larger while making it harder to find anything.
> **What replaces it:** One `fade-up` effect with a documented `--roycss-easing` custom property and a documented `--roycss-color` custom property. The variant picker moves into the effect detail dialog as a parameter editor, not as a separate catalog entry.

**Effects batch 3 — "things modern CSS does natively"**

> **What it was:** A "scroll progress bar" effect, a "sticky parallax" effect, a "card that flips on hover" effect, a "text that reveals on scroll" effect.
> **Why it's deleted:** Can be replaced with modern CSS. Scroll progress is one line with `animation-timeline: scroll()`. Sticky parallax is `position: sticky` plus a transform. Card flip is `transform-style: preserve-3d`. Text reveal on scroll is `animation-timeline: view()`. Shipping a custom implementation teaches developers a worse pattern than the platform now provides.
> **What replaces it:** Documentation. A "Modern CSS recipes" page that shows the native one-liner with an `@supports` fallback for older browsers. The library shrinks; the documentation grows in value.

**Effects batch 4 — "vendor-prefix and deprecated-pattern effects"**

> **What it was:** Gradient text via `-webkit-background-clip: text` with no standard fallback. Parallax via `background-attachment: fixed` (broken on mobile). Sticky headers via `position: sticky` wrapped in a polyfill.
> **Why it's deleted:** Confusing and maintenance-heavy. These effects fail in real products and the team must answer the same GitHub issues forever.
> **What replaces it:** Where a standard approach exists, document it. Where it doesn't, delete the effect and let the platform mature.

**Effects batch 5 — "the `misc` category"**

> **What it was:** A category whose name is an admission that it has no theme.
> **Why it's deleted:** Confusing. A library whose final category is "misc" is a library that has lost its shape.
> **What replaces it:** Each surviving `misc` effect is re-filed into one of the six surviving categories or deleted. The category itself is removed.

### 2.3 The 20 categories

**Decision:** Cut from 20 to **6 categories**.

> **What it was:** Twenty top-level categories including `3d-transforms`, `navigation`, `visual`, `seasonal`, `game`, `misc`.
> **Why it's deleted:** Adds complexity. Twenty categories require a sticky nav bar with twenty entries, a section scrollbar with twenty dots, twenty icons, twenty index pages, twenty doc pages. The cognitive cost of "which category does my need live in?" exceeds the value of fine-grained buckets.
> **What replaces it:** Six categories with clear, non-overlapping definitions. The nav bar becomes a six-item pill row. The section scrollbar becomes unnecessary (see 2.8).

### 2.4 The 24 components

The component library today ships: button, card, input, alert, badge, tabs, dialog, sheet, drawer, tooltip, popover, hover-card, dropdown-menu, context-menu, menubar, navigation-menu, accordion, carousel, command, calendar, avatar, separator, skeleton, progress, plus their variants.

This is a fork of shadcn/ui. The honest truth:

> **What it was:** A 24-component library built on Radix primitives and Tailwind, largely tracking shadcn/ui.
> **Why it's deleted:** Duplicates another feature. shadcn/ui already exists, is better maintained, has a larger community, and ships the same components. RoyCSS cannot win a head-to-head with shadcn/ui on components. Maintaining a fork costs the team time it should be spending on effects.
> **What replaces it:** **Delete the component library entirely.** RoyCSS becomes a CSS effects library that is explicitly designed to layer *on top of* shadcn/ui (or any other component library). The docs link to shadcn/ui for components. RoyCSS provides the *visual treatment* primitives — the borders, the gradients, the motion — that developers apply to their own components.

This is the single largest cut in the document and the single largest relief to the maintainer's calendar.

### 2.5 RoyMotion

> **What it was:** A motion system with React/JSX primitives — `ScrollReveal`, `StaggerGroup`, `TextReveal`, `MagneticButton`, `TiltCard`, `AnimatedCounter`, `Marquee`, `CursorGlow`, `Parallax`, `AnimatedGradientText`, `Floating`, `ShineBorder`, `StatCounter`, `SectionHeading`, `staggerContainer`, `staggerItem`.
> **Why it's deleted:** Adds complexity and duplicates the platform. Half of these (`Marquee`, `CursorGlow`, `Parallax`, `Floating`, `AnimatedGradientText`, `ShineBorder`, `StatCounter`, `AnimatedCounter`) are CSS effects dressed up as React components. The other half (`ScrollReveal`, `StaggerGroup`, `TextReveal`, `MagneticButton`, `TiltCard`, `SectionHeading`) are wrappers around Framer Motion that hide three lines of code behind a custom API. A developer who knows Framer Motion does not need RoyMotion; a developer who does not know Framer Motion should learn it directly.
> **What replaces it:** Two things. First, the CSS-only motion primitives move into the `motion` effects category as pure CSS, with `animation-timeline: view()` for scroll-driven variants. Second, the interactive primitives (`MagneticButton`, `TiltCard`) become optional **recipes** in the docs — small, copy-pasteable code samples that use Framer Motion directly, with no RoyMotion abstraction layer. RoyCSS stops shipping a JS runtime.

This is the second-largest cut. It removes a whole dependency surface and a whole conceptual layer.

### 2.6 The CLI

> **What it was:** A CLI (`src/cli/index.ts`) for scaffolding effects and managing favorites.
> **Why it's deleted:** Low adoption and adds complexity. A CLI for a CSS library is a category error. CSS libraries are consumed by adding a stylesheet or copying a class. A CLI implies installation, version management, update channels — none of which a CSS library needs. The team must maintain the CLI binary, its tests, its release pipeline, and its compatibility matrix, all for a feature that competes with `curl` and `cp`.
> **What replaces it:** A single `roycss.css` file and a single `roycss.css` CDN URL. If a developer wants a subset, they import the CSS module for the category they need: `@import "roycss/motion.css"`. No CLI. No install step. No version mismatch between the CLI and the library.

### 2.7 Design tokens & color customizer

> **What it was:** A design-tokens module (`src/lib/design-tokens.ts`) exporting semantic color, spacing, radius, and motion tokens in OKLCH, plus an interactive color customizer UI that lets users recolor any effect live and copy the customized CSS.
> **Why it's deleted (partially):** The customizer UI is deleted. The tokens are kept.
> **Why the customizer is deleted:** Adds complexity without proportional value. The customizer is essentially a color picker wired to CSS custom property substitution. Developers who need this already have it in their browser DevTools, in their design tool (Figma), or in their build's PostCSS pipeline. Shipping a custom UI for it duplicates the platform and creates a second source of truth for "what color is this effect."
> **What replaces it:** Every effect uses CSS custom properties (`--roycss-fg`, `--roycss-accent`, `--roycss-bg`, `--roycss-radius`, `--roycss-duration`) with sensible OKLCH defaults. The *documentation* shows the custom properties in a table. Developers override them in their own stylesheet. No UI. The tokens themselves remain, because tokens are how a design system stays coherent across 180 effects.

### 2.8 Favorites system

> **What it was:** A favorites system with `useFavorites` hook, `localStorage` persistence, a favorites sheet UI, a counter badge, an "export favorites as .css" feature.
> **Why it's deleted:** Low adoption and adds complexity. Favorites are a feature of a *content site*, not a *library*. A developer who uses RoyCSS in production does not maintain a favorites list on the RoyCSS website; they copy the CSS they want into their repo. The favorites system is a demo-site convenience that has grown into a maintained feature with its own state model, persistence format, and export pipeline.
> **What replaces it:** The browser's bookmark feature, or a "starred" query parameter that links back to a curated set. The export feature is replaced by a "copy this CSS" button on every effect (which already exists). The favorites sheet, the counter badge, and the `useFavorites` hook are deleted.

### 2.9 Framework adapters

> **What it was:** A `framework-adapters.ts` module with usage examples for React, Vue, Angular, Svelte, Solid, Astro, and vanilla.
> **Why it's deleted:** Adds complexity and is confusing. RoyCSS is a CSS library. It works in every framework identically: you add a class. The "adapter" is one line: `<div className="roycss-fade-up">`. Shipping an adapter module implies there is something to adapt, which there is not.
> **What replaces it:** A single documentation page titled "Using RoyCSS in your framework" with one paragraph per framework showing the import and the class. No code module.

### 2.10 VS Code snippets

> **What it was:** `vscode-support/roycss-snippets.json` and `roycss-classes.json`, plus a `VSCODE-EXTENSION.md` design doc.
> **Why it's deleted:** Low adoption and adds maintenance. A VS Code extension is a separate release artifact with its own review process on the marketplace. The snippets duplicate information already available in the docs and in autocomplete from the class names.
> **What replaces it:** A community-maintained extension, explicitly *not* maintained by the core team. The core team provides a `classes.json` data file under a permissive license; anyone can build an extension from it. The core team stops shipping a binary.

### 2.11 Section scrollbar

> **What it was:** A vertical scroll progress indicator with 22 clickable section dots, hover tooltips, and active-category highlighting.
> **Why it's deleted:** Adds complexity. With 20 categories the scrollbar was necessary navigation; with 6 categories it is decoration. It also duplicates the sticky top nav, which already provides category navigation.
> **What replaces it:** The sticky top nav. If a developer wants scroll progress, the docs show the one-line `animation-timeline: scroll()` recipe.

### 2.12 Scroll-to-top button

> **What it was:** A floating button that scrolls to the top of the page.
> **Why it's deleted:** Adds complexity without proportional value. It is six lines of CSS and a button. It is also a browser concern, not a library concern.
> **What replaces it:** Native browser behavior (`Cmd+Up`, the browser's own scroll-to-top on long pages). If the docs site wants one, it lives in the docs site, not in the library.

### 2.13 Section nav bar

> **What it was:** A sticky horizontal nav with 20 category chips.
> **Why it's kept (but shrunk):** It is genuinely useful for navigation.
> **What replaces it (in form):** A six-item pill row, statically positioned, no scroll, no active-highlight animation that fights the user's scroll position.

### 2.14 Dark/light theme toggle

> **What it was:** A sun/moon toggle that switches the demo site between `prefers-color-scheme: light` and `dark`.
> **Why it's kept:** This is a documentation-site feature, not a library feature. It stays in the docs site. It is removed from the library's conceptual surface so that contributors stop treating "theme toggle" as a library concern.

---

## 3. The redesign

After the cuts, RoyCSS is:

- **~180 effects** in **6 categories** (`motion`, `surface`, `edge`, `type`, `input`, `field`).
- **One stylesheet** (`roycss.css`) with six importable category modules.
- **One runtime:** CSS custom properties. No JS, no React, no Framer Motion.
- **One tokens module:** OKLCH colors, spacing, radius, motion, exposed as `--roycss-*` custom properties.
- **One docs site:** catalog, recipes, modern-CSS guide, migration guide.
- **No CLI, no component library, no motion system, no favorites, no customizer, no framework adapters, no VS Code extension, no section scrollbar, no scroll-to-top.**

### 3.1 The mental model

A developer's journey through RoyCSS becomes four steps:

1. **Browse** the catalog of 180 effects, organized into 6 categories.
2. **Copy** the CSS for the effect they want. Every effect is self-contained: one class, one set of keyframes, one block of custom properties at the top.
3. **Override** the custom properties (`--roycss-accent`, `--roycss-duration`, `--roycss-easing`) in their own stylesheet.
4. **Compose** effects with their own components — shadcn/ui, Radix, Material, whatever they already use.

That is the whole framework. There is no fifth step.

### 3.2 The catalog page

The redesigned catalog is a single page. Six category pills at the top. A search box. A grid of effect cards. No section scrollbar, no scroll-to-top, no favorites badge, no counter in the nav. The page is the catalog. The catalog is the page.

Each effect card shows:

- the live preview,
- the effect name,
- a one-line description,
- a "copy CSS" button,
- a "details" button that opens the effect dialog.

The effect dialog shows:

- the live preview at a larger size,
- the full CSS source with syntax highlighting,
- a table of the custom properties the effect respects,
- a "modern CSS alternative" note if the platform now ships a native equivalent.

That is it. No color customizer, no framework-usage tabs, no favorites toggle, no "related effects" carousel. The dialog is small and fast.

### 3.3 The tokens

The token set shrinks to a deliberately small surface:

```css
:root {
  /* color — OKLCH */
  --roycss-bg:     oklch(99% 0.005 240);
  --roycss-fg:     oklch(20% 0.02 240);
  --roycss-muted:  oklch(55% 0.02 240);
  --roycss-accent: oklch(62% 0.21 264);
  --roycss-surface: oklch(96% 0.01 240);

  /* motion */
  --roycss-duration: 320ms;
  --roycss-easing:   cubic-bezier(0.22, 1, 0.36, 1);

  /* shape */
  --roycss-radius:   12px;
  --roycss-border:   1px;

  /* depth */
  --roycss-shadow-sm: 0 1px 2px oklch(20% 0.02 240 / 0.06);
  --roycss-shadow-md: 0 4px 12px oklch(20% 0.02 240 / 0.08);
}
```

Eleven tokens. Every effect reads from these. A developer who wants to rebrand the entire library overrides eleven values. A developer who wants to rebrand one effect overrides one value. This is the whole theming story.

### 3.4 The recipes section

Where RoyMotion used to live, there is now a **recipes** section in the docs. Recipes are short, opinionated code samples that compose RoyCSS with a real component library. Examples:

- "A magnetic button with Framer Motion and RoyCSS's `edge-glow` effect."
- "A scroll-reveal card with native `animation-timeline: view()` and RoyCSS's `surface-glass` effect."
- "A staggered list with CSS `:has()` and RoyCSS's `motion-fade-up`."

Each recipe is one file. Each recipe links to the effect it composes. Recipes are versioned with the docs, not shipped as a runtime.

### 3.5 The "modern CSS" guide

A new docs page that exists *to send people away from RoyCSS*. For every common need that modern CSS solves natively, the guide shows the native one-liner and the `@supports` fallback. RoyCSS shrinks every time the platform grows. This is a feature, not a bug: it means the library tracks the health of CSS itself.

### 3.6 The migration guide

A page for users of the current (pre-cut) RoyCSS. It lists every deleted feature, explains the replacement, and provides a one-line codemod where possible. The migration guide is the team's contract with existing users: *we are taking things away, and we are telling you exactly what to do instead.*

---

## 4. The numbers

| Metric | Before | After | Cut |
|---|---|---|---|
| Effects | 700 | ~180 | 74% |
| Categories | 20 | 6 | 70% |
| Components | 24 | 0 | 100% |
| Runtime dependencies | React, Framer Motion, Radix | none | 100% |
| Maintained modules | ~30 | ~8 | 73% |
| Conceptual surfaces | catalog, components, motion, CLI, tokens, customizer, favorites, adapters, snippets, scrollbar, scroll-to-top | catalog, tokens, recipes, docs | ~80% |
| Time to learn the library | a weekend | an afternoon | — |
| Time to maintain per release | weeks | days | — |

The library does not become 50% smaller. It becomes roughly **75% smaller** by every measure that matters. The "delete half" framing is the floor, not the ceiling.

---

## 5. What we keep, and why

To be explicit about what survives the cut:

- **The 180 best effects.** They are the product. Everything else exists to serve them.
- **The OKLCH token system.** It is small, coherent, and modern. It is the reason the library looks consistent.
- **The catalog page and effect dialog.** Stripped of the customizer, the favorites, and the framework tabs, they become fast and focused.
- **The docs site.** With the component library and motion system gone, the docs site becomes the second most important artifact, after the CSS itself.
- **The build that emits `roycss.css` and six category modules.** This is the only artifact a user installs.

Everything else is deleted.

---

## 6. The cost of not doing this

The strongest argument against this cut is "we built all of that." That is also the strongest argument *for* it. Sunk cost is the enemy of a small library. Every quarter we keep the component library, we fall further behind shadcn/ui. Every quarter we keep RoyMotion, we fall further behind Framer Motion and the native CSS motion primitives. Every quarter we keep the CLI, the customizer, and the favorites sheet, we spend maintainer hours on surfaces that do not differentiate RoyCSS from any other CSS library.

The differentiation is the effects. The cut lets us spend all of our time on them.

---

## 7. Risks and mitigations

**Risk:** Existing users lose features they depend on.
**Mitigation:** The migration guide. A clear deprecation timeline (one minor release with warnings, one major release with removal). A codemod for the common cases (e.g., `RoyMotion.ScrollReveal` → native `animation-timeline: view()`).

**Risk:** The library looks smaller and therefore less impressive.
**Mitigation:** Reframe "smaller" as "sharper." The marketing line becomes "180 effects, zero runtime, one stylesheet." That is a stronger pitch than "700 effects, 24 components, a motion system, and a CLI."

**Risk:** Contributors who built deleted features feel demoralized.
**Mitigation:** Credit them in the changelog. Invite them to focus on the surviving 180 effects, where their work will be more visible and more used.

**Risk:** The cut removes a feature that turns out to have high adoption we didn't measure.
**Mitigation:** Before deletion, instrument the docs site for one quarter to measure actual usage of the customizer, the favorites, and the framework adapters. Delete only what the data confirms is unused. (The seasonal and game effects can be deleted without measurement — their adoption is, by construction, near zero.)

---

## 8. The new release shape

After the cut, a release is:

- one CSS file (`roycss.css`),
- six category modules,
- one tokens file,
- one docs site build.

A release takes hours, not weeks. A patch is a single effect fix. A minor is a new effect or a new recipe. A major is a token rename or a category reshape — rare, intentional, and accompanied by a codemod.

---

## 9. Closing

RoyCSS is a CSS effects library. It is not a component library, a motion framework, a CLI, a design tool, or a content site. Every minute spent being those things is a minute not spent being the best CSS effects library on the web. Deleting half the framework is the most generous thing the team can do for the half that remains.

The goal is not a smaller RoyCSS. The goal is a RoyCSS that a single maintainer can hold in their head, that a beginner can learn in an afternoon, and that an enterprise can adopt without an evaluation period. Half the framework is in the way of that goal. We delete it.
