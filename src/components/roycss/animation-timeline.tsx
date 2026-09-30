"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Film, Copy, Check, Plus, Minus, Play, Pause, RotateCcw } from "lucide-react";
import {
  copyTextToClipboard,
  selectElementText,
  CLIPBOARD_FAILED_MESSAGE,
  CLIPBOARD_FAILED_RESET_MS,
} from "@/lib/clipboard";

interface Keyframe {
  id: string;
  offset: number; // 0-100
  properties: { transform: string; opacity: string };
}

let kfId = 0;
const makeKf = (offset: number, transform = "", opacity = "1"): Keyframe => ({
  id: `kf-${kfId++}`, offset, properties: { transform, opacity },
});

const PRESETS = [
  { name: "Fade In", frames: [makeKf(0, "", "0"), makeKf(100, "", "1")] },
  { name: "Slide Up", frames: [makeKf(0, "translateY(30px)", "0"), makeKf(100, "translateY(0)", "1")] },
  { name: "Bounce", frames: [makeKf(0, "translateY(0)", "1"), makeKf(50, "translateY(-30px)", "1"), makeKf(100, "translateY(0)", "1")] },
  { name: "Scale In", frames: [makeKf(0, "scale(0.5)", "0"), makeKf(100, "scale(1)", "1")] },
  { name: "Rotate", frames: [makeKf(0, "rotate(0deg)", "1"), makeKf(100, "rotate(360deg)", "1")] },
  { name: "Pulse", frames: [makeKf(0, "scale(1)", "1"), makeKf(50, "scale(1.1)", "0.8"), makeKf(100, "scale(1)", "1")] },
];

