# RoyCSS Semantic Versioning Policy

- **Owner:** release area (see [`MAINTAINERS.md`](../MAINTAINERS.md))
- **Applies to:** the version number in `package.json` and the lockstep
  manifests, and to the compatibility surface that number describes: the
  effect catalog, the class/token/keyframe namespaces, the artifact schemas,
  and the programmatic exports
- **Related:** [`docs/DEPRECATION.md`](DEPRECATION.md) (how an API entry is
  retired) · [`docs/LTS.md`](LTS.md) (support windows per major) ·
  [`docs/RFC-PROCESS.md`](RFC-PROCESS.md) (major bumps require an RFC) ·
  [`API.md`](../API.md) (the backend route surface)

RoyCSS follows [Semantic Versioning 2.0.0](https://semver.org/). This
document maps each part of the version number to the concrete surfaces in
this repository — the **versioned-effects scheme** — so "is this a breaking
change?" is a lookup, not a judgment call.

---

## 1. What the version number governs

The version number describes the **published effect surface**, which is
exactly these five layers (mechanically enforced by the repo's tests and
release scripts):

| # | Layer | Where | Version-relevant because |
|---|---|---|---|
| 1 | **Effect catalog** — 1,959 effects, 29 categories | `src/lib/roycss-effects.ts` (aggregate of the `effects-batch-*.ts` modules); size and category count pinned by [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts) and [`tests/unit/categories.test.ts`](../tests/unit/categories.test.ts) | Removing/renaming an effect changes the public class set |
| 2 | **Effect schema** (`CSSEffect`) | `src/lib/roycss-types.ts` | Downstream tools (backend `effects` service, MCP server, CLI, VS Code extension) parse `dist/effects.json` against this shape |
| 3 | **Namespace contracts** | classes `roycss-<id>` · keyframes `roy-*` · tokens `--roycss-*` (defaults in `src/lib/design-tokens.ts`) | These names are what users write into markup and stylesheets — the true public API |
| 4 | **Published artifacts** | `dist/` — `roycss.css`, `effects.json`, `class-index.json`, `motion-library.json` (+ critical/fallbacks CSS), regenerated per release by `scripts/generate-effects-json.ts` and the package build | The npm package *is* these artifacts; their schemas are consumer-facing |
| 5 | **Programmatic exports** | `src/lib/roycss-index.ts` (`getClass`, `getCSS`, `getByCategory`, `search`, …) and the ESM/CJS builds in `dist/` | Function signatures are API |

Layers 1–4 are CSS-and-data: that is the library's core identity. Layer 5
exists because the artifacts ship with a small framework-agnostic access
layer (import `roycss`, call `getClass("pulse-glow")` → `"roycss-pulse-glow"`).

**Not governed by the version number:** the platform website's own markup
and components, the backend's route list (that surface has its own drift
gate against [`API.md`](../API.md)), and internal build tooling. Those
evolve continuously and are covered by their own policies
([`docs/SLA.md`](SLA.md)), not by the package's semver.

---

## 2. Major (X.0.0) — a breaking change to the published surface

A major bump is required when **any** of the following happens:

1. **A public class is removed or renamed** — e.g. deleting
   `.roycss-pulse-glow` or renaming it to `.roycss-glowing-pulse`. Users'
   markup stops matching; that is the definition of breaking.
2. **A public keyframe is removed or renamed** (`roy-*`).
3. **A token's name is removed or changed** (`--roycss-*`). A token's
   *default value* changing is a minor (with a release note) — unless the
   change breaks unmodified effects that consume the token, which is a
   major (see §3 item 4).
4. **The `CSSEffect` schema changes incompatibly** — a required field added,
   a field renamed or removed, or a field's type narrowed. Consumers of
   `dist/effects.json` (the backend effects service reads it at boot) break.
5. **A category is removed or renamed** (the 29-category set is pinned by
   test; changing it deliberately is a catalog-level contract change).
6. **A programmatic export in `src/lib/roycss-index.ts` / `dist/` changes
   signature or disappears.**
7. **An artifact file is removed or renamed** (e.g. retiring
   `dist/class-index.json`).

Major rules:

- Every major ships with **codemods for every breaking change** and a
  migration guide; a breaking change without a codemod blocks the release
  (restated from [`docs/DEPRECATION.md`](DEPRECATION.md), where the full
  deprecation lifecycle lives).
- Every breaking change must have been **announced in a prior minor** (the
  one-minor-ahead rule, [`docs/LTS.md`](LTS.md) §5).
