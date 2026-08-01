"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Copy, Check, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";

const STORAGE_KEY = "roycss-recent";
const MAX_RECENT = 10;

/**
 * Recently Used Effects — tracks the last 10 effects the user interacted with
 * (copied, viewed in detail dialog, or opened in playground). Stored in
 * localStorage so it persists across sessions.
 */

// Global event system — any component can push an effect to "recent"
export function pushRecentEffect(effectId: string) {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = stored.filter((id: string) => id !== effectId);
    filtered.unshift(effectId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
    // Dispatch event so the panel updates if open
    window.dispatchEvent(new CustomEvent("roycss-recent-change"));
  } catch { /* localStorage not available */ }
}

export function getRecentEffectIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

interface RecentEffectsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEffect: (effect: CSSEffect) => void;
}

export function RecentEffectsSheet({ open, onOpenChange, onSelectEffect }: RecentEffectsSheetProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setRecentIds(getRecentEffectIds());
    update();
    window.addEventListener("roycss-recent-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("roycss-recent-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const recentEffects = recentIds
    .map(id => effects.find(e => e.id === id))
    .filter((e): e is CSSEffect => e !== undefined);

  const handleCopy = useCallback(async (effect: CSSEffect) => {
    try {
      await navigator.clipboard.writeText(`roycss-${effect.id}`);
      setCopiedId(effect.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* noop */ }
  }, []);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentIds([]);
    window.dispatchEvent(new CustomEvent("roycss-recent-change"));
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <Clock className="size-5 text-primary" />
            Recently Used
          </SheetTitle>
          <SheetDescription>
            Effects you&apos;ve copied or viewed recently. Persists across sessions.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5">
          {recentEffects.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-display text-base font-semibold text-foreground">No history yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy or view effects to see them here.
              </p>
            </div>
          ) : (
            <>
              {/* Clear button */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">
                  {recentEffects.length} of {MAX_RECENT} recent
                </span>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="size-3" /> Clear
                </button>
              </div>

              {/* Recent effects list */}
              <div className="space-y-2">
                {recentEffects.map((effect, i) => (
                  <div
                    key={effect.id}
                    className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all"
                  >
                    {/* Index */}
                    <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                      {i + 1}
                    </span>

                    {/* Mini preview */}
                    <div className="flex items-center justify-center size-11 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                      <div className="scale-[0.45] origin-center">
                        <LivePreview effect={effect} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{effect.name}</p>
                      <p className="text-xs text-muted-foreground truncate font-mono">{effect.id}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(effect)}
                        className={`flex items-center justify-center size-8 rounded-lg transition-all cursor-pointer ${
                          copiedId === effect.id ? "bg-emerald-500/15 text-emerald-500" : "bg-muted/60 text-muted-foreground hover:text-primary"
                        }`}
                        aria-label={`Copy ${effect.name} class name`}
                        title="Copy class name"
                      >
                        {copiedId === effect.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          onSelectEffect(effect);
                          onOpenChange(false);
                        }}
                        className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        aria-label={`View ${effect.name} details`}
                        title="View details"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
