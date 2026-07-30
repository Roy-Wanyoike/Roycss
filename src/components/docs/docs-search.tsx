"use client";

/**
 * DocsSearch — Top-bar search input + dropdown results.
 *
 * Filters all docs by case-insensitive substring match across title,
 * description, and content. Highlights matched substrings using React
 * text nodes (NOT dangerouslySetInnerHTML — see threat-models/03-docs-site.md §T2).
 *
 * Renders a dropdown panel below the input when a query is active. Clicking
 * a result selects that doc. Keyboard: ArrowUp/ArrowDown to navigate,
 * Enter to select, Esc to clear.
 *
 * Performance: with 19 docs × ~50 KB content, the substring scan completes
 * in <10 ms on a modern laptop. No external index (FlexSearch/Lunr) is
 * shipped. See benchmarks/03-docs-site.md §2.3.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, X, CornerDownLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocEntry } from "./docs-data";

interface DocsSearchProps {
  docs: DocEntry[];
  onSelect: (slug: string) => void;
  onClearQuery?: () => void;
  autoFocus?: boolean;
}

interface SearchResult {
  doc: DocEntry;
  /** The first matching snippet (truncated to ~120 chars around the match). */
  snippet: string;
  /** The match index inside the snippet (for highlighting). -1 if no content match. */
  matchIndex: number;
  /** The match length. */
  matchLength: number;
}

const MAX_RESULTS = 20;
const SNIPPET_RADIUS = 60;

/** Find the first occurrence of `query` (lowercased) in `text` (lowercased),
 *  returning a snippet around the match. Returns null if no match. */
function findSnippet(text: string, query: string): { snippet: string; matchIndex: number; matchLength: number } | null {
  if (!query) return null;
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(query);
  if (idx === -1) return null;

  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(text.length, idx + query.length + SNIPPET_RADIUS);
  const snippet = (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  const matchIndex = (start > 0 ? 1 : 0) + (idx - start);
  return { snippet, matchIndex, matchLength: query.length };
}

/** Render `text` with the substring [start, start+length) wrapped in a <mark>. */
function HighlightedText({ text, start, length }: { text: string; start: number; length: number }) {
  if (start < 0 || length <= 0 || start >= text.length) {
    return <>{text}</>;
  }
  const before = text.slice(0, start);
  const match = text.slice(start, start + length);
  const after = text.slice(start + length);
  return (
    <>
      {before}
      <mark className="bg-primary/20 text-primary rounded px-0.5 font-medium">{match}</mark>
      {after}
    </>
  );
}

export function DocsSearch({ docs, onSelect, onClearQuery, autoFocus }: DocsSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when autoFocus prop becomes true
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  // Reset active index when query changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot reset on query change
    setActiveIndex(0);
  }, [query]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: SearchResult[] = [];
    for (const doc of docs) {
      // Always include docs that match title or description
      const titleHit = doc.title.toLowerCase().includes(q);
      const descHit = doc.description.toLowerCase().includes(q);
      const snippet = findSnippet(doc.content, q);

      if (titleHit || descHit || snippet) {
        out.push({
          doc,
          snippet: snippet?.snippet ?? doc.description,
          matchIndex: snippet?.matchIndex ?? -1,
          matchLength: snippet?.matchLength ?? 0,
        });
      }
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  }, [docs, query]);

  const totalMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q),
    ).length;
  }, [docs, query]);

  const handleSelect = useCallback(
    (slug: string) => {
      onSelect(slug);
      setQuery("");
      onClearQuery?.();
      inputRef.current?.blur();
    },
    [onSelect, onClearQuery],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex].doc.slug);
    } else if (e.key === "Escape") {
      if (query) {
        e.preventDefault();
        setQuery("");
        onClearQuery?.();
      }
    }
  };

  const showDropdown = query.trim().length > 0;

  return (
    <div className="relative flex-1 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search 19 architecture docs… (titles, content, descriptions)"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search docs"
          className="w-full h-10 pl-10 pr-10 rounded-lg bg-muted/60 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              onClearQuery?.();
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border/60 bg-card shadow-2xl overflow-hidden z-50 max-h-[60vh] flex flex-col">
          <div className="px-3 py-2 border-b border-border/40 bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              {results.length === 0
                ? "No results"
                : `Showing ${results.length}${totalMatches > results.length ? ` of ${totalMatches}` : ""} matches`}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50 text-[10px]">↑↓</kbd>
              navigate
              <kbd className="ml-2 px-1 py-0.5 rounded bg-muted border border-border/50 text-[10px]">↵</kbd>
              select
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No docs match <span className="font-medium text-foreground">&quot;{query}&quot;</span>
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try a different keyword, or browse the sidebar.
              </p>
            </div>
          ) : (
            <ul className="overflow-y-auto scrollbar-thin flex-1">
              {results.map((result, i) => {
                const isActive = i === activeIndex;
                return (
                  <li key={result.doc.slug}>
                    <button
                      onClick={() => handleSelect(result.doc.slug)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 border-b border-border/20 transition-colors cursor-pointer flex flex-col gap-1",
                        isActive ? "bg-primary/10" : "hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-primary/70 shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate flex-1">
                          {result.doc.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 shrink-0">
                          {result.doc.categoryLabel}
                        </span>
                        {isActive && (
                          <CornerDownLeft className="size-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {result.matchIndex >= 0 ? (
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-2">
                          <HighlightedText
                            text={result.snippet}
                            start={result.matchIndex}
                            length={result.matchLength}
                          />
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/80 italic line-clamp-1">
                          Matched in title or description.
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
