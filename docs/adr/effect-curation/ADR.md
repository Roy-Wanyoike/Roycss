# Effect Curation — Architecture Decision Records

> Status: **Accepted** · Owner: RoyCSS Catalog Curation · Last updated 2026-07-31

Five architectural decisions govern the effect curation pipeline. Each ADR
follows the Nygard format: Context → Decision → Consequences → Alternatives
considered.

---

## ADR-1 — Tag vocabulary: controlled with normalization, not freeform

**Status:** Accepted · **Date:** 2026-07-31

### Context

The RoyCSS catalog currently has **1,658 distinct raw tags** across 1,569
effects. The top 10 tags (`animated`, `hover`, `text`, `interactive`,
`gradient`, `3d`, `background`, `card`, `slide`, `loader`) appear in 60% of
effects — useful for filtering but too coarse. The long tail (1,400+ tags
appearing in < 5 effects each) is noise: id-mirrors (`text-bounce-letters`),
plurals (`spinners` vs `spinner`), verb forms (`glowing` vs `glow`), and
typographical variants.

A freeform vocabulary would let contributors keep adding drift; a strictly
closed vocabulary would force the next 200 effects into ill-fitting tags.

### Decision

Adopt a **controlled vocabulary of ~100 canonical tags** grouped by 6
dimensions (`visual`, `motion`, `purpose`, `surface`, `technique`, `a11y`).
Freeform tags are accepted at submission time but normalized at curation time
via `normalizeTags()`:

1. Lowercase + trim.
2. Apply a synonym map (~120 entries) — `glowing → glow`, `spinning → spin`,
   `shimmering → shimmer`.
3. Strip id-mirror tags — a tag that equals the effect id (or its slug) adds
   no information beyond the id.
4. Tags not in the vocabulary are preserved but flagged `uncontrolled` in the
   report so a curator can promote or drop them on the next pass.

The vocabulary lives in **one place**: `TAG_VOCABULARY` in
`src/lib/effect-taxonomy.ts`. Growth is intentional — the curation report's
"uncontrolled tags" section is the candidate queue.

### Consequences

- **+** Consumers can filter on a stable set of tags across the whole catalog.
- **+** Search recall improves (a search for `glow` matches `glowing` and
  `shimmering-glow` automatically).
- **+** The vocabulary grows measurably — every promotion is a single-line
  edit.
- **−** Some author intent is lost (e.g. `apple-style` collapses to `apple`
  and `skeuomorphic`, which is less expressive).
- **−** The synonym map needs maintenance — a new contributor using `glowy`
  won't be normalized until a curator adds the synonym.

### Alternatives considered

- **Freeform with autocomplete only** — rejected: autocomplete doesn't fix
  the existing 1,658-tag mess and offers no migration path.
- **Strictly closed vocabulary** — rejected: would force awkward tags on
  novel effects (e.g. `vis-liquid-metal-b18` doesn't fit `glow`/`shadow`).
- **Hierarchical taxonomy (tags → subtags)** — rejected: adds complexity for
  marginal gain at this catalog size; revisit at 5,000+ effects.

---

## ADR-2 — Quality score: 5-dimension rubric, equal-weighted mean

**Status:** Accepted · **Date:** 2026-07-31

### Context

The catalog needs a single number consumers can sort by, but a single number
hides *why* an effect is good or bad. A 0–100 score is also opaque —
contributors can't tell what to fix.

### Decision

Score every effect 0–10 on **five dimensions** — correctness, completeness,
performance, accessibility, uniqueness — using the rubric in `DESIGN.md` §4.
Overall = rounded mean of the five, reported to 1 decimal.

Each dimension has explicit 0–2 / 3–4 / 5–6 / 7–8 / 9–10 tier criteria so two
curators scoring the same effect should land within ±1 on each dimension. The
`scoreEffect()` function encodes the rubric as deterministic heuristics (CSS
length, tag count, presence of `prefers-reduced-motion`, etc.) so the curation
script produces a reproducible report.

### Consequences

- **+** The report can show "this effect is B-tier because performance is 5"
  — actionable.
- **+** Equal weighting is the simplest defensible choice; revisiting weights
  is a one-line change.
- **+** The 0–10 scale per dimension matches how reviewers naturally think.
- **−** Equal weighting is arbitrary — accessibility arguably deserves a
  floor (an effect with a11y = 0 should never be A-tier regardless of other
  scores). Mitigated by the deprecation policy (DESIGN.md §7) which
  independently flags any dimension < 5.
- **−** Deterministic heuristics can't catch every real bug (e.g. an effect
  that animates `box-shadow` but does it cheaply because the shadow is
  tiny). The report is a triage tool, not a substitute for review.

