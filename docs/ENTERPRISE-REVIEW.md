# RoyCSS — Enterprise Readiness Review

**Prepared by:** Enterprise Architecture Review Board
**Subject:** RoyCSS v1.0.0 — CSS Effects Library (700+ effects, OKLCH, container queries, framework-agnostic)
**Review date:** Q1 FY26
**Classification:** Internal — Architecture Governance
**Reviewers:** Lead Frontend Architect, Security Architect, Accessibility Lead, Performance Engineering, Sourcing & Vendor Management
**Document version:** 1.0

---

## 1. Executive Summary

RoyCSS is a modern, framework-agnostic CSS effects library authored by Royford Wanyoike. At version 1.0.0 it ships 700+ production-ready visual effects (animations, hover states, loaders, transforms, glassmorphism, particles, micro-interactions), an OKLCH-native design token system, container-query-aware layout primitives, and bindings for React, Vue, Angular, Svelte, and vanilla HTML. The library adopts 2026-era CSS features wholesale: `oklch()` color, `color-mix()`, relative color syntax, `@property`, CSS Nesting, `:where()` zero-specificity selectors, and `light-dark()` automatic theme adaptation.

From an enterprise standpoint, RoyCSS presents an unusually **strong technical foundation** built on progressive-enhancement principles and modern web standards. The token architecture is clean and machine-readable (Style Dictionary compatible), the migration scripts (`migrate-colors.ts`, `migrate-logical.ts`) demonstrate operational maturity rare in v1.0 projects, and the security posture is excellent — no inline JavaScript, no `eval`, no dynamic CSS injection from untrusted input, and full compatibility with strict Content Security Policy.

However, RoyCSS is at v1.0.0 from a single primary maintainer with a small footprint, no formal Long-Term Support policy, no published security advisory channel, and an as-yet-unproven governance and RFC process. The 240 KB unminified CSS surface (estimated 55–70 KB gzip) is reasonable for the feature set but **requires disciplined tree-shaking and bundler configuration** to avoid bloating mission-critical applications. Accessibility is well-considered at the architectural level (`prefers-reduced-motion`, `prefers-contrast: high`, focus-visible rings) but is **not yet backed by an external WCAG 2.1 AA audit or VPAT**.

**Bottom line:** RoyCSS is technically superior to legacy alternatives (Animate.css, Bootstrap utilities) for effect-heavy applications and compares favorably to Tailwind for cross-framework scenarios. We recommend **ADOPT WITH CONDITIONS** for marketing sites, design systems, and internal tooling, and **pilot-only** for customer-facing regulated surfaces (healthcare, financial) pending accessibility certification and the publication of an LTS and security policy. Adoption must be paired with internal tree-shaking tooling, a self-hosted CDN, and a 90-day vendor evaluation window.

---

## 2. Scope and Methodology

This review evaluates RoyCSS v1.0.0 against thirteen dimensions established by the Enterprise Architecture Council as mandatory for any third-party CSS/UI dependency entering the approved-stack catalog. Each dimension is scored independently on a four-tier risk scale (Low / Medium / High / Critical), with prescriptive recommendations mapped to one of four time horizons: **Immediate** (≤30 days), **3 months**, **6 months**, and **12 months**.

Evidence was gathered from the published package (`package.roycss.json`), source code inspection (`src/lib/design-tokens.ts`, `src/app/roycss.css`, effect batch files), the `ARCHITECTURE.md` design intent document, the bundled CLI, and the VS Code language support artifacts. No penetration testing was performed; security posture is assessed through static analysis and CSP compatibility review.

---

## 3. Dimension-by-Dimension Evaluation

### 3.1 Maintainability

