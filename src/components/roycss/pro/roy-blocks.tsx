"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyBlocks — a marketplace of production-ready application blocks.
 *
 * Self-contained (no props). Ten application blocks, each with a live
 * preview rendered from real JSX, plus a "View Code" dialog (with
 * copy-to-clipboard) and a "Preview" dialog showing the block at full
 * size. Features:
 *
 *   • Search bar — case-insensitive filter on block name.
 *   • Category filter chips — All / Auth / Billing / CRM / Healthcare /
 *     Analytics / Admin / Team / Notifications / Onboarding.
 *   • Complexity badge — Simple / Moderate / Complex (color-coded).
 *   • Stats header — "N blocks · M categories".
 *   • Per-block card: scaled live preview, name, category, complexity,
 *     "View Code" + "Preview" action buttons.
 *   • Code dialog — renders the JSX/HTML source string with a Copy
 *     button (uses navigator.clipboard, SSR-safe inside a click
 *     handler; toast confirms success).
 *   • Preview dialog — renders the block component full-size inside a
 *     large dialog for closer inspection.
 *
 * All previews use the approved semantic palette (bg-background,
 * bg-card, text-foreground, text-muted-foreground, border-border,
 * text-primary, bg-primary) plus accent colors from the RoyCSS approved
 * set (emerald, teal, cyan, amber, rose, violet) — no indigo/blue.
 *
 * TS strict, zero `any`. Memoized filtering. SSR-safe (no top-level
 * window/document access).
 */

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Blocks,
  Check,
  ChevronRight,
  Code2,
  CreditCard,
  FileText,
  Heart,
  HeartPulse,
  LayoutDashboard,
  Lock,
  Mail,
  type LucideIcon,
  Package,
  Pill,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
  Wallet,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category =
  | "Auth"
  | "Billing"
  | "CRM"
  | "Healthcare"
  | "Analytics"
  | "Admin"
  | "Team"
  | "Notifications"
  | "Onboarding";

type CategoryFilter = "All" | Category;

type Complexity = "Simple" | "Moderate" | "Complex";

interface Block {
  id: string;
  name: string;
  category: Category;
  complexity: Complexity;
  description: string;
  /** Short bullet list of "what's inside" — shown in the code dialog. */
  docs: readonly string[];
  /** JSX / HTML source string rendered inside the View Code dialog. */
  code: string;
  /** Rendered live preview component (no props). */
  Preview: React.ComponentType;
}

interface CategoryMeta {
  /** Small badge classes used on the card + dialog header. */
  badge: string;
  /** Active state for the filter chip. */
  chipActive: string;
  /** Subtle background tint used on the preview area. */
  tint: string;
  icon: LucideIcon;
}

interface ComplexityMeta {
  badge: string;
  dot: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const CATEGORY_ORDER: readonly CategoryFilter[] = [
  "All",
  "Auth",
  "Billing",
  "CRM",
  "Healthcare",
  "Analytics",
  "Admin",
  "Team",
  "Notifications",
  "Onboarding",
] as const;

const CATEGORY_META: Record<Category, CategoryMeta> = {
  Auth: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
    tint: "bg-emerald-50/60 dark:bg-emerald-950/20",
    icon: Lock,
  },
  Billing: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
    tint: "bg-amber-50/60 dark:bg-amber-950/20",
    icon: CreditCard,
  },
  CRM: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
    tint: "bg-violet-50/60 dark:bg-violet-950/20",
    icon: Users,
  },
  Healthcare: {
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
    tint: "bg-rose-50/60 dark:bg-rose-950/20",
    icon: Stethoscope,
  },
  Analytics: {
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
    tint: "bg-teal-50/60 dark:bg-teal-950/20",
    icon: Activity,
  },
  Admin: {
    badge:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    chipActive:
      "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
    tint: "bg-cyan-50/60 dark:bg-cyan-950/20",
    icon: Shield,
  },
  Team: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
    tint: "bg-emerald-50/60 dark:bg-emerald-950/20",
    icon: Users,
  },
  Notifications: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
    tint: "bg-amber-50/60 dark:bg-amber-950/20",
    icon: Bell,
  },
  Onboarding: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
    tint: "bg-violet-50/60 dark:bg-violet-950/20",
    icon: Sparkles,
  },
};

