"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  LayoutGrid,
  Wrench,
  Heart,
  Copy,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   InteractiveTutorial
   ───────────────────────────────────────────────────────────────
   A first-run guided tour for the RoyCSS platform. Renders a
   semi-transparent overlay with a "spotlight" cut-out around the
   target element and a tooltip card containing step copy + nav.

   • 6 steps covering hero → effects → search → tools → favorites → copy
   • Spotlight uses the box-shadow "hole" technique
   • Progress dots, Skip, Back / Next / Finish controls
   • Remembers completion in localStorage (`roycss-tutorial-completed`)
   • Graceful fallback: if a target element can't be found, the
     tooltip centers on screen (so the tour never breaks)
   • Re-launchable any time via `restartRoyCssTutorial()`
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "roycss-tutorial-completed";
const START_EVENT = "roycss-tutorial-start";
const TOOLTIP_WIDTH = 360;
const VIEWPORT_PAD = 16;

type Placement = "top" | "bottom" | "center";

interface TourStep {
  title: string;
  description: string;
  /** Comma-separated CSS selector. First matching element is spotlit. */
  selector: string;
  placement: Placement;
  icon: LucideIcon;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to RoyCSS",
    description:
      "1,749+ production-ready CSS effects — copy, paste, ship. Let's take a 60-second tour of the platform.",
    selector: "[data-roycss-tour='hero'], h1",
    placement: "bottom",
    icon: Sparkles,
  },
  {
    title: "Browse Effects",
    description:
      "Scroll the effects grid to explore animations, hover states, glass UI, loaders, and more. Filter by category on the left.",
    selector: "[data-roycss-tour='effects']",
    placement: "top",
    icon: LayoutGrid,
  },
  {
    title: "Search anything",
    description:
      "Press ⌘K (or Ctrl+K) to open the command palette. Jump to any effect, tool, or recipe by name in milliseconds.",
    selector: "[data-roycss-tour='search'], [role='search'], [aria-label*='search' i], input[type='search']",
    placement: "bottom",
    icon: Search,
  },
  {
    title: "Try a Tool",
    description:
      "The Platform section packs 45+ generators — gradient, box-shadow, clip-path, flex, grid, and more. Each exports clean CSS.",
    selector: "[data-roycss-tour='platform']",
    placement: "top",
    icon: Wrench,
  },
  {
    title: "Save Favorites",
    description:
      "Star any effect to add it to your favorites sheet. Your picks persist across sessions — no account required.",
    selector: "[data-roycss-tour='favorites'], [aria-label*='favorite' i]",
    placement: "bottom",
    icon: Heart,
  },
  {
    title: "Copy & Use",
    description:
      "Every effect has a one-click copy button. Paste the class into your markup — RoyCSS handles the rest. That's it, you're ready!",
    selector: "[data-roycss-tour='copy'], [aria-label*='copy' i]",
    placement: "top",
    icon: Copy,
  },
];

interface SpotlightState {
  rect: { top: number; left: number; width: number; height: number } | null;
  placement: Placement;
}

function getStoredCompletion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredCompletion(value: "completed" | "skipped"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* localStorage may be unavailable (private mode) — non-fatal */
  }
}

/** Re-launch the tutorial from any other component (e.g. a "Replay tour" button). */
export function restartRoyCssTutorial(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(START_EVENT));
}

function findTarget(selector: string): HTMLElement | null {
  if (!selector) return null;
  const el = document.querySelector<HTMLElement>(selector);
  return el ?? null;
}

function computePlacement(preferred: Placement): Placement {
  if (typeof window === "undefined") return preferred;
  // Force center on small screens so the tooltip never overflows.
  if (window.innerWidth < 640) return "center";
  return preferred;
}

function clampLeft(left: number): number {
  if (typeof window === "undefined") return left;
  return Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_PAD),
  );
}

