# RoyCSS Long-Term Support (LTS) Policy

- **Owner:** release area (see [`MAINTAINERS.md`](../MAINTAINERS.md))
- **Applies to:** the `roycss` npm package, the effect catalog in `src/lib/`, the
  published `dist/` artifacts, and the platform frontends that consume them
- **Related policies:** [`docs/SEMVER.md`](SEMVER.md) ·
  [`docs/DEPRECATION.md`](DEPRECATION.md) ·
  [`docs/SLA.md`](SLA.md) ·
  [`docs/SECURITY-SLA.md`](SECURITY-SLA.md)

---

## 1. Purpose

RoyCSS is used in production interfaces. Teams that adopt the catalog — 1,959
effects across 29 categories — need to know **how long the major version they
build on will keep receiving fixes**, and what happens when the project moves
on. This document is that commitment. It defines:

1. The LTS line: **one active major LTS line at all times.**
2. The support window: **18 months after the successor major ships.**
3. What support means: **critical patches and security fixes are backported**;
   new features are not.
4. The breaking-change contract: **announced one minor ahead, with codemods.**

This policy exists so that an engineering manager can answer "what is our
migration risk if we adopt RoyCSS?" with a document instead of a guess. It is
reviewed on the quarterly governance cadence defined in
[`docs/GOVERNANCE.md`](GOVERNANCE.md).

---

## 2. The versioned-effects scheme this policy protects

RoyCSS ships effects as a **versioned public API surface**, not as a loose
folder of stylesheets. The concrete mechanics, all of which live in the repo
today:

| Surface | Where it lives | Version contract |
|---|---|---|
| Effect catalog (1,959 effects, 29 categories) | `src/lib/roycss-effects.ts` aggregating the `effects-batch-*.ts` modules | Size and category count are pinned by tests — see [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts) and [`tests/unit/categories.test.ts`](../tests/unit/categories.test.ts) |
| Effect schema (`CSSEffect`) | `src/lib/roycss-types.ts` | Field set is part of the compatibility surface consumed by `dist/effects.json` |
| Class-name namespace (`roycss-<id>`) | every effect's `cssCode` | Renaming or removing a public class is a breaking change |
| Keyframe namespace (`roy-*`) | every effect's `cssCode` | Same rule as classes |
| Token namespace (`--roycss-*`) | `src/lib/design-tokens.ts` | Token *names* are stable for the major; defaults may change in a minor with a release note |
| Published artifacts | `dist/` — `roycss.css`, `effects.json`, `class-index.json`, `motion-library.json` | Regenerated from source by `scripts/generate-effects-json.ts` and the build scripts on every release |
| Package version | `package.json` | Bumped across the lockstep manifests by `scripts/release/bump-version.ts` (library, CLI, MCP server, VS Code extension — see `scripts/release/release.config.ts`) |

SemVer itself — what a major, minor, and patch bump mean for each row of this
table — is defined in [`docs/SEMVER.md`](SEMVER.md). The LTS policy below is
the *time* dimension layered on top of that *compatibility* dimension.

---

## 3. The LTS line

### 3.1 One active major, always

At any point in time, exactly **one major version line** is designated LTS.
While `main` tracks the current development major, the most recently
superseded major remains in support. There is never a gap, and there is never
overlap: the moment a new major is declared stable, the previous major becomes
the LTS line and the one before it reaches end-of-life (EOL).

### 3.2 The 18-month window

The LTS line is supported for **18 months after its successor major ships**
(the general-availability release, not the first beta or release candidate).
Concretely:

- If major `N+1` ships at time `T`, major `N` is supported until `T + 18 months`.
- 18 months is a floor for planning, not a promise of new features: it is the
  window during which the LTS line receives the backports described in §4.
- If a successor major has not shipped, the current major remains the
  supported line indefinitely — support does not lapse while no successor
  exists.

### 3.3 Announcing the clock

When a new major reaches general availability:

1. The release notes state the exact **end-of-support date** for the previous
   major (18 months out), phrased as a date, not a vague season.
2. The README and the effect catalog pages for the affected major link the
   LTS policy and the end-of-support date.
3. A migration guide is published alongside the major, listing every breaking
   change, its replacement, and the codemod command (see
   [`docs/DEPRECATION.md`](DEPRECATION.md)).
4. The 12-month and 15-month marks trigger a reminder in the release notes of
   the LTS line's own patches, so teams are never surprised by the EOL date.

### 3.4 What "supported" means — and does not mean

Supported on the LTS line:

- **Security fixes** for vulnerabilities in the LTS line, per the timelines in
  [`docs/SECURITY-SLA.md`](SECURITY-SLA.md).
- **Critical bug fixes**: anything that breaks an unmodified, documented use of
  a `stable` effect, token, or artifact — rendering corruption, broken
  exports, regressions against the test suite.
- **Accessibility fixes** for WCAG failures in shipped effects (the project's
  accessibility bar is described in [`docs/CONTRIBUTING.md`](CONTRIBUTING.md)).
- **Backports** of fixes that do not depend on APIs introduced after the LTS
  major (§4.2).

Explicitly *not* supported on the LTS line:

- New effects, new categories, or new tokens.
- New features in the platform products, the CLI, the MCP server, or the VS
  Code extension.
