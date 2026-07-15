# LABS-35 — Ten-Year Architecture

**Status:** Architecture proposal
**Author:** RoyCSS Core Team
**Horizon:** 10 years (2025–2035)
**Goal:** Design RoyCSS so it can evolve for a decade without a major rewrite. Prioritize long-term maintainability over short-term features.

---

## 0. The premise

A CSS library that lasts ten years is not a library that predicts the future. It is a library that is *shaped to be reshaped*. The web platform will gain features we cannot foresee; design trends will change; tooling will be replaced; the maintainers will turn over. The architecture's job is to make those changes cheap, not to prevent them.

This document defines the architecture in twelve sections: core architecture, public API, plugin API, extension points, versioning, testing, documentation, governance, release cadence, migration tooling, community contribution, and the prioritization principle that governs them all. Each section answers one question: *what will still be true in 2035?*

---

## 1. Core architecture — what's stable, what's mutable

### 1.1 The stable core

The stable core is the smallest set of decisions that, if changed, would force every user to rewrite their code. These are guaranteed for the ten-year horizon.

- **The artifact is a CSS file.** RoyCSS ships as `roycss.css` (and category modules). The library is consumed by adding a stylesheet, not by installing a JavaScript package. This is stable because it is the lowest common denominator of the web: a stylesheet works in every framework, every build tool, every runtime, forever.
- **The class-name prefix is `roycss-`.** Every public class begins with `roycss-`. The prefix is the namespace. It will not change. It prevents collisions with other libraries and with user code.
- **The token prefix is `--roycss-`.** Every public CSS custom property begins with `--roycss-`. The prefix is the contract.
- **The category set is six.** `motion`, `surface`, `edge`, `type`, `input`, `field`. These are stable for the horizon. New categories are not added; an effect that does not fit is re-filed or rejected. (See §4 for how to extend without adding categories.)
- **Effects are CSS-only.** An effect is a CSS class plus its keyframes plus its custom-property surface. No effect requires JavaScript to function. Effects that require JavaScript (e.g., a magnetic cursor effect) are *recipes* in the docs, not library effects.
- **Effects are self-contained.** An effect's CSS does not depend on another effect's CSS. Each effect can be copied alone into a project and works. This is the property that makes the library copy-paste friendly, and it is stable.

### 1.2 The mutable periphery

Everything else is mutable: the specific effects in each category, the token values, the keyframe definitions, the build tooling, the docs platform, the test framework, the governance structure, the maintainer roster. These are expected to change. The architecture makes changing them safe by isolating them behind stable interfaces (the public API in §2).

### 1.3 The layering

RoyCSS is layered, top to bottom:

1. **Public API** (classes, custom properties, keyframe names) — stable, versioned, contracted.
2. **Effect implementations** (the actual CSS for each effect) — mutable, versioned, replaceable.
3. **Token system** (the `--roycss-*` defaults) — stable in shape, mutable in values.
4. **Build** (the toolchain that produces `roycss.css` from source) — entirely mutable, never seen by users.
5. **Docs site** — entirely mutable, decoupled from the library's release cadence (see §9).

A change in layer 4 (e.g., switching from PostCSS to Lightning CSS) must not change layer 1. A change in layer 2 (e.g., rewriting the `fade-up` keyframes) must not change layer 1 unless it's a major version. This layering is the architectural invariant that enables ten years of evolution.

---

## 2. Public API — what's guaranteed, what's experimental

### 2.1 The public API contract

The public API is the set of names a user may rely on. It is documented in `API.md` and enforced by CI. It consists of:

- **Class names:** every `roycss-*` class that appears in a stable release.
- **Custom property names:** every `--roycss-*` property that an effect reads.
- **Keyframe names:** every `@keyframes roycss-*` rule that an effect defines.
- **Token names:** every token in `:root` that the library sets.
- **The manifest schema:** the shape of `roycss.manifest.json`.

Each entry in `API.md` carries a stability label:

