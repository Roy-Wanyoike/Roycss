"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, GitCompare, Heart, Clock, BookOpen, Moon, Sun, Command, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open search overlay", icon: Search },
  { keys: ["⌘", "K"], description: "Close search (press Escape)", icon: Search, alt: true },
  { keys: ["?"], description: "Show this shortcuts panel", icon: Command },
  { keys: ["Esc"], description: "Close any open dialog/sheet", icon: Command },
  { keys: ["↑", "↓"], description: "Navigate search results", icon: Search },
  { keys: ["↵"], description: "Select search result", icon: Search },
  { keys: ["Tab"], description: "Navigate between elements", icon: Command },
  { keys: ["Shift", "Tab"], description: "Navigate backwards", icon: Command },
];

const NAV_SHORTCUTS = [
  { label: "Search", icon: Search, hint: "⌘K" },
  { label: "Playground", icon: SlidersHorizontal, hint: "Navbar" },
  { label: "Compare", icon: GitCompare, hint: "Navbar" },
  { label: "Favorites", icon: Heart, hint: "Navbar" },
  { label: "Recently Used", icon: Clock, hint: "Navbar" },
  { label: "Docs", icon: BookOpen, hint: "Navbar" },
  { label: "Theme Toggle", icon: Moon, hint: "Navbar" },
];

/**
 * KeyboardShortcutsOverlay — press ? to show all available keyboard shortcuts.
 * Also accessible via a button.
 */
export function KeyboardShortcutsOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Press ? (Shift + /) to toggle — only when not typing in a field
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          onOpenChange(!open);
        }
      }
      // Escape closes the overlay (matches WCAG dialog pattern + the
      // "Esc: Close any open dialog/sheet" shortcut listed below)
      if (open && e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  // Focus management: move focus into dialog on open, restore on close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = (document.activeElement as HTMLElement) || null;
      // Defer focus to next frame so the motion.div has mounted
      const id = requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    // On close: restore focus to the trigger that opened the dialog
    if (!open && previouslyFocused.current) {
      previouslyFocused.current.focus?.();
      previouslyFocused.current = null;
    }
  }, [open]);

  // Tab trap — keep focus inside the dialog while it's open.
  const handleTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onKeyDown={handleTab}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border/50 relative">
              <div className="flex items-center gap-2 mb-1">
                <Command className="size-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">Keyboard Shortcuts</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">?</kbd> anytime to toggle this panel.
              </p>
              {/* Visible close button — keyboard-accessible (Esc also closes) */}
              <button
                ref={closeButtonRef}
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Close keyboard shortcuts"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="p-5 space-y-4">
              {/* Keyboard shortcuts */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Keyboard</p>
                <div className="space-y-2">
                  {SHORTCUTS.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground/80">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 rounded-md bg-muted border border-border/50 text-xs font-mono font-medium text-foreground"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navbar shortcuts */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access (Navbar)</p>
                <div className="grid grid-cols-2 gap-2">
                  {NAV_SHORTCUTS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <s.icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground/80 truncate">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{s.hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border/50 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                All shortcuts work on desktop. Mobile users can access features via the navbar.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
