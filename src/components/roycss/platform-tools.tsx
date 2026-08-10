"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Minimize2,
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
  Dna,
  ArrowLeftRight,
  Trophy,
  GitCompare,
  ArrowRight,
  Clock,
  Award,
  Flame,
  Star,
  Calculator,
  Spline,
  Layers,
  Radar,
  Zap,
  Globe,
  Printer,
  Crosshair,
  MoonStar,
  Network,
  Type,
  ArrowDownUp,
  LayoutGrid,
  SquareStack,
  Grid2x2,
  Ruler,
  Box,
  Rows3,
  Timer,
  Search,
  Film,
  Images,
  Filter,
  Disc,
  Shapes,
  Move,
  MousePointer2,
  ScrollText,
  Languages,
  Image,
  AlignVerticalJustifyCenter,
  Brush,
  Blend,
  TableProperties,
  Proportions,
  Frame,
  MoveVertical,
  Clapperboard,
  Droplet,
  ScanSearch,
  Layers3,
  Keyboard,
  Scale,
  Palette,
  Boxes,
  Target,
  Grid3x3,
  ShieldQuestion,
  CaseSensitive,
  AlignLeft,
  FileBox,
  Split,
  DoorOpen,
  SunMoon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LivePreview } from "@/components/roycss/effect-card";
import { CSSMinifier } from "@/components/roycss/css-minifier";
import { SpecificityCalculator } from "@/components/roycss/tools/specificity-calculator";
import { EasingVisualizer } from "@/components/roycss/tools/easing-visualizer";
import { StackingInspector } from "@/components/roycss/tools/stacking-inspector";
import { SimilarityFinder } from "@/components/roycss/tools/similarity-finder";
import { PerfAnalyzer } from "@/components/roycss/tools/perf-analyzer";
import { BrowserSupportMatrix } from "@/components/roycss/tools/browser-support";
import { PrintSimulator } from "@/components/roycss/tools/print-simulator";
import { SelectorTester } from "@/components/roycss/tools/selector-tester";
import { DarkModeConverter } from "@/components/roycss/tools/dark-mode-converter";
import { VariableDependencyGraph } from "@/components/roycss/tools/variable-graph";
import { FluidTypographyCalculator } from "@/components/roycss/tools/fluid-typography";
import { ScrollAnimationBuilder } from "@/components/roycss/tools/scroll-animation-builder";
import { GridAreasBuilder } from "@/components/roycss/tools/grid-areas-builder";
import { ContainerQueryBuilder } from "@/components/roycss/tools/container-query-builder";
import { NestingConverter } from "@/components/roycss/tools/nesting-converter";
import { ContrastMatrix } from "@/components/roycss/tools/contrast-matrix";
import { UnitConverterPro } from "@/components/roycss/tools/unit-converter";
import { BoxModelVisualizer } from "@/components/roycss/tools/box-model";
import { FlexPlayground } from "@/components/roycss/tools/flex-playground";
import { TransitionStudio } from "@/components/roycss/tools/transition-studio";
import { BackgroundPatternGenerator } from "@/components/roycss/tools/pattern-generator";
import { TransformStudio } from "@/components/roycss/tools/transform-studio";
import { CursorPreviewGallery } from "@/components/roycss/tools/cursor-gallery";
import { ScrollbarStyler } from "@/components/roycss/tools/scrollbar-styler";
import { GapSpacingCalculator } from "@/components/roycss/tools/gap-spacing";
import { WritingModePlayground } from "@/components/roycss/tools/writing-mode";
import { ObjectFitVisualizer } from "@/components/roycss/tools/object-fit";
import { PositioningPlayground } from "@/components/roycss/tools/positioning";
import { CustomPropertyInspector } from "@/components/roycss/tools/property-inspector";
import { AnimationTimelineVisualizer } from "@/components/roycss/tools/animation-timeline";
import { SpriteSheetGenerator } from "@/components/roycss/tools/sprite-sheet-generator";
import { TextShadowStudio } from "@/components/roycss/tools/text-shadow-studio";
import { FilterStudioPro } from "@/components/roycss/tools/filter-studio-pro";
import { ConicGradientGenerator } from "@/components/roycss/tools/conic-gradient";
import { MotionPathAnimator } from "@/components/roycss/tools/motion-path";
import { ViewTransitionBuilder } from "@/components/roycss/tools/view-transition";
import { MaskStudio } from "@/components/roycss/tools/mask-studio";
import { GradientMeshGenerator } from "@/components/roycss/tools/gradient-mesh";
import { TableStyler } from "@/components/roycss/tools/table-styler";
import { AspectRatioCalculator } from "@/components/roycss/tools/aspect-ratio";
import { ShapeGenerator } from "@/components/roycss/tools/shape-generator";
import { ScrollSnapBuilder } from "@/components/roycss/tools/scroll-snap-builder";
import { KeyframesStudio } from "@/components/roycss/tools/keyframes-studio";
import { ThemingEngine } from "@/components/roycss/tools/theming-engine";
import { HasSelectorTester } from "@/components/roycss/tools/has-selector-tester";
import { CSSLayersVisualizer } from "@/components/roycss/tools/css-layers";
import { InputModeExplorer } from "@/components/roycss/tools/input-mode-explorer";
import { CascadeSpecificityExplorer } from "@/components/roycss/tools/cascade-specificity";
import { ColorSpaceExplorer } from "@/components/roycss/tools/color-space-explorer";
import { StyleQueryBuilder } from "@/components/roycss/tools/style-query-builder";
import { ScopeRuleTester } from "@/components/roycss/tools/scope-rule-tester";
import { SubgridBuilder } from "@/components/roycss/tools/subgrid-builder";
import { FallbackAnalyzer } from "@/components/roycss/tools/fallback-analyzer";
import { LogicalPropertiesMapper } from "@/components/roycss/tools/logical-properties-mapper";
import { InitialLetterStudio } from "@/components/roycss/tools/initial-letter-studio";
import { TextWrapStudio } from "@/components/roycss/tools/text-wrap-studio";
import { PropertyRegistrar } from "@/components/roycss/tools/property-registrar";
import { RelativeColorBuilder } from "@/components/roycss/tools/relative-color-builder";
import { StartingStyleStudio } from "@/components/roycss/tools/starting-style-studio";
import { LightDarkExplorer } from "@/components/roycss/tools/light-dark-explorer";
import type { CSSEffect } from "@/lib/roycss-types";

