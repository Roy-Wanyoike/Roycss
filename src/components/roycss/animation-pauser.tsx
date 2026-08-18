"use client";

import { useEffect } from "react";

/**
 * AnimationPauser — Pauses CSS animations on effect-preview elements that
 * are offscreen. Uses IntersectionObserver to detect when elements enter/
 * leave the viewport; sets `animation-play-state` accordingly.
 *
 * Performance impact: only the ~20–40 visible effect previews run their
 * animations; the rest are paused (saves CPU/GPU on a 1749-effect page).
 *
 * Why this implementation is cheap:
 *   1. We do NOT scan the entire DOM with `document.querySelectorAll("*")`
 *      — that would visit 5000+ elements and call `getComputedStyle` on
 *      each, forcing a style recalc on the whole document.
 *   2. We do NOT call `getComputedStyle` at all. Instead we target only
 *      elements that are known to carry animations: those with a
 *      `roycss-*` class (effect-preview containers) or a
 *      `data-effect-id` attribute (effect cards). This is ~30 elements
 *      at a time, not 5000+.
 *   3. We do NOT poll on a setInterval. New elements are picked up by a
 *      MutationObserver on document.body. Zero idle cost.
 *   4. Off-screen cards already skip rendering via `content-visibility:
 *      auto` (the `.perf-auto` class on EffectCard). This component
 *      handles the residual animated elements (hero blobs, scroll
 *      progress, sponsor button pulse, etc.) that live outside the
 *      virtualized grid.
 *
 * Cleanup: both observers are disconnected on unmount. No timers to clear.
 */
export function AnimationPauser() {
  useEffect(() => {
    // Match elements that carry a `roycss-*` class or a `data-effect-id`
    // attribute. These are the only elements that have CSS animations
    // injected by the DynamicEffectCSS engine.
    const SELECTOR = "[class*='roycss-'], [data-effect-id]";

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          // Inline-style the play-state so we don't need a separate
          // stylesheet rule. `running` is the default, so we only need
          // to set `paused` when offscreen and clear it when onscreen.
          if (entry.isIntersecting) {
            if (el.style.animationPlayState === "paused") {
              el.style.animationPlayState = "";
            }
          } else {
            el.style.animationPlayState = "paused";
          }
        }
      },
      { rootMargin: "100px" }
    );

    // Observe every currently-mounted effect-bearing element.
    document
      .querySelectorAll<HTMLElement>(SELECTOR)
      .forEach((el) => io.observe(el));

    // Pick up elements added later (infinite scroll, filtering, dialog
    // open, showcase tabs, etc.) — same selector, scoped to body subtree.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          if (el.matches?.(SELECTOR)) io.observe(el);
          if (typeof el.querySelectorAll === "function") {
            el.querySelectorAll<HTMLElement>(SELECTOR).forEach((c) =>
              io.observe(c)
            );
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
