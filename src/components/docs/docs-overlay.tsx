"use client";

/**
 * DocsOverlay — Full-screen documentation modal.
 *
 * Renders a 3-column documentation experience (sidebar / content / TOC)
 * inside a full-screen overlay launched from the RoyCSS nav bar.
 *
 * Architecture:
 *   - The overlay is a client-side modal (no route change). The URL stays at `/`.
 *   - The docs JSON (`docs-content.json`) is lazy-loaded via `loadDocs()` when
 *     the overlay first opens. Subsequent reopens use the cached data.
 *   - Layout is responsive: 3 columns on lg, 2 on md, 1 on sm.
 *
 * See:
 *   - docs/adr/03-docs-site.md
 *   - docs/threat-models/03-docs-site.md
 *   - docs/plans/03-docs-site.md
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Loader2, Menu, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadDocs,
  getDocs,
  categoryOrder,
  categoryMeta,
  type DocEntry,
  type DocsCategoryId,
} from "./docs-data";
import { DocsSidebar } from "./docs-sidebar";
import { DocsContent } from "./docs-content";
import { DocsSearch } from "./docs-search";
import { DocsToc } from "./docs-toc";

interface DocsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─── Mobile sidebar drawer ──────────────────────────────────── */
function MobileSidebarDrawer({
  open,
  onClose,
  docs,
  selectedSlug,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  docs: DocEntry[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 bg-black/60 z-[310]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-card border-r border-border z-[311] overflow-y-auto scrollbar-thin"
          >
            <div className="sticky top-0 bg-card border-b border-border/40 p-3 flex items-center justify-between z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                {docs.length} architecture docs
              </p>
              <button
                onClick={onClose}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="size-4" />
              </button>
            </div>
            {/* Reuse the sidebar component but force it visible */}
            <div className="md:!flex">
              <DocsSidebar
                docs={docs}
                selectedSlug={selectedSlug}
                onSelect={(slug) => {
                  onSelect(slug);
                  onClose();
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main overlay ───────────────────────────────────────────── */

export function DocsOverlay({ open, onOpenChange }: DocsOverlayProps) {
  const [docs, setDocs] = useState<DocEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchAutoFocus, setSearchAutoFocus] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* ─── Load docs JSON on first open ─────────────────────────── */
  useEffect(() => {
    if (!open) return;
    // If already cached, skip
    const cached = getDocs();
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot cache hydration on first open
      setDocs(cached);
      if (!selectedSlug && cached.length > 0) {
        setSelectedSlug(cached[0].slug);
      }
      return;
    }

    setLoading(true);
    setLoadError(null);
    loadDocs()
      .then((loaded) => {
        setDocs(loaded);
        if (!selectedSlug && loaded.length > 0) {
          setSelectedSlug(loaded[0].slug);
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, selectedSlug]);

  /* ─── Body scroll lock + focus management ──────────────────── */
  useEffect(() => {
    if (!open) return;

    // Save currently focused element to restore on close
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the overlay container
    const focusTimer = setTimeout(() => {
      overlayRef.current?.focus();
      setSearchAutoFocus(true);
    }, 100);

    // Safety timer: if the overlay unmounts mid-animation, ensure overflow is restored
    const safetyTimer = setTimeout(() => {
      if (document.body.style.overflow === "hidden" && !document.querySelector("[data-docs-overlay]")) {
        document.body.style.overflow = "";
      }
    }, 5000);

    return () => {
      clearTimeout(focusTimer);
      clearTimeout(safetyTimer);
      document.body.style.overflow = prevOverflow;
      setSearchAutoFocus(false);
      // Restore focus to the trigger element
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  /* ─── Esc to close ─────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Don't close if mobile sidebar is open — let it close first
        if (mobileSidebarOpen) {
          setMobileSidebarOpen(false);
          return;
        }
        e.preventDefault();
        onOpenChange(false);
      }
      // Cmd/Ctrl+K focuses search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = overlayRef.current?.querySelector<HTMLInputElement>(
          'input[aria-label="Search docs"]',
        );
        searchInput?.focus();
        searchInput?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, mobileSidebarOpen]);

  /* ─── Memoize derived state ────────────────────────────────── */
  const selectedDoc = useMemo<DocEntry | null>(() => {
    if (!docs || !selectedSlug) return null;
    return docs.find((d) => d.slug === selectedSlug) ?? null;
  }, [docs, selectedSlug]);

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug(slug);
    // Scroll content to top on doc switch
    setTimeout(() => {
      const content = document.querySelector("[data-docs-content]");
      if (content) content.scrollTop = 0;
    }, 0);
  }, []);

  /* ─── Render ───────────────────────────────────────────────── */

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          data-docs-overlay
          role="dialog"
          aria-modal="true"
          aria-labelledby="docs-overlay-title"
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] bg-background/95 backdrop-blur-md flex flex-col outline-none"
        >
          {/* ─── Top bar ─────────────────────────────────────── */}
          <header className="shrink-0 border-b border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
              {/* Mobile: open sidebar drawer */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Open doc list"
              >
                <Menu className="size-4" />
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <h2 id="docs-overlay-title" className="text-sm font-semibold text-foreground leading-none">
                    RoyCSS Docs
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    19 architecture documents
                  </p>
                </div>
              </div>

              {/* Search bar */}
              {docs && (
                <DocsSearch
                  docs={docs}
                  onSelect={handleSelect}
                  autoFocus={searchAutoFocus}
                />
              )}

              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                aria-label="Close documentation"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {/* ─── Body: sidebar + content + toc ──────────────── */}
          <div className="flex-1 flex overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Loader2 className="size-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Loading documentation...</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Fetching 19 architecture docs (~820 KB)
                </p>
              </div>
            ) : loadError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <p className="text-sm text-destructive mb-2">Failed to load docs</p>
                <p className="text-xs text-muted-foreground font-mono">{loadError}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Run <code className="font-mono bg-muted px-1.5 py-0.5 rounded">bun run scripts/build-docs.ts</code> to regenerate.
                </p>
              </div>
            ) : docs ? (
              <>
                {/* Desktop sidebar (≥md) */}
                <DocsSidebar
                  docs={docs}
                  selectedSlug={selectedSlug}
                  onSelect={handleSelect}
                />

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto scrollbar-thin bg-background">
                  <DocsContent doc={selectedDoc} isLoading={false} />
                </main>

                {/* Right TOC (≥lg) */}
                <DocsToc toc={selectedDoc?.toc ?? []} docSlug={selectedSlug} />
              </>
            ) : null}
          </div>

          {/* ─── Mobile sidebar drawer ──────────────────────── */}
          <MobileSidebarDrawer
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            docs={docs ?? []}
            selectedSlug={selectedSlug}
            onSelect={handleSelect}
          />

          {/* ─── Footer status bar ──────────────────────────── */}
          <footer className="shrink-0 border-t border-border/40 bg-card/60 backdrop-blur-sm px-4 sm:px-6 h-8 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50">Esc</kbd>
                close
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border/50">⌘K</kbd>
                search
              </span>
            </div>
            {selectedDoc && (
              <span className="truncate max-w-xs">
                {selectedDoc.title}
              </span>
            )}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
