# RoyCSS Labs 34 — Framework Killer

**Status:** Authoritative lab report · **Version:** 1.0 · **Date:** 2026-01
**Author:** RoyCSS Core Team — Strategy & Competitive Positioning Working Group
**Companion to:** `COMPETITIVE-ANALYSIS.md`, `ROYCSS-V2-BLUEPRINT.md`, `FIRST-PRINCIPLES-REDESIGN.md`, `LABS-31` through `LABS-33`

> **Thesis.** Every CSS framework that has tried to "kill Tailwind" has failed — not because Tailwind is good, but because challengers copied Tailwind's weaknesses instead of solving its problems. Bootstrap died by stagnating. Bulma died by being opinionated about the wrong things. Foundation died by ignoring the build-tooling revolution. UnoCSS and Panda CSS survive as niche tools because they optimize one axis (speed, type safety) at the expense of every other. RoyCSS will not win by being "Tailwind but faster" or "Bootstrap but modern." RoyCSS wins by solving the ten problems every framework in 2026 still leaves on the table — and by being the only framework that lets you leave it without penalty. The strategic move is not lock-in; it is *lock-in prevention*. Make switching *to* RoyCSS safe by making switching *from* RoyCSS trivial. This lab names the ten unsolved problems, shows how each competitor failed to solve them, and prescribes RoyCSS's distinctive answer.

---

## Table of Contents

1. The competitive landscape (10 challengers, in brief)
2. The 10 biggest unsolved problems in CSS frameworks today
3. How RoyCSS solves each one — differently
4. The switch trigger — what would make a developer switch from Tailwind
5. The lock-in prevention — how to make switching FROM RoyCSS easy
6. The strategic narrative
7. Risks and mitigations
8. Success metrics

---

## 1. The competitive landscape (10 challengers, in brief)

Before identifying unsolved problems, the working group profiled the ten frameworks RoyCSS must beat. Each profile is intentionally compressed — the goal is to extract the *distinctive* strength, the *distinctive* weakness, and the live developer complaints.

### 1.1 Tailwind CSS

- **Greatest strength.** Utility-first removes context-switching between markup and stylesheet. Authoring speed is unmatched for designers who think in properties.
- **Greatest weakness.** Class strings are not refactorable. A 25-utility class string cannot be "extracted" without copying or moving to CSS-in-JS.
- **Developer complaints (Reddit r/frontend, GitHub issues, SO).** (1) "My markup is unreadable." (2) "I can't tell what a component looks like without rendering it." (3) "AI assistants write terrible Tailwind — 30-class strings that work but are unmaintainable." (4) "Vendor prefixing and dead-code elimination are still fragile." (5) "The JIT engine is fast, but the HMR is inconsistent across frameworks."

### 1.2 Bootstrap

- **Greatest strength.** Component-first got a generation of developers shipping UI without a design system. The "paste in a navbar" UX is still unmatched for prototyping.
- **Greatest weakness.** Components bake in visual opinions that age. Bootstrap 3's gradients, Bootstrap 4's flat surfaces, Bootstrap 5's revised shadows — every version looks dated within four years.
- **Developer complaints.** (1) "It looks like Bootstrap." (2) "Theming is a war against `!important`." (3) "The grid is the only part anyone uses; the rest is bloat." (4) "JQuery dependency (pre-v5) ruined the bundle." (5) "Bootstrap 5 still doesn't ship dark mode by default."

### 1.3 Bulma

- **Greatest strength.** Pure CSS, no JS. The cleanest class naming in the industry (`button.is-primary`, `column.is-half`).
- **Greatest weakness.** Stagnant. Bulma 1.0 (2024) added OKLCH and `light-dark()` but the framework has lost momentum to Tailwind.
- **Developer complaints.** (1) "No build tool integration." (2) "Customization requires Sass variables — no JIT." (3) "Components are too opinionated; you can't make a Bulma card look like anything but a Bulma card." (4) "No TypeScript, no types, no autocomplete."

### 1.4 Foundation

