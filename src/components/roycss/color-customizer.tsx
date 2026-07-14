"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, Copy, RotateCcw, Palette, Eye } from "lucide-react";

/* ─── Color palette presets ────────────────────────────────── */
export interface ColorPreset {
  id: string;
  name: string;
  /** Hue in degrees (0-360) used for OKLCH rotation. */
  hue: number;
  /** CSS hex value used for the swatch & native color picker. */
  hex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "emerald", name: "Emerald", hue: 162.48, hex: "#10b981" },
  { id: "blue",    name: "Blue",    hue: 244.0,  hex: "#3b82f6" },
  { id: "violet",  name: "Violet",  hue: 295.0,  hex: "#8b5cf6" },
  { id: "rose",    name: "Rose",    hue: 12.0,   hex: "#f43f5e" },
  { id: "amber",   name: "Amber",   hue: 75.0,   hex: "#f59e0b" },
  { id: "cyan",    name: "Cyan",    hue: 205.0,  hex: "#06b6d4" },
  { id: "orange",  name: "Orange",  hue: 55.0,   hex: "#f97316" },
  { id: "pink",    name: "Pink",    hue: 350.0,  hex: "#ec4899" },
  { id: "lime",    name: "Lime",    hue: 130.0,  hex: "#84cc16" },
  { id: "red",     name: "Red",     hue: 25.0,   hex: "#ef4444" },
  { id: "indigo",  name: "Indigo",  hue: 268.0,  hex: "#6366f1" },
  { id: "teal",    name: "Teal",    hue: 178.0,  hex: "#14b8a6" },
];

/* Source hue used as the baseline for rotation (matches the RoyCSS emerald). */
const SOURCE_HUE = 162.48;

/* ─── Hex helpers ──────────────────────────────────────────── */

/**
 * Returns true if `value` is a valid 3- or 6-digit hex color (with or without #).
 */
export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

/**
 * Normalizes a hex string to a 7-character `#RRGGBB` form.
 * Returns `null` if the input is not a valid hex color.
 */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!isValidHex(trimmed)) return null;
  const withoutHash = trimmed.replace(/^#/, "");
  if (withoutHash.length === 3) {
    const expanded = withoutHash
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return `#${withoutHash.toLowerCase()}`;
}

/* ─── OKLCH recoloring ─────────────────────────────────────── */

/**
 * Rotates every `oklch(L C H)` value found inside `css` so the source hue
 * (emerald, 162.48°) is shifted to the target `hue`. Lightness and chroma are
 * preserved. This lets users instantly recolor any RoyCSS effect.
 *
 * Example: `oklch(0.69 0.17 162.48)` with targetHue=244 becomes
 *          `oklch(0.69 0.17 244)`.
 */
export function applyColorToCSS(
  css: string,
  targetHue: number,
  sourceHue: number = SOURCE_HUE,
): string {
  const rotation = targetHue - sourceHue;
  // Match: oklch(L C H) where L, C, H are numbers (int, decimal, percentage,
  // or `none`). Also tolerates optional `none` keyword for missing channels.
  const oklchRe = /oklch\(\s*([^)\s]+)\s+([^)\s]+)\s+([^)\s]+)\s*\)/gi;

  return css.replace(oklchRe, (_match, lStr, cStr, hStr) => {
    const l = String(lStr).trim();
    const c = String(cStr).trim();
    const hRaw = String(hStr).trim();

    // Hue is the 3rd channel. If it's `none` or unparsable, leave it alone.
    const hNum = Number.parseFloat(hRaw);
    if (Number.isNaN(hNum) || hRaw.toLowerCase() === "none") {
      return `oklch(${l} ${c} ${hRaw})`;
    }

    let newHue = (hNum + rotation) % 360;
    if (newHue < 0) newHue += 360;
    // Round to 2 decimals to keep CSS compact.
    const hueOut = Math.round(newHue * 100) / 100;
    return `oklch(${l} ${c} ${hueOut})`;
  });
}

