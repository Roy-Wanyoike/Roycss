# Implementation Plan 03 — Documentation Site Overlay

- **ADR:** `docs/adr/03-docs-site.md`
- **Owner:** Principal Engineer, Documentation Site domain
- **Date:** 2025-01-20
- **Estimated effort:** 1 day (8 hours)

---

## 1. Overview

This plan delivers the RoyCSS documentation overlay: a full-screen, client-side
modal launched from the existing "Docs" nav button that renders 19 markdown
architecture documents with sidebar navigation, full-text search, and an
auto-generated table of contents.

The implementation is broken into **7 phases**, each independently testable.
Phases can be committed individually; the feature is shippable after Phase 5.

---

## 2. Phases

### Phase 1 — Documentation scaffolding (1 hour)

**Goal:** Create the ADR, threat model, benchmarks, plan, and checklist files.

**Steps:**
1. `mkdir -p docs/{adr,threat-models,benchmarks,plans,checklists}`.
2. Write `docs/adr/03-docs-site.md`.
3. Write `docs/threat-models/03-docs-site.md`.
4. Write `docs/benchmarks/03-docs-site.md`.
5. Write `docs/plans/03-docs-site.md` (this file).
6. Write `docs/checklists/03-docs-site.md`.

**Verification:** All 5 files exist and reference each other.

**Status:** ✅ Complete (this commit).

---

### Phase 2 — Build-time content compiler (1.5 hours)

**Goal:** Generate `src/components/docs/docs-content.json` from the 19 markdown
files in `docs/`.

**Steps:**
1. Create `src/components/docs/` directory.
2. Write `scripts/build-docs.ts`:
   - Import `fs`, `path`.
   - Define `DOCS_DIR = "docs"`.
   - Define the **category map** (filename prefix → category):
     ```ts
     const CATEGORY_MAP: Array<{ prefixes: string[]; category: string; label: string }> = [
       { prefixes: ["LABS-26", "LABS-27", "LABS-34", "LABS-35", "FIRST-PRINCIPLES-REDESIGN", "ROYCSS-V2-BLUEPRINT"], category: "architecture", label: "Architecture" },
       { prefixes: ["PLATFORM-VISION", "ENTERPRISE-REVIEW", "COMPETITIVE-ANALYSIS", "50-ORIGINAL-FEATURES"], category: "product", label: "Product" },
       { prefixes: ["LABS-28", "LABS-29", "LABS-32", "LABS-33"], category: "quality", label: "Quality" },
       { prefixes: ["LABS-30", "LABS-31", "LABS-36"], category: "growth", label: "Growth" },
       { prefixes: ["DOCUMENTATION-SITE", "VSCODE-EXTENSION"], category: "tooling", label: "Tooling" },
     ];
     ```
   - Read each `.md` file (filter to the explicit allowlist — exclude ADRs,
     threat models, etc.).
   - For each file:
     - Extract `title` from the first `# H1` line (strip leading `# `).
     - Extract `description` from the first non-empty paragraph after the H1
       (truncate to 200 chars).
     - Parse `toc` from all `## H2` lines: `{ id: slugify(text), text, level: 2 }`.
     - Compute `wordCount` by splitting content on whitespace.
     - Build entry: `{ slug, title, category, categoryLabel, description, content, toc, wordCount }`.
   - Write `src/components/docs/docs-content.json` with `JSON.stringify(entries, null, 2)`.
3. Run `bun run scripts/build-docs.ts`.
4. Verify the JSON file exists and contains 19 entries.

**slugify function:**
```ts
function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, "")   // strip punctuation
    .replace(/\s+/g, "-")        // spaces to hyphens
    .replace(/-+/g, "-")         // collapse repeats
    .trim();
}
```

**Verification:**
- `wc -l src/components/docs/docs-content.json` returns a large number.
- `jq 'length' src/components/docs/docs-content.json` returns 19.
- `jq '.[0] | keys' src/components/docs/docs-content.json` returns the expected
  keys: slug, title, category, categoryLabel, description, content, toc, wordCount.

**Status:** Pending.

---

### Phase 3 — Data layer (30 minutes)

**Goal:** Provide a typed, lazy-loaded accessor for the JSON content.

**Steps:**
1. Write `src/components/docs/docs-data.ts`:
   - Export TypeScript interfaces: `DocTocItem`, `DocEntry`, `DocsCategory`.
   - Export an async `loadDocs()` function that dynamically imports the JSON
     and caches it in a module-level variable.
   - Export a synchronous `getDocs()` that returns the cached array (or `null`
     if not yet loaded).
   - Export a `getDocBySlug(slug)` helper.
   - Export the category metadata (`categoryOrder`, `categoryMeta`).

**TypeScript interfaces:**
```ts
export interface DocTocItem {
  id: string;
  text: string;
  level: number;
}

export interface DocEntry {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  content: string;
  toc: DocTocItem[];
  wordCount: number;
}

export type DocsCategory = "architecture" | "product" | "quality" | "growth" | "tooling";
```