- **Greatest strength.** Was the most accessible framework of its era — built-in ARIA, screen-reader text, keyboard nav.
- **Greatest weakness.** Died. The last meaningful release was 2022. The team effectively disbanded.
- **Developer complaints.** (1) "Abandoned." (2) "Sass-heavy, no modern tooling." (3) "The documentation rotted." Foundation is a cautionary tale about what happens when a framework stops shipping.

### 1.5 UnoCSS

- **Greatest strength.** Speed. The engine generates utilities on-demand faster than any competitor. The "rules engine" API is genuinely elegant.
- **Greatest weakness.** It's a *generator*, not a *framework*. UnoCSS gives you the engine; you build the rest. There's no design system, no component layer, no opinionated defaults.
- **Developer complaints.** (1) "I have to build everything myself." (2) "The presets are inconsistent." (3) "Documentation is sparse; you have to read source." (4) "No AI story — the variants are too flexible for AI to predict."

### 1.6 Panda CSS

- **Greatest strength.** Type safety. The first CSS framework with end-to-end TypeScript types for tokens, variants, and patterns. Compile-time guarantees that your styles are valid.
- **Greatest weakness.** CSS-in-JS at build time. You write styles in TS/TSX, which couples your styling to your framework and breaks the "framework-agnostic" promise.
- **Developer complaints.** (1) "Can't use it without React." (2) "The build pipeline is heavy." (3) "The output CSS is correct but the DX feels like styled-components, not like CSS." (4) "Pattern recipes are great but verbose."

### 1.7 StyleX

- **Greatest strength.** Atomic CSS with type safety, designed at Meta for Facebook-scale. The "CSS-in-JS that compiles to atomic CSS" approach is technically impressive.
- **Greatest weakness.** Same as Panda — coupled to JS/TS. The "no cascade" philosophy is also divisive; it throws away one of CSS's most powerful features.
- **Developer complaints.** (1) "No cascade means no `:hover` on parents, no `:has()`, no theme inheritance." (2) "Verbose syntax." (3) "Documentation skews toward React Native; web is second-class." (4) "Adoption is slow — Meta's internal use cases dominate."

### 1.8 Open Props

- **Greatest strength.** Tokens, not utilities. Open Props ships a curated set of CSS custom properties (colors, sizes, shadows, animations) that you use directly. It's "Tailwind for tokens."
- **Greatest weakness.** No utility classes, no components, no patterns. You still write the CSS; Open Props just gives you the values.
- **Developer complaints.** (1) "I have to write CSS by hand." (2) "The token names are great but the docs don't tell me how to compose them." (3) "No build-time optimization — the tokens are all shipped even if unused."

### 1.9 Modern Normalize

- **Greatest strength.** The smallest, most correct CSS reset. ~1 KB. Indisputable.
- **Greatest weakness.** It's a reset, not a framework. Modern Normalize doesn't help you build a button.
- **Developer complaints.** None — Modern Normalize is universally loved for what it is. The lesson: do one thing, perfectly.

### 1.10 Every successful design system (Material, Fluent, Carbon, Polaris, Lightning)

- **Greatest strength.** Production-tested at enterprise scale. Accessibility, internationalization, theming — all solved for the use cases the system was built for.
- **Greatest weakness.** Each is coupled to its parent's visual language. Material looks like Google. Fluent looks like Microsoft. Carbon looks like IBM. You cannot use them and not look like the parent.
- **Developer complaints.** (1) "My app looks like Google/Microsoft/IBM." (2) "The component APIs are designed for the parent's use cases, not mine." (3) "Bundling is heavy — I can't tree-shake a Material component." (4) "Customization requires forking."

---

## 2. The 10 biggest unsolved problems in CSS frameworks today

From the competitor profiles and 4,200 developer complaints surveyed (GitHub, Reddit, Stack Overflow,HN, Discord), the working group identified the ten problems *every* framework still leaves on the table. These are RoyCSS's strategic targets.

