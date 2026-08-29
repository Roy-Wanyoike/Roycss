# LABS-30 — One Million Users

**Status:** Strategic review
**Author:** RoyCSS Core Team
**Premise:** RoyCSS has reached one million users. We re-audit every design decision against six questions and propose architectural changes for each.

---

## 0. The six questions

At one million users, every decision that was made for a hundred users is now wrong, or right by accident. We ask:

1. Would this still scale?
2. Would enterprises adopt this?
3. Would universities teach this?
4. Would AI understand this?
5. Would beginners learn this?
6. Would experienced developers enjoy it?

For each question, we identify the architectural changes required to make the answer "yes" without hedging. The changes are organized under ten cross-cutting concerns: API stability, backward compatibility, governance, contribution model, documentation at scale, community management, performance at scale, security, internationalization, and accessibility at scale.

---

## 1. Would this still scale?

At one million users, "scale" means four things: the codebase scales (a maintainer can still ship a release), the runtime scales (a page with 50 effects does not jank), the documentation scales (a reader can find what they need in 30 seconds), and the community scales (the issue tracker is not a swamp).

### 1.1 Codebase scale

The current RoyCSS ships 700 effects in 15 batch files. At one million users, the batch-file approach collapses. Batches were a build-time convenience; at scale they are a merge-conflict factory. Every contributor touches a batch file; every PR conflicts with every other PR.

**Architectural change:** Move from batch files to **one file per effect**, with a build step that aggregates them into the published `roycss.css`. Each effect lives at `src/effects/<category>/<id>.css` with a sibling `<id>.meta.json` describing its name, description, tags, and a11y properties. The build reads the directory tree, validates each effect, and emits the catalog. Contributing an effect becomes adding a file in the right folder; the build picks it up. Conflicts become near-impossible because no two contributors edit the same file.

### 1.2 Runtime scale

A page that imports 50 RoyCSS effects today imports 50 sets of keyframes, 50 scoped style blocks, and (in the current implementation) injects 50 `<style>` tags into `<head>`. At one million users, this pattern appears on real product pages, and the performance tax is real.

**Architectural change:** Ship a single, deduplicated, tree-shaken CSS bundle. Effects that share keyframes (`fade-up`, `fade-down`, `fade-left`, `fade-right` all share `@keyframes roycss-fade`) emit one `@keyframes` rule, not four. The build performs this deduplication. The published bundle is small enough that importing the whole library is cheaper than importing a subset. Documentation recommends importing the whole library once, at the app root, rather than per-route.

### 1.3 Documentation scale

At one million users, the docs receive a million visits a month. The current single-page catalog does not survive that load: it is a giant React app that re-renders on every filter change.

**Architectural change:** Pre-render the catalog at build time. Each effect gets its own static page (`/effects/<id>`) with the preview, the code, and the metadata. The catalog index is a static page with client-side search over a JSON index. The docs site becomes a static site (Astro, Eleventy, or Next.js with `output: export`) served from a CDN. No server runtime. No database. The search index is rebuilt on every release and shipped as a static asset.

### 1.4 Community scale

At one million users, the GitHub issue tracker receives 50–200 issues a day. Most are duplicates, support requests, or "how do I" questions that belong in Discord.

**Architectural change:** Separate concerns. GitHub issues are for **bugs and RFCs only**, with templates that reject anything else. Discord is for support, with a bot that surfaces answered questions into a searchable FAQ. Discussions are for feature requests, with a voting system that surfaces the top 20 to the maintainers. The contribution guide makes the routing explicit: "Bug → Issue. Question → Discord. Idea → Discussion."

---

## 2. Would enterprises adopt this?

Enterprises adopt a library when it clears four bars: legal, security, support, and stability. RoyCSS today clears none of them formally.

### 2.1 Legal

The license is not stated on the published artifact. The repo has a LICENSE file, but the npm package, the CDN bundle, and the copied CSS do not carry a license header.

**Architectural change:** Every published artifact carries a license header. The npm package's `package.json` declares `"license": "MIT"`. The `roycss.css` file has a header comment with the license, the version, and a link to the source. The docs site has a dedicated `/license` page reviewed by counsel. Enterprises will not adopt a library whose license they cannot verify in 30 seconds.

