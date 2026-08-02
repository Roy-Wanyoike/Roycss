"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Copy, Check, Plus, Minus, Trash2, Layers } from "lucide-react";

interface ShadowLayer {
  id: string;
  x: number; y: number; blur: number; spread: number;
  color: string; inset: boolean;
}

let layerId = 0;
const makeLayer = (preset: Partial<ShadowLayer> = {}): ShadowLayer => ({
  id: `shadow-${layerId++}`,
  x: 0, y: 4, blur: 12, spread: 0,
  color: "oklch(0.15 0.02 250 / 0.15)",
  inset: false,
  ...preset,
});

const PRESETS = [
  { name: "Subtle", layers: [makeLayer({ y: 2, blur: 8, color: "oklch(0.15 0.02 250 / 0.08)" })] },
  { name: "Card", layers: [makeLayer({ y: 4, blur: 12, color: "oklch(0.15 0.02 250 / 0.12)" }), makeLayer({ y: 2, blur: 4, color: "oklch(0.15 0.02 250 / 0.08)" })] },
  { name: "Floating", layers: [makeLayer({ y: 8, blur: 24, color: "oklch(0.15 0.02 250 / 0.18)" })] },
  { name: "Glow", layers: [makeLayer({ x: 0, y: 0, blur: 20, spread: 2, color: "oklch(0.7 0.2 162 / 0.4)" })] },
  { name: "Neon", layers: [makeLayer({ x: 0, y: 0, blur: 10, color: "oklch(0.7 0.25 330 / 0.6)" }), makeLayer({ x: 0, y: 0, blur: 30, color: "oklch(0.7 0.25 330 / 0.3)" })] },
  { name: "Inset", layers: [makeLayer({ x: 0, y: 2, blur: 8, color: "oklch(0.15 0.02 250 / 0.15)", inset: true })] },
];

export function BoxShadowGenerator() {
  const [layers, setLayers] = useState<ShadowLayer[]>([makeLayer()]);
  const [copied, setCopied] = useState(false);
  const [bgColor, setBgColor] = useState("#1a1a2e");

  const cssValue = useMemo(() => {
    return layers.map(l => {
      const inset = l.inset ? "inset " : "";
      return `${inset}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`;
    }).join(", ");
  }, [layers]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(`box-shadow: ${cssValue};`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [cssValue]);

  const updateLayer = (id: string, field: keyof ShadowLayer, value: string | number | boolean) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addLayer = () => setLayers(prev => [...prev, makeLayer()]);
  const removeLayer = (id: string) => setLayers(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center h-32 rounded-xl border border-border/50" style={{ background: bgColor }}>
        <div className="size-20 rounded-xl bg-primary transition-all" style={{ boxShadow: cssValue }} />
      </div>

      {/* Background color */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Preview BG:</label>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="size-7 rounded border border-border/50 cursor-pointer" />
        <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono w-20" />
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => (
          <button key={p.name} onClick={() => setLayers(p.layers.map(l => ({ ...l, id: `shadow-${layerId++}` })))}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/40 hover:border-primary/40 transition-all cursor-pointer">
            <div className="size-8 rounded bg-card" style={{ boxShadow: p.layers.map(l => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`).join(", ") }} />
            <span className="text-[10px] text-muted-foreground">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Layers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Layers className="size-3" /> Layers ({layers.length})
          </span>
          <button onClick={addLayer} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer">
            <Plus className="size-3" /> Add Layer
          </button>
        </div>
        <div className="space-y-2">
          {layers.map((layer, i) => (
            <div key={layer.id} className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">Layer {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateLayer(layer.id, "inset", !layer.inset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${layer.inset ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    inset
                  </button>
                  <button onClick={() => removeLayer(layer.id)} disabled={layers.length <= 1} className="text-muted-foreground hover:text-rose-500 disabled:opacity-30 cursor-pointer">
                    <Minus className="size-3" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["x", "y", "blur", "spread"] as const).map(prop => (
                  <div key={prop}>
                    <label className="text-[9px] text-muted-foreground uppercase">{prop}</label>
                    <input type="number" value={layer[prop]} onChange={(e) => updateLayer(layer.id, prop, parseInt(e.target.value) || 0)}
                      className="w-full h-7 px-1.5 rounded bg-background border border-border/40 text-xs font-mono text-center focus:outline-none focus:border-primary/40" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value="#10b981" onChange={(e) => updateLayer(layer.id, "color", `oklch(0.7 0.2 ${Math.round(parseInt(e.target.value.slice(1, 3), 16) / 255 * 360)} / 0.4)`)}
                  className="size-7 rounded border border-border/40 cursor-pointer" />
                <input type="text" value={layer.color} onChange={(e) => updateLayer(layer.id, "color", e.target.value)}
                  className="flex-1 h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono focus:outline-none focus:border-primary/40" />
              </div>
            </div>
          ))}
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
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>box-shadow: {cssValue};</code></pre>
      </div>
    </div>
  );
}
