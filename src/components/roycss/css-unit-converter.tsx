"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Copy, Check, ArrowRight } from "lucide-react";

const UNITS = [
  { id: "px", label: "px", description: "Pixels (absolute)" },
  { id: "rem", label: "rem", description: "Root em (relative to html font-size)" },
  { id: "em", label: "em", description: "Em (relative to parent font-size)" },
  { id: "pt", label: "pt", description: "Points (1pt = 1/72 inch)" },
  { id: "vw", label: "vw", description: "Viewport width (1vw = 1% of viewport)" },
  { id: "vh", label: "vh", description: "Viewport height (1vh = 1% of viewport)" },
  { id: "vmin", label: "vmin", description: "Smaller of vw/vh" },
  { id: "vmax", label: "vmax", description: "Larger of vw/vh" },
  { id: "%", label: "%", description: "Percentage (relative to parent)" },
] as const;

// Base sizes for conversion
const PX_PER_REM = 16; // Default browser font-size
const PX_PER_PT = 96 / 72; // 1pt = 96/72 px
const VIEWPORT_WIDTH = 1920; // Default desktop width
const VIEWPORT_HEIGHT = 1080; // Default desktop height

function convert(value: number, from: string, to: string): number {
  // First convert to px
  let px: number;
  switch (from) {
    case "px": px = value; break;
    case "rem": px = value * PX_PER_REM; break;
    case "em": px = value * PX_PER_REM; break; // Assume same as rem for base
    case "pt": px = value * PX_PER_PT; break;
    case "vw": px = value * VIEWPORT_WIDTH / 100; break;
    case "vh": px = value * VIEWPORT_HEIGHT / 100; break;
    case "vmin": px = value * Math.min(VIEWPORT_WIDTH, VIEWPORT_HEIGHT) / 100; break;
    case "vmax": px = value * Math.max(VIEWPORT_WIDTH, VIEWPORT_HEIGHT) / 100; break;
    case "%": px = value * PX_PER_REM / 10; break; // Assume relative to 160px container
    default: px = value;
  }
  // Then convert from px to target
  switch (to) {
    case "px": return px;
    case "rem": return px / PX_PER_REM;
    case "em": return px / PX_PER_REM;
    case "pt": return px / PX_PER_PT;
    case "vw": return px * 100 / VIEWPORT_WIDTH;
    case "vh": return px * 100 / VIEWPORT_HEIGHT;
    case "vmin": return px * 100 / Math.min(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    case "vmax": return px * 100 / Math.max(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    case "%": return px * 10 / PX_PER_REM;
    default: return px;
  }
}

function formatValue(v: number): string {
  if (v === 0) return "0";
  if (Math.abs(v) < 0.01) return v.toExponential(2);
  if (Math.abs(v) < 1) return v.toFixed(4).replace(/\.?0+$/, "");
  if (Math.abs(v) < 100) return v.toFixed(2).replace(/\.?0+$/, "");
  return v.toFixed(0);
}

export function CSSUnitConverter() {
  const [value, setValue] = useState("16");
  const [fromUnit, setFromUnit] = useState("px");
  const [copiedTo, setCopiedTo] = useState<string | null>(null);

  const results = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return [];
    return UNITS.filter(u => u.id !== fromUnit).map(u => ({
      unit: u.id,
      label: u.label,
      value: convert(num, fromUnit, u.id),
      formatted: formatValue(convert(num, fromUnit, u.id)),
    }));
  }, [value, fromUnit]);

  const handleCopy = useCallback(async (unit: string, val: string) => {
    try {
      await navigator.clipboard.writeText(`${val}${unit}`);
      setCopiedTo(unit);
      setTimeout(() => setCopiedTo(null), 2000);
    } catch { /* noop */ }
  }, []);

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="16"
            className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-lg font-mono text-foreground focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">From</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="h-11 px-3 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-sm font-mono text-foreground focus:outline-none cursor-pointer"
          >
            {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {results.map(({ unit, label, formatted }) => (
          <button
            key={unit}
            onClick={() => handleCopy(unit, formatted)}
            className={`flex items-center justify-between gap-2 p-3 rounded-xl border transition-all cursor-pointer text-left ${copiedTo === unit ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/50 bg-card hover:border-primary/30"}`}
          >
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="font-mono text-lg font-bold text-foreground">{formatted}<span className="text-muted-foreground text-sm">{unit}</span></p>
            </div>
            {copiedTo === unit ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4 text-muted-foreground" />}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Conversions assume: 1rem = 16px, 1pt = 1.333px, viewport = 1920×1080.
          Click any result to copy <code className="font-mono">value+unit</code> to clipboard.
        </p>
      </div>
    </div>
  );
}
