# LABS-29 — Apple Human Interface Design Review

**Status:** Internal critique
**Author:** RoyCSS Core Team (writing as if reviewed by Apple's HI team)
**Audience:** Maintainers, designers, contributors
**Method:** Walk every surface of the current RoyCSS implementation — hero, nav, effects grid, effect detail dialog, color customizer, favorites sheet, Get Started guide, RoyMotion showcase, docs section, FAQ, footer — and grade it the way Apple's Human Interface team would grade it. Brutally. Then propose a better solution for every criticism. The goal is craftsmanship, not features.

---

## 0. The standard we are measuring against

Apple's Human Interface Guidelines are not a style guide. They are a discipline. The discipline says: every pixel has a reason, every animation has a purpose, every name has been argued about, every spacing value has been chosen and not defaulted, every edge case has been designed for, and the whole thing feels like it was made by someone who cared more than the user will ever notice.

RoyCSS, today, is made by someone who cares. It is not yet made to that standard. Below is the gap, surface by surface, with proposed fixes. We do not optimize for adding features. We optimize for the removal of every flaw a careful eye would catch.

---

## 1. The hero section

### 1.1 Critique

The hero today combines an animated logo, a headline, a subhead, two CTAs, a stats strip, a marquee, a parallax layer, and a cursor glow. Each of these is fine in isolation. Together they are noise.

- **The animated logo and the headline compete for the eye.** The viewer does not know where to look first. Apple heroes have exactly one focal point.
- **The stats strip ("700 effects, 20 categories, 24 components") is a scoreboard, not a value proposition.** A user does not care about the count; they care about whether the library solves their problem.
- **The marquee underneath the hero loops forever.** An infinite animation in the hero is a tax on attention that never pays off. The user cannot read the marquee and the headline at the same time.
- **The cursor glow follows the pointer with a spring.** It is a delightful detail in a vacuum and a distraction in context. On a hero that already has a logo animation, a marquee, and a stats strip, it is one motion too many.
- **The vertical rhythm is inconsistent.** The headline, subhead, CTAs, and stats use four different spacing values where one or two would do.

### 1.2 Better solution

Strip the hero to three elements: a wordmark, one sentence, one primary action. Everything else moves below the fold or is deleted.

- The wordmark is static. Motion is reserved for moments that communicate state change. A logo that animates on load communicates "we are showing off," not "we are useful."
- The headline is one line: "CSS effects, copy-paste, no runtime." It states what the product is.
- The subhead is one line: "A curated library of effects for modern web UI."
- The primary action is one button: "Browse effects." There is no secondary CTA. A user who wants docs can scroll; a user who wants the catalog clicks.
- The stats strip becomes a single quiet line at the bottom of the hero, in muted type, with no animation. "180 effects · 6 categories · zero runtime."
- The marquee, the parallax, and the cursor glow are deleted from the hero. If any of them earn a place, it is in a dedicated showcase section, not in the first thing a user sees.

The hero's vertical rhythm collapses to two values: the space above the headline and the space below it. Every other gap is a multiple of one of those two.

---

## 2. The navigation bar

### 2.1 Critique

The current nav carries: a logo, a "Browse" anchor, a "Docs" anchor, a "RoyMotion" anchor, a "Get Started" anchor, a theme toggle, a GitHub link, and a favorites button with a counter badge. Eight items.

- **Eight items is too many.** Apple's app-level navigation rarely exceeds five. Each item competes for attention and dilutes the others.
- **"RoyMotion" is a sub-brand in the nav.** It signals that the team thinks RoyMotion is a peer of RoyCSS, which it is not. It is a feature.
- **The favorites counter badge is a notification pattern used for a content function.** A red dot on a heart icon triggers a "something needs my attention" response. There is nothing to attend to.
- **The theme toggle is a sun/moon icon pair.** It works, but the transition between themes is a hard cut. Apple's apps cross-fade or invert in a single gestalt motion.
- **The sticky behavior is implemented with a backdrop blur that turns on at scroll.** The transition is jittery on low-end devices and the blur radius is heavy.

### 2.2 Better solution

Collapse the nav to four items: wordmark, "Effects," "Docs," "GitHub." Theme toggle lives in a settings menu, not in the chrome. Favorites move to a bookmarklet or are deleted (see LABS-28). RoyMotion becomes a section inside Docs, not a top-level nav item.

The theme transition becomes a cross-fade driven by `view-transition-name` on the root. The backdrop blur is replaced by a solid translucent background that does not require a GPU filter. The sticky behavior is implemented with `position: sticky` and no scroll listener — no JavaScript, no jitter.

---

## 3. The effects grid

### 3.1 Critique

The grid is the heart of the product. Today it shows effect cards in a responsive grid with category filtering, search, and a sticky category nav above it.

- **The card density is inconsistent.** Some cards have a tall preview; some have a square preview; some have a wide preview. The grid looks ragged.
- **Every card animates on scroll into view.** A grid of 180 cards, each animating, is a wall of motion. The user cannot tell which card they are supposed to look at.
- **The hover affordance is a lift, a glow, and a reveal of action buttons — three things at once.** Apple's hover affordances do one thing.
- **The "favorite" heart on each card is a fifth element** competing with the preview, the name, the description, and the copy button.
- **The card preview backgrounds are not unified.** Some previews are on dark, some on light, some on gradient. The grid has no consistent canvas.
- **Empty state.** When search returns no results, the grid shows a centered "no results" string. There is no suggested next action.

### 3.2 Better solution

- **Unify the preview canvas.** Every card preview sits on the same neutral canvas, with a single toggle (in the nav, not on each card) to switch the global canvas between light, dark, and "preview in context." This makes the grid readable as a grid.
- **Standardize card aspect ratio.** Every card is a 4:3 preview above a fixed-height caption. The grid is uniform.
- **Remove the on-scroll entrance animation.** Cards simply appear. Motion is reserved for the moment a card is interacted with.
- **Hover does one thing:** it elevates the card by 2px and dims the rest of the grid by 4%. That is enough.
- **Delete the favorite heart from the card.** If favorites survive at all, they live behind a long-press or a context menu, not as a permanent icon on every card.
- **Empty state becomes a suggestion.** "No effects match `glow border`. Try `edge` category, or clear filters." With a button.

---

## 4. The effect detail dialog

### 4.1 Critique

The dialog is where a developer decides whether to use an effect. Today it shows: a large preview, a code panel with copy button, a "customizer" tab, a "framework usage" tab, a "related effects" strip, a theme toggle for the preview, a maximize button, a reset button, and a tags row.

- **The dialog has too many tabs.** Customizer, framework usage, and related effects are three different jobs. A dialog should do one job: show the effect and its code.
- **The customizer tab lets the user change three or four CSS variables via sliders.** The sliders have no numeric readout, no preset values, and no way to copy the customized state into the code panel. It is a toy.
- **The framework usage tab shows the same class in seven frameworks.** The class is identical in all seven. The tab exists to reassure, not to inform.
- **The preview background toggle (dark/light/gradient) is a tri-state that uses three icons.** The icons are not labeled. A user must hover to learn what they do.
- **The maximize button expands the dialog to near-fullscreen.** The expansion uses a transform animation that reflows the layout mid-animation, causing a visible jump.
- **The reset button is a circular arrow with no label and no confirmation.** A misclick discards the user's customization.
- **The related effects strip is a horizontal scroll.** It is not keyboard-accessible and it duplicates search.

### 4.2 Better solution

- **Collapse the dialog to two panes:** preview on top, code on bottom. Tabs are deleted. Customization happens by editing the custom properties directly in the code panel (with inline hint chips for the legal values).
- **Delete the customizer tab.** If users need a visual customizer, the browser DevTools already provide one. The dialog should show the code, not hide it behind a UI.
- **Delete the framework usage tab.** Replace with a one-line note under the code: "Works in any framework — add the class to any element."
- **Replace the tri-state background toggle with a single labeled toggle:** "Preview on light / Preview on dark." Two states, one label, one tap.
- **The maximize action becomes a full-page route** (`/effects/<id>`), not a dialog state. The browser's back button handles the exit. No layout jump.
- **The reset button gets a label and a confirmation** for destructive actions, or is removed in favor of a "discard changes" affordance in a footer.
- **Delete the related effects strip.** Replace with a single "See similar" link at the bottom of the dialog that runs the relevant search.

The dialog becomes small, fast, and focused. It opens in 100ms, shows what the developer needs, and gets out of the way.

---

## 5. The color customizer

### 5.1 Critique

The customizer is a panel that exposes the OKLCH tokens of the current effect and lets the user drag hue, saturation, and lightness sliders. It updates the preview live.

- **OKLCH is the right color space.** The sliders are the wrong interface. Hue, saturation, and lightness are three orthogonal axes that interact non-linearly; dragging one usually breaks the others. A user who wants "a warmer accent" does not want to think in HSL components.
- **The slider thumb positions do not match the OKLCH values shown.** The numeric readout says `oklch(62% 0.21 264)` but the slider thumb is at an arbitrary pixel position. The two representations disagree.
- **There is no preset palette.** A user who wants a tasteful alternative has to drag blindly.
- **The customized state is not persisted.** Closing the dialog loses the work.
- **The customized state is not reflected in the copied code.** The "copy CSS" button copies the original, not the customized version. This is the worst kind of UI: it looks like it works, but it lies.

### 5.2 Better solution

In LABS-28 we proposed deleting the customizer entirely. If it survives, it must be rebuilt:

- **Replace the three sliders with a curated palette** of 8–12 accent colors, each chosen by a designer, each tested for contrast against the effect's background. The user picks a swatch, not a coordinate.
- **Add a "custom" swatch** that opens the browser's native `<input type="color">` for advanced users. The native picker is better than any custom slider.
- **Show the resulting OKLCH value as text** next to the swatch, so developers learn the system by osmosis.
- **Persist the choice to `localStorage`** and reflect it in the copied code. If the UI shows a customized effect, the copied CSS must contain the customization. This is non-negotiable.

If we cannot meet that bar, we delete the customizer. Half-built customizers are worse than none.

---

## 6. The favorites sheet

### 6.1 Critique

The favorites sheet slides in from the right and shows the user's starred effects as a list, with a button to export them as a `.css` file.

- **The sheet duplicates the catalog.** A list of favorited effects is a catalog with a filter applied. It should be a filtered view of the catalog, not a separate UI.
- **The export feature produces a `.css` file with no comment header, no version stamp, no license note.** A developer who imports that file into a repo has no idea where it came from or what version it is.
- **The sheet's entrance animation is a slide-in with a backdrop fade.** The backdrop fade uses a 200ms opacity transition; the slide uses a 300ms transform. They do not finish together. The eye notices.
- **The empty state says "No favorites yet."** It does not suggest how to add one.

### 6.2 Better solution

Per LABS-28, the favorites system is deleted from the library. If it survives as a docs-site feature:

- **Favorites become a URL query parameter** (`?favorites=id1,id2,id3`) that filters the catalog. No separate sheet, no separate state model.
- **Export produces a file with a header** containing the RoyCSS version, the date, the license, and a comment per effect with its ID and a link back to the docs.
- **The entrance animation is unified** to a single 220ms curve, with the backdrop and the panel finishing on the same frame.
- **The empty state becomes a suggestion** with a button: "Tap the heart on any effect to save it here. Browse effects →"

---

## 7. The Get Started guide

### 7.1 Critique

The Get Started section is a multi-step onboarding: install, import, pick an effect, copy the class, customize, deploy.

- **It is too long.** Six steps for a CSS library is four steps too many. A CSS library's onboarding is: "add this stylesheet, add this class." Two steps.
- **It uses a tabbed interface for framework choice** (React/Vue/Angular/Svelte/Solid/Astro/vanilla). The tabs imply the steps differ by framework. They do not. The class is the same.
- **The code samples are not copyable as a block.** Each line has its own copy button. A developer wants to copy the whole snippet.
- **The "customize" step teaches the customizer UI**, which (per §5) is broken. Onboarding that teaches a broken feature is worse than no onboarding.
- **The "deploy" step is generic advice** ("ship to your hosting provider") with no real content.

### 7.2 Better solution

- **Three steps, full stop.** 1. Add the stylesheet. 2. Add a class to any element. 3. Override the custom properties if you want to rebrand.
- **One framework-agnostic snippet** at the top. Below it, a one-line note: "RoyCSS is CSS. It works in every framework the same way."
- **Whole-snippet copy buttons**, not per-line.
- **The customize step teaches the custom properties table**, not the customizer UI. Developers learn the real API, not a demo-site convenience.
- **The deploy step is deleted.** Shipping CSS to production is the developer's job, not the library's tutorial.

---

## 8. The RoyMotion showcase

### 8.1 Critique

The RoyMotion showcase is a section of the docs site that demos the RoyMotion primitives — magnetic buttons, tilt cards, marquees, staggered reveals, and so on.

- **The showcase is the most beautiful part of the site and the least honest.** It demos RoyMotion, but RoyMotion is a wrapper around Framer Motion. A developer who copies the showcase gets a dependency on Framer Motion and on RoyMotion. The showcase does not say this.
- **The showcases have no source code visible.** They are closed boxes. A developer cannot learn from them; they can only admire them.
- **The showcases run continuously.** Marquees scroll, tilt cards tilt on a timer, gradient text shimmers. The page never rests.
- **The showcase uses different spacing and typography than the rest of the site.** It feels like a different team built it.

### 8.2 Better solution

- **Per LABS-28, RoyMotion is deleted as a runtime.** The showcase becomes a **recipes gallery**: short, copy-pasteable compositions of native CSS and (where genuinely needed) Framer Motion, applied to RoyCSS effects.
- **Every recipe shows its source code inline.** The showcase and the docs are the same thing.
- **Recipes respect `prefers-reduced-motion`.** A user who has reduced motion enabled sees the static end state, not the animation. The current site does not do this consistently.
- **The showcase uses the same spacing scale, the same type scale, and the same canvas as the rest of the site.** No special typography for the pretty section.

---

## 9. The docs section

### 9.1 Critique

The docs section today covers: installation, tokens, categories, the CLI, framework adapters, the customizer, the favorites system, RoyMotion, and the VS Code extension.

- **The docs document features that LABS-28 proposes to delete.** They are extensive in the wrong direction.
- **The docs have no version selector.** A reader on an old version of the library cannot find the docs for their version.
- **The docs have no search.** A reader looking for "how do I change the accent color" must guess that it lives under "tokens."
- **The docs have no edit-on-GitHub link.** A reader who spots an error cannot fix it in one click.
- **The docs use a sidebar with no progress indicator.** A reader does not know how far through a page they are.
- **Code samples in the docs are not tested.** They may have rotted.

### 9.2 Better solution

- **Rewrite the docs for the post-cut library.** Sections: Introduction, Installation, Tokens, Effects catalog, Recipes, Modern CSS guide, Migration guide, Contributing. Eight pages, no more.
- **Add a version selector** in the header. Each minor release snapshots the docs to a versioned path (`/docs/2.3/...`). The default path always points to latest.
- **Add Algolia DocSearch** or an equivalent. One search box, one keystroke (`/`), one result list.
- **Add an "Edit this page" link** on every doc page. The link opens the GitHub source at the right line.
- **Add a thin progress bar** at the top of each doc page, driven by `animation-timeline: scroll()`. No JavaScript.
- **Test every code sample in CI.** A failing sample fails the build. Docs that lie are worse than no docs.

---

## 10. The FAQ

### 10.1 Critique

The FAQ is an accordion of common questions: "Is RoyCSS free?", "Does it work with React?", "Can I use it commercially?", "How do I customize colors?", "Is it accessible?".

- **The accordion hides the answers.** A user who lands on the FAQ page sees a list of questions and must click each one to learn anything. The default state is uninformative.
- **The questions are not the questions users actually ask.** They are the questions the team wants to answer. Real FAQs include: "Why is my effect not animating?", "How do I turn off an effect on mobile?", "Does this work without JavaScript?", "What's the bundle size?".
- **The "Is it accessible?" answer is a paragraph of reassurance** with no specifics. It does not link to an audit, a VPAT, or a list of known issues.

### 10.2 Better solution

- **Render the FAQ as plain prose** with headings, not an accordion. The page is scannable; the answers are visible.
- **Replace the questions with the real ones**, gathered from GitHub issues and Discord. The team maintains a "top 20 questions" list and the FAQ reflects it.
- **The accessibility answer links to a real audit**, lists the WCAG criteria the library meets, and lists the known gaps. Honesty builds trust.

---

## 11. The footer

### 11.1 Critique

The footer has: a logo, a tagline, four columns of links (Product, Docs, Community, Legal), a newsletter signup, social icons, and a copyright line.

- **Four columns of links is too many for a library with eight doc pages.** Half the links point to pages that do not exist or are stubs.
- **The newsletter signup has no privacy note.** A user who enters their email does not know what they are signing up for, how often they will be emailed, or how to unsubscribe.
- **The social icons include platforms the team is not active on.** A Twitter icon that links to a dormant account is worse than no icon.
- **The copyright line says "© 2025 RoyCSS."** It does not say "Made with care by [name]." It is impersonal.

### 11.2 Better solution

- **Two columns of links, max.** Docs and Community. Everything else is one click away from those.
- **The newsletter signup gets a one-line privacy note:** "One email per release. No tracking. Unsubscribe in one click."
- **Social icons link only to platforms the team actively maintains.** If that is one platform, the footer shows one icon.
- **The copyright line becomes a credits line:** "RoyCSS is built by a small team and a community of contributors. Source on GitHub." With a link.

---

## 12. Cross-cutting concerns

### 12.1 Spacing

The current site uses Tailwind's default spacing scale, which is fine, but the *application* of the scale is inconsistent. Section padding varies between 64px, 80px, 96px, and 128px with no visible rule.

**Fix:** Adopt a two-value section rhythm. Sections are either `py-16` (tight) or `py-32` (loose), and the choice follows a rule: tight between related content, loose between unrelated content. Document the rule in the design tokens page. Enforce it with a lint rule on the docs code.

### 12.2 Typography

The site uses Inter for body and a display face for headlines. The display face is loaded as a webfont with no fallback strategy beyond `sans-serif`.

**Fix:** Define a typographic scale of six sizes (`xs`, `sm`, `base`, `lg`, `xl`, `2xl`) and use only those. Define a font stack with a designed fallback (`Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`) so the layout does not shift when the webfont loads. Use `font-display: swap` and preload the critical weights only.

### 12.3 Animation

The site animates too many things. Cards on scroll, marquees, cursor glow, parallax, gradient text, hover lifts, dialog entrances, sheet slides, theme toggles, logo motion.

**Fix:** Adopt an animation budget. The site may have, at most: one ambient motion (a single, slow, optional element), one interaction motion per element (hover or click, not both), and one transition motion per route change. Everything else is static. Respect `prefers-reduced-motion` everywhere, with a single global rule that disables all non-essential animation.

### 12.4 Naming

The codebase mixes naming conventions: `roycss-fade-up`, `RoyMotion.ScrollReveal`, `useFavorites`, `EffectDetailDialog`, `catIcons`, `effectsBatch14`. PascalCase, camelCase, kebab-case, and a private prefix all coexist.

**Fix:** Adopt three rules. (1) CSS classes are kebab-case with the `roycss-` prefix. (2) React components are PascalCase with no prefix. (3) Hooks are `useFoo`. (4) Internal modules are camelCase. Document the rules. Enforce with ESLint.

### 12.5 Iconography

The site uses lucide-react for icons. The choice is fine; the *use* is not. Some buttons have icons without labels. Some have labels without icons. Some have both, with no rule for when.

**Fix:** Adopt one rule: an icon without a label is allowed only when the icon is universally understood (search, close, menu, back). Everything else gets a label, an icon, or both — chosen by a designer, not defaulted.

### 12.6 Color

The site uses OKLCH, which is correct. The *palette* is not designed; it is the default Tailwind palette reskinned in OKLCH.

**Fix:** Define a small, opinionated palette: one neutral (a cool gray), one accent (a single hue, chosen by a designer, tested for contrast at every weight), and one each for success, warning, and danger. Six colors, five weights each. No more. Document the palette. Delete every other color from the codebase.

### 12.7 Accessibility

The site has not been audited. The worklog lists "No accessibility audit (WCAG compliance)" as a known gap.

**Fix:** Commission an audit against WCAG 2.2 AA. Fix every finding. Publish the audit. Add an `a11y` section to every effect in the catalog: "This effect respects `prefers-reduced-motion`. This effect does not animate text content. This effect has a static fallback." Effects that cannot meet the bar are deleted or marked experimental.

### 12.8 Performance

The site loads React, Framer Motion, Radix, lucide-react, and the 700-effect CSS bundle on every page.

**Fix:** Per LABS-28, the runtime is deleted from the library. The docs site loads only what each page needs. The catalog page paginates or virtualizes the effect list. The effect CSS is split by category and loaded on demand. Lighthouse performance score targets 95+ on every page.

---

## 13. The grade

If Apple's HI team graded RoyCSS today, the grade would be **C+**. The ideas are right, the execution is uneven, the details have not been argued about. The path to an A is not more features; it is the removal of every flaw a careful eye would catch, and the disciplined application of a small set of rules across every surface.

The fix is not a project. It is a habit. Every PR is reviewed against the rules in this document. Every surface is held to the standard. The library becomes quieter, more consistent, more confident. That is what craftsmanship looks like.

---

## 14. Closing

Apple's design language is not magic. It is the accumulated result of saying "no" to a thousand small things, and "yes" to a small number of things said very well. RoyCSS can do the same. The work in this document is the work of saying no — to the marquee, to the cursor glow, to the tri-state toggle, to the eight-item nav, to the broken customizer, to the untested code samples — and saying yes, very well, to a hero with three elements, a nav with four items, a dialog with two panes, and a catalog that reads like a single thought.

The result will not look like Apple. It will look like RoyCSS, finally finished.
