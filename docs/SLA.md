# RoyCSS Support SLA

- **Owner:** release + infra areas (see [`MAINTAINERS.md`](../MAINTAINERS.md))
- **Applies to:** the RoyCSS repository (`main`), the published `roycss` npm
  artifacts in `dist/`, and the platform frontend at
  <https://roycss.vercel.app>
- **Security incidents follow a separate, stricter timeline:** see
  [`docs/SECURITY-SLA.md`](SECURITY-SLA.md)
- **Version support windows:** see [`docs/LTS.md`](LTS.md)

---

## 1. Purpose and honesty note

This document defines the **response** service levels for defects reported
against RoyCSS. It exists for two audiences:

1. **Users and enterprise evaluators**, who need to know what happens after
   they file a bug.
2. **Maintainers**, who need a triage contract that holds the project to
   verifiable behavior instead of vibes.

One thing this document does **not** do: pretend capacity that does not
exist. RoyCSS is currently a single-maintainer project (see
[`MAINTAINERS.md`](../MAINTAINERS.md)). The SLA below distinguishes between
what is **contractual for enterprise agreements** (§5) and what is the
**community best-effort target** (§3), so neither audience is misled. Where a
timeline is at risk, the policy is to say so on the issue, early — the
project's operating norm is operational honesty (the deployment status note
in the [`README`](../README.md) is the template for that tone).

---

## 2. Severity definitions

Severity is set by the triaging maintainer at first response and may be
negotiated with the reporter. When in doubt, triage high and downgrade.

| Level | Name | Definition (any one is sufficient) | Examples |
|---|---|---|---|
| **P0** | Critical | The published library or production site is broken for a broad set of unmodified users; data loss or security impact; a release artifact is unusable | `roycss.css` ships with invalid CSS that breaks every page using it; `dist/effects.json` exports a corrupted catalog; site hard-down |
| **P1** | High | A documented, `stable` effect or API path is broken for a subset of users; a WCAG AA failure on a primary surface; an install-time failure on a supported runtime | An effect renders broken in a supported browser; a `/api/v1` route returns 500 for valid input; keyboard trap on the effects gallery |
| **P2** | Medium | A `stable` surface works but behaves incorrectly or degrades quality; docs describe behavior that code contradicts (drift); a tool (CLI/MCP/extension) fails a documented command | Wrong easing on an effect vs. docs; copy-to-clipboard produces stale CSS; a generator produces non-OKLCH colors |
| **P3** | Low | Cosmetic issues, improvement requests, `experimental` surface defects, tooling niceties | Typo in a description; a nicer error message; request for a new effect |

Security reports are **never** triaged through this table — they go to
`security@roycss.dev` and follow [`docs/SECURITY-SLA.md`](SECURITY-SLA.md)
from the moment they arrive.

---

## 3. Response targets (community / GitHub issues)

| Severity | First response | Target fix | Notes |
|---|---|---|---|
| **P0** | **1 hour** | 24 hours (mitigation or fix) | Mitigation may be a rollback of the artifact or site, not necessarily a code fix |
| **P1** | **4 hours** | Next minor release, or a patch if a workaround does not exist | Patch releases are cut from `main` with the standard release scripts |
| **P2** | **Next business day** | Next scheduled minor | Batched into the normal release flow |
| **P3** | Best effort within one week | Backlog | Triage response only; fix when scheduled |

Definitions, so the numbers mean something:

- **First response** = a substantive human reply on the issue: severity
  assigned, reproduction attempted or confirmed, and next steps stated. An
  auto-label from CI or a bot is not a response.
- **Business hours** for the P2 target are the maintainer's working hours as
  published in the [`MAINTAINERS.md`](../MAINTAINERS.md) coverage table; a
  "next business day" clock that would land on a holiday rolls to the next
  working day.
- **P0's 1-hour target applies during published coverage hours.** A P0 filed
  outside coverage hours starts its clock at the start of the next coverage
  window; the SLA's guarantee is that the maintainer acknowledges it in the
  first coverage hour, and the issue says so explicitly (no silent overnight
  queues).

---

## 4. Channels

| Channel | Purpose | SLA |
|---|---|---|
| GitHub issues (`Roy-Wanyoike/Roycss`) | Public bug reports and feature requests from the community | §3 targets |
| Pull request reviews | Contributor PRs | Review target: within 3 business days for non-trivial PRs; docs-only PRs fast-tracked per the contribution norms in [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) |
| `security@roycss.dev` | Vulnerability reports only | [`docs/SECURITY-SLA.md`](SECURITY-SLA.md) (24-hour acknowledgement) |
| Enterprise support channel (§5) | Contracted support | §5 targets |

Public issues are the default. Anything that would disclose a vulnerability,
a security-relevant internal detail, or reporter-identifying information may
be moved to a private advisory — but the public thread is closed with a
pointer, never silently deleted.

