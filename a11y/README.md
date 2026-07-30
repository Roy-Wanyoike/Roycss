# RoyCSS Accessibility Audit Harness (`a11y/`)

This directory contains the RoyCSS accessibility audit harness — a
four-script suite that verifies WCAG 2.1 AA compliance for the RoyCSS
marketing site at `/`.

## Quick start

```bash
# From the project root:

# 1. Color contrast (12 OKLCH presets × 3 backgrounds = 36 checks)
bun run a11y/contrast-check.ts

# 2. Keyboard navigation (static analysis, no server needed)
bun run a11y/keyboard-nav.ts

# 3. Reduced-motion CSS audit (static analysis, no server needed)
bun run a11y/reduced-motion.ts

# 4. ARIA coverage (static analysis, no server needed)
bun run a11y/aria-coverage.ts
```

All four scripts exit `0` on pass, `1` on fail. JSON results are written
to `a11y/results/<script-name>.json`.

## What each script verifies

### `contrast-check.ts` — WCAG 1.4.3 (Contrast) + 1.4.11 (Non-text Contrast)

Verifies all 12 OKLCH color presets (defined in
`src/components/roycss/color-customizer.tsx`) meet WCAG 2.1 AA contrast
thresholds against three backgrounds:

1. **White text on preset background** — the active-swatch check-icon
   scenario (WCAG 1.4.11 non-text UI, ≥ 3:1).
2. **Preset as text on white background** — preset used as a text color
   on a white surface (WCAG 1.4.3 large text, ≥ 3:1).
3. **Preset as text on dark hero background** — preset used as a text
   color on the dark hero background `oklch(0.21 0.034 264.67)`
   (WCAG 1.4.3 large text, ≥ 3:1).

The script implements the proper OKLCH → linear sRGB → relative
luminance → contrast ratio pipeline per the CSS Color Module Level 4
spec and the WCAG 2.1 §1.4.3 formula:

```
L = 0.2126·R + 0.7152·G + 0.0722·B  (sRGB linearized)
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

36 checks total (12 presets × 3 scenarios). Prints a table with both
4.5:1 (normal text) and 3:1 (large text + non-text UI) pass/fail columns.
A row "passes AA" if it meets the 3:1 threshold.

### `keyboard-nav.ts` — WCAG 2.1.1 (Keyboard) + 4.1.2 (Name, Role, Value) + 2.1.2 (No Keyboard Trap)

Static analysis of every `.tsx` file in `src/components/roycss/` for
keyboard-a11y anti-patterns:

| Code | Rule                                                           | WCAG                              |
| ---- | -------------------------------------------------------------- | --------------------------------- |
| K1   | Icon-only `<button>` without `aria-label` or visible text      | 4.1.2 A (Name, Role, Value)       |
| K2   | `<div onClick>` without `role="button"` AND `tabIndex`         | 2.1.1 A (Keyboard)                |
| K3   | `<input>` without `aria-label`, `aria-labelledby`, or label    | 1.3.1 A + 4.1.2 A                 |
| K4   | Custom `motion.div` overlay without Escape handler in file     | 2.1.2 A (No Keyboard Trap)        |
| K5   | `tabIndex={positive-integer}` (positive tabindex is forbidden) | 2.4.3 A (Focus Order)             |
| K6   | `<a target="_blank">` without `rel="noopener noreferrer"`      | Security + a11y (tab-nabbing)     |

The scanner uses a state machine that correctly skips template strings
and comments — so `<button` inside a `code={`...`}` template literal is
NOT flagged.

### `reduced-motion.ts` — WCAG 2.3.3 (Animation from Interactions)

Scans `src/app/globals.css` and `src/app/roycss.css` for the four
required "sledgehammer" guarantees inside a
`@media (prefers-reduced-motion: reduce)` block:

| Code | Guarantee                                                              |
| ---- | ---------------------------------------------------------------------- |
| G1   | `@media (prefers-reduced-motion: reduce)` block exists                 |
| G2   | `animation-duration ≤ 0.01ms !important` (or `animation: none`)        |
| G3   | `transition-duration ≤ 0.01ms !important` (or `transition: none`)      |
| G4   | `scroll-behavior: auto !important`                                     |

Also counts "surgical" per-selector `@media (prefers-reduced-motion:
reduce)` overrides (optional but encouraged for non-critical
animations).

### `aria-coverage.ts` — WCAG 4.1.2 (Name, Role, Value)

For each `.tsx` file, counts interactive elements (`<button>`, `<a>`,
`<input>`, `<select>`, `<textarea>`, `[role=*]`) and how many have an
accessible name (`aria-label`, `aria-labelledby`, visible text content,
or associated `<label htmlFor>`).

Threshold: overall coverage ≥ 95%.

## Files

```
a11y/
├── README.md                  This file
├── contrast-check.ts          Color contrast for 12 OKLCH presets
├── keyboard-nav.ts            Static analysis of keyboard a11y
├── reduced-motion.ts          CSS reduced-motion audit
├── aria-coverage.ts           ARIA coverage % per file
├── audit.ts                   (Existing) axe-core audit against live site
├── results/                   JSON output (regenerated each run)
│   ├── contrast.json
│   ├── keyboard-nav.json
│   ├── reduced-motion.json
│   └── aria-coverage.json
└── fixes/
    └── README.md              Log of every source fix applied during audit
```

## CI integration

All four scripts are designed to run in CI on every PR that touches
`src/components/roycss/` or `src/app/globals.css`. A failure blocks
merge. See `docs/plans/06-accessibility-architecture.md` §5 for the
GitHub Actions workflow.

## References

- ADR: `docs/adr/06-accessibility-architecture.md`
- Threat Model: `docs/threat-models/06-accessibility-architecture.md`
- Benchmarks: `docs/benchmarks/06-accessibility-architecture.md`
- Plan: `docs/plans/06-accessibility-architecture.md`
- Checklist: `docs/checklists/06-accessibility-architecture.md`
- WCAG 2.1: https://www.w3.org/TR/WCAG21/
