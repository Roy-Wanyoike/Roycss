"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Check,
  Code2,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  recipes,
  recipeCategoryMeta,
  recipeCategoryOrder,
  searchRecipes,
  type Recipe,
} from "@/lib/roycss-recipes";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

/* ═══════════════════════════════════════════════════════════════
   Recipe Card — shows recipe info + expandable HTML code
   ═══════════════════════════════════════════════════════════════ */

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recipe.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, [recipe.html]);

  const difficultyColor =
    recipe.difficulty === "beginner"
      ? "text-emerald-500 bg-emerald-500/10"
      : recipe.difficulty === "intermediate"
      ? "text-amber-500 bg-amber-500/10"
      : "text-rose-500 bg-rose-500/10";

  return (
    <motion.div
      layout
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((x) => !x);
          }
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-sm text-foreground leading-tight">
              {recipe.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${difficultyColor}`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Tags + effect count */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/10 text-primary">
            <Layers className="size-2.5 mr-0.5" />
            {recipe.effectIds.length} effects
          </Badge>
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-muted/80 text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Expand hint */}
        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
          {expanded ? "Hide code" : "View HTML"}
          <ChevronDown className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Expandable HTML code */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy HTML
                  </>
                )}
              </button>
              <pre className="p-3 overflow-x-auto text-xs leading-relaxed scrollbar-thin max-h-64 overflow-y-auto">
                <code className="font-mono text-foreground/80 whitespace-pre">
                  {recipe.html}
                </code>
              </pre>
            </div>

            {/* Effects used */}
            <div className="px-3 pb-3 pt-2 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="size-2.5" />
                RoyCSS Effects Used
              </p>
              <div className="flex flex-wrap gap-1">
                {recipe.effectIds.map((id) => (
                  <code
                    key={id}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                  >
                    .roycss-{id}
                  </code>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Recipes Section — searchable, filterable grid
   ═══════════════════════════════════════════════════════════════ */

export function RecipesSection() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredRecipes = useMemo(() => {
    return searchRecipes(search, activeCategory === "all" ? undefined : activeCategory);
  }, [search, activeCategory]);

  return (
    <section id="recipes" aria-label="Recipes" className="py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
              <Zap className="size-3.5" />
              Recipes
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Solution-Focused Patterns
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Developers search for solutions, not utilities. Each recipe combines RoyCSS effects
              into a real UI pattern — copy the HTML, import the CSS, ship.
            </p>
          </div>
        </ScrollReveal>

        {/* Search */}
        <ScrollReveal delay={0.1} className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search recipes by name, tag, or category"
              placeholder="Search recipes... (e.g., 'hero', 'loading', 'card')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-11 rounded-xl glass bg-background/80 border-border/50 focus:border-primary/50 text-sm text-foreground focus:outline-none transition-all"
            />
          </div>
        </ScrollReveal>

        {/* Category filter pills */}
        <ScrollReveal delay={0.15} className="mb-8 overflow-x-auto scrollbar-thin pb-2">
          <div className="flex items-center gap-2 min-w-max px-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer min-h-[44px] ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "glass text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Sparkles className="size-3.5" />
              All
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeCategory === "all" ? "bg-primary-foreground/20" : "bg-muted"}`}>
                {recipes.length}
              </span>
            </button>
            {recipeCategoryOrder.map((cat) => {
              const count = recipes.filter((r) => r.category === cat).length;
              if (count === 0) return null;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "glass text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {recipeCategoryMeta[cat].label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? "bg-primary-foreground/20" : "bg-muted"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{filteredRecipes.length}</span>{" "}
            {filteredRecipes.length === 1 ? "recipe" : "recipes"}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Recipe grid */}
        {filteredRecipes.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Code2 className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-foreground">
              No recipes found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search term or category.
            </p>
          </div>
        )}

        {/* CTA */}
        <ScrollReveal delay={0.2} className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to build your own recipe? Combine any of the 1569+ effects.
          </p>
          <button
            onClick={() => document.querySelector("#effects")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all cursor-pointer"
          >
            Browse all effects
            <ArrowRight className="size-3.5" />
          </button>
        </ScrollReveal>
      </div>
    </section>
  );
}
