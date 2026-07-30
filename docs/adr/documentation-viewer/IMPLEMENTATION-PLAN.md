# Implementation Plan — Documentation Viewer

**Status:** Authoritative · **Version:** 1.0
**Prerequisite:** RoyCSS single-page app at `src/app/page.tsx` → `src/components/roycss/roycss-page.tsx`. Dev server on port 3000. Next.js 16 + Tailwind 4 + shadcn/ui.

---

## Step 0 — Scope & ownership

**Can create/modify:**
- `src/components/roycss/docs-viewer.tsx` (new)
- `src/lib/docs-data.ts` (new, generated)
- `scripts/generate-docs-index.ts` (new, build script)
- `src/components/roycss/roycss-page.tsx` (existing — wire viewer)
- `docs/adr/documentation-viewer/` (new directory)

**Cannot touch:**
- `src/app/page.tsx`, other agents' lib files, the existing `docs/*.md` files (read-only), any other agent's directory.

---

## Step 1 — Write the design docs

Create `docs/adr/documentation-viewer/`:
1. `DESIGN.md` — component architecture, container choice, markdown renderer, syntax highlighting, search, TOC, doc discovery, accessibility, performance.
2. `ADR.md` — 6 ADRs (Sheet vs Dialog, markdown parser, syntax highlighter, search algorithm, doc discovery, navbar wiring).
3. `IMPLEMENTATION-PLAN.md` — this file.
4. `REVIEW-CHECKLIST.md` — 15 review items.

---

## Step 2 — Create the build script

**File:** `scripts/generate-docs-index.ts`

**Responsibilities:**
1. Read all `docs/*.md` (top-level only — not `docs/adr/`, `docs/plans/`, etc.). 19 files expected.
2. For each file:
   - `slug` = filename without `.md`, lowercased.
   - `title` = first `# H1` line text; fallback to prettified filename.
   - `category` / `categoryLabel` = derived from filename prefix (reuse the 5-category map: Architecture, Product, Quality, Growth, Tooling).
   - `description` = first non-metadata paragraph after the H1 (skip lines starting with `**Status:**`, `**Version:**`, etc.), truncated to 180 chars.
   - `wordCount` = whitespace-split count of the raw content.
   - `content` = raw markdown.
3. Sort by category label, then title.
4. Emit `src/lib/docs-data.ts`:
   - Export `interface DocEntry { slug; title; category; categoryLabel; description; wordCount; content }`.
   - Export `const docsIndex: DocEntry[] = [...]`.
   - Emit content as a template literal; escape backticks and `${` defensively.
   - Header comment documents how to regenerate.

**Run:** `bun run scripts/generate-docs-index.ts`

**Verify:** `src/lib/docs-data.ts` exists, contains 19 entries, file size ~200 KB.

---

## Step 3 — Create the viewer component

**File:** `src/components/roycss/docs-viewer.tsx`

**Structure (see DESIGN.md §8):**

```tsx
"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, ArrowLeft, Copy, Check, FileText, Hash } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { docsIndex, type DocEntry } from "@/lib/docs-data";
import { cn } from "@/lib/utils";

interface DocsViewerProps { open: boolean; onOpenChange: (o: boolean) => void; }

export function DocsViewer({ open, onOpenChange }: DocsViewerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // categories derived from docsIndex
  // filtered + sorted docs (memoized)
  // selected doc (memoized lookup)
  // keyboard handler (Esc handled by Radix; ↑↓ Enter for list)
  // reset selectedSlug when Sheet closes
  // markdown renderer (memoized per slug)
  // TOC (memoized per slug)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 gap-0 flex flex-col">
        <SheetHeader>…</SheetHeader>
        <DocsToolbar>…</DocsToolbar>
        <DocsBody>…</DocsBody>
        <SheetFooter>…</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

**Sub-pieces (inline in the same file to keep it one file):**

1. **`renderMarkdown(src: string): string`** — pure function returning an HTML string. Handles: ATX headings H1–H4 (H2 gets `id`), fenced code blocks with optional language, inline code, bold, italic, strikethrough, links, unordered/ordered lists (1 level nesting), blockquotes, horizontal rules, paragraphs. All text escaped before re-injection. `javascript:` URLs dropped.

2. **`buildToc(src: string): { id: string; text: string }[]`** — scans for `^##\s+(.+)$` lines.

3. **`slugify(text: string): string`** — `toLowerCase` → strip non-`[\w\s-]` → collapse whitespace to `-` → trim `-`.

4. **Category filter chips** — derived from `docsIndex` (unique `categoryLabel`s), with an "All" chip.

5. **Doc list** — when `selectedSlug == null`. Each row: title, category badge, description (truncated), word count. `min-h-[44px]`, `aria-current` on the active row, hover/focus ring.

6. **Doc detail** — when `selectedSlug != null`. Back button + doc title + category badge + word count + TOC (sticky on `lg+`) + rendered markdown. Code blocks have a copy button.

