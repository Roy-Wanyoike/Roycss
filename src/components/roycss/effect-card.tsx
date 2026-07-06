"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp, Code2, Eye } from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-effects";
import { Badge } from "@/components/ui/badge";

/* ─── Live Preview Renderer ─────────────────────────────────── */

function LivePreview({ effect }: { effect: CSSEffect }) {
  switch (effect.previewType) {
    case "text":
      return <TextPreview effect={effect} />;
    case "button":
      return <ButtonPreview effect={effect} />;
    case "loader":
      return <LoaderPreview effect={effect} />;
    case "card":
      return <CardPreview effect={effect} />;
    case "background":
      return <BackgroundPreview effect={effect} />;
    default:
      return <BoxPreview effect={effect} />;
  }
}

function BoxPreview({ effect }: { effect: CSSEffect }) {
  if (effect.id === "cube-rotate") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="roycss-cube-rotate" style={{ transformStyle: "preserve-3d" }}>
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
    <div className="flex items-center justify-center h-full">
      <div
        className={`${effect.id === "shake" ? "" : "roycss-" + effect.id} w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center`}
        style={effect.id === "shake" ? { animation: "roy-shake 0.5s ease-in-out infinite" } : undefined}
      >
        <div className="w-6 h-6 rounded-lg bg-primary/60" />
      </div>
    </div>
  );
}

function TextPreview({ effect }: { effect: CSSEffect }) {
  if (effect.id === "text-glitch") {
    return (
      <div className="flex items-center justify-center h-full">
        <span
          className="roycss-text-glitch text-2xl font-display font-bold text-foreground"
          data-text="RoyCSS"
        >
          RoyCSS
        </span>
      </div>
    );
  }
  if (effect.id === "text-typing-cursor") {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="roycss-typing-cursor text-2xl font-display font-bold text-foreground">
          RoyCSS
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-full">
      <span className={`roycss-${effect.id} text-2xl font-display font-bold`}>
        RoyCSS
      </span>
    </div>
  );
}

function ButtonPreview({ effect }: { effect: CSSEffect }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (effect.id !== "btn-ripple") return;
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement("span");
      ripple.className = "ripple-circle";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    },
    [effect.id]
  );

  return (
    <div className="flex items-center justify-center h-full">
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`roycss-${effect.id} px-6 py-2.5 rounded-xl font-medium text-sm cursor-pointer ${
          effect.id === "btn-fill-slide"
            ? "border-2 border-primary text-primary bg-transparent"
            : "bg-primary text-primary-foreground"
        }`}
      >
        Hover Me
      </button>
    </div>
  );
}

function LoaderPreview({ effect }: { effect: CSSEffect }) {
  if (effect.id === "loader-dots") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="roycss-loader-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
  if (effect.id === "loader-bars") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="roycss-loader-bars">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-full">
      <div className={`roycss-${effect.id}`} />
    </div>
  );
}

function CardPreview({ effect }: { effect: CSSEffect }) {
  if (effect.id === "card-flip") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="roycss-card-flip w-36 h-24">
          <div className="roycss-card-flip-inner">
            <div className="roycss-card-flip-front bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <span className="text-xs font-medium text-foreground">Front</span>
            </div>
            <div className="roycss-card-flip-back bg-primary text-primary-foreground">
              <span className="text-xs font-medium">Back</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (effect.id === "card-spotlight") {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="roycss-card-spotlight w-36 h-24 bg-card flex items-center justify-center"
        >
          <span className="text-xs text-muted-foreground relative z-10">Hover me</span>
        </div>
      </div>
    );
  }

  if (effect.id === "card-gradient-border") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="roycss-card-gradient-border w-36 h-24">
          <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center relative z-10">
            <span className="text-xs text-muted-foreground">Gradient</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className={`roycss-${effect.id} w-36 h-24 flex items-center justify-center ${
          effect.id === "card-neon" ? "" : "bg-card"
        }`}
      >
        <span className="text-xs text-muted-foreground relative z-10">
          {effect.id === "card-glass" ? "Glass" : "Neon"}
        </span>
      </div>
    </div>
  );
}

function BackgroundPreview({ effect }: { effect: CSSEffect }) {
  return (
    <div className="w-full h-full">
      <div className={`roycss-${effect.id} w-full h-full rounded-lg flex items-end p-3`}>
        <span className="text-[10px] text-white/60 font-medium">{effect.name}</span>
      </div>
    </div>
  );
}

/* ─── Effect Card Component ─────────────────────────────────── */

export function EffectCard({ effect, index }: { effect: CSSEffect; index: number }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(effect.cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-300"
    >
      {/* Preview Area */}
      <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
        <LivePreview effect={effect} />
        {/* Hover overlay badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-background/80 backdrop-blur-sm border-border/50">
            <Eye className="size-3 mr-1" />
            Live
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-background/80 backdrop-blur-sm border-border/50">
            <Code2 className="size-3 mr-1" />
            CSS
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-foreground text-sm truncate">
              {effect.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {effect.description}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {effect.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-muted/80 text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Code Toggle */}
        <button
          onClick={() => setShowCode(!showCode)}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
        >
          {showCode ? (
            <>
              <ChevronUp className="size-3.5" />
              Hide Code
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              View CSS Code
            </>
          )}
        </button>

        {/* Code Block */}
        {showCode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative mt-2"
          >
            <div className="relative rounded-xl bg-muted/80 border border-border/50 overflow-hidden">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background transition-all z-10 cursor-pointer"
                aria-label="Copy CSS code"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy
                  </>
                )}
              </button>
              <pre className="p-3 pt-2 overflow-x-auto text-[11px] leading-relaxed scrollbar-thin max-h-52 overflow-y-auto">
                <code className="text-foreground/80 font-mono">{effect.cssCode}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}