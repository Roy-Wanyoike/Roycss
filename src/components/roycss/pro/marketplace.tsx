"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * Marketplace — RoyCSS template marketplace showcase.
 *
 * Self-contained (no props). Twelve mock templates with rich metadata
 * rendered in a responsive card grid. Features:
 *
 *   • Search bar — case-insensitive filter on template name.
 *   • Category filter chips — All / Dashboard / Landing / Admin /
 *     E-commerce / Portfolio / Documentation (single-select toggle).
 *   • Price filter — All / Free / Paid (segmented).
 *   • Sort — Popular (downloads desc) / Newest (createdAt desc) /
 *     Rating (rating desc) / Price (low → high).
 *   • Stats header — "N templates · M free · K paid · Avg rating X.X stars".
 *   • Card click — opens a Dialog detail view with description, full
 *     feature list, large preview thumbnail, and Install / Preview
 *     buttons. Install + Preview fire shadcn toasts ("Installing..." /
 *     "Opening preview...") via the app-wide `useToast` hook.
 *
 * Each template card shows:
 *   • A gradient thumbnail with the template name overlaid as the
 *     "preview" (gradients use the approved palette — emerald, teal,
 *     cyan, amber, rose, violet — no indigo/blue).
 *   • Category badge (color-coded per category).
 *   • Price (Free or $X).
 *   • Author name.
 *   • Downloads count (compact, e.g. "12.8K").
 *   • Star rating (1–5, supports half-stars via a width-clipped overlay).
 *
 * Filtering + sorting is fully memoized. TS strict, zero `any`.
 */

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Check,
  Download,
  Eye,
  Package,
  Search,
  Star,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category =
  | "Dashboard"
  | "Landing"
  | "Admin"
  | "E-commerce"
  | "Portfolio"
  | "Documentation";

type CategoryFilter = "All" | Category;

type PriceFilter = "all" | "free" | "paid";

type SortKey = "popular" | "newest" | "rating" | "price";

interface Template {
  id: string;
  name: string;
  category: Category;
  price: number; // 0 === Free
  author: string;
  downloads: number;
  rating: number; // 1–5, may be fractional (e.g. 4.5)
  reviews: number;
  createdAt: string; // ISO yyyy-mm-dd
  description: string;
  features: readonly string[];
  /** Tailwind `bg-gradient-to-* from-... via-... to-...` classes. */
  gradient: string;
}

interface CategoryMeta {
  /** Badge classes for the small category label on cards. */
  badge: string;
  /** Subtle background tint used on the active filter chip. */
  chipActive: string;
}

interface SortOption {
  value: SortKey;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const CATEGORY_ORDER: readonly CategoryFilter[] = [
  "All",
  "Dashboard",
  "Landing",
  "Admin",
  "E-commerce",
  "Portfolio",
  "Documentation",
] as const;

const PRICE_OPTIONS: readonly { value: PriceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

const SORT_OPTIONS: readonly SortOption[] = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Rating" },
  { value: "price", label: "Price (low → high)" },
] as const;

const CATEGORY_META: Record<Category, CategoryMeta> = {
  Dashboard: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  },
  Landing: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  },
  Admin: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
  },
  "E-commerce": {
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
  },
  Portfolio: {
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
  },
  Documentation: {
    badge:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    chipActive:
      "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
  },
};

// ─── Mock data (12 templates) ───────────────────────────────────────────
// Module-level for referential stability across renders.

