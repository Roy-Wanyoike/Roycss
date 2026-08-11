"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { categoryMeta, categoryOrder, type EffectCategory } from "@/lib/roycss-types";
import { effects } from "@/lib/roycss-effects";

/**
 * SectionScrollbar — a vertical scrollbar on the right side that:
 * 1. Shows scroll progress through the page
 * 2. Has clickable category sections for quick navigation
 * 3. Shows which section is currently active
 * 4. Provides visual map of the entire page
 */
export function SectionScrollbar({
  activeCategory,
  onCategoryClick,
}: {
  activeCategory: EffectCategory | "all";
  onCategoryClick: (cat: EffectCategory | "all", sectionId: string) => void;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
      setVisible(scrollTop > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Build sections list (memoized — `effects.length` is constant after
  // first load, but the memo avoids rebuilding the array on every scroll
  // event that updates `scrollProgress` state).
  const sections: { id: string; label: string; cat: EffectCategory | "all" }[] = useMemo(
    () => [
      { id: "hero", label: "Home", cat: "all" },
      { id: "effects", label: "All Effects", cat: "all" },
      ...categoryOrder.map((cat) => ({
        id: cat,
        label: categoryMeta[cat].label,
        cat,
      })),
    ],
    [],
  );

  // Pre-compute per-category effect counts ONCE. Without this, every
  // scroll event (which flips `scrollProgress` state and re-renders the
  // component) would re-filter the entire 1569-effect array once per
  // section dot — ~22 × 1569 = ~34k array scans per scroll frame.
  const categoryCounts = useMemo(() => {
    const counts = new Map<EffectCategory, number>();
    for (const e of effects) {
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed right-3 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-1 max-h-[70vh] overflow-y-auto scrollbar-thin"
        >
          {/* Progress bar track */}
          <div className="relative w-1 h-32 bg-border/30 rounded-full mb-2 shrink-0">
            <div
              className="absolute top-0 left-0 w-full bg-primary rounded-full transition-all"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* Section dots */}
          <div className="flex flex-col gap-0.5">
            {sections.map((section, i) => {
              const isActive = activeCategory === section.cat;
              const catCount =
                section.cat === "all"
                  ? effects.length
                  : categoryCounts.get(section.cat) ?? 0;

              return (
                <button
                  key={section.id}
                  onClick={() => onCategoryClick(section.cat, section.id)}
                  className="group relative flex items-center justify-end gap-2 cursor-pointer"
                  aria-label={`Go to ${section.label}`}
                >
                  {/* Tooltip label */}
                  <span
                    className={`absolute right-5 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded-md bg-card border border-border/50 shadow-sm transition-all opacity-0 group-hover:opacity-100 pointer-events-none`}
                  >
                    {section.label} ({catCount})
                  </span>

                  {/* Dot */}
                  <span
                    className={`block rounded-full transition-all ${
                      isActive
                        ? "w-2.5 h-2.5 bg-primary shadow-sm shadow-primary/50"
                        : "w-1.5 h-1.5 bg-muted-foreground/40 group-hover:bg-primary/60"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
