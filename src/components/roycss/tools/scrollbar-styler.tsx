"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Copy,
  Check,
  Sparkles,
  Palette,
  Eye,
  ArrowUpDown,
  RotateCcw,
  Info,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * ScrollbarStyler — a visual builder for custom CSS scrollbars.
 *
 * Outputs cross-browser scrollbar CSS: `::-webkit-scrollbar*` pseudos for
 * Chrome/Safari/Edge, and the standard `scrollbar-width` / `scrollbar-color`
 * properties for Firefox (and the new spec-conformant Edge).
 *
 * Features:
 *  - Live preview: a real scrollable container with ~500px of content that
 *    renders the ACTUAL generated CSS via an injected `<style>` tag. The
 *    preview is keyed to a stable scope class so the rules never leak.
 *  - Controls: width, track color + radius, thumb color + radius, thumb
 *    hover color, thumb border (width + color) for an inset effect, button
 *    visibility toggle, Firefox `scrollbar-width` (auto|thin|none), and
 *    `scrollbar-color` with auto-derive from thumb+track plus an override.
 *  - Presets: Minimal, Rounded, Neon, Invisible, MacOS, Windows — each is a
 *    partial config overlaid on the defaults, with active-state highlight.
 *  - Generated CSS: a clean, copy-ready cross-browser block. Copy button
 *    with a 2s Check confirmation.
 *  - Browser support note: short reference summarising which engine uses
 *    which mechanism.
 *
 * All colors are emitted as `oklch()` to match the RoyCSS design token
 * system. Hex inputs are converted via a sRGB → OKLCH pipeline.
 *
 * Output is memoised; the `<style>` injection is a direct DOM write per
 * render cycle (no React reconciliation of CSS text).
 */

// ============================================================
// Types
// ============================================================

type FirefoxWidth = "auto" | "thin" | "none";

type PresetKey =
  | "default"
  | "minimal"
  | "rounded"
  | "neon"
  | "invisible"
  | "macos"
  | "windows";

interface ScrollbarConfig {
  /** ::-webkit-scrollbar width (px). 4–24. */
  width: number;
  /** Track background (hex). */
  trackColor: string;
  /** Track border-radius (px). 0–12. */
  trackRadius: number;
  /** Thumb background (hex). */
  thumbColor: string;
  /** Thumb border-radius (px). 0–12. */
  thumbRadius: number;
  /** Thumb :hover background (hex). */
  thumbHoverColor: string;
  /** Thumb border width (px). 0–4. 0 = no border. */
  thumbBorderWidth: number;
  /** Thumb border color (hex). */
  thumbBorderColor: string;
  /** When false, hides ::-webkit-scrollbar-button. */
  showButtons: boolean;
  /** Firefox scrollbar-width. */
  firefoxWidth: FirefoxWidth;
  /** When true, use `firefoxColorOverride` for scrollbar-color thumb side. */
  overrideFirefoxColor: boolean;
  /** Firefox scrollbar-color override (thumb side). Track side = track. */
  firefoxColorOverride: string;
}

interface Preset {
  key: PresetKey;
  label: string;
  /** Partial config merged onto DEFAULT_CONFIG. */
  patch: Partial<ScrollbarConfig>;
}

// ============================================================
// Constants
// ============================================================

const PREVIEW_SCOPE_CLASS = "roycss-sb-live";
const PREVIEW_HEIGHT = 250;

/** Hex value used when the user wants an explicit transparent color. */
const HEX_TRANSPARENT = "#00000000";

const DEFAULT_CONFIG: ScrollbarConfig = {
  width: 12,
  trackColor: "#1f2937",
  trackRadius: 6,
  thumbColor: "#0d9488",
  thumbRadius: 6,
  thumbHoverColor: "#0f766e",
  thumbBorderWidth: 2,
  thumbBorderColor: "#1f2937",
  showButtons: false,
  firefoxWidth: "thin",
  overrideFirefoxColor: false,
  firefoxColorOverride: "#0d9488",
};

