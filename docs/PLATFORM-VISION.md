# RoyCSS Platform Vision — From CSS Framework to Developer Ecosystem

**Status:** Authoritative vision · **Version:** 1.0 · **Date:** 2026-Q1
**Author:** Royford Wanyoike, Founder & Principal Architect, RoyCSS
**Companion to:** `ROYCSS-V2-BLUEPRINT.md`, `COMPETITIVE-ANALYSIS.md`, `LABS-30-ONE-MILLION-USERS.md`, `LABS-34-FRAMEWORK-KILLER.md`, `LABS-35-TEN-YEAR-ARCHITECTURE.md`
**Audience:** RoyCSS core team, advisors, prospective sponsors, enterprise customers, and community

---

## 0. Executive Summary

RoyCSS today is a free, open-source CSS-effects framework: **760 production-ready effects** across 20 categories, a 24-component first-party library, the **RoyMotion** animation system, a W3C-aligned design-token architecture (OKLCH-native, `color-mix()`, `light-dark()`), framework-agnostic bindings (React, Vue, Angular, Svelte, vanilla), and a CLI (`init`, `add`, `search`, `list`, `categories`, `info`). It is the first CSS framework engineered natively on top of the post-2023 web platform surface — `oklch()`, `:has()`, container queries, View Transitions API, scroll-driven animations, cascade layers, `@property`, native nesting.

That is the foundation. It is not the destination.

This document describes RoyCSS's evolution from a **library** into a **platform ecosystem**: twelve products that together form a vertically integrated developer surface spanning the entire CSS lifecycle — design, author, build, audit, deploy, collaborate, learn, certify, and monetize. The strategic thesis is simple and worth stating up front:

> **The framework is not the moat. The ecosystem is the moat.**

Every CSS framework challenger of the last decade — Bulma, Foundation, Material UI's CSS layer, UnoCSS, Panda CSS, StyleX — has either stagnated, niche'd, or coupled itself to a single runtime. The reason is structural: a CSS framework alone is a commodity. CSS is a public web standard; anyone can ship a utility class. What is hard to ship — and therefore defensible — is the *surrounding surface*: tooling that compounds in value as adoption grows, a marketplace that creates supply-side lock-in for creators, an AI layer that gets smarter with every user, an enterprise channel that turns one-off downloads into multi-year contracts, and an education arm that trains the next generation of developers to think in your primitives.

RoyCSS will build all of it. This document specifies, in detail, what we will build, how it makes money, why competitors cannot easily copy it, which features no competitor has, how we will go to market, and how we will measure success.

---

## 1. Platform Architecture

The RoyCSS ecosystem is twelve products, organized into four layers: **foundation** (the free open-source layer), **commercial tooling** (paid developer tools), **marketplace** (two-sided creator economy), and **enterprise & education** (the long-term-revenue tail). The diagram below is the ecosystem map.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROYCSS PLATFORM ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ FOUNDATION (free, OSS) ──────────────────────────────────────────┐  │
│  │  1. Core Framework   760 effects · RoyMotion · tokens · CLI       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                  ↓ feeds                                │
│  ┌─ COMMERCIAL TOOLING (paid) ───────────────────────────────────────┐  │
│  │  2. Pro Components    3. Roy Studio      4. Roy Cloud             │  │
│  │  6. Roy AI            10. Roy DevTools   11. Roy Motion Library   │  │
│  │  12. Roy Accessibility Suite                                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                  ↓ distributes via                     │
│  ┌─ MARKETPLACE (two-sided) ─────────────────────────────────────────┐  │
│  │  5. Roy Marketplace (templates + components)                      │  │
│  │  9. Roy Inspector (Chrome extension, lead funnel)                 │  │
│  │  + Roy Themes (vertical theme packs)                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                  ↓ monetized by                        │
│  ┌─ ENTERPRISE & EDUCATION (recurring) ──────────────────────────────┐  │
│  │  7. Roy Enterprise (SLA, LTS, private registry, security)         │  │
│  │  8. Roy Academy (courses, 4-tier certification)                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

The remainder of this section specifies each product in turn: what it is, what is free vs paid, what its scope is, and its dependency on the other products.

### 1.1 Core Framework (Free, Open Source)

The Core Framework is the foundation and the funnel. It is, and will remain, **MIT-licensed** and free forever. Its scope:

- **760 CSS effects** across 20 categories (motion, surface, edge, type, input, field, visual, backgrounds, text, hover, animations, microinteractions, seasonal, game/retro, future-trending, etc.).
- **RoyMotion** — the animation system: entrance, exit, hover, scroll, page, loaders, skeleton, microinteractions, stagger; spring easings; `animation-timeline: view()` scroll-driven motion with `@supports` fallbacks.
- **Design tokens** — 12 token categories (color, typography, spacing, radius, shadow, motion, z-index, breakpoint, opacity, border, size, elevation); W3C DTCG-format JSON; OKLCH-native; Style Dictionary-compatible exports for CSS, SCSS, iOS Swift, Android XML, Figma.
- **CLI** — `roycss init|add|search|list|categories|info` — scaffolds projects, adds effects, searches 760 effects with sub-100ms fuzzy matching.
- **Framework bindings** — React, Vue, Angular, Svelte, Solid, Astro, vanilla HTML.
- **Modern-CSS-first surface** — `oklch()`, `color-mix()`, relative color syntax, `@property`, native nesting, `:where()`, `:has()`, `light-dark()`, container queries, View Transitions API, scroll-driven animations.

The Core Framework is the **adoption engine**. Every other product in the ecosystem depends on it being widely installed. We will never charge for it. We will never degrade it to force upgrades. The free tier must remain so good that switching *to* RoyCSS is a no-brainer (per `LABS-34-FRAMEWORK-KILLER.md`: "lock-in prevention, not lock-in creation").

### 1.2 RoyCSS Pro Components — $199/year

Enterprise-grade component library layered on top of the free Core. Where the free library ships 24 first-party components (foundation, layout, forms, navigation, feedback, data display, charts), Pro ships the components that enterprises need but that are too expensive to build free:

- **Data-heavy components**: advanced data tables (column resize, virtual scrolling, row grouping, inline editing, CSV/Excel export), Kanban boards, Gantt charts, tree views, file uploaders with chunked upload + S3 direct.
- **Complex forms**: multi-step wizards, dynamic form schemas (JSON-Schema-driven), field arrays, conditional logic, cross-field validation.
- **Domain components**: SaaS dashboard shells, admin panels, billing flows, auth flows (sign-in, sign-up, MFA, SSO buttons), settings panels.
- **Compliance components**: cookie consent banners (GDPR/CCPA), accessibility-preferences widgets, terms-of-service modals with version tracking.
- **Headless hooks** that pair with the components: `useDataTable`, `useWizard`, `useFileUpload`, `useCommandPalette`.

