"use client";

/**
 * StartingStyleStudio — explore the CSS `@starting-style` at-rule.
 *
 * `@starting-style` (Baseline 2024) lets developers define the starting
 * styles for an element that is *entering* the DOM, or transitioning from
 * `display: none` to `display: <visible>`. Before this at-rule existed, an
 * element's first rendered frame was also its final frame — you could not
 * transition from an "off-screen" state into existence without JS tricks
 * (double rAF, toggle a class on the next tick, etc.).
 *
 * Pair it with `transition-behavior: allow-discrete` and you also get exit
 * animations: `display: none` becomes a *discrete* transition that the
 * browser holds off on until the end of the transition, so the element can
 * fade / slide out before vanishing.
 *
 * This tool gives developers a live playground:
 *   1. Pick a duration, easing, and which properties to animate
 *      (opacity / transform / scale).
 *   2. Toggle `transition-behavior: allow-discrete` on/off to see how it
 *      unlocks exit animations on `display: none`.
 *   3. Press "Toggle Panel" — both demos flip simultaneously:
 *        • LEFT  — the modern `@starting-style` + `allow-discrete` flow
 *                  (smooth enter AND smooth exit).
 *        • RIGHT — the old behaviour (transitions declared but no
 *                  @starting-style, no allow-discrete): the panel snaps
 *                  in and snaps out, because there is no "before" state
 *                  to transition FROM on entry, and `display: none` is
 *                  applied instantly on exit.
 *   4. Read the generated CSS, copy it, and load a preset.
 *
 * Implementation notes:
 *   - All CSS is injected via a single class-scoped `<style>` block whose
 *     prefix is derived from `useId()`, so the rules cannot leak onto the
 *     host page.
 *   - TypeScript strict, no `any`, no `console.log`. Self-contained (no
 *     props, no external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Sparkles,
  Copy,
  Check,
  Play,
  Eye,
  EyeOff,
  Globe,
  Info,
  Zap,
  ArrowDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type EasingType =
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "linear"
  | "cubic-bezier";

interface CubicBezier {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface StartingStyleState {
  durationMs: number;
  easing: EasingType;
  cubic: CubicBezier;
  animateOpacity: boolean;
  animateTransform: boolean;
  animateScale: boolean;
  translateY: number;
  scaleFrom: number;
  allowDiscrete: boolean;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  state: StartingStyleState;
}

interface BrowserSupport {
  label: string;
  versions: { browser: string; version: string }[];
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier", label: "cubic-bezier(...)" },
];

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2024",
  versions: [
    { browser: "Chrome", version: "117+" },
    { browser: "Edge", version: "117+" },
    { browser: "Safari", version: "17.5+" },
    { browser: "Firefox", version: "129+" },
  ],
};

const DEFAULT_STATE: StartingStyleState = {
  durationMs: 300,
  easing: "ease-out",
  cubic: { x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
  animateOpacity: true,
  animateTransform: true,
  animateScale: false,
  translateY: 20,
  scaleFrom: 0.95,
  allowDiscrete: true,
};

const PRESETS: Preset[] = [
  {
    id: "fade-in",
    label: "Fade in",
    description: "Opacity-only enter/exit.",
    state: {
      durationMs: 300,
      easing: "ease-out",
      cubic: { x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
      animateOpacity: true,
      animateTransform: false,
      animateScale: false,
      translateY: 0,
      scaleFrom: 1,
      allowDiscrete: true,
    },
  },
  {
    id: "slide-up",
    label: "Slide up",
    description: "Slide in from below, opacity off.",
    state: {
      durationMs: 400,
      easing: "ease-out",
      cubic: { x1: 0.22, y1: 1, x2: 0.36, y2: 1 },
      animateOpacity: true,
      animateTransform: true,
      animateScale: false,
      translateY: 24,
      scaleFrom: 1,
      allowDiscrete: true,
    },
  },
  {
    id: "scale-in",
    label: "Scale in",
    description: "Pop in with a slight scale.",
    state: {
      durationMs: 250,
      easing: "ease-out",
      cubic: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
      animateOpacity: true,
      animateTransform: false,
      animateScale: true,
      translateY: 0,
      scaleFrom: 0.9,
      allowDiscrete: true,
    },
  },
  {
    id: "combined",
    label: "Combined",
    description: "Opacity + slide + springy scale.",
    state: {
      durationMs: 500,
      easing: "cubic-bezier",
      cubic: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
      animateOpacity: true,
      animateTransform: true,
      animateScale: true,
      translateY: 16,
      scaleFrom: 0.92,
      allowDiscrete: true,
    },
  },
];

// ============================================================
// Pure helpers
// ============================================================

function easingString(easing: EasingType, cb: CubicBezier): string {
  if (easing === "cubic-bezier") {
    return `cubic-bezier(${cb.x1}, ${cb.y1}, ${cb.x2}, ${cb.y2})`;
  }
  return easing;
}

interface PanelConfig {
  animateOpacity: boolean;
  animateTransform: boolean;
  animateScale: boolean;
  translateY: number;
  scaleFrom: number;
  transitionValue: string;
  withStartingStyle: boolean;
  withAllowDiscrete: boolean;
}

/**
 * Build the CSS rule-set for a single panel.
 *
 * - When `withStartingStyle` is true: emit the `@starting-style` block and
 *   the full hidden state (opacity: 0, transform, scale, display: none).
 * - When `withStartingStyle` is false: emit only `display: none` on the
 *   hidden state — there is no enter transition (no "before" state to
 *   transition FROM) and no exit transition (no `allow-discrete` means
 *   `display: none` applies instantly, killing the transition before it
 *   starts).
 */