const TEMPLATES: readonly Template[] = [
  {
    id: "tpl-healthcare-dashboard",
    name: "Healthcare Dashboard",
    category: "Dashboard",
    price: 49,
    author: "Amara Okafor",
    downloads: 12_840,
    rating: 4.8,
    reviews: 412,
    createdAt: "2025-02-14",
    description:
      "A clinical-grade dashboard for patient monitoring, appointment scheduling, and lab results. Built with semantic color tokens and WCAG-AA contrast throughout.",
    features: [
      "Patient vitals chart with OKLCH palette",
      "Appointment calendar with conflict detection",
      "Lab results table with sortable columns",
      "Dark mode + reduced-motion safe",
      "Container-query responsive layout",
    ],
    gradient: "from-emerald-400 via-emerald-500 to-teal-600",
  },
  {
    id: "tpl-saas-landing",
    name: "SaaS Landing Page",
    category: "Landing",
    price: 0,
    author: "Brian Kiprop",
    downloads: 28_910,
    rating: 4.6,
    reviews: 921,
    createdAt: "2025-01-22",
    description:
      "A high-converting SaaS landing page with hero, feature grid, testimonials, pricing tiers, and FAQ. ships zero external CSS — RoyCSS only.",
    features: [
      "Hero with animated gradient blob",
      "Pricing tiers with monthly/yearly toggle",
      "Testimonial carousel",
      "Sticky CTA on scroll",
      "Opt-in form with inline validation",
    ],
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    id: "tpl-admin-panel",
    name: "Admin Panel",
    category: "Admin",
    price: 79,
    author: "Leila Maina",
    downloads: 9_240,
    rating: 4.9,
    reviews: 287,
    createdAt: "2025-03-03",
    description:
      "A full-featured admin shell with sidebar navigation, data tables, charts, and a settings flow. Includes 40+ reusable primitives.",
    features: [
      "Collapsible sidebar with active-route tracking",
      "Data grid with column visibility + pagination",
      "Revenue + churn charts (recharts)",
      "Role-based route guards",
      "Command palette (⌘K)",
    ],
    gradient: "from-violet-400 via-violet-500 to-fuchsia-600",
  },
  {
    id: "tpl-banking-app",
    name: "Banking App",
    category: "Dashboard",
    price: 129,
    author: "Hassan Otieno",
    downloads: 6_710,
    rating: 4.7,
    reviews: 158,
    createdAt: "2025-02-28",
    description:
      "A consumer banking experience — account balances, transaction history, transfers, and budget insights. Audited for accessibility.",
    features: [
      "Account balance cards with sparklines",
      "Transaction list with filters + search",
      "Transfer wizard with step validation",
      "Budget breakdown donut chart",
      "Biometric-style auth screen mock",
    ],
    gradient: "from-teal-400 via-cyan-500 to-emerald-600",
  },
  {
    id: "tpl-crm",
    name: "CRM",
    category: "Admin",
    price: 89,
    author: "Nadia Wanyoike",
    downloads: 8_120,
    rating: 4.5,
    reviews: 203,
    createdAt: "2025-01-09",
    description:
      "A sales CRM with pipeline kanban, contact records, activity timeline, and revenue forecasting. Drag-and-drop ready.",
    features: [
      "Pipeline kanban with drag-and-drop",
      "Contact record with activity timeline",
      "Quarterly revenue forecast chart",
      "Bulk email composer",
      "Lead scoring widget",
    ],
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
  },
  {
    id: "tpl-pos-system",
    name: "POS System",
    category: "E-commerce",
    price: 99,
    author: "Oscar Mwangi",
    downloads: 4_580,
    rating: 4.4,
    reviews: 96,
    createdAt: "2025-03-12",
    description:
      "A point-of-sale interface optimized for touch — product grid, cart, payment flow, and end-of-day receipts. Mobile-first.",
    features: [
      "Product grid with category tabs",
      "Cart drawer with quantity steppers",
      "Split-tender payment flow",
      "Thermal-printer-friendly receipts",
      "Offline queue + sync indicator",
    ],
    gradient: "from-rose-400 via-rose-500 to-red-600",
  },
  {
    id: "tpl-portfolio",
    name: "Portfolio",
    category: "Portfolio",
    price: 0,
    author: "Priya Achieng",
    downloads: 31_400,
    rating: 4.9,
    reviews: 1_204,
    createdAt: "2024-12-18",
    description:
      "A minimalist developer portfolio with case studies, project grid, and a contact form. Perfect for recruiters — fast, accessible, and pretty.",
    features: [
      "Hero with typewriter intro",
      "Case study long-form layout",
      "Project grid with hover previews",
      "Contact form with spam guard",
      "Print-friendly résumé page",
    ],
    gradient: "from-teal-400 via-emerald-500 to-cyan-600",
  },
  {
    id: "tpl-ecommerce-store",
    name: "E-commerce Store",
    category: "E-commerce",
    price: 149,
    author: "Samuel Kamau",
    downloads: 7_330,
    rating: 4.6,
    reviews: 184,
    createdAt: "2025-02-04",
    description:
      "A complete storefront — product listing, PDP, cart, checkout, and order confirmation. SSR-friendly and SEO-ready.",
    features: [
      "Product listing with facet filters",
      "PDP with image gallery + variants",
      "Cart + checkout wizard",
      "Order confirmation + tracking",
      "Schema.org structured data",
    ],
    gradient: "from-rose-400 via-pink-500 to-rose-600",
  },
  {
    id: "tpl-blog",
    name: "Blog",
    category: "Documentation",
    price: 0,
    author: "Tina Wekesa",
    downloads: 19_870,
    rating: 4.3,
    reviews: 412,
    createdAt: "2024-11-30",
    description:
      "A clean MDX-powered blog with reading progress, code highlighting, and an RSS feed. Zero JS by default — islands only where needed.",
    features: [
      "MDX with syntax highlighting",
      "Reading-progress bar",
      "Tag + author archives",
      "RSS + JSON-LD feed",
      "Comment system agnostic",
    ],
    gradient: "from-teal-400 via-cyan-500 to-emerald-500",
  },
  {
    id: "tpl-documentation",
    name: "Documentation",
    category: "Documentation",
    price: 0,
    author: "Umar Njoroge",
    downloads: 22_540,
    rating: 4.7,
    reviews: 538,
    createdAt: "2024-12-02",
    description:
      "A docs site shell — sidebar nav, search, version switcher, and live code playgrounds. Powers the RoyCSS docs themselves.",
    features: [
      "Sidebar with section anchors",
      "Cmd-K search overlay",
      "Versioned content switcher",
      "Live code playground embeds",
      "On-this-page TOC",
    ],
    gradient: "from-cyan-400 via-teal-500 to-emerald-600",
  },
  {
    id: "tpl-pricing-page",
    name: "Pricing Page",
    category: "Landing",
    price: 19,
    author: "Vera Chebet",
    downloads: 14_220,
    rating: 4.2,
    reviews: 178,
    createdAt: "2025-01-15",
    description:
      "A high-conversion pricing page with monthly/yearly toggle, feature comparison matrix, and sticky CTA. Drop-in for any SaaS.",
    features: [
      "Monthly / yearly billing toggle",
      "Feature comparison matrix",
      "Highlight tier with badge",
      "FAQ accordion",
      "Sticky CTA on mobile",
    ],
    gradient: "from-amber-400 via-amber-500 to-orange-600",
  },
  {
    id: "tpl-auth-flow",
    name: "Auth Flow",
    category: "Landing",
    price: 29,
    author: "Walter Onyango",
    downloads: 10_640,
    rating: 4.5,
    reviews: 246,
    createdAt: "2025-02-20",
    description:
      "Sign-in, sign-up, forgot password, and 2FA screens with magic-link + OAuth options. Accessible, keyboard-first, themeable.",
    features: [
      "Sign-in + sign-up split-screen",
      "Magic-link + OAuth buttons",
      "Forgot-password wizard",
      "2FA code entry with OTP inputs",
      "Session-expired modal",
    ],
    gradient: "from-violet-400 via-fuchsia-500 to-pink-500",
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Compact number formatting — 12840 → "12.8K", 1_200_000 → "1.2M". */
function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

/** 0 → "Free", otherwise "$X". */
function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price}`;
}

// ═══════════════════════════════════════════════════════════════════════
// Stars — 5-star rating display with half-star support
// ═══════════════════════════════════════════════════════════════════════

interface StarsProps {
  /** 1–5, fractional values supported (e.g. 4.5). */
  value: number;
  /** Tailwind size class for each star, e.g. "size-3.5". */
  size?: string;
  /** Accessible label, defaults to "Rated X out of 5". */
  label?: string;
}

function Stars({ value, size = "size-3.5", label }: StarsProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(5, value));
  const pct = (clamped / 5) * 100;
  const aria = label ?? `Rated ${clamped.toFixed(1)} out of 5`;
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      role="img"
      aria-label={aria}
    >
      {/* Base layer — 5 muted stars */}
      <span className="relative inline-flex">
        <span className="flex text-foreground/20">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`base-${i}`}
              className={cn(size, "fill-current")}
              strokeWidth={0}
              aria-hidden
            />
          ))}
        </span>
        {/* Overlay layer — 5 amber stars, clipped to rating width */}
        <span
          className="absolute inset-0 flex overflow-hidden text-amber-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`fill-${i}`}
              className={cn(size, "shrink-0 fill-current")}
              strokeWidth={0}
            />
          ))}
        </span>
      </span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Thumbnail — gradient preview with the template name overlaid
// ═══════════════════════════════════════════════════════════════════════

interface ThumbnailProps {
  template: Template;
  /** Height class for the thumbnail, e.g. "h-32" or "h-56". */
  heightClass?: string;
  /** Font size class for the overlay name. */
  nameClass?: string;
}

function Thumbnail({
  template,
  heightClass = "h-32",
  nameClass = "text-lg",
}: ThumbnailProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-gradient-to-br",
        template.gradient,
        heightClass,
      )}
      aria-hidden
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Soft top-left highlight */}
      <div className="absolute -top-12 -left-12 size-32 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute inset-0 flex items-end p-4">
        <span
          className={cn(
            "font-semibold tracking-tight text-white drop-shadow-sm",
            nameClass,
          )}
        >
          {template.name}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TemplateCard — single card in the grid
// ═══════════════════════════════════════════════════════════════════════

interface TemplateCardProps {
  template: Template;
  onOpen: (template: Template) => void;
}

function TemplateCard({ template, onOpen }: TemplateCardProps): React.JSX.Element {
  const meta = CATEGORY_META[template.category];
  const isFree = template.price === 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(template)}
      className="group focus-visible:outline-none"
      aria-label={`View details for ${template.name}`}
    >
      <Card
        className={cn(
          "h-full cursor-pointer gap-0 overflow-hidden p-0 py-0 text-left",
          "transition-all duration-200",
          "hover:-translate-y-1 hover:shadow-md",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        )}
      >
        {/* Thumbnail */}
        <div className="p-3 pb-0">
          <Thumbnail template={template} heightClass="h-32" nameClass="text-base" />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight text-foreground">
                {template.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                by {template.author}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0", meta.badge)}
            >
              {template.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                isFree ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}
            >
              {formatPrice(template.price)}
            </span>
            <div className="flex items-center gap-1.5">
              <Stars value={template.rating} size="size-3.5" />
              <span className="text-xs tabular-nums text-muted-foreground">
                {template.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Download className="size-3.5" aria-hidden />
              <span className="tabular-nums">
                {formatCompact(template.downloads)}
              </span>
              <span className="sr-only">downloads</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" aria-hidden />
              <span className="tabular-nums">{template.reviews}</span>
              <span className="sr-only">reviews</span>
            </span>
          </div>
        </div>
      </Card>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TemplateDetailDialog — full-detail view
// ═══════════════════════════════════════════════════════════════════════

interface TemplateDetailDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (template: Template) => void;
  onPreview: (template: Template) => void;
}

function TemplateDetailDialog({
  template,
  open,
  onOpenChange,
  onInstall,
  onPreview,
}: TemplateDetailDialogProps): React.JSX.Element | null {
  // Render nothing if there's no template — the Dialog stays closed.
  if (!template) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl" />
      </Dialog>
    );
  }

  const meta = CATEGORY_META[template.category];
  const isFree = template.price === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* Header — gradient preview */}
        <div className="relative">
          <Thumbnail
            template={template}
            heightClass="h-40 sm:h-48"
            nameClass="text-2xl"
          />
          <DialogClose
            className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </DialogClose>
        </div>

        <div className="flex max-h-[calc(90vh-12rem)] flex-col overflow-y-auto p-6">
          <DialogHeader className="text-left">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-xl">{template.name}</DialogTitle>
              <Badge variant="outline" className={meta.badge}>
                {template.category}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-border text-foreground",
                  isFree &&
                    "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
                )}
              >
                {formatPrice(template.price)}
              </Badge>
            </div>
            <DialogDescription>
              by <span className="font-medium text-foreground">{template.author}</span>
              {" · "}
              Added {template.createdAt}
            </DialogDescription>
          </DialogHeader>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatCell
              icon={<Download className="size-4" aria-hidden />}
              label="Downloads"
              value={formatCompact(template.downloads)}
            />
            <StatCell
              icon={<Star className="size-4 fill-amber-500 text-amber-500" aria-hidden />}
              label="Rating"
              value={`${template.rating.toFixed(1)} / 5`}
            />
            <StatCell
              icon={<Eye className="size-4" aria-hidden />}
              label="Reviews"
              value={formatCompact(template.reviews)}
            />
          </div>

          {/* Description */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground">Description</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {template.description}
            </p>
          </div>

          {/* Features */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground">
              What&apos;s included
            </h4>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {template.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="mt-6 flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => onPreview(template)}
              className="gap-2"
            >
              <Eye className="size-4" aria-hidden />
              Preview
            </Button>
            <Button
              onClick={() => onInstall(template)}
              className="gap-2"
            >
              <Package className="size-4" aria-hidden />
              {isFree ? "Install free" : `Install · ${formatPrice(template.price)}`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCell({ icon, label, value }: StatCellProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Marketplace — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function Marketplace(): React.JSX.Element {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("marketplace/templates");
  void data; void loading; void error;

  const { toast } = useToast();

  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [active, setActive] = useState<Template | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // ─── Aggregate stats (memoized once — depends only on TEMPLATES) ────
  const stats = useMemo(() => {
    const total = TEMPLATES.length;
    const free = TEMPLATES.filter((t) => t.price === 0).length;
    const paid = total - free;
    const avgRating =
      TEMPLATES.reduce((sum, t) => sum + t.rating, 0) / Math.max(total, 1);
    return { total, free, paid, avgRating };
  }, []);

  // ─── Filter + sort pipeline (memoized on every input) ───────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = TEMPLATES.filter((t) => {
      // Category
      if (category !== "All" && t.category !== category) return false;
      // Price
      if (price === "free" && t.price !== 0) return false;
      if (price === "paid" && t.price === 0) return false;
      // Search — case-insensitive substring on name
      if (q.length > 0 && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });

    // Copy before sort so we don't mutate the readonly source.
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.downloads - a.downloads;
        case "newest":
          // ISO date strings compare lexicographically — newer first.
          return b.createdAt.localeCompare(a.createdAt);
        case "rating":
          // Higher rating first; break ties by downloads.
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.downloads - a.downloads;
        case "price":
          return a.price - b.price;
        default:
          return 0;
      }
    });

    return sorted;
  }, [search, category, price, sort]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleOpen = useCallback((template: Template) => {
    setActive(template);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Defer clearing so the close animation runs against the right data.
      window.setTimeout(() => setActive(null), 200);
    }
  }, []);

  const handleInstall = useCallback(
    (template: Template) => {
      toast({
        title: "Installing…",
        description: `${template.name} is being installed into your project.`,
      });
    },
    [toast],
  );

  const handlePreview = useCallback(
    (template: Template) => {
      toast({
        title: "Opening preview",
        description: `Loading the live preview for ${template.name}.`,
      });
    },
    [toast],
  );

  const hasFilters =
    search.trim().length > 0 ||
    category !== "All" ||
    price !== "all";

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("All");
    setPrice("all");
    setSort("popular");
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="text-xl">Template Marketplace</CardTitle>
        <CardDescription>
          {stats.total} templates · {stats.free} free · {stats.paid} paid · Avg
          rating {stats.avgRating.toFixed(1)} stars
        </CardDescription>
        <CardAction>
          <Badge variant="secondary" className="gap-1">
            <Package className="size-3" aria-hidden />
            {visible.length} shown
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {/* ─── Toolbar: search + sort ─────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by name…"
              className="pl-9"
              aria-label="Search templates"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ArrowDownUp className="size-4 text-muted-foreground" aria-hidden />
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
            >
              <SelectTrigger className="w-[200px]" aria-label="Sort templates">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── Category chips + price filter ─────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by category"
          >
            {CATEGORY_ORDER.map((cat) => {
              const isActive = category === cat;
              const meta =
                cat === "All" ? null : CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? meta
                        ? meta.chipActive
                        : "border-foreground/30 bg-foreground/10 text-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-1 self-start rounded-full border p-0.5 lg:self-auto"
            role="group"
            aria-label="Filter by price"
          >
            {PRICE_OPTIONS.map((opt) => {
              const isActive = price === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrice(opt.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Grid ──────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No templates found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <TemplateDetailDialog
        template={active}
        open={dialogOpen}
        onOpenChange={handleClose}
        onInstall={handleInstall}
        onPreview={handlePreview}
      />
    </Card>
  );
}
