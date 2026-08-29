"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductEntry, ProductStatus, ProductTier } from "@/lib/product-registry";

const TIER_BADGE: Record<ProductTier, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pro: { label: "Pro", className: "bg-primary/15 text-primary border-primary/25" },
  enterprise: { label: "Enterprise", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25" },
  cloud: { label: "Cloud", className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25" },
};

const STATUS_DOT: Record<ProductStatus, string> = {
  ready: "bg-emerald-500",
  beta: "bg-amber-500",
  experimental: "bg-violet-500",
  roadmap: "bg-muted-foreground/40",
};

interface ProductCardProps {
  product: ProductEntry;
  onOpen?: (product: ProductEntry) => void;
}

/**
 * ProductCard — single product tile.
 *
 * Visual: icon + name + tier badge + status dot + description + CTA.
 * Hover: lift + primary border glow (via `hover:-translate-y-1` + `ring-primary/40`).
 */
export function ProductCard({ product, onOpen }: ProductCardProps) {
  // Resolve the lucide icon dynamically. Falls back to "Sparkle".
  const IconComp = ((Icons as unknown) as Record<string, React.ComponentType<{ className?: string }>>)[product.icon] ?? Icons.Sparkle;
  const tierBadge = TIER_BADGE[product.tier];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      onClick={() => onOpen?.(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(product);
        }
      }}
      className={cn(
        "group relative flex flex-col gap-3 p-4 sm:p-5 text-start rounded-2xl",
        "bg-card/80 backdrop-blur-sm border border-border",
        "hover:border-primary/40 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "cursor-pointer min-h-[180px]",
      )}
      aria-label={`${product.name} — ${product.shortDescription}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center size-10 rounded-xl shrink-0",
              "bg-primary/10 text-primary border border-primary/20",
              "group-hover:bg-primary/20 group-hover:scale-105 transition-all",
            )}
          >
            <IconComp className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{product.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn("size-1.5 rounded-full", STATUS_DOT[product.status])}
                aria-hidden
              />
              <span className="text-[11px] capitalize text-muted-foreground">{product.status}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 text-[10px] font-semibold px-1.5 py-0", tierBadge.className)}>
          {tierBadge.label}
        </Badge>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 flex-1">
        {product.shortDescription}
      </p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-muted-foreground/80 px-1.5 py-0.5 rounded-md bg-muted/60">
              {tag}
            </span>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          tabIndex={-1}
        >
          {product.cta}
        </Button>
      </div>
    </motion.button>
  );
}
