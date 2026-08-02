"use client";

import { useEffect, useState, useRef, useMemo, useCallback, useSyncExternalStore } from "react";
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
  HelpCircle,
  Mail,
  Pause,
  ChevronLeft,
  Repeat,
} from "lucide-react";
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
import { SectionScrollbar } from "@/components/roycss/section-scrollbar";
import { DynamicEffectCSS } from "@/components/roycss/dynamic-effect-css";
import { VirtualScrollGrid } from "@/components/roycss/virtual-scroll-grid";
import { AnimationPauser } from "@/components/roycss/animation-pauser";
import { RoyCSSLogo, RoyCSSHeroLogo } from "@/components/roycss/roycss-logo";
import { GetStarted } from "@/components/roycss/get-started";
import { RoyMotionShowcase } from "@/components/roycss/roymotion-showcase";
import { PlatformEcosystem } from "@/components/roycss/platform-ecosystem";
import { ContactForm } from "@/components/roycss/contact-form";
import { FeaturedCompanies, SponsorModal } from "@/components/roycss/featured-companies";
import { RecipesSection } from "@/components/roycss/recipes-section";
import { PatternsSection } from "@/components/roycss/patterns-section";
import { CollectionsSection } from "@/components/roycss/collections-section";
import { ComparisonPanel } from "@/components/roycss/comparison-panel";
import { PlatformTools } from "@/components/roycss/platform-tools";
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
import { useFavorites } from "@/hooks/use-favorites";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
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
  const effectsEl = document.querySelector("#effects");
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
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
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

/* ─── FAQ Item (custom accordion — no Radix, hydration-safe) ── */
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="roycss-faq-item" data-open={isOpen}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          className="roycss-faq-trigger"
          aria-expanded={isOpen}
        >
          <span>{question}</span>
          <ChevronDown className="roycss-faq-chevron size-4" />
        </button>
      </h3>
      <div className="roycss-faq-content">
        <div className="roycss-faq-content-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Section ───────────────────────────────────────────── */
