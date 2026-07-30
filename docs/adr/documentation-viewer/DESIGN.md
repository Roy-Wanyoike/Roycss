# Documentation Viewer — Component Architecture

**Status:** Authoritative · **Version:** 1.0 · **Date:** 2026-Q1
**Scope:** In-app documentation viewer that opens from the navbar "Docs" button and renders the 19 top-level markdown files in `/docs/` inside a side panel.

---

## 1. Goals & Non-Goals

### Goals
1. Surface the 19 architecture/lab/blueprint markdown files (`docs/*.md`) from inside the single-page app — **no new route**.
2. Open from the navbar "Docs" button (desktop) and the mobile menu "Docs" item.
3. Search across title, category, and full content (case-insensitive substring match).
4. Filter by category (Architecture, Product, Quality, Growth, Tooling — derived from filename prefix).
5. Render markdown to readable HTML with a table of contents (H2 headings) and styled code blocks.
6. Keyboard accessible: `Esc` closes the Sheet, `↑`/`↓` navigate the doc list, `Enter` opens the highlighted doc, `Backspace`-equivalent (a Back button) returns to the list.

### Non-Goals
- Multi-page navigation, shareable URLs, or `#docs/<slug>` deep links (the site is constrained to a single route).
- Editing markdown in-app.
- Rendering ADRs, threat-models, plans, benchmarks, or checklists (those live under `docs/adr/`, `docs/plans/`, etc. and are intentionally excluded — only top-level `docs/*.md` is surfaced).
- Full GitHub-flavored markdown (tables, footnotes, math). A pragmatic CommonMark subset is sufficient.

---

## 2. Container Choice: Sheet vs Dialog vs Section

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Sheet (side panel)** | Persistent alongside page context; matches existing `FavoritesSheet` pattern; natural for a document list+content split; keyboard `Esc` built-in via Radix; animates in from the right. | Less horizontal width than a full-screen overlay; long markdown lines may wrap. | **Chosen** — `side="right"`, `sm:max-w-2xl`. Width override is applied via `className`. |
| Dialog (centered modal) | Centered focus; large reading area. | Covers hero/CTA; loses "side panel" feel; less natural for list+content layout; existing dialogs (EffectDetailDialog) already compete for modal focus. | Rejected. |
| Inline Section | No overlay; prints with page; deep-linkable via `#docs`. | Already exists as the static "Documentation" section (`<section id="docs">`) — but it only shows `DocCard` tiles, not the markdown content. Replacing it would balloon the page DOM. | Rejected for the viewer; the existing section stays as a navigation hub, the navbar button now opens the Sheet instead of scrolling. |

**Decision:** Sheet, right side, `sm:max-w-2xl w-full sm:w-[672px]`.

---

## 3. Markdown Rendering: react-markdown vs Manual

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Manual CommonMark subset** | Zero extra bundle weight (we already ship the page); full control over styling hooks; deterministic output; no dependency surface. | We reimplement ~10 node types; edge cases (nested lists, indented code) need care. | **Chosen** — the doc set uses a narrow, predictable markdown subset (H1–H4, paragraphs, fenced code blocks, inline code, bold, italic, links, unordered/ordered lists, blockquotes, `---` rules). |
| `react-markdown` (already in `package.json`) | Battle-tested; handles GFM with `remark-gfm`. | Pulls `unified`/`remark`/`rehype` (~80 KB) into the client bundle for a Sheet that opens on click; `react-markdown@10` ESM graph can interact awkwardly with Next 16 RSC. Overkill for 19 docs. | Rejected for the viewer (kept in `package.json` for other potential uses). |
| `marked` / `markdown-it` | Smaller than react-markdown. | New runtime dep; still need a DOM-purify pass for safety. | Rejected. |

