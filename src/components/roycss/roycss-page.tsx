"use client";

import { useEffect, useState, useRef, useMemo, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Sun,
  Moon,
  Sparkles,
  Github,
  BookOpen,
  Zap,
  Package,
  X,
  Menu,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Check,
  Accessibility,
  Gauge,
  ArrowLeftRight,
  LayoutDashboard,
  History,
  Rocket,
  Layers,
  Play,
  Clock,
  Keyboard,
  Clipboard,
  Calculator,
  BarChart3,
  FolderPlus,
  Braces,
  Ruler,
  Contrast,
  Palette,
  Wrench,
  Move3d,
  Type,
  Film,
  LayoutGrid,
  Rows3,
  Scissors,
  Paintbrush,
  Variable,
  Smartphone,
  Loader2,
  Box,
  MousePointer,
  MousePointerClick,
  Square,
  ArrowRight,
  Star,
  Code2,
  Wand2,
  Frame,
  SlidersHorizontal,
  GitCompare,
  Navigation,
  Sparkle,
  FormInput,
  ScrollText,
  MousePointer2,
  GlassWater,
  ToggleRight,
  Heart,
  Mail,
  Pause,
  ChevronLeft,
  Repeat,
  Store,
  Cloud,
  Building2,
  GraduationCap,
  Users,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  effects,
  categoryMeta,
  categoryOrder,
  type EffectCategory,
  type CSSEffect,
} from "@/lib/roycss-effects";
import { EffectCard, LivePreview } from "@/components/roycss/effect-card";
import { EffectDetailDialog } from "@/components/roycss/effect-detail-dialog";
import { FavoritesSheet } from "@/components/roycss/favorites-sheet";
import { ScrollToTop } from "@/components/roycss/scroll-to-top";
import { InteractiveTutorial, restartRoyCssTutorial } from "@/components/roycss/interactive-tutorial";
import { SectionScrollbar } from "@/components/roycss/section-scrollbar";
import { DynamicEffectCSS } from "@/components/roycss/dynamic-effect-css";
import { VirtualScrollGrid } from "@/components/roycss/virtual-scroll-grid";
import { AnimationPauser } from "@/components/roycss/animation-pauser";
import { RoyCSSLogo, RoyCSSHeroLogo } from "@/components/roycss/roycss-logo";
import { GetStarted } from "@/components/roycss/get-started";
import { WhatIsRoyCSS } from "@/components/roycss/what-is-roycss";
import { FeaturedEffects } from "@/components/roycss/featured-effects";
import { WebGLShowcase } from "@/components/roycss/effects/webgl-showcase";
import { ContactForm } from "@/components/roycss/contact-form";
import { FeaturedCompanies, SponsorModal } from "@/components/roycss/featured-companies";
import { ComparisonPanel } from "@/components/roycss/comparison-panel";
import { PlaygroundPanel } from "@/components/roycss/playground-panel";
import { SearchOverlay } from "@/components/roycss/search-overlay";
import { DocsViewer } from "@/components/roycss/docs-viewer";
import { StickyMiniNav } from "@/components/roycss/sticky-mini-nav";
import { FloatingSponsorButton } from "@/components/roycss/floating-sponsor-button";
import { RecentEffectsSheet, pushRecentEffect } from "@/components/roycss/recent-effects-sheet";
import { KeyboardShortcutsOverlay } from "@/components/roycss/keyboard-shortcuts-overlay";
import { EffectOfTheDay } from "@/components/roycss/effect-of-the-day";
import { CategoryExplorer } from "@/components/roycss/category-explorer";
import { CopyHistorySheet, pushToCopyHistory } from "@/components/roycss/copy-history-sheet";
import { RandomEffectPicker } from "@/components/roycss/random-effect-picker";
import { TagsCloud } from "@/components/roycss/tags-cloud";
import { BundleCalculator } from "@/components/roycss/bundle-calculator";
import { UserAnalyticsDashboard } from "@/components/roycss/analytics-dashboard";
import { PWAInstallPrompt } from "@/components/roycss/pwa-install-prompt";
import { CSSBeautifier } from "@/components/roycss/css-beautifier";
import { CustomCollectionsSheet } from "@/components/roycss/custom-collections";
import { EffectRecommendationEngine } from "@/components/roycss/recommendation-engine";
import { PropertySearch } from "@/components/roycss/property-search";
import { ExportToCodePen } from "@/components/roycss/export-to-codepen";
import { A11yScore } from "@/components/roycss/a11y-score";
import { CSSUnitConverter } from "@/components/roycss/css-unit-converter";
import { ContrastChecker } from "@/components/roycss/contrast-checker";
import { CSSGradientGenerator } from "@/components/roycss/gradient-generator";
import { BorderRadiusVisualizer } from "@/components/roycss/border-radius-visualizer";
import { BoxShadowGenerator } from "@/components/roycss/box-shadow-generator";
import { ColorPaletteGenerator } from "@/components/roycss/palette-generator";
import { TransformStudio } from "@/components/roycss/transform-studio";
import { AnimationTimeline } from "@/components/roycss/animation-timeline";
import { FontPreviewTool } from "@/components/roycss/font-preview-tool";
import { CSSGridGenerator } from "@/components/roycss/grid-generator";
import { FlexboxVisualizer } from "@/components/roycss/flexbox-visualizer";
import { ClipPathGenerator } from "@/components/roycss/clip-path-generator";
import { FilterStudio } from "@/components/roycss/filter-studio";
import { ColorShadeGenerator } from "@/components/roycss/color-shade-generator";
import { SpacingScaleGenerator } from "@/components/roycss/spacing-scale-generator";
import { CSSVariableManager } from "@/components/roycss/variable-manager";
import { ResponsivePreview } from "@/components/roycss/responsive-preview";
import { useFavorites } from "@/hooks/use-favorites";
import { motion, useScroll, useSpring, AnimatePresence, MotionConfig } from "framer-motion";
import {
  ScrollReveal,
  StaggerGroup,
  TextReveal,
  MagneticButton,
  TiltCard,
  AnimatedCounter,
  Marquee,
  CursorGlow,
  Parallax,
  AnimatedGradientText,
  Floating,
  ShineBorder,
  StatCounter,
  SectionHeading,
  staggerContainer,
  staggerItem,
} from "@/components/roycss/motion-primitives";

/* ─── Below-the-fold sections — lazy-loaded via next/dynamic ───
   Each section below the fold is split into its own JS chunk so it
   does not bloat the initial 892KB bundle. `ssr: true` keeps the
   server-rendered HTML for SEO; the component JS loads on demand.
   The `loading` fallback reserves layout space to avoid CLS. */
