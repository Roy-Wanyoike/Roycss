# Review Checklist — Documentation Viewer

15 items. Each must be verified before the task is marked complete.

---

## Design & ADRs

- [ ] **1.** `docs/adr/documentation-viewer/DESIGN.md` exists and covers: Sheet vs Dialog vs Section, markdown renderer choice, syntax highlighting choice, search algorithm, TOC generation, doc discovery, accessibility, performance.
- [ ] **2.** `docs/adr/documentation-viewer/ADR.md` exists with 3–6 ADRs covering: container choice, markdown parser, syntax highlighter, search algorithm, doc discovery, navbar wiring.

## Build script & generated data

- [ ] **3.** `scripts/generate-docs-index.ts` exists, reads `docs/*.md` (top-level only), and writes `src/lib/docs-data.ts`.
- [ ] **4.** Running `bun run scripts/generate-docs-index.ts` produces `src/lib/docs-data.ts` with exactly 19 entries (one per top-level `docs/*.md` file).
- [ ] **5.** Each `DocEntry` has all 7 fields populated: `slug`, `title`, `category`, `categoryLabel`, `description`, `wordCount`, `content`. No field is empty/undefined.
- [ ] **6.** Category labels are drawn from the 5-value set {Architecture, Product, Quality, Growth, Tooling} and the script's category map is consistent with `scripts/build-docs.ts`.

## Component

- [ ] **7.** `src/components/roycss/docs-viewer.tsx` is a client component (`"use client"`) exporting `DocsViewer({ open, onOpenChange })`.
- [ ] **8.** Uses shadcn `Sheet` with `side="right"` and `sm:max-w-2xl` width.
- [ ] **9.** Search input filters docs by title/category/content (case-insensitive substring) with three-tier ranking; results update as the user types.
- [ ] **10.** Category filter chips (derived from `docsIndex`) allow narrowing to one category; "All" resets.
- [ ] **11.** Doc list shows when no doc is selected; clicking a row opens the doc detail with a Back button to return.
- [ ] **12.** Markdown renders headings, paragraphs, lists, code blocks (with copy button + language badge), inline code, bold, italic, links, blockquotes, horizontal rules. TOC (H2) is generated and clickable.
- [ ] **13.** Keyboard accessible: `Esc` closes the Sheet (Radix built-in); `Backspace` returns from a doc to the list; `↑`/`↓` navigate the filtered list; `Enter` opens the highlighted doc. Typing in the search input is not hijacked.

## Wiring

- [ ] **14.** Navbar desktop "Docs" button and mobile menu "Docs" item both call `setDocsOpen(true)`. Footer "Docs" button unchanged (`scrollToSection("#docs")`). `<DocsViewer open={docsOpen} onOpenChange={setDocsOpen} />` is rendered at the bottom of `roycss-page.tsx`.

## Verification

- [ ] **15.** `bun run lint` reports 0 errors, 0 warnings. Dev server hot-reloads without errors. `agent-browser` confirms: Sheet opens, 19 docs listed, search filters, content renders, `Esc` closes, console is clean.
