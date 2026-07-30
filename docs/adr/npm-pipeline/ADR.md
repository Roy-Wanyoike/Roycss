# RoyCSS npm Publication Pipeline — Architecture Decision Records

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** npm Publication Pipeline domain
- **Scope:** v1 release automation. Supersedes the changeset-based
  approach documented in `docs/adr/04-npm-publish-pipeline.md` for the
  active release train. The changeset tooling is preserved under
  `scripts/publish/` for reference but is no longer the active path.

---

## ADR-1 — Manual version bumping vs changesets

**Status:** Accepted
**Date:** 2026-07-30

### Context

RoyCSS shipped with a changeset-based release flow
(`scripts/publish/release.ts` + `bunx changeset version`). Changesets are
excellent for monorepos with many packages where each PR author picks
the bump level interactively. They are heavyweight for RoyCSS because:

1. RoyCSS is **not** a monorepo — it has four package.json files but they
   all version-lockstep. A changeset per package per PR is four files
   per PR; lockstep means three of them are always "no bump".
2. The team is small (one primary maintainer). The interactive changeset
   prompt adds friction without adding coordination value.
3. The previous flow committed the version bump back to `main` from CI,
   producing a `chore(release): ...` commit that itself triggered CI
   (mitigated with `[skip ci]`, but fragile).

### Decision

Use a **manual version bump script** (`scripts/release/bump-version.ts`)
that takes `--major` / `--minor` / `--patch` / `--version x.y.z`. The
maintainer runs it locally, reviews the diff, and commits. CI never
bumps versions — it only publishes what the maintainer tagged.

### Alternatives considered

- **Changesets (status quo).** Rejected for RoyCSS because the per-package
  changeset file overhead exceeds the coordination benefit at our scale.
  Re-evaluate if the package count grows past 6 or if multiple maintainers
  start landing PRs concurrently.
- **Semantic-release.** Rejected — full auto-versioning from commit
  messages requires Conventional Commits enforcement (lint-commit-messages
  bot, green CI on every commit message), which is a bigger cultural
  change than the team wants to absorb right now. semantic-release also
  commits the version bump from CI, same smell as changesets.
- **Release-please.** Rejected for the same reason — release-please
  generates a "release PR" that must be merged, adding a merge step per
  release.

### Consequences

- The maintainer is responsible for picking the correct bump level. The
  review checklist (`REVIEW-CHECKLIST.md` §3) includes a "did the bump
  level match the actual change?" item.
- `bump-version.ts` is the single source of truth for version updates.
  Any other script that needs the version reads it from
  `package.roycss.json` rather than hardcoding.
- The git tag (`v1.1.0`) is created by `publish.ts --execute`, not by a
  separate `changeset tag` step.

---

## ADR-2 — npm provenance: yes

**Status:** Accepted
**Date:** 2026-07-30

### Context

npm's `--provenance` flag attaches a Sigstore-signed SLSA Build Level 3
attestation to every published tarball. Consumers (and security scanners
like Socket, Snyk, GitHub Advisory) can verify the tarball was built from
a specific GitHub Actions workflow run on a specific commit.

Costs:
- Requires GitHub Actions OIDC (`id-token: write` permission).
- Requires a public package (provenance is unavailable for private
  packages).
- Adds ~2 seconds to publish time (Sigstore signing round-trip).
- Cannot be done from a developer laptop (Sigstore needs the GitHub OIDC
  token). Local publishes have no attestation.

Benefits:
- Supply-chain attack mitigation: a stolen `NPM_TOKEN` is not enough to
  publish a malicious `roycss@1.2.0` — the attacker would also need to
  push to the `Roy-Wanyoike/roycss` repo on `main` and trigger the
  workflow.
- Consumer trust: the npm package page shows a "Provenance" badge.
- Free — no extra cost beyond the GitHub Actions OIDC plumbing.

### Decision

**Enable provenance on every publish.** `publishConfig.provenance: true`
in `package.roycss.json`, and `--provenance` on the CLI in CI. Local
publishes (`publish.ts --execute` from a laptop) will succeed but will
not have a provenance attestation — the `README.md` documents that CI
is the only path that produces attestations, and emergency local
publishes are explicitly called out as "unattested" in the post-publish
verification step.

### Alternatives considered

