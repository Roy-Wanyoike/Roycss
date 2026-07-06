"use client";

import { useEffect, useState } from "react";
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
  Layers,
  Play,
  Type,
  Loader2,
  Box,
  MousePointer,
  MousePointerClick,
  Square,
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
} from "@/lib/roycss-effects";
import { EffectCard } from "@/components/roycss/effect-card";
import { motion } from "framer-motion";

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
};

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

/* ─── Stats Bar ─────────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { label: "Effects", value: effects.length, icon: Sparkles },
    { label: "Categories", value: categoryOrder.length, icon: BookOpen },
    { label: "Lines of CSS", value: "~2,500+", icon: Zap },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-center">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <Icon className="size-4 text-primary" />
            <span className="font-display font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
          </div>
        );
      })}
    </div>
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
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function RoyCSSPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<EffectCategory | "all">("all");

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] size-[40rem] rounded-full bg-primary/15 blur-3xl animate-blob" />
          <div className="absolute top-[20%] right-[-10%] size-[35rem] rounded-full bg-emerald-500/8 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-15%] left-[30%] size-[30rem] rounded-full bg-teal-500/8 blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          {/* Nav bar */}
          <nav className="flex items-center justify-between mb-16 sm:mb-20">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="size-4.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Roy<span className="text-primary">CSS</span>
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-semibold">
                v1.0
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="https://github.com/Roy-Wanyoike"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-9 rounded-xl glass text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5"
                aria-label="GitHub"
              >
                <Github className="size-4" />
              </a>
            </div>
          </nav>

          {/* Hero content */}
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs sm:text-sm font-medium text-primary mb-6"
            >
              <Package className="size-3.5" />
              A CSS effect library by Roy Wanyoike
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
            >
              <span className="block text-foreground">Beautiful CSS</span>
              <span className="block text-gradient mt-1">Effects Library</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              A curated collection of production-ready CSS effects with live demonstrations
              and copy-paste code. Animations, hover effects, text effects, and more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <InstallCommand />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10"
            >
              <StatsBar />
            </motion.div>
          </div>
        </div>
      </section>

      <Separator className="opacity-50" />

      {/* ─── Effects Section ────────────────────────────────── */}
      <section id="effects" className="flex-1 py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
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
          </div>

          {/* Category pills */}
          <div className="mb-8 overflow-x-auto scrollbar-thin pb-2">
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
          </div>

          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
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
          </div>

          {/* Effects Grid */}
          {filteredEffects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredEffects.map((effect, i) => (
                <EffectCard key={effect.id} effect={effect} index={i} />
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

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="size-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-sm text-foreground">
                Roy<span className="text-primary">CSS</span>
              </span>
            </div>

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
    </div>
  );
}