"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  Plus,
  X,
  Copy,
  Save,
  Check,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { effects as allEffects, type CSSEffect } from "@/lib/roycss-effects";

/* ── LocalStorage-backed saved compositions ───────────────────
   Each composition: { id, name, effects: CSSEffect[], createdAt }.
   Stored under roycss-compositions. */
interface SavedComposition {
  id: string;
  name: string;
  effects: CSSEffect[];
  createdAt: string;
}

const STORAGE_KEY = "roycss-compositions";

function loadCompositions(): SavedComposition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedComposition[]) : [];
  } catch {
    return [];
  }
}

function saveCompositions(list: SavedComposition[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

/* ── Helper: build a self-contained preview document ────────
   Wraps every effect's CSS plus a few demo targets in a tiny
   HTML page rendered in an iframe (sandboxed). */
function buildPreviewDoc(selected: CSSEffect[]): string {
  const css = selected.map((e) => `/* ${e.name} */\n${e.cssCode}`).join("\n\n");
  const targets = selected.map((e, i) => {
    const baseCls = `roycss-comp-${i}`;
    const inner = e.previewType === "loader" && e.childCount
      ? Array.from({ length: e.childCount }).map(() => "<span></span>").join("")
      : e.previewText ?? (e.previewType === "button" ? "Hover Me" : "RoyCSS");
    return `<div class="${baseCls} roycss-effect-target" data-effect="${e.id}">${inner}</div>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
  <style>
    body{margin:0;padding:16px;font-family:system-ui,Segoe UI,sans-serif;background:#0b0f14;color:#e5e7eb;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));place-items:center;min-height:100%}
    .roycss-effect-target{display:flex;align-items:center;justify-content:center;min-height:48px;min-width:96px;padding:10px;border-radius:8px;border:1px solid #1f2937;font-size:13px;color:#e5e7eb;background:rgba(255,255,255,.02)}
    .roycss-effect-target:empty{min-height:48px}
    ${css}
  </style></head><body>${targets}</body></html>`;
}

/** Strips per-effect classes so the composite CSS is copy-paste clean. */
function buildCompositeCSS(selected: CSSEffect[]): string {
  return selected.map((e) => `/* ${e.name} — ${e.id} */\n${e.cssCode}`).join("\n\n");
}

interface ComponentComposerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ComponentComposer({ open, onOpenChange }: ComponentComposerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CSSEffect[]>([]);
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState<SavedComposition[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sample 60 effects for the picker (avoid mounting the full 1,749-list).
  const pickable = useMemo<CSSEffect[]>(() => {
    const seen = new Set<string>();
    const out: CSSEffect[] = [];
    for (const e of allEffects) {
      if (seen.has(e.category)) continue;
      // 10 per category, evenly spread — take every Nth.
      seen.add(e.category);
    }
    // Just take a flat sample of 60 from the start — stable across renders.
    return allEffects.slice(0, 60);
  }, []);

  const filteredPickable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pickable;
    return pickable.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [pickable, search]);

  const compositeCss = useMemo(() => buildCompositeCSS(selected), [selected]);
  const previewHtml = useMemo(() => buildPreviewDoc(selected), [selected]);

  const addEffect = useCallback((e: CSSEffect) => {
    setSelected((prev) => prev.find((x) => x.id === e.id) ? prev : [...prev, e]);
  }, []);
  const removeEffect = useCallback((id: string) => {
    setSelected((prev) => prev.filter((e) => e.id !== id));
  }, []);
  const moveEffect = useCallback((id: string, dir: -1 | 1) => {
    setSelected((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const copyComposite = useCallback(async () => {
    if (selected.length === 0) {
      toast.error("Add at least one effect first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(compositeCss);
      setCopied(true);
      toast.success(`Copied ${selected.length} effects to clipboard`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Clipboard not available in this browser");
    }
  }, [compositeCss, selected.length]);

  const saveCollection = useCallback(() => {
    if (selected.length === 0) {
      toast.error("Add at least one effect first.");
      return;
    }
    const name = saveName.trim() || `Composition ${new Date().toLocaleString()}`;
    const entry: SavedComposition = {
      id: `comp-${Date.now()}`,
      name,
      effects: selected,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...loadCompositions()];
    saveCompositions(next);
    setSaved(next);
    setSaveName("");
    toast.success(`Saved "${name}" with ${selected.length} effects`);
  }, [selected, saveName]);

  // Hydrate saved compositions on open.
  if (open && saved.length === 0) {
    const list = loadCompositions();
    if (list.length > 0) setSaved(list);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Component Composer
          </SheetTitle>
          <SheetDescription>
            Stack multiple RoyCSS effects into a single composite stylesheet. Preview, copy, and save as a collection.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 pb-6">
          {/* LEFT — picker + selected list */}
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search effects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
                aria-label="Search effects"
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-2 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 gap-1">
                {filteredPickable.slice(0, 30).map((e) => {
                  const isAdded = selected.some((s) => s.id === e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => (isAdded ? removeEffect(e.id) : addEffect(e))}
                      disabled={isAdded}
                      className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer min-h-[36px]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        isAdded
                          ? "bg-primary/10 text-primary cursor-default"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      <span className="truncate text-start">{e.name}</span>
                      {isAdded ? <Check className="size-3.5 shrink-0" /> : <Plus className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
                {filteredPickable.length === 0 && (
                  <p className="text-xs text-muted-foreground p-4 text-center">No effects match.</p>
                )}
              </div>
            </div>

            {/* Selected list — ordered, removable, reorderable */}
            <div className="rounded-xl border border-border p-2">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Composition ({selected.length})
                </span>
                {selected.length > 0 && (
                  <button onClick={() => setSelected([])} className="text-xs text-destructive hover:underline cursor-pointer">
                    Clear
                  </button>
                )}
              </div>
              <AnimatePresence initial={false}>
                {selected.map((e, i) => (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 group"
                  >
                    <span className="text-xs truncate text-foreground">
                      <span className="text-muted-foreground mr-1.5 tabular-nums">{i + 1}.</span>
                      {e.name}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveEffect(e.id, -1)} disabled={i === 0}
                        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                        aria-label="Move up">
                        ↑
                      </button>
                      <button onClick={() => moveEffect(e.id, 1)} disabled={i === selected.length - 1}
                        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                        aria-label="Move down">
                        ↓
                      </button>
                      <button onClick={() => removeEffect(e.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                        aria-label={`Remove ${e.name}`}>
                        <X className="size-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selected.length === 0 && (
                <p className="text-xs text-muted-foreground p-3 text-center">No effects selected yet.</p>
              )}
            </div>
          </div>

          {/* RIGHT — preview + actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="size-3.5" /> Live preview
              </h4>
              {selected.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{compositeCss.length} bytes CSS</Badge>
              )}
            </div>
            <div className="rounded-xl border border-border overflow-hidden bg-background min-h-[220px] flex items-center justify-center">
              {selected.length === 0 ? (
                <div className="text-center text-muted-foreground p-6">
                  <Loader2 className="size-5 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Add effects to see a live preview.</p>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  title="Composer preview"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="w-full h-[280px] border-0"
                />
              )}
            </div>

            {/* Actions: copy composite CSS + save as collection */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button onClick={copyComposite} className="flex-1 h-9" variant="default">
                  {copied ? <Check className="size-4 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
                  {copied ? "Copied!" : "Copy composite CSS"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Collection name (optional)"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="h-9"
                  aria-label="Collection name"
                />
                <Button onClick={saveCollection} variant="outline" className="h-9 shrink-0">
                  <Save className="size-4 mr-1.5" />
                  Save
                </Button>
              </div>
            </div>

            {/* Saved compositions list */}
            {saved.length > 0 && (
              <div className="rounded-xl border border-border p-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Saved ({saved.length})
                </span>
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                  {saved.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelected(s.effects); toast.info(`Loaded "${s.name}"`); }}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors cursor-pointer text-start"
                    >
                      <span className="text-xs truncate">{s.name}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{s.effects.length}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