const faqEntries: Array<{ question: string; answer: string }> = [
  {
    question: "Does RoyCSS work with React/Vue/Angular/Svelte?",
    answer:
      "Yes. RoyCSS is pure CSS — import the stylesheet once and use any .roycss-* class in any framework.",
  },
  {
    question: "Does RoyCSS include JavaScript?",
    answer:
      "No. Every effect is 100% CSS. Zero runtime JavaScript, zero hydration cost.",
  },
  {
    question: "What's the bundle size?",
    answer:
      "Only ~10KB of CSS loads initially — the rest is lazy-loaded on demand as you scroll. Each effect averages ~1KB. Use the CLI to tree-shake and include only what you need.",
  },
  {
    question: "Does it support dark mode?",
    answer:
      "Yes. RoyCSS uses OKLCH colors with light-dark() support and a .dark class override system.",
  },
  {
    question: "Is it accessible?",
    answer:
      "Yes. All effects respect prefers-reduced-motion. Focus-visible rings are built in. WCAG 2.1 AA compliant.",
  },
  {
    question: "Can I customize colors?",
    answer:
      "Yes. Click any effect to open the detail dialog, then use the color palette or type a custom hex code.",
  },
  {
    question: "Is there an MCP server for AI assistants?",
    answer:
      "Yes. The RoyCSS MCP Server gives AI assistants (Claude, ChatGPT, Cursor, Windsurf, Codex) access to all 1569+ effects, framework examples, and design tokens. Once configured, your AI can search effects, get CSS code, and generate accurate RoyCSS — no hallucination. See the mcp-server/ directory for setup instructions.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" aria-label="Frequently asked questions" className="py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <HelpCircle className="size-3.5" />
            FAQ
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know about RoyCSS — frameworks, performance,
            accessibility, and customization.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqEntries.map((entry, i) => (
            <FAQItem
              key={entry.question}
              question={entry.question}
              answer={entry.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Animate.css → RoyCSS Migration Table ──────────────────── */
const animateMigrationRows: Array<{ from: string; to: string }> = [
  { from: "animate__bounce", to: "roycss-anim-bounce-in" },
  { from: "animate__flash", to: "roycss-anim-flash" },
  { from: "animate__pulse", to: "roycss-anim-pulse-glow" },
  { from: "animate__rubberBand", to: "roycss-anim-rubber-band" },
  { from: "animate__shake", to: "roycss-anim-shake" },
  { from: "animate__swing", to: "roycss-anim-swing" },
  { from: "animate__tada", to: "roycss-anim-tada" },
  { from: "animate__wobble", to: "roycss-anim-wobble" },
  { from: "animate__fadeIn", to: "roycss-anim-fade-in" },
  { from: "animate__fadeInUp", to: "roycss-anim-fade-in-up" },
  { from: "animate__slideInLeft", to: "roycss-anim-slide-in-left" },
  { from: "animate__zoomIn", to: "roycss-anim-zoom-in" },
];

function MigrationTable() {
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
              Drop-in replacements for common Animate.css classes. Same behavior,
              smaller bundle, no JS runtime.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin -mx-2">
          <table className="roycss-migration-table">
            <thead>
              <tr>
                <th scope="col">Animate.css</th>
                <th scope="col" className="roycss-arrow" aria-label="maps to">→</th>
                <th scope="col">RoyCSS</th>
              </tr>
            </thead>
            <tbody>
              {animateMigrationRows.map((row) => (
                <tr key={row.from}>
                  <td><code>{row.from}</code></td>
                  <td className="roycss-arrow" aria-hidden="true">→</td>
                  <td><code>{row.to}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      {/* Keyframes for the progress bar (doubles as the auto-advance timer) */}
      <style>{`@keyframes roy-featured-progress { from { width: 0% } to { width: 100% } }`}</style>

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
          {/* Prev / counter / Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              aria-label="Previous batch of effects"
              className="flex items-center justify-center size-9 rounded-lg bg-muted/80 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground tabular-nums whitespace-nowrap px-1">
              {startIdx}–{endIdx} <span className="opacity-50">/</span> {effects.length}
            </span>
            <button
              onClick={goToNext}
              aria-label="Next batch of effects"
              className="flex items-center justify-center size-9 rounded-lg bg-muted/80 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
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
  const [platformTool, setPlatformTool] = useState<"ai-playground" | "css-doctor" | "utility-explorer" | "benchmark" | "genome" | "ai-migration" | "challenges" | "design-diff" | null>(null);
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
  const { isFavorite, toggleFavorite, clearAll, count } = useFavorites();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check URL hash for shared effect links (#effect=pulse-glow)
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#effect=([a-z0-9-]+)$/);
    if (match) {
      const effectId = match[1];
      const effect = effects.find(e => e.id === effectId);
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
    const sectionIds = ["get-started", "effects", "recipes", "patterns", "platform", "docs", "faq"];
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

  const favoriteEffects = effects.filter((e) => isFavorite(e.id));

  const filteredEffects = effects.filter((e) => {
    const matchesSearch =
      search === "" ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = activeCategory === "all" || e.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (cat: EffectCategory) =>
    effects.filter((e) => e.category === cat).length;

  return (
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2.5"
            >
              <RoyCSSLogo size="md" animated={true} />
              <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-semibold">
                v1.0
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              {/* Docs nav links */}
              <div className="hidden md:flex items-center gap-1 mr-2">
                <button
                  onClick={() => scrollToSection("#get-started")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "get-started" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Get Started
                </button>
                <button
                  onClick={() => setDocsOpen(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${docsOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Docs
                </button>
                <button
                  onClick={() => scrollToSection("#effects")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "effects" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Effects
                </button>
                <button
                  onClick={() => scrollToSection("#recipes")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "recipes" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Recipes
                </button>
                <button
                  onClick={() => scrollToSection("#patterns")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "patterns" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Patterns
                </button>
                <button
                  onClick={() => scrollToSection("#collections")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "collections" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Collections
                </button>
                <button
                  onClick={() => scrollToSection("#platform")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "platform" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  Platform
                </button>
                <button
                  onClick={() => scrollToSection("#faq")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeSection === "faq" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  FAQ
                </button>
              </div>
              {/* Mobile hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="md:hidden flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
              {/* Search button (⌘K) */}
              <button
                onClick={() => setSearchOverlayOpen(true)}
                className="flex items-center justify-center size-9 rounded-xl glass text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label="Search (⌘K)"
              >
                <Search className="size-4" />
              </button>
              {/* Tools Dropdown — consolidates 13 tool buttons into one menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden sm:flex items-center justify-center size-9 rounded-xl glass text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5 cursor-pointer"
                    aria-label="Developer tools"
                    title="Tools"
                  >
                    <Wrench className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Developer Tools</DropdownMenuLabel>
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
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CSS Utilities</DropdownMenuLabel>
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
                  <DropdownMenuItem onClick={() => setContrastCheckerOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Contrast className="size-4 text-muted-foreground" /> Contrast Checker
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGradientGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Palette className="size-4 text-muted-foreground" /> Gradient Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBorderRadiusOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Square className="size-4 text-muted-foreground" /> Border Radius Visualizer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShadowGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Box className="size-4 text-muted-foreground" /> Box Shadow Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaletteGenOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Palette className="size-4 text-muted-foreground" /> Color Palette Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTransformStudioOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Move3d className="size-4 text-muted-foreground" /> Transform Studio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnimTimelineOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Film className="size-4 text-muted-foreground" /> Animation Timeline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontPreviewOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Type className="size-4 text-muted-foreground" /> Font Preview Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="cursor-pointer gap-2 text-sm">
                    <Keyboard className="size-4 text-muted-foreground" /> Keyboard Shortcuts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
              <button
                onClick={() => setFavoritesOpen(true)}
                className="relative flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-rose-500 transition-all hover:-translate-y-0.5 cursor-pointer"
                aria-label="Open favorites"
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
              {/* Sponsor button — opens modal with GitHub Sponsor card + payment methods */}
              <button
                onClick={() => setSponsorModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-medium text-xs cursor-pointer"
                aria-label="Sponsor RoyCSS"
              >
                <Heart className="size-3.5" />
                Sponsor
              </button>
              <a
                href="https://github.com/Roy-Wanyoike/roycss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-11 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5"
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
                className="md:hidden overflow-hidden"
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
                700+ CSS effects · React · Vue · Angular · Svelte
              </div>
            </ScrollReveal>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              <span className="block text-foreground">
                <TextReveal text="Beautiful CSS" />
              </span>
              <span className="block mt-1">
                <AnimatedGradientText className="font-display font-bold">
                  <TextReveal text="Effects Library" delay={0.3} />
                </AnimatedGradientText>
              </span>
            </h1>

            <ScrollReveal delay={0.3}>
              <p className="mt-2 max-w-lg mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
                Production-ready CSS effects with live demos, color customization, and
                copy-paste code. Works in any framework — no JavaScript required.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.35}>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <InstallCommand />
                <MagneticButton strength={0.3} className="inline-block">
                  <Button
                    size="lg"
                    onClick={() =>
                      scrollToSection("#effects")
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6"
                  >
                    Browse 1569+ Effects
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
      <main id="effects" tabIndex={-1} className="flex-1 py-10 sm:py-14 scroll-mt-20 focus:outline-none">
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

      {/* ─── RoyMotion Showcase ─────────────────────────────── */}
      <RoyMotionShowcase />

      <Separator className="opacity-50" />

      {/* ─── Patterns Section (UI state patterns) ─────────────── */}
      <PatternsSection />

      <Separator className="opacity-50" />

      {/* ─── Collections Section (curated themed bundles) ────── */}
      <CollectionsSection onSelectEffect={(effect) => { setSelectedEffect(effect); setDialogOpen(true); }} />

      <Separator className="opacity-50" />

      {/* ─── Platform Ecosystem (18-product vision) ─────────── */}
      <PlatformEcosystem
        onLaunchTool={(toolId) => {
          if (toolId === "ai-playground" || toolId === "css-doctor" || toolId === "utility-explorer" || toolId === "benchmark" || toolId === "genome" || toolId === "ai-migration" || toolId === "challenges" || toolId === "design-diff" || toolId === "css-minifier") {
            setPlatformTool(toolId);
          }
        }}
        onLearnMore={(_slug) => {
          setDocsOpen(true);
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
                { label: "Animate.css", content: "Use the migration table above to map animate__fadeIn → roycss-fade-in, animate__bounce → roycss-bounce-in, etc. Run scripts/migrate-colors.ts to convert hex/rgba to OKLCH." },
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
      <PlatformTools
        tool={platformTool}
        onOpenChange={setPlatformTool}
        onSelectEffect={(e) => { setSelectedEffect(e); setDialogOpen(true); }}
      />

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
        onCategoryClick={(cat) => {
          setActiveCategory(cat);
          scrollToSection("#effects");
        }}
      />

      {/* Documentation Viewer Sheet (opens from navbar "Docs" button) */}
      <DocsViewer open={docsOpen} onOpenChange={setDocsOpen} />
    </div>
  );
}