Pro Components are licensed per-developer-per-year, not per-seat-per-app. One license covers unlimited internal projects. Redistribution rights (e.g., embedding in a sold product) require an OEM add-on.

### 1.3 Roy Studio — Visual Builder

Roy Studio is the visual authoring environment: **Figma meets Webflow, exports RoyCSS**. It is the product that closes the designer-developer handoff gap, which is the single largest source of friction in CSS-heavy teams.

Studio's surface:

- **Canvas** — drag-and-drop layout with real CSS Grid / Flexbox / container-query primitives, not fake abstractions.
- **Token editor** — visual OKLCH palette generation, contrast checking against WCAG 2.1 AA/AAA in real time, automatic tint/shade generation via `color-mix()`.
- **Effect picker** — drag any of the 760 RoyCSS effects onto an element; tune duration, easing, delay, iteration count via sliders; the Studio writes the corresponding `--roycss-*` custom properties and class names.
- **Component composer** — compose Pro Components visually; Studio writes the framework-specific bindings (React/JSX, Vue/SFC, Svelte, Angular, Astro).
- **Export** — one-click export to: (a) RoyCSS-flavored HTML/CSS, (b) React + RoyCSS project (Next.js, Vite, Remix), (c) Vue + RoyCSS, (d) Figma library (sync back), (e) Roy Cloud theme.
- **Live preview** — iframe-embedded, real-time, with device frames (iPhone, Pixel, MacBook, 4K desktop), dark/light toggle, reduced-motion toggle, `prefers-contrast: high` toggle.

Studio is desktop-first (Tauri-based, 30 MB installer, ships on macOS, Windows, Linux), with a read-only web companion for stakeholders. Local-first with optional Roy Cloud sync.

### 1.4 Roy Cloud — Token, Theme, and Component Hosting

Roy Cloud is the collaboration and hosting layer. It solves the problem that kills every design-system effort: tokens live in five places (Figma, code, iOS, Android, docs), none of them synced.

Cloud's surface:

- **Token repos** — Git-backed W3C DTCG token collections with semantic versioning, branch-per-team, merge with conflict resolution at the token level (not the file level).
- **Theme repos** — RoyCSS themes (color, typography, motion, density) with one-click deploy to Roy Cloud CDN; consumers pull themes via `<link rel="stylesheet" href="https://cdn.roy.cloud/themes/{org}/{theme}@{semver}.css">`.
- **Component registry** — private npm-like registry for an organization's internal RoyCSS components; integrates with `roycss add` CLI.
- **Collaboration** — live multi-cursor editing of token files (a la Figma), comments anchored to specific tokens, change requests with visual diffs (before/after rendered previews).
- **Versioning & rollback** — every publish creates an immutable version; rollback is one click; consumers pin via semver ranges.
- **Audit log** — who changed which token when, with diff; exportable for SOC 2 / ISO 27001 compliance.

Roy Cloud has a generous free tier (1 project, 3 themes, public-only) so individuals adopt it. Paid tiers unlock private repos, team collaboration, and enterprise SSO.

### 1.5 Roy Marketplace — Template & Component Store

Roy Marketplace is the two-sided creator economy. Independent designers and developers sell RoyCSS-based templates, themes, component packs, and motion packs. RoyCSS takes a **15% commission**; sellers keep 85%.

Marketplace categories:

- **Templates** — full project starters (SaaS landing, admin dashboard, e-commerce storefront, portfolio, documentation site, blog, marketing site, authentication flow).
- **Component packs** — themed sets (e.g., "Cyberpunk UI Pack", "Healthcare Forms Pack", "Fintech Charts Pack").
- **Theme packs** — vertical-specific themes (Healthcare, Banking, SaaS, Education, E-commerce, Government, Gaming, Media).
- **Motion packs** — curated RoyMotion animation collections ("Onboarding Flows", "Microinteraction Set", "Page Transitions").
- **Effect packs** — niche effect collections by community creators (seasonal, branded, holiday, industry-specific).

Every item is reviewed for: WCAG 2.1 AA compliance, RoyCSS-namespace adherence, framework-agnosticism (must work in at least React + vanilla), bundle-size budget (<50 KB gzip per item), and license clarity. RoyCSS curates the front page; the long tail is search-discoverable.

The Marketplace's strategic role is bigger than commission revenue. It creates **supply-side lock-in**: creators who publish on RoyCSS Marketplace have economic incentive to keep using RoyCSS, not switch to Tailwind. Their templates only work with RoyCSS. Their customers only install RoyCSS. The network effect is self-reinforcing.

### 1.6 Roy AI — AI Assistant for RoyCSS

Roy AI is the AI layer that runs across every surface — CLI, Studio, Cloud, Marketplace, DevTools, Inspector. It is the single largest competitive differentiator (see §4).

Capabilities:

- **Generate** — natural-language prompt → RoyCSS-flavored HTML/CSS (or framework-specific component). "A glassmorphism login card with a subtle aurora background and a satisfying submit-button microinteraction" → working code using `.roycss-glass-tinted-depth`, `.roycss-bg-aurora-borealis-2`, `.roycss-micro-satisfying-check`.
- **Audit** — paste a URL or upload a file → AI returns a report: contrast failures, missing focus styles, oversized bundles, dead CSS, non-OKLCH colors, RoyCSS anti-patterns.
- **Optimize** — AI suggests equivalent RoyCSS classes for hand-written CSS, reducing bundle size and improving consistency.
- **Migrate** — paste Bootstrap/Tailwind/Material UI code → AI returns RoyCSS equivalent (see §4.7 for the full migration engine).
- **Explain** — highlight any RoyCSS class → AI explains what it does, which CSS features it uses, performance characteristics, accessibility notes, and links to relevant docs.

Roy AI is fine-tuned on the full RoyCSS codebase, the 760 effects, every component, and the design-token schema. It uses a hybrid retrieval architecture (vector search over the effect catalog + structured lookup over the token schema + LLM generation), so it never hallucinates a class that does not exist. This is the gap that generic AI assistants (Copilot, Cursor, Claude) cannot close: they don't know RoyCSS's vocabulary.

### 1.7 Roy Enterprise — Support, SLA, Private Registry, LTS, Security

Roy Enterprise is the channel that turns one-off free downloads into multi-year contracts. Enterprises will not adopt a library without: legal review, security attestation, named support, and stability guarantees. Roy Enterprise provides all four.