/* ═══════════════════════════════════════════════════════════════
   Shared types
   ═══════════════════════════════════════════════════════════════ */

type ToolType = "ai-playground" | "css-doctor" | "utility-explorer" | "benchmark" | "genome" | "ai-migration" | "challenges" | "design-diff" | "css-minifier" | "specificity" | "easing" | "stacking" | "similarity" | "perf" | "browser-support" | "print" | "selector-tester" | "dark-mode" | "variable-graph" | "fluid-type" | "scroll-animation" | "grid-areas" | "container-query" | "nesting" | "contrast-matrix" | "unit-converter" | "box-model" | "flex-playground" | "transition-studio" | "pattern-generator" | "transform-studio" | "cursor-gallery" | "scrollbar-styler" | "gap-spacing" | "writing-mode" | "object-fit" | "positioning" | "property-inspector" | "animation-timeline" | "sprite-sheet" | "text-shadow" | "filter-studio" | "conic-gradient" | "motion-path" | "view-transition" | "mask-studio" | "gradient-mesh" | "table-styler" | "aspect-ratio" | "shape-generator" | "scroll-snap" | "keyframes-studio" | "theming-engine" | "has-selector-tester" | "css-layers" | "input-mode" | "cascade-specificity" | "color-space" | "style-query" | "scope" | "subgrid" | "fallback" | "logical-properties" | "initial-letter" | "text-wrap" | "property-registrar" | "relative-color" | "starting-style" | "light-dark";

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
   5. Component Genome — effect metadata viewer
   ═══════════════════════════════════════════════════════════════ */

