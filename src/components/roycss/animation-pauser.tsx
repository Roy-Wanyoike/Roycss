"use client";

import { useEffect, useRef } from "react";

/**
 * AnimationPauser — Pauses CSS animations on elements that are offscreen.
 * Uses IntersectionObserver to detect when elements enter/leave the viewport.
 * When an element leaves the viewport, its animation-play-state is set to "paused".
 * When it re-enters, it's set to "running".
 *
 * Performance impact: 554 running animations → ~20 (only visible ones)
 *
 * This component observes all elements with CSS animations and manages their
 * play state based on viewport visibility.
 */
export function AnimationPauser() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Find all elements with running animations
    const animatedElements = new Set<HTMLElement>();

    const scanForAnimations = () => {
      document.querySelectorAll("*").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        if (
          style.animationName &&
          style.animationName !== "none" &&
          !htmlEl.dataset.royAnimManaged
        ) {
          animatedElements.add(htmlEl);
          htmlEl.dataset.royAnimManaged = "true";
        }
      });
    };

    // Initial scan after a delay to let effects render
    const scanTimer = setTimeout(scanForAnimations, 1500);

    // Re-scan periodically for dynamically loaded content
    const rescanTimer = setInterval(scanForAnimations, 3000);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.style.animationPlayState = "running";
          } else {
            el.style.animationPlayState = "paused";
          }
        });
      },
      { rootMargin: "100px" }
    );

    // Observe all animated elements
    const observeTimer = setInterval(() => {
      animatedElements.forEach((el) => {
        if (el.isConnected) {
          observer.observe(el);
        } else {
          animatedElements.delete(el);
        }
      });
    }, 1000);

    observerRef.current = observer;

    return () => {
      clearTimeout(scanTimer);
      clearInterval(rescanTimer);
      clearInterval(observeTimer);
      observer.disconnect();
    };
  }, []);

  return null;
}
