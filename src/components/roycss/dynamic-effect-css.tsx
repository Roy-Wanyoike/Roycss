"use client";

import { useEffect, useState, useRef } from "react";
import { effects } from "@/lib/roycss-effects";

/**
 * DynamicEffectCSS — Instead of injecting all 783KB of effect CSS at once,
 * this component injects CSS for effects that are currently visible or
 * about to be scrolled into view. This dramatically reduces initial render
 * blocking and paint cost.
 *
 * Strategy:
 * 1. On mount, inject CSS for the first 30 effects (above the fold)
 * 2. As user scrolls, inject more CSS in batches of 30
 * 3. Use IntersectionObserver to detect which cards are visible
 * 4. All CSS is injected by the time user scrolls to the effects section
 */
export function DynamicEffectCSS() {
  // Start with first 30 effects' CSS via lazy initializer
  const [injectedIds, setInjectedIds] = useState<Set<string>>(() => {
    return new Set(effects.slice(0, 30).map((e) => e.id));
  });
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Observe effect cards and inject their CSS when they enter viewport
    const cardSelector = '[class*="rounded-2xl border border-border bg-card"]';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find the effect ID from the card
            const card = entry.target as HTMLElement;
            const effectClass = Array.from(card.classList).find((c) =>
              c.startsWith("roycss-")
            );
            if (effectClass) {
              const effectId = effectClass.replace("roycss-", "");
              setInjectedIds((prev) => {
                if (prev.has(effectId)) return prev;
                const next = new Set(prev);
                next.add(effectId);
                return next;
              });
            }
          }
        });
      },
      { rootMargin: "200px" } // Pre-load 200px before visible
    );

    // Observe all effect cards
    const cards = document.querySelectorAll(cardSelector);
    cards.forEach((card) => observer.observe(card));

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, []);

  // Generate CSS only for injected effects
  const cssToInject = effects
    .filter((e) => injectedIds.has(e.id))
    .map((e) => e.cssCode)
    .join("\n\n");

  return (
    <style
      dangerouslySetInnerHTML={{ __html: cssToInject }}
    />
  );
}
