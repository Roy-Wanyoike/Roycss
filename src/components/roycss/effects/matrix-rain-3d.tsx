"use client";

import { useEffect, useRef } from "react";

export interface MatrixRain3DProps {
  /** Optional className applied to the canvas element */
  className?: string;
  /** Height of the canvas in pixels (default 400) */
  height?: number;
}

/**
 * Simplified katakana set (Matrix-style glyphs). Keep it small so the
 * fallback rendering stays legible at small sizes.
 */
const KATAKANA = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
const NUMERALS = "01";
const GLYPHS = `${KATAKANA}${NUMERALS}`.split("");

/**
 * Depth layers — closer layers are larger, brighter and fall faster.
 * Far layers are smaller, dimmer and slower (simulating perspective).
 */
interface DepthLayer {
  /** scale factor applied to glyph + cell size */
  scale: number;
  /** falling speed in cells-per-second */
  speed: number;
  /** 0-1 brightness multiplier */
  brightness: number;
  /** opacity of the leading "head" glyph */
  headAlpha: number;
}

const DEPTH_LAYERS: readonly DepthLayer[] = [
  { scale: 1.4, speed: 14, brightness: 1.0, headAlpha: 0.95 }, // foreground
  { scale: 1.0, speed: 10, brightness: 0.75, headAlpha: 0.85 },
  { scale: 0.7, speed: 7, brightness: 0.5, headAlpha: 0.7 },
  { scale: 0.45, speed: 4.5, brightness: 0.3, headAlpha: 0.5 }, // background
];

interface Column {
  /** index into DEPTH_LAYERS (simulates a "z" depth for the column) */
  layerIndex: number;
  /** current head row position (in cell units, fractional) */
  head: number;
  /** full column height in cells */
  height: number;
  /** glyph buffer — newest first (index 0 = head) */
  trail: string[];
  /** max trail length */
  trailLength: number;
  /** ms timestamp when the column's head glyph should mutate */
  nextMutation: number;
}

/**
 * MatrixRain3D
 *
 * A perspective matrix-rain rendered with Canvas 2D. Columns are grouped
 * into depth layers: foreground columns use larger glyphs, brighter
 * emerald tones and fall faster; background columns are smaller, dimmer
 * and slower — giving the illusion that the rain recedes "into" the
 * screen. The classic Matrix look is preserved but uses RoyCSS emerald
 * (`#10b981`-family) instead of pure `#00ff00` to match the brand palette.
 *
 * Honors `prefers-reduced-motion`: renders a single static frame and
 * cancels the RAF on unmount.
 */
