"use client";

import { useState, useRef, useCallback, memo } from "react";
import { motion, useInView } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp, Code2, Eye, Heart } from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-types";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════
   LIVE PREVIEW RENDERER
   Handles all preview types: box, text, button, loader, card, background
   ═══════════════════════════════════════════════════════════════ */

export function LivePreview({ effect }: { effect: CSSEffect }) {
  const className = `roycss-${effect.id}`;
  const previewText = effect.previewText || "RoyCSS";

  switch (effect.previewType) {
    case "text":
      return <TextPreview effect={effect} className={className} text={previewText} />;
    case "button":
      return <ButtonPreview effect={effect} className={className} text={previewText} />;
    case "loader":
      return <LoaderPreview effect={effect} className={className} />;
    case "card":
      return <CardPreview effect={effect} className={className} />;
    case "background":
      return <BackgroundPreview effect={effect} className={className} />;
    default:
      return <BoxPreview effect={effect} className={className} />;
  }
}

/* ─── Box Preview (animations, hover, 3d-transforms, borders) ─── */
function BoxPreview({
  effect,
  className,
}: {
  effect: CSSEffect;
  className: string;
}) {
  // Special case: cube-rotate needs 6 faces
  if (effect.id === "cube-rotate") {
    return (
      <div className="flex items-center justify-center h-full" style={{ perspective: 600 }}>
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

  // Special case: shake effect — apply infinite animation for demo
  if (effect.id === "shake") {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
          style={{ animation: "roy-shake 0.5s ease-in-out infinite" }}
        >
          <div className="w-6 h-6 rounded-lg bg-primary/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className={`${className} w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center`}
      >
        <div className="w-6 h-6 rounded-lg bg-primary/60" />
      </div>
    </div>
  );
}

/* ─── Text Preview (text effects) ───────────────────────────── */
function TextPreview({
  effect,
  className,
  text,
}: {
  effect: CSSEffect;
  className: string;
  text: string;
}) {
  // Glitch text needs data-text attribute
  if (effect.id === "text-glitch") {
    return (
      <div className="flex items-center justify-center h-full">
        <span
          className={`${className} text-2xl font-display font-bold text-foreground`}
          data-text={text}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full px-4">
      <span className={`${className} text-2xl font-display font-bold`}>
        {text}
      </span>
    </div>
  );
}

/* ─── Button Preview (button effects) ───────────────────────── */
function ButtonPreview({
  effect,
  className,
  text,
}: {
  effect: CSSEffect;
  className: string;
  text: string;
}) {
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
        className={className}
      >
        {text}
      </button>
    </div>
  );
}

/* ─── Loader Preview (loading indicators) ───────────────────── */
function LoaderPreview({
  effect,
  className,
}: {
  effect: CSSEffect;
  className: string;
}) {
  const childCount = effect.childCount || 0;

  return (
    <div className="flex items-center justify-center h-full">
      <div className={className}>
        {childCount > 0 &&
          Array.from({ length: childCount }).map((_, i) => (
            <span key={i} />
          ))}
      </div>
    </div>
  );
}

/* ─── Card Preview (card effects) ───────────────────────────── */
function CardPreview({
  effect,
  className,
}: {
  effect: CSSEffect;
  className: string;
}) {
  // Card flip needs front/back structure
  if (effect.id === "card-flip") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`${className} w-36 h-24`}>
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

  // Gradient border card needs inner content
  if (effect.id === "card-gradient-border") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`${className} w-36 h-24`}>
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
        className={`${className} w-36 h-24 flex items-center justify-center`}
      >
        <span className="text-xs text-muted-foreground relative z-10">
          {effect.name}
        </span>
      </div>
    </div>
  );
}

/* ─── Background Preview (backgrounds, filters) ─────────────── */
function BackgroundPreview({
  effect,
  className,
}: {
  effect: CSSEffect;
  className: string;
}) {
  const childCount = effect.childCount || 0;
  return (
    <div className="w-full h-full">
      <div
        className={`${className} w-full h-full rounded-lg flex items-end p-3`}
      >
        {childCount > 0 &&
          Array.from({ length: childCount }).map((_, i) => (
            <span key={i} />
          ))}
        <span className="text-xs text-white/70 font-medium relative z-10">
          {effect.name}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EFFECT CARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const EffectCard = memo(function EffectCard({
  effect,
  index,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: {
  effect: CSSEffect;
  index: number;
  onClick?: (effect: CSSEffect) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

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
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      onClick={() => onClick?.(effect)}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer perf-auto"
    >
      {/* Preview Area */}
      <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
        <LivePreview effect={effect} />
        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(effect.id);
          }}
          className="absolute top-3 right-3 flex items-center justify-center size-11 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-all cursor-pointer z-10"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <motion.span
            animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart
              className={`size-3.5 transition-colors ${
                isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-rose-500"
              }`}
            />
          </motion.span>
        </button>
        {/* Live badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-background/80 backdrop-blur-sm border-border/50"
          >
            <Eye className="size-3 mr-1" />
            Live
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge
            variant="outline"
            className="text-xs px-2 py-0.5 bg-background/80 backdrop-blur-sm border-border/50"
          >
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
              className="text-xs px-1.5 py-0 bg-muted/80 text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Code Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCode(!showCode);
          }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background transition-all z-10 cursor-pointer"
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
              <pre className="p-3 pt-2 overflow-x-auto text-xs leading-relaxed scrollbar-thin max-h-52 overflow-y-auto">
                <code className="text-foreground/80 font-mono">
                  {effect.cssCode}
                </code>
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});