const COMPLEXITY_META: Record<Complexity, ComplexityMeta> = {
  Simple: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Moderate: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Complex: {
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Block preview components
// Each is a small, self-contained JSX render of an application screen.
// They use only the approved semantic palette + accent colors.
// ═══════════════════════════════════════════════════════════════════════

/** 1. Auth Flow — login/signup tabs + social buttons + validation visual. */
function AuthFlowPreview(): React.JSX.Element {
  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 text-center">
        <h3 className="text-base font-semibold text-foreground">
          Welcome back
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
        <span className="rounded-md bg-background py-1.5 text-center text-foreground shadow-sm">
          Sign in
        </span>
        <span className="rounded-md py-1.5 text-center text-muted-foreground">
          Create account
        </span>
      </div>

      {/* Form */}
      <div className="space-y-2.5">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <div className="h-8 rounded-md border bg-background pl-8 pr-2 text-xs leading-8 text-muted-foreground">
              alex@roycss.dev
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <div className="h-8 rounded-md border border-rose-400 bg-background pl-8 pr-2 text-xs leading-8 text-muted-foreground">
              ••••••
            </div>
          </div>
          <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">
            Password must be at least 8 characters
          </p>
        </div>

        <div className="flex h-8 items-center justify-between text-xs">
          <label className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="size-3.5 rounded border bg-background" />
            Remember me
          </label>
          <a className="font-medium text-primary">Forgot password?</a>
        </div>

        <button
          type="button"
          className="h-9 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground shadow-sm"
        >
          Sign in
        </button>
      </div>

      {/* Divider */}
      <div className="my-4 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR CONTINUE WITH
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-3 gap-2">
        {["Google", "GitHub", "Apple"].map((s) => (
          <button
            key={s}
            type="button"
            className="h-8 rounded-md border bg-background text-[11px] font-medium text-foreground transition hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 2. Billing Page — plan cards + payment method + invoice history. */
function BillingPreview(): React.JSX.Element {
  const plans = [
    { name: "Starter", price: "$9", features: ["5 projects", "2 GB storage"] },
    {
      name: "Pro",
      price: "$29",
      features: ["Unlimited projects", "50 GB storage"],
      featured: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      features: ["SSO + audit", "1 TB storage"],
    },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "rounded-lg border p-2.5",
              plan.featured &&
                "border-primary bg-primary/5 ring-1 ring-primary/20",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                {plan.name}
              </span>
              {plan.featured && (
                <Badge className="bg-primary px-1 py-0 text-[9px] text-primary-foreground">
                  Popular
                </Badge>
              )}
            </div>
            <p className="mt-1 text-base font-bold text-foreground">
              {plan.price}
              <span className="text-[10px] font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground"
                >
                  <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">
            Payment method
          </span>
          <a className="text-[10px] font-medium text-primary">Manage</a>
        </div>
        <div className="flex items-center justify-between rounded-md border bg-background px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded bg-amber-500 text-[8px] font-bold text-white">
              VISA
            </div>
            <div>
              <p className="text-[11px] font-medium text-foreground">
                •••• 4242
              </p>
              <p className="text-[9px] text-muted-foreground">Expires 08/27</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] text-emerald-700">
            Active
          </Badge>
        </div>
      </div>

      {/* Invoice history */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold text-foreground">
          Invoice history
        </div>
        <div className="divide-y">
          {[
            { date: "Oct 01, 2024", amount: "$29.00", status: "Paid" },
            { date: "Sep 01, 2024", amount: "$29.00", status: "Paid" },
            { date: "Aug 01, 2024", amount: "$29.00", status: "Paid" },
          ].map((row) => (
            <div
              key={row.date}
              className="flex items-center justify-between px-3 py-2 text-[11px]"
            >
              <span className="text-muted-foreground">{row.date}</span>
              <span className="font-medium text-foreground">{row.amount}</span>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                {row.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 3. CRM Pipeline — kanban-style deal pipeline with 4 stages. */
function CRMPipelinePreview(): React.JSX.Element {
  const columns = [
    {
      title: "Lead",
      count: 3,
      dot: "bg-violet-500",
      deals: [
        { name: "Acme Corp", value: "$12K" },
        { name: "Globex", value: "$8K" },
      ],
    },
    {
      title: "Contacted",
      count: 2,
      dot: "bg-amber-500",
      deals: [{ name: "Initech", value: "$24K" }],
    },
    {
      title: "Negotiation",
      count: 1,
      dot: "bg-teal-500",
      deals: [{ name: "Umbrella", value: "$48K" }],
    },
    {
      title: "Won",
      count: 2,
      dot: "bg-emerald-500",
      deals: [{ name: "Hooli", value: "$36K" }],
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">
          Sales Pipeline
        </h3>
        <Badge variant="outline" className="text-[9px]">
          Q4 2024
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {columns.map((col) => (
          <div key={col.title} className="rounded-lg bg-muted/50 p-1.5">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1">
                <span className={cn("size-1.5 rounded-full", col.dot)} />
                <span className="text-[10px] font-semibold text-foreground">
                  {col.title}
                </span>
              </div>
              <span className="rounded-full bg-background px-1.5 text-[9px] font-medium text-muted-foreground">
                {col.count}
              </span>
            </div>
            <div className="space-y-1.5">
              {col.deals.map((deal) => (
                <div
                  key={deal.name}
                  className="rounded-md border bg-card p-1.5 shadow-sm"
                >
                  <p className="text-[10px] font-medium text-foreground">
                    {deal.name}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {deal.value}
                  </p>
                </div>
              ))}
              <button
                type="button"
                className="flex h-5 w-full items-center justify-center rounded-md border border-dashed text-[9px] text-muted-foreground transition hover:bg-accent"
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 4. Healthcare Records — patient card + vitals + medication list. */
function HealthcarePreview(): React.JSX.Element {
  const vitals = [
    { label: "Heart Rate", value: "72", unit: "bpm", icon: HeartPulse },
    { label: "Blood Pressure", value: "118/76", unit: "mmHg", icon: Activity },
    { label: "SpO₂", value: "98", unit: "%", icon: Heart },
    { label: "Temperature", value: "98.6", unit: "°F", icon: HeartPulse },
  ];

  const meds = [
    { name: "Lisinopril", dose: "10 mg", freq: "1× daily" },
    { name: "Metformin", dose: "500 mg", freq: "2× daily" },
    { name: "Atorvastatin", dose: "20 mg", freq: "1× at night" },
  ];

  return (
    <div className="w-full space-y-2.5">
      {/* Patient card */}
      <div className="flex items-center gap-2.5 rounded-lg border bg-card p-2.5">
        <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          SC
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Sarah Chen</p>
          <p className="text-[10px] text-muted-foreground">
            34 yo · Female · ID #PT-4821
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          Stable
        </Badge>
      </div>

      {/* Vitals grid */}
      <div>
        <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Vitals
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {vitals.map((v) => (
            <div key={v.label} className="rounded-md border bg-card p-1.5">
              <v.icon className="size-3 text-rose-600 dark:text-rose-400" />
              <p className="mt-0.5 text-[11px] font-bold text-foreground">
                {v.value}
              </p>
              <p className="text-[8px] text-muted-foreground">{v.unit}</p>
              <p className="mt-0.5 text-[8px] font-medium text-muted-foreground">
                {v.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Medications */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b bg-muted/40 px-2.5 py-1.5 text-[10px] font-semibold text-foreground">
          Medications
        </div>
        <div className="divide-y">
          {meds.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-2 px-2.5 py-1.5"
            >
              <Pill className="size-3 text-rose-600 dark:text-rose-400" />
              <span className="text-[11px] font-medium text-foreground">
                {m.name}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {m.dose}
              </span>
              <span className="text-[9px] text-muted-foreground">{m.freq}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 5. Analytics Overview — KPI cards + chart placeholder + data table. */
function AnalyticsPreview(): React.JSX.Element {
  const kpis = [
    { label: "Revenue", value: "$42.8K", delta: "+12%", up: true },
    { label: "Active Users", value: "8,243", delta: "+5.2%", up: true },
    { label: "Conversion", value: "3.4%", delta: "-0.8%", up: false },
  ];

  const bars = [40, 65, 50, 80, 55, 90, 70, 95];

  return (
    <div className="w-full space-y-2.5">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border bg-card p-2">
            <p className="text-[9px] text-muted-foreground">{k.label}</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">{k.value}</p>
            <p
              className={cn(
                "text-[9px] font-medium",
                k.up
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {k.delta} vs last week
            </p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-lg border bg-card p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-foreground">
            Weekly Sessions
          </p>
          <span className="text-[9px] text-muted-foreground">Last 8 weeks</span>
        </div>
        <div className="flex h-16 items-end gap-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-teal-500 to-teal-300 dark:from-teal-700 dark:to-teal-500"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-3 border-b bg-muted/40 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Page</span>
          <span className="text-right">Views</span>
          <span className="text-right">Bounce</span>
        </div>
        {[
          { page: "/dashboard", views: "4,820", bounce: "32%" },
          { page: "/pricing", views: "2,140", bounce: "41%" },
        ].map((row) => (
          <div
            key={row.page}
            className="grid grid-cols-3 px-2.5 py-1.5 text-[10px]"
          >
            <span className="font-medium text-foreground">{row.page}</span>
            <span className="text-right tabular-nums text-foreground">
              {row.views}
            </span>
            <span className="text-right tabular-nums text-muted-foreground">
              {row.bounce}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 6. Admin Settings — tabbed settings (Profile, Security, Notifications, Billing). */
function AdminSettingsPreview(): React.JSX.Element {
  const tabs = ["Profile", "Security", "Notifications", "Billing"];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-3 flex gap-3 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={cn(
              "-mb-px border-b-2 px-1 pb-1.5 text-[11px] font-medium transition",
              i === 0
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile form */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-foreground">
              Full name
            </label>
            <div className="h-7 rounded-md border bg-background px-2 text-[11px] leading-7 text-foreground">
              Alex Morgan
            </div>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-foreground">
              Email
            </label>
            <div className="h-7 rounded-md border bg-background px-2 text-[11px] leading-7 text-muted-foreground">
              alex@roycss.dev
            </div>
          </div>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-foreground">
            Bio
          </label>
          <div className="h-12 rounded-md border bg-background px-2 py-1.5 text-[11px] text-muted-foreground">
            Product designer & builder of delightful UIs.
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-foreground">
              Role
            </label>
            <div className="h-7 rounded-md border bg-background px-2 text-[11px] leading-7 text-muted-foreground">
              Administrator
            </div>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-foreground">
              Timezone
            </label>
            <div className="h-7 rounded-md border bg-background px-2 text-[11px] leading-7 text-muted-foreground">
              UTC-05:00 Eastern
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="h-7 rounded-md border px-3 text-[10px] font-medium text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-7 rounded-md bg-primary px-3 text-[10px] font-semibold text-primary-foreground"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

/** 7. Team Management — member list + role badges + invite button. */
function TeamManagementPreview(): React.JSX.Element {
  const members = [
    {
      name: "Roy Wanyoike",
      email: "roy@roycss.dev",
      role: "Owner",
      initials: "RW",
      color: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    },
    {
      name: "Amara Okafor",
      email: "amara@roycss.dev",
      role: "Admin",
      initials: "AO",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      name: "Diego Marín",
      email: "diego@roycss.dev",
      role: "Editor",
      initials: "DM",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    {
      name: "Yuki Tanaka",
      email: "yuki@roycss.dev",
      role: "Viewer",
      initials: "YT",
      color: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
    },
  ];

  const roleBadge: Record<string, string> = {
    Owner:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
    Admin:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    Editor:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    Viewer:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300",
  };

  return (
    <div className="w-full">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Team members</h3>
          <p className="text-[10px] text-muted-foreground">
            {members.length} active · 1 seat remaining
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[10px] font-semibold text-primary-foreground"
        >
          <UserPlus className="size-3" />
          Invite
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b bg-muted/40 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Member</span>
          <span className="w-14 text-center">Role</span>
          <span className="w-12 text-right">Status</span>
        </div>
        <div className="divide-y">
          {members.map((m) => (
            <div
              key={m.email}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2.5 py-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[9px] font-bold",
                    m.color,
                  )}
                >
                  {m.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-foreground">
                    {m.name}
                  </p>
                  <p className="truncate text-[9px] text-muted-foreground">
                    {m.email}
                  </p>
                </div>
              </div>
              <div className="w-14 text-center">
                <Badge
                  variant="outline"
                  className={cn("text-[9px]", roleBadge[m.role])}
                >
                  {m.role}
                </Badge>
              </div>
              <div className="w-12 text-right">
                <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 8. Notification Center — notification list + filters + read/unread. */
function NotificationCenterPreview(): React.JSX.Element {
  const filters = [
    { label: "All", count: 8, active: true },
    { label: "Unread", count: 3, active: false },
    { label: "Mentions", count: 2, active: false },
  ];

  const notifications = [
    {
      icon: UserPlus,
      tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
      title: "Amara invited you to project",
      desc: "RoyCSS Design System",
      time: "2m ago",
      unread: true,
    },
    {
      icon: Heart,
      tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      title: "Diego liked your comment",
      desc: "“Looks great — ship it 🚀”",
      time: "1h ago",
      unread: true,
    },
    {
      icon: CreditCard,
      tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      title: "Payment succeeded",
      desc: "$29.00 charged to Visa •••• 4242",
      time: "3h ago",
      unread: true,
    },
    {
      icon: FileText,
      tint: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
      title: "Weekly report ready",
      desc: "Q4 analytics summary available",
      time: "1d ago",
      unread: false,
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Notifications</h3>
        <a className="text-[10px] font-medium text-primary">Mark all read</a>
      </div>

      {/* Filters */}
      <div className="mb-2.5 flex gap-1">
        {filters.map((f) => (
          <button
            key={f.label}
            type="button"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] font-medium transition",
              f.active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {f.label}
            <span className="rounded-full bg-background px-1 text-[8px] tabular-nums">
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {notifications.map((n, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 rounded-lg border bg-card p-2",
              n.unread && "border-primary/30 bg-primary/5",
            )}
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                n.tint,
              )}
            >
              <n.icon className="size-3" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground">
                {n.title}
              </p>
              <p className="truncate text-[9px] text-muted-foreground">
                {n.desc}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[8px] text-muted-foreground">{n.time}</span>
              {n.unread && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 9. Onboarding Wizard — 3-step progress + form + skip. */
function OnboardingWizardPreview(): React.JSX.Element {
  const steps = [
    { n: 1, label: "Account", done: true },
    { n: 2, label: "Workspace", done: false, active: true },
    { n: 3, label: "Team", done: false },
  ];

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="mb-4 flex items-center">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold",
                  s.done && "bg-emerald-500 text-white",
                  s.active && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  !s.done && !s.active && "border border-border bg-background text-muted-foreground",
                )}
              >
                {s.done ? <Check className="size-3" /> : s.n}
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium",
                  s.active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-4 h-0.5 flex-1 rounded-full",
                  s.done ? "bg-emerald-500" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-2.5">
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-foreground">
            Workspace name
          </label>
          <div className="h-8 rounded-md border bg-background px-2 text-[11px] leading-8 text-foreground">
            RoyCSS HQ
          </div>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-foreground">
            Workspace URL
          </label>
          <div className="flex h-8 items-center rounded-md border bg-background pr-2">
            <span className="rounded-l-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              roycss.app/
            </span>
            <span className="px-2 text-[11px] text-foreground">roycss-hq</span>
          </div>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-foreground">
            Team size
          </label>
          <div className="grid grid-cols-4 gap-1">
            {["1–5", "6–20", "21–50", "50+"].map((size, i) => (
              <button
                key={size}
                type="button"
                className={cn(
                  "h-7 rounded-md border text-[10px] font-medium transition",
                  i === 1
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-7 rounded-md border px-3 text-[10px] font-medium text-foreground"
            >
              Back
            </button>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-semibold text-primary-foreground"
            >
              Continue
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 10. Empty Dashboard — welcome card + quick actions + recent activity. */
function EmptyDashboardPreview(): React.JSX.Element {
  const actions = [
    {
      icon: Sparkles,
      label: "New Project",
      tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    },
    {
      icon: UserPlus,
      label: "Invite Team",
      tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      icon: FileText,
      label: "View Docs",
      tint: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
    },
  ];

  const activity = [
    {
      icon: ShoppingCart,
      text: "New order #4821 received",
      time: "5m ago",
    },
    {
      icon: UserPlus,
      text: "Yuki Tanaka joined the team",
      time: "1h ago",
    },
    {
      icon: Wallet,
      text: "Payout of $1,240 processed",
      time: "3h ago",
    },
  ];

  return (
    <div className="w-full space-y-2.5">
      {/* Welcome card */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-violet-50 via-card to-teal-50 p-3 dark:from-violet-950/30 dark:to-teal-950/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">
              Good morning
            </p>
            <h3 className="text-sm font-bold text-foreground">
              Welcome back, Alex 👋
            </h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              You have 3 tasks waiting. Let&apos;s pick up where you left off.
            </p>
          </div>
          <Sparkles className="size-5 text-violet-500 dark:text-violet-400" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className="flex flex-col items-start gap-1.5 rounded-lg border bg-card p-2 text-left transition hover:bg-accent"
            >
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-md",
                  a.tint,
                )}
              >
                <a.icon className="size-3" />
              </div>
              <span className="text-[10px] font-medium text-foreground">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recent activity
        </p>
        <div className="space-y-1">
          {activity.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
            >
              <a.icon className="size-3 text-muted-foreground" />
              <span className="flex-1 text-[10px] text-foreground">{a.text}</span>
              <span className="text-[9px] text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Mock data — 10 blocks
// ═══════════════════════════════════════════════════════════════════════

const BLOCKS: readonly Block[] = [
  {
    id: "blk-auth-flow",
    name: "Auth Flow",
    category: "Auth",
    complexity: "Moderate",
    description:
      "Login + signup tabbed auth screen with email/password validation, social sign-in buttons (Google / GitHub / Apple), and inline error states.",
    docs: [
      "Tabbed login/signup with active state",
      "Email + password fields with icons",
      "Inline validation error message",
      "Three social sign-in buttons",
      "Remember me + forgot password row",
    ],
    code: `"use client";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab = "login" | "signup";

export function AuthFlow() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    // → submit
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {t === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full">
        {tab === "login" ? "Sign in" : "Create account"}
      </Button>

      <div className="grid grid-cols-3 gap-2">
        {["Google", "GitHub", "Apple"].map((p) => (
          <Button key={p} type="button" variant="outline">
            {p}
          </Button>
        ))}
      </div>
    </form>
  );
}`,
    Preview: AuthFlowPreview,
  },
  {
    id: "blk-billing-page",
    name: "Billing Page",
    category: "Billing",
    complexity: "Complex",
    description:
      "Full billing screen with three-tier plan cards (Starter / Pro / Enterprise), saved payment method, and a paginated invoice history table.",
    docs: [
      "Three plan cards with highlighted 'Popular' tier",
      "Saved payment method row",
      "Invoice history with status badges",
      "Responsive grid layout",
    ],
    code: `import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PLANS = [
  { name: "Starter", price: 9, features: ["5 projects", "2 GB"] },
  { name: "Pro", price: 29, featured: true, features: ["Unlimited", "50 GB"] },
  { name: "Enterprise", price: 99, features: ["SSO + audit", "1 TB"] },
];

const INVOICES = [
  { date: "Oct 01, 2024", amount: 29, status: "Paid" },
  { date: "Sep 01, 2024", amount: 29, status: "Paid" },
  { date: "Aug 01, 2024", amount: 29, status: "Paid" },
];

export function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Plans */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "p-4",
              plan.featured && "border-primary ring-1 ring-primary/20",
            )}
          >
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-1 text-2xl font-bold">\${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant={plan.featured ? "default" : "outline"}>
              Choose {plan.name}
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment + Invoices */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Payment method</h3>
          <Button variant="link">Manage</Button>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            <div className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">VISA</div>
            <span className="text-sm">•••• 4242</span>
          </div>
          <Badge variant="outline" className="text-emerald-600">Active</Badge>
        </div>
      </Card>
    </div>
  );
}`,
    Preview: BillingPreview,
  },
  {
    id: "blk-crm-pipeline",
    name: "CRM Pipeline",
    category: "CRM",
    complexity: "Complex",
    description:
      "Kanban-style sales pipeline with four stages (Lead → Contacted → Negotiation → Won), per-column counts, deal cards with company + value, and add-deal affordance.",
    docs: [
      "Four kanban columns with stage indicators",
      "Per-column deal count badges",
      "Deal cards with company + deal value",
      "Drag handle affordance + 'Add' button",
    ],
    code: `import { Card } from "@/components/ui/card";

type Deal = { id: string; company: string; value: number };
type Column = { id: string; title: string; dot: string; deals: Deal[] };

const COLUMNS: Column[] = [
  { id: "lead", title: "Lead", dot: "bg-violet-500", deals: [
    { id: "1", company: "Acme Corp", value: 12000 },
    { id: "2", company: "Globex", value: 8000 },
  ]},
  { id: "contacted", title: "Contacted", dot: "bg-amber-500", deals: [
    { id: "3", company: "Initech", value: 24000 },
  ]},
  { id: "negotiation", title: "Negotiation", dot: "bg-teal-500", deals: [
    { id: "4", company: "Umbrella", value: 48000 },
  ]},
  { id: "won", title: "Won", dot: "bg-emerald-500", deals: [
    { id: "5", company: "Hooli", value: 36000 },
  ]},
];

const fmt = (n: number) => \`$\${n / 1000}K\`;

export function CRMPipeline() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {COLUMNS.map((col) => (
        <div key={col.id} className="rounded-lg bg-muted/50 p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", col.dot)} />
              <span className="text-sm font-semibold">{col.title}</span>
            </div>
            <span className="rounded-full bg-background px-1.5 text-xs text-muted-foreground">
              {col.deals.length}
            </span>
          </div>
          <div className="space-y-2">
            {col.deals.map((deal) => (
              <Card key={deal.id} className="p-2">
                <p className="text-sm font-medium">{deal.company}</p>
                <p className="text-xs font-semibold text-emerald-600">{fmt(deal.value)}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}`,
    Preview: CRMPipelinePreview,
  },
  {
    id: "blk-healthcare-records",
    name: "Healthcare Records",
    category: "Healthcare",
    complexity: "Moderate",
    description:
      "Patient summary card with avatar + status, a 4-cell vitals grid (HR, BP, SpO₂, Temp), and a medication list with dosage + frequency.",
    docs: [
      "Patient identity card with status badge",
      "Four vital-sign cells with icons",
      "Medication list with dosage + frequency",
      "Accessible color contrast for clinical use",
    ],
    code: `import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, HeartPulse, Activity, Pill } from "lucide-react";

const VITALS = [
  { label: "Heart Rate", value: "72", unit: "bpm", Icon: HeartPulse },
  { label: "Blood Pressure", value: "118/76", unit: "mmHg", Icon: Activity },
  { label: "SpO₂", value: "98", unit: "%", Icon: Heart },
  { label: "Temperature", value: "98.6", unit: "°F", Icon: HeartPulse },
];

const MEDS = [
  { name: "Lisinopril", dose: "10 mg", freq: "1× daily" },
  { name: "Metformin", dose: "500 mg", freq: "2× daily" },
  { name: "Atorvastatin", dose: "20 mg", freq: "1× at night" },
];

export function HealthcareRecords() {
  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700">SC</div>
        <div className="flex-1">
          <p className="font-semibold">Sarah Chen</p>
          <p className="text-sm text-muted-foreground">34 yo · Female · ID #PT-4821</p>
        </div>
        <Badge variant="outline" className="text-emerald-600">Stable</Badge>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {VITALS.map((v) => (
          <Card key={v.label} className="p-2">
            <v.Icon className="size-4 text-rose-600" />
            <p className="mt-1 text-lg font-bold">{v.value}</p>
            <p className="text-xs text-muted-foreground">{v.unit}</p>
            <p className="text-xs font-medium text-muted-foreground">{v.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b px-3 py-2 text-sm font-semibold">Medications</div>
        {MEDS.map((m) => (
          <div key={m.name} className="flex items-center gap-2 border-b px-3 py-2 last:border-0">
            <Pill className="size-4 text-rose-600" />
            <span className="text-sm font-medium">{m.name}</span>
            <span className="ml-auto text-sm text-muted-foreground">{m.dose}</span>
            <span className="text-xs text-muted-foreground">{m.freq}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}`,
    Preview: HealthcarePreview,
  },
  {
    id: "blk-analytics-overview",
    name: "Analytics Overview",
    category: "Analytics",
    complexity: "Complex",
    description:
      "KPI cards with deltas, a weekly-sessions bar chart, and a top-pages data table — the three essentials of any analytics dashboard.",
    docs: [
      "Three KPI cards with delta indicators",
      "Bar chart placeholder (drop in recharts)",
      "Top-pages data table with views + bounce",
      "Color-coded positive/negative deltas",
    ],
    code: `import { Card } from "@/components/ui/card";

const KPIS = [
  { label: "Revenue", value: "$42.8K", delta: "+12%", up: true },
  { label: "Active Users", value: "8,243", delta: "+5.2%", up: true },
  { label: "Conversion", value: "3.4%", delta: "-0.8%", up: false },
];

const BARS = [40, 65, 50, 80, 55, 90, 70, 95];
const PAGES = [
  { page: "/dashboard", views: "4,820", bounce: "32%" },
  { page: "/pricing", views: "2,140", bounce: "41%" },
];

export function AnalyticsOverview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-3">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold">{k.value}</p>
            <p className={cn("text-xs font-medium", k.up ? "text-emerald-600" : "text-rose-600")}>
              {k.delta} vs last week
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Weekly Sessions</h3>
        <div className="flex h-32 items-end gap-1">
          {BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-teal-500 to-teal-300"
              style={{ height: \`\${h}%\` }}
            />
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-3 border-b px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Page</span>
          <span className="text-right">Views</span>
          <span className="text-right">Bounce</span>
        </div>
        {PAGES.map((row) => (
          <div key={row.page} className="grid grid-cols-3 px-3 py-2 text-sm">
            <span className="font-medium">{row.page}</span>
            <span className="text-right tabular-nums">{row.views}</span>
            <span className="text-right tabular-nums text-muted-foreground">{row.bounce}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}`,
    Preview: AnalyticsPreview,
  },
  {
    id: "blk-admin-settings",
    name: "Admin Settings",
    category: "Admin",
    complexity: "Moderate",
    description:
      "Tabbed admin settings panel with Profile, Security, Notifications, and Billing sections. Profile form shown with name, email, bio, role, and timezone.",
    docs: [
      "Four-tab navigation with active state",
      "Profile form with name, email, bio",
      "Role + timezone selects",
      "Cancel + Save actions",
    ],
    code: `"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TABS = ["Profile", "Security", "Notifications", "Billing"] as const;
type Tab = (typeof TABS)[number];

export function AdminSettings() {
  const [tab, setTab] = useState<Tab>("Profile");

  return (
    <div>
      <div className="mb-6 flex gap-4 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-2 text-sm font-medium",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Full name</span>
              <Input defaultValue="Alex Morgan" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <Input type="email" defaultValue="alex@roycss.dev" />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Bio</span>
            <Textarea defaultValue="Product designer & builder of delightful UIs." />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      )}
    </div>
  );
}`,
    Preview: AdminSettingsPreview,
  },
  {
    id: "blk-team-management",
    name: "Team Management",
    category: "Team",
    complexity: "Moderate",
    description:
      "Team members table with avatar, name, email, role badge, and online status — plus an invite button. Color-coded role badges.",
    docs: [
      "Member list with avatars + initials",
      "Color-coded role badges (Owner/Admin/Editor/Viewer)",
      "Online status indicator",
      "Invite member button",
    ],
    code: `import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

type Role = "Owner" | "Admin" | "Editor" | "Viewer";

const MEMBERS: {
  name: string; email: string; initials: string;
  role: Role; color: string;
}[] = [
  { name: "Roy Wanyoike", email: "roy@roycss.dev", initials: "RW", role: "Owner", color: "bg-violet-100 text-violet-700" },
  { name: "Amara Okafor", email: "amara@roycss.dev", initials: "AO", role: "Admin", color: "bg-emerald-100 text-emerald-700" },
  { name: "Diego Marín", email: "diego@roycss.dev", initials: "DM", role: "Editor", color: "bg-amber-100 text-amber-700" },
  { name: "Yuki Tanaka", email: "yuki@roycss.dev", initials: "YT", role: "Viewer", color: "bg-teal-100 text-teal-700" },
];

const ROLE_BADGE: Record<Role, string> = {
  Owner: "border-violet-200 bg-violet-50 text-violet-700",
  Admin: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Editor: "border-amber-200 bg-amber-50 text-amber-700",
  Viewer: "border-teal-200 bg-teal-50 text-teal-700",
};

export function TeamManagement() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team members</h2>
        <Button><UserPlus className="size-4" /> Invite</Button>
      </div>
      <Card>
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Member</span><span>Role</span>
        </div>
        {MEMBERS.map((m) => (
          <div key={m.email} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-3 last:border-0">
            <div className="flex items-center gap-3">
              <div className={cn("flex size-9 items-center justify-center rounded-full text-xs font-bold", m.color)}>
                {m.initials}
              </div>
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.email}</p>
              </div>
            </div>
            <Badge variant="outline" className={ROLE_BADGE[m.role]}>{m.role}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}`,
    Preview: TeamManagementPreview,
  },
  {
    id: "blk-notification-center",
    name: "Notification Center",
    category: "Notifications",
    complexity: "Simple",
    description:
      "Notification feed with filter chips (All / Unread / Mentions), icon-coded items, unread indicators, and 'Mark all read' action.",
    docs: [
      "Filter chips with counts",
      "Icon-coded notification items",
      "Unread state with primary tint",
      "Mark all read action",
    ],
    code: `"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { UserPlus, Heart, CreditCard, FileText } from "lucide-react";

type Filter = "all" | "unread" | "mentions";

type Notification = {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  Icon: typeof UserPlus;
  tint: string;
};

const ITEMS: Notification[] = [
  { id: "1", title: "Amara invited you to project", desc: "RoyCSS Design System", time: "2m ago", unread: true, Icon: UserPlus, tint: "bg-violet-100 text-violet-700" },
  { id: "2", title: "Diego liked your comment", desc: "\\"Looks great — ship it\\"", time: "1h ago", unread: true, Icon: Heart, tint: "bg-rose-100 text-rose-700" },
  { id: "3", title: "Payment succeeded", desc: "$29.00 charged to Visa •••• 4242", time: "3h ago", unread: true, Icon: CreditCard, tint: "bg-amber-100 text-amber-700" },
  { id: "4", title: "Weekly report ready", desc: "Q4 analytics summary available", time: "1d ago", unread: false, Icon: FileText, tint: "bg-teal-100 text-teal-700" },
];

export function NotificationCenter() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = ITEMS.filter((n) => filter === "all" || (filter === "unread" && n.unread));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <button className="text-sm font-medium text-primary">Mark all read</button>
      </div>
      <div className="mb-3 flex gap-2">
        {(["all", "unread", "mentions"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize",
              filter === f ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {visible.map((n) => (
          <Card key={n.id} className={cn("flex items-start gap-3 p-3", n.unread && "border-primary/30 bg-primary/5")}>
            <div className={cn("flex size-8 items-center justify-center rounded-md", n.tint)}>
              <n.Icon className="size-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.desc}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">{n.time}</span>
              {n.unread && <span className="size-2 rounded-full bg-primary" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}`,
    Preview: NotificationCenterPreview,
  },
  {
    id: "blk-onboarding-wizard",
    name: "Onboarding Wizard",
    category: "Onboarding",
    complexity: "Moderate",
    description:
      "Three-step onboarding wizard with progress indicator (Account → Workspace → Team), workspace form, team-size selector, and skip/continue actions.",
    docs: [
      "Three-step progress with done/active/pending states",
      "Workspace name + URL slug input",
      "Team-size segmented selector",
      "Skip / Back / Continue actions",
    ],
    code: `"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronRight } from "lucide-react";

export function OnboardingWizard() {
  const [step, setStep] = useState(2);
  const [workspace, setWorkspace] = useState("");
  const [teamSize, setTeamSize] = useState("6-20");

  const steps = [
    { n: 1, label: "Account" },
    { n: 2, label: "Workspace" },
    { n: 3, label: "Team" },
  ];

  return (
    <div>
      {/* Progress */}
      <div className="mb-8 flex items-center">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                s.n < step && "bg-emerald-500 text-white",
                s.n === step && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                s.n > step && "border border-border text-muted-foreground",
              )}>
                {s.n < step ? <Check className="size-4" /> : s.n}
              </div>
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("mx-2 mb-5 h-0.5 w-16", s.n < step ? "bg-emerald-500" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {step === 2 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Workspace name</span>
            <Input value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="RoyCSS HQ" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Team size</span>
            <div className="grid grid-cols-4 gap-2">
              {["1-5", "6-20", "21-50", "50+"].map((size) => (
                <button
                  key={size}
                  onClick={() => setTeamSize(size)}
                  className={cn(
                    "rounded-md border py-2 text-sm font-medium",
                    teamSize === size ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </label>
          <div className="flex justify-between">
            <Button variant="link">Skip for now</Button>
            <Button onClick={() => setStep(3)}>
              Continue <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}`,
    Preview: OnboardingWizardPreview,
  },
  {
    id: "blk-empty-dashboard",
    name: "Empty Dashboard",
    category: "Admin",
    complexity: "Simple",
    description:
      "Welcome card with greeting, three quick-action tiles (New Project, Invite Team, View Docs), and a recent-activity feed — perfect empty-state.",
    docs: [
      "Personalized welcome card with gradient",
      "Three quick-action tiles",
      "Recent activity feed",
      "Friendly empty-state copy",
    ],
    code: `import { Card } from "@/components/ui/card";
import { Sparkles, UserPlus, FileText, ShoppingCart, Wallet } from "lucide-react";

const ACTIONS = [
  { icon: Sparkles, label: "New Project", tint: "bg-violet-100 text-violet-700" },
  { icon: UserPlus, label: "Invite Team", tint: "bg-emerald-100 text-emerald-700" },
  { icon: FileText, label: "View Docs", tint: "bg-teal-100 text-teal-700" },
];

const ACTIVITY = [
  { icon: ShoppingCart, text: "New order #4821 received", time: "5m ago" },
  { icon: UserPlus, text: "Yuki Tanaka joined the team", time: "1h ago" },
  { icon: Wallet, text: "Payout of $1,240 processed", time: "3h ago" },
];

export function EmptyDashboard() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-card to-teal-50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Good morning</p>
            <h2 className="text-2xl font-bold">Welcome back, Alex 👋</h2>
            <p className="mt-1 text-muted-foreground">
              You have 3 tasks waiting. Let&apos;s pick up where you left off.
            </p>
          </div>
          <Sparkles className="size-8 text-violet-500" />
        </div>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map((a) => (
            <button key={a.label} className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition hover:bg-accent">
              <div className={cn("flex size-8 items-center justify-center rounded-md", a.tint)}>
                <a.icon className="size-4" />
              </div>
              <span className="font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h3>
        <Card className="divide-y">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <a.icon className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{a.text}</span>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}`,
    Preview: EmptyDashboardPreview,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// PreviewFrame — renders a block preview scaled inside the card.
// Uses CSS transform: scale() so the rendered JSX keeps its natural
// dimensions but visually shrinks to fit the card preview area.
// ═══════════════════════════════════════════════════════════════════════

interface PreviewFrameProps {
  Preview: React.ComponentType;
  tint: string;
  /** "card" = scaled-down (for grid cards); "full" = scale 1 (for dialog). */
  variant?: "card" | "full";
}

function PreviewFrame({
  Preview,
  tint,
  variant = "card",
}: PreviewFrameProps): React.JSX.Element {
  if (variant === "full") {
    return (
      <div className={cn("rounded-lg p-4", tint)}>
        <div className="mx-auto max-w-xl">
          <Preview />
        </div>
      </div>
    );
  }

  // Card variant — scale 0.65 with overflow hidden, origin top-left.
  // Width is 1/scale so the rendered content fills the visible area.
  const scale = 0.65;
  return (
    <div
      className={cn(
        "relative h-56 overflow-hidden border-b",
        tint,
      )}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
        }}
      >
        <div className="p-4">
          <Preview />
        </div>
      </div>
      {/* Subtle bottom fade so previews blend into the card body. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/60 to-transparent" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BlockCard — grid card for a single block
// ═══════════════════════════════════════════════════════════════════════

interface BlockCardProps {
  block: Block;
  onViewCode: (block: Block) => void;
  onPreview: (block: Block) => void;
}

function BlockCard({
  block,
  onViewCode,
  onPreview,
}: BlockCardProps): React.JSX.Element {
  const catMeta = CATEGORY_META[block.category];
  const cxMeta = COMPLEXITY_META[block.complexity];
  const CatIcon = catMeta.icon;

  return (
    <Card className="gap-0 overflow-hidden pt-0 transition-shadow hover:shadow-md">
      {/* Preview area */}
      <PreviewFrame Preview={block.Preview} tint={catMeta.tint} />

      {/* Body */}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight text-foreground">
              {block.name}
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <CatIcon className="size-3 text-muted-foreground" aria-hidden />
              <span className="text-xs text-muted-foreground">
                {block.category}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 gap-1", cxMeta.badge)}
          >
            <span className={cn("size-1.5 rounded-full", cxMeta.dot)} />
            {block.complexity}
          </Badge>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {block.description}
        </p>

        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onViewCode(block)}
          >
            <Code2 className="size-3.5" aria-hidden />
            View Code
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onPreview(block)}
          >
            <LayoutDashboard className="size-3.5" aria-hidden />
            Preview
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CodeDialog — View Code dialog with copy-to-clipboard
// ═══════════════════════════════════════════════════════════════════════

interface CodeDialogProps {
  block: Block | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (block: Block) => void;
}

function CodeDialog({
  block,
  open,
  onOpenChange,
  onCopy,
}: CodeDialogProps): React.JSX.Element | null {
  // Render an empty dialog when no block is selected so the close
  // animation runs against the previous content.
  if (!block) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl" />
      </Dialog>
    );
  }

  const catMeta = CATEGORY_META[block.category];
  const cxMeta = COMPLEXITY_META[block.complexity];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg">{block.name}</DialogTitle>
            <Badge variant="outline" className={catMeta.badge}>
              {block.category}
            </Badge>
            <Badge variant="outline" className={cn("gap-1", cxMeta.badge)}>
              <span className={cn("size-1.5 rounded-full", cxMeta.dot)} />
              {block.complexity}
            </Badge>
          </div>
          <DialogDescription>{block.description}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[calc(90vh-12rem)] flex-col overflow-y-auto p-5">
          {/* Docs */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What&apos;s inside
            </h4>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {block.docs.map((doc) => (
                <li
                  key={doc}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code */}
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Source
            </h4>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onCopy(block)}
            >
              <Code2 className="size-3.5" aria-hidden />
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed text-foreground">
            <code className="font-mono">{block.code}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PreviewDialog — full-size preview dialog
// ═══════════════════════════════════════════════════════════════════════

interface PreviewDialogProps {
  block: Block | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PreviewDialog({
  block,
  open,
  onOpenChange,
}: PreviewDialogProps): React.JSX.Element | null {
  if (!block) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl" />
      </Dialog>
    );
  }

  const catMeta = CATEGORY_META[block.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base">{block.name}</DialogTitle>
            <Badge variant="outline" className={catMeta.badge}>
              {block.category}
            </Badge>
          </div>
          <DialogClose
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </DialogClose>
        </div>

        {/* Full preview area */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <PreviewFrame
            Preview={block.Preview}
            tint={catMeta.tint}
            variant="full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyBlocks — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function RoyBlocks(): React.JSX.Element {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("blocks");
  void data;

  const { toast } = useToast();

  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [codeBlock, setCodeBlock] = useState<Block | null>(null);
  const [codeOpen, setCodeOpen] = useState<boolean>(false);
  const [previewBlock, setPreviewBlock] = useState<Block | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  // ─── Stats (memoized once — depends only on BLOCKS) ────────────────
  const stats = useMemo(() => {
    const total = BLOCKS.length;
    const categories = new Set(BLOCKS.map((b) => b.category)).size;
    return { total, categories };
  }, []);

  // ─── Filter pipeline (memoized on every input) ─────────────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BLOCKS.filter((b) => {
      if (category !== "All" && b.category !== category) return false;
      if (q.length > 0 && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, category]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleViewCode = useCallback((block: Block) => {
    setCodeBlock(block);
    setCodeOpen(true);
  }, []);

  const handleCodeClose = useCallback((open: boolean) => {
    setCodeOpen(open);
    if (!open) {
      window.setTimeout(() => setCodeBlock(null), 200);
    }
  }, []);

  const handlePreview = useCallback((block: Block) => {
    setPreviewBlock(block);
    setPreviewOpen(true);
  }, []);

  const handlePreviewClose = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      window.setTimeout(() => setPreviewBlock(null), 200);
    }
  }, []);

  const handleCopy = useCallback(
    async (block: Block) => {
      try {
        await navigator.clipboard.writeText(block.code);
        toast({
          title: "Copied to clipboard",
          description: `${block.name} source code is ready to paste.`,
        });
      } catch {
        toast({
          title: "Copy failed",
          description: "Clipboard access was denied by the browser.",
        });
      }
    },
    [toast],
  );

  const hasFilters = search.trim().length > 0 || category !== "All";
  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("All");
  }, []);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Blocks className="size-5 text-primary" aria-hidden />
          Roy Blocks
        </CardTitle>
        <CardDescription>
          {stats.total} blocks · {stats.categories} categories
        </CardDescription>
        <CardAction>
          <BackendLiveBadge module="blocks" loading={loading} error={error} />
          <Badge variant="secondary" className="gap-1">
            <Package className="size-3" aria-hidden />
            {visible.length} shown
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {/* ─── Search ─────────────────────────────────────────────── */}
        <div className="relative max-w-md">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks by name…"
            className="pl-9"
            aria-label="Search blocks"
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

        {/* ─── Category chips ─────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORY_ORDER.map((cat) => {
            const isActive = category === cat;
            const meta = cat === "All" ? null : CATEGORY_META[cat];
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

        {/* ─── Grid ──────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onViewCode={handleViewCode}
                onPreview={handlePreview}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">No blocks found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or category filter.
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

      <CodeDialog
        block={codeBlock}
        open={codeOpen}
        onOpenChange={handleCodeClose}
        onCopy={handleCopy}
      />
      <PreviewDialog
        block={previewBlock}
        open={previewOpen}
        onOpenChange={handlePreviewClose}
      />
    </Card>
  );
}
