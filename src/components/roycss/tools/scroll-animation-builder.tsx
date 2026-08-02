"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ArrowDownUp,
  Copy,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  MousePointer2,
  Plus,
  Trash2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * ScrollAnimationBuilder — interactive builder for CSS scroll-driven animations.
 *
 * Demonstrates the modern `animation-timeline` API (`scroll()` and `view()`)
 * with a LIVE scrollable preview that injects the ACTUAL generated CSS into a
 * `<style>` tag — the animation is driven by real scroll position, not
 * simulated with JS.
 *
 * Features:
 *  - Two timeline types (Tabs): `scroll()` (progress tied to scroll position of
 *    the nearest scrollable ancestor) and `view()` (progress tied to an element
 *    entering/exiting the scrollport, with configurable `inset`).
 *  - Configurable axis (block/inline/y/x), source (nearest/root) for scroll(),
 *    inset for view(), animation name, duration (fallback), timing function,
 *    and a 2–6 stop keyframes editor.
 *  - Generated CSS output with Copy button + 2s Check confirmation.
 *  - Live preview: scroll() mode uses a sticky centered target inside a tall
 *    scroll container; view() mode scatters 5 cards that animate in/out.
 *  - Vertical scroll-progress indicator (rAF-throttled, direct DOM mutation
 *    to avoid re-renders).
 *  - CSS.supports() feature detection with a green/amber support badge.
 *  - Reset, scroll-to-top, scroll-to-bottom controls.
 *  - "Scroll to animate" hint with a bouncing arrow (auto-hides on first scroll).
 *
 * Browser support: Chrome 115+, Edge 115+, Samsung 24+. Firefox & Safari are
 * behind flags / in development. The component detects support and shows an
 * amber warning + fallback note when unavailable.
 */

// ============================================================
// Types
// ============================================================

type TimelineType = "scroll" | "view";
type Axis = "block" | "inline" | "y" | "x";
type Source = "nearest" | "root";
type TimingFunction =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

interface KeyframeStop {
  id: string;
  /** Selector / position: "from", "to", "0%", "50%", "100%", etc. */
  position: string;
  /** Raw CSS declarations: "opacity: 0; transform: translateY(40px);" */
  declarations: string;
}

interface Config {
  timelineType: TimelineType;
  source: Source;
  axis: Axis;
  inset: string;
  animationName: string;
  duration: string;
  timingFunction: TimingFunction;
  keyframes: KeyframeStop[];
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_KEYFRAMES: KeyframeStop[] = [
  {
    id: "kf-default-1",
    position: "from",
    declarations: "opacity: 0; transform: translateY(40px);",
  },
  {
    id: "kf-default-2",
    position: "to",
    declarations: "opacity: 1; transform: translateY(0);",
  },
];

const DEFAULT_CONFIG: Config = {
  timelineType: "scroll",
  source: "nearest",
  axis: "block",
  inset: "0",
  animationName: "fade-up",
  duration: "1s",
  timingFunction: "linear",
  keyframes: DEFAULT_KEYFRAMES,
};

const AXES: { value: Axis; label: string }[] = [
  { value: "block", label: "block" },
  { value: "inline", label: "inline" },
  { value: "y", label: "y" },
  { value: "x", label: "x" },
];

const SOURCES: { value: Source; label: string }[] = [
  { value: "nearest", label: "nearest" },
  { value: "root", label: "root" },
];

const TIMING_FUNCTIONS: TimingFunction[] = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
];

const MAX_STOPS = 6;
const MIN_STOPS = 2;

/** Cards rendered in the view() preview — each animates independently. */
const VIEW_CARDS = [
  { title: "Enter", subtitle: "enters from bottom edge" },
  { title: "Reveal", subtitle: "driven by scroll position" },
  { title: "Animate", subtitle: "view(axis inset)" },
  { title: "Transition", subtitle: "no JS — pure CSS" },
  { title: "Exit", subtitle: "exits at top edge" },
];

// ============================================================
// Helpers
// ============================================================

/**
 * Sanitize a user-supplied keyframes name. CSS custom-ident syntax allows
 * [A-Za-z0-9_-] and must not start with a digit. We collapse everything else
 * to hyphens and strip leading/trailing hyphens, falling back to "fade-up".
 */