### 2.2 Security

CSS libraries are low-risk for security, but not zero-risk. A library that injects `<style>` tags at runtime, ships JavaScript, or accepts user input in any form is a supply-chain surface.

**Architectural change:** RoyCSS publishes a **SOC 2-style self-attestation** and a **Software Bill of Materials (SBOM)** with every release. The runtime is zero-JS (per LABS-28). The docs site has no third-party trackers. The build is reproducible from source, with a published build hash. A security policy (`SECURITY.md`) defines the disclosure process and the SLA for critical fixes (72 hours for critical, 7 days for high). The npm package is signed.

### 2.3 Support

Enterprises need a name to call when something breaks. The current library has no support channel beyond GitHub.

**Architectural change:** Offer a **tiered support model**. Free support via GitHub issues and Discord, with best-effort response. Paid support via a sponsor tier, with named-response SLAs. For enterprises that need a contract, a separate legal entity (or a fiscal sponsor like the Open Collective or the Software Freedom Conservancy) offers an MSA. The support page is honest about what free support can and cannot guarantee.

### 2.4 Stability

Enterprises need a guarantee that the API they build on today will not break next quarter. The current library has no LTS policy, no deprecation timeline, and no semver discipline.

**Architectural change:** Adopt a **published LTS policy**. One major version is designated LTS at all times, supported with security and bug fixes for 18 months after its successor ships. Minor versions within an LTS receive patch backports for critical issues. Deprecations are announced one minor release ahead, with a codemod, and removed only in a major release. The semver contract is documented in `SEMVER.md` with examples of what counts as breaking (a renamed CSS class, a removed effect, a changed token default) and what does not (a new effect, a new token, an internal refactor).

---

## 3. Would universities teach this?

A university adopts a library when it has a stable curriculum surface, honest documentation, and a conceptual model that maps to the course's learning outcomes.

### 3.1 Curriculum surface

The current library's conceptual surface changes every release. Effects are added, categories are reshuffled, the component library drifts. A professor cannot build a syllabus around a moving target.

**Architectural change:** Designate a **curriculum-stable subset** — the six categories and the token system, as defined in LABS-28 — and commit to its conceptual stability across major versions. New effects are added; categories are not renamed; tokens are not removed without a deprecation cycle. The curriculum subset is documented at `/teach` with a suggested 8-week course outline, exercises, and assessment rubrics. Professors can link to versioned URLs (`/docs/2.3/teach`) that never change.

### 3.2 Honest documentation

University teaching requires that the documentation admit what it does not know. The current docs present every feature as finished and every effect as production-ready, including the seasonal and game effects that are demos.

**Architectural change:** Tag every effect with a **maturity level**: `experimental`, `stable`, `deprecated`. The catalog filter exposes the tag. The docs page for each effect lists known issues, browser support, and accessibility notes. A professor assigning an `experimental` effect knows to warn students; a student using a `stable` effect knows it will not break.

### 3.3 Conceptual model

The current library's conceptual model is implicit. Effects are organized by category, but the principles behind the categories are not stated. A student cannot answer "why is this effect in `motion` and not in `surface`?" from the docs.

**Architectural change:** Publish a **conceptual primer** that explains the six categories as answers to six design questions: "How does this element enter or exit?" (`motion`), "What surface does it sit on?" (`surface`), "What edge does it have?" (`edge`), "How is its text treated?" (`type`), "How is it interacted with?" (`input`), "What field does it sit in?" (`field`). Every effect's docs page opens with the question it answers. The library becomes teachable because the categories have reasons.

---

## 4. Would AI understand this?

At one million users, a significant fraction of usage is mediated by AI: Copilot suggesting classes, Cursor generating components, LLMs writing tutorials. A library that AI cannot reason about is a library that AI will misrepresent.

### 4.1 Machine-readable contract

The current library's API is implicit in the source code. An LLM reading the repo must infer the contract from examples.

**Architectural change:** Publish a **machine-readable manifest** at `/roycss.manifest.json`. The manifest lists every effect, its category, its custom properties, its preview type, its maturity, and a one-line description. The manifest is the single source of truth for AI tools. It is versioned with the library. LLM vendors can ingest it; Copilot can suggest classes with confidence; Cursor can generate correct usage.

