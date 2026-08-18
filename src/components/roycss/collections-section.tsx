"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  Layers,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  collections,
  searchCollections,
  getCollectionWithEffects,
  type Collection,
} from "@/lib/roycss-collections";
import { Badge } from "@/components/ui/badge";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/roycss/motion-primitives";
import { LivePreview } from "@/components/roycss/effect-card";
import type { CSSEffect } from "@/lib/roycss-types";

function CollectionCard({
  collection,
  onOpen,
}: {
  collection: Collection;
  onOpen: (c: Collection) => void;
}) {
  const { effects: colEffects } = getCollectionWithEffects(collection);

  return (
    <motion.div
      layout
      variants={staggerItem}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Accent header */}
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${collection.accent}, color-mix(in oklch, ${collection.accent} 50%, transparent))` }}
      />

      <div className="p-5">
        {/* Icon + difficulty */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="flex items-center justify-center size-12 rounded-xl text-2xl shrink-0"
            style={{
              background: `color-mix(in oklch, ${collection.accent} 15%, transparent)`,
            }}
          >
            {collection.icon}
          </div>
          <Badge
            variant="secondary"
            className={`text-xs shrink-0 ${
              collection.difficulty === "Beginner"
                ? "bg-emerald-500/10 text-emerald-500"
                : collection.difficulty === "Intermediate"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-rose-500/10 text-rose-500"
            }`}
          >
            {collection.difficulty}
          </Badge>
        </div>

        {/* Name + tagline */}
        <h3 className="font-display font-semibold text-base text-foreground leading-tight mb-1">
          {collection.name}
        </h3>
        <p className="text-xs text-primary font-medium mb-2">{collection.tagline}</p>
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
          {collection.description}
        </p>

        {/* Effect count + tags */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-primary/10 text-primary"
          >
            {collection.effectIds.length} effects
          </Badge>
          {collection.tags.slice(0, 3).map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-muted/80 text-muted-foreground"
            >
              {t}
            </Badge>
          ))}
        </div>

        {/* Mini preview of first 3 effects */}
        {colEffects.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {colEffects.slice(0, 4).map((effect) => (
              <div
                key={effect.id}
                className="flex items-center justify-center size-10 rounded-lg bg-muted/40 border border-border/50 overflow-hidden"
                title={effect.name}
              >
                <div className="scale-[0.4] origin-center">
                  <LivePreview effect={effect} />
                </div>
              </div>
            ))}
            {colEffects.length > 4 && (
              <span className="text-xs text-muted-foreground font-medium ml-1">
                +{colEffects.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Explore button */}
        <button
          onClick={() => onOpen(collection)}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer group/btn"
        >
          Explore Collection
          <ArrowRight className="size-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

function CollectionDetailDialog({
  collection,
  onClose,
  onSelectEffect,
}: {
  collection: Collection | null;
  onClose: () => void;
  onSelectEffect: (effect: CSSEffect) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { effects: colEffects } = useMemo(
    () =>
      collection
        ? getCollectionWithEffects(collection)
        : { effects: [] },
    [collection],
  );

  // ─── Focus trap + Escape handler (WCAG 2.1.2 No Keyboard Trap) ───
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!collection) return;
    // Remember the trigger so we can restore focus on close
    previousFocusRef.current = document.activeElement as HTMLElement;
    // Move focus into the dialog
    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelector<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? dialog).focus();
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      // Restore focus to the trigger button
      previousFocusRef.current?.focus?.();
    };
  }, [collection, onClose]);

  const handleCopy = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        /* clipboard not available */
      }
    },
    [],
  );

  return (
    <AnimatePresence>
      {collection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Collection: ${collection.name}`}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with accent */}
            <div
              className="h-2 w-full shrink-0"
              style={{
                background: `linear-gradient(90deg, ${collection.accent}, color-mix(in oklch, ${collection.accent} 50%, transparent))`,
              }}
            />
            <div className="flex items-start justify-between gap-4 p-5 border-b border-border/50 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="flex items-center justify-center size-12 rounded-xl text-2xl shrink-0"
                  style={{
                    background: `color-mix(in oklch, ${collection.accent} 15%, transparent)`,
                  }}
                >
                  {collection.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {collection.name}
                  </h2>
                  <p className="text-sm text-primary font-medium">
                    {collection.tagline}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                aria-label="Close collection"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Description + when to use */}
            <div className="px-5 py-4 border-b border-border/50 shrink-0 space-y-3">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {collection.description}
              </p>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  When to use
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {collection.whenToUse}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary"
                >
                  {colEffects.length} effects
                </Badge>
                {collection.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-xs bg-muted/80 text-muted-foreground"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Effects grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Effects in this collection
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colEffects.map((effect) => (
                  <div
                    key={effect.id}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-all"
                  >
                    {/* Live preview */}
                    <div className="flex items-center justify-center size-14 rounded-lg bg-muted/60 border border-border/50 overflow-hidden shrink-0">
                      <div className="scale-[0.5] origin-center">
                        <LivePreview effect={effect} />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {effect.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {effect.category} · {effect.tags.slice(0, 2).join(", ")}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(`roycss-${effect.id}`, effect.id + "-copy")}
                        className="flex items-center justify-center size-8 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                        aria-label={`Copy class name for ${effect.name}`}
                        title="Copy class name"
                      >
                        {copiedId === effect.id + "-copy" ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          onSelectEffect(effect);
                          onClose();
                        }}
                        className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                        aria-label={`View details for ${effect.name}`}
                        title="View details"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CollectionsSection({
  onSelectEffect,
}: {
  onSelectEffect: (effect: CSSEffect) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  const filtered = useMemo(
    () => searchCollections(search),
    [search],
  );

  return (
    <section id="collections" aria-label="Curated effect collections" className="py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
              <Sparkles className="size-3.5" />
              Collections
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Curated Effect Collections
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              1749 effects is a lot. Collections hand-pick the best effects for
              specific aesthetics and use cases — so you find what you need in
              seconds, not minutes.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search collections"
              placeholder="Search collections... (e.g., 'neon', 'glass', 'loader')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-11 rounded-xl glass bg-background/80 border-border/50 focus:border-primary/50 text-sm text-foreground focus:outline-none transition-all"
            />
          </div>
        </ScrollReveal>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "collection" : "collections"}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {filtered.length > 0 ? (
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                onOpen={setSelectedCollection}
              />
            ))}
          </StaggerGroup>
        ) : (
          <div className="text-center py-16">
            <Layers className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-foreground">
              No collections found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search.
            </p>
          </div>
        )}

        <ScrollReveal delay={0.2} className="mt-12 text-center">
          <button
            onClick={() =>
              document
                .querySelector("#effects")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all cursor-pointer"
          >
            Browse all 1749 effects
            <ArrowRight className="size-3.5" />
          </button>
        </ScrollReveal>
      </div>

      <CollectionDetailDialog
        collection={selectedCollection}
        onClose={() => setSelectedCollection(null)}
        onSelectEffect={onSelectEffect}
      />
    </section>
  );
}
