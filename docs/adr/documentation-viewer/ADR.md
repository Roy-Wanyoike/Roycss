# ADR — Documentation Viewer

**Status:** Accepted · **Date:** 2026-Q1
**Scope:** Architectural decisions for the in-app documentation viewer (`src/components/roycss/docs-viewer.tsx` + `scripts/generate-docs-index.ts` + `src/lib/docs-data.ts`).

---

## ADR-001 — Use a Sheet (side panel), not a Dialog or inline Section

**Context.** The navbar "Docs" button currently scrolls to `<section id="docs">`, which renders six static `DocCard` tiles. We need to surface the 19 markdown architecture documents in `/docs/*.md`. The site is constrained to a single route (`/`), so a `/docs` route is not permitted.

**Options considered.**
1. Sheet (Radix Dialog used as a side panel).
2. Centered Dialog modal.
3. Replace the existing `<section id="docs">` with an inline markdown renderer.

**Decision.** Use a **Sheet** (`side="right"`, `sm:max-w-2xl`).

**Rationale.**
- The Sheet matches the existing `FavoritesSheet` pattern already shipped on this page — consistent UX, consistent keyboard model, consistent animations.
- A side panel preserves page context (the hero, effects grid, etc. remain visible behind the overlay), which is what users expect from a "Docs" button that doesn't navigate away.
- A centered Dialog would obscure the page and compete with `EffectDetailDialog` for modal stacking.
- Replacing the inline section would balloon the page DOM (~200 KB of markdown rendered into the document) and break the existing DocCard hub.

**Consequences.**
- Width is constrained to 672 px (`sm:max-w-2xl`); long code lines wrap or scroll. Accepted — code blocks have `overflow-x-auto`.
- The existing `<section id="docs">` stays in place as a navigation hub; the navbar button's behavior changes from `scrollToSection("#docs")` to `setDocsOpen(true)`.

---

## ADR-002 — Hand-rolled CommonMark-subset markdown renderer (not react-markdown)

**Context.** `react-markdown@10` is already in `package.json` (used elsewhere). The doc corpus is 19 files using a narrow, predictable markdown subset.

**Options considered.**
1. `react-markdown` + `remark-gfm` (already installed).
2. `marked` or `markdown-it` (new dep).
3. Hand-rolled renderer covering ~10 node types.

**Decision.** **Hand-rolled renderer** covering headings (H1–H4), fenced code blocks, inline code, bold, italic, strikethrough, links, ordered/unordered lists (1 level of nesting), blockquotes, horizontal rules, and paragraphs.

**Rationale.**
- The 19 docs use a narrow, stable subset of markdown. A hand-rolled renderer is ~200 lines and adds 0 bytes to the dependency graph.
- `react-markdown@10` pulls `unified` + `remark` + `rehype` (~80 KB min) into the client bundle for a Sheet that opens on click. The hand-rolled renderer ships inside the dynamically-imported `DocsViewer` chunk and is ~3 KB min+gzip.
- Full GFM (tables, footnotes, math, task lists) is not used in this doc set; YAGNI.
- Deterministic output makes styling predictable — every `<h2>` gets a slug, every `<pre>` gets the same class.

**Consequences.**
- We maintain ~200 lines of markdown parsing code. The subset is documented in `DESIGN.md §3` and tested against the 19 actual docs.
- Tables, footnotes, and raw HTML are not rendered. None of the 19 docs use them (verified by the build script).
- All text tokens are HTML-escaped before rendering; `javascript:` URLs are dropped (defense-in-depth, even though the content is author-controlled).

---

## ADR-003 — No syntax highlighter; themed `<pre><code>` with language badge + copy button

**Context.** The docs contain CSS, TypeScript, bash, and JSON snippets. Options are shiki, Prism, highlight.js, or no highlighter.

**Options considered.**
1. shiki (VS Code-quality, accurate grammars).
2. Prism (mature, per-language imports).
3. highlight.js (auto-detect, one import).
4. No highlighter — themed monospace block.

**Decision.** **No highlighter.** Code blocks render as `<pre class="roycss-doc-code"><code>…</code></pre>` with a dark background, monospace font, language badge in the top-right, and a copy button.

**Rationale.**
- shiki would add ~1 MB of grammar JSON to the client bundle; not acceptable for a click-to-open Sheet.
- Prism/hl.js would add 15+ language components and a CSS theme; ~30–50 KB for marginal value on prose-illustrative snippets.
- The doc snippets are short and readable without token coloring — the surrounding prose gives context.
- The dark themed block matches the existing `glass` aesthetic and works in both light and dark site themes.
- A copy button provides the highest-value affordance (users want to paste CSS into their project).