**Current state.** RoyCSS is organized into 15 effect-batch TypeScript modules (`effects-batch-1.ts` through `effects-batch-15.ts`), a central `roycss-effects.ts` registry, a typed `roycss-types.ts` schema, and a `design-tokens.ts` file that exposes 12 token categories (color, typography, spacing, radius, shadow, border, opacity, elevation, motion, breakpoint, container, z-index). The codebase uses TypeScript throughout, ships a CLI (`src/cli/index.ts`) for scaffolding, and includes VS Code language support files (`roycss-classes.json`, `roycss-snippets.json`) — a level of DX investment rarely seen at v1.0. The contribution model is documented in `ARCHITECTURE.md` with a clear naming taxonomy (`roycss-{category}-{name}[-variant]`), but a formal `CONTRIBUTING.md`, code-review policy, and commit-message convention were not observed in the review sample.

**Risk level:** **Medium.** Code structure is above average for v1.0, but single-maintainer bus factor and absence of a documented contribution lifecycle create organizational risk at Fortune 500 scale.

**Recommendations.**
- Require the maintainer to publish `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and a `GOVERNANCE.md` before adoption in regulated business units.
- Negotiate a paid support agreement or escrow arrangement covering a named secondary maintainer.
- Fork the v1.0.0 tag into the enterprise artifact repository (Artifactory/Nexus) and pin internally.
- Establish an internal "RoyCSS liaison" team responsible for tracking upstream releases.

**Timeline:** Immediate (internal fork); 3 months (vendor governance docs); 6 months (secondary maintainer escrow).

### 3.2 Scalability

**Current state.** The package declares `sideEffects: ["*.css"]` and uses the modern `exports` field with subpath exports (`/css`, `/effects`), both of which enable correct tree-shaking under webpack 5, Vite, Rollup, esbuild, and Turbopack. Effects are described in TypeScript and injected dynamically from `roycss-effects.ts`, which means a consumer importing a single effect should, in principle, pull only that effect's CSS. However, there is **no published per-effect bundle size report**, no automated budget test, and the 240 KB aggregate figure (estimated) is the only size benchmark cited. For applications that bundle the full CSS file (`/css` export), 240 KB unminified / ~60 KB gzip is acceptable for marketing surfaces but excessive for performance-critical transactional flows.

**Risk level:** **Medium.** Tree-shaking infrastructure exists but is not proven at scale; bundle size budgets are absent.

**Recommendations.**
- Stand up an internal bundle-size regression test using `size-limit` or `bundlewatch` against a representative import set (10, 50, 100 effects).
- Mandate the `/effects` subpath import over the `/css` aggregate import for all production code.
- Add a CI check that fails any PR increasing first-party bundle size by >2% without architectural sign-off.
- Request the maintainer publish a `dist/stats.json` per release.

**Timeline:** Immediate (internal budget); 3 months (vendor stats.json); 6 months (per-effect size dashboard).

### 3.3 Accessibility

**Current state.** RoyCSS demonstrates accessibility awareness at the architecture level. The `ARCHITECTURE.md` document explicitly enumerates WCAG 2.1 AA as a target, mandates `prefers-reduced-motion` support on every animation, requires `prefers-contrast: high` support, mandates keyboard navigation (Tab/Enter/Escape/Arrow keys), and specifies a focus-visible ring using the OKLCH primary token. The motion token system (`motion-duration-instant` through `motion-duration-slowest`) provides the foundation for accessible motion. **However**, no external WCAG 2.1 AA audit report, VPAT 2.4 (Revised Section 508) document, or axe-core test suite was located during this review. The library ships effects, not interactive components, which lowers — but does not eliminate — the accessibility surface.

**Risk level:** **High** for regulated surfaces (healthcare, financial, public sector); **Medium** for internal tooling and marketing.

**Recommendations.**
- Commission a third-party WCAG 2.1 AA audit (Deque, Level Access, or TetraLogical) before adoption on regulated surfaces.
- Require the maintainer to publish a VPAT and axe-core test suite.
- Internally enforce `prefers-reduced-motion: reduce` test coverage in CI using Playwright + `emulateMedia`.
- Prohibit decorative-only effects on text content exceeding 200 characters (motion can trigger vestibular disorders).
- Document an "effects allowlist" specifying which of the 700+ effects are accessibility-safe for text vs. decoration-only.

**Timeline:** 3 months (external audit); 6 months (VPAT); 12 months (axe-core in vendor CI).

### 3.4 Performance

**Current state.** RoyCSS uses modern GPU-friendly properties (`transform`, `opacity`, `filter`) and the `@property` API to register animatable custom properties with explicit types, which enables the browser to performant interpolate them off the main thread where supported. The `roycss.css` file uses `mask-image`, `conic-gradient`, `background-clip: text`, `isolation: isolate`, and `mix-blend-mode` — all features with measurable paint and composite cost. Marquee animations use `translateX` (compositor-friendly); gradient-pan uses `background-position` (paint-only, more expensive). No `will-change` annotations were observed, and there is no published render-performance benchmark or Lighthouse CI configuration.

**Risk level:** **Medium.** Most effects are GPU-friendly; the absence of performance budgets and CI gating is the gap.

**Recommendations.**
- Establish an internal Lighthouse CI budget: CLS < 0.1, TBT < 200ms, no effect may increase LCP by >50ms.
- Prohibit simultaneous activation of more than three compositor-heavy effects per viewport.
- Request the maintainer annotate hot-path effects with `will-change: transform, opacity` and document paint cost tiers (Low/Medium/High) per effect.
- Avoid the `roycss-animated-gradient-text` effect on hero text above the fold — `background-position` animation is paint-bound.

**Timeline:** Immediate (Lighthouse CI); 3 months (paint-cost tier list); 6 months (vendor `will-change` pass).

### 3.5 Security

**Current state.** RoyCSS is a pure CSS library. The package's `main`/`module`/`types` fields reference compiled JS only for the effects registry and CLI; **no inline JavaScript is injected into consumer pages**, no `eval`, no `Function()` constructor, no dynamic `<script>` creation, and no network requests at runtime. The token system uses CSS custom properties, which are not exfiltrable via CSS alone in modern browsers (the historic `attr()`-based data exfiltration vector is mitigated by all evergreen browsers). The package `bin` field declares a CLI tool, which warrants a supply-chain review but does not execute in the browser. Strict CSP (`script-src 'self'; style-src 'self'`) is compatible. The maintainer's GitHub repository and npm publish pipeline were not assessed for 2FA or provenance (SLSA) attestations.

**Risk level:** **Low** for runtime XSS surface; **Medium** for supply-chain posture (no SLSA, no published security policy).

**Recommendations.**
- Require the maintainer to publish a `SECURITY.md` with a responsible-disclosure mailbox and SLA.
- Require npm provenance attestations (sigstore) on each release.
- Internally run `npm audit`, `socket.dev`, and `snyk` on every RoyCSS dependency bump.
- Pin RoyCSS to an exact version in `package.json` (no `^` or `~`) and consume via internal artifact mirror.
- Verify the CLI is not invoked in any CI pipeline unless explicitly approved.

**Timeline:** Immediate (version pinning + SCA); 3 months (vendor SECURITY.md); 6 months (npm provenance).

### 3.6 Theming

**Current state.** Theming is a RoyCSS strength. The OKLCH token system in `design-tokens.ts` defines brand, semantic, surface, text, and border colors with explicit light-mode overrides. The `roycss.css` file uses `light-dark()` for automatic theme adaptation with an `@supports not (color: light-dark(red, blue))` fallback for older browsers — a model example of progressive enhancement. Relative color syntax (`oklch(from var(--roy-primary) calc(l * 0.6) c h)`) generates derived shades at runtime, with a `color-mix()` fallback. Custom branding is achieved by overriding the `--roy-*` custom properties on `:root`. A `generateTailwindConfig()` function exports tokens for Tailwind consumers, and `generateJSONTokens()` enables Figma/Style Dictionary interop.

**Risk level:** **Low.**

**Recommendations.**
- Adopt the JSON token export as the single source of truth and pipe through Style Dictionary for iOS/Android/Flutter parity.
- Standardize on `light-dark()` for new internal work and deprecate `[data-theme="dark"]` selectors over 12 months.
- Document a brand-overrides recipe in the internal design-system handbook.
- Request the maintainer publish a token-migration guide for each major release.

**Timeline:** Immediate (Style Dictionary pipeline); 6 months (handbook recipe); 12 months (legacy selector deprecation).

### 3.7 Long-Term Support

**Current state.** RoyCSS is at v1.0.0 with no published LTS policy, no documented support window, no end-of-life schedule, and no commercial support offering. The maintainer is an individual contributor. There is no Foundation or corporate steward (contrast with Tailwind's Tailwind Labs or Bootstrap's Twbs org). For Fortune 500 adoption, the absence of an LTS commitment is the single largest non-technical risk.

**Risk level:** **High.**

**Recommendations.**
- Before adoption in any Tier-1 application, negotiate a minimum 24-month support commitment in writing, including a documented security-patch SLA (≤30 days for Critical, ≤90 days for High).
- Establish an internal fork-and-maintain contingency plan with named engineers.
- Track upstream activity weekly; alert internally if no commits for 60 days.
- Encourage the maintainer to join an existing foundation (OpenJS Foundation Incubation Program) or transfer stewardship to a multi-vendor entity within 12 months.

**Timeline:** 3 months (support agreement); 6 months (contingency plan); 12 months (foundation move).

### 3.8 RTL (Right-to-Left)

**Current state.** The repository contains `scripts/migrate-logical.ts`, indicating an active migration to CSS logical properties (`inline-start`/`inline-end`, `block-start`/`block-end`, `margin-inline`, `inset-inline`, etc.). The `roycss.css` file uses `inset-block-start`, `inset-inline`, and `block-size` — confirming logical-property adoption in production code. The marquee effect uses `translateX(-100%)`, which is **not** direction-aware and will scroll the wrong way in RTL contexts unless mirrored. No RTL test fixtures, no Playwright RTL visual regression suite, and no documented `dir="rtl"` testing protocol were observed.

**Risk level:** **Medium** for global organizations with Arabic, Hebrew, Farsi, or Urdu markets; **Low** otherwise.

**Recommendations.**
- Require a complete logical-property audit of all 700+ effects before launch in RTL markets.
- Replace `translateX` with `translate` and logical `inset-inline` for directional effects.
- Stand up an RTL visual regression suite using Playwright + `dir="rtl"` against the demo site.
- Request the maintainer publish an RTL conformance report per release.

**Timeline:** 3 months (audit + test fixtures); 6 months (vendor RTL report); 12 months (RTL certification program).

### 3.9 Internationalization

**Current state.** The typography token system uses `clamp()` for fluid font sizes, which scales gracefully across viewport sizes and DPIs. Font-family tokens include a robust fallback chain (`var(--font-geist-sans), system-ui, -apple-system, sans-serif`). However, the fallback chain is Latin-centric and does not include CJK (PingFang, Noto Sans CJK), Arabic (Noto Naskh), or Indic (Noto Sans Devanagari) fallbacks. No `text-wrap: balance` or `text-wrap: pretty` usage was observed in the core CSS, though both are 2026 best practices for multi-language content. No language-variant tokens (line-height adjustments for CJK, letter-spacing for Arabic) are defined.

**Risk level:** **Medium** for global organizations; **Low** for English-only markets.

**Recommendations.**
- Extend the `font-sans` token with a multi-script fallback chain: `... , "Noto Sans CJK", "PingFang SC", "Noto Naskh Arabic", "Noto Sans Devanagari", sans-serif`.
- Add `text-wrap: pretty` to body-text utilities and `text-wrap: balance` to headings.
- Define language-variant token overrides (`[lang="ja"] { --roy-line-height-normal: 1.7; }`).
- Add a CJK/Arabic line-height and letter-spacing test fixture.

**Timeline:** 3 months (font fallback chain); 6 months (text-wrap adoption); 12 months (language-variant tokens).

### 3.10 Documentation

**Current state.** The repository ships a comprehensive `ARCHITECTURE.md` describing the design intent, naming taxonomy, and component roadmap. A README is present. The presence of VS Code snippets and classes JSON files indicates investment in developer experience. However, no hosted API reference (TypeDoc, Styleguidist), no interactive playground outside the demo Next.js app, and no migration guides for incoming Bootstrap/Tailwind/Animate.css users were located in the review sample. The package's `homepage` field points to `https://roycss.dev`, which suggests a marketing site exists; depth of documentation there was not assessed.

