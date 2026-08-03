"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  AlignVerticalJustifyCenter,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  Languages,
  FlipHorizontal,
  Type,
  Info,
  Mail,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * WritingModePlayground — interactive playground for the CSS `writing-mode`
 * property, plus `direction`, `text-orientation`, and the logical-properties
 * model that ships with CSS Writing Modes Level 3.
 *
 * Features:
 *  - Writing-mode selector (5 modes): horizontal-tb, vertical-rl, vertical-lr,
 *    sideways-rl, sideways-lr. Each button shows a mini live glyph (the text
 *    "Aa文") rendered with the actual `writing-mode` CSS so the orientation is
 *    immediately visible.
 *  - Direction selector: LTR vs RTL, with a note about Arabic/Hebrew/etc.
 *  - Text-orientation selector: mixed / upright / sideways. Gated to vertical
 *    writing modes (disabled in horizontal-tb where it has no effect).
 *  - Live preview: a large bordered box (min-h-[300px]) rendering configurable
 *    text (default a paragraph mixing Latin + CJK) with the selected
 *    writing-mode + direction + orientation applied. Overflow is scrollable so
 *    long text remains usable in vertical modes.
 *  - Logical-properties demo: a square box with edge labels showing how
 *    inline-start / inline-end / block-start / block-end resolve to physical
 *    sides for the current configuration, plus a table mapping margin-* and
 *    inset-* logical properties to their physical equivalents.
 *  - RTL flip demo: a 2x2 grid showing the same card (icon + "Read more" text
 *    + arrow) in LTR vs RTL with logical (inset-inline-start/end) vs physical
 *    (left/right) positioning. Logical flips; physical doesn't.
 *  - 5 presets: English horizontal, Japanese vertical, Arabic RTL, Chinese
 *    vertical (upright orientation), Mongolian sideways (sideways-lr).
 *  - Generated CSS code block with Copy + 2s Check confirmation.
 *
 * All clipboard writes are best-effort (try/catch silent fallback). Copy timer
 * tracked via `useRef` and cleared on unmount. No `console.log`. No `any`.
 * Derived state (mapping / CSS / active preset) memoised.
 */

// ============================================================
// Types
// ============================================================

type WritingMode =
  | "horizontal-tb"
  | "vertical-rl"
  | "vertical-lr"
  | "sideways-rl"
  | "sideways-lr";

type Direction = "ltr" | "rtl";

type TextOrientation = "mixed" | "upright" | "sideways";

interface Config {
  writingMode: WritingMode;
  direction: Direction;
  textOrientation: TextOrientation;
}

type PresetKey =
  | "english-horizontal"
  | "japanese-vertical"
  | "arabic-rtl"
  | "chinese-vertical"
  | "mongolian-sideways";

interface Preset {
  key: PresetKey;
  label: string;
  config: Config;
  text: string;
}

type PhysicalSide = "top" | "right" | "bottom" | "left";

