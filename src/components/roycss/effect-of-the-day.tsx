"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Calendar } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

/**
 * EffectOfTheDay — auto-selects a "featured effect of the day" based on
 * the current date. This creates a reason for users to return daily.
 *
 * Selection algorithm: hash the date string to a stable index in the
 * effects array. Same effect shows all day, changes at midnight.
 *
 * NOTE: This component is hydration-sensitive. `new Date()` returns
 * different values on the server (UTC) vs client (user's timezone),
 * which causes a hydration mismatch. We render a skeleton placeholder
 * during SSR and the first client render, then compute the real effect
 * after mounting.
 */
function getEffectOfTheDay(): CSSEffect {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  // Simple hash: sum char codes
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % effects.length;
  return effects[index];
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface EffectOfTheDayProps {
  onSelectEffect: (effect: CSSEffect) => void;
}

export function EffectOfTheDay({ onSelectEffect }: EffectOfTheDayProps) {
  // Compute effect + date label only on the client to avoid hydration mismatch.
  // The server and client may be in different timezones, so new Date() can
  // produce different dates — causing both the effect selection (via hash)
  // and the formatted date string to differ.
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Defer to next frame to satisfy react-hooks/set-state-in-effect rule
    // (same pattern used by easing-visualizer, perf-analyzer, etc.)
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const effect = mounted ? getEffectOfTheDay() : null;
  const todayLabel = mounted ? getTodayLabel() : "";

  return (
    <ScrollReveal>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => effect && onSelectEffect(effect)}
        className="group relative max-w-2xl mx-auto rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
      >
        {/* Glow aura */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute -top-20 -right-20 size-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative p-5 sm:p-6 flex items-center gap-5">
          {/* Preview */}
          <div className="flex items-center justify-center size-20 sm:size-24 rounded-xl bg-muted/40 border border-border/50 overflow-hidden shrink-0">
            {effect ? (
              <div className="scale-75 origin-center">
                <LivePreview effect={effect} />
              </div>
            ) : (
              <div className="size-12 rounded-lg bg-muted animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary gap-1">
                <Calendar className="size-2.5" />
                {todayLabel || "\u00A0"}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500 gap-1">
                <Sparkles className="size-2.5" />
                Effect of the Day
              </Badge>
            </div>
            {effect ? (
              <>
                <h3 className="font-display text-lg font-bold text-foreground truncate">
                  {effect.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                  {effect.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    .roycss-{effect.id}
                  </code>
                  <span className="text-xs text-muted-foreground">{effect.category}</span>
                </div>
              </>
            ) : (
              <>
                <div className="h-5 w-40 rounded bg-muted animate-pulse mt-1" />
                <div className="h-3 w-56 rounded bg-muted/70 animate-pulse mt-2" />
                <div className="h-3 w-24 rounded bg-muted/50 animate-pulse mt-1.5" />
              </>
            )}
          </div>

          {/* Arrow */}
          <motion.div
            animate={{ x: hovered ? 4 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ArrowRight className="size-4" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}
