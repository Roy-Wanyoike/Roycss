"use client";

import { useState, useMemo, useCallback } from "react";
import { SlidersHorizontal, Copy, Check, RotateCcw } from "lucide-react";

const FILTERS = [
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "px", default: 0 },
  { key: "brightness", label: "Brightness", min: 0, max: 2, step: 0.05, unit: "", default: 1 },
  { key: "contrast", label: "Contrast", min: 0, max: 2, step: 0.05, unit: "", default: 1 },
  { key: "grayscale", label: "Grayscale", min: 0, max: 1, step: 0.05, unit: "", default: 0 },
  { key: "hue-rotate", label: "Hue Rotate", min: 0, max: 360, step: 5, unit: "deg", default: 0 },
  { key: "invert", label: "Invert", min: 0, max: 1, step: 0.05, unit: "", default: 0 },
  { key: "saturate", label: "Saturate", min: 0, max: 3, step: 0.1, unit: "", default: 1 },
  { key: "sepia", label: "Sepia", min: 0, max: 1, step: 0.05, unit: "", default: 0 },
] as const;

const PRESETS = [
  { name: "None", values: {} },
  { name: "Vintage", values: { sepia: 0.5, contrast: 1.1, brightness: 0.9, saturate: 1.3 } },
  { name: "B&W", values: { grayscale: 1, contrast: 1.2 } },
  { name: "Cool", values: { "hue-rotate": 180, saturate: 1.2 } },
  { name: "Warm", values: { sepia: 0.3, "hue-rotate": 350, saturate: 1.3, brightness: 1.05 } },
  { name: "Dramatic", values: { contrast: 1.5, brightness: 0.9, saturate: 1.4 } },
  { name: "Dreamy", values: { blur: 1, brightness: 1.1, saturate: 1.2 } },
  { name: "Inverted", values: { invert: 1 } },
];

type FilterState = Record<string, number>;

export function FilterStudio() {
  const [values, setValues] = useState<FilterState>(
    Object.fromEntries(FILTERS.map(f => [f.key, f.default]))
  );
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    const parts = FILTERS
      .filter(f => values[f.key] !== f.default)
      .map(f => `${f.key}(${values[f.key]}${f.unit})`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }, [values]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(`filter: ${cssValue};`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [cssValue]);

  const update = (key: string, value: number) => setValues(prev => ({ ...prev, [key]: value }));

  const reset = () => setValues(Object.fromEntries(FILTERS.map(f => [f.key, f.default])));

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const newValues = Object.fromEntries(FILTERS.map(f => [f.key, f.default]));
    Object.entries(preset.values).forEach(([k, v]) => { (newValues as Record<string, number>)[k] = v; });
    setValues(newValues);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center h-32 rounded-xl bg-muted/30 border border-border/50">
        <div className="size-20 rounded-xl bg-gradient-to-br from-rose-400 via-amber-400 to-emerald-400" style={{ filter: cssValue }} />
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Presets</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)} className="px-2 py-1.5 rounded-lg border border-border/40 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer">{p.name}</button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-2.5">
        {FILTERS.map(f => (
          <div key={f.key}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <span className="text-xs font-mono text-primary">{values[f.key]}{f.unit}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={values[f.key]}
              onChange={(e) => update(f.key, parseFloat(e.target.value))}
              className="w-full cursor-pointer" />
          </div>
        ))}
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <div className="flex items-center gap-1">
            <button onClick={reset} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:text-foreground cursor-pointer"><RotateCcw className="size-3" /> Reset</button>
            <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>filter: {cssValue};</code></pre>
      </div>
    </div>
  );
}