function ComponentGenome() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CSSEffect | null>(effects[0]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return effects.slice(0, 50);
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q) || e.tags.some(t => t.includes(q))).slice(0, 50);
  }, [search]);

  const genome = useMemo(() => {
    if (!selected) return null;
    const css = selected.cssCode;
    const properties = new Set<string>();
    const keyframes: string[] = [];
    const pseudoElements: string[] = [];

    // Extract properties
    const propMatches = css.matchAll(/^\s*([a-z-]+)\s*:/gm);
    for (const m of propMatches) properties.add(m[1]);

    // Extract keyframe names
    const kfMatches = css.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g);
    for (const m of kfMatches) keyframes.push(m[1]);

    // Extract pseudo-elements
    const peMatches = css.matchAll(/::(before|after|first-letter|first-line|placeholder|selection)/g);
    for (const m of peMatches) if (!pseudoElements.includes(m[1])) pseudoElements.push(m[1]);

    // Extract selectors
    const selectorMatches = css.matchAll(/^(\.[a-zA-Z0-9_-]+(?:[^{]*)?)\s*\{/gm);
    const selectors = Array.from(new Set(Array.from(selectorMatches).map(m => m[1].trim())));

    // Color analysis
    const hasOKLCH = /oklch\(/.test(css);
    const hasColorMix = /color-mix\(/.test(css);
    const hasHex = /#[0-9a-fA-F]{3,8}\b/.test(css);
    const hasRGBA = /rgba?\(/.test(css);
    const hasHSL = /hsla?\(/.test(css);

    // Animation analysis
    const animMatch = css.match(/animation:\s*([^;]+)/);
    const animation = animMatch ? animMatch[1].trim() : null;
    const hasReducedMotion = /prefers-reduced-motion/.test(css);

    // Feature detection
    const hasProperty = /@property/.test(css);
    const hasContainerQuery = /@container/.test(css);
    const hasHasSelector = /:has\(/.test(css);
    const hasNesting = /&/.test(css);

    // Size
    const sizeBytes = new Blob([css]).size;
    const lineCount = css.split("\n").length;

    // Tags as "dependencies"
    const dependencies = selected.tags;

    // A11y assessment
    const a11yIssues: string[] = [];
    if (animation && !hasReducedMotion) a11yIssues.push("Missing prefers-reduced-motion guard");
    if (hasHex || hasRGBA || hasHSL) a11yIssues.push("Non-OKLCH color (may have contrast issues)");
    if (animation && /infinite/.test(animation) && /spin|rotate|pulse/.test(animation)) a11yIssues.push("Infinite animation may cause vestibular issues");

    return {
      properties: Array.from(properties).sort(),
      keyframes,
      pseudoElements,
      selectors,
      colors: { hasOKLCH, hasColorMix, hasHex, hasRGBA, hasHSL },
      animation,
      hasReducedMotion,
      features: { hasProperty, hasContainerQuery, hasHasSelector, hasNesting },
      sizeBytes,
      lineCount,
      dependencies,
      a11yIssues,
      genomeScore: [
        hasOKLCH, hasColorMix, !hasHex, !hasRGBA, !hasHSL,
        hasReducedMotion || !animation,
        hasProperty, lineCount < 30,
      ].filter(Boolean).length * 100 / 8,
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
              className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer text-left ${selected?.id === e.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-center size-9 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                <div className="scale-[0.4] origin-center"><LivePreview effect={e} /></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground truncate font-mono">{e.id}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Genome detail */}
      <div className="flex flex-col rounded-xl border border-border/60 overflow-hidden">
        {selected && genome ? (
          <>
            <div className="p-3 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{selected.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selected.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Genome Score</p>
                  <p className={`font-display text-xl font-bold ${genome.genomeScore >= 80 ? "text-emerald-500" : genome.genomeScore >= 60 ? "text-amber-500" : "text-rose-500"}`}>
                    {Math.round(genome.genomeScore)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              {/* Basic metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">Lines</p><p className="text-sm font-mono font-medium">{genome.lineCount}</p></div>
                <div className="p-2 rounded-lg bg-muted/30"><p className="text-xs text-muted-foreground">Size</p><p className="text-sm font-mono font-medium">{genome.sizeBytes}B</p></div>
              </div>

              {/* Selectors */}
              <GenomeSection title="Selectors" items={genome.selectors} mono />

              {/* Keyframes */}
              {genome.keyframes.length > 0 && <GenomeSection title="Keyframes" items={genome.keyframes} mono />}

              {/* Pseudo-elements */}
              {genome.pseudoElements.length > 0 && <GenomeSection title="Pseudo-elements" items={genome.pseudoElements} mono />}

              {/* Properties */}
              <GenomeSection title={`CSS Properties (${genome.properties.length})`} items={genome.properties} mono />

              {/* Color system */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color System</p>
                <ComplianceRow label="OKLCH" passed={genome.colors.hasOKLCH} />
                <ComplianceRow label="color-mix()" passed={genome.colors.hasColorMix} />
                <ComplianceRow label="No hex colors" passed={!genome.colors.hasHex} />
                <ComplianceRow label="No rgba/hsl" passed={!genome.colors.hasRGBA && !genome.colors.hasHSL} />
              </div>

              {/* Modern features */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modern CSS Features</p>
                <ComplianceRow label="@property" passed={genome.features.hasProperty} />
                <ComplianceRow label="Container queries" passed={genome.features.hasContainerQuery} />
                <ComplianceRow label=":has() selector" passed={genome.features.hasHasSelector} />
                <ComplianceRow label="CSS nesting" passed={genome.features.hasNesting} />
                <ComplianceRow label="prefers-reduced-motion" passed={genome.hasReducedMotion} />
              </div>

              {/* Dependencies (tags) */}
              <GenomeSection title="Dependencies (tags)" items={genome.dependencies} />

              {/* A11y */}
              {genome.a11yIssues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accessibility Notes</p>
                  {genome.a11yIssues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5" /> {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select an effect to view its genome</div>
        )}
      </div>
    </div>
  );
}

function GenomeSection({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <code key={i} className={`text-xs px-1.5 py-0.5 rounded bg-muted/60 text-foreground/80 ${mono ? "font-mono" : ""}`}>{item}</code>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. AI Migration — convert Bootstrap/Tailwind → RoyCSS
   ═══════════════════════════════════════════════════════════════ */

const FRAMEWORKS = [
  { id: "bootstrap", name: "Bootstrap" },
  { id: "tailwind", name: "Tailwind CSS" },
  { id: "material", name: "Material UI" },
  { id: "bulma", name: "Bulma" },
  { id: "foundation", name: "Foundation" },
  { id: "plain", name: "Plain CSS" },
];

const MIGRATION_EXAMPLES: Record<string, string> = {
  bootstrap: `.btn-primary {\n  background-color: #0d6efd;\n  border-color: #0d6efd;\n  color: #fff;\n  padding: 0.375rem 0.75rem;\n  border-radius: 0.25rem;\n  transition: all 0.15s;\n}`,
  tailwind: `.card {\n  background-color: #ffffff;\n  border: 1px solid #e5e7eb;\n  border-radius: 0.5rem;\n  padding: 1.5rem;\n  box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n}`,
  material: `.mdc-button {\n  background: #6200ee;\n  color: white;\n  padding: 8px 16px;\n  border-radius: 4px;\n  text-transform: uppercase;\n  animation: ripple 0.3s;\n}`,
  bulma: `.button.is-primary {\n  background-color: #00d1b2;\n  border-color: transparent;\n  color: #fff;\n  padding: 0.5em 1em;\n}`,
  foundation: `.button {\n  background-color: #1779ba;\n  color: #fefefe;\n  padding: 0.85em 1em;\n  margin-bottom: 0;\n}`,
  plain: `.my-element {\n  background: #10b981;\n  margin-left: 10px;\n  padding-right: 20px;\n  border-left: 2px solid #ccc;\n  animation: spin 2s linear infinite;\n}`,
};

function AIMigration() {
  const [framework, setFramework] = useState("bootstrap");
  const [inputCSS, setInputCSS] = useState(MIGRATION_EXAMPLES.bootstrap);
  const [outputCSS, setOutputCSS] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFrameworkChange = (fw: string) => {
    setFramework(fw);
    setInputCSS(MIGRATION_EXAMPLES[fw] || "");
    setOutputCSS("");
    setError("");
  };

  const handleMigrate = useCallback(async () => {
    if (!inputCSS.trim() || loading) return;
    setLoading(true);
    setError("");
    setOutputCSS("");
    try {
      const res = await fetch("/api/ai-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css: inputCSS, framework }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Migration failed");
      setOutputCSS(data.css);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to migrate");
    } finally {
      setLoading(false);
    }
  }, [inputCSS, framework, loading]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(outputCSS); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  }, [outputCSS]);

  return (
    <div className="space-y-4">
      {/* Framework selector */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Source Framework</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FRAMEWORKS.map(fw => (
            <button
              key={fw.id}
              onClick={() => handleFrameworkChange(fw.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                framework === fw.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {fw.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input CSS */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Paste {FRAMEWORKS.find(f => f.id === framework)?.name} CSS</label>
        <textarea
          value={inputCSS}
          onChange={(e) => setInputCSS(e.target.value)}
          placeholder="Paste your CSS here..."
          className="w-full h-32 p-3 rounded-xl bg-background border border-border/50 focus:border-primary/50 text-xs font-mono text-foreground focus:outline-none transition-all resize-none scrollbar-thin"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleMigrate}
        disabled={loading || !inputCSS.trim()}
        className="flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
        {loading ? "Migrating..." : "Migrate to RoyCSS"}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-sm">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <AnimatePresence>
        {outputCSS && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">RoyCSS Output (OKLCH + Logical Properties)</label>
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
            <pre className="p-3 rounded-xl bg-muted/50 border border-border/50 text-xs leading-relaxed font-mono text-foreground/80 overflow-x-auto scrollbar-thin max-h-64 overflow-y-auto">
              <code>{outputCSS}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. Community Challenges — coding challenges + leaderboard
   ═══════════════════════════════════════════════════════════════ */

interface Challenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  prompt: string;
  hint: string;
  xp: number;
  completed: boolean;
}

const CHALLENGES: Challenge[] = [
  {
    id: "ch-1",
    title: "Glassmorphism Card",
    difficulty: "Easy",
    description: "Create a frosted glass card with backdrop-blur, semi-transparent background, and subtle border.",
    prompt: "Create a glassmorphism card that floats above a colorful background",
    hint: "Use backdrop-filter: blur(), a semi-transparent background, and a 1px border with low opacity.",
    xp: 50,
    completed: false,
  },
  {
    id: "ch-2",
    title: "Neon Glow Text",
    difficulty: "Easy",
    description: "Make text glow with a neon effect using text-shadow layers.",
    prompt: "Create neon glow text in cyan",
    hint: "Stack multiple text-shadow values with increasing blur radius and decreasing opacity.",
    xp: 50,
    completed: false,
  },
  {
    id: "ch-3",
    title: "Animated Loader",
    difficulty: "Medium",
    description: "Build a spinner that rotates smoothly using @keyframes and transform.",
    prompt: "Create a circular spinner loader",
    hint: "Use @keyframes with transform: rotate(360deg) and animation: linear infinite.",
    xp: 100,
    completed: false,
  },
  {
    id: "ch-4",
    title: "Hover Shine Sweep",
    difficulty: "Medium",
    description: "Add a diagonal shine that sweeps across a button on hover.",
    prompt: "Create a button with a shine sweep on hover",
    hint: "Use ::before with a gradient and transform: translateX, triggered on :hover.",
    xp: 100,
    completed: false,
  },
  {
    id: "ch-5",
    title: "3D Card Flip",
    difficulty: "Hard",
    description: "Create a card that flips in 3D on hover, revealing back content.",
    prompt: "Create a 3D card flip on hover",
    hint: "Use perspective, transform-style: preserve-3d, backface-visibility: hidden, and rotateY(180deg).",
    xp: 200,
    completed: false,
  },
  {
    id: "ch-6",
    title: "Aurora Gradient",
    difficulty: "Hard",
    description: "Animate a multi-color aurora gradient background.",
    prompt: "Create an animated aurora gradient background",
    hint: "Use @keyframes with background-position shifts on a linear-gradient with multiple color stops.",
    xp: 200,
    completed: false,
  },
];

const LEADERBOARD = [
  { rank: 1, name: "CSS_Ninja", xp: 850, challenges: 6, badge: "gold" },
  { rank: 2, name: "GlassMaster", xp: 700, challenges: 5, badge: "silver" },
  { rank: 3, name: "NeonDream", xp: 650, challenges: 5, badge: "bronze" },
  { rank: 4, name: "RoyWanyoike", xp: 500, challenges: 4, badge: null },
  { rank: 5, name: "SpinnerKing", xp: 450, challenges: 4, badge: null },
  { rank: 6, name: "HoverHero", xp: 300, challenges: 3, badge: null },
  { rank: 7, name: "FlipWizard", xp: 200, challenges: 2, badge: null },
  { rank: 8, name: "AuroraAce", xp: 200, challenges: 2, badge: null },
];

function CommunityChallenges() {
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const totalXP = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xp, 0);
  const completedCount = challenges.filter(c => c.completed).length;

  const handleComplete = (id: string) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="font-display text-2xl font-bold text-foreground">{completedCount}/{challenges.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">XP Earned</p>
          <p className="font-display text-2xl font-bold text-primary">{totalXP}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">Rank</p>
          <p className="font-display text-2xl font-bold text-amber-500">#4</p>
        </div>
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        {challenges.map((ch) => {
          const isExpanded = expandedId === ch.id;
          const diffColor = ch.difficulty === "Easy" ? "text-emerald-500 bg-emerald-500/10" : ch.difficulty === "Medium" ? "text-amber-500 bg-amber-500/10" : "text-rose-500 bg-rose-500/10";
          return (
            <div key={ch.id} className={`rounded-xl border overflow-hidden transition-all ${ch.completed ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 bg-card"}`}>
              <button
                onClick={() => { setExpandedId(isExpanded ? null : ch.id); setShowHint(false); }}
                className="w-full flex items-center justify-between gap-3 p-3 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${ch.completed ? "bg-emerald-500/20 text-emerald-500" : "bg-muted/60 text-muted-foreground"}`}>
                    {ch.completed ? <Check className="size-4" /> : <span className="text-xs font-bold">{ch.xp}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${ch.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{ch.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className={`text-xs ${diffColor}`}>{ch.difficulty}</Badge>
                  <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500 gap-0.5">
                    <Star className="size-2.5" /> {ch.xp} XP
                  </Badge>
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-3 pt-0 space-y-2 border-t border-border/40">
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prompt</p>
                        <p className="text-sm text-foreground">{ch.prompt}</p>
                      </div>
                      {showHint && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
                          <strong>Hint:</strong> {ch.hint}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setShowHint(s => !s)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all cursor-pointer"
                        >
                          <Info className="size-3" /> {showHint ? "Hide hint" : "Show hint"}
                        </button>
                        <button
                          onClick={() => handleComplete(ch.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            ch.completed ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {ch.completed ? "Mark incomplete" : "Mark complete"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="p-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Leaderboard</p>
        </div>
        <div className="divide-y divide-border/30">
          {LEADERBOARD.map((user) => (
            <div key={user.rank} className={`flex items-center justify-between p-2.5 ${user.name === "RoyWanyoike" ? "bg-primary/5" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex items-center justify-center size-7 rounded-lg shrink-0 font-bold text-xs ${
                  user.badge === "gold" ? "bg-amber-500/20 text-amber-500" :
                  user.badge === "silver" ? "bg-zinc-400/20 text-zinc-400" :
                  user.badge === "bronze" ? "bg-orange-700/20 text-orange-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {user.rank}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}{user.name === "RoyWanyoike" && <span className="text-xs text-primary ml-1">(you)</span>}</p>
                  <p className="text-xs text-muted-foreground">{user.challenges} challenges completed</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-mono font-bold text-amber-500 shrink-0">
                <Flame className="size-3.5" /> {user.xp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. Design Diff — before/after CSS comparison
   ═══════════════════════════════════════════════════════════════ */

function DesignDiff() {
  const [beforeCSS, setBeforeCSS] = useState("");
  const [afterCSS, setAfterCSS] = useState("");
  const [diff, setDiff] = useState<{ added: string[]; removed: string[]; changed: { prop: string; before: string; after: string }[] } | null>(null);

  const computeDiff = useCallback(() => {
    const parseProps = (css: string): Record<string, string> => {
      const props: Record<string, string> = {};
      const match = css.match(/\{([^}]+)\}/);
      if (!match) return props;
      for (const decl of match[1].split(";").map(d => d.trim()).filter(Boolean)) {
        const idx = decl.indexOf(":");
        if (idx > 0) props[decl.substring(0, idx).trim()] = decl.substring(idx + 1).trim();
      }
      return props;
    };

    const before = parseProps(beforeCSS);
    const after = parseProps(afterCSS);
    const allProps = new Set([...Object.keys(before), ...Object.keys(after)]);
    const added: string[] = [];
    const removed: string[] = [];
    const changed: { prop: string; before: string; after: string }[] = [];

    for (const prop of allProps) {
      if (!before[prop] && after[prop]) added.push(prop);
      else if (before[prop] && !after[prop]) removed.push(prop);
      else if (before[prop] !== after[prop]) changed.push({ prop, before: before[prop], after: after[prop] });
    }

    setDiff({ added: added.sort(), removed: removed.sort(), changed: changed.sort((a, b) => a.prop.localeCompare(b.prop)) });
  }, [beforeCSS, afterCSS]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Paste two CSS blocks to see exactly what changed — properties added, removed, and modified.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Before */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Before (original CSS)</label>
          <textarea
            value={beforeCSS}
            onChange={(e) => setBeforeCSS(e.target.value)}
            placeholder=".card {\n  background: #fff;\n  border-radius: 4px;\n  padding: 16px;\n}"
            className="w-full h-32 p-3 rounded-xl bg-background border border-rose-500/30 focus:border-rose-500/50 text-xs font-mono text-foreground focus:outline-none transition-all resize-none scrollbar-thin"
          />
        </div>
        {/* After */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">After (updated CSS)</label>
          <textarea
            value={afterCSS}
            onChange={(e) => setAfterCSS(e.target.value)}
            placeholder=".card {\n  background: oklch(1 0 0);\n  border-radius: 0.5rem;\n  padding: 1rem;\n  box-shadow: 0 1px 3px oklch(0 0 0 / 0.1);\n}"
            className="w-full h-32 p-3 rounded-xl bg-background border border-emerald-500/30 focus:border-emerald-500/50 text-xs font-mono text-foreground focus:outline-none transition-all resize-none scrollbar-thin"
          />
        </div>
      </div>

      <button
        onClick={computeDiff}
        disabled={!beforeCSS.trim() || !afterCSS.trim()}
        className="flex items-center gap-1.5 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <GitCompare className="size-4" /> Compare CSS
      </button>

      <AnimatePresence>
        {diff && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Added</p>
                <p className="font-display text-xl font-bold text-emerald-500">{diff.added.length}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-center">
                <p className="text-xs text-amber-600 dark:text-amber-400">Changed</p>
                <p className="font-display text-xl font-bold text-amber-500">{diff.changed.length}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-center">
                <p className="text-xs text-rose-600 dark:text-rose-400">Removed</p>
                <p className="font-display text-xl font-bold text-rose-500">{diff.removed.length}</p>
              </div>
            </div>

            {/* Changed properties */}
            {diff.changed.length > 0 && (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/40 bg-amber-500/5">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Changed Properties</p>
                </div>
                <div className="divide-y divide-border/30">
                  {diff.changed.map((c, i) => (
                    <div key={i} className="p-2.5 grid grid-cols-3 gap-2 text-xs">
                      <code className="font-mono text-muted-foreground">{c.prop}</code>
                      <code className="font-mono text-rose-500 line-through">{c.before}</code>
                      <code className="font-mono text-emerald-500">{c.after}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Added properties */}
            {diff.added.length > 0 && (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/40 bg-emerald-500/5">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Added Properties</p>
                </div>
                <div className="p-2.5 flex flex-wrap gap-1">
                  {diff.added.map((p, i) => <code key={i} className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">{p}</code>)}
                </div>
              </div>
            )}

            {/* Removed properties */}
            {diff.removed.length > 0 && (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/40 bg-rose-500/5">
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Removed Properties</p>
                </div>
                <div className="p-2.5 flex flex-wrap gap-1">
                  {diff.removed.map((p, i) => <code key={i} className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono line-through">{p}</code>)}
                </div>
              </div>
            )}

            {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No differences found — the CSS is identical.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
  "genome": { title: "Component Genome", icon: Dna, description: "Inspect any effect's DNA — selectors, keyframes, properties, color system, modern features, and accessibility notes." },
  "ai-migration": { title: "AI Migration", icon: ArrowLeftRight, description: "Convert Bootstrap, Tailwind, Material, Bulma, or Foundation CSS to RoyCSS (OKLCH + logical properties)." },
  "challenges": { title: "Community Challenges", icon: Trophy, description: "Complete CSS challenges, earn XP, and climb the leaderboard." },
  "design-diff": { title: "Design Diff", icon: GitCompare, description: "Compare two CSS blocks — see exactly what properties were added, changed, or removed." },
  "css-minifier": { title: "CSS Minifier", icon: Minimize2, description: "Paste CSS → get minified output with size savings and gzip estimate." },
  "specificity": { title: "Specificity Calculator", icon: Calculator, description: "Paste CSS selectors → see each one's (a, b, c) specificity score, ranked." },
  "easing": { title: "Easing Visualizer", icon: Spline, description: "Design cubic-bezier curves visually — drag control points, compare presets, copy CSS." },
  "stacking": { title: "Stacking Context Inspector", icon: Layers, description: "Paste HTML → see the stacking-context tree, or sandbox z-index live." },
  "similarity": { title: "Effect Similarity Finder", icon: Radar, description: "Pick any effect → instantly find the most similar effects in the 1,569-effect library." },
  "perf": { title: "CSS Performance Analyzer", icon: Zap, description: "Paste CSS → get a 0–100 performance score with categorized findings and fixes." },
  "browser-support": { title: "Browser Support Matrix", icon: Globe, description: "Look up caniuse-style support for 27 modern CSS features across 5 major browsers." },
  "print": { title: "Print Stylesheet Simulator", icon: Printer, description: "Preview @media print CSS in a live iframe — see exactly what prints, without the print dialog." },
  "selector-tester": { title: "Selector Tester", icon: Crosshair, description: "Type any CSS selector → instantly see matching elements highlighted in a live HTML sample." },
  "dark-mode": { title: "Dark Mode Converter", icon: MoonStar, description: "Paste light-mode colors → auto-generate a perceptually-tuned dark palette via OKLCH lightness inversion." },
  "variable-graph": { title: "Variable Dependency Graph", icon: Network, description: "Paste CSS with var() → visualize the dependency graph, detect cycles, undefined refs, and unused tokens." },
  "fluid-type": { title: "Fluid Typography Calculator", icon: Type, description: "Generate clamp() fluid type scales with a live multi-viewport preview at 320–1440px." },
  "scroll-animation": { title: "Scroll-Driven Animation Builder", icon: ArrowDownUp, description: "Build animation-timeline: scroll() / view() CSS with a live scrollable preview that actually scrolls." },
  "grid-areas": { title: "Grid Template Areas Builder", icon: LayoutGrid, description: "Visually design grid-template-areas maps — paint named regions, get copy-ready CSS with a live layout preview." },
  "container-query": { title: "Container Query Builder", icon: SquareStack, description: "Build @container queries with a live resizable container preview that responds to its own width, not the viewport." },
  "nesting": { title: "CSS Nesting Converter", icon: GitCompare, description: "Convert flat CSS to native nesting (with &) and back. Round-trip safe, handles @media, combinators, pseudo-classes." },
  "contrast-matrix": { title: "Color Contrast Matrix", icon: Grid2x2, description: "Check WCAG contrast for every color pair in your palette at once. AAA/AA/AA-Large/Fail matrix with failing-pair report." },
  "unit-converter": { title: "Unit Converter Pro", icon: Ruler, description: "Convert between all 16 CSS length units (px, rem, em, vw, vh, pt, cm, Q…) with a root font-size + viewport simulator and batch CSS conversion." },
  "box-model": { title: "Box Model Visualizer", icon: Box, description: "Interactive box model diagram — tweak margin/border/padding/content with live sliders, toggle box-sizing, get computed dimensions + generated CSS." },
  "flex-playground": { title: "Flexbox Playground", icon: Rows3, description: "Full flexbox playground — container + per-item controls, live layout preview, add/remove items, generated CSS with flex shorthand." },
  "transition-studio": { title: "Transition Studio", icon: Timer, description: "Build multi-property CSS transitions with per-property timing/delay/easing, live hover/click trigger, and generated shorthand CSS." },
  "pattern-generator": { title: "Background Pattern Generator", icon: Shapes, description: "Generate pure-CSS background patterns (stripes, grid, dots, checker, triangles, zigzag) with color + size controls and copy-ready CSS." },
  "transform-studio": { title: "Transform Studio", icon: Move, description: "Visual builder for CSS transform — combine translate/rotate/scale/skew/3D with live preview, transform-origin picker, and layer reordering." },
  "cursor-gallery": { title: "Cursor Preview Gallery", icon: MousePointer2, description: "Hover-preview every CSS cursor value (pointer, grab, text, resize…), search by category, and build custom cursors with hotspot." },
  "scrollbar-styler": { title: "Scrollbar Styler", icon: ScrollText, description: "Design custom CSS scrollbars — width, colors, radius, hover, border. Cross-browser (WebKit + Firefox). Live preview with 6 presets." },
  "gap-spacing": { title: "Gap & Spacing Calculator", icon: Ruler, description: "Calculate CSS gap, margin, padding with 5 spacing systems (8px grid, 4px grid, modular scale, Tailwind, custom). Smart shorthand output." },
  "writing-mode": { title: "Writing Mode Playground", icon: Languages, description: "Explore CSS writing-mode, direction, text-orientation for vertical text, RTL, and CJK layouts. Logical properties mapping + RTL flip demo." },
  "object-fit": { title: "Object Fit Visualizer", icon: Image, description: "Compare object-fit values (fill, contain, cover, none, scale-down) with live preview on different aspect ratios. Side-by-side comparison." },
  "positioning": { title: "Positioning Playground", icon: Move, description: "Interactive CSS position playground — static/relative/absolute/fixed/sticky. Draggable target, inset controls, z-index, sticky scroll demo." },
  "property-inspector": { title: "Custom Property Inspector", icon: Search, description: "Extract every --custom-property from your CSS with resolved values, type detection, usage counts, and inheritance chains." },
  "animation-timeline": { title: "Animation Timeline", icon: Film, description: "Visualize multiple CSS animations on a Gantt-style timeline. See overlaps, play with a scrubber, generate shorthand CSS." },
  "sprite-sheet": { title: "Sprite Sheet Generator", icon: Images, description: "Combine images into a sprite sheet and generate background-position CSS + steps() animation. Download PNG, copy CSS." },
  "text-shadow": { title: "Text Shadow Studio", icon: Type, description: "Design multi-layer text-shadows with live preview, 9 curated presets (neon, 3D, fire, retro), and generated CSS." },
  "filter-studio": { title: "Filter Studio Pro", icon: Filter, description: "Chain multiple CSS filters (blur, brightness, hue-rotate, drop-shadow…) with live preview, before/after comparison, and SVG filter export." },
  "conic-gradient": { title: "Conic Gradient Generator", icon: Disc, description: "Build conic-gradient() and repeating-conic-gradient() with a draggable angle dial, color stops, center-point pad, and 6 presets." },
  "motion-path": { title: "Motion Path Animator", icon: Spline, description: "Draw a path and animate an element along it using CSS offset-path. 5 path types, 8 presets, live preview with real offset-path animation." },
  "view-transition": { title: "View Transition Builder", icon: SquareStack, description: "Build View Transitions API demos — 6 transition types (morph, fade, slide, zoom, flip, custom) with a live startViewTransition() trigger." },
  "mask-studio": { title: "Mask Studio", icon: Brush, description: "Visual CSS mask builder — gradient masks, image masks (8 SVG presets), text masks. Live preview with -webkit- prefixes. Copy production CSS." },
  "gradient-mesh": { title: "Gradient Mesh Generator", icon: Blend, description: "Create mesh-gradient backgrounds with multiple overlapping radial-gradients. Drag stops on preview, blend modes, 8 presets, randomize." },
  "table-styler": { title: "Table Styler", icon: TableProperties, description: "Style HTML tables — borders, headers, striped rows, hover, sticky header, responsive. Live preview with mock data. 6 presets." },
  "aspect-ratio": { title: "Aspect Ratio Calculator", icon: Proportions, description: "Compute dimensions from aspect ratios, visualize responsive behavior, generate modern + fallback CSS. Reference table of 8 common ratios." },
  "shape-generator": { title: "Shape Generator", icon: Frame, description: "14 CSS shapes (circle, star, heart, hexagon) with visual clip-path polygon editor and border-radius sliders." },
  "scroll-snap": { title: "Scroll Snap Builder", icon: MoveVertical, description: "Interactive scroll-snap-type/align builder with live scrollable preview and 4 presets." },
  "keyframes-studio": { title: "Keyframes Studio", icon: Clapperboard, description: "Visual @keyframes editor with timeline stops, per-stop transform/color controls, live preview, 6 presets." },
  "theming-engine": { title: "Theming Engine", icon: Droplet, description: "Design token generator from a single primary color — 12 OKLCH tokens, 3 export formats, WCAG contrast checks." },
  "has-selector-tester": { title: ":has() Selector Tester", icon: ScanSearch, description: "Live DOM tree builder with real querySelectorAll matching, 6 preset scenarios, highlight matching elements." },
  "css-layers": { title: "CSS Layers Visualizer", icon: Layers3, description: "@layer cascade visualizer with add/reorder layers, live preview via scoped style injection, priority diagram." },
  "input-mode": { title: "Input Mode Explorer", icon: Keyboard, description: "inputmode + enterkeyhint + autocomplete explorer with stylized keyboard mockups and reference tables." },
  "cascade-specificity": { title: "Cascade Specificity Explorer", icon: Scale, description: "CSS parser + specificity computer with :where() stripping, cascade resolution visualization, 3 presets." },
  "color-space": { title: "Color Space Explorer", icon: Palette, description: "Convert colors between sRGB, HSL, OKLCH, OKLab, Display-P3. Gamut visualization, 2D chroma-lightness plane, copy-ready CSS with sRGB fallback." },
  "style-query": { title: "Container Style Query Builder", icon: Boxes, description: "Build @container style(--foo: value) queries (Baseline 2023) with live container custom-property switching and 3 presets." },
  "scope": { title: "@scope Rule Tester", icon: Target, description: "Playground for CSS @scope (Baseline 2024) with DOM tree builder, scope-root + scope-limit selectors, donut-scope visualization." },
  "subgrid": { title: "Subgrid Builder", icon: Grid3x3, description: "Visual builder for grid-template-columns: subgrid (Baseline 2023). Parent track definitions inherited by nested grids with aligned track lines." },
  "fallback": { title: "Property Fallback Analyzer", icon: ShieldQuestion, description: "Generate progressive-enhancement CSS with @supports feature queries for 20 modern properties. Old syntax → @supports → modern syntax chain." },
  "logical-properties": { title: "Logical Properties Mapper", icon: ArrowLeftRight, description: "Map physical → logical CSS properties (margin-left → margin-inline-start). RTL/vertical writing-mode demo, paste-physical-get-logical converter." },
  "initial-letter": { title: "Initial Letter Studio", icon: CaseSensitive, description: "Design CSS initial-letter drop caps (Baseline 2024). Size/sink sliders, raised vs sunken caps, 3-way comparison with legacy float hack, 6 presets." },
  "text-wrap": { title: "Text Wrap Balance Studio", icon: AlignLeft, description: "Explore text-wrap: balance/pretty, line-break, word-break, hyphens, hanging-punctuation. Before/after comparison with balance score, 6 presets." },
  "property-registrar": { title: "@property Registrar", icon: FileBox, description: "Register typed CSS custom properties with @property (Houdini). Syntax picker, inheritance toggle, animated transition demo vs untyped var." },
  "relative-color": { title: "Relative Color Builder", icon: Split, description: "CSS Relative Color Syntax (Baseline 2024) — rgb(from red calc(r + 20) g b). Channel math editors, source→derived preview, 6 presets." },
  "starting-style": { title: "@starting-style Studio", icon: DoorOpen, description: "Animate elements entering the DOM with @starting-style (Baseline 2024). transition-behavior: allow-discrete for display animations, side-by-side comparison." },
  "light-dark": { title: "Light-Dark() Explorer", icon: SunMoon, description: "CSS light-dark() function (Baseline 2024) — auto-switch colors by color-scheme. Palette builder, side-by-side vs @media boilerplate, 4 presets." },
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
              {tool === "genome" && <ComponentGenome />}
              {tool === "ai-migration" && <AIMigration />}
              {tool === "challenges" && <CommunityChallenges />}
              {tool === "design-diff" && <DesignDiff />}
              {tool === "css-minifier" && <CSSMinifier />}
              {tool === "specificity" && <SpecificityCalculator />}
              {tool === "easing" && <EasingVisualizer />}
              {tool === "stacking" && <StackingInspector />}
              {tool === "similarity" && <SimilarityFinder />}
              {tool === "perf" && <PerfAnalyzer />}
              {tool === "browser-support" && <BrowserSupportMatrix />}
              {tool === "print" && <PrintSimulator />}
              {tool === "selector-tester" && <SelectorTester />}
              {tool === "dark-mode" && <DarkModeConverter />}
              {tool === "variable-graph" && <VariableDependencyGraph />}
              {tool === "fluid-type" && <FluidTypographyCalculator />}
              {tool === "scroll-animation" && <ScrollAnimationBuilder />}
              {tool === "grid-areas" && <GridAreasBuilder />}
              {tool === "container-query" && <ContainerQueryBuilder />}
              {tool === "nesting" && <NestingConverter />}
              {tool === "contrast-matrix" && <ContrastMatrix />}
              {tool === "unit-converter" && <UnitConverterPro />}
              {tool === "box-model" && <BoxModelVisualizer />}
              {tool === "flex-playground" && <FlexPlayground />}
              {tool === "transition-studio" && <TransitionStudio />}
              {tool === "pattern-generator" && <BackgroundPatternGenerator />}
              {tool === "transform-studio" && <TransformStudio />}
              {tool === "cursor-gallery" && <CursorPreviewGallery />}
              {tool === "scrollbar-styler" && <ScrollbarStyler />}
              {tool === "gap-spacing" && <GapSpacingCalculator />}
              {tool === "writing-mode" && <WritingModePlayground />}
              {tool === "object-fit" && <ObjectFitVisualizer />}
              {tool === "positioning" && <PositioningPlayground />}
              {tool === "property-inspector" && <CustomPropertyInspector />}
              {tool === "animation-timeline" && <AnimationTimelineVisualizer />}
              {tool === "sprite-sheet" && <SpriteSheetGenerator />}
              {tool === "text-shadow" && <TextShadowStudio />}
              {tool === "filter-studio" && <FilterStudioPro />}
              {tool === "conic-gradient" && <ConicGradientGenerator />}
              {tool === "motion-path" && <MotionPathAnimator />}
              {tool === "view-transition" && <ViewTransitionBuilder />}
              {tool === "mask-studio" && <MaskStudio />}
              {tool === "gradient-mesh" && <GradientMeshGenerator />}
              {tool === "table-styler" && <TableStyler />}
              {tool === "aspect-ratio" && <AspectRatioCalculator />}
              {tool === "shape-generator" && <ShapeGenerator />}
              {tool === "scroll-snap" && <ScrollSnapBuilder />}
              {tool === "keyframes-studio" && <KeyframesStudio />}
              {tool === "theming-engine" && <ThemingEngine />}
              {tool === "has-selector-tester" && <HasSelectorTester />}
              {tool === "css-layers" && <CSSLayersVisualizer />}
              {tool === "input-mode" && <InputModeExplorer />}
              {tool === "cascade-specificity" && <CascadeSpecificityExplorer />}
              {tool === "color-space" && <ColorSpaceExplorer />}
              {tool === "style-query" && <StyleQueryBuilder />}
              {tool === "scope" && <ScopeRuleTester />}
              {tool === "subgrid" && <SubgridBuilder />}
              {tool === "fallback" && <FallbackAnalyzer />}
              {tool === "logical-properties" && <LogicalPropertiesMapper />}
              {tool === "initial-letter" && <InitialLetterStudio />}
              {tool === "text-wrap" && <TextWrapStudio />}
              {tool === "property-registrar" && <PropertyRegistrar />}
              {tool === "relative-color" && <RelativeColorBuilder />}
              {tool === "starting-style" && <StartingStyleStudio />}
              {tool === "light-dark" && <LightDarkExplorer />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
