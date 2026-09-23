# RoyCSS Publish Pipeline

CI/CD-ready pipeline for publishing the `roycss` npm package with changeset-driven versioning, SLSA Level 3 provenance, automated changelog generation, and a safe dry-run mode.

The **root `package.json` IS the published manifest** (there is no separate
`package.roycss.json` — that indirection was removed). Publishing is
**tag-triggered and test-gated**: pushing a `v*` git tag runs
`.github/workflows/release.yml`, which lints, builds, runs the unit tests,
verifies the tag matches `package.json`, then runs
`npm publish --provenance --access public`.

## Quick reference

| Command                                | What it does                                                                  | Publishes? |
| -------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `bun run publish:validate`             | Validate file list, sizes, tarball contents.                                  | ❌ No      |
| `bun run publish:prepare`              | Lint → build → validate dist/ → validate root `package.json` → tarball gate.    | ❌ No      |
| `bun run publish:release`              | `prepare` → `changeset version` → `changeset tag` → **prints** `npm publish`. | ❌ No (dry run) |
| `bun run publish:ci`                   | Actually run `npm publish --provenance --access public` with `$NPM_TOKEN`.    | ✅ Yes (CI only) |
| `bun run changeset`                    | Interactively add a new changeset file (`.changeset/*.md`).                   | ❌ No      |
| `bun run version`                      | Apply pending changesets (bump + changelog).                                  | ❌ No      |

## Files in this directory

```
scripts/publish/
├── prepare.ts     # Pre-publish gate: lint, build, validate, tarball size check
├── release.ts     # Orchestration: prepare → changeset version → changeset tag → print publish command
├── validate.ts    # Standalone validator: file list, sizes, tarball contents
└── README.md      # This file
```

## How to publish (the safe way)

### 1. Add a changeset on your feature branch

```bash
bun run changeset
```

This launches an interactive prompt:

- Select the package (`roycss`).
- Choose bump type (`minor` for new effects, `patch` for bug fixes, `major` for breaking changes).
- Write a short summary — this becomes the `CHANGELOG.md` entry.

The output is a new file under `.changeset/` like `.changeset/quick-lions-grin.md`:

```markdown
---
"roycss": minor
---

Added 12 new glassmorphism effects to the glass-ui category.
```

Commit the changeset file alongside your feature code.

### 2. Merge the PR to `main`

The PR review should verify:

- [ ] The changeset's bump type matches the actual change (`patch` vs `minor` vs `major`).
- [ ] The changelog entry reads well — it will be public.
- [ ] `bun run publish:prepare` exits 0 locally.

### 3. Run the dry-run release (locally)

```bash
bun run publish:release
```

This will:

1. Run `prepare.ts` (lint + build + validate + tarball size gate).
2. Run `bunx changeset version` — applies pending changesets, bumps the root `package.json` version, regenerates `CHANGELOG.md`.
3. Run `bunx changeset tag` — creates the version git tag.
4. **Print** the final publish command (`npm publish --provenance --access public`) — does NOT execute it.

If anything fails, fix it and re-run. The dry run is idempotent.

### 4. Commit the version bump + push the tag

```bash
git add package.json CHANGELOG.md .changeset/
git commit -m "chore(release): roycss@<version>"
git push origin main --follow-tags   # or: git push origin main --tags
```

### 5. Let CI publish

Pushing the `v<version>` tag triggers `.github/workflows/release.yml`:

1. `actions/checkout@v7` (with `fetch-depth: 0`).
2. `oven-sh/setup-bun@v2` + `actions/setup-node@v7`.
3. `bun install --frozen-lockfile`.
4. `bun run lint`.
5. `bun run scripts/build-package.ts`.
6. `bunx vitest run tests/unit` — **unit tests gate the publish**.
7. Verify the tag matches the version in `package.json`.
8. `npm publish --provenance --access public` with `NPM_TOKEN` from GitHub secrets.

The `--provenance` flag tells npm to attach an SLSA Level 3 attestation linking the tarball to the specific commit + workflow run. Consumers see a "Provenance" badge on the npm package page.

### 6. Verify

```bash
npm view roycss
npm view roycss@<version> --json | jq '.dist.attestations'
```

In a fresh temp dir:

```bash
npm install roycss
node -e "console.log(require('roycss').length)"  # should print 1983
```

## How to publish manually (emergency only)

If CI is down and you need to publish from your laptop:

