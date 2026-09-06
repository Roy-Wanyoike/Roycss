# RoyCSS Deprecation Policy

- **Owner:** release area (see [`MAINTAINERS.md`](../MAINTAINERS.md))
- **Applies to:** every entry of the versioned-effects surface — effect
  classes (`roycss-*`), keyframes (`roy-*`), tokens (`--roycss-*`), schema
  fields of `CSSEffect` and the `dist/` artifacts, programmatic exports, and
  artifact files themselves
- **Related:** [`docs/SEMVER.md`](SEMVER.md) (what counts as breaking) ·
  [`docs/LTS.md`](LTS.md) (the one-minor-ahead announcement rule and backport
  policy) · [`docs/RFC-PROCESS.md`](RFC-PROCESS.md) (major bumps require an
  RFC)

---

## 1. The rule, in one line

**A `stable` surface entry is never simply deleted.** It is marked deprecated
in a minor release (soft warning), a codemod is shipped for it, it stays
usable for **at least 6 months**, and only then is it **removed in the next
major**.

Everything below is the machinery that makes that line true, verifiable, and
boring — boring is the point. Deprecation is a scheduled process, not an
event.

---

## 2. The four stages

### Stage 1 — Deprecation notice (in a minor release)

An entry slated for removal is first **marked deprecated in a minor release**
of the current major. The marking has three parts:

1. **Catalog entry.** The effect's entry in `src/lib/` carries a deprecation
   annotation (description text + tag) naming the replacement and linking
   this policy. The deprecation is visible wherever the catalog is consumed:
   the site's effect pages, the `/api/v1/effects` responses, and the
   regenerated `dist/effects.json`.
2. **Release note.** The minor's changelog entry lists every newly
   deprecated name in one place, with its replacement and its removal major.
3. **Soft warning.** In development contexts, use of the deprecated surface
   produces a **soft console warning** that names the replacement. Soft
   means: it never throws, never breaks rendering, and is stripped from
   production builds — a deprecation warning must not itself become an
   outage. The warning exists to be seen by the developer during upgrade,
   not to punish end users.

Stage 1 is deliberately the *only* thing that happens in the first minor:
no behavior change, no removed CSS. A consumer who ignores the entire
deprecation program still keeps rendering correctly until the major.

### Stage 2 — Codemod shipped

Immediately after (or with) the deprecation notice, the project ships an
**automated migration** for the deprecated name:

- The codemod performs the mechanical rewrite — class renames in markup and
  stylesheets (`roycss-old` → `roycss-new`), token renames, keyframe
  renames, and equivalent transforms for schema/export consumers.
- Codemods are **versioned with the release that requires them**, so the
  migration for a given major is a single runnable command, not a wiki page
  of manual steps.
- The codemod is tested against the real catalog: it must transform every
  deprecated name the release deprecates and leave every non-deprecated name
  untouched. A codemod that ships with a "known to miss cases" caveat must
  document exactly which cases in its own output.
- The deprecation warning (Stage 1) and the changelog entry both point to
  the codemod, so the path from "I saw a warning" to "I ran the fix" is one
  step.

A deprecation whose codemod is not shipped is not a deprecation — it is a
promise the project has not yet made. In that state, the removal date is not
scheduled (the Stage 3 clock never starts).

### Stage 3 — The 6-month dwell

After Stage 1's notice, the deprecated entry remains **fully functional for
a minimum of 6 months**. During the dwell:

- The deprecated CSS continues to ship in `dist/roycss.css` and the entry
  stays in `dist/effects.json` — no gaps in the published surface.
- Security and critical fixes still land on the deprecated entry: a
  deprecated effect with an XSS-class issue gets the fix like any other
  effect (fixes are patch-level; deprecation is orthogonal to support — see
  [`docs/SLA.md`](SLA.md)).
- The LTS line's consumers are inside the same policy: deprecation clocks
  and dwell apply to the LTS line as published in [`docs/LTS.md`](LTS.md).

