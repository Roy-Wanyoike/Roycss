# RoyCSS Governance

- **Applies to:** the `Roy-Wanyoike/Roycss` repository and everything shipped
  from it
- **Related:** [`MAINTAINERS.md`](../MAINTAINERS.md) (who owns what) ·
  [`docs/RFC-PROCESS.md`](RFC-PROCESS.md) (how contract changes are proposed) ·
  [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) (behavior) · the quarterly cadence
  in §5 feeds the architecture review in [`docs/SLA.md`](SLA.md) §7

---

## 1. Principles

1. **The repository is the government.** Decisions that are not written down
   in the repository do not exist. Roadmap items live in
   [`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md); contract changes live
   as RFCs; policy lives in the `docs/` policy set.
2. **Honesty over theater.** The project states its real capacity (one
   maintainer today — [`MAINTAINERS.md`](../MAINTAINERS.md) §1) instead of
   describing a governance body it does not have. Structures in this
   document are defined so they *work at current size* and *scale by filling
   seats*, not by rewriting rules.
3. **Small, legible contract.** RoyCSS's value is a large but stable
   versioned surface: 1,959 effects across 29 categories, `roycss-` classes,
   `roy-` keyframes, `--roycss-*` tokens, and the `dist/` artifacts. The
   governance system exists to keep that surface predictable — every
   decision tier below ultimately protects
   [`docs/SEMVER.md`](SEMVER.md).
4. **Contributions are welcome and governed by the
   [Contributor Covenant](../CODE_OF_CONDUCT.md).** Process exists to make
   room for contributors, not to keep them out.

---

## 2. Roles

The contributor ladder (consistent with the architecture notes the project
renders on its docs site and with the recruitment plan in
[`MAINTAINERS.md`](../MAINTAINERS.md) §4.2):

| Role | How you get it | What you can do |
|---|---|---|
| **Contributor** | Merge any one PR (self-appointed thereafter) | Propose PRs, comment on RFCs and issues |
| **Triager** | Appointed by a Collaborator or Maintainer | Label and triage issues, close duplicates, set severities for [`docs/SLA.md`](SLA.md) triage |
| **Collaborator** | Several merged PRs in one area; appointed by that area's owner | Merge PRs **within their area** (fast-lane for docs per [`docs/CONTRIBUTING.md`](CONTRIBUTING.md)) |
| **Maintainer (area owner)** | Sustained contribution + demonstrated judgment in the area; appointed per the decision tiers in §3 | Merge across the repo for their area, own their area's SLA and onboarding, appoint Collaborators |
| **Project maintainer** | Current structure: the single maintainer holds this role (see [`MAINTAINERS.md`](../MAINTAINERS.md) §1) | Everything above for all areas + release authority |
| **Steering committee** | Elected annually by Maintainers and Collaborators once there are ≥3 voters; until then, the project maintainer holds the steering function alone and says so in every steering decision | Decide RFCs in the `review` state that could not reach consensus, owns roadmap priorities, LTS/semver/security policy changes |

The steering committee is sized at **3–5 members** when elected. The
long-term target (a larger working-group structure) is tracked as a roadmap
item, not assumed by this document.

---

## 3. Decision tiers

Every non-trivial decision is classified into one of three tiers. Choosing
the tier is itself a decision — when in doubt, use the *slower* tier.

### 3.1 Consensus (discuss to agreement)

**Used for:** changes to policy documents ([`docs/LTS.md`](LTS.md),
[`docs/SLA.md`](SLA.md), [`docs/SECURITY-SLA.md`](SECURITY-SLA.md),
[`docs/SEMVER.md`](SEMVER.md), [`docs/DEPRECATION.md`](DEPRECATION.md),
this document); anything affecting the MIT licensing posture; anything the
RFC process flags as contract-level.

**Process:**

1. A proposal is posted as an issue (or RFC, if §4 requires it) with the
   exact text change.
2. Discussion runs for a minimum of **7 days** for policy edits. Every
   substantive objection is answered in-thread — silence is not consensus
   when an objection is standing.
3. The decision records: the final text, the objections considered, and who
   decided.
4. Consensus is reached when no *maintainer* objects and community concerns
   are answered — not when everyone is exhausted.

### 3.2 Lazy consensus (silence is consent)

**Used for:** the routine day-to-day of running the project — effect
additions and fixes, bug fixes, dependency patch bumps, docs updates,
test additions, tooling tweaks. The default tier: **most work happens
here.**

**Process:**

1. Anyone may propose via PR (workflow per
   [`docs/CONTRIBUTING.md`](CONTRIBUTING.md)).
2. The area owner (or the project maintainer, while the area table is
   single-owner) reviews. If an owner besides the proposer approves, the PR
   may merge.
3. **The objection window is the review itself.** If a maintainer requests
   changes, the PR does not merge until resolved — lazy consensus means
   "no one objected after a real look", never "nobody looked".
4. Hard gates that are *never* lazy: pinned catalog invariants
   (1,959 effects / 29 categories — see
   [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts)),
   `bunx tsc --noEmit` clean, the API drift gate, and every "requires an
   RFC" item in §4. CI enforces these; a human waving them through is not a
   decision tier, it is a bug.

### 3.3 Steering vote (decide when stuck)

**Used for:**

- RFCs in the `review` state whose 14-day window closes without the
  approval threshold being met ([`docs/RFC-PROCESS.md`](RFC-PROCESS.md)).
- Deadlocks between area owners (e.g., a PR spanning `backend-node` and
  `backend-go` with conflicting review outcomes).
- Emergency decisions with a clock shorter than consensus allows (e.g., a
  critical security release that policy text would otherwise slow — the
  decision is still written up and posted for review after the fact).

**Process:**

1. A steering vote is called by any Maintainer, with the question phrased
   so it can be answered yes/no/defer.
2. Voting runs for **72 hours** (or the length of the emergency clock for
   §3.3 emergency calls). Votes and the tally are posted publicly.
3. **Simple majority of the steering function decides** (while the steering
   function is a single person, their vote is the decision — the policy
   requires it be posted with reasoning, so the record exists for review).
4. The outcome is written into the artifact it changes (RFC disposition,
   PR merge, policy edit) — a steering vote that changes nothing on disk
   didn't happen.

### 3.4 Tier conflicts

A decision that meets two tiers' criteria runs at the slower tier. A
steering vote may not overrule the pinned-invariant gates in §3.2 item 4
without an explicit, recorded RFC-level exception in the release notes.

---

## 4. What requires an RFC

The RFC process itself — template, lifecycle, 14-day window, approval
thresholds — is defined in [`docs/RFC-PROCESS.md`](RFC-PROCESS.md). The
classification rule:

**RFC required** (consensus tier, 14-day window):

- A change to the versioning, LTS, deprecation, or semver policy.
- A change to the effect schema (`CSSEffect`) or any artifact schema
  (`dist/effects.json`, `dist/class-index.json`).
- A new extension point in the class/token/keyframe namespace contracts.
- A major-version bump.
- Changes to governance (this document) and the support/security SLAs.

**RFC not required** (lazy consensus):

- New effects, effect fixes, performance and a11y fixes.
- Bug fixes, docs updates, test additions, dependency patch bumps.
- Anything listed as pending work in
  [`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md) that does not touch the
  contract surfaces above.

