"use client";

import { useState, useMemo, useCallback } from "react";
import { RotateCcw, Copy, Check, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { effects } from "@/lib/roycss-effects";
import { LivePreview } from "@/components/roycss/effect-card";

const EASING_OPTIONS = [
  { value: "ease", label: "ease" }, { value: "ease-in", label: "ease-in" }, { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" }, { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.68,-0.55,0.27,1.55)", label: "bounce" },
  { value: "cubic-bezier(0.34,1.56,0.64,1)", label: "spring" },
  { value: "cubic-bezier(0.22,1,0.36,1)", label: "smooth" },
];
const REPEAT_OPTIONS = [{ value: "1", label: "1x" }, { value: "3", label: "3x" }, { value: "infinite", label: "Infinite" }];

interface PlaygroundPanelProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function PlaygroundPanel({ open, onOpenChange }: PlaygroundPanelProps) {
  const [effectId, setEffectId] = useState("pulse-glow");
  const [duration, setDuration] = useState(2);
  const [delay, setDelay] = useState(0);
  const [repeat, setRepeat] = useState("infinite");
  const [easing, setEasing] = useState("ease-in-out");
  const [copied, setCopied] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const selectedEffect = useMemo(() => effects.find(e => e.id === effectId) || effects[0], [effectId]);
  const animatedEffects = useMemo(() => effects.filter(e => /animation\s*:/.test(e.cssCode)).slice(0, 200), []);

  const generatedCSS = useMemo(() => {
    if (!selectedEffect) return "";
    const cls = `roycss-${selectedEffect.id}`;
    const animLine = selectedEffect.cssCode.match(/animation:\s*([^;]+)/i);
    const animName = animLine?.[1]?.trim().split(/\s+/)[0] || `roy-${selectedEffect.id}`;
    return `/* ${selectedEffect.name} — customized */\n.${cls} {\n  animation: ${animName} ${duration}s ${easing} ${delay}s ${repeat};\n}`;
  }, [selectedEffect, duration, delay, repeat, easing]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(generatedCSS); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [generatedCSS]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-2 text-left">
          <SheetTitle className="flex items-center gap-2 font-display text-lg"><SlidersHorizontal className="size-5 text-primary" />Animation Playground</SheetTitle>
          <SheetDescription>Tune animation properties with live preview. Copy the generated CSS.</SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-5 space-y-5">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Effect</Label>
            <Select value={effectId} onValueChange={setEffectId}>
              <SelectTrigger className="h-11 w-full cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">{animatedEffects.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/60 to-muted/20 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
              <button onClick={() => setReplayKey(k => k + 1)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer" aria-label="Replay animation">
                <RotateCcw className="size-3" />Replay
              </button>
            </div>
            <div className="h-48 flex items-center justify-center" key={`${effectId}-${duration}-${delay}-${repeat}-${easing}-${replayKey}`}>
              {selectedEffect && (
                <div style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s`, animationIterationCount: repeat === "infinite" ? "infinite" : parseInt(repeat), animationTimingFunction: easing }}>
                  <LivePreview effect={selectedEffect} />
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</Label><span className="text-xs font-mono text-primary">{duration}s</span></div>
            <Slider value={[duration]} onValueChange={(v) => setDuration(v[0])} min={0.1} max={10} step={0.1} className="cursor-pointer" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delay</Label><span className="text-xs font-mono text-primary">{delay}s</span></div>
            <Slider value={[delay]} onValueChange={(v) => setDelay(v[0])} min={0} max={5} step={0.1} className="cursor-pointer" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Repeat</Label>
            <Select value={repeat} onValueChange={setRepeat}><SelectTrigger className="h-11 w-full cursor-pointer"><SelectValue /></SelectTrigger><SelectContent>{REPEAT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Easing</Label>
            <Select value={easing} onValueChange={setEasing}><SelectTrigger className="h-11 w-full cursor-pointer"><SelectValue /></SelectTrigger><SelectContent>{EASING_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <button onClick={() => { setDuration(2); setDelay(0); setRepeat("infinite"); setEasing("ease-in-out"); }} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><RotateCcw className="size-3" />Reset to defaults</button>
          <div>
            <div className="flex items-center justify-between mb-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated CSS</Label>
              <button onClick={handleCopy} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>{copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? "Copied!" : "Copy CSS"}</button>
            </div>
            <pre className="p-3 rounded-xl bg-muted/50 border border-border/50 text-xs leading-relaxed font-mono text-foreground/80 overflow-x-auto scrollbar-thin"><code>{generatedCSS}</code></pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
