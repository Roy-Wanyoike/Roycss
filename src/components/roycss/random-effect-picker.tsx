"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Copy, Check, ArrowRight, X, Sparkles } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { Badge } from "@/components/ui/badge";

/**
 * RandomEffectPicker — a "Surprise Me" button that picks a random effect.
 * Great for discovery — users might find effects they'd never search for.
 * Shows the effect in a modal-like card with preview + actions.
 */
export function RandomEffectPicker({ onSelectEffect }: { onSelectEffect: (effect: CSSEffect) => void }) {
  const [randomEffect, setRandomEffect] = useState<CSSEffect | null>(null);
  const [copied, setCopied] = useState(false);
  const [spinning, setSpinning] = useState(false);
  // Track the spin interval so we can clear it on unmount (avoids setState
  // on an unmounted component if the user navigates away mid-spin).
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const pickRandom = useCallback(() => {
    setSpinning(true);
    setCopied(false);
    // Clear any in-flight spin before starting a new one.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    let count = 0;
    intervalRef.current = setInterval(() => {
      setRandomEffect(effects[Math.floor(Math.random() * effects.length)]);
      count++;
      if (count >= 12) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSpinning(false);
        setRandomEffect(effects[Math.floor(Math.random() * effects.length)]);
      }
    }, 60);
  }, []);

  const handleCopy = useCallback(async (effect: CSSEffect) => {
    try {
      await navigator.clipboard.writeText(effect.cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Surprise Me button */}
      <button
        onClick={pickRandom}
        disabled={spinning}
        className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all font-medium text-sm cursor-pointer disabled:opacity-70"
      >
        <Shuffle className={`size-4 ${spinning ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
        {spinning ? "Picking..." : "Surprise Me!"}
      </button>

      {/* Result card */}
      <AnimatePresence>
        {randomEffect && (
          <motion.div
            key={randomEffect.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg"
          >
            {/* Preview */}
            <div className="h-32 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 relative overflow-hidden">
              <div className={spinning ? "opacity-50 blur-sm" : ""}>
                <LivePreview effect={randomEffect} />
              </div>
              {!spinning && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500 gap-1">
                    <Sparkles className="size-2.5" /> Random Pick
                  </Badge>
                </div>
              )}
            </div>

            {/* Info + actions */}
            {!spinning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">{randomEffect.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{randomEffect.category} · {randomEffect.tags.slice(0, 2).join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(randomEffect)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-foreground hover:bg-muted/80"}`}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied!" : "Copy CSS"}
                  </button>
                  <button
                    onClick={() => onSelectEffect(randomEffect)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    View <ArrowRight className="size-3.5" />
                  </button>
                  <button
                    onClick={pickRandom}
                    className="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer"
                    aria-label="Pick another"
                    title="Pick another"
                  >
                    <Shuffle className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
