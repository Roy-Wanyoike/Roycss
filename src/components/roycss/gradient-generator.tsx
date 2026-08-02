"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Copy, Check, Shuffle, RotateCcw } from "lucide-react";

/**
 * CSSGradientGenerator — visual gradient builder with OKLCH colors.
 * Add/remove color stops, adjust angles, switch gradient types,
 * copy CSS code. Includes randomize and preset gradients.
 */

interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
}

const PRESETS = [
  { name: "Aurora", stops: [{ c: "oklch(0.7 0.2 200)", p: 0 }, { c: "oklch(0.6 0.25 280)", p: 50 }, { c: "oklch(0.65 0.2 330)", p: 100 }], angle: 135 },
  { name: "Sunset", stops: [{ c: "oklch(0.75 0.2 40)", p: 0 }, { c: "oklch(0.65 0.25 20)", p: 50 }, { c: "oklch(0.5 0.2 350)", p: 100 }], angle: 135 },
  { name: "Ocean", stops: [{ c: "oklch(0.6 0.15 220)", p: 0 }, { c: "oklch(0.5 0.2 250)", p: 100 }], angle: 180 },
  { name: "Forest", stops: [{ c: "oklch(0.5 0.15 150)", p: 0 }, { c: "oklch(0.4 0.1 160)", p: 100 }], angle: 135 },
  { name: "Neon", stops: [{ c: "oklch(0.7 0.25 300)", p: 0 }, { c: "oklch(0.65 0.25 200)", p: 100 }], angle: 45 },
  { name: "Fire", stops: [{ c: "oklch(0.6 0.25 30)", p: 0 }, { c: "oklch(0.65 0.2 60)", p: 50 }, { c: "oklch(0.8 0.15 90)", p: 100 }], angle: 0 },
];

const RANDOM_OKLCH = () => `oklch(${(0.4 + Math.random() * 0.4).toFixed(2)} ${(0.15 + Math.random() * 0.15).toFixed(2)} ${Math.round(Math.random() * 360)})`;

let stopIdCounter = 0;
const makeStop = (color: string, position: number): ColorStop => ({ id: `stop-${stopIdCounter++}`, color, position });

export function CSSGradientGenerator() {
  const [stops, setStops] = useState<ColorStop[]>([
    makeStop("oklch(0.7 0.2 200)", 0),
    makeStop("oklch(0.65 0.2 330)", 100),
  ]);
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<"linear" | "radial" | "conic">("linear");
  const [copied, setCopied] = useState(false);

  const gradientCss = useMemo(() => {
    const stopStr = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${s.position}%`)
      .join(", ");
    if (type === "linear") return `linear-gradient(${angle}deg, ${stopStr})`;
    if (type === "radial") return `radial-gradient(circle, ${stopStr})`;
    return `conic-gradient(from ${angle}deg, ${stopStr})`;
  }, [stops, angle, type]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`background: ${gradientCss};`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [gradientCss]);

  const addStop = () => {
    const positions = stops.map(s => s.position).sort((a, b) => a - b);
    let newPos = 50;
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i + 1] - positions[i];
      if (gap > 20) { newPos = positions[i] + Math.floor(gap / 2); break; }
    }
    setStops(prev => [...prev, makeStop(RANDOM_OKLCH(), newPos)]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(prev => prev.filter(s => s.id !== id));
  };

  const updateStop = (id: string, field: "color" | "position", value: string | number) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const randomize = () => {
    const count = 2 + Math.floor(Math.random() * 3);
    const newStops: ColorStop[] = [];
    for (let i = 0; i < count; i++) {
      newStops.push(makeStop(RANDOM_OKLCH(), Math.round((i / (count - 1)) * 100)));
    }
    setStops(newStops);
    setAngle(Math.round(Math.random() * 360));
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setStops(preset.stops.map(s => makeStop(s.c, s.p)));
    setAngle(preset.angle);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div
        className="h-32 rounded-xl border border-border/50 shadow-lg"
        style={{ background: gradientCss }}
      />

      {/* Type selector */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
        {(["linear", "radial", "conic"] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer capitalize ${type === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Angle (for linear and conic) */}
      {type !== "radial" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Angle</label>
            <span className="text-xs font-mono text-primary">{angle}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))}
            className="w-full cursor-pointer"
          />
        </div>
      )}

      {/* Color stops */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color Stops ({stops.length})</label>
          <div className="flex items-center gap-1">
            <button onClick={randomize} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer" title="Randomize">
              <Shuffle className="size-3" /> Random
            </button>
            <button onClick={addStop} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer">
              <Plus className="size-3" /> Add Stop
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          {stops
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(stop => (
              <div key={stop.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <input
                  type="color"
                  value={"#10b981"} // Fallback for color picker (OKLCH not supported natively)
                  onChange={(e) => updateStop(stop.id, "color", `oklch(${(0.3 + parseInt(e.target.value.slice(1, 3), 16) / 255 * 0.5).toFixed(2)} 0.2 ${Math.round(parseInt(e.target.value.slice(1, 3), 16) / 255 * 360)})`)}
                  className="size-8 rounded border border-border/50 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                  className="flex-1 h-8 px-2 rounded bg-background border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:border-primary/40"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(stop.id, "position", Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-14 h-8 px-2 rounded bg-background border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:border-primary/40"
                />
                <span className="text-xs text-muted-foreground">%</span>
                <button onClick={() => removeStop(stop.id)} disabled={stops.length <= 2} className="flex items-center justify-center size-7 rounded text-muted-foreground hover:text-rose-500 disabled:opacity-30 transition-all cursor-pointer">
                  <Minus className="size-3.5" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg border border-border/40 hover:border-primary/40 transition-all cursor-pointer"
            >
              <div
                className="w-full h-8 rounded"
                style={{ background: `${preset.type || "linear"}-gradient(${preset.angle}deg, ${preset.stops.map(s => `${s.c} ${s.p}%`).join(", ")})` }}
              />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied!" : "Copy CSS"}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin">
          <code>background: {gradientCss};</code>
        </pre>
      </div>
    </div>
  );
}
