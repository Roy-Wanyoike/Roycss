"use client";

import { useState, useMemo, useCallback } from "react";
import { Palette, Copy, Check, Shuffle, Plus, Minus } from "lucide-react";

interface PaletteColor {
  oklch: string;
  lightness: number;
  chroma: number;
  hue: number;
}

const HARMONIES = [
  { name: "Monochromatic", hues: [0] },
  { name: "Analogous", hues: [-30, 0, 30] },
  { name: "Complementary", hues: [0, 180] },
  { name: "Triadic", hues: [0, 120, 240] },
  { name: "Tetradic", hues: [0, 90, 180, 270] },
  { name: "Split-Complementary", hues: [0, 150, 210] },
];

function generatePalette(baseHue: number, harmony: typeof HARMONIES[0], count: number): PaletteColor[] {
  const colors: PaletteColor[] = [];
  const hueShifts = harmony.hues;
  for (let i = 0; i < count; i++) {
    const shiftIdx = i % hueShifts.length;
    const hue = (baseHue + hueShifts[shiftIdx] + 360) % 360;
    const lightness = 0.35 + (i / Math.max(count - 1, 1)) * 0.5; // 0.35 to 0.85
    const chroma = 0.15 + Math.random() * 0.1;
    colors.push({ oklch: `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${Math.round(hue)})`, lightness, chroma, hue });
  }
  return colors;
}

export function ColorPaletteGenerator() {
  const [baseHue, setBaseHue] = useState(162);
  const [harmonyIdx, setHarmonyIdx] = useState(2);
  const [count, setCount] = useState(5);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>(() => generatePalette(162, HARMONIES[2], 5));

  const regenerate = useCallback(() => {
    setPalette(generatePalette(baseHue, HARMONIES[harmonyIdx], count));
  }, [baseHue, harmonyIdx, count]);

  const handleCopy = useCallback(async (color: string, idx: number) => {
    try { await navigator.clipboard.writeText(color); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000); } catch {}
  }, []);

  return (
    <div className="space-y-4">
      {/* Palette display */}
      <div className="flex h-24 rounded-xl overflow-hidden border border-border/50">
        {palette.map((color, i) => (
          <button key={i} onClick={() => handleCopy(color.oklch, i)}
            className="flex-1 flex items-end justify-center p-2 transition-all hover:flex-[1.5] cursor-pointer group relative"
            style={{ background: color.oklch }}
            title={color.oklch}
          >
            <span className="text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: color.lightness > 0.6 ? "oklch(0.15 0.02 250)" : "oklch(0.98 0.01 250)" }}>
              {copiedIdx === i ? "Copied!" : `L${Math.round(color.lightness * 100)}`}
            </span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Base Hue: {baseHue}°
        </label>
        <input type="range" min={0} max={360} value={baseHue}
          onChange={(e) => { setBaseHue(parseInt(e.target.value)); }}
          onMouseUp={regenerate}
          className="w-full cursor-pointer" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Harmony</label>
        <div className="grid grid-cols-3 gap-1.5">
          {HARMONIES.map((h, i) => (
            <button key={h.name} onClick={() => { setHarmonyIdx(i); setPalette(generatePalette(baseHue, h, count)); }}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${harmonyIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {h.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Count</label>
        <div className="flex items-center gap-1">
          <button onClick={() => { const c = Math.max(2, count - 1); setCount(c); setPalette(generatePalette(baseHue, HARMONIES[harmonyIdx], c)); }} className="size-7 rounded-lg bg-muted text-muted-foreground hover:text-primary flex items-center justify-center cursor-pointer"><Minus className="size-3" /></button>
          <span className="text-sm font-mono w-8 text-center">{count}</span>
          <button onClick={() => { const c = Math.min(10, count + 1); setCount(c); setPalette(generatePalette(baseHue, HARMONIES[harmonyIdx], c)); }} className="size-7 rounded-lg bg-muted text-muted-foreground hover:text-primary flex items-center justify-center cursor-pointer"><Plus className="size-3" /></button>
        </div>
        <button onClick={regenerate} className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-medium cursor-pointer">
          <Shuffle className="size-3" /> Randomize
        </button>
      </div>

      {/* Color list */}
      <div className="space-y-1">
        {palette.map((color, i) => (
          <button key={i} onClick={() => handleCopy(color.oklch, i)}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer text-left">
            <div className="size-7 rounded-md border border-border/40 shrink-0" style={{ background: color.oklch }} />
            <code className="text-xs font-mono text-foreground/80 flex-1 truncate">{color.oklch}</code>
            {copiedIdx === i ? <Check className="size-3.5 text-emerald-500 shrink-0" /> : <Copy className="size-3.5 text-muted-foreground shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
