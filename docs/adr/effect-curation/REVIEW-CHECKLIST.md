# Effect Curation — Submission Review Checklist

> Status: **Accepted** · Owner: RoyCSS Catalog Curation · Last updated 2026-07-31

15 items a reviewer (human or automated) must check before merging a new
effect into the RoyCSS catalog. Each item has a **pass criterion** and a
**fail action** — there is no "warn" tier. Fail any item and the PR is
blocked.

The curation script (`scripts/curate-effects.ts`) automates items 1–8 and
12–14; items 9–11 and 15 require human judgment.

---

## Section A — Identity (items 1–3)

### 1. ID is unique across the catalog

- **Pass:** `effect.id` does not appear in any existing batch file.
- **Fail action:** Reject PR; ask contributor to rename.
- **Automated:** `curate-effects.ts` aborts with exit 1 if duplicate ids
  are detected.

### 2. ID follows the naming convention

- **Pass:** id is kebab-case, lowercase, ASCII, starts with a letter, ≤ 40
  chars. Original RoyCSS effects use plain slugs (`pulse-glow`,
  `bg-animated-gradient`). Batch-attributed effects use an `-bNN` suffix
  (`anim-liquid-metal-b18`). FerrumCSS imports use the `ferrum-` prefix.
- **Fail action:** Reject PR; provide the convention link.
- **Automated:** regex check in `curate-effects.ts`.

### 3. Name is human-readable and specific

- **Pass:** `effect.name` is Title Case, ≥ 2 words (or 1 well-known word
  like `Shake`), ≤ 36 chars, not just the id with dashes replaced.
- **Fail action:** Request rename in PR review.
- **Automated:** `scoreEffect` completeness dimension deducts for
  `name.length < 2 words`.

## Section B — Content (items 4–6)

### 4. Description is specific and ≥ 40 chars

- **Pass:** `effect.description` is a complete sentence or clause, ≥ 40
  chars, and mentions the visual outcome (not just "An X effect"). Auto-
  generated FerrumCSS descriptions ("A pulse glow effect") fail this.
- **Fail action:** Request rewrite in PR review.
- **Automated:** `scoreEffect` completeness dimension; flagged in
  `lowQuality` if description < 25 chars.

### 5. CSS is self-contained and parses

- **Pass:** `effect.cssCode` includes the `.roycss-<id>` class definition
  and any `@keyframes roy-<id>` it references. No external selectors.
  Brace count is balanced. No `/* TODO */` placeholders.
- **Fail action:** Reject PR.
- **Automated:** `scoreEffect` correctness dimension; brace-balance check
  in curation script.

### 6. CSS is reasonably sized

- **Pass:** `effect.cssCode.length` ≤ 8,000 chars (~8 KB). Effects above
  this should be split or refactored.
- **Fail action:** Request refactor in PR review. Override possible for
  complex particle systems (rare).
- **Automated:** `scoreEffect` performance dimension; flagged if > 12,000
  chars.

## Section C — Taxonomy (items 7–9)

### 7. Category is correct

- **Pass:** `effect.category` matches the boundary rules in
  `CATEGORY_DEFINITIONS`. Common confusions: `hover` vs `microinteractions`
  (hover is on the element itself; microinteractions are component-level
  feedback), `animations` vs `microinteractions` (animations have no user
  trigger), `glass-ui` vs `cards` (glass-ui is the surface treatment;
  cards is the component).
- **Fail action:** Request re-categorization in PR review.
- **Automated:** `curate-effects.ts` miscategorization detection flags
  effects whose name/tags suggest a different category.

### 8. Tags are from the controlled vocabulary

- **Pass:** ≥ 3 tags, all in `TAG_VOCABULARY` after `normalizeTags()`. No
  id-mirror tags. No freeform spellings.
- **Fail action:** Run `normalizeTags` and request the contributor use the
  canonical forms.
- **Automated:** `curate-effects.ts` tag normalization step.

### 9. PreviewType matches category