The 6-month floor is a **minimum**, not a target. The removal major's
timeline may push the practical window longer (e.g., if the next major is
more than 6 months out, the dwell is necessarily longer), and for
high-impact surfaces (a widely used effect or token) the project may
deliberately extend the window across an entire additional major — recorded
in the release notes when it happens.

### Stage 4 — Removal in the next major

The actual removal happens **only in a major release** (see
[`docs/SEMVER.md`](SEMVER.md) §2), and only when all of the following hold:

1. The Stage 1 notice shipped in a **prior minor** (the one-minor-ahead
   rule, [`docs/LTS.md`](LTS.md) §5).
2. The Stage 2 codemod shipped and covers the removal.
3. The 6-month dwell elapsed.
4. The major bump has an accepted RFC listing this removal among its
   breaking changes ([`docs/RFC-PROCESS.md`](RFC-PROCESS.md)).

At removal time, the class/keyframe/token leaves the published CSS and the
entry leaves the catalog; the pinned corpus tests
([`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts)) are updated
in the same release so the invariants (catalog size, uniqueness, id↔class
correspondence) are never silently violated.

---

## 3. The deprecation register

Every active deprecation is tracked in a register that ships with the
release notes, so the state of the contract is inspectable at any time:

| Field | Meaning |
|---|---|
| **Name** | The exact `roycss-*` / `roy-*` / `--roycss-*` / schema field being retired |
| **Deprecated in** | The minor release that carried the Stage 1 notice |
| **Replacement** | The new name, or "none — pattern removed" with guidance |
| **Codemod** | The command that migrates usage |
| **Earliest removal** | The earliest major in which removal can occur (never sooner than 6 months after the notice) |

The register is generated from the catalog's deprecation annotations — the
catalog is the source of truth, the register is a rendering, so the two
cannot drift. This mirrors the repo's existing discipline: numbers and
states are pinned in code (`src/lib/module-status.ts` does exactly this for
product-module honesty), and docs render them rather than restate them.

---

## 4. What gets deprecated (and what does not)

**Deprecation is for `stable` surface entries** — names users write or
parse. It is not for:

- **Effect *content*.** Rewriting an effect's keyframes or visual behavior
  is a fix or a minor change (per [`docs/SEMVER.md`](SEMVER.md)), not a
  deprecation — the name is the contract, the pixels are the mutable part.
- **Internal code.** Modules, helpers, and build scripts inside the repo
  change freely; nothing internal is "deprecated" because nothing internal
  is promised.
- **Experimental surfaces.** Experimental entries can change in any minor
  without the ceremony — that is what experimental means. They graduate to
  `stable` (earning this policy's protection) or they are withdrawn with a
  release note, per the stability model in [`docs/SEMVER.md`](SEMVER.md).
- **Platform UI.** Site components and pages follow
  [`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md), not semver.

---

## 5. Compatibility bridges

For high-impact removals, Stage 4 may include a **compatibility layer**
instead of a hard removal:

- A small, documented alias that maps the old name to the new behavior
  (e.g., a CSS rule that forwards the old class to the new one), shipped
  with the new major.
- The bridge is **deprecated on arrival**: it appears in the register with
  its own removal major, and it never survives more than one major. A
  bridge is a migration tool, not a second API.

Bridges are the exception path; the default path is codemod + removal. The
choice is made in the removal RFC, where the community can see it.

---

## 6. Violations of this policy are release blockers

The following situations block a release outright (release area owner's
checklist, see [`MAINTAINERS.md`](../MAINTAINERS.md) §3.8):

- A removal landing in a major without a prior-minor notice (Stage 1).
- A removal whose dwell would be shorter than 6 months.
- A deprecated name disappearing from `dist/roycss.css` or
  `dist/effects.json` before its removal major (silent removal).
- A deprecation warning that throws or breaks production rendering.
- Pinned catalog tests updated to a smaller number **without** a matching
  register entry + changelog section explaining exactly which deprecated
  entries were removed.

---

## 7. Change history for this policy

| Revision | Change |
|---|---|
| Initial | Policy established with the governance documentation set (PF-005): 4-stage lifecycle (notice → codemod → 6-month dwell → removal in next major), register, bridge rules, release-blocker checklist. |