function buildPanelRules(className: string, cfg: PanelConfig): string {
  const baseLines: string[] = [];
  if (cfg.animateOpacity) baseLines.push("  opacity: 1;");
  if (cfg.animateTransform) baseLines.push("  transform: translateY(0);");
  if (cfg.animateScale) baseLines.push("  scale: 1;");
  if (cfg.transitionValue) {
    baseLines.push(`  transition: ${cfg.transitionValue};`);
    if (cfg.withAllowDiscrete) {
      baseLines.push("  transition-behavior: allow-discrete;");
    }
  }

  const hiddenLines: string[] = [];
  if (cfg.withStartingStyle) {
    if (cfg.animateOpacity) hiddenLines.push("  opacity: 0;");
    if (cfg.animateTransform) {
      hiddenLines.push(`  transform: translateY(${cfg.translateY}px);`);
    }
    if (cfg.animateScale) hiddenLines.push(`  scale: ${cfg.scaleFrom};`);
  }
  hiddenLines.push("  display: none;");

  const blocks: string[] = [
    `.${className} {\n${baseLines.join("\n")}\n}`,
    `.${className}.is-hidden {\n${hiddenLines.join("\n")}\n}`,
  ];

  const hasEnterState =
    cfg.transitionValue &&
    (cfg.animateOpacity || cfg.animateTransform || cfg.animateScale);

  if (cfg.withStartingStyle && hasEnterState) {
    const startLines: string[] = [];
    if (cfg.animateOpacity) startLines.push("    opacity: 0;");
    if (cfg.animateTransform) {
      startLines.push(`    transform: translateY(${cfg.translateY}px);`);
    }
    if (cfg.animateScale) startLines.push(`    scale: ${cfg.scaleFrom};`);
    blocks.push(
      `@starting-style {\n  .${className}:not(.is-hidden) {\n${startLines.join("\n")}\n  }\n}`,
    );
  }

  return blocks.join("\n\n");
}

// ============================================================
// Component
// ============================================================