const PRESETS: Preset[] = [
  {
    key: "minimal",
    label: "Minimal",
    patch: {
      width: 8,
      trackColor: "#e2e8f0",
      trackRadius: 0,
      thumbColor: "#94a3b8",
      thumbRadius: 0,
      thumbHoverColor: "#64748b",
      thumbBorderWidth: 0,
      thumbBorderColor: "#e2e8f0",
      showButtons: false,
      firefoxWidth: "thin",
    },
  },
  {
    key: "rounded",
    label: "Rounded",
    patch: {
      width: 16,
      trackColor: "#0f172a",
      trackRadius: 12,
      thumbColor: "#14b8a6",
      thumbRadius: 12,
      thumbHoverColor: "#0d9488",
      thumbBorderWidth: 0,
      thumbBorderColor: "#0f172a",
      showButtons: false,
      firefoxWidth: "auto",
    },
  },
  {
    key: "neon",
    label: "Neon",
    patch: {
      width: 14,
      trackColor: "#0a0a0f",
      trackRadius: 8,
      thumbColor: "#d946ef",
      thumbRadius: 8,
      thumbHoverColor: "#f0abfc",
      thumbBorderWidth: 0,
      thumbBorderColor: "#0a0a0f",
      showButtons: false,
      firefoxWidth: "thin",
    },
  },
  {
    key: "invisible",
    label: "Invisible",
    patch: {
      width: 0,
      trackColor: HEX_TRANSPARENT,
      trackRadius: 0,
      thumbColor: HEX_TRANSPARENT,
      thumbRadius: 0,
      thumbHoverColor: HEX_TRANSPARENT,
      thumbBorderWidth: 0,
      thumbBorderColor: HEX_TRANSPARENT,
      showButtons: false,
      firefoxWidth: "none",
    },
  },
  {
    key: "macos",
    label: "MacOS",
    patch: {
      width: 8,
      trackColor: "#f1f5f9",
      trackRadius: 8,
      thumbColor: "#cbd5e1",
      thumbRadius: 8,
      thumbHoverColor: "#94a3b8",
      thumbBorderWidth: 1,
      thumbBorderColor: "#f1f5f9",
      showButtons: false,
      firefoxWidth: "thin",
    },
  },
  {
    key: "windows",
    label: "Windows",
    patch: {
      width: 16,
      trackColor: "#e2e8f0",
      trackRadius: 0,
      thumbColor: "#64748b",
      thumbRadius: 0,
      thumbHoverColor: "#334155",
      thumbBorderWidth: 0,
      thumbBorderColor: "#e2e8f0",
      showButtons: true,
      firefoxWidth: "auto",
    },
  },
];

const FIREFOX_WIDTH_OPTIONS: { value: FirefoxWidth; label: string }[] = [
  { value: "auto", label: "auto" },
  { value: "thin", label: "thin" },
  { value: "none", label: "none" },
];

/** Sample content rendered inside the preview scroller. */
const PREVIEW_LINES: string[] = [
  "CSS scrollbars are a small but powerful surface area.",
  "Native ::-webkit-scrollbar pseudos let you style width, track, thumb, and buttons independently — but they are non-standard.",
  "Firefox ships two simple properties: scrollbar-width (auto | thin | none) and scrollbar-color (thumb track).",
  "Edge (Chromium) supports both the WebKit pseudos and the standard Firefox properties — prefer the standard pair for forward-compat.",
  "For invisible scrollbars, set scrollbar-width: none and width: 0 on ::-webkit-scrollbar.",
  "Use thumb border (with a color matching the track) to carve an inset thumb shape without changing the background.",
  "Border-radius on thumb + track is what makes the modern 'pill' scrollbar look — pair with a slightly smaller thumb radius than track radius.",
  "Hover styles only apply to the thumb pseudo — there is no ::-webkit-scrollbar-track:hover.",
  "Custom scrollbars are not exposed to assistive tech; they are purely cosmetic. Always ensure page-level scrolling still works.",
  "On touch devices, scrollbars are typically overlay-style and ignore most of these properties. Test on real hardware.",
  "scrollbar-gutter: stable lets you reserve space for the scrollbar so layout doesn't shift when content grows.",
  "For high-density data tables, a thin (4–6px) scrollbar with a contrasting thumb keeps the UI compact without sacrificing discoverability.",
];