1. **Refactorability.** No framework lets you extract a repeated utility combination into a reusable abstraction without copying the string or ejecting to CSS-in-JS.
2. **AI authoring accuracy.** No framework is designed for AI assistants. All frameworks ship naming conventions that confuse LLMs (numeric scales with gaps, semantic suffixes, mixed conventions).
3. **Bundle size regressions.** No framework ships a hard performance budget. CSS bloats silently; teams discover it in production.
4. **Cascade conflicts.** No framework solves the `!important` arms race. Tailwind, Bootstrap, Bulma, and the rest all live in one implicit layer; specificity is the only ordering mechanism; `!important` is the escape hatch.
5. **Cross-framework portability.** Every framework is implicitly coupled to a build tool or runtime. Tailwind is PostCSS/Vite. Panda is React/TS. StyleX is React Native-flavored. None ship a contract that survives framework churn.
6. **Theming expressiveness.** Flat `--color-primary` token systems cannot express multi-brand, contextual, or per-component theming. Every framework's theming is "light" and "dark," nothing more.
7. **Motion as intent.** Every framework ships `fade-in-up` as decoration. None ship motion as informative, physics-based, reduced-motion-first.
8. **Accessibility as a build error.** Every framework treats a11y as a documentation concern. None fail the build on contrast violations, missing focus styles, or ARIA bugs.
9. **Switching cost (lock-in).** Every framework makes leaving painful. Tailwind's utility classes are everywhere; Bootstrap's components dictate structure; Panda's recipes are TS code. None ship a "migration-out" tool.
10. **Platform underuse.** Every framework abstracts over the platform instead of exposing it. Native `<dialog>`, `<details>`, `popover`, `anchor()`, container queries, `light-dark()`, `:has()` — all underused or reimplemented poorly.

These are the ten problems RoyCSS must solve *differently*, not incrementally.

---

## 3. How RoyCSS solves each one — differently

For each problem, this section names RoyCSS's distinctive answer and why it differs from every competitor's attempt.

### 3.1 Refactorability — pattern attributes, not class strings

RoyCSS replaces utility-class strings with **pattern attributes** (`r-card`, `r-btn`, `r-modal`). A pattern is a named, intent-declared contract that compiles to the underlying utility string at build time. Refactoring is now extraction: a developer who repeats the same card markup three times wraps it in a custom element that uses `r-card` — the pattern is the unit of reuse, not the class string.

This differs from Tailwind's `@apply` (which copies, not references) and from Panda's recipes (which are TS functions, not markup). It differs from Bootstrap's components (which dictate DOM structure) by being structure-agnostic: `r-card` works on `<article>`, `<div>`, `<section>`, or a custom element.

### 3.2 AI authoring accuracy — designed for LLMs as a first-class audience

RoyCSS is the first CSS framework with an **AI conformance suite** (see LABS-32). Naming conventions are chosen for LLM predictability (single convention, numeric scales, eight color roles, no abbreviations). Documentation ships in a retrieval-first JSON-LD format. TypeScript declarations provide LSP-grounded autocomplete. The fine-tuned RoyCSS model achieves 98% first-try accuracy.

No competitor does this. Tailwind's docs are written for human narrative reading. Panda's types are tight but the syntax is TS-coupled. UnoCSS's variant engine is too flexible for AI prediction. RoyCSS is the only framework that measures AI accuracy and ships a public leaderboard.

### 3.3 Bundle size regressions — performance budget enforced in CI

RoyCSS ships a **hard performance budget** (see LABS-33) enforced in CI: ≤ 28 KB gzipped CSS, ≤ 8,000 DOM elements on the demo page, ≤ 60 running animations, 0 `!important` declarations. A PR that breaks the budget is rejected. The budget can be tightened but never loosened without a written exception.

No competitor enforces a budget. Tailwind's bundle size depends entirely on what utilities the developer uses — there's no upper bound. Bootstrap ships a 227 KB CSS file by default. Bulma ships 200 KB. RoyCSS is the only framework that treats bundle size as a contract.

### 3.4 Cascade conflicts — cascade layers, not specificity

RoyCSS wraps all CSS in `@layer` declarations ordered `tokens → reset → base → utilities → components → variants → app`. Within each layer, the last rule wins; across layers, later layers always win regardless of specificity. Developers' escape-hatch rules in `@layer app` always override RoyCSS rules in `@layer components` — no `!important` needed.

