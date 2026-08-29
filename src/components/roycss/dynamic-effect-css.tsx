"use client";

import { useEffect } from "react";
import { effects } from "@/lib/roycss-effects";

/**
 * DynamicEffectCSS — Instead of injecting all 783KB of effect CSS at once,
 * this component injects CSS for effects as their preview elements scroll
 * into view. A MutationObserver picks up new `roycss-*` elements added by
 * the virtual-scroll grid (infinite scroll), search/filter, the showcase
 * grid, the random picker, the detail dialog, etc.
 *
 * Strategy:
 * 1. On mount (and during SSR via the initial <style> tag), inject CSS for
 *    the first INITIAL_BATCH effects (above-the-fold).
 * 2. Set up an IntersectionObserver that injects CSS for any `roycss-*`
 *    element that enters the viewport (200px pre-load margin).
 * 3. Set up a MutationObserver that watches for new `roycss-*` elements
 *    being added to the DOM (filtering, infinite scroll, dialog open, etc.)
 *    and starts observing them with the IntersectionObserver.
 * 4. Lazily-injected CSS is APPENDED to a separate <style> tag in
 *    document.head — never regenerated — so no layout thrash on subsequent
 *    injections.
 * 5. On unmount, disconnect both observers and remove the lazy <style> tag.
 *
 * Deduplication: a Set tracks which effect IDs have already been injected
 * (including the initial batch).
 *
 * Why both an IntersectionObserver and a MutationObserver:
 * - IntersectionObserver: fires when an element enters the viewport → trigger
 *   for lazy CSS injection.
 * - MutationObserver: fires when new elements are added to the DOM → needed
 *   because the initial IntersectionObserver setup only sees elements that
 *   exist at mount time. Cards added later (by VirtualScrollGrid's infinite
 *   scroll, by filtering, by the showcase grid mounting, etc.) would never
 *   be observed without the MutationObserver.
 */
const INITIAL_BATCH = 30;
const INITIAL_CSS = effects
  .slice(0, INITIAL_BATCH)
  .map((e) => e.cssCode)
  .join("\n\n");
const INITIAL_IDS = new Set(
  effects.slice(0, INITIAL_BATCH).map((e) => e.id)
);

export function DynamicEffectCSS() {
  useEffect(() => {
    const effectMap = new Map(effects.map((e) => [e.id, e]));
    // Pre-populate with the IDs already injected via the initial <style> tag.
    const injected = new Set<string>(INITIAL_IDS);

    // Create a separate <style> tag for lazily-injected CSS. This is appended
    // to document.head (outside the React tree) so React re-renders don't
    // wipe out the appended CSS.
    const lazyStyle = document.createElement("style");
    lazyStyle.id = "roycss-dynamic-effects-lazy";
    lazyStyle.dataset.dynamicEffectCss = "lazy";
    document.head.appendChild(lazyStyle);

    const inject = (id: string) => {
      if (injected.has(id)) return;
      const e = effectMap.get(id);
      if (!e) return;
      injected.add(id);
      lazyStyle.appendChild(document.createTextNode("\n\n" + e.cssCode));
    };

    /** Pull effect IDs out of any element that has a `roycss-*` class or
     *  a `data-effect-id` attribute. */
    const extractEffectIds = (el: HTMLElement): string[] => {
      const ids = new Set<string>();
      el.classList.forEach((c) => {
        if (c.startsWith("roycss-")) ids.add(c.slice("roycss-".length));
      });
      if (el.dataset.effectId) ids.add(el.dataset.effectId);
      return [...ids];
    };

    // IntersectionObserver — fires when an observed element enters the
    // viewport (with 200px pre-load margin).
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          for (const id of extractEffectIds(target)) inject(id);
        }
      },
      { rootMargin: "200px" }
    );

    /** Register an element with the IntersectionObserver — but only if it
     *  has a `roycss-*` class or `data-effect-id`, and only if not all of
     *  its effect IDs are already injected (avoids unnecessary observation). */
    const observeElement = (el: HTMLElement) => {
      const ids = extractEffectIds(el);
      if (ids.length === 0) return;
      if (ids.every((id) => injected.has(id))) return;
      io.observe(el);
    };

    /** Scan a root for all effect-bearing elements and observe them. */
    const observeAllIn = (root: ParentNode) => {
      // Match elements that either have a `data-effect-id` attribute OR
      // whose class attribute contains the substring `roycss-`.
      root
        .querySelectorAll<HTMLElement>("[data-effect-id], [class*='roycss-']")
        .forEach(observeElement);
    };

    // Observe all existing effect-bearing elements on mount.
    observeAllIn(document);

    // MutationObserver — picks up new effect-bearing elements added after
    // mount (infinite scroll, filtering, dialog open, showcase tabs, etc.).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          observeElement(el);
          // The added node might be a container (e.g., a new card with
          // inner LivePreview elements) — scan its descendants too.
          if (typeof el.querySelectorAll === "function") {
            el
              .querySelectorAll<HTMLElement>("[data-effect-id], [class*='roycss-']")
              .forEach(observeElement);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      lazyStyle.remove();
      injected.clear();
    };
  }, []);

  // The initial <style> tag is rendered into the React tree so that:
  //  - It's SSR-friendly (the first INITIAL_BATCH effects' CSS is in the
  //    server-rendered HTML, no FOUC).
  //  - It survives React re-renders (React owns this tag; the lazy <style>
  //    tag is owned by the effect, appended to document.head).
  return (
    <style
      dangerouslySetInnerHTML={{ __html: INITIAL_CSS }}
      data-roycss-dynamic-initial=""
    />
  );
}