const EffectShowcaseGrid = dynamic(
  () => import("@/components/roycss/effect-showcase-grid").then(m => ({ default: m.EffectShowcaseGrid })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const CommunitySpotlight = dynamic(
  () => import("@/components/roycss/community-spotlight").then(m => ({ default: m.CommunitySpotlight })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const PlatformSectionUnified = dynamic(
  () => import("@/components/roycss/platform-section-unified").then(m => ({ default: m.PlatformSectionUnified })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const RoyMotionShowcase = dynamic(
  () => import("@/components/roycss/roymotion-showcase").then(m => ({ default: m.RoyMotionShowcase })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const ContentTaxonomy = dynamic(
  () => import("@/components/roycss/content-taxonomy").then(m => ({ default: m.ContentTaxonomy })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const RecipesSection = dynamic(
  () => import("@/components/roycss/recipes-section").then(m => ({ default: m.RecipesSection })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const PatternsSection = dynamic(
  () => import("@/components/roycss/patterns-section").then(m => ({ default: m.PatternsSection })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const CollectionsSection = dynamic(
  () => import("@/components/roycss/collections-section").then(m => ({ default: m.CollectionsSection })),
  { loading: () => <div className="h-96" />, ssr: true },
);
const FAQSection = dynamic(
  () => import("@/components/roycss/faq-section").then(m => ({ default: m.FAQSection })),
  { loading: () => <div className="h-96" />, ssr: true },
);

/* ─── PlatformTools Sheet — lazy-loaded ──────────────────────
   The Sheet is only opened when a user clicks a platform tool
   button. It statically imports ~60 heavy tool components
   (specificity-calculator, easing-visualizer, etc.), which was
   the root cause of the 892KB main chunk. Loading it via
   dynamic() moves all of those tools into a separate chunk that
   only fetches when a tool is actually opened. */
const PlatformTools = dynamic(
  () => import("@/components/roycss/platform-tools").then(m => ({ default: m.PlatformTools })),
  { ssr: false },
);

/* ─── scrollToSection utility ────────────────────────────────
   Navigating to sections BELOW the effects grid is tricky because
   VirtualScrollGrid lazy-loads cards, shifting the document height
   during smooth scroll. This function:
   1. If the target is below the effects grid, dispatches a "load all
      cards" event to stabilize the height.
   2. Waits two animation frames for React to flush + DOM to render.
   3. Then smooth-scrolls to the target.
   For targets above the grid, it scrolls directly (no height shift). */
function scrollToSection(id: string) {
  const target = document.querySelector(id) as HTMLElement | null;
  if (!target) return;

  // If scrolling to a section below the effects grid, dispatch load-all-cards
  // to stabilize the document height before scrolling.
  const effectsEl = document.querySelector("#effects") as HTMLElement | null;
  if (effectsEl && target.offsetTop > effectsEl.offsetTop) {
    window.dispatchEvent(new CustomEvent("roycss-load-all-cards"));
  }

  // Use requestAnimationFrame to ensure DOM is updated after any card loading
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 72; // 72px for navbar height
      window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    });
  });
}

/* ─── Icon map for categories ───────────────────────────────── */
const catIcons: Record<EffectCategory, React.ComponentType<{ className?: string }>> = {
  animations: Play,
  hover: MousePointer,
  text: Type,
  backgrounds: Layers,
  loaders: Loader2,
  "3d-transforms": Box,
  buttons: MousePointerClick,
  cards: Square,
  borders: Frame,
  filters: SlidersHorizontal,
  forms: FormInput,
  navigation: Navigation,
  scroll: ScrollText,
  cursor: MousePointer2,
  "page-transitions": ArrowLeftRight,
  "glass-ui": GlassWater,
  particles: Sparkles,
  microinteractions: ToggleRight,
  visual: Wand2,
  misc: Sparkle,
};

/* ─── Mega-menu nav dropdowns (Explore + Platform) ─────────────
   Desktop-only (mobile uses the existing hamburger menu).
   Hover-opens after a 100ms delay to prevent flicker when the
   user moves between the trigger and the portal-rendered content.
   Radix DropdownMenu handles all keyboard interactions natively:
   Tab → focus trigger, Enter/Space → toggle, Arrow keys → move
   between items, Escape → close. */

type MegaMenuItem = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

type MegaMenuGroup = {
  name: string;
  items: MegaMenuItem[];
};

const EXPLORE_ITEMS: MegaMenuItem[] = [
  { label: "Effects", description: "Browse 1,569 CSS effects", icon: Zap, href: "#effects" },
  { label: "Recipes", description: "Pre-built effect combinations", icon: BookOpen, href: "#recipes" },
  { label: "Patterns", description: "Layout & component patterns", icon: LayoutGrid, href: "#patterns" },
  { label: "Collections", description: "Curated effect bundles", icon: Layers, href: "#collections" },
];

const PLATFORM_GROUPS: MegaMenuGroup[] = [
  {
    name: "Build",
    items: [
      { label: "Components", description: "Production-ready UI blocks", icon: Package, href: "#platform" },
      { label: "Templates", description: "Starter layouts & scaffolds", icon: Frame, href: "#platform" },
      { label: "Marketplace", description: "Community templates & packs", icon: Store, href: "#platform" },
    ],
  },
  {
    name: "Design",
    items: [
      { label: "Roy Studio", description: "Visual design editor", icon: Palette, href: "#platform" },
      { label: "Themes", description: "Themeable color systems", icon: Contrast, href: "#platform" },
      { label: "Icons", description: "Open icon library", icon: Sparkles, href: "#platform" },
    ],
  },
  {
    name: "AI",
    items: [
      { label: "RoyAI", description: "Generate effects from prompts", icon: Wand2, href: "#platform" },
      { label: "Roy MCP", description: "MCP server for AI agents", icon: Braces, href: "#platform" },
      { label: "AI Tools", description: "Assisted refactor & lint", icon: Sparkle, href: "#platform" },
    ],
  },
  {
    name: "Developer Tools",
    items: [
      { label: "DevTools", description: "Inspector, debugger & logs", icon: Wrench, href: "#platform" },
      { label: "Inspector", description: "Live DOM + CSS explorer", icon: MousePointer, href: "#platform" },
      { label: "Playground", description: "Live effect editor", icon: SlidersHorizontal, href: "#platform" },
    ],
  },
  {
    name: "Enterprise",
    items: [
      { label: "Cloud", description: "Hosted themes & assets", icon: Cloud, href: "#platform" },
      { label: "Governance", description: "Audit, SSO & RBAC", icon: CheckCircle2, href: "#platform" },
      { label: "Enterprise", description: "Org-wide policies & SLAs", icon: Building2, href: "#platform" },
    ],
  },
  {
    name: "Learning",
    items: [
      { label: "Academy", description: "Courses & tutorials", icon: GraduationCap, href: "#platform" },
      { label: "Community", description: "Forums & showcases", icon: Users, href: "#platform" },
      { label: "Certifications", description: "RoyCSS professional certs", icon: Award, href: "#platform" },
    ],
  },
];

function NavMegaMenu({
  label,
  active,
  align = "start",
  contentClassName,
  children,
}: {
  label: string;
  active?: boolean;
  align?: "start" | "center" | "end";
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), 100);
  }, []);

  const closeMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 100);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (
    <div className="inline-block" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
              active
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {label}
            <ChevronDown
              className={cn("size-3 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          sideOffset={8}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
          className={cn(
            "backdrop-blur-xl bg-popover/85 border border-border/60 shadow-2xl rounded-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=open]:slide-in-from-top-3",
            contentClassName,
          )}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* Mega-menu item — icon tile + label + description. Reused by both
   Explore (single column) and Platform (2-column) dropdowns. */
function MegaMenuRow({
  item,
  onSelect,
}: {
  item: MegaMenuItem;
  onSelect: (href: string) => void;
}) {
  const Icon = item.icon;
  return (
    <DropdownMenuItem
      onClick={() => onSelect(item.href)}
      className="cursor-pointer gap-3 rounded-lg p-2 focus:bg-primary/5"
    >
      <span className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary shrink-0">
        <Icon className="size-4" />
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium leading-tight text-foreground">
          {item.label}
        </span>
        <span className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
          {item.description}
        </span>
      </span>
    </DropdownMenuItem>
  );
}

/* ─── Scroll Progress Bar ───────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      style={{ scaleX }}
      className="roycss-scroll-progress"
    />
  );
}

/* ─── Theme Toggle ──────────────────────────────────────────── */
function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Load saved preference on mount (deferred to satisfy set-state-in-effect rule)
    const id = requestAnimationFrame(() => {
      const saved = localStorage.getItem("roycss-theme");
      if (saved === "light") {
        setDark(false);
        return;
      }
      // Respect prefers-color-scheme if no saved preference
      if (!saved && window.matchMedia("(prefers-color-scheme: light)").matches) {
        setDark(false);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("roycss-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("roycss-theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5 cursor-pointer"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/* ─── Category Pill ─────────────────────────────────────────── */
function CategoryPill({
  category,
  active,
  count,
  onClick,
}: {
  category: EffectCategory;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const meta = categoryMeta[category];
  const Icon = catIcons[category];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "glass text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      <Icon className="size-3.5" />
      {meta.label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-md ${
          active ? "bg-primary-foreground/20" : "bg-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ─── Install Command ───────────────────────────────────────── */
function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const [clicked, setClicked] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npm install roycss");
      setCopied(true);
      setClicked(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setClicked(false), 2500);
    } catch {
      /* noop */
    }
  };

  return (
    <MagneticButton
      strength={0.25}
      className="inline-block"
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCopy();
          }
        }}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 group cursor-pointer transition-all outline-none border-2 ${
          copied
            ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
            : clicked
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
            : "border-border/60 glass-strong hover:border-primary/50 hover:shadow-md focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        }`}
        onClick={handleCopy}
        aria-label="Copy npm install roycss command"
        aria-pressed={copied}
      >
        <span className={`text-sm font-mono transition-colors ${copied ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>$</span>
        <code className={`text-sm font-mono transition-colors ${copied ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>npm install roycss</code>
        <span className={`text-xs font-medium ml-2 transition-colors flex items-center gap-1 ${copied ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground"}`}>
          {copied ? (
            <>
              <Check className="size-3" />
              Copied!
            </>
          ) : (
            "Copy"
          )}
        </span>
      </div>
    </MagneticButton>
  );
}

/* ─── Marquee Item ──────────────────────────────────────────── */
function MarqueeItem({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl glass shrink-0">
      <Icon className="size-4 text-primary" />
      <span className="font-display font-semibold text-sm text-foreground whitespace-nowrap">
        {label}
      </span>
      <Star className="size-3 text-primary/40" />
    </div>
  );
}

/* ─── Doc Card ──────────────────────────────────────────────── */
function DocCard({
  icon: Icon,
  title,
  description,
  items,
  details,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items: string[];
  details?: { label: string; content: string }[];
}) {
  const [expanded, setExpanded] = useState(false);

  // The card body is click-to-expand for mouse users, but the inner
  // <button> below is the only keyboard-accessible control. Removing
  // role="button" + tabIndex from this outer <div> avoids the axe-core
  // `nested-interactive` violation (WCAG 4.1.2). See ADR-05.
  return (
    <div
      className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => details && setExpanded((e) => !e)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3 text-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      {/* Expandable details */}
      {details && (
        <>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  {details.map((d, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                        {d.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{d.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((e) => !e);
            }}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5 transition-all cursor-pointer"
          >
            {expanded ? "Show less" : "Learn more"}
            <ChevronDown className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Animate.css → RoyCSS Migration Table ──────────────────── */
const animateMigrationRows: Array<{ from: string; to: string; category: string }> = [
  // Bouncing entrances
  { from: "animate__bounceIn", to: "roycss-anim-bounce-in", category: "Entrance" },
  { from: "animate__bounceInDown", to: "roycss-anim-bounce-in-down", category: "Entrance" },
  { from: "animate__bounceInLeft", to: "roycss-anim-bounce-in-left", category: "Entrance" },
  { from: "animate__bounceInRight", to: "roycss-anim-bounce-in-right", category: "Entrance" },
  { from: "animate__bounceInUp", to: "roycss-anim-bounce-in-up", category: "Entrance" },

  // Fading entrances
  { from: "animate__fadeIn", to: "roycss-anim-fade-in", category: "Entrance" },
  { from: "animate__fadeInDown", to: "roycss-anim-fade-in-down", category: "Entrance" },
  { from: "animate__fadeInDownBig", to: "roycss-anim-fade-in-down-big", category: "Entrance" },
  { from: "animate__fadeInLeft", to: "roycss-anim-fade-in-left", category: "Entrance" },
  { from: "animate__fadeInLeftBig", to: "roycss-anim-fade-in-left-big", category: "Entrance" },
  { from: "animate__fadeInRight", to: "roycss-anim-fade-in-right", category: "Entrance" },
  { from: "animate__fadeInRightBig", to: "roycss-anim-fade-in-right-big", category: "Entrance" },
  { from: "animate__fadeInUp", to: "roycss-anim-fade-in-up", category: "Entrance" },
  { from: "animate__fadeInUpBig", to: "roycss-anim-fade-in-up-big", category: "Entrance" },
  { from: "animate__fadeInTopLeft", to: "roycss-anim-fade-in-top-left", category: "Entrance" },
  { from: "animate__fadeInTopRight", to: "roycss-anim-fade-in-top-right", category: "Entrance" },
  { from: "animate__fadeInBottomLeft", to: "roycss-anim-fade-in-bottom-left", category: "Entrance" },
  { from: "animate__fadeInBottomRight", to: "roycss-anim-fade-in-bottom-right", category: "Entrance" },

  // Sliding entrances
  { from: "animate__slideInDown", to: "roycss-anim-slide-in-down", category: "Entrance" },
  { from: "animate__slideInLeft", to: "roycss-anim-slide-in-left", category: "Entrance" },
  { from: "animate__slideInRight", to: "roycss-anim-slide-in-right", category: "Entrance" },
  { from: "animate__slideInUp", to: "roycss-anim-slide-in-up", category: "Entrance" },

  // Zooming entrances
  { from: "animate__zoomIn", to: "roycss-anim-zoom-in", category: "Entrance" },
  { from: "animate__zoomInDown", to: "roycss-anim-zoom-in-down", category: "Entrance" },
  { from: "animate__zoomInLeft", to: "roycss-anim-zoom-in-left", category: "Entrance" },
  { from: "animate__zoomInRight", to: "roycss-anim-zoom-in-right", category: "Entrance" },
  { from: "animate__zoomInUp", to: "roycss-anim-zoom-in-up", category: "Entrance" },

  // Flipping entrances
  { from: "animate__flipInX", to: "roycss-anim-flip-in-x", category: "Entrance" },
  { from: "animate__flipInY", to: "roycss-anim-flip-in-y", category: "Entrance" },

  // Lightspeed entrances
  { from: "animate__lightSpeedInLeft", to: "roycss-anim-light-speed-in-left", category: "Entrance" },
  { from: "animate__lightSpeedInRight", to: "roycss-anim-light-speed-in-right", category: "Entrance" },

  // Rotating entrances
  { from: "animate__rotateIn", to: "roycss-anim-rotate-in", category: "Entrance" },
  { from: "animate__rotateInDownLeft", to: "roycss-anim-rotate-in-down-left", category: "Entrance" },
  { from: "animate__rotateInDownRight", to: "roycss-anim-rotate-in-down-right", category: "Entrance" },
  { from: "animate__rotateInUpLeft", to: "roycss-anim-rotate-in-up-left", category: "Entrance" },
  { from: "animate__rotateInUpRight", to: "roycss-anim-rotate-in-up-right", category: "Entrance" },

  // Rolling entrance
  { from: "animate__rollIn", to: "roycss-anim-roll-in", category: "Entrance" },

  // Back entrances
  { from: "animate__backInDown", to: "roycss-anim-back-in-down", category: "Entrance" },
  { from: "animate__backInLeft", to: "roycss-anim-back-in-left", category: "Entrance" },
  { from: "animate__backInRight", to: "roycss-anim-back-in-right", category: "Entrance" },
  { from: "animate__backInUp", to: "roycss-anim-back-in-up", category: "Entrance" },

  // Fading exits
  { from: "animate__fadeOut", to: "roycss-anim-fade-out", category: "Exit" },
  { from: "animate__fadeOutDown", to: "roycss-anim-fade-out-down", category: "Exit" },
  { from: "animate__fadeOutDownBig", to: "roycss-anim-fade-out-down-big", category: "Exit" },
  { from: "animate__fadeOutLeft", to: "roycss-anim-fade-out-left", category: "Exit" },
  { from: "animate__fadeOutLeftBig", to: "roycss-anim-fade-out-left-big", category: "Exit" },
  { from: "animate__fadeOutRight", to: "roycss-anim-fade-out-right", category: "Exit" },
  { from: "animate__fadeOutRightBig", to: "roycss-anim-fade-out-right-big", category: "Exit" },
  { from: "animate__fadeOutUp", to: "roycss-anim-fade-out-up", category: "Exit" },
  { from: "animate__fadeOutUpBig", to: "roycss-anim-fade-out-up-big", category: "Exit" },
  { from: "animate__fadeOutTopLeft", to: "roycss-anim-fade-out-top-left", category: "Exit" },
  { from: "animate__fadeOutTopRight", to: "roycss-anim-fade-out-top-right", category: "Exit" },
  { from: "animate__fadeOutBottomRight", to: "roycss-anim-fade-out-bottom-right", category: "Exit" },
  { from: "animate__fadeOutBottomLeft", to: "roycss-anim-fade-out-bottom-left", category: "Exit" },

  // Sliding exits
  { from: "animate__slideOutDown", to: "roycss-anim-slide-out-down", category: "Exit" },
  { from: "animate__slideOutLeft", to: "roycss-anim-slide-out-left", category: "Exit" },
  { from: "animate__slideOutRight", to: "roycss-anim-slide-out-right", category: "Exit" },
  { from: "animate__slideOutUp", to: "roycss-anim-slide-out-up", category: "Exit" },

  // Zooming exits
  { from: "animate__zoomOut", to: "roycss-anim-zoom-out", category: "Exit" },
  { from: "animate__zoomOutDown", to: "roycss-anim-zoom-out-down", category: "Exit" },
  { from: "animate__zoomOutLeft", to: "roycss-anim-zoom-out-left", category: "Exit" },
  { from: "animate__zoomOutRight", to: "roycss-anim-zoom-out-right", category: "Exit" },
  { from: "animate__zoomOutUp", to: "roycss-anim-zoom-out-up", category: "Exit" },

  // Bouncing exits
  { from: "animate__bounceOut", to: "roycss-anim-bounce-out", category: "Exit" },
  { from: "animate__bounceOutDown", to: "roycss-anim-bounce-out-down", category: "Exit" },
  { from: "animate__bounceOutLeft", to: "roycss-anim-bounce-out-left", category: "Exit" },
  { from: "animate__bounceOutRight", to: "roycss-anim-bounce-out-right", category: "Exit" },
  { from: "animate__bounceOutUp", to: "roycss-anim-bounce-out-up", category: "Exit" },

  // Flipping exits
  { from: "animate__flipOutX", to: "roycss-anim-flip-out-x", category: "Exit" },
  { from: "animate__flipOutY", to: "roycss-anim-flip-out-y", category: "Exit" },

  // Lightspeed exits
  { from: "animate__lightSpeedOutLeft", to: "roycss-anim-light-speed-out-left", category: "Exit" },
  { from: "animate__lightSpeedOutRight", to: "roycss-anim-light-speed-out-right", category: "Exit" },

  // Rotating exits
  { from: "animate__rotateOut", to: "roycss-anim-rotate-out", category: "Exit" },
  { from: "animate__rotateOutDownLeft", to: "roycss-anim-rotate-out-down-left", category: "Exit" },
  { from: "animate__rotateOutDownRight", to: "roycss-anim-rotate-out-down-right", category: "Exit" },
  { from: "animate__rotateOutUpLeft", to: "roycss-anim-rotate-out-up-left", category: "Exit" },
  { from: "animate__rotateOutUpRight", to: "roycss-anim-rotate-out-up-right", category: "Exit" },

  // Rolling exit
  { from: "animate__rollOut", to: "roycss-anim-roll-out", category: "Exit" },

  // Back exits
  { from: "animate__backOutDown", to: "roycss-anim-back-out-down", category: "Exit" },
  { from: "animate__backOutLeft", to: "roycss-anim-back-out-left", category: "Exit" },
  { from: "animate__backOutRight", to: "roycss-anim-back-out-right", category: "Exit" },
  { from: "animate__backOutUp", to: "roycss-anim-back-out-up", category: "Exit" },

  // Attention seekers
  { from: "animate__bounce", to: "roycss-anim-bounce", category: "Attention" },
  { from: "animate__flash", to: "roycss-anim-flash", category: "Attention" },
  { from: "animate__pulse", to: "roycss-anim-pulse", category: "Attention" },
  { from: "animate__rubberBand", to: "roycss-anim-rubber-band", category: "Attention" },
  { from: "animate__shakeX", to: "roycss-anim-shake-x", category: "Attention" },
  { from: "animate__shakeY", to: "roycss-anim-shake-y", category: "Attention" },
  { from: "animate__headShake", to: "roycss-anim-head-shake", category: "Attention" },
  { from: "animate__swing", to: "roycss-anim-swing", category: "Attention" },
  { from: "animate__tada", to: "roycss-anim-tada", category: "Attention" },
  { from: "animate__wobble", to: "roycss-anim-wobble", category: "Attention" },
  { from: "animate__jello", to: "roycss-anim-jello", category: "Attention" },
  { from: "animate__heartBeat", to: "roycss-anim-heartbeat", category: "Attention" },

  // Special
  { from: "animate__infinite", to: "roycss-loop-infinite", category: "Utility" },
  { from: "animate__delay-2s", to: "roycss-delay-2s", category: "Utility" },
  { from: "animate__delay-3s", to: "roycss-delay-3s", category: "Utility" },
  { from: "animate__delay-4s", to: "roycss-delay-4s", category: "Utility" },
  { from: "animate__delay-5s", to: "roycss-delay-5s", category: "Utility" },
  { from: "animate__slow", to: "roycss-duration-slow", category: "Utility" },
  { from: "animate__slower", to: "roycss-duration-slower", category: "Utility" },
  { from: "animate__fast", to: "roycss-duration-fast", category: "Utility" },
  { from: "animate__faster", to: "roycss-duration-faster", category: "Utility" },
];

function MigrationTable() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", "Entrance", "Exit", "Attention", "Utility"];
  const filtered = activeCategory === "All" ? animateMigrationRows : animateMigrationRows.filter((r) => r.category === activeCategory);

  return (
    <ScrollReveal className="mt-8 max-w-3xl mx-auto">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <ArrowLeftRight className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Animate.css → RoyCSS Migration
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drop-in replacements for {animateMigrationRows.length} Animate.css classes. Same behavior,
              smaller bundle, no JS runtime.
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-pressed={activeCategory === cat}
            >
              {cat} {cat === "All" ? `(${animateMigrationRows.length})` : `(${animateMigrationRows.filter((r) => r.category === cat).length})`}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto scrollbar-thin -mx-2 max-h-[360px] overflow-y-auto">
          <table className="roycss-migration-table">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th scope="col">Animate.css</th>
                <th scope="col" className="roycss-arrow" aria-label="maps to">→</th>
                <th scope="col">RoyCSS</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.from}>
                  <td><code>{row.from}</code></td>
                  <td className="roycss-arrow" aria-hidden="true">→</td>
                  <td><code className="text-primary">{row.to}</code></td>
                  <td>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      row.category === "Entrance" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      row.category === "Exit" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                      row.category === "Attention" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{row.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Replace <code className="text-foreground">animate__</code> prefix with <code className="text-primary">roycss-anim-</code> — same animations, zero JavaScript, OKLCH colors, reduced-motion support built in.
        </p>
      </div>
    </ScrollReveal>
  );
}

/* ─── 3D Tilt Stage (hero logo wrapper) ─────────────────────── */
function TiltStage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Normalize pointer position to [-0.5, 0.5] around center
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // Rotate up to ±15deg; invert Y so the logo "leans into" the cursor
    const maxTilt = 15;
    const tiltY = px * maxTilt * 2;
    const tiltX = -py * maxTilt * 2;
    el.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
  };

  const handleMouseLeave = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div
      ref={stageRef}
      className="roycss-tilt-stage inline-block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="roycss-tilt-target">{children}</div>
    </div>
  );
}

/* ─── Featured Carousel — rotates through ALL effects ──────── */
const FEATURED_BATCH_SIZE = 4;
const FEATURED_INTERVAL_MS = 6000; // 6s per batch → full cycle ≈ 19 min for 1569+ effects

/* useSyncExternalStore helpers for prefers-reduced-motion.
   This is the React-idiomatic way to read an external system (the OS
   accessibility setting) without setState-in-useEffect. */
function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionSSR() {
  return false; // Server: assume no reduced motion
}

function FeaturedCarousel({ onSelectEffect }: { onSelectEffect: (effect: CSSEffect) => void }) {
  const [batchIndex, setBatchIndex] = useState(0);
  // userPaused: null = user hasn't toggled → follow prefers-reduced-motion;
  //             true/false = user explicitly paused or played.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionSSR,
  );

  // Derive isPaused: user's explicit choice wins, otherwise follow OS setting.
  const isPaused = userPaused ?? prefersReducedMotion;

  const totalBatches = Math.ceil(effects.length / FEATURED_BATCH_SIZE);

  const currentBatch = useMemo(() => {
    const start = batchIndex * FEATURED_BATCH_SIZE;
    return effects.slice(start, start + FEATURED_BATCH_SIZE);
  }, [batchIndex]);

  // Inject CSS for previous (exit anim) + current + next (preload) batches.
  // This keeps the <style> tag small (~12 effects ≈ 12 KB) while ensuring
  // seamless transitions and no FOUC when the batch advances.
  const cssToInject = useMemo(() => {
    const ids = new Set<string>();
    for (let offset = -FEATURED_BATCH_SIZE; offset < FEATURED_BATCH_SIZE * 2; offset++) {
      const raw = batchIndex * FEATURED_BATCH_SIZE + offset;
      const idx = ((raw % effects.length) + effects.length) % effects.length;
      ids.add(effects[idx].id);
    }
    return effects.filter((e) => ids.has(e.id)).map((e) => e.cssCode).join("\n\n");
  }, [batchIndex]);

  const goToPrev = useCallback(() => {
    setBatchIndex((prev) => (prev - 1 + totalBatches) % totalBatches);
  }, [totalBatches]);
  const goToNext = useCallback(() => {
    setBatchIndex((prev) => (prev + 1) % totalBatches);
  }, [totalBatches]);

  const startIdx = batchIndex * FEATURED_BATCH_SIZE + 1;
  const endIdx = Math.min((batchIndex + 1) * FEATURED_BATCH_SIZE, effects.length);
  const progressPaused = isPaused || isHovered;

  return (
    <section
      className="py-16 sm:py-20 relative overflow-hidden z-10"
      aria-label="Featured effects carousel"
    >
      <div className="absolute inset-0 -z-10 bg-grid opacity-20 roycss-fade-mask-b" />

      {/* Scoped CSS for the effects currently on stage (and neighbours) */}
      <style dangerouslySetInnerHTML={{ __html: cssToInject }} />
      {/* Keyframes for the progress bar (doubles as the auto-advance timer).
          Uses `transform: scaleX()` instead of `width: 0%→100%` so the
          animation runs on the compositor (GPU) instead of triggering
          layout on every frame. `transform-origin: left` keeps the bar
          anchored to the left edge as it grows. */}
      <style>{`@keyframes roy-featured-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>

      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Rotating showcase"
          title="Featured Effects"
          subtitle={`Every effect gets its moment in the spotlight — cycling through all ${effects.length} in an infinite loop.`}
        />

        {/* Controls + progress */}
        <div
          className="mt-8 flex items-center justify-between gap-3 flex-wrap"
          role="toolbar"
          aria-label="Featured carousel controls"
        >
          {/* Prev / counter / Next — size-11 (44px) to meet WCAG 2.5.5 touch target on mobile */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              aria-label="Previous batch of effects"
              className="flex items-center justify-center size-11 rounded-lg bg-muted/80 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground tabular-nums whitespace-nowrap px-1">
              {startIdx}–{endIdx} <span className="opacity-50">/</span> {effects.length}
            </span>
            <button
              onClick={goToNext}
              aria-label="Next batch of effects"
              className="flex items-center justify-center size-11 rounded-lg bg-muted/80 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Progress bar — its CSS animation IS the auto-advance timer.
              onAnimationEnd fires exactly when the bar fills, which advances
              the batch. Pausing (button or hover) freezes both bar + timer. */}
          <div
            className="flex-1 min-w-[6rem] max-w-xs h-1.5 bg-muted rounded-full overflow-hidden"
            aria-hidden="true"
          >
            <div
              key={batchIndex}
              className="h-full bg-primary rounded-full"
              style={{
                animation: `roy-featured-progress ${FEATURED_INTERVAL_MS}ms linear forwards`,
                animationPlayState: progressPaused ? "paused" : "running",
                transformOrigin: "left center",
              }}
              onAnimationEnd={() => {
                if (!progressPaused) goToNext();
              }}
            />
          </div>

          {/* Play/Pause + loop badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUserPaused(!isPaused)}
              aria-label={isPaused ? "Play carousel" : "Pause carousel"}
              aria-pressed={isPaused}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80 border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {isPaused ? "Play" : "Pause"}
            </button>
            <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="size-3" />
              Infinite loop
            </span>
          </div>
        </div>

        {/* Featured cards grid — pauses on hover so users can linger */}
        <div
          className="mt-8 relative z-10"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-live="polite"
          aria-label={`Showing effects ${startIdx} through ${endIdx} of ${effects.length}`}
        >
          <AnimatePresence mode="wait">
            <div key={batchIndex} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentBatch.map((effect, i) => (
                <motion.div
                  key={effect.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FeaturedCard effect={effect} onSelect={onSelectEffect} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─── Single Featured Card (clickable, opens detail dialog) ── */
function FeaturedCard({
  effect,
  onSelect,
}: {
  effect: CSSEffect;
  onSelect: (effect: CSSEffect) => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(effect);
    }
  };

  return (
    <TiltCard
      maxTilt={6}
      className="rounded-3xl border border-border bg-card overflow-hidden h-full hover:border-primary/40 transition-colors cursor-pointer"
    >
      <div
        className="grid sm:grid-cols-2 h-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-3xl"
        onClick={() => onSelect(effect)}
        role="button"
        tabIndex={0}
        onKeyDown={handleKey}
        aria-label={`View details for ${effect.name}`}
      >
        {/* Preview */}
        <div className="relative h-56 sm:h-full min-h-[14rem] bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center p-6">
          <LivePreview effect={effect} />
        </div>
        {/* Info */}
        <div className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Star className="size-2.5 mr-1 fill-primary" />
              Featured
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {categoryMeta[effect.category].label}
            </Badge>
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            {effect.name}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
            {effect.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {effect.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-1.5 py-0 bg-muted/80 text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            View details
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </TiltCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function RoyCSSPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<EffectCategory | "all">("all");
  const [selectedEffect, setSelectedEffect] = useState<CSSEffect | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareEffects, setCompareEffects] = useState<CSSEffect[]>([]);
  const [platformTool, setPlatformTool] = useState<"ai-playground" | "css-doctor" | "utility-explorer" | "benchmark" | "genome" | "ai-migration" | "challenges" | "design-diff" | "css-minifier" | "specificity" | "easing" | "stacking" | "similarity" | "perf" | "browser-support" | "print" | "selector-tester" | "dark-mode" | "variable-graph" | "fluid-type" | "scroll-animation" | "grid-areas" | "container-query" | "nesting" | "contrast-matrix" | "unit-converter" | "box-model" | "flex-playground" | "transition-studio" | "pattern-generator" | "transform-studio" | "cursor-gallery" | "scrollbar-styler" | "gap-spacing" | "writing-mode" | "object-fit" | "positioning" | "property-inspector" | "animation-timeline" | "sprite-sheet" | "text-shadow" | "filter-studio" | "conic-gradient" | "motion-path" | "view-transition" | "mask-studio" | "gradient-mesh" | "table-styler" | "aspect-ratio" | "shape-generator" | "scroll-snap" | "keyframes-studio" | "theming-engine" | "has-selector-tester" | "css-layers" | "input-mode" | "cascade-specificity" | "color-space" | "style-query" | "scope" | "subgrid" | "fallback" | "logical-properties" | "initial-letter" | "text-wrap" | "property-registrar" | "relative-color" | "starting-style" | "light-dark" | null>(null);
  // ─── Lazy-mount gate for PlatformTools ───────────────────────
  // `next/dynamic` only defers the JS chunk if the component is NOT
  // rendered. <PlatformTools> was previously rendered unconditionally,
  // which forced the ~390KB tools chunk to load on initial page load
  // (defeating QA-FIX-2). We now mount it only after the user opens a
  // tool for the first time; subsequent open/close cycles reuse the
  // already-mounted component so Radix Sheet's enter/exit animations
  // still play correctly.
  const [hasOpenedTool, setHasOpenedTool] = useState(false);
  useEffect(() => {
    if (platformTool !== null) {
      // Defer setState to next frame to satisfy react-hooks/set-state-in-effect
      const raf = requestAnimationFrame(() => setHasOpenedTool(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [platformTool]);
  const [recentOpen, setRecentOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [copyHistoryOpen, setCopyHistoryOpen] = useState(false);
  const [bundleCalcOpen, setBundleCalcOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [beautifierOpen, setBeautifierOpen] = useState(false);
  const [unitConverterOpen, setUnitConverterOpen] = useState(false);
  const [contrastCheckerOpen, setContrastCheckerOpen] = useState(false);
  const [gradientGenOpen, setGradientGenOpen] = useState(false);
  const [borderRadiusOpen, setBorderRadiusOpen] = useState(false);
  const [shadowGenOpen, setShadowGenOpen] = useState(false);
  const [paletteGenOpen, setPaletteGenOpen] = useState(false);
  const [transformStudioOpen, setTransformStudioOpen] = useState(false);
  const [animTimelineOpen, setAnimTimelineOpen] = useState(false);
  const [fontPreviewOpen, setFontPreviewOpen] = useState(false);
  const [gridGenOpen, setGridGenOpen] = useState(false);
  const [flexboxOpen, setFlexboxOpen] = useState(false);
  const [clipPathOpen, setClipPathOpen] = useState(false);
  const [filterStudioOpen, setFilterStudioOpen] = useState(false);
  const [shadeGenOpen, setShadeGenOpen] = useState(false);
  const [spacingScaleOpen, setSpacingScaleOpen] = useState(false);
  const [varManagerOpen, setVarManagerOpen] = useState(false);
  const [responsivePreviewOpen, setResponsivePreviewOpen] = useState(false);
  const { isFavorite, toggleFavorite, clearAll, count } = useFavorites();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ensure the page always loads at the top (Hero section) on initial visit.
  // Prevents browser scroll restoration from jumping to #effects or a previous position.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    // Only scroll to top if there's no #effect= hash (deep link to a specific effect)
    if (!window.location.hash.startsWith("#effect=")) {
      window.scrollTo(0, 0);
    }
  }, []);

  // Check URL hash for shared effect links (#effect=pulse-glow)
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#effect=([a-z0-9-]+)$/);
    if (match) {
      const effectId = hash.match(/^#effect=([a-z0-9-]+)$/)?.[1];
      // Prefer the explicitly captured match[1] for safety on older engines.
      const id = match[1] ?? effectId;
      if (!id) return;
      const effect = effects.find(e => e.id === id);
      if (effect) {
        // Use queueMicrotask to avoid synchronous setState in effect
        queueMicrotask(() => {
          setSelectedEffect(effect);
          setDialogOpen(true);
          setTimeout(() => {
            document.querySelector("#effects")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        });
      }
    }
  }, []);

  // Deep-link to a developer tool via #tool=<id> hash (or ?tool=<id> query
  // param — kept for backward compatibility).
  // Surfaces the 64 dev tools (color-space, gradient-mesh, box-model, ...)
  // hosted by <PlatformTools/>. Previously these were unreachable from the
  // UI: PlatformSectionUnified's onLaunchTool only forwards toolIds that
  // match this list, but its 62 PRO product cards use a disjoint set of
  // ids (data-grid, kanban, ...). The hash deep-link restores reachability
  // for QA and shareable URLs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ALLOWED = new Set([
      "ai-playground","css-doctor","utility-explorer","benchmark","genome","ai-migration","challenges","design-diff","css-minifier","specificity","easing","stacking","similarity","perf","browser-support","print","selector-tester","dark-mode","variable-graph","fluid-type","scroll-animation","grid-areas","container-query","nesting","contrast-matrix","unit-converter","box-model","flex-playground","transition-studio","pattern-generator","transform-studio","cursor-gallery","scrollbar-styler","gap-spacing","writing-mode","object-fit","positioning","property-inspector","animation-timeline","sprite-sheet","text-shadow","filter-studio","conic-gradient","motion-path","view-transition","mask-studio","gradient-mesh","table-styler","aspect-ratio","shape-generator","scroll-snap","keyframes-studio","theming-engine","has-selector-tester","css-layers","input-mode","cascade-specificity","color-space","style-query","scope","subgrid","fallback","logical-properties","initial-letter","text-wrap","property-registrar","relative-color","starting-style","light-dark",
    ]);
    const openFromUrl = () => {
      const hash = window.location.hash;
      const hashMatch = hash.match(/^#tool=([a-z0-9-]+)$/);
      const qParam = new URLSearchParams(window.location.search).get("tool");
      const toolId = hashMatch?.[1] ?? qParam;
      if (toolId && ALLOWED.has(toolId)) {
        queueMicrotask(() => setPlatformTool(toolId as typeof platformTool));
      }
    };
    openFromUrl();
    window.addEventListener("hashchange", openFromUrl);
    return () => window.removeEventListener("hashchange", openFromUrl);
  }, []);

  // ⌘K / Ctrl+K to open search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOverlayOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOverlayOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Active section highlighting via IntersectionObserver
  const [activeSection, setActiveSection] = useState("");
  useEffect(() => {
    const sectionIds = ["what-is-roycss", "get-started", "effects", "recipes", "patterns", "collections", "platform", "docs", "faq"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Memoize the favorites-filtered list. `favorites` (from useFavorites)
  // is a Set whose identity is stable across renders thanks to the
  // useSyncExternalStore cache, so this only re-runs when the user
  // actually toggles a favorite — not on every keystroke in the search
  // box or every dialog open/close.
  const favoriteEffects = useMemo(
    () => effects.filter((e) => isFavorite(e.id)),
    [isFavorite],
  );

  // Memoize the search/category-filtered list. Without this, the filter
  // runs across all 1569 effects on every parent re-render (any of the
  // ~40 useState hooks flipping causes it) — including ones unrelated
  // to search/category. `search` and `activeCategory` are the only
  // relevant deps; the `effects` import is module-constant.
  const filteredEffects = useMemo(() => {
    if (search === "" && activeCategory === "all") return effects;
    const q = search.toLowerCase();
    return effects.filter((e) => {
      const matchesSearch =
        search === "" ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory = activeCategory === "all" || e.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  // Pre-compute per-category counts ONCE. Without this, every category
  // pill calls `getCategoryCount(cat)` on each render, each filtering
  // the entire 1569-effect array — ~22 × 1569 = ~34k scans per render.
  const categoryCounts = useMemo(() => {
    const counts = new Map<EffectCategory, number>();
    for (const e of effects) {
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
    return counts;
  }, []);
  const getCategoryCount = (cat: EffectCategory) => categoryCounts.get(cat) ?? 0;

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#effects"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to effects
      </a>

      {/* Cursor glow follower (desktop only) */}
      <CursorGlow />

      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Dynamic effect CSS — loads only visible effects' CSS for performance */}
      <DynamicEffectCSS />

      {/* Pause offscreen animations for performance */}
      <AnimationPauser />

      {/* ─── Hero ──────────────────────────────────────────── */}
      <header className="relative overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden" style={{ position: "absolute" }}>
          {/* 3D rotating sphere — decorative background, low opacity */}
          <div className="roycss-sphere-3d" aria-hidden="true" />

          {/* Parallax blobs — different scroll speeds via scroll-driven animation */}
          <Parallax offset={60} className="absolute top-[-10%] left-[-5%] size-[40rem] rounded-full bg-primary/15 blur-3xl animate-blob roycss-parallax-near" aria-hidden="true" />
          <Parallax offset={40} className="absolute top-[20%] right-[-10%] size-[35rem] rounded-full bg-emerald-500/8 blur-3xl animate-blob animation-delay-2000 roycss-parallax-mid" aria-hidden="true" />
          <Parallax offset={80} className="absolute bottom-[-15%] left-[30%] size-[30rem] rounded-full bg-teal-500/8 blur-3xl animate-blob animation-delay-4000 roycss-parallax-far" aria-hidden="true" />
          <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" aria-hidden="true" />
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          {/* Nav bar */}
          <nav aria-label="Primary navigation" className="flex items-center justify-between mb-8 sm:mb-12">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity min-w-0 min-h-11 px-1 -mx-1 rounded-lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="RoyCSS — scroll to top"
            >
              {/* hideTextOnMobile keeps the logo icon on-screen at 320px; wordmark reappears at ≥sm */}
              <RoyCSSLogo size="md" animated={true} hideTextOnMobile />
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-semibold">
                v1.0
              </Badge>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              {/* Primary nav — desktop (≥lg). Mobile uses hamburger below.
                  4 primary items: Get Started · Explore ▾ · Platform ▾ · Docs · FAQ.
                  Explore & Platform are hover-open mega-menu dropdowns.
                  Note: appears at lg (≥1024px) rather than md so the mega-menu panels
                  (especially Platform ▾ at w-[680px]) have room to render at 768–1023px
                  the user gets the hamburger menu instead. */}
              <div className="hidden lg:flex items-center gap-1 mr-2">
                <button
                  onClick={() => scrollToSection("#get-started")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    activeSection === "get-started"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  Get Started
                </button>

                {/* Explore ▾ — single-column mega-menu (Effects · Recipes · Patterns · Collections) */}
                <NavMegaMenu
                  label="Explore"
                  align="start"
                  active={
                    activeSection === "effects" ||
                    activeSection === "recipes" ||
                    activeSection === "patterns" ||
                    activeSection === "collections"
                  }
                  contentClassName="w-72 p-2"
                >
                  <DropdownMenuLabel className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Explore
                  </DropdownMenuLabel>
                  <div className="space-y-0.5">
                    {EXPLORE_ITEMS.map((item) => (
                      <MegaMenuRow key={item.label} item={item} onSelect={scrollToSection} />
                    ))}
                  </div>
                </NavMegaMenu>

                {/* Platform ▾ — 2-column mega-menu (Build · Design · AI · DevTools · Enterprise · Learning) */}
                <NavMegaMenu
                  label="Platform"
                  align="start"
                  active={activeSection === "platform"}
                  contentClassName="w-[680px] p-4"
                >
                  <div className="mb-3 px-1">
                    <span className="text-sm font-semibold text-foreground">RoyCSS Platform</span>
                    <span className="ml-2 text-xs text-muted-foreground">62 products · 6 pillars</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {PLATFORM_GROUPS.map((group) => (
                      <div key={group.name} className="space-y-0.5">
                        <DropdownMenuLabel className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.name}
                        </DropdownMenuLabel>
                        {group.items.map((item) => (
                          <MegaMenuRow key={item.label} item={item} onSelect={scrollToSection} />
                        ))}
                      </div>
                    ))}
                  </div>
                </NavMegaMenu>

                <button
                  onClick={() => setDocsOpen(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    docsOpen
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  Docs
                </button>
                <button
                  onClick={() => scrollToSection("#faq")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    activeSection === "faq"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  FAQ
                </button>
              </div>
              {/* Mobile hamburger menu — visible until lg (≥1024px) so the
                  full desktop nav + mega-menus only render when there's room. */}
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="lg:hidden flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
              {/* Search button (⌘K) — size-11 (44px) to meet WCAG 2.5.5 touch target on mobile */}
              <button
                onClick={() => setSearchOverlayOpen(true)}
                className="flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label="Search (⌘K)"
                title="Search effects, products, recipes & more (⌘K)"
              >
                <Search className="size-4" />
              </button>
              {/* Keyboard shortcuts hint — visible "?" button.
                  Hidden below xl (≥1280px) to keep the navbar cluster compact on tablets & small desktops. */}
              <button
                onClick={() => setShortcutsOpen(true)}
                className="hidden xl:flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5 cursor-pointer"
                aria-label="Keyboard shortcuts (?)"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="size-4" />
              </button>
              {/* Tools Dropdown — consolidates 13 tool buttons into one menu.
                  Hidden below xl (≥1280px); the same tools are reachable via the
                  hamburger menu's "Tools" section on smaller viewports. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden xl:flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5 cursor-pointer"
                    aria-label="Developer tools"
                    title="Tools"
                  >
                    <Wrench className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-y-auto">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPlaygroundOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <SlidersHorizontal className="size-4 text-muted-foreground" /> Playground
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setCompareEffects([]); setCompareOpen(true); }} className="cursor-pointer gap-2 text-sm">
                    <GitCompare className="size-4 text-muted-foreground" /> Compare Effects
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRecentOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" /> Recently Used
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCopyHistoryOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Clipboard className="size-4 text-muted-foreground" /> Copy History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCollectionsOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <FolderPlus className="size-4 text-muted-foreground" /> My Collections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnalyticsOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <BarChart3 className="size-4 text-muted-foreground" /> Activity Dashboard
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS Generators</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setGradientGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Palette className="size-4 text-muted-foreground" /> Gradient Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBorderRadiusOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Square className="size-4 text-muted-foreground" /> Border Radius Visualizer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShadowGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Box className="size-4 text-muted-foreground" /> Box Shadow Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTransformStudioOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Move3d className="size-4 text-muted-foreground" /> Transform Studio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGridGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <LayoutGrid className="size-4 text-muted-foreground" /> CSS Grid Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFlexboxOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Rows3 className="size-4 text-muted-foreground" /> Flexbox Visualizer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setClipPathOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Scissors className="size-4 text-muted-foreground" /> Clip Path Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStudioOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <SlidersHorizontal className="size-4 text-muted-foreground" /> CSS Filter Studio
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color & Typography</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setContrastCheckerOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Contrast className="size-4 text-muted-foreground" /> Contrast Checker
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaletteGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Palette className="size-4 text-muted-foreground" /> Color Palette Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShadeGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Paintbrush className="size-4 text-muted-foreground" /> Color Shade Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontPreviewOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Type className="size-4 text-muted-foreground" /> Font Preview Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSpacingScaleOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Ruler className="size-4 text-muted-foreground" /> Spacing Scale Generator
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setBundleCalcOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Calculator className="size-4 text-muted-foreground" /> Bundle Calculator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBeautifierOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Braces className="size-4 text-muted-foreground" /> CSS Beautifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUnitConverterOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Ruler className="size-4 text-muted-foreground" /> Unit Converter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVarManagerOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Variable className="size-4 text-muted-foreground" /> CSS Variable Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnimTimelineOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Film className="size-4 text-muted-foreground" /> Animation Timeline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResponsivePreviewOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Smartphone className="size-4 text-muted-foreground" /> Responsive Preview
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Help</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Keyboard className="size-4 text-muted-foreground" /> Keyboard Shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => restartRoyCssTutorial()} className="cursor-pointer gap-2 text-sm">
                    <GraduationCap className="size-4 text-muted-foreground" /> Take Tour
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => scrollToSection("#platform")} className="cursor-pointer gap-2 text-sm font-medium text-primary">
                    <Wrench className="size-4" /> Browse All 64 Dev Tools →
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
              <button
                onClick={() => setFavoritesOpen(true)}
                className="relative flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-rose-500 transition-all hover:-translate-y-0.5 cursor-pointer"
                aria-label="Open favorites"
                title="Your favorited effects"
              >
                <Heart className={`size-4 ${count > 0 ? "fill-rose-500/20 text-rose-500" : ""}`} />
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold"
                  >
                    {count}
                  </motion.span>
                )}
              </button>
              {/* Sponsor button — hidden below xl so the cluster never overflows at md/lg.
                  Reachable from the hamburger menu's "Sponsor" item on smaller viewports. */}
              <button
                onClick={() => setSponsorModalOpen(true)}
                className="hidden xl:inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-medium text-xs cursor-pointer"
                aria-label="Sponsor RoyCSS"
              >
                <Heart className="size-3.5" />
                Sponsor
              </button>
              {/* GitHub icon link — hidden below lg (footer has a duplicate GitHub link
                  that's always reachable). */}
              <a
                href="https://github.com/Roy-Wanyoike/roycss"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5"
                aria-label="GitHub repository"
              >
                <Github className="size-4" />
              </a>
            </motion.div>
          </nav>

          {/* Mobile menu dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="flex flex-col gap-1 py-2">
                  {[
                    { label: "Get Started", id: "#get-started" },
                    { label: "Effects", id: "#effects" },
                    { label: "Recipes", id: "#recipes" },
                    { label: "Patterns", id: "#patterns" },
                    { label: "Collections", id: "#collections" },
                    { label: "Platform", id: "#platform" },
                    { label: "FAQ", id: "#faq" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        scrollToSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer min-h-[44px]"
                    >
                      {item.label}
                      <ChevronRight className="size-3.5" />
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setDocsOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer min-h-[44px]"
                  >
                    Docs
                    <BookOpen className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setPlaygroundOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer min-h-[44px]"
                  >
                    Playground
                    <SlidersHorizontal className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCompareEffects([]);
                      setCompareOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer min-h-[44px]"
                  >
                    Compare
                    <GitCompare className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setContactOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer min-h-[44px]"
                  >
                    Contact
                    <Mail className="size-3.5" />
                  </button>
                  <button
                    onClick={() => { setSponsorModalOpen(true); setMobileMenuOpen(false); }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[44px]"
                  >
                    Sponsor
                    <Heart className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero content */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Hero Logo — wrapped in 3D tilt stage (mouse-driven) */}
            <ScrollReveal y={12}>
              <div className="flex justify-center mb-3">
                <TiltStage>
                  <RoyCSSHeroLogo />
                </TiltStage>
              </div>
            </ScrollReveal>

            <ScrollReveal y={12} delay={0.1}>
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs sm:text-sm font-medium text-primary mb-3">
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="size-1.5 rounded-full bg-primary"
                />
                <Package className="size-3.5" />
                AI-Native Frontend Engineering Platform
              </div>
            </ScrollReveal>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              <span className="block text-foreground">
                <TextReveal text="Build Beautiful" />
              </span>
              <span className="block mt-1">
                <AnimatedGradientText className="font-display font-bold">
                  <TextReveal text="Frontend Interfaces" delay={0.3} />
                </AnimatedGradientText>
              </span>
            </h1>

            <ScrollReveal delay={0.3}>
              <p className="mt-2 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
                1,569 CSS effects, 62 platform products, 64 developer tools, and AI assistance —
                design, build, customize, and ship modern interfaces in one cohesive ecosystem.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.35}>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <InstallCommand />
                <MagneticButton strength={0.3} className="inline-block">
                  <Button
                    size="lg"
                    onClick={() =>
                      scrollToSection("#what-is-roycss")
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6"
                  >
                    Explore the Platform
                    <ChevronDown className="size-4 ml-1" />
                  </Button>
                </MagneticButton>
              </div>
            </ScrollReveal>

            {/* Stats — trust signals */}
            <ScrollReveal delay={0.4}>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" />
                  OKLCH colors
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" />
                  Zero JS runtime
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" />
                  MIT licensed
                </span>
              </div>
            </ScrollReveal>

            {/* Animated stats counters */}
            <ScrollReveal delay={0.45}>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                <StatCounter icon={Sparkles} value={effects.length} label="Effects" />
                <StatCounter icon={BookOpen} value={categoryOrder.length} label="Categories" />
                <StatCounter icon={Zap} value={22000} label="Lines of CSS" suffix="+" prefix="~" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </header>

      {/* ─── What is RoyCSS? (platform overview) ─────────────── */}
      <WhatIsRoyCSS />

      {/* ─── Featured Effects (curated 10, before full gallery) ─── */}
      <FeaturedEffects
        onSelectEffect={(e) => { pushRecentEffect(e.id); setSelectedEffect(e); setDialogOpen(true); }}
        onExploreAll={() => scrollToSection("#effects")}
      />

      {/* ─── WebGL & Canvas Effects Showcase ────────────────── */}
      <WebGLShowcase />

      {/* ─── Featured highlights (landmark-wrapped for WCAG 2.4.1) ── */}
      <section aria-label="Featured highlights" className="border-b border-border/40">
        {/* ─── Marquee Strip ──────────────────────────────────── */}
        <div className="py-6 border-y border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
          <Marquee speed={35}>
            {categoryOrder.map((cat) => (
              <MarqueeItem
                key={cat}
                icon={catIcons[cat]}
                label={categoryMeta[cat].label}
              />
            ))}
          </Marquee>
        </div>

        {/* ─── Featured Companies (logo strip) ───────────────── */}
        <FeaturedCompanies />

        {/* ─── Featured Carousel (rotates through ALL effects) ── */}
        <FeaturedCarousel
          onSelectEffect={(e) => {
            setSelectedEffect(e);
            setDialogOpen(true);
          }}
        />
      </section>

      <Separator className="opacity-50" />

      {/* ─── Get Started ─────────────────────────────────────── */}
      <GetStarted />

      <Separator className="opacity-50" />

      {/* ─── Effects Section ────────────────────────────────── */}
      <main id="effects" aria-label="RoyCSS effects gallery and platform content" tabIndex={-1} className="flex-1 py-10 sm:py-14 scroll-mt-20 focus:outline-none">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Effect of the Day */}
          <div className="mb-8">
            <EffectOfTheDay onSelectEffect={(e) => { pushRecentEffect(e.id); setSelectedEffect(e); setDialogOpen(true); }} />
          </div>

          {/* Category Explorer */}
          <div className="mb-8">
            <CategoryExplorer onCategorySelect={(cat) => {
              setActiveCategory(cat);
              const grid = document.querySelector("#effects [class*=\"grid\"]");
              if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
            }} />
          </div>

          {/* Surprise Me + Tags Cloud + Recommendations */}
          <div className="mb-8 grid sm:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-3">Can&apos;t decide?</h3>
              <RandomEffectPicker onSelectEffect={(e) => { pushRecentEffect(e.id); setSelectedEffect(e); setDialogOpen(true); }} />
            </div>
            <div>
              <TagsCloud onTagSelect={(tag) => {
                setSearch(tag);
                const grid = document.querySelector("#effects [class*=\"grid\"]");
                if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
              }} />
            </div>
          </div>

          {/* Recommendation Engine */}
          <div className="mb-8">
            <EffectRecommendationEngine onSelectEffect={(e) => { pushRecentEffect(e.id); setSelectedEffect(e); setDialogOpen(true); }} />
          </div>

          {/* Property Search */}
          <div className="mb-8">
            <PropertySearch onResults={(ids) => {
              if (ids.length === 0) {
                setSearch("");
              } else {
                // Set search to the first effect name to trigger filtering
                const firstMatch = effects.find(e => e.id === ids[0]);
                if (firstMatch) setSearch(firstMatch.category);
              }
            }} />
          </div>

          {/* Section heading */}
          <SectionHeading
            eyebrow="Browse the collection"
            title="All Effects"
            subtitle="Filter by category or search by name, description, or tag. Click any card to view its CSS code."
            className="mb-10"
          />

          {/* Search */}
          <ScrollReveal className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                type="search"
                aria-label="Search CSS effects by name, tag, or category"
                placeholder="Search 1569+ effects... (⌘K)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-14 h-11 rounded-xl glass bg-background/80 border-border/50 focus:border-primary/50"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/50 text-[9px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              )}
            </div>
          </ScrollReveal>

          {/* Category pills */}
          <ScrollReveal delay={0.1} className="mb-8 overflow-x-auto scrollbar-thin pb-2">
            <div className="flex items-center gap-2 min-w-max px-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer min-h-[44px] ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "glass text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <Sparkles className="size-3.5" />
                All
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${
                    activeCategory === "all" ? "bg-primary-foreground/20" : "bg-muted"
                  }`}
                >
                  {effects.length}
                </span>
              </button>
              {categoryOrder.map((cat) => (
                <CategoryPill
                  key={cat}
                  category={cat}
                  active={activeCategory === cat}
                  count={getCategoryCount(cat)}
                  onClick={() => setActiveCategory(activeCategory === cat ? "all" : cat)}
                />
              ))}
            </div>
          </ScrollReveal>

          {/* Results count */}
          <ScrollReveal delay={0.15} className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">{filteredEffects.length}</span>{" "}
              {filteredEffects.length === 1 ? "effect" : "effects"}
              {activeCategory !== "all" && (
                <span>
                  {" "}
                  in{" "}
                  <span className="text-primary font-medium">
                    {categoryMeta[activeCategory].label}
                  </span>
                </span>
              )}
              {search && (
                <span>
                  {" "}
                  matching &ldquo;
                  <span className="text-primary font-medium">{search}</span>&rdquo;
                </span>
              )}
            </p>
          </ScrollReveal>

          {/* Effects Grid — virtualized for performance */}
          {filteredEffects.length > 0 ? (
            <VirtualScrollGrid
              effects={filteredEffects}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onCardClick={(e) => {
                pushRecentEffect(e.id);
                setSelectedEffect(e);
                setDialogOpen(true);
              }}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="size-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Search className="size-7 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                No effects found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Try a different search term or browse all categories to find what you need.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
              >
                Clear filters
              </Button>

              {/* Suggested search terms — quick recovery from empty state */}
              <div className="mt-6 max-w-md mx-auto">
                <p className="text-xs text-muted-foreground mb-2.5">
                  Try one of these popular searches:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["glow", "spinner", "glass", "card", "text", "button"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearch(term);
                        setActiveCategory("all");
                        searchInputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass text-muted-foreground hover:text-primary hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Search className="size-3" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

      <Separator className="opacity-50" />

      {/* ─── Recipes Section ─────────────────────────────────── */}
      <RecipesSection />

      {/* ─── CTA Banner ─────────────────────────────────────── */}
      <section aria-label="Call to action" className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <ShineBorder className="max-w-4xl mx-auto rounded-3xl bg-card overflow-hidden">
              <div className="p-8 sm:p-12 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3"
                >
                  <Wand2 className="size-7" />
                </motion.div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  <TextReveal text="Ready to build something beautiful?" />
                </h2>
                <ScrollReveal delay={0.2}>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                    Copy any effect&apos;s CSS, paste it into your project, and ship delightful
                    interfaces in minutes — no dependencies required.
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={0.3}>
                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <MagneticButton strength={0.25} className="inline-block">
                      <Button
                        size="lg"
                        onClick={() =>
                          scrollToSection("#effects")
                        }
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6"
                      >
                        <Code2 className="size-4" />
                        Browse all {effects.length} effects
                      </Button>
                    </MagneticButton>
                    <a
                      href="https://github.com/Roy-Wanyoike/roycss"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-xl glass text-foreground hover:border-primary/30 transition-all font-medium text-sm"
                    >
                      <Github className="size-4" />
                      Star on GitHub
                      <ChevronRight className="size-3.5" />
                    </a>
                    <button
                      onClick={() => setContactOpen(true)}
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-xl glass text-foreground hover:border-primary/30 transition-all font-medium text-sm cursor-pointer"
                    >
                      <Mail className="size-4" />
                      Contact Us
                    </button>
                  </div>
                </ScrollReveal>
              </div>
            </ShineBorder>
          </ScrollReveal>
        </div>
      </section>
      </main>

      {/* ─── Effect Showcase Grid (trending/new/community) ──── */}
      <EffectShowcaseGrid />

      {/* ─── RoyMotion Showcase ─────────────────────────────── */}
      <RoyMotionShowcase />

      {/* ─── Content Taxonomy (explains Components vs Effects vs Patterns etc.) ─── */}
      <ContentTaxonomy />

      <Separator className="opacity-50" />

      {/* ─── Patterns Section (UI state patterns) ─────────────── */}
      <PatternsSection />

      <Separator className="opacity-50" />

      {/* ─── Collections Section (curated themed bundles) ────── */}
      <CollectionsSection onSelectEffect={(effect) => { setSelectedEffect(effect); setDialogOpen(true); }} />

      {/* ─── Community Spotlight ────────────────────────────── */}
      <CommunitySpotlight />

      <Separator className="opacity-50" />

      {/* ─── RoyCSS Platform (unified — 62 products, 6 categories) ─── */}
      <PlatformSectionUnified
        onLaunchTool={(toolId) => {
          if (toolId === "ai-playground" || toolId === "css-doctor" || toolId === "utility-explorer" || toolId === "benchmark" || toolId === "genome" || toolId === "ai-migration" || toolId === "challenges" || toolId === "design-diff" || toolId === "css-minifier" || toolId === "specificity" || toolId === "easing" || toolId === "stacking" || toolId === "similarity" || toolId === "perf" || toolId === "browser-support" || toolId === "print" || toolId === "selector-tester" || toolId === "dark-mode" || toolId === "variable-graph" || toolId === "fluid-type" || toolId === "scroll-animation" || toolId === "grid-areas" || toolId === "container-query" || toolId === "nesting" || toolId === "contrast-matrix" || toolId === "unit-converter" || toolId === "box-model" || toolId === "flex-playground" || toolId === "transition-studio" || toolId === "pattern-generator" || toolId === "transform-studio" || toolId === "cursor-gallery" || toolId === "scrollbar-styler" || toolId === "gap-spacing" || toolId === "writing-mode" || toolId === "object-fit" || toolId === "positioning" || toolId === "property-inspector" || toolId === "animation-timeline" || toolId === "sprite-sheet" || toolId === "text-shadow" || toolId === "filter-studio" || toolId === "conic-gradient" || toolId === "motion-path" || toolId === "view-transition" || toolId === "mask-studio" || toolId === "gradient-mesh" || toolId === "table-styler" || toolId === "aspect-ratio" || toolId === "shape-generator" || toolId === "scroll-snap" || toolId === "keyframes-studio" || toolId === "theming-engine" || toolId === "has-selector-tester" || toolId === "css-layers" || toolId === "input-mode" || toolId === "cascade-specificity" || toolId === "color-space" || toolId === "style-query" || toolId === "scope" || toolId === "subgrid" || toolId === "fallback" || toolId === "logical-properties" || toolId === "initial-letter" || toolId === "text-wrap" || toolId === "property-registrar" || toolId === "relative-color" || toolId === "starting-style" || toolId === "light-dark") {
            setPlatformTool(toolId);
          }
        }}
      />

      <Separator className="opacity-50" />

      {/* ─── Documentation Section ──────────────────────────── */}
      <section id="docs" aria-label="Documentation" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
              <BookOpen className="size-3.5" />
              Documentation
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need to Know
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Guides, tutorials, and references to help you ship faster.
            </p>
          </div>

          {/* Docs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <DocCard
              icon={Accessibility}
              title="Accessibility"
              description="WCAG 2.1 AA compliant. Every effect respects prefers-reduced-motion. Full keyboard navigation. ARIA-ready."
              items={["Reduced motion support", "Focus-visible rings", "Screen reader safe", "High contrast mode"]}
              details={[
                { label: "How it works", content: "Every effect wraps infinite animations in a @media (prefers-reduced-motion: reduce) guard that reduces animation-duration to 0.01ms. Focus-visible rings use OKLCH-based outlines that adapt to light/dark mode automatically." },
                { label: "Testing", content: "The showcase site passes WCAG 2.1 AA contrast checks. All interactive elements have 44px+ touch targets. Semantic HTML (main, nav, section, footer) and ARIA labels throughout." },
              ]}
            />
            <DocCard
              icon={Gauge}
              title="Performance"
              description="Zero JavaScript runtime. Pure CSS — no hydration cost, no bundle bloat. Tree-shakeable per-effect."
              items={["10KB initial CSS (lazy-loaded)", "~1KB per effect on demand", "Zero JS runtime", "Tree-shakeable exports"]}
              details={[
                { label: "Dynamic Loading", content: "The showcase uses IntersectionObserver to inject CSS only for visible effects — 10KB initial, 98.7% reduction from the full 828KB. In your project, import the full CSS or use the CLI to copy individual effects." },
                { label: "Virtual Scrolling", content: "The effects grid renders 24 cards at a time instead of 1569 — a 97.7% DOM reduction. Offscreen animations are paused via animation-play-state: paused." },
              ]}
            />
            <DocCard
              icon={ArrowLeftRight}
              title="Migration"
              description="Switch from Animate.css, Tailwind, or Bootstrap with our migration guides and codemods."
              items={["Animate.css → RoyCSS map", "Tailwind integration", "Bootstrap conversion", "Automatic codemods"]}
              details={[
                { label: "Animate.css", content: "Use the migration table above to map animate__fadeIn → roycss-anim-fade-in, animate__bounce → roycss-anim-bounce, etc. Run scripts/migrate-colors.ts to convert hex/rgba to OKLCH." },
                { label: "Tailwind CSS", content: "RoyCSS is complementary to Tailwind — they coexist without conflicts. All RoyCSS classes are prefixed with .roycss- to avoid collisions. Use Tailwind for layout, RoyCSS for effects." },
              ]}
            />
            <DocCard
              icon={LayoutDashboard}
              title="Dashboard Tutorial"
              description="Build a complete dashboard in 15 minutes using RoyCSS components and effects."
              items={["Grid + StatCards", "Charts + Tables", "Tabs + Progress", "Copy-paste template"]}
              details={[
                { label: "Quick Start", content: "Import RoyCSS, add .roycss-card-glass to your containers, .roycss-hover-lift-glow to interactive cards, and .roycss-loader-ring-spin for loading states. Combine effects for richer UIs." },
                { label: "Recipes", content: "Use the MCP Server's get_recipes tool to get curated effect combinations for hero sections, loading states, feature cards, navigation bars, and notification badges." },
              ]}
            />
            <DocCard
              icon={History}
              title="Changelog"
              description="Track every release — new effects, breaking changes, deprecations, and bug fixes."
              items={["v1.0 — 1569+ effects launch", "20+ categories", "OKLCH color system", "RoyMotion animation system"]}
              details={[
                { label: "v1.0.0", content: "1569+ CSS effects across 20 categories. OKLCH color space with color-mix() throughout. CSS logical properties for RTL/I18n. @property, container queries, :has(), light-dark(). MCP Server for AI assistants. 5-tier sponsorship system." },
              ]}
            />
            <DocCard
              icon={Rocket}
              title="Roadmap"
              description="What's coming next — component library expansion, VS Code extension, AI-powered suggestions."
              items={["Component library (24→100+)", "VS Code extension", "CLI codemods", "AI effect recommender"]}
              details={[
                { label: "Next Quarter", content: "RoyCSS Recipes (solution-focused content), RoyCSS Patterns (UI state patterns), expanded component library, and a full LSP-based VS Code extension with autocomplete and hover previews." },
                { label: "Platform Vision", content: "16+ platform products including Marketplace, Studio (visual builder), Pro Components, RoyAI, Inspector (Chrome extension), Cloud, and Academy (certification). See the Platform section above." },
              ]}
            />
          </div>

          {/* Animate.css → RoyCSS migration table */}
          <MigrationTable />
        </div>
      </section>

      <Separator className="opacity-50" />

      {/* ─── FAQ Section ────────────────────────────────────── */}
      <FAQSection />

      <Separator className="opacity-50" />

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer aria-label="Site footer" className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <RoyCSSLogo size="sm" animated={false} />

            <p className="text-xs text-muted-foreground text-center">
              Crafted with care by{" "}
              <a
                href="https://www.linkedin.com/in/roywanyoike/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:decoration-2"
              >
                Royford Wanyoike Wamaitha
              </a>
              {" "}&middot;{" "}
              Production-ready CSS effects with live demos
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollToSection("#get-started")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Get Started
              </button>
              <button
                onClick={() => scrollToSection("#docs")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Docs
              </button>
              <button
                onClick={() => scrollToSection("#faq")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                FAQ
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Contact
              </button>
              <button
                onClick={() => setSponsorModalOpen(true)}
                className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                aria-label="Sponsor RoyCSS"
              >
                <Heart className="size-4" />
              </button>
              <a
                href="https://github.com/Roy-Wanyoike/roycss"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub repository"
              >
                <Github className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Effect Detail Dialog */}
      {selectedEffect && (
        <EffectDetailDialog
          key={selectedEffect.id}
          effect={selectedEffect}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSelectEffect={(e) => {
            setSelectedEffect(e);
          }}
          onCompare={(e) => {
            setCompareEffects([e]);
            setCompareOpen(true);
          }}
        />
      )}

      {/* Favorites Sheet */}
      <FavoritesSheet
        open={favoritesOpen}
        onOpenChange={setFavoritesOpen}
        favoriteEffects={favoriteEffects}
        onToggleFavorite={toggleFavorite}
        onSelectEffect={(e) => {
          setSelectedEffect(e);
          setDialogOpen(true);
        }}
        onClearAll={clearAll}
      />

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Sticky Mini Nav — glassmorphism floating nav */}
      <StickyMiniNav
        activeSection={activeSection}
        onScrollToSection={scrollToSection}
        onOpenSearch={() => setSearchOverlayOpen(true)}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenPlayground={() => setPlaygroundOpen(true)}
        onOpenCompare={() => { setCompareEffects([]); setCompareOpen(true); }}
      />

      {/* Floating Sponsor Button — chat-assistant style */}
      <FloatingSponsorButton onClick={() => setSponsorModalOpen(true)} />

      {/* Recently Used Effects Sheet */}
      <RecentEffectsSheet
        open={recentOpen}
        onOpenChange={setRecentOpen}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
      />

      {/* Keyboard Shortcuts Overlay — press ? to toggle */}
      <KeyboardShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Copy History Sheet — tracks copied CSS */}
      <CopyHistorySheet
        open={copyHistoryOpen}
        onOpenChange={setCopyHistoryOpen}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
      />

      {/* Bundle Calculator — select effects, see total size */}
      <BundleCalculator open={bundleCalcOpen} onOpenChange={setBundleCalcOpen} />

      {/* User Analytics Dashboard — personal stats */}
      <UserAnalyticsDashboard
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        favoritesCount={count}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
      />

      {/* PWA Install Prompt — smart install banner */}
      <PWAInstallPrompt />

      {/* Custom Collections Sheet */}
      <CustomCollectionsSheet
        open={collectionsOpen}
        onOpenChange={setCollectionsOpen}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
      />

      {/* CSS Beautifier Sheet */}
      <Sheet open={beautifierOpen} onOpenChange={setBeautifierOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Braces className="size-5 text-primary" />
              CSS Beautifier
            </SheetTitle>
            <SheetDescription>Format messy CSS into readable, indented output.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><CSSBeautifier /></div>
        </SheetContent>
      </Sheet>

      {/* CSS Unit Converter Sheet */}
      <Sheet open={unitConverterOpen} onOpenChange={setUnitConverterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Ruler className="size-5 text-primary" />
              Unit Converter
            </SheetTitle>
            <SheetDescription>Convert between px, rem, em, pt, vw, vh, %.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><CSSUnitConverter /></div>
        </SheetContent>
      </Sheet>

      {/* Contrast Checker Sheet */}
      <Sheet open={contrastCheckerOpen} onOpenChange={setContrastCheckerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Contrast className="size-5 text-primary" />
              Contrast Checker
            </SheetTitle>
            <SheetDescription>WCAG color contrast — AA/AAA pass/fail with live preview.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><ContrastChecker /></div>
        </SheetContent>
      </Sheet>

      {/* Gradient Generator Sheet */}
      <Sheet open={gradientGenOpen} onOpenChange={setGradientGenOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Palette className="size-5 text-primary" />
              Gradient Generator
            </SheetTitle>
            <SheetDescription>Visual OKLCH gradient builder — linear, radial, conic.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><CSSGradientGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* Border Radius Visualizer Sheet */}
      <Sheet open={borderRadiusOpen} onOpenChange={setBorderRadiusOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Square className="size-5 text-primary" />
              Border Radius Visualizer
            </SheetTitle>
            <SheetDescription>Drag sliders to adjust corners. Copy CSS instantly.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><BorderRadiusVisualizer /></div>
        </SheetContent>
      </Sheet>

      {/* Box Shadow Generator Sheet */}
      <Sheet open={shadowGenOpen} onOpenChange={setShadowGenOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Box className="size-5 text-primary" />
              Box Shadow Generator
            </SheetTitle>
            <SheetDescription>Multi-layer shadows with OKLCH colors. Presets + custom.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><BoxShadowGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* Color Palette Generator Sheet */}
      <Sheet open={paletteGenOpen} onOpenChange={setPaletteGenOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Palette className="size-5 text-primary" />
              Color Palette Generator
            </SheetTitle>
            <SheetDescription>Generate OKLCH palettes with 6 harmony types.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><ColorPaletteGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* Transform Studio Sheet */}
      <Sheet open={transformStudioOpen} onOpenChange={setTransformStudioOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Move3d className="size-5 text-primary" />
              Transform Studio
            </SheetTitle>
            <SheetDescription>Interactive CSS transform visualizer — rotate, scale, skew, translate.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><TransformStudio /></div>
        </SheetContent>
      </Sheet>

      {/* Animation Timeline Sheet */}
      <Sheet open={animTimelineOpen} onOpenChange={setAnimTimelineOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Film className="size-5 text-primary" />
              Animation Timeline
            </SheetTitle>
            <SheetDescription>Visual keyframe editor — build custom animations.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><AnimationTimeline /></div>
        </SheetContent>
      </Sheet>

      {/* Font Preview Tool Sheet */}
      <Sheet open={fontPreviewOpen} onOpenChange={setFontPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Type className="size-5 text-primary" />
              Font Preview Tool
            </SheetTitle>
            <SheetDescription>Preview text with different font properties. Copy CSS instantly.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><FontPreviewTool /></div>
        </SheetContent>
      </Sheet>

      {/* CSS Grid Generator Sheet */}
      <Sheet open={gridGenOpen} onOpenChange={setGridGenOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <LayoutGrid className="size-5 text-primary" />
              CSS Grid Generator
            </SheetTitle>
            <SheetDescription>Visual grid builder — columns, rows, gaps, item placement.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><CSSGridGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* Flexbox Visualizer Sheet */}
      <Sheet open={flexboxOpen} onOpenChange={setFlexboxOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Rows3 className="size-5 text-primary" />
              Flexbox Visualizer
            </SheetTitle>
            <SheetDescription>Interactive flexbox tester — direction, justify, align, wrap.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><FlexboxVisualizer /></div>
        </SheetContent>
      </Sheet>

      {/* Clip Path Generator Sheet */}
      <Sheet open={clipPathOpen} onOpenChange={setClipPathOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Scissors className="size-5 text-primary" />
              Clip Path Generator
            </SheetTitle>
            <SheetDescription>Visual clip-path editor with 10 shape presets.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><ClipPathGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* CSS Filter Studio Sheet */}
      <Sheet open={filterStudioOpen} onOpenChange={setFilterStudioOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <SlidersHorizontal className="size-5 text-primary" />
              CSS Filter Studio
            </SheetTitle>
            <SheetDescription>8 CSS filters with live preview and presets.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><FilterStudio /></div>
        </SheetContent>
      </Sheet>

      {/* Color Shade Generator Sheet */}
      <Sheet open={shadeGenOpen} onOpenChange={setShadeGenOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Paintbrush className="size-5 text-primary" />
              Color Shade Generator
            </SheetTitle>
            <SheetDescription>Generate 10 shades/tints from any base color. Hex or OKLCH output.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><ColorShadeGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* Spacing Scale Generator Sheet */}
      <Sheet open={spacingScaleOpen} onOpenChange={setSpacingScaleOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Ruler className="size-5 text-primary" />
              Spacing Scale Generator
            </SheetTitle>
            <SheetDescription>Generate spacing scales — linear, geometric, golden ratio, Tailwind.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><SpacingScaleGenerator /></div>
        </SheetContent>
      </Sheet>

      {/* CSS Variable Manager Sheet */}
      <Sheet open={varManagerOpen} onOpenChange={setVarManagerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Variable className="size-5 text-primary" />
              CSS Variable Manager
            </SheetTitle>
            <SheetDescription>Manage design tokens — colors, spacing, fonts, radius, shadows.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><CSSVariableManager /></div>
        </SheetContent>
      </Sheet>

      {/* Responsive Preview Sheet */}
      <Sheet open={responsivePreviewOpen} onOpenChange={setResponsivePreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Smartphone className="size-5 text-primary" />
              Responsive Preview
            </SheetTitle>
            <SheetDescription>Preview any URL at 6 device breakpoints.</SheetDescription>
          </SheetHeader>
          <div className="p-5"><ResponsivePreview /></div>
        </SheetContent>
      </Sheet>

      {/* Contact / Suggestion Form */}
      <ContactForm open={contactOpen} onOpenChange={setContactOpen} />

      {/* Sponsor Modal — GitHub Sponsor card + M-Pesa + PayPal + Crypto */}
      <SponsorModal open={sponsorModalOpen} onOpenChange={setSponsorModalOpen} />

      {/* Animation Playground */}
      <PlaygroundPanel open={playgroundOpen} onOpenChange={setPlaygroundOpen} />

      {/* Effect Comparison Panel */}
      <ComparisonPanel
        open={compareOpen}
        onOpenChange={setCompareOpen}
        initialEffects={compareEffects}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
      />

      {/* Platform Tools (AI Playground, CSS Doctor, Utility Explorer, Benchmark) */}
      {/* Only mount after first open — see `hasOpenedTool` gate above. */}
      {hasOpenedTool && (
        <PlatformTools
          tool={platformTool}
          onOpenChange={setPlatformTool}
          onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
        />
      )}

      {/* Search Overlay (⌘K) */}
      <SearchOverlay
        open={searchOverlayOpen}
        onOpenChange={setSearchOverlayOpen}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
        onJumpToSection={(id) => scrollToSection(id)}
      />

      {/* Section Scrollbar (desktop only) */}
      <SectionScrollbar
        activeCategory={activeCategory}
        onCategoryClick={(cat, sectionId) => {
          setActiveCategory(cat);
          // "hero" = Home dot → scroll to top of page (not #effects)
          if (sectionId === "hero") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            scrollToSection("#effects");
          }
        }}
      />

      {/* Documentation Viewer Sheet (opens from navbar "Docs" button) */}
      <DocsViewer open={docsOpen} onOpenChange={setDocsOpen} />

      {/* Interactive Tutorial Overlay (first-time user onboarding) */}
      <InteractiveTutorial />
    </div>
    </MotionConfig>
  );
}