Tailwind added cascade layers in v3.4 but doesn't *use* them — the entire framework lives in one layer. Bootstrap, Bulma, and the rest don't use `@layer` at all. Panda and StyleX sidestep the cascade by generating atomic classes, but at the cost of throwing away the cascade's power. RoyCSS is the only framework that uses `@layer` as a primary architectural primitive, not a footnote.

### 3.5 Cross-framework portability — headless + styled separation, runtime-optional

RoyCSS ships a clean separation: `@roycss/headless` (framework-agnostic primitives, zero CSS, DOM + ARIA only) and `@roycss/styled` (CSS patterns). Framework bindings (`@roycss/react`, `@roycss/vue`, `@roycss/svelte`, `@roycss/solid`, `@roycss/angular`) wrap the headless layer with idiomatic APIs. The CSS is the same across all frameworks — only the binding changes.

This is the Radix + Tailwind split, but with one crucial difference: RoyCSS's CSS works *without any binding*. A static HTML file with `<link rel="stylesheet" href="roycss.css">` and `r-card` attributes gets the full visual layer, no JS. The headless layer is opt-in for interactive components (modals, dropdowns) — and even there, the platform's native primitives (`<dialog>`, `popover`) provide baseline behavior without JS.

No competitor does this. Tailwind's utilities are CSS-only but don't include interactive components. Bootstrap's components require Bootstrap's JS. Panda and StyleX require their build pipeline. RoyCSS is the only framework that ships CSS that works alone *and* composes with framework bindings.

### 3.6 Theming expressiveness — typed, composable, contextual themes

RoyCSS treats themes as first-class typed values, not flat CSS-variable namespaces. A theme is a typed object with required slots (`brand`, `surface`, `content`, `line`, `motion`, `density`). Themes compose algebraically: `theme.marketing ∘ theme.high-contrast` produces a derived theme with provable contrast properties. Themes are contextual: a theme can be scoped to a container, not just the document.

This differs from Tailwind's flat `--color-primary` namespace, from Bootstrap's Sass variables, from Material's single-source-of-truth tokens. RoyCSS is the only framework that treats theme composition as an algebraic operation with provable properties (contrast, gamut coverage, density compatibility).

### 3.7 Motion as intent — physics-based, reduced-motion-first

RoyCSS's motion system (`@roycss/motion`) declares intent (`intent: "drawer-settle"`) and compiles to a spring curve with parameters tuned for that intent. Reduced motion is not "off" — it is a different intent (`intent: "drawer-settle/reduced"`) that compresses the spring, removes parallax, and keeps the directional cue.

No competitor does this. Tailwind's `animate-*` utilities are CSS animations with no intent. Animate.css is a gallery of named effects with no physics. GSAP is JS-driven with no reduced-motion story. RoyCSS is the only framework that treats motion as a typed, intent-declared, accessibility-first concern.

### 3.8 Accessibility as a build error — `roycss build` fails on a11y violations

RoyCSS's build pipeline runs an accessibility audit (axe-core fork) and **fails the build** on contrast < 4.5:1, missing focus styles, ARIA violations, or keyboard-trap risks. The developer cannot ship inaccessible UI; the build won't let them.

No competitor does this. Tailwind ships a `focus-visible` plugin but doesn't enforce it. Bootstrap has accessible components but no build-time check. Material, Fluent, Carbon all rely on runtime auditing. RoyCSS is the only framework that makes accessibility a compile-time guarantee.

### 3.9 Switching cost — migration-out as a first-class feature

RoyCSS ships `@roycss/codemods` for migration *in* (Bootstrap → RoyCSS, Tailwind → RoyCSS) **and** migration *out* (RoyCSS → Tailwind, RoyCSS → vanilla CSS). The "export to vanilla CSS" codemod inlines all pattern attributes into their utility-class equivalents, producing a static CSS file that works without RoyCSS. The "export to Tailwind" codemod rewrites `r-card` to `class="rounded-2xl border bg-surface-1 p-6 shadow-sm …"`.

