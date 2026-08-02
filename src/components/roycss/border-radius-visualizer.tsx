"use client";

import { useState, useMemo, useCallback } from "react";
import { Copy, Check, RotateCcw, Unlink, Link } from "lucide-react";

/**
 * BorderRadiusVisualizer — interactive border-radius editor.
 * Drag 4 sliders (or 8 for individual corners) to visually adjust
 * border-radius. Generates CSS with individual corners or shorthand.
 * Includes presets (circle, pill, card, squircle).
 */

interface RadiusState {
  tl: number; tr: number; br: number; bl: number;
}

const PRESETS: { name: string; value: RadiusState; label: string }[] = [
  { name: "None", value: { tl: 0, tr: 0, br: 0, bl: 0 }, label: "0" },
  { name: "Subtle", value: { tl: 4, tr: 4, br: 4, bl: 4 }, label: "4px" },
  { name: "Card", value: { tl: 12, tr: 12, br: 12, bl: 12 }, label: "12px" },
  { name: "Rounded", value: { tl: 24, tr: 24, br: 24, bl: 24 }, label: "24px" },
  { name: "Pill", value: { tl: 50, tr: 50, br: 50, bl: 50 }, label: "50%" },
  { name: "Circle", value: { tl: 999, tr: 999, br: 999, bl: 999 }, label: "9999px" },
  { name: "Blob", value: { tl: 60, tr: 30, br: 70, bl: 40 }, label: "Organic" },
  { name: "Leaf", value: { tl: 0, tr: 50, br: 0, bl: 50 }, label: "Leaf" },
];

const CORNER_LABELS: { key: keyof RadiusState; label: string }[] = [
  { key: "tl", label: "Top-Left" },
  { key: "tr", label: "Top-Right" },
  { key: "br", label: "Bottom-Right" },
  { key: "bl", label: "Bottom-Left" },
];

export function BorderRadiusVisualizer() {
  const [radius, setRadius] = useState<RadiusState>({ tl: 12, tr: 12, br: 12, bl: 12 });
  const [linked, setLinked] = useState(true);
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    const { tl, tr, br, bl } = radius;
    const fmt = (v: number) => v >= 999 ? "9999px" : v === 0 ? "0" : `${v}px`;
    if (tl === tr && tr === br && br === bl) return fmt(tl);
    if (tl === br && tr === bl) return `${fmt(tl)} ${fmt(tr)}`;
    return `${fmt(tl)} ${fmt(tr)} ${fmt(br)} ${fmt(bl)}`;
  }, [radius]);

  const handleSlider = (key: keyof RadiusState, value: number) => {
    if (linked) {
      setRadius({ tl: value, tr: value, br: value, bl: value });
    } else {
      setRadius(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`border-radius: ${cssValue};`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [cssValue]);

  return (
    <div className="space-y-4">
      {/* Visual preview */}
      <div className="flex items-center justify-center h-32 rounded-xl bg-muted/30 border border-border/50">
        <div
          className="size-24 bg-primary shadow-lg transition-all duration-200"
          style={{ borderRadius: radius.tl >= 999 ? "9999px" : `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` }}
        />
      </div>

      {/* Link toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corner Radius</label>
        <button
          onClick={() => setLinked(!linked)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${linked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          title={linked ? "All corners linked" : "Corners independent"}
        >
          {linked ? <Link className="size-3" /> : <Unlink className="size-3" />}
          {linked ? "Linked" : "Individual"}
        </button>
      </div>

      {/* Sliders */}
      {linked ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">All corners</span>
            <span className="text-xs font-mono text-primary">{radius.tl >= 999 ? "9999px" : `${radius.tl}px`}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.min(radius.tl, 100)}
            onChange={(e) => handleSlider("tl", parseInt(e.target.value))}
            className="w-full cursor-pointer"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {CORNER_LABELS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono text-primary">{radius[key] >= 999 ? "∞" : `${radius[key]}px`}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.min(radius[key], 100)}
                onChange={(e) => handleSlider(key, parseInt(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Presets</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => setRadius(preset.value)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/40 hover:border-primary/40 transition-all cursor-pointer"
            >
              <div
                className="size-6 bg-primary/60"
                style={{ borderRadius: preset.value.tl >= 999 ? "9999px" : `${preset.value.tl}px ${preset.value.tr}px ${preset.value.br}px ${preset.value.bl}px` }}
              />
              <span className="text-[9px] text-muted-foreground">{preset.name}</span>
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
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin">
          <code>border-radius: {cssValue};</code>
        </pre>
      </div>
    </div>
  );
}