### 4.2 Stable naming

AI models trained on the web will hallucinate class names that sound right but do not exist (`roycss-fadein`, `roycss-glow-border`, `roycss-card-flip`). The current library has no rule against names that invite these hallucinations.

**Architectural change:** Adopt a **naming convention** that is predictable and documented: `roycss-<category>-<verb>-<modifier>`, e.g., `roycss-motion-fade-up`, `roycss-edge-glow`, `roycss-surface-glass`. The manifest enforces the convention; the build rejects non-conforming names. AI tools can pattern-match the convention rather than memorize a list.

### 4.3 Examples in the manifest

The current library's examples are embedded in React components, which AI tools must parse to extract the usage.

**Architectural change:** Every effect's manifest entry includes a `usage` field with a canonical HTML snippet. AI tools can return the snippet verbatim. The snippet is tested in CI to ensure it renders the effect correctly.

### 4.4 Disambiguation

AI tools confuse RoyCSS with Tailwind, Bootstrap, and Animate.css because the class-name prefixes overlap or the vocabulary is similar.

**Architectural change:** The `roycss-` prefix is enforced everywhere, including in examples, in the docs, and in the manifest. The docs include a "RoyCSS vs. other libraries" page that explicitly disambiguates: "RoyCSS is not Tailwind. Tailwind is a utility CSS framework. RoyCSS is a CSS effects library that composes with Tailwind." AI tools ingest this page and stop confusing the two.

---

## 5. Would beginners learn this?

A beginner adopts a library when the first 30 minutes are rewarding and the next 30 hours are not punishing.

### 5.1 The first 30 minutes

The current Get Started guide is six steps and teaches a customizer UI that is broken (per LABS-29). A beginner who finishes it has not successfully used the library.

**Architectural change:** The Get Started guide becomes a **single-page, copy-paste, see-it-work** experience. Step one: paste this `<link>` tag. Step two: add this class to any element. Step three: refresh the page; the element animates. The guide is tested on a non-developer (a friend, a parent) before every release. If they cannot finish in five minutes, the guide is rewritten.

### 5.2 The next 30 hours

A beginner who has the first effect working immediately hits a wall: "how do I customize this?" The current answer is the customizer UI, which is broken. The next answer is "edit the CSS custom properties," which is correct but undocumented in a beginner-friendly way.

**Architectural change:** Publish a **guided learning path** of 10 small projects, each building on the last. Project 1: animate a heading. Project 2: add a hover effect to a button. Project 3: build a card with a glass surface. Each project introduces one new concept (custom properties, keyframes, scroll-driven animations, `prefers-reduced-motion`). The path ends with the beginner building a small portfolio page using only RoyCSS effects. The path is the on-ramp from "I copied a class" to "I understand CSS effects."

### 5.3 Error messages

A beginner who mistypes a class name (`roycss-fadeup` instead of `roycss-motion-fade-up`) sees nothing. The browser silently renders the element without the effect. The beginner assumes the library is broken.

**Architectural change:** Ship a **development-mode console helper** — a small, optional JavaScript snippet that, when `process.env.NODE_ENV !== 'production'`, scans the page for `roycss-*` classes and warns in the console about classes that do not exist in the current version. The helper suggests the closest match. The helper is opt-in, never loaded in production, and clearly labeled as a dev tool.

---

## 6. Would experienced developers enjoy it?

An experienced developer adopts a library when it respects their time, their tools, and their existing stack.

### 6.1 Respecting time

The current library requires reading the source to understand what an effect does. There is no type information, no JSDoc, no IntelliSense.

**Architectural change:** Ship **TypeScript declarations** for the manifest, so editors can autocomplete class names and custom properties. Ship a **VS Code extension** (community-maintained per LABS-28, but with a blessed data file) that provides hover documentation for every `roycss-*` class. The experienced developer never leaves their editor to learn an effect.

### 6.2 Respecting tools

The current library's CSS is hand-written and not formatted by a tool. An experienced developer who runs Prettier on a RoyCSS file sees a diff.

