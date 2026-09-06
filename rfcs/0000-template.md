# RFC-NNNN: <Title>

- **Status:** draft
- **Review window:** not yet opened (dates are assigned when the RFC moves
  to `review`)
- **Author(s):** <GitHub handle(s) or role title>
- **Area(s) affected:** <frontend / backend-node / backend-go / infra /
  docs / a11y / security / release — per [`MAINTAINERS.md`](../MAINTAINERS.md)>
- **Approvals:**
  - Core (area owners): _none yet — 2 required, see
    [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §5_
  - Community: _none yet — 3 required_
- **Supersedes:** _none / list of RFC numbers + the specific sections_
- **Enforcement:** _the test, CI gate, or pinned invariant that keeps this
  RFC true after acceptance (required before `review`)_

> **Template notes** (delete them in your RFC): every section below is
> required. The italic notes are the reviewer's rubric — the gatekeeper
> checks against them. Write for two readers at once: the maintainer who
> must implement it, and the enterprise evaluator two years from now who
> must decide whether they can trust the decision. Keep claims pinned to
> files and tests; if a number matters, name the test that pins it.

---

## 1. Summary

One paragraph: what changes, at the level of the **contract** (names,
schemas, versions, gates) — not the implementation.

*Rubric: a reader of only this section should be able to classify the
change as major/minor/patch per [`docs/SEMVER.md`](../docs/SEMVER.md) and
name the affected consumer surfaces. If they cannot, the summary is
implementation-flavored — rewrite it.*

## 2. Problem

The constraint being solved, stated so a skeptical reader can verify it
exists. Include evidence: the failing case, the consumer that breaks, the
support commitment at risk, or the number that cannot be kept honest.

*Rubric: link the evidence — an issue, a test that will fail, an SLA
section in [`docs/SLA.md`](../docs/SLA.md), a pinned invariant in
[`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts). If the
problem is "we would like this", the change is a feature request — file it
in [`docs/PENDING-FEATURES.md`](../docs/PENDING-FEATURES.md) instead; it
does not need an RFC.*

## 3. Proposal

The concrete change. Be precise at the contract level:

- Which [`docs/SEMVER.md`](../docs/SEMVER.md) layer changes (catalog /
  schema / namespaces / artifacts / exports).
- Exact new or removed names (`roycss-*` classes, `roy-*` keyframes,
  `--roycss-*` tokens, `CSSEffect` fields, artifact keys, export
  signatures).
- Whether the release carrying the change is a **major / minor / patch**
  per [`docs/SEMVER.md`](../docs/SEMVER.md) §2–4, and why the borderline
  calls went the way they did (the ambiguity rule: when in doubt, major).
- What the world looks like after: what a consumer upgrading must do.

*Rubric: a reviewer should be able to diff the contract from this section
alone, without reading the implementation PR. Naming the exact symbols is
the point — "rename some classes" is not a proposal.*

## 4. Alternatives considered

For each alternative: what it is, why it was not chosen. Include the null
option ("do nothing") — most problems are smaller than they first appear,
and the record of *not* changing things is part of the value of this
directory.

*Rubric: at least three alternatives, at least one of which you argue
against yourself. An RFC with no serious alternatives has not been
thought about; the steering function can reject on this section alone
([`docs/GOVERNANCE.md`](../docs/GOVERNANCE.md) §3.3). See
[`0001-versioned-effects.md`](0001-versioned-effects.md) §4 for the
house style.*

## 5. Impact on the versioned surface

- **Compatibility:** breaking / additive / fix. If breaking: the
  deprecation lifecycle per [`docs/DEPRECATION.md`](../docs/DEPRECATION.md)
  (notice in a prior minor → codemod → 6-month dwell → removal in the next
  major) and the LTS backport question per [`docs/LTS.md`](../docs/LTS.md).
- **Migration:** the codemod or manual steps a consumer runs; what the
  codemod cannot handle.
- **Artifacts:** which `dist/` outputs change and who parses them (the
  backend effects service that reads `dist/effects.json` at boot, the MCP
  server, the CLI, the VS Code extension).
- **Pinned invariants:** any test that must change
  (e.g. [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts),
  [`tests/unit/categories.test.ts`](../tests/unit/categories.test.ts)) —
  and the release-notes section that must explain it.

*Rubric: this is the section the release area owner reviews against
[`MAINTAINERS.md`](../MAINTAINERS.md) §3.8. An RFC that touches names but
has no deprecation/migration subsection is incomplete on its face.*

## 6. Risks and mitigations

What could go wrong, ranked. Include the "no maintainer" risk honestly —
per [`MAINTAINERS.md`](../MAINTAINERS.md), a contract change needs an
owner committed to supporting it for the LTS window.

*Rubric: name the risk, name the mitigation, name the owner. "Low risk"
with no argument is not a risk assessment. Known defects get recorded as
known defects — see the keyframe-collision lock in
[`0001-versioned-effects.md`](0001-versioned-effects.md) §6 for the
precedent of admitting a wart and pinning it.*

## 7. Enforcement

How this RFC stays true after merge:

- The **test or CI gate** that fails if someone violates it (the project's
  pattern: claims are pinned — the catalog count, category count, and
  keyframe uniqueness are all test-enforced today).
- The **document** that will link this RFC (policy "Related" headers, the
  [`README.md`](../README.md), release notes).
- The **checklist** for the release area owner (per
  [`MAINTAINERS.md`](../MAINTAINERS.md) §3.8) before the change ships.

*Rubric: this is the section that separates an RFC from a blog post. "We
will be careful" is not enforcement. If no gate exists yet, the RFC's
implementation PR must add one — enforcement may be built with the RFC,
but never after it.*

## 8. Open questions

Questions that must be answered before `review` closes. `draft` RFCs are
allowed to have them; `accepted` RFCs are not.

*Rubric: open questions carry the name of the person who will answer them.
An accepted RFC with silent open questions is a withdrawn RFC wearing a
costume.*

---

## Appendices (optional)

- **A. Sketches** — schemas, before/after snippets, rendered examples.
  Keep contract-level examples here; implementation detail belongs in the
  PR.
- **B. Discussion summaries** — link the issue threads and summarize the
  substantive objections and how they were resolved (or overruled, with
  the steering decision).
- **C. Changelog for this RFC** — status transitions, extensions of the
  review window per [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §4,
  steering decisions, and amendments. Every accepted RFC ends its life
  with this appendix populated.

*Delete this block and the italic notes when you submit; keep the
appendices you actually use.*
