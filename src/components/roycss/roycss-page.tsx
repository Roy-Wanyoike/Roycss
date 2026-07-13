"use client";

import { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  ChevronRight,
  Layers,
  Play,
  Type,
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
  Navigation,
  Sparkle,
  FormInput,
  ScrollText,
  MousePointer2,
  ArrowLeftRight,
  GlassWater,
  ToggleRight,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  effects,
  categoryMeta,
  categoryOrder,
  type EffectCategory,
  type CSSEffect,
} from "@/lib/roycss-effects";
import { EffectCard } from "@/components/roycss/effect-card";
import { EffectDetailDialog } from "@/components/roycss/effect-detail-dialog";
import { FavoritesSheet } from "@/components/roycss/favorites-sheet";
import { ScrollToTop } from "@/components/roycss/scroll-to-top";
import { SectionScrollbar } from "@/components/roycss/section-scrollbar";
import { RoyCSSLogo, RoyCSSHeroLogo } from "@/components/roycss/roycss-logo";
import { useFavorites } from "@/hooks/use-favorites";
import { motion, useScroll, useSpring } from "framer-motion";
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
      className="flex items-center justify-center size-9 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5 cursor-pointer"
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
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
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
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npm install roycss");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        className="inline-flex items-center gap-2 rounded-xl glass-strong px-4 py-2.5 group cursor-pointer hover:border-primary/30 transition-all"
        onClick={handleCopy}
      >
        <span className="text-sm font-mono text-muted-foreground">$</span>
        <code className="text-sm font-mono text-foreground">npm install roycss</code>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors ml-2 cursor-pointer"
          aria-label="Copy install command"
        >
          {copied ? (
            <span className="text-xs text-emerald-500 font-medium">Copied!</span>
          ) : (
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
            </svg>
          )}
        </button>
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