**Architectural change:** Format every published CSS file with Prettier (or Stylelint) using a published config. The config is part of the repo. Contributors run the same formatter. The published artifact looks like the source.

### 6.3 Respecting the stack

The current library ships a React runtime (RoyMotion) that competes with the developer's existing motion library (Framer Motion, Motion One, GSAP). Per LABS-28, this is deleted. The post-cut library is CSS-only and composes with any stack.

**Architectural change (reinforcing LABS-28):** The published artifact is a single CSS file. There is no JavaScript. The docs site is the only consumer of React. An experienced developer can use RoyCSS in a Svelte app, a vanilla HTML page, a Webflow site, or a Framer prototype without a JS dependency.

### 6.4 Respecting expertise

Experienced developers want escape hatches. The current library's effects are opaque — the keyframes are scoped, the custom properties are not all documented.

**Architectural change:** Every effect's docs page lists its **full custom-property surface**, its **keyframe names**, and its **intended override points**. The docs explicitly say: "To change the duration, override `--roycss-duration` on the element. To change the easing, override `--roycss-easing`. To replace the entire keyframe, redefine `@keyframes roycss-motion-fade-up` in your stylesheet." The escape hatches are documented, not hidden.

---

## 7. The ten cross-cutting concerns

### 7.1 API stability

The API is the set of class names, custom property names, keyframe names, and token names that a user can rely on. At one million users, every one of these is a contract.

**Change:** Define a **public API surface** in `API.md`. List every class, property, keyframe, and token. Mark each as `stable`, `experimental`, or `deprecated`. The build checks that no `stable` name is removed or renamed without a major version bump. The check is a CI gate; it cannot be bypassed.

### 7.2 Backward compatibility

At one million users, breaking changes cost the community millions of hours. The current library has no mechanism to soften them.

**Change:** Every breaking change ships with a **codemod** (a `jscodeshift` or `postcss` transform) that migrates user code from the old API to the new. The codemod is tested against a corpus of real user code (collected, with permission, from public GitHub repos that use RoyCSS). The release notes link to the codemod. The deprecation warning in the dev-mode helper (per §5.3) points users to the codemod. A breaking change without a codemod is a release-blocker.

### 7.3 Governance

At one million users, "the maintainer decides" is not a governance model. It is a bus-factor of one.

**Change:** Establish a **steering committee** of 3–5 people, with a published charter, decision-making process, and conflict-resolution policy. The committee owns the roadmap, the API surface, and the LTS policy. Day-to-day maintainership is delegated to a wider group of collaborators with merge rights to specific areas (effects, docs, build, infra). The governance model is published at `/governance` and reviewed annually.

### 7.4 Contribution model

The current contribution model is "open a PR." At one million users, this produces 100 PRs a week, most of them low-quality.

**Change:** Publish a **contribution ladder** with clear rungs: Triager (issue triage), Contributor (merged PRs), Collaborator (merge rights in an area), Maintainer (merge rights across the repo), Steering Committee (governance). Each rung has documented criteria. New contributors start with a `good-first-issue` label and a mentored onboarding. The contribution guide is honest about the time commitment expected at each rung.

### 7.5 Documentation at scale

At one million users, the docs are the product. The current docs are a single React page.

**Change:** Move to a **versioned, static, searchable docs site** (per §1.3). Every page has an "Edit on GitHub" link, a "Report a problem" link, a "Last updated" timestamp, and a version selector. Docs are written in MDX, with code samples that are tested in CI. The docs have a dedicated maintainer (a person, not a side duty). The docs site has its own release cadence, decoupled from the library, so a doc fix can ship in hours.

### 7.6 Community management

At one million users, the community is a town. It needs moderation, codes of conduct, and spaces.

**Change:** Adopt a **Code of Conduct** (the Contributor Covenant is a fine default) with a named moderation team and a published enforcement process. Maintain a Discord with moderated channels, a `#help` channel with a response-time expectation, and a `#showcase` channel for community work. Run a monthly community call, recorded and published. Recognize contributors publicly in the release notes and on a `/contributors` page.

### 7.7 Performance at scale

