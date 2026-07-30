# Implementation Plan 04 — npm Publish Pipeline

- **Owner:** Principal Engineer — RoyCSS Platform
- **Status:** In Progress
- **Target version:** `roycss@1.0.0`
- **Target date:** 2026-07-30

## 1. Goal

Ship `roycss@1.0.0` to the public npm registry with a CI/CD-ready, provenance-attested, changeset-driven publish pipeline that is safe to run locally (dry-run) and from GitHub Actions (real publish behind `NPM_TOKEN`).

## 2. Scope

In scope:

- `scripts/publish/{prepare,release,validate,README}.ts` — the local orchestration scripts.
- `.changeset/{config.json,README.md,initial-release.md}` — changeset configuration + initial entry.
- `.github/workflows/release.yml` — CI publish workflow (provenance-enabled).
- Root `package.json` scripts (`publish:prepare`, `publish:validate`, `publish:release`, `publish:ci`, `changeset`, `version`).
- `@changesets/cli` + `@changesets/changelog-github` as devDependencies.
- Documentation: ADR, threat model, benchmarks, plan, checklist.

Out of scope (follow-up):

- npm org creation (`roycss` org) — kept unscoped for v1.0.
- Defensive typosquat packages (`roycsss`, `roy-css`, etc.).
- OIDC trusted publishing (waiting on npm GA).
- Reproduducible builds (Bun version pinning for byte-identical tarballs).
- Splitting `roycss.css` (un-minified) out of the main tarball to fix B-4 (unpacked size > 2 MB).

## 3. Phases

### Phase 1 — Scaffolding (this PR)

1. Create directories: `docs/{adr,threat-models,benchmarks,plans,checklists}/`, `scripts/publish/`, `.changeset/`, `.github/workflows/`.
2. Write ADR-04, threat-model-04, benchmarks-04, plan-04, checklist-04.
3. Add `@changesets/cli` and `@changesets/changelog-github` to devDependencies via `bun add -d`.
4. Write `.changeset/config.json`, `.changeset/README.md`, `.changeset/initial-release.md`.
5. Write `scripts/publish/{prepare,release,validate,README}.ts`.
6. Write `.github/workflows/release.yml`.
7. Add publish scripts to root `package.json` (without removing existing scripts).
8. Add a `RoyCSS npm Package` card to `platform-ecosystem.tsx` with the publish-pipeline status description.
9. Verify the install command in `get-started.tsx` Step 1 matches `package.roycss.json` (`name: roycss`).

### Phase 2 — Local dry-run verification