7. **Keyboard nav** — `useEffect` listening for `keydown` on the Sheet content:
   - `ArrowDown` / `ArrowUp` → move `activeIndex` (clamped), list view only.
   - `Enter` → if a list is visible, open `filtered[activeIndex]`.
   - `Backspace` when a doc is open → return to list (the Back button affordance).
   - `Escape` → closes the Sheet (Radix Sheet's own Escape handler; we do not intercept).
   - Skip when focus is in the search input (let the user type/backspace in the input).

8. **Search** — `useMemo` over `[query, activeCategory, docsIndex]` returning `{ filtered: DocEntry[]; buckets: number[] }`. 80 ms debounce via `useEffect` + `setTimeout`.

9. **Reset on close** — `useEffect` on `open`: when `open` becomes false, clear `selectedSlug`, `query`, `activeCategory` (so reopening shows the clean list).

10. **Copy code button** — each rendered code block is wrapped in a container with a copy button that reads the raw text from a `data-raw` attribute (set by the renderer as base64 to avoid HTML-escaping issues — actually we set it as `data-raw` with HTML entities escaped, and read via `el.getAttribute('data-raw')` which decodes). Simpler: the renderer emits the raw code as a separate hidden `<script type="text/plain">` sibling; the copy button reads `previousElementSibling.textContent`. Cleanest: emit `data-raw` attribute with the code HTML-escaped (`&`, `<`, `>`, `"` → entities); `getAttribute` returns the decoded string. We use this approach.

---

## Step 4 — Wire into roycss-page.tsx

**Changes (5 edits):**

1. **Imports** (top of file):
   ```tsx
   import dynamic from "next/dynamic";
   const DocsViewer = dynamic(() => import("@/components/roycss/docs-viewer").then(m => m.DocsViewer), { ssr: false });
   ```

2. **State** (near line 844, alongside `playgroundOpen` etc.):
   ```tsx
   const [docsOpen, setDocsOpen] = useState(false);
   ```

3. **Desktop navbar "Docs" button** (line ~965):
   ```tsx
   onClick={() => setDocsOpen(true)}
   ```
   Replace `activeSection === "docs"` highlight with `docsOpen` pressed style.

4. **Mobile menu "Docs" item** (line ~1084): change from `scrollToSection("#docs")` to `setDocsOpen(true); setMobileMenuOpen(false);`. Easiest: pull "Docs" out of the array `.map()` and render it as a standalone button like the "Playground" button below.

5. **Render the viewer** (near line 1709, after `<SectionScrollbar />`):
   ```tsx
   <DocsViewer open={docsOpen} onOpenChange={setDocsOpen} />
   ```

**Not changed:**
- Footer "Docs" button (keeps `scrollToSection("#docs")` per ADR-006).
- `<section id="docs">` (stays as the static cards hub).
- `SectionScrollbar` active-section logic.

---

## Step 5 — Lint

```bash
cd /home/z/my-project && bun run lint
```
Expected: 0 errors, 0 warnings (the eslint config disables most rules; our code is strict-typed and uses no `any`).

If warnings appear, fix at the source (don't disable rules).

---

## Step 6 — Run the build script

```bash
cd /home/z/my-project && bun run scripts/generate-docs-index.ts
```
Verify `src/lib/docs-data.ts` exists and contains 19 entries.

---

## Step 7 — Dev server hot-reload check

```bash
tail -30 /home/z/my-project/dev.log
```
Expect: a successful recompile line after the file changes (Next 16 turbopack hot-reload). No `Error:` or `⨯` lines.

---

## Step 8 — agent-browser verification

1. Open `http://localhost:3000/`.
2. Click the navbar "Docs" button.
3. Verify the Sheet opens from the right.
4. Verify the doc list shows 19 docs.
5. Type "LABS" in the search — verify the list filters to ~11 LABS docs.
6. Click a category chip (e.g. "Architecture") — verify filter.
7. Click a doc — verify markdown content renders (headings, paragraphs, code block with copy button, TOC on the side).
8. Click a TOC item — verify the content scrolls.
9. Click the Back button — verify return to list.
10. Press `Esc` — verify the Sheet closes.
11. Open browser console — verify no errors/warnings.

---

## Step 9 — Worklog

Append a `---`-delimited section to `worklog.md` with: Task ID, Agent, Task, Work Log, Stage Summary.

---

## Risk register

| Risk | Mitigation |
|---|---|
| `dangerouslySetInnerHTML` XSS | All text tokens HTML-escaped; `javascript:` URLs dropped; content is author-controlled (checked-in repo files). |
| Generated `docs-data.ts` stale | File header documents regeneration; the file is checked in. |
| Bundle bloat (200 KB markdown) | `DocsViewer` is `next/dynamic` with `ssr: false` — markdown only loads when the Sheet opens. |
| Markdown parser edge cases | Tested against the 19 actual docs at build time (the script logs any file that fails to parse a title). |
| Sheet width on mobile | `w-full` on mobile, `sm:max-w-2xl` on ≥ 640 px. |
| Keyboard conflict with `⌘K` search overlay | The Sheet traps focus; `⌘K` is a global listener that opens the overlay — but when the Sheet is open, Radix focus trap will keep Tab/Shift+Tab inside. `⌘K` is a meta key combo, not affected by focus trap. No conflict. |