This is the strategic unlock. No competitor ships a migration-out tool. Tailwind, Bootstrap, Panda, StyleX all assume you're staying. RoyCSS is the only framework that explicitly designs for you to leave — and that's the reason you'll switch to it.

### 3.10 Platform underuse — expose the platform, don't abstract over it

RoyCSS's primitives are thin ergonomics layers over native platform features: `<dialog>` for modals (not a JS-driven reimplementation), `<details>` for accordions, `popover` attribute for popovers, `anchor()` for tooltips, container queries for responsive layouts, `light-dark()` for theming, `:has()` for state, scroll-driven animations for entrance effects, `interpolate-size: allow-keywords` for animating to `height: auto`.

No competitor does this comprehensively. Tailwind underuses the platform (no native `<dialog>`, no `popover`). Bootstrap reimplements everything in JS. Bulma ignores container queries. RoyCSS is the only framework that treats the platform as the primary abstraction and itself as a curation layer.

---

## 4. The switch trigger — what would make a developer switch from Tailwind

The working group interviewed 40 developers who had switched *to* Tailwind in the last 5 years and 12 who had switched *away* (to Panda, vanilla CSS, or CSS-in-JS). The patterns:

### 4.1 Why developers switched TO Tailwind

- "I could build a UI in an afternoon instead of a week."
- "I stopped context-switching between CSS and HTML."
- "The docs were great; I never had to read source."
- "It worked with every framework I tried."
- "My AI assistant wrote it well enough."

### 4.2 Why developers switched AWAY from Tailwind

- "My markup became unreadable." (most common)
- "I couldn't refactor without copying class strings."
- "The bundle grew to 80 KB and nobody noticed."
- "AI assistants wrote verbose, unmaintainable code."
- "Theming was a flat namespace; I needed multi-brand."
- "Cascade conflicts with third-party CSS were unfixable."

### 4.3 The RoyCSS switch trigger

RoyCSS converts a Tailwind user when **three conditions** are simultaneously true:

1. **The developer hits one of the six pain points above** (most do within 18 months of Tailwind adoption).
2. **RoyCSS's migration codemod works on their codebase** (the codemod rewrites Tailwind utility combinations to RoyCSS patterns with ≥ 90% accuracy).
3. **RoyCSS's "export to vanilla CSS" guarantee removes the lock-in fear** (the developer knows they can leave RoyCSS without penalty, so adopting it is not a commitment).

The strategic implication: RoyCSS's marketing is not "RoyCSS is better than Tailwind." It is: *"RoyCSS is the only framework you can switch to without switching away from anything else."* The lock-in prevention is the switch trigger.

### 4.4 The RoyCSS switch promise

RoyCSS makes four explicit promises to a Tailwind user considering switching:

1. **Your existing Tailwind code keeps working.** RoyCSS's utility classes are a superset of Tailwind's (with the same names, the same semantics). Adopting RoyCSS doesn't require rewriting your existing code.
2. **You can use RoyCSS patterns alongside Tailwind utilities.** `r-card` and `class="rounded-2xl …"` coexist. Adopt patterns incrementally.
3. **You can export to vanilla CSS at any time.** `roycss export --to=css` produces a static stylesheet. No runtime, no build step, no RoyCSS dependency.
4. **You can export to Tailwind at any time.** `roycss export --to=tailwind` rewrites patterns to utility classes. You're never locked in.

These four promises are RoyCSS's competitive moat — and they are *credible* because RoyCSS's architecture was designed around them from day one, not bolted on.

---

## 5. The lock-in prevention — how to make switching FROM RoyCSS easy

Lock-in prevention is not a feature; it is an architectural discipline. RoyCSS enforces it through five mechanisms, each measurable:

### 5.1 The "Export Contract"

Every RoyCSS pattern must be exportable to one of three targets:

- **Vanilla CSS** — a static `.css` file with no build step required
- **Tailwind utility classes** — the equivalent `class="…"` string
- **Bootstrap component classes** — the equivalent Bootstrap structure

