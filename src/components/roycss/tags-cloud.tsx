"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Tag, X } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

/**
 * TagsCloud — a visual cloud of all effect tags, sized by popularity.
 * Click a tag to filter the effects grid. Great for discovery — users
 * can find effects by concept ("glow", "neon", "glass") rather than
 * by category.
 */
export function TagsCloud({ onTagSelect }: { onTagSelect: (tag: string) => void }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tagData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of effects) {
      for (const tag of e.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60); // Top 60 tags
  }, []);

  const maxCount = tagData[0]?.[1] || 1;
  const minCount = tagData[tagData.length - 1]?.[1] || 1;

  const getTagSize = (count: number) => {
    const ratio = (count - minCount) / Math.max(1, maxCount - minCount);
    // Map to Tailwind text sizes
    if (ratio > 0.8) return "text-base font-bold";
    if (ratio > 0.6) return "text-sm font-semibold";
    if (ratio > 0.4) return "text-sm font-medium";
    if (ratio > 0.2) return "text-xs font-medium";
    return "text-xs";
  };

  const getTagColor = (count: number) => {
    const ratio = (count - minCount) / Math.max(1, maxCount - minCount);
    if (ratio > 0.8) return "bg-primary/15 text-primary border-primary/30";
    if (ratio > 0.6) return "bg-primary/10 text-primary border-primary/20";
    if (ratio > 0.4) return "bg-muted text-foreground border-border/50";
    if (ratio > 0.2) return "bg-muted/60 text-muted-foreground border-border/40";
    return "bg-muted/40 text-muted-foreground border-transparent";
  };

  return (
    <ScrollReveal>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="size-4 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Popular Tags</h3>
          <span className="text-xs text-muted-foreground">— click to filter</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tagData.map(([tag, count]) => {
            const isSelected = selectedTag === tag;
            return (
              <motion.button
                key={tag}
                onClick={() => {
                  if (isSelected) {
                    setSelectedTag(null);
                    onTagSelect("");
                  } else {
                    setSelectedTag(tag);
                    onTagSelect(tag);
                  }
                }}
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${getTagColor(count)} ${getTagSize(count)} ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                aria-label={`Filter by tag "${tag}" (${count} effects)`}
                aria-pressed={isSelected}
              >
                {tag}
                <span className="text-[9px] opacity-60 font-normal">{count}</span>
                {isSelected && <X className="size-2.5" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
}
