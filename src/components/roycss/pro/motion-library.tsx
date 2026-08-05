"use client";

/**
 * MotionLibrary — RoyMotion showcase of 12 reusable animation primitives.
 *
 * Self-contained (no props). Each primitive lives in a card containing:
 *   • A live demo area demonstrating the effect on a colored box / text.
 *   • Name + description + category badge.
 *   • A "Replay" button that re-triggers entrance animations by bumping a
 *     `playKey` prop. Wrappers use `<AnimatePresence mode="wait">` keyed on
 *     `playKey` so the old element exits before the new one enters.
 *   • A `<pre><code>` snippet with a Copy button (clipboard + 2s ✓ feedback).
 *
 * Top toolbar:
 *   • Category filter — All / Entrance / Interactive / Loop / Scroll.
 *   • Global Speed slider — 0.5×–2×, multiplies every animation's duration
 *     (and adjusts spring stiffness for interactive demos so they feel
 *     snappier at higher speeds).
 *
 * Built on framer-motion `motion`, `AnimatePresence`, `useInView`,
 * `useMotionValue`, `useSpring`, `useTransform`. All pointer tracking is done
 * via element-level React `onMouseMove` handlers (no global `window`
 * listeners), so cleanup is automatic when the element unmounts.
 * TS strict, zero `any`.
 */

import * as React from "react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Check,
  Copy,
  Eye,
  Gauge,
  LayoutGrid,
  MousePointerClick,
  Repeat,
  RotateCcw,
  Sparkles,
} from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category = "entrance" | "interactive" | "loop" | "scroll";
type Filter = "all" | Category;

interface Primitive {
  id: string;
  name: string;
  description: string;
  category: Category;
  code: string;
}

interface DemoProps {
  /** 0.5× – 2×. Multiplies durations and spring stiffness. */
  speed: number;
  /** Bumped on "Replay" click → forces re-mount of entrance demos. */
  playKey: number;
}

// ═══════════════════════════════════════════════════════════════════════
// Category metadata
// ═══════════════════════════════════════════════════════════════════════

interface CategoryMeta {
  label: string;
  icon: typeof Sparkles;
  badgeClass: string;
}

