"use client";

import { useState, useMemo, useCallback } from "react";
import { Move3d, Copy, Check, RotateCcw } from "lucide-react";

interface TransformState {
  rotateX: number; rotateY: number; rotateZ: number;
  scaleX: number; scaleY: number; scaleZ: number;
  translateX: number; translateY: number; translateZ: number;
  skewX: number; skewY: number;
  perspective: number;
}

const DEFAULT: TransformState = {
  rotateX: 0, rotateY: 0, rotateZ: 0,
  scaleX: 1, scaleY: 1, scaleZ: 1,
  translateX: 0, translateY: 0, translateZ: 0,
  skewX: 0, skewY: 0,
  perspective: 800,
};

const PRESETS: { name: string; value: TransformState }[] = [
  { name: "None", value: DEFAULT },
  { name: "Tilt", value: { ...DEFAULT, rotateX: 15, rotateY: -15, perspective: 600 } },
  { name: "Flip", value: { ...DEFAULT, rotateY: 180 } },
  { name: "Scale Up", value: { ...DEFAULT, scaleX: 1.5, scaleY: 1.5 } },
  { name: "Skew", value: { ...DEFAULT, skewX: 15, skewY: 5 } },
  { name: "3D Card", value: { ...DEFAULT, rotateX: 25, rotateY: -20, translateZ: 30, perspective: 500 } },
];

export function TransformStudio() {
  const [transform, setTransform] = useState<TransformState>(DEFAULT);
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    const parts: string[] = [];
    if (transform.perspective !== 0) parts.push(`perspective(${transform.perspective}px)`);
    if (transform.translateX || transform.translateY || transform.translateZ) {
      parts.push(`translate3d(${transform.translateX}px, ${transform.translateY}px, ${transform.translateZ}px)`);
    }
    if (transform.rotateX) parts.push(`rotateX(${transform.rotateX}deg)`);
    if (transform.rotateY) parts.push(`rotateY(${transform.rotateY}deg)`);
    if (transform.rotateZ) parts.push(`rotateZ(${transform.rotateZ}deg)`);
    if (transform.scaleX !== 1 || transform.scaleY !== 1 || transform.scaleZ !== 1) {
      parts.push(`scale3d(${transform.scaleX}, ${transform.scaleY}, ${transform.scaleZ})`);
    }
    if (transform.skewX || transform.skewY) parts.push(`skew(${transform.skewX}deg, ${transform.skewY}deg)`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }, [transform]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(`transform: ${cssValue};`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [cssValue]);

  const update = (key: keyof TransformState, value: number) => setTransform(prev => ({ ...prev, [key]: value }));

  const sliders: { key: keyof TransformState; label: string; min: number; max: number; step: number; unit: string }[] = [
    { key: "perspective", label: "Perspective", min: 0, max: 2000, step: 50, unit: "px" },
    { key: "translateX", label: "Translate X", min: -200, max: 200, step: 1, unit: "px" },
    { key: "translateY", label: "Translate Y", min: -200, max: 200, step: 1, unit: "px" },
    { key: "translateZ", label: "Translate Z", min: -200, max: 200, step: 1, unit: "px" },
    { key: "rotateX", label: "Rotate X", min: -180, max: 180, step: 1, unit: "°" },
    { key: "rotateY", label: "Rotate Y", min: -180, max: 180, step: 1, unit: "°" },
    { key: "rotateZ", label: "Rotate Z", min: -180, max: 180, step: 1, unit: "°" },
    { key: "scaleX", label: "Scale X", min: 0, max: 3, step: 0.05, unit: "x" },
    { key: "scaleY", label: "Scale Y", min: 0, max: 3, step: 0.05, unit: "x" },
    { key: "skewX", label: "Skew X", min: -45, max: 45, step: 1, unit: "°" },
    { key: "skewY", label: "Skew Y", min: -45, max: 45, step: 1, unit: "°" },
  ];

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center h-40 rounded-xl bg-muted/30 border border-border/50" style={{ perspective: "1000px" }}>
        <div
          className="size-24 rounded-xl bg-primary shadow-lg transition-all duration-150"
          style={{
            transform: cssValue,
            transformStyle: "preserve-3d",
          }}
        >
          <div className="flex items-center justify-center h-full text-primary-foreground font-bold text-xs">3D</div>
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => (
          <button key={p.name} onClick={() => setTransform(p.value)}
            className="px-2 py-1.5 rounded-lg border border-border/40 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer">
            {p.name}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sliders.map(({ key, label, min, max, step, unit }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-mono text-primary">{transform[key]}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={transform[key]}
              onChange={(e) => update(key, parseFloat(e.target.value))}
              className="w-full cursor-pointer" />
          </div>
        ))}
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setTransform(DEFAULT)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
              <RotateCcw className="size-3" /> Reset
            </button>
            <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>transform: {cssValue};</code></pre>
      </div>
    </div>
  );
}
