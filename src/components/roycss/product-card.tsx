"use client";

/**
 * ProductCard — reusable card for the 62 platform products.
 *
 * Reads a single `ProductEntry` from `src/lib/product-registry.ts` (the
 * single source of truth) and renders:
 *   - icon + name
 *   - category badge, tier badge, status badge
 *   - short description (≤ 80 chars)
 *   - CTA button (uses <Link> for internal href, <a> for external,
 *     <button> for actions)
 *   - quality score badge (computed via `src/lib/effect-quality.ts`)
 *
 * Hover effect: subtle lift + primary border glow.
 *
 * The card is a controlled component — it does NOT manage modal state.
 * The parent grid decides what "open" means (pass `onOpen`).
 */

import { memo, useMemo } from "react";
import Link from "next/link";
import {
  Grid3x3,
  KanbanSquare,
  Calendar,
  BarChart3,
  Blocks,
  Package,
  LayoutGrid,
  Building2,
  Store,
  Plug,
  FormInput,
  BookOpen,
  Layers,
  Palette,
  Type,
  Sparkles,
  Shapes,
  Accessibility,
  Bot,
  Wrench,
  Code2,
  Search,
  LineChart,
  GraduationCap,
  Trophy,
  Award,
  Users,
  Shield,
  BrainCircuit,
  Hammer,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PRODUCT_TIER_META,
  PRODUCT_STATUS_META,
  PRODUCT_CATEGORIES,
  type ProductEntry,
} from "@/lib/product-registry";
import {
  computeQualityScore,
  scoreToGrade,
  gradeToClassName,
} from "@/lib/effect-quality";

/* ═══════════════════════════════════════════════════════════════
   ICON MAP — resolve string icon names from the registry to Lucide
   components. Curated to the ~30 icons used across the 62 products.
   ═══════════════════════════════════════════════════════════════ */

const PRODUCT_ICON_MAP: Record<string, LucideIcon> = {
  Grid3x3,
  KanbanSquare,
  Calendar,
  BarChart3,
  Blocks,
  Package,
  LayoutGrid,
  Building2,
  Store,
  Plug,
  FormInput,
  BookOpen,
  Layers,
  Palette,
  Type,
  Sparkles,
  Shapes,
  Accessibility,
  Bot,
  Wrench,
  Code2,
  Search,
  LineChart,
  GraduationCap,
  Trophy,
  Award,
  Users,
  Shield,
  BrainCircuit,
  Hammer,
};

/** Resolve a string icon name to a Lucide component, fallback to Layers. */
export function resolveProductIcon(name: string): LucideIcon {
  return PRODUCT_ICON_MAP[name] ?? Layers;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export interface ProductCardProps {
  product: ProductEntry;
  /** Called when the user clicks the card or its primary CTA action button. */
  onOpen?: (product: ProductEntry) => void;
  /** Visual variant — `compact` for grids, `featured` for hero spots. */
  variant?: "compact" | "featured";
  /** Optional extra className merged onto the card root. */
  className?: string;
  /** Tab index for keyboard navigation. */
  tabIndex?: number;
}

function ProductCardImpl({
  product,
  onOpen,
  variant = "compact",
  className,
  tabIndex,
}: ProductCardProps) {
  const Icon = resolveProductIcon(product.icon);
  const tierMeta = PRODUCT_TIER_META[product.tier];
  const statusMeta = PRODUCT_STATUS_META[product.status];
  const categoryMeta = PRODUCT_CATEGORIES.find((c) => c.id === product.category);

  const qualityGrade = useMemo(() => {
    const score = computeQualityScore({
      status: product.status,
      tier: product.tier,
      descriptionLength: product.shortDescription.length,
      tagCount: product.tags.length,
      hasMetrics: Boolean(product.metrics),
    });
    return { grade: scoreToGrade(score), score };
  }, [product]);

  const isFeatured = variant === "featured";
  const ctaIsInternalHref =
    product.cta.href && product.cta.href.startsWith("/");
  const ctaIsExternalHref =
    product.cta.href && !product.cta.href.startsWith("/");

  const handleClick = () => {
    if (onOpen && (product.cta.action || !product.cta.href)) {
      onOpen(product);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-5 cursor-pointer perf-auto",
        "border-border bg-card transition-all duration-200",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
        "hover:-translate-y-1 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/30",
        isFeatured && "p-6 sm:p-7",
        className,
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onOpen) {
          e.preventDefault();
          onOpen(product);
        }
      }}
      role="button"
      tabIndex={tabIndex ?? 0}
      aria-label={`Open ${product.name}`}
    >
      {/* ── Hover border-glow ring (pure CSS, no JS) ────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklch, var(--primary) 18%, transparent), transparent 65%)",
        }}
      />

      {/* ── Header: icon + name + chevron ─────────────────────── */}
      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 transition-colors",
              "group-hover:bg-primary/20 group-hover:scale-105",
              isFeatured ? "size-12" : "size-10",
            )}
          >
            <Icon className={isFeatured ? "size-6" : "size-5"} />
          </div>
          <div className="min-w-0">
            <h3
              className={cn(
                "font-display font-bold text-foreground leading-tight truncate",
                isFeatured ? "text-base sm:text-lg" : "text-sm",
              )}
            >
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                  statusMeta.className,
                )}
              >
                {statusMeta.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                  tierMeta.className,
                )}
              >
                {tierMeta.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                  gradeToClassName(qualityGrade.grade),
                )}
                title={`Quality score: ${qualityGrade.score}/100`}
              >
                {qualityGrade.grade}
                <span className="ml-0.5 opacity-70 tabular-nums">
                  {qualityGrade.score}
                </span>
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>

      {/* ── Description ────────────────────────────────────────── */}
      <p
        className={cn(
          "relative text-muted-foreground line-clamp-2 leading-relaxed flex-1",
          isFeatured ? "text-sm" : "text-xs",
        )}
      >
        {product.shortDescription}
      </p>

      {/* ── Footer: category badge + CTA ───────────────────────── */}
      <div className="relative flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/50">
        <Badge
          variant="secondary"
          className="text-[10px] bg-muted/60 text-muted-foreground"
          title={categoryMeta?.description}
        >
          {categoryMeta?.label ?? product.category}
        </Badge>

        {/* CTA — <Link> for internal href, <a> for external, <button> otherwise */}
        {ctaIsInternalHref && product.cta.href ? (
          <Link
            href={product.cta.href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {product.cta.label}
            <ChevronRight className="size-3" />
          </Link>
        ) : ctaIsExternalHref && product.cta.href ? (
          <a
            href={product.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {product.cta.label}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary"
          >
            {product.cta.label}
            <ChevronRight className="size-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export const ProductCard = memo(ProductCardImpl);
export default ProductCard;