### Alternatives considered

- **Weighted mean (a11y × 1.5, etc.)** — rejected: weights are political and
  shift over time; equal weighting is the neutral baseline.
- **Single 0–100 score** — rejected: opaque, no remediation signal.
- **Pass/fail per dimension** — rejected: too coarse; doesn't separate
  "perfect" from "good enough".
- **ML-based scoring** — rejected: at 1,569 effects, rule-based heuristics
  are more transparent and need no training data.

---

## ADR-3 — Dedup: name similarity + CSS similarity, union-find clustering

**Status:** Accepted · **Date:** 2026-07-31

### Context

The recent FerrumCSS merge introduced **307 effects whose names duplicate an
existing RoyCSS effect** (e.g. `ferrum-pulse-glow` vs `pulse-glow`,
`ferrum-bounce-in` vs `bounce-in`). Pure name matching catches the obvious
cases but misses effects that share CSS with different names. Pure CSS
matching is O(n²) and prone to false positives when effects share boilerplate.

### Decision

Compute **two independent similarity signals** for every pair:

1. **Name similarity** — Levenshtein distance on lowercased names,
   normalized to `[0, 1]` by `1 - dist / max(len)`. O(n² · L²) where L is
   average name length (~12 chars).
2. **CSS similarity** — Normalize each `cssCode` (strip comments, collapse
   whitespace, lowercase) and compute token-set Jaccard on space-separated
   tokens. O(n² · T) where T is average token count.

Flag a pair as **near-duplicate** when name ≥ 0.85 **or** CSS ≥ 0.80 **or**
the weighted mean (0.5 × name + 0.5 × CSS) ≥ 0.75. Use **union-find** to
merge flagged pairs into clusters. Within each cluster, the **canonical**
member is the highest overall quality score (ties broken by `roycss-` prefix
preference, then alphabetical id).

The O(n²) cost is acceptable at n=1,569 (~1.2M pairs, < 2 seconds in Bun).
Above 5,000 effects, switch to LSH pre-filtering (future work).

### Consequences

- **+** Catches both naming collisions (`ferrum-pulse-glow`) and CSS clones
  (two ids with identical keyframes).
- **+** Union-find produces stable clusters regardless of input order.
- **+** The canonical-member rule is deterministic and auditable.
- **−** O(n²) doesn't scale — at 10,000 effects this becomes 30+ seconds.
  Documented as a known scaling cliff in `IMPLEMENTATION-PLAN.md` §6.
- **−** Levenshtein on names treats `flip-in-x` and `flip-in-y` as similar
  (similarity 0.89) — these are legitimate siblings, not duplicates.
  Mitigated by the 0.85 threshold and the per-cluster human review step.

### Alternatives considered

- **Name-only matching** — rejected: misses CSS clones (e.g. two effects
  that copy-paste the same keyframes with renamed ids).
- **CSS-only matching** — rejected: misses effects with identical names but
  different CSS (e.g. `pulse-glow` original vs a hypothetical
  `ferrum-pulse-glow` with different colors).
- **Embedding-based similarity** — rejected: requires a model dependency
  for marginal accuracy gain at this catalog size.
- **Manual dedup** — rejected: 1,569 effects is too many to eyeball; the
  script flags candidates, a human confirms.

---

## ADR-4 — Deprecation: advisory, never automatic

**Status:** Accepted · **Date:** 2026-07-31

### Context

The curation script can identify low-quality or duplicate effects with high
confidence, but removing an effect from the catalog is a breaking change for
any consumer (recipe, pattern, external app, VS Code extension, Chrome
inspector, MCP server) that references its id.

### Decision