**Risk level:** **Medium.**

**Recommendations.**
- Require the maintainer to publish TypeDoc-generated API reference and a versioned docs site (Mintlify, Docusaurus, Fumadocs).
- Commission migration guides: Bootstrap → RoyCSS, Tailwind → RoyCSS, Animate.css → RoyCSS.
- Internally produce a "RoyCSS for Our Enterprise" cheat sheet mapping internal design tokens to RoyCSS tokens.
- Require every major release to ship a documented changelog with a human-written upgrade guide, not just `CHANGELOG.md` automation.

**Timeline:** 3 months (vendor docs site); 6 months (migration guides); 12 months (interactive playground).

### 3.11 Migration

**Current state.** RoyCSS's framework-agnostic CSS-class model means migration from Animate.css is largely a class-rename exercise (e.g., `animate__bounce` → `roycss-anim-bounce`). The semantic aliases proposed in `ARCHITECTURE.md` (`roycss-fade-in`, `roycss-spin`, `roycss-glow`, `roycss-glass`) further reduce friction. No automated codemod was observed. Tailwind migration is more involved because Tailwind's utility-first philosophy differs from RoyCSS's effect-catalog philosophy; the two can coexist (RoyCSS's `generateTailwindConfig()` export supports this), and the recommended pattern is "Tailwind for layout, RoyCSS for effects." Bootstrap migration is straightforward for the effects layer (modals, toasts, cards) but RoyCSS does not currently ship a full component library — only the foundation is in place per `ARCHITECTURE.md` Phase 1–6 roadmap.

