"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contrast, Copy, Check, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * ContrastChecker — WCAG color contrast checker.
 * Enter foreground + background colors, see the contrast ratio,
 * pass/fail for AA and AAA, and a live preview.
 *
 * Supports: hex (#fff, #ffffff), rgb(), and OKLCH (approximate).
 */

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (cleaned.length === 6 || cleaned.length === 8) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ContrastChecker() {
  const [fg, setFg] = useState("#ffffff");
  const [bg, setBg] = useState("#0a0a0a");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const fgRgb = hexToRgb(fg);
    const bgRgb = hexToRgb(bg);
    if (!fgRgb || !bgRgb) return null;
    const ratio = contrastRatio(fgRgb, bgRgb);
    return {
      ratio: ratio.toFixed(2),
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
      fgRgb,
      bgRgb,
    };
  }, [fg, bg]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`/* WCAG contrast ratio: ${result.ratio}:1 (fg: ${fg}, bg: ${bg}) — AA ${result.aaNormal ? "pass" : "fail"} normal, AAA ${result.aaaNormal ? "pass" : "fail"} normal */`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [result, fg, bg]);

  return (
    <div className="space-y-4">
      {/* Color inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Foreground</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fg.length === 7 ? fg : "#ffffff"}
              onChange={(e) => setFg(e.target.value)}
              className="size-10 rounded-lg border border-border/50 cursor-pointer shrink-0"
            />
            <input
              type="text"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              placeholder="#ffffff"
              className="flex-1 h-10 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm font-mono text-foreground focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bg.length === 7 ? bg : "#000000"}
              onChange={(e) => setBg(e.target.value)}
              className="size-10 rounded-lg border border-border/50 cursor-pointer shrink-0"
            />
            <input
              type="text"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              placeholder="#000000"
              className="flex-1 h-10 px-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 text-sm font-mono text-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-xl overflow-hidden border border-border/50">
        <div
          className="p-6 text-center"
          style={{ background: bg, color: fg }}
        >
          <p className="text-xl font-bold">The quick brown fox</p>
          <p className="text-sm mt-1 opacity-80">jumps over the lazy dog</p>
          <p className="text-xs mt-2 opacity-60">Small text preview for contrast testing</p>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Ratio */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Contrast Ratio</p>
                <p className="font-display text-3xl font-bold text-foreground">{result.ratio}<span className="text-lg text-muted-foreground">:1</span></p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied!" : "Copy ratio"}
              </button>
            </div>

            {/* WCAG results */}
            <div className="grid grid-cols-2 gap-2">
              <WCAGResult label="AA Normal" passed={result.aaNormal} threshold="≥ 4.5:1" />
              <WCAGResult label="AA Large" passed={result.aaLarge} threshold="≥ 3:1" />
              <WCAGResult label="AAA Normal" passed={result.aaaNormal} threshold="≥ 7:1" />
              <WCAGResult label="AAA Large" passed={result.aaaLarge} threshold="≥ 4.5:1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WCAGResult({ label, passed, threshold }: { label: string; passed: boolean; threshold: string }) {
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
      {passed ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="size-4 text-rose-500 shrink-0" />}
      <div className="min-w-0">
        <p className={`text-xs font-medium ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{label}</p>
        <p className="text-[10px] text-muted-foreground">{threshold}</p>
      </div>
    </div>
  );
}
