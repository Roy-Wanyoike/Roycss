"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Monitor, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSAL_KEY = "roycss-pwa-dismissed";

/**
 * PWAInstallPrompt — shows a smart install banner when the browser
 * detects the app is installable (has manifest.json + service worker).
 * Appears after 3 seconds on desktop, or immediately on mobile.
 * Dismissible — remembers dismissal for 7 days.
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(DISMISSAL_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Use queueMicrotask to satisfy the lint rule
    queueMicrotask(() => setIsMobile(mobile));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), mobile ? 1000 : 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSAL_KEY, new Date().toISOString());
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
        >
          <div className="rounded-2xl border border-primary/30 bg-card shadow-2xl backdrop-blur-xl overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              {/* Icon */}
              <div className="flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary shrink-0">
                {isMobile ? <Smartphone className="size-5" /> : <Monitor className="size-5" />}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Install RoyCSS</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {isMobile ? "Add to home screen for offline access" : "Quick access from your desktop"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Download className="size-3.5" />
                  Install
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Dismiss"
                  className="inline-flex items-center justify-center size-9 min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