**Risk level:** **Medium.**

**Recommendations.**
- Build an internal codemod (jscodeshift or ts-morph) mapping Animate.css class names to RoyCSS equivalents.
- Adopt the "Tailwind for layout + RoyCSS for effects" pattern as the enterprise standard.
- For Bootstrap migrations, evaluate whether RoyCSS's planned component library (Phases 2–6) is sufficiently mature; until then, retain Bootstrap for components.
- Document a migration ROI calculator: estimated hours per 1000 lines of legacy CSS.

**Timeline:** 3 months (codemod); 6 months (pattern ratification); 12 months (component library evaluation).

### 3.12 Governance

**Current state.** No RFC process, no published governance model, no security policy, no documented decision-making framework for breaking changes, and no public roadmap were located. The MIT license is permissive and enterprise-friendly. The maintainer's GitHub activity suggests a single decision-maker. This is typical for v1.0 solo projects but incompatible with Fortune 5 governance expectations for Tier-1 dependencies.

**Risk level:** **High.**

**Recommendations.**
- Require the maintainer to adopt a lightweight RFC process (e.g., the React RFC template) for any breaking change.
- Require a published `SECURITY.md` and a `SECURITY-ADVISORIES.md` history.
- Require quarterly roadmap publication with at least 90 days notice of any breaking change.
- Internally, route all RoyCSS adoption decisions through the Architecture Review Board and log in the ADR (Architecture Decision Record) system.