- **Pass:** `previewType` aligns with `category` per the matrix:
  - `animations`, `hover`, `3d-transforms`, `filters`, `microinteractions`,
    `page-transitions`, `cursor`, `misc` → `box`
  - `text` → `text`
  - `backgrounds`, `particles`, `visual` → `background`
  - `loaders` → `loader`
  - `cards`, `glass-ui`, `borders`, `scroll` → `card`
  - `buttons`, `forms`, `navigation` → `button` (or `card` for nav containers)
- **Fail action:** Request previewType change in PR review.
- **Automated:** `scoreEffect` completeness dimension deducts for
  mismatches.

## Section D — Quality (items 10–12)

### 10. Effect honors `prefers-reduced-motion`

- **Pass:** If the effect has any animation (`@keyframes`, `transition`),
  it includes a `@media (prefers-reduced-motion: reduce)` block that
  disables or slows it.
- **Fail action:** Request the guard. Required for `a11y` score ≥ 7.
- **Automated:** `scoreEffect` accessibility dimension; flagged if
  animation present and no reduced-motion guard.

### 11. No seizure-risk strobing

- **Pass:** No animation cycle ≤ 333 ms (i.e. > 3 Hz) that alternates
  opacity, brightness, or color significantly. WCAG 2.3.1.
- **Fail action:** Reject PR. Non-negotiable.
- **Automated:** Heuristic in `scoreEffect` accessibility dimension
  (parses `animation: ... Xs` durations); human review for borderline
  cases.

### 12. Effect is not a near-duplicate

- **Pass:** `findDuplicates()` does not flag the new effect as a
  near-duplicate of an existing effect (similarity < 0.85 name, < 0.80
  CSS).
- **Fail action:** If flagged, contributor must either (a) differentiate
  the effect more clearly and re-submit, or (b) extend the existing
  effect instead of adding a new one.
- **Automated:** `curate-effects.ts` duplicate detection; the new effect
  will appear in a cluster with the existing one.

## Section E — Integration (items 13–15)

### 13. Effect does not break existing recipes/patterns

- **Pass:** The new effect's id does not collide with any id referenced in
  `roycss-recipes.ts` or `roycss-patterns.ts`. (Adding a new id is fine;
  shadowing an existing one breaks recipes.)
- **Fail action:** Reject PR.
- **Automated:** `curate-effects.ts` recipe/pattern reference check.

### 14. Lint passes

- **Pass:** `bun run lint` exits 0 with the new effect's batch file
  included.
- **Fail action:** Fix lint errors before merge.
- **Automated:** CI.

### 15. Effect is documented in the batch file

- **Pass:** The batch file has a header comment block describing the
  batch's theme and the new effect is preceded by a one-line comment with
  its number and id (e.g. `// 42. pulse-glow`). This is the established
  convention in `effects-batch-1.ts` through `effects-batch-34.ts`.
- **Fail action:** Request the comment in PR review.
- **Automated:** Human review only — comment presence is hard to check
  mechanically without a parser.

---

## Reviewer quick-reference

| Item | Automated? | Block level |
|---|---|---|
| 1. Unique id | ✅ | Hard block |
| 2. ID naming convention | ✅ | Hard block |
| 3. Human-readable name | ✅ (heuristic) | Soft block |
| 4. Description ≥ 40 chars | ✅ | Soft block |
| 5. CSS parses | ✅ | Hard block |
| 6. CSS ≤ 8 KB | ✅ | Soft block |
| 7. Category correct | ✅ (heuristic) | Soft block |
| 8. Tags controlled | ✅ | Soft block |
| 9. PreviewType matches | ✅ (heuristic) | Soft block |
| 10. Reduced-motion guard | ✅ | Soft block |
| 11. No seizure strobing | ✅ (heuristic) | Hard block |
| 12. Not a duplicate | ✅ | Soft block |
| 13. No recipe/pattern collision | ✅ | Hard block |
| 14. Lint passes | ✅ | Hard block |
| 15. Batch file comment | ❌ | Soft block |

**Hard block** = PR cannot merge. **Soft block** = PR can merge with a
reviewer override and a tracked follow-up issue.