// ============================================================
// Color math: sRGB (hex) → OKLCH
// ============================================================
//
// Pipeline (Björn Ottosson's OKLab, direct linear-sRGB → LMS form):
//   1. Parse hex → sRGB channels in [0, 1].
//   2. Gamma-decode sRGB → linear sRGB.
//   3. Linear sRGB → LMS (3×3 matrix).
//   4. Apply cube-root non-linearity to L, M, S.
//   5. LMS' → OKLab (3×3 matrix).
//   6. OKLab → OKLCH (cylindrical: C = √(a²+b²), H = atan2(b,a)·180/π).
//
// Alpha: hex #RRGGBBAA is supported; if alpha < 1, an `/ <alpha>` suffix
// is appended to the oklch() call.

/** sRGB channel (0–1) → linear sRGB (gamma decode). */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parse a hex string (#RGB, #RGBA, #RRGGBB, or #RRGGBBAA) into sRGB
 * channels in [0, 1]. Returns null for malformed input.
 */
function hexToRgba(hex: string): Rgba | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;
  let r: number, g: number, b: number, a: number;
  switch (cleaned.length) {
    case 3:
      r = parseInt(cleaned[0] + cleaned[0], 16);
      g = parseInt(cleaned[1] + cleaned[1], 16);
      b = parseInt(cleaned[2] + cleaned[2], 16);
      a = 255;
      break;
    case 4:
      r = parseInt(cleaned[0] + cleaned[0], 16);
      g = parseInt(cleaned[1] + cleaned[1], 16);
      b = parseInt(cleaned[2] + cleaned[2], 16);
      a = parseInt(cleaned[3] + cleaned[3], 16);
      break;
    case 6:
      r = parseInt(cleaned.slice(0, 2), 16);
      g = parseInt(cleaned.slice(2, 4), 16);
      b = parseInt(cleaned.slice(4, 6), 16);
      a = 255;
      break;
    case 8:
      r = parseInt(cleaned.slice(0, 2), 16);
      g = parseInt(cleaned.slice(2, 4), 16);
      b = parseInt(cleaned.slice(4, 6), 16);
      a = parseInt(cleaned.slice(6, 8), 16);
      break;
    default:
      return null;
  }
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
}

/**
 * Convert an sRGB color to its `oklch()` string representation.
 * Returns the original hex string unchanged if it cannot be parsed.
 */
function hexToOklch(hex: string): string {
  const rgba = hexToRgba(hex);
  if (!rgba) return hex;
  const { r, g, b, a } = rgba;
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // Linear sRGB → LMS (Ottosson's direct matrix).
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // Non-linearity (cube root).
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS' → OKLab.
  const okL = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const okA = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const okB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // OKLab → OKLCH.
  const okC = Math.sqrt(okA * okA + okB * okB);
  let okH = (okA === 0 && okB === 0) ? 0 : Math.atan2(okB, okA) * 180 / Math.PI;
  if (okH < 0) okH += 360;

  const lf = Number(okL.toFixed(3));
  const cf = Number(okC.toFixed(3));
  const hf = Number(okH.toFixed(1));
  const base = `oklch(${lf} ${cf} ${hf})`;
  return a < 1 ? `${base} / ${Number(a.toFixed(3))}` : base;
}

// ============================================================
// CSS generator
// ============================================================

/**
 * Build the cross-browser scrollbar CSS for a given selector.
 * Pure function; memoised by the caller.
 */
