# RoyCSS Accessibility Fixes Applied

This file documents every source-code fix applied during the Task 06
accessibility audit. Each entry includes the file, the violation code,
the WCAG criterion violated, the before/after diff, and the threat
model threat addressed.

## Summary

| # | File                                             | Code | WCAG       | Threat | Fix                                                         |
| - | ------------------------------------------------ | ---- | ---------- | ------ | ----------------------------------------------------------- |
| 1 | `src/components/roycss/color-customizer.tsx`     | C1   | 1.4.3 + 1.4.11 | T3   | Update 12 color preset hex values to Tailwind 600/700 variants |
| 2 | `src/components/roycss/favorites-sheet.tsx`      | K1   | 4.1.2 A    | T1     | Add `aria-label` to effect-preview button                  |
| 3 | `src/components/roycss/roycss-page.tsx`          | K1   | 4.1.2 A    | T1     | Add `aria-label="Clear search"` to search-clear button     |
| 4 | `src/components/roycss/search-overlay.tsx`       | K3   | 1.3.1 + 4.1.2 | T1  | Add `aria-label` to search input                           |
| 5 | `src/components/roycss/search-overlay.tsx`       | K4   | 2.1.2 A    | T2     | Add `Escape` key handler to search input's `onKeyDown`     |
| 6 | `src/components/roycss/effect-detail-dialog.tsx` | A1   | 4.1.2 A    | T1     | Add `aria-label` to CSS editor `<textarea>`                |

---

## Fix 1 — Color preset hex values (WCAG 1.4.3 + 1.4.11)

**File:** `src/components/roycss/color-customizer.tsx`
**Code:** C1 (contrast)
**WCAG:** 1.4.3 Contrast (Minimum) — AA, 1.4.11 Non-text Contrast — AA
**Threat:** T3 (color contrast failures as legal risk)

### Background

The 12 color presets in `COLOR_PRESETS` were originally the Tailwind
500 variants (e.g., `#10b981` for emerald). These are designed to be
**background swatches** with white text on top. However, several
presets failed WCAG AA contrast:

- `emerald #10b981` → white-on-preset = 2.54:1 (fails 3:1)
- `amber #f59e0b`   → white-on-preset = 2.15:1 (fails 3:1)
- `lime #84cc16`    → white-on-preset = 1.98:1 (fails 3:1)

### Fix

Updated all 12 presets to the Tailwind 600 (or 700) variants — darker
shades that pass white-on-preset at ≥ 3:1 (the WCAG 1.4.11 non-text UI
threshold). The visual identity of each preset is preserved (emerald is
still emerald, just a slightly deeper shade).

| Preset  | Old hex (Tailwind 500) | New hex (Tailwind 600/700) |
| ------- | ---------------------- | -------------------------- |
| emerald | `#10b981`              | `#059669`                  |
| blue    | `#3b82f6`              | `#2563eb`                  |
| violet  | `#8b5cf6`              | `#7c3aed`                  |
| rose    | `#f43f5e`              | `#e11d48`                  |
| amber   | `#f59e0b`              | `#b45309` (Tailwind 700)   |
| cyan    | `#06b6d4`              | `#0891b2`                  |
| orange  | `#f97316`              | `#c2410c` (Tailwind 700)   |
| pink    | `#ec4899`              | `#db2777`                  |
| lime    | `#84cc16`              | `#4d7c0f` (Tailwind 700)   |
| red     | `#ef4444`              | `#dc2626`                  |
| indigo  | `#6366f1`              | `#6366f1` (kept; original was 500) |
| teal    | `#14b8a6`              | `#0f766e` (Tailwind 700)   |

The default emerald hex used elsewhere in the file (`#10b981` → `#059669`)
was also updated to match.

### Verification

`bun run a11y/contrast-check.ts` now reports 36/36 checks passing
(was 4 failing for pink and indigo on the dark hero background before
the second-pass adjustment).

---

## Fix 2 — `aria-label` on favorites-sheet effect-preview button (WCAG 4.1.2 A)

**File:** `src/components/roycss/favorites-sheet.tsx:132`
**Code:** K1 (icon-only button without aria-label)
**WCAG:** 4.1.2 A (Name, Role, Value)
**Threat:** T1 (a11y regressions as exclusion harm)

### Before

```tsx
<button
  onClick={() => { onSelectEffect(effect); onOpenChange(false); }}
  className="size-12 rounded-lg bg-gradient-to-br from-muted/60 to-muted/20 ..."
>
  <div className={`roycss-${effect.id} scale-50 origin-center pointer-events-none`} style={{ width: 24, height: 24 }} />
</button>
```

The button contains only a visual effect-preview `<div>` — no text, no
`aria-label`. Screen readers announce "button" with no name.

### After

