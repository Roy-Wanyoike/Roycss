"use client";

import { useState, useMemo, useCallback } from "react";
import { Rows3, Copy, Check, Plus, Minus } from "lucide-react";

const JUSTIFY_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Between" },
  { value: "space-around", label: "Around" },
  { value: "space-evenly", label: "Evenly" },
];

const ALIGN_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "baseline", label: "Baseline" },
];

const DIRECTION_OPTIONS = [
  { value: "row", label: "Row →" },
  { value: "row-reverse", label: "Row ←" },
  { value: "column", label: "Col ↓" },
  { value: "column-reverse", label: "Col ↑" },
];

const WRAP_OPTIONS = [
  { value: "nowrap", label: "No Wrap" },
  { value: "wrap", label: "Wrap" },
  { value: "wrap-reverse", label: "Wrap Reverse" },
];

const PRESETS = [
  { name: "Centered", direction: "row", justify: "center", align: "center", wrap: "nowrap" },
  { name: "Navbar", direction: "row", justify: "space-between", align: "center", wrap: "nowrap" },
  { name: "Stack", direction: "column", justify: "flex-start", align: "stretch", wrap: "nowrap" },
  { name: "Cards", direction: "row", justify: "flex-start", align: "stretch", wrap: "wrap" },
  { name: "Footer", direction: "row", justify: "space-evenly", align: "center", wrap: "nowrap" },
];

export function FlexboxVisualizer() {
  const [direction, setDirection] = useState("row");
  const [justify, setJustify] = useState("flex-start");
  const [align, setAlign] = useState("stretch");
  const [wrap, setWrap] = useState("nowrap");
  const [gap, setGap] = useState(8);
  const [itemCount, setItemCount] = useState(3);
  const [copied, setCopied] = useState(false);

  const css = useMemo(() => {
    return [
      `display: flex;`,
      `flex-direction: ${direction};`,
      `justify-content: ${justify};`,
      `align-items: ${align};`,
      `flex-wrap: ${wrap};`,
      `gap: ${gap}px;`,
    ].join("\n  ");
  }, [direction, justify, align, wrap, gap]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(`.flex-container {\n  ${css}\n}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [css]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setDirection(preset.direction);
    setJustify(preset.justify);
    setAlign(preset.align);
    setWrap(preset.wrap);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 min-h-[140px] flex items-center"
        style={{ display: "flex", flexDirection: direction, justifyContent: justify, alignItems: align, flexWrap: wrap, gap: `${gap}px` }}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center justify-center rounded-lg bg-primary/20 text-primary text-xs font-bold px-4 py-3 min-w-[40px] min-h-[40px]">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Presets</label>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)} className="px-2 py-1.5 rounded-lg border border-border/40 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer">{p.name}</button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Direction</label>
        <div className="flex flex-wrap gap-1">
          {DIRECTION_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setDirection(o.value)} className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${direction === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Justify + Align */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Justify Content</label>
          <div className="flex flex-wrap gap-1">
            {JUSTIFY_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setJustify(o.value)} className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${justify === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{o.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Align Items</label>
          <div className="flex flex-wrap gap-1">
            {ALIGN_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setAlign(o.value)} className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${align === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{o.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Wrap + Gap + Items */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Wrap</label>
          <select value={wrap} onChange={(e) => setWrap(e.target.value)} className="w-full h-8 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer">
            {WRAP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gap</label>
            <span className="text-xs font-mono text-primary">{gap}px</span>
          </div>
          <input type="range" min={0} max={48} value={gap} onChange={(e) => setGap(parseInt(e.target.value))} className="w-full cursor-pointer" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Items</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setItemCount(Math.max(1, itemCount - 1))} className="size-7 rounded-lg bg-muted text-muted-foreground hover:text-primary flex items-center justify-center cursor-pointer"><Minus className="size-3" /></button>
            <span className="text-sm font-mono w-6 text-center">{itemCount}</span>
            <button onClick={() => setItemCount(Math.min(12, itemCount + 1))} className="size-7 rounded-lg bg-muted text-muted-foreground hover:text-primary flex items-center justify-center cursor-pointer"><Plus className="size-3" /></button>
          </div>
        </div>
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>.flex-container {`{`}\n  {css}\n{`}`}</code></pre>
      </div>
    </div>
  );
}