**Timeline:** 3 months (RFC + SECURITY.md); 6 months (roadmap cadence); 12 months (multi-stakeholder steering).

### 3.13 Versioning

**Current state.** The package is at v1.0.0 and the `package.json` does not indicate a non-SemVer scheme, so SemVer is assumed. There is no documented deprecation timeline, no `deprecated` npm tag strategy, no breaking-change calendar, and no LTS branch model. The presence of migration scripts in the repo (`migrate-colors.ts`, `migrate-logical.ts`) suggests the maintainer understands the cost of breaking changes and is willing to provide automation — a positive signal — but the policy around them is undocumented.

**Risk level:** **High.**

**Recommendations.**
- Require a documented SemVer policy with explicit definitions of breaking, minor, and patch changes for a CSS library.
- Require a minimum 12-month deprecation runway: deprecated APIs must emit console warnings for at least one minor release before removal.
- Require an LTS branch (e.g., `1.x`) receiving security and bug fixes for at least 18 months after `2.0` ships.
- Internally, adopt Renovate Bot with a `rangeStrategy: pin` policy for RoyCSS.

**Timeline:** 3 months (SemVer policy doc); 6 months (deprecation runway); 12 months (LTS branch).

---

## 4. Risk Matrix

| # | Risk | Dimension | Severity | Likelihood | Composite |
|---|------|-----------|----------|------------|-----------|
| R1 | Single-maintainer bus factor | Maintainability / LTS / Governance | High | High | **Critical** |
| R2 | No WCAG 2.1 AA audit / VPAT | Accessibility | High | High | **Critical** |
| R3 | No LTS or support SLA | Long-Term Support | High | High | **Critical** |
| R4 | No SECURITY.md or security advisory channel | Security / Governance | Medium | High | **High** |
| R5 | Bundle size not budget-tested at scale | Scalability / Performance | Medium | Medium | **Medium** |
| R6 | RTL: marquee uses `translateX`, not logical | RTL | Medium | Medium | **Medium** |
| R7 | No SLSA / npm provenance | Security | Medium | Medium | **Medium** |
| R8 | Font fallbacks Latin-only | Internationalization | Medium | Medium | **Medium** |
| R9 | No published API reference or migration guides | Documentation | Medium | Medium | **Medium** |
| R10 | Marquee/gradient-text paint cost on low-end devices | Performance | Low | Medium | **Low** |
| R11 | No codemod for Animate.css migration | Migration | Low | Low | **Low** |
| R12 | OKLCH unsupported on legacy browsers (IE11, Safari <15.4) | Theming | Low | Low | **Low** |