interface LogicalMapping {
  inlineStart: PhysicalSide;
  inlineEnd: PhysicalSide;
  blockStart: PhysicalSide;
  blockEnd: PhysicalSide;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_TEXT =
  "CSS writing-mode controls how text flows. 縦書き (vertical writing) is common in Japanese typography. 你好世界 — Hello, World!";

const DEFAULT_CONFIG: Config = {
  writingMode: "horizontal-tb",
  direction: "ltr",
  textOrientation: "mixed",
};

const WRITING_MODES: ReadonlyArray<{
  key: WritingMode;
  label: string;
  hint: string;
}> = [
  { key: "horizontal-tb", label: "horizontal-tb", hint: "Top-to-bottom block flow (default for Latin/CJK)" },
  { key: "vertical-rl", label: "vertical-rl", hint: "Right-to-left columns, top-to-bottom lines (Japanese/Chinese)" },
  { key: "vertical-lr", label: "vertical-lr", hint: "Left-to-right columns, top-to-bottom lines" },
  { key: "sideways-rl", label: "sideways-rl", hint: "Right-to-left columns, bottom-to-top glyphs" },
  { key: "sideways-lr", label: "sideways-lr", hint: "Left-to-right columns, top-to-bottom sideways (Mongolian)" },
];

const DIRECTIONS: ReadonlyArray<{ key: Direction; label: string; hint: string }> = [
  { key: "ltr", label: "LTR", hint: "Left-to-right inline (Latin, CJK, Cyrillic, etc.)" },
  { key: "rtl", label: "RTL", hint: "Right-to-left inline (Arabic, Hebrew, Persian, Urdu)" },
];

const ORIENTATIONS: ReadonlyArray<{
  key: TextOrientation;
  label: string;
  hint: string;
}> = [
  { key: "mixed", label: "mixed", hint: "CJK upright, Latin rotated 90° CW (default)" },
  { key: "upright", label: "upright", hint: "All glyphs upright, each on its own line" },
  { key: "sideways", label: "sideways", hint: "All glyphs rotated 90° CW (Latin in vertical text)" },
];

const PRESETS: ReadonlyArray<Preset> = [
  {
    key: "english-horizontal",
    label: "English horizontal",
    config: { writingMode: "horizontal-tb", direction: "ltr", textOrientation: "mixed" },
    text: "The CSS writing-mode property defines how text flows on the page. Horizontal-tb is the default for Latin scripts.",
  },
  {
    key: "japanese-vertical",
    label: "Japanese vertical",
    config: { writingMode: "vertical-rl", direction: "ltr", textOrientation: "mixed" },
    text: "CSSの書写モードは、テキストの流れる方向を制御します。縦書きは日本語の伝統的な書き方です。",
  },
  {
    key: "arabic-rtl",
    label: "Arabic RTL",
    config: { writingMode: "horizontal-tb", direction: "rtl", textOrientation: "mixed" },
    text: "الكتابة من اليمين إلى اليسار في اللغة العربية. CSS writing-mode controls text direction.",
  },
  {
    key: "chinese-vertical",
    label: "Chinese vertical",
    config: { writingMode: "vertical-rl", direction: "ltr", textOrientation: "upright" },
    text: "CSS 书写模式控制文本的流向。竖排文字在中文中很常见。你好世界！",
  },
  {
    key: "mongolian-sideways",
    label: "Mongolian sideways",
    config: { writingMode: "sideways-lr", direction: "ltr", textOrientation: "mixed" },
    text: "Mongolian bichig uses sideways-lr mode for traditional vertical text flow.",
  },
];

/** Copy confirmation timeout in ms. */
const COPY_CONFIRM_MS = 2000;

// ============================================================
// Pure helpers
// ============================================================

/**
 * Resolve logical (inline/block start/end) → physical (top/right/bottom/left)
 * for the given writing-mode + direction combination, per CSS Writing Modes L3.
 *
 * Reference mapping:
 *  - horizontal-tb: inline = horizontal (LTR→, RTL←); block = vertical (↓)
 *  - vertical-rl:   inline = vertical (LTR↓, RTL↑); block = horizontal (←)
 *  - vertical-lr:   inline = vertical (LTR↓, RTL↑); block = horizontal (→)
 *  - sideways-rl:   inline = vertical (LTR↑, RTL↓); block = horizontal (←)
 *  - sideways-lr:   inline = vertical (LTR↓, RTL↑); block = horizontal (→)
 */
function resolveLogical(wm: WritingMode, dir: Direction): LogicalMapping {
  switch (wm) {
    case "horizontal-tb":
      return dir === "ltr"
        ? { inlineStart: "left", inlineEnd: "right", blockStart: "top", blockEnd: "bottom" }
        : { inlineStart: "right", inlineEnd: "left", blockStart: "top", blockEnd: "bottom" };
    case "vertical-rl":
      return dir === "ltr"
        ? { inlineStart: "top", inlineEnd: "bottom", blockStart: "right", blockEnd: "left" }
        : { inlineStart: "bottom", inlineEnd: "top", blockStart: "right", blockEnd: "left" };
    case "vertical-lr":
      return dir === "ltr"
        ? { inlineStart: "top", inlineEnd: "bottom", blockStart: "left", blockEnd: "right" }
        : { inlineStart: "bottom", inlineEnd: "top", blockStart: "left", blockEnd: "right" };
    case "sideways-rl":
      return dir === "ltr"
        ? { inlineStart: "bottom", inlineEnd: "top", blockStart: "right", blockEnd: "left" }
        : { inlineStart: "top", inlineEnd: "bottom", blockStart: "right", blockEnd: "left" };
    case "sideways-lr":
      return dir === "ltr"
        ? { inlineStart: "top", inlineEnd: "bottom", blockStart: "left", blockEnd: "right" }
        : { inlineStart: "bottom", inlineEnd: "top", blockStart: "left", blockEnd: "right" };
  }
}

/** Build the generated CSS block, omitting text-orientation for horizontal-tb. */
function buildCSS(c: Config): string {
  const orientationLine =
    c.writingMode !== "horizontal-tb"
      ? `  text-orientation: ${c.textOrientation};\n`
      : "";
  return `.vertical-text {\n  writing-mode: ${c.writingMode};\n${orientationLine}  direction: ${c.direction};\n}`;
}

// ============================================================
// Sub-components
// ============================================================

/** Mini live glyph showing how "Aa文" renders in the given writing-mode. */
function ModeGlyph({ mode }: { mode: WritingMode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-7 items-center justify-center overflow-hidden rounded-sm border border-border bg-background text-[10px] font-medium leading-none text-foreground"
      style={{ writingMode: mode, textOrientation: "mixed" }}
    >
      Aa文
    </span>
  );
}

interface SelectorButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  disabled?: boolean;
}

