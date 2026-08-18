"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALargeSmall,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  Layers,
  RotateCcw,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * TextShadowStudio — a multi-layer `text-shadow` editor with live preview.
 *
 * Scope distinction from `box-shadow-generator.tsx`:
 *  - BoxShadowGenerator models the `box-shadow` property (4 offsets + inset +
 *    spread per layer). TextShadowStudio is its `text-shadow` analogue: each
 *    layer is just X / Y / blur / color (no spread, no inset), but the tool
 *    adds a configurable text preview (font size 24–120px, weight, family,
 *    light/dark/custom background) and a richer preset library purpose-built
 *    for typography effects.
 *
 * Features:
 *  - Layers list: X (−50…50), Y (−50…50), blur (0…100), color per layer.
 *    Add / remove / enable-per-layer / reorder (up/down).
 *  - Live preview area with configurable text, font-size slider, font-weight
 *    select, font-family select, and background mode (light / dark / custom).
 *  - 9 typography presets: Neon Glow, 3D Extrude, Retro, Letterpress, Fire,
 *    Ghost, Hard Shadow, Soft Drop, Outline.
 *  - Generated CSS output with Copy button + 2s Check confirmation.
 *
 * All cleanup-safe: the copy confirmation uses a single timeout that is
 * cleared on unmount. No console.log. No `any`.
 */

// ============================================================
// Types
// ============================================================

interface ShadowLayer {
  id: string;
  x: number;
  y: number;
  blur: number;
  color: string;
  enabled: boolean;
}

type BackgroundMode = "light" | "dark" | "custom";

type FontWeight = "300" | "400" | "500" | "600" | "700" | "800" | "900";

type FontFamily = "sans" | "serif" | "mono" | "display";

interface Preset {
  name: string;
  layers: Omit<ShadowLayer, "id">[];
}

// ============================================================
// Constants
// ============================================================

const FONT_FAMILY_VALUES: Record<FontFamily, string> = {
  sans: "system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  display: "'Impact', 'Arial Black', sans-serif",
};

const FONT_WEIGHTS: { value: FontWeight; label: string }[] = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extrabold" },
  { value: "900", label: "Black" },
];

const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
  { value: "display", label: "Display" },
];

