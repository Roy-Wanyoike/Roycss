# RoyCSS npm Publication Pipeline — Implementation Plan

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** npm Publication Pipeline domain
- **Scope:** Build the full release pipeline from empty directory to
  tested dry-run. Step-by-step plan to take the pipeline from zero to
  "run `bun run scripts/release/publish.ts` and trust it".

---

## Phase 0 — Setup (5 min)

1. Create `docs/adr/npm-pipeline/` with `DESIGN.md`, `ADR.md`,
   `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`, `REVIEW-CHECKLIST.md`.
2. Create `scripts/release/` with a `changelog-entries/` subdirectory
   (with `.gitkeep` so the directory survives in git).
3. Confirm the existing `.github/workflows/` directory exists (it
   does — it has the old `release.yml`). We will overwrite
   `release.yml` in Phase 3.

**Exit criteria:** `docs/adr/npm-pipeline/` contains 5 markdown files.
`scripts/release/` contains `changelog-entries/.gitkeep`. `.github/workflows/`
exists.

---

## Phase 1 — Shared config (10 min)

1. Write `scripts/release/release.config.ts`:
   - Export `PACKAGE_NAME = "roycss"`.
   - Export `REGISTRY = "https://registry.npmjs.org"`.
   - Export `ACCESS = "public"`.
   - Export `MANIFEST_PATH` (absolute path to `package.roycss.json`).
   - Export `LOCKSTEP_MANIFESTS` (array of 4 paths: `package.roycss.json`,
     `cli/package.json`, `mcp-server/package.json`,
     `vscode-extension/package.json`).
   - Export `CHANGELOG_PATH`, `CHANGELOG_ENTRIES_DIR`,
     `CHANGELOG_CONSUMED_DIR`.
   - Export `GITHUB_REPO = "Roy-Wanyoike/roycss"`.
   - Export `TARBALL_MAX_KB = 500`, `FILE_COUNT_MAX = 15`.
2. Validate: `bun run scripts/release/release.config.ts` (no output, no
   error).

**Exit criteria:** `release.config.ts` exports all constants, runs
without error.

---

## Phase 2 — bump-version.ts (20 min)

1. Write `scripts/release/bump-version.ts`:
   - Parse `process.argv` for `--major`, `--minor`, `--patch`,
     `--version <x.y.z>`. Reject if zero or more than one of these is
     given.
   - Read the current version from `package.roycss.json` (the source of
     truth).
   - Compute the new version:
     - `--major`: bump major, reset minor and patch to 0.
     - `--minor`: bump minor, reset patch to 0.
     - `--patch`: bump patch.
     - `--version X.Y.Z`: use as-is (validate semver shape).
   - For each of the 4 lockstep manifests, read the file, replace the
     `version` field, write back. Use 2-space indentation to match the
     existing style.
   - Print a summary: `bumped <old> → <new> across 4 manifests`.
   - Exit 0 on success, 1 on any error (missing file, invalid semver,
     conflicting flags).
2. Test:
   - `bun run scripts/release/bump-version.ts --patch` → all 4 files
     show `1.0.1`.
   - Revert with `git checkout -- package.roycss.json cli/package.json
     mcp-server/package.json vscode-extension/package.json` (or
     manually restore to `1.0.0`).
   - Test `--version 2.0.0-rc.1` (validates pre-release shape).
   - Test `--major --minor` (conflicting — should error).

**Exit criteria:** `bump-version.ts` updates all 4 manifests atomically.
Reverting restores `1.0.0` everywhere.

---

## Phase 3 — generate-changelog.ts (25 min)