**Verification:** `tsc --noEmit` passes; the module exports the expected symbols.

**Status:** Pending.

---

### Phase 4 — Overlay components (3 hours)

**Goal:** Build the 5 React components that make up the overlay UI.

**Order of implementation (dependency-first):**

#### 4.1 `docs-content.tsx` (1 hour)

- Props: `{ doc: DocEntry | null }`.
- Uses `react-markdown` with `remarkGfm` and `rehypeSlug` plugins.
- Custom renderers:
  - `h1`: hide (we render the title in the header bar).
  - `h2`: `<h2 id="...">` (id from rehype-slug) with a scroll-margin-top to
    account for the sticky header.
  - `code`: inline → `<code>` span; block → `<pre><code>` with OKLCH-themed
    background and monospace font. No syntax highlighting (per ADR §2.3).
  - `a`: target `_blank`, rel `noopener noreferrer` for external links.
  - `table`: wrapped in `<div class="overflow-x-auto">` for horizontal scroll
    on small screens.
- Loading state: skeleton spinner while `doc === null`.
- Empty state: "Select a doc from the sidebar" prompt.

#### 4.2 `docs-toc.tsx` (30 min)

- Props: `{ toc: DocTocItem[]; activeId: string | null }`.
- Renders a sticky right-side list of H2 anchors.
- Click handler: `document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })`.
- Active highlighting via `IntersectionObserver` on the rendered H2s (optional —
  v1 can ship without active highlighting).

#### 4.3 `docs-sidebar.tsx` (30 min)

- Props: `{ docs: DocEntry[]; selectedSlug: string | null; onSelect: (slug) => void; categories: ... }`.
- Renders docs grouped by category, with category headers.
- Each doc item shows: title (truncated), word count badge.
- Selected doc has a highlighted background.
- Collapsible categories (optional — v1 ships expanded).

#### 4.4 `docs-search.tsx` (45 min)

- Props: `{ docs: DocEntry[]; onSelect: (slug) => void; onClose: () => void }`.
- Local state: `query`, `results`, `activeIndex`.
- Filter logic: lowercase substring match across title, description, and content.
- Result item shows: title, category badge, snippet with highlighted match
  (React children, not dangerouslySetInnerHTML — see threat model T2).
- Keyboard: ArrowUp/ArrowDown to navigate, Enter to select, Esc to close.
- Shows up to 20 results; if more, show "20 of N" hint.

#### 4.5 `docs-overlay.tsx` (45 min)

- Props: `{ open: boolean; onOpenChange: (open) => void }`.
- Local state: `docs` (cached DocEntry[]), `selectedSlug`, `query`, `mode`
  ("browse" | "search").
- `useEffect` on `open`: if `open && docs === null`, call `loadDocs()` and
  set state. Also lock body scroll. Cleanup: unlock body scroll.
- Layout (3-column on lg, 2-column on md, single column on mobile):
  ```
  ┌─────────────────────────────────────────────────────────┐
  │ Top bar: [Docs] [search input........] [X close]        │
  ├──────────┬──────────────────────────────┬───────────────┤
  │ Sidebar  │ Main content (markdown)      │ TOC           │
  │ (200px)  │ (flex-1, scrollable)         │ (200px)       │
  │          │                              │               │
  └──────────┴──────────────────────────────┴───────────────┘
  ```
- Animate with `framer-motion` `AnimatePresence`: 150 ms fade + scale.
- z-index: `z-[300]` (above search overlay at z-200).
- Esc to close (via `useEffect` keydown listener).
- Click outside the inner panel (on backdrop) to close.

**Verification (per component):**
- Storybook not available — verify via dev server.
- Each component should render without console errors.

**Status:** Pending.

---

### Phase 5 — Wire to nav (30 minutes)

**Goal:** Connect the overlay to the existing "Docs" nav button in
`roycss-page.tsx`.

**Steps:**
1. Edit `src/components/roycss/roycss-page.tsx`:
   - Add `import { DocsOverlay } from "@/components/docs/docs-overlay";`.
   - Add state: `const [docsOpen, setDocsOpen] = useState(false);`.
   - Replace the existing "Docs" button `onClick`:
     - **Before:** `onClick={() => scrollToSection("#docs")}`.
     - **After:** `onClick={() => setDocsOpen(true)}`.
   - Update the footer "Docs" button the same way.
   - Update the mobile menu "Docs" item to call `setDocsOpen(true)` and
     `setMobileMenuOpen(false)`.
   - Render `<DocsOverlay open={docsOpen} onOpenChange={setDocsOpen} />` at the
     bottom of the component (next to `<PlaygroundPanel>`, `<SearchOverlay>`, etc.).
2. Verify in dev server: clicking "Docs" opens the overlay.

**Verification:**
- Click "Docs" in nav → overlay opens.
- Click "Docs" in footer → overlay opens.
- Click "Docs" in mobile menu → overlay opens, mobile menu closes.
- Press Esc → overlay closes.
- Click backdrop → overlay closes.

**Status:** Pending.

---

### Phase 6 — Polish & edge cases (1 hour)

**Goal:** Handle responsive layout, keyboard accessibility, and edge cases.

**Steps:**
1. **Responsive layout:**
   - `lg` (≥1024px): 3-column (sidebar + content + TOC).
   - `md` (768–1023px): 2-column (sidebar + content), TOC hidden.
   - `sm` (<768px): single column. Sidebar becomes a top dropdown; TOC hidden.
2. **Keyboard accessibility:**
   - Focus trap: when overlay is open, Tab cycles within the overlay.
   - Initial focus: search input.
   - `Esc` closes the overlay.
   - `Cmd/Ctrl + K` focuses the search input (when overlay is open).
3. **Edge cases:**
   - Empty search results: show "No docs match '{query}'".
   - Doc with no H2 headings: TOC shows "No sections".
   - Doc with very long lines: horizontal scroll on code blocks.
   - Concurrent clicks: debounce doc selection (50 ms).
4. **Reduced motion:** respect `prefers-reduced-motion: reduce` — disable
   the fade-in animation, show overlay instantly.

**Verification:**
- Test on viewport widths: 375px, 768px, 1024px, 1440px.
- Test keyboard-only navigation (no mouse).
- Test with `prefers-reduced-motion: reduce` in DevTools.

**Status:** Pending.

---

### Phase 7 — Lint, test, ship (30 minutes)

**Goal:** Ensure the implementation passes lint and meets the benchmark budget.

**Steps:**
1. Run `bun run lint` → expect 0 errors, 0 warnings.
2. Run `bun run scripts/build-docs.ts` → verify JSON regenerated cleanly.
3. Manual test in dev server:
   - Open overlay → see first doc rendered.
   - Click each of 19 docs in sidebar → all render.
   - Search for "performance" → results appear in <50 ms.
   - Click a TOC link → content scrolls to heading.
   - Verify no `<script>` executes (try typing `<script>alert(1)</script>`
     in search — should appear as plain text, not execute).
4. Verify bundle budget: check `.next/static/chunks/` for the lazy-loaded
   docs chunk. Should be < 100 KB gzip (excluding the JSON content chunk).
5. Append worklog entry summarizing the work.

**Verification:**
- `bun run lint` exit code 0.
- All manual tests pass.
- Bundle size in `.next` is within budget.

**Status:** Pending.

---

## 3. File Inventory

Files to be created (12 new files, 1 modified):

```
docs/adr/03-docs-site.md                          [new, ~10 KB]
docs/threat-models/03-docs-site.md                [new, ~8 KB]
docs/benchmarks/03-docs-site.md                   [new, ~6 KB]
docs/plans/03-docs-site.md                        [new, ~6 KB]
docs/checklists/03-docs-site.md                   [new, ~4 KB]

scripts/build-docs.ts                             [new, ~5 KB]

src/components/docs/
├── docs-data.ts                                  [new, ~2 KB]
├── docs-content.json                             [new, generated, ~820 KB]
├── docs-overlay.tsx                              [new, ~8 KB]
├── docs-sidebar.tsx                              [new, ~4 KB]
├── docs-content.tsx                              [new, ~5 KB]
├── docs-search.tsx                               [new, ~5 KB]
└── docs-toc.tsx                                  [new, ~3 KB]

src/components/roycss/roycss-page.tsx             [modified — add docsOpen state + overlay]
```

Total new code: ~50 KB TypeScript + ~820 KB JSON (lazy-loaded).
Main page addition: ~0.5 KB (import statement + state hook).

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `react-markdown` renders raw HTML | Low (no `rehype-raw`) | High (XSS) | Audit plugin pipeline; never add `rehype-raw` |
| JSON chunk fails to load on slow network | Medium | Medium (overlay stuck on skeleton) | Add timeout + retry button |
| Body scroll lock not released on unmount | Medium | Low (UX bug) | useEffect cleanup + safety timer |
| Category mapping wrong for a new doc | Low | Low (doc shows as "Uncategorized") | Build script logs unmatched files |
| `react-markdown` parse error on malformed markdown | Low | Low (single doc fails to render) | Wrap in error boundary, show fallback |
| Bundle size regression if docs grow | Medium | Medium (slow first-load) | CI size check (see benchmarks §5) |

---

## 5. Out of Scope (Future Work)

- **Deep-linking via query params** (`?doc=LABS-26`). Trivial to add later
  without changing routes.
- **Per-doc JSON chunks** instead of one big JSON. Worth doing if docs grow
  past 2 MB total.
- **Full-text search index** (FlexSearch/Lunr). Premature for 19 docs.
- **Print-friendly stylesheet** for individual docs.
- **Dark/light theme toggle inside the overlay** (currently inherits from
  the page).
- **Edit-on-GitHub links** per doc (requires knowing the GitHub URL pattern).
- **Reading progress bar** inside the overlay.
- **Last-updated timestamps** (would require git log lookup at build time).
