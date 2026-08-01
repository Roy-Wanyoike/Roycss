"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";

export function FloatingSponsorButton({ onClick }: { onClick: () => void }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollY > 600 && scrollY < docHeight - 800);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  if (dismissed) return null;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1">
          <button onClick={() => setDismissed(true)} className="flex items-center justify-center size-5 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-1" aria-label="Dismiss"><X className="size-3" /></button>
          <motion.button onClick={onClick} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="group relative flex flex-col items-center justify-center gap-1 size-14 sm:size-16 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 cursor-pointer" aria-label="Sponsor RoyCSS" title="Sponsor RoyCSS">
            <motion.span className="absolute inset-0 rounded-full bg-primary/30" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            <Heart className="size-5 sm:size-6 fill-primary-foreground relative z-10" />
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide relative z-10 leading-none">Sponsor</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