1. Write `scripts/release/generate-changelog.ts`:
   - Read every `*.md` file in `scripts/release/changelog-entries/`
     (excluding `.gitkeep`). Parse YAML frontmatter (`type`, `pr`).
     Validate `type` is one of the 6 Keep a Changelog types.
   - Group entries by `type`. Within each group, sort by `pr` ascending.
   - Read the existing `CHANGELOG.md`. Parse out the existing released
     sections (`## [x.y.z] — YYYY-MM-DD`) and the footer link
     definitions.
   - Emit a new `CHANGELOG.md`:
     - Header (title + Keep a Changelog + Semver links).
     - `## [Unreleased]` section (if there are pending entries),
       with sub-sections per type, each entry bullet linked to the PR.
     - All previously-released sections, verbatim.
     - Footer link definitions: `[Unreleased]: ...compare/v<last>...HEAD`
       and `[<version>]: ...releases/tag/v<version>` for each.
   - Move consumed entry files to
     `scripts/release/changelog-entries/consumed/<timestamp>-<filename>`.
   - Print a summary: `assembled <N> entries into Unreleased section`.
   - Exit 0 on success, 1 on parse error (bad frontmatter, invalid
     type, etc.).
2. Add a sample entry file at
   `scripts/release/changelog-entries/EXAMPLE.md` (frontmatter + body)
   so maintainers can copy-paste. Add a `.gitignore` entry? No — the
   example file is committed as documentation; only files matching
   `[0-9]*.md` or `*.md` are consumed, so the example is parsed too.
   Better: name the example `_EXAMPLE.md` and have the script skip
   files starting with `_`.
3. Test:
   - Drop a sample entry (`type: added`, `pr: 999`) into
     `changelog-entries/`.
   - Run `bun run scripts/release/generate-changelog.ts`.
   - Verify `CHANGELOG.md` has a new `## [Unreleased]` section with
     the entry under `### Added`.
   - Verify the entry file was moved to `consumed/`.

**Exit criteria:** `generate-changelog.ts` produces a valid Keep a
Changelog `CHANGELOG.md` with an `Unreleased` section.

---

## Phase 4 — publish.ts (25 min)

