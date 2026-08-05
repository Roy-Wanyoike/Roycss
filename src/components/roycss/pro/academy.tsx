"use client";

/**
 * Academy — a self-contained LMS (Learning Management System) demo.
 *
 * Ships four RoyCSS learning paths (Associate → Architect), each with a
 * vertical lesson list (completed / current / locked states), an inline
 * lesson detail panel, a four-tier certification registry with graduated
 * badges (emerald / amber / rose / violet — NO indigo / blue), and a
 * progress overview stats bar.
 *
 * Self-contained: no props, all mock data lives in this file. State is
 * local React state. SSR-safe mount detection via `useSyncExternalStore`
 * prevents hydration mismatches. TS strict, zero `any`.
 */

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  CircleCheck,
  CirclePlay,
  Clock,
  Crown,
  FileQuestion,
  FileText,
  GraduationCap,
  HandMetal,
  Library,
  ListChecks,
  ListTodo,
  Lock,
  Medal,
  Play,
  Ribbon,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ═══════════════════════════════════════════════════════════════════════
// useMounted — SSR-safe mount detection via useSyncExternalStore.
// Returns false during SSR + first client render, then true.
// Avoids hydration mismatches on time-sensitive UI (e.g. registry dates).
// ═══════════════════════════════════════════════════════════════════════

const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Level = "Beginner" | "Intermediate" | "Advanced" | "Expert";

type LessonType = "Video" | "Reading" | "Quiz" | "Hands-on";

type LessonStatus = "completed" | "current" | "available" | "locked";

interface Lesson {
  id: string;
  number: number;
  title: string;
  type: LessonType;
  duration: string; // "12 min" | "1h 05m"
  summary: string;
  status: LessonStatus;
}

interface LearningPath {
  id: string;
  title: string;
  level: Level;
  lessons: number;
  duration: string; // "2 hours"
  price: string; // "Free" | "$99"
  progress: number; // 0..100
  blurb: string;
  accent: AccentKey;
  lessonList: Lesson[];
}

type AccentKey = "emerald" | "amber" | "rose" | "violet";

interface Certification {
  id: string;
  name: string;
  level: Level;
  accent: AccentKey;
  requirements: string[];
  registry: string; // mock registry number
  earned: boolean;
  examMinutes: number;
  passingScore: number;
}

// ═══════════════════════════════════════════════════════════════════════
// Accent palette — emerald / amber / rose / violet only (NO indigo/blue)
// ═══════════════════════════════════════════════════════════════════════

interface AccentTokens {
  badge: string; // level badge chip classes
  badgeText: string;
  ring: string; // selected card ring
  progress: string; // progress bar fill
  progressBg: string;
  badgeIconBg: string; // cert badge circle bg
  badgeIconRing: string;
  badgeIconText: string;
  dot: string; // small dot
  softHover: string; // hover bg on cards
}

const ACCENTS: Record<AccentKey, AccentTokens> = {
  emerald: {
    badge: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/50 border-emerald-500/40",
    progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
    progressBg: "bg-emerald-500/15",
    badgeIconBg: "bg-emerald-500/15",
    badgeIconRing: "ring-emerald-500/30",
    badgeIconText: "text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
    softHover: "hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]",
  },
  amber: {
    badge: "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
    badgeText: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/50 border-amber-500/40",
    progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
    progressBg: "bg-amber-500/15",
    badgeIconBg: "bg-amber-500/15",
    badgeIconRing: "ring-amber-500/30",
    badgeIconText: "text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
    softHover: "hover:border-amber-500/40 hover:bg-amber-500/[0.03]",
  },
  rose: {
    badge: "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25",
    badgeText: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500/50 border-rose-500/40",
    progress: "[&_[data-slot=progress-indicator]]:bg-rose-500",
    progressBg: "bg-rose-500/15",
    badgeIconBg: "bg-rose-500/15",
    badgeIconRing: "ring-rose-500/30",
    badgeIconText: "text-rose-600 dark:text-rose-300",
    dot: "bg-rose-500",
    softHover: "hover:border-rose-500/40 hover:bg-rose-500/[0.03]",
  },
  violet: {
    badge: "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/25",
    badgeText: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-500/50 border-violet-500/40",
    progress: "[&_[data-slot=progress-indicator]]:bg-violet-500",
    progressBg: "bg-violet-500/15",
    badgeIconBg: "bg-violet-500/15",
    badgeIconRing: "ring-violet-500/30",
    badgeIconText: "text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500",
    softHover: "hover:border-violet-500/40 hover:bg-violet-500/[0.03]",
  },
};

const LEVEL_ORDER: Record<Level, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
  Expert: 3,
};

// ═══════════════════════════════════════════════════════════════════════
// Lesson type iconography
// ═══════════════════════════════════════════════════════════════════════

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const LESSON_TYPE_ICON: Record<LessonType, IconType> = {
  Video: CirclePlay,
  Reading: FileText,
  Quiz: FileQuestion,
  "Hands-on": HandMetal,
};

const LESSON_TYPE_TONE: Record<LessonType, string> = {
  Video: "text-emerald-600 dark:text-emerald-400",
  Reading: "text-amber-600 dark:text-amber-400",
  Quiz: "text-rose-600 dark:text-rose-400",
  "Hands-on": "text-violet-600 dark:text-violet-400",
};

