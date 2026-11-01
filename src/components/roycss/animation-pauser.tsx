"use client";
import { useEffect } from "react";
import {
  ANIMATION_PAUSED_ATTR,
  HYDRATION_RETRY_INTERVAL_MS,
  HYDRATION_RETRY_MAX_ATTEMPTS,
  isReactOwned,
  pauseActionFor,
} from "@/components/roycss/animation-pauser-policy";

/**
 * AnimationPauser — freezes CSS animations for elements scrolled far
 * off-screen (`data-animation-paused="true"` → `animation-play-state:
 * paused !important`, globals.css).
 *
 * Issue #299 — hydration-safe stamping. With streaming SSR + selective
 * hydration, this component's mount effect can run while later Suspense
 * boundaries (next/dynamic sections) still show UNhydrated server HTML.
 * The old code stamped every `[class*='roycss-']` element immediately —
 * mutating server HTML React was about to hydrate, which surfaced as the
 * intermittent `data-animation-paused` hydration mismatch on the featured
 * LivePreview/TextPreview span. Two guards fix it:
 *
 *   1. DEFERRED INITIAL PASS — the first observe() sweep runs after a
 *      double rAF, letting the hydration commit settle before any writes.
 *   2. OWNERSHIP GATE — elements are only stamped when react-dom has
 *      claimed them (`__reactFiber$*` expando; see animation-pauser-policy).
 *      Unclaimed nodes are retried on a bounded timer (30 × 1s) instead of
 *      being mutated pre-hydration. Server HTML stays byte-identical to
 *      what React renders — deterministic first render, post-mount apply.
 *
 * Un-stamping (element re-entered the viewport) is always safe: the
 * attribute can only exist if a previous owned stamp wrote it.
 *
 * The component renders null — SSR markup carries no pause attribute.
 */
export function AnimationPauser() {
  useEffect(() => {
    const SELECTOR = "[class*='roycss-'], [data-effect-id]";
    // Elements seen off-screen before React claimed them — retried until
    // claimed or the bounded budget runs out.
    const pendingOwnership = new Map<HTMLElement, number>();

    const applyAction = (el: HTMLElement, isIntersecting: boolean) => {
      const action = pauseActionFor(el, isIntersecting);
      if (action === "unstamp") {
        pendingOwnership.delete(el);
        if (el.dataset.animationPaused === "true") delete el.dataset.animationPaused;
        return;
      }
      if (action === "stamp") {
        pendingOwnership.delete(el);
        el.dataset.animationPaused = "true";
        return;
      }
      // "skip" — not yet React-owned: schedule a bounded retry.
      if (!pendingOwnership.has(el)) {
        pendingOwnership.set(el, 0);
      }
    };

    const retryOwnership = () => {
      if (pendingOwnership.size === 0) return;
      for (const [el, attempts] of [...pendingOwnership]) {
        // Element left the document (LazySection unmount, virtual scroll)
        // — stop tracking it.
        if (!el.isConnected) {
          pendingOwnership.delete(el);
          continue;
        }
        if (isReactOwned(el)) {
          pendingOwnership.delete(el);
          // Still off-screen? The IO will not refire for an element that
          // never left its intersection state, so stamp it now.
          if (!isElementNearViewport(el)) {
            el.dataset.animationPaused = "true";
          }
          continue;
        }
        if (attempts + 1 >= HYDRATION_RETRY_MAX_ATTEMPTS) {
          pendingOwnership.delete(el);
          continue;
        }
        pendingOwnership.set(el, attempts + 1);
      }
      if (pendingOwnership.size > 0) {
        retryTimer = setTimeout(retryOwnership, HYDRATION_RETRY_INTERVAL_MS);
      }
    };
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          applyAction(entry.target as HTMLElement, entry.isIntersecting);
        }
        if (pendingOwnership.size > 0 && retryTimer === null) {
          retryTimer = setTimeout(retryOwnership, HYDRATION_RETRY_INTERVAL_MS);
        }
      },
      { rootMargin: "100px" },
    );

    const observeAll = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
    };

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          // MutationObserver additions are React renders that already
          // committed (owned); the IO callback applies the ownership gate
          // anyway, so no special-casing is needed here.
          if (el.matches?.(SELECTOR)) io.observe(el);
          if (typeof el.querySelectorAll === "function") {
            observeAll(el);
          }
        });
      }
    });

    // Guard 1 — deferred initial pass: give the hydration commit two frames
    // to settle before the first sweep (never write during hydration).
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        observeAll(document.body);
        mo.observe(document.body, { childList: true, subtree: true });
      });
    });
    let raf2 = 0;

    return () => {
      if (raf2) cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf1);
      if (retryTimer !== null) clearTimeout(retryTimer);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}

/**
 * Mirrors the observer's rootMargin: an element within 100px of the
 * viewport counts as near. Used by the ownership retry to avoid stamping
 * an element that scrolled into view while hydration finished.
 */
function isElementNearViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const margin = 100;
  return (
    rect.top < window.innerHeight + margin &&
    rect.bottom > -margin &&
    rect.right > -margin &&
    rect.left < window.innerWidth + margin
  );
}

export default AnimationPauser;