**Legend:** Severity × Likelihood = Composite. Critical = block adoption until mitigated; High = adopt with conditions and remediation plan; Medium = adopt with monitoring; Low = accept and document.

---

## 5. Adoption Checklist (Fortune 500 Pre-Adoption Gates)

Before any Tier-1 application may import RoyCSS, the following gates must be satisfied. Items marked **[VENDOR]** depend on the maintainer; items marked **[INTERNAL]** are enterprise responsibilities.

### 5.1 Legal & Sourcing
- [ ] [INTERNAL] License review (MIT confirmed — acceptable)
- [ ] [INTERNAL] Export-control review (pure CSS, no cryptographic code — low risk)
- [ ] [INTERNAL] Vendor risk assessment filed with Procurement
- [ ] [VENDOR] Named commercial-support contact or escrow agreement

### 5.2 Security
- [ ] [VENDOR] `SECURITY.md` published with disclosure mailbox and SLA
- [ ] [VENDOR] npm provenance (sigstore) on every release
- [ ] [INTERNAL] Snyk + Socket.dev scan passing on pinned version
- [ ] [INTERNAL] RoyCSS pinned to exact version in `package.json`
- [ ] [INTERNAL] Internal artifact mirror (Artifactory) configured

### 5.3 Accessibility
- [ ] [VENDOR] Third-party WCAG 2.1 AA audit report
- [ ] [VENDOR] VPAT 2.4 (Revised Section 508) document
- [ ] [INTERNAL] Internal axe-core + Playwright test suite green
- [ ] [INTERNAL] Effects allowlist published (text-safe vs. decoration-only)