1. `bun run publish:validate` → must print file list, sizes, validation result, exit 0.
2. `bun run publish:prepare` → must run lint, build, validate, exit 0.
3. `bun run publish:release` → must do everything prepare does + run `changeset version` (may fail if no git — that's OK, log it) + print the publish command, exit 0.

### Phase 3 — npm account setup (manual, outside this PR)

1. Reserve the `roycss` package name on npmjs.com (if not already owned by `roy-wanyoike`).
2. Enable 2FA on the npm account (auth-and-writes mode).
3. Create an **automation-scoped, publish-only** granular access token: package `roycss`, permission `publish`, expiry 90 days.
4. Add the token as a GitHub Actions encrypted secret named `NPM_TOKEN` on the `Roy-Wanyoike/roycss` repo.
5. Confirm `release.yml` triggers on the next push to `main`.

### Phase 4 — First publish (manual, outside this PR)

1. Merge the publish-pipeline PR to `main`.
2. Confirm `release.yml` runs green.
3. Confirm `roycss@1.0.0` appears on npmjs.com with a "Provenance" badge.
4. Run `npm view roycss` — verify `dist.attestations` is present.
5. In a fresh temp dir, run `npm install roycss && node -e "console.log(require('roycss').length)"` — verify it prints `1569`.

### Phase 5 — Post-publish hardening (future PRs)

1. B-4 mitigation: drop `dist/roycss.css` from the tarball (move to `roycss-source` companion package or docs-only).
2. Add backup npm maintainer.
3. Add `npm audit` to CI on every PR.
4. Migrate to OIDC trusted publishing once GA.
5. Pin Bun version in `release.yml` for reproducible builds.

## 4. Acceptance Criteria

- [ ] ADR-04 written and Status = Accepted.
- [ ] Threat model-04 covers all 8 threats (T-1 … T-8) and lists mitigations.
- [ ] Benchmarks-04 documents all 5 targets (B-1 … B-5) with current measurements.
- [ ] Plan-04 (this file) written.
- [ ] Checklist-04 written.
- [ ] `scripts/publish/prepare.ts` exists and exits 0 on a clean tree.
- [ ] `scripts/publish/release.ts` exists, runs dry-run, prints the publish command, exits 0.
- [ ] `scripts/publish/validate.ts` exists and prints file list + sizes, exits 0.
- [ ] `scripts/publish/README.md` exists.
- [ ] `.changeset/config.json` has `access: "public"` and the GitHub changelog.
- [ ] `.changeset/README.md` exists.
- [ ] `.changeset/initial-release.md` declares `"roycss": minor`.
- [ ] `.github/workflows/release.yml` exists with `id-token: write` permission.
- [ ] Root `package.json` has `publish:prepare`, `publish:validate`, `publish:release`, `publish:ci`, `changeset`, `version` scripts.
- [ ] `@changesets/cli` and `@changesets/changelog-github` are in `devDependencies`.
- [ ] `get-started.tsx` Step 1 install command matches `package.roycss.json` name (`roycss`).
- [ ] `platform-ecosystem.tsx` has a npm package card with the publish-pipeline status description.
- [ ] `bun run publish:validate` exits 0.
- [ ] `bun run publish:prepare` exits 0.
- [ ] `bun run publish:release` exits 0.
- [ ] `bun run lint` exits 0.
- [ ] **No actual `npm publish` was run.**

## 5. Rollback Procedure

If the publish pipeline breaks or publishes a bad version:

1. **Unpublish within 72 hours** of publish: `npm unpublish roycss@<version>` (only works if no other package depends on it AND within 72h).
2. **Deprecate** if past 72h: `npm deprecate roycss@<version> "Security issue — please use roycss@<fixed-version>"`.
3. **Yank from CDN:** unpkg.com / jsDelivr will continue serving cached versions; we cannot yank, only deprecate. The docs site must show a "DO NOT USE" banner pointing to the fixed version.
4. **Revert the publish-pipeline PR** in Git — the pipeline is additive; reverting just removes the scripts without affecting the published tarball.
5. **Rotate `NPM_TOKEN`** immediately if the bad publish was due to token compromise (not just a bad version).
6. **Postmortem** in `docs/postmortems/` (separate doc, not part of this plan).

## 6. Risks

| Risk                                                | Likelihood | Impact | Mitigation                                                  |
| --------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| `NPM_TOKEN` leaks via a CI log                       | Low        | Critical | `release.yml` only runs on `push: main`; token never echoed. |
| Bad version published (e.g. `1.0.0` instead of `0.1.0`) | Medium | High | `prepare.ts` prints the version + tarball size before publish; `release.ts` requires explicit `publish:ci` run. |
| `changeset version` fails on no-git repo             | High       | None   | `release.ts` catches and logs; non-fatal.                  |
| `npm pack --dry-run` differs between Bun and Node    | Low        | Medium | `prepare.ts` runs `npm pack` (npm CLI), not `bun pack`.    |
| Provenance fails because runner isn't a public GitHub-hosted runner | Medium | High | `release.yml` uses `ubuntu-latest` (GitHub-hosted). Documented in threat model. |

## 7. Open Questions

1. Should `publish:ci` run `bunx changeset tag` after publish? — **No.** `changeset tag` creates a git tag locally; the GitHub Actions `actions/checkout@v4` with `fetch-depth: 0` + `git push --tags` is the cleaner pattern. Out of scope for v1.0.
2. Should we publish on every merge to `main`, or only on a manually-triggered workflow? — **Every merge** (changesets will no-op if there are no pending changesets). Manual trigger is a future hardening.
3. Should the docs site link to the npm package page with a provenance badge? — **Yes**, in the npm package card (added in this PR).
