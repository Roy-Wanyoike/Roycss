# RoyCSS RFC Process

- **Owner:** governance (see [`docs/GOVERNANCE.md`](GOVERNANCE.md)) with the
  release area as enforcement gatekeeper
- **Artifacts:** RFCs live in the [`rfcs/`](../rfcs/README.md) directory;
  new proposals start from [`rfcs/0000-template.md`](../rfcs/0000-template.md)
- **Related:** [`docs/GOVERNANCE.md`](GOVERNANCE.md) (decision tiers) ·
  [`docs/SEMVER.md`](SEMVER.md) and [`docs/DEPRECATION.md`](DEPRECATION.md)
  (the contracts RFCs most often touch) · [`docs/LTS.md`](LTS.md) ·
  [`docs/SECURITY-SLA.md`](SECURITY-SLA.md)

---

## 1. What an RFC is — and is not

An RFC (Request for Comments) is the mechanism for **changing the contract**:
the parts of RoyCSS that consumers depend on and that
[`docs/SEMVER.md`](SEMVER.md) treats as the versioned surface.

An RFC is **not**:

- a feature request (those live in
  [`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md)),
- a bug report (GitHub issues),
- a code review (PRs),
- or a way to slow down routine work — the overwhelming majority of changes
  (new effects, fixes, docs) never need one.

The threshold is high on purpose: RFCs are for changes where being wrong is
expensive.

## 2. What requires an RFC

| Change | RFC? |
|---|---|
| New effect, effect fix, a11y fix, perf fix | No — PR |
| Docs update, test addition | No — PR (docs fast-lane per [`docs/CONTRIBUTING.md`](CONTRIBUTING.md)) |
| New token, new keyframe, new category (additive) | No — PR + release note |
| Change to the `CSSEffect` schema or any `dist/` artifact schema | **Yes** |
| Removal/rename of any `stable` class, token, or keyframe (i.e., any entry entering the [`docs/DEPRECATION.md`](DEPRECATION.md) lifecycle) | **Yes** |
| Change to the versioning / semver / deprecation policy itself | **Yes** |
| Change to the LTS policy, support SLA, or security SLA | **Yes** |
| A major-version bump | **Yes** (the RFC *is* the breaking-change list) |
| New extension point in the namespace contracts | **Yes** |
| Governance changes ([`docs/GOVERNANCE.md`](GOVERNANCE.md), this document, maintainer structure) | **Yes** |
| New platform product / new module in `backend-node` | No — roadmap + PR |

Ambiguity resolves per [`docs/GOVERNANCE.md`](GOVERNANCE.md) §3: when in
doubt, use the slower tier.

## 3. Lifecycle and statuses

Every RFC has exactly one status at all times:

| Status | Meaning |
|---|---|
| **`draft`** | Being written or revised. Not yet open for the formal review window; comments welcome but no clocks running. |
| **`review`** | Formally open. The 14-day window (§4) is running; approvals are being counted (§5). |
| **`accepted`** | Approved and active. The RFC's decisions govern; implementation may proceed (or may already exist — see "retrospective RFCs", §7). |
| **`withdrawn`** | Closed without adoption. Includes rejected proposals — withdrawal records the disposition and the reason, so the same idea is not re-litigated blind. |

Transitions:

- `draft` → `review`: the author requests review; a Maintainer checks the
  template is complete (§8) and assigns the RFC number.
- `review` → `accepted`: the approval threshold is met (§5) or a steering
  vote decides ([`docs/GOVERNANCE.md`](GOVERNANCE.md) §3.3).
- `review`/`draft` → `withdrawn`: by the author at any time, or by the
  steering function at the window's close when the threshold is not met.
  A withdrawn RFC keeps its number and its disposition note forever.
- `accepted` → amendment: accepted RFCs are amended by a new RFC that
  supersedes sections and updates the index, never by editing history.

## 4. The 14-day review window

1. **Window.** Once an RFC enters `review`, it stays open for **14 days**.
   The clock is posted in the RFC header (window start and end dates).
2. **Quiet-extension rule.** If the window ends with substantive,
   unanswered feedback — or with an active discussion still converging —
   the author may extend by posting a new end date (once, up to 14 more
   days). Extensions are logged in the RFC header, so "in review" never
   silently means "in review forever".
3. **No decision before the window ends.** Approval edits cannot merge an
   RFC that is in `review` — the window exists so that people who are not
   watching the repo daily can participate.
4. **Emergency carve-out.** Security-response changes follow
   [`docs/SECURITY-SLA.md`](SECURITY-SLA.md) clocks first; if a security fix
   requires a contract change, the fix ships under the SLA and the RFC is
   filed retrospectively (§7), with the decision recorded for review.

## 5. Approvals: 2 core + 3 community

An RFC in `review` reaches `accepted` when **both** of the following are
recorded in the RFC document (in its approvals table):

1. **Two core approvals** — from area owners (per
   [`MAINTAINERS.md`](../MAINTAINERS.md)) whose areas the RFC touches. For
   an RFC touching one area, that area's owner **plus the release area
   owner** (release owns the compatibility surface). While the area table
   has a single maintainer, the second core approval is satisfied by that
   maintainer *and* a CI-verifiable artifact: the RFC must name the test or
   gate that will enforce its contract (e.g., a pinned corpus test per
   [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts)). The
   machine is the second reviewer.
2. **Three community approvals** — three distinct non-owner contributors
   vouching in the RFC thread that they understand the change and support
   it. Community approval means engagement, not unanimity: contributors who
   *object* are counted differently (§6).

Both thresholds exist for the same reason: an RFC that two owners like but
nobody in the community has read is a contract nobody outside the repo can
plan around; an RFC the community loves but no owner will maintain is a
promise without a maintainer (the "no feature without a maintainer" rule,
see [`docs/GOVERNANCE.md`](GOVERNANCE.md) §1 and
[`MAINTAINERS.md`](../MAINTAINERS.md)).

If the window closes without the thresholds, the steering function decides
per [`docs/GOVERNANCE.md`](GOVERNANCE.md) §3.3 (accept / defer with named
conditions / withdraw with reason) — posted publicly in the RFC.

## 6. Objections

- A **blocking objection** is a substantive argument that the proposal
  breaks the versioned surface, the support commitments, or the project's
  stated numbers/facts discipline. Blocking objections must be answered in
  the RFC before acceptance — or explicitly overruled by a steering vote,
  with the objection and the overrule recorded in the RFC.
- **Taste disagreements** (naming, section ordering, phrasing) are resolved
  by the author and noted as considered; they do not block.
- Reviewers are asked to state objections as `OBJECT:` lines in RFC
  comments so they are unmissable and greppable.

## 7. Retrospective RFCs

Some contracts already exist in code before this process did. RFC
[`0001-versioned-effects`](../rfcs/0001-versioned-effects.md) is the
precedent: it documents the **existing** versioned-effects design
(catalog, schema, namespaces, artifacts, release lockstep) as implemented
in `src/lib/`, and was admitted directly as `accepted` because the design
it describes is shipping and pinned by tests. Retrospective RFCs must:

- describe what *is*, not what is proposed (status `accepted` is honest
  only because the design exists),
- mark any open questions explicitly as future work,
- and be amendable only through the normal process (§3).

A retrospective RFC may not be used to launder a *new* change as
pre-approved: the enforcement is that any PR implementing a change not
described in an accepted RFC still needs the RFC first.

## 8. Writing an RFC (format)

Use [`rfcs/0000-template.md`](../rfcs/0000-template.md). The gatekeeper
checks for:

1. A problem statement that shows the constraint (not just the wish).
2. The proposed change, at the level of the *contract* — names, schemas,
   versions, gates — with code-level detail where the surface is precise.
3. Alternatives considered, each with why it was not chosen.
4. Impact on the versioned surface (which [`docs/SEMVER.md`](SEMVER.md)
   layer changes; whether the change is major/minor/patch).
5. Migration/deprecation impact per [`docs/DEPRECATION.md`](DEPRECATION.md)
   if any name changes.
6. The **enforcement** section: the test, gate, or pinned invariant that
   will keep the RFC true after it merges.

Numbering: RFCs take sequential numbers (`0001`, `0002`, …) at the moment
they enter `review`; `0000-template.md` reserves zero.

## 9. After acceptance

- The RFC number and decision are linked from the document it changes
  (policy docs' "Related" headers, the [`rfcs/README.md`](../rfcs/README.md)
  index, and the release notes of the release that first implements it).
- Implementation PRs reference the RFC number in the commit/PR title.
- If implementation reveals the RFC was wrong, the change goes through a
  new RFC — the document is the contract, not the intention.

## 10. Change history for this policy

| Revision | Change |
|---|---|
| Initial | Policy established with the governance documentation set (PF-005): 4 statuses, 14-day window, 2 core + 3 community approvals, retrospective admission rule. |
