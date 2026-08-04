"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import {
  SquareStack,
  Play,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Code2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * ViewTransitionBuilder — an interactive `document.startViewTransition`
 * playground.
 *
 * Features:
 *  - Live demo with 4 colored cards that reflow between State A (2×2 grid)
 *    and State B (card-1 spans the left column, cards 2/3/4 stack on the
 *    right). Each card has a unique `view-transition-name`.
 *  - 6 transition types: Morph (default size/pos interpolation + crossfade),
 *    Fade, Slide, Zoom, Flip (3D), Custom (user CSS).
 *  - CSS editor textarea whose contents are injected live into a `<style>`
 *    tag — selecting a type fills the textarea with that type’s CSS; editing
 *    it switches to “Custom”.
 *  - Duration slider (100–2000 ms).
 *  - Trigger button calls `document.startViewTransition()` with the state
 *    update wrapped in `flushSync()` so React commits synchronously inside
 *    the transition callback.
 *  - Feature-detection badge (Supported / Unsupported) with an amber
 *    fallback note. Browsers without the API still toggle the layout (no
 *    animation).
 *  - Generated CSS + JS code blocks with Copy buttons.
 *
 * Browser support: View Transitions API is Baseline (Chrome 111+, Edge 111+,
 * Safari 18+). Firefox is behind a flag.
 */

// ============================================================
// Types
// ============================================================

type TransitionType =
  | "morph"
  | "fade"
  | "slide"
  | "zoom"
  | "flip"
  | "custom";

type LayoutState = "A" | "B";

// ============================================================
// Constants
// ============================================================

const TYPES: { value: TransitionType; label: string }[] = [
  { value: "morph", label: "Morph" },
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "flip", label: "Flip" },
  { value: "custom", label: "Custom" },
];

const CARDS = [
  { id: 1, cls: "vt-card-1", color: "hsl(14 90% 58%)" },
  { id: 2, cls: "vt-card-2", color: "hsl(160 70% 42%)" },
  { id: 3, cls: "vt-card-3", color: "hsl(45 95% 55%)" },
  { id: 4, cls: "vt-card-4", color: "hsl(280 65% 62%)" },
];

const CARD_NAME_CSS = [
  "/* Give every element you want the browser to morph a unique name. */",
  ".vt-card-1 { view-transition-name: card-1; }",
  ".vt-card-2 { view-transition-name: card-2; }",
  ".vt-card-3 { view-transition-name: card-3; }",
  ".vt-card-4 { view-transition-name: card-4; }",
].join("\n");

// ============================================================
// Helpers
// ============================================================

/** Build the animation CSS block for a built-in type + duration. */
function buildAnimationCss(type: TransitionType, duration: number): string {
  const d = `${duration}ms`;
  switch (type) {
    case "morph":
      return (
        `/* Morph — default: the group interpolates position & size, the\n` +
        `   old/new snapshots crossfade. */\n` +
        `::view-transition-group(*),\n` +
        `::view-transition-old(*),\n` +
        `::view-transition-new(*) {\n` +
        `  animation-duration: ${d};\n` +
        `}`
      );
    case "fade":
      return (
        `/* Fade — disable the group morph, pure crossfade. */\n` +
        `::view-transition-group(*) { animation: none; }\n` +
        `::view-transition-old(*) {\n` +
        `  animation: vt-fade-out ${d} ease forwards;\n` +
        `}\n` +
        `::view-transition-new(*) {\n` +
        `  animation: vt-fade-in ${d} ease forwards;\n` +
        `}\n` +
        `@keyframes vt-fade-out { to { opacity: 0; } }\n` +
        `@keyframes vt-fade-in  { from { opacity: 0; } }`
      );
    case "slide":
      return (
        `/* Slide — old exits left, new enters right. */\n` +
        `::view-transition-group(*) { animation-duration: ${d}; }\n` +
        `::view-transition-old(*) {\n` +
        `  animation: vt-slide-out ${d} ease forwards;\n` +
        `}\n` +
        `::view-transition-new(*) {\n` +
        `  animation: vt-slide-in ${d} ease forwards;\n` +
        `}\n` +
        `@keyframes vt-slide-out { to { transform: translateX(-100%); opacity: 0; } }\n` +
        `@keyframes vt-slide-in  { from { transform: translateX(100%); opacity: 0; } }`
      );
    case "zoom":
      return (
        `/* Zoom — old shrinks out, new grows in. */\n` +
        `::view-transition-group(*) { animation-duration: ${d}; }\n` +
        `::view-transition-old(*) {\n` +
        `  animation: vt-zoom-out ${d} ease forwards;\n` +
        `}\n` +
        `::view-transition-new(*) {\n` +
        `  animation: vt-zoom-in ${d} ease forwards;\n` +
        `}\n` +
        `@keyframes vt-zoom-out { to   { transform: scale(0.3); opacity: 0; } }\n` +
        `@keyframes vt-zoom-in  { from { transform: scale(1.6); opacity: 0; } }`
      );
    case "flip":
      return (
        `/* Flip — 3D rotateY on old/new with perspective on the root. */\n` +
        `::view-transition { perspective: 1200px; }\n` +
        `::view-transition-group(*) { animation-duration: ${d}; }\n` +
        `::view-transition-old(*),\n` +
        `::view-transition-new(*) {\n` +
        `  transform-origin: center;\n` +
        `}\n` +
        `::view-transition-old(*) {\n` +
        `  animation: vt-flip-out ${d} ease forwards;\n` +
        `}\n` +
        `::view-transition-new(*) {\n` +
        `  animation: vt-flip-in ${d} ease forwards;\n` +
        `}\n` +
        `@keyframes vt-flip-out { to   { transform: rotateY(90deg);  opacity: 0; } }\n` +
        `@keyframes vt-flip-in  { from { transform: rotateY(-90deg); opacity: 0; } }`
      );
    case "custom":
      // Custom starts as the morph template; the user edits from there.
      return buildAnimationCss("morph", duration);
    default:
      return "";
  }
}