export function StartingStyleStudio() {
  const [state, setState] = useState<StartingStyleState>(DEFAULT_STATE);
  const [visible, setVisible] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>("slide-up");
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply the default preset on first render so the studio opens with a
  // sensible config (the constructor of `useState(DEFAULT_STATE)` already
  // covers this — but we also mark the matching preset as active).
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const patch = useCallback(
    <K extends keyof StartingStyleState>(
      key: K,
      value: StartingStyleState[K],
    ): void => {
      setState((prev) => ({ ...prev, [key]: value }));
      setActivePreset(null);
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset): void => {
    setState(preset.state);
    setActivePreset(preset.id);
  }, []);

  const togglePanel = useCallback((): void => {
    setVisible((v) => !v);
  }, []);

  // ── Derived: transition shorthand ──────────────────────────────
  const transitionValue = useMemo<string>(() => {
    const props: string[] = [];
    if (state.animateOpacity) props.push("opacity");
    if (state.animateTransform) props.push("transform");
    if (state.animateScale) props.push("scale");
    if (props.length === 0) return "";
    const e = easingString(state.easing, state.cubic);
    return props.map((p) => `${p} ${state.durationMs}ms ${e}`).join(", ");
  }, [state]);

  // ── Derived: scoped class for the injected <style> ─────────────
  // `useId` returns a string like ":r3:" — strip non-alphanumerics so it
  // is safe to use as a CSS class name.
  const rawId = useId();
  const scopeClass = useMemo(
    () => `ss-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`,
    [rawId],
  );

  // ── Derived: injected CSS (uses scoped class names) ────────────
  const injectedCss = useMemo<string>(() => {
    const sharedCfg = {
      animateOpacity: state.animateOpacity,
      animateTransform: state.animateTransform,
      animateScale: state.animateScale,
      translateY: state.translateY,
      scaleFrom: state.scaleFrom,
      transitionValue,
    };
    const withRules = buildPanelRules(`${scopeClass}-with`, {
      ...sharedCfg,
      withStartingStyle: true,
      withAllowDiscrete: state.allowDiscrete,
    });
    const withoutRules = buildPanelRules(`${scopeClass}-without`, {
      ...sharedCfg,
      withStartingStyle: false,
      withAllowDiscrete: false,
    });
    return `${withRules}\n\n${withoutRules}`;
  }, [state, transitionValue, scopeClass]);

  // ── Derived: generated CSS for display (uses friendly .panel) ──
  const generatedCss = useMemo<string>(() => {
    return buildPanelRules("panel", {
      animateOpacity: state.animateOpacity,
      animateTransform: state.animateTransform,
      animateScale: state.animateScale,
      translateY: state.translateY,
      scaleFrom: state.scaleFrom,
      transitionValue,
      withStartingStyle: true,
      withAllowDiscrete: state.allowDiscrete,
    });
  }, [state, transitionValue]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, COPY_CONFIRM_MS);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context) — no-op.
    }
  }, [generatedCss]);

  const hiddenClass = visible ? "" : "is-hidden";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <style>{injectedCss}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="size-5" />
                <span>@starting-style Studio</span>
              </CardTitle>
              <CardDescription>
                Animate elements entering the DOM or transitioning out of{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  display: none
                </code>{" "}
                — without a single line of JavaScript.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Globe className="size-3" />
              {BROWSER_SUPPORT.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BROWSER_SUPPORT.versions.map((v) => (
              <Badge key={v.browser} variant="outline" className="gap-1">
                <span className="text-muted-foreground">{v.browser}</span>
                <span>{v.version}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Live comparison ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="size-4" />
            Live comparison
          </CardTitle>
          <CardDescription>
            Both panels toggle together. The left uses{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              @starting-style
            </code>{" "}
            +{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              transition-behavior: allow-discrete
            </code>
            ; the right declares the same transitions but cannot animate
            entry or exit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* WITH @starting-style */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="gap-1">
                  <Zap className="size-3" />
                  With @starting-style
                </Badge>
              </div>
              <div
                className="relative min-h-[140px] overflow-hidden rounded-lg border border-dashed p-3"
                aria-label="Live preview with @starting-style"
              >
                <div className={cn(scopeClass + "-with", hiddenClass, "rounded-md bg-primary/10 p-3")}>
                  <p className="text-sm font-medium text-primary">
                    Smooth enter &amp; exit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fades, slides, and scales — all from CSS.
                  </p>
                </div>
              </div>
            </div>

            {/* WITHOUT @starting-style */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <ArrowDownUp className="size-3" />
                  Without @starting-style
                </Badge>
              </div>
              <div
                className="relative min-h-[140px] overflow-hidden rounded-lg border border-dashed p-3"
                aria-label="Live preview without @starting-style"
              >
                <div className={cn(scopeClass + "-without", hiddenClass, "rounded-md bg-muted p-3")}>
                  <p className="text-sm font-medium">
                    Snaps in / out instantly
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No enter transition, no exit transition.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={togglePanel} className="gap-2">
              {visible ? (
                <>
                  <EyeOff className="size-4" />
                  Hide panel
                </>
              ) : (
                <>
                  <Eye className="size-4" />
                  Show panel
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              Press to flip both demos simultaneously.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Controls ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controls</CardTitle>
          <CardDescription>
            Configure the transition, then press Show / Hide panel to watch
            the difference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ss-duration">Duration</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {state.durationMs}ms
              </span>
            </div>
            <Slider
              id="ss-duration"
              min={0}
              max={2000}
              step={50}
              value={[state.durationMs]}
              onValueChange={(v) => patch("durationMs", v[0] ?? 0)}
            />
          </div>

          {/* Easing */}
          <div className="space-y-2">
            <Label htmlFor="ss-easing">Easing</Label>
            <Select
              value={state.easing}
              onValueChange={(v) => patch("easing", v as EasingType)}
            >
              <SelectTrigger id="ss-easing" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EASING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cubic-bezier controls */}
          {state.easing === "cubic-bezier" && (
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-4">
              {(
                [
                  { key: "x1", label: "x1" },
                  { key: "y1", label: "y1" },
                  { key: "x2", label: "x2" },
                  { key: "y2", label: "y2" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label
                    htmlFor={`ss-cb-${key}`}
                    className="text-xs text-muted-foreground"
                  >
                    {label}
                  </Label>
                  <Input
                    id={`ss-cb-${key}`}
                    type="number"
                    step={0.01}
                    value={state.cubic[key]}
                    onChange={(e) => {
                      const next = Number.parseFloat(e.target.value);
                      if (Number.isFinite(next)) {
                        patch("cubic", { ...state.cubic, [key]: next });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Animated properties */}
          <div className="space-y-2">
            <Label>Animated properties</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <PropToggle
                label="opacity"
                description="Fade"
                checked={state.animateOpacity}
                onCheckedChange={(v) => patch("animateOpacity", v)}
              />
              <PropToggle
                label="transform"
                description="Slide"
                checked={state.animateTransform}
                onCheckedChange={(v) => patch("animateTransform", v)}
              />
              <PropToggle
                label="scale"
                description="Pop"
                checked={state.animateScale}
                onCheckedChange={(v) => patch("animateScale", v)}
              />
            </div>
          </div>

          {/* Transform & scale values */}
          {state.animateTransform && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ss-translate">translateY (enter from)</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {state.translateY}px
                </span>
              </div>
              <Slider
                id="ss-translate"
                min={0}
                max={100}
                step={1}
                value={[state.translateY]}
                onValueChange={(v) => patch("translateY", v[0] ?? 0)}
              />
            </div>
          )}

          {state.animateScale && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ss-scale">scale (enter from)</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {state.scaleFrom.toFixed(2)}
                </span>
              </div>
              <Slider
                id="ss-scale"
                min={0.5}
                max={1}
                step={0.01}
                value={[state.scaleFrom]}
                onValueChange={(v) => patch("scaleFrom", v[0] ?? 1)}
              />
            </div>
          )}

          {/* Allow discrete */}
          <div className="flex items-start justify-between gap-4 rounded-md border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label
                htmlFor="ss-allow-discrete"
                className="flex items-center gap-2"
              >
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  transition-behavior: allow-discrete
                </code>
              </Label>
              <p className="text-xs text-muted-foreground">
                Required to animate the{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  display
                </code>{" "}
                property. Without it, the panel vanishes instantly the moment
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  display: none
                </code>{" "}
                is applied — even if other transitions are declared.
              </p>
            </div>
            <Switch
              id="ss-allow-discrete"
              checked={state.allowDiscrete}
              onCheckedChange={(v) => patch("allowDiscrete", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Presets ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presets</CardTitle>
          <CardDescription>
            Load a curated starting-style configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors hover:bg-accent",
                    isActive && "ring-2 ring-primary ring-offset-1",
                  )}
                  aria-pressed={isActive}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {preset.label}
                    {isActive && (
                      <Badge variant="secondary" className="px-1.5 py-0">
                        active
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Generated CSS ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Generated CSS</CardTitle>
              <CardDescription>
                Drop this into your stylesheet and toggle the{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  .is-hidden
                </code>{" "}
                class from JS.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
            <code>{generatedCss}</code>
          </pre>
        </CardContent>
      </Card>

      {/* ── Explanation ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" />
            Why @starting-style?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            CSS transitions work by interpolating between an{" "}
            <em>old</em> computed style and a <em>new</em> computed style.
            But when an element is first rendered — either inserted into the
            DOM or surfaced from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              display: none
            </code>{" "}
            — there is no old style. The browser paints the first frame at
            the final values, so the transition has nothing to animate from.
            Historically developers worked around this with JavaScript:
            insert the element, force a reflow, then add a class on the next
            animation frame.
          </p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              @starting-style
            </code>{" "}
            solves this declaratively. You declare the "before" state inside
            the at-rule; the browser uses those values for the very first
            frame and then transitions to the element's normal styles. No
            JS, no double-rAF.
          </p>
          <p>
            Exit animations have a sibling problem:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              display: none
            </code>{" "}
            is a <em>discrete</em> property that takes effect instantly,
            which kills any in-flight transition. The companion declaration{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              transition-behavior: allow-discrete
            </code>{" "}
            tells the browser to defer the discrete change to the end of the
            transition, so the element can fade or slide out before it
            actually disappears.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Small sub-components
// ============================================================

interface PropToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function PropToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: PropToggleProps) {
  const id = `ss-prop-${label}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-md border p-2 transition-colors hover:bg-accent",
        checked && "border-primary bg-primary/5",
      )}
    >
      <span className="flex flex-col">
        <span className="font-mono text-xs">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
