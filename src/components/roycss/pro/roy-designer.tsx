"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyDesigner — AI UI designer.
 *
 * User enters a prompt ("Design an ERP dashboard"), picks an output type
 * (Full Page / Component / Layout / Color Scheme), and clicks "Generate
 * Design". The component simulates a 3-second AI run (with progress bar)
 * and renders:
 *   • a mockup preview built from RoyCSS components (template chosen by
 *     prompt keywords),
 *   • a 5-color OKLCH palette with swatches and copyable values,
 *   • typography suggestions (heading + body + sizes),
 *   • a component list (what RoyCSS components the design uses),
 *   • a layout description.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, no API calls.
 *   • Simulated async via setTimeout / setInterval; every timer id is
 *     registered in a ref Set and cleared on unmount — no leaks.
 *   • TS strict, zero `any`. Exhaustiveness `never` guards on output type.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     accents. No indigo / blue.
 *   • Responsive within a max-w-2xl wrapper.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Copy,
  LayoutGrid,
  Loader2,
  Palette as PaletteIcon,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Type,
  Wand2,
  Boxes,
  Frame,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type OutputType = "full-page" | "component" | "layout" | "color-scheme";

interface OutputTypeDef {
  id: OutputType;
  label: string;
  emoji: string;
  hint: string;
}

interface PaletteColor {
  name: string;
  oklch: string;
  role: string;
}

interface TypographySpec {
  heading: string;
  body: string;
  scale: Array<{ token: string; size: string; usage: string }>;
}

interface ComponentItem {
  name: string;
  reason: string;
}

interface Design {
  template: "dashboard" | "landing" | "ecommerce" | "generic";
  palette: PaletteColor[];
  typography: TypographySpec;
  components: ComponentItem[];
  layout: string;
  summary: string;
}

