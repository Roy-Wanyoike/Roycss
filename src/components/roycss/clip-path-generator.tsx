"use client";

import { useState, useMemo, useCallback } from "react";
import { Scissors, Copy, Check } from "lucide-react";

const SHAPES = [
  { name: "Circle", value: "circle(50% at 50% 50%)" },
  { name: "Ellipse", value: "ellipse(50% 40% at 50% 50%)" },
  { name: "Triangle", value: "polygon(50% 0%, 0% 100%, 100% 100%)" },
  { name: "Diamond", value: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { name: "Pentagon", value: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { name: "Hexagon", value: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" },
  { name: "Star", value: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
  { name: "Arrow", value: "polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)" },
  { name: "Message", value: "polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)" },
  { name: "Chevron", value: "polygon(75% 0%, 100% 50%, 75% 100%, 75% 55%, 0% 55%, 0% 45%, 75% 45%)" },
];

export function ClipPathGenerator() {
  const [clipPath, setClipPath] = useState(SHAPES[0].value);
  const [bgColor, setBgColor] = useState("#10b981");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(`clip-path: ${clipPath};`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [clipPath]);

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center h-40 rounded-xl bg-muted/30 border border-border/50">
        <div className="size-28 transition-all duration-200" style={{ background: bgColor, clipPath }} />
      </div>

      {/* Background color */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Shape color:</label>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="size-7 rounded border border-border/50 cursor-pointer" />
        <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono w-20" />
      </div>

      {/* Shape presets */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Shapes</label>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map(s => (
            <button key={s.name} onClick={() => setClipPath(s.value)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all cursor-pointer ${clipPath === s.value ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/30"}`}>
              <div className="size-8" style={{ background: bgColor, clipPath: s.value }} />
              <span className="text-[10px] text-muted-foreground">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom input */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Custom clip-path</label>
        <input type="text" value={clipPath} onChange={(e) => setClipPath(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-xs font-mono focus:outline-none" />
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>clip-path: {clipPath};</code></pre>
      </div>
    </div>
  );
}
