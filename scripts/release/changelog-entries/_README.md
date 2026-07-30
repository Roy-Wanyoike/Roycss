# Changelog entries — RoyCSS release pipeline

This directory holds **unreleased changelog entry files**. Each file is a
single markdown file with YAML frontmatter that describes one change. The
`generate-changelog.ts` script reads all `*.md` files here, assembles them
into the `[Unreleased]` section of the root `CHANGELOG.md`, and moves the
consumed files into `consumed/`.

## File naming

- Any `*.md` file in this directory is treated as an entry.
- Files starting with `_` are **skipped** (e.g. `_EXAMPLE.md`,
  `_README.md`). Use this prefix for templates and documentation.
- `.gitkeep` is also skipped.

## Frontmatter format

```markdown
---
type: added
pr: 142
---

Added 12 new glassmorphism effects to the glass-ui category. New ids:
`roycss-glass-frost`, `roycss-glass-aurora`, …
```

### `type` (required)

One of (case-insensitive):

| Value         | Section in CHANGELOG.md | Use for |
|---|---|---|
| `added`       | Added       | New effects, new categories, new exports, new features |
| `changed`     | Changed     | Changes to existing functionality (renames, behavior tweaks) |
| `deprecated`  | Deprecated  | Features that still work but will be removed |
| `removed`     | Removed     | Features removed in this version (always a major bump) |
| `fixed`       | Fixed       | Bug fixes |
| `security`    | Security    | Vulnerability fixes (also gets a GitHub Security Advisory) |

### `pr` (optional but recommended)

The GitHub PR number. Used to linkify the entry — the bullet in the
changelog becomes `- <body> ([#142](https://github.com/Roy-Wanyoike/roycss/pull/142))`.

If omitted, the entry is still emitted, just without a PR link.

## Body

Markdown. First line becomes the bullet; subsequent lines are indented
under the bullet. Keep entries to 1–3 lines — the changelog is a summary,
not a design doc.

## Lifecycle

1. **Author** creates an entry file alongside their feature PR (e.g.
   `scripts/release/changelog-entries/142-glass-effects.md`).
2. **PR review** verifies the entry's `type` matches the actual change.
3. **PR merged** to `main`. The entry file lives in the repo.
4. **Maintainer** runs `bun run scripts/release/generate-changelog.ts`
   before cutting a release. The entry is assembled into the
   `[Unreleased]` section of `CHANGELOG.md` and the file is moved to
   `consumed/<timestamp>-<filename>`.
5. **Maintainer** runs `bun run scripts/release/publish.ts --execute`
   to publish. The `[Unreleased]` section is renamed to the new version
   + date by the maintainer (manual step — see `publish.ts` README).

## Example

See `_EXAMPLE.md` for a copy-paste template.
