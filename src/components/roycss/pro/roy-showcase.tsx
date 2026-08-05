"use client";

/**
 * RoyShowcase — a curated gallery of real-world RoyCSS projects.
 *
 * Self-contained (no props). Twelve mock showcase projects rendered in a
 * responsive card grid with rich metadata. Features:
 *
 *   • Search bar — case-insensitive filter on project name.
 *   • Industry filter chips — All / Healthcare / E-commerce / Finance /
 *     Education / Logistics / HR / DevTools / SaaS / Analytics / Social /
 *     Reservation / ERP (single-select toggle, color-coded).
 *   • Framework filter — All / Next.js / React / Vue / Angular / Svelte
 *     (segmented control).
 *   • Difficulty filter — All / Beginner / Intermediate / Advanced
 *     (segmented control).
 *   • Sort — Popular (views desc) / Top Rated (stars desc) / Newest
 *     (createdAt desc) / Best Performance (Lighthouse desc).
 *   • Stats header — "N projects · M industries · Avg performance X ·
 *     Avg a11y Y".
 *   • Card click — opens a Dialog detail view with large preview
 *     thumbnail, full description, tech stack, features list,
 *     performance breakdown (LCP / FID / CLS / Lighthouse) +
 *     accessibility breakdown, author info, and Visit / Source Code
 *     buttons.
 *   • "Submit Project" button — opens a form Dialog with name, URL,
 *     description, industry, framework fields. Submit fires a shadcn
 *     toast.
 *
 * Each project card shows:
 *   • A gradient thumbnail with the project name overlaid (gradients
 *     use the approved RoyCSS palette — emerald, teal, cyan, amber,
 *     rose, violet — no indigo / blue).
 *   • Author name + avatar initials.
 *   • Industry badge (color-coded per industry).
 *   • Framework badge.
 *   • Difficulty badge.
 *   • Star rating (1–5, supports half-stars via a width-clipped
 *     overlay).
 *   • View count (compact, e.g. "12.8K").
 *   • Performance + accessibility score pills.
 *   • "Visit" button (opens the detail dialog) and "Source Code"
 *     button (mock external link).
 *
 * Filtering + sorting is fully memoized. TS strict, zero `any`.
 */

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Accessibility,
  ArrowDownUp,
  Check,
  Code2,
  ExternalLink,
  Eye,
  Gauge,
  GitBranch,
  Github,
  Globe,
  Plus,
  Search,
  Star,
  Users,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Industry =
  | "Healthcare"
  | "E-commerce"
  | "Finance"
  | "Education"
  | "Logistics"
  | "HR"
  | "DevTools"
  | "SaaS"
  | "Analytics"
  | "Social"
  | "Reservation"
  | "ERP";

type IndustryFilter = "All" | Industry;

type Framework = "Next.js" | "React" | "Vue" | "Angular" | "Svelte";

type FrameworkFilter = "All" | Framework;

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

type DifficultyFilter = "All" | Difficulty;

type SortKey = "popular" | "rated" | "newest" | "performance";

interface PerfBreakdown {
  /** Largest Contentful Paint in seconds, e.g. 1.2. */
  lcp: number;
  /** First Input Delay in milliseconds, e.g. 12. */
  fid: number;
  /** Cumulative Layout Shift, e.g. 0.04. */
  cls: number;
  /** Overall Lighthouse performance score, 0–100. */
  lighthouse: number;
}

interface A11yBreakdown {
  /** Color contrast score, 0–100. */
  contrast: number;
  /** ARIA labelling completeness, 0–100. */
  aria: number;
  /** Keyboard navigation completeness, 0–100. */
  keyboard: number;
  /** Screen-reader compatibility, 0–100. */
  screenReader: number;
  /** Overall Lighthouse accessibility score, 0–100. */
  lighthouse: number;
}

interface Project {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  industry: Industry;
  framework: Framework;
  difficulty: Difficulty;
  author: {
    name: string;
    /** Two-letter avatar initials, e.g. "AO". */
    initials: string;
    title: string;
    avatarClass: string;
  };
  stars: number; // 1–5, may be fractional
  reviews: number;
  views: number;
  createdAt: string; // ISO yyyy-mm-dd
  description: string;
  techStack: readonly string[];
  features: readonly string[];
  /** Tailwind `bg-gradient-to-br from-... via-... to-...` classes. */
  gradient: string;
  /** Mock live URL. */
  url: string;
  /** Mock source repository URL. */
  repoUrl: string;
  perf: PerfBreakdown;
  a11y: A11yBreakdown;
}

interface IndustryMeta {
  /** Badge classes for the small industry label on cards. */
  badge: string;
  /** Subtle background tint used on the active filter chip. */
  chipActive: string;
}

interface FrameworkMeta {
  badge: string;
}

interface DifficultyMeta {
  badge: string;
  chipActive: string;
}