const CATEGORY_META: Record<Category, CategoryMeta> = {
  entrance: {
    label: "Entrance",
    icon: Sparkles,
    badgeClass:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  interactive: {
    label: "Interactive",
    icon: MousePointerClick,
    badgeClass:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  },
  loop: {
    label: "Loop",
    icon: Repeat,
    badgeClass:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
  },
  scroll: {
    label: "Scroll",
    icon: Eye,
    badgeClass:
      "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Primitives catalogue (metadata + code snippet)
// ═══════════════════════════════════════════════════════════════════════

const PRIMITIVES: readonly Primitive[] = [
  {
    id: "fade-in",
    name: "FadeIn",
    description: "Opacity 0 → 1 on mount. The simplest, cleanest entrance.",
    category: "entrance",
    code: `import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
/>`,
  },
  {
    id: "slide-up",
    name: "SlideUp",
    description: "Slide up 20px while fading in. Standard content reveal.",
    category: "entrance",
    code: `import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
/>`,
  },
  {
    id: "scale-in",
    name: "ScaleIn",
    description: "Pop in from scale 0.8 with overshoot. Great for modals & toasts.",
    category: "entrance",
    code: `import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
/>`,
  },
  {
    id: "stagger",
    name: "Stagger",
    description: "Children reveal one-by-one via `staggerChildren`.",
    category: "entrance",
    code: `import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="visible">
  {items.map((it) => (
    <motion.li key={it} variants={item} />
  ))}
</motion.ul>`,
  },
  {
    id: "hover-lift",
    name: "Hover lift",
    description: "Lift up 4px with an elevated shadow on hover.",
    category: "interactive",
    code: `import { motion } from "framer-motion";

<motion.div
  whileHover={{ y: -4, boxShadow: "0 12px 24px oklch(0 0 0 / 0.12)" }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>`,
  },
  {
    id: "press-scale",
    name: "Press scale",
    description: "Scale to 0.95 on tap. Tactile feedback for buttons.",
    category: "interactive",
    code: `import { motion } from "framer-motion";

<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
/>`,
  },
  {
    id: "magnetic",
    name: "Magnetic",
    description: "Element drifts toward the cursor on hover (spring-smoothed).",
    category: "interactive",
    code: `import { motion, useMotionValue, useSpring } from "framer-motion";

const x = useMotionValue(0);
const y = useMotionValue(0);
const sx = useSpring(x, { stiffness: 200, damping: 15 });
const sy = useSpring(y, { stiffness: 200, damping: 15 });

<motion.div
  style={{ x: sx, y: sy }}
  onMouseMove={(e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.4);
    y.set((e.clientY - r.top - r.height / 2) * 0.4);
  }}
  onMouseLeave={() => { x.set(0); y.set(0); }}
/>`,
  },
  {
    id: "tilt-3d",
    name: "Tilt 3D",
    description: "Card rotates in 3D space tracking the cursor, with a glare overlay.",
    category: "interactive",
    code: `import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const rx = useMotionValue(0);
const ry = useMotionValue(0);
const srx = useSpring(rx, { stiffness: 200, damping: 20 });
const sry = useSpring(ry, { stiffness: 200, damping: 20 });
const glare = useTransform(
  [srx, sry],
  ([x, y]) =>
    \`radial-gradient(circle at \${50 + y * 3}% \${50 - x * 3}%, rgba(255,255,255,0.35), transparent 60%)\`,
);

<motion.div
  onMouseMove={(e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 24);
    rx.set(-py * 24);
  }}
  onMouseLeave={() => { rx.set(0); ry.set(0); }}
  style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000, transformStyle: "preserve-3d" }}
/>`,
  },
  {
    id: "reveal-scroll",
    name: "Reveal on scroll",
    description: "Animate when the element enters the viewport (whileInView / useInView).",
    category: "scroll",
    code: `import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ref = useRef<HTMLDivElement>(null);
const inView = useInView(ref, { once: false, margin: "-80px" });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 40 }}
  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
/>`,
  },
  {
    id: "shimmer",
    name: "Shimmer",
    description: "Gradient sweep — the classic skeleton-loading shimmer.",
    category: "loop",
    code: `import { motion } from "framer-motion";

<motion.div
  style={{
    background: "linear-gradient(90deg, transparent, oklch(0 0 0 / 0.10), transparent)",
    backgroundSize: "200% 100%",
  }}
  animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
/>`,
  },
  {
    id: "float",
    name: "Float",
    description: "Gentle infinite up/down drift. Perfect for hero graphics.",
    category: "loop",
    code: `import { motion } from "framer-motion";

<motion.div
  animate={{ y: [0, -10, 0] }}
  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
/>`,
  },
  {
    id: "pulse-glow",
    name: "Pulse glow",
    description: "Box-shadow pulses outward forever — notification beacon.",
    category: "loop",
    code: `import { motion } from "framer-motion";

<motion.div
  animate={{
    boxShadow: [
      "0 0 0 0 oklch(0.55 0.13 165 / 0.5)",
      "0 0 0 14px oklch(0.55 0.13 165 / 0)",
      "0 0 0 0 oklch(0.55 0.13 165 / 0)",
    ],
  }}
  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
/>`,
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Shared demo constants
// ═══════════════════════════════════════════════════════════════════════

const DEMO_BOX =
  "flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm select-none";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

const STAGGER_ITEMS = ["A", "B", "C", "D", "E"] as const;

// ═══════════════════════════════════════════════════════════════════════
// 1. FadeIn
// ═══════════════════════════════════════════════════════════════════════

function FadeInDemo({ speed, playKey }: DemoProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={playKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 / speed, ease: "easeOut" }}
        className={DEMO_BOX}
      >
        Fade
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 2. SlideUp
// ═══════════════════════════════════════════════════════════════════════

function SlideUpDemo({ speed, playKey }: DemoProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={playKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 / speed, ease: EASE_OUT_EXPO }}
        className={DEMO_BOX}
      >
        Slide
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 3. ScaleIn
// ═══════════════════════════════════════════════════════════════════════

function ScaleInDemo({ speed, playKey }: DemoProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={playKey}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4 / speed, ease: EASE_BACK }}
        className={DEMO_BOX}
      >
        Scale
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 4. Stagger
// ═══════════════════════════════════════════════════════════════════════

function StaggerDemo({ speed, playKey }: DemoProps) {
  const container = useMemo<Variants>(
    () => ({
      hidden: {},
      visible: { transition: { staggerChildren: 0.1 / speed } },
    }),
    [speed],
  );

  const item = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 / speed, ease: EASE_OUT_EXPO },
      },
      exit: { opacity: 0, y: -16 },
    }),
    [speed],
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={playKey}
        variants={container}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="flex items-center gap-2"
      >
        {STAGGER_ITEMS.map((letter) => (
          <motion.div
            key={letter}
            variants={item}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            {letter}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 5. Hover lift
// ═══════════════════════════════════════════════════════════════════════

function HoverLiftDemo({ speed }: DemoProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 24px oklch(0 0 0 / 0.18)" }}
      transition={{ type: "spring", stiffness: 300 * speed, damping: 20 }}
      className="flex h-16 w-32 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm"
    >
      Hover me
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 6. Press scale
// ═══════════════════════════════════════════════════════════════════════

function PressScaleDemo({ speed }: DemoProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400 * speed, damping: 17 }}
      className="flex h-16 w-32 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground text-sm font-medium shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      Tap me
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 7. Magnetic
// ═══════════════════════════════════════════════════════════════════════

function MagneticDemo({ speed }: DemoProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const stiffness = Math.max(50, 200 * speed);
  const sx = useSpring(x, { stiffness, damping: 15 });
  const sy = useSpring(y, { stiffness, damping: 15 });

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * 0.4);
      y.set((e.clientY - rect.top - rect.height / 2) * 0.4);
    },
    [x, y],
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <div
      className="flex h-24 w-48 items-center justify-center rounded-lg border border-dashed border-border"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div
        style={{ x: sx, y: sy }}
        className="flex h-12 w-24 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-sm"
      >
        Hover
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 8. Tilt 3D
// ═══════════════════════════════════════════════════════════════════════

function Tilt3DDemo({ speed }: DemoProps) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const stiffness = Math.max(50, 200 * speed);
  const srx = useSpring(rx, { stiffness, damping: 20 });
  const sry = useSpring(ry, { stiffness, damping: 20 });

  // Derive a glare highlight from the tilt values — moves opposite the tilt.
  const glare = useTransform(
    [srx, sry] as const,
    ([tiltX, tiltY]: number[]) =>
      `radial-gradient(circle at ${50 + tiltY * 3}% ${50 - tiltX * 3}%, oklch(0.99 0.005 165 / 0.35), transparent 60%)`,
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      ry.set(px * 24);
      rx.set(-py * 24);
    },
    [rx, ry],
  );

  const handleLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className="relative flex h-24 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md"
    >
      <span className="relative z-10 text-sm font-medium">Tilt me</span>
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glare }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 9. Reveal on scroll
// ═══════════════════════════════════════════════════════════════════════

function RevealScrollDemo({ speed, playKey }: DemoProps) {
  const ref = useRef<HTMLDivElement>(null);
  // `playKey` is in deps so re-mounting (replay) re-creates the observer.
  const inView = useInView(ref, {
    once: false,
    margin: "-40px",
    amount: 0.4,
  });

  // Keep eslint/react-hooks happy — `playKey` doesn't drive useInView but
  // the parent remounts the whole subtree on replay via the wrapper below.
  void playKey;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6 / speed, ease: EASE_OUT_EXPO }}
      className="flex h-16 w-40 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm"
    >
      {inView ? "In view" : "Out of view"}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 10. Shimmer