- **Provenance off, rely on 2FA + scoped token.** Rejected — 2FA + scoped
  tokens mitigate account compromise but not token theft. A leaked
  `NPM_TOKEN` (e.g. from a misconfigured CI log) is enough to publish
  without provenance. Provenance closes that gap.
- **Provenance off, sign tarballs with a maintainer-held GPG key.**
  Rejected — GPG signing is operationally fragile (key rotation, key
  storage, multiple maintainers) and consumers rarely verify GPG
  signatures anyway. Sigstore's keyless model is strictly better.
- **Provenance on, but allow local publishes to skip it.** Rejected —
  the `--execute` flag works locally but the resulting publish has no
  attestation. The README explicitly documents that local publishes are
  "unattested" and should only be used in emergencies (e.g. CI is down
  and a critical security fix must ship).

### Consequences

- Every publish must go through GitHub Actions. The maintainer can run
  `publish.ts --execute` locally for an emergency publish, but the
  resulting npm version will lack a provenance attestation and will be
  flagged as "unverified" in security scanners.
- If Sigstore has an outage, CI fails. We do not have a fallback —
  waiting for Sigstore to recover is the correct response. A 24-hour
  publish delay is preferable to an unattested publish.
- `package.roycss.json` includes
  `"publishConfig": { "access": "public", "provenance": true }`. This
  makes the `--provenance` flag the default for `npm publish` invocations
  that respect `publishConfig` (npm 9+).

---

## ADR-3 — Dist-tag strategy: `latest` + `next`, no `beta`

**Status:** Accepted
**Date:** 2026-07-30

### Context

`npm dist-tag` controls which version `npm install roycss` resolves to
(the `latest` tag) and lets us publish pre-releases that don't pollute
the default install. RoyCSS needs:

1. A stable `latest` tag for normal releases.
2. A `next` tag for pre-release versions (rarely used — RoyCSS doesn't
   ship RCs as a rule, but we want the capability for major-version
   bumps).
3. Optionally a `legacy` tag for backport patches to old majors.

### Decision

- **`latest`** — every stable release. Set automatically by
  `npm publish` when no `--tag` is given.
- **`next`** — pre-releases (`1.2.0-rc.1`). Published manually with
  `npm publish --tag next`. Never auto-promoted.
- **`legacy`** — reserved for the rare case of backporting a security
  fix to an old major. Not used in normal operation.

The CI workflow only publishes when the tag matches `v\d+\.\d+\.\d+`
(no hyphens) — this guarantees that pre-releases (which would have
hyphens in the version) cannot accidentally trigger the CI publish.
Pre-releases must be published manually.

### Alternatives considered

