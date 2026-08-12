# RoyCSS QA Audit Fix - Multi-Agent Execution Prompt

## Context

You are a team of senior engineers tasked with fixing all issues identified in the QA audit of the RoyCSS platform landing page (roycss.space-z.ai). The audit found 4 critical, 6 high, and 6 medium-priority issues across SEO, accessibility, performance, and PWA compliance. The complete audit report with detailed findings, evidence, and remediation guidance is available at `./RoyCSS_QA_Audit_Report.pdf` in this repository.

**Target Repository:** `<YOUR_TARGET_REPO_URL>` (the repository you are routing changes to)
**Source Site:** https://roycss.space-z.ai/
**Working Branch:** Create a new branch `fix/qa-audit-august-2026` from `main`

---

## IRON RULES - READ FIRST

1. **NO FEATURE REMOVALS.** Do not remove any existing feature, component, effect, section, tool, product listing, animation, navigation item, FAQ entry, search bar, filter, tab, card, button, webhook, API endpoint, or any other functionality. The only exception is removing duplicate/invalid meta tags that are actively causing bugs (e.g., the conflicting `style="color-scheme: light"` on the HTML element). Before removing anything, you MUST confirm it is genuinely redundant and not serving any purpose.

2. **NO CONTENT DELETION.** Do not delete or shorten any existing text content, descriptions, effect labels, FAQ answers, section headings, or documentation. You may ADD content (e.g., missing aria-labels, structured data, meta tags) but never remove existing content.

3. **PRESERVE ALL FUNCTIONALITY.** Every interactive element must continue to work exactly as before after your changes. This includes: all 1,569+ effect cards, all 62 platform product buttons, all navigation items, all search inputs, all filter buttons, all FAQ accordions, the theme toggle, the tutorial overlay, keyboard shortcuts (Cmd+K search, ? for shortcuts, F8 for notifications), and the entire WebGL effects carousel.

4. **GIT SAFETY.** Every change must be on the `fix/qa-audit-august-2026` branch. Commit frequently with descriptive messages. Each agent's work should be in separate, logically grouped commits. Never force-push. Never rewrite history. Never commit directly to `main`.

5. **NO STOPPING UNTIL DONE.** Continue working through every single issue in this prompt until all fixes are implemented, tested, confirmed, and verified ready for production. Do not skip any issue. Do not leave partial fixes.

---

## Repository Setup

```bash
# 1. Clone the target repository
# git clone <YOUR_TARGET_REPO_URL> roycss-fix
# cd roycss-fix

# 2. Create and switch to the fix branch
git checkout -b fix/qa-audit-august-2026

# 3. Verify the project builds
npm install
npm run build  # or whatever the build command is
npm run dev     # verify it starts
```

---

## AGENT 1: SEO and Meta Tags Specialist

### Tasks:

**1.1 Fix Canonical URL Mismatch (CRITICAL)**
- Find the `<link rel="canonical">` tag in the head
- If this is the production domain (roycss.com), update it to `https://roycss.com/`
- If this is the staging domain (roycss.space-z.ai), update it to `https://roycss.space-z.ai/`
- Also update `og:url` meta property to match the canonical URL
- **DO NOT** change any other URL references, only canonical and og:url

**1.2 Add Open Graph Image (CRITICAL)**
- Create or source a 1200x630px OG image for the platform (save as `public/og-image.png`)
- Add to `<head>`:
  ```html
  <meta property="og:image" content="https://roycss.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="RoyCSS - AI-Native Frontend Engineering Platform" />
  <meta name="twitter:image" content="https://roycss.com/og-image.png" />
  ```