// ═══════════════════════════════════════════════════════════════════════

function ShimmerDemo({ speed }: DemoProps) {
  return (
    <div className="relative h-16 w-full max-w-xs overflow-hidden rounded-xl bg-muted">
      {/* Skeleton lines */}
      <div className="absolute inset-0 flex flex-col justify-center gap-2 px-3">
        <div className="h-3 w-3/4 rounded-full bg-border/60" />
        <div className="h-3 w-1/2 rounded-full bg-border/60" />
      </div>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0 0 0 / 0.10), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{
          duration: 1.6 / speed,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 11. Float
// ═══════════════════════════════════════════════════════════════════════

function FloatDemo({ speed }: DemoProps) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 2.4 / speed,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={DEMO_BOX}
    >
      Float
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 12. Pulse glow
// ═══════════════════════════════════════════════════════════════════════

function PulseGlowDemo({ speed }: DemoProps) {
  return (
    <div className="flex items-center gap-4">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 0 0 oklch(0.55 0.13 165 / 0.5)",
            "0 0 0 14px oklch(0.55 0.13 165 / 0)",
            "0 0 0 0 oklch(0.55 0.13 165 / 0)",
          ],
        }}
        transition={{
          duration: 1.6 / speed,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="h-12 w-12 rounded-full bg-primary"
      />
      <span className="text-sm text-muted-foreground">Live</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Demo dispatcher
// ═══════════════════════════════════════════════════════════════════════

function DemoRenderer({
  id,
  speed,
  playKey,
}: { id: string } & DemoProps): ReactNode {
  switch (id) {
    case "fade-in":
      return <FadeInDemo speed={speed} playKey={playKey} />;
    case "slide-up":
      return <SlideUpDemo speed={speed} playKey={playKey} />;
    case "scale-in":
      return <ScaleInDemo speed={speed} playKey={playKey} />;
    case "stagger":
      return <StaggerDemo speed={speed} playKey={playKey} />;
    case "hover-lift":
      return <HoverLiftDemo speed={speed} playKey={playKey} />;
    case "press-scale":
      return <PressScaleDemo speed={speed} playKey={playKey} />;
    case "magnetic":
      return <MagneticDemo speed={speed} playKey={playKey} />;
    case "tilt-3d":
      return <Tilt3DDemo speed={speed} playKey={playKey} />;
    case "reveal-scroll":
      return <RevealScrollDemo speed={speed} playKey={playKey} />;
    case "shimmer":
      return <ShimmerDemo speed={speed} playKey={playKey} />;
    case "float":
      return <FloatDemo speed={speed} playKey={playKey} />;
    case "pulse-glow":
      return <PulseGlowDemo speed={speed} playKey={playKey} />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Copy button (in-code-block, top-right)
// ═══════════════════════════════════════════════════════════════════════

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently noop */
    }
  }, [code]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="absolute right-2 top-2 size-7"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Primitive card
// ═══════════════════════════════════════════════════════════════════════

function PrimitiveCard({
  primitive,
  speed,
}: {
  primitive: Primitive;
  speed: number;
}) {
  const [playKey, setPlayKey] = useState(0);

  const handleReplay = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  const meta = CATEGORY_META[primitive.category];
  const Icon = meta.icon;

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="gap-2 border-b pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <CardTitle className="text-base">{primitive.name}</CardTitle>
        </div>
        <CardDescription className="text-xs leading-relaxed">
          {primitive.description}
        </CardDescription>
        <CardAction>
          <Badge
            variant="outline"
            className={cn("gap-1 text-[10px]", meta.badgeClass)}
          >
            {meta.label}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4 px-4 py-4">
        {/* Live demo area */}
        <div
          className="flex min-h-32 items-center justify-center rounded-lg border bg-muted/30 p-4"
          aria-label={`${primitive.name} demo`}
        >
          {/* Wrapper remounts on playKey bump so all child animations restart. */}
          <div key={playKey}>
            <DemoRenderer
              id={primitive.id}
              speed={speed}
              playKey={playKey}
            />
          </div>
        </div>

        {/* Code snippet */}
        <div className="relative">
          <pre className="max-h-44 overflow-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed">
            <code className="font-mono text-foreground/90">
              {primitive.code}
            </code>
          </pre>
          <CopyButton code={primitive.code} />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">
            #{primitive.id}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReplay}
          >
            <RotateCcw className="size-3.5" />
            Replay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Toolbar (category filter + speed slider)
// ═══════════════════════════════════════════════════════════════════════

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "entrance", label: "Entrance" },
  { id: "interactive", label: "Interactive" },
  { id: "loop", label: "Loop" },
  { id: "scroll", label: "Scroll" },
] as const;

function Toolbar({
  activeFilter,
  onFilterChange,
  speed,
  onSpeedChange,
  visibleCount,
  totalCount,
}: {
  activeFilter: Filter;
  onFilterChange: (f: Filter) => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <LayoutGrid className="size-3.5" />
          Category
        </span>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={activeFilter === f.id ? "default" : "outline"}
              onClick={() => onFilterChange(f.id)}
              className="h-7 px-2.5 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <span className="ml-1 text-[10px] text-muted-foreground">
          {visibleCount} / {totalCount}
        </span>
      </div>

      {/* Speed slider */}
      <div className="flex items-center gap-3 lg:min-w-64">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Gauge className="size-3.5" />
          Speed
        </span>
        <Slider
          value={[speed]}
          min={0.5}
          max={2}
          step={0.1}
          onValueChange={(v) => onSpeedChange(v[0] ?? 1)}
          className="flex-1"
          aria-label="Animation speed"
        />
        <span className="w-10 text-right font-mono text-xs text-foreground">
          {speed.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════

export function MotionLibrary() {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [speed, setSpeed] = useState(1);

  const visiblePrimitives = useMemo(() => {
    if (activeFilter === "all") return PRIMITIVES;
    return PRIMITIVES.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            RoyMotion Library
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          12 reusable framer-motion animation primitives — entrance, interactive,
          loop, and scroll. Adjust the global speed and replay any effect to see
          it run again.
        </p>
      </header>

      {/* Toolbar */}
      <Toolbar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        speed={speed}
        onSpeedChange={setSpeed}
        visibleCount={visiblePrimitives.length}
        totalCount={PRIMITIVES.length}
      />

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visiblePrimitives.map((p) => (
          <PrimitiveCard key={p.id} primitive={p} speed={speed} />
        ))}
      </div>

      {/* Empty state (unreachable — All always has items) */}
      {visiblePrimitives.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No primitives in this category.
        </div>
      ) : null}
    </div>
  );
}