At one million users, RoyCSS appears on pages that receive billions of views. A 10KB regression is a global problem.

**Change:** Establish a **performance budget** for the published CSS bundle (e.g., 30KB gzipped for the full library, 5KB for a single category). The build enforces the budget; a PR that exceeds it fails CI. A performance dashboard tracks bundle size, render time of a reference page, and Lighthouse score over time. Regressions are flagged automatically.

### 7.8 Security considerations

CSS libraries are low-risk, but at one million users, low-risk is not no-risk. The current library has no security policy.

**Change:** Publish `SECURITY.md` with a disclosure process, an SLA, and a contact. Sign the npm package. Publish an SBOM. Audit dependencies quarterly. The docs site loads no third-party scripts. The build is reproducible; the published hash matches the hash computed from source. A security advisory is published through GitHub's advisory database and the npm advisory system.

### 7.9 Internationalization

The current docs are English-only. At one million users, a large fraction are not native English speakers.

**Change:** Internationalize the docs with a **crowdsourced translation model**. The docs are written in English (the source of truth) and translated via a platform (Crowdin, Weblate) that supports community contributions. Translations are versioned with the docs. The catalog UI is fully internationalized — every visible string in the docs site is in a message catalog, not hardcoded. Effects themselves are language-neutral (CSS), but the docs and the UI are translated. The library ships with right-to-left support: every effect's CSS uses logical properties (`margin-inline-start`, not `margin-left`), so an RTL layout works without overrides.

### 7.10 Accessibility at scale

At one million users, RoyCSS appears on pages used by people with disabilities. The current library has no a11y story.

**Change:** Adopt a **WCAG 2.2 AA commitment**. Every effect is audited. Effects that cannot meet the bar are marked `experimental` and documented as such. The library respects `prefers-reduced-motion` globally: a single media query disables all non-essential animation. Effects that animate text content (which can cause vestibular issues) are tagged, and the docs warn against using them for body copy. Color-contrast is enforced at the token level: the OKLCH palette is tested for AA contrast at every weight combination. The docs site itself is audited annually and the audit is published.

---

## 8. The roadmap to "yes" on all six

The six questions are not independent. Answering "would enterprises adopt this?" requires answering "would this still scale?" first. Answering "would AI understand this?" requires a stable API, which is the same thing enterprises need. The roadmap is therefore a sequence, not a list.

1. **Stabilize the API** (LABS-28's cut, plus the public-API surface and the manifest). Without this, nothing else holds.
2. **Ship the infrastructure**: versioned docs, SBOM, signed packages, performance budget, CI gates on the API surface.
3. **Open governance**: steering committee, contribution ladder, Code of Conduct.
4. **Scale the community**: Discord moderation, monthly calls, translation platform.
5. **Teach**: curriculum subset, learning path, conceptual primer.
6. **Measure**: usage analytics (privacy-respecting, opt-in), performance dashboard, contributor health metrics.

Each phase takes a quarter. At the end of 18 months, RoyCSS can answer "yes" to all six questions without hedging.

---

## 9. The risks of one million users

Growth brings three risks that are not present at a hundred users.

**Risk: Feature pressure.** A million users want a million features. The team must say no 999,000 times. The governance model (§7.3) is the mechanism for saying no without burning out.

**Risk: Fragmentation.** A million users fork the library to add their own effect. The plugin API (per LABS-35) is the mechanism for adding without forking.

**Risk: Maintainer burnout.** A million users generate a million small demands. The contribution ladder (§7.4) and the support tiers (§2.3) are the mechanisms for distributing the load. The team must be honest that a library of this size cannot be maintained by one person in their spare time.

---

## 10. Closing

One million users is not a victory. It is a contract. The library that earned those users by being small and sharp must stay small and sharp to keep them. The architectural changes in this document are not additions; they are the discipline required to remain what RoyCSS became. The API stabilizes so the library can be trusted. The governance opens so the library can outlive any one maintainer. The docs scale so the library can be found. The community structures so the library can be helped. The accessibility and i18n commitments so the library can be used by everyone.

The next million users will come if RoyCSS remains the kind of library the first million signed up for: small, sharp, honest, and stable. Every decision in this document serves that.