// ═══════════════════════════════════════════════════════════════════════
// Mock data
// ═══════════════════════════════════════════════════════════════════════

const LEARNING_PATHS: readonly LearningPath[] = [
  {
    id: "associate",
    title: "RoyCSS Associate",
    level: "Beginner",
    lessons: 6,
    duration: "2 hours",
    price: "Free",
    progress: 100,
    accent: "emerald",
    blurb:
      "Foundations of the RoyCSS design system — tokens, semantic colors, layout primitives, and the effect taxonomy.",
    lessonList: [
      {
        id: "assoc-1",
        number: 1,
        title: "Welcome to RoyCSS",
        type: "Video",
        duration: "8 min",
        status: "completed",
        summary:
          "A tour of the RoyCSS philosophy: design tokens first, semantic colors second, utility primitives on top.",
      },
      {
        id: "assoc-2",
        number: 2,
        title: "Design tokens & CSS variables",
        type: "Reading",
        duration: "15 min",
        status: "completed",
        summary:
          "Understand the oklch-based token scale and how RoyCSS maps tokens to semantic surface roles.",
      },
      {
        id: "assoc-3",
        number: 3,
        title: "Semantic color roles",
        type: "Video",
        duration: "12 min",
        status: "completed",
        summary:
          "primary, secondary, accent, muted, destructive — what each role means and when to reach for it.",
      },
      {
        id: "assoc-4",
        number: 4,
        title: "Layout primitives quiz",
        type: "Quiz",
        duration: "10 min",
        status: "completed",
        summary:
          "Six questions on Container, Section, Stack and the spacing scale. Pass with 80% to unlock the next lesson.",
      },
      {
        id: "assoc-5",
        number: 5,
        title: "Build your first card",
        type: "Hands-on",
        duration: "25 min",
        status: "completed",
        summary:
          "Compose Card + Badge + Button into a profile card. Submit your code for automated review.",
      },
      {
        id: "assoc-6",
        number: 6,
        title: "Recap & next steps",
        type: "Video",
        duration: "6 min",
        status: "completed",
        summary:
          "Wrap-up and roadmap to the Professional tier. You've earned the Associate badge!",
      },
    ],
  },
  {
    id: "professional",
    title: "RoyCSS Professional",
    level: "Intermediate",
    lessons: 12,
    duration: "5 hours",
    price: "$99",
    progress: 58,
    accent: "amber",
    blurb:
      "Component composition, theming, dark mode, accessibility primitives, and the Inspector workflow.",
    lessonList: [
      {
        id: "prof-1",
        number: 1,
        title: "Component anatomy",
        type: "Video",
        duration: "18 min",
        status: "completed",
        summary:
          "Decompose a Button into its variants, sizes, and slot composition model.",
      },
      {
        id: "prof-2",
        number: 2,
        title: "Variants with CVA",
        type: "Reading",
        duration: "22 min",
        status: "completed",
        summary:
          "Class-variance-authority patterns for type-safe, tree-shakeable variant styles.",
      },
      {
        id: "prof-3",
        number: 3,
        title: "Theme provider & dark mode",
        type: "Video",
        duration: "26 min",
        status: "completed",
        summary:
          "SSR-safe theme switching with no flash. Logical properties for RTL readiness.",
      },
      {
        id: "prof-4",
        number: 4,
        title: "Color contrast in practice",
        type: "Quiz",
        duration: "15 min",
        status: "completed",
        summary:
          "Eight contrast scenarios. Identify AA vs AAA failures across light and dark themes.",
      },
      {
        id: "prof-5",
        number: 5,
        title: "Inspector-driven debugging",
        type: "Hands-on",
        duration: "40 min",
        status: "completed",
        summary:
          "Install the RoyCSS DevTools inspector. Audit a real page for token drift and selector specificity.",
      },
      {
        id: "prof-6",
        number: 6,
        title: "Form patterns",
        type: "Video",
        duration: "30 min",
        status: "completed",
        summary:
          "Field, Label, Help text, Error — accessible form composition with zero custom CSS.",
      },
      {
        id: "prof-7",
        number: 7,
        title: "Focus rings & keyboard nav",
        type: "Reading",
        duration: "20 min",
        status: "completed",
        summary:
          "Visible focus, focus-visible, skip-links, and the roving tabindex pattern.",
      },
      {
        id: "prof-8",
        number: 8,
        title: "Building a data table",
        type: "Hands-on",
        duration: "55 min",
        status: "current",
        summary:
          "Compose Table + Toolbar + Pagination into a sortable, filterable data grid. Currently in progress.",
      },
      {
        id: "prof-9",
        number: 9,
        title: "Animation primitives",
        type: "Video",
        duration: "24 min",
        status: "available",
        summary:
          "tw-animate-css utilities, reduced-motion respect, and the RoyMotion primitive library.",
      },
      {
        id: "prof-10",
        number: 10,
        title: "Modal & dialog patterns",
        type: "Reading",
        duration: "18 min",
        status: "available",
        summary:
          "Focus trapping, scroll lock, and the difference between Dialog, Sheet, and Drawer.",
      },
      {
        id: "prof-11",
        number: 11,
        title: "Pro capstone quiz",
        type: "Quiz",
        duration: "20 min",
        status: "locked",
        summary:
          "Locked until lesson 10 is complete. Twelve questions covering the Professional tier.",
      },
      {
        id: "prof-12",
        number: 12,
        title: "Capstone: dashboard",
        type: "Hands-on",
        duration: "90 min",
        status: "locked",
        summary:
          "Build a complete analytics dashboard. Submit for review to qualify for the Professional certificate.",
      },
    ],
  },
  {
    id: "expert",
    title: "RoyCSS Expert",
    level: "Advanced",
    lessons: 18,
    duration: "10 hours",
    price: "$199",
    progress: 22,
    accent: "rose",
    blurb:
      "Performance budgets, container queries, view transitions, and shipping a production design system.",
    lessonList: [
      {
        id: "exp-1",
        number: 1,
        title: "Performance budgets",
        type: "Video",
        duration: "32 min",
        status: "completed",
        summary:
          "Set CSS byte budgets, LCP targets, and CLS ceilings. Wire them into CI.",
      },
      {
        id: "exp-2",
        number: 2,
        title: "Critical CSS extraction",
        type: "Reading",
        duration: "28 min",
        status: "completed",
        summary:
          "Above-the-fold extraction, deferred CSS, and the cascade-as-a-tree mental model.",
      },
      {
        id: "exp-3",
        number: 3,
        title: "Container queries deep dive",
        type: "Video",
        duration: "45 min",
        status: "completed",
        summary:
          "@container, container-type, and component-driven responsive design. Replace viewport queries for good.",
      },
      {
        id: "exp-4",
        number: 4,
        title: "View Transitions API",
        type: "Video",
        duration: "38 min",
        status: "completed",
        summary:
          "Single-page and cross-document view transitions with named elements and custom easing.",
      },
      {
        id: "exp-5",
        number: 5,
        title: "Scroll-driven animations",
        type: "Hands-on",
        duration: "60 min",
        status: "current",
        summary:
          "animation-timeline, view(), and scroll(). Build a sticky progress header. Currently in progress.",
      },
      {
        id: "exp-6",
        number: 6,
        title: "CSS Houdini paint worklets",
        type: "Reading",
        duration: "30 min",
        status: "available",
        summary:
          "Custom paint for noise, gradients, and texture — with progressive enhancement.",
      },
      {
        id: "exp-7",
        number: 7,
        title: "Anchor positioning",
        type: "Video",
        duration: "26 min",
        status: "available",
        summary:
          "anchor-name, position-anchor, and CSS-driven popovers without JavaScript positioning.",
      },
      {
        id: "exp-8",
        number: 8,
        title: "Subgrid & nested layouts",
        type: "Reading",
        duration: "24 min",
        status: "available",
        summary:
          "When subgrid saves you a wrapper, and when it costs you a refactor.",
      },
      {
        id: "exp-9",
        number: 9,
        title: "Scoped styles & cascade layers",
        type: "Video",
        duration: "35 min",
        status: "available",
        summary:
          "@layer and @scope — bring discipline to large codebases without !important wars.",
      },
      {
        id: "exp-10",
        number: 10,
        title: "Design tokens pipeline",
        type: "Hands-on",
        duration: "75 min",
        status: "available",
        summary:
          "Style Dictionary → tokens.css → runtime theme switching. Ship a multi-brand theme.",
      },
      {
        id: "exp-11",
        number: 11,
        title: "Build a component library",
        type: "Video",
        duration: "42 min",
        status: "available",
        summary:
          "tsup, package exports, sideEffects, and tree-shakeable CSS.",
      },
      {
        id: "exp-12",
        number: 12,
        title: "Expert quiz: foundations",
        type: "Quiz",
        duration: "25 min",
        status: "available",
        summary:
          "Twenty questions on the foundations covered so far. Pass at 85% to continue.",
      },
      {
        id: "exp-13",
        number: 13,
        title: "Reduced-motion & a11y",
        type: "Reading",
        duration: "22 min",
        status: "locked",
        summary:
          "prefers-reduced-motion, prefers-contrast, forced-colors mode. Locked until quiz 12 is passed.",
      },
      {
        id: "exp-14",
        number: 14,
        title: "Internationalization & RTL",
        type: "Reading",
        duration: "28 min",
        status: "locked",
        summary:
          "Logical properties, dir-aware utilities, and bidi typography.",
      },
      {
        id: "exp-15",
        number: 15,
        title: "Build: full theme system",
        type: "Hands-on",
        duration: "110 min",
        status: "locked",
        summary:
          "Multi-theme, multi-brand, dark + high-contrast + RTL in one package.",
      },
      {
        id: "exp-16",
        number: 16,
        title: "Migration playbook",
        type: "Video",
        duration: "30 min",
        status: "locked",
        summary:
          "Migrating a 100k-LOC Tailwind v3 codebase to v4 + RoyCSS without a big-bang rewrite.",
      },
      {
        id: "exp-17",
        number: 17,
        title: "Expert capstone quiz",
        type: "Quiz",
        duration: "30 min",
        status: "locked",
        summary:
          "Locked. The final Expert-tier knowledge check. Pass at 90%.",
      },
      {
        id: "exp-18",
        number: 18,
        title: "Capstone: ship a system",
        type: "Hands-on",
        duration: "150 min",
        status: "locked",
        summary:
          "Locked. Ship a complete RoyCSS-based design system to a private registry.",
      },
    ],
  },
  {
    id: "architect",
    title: "RoyCSS Architect",
    level: "Expert",
    lessons: 24,
    duration: "15 hours",
    price: "$299",
    progress: 4,
    accent: "violet",
    blurb:
      "Governance, multi-team scale, design-systems-as-product, and the ten-year architecture.",
    lessonList: [
      {
        id: "arch-1",
        number: 1,
        title: "Architect's charter",
        type: "Video",
        duration: "22 min",
        status: "completed",
        summary:
          "What a staff/principal CSS architect actually owns. Setting the scope and the mandate.",
      },
      {
        id: "arch-2",
        number: 2,
        title: "Tokens as a contract",
        type: "Reading",
        duration: "30 min",
        status: "current",
        summary:
          "Token governance: source of truth, deprecation policy, semver for design. Currently in progress.",
      },
      {
        id: "arch-3",
        number: 3,
        title: "Multi-team contribution",
        type: "Video",
        duration: "40 min",
        status: "available",
        summary:
          "RFCs, ADRs, and the design-systems-as-product operating model.",
      },
      {
        id: "arch-4",
        number: 4,
        title: "Versioning & changelog",
        type: "Reading",
        duration: "26 min",
        status: "available",
        summary:
          "Changesets, automated releases, and breaking-change communication.",
      },
      {
        id: "arch-5",
        number: 5,
        title: "Adoption metrics",
        type: "Video",
        duration: "34 min",
        status: "available",
        summary:
          "Token coverage, component usage, custom-CSS drift. Dashboards that drive decisions.",
      },
      {
        id: "arch-6",
        number: 6,
        title: "Composable theming",
        type: "Reading",
        duration: "28 min",
        status: "available",
        summary:
          "Brand layering, white-label exports, and runtime theme injection.",
      },
      {
        id: "arch-7",
        number: 7,
        title: "Compiler & tooling",
        type: "Video",
        duration: "45 min",
        status: "available",
        summary:
          "Lightning CSS, the Tailwind v4 oxide engine, and where RoyCSS plugs in.",
      },
      {
        id: "arch-8",
        number: 8,
        title: "Build a CLI",
        type: "Hands-on",
        duration: "90 min",
        status: "available",
        summary:
          "Ship a `roycss` CLI: init, migrate, audit, tokenize. With plugin hooks.",
      },
      {
        id: "arch-9",
        number: 9,
        title: "Inspector v2 architecture",
        type: "Video",
        duration: "50 min",
        status: "available",
        summary:
          "DevTools protocol, content scripts, and a postMessage contract that survives manifest v3.",
      },
      {
        id: "arch-10",
        number: 10,
        title: "VS Code extension deep dive",
        type: "Video",
        duration: "42 min",
        status: "available",
        summary:
          "Language server, completion provider, diagnostics. The full LSP loop.",
      },
      {
        id: "arch-11",
        number: 11,
        title: "MCP server design",
        type: "Reading",
        duration: "32 min",
        status: "available",
        summary:
          "Model Context Protocol: exposing tokens, recipes, and patterns to AI agents.",
      },
      {
        id: "arch-12",
        number: 12,
        title: "Quiz: governance",
        type: "Quiz",
        duration: "25 min",
        status: "available",
        summary:
          "Fifteen questions on governance, versioning, and adoption. Pass at 85%.",
      },
      {
        id: "arch-13",
        number: 13,
        title: "Performance at scale",
        type: "Video",
        duration: "38 min",
        status: "locked",
        summary:
          "Locked. CSS regression testing, bundle budgets across 50 teams, and the per-route audit pipeline.",
      },
      {
        id: "arch-14",
        number: 14,
        title: "Edge & streaming CSS",
        type: "Reading",
        duration: "30 min",
        status: "locked",
        summary:
          "Locked. Per-route critical CSS, streaming HTML, and zero-CSS above-the-fold.",
      },
      {
        id: "arch-15",
        number: 15,
        title: "Accessibility program",
        type: "Video",
        duration: "44 min",
        status: "locked",
        summary:
          "Locked. Axe in CI, automated contrast gates, and a11y champions across teams.",
      },
      {
        id: "arch-16",
        number: 16,
        title: "Build: design tokens API",
        type: "Hands-on",
        duration: "120 min",
        status: "locked",
        summary:
          "Locked. A REST + GraphQL tokens API with brand segmentation and audit trail.",
      },
      {
        id: "arch-17",
        number: 17,
        title: "Documentation platform",
        type: "Reading",
        duration: "36 min",
        status: "locked",
        summary:
          "Locked. Docs-as-product. Zero-block docs, MDX, live playgrounds, search.",
      },
      {
        id: "arch-18",
        number: 18,
        title: "Storybook & visual regression",
        type: "Hands-on",
        duration: "80 min",
        status: "locked",
        summary:
          "Locked. Storybook 8 + Chromatic. Per-PR pixel diffing and review gates.",
      },
      {
        id: "arch-19",
        number: 19,
        title: "Migration at 1M LOC",
        type: "Video",
        duration: "48 min",
        status: "locked",
        summary:
          "Locked. Codemods, AST transforms, and the staged migration playbook.",
      },
      {
        id: "arch-20",
        number: 20,
        title: "Ten-year architecture",
        type: "Reading",
        duration: "40 min",
        status: "locked",
        summary:
          "Locked. Cascade layers, scope, anchor, container — what survives the next decade.",
      },
      {
        id: "arch-21",
        number: 21,
        title: "Architect quiz: scale",
        type: "Quiz",
        duration: "35 min",
        status: "locked",
        summary:
          "Locked. Twenty-five questions on scale, migration, and governance. Pass at 90%.",
      },
      {
        id: "arch-22",
        number: 22,
        title: "Capstone: design system OS",
        type: "Hands-on",
        duration: "180 min",
        status: "locked",
        summary:
          "Locked. Ship a complete design-systems operating system: tokens, components, docs, CLI, inspector.",
      },
      {
        id: "arch-23",
        number: 23,
        title: "Defending your thesis",
        type: "Video",
        duration: "30 min",
        status: "locked",
        summary:
          "Locked. Present your capstone to a panel of staff engineers. Q&A and review.",
      },
      {
        id: "arch-24",
        number: 24,
        title: "Architect pinning ceremony",
        type: "Video",
        duration: "12 min",
        status: "locked",
        summary:
          "Locked. The final lesson. Earn the Architect badge and join the registry.",
      },
    ],
  },
];

