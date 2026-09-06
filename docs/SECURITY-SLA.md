# RoyCSS Security SLA

- **Owner:** security area (see [`MAINTAINERS.md`](../MAINTAINERS.md))
- **Applies to:** every artifact shipped from this repository — the `roycss`
  npm package (`dist/`), the Next.js platform frontend, the Express + Prisma
  `backend-node` API, the Go backend port, the CLI, the MCP server, the VS
  Code extension, and the Roy Live realtime service
- **Related:** [`security/SECURITY-POLICY.md`](../security/SECURITY-POLICY.md)
  (operational policy, severity catalog, measures already in place) ·
  [`security/CSP.md`](../security/CSP.md) ·
  [`security/DEPENDENCY-AUDIT.md`](../security/DEPENDENCY-AUDIT.md) ·
  [`security/SBOM.json`](../security/SBOM.json) ·
  [`docs/LTS.md`](LTS.md) (backports) ·
  [`docs/SLA.md`](SLA.md) (non-security defects)

---

## 1. The one-paragraph version

Report vulnerabilities privately to **security@roycss.dev** (optionally
PGP-encrypted — key policy in §4). We acknowledge within 24 hours, assess
within 72 hours, and **ship a fix for Critical vulnerabilities within 72
hours of confirmation**. Disclosure is coordinated — 90 days by default —
through GitHub Security Advisories, with CVEs requested from MITRE via
GitHub. Critical fixes are backported to the active LTS line per
[`docs/LTS.md`](LTS.md). We do not threaten researchers; the safe-harbor
terms are in §6.

---

## 2. Reporting channel policy

### 2.1 The canonical mailbox: `security@roycss.dev`

`security@roycss.dev` is the **canonical intake address** for vulnerability
reports against anything shipped from this repository. Policy:

1. **Private by default.** Anything emailed to this address is treated as
   confidential until the coordinated disclosure date. Reports are never
   discussed in public GitHub issues.
2. **What to include.** A description, reproduction steps or proof of
   concept, the affected component (npm package, site, backend, CLI, MCP
   server, extension, realtime service), the affected version or commit SHA,
   and the reporter's severity assessment. Suggested fixes are welcome but
   optional.
3. **Where the report goes.** The mailbox is monitored by the security area
   owner (see [`MAINTAINERS.md`](../MAINTAINERS.md)). In the current
   single-maintainer structure that is the project maintainer directly; the
   policy is written so additional responders can be added by appending them
   to the mailbox, with no other change to this document.
4. **Email is the system of record.** The acknowledgment (§3) assigns a
   tracking ID; subsequent coordination, patches for review, and the
   disclosure date negotiation all reference that ID.
5. **Public channels are not intake.** Vulnerabilities posted as public
   GitHub issues are triaged immediately for removal, and the reporter is
   contacted with an apology and the private channel — not with blame.
   Moderation of the public post is the least-bad option once confidentiality
   is broken; the burden is on the project to be reachable, not on the
   researcher to guess the process.
6. **Canonical-address rule.** Documents in this repository that reference
   other or legacy security addresses are updated to point here as they are
   revised; where they disagree, this document governs for the RoyCSS
   repository and its published artifacts.

### 2.2 Secondary intake: GitHub Security Advisories

Researchers may alternatively (or additionally) open a **private security
advisory** directly on the repository at
<https://github.com/Roy-Wanyoike/Roycss/security/advisories/new>. The
advisory draft gives the maintainer a private fork to collaborate on a fix.
Advisories opened this way follow the identical SLA clocks in §3 — the
channel changes, the contract does not.

---

## 3. The SLA

| Stage | Critical | High | Medium | Low |
|---|---|---|---|---|
| **Acknowledgement** | 24 hours | 24 hours | 48 hours | 72 hours |
| **Initial assessment** (confirmed / not a vuln, severity assigned) | 72 hours | 72 hours | 7 days | 14 days |
| **Fix shipped** (or documented mitigation for LTS-only lines) | **72 hours** | 14 days | 30 days | Next minor release |
| **Backport to LTS line** | With the fix, same 72-hour clock | 14 days | 30 days | Best effort |
| **Public disclosure** | Coordinated, 90 days default (§5) | Coordinated, 90 days default | Coordinated | At the project's discretion |

Notes on the two clocks that matter most:

- **The 72-hour critical-fix SLA runs from confirmation** (the point the
  report is assessed as a genuine Critical vulnerability), not from the
  initial email. Shipping within 72 hours of *email receipt* would be a
  random promise; shipping within 72 hours of *confirmed severity* is an
  engineering commitment: it means the fix (or a viable mitigation — rollback
  of an artifact, disabling a broken route, a header change) is merged,
  released, and announced.
- **A mitigation satisfies the clock only if it is announced.** A fix that
  ships silently does not protect users; the release + advisory process in
  §5 is part of the SLA, not a follow-up.

Severity categories (RCE, auth bypass, mass PII leak, supply-chain compromise
= Critical; XSS/CSRF/injection with limited impact = High; DoS and
non-PII info disclosure = Medium; hardening improvements = Low) follow the
catalog in [`security/SECURITY-POLICY.md`](../security/SECURITY-POLICY.md)
§3.1 — that document remains the definitions reference; this document is the
binding timeline.

---

## 4. PGP key policy

1. **A project PGP key is published and linked before the first security
   release that requires encrypted coordination.** Until a key is published,
   the mailbox accepts unencrypted reports (this is deliberate: a reporter
   who cannot find a trustworthy key should never be blocked from reporting).
