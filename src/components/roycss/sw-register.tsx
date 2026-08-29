"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistration — registers /sw.js in BOTH dev and prod.
 *
 * On `updatefound` (new SW downloaded), it dispatches a
 * `roycss-sw-update-available` event that <SWUpdateBanner/> listens to.
 * Exposes `window.__roycssApplySWUpdate()` which posts `SKIP_WAITING`
 * to the waiting SW — when the new SW activates, `controllerchange`
 * fires and we reload the page so the user picks up the new shell.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    const applyUpdate = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage("SKIP_WAITING");
        }
      });
    };

    // Expose global so SWUpdateBanner can trigger the refresh
    (window as unknown as { __roycssApplySWUpdate?: () => void }).__roycssApplySWUpdate =
      applyUpdate;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Listen for updatefound on this registration
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New SW waiting — notify banner
              window.dispatchEvent(new CustomEvent("roycss-sw-update-available"));
            }
          });
        });
      })
      .catch(() => {
        /* Silent fail — SW is a progressive enhancement */
      });

    // Also check for an already-waiting SW on every page load
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new CustomEvent("roycss-sw-update-available"));
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      delete (window as { __roycssApplySWUpdate?: () => void }).__roycssApplySWUpdate;
    };
  }, []);

  return null;
}