The curation report **recommends** deprecation but **never removes** effects.
An effect is flagged `deprecate` when:

- overall < 4.0, **or**
- uniqueness < 3.0 (near-duplicate of a higher-quality sibling), **or**
- correctness < 3.0 (stub or broken CSS).

A separate **blocking** flag is set when the effect id is referenced by any
recipe (`roycss-recipes.ts`) or pattern (`roycss-patterns.ts`) — those cannot
be removed until the reference is migrated. The curation script reads the
recipe/pattern files and cross-references their `effectIds` arrays.

Actual removal is a human workflow:

1. Curator reviews the `deprecate` list, picks candidates with no blocking
   references.
2. Opens a PR that removes the effect from its batch file and updates
   `roycss-effects.ts` (no-op since it's a spread, but the count changes).
3. Runs `bun run scripts/curate-effects.ts` to confirm the report no longer
   flags the removed id.

### Consequences

- **+** No risk of breaking recipe/pattern/external consumers.
- **+** The report is safe to run on every PR — it only writes to
  `scripts/curate-results/`, never to source.
- **+** The blocking-reference check is a concrete, machine-verifiable
  pre-condition for removal.
- **−** The catalog grows monotonically until a human acts on the deprecate
  list. At 1,569 effects with ~250 deprecation candidates, this is a
  meaningful cleanup but not urgent.
- **−** External consumers (VS Code extension, Chrome inspector, MCP server)
  each ship their own copy of the effects list — deprecation in the source
  doesn't remove them from shipped artifacts until the next release of each.

### Alternatives considered

- **Automatic removal on low score** — rejected: too dangerous; one bad
  heuristic could delete a popular effect.
- **Soft-delete with `deprecated: true` flag** — deferred: requires adding a
  field to `CSSEffect`, which is owned by another agent. Revisit when the
  type extension is coordinated.
- **Versioning (`pulse-glow-v1`, `pulse-glow-v2`)** — rejected: adds
  naming complexity; the canonical-member rule in ADR-3 already handles
  variant selection.

---

## ADR-5 — Curation output: machine-readable JSON + human-readable MD

**Status:** Accepted · **Date:** 2026-07-31

### Context

The curation script produces four artifacts: a full machine-readable report,
a duplicate-cluster file, a per-effect quality-scores file, and a
human-readable markdown report. These need stable schemas so future tooling
(inspector extension, MCP server, CI checks) can consume them.

### Decision

All outputs live under `scripts/curate-results/`. Schemas:

- **`curation-report.json`** — top-level object with `generatedAt`, `totalEffects`,
  `tagNormalizations`, `duplicateClusters`, `miscategorized`, `lowQuality`,
  `qualityDistribution`, `categoryStats`, `recommendations`. Schema version
  pinned via `schema: "roycss.curation.v1"`.
- **`duplicates.json`** — array of clusters, each `{ canonical, members:
  [{id, name, similarity, reason}], recommendation }`.
- **`quality-scores.json`** — array of `{ id, name, category, overall,
  dimensions: { correctness, completeness, performance, accessibility,
  uniqueness }, tier, flags }`.
- **`CURATION-REPORT.md`** — human-readable summary with tables. Regenerated
  from JSON on every run; never edited by hand.

The JSON files are the source of truth; the MD is a rendered view. If a
future consumer needs machine access (e.g. an MCP tool that answers "show me
all B-tier loaders"), it reads the JSON directly.

### Consequences

- **+** Clear separation of concerns — JSON for machines, MD for humans.
- **+** Stable schema enables downstream tooling without re-parsing markdown.
- **+** Re-running the script is idempotent — outputs are overwritten.
- **−** Four files to maintain. Acceptable given the consumption patterns.
- **−** The MD is large (~30 KB at 1,569 effects). Could be split per
  category in a future iteration.

### Alternatives considered

- **Single JSON, no MD** — rejected: harder to review in a PR.
- **Single MD, no JSON** — rejected: blocks machine consumers.
- **SQLite database** — rejected: overkill for a static catalog; the JSON
  files load in < 50 ms in Bun.
- **CSV exports** — rejected: array fields (tags, dimensions) don't fit CSV
  cleanly; JSON is the natural format.