function buildFullCss(type: TransitionType, duration: number): string {
  return `${CARD_NAME_CSS}\n\n${buildAnimationCss(type, duration)}`;
}

// ============================================================
// Component
// ============================================================

export function ViewTransitionBuilder() {
  const [type, setType] = useState<TransitionType>("morph");
  const [duration, setDuration] = useState(600);
  const [cssInput, setCssInput] = useState(() => buildFullCss("morph", 600));
  const [layoutState, setLayoutState] = useState<LayoutState>("A");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);

  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* ── Feature detection (deferred to rAF to satisfy react-hooks rule) ── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        if (typeof document === "undefined") {
          setSupported(false);
          return;
        }
        const doc = document as Document & {
          startViewTransition?: unknown;
        };
        setSupported(typeof doc.startViewTransition === "function");
      } catch {
        setSupported(false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Inject the textarea CSS into a live <style> tag ──────────────── */
  useEffect(() => {
    const el = styleRef.current;
    if (el) el.textContent = cssInput;
  }, [cssInput]);

  /* ── Trigger a view transition ────────────────────────────────────── */
  const trigger = useCallback(() => {
    const next: LayoutState = layoutState === "A" ? "B" : "A";
    try {
      if (typeof document === "undefined") return;
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => {
          finished: Promise<void>;
        };
      };
      if (typeof doc.startViewTransition === "function") {
        doc.startViewTransition(() => {
          flushSync(() => setLayoutState(next));
        });
      } else {
        setLayoutState(next);
      }
    } catch {
      setLayoutState(next);
    }
  }, [layoutState]);

  const reset = useCallback(() => {
    setType("morph");
    setDuration(600);
    setCssInput(buildFullCss("morph", 600));
    setLayoutState("A");
  }, []);

  /* ── Selecting a type: update type + regenerate CSS (event-driven,
         not effect-driven, to avoid setState-in-effect cascades). ────── */
  const selectType = useCallback(
    (t: TransitionType) => {
      setType(t);
      if (t !== "custom") {
        setCssInput(buildFullCss(t, duration));
      }
    },
    [duration],
  );

  /* ── Changing the duration slider: also refresh the textarea when the
         user hasn’t switched to Custom. ─────────────────────────────── */
  const changeDuration = useCallback((d: number) => {
    setDuration(d);
    setType((prevType) => {
      if (prevType !== "custom") {
        setCssInput(buildFullCss(prevType, d));
      }
      return prevType;
    });
  }, []);

  /* ── Editing the textarea → switch to Custom ──────────────────────── */
  const onCssEdit = useCallback((val: string) => {
    setType("custom");
    setCssInput(val);
  }, []);

  /* ── Generated JS code block ──────────────────────────────────────── */
  const generatedJs = useMemo(
    () =>
      `// 1. Give each morphing element a unique view-transition-name (in CSS).\n` +
      `// 2. Trigger a transition around your DOM mutation:\n` +
      `const transition = document.startViewTransition(() => {\n` +
      `  // Mutate the DOM synchronously here.\n` +
      `  // React users MUST wrap setState in flushSync:\n` +
      `  //   import { flushSync } from "react-dom";\n` +
      `  //   flushSync(() => setLayout("B"));\n` +
      `  document.querySelector(".demo").classList.toggle("state-b");\n` +
      `});\n\n` +
      `// 3. (Optional) react to the transition finishing.\n` +
      `transition.finished.finally(() => {\n` +
      `  console.log("transition done");\n` +
      `});`,
    [],
  );

  /* ── Copy handler ─────────────────────────────────────────────────── */
  const copyText = useCallback(async (text: string, which: "css" | "js") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "css") {
        setCopiedCss(true);
        window.setTimeout(() => setCopiedCss(false), 2000);
      } else {
        setCopiedJs(true);
        window.setTimeout(() => setCopiedJs(false), 2000);
      }
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  /* ── Demo grid style ──────────────────────────────────────────────── */
  const gridStyle = useMemo<CSSProperties>(() => {
    if (layoutState === "A") {
      return {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 8,
        height: 280,
      };
    }
    return {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr 1fr",
      gap: 8,
      height: 280,
    };
  }, [layoutState]);

  const cardStyle = useCallback(
    (id: number): CSSProperties => {
      const base: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        fontWeight: 800,
        color: "white",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      };
      if (layoutState === "B" && id === 1) {
        return { ...base, gridColumn: "1", gridRow: "1 / 4" };
      }
      if (layoutState === "B") {
        return { ...base, gridColumn: "2" };
      }
      return base;
    },
    [layoutState],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden style tag holding the live CSS */}
      <style ref={styleRef} />

      {/* Header + support badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SquareStack className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            View Transition Builder
          </h3>
        </div>
        <Badge
          variant={supported === false ? "destructive" : "secondary"}
          className={cn(
            "gap-1 text-xs",
            supported === true && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
            supported === false && "border-amber-500/40 text-amber-600 dark:text-amber-400",
          )}
        >
          {supported === null
            ? "Detecting…"
            : supported
              ? "Supported"
              : "Unsupported"}
          {supported === false && <AlertTriangle className="size-3" />}
        </Badge>
      </div>

      {/* Demo area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Live demo — State {layoutState}
          </Label>
          <span className="text-[11px] text-muted-foreground">
            Tap trigger to reflow
          </span>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div style={gridStyle}>
            {CARDS.map((c) => (
              <div
                key={c.id}
                className={c.cls}
                style={{
                  ...cardStyle(c.id),
                  background: c.color,
                }}
              >
                {c.id}
              </div>
            ))}
          </div>
        </div>
        {supported === false && (
          <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            <span>
              Your browser doesn’t expose{" "}
              <code>document.startViewTransition</code>. The layout will still
              toggle, just without the animated transition. Try Chrome 111+ or
              Safari 18+.
            </span>
          </p>
        )}
      </div>

      {/* Trigger + reset */}
      <div className="flex items-center gap-2">
        <Button
          onClick={trigger}
          className="h-9 gap-2"
          size="sm"
        >
          <Play className="size-4" />
          Trigger transition
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3.5" /> Reset
        </Button>
      </div>

      {/* Transition type selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Transition type
        </Label>
        <div className="flex flex-wrap gap-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => selectType(t.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                type === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={type === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Duration
          </Label>
          <span className="text-xs text-foreground">{duration}ms</span>
        </div>
        <Slider
          value={[duration]}
          min={100}
          max={2000}
          step={50}
          onValueChange={(v) => changeDuration(v[0])}
          aria-label="Transition duration"
        />
      </div>

      {/* CSS editor (live-injected) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Code2 className="size-3" />
            CSS editor {type === "custom" && "(Custom)"}
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyText(cssInput, "css")}
            className="h-7 gap-1.5 text-xs"
          >
            {copiedCss ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </Button>
        </div>
        <Textarea
          value={cssInput}
          onChange={(e) => onCssEdit(e.target.value)}
          spellCheck={false}
          className="h-56 font-mono text-[11px] leading-relaxed"
          aria-label="View transition CSS editor"
        />
        <p className="text-[11px] text-muted-foreground">
          Edits inject live into a{" "}
          <code className="text-foreground">&lt;style&gt;</code> tag. Pick a
          built-in type to reload its template.
        </p>
      </div>

      {/* Generated JS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3" />
            Trigger JS
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyText(generatedJs, "js")}
            className="h-7 gap-1.5 text-xs"
          >
            {copiedJs ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
          <code>{generatedJs}</code>
        </pre>
      </div>
    </div>
  );
}
