"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

/**
 * SWUpdateBanner — sticky top banner shown when a new service worker
 * has been installed and is waiting to activate. Listens to the
 * `roycss-sw-update-available` custom event dispatched by
 * <ServiceWorkerRegistration/> and prompts the user to refresh.
 *
 * The Refresh button calls `window.__roycssApplySWUpdate()` which
 * posts `SKIP_WAITING` to the waiting SW; on `controllerchange` the
 * SWRegister component reloads the page automatically.
 *
 * Accessibility: role="status" + aria-live="polite" so screen readers
 * announce the update without interrupting other speech.
 */
export function SWUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("roycss-sw-update-available", handler);
    return () => window.removeEventListener("roycss-sw-update-available", handler);
  }, []);

  const handleRefresh = () => {
    const w = window as unknown as { __roycssApplySWUpdate?: () => void };
    if (typeof w.__roycssApplySWUpdate === "function") {
      w.__roycssApplySWUpdate();
    } else {
      // Fallback — reload to pick up latest
      window.location.reload();
    }
  };

  const handleDismiss = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 inset-x-0 z-[100] flex justify-center px-4 pt-2 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-2xl flex items-center gap-3 rounded-xl border border-primary/40 bg-card/95 backdrop-blur-xl shadow-2xl px-4 py-3">
            <span className="flex items-center justify-center size-9 rounded-lg bg-primary/15 text-primary shrink-0">
              <RefreshCw className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                A new version of RoyCSS is available
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Refresh to load the latest features and fixes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss update banner"
              className="inline-flex items-center justify-center size-9 min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
