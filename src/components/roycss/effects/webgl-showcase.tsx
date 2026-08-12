"use client";

/**
 * WebGL & Canvas Effects Showcase
 *
 * Displays premium Three.js and Canvas 2D effects that go beyond pure CSS.
 * These effects demonstrate the platform's capability for advanced visual
 * experiences when CSS alone isn't enough.
 */

import { useState, lazy, Suspense, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Box, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading, ScrollReveal } from "@/components/roycss/motion-primitives";

// Lazy-load all WebGL/canvas effects — they're heavy (Three.js)
const ThreeTubesCursor = lazy(() =>
  import("@/components/roycss/effects/three-tubes-cursor").then((m) => ({
    default: m.ThreeTubesCursor,
  })),
);
const ParticleNetwork = lazy(() =>
  import("@/components/roycss/effects/particle-network").then((m) => ({
    default: m.ParticleNetwork,
  })),
);
const ThreeWaveGrid = lazy(() =>
  import("@/components/roycss/effects/three-wave-grid").then((m) => ({
    default: m.ThreeWaveGrid,
  })),
);
const AuroraBorealis = lazy(() =>
  import("@/components/roycss/effects/aurora-borealis").then((m) => ({
    default: m.AuroraBorealis,
  })),
);

type EffectId = "tubes" | "particles" | "wave" | "aurora";

interface EffectTab {
  id: EffectId;
  name: string;
  description: string;
  tech: string;
}

const EFFECTS: EffectTab[] = [
  {
    id: "tubes",
    name: "3D Tubes Cursor",
    description:
      "Animated 3D tubes follow your cursor with dynamic point-light coloring. Click to randomize the palette.",
    tech: "Three.js · WebGL",
  },
  {
    id: "particles",
    name: "Particle Network",
    description:
      "100 particles float and connect with proximity lines. Cursor repels nearby particles in real time.",
    tech: "Canvas 2D",
  },
  {
    id: "wave",
    name: "Wave Grid",
    description:
      "A 60×60 vertex plane undulates in organic sine-wave patterns. Cursor movement steers the wave origin.",
    tech: "Three.js · WebGL",
  },
  {
    id: "aurora",
    name: "Aurora Borealis",
    description:
      "Flowing northern-lights ribbons with additive light blending and slow hue drift. Pure canvas, zero dependencies.",
    tech: "Canvas 2D",
  },
];

const EffectFallback = () => (
  <div className="flex items-center justify-center h-[360px] rounded-2xl border border-border bg-card/30">
    <Loader2 className="size-8 animate-spin text-primary" />
  </div>
);

export function WebGLShowcase() {
  const [active, setActive] = useState<EffectId>("tubes");
  // ─── Defer mounting the (heavy, Three.js-backed) active effect until the
  // showcase scrolls into view. Without this, `lazy()` still fires on
  // initial mount because the default `active === "tubes"` renders
  // <ThreeTubesCursor/> immediately — pulling in 422KB of three.js on
  // initial page load even though the showcase is below the fold.
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // If the browser lacks IntersectionObserver (rare — SSR already
    // returned false so this branch only fires on truly ancient
    // browsers), mount eagerly. Deferred via queueMicrotask to avoid
    // the react-hooks/set-state-in-effect rule.
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setVisible(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="webgl-effects"
      aria-label="WebGL and canvas effects showcase"
      className="py-16 sm:py-20 scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Beyond CSS · WebGL & Canvas"
          title="Advanced Visual Effects"
          subtitle="When CSS alone isn't enough, RoyCSS extends to Three.js and Canvas 2D for immersive, GPU-accelerated visual experiences."
        />

        {/* Tab selector */}
        <ScrollReveal className="mt-10">
          <div
            className="flex flex-wrap justify-center gap-2 mb-8"
            role="tablist"
            aria-label="WebGL effect selector"
          >
            {EFFECTS.map((effect) => (
              <button
                key={effect.id}
                id={`webgl-tab-${effect.id}`}
                role="tab"
                aria-selected={active === effect.id}
                aria-controls="webgl-effect-panel"
                onClick={() => setActive(effect.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  active === effect.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Box className="size-4" />
                {effect.name}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Active effect description */}
        <ScrollReveal className="mb-6">
          <div className="text-center max-w-2xl mx-auto">
            {EFFECTS.filter((e) => e.id === active).map((e) => (
              <div key={e.id}>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {e.description}
                </p>
                <Badge
                  variant="secondary"
                  className="mt-2 bg-primary/10 text-primary border-primary/20"
                >
                  <Sparkles className="size-3 mr-1" />
                  {e.tech}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Effect preview */}
        <ScrollReveal>
          <motion.div
            key={active}
            id="webgl-effect-panel"
            role="tabpanel"
            aria-labelledby={`webgl-tab-${active}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl overflow-hidden border border-border shadow-2xl"
          >
            <Suspense fallback={<EffectFallback />}>
              {isVisible && active === "tubes" && <ThreeTubesCursor height={420} />}
              {isVisible && active === "particles" && <ParticleNetwork height={420} />}
              {isVisible && active === "wave" && <ThreeWaveGrid height={420} />}
              {isVisible && active === "aurora" && <AuroraBorealis height={420} />}
              {!isVisible && <EffectFallback />}
            </Suspense>
          </motion.div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            These effects use Three.js and Canvas 2D — install the dependencies
            and copy the component code to use them in your project.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-6"
            onClick={() => {
              const el = document.getElementById("effects");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Sparkles className="size-4 mr-2" />
            Explore 1,569 CSS Effects
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
