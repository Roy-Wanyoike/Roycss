# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) for the `roycss` npm package.

## What is a changeset?

A changeset is a small markdown file that declares:
1. **Which package(s)** to bump (we only have one: `roycss`).
2. **What bump type** to apply: `patch`, `minor`, or `major`.
3. **A human-readable summary** that becomes the `CHANGELOG.md` entry.

## How to add a changeset

Run:

```bash
bun run changeset
```

This launches an interactive prompt:
- Select the `roycss` package (space to toggle, enter to confirm).
- Choose bump type:
  - `patch` — bug fixes, doc tweaks, performance improvements (no new features).
  - `minor` — new effects, new features, backwards-compatible changes.
  - `major` — breaking changes (removed effects, renamed classes, dropped Node version).
- Write a short summary (markdown supported).

The output is a new file in this directory like `.changeset/quick-lions-grin.md`:

```markdown
---
"roycss": minor
---

Added 12 new glassmorphism effects to the glass-ui category.
```

Commit the changeset file alongside your feature code in the same PR.

## When to add a changeset

| Change                                                | Bump type |
| ----------------------------------------------------- | --------- |
| New CSS effect(s)                                     | `minor`   |
| New framework adapter, new recipe, new pattern        | `minor`   |
| Bug fix in existing effect                            | `patch`   |
| Dependency upgrade (no behavior change)               | `patch`   |
| Performance improvement (no API change)               | `patch`   |
| Docs / README / CHANGELOG only                        | `patch` (or skip — non-publishing PRs don't need a changeset) |
| Removed an effect                                     | `major`   |
| Renamed a class (`roycss-X` → `roycss-Y`)             | `major`   |
| Bumped minimum Node version                           | `major`   |
| Bumped minimum Bun version                            | `major`   |
| Changed CSS custom property names that consumers use  | `major`   |

## How changesets get consumed

When the release maintainer runs `bun run publish:release` (or CI runs `bun run version`):

1. `changeset version` reads every `.changeset/*.md` file.
2. Computes the highest bump across all of them.
3. Bumps `package.roycss.json` version.
4. Prepends the summary to `CHANGELOG.md`.
5. Deletes the consumed `.changeset/*.md` files.

The release maintainer then commits the bump + changelog + deleted changesets, pushes, and CI publishes.

## Config

`.changeset/config.json`:

- `changelog`: `@changesets/changelog-github` — generates GitHub-flavored changelog entries with links to PRs and authors.
- `access`: `public` — the package is unscoped (`roycss`, not `@org/roycss`), so it must be `public`.
- `baseBranch`: `main` — the branch changesets are consumed on.
- `commit`: `false` — we don't auto-commit; the release maintainer reviews the diff first.
- `updateInternalDependencies`: `patch` — irrelevant for a single-package repo, but kept for future monorepo split.

## Files in this directory

```
.changeset/
├── config.json          # changeset config (changelog, access, baseBranch)
├── README.md            # This file
└── initial-release.md   # Sample changeset declaring the v1.0.0 initial release
```

## Why changesets?

See `docs/adr/04-npm-publish-pipeline.md`. Short version: manual review, npm-native, works with `npm publish --provenance` without forking.
