# Threat Model 04 — npm Publish Pipeline

- **System:** RoyCSS npm publish pipeline (`scripts/publish/`, `.changeset/`, GitHub Actions `release.yml`, npm registry under package name `roycss`)
- **Owner:** Principal Engineer — RoyCSS Platform
- **Scope:** All paths by which a tarball travels from a commit on `main` to a `npm install roycss` user.
- **Method:** STRIDE / LINDD + npm-specific supply-chain overlay
- **Last reviewed:** 2026-07-30

## 1. Architecture Overview

```
  ┌────────────┐  PR + changeset    ┌──────────────┐  merge       ┌─────────────────┐
  │ Contributor│ ─────────────────▶ │ Reviewer (PR)│ ───────────▶ │   main branch   │
  └────────────┘                    └──────────────┘              └─────────────────┘
                                                                            │ push
                                                                            ▼
                                                          ┌──────────────────────────────┐
                                                          │  GitHub Actions: release.yml │
                                                          │  checkout → bun install →    │
                                                          │  lint → build → publish:ci   │
                                                          └──────────────────────────────┘
                                                                            │ npm publish --provenance
                                                                            ▼
                                                          ┌──────────────────────────────┐
                                                          │  npm registry (roycss)       │
                                                          │  + SLSA Level 3 attestation  │
                                                          └──────────────────────────────┘
                                                                            │ npm install roycss
                                                                            ▼
                                                          ┌──────────────────────────────┐
                                                          │  End user (CI / laptop)      │
                                                          └──────────────────────────────┘
```

Trust boundaries (TB):

