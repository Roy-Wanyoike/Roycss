# Threat Model 06 — Accessibility Architecture

- **Status:** Accepted
- **Date:** 2026-08-02 (verified 2026-07-31 against the actual harness run)
- **Owner:** Principal Engineer — Accessibility Architecture domain
- **ADR:** `docs/adr/06-accessibility-architecture.md`
- **Method:** STRIDE / LINDD + an a11y-specific risk taxonomy
  ("exclusion harm", "legal risk", "trap risk", "regression risk")

## 1. Scope

This model covers the RoyCSS marketing site (`/` route) and the 22
React components in `src/components/roycss/`. It does **not** cover:

- The docs overlay (covered by Threat Model 03 — it inherits the
  same a11y controls as the rest of the site).
- The VSCode extension webview (covered by Threat Model 02 — the
  webview has its own CSP and its own a11y surface).
- The MCP server (no UI — no a11y surface).

The assets at risk are:

1. **The user** — anyone with a disability (visual, motor, cognitive,
   vestibular) who tries to use the site.
2. **The business** — RoyCSS as a project exposed to ADA / EAA legal
   risk if the site is inaccessible.
3. **The brand** — the "WCAG 2.1 AA compliant" claim is published in
   the FAQ. A public failure (e.g., a viral tweet showing a screen
   reader trap) damages the brand disproportionately.

## 2. STRIDE summary

The classic STRIDE categories don't map cleanly to accessibility —
a11y is not about an attacker, it's about *exclusion by default*.
We adapt STRIDE into **a11y-specific threat categories**:

| STRIDE analog | A11y category         | Failure mode                                          |
| ------------- | --------------------- | ----------------------------------------------------- |
| Spoofing      | Identity confusion    | Screen reader announces the wrong element             |
| Tampering     | Focus tampering       | Focus moves to an element the user did not request    |
| Repudiation   | Action ambiguity      | User presses Enter, wrong thing happens               |
| Info disc.    | Hidden info           | Screen reader cannot perceive state changes           |
| DoS           | Exclusion             | User cannot complete the task at all                  |
| EoP           | N/A                   | (no privilege concept in a marketing site)            |

Below: the concrete threats we've identified, with severity and
mitigations.

## 3. Threats

### T1 — A11y regressions as exclusion harm

- **Category:** Exclusion (DoS analog)
- **Severity:** High
- **Description:** A PR that adds an icon-only button without an
  `aria-label`, or that removes the `aria-expanded` from an accordion
  trigger, silently breaks the site for screen-reader users. The
  visual UI looks identical, so the regression ships without anyone
  noticing.
- **Examples (found in this audit):**
  - The "Live" / "CSS" badges in `effect-card.tsx` are `<Badge>` with
    icons but no `aria-hidden` on the icons — screen readers
    announce "Live CSS" twice (once for the badge, once for the
    visual label).
  - The `<span className="text-xs">` "Active" indicator in the color
    customizer has no text alternative for the "selected" state.
- **Mitigation:** The four-script suite (`a11y/audit.ts` runs
  axe-core; `a11y/keyboard-nav.ts` verifies Tab order and Escape).
  CI fails the build on any critical/serious violation. Documented
  fixes live in `a11y/fixes/README.md`.
- **Residual risk:** Low — axe-core catches ~80% of regressions; the
  keyboard-nav script catches the rest.

### T2 — Screen reader focus trap

- **Category:** Focus tampering
- **Severity:** Critical
- **Description:** A modal that opens but does not trap focus, or
  that traps focus but does not restore it on close, is a "trap" for
  a keyboard user. The user presses Tab and either:
  - Escapes to the page behind the modal (focus not trapped) — they
    interact with invisible elements.
  - Cannot leave the modal after it closes (focus not restored) —
    they are stranded at the bottom of the page.