**Renderer scope (manual):**
- ATX headings `#`–`####` → `<h1>`–`<h4>`, with `id` slug for TOC anchor jumps (H2 only).
- Fenced code blocks ```` ```lang ``` ```` → `<pre class="roycss-doc-code"><code>…</code></pre>` with a small language badge.
- Inline `` `code` `` → `<code>`.
- Bold `**x**`, italic `*x*` / `_x_`, strikethrough `~~x~~`.
- Links `[text](url)` — `target="_blank" rel="noopener noreferrer"`.
- Unordered lists `- ` / `* `, ordered lists `1. `, nested by 2-space indent.
- Blockquotes `> ` → `<blockquote>`.
- Horizontal rules `---` → `<hr>`.
- Paragraphs (blank-line separated).

**Security:** Markdown content is author-controlled (checked into this repo, not user-generated). Output is rendered via `dangerouslySetInnerHTML` only after escaping `<`, `>`, `&` in all text/inline tokens. Links are validated to `http(s)://`, `mailto:`, or relative `/` paths; `javascript:` is dropped. No raw HTML from markdown source is passed through.

---

## 4. Syntax Highlighting: shiki vs prism vs highlight.js vs none

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **None (themed `<pre><code>`)** | Zero JS, zero CSS token tables; consistent with the rest of the site's `glass` aesthetic; the doc set's code is mostly prose-illustrative (CSS/TS snippets) where readability > token coloring. | No token coloring. | **Chosen** — a single dark `pre` block with a monospace font, subtle border, language badge in the top-right, and a "copy" button. This is the lightest viable highlighter. |
| shiki | VS Code-quality themes; accurate grammars. | ~1 MB of grammar JSON; runs at build or runtime; Next 16 client bundle impact is severe. | Rejected. |
| Prism | Mature, ~2 KB core + per-language. | Still needs 15+ language components for the doc set; CSS theme coupling. | Rejected. |
| highlight.js | Auto-detect; one import. | ~50 KB min+gzip for common languages; auto-detection can misfire on short snippets. | Rejected. |

**Code block affordances:**
- Top bar with language label + copy button.
- Horizontal scroll for long lines (`overflow-x-auto`).
- `prefers-reduced-motion` respected (no animated glow).

---

## 5. Search: Fuzzy vs Substring

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Case-insensitive substring** | Trivially correct; predictable ranking (title-match > category-match > content-match); zero deps; the corpus is 19 docs so O(n·|content|) per keystroke is < 1 ms. | No typo tolerance. | **Chosen** — but with a three-tier match bucket so the user gets useful ranking without fuzzy overhead. |
| Fuzzy (fuse.js / mini-fzf) | Typo-tolerant. | Extra dep; fuzzy scores are opaque; with 19 docs the value is negligible. | Rejected. |

**Search algorithm:**
1. Normalize query (`toLowerCase`, trim).
2. For each doc, compute:
   - `titleHit` = title includes query → bucket 0
   - `categoryHit` = category label includes query → bucket 1
   - `contentHit` = raw content (lowercased) includes query → bucket 2
   - else → filtered out.
3. Sort by bucket asc, then title alphabetic.
4. Empty query → all docs, sorted by category then title.

Search is debounced 80 ms to avoid re-scanning on every keystroke (negligible at this corpus size, but keeps the input responsive on low-end mobile).

---

## 6. Table of Contents Generation

- TOC is derived at render time from the selected doc's markdown source: scan for lines matching `/^(#{2})\s+(.+)$/` (H2 only — H1 is the title, H3+ are too granular for a side panel).
- Each TOC entry gets a slug (`text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")`).
- The same slug is injected as `id` on the rendered `<h2>` so in-panel anchor scrolling works.
- Clicking a TOC item scrolls the content `<div>` (not the window) — `document.getElementById(slug).scrollIntoView({ block: "start" })` inside the scroll container.

---

