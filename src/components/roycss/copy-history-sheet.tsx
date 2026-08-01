"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard, X, Copy, Check, ArrowRight, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";

const STORAGE_KEY = "roycss-clipboard-history";
const MAX_HISTORY = 15;

interface ClipEntry {
  effectId: string;
  cssCode: string;
  timestamp: number;
}

/**
 * CopyHistorySheet — tracks every CSS code copy the user makes.
 * Like a clipboard manager specifically for RoyCSS effects.
 * Accessible from the navbar (Clipboard icon).
 */

export function pushToCopyHistory(effectId: string, cssCode: string) {
  if (typeof window === "undefined") return;
  try {
    const stored: ClipEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Remove duplicate if same effect was copied
    const filtered = stored.filter(e => e.effectId !== effectId);
    filtered.unshift({ effectId, cssCode, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
    window.dispatchEvent(new CustomEvent("roycss-clipboard-change"));
  } catch { /* noop */ }
}

interface CopyHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEffect: (effect: CSSEffect) => void;
}

export function CopyHistorySheet({ open, onOpenChange, onSelectEffect }: CopyHistorySheetProps) {
  const [history, setHistory] = useState<ClipEntry[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      try {
        setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      } catch { setHistory([]); }
    };
    update();
    window.addEventListener("roycss-clipboard-change", update);
    return () => window.removeEventListener("roycss-clipboard-change", update);
  }, []);

  const handleCopy = useCallback(async (entry: ClipEntry, idx: number) => {
    try {
      await navigator.clipboard.writeText(entry.cssCode);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* noop */ }
  }, []);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    window.dispatchEvent(new CustomEvent("roycss-clipboard-change"));
  }, []);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <Clipboard className="size-5 text-primary" />
            Copy History
          </SheetTitle>
          <SheetDescription>
            Every CSS code you&apos;ve copied. Re-copy or view details.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clipboard className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-display text-base font-semibold text-foreground">No copies yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy any effect&apos;s CSS to see it here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">{history.length} copies</span>
                <button onClick={handleClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer">
                  <Trash2 className="size-3" /> Clear
                </button>
              </div>

              <div className="space-y-2">
                {history.map((entry, i) => {
                  const effect = effects.find(e => e.id === entry.effectId);
                  return (
                    <div key={i} className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-card hover:border-primary/40 transition-all">
                      {/* Mini preview */}
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                        {effect ? (
                          <div className="scale-[0.4] origin-center"><LivePreview effect={effect} /></div>
                        ) : (
                          <Copy className="size-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {effect?.name || entry.effectId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(entry.timestamp)} · {entry.cssCode.length} chars
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(entry, i)}
                          className={`flex items-center justify-center size-8 rounded-lg transition-all cursor-pointer ${
                            copiedIdx === i ? "bg-emerald-500/15 text-emerald-500" : "bg-muted/60 text-muted-foreground hover:text-primary"
                          }`}
                          aria-label="Re-copy CSS"
                          title="Re-copy"
                        >
                          {copiedIdx === i ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        </button>
                        {effect && (
                          <button
                            onClick={() => { onSelectEffect(effect); onOpenChange(false); }}
                            className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                            aria-label="View details"
                            title="View details"
                          >
                            <ArrowRight className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