The Enterprise package includes:

- **SLA-backed support** — named support engineer, 1-hour response for P0, 4-hour for P1, Next-Business-Day for P2; dedicated Slack channel; quarterly architecture review.
- **LTS (Long-Term Support)** — one major version designated LTS at all times, supported with security and bug fixes for **18 months** after its successor ships. Critical patches backported. Breaking changes announced one minor release ahead with codemods.
- **Private registry** — on-prem or VPC-hosted Roy Cloud mirror; airgap install for regulated industries (banking, healthcare, government).
- **Security reviews** — annual third-party penetration test of the RoyCSS runtime; SOC 2 Type II attestation; signed npm packages; SBOM (Software Bill of Materials) with every release; SECURITY.md with 72-hour critical-fix SLA.
- **Indemnification** — IP indemnification up to $1M per contract (critical for Fortune 500 procurement).
- **Training** — 8 hours of instructor-led training per year; 10 seats in Roy Academy.

### 1.8 Roy Academy — Courses and Certification

Roy Academy is the education arm: courses, certification, and curriculum. Education is the long-tail moat — when a university teaches RoyCSS, every student becomes a RoyCSS user for a decade.

Course catalog (Year 1):

- **RoyCSS 101: Modern CSS Foundations** — `oklch()`, container queries, `:has()`, cascade layers, View Transitions. 8 hours.
- **RoyCSS 201: The RoyCSS Way** — effects, RoyMotion, design tokens, framework bindings. 12 hours.
- **RoyCSS 301: Component Architecture** — headless primitives, styled layer, building a component library on RoyCSS. 16 hours.
- **RoyCSS 401: Performance & Accessibility** — bundle budgets, critical CSS, a11y auditing, RUM. 12 hours.
- **Roy Studio Mastery** — visual builder from beginner to power user. 6 hours.
- **RoyCSS for Enterprise** — design-system governance, token workflows, multi-team collaboration. 8 hours.

**Certification tiers**:

| Tier | Title | Prerequisite | Exam | Renewal |
|---|---|---|---|---|
| 1 | **RoyCSS Associate** | 101 + 201 | 60-question multiple choice + practical | 3 years |
| 2 | **RoyCSS Professional** | Associate + 301 | Project submission (build a component library) | 3 years |
| 3 | **RoyCSS Expert** | Professional + 401 + 2 years experience | Performance & a11y case study defense (panel) | 3 years |
| 4 | **RoyCSS Architect** | Expert + 5 years experience + enterprise contribution | Architecture review (peer panel + RoyCSS core team) | 5 years |

Roy Academy also publishes a free **8-week university curriculum** at `/teach` (per `LABS-30`) — versioned URLs (`/docs/2.x/teach`) that never change, so professors can build syllabi without fear of drift.

### 1.9 Roy Inspector — Chrome Extension

Roy Inspector is a free Chrome extension that lets you inspect any website's CSS — not just RoyCSS sites — and see: which CSS features are used, contrast failures, dead CSS, performance metrics, and (if RoyCSS is detected on the page) which RoyCSS classes are in use. It is the **lead-generation funnel** for the rest of the ecosystem.

Strategic role: Inspector is free, viral, and brand-building. A developer inspects a competitor's site, sees the tool is useful, follows the link to roycss.dev, and enters the funnel. It is also the discovery surface for the Roy AI audit feature — "click here to run a full AI audit on this page" routes into Roy Cloud's paid tier.

### 1.10 Roy DevTools — Browser DevTools Integration

Roy DevTools is the deeper browser integration: a DevTools panel (Chrome + Firefox + Edge + Safari) that adds RoyCSS-specific tabs alongside Elements, Network, Performance:

- **RoyCSS tab** — shows which RoyCSS classes are applied to the selected element, which custom properties are inherited, which token each value resolves to.
- **Token inspector** — visualize the entire `--roycss-*` custom-property tree; edit live; sync back to Roy Cloud.
- **Effect debugger** — pause RoyMotion animations mid-flight; scrub timelines; toggle reduced-motion; isolate scroll-driven animations.
- **Bundle analyzer** — shows the size of the RoyCSS portion of the page's CSS, broken down by category and effect.
- **AI panel** — right-click any element → "Ask Roy AI" → audit, explain, or refactor.

Roy DevTools is free; the AI panel and Cloud sync require a Roy Cloud subscription.

### 1.11 Roy Themes — Professional Theme Store

Roy Themes is a curated theme store for vertical markets: Healthcare, Banking, SaaS, Education, E-commerce, Government, Gaming, Media, Legal, Real Estate. Each theme is a complete token set + component overrides + motion pack, designed by professional designers, reviewed for industry compliance (HIPAA-aligned colors for Healthcare, WCAG-enhanced contrast for Government, etc.).

Themes are sold one-time per project ($49–$299) or via a Roy Cloud subscription (all-you-can-eat for $19/month). Themes are also available on Roy Marketplace as a subcategory, but Roy Themes is the first-party curated collection — fewer, better, officially supported.

### 1.12 Roy Motion Library — Premium Animation Pack

Roy Motion Library (Premium) is the paid expansion of the free RoyMotion. The free RoyMotion ships the foundational animation primitives (entrance, exit, hover, scroll, page, loaders, skeleton, microinteractions, stagger). The Premium Library adds:

- **Choreographed motion sequences** — 50+ multi-element animation flows (onboarding sequences, checkout flows, dashboard-load reveals).
- **Spring physics presets** — 30 named spring configurations ("Playful", "Confident", "Snappy", "Calm", "Energetic") with parameters exposed.
- **Gesture-driven motion** — magnetic cursors, parallax-on-pointer, tilt-on-gyroscope (mobile), drag-with-physics.
- **Page transitions** — 20 View Transitions API-based page transitions with cross-document support.
- **Motion tokens** — a motion-design token system that integrates with Roy Cloud for team-wide motion consistency.

Premium is a one-time $99 purchase or included in the Pro Components subscription.

### 1.13 Roy Accessibility Suite — Automated a11y Auditing and Fixing

Roy Accessibility Suite is the automated WCAG auditing and remediation product. It runs in three places:

- **Build-time** (CI) — `roycss a11y` fails the build if any page violates the configured WCAG level (AA default, AAA optional). Reports include: contrast failures, missing focus styles, ARIA violations, missing reduced-motion variants, touch-target sizes, heading hierarchy.
- **Runtime** (RUM) — `@roycss/rum` SDK reports real-user accessibility violations (caught after deploy) back to Roy Cloud for triage.
- **AI fix** — Roy AI suggests concrete fixes for each violation; one click applies the fix to the codebase and opens a PR.

The Suite is sold per-application-per-month, with pricing scaled by traffic. Free for open-source projects and personal sites.

---

## 2. Revenue Model

The RoyCSS revenue model is **layered**: a wide free funnel (the framework), recurring subscriptions for pro tooling, transaction fees from the marketplace, high-ticket enterprise contracts, and education revenue. No single product carries the business; the ecosystem does.

| Product | Free vs Paid | Pricing Model | Target Audience | Y1 Rev | Y2 Rev | Y3 Rev |
|---|---|---|---|---|---|---|
| Core Framework | 100% Free | — | All web developers | $0 | $0 | $0 |
| Pro Components | Paid | $199/yr per developer | Pro devs, agencies | $80K | $400K | $1.2M |
| Roy Studio | Freemium | $19/mo Pro, $49/mo Team | Designers, solo devs | $120K | $600K | $1.8M |
| Roy Cloud | Freemium | $0/9/29 per user/mo | Teams | $60K | $350K | $1.1M |
| Roy Marketplace | 15% commission | Per-transaction | Creators + buyers | $30K | $200K | $750K |
| Roy AI | Freemium | $0/15/49 per user/mo | All developers | $90K | $500K | $1.6M |
| Roy Enterprise | Paid | From $24K/yr per org | Enterprise | $150K | $700K | $2.4M |
| Roy Academy | Paid courses + cert | $49–$399 course, $199–$999 cert | Learners, job-seekers | $40K | $250K | $800K |
| Roy Inspector | Free | — | All developers | $0 | $0 | $0 |
| Roy DevTools | Free + paid AI | Bundled w/ Cloud | All developers | $0 | $0 | $0 |
| Roy Themes | Paid | $49–$299 one-time, $19/mo sub | Agencies, startups | $25K | $150K | $500K |
| Roy Motion Library | Paid | $99 one-time, or in Pro | Motion designers | $20K | $120K | $400K |
| Roy Accessibility Suite | Paid | $29–$299 per app/mo | Enterprise, regulated | $40K | $300K | $1.0M |
| **TOTAL** | | | | **$655K** | **$3.57M** | **$11.55M** |

### 2.1 Free vs Paid Boundaries (Detailed)

The single most important strategic discipline is **never to charge for what should be free, and never to give away what should be paid**. The boundary is governed by one rule: *the Core Framework stays free; everything that compounds in value with use, collaboration, or scale is paid*.

- **Free forever**: the 760 effects, RoyMotion primitives, the CLI, framework bindings, base token schema, single-developer use of Roy Cloud, single-project use of Roy Studio, all Roy Academy introductory courses.
- **Paid**: multi-developer collaboration (Cloud Team plan), commercial redistribution of components (Pro OEM), AI usage above the free quota, private marketplace listings, Enterprise SLA, certification exams, premium theme packs.

### 2.2 Pricing Rationale (Selected Products)

**Pro Components — $199/year.** Priced against Tailwind UI ($299 one-time, limited), Catalyst (sold per-seat, opaque), shadcn/ui (free but unsupported). $199/yr is below the price point that triggers procurement friction at small companies ($200/yr is typically expense-reportable, $500/yr requires manager approval) while high enough to signal "this is professional software." Lifetime value: a developer who renews for 5 years generates $995 — well above CAC.

**Roy Enterprise — from $24K/year.** Anchored against Storybook Enterprise (~$50K), Chromatic ($99–$499/mo per team), and Sentry Team ($26–$200/mo). $24K is the floor for "this is a serious vendor relationship with named support." Tiered: $24K (Team, up to 25 devs), $60K (Business, up to 100 devs), $150K+ (Enterprise, unlimited + on-prem). Multi-year discounts of 10% (2yr) and 20% (3yr).

**Roy Marketplace — 15% commission.** Below Gumroad (10% + payment fee ≈ 13%), below Envato (50%+), aligned with GitHub Sponsors (0% but no platform). 15% funds: curation, payment processing, hosting, creator support, anti-piracy enforcement. Sellers net more than any comparable platform.

**Roy Academy certification — $199–$999.** AWS Associate is $150; Professional is $300. RoyCSS pricing is competitive but not cheap — the certification must mean something. RoyCSS Architect at $999 is the premium tier, signaling "this person has shipped production RoyCSS at enterprise scale."

### 2.3 Revenue Concentration Risk and Mitigation

Year 1 revenue is heavily weighted toward Roy Enterprise ($150K of $655K = 23%). By Year 3, Enterprise becomes 21% of $11.55M, with Pro Components (10%), Studio (16%), AI (14%), Cloud (10%), Marketplace (7%), Academy (7%), Themes (4%), Motion (3%), A11y Suite (9%). No product exceeds 21% of revenue. This is the strategic value of the ecosystem: diversified revenue is more defensible than framework-only revenue.

---

## 3. Competitive Moat

### 3.1 The Thesis

A CSS framework is a commodity. CSS is a public web standard; utility classes are text; effects are CSS the browser parses. Anyone can ship a CSS framework. Many have. Most have died.

The RoyCSS moat is **not** the framework. The RoyCSS moat is the **ecosystem**: twelve products that compound in value as adoption grows, each of which is individually difficult to replicate and collectively impossible to replicate.

### 3.2 Why the Ecosystem Compounds

Every additional RoyCSS user does four things that strengthen the moat:

1. **Trains Roy AI.** Every prompt, every audit, every migration teaches the model. The 100,000th user benefits from the learnings of the 99,999 who came before. Competitors starting an AI product on day one start from zero.
2. **Populates the Marketplace.** Every creator who publishes a template or theme creates supply that only exists on RoyCSS. A competitor's empty marketplace cannot compete with RoyCSS's curated, reviewed catalog.
3. **Generates Roy Cloud token data.** Every team that syncs tokens to Cloud teaches us the patterns of real design systems. We use this to ship better default tokens, better Studio presets, better theme packs.
4. **Creates certification gravity.** Every RoyCSS Associate certified is a developer whose resume signals "I know RoyCSS." Employers post jobs asking for RoyCSS. Bootcamps teach RoyCSS. The gravity is self-reinforcing.

### 3.3 Competitive Comparison

The RoyCSS strategy borrows from five proven models, each adapted to the CSS domain:

**Tailwind UI model (commercial components on a free framework).** Tailwind UI proved that a free framework + paid components is viable. RoyCSS Pro Components applies the same model, but RoyCSS's effects-first DNA lets Pro Components include motion and visual effects that Tailwind UI cannot match. Tailwind UI's weakness is that it is one product; RoyCSS's Pro is one of twelve.

**Vercel model (framework + hosting + collaboration).** Vercel's genius is that Next.js is free, but Next.js is *better* on Vercel. Roy Cloud applies the same model: the framework is free, but Roy Cloud is where RoyCSS teams collaborate. Vercel's lock-in is deployment; RoyCSS's lock-in is the design-system source of truth.

**GitHub model (free public, paid private + enterprise).** GitHub's model is: public repos free forever, private repos paid, enterprise self-hosted at premium. Roy Cloud applies the same model: public token repos and themes are free; private repos require a Team plan; Enterprise self-hosts on-prem.

**Sentry model (per-event usage pricing + enterprise contracts).** Sentry's model is: generous free tier, paid tiers by event volume, Enterprise for SLA + on-prem. Roy Accessibility Suite applies the same model: free for low-traffic sites, paid by application traffic, Enterprise for SLA + on-prem.

**Prisma model (open-source ORM + paid Data Platform).** Prisma's model is: the ORM is free and best-in-class; Prisma Data Platform (hosting, collaboration, data browser) is paid. RoyCSS applies the same model: the framework is free; Roy Cloud is the Data Platform equivalent for tokens and themes.

### 3.4 Why Competitors Cannot Easily Copy

A competitor (say, Tailwind) could try to build any single RoyCSS product. They cannot build all of them, in coordination, fast enough.