```tsx
<button
  onClick={() => { onSelectEffect(effect); onOpenChange(false); }}
  className="size-12 rounded-lg bg-gradient-to-br from-muted/60 to-muted/20 ..."
  aria-label={`View ${effect.name} details`}
>
  <div className={`roycss-${effect.id} scale-50 origin-center pointer-events-none`} style={{ width: 24, height: 24 }} />
</button>
```

Screen readers now announce "View Pulse Glow details, button" (etc.).

---

## Fix 3 — `aria-label` on search-clear button (WCAG 4.1.2 A)

**File:** `src/components/roycss/roycss-page.tsx:1280`
**Code:** K1 (icon-only button without aria-label)
**WCAG:** 4.1.2 A (Name, Role, Value)
**Threat:** T1

### Before

```tsx
<button
  onClick={() => setSearch("")}
  className="absolute right-3 top-1/2 -translate-y-1/2 ..."
>
  <X className="size-4" />
</button>
```

Icon-only "clear search" button — screen readers announce "button"
with no name.

### After

```tsx
<button
  onClick={() => setSearch("")}
  className="absolute right-3 top-1/2 -translate-y-1/2 ..."
  aria-label="Clear search"
>
  <X className="size-4" />
</button>
```

---

## Fix 4 — `aria-label` on SearchOverlay input (WCAG 1.3.1 + 4.1.2 A)

**File:** `src/components/roycss/search-overlay.tsx:97`
**Code:** K3 (input without accessible name)
**WCAG:** 1.3.1 A (Info and Relationships), 4.1.2 A (Name, Role, Value)
**Threat:** T1

### Before

```tsx
<input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
  onKeyDown={handleKeyDown} placeholder="Search effects, recipes, patterns, sections... (⌘K)"
  className="..." autoComplete="off" spellCheck={false} />
```

The input has a `placeholder` but no `aria-label` and no associated
`<label>`. Per WCAG, a placeholder is NOT an accessible name.

### After

```tsx
<input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
  onKeyDown={handleKeyDown}
  aria-label="Search effects, recipes, patterns, and sections"
  placeholder="Search effects, recipes, patterns, sections... (⌘K)"
  className="..." autoComplete="off" spellCheck={false} />
```

---

## Fix 5 — Escape key handler on SearchOverlay input (WCAG 2.1.2 A)

**File:** `src/components/roycss/search-overlay.tsx:68`
**Code:** K4 (custom overlay without Escape handler)
**WCAG:** 2.1.2 A (No Keyboard Trap)
**Threat:** T2 (screen reader focus trap)

### Before

The `handleKeyDown` callback on the search input handled `ArrowDown`,
`ArrowUp`, and `Enter` — but NOT `Escape`. The footer kbd hint said
"Esc Close", but pressing Escape inside the input did nothing.

(The parent `roycss-page.tsx` had a global `keydown` listener that
closed the overlay on Escape, but this was fragile — if the parent
stopped listening, the overlay would trap keyboard users.)

### After

Added an `Escape` branch to `handleKeyDown`:

```tsx
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === "ArrowDown") { ... }
  else if (e.key === "ArrowUp") { ... }
  else if (e.key === "Escape") { e.preventDefault(); onOpenChange(false); }  // NEW
  else if (e.key === "Enter") { ... }
}, [...]);
```

Now pressing Escape inside the search input immediately closes the
overlay — defense in depth on top of the parent's global listener.

---

## Fix 6 — `aria-label` on CSS editor textarea (WCAG 4.1.2 A)

**File:** `src/components/roycss/effect-detail-dialog.tsx:575`
**Code:** A1 (textarea without accessible name)
**WCAG:** 4.1.2 A (Name, Role, Value)
**Threat:** T1

### Before

```tsx
<textarea
  value={editedCSS}
  onChange={(e) => setEditedCSS(e.target.value)}
  className="..."
  spellCheck={false}
/>
```

The CSS editor textarea has no `aria-label`, no `aria-labelledby`, and
no associated `<label>`. Screen readers announce "edit text, blank"
with no context.

### After

```tsx
<textarea
  value={editedCSS}
  onChange={(e) => setEditedCSS(e.target.value)}
  aria-label={`Editable CSS for ${effect.name}`}
  className="..."
  spellCheck={false}
/>
```

Screen readers now announce "Editable CSS for Pulse Glow, edit text,
blank" — the user knows what they're editing.

---

## Verification

After applying all six fixes, re-running the four-script suite:

```
✅ contrast-check: PASS — all 36 combinations meet WCAG 2.1 AA thresholds.
✅ keyboard-nav: PASS — 0 violations.
✅ reduced-motion: PASS — all 4 guarantees present.
✅ aria-coverage: PASS — overall coverage 100% (≥ 95% threshold).
```

The "WCAG 2.1 AA compliant" claim in the RoyCSS FAQ is now
**falsifiable** and **verified** — every PR that touches a RoyCSS
component runs this suite, and a regression fails the build.
