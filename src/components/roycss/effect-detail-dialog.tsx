"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Sun,
  Moon,
  Palette,
  Code2,
  Play,
  Tag,
  Sparkles,
  GitCompare,
} from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { effects, categoryMeta } from "@/lib/roycss-effects";
import { ColorCustomizer } from "@/components/roycss/color-customizer";
import { FrameworkUsage } from "@/components/roycss/framework-usage";

/* ═══════════════════════════════════════════════════════════════
   LIVE PREVIEW (reused from effect-card, adapted for large size)
   ═══════════════════════════════════════════════════════════════ */

function LargePreview({
  effect,
  customCSS,
  bgType,
}: {
  effect: CSSEffect;
  customCSS: string;
  bgType: "dark" | "light" | "gradient";
}) {
  const className = `roycss-${effect.id}`;
  const previewText = effect.previewText || "RoyCSS";
  const styleId = `roycss-preview-${effect.id}`;

  // Inject custom CSS into a scoped style tag
  useEffect(() => {
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = customCSS;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [customCSS, styleId]);

  const bgClass =
    bgType === "dark"
      ? "bg-slate-950"
      : bgType === "light"
      ? "bg-slate-100"
      : "bg-gradient-to-br from-violet-500/30 via-emerald-500/30 to-cyan-500/30";

  return (
    <div className={`relative w-full h-64 sm:h-80 ${bgClass} rounded-2xl overflow-hidden flex items-center justify-center p-6`}>
      <PreviewContent effect={effect} className={className} text={previewText} />
    </div>
  );
}

function PreviewContent({
  effect,
  className,
  text,
}: {
  effect: CSSEffect;
  className: string;
  text: string;
}) {
  const childCount = effect.childCount || 0;

  switch (effect.previewType) {
    case "text":
      if (effect.id === "text-glitch") {
        return (
          <span className={`${className} text-4xl font-display font-bold text-foreground`} data-text={text}>
            {text}
          </span>
        );
      }
      return (
        <span className={`${className} text-4xl font-display font-bold`}>{text}</span>
      );

    case "button":
      return (
        <button className={className} type="button">
          {text}
        </button>
      );

    case "loader":
      return (
        <div className={className}>
          {childCount > 0 && Array.from({ length: childCount }).map((_, i) => <span key={i} />)}
        </div>
      );

    case "card":
      if (effect.id === "card-flip") {
        return (
          <div className={`${className} w-48 h-32`}>
            <div className="roycss-card-flip-inner">
              <div className="roycss-card-flip-front bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <span className="text-sm font-medium text-foreground">Front</span>
              </div>
              <div className="roycss-card-flip-back bg-primary text-primary-foreground">
                <span className="text-sm font-medium">Back</span>
              </div>
            </div>
          </div>
        );
      }
      if (effect.id === "card-gradient-border") {
        return (
          <div className={`${className} w-48 h-32`}>
            <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center relative z-10">
              <span className="text-sm text-muted-foreground">Gradient</span>
            </div>
          </div>
        );
      }
      return (
        <div className={`${className} w-48 h-32 flex items-center justify-center`}>
          <span className="text-sm text-muted-foreground relative z-10">{effect.name}</span>
        </div>
      );

    case "background":
      return (
        <div className="w-full h-full">
          <div className={`${className} w-full h-full rounded-lg flex items-end p-4`}>
            {childCount > 0 && Array.from({ length: childCount }).map((_, i) => <span key={i} />)}
            <span className="text-xs text-white/70 font-medium relative z-10">{effect.name}</span>
          </div>
        </div>
      );

    default:
      if (effect.id === "cube-rotate") {
        return (
          <div style={{ perspective: 600 }}>
            <div className={className} style={{ transformStyle: "preserve-3d" }}>
              <div className="roycss-cube-face" style={{ transform: "rotateY(0deg) translateZ(30px)" }} />
              <div className="roycss-cube-face" style={{ transform: "rotateY(90deg) translateZ(30px)" }} />
              <div className="roycss-cube-face" style={{ transform: "rotateY(180deg) translateZ(30px)" }} />
              <div className="roycss-cube-face" style={{ transform: "rotateY(-90deg) translateZ(30px)" }} />
              <div className="roycss-cube-face" style={{ transform: "rotateX(90deg) translateZ(30px)" }} />
              <div className="roycss-cube-face" style={{ transform: "rotateX(-90deg) translateZ(30px)" }} />
            </div>
          </div>
        );
      }
      return (
        <div className={`${className} w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center`}>
          <div className="w-8 h-8 rounded-lg bg-primary/60" />
        </div>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════
   SYNTAX HIGHLIGHTER (simple CSS highlighting)
   ═══════════════════════════════════════════════════════════════ */

function highlightCSS(code: string): { text: string; cls: string }[] {
  // Tokenize CSS into segments with color classes
  const tokens: { text: string; cls: string }[] = [];
  const len = code.length;
  let i = 0;

  const colors: Record<string, string> = {
    comment: "color:#6b7280;font-style:italic",
    atrule: "color:#c084fc;font-weight:600",
    selector: "color:#34d399",
    property: "color:#34d399",
    number: "color:#fb923c",
    hex: "color:#f472b6",
    func: "color:#60a5fa",
    string: "color:#f472b6",
    punctuation: "color:#9ca3af",
    text: "color:#d1d5db",
  };

  while (i < len) {
    // Comment
    if (code[i] === "/" && code[i + 1] === "*") {
      let end = code.indexOf("*/", i + 2);
      if (end === -1) end = len;
      else end += 2;
      tokens.push({ text: code.slice(i, end), cls: colors.comment });
      i = end;
      continue;
    }
    // At-rule
    if (code[i] === "@") {
      let j = i + 1;
      while (j < len && /[\w-]/.test(code[j])) j++;
      tokens.push({ text: code.slice(i, j), cls: colors.atrule });
      i = j;
      continue;
    }
    // Hex color
    if (code[i] === "#") {
      let j = i + 1;
      while (j < len && /[0-9a-fA-F]/.test(code[j])) j++;
      if (j - i >= 4) {
        tokens.push({ text: code.slice(i, j), cls: colors.hex });
        i = j;
        continue;
      }
    }
    // Function name (word followed by "(")
    let j = i;
    while (j < len && /[\w-]/.test(code[j])) j++;
    if (j > i && code[j] === "(") {
      tokens.push({ text: code.slice(i, j), cls: colors.func });
      i = j;
      continue;
    }
    // Property (word followed by ":")
    if (j > i && code[j] === ":") {
      tokens.push({ text: code.slice(i, j), cls: colors.property });
      i = j;
      continue;
    }
    // Number with optional unit
    if (/[\d.-]/.test(code[i]) && (i === 0 || !/[\w]/.test(code[i - 1]))) {
      let j = i;
      while (j < len && /[\d.-]/.test(code[j])) j++;
      // optional unit
      let u = j;
      while (u < len && /[a-z%]/.test(code[u])) u++;
      if (u > j) j = u;
      tokens.push({ text: code.slice(i, j), cls: colors.number });
      i = j;
      continue;
    }
    // url(...) string
    if (code.slice(i, i + 4) === "url(") {
      let end = code.indexOf(")", i);
      if (end === -1) end = len;
      else end++;
      tokens.push({ text: code.slice(i, end), cls: colors.string });
      i = end;
      continue;
    }
    // Punctuation
    if (/[{};:,()]/.test(code[i])) {
      tokens.push({ text: code[i], cls: colors.punctuation });
      i++;
      continue;
    }
    // Default text (whitespace, selectors, etc.)
    {
      let k = i;
      while (
        k < len &&
        !/[/@#{};:(),]/.test(code[k]) &&
        !/[\d.-]/.test(code[k]) &&
        code.slice(k, k + 2) !== "/*"
      ) {
        k++;
      }
      if (k === i) k++;
      tokens.push({ text: code.slice(i, k), cls: colors.text });
      i = k;
    }
  }
  return tokens;
}

function HighlightedCode({ code }: { code: string }) {
  const tokens = highlightCSS(code);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={t.cls ? { color: t.cls.match(/color:([^;]+)/)?.[1] || "#d1d5db" } : undefined}>
          {t.text}
        </span>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RELATED EFFECTS
   ═══════════════════════════════════════════════════════════════ */

function RelatedEffects({
  effect,
  onSelect,
}: {
  effect: CSSEffect;
  onSelect: (e: CSSEffect) => void;
}) {
  const related = useMemo(() => {
    // Find effects in same category, prioritizing shared tags
    const same = effects.filter(
      (e) => e.category === effect.category && e.id !== effect.id
    );
    const scored = same.map((e) => {
      const sharedTags = e.tags.filter((t) => effect.tags.includes(t)).length;
      return { e, score: sharedTags };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.e);
  }, [effect]);

  if (related.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary" />
        Related Effects
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {related.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e)}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-muted/50 transition-all text-left cursor-pointer group"
          >
            <div className="size-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <div
                className={`roycss-${e.id} scale-50 origin-center`}
                style={{ width: 18, height: 18 }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{e.name}</p>
              <p className="text-xs text-muted-foreground truncate">{categoryMeta[e.category].label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DIALOG COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface EffectDetailDialogProps {
  effect: CSSEffect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEffect: (effect: CSSEffect) => void;
  onCompare?: (effect: CSSEffect) => void;
}

export function EffectDetailDialog({
  effect,
  open,
  onOpenChange,
  onSelectEffect,
  onCompare,
}: EffectDetailDialogProps) {
  const [editedCSS, setEditedCSS] = useState(effect?.cssCode ?? "");
  const [copied, setCopied] = useState(false);
  const [bgType, setBgType] = useState<"dark" | "light" | "gradient">("dark");
  const [isEditing, setIsEditing] = useState(false);
  // Track the previous effect ID so we can reset editable state when the
  // user switches to a different effect (React "adjust state during render"
  // pattern — avoids useEffect + setState which triggers cascading renders).
  const [prevEffectId, setPrevEffectId] = useState(effect?.id);

  if (effect && effect.id !== prevEffectId) {
    setPrevEffectId(effect.id);
    setEditedCSS(effect.cssCode);
    setIsEditing(false);
    setBgType("dark");
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedCSS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const handleReset = () => {
    if (effect) setEditedCSS(effect.cssCode);
  };

  // Called by ColorCustomizer whenever the recolored CSS changes.
  // We always pass the ORIGINAL effect CSS to the customizer (not editedCSS)
  // so OKLCH hue rotations don't compound on each successive color pick.
  const handleApplyColor = useCallback((recoloredCss: string) => {
    setEditedCSS(recoloredCss);
  }, []);

  if (!effect) return null;

  const isModified = editedCSS !== effect.cssCode;
  const meta = categoryMeta[effect.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{effect.name}</DialogTitle>
          <DialogDescription>{effect.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          {/* Top bar: name + category + close */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-foreground truncate">
                  {effect.name}
                </h2>
                <p className="text-xs text-muted-foreground truncate">{effect.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {meta.label}
              </Badge>
              {onCompare && (
                <button
                  onClick={() => { onCompare(effect); onOpenChange(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                  aria-label="Compare this effect"
                  title="Add to comparison"
                >
                  <GitCompare className="size-3.5" />
                  <span className="hidden sm:inline">Compare</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto scrollbar-thin flex-1">
            {/* Live Preview */}
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="size-3" />
                  Live Preview
                </span>
                {/* Background toggle */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/80">
                  <button
                    onClick={() => setBgType("dark")}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      bgType === "dark" ? "bg-slate-900 text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Moon className="size-2.5" />
                    Dark
                  </button>
                  <button
                    onClick={() => setBgType("light")}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      bgType === "light" ? "bg-white text-slate-900 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sun className="size-2.5" />
                    Light
                  </button>
                  <button
                    onClick={() => setBgType("gradient")}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      bgType === "gradient" ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Palette className="size-2.5" />
                    Color
                  </button>
                </div>
              </div>
              <LargePreview effect={effect} customCSS={editedCSS} bgType={bgType} />
            </div>

            {/* Tags */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                <Tag className="size-2.5" />
                Tags:
              </span>
              {effect.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 bg-muted/80 text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator className="opacity-50" />

            {/* Color Customizer
                key={effect.id} forces a clean remount when switching effects,
                resetting the selected color so each effect starts unmodified.
                cssCode={effect.cssCode} (the ORIGINAL) ensures rotations never
                compound — every color pick rotates fresh from the source hue. */}
            <div className="p-4">
              <ColorCustomizer
                key={effect.id}
                cssCode={effect.cssCode}
                onApply={handleApplyColor}
              />
            </div>

            <Separator className="opacity-50" />

            {/* CSS Code Editor */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="size-3" />
                  CSS Code
                  {isModified && (
                    <Badge variant="outline" className="text-xs px-1 py-0 border-amber-500/50 text-amber-500 ml-1">
                      Modified
                    </Badge>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isEditing
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isEditing ? "Editing" : "Edit"}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={!isModified}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <RotateCcw className="size-2.5" />
                    Reset
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="size-2.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-2.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  value={editedCSS}
                  onChange={(e) => setEditedCSS(e.target.value)}
                  className="w-full h-72 p-3 rounded-xl bg-muted/80 border border-border/50 text-xs font-mono text-foreground leading-relaxed resize-none focus:outline-none focus:border-primary/50 scrollbar-thin"
                  spellCheck={false}
                />
              ) : (
                <div className="relative rounded-xl bg-muted/80 border border-border/50 overflow-hidden">
                  <pre className="p-3 overflow-x-auto text-xs leading-relaxed scrollbar-thin max-h-72 overflow-y-auto">
                    <code className="font-mono">
                      <HighlightedCode code={editedCSS} />
                    </code>
                  </pre>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {isEditing
                  ? "Edit the CSS above — the preview updates live. Click Copy to save your version."
                  : "Click Edit to customize this effect. Changes preview live."}
              </p>
            </div>

            <Separator className="opacity-50" />

            {/* Framework Usage */}
            <div className="p-4">
              <FrameworkUsage effectId={effect.id} effectName={effect.name} />
            </div>

            <Separator className="opacity-50" />

            {/* Related Effects */}
            <div className="p-4">
              <RelatedEffects effect={effect} onSelect={onSelectEffect} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