The threshold is deliberately high: RFCs are for changes that affect the
compatibility contract, not for everything.

---

## 5. Quarterly cadence

Governance runs on a **quarterly rhythm**, aligned with the architecture
review defined in [`docs/SLA.md`](SLA.md) §7:

| When | What | Output |
|---|---|---|
| Quarterly (Q1–Q4) | **Architecture review** — SLA performance, LTS commitments, drift vs. pinned invariants, capacity/bus-factor, risk register ([`docs/SLA.md`](SLA.md) §7) | Published minutes; action items become `docs/PENDING-FEATURES.md` entries or RFCs |
| Quarterly | **Governance review** — are the decision tiers being used correctly? Are lazy-consensus merges carrying proper review? Any steering decisions that should have been consensus? | Amendments to this document via §3.1 if needed |
| Annually (once ≥3 voters exist) | **Steering elections** — Maintainers and Collaborators elect the 3–5 seat steering committee | Updated [`MAINTAINERS.md`](../MAINTAINERS.md) §2 and this document's §2 |
| Annually | **Policy re-affirmation** — LTS/SLA/SECURITY-SLA/SEMVER/DEPRECATION reviewed as a set; stale statements fixed; the supported-versions table refreshed | Policy revision entries in each document's change history |

While the project has a single maintainer, the quarterly reviews still run
and still publish notes — a one-person review with a public record is worth
more than an unwritten committee.

---

## 6. Transparency rules

1. **Decisions are public by default.** Anything decided in a private
   channel (enterprise agreements, security advisories before disclosure)
   is summarized publicly as soon as confidentiality allows — the pattern
   the deployment-status note in the [`README`](../README.md) sets.
2. **Records over recollection.** Every tier-1 and tier-3 decision links to
   its artifact: the merged PR, the closed RFC, the policy edit.
3. **No unwritten vetoes.** An objection that is never posted does not exist.
4. **The backlog is the roadmap.** Prioritization happens in
   [`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md) with its priority tags;
   prioritization decided elsewhere is copied there or it didn't happen.

---

## 7. Change history for this document

| Revision | Change |
|---|---|
| Initial | Document established with the governance documentation set (PF-005): three decision tiers, role ladder, quarterly cadence, RFC classification. |
