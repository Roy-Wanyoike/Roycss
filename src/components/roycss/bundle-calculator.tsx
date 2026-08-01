"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Plus, Minus, Trash2, Copy, Check, Download, X } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LivePreview } from "@/components/roycss/effect-card";

/**
 * BundleCalculator — select effects and see the total CSS size in real-time.
 * Helps developers understand the performance impact of their choices.
 * Includes gzip estimate, tree-shaking comparison, and export.
 */
export function BundleCalculator({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return effects.slice(0, 40);
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q) || e.tags.some(t => t.includes(q))).slice(0, 40);
  }, [search]);

  const selectedEffects = useMemo(() => selected.map(id => effects.find(e => e.id === id)).filter((e): e is CSSEffect => !!e), [selected]);

  const stats = useMemo(() => {
    const totalBytes = selectedEffects.reduce((sum, e) => sum + new Blob([e.cssCode]).size, 0);
    const gzipEstimate = Math.round(totalBytes * 0.15); // CSS gzips to ~15% of original
    const fullBundle = 990000; // ~990KB full minified
    const savings = Math.round((1 - totalBytes / fullBundle) * 100);
    return { totalBytes, gzipEstimate, savings, fullBundle };
  }, [selectedEffects]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleExport = useCallback(() => {
    const css = selectedEffects.map(e => e.cssCode).join("\n\n/* ═══════════════════════════════ */ */\n\n");
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roycss-bundle.css";
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedEffects]);

  const handleCopy = useCallback(async () => {
    const css = selectedEffects.map(e => e.cssCode).join("\n\n");
    try { await navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  }, [selectedEffects]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <Calculator className="size-5 text-primary" />
            Bundle Calculator
          </SheetTitle>
          <SheetDescription>
            Select effects to calculate your CSS bundle size. Compare with the full 990KB library.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5 space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Raw CSS</p>
              <p className="font-display text-lg font-bold text-foreground">{formatSize(stats.totalBytes)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Gzip est.</p>
              <p className="font-display text-lg font-bold text-primary">{formatSize(stats.gzipEstimate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">vs Full</p>
              <p className="font-display text-lg font-bold text-emerald-500">{stats.savings}% saved</p>
            </div>
          </div>

          {/* Selected effects list */}
          {selectedEffects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Selected ({selectedEffects.length})
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={handleCopy} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                    {copied ? <Check className="size-3" /> : <Copy className="size-3" />} Copy
                  </button>
                  <button onClick={handleExport} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer">
                    <Download className="size-3" /> Export
                  </button>
                  <button onClick={() => setSelected([])} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-rose-500 transition-all cursor-pointer">
                    <Trash2 className="size-3" /> Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedEffects.map(e => (
                  <button key={e.id} onClick={() => toggle(e.id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer group">
                    {e.name} <Minus className="size-2.5 group-hover:inline hidden" /><X className="size-2.5 group-hover:hidden" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <Input type="search" placeholder="Search effects to add..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10" />

          {/* Effect list */}
          <div className="max-h-[40vh] overflow-y-auto scrollbar-thin space-y-1">
            {filtered.map(e => {
              const isSelected = selected.includes(e.id);
              const size = new Blob([e.cssCode]).size;
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer text-left ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"}`}
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                    <div className="scale-[0.35] origin-center"><LivePreview effect={e} /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground">{e.category} · {formatSize(size)}</p>
                  </div>
                  <div className={`flex items-center justify-center size-6 rounded-full shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {isSelected ? <Minus className="size-3" /> : <Plus className="size-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comparison bar */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Your bundle vs full library</span>
              <span className="font-mono text-foreground">{formatSize(stats.totalBytes)} / {formatSize(stats.fullBundle)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${Math.min(100, (stats.totalBytes / stats.fullBundle) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {selectedEffects.length === 0 ? "Select effects to see your savings" : `Tree-shaking saves ${formatSize(stats.fullBundle - stats.totalBytes)} (${stats.savings}%)`}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
