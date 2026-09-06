# RoyCSS RFCs

This directory holds the project's Requests for Comments — the written
record of every decision that changes the RoyCSS **contract**.

- **Process:** [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) (statuses,
  the 14-day window, approval thresholds)
- **Template:** [`0000-template.md`](0000-template.md)
- **Governance context:** [`docs/GOVERNANCE.md`](../docs/GOVERNANCE.md) ·
  owners per area in [`MAINTAINERS.md`](../MAINTAINERS.md)

---

## 1. What belongs here

An RFC is required when a change touches the versioned surface that
consumers depend on. Concretely, RFCs are the mechanism for:

- changes to the effect catalog's **schema** (`CSSEffect`) or to any
  published **artifact schema** (`dist/effects.json`,
  `dist/class-index.json`, `dist/motion-library.json`),
- removals or renames of any `stable` name — `roycss-*` classes, `roy-*`
  keyframes, `--roycss-*` tokens — i.e. anything entering the
  deprecation lifecycle of [`docs/DEPRECATION.md`](../docs/DEPRECATION.md),
- changes to the semver, deprecation, LTS, support-SLA, or security-SLA
  policies,
- a **major-version bump** (the RFC *is* the breaking-change list),
- new extension points in the namespace contracts, and
- governance changes ([`docs/GOVERNANCE.md`](../docs/GOVERNANCE.md),
  [`MAINTAINERS.md`](../MAINTAINERS.md), the RFC process itself).

