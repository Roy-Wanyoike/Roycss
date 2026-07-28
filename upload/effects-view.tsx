"use client";

/* ════════════════════════════════════════════════════════════════
   EFFECTS VIEW — Lazy-loaded chunk
   All effects data, gallery, playground, collection, and modals.
   Extracted from page.tsx to reduce initial SSR bundle.
   ════════════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useRef, useEffect, startTransition } from "react";
import { categories, effects, categoryCounts, stats, type FerrumEffectIndex } from "@/lib/ferrum-effects-index";

const effectsIndex: FerrumEffectIndex[] = effects;

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles, Eye, Type, ImageIcon, Box,
  Loader2, Zap, Search, Copy,
  Code, RotateCcw, Download, ChevronDown, Terminal,
  FileCode, Package, Globe, Check, Plus, X, Trash2, Play,
  Heart, ArrowRight, Menu, GitBranch, Layers,
  LogIn, LogOut, MousePointer, Move3D, Crown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Reveal } from "@/components/ferrum/scroll-reveal";

/* ════════════════════════════════════════════════════════════════
   HEART BUTTON — Animated heart with scale pop on save
   ════════════════════════════════════════════════════════════════ */
function HeartButton({ effectClassName, isInCollection, onToggle, compact }: {
  effectClassName: string; isInCollection: (cn: string) => boolean; onToggle: (cn: string) => void; compact?: boolean;
}) {
  const [animating, setAnimating] = useState(false);
  const wasSaved = useRef(isInCollection(effectClassName));

  const handleClick = () => {
    const willBeSaved = !isInCollection(effectClassName);
    onToggle(effectClassName);
    if (willBeSaved) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 350);
    }
    wasSaved.current = willBeSaved;
  };

  const saved = isInCollection(effectClassName);

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded-lg transition-all ${
        saved
          ? "text-pink-500 hover:text-pink-400 hover:bg-pink-500/10"
          : "text-muted-foreground/40 hover:text-pink-500 hover:bg-foreground/[0.06]"
      } ${animating ? "scale-125" : ""}`}
      style={{ transition: "color 0.2s, background 0.2s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      title={saved ? "Saved" : "Save"}
      aria-label={saved ? "Remove from saved" : "Save effect"}
    >
      <Heart
        className={compact ? "w-3.5 h-3.5" : "w-3.5 h-3.5"}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   EFFECT PREVIEW — Renders effect demos by display type
   ════════════════════════════════════════════════════════════════ */
function EffectPreview({ effect, style }: { effect: FerrumEffectIndex; style?: React.CSSProperties }) {
  const base = "w-full h-24 rounded-lg bg-foreground/[0.03] flex items-center justify-center overflow-hidden";
  const cls = effect.className;

  if (effect.displayType === "text") {
    return (
      <div className={`${base} p-4`}>
        <span className={`text-lg font-semibold text-foreground/80 ${cls}`}>Ferrum</span>
      </div>
    );
  }
  if (effect.displayType === "loader") {
    return (
      <div className={`${base}`}>
        <div className={`${cls}`} style={style}>
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
        </div>
      </div>
    );
  }
  if (effect.displayType === "bg") {
    return <div className={`${base} ${cls}`} style={style} />;
  }
  if (effect.displayType === "icon") {
    return (
      <div className={`${base}`}>
        <Sparkles className={`w-8 h-8 text-purple-400 ${cls}`} style={style} />
      </div>
    );
  }
  if (effect.displayType === "button") {
    return (
      <div className={`${base}`}>
        <button className={`px-5 py-2 rounded-lg bg-foreground text-background text-sm font-medium ${cls}`} style={style}>
          Hover me
        </button>
      </div>
    );
  }
  if (effect.displayType === "card") {
    return (
      <div className={`${base} p-4`}>
        <div className={`p-4 rounded-xl border border-border bg-foreground/[0.02] ${cls}`} style={style}>
          <div className="w-8 h-1.5 rounded bg-foreground/10 mb-2" />
          <div className="w-16 h-1.5 rounded bg-foreground/6" />
        </div>
      </div>
    );
  }
  if (effect.displayType === "image") {
    return (
      <div className={`${base} p-4`}>
        <div className={`w-full h-full rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 ${cls}`} style={style} />
      </div>
    );
  }
  // box / preset
  return (
    <div className={`${base}`}>
      <div className={`w-12 h-12 rounded-lg bg-foreground/[0.06] ${cls}`} style={style} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SKELETON CARD
   ════════════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-foreground/[0.02] p-4 animate-pulse">
      <div className="w-full h-24 rounded-lg bg-foreground/[0.04] mb-3" />
      <div className="w-3/4 h-3 rounded bg-foreground/[0.04] mb-2" />
      <div className="w-1/2 h-2.5 rounded bg-foreground/[0.03]" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EFFECT CARD
   ════════════════════════════════════════════════════════════════ */
function EffectCard({ effect, onOpenCode, onAddCollection, isInCollection }: {
  effect: FerrumEffectIndex;
  onOpenCode: (e: FerrumEffectIndex) => void;
  onAddCollection: (cn: string) => void;
  isInCollection: (cn: string) => boolean;
}) {
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties | undefined>();
  const replay = () => {
    setPreviewStyle(undefined);
    requestAnimationFrame(() => requestAnimationFrame(() => setPreviewStyle({})));
  };
  return (
    <div className="group rounded-2xl border border-border bg-foreground/[0.015] hover:bg-foreground/[0.025] transition-all duration-200 overflow-hidden">
      <div className="p-3">
        <EffectPreview effect={effect} style={previewStyle} />
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground truncate">{effect.name}</h3>
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            <button onClick={replay} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-all" title="Replay"><RotateCcw className="w-3.5 h-3.5" /></button>
            <HeartButton effectClassName={effect.className} isInCollection={isInCollection} onToggle={onAddCollection} compact />
            <button onClick={() => onOpenCode(effect)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-all" title="View code"><Code className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-[11px] font-mono text-muted-foreground/40 bg-foreground/[0.04] px-2 py-0.5 rounded">{effect.className}</code>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-foreground/[0.04] text-muted-foreground/40 hover:bg-foreground/[0.06]">{effect.category}</Badge>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EFFECT DETAIL MODAL
   ════════════════════════════════════════════════════════════════ */
function EffectDetailModal({ effect, open, onClose, onAddCollection, isInCollection }: {
  effect: FerrumEffectIndex | null; open: boolean; onClose: () => void; onAddCollection: (cn: string) => void; isInCollection: boolean;
}) {
  const [tab, setTab] = useState("css");
  const [copied, setCopied] = useState(false);
  const [css, setCss] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !effect) { setCss(null); return; }
    let cancelled = false;
    import("@/lib/ferrum-effects-data").then((mod) => {
      if (cancelled) return;
      const found = mod.effects.find((e: { className: string }) => e.className === effect!.className);
      setCss(found?.css || "/* CSS not found */");
    });
    return () => { cancelled = true; };
  }, [open, effect]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); };

  if (!effect) return null;

  const cssUsage = `<div class="${effect.className}">\n  <!-- Your content -->\n</div>`;

  const reactCode = `import '@/styles/ferrum.css';\n\nexport default function Component() {\n  return (\n    <div className="${effect.className}">\n      {/* Your content */}\n    </div>\n  );\n}`;

  const vueCode = `<template>\n  <div class="${effect.className}">\n    <!-- Your content -->\n  </div>\n</template>\n\n<style>\n@import '@/styles/ferrum.css';\n</style>`;

  const handleCopyTab = () => {
    if (tab === "css") copy(css || "");
    else if (tab === "usage") copy(cssUsage);
    else if (tab === "react") copy(reactCode);
    else copy(vueCode);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{effect.name}</span>
            <button onClick={() => onAddCollection(effect.className)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs transition-colors">
              <Heart className={`w-3.5 h-3.5 ${isInCollection ? "text-pink-500" : ""}`} fill={isInCollection ? "currentColor" : "none"} />
              {isInCollection ? "Saved" : "Save"}
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <EffectPreview effect={effect} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <code className="text-xs font-mono text-muted-foreground/50 bg-foreground/[0.04] px-2.5 py-1 rounded">{effect.className}</code>
          <Badge variant="secondary" className="text-[10px]">{effect.category}</Badge>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-3">
            <TabsList className="bg-foreground/[0.04]">
              <TabsTrigger value="css" className="text-xs">CSS</TabsTrigger>
              <TabsTrigger value="usage" className="text-xs">Usage</TabsTrigger>
              <TabsTrigger value="react" className="text-xs">React</TabsTrigger>
              <TabsTrigger value="vue" className="text-xs">Vue</TabsTrigger>
            </TabsList>
            <button onClick={handleCopyTab} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <TabsContent value="css"><pre className="text-xs font-mono text-muted-foreground/70 bg-foreground/[0.03] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{css || "Loading..."}</pre></TabsContent>
          <TabsContent value="usage"><pre className="text-xs font-mono text-muted-foreground/70 bg-foreground/[0.03] p-4 rounded-xl overflow-x-auto">{cssUsage}</pre></TabsContent>
          <TabsContent value="react"><pre className="text-xs font-mono text-muted-foreground/70 bg-foreground/[0.03] p-4 rounded-xl overflow-x-auto">{reactCode}</pre></TabsContent>
          <TabsContent value="vue"><pre className="text-xs font-mono text-muted-foreground/70 bg-foreground/[0.03] p-4 rounded-xl overflow-x-auto">{vueCode}</pre></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ════════════════════════════════════════════════════════════════
   PLAYGROUND PANEL
   ════════════════════════════════════════════════════════════════ */
function PlaygroundPanel({ open, onClose }: { open: boolean; onClose: (o: boolean) => void }) {
  const [effect, setEffect] = useState("roycss-float");
  const [duration, setDuration] = useState([3]);
  const [delay, setDelay] = useState([0]);
  const [repeat, setRepeat] = useState("infinite");
  const [easing, setEasing] = useState("ease-in-out");

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Playground</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Effect</label>
            <Select value={effect} onValueChange={setEffect}>
              <SelectTrigger className="bg-foreground/[0.04]"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {effectsIndex.slice(0, 100).map((e) => (
                  <SelectItem key={e.className} value={e.className}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Duration: {duration[0]}s</label>
            <Slider value={duration} onValueChange={setDuration} min={0.1} max={10} step={0.1} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Delay: {delay[0]}s</label>
            <Slider value={delay} onValueChange={setDelay} min={0} max={5} step={0.1} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Repeat</label>
            <Select value={repeat} onValueChange={setRepeat}>
              <SelectTrigger className="bg-foreground/[0.04]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="3">3x</SelectItem>
                <SelectItem value="infinite">Infinite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Easing</label>
            <Select value={easing} onValueChange={setEasing}>
              <SelectTrigger className="bg-foreground/[0.04]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["ease", "ease-in", "ease-out", "ease-in-out", "linear", "cubic-bezier(0.68,-0.55,0.27,1.55)"].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-6 rounded-xl border border-border bg-foreground/[0.02]">
            <p className="text-xs font-medium text-muted-foreground mb-3">Preview</p>
            <div className="flex items-center justify-center min-h-[120px]">
              <div className={effect} style={{ animationDuration: `${duration[0]}s`, animationDelay: `${delay[0]}s`, animationIterationCount: repeat as "infinite" | number, animationTimingFunction: easing }}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20" />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ════════════════════════════════════════════════════════════════
   COLLECTION DRAWER
   ════════════════════════════════════════════════════════════════ */
function CollectionDrawer({ open, onClose, collection, onRemove, onClear }: {
  open: boolean; onClose: (o: boolean) => void; collection: string[]; onRemove: (cn: string) => void; onClear: () => void;
}) {
  const copyAll = () => {
    const text = collection.map((cn) => {
      const e = effectsIndex.find((x) => x.className === cn);
      return `<!-- ${e?.name || cn} -->\n<div class="${cn}"></div>`;
    }).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All effects copied!");
  };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Saved Effects ({collection.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {collection.length > 0 && (
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.06] hover:bg-foreground/[0.1] text-xs font-medium transition-colors"><Copy className="w-3.5 h-3.5" />Copy All</button>
              <button onClick={onClear} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors"><Trash2 className="w-3.5 h-3.5" />Clear</button>
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
              {collection.length === 0 && <p className="text-sm text-muted-foreground/40 text-center py-8">No saved effects yet. Click the heart icon on any effect to save it.</p>}
              {collection.map((cn) => {
                const e = effectsIndex.find((x) => x.className === cn);
                return (
                  <div key={cn} className="flex items-center justify-between p-3 rounded-lg hover:bg-foreground/[0.03] group">
                    <div>
                      <div className="text-sm font-medium text-foreground">{e?.name || cn}</div>
                      <code className="text-[11px] font-mono text-muted-foreground/40">{cn}</code>
                    </div>
                    <button onClick={() => onRemove(cn)} className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSTALL SECTION
   ════════════════════════════════════════════════════════════════ */
export function InstallSection() {
  const [open, setOpen] = useState(false);
  return (
    <section id="install" className="py-20 relative">
      <div className="ferrum-divider-glow absolute top-0 left-0 right-0" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Reveal>
              <div className="text-center">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground/[0.04] border border-border hover:bg-foreground/[0.08] transition-all text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Install FerrumEngine
                  <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              </div>
            </Reveal>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Reveal>
              <div className="mt-8 max-w-2xl mx-auto space-y-4">
                <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Download CSS</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs font-mono text-purple-400/80 bg-foreground/[0.04] px-3 py-2 rounded-lg">curl -o ferrum.css https://ferrum.space-z.ai/api/css?format=all</code>
                    <button onClick={() => { navigator.clipboard.writeText("curl -o ferrum.css https://ferrum.space-z.ai/api/css?format=all"); toast.success("Copied!"); }} className="px-3 py-2 rounded-lg bg-foreground/[0.06] hover:bg-foreground/[0.1] transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Add to HTML</p>
                  <code className="text-xs font-mono text-muted-foreground/60">&lt;link rel=&quot;stylesheet&quot; href=&quot;./ferrum.css&quot;&gt;</code>
                </div>
              </div>
            </Reveal>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   CATEGORY PILL
   ════════════════════════════════════════════════════════════════ */
function CategoryPill({ cat, active, count, compact, onClick }: {
  cat: { id: string; name: string }; active: boolean; count: number; compact?: boolean; onClick: () => void;
}) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
        active ? "bg-foreground text-background" : "bg-foreground/[0.04] text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.06]"
      }`}
    >
      {cat.name} {!compact && <span className="opacity-50 ml-1">{count}</span>}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIRTUAL GRID — Paginated infinite scroll
   ════════════════════════════════════════════════════════════════ */
