# RoyCSS npm Publication Pipeline — Production Design

- **Status:** Accepted
- **Version:** 1.0 (initial release automation)
- **Date:** 2026-07-30
- **Owner:** npm Publication Pipeline domain
- **Related:** `ADR.md`, `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`, `REVIEW-CHECKLIST.md`
- **Scope:** Full release lifecycle for the `roycss` npm package (and its
  companion packages: `roycss-cli`, `@roycss/mcp-server`, VS Code extension).
  This design supersedes the changeset-based flow described in
  `docs/adr/04-npm-publish-pipeline.md` for the v1.0 release train. The
  existing `scripts/publish/` tooling is preserved for archaeological
  reference but the active pipeline lives in `scripts/release/`.

---

## 1. Purpose

Ship every `roycss` release with four guarantees:

1. **Reproducibility** — the same git tag always produces the same tarball
   bytes (modulo gzip timestamp), with the same set of included files.
2. **Provenance** — every published tarball carries a Sigstore-based SLSA
   Level 3 attestation linking it to the specific commit + workflow run that
   built it. Consumers can verify `npm view roycss@<version> --json` and see
   `dist.attestations`.
3. **Auditability** — every release is recorded in `CHANGELOG.md` (Keep a
   Changelog format) with a one-line entry per merged PR. The changelog is
   generated from structured per-change markdown files committed alongside
   the feature work, not hand-edited at release time.
4. **Safety** — no release leaves a developer laptop without first passing
   `bun run lint`, `bun run scripts/build-package.ts`, and
   `npm publish --dry-run`. The `--execute` flag is the only path to the
   real registry, and CI is the only place it is permitted.

---

## 2. Package inventory

The pipeline publishes four packages in lockstep — they share a version
number so consumers can mix-and-match without version-skew surprises:

| Package | Manifest path | Public name | Notes |
|---|---|---|---|
| RoyCSS library | `/package.roycss.json` | `roycss` | The CSS effects library (1,569 effects). Main npm target. |
| CLI | `/cli/package.json` | `roycss-cli` | Standalone CLI. Published separately but versioned in lockstep. |
| MCP server | `/mcp-server/package.json` | `@roycss/mcp-server` | Scoped under `@roycss`. |
| VS Code extension | `/vscode-extension/package.json` | `roycss` (Marketplace) | VSIX, not an npm package — version is bumped in lockstep but published via the Marketplace flow, not this pipeline. |

`bump-version.ts` updates the `version` field in all four manifests in one
shot. The actual `npm publish` step in this pipeline only publishes the
library (`roycss`) — the other three have their own publish paths.

---

## 3. Versioning strategy

Strict [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html):

- **MAJOR** (`--major`): breaking changes — removed effects, renamed CSS
  classes, removed export paths, changed default behavior. Bumps `1.x.y →
  2.0.0`.
- **MINOR** (`--minor`): new effects, new categories, new optional exports,
  backward-compatible bug fixes that change observable behavior. Bumps
  `1.0.x → 1.1.0`.
- **PATCH** (`--patch`): bug fixes, documentation, build-only changes, no new
  effects, no behavior change. Bumps `1.0.0 → 1.0.1`.

`bump-version.ts` accepts an exact `--version x.y.z` for emergency
pinning (e.g. re-publishing a pulled version with a `-patch.1` suffix —
though we generally avoid pre-release tags for `roycss`).

### 3.1 Pre-release tags

RoyCSS does **not** ship `alpha` / `beta` / `rc` tags to the `latest`
dist-tag. Pre-release versions (if ever used) get the `next` dist-tag and a
hyphenated version: `1.2.0-rc.1`. The CI workflow only publishes when a tag
matches `v\d+\.\d+\.\d+` (no hyphens), so pre-releases must be published
manually with `npm publish --tag next`.

### 3.2 Lockstep rule

All four package.json files share the same `version` string at every
release. `bump-version.ts` enforces this — it refuses to write a partial
update (if one file is missing, it errors out before modifying any).

---

## 4. Changelog format

[Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) — six fixed
sections per release, in this order:

1. **Added** — new effects, new categories, new exports, new features.
2. **Changed** — changes to existing functionality (renames, behavior
   tweaks that don't break).
3. **Deprecated** — features that still work but will be removed in a
   future major.
4. **Removed** — features removed in this version (always a major bump).
5. **Fixed** — bug fixes.
6. **Security** — vulnerability fixes (also gets a GitHub Security Advisory).

### 4.1 Entry sources

`generate-changelog.ts` reads from two sources:

1. **Manual entries** (preferred): one markdown file per change, committed
   to `scripts/release/changelog-entries/` by the author of the change.
   Each file has YAML frontmatter:

   ```markdown
   ---
   type: added
   pr: 142
   ---

   Added 12 new glassmorphism effects to the `glass-ui` category. New ids:
   `roycss-glass-frost`, `roycss-glass-aurora`, …
   ```

   `type` must be one of: `added`, `changed`, `deprecated`, `removed`,
   `fixed`, `security`. `pr` is the PR number (used to linkify the entry).

2. **Git log fallback** (when no manual entries exist for the version):
   `git log v<previous>..HEAD --oneline --no-merges` is parsed; each
   commit with a `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` prefix
   becomes a one-line entry under the matching section (Conventional
   Commits mapping). This is noisier than manual entries and used only as
   a safety net.

### 4.2 Assembly

`generate-changelog.ts` produces a full `CHANGELOG.md` (not a diff). The
algorithm:

1. Read every `*.md` file in `changelog-entries/` (excluding `.gitkeep`).
2. Parse frontmatter; group by `type`.
3. Emit a `## [Unreleased]` section if there are pending entries (the
   release step renames `Unreleased` to the new version + date when
   `--execute` runs).
4. Read the existing `CHANGELOG.md`, preserve all previously-released
   sections verbatim, and prepend the new `Unreleased` section.
5. Move consumed entry files to `changelog-entries/consumed/` (timestamped)
   so they don't get re-emitted on the next release.

### 4.3 Linkification

The `[Unreleased]`, `[1.0.0]`, `[1.1.0]` etc. headers at the bottom of the
changelog link to GitHub compare URLs:

```markdown
[Unreleased]: https://github.com/Roy-Wanyoike/roycss/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Roy-Wanyoike/roycss/releases/tag/v1.0.0
```

`generate-changelog.ts` maintains this footer section automatically.

---

## 5. Publish targets

| Target | When | Dist-tag | Access |
|---|---|---|---|
| npm registry (`registry.npmjs.org`) | Every `v*` tag push | `latest` | public |
| GitHub Release | Every `v*` tag push | n/a | public (auto-generated from CHANGELOG.md) |

The pipeline does not publish to GitHub Packages, Verdaccio, or any other
registry. The `roycss` package name is unscoped (see ADR-5) — that means
the publish target is always `https://registry.npmjs.org/roycss`.

### 5.1 Dist-tag strategy

- `latest` — the most recent stable release. This is what
  `npm install roycss` resolves to. CI publishes to `latest` by default.
- `next` — pre-release versions (`1.2.0-rc.1`). Published manually with
  `npm publish --tag next`. Never promoted to `latest` automatically —
  requires an explicit `npm dist-tag add roycss@1.2.0 latest` after a
  bake-in period.
- `legacy` — kept for the rare case where a downstream consumer is pinned
  to a very old major (e.g. `roycss@0.x`) and we ship a security
  backport. Not used in normal operation.

See `ADR.md` ADR-3 for the dist-tag decision rationale.

---

## 6. Provenance

Every CI publish uses npm's built-in [Sigstore](https://sigstore.dev/)
provenance attestation:

```bash
npm publish --provenance --access public
```

This requires:

1. **GitHub Actions OIDC token** — the workflow declares
   `permissions: { id-token: write }`. GitHub mints a short-lived OIDC
   token that npm exchanges for a Sigstore signing certificate.
2. **Public package** — provenance is only available for public packages.
   `roycss` is `access: public` (set in `publishConfig`).
3. **GitHub repository link** — `package.roycss.json` has
   `repository: { url: "git+https://github.com/Roy-Wanyoike/roycss.git" }`,
   which npm uses to anchor the attestation to the source commit.

Consumers verify with:

```bash
npm audit signatures
npm view roycss@<version> --json | jq '.dist.attestations'
```

Or via [SLSA verification tooling](https://github.com/slsa-framework/slsa-verifier).
The attestation is a DSSE envelope containing the in-toto statement that
links the tarball SHA-256 to the workflow run, the commit SHA, the
triggering actor, and the repository URL.

### 6.1 Why not full SLSA Level 3?

npm provenance gives us **SLSA Build Level 3** for the build platform
(GitHub Actions). It does **not** give us SLSA Level 3 for the source —
that would require a separate source provenance pipeline (signed commits,
protected branches). This pipeline relies on GitHub branch protection +
required reviews to provide source integrity, which is SLSA Source Level 2
in practice. See `THREAT-MODEL.md` §3 for the gap analysis.

---

## 7. CI workflow

`.github/workflows/release.yml` triggers on tag push matching `v*`. The
flow is:

```
push tag v1.1.0
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Release job (ubuntu-latest)                                │
│                                                             │
│  1. actions/checkout@v4 (fetch-depth: 0 for full history)  │
│  2. oven-sh/setup-bun@v2                                    │
│  3. actions/setup-node@v4 (node 20, registry-url: npmjs)    │
│  4. bun install --frozen-lockfile                           │
│  5. bun run lint                                             │
│  6. bun run scripts/build-package.ts                        │
│  7. npm publish --provenance --access public                │
│     (uses NPM_TOKEN from secrets — automation-scoped)       │
│  8. echo summary to $GITHUB_STEP_SUMMARY                    │
└─────────────────────────────────────────────────────────────┘
```

**Concurrency:** `release-${{ github.ref }}` with `cancel-in-progress: false`
— never cancel a publish mid-flight.

**Permissions:** `contents: write` (for tag), `id-token: write` (for
provenance). No other permissions.

**Secrets:** `NPM_TOKEN` — a granular, automation-scoped,
publish-only token with 90-day expiry. Stored in GitHub Actions
secrets. Not exposed to PR builds (the workflow only triggers on tag
push, never on PR).

### 7.1 Why tag-triggered (not push-to-main)

The previous workflow (`scripts/publish/release.ts`) triggered on push to
`main` and ran `changeset version` in CI. This worked but had two
problems:

1. **Double-commit smell** — CI commits the version bump back to `main`,
   producing a `chore(release): ...` commit that itself triggers CI
   (mitigated with `[skip ci]`, but fragile).
2. **No tag verification** — the workflow can't verify the tag matches
   the bumped version, because the bump happens inside the workflow.

Tag-triggered flow: a human runs `bun run scripts/release/publish.ts
--execute` locally (or the maintainer manually creates a tag). The tag
push triggers CI, which builds and publishes. The tag is the source of
truth — CI verifies the tag matches the version in `package.roycss.json`
and fails fast if they diverge.

---

## 8. Local release flow

A maintainer cutting a release runs:

```bash
# 1. Make sure main is up-to-date and clean
git checkout main && git pull

# 2. Run the dry-run (lint + build + npm publish --dry-run, no actual publish)
bun run scripts/release/publish.ts

# 3. Inspect the tarball output (size, file count, file list)
#    If anything looks wrong, fix it and re-run.

# 4. Cut the real release (this also creates the git tag)
bun run scripts/release/publish.ts --execute

# 5. Push the tag (this triggers CI to publish to npm)
git push origin v1.1.0
```

`publish.ts --execute` is **idempotent in dry-run mode** but not in execute
mode — once `npm publish` runs, the version is on the registry. There is
no `--undo` flag (see ADR-4 for the deprecation/unpublish policy).

---

## 9. Failure modes

| Failure | Detection | Recovery |
|---|---|---|
| Lint fails | `publish.ts` step 1 exits non-zero | Fix lint errors, re-run |
| Build fails | `publish.ts` step 2 exits non-zero | Fix build, re-run |
| Tarball exceeds 500 KB | `npm publish --dry-run` output parsed; tarball size warning | Drop largest file from `files` array (typically the unminified `roycss.css`); see `docs/benchmarks/04-npm-publish-pipeline.md` |
| `npm publish` 409 (version already exists) | CI step 7 fails | Run `bump-version.ts --patch`, re-tag, re-push |
| `npm publish` 401 (token expired) | CI step 7 fails | Rotate `NPM_TOKEN` in npm → Settings → Access Tokens, update GitHub secret, re-run workflow |
| Provenance signing fails (Sigstore outage) | CI step 7 fails with `provenance: failed to sign` | Wait for Sigstore to recover, re-run workflow. Do **not** publish without provenance — see ADR-2. |
| Git tag push rejected (protected tag) | `git push origin v1.1.0` fails | Force-push only with two maintainer sign-off (recorded in incident doc) |

---

## 10. Observability

- **$GITHUB_STEP_SUMMARY** — every release writes a summary with the tag,
  commit SHA, tarball size, file count, and npm URL.
- **`npm view roycss`** — post-publish verification: maintainer runs this
  within 5 minutes of the workflow completing and confirms the version +
  provenance attestation are visible.
- **`CHANGELOG.md`** — every release appends a dated section; this is the
  human-readable audit log.
- **GitHub Releases** — created from the tag + changelog; this is the
  public-facing release notes surface.

---

## 11. Out of scope

- **Monorepo multi-package publishing** — RoyCSS is not a monorepo (the
  four packages share a directory tree but are independently versioned
  in lockstep). Lerna / Turborepo / pnpm workspaces are not introduced.
- **Automated dependency bumps** — Dependabot is configured separately
  (in `.github/dependabot.yml`, not part of this pipeline).
- **Rollback automation** — there is no `publish.ts --rollback`. Rollback
  is `npm deprecate roycss@<bad>` + publish a new patch (see ADR-4).
- **VS Code Marketplace publish** — the VS Code extension uses
  `vsce publish` from a separate workflow (`vscode-extension/build.sh`
  + a future `.github/workflows/vscode-release.yml`); it is not in this
  pipeline's scope beyond the version-bump lockstep.