- Performance work that requires restructuring shared CSS.
- Bug fixes that only affect `experimental` surfaces.

LTS is a maintenance commitment, not a feature stream. Teams that want new
effects move to the current major; teams that want stability stay on LTS and
plan their migration inside the 18-month window.

---

## 4. Backport policy

### 4.1 What qualifies for backport

A change qualifies for backport to the LTS line if **all** of the following
hold:

1. It fixes a security vulnerability rated Critical or High
   ([`docs/SECURITY-SLA.md`](SECURITY-SLA.md)).
2. It fixes a critical functional or accessibility defect in a `stable`
   surface.
3. It applies cleanly to the LTS line without depending on post-LTS APIs.
   When a fix conflicts, the area owner prepares a hand-ported equivalent and
   records the divergence in the release notes.

Anything else — improvements, refactors, dependency bumps for convenience —
is not backported. Backports are labeled as such in the changelog entry.

### 4.2 Mechanics

- Fixes land on `main` first, then are cherry-picked to the LTS branch/tag
  and released as a patch bump on the LTS line (`X.Y.Z` on the LTS major).
- The version bumper (`scripts/release/bump-version.ts`) is used for LTS
  patch releases exactly as for regular ones — the lockstep manifests are
  never hand-edited.
- Every backported release regenerates the `dist/` artifacts from the LTS
  source tree (`scripts/generate-effects-json.ts` and the package build), so
  `dist/effects.json`, `dist/class-index.json`, and friends stay consistent
  with the tag they ship under.
- LTS patch releases are announced in the same channels as regular releases
  and are marked with an LTS note in the changelog.

### 4.3 What never happens

- A backport may not silently change the effect catalog size or category set
  pinned by the test suite for that line. If the catalog must change on an
  LTS line, that is a deprecation question, and the process in
  [`docs/DEPRECATION.md`](DEPRECATION.md) governs it.
- A backport may not introduce a new dependency.

---

## 5. Breaking changes and the one-minor announcement rule

RoyCSS treats breaking changes as a **planned, announced event**, never a
surprise:

1. **Announcement.** Any breaking change intended for the next major is
   announced in a **minor release of the current major** first — in the
   changelog entry, in the affected effect's catalog entry, and in the
   deprecation register (see [`docs/DEPRECATION.md`](DEPRECATION.md)). A
   breaking change that was never announced in a prior minor does not ship,
   even if the code is ready.
2. **Codemod.** Every breaking change ships with an automated migration — a
   codemod that rewrites consumer code (class renames, token renames,
   keyframe renames). A breaking change without a codemod blocks the release.
   Codemods are versioned with the release that needs them, and their
   limitations are documented, not hidden.
3. **Escape hatch.** For high-impact removals, a documented compatibility
   path (deprecated alias or fallback artifact) may bridge one major. It is
   removed in the following major.
4. **RFC gate.** A major-version bump itself goes through the RFC process
   ([`docs/RFC-PROCESS.md`](RFC-PROCESS.md)) so the community sees the full
   breaking-change list before it becomes irreversible.

---

## 6. End of life

When the 18-month window closes:

1. The EOL announcement is included in the release notes of the final LTS
   patch and in the repository README.
2. The catalog pages and docs for the EOL'd major state clearly that the line
   is unsupported and no longer receives security fixes.
3. The security policy's supported-versions table is updated: vulnerabilities
   reported against an EOL line are triaged only if they reproduce on a
   supported line.
4. The git tag and branch for the EOL line remain in the repository for
   reference and audit; they are not deleted.

---

## 7. Single-maintainer honesty clause

RoyCSS is currently maintained by a single maintainer (see
[`MAINTAINERS.md`](../MAINTAINERS.md) for the area-owner table and the
recruitment plan). This document is written so that the policy survives that
reality rather than assuming a team that does not exist:

- The 18-month window and the backport commitments are the *contract*; where
  the current maintainer's capacity could delay a backport, the delay is
  communicated on the affected issue with a revised target — silently missed
  timelines are treated as a policy violation, not a rounding error.
- The LTS policy is one of the standing inputs to the quarterly architecture
  review ([`docs/SLA.md`](SLA.md) §7), which explicitly checks whether LTS
  commitments are on track.
- Recruiting a second maintainer with release-area authority (per the
  recruitment plan in [`MAINTAINERS.md`](../MAINTAINERS.md)) is the single
  highest-leverage mitigation for LTS execution risk.

---

## 8. Acceptance checklist (how you know this policy is being followed)

- [ ] Exactly one major line is designated LTS at any time.
- [ ] Every major GA release states the previous major's end-of-support date.
- [ ] Critical and security fixes reach the LTS line as patch releases,
      regenerated from the LTS source tree.
- [ ] Every breaking change was announced in a prior minor and ships with a
      codemod.
- [ ] No LTS release changes the pinned catalog invariants for that line.
- [ ] EOL'd lines are marked unsupported in the README and security policy.

---

## 9. Change history for this policy

This policy is versioned with the repository. Substantive changes (window
length, backport scope, announcement rules) require an RFC per
[`docs/RFC-PROCESS.md`](RFC-PROCESS.md) and are recorded here.

| Revision | Change |
|---|---|
| Initial | Policy established with the governance documentation set (PF-005). |
