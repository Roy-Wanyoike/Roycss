"use client";

import { useState, useMemo, useCallback } from "react";
import { Paintbrush, Copy, Check, Shuffle } from "lucide-react";

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
}

function rgbToOklch(r: number, g: number, b: number): string {
  // Simplified sRGB → OKLCH (approximate)
  const norm = [r, g, b].map(c => c / 255);
  const [R, G, B] = norm.map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const X = 0.4124 * R + 0.3576 * G + 0.1805 * B;
  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = 0.0193 * R + 0.1192 * G + 0.9505 * B;
  const L = Math.cbrt(0.8189 * X + 0.3619 * Y - 0.1286 * Z);
  const M = Math.cbrt(0.0339 * X + 0.9289 * Y + 0.0373 * Z);
  const S = Math.cbrt(0.0489 * X + 0.0260 * Y + 0.9125 * Z);
  const okL = 0.2104 * L + 0.5801 * M + 0.0946 * S;
  const okA = 1.5999 * L - 1.4269 * M + 0.2628 * S;
  const okB = 0.3998 * L + 0.1465 * M - 0.5195 * S;
  const okC = Math.sqrt(okA * okA + okB * okB);
  const okH = okB === 0 && okA === 0 ? 0 : Math.atan2(okB, okA) * 180 / Math.PI;
  const hue = okH < 0 ? okH + 360 : okH;
  return `oklch(${okL.toFixed(3)} ${okC.toFixed(3)} ${hue.toFixed(1)})`;
}

export function ColorShadeGenerator() {
  const [baseColor, setBaseColor] = useState("#10b981");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [format, setFormat] = useState<"hex" | "oklch">("hex");

  const shades = useMemo(() => {
    const [r, g, b] = hexToRgb(baseColor);
    const steps = [
      { label: "50", factor: 0.95 }, { label: "100", factor: 0.90 },
      { label: "200", factor: 0.75 }, { label: "300", factor: 0.60 },
      { label: "400", factor: 0.80 }, { label: "500", factor: 1.0 },
      { label: "600", factor: 0.85 }, { label: "700", factor: 0.70 },
      { label: "800", factor: 0.55 }, { label: "900", factor: 0.40 },
    ];
    return steps.map(s => {
      const isLight = parseInt(s.label) < 500;
      const mixFactor = isLight ? (1 - s.factor) : (1 - s.factor);
      const white = isLight;
      const nr = white ? r + (255 - r) * mixFactor : r * s.factor;
      const ng = white ? g + (255 - g) * mixFactor : g * s.factor;
      const nb = white ? b + (255 - b) * mixFactor : b * s.factor;
      const hex = rgbToHex(nr, ng, nb);
      const oklch = rgbToOklch(nr, ng, nb);
      return { label: s.label, hex, oklch, lightness: (nr + ng + nb) / 3 / 255 };
    });
  }, [baseColor]);

  const handleCopy = useCallback(async (value: string, idx: number) => {
    try { await navigator.clipboard.writeText(value); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000); } catch {}
  }, []);

  const randomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const sat = 50 + Math.floor(Math.random() * 30);
    const light = 40 + Math.floor(Math.random() * 20);
    // HSL to hex
    const h = hue / 360, s = sat / 100, l = light / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    setBaseColor(rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255));
  };

  return (
    <div className="space-y-4">
      {/* Base color */}
      <div className="flex items-center gap-2">
        <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="size-10 rounded-lg border border-border/50 cursor-pointer" />
        <input type="text" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="flex-1 h-10 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm font-mono focus:outline-none" />
        <button onClick={randomColor} className="flex items-center justify-center size-10 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer"><Shuffle className="size-4" /></button>
      </div>

      {/* Format toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["hex", "oklch"] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${format === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{f.toUpperCase()}</button>
        ))}
      </div>

      {/* Shades grid */}
      <div className="grid grid-cols-2 gap-2">
        {shades.map((shade, idx) => {
          const value = format === "hex" ? shade.hex : shade.oklch;
          const textColor = shade.lightness > 0.6 ? "oklch(0.15 0.02 250)" : "oklch(0.98 0.01 250)";
          return (
            <button key={shade.label} onClick={() => handleCopy(value, idx)}
              className="flex items-center justify-between gap-2 p-3 rounded-lg transition-all cursor-pointer group relative overflow-hidden"
              style={{ background: shade.hex }}>
              <div className="min-w-0 flex-1 z-10">
                <p className="text-xs font-bold" style={{ color: textColor }}>{shade.label}</p>
                <p className="text-[10px] font-mono truncate" style={{ color: textColor, opacity: 0.8 }}>
                  {format === "hex" ? shade.hex : shade.oklch.length > 24 ? shade.oklch.substring(0, 22) + "…" : shade.oklch}
                </p>
              </div>
              {copiedIdx === idx ? (
                <Check className="size-4 shrink-0 z-10" style={{ color: textColor }} />
              ) : (
                <Copy className="size-3.5 shrink-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textColor }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <p className="text-[11px] text-muted-foreground text-center">
        Click any shade to copy its {format.toUpperCase()} value. 10 shades from 50 (lightest) to 900 (darkest).
      </p>
    </div>
  );
}