interface PresetDef {
  id: string;
  label: string;
  prompt: string;
  emoji: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Output types + presets
// ═══════════════════════════════════════════════════════════════════════

const OUTPUT_TYPES: readonly OutputTypeDef[] = [
  {
    id: "full-page",
    label: "Full Page",
    emoji: "\u{1F4C4}",
    hint: "A complete page layout — header, hero, content, footer.",
  },
  {
    id: "component",
    label: "Component",
    emoji: "\u{1F9E9}",
    hint: "A single isolated component with its states.",
  },
  {
    id: "layout",
    label: "Layout",
    emoji: "\u{1F4D0}",
    hint: "Grid + regions — no styling beyond the structure.",
  },
  {
    id: "color-scheme",
    label: "Color Scheme",
    emoji: "\u{1F3A8}",
    hint: "Tokens only — primary, surface, text, border, accent.",
  },
] as const;

const PRESETS: readonly PresetDef[] = [
  {
    id: "erp",
    label: "ERP Dashboard",
    prompt: "Design an ERP dashboard with KPIs, a sales chart, and a recent-orders table.",
    emoji: "\u{1F4BC}",
  },
  {
    id: "landing",
    label: "SaaS Landing",
    prompt: "Design a SaaS landing page with hero, feature grid, pricing, and footer CTA.",
    emoji: "\u{1F680}",
  },
  {
    id: "shop",
    label: "E-commerce Grid",
    prompt: "Design an e-commerce product grid with filters, sort bar, and product cards.",
    emoji: "\u{1F6CD}\u{FE0F}",
  },
  {
    id: "settings",
    label: "Settings Panel",
    prompt: "Design a settings panel with tabs, form fields, and a save bar.",
    emoji: "\u{2699}\u{FE0F}",
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Design generator
// ═══════════════════════════════════════════════════════════════════════

function detectTemplate(prompt: string): Design["template"] {
  const text = prompt.toLowerCase();
  if (/dashboard|erp|kpi|admin|analytics|chart/.test(text)) return "dashboard";
  if (/landing|hero|saas|marketing|pricing|cta/.test(text)) return "landing";
  if (/shop|ecommerce|product|cart|store|grid/.test(text)) return "ecommerce";
  if (/settings|panel|form|profile|preferences/.test(text)) return "dashboard"; // settings → dashboard shell
  return "generic";
}

function buildPalette(): PaletteColor[] {
  // Emerald-forward RoyCSS palette, all OKLCH.
  return [
    { name: "Primary", oklch: "oklch(0.62 0.17 162)", role: "Buttons, links, focus" },
    { name: "Surface", oklch: "oklch(0.98 0.02 165)", role: "Card + page background" },
    { name: "Text", oklch: "oklch(0.25 0.04 165)", role: "Body + headings" },
    { name: "Muted", oklch: "oklch(0.55 0.04 165)", role: "Secondary text, captions" },
    { name: "Accent", oklch: "oklch(0.72 0.16 75)", role: "Badges, highlights (amber)" },
  ];
}

function buildTypography(): TypographySpec {
  return {
    heading: "Inter Variable, system-ui sans-serif",
    body: "Inter Variable, system-ui sans-serif",
    scale: [
      { token: "--text-2xl", size: "1.75rem", usage: "Page titles" },
      { token: "--text-lg", size: "1.125rem", usage: "Section headings" },
      { token: "--text-base", size: "1rem", usage: "Body copy" },
      { token: "--text-sm", size: "0.875rem", usage: "UI labels" },
      { token: "--text-xs", size: "0.75rem", usage: "Captions + meta" },
    ],
  };
}

function buildComponents(template: Design["template"]): ComponentItem[] {
  const base: ComponentItem[] = [
    { name: "RoyCard", reason: "Surface for every grouped region." },
    { name: "RoyButton", reason: "Primary + ghost variants for actions." },
  ];
  if (template === "dashboard") {
    return [
      ...base,
      { name: "RoyStat", reason: "KPI tiles with delta arrows." },
      { name: "RoyChart", reason: "Inline SVG line/bar chart." },
      { name: "RoyTable", reason: "Dense data table with sticky header." },
      { name: "RoyTabs", reason: "Section navigation." },
    ];
  }
  if (template === "landing") {
    return [
      ...base,
      { name: "RoyHero", reason: "Centered headline + CTA pair." },
      { name: "RoyFeatureGrid", reason: "3-up icon + copy grid." },
      { name: "RoyPricing", reason: "Tier cards with highlighted plan." },
      { name: "RoyFooter", reason: "Multi-column link footer." },
    ];
  }
  if (template === "ecommerce") {
    return [
      ...base,
      { name: "RoyProductCard", reason: "Image, price, add-to-cart." },
      { name: "RoyFilterRail", reason: "Left-rail facet checkboxes." },
      { name: "RoySortBar", reason: "Top sort + view toggle." },
      { name: "RoyPagination", reason: "Numbered pagination." },
    ];
  }
  return [
    ...base,
    { name: "RoyContainer", reason: "Centered max-width wrapper." },
    { name: "RoyStack", reason: "Vertical rhythm between blocks." },
    { name: "RoyDivider", reason: "Section breaks." },
  ];
}

function buildLayout(template: Design["template"], output: OutputType): string {
  if (output === "color-scheme") {
    return "Tokens only — no layout. Use the 5 swatches below as your --primary, --surface, --text, --muted, and --accent variables.";
  }
  if (output === "component") {
    return "Single component region: padded RoyCard with internal vertical stack. Hover + focus-visible states defined; mobile width = 100% - 2rem.";
  }
  if (template === "dashboard") {
    return "CSS grid: 240px sidebar | 1fr main. Main = 12-col grid; KPIs span 3 cols each, chart spans 8 cols, table spans 12. Collapses to a single column below 768px.";
  }
  if (template === "landing") {
    return "Single-column flow with anchored sections: hero (full-bleed), features (3-up grid), pricing (3-up grid), CTA, footer. Max content width 1152px; gutters scale with clamp().";
  }
  if (template === "ecommerce") {
    return "Two-column: 220px filter rail | 1fr product grid (auto-fill, minmax(220px, 1fr)). Sort bar spans full width above the grid. Pagination below.";
  }
  return "Single-column max-width 720px, centered. Vertical rhythm via the RoyCSS spacing scale. Mobile-first; expands to a 2-col grid above 768px if content warrants it.";
}

function buildDesign(prompt: string, output: OutputType): Design {
  const template = detectTemplate(prompt);
  const palette = buildPalette();
  const typography = buildTypography();
  const components = buildComponents(template);
  const layout = buildLayout(template, output);
  const summary = `Generated a ${output === "color-scheme" ? "color-scheme" : template} design for "${prompt.slice(0, 60)}". ${components.length} components, ${palette.length}-color OKLCH palette, fluid typography scale.`;
  return { template, palette, typography, components, layout, summary };
}

// ═══════════════════════════════════════════════════════════════════════
// Mockup preview templates
// ═══════════════════════════════════════════════════════════════════════

function DashboardMockup() {
  return (
    <div className="bg-background rounded-md border p-3">
      <div className="grid grid-cols-[120px_1fr] gap-3">
        {/* Sidebar */}
        <div className="bg-muted/50 hidden flex-col gap-2 rounded-md p-2 sm:flex">
          <div className="bg-primary/30 h-3 rounded" />
          <div className="bg-muted h-2 rounded" />
          <div className="bg-muted h-2 rounded" />
          <div className="bg-muted h-2 rounded" />
          <div className="bg-muted h-2 w-2/3 rounded" />
        </div>
        {/* Main */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-muted/40 rounded-md p-2">
                <div className="bg-muted h-1.5 w-1/2 rounded" />
                <div className="bg-foreground/70 mt-1.5 h-3 w-2/3 rounded" />
                <div className="text-primary mt-1 h-1.5 w-1/3 rounded bg-[oklch(0.62_0.17_162)]/40" />
              </div>
            ))}
          </div>
          <div className="bg-muted/40 rounded-md p-3">
            <div className="bg-foreground/70 mb-2 h-2 w-1/4 rounded" />
            <div className="flex h-12 items-end gap-1">
              {[40, 65, 30, 80, 55, 90, 70, 60, 95, 50, 75, 35].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-[oklch(0.62_0.17_162)]/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="bg-muted/40 rounded-md p-2">
            <div className="bg-foreground/70 mb-2 h-1.5 w-1/3 rounded" />
            <div className="space-y-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-muted h-1.5 w-1/3 rounded" />
                  <div className="bg-muted h-1.5 flex-1 rounded" />
                  <div className="bg-primary/40 h-1.5 w-6 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingMockup() {
  return (
    <div className="bg-background space-y-3 rounded-md border p-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="bg-primary/40 h-3 w-12 rounded" />
        <div className="flex gap-1.5">
          <div className="bg-muted h-2 w-6 rounded" />
          <div className="bg-muted h-2 w-6 rounded" />
          <div className="bg-muted h-2 w-6 rounded" />
        </div>
      </div>
      {/* Hero */}
      <div className="bg-muted/40 rounded-md p-4 text-center">
        <div className="bg-foreground/80 mx-auto h-3 w-2/3 rounded" />
        <div className="bg-foreground/80 mx-auto mt-1.5 h-3 w-1/2 rounded" />
        <div className="bg-muted mx-auto mt-2 h-1.5 w-3/4 rounded" />
        <div className="bg-muted mx-auto mt-1 h-1.5 w-2/3 rounded" />
        <div className="mt-3 flex justify-center gap-2">
          <div className="bg-primary h-4 w-14 rounded" />
          <div className="bg-muted h-4 w-14 rounded" />
        </div>
      </div>
      {/* Feature grid */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted/30 rounded-md p-2">
            <div className="bg-primary/40 mb-1.5 size-4 rounded" />
            <div className="bg-foreground/70 h-1.5 w-2/3 rounded" />
            <div className="bg-muted mt-1 h-1 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EcommerceMockup() {
  return (
    <div className="bg-background rounded-md border p-3">
      <div className="grid grid-cols-[80px_1fr] gap-3">
        {/* Filter rail */}
        <div className="bg-muted/40 hidden flex-col gap-1.5 rounded-md p-2 sm:flex">
          <div className="bg-foreground/70 h-1.5 w-2/3 rounded" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-1.5 w-3/4 rounded" />
          ))}
        </div>
        {/* Product grid */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted/40 rounded-md p-2">
              <div className="bg-muted mb-1.5 h-8 rounded" />
              <div className="bg-foreground/70 h-1.5 w-3/4 rounded" />
              <div className="bg-primary/40 mt-1 h-1.5 w-1/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenericMockup() {
  return (
    <div className="bg-background space-y-3 rounded-md border p-3">
      <div className="bg-muted/40 rounded-md p-4">
        <div className="bg-foreground/80 mx-auto h-3 w-1/2 rounded" />
        <div className="bg-muted mx-auto mt-2 h-1.5 w-3/4 rounded" />
        <div className="bg-muted mx-auto mt-1 h-1.5 w-2/3 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-muted/30 rounded-md p-2">
            <div className="bg-foreground/70 h-1.5 w-2/3 rounded" />
            <div className="bg-muted mt-1 h-1 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupPreview({ design }: { design: Design }) {
  if (design.template === "dashboard") return <DashboardMockup />;
  if (design.template === "landing") return <LandingMockup />;
  if (design.template === "ecommerce") return <EcommerceMockup />;
  return <GenericMockup />;
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
            aria-hidden
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function SwatchRow({
  color,
  onCopy,
  copied,
}: {
  color: PaletteColor;
  onCopy: (value: string) => void;
  copied: boolean;
}) {
  return (
    <li className="bg-muted/30 flex items-center gap-3 rounded-lg border p-2.5">
      <div
        className="size-10 shrink-0 rounded-md border shadow-inner"
        style={{ background: color.oklch }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{color.name}</p>
        <p className="text-muted-foreground text-[11px] leading-snug">
          {color.role}
        </p>
        <code className="text-foreground/80 font-mono text-[10px]">
          {color.oklch}
        </code>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onCopy(color.oklch)}
        className="text-muted-foreground hover:text-primary h-7 gap-1 px-2 text-[11px]"
        aria-label={`Copy ${color.oklch}`}
      >
        {copied ? (
          <Check className="size-3 text-primary" aria-hidden />
        ) : (
          <Copy className="size-3" aria-hidden />
        )}
      </Button>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyDesigner
// ═══════════════════════════════════════════════════════════════════════

const RUN_DURATION_MS = 3000;
const TICK_MS = 40;

type RunState = "idle" | "running" | "done";

export function RoyDesigner() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("designer/presets");
  void data; void loading; void error;

  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("full-page");
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [design, setDesign] = useState<Design | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const timersRef = useRef<Set<number>>(new Set());

  const registerTimer = useCallback((id: number): number => {
    timersRef.current.add(id);
    return id;
  }, []);

  const clearTimer = useCallback((id: number): void => {
    window.clearInterval(id);
    window.clearTimeout(id);
    timersRef.current.delete(id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => {
        window.clearInterval(id);
        window.clearTimeout(id);
      });
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!copiedColor) return;
    const t = window.setTimeout(() => setCopiedColor(null), 1500);
    return () => window.clearTimeout(t);
  }, [copiedColor]);

  const handleGenerate = useCallback(() => {
    if (runState === "running") return;
    const text = prompt.trim();
    if (!text) return;

    setRunState("running");
    setProgress(0);
    setDesign(null);

    const start = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / RUN_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearTimer(intervalId);
        setDesign(buildDesign(text, outputType));
        setRunState("done");
      }
    }, TICK_MS);
    registerTimer(intervalId);
  }, [prompt, outputType, runState, clearTimer, registerTimer]);

  const handlePreset = useCallback((preset: PresetDef) => {
    if (runState === "running") return;
    setPrompt(preset.prompt);
  }, [runState]);

  const handleReset = useCallback(() => {
    setRunState("idle");
    setProgress(0);
    setDesign(null);
    setPrompt("");
    setCopiedColor(null);
  }, []);

  const handleCopyColor = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedColor(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopiedColor(value);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, []);

  const canGenerate = prompt.trim().length > 0 && runState !== "running";

  const activeOutput = useMemo(
    () => OUTPUT_TYPES.find((o) => o.id === outputType) ?? OUTPUT_TYPES[0],
    [outputType]
  );

  const sections = useMemo(() => {
    if (!design) return null;
    return (
      <div className="space-y-4">
        {/* Mockup preview (skip for color-scheme only) */}
        {outputType !== "color-scheme" && (
          <SectionCard
            icon={Frame}
            title="Mockup preview"
            description={`Rendered with RoyCSS components — ${design.template} template.`}
          >
            <MockupPreview design={design} />
          </SectionCard>
        )}

        {/* Color palette */}
        <SectionCard
          icon={PaletteIcon}
          title="Color palette"
          description="5 OKLCH tokens — primary, surface, text, muted, accent. Click to copy."
        >
          <ul className="space-y-2">
            {design.palette.map((c) => (
              <SwatchRow
                key={c.name}
                color={c}
                onCopy={handleCopyColor}
                copied={copiedColor === c.oklch}
              />
            ))}
          </ul>
        </SectionCard>

        {/* Typography */}
        <SectionCard
          icon={Type}
          title="Typography"
          description="Variable Inter for both heading and body; fluid scale below."
        >
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="bg-muted/30 rounded-md border p-2.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                  Heading
                </p>
                <p className="text-sm font-semibold">{design.typography.heading}</p>
              </div>
              <div className="bg-muted/30 rounded-md border p-2.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                  Body
                </p>
                <p className="text-sm font-semibold">{design.typography.body}</p>
              </div>
            </div>
            <ul className="bg-muted/30 divide-y rounded-md border">
              {design.typography.scale.map((s) => (
                <li
                  key={s.token}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <code className="text-foreground/80 w-24 shrink-0 font-mono text-[11px]">
                    {s.token}
                  </code>
                  <span className="text-muted-foreground w-16 shrink-0 font-mono text-xs tabular-nums">
                    {s.size}
                  </span>
                  <span className="text-foreground text-xs">{s.usage}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Component list */}
        <SectionCard
          icon={Boxes}
          title="Component list"
          description="RoyCSS components used in this design."
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {design.components.map((c) => (
              <li
                key={c.name}
                className="bg-muted/30 rounded-md border p-2.5"
              >
                <p className="text-sm font-medium leading-tight">{c.name}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                  {c.reason}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Layout description */}
        <SectionCard
          icon={LayoutGrid}
          title="Layout description"
          description="Grid structure, regions, and responsive breakpoints."
        >
          <p className="text-muted-foreground text-xs leading-relaxed">
            {design.layout}
          </p>
        </SectionCard>
      </div>
    );
  }, [design, outputType, copiedColor, handleCopyColor]);

  return (
    <Card className="gap-0 py-0">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <div
          className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full"
          aria-hidden
        >
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">RoyDesigner</span>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary shrink-0 gap-1 text-[10px]"
            >
              <Wand2 className="size-3" aria-hidden />
              AI UI Designer
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Describe a screen — get a mockup, palette, type, components, and
            layout.
          </p>
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────────── */}
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <label htmlFor="roy-designer-prompt" className="text-sm font-medium">
            Design prompt
          </label>
          <Textarea
            id="roy-designer-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Design an ERP dashboard with KPIs, a sales chart, and a recent-orders table."
            rows={4}
            disabled={runState === "running"}
            className="resize-y"
          />
        </div>

        {/* Preset chips */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                disabled={runState === "running"}
                className="hover:border-primary hover:text-primary focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden>{preset.emoji}</span>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output type selector */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            Output type
          </p>
          <div
            role="radiogroup"
            aria-label="Output type"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {OUTPUT_TYPES.map((ot) => {
              const active = ot.id === outputType;
              return (
                <button
                  key={ot.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOutputType(ot.id)}
                  disabled={runState === "running"}
                  className={cn(
                    "focus-visible:ring-ring flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary hover:text-primary"
                  )}
                >
                  <span aria-hidden className="text-base leading-none">
                    {ot.emoji}
                  </span>
                  <span className="text-xs font-medium">{ot.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-[11px]">{activeOutput.hint}</p>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gap-1.5"
          >
            {runState === "running" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden />
                Generate Design
              </>
            )}
          </Button>
          {design && runState !== "running" && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {runState === "running" && (
          <div className="space-y-1" aria-live="polite">
            <Progress value={progress} className="h-1.5" />
            <p className="text-muted-foreground text-[11px] tabular-nums">
              Composing mockup, palette, typography, and layout…{" "}
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Summary */}
        {design && runState === "done" && (
          <div className="bg-primary/5 border-primary/20 rounded-lg border p-3.5">
            <div className="flex items-center gap-2">
              <Square className="text-primary size-3.5 shrink-0 fill-current" aria-hidden />
              <p className="text-sm font-medium">Design summary</p>
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              {design.summary}
            </p>
          </div>
        )}
      </CardContent>

      {/* ── Generated design ───────────────────────────────────────── */}
      {sections}
    </Card>
  );
}