The full classification table (with "no RFC needed" rows) is
[`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §2. Routine work does
**not** belong here: new effects, bug and a11y fixes, docs, tests, and
additive tokens ship as PRs directly.

## 2. Directory conventions

| Convention | Rule |
|---|---|
| File name | `NNNN-short-name.md` — sequential, zero-padded, assigned when the RFC enters `review`. `0000` is reserved for the template. |
| Header status | Every RFC carries a metadata header (title, status, dates, approvals) — see the template. Status is one of `draft` / `review` / `accepted` / `withdrawn`. |
| Immutability | Accepted and withdrawn RFCs are historical records. Changes happen through a **new** RFC that supersedes specific sections and updates the index below. We do not rewrite history — we link it. |
| Approvals record | Approvals (2 core + 3 community per the process) and any steering decision are recorded **in the RFC file itself**, so the document is self-contained evidence of how it was decided. |
| Enforcement | Every accepted RFC names the test, CI gate, or pinned invariant that keeps it true. This mirrors the repo's discipline elsewhere: claims are pinned — [`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts) pins the catalog at 1,959 effects, [`tests/unit/categories.test.ts`](../tests/unit/categories.test.ts) pins the 29 categories. |
| Retrospective RFCs | RFCs that document an already-shipped design are admitted directly as `accepted` (precedent: [`0001-versioned-effects.md`](0001-versioned-effects.md)) — see [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §7. |
| Discussion | The GitHub PR that adds the RFC is its discussion thread; substantive objections are recorded in the RFC body (or its appendix) when resolved, so the file survives even if the thread is eventually pruned. |

## 3. How to propose

1. Copy [`0000-template.md`](0000-template.md) to
   `rfcs/NNNN-short-name.md` (start as `draft` — the final number is
   confirmed when the RFC moves to `review`).
2. Write the sections the template demands: problem, proposal,
   alternatives, impact on the versioned surface, migration, and
   **enforcement**. The template's inline notes say what "good" looks like
   for each section.
3. Open a PR adding the file, linking any discussion issue.
4. A Maintainer checks completeness (the gatekeeper checklist is in
   [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §8) and moves it to
   `review` — the 14-day window starts and the approval counting (§5 of
   the process) begins.
5. Outcomes: `accepted` (implement; link the RFC from the policy documents
   it touches; add it to the index below) or `withdrawn` (keep the file —
   the "why not" is as valuable as the "why").

## 4. Worked example — how RFC 0001 maps onto the process

[`0001-versioned-effects.md`](0001-versioned-effects.md) is the reference
for what a complete RFC looks like, because it was held to the same bar
the process demands of new proposals:

- **Problem:** silent drift across five consumer surfaces of a
  1,959-effect catalog (site, backend, CLI, MCP server, VS Code
  extension).
- **Proposal:** one canonical TypeScript source, a fixed schema, hard
  namespace contracts, per-release artifact regeneration, lockstep
  versioning.
- **Alternatives:** hand-maintained artifacts, database-as-source,
  per-effect versioning, and no prefixing — each with the reason it was
  rejected.
- **Impact:** mapped to the five versioned-surface layers, with the
  catalog size called out as a *pinned invariant*, not a vanity metric.
- **Risks:** the known-defect keyframe-collision lock, batch-file growth,
  single-maintainer dependence — stated rather than hidden.
- **Enforcement:** a table of invariants, each with the existing test or
  script that enforces it.

## 5. Reading an RFC (for evaluators and new maintainers)

If you are evaluating RoyCSS for production use, the fastest honest
questions to ask of this directory are:

1. **What has the project refused to do?** Withdrawn RFCs and the
   "alternatives considered" sections answer this; a project with no
   recorded refusals has no decision discipline.
2. **What keeps each accepted RFC true?** The enforcement section. An
   accepted RFC with no enforcement is a wish.
3. **Who decided?** The approvals record and the governance tiers it
   cites ([`docs/GOVERNANCE.md`](../docs/GOVERNANCE.md) §3).
4. **What changed later?** The supersede chains — an RFC that has been
   amended twice with clear reasons is *healthier* than one that was
   silently perfect.

## 6. Status lifecycle cheat-sheet

| Transition | Who | What must be true |
|---|---|---|
| `draft` → `review` | Author requests; a Maintainer gatekeeps | Template complete (all sections), enforcement named, areas identified |
| `review` held open | Everyone | The 14-day window is posted in the header; one quiet extension allowed, logged |
| `review` → `accepted` | Thresholds in [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §5 | 2 core + 3 community approvals recorded in the RFC, or a public steering vote |
| `review` → `withdrawn` | Author, or steering function at window close | Disposition note written: why not, and what would change the answer |
| `accepted` → amended | New RFC | The successor RFC lists superseded sections; both files cross-link; this index updates |

A withdrawn RFC is **never deleted** — it keeps its number, its status, and
its reason. Searching this directory for "withdrawn" is a legitimate way to
learn what the project has already considered and rejected.

## 7. FAQ

- **"My change is small — do I really need an RFC?"** Check the table in
  [`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §2. If it does not touch
  the catalog schema, the namespaces, the artifact schemas, the policies,
  or a major bump: no. Ship the PR.
- **"Can I write the RFC after the code?"** Only via the retrospective
  admission route ([`docs/RFC-PROCESS.md`](../docs/RFC-PROCESS.md) §7),
  which requires the design to already be shipping and pinned — it cannot
  be used to pre-approve work that has not happened.
- **"Who assigns numbers?"** The Maintainer who moves an RFC to `review`.
  Drafts may use a placeholder; the final number is sequential
  (`0001`, `0002`, …) and `0000` is reserved for the template.
- **"What if I just disagree with an accepted RFC?"** Write a successor
  RFC. The accepted document records a decision, not a permanent law —
  but the burden of proof sits with the challenger, and the incumbent RFC's
  alternatives section tells you which arguments were already weighed.

## 8. Index

| RFC | Title | Status | Summary |
|---|---|---|---|
| [0001](0001-versioned-effects.md) | Versioned Effects — the catalog as a SemVer-governed public API | accepted (retrospective) | Documents the existing design: single canonical source in `src/lib/`, the `CSSEffect` schema, namespace contracts, `dist/` artifacts regenerated per release, lockstep version bumping, and the test-pinned catalog invariants. Admitted retrospectively — the design ships today. |

(Add a row here when an RFC enters `review` — the index is part of the
RFC, updated in the same PR.)

## 9. Why this directory exists

RoyCSS's value proposition is a large, stable surface: 1,959 effects
across 29 categories, published as CSS and JSON artifacts, consumed by the
site, the backend, the CLI, the MCP server, and the VS Code extension.
Stability at that scale is not a personality trait — it is a process. This
directory is where the process leaves its paper trail, so that:

- the **next maintainer** inherits decisions with their reasoning attached
  (the bus-factor mitigation in [`MAINTAINERS.md`](../MAINTAINERS.md) §4.3),
- **enterprise evaluators** can read exactly which contract changes were
  contemplated, approved, and enforced before they bet on the library
  ([`docs/GOVERNANCE.md`](../docs/GOVERNANCE.md)), and
- **future proposals** start from precedent instead of from scratch —
  RFC 0001 is the baseline every versioning discussion now builds on.

The bar for admission is deliberately strict: if a document in this
directory does not change (or record a change to) the published contract,
it belongs in `docs/` or in a PR description instead.
