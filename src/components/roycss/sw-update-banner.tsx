"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

/**
 * SWUpdateBanner — listens for the `roycss-sw-update-available` event
 * dispatched by `<ServiceWorkerRegistration />` and shows a banner at the
 * top of the viewport prompting the user to refresh for the latest version.
 *
 * Clicking "Refresh" calls `window.__roycssApplySWUpdate()` (which posts
 * `SKIP_WAITING` to the waiting SW → it activates → `controllerchange`
 * fires → the page reloads with the new SW in control).
 *
 * Clicking "Dismiss" just hides the banner — the new SW will still take
 * over on next navigation.
 */
const DISMISSAL_KEY = "roycss-sw-update-dismissed";

export function SWUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Respect prior dismissal within the same session
    if (sessionStorage.getItem(DISMISSAL_KEY) === "true") return;

    const handler = (e: Event) => {
      setVisible(true);
      // The apply function lives on the event detail — we don't need to
      // capture it here because the click handler reads it from
      // `window.__roycssApplySWUpdate` directly.
      void (e as CustomEvent).detail?.apply;
    };
    window.addEventListener("roycss-sw-update-available", handler);
    return () => window.removeEventListener("roycss-sw-update-available", handler);
  }, []);

  const handleApply = () => {
    const w = window as unknown as { __roycssApplySWUpdate?: () => void };
    if (typeof w.__roycssApplySWUpdate === "function") {
      w.__roycssApplySWUpdate();
    } else {
      // Fallback: hard reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSAL_KEY, "true");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] flex justify-center px-4 pt-2 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-md rounded-xl border border-primary/40 bg-card/95 backdrop-blur-xl shadow-lg px-3 py-2 flex items-center gap-2.5">
            <RefreshCw className="size-4 text-primary shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">
                New version available
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Refresh to get the latest RoyCSS.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Refresh to apply update"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center size-8 min-h-[36px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Dismiss update banner"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