const CERTIFICATIONS: readonly Certification[] = [
  {
    id: "cert-assoc",
    name: "RoyCSS Associate Certification",
    level: "Beginner",
    accent: "emerald",
    requirements: [
      "Complete the RoyCSS Associate learning path (6 lessons)",
      "Pass the Associate exam with 75% or higher",
      "Submit the capstone card for automated review",
    ],
    registry: "RYC-A-2024-0001",
    earned: true,
    examMinutes: 45,
    passingScore: 75,
  },
  {
    id: "cert-prof",
    name: "RoyCSS Professional Certification",
    level: "Intermediate",
    accent: "amber",
    requirements: [
      "Complete the Professional learning path (12 lessons)",
      "Pass the Professional exam with 80% or higher",
      "Submit the capstone dashboard for review",
      "Hold an active Associate certification",
    ],
    registry: "RYC-P-2024-0084",
    earned: false,
    examMinutes: 90,
    passingScore: 80,
  },
  {
    id: "cert-exp",
    name: "RoyCSS Expert Certification",
    level: "Advanced",
    accent: "rose",
    requirements: [
      "Complete the Expert learning path (18 lessons)",
      "Pass the Expert exam with 85% or higher",
      "Ship a complete theme system capstone",
      "Hold an active Professional certification",
    ],
    registry: "RYC-E-2025-0137",
    earned: false,
    examMinutes: 120,
    passingScore: 85,
  },
  {
    id: "cert-arch",
    name: "RoyCSS Architect Certification",
    level: "Expert",
    accent: "violet",
    requirements: [
      "Complete the Architect learning path (24 lessons)",
      "Pass the Architect exam with 90% or higher",
      "Defend the capstone before a staff-engineer panel",
      "Hold an active Expert certification",
    ],
    registry: "RYC-X-2025-0009",
    earned: false,
    examMinutes: 150,
    passingScore: 90,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Small subcomponents
// ═══════════════════════════════════════════════════════════════════════

function CertBadgeIcon({
  accent,
  size = "md",
}: {
  accent: AccentKey;
  size?: "sm" | "md" | "lg";
}) {
  const t = ACCENTS[accent];
  const dims =
    size === "lg"
      ? "size-16"
      : size === "sm"
        ? "size-9"
        : "size-12";
  const icon =
    accent === "emerald" ? Award : accent === "amber" ? Medal : accent === "rose" ? Ribbon : Crown;
  const Icon = icon;
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full ring-2",
        dims,
        t.badgeIconBg,
        t.badgeIconRing,
        t.badgeIconText,
      )}
    >
      <Icon className={size === "lg" ? "size-8" : size === "sm" ? "size-4" : "size-5"} />
    </div>
  );
}