1. Write `scripts/release/publish.ts`:
   - Parse `--execute` flag (default: dry-run).
   - Step 1: `bun run lint` — must exit 0.
   - Step 2: `bun run scripts/build-package.ts` — must exit 0.
   - Step 3: `npm publish --dry-run` — must exit 0. Parse the output
     for tarball size + file count. Warn (don't fail) if size > 500 KB
     or file count > 15.
   - Step 4 (only if `--execute`):
     - Run `npm publish --provenance --access public`.
     - On success, create the git tag `v<version>` and print a
       reminder to `git push origin v<version>`.
     - On failure, exit 1 with a clear error message.
   - Step 5 (always): print a summary table.
2. Test:
   - `bun run scripts/release/publish.ts` (dry-run) → lint + build +
     dry-run pass, no actual publish, no git tag.
   - Verify the script does NOT call `npm publish` without `--execute`.
3. Edge cases:
   - `npm publish` requires the package to be unpublishable on the
     registry. In a sandbox (no `NPM_TOKEN`), `npm publish --dry-run`
     works but `npm publish` would 401. The dry-run is the test path.
   - If `--execute` is passed without `NPM_TOKEN`, the script should
     fail with a clear message ("NPM_TOKEN not set — set it in your
     env or run from CI").

**Exit criteria:** `publish.ts` dry-run completes without errors. No
actual publish occurs.

---

## Phase 5 — README + sample entry (10 min)

1. Write `scripts/release/README.md`:
   - Quick reference table (command → what it does → publishes?).
   - Step-by-step release walkthrough.
   - Emergency publish (laptop) section.
   - Rollback / deprecate section.
   - Reference to the design docs.
2. Write `scripts/release/changelog-entries/_EXAMPLE.md`:
   - Frontmatter + body template.
3. Write `scripts/release/changelog-entries/_README.md`:
   - One-paragraph explanation of how to add an entry.

**Exit criteria:** `README.md` is complete and accurate. The example
entry is clearly marked as a template (filename starts with `_`).

---

## Phase 6 — GitHub Actions workflow (15 min)

1. Overwrite `.github/workflows/release.yml`:
   - Trigger: `push: tags: ['v*']` only (no `push` to branches, no
     `workflow_dispatch` for publish — `workflow_dispatch` is allowed
     only as a manual re-run, not a primary trigger).
   - Concurrency: `release-${{ github.ref }}`, `cancel-in-progress: false`.
   - Permissions: `contents: write`, `id-token: write`.
   - Steps:
     - `actions/checkout@v4` (fetch-depth: 0).
     - `oven-sh/setup-bun@v2`.
     - `actions/setup-node@v4` (node 20, `registry-url: https://registry.npmjs.org`).
     - `bun install --frozen-lockfile`.
     - `bun run lint`.
     - `bun run scripts/build-package.ts`.
     - Verify the tag matches the version in `package.roycss.json`
       (fail if mismatch).
     - `npm publish --provenance --access public` (env: `NODE_AUTH_TOKEN:
       ${{ secrets.NPM_TOKEN }}`).
     - Summary step.
2. Validate YAML syntax: `node -e "require('yaml').parse(...)"` or
   `node -e "require('js-yaml').load(...)"`.
3. Manual review: confirm the trigger is `push.tags.v*`, the permissions
   are minimal, and `NPM_TOKEN` is passed via `NODE_AUTH_TOKEN` (not
   `NPM_TOKEN` directly — `actions/setup-node` reads `NODE_AUTH_TOKEN`).

**Exit criteria:** `release.yml` parses as valid YAML, triggers on tag
push only, uses `NODE_AUTH_TOKEN` for auth.

---

## Phase 7 — Update existing files (10 min)

1. Update `CHANGELOG.md` (root):
   - Keep the existing `## [1.0.0] — 2026-07-28` section.
   - Add a `## [Unreleased]` section at the top (between the header
     and `1.0.0`) with placeholder sub-sections (Added / Changed /
     Fixed / Security).
   - Add the link definitions at the bottom:
     `[Unreleased]: https://github.com/Roy-Wanyoike/roycss/compare/v1.0.0...HEAD`
     `[1.0.0]: https://github.com/Roy-Wanyoike/roycss/releases/tag/v1.0.0`
2. Update `package.roycss.json`:
   - Add `"publishConfig": { "access": "public", "provenance": true }`.
   - Place it after `"engines"` (alphabetical-ish ordering is already
     broken; we add at the end of the object).

**Exit criteria:** `CHANGELOG.md` has `[Unreleased]` + `[1.0.0]`
sections with link definitions. `package.roycss.json` has `publishConfig`.

---

## Phase 8 — Testing & verification (15 min)

1. `cd /home/z/my-project && bun run lint` — must exit 0.
2. `cd /home/z/my-project && bun run scripts/release/bump-version.ts --patch`:
   - Verify all 4 manifests show `1.0.1`.
   - Revert: `git checkout -- package.roycss.json cli/package.json
     mcp-server/package.json vscode-extension/package.json` (or manually
     restore to `1.0.0`).
3. `cd /home/z/my-project && bun run scripts/release/generate-changelog.ts`:
   - Verify `CHANGELOG.md` is valid Keep a Changelog.
   - Verify no entry files exist yet (no `[Unreleased]` body — that's
     OK; the section is a placeholder).
4. `cd /home/z/my-project && bun run scripts/release/publish.ts`:
   - Must complete lint + build + `npm publish --dry-run`.
   - Must NOT call `npm publish` (no `--execute`).
   - Capture: tarball size, file count.
5. Validate `.github/workflows/release.yml` YAML syntax.

**Exit criteria:** All 5 tests pass. No errors. No accidental publish.

---

## Phase 9 — Worklog (5 min)

1. Append a `---`-delimited section to `worklog.md` with:
   - Task ID: `npm-publication-pipeline`
   - Agent: npm Publication Pipeline
   - Task: (one-line summary)
   - Work Log: (bullet list of what was done)
   - Stage Summary: (what's complete, what's pending, what's blocked)

**Exit criteria:** `worklog.md` has the new section appended.