### 5.4 Performance
- [ ] [INTERNAL] Lighthouse CI budget configured (CLS < 0.1, TBT < 200ms)
- [ ] [INTERNAL] Bundle-size regression test (size-limit) passing
- [ ] [VENDOR] Per-effect paint-cost tier list published

### 5.5 Governance
- [ ] [VENDOR] RFC process documented
- [ ] [VENDOR] Public 12-month roadmap published
- [ ] [VENDOR] SemVer and deprecation policy documented
- [ ] [INTERNAL] ADR filed in the architecture decision record system
- [ ] [INTERNAL] RoyCSS liaison team named

### 5.6 Operational
- [ ] [INTERNAL] Internal fork of v1.0.0 tag in artifact repository
- [ ] [INTERNAL] Renovate Bot configured with `rangeStrategy: pin`
- [ ] [INTERNAL] Rollback runbook published
- [ ] [INTERNAL] 90-day post-adoption review scheduled

---

## 6. Competitive Analysis

| Criterion | RoyCSS v1.0 | Tailwind CSS 4 | Bootstrap 5 | Material UI (MUI) | Chakra UI v3 |
|-----------|-------------|----------------|-------------|-------------------|--------------|
| **Primary philosophy** | Effects catalog | Utility-first | Component framework | Component framework (Material) | Component framework |
| **Effect count** | 700+ | ~50 utilities | ~30 | ~20 (via Lab) | ~15 |
| **Color system** | OKLCH native | OKLCH (v4) | RGB / Hex | RGB / Hex | RGB / Hex |
| `light-dark()` support | ✅ Native | ✅ (v4) | ❌ | ❌ | ❌ |
| **Container queries** | ✅ Native | ✅ | ❌ | ❌ | ❌ |
| **Framework agnostic** | ✅ (CSS-only) | ✅ (CSS-only) | ✅ (CSS-only) | ❌ React-only | ❌ React-only |
| **Bundle size (effect surface)** | ~60 KB gzip (full) | ~10 KB (utilities used) | ~22 KB | ~80 KB+ | ~45 KB |
| **Tree-shaking** | ✅ via `sideEffects` | ✅ via JIT | ❌ (full bundle) | ✅ per-component | ✅ per-component |
| **CSP-strict compatible** | ✅ | ✅ | ✅ | ⚠️ (Emotion inline styles) | ⚠️ (Emotion inline styles) |
| **WCAG 2.1 AA audited** | ❌ (pending) | ✅ | ✅ | ✅ | ✅ |
| **LTS policy** | ❌ | ✅ (Tailwind Labs) | ✅ (twbs org) | ✅ (MUI Inc.) | ✅ |
| **Commercial support** | ❌ | ✅ (Tailwind UI) | ❌ | ✅ (MUI X) | ❌ |
| **RTL support** | Partial (in progress) | ✅ | ✅ | ✅ | ✅ |
| **Best for** | Effect-heavy marketing & design systems | App-scale UI at speed | Internal tools, dashboards | Material-styled enterprise apps | React-only design systems |

**Positioning.** RoyCSS occupies a defensible niche — **the only modern, framework-agnostic, OKLCH-native effects library at scale**. It is not a replacement for Tailwind (layout) or MUI (component library); it is a complementary effects layer that can coexist with any of them. For organizations standardizing on Tailwind for layout, RoyCSS is the strongest effects companion. For organizations on MUI, RoyCSS can be adopted for marketing surfaces without disturbing the application component library.

---

## 7. Final Recommendation

### **ADOPT WITH CONDITIONS**

RoyCSS demonstrates technical excellence rare for a v1.0 release: an OKLCH-native token system, `light-dark()` automatic theming, `@property` registered custom properties, logical-property migration tooling, framework-agnostic CSS-only distribution, and a clean, typed codebase. The security posture is strong — no inline JavaScript, no `eval`, strict-CSP compatible. The competitive position is unique.