function LevelBadge({ level, accent }: { level: Level; accent: AccentKey }) {
  const t = ACCENTS[accent];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        t.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden />
      {level}
    </span>
  );
}

function LessonTypeTag({ type }: { type: LessonType }) {
  const Icon = LESSON_TYPE_ICON[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        LESSON_TYPE_TONE[type],
      )}
    >
      <Icon className="size-3" aria-hidden />
      {type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Path card
// ═══════════════════════════════════════════════════════════════════════

function PathCard({
  path,
  selected,
  onSelect,
}: {
  path: LearningPath;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const t = ACCENTS[path.accent];
  const isStarted = path.progress > 0;
  const isComplete = path.progress >= 100;
  const cta = isComplete ? "Review" : isStarted ? "Continue" : "Start";

  return (
    <button
      type="button"
      onClick={() => onSelect(path.id)}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full w-full flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        t.softHover,
        selected ? cn("ring-2", t.ring) : "hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CertBadgeIcon accent={path.accent} size="sm" />
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">{path.title}</span>
            <LevelBadge level={path.level} accent={path.accent} />
          </div>
        </div>
        {isComplete && (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <CircleCheck className="size-3" aria-hidden /> Done
          </Badge>
        )}
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{path.blurb}</p>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Lessons</dt>
          <dd className="font-medium tabular-nums">{path.lessons}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">{path.duration}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Price</dt>
          <dd className={cn("font-semibold", path.price === "Free" && t.badgeText)}>
            {path.price}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isStarted ? `${path.progress}% complete` : "Not started"}
          </span>
          <span className="tabular-nums text-muted-foreground">{path.progress}%</span>
        </div>
        <Progress
          value={path.progress}
          className={cn("h-1.5", t.progressBg, t.progress)}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isComplete ? "Certificate earned" : isStarted ? "In progress" : "Ready to begin"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              t.badgeText,
            )}
          >
            {cta}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Lesson row
// ═══════════════════════════════════════════════════════════════════════

function LessonRow({
  lesson,
  onClick,
  isActive,
}: {
  lesson: Lesson;
  onClick: () => void;
  isActive: boolean;
}) {
  const Icon = LESSON_TYPE_ICON[lesson.type];
  const isCompleted = lesson.status === "completed";
  const isCurrent = lesson.status === "current";
  const isLocked = lesson.status === "locked";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={isLocked}
        aria-current={isCurrent ? "true" : undefined}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isLocked
            ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-60"
            : isActive
              ? "border-primary/40 bg-accent/60"
              : "border-border/60 bg-card hover:border-border hover:bg-accent/40",
          isCurrent && "ring-1 ring-primary/30",
        )}
      >
        {/* status indicator */}
        <span className="grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold">
          {isCompleted ? (
            <CircleCheck className="size-5 text-emerald-500" aria-label="Completed" />
          ) : isLocked ? (
            <Lock className="size-4 text-muted-foreground" aria-label="Locked" />
          ) : isCurrent ? (
            <span className={cn("size-2.5 rounded-full bg-primary")} aria-label="In progress" />
          ) : (
            <span className="text-muted-foreground tabular-nums">{lesson.number}</span>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-medium",
                isCompleted && "text-foreground",
                isCurrent && "text-foreground",
                isLocked && "text-muted-foreground",
                !isCompleted && !isCurrent && !isLocked && "text-foreground",
              )}
            >
              {lesson.number}. {lesson.title}
            </span>
            {isCurrent && (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                Current
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className={cn("size-3.5", LESSON_TYPE_TONE[lesson.type])} aria-hidden />
            <span className="tabular-nums">{lesson.duration}</span>
            <span aria-hidden>·</span>
            <LessonTypeTag type={lesson.type} />
          </div>
        </div>

        {!isLocked && (
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </button>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Lesson list panel (left column of the curriculum)
// ═══════════════════════════════════════════════════════════════════════

function LessonListPanel({
  path,
  activeLessonId,
  onLessonClick,
}: {
  path: LearningPath;
  activeLessonId: string | null;
  onLessonClick: (lesson: Lesson) => void;
}) {
  const t = ACCENTS[path.accent];
  const completedCount = path.lessonList.filter((l) => l.status === "completed").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Library className="size-4 text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-semibold">Curriculum</h3>
          <Badge variant="secondary" className="tabular-nums">
            {completedCount}/{path.lessons}
          </Badge>
        </div>
        <span className={cn("text-xs font-medium", t.badgeText)}>{path.progress}%</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {path.lessonList.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            isActive={lesson.id === activeLessonId}
            onClick={() => onLessonClick(lesson)}
          />
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Lesson detail (right column of the curriculum — inline preview)
// ═══════════════════════════════════════════════════════════════════════

function LessonDetailPanel({
  path,
  lesson,
  onOpenFull,
}: {
  path: LearningPath;
  lesson: Lesson | null;
  onOpenFull: () => void;
}) {
  const t = ACCENTS[path.accent];

  if (!lesson) {
    return (
      <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
        <CirclePlay className="size-8 text-muted-foreground/60" aria-hidden />
        <p className="text-sm font-medium text-muted-foreground">
          Select a lesson to preview
        </p>
        <p className="max-w-xs text-xs text-muted-foreground/80">
          Click any unlocked lesson on the left to see its summary here, or open the full
          lesson view.
        </p>
      </div>
    );
  }

  const Icon = LESSON_TYPE_ICON[lesson.type];
  const isLocked = lesson.status === "locked";

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-lg ring-1",
              t.badgeIconBg,
              t.badgeIconRing,
              t.badgeIconText,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Lesson {lesson.number} of {path.lessons}
            </span>
            <h4 className="text-base font-semibold leading-tight">{lesson.title}</h4>
          </div>
        </div>
        <LessonTypeTag type={lesson.type} />
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          <span className="tabular-nums">{lesson.duration}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="size-3.5" aria-hidden />
          {path.title}
        </span>
        {isLocked ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Lock className="size-3.5" aria-hidden /> Locked
          </span>
        ) : lesson.status === "completed" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="size-3.5" aria-hidden /> Completed
          </span>
        ) : lesson.status === "current" ? (
          <span className={cn("inline-flex items-center gap-1.5", t.badgeText)}>
            <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden /> In progress
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Play className="size-3.5" aria-hidden /> Available
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{lesson.summary}</p>

      <div className="mt-auto flex items-center gap-2 pt-2">
        <Button
          size="sm"
          disabled={isLocked}
          onClick={onOpenFull}
          className={cn(isLocked && "opacity-50")}
        >
          <Play className="size-3.5" aria-hidden />
          {isLocked ? "Locked" : lesson.status === "completed" ? "Review lesson" : "Open lesson"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {lesson.type === "Quiz"
            ? `${path.title} quiz`
            : lesson.type === "Hands-on"
              ? "Hands-on exercise"
              : lesson.type === "Video"
                ? "Video lesson"
                : "Reading material"}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Certification card
// ═══════════════════════════════════════════════════════════════════════

function CertificationCard({
  cert,
  onTakeExam,
}: {
  cert: Certification;
  onTakeExam: (cert: Certification) => void;
}) {
  const t = ACCENTS[cert.accent];
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors",
        cert.earned ? t.ring : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <CertBadgeIcon accent={cert.accent} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-tight">{cert.name}</h3>
            {cert.earned ? (
              <Badge
                variant="outline"
                className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                <CircleCheck className="size-3" aria-hidden /> Earned
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0">
                <Lock className="size-3" aria-hidden /> Pending
              </Badge>
            )}
          </div>
          <LevelBadge level={cert.level} accent={cert.accent} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Requirements
        </span>
        <ul className="flex flex-col gap-1.5">
          {cert.requirements.map((req) => (
            <li key={req} className="flex items-start gap-2 text-xs">
              <ListTodo
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  cert.earned ? "text-emerald-500" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="text-foreground/80">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Exam</dt>
          <dd className="font-medium tabular-nums">{cert.examMinutes} min</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Pass</dt>
          <dd className="font-medium tabular-nums">{cert.passingScore}%</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Registry</dt>
          <dd className="truncate font-mono text-[11px]" title={cert.registry}>
            {cert.registry}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant={cert.earned ? "outline" : "default"}
          onClick={() => onTakeExam(cert)}
        >
          <Award className="size-3.5" aria-hidden />
          {cert.earned ? "Retake exam" : "Take exam"}
        </Button>
        {cert.earned && (
          <span className={cn("text-xs font-medium", t.badgeText)}>Verified</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Progress overview stats bar
// ═══════════════════════════════════════════════════════════════════════

function ProgressStatsBar({
  lessonsCompleted,
  totalLessons,
  overallPercent,
  certificatesEarned,
  totalCerts,
}: {
  lessonsCompleted: number;
  totalLessons: number;
  overallPercent: number;
  certificatesEarned: number;
  totalCerts: number;
}) {
  const items: Array<{ icon: IconType; label: string; value: string; tone: string }> = [
    {
      icon: ListChecks,
      label: "Lessons completed",
      value: `${lessonsCompleted} / ${totalLessons}`,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Sparkles,
      label: "Overall progress",
      value: `${overallPercent}%`,
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Award,
      label: "Certificates earned",
      value: `${certificatesEarned} / ${totalCerts}`,
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      icon: Users,
      label: "Learning streak",
      value: "12 days",
      tone: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-card px-4 py-3"
          >
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60", item.tone)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm font-semibold tabular-nums">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function Academy() {
  const mounted = useMounted();
  const [selectedPathId, setSelectedPathId] = useState<string>("professional");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [examOpen, setExamOpen] = useState<Certification | null>(null);

  const selectedPath = useMemo(
    () =>
      LEARNING_PATHS.find((p) => p.id === selectedPathId) ?? LEARNING_PATHS[0],
    [selectedPathId],
  );

  // When switching paths, default the active lesson to the current lesson
  // (or the first unlocked lesson) so the detail panel is populated.
  const defaultLessonForPath = (path: LearningPath): Lesson | null => {
    const current = path.lessonList.find((l) => l.status === "current");
    if (current) return current;
    const firstAvailable = path.lessonList.find((l) => l.status !== "locked");
    return firstAvailable ?? null;
  };

  // Sync active lesson when path changes (only on user-driven selection).
  const handleSelectPath = (id: string) => {
    setSelectedPathId(id);
    const path = LEARNING_PATHS.find((p) => p.id === id);
    if (path) setActiveLesson(defaultLessonForPath(path));
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status === "locked") return;
    setActiveLesson(lesson);
  };

  // Aggregate stats for the progress overview bar.
  const stats = useMemo(() => {
    const totalLessons = LEARNING_PATHS.reduce((acc, p) => acc + p.lessons, 0);
    const lessonsCompleted = LEARNING_PATHS.reduce(
      (acc, p) => acc + p.lessonList.filter((l) => l.status === "completed").length,
      0,
    );
    const weighted =
      LEARNING_PATHS.reduce((acc, p) => acc + p.progress * p.lessons, 0) /
      Math.max(totalLessons, 1);
    const certificatesEarned = CERTIFICATIONS.filter((c) => c.earned).length;
    return {
      totalLessons,
      lessonsCompleted,
      overallPercent: Math.round(weighted),
      certificatesEarned,
      totalCerts: CERTIFICATIONS.length,
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ─── */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold tracking-tight">RoyCSS Academy</h2>
              <p className="text-xs text-muted-foreground">
                Learn the system. Earn the badge. Join the registry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Brain className="size-3" aria-hidden /> {LEARNING_PATHS.length} learning paths
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Award className="size-3" aria-hidden /> {CERTIFICATIONS.length} certifications
            </Badge>
          </div>
        </div>

        {/* ─── Progress overview stats bar ─── */}
        <ProgressStatsBar
          lessonsCompleted={stats.lessonsCompleted}
          totalLessons={stats.totalLessons}
          overallPercent={stats.overallPercent}
          certificatesEarned={stats.certificatesEarned}
          totalCerts={stats.totalCerts}
        />
      </header>

      {/* ─── Section 1: Learning paths ─── */}
      <section className="flex flex-col gap-3" aria-labelledby="paths-heading">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="paths-heading" className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4 text-muted-foreground" aria-hidden />
            Learning paths
          </h3>
          <span className="text-xs text-muted-foreground">
            {LEARNING_PATHS.length} paths · {stats.totalLessons} lessons total
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LEARNING_PATHS.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              selected={path.id === selectedPathId}
              onSelect={handleSelectPath}
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Section 2: Curriculum + lesson detail ─── */}
      <section className="flex flex-col gap-3" aria-labelledby="curriculum-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3
            id="curriculum-heading"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Library className="size-4 text-muted-foreground" aria-hidden />
            {selectedPath.title} · curriculum
            <LevelBadge level={selectedPath.level} accent={selectedPath.accent} />
          </h3>
          <span className="text-xs text-muted-foreground">
            Click a lesson to preview · locked lessons unlock as you progress
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <LessonListPanel
            path={selectedPath}
            activeLessonId={activeLesson?.id ?? null}
            onLessonClick={handleLessonClick}
          />
          <LessonDetailPanel
            path={selectedPath}
            lesson={activeLesson}
            onOpenFull={() => {
              if (activeLesson) setExamOpen(null);
            }}
          />
        </div>
      </section>

      <Separator />

      {/* ─── Section 3: Certifications ─── */}
      <section className="flex flex-col gap-3" aria-labelledby="certs-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="certs-heading" className="flex items-center gap-2 text-sm font-semibold">
            <Award className="size-4 text-muted-foreground" aria-hidden />
            Certifications
          </h3>
          <span className="text-xs text-muted-foreground">
            {stats.certificatesEarned} of {stats.totalCerts} earned ·
            <span className="ml-1 font-mono">RYC-registry</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CERTIFICATIONS.map((cert) => (
            <CertificationCard
              key={cert.id}
              cert={cert}
              onTakeExam={(c) => setExamOpen(c)}
            />
          ))}
        </div>

        {/* Registry strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Ribbon className="size-3.5" aria-hidden /> Public registry
          </span>
          <span className="font-mono">verify.roycss.dev</span>
          <span aria-hidden>·</span>
          <span>
            {mounted ? `${stats.certificatesEarned} verified credentials` : "Loading…"}
          </span>
          <span aria-hidden>·</span>
          <span>Issued by the RoyCSS Certification Authority</span>
        </div>
      </section>

      {/* ─── Mock exam dialog ─── */}
      <Dialog open={examOpen !== null} onOpenChange={(open) => !open && setExamOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              {examOpen && <CertBadgeIcon accent={examOpen.accent} size="sm" />}
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-base">{examOpen?.name ?? "Exam"}</DialogTitle>
                <DialogDescription>
                  Mock certification exam · this is a demo of the exam runner.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {examOpen && (
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium tabular-nums">{examOpen.examMinutes} min</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">Passing score</dt>
                  <dd className="font-medium tabular-nums">{examOpen.passingScore}%</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">Questions</dt>
                  <dd className="font-medium tabular-nums">
                    {Math.round(examOpen.examMinutes / 1.5)}
                  </dd>
                </div>
              </dl>
              <p className="text-sm text-muted-foreground">
                In the live exam you'll see {Math.round(examOpen.examMinutes / 1.5)}{" "}
                multiple-choice and hands-on questions covering the {examOpen.level}-tier
                curriculum. The exam is proctored and timed.
              </p>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <strong>Mock mode:</strong> no exam will actually start. This dialog
                demonstrates the certification flow only.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button disabled={examOpen?.level === "Expert" && !CERTIFICATIONS.find((c) => c.id === "cert-exp")?.earned}>
                <Play className="size-3.5" aria-hidden /> Begin mock exam
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Footer hint ─── */}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <X className="size-3" aria-hidden />
        Demo data only · no real progress is recorded · mock LMS experience
      </p>
    </div>
  );
}
