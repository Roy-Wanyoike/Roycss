"use client";

import { useState, useMemo, useCallback } from "react";
import { Palette, Copy, Check, X } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { Input } from "@/components/ui/input";

/**
 * ColorPaletteExtractor — extracts all colors from an effect's CSS
 * and displays them as clickable swatches. Designers can copy any
 * color (OKLCH or hex) to use in their own projects.
 *
 * Parses: oklch(), hex (#fff, #ffffff, #ffffffff), rgba(), rgb(), hsl(), hsla()
 */

interface ExtractedColor {
  raw: string;       // e.g. "oklch(0.696 0.149 162.48)" or "#10b981"
  type: "oklch" | "hex" | "rgb" | "hsl";
  display: string;   // shortened for display
}

function extractColors(css: string): ExtractedColor[] {
  const colors: ExtractedColor[] = [];
  const seen = new Set<string>();

  // OKLCH: oklch(0.696 0.149 162.48) or oklch(0.696 0.149 162.48 / 0.3)
  const oklchMatches = css.matchAll(/oklch\([^)]+\)/gi);
  for (const m of oklchMatches) {
    const raw = m[0];
    if (!seen.has(raw)) {
      seen.add(raw);
      colors.push({ raw, type: "oklch", display: raw.length > 30 ? raw.substring(0, 28) + "…" : raw });
    }
  }

  // Hex: #fff, #ffffff, #ffffffff (but not in comments)
  const hexMatches = css.matchAll(/(?<!["'\w])#([0-9a-fA-F]{3,8})\b/g);
  for (const m of hexMatches) {
    const raw = m[0];
    if (!seen.has(raw)) {
      seen.add(raw);
      colors.push({ raw, type: "hex", display: raw });
    }
  }

  // rgba/rgb: rgba(16, 185, 129, 0.3) or rgb(16, 185, 129)
  const rgbMatches = css.matchAll(/rgba?\([^)]+\)/gi);
  for (const m of rgbMatches) {
    const raw = m[0];
    if (!seen.has(raw)) {
      seen.add(raw);
      colors.push({ raw, type: "rgb", display: raw.length > 25 ? raw.substring(0, 23) + "…" : raw });
    }
  }

  // hsl/hsla
  const hslMatches = css.matchAll(/hsla?\([^)]+\)/gi);
  for (const m of hslMatches) {
    const raw = m[0];
    if (!seen.has(raw)) {
      seen.add(raw);
      colors.push({ raw, type: "hsl", display: raw.length > 25 ? raw.substring(0, 23) + "…" : raw });
    }
  }

  return colors;
}

function colorToSwatchStyle(color: ExtractedColor): string {
  // For OKLCH with alpha, use as-is. For hex/rgb, use as-is.
  if (color.type === "oklch") return color.raw;
  if (color.type === "hex") return color.raw;
  if (color.type === "rgb") return color.raw;
  if (color.type === "hsl") return color.raw;
  return "#888";
}

export function ColorPaletteExtractor({ onSelectEffect }: { onSelectEffect: (effect: CSSEffect) => void }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(effects[0]?.id ?? null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const selectedEffect = useMemo(
    () => effects.find(e => e.id === selectedId) ?? effects[0],
    [selectedId],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return effects.slice(0, 30);
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q)).slice(0, 30);
  }, [search]);

  const colors = useMemo(
    () => selectedEffect ? extractColors(selectedEffect.cssCode) : [],
    [selectedEffect],
  );

  const handleCopy = useCallback(async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch { /* noop */ }
  }, []);

  if (!selectedEffect) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Effect selector */}
      <div className="space-y-2">
        <Input
          type="search"
          placeholder="Search effects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
        <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-0.5">
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-all cursor-pointer text-left ${selectedId === e.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"}`}
            >
              <div className="flex items-center justify-center size-8 rounded bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                <div className="scale-[0.35] origin-center"><LivePreview effect={e} /></div>
              </div>
              <span className="text-xs font-medium text-foreground truncate">{e.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Palette display */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Palette className="size-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{selectedEffect.name}</h4>
          <span className="text-xs text-muted-foreground">({colors.length} colors)</span>
        </div>

        {colors.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No colors found in this effect.</p>
        ) : (
          <div className="space-y-1.5">
            {colors.map((color, i) => (
              <button
                key={i}
                onClick={() => handleCopy(color.raw)}
                className="w-full flex items-center gap-2 p-1.5 rounded-lg border border-border/40 hover:border-primary/40 transition-all cursor-pointer group"
              >
                {/* Swatch */}
                <div
                  className="size-8 rounded-md border border-border/50 shrink-0"
                  style={{ background: colorToSwatchStyle(color) }}
                />
                {/* Color value */}
                <code className="text-xs font-mono text-foreground/80 truncate flex-1">{color.display}</code>
                {/* Type badge */}
                <span className="text-[9px] uppercase font-bold text-muted-foreground shrink-0">{color.type}</span>
                {/* Copy icon */}
                {copiedColor === color.raw ? (
                  <Check className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* View effect button */}
        <button
          onClick={() => onSelectEffect(selectedEffect)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-medium cursor-pointer"
        >
          View effect details →
        </button>
      </div>
    </div>
  );
}