function buildCSS(config: ScrollbarConfig, selector: string): string {
  const track = hexToOklch(config.trackColor);
  const thumb = hexToOklch(config.thumbColor);
  const thumbHover = hexToOklch(config.thumbHoverColor);
  const thumbBorder = hexToOklch(config.thumbBorderColor);
  const ffThumb = config.overrideFirefoxColor
    ? hexToOklch(config.firefoxColorOverride)
    : thumb;

  const lines: string[] = [];

  // ── Firefox (and spec-conformant Edge) ──────────────────────────
  lines.push("/* Firefox */");
  lines.push(`${selector} {`);
  lines.push(`  scrollbar-width: ${config.firefoxWidth};`);
  if (config.firefoxWidth !== "none") {
    lines.push(`  scrollbar-color: ${ffThumb} ${track};`);
  }
  lines.push("}");
  lines.push("");

  // ── WebKit / Chromium (Chrome, Safari, Edge) ────────────────────
  lines.push("/* WebKit (Chrome, Safari, Edge) */");
  lines.push(`${selector}::-webkit-scrollbar {`);
  lines.push(`  width: ${config.width}px;`);
  lines.push("}");
  lines.push(`${selector}::-webkit-scrollbar-track {`);
  lines.push(`  background: ${track};`);
  lines.push(`  border-radius: ${config.trackRadius}px;`);
  lines.push("}");
  lines.push(`${selector}::-webkit-scrollbar-thumb {`);
  lines.push(`  background: ${thumb};`);
  lines.push(`  border-radius: ${config.thumbRadius}px;`);
  if (config.thumbBorderWidth > 0) {
    lines.push(`  border: ${config.thumbBorderWidth}px solid ${thumbBorder};`);
  }
  lines.push("}");
  lines.push(`${selector}::-webkit-scrollbar-thumb:hover {`);
  lines.push(`  background: ${thumbHover};`);
  lines.push("}");

  if (!config.showButtons) {
    lines.push(`${selector}::-webkit-scrollbar-button {`);
    lines.push("  display: none;");
    lines.push("}");
  }

  return lines.join("\n");
}

/**
 * Check whether the current config matches a given preset (shallow
 * comparison across the preset's patched keys). Used for the active chip
 * highlight.
 */
function matchesPreset(config: ScrollbarConfig, preset: Preset): boolean {
  return Object.entries(preset.patch).every(
    ([key, value]) =>
      config[key as keyof ScrollbarConfig] ===
      (value as ScrollbarConfig[keyof ScrollbarConfig]),
  );
}

// ============================================================
// Component
// ============================================================

