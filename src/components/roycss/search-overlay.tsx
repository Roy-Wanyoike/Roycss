"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { effects, categoryMeta } from "@/lib/roycss-effects";
import { recipes } from "@/lib/roycss-recipes";
import { patterns } from "@/lib/roycss-patterns";
import { collections } from "@/lib/roycss-collections";
import type { CSSEffect } from "@/lib/roycss-types";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEffect: (effect: CSSEffect) => void;
  onJumpToSection: (id: string) => void;
}

export function SearchOverlay({ open, onOpenChange, onSelectEffect, onJumpToSection }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) { setQuery(""); setSelectedIndex(0); }
  }

  useEffect(() => {
    if (open) { const t = setTimeout(() => inputRef.current?.focus(), 50); return () => clearTimeout(t); }
  }, [open]);

  const effectResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)) || e.id.includes(q) || e.category.includes(q)).slice(0, 6);
  }, [query]);

  const recipeResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q))).slice(0, 3);
  }, [query]);

  const patternResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return patterns.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))).slice(0, 3);
  }, [query]);

  const collectionResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return collections.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q))).slice(0, 3);
  }, [query]);

  const sectionResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return [
      { id: "what-is-roycss", label: "What is RoyCSS?", desc: "Platform overview — what RoyCSS is and who it's for" },
      { id: "get-started", label: "Get Started", desc: "Installation guide" },
      { id: "effects", label: "Effects", desc: "Browse all 1569+ effects" },
      { id: "recipes", label: "Recipes", desc: "Curated UI patterns" },
      { id: "patterns", label: "Patterns", desc: "UI state patterns" },
      { id: "collections", label: "Collections", desc: "Curated themed effect bundles" },
      { id: "platform", label: "Platform", desc: "62 products — Build, Design, AI, DevTools, Enterprise, Learning" },
      { id: "docs", label: "Docs", desc: "Documentation & guides" },
      { id: "faq", label: "FAQ", desc: "Frequently asked questions" },
    ].filter(s => s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
  }, [query]);

  const totalResults = sectionResults.length + effectResults.length + recipeResults.length + patternResults.length + collectionResults.length;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, totalResults - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      let idx = selectedIndex;
      if (idx < sectionResults.length && sectionResults[idx]) { onJumpToSection("#" + sectionResults[idx].id); onOpenChange(false); return; }
      idx -= sectionResults.length;
      if (idx < effectResults.length && effectResults[idx]) { onSelectEffect(effectResults[idx]); onOpenChange(false); return; }
      idx -= effectResults.length;
      if (idx < recipeResults.length && recipeResults[idx]) { onJumpToSection("#recipes"); onOpenChange(false); return; }
      idx -= recipeResults.length;
      if (idx < patternResults.length && patternResults[idx]) { onJumpToSection("#patterns"); onOpenChange(false); return; }
      idx -= patternResults.length;
      if (idx < collectionResults.length && collectionResults[idx]) { onJumpToSection("#collections"); onOpenChange(false); return; }
    }
  }, [selectedIndex, totalResults, sectionResults, effectResults, recipeResults, patternResults, collectionResults, onJumpToSection, onSelectEffect, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search RoyCSS"
          onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const overlay = e.currentTarget.querySelector(".relative.w-full.max-w-xl");
            if (!overlay) return;
            const focusable = overlay.querySelectorAll<HTMLElement>('button, a, input, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, y: -10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-border/50">
              <Search className="size-5 text-muted-foreground shrink-0" />
              <input ref={inputRef} type="search" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown} placeholder="Search effects, recipes, patterns, sections... (⌘K)"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" autoComplete="off" spellCheck={false} />
              <button onClick={() => onOpenChange(false)} className="flex items-center justify-center size-7 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0" aria-label="Close search">
                <X className="size-3.5" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
              {query.trim() === "" ? (
                <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Search for effects, recipes, patterns, or sections.</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Try: "glass", "loader", "neon", "hero", "loading"</p></div>
              ) : totalResults === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No results for "{query}"</p></div>
              ) : (
                <div className="p-2">
                  {sectionResults.map((s, i) => (
                    <button key={s.id} onClick={() => { onJumpToSection("#" + s.id); onOpenChange(false); }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer text-left ${selectedIndex === i ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                      <div className="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground shrink-0"><ArrowRight className="size-3.5" /></div>
                      <div className="min-w-0"><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                    </button>
                  ))}
                  {effectResults.length > 0 && sectionResults.length > 0 && <div className="h-px bg-border/50 my-1" />}
                  {effectResults.map((effect, i) => {
                    const index = i + sectionResults.length;
                    return (
                      <button key={effect.id} onClick={() => { onSelectEffect(effect); onOpenChange(false); }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer text-left ${selectedIndex === index ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                          <div className={`roycss-${effect.id} scale-50 origin-center`} style={{ width: 16, height: 16 }} />
                        </div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground truncate">{effect.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{categoryMeta[effect.category].label} · {effect.tags.slice(0, 2).join(", ")}</p></div>
                      </button>
                    );
                  })}
                  {recipeResults.length > 0 && (sectionResults.length > 0 || effectResults.length > 0) && <div className="h-px bg-border/50 my-1" />}
                  {recipeResults.map((r, i) => {
                    const index = i + sectionResults.length + effectResults.length;
                    return (
                      <button key={r.id} onClick={() => { onJumpToSection("#recipes"); onOpenChange(false); }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer text-left ${selectedIndex === index ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 text-xs font-bold">R</div>
                        <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{r.name}</p><p className="text-xs text-muted-foreground truncate">Recipe · {r.tags.slice(0, 2).join(", ")}</p></div>
                      </button>
                    );
                  })}
                  {patternResults.length > 0 && (sectionResults.length > 0 || effectResults.length > 0 || recipeResults.length > 0) && <div className="h-px bg-border/50 my-1" />}
                  {patternResults.map((p, i) => {
                    const index = i + sectionResults.length + effectResults.length + recipeResults.length;
                    return (
                      <button key={p.id} onClick={() => { onJumpToSection("#patterns"); onOpenChange(false); }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer text-left ${selectedIndex === index ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10 text-violet-500 shrink-0 text-xs font-bold">P</div>
                        <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{p.name}</p><p className="text-xs text-muted-foreground truncate">Pattern · {p.tags.slice(0, 2).join(", ")}</p></div>
                      </button>
                    );
                  })}
                  {collectionResults.length > 0 && (sectionResults.length > 0 || effectResults.length > 0 || recipeResults.length > 0 || patternResults.length > 0) && <div className="h-px bg-border/50 my-1" />}
                  {collectionResults.map((c, i) => {
                    const index = i + sectionResults.length + effectResults.length + recipeResults.length + patternResults.length;
                    return (
                      <button key={c.id} onClick={() => { onJumpToSection("#collections"); onOpenChange(false); }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer text-left ${selectedIndex === index ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-teal-500/10 text-teal-500 shrink-0 text-base">{c.icon}</div>
                        <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{c.name}</p><p className="text-xs text-muted-foreground truncate">Collection · {c.effectIds.length} effects · {c.tags.slice(0, 2).join(", ")}</p></div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/30">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted border border-border/50">↑↓</kbd>Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted border border-border/50">↵</kbd>Select</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted border border-border/50">Esc</kbd>Close</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{totalResults > 0 && `${totalResults} results`}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
