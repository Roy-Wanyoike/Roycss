# Effect Curation — Taxonomy Design

> Status: **Accepted** · Owner: RoyCSS Catalog Curation · Last updated 2026-07-31

This document defines the canonical taxonomy for the RoyCSS effect catalog:
the 20 top-level categories, the controlled tag vocabulary, the five quality
dimensions, and the scoring rubric used by `src/lib/effect-taxonomy.ts` and the
`scripts/curate-effects.ts` curation pipeline.

The taxonomy is intentionally **machine-checkable first, human-readable second**.
Every dimension, rubric tier, and tag mapping has a numeric anchor so the
curation script can produce a deterministic report that future contributors can
re-run against their own submissions.

---

## 1. Design goals

1. **Discoverability** — A user searching for "loader spinner ring" must surface
   every relevant effect regardless of which batch it lives in or whether it
   came from RoyCSS-original or the FerrumCSS merge.
2. **Quality signal** — Consumers need to know whether an effect is production-
   ready or a rough sketch before they paste 30 KB of CSS into their bundle.
3. **Dedup determinism** — When two effects are near-identical, the catalog
   must flag the duplicate and recommend one canonical entry.
4. **Stable vocabulary** — Free-form tags drift ("glowing" vs "glow" vs
   "shimmer-glow"). The catalog fixes a ~100-tag controlled vocabulary and
   normalizes everything else into it.
5. **Submission guardrail** — New contributors must be able to self-assess an
   effect against the rubric before opening a PR.

## 2. The 20 categories

The category list is fixed in `src/lib/roycss-types.ts` (`EffectCategory`).
Curation does **not** add or remove categories — it only documents boundary
rules so contributors know where each effect belongs.

For each category we record:

- **Definition** — one-sentence scope statement.
- **Boundary rule** — what disqualifies an effect from this category.
- **Examples** — canonical effect IDs that clearly belong.
- **Common confusion** — the sibling category most often mis-assigned.

The full definitions live in `CATEGORY_DEFINITIONS` inside
`src/lib/effect-taxonomy.ts` (single source of truth). The summary table:

| Category | Count | Boundary rule (short) |
|---|---|---|
| animations | 312 | Keyframed continuous or entrance/exit motion; no user trigger. |
| hover | 110 | Effect requires `:hover` (or `:focus`/`:active`) on the element itself. |
| text | 101 | Styling/animation targets text glyphs (gradient, glow, fill). |
| backgrounds | 128 | Effect paints a background surface (gradient, pattern, mesh). |
| loaders | 66 | Indeterminate progress indicators (spinners, dots, bars, skeletons). |
| 3d-transforms | 31 | Uses `transform: perspective()`, `rotateX/Y/Z`, or `translateZ`. |
| buttons | 55 | Effect is applied to a `<button>`-style affordance. |
| cards | 56 | Effect styles a card surface (border, glass, reveal). |
| borders | 30 | Effect is the border itself (animated outline, gradient border). |
| filters | 15 | Uses `filter:` / `backdrop-filter:` as the primary mechanism. |
| forms | 45 | Inputs, validation feedback, label interactions. |
| navigation | 30 | Menus, tabs, breadcrumbs, steppers. |
| scroll | 51 | Effect is scroll-triggered or scroll-linked. |
| cursor | 24 | Custom cursor or cursor-following elements. |
| page-transitions | 39 | Full-page enter/exit transitions. |
| glass-ui | 50 | Glassmorphism, neumorphism, modern surface treatments. |
| particles | 52 | Multi-element particle systems (snow, confetti, dust). |
| microinteractions | 87 | Small interactive feedback on a single component. |
| visual | 258 | Holographic, metallic, chrome, and advanced decorative styles. |
| misc | 29 | Effects that genuinely defy categorization (last-resort bucket). |

**Miscategorization detection** in `curate-effects.ts` flags an effect when its
name/tags strongly suggest a different category than assigned — see
`IMPLEMENTATION-PLAN.md` §3.4.

## 3. Tag vocabulary

