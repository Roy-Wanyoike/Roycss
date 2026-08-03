"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistration — registers the service worker on mount.
 * Enables PWA installability + offline support for static assets.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // Silent fail — SW registration is a progressive enhancement
        });
    }
  }, []);

  return null;
}