2. **Where the key lives.** The public key (and its full fingerprint) is
   published in this document, in the repository's security documentation,
   and on the project's security page — the same fingerprint in every
   location, so reporters can cross-check.
3. **Key hygiene.** The signing key is dedicated to security coordination
   (not the maintainer's general-purpose identity key). Rotation happens on
   compromise or keyholder change; rotation is announced in a signed message
   from the old key where possible, and the old key is revoked, not silently
   replaced.
4. **Fingerprint discipline.** The fingerprint — never a bare key ID — is
   what documents reference. Short key IDs are considered spoofable and are
   not used in policy documents.
5. **Out-of-band verification.** Researchers who want to verify the key
   before encrypting can ask for fingerprint confirmation in a GitHub
   Security Advisory thread (§2.2) — the advisory provides a second,
   GitHub-authenticated channel for exactly this kind of check.
6. **Signing artifacts.** Package authenticity is handled separately and
   already: npm releases carry Sigstore provenance, and the SBOM is generated
   on every release (see [`security/SECURITY-POLICY.md`](../security/SECURITY-POLICY.md)
   §6.2). PGP here is for *communication*, not package signing.

---

## 5. GitHub Security Advisories process

For every accepted vulnerability, the fix is coordinated and published
through GitHub Security Advisories:

1. **Open (or accept) a private advisory.** The advisory becomes the private
   workspace: draft description, affected versions, patched versions, and a
   private fork where the fix is developed without exposing exploit details.
2. **Develop the fix in the private fork.** The fix lands first in the
   advisory's private fork, then is merged to `main` (and cherry-picked to
   the LTS line for Critical/High, per [`docs/LTS.md`](LTS.md) §4) as part
   of the release.
3. **Request a CVE.** The advisory is used to request a CVE identifier from
   MITRE through GitHub's CNA process for any High/Critical vulnerability.
   The CVE is reserved before publication so the release and the advisory go
   public together.
4. **Publish.** On the coordinated date, in one window: the patched release
   is published, the advisory is published (with credit to the reporter
   unless they prefer anonymity), the npm advisory is updated, and the
   changelog entry for the release cross-links the advisory.
5. **Post-incident review.** Critical vulnerabilities get a published
   postmortem within 30 days of the fix: root cause, fix, and process
   improvements, with sensitive details redacted.

---

## 6. Safe disclosure & safe harbor

RoyCSS follows **coordinated disclosure** with a **90-day default window**
(the Google Project Zero convention):

- The disclosure clock starts at the report's acknowledgement date.
- The project may ask for a short extension if a fix is in flight; the
   reporter may refuse. A publicly exploited vulnerability, or one already
   disclosed by a third party, is published immediately with whatever
   mitigation guidance exists.
- Fix-then-30-days: once a fix is shipped and the advisory published, the
   details are public from that moment.

**Safe harbor.** The project will not pursue legal action, and will advocate
on the researcher's behalf with any affected party, for researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction,
  and degradation of services;
- Interact only with accounts they own or have explicit permission to test;
- Do not exfiltrate data, and do not demonstrate more of the vulnerability
  than is necessary to establish the issue;
- Give the project the coordinated window described above before public
  disclosure.

Testing against shared production infrastructure in ways that affect other
users is outside safe harbor — use a local clone; everything needed to
reproduce RoyCSS locally is in this repository ([`docs/CONTRIBUTING.md`](CONTRIBUTING.md)).

---

## 7. Supply-chain commitments (already enforced, checked every release)

These are listed in the SLA because they are the *pre-commitments* that make
the 72-hour critical clock survivable — the attack surface is small and
scanned before anything ships:

- The npm package and Tier-A artifacts ship with **zero runtime
  dependencies** and **Sigstore provenance** (release configuration:
  `scripts/release/release.config.ts`).
- A **CSS exfiltration scan** (`security/css-exfiltration-check.ts`) and an
  **XSS scan** (`security/xss-scan.ts`) run as CI gates — external `url()`
  in shipped CSS or unsanitized `dangerouslySetInnerHTML` fails the build
  before it can become a vulnerability class.
- **SBOM** (SPDX, `security/SBOM.json`) is generated per release; dependency
  advisories are audited per [`security/DEPENDENCY-AUDIT.md`](../security/DEPENDENCY-AUDIT.md).
- The **backend requires signed JWTs on every mutating route** and validates
  its environment at boot (see [`API.md`](../API.md) and
  [`backend-node/.env.example`](../backend-node/.env.example)) — no silent
  fallback to insecure defaults.
- The published CSP is static-safe and identical for prerendered and dynamic
  pages (details and history: [`security/CSP.md`](../security/CSP.md)).

A dependency vulnerability follows the upstream fix timeline where one
exists; where it does not, the project applies an override or documents the
accepted risk in the dependency audit, within the same severity clocks.

---

## 8. Postmortem and policy review

- Every Critical incident gets the §5 postmortem. Postmortems are blameless
  toward people and merciless toward process.
- This SLA is reviewed on the quarterly governance cadence
  ([`docs/GOVERNANCE.md`](GOVERNANCE.md)) and after any postmortem that
  exposes a timeline the policy could not meet. Changes to the clocks in §3
  require an RFC ([`docs/RFC-PROCESS.md`](RFC-PROCESS.md)) — an SLA that
  drifts silently is worse than one that is renegotiated publicly.

---

## 9. Change history for this policy

| Revision | Change |
|---|---|
| Initial | Policy established with the governance documentation set (PF-005). |
