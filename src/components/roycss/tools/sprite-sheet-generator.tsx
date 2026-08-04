"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Images,
  Download,
  Copy,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  Grid3x3,
  Rows3,
  Columns3,
  Sparkles,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * SpriteSheetGenerator — upload images, arrange into a CSS sprite sheet,
 * download as PNG, and generate the matching `background-position` CSS
 * per frame plus a `steps()` keyframe animation.
 *
 * Features:
 *  - Upload one or more images via file input (PNG / JPG / SVG / WebP).
 *  - Three layouts: horizontal (Columns3), vertical (Rows3), grid (Grid3x3).
 *  - Configurable per-frame size (8–256 px square via a single slider), padding
 *    (0–32 px), and background color (transparent toggle or hex picker).
 *  - Live canvas preview that scales images to fit (object-fit: contain
 *    semantics) — redraws on every state change via useEffect.
 *  - Frame list with reorder (up / down) and remove.
 *  - Download PNG via `canvas.toBlob` + `URL.createObjectURL` (object URL
 *    revoked after the click).
 *  - Generated CSS: a `.sprite` base rule (width / height / background-image),
 *    one `.frame-N { background-position: ... }` rule per frame, and a
 *    `@keyframes sprite-anim` + `.sprite.anim { animation: ... steps(N) infinite; }`
 *    block for horizontal / vertical layouts (steps() animation doesn't make
 *    sense for a 2-D grid layout, so it's omitted there).
 *  - "Load demo" button: generates 8 colored 64×64 frames with the digits
 *    1–8 drawn on top (uses an offscreen canvas + Image to stay consistent
 *    with the uploaded-image code path).
 *  - Copy CSS button with 2s Check confirmation.
 *
 * All cleanup-safe: object URLs are revoked, copy timeout is cleared on
 * unmount. No console.log. No `any`.
 */

// ============================================================
// Types
// ============================================================

type Layout = "horizontal" | "vertical" | "grid";

interface Frame {
  id: string;
  name: string;
  src: string; // dataURL
  imageEl: HTMLImageElement;
  originalWidth: number;
  originalHeight: number;
}

// ============================================================
// Constants
// ============================================================

const DEMO_COLORS = [
  "#0d9488", // teal-600
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#84cc16", // lime-500
  "#10b981", // emerald-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#a3a3a3", // neutral-400
];

// ============================================================
// Helpers
// ============================================================

let frameIdCounter = 1;
function makeFrameId(): string {
  return `ssg-frame-${frameIdCounter++}`;
}

function computeLayout(
  count: number,
  layout: Layout,
): { cols: number; rows: number } {
  const n = Math.max(count, 1);
  if (layout === "horizontal") return { cols: n, rows: 1 };
  if (layout === "vertical") return { cols: 1, rows: n };
  // grid: aim for a near-square layout
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

function framePosition(
  index: number,
  cols: number,
  frameSize: number,
  padding: number,
): { col: number; row: number; x: number; y: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    col,
    row,
    x: col * (frameSize + padding),
    y: row * (frameSize + padding),
  };
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw === 0 || ih === 0) return;
  const scale = Math.min(dw / iw, dh / ih);
  const scaledW = iw * scale;
  const scaledH = ih * scale;
  const ox = dx + (dw - scaledW) / 2;
  const oy = dy + (dh - scaledH) / 2;
  ctx.drawImage(img, ox, oy, scaledW, scaledH);
}

function makeDemoFrame(color: string, digit: number): Promise<Frame> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2D context unavailable"));
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    // Inner border for visual interest
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 56, 56);
    // Digit
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(digit), 32, 34);

    const src = canvas.toDataURL("image/png");
    const img = new Image();
    img.onload = () => {
      resolve({
        id: makeFrameId(),
        name: `frame-${digit}`,
        src,
        imageEl: img,
        originalWidth: 64,
        originalHeight: 64,
      });
    };
    img.onerror = () => reject(new Error("Demo image failed to load"));
    img.src = src;
  });
}