**Consequences.**
- No token coloring. Accepted — readability is high because the font is `ui-monospace` and the contrast is 13.4:1.
- Adding a highlighter later would be a drop-in replacement of the `<pre>` rendering path; the rest of the component is untouched.

---

## ADR-004 — Case-insensitive substring search with three-tier ranking (not fuzzy)

**Context.** 19 docs, ~200 KB total content. Users need to find a doc by title, category, or content.

**Options considered.**
1. Fuzzy search (fuse.js, mini-fzf).
2. Case-insensitive substring with bucket ranking.
3. Full-text index (FlexSearch, lunr).

**Decision.** **Case-insensitive substring** with three-tier ranking:
- Bucket 0: title contains query.
- Bucket 1: category label contains query.
- Bucket 2: raw content contains query.
- Sort by bucket asc, then title alphabetic.
- Empty query → all docs, sorted by category then title.

**Rationale.**
- With 19 docs, a single pass over the content is < 1 ms on any device. Fuzzy scoring adds complexity and opacity for zero perceptible benefit at this corpus size.
- Three-tier ranking gives users the predictable "title match first" behavior they expect from a docs search.
- FlexSearch/lunr would add 5–15 KB and a build-time indexing step for no gain at this scale.
- 80 ms input debounce keeps the search responsive on low-end mobile without re-scanning on every keystroke.

**Consequences.**
- No typo tolerance. Accepted — users searching docs typically type the correct term.
- Search is exact-substring; "reinvent" matches "REINVENT-CSS" but not "reinventcss". The content lowercasing makes this case-insensitive but not typo-insensitive.

---

## ADR-005 — Build-time doc discovery via `scripts/generate-docs-index.ts` → `src/lib/docs-data.ts`

**Context.** The viewer is a client component (a Sheet). Next.js client components cannot use `fs` at runtime. We need to get 19 markdown files into the client bundle.

**Options considered.**
1. **Build-time script → generated TS module** (`src/lib/docs-data.ts`).
2. `fs.readFileSync` in a Server Component, pass content as props.
3. `import.meta.glob` (Vite-only — not available in Next.js).
4. Raw `?raw` imports with webpack `asset/source` rule.

**Decision.** **Build-time script.** `scripts/generate-docs-index.ts` reads `docs/*.md`, derives `{ slug, title, category, categoryLabel, description, wordCount, content }` for each, and writes `src/lib/docs-data.ts` exporting `docsIndex: DocEntry[]`.

**Rationale.**
- Pure static import in the client component — no `fs` at runtime, no RSC serialization, no edge-runtime caveats.
- The script runs once at build time (or on demand); the generated module is checked in so the app works without the script being run in CI.
- Category mapping reuses the same prefix table as `scripts/build-docs.ts` (Architecture / Product / Quality / Growth / Tooling) for consistency with the existing docs-overlay pipeline.
- `import.meta.glob` is Vite-only; Next.js 16 (turbopack) does not support it.
- Raw `?raw` imports require webpack config tweaks that are fragile across Next versions and would touch `next.config.ts` (outside this task's ownership).
- Server Component + props would serialize 200 KB of markdown into the RSC payload on every page render, even when the user never opens the Sheet.

**Consequences.**
- The generated file (`src/lib/docs-data.ts`, ~220 KB) is checked in. When docs change, re-run `bun run scripts/generate-docs-index.ts`. This is documented in the file header.
- The script uses Bun's `import.meta.dir` for path resolution — portable across `bun run` and `bunx`.
- To keep the main page bundle small, `DocsViewer` is dynamically imported (`next/dynamic`, `ssr: false`) so the 50 KB gzip of markdown only ships when the Sheet opens.

---

## ADR-006 — Navbar "Docs" button opens the Sheet instead of scrolling

**Context.** The navbar "Docs" button and mobile menu "Docs" item currently call `scrollToSection("#docs")`. The footer also has a "Docs" button. The `<section id="docs">` is preserved as a static navigation hub.

**Decision.** Wire the **navbar desktop button** and **mobile menu item** to `setDocsOpen(true)`. Leave the **footer "Docs" button** as `scrollToSection("#docs")` (it's a secondary navigation affordance and the section is still valuable as a cards hub).

**Rationale.**
- The navbar is the primary "I want to read the docs" entry point — users expect it to open the viewer.
- The footer is a secondary "jump to the docs section of this page" affordance — keeping it as a scroll keeps the section reachable and preserves the existing in-page nav model.
- Mobile menu item follows the navbar pattern (open the Sheet) for consistency.

**Consequences.**
- `activeSection === "docs"` highlight on the navbar button no longer applies when the Sheet is open. The button gains a pressed/active style bound to `docsOpen` instead.
- The `<section id="docs">` remains in the page; `SectionScrollbar` and the `scrollToSection` infrastructure are untouched.
