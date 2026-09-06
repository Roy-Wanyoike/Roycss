# RoyCSS Maintainers

- **Purpose:** who owns what in this repository, how to become an owner, and
  the plan for removing the single point of failure this project currently is.
- **Related:** [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) (decision tiers, cadence) ·
  [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) (contribution workflow) ·
  [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) ·
  [`docs/SLA.md`](docs/SLA.md) (support) ·
  [`docs/SECURITY-SLA.md`](docs/SECURITY-SLA.md)

---

## 1. Current state — read this first

**RoyCSS is a single-maintainer project.** Every area below is currently
owned by one person:

- **Project maintainer:** Royford Wanyoike Wamaitha
  ([@Roy-Wanyoike](https://github.com/Roy-Wanyoike)) — author, sole
  maintainer, and current owner of all eight areas in the table below.

This is stated plainly at the top of the document because it is the single
most important fact for anyone evaluating RoyCSS for production use (it is
the bus-factor risk flagged by the enterprise readiness review), and because
§4 exists specifically to retire it. The area table below is therefore
written as the **target structure the project commits to staff**, with the
current reality marked in every row. When a co-maintainer is recruited for
an area, their row is updated and the "acting owner" annotation is removed —
the document is designed so that day is a one-line edit, not a rewrite.

---

## 2. Area owners

| Area | Owner | Scope (representative paths) | Backup |
|---|---|---|---|
| **frontend** | Project maintainer (acting) | `src/app/`, `src/components/`, `src/lib/` (catalog, registry, tokens, API client), Next.js build | — open |
| **backend-node** | Project maintainer (acting) | `backend-node/` — Express + Prisma + Zod, 68 modules, route surface documented in [`API.md`](API.md) | — open |
| **backend-go** | Project maintainer (acting) | `backend-go/` — Go port of the `/api/v1` contract (production target) | — open |
| **infra** | Project maintainer (acting) | `vercel.json`, `render.yaml`, `infrastructure/`, CI workflows in `.github/workflows/`, deploy runbooks | — open |
| **docs** | Project maintainer (acting) | `README.md`, `docs/`, [`docs/PENDING-FEATURES.md`](docs/PENDING-FEATURES.md), `API.md`, release notes | — open |
| **a11y** | Project maintainer (acting) | WCAG AA conformance: `a11y/`, `tests/a11y/`, reduced-motion and keyboard contracts across effects | — open |
| **security** | Project maintainer (acting) | `security/`, [`docs/SECURITY-SLA.md`](docs/SECURITY-SLA.md), advisory response, key custody | — open |
| **release** | Project maintainer (acting) | `scripts/release/`, `scripts/publish/`, `dist/` artifacts, version lockstep, LTS backports ([`docs/LTS.md`](docs/LTS.md)) | — open |

Ownership rules:

- **Owners review, others propose.** PRs touching an area get a review from
  that area's owner (or a maintainer they delegate) before merge.
- **Owners are accountable for the SLA clocks** that touch their area
  ([`docs/SLA.md`](docs/SLA.md) §3) and for onboarding the next contributor
  to their area.
- **Area scope is path-based, not ego-based.** When a PR spans areas, every
  touched area's owner reviews their slice; the release area owner breaks
  ties.
- While the acting-owner state persists, "owner review" reduces to
  self-review by the maintainer — in that state, second opinions come from
  CI gates (typecheck, the pinned test suite, the API drift gate) and from
  public PR review, and the recruiting plan (§4) is the exit.

---

## 3. Per-area onboarding notes

Each note is the shortest path from "clone" to "useful first PR in this
area". All commands assume the repo root; the general contribution workflow
(branches, lint, tsc, viewports) is in [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

### 3.1 frontend (Next.js 16 + React 19 + Tailwind 4)

- Setup: `bun install` → `bun run dev` (port 3000; no `.env`, no database
  required — the full effect catalog ships in-repo in `src/lib/`).
- The load-bearing invariant: the catalog is **1,959 effects across 29
  categories**, pinned by [`tests/unit/effects.test.ts`](tests/unit/effects.test.ts)
  and [`tests/unit/categories.test.ts`](tests/unit/categories.test.ts).
  Any PR that changes those numbers intentionally must update the pinned
  tests and the README in the same PR.
- Where effects live: `src/lib/roycss-effects.ts` aggregates the
  `effects-batch-*.ts` modules; the `CSSEffect` schema is
  `src/lib/roycss-types.ts`. Class prefix `roycss-`, keyframe prefix `roy-`,
  tokens `--roycss-*` (OKLCH — see `src/lib/design-tokens.ts`).
- Gates before review: `bunx tsc --noEmit` (0 errors) and
  `bunx vitest run tests/unit` (248 tests).

### 3.2 backend-node (Express + Prisma + Zod)

- Setup: `cd backend-node && bun install`, then `prisma db push` with a
  local `DATABASE_URL` — full variable list with the 16-character secret
  rules in [`backend-node/.env.example`](backend-node/.env.example). The
  server validates its environment at boot and exits fast with a readable
  error list.
- The route surface (all 68 modules) is documented in [`API.md`](API.md) and
  enforced by the drift gate: `bun run api:check` fails if code and docs
  disagree in either direction.
- Mutating routes require Bearer JWT (401 envelope, 403 role-gating) — new
  routes must preserve that contract, and integration tests live in
  `backend-node/tests/`.
- Module honesty: `src/lib/module-status.ts` is the registry that decides
  whether a product card may claim "Live" — never flip a badge in a
  component.

### 3.3 backend-go (Go port — production target)

- Setup: standard Go toolchain; module layout under `backend-go/` (`cmd/`,
  `internal/`, `pkg/`, `api/`).
- The port registers the same `/api/v1` contract as backend-node; modules
  not yet ported return `501` so clients fall back to backend-node. The port
  plan is batched in [`docs/PENDING-FEATURES.md`](docs/PENDING-FEATURES.md) (PF-008).
- The acceptance bar for ported modules is contract parity with the
  backend-node behavior (response shapes, status codes, auth semantics) —
  backend-node is the running source of truth until the port completes.

### 3.4 infra (deploy + CI)

- Frontend deploys on Vercel ([`vercel.json`](vercel.json)); backend deploys
  on Render ([`render.yaml`](render.yaml), `rootDir: backend-node`).
- CI lives in `.github/workflows/` (lint, typecheck, unit + integration
  tests, package build, deploy, release, Lighthouse) plus Dependabot config.
- The known live-site deploy gap is tracked publicly in issue #75; infra
  onboarding starts by reading that issue and the README's deployment notes,
  because operational honesty about deploy state is a project norm, not an
  accident to hide.

### 3.5 docs

- Docs changes are the fast lane: docs-only PRs are merged by any
  collaborator without waiting for code-area review (norm defined in the
  governance docs the docs site renders).
- The roadmap source of truth is [`docs/PENDING-FEATURES.md`](docs/PENDING-FEATURES.md);
  its per-item `State` lines are updated when work ships, with the PR link.
- Numbers discipline: every number a doc claims should be pinned by a test
  or a file that CI checks (the README's "Key numbers" table is the model).
  If you cannot pin a number, phrase it qualitatively — do not invent one.

### 3.6 a11y (WCAG AA)

- The bar: WCAG 2.2 AA. Automated audit target is zero axe-core violations;
  the current report lives at [`tests/a11y/WCAG-REPORT.md`](tests/a11y/WCAG-REPORT.md),
  harness in `a11y/`.
- Effect-level rules (see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)):
  every effect must ship a `prefers-reduced-motion: reduce` block; animate
  only `transform`/`opacity`; maintain AA contrast for overlaid text.
- An effect that fails an a11y check cannot be promoted to `stable` (the
  stability model in [`docs/SEMVER.md`](docs/SEMVER.md)).

### 3.7 security

- Start with [`docs/SECURITY-SLA.md`](docs/SECURITY-SLA.md) and
  [`security/SECURITY-POLICY.md`](security/SECURITY-POLICY.md), then the
  gates in §6 of the latter (exfiltration/XSS scans, SBOM, provenance).
- Response clocks are contractual: 24-hour acknowledgement, 72-hour
  critical fix. Onboarding includes shadowing the mailbox policy.
- The security area owner holds the PGP key custody duties in
  [`docs/SECURITY-SLA.md`](docs/SECURITY-SLA.md) §4. A second keyholder is
  part of the recruitment plan below — key custody is a named single point
  of failure today.

### 3.8 release

- Release machinery: `scripts/release/` (version bumper, changelog
  generator, release/publish configs) and `scripts/publish/`. The bumper
  updates the lockstep manifests (library, CLI, MCP server, VS Code
  extension) atomically — manifests are never hand-edited.
- Artifacts in `dist/` are regenerated from source on every release
  (e.g. `scripts/generate-effects-json.ts` → `dist/effects.json`).
- LTS backports are cut per [`docs/LTS.md`](docs/LTS.md) §4. Breaking-change
  releases must carry the announcement-plus-codemod contract from
  [`docs/DEPRECATION.md`](docs/DEPRECATION.md).

---

## 4. Bus-factor mitigation & recruitment plan

The enterprise readiness review flagged single-maintainer concentration as a
Critical risk. The plan to retire it, in priority order:

### 4.1 Targets

1. **First co-maintainer: release area.** Release authority unblocks every
   other area (patches, backports, security releases) and is the cheapest to
   onboard (§3.8 is almost entirely script-driven). Target: the first
   co-maintainer recruited for the project takes this area.
2. **Second: security area.** Named second responder for
   `security@roycss.dev` and a second PGP key custodian — the two
   single-person dependencies the security SLA currently rests on.
3. **Third: backend-node.** Largest surface by module count (68 modules);
   shares reviewers with backend-go (PF-008 port work benefits directly).
4. **Then: frontend, infra, docs, a11y** in whatever order contributors
   actually appear — the ladder (§4.2) fills areas from demonstrated
   contribution, not from a wishlist order.

### 4.2 The ladder (how ownership is granted)

Ownership is earned in the area itself, per the contributor ladder defined
in [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md):

1. **Contributor** — merged at least one PR in the area.
2. **Collaborator** — several merged PRs in the area, appointed by the area
   owner, with merge rights *in that area*.
3. **Co-maintainer (area owner)** — sustained contribution plus demonstrated
   judgment: reviews others' PRs correctly, handles at least one incident or
   release in the area with the owner shadowing, and commits to the coverage
   expectations in [`docs/SLA.md`](docs/SLA.md) §3. Appointed per
   [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) decision tiers.

Each co-maintainer row in the §2 table is filled only through this ladder —
including, explicitly, via the "good first issue" pathway described in
[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

### 4.3 Standing mitigations while the table has one name

These are the practices that reduce the *consequences* of the bus factor
while it still exists:

- **Everything is in-repo and reproducible.** The full catalog, backend,
  build, and release machinery are in this repository with pinned tests
  (`bunx tsc --noEmit`, `bunx vitest run tests/unit`) — a successor
  maintainer can take over without archaeology.
- **This document set.** LTS, SLA, security, semver, deprecation, and the
  RFC process are written as policies, not as habits — policies survive
  handover.
- **Coverage is published, not implied.** The acting-owner annotations in
  §2 and the honesty clauses in [`docs/SLA.md`](docs/SLA.md) §1 and
  [`docs/LTS.md`](docs/LTS.md) §7 mean an evaluator can price the risk
  instead of discovering it.
- **Quarterly review tracks the plan.** The quarterly architecture review
  ([`docs/SLA.md`](docs/SLA.md) §7, agenda item 4) explicitly measures
  recruitment progress against review latency and issue load, so this
  section is a standing item, not a wish.

---

## 5. Adding or changing owners

- **Adding a co-maintainer:** update the §2 row (owner + backup), announce
  in the release notes of the next release, and record the appointment
  decision per [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md).
- **Stepping down:** post an issue, transition open reviews (in-repo, so
  everything is inspectable), and keep the row accurate — an honest vacancy
  is better than a stale name. Ownership of an abandoned area reverts to
  the project maintainer and returns to the §4.1 recruitment queue.
- **Emergency contact:** the public contact channels in the
  [`README`](README.md) (issues, security mailbox) are the authoritative
  reachability path; no maintainer is reachable only via private channels.

---

## 6. Change history for this document

| Revision | Change |
|---|---|
| Initial | Document established with the governance documentation set (PF-005): area table (8 areas), onboarding notes, single-maintainer disclosure, recruitment plan. |