## 7. Doc File Discovery: Build-time vs Runtime

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Build-time script → generated TS module** | Pure static import in the client component; no `fs` at runtime; tree-shakeable; works on edge/CDN; deterministic. | Requires running the script when docs change. | **Chosen** — `scripts/generate-docs-index.ts` emits `src/lib/docs-data.ts`. |
| `fs.readFileSync` in a Server Component | Native Next.js pattern. | The viewer is a client `<Sheet>`; passing 19 full markdown strings as serialized props bloats the RSC payload and re-renders. Also couples the page render to the filesystem. | Rejected. |
| `import.meta.glob` (Vite-only) | Concise. | Next.js 16 (webpack/turbopack) does not support `import.meta.glob`. | Rejected. |
| Raw `?raw` imports | Built into webpack/turbopack. | Requires Next.js webpack config tweaks (`rules: [{ resourceQuery: /raw/, type: 'asset/source' }]`); fragile across Next versions. | Rejected. |

**Generated module shape (`src/lib/docs-data.ts`):**

```ts
export interface DocEntry {
  slug: string;          // filename without .md, lowercased
  title: string;         // first H1 text (fallback: prettified filename)
  category: string;      // "architecture" | "product" | "quality" | "growth" | "tooling"
  categoryLabel: string; // "Architecture" | ...
  description: string;   // first non-metadata paragraph, truncated 180 chars
  wordCount: number;
  content: string;       // raw markdown
}

export const docsIndex: DocEntry[] = [ /* …19 entries… */ ];
```

The content string is emitted as a backtick template literal; the generator escapes any backtick/`${` sequences inside the markdown (none currently exist, but the escape is defensive).

---

## 8. Component Tree

```
<DocsViewer open onOpenChange>
  <Sheet>                                  // shadcn Sheet (Radix Dialog)
    <SheetContent side="right" max-w-2xl>
      <SheetHeader>                        // title + count + close (built-in)
      <DocsToolbar>                        // search input + category select
      <DocsBody>                           // list | detail
        <DocsList>                         // when selectedSlug == null
          <DocRow> × N                     // filtered + sorted
        <DocsDetail>                       // when selectedSlug != null
          <BackButton>
          <DocsToc>                        // H2 list, sticky
          <MarkdownRenderer source={…}>    // → dangerouslySetInnerHTML
      <SheetFooter>                        // hint line: "↑↓ navigate · Enter open · Esc close"
```

State lives in `DocsViewer`:
- `query: string`
- `activeCategory: string | "all"`
- `selectedSlug: string | null`
- `activeIndex: number` (for keyboard navigation of the filtered list)

---

## 9. Accessibility

- Radix Sheet provides focus trap, `Esc` close, `aria-labelledby`/`aria-describedby`.
- Search input has `aria-label="Search docs"`.
- Doc list rows are `button` elements with `aria-current="true"` on the selected one.
- TOC items are `<a href="#slug">` with `onClick` preventing default and scrolling the content div.
- Code copy button announces "Copied" via `aria-live="polite"` visually-hidden text.
- Color contrast: code block background `bg-zinc-950` with `text-zinc-100` (WCAG AA 13.4:1).
- All interactive elements ≥ 36 px tall (44 px touch target on mobile via `min-h-[44px]`).

---

## 10. Performance

- `docs-data.ts` is a static import; with 19 docs averaging ~10 KB each, the module is ~200 KB raw / ~50 KB gzip. It's only loaded when the user opens the Sheet — but because it's a static import in `docs-viewer.tsx`, it lands in the main bundle.
- Mitigation: `DocsViewer` is imported dynamically by `roycss-page.tsx` via `next/dynamic` with `ssr: false` so the 50 KB only ships when the Sheet is opened. (See IMPLEMENTATION-PLAN.md §4.)
- Markdown rendering is memoized per `selectedSlug` via `useMemo`.
- Search filter is memoized via `useMemo` on `[query, activeCategory, docsIndex]`.

---

## 11. Open Questions (deferred)

- **Print stylesheet for docs** — not needed for v1; users can print the page itself.
- **Versioning** — docs are versioned with the repo; no in-app version selector.
- **Feedback widget** — out of scope; the contact form already exists.
