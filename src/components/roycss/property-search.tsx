"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SearchCode, X } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

const PROPERTIES = [
  "transform", "filter", "backdrop-filter", "animation", "transition",
  "box-shadow", "text-shadow", "border-radius", "gradient", "opacity",
  "perspective", "clip-path", "mask", "mix-blend-mode", "color-mix",
  "@keyframes", "@property", "@media", ":hover", "::before",
];

const PROPERTY_COLORS: Record<string, string> = {
  "transform": "text-orange-500 bg-orange-500/10",
  "filter": "text-cyan-500 bg-cyan-500/10",
  "backdrop-filter": "text-sky-500 bg-sky-500/10",
  "animation": "text-emerald-500 bg-emerald-500/10",
  "transition": "text-teal-500 bg-teal-500/10",
  "box-shadow": "text-violet-500 bg-violet-500/10",
  "text-shadow": "text-rose-500 bg-rose-500/10",
  "gradient": "text-amber-500 bg-amber-500/10",
  "@keyframes": "text-primary bg-primary/10",
  "@property": "text-fuchsia-500 bg-fuchsia-500/10",
};

/**
 * PropertySearch — find effects by the CSS properties they use.
 * Click a property chip to see all effects that use transform, filter,
 * backdrop-filter, etc. Great for finding effects by technical capability.
 */
export function PropertySearch({ onResults }: { onResults: (effectIds: string[]) => void }) {
  const [selectedProps, setSelectedProps] = useState<string[]>([]);

  const propertyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const prop of PROPERTIES) {
      const regex = prop.startsWith("@") || prop.startsWith(":") || prop.startsWith("::")
        ? new RegExp(prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        : new RegExp(`\\b${prop}\\b`, "i");
      counts[prop] = effects.filter(e => regex.test(e.cssCode)).length;
    }
    return counts;
  }, []);

  const toggleProperty = (prop: string) => {
    setSelectedProps(prev => {
      const next = prev.includes(prop) ? prev.filter(p => p !== prop) : [...prev, prop];
      // Compute matching effects
      const matching = effects.filter(e => {
        return next.every(p => {
          const regex = p.startsWith("@") || p.startsWith(":") || p.startsWith("::")
            ? new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
            : new RegExp(`\\b${p}\\b`, "i");
          return regex.test(e.cssCode);
        });
      }).map(e => e.id);
      onResults(matching);
      return next;
    });
  };

  return (
    <ScrollReveal>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <SearchCode className="size-4 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Search by CSS Property</h3>
          <span className="text-xs text-muted-foreground">— find effects by what they use</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTIES.map(prop => {
            const isSelected = selectedProps.includes(prop);
            const count = propertyCounts[prop] || 0;
            const color = PROPERTY_COLORS[prop] || "bg-muted text-muted-foreground";
            return (
              <motion.button
                key={prop}
                onClick={() => toggleProperty(prop)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  isSelected ? `${color} border-transparent ring-2 ring-primary ring-offset-1 ring-offset-background` : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
                aria-pressed={isSelected}
              >
                <code className="font-mono">{prop}</code>
                <span className="text-[9px] opacity-60">{count}</span>
                {isSelected && <X className="size-2.5" />}
              </motion.button>
            );
          })}
        </div>
        {selectedProps.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {selectedProps.length} {selectedProps.length === 1 ? "property" : "properties"} selected — showing matching effects below
          </p>
        )}
      </div>
    </ScrollReveal>
  );
}