**1.3 Add JSON-LD Structured Data (HIGH)**
- Add a `<script type="application/ld+json">` block in the `<head>` with SoftwareApplication schema:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RoyCSS",
    "description": "AI-native frontend engineering platform with 1,569+ CSS effects, 62 platform products, and 64 developer tools.",
    "url": "https://roycss.com",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  }
  ```

**1.4 Fix robots.txt Sitemap URL (HIGH)**
- Find `public/robots.txt` (or equivalent)
- Update the `Sitemap:` URL to match the canonical domain

**1.5 Commit**
```bash
git add -A
git commit -m "fix(seo): resolve canonical URL mismatch, add og:image, add JSON-LD structured data, fix robots.txt sitemap URL"
```

---

## AGENT 2: Accessibility Engineer

### Tasks:

**2.1 Fix Color-Scheme Conflict (CRITICAL)**
- Find the `<html>` element (likely in `app/layout.tsx` or `app/layout.jsx`)
- Remove `style="color-scheme: light"` from the `<html>` tag
- The `class="dark"` should be sufficient to control the theme
- If a `color-scheme` style is needed, it should be dynamically set by the theme toggle JavaScript, NOT hardcoded in the HTML
- Verify: after the fix, the page should still render in dark mode with matching native UI elements

**2.2 Add aria-label to 14 Tab Elements (HIGH)**
- Find all `[role="tab"]` elements without `aria-label`
- There are two tablist groups:
  - **WebGL effect selector** tabs (4 tabs): Add `aria-label` to each tab (e.g., `aria-label="3D Tubes Cursor effect"`)
  - **Platform content filter** tablist (10 tabs): First add `aria-label="Platform content filter"` to the tablist container, then add `aria-label` to each tab (e.g., `aria-label="Trending content"`)
- For the WebGL tabs, also add `aria-controls` pointing to their respective tabpanel IDs

**2.3 Add aria-label to 22 Unlabeled div[role="button"] Cards (HIGH)**
- Find all `div[role="button"]` elements that lack `aria-label` in the templates, recipes, and collections sections
- Add `aria-label` following the pattern of the already-labeled buttons: `aria-label="View details for [Card Title]"`
- Do NOT change the visual appearance of these cards
- Do NOT change the role or element type (keep `div[role="button"]` as-is to minimize diff)

**2.4 Add ID Attributes to 5 Search Inputs (MEDIUM)**
- Add unique `id` attributes:
  - Effects search: `id="search-effects"`
  - Recipes search: `id="search-recipes"`
  - Patterns search: `id="search-patterns"`
  - Collections search: `id="search-collections"`
  - Platform products search: `id="search-platform"`

**2.5 Add aria-label to Main Landmark (MEDIUM)**
- Find the `<main>` element and add `aria-label="RoyCSS platform content"`

**2.6 Fix Duplicate Favicon Requests (HIGH)**
- Audit `<head>` for duplicate `<link rel="icon">` tags
- Remove any duplicate, keeping only one canonical reference

**2.7 Commit**
```bash
git add -A
git commit -m "fix(a11y): resolve color-scheme conflict, add aria-labels to 14 tabs + 22 card buttons, add search input IDs, label main landmark, fix duplicate favicon"
```

---

## AGENT 3: Performance Engineer

### Tasks:

**3.1 Code-Split the 892 KB JS Chunk (CRITICAL)**
- Identify the component(s) causing the 892 KB chunk (likely the effects catalog, animation reference table, or platform section)
- Implement dynamic imports using Next.js `dynamic()` or `React.lazy()` for below-the-fold sections
- Target sections for lazy loading:
  - Effects catalog grid (loads when user scrolls near it)
  - Animation reference table (loads when section becomes visible)
  - Platform products grid (loads when section becomes visible)
  - Collections section
  - Templates section
  - Recipes section
- Add loading skeleton/fallback components for each lazy-loaded section
- **CRITICAL:** The initial above-the-fold content (hero, navigation, "What is RoyCSS" section) MUST remain synchronously loaded
- Verify: all lazy sections still render correctly when scrolled into view

**3.2 Fix Onboarding Tutorial Persistence (HIGH)**
- Find the tutorial/onboarding component
- Implement localStorage-based persistence:
  - On first visit: show the tutorial
  - After completion or dismissal: store `roycss-tutorial-completed=true` in localStorage
  - On subsequent visits: check localStorage and skip the tutorial if completed
- Add a "Take Tour" button in the navigation for users who want to re-trigger it
- Ensure Escape key dismisses the tutorial

**3.3 Commit**
```bash
git add -A
git commit -m "fix(perf): code-split 892KB chunk with dynamic imports, add loading skeletons, persist tutorial state in localStorage"
```

---

## AGENT 4: PWA and Metadata Specialist

### Tasks:

**4.1 Update PWA Manifest Description (MEDIUM)**
- Find `public/manifest.json`
- Update the `description` field to match current platform metrics
- Update from: `"1569+ production-ready CSS effects with live demos, 29 developer tools, CLI, and MCP server."`
- Update to: `"1569+ production-ready CSS effects with live demos, 64 developer tools, 62 platform products, CLI, and MCP server."`

**4.2 Add Multiple Icon Sizes to Manifest (MEDIUM)**
- Generate icon variants at 192x192 and 512x512 from the existing 1024x1024 icon
- Add them to the `icons` array in `manifest.json`:
  ```json
  { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "/favicon.png", "sizes": "1024x1024", "type": "image/png", "purpose": "any" },
  { "src": "/apple-icon.png", "sizes": "1024x1024", "type": "image/png", "purpose": "maskable" }
  ```

**4.3 Commit**
```bash
git add -A
git commit -m "fix(pwa): update manifest description to current metrics, add 192x192 and 512x512 icon sizes"
```

---

## AGENT 5: Verification and QA Lead (Runs Last)

### Tasks:

**5.1 Build Verification**
```bash
npm run build  # Must succeed with zero errors
npm run lint   # Must pass all linting rules
```

**5.2 Full Regression Test**
- Start the dev server (`npm run dev`)
- Verify EVERY section of the page is present and functional:
  - [ ] Hero section with title, npm install command, and CTA buttons
  - [ ] "What is RoyCSS?" section with all 4 feature cards
  - [ ] "From idea to production" 4-step flow
  - [ ] "Who is it for?" section with all 4 audience cards
  - [ ] "Featured Effects" carousel with WebGL effects
  - [ ] All animation effect cards (Pulse Glow, Bounce In, Fade In Up, etc.)
  - [ ] "Get Started" section with install/import/customize/ship steps
  - [ ] Effects browser with all category filters (14 categories)
  - [ ] All tag filters (20+ tags)
  - [ ] Patterns section with search and all pattern cards
  - [ ] Collections section with search and all collection cards
  - [ ] Templates section with all template cards
  - [ ] Recipes section with search and all recipe cards
  - [ ] Platform Products section with all tabs and products (62 items)
  - [ ] Understanding RoyCSS taxonomy section
  - [ ] Animation reference table (all classes listed)
  - [ ] FAQ section with all 20 questions
  - [ ] Footer with all links
  - [ ] Navigation with all items
  - [ ] Theme toggle (dark/light)
  - [ ] Search (Cmd+K)
  - [ ] Tutorial overlay

**5.3 SEO Verification**
- View page source and verify:
  - [ ] `<link rel="canonical">` points to correct domain
  - [ ] `og:url` matches canonical
  - [ ] `og:image` is present with valid URL
  - [ ] `twitter:image` is present
  - [ ] JSON-LD structured data is valid (copy to https://search.google.com/test/rich-results)
  - [ ] robots.txt sitemap URL matches canonical domain

**5.4 Accessibility Verification**
- Run axe-core or Lighthouse accessibility audit:
  - [ ] Zero critical or serious accessibility violations
  - [ ] All tabs have aria-labels
  - [ ] All card buttons have aria-labels
  - [ ] Main landmark has aria-label
  - [ ] Color-scheme is consistent (no dark content + light native UI mismatch)
  - [ ] All search inputs have IDs
  - [ ] No duplicate favicon requests in Network tab

**5.5 Performance Verification**
- Run Lighthouse performance audit:
  - [ ] No single JS chunk exceeds 300 KB
  - [ ] Initial JS payload is under 200 KB
  - [ ] All lazy-loaded sections render when scrolled into view
  - [ ] No console errors
  - [ ] CLS remains 0

**5.6 PWA Verification**
- Check manifest.json:
  - [ ] Description matches current platform metrics
  - [ ] Multiple icon sizes present (192, 512, 1024)

**5.7 Final Commit and PR**
```bash
# Push the branch
# git push origin fix/qa-audit-august-2026