const PRESETS: Preset[] = [
  {
    name: "Neon Glow",
    layers: [
      { x: 0, y: 0, blur: 10, color: "#0d9488", enabled: true },
      { x: 0, y: 0, blur: 20, color: "#0d9488", enabled: true },
      { x: 0, y: 0, blur: 40, color: "#14b8a6", enabled: true },
      { x: 0, y: 0, blur: 80, color: "#2dd4bf", enabled: true },
    ],
  },
  {
    name: "3D Extrude",
    layers: Array.from({ length: 8 }, (_, i) => ({
      x: i + 1,
      y: i + 1,
      blur: 0,
      color: i === 7 ? "#1c1917" : "#44403c",
      enabled: true,
    })),
  },
  {
    name: "Retro",
    layers: [
      { x: 3, y: 3, blur: 0, color: "#ef4444", enabled: true },
      { x: 6, y: 6, blur: 0, color: "#f59e0b", enabled: true },
      { x: 9, y: 9, blur: 0, color: "#10b981", enabled: true },
    ],
  },
  {
    name: "Letterpress",
    layers: [
      { x: 0, y: -1, blur: 0, color: "rgba(255, 255, 255, 0.7)", enabled: true },
      { x: 0, y: 1, blur: 1, color: "rgba(0, 0, 0, 0.4)", enabled: true },
    ],
  },
  {
    name: "Fire",
    layers: [
      { x: 0, y: 0, blur: 4, color: "#fbbf24", enabled: true },
      { x: 0, y: -3, blur: 6, color: "#f59e0b", enabled: true },
      { x: 0, y: -6, blur: 12, color: "#ef4444", enabled: true },
      { x: 0, y: -10, blur: 24, color: "#dc2626", enabled: true },
    ],
  },
  {
    name: "Ghost",
    layers: [
      { x: 0, y: 0, blur: 8, color: "rgba(255, 255, 255, 0.9)", enabled: true },
      { x: 0, y: 0, blur: 24, color: "rgba(255, 255, 255, 0.5)", enabled: true },
      { x: 0, y: 0, blur: 48, color: "rgba(255, 255, 255, 0.25)", enabled: true },
    ],
  },
  {
    name: "Hard Shadow",
    layers: [
      { x: 4, y: 4, blur: 0, color: "#000000", enabled: true },
    ],
  },
  {
    name: "Soft Drop",
    layers: [
      { x: 0, y: 4, blur: 8, color: "rgba(0, 0, 0, 0.3)", enabled: true },
      { x: 0, y: 8, blur: 16, color: "rgba(0, 0, 0, 0.2)", enabled: true },
    ],
  },
  {
    name: "Outline",
    layers: [
      { x: -1, y: 0, blur: 0, color: "#0f172a", enabled: true },
      { x: 1, y: 0, blur: 0, color: "#0f172a", enabled: true },
      { x: 0, y: -1, blur: 0, color: "#0f172a", enabled: true },
      { x: 0, y: 1, blur: 0, color: "#0f172a", enabled: true },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

let layerIdCounter = 1;
function makeLayerId(): string {
  return `ts-layer-${layerIdCounter++}`;
}

function makeDefaultLayer(): ShadowLayer {
  return {
    id: makeLayerId(),
    x: 0,
    y: 4,
    blur: 8,
    color: "rgba(0, 0, 0, 0.35)",
    enabled: true,
  };
}

function clonePresetLayers(preset: Preset): ShadowLayer[] {
  return preset.layers.map((l) => ({ ...l, id: makeLayerId() }));
}

// ============================================================
// Sub-components
// ============================================================

interface LayerCardProps {
  layer: ShadowLayer;
  index: number;
  total: number;
  onChange: (id: string, patch: Partial<ShadowLayer>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

function LayerCard({
  layer,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: LayerCardProps) {
  const update = <K extends keyof ShadowLayer>(
    key: K,
    value: ShadowLayer[K],
  ) => onChange(layer.id, { [key]: value } as Partial<ShadowLayer>);

  return (
    <div
      className={cn(
        "space-y-2.5 rounded-lg border border-border bg-card p-3 transition-opacity",
        !layer.enabled && "opacity-50",
      )}
    >
      {/* Row 1: index + enable + reorder + remove */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={layer.enabled}
            onCheckedChange={(v) => update("enabled", v)}
            aria-label={`Toggle layer ${index + 1}`}
          />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {layer.enabled ? "on" : "off"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => onMove(layer.id, "up")}
            disabled={index === 0}
            aria-label={`Move layer ${index + 1} up`}
            title="Move up"
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => onMove(layer.id, "down")}
            disabled={index === total - 1}
            aria-label={`Move layer ${index + 1} down`}
            title="Move down"
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(layer.id)}
            disabled={total <= 1}
            aria-label={`Remove layer ${index + 1}`}
            title="Remove layer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Row 2: X / Y / blur sliders */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { key: "x", label: "X", min: -50, max: 50, step: 1, unit: "px" },
            { key: "y", label: "Y", min: -50, max: 50, step: 1, unit: "px" },
            { key: "blur", label: "Blur", min: 0, max: 100, step: 1, unit: "px" },
          ] as const
        ).map(({ key, label, min, max, step, unit }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {layer[key]}
                {unit}
              </span>
            </div>
            <Slider
              value={[layer[key]]}
              min={min}
              max={max}
              step={step}
              onValueChange={(v) => update(key, v[0])}
              aria-label={`Layer ${index + 1} ${label}`}
            />
          </div>
        ))}
      </div>

      {/* Row 3: color */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(layer.color) ? layer.color : "#000000"}
          onChange={(e) => update("color", e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
          aria-label={`Layer ${index + 1} color picker`}
        />
        <Input
          type="text"
          value={layer.color}
          onChange={(e) => update("color", e.target.value)}
          className="h-8 flex-1 font-mono text-xs"
          aria-label={`Layer ${index + 1} color value`}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function TextShadowStudio() {
  // ── State ────────────────────────────────────────────────────────
  const [layers, setLayers] = useState<ShadowLayer[]>(() =>
    clonePresetLayers(PRESETS[0]),
  );
  const [previewText, setPreviewText] = useState("RoyCSS");
  const [fontSize, setFontSize] = useState(64);
  const [fontWeight, setFontWeight] = useState<FontWeight>("700");
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans");
  const [bgMode, setBgMode] = useState<BackgroundMode>("dark");
  const [customBg, setCustomBg] = useState("#1c1917");
  const [previewFg, setPreviewFg] = useState("#fafaf9");
  const [copied, setCopied] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: text-shadow string ─────────────────────────────────
  const textShadowValue = useMemo(
    () =>
      layers
        .filter((l) => l.enabled)
        .map((l) => `${l.x}px ${l.y}px ${l.blur}px ${l.color}`)
        .join(", "),
    [layers],
  );

  // ── Derived: preview background ─────────────────────────────────
  const previewBackground = useMemo(() => {
    if (bgMode === "light") return "#fafaf9";
    if (bgMode === "dark") return "#1c1917";
    return customBg;
  }, [bgMode, customBg]);

  // ── Derived: generated CSS ──────────────────────────────────────
  const generatedCss = useMemo(
    () => `.text {
  font-size: ${fontSize}px;
  font-weight: ${fontWeight};
  font-family: ${FONT_FAMILY_VALUES[fontFamily]};
  text-shadow: ${textShadowValue || "none"};
}`,
    [fontSize, fontWeight, fontFamily, textShadowValue],
  );

  // ── Derived: preview text style ─────────────────────────────────
  const previewStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      fontFamily: FONT_FAMILY_VALUES[fontFamily],
      color: previewFg,
      textShadow: textShadowValue || "none",
      lineHeight: 1.2,
    }),
    [fontSize, fontWeight, fontFamily, previewFg, textShadowValue],
  );

  // ── Actions ─────────────────────────────────────────────────────
  const addLayer = useCallback(() => {
    setLayers((prev) => [...prev, makeDefaultLayer()]);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<ShadowLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const moveLayer = useCallback((id: string, direction: "up" | "down") => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setLayers(clonePresetLayers(preset));
  }, []);

  const handleReset = useCallback(() => {
    setLayers(clonePresetLayers(PRESETS[0]));
    setPreviewText("RoyCSS");
    setFontSize(64);
    setFontWeight("700");
    setFontFamily("sans");
    setBgMode("dark");
    setCustomBg("#1c1917");
    setPreviewFg("#fafaf9");
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCss]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ALargeSmall className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Text Shadow Studio</h3>
            <p className="text-xs text-muted-foreground">
              Multi-layer <code className="font-mono">text-shadow</code> editor with live preview
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Live preview ────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Eye className="size-3.5" />
            Live Preview
          </span>
          <Tabs
            value={bgMode}
            onValueChange={(v) => setBgMode(v as BackgroundMode)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="light" className="text-xs">
                Light
              </TabsTrigger>
              <TabsTrigger value="dark" className="text-xs">
                Dark
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Preview surface */}
        <div
          className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg p-8"
          style={{ backgroundColor: previewBackground }}
          role="img"
          aria-label="Text shadow preview"
        >
          <span style={previewStyle}>{previewText || " "}</span>
        </div>

        {/* Custom background color + text color controls */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label
              htmlFor="tss-custom-bg"
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Background
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="tss-custom-bg"
                type="color"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                disabled={bgMode !== "custom"}
                className="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Custom preview background color"
              />
              <Input
                type="text"
                value={previewBackground}
                readOnly
                className="h-8 flex-1 font-mono text-xs"
                aria-label="Preview background value"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="tss-fg"
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Text color
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="tss-fg"
                type="color"
                value={previewFg}
                onChange={(e) => setPreviewFg(e.target.value)}
                className="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                aria-label="Preview text color"
              />
              <Input
                type="text"
                value={previewFg}
                onChange={(e) => setPreviewFg(e.target.value)}
                className="h-8 flex-1 font-mono text-xs"
                aria-label="Preview text color value"
              />
            </div>
          </div>
        </div>

        {/* Text content + font controls */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label
              htmlFor="tss-text"
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Preview text
            </Label>
            <div className="flex items-center gap-2">
              <Type className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="tss-text"
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                maxLength={40}
                className="h-8 flex-1 text-sm"
                aria-label="Preview text content"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Weight
              </Label>
              <Select
                value={fontWeight}
                onValueChange={(v) => setFontWeight(v as FontWeight)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map((w) => (
                    <SelectItem key={w.value} value={w.value} className="text-xs">
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Family
              </Label>
              <Select
                value={fontFamily}
                onValueChange={(v) => setFontFamily(v as FontFamily)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Font size slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Font size
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              {fontSize}px
            </span>
          </div>
          <Slider
            value={[fontSize]}
            min={24}
            max={120}
            step={1}
            onValueChange={(v) => setFontSize(v[0])}
            aria-label="Preview font size"
          />
        </div>
      </div>

      {/* ── Presets ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          Presets
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const shadowCss = preset.layers
              .map((l) => `${l.x}px ${l.y}px ${l.blur}px ${l.color}`)
              .join(", ");
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 transition-all hover:border-primary/40 hover:bg-muted/30"
                aria-label={`Apply ${preset.name} preset`}
              >
                <span
                  className="flex h-10 items-center justify-center px-2 text-lg font-bold leading-none"
                  style={{
                    color: "#fafaf9",
                    backgroundColor: "#1c1917",
                    borderRadius: "6px",
                    textShadow: shadowCss,
                    width: "100%",
                  }}
                >
                  Aa
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Layers ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="size-3.5" />
            Layers
            <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
              {layers.filter((l) => l.enabled).length}/{layers.length}
            </Badge>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLayer}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="size-3.5" />
            Add layer
          </Button>
        </div>
        <div className="space-y-2.5">
          {layers.map((layer, i) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              index={i}
              total={layers.length}
              onChange={updateLayer}
              onRemove={removeLayer}
              onMove={moveLayer}
            />
          ))}
        </div>
      </div>

      {/* ── Generated CSS ───────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              copied
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
            aria-label={copied ? "CSS copied to clipboard" : "Copy generated CSS"}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground/80">
          <code>{generatedCss}</code>
        </pre>
        {layers.filter((l) => l.enabled).length === 0 && (
          <p className="text-[10px] text-muted-foreground">
            All layers disabled — the generated CSS uses <code className="font-mono">text-shadow: none</code>.
          </p>
        )}
      </div>
    </div>
  );
}