The catalog has 1,658 distinct raw tags today. Many are noise (effect-id
mirrors like `text-bounce-letters`, freeform spellings like `glowing`,
duplicates like `spinner` vs `spinners`). The controlled vocabulary collapses
these into **~100 canonical tags** grouped by dimension.

### 3.1 Dimensions

Tags are grouped into 6 dimensions so consumers can filter hierarchically
("all motion tags", "all attention tags").

| Dimension | Purpose | Example tags |
|---|---|---|
| `visual` | What it looks like | `glow`, `shadow`, `blur`, `gradient`, `neon` |
| `motion` | How it moves | `spin`, `bounce`, `fade`, `slide`, `pulse` |
| `purpose` | When to use it | `attention`, `loading`, `feedback`, `entrance`, `exit` |
| `surface` | What it applies to | `text`, `card`, `button`, `background`, `border` |
| `technique` | CSS mechanism | `keyframes`, `transform`, `filter`, `clip-path`, `mask` |
| `a11y` | Accessibility posture | `reduced-motion-safe`, `high-contrast`, `no-animation` |

### 3.2 Normalization rules

`normalizeTags(tags)` applies four passes:

1. **Lowercase + trim** — `Glow`, ` glow `, `GLOW` → `glow`.
2. **Synonym map** — `glowing` → `glow`, `spinning` → `spin`, `shimmering` →
   `shimmer`. ~120 synonyms covering the most common freeform spellings.
3. **ID-mirror strip** — Tags that mirror the effect id (e.g.
   `text-bounce-letters` on `ferrum-text-bounce-letters`) are removed because
   they encode no information beyond the id.
4. **Vocabulary filter** — Any tag not in `TAG_VOCABULARY` is kept but flagged
   as `uncontrolled` in the report so a curator can promote or drop it.

### 3.3 Vocabulary growth policy

New tags are added by editing `TAG_VOCABULARY` in `effect-taxonomy.ts` — never
by introducing uncontrolled tags in batch files. The curation report's
"uncontrolled tags" section is the queue of candidates for promotion.

## 4. Quality dimensions

Every effect is scored 0–10 on each of five dimensions. The overall quality
score is the rounded mean of the five.

### 4.1 Correctness (0–10)

Does the CSS actually work in a modern browser without throwing away the
previewType contract?

| Score | Criterion |
|---|---|
| 9–10 | Self-contained, scoped under `.roycss-<id>`, keyframes prefixed `roy-`, parses cleanly, matches declared `previewType`. |
| 7–8 | Works but uses vendor prefixes, has minor stylistic issues, or relies on a sibling selector that isn't documented. |
| 5–6 | Has a parseable bug (e.g. missing semicolon, mismatched brace) that one browser tolerates but another won't. |
| 3–4 | Effect is a stub (e.g. `.roycss-x { /* TODO */ }`), or uses a class name that doesn't match its id. |
| 0–2 | CSS is empty, malformed, or references a class that doesn't exist. |

### 4.2 Completeness (0–10)

Does the effect carry enough metadata for a consumer to find, understand, and
trust it?

| Score | Criterion |
|---|---|
| 9–10 | name ≥ 2 words, description ≥ 40 chars and specific, 3–5 tags all from the controlled vocabulary, `previewType` matches `category`. |
| 7–8 | Description is generic but present, tags are mostly controlled. |
| 5–6 | Description is `< 25` chars (e.g. "A pulse glow effect"), tags include id-mirrors, or fewer than 3 tags. |
| 3–4 | Description is `< 20` chars, tags empty or all uncontrolled. |
| 0–2 | Missing name, description, or tags. |

### 4.3 Performance (0–10)

Will this effect hurt the page? Heuristic, not a benchmark — the curation
script does not load the effect in a browser.