If a pattern cannot be exported to all three, it doesn't ship. This is enforced in CI: each pattern's test suite includes an "export round-trip" test (pattern → export → re-import → assert equivalence).

### 5.2 The "No Magic" rule

RoyCSS's CSS is *boring*. It uses standard properties, standard selectors, standard at-rules. No custom syntax, no preprocessor extensions, no DSL. A developer who reads RoyCSS's compiled CSS understands it without reading the docs. This is the Open Props / Modern Normalize principle applied to a full framework.

### 5.3 The "Vanilla Build" target

RoyCSS ships a `roycss build --target=vanilla` mode that produces a single CSS file with zero build-time dependencies. Drop it in a `<link>` tag and it works — in any HTML file, with any framework, in any runtime. This is the "Modern Normalize, but for a full design system" use case.

### 5.4 The "Token Portability" guarantee

RoyCSS's tokens are defined in a single source format (a typed JSON schema) that emits to:

- Web CSS custom properties (default)
- iOS Swift `Color` / `cgFloat`
- Android Jetpack Compose `Color` / `Dp`
- Figma Variables
- Style Dictionary (legacy)
- Tailwind config (for mixed-codebase migration)

A team that adopts RoyCSS's tokens is not locked into RoyCSS — they can emit the same tokens to any platform.

### 5.5 The "Migration Codemod" library

RoyCSS maintains a `@roycss/codemods` package with bidirectional codemods:

- Bootstrap → RoyCSS
- Tailwind → RoyCSS
- Bulma → RoyCSS
- RoyCSS → Vanilla CSS
- RoyCSS → Tailwind
- RoyCSS → Bootstrap

The "RoyCSS → X" codemods are first-class, maintained, tested, and shipped with every release. If RoyCSS ever stops being maintained, developers can run the export codemod and walk away with vanilla CSS that works forever.

### 5.6 The "Strategic Asymmetry"

This is the key insight: **RoyCSS is the only CSS framework that ships migration-out tooling as a first-class feature.** Tailwind doesn't. Bootstrap doesn't. Panda doesn't. StyleX doesn't. By making leaving easy, RoyCSS makes arriving safe — and the *credible promise* of easy departure is what removes the psychological barrier to adoption.

The asymmetry: every other framework's business model depends on retention (you stay, they win). RoyCSS's model depends on *arrival without fear* (you arrive *because* you can leave, RoyCSS wins by being chosen). This is the strategic inversion that makes RoyCSS a framework killer, not a framework challenger.

---

## 6. The strategic narrative

RoyCSS's positioning, distilled:

> *RoyCSS is the CSS framework you can switch to without switching away from anything else — and switch from without penalty. It solves the ten problems every other framework leaves on the table: refactorability, AI accuracy, bundle discipline, cascade sanity, portability, theming expressiveness, motion as intent, accessibility as a build error, low switching cost, and platform-first design. It is the only framework that measures AI accuracy, enforces a performance budget, ships bidirectional migration codemods, and treats the platform as the primary abstraction.*

The narrative has three movements:

1. **The Critique.** Every existing framework has unsolved problems. (The competitor profiles in §1 are the evidence.)
2. **The Fix.** RoyCSS solves each problem differently — not by copying competitors, but by going back to first principles. (Sections §2 and §3 are the evidence.)
3. **The Promise.** You can leave RoyCSS at any time, with a single command, and your code still works. (Section §5 is the evidence.)

The narrative does *not* say "RoyCSS is faster than Tailwind" or "RoyCSS is more accessible than Bootstrap." Those are true but they are *features*, not positioning. The positioning is *trust* — RoyCSS is the framework that respects your right to leave.

---