---

## 5. Enterprise support (contracted)

For organizations with an enterprise agreement, the SLA upgrades from
"targets" to "commitments":

1. **Dedicated Slack channel.** Each enterprise agreement provisions a
   dedicated shared Slack channel (Slack Connect) between the customer's
   engineering team and the RoyCSS release area owner plus a named backup
   contact. The channel is the primary intake for that customer's P0/P1
   issues; GitHub remains the public system of record for the resulting fix.
2. **Response commitments.** The §3 table applies with the 1-hour P0 and
   4-hour P1 clocks running during the contracted coverage window (default:
   the maintainer's published business hours; extended coverage is scoped in
   the agreement itself).
3. **Named contacts.** The agreement names the responsible area owners from
   [`MAINTAINERS.md`](../MAINTAINERS.md) (role titles, not just a mailbox),
   with an escalation path (§6).
4. **Quarterly architecture review** (§7) with the customer's technical
   stakeholders, covering the roadmap items that affect their surfaces.
5. **Advance notice** of breaking changes per [`docs/LTS.md`](LTS.md) §5 —
   announced one minor ahead, with codemods — and of the LTS end-of-support
   dates that bound their migration planning.

Enterprise agreements may not buy a different severity definition or a
different security disclosure process; those are project-wide policies.

---

## 6. Escalation

When a target is missed or the primary contact is unavailable:

1. First escalation: the issue (or Slack thread) is flagged **`sla-at-risk`**
   by anyone — maintainer, contributor, or customer. Flagging is blameless.
2. The area owner from [`MAINTAINERS.md`](../MAINTAINERS.md) replies with a
   revised target and the reason. This reply is the SLA's escape valve: a
   renegotiated date posted publicly is compliance; silence is not.
3. Second escalation (missed revised target, or no owner response within the
   original window): the release area owner takes ownership of the issue
   regardless of area.
4. In the current single-maintainer structure, steps 2 and 3 collapse into
   one person — the policy still requires the *posted* revised target, so
   the record exists and the quarterly review (§7) can count it.

---

## 7. Quarterly architecture review

Once per quarter, the maintainers hold an architecture review, whose outputs
are published (notes appended to this document's review log, and items
converted into `docs/PENDING-FEATURES.md` entries or RFCs as appropriate).

Standing agenda:

1. **SLA performance** — count of P0/P1/P2 by severity, actual first-response
   times, missed targets and their posted revised dates.
2. **LTS commitments on track** — open backports, end-of-support dates
   approaching, migration-guide readiness ([`docs/LTS.md`](LTS.md) §7).
3. **Architecture drift** — does the code still match the layering and
   versioning contracts in [`docs/SEMVER.md`](SEMVER.md) and the effect
   catalog invariants? The catalog size and category count are pinned by
   tests ([`tests/unit/effects.test.ts`](../tests/unit/effects.test.ts)),
   which makes this check mechanical.
4. **Capacity and bus factor** — the recruitment plan in
   [`MAINTAINERS.md`](../MAINTAINERS.md) reviewed against actual review
   latency and issue load.
5. **Risk register** — top risks to supportability (single points of failure
   in infra, deploy paths, signing, etc.), each with an owner and next step.

The review's minutes record decisions and owners. Minutes never include
customer-confidential details from enterprise channels — those stay in the
agreement.

---

## 8. What this SLA does not cover

- **Feature requests.** They are triaged into
  [`docs/PENDING-FEATURES.md`](PENDING-FEATURES.md) and scheduled by
  priority, not by SLA.
- **Unsupported lines.** Defects reproducible only on an EOL'd major (see
  [`docs/LTS.md`](LTS.md) §6) are closed with a pointer to the migration
  path.
- **Custom modifications.** Forks, locally modified CSS, or consumer code
  that overrides `--roycss-*` token values in ways the effect documents as
  structural.
- **Security timelines.** Always [`docs/SECURITY-SLA.md`](SECURITY-SLA.md) —
  never this document.
- **Uptime of third-party hosts.** Deployment status of the live site is
  tracked separately in the repository and in issue #75; this SLA covers
  response to defects, not hosting SLAs.

---

## 9. Measuring the SLA

- First-response time is measured from the issue's creation timestamp (or
  the enterprise Slack message timestamp) to the maintainer's substantive
  reply.
- Numbers are reported in the quarterly review without smoothing. A missed
  target with a posted revised date is reported as "missed, renegotiated";
  a missed target with silence is reported as "missed, unmanaged" and is the
  first item on the next review's agenda.
- The point of measuring is to keep the SLA honest while the team is small,
  and to have baseline data the day a second maintainer joins.

---

## 10. Change history for this policy

| Revision | Change |
|---|---|
| Initial | Policy established with the governance documentation set (PF-005). |