export function InteractiveTutorial() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightState>({
    rect: null,
    placement: "center",
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  /* ── Mount: SSR guard + auto-start if not completed ── */
  useEffect(() => {
    // Defer setState to the next frame to satisfy react-hooks/set-state-in-effect
    // (same pattern used by effect-of-the-day, easing-visualizer, perf-analyzer).
    const raf = requestAnimationFrame(() => setMounted(true));
    const done = getStoredCompletion();
    if (!done) {
      // Defer so the page has time to render target elements and the user
      // can see the hero before the tutorial overlay appears.
      const id = window.setTimeout(() => setActive(true), 2500);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(id);
      };
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Listen for external restart requests ── */
  useEffect(() => {
    const handleStart = () => {
      setStoredCompletion("completed"); // cleared below if user re-skips? keep simple: restart re-shows
      setStepIndex(0);
      setActive(true);
    };
    window.addEventListener(START_EVENT, handleStart);
    return () => window.removeEventListener(START_EVENT, handleStart);
  }, []);

  const measureStep = useCallback((index: number) => {
    // All setState calls are deferred to a rAF so we never call setState
    // synchronously inside an effect (satisfies react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => {
      const step = STEPS[index];
      if (!step) {
        setSpotlight({ rect: null, placement: "center" });
        return;
      }
      const target = findTarget(step.selector);
      if (!target) {
        setSpotlight({ rect: null, placement: "center" });
        return;
      }
      // Bring into view, then measure (layout is current inside this frame).
      try {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } catch {
        /* scrollIntoView can throw on detached nodes — ignore */
      }
      const r = target.getBoundingClientRect();
      // Ignore zero-size targets (hidden / display:none).
      if (r.width === 0 || r.height === 0) {
        setSpotlight({ rect: null, placement: "center" });
        return;
      }
      setSpotlight({
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        placement: computePlacement(step.placement),
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Re-measure on step change ── */
  useEffect(() => {
    if (!active) return;
    const cleanup = measureStep(stepIndex);
    return cleanup;
  }, [active, stepIndex, measureStep]);

  /* ── Track scroll + resize so the spotlight stays locked on target ── */
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const recompute = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => measureStep(stepIndex));
    };
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
    };
  }, [active, stepIndex, measureStep]);

  /* ── Handlers ── */
  const handleNext = useCallback(() => {
    setStepIndex((i) => {
      if (i >= STEPS.length - 1) {
        setStoredCompletion("completed");
        setActive(false);
        return i;
      }
      return i + 1;
    });
  }, []);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleSkip = useCallback(() => {
    setStoredCompletion("skipped");
    setActive(false);
  }, []);

  /* ── Keyboard: Esc to skip, ← → to navigate ── */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, handleSkip, handleNext, handleBack]);

  /* ── Lock body scroll while the tour is active ── */
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  /* ── Don't render on the server; render via portal once mounted ── */
  if (!mounted || !active) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const StepIcon = step.icon;

  // Tooltip position style based on placement.
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    width: TOOLTIP_WIDTH,
    maxWidth: `calc(100vw - ${VIEWPORT_PAD * 2}px)`,
  };
  if (spotlight.placement === "center" || !spotlight.rect) {
    tooltipStyle = {
      ...tooltipStyle,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  } else if (spotlight.placement === "bottom") {
    tooltipStyle = {
      ...tooltipStyle,
      top: spotlight.rect.top + spotlight.rect.height + 16,
      left: clampLeft(spotlight.rect.left),
    };
  } else {
    // top
    tooltipStyle = {
      ...tooltipStyle,
      bottom: typeof window !== "undefined" ? window.innerHeight - spotlight.rect.top + 16 : 16,
      left: clampLeft(spotlight.rect.left),
    };
  }

  // Spotlight box style.
  const spotlightBox: React.CSSProperties = spotlight.rect
    ? {
        position: "fixed",
        top: spotlight.rect.top - 6,
        left: spotlight.rect.left - 6,
        width: spotlight.rect.width + 12,
        height: spotlight.rect.height + 12,
        borderRadius: 14,
        boxShadow:
          "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px oklch(0.6 0.2 162), 0 0 28px oklch(0.6 0.2 162 / 0.45)",
        transition: "all 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: "none",
      }
    : {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        pointerEvents: "none",
      };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="RoyCSS interactive tutorial"
      className="fixed inset-0 z-[100]"
      style={{ pointerEvents: "auto" }}
    >
      {/* Darkening layer + spotlight hole */}
      <div aria-hidden style={spotlightBox} />

      {/* Click-catcher (blocks interaction with the page behind) */}
      <div
        aria-hidden
        className="absolute inset-0"
        onClick={handleSkip}
        style={{ background: "transparent" }}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          ref={tooltipRef}
          role="document"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={tooltipStyle}
          className="z-[101] rounded-2xl border border-primary/30 bg-card p-5 shadow-2xl shadow-primary/10"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <StepIcon className="size-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {stepIndex + 1} of {STEPS.length}
                </p>
                <h3 className="font-display text-base font-bold leading-tight text-foreground">
                  {step.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Skip tutorial"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="my-4 flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStepIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === stepIndex ? "true" : "false"}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? "w-6 bg-primary"
                    : i < stepIndex
                      ? "w-1.5 bg-primary/50 hover:bg-primary/70"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronLeft className="size-3.5" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {isLast ? (
                  <>
                    <Check className="size-3.5" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