function sanitizeKeyframesName(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "");
  if (cleaned.length === 0) return "fade-up";
  // Ensure it doesn't start with a digit (invalid custom-ident).
  if (/^[0-9]/.test(cleaned)) return `kf-${cleaned}`;
  return cleaned;
}

/**
 * Feature-detect scroll-driven animations. We try both the two-argument
 * `CSS.supports(prop, value)` form and the single-string form, plus a
 * `view()` fallback, since browser support strings have shifted across
 * Chrome versions. Wrapped in try/catch — older browsers may not expose
 * `CSS.supports` at all.
 */
function detectScrollTimelineSupport(): boolean {
  try {
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
      return false;
    }
    return (
      CSS.supports("animation-timeline", "scroll(block nearest)") ||
      CSS.supports("animation-timeline: scroll(block nearest)") ||
      CSS.supports("animation-timeline", "view()") ||
      CSS.supports("animation-timeline: view()")
    );
  } catch {
    return false;
  }
}

// ============================================================
// Component
// ============================================================

export function ScrollAnimationBuilder() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(true);

  const styleRef = useRef<HTMLStyleElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const idCounter = useRef<number>(MIN_STOPS);

  /* ── Feature detection (runs once on mount) ─────────────────────── */
  /* Deferring the setState to a rAF callback avoids the
     react-hooks/set-state-in-effect lint error (same pattern used by
     easing-visualizer.tsx and perf-analyzer.tsx). */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setSupported(detectScrollTimelineSupport()));
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Build the generated CSS string from the current config ──────── */
  const generatedCSS = useMemo(() => {
    const name = sanitizeKeyframesName(config.animationName);
    const keyframesBlock = config.keyframes
      .map((kf) => `  ${kf.position} { ${kf.declarations} }`)
      .join("\n");
    const timeline =
      config.timelineType === "scroll"
        ? `scroll(${config.axis} ${config.source})`
        : `view(${config.axis} ${config.inset.trim() || "0"})`;
    return `@keyframes ${name} {
${keyframesBlock}
}

.scroll-animated {
  animation: ${name} ${config.duration} ${config.timingFunction} forwards;
  animation-timeline: ${timeline};
}`;
  }, [config]);

  /* ── Inject the generated CSS into the live <style> tag ──────────── */
  useEffect(() => {
    const el = styleRef.current;
    if (el) el.textContent = generatedCSS;
  }, [generatedCSS]);

  /* ── Scroll progress indicator (rAF-throttled, direct DOM write) ─── */
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const max = scroller.scrollHeight - scroller.clientHeight;
        const pct = max > 0 ? scroller.scrollTop / max : 0;
        const clamped = Math.min(100, Math.max(0, pct * 100));
        if (progressRef.current) {
          progressRef.current.style.height = `${clamped.toFixed(2)}%`;
        }
        if (scroller.scrollTop > 6) setShowHint(false);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCSS]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setShowHint(true);
    idCounter.current = MIN_STOPS;
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = 0;
    if (progressRef.current) progressRef.current.style.height = "0%";
  }, []);

  const scrollToTop = useCallback(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }
  }, []);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addKeyframe = useCallback(() => {
    setConfig((prev) => {
      if (prev.keyframes.length >= MAX_STOPS) return prev;
      const newStop: KeyframeStop = {
        id: `kf-${++idCounter.current}`,
        position: "50%",
        declarations: "opacity: 0.5; transform: scale(0.95);",
      };
      return { ...prev, keyframes: [...prev.keyframes, newStop] };
    });
  }, []);

  const removeKeyframe = useCallback((id: string) => {
    setConfig((prev) => {
      if (prev.keyframes.length <= MIN_STOPS) return prev;
      return {
        ...prev,
        keyframes: prev.keyframes.filter((k) => k.id !== id),
      };
    });
  }, []);

  const updateKeyframe = useCallback(
    (id: string, field: "position" | "declarations", value: string) => {
      setConfig((prev) => ({
        ...prev,
        keyframes: prev.keyframes.map((k) =>
          k.id === id ? { ...k, [field]: value } : k,
        ),
      }));
    },
    [],
  );

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Hidden <style> tag — receives the real generated CSS via ref */}
      <style ref={styleRef} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">
              Scroll-Driven Animation Builder
            </h3>
            <p className="text-xs text-muted-foreground">
              Build CSS{" "}
              <code className="font-mono text-foreground/70">
                animation-timeline
              </code>{" "}
              with a live scrollable preview
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Browser support badge ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5">
        {supported === null ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MousePointer2 className="size-3.5" />
            Detecting browser support…
          </span>
        ) : supported ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 className="size-3.5" />
            Supported in this browser
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
            <AlertTriangle className="size-3.5" />
            Not supported — try Chrome 115+
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          Chrome 115+ · Edge 115+ · Samsung 24+ · Firefox/Safari: flagged
        </span>
      </div>

      {/* ── Timeline type + per-type config ─────────────────────────── */}
      <Tabs
        value={config.timelineType}
        onValueChange={(v) => updateConfig("timelineType", v as TimelineType)}
      >
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline type
          </Label>
          <TabsList>
            <TabsTrigger value="scroll" className="text-xs">
              <ArrowDownUp className="size-3.5" />
              scroll()
            </TabsTrigger>
            <TabsTrigger value="view" className="text-xs">
              <Sparkles className="size-3.5" />
              view()
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="scroll" className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            The animation progress is tied to the scroll position of the
            nearest scrollable ancestor — 0% at the top, 100% at the bottom.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="sab-axis-scroll"
                className="text-xs text-muted-foreground"
              >
                axis
              </Label>
              <Select
                value={config.axis}
                onValueChange={(v) => updateConfig("axis", v as Axis)}
              >
                <SelectTrigger
                  id="sab-axis-scroll"
                  className="h-8 text-xs"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AXES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="sab-source"
                className="text-xs text-muted-foreground"
              >
                source
              </Label>
              <Select
                value={config.source}
                onValueChange={(v) => updateConfig("source", v as Source)}
              >
                <SelectTrigger
                  id="sab-source"
                  className="h-8 text-xs"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="view" className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            The animation progress is tied to the element entering/exiting the
            scrollport — 0% when it enters from the bottom edge, 100% when it
            exits the top. The{" "}
            <code className="font-mono text-foreground/70">inset</code> shifts
            the detection box.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="sab-axis-view"
                className="text-xs text-muted-foreground"
              >
                axis
              </Label>
              <Select
                value={config.axis}
                onValueChange={(v) => updateConfig("axis", v as Axis)}
              >
                <SelectTrigger
                  id="sab-axis-view"
                  className="h-8 text-xs"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AXES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="sab-inset"
                className="text-xs text-muted-foreground"
              >
                inset
              </Label>
              <Input
                id="sab-inset"
                type="text"
                value={config.inset}
                onChange={(e) => updateConfig("inset", e.target.value)}
                placeholder="0, 20%, auto"
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Animation name / duration / timing ─────────────────────── */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sab-name" className="text-xs text-muted-foreground">
            Animation name
          </Label>
          <Input
            id="sab-name"
            type="text"
            value={config.animationName}
            onChange={(e) => updateConfig("animationName", e.target.value)}
            className="h-8 font-mono text-xs"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="sab-duration"
            className="text-xs text-muted-foreground"
          >
            Duration (fallback)
          </Label>
          <Input
            id="sab-duration"
            type="text"
            value={config.duration}
            onChange={(e) => updateConfig("duration", e.target.value)}
            className="h-8 font-mono text-xs"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sab-timing" className="text-xs text-muted-foreground">
            Timing function
          </Label>
          <Select
            value={config.timingFunction}
            onValueChange={(v) =>
              updateConfig("timingFunction", v as TimingFunction)
            }
          >
            <SelectTrigger id="sab-timing" className="h-8 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMING_FUNCTIONS.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="-mt-2 text-[10px] text-muted-foreground">
        <span className="font-medium">Duration</span> acts as a fallback for
        browsers without scroll-timeline support — the timeline itself drives
        progress when supported. For scroll-driven animations,{" "}
        <code className="font-mono text-foreground/70">linear</code> is
        recommended so progress maps 1:1 to scroll position.
      </p>

      {/* ── Keyframes editor ────────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Keyframes
          </span>
          <button
            type="button"
            onClick={addKeyframe}
            disabled={config.keyframes.length >= MAX_STOPS}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Add stop
          </button>
        </div>
        <div className="space-y-2">
          {config.keyframes.map((kf) => (
            <div
              key={kf.id}
              className="grid grid-cols-[72px_1fr_28px] items-center gap-2"
            >
              <Input
                type="text"
                value={kf.position}
                onChange={(e) =>
                  updateKeyframe(kf.id, "position", e.target.value)
                }
                placeholder="from / to / 50%"
                className="h-8 font-mono text-xs"
                aria-label={`Keyframe ${kf.id} position`}
                spellCheck={false}
              />
              <Input
                type="text"
                value={kf.declarations}
                onChange={(e) =>
                  updateKeyframe(kf.id, "declarations", e.target.value)
                }
                placeholder="opacity: 0; transform: translateY(40px);"
                className="h-8 font-mono text-xs"
                aria-label={`Keyframe ${kf.id} declarations`}
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => removeKeyframe(kf.id)}
                disabled={config.keyframes.length <= MIN_STOPS}
                className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Remove keyframe ${kf.id}`}
                title="Remove stop"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Positions: <code className="font-mono">from</code>,{" "}
          <code className="font-mono">to</code>, or a percentage like{" "}
          <code className="font-mono">50%</code>. Declarations are raw CSS
          (property:value; …).
        </p>
      </div>

      {/* ── Generated CSS ───────────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              copied
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground/80">
          <code>{generatedCSS}</code>
        </pre>
      </div>

      {/* ── Live preview ───────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live preview
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex cursor-pointer items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              aria-label="Scroll preview to top"
              title="Scroll to top"
            >
              <ArrowUp className="size-3.5" />
              Top
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex cursor-pointer items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              aria-label="Scroll preview to bottom"
              title="Scroll to bottom"
            >
              <ArrowDown className="size-3.5" />
              Bottom
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Scroll container — the actual timeline source for scroll() */}
          <div
            ref={scrollRef}
            className="relative h-96 overflow-y-auto rounded-lg border border-border bg-muted/30"
            role="region"
            aria-label="Scroll animation preview"
            tabIndex={0}
          >
            {config.timelineType === "scroll" ? (
              <>
                {/* Sticky wrapper fills the viewport so the target stays
                    centered while the spacer below provides scroll range. */}
                <div className="sticky top-0 flex h-96 items-center justify-center">
                  <div className="scroll-animated rounded-xl bg-primary px-8 py-6 text-center text-primary-foreground shadow-xl">
                    <div className="text-lg font-semibold">
                      Scroll-driven target
                    </div>
                    <div className="mt-1 text-xs opacity-80">
                      animation-timeline: scroll()
                    </div>
                  </div>
                </div>
                {/* Bottom spacer — ~3 viewport heights of scroll range */}
                <div className="h-[1152px]" />
              </>
            ) : (
              <div className="space-y-[320px] py-[400px]">
                {VIEW_CARDS.map((card, i) => (
                  <div
                    key={i}
                    className="scroll-animated mx-auto max-w-xs rounded-xl border-2 border-primary bg-card px-6 py-5 text-center shadow-lg"
                  >
                    <div className="text-base font-semibold text-primary">
                      {card.title}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {card.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vertical progress indicator — sibling overlay, never scrolls */}
          <div
            className="pointer-events-none absolute right-2 top-2 bottom-2 w-1 overflow-hidden rounded-full bg-primary/20"
            aria-hidden="true"
          >
            <div
              ref={progressRef}
              className="w-full rounded-full bg-primary"
              style={{ height: "0%" }}
            />
          </div>

          {/* "Scroll to animate" hint — auto-hides on first scroll */}
          {showHint && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-4">
              <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <MousePointer2 className="size-3.5" />
                <span>scroll to animate</span>
                <ArrowDown className="size-3.5 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {!supported && (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Your browser doesn&rsquo;t support scroll-driven animations — the
              preview won&rsquo;t animate. Open this page in Chrome 115+, Edge
              115+, or Samsung Internet 24+ to see it in action. The generated
              CSS is still valid; provide a JS fallback for unsupported
              browsers.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