/* ─── Featured Showcase Card ────────────────────────────────── */
function FeaturedShowcase() {
  const featuredEffects = effects.filter((e) =>
    ["text-gradient", "card-glassmorphism", "bg-aurora", "btn-shine-sweep"].includes(e.id)
  );

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid opacity-20 roycss-fade-mask-b" />
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Hand-picked highlights"
          title="Featured Effects"
          subtitle="A curated selection of our most-loved effects, showcased in larger interactive demos."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {featuredEffects.map((effect, i) => (
            <ScrollReveal key={effect.id} delay={i * 0.1}>
              <TiltCard
                maxTilt={8}
                className="rounded-3xl border border-border bg-card overflow-hidden h-full hover:border-primary/40 transition-colors"
              >
                <div className="grid sm:grid-cols-2">
                  {/* Preview */}
                  <div className="relative h-56 sm:h-full min-h-[14rem] bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center p-6">
                    <FeaturedPreview id={effect.id} name={effect.name} />
                  </div>
                  {/* Info */}
                  <div className="p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        <Star className="size-2.5 mr-1 fill-primary" />
                        Featured
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {categoryMeta[effect.category].label}
                      </Badge>
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {effect.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                      {effect.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {effect.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-muted/80 text-muted-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        document.querySelector("#effects")?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all cursor-pointer w-fit"
                    >
                      View all effects
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured Preview (larger, more dramatic) ──────────────── */
function FeaturedPreview({ id, name }: { id: string; name: string }) {
  if (id === "text-gradient") {
    return (
      <div className="text-center">
        <div className="roycss-animated-gradient-text font-display text-4xl sm:text-5xl font-bold">
          RoyCSS
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Animated gradient text</p>
      </div>
    );
  }
  if (id === "card-glassmorphism") {
    return (
      <div className="roycss-card-glass p-6 w-full max-w-xs">
        <div className="size-10 rounded-xl bg-primary/30 mb-3" />
        <div className="h-3 w-3/4 rounded-full bg-foreground/20 mb-2" />
        <div className="h-3 w-1/2 rounded-full bg-foreground/10" />
        <p className="mt-3 text-xs text-muted-foreground">{name}</p>
      </div>
    );
  }
  if (id === "bg-aurora") {
    return (
      <div className="roycss-bg-aurora w-full h-full rounded-2xl flex items-center justify-center min-h-[12rem]">
        <span className="font-display font-bold text-2xl text-white/90 relative z-10">Aurora</span>
      </div>
    );
  }
  if (id === "btn-shine-sweep") {
    return (
      <div className="flex flex-col items-center gap-3">
        <button className="roycss-btn-shine bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium shadow-lg shadow-primary/20">
          Shine Sweep
        </button>
        <p className="text-xs text-muted-foreground">Hover the button</p>
      </div>
    );
  }
  return null;
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
  const { isFavorite, toggleFavorite, clearAll, count } = useFavorites();

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
      {/* Cursor glow follower (desktop only) */}
      <CursorGlow />

      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Parallax offset={60} className="absolute top-[-10%] left-[-5%] size-[40rem] rounded-full bg-primary/15 blur-3xl animate-blob" />
          <Parallax offset={40} className="absolute top-[20%] right-[-10%] size-[35rem] rounded-full bg-emerald-500/8 blur-3xl animate-blob animation-delay-2000" />
          <Parallax offset={80} className="absolute bottom-[-15%] left-[30%] size-[30rem] rounded-full bg-teal-500/8 blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          {/* Nav bar */}
          <nav className="flex items-center justify-between mb-16 sm:mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2.5"
            >
              <RoyCSSLogo size="md" animated={true} />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-semibold">
                v1.0
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <ThemeToggle />
              <button
                onClick={() => setFavoritesOpen(true)}
                className="relative flex items-center justify-center size-9 rounded-xl glass text-muted-foreground hover:text-rose-500 transition-all hover:-translate-y-0.5 cursor-pointer"
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
              <a
                href="https://github.com/Roy-Wanyoike"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-9 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5"
                aria-label="GitHub"
              >
                <Github className="size-4" />
              </a>
            </motion.div>
          </nav>

          {/* Hero content */}
          <div className="text-center max-w-3xl mx-auto">
            {/* Hero Logo */}
            <ScrollReveal y={20}>
              <div className="flex justify-center mb-8">
                <RoyCSSHeroLogo />
              </div>
            </ScrollReveal>

            <ScrollReveal y={16} delay={0.2}>
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs sm:text-sm font-medium text-primary mb-6">
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="size-1.5 rounded-full bg-primary"
                />
                <Package className="size-3.5" />
                A CSS effect library by Roy Wanyoike
              </div>
            </ScrollReveal>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
              <span className="block text-foreground">
                <TextReveal text="Beautiful CSS" />
              </span>
              <span className="block mt-1">
                <AnimatedGradientText className="font-display font-bold">
                  <TextReveal text="Effects Library" delay={0.3} />
                </AnimatedGradientText>
              </span>
            </h1>

            <ScrollReveal delay={0.5}>
              <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
                A curated collection of production-ready CSS effects with live demonstrations
                and copy-paste code. Animations, hover effects, text effects, and more.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.6}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <InstallCommand />
                <MagneticButton strength={0.3} className="inline-block">
                  <Button
                    size="lg"
                    onClick={() =>
                      document.querySelector("#effects")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6"
                  >
                    Explore Effects
                    <ChevronDown className="size-4 ml-1" />
                  </Button>
                </MagneticButton>
              </div>
            </ScrollReveal>

            {/* Animated stats counters */}
            <ScrollReveal delay={0.7}>
              <div className="mt-10 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                <StatCounter icon={Sparkles} value={effects.length} label="Effects" />
                <StatCounter icon={BookOpen} value={categoryOrder.length} label="Categories" />
                <StatCounter icon={Zap} value={22000} label="Lines of CSS" suffix="+" prefix="~" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

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

      {/* ─── Featured Showcase ──────────────────────────────── */}
      <FeaturedShowcase />

      <Separator className="opacity-50" />

      {/* ─── Effects Section ────────────────────────────────── */}
      <section id="effects" className="flex-1 py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search effects, tags, or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl glass bg-background/80 border-border/50 focus:border-primary/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </ScrollReveal>

          {/* Category pills */}
          <ScrollReveal delay={0.1} className="mb-8 overflow-x-auto scrollbar-thin pb-2">
            <div className="flex items-center gap-2 min-w-max px-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
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

          {/* Effects Grid with stagger reveal */}
          {filteredEffects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredEffects.map((effect) => (
                <EffectCard
                  key={effect.id}
                  effect={effect}
                  index={0}
                  isFavorite={isFavorite(effect.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={(e) => {
                    setSelectedEffect(e);
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>
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
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <ShineBorder className="max-w-4xl mx-auto rounded-3xl bg-card overflow-hidden">
              <div className="p-8 sm:p-12 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4"
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
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <MagneticButton strength={0.25} className="inline-block">
                      <Button
                        size="lg"
                        onClick={() =>
                          document.querySelector("#effects")?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6"
                      >
                        <Code2 className="size-4" />
                        Browse all {effects.length} effects
                      </Button>
                    </MagneticButton>
                    <a
                      href="https://github.com/Roy-Wanyoike"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-xl glass text-foreground hover:border-primary/30 transition-all font-medium text-sm"
                    >
                      <Github className="size-4" />
                      Star on GitHub
                      <ChevronRight className="size-3.5" />
                    </a>
                  </div>
                </ScrollReveal>
              </div>
            </ShineBorder>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <RoyCSSLogo size="sm" animated={false} />

            <p className="text-xs text-muted-foreground text-center">
              Crafted with care by{" "}
              <a
                href="https://github.com/Roy-Wanyoike"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Royford Wanyoike Wamaitha
              </a>
              {" "}&middot;{" "}
              Production-ready CSS effects with live demos
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Roy-Wanyoike"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
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

      {/* Section Scrollbar (desktop only) */}
      <SectionScrollbar
        activeCategory={activeCategory}
        onCategoryClick={(cat) => {
          setActiveCategory(cat);
          document.querySelector("#effects")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </div>
  );
}