- To match **Roy AI**, they need a fine-tuned model trained on RoyCSS-class vocabulary. They have no RoyCSS classes to train on; they would have to start with their own vocabulary, which means their AI is competing with their own framework's existing UX.
- To match **Roy Marketplace**, they need supply. Supply comes from creators. Creators go where the buyers are. Buyers go where the supply is. This is a chicken-and-egg problem that takes years and significant cash to solve (cf. Envato's 8-year journey to critical mass).
- To match **Roy Academy**, they need curriculum, certification infrastructure, exam-proctoring, and an instructor network. None of the CSS framework competitors has this. The closest analog (Tailwind's docs) is documentation, not education.
- To match **Roy Enterprise**, they need SOC 2 attestation, an enterprise sales team, LTS policy, and a customer-success function. Bootstrap-funded competitors cannot afford this; VC-funded competitors (Tailwind, via Tailwind Labs) could, but have chosen not to invest there.

The combination is the moat. Any one product is replicable. All twelve, in coordination, at the pace RoyCSS will ship them, is not.

### 3.5 The Lock-In Prevention Counter-Moat

Per `LABS-34-FRAMEWORK-KILLER.md`, RoyCSS's strategic move is *lock-in prevention, not lock-in creation*. Every RoyCSS product is designed so that switching *from* RoyCSS is trivial. This sounds counter-intuitive as a moat strategy; it is, in fact, the strongest moat strategy available.

When switching from RoyCSS is trivial, switching *to* RoyCSS is also trivial — and competitors' switching cost is high. Developers who have built on Tailwind's class vocabulary, who have purchased Tailwind UI templates, who have configured `tailwind.config.ts` — they face real switching costs to leave Tailwind. RoyCSS users face none: the framework is standard CSS, tokens are W3C DTCG JSON, components are framework-agnostic, themes are CSS files. RoyCSS wins not by trapping users but by being the easiest framework to arrive at and the easiest to leave — and the easiest to leave is rarely left.

---

## 4. Unique Features No Competitor Has

This section catalogs the ten features that no competitor — Tailwind, Bootstrap, UnoCSS, Panda CSS, StyleX, Bulma, Material UI, Open Props — currently ships. Each is a defensible innovation that compounds the RoyCSS moat.

### 4.1 Live Utility Search — Natural Language → Utilities

Type "subtle glassy card with a soft glow on hover" into the RoyCSS search bar; RoyCSS returns the matching combination of utilities and effects (`.roycss-glass-tinted-depth` + `.roycss-hover-glass-shatter` + token overrides) with live preview. This is not keyword search; it is semantic search powered by Roy AI's vector index of the 760-effect catalog. Competitors' search is string match against class names. RoyCSS's search is intent match against the full design vocabulary.

**Underlying tech**: embeddings of every effect's CSS, description, tags, and visual screenshot; cosine similarity against the prompt embedding; structured lookup for token references; LLM reranking for the top 10 results.

### 4.2 CSS Doctor CLI — `roycss doctor`

`roycss doctor` is the diagnostic command that runs against any RoyCSS project (or any CSS project, with reduced effectiveness) and returns a triage report:

- **Critical**: contrast failures below 3:1, missing focus-visible on interactive elements, missing reduced-motion variants on motion effects, broken ARIA on RoyCSS components.
- **Warnings**: non-OKLCH colors that should be converted, hand-written CSS that has a RoyCSS equivalent, oversized bundles, dead CSS, specificity violations (use of `!important`).
- **Suggestions**: effects that would improve a given element, tokens that should replace magic numbers, accessibility improvements.

Doctor is the **silent-failure** antidote (per `LABS-36-IMPOSSIBLE-QUESTION.md`): it surfaces the failures that the developer's eye cannot see. Free for individuals; scheduled scans + Roy Cloud integration paid.

### 4.3 Component Genome — The DNA of Every Component

Every RoyCSS component (free, Pro, Marketplace) ships with a **Genome file**: a structured manifest describing its composition. The Genome lists: which RoyCSS classes it uses, which tokens it reads, which RoyMotion animations it triggers, which framework bindings it exposes, its bundle size, its WCAG compliance level, its browser-support matrix, its dependency graph (which other components it composes).

The Genome enables:

- **Bundle optimization** — the CLI traverses Genomes to determine the minimum CSS to ship for a given set of used components.
- **Impact analysis** — "if I rename this token, which components break?" is answerable in 50ms.
- **Marketplace search** — "find me a date picker that uses `.roycss-glass-tinted-depth` and is WCAG AAA" is a structured query.
- **AI training** — Roy AI uses Genomes to understand how RoyCSS components are composed, so its generations are idiomatic.

No competitor ships a structured component manifest of this depth. The closest analog is the Storybook Args / Story metadata, which describes props, not composition.

### 4.4 CSS Playground with AI

The RoyCSS Playground (playground.roycss.dev) is a WebContainer-powered in-browser IDE: full project, not a snippet editor. Developers can spin up a Next.js + RoyCSS project in 2 seconds, prototype, and share. The AI layer lets you describe what you want ("add a hero section with a typewriter effect"), and the AI edits the project files in real time, with the changes visible in the live preview.

Playground is free. It is the **trial surface** for Roy Studio (which is the paid desktop version) and for Pro Components (which have a "Try in Playground" button on every docs page).

### 4.5 Design Diff — Screenshot Comparison

`roycss diff` is the visual-regression tool built for design-system work. It takes two screenshots (or two URLs, or two git commits) and produces a pixel-diff overlay — but it also produces a *token-level diff*: "the primary color changed from `oklch(0.62 0.19 259)` to `oklch(0.58 0.21 259)`, contrast against white text dropped from 4.8:1 to 4.3:1 (now below AA)."

This is something no competitor does. Existing visual-regression tools (Percy, Chromatic, Playwright) tell you *that* something changed. RoyCSS Design Diff tells you *what* changed and *whether it matters*. Integrated with Roy Cloud so every token change produces a Design Diff in the pull request.

### 4.6 Utility Explorer — Hover Any Class → See CSS, Perf, A11y

The Utility Explorer is a feature of Roy DevTools and the docs site. Hover over any RoyCSS class (in your code, in DevTools, or on a website with Roy Inspector active) and a popover shows:

- **CSS** — the full CSS for the class, syntax-highlighted, with the ability to copy.
- **Performance** — the rendered cost (CPU ms, paint ops, layer count) measured against a benchmark element; bundle-size contribution; whether it triggers layout, paint, or composite.
- **Accessibility** — whether the class is motion-safe (has a `prefers-reduced-motion` variant), whether it requires ARIA, contrast contribution, focus implications.
- **Used by** — which components and which Marketplace items use this class (powered by Component Genome).
- **Related** — similar classes, alternatives, the AI explanation.

No competitor offers this depth. Tailwind's docs page for a utility shows the CSS; RoyCSS's Utility Explorer shows the CSS *and* its real-world cost *and* its accessibility implications *and* its composition graph.

### 4.7 AI Migration — Bootstrap/Tailwind/CSS → RoyCSS

The Roy AI migration engine ingests a project (or a file, or a pastebin) written in Bootstrap, Tailwind, Material UI, Bulma, vanilla CSS, or styled-components, and produces a RoyCSS-equivalent project. It is not a 1:1 class swap; it is a *semantic* migration:

- `class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"` (Tailwind) → `class="roycss-btn roycss-btn-primary"` (RoyCSS), with the button using the design token `--roycss-color-primary` instead of hardcoded blue.
- Bootstrap's `card` → RoyCSS's `.roycss-card` with token-driven elevation and motion.
- A styled-components block → RoyCSS classes plus an explanatory comment.

The migration engine produces a PR-ready diff, a migration report (what changed, what was ambiguous, what needs human review), and a test plan (visual-regression snapshots before/after). Free for files; project-level migration requires Roy AI subscription. This is the **switching-cost destroyer** — it makes leaving a competitor near-free.

### 4.8 Pattern Library — 50+ Production Examples Per Use Case

The Pattern Library is a curated collection of production-ready patterns: "SaaS pricing table", "auth flow", "admin dashboard layout", "e-commerce product grid", "documentation search", "onboarding sequence", "settings panel". Each pattern has 50+ variations, each variation a complete RoyCSS implementation: HTML, framework-specific code (React, Vue, Svelte, Angular), live preview, copy button, GitHub link.

This is the answer to the developer's most common question: "how do I build X with this framework?" Tailwind's answer is "read the docs and figure it out." RoyCSS's answer is "here are 50 production examples of exactly X, copy the one you like."

### 4.9 CSS Benchmark — Live Competitive Comparison

`roycss benchmark` (or benchmark.roycss.dev) is a live, reproducible benchmark suite that compares RoyCSS against Tailwind, Bootstrap, UnoCSS, Panda CSS, StyleX, Bulma, and Material UI on:

- **Bundle size** — gzip CSS for equivalent UIs (a button, a card, a navbar, a dashboard).
- **Build time** — milliseconds to compile a 100-component project.
- **Runtime performance** — paint time, layout cost, frame rate for a motion-heavy page.
- **Developer velocity** — keystrokes and time to build a given UI (measured via user studies, refreshed quarterly).
- **Accessibility score** — axe-core audit on the equivalent UIs.

The benchmark is open-source, reproducible, and updated every release. It is the neutral arbiter of framework performance — and because RoyCSS is engineered natively on the modern web platform (per the Competitive Analysis), it wins on most axes. Even where it doesn't, the transparency builds trust.

### 4.10 Community Challenges — Monthly Contests

Every month RoyCSS runs a themed challenge: "Best glassmorphism login card", "Most satisfying microinteraction", "Best RoyMotion page transition", "Best accessibility-first component". Submissions are open to anyone; winners get cash prizes ($500/$250/$100), Marketplace featuring, RoyCSS swag, and the RoyCSS Discord role of Challenge Winner.

The challenges serve three purposes: (1) they generate Marketplace inventory (every submission can be listed); (2) they train Roy AI (every submission is data); (3) they build community gravity. Discord MAU, GitHub stars, and creator count are leading indicators of ecosystem health. Monthly challenges compound all three.

---

## 5. Sponsorship Program

RoyCSS offers four sponsorship tiers for organizations and individuals who want to support the open-source framework and gain visibility with the RoyCSS developer community. Sponsorship is processed via GitHub Sponsors (0% platform fee) and Open Collective (fiscal host).

### 5.1 Community Tier — $99/month

For individuals and small teams who use RoyCSS in production and want to support its development.

**Benefits:**
- "RoyCSS Community Sponsor" badge on GitHub and Discord
- Name listed on the RoyCSS sponsors page (roycss.dev/sponsors)
- RoyCSS sticker pack (quarterly)
- Priority issue triage (issues tagged `sponsor` are reviewed first)
- 10% discount on Pro Components and Roy Academy courses

### 5.2 Gold Tier — $499/month

For agencies and consultancies that build client projects on RoyCSS.

**Benefits:**
- All Community benefits
- "RoyCSS Gold Sponsor" logo on roycss.dev/sponsors (medium placement)
- One RoyCSS Pro Components license included ($199 value)
- One Roy Cloud Team plan included (5 seats, $145/mo value)
- Quarterly 1-hour call with the RoyCSS core team (roadmap, priorities, support)
- RoyCSS mentioned in one release notes per quarter
- 20% discount on Roy Enterprise contracts

### 5.3 Platinum Tier — $2,499/month

For companies whose products depend on RoyCSS and who want strategic influence.

**Benefits:**
- All Gold benefits
- "RoyCSS Platinum Sponsor" logo on roycss.dev/sponsors (premium placement, above-the-fold)
- Five RoyCSS Pro Components licenses included ($995 value)
- Roy Cloud Business plan included (25 seats, $725/mo value)
- Roy AI Business plan included (10 seats, $490/mo value)
- Monthly 1-hour call with the founder
- One RoyCSS feature sponsored per year (we build a feature you need, with your input, credited to you)
- Early access to RoyCSS V2, V3 features (3-month head start)
- 30% discount on Roy Enterprise contracts
- Speaking opportunity at the annual RoyCSS Conf

### 5.4 Technology Partner Tier — $10,000/month (custom)

For companies whose platforms integrate deeply with RoyCSS (cloud providers, CI/CD platforms, design tools, browser vendors).

**Benefits:**
- All Platinum benefits
- "RoyCSS Technology Partner" co-branded marketing
- Dedicated engineer liaison (we assign a RoyCSS engineer to your integration)
- RoyCSS Enterprise contract included (Team tier, $24K/yr value)
- Co-authored blog posts (4 per year)
- Joint webinars and conference talks (2 per year)
- RoyCSS roadmap input (your priorities are formally tracked)
- RoyCSS Inspector "Powered by {Partner}" placement
- First right of refusal on RoyCSS ecosystem partnerships in your category

**Current target Technology Partners (illustrative):** Vercel (hosting), Netlify (hosting), Cloudflare (CDN/edge), Figma (design integration), GitHub (registry), BrowserStack (cross-browser testing), Sentry (error monitoring), Vite (build tooling), Astro (framework integration).

### 5.5 Sponsorship Revenue Projection

| Tier | Y1 Sponsors | Y2 Sponsors | Y3 Sponsors | Y1 Rev | Y2 Rev | Y3 Rev |
|---|---|---|---|---|---|---|
| Community | 30 | 100 | 250 | $36K | $119K | $297K |
| Gold | 10 | 35 | 80 | $60K | $210K | $479K |
| Platinum | 3 | 12 | 30 | $90K | $360K | $900K |
| Tech Partner | 1 | 3 | 6 | $120K | $360K | $720K |
| **Total** | 44 | 150 | 366 | **$306K** | **$1.05M** | **$2.40M** |

Sponsorship revenue is high-margin (the only costs are the included licenses, which are marginal) and is reinvested into open-source maintenance, contributor bounties, and the RoyCSS Conf.

---

## 6. Go-to-Market Strategy

The RoyCSS go-to-market is sequenced in four phases over 36 months. Each phase has a single primary metric, a single primary product, and a single primary channel. Sequencing matters: each phase compounds the prior phase's adoption.

### 6.1 Phase 1 — Framework Adoption (Months 1–9)

**Primary metric:** Weekly npm downloads of the Core Framework.
**Primary product:** Core Framework (free).
**Primary channel:** Developer content (blog, YouTube, conference talks, Twitter/X, Hacker News).

Phase 1 is pure top-of-funnel. The Core Framework is the product; adoption is the metric. We do not monetize in Phase 1. We invest in:

- **Documentation** — the best CSS-effects docs ever shipped (per `DOCUMENTATION-SITE.md`): every effect discoverable in 30 seconds, live preview, copy-paste, framework-agnostic tabs, AI search, sub-1s TTI.
- **Content** — weekly YouTube tutorials, monthly deep-dive blog posts, conference talks at JSConf, CSSConf, React Conf, Vue Conf. Royford is a developer advocate (per LinkedIn); this is his native channel.
- **Community** — Discord (target 5K members by month 9), GitHub Discussions, weekly contributor office hours, monthly community challenges (per §4.10).
- **SEO** — every effect gets a static page (`/effects/<id>`) with rich metadata; this is the long-tail SEO play that compounds for years.

**Targets:** Month 9 — 50K weekly npm downloads, 15K GitHub stars, 5K Discord MAU, 200 contributors, 1M monthly docs visits.

### 6.2 Phase 2 — Pro Components + Marketplace (Months 9–18)

**Primary metric:** Pro Components ARR + Marketplace GMV.
**Primary products:** Pro Components, Roy Marketplace, Roy Themes, Roy Motion Library.
**Primary channel:** Product-led growth (in-product upsell) + creator outreach.

Phase 2 introduces the first paid products. The Core Framework's adoption (from Phase 1) is the funnel; Pro Components and the Marketplace are the monetization. We invest in:

- **In-product upsell** — the docs site shows Pro Component previews with a "Unlock with Pro" CTA. The CLI shows Pro components in `roycss list` results with a `pro` tag.
- **Marketplace supply** — we hand-recruit the first 50 creators (paid bounties for the first 100 templates) so the Marketplace launches with critical mass. Empty marketplaces fail; we will not launch empty.
- **Roy Themes** — we commission 5 first-party theme packs (Healthcare, SaaS, Fintech, Education, E-commerce) for launch.
- **Roy Motion Library Premium** — launches alongside Pro Components, included in Pro subscription.

**Targets:** Month 18 — 2,000 Pro Components subscribers ($400K ARR), $1.5M Marketplace GMV, 500 Marketplace items, 100 active creators.

### 6.3 Phase 3 — Studio + AI + Cloud (Months 18–27)

**Primary metric:** Roy Cloud MRR + Roy AI MAU.
**Primary products:** Roy Studio, Roy Cloud, Roy AI, Roy DevTools, Roy Accessibility Suite.
**Primary channel:** Team expansion (multi-seat Cloud plans) + AI viral loops.

Phase 3 is the platform phase. Studio and Cloud turn RoyCSS from a personal tool into a team tool. Roy AI turns RoyCSS from a framework into a copilot. We invest in:

- **Roy Studio launch** — cross-promoted to the existing 50K+ weekly npm downloaders. Free tier (single project, local-only) drives adoption; Team tier drives revenue.
- **Roy Cloud Team plans** — the killer feature is live multi-cursor token editing (Figma-style). This is the feature that converts solo users into team subscribers.
- **Roy AI** — launches with generate/audit/optimize/migrate/explain. Free quota (50 prompts/mo) drives adoption; paid tiers drive revenue. Every Roy AI prompt that generates good code is a training data point.
- **Roy DevTools** — free browser extension; the AI panel drives Cloud subscriptions.
- **Roy Accessibility Suite** — launches in CI mode first; runtime RUM mode follows in Month 24.

**Targets:** Month 27 — 8,000 Cloud subscribers ($350K MRR), 25K Roy AI MAU, 4,000 Studio subscribers, 500 A11y Suite subscribers.

### 6.4 Phase 4 — Enterprise + Academy + Inspector (Months 27–36)

**Primary metric:** Enterprise ARR + Academy certification count.
**Primary products:** Roy Enterprise, Roy Academy, Roy Inspector.
**Primary channel:** Direct enterprise sales + university partnerships.

Phase 4 is the long-tail-revenue phase. Enterprise and Academy are slow-burn, high-LTV products that require the prior three phases' adoption as proof points. We invest in:

- **Roy Enterprise sales** — hire 2 enterprise Account Executives in Month 27; target Fortune 500 design-system teams. Reference customers from Phase 1–3 (we will have several high-profile adopters by this point).
- **Roy Academy launch** — 6 courses, 4 certification tiers. Partner with 3 bootcamps (generalist, frontend, design-system) to embed RoyCSS in their curricula. Partner with 5 universities for the `/teach` curriculum.
- **Roy Inspector** — launched as a free Chrome extension in Month 28; integrated with Roy AI and Roy Cloud. Inspector is the always-on top-of-funnel for the entire ecosystem — every inspection of any website is a brand impression.
- **RoyCSS Conf** — first annual conference in Month 32 (500 attendees, virtual + hybrid). Sponsored by Platinum and Technology Partner sponsors.

**Targets:** Month 36 — 50 Enterprise customers ($2.4M ARR), 5,000 Academy certifications issued, 200K Inspector weekly active users, 500 Conference attendees.

---

## 7. Success Metrics

RoyCSS measures success across four dimensions: **adoption** (the funnel), **revenue** (the business), **community** (the moat), and **developer satisfaction** (the leading indicator of all three). Every metric has a Year 1 / Year 2 / Year 3 target. Every metric is reviewed monthly by the core team and quarterly by advisors.

### 7.1 Adoption Metrics

| Metric | Y1 Target | Y2 Target | Y3 Target | Source |
|---|---|---|---|---|
| Weekly npm downloads (Core Framework) | 50K | 200K | 600K | npm stats API |
| GitHub stars | 15K | 40K | 100K | GitHub API |
| GitHub contributors | 200 | 600 | 1,500 | GitHub API |
| npm trends rank (CSS frameworks) | Top 10 | Top 5 | Top 3 | npmtrends.com |
| Docs monthly visits | 1M | 4M | 12M | Plausible Analytics |
| Playground monthly sessions | 50K | 250K | 800K | Internal analytics |
| Inspector weekly active users | — | 50K (Q3 Y2) | 200K | Chrome Web Store |
| RoyCSS websites detected (BuiltWith) | 5K | 30K | 150K | BuiltWith API |

### 7.2 Revenue Metrics

| Metric | Y1 | Y2 | Y3 | Source |
|---|---|---|---|---|
| Total ARR | $655K | $3.57M | $11.55M | Finance |
| MRR (Cloud + Studio + AI + A11y) | $35K | $230K | $780K | Stripe |
| Pro Components ARR | $80K | $400K | $1.2M | Stripe |
| Enterprise ARR | $150K | $700K | $2.4M | Contracts |
| Marketplace GMV | $200K | $1.3M | $5M | Internal |
| Marketplace take rate | 15% | 15% | 15% | — |
| Sponsorship MRR | $25K | $87K | $200K | GitHub Sponsors + Open Collective |
| Net Revenue Retention | — | 110% | 120% | Finance |
| Gross margin | 80% | 82% | 85% | Finance |

### 7.3 Community Metrics

| Metric | Y1 | Y2 | Y3 | Source |
|---|---|---|---|---|
| Discord MAU | 5K | 20K | 60K | Discord API |
| Marketplace creators | 100 | 500 | 1,500 | Internal |
| Marketplace items | 500 | 2,500 | 8,000 | Internal |
| Roy Themes published (first-party + community) | 5 | 25 | 75 | Internal |
| Community Challenge submissions per month | 50 | 200 | 500 | Internal |
| Conference attendees (RoyCSS Conf) | — | — | 500 | Event |
| Universities teaching RoyCSS | 1 | 8 | 25 | Outreach |
| Bootcamps embedding RoyCSS | 1 | 5 | 15 | Outreach |

### 7.4 Developer Satisfaction Metrics

| Metric | Y1 | Y2 | Y3 | Source |
|---|---|---|---|---|
| NPS (Core Framework) | 50 | 60 | 70 | Quarterly survey |
| NPS (Pro Components) | 45 | 55 | 65 | Quarterly survey |
| NPS (Roy Cloud) | 40 | 55 | 65 | Quarterly survey |
| NPS (Roy Enterprise) | 50 | 60 | 70 | Quarterly survey |
| Time-to-value (TTV) — first effect on a page | <5 min | <3 min | <2 min | Playground telemetry |
| Time-to-value (TTV) — first Pro component | <15 min | <10 min | <5 min | Onboarding telemetry |
| Retention (12-month Core Framework) | 60% | 70% | 80% | npm install telemetry |
| Retention (12-month Cloud Team) | 75% | 85% | 90% | Stripe |
| Retention (12-month Pro Components) | 70% | 80% | 88% | Stripe |
| GitHub issue median time-to-first-response | 8 hours | 4 hours | 2 hours | GitHub API |
| GitHub issue median time-to-close | 14 days | 7 days | 4 days | GitHub API |

### 7.5 North Star Metric

The RoyCSS North Star is **Weekly Active RoyCSS Developers (WARD)**: the number of unique developers who, in a given week, either (a) install the Core Framework via npm, (b) run the `roycss` CLI, (c) open Roy Studio, (d) push to Roy Cloud, (e) open Roy DevTools, or (f) run Roy AI. This single metric captures the health of the entire ecosystem — adoption, paid products, community, and satisfaction all flow through it.

**Targets:** Y1 — 25K WARD · Y2 — 100K WARD · Y3 — 350K WARD.

---

## 8. Closing — The Ten-Year Horizon

RoyCSS today is a CSS-effects framework with 760 effects, a clean architecture, a clear competitive position, and a single full-time maintainer. In ten years, RoyCSS will be a developer ecosystem: the framework that an entire generation of developers learned CSS on, the design-system platform that enterprises standardize on, the marketplace where creators make a living, the AI that understands CSS better than any human, and the certification that recruiters list in job postings.

The path from here to there is specified in this document: twelve products, layered across four ecosystem tiers, sequenced in four go-to-market phases, measured by four metric dimensions, and moated by the compounding network effects of the ecosystem rather than the framework alone.

The framework is the seed. The ecosystem is the forest. We plant the seed today; we tend the forest for a decade.

---

*End of document. 5,400+ words. Versioned at `/docs/PLATFORM-VISION.md`. Next review: 2026-Q2.*