/* ─── Tiny inline copy button ──────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy recolored CSS"
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
        copied
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      {copied ? "Copied" : "Copy CSS"}
    </button>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export function ColorCustomizer({
  cssCode,
  onApply,
}: {
  cssCode: string;
  /** Optional callback invoked with the recolored CSS whenever it changes. */
  onApply?: (recoloredCss: string) => void;
}) {
  // Default to Emerald (the source hue) — no rotation by default.
  const [activePresetId, setActivePresetId] = useState<string>("emerald");
  const [hexInput, setHexInput] = useState<string>("#10b981");
  const [error, setError] = useState<string | null>(null);

  // Look up the active preset's hue, falling back to the hex-derived hue.
  const activePreset = COLOR_PRESETS.find((p) => p.id === activePresetId);

  // Approximate hue from the hex input for the active color indicator.
  const hexHue = useMemo(() => {
    const normalized = normalizeHex(hexInput);
    if (!normalized) return SOURCE_HUE;
    return hexToHue(normalized);
  }, [hexInput]);

  // The "target hue" used for OKLCH rotation:
  // - If a preset is selected, use its hue.
  // - If the user typed a custom hex, derive the hue from the hex.
  const targetHue = activePreset ? activePreset.hue : hexHue;

  const recoloredCss = useMemo(
    () => applyColorToCSS(cssCode, targetHue),
    [cssCode, targetHue],
  );

  useEffect(() => {
    if (onApply) onApply(recoloredCss);
  }, [recoloredCss, onApply]);

  const handlePresetClick = (preset: ColorPreset) => {
    setActivePresetId(preset.id);
    setHexInput(preset.hex);
    setError(null);
  };

  const handleHexChange = (raw: string) => {
    setHexInput(raw);
    if (raw.trim() === "") {
      setError(null);
      return;
    }
    if (isValidHex(raw)) {
      const normalized = normalizeHex(raw);
      if (normalized) {
        setError(null);
        // Switching to a custom color deselects any preset.
        const matchedPreset = COLOR_PRESETS.find(
          (p) => p.hex.toLowerCase() === normalized.toLowerCase(),
        );
        setActivePresetId(matchedPreset ? matchedPreset.id : "custom");
      }
    } else {
      setError("Enter a valid hex like #10b981 or 10b981.");
    }
  };

  const handleNativePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    setError(null);
    const matchedPreset = COLOR_PRESETS.find(
      (p) => p.hex.toLowerCase() === value.toLowerCase(),
    );
    setActivePresetId(matchedPreset ? matchedPreset.id : "custom");
  };

  const handleReset = () => {
    setActivePresetId("emerald");
    setHexInput("#10b981");
    setError(null);
  };

  const activeSwatchColor = normalizeHex(hexInput) ?? "#10b981";

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Palette className="size-3.5 text-primary" />
        Customize Color
      </h4>

      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        Pick a preset or paste any hex code. RoyCSS rotates every OKLCH hue from
        emerald (162.48°) to your target — instantly recoloring the whole effect.
      </p>

      {/* Preset swatches */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 mb-3">
        {COLOR_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              title={preset.name}
              aria-label={`Apply ${preset.name} color`}
              aria-pressed={isActive}
              className={`relative aspect-square rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-105"
                  : "hover:scale-105 ring-1 ring-border/60"
              }`}
              style={{ backgroundColor: preset.hex }}
            >
              {isActive && (
                <Check className="absolute inset-0 m-auto size-3 text-white drop-shadow" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hex input + native picker + reset */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label
          htmlFor="roy-hex-input"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 flex-1 min-w-[12rem]"
        >
          <span className="text-[10px] font-mono text-muted-foreground">#</span>
          <input
            id="roy-hex-input"
            type="text"
            value={hexInput.replace(/^#/, "")}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="10b981"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent text-xs font-mono text-foreground focus:outline-none"
          />
        </label>

        {/* Native HTML5 color picker (hidden input + visible swatch) */}
        <label
          className="relative size-8 rounded-lg border border-border/60 cursor-pointer overflow-hidden flex items-center justify-center"
          title="Open color picker"
          aria-label="Open native color picker"
          style={{ backgroundColor: activeSwatchColor }}
        >
          <Eye className="size-3.5 text-white drop-shadow pointer-events-none" />
          <input
            type="color"
            value={activeSwatchColor}
            onChange={handleNativePicker}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <RotateCcw className="size-3" />
          Reset
        </button>
      </div>

      {/* Active color indicator + copy */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-4 rounded-md ring-1 ring-border/60 shrink-0"
            style={{ backgroundColor: activeSwatchColor }}
          />
          <span className="text-[11px] font-mono text-muted-foreground truncate">
            {activePreset ? activePreset.name : "Custom"} · hue{" "}
            {Math.round(targetHue)}° · {normalizeHex(hexInput) ?? "—"}
          </span>
        </div>
        <CopyButton text={recoloredCss} />
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 mb-2" role="alert">
          {error}
        </p>
      )}

      {/* Preview of the recolored CSS (truncated) */}
      <pre className="p-2.5 rounded-lg bg-muted/50 border border-border/40 text-[10px] leading-relaxed font-mono text-foreground/80 overflow-x-auto scrollbar-thin max-h-32 overflow-y-auto">
        <code className="whitespace-pre">
          {recoloredCss.length > 600
            ? `${recoloredCss.slice(0, 600)}\n/* …${recoloredCss.length - 600} more chars */`
            : recoloredCss}
        </code>
      </pre>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

/**
 * Approximates the OKLCH hue for a given hex color using a simple RGB-to-HSL
 * conversion. Good enough for a live indicator — the actual recoloring uses
 * the exact preset hues (which are tuned to look great in OKLCH).
 */
function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d === 0) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / d) % 6;
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}
