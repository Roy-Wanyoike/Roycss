"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3x3, ChevronRight, X } from "lucide-react";
import { effects, categoryMeta, categoryOrder } from "@/lib/roycss-effects";
import type { EffectCategory } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { ScrollReveal } from "@/components/roycss/motion-primitives";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, string> = {
  animations: "▶", hover: "🖱", text: "T", backgrounds: "🎨", loaders: "⟳",
  "3d-transforms": "🎲", buttons: "▣", cards: "▢", borders: "▦", filters: "◐",
  forms: "📋", navigation: "🧭", scroll: "📜", cursor: "✦", "page-transitions": "⇄",
  "glass-ui": "🪟", particles: "✧", microinteractions: "⚙", visual: "✨", misc: "★",
};

/**
 * CategoryExplorer — a visual grid of all 20 categories, each showing
 * a live mini-preview of a representative effect. Clicking a category
 * scrolls to the effects grid and filters by that category.
 *
 * This gives users a bird's-eye view of the entire library before
 * diving into individual effects.
 */
export function CategoryExplorer({ onCategorySelect }: { onCategorySelect: (cat: EffectCategory | "all") => void }) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Pick one representative effect per category (first one)
  const categoryPreviews = useMemo(() => {
    const map: Record<string, typeof effects[0]> = {};
    for (const cat of categoryOrder) {
      const found = effects.find(e => e.category === cat);
      if (found) map[cat] = found;
    }
    return map;
  }, []);

  return (
    <ScrollReveal>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Grid3x3 className="size-4 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Explore by Category</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          20 categories · {effects.length} effects — hover to preview, click to filter
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {categoryOrder.map((cat) => {
            const meta = categoryMeta[cat];
            const count = effects.filter(e => e.category === cat).length;
            const preview = categoryPreviews[cat];
            const isHovered = hoveredCategory === cat;

            return (
              <motion.button
                key={cat}
                onClick={() => onCategorySelect(cat)}
                onHoverStart={() => setHoveredCategory(cat)}
                onHoverEnd={() => setHoveredCategory(null)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                aria-label={`Filter by ${meta.label} (${count} effects)`}
              >
                {/* Mini preview background */}
                {preview && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                    <div className="flex items-center justify-center h-full">
                      <div className="scale-150 origin-center">
                        <LivePreview effect={preview} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {CATEGORY_ICONS[cat] || "●"}
                  </span>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground leading-tight">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{count} effects</p>
                  </div>
                </div>

                {/* Hover arrow */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute top-1.5 right-1.5 z-20"
                    >
                      <ChevronRight className="size-3 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}
