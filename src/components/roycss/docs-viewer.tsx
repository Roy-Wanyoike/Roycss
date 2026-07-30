"use client";

/**
 * DocsViewer — in-app documentation viewer.
 *
 * Opens from the navbar "Docs" button as a right-side Sheet. Renders the 19
 * markdown architecture documents from /docs/*.md (compiled into
 * src/lib/docs-data.ts at build time) with search, category filter, table of
 * contents, and styled code blocks.
 *
 * Design: docs/adr/documentation-viewer/DESIGN.md
 * ADRs:   docs/adr/documentation-viewer/ADR.md
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search,
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Hash,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { docsIndex, type DocEntry } from "@/lib/docs-data";

interface DocsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─── Markdown rendering ─────────────────────────────────────────
   Hand-rolled CommonMark-subset renderer. See ADR-002 for rationale.
   Output is HTML string consumed via dangerouslySetInnerHTML. All text
   tokens are HTML-escaped before re-injection; javascript: URLs dropped. */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Render inline markdown (bold, italic, code, links, strikethrough). */
function renderInline(s: string): string {
  // Escape HTML first — no raw HTML passes through.
  let out = escapeHtml(s);

  // Inline code — extract first so we don't process markdown inside.
  const codeSpans: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeSpans.push(code);
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });

  // Links [text](url) — optional title "..." ignored.
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_m, text: string, url: string) => {
      if (/^javascript:/i.test(url)) return text;
      const safeUrl = /^(https?:|mailto:|\/|#)/i.test(url) ? url : "#";
      return `<a href="${escapeAttr(safeUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline-offset-2">${text}</a>`;
    },
  );

  // Bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic *text* and _text_ (avoid matching inside bold leftovers).
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

  // Strikethrough ~~text~~
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // Restore code spans.
  out = out.replace(
    /\u0000CODE(\d+)\u0000/g,
    (_m, i: string) =>
      `<code class="roycss-doc-inline-code px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[0.85em] font-mono">${codeSpans[+i]}</code>`,
  );

  return out;
}

interface CodeBlock {
  lang: string;
  raw: string;
}

/** Render a fenced code block to HTML with copy button + language badge. */
function renderCodeBlock(code: string, lang: string): string {
  const escaped = escapeHtml(code);
  const attrRaw = escapeAttr(code);
  const langLabel = lang || "text";
  return (
    `<div class="roycss-doc-code-wrap relative my-4 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">` +
    `<div class="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60">` +
    `<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400">${escapeHtml(langLabel)}</span>` +
    `<button type="button" data-raw="${attrRaw}" class="roycss-doc-copy flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors" aria-label="Copy code">` +
    `<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>` +
    `<span>Copy</span>` +
    `</button>` +
    `</div>` +
    `<pre class="roycss-doc-code overflow-x-auto p-4 text-[12.5px] leading-relaxed text-zinc-100 font-mono"><code>${escaped}</code></pre>` +
    `</div>`
  );
}