function VirtualGrid({ effects, onOpenCode, onAddCollection, isInCollection }: {
  effects: FerrumEffectIndex[]; onOpenCode: (e: FerrumEffectIndex) => void; onAddCollection: (cn: string) => void; isInCollection: (cn: string) => boolean;
}) {
  const [visible, setVisible] = useState(48);
  const loaderRef = useRef<HTMLDivElement>(null);
  const slice = effects.slice(0, visible);
  const hasMore = visible < effects.length;

  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible((v) => v + 48); }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {slice.map((e) => (
          <EffectCard key={e.className} effect={e} onOpenCode={onOpenCode} onAddCollection={onAddCollection} isInCollection={isInCollection} />
        ))}
      </div>
      <div ref={loaderRef} className="h-8" />
      {hasMore && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground/40 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading...</div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   EFFECTS PAGE VIEW
   ════════════════════════════════════════════════════════════════ */
export function EffectsView({
  search, setSearch, activeCategory, setActiveCategory,
  hydrated, handleOpenCode, add, isIn,
  collection, collectionOpen, setCollectionOpen, remove, clear,
}: {
  search: string; setSearch: (s: string) => void;
  activeCategory: string; setActiveCategory: (c: string) => void;
  hydrated: boolean;
  handleOpenCode: (e: FerrumEffectIndex) => void;
  add: (cn: string) => void; isIn: (cn: string) => boolean;
  collection: string[]; collectionOpen: boolean; setCollectionOpen: (o: boolean) => void;
  remove: (cn: string) => void; clear: () => void;
}) {
  const catScrollRef = useRef<HTMLDivElement>(null);

  // Compute filtered effects from local data
  const filtered = useMemo(() => {
    let f = effectsIndex;
    if (activeCategory !== "all") f = f.filter((e) => e.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter((e) => e.name.toLowerCase().includes(q) || e.className.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    return f;
  }, [search, activeCategory]);
  useEffect(() => {
    if (catScrollRef.current) {
      const b = catScrollRef.current.querySelector('[data-active="true"]');
      if (b) b.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-12 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-400/70 mb-4">Motion</p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          {effectsIndex.length} Effects. {categories.length} Categories.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mt-4">
          Carefully crafted CSS effects built to enhance user interactions while maintaining
          exceptional performance and accessibility.
        </p>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input placeholder="Search effects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-foreground/[0.04] border-border text-foreground placeholder:text-muted-foreground/40 focus:border-purple-500/40 focus:ring-purple-500/10 h-10 rounded-xl text-sm" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground text-xs">Clear</button>}
            </div>
            <button onClick={() => setCollectionOpen(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-foreground/[0.04] border border-border text-muted-foreground hover:text-foreground hover:border-border transition-all shrink-0 relative">
              <Heart className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Saved</span>
              {collection.length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-pink-500 text-foreground text-[10px] font-bold px-1">{collection.length}</span>}
            </button>
          </div>
          <div ref={catScrollRef} className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {categories.map((cat) => (
              <CategoryPill key={cat.id} cat={cat} active={activeCategory === cat.id} count={categoryCounts[cat.id] || 0} compact onClick={() => setActiveCategory(cat.id)} />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8 w-full">
        {hydrated ? (
          filtered.length > 0 ? (
            <>
              <VirtualGrid effects={filtered} onOpenCode={handleOpenCode} onAddCollection={add} isInCollection={isIn} />
              <div className="mt-8 text-center text-xs text-muted-foreground/50">Showing {filtered.length} of {effectsIndex.length} effects</div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search className="w-12 h-12 text-foreground/[0.06] mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground/70">No effects found</h3>
              <p className="text-sm text-muted-foreground/50 mt-1">Try a different search or category</p>
              <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="mt-4 px-4 py-2 rounded-xl bg-purple-500/10 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-colors">Clear filters</button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EXPORTED HOOKS — State management for effects
   Used by page.tsx to manage effects state
   ════════════════════════════════════════════════════════════════ */

export interface EffectsState {
  search: string;
  setSearch: (s: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  selectedEffect: FerrumEffectIndex | null;
  detailOpen: boolean;
  setDetailOpen: (o: boolean) => void;
  playgroundOpen: boolean;
  setPlaygroundOpen: (o: boolean) => void;
  collection: string[];
  collectionOpen: boolean;
  setCollectionOpen: (o: boolean) => void;
  hydrated: boolean;
  filtered: FerrumEffectIndex[];
  handleOpenCode: (e: FerrumEffectIndex) => void;
  add: (cn: string) => void;
  remove: (cn: string) => void;
  clearCollection: () => void;
  isIn: (cn: string) => boolean;
}

export function useEffectsState(): EffectsState {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedEffect, setSelectedEffect] = useState<FerrumEffectIndex | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [collection, setCollection] = useState<string[]>([]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const filtered = useMemo(() => {
    let f = effectsIndex;
    if (activeCategory !== "all") f = f.filter((e) => e.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter((e) => e.name.toLowerCase().includes(q) || e.className.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    return f;
  }, [search, activeCategory]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/ferrum-effects-unified.css";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      try {
        const s = localStorage.getItem("ferrum-collection");
        if (s && !cancelled) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) startTransition(() => setCollection(p));
        }
      } catch (e) { console.warn("[Ferrum] Failed to read collection", e); }
      if (!cancelled) startTransition(() => setHydrated(true));
    });
    return () => { cancelled = true; };
  }, []);

  const handleOpenCode = useCallback((e: FerrumEffectIndex) => { setSelectedEffect(e); setDetailOpen(true); }, []);
  const add = useCallback((cn: string) => {
    setCollection((p) => {
      if (p.includes(cn)) return p;
      const n = [...p, cn];
      localStorage.setItem("ferrum-collection", JSON.stringify(n));
      toast.success("Saved!");
      return n;
    });
  }, []);
  const remove = useCallback((cn: string) => {
    setCollection((p) => {
      const n = p.filter((c) => c !== cn);
      localStorage.setItem("ferrum-collection", JSON.stringify(n));
      return n;
    });
  }, []);
  const clearCollection = useCallback(() => {
    setCollection([]);
    localStorage.removeItem("ferrum-collection");
    toast.success("Cleared");
  }, []);
  const isIn = useCallback((cn: string) => collection.includes(cn), [collection]);

  return {
    search, setSearch, activeCategory, setActiveCategory,
    selectedEffect, detailOpen, setDetailOpen,
    playgroundOpen, setPlaygroundOpen,
    collection, collectionOpen, setCollectionOpen,
    hydrated, filtered, handleOpenCode, add, remove, clearCollection, isIn,
  };
}

/* ════════════════════════════════════════════════════════════════
   EXPORTED MODALS
   ════════════════════════════════════════════════════════════════ */

export { EffectDetailModal, PlaygroundPanel, CollectionDrawer };
export type { FerrumEffectIndex };