# RoyCSS Release Pipeline

CI/CD-ready release pipeline for the `roycss` npm package (and its three
lockstep companions: `roycss-cli`, `@roycss/mcp-server`, and the VS Code
extension). Manual version bumping, Keep a Changelog generation, dry-run
verification, and a Sigstore-provenance CI publish.

## Quick reference

| Command                                         | What it does                                                       | Publishes? |
| ----------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| `bun run scripts/release/bump-version.ts --patch` | Bumps version across 4 lockstep manifests.                       | ❌ No      |
| `bun run scripts/release/generate-changelog.ts`   | Assembles `CHANGELOG.md` from `changelog-entries/*.md`.          | ❌ No      |
| `bun run scripts/release/publish.ts`              | Lint → build → `npm publish --dry-run`.                          | ❌ No      |
| `bun run scripts/release/publish.ts --execute`    | Same + real `npm publish` + git tag `v<version>`.                | ✅ Yes (local) |
| push tag `v1.2.3` to GitHub                       | Triggers `.github/workflows/release.yml` → CI publish with provenance. | ✅ Yes (CI) |

## Files in this directory

```
scripts/release/
├── release.config.ts              # Shared config (paths, names, gates, helpers)
├── bump-version.ts                # Version bumper (--major/--minor/--patch/--version)
├── generate-changelog.ts          # Assembles CHANGELOG.md from entry files
├── publish.ts                     # Publish orchestrator (lint → build → dry-run → --execute)
├── README.md                      # This file
└── changelog-entries/
    ├── .gitkeep                   # Keeps the dir in git
    ├── _README.md                 # How to add an entry
    ├── _EXAMPLE.md                # Copy-paste template (skipped by the generator)
    └── <your-entry>.md            # One file per unreleased change
```

## How to release (the safe way)

### 1. Land the change with a changelog entry

On your feature branch, add a file like `scripts/release/changelog-entries/142-glass-effects.md`:

```markdown
---
type: added
pr: 142
---

Added 12 new glassmorphism effects to the glass-ui category.
```

Commit it with your feature code. Open the PR.

**PR review checklist:**
- [ ] The entry's `type` matches the actual change (Added vs Changed vs Fixed).
- [ ] The PR number in the frontmatter is correct.
- [ ] The entry reads well — it will be public in `CHANGELOG.md`.

Merge the PR to `main`.

### 2. Cut the release locally

```bash
git checkout main && git pull

# Determine the bump level:
#   --patch  bug fixes, build changes, no new effects
#   --minor  new effects, new categories, new exports (backward-compatible)
#   --major  removed effects, renamed classes, breaking changes

bun run scripts/release/bump-version.ts --minor
# → all 4 manifests updated: 1.0.0 → 1.1.0

bun run scripts/release/generate-changelog.ts
# → assembles [Unreleased] section in CHANGELOG.md from entry files
# → moves consumed entries to changelog-entries/consumed/

# The [Unreleased] section is now in CHANGELOG.md. Rename it to the new
# version + date — open CHANGELOG.md and change:
#   ## [Unreleased]
# to:
#   ## [1.1.0] — 2026-08-15
# (and add a fresh empty `## [Unreleased]` above it for the next cycle)

# Commit the bump + changelog
git add package.roycss.json cli/package.json mcp-server/package.json \
        vscode-extension/package.json CHANGELOG.md \
        scripts/release/changelog-entries/
git commit -m "chore(release): v1.1.0"
```

### 3. Dry-run the publish

```bash
bun run scripts/release/publish.ts
```

This runs:
1. `bun run lint` — must pass (exit 0).
2. `bun run scripts/build-package.ts` — rebuilds `dist/`.
3. `npm publish --dry-run` — verifies the tarball.

You'll see a summary:
```
  Tarball summary
    filename:    roycss-1.1.0.tgz
    compressed:  498.3 KB
    unpacked:    3.5 MB
    file count:  10
```

If anything looks wrong (missing files, oversized tarball, lint errors),
**fix it now** — do not proceed to step 4.

### 4. Tag and push (this triggers CI to publish)

```bash
# Create the git tag (matches the version in package.roycss.json)
git tag -a v1.1.0 -m "Release v1.1.0"

# Push the commit and the tag
git push origin main
git push origin v1.1.0
```

The tag push triggers `.github/workflows/release.yml`, which:
1. Checks out at the tagged commit.
2. Runs `bun install --frozen-lockfile`.
3. Runs `bun run lint`.
4. Runs `bun run scripts/build-package.ts`.
5. Verifies the tag matches the version in `package.roycss.json`.
6. Runs `npm publish --provenance --access public` with `NPM_TOKEN` from
   GitHub secrets. The `--provenance` flag attaches a Sigstore SLSA
   Level 3 attestation linking the tarball to the workflow run.

### 5. Verify

Within 5 minutes of the workflow completing:

```bash
# Confirm the version is live
npm view roycss

# Confirm the provenance attestation is attached
npm view roycss@1.1.0 --json | jq '.dist.attestations'

# Install in a fresh temp dir
cd $(mktemp -d)
npm install roycss
node -e "console.log(require('roycss').length)"   # should print 1569
```

### 6. Create the GitHub Release

The CI workflow does not auto-create a GitHub Release. The maintainer
creates one manually from the `v1.1.0` tag, copying the relevant section
of `CHANGELOG.md` as the release notes.

## Emergency: publish from laptop

If CI is down and a critical fix must ship:

```bash
# 1. Run the dry-run
bun run scripts/release/publish.ts

# 2. If clean, publish locally (this WILL NOT have provenance —
#    the local environment has no GitHub OIDC token)
NPM_TOKEN=xxxx-xxxx-xxxx bun run scripts/release/publish.ts --execute

# 3. Push the tag so CI can re-verify (the next CI publish of a newer
#    version will include provenance; the local one stays unattested)
git push origin v1.1.0
```

**Note:** Local publishes lack Sigstore provenance. Security scanners
will flag the version as "unverified". Use this path only for genuine
emergencies (CI down + critical security fix).

## Emergency: unpublish / deprecate

If a bad version slipped through:

```bash
# Within 72 hours of publish (and no dependents):
npm unpublish roycss@1.1.0

# After 72 hours, or has dependents:
npm deprecate roycss@1.1.0 "Security issue — use roycss@1.1.1"
```

Then immediately rotate `NPM_TOKEN` and publish a fixed version. See
`docs/adr/npm-pipeline/THREAT-MODEL.md` §5 for the full incident
response procedure.

## Design docs

| Doc | Path |
|---|---|
| Design | `docs/adr/npm-pipeline/DESIGN.md` |
| ADRs (5) | `docs/adr/npm-pipeline/ADR.md` |
| Threat model | `docs/adr/npm-pipeline/THREAT-MODEL.md` |
| Implementation plan | `docs/adr/npm-pipeline/IMPLEMENTATION-PLAN.md` |
| Review checklist (15 items) | `docs/adr/npm-pipeline/REVIEW-CHECKLIST.md` |

## Reference: the four lockstep manifests

`bump-version.ts` updates the `version` field in all four atomically:

| Manifest | Public name | Path |
|---|---|---|
| RoyCSS library | `roycss` | `/package.roycss.json` |
| CLI | `roycss-cli` | `/cli/package.json` |
| MCP server | `@roycss/mcp-server` | `/mcp-server/package.json` |
| VS Code extension | `roycss` (Marketplace) | `/vscode-extension/package.json` |

The main library is the only one this pipeline publishes to npm. The CLI
and MCP server have their own (future) publish paths; the VS Code
extension is published to the Marketplace via `vsce`.
