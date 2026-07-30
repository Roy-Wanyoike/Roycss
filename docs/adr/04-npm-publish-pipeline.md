# ADR 04 — npm Publish Pipeline

- **Status:** Accepted
- **Date:** 2026-07-30
- **Decision Maker:** Principal Engineer — RoyCSS Platform
- **Domain:** `scripts/publish/`, `.changeset/`, `package.roycss.json`
- **Supersedes:** none
- **Superseded by:** none

## 1. Context

RoyCSS v1.0.0 is code-complete (1569 effects across 20 categories, `dist/` built, `package.roycss.json` defined) and is ready to ship to the npm registry under the package name `roycss`. We need a publish pipeline that:

1. Bumps version numbers predictably and writes a human-readable changelog.
2. Runs the full pre-publish gate (lint → build → validate) before any `npm publish` call.
3. Produces **verifiable provenance** (SLSA Level 3) so consumers can confirm the tarball they install was built from a specific commit on this repo.
4. Is safe to run locally (dry-run by default) and from CI (real publish behind an `NPM_TOKEN` secret).
5. Survives npm-side supply-chain attacks (typosquatting, token theft, account takeover) without requiring us to invent our own crypto.

The three credible candidates for the versioning + release orchestration layer are:

| Tool                | Style                       | Maintenance                | npm-native? | Provenance story                       |
| ------------------- | --------------------------- | -------------------------- | ----------- | -------------------------------------- |
| **changesets**      | Manual PR → bump → publish  | Atlassian / community      | Yes         | First-class: works with npm provenance |
| **semantic-release**| Fully automated (commits)   | Open source / corporate    | Yes         | Works, but automation is the risk     |
| **release-please**  | Google-style manifest PR    | Google                     | Mostly GH   | Works, but Google-flavored            |

All three can call `npm publish --provenance` and emit a changelog. The decision is about **who pushes the button** and **how much ceremony** sits between a feature landing on `main` and a tarball hitting the registry.

## 2. Decision

**Adopt [changesets](https://github.com/changesets/changesets) (`@changesets/cli` + `@changesets/changelog-github`) as the versioning and release orchestration layer for the `roycss` npm package.**

Concretely:

- `.changeset/config.json` with `changelog: "@changesets/changelog-github"`, `access: "public"`, `baseBranch: "main"`.
- A new entry in `.changeset/` is added per PR that touches the published package (minor / patch / major bump declared up-front).
- `bun run publish:release` (local, dry-run) runs: `prepare.ts` → `changeset version` → `changeset tag` → **prints** the final `npm publish --provenance --access public` command (does **not** execute it).
- `bun run publish:ci` (CI only, with `NPM_TOKEN`) executes `npm publish --provenance --access public` for real.
- npm account must enforce 2FA on publish, and the `NPM_TOKEN` is an **automation-scoped, publish-only** token (not a personal token).
- Provenance is required (`--provenance` flag) — installs from npm will show a "Provenance" badge on the package page and `npm view roycss --json` will expose the SLSA attestation.

### 2.1 Why changesets over the alternatives

- **Manual control.** A human reviews the bump type before it ships. semantic-release will happily ship a `1.0.0 → 2.0.0` because of one `BREAKING CHANGE:` footer in a squash-merge — we want a gate.
- **Human review.** Each changeset is a markdown file in the PR diff; reviewers see exactly what will land in `CHANGELOG.md` and which semver bump will be applied. No surprise releases.
- **npm-org friendly.** changesets is the de-facto standard for npm packages shipped from GitHub (Radix, Prisma, Astro, Turborepo, Vercel SDKs, shadcn/ui). It expects an npm registry and does not try to also ship to PyPI / Maven / crates.io.
- **Provenance-native.** changesets does not fight `npm publish --provenance` — the publish step is just a shell command we own, so we can attach provenance, scoped tokens, and 2FA without forking the tool.
- **Multi-package ready.** If we later split `roycss`, `roycss-cli`, `roycss-mcp`, and `roycss-vscode` into a monorepo, changesets handles cross-package versioning without a rewrite.

## 3. Alternatives Considered

### 3.1 semantic-release

- **Pros:** zero-touch once configured; publishes on every merge to `main`; reads conventional-commits and computes the bump automatically.
- **Cons:** too automated for a single-maintainer package where a bad squash-merge message becomes a public major release; plugin ecosystem is fragile across Node versions; the "release after every commit" cadence produces noisy changelogs (15 micro-releases a week). Also, semantic-release owns the `npm publish` invocation, which makes adding `--provenance` and custom pre-publish gates a fork-level change.
- **Verdict:** Rejected — automation risk outweighs convenience at this stage.

### 3.2 release-please

- **Pros:** Google-backed; opens a "release PR" that bumps versions and regenerates `CHANGELOG.md`; merging the PR creates the tag and triggers publish. Very clean audit trail.
- **Cons:** Google flavor of conventional commits (slightly different from angular/atom); built primarily around Google's internal release cadence and assumes a GitHub Actions-only world; less npm-native (more obvious if you ship to multiple registries); weaker npm-org ecosystem story.
- **Verdict:** Rejected — strong candidate, but changesets has more mindshare in the exact npm ecosystem we are shipping into (Radix / Prisma / Astro / Turborepo).

### 3.3 Hand-rolled `npm version` + shell script

- **Pros:** zero dependencies; full control.
- **Cons:** we re-implement changelog generation, semver bump detection, tag creation, and CI orchestration — exactly the surface area where supply-chain bugs live. No 2FA / provenance integration story beyond what we write ourselves.
- **Verdict:** Rejected — not worth the maintenance burden.

## 4. Consequences

- **Positive**
  - Every release is reviewed by a human before it ships.
  - `CHANGELOG.md` is auto-generated from per-PR markdown files (no manual editing).
  - `npm publish --provenance` gives consumers a verifiable SLSA Level 3 attestation tying the tarball back to a specific commit + workflow run.
  - The pipeline is CI-agnostic: same scripts work locally (`publish:release` dry-run) and in GitHub Actions (`publish:ci` real publish).
  - Future monorepo split (`roycss-cli`, `roycss-mcp`) requires zero tooling change.
- **Negative**
  - One extra manual step per PR: `bunx changeset` to add a changeset file. Mitigated by a PR template reminder and CI check.
  - `@changesets/cli` adds ~30 dev dependencies. All pinned via `bun.lock`; no runtime impact.
  - Provenance requires GitHub Actions (OIDC) — publishing from a non-GitHub CI provider would lose the attestation.

## 5. Compliance

- This ADR satisfies the supply-chain controls referenced in `docs/threat-models/04-npm-publish-pipeline.md` (SLSA Level 3, scoped tokens, 2FA).
- Benchmarks for build / install / tarball size live in `docs/benchmarks/04-npm-publish-pipeline.md`.
- Step-by-step rollout and rollback procedure lives in `docs/plans/04-npm-publish-pipeline.md`.
- Pre-merge and pre-publish review gates live in `docs/checklists/04-npm-publish-pipeline.md`.

## 6. References

- changesets: https://github.com/changesets/changesets
- npm provenance: https://docs.npmjs.com/generating-provenance-statements
- SLSA Level 3: https://slsa.dev/spec/v1.0/levels#build-l3
- semantic-release: https://github.com/semantic-release/semantic-release
- release-please: https://github.com/googleapis/release-please