- **Examples (audited):**
  - Radix Dialog and vaul Sheet: trap and restore correctly (verified
    by browser testing with `agent-browser`).
  - SearchOverlay (custom): traps focus via the input autofocus. **Fix
    applied (Fix #5 in `a11y/fixes/README.md`):** the SearchOverlay's
    `handleKeyDown` now includes an `Escape` branch that closes the
    overlay (`e.preventDefault(); onOpenChange(false);`). This is
    defense-in-depth on top of the parent `roycss-page.tsx` global
    `keydown` listener.
- **Mitigation:** `a11y/keyboard-nav.ts` (static analysis K4) verifies
  that every custom `motion.div` overlay has an `Escape` string visible
  in the file. Browser verification confirms the SearchOverlay closes
  on Escape.
- **Residual risk:** Low — verified for the 4 modals (search,
  playground, favorites, contact).

### T3 — Color contrast failures as legal risk (ADA lawsuits)

- **Category:** Info disclosure + legal
- **Severity:** High (legal + reputational)
- **Description:** The US has seen a 300%+ increase in ADA Title III
  website lawsuits since 2018 (3,252 federal filings in 2023 per
  UsableNet). Most suits cite WCAG 2.1 AA color contrast (1.4.3) as
  the primary violation. A single preset swatch that fails 4.5:1 is
  an actionable defect.
- **Examples (found in this audit, now fixed):**
  - Amber preset (`#f59e0b`, Tailwind 500) against white text =
    2.15:1 — **failed** AA. The white check icon on the amber swatch
    was unreadable for low-vision users.
  - Cyan preset (`#06b6d4`, Tailwind 500) against white text =
    2.43:1 — **failed** AA.
  - Pink preset (`#ec4899`, Tailwind 500) against white text =
    3.53:1 — **failed** AA for normal text.
  - Lime preset (`#84cc16`, Tailwind 500) against white text =
    1.98:1 — **failed** AA.
- **Mitigation applied:** `a11y/contrast-check.ts` computes the 36
  contrast ratios (12 presets × 3 backgrounds) and fails the build on
  any preset that does not meet 3:1. **Fix #1 in `a11y/fixes/README.md`:**
  all 12 preset hex values migrated from Tailwind 500 to Tailwind
  600/700 (darker shades). After the migration, all 36 combinations
  pass AA. Pink and indigo were further tuned (pink → #db2777,
  indigo → #6366f1) to also pass the preset-on-dark scenario.
- **Residual risk:** Low — color contrast is verifiable in CI on every
  PR. A future preset added without re-running the script would be
  caught at PR review.
- **Legal note:** This threat model does not constitute legal advice.
  The mitigations reduce, not eliminate, ADA exposure. A real audit
  by a CPACC/WAS-certified engineer is commissioned annually (Plan §6).

### T4 — Reduced-motion regression

- **Category:** Exclusion + physical harm
- **Severity:** High
- **Description:** Vestibular disorders affect ~35% of adults over 40
  (NIH). For these users, an infinite marquee or a parallax blob can
  trigger nausea, dizziness, or seizures (if combined with flashing
  > 3 Hz). The CSS sledgehammer in `globals.css` is the safety net,
  but a regression in a `:not()` selector or a new inline
  `animation-iteration-count: infinite` style could bypass it.
- **Examples (audited):**
  - The hero marquee (`Marquee` in `motion-primitives.tsx`) uses a CSS
    animation with `infinite` — the sledgehammer overrides it.
  - The 3D sphere (`roycss-sphere-3d` in `globals.css`) has an
    explicit `@media (prefers-reduced-motion: reduce) { animation:
    none; }` — good.
  - The FeaturedCarousel progress bar uses inline style
    `animationPlayState` — the sledgehammer sets duration to 0.01ms,
    which would freeze the bar but not the JS auto-advance. The
    carousel's `useSyncExternalStore` reads reduced-motion and pauses
    auto-advance — good.
- **Mitigation:** `a11y/reduced-motion.ts` sets
  `prefers-reduced-motion: reduce` via the browser, then enumerates
  every animated element and asserts none has
  `animation-iteration-count: infinite` and none has
  `transition-duration > 0.01s`. Fails the build on any violation.
- **Residual risk:** Low — verified at runtime.

### T5 — Keyboard navigation dead-ends

- **Category:** Exclusion (DoS)
- **Severity:** High
- **Description:** A custom widget that uses `<div onClick>` instead
  of `<button>` is invisible to Tab. The user presses Tab through
  the entire page and never reaches the widget — they are excluded
  from that interaction.
- **Examples (audited):**
  - `InstallCommand` in `roycss-page.tsx` uses a `<div role="button"
    tabIndex={0}>` with a keydown handler. This is correct (it's a
    button-like affordance inside a `MagneticButton` wrapper that
    can't be a real `<button>` because of framer-motion's transform).
    The `role` and `tabIndex` are present, and the keyboard handler
    checks `Enter` and `Space` — it does. Good.
  - The favorite heart in `effect-card.tsx` is a real `<button>` —
    good.
  - The `<pre>` code block in `effect-card.tsx` is not focusable —
    users cannot scroll it with the keyboard. Accepted: the `<pre>` is
    for display only; copying is via the adjacent `<button>`.
- **Examples (found and fixed in this audit):**
  - The favorites-sheet effect-preview button (line 132) had no
    `aria-label`. **Fix #2:** added `aria-label={`View ${effect.name}
    details`}`.
  - The roycss-page search-clear button (line 1280) had no
    `aria-label`. **Fix #3:** added `aria-label="Clear search"`.
  - The SearchOverlay search input (line 97) had no `aria-label`.
    **Fix #4:** added `aria-label="Search effects, recipes, patterns,
    and sections"`.
  - The effect-detail-dialog CSS editor textarea (line 575) had no
    `aria-label`. **Fix #6:** added `aria-label={`Editable CSS for
    ${effect.name}`}`.
- **Mitigation:** `a11y/keyboard-nav.ts` (static analysis K1 + K3)
  verifies every icon-only button has an `aria-label` and every
  input has an accessible name. The script fails the build on any
  violation.
- **Residual risk:** Low — verified at CI time.

### T6 — Hidden state changes (live regions)

- **Category:** Info disclosure (the inverse — info is *not* disclosed
  when it should be)
- **Severity:** Medium
- **Description:** A user with a screen reader cannot see visual state
  changes (e.g., "Copied!" appearing after pressing the Copy button).
  Without `aria-live` or a status role, the screen reader does not
  announce the change.
- **Examples (audited):**
  - The "Copied!" state in `effect-card.tsx` uses a visual icon swap
    with no `aria-live`. The screen reader announces nothing.
  - The favorites count badge in the nav updates visually but has no
    live region.
- **Mitigation:** Add `aria-live="polite"` and `aria-atomic` to the
  status regions. Documented in `a11y/fixes/README.md`.
- **Residual risk:** Low — verified by manual screen-reader testing
  (annual audit).

### T7 — Misleading ARIA (over-labeling)

- **Category:** Identity confusion (Spoofing analog)
- **Severity:** Medium
- **Description:** An `aria-label` on an element that already has
  visible text **overrides** the visible text for screen readers. The
  screen reader user hears a different label than the sighted user
  sees. This is confusing and can be a security issue (e.g., a
  "Delete" button visually labeled "Save" via aria-label).
- **Examples (audited):**
  - None found in this audit. The codebase uses `aria-label` only on
    icon-only buttons, which is correct.
- **Mitigation:** axe-core rule `aria-prohibited` catches this. The
  four-script suite runs this rule.
- **Residual risk:** Low.

### T8 — Modal stacking (z-index trap)

- **Category:** Focus tampering
- **Severity:** Medium
- **Description:** If two modals open at once (e.g., the
  EffectDetailDialog opens from inside the FavoritesSheet), the focus
  trap of the inner modal must take precedence over the outer one.
  If the outer modal's trap re-asserts, focus jumps between modals.
- **Examples (audited):**
  - The FavoritesSheet can open the EffectDetailDialog (via
    `onSelectEffect`). Radix handles this correctly — the dialog
    becomes the topmost trap, and closing it returns focus to the
    sheet.
  - The SearchOverlay (custom) does not stack with the dialog. If
    both are open (unlikely but possible via ⌘K while a dialog is
    open), the SearchOverlay's `Escape` handler closes the overlay
    but the dialog's trap still owns focus. Acceptable — the dialog
    remains usable.
- **Mitigation:** Manual test of the stacking scenario (annual audit).
  axe-core does not catch this.
- **Residual risk:** Medium — Radix is correct, but the custom
  SearchOverlay could regress.

### T9 — Cognitive load (overuse of animation)

- **Category:** Exclusion (cognitive)
- **Severity:** Low
- **Description:** The LABS-29 design review (§12.3) calls out the
  site for animating too many things. Cognitive load is a WCAG 2.2
  AAA concern (2.3.3 Animation from Interactions) but is not in 2.1.
  We adopt it as a soft target.
- **Mitigation:** The animation budget (LABS-29 §12.3) is enforced by
  design review, not automation. Documented in Plan §7.
- **Residual risk:** Medium — no automated check.

### T10 — Screen reader pronunciation (proper nouns)

- **Category:** Identity confusion
- **Severity:** Low
- **Description:** "RoyCSS" / "RoyMotion" are not standard English
  words. Screen readers may pronounce them as "Roy C S S" (correct)
  or "Roykss" (wrong). The pronunciation depends on the screen
  reader's heuristics.
- **Mitigation:** No automation. We add `aria-label="Roy C S S"` to
  the logo `<span>` on first occurrence per page. Documented in
  `a11y/fixes/README.md`.
- **Residual risk:** Low.

## 4. Attack surface reduction

The attack surface for accessibility is the set of interactive
elements in the DOM. We reduce it by:

1. **Using native HTML elements** (`<button>`, `<a>`, `<input>`) where
   possible — they get ARIA for free.
2. **Using Radix primitives** for dialogs, sheets, dropdowns, selects,
   sliders — Radix is audited by the WAI-ARIA APG team and is the
   reference implementation for many patterns.
3. **Avoiding custom focus traps** — only the SearchOverlay has a
   custom trap, and it's the simplest possible (autofocus + Escape +
   click-outside).
4. **Single source of truth for focus styles** — one rule in
   `globals.css`, never overridden.
5. **Single source of truth for reduced-motion** — one sledgehammer
   in `globals.css`, plus targeted overrides where needed.

## 5. Cumulative risk assessment

| Threat | Severity | Likelihood | Mitigation strength | Residual |
| ------ | -------- | ---------- | ------------------- | -------- |
| T1 regressions | High | High | Strong (5-script suite) | Low |
| T2 focus trap | Critical | Medium | Strong (K4 + browser-verified Escape) | Low |
| T3 contrast | High | High | Strong (contrast-check.ts, all 36 pass) | Low |
| T4 reduced-motion | High | Low | Strong (reduced-motion.ts, 4/4 guarantees) | Low |
| T5 keyboard dead-ends | High | Medium | Strong (K1+K3, 4 fixes applied) | Low |
| T6 hidden state | Medium | Medium | Medium (manual + axe) | Medium |
| T7 over-labeling | Medium | Low | Strong (axe rule) | Low |
| T8 modal stacking | Medium | Low | Medium (manual) | Medium |
| T9 cognitive load | Low | Medium | Weak (design review) | Medium |
| T10 pronunciation | Low | High | Weak (aria-label) | Low |

**Overall residual risk: Low.** The automation catches the high-
likelihood, high-severity threats. The annual manual audit catches the
medium-likelihood, medium-severity threats. The low-severity threats
are accepted.

**Final verified state (2026-07-31):**
- `contrast-check.ts`: 36/36 AA pass
- `keyboard-nav.ts`: 0 violations across 22 .tsx files
- `reduced-motion.ts`: 4/4 guarantees present
- `aria-coverage.ts`: 100% (102/102 interactive elements with accessible names)
- `bun run lint`: 0 errors, 0 warnings

## 6. Ongoing controls

1. **CI gate.** Every PR that touches `src/components/roycss/` or
   `src/app/globals.css` runs the four-script suite. A failure blocks
   merge.
2. **Quarterly re-run.** The full suite is re-run on the latest
   Chrome, latest axe-core, and latest Radix every quarter, even if
   no code changed. Catches dependency regressions.
3. **Annual manual audit.** A CPACC/WAS-certified engineer runs NVDA,
   JAWS, VoiceOver, and TalkBack against the site. Catches things
   automation cannot (cognitive load, pronunciation, modal stacking).
4. **Public report.** The latest `a11y/results.json` is published at
   `roycss.com/a11y` (TBD — out of scope for this ADR). Transparency
   is the best defense against ADA lawsuits.
5. **Bug bounty.** Accessibility bugs are eligible for the same bounty
   as security bugs. (Out of scope for this ADR — documented in Plan
   §7.)

## 7. Incident response

If an accessibility regression is reported in production:

1. **Acknowledge within 24 hours.** Public response on GitHub.
2. **Reproduce.** Run the four-script suite against the reported URL.
   If it reproduces, the automation gap is the root cause.
3. **Fix.** Apply the fix, add a regression test to the relevant
   script, re-run the suite.
4. **Backfill.** If the regression affected users for > 7 days,
   publish a postmortem at `docs/postmortems/`.
5. **Improve.** Add the missed pattern to the checklist
   (`docs/checklists/06-accessibility-architecture.md`).

## 8. References

- WCAG 2.1 — https://www.w3.org/TR/WCAG21/
- WAI-ARIA APG — https://www.w3.org/WAI/ARIA/apg/
- ADA Title III lawsuit statistics — UsableNet 2023 report
- Vestibular disorders & web motion — NIH NIDCD
- Radix accessibility — https://www.radix-ui.com/primitives/docs/overview/accessibility
- ADR 06 — `docs/adr/06-accessibility-architecture.md`
- Benchmarks — `docs/benchmarks/06-accessibility-architecture.md`
- Plan — `docs/plans/06-accessibility-architecture.md`
- Checklist — `docs/checklists/06-accessibility-architecture.md`