export function AnimationTimeline() {
  const [frames, setFrames] = useState<Keyframe[]>(PRESETS[1].frames);
  const [duration, setDuration] = useState(1);
  const [easing, setEasing] = useState("ease-in-out");
  const [iteration, setIteration] = useState("infinite");
  const [playing, setPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // `<code>` maps to plain HTMLElement in the DOM (no HTMLCodeElement).
  const codeRef = useRef<HTMLElement>(null);

  const css = useMemo(() => {
    const sorted = [...frames].sort((a, b) => a.offset - b.offset);
    const kfText = sorted.map(f => {
      const props = [f.properties.transform && `transform: ${f.properties.transform}`, f.properties.opacity !== "1" && `opacity: ${f.properties.opacity}`].filter(Boolean).join("; ");
      return `  ${f.offset}% { ${props} }`;
    }).join("\n");
    const name = "roycss-custom-anim";
    return `@keyframes ${name} {\n${kfText}\n}\n\n.${name} {\n  animation: ${name} ${duration}s ${easing} ${iteration};\n}`;
  }, [frames, duration, easing, iteration]);

  // Clipboard-failure UX (issue #271): shared helper + visible failed state
  // (select payload, aria-live polite, auto-reset 4s). Success path unchanged.
  const handleCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(css);
    setCopied(ok);
    setCopyFailed(!ok);
    if (!ok) selectElementText(codeRef.current);
    setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, ok ? 2000 : CLIPBOARD_FAILED_RESET_MS);
  }, [css]);

  const addFrame = () => setFrames(prev => [...prev, makeKf(50)]);
  const removeFrame = (id: string) => setFrames(prev => prev.length > 2 ? prev.filter(f => f.id !== id) : prev);
  const updateFrame = (id: string, field: "offset" | "transform" | "opacity", value: string | number) => {
    setFrames(prev => prev.map(f => f.id === id ? {
      ...f,
      offset: field === "offset" ? value as number : f.offset,
      properties: {
        transform: field === "transform" ? value as string : f.properties.transform,
        opacity: field === "opacity" ? value as string : f.properties.opacity,
      },
    } : f));
  };

  const sorted = [...frames].sort((a, b) => a.offset - b.offset);
  const animName = "roycss-custom-anim";

  return (
    <div className="space-y-4">
      {/* Live preview */}
      <div className="flex items-center justify-center h-24 rounded-xl bg-muted/30 border border-border/50">
        <style>{playing ? css : ""}</style>
        <div className={playing ? animName : ""} style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary)" }} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => setPlaying(!playing)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all cursor-pointer">
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} {playing ? "Pause" : "Play"}
        </button>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">Duration</label>
          <input type="number" min={0.1} max={10} step={0.1} value={duration} onChange={(e) => setDuration(parseFloat(e.target.value) || 1)} aria-label="Duration (seconds)" className="w-14 h-7 px-1.5 rounded bg-background border border-border/40 text-xs font-mono text-center" />
          <span className="text-xs text-muted-foreground">s</span>
        </div>
        <select value={easing} onChange={(e) => setEasing(e.target.value)} aria-label="Easing" className="h-7 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer">
          <option value="ease">ease</option><option value="ease-in">ease-in</option><option value="ease-out">ease-out</option><option value="ease-in-out">ease-in-out</option><option value="linear">linear</option><option value="cubic-bezier(0.34,1.56,0.64,1)">spring</option>
        </select>
        <select value={iteration} onChange={(e) => setIteration(e.target.value)} aria-label="Iteration count" className="h-7 px-2 rounded bg-background border border-border/40 text-xs cursor-pointer">
          <option value="infinite">infinite</option><option value="1">1x</option><option value="3">3x</option><option value="5">5x</option>
        </select>
        <button type="button" onClick={addFrame} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:text-primary cursor-pointer"><Plus className="size-3" /> Frame</button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => (
          <button type="button" key={p.name} onClick={() => setFrames(p.frames.map(f => ({ ...f, id: `kf-${kfId++}` })))}
            className="px-2 py-1.5 rounded-lg border border-border/40 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer">{p.name}</button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keyframes ({frames.length})</span>
        </div>
        {/* Timeline bar */}
        <div className="relative h-8 rounded-lg bg-muted/30 border border-border/40 mb-2">
          {sorted.map(f => (
            <div key={f.id} className="absolute top-0 bottom-0 flex items-center" style={{ left: `${f.offset}%` }}>
              <div className="w-0.5 h-full bg-primary/40" />
              <div className="size-3 rounded-full bg-primary -ml-1.5 shadow-sm" />
              <span className="absolute -top-4 text-[11px] font-mono text-primary">{f.offset}%</span>
            </div>
          ))}
        </div>
        {/* Frame editors */}
        <div className="space-y-1.5">
          {sorted.map(f => (
            <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
              <input type="number" min={0} max={100} value={f.offset} onChange={(e) => updateFrame(f.id, "offset", Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} aria-label={`Keyframe ${f.offset}% offset`} className="w-12 h-7 px-1.5 rounded bg-background border border-border/40 text-xs font-mono text-center" />
              <span className="text-xs text-muted-foreground">%</span>
              <input type="text" value={f.properties.transform} onChange={(e) => updateFrame(f.id, "transform", e.target.value)} placeholder="transform: translateY(0)" aria-label={`Keyframe ${f.offset}% transform`} className="flex-1 h-7 px-2 rounded bg-background border border-border/40 text-xs font-mono" />
              <input type="text" value={f.properties.opacity} onChange={(e) => updateFrame(f.id, "opacity", e.target.value)} placeholder="1" aria-label={`Keyframe ${f.offset}% opacity`} className="w-12 h-7 px-1.5 rounded bg-background border border-border/40 text-xs font-mono text-center" />
              <button type="button" onClick={() => removeFrame(f.id)} disabled={frames.length <= 2} aria-label={`Remove ${f.offset}% keyframe`} className="text-muted-foreground hover:text-rose-500 disabled:opacity-30 cursor-pointer"><Minus className="size-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* CSS output */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS</label>
          <button type="button" onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : copyFailed ? "bg-rose-500/15 text-rose-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? "Copied!" : copyFailed ? CLIPBOARD_FAILED_MESSAGE : "Copy"}
            <span role="status" aria-live="polite" className="sr-only">{copyFailed ? CLIPBOARD_FAILED_MESSAGE : ""}</span>
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground/80 overflow-x-auto scrollbar-thin max-h-48 overflow-y-auto"><code ref={codeRef}>{css}</code></pre>
      </div>
    </div>
  );
}
