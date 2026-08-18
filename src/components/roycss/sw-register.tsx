"use client";

import { useEffect, useState } from "react";

/**
 * ServiceWorkerRegistration — registers `/sw.js` on mount.
 *
 * Why dev registration matters:
 *   The previous version gated registration on `NODE_ENV === "production"`,
 *   which meant PWA installability couldn't be verified during development.
 *   Chrome's installability criteria require BOTH a manifest AND a service
 *   worker with a fetch handler — without a registered SW, the install
 *   prompt never fires, and Lighthouse PWA audit always fails.
 *
 * Strategy:
 *   - Register in dev AND production (so PWA can be tested in preview)
 *   - When a new SW takes over, prompt the user to refresh (via postMessage
 *     + a window event that the UI can listen for)
 *   - Silent fail — SW registration is a progressive enhancement
 */
export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Skip non-secure contexts — SW requires https or localhost.
    // On the sandbox preview domain we're behind TLS so this is fine.
    if (!window.isSecureContext) return;

    let registration: ServiceWorkerRegistration | undefined;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Listen for new SW waiting to activate
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is waiting — surface to UI
              setUpdateAvailable(true);
            }
          });
        });

        // Listen for controller change (new SW took over)
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch {
        // Silent fail — progressive enhancement
      }
    };

    register();

    // Expose the "skip waiting" trigger to the global scope so an Update
    // banner button can call it via window.__roycssApplySWUpdate().
    (window as unknown as { __roycssApplySWUpdate?: () => void }).__roycssApplySWUpdate =
      () => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      };

    // Cleanup
    return () => {
      delete (window as unknown as { __roycssApplySWUpdate?: () => void })
        .__roycssApplySWUpdate;
    };
  }, []);

  // Surface the update-available state via a global event the UI can
  // listen for. The actual banner is rendered elsewhere (so this component
  // stays render-free).
  useEffect(() => {
    if (updateAvailable) {
      window.dispatchEvent(
        new CustomEvent("roycss-sw-update-available", {
          detail: { apply: () => (window as unknown as { __roycssApplySWUpdate?: () => void }).__roycssApplySWUpdate?.() },
        })
      );
    }
  }, [updateAvailable]);

  return null;
}
