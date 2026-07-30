# Effect Curation — Implementation Plan

> Status: **Accepted** · Owner: RoyCSS Catalog Curation · Last updated 2026-07-31

Seven phases from cold start to a maintained, audited catalog. Each phase has
explicit verification gates so the work is interruptible.

---

## Phase 0 — Prerequisites (verified)

- ✅ `src/lib/roycss-effects.ts` exports `effects: CSSEffect[]` (1,569 entries).
- ✅ `src/lib/roycss-types.ts` defines `CSSEffect`, `EffectCategory`,
  `PreviewType`, `categoryMeta`, `categoryOrder`.
- ✅ `src/lib/roycss-recipes.ts` exports `recipes` with `effectIds` arrays.
- ✅ `src/lib/roycss-patterns.ts` exports `patterns` with `effectIds` arrays.
- ✅ `bun run lint` baseline is 0 errors / 0 warnings.

## Phase 1 — Design docs (in `docs/adr/effect-curation/`)

| File | Purpose |
|---|---|
| `DESIGN.md` | Taxonomy, tag vocabulary, quality dimensions, scoring rubric. |
| `ADR.md` | 5 ADRs: vocabulary, score formula, dedup algorithm, deprecation, output schema. |
| `IMPLEMENTATION-PLAN.md` | This file. |
| `REVIEW-CHECKLIST.md` | 15 review items for new effect submissions. |

**Gate:** all four files exist and reference each other consistently.

## Phase 2 — `src/lib/effect-taxonomy.ts` (new module)

Exports:

- `TAG_VOCABULARY: Record<TagDimension, string[]>` — ~100 canonical tags
  grouped by dimension.
- `TAG_SYNONYMS: Record<string, string>` — ~120 freeform → canonical mappings.
- `CATEGORY_DEFINITIONS: Record<EffectCategory, CategoryDefinition>` — one
  entry per category with definition, boundary rule, examples, common
  confusion.
- `QUALITY_DIMENSIONS: QualityDimension[]` — 5 dimensions, each with id,
  label, description, and a `score(effect) → { score, reasoning }` function.
- `scoreEffect(effect: CSSEffect): DimensionScore[]` — runs all 5
  dimensions, returns array.
- `normalizeTags(tags: string[], effectId?: string): { normalized: string[],
  changes: { from: string, to: string | null }[] }` — returns both the
  normalized list and a diff for reporting.
- `findDuplicates(effects: CSSEffect[]): DuplicateCluster[]` — runs the
  union-find clustering from ADR-3.
- `SUBMISSION_GUIDE: SubmissionGuide` — required fields, naming conventions,
  quality bar.

**Implementation notes:**

- Levenshtein implemented inline (no dependency). At n=1,569 and avg name
  length 12, the all-pairs pass is ~1.2M comparisons × ~150 char-ops = ~180M
  ops; runs in < 2 seconds in Bun.
- CSS normalization: strip `/* */` comments, collapse whitespace, lowercase.
  Tokenize on whitespace for Jaccard.
- No external dependencies. The module must import cleanly into both the
  curation script (Bun) and any future Next.js route (Node).

**Gate:** `bun -e 'import * as T from "./src/lib/effect-taxonomy.ts"; console.log(Object.keys(T))'`
prints all 8 exports.

## Phase 3 — `scripts/curate-effects.ts` (curation pipeline)

Steps (in order):

1. **Load** — `import { effects } from "../src/lib/roycss-effects.ts"`.
2. **Sanity-check IDs** — assert no duplicate ids; abort with exit 1 if any.
3. **Tag normalization** — run `normalizeTags` on every effect, accumulate
   `tagChanges: { effectId, from, to }[]`.
4. **Quality scoring** — run `scoreEffect` on every effect, accumulate
   `qualityScores: EffectScore[]`.
5. **Duplicate detection** — run `findDuplicates(effects)`.
6. **Miscategorization detection** — for each effect, score the alignment
   between its declared category and the categories its name/tags suggest.
   Flag when a non-declared category scores ≥ 1.5× the declared category.
7. **Recipe/pattern reference check** — read `roycss-recipes.ts` and
   `roycss-patterns.ts` (re-import their `effectIds`), build a
   `Set<effectId>` of protected ids. Used by the deprecation blocker.
8. **Compose report** — assemble `curationReport` object with all sections.
9. **Write outputs** — four files under `scripts/curate-results/`:
   - `curation-report.json`
   - `duplicates.json`
   - `quality-scores.json`
   - `CURATION-REPORT.md` (rendered from the report object, not from JSON
     reads — keeps the writer single-pass).

**Output rendering rules:**

- Tables in MD use GitHub-flavored markdown (`| ... |`).
- Numbers in MD: counts are raw integers; scores are 1-decimal (`8.3`).
- Histograms use ASCII bars (`████████░░`).
- Top/bottom lists are sorted by overall score; ties broken alphabetically
  by id.

**Gate:** `bun run scripts/curate-effects.ts` exits 0 and all four files
exist with non-zero size.

## Phase 4 — Verification

| Check | Command | Pass criterion |
|---|---|---|
| Lint clean | `bun run lint` | exit 0, 0 errors |
| Curation script runs | `bun run scripts/curate-effects.ts` | exit 0 |
| Report generated | `ls scripts/curate-results/CURATION-REPORT.md` | file exists, > 5 KB |
| Smoke test taxonomy exports | `bun run scripts/smoke-taxonomy.ts` (ad-hoc) | all 8 exports callable |
| No duplicate IDs | read `curation-report.json` `uniqueIds` | equals `totalEffects` |
| Recipe/pattern ids valid | `curation-report.json` `blockedRemovals` empty for non-deprecated ids | all recipe/pattern effectIds exist in catalog |

## Phase 5 — Reporting

The `CURATION-REPORT.md` has 8 sections (see `DESIGN.md` §5 for the scoring
rubric that drives them):

1. **Executive summary** — totals, averages, headline findings.
2. **Category distribution** — 20-row table with count, avg quality, min,
   max, # low-quality.
3. **Top 10 highest-quality effects** — id, name, category, overall, tier.
4. **Bottom 10 lowest-quality effects** — id, name, category, overall,
   specific issues per dimension.
5. **Duplicate clusters** — grouped list; each cluster shows canonical
   member, duplicates, similarity, recommendation.
6. **Tag normalization summary** — most common `from → to` mappings with
   counts.
7. **Miscategorization findings** — effects whose name/tags suggest a
   different category, with the suggested category and confidence.
8. **Recommendations** — deprecate / merge / improve lists, each with
   affected ids and the rationale.

## Phase 6 — Future work (out of scope for v1)

- **LSH pre-filtering** for dedup at > 5,000 effects.
- **Soft-delete flag** on `CSSEffect` (requires coordinating with the types
  owner).
- **CI integration** — wire `curate-effects.ts` into PR checks so a new
  effect can't merge if it drops the catalog's avg quality below a budget.
- **Per-effect preview thumbnails** rendered by Playwright for visual diff.
- **Tag promotion workflow** — UI for curators to promote `uncontrolled`
  tags into `TAG_VOCABULARY` without editing TypeScript.

## Phase 7 — Maintenance

- Re-run `bun run scripts/curate-effects.ts` after every batch merge.
- Review the `deprecate` list quarterly; act on candidates with no blocking
  references.
- Audit `TAG_SYNONYMS` when the `uncontrolled` tag count in the report
  exceeds 50 (current threshold).
- Update `DESIGN.md` §2 category counts whenever the catalog grows past
  notable round numbers (2,000 / 5,000 / 10,000).