| Score | Criterion |
|---|---|
| 9–10 | CSS ≤ 2 KB, ≤ 1 keyframe, no `box-shadow` animation, no `filter` animation, respects `prefers-reduced-motion`. |
| 7–8 | CSS 2–6 KB, animates `transform`/`opacity` (compositor-friendly), no reduced-motion guard. |
| 5–6 | CSS 6–12 KB, animates `box-shadow` or `border-radius` (paint-heavy), or has > 3 keyframes. |
| 3–4 | CSS 12–30 KB, multiple paint-heavy animations, or uses `position: fixed` + scroll listeners (rare in pure CSS). |
| 0–2 | CSS > 30 KB, or animates both `box-shadow` and `filter` simultaneously, or uses `*` selectors. |

### 4.4 Accessibility (0–10)

| Score | Criterion |
|---|---|
| 9–10 | Honors `prefers-reduced-motion: reduce`, color contrast ≥ 4.5:1, no seizure-risk strobing (> 3 Hz). |
| 7–8 | Honors reduced-motion but contrast or strobing not verified. |
| 5–6 | No reduced-motion guard but animation is subtle (≤ 2 Hz). |
| 3–4 | Strobing 2–3 Hz, or animates opacity of text below 0.5 (readability loss). |
| 0–2 | Strobing > 3 Hz (WCAG 2.3.1 violation), or hides content from screen readers via `display: none` animation. |

### 4.5 Uniqueness (0–10)

How distinct is this effect from the rest of the catalog? Computed by
`findDuplicates` against every other effect.

| Score | Criterion |
|---|---|
| 9–10 | No near-duplicate. Closest neighbor has name similarity < 0.7 and CSS similarity < 0.7. |
| 7–8 | One neighbor with similarity 0.7–0.85 in name or CSS, but the two are clearly distinct variants (e.g. `flip-in-x` vs `flip-in-y`). |
| 5–6 | One neighbor with similarity 0.85–0.95. Candidate for merge. |
| 3–4 | Multiple neighbors ≥ 0.9 similarity. Almost certainly a duplicate. |
| 0–2 | Exact or near-exact duplicate of another effect (similarity ≥ 0.95). |

## 5. Scoring rubric

```
overall = round((correctness + completeness + performance + accessibility + uniqueness) / 5, 1)
```

The curation report bins effects into:

- **A tier** (overall ≥ 8.0) — production-ready, recommend.
- **B tier** (6.0–7.9) — usable, document the caveat.
- **C tier** (4.0–5.9) — needs remediation before promotion.
- **D tier** (< 4.0) — candidate for deprecation.

## 6. Dedup algorithm

Two similarity signals are combined:

1. **Name similarity** — Levenshtein distance on lowercased names, normalized
   to `[0, 1]` by `1 - dist / max(len)`. Fast, language-agnostic.
2. **CSS similarity** — Normalize each `cssCode` (strip comments, collapse
   whitespace, lowercase) and compute a token-set Jaccard index on
   space-separated tokens. More expensive but catches effects that share a
   class definition with different ids.

Two effects are flagged as **near-duplicates** when:

- name similarity ≥ 0.85, **or**
- CSS similarity ≥ 0.80, **or**
- both signals ≥ 0.70 (compound similarity ≥ 0.75 weighted mean).

The curation script groups flagged pairs into connected clusters
(union-find). The cluster's "canonical" member is the one with the highest
overall quality score; the rest are flagged `duplicateOf: canonical`.

## 7. Deprecation policy

An effect is recommended for deprecation when **any** of:

- Overall quality < 4.0.
- Uniqueness score < 3.0 (i.e. a near-duplicate of a higher-quality sibling).
- Correctness < 3.0 (stub or broken CSS).

Deprecation is **advisory** — the curation report lists candidates but does not
remove them. Removal requires a human curator to confirm no recipe, pattern, or
external consumer depends on the id. See `ADR.md` §4.

## 8. Out of scope

- Visual regression testing (covered by `performance/effect-render-bench.ts`).
- Bundle-size budgeting (covered by `performance/budgets.json`).
- Accessibility audit of the marketing site (covered by `a11y/`).
- Cross-browser compatibility matrix (covered by `compat/`).

The curation pipeline focuses exclusively on catalog-level metadata quality
and is intended to be re-runnable in < 5 seconds on a developer laptop.
