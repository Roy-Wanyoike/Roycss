"use client";

import { useState, useMemo } from "react";
import { Monitor, Smartphone, Tablet, RefreshCw } from "lucide-react";

const BREAKPOINTS = [
  { name: "iPhone SE", width: 375, height: 667, icon: Smartphone },
  { name: "iPhone 14", width: 390, height: 844, icon: Smartphone },
  { name: "iPad Mini", width: 768, height: 1024, icon: Tablet },
  { name: "iPad Pro", width: 1024, height: 1366, icon: Tablet },
  { name: "Laptop", width: 1280, height: 800, icon: Monitor },
  { name: "Desktop", width: 1920, height: 1080, icon: Monitor },
];

export function ResponsivePreview() {
  const [selected, setSelected] = useState(BREAKPOINTS[0]);
  const [url, setUrl] = useState("https://roycss.com");

  const scale = useMemo(() => {
    const maxW = 500;
    const maxH = 400;
    const scaleW = maxW / selected.width;
    const scaleH = maxH / selected.height;
    return Math.min(scaleW, scaleH, 1);
  }, [selected]);

  return (
    <div className="space-y-4">
      {/* URL input */}
      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
        className="w-full h-10 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm focus:outline-none" />

      {/* Breakpoint selector */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Device</label>
        <div className="grid grid-cols-3 gap-1.5">
          {BREAKPOINTS.map(bp => {
            const Icon = bp.icon;
            return (
              <button key={bp.name} onClick={() => setSelected(bp)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all cursor-pointer ${selected.name === bp.name ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/30"}`}>
                <Icon className={`size-4 ${selected.name === bp.name ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-[10px] text-muted-foreground">{bp.name}</span>
                <span className="text-[9px] text-muted-foreground/60">{bp.width}×{bp.height}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex items-center justify-center min-h-[300px] rounded-xl bg-muted/20 border border-border/50 p-4">
        <div className="relative" style={{ width: selected.width * scale, height: selected.height * scale }}>
          <div
            className="absolute top-0 left-0 origin-top-left rounded-lg overflow-hidden border-2 border-border/60 shadow-lg bg-white"
            style={{ width: selected.width, height: selected.height, transform: `scale(${scale})` }}
          >
            <iframe
              src={url}
              title={`Preview at ${selected.width}px`}
              className="w-full h-full border-0"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Viewing at <span className="font-mono text-primary">{selected.width}×{selected.height}</span>
          {scale < 1 && <span className="ml-1">({Math.round(scale * 100)}% scale)</span>}
        </span>
        <span className="text-muted-foreground">
          Aspect: <span className="font-mono">{(selected.width / selected.height).toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}