- `stable` — guaranteed for the current major version. Removal or rename requires a major bump and a codemod.
- `experimental` — may change in any minor. Documented as such in the manifest and the catalog.
- `deprecated` — will be removed in the next major. Documented with a replacement and a codemod.

### 2.2 What is guaranteed

- The class `roycss-motion-fade-up` will exist in major version 2. Its keyframe name will be `roycss-motion-fade-up`. Its custom properties will include `--roycss-duration` and `--roycss-easing`. These are guaranteed.
- The token `--roycss-accent` will exist. Its default value may change between minors (with a release note); its name will not.
- The category `motion` will exist. Its definition may evolve (new effects added), but the name is stable.

### 2.3 What is experimental

- Any effect added in the current minor is `experimental` for one minor, then promoted to `stable` if it survives. This gives the team a window to fix the API before committing to it.
- Any effect that uses a CSS feature with less than two stable browser versions of support (e.g., anchor positioning today) is `experimental` until the support bar is met.
- The plugin API itself (§3) is `experimental` for v2.0–v2.3, promoted to `stable` in v2.4 once the team has used it internally for a year.

### 2.4 The CI gate

The public API is enforced by a CI job that diffs `API.md` against the previous release. A PR that removes or renames a `stable` entry without bumping the major version fails CI. A PR that adds an `experimental` entry without marking it as such fails CI. The gate cannot be bypassed without a steering-committee override, which is recorded in the release notes.

---

## 3. Plugin API — how third parties extend RoyCSS

### 3.1 Why a plugin API

RoyCSS will receive requests for effects the team cannot or will not maintain: branded effects, framework-specific compositions, niche animations. Without a plugin API, these requests fork the library. With a plugin API, they extend it.

### 3.2 The plugin contract

A RoyCSS plugin is a package that exports a single function:

```ts
type RoyCSSPlugin = {
  name: string;
  effects: RoyCSSEffect[];
  tokens?: Record<string, string>;
  keyframes?: Record<string, string>;
};
```

A plugin's `effects` are objects with the same shape as the library's own effects: `{ id, category, name, description, css, customProperties, previewType, maturity }`. The plugin's `id` must be prefixed with the plugin's name (e.g., `acme-glow-pulse`) to avoid collisions with the core library.

The build (or the docs site) loads plugins via a `plugins` field in `roycss.config.json`. Plugins are loaded at build time, never at runtime. The published `roycss.css` includes the plugin's effects, namespaced under the plugin's prefix.

### 3.3 What plugins cannot do

- Plugins cannot override core effects. A plugin that ships `roycss-motion-fade-up` is rejected by the build.
- Plugins cannot add categories. An effect from a plugin must fit one of the six core categories, or it is rejected.
- Plugins cannot ship JavaScript. The plugin contract is CSS-only, matching the core library's contract.
- Plugins cannot depend on other plugins. Each plugin is self-contained.

These constraints keep the plugin surface small and predictable. They also keep the build simple: plugins are aggregated, not orchestrated.

### 3.4 Plugin discovery

Plugins are npm packages named `roycss-plugin-*`. The docs site maintains a curated list at `/plugins`, with each entry showing the plugin's effects, its license, its maintainer, and a link to its source. The curation is editorial: a plugin is listed when a maintainer has reviewed it for the contract above. Plugins that violate the contract are delisted.

---

## 4. Extension points — where the framework is designed to grow

Extension points are the seams where RoyCSS expects to be extended without changing the core. They are designed in advance, not retrofitted.

### 4.1 Tokens

The token system is an extension point. A user (or a plugin) can override any `--roycss-*` token at any scope: globally in `:root`, per-category in `.roycss-motion`, per-effect in `.roycss-motion-fade-up`, or per-instance in an inline `style` attribute. The token system is the primary theming surface and is designed to be the only theming surface.

### 4.2 Keyframes

Every effect's keyframes are named `roycss-<effect-id>`. A user can redefine a keyframe in their own stylesheet to alter an effect's motion without forking the effect's CSS. This is documented as the supported way to "change the bounce of a fade-up."