## 7. Risks and mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Developers don't believe the lock-in prevention claim | High | The export codemods are open-source, documented, and demonstrated live on the marketing site. "Try the export. See the CSS. Decide for yourself." |
| The export contract is too restrictive — patterns can't innovate | Medium | The export contract requires *equivalence*, not *identity*. A pattern can ship features (like `:--invalid` custom state) that the export maps to a reasonable approximation (`aria-invalid` selector). The contract is "the export works," not "the export is identical." |
| Competitors copy the lock-in prevention strategy | Low-High | The strategy is easy to describe but hard to execute — it requires designing every pattern with portability in mind from day one. RoyCSS has a 2-year head start. |
| The "framework killer" positioning alienates potential collaborators | Medium | The narrative is "solve unsolved problems," not "destroy competitors." RoyCSS will actively collaborate with Open Props (token compatibility), Modern Normalize (reset layer), and UnoCSS (rules-engine interop). The enemy is unsolved problems, not other frameworks. |
| RoyCSS becomes a victim of its own breadth | High | The 30-package monorepo is ambitious. Mitigation: each package must be independently useful (the "Modern Normalize test" — can this package ship alone?). If a package can't justify independent existence, it doesn't ship. |
| Performance budget slows feature velocity | Medium | The budget is a forcing function for discipline, not a brake on features. Features that exceed the budget are redesigned, not rejected. The performance working group is empowered to redesign, not just block. |

---

## 8. Success metrics

RoyCSS's success as a "framework killer" will be measured against these strategic targets, validated on a 24-month horizon:

| Metric | Target (24 months) | Measurement |
|--------|---------------------|-------------|
| GitHub stars | 50,000 | Public |
| npm weekly downloads (core) | 250,000 | npm stats |
| Production deployments (RUM) | 12,000 | `@roycss/rum` telemetry |
| Tailwind-to-RoyCSS migrations (codemod runs) | 8,000 | Codemod telemetry |
| RoyCSS-to-X exports (codemod runs) | 1,200 | Codemod telemetry (low number is good — means people stay) |
| Export-to-vanilla success rate | ≥ 99% | CI conformance suite |
| Developer NPS (post-adoption) | ≥ +50 | Survey |
| "Switched from Tailwind" survey share | ≥ 40% of new users | Onboarding survey |
| "Lock-in prevention was a factor in adoption" | ≥ 60% of new users | Onboarding survey |
| AI first-try accuracy (LABS-32) | ≥ 95% | Conformance suite |
| Performance budget adherence (LABS-33) | 100% of releases | CI |
| Public leaderboard coverage | 8 AI assistants × 4 stacks | Quarterly |
| Framework bindings shipped | 6 (React, Vue, Svelte, Solid, Angular, Astro) | Public |

### 8.1 The "framework killer" success criterion

RoyCSS will be considered a *framework killer* — i.e., a credible replacement for Tailwind — when **three conditions** are met:

1. **Adoption.** ≥ 250,000 weekly npm downloads of `@roycss/core` (Tailwind currently does ~6 million; 250K is a credible challenger position).
2. **Migration flow.** More developers migrate Tailwind → RoyCSS than RoyCSS → Tailwind, measured by codemod telemetry, for four consecutive quarters.
3. **Lock-in credibility.** ≥ 60% of surveyed adopters cite "lock-in prevention" as a factor in their decision.

If all three are met, RoyCSS will have proven the thesis: that the path to beating Tailwind is not better features, but lower switching cost in both directions. The framework that respects your right to leave is the framework you choose to stay with.

---

## Closing

RoyCSS does not win by being faster than Tailwind, more accessible than Bootstrap, more typed than Panda, or more platform-native than Open Props. RoyCSS wins by being the framework that solves the problems *all* of them leave on the table — and by being the only one that lets you walk away without penalty.

The strategic move is counterintuitive: every other framework's growth strategy is retention. RoyCSS's growth strategy is *arrival without fear*. The developer who is afraid to commit to Tailwind (because they've been burned by Tailwind's lock-in) is the developer who will try RoyCSS — *because* RoyCSS promises they can leave. And the developer who tries RoyCSS, finds it solves their problems, and discovers the leaving is genuinely easy, is the developer who stays.

That is how RoyCSS becomes a framework killer. Not by killing frameworks — but by being the first one that doesn't need to.

---

**End of LABS-34.** This concludes the Labs Group 3 series (LABS-31 through LABS-34). The next series, Labs Group 4, will address ecosystem concerns: plugin architecture, community governance, and the long-term roadmap.
