"use client";
import { useEffect } from "react";

export function AnimationPauser() {
  useEffect(() => {
    const SELECTOR = "[class*='roycss-'], [data-effect-id]";
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            if (el.dataset.animationPaused === "true") delete el.dataset.animationPaused;
          } else {
            el.dataset.animationPaused = "true";
          }
        }
      },
      { rootMargin: "100px" },
    );
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          if (el.matches?.(SELECTOR)) io.observe(el);
          if (typeof el.querySelectorAll === "function") {
            el.querySelectorAll<HTMLElement>(SELECTOR).forEach((c) => io.observe(c));
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