### 4.3 Custom properties per effect

Every effect documents its full custom-property surface. A user can override any of them. The docs explicitly mark which properties are "tunable" (safe to override) and which are "structural" (overriding may break the effect). This distinction is part of the effect's metadata and is enforced by the build.

### 4.4 The manifest

The manifest is an extension point for tooling. AI tools, editor extensions, and design tools consume the manifest to learn the library. The manifest schema is versioned (it's part of the public API), and tools can rely on its shape across minor versions.

### 4.5 The build pipeline

The build is exposed as a library (`@roycss/build`) so that downstream tools — a CLI, a bundler plugin, a design-tool integration — can use the same build the core team uses. The build's input is the source directory; its output is the published CSS, the manifest, and the API doc. Third-party tools that wrap the build are explicitly supported.

### 4.6 What is not an extension point

- The class-name prefix is not extensible. `roycss-` is the only prefix.
- The category set is not extensible. Six is the final count.
- The runtime contract (CSS-only) is not extensible. Effects that need JS are recipes, not effects.

Closing these extension points is itself an architectural decision. It keeps the surface that *is* extensible small, predictable, and well-documented.

---

## 5. Versioning — SemVer strategy, LTS releases, deprecation timeline

### 5.1 SemVer

RoyCSS follows SemVer strictly. The contract:

- **Major (X.0.0):** a `stable` API entry is removed or renamed; a token's default changes in a way that breaks an unmodified effect; a category is renamed. Majors are rare and ship with codemods for every breaking change.
- **Minor (X.Y.0):** new effects, new tokens, new keyframes, new plugin-API capabilities, promotions from `experimental` to `stable`. Minors never break a `stable` API entry.
- **Patch (X.Y.Z):** bug fixes, accessibility fixes, performance fixes, documentation fixes. Patches change no API entry and no token default.

### 5.2 LTS

One major version is designated LTS at all times. The previous major becomes LTS when the new major ships, and is supported for 18 months. Support means: security patches, critical bug fixes, and backports of effects that do not depend on new APIs. LTS does not mean new features.

An enterprise on LTS can plan a 12-month migration window with confidence. The LTS policy is published at `/lts` and reviewed annually.

### 5.3 Deprecation timeline

A `stable` API entry that will be removed:

1. Is marked `deprecated` in the next minor (X.Y+1.0), with a replacement and a codemod.
2. Emits a console warning in the dev-mode helper (per LABS-30 §5.3) when used.
3. Is removed in the next major (X+1.0.0).

The minimum window between deprecation and removal is **one minor release**, which (at the cadence in §9) is one month. For high-impact removals (e.g., a popular effect), the team may extend the window to two majors (12+ months) at its discretion, documented in the release notes.

### 5.4 Pre-release

Pre-releases (`2.0.0-alpha.1`, `2.0.0-beta.1`, `2.0.0-rc.1`) are published for every major. Alphas are internal; betas are public for feedback; RCs are feature-complete and become the major if no critical issues are found in two weeks.

---

## 6. Testing strategy — visual regression, cross-browser, a11y, performance

### 6.1 Visual regression

Every effect has a reference screenshot, captured at a fixed viewport, on a fixed canvas, in light and dark mode. A PR that changes an effect's rendering produces a diff. The diff is reviewed by a human; a maintainer approves the new reference if the change is intentional.

The visual regression suite runs in CI on every PR. It uses Playwright with a headless Chromium. The suite is fast (under 5 minutes) because each effect is a single page with no JavaScript.

### 6.2 Cross-browser

RoyCSS is tested in the last two stable versions of Chrome, Firefox, Safari, and Edge. The test matrix runs nightly. An effect that fails in a browser is marked with a `known-issue` tag in the manifest and the catalog. Effects that depend on bleeding-edge CSS ship with an `@supports` fallback; the fallback is tested in a browser that does not support the feature.

Mobile Safari is a first-class target. An effect that works in desktop Safari but janks on iOS is treated as broken.

### 6.3 Accessibility

Every effect is audited against a checklist:

- Respects `prefers-reduced-motion` (essential animation disabled or dampened).
- Does not animate text content in a way that triggers vestibular issues (no full-screen parallax on body copy).
- Maintains WCAG 2.2 AA contrast for any text overlaid on the effect.
- Is keyboard-accessible (any effect used on a focusable element preserves focus visibility).
- Does not rely solely on color to convey state.

The checklist is encoded in the effect's metadata and enforced by a CI lint. An effect that fails a check is `experimental` until fixed or removed.

### 6.4 Performance

Every effect is benchmarked. The benchmark measures:

- Render time of the effect in isolation (must be under 16ms on a mid-range laptop).
- Render time of the effect in a grid of 50 (must be under 50ms).
- Layout shifts caused by the effect (must be zero CLS).
- Compositing cost (must not promote more than two layers).

Benchmarks run on every PR for the affected effects and nightly for the full library. A regression over 10% blocks the PR.

### 6.5 Contract tests

The public API (§2) has contract tests: a corpus of real-world usage (collected from public GitHub repos, with permission) that runs against every release. If a release breaks the corpus, the release is blocked. The corpus is the canary for backward compatibility.

---

## 7. Documentation strategy — living docs, versioned docs, community docs

### 7.1 Living docs

The docs are a living artifact. Every PR that changes the library must include a docs update, enforced by CI. A PR that adds an effect without a docs page fails. A PR that changes a token default without updating the tokens page fails. Docs are not a follow-up; they are part of the change.

### 7.2 Versioned docs

Every minor release snapshots the docs to a versioned path (`/docs/2.3/...`). The default path (`/docs/...`) always points to the latest stable. Each versioned path is immutable: a doc fix after release ships to the latest version only, unless it's a security or critical-a11y fix, which is backported to the LTS version.

The versioned docs are built statically and served from a CDN. The version selector in the header lets a reader switch versions without losing their place.

### 7.3 Community docs

Community contributions to docs are welcomed and governed. A `/community` section hosts recipes, tutorials, and case studies contributed by users. Community docs are clearly labeled as community-maintained; they are reviewed for accuracy but not for opinion. The team highlights the best community docs in the release notes.

### 7.4 Tested code samples

Every code sample in the docs is extracted into a test fixture and run in CI. A sample that does not render correctly fails the build. This is the same mechanism as the visual regression suite. Docs that lie are treated as bugs.

### 7.5 Search

The docs have a search index built at release time (Algolia DocSearch or a self-hosted Pagefind). The index covers the versioned docs and the manifest. Search results include the version of the doc they come from, so a reader on v2.3 does not get a v2.5 result without warning.

### 7.6 Editability

Every doc page has an "Edit on GitHub" link that opens the source at the right line. A reader who spots an error fixes it in one click. Community PRs to docs are fast-tracked: a docs-only PR can be merged by any collaborator, not just a maintainer.

---

## 8. Governance — RFC process, maintainer model, security policy

### 8.1 RFC process

Significant changes go through an RFC (Request for Comments). An RFC is a markdown file in `rfcs/` describing the problem, the proposed solution, the alternatives considered, and the impact on the public API. RFCs are open for comment for two weeks. Any contributor may comment. The steering committee (§8.2) decides whether to accept, reject, or revise.

What requires an RFC:

- A new category (which, per §4.6, will be rejected — but the RFC is the mechanism for the conversation).
- A change to the plugin API.
- A change to the versioning or LTS policy.
- A new extension point.
- A major-version bump.

What does not require an RFC:

- A new effect (a PR suffices).
- A bug fix.
- A docs update.
- A token-value tweak.

The threshold is intentionally high. RFCs are for changes that affect the contract.

### 8.2 Maintainer model

The maintainer model is a ladder (per LABS-30 §7.4):

- **Triager:** triages issues, labels them, closes duplicates. Appointed by a Collaborator.
- **Contributor:** has merged at least one PR. Self-appointed.
- **Collaborator:** has merged several PRs in a specific area (effects, docs, build, infra). Appointed by a Maintainer, with merge rights in their area.
- **Maintainer:** has merge rights across the repo. Appointed by the steering committee.
- **Steering Committee:** 3–5 people, elected annually by Maintainers and Collaborators. Owns the roadmap, the API surface, the LTS policy, and the security policy.

Each rung has documented criteria and a time commitment. The ladder is published at `/governance`.

### 8.3 Security policy

`SECURITY.md` defines:

- The disclosure process (private email to `security@roycss.dev`).
- The SLA (72 hours for critical, 7 days for high, 30 days for medium).
- The advisory process (GitHub Security Advisories, npm advisories, CVE assignment).
- The backport policy (critical fixes backported to the LTS version).
- The signing policy (npm packages signed; build reproducible).

The security policy is reviewed annually. A security incident triggers a post-mortem that is published (with sensitive details redacted) within 30 days.

### 8.4 Code of Conduct

The Contributor Covenant, with a named moderation team and a published enforcement process. Reports go to `conduct@roycss.dev`. The moderation team is independent of the steering committee (to avoid conflicts of interest) and reports annually on the number of incidents and their resolutions (with personally identifiable information redacted).

---

## 9. Release cadence — quarterly major, monthly minor, daily patch

### 9.1 The cadence

- **Patch:** as needed, ideally daily during active bug-fix sprints. Patches are bug fixes, a11y fixes, performance fixes, and docs fixes. They ship within 24 hours of merge for critical issues.
- **Minor:** monthly, on the first Tuesday. Minors ship new effects, new tokens, and promotions from `experimental` to `stable`. A minor is frozen one week before release; only release-blockers merge in the freeze.
- **Major:** quarterly, at most. Majors ship breaking changes with codemods. A major is preceded by a two-week RC period.

### 9.2 The reasoning

Monthly minors give the library a predictable heartbeat. Users know when to expect new effects. Quarterly majors cap the disruption of breaking changes; an enterprise can plan one migration per quarter, at most. Daily patches keep the library honest: a bug found on Monday is fixed on Tuesday.

### 9.3 Decoupled docs

The docs site has its own release cadence, decoupled from the library. A docs fix can ship in hours, without waiting for the next library release. The docs are versioned with the library for the *content* tied to a release, but the docs *site* (its layout, its search, its navigation) ships continuously.

### 9.4 The release manager

Each release has a named release manager (a Maintainer, rotating quarterly). The release manager owns the release: the changelog, the codemods, the blog post, the announcement. Rotation prevents burnout and spreads institutional knowledge.

---

## 10. Migration tooling — automated codemods, deprecation warnings

### 10.1 Codemods

Every breaking change ships with a codemod. The codemod is a `jscodeshift` transform for JS/TS code and a `postcss` plugin for CSS. The codemod is tested against the contract corpus (§6.5). The release notes link to the codemod and document its limitations.

Codemods are versioned with the release that needs them: `@roycss/codemods@2.0.0` ships the transforms for the 2.0 migration. A user runs `npx @roycss/codemods@2.0.0` to migrate.

### 10.2 Deprecation warnings

The dev-mode helper (per LABS-30 §5.3) warns when a deprecated class, token, or keyframe is used. The warning names the replacement and links to the codemod. The helper is opt-in (loaded only when `process.env.NODE_ENV !== 'production'`) and never shipped to end users.

### 10.3 The migration guide

Every major release ships with a migration guide at `/migrate/<from>-to-<to>`. The guide lists every breaking change, its replacement, the codemod command, and the manual steps the codemod cannot handle. The guide is the first thing a user reads when upgrading.

### 10.4 The compat layer

For high-impact removals, the team may ship a compatibility shim — a small CSS file that maps the old API to the new — so users can upgrade without immediately migrating their code. The shim is deprecated on arrival and removed in the next major. It is a bridge, not a destination.

---

## 11. Community contribution guidelines

### 11.1 The contribution ladder

(See §8.2 and LABS-30 §7.4.) The ladder is the backbone of community contribution. It is documented, criteria-based, and honest about the time commitment at each rung.

### 11.2 The contribution guide

`CONTRIBUTING.md` is the front door. It covers:

- How to set up the repo (one command).
- How to run the tests (one command).
- How to add an effect (one file, one metadata file, one preview fixture).
- How to update the docs (one MDX file).
- How to propose a larger change (open an RFC).
- The code of conduct and the licensing of contributions (CLA not required; contributions are licensed under the project's MIT license, with the Developer Certificate of Origin as the attestation).

### 11.3 Good first issues

The team maintains a `good-first-issue` label, with issues scoped to a single effect, a single doc page, or a single test. Each issue has a mentor assigned (a Collaborator) who reviews the first PR from the contributor who picks it up. The goal is that a new contributor's first PR merges within a week.

### 11.4 Recognition

Contributors are recognized in the release notes, on a `/contributors` page, and in an annual "year in review" post. Significant contributors (those who reach Collaborator) are invited to the monthly community call. The recognition is not performative; it is the team's honest accounting of who built the library.

### 11.5 What we do not accept

- Effects that duplicate an existing effect with one parameter changed (those are variants; use custom properties).
- Effects that require JavaScript (those are recipes; submit to `/community`).
- Effects that are decorative demos without production use (seasonal, game-themed; see LABS-28).
- Components (RoyCSS is not a component library; see LABS-28).
- Breaking changes without a codemod.

The contribution guide states these explicitly, so contributors do not waste their time.

---

## 12. Prioritize long-term maintainability over short-term features

This is the principle that governs the preceding eleven sections. When a decision trades a feature now for maintainability later, maintainability wins. When a decision trades a quick fix for a stable API, the stable API wins. When a decision trades a contributor's enthusiasm for a category the team has committed to keeping at six, the commitment wins.

The concrete rules:

- **No feature without a maintainer.** A feature ships only if a named maintainer commits to supporting it for the LTS window. Features without an owner are rejected, even if the code is correct.
- **No API addition without a removal plan.** Every new `stable` API entry ships with a documented "how we would deprecate this" note. If the team cannot describe the deprecation path, the entry is `experimental` until they can.
- **No effect without an a11y audit.** An effect ships only if it passes the a11y checklist (§6.3). Effects that cannot pass are `experimental` and labeled.
- **No dependency without a lifecycle plan.** A new build dependency (e.g., a PostCSS plugin) is added only if the team can describe how to remove it in a future release. Dependencies are a liability; the team treats them as such.
- **No release without a changelog.** A release without a changelog is not a release. The changelog is human-written, not generated, and it explains the *why* of every change.

These rules are the discipline that lets RoyCSS evolve for ten years. They will, at times, feel slow. They are supposed to. The alternative — a fast library that breaks its users every quarter — is the failure mode this architecture is designed to prevent.

---

## 13. The ten-year horizon

In 2035, the web platform will have features we cannot name. CSS will have moved on; the build tools of 2025 will be obsolete; the maintainers of today will have moved on. RoyCSS, if this architecture holds, will still be a CSS file with `roycss-` classes, six categories, a token system, a manifest, a public API, a plugin API, an LTS policy, a tested docs site, a governed community, and a release cadence that users can plan around.

The effects will be different. The tokens will have different values. The build will use tools that do not yet exist. But the contract — the layering, the stability labels, the extension points, the governance, the discipline — will be the same. That is what ten-year architecture means: not predicting the future, but shaping the library so the future can be absorbed without a rewrite.

The work of the next ten years is not to add. It is to hold the shape.

---

## 14. Closing

This document is a contract with RoyCSS's future maintainers and future users. It says: the library will stay small. The API will stay stable. The categories will stay six. The runtime will stay CSS. The governance will stay open. The docs will stay tested. The releases will stay predictable. The migrations will stay automated.

Everything else can change. The architecture is the shape that makes change safe.