export function ScrollbarStyler() {
  const [config, setConfig] = useState<ScrollbarConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  /** Direct DOM write target for the live-preview <style> tag. */
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  /* ── Generated CSS (user-facing, uses `.scrollable` selector) ─────── */
  const generatedCSS = useMemo(
    () => buildCSS(config, ".scrollable"),
    [config],
  );

  /* ── Preview CSS (scoped to the live preview element) ────────────── */
  const previewCSS = useMemo(
    () => buildCSS(config, `.${PREVIEW_SCOPE_CLASS}`),
    [config],
  );

  /* ── Inject preview CSS via direct DOM write (no React reconcile) ── */
  useEffect(() => {
    if (styleRef.current) styleRef.current.textContent = previewCSS;
  }, [previewCSS]);

  /* ── Cleanup the copy-state timer on unmount ─────────────────────── */
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const updateConfig = useCallback(
    <K extends keyof ScrollbarConfig>(key: K, value: ScrollbarConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setConfig((prev) => ({ ...prev, ...preset.patch }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCSS]);

  const handleHexChange = useCallback(
    (key: keyof ScrollbarConfig, value: string) => {
      // Allow free typing; the color input's picker enforces hex format
      // and will commit a valid value via the same handler.
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ── Derived display values ──────────────────────────────────────── */
  const activePreset = useMemo<PresetKey>(() => {
    const found = PRESETS.find((p) => matchesPreset(config, p));
    return found ? found.key : "default";
  }, [config]);

  const ffThumbPreview = config.overrideFirefoxColor
    ? hexToOklch(config.firefoxColorOverride)
    : hexToOklch(config.thumbColor);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto max-w-2xl space-y-5"
    >
      {/* Hidden <style> — receives the live-preview CSS via ref. */}
      <style ref={styleRef} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ScrollText className="size-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight">
              CSS Scrollbar Styler
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Visual builder for{" "}
              <code className="font-mono text-foreground/70">
                ::-webkit-scrollbar
              </code>{" "}
              + Firefox{" "}
              <code className="font-mono text-foreground/70">
                scrollbar-width
              </code>
              . Live preview + cross-browser CSS.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Presets ──────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => {
            const active = activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Live preview ─────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Eye className="size-3.5 text-primary" />
            Live preview
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ArrowUpDown className="size-3" />
            Scroll the box →
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Preview scroller. The PREVIEW_SCOPE_CLASS carries the injected
              stylesheet so the real scrollbar styles render live. */}
          <div
            className={cn(
              PREVIEW_SCOPE_CLASS,
              "overflow-y-auto px-4 py-3 text-sm leading-relaxed text-card-foreground",
            )}
            style={{ height: PREVIEW_HEIGHT }}
          >
            <div className="space-y-3">
              {PREVIEW_LINES.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {line}
                </p>
              ))}
              <p className="border-t border-border/50 pt-3 text-xs italic text-muted-foreground">
                End of preview content — scroll back up to test the thumb
                hover state.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Width */}
        <ControlBlock
          label="Width"
          hint={`${config.width}px`}
        >
          <Slider
            value={[config.width]}
            min={4}
            max={24}
            step={1}
            onValueChange={(v) => updateConfig("width", v[0] ?? config.width)}
          />
        </ControlBlock>

        {/* Button visibility */}
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium">Buttons</Label>
            <Switch
              checked={config.showButtons}
              onCheckedChange={(v) => updateConfig("showButtons", v)}
              aria-label="Toggle scrollbar buttons"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Show or hide{" "}
            <code className="font-mono text-foreground/70">
              ::-webkit-scrollbar-button
            </code>
            .
          </p>
        </div>

        {/* Track color */}
        <ColorControl
          label="Track color"
          value={config.trackColor}
          onChange={(v) => handleHexChange("trackColor", v)}
        />

        {/* Track radius */}
        <ControlBlock label="Track radius" hint={`${config.trackRadius}px`}>
          <Slider
            value={[config.trackRadius]}
            min={0}
            max={12}
            step={1}
            onValueChange={(v) =>
              updateConfig("trackRadius", v[0] ?? config.trackRadius)
            }
          />
        </ControlBlock>

        {/* Thumb color */}
        <ColorControl
          label="Thumb color"
          value={config.thumbColor}
          onChange={(v) => handleHexChange("thumbColor", v)}
        />

        {/* Thumb radius */}
        <ControlBlock label="Thumb radius" hint={`${config.thumbRadius}px`}>
          <Slider
            value={[config.thumbRadius]}
            min={0}
            max={12}
            step={1}
            onValueChange={(v) =>
              updateConfig("thumbRadius", v[0] ?? config.thumbRadius)
            }
          />
        </ControlBlock>

        {/* Thumb hover color */}
        <ColorControl
          label="Thumb hover"
          value={config.thumbHoverColor}
          onChange={(v) => handleHexChange("thumbHoverColor", v)}
        />

        {/* Thumb border width + color */}
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Palette className="size-3.5 text-primary" />
            Thumb border
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {config.thumbBorderWidth}px
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <Slider
              value={[config.thumbBorderWidth]}
              min={0}
              max={4}
              step={1}
              onValueChange={(v) =>
                updateConfig("thumbBorderWidth", v[0] ?? config.thumbBorderWidth)
              }
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  config.thumbBorderColor.length >= 7
                    ? config.thumbBorderColor.slice(0, 7)
                    : "#000000"
                }
                onChange={(e) =>
                  handleHexChange("thumbBorderColor", e.target.value)
                }
                className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                aria-label="Thumb border color"
              />
              <input
                type="text"
                value={config.thumbBorderColor}
                onChange={(e) =>
                  handleHexChange("thumbBorderColor", e.target.value)
                }
                className="h-8 w-24 rounded-md border border-input bg-background px-2 font-mono text-xs uppercase"
                spellCheck={false}
                aria-label="Thumb border hex"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Set the border color to match the track for an inset thumb effect.
          </p>
        </div>

        {/* Firefox scrollbar-width */}
        <ControlBlock label="Firefox width" hint={config.firefoxWidth}>
          <Select
            value={config.firefoxWidth}
            onValueChange={(v) =>
              updateConfig("firefoxWidth", v as FirefoxWidth)
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIREFOX_WIDTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="font-mono">{opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlBlock>

        {/* Firefox scrollbar-color override */}
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium">FF color override</Label>
            <Switch
              checked={config.overrideFirefoxColor}
              onCheckedChange={(v) =>
                updateConfig("overrideFirefoxColor", v)
              }
              aria-label="Toggle Firefox scrollbar-color override"
            />
          </div>
          {config.overrideFirefoxColor ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  config.firefoxColorOverride.length >= 7
                    ? config.firefoxColorOverride.slice(0, 7)
                    : "#000000"
                }
                onChange={(e) =>
                  handleHexChange("firefoxColorOverride", e.target.value)
                }
                className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                aria-label="Firefox scrollbar-color override"
              />
              <input
                type="text"
                value={config.firefoxColorOverride}
                onChange={(e) =>
                  handleHexChange("firefoxColorOverride", e.target.value)
                }
                className="h-8 w-24 rounded-md border border-input bg-background px-2 font-mono text-xs uppercase"
                spellCheck={false}
                aria-label="Firefox scrollbar-color hex override"
              />
            </div>
          ) : (
            <p className="font-mono text-[11px] text-muted-foreground">
              {ffThumbPreview} <span className="opacity-60">·</span>{" "}
              <span className="text-foreground/70">auto-derived</span>
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            <code className="font-mono text-foreground/70">scrollbar-color</code>{" "}
            = thumb + track. Toggle to override the thumb side.
          </p>
        </div>
      </div>

      {/* ── Generated CSS ────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ScrollText className="size-3.5 text-primary" />
            Generated CSS
          </div>
          <Button
            type="button"
            size="sm"
            variant={copied ? "secondary" : "default"}
            onClick={handleCopy}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
          <code>{generatedCSS}</code>
        </pre>
      </div>

      {/* ── Browser support note ─────────────────────────────────── */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Browser support</p>
          <p>
            Custom scrollbars: Chrome / Safari / Edge via{" "}
            <code className="font-mono text-foreground/70">
              ::-webkit-scrollbar
            </code>
            . Firefox via{" "}
            <code className="font-mono text-foreground/70">
              scrollbar-width
            </code>{" "}
            /{" "}
            <code className="font-mono text-foreground/70">
              scrollbar-color
            </code>
            . IE / Edge Legacy via{" "}
            <code className="font-mono text-foreground/70">
              -ms-overflow-style
            </code>
            .
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Sub-components
// ============================================================

interface ControlBlockProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

/** A labelled control cell with a right-aligned hint value. */
function ControlBlock({ label, hint, children }: ControlBlockProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}</Label>
        {hint !== undefined && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** A labelled color input with a hex text field, suitable for any color. */
function ColorControl({ label, value, onChange }: ColorControlProps) {
  // The native color input only accepts #RRGGBB (no alpha). When the value
  // is a longer/shorter hex, fall back to a neutral swatch for the picker
  // while keeping the text field editable to the real value.
  const swatchValue =
    /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs uppercase"
          spellCheck={false}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