export function MatrixRain3D({ className, height = 400 }: MatrixRain3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let heightPx = 0;
    let columns: Column[] = [];

    const pickGlyph = () =>
      GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    const makeColumn = (
      layerIndex: number,
      colHeight: number,
    ): Column => {
      const layer = DEPTH_LAYERS[layerIndex];
      const trailLength = Math.max(
        4,
        Math.floor((8 + Math.random() * 14) * layer.scale),
      );
      const head = -Math.random() * colHeight;
      const trail: string[] = [];
      for (let i = 0; i < trailLength; i++) trail.push(pickGlyph());
      return {
        layerIndex,
        head,
        height: colHeight,
        trail,
        trailLength,
        nextMutation: performance.now() + Math.random() * 400,
      };
    };

    const initColumns = () => {
      // Decide column widths based on each layer's scale; group columns by
      // depth so the visual structure reads as a stacked perspective field.
      columns = [];
      // Use the largest scale to determine the base cell width.
      const baseCell = 18;
      // Walk layers from back (smallest scale) to front (largest).
      const layerOrder = [...DEPTH_LAYERS].map((_, i) => i).reverse();
      for (const layerIndex of layerOrder) {
        const layer = DEPTH_LAYERS[layerIndex];
        const cellW = baseCell * layer.scale;
        const cellH = baseCell * layer.scale * 1.15;
        const colHeight = Math.max(1, Math.floor(heightPx / cellH));
        const colCount = Math.max(1, Math.floor(width / cellW));
        for (let c = 0; c < colCount; c++) {
          columns.push(makeColumn(layerIndex, colHeight));
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      heightPx = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(heightPx * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initColumns();
    };

    // Background — near-black with a slight emerald tint so glyphs pop.
    const drawBackground = () => {
      ctx.fillStyle = "#030f0a";
      ctx.fillRect(0, 0, width, heightPx);
    };

    // Long-exposure fade — slowly dims previous frames so glyphs leave trails.
    const drawFade = () => {
      ctx.fillStyle = "rgba(3, 15, 10, 0.18)";
      ctx.fillRect(0, 0, width, heightPx);
    };

    // Manual delta tracking (avoid per-frame perf.now() drift accumulation).
    // Declared before `render` so the closure can resolve it at call time.
    const frameDeltaRef = { current: 1 / 60 };
    let lastFrameMs = performance.now();

    const render = (timeMs: number) => {
      drawFade();
      const baseCell = 18;
      const cellH = baseCell;

      // Render columns grouped by layer so depth ordering stays consistent.
      // We compute x positions per layer so columns are evenly distributed.
      const layerColumnMap = new Map<number, Column[]>();
      for (const col of columns) {
        const arr = layerColumnMap.get(col.layerIndex) ?? [];
        arr.push(col);
        layerColumnMap.set(col.layerIndex, arr);
      }

      for (const [layerIndex, cols] of layerColumnMap) {
        const layer = DEPTH_LAYERS[layerIndex];
        const cellW = baseCell * layer.scale;
        const cellHPx = cellH * layer.scale * 1.15;
        const colCount = cols.length;
        const totalW = colCount * cellW;
        const offsetX = (width - totalW) / 2;
        const fontPx = Math.max(6, Math.floor(13 * layer.scale));
        ctx.font = `${fontPx}px "Menlo", "Consolas", monospace`;
        ctx.textBaseline = "top";
        ctx.textAlign = "center";

        for (let ci = 0; ci < cols.length; ci++) {
          const col = cols[ci];
          const x = offsetX + ci * cellW + cellW / 2;
          // Advance head; the further the layer, the slower.
          if (!prefersReducedMotion) {
            col.head += (layer.speed * (frameDeltaRef.current)) / cellHPx;
          }

          // Periodically mutate a random glyph in the trail to keep it alive.
          if (timeMs > col.nextMutation) {
            const idx = Math.floor(Math.random() * col.trail.length);
            col.trail[idx] = pickGlyph();
            col.nextMutation = timeMs + 80 + Math.random() * 280;
          }

          // Wrap-around when the head exits the bottom.
          if (col.head > col.height + col.trailLength) {
            col.head = -col.trailLength - Math.random() * 4;
          }

          // Draw trail: head is bright (near-white), tail fades to dim emerald.
          for (let t = 0; t < col.trailLength; t++) {
            const row = col.head - t;
            if (row < 0 || row >= col.height) continue;
            const y = row * cellHPx;
            const glyph = col.trail[t] ?? pickGlyph();
            const fade = 1 - t / col.trailLength;
            if (t === 0) {
              // Leading head — brightest, almost white-emerald.
              ctx.fillStyle = `rgba(220, 255, 235, ${layer.headAlpha})`;
            } else {
              const r = Math.floor(16 + 80 * fade * layer.brightness);
              const g = Math.floor(120 + 110 * fade * layer.brightness);
              const b = Math.floor(90 + 60 * fade * layer.brightness);
              const alpha = 0.15 + 0.7 * fade * layer.brightness;
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            ctx.fillText(glyph, x, y);
          }
        }
      }
      ctx.textAlign = "start";
    };

    const animate = () => {
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastFrameMs) / 1000);
      lastFrameMs = now;
      frameDeltaRef.current = delta;
      render(now);
      animationFrame = requestAnimationFrame(animate);
    };

    let animationFrame = 0;
    const handleResize = () => {
      resize();
      if (prefersReducedMotion) {
        drawBackground();
        render(performance.now());
      }
    };

    resize();
    drawBackground();

    if (prefersReducedMotion) {
      render(performance.now());
    } else {
      animationFrame = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block w-full ${className ?? ""}`}
      style={{ height, background: "#030f0a" }}
    />
  );
}

export default MatrixRain3D;