interface SortOption {
  value: SortKey;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants — option lists & color metadata
// ═══════════════════════════════════════════════════════════════════════

const INDUSTRY_ORDER: readonly IndustryFilter[] = [
  "All",
  "Healthcare",
  "E-commerce",
  "Finance",
  "Education",
  "Logistics",
  "HR",
  "DevTools",
  "SaaS",
  "Analytics",
  "Social",
  "Reservation",
  "ERP",
] as const;

const FRAMEWORK_OPTIONS: readonly { value: FrameworkFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Next.js", label: "Next.js" },
  { value: "React", label: "React" },
  { value: "Vue", label: "Vue" },
  { value: "Angular", label: "Angular" },
  { value: "Svelte", label: "Svelte" },
] as const;

const DIFFICULTY_OPTIONS: readonly {
  value: DifficultyFilter;
  label: string;
}[] = [
  { value: "All", label: "All" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
] as const;

const SORT_OPTIONS: readonly SortOption[] = [
  { value: "popular", label: "Popular" },
  { value: "rated", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "performance", label: "Best Performance" },
] as const;

const INDUSTRY_META: Record<Industry, IndustryMeta> = {
  Healthcare: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  },
  "E-commerce": {
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
  },
  Finance: {
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
  },
  Education: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  },
  Logistics: {
    badge:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
    chipActive:
      "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
  },
  HR: {
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
  },
  DevTools: {
    badge:
      "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
    chipActive:
      "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-200",
  },
  SaaS: {
    badge:
      "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-300",
    chipActive:
      "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
  },
  Analytics: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  },
  Social: {
    badge:
      "border-pink-200 bg-pink-100 text-pink-700 dark:border-pink-900 dark:bg-pink-950/60 dark:text-pink-300",
    chipActive:
      "border-pink-300 bg-pink-100 text-pink-800 dark:border-pink-800 dark:bg-pink-950/70 dark:text-pink-200",
  },
  Reservation: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  },
  ERP: {
    badge:
      "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
    chipActive:
      "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
  },
};

const FRAMEWORK_META: Record<Framework, FrameworkMeta> = {
  "Next.js": {
    badge:
      "border-foreground/15 bg-foreground/5 text-foreground dark:border-foreground/25 dark:bg-foreground/10",
  },
  React: {
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  Vue: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  Angular: {
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  },
  Svelte: {
    badge:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
  },
};

const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  Beginner: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  },
  Intermediate: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  },
  Advanced: {
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
  },
};

// ─── Mock data (12 projects) ───────────────────────────────────────────
// Module-level for referential stability across renders.

