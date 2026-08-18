"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Download,
  Trash2,
  Copy,
  Check,
  Package,
  Sparkles,
} from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-types";
import { categoryMeta } from "@/lib/roycss-effects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface FavoritesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favoriteEffects: CSSEffect[];
  onToggleFavorite: (id: string) => void;
  onSelectEffect: (effect: CSSEffect) => void;
  onClearAll: () => void;
}

export function FavoritesSheet({
  open,
  onOpenChange,
  favoriteEffects,
  onToggleFavorite,
  onSelectEffect,
  onClearAll,
}: FavoritesSheetProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  const combinedCSS = favoriteEffects
    .map((e) => e.cssCode)
    .join("\n\n/* ─────────────────────────────────────────── */\n\n");

  const handleDownload = () => {
    const header = `/*\n * RoyCSS — Custom Collection\n * ${favoriteEffects.length} effect${favoriteEffects.length === 1 ? "" : "s"}\n * Effects: ${favoriteEffects.map((e) => e.name).join(", ")}\n */\n\n`;
    const fullCSS = header + combinedCSS + "\n";
    const blob = new Blob([fullCSS], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roycss-collection.css";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(combinedCSS);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border/50 shrink-0">
          <SheetTitle className="flex items-center gap-2 font-display">
            <Heart className="size-4 text-rose-500 fill-rose-500" />
            My Collection
            <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/20">
              {favoriteEffects.length}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Your saved CSS effects. Export them as a single file or copy all to clipboard.
          </SheetDescription>
        </SheetHeader>

        {favoriteEffects.length > 0 && (
          <div className="p-3 border-b border-border/50 shrink-0 flex items-center gap-2">
            <Button size="sm" onClick={handleDownload} className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
              <Download className="size-3.5" />
              Download .css
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyAll} className="h-8 text-xs flex-1">
              {copiedAll ? (
                <><Check className="size-3.5 text-emerald-500" />Copied!</>
              ) : (
                <><Copy className="size-3.5" />Copy all</>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearAll} className="h-8 text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {favoriteEffects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Heart className="size-7 text-muted-foreground" />
              </motion.div>
              <h3 className="font-display font-semibold text-foreground">No favorites yet</h3>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                Click the <Heart className="inline size-3 text-rose-500" /> icon on any effect to save it here.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {favoriteEffects.map((effect) => (
                  <motion.div
                    key={effect.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <button
                      onClick={() => { onSelectEffect(effect); onOpenChange(false); }}
                      className="size-12 rounded-lg bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
                    >
                      <div className={`roycss-${effect.id} scale-50 origin-center pointer-events-none`} style={{ width: 24, height: 24 }} />
                    </button>
                    <button
                      onClick={() => { onSelectEffect(effect); onOpenChange(false); }}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{effect.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{categoryMeta[effect.category].label}</p>
                    </button>
                    <button
                      onClick={() => onToggleFavorite(effect.id)}
                      className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="size-3.5 fill-rose-500 text-rose-500" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {favoriteEffects.length > 0 && (
          <div className="p-3 border-t border-border/50 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Package className="size-3" />{favoriteEffects.length} effect{favoriteEffects.length === 1 ? "" : "s"}</span>
              <span className="flex items-center gap-1"><Sparkles className="size-3" />{(combinedCSS.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
