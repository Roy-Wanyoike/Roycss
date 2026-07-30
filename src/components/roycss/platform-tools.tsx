"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Stethoscope,
  Microscope,
  Gauge,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
  RefreshCw,
  Play,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LivePreview } from "@/components/roycss/effect-card";
import type { CSSEffect } from "@/lib/roycss-types";

/* ═══════════════════════════════════════════════════════════════
   Shared types
   ═══════════════════════════════════════════════════════════════ */

type ToolType = "ai-playground" | "css-doctor" | "utility-explorer" | "benchmark";

interface PlatformToolsProps {
  tool: ToolType | null;
  onOpenChange: (tool: ToolType | null) => void;
  onSelectEffect?: (effect: CSSEffect) => void;
}

/* ═══════════════════════════════════════════════════════════════
   1. AI Playground — prompt to CSS
   ═══════════════════════════════════════════════════════════════ */

const PLAYGROUND_EXAMPLES = [
  "A glassmorphism card that glows on hover",
  "A neon text effect with flicker animation",
  "A loader with 3 bouncing dots",
  "A button with a shine sweep on hover",
  "An aurora gradient background",
];

function AIPlayground() {
  const [prompt, setPrompt] = useState("");
  const [css, setCss] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setCss("");
    try {
      const res = await fetch("/api/ai-playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setCss(data.css);
      setReplayKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [css]);

  // Extract the first class name for preview
  const previewClass = useMemo(() => {
    const match = css.match(/\.roycss-([a-z0-9-]+)/);
    return match ? `roycss-${match[1]}` : null;
  }, [css]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Describe the effect you want
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g., A pulsing neon border for a card"
            className="flex-1 h-11 px-4 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-sm text-foreground focus:outline-none transition-all"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Example prompts */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Try:</span>
        {PLAYGROUND_EXAMPLES.slice(0, 3).map((ex) => (
          <button
            key={ex}
            onClick={() => setPrompt(ex)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg text-xs bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            {ex.length > 35 ? ex.substring(0, 33) + "…" : ex}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-sm">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <AnimatePresence>
        {css && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Live preview */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
                <button
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer"
                >
                  <RefreshCw className="size-3" /> Replay
                </button>
              </div>
              <div
                key={replayKey}
                className="h-40 flex items-center justify-center"
                style={{ background: "oklch(0.15 0.02 250)" }}
              >
                {previewClass && (
                  <style dangerouslySetInnerHTML={{ __html: css }} />
                )}
                {previewClass && (
                  <div className={previewClass} style={{ width: "60px", height: "60px" }} />
                )}
              </div>
            </div>

            {/* Generated CSS */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated CSS</span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Copied!" : "Copy CSS"}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto scrollbar-thin max-h-64 overflow-y-auto text-xs leading-relaxed font-mono text-foreground/80">
                <code>{css}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. CSS Doctor — paste CSS, get diagnostics
   ═══════════════════════════════════════════════════════════════ */

interface CSSIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  line: number;
  message: string;
  fix: string;
}

function CSSDoctor() {
  const [css, setCss] = useState("");
  const [result, setResult] = useState<{ score: number; issues: CSSIssue[]; summary: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = useCallback(async () => {
    if (!css.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/css-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }, [css, loading]);

  const scoreColor = result
    ? result.score >= 80 ? "text-emerald-500" : result.score >= 50 ? "text-amber-500" : "text-rose-500"
    : "";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Paste your CSS to diagnose
        </label>
        <textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          placeholder=".my-element {\n  background: #10b981;\n  margin-left: 10px;\n  animation: pulse 2s infinite;\n}"
          className="w-full h-40 p-3 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-xs font-mono text-foreground focus:outline-none transition-all resize-none scrollbar-thin"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !css.trim()}
        className="flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Stethoscope className="size-4" />}
        {loading ? "Analyzing..." : "Run Diagnosis"}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-sm">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Score */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health Score</p>
                <p className={`font-display text-3xl font-bold ${scoreColor}`}>{result.score}/100</p>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs text-right">{result.summary}</p>
            </div>

            {/* Issues */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {result.issues.length} {result.issues.length === 1 ? "issue" : "issues"} found
              </p>
              {result.issues.map((issue, i) => {
                const Icon = issue.severity === "critical" ? AlertCircle : issue.severity === "warning" ? AlertTriangle : Info;
                const color = issue.severity === "critical" ? "text-rose-500" : issue.severity === "warning" ? "text-amber-500" : "text-sky-500";
                const bg = issue.severity === "critical" ? "bg-rose-500/5" : issue.severity === "warning" ? "bg-amber-500/5" : "bg-sky-500/5";
                return (
                  <div key={i} className={`p-3 rounded-xl ${bg} border border-border/50`}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <Icon className={`size-4 ${color} shrink-0 mt-0.5`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 capitalize">{issue.category}</Badge>
                          {issue.line > 0 && <span className="text-xs text-muted-foreground">Line {issue.line}</span>}
                        </div>
                        <p className="text-sm text-foreground">{issue.message}</p>
                      </div>
                    </div>
                    {issue.fix && (
                      <pre className="mt-2 p-2 rounded-lg bg-background/60 text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto scrollbar-thin">
                        <code>{issue.fix}</code>
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. Utility Explorer — hover any class, see its CSS + perf
   ═══════════════════════════════════════════════════════════════ */

import { effects } from "@/lib/roycss-effects";

function UtilityExplorer() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CSSEffect | null>(effects[0]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return effects.slice(0, 50);
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q) || e.tags.some(t => t.includes(q))).slice(0, 50);
  }, [search]);

  // Compute "performance metrics" from the CSS
  const metrics = useMemo(() => {
    if (!selected) return null;
    const css = selected.cssCode;
    const lines = css.split("\n").length;
    const size = new Blob([css]).size;
    const hasKeyframes = /@keyframes/.test(css);
    const hasPseudoElements = /::before|::after/.test(css);
    const hasCustomProps = /@property/.test(css);
    const animDuration = css.match(/animation:[^;]*?(\d+(?:\.\d+)?)s/)?.[1];
    const usesColorMix = /color-mix/.test(css);
    const usesOKLCH = /oklch/.test(css);
    const usesLogicalProps = /inline-start|inline-end|block-start|block-end|inset-inline/.test(css);

    return {
      lines,
      size,
      hasKeyframes,
      hasPseudoElements,
      hasCustomProps,
      animDuration: animDuration ? `${animDuration}s` : "none",
      usesColorMix,
      usesOKLCH,
      usesLogicalProps,
      score: [
        usesOKLCH, usesColorMix, usesLogicalProps, hasKeyframes, lines < 30
      ].filter(Boolean).length * 20,
    };
  }, [selected]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[60vh]">
      {/* Effect list */}
      <div className="flex flex-col rounded-xl border border-border/60 overflow-hidden">
        <div className="p-2 border-b border-border/40 bg-muted/20">
          <input
            type="search"
            placeholder="Search effects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-1.5">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              onMouseEnter={() => setSelected(e)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer text-left ${
                selected?.id === e.id ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-center size-9 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                <div className="scale-[0.4] origin-center">
                  <LivePreview effect={e} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground truncate font-mono">.roycss-{e.id}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex flex-col rounded-xl border border-border/60 overflow-hidden">
        {selected && metrics ? (
          <>
            <div className="p-3 border-b border-border/40 bg-muted/20">
              <p className="text-sm font-semibold text-foreground">{selected.name}</p>
              <p className="text-xs text-muted-foreground font-mono">.roycss-{selected.id}</p>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              {/* Preview */}
              <div className="h-24 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.15 0.02 250)" }}>
                <LivePreview effect={selected} />
              </div>

              {/* Score */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quality Score</span>
                <span className={`font-display text-xl font-bold ${metrics.score >= 80 ? "text-emerald-500" : metrics.score >= 60 ? "text-amber-500" : "text-rose-500"}`}>
                  {metrics.score}/100
                </span>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Lines" value={String(metrics.lines)} />
                <Metric label="Size" value={`${metrics.size}B`} />
                <Metric label="Duration" value={metrics.animDuration} />
                <Metric label="Keyframes" value={metrics.hasKeyframes ? "Yes" : "No"} />
              </div>

              {/* Compliance */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Standards Compliance</p>
                <ComplianceRow label="OKLCH colors" passed={metrics.usesOKLCH} />
                <ComplianceRow label="color-mix()" passed={metrics.usesColorMix} />
                <ComplianceRow label="Logical properties" passed={metrics.usesLogicalProps} />
                <ComplianceRow label="@keyframes defined" passed={metrics.hasKeyframes} />
                <ComplianceRow label="@property registered" passed={metrics.hasCustomProps} />
                <ComplianceRow label="Pseudo-elements" passed={metrics.hasPseudoElements} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Hover an effect to explore
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-medium text-foreground">{value}</p>
    </div>
  );
}

function ComplianceRow({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {passed ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <X className="size-3.5 text-muted-foreground/40" />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. Benchmark — live performance test of any effect
   ═══════════════════════════════════════════════════════════════ */

function Benchmark() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CSSEffect | null>(effects[0]);
  const [results, setResults] = useState<{ fps: number; renderMs: number; domNodes: number; layoutShifts: number } | null>(null);
  const [running, setRunning] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return effects.slice(0, 30);
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q)).slice(0, 30);
  }, [search]);

  const runBenchmark = useCallback(async () => {
    if (!selected || running) return;
    setRunning(true);
    setResults(null);

    // Create a test container with 100 instances of the effect
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:800px;visibility:hidden;";
    container.id = "roycss-bench-container";

    // Inject the CSS
    const style = document.createElement("style");
    style.textContent = selected.cssCode;
    container.appendChild(style);

    // Create 100 elements
    for (let i = 0; i < 100; i++) {
      const el = document.createElement("div");
      el.className = `roycss-${selected.id}`;
      el.style.cssText = "width:40px;height:40px;margin:4px;display:inline-block;";
      container.appendChild(el);
    }

    document.body.appendChild(container);

    // Wait a frame for layout
    await new Promise(r => requestAnimationFrame(r));

    // Measure render time
    const startRender = performance.now();
    for (let i = 0; i < 10; i++) {
      container.style.display = "none";
      void container.offsetHeight; // force reflow
      container.style.display = "";
      void container.offsetHeight; // force reflow
    }
    const renderMs = (performance.now() - startRender) / 10;

    // Measure FPS over 1 second
    const domNodes = container.querySelectorAll("*").length;
    let frames = 0;
    const start = performance.now();
    return new Promise<void>((resolve) => {
      const measure = () => {
        frames++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(measure);
        } else {
          const fps = Math.round(frames);
          // Layout shifts (approximate — check if elements moved)
          const firstEl = container.children[1] as HTMLElement;
          const rect1 = firstEl.getBoundingClientRect();
          container.style.width = "600px";
          const rect2 = firstEl.getBoundingClientRect();
          const layoutShifts = rect1.left !== rect2.left ? 1 : 0;
          container.style.width = "800px";

          setResults({ fps, renderMs: Math.round(renderMs * 100) / 100, domNodes, layoutShifts });
          document.body.removeChild(container);
          setRunning(false);
          resolve();
        }
      };
      requestAnimationFrame(measure);
    });
  }, [selected, running]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Effect selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Select effect to benchmark
          </label>
          <input
            type="search"
            placeholder="Search effects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 px-3 mb-2 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm focus:outline-none"
          />
          <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-0.5">
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-all cursor-pointer text-left ${
                  selected?.id === e.id ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-center size-7 rounded bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                  <div className="scale-[0.35] origin-center">
                    <LivePreview effect={e} />
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground truncate">{e.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <button
            onClick={runBenchmark}
            disabled={running || !selected}
            className="w-full flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "Benchmarking (100 elements, 1s)..." : "Run Benchmark"}
          </button>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <BenchmarkMetric
                  label="Frames per second"
                  value={String(results.fps)}
                  unit="fps"
                  good={results.fps >= 55}
                  ok={results.fps >= 30}
                />
                <BenchmarkMetric
                  label="Render time (100 elements)"
                  value={String(results.renderMs)}
                  unit="ms"
                  good={results.renderMs < 5}
                  ok={results.renderMs < 20}
                />
                <BenchmarkMetric
                  label="DOM nodes created"
                  value={String(results.domNodes)}
                  unit="nodes"
                  good={results.domNodes < 105}
                  ok={results.domNodes < 200}
                />
                <BenchmarkMetric
                  label="Layout shifts"
                  value={String(results.layoutShifts)}
                  unit="shifts"
                  good={results.layoutShifts === 0}
                  ok={results.layoutShifts <= 1}
                />
                <p className="text-xs text-muted-foreground pt-1">
                  Benchmark runs 100 instances of the effect for 1 second. Results vary by hardware and browser.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BenchmarkMetric({ label, value, unit, good, ok }: { label: string; value: string; unit: string; good: boolean; ok: boolean }) {
  const color = good ? "text-emerald-500" : ok ? "text-amber-500" : "text-rose-500";
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${color}`}>
        {value} <span className="text-xs text-muted-foreground font-normal">{unit}</span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component — routes to the active tool
   ═══════════════════════════════════════════════════════════════ */

const TOOL_META: Record<ToolType, { title: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  "ai-playground": { title: "AI Playground", icon: Sparkles, description: "Describe an effect in plain English — AI generates production-ready RoyCSS." },
  "css-doctor": { title: "CSS Doctor", icon: Stethoscope, description: "Paste your CSS — get a health score, diagnostics, and auto-fixes." },
  "utility-explorer": { title: "Utility Explorer", icon: Microscope, description: "Hover any effect to see its CSS properties, size, and compliance score." },
  "benchmark": { title: "Benchmark Tool", icon: Gauge, description: "Live-performance test any effect with 100 simultaneous instances." },
};

export function PlatformTools({ tool, onOpenChange, onSelectEffect }: PlatformToolsProps) {
  const meta = tool ? TOOL_META[tool] : null;
  const Icon = meta?.icon;

  return (
    <Sheet open={tool !== null} onOpenChange={(open) => { if (!open) onOpenChange(null); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {meta && Icon && (
          <>
            <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
              <SheetTitle className="flex items-center gap-2 font-display text-lg">
                <Icon className="size-5 text-primary" />
                {meta.title}
              </SheetTitle>
              <SheetDescription>{meta.description}</SheetDescription>
            </SheetHeader>
            <div className="p-5">
              {tool === "ai-playground" && <AIPlayground />}
              {tool === "css-doctor" && <CSSDoctor />}
              {tool === "utility-explorer" && <UtilityExplorer />}
              {tool === "benchmark" && <Benchmark />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
