# ADR 03 — Documentation Site (Overlay vs. Route)

- **Status:** Accepted
- **Date:** 2025-01-20
- **Decision Owner:** Principal Engineer, Documentation Site domain
- **Domain:** `/home/z/my-project/src/app/docs/`, `/home/z/my-project/src/components/docs/`
- **Supersedes:** None
- **Related:** `docs/DOCUMENTATION-SITE.md` (53KB design doc)

---

## 1. Context

RoyCSS ships **19 long-form architecture and design documents** (totalling ~818 KB of markdown)
in `/home/z/my-project/docs/`. These documents cover product vision, architecture decisions,
performance labs, and platform strategy — but they are not currently browsable from the
RoyCSS marketing site.

The existing `docs/DOCUMENTATION-SITE.md` design doc proposed a multi-route Next.js
documentation experience (with a `/docs/[slug]` dynamic route, full-text search service,
and per-section SEO). However, a hard project constraint blocks that approach:

> **Constraint (from project root):** "user can only see the `/` route defined in
> `src/app/page.tsx`."

This means a top-level `/docs/[slug]` route is **not allowed**. The documentation
experience must live entirely within the single-page app shell at `/`.

### 1.1 Forces driving the decision

| Force | Implication |
|-------|-------------|
| Hard route constraint (only `/` allowed) | Cannot use Next.js dynamic routes for docs |
| 19 docs × 50–113 KB each (~818 KB total) | Cannot embed all markdown in the main bundle |
| Marketing site already loads 1569 effects | Bundle budget is tight — must lazy-load docs |
| Docs are written for humans, not crawlers | SEO for docs is a non-goal |
| Docs are static at build time | Can pre-compile markdown to JSON once |
| Users want fast doc switching (<100 ms) | Need in-memory cache after first load |
| Existing overlay patterns (SearchOverlay, PlaygroundPanel, FavoritesSheet) | Full-screen overlay is the established pattern |

---

## 2. Decision

Build the documentation experience as a **client-side, full-screen overlay** rendered
inside the existing `/` route, launched by the "Docs" nav button.

### 2.1 Architecture

```
┌─ src/components/roycss/roycss-page.tsx (existing /)
│   └─ <DocsOverlay open={docsOpen} onOpenChange={setDocsOpen} />
│
└─ src/components/docs/
    ├─ docs-overlay.tsx     ← Full-screen framer-motion modal (AnimatePresence)
    ├─ docs-sidebar.tsx     ← Left nav: 19 docs grouped into 5 categories
    ├─ docs-content.tsx     ← Main area: react-markdown renderer (lazy-loaded)
    ├─ docs-search.tsx      ← Top search: substring match across all 19 docs
    ├─ docs-toc.tsx         ← Right sidebar: auto-generated H2 anchors
    ├─ docs-data.ts         ← Lazy loader: `await import("./docs-content.json")`
    └─ docs-content.json    ← Build-time-generated: 19 docs × {slug,title,category,content,toc}
```

### 2.2 Build-time content compilation

A dedicated Node script — `scripts/build-docs.ts` — runs at build time (and manually
via `bun run scripts/build-docs.ts`) to:

1. Read all 19 `.md` files from `/home/z/my-project/docs/`.
2. Parse each file's title (first `# H1`), description (first paragraph), TOC (all
   `## H2` headings with slugified IDs), and word count.
3. Categorize each file based on its name (see §2.4 below).
4. Emit a single JSON artifact: `src/components/docs/docs-content.json`
   (an array of `{ slug, title, category, categoryLabel, description, content, toc, wordCount }`).

The JSON is **not** imported eagerly. It is loaded only when the user opens the
overlay, via a dynamic `import("./docs-content.json")`. Next.js automatically
code-splits the JSON into its own chunk, so the main bundle stays lean.

### 2.3 Markdown rendering

We use **`react-markdown` v10** (already in `package.json`) with two small plugins:

- **`remark-gfm`** — adds GitHub-Flavored Markdown (tables, strikethrough, task lists).
  Without this, the many tables in the docs would render as raw text.
- **`rehype-slug`** — adds `id` attributes to all `h1`/`h2`/`h3` headings so the
  right-side TOC can scroll to them.

**Why not `marked` + `dompurify`?** The task brief suggested marked + dompurify as
the default stack. We deliberately diverged:

| Approach | XSS surface | Bundle | React integration |
|----------|-------------|--------|-------------------|
| `marked` + `dompurify` + `dangerouslySetInnerHTML` | Medium (must configure dompurify correctly) | ~40 KB + ~25 KB | None — manually re-attach event handlers |
| `react-markdown` (chosen) | **Low** — does not render raw HTML by default; no `dangerouslySetInnerHTML` | ~30 KB total (incl. plugins) | First-class React components |