const PROJECTS: readonly Project[] = [
  {
    id: "proj-medtrack",
    name: "MedTrack — Healthcare Dashboard",
    shortName: "MedTrack",
    tagline: "Clinical-grade patient monitoring & scheduling",
    industry: "Healthcare",
    framework: "Next.js",
    difficulty: "Advanced",
    author: {
      name: "Amara Okafor",
      initials: "AO",
      title: "Senior Frontend Engineer",
      avatarClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    },
    stars: 4.9,
    reviews: 412,
    views: 28_910,
    createdAt: "2025-03-14",
    description:
      "A clinical-grade dashboard for patient monitoring, appointment scheduling, and lab results. Built with semantic color tokens and WCAG-AA contrast throughout, MedTrack is deployed in three regional hospitals and handles 14K+ appointments per month.",
    techStack: ["Next.js 16", "TypeScript", "Tailwind 4", "shadcn/ui", "tRPC", "Prisma", "PostgreSQL"],
    features: [
      "Patient vitals chart with OKLCH palette",
      "Appointment calendar with conflict detection",
      "Lab results table with sortable columns",
      "Dark mode + reduced-motion safe",
      "Container-query responsive layout",
      "Role-based access (clinician / admin)",
    ],
    gradient: "from-emerald-400 via-emerald-500 to-teal-600",
    url: "https://medtrack.example.com",
    repoUrl: "https://github.com/example/medtrack",
    perf: { lcp: 1.1, fid: 8, cls: 0.02, lighthouse: 99 },
    a11y: {
      contrast: 100,
      aria: 98,
      keyboard: 100,
      screenReader: 97,
      lighthouse: 98,
    },
  },
  {
    id: "proj-shopflow",
    name: "ShopFlow — E-commerce",
    shortName: "ShopFlow",
    tagline: "High-converting storefront with cart & checkout",
    industry: "E-commerce",
    framework: "React",
    difficulty: "Intermediate",
    author: {
      name: "Brian Kiprop",
      initials: "BK",
      title: "Indie Hacker",
      avatarClass:
        "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
    },
    stars: 4.6,
    reviews: 921,
    views: 41_220,
    createdAt: "2025-02-22",
    description:
      "A high-converting storefront — product listing, PDP with image gallery, cart drawer, and a 3-step checkout. Server-rendered for SEO with islands of interactivity where it matters.",
    techStack: ["React 19", "TypeScript", "Tailwind 4", "Vite", "Zustand", "Stripe"],
    features: [
      "Product listing with facet filters",
      "PDP with image gallery + variants",
      "Cart drawer with quantity steppers",
      "3-step checkout wizard",
      "Schema.org structured data",
      "Wishlist + recently viewed",
    ],
    gradient: "from-rose-400 via-pink-500 to-rose-600",
    url: "https://shopflow.example.com",
    repoUrl: "https://github.com/example/shopflow",
    perf: { lcp: 1.4, fid: 16, cls: 0.05, lighthouse: 96 },
    a11y: {
      contrast: 96,
      aria: 92,
      keyboard: 95,
      screenReader: 90,
      lighthouse: 93,
    },
  },
  {
    id: "proj-finsight",
    name: "FinSight — Banking App",
    shortName: "FinSight",
    tagline: "Consumer banking with budget insights",
    industry: "Finance",
    framework: "Vue",
    difficulty: "Advanced",
    author: {
      name: "Hassan Otieno",
      initials: "HO",
      title: "Staff Engineer",
      avatarClass:
        "bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300",
    },
    stars: 4.8,
    reviews: 287,
    views: 18_410,
    createdAt: "2025-03-03",
    description:
      "A consumer banking experience — account balances, transaction history, transfers, and budget insights. Audited for accessibility and penetration-tested by an external security firm.",
    techStack: ["Vue 3", "TypeScript", "Tailwind 4", "Pinia", "Vue Query", "Axios"],
    features: [
      "Account balance cards with sparklines",
      "Transaction list with filters + search",
      "Transfer wizard with step validation",
      "Budget breakdown donut chart",
      "Biometric-style auth screen mock",
      "Full keyboard navigation",
    ],
    gradient: "from-teal-400 via-cyan-500 to-emerald-600",
    url: "https://finsight.example.com",
    repoUrl: "https://github.com/example/finsight",
    perf: { lcp: 1.2, fid: 12, cls: 0.03, lighthouse: 98 },
    a11y: {
      contrast: 100,
      aria: 96,
      keyboard: 100,
      screenReader: 95,
      lighthouse: 97,
    },
  },
  {
    id: "proj-eduportal",
    name: "EduPortal — LMS",
    shortName: "EduPortal",
    tagline: "Learning management for universities",
    industry: "Education",
    framework: "Next.js",
    difficulty: "Intermediate",
    author: {
      name: "Leila Maina",
      initials: "LM",
      title: "Product Engineer",
      avatarClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    },
    stars: 4.5,
    reviews: 203,
    views: 22_540,
    createdAt: "2025-01-09",
    description:
      "A learning management system for mid-sized universities — course catalog, enrollments, gradebook, and a discussion forum. Adopted by 14 institutions across East Africa.",
    techStack: ["Next.js 16", "TypeScript", "Tailwind 4", "shadcn/ui", "Prisma", "PostgreSQL"],
    features: [
      "Course catalog with search + filters",
      "Enrollment wizard with prerequisites",
      "Gradebook with weighted formulas",
      "Discussion forum with threading",
      "Notifications center",
      "Mobile-responsive course viewer",
    ],
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    url: "https://eduportal.example.com",
    repoUrl: "https://github.com/example/eduportal",
    perf: { lcp: 1.6, fid: 22, cls: 0.08, lighthouse: 94 },
    a11y: {
      contrast: 95,
      aria: 90,
      keyboard: 93,
      screenReader: 88,
      lighthouse: 91,
    },
  },
  {
    id: "proj-fleetops",
    name: "FleetOps — Logistics",
    shortName: "FleetOps",
    tagline: "Real-time fleet tracking & dispatch",
    industry: "Logistics",
    framework: "Angular",
    difficulty: "Advanced",
    author: {
      name: "Nadia Wanyoike",
      initials: "NW",
      title: "Solutions Architect",
      avatarClass:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300",
    },
    stars: 4.7,
    reviews: 158,
    views: 12_840,
    createdAt: "2025-02-28",
    description:
      "A real-time logistics dashboard — fleet tracking, dispatch, route optimization, and ETA predictions. Powered by a streaming WebSocket layer and rendered with virtualized lists.",
    techStack: ["Angular 18", "TypeScript", "Tailwind 4", "NgRx", "RxJS", "MapLibre GL"],
    features: [
      "Live fleet map with vehicle markers",
      "Dispatch board with drag-and-drop",
      "Route optimization suggestions",
      "ETA prediction with confidence bands",
      "Driver mobile companion view",
      "Geofencing alerts",
    ],
    gradient: "from-cyan-400 via-teal-500 to-emerald-600",
    url: "https://fleetops.example.com",
    repoUrl: "https://github.com/example/fleetops",
    perf: { lcp: 1.5, fid: 18, cls: 0.04, lighthouse: 95 },
    a11y: {
      contrast: 94,
      aria: 91,
      keyboard: 92,
      screenReader: 87,
      lighthouse: 90,
    },
  },
  {
    id: "proj-teamhub",
    name: "TeamHub — HR Platform",
    shortName: "TeamHub",
    tagline: "People ops: PTO, reviews, onboarding",
    industry: "HR",
    framework: "React",
    difficulty: "Intermediate",
    author: {
      name: "Oscar Mwangi",
      initials: "OM",
      title: "Engineering Manager",
      avatarClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
    },
    stars: 4.4,
    reviews: 96,
    views: 9_580,
    createdAt: "2025-03-12",
    description:
      "A people-ops platform — PTO requests, performance reviews, onboarding flows, and an employee directory. Designed for HR teams of 50–500 employees.",
    techStack: ["React 19", "TypeScript", "Tailwind 4", "TanStack Query", "Zustand", "tRPC"],
    features: [
      "PTO request wizard with approver chain",
      "Performance review templates",
      "Onboarding checklist automation",
      "Employee directory with org chart",
      "Document vault with version history",
      "Slack + email notifications",
    ],
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    url: "https://teamhub.example.com",
    repoUrl: "https://github.com/example/teamhub",
    perf: { lcp: 1.3, fid: 14, cls: 0.06, lighthouse: 95 },
    a11y: {
      contrast: 92,
      aria: 89,
      keyboard: 91,
      screenReader: 85,
      lighthouse: 89,
    },
  },
  {
    id: "proj-codereview",
    name: "CodeReview — DevTool",
    shortName: "CodeReview",
    tagline: "AI-assisted code review assistant",
    industry: "DevTools",
    framework: "Svelte",
    difficulty: "Advanced",
    author: {
      name: "Priya Achieng",
      initials: "PA",
      title: "DX Engineer",
      avatarClass:
        "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/70 dark:text-fuchsia-300",
    },
    stars: 4.9,
    reviews: 1_204,
    views: 31_400,
    createdAt: "2024-12-18",
    description:
      "A code review assistant that runs alongside your PR — comments on style, security, and accessibility regressions. Plugs into GitHub, GitLab, and Bitbucket via webhook.",
    techStack: ["Svelte 5", "TypeScript", "Tailwind 4", "SvelteKit", "Vite", "OpenAI"],
    features: [
      "PR diff viewer with inline comments",
      "Configurable rule packs",
      "Accessibility regression checks",
      "Security advisory matching",
      "Slack + email digest",
      "Self-hostable runner",
    ],
    gradient: "from-fuchsia-400 via-purple-500 to-violet-600",
    url: "https://codereview.example.com",
    repoUrl: "https://github.com/example/codereview",
    perf: { lcp: 1.0, fid: 6, cls: 0.01, lighthouse: 100 },
    a11y: {
      contrast: 100,
      aria: 97,
      keyboard: 100,
      screenReader: 96,
      lighthouse: 98,
    },
  },
  {
    id: "proj-aiassistant",
    name: "AIAssistant — SaaS",
    shortName: "AIAssistant",
    tagline: "Conversational AI for support teams",
    industry: "SaaS",
    framework: "Next.js",
    difficulty: "Intermediate",
    author: {
      name: "Samuel Kamau",
      initials: "SK",
      title: "Founder",
      avatarClass:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300",
    },
    stars: 4.6,
    reviews: 184,
    views: 17_330,
    createdAt: "2025-02-04",
    description:
      "A conversational AI SaaS for support teams — shared inbox, AI-suggested replies, and a knowledge base that learns from resolved tickets. SOC 2 Type II ready.",
    techStack: ["Next.js 16", "TypeScript", "Tailwind 4", "shadcn/ui", "Prisma", "OpenAI", "Postgres"],
    features: [
      "Shared inbox with collision detection",
      "AI-suggested replies (editable)",
      "Auto-growing knowledge base",
      "Customer satisfaction surveys",
      "Slack / Teams integration",
      "Audit log + role permissions",
    ],
    gradient: "from-orange-400 via-amber-500 to-rose-500",
    url: "https://aiassistant.example.com",
    repoUrl: "https://github.com/example/aiassistant",
    perf: { lcp: 1.2, fid: 10, cls: 0.03, lighthouse: 97 },
    a11y: {
      contrast: 96,
      aria: 93,
      keyboard: 94,
      screenReader: 90,
      lighthouse: 93,
    },
  },
  {
    id: "proj-dataviz",
    name: "DataViz — Analytics",
    shortName: "DataViz",
    tagline: "Dashboard builder with SQL editor",
    industry: "Analytics",
    framework: "React",
    difficulty: "Advanced",
    author: {
      name: "Tina Wekesa",
      initials: "TW",
      title: "Data Engineer",
      avatarClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    },
    stars: 4.7,
    reviews: 538,
    views: 19_870,
    createdAt: "2024-11-30",
    description:
      "A self-serve analytics dashboard builder — drag-and-drop charts, a SQL editor with autocomplete, and scheduled exports to Slack / email. Connects to Postgres, BigQuery, and Snowflake.",
    techStack: ["React 19", "TypeScript", "Tailwind 4", "TanStack Table", "Recharts", "Monaco", "tRPC"],
    features: [
      "Drag-and-drop dashboard grid",
      "SQL editor with autocomplete",
      "20+ chart types (Recharts)",
      "Scheduled exports (Slack / email)",
      "Row-level security policies",
      "Query result caching",
    ],
    gradient: "from-emerald-400 via-cyan-500 to-teal-600",
    url: "https://dataviz.example.com",
    repoUrl: "https://github.com/example/dataviz",
    perf: { lcp: 1.4, fid: 15, cls: 0.04, lighthouse: 96 },
    a11y: {
      contrast: 94,
      aria: 92,
      keyboard: 93,
      screenReader: 88,
      lighthouse: 92,
    },
  },
  {
    id: "proj-socialfeed",
    name: "SocialFeed — Social",
    shortName: "SocialFeed",
    tagline: "Activity feed + microblog",
    industry: "Social",
    framework: "Vue",
    difficulty: "Beginner",
    author: {
      name: "Umar Njoroge",
      initials: "UN",
      title: "Frontend Engineer",
      avatarClass:
        "bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300",
    },
    stars: 4.3,
    reviews: 412,
    views: 14_220,
    createdAt: "2024-12-02",
    description:
      "A minimalist social feed with posts, replies, reactions, and follow graph. Built as a learning reference — clean architecture, ~3.5K LoC, and zero external UI libraries.",
    techStack: ["Vue 3", "TypeScript", "Tailwind 4", "Pinia", "Vue Router", "Vite"],
    features: [
      "Infinite-scroll activity feed",
      "Compose box with emoji picker",
      "Threaded replies",
      "Custom reaction set",
      "Follow / unfollow graph",
      "Optimistic UI updates",
    ],
    gradient: "from-pink-400 via-rose-500 to-fuchsia-500",
    url: "https://socialfeed.example.com",
    repoUrl: "https://github.com/example/socialfeed",
    perf: { lcp: 1.6, fid: 20, cls: 0.07, lighthouse: 93 },
    a11y: {
      contrast: 90,
      aria: 86,
      keyboard: 88,
      screenReader: 85,
      lighthouse: 88,
    },
  },
  {
    id: "proj-bookingapp",
    name: "BookingApp — Reservation",
    shortName: "BookingApp",
    tagline: "Appointment scheduling for SMBs",
    industry: "Reservation",
    framework: "Next.js",
    difficulty: "Intermediate",
    author: {
      name: "Vera Chebet",
      initials: "VC",
      title: "Full-stack Engineer",
      avatarClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    },
    stars: 4.5,
    reviews: 246,
    views: 16_640,
    createdAt: "2025-02-20",
    description:
      "An appointment-scheduling app for salons, clinics, and tutors — calendar sync, reminder emails, and a no-show recovery flow. White-label ready.",
    techStack: ["Next.js 16", "TypeScript", "Tailwind 4", "shadcn/ui", "Prisma", "Nodemailer"],
    features: [
      "Availability calendar with buffers",
      "Self-serve booking widget (embed)",
      "Email + SMS reminders",
      "No-show recovery flow",
      "Group + class bookings",
      "Stripe deposit collection",
    ],
    gradient: "from-amber-400 via-amber-500 to-orange-600",
    url: "https://bookingapp.example.com",
    repoUrl: "https://github.com/example/bookingapp",
    perf: { lcp: 1.3, fid: 13, cls: 0.04, lighthouse: 96 },
    a11y: {
      contrast: 95,
      aria: 90,
      keyboard: 94,
      screenReader: 89,
      lighthouse: 92,
    },
  },
  {
    id: "proj-inventorypro",
    name: "InventoryPro — ERP",
    shortName: "InventoryPro",
    tagline: "Warehouse + SKU + supplier management",
    industry: "ERP",
    framework: "Angular",
    difficulty: "Advanced",
    author: {
      name: "Walter Onyango",
      initials: "WO",
      title: "ERP Consultant",
      avatarClass:
        "bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300",
    },
    stars: 4.6,
    reviews: 178,
    views: 10_640,
    createdAt: "2025-01-15",
    description:
      "An ERP module for SMB manufacturers — multi-warehouse inventory, SKU lifecycle, supplier management, and a PO / SO workflow. Integrates with QuickBooks and Xero.",
    techStack: ["Angular 18", "TypeScript", "Tailwind 4", "NgRx", "Angular Material", "RxJS"],
    features: [
      "Multi-warehouse inventory grid",
      "SKU lifecycle with serial tracking",
      "Supplier scorecards",
      "PO / SO workflow with approvals",
      "QuickBooks + Xero sync",
      "Barcode / QR scanner support",
    ],
    gradient: "from-teal-400 via-emerald-500 to-cyan-600",
    url: "https://inventorypro.example.com",
    repoUrl: "https://github.com/example/inventorypro",
    perf: { lcp: 1.5, fid: 19, cls: 0.05, lighthouse: 94 },
    a11y: {
      contrast: 93,
      aria: 88,
      keyboard: 92,
      screenReader: 86,
      lighthouse: 90,
    },
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

/** Score → color tokens. 90+ emerald, 80+ amber, else rose. */
function scoreTone(score: number): {
  text: string;
  bg: string;
  bar: string;
} {
  if (score >= 90) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 80) {
    return {
      text: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900",
      bar: "bg-amber-500",
    };
  }
  return {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900",
    bar: "bg-rose-500",
  };
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
// Avatar — colored initials circle
// ═══════════════════════════════════════════════════════════════════════

interface AvatarProps {
  initials: string;
  className?: string;
  size?: string;
  /** Accessible label, defaults to "Avatar for {initials}". */
  label?: string;
}

function Avatar({
  initials,
  className,
  size = "size-8",
  label,
}: AvatarProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        size,
        className,
      )}
      aria-label={label ?? `Avatar for ${initials}`}
      role="img"
    >
      {initials}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Thumbnail — gradient preview with the project name overlaid
// ═══════════════════════════════════════════════════════════════════════

interface ThumbnailProps {
  project: Project;
  /** Height class for the thumbnail, e.g. "h-32" or "h-56". */
  heightClass?: string;
  /** Font size class for the overlay name. */
  nameClass?: string;
}

function Thumbnail({
  project,
  heightClass = "h-32",
  nameClass = "text-lg",
}: ThumbnailProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-gradient-to-br",
        project.gradient,
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
      <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
        <span
          className={cn(
            "font-semibold tracking-tight text-white drop-shadow-sm",
            nameClass,
          )}
        >
          {project.shortName}
        </span>
        <span className="mt-0.5 text-xs font-medium text-white/80">
          {project.tagline}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ScorePill — small pill displaying a score with icon + tone
// ═══════════════════════════════════════════════════════════════════════

interface ScorePillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function ScorePill({ icon, label, value }: ScorePillProps): React.JSX.Element {
  const tone = scoreTone(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        tone.bg,
        tone.text,
      )}
      title={`${label}: ${value} / 100`}
    >
      {icon}
      <span className="sr-only">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ScoreBar — horizontal bar for breakdown panels (detail dialog)
// ═══════════════════════════════════════════════════════════════════════

interface ScoreBarProps {
  label: string;
  value: number;
  unit?: string;
  /** If true, lower is better (e.g. LCP, FID, CLS). */
  lowerIsBetter?: boolean;
  /** Display formatter — defaults to the raw value. */
  format?: (value: number) => string;
}

function ScoreBar({
  label,
  value,
  unit,
  lowerIsBetter = false,
  format,
}: ScoreBarProps): React.JSX.Element {
  // For 0–100 scores, the bar fill = value. For metrics with `lowerIsBetter`
  // (LCP, FID, CLS) we synthesize a 0–100 score so the bar still reads
  // "better = fuller" to the user.
  const fillPct = lowerIsBetter
    ? Math.max(0, Math.min(100, 100 - (value / (unit === "ms" ? 100 : 2)) * 100))
    : Math.max(0, Math.min(100, value));
  const tone = scoreTone(fillPct);
  const display = format ? format(value) : `${value}${unit ? ` ${unit}` : ""}`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className={cn("font-semibold tabular-nums", tone.text)}>
          {display}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone.bar)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ProjectCard — single card in the grid
// ═══════════════════════════════════════════════════════════════════════

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
}

function ProjectCard({ project, onOpen }: ProjectCardProps): React.JSX.Element {
  const industryMeta = INDUSTRY_META[project.industry];
  const frameworkMeta = FRAMEWORK_META[project.framework];
  const difficultyMeta = DIFFICULTY_META[project.difficulty];

  return (
    <Card
      className={cn(
        "group flex h-full flex-col gap-0 overflow-hidden p-0 py-0",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-md",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      )}
    >
      {/* Thumbnail — clickable */}
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="focus-visible:outline-none"
        aria-label={`View details for ${project.name}`}
      >
        <div className="p-3 pb-0">
          <Thumbnail project={project} heightClass="h-32" nameClass="text-base" />
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onOpen(project)}
              className="focus-visible:outline-none focus-visible:underline"
            >
              <h3 className="truncate text-left font-semibold leading-tight text-foreground hover:text-primary">
                {project.shortName}
              </h3>
            </button>
            <div className="mt-1 flex items-center gap-1.5">
              <Avatar
                initials={project.author.initials}
                className={project.author.avatarClass}
                size="size-5"
                label={`Avatar for ${project.author.name}`}
              />
              <span className="truncate text-xs text-muted-foreground">
                {project.author.name}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" className={industryMeta.badge}>
              {project.industry}
            </Badge>
            <Badge variant="outline" className={frameworkMeta.badge}>
              {project.framework}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Stars value={project.stars} size="size-3.5" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {project.stars.toFixed(1)}
              <span className="sr-only">out of 5 stars</span>
            </span>
          </div>
          <Badge variant="outline" className={difficultyMeta.badge}>
            {project.difficulty}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <ScorePill
            icon={<Gauge className="size-3" aria-hidden />}
            label="Performance"
            value={project.perf.lighthouse}
          />
          <ScorePill
            icon={<Accessibility className="size-3" aria-hidden />}
            label="Accessibility"
            value={project.a11y.lighthouse}
          />
          <span className="ml-auto inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <Eye className="size-3.5" aria-hidden />
            {formatCompact(project.views)}
            <span className="sr-only">views</span>
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onOpen(project)}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Visit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            asChild
          >
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              <Github className="size-3.5" aria-hidden />
              <span className="sr-only">Source code for </span>
              Source
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// StatCell — small stat tile used inside the detail dialog
// ═══════════════════════════════════════════════════════════════════════

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
// ProjectDetailDialog — full-detail view
// ═══════════════════════════════════════════════════════════════════════

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisit: (project: Project) => void;
}

function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
  onVisit,
}: ProjectDetailDialogProps): React.JSX.Element | null {
  // Render an empty shell if there's no project — the Dialog stays closed.
  if (!project) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl" />
      </Dialog>
    );
  }

  const industryMeta = INDUSTRY_META[project.industry];
  const frameworkMeta = FRAMEWORK_META[project.framework];
  const difficultyMeta = DIFFICULTY_META[project.difficulty];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {/* Header — gradient preview */}
        <div className="relative">
          <Thumbnail
            project={project}
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

        <div className="flex max-h-[calc(92vh-12rem)] flex-col overflow-y-auto p-6">
          <DialogHeader className="text-left">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              <Badge variant="outline" className={industryMeta.badge}>
                {project.industry}
              </Badge>
              <Badge variant="outline" className={frameworkMeta.badge}>
                {project.framework}
              </Badge>
              <Badge variant="outline" className={difficultyMeta.badge}>
                {project.difficulty}
              </Badge>
            </div>
            <DialogDescription>
              <span className="text-muted-foreground">{project.tagline}</span>
              {" · "}
              Added {project.createdAt}
            </DialogDescription>
          </DialogHeader>

          {/* Author row */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Avatar
              initials={project.author.initials}
              className={project.author.avatarClass}
              size="size-10"
              label={`Avatar for ${project.author.name}`}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {project.author.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {project.author.title}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCell
              icon={<Eye className="size-4" aria-hidden />}
              label="Views"
              value={formatCompact(project.views)}
            />
            <StatCell
              icon={
                <Star
                  className="size-4 fill-amber-500 text-amber-500"
                  aria-hidden
                />
              }
              label="Rating"
              value={`${project.stars.toFixed(1)} / 5`}
            />
            <StatCell
              icon={<Gauge className="size-4" aria-hidden />}
              label="Perf"
              value={`${project.perf.lighthouse}`}
            />
            <StatCell
              icon={<Accessibility className="size-4" aria-hidden />}
              label="A11y"
              value={`${project.a11y.lighthouse}`}
            />
          </div>

          {/* Description */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground">
              Description
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>

          {/* Tech stack */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground">Tech stack</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="gap-1">
                  <Code2 className="size-3" aria-hidden />
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground">
              Features
            </h4>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {project.features.map((feature) => (
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

          {/* Performance breakdown */}
          <div className="mt-5">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Gauge className="size-4" aria-hidden />
              Performance breakdown
            </h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <ScoreBar
                label="Lighthouse"
                value={project.perf.lighthouse}
                format={(v) => `${v} / 100`}
              />
              <ScoreBar
                label="LCP"
                value={project.perf.lcp}
                unit="s"
                lowerIsBetter
                format={(v) => `${v.toFixed(2)} s`}
              />
              <ScoreBar
                label="FID"
                value={project.perf.fid}
                unit="ms"
                lowerIsBetter
                format={(v) => `${v} ms`}
              />
              <ScoreBar
                label="CLS"
                value={project.perf.cls}
                lowerIsBetter
                format={(v) => v.toFixed(3)}
              />
            </div>
          </div>

          {/* Accessibility breakdown */}
          <div className="mt-5">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Accessibility className="size-4" aria-hidden />
              Accessibility breakdown
            </h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <ScoreBar
                label="Lighthouse a11y"
                value={project.a11y.lighthouse}
                format={(v) => `${v} / 100`}
              />
              <ScoreBar
                label="Color contrast"
                value={project.a11y.contrast}
                format={(v) => `${v} / 100`}
              />
              <ScoreBar
                label="ARIA labels"
                value={project.a11y.aria}
                format={(v) => `${v} / 100`}
              />
              <ScoreBar
                label="Keyboard nav"
                value={project.a11y.keyboard}
                format={(v) => `${v} / 100`}
              />
              <ScoreBar
                label="Screen reader"
                value={project.a11y.screenReader}
                format={(v) => `${v} / 100`}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" aria-hidden />
                Source Code
              </a>
            </Button>
            <Button className="gap-2" onClick={() => onVisit(project)}>
              <Globe className="size-4" aria-hidden />
              Visit live site
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SubmitProjectDialog — mock submission form
// ═══════════════════════════════════════════════════════════════════════

interface SubmitFormState {
  name: string;
  url: string;
  description: string;
  industry: Industry | "";
  framework: Framework | "";
}

const INITIAL_FORM: SubmitFormState = {
  name: "",
  url: "",
  description: "",
  industry: "",
  framework: "",
};

interface SubmitProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: SubmitFormState) => void;
}

function SubmitProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: SubmitProjectDialogProps): React.JSX.Element {
  const [form, setForm] = useState<SubmitFormState>(INITIAL_FORM);

  const reset = useCallback(() => setForm(INITIAL_FORM), []);

  const handleClose = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) {
        // Defer reset so the close animation runs against the filled form.
        window.setTimeout(reset, 200);
      }
    },
    [onOpenChange, reset],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit(form);
      handleClose(false);
    },
    [form, onSubmit, handleClose],
  );

  const updateField = useCallback(
    <K extends keyof SubmitFormState>(
      key: K,
      value: SubmitFormState[K],
    ): void => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const isSubmitDisabled =
    form.name.trim().length === 0 ||
    form.url.trim().length === 0 ||
    form.industry.length === 0 ||
    form.framework.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5" aria-hidden />
            Submit a project
          </DialogTitle>
          <DialogDescription>
            Share your RoyCSS-powered project with the community. Submissions
            are reviewed before going live.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-label="Submit project form"
        >
          <div className="space-y-2">
            <Label htmlFor="submit-name">Project name</Label>
            <Input
              id="submit-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. MedTrack — Healthcare Dashboard"
              required
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-url">Project URL</Label>
            <Input
              id="submit-url"
              type="url"
              value={form.url}
              onChange={(e) => updateField("url", e.target.value)}
              placeholder="https://your-project.example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-desc">Description</Label>
            <Textarea
              id="submit-desc"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="A short paragraph describing what your project does and how it uses RoyCSS."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {form.description.length} / 500 characters
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="submit-industry">Industry</Label>
              <Select
                value={form.industry}
                onValueChange={(v) => updateField("industry", v as Industry)}
              >
                <SelectTrigger id="submit-industry" aria-label="Select industry">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_ORDER.filter(
                    (i): i is Industry => i !== "All",
                  ).map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submit-framework">Framework</Label>
              <Select
                value={form.framework}
                onValueChange={(v) => updateField("framework", v as Framework)}
              >
                <SelectTrigger
                  id="submit-framework"
                  aria-label="Select framework"
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORK_OPTIONS.filter(
                    (f): f is { value: Framework; label: string } =>
                      f.value !== "All",
                  ).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              Submit for review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SegmentedControl — generic single-select pill group (re-used for the
// framework + difficulty filters).
// ═══════════════════════════════════════════════════════════════════════

interface SegmentedControlProps<V extends string> {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}

function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<V>): React.JSX.Element {
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-full border p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
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
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyShowcase — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function RoyShowcase(): React.JSX.Element {
  const { toast } = useToast();

  const [search, setSearch] = useState<string>("");
  const [industry, setIndustry] = useState<IndustryFilter>("All");
  const [framework, setFramework] = useState<FrameworkFilter>("All");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [sort, setSort] = useState<SortKey>("popular");
  const [active, setActive] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [submitOpen, setSubmitOpen] = useState<boolean>(false);

  // ─── Aggregate stats (memoized once — depends only on PROJECTS) ────
  const stats = useMemo(() => {
    const total = PROJECTS.length;
    const industries = new Set(PROJECTS.map((p) => p.industry)).size;
    const avgPerf =
      PROJECTS.reduce((sum, p) => sum + p.perf.lighthouse, 0) /
      Math.max(total, 1);
    const avgA11y =
      PROJECTS.reduce((sum, p) => sum + p.a11y.lighthouse, 0) /
      Math.max(total, 1);
    return { total, industries, avgPerf, avgA11y };
  }, []);

  // ─── Filter + sort pipeline (memoized on every input) ───────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = PROJECTS.filter((p) => {
      // Industry
      if (industry !== "All" && p.industry !== industry) return false;
      // Framework
      if (framework !== "All" && p.framework !== framework) return false;
      // Difficulty
      if (difficulty !== "All" && p.difficulty !== difficulty) return false;
      // Search — case-insensitive substring on name
      if (q.length > 0 && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });

    // Copy before sort so we don't mutate the readonly source.
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.views - a.views;
        case "rated":
          // Higher rating first; break ties by reviews count.
          if (b.stars !== a.stars) return b.stars - a.stars;
          return b.reviews - a.reviews;
        case "newest":
          // ISO date strings compare lexicographically — newer first.
          return b.createdAt.localeCompare(a.createdAt);
        case "performance":
          // Higher Lighthouse score first; break ties by a11y score.
          if (b.perf.lighthouse !== a.perf.lighthouse)
            return b.perf.lighthouse - a.perf.lighthouse;
          return b.a11y.lighthouse - a.a11y.lighthouse;
        default:
          return 0;
      }
    });

    return sorted;
  }, [search, industry, framework, difficulty, sort]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleOpen = useCallback((project: Project) => {
    setActive(project);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Defer clearing so the close animation runs against the right data.
      window.setTimeout(() => setActive(null), 200);
    }
  }, []);

  const handleVisit = useCallback(
    (project: Project) => {
      toast({
        title: "Opening project",
        description: `Loading ${project.name}…`,
      });
    },
    [toast],
  );

  const handleSubmit = useCallback(
    (form: SubmitFormState) => {
      toast({
        title: "Project submitted",
        description: `"${form.name || "Untitled project"}" is now in the review queue.`,
      });
    },
    [toast],
  );

  const hasFilters =
    search.trim().length > 0 ||
    industry !== "All" ||
    framework !== "All" ||
    difficulty !== "All";

  const resetFilters = useCallback(() => {
    setSearch("");
    setIndustry("All");
    setFramework("All");
    setDifficulty("All");
    setSort("popular");
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Users className="size-5 text-primary" aria-hidden />
          Roy Showcase
        </CardTitle>
        <CardDescription>
          {stats.total} projects · {stats.industries} industries · Avg
          performance {stats.avgPerf.toFixed(0)} · Avg a11y{" "}
          {stats.avgA11y.toFixed(0)}
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setSubmitOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Submit Project
          </Button>
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
              placeholder="Search projects by name…"
              className="pl-9"
              aria-label="Search projects"
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
              <SelectTrigger className="w-[200px]" aria-label="Sort projects">
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

        {/* ─── Framework + difficulty segmented controls ─────────── */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <GitBranch
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            <SegmentedControl
              options={FRAMEWORK_OPTIONS}
              value={framework}
              onChange={setFramework}
              ariaLabel="Filter by framework"
            />
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-muted-foreground" aria-hidden />
            <SegmentedControl
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
              ariaLabel="Filter by difficulty"
            />
          </div>
        </div>

        {/* ─── Industry chips ─────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by industry"
        >
          {INDUSTRY_ORDER.map((ind) => {
            const isActive = industry === ind;
            const meta = ind === "All" ? null : INDUSTRY_META[ind];
            return (
              <button
                key={ind}
                type="button"
                onClick={() => setIndustry(ind)}
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
                {ind}
              </button>
            );
          })}
        </div>

        {/* ─── Visible-count + reset row ─────────────────────────── */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {visible.length}
            </span>{" "}
            of {stats.total} projects shown
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-accent hover:text-foreground"
            >
              <X className="size-3" aria-hidden />
              Reset filters
            </button>
          )}
        </div>

        {/* ─── Grid ──────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
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
              <p className="font-medium text-foreground">No projects found</p>
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

      <ProjectDetailDialog
        project={active}
        open={dialogOpen}
        onOpenChange={handleClose}
        onVisit={handleVisit}
      />

      <SubmitProjectDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}