- A major bump requires an **RFC** ([`docs/RFC-PROCESS.md`](RFC-PROCESS.md)).
- The current major is **2** (the package version is 2.0.0); per
  [`docs/LTS.md`](LTS.md), the previous major line is the LTS line whenever
  a successor ships.

## 3. Minor (X.Y.0) — additive

A minor bump covers:

1. **New effects** added to the catalog (new `roycss-*` classes + keyframes,
   self-contained CSS per effect).
2. **New tokens, new keyframes, new categories** (a *new* category grows the
   set — that is additive, unlike renaming/removing, which is major).
3. **Promotions** of experimental surfaces to stable.
4. **Token default-value changes**, provided no unmodified shipped effect
   breaks — the effect corpus test suite is the arbiter; a default change
   that breaks a shipped effect is a major.
5. **Additive schema changes** to `CSSEffect` / artifacts — optional fields
   only, so older consumers keep parsing (`childCount?` and `previewText?`
   are the existing precedent: optional from day one).
6. **New programmatic exports**.
7. **Deprecation markings** — a deprecation is announced in a minor, never
   sprung in a major (see [`docs/DEPRECATION.md`](DEPRECATION.md)).

Minors never break layers 1–5. The release that changes the pinned catalog
count (1,959) is additive and therefore a minor, *with* the pinned tests
updated in the same PR so CI never disagrees with the README.

## 4. Patch (X.Y.Z) — fixes only

A patch bump covers:

- **Bug fixes** in an effect's CSS (rendering correctness, selector fixes).
- **Accessibility fixes** (reduced-motion blocks, contrast, focus
  visibility) — these are treated as bugs, not features.
- **Performance fixes** (compositing, animation-cost) with no API change.
- **Docs/metadata fixes** inside effect entries (description, tags).
- **Regenerations** of `dist/` artifacts when source and artifact drifted.

A patch must change **no** class name, token name, keyframe name, schema
field, or export — and no token default. If it does, it is not a patch.

---

## 5. How versions are actually bumped (mechanics)

- **`scripts/release/bump-version.ts`** is the only sanctioned way to change
  the version: it bumps the library manifest and the lockstep manifests
  (CLI, MCP server, VS Code extension — see
  `scripts/release/release.config.ts`) **atomically**. Hand-editing version
  strings is a release-review fail.
- **`scripts/generate-effects-json.ts`**, `scripts/build-package.ts`, and
  `scripts/generate-build-artifacts.ts` regenerate `dist/effects.json`, the
  CSS artifacts, `dist/class-index.json`, and `dist/motion-library.json`
  respectively from the TypeScript source, so a release never ships
  artifacts that disagree with the catalog.
- The changelog is generated by the release scripts in
  Keep-a-Changelog format, and the version module of the backend reads the
  real package version and manifest rather than a hardcoded string.

Pre-release identifiers (`-alpha.N`, `-beta.N`, `-rc.N`) follow semver: they
publish ahead of a major, are excluded from LTS support until GA, and are
never relied upon by the pinned invariants.

---

## 6. Compatibility oracle

The project's answer to "did anything break?" is mechanical, and lives in
the repo:

1. **Pinned corpus invariants** — [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts):
   1,959 effects, unique ids, class-selector/id correspondence, keyframe
   collision locks.
2. **Category pin** — [`tests/unit/categories.test.ts`](../tests/unit/categories.test.ts):
   exactly 29.
3. **Typecheck gate** — `bunx tsc --noEmit`, 0 errors.
4. **Unit suite** — 248 tests must pass before any release.
5. **API drift gate** — for the backend surface ([`API.md`](../API.md)).

A release that cannot pass 1–4 is not released. Semver compliance is
therefore enforced where it matters — at the catalog level, by tests that
fail loudly — rather than by memory.

---

## 7. Policy details

- **0.x-style instability does not apply**: the package is at 2.x; the
  pre-1.0 semver carve-out ("anything may change") is retired. Current
  policy is full semver discipline.
- **Version numbers are never reused**: a version that was published (even
  a broken one) is yanked, not re-published under the same number.
- **Ambiguity rule**: if a change is arguably both minor and major, it is
  major. The cost asymmetry (a surprising major vs. a broken user) decides.
- **Questions about classification** go through lazy consensus
  ([`docs/GOVERNANCE.md`](GOVERNANCE.md) §3.2) with the release area owner;
  genuinely contested cases escalate per [`docs/GOVERNANCE.md`](GOVERNANCE.md) §3.3
  and, if they set precedent, are written into this document.

---

## 8. Change history for this policy

| Revision | Change |
|---|---|
| Initial | Policy established with the governance documentation set (PF-005), mapped to the versioned-effects scheme (catalog, schema, namespaces, artifacts, exports). |