/** Render a full markdown document to an HTML string. */
function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      html.push(renderCodeBlock(code.join("\n"), lang));
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const slug = level === 2 ? slugify(text) : "";
      const idAttr = slug ? ` id="${slug}"` : "";
      const cls = [
        "roycss-doc-h",
        level === 1
          ? "text-2xl font-bold tracking-tight mt-2 mb-3 text-foreground"
          : level === 2
            ? "text-xl font-semibold mt-7 mb-3 text-foreground scroll-mt-4"
            : level === 3
              ? "text-base font-semibold mt-5 mb-2 text-foreground"
              : "text-sm font-semibold mt-4 mb-2 text-foreground uppercase tracking-wide",
      ].join(" ");
      html.push(`<h${level}${idAttr} class="${cls}">${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      html.push('<hr class="my-5 border-border/60" />');
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html.push(
        `<blockquote class="my-4 pl-4 py-1 border-l-2 border-primary/40 bg-muted/40 rounded-r-md text-muted-foreground italic">${renderInline(quote.join(" "))}</blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: Array<{ indent: number; text: string }> = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)[-*+]\s+(.+)$/);
        if (m) items.push({ indent: m[1].length, text: m[2] });
        i++;
      }
      html.push(renderList(items, "ul"));
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: Array<{ indent: number; text: string }> = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.+)$/);
        if (m) items.push({ indent: m[1].length, text: m[2] });
        i++;
      }
      html.push(renderList(items, "ol"));
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-block lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4}\s|```|---+\s*$|\*\*\*+\s*$|>\s?|\s*[-*+]\s+|\s*\d+\.\s+)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length > 0) {
      html.push(
        `<p class="my-3 text-sm leading-relaxed text-foreground/90">${renderInline(para.join(" "))}</p>`,
      );
    }
  }

  return html.join("\n");
}

/** Render a list (ul/ol) with optional 1-level nesting. */
function renderList(
  items: Array<{ indent: number; text: string }>,
  tag: "ul" | "ol",
): string {
  const itemCls = "my-1 text-sm leading-relaxed text-foreground/90";
  const listCls =
    tag === "ul"
      ? "my-3 pl-5 space-y-1 list-disc text-foreground/90"
      : "my-3 pl-5 space-y-1 list-decimal text-foreground/90";
  const out: string[] = [`<${tag} class="${listCls}">`];
  let prevIndent = 0;
  for (const it of items) {
    if (it.indent > prevIndent) {
      out.push(`<${tag} class="${listCls}">`);
    } else if (it.indent < prevIndent) {
      out.push(`</${tag}>`);
    }
    out.push(`<li class="${itemCls}">${renderInline(it.text)}</li>`);
    prevIndent = it.indent;
  }
  while (prevIndent > 0) {
    out.push(`</${tag}>`);
    prevIndent -= 2;
  }
  out.push(`</${tag}>`);
  return out.join("");
}

/** Build a table of contents (H2 headings only). */
function buildToc(src: string): Array<{ id: string; text: string }> {
  const lines = src.split("\n");
  const toc: Array<{ id: string; text: string }> = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      toc.push({ id: slugify(m[1]), text: m[1].trim() });
    }
  }
  return toc;
}

/* ─── Component ────────────────────────────────────────────────── */

export function DocsViewer({ open, onOpenChange }: DocsViewerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const copyKeyRef = useRef(0);

  /* Categories derived from docsIndex. */
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of docsIndex) map.set(d.category, d.categoryLabel);
    return Array.from(map.entries()).map(([category, label]) => ({ category, label }));
  }, []);

  /* Debounce search input. */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setActiveIndex(0);
    }, 80);
    return () => clearTimeout(t);
  }, [query]);

  /* Filter + sort. */
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const results: Array<{ doc: DocEntry; bucket: number }> = [];
    for (const doc of docsIndex) {
      if (activeCategory !== "all" && doc.category !== activeCategory) continue;
      if (!q) {
        results.push({ doc, bucket: 3 });
        continue;
      }
      const titleHit = doc.title.toLowerCase().includes(q);
      const catHit = doc.categoryLabel.toLowerCase().includes(q);
      const contentHit = doc.content.toLowerCase().includes(q);
      if (titleHit) results.push({ doc, bucket: 0 });
      else if (catHit) results.push({ doc, bucket: 1 });
      else if (contentHit) results.push({ doc, bucket: 2 });
    }
    results.sort((a, b) => {
      if (a.bucket !== b.bucket) return a.bucket - b.bucket;
      return a.doc.title.localeCompare(b.doc.title, undefined, { sensitivity: "base" });
    });
    return results.map((r) => r.doc);
  }, [debouncedQuery, activeCategory]);

  const selectedDoc = useMemo(
    () => (selectedSlug ? docsIndex.find((d) => d.slug === selectedSlug) ?? null : null),
    [selectedSlug],
  );

  const toc = useMemo(
    () => (selectedDoc ? buildToc(selectedDoc.content) : []),
    [selectedDoc],
  );

  const renderedHtml = useMemo(
    () => (selectedDoc ? renderMarkdown(selectedDoc.content) : ""),
    [selectedDoc],
  );

  /* Reset state when the Sheet closes. */
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSelectedSlug(null);
        setQuery("");
        setDebouncedQuery("");
        setActiveCategory("all");
        setActiveIndex(0);
      }, 250); // wait for close animation
      return () => clearTimeout(t);
    } else {
      // Focus search input when Sheet opens.
      const t = setTimeout(() => searchInputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* Scroll active row into view. */
  useEffect(() => {
    if (!open || selectedSlug) return;
    const container = listRef.current;
    if (!container) return;
    const row = container.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    if (row) row.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, selectedSlug]);

  /* Reset content scroll when a doc opens. */
  useEffect(() => {
    if (selectedSlug && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0 });
      // Blur the search input so Backspace (handled by the window listener
      // below) returns to the list instead of trying to edit empty search text.
      const active = document.activeElement as HTMLElement | null;
      if (active && active.tagName === "INPUT" && active.getAttribute("aria-label") === "Search documentation") {
        active.blur();
      }
    }
  }, [selectedSlug]);

  /* Window-level Backspace handler: when a doc is open and the user is not
     focused on a form field, Backspace returns to the list. Radix Sheet
     re-focuses the search input after a click; a React onKeyDown on
     SheetContent would miss Backspace when focus is elsewhere. The capture
     phase lets us intercept before browser back-nav on some platforms. */
  useEffect(() => {
    if (!open || !selectedSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Backspace") return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const inField =
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable;
      if (inField) return; // let the user edit
      e.preventDefault();
      setSelectedSlug(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, selectedSlug]);

  /* Keyboard navigation:
     - Detail view: Backspace returns to list (handled by the window listener
       above; Escape closes the Sheet — Radix handles that natively at the
       document level, so we don't intercept it here).
     - List view: ArrowUp/ArrowDown move the active row, Enter opens it.
     Inputs/textareas are skipped so typing/backspace in search isn't
     hijacked. */
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const inEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (selectedSlug) {
        // Detail view: Backspace returns to list (Esc closes — Radix native).
        if (e.key === "Backspace" && !inEditable) {
          e.preventDefault();
          setSelectedSlug(null);
        }
        return;
      }
      if (inEditable) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const doc = filtered[activeIndex];
        if (doc) setSelectedSlug(doc.slug);
      }
    },
    [selectedSlug, filtered, activeIndex],
  );

  /* Copy code button — event delegation. */
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest(".roycss-doc-copy") as HTMLElement | null;
      if (!target) return;
      const raw = target.getAttribute("data-raw") || "";
      const key = `c${++copyKeyRef.current}`;
      // Decode HTML entities (getAttribute already decodes them).
      navigator.clipboard
        .writeText(raw)
        .then(() => {
          setCopiedKey(key);
          target.setAttribute("data-copied", "1");
          const label = target.querySelector("span");
          if (label) label.textContent = "Copied";
          setTimeout(() => {
            setCopiedKey(null);
            target.removeAttribute("data-copied");
            if (label) label.textContent = "Copy";
          }, 1800);
        })
        .catch(() => {
          /* noop */
        });
    },
    [],
  );

  /* TOC click — scroll content to heading. */
  const handleTocClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      const container = contentScrollRef.current;
      if (!container) return;
      const el = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
      if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[672px] sm:max-w-2xl p-0 gap-0 flex flex-col"
        onKeyDown={handleListKeyDown}
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border/60 shrink-0">
          <SheetTitle className="flex items-center gap-2 font-display text-base">
            <FileText className="size-4 text-primary" />
            Documentation
            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              {docsIndex.length} docs
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Architecture, labs, and blueprint documents. Search, browse, and read inline.
          </SheetDescription>
        </SheetHeader>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-border/60 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs by title, category, or content…"
              className="pl-9 pr-8 h-9 text-sm"
              aria-label="Search documentation"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CategoryChip
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              label="All"
              count={docsIndex.length}
            />
            {categories.map((c) => {
              const count = docsIndex.filter((d) => d.category === c.category).length;
              return (
                <CategoryChip
                  key={c.category}
                  active={activeCategory === c.category}
                  onClick={() => setActiveCategory(c.category)}
                  label={c.label}
                  count={count}
                />
              );
            })}
          </div>
        </div>

        {/* Body */}
        {selectedDoc ? (
          /* ── Detail view ── */
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="px-5 py-2.5 border-b border-border/60 shrink-0 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedSlug(null)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[36px] cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                Back to list
              </button>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px] font-normal">
                  {selectedDoc.categoryLabel}
                </Badge>
                <span>{selectedDoc.wordCount.toLocaleString()} words</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex">
              {/* TOC sidebar (sticky on sm+) */}
              {toc.length > 0 && (
                <nav
                  aria-label="Table of contents"
                  className="hidden sm:block w-44 shrink-0 border-r border-border/60 overflow-y-auto py-4 px-3"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    <Hash className="size-3" />
                    On this page
                  </div>
                  <ul className="space-y-0.5">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => handleTocClick(e, item.id)}
                          className="block text-[11px] leading-snug text-muted-foreground hover:text-foreground py-1 px-2 rounded hover:bg-muted/50 transition-colors line-clamp-2"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {/* Markdown content */}
              <div
                ref={contentScrollRef}
                onClick={handleContentClick}
                className="flex-1 min-h-0 overflow-y-auto px-5 py-5"
              >
                <div
                  className="roycss-doc-prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
                <div className="mt-8 pt-4 border-t border-border/40 text-[10px] text-muted-foreground">
                  Source: <code className="font-mono">docs/{selectedDoc.slug}.md</code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── List view ── */
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto"
            role="listbox"
            aria-label="Documentation list"
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center text-muted-foreground">
                <Search className="size-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No docs match &ldquo;{query}&rdquo;</p>
                <p className="text-xs mt-1">Try a different keyword or category.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {filtered.map((doc, idx) => (
                  <li key={doc.slug} role="option" aria-selected={idx === activeIndex}>
                    <button
                      data-idx={idx}
                      onClick={() => setSelectedSlug(doc.slug)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full text-left px-5 py-3.5 transition-colors min-h-[68px] flex flex-col gap-1 cursor-pointer",
                        idx === activeIndex
                          ? "bg-primary/5 border-l-2 border-primary"
                          : "hover:bg-muted/40 border-l-2 border-transparent",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground line-clamp-1">
                          {doc.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-normal shrink-0 px-1.5 py-0"
                        >
                          {doc.categoryLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                        {doc.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 mt-0.5">
                        <span>{doc.wordCount.toLocaleString()} words</span>
                        <span>·</span>
                        <code className="font-mono">{doc.slug}.md</code>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer — keyboard hints */}
        <div className="px-5 py-2 border-t border-border/60 shrink-0 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            {!selectedSlug && (
              <>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">Enter</kbd>
                  open
                </span>
              </>
            )}
            {selectedSlug && (
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">⌫</kbd>
                back to list
              </span>
            )}
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border/60 font-mono text-[9px]">Esc</kbd>
              close
            </span>
          </div>
          <span className="hidden sm:inline">{filtered.length} of {docsIndex.length}</span>
        </div>

        {/* Visually-hidden live region for copy announcements */}
        <span className="sr-only" aria-live="polite">
          {copiedKey ? "Code copied to clipboard" : ""}
        </span>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Category chip ────────────────────────────────────────────── */

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all cursor-pointer border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:border-border",
      )}
      aria-pressed={active}
    >
      {label}
      <span
        className={cn(
          "text-[9px] font-normal tabular-nums",
          active ? "text-primary-foreground/70" : "text-muted-foreground/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}