However, three **Critical** risks (single-maintainer bus factor, no accessibility audit, no LTS) and four **High** risks must be mitigated before Tier-1 adoption. We therefore recommend a phased adoption:

**Phase 1 — Immediate (0–3 months): Pilot**
- Adopt RoyCSS on up to three internal or marketing surfaces.
- Pin to v1.0.0 in the internal artifact mirror.
- File ADR; name liaison team; negotiate support agreement.
- Commission WCAG 2.1 AA audit.

**Phase 2 — Conditional Expansion (3–6 months): Design System Integration**
- Integrate RoyCSS tokens with the enterprise design system via Style Dictionary.
- Stand up Lighthouse CI, axe-core, RTL, and bundle-size regression tests.
- Adopt the "Tailwind for layout + RoyCSS for effects" pattern as standard.
- Roll out to all internal tooling and non-regulated customer-facing surfaces.

**Phase 3 — Regulated Surfaces (6–12 months): Full Adoption**
- Upon receipt of VPAT and completion of LTS negotiation, extend to regulated surfaces (healthcare, financial, public sector).
- Complete RTL certification and internationalization audit.
- Evaluate RoyCSS component library (Phases 2–6 of maintainer roadmap) for Bootstrap replacement.

**Phase 4 — Annual Review (12 months)**
- Conduct a formal re-review. If R1–R3 (Critical risks) remain unmitigated, initiate contingency fork-and-maintain plan or seek an alternative effects library.

**Conditions of adoption (mandatory):**
1. Vendor must publish `SECURITY.md`, `GOVERNANCE.md`, `CONTRIBUTING.md`, and a 12-month roadmap within 90 days of enterprise contract.
2. Vendor must commission and publish a WCAG 2.1 AA audit within 6 months.
3. Vendor must commit to a 24-month support window and 12-month deprecation runway for any breaking change.
4. Enterprise will maintain an internal fork contingency with named engineers regardless of vendor commitments.

**Estimated enterprise value:** RoyCSS has the potential to reduce custom-CSS maintenance burden by 30–50% on effect-heavy surfaces, accelerate marketing-site delivery by an estimated 25%, and provide a future-proof OKLCH foundation that aligns with the enterprise's 2026 modernization strategy. The conditions above are achievable and the ROI justifies the governance investment.

---

## 8. Appendix A — Evidence Index

| Artifact | Path | Purpose |
|----------|------|---------|
| Package manifest | `package.roycss.json` | Version, exports, sideEffects, engines |
| Design tokens | `src/lib/design-tokens.ts` | OKLCH color system, 12 token categories |
| Core CSS | `src/app/roycss.css` | `@property`, `light-dark()`, `color-mix()`, logical properties |
| Architecture intent | `ARCHITECTURE.md` | Naming taxonomy, component roadmap, accessibility standards |
| Migration tooling | `scripts/migrate-logical.ts`, `scripts/migrate-colors.ts` | Operational maturity evidence |
| DX artifacts | `vscode-support/roycss-classes.json`, `roycss-snippets.json` | IDE integration |
| CLI | `src/cli/index.ts` | Scaffolding tooling |
| Effect registry | `src/lib/roycss-effects.ts` + 15 batch modules | 700+ effect definitions |

## 9. Appendix B — Reviewer Sign-Off

| Role | Name | Decision | Date |
|------|------|----------|------|
| Lead Frontend Architect | _pending_ | Approve with conditions | _pending_ |
| Security Architect | _pending_ | Approve (Low runtime risk; Medium supply-chain) | _pending_ |
| Accessibility Lead | _pending_ | Conditional — pending VPAT | _pending_ |
| Performance Engineering | _pending_ | Approve with Lighthouse CI gate | _pending_ |
| Sourcing & Vendor Mgmt | _pending_ | Conditional — pending support agreement | _pending_ |

---

*End of document. This review is valid for 12 months from the review date or until the next minor/major RoyCSS release, whichever comes first. Re-review is mandatory upon any major version bump.*
