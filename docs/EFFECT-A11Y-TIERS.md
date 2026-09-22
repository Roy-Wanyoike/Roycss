# RoyCSS Effect Accessibility Tiers

- **Owner:** accessibility / frontend area (see [`MAINTAINERS.md`](../MAINTAINERS.md))
- **Applies to:** every effect in the 1,973-effect catalog
  (`src/lib/effects-batch-{1..52}.ts`) — the tags ship in the npm package's
  source tree and are surfaced by the platform frontend
- **Related:** [`PENDING-FEATURES.md`](PENDING-FEATURES.md) PF-004 (this
  document + the code it documents are the *code half* of that item) ·
  [`tests/a11y/`](../tests/a11y) (the build-time axe audits — axe audit,
  keyboard navigation, visual checks) and the [`a11y/`](../a11y)
  static-analysis harness (contrast, keyboard-nav, reduced-motion,
  aria-coverage — see its README) ·
  [`scripts/generate-effect-a11y.ts`](../scripts/generate-effect-a11y.ts)
  (the generator) · `src/lib/effect-a11y.ts` (the generated data)

---

## 1. The one-paragraph version

Every RoyCSS effect carries three derived accessibility tags —
**motion-safe?**, **decoration-only?**, and **needs-aria-guidance?** — computed
by static analysis of its `cssCode` (not hand-labeled, not batch-edited).
They answer the three questions a builder actually asks before pasting an
effect into a product: *does it respect `prefers-reduced-motion` on its own?*
*does it change interactive semantics?* and *does it hide real text?* The
tags are surfaced as pills on every effect card and as a **Motion-safe only**
filter chip in the effects grid. The 1,592/381/1,668/305/89 numbers below (post-#189 wave + the #200 P1 UI-patterns batch: 14 new effects, all shipping their own reduced-motion guards)
are pinned by `tests/unit/effect-a11y.test.ts`, so they cannot silently
drift from the catalog.

## 2. The tiers

| Tag | Meaning | Count | Shown as |
|---|---|---|---|
| `motionSafe: true` | The effect's own CSS ships a `@media (prefers-reduced-motion: reduce)` guard. Safe to copy standalone. | **1,592** | — (drives the Motion-safe filter) |
| `motionSafe: false` | No per-effect guard. **Not** unsafe to install — see §4. | **381** | *Motion caution* pill (amber) |
| `decorationOnly: true` | No interactive pseudo-classes in the CSS — the effect is pure presentation; wrappers can be `aria-hidden` without losing semantics. | **1,668** | *Decorative* pill (muted) |
| `decorationOnly: false` | The CSS responds to user input (`:hover` / `:focus` / `:active` or form-state pseudo-classes) — interaction, so the element must remain focusable/perceivable. | **305** | — |
| `requiresAria: "<reason>"` | The CSS hides real text via a known pattern; the reason names the top-priority match. | **90** | *A11y note* pill (violet) |

The five `requiresAria` reasons, in priority order (one note per effect —
never double-flagged):

| Reason | Pattern | Guidance |
|---|---|---|
| `sr-only` | `clip: rect(…)` or the 1px + `overflow: hidden` visually-hidden box | Keep the readable text label for screen readers. |
| `attr-content` | `content: attr(…)` pseudo-element text | Make sure the real element still carries the text for assistive tech. |
| `gradient-clipped-text` | `background-clip: text` | Text disappears in forced-colors modes — provide a solid-color fallback. |
| `transparent-text` | bounded `color: transparent` / `-webkit-text-fill-color: transparent` | Pair with a screen-reader-visible label or keep it decorative. |
| `zero-font` | `font-size: 0` | Decorative spans only; keep real text in the markup. |

## 3. Derivation rules (and the honest decisions behind them)

Derived by `scripts/generate-effect-a11y.ts` from each effect's
comment-stripped `cssCode`:

1. **`motionSafe`** — literal `prefers-reduced-motion` in the cssCode.
2. **`decorationOnly`** — false when the cssCode matches
   `:(hover|active|focus)\b` (incl. `-visible`/`-within`) **or** any
   form-state pseudo-class (`:checked`, `:invalid`, `:required`, …).
3. **`requiresAria`** — the union of the five text-hiding patterns above;
   the value is the highest-priority match.

Honest decisions (each verified against the whole corpus, each documented
in the generator source so nobody "fixes" them by accident):

- **Hover IS interaction.** A `:hover` rule changes presentation in response
  to user input, so hover effects are flagged interactive-relevant:
  **302** effects match `:hover`/`:focus`/`:active`, **6** more match
  form-state pseudo-classes (5 of those match both), giving **305**
  interactive effects. The single form-state-only effect is
  `ferrum-accordion-slide` (`:checked`).
- **No effect uses `[aria-*]` or `[role]` selectors** (verified: zero
  matches in all 1,973 cssCodes) — so "interactive" rests entirely on the
  pseudo-class analysis above.
- **One effect ships an sr-only helper**: `ferrum-sr-only` (plus
  `ferrum-skip-link`, which uses the same visually-hidden recipe for its
  off-screen state — both carry the `sr-only` note).
- **`background-clip: text` suppresses the redundant transparent-text
  note.** The transparent fill is part of the gradient technique, so a
  gradient-text effect is reported once as `gradient-clipped-text`, not
  twice (47 effects match the pattern; 39 of them also set a transparent
  color).
- **`font-size: 0` is ranked below transparent-text** because every current
  occurrence (23/23 — all on decorative particle/seasonal spans) also sets a
  transparent color; the rule stays for future effects that collapse text
  without one.
- **The sr-only recipe deliberately does not match `clip-path: inset(…)`
  inside `@keyframes`.** Animated clipping (the glitch effects) is motion,
  not a visually-hidden recipe.
- **`text-indent` image replacement does not appear** in the corpus, so it
  has no rule.
- Pattern prevalence for the 90 `requiresAria` effects: gradient-clipped
  text 47 · bounded transparent text 67 · `attr()` content 17 ·
  `font-size: 0` 23 · sr-only recipes 2 — heavily overlapping, hence one
  ranked note per effect.

## 4. Regeneration, drift gates, and distribution

Regenerate the tags after any catalog change:

```
bun run gen:a11y        # or: bun run scripts/generate-effect-a11y.ts
```

The generator writes `src/lib/effect-a11y.ts` (checked in) — deterministic,
byte-stable, catalog order. It is **not** chained into
`scripts/build-package.ts`: it writes `src/`, not `dist/` — the same
precedent as `generate-docs-index.ts` → `src/lib/docs-data.ts`. Drift is
gated by `tests/unit/effect-a11y.test.ts` instead (id-set equality both
directions, per-effect rule re-derivation, and a file-level grep of the 52
batch sources on disk), so CI fails if the catalog changes without a
regeneration.

**Pinned distribution** (lockstep: generator output · generated module
header · the tests · this table):

| | Count |
|---|---|
| Total effects | 1,973 |
| Motion-safe (`motionSafe: true`) | 1,592 |
| Motion-caution (`motionSafe: false`) | 381 |
| Interactive (`decorationOnly: false`) | 303 |
| Decorative (`decorationOnly: true`) | 1,656 |
| Aria-required (`requiresAria` set) | 90 |

**The honest caveat (read this before rejecting an effect):**
`motionSafe: false` does **not** mean "unsafe to install." `dist/roycss.css`
ships a **global kill-switch** — an `@media (prefers-reduced-motion:
reduce)` block that disables every effect's animation when the user opts
out. The per-effect flag only tells **standalone copy-paste users** (people
who lift one effect's CSS without the stylesheet) that they may want to add
their own guard. If you install RoyCSS the documented way, the kill-switch
already covers you.

## 5. What this is not

This document is **derived, static, self-reported data** — a floor, not a
certification:

- It is **not** a WCAG 2.2 AA audit. PF-004's remaining acceptance items —
  a third-party WCAG 2.2 AA audit report (`docs/ACCESSIBILITY-AUDIT.md`)
  and a populated VPAT 2.4 EU edition (`docs/VPAT-2.4.md`), both signed by
  an external auditor against the live site — are **owner/external actions**
  that cannot be satisfied inside this repository.
- It does not test rendered output. The tags analyze `cssCode` text; the
  build-time audits in `tests/a11y/` and the Playwright e2e suite cover the
  running site.
- It does not certify copy-paste usage. What you wrap an effect around, and
  the ARIA you add (or deliberately omit) around hidden text, remains your
  accessibility decision — the `requiresAria` guidance tells you where one
  is needed.

## 6. Site-level a11y decisions (folded from the retired Task 06 per-fix audit log)

The per-effect tags above cover the catalog; the site chrome around them was
hardened in the Task 06 accessibility audit. That audit's working log
(removed 2026-09 — recoverable from git history) was folded here so the
durable decisions survive without a task log in the tree:

- **Color presets are Tailwind 600/700 shades, not 500 — on purpose.** The
  12 `COLOR_PRESETS` in `src/components/roycss/color-customizer.tsx` were
  re-pinned from Tailwind 500 to 600/700 variants so white-on-swatch clears
  the WCAG 1.4.11 non-text threshold (≥ 3:1) and preset-as-text clears
  1.4.3 on white and on the dark hero background. The 500 shades failed
  (e.g. emerald `#10b981` = 2.54:1, amber `#f59e0b` = 2.15:1, lime
  `#84cc16` = 1.98:1); the 600/700 shades pass. Migration: emerald
  `#10b981→#059669`, blue `#3b82f6→#2563eb`, violet `#8b5cf6→#7c3aed`,
  rose `#f43f5e→#e11d48`, amber `#f59e0b→#b45309`, cyan `#06b6d4→#0891b2`,
  orange `#f97316→#c2410c`, pink `#ec4899→#db2777`, lime `#84cc16→#4d7c0f`,
  red `#ef4444→#dc2626`, indigo `#6366f1` (kept), teal `#14b8a6→#0f766e`.
  Don't "lighten" them back to 500 — `a11y/contrast-check.ts` (36 checks)
  pins the decision.
- **Placeholder text is not an accessible name.** Every icon-only button
  and every unlabeled input got an explicit `aria-label` during the audit
  (favorites-sheet effect-preview button, search-clear button, ⌘K search
  input, effect-detail CSS editor textarea) — the `K1`/`K3` rules in the
  [`a11y/keyboard-nav.ts`](../a11y/keyboard-nav.ts) scanner enforce this
  class of regression.
- **Escape closes the ⌘K overlay from inside the input (defense in
  depth).** The parent page's global Escape listener is not relied on
  alone: the search input's own `onKeyDown` handles `Escape` too
  (WCAG 2.1.2 No Keyboard Trap), so the overlay can never trap keyboard
  users even if the parent listener regresses.
- **Verification gates.** The four-script harness — `a11y/contrast-check.ts`,
  `a11y/keyboard-nav.ts`, `a11y/reduced-motion.ts`, `a11y/aria-coverage.ts`
  (see the [`a11y/README.md`](../a11y/README.md)) — is the executable form
  of these decisions; all four must exit 0.
