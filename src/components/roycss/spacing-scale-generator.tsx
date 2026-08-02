"use client";

import { useState, useMemo, useCallback } from "react";
import { Ruler, Copy, Check, Shuffle } from "lucide-react";

const SCALES = [
  { name: "Linear (4px)", base: 4, ratio: 1, formula: "n * 4px" },
  { name: "Linear (8px)", base: 8, ratio: 1, formula: "n * 8px" },
  { name: "Geometric 1.25", base: 4, ratio: 1.25, formula: "base * 1.25^n" },
  { name: "Geometric 1.333", base: 4, ratio: 1.333, formula: "base * 1.333^n" },
  { name: "Golden 1.618", base: 4, ratio: 1.618, formula: "base * 1.618^n" },
  { name: "Tailwind", base: 4, ratio: 0, formula: "Tailwind default scale" },
];

const TAILWIND_SCALE = [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];

export function SpacingScaleGenerator() {
  const [scaleIdx, setScaleIdx] = useState(1);
  const [steps, setSteps] = useState(12);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const values = useMemo(() => {
    const scale = SCALES[scaleIdx];
    if (scale.name === "Tailwind") {
      return TAILWIND_SCALE.slice(0, steps).map((v, i) => ({
        step: i,
        value: v,
        px: v,
        rem: v / 16,
      }));
    }
    const result: { step: number; value: number; px: number; rem: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const px = Math.round(scale.base * Math.pow(scale.ratio, i));
      result.push({ step: i, value: px, px, rem: px / 16 });
    }
    return result;
  }, [scaleIdx, steps]);

  const cssVars = useMemo(() => {
    return values.map(v => `  --space-${v.step}: ${v.px}px;`).join("\n");
  }, [values]);

  const handleCopy = useCallback(async (text: string, idx: number) => {
    try { await navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000); } catch {}
  }, []);

  const handleCopyAll = useCallback(async () => {
    try { await navigator.clipboard.writeText(`:root {\n${cssVars}\n}`); setCopiedIdx(-1); setTimeout(() => setCopiedIdx(null), 2000); } catch {}
  }, [cssVars]);

  return (
    <div className="space-y-4">
      {/* Scale selector */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Scale Type</label>
        <div className="grid grid-cols-3 gap-1.5">
          {SCALES.map((s, i) => (
            <button key={s.name} onClick={() => setScaleIdx(i)} className={`px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${scaleIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s.name}</button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</label>
        <input type="range" min={5} max={17} value={steps} onChange={(e) => setSteps(parseInt(e.target.value))} className="flex-1 cursor-pointer" />
        <span className="text-xs font-mono text-primary w-8">{steps}</span>
      </div>

      {/* Visual scale */}
      <div className="space-y-1">
        {values.map((v, idx) => (
          <button key={idx} onClick={() => handleCopy(`--space-${v.step}: ${v.px}px;`, idx)} className="w-full flex items-center gap-2 group cursor-pointer">
            <span className="text-xs font-mono text-muted-foreground w-12 text-right">--space-{v.step}</span>
            <div className="flex-1 h-6 rounded bg-muted/30 relative overflow-hidden">
              <div className="h-full bg-primary/40 rounded transition-all group-hover:bg-primary/60" style={{ width: `${Math.min(100, (v.px / values[values.length - 1].px) * 100)}%` }} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">{v.px}px ({v.rem}rem)</span>
            </div>
            {copiedIdx === idx ? <Check className="size-3.5 text-emerald-500 shrink-0" /> : <Copy className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />}
          </button>
        ))}
      </div>

      {/* Copy all */}
      <button onClick={handleCopyAll} className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${copiedIdx === -1 ? "bg-emerald-500/15 text-emerald-500" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
        {copiedIdx === -1 ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiedIdx === -1 ? "Copied!" : "Copy All as CSS Variables"}
      </button>

      {/* Preview */}
      <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
        <p className="text-[10px] text-muted-foreground mb-2">Preview (padding uses the scale):</p>
        <div className="flex flex-wrap gap-1">
          {values.slice(0, 6).map((v, i) => (
            <div key={i} className="bg-primary/15 rounded text-primary text-[10px] font-bold flex items-center justify-center" style={{ padding: `${v.px}px` }}>
              {v.step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