- **TB-1:** Contributor → PR review (anyone can open a PR).
- **TB-2:** `main` branch → GitHub Actions runner (the runner is trusted only if `main` is).
- **TB-3:** GitHub Actions OIDC → npm registry (provenance attestation is signed by GitHub's OIDC provider and verified by npm).
- **TB-4:** npm registry → end user (npm is a public mirror; anyone can fetch).

## 2. Assets

| Asset                       | Where it lives                          | Why it matters                                              |
| --------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `package.roycss.json`       | repo root                               | Defines the published manifest. Tampering = malicious code. |
| `dist/` artifacts           | `dist/`                                 | The actual bytes installed by users.                        |
| `NPM_TOKEN`                 | GitHub Actions secret                   | Publishes to npm. Theft = attacker can ship malware as `roycss`. |
| npm account `roy-wanyoike`  | npmjs.com                               | Owner of the `roycss` package. Takeover = registry-level compromise. |
| `CHANGELOG.md`              | repo root                               | Public record of what shipped.                              |
| SLSA provenance attestation | npm registry, attached to the tarball   | Lets users verify the tarball matches a commit on `main`.   |
| `.changeset/config.json`    | repo                                    | Controls bump behavior and changelog format.                |

## 3. Threats (STRIDE)

### T-1: Compromised dependency in the build graph (Supply Chain — Tampering)

- **Stride:** Tampering / Elevation of privilege.
- **Scenario:** A transitive `devDependency` (e.g. a transitive dep of `@changesets/cli`, `eslint`, or `bun`) is taken over by an attacker and ships malicious code that runs during `bun install` or `bun run build`, modifying `dist/roycss.min.css` to inject a CSS exfil payload or a backdoor import in `dist/effects.js`.
- **Likelihood:** Medium — npm has historically seen `event-stream`, `coa`, `rc`, `ua-parser-js` supply-chain attacks.
- **Impact:** High — every `npm install roycss` consumer is compromised.
- **Mitigations:**
  1. `bun.lock` committed; CI fails if `bun install --frozen-lockfile` would change it.
  2. `npm publish --provenance` ties the tarball to a specific commit + workflow run; consumers can verify with `npm view roycss --json` → `dist.attestations`.
  3. Periodic `bun audit` / `npm audit` in CI.
  4. Minimal `devDependencies` for the publish path — only `@changesets/cli` and `@changesets/changelog-github` are publish-specific; everything else (`eslint`, `typescript`) is shared with the site build and already audited.
  5. Future: Sigstore signing of the tarball itself (in addition to provenance) once `npm` supports it natively.

### T-2: Stolen or leaked `NPM_TOKEN` (Spoofing)

- **Stride:** Spoofing.
- **Scenario:** A leaked `NPM_TOKEN` (in a CI log, a fork PR, a screenshot, a former maintainer's laptop) lets an attacker publish `roycss@1.0.1` containing arbitrary JS.
- **Likelihood:** Medium-High — token leaks are the #1 cause of npm package hijacks (ua-parser-js, node-ipc, cookie-parser-hijack attempts).
- **Impact:** Critical — full remote code execution in every consumer's CI.
- **Mitigations:**
  1. `NPM_TOKEN` is an **automation-scoped, publish-only** token (granular access token: `roycss` package, `publish` permission only, no read access, no other packages).
  2. Token is stored only as a GitHub Actions encrypted secret — never written to disk, never echoed in logs.
  3. `release.yml` only runs on `push` to `main` — never on PRs. Pull-request builds cannot access the secret.
  4. npm account enforces **2FA on publish**. Even with the token, an attacker cannot publish without the second factor (this is the npm setting "Require two-factor authentication or automation tokens" → enforce on publish).
  5. Token rotated quarterly and after every maintainer off-boarding.
  6. Future: migrate to **npm's OIDC trusted publishing** once Generally Available — eliminates the long-lived token entirely (GitHub Actions federates with npm via OIDC).

### T-3: Typosquatting (Spoofing)

- **Stride:** Spoofing.
- **Scenario:** Attacker publishes `roy-css`, `roycsss`, `royccs`, `roycss-effect`, etc. and SEO-bombs them. Users mistype the install command.
- **Likelihood:** High — almost every popular npm package has typosquats.
- **Impact:** Medium — affects only users who mistype; the real `roycss` is unaffected, but reputation suffers.
- **Mitigations:**
  1. Own the canonical name `roycss` (already reserved — confirm).
  2. Defensive squat: publish empty placeholder packages for `roycsss`, `roy-css`, `roycss-effect` that simply redirect to `roycss`. (Out of scope for this pipeline, but tracked as a follow-up.)
  3. Documentation site (`get-started.tsx` Step 1) shows the exact install command with copy-button — reduces typos.
  4. `package.roycss.json` `repository.url` points to the official GitHub repo — `npm view roycss` shows the verified source.

### T-4: npm account takeover (Spoofing / Elevation of privilege)

- **Stride:** Spoofing + Elevation of privilege.
- **Scenario:** Attacker phishes the npm maintainer's password, recovers the account, and publishes `roycss@2.0.0` with malicious code — provenance and 2FA on the package side are bypassed because the attacker is now the legitimate owner.
- **Likelihood:** Low-Medium — npm accounts are high-value targets.
- **Impact:** Critical.
- **Mitigations:**
  1. npm account requires **2FA on login AND on publish** (enforced in npm account settings → "Two-Factor Authentication" → "auth-and-writes").
  2. Maintainer email uses a strong password + hardware security key (WebAuthn / passkey).
  3. Maintainer npm sessions are short-lived; logout after publish.
  4. Add a second maintainer (backup owner) so the package is not single-point-of-failure if the primary account is lost.
  5. Enable npm's "Require two-factor authentication for everyone in the org" once a `roycss` npm org is created.

### T-5: Build artifact tampering inside the runner (Tampering)

- **Stride:** Tampering.
- **Scenario:** A compromised runner (or a compromised `bun` / `eslint` binary on the runner) silently modifies `dist/roycss.min.css` between `bun run build` and `npm publish`.
- **Likelihood:** Low — GitHub-hosted runners are ephemeral and isolated.
- **Impact:** Critical.
- **Mitigations:**
  1. **Pin all devDependencies** via `bun.lock` (already committed).
  2. `release.yml` runs on `ubuntu-latest` GitHub-hosted runners (not self-hosted) — eliminates the "stale runner with a backdoored bun" scenario.
  3. `npm publish --provenance` records the exact `repository.url`, `commit_sha`, `workflow_path`, and `run_id` in the SLSA attestation. Any tampering that happens between `bun run build` and `npm publish` would be invisible to provenance — so we additionally run `prepare.ts` (which validates file sizes and contents) **after** `bun run build` and **before** `npm publish`. If a runner-side attacker shrinks or grows a file, the gate fails.
  4. Future: reproducible builds — pin `bun` to a specific version via `oven-sh/setup-bun@v1` with `bun-version: 1.3.4` and verify the build output is byte-identical across two runs.

### T-6: PR introduces a malicious changeset (Repudiation / Tampering)

- **Stride:** Repudiation + Tampering.
- **Scenario:** A drive-by contributor opens a PR that adds `.changeset/evil.md` declaring a `major` bump with a misleading changelog entry. Reviewer rubber-stamps it.
- **Likelihood:** Low.
- **Impact:** Low-Medium — at worst, a confusing changelog entry or an unexpected major version.
- **Mitigations:**
  1. Changesets are reviewed as part of the PR diff — they are markdown files with a strict frontmatter schema (bump type + package name).
  2. CI lint rejects changesets that don't parse.
  3. The release maintainer runs `bunx changeset version` locally before merging the release PR — they see the exact changelog diff before the bump lands.
  4. Two-reviewer rule for any PR that touches `package.roycss.json` or `.changeset/config.json`.

### T-7: Loss of publish capability (Denial of Service)

- **Stride:** Denial of Service.
- **Scenario:** npm account is locked, `NPM_TOKEN` is rotated but not updated in GitHub, or GitHub Actions is down — users cannot get a fix.
- **Likelihood:** Low.
- **Impact:** Medium — existing versions still install fine, but security fixes are delayed.
- **Mitigations:**
  1. Two maintainers on the npm package (backup owner).
  2. Documented token-rotation runbook in `scripts/publish/README.md`.
  3. Mirrors: the CDN URL `https://unpkg.com/roycss/dist/roycss.min.css` continues to work for any previously published version.
  4. `release.yml` is designed to be re-runnable — a failed publish can be retried by re-running the workflow.

### T-8: Information disclosure via the tarball (Information Disclosure)

- **Stride:** Information disclosure.
- **Scenario:** `npm pack` includes `.env`, `.npmrc`, `.git/`, `node_modules/`, the portfolio's `prisma/`, source maps with internal paths, etc.
- **Likelihood:** Medium — `npm pack` by default excludes most of this, but a stray `files` entry or `prepublishOnly` script can leak it.
- **Impact:** Medium — could expose maintainer PII, internal paths, or secrets.
- **Mitigations:**
  1. `package.roycss.json` declares an explicit `files` array: `["dist", "README.md", "LICENSE", "CHANGELOG.md"]`. Anything not listed is excluded from the tarball.
  2. `validate.ts` asserts the file count is `<15` and lists every file actually included — a stray `.env` would surface here.
  3. `.npmignore` is **not** used (it conflicts with `files`); the `files` array is the single source of truth.
  4. `npm pack --dry-run` is run in `prepare.ts` from a temp dir containing only `package.json` (copied from `package.roycss.json`) + the `files` array entries — the portfolio's `next.config.ts`, `prisma/`, `src/`, etc. are physically outside the temp dir, so they cannot leak.

## 4. Mitigations Summary

| Mitigation                              | Threats addressed        | Where it lives                                |
| --------------------------------------- | ------------------------ | ---------------------------------------------- |
| `bun.lock` committed + frozen install  | T-1, T-5                 | `bun.lock`, `release.yml`                      |
| `npm publish --provenance` (SLSA L3)   | T-1, T-5                 | `release.yml`, `package.roycss.json`           |
| Scoped `NPM_TOKEN` (publish-only)       | T-2                      | GitHub Actions secret                          |
| 2FA on publish (npm account)            | T-2, T-4                 | npm account settings                           |
| 2FA on login (WebAuthn / passkey)       | T-4                      | npm account settings                           |
| `release.yml` runs only on `push: main` | T-2                      | `.github/workflows/release.yml`                |
| `files` array + `<15` file count check  | T-8                      | `package.roycss.json`, `validate.ts`           |
| `prepare.ts` runs after build, before publish | T-5                | `scripts/publish/prepare.ts`                   |
| GitHub-hosted runners (not self-hosted) | T-5                      | `release.yml`                                  |
| Backup npm maintainer                    | T-4, T-7                 | npm org settings                               |
| Defensive typosquat packages (follow-up) | T-3                      | Future                                         |
| OIDC trusted publishing (follow-up)     | T-2                      | Future (once GA)                               |

## 5. Residual Risk

- **T-3 (typosquatting):** Only mitigated by user education and owning the canonical name. The real package is safe; reputation risk remains.
- **T-4 (account takeover):** 2FA + WebAuthn reduces but does not eliminate phishing-resistant risk; we rely on npm's account-recovery controls.
- **Reproducible builds:** Not yet implemented — provenance attests to "this tarball was built from this commit on this runner", but it does not attest to "an independent rebuild would produce the same bytes". Tracked as a future hardening item.

## 6. Open Questions

1. Should we create an npm **organization** (`roycss`) and publish under `@roycss/effects` scoped, or keep the unscoped `roycss` name? (Current decision: unscoped `roycss` — the brand is the package.)
2. When OIDC trusted publishing goes GA, do we drop the long-lived `NPM_TOKEN` entirely? (Yes, when available.)
3. Should the CDN tarball (`unpkg.com/roycss`) also be SRI-hashed in the documentation site? (Yes — separate task.)