```bash
# 1. Run the full prepare gate locally
bun run publish:prepare

# 2. Run changeset version + tag locally
bun run version
bunx changeset tag

# 3. Commit the bump
git add package.json CHANGELOG.md .changeset/
git commit -m "chore(release): roycss@<version>"
git push origin main --tags

# 4. Publish with a scoped NPM_TOKEN (publish-only, automation-scoped)
NPM_TOKEN=xxxx-xxxx-xxxx npm publish --provenance --access public
```

**Note:** Provenance requires GitHub Actions OIDC. A publish from your laptop will succeed but will NOT have a provenance attestation. Use CI for normal publishes.

## Required npm account setup (one-time)

1. **Reserve the `roycss` name** on npmjs.com (if not already owned).
2. **Enable 2FA** on the npm account → Account Settings → Two-Factor Authentication → "auth-and-writes" (requires 2FA on login AND publish).
3. **Create an automation-scoped granular access token**: Account Settings → Access Tokens → "Granular Access Token" → package `roycss` → permission `Read and write` → expiry 90 days. **Do not** create a "Classic Automation Token" — granular tokens are scoped and revocable.
4. **Add the token as a GitHub Actions secret** on `Roy-Wanyoike/Roycss` → Settings → Secrets and variables → Actions → New repository secret → name `NPM_TOKEN` → paste token.
5. **Add a backup maintainer** on npm (in case the primary account is lost).

## Benchmark targets

See `docs/benchmarks/04-npm-publish-pipeline.md` for the full table and the
re-baseline rationale. Quick reference (measured at v2.0.0 —
`bun run publish:validate` dry-run numbers):

| Metric                      | Target      | Current (v2.0.0) |
| --------------------------- | ----------- | ---------------- |
| Build time                  | < 30 s      | ~6 s ✅           |
| Tarball size (compressed)   | ≤ 1.2 MB    | ~1,060 KB ✅      |
| Install time                | < 5 s       | ~1.5 s ✅         |
| Unpacked size               | ≤ 8 MB      | ~7.5 MB ✅        |
| Number of files in tarball  | ≤ 24        | 20 ✅             |
| Forbidden artifacts shipped | 0           | 0 ✅              |

The unpacked size is dominated by the deliberate dual-format exports
(both the full and the minified stylesheet plus the class-index and
motion-library JSON indexes) — see
`docs/benchmarks/04-npm-publish-pipeline.md` for the re-baseline rationale.
Two internal artifacts are excluded from the tarball via `files` negations
in `package.json` — `dist/pro-components.json` (unpublished backend catalog)
and `dist/important-audit.json` (gitignored audit snapshot that embeds
absolute local paths) — and both are enforced by the forbidden-artifacts
gate in `validate.ts`.

## Security

See `docs/threat-models/04-npm-publish-pipeline.md` for the full threat model. Quick reference:

- **`NPM_TOKEN`** is publish-only, scoped to `roycss`, expires in 90 days, stored only in GitHub Actions secrets.
- **2FA** is enforced on the npm account (auth-and-writes).
- **Provenance** (SLSA Level 3) is attached to every publish — consumers can verify the tarball matches a commit on `main`.
- **`release.yml`** only runs on `v*` tag pushes — never on PRs or plain branch pushes. Tag builds cannot access the token.
- **`files` array** in `package.json` is explicit — `.env`, `.npmrc`, `.git/`, `node_modules/`, `prisma/`, `src/`, `next.config.ts` are physically excluded from the tarball (plus the `!dist/pro-components.json` negation).
- **`prepare.ts`** runs after `bun run build` and before any publish — catches runner-side tampering that would change file sizes.

## Emergency: unpublish / deprecate

If a bad version slipped through:

```bash
# Within 72 hours of publish (and no dependents):
npm unpublish roycss@<version>

# Past 72 hours, or has dependents:
npm deprecate roycss@<version> "Security issue — please use roycss@<safe-version>"
```

Then immediately rotate `NPM_TOKEN` and publish a fixed version. See `docs/checklists/04-npm-publish-pipeline.md` §6 for the full emergency procedure.

## References

- ADR: `docs/adr/04-npm-publish-pipeline.md`
- Threat model: `docs/threat-models/04-npm-publish-pipeline.md`
- Benchmarks: `docs/benchmarks/04-npm-publish-pipeline.md`
- Implementation plan: `docs/plans/04-npm-publish-pipeline.md`
- Review checklist: `docs/checklists/04-npm-publish-pipeline.md`
- changesets docs: https://github.com/changesets/changesets
- npm provenance docs: https://docs.npmjs.com/generating-provenance-statements
