"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Search, Heart, SlidersHorizontal, GitCompare } from "lucide-react";

interface MiniNavProps {
  activeSection: string;
  onScrollToSection: (id: string) => void;
  onOpenSearch: () => void;
  onOpenFavorites: () => void;
  onOpenPlayground: () => void;
  onOpenCompare: () => void;
}

const NAV_ITEMS = [
  { id: "get-started", label: "Start" },
  { id: "effects", label: "Effects" },
  { id: "recipes", label: "Recipes" },
  { id: "patterns", label: "Patterns" },
  { id: "collections", label: "Collections" },
  { id: "platform", label: "Platform" },
  { id: "products", label: "Products" },
  { id: "faq", label: "FAQ" },
];

export function StickyMiniNav({ activeSection, onScrollToSection, onOpenSearch, onOpenFavorites, onOpenPlayground, onOpenCompare }: MiniNavProps) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    // rAF-throttled scroll handler — only flips state when the boolean
    // actually changes (no spurious re-renders, no flicker).
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const shouldBeVisible = window.scrollY > 200;
        if (shouldBeVisible !== visibleRef.current) {
          visibleRef.current = shouldBeVisible;
          setVisible(shouldBeVisible);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary/30 shadow-lg roycss-nav-neon"
          style={{
            background: "color-mix(in oklch, var(--background) 55%, transparent)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            boxShadow: "0 0 0 1px color-mix(in oklch, var(--primary) 20%, transparent), 0 4px 24px oklch(0 0 0 / 0.12), 0 0 20px color-mix(in oklch, var(--primary) 25%, transparent), 0 0 40px color-mix(in oklch, var(--primary) 12%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.08)",
            contain: "layout style paint",
            willChange: "transform, opacity",
          }}
          role="navigation"
          aria-label="Quick navigation"
        >
          <div className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => onScrollToSection("#" + item.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${activeSection === item.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-primary/10"}`}
                aria-current={activeSection === item.id ? "true" : undefined}
              >{item.label}</button>
            ))}
          </div>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <div className="flex items-center gap-0.5">
            <button onClick={onOpenSearch} className="flex items-center justify-center size-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" aria-label="Search" title="Search (⌘K)"><Search className="size-3.5" /></button>
            <button onClick={onOpenPlayground} className="flex items-center justify-center size-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" aria-label="Playground" title="Playground"><SlidersHorizontal className="size-3.5" /></button>
            <button onClick={onOpenCompare} className="flex items-center justify-center size-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" aria-label="Compare" title="Compare"><GitCompare className="size-3.5" /></button>
            <button onClick={onOpenFavorites} className="flex items-center justify-center size-7 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer" aria-label="Favorites" title="Favorites"><Heart className="size-3.5" /></button>
          </div>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center justify-center size-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" aria-label="Scroll to top" title="Back to top"><ArrowUp className="size-3.5" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