- **Only `latest`.** Rejected — we lose the ability to ship a
  pre-release for early feedback on a major bump. The cost of having
  `next` available is zero (it's just a tag), so we keep it.
- **`beta` and `alpha` tags.** Rejected — three pre-release tags is
  overhead. RoyCSS uses `next` for everything pre-release; the version
  string itself (`1.2.0-alpha.1` vs `1.2.0-rc.1`) carries the
  semantic distinction.
- **Auto-promote `next` → `latest` after 7 days.** Rejected — automatic
  promotion is surprising. The maintainer runs `npm dist-tag add
  roycss@1.2.0 latest` explicitly after a bake-in period.

### Consequences

- The CI workflow's `if:` clause checks for `v[0-9]+\.[0-9]+\.[0-9]+$`
  to exclude pre-release tags. This is enforced via
  `github.ref_type == 'tag' && startsWith(github.ref, 'refs/tags/v')`
  plus a regex check in the publish step.
- Pre-release publishes require a manual `npm publish --tag next` from
  a maintainer laptop. The maintainer must have 2FA on the npm account.
- The `CHANGELOG.md` includes pre-release sections (e.g.
  `## [1.2.0-rc.1] — 2026-08-15`) but they are marked as pre-release
  with a note in the section header.

---

## ADR-4 — Deprecation policy: 72-hour unpublish window, then deprecate

**Status:** Accepted
**Date:** 2026-07-30

### Context

npm's [unpublish policy](https://docs.npmjs.com/policies/unpublish) allows
unpublishing a version within 72 hours of publish, **and only if no other
package depends on it**. After 72 hours, the version is permanent on the
registry — the only remediation is `npm deprecate` + publishing a fixed
version.

### Decision

- **Within 72 hours of a bad publish:** `npm unpublish roycss@<version>`,
  then bump a patch and re-publish. The window is short — act fast.
- **After 72 hours, or if the version has dependents:** `npm deprecate
  roycss@<version> "Security issue — upgrade to roycss@<safe-version>"`
  and publish a fixed version immediately. The deprecated version stays
  on the registry forever (npm policy) but `npm install` will warn.
- **For a malicious publish (account compromise):** `npm unpublish` every
  version published in the compromise window, rotate `NPM_TOKEN`,
  rotate the npm account password, force-logout all sessions, and
  publish a clean version. Document in `SECURITY.md` post-mortem.

The CI workflow does **not** automatically unpublish or deprecate. Both
are manual operations requiring maintainer judgment.

### Alternatives considered

- **Never unpublish, always deprecate.** Rejected — for a fresh
  publish with no dependents, unpublish is cleaner. The 72-hour window
  is generous enough that we'll usually catch a bad publish in time.
- **Auto-deprecate versions older than 2 majors.** Rejected — auto-
  deprecation is surprising for downstream consumers. We deprecate
  only when there's a specific reason (security, broken behavior).
- **Add a `publish.ts --rollback` flag.** Rejected — rollback is
  irreversible (the bad version is still on the registry, just
  deprecated) and the manual command is short enough that wrapping it
  in a script adds complexity without value.

### Consequences

- The maintainer must monitor the first 72 hours after every publish.
  Issues reported in that window get an unpublish; issues reported
  later get a deprecate + fix.
- `npm deprecate` requires the same `NPM_TOKEN` as publish. The token
  must have `read and write` permission (not just publish) — granular
  tokens on npm include deprecate in write scope.
- The `CHANGELOG.md` notes deprecated versions inline (e.g.
  `> ⚠️ This version is deprecated. Use 1.0.2 instead.`).

---

## ADR-5 — Scoped vs unscoped package name: unscoped (`roycss`)

**Status:** Accepted
**Date:** 2026-07-30

### Context

npm package names can be scoped (`@roycss/library`) or unscoped
(`roycss`). Scopes are free for public packages and provide a namespace
guarantee — no one else can publish under `@roycss/*` without being a
member of the `roycss` org on npm.

### Decision

The main CSS library is published as **`roycss`** (unscoped). The MCP
server is published as **`@roycss/mcp-server`** (scoped) — it's a
secondary package and the scope makes the org ownership obvious. The CLI
is **`roycss-cli`** (unscoped) — it's a separate install path for users
who want only the CLI.

### Rationale

- The main library's value proposition is "drop-in CSS effects" — the
  package name should be short, memorable, and import-clean:
  `import { effects } from "roycss"`. The scoped form
  `import { effects } from "@roycss/library"` is verbose and looks
  "official-ish" in a way that hurts adoption.
- `roycss` is a unique-enough name (no conflicts at time of writing)
  that the scope's anti-typosquatting benefit is marginal. We mitigate
  typosquatting through documentation ("always install `roycss`, not
  `roycss-css` / `roycss-effects` / etc.") and through the
  `THREAT-MODEL.md` §4 monitoring plan.
- The MCP server is scoped because (a) it's a secondary surface, (b) the
  `@modelcontextprotocol/sdk` ecosystem uses scopes heavily, and (c)
  the scope makes it clear this is an official RoyCSS org package.

### Alternatives considered

- **Everything scoped under `@roycss/*`.** Rejected — the main library
  loses the clean `roycss` name. Adoption friction.
- **Everything unscoped.** Rejected — we lose the namespace guarantee
  for secondary packages. Someone could squat `roycss-mcp-server` and
  ship a malicious package.
- **Buy the `@roycss` org on npm and publish `roycss` as
  `@roycss/roycss`.** Rejected — same adoption friction as the scoped
  main library, and `roycss` (unscoped) was already published at v1.0.0
  before this pipeline existed.

### Consequences

- The npm org `roycss` must be reserved (one-time, free). The
  maintainer is the sole owner; a backup maintainer is added once
  identified.
- Typosquatting risk for `roycss` (unscoped) is mitigated by
  documentation + the monitoring plan in `THREAT-MODEL.md` §4.
  Consumers are told to install `roycss` only from the official
  README link.
- The `repository.url` in `package.roycss.json` points to
  `git+https://github.com/Roy-Wanyoike/roycss.git` — npm uses this to
  anchor the provenance attestation. The maintainer must keep this URL
  in sync with the actual GitHub repo URL.