# Create a pull request with this description:
# Title: fix: resolve all QA audit findings (4 critical, 6 high, 6 medium)
#
# This PR addresses all findings from the August 2026 QA audit:
#
# Critical:
# - Fix canonical/OG URL mismatch
# - Add og:image for social sharing previews
# - Resolve color-scheme conflict (dark class vs light style)
# - Code-split 892KB JS chunk into lazy-loaded sections
#
# High:
# - Add aria-labels to 14 tabs and 22 card buttons
# - Add JSON-LD structured data for SEO
# - Fix duplicate favicon requests
# - Persist tutorial state in localStorage
# - Fix robots.txt sitemap URL
#
# Medium:
# - Add IDs to 5 search inputs
# - Label main landmark
# - Update PWA manifest description
# - Add multiple icon sizes to manifest
#
# Verified:
# - All existing features preserved (1,569+ effects, 62 products, 64 tools)
# - Build succeeds with zero errors
# - No console errors
# - All sections render correctly
# - Accessibility violations resolved
```

---

## Execution Order

```
Agent 1 (SEO)     +---> Agent 5 (QA Lead)
Agent 2 (a11y)    +---> Agent 5 (QA Lead)
Agent 3 (Perf)    +---> Agent 5 (QA Lead)
Agent 4 (PWA)     +---> Agent 5 (QA Lead)
```

- Agents 1-4 can work in PARALLEL (they touch different files)
- Agent 5 runs AFTER all other agents complete (it needs the full codebase with all fixes)
- If agents must work sequentially due to file conflicts, use this order: 2 (a11y) > 1 (SEO) > 4 (PWA) > 3 (Perf) > 5 (QA)

---

## What NOT to Do

- Do NOT refactor code structure or reorganize file layout
- Do NOT upgrade dependencies or change package versions
- Do NOT modify any CSS styling, colors, fonts, or visual design
- Do NOT change the navigation structure or page layout
- Do NOT remove the tutorial overlay (just add persistence)
- Do NOT modify any effect implementations or animations
- Do NOT change any API routes or backend logic
- Do NOT modify any existing aria-labels that are already correct
- Do NOT add new features that were not requested in this audit
- Do NOT change the Next.js configuration unless specifically required for code-splitting
- Do NOT modify the content of any FAQ answers, effect descriptions, or product descriptions
- Do NOT touch the heading hierarchy (h1/h2/h3 structure) - that is a content design decision
- Do NOT change `maximum-scale=5` in the viewport meta - that requires design team consultation

## Completion Criteria

The task is COMPLETE when ALL of the following are true:
1. `npm run build` succeeds with zero errors
2. `npm run lint` passes (or no new warnings beyond pre-existing ones)
3. All 4 critical issues are fixed and verified
4. All 6 high-priority issues are fixed and verified
5. All 6 medium-priority issues are fixed and verified
6. Every section listed in Agent 5's regression test checklist is confirmed present and functional
7. No existing features, content, or functionality have been removed or broken
8. All commits are on the `fix/qa-audit-august-2026` branch
9. The branch is ready for pull request creation and code review