`react-markdown` is safer by default because it never renders raw HTML unless
`rehype-raw` is explicitly added. We do **not** add `rehype-raw`, so any `<script>`
tags embedded in the markdown source render as plain text. This is a defense-in-depth
win: even if a future doc accidentally contains raw HTML, it cannot execute.

**Why not `highlight.js`?** Adding `highlight.js` (or `react-syntax-highlighter`,
which is already in `node_modules`) would bloat the docs bundle by 50–200 KB. The
RoyCSS docs contain modest amounts of code (mostly bash install commands and small
CSS snippets). A clean, OKLCH-themed monospace code block is sufficient and ~0 KB
incremental. The benchmark §3.4 ("Total bundle addition < 100 KB") would be
unreachable with full syntax highlighting.

### 2.4 Documentation categories

The 19 markdown docs are grouped into 5 categories at build time, based on filename
prefix matching:

| Category | Count | Files |
|----------|-------|-------|
| Architecture | 6 | LABS-26, LABS-27, LABS-34, LABS-35, FIRST-PRINCIPLES-REDESIGN, ROYCSS-V2-BLUEPRINT |
| Product | 4 | PLATFORM-VISION, ENTERPRISE-REVIEW, COMPETITIVE-ANALYSIS, 50-ORIGINAL-FEATURES |
| Quality | 4 | LABS-28, LABS-29, LABS-32, LABS-33 |
| Growth | 3 | LABS-30, LABS-31, LABS-36 |
| Tooling | 2 | DOCUMENTATION-SITE, VSCODE-EXTENSION |
| **Total** | **19** | |

> **Note:** The original task brief lists "20 existing markdown files"; an audit of
> `/home/z/my-project/docs/` finds **19** markdown files matching the design-doc
> criteria. The discrepancy is documented here for traceability.

### 2.5 Search

Search is a **lazy, in-memory substring match** across all 19 docs' titles,
descriptions, and content. On first keystroke in the search input, we iterate
over the cached `docs-content.json` array (already loaded by the overlay) and
filter by lowercased substring match. No external index (FlexSearch, Lunr, etc.)
is shipped — 19 docs × ~50 KB = 950 KB of text, which a modern V8 engine scans
in <5 ms on a typical laptop. The benchmark §3.3 ("Search across 19 docs < 50 ms")
is comfortably met.

### 2.6 TOC (table of contents)

At build time, `scripts/build-docs.ts` parses every `## H2` heading from each doc,
slugifies it (lowercase, replace spaces with `-`, strip punctuation), and stores
the result in `toc: [{ id, text, level }]`. The right-side `<DocsToc>` renders
these as anchor links that call `document.getElementById(id).scrollIntoView()`
on click. Smooth scrolling is handled by the browser's native `behavior: "smooth"`.

### 2.7 Overlay chrome

The overlay is a **custom full-screen modal** built with `framer-motion`'s
`AnimatePresence` (matching the established `SearchOverlay` pattern), **not** the
shadcn `<Dialog>` primitive. The Dialog primitive is centered and small — optimized
for confirmations and short forms. A docs reading experience needs the full viewport
with a 3-column layout (sidebar / content / TOC). The custom modal:

- Renders at `z-[300]` (above the search overlay at `z-[200]`).
- Locks body scroll while open (via `useEffect` toggling `document.body.style.overflow`).
- Closes on `Esc` and on backdrop click.
- Animates in with a 150 ms fade + slight scale.

---

## 3. Alternatives Considered

### 3.1 Next.js dynamic route `/docs/[slug]`

**Rejected.** Violates the "only `/` route" constraint. Would also require
modifying `next.config.ts`, adding `generateStaticParams`, and restructuring
the app router — all out of scope.

### 3.2 Separate Next.js app under a subdomain (e.g., `docs.roycss.com`)

**Rejected.** Operationally heavy — separate build pipeline, separate deploy,
separate DNS. The docs are only ~818 KB total; they fit comfortably inside the
main app bundle as a lazy chunk. A separate app would be justified if the docs
exceeded ~5 MB or needed their own search backend.

### 3.3 Nextra

**Rejected.** Nextra is a Next.js theme specifically for documentation, but it
mandates its own routing layer (it generates `/docs/[slug]` routes). Same route
constraint violation as §3.1. Additionally, Nextra brings its own MDX pipeline,
theme components, and ~200 KB of dependencies — far above our 100 KB bundle budget.

### 3.4 Fumadocs

**Rejected.** Same routing-model conflict as Nextra, plus Fumadocs is optimized
for very large documentation sets (1000+ pages) with full-text search backends.
RoyCSS has 19 docs — Fumadocs is overkill.

### 3.5 shadcn `<Dialog>` primitive (centered modal)

**Rejected for the chrome, retained for accessibility patterns.** The Dialog
primitive is too small for a 3-column docs layout. However, we still inherit
its accessibility conventions: focus trap, `role="dialog"`, `aria-modal="true"`,
`aria-labelledby`, and `Esc`-to-close.

### 3.6 Marked + DOMPurify + highlight.js (the task brief's suggested stack)

**Rejected.** See §2.3 for the full comparison. `react-markdown` is safer (no
raw HTML by default), lighter, and integrates natively with React.

### 3.7 MDX (compile markdown to React components at build time)

**Rejected.** MDX would let us embed live React components inside docs, but:
1. None of the 19 existing docs use MDX syntax — they're plain markdown.
2. MDX adds a compile step and ~80 KB of runtime.
3. The build-time JSON approach is simpler and equally fast at runtime.

---

## 4. Consequences

### 4.1 Positive

- **Zero new top-level routes.** The hard route constraint is respected.
- **Lazy-loaded.** The 818 KB of markdown content lives in a separate JSON chunk
  loaded only when the user opens the overlay. Main-page LCP is unaffected.
- **Safe by default.** `react-markdown` without `rehype-raw` cannot render raw
  HTML, eliminating an entire class of XSS vectors.
- **Build-time TOC.** TOC is pre-computed; no runtime markdown parsing on the
  client (only rendering, which `react-markdown` does in <50 ms per doc).
- **Established UX pattern.** The full-screen overlay matches `SearchOverlay`,
  `PlaygroundPanel`, `FavoritesSheet`, and `ContactForm` — users already know
  this interaction model.
- **Cheap to maintain.** Adding a new doc = drop a `.md` file in `docs/` and
  re-run `bun run scripts/build-docs.ts`. No code changes required.

### 4.2 Negative

- **No deep-linking.** The URL stays at `/` — you cannot share a link to a
  specific doc. *Mitigation:* acceptable because docs are for in-product
  browsing, not external sharing. If deep-linking becomes a requirement, we
  can add `?doc=LABS-26` query params without changing the route.
- **No SEO benefit for docs.** Search engines cannot index the docs because
  they live in a JSON chunk loaded on demand. *Mitigation:* acceptable — docs
  are for users, not crawlers, and the markdown source files are already
  present in the GitHub repo (which IS crawlable).
- **No browser back button.** Closing the overlay doesn't push history.
  *Mitigation:* `Esc` and backdrop click are reliable; users won't expect
  browser back to close a modal.
- **Build-time coupling.** Doc content is baked into the JSON at build time.
  Edits to `docs/*.md` require re-running the build script. *Mitigation:* add
  `scripts/build-docs.ts` as a `prebuild` hook in `package.json` (future work).
- **Single JSON chunk.** The 818 KB JSON loads as one chunk when the overlay
  opens. On a slow 3G connection this could take 4–8 seconds. *Mitigation:*
  the overlay shows a skeleton loader during the dynamic import.

### 4.3 Neutral

- The overlay adds ~30 KB (react-markdown + remark-gfm + rehype-slug, gzip) to
  the lazy-loaded docs chunk. The main page bundle is unchanged.
- The build script (`scripts/build-docs.ts`) is a new build-time dependency,
  but it's pure Node with no external runtime deps.

---

## 5. Compliance

This ADR complies with:

- **Route constraint:** Only `/` is exposed. ✓
- **Bundle budget:** < 100 KB incremental to main bundle. ✓ (lazy chunk)
- **XSS safety:** No raw HTML rendering path. ✓
- **Performance budget:** Overlay open < 300 ms, doc switch < 100 ms, search < 50 ms. ✓ (see `docs/benchmarks/03-docs-site.md`)
- **Established patterns:** Matches `SearchOverlay` overlay architecture. ✓

---

## 6. References

- `docs/DOCUMENTATION-SITE.md` — original 53 KB design doc
- `docs/threat-models/03-docs-site.md` — threat model for this ADR
- `docs/benchmarks/03-docs-site.md` — performance benchmarks
- `docs/plans/03-docs-site.md` — step-by-step implementation plan
- `docs/checklists/03-docs-site.md` — review checklist
- `src/components/docs/` — implementation
- `scripts/build-docs.ts` — build-time content compiler