function SelectorButton({
  active,
  onClick,
  children,
  title,
  disabled,
}: SelectorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

interface LogicalBoxProps {
  mapping: LogicalMapping;
  writingMode: WritingMode;
  direction: Direction;
}

/**
 * Square box with edge labels showing which logical property (inline-start /
 * inline-end / block-start / block-end) resolves to which physical side for the
 * current configuration. Inline labels use primary tint; block labels use
 * amber tint to visually distinguish the two axes.
 */
function LogicalBox({ mapping, writingMode, direction }: LogicalBoxProps) {
  const sideLabels: Record<PhysicalSide, string[]> = {
    top: [],
    right: [],
    bottom: [],
    left: [],
  };
  sideLabels[mapping.inlineStart].push("inline-start");
  sideLabels[mapping.inlineEnd].push("inline-end");
  sideLabels[mapping.blockStart].push("block-start");
  sideLabels[mapping.blockEnd].push("block-end");

  const positionClass: Record<PhysicalSide, string> = {
    top: "left-1/2 top-1 -translate-x-1/2",
    bottom: "left-1/2 bottom-1 -translate-x-1/2",
    left: "left-1 top-1/2 -translate-y-1/2",
    right: "right-1 top-1/2 -translate-y-1/2",
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[200px] rounded-md border-2 border-dashed border-border bg-background">
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="text-center">
          <ArrowDown className="mx-auto size-4 text-primary/60" aria-hidden="true" />
          <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">
            {writingMode}
          </div>
          <div className="font-mono text-[10px] font-medium text-primary">
            {direction.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Edge labels */}
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <div
          key={side}
          className={cn(
            "absolute flex flex-col items-center gap-0.5",
            positionClass[side]
          )}
        >
          {sideLabels[side].map((label) => (
            <span
              key={label}
              className={cn(
                "rounded-sm px-1 py-0.5 font-mono text-[9px] leading-none",
                label.startsWith("inline")
                  ? "bg-primary/15 text-primary"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

interface FlipCardProps {
  dir: Direction;
  mode: "logical" | "physical";
}

/**
 * Demo card with an icon at the inline-start, "Read more" text centered, and
 * an arrow at the inline-end. The `mode` prop switches between logical CSS
 * properties (`inset-inline-start` / `inset-inline-end`) and physical CSS
 * properties (`left` / `right`). With `dir="rtl"`, logical positioning flips
 * (icon → right, arrow → left) while physical positioning stays put.
 *
 * The arrow glyph is also swapped based on `dir` so the logical card looks
 * natural in RTL while the physical card looks visibly out of place —
 * demonstrating why logical properties matter.
 */
function FlipCard({ dir, mode }: FlipCardProps) {
  const isLogical = mode === "logical";

  const commonPos: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
  };

  const iconStyle: CSSProperties = isLogical
    ? { ...commonPos, insetInlineStart: "10px" }
    : { ...commonPos, left: "10px" };

  const arrowStyle: CSSProperties = isLogical
    ? { ...commonPos, insetInlineEnd: "10px" }
    : { ...commonPos, right: "10px" };

  const ArrowIcon = dir === "ltr" ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={dir}
      className={cn(
        "relative h-16 overflow-hidden rounded-md border bg-background",
        isLogical ? "border-primary/40" : "border-border"
      )}
    >
      <div
        style={iconStyle}
        className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary"
      >
        <Mail className="size-4" aria-hidden="true" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-12">
        <span className="text-xs font-medium text-foreground">Read more</span>
      </div>

      <div style={arrowStyle} className="text-muted-foreground">
        <ArrowIcon className="size-4" aria-hidden="true" />
      </div>

      <div className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-muted-foreground/60">
        {dir.toUpperCase()} · {mode}
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function WritingModePlayground() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const isHorizontal = config.writingMode === "horizontal-tb";

  const mapping = useMemo(
    () => resolveLogical(config.writingMode, config.direction),
    [config.writingMode, config.direction]
  );

  const generatedCSS = useMemo(() => buildCSS(config), [config]);

  const activePreset = useMemo<PresetKey | null>(() => {
    return (
      PRESETS.find(
        (p) =>
          p.config.writingMode === config.writingMode &&
          p.config.direction === config.direction &&
          p.config.textOrientation === config.textOrientation &&
          p.text === text
      )?.key ?? null
    );
  }, [config, text]);

  const setMode = useCallback((writingMode: WritingMode) => {
    setConfig((c) => ({ ...c, writingMode }));
  }, []);

  const setDirection = useCallback((direction: Direction) => {
    setConfig((c) => ({ ...c, direction }));
  }, []);

  const setOrientation = useCallback((textOrientation: TextOrientation) => {
    setConfig((c) => ({ ...c, textOrientation }));
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setConfig(preset.config);
    setText(preset.text);
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setText(DEFAULT_TEXT);
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      // best-effort; clipboard may be unavailable (e.g. insecure context)
    }
  }, [generatedCSS]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md border border-border bg-primary/10 p-2 text-primary">
          <AlignVerticalJustifyCenter className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Writing Mode Playground
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              CSS Writing Modes L3
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Explore <code className="font-mono">writing-mode</code>,{" "}
            <code className="font-mono">direction</code>,
            <code className="font-mono"> text-orientation</code>, and logical
            properties for RTL, vertical, and CJK layouts.
          </p>
        </div>
      </header>

      {/* Selectors */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        {/* Writing mode */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Type className="size-3.5" aria-hidden="true" /> Writing mode
          </Label>
          <div role="radiogroup" aria-label="Writing mode" className="flex flex-wrap gap-2">
            {WRITING_MODES.map((m) => (
              <SelectorButton
                key={m.key}
                active={config.writingMode === m.key}
                onClick={() => setMode(m.key)}
                title={m.hint}
              >
                <ModeGlyph mode={m.key} />
                <span className="font-mono">{m.label}</span>
              </SelectorButton>
            ))}
          </div>
        </div>

        {/* Direction */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FlipHorizontal className="size-3.5" aria-hidden="true" /> Direction
          </Label>
          <div role="radiogroup" aria-label="Direction" className="flex flex-wrap gap-2">
            {DIRECTIONS.map((d) => (
              <SelectorButton
                key={d.key}
                active={config.direction === d.key}
                onClick={() => setDirection(d.key)}
                title={d.hint}
              >
                {d.key === "ltr" ? (
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                ) : (
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                )}
                <span className="font-mono">{d.label}</span>
              </SelectorButton>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            <Info className="mr-1 inline size-3 align-text-bottom" aria-hidden="true" />
            RTL languages: Arabic, Hebrew, Persian, Urdu. Direction reverses the
            inline axis only.
          </p>
        </div>

        {/* Text orientation */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" /> Text orientation
            {isHorizontal && (
              <span className="text-[10px] text-muted-foreground/70">
                (no effect in horizontal-tb)
              </span>
            )}
          </Label>
          <div
            role="radiogroup"
            aria-label="Text orientation"
            className="flex flex-wrap gap-2"
          >
            {ORIENTATIONS.map((o) => (
              <SelectorButton
                key={o.key}
                active={!isHorizontal && config.textOrientation === o.key}
                onClick={() => setOrientation(o.key)}
                disabled={isHorizontal}
                title={o.hint}
              >
                <span className="font-mono">{o.label}</span>
              </SelectorButton>
            ))}
          </div>
        </div>
      </section>

      {/* Presets */}
      <section className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Languages className="size-3.5" aria-hidden="true" /> Presets
        </Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <SelectorButton
              key={p.key}
              active={activePreset === p.key}
              onClick={() => applyPreset(p)}
              title={p.label}
            >
              {p.label}
            </SelectorButton>
          ))}
          <SelectorButton active={false} onClick={reset} title="Reset to defaults">
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
          </SelectorButton>
        </div>
      </section>

      {/* Live preview */}
      <section className="space-y-2">
        <Label
          htmlFor="writing-mode-preview-text"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Sparkles className="size-3.5" aria-hidden="true" /> Live preview
        </Label>
        <Textarea
          id="writing-mode-preview-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="resize-y bg-background font-mono text-xs"
          placeholder="Enter preview text — try mixing Latin + CJK characters"
        />
        <motion.div
          layout
          className="relative min-h-[300px] overflow-auto rounded-lg border border-border bg-card p-6"
        >
          <div
            className="text-foreground"
            style={{
              writingMode: config.writingMode,
              direction: config.direction,
              textOrientation: isHorizontal ? "mixed" : config.textOrientation,
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            {text || "(empty preview — type above)"}
          </div>
        </motion.div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-mono text-[10px]">
            writing-mode: {config.writingMode}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            direction: {config.direction}
          </Badge>
          {!isHorizontal && (
            <Badge variant="outline" className="font-mono text-[10px]">
              text-orientation: {config.textOrientation}
            </Badge>
          )}
        </div>
      </section>

      {/* Logical properties demo */}
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            Logical properties mapping
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Logical properties (
          <code className="font-mono">margin-inline-start</code>,{" "}
          <code className="font-mono">margin-block-start</code>, etc.) resolve to
          physical sides based on the current writing-mode + direction.
        </p>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
          <LogicalBox
            mapping={mapping}
            writingMode={config.writingMode}
            direction={config.direction}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">Logical property</TableHead>
                <TableHead className="h-8 text-xs">→ Physical side</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="py-1.5 font-mono text-xs">
                  margin-inline-start
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs text-primary">
                  {mapping.inlineStart}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1.5 font-mono text-xs">
                  margin-inline-end
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs text-primary">
                  {mapping.inlineEnd}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1.5 font-mono text-xs">
                  margin-block-start
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs text-amber-700 dark:text-amber-400">
                  {mapping.blockStart}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1.5 font-mono text-xs">
                  margin-block-end
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs text-amber-700 dark:text-amber-400">
                  {mapping.blockEnd}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1.5 font-mono text-xs">
                  inset-inline-start
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs text-primary">
                  {mapping.inlineStart}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="py-1.5 font-mono text-xs">
                  inset-block-start
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs text-amber-700 dark:text-amber-400">
                  {mapping.blockStart}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* RTL flip demo */}
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <FlipHorizontal className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">RTL flip demo</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Same card in LTR vs RTL. Top row uses logical properties (flips
          correctly). Bottom row uses physical properties (stays put).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FlipCard dir="ltr" mode="logical" />
          <FlipCard dir="rtl" mode="logical" />
          <FlipCard dir="ltr" mode="physical" />
          <FlipCard dir="rtl" mode="physical" />
        </div>
        <p className="text-[11px] text-muted-foreground">
          <Info className="mr-1 inline size-3 align-text-bottom" aria-hidden="true" />
          The arrow glyph is swapped (→ becomes ←) to mimic real RTL UIs. With
          logical properties, both position and content sit correctly; with
          physical properties, the arrow ends up on the wrong side.
        </p>
      </section>

      {/* Generated CSS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" /> Generated CSS
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" aria-hidden="true" />{" "}
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" /> Copy
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
          <code>{generatedCSS}</code>
        </pre>
        <p className="text-[11px] text-muted-foreground">
          <Info className="mr-1 inline size-3 align-text-bottom" aria-hidden="true" />
          {isHorizontal ? (
            <>
              <code className="font-mono">text-orientation</code> is omitted — it
              has no effect in <code className="font-mono">horizontal-tb</code>.
            </>
          ) : (
            <>
              <code className="font-mono">text-orientation</code> only affects
              vertical writing modes.
            </>
          )}
        </p>
      </section>
    </div>
  );
}