function loadFrameFromFile(file: File): Promise<Frame> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = () => {
      const src = reader.result;
      if (typeof src !== "string") {
        reject(new Error("FileReader did not return a string"));
        return;
      }
      const img = new Image();
      img.onload = () => {
        resolve({
          id: makeFrameId(),
          name: file.name.replace(/\.[^.]+$/, "") || `frame`,
          src,
          imageEl: img,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
// Main component
// ============================================================

export function SpriteSheetGenerator() {
  // ── State ────────────────────────────────────────────────────────
  const [frames, setFrames] = useState<Frame[]>([]);
  const [layout, setLayout] = useState<Layout>("horizontal");
  const [frameSize, setFrameSize] = useState(64);
  const [padding, setPadding] = useState(0);
  const [bgTransparent, setBgTransparent] = useState(true);
  const [bgColor, setBgColor] = useState("#1c1917");
  const [copied, setCopied] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: layout grid + total sheet size ─────────────────────
  const grid = useMemo(
    () => computeLayout(frames.length, layout),
    [frames.length, layout],
  );

  const sheetWidth = grid.cols * frameSize + Math.max(0, grid.cols - 1) * padding;
  const sheetHeight = grid.rows * frameSize + Math.max(0, grid.rows - 1) * padding;

  // ── Derived: animation steps count (only for non-grid layouts) ──
  const supportsAnimation = layout !== "grid" && frames.length > 1;

  // ── Derived: per-frame background-position CSS ──────────────────
  const frameCss = useMemo(() => {
    return frames.map((frame, i) => {
      const pos = framePosition(i, grid.cols, frameSize, padding);
      return {
        name: frame.name,
        css: `.${frame.name || `frame-${i + 1}`} {\n  background-position: -${pos.x}px -${pos.y}px;\n}`,
      };
    });
  }, [frames, grid.cols, frameSize, padding]);

  // ── Derived: generated CSS ──────────────────────────────────────
  const generatedCss = useMemo(() => {
    if (frames.length === 0) {
      return "/* Add frames to generate sprite sheet CSS. */";
    }

    const baseRule = `.sprite {
  width: ${frameSize}px;
  height: ${frameSize}px;
  background-image: url('sprite-sheet.png');
  background-repeat: no-repeat;
}`;

    const frameRules = frameCss.map((f) => f.css).join("\n\n");

    if (!supportsAnimation) {
      return `${baseRule}\n\n${frameRules}`;
    }

    // For horizontal: animate background-position-x from 0 to -(sheetWidth - frameSize)
    // For vertical: animate background-position-y from 0 to -(sheetHeight - frameSize)
    const totalTravel =
      layout === "horizontal"
        ? sheetWidth - frameSize
        : sheetHeight - frameSize;
    const axis = layout === "horizontal" ? "background-position-x" : "background-position-y";
    const duration = (frames.length * 0.1).toFixed(2);

    const animBlock = `@keyframes sprite-anim {
  from { ${axis}: 0; }
  to   { ${axis}: -${totalTravel}px; }
}

.sprite.anim {
  animation: sprite-anim ${duration}s steps(${frames.length}) infinite;
}`;

    return `${baseRule}\n\n${frameRules}\n\n${animBlock}`;
  }, [
    frames.length,
    frameCss,
    supportsAnimation,
    layout,
    sheetWidth,
    sheetHeight,
    frameSize,
  ]);

  // ── Canvas redraw effect ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = sheetWidth;
    canvas.height = sheetHeight;

    ctx.clearRect(0, 0, sheetWidth, sheetHeight);
    if (!bgTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, sheetWidth, sheetHeight);
    }

    frames.forEach((frame, i) => {
      const pos = framePosition(i, grid.cols, frameSize, padding);
      drawImageContain(ctx, frame.imageEl, pos.x, pos.y, frameSize, frameSize);
    });
  }, [
    frames,
    grid.cols,
    frameSize,
    padding,
    bgColor,
    bgTransparent,
    sheetWidth,
    sheetHeight,
  ]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const fileArr = Array.from(files);
      try {
        const loaded = await Promise.all(fileArr.map(loadFrameFromFile));
        setFrames((prev) => [...prev, ...loaded]);
      } catch {
        /* ignore individual load failures — silently skip */
      }
      // Reset the input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const handleLoadDemo = useCallback(async () => {
    setLoadingDemo(true);
    try {
      const demos = await Promise.all(
        DEMO_COLORS.map((color, i) => makeDemoFrame(color, i + 1)),
      );
      setFrames(demos);
    } catch {
      /* ignore */
    } finally {
      setLoadingDemo(false);
    }
  }, []);

  const handleRemoveFrame = useCallback((id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleMoveFrame = useCallback(
    (id: string, direction: "up" | "down") => {
      setFrames((prev) => {
        const idx = prev.findIndex((f) => f.id === id);
        if (idx === -1) return prev;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        const tmp = next[idx];
        next[idx] = next[targetIdx];
        next[targetIdx] = tmp;
        return next;
      });
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setFrames([]);
  }, []);

  const handleReset = useCallback(() => {
    setFrames([]);
    setLayout("horizontal");
    setFrameSize(64);
    setPadding(0);
    setBgTransparent(true);
    setBgColor("#1c1917");
  }, []);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sprite-sheet.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a tick to ensure the download has started.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }, [frames.length]);

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

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Images className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Sprite Sheet Generator</h3>
            <p className="text-xs text-muted-foreground">
              Pack images into a sprite sheet, export PNG, generate <code className="font-mono">steps()</code> CSS
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

      {/* ── Canvas preview ─────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="size-3.5" />
            Preview
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={frames.length === 0}
              className="h-8 gap-1 text-xs"
            >
              <Download className="size-3.5" />
              PNG
            </Button>
          </div>
        </div>

        {/* Canvas surface — checkerboard background for transparency */}
        <div
          className="flex min-h-[160px] items-center justify-center overflow-auto rounded-lg p-4"
          style={{
            backgroundColor: bgTransparent ? "transparent" : bgColor,
            backgroundImage: bgTransparent
              ? "linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.08) 75%)"
              : undefined,
            backgroundSize: bgTransparent ? "16px 16px" : undefined,
            backgroundPosition: bgTransparent
              ? "0 0, 0 8px, 8px -8px, -8px 0"
              : undefined,
          }}
        >
          {frames.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No frames yet — upload images or load the demo.
            </span>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full"
              style={{
                imageRendering: "pixelated",
                width: `${Math.min(sheetWidth, 480)}px`,
                height: "auto",
              }}
              aria-label={`Sprite sheet preview, ${sheetWidth}×${sheetHeight} pixels`}
            />
          )}
        </div>

        {/* Upload + demo buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload images"
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 gap-1 text-xs"
          >
            <Images className="size-3.5" />
            Upload images
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="h-8 gap-1 text-xs"
          >
            <Sparkles className="size-3.5" />
            {loadingDemo ? "Loading…" : "Load demo (8 frames)"}
          </Button>
          {frames.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="ml-auto h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Clear all
            </Button>
          )}
        </div>

        {/* Sheet stats */}
        {frames.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
              <Images className="size-3" />
              {frames.length} frame{frames.length === 1 ? "" : "s"}
            </Badge>
            <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
              {sheetWidth}×{sheetHeight}px
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {grid.cols}×{grid.rows} grid
            </Badge>
            {supportsAnimation && (
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                steps({frames.length}) ready
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Layout + size controls ──────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Grid3x3 className="size-3.5" />
          Layout
        </span>
        <Tabs
          value={layout}
          onValueChange={(v) => setLayout(v as Layout)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="horizontal" className="gap-1 text-xs">
              <Columns3 className="size-3.5" />
              Horizontal
            </TabsTrigger>
            <TabsTrigger value="vertical" className="gap-1 text-xs">
              <Rows3 className="size-3.5" />
              Vertical
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-1 text-xs">
              <Grid3x3 className="size-3.5" />
              Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Frame size */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Frame size
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              {frameSize}×{frameSize}px
            </span>
          </div>
          <Slider
            value={[frameSize]}
            min={8}
            max={256}
            step={1}
            onValueChange={(v) => setFrameSize(v[0])}
            aria-label="Frame size"
          />
        </div>

        {/* Padding */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Padding
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              {padding}px
            </span>
          </div>
          <Slider
            value={[padding]}
            min={0}
            max={32}
            step={1}
            onValueChange={(v) => setPadding(v[0])}
            aria-label="Padding between frames"
          />
        </div>

        {/* Background color */}
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor="ssg-bg-transparent"
            className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            <Switch
              id="ssg-bg-transparent"
              checked={bgTransparent}
              onCheckedChange={setBgTransparent}
              aria-label="Transparent background"
            />
            Transparent
          </Label>
          <div
            className={cn(
              "flex items-center gap-2 transition-opacity",
              bgTransparent && "pointer-events-none opacity-40",
            )}
          >
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="size-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
              aria-label="Sprite sheet background color"
            />
            <Input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-8 w-24 font-mono text-xs"
              aria-label="Background color hex value"
            />
          </div>
        </div>
      </div>

      {/* ── Frame list ──────────────────────────────────────────── */}
      {frames.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="size-3.5" />
            Frames ({frames.length})
          </span>
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {frames.map((frame, i) => (
              <div
                key={frame.id}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2"
              >
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* <img> is intentional here: the src is a sandboxed dataURL
                    generated from user uploads, so next/image's optimization
                    pipeline adds no value and would require an explicit
                    remotePattern config. */}
                <img
                  src={frame.src}
                  alt={frame.name}
                  className="size-8 shrink-0 rounded border border-border/40 bg-muted object-contain"
                />
                <span className="flex-1 truncate font-mono text-xs">
                  {frame.name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {frame.originalWidth}×{frame.originalHeight}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMoveFrame(frame.id, "up")}
                    disabled={i === 0}
                    aria-label={`Move frame ${i + 1} up`}
                    title="Move up"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMoveFrame(frame.id, "down")}
                    disabled={i === frames.length - 1}
                    aria-label={`Move frame ${i + 1} down`}
                    title="Move down"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveFrame(frame.id)}
                    aria-label={`Remove frame ${i + 1}`}
                    title="Remove frame"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generated CSS ───────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={frames.length === 0}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
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
        {frames.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Replace <code className="font-mono">url(&apos;sprite-sheet.png&apos;)</code> with your
            downloaded PNG path. The <code className="font-mono">.sprite.anim</code> rule plays the
            frames in sequence using <code className="font-mono">steps(N)</code>.
            {layout === "grid" && (
              <>
                {" "}Grid layout doesn&apos;t support a single-axis{" "}
                <code className="font-mono">steps()</code> animation — use the per-frame{" "}
                <code className="font-mono">background-position</code> classes to display
                individual frames.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
