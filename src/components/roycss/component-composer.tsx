"use client";

/**
 * ComponentComposer — visually compose 2+ RoyCSS effects into a single
 * composite preview, copy the combined CSS in any framework format, and
 * optionally save the composition as a custom collection.
 *
 * Features:
 *   - Effect picker (live search across all 1,749 effects)
 *   - Live preview iframe with the composite CSS injected
 *   - Add / remove / reorder effects via a chip rail
 *   - Copy composite CSS button (uses `src/lib/copy-formats.ts`)
 *   - Save composite as a custom collection (localStorage, same shape
 *     as `CustomCollectionsSheet` — see `src/components/roycss/custom-collections.tsx`)
 *
 * Requires at least 2 effects before the Copy / Save actions enable.
 */

import {
  useState, useMemo, useCallback, useRef, useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search as SearchIcon,
  X,
  Plus,
  Copy,
  Check,
  Save,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Wand2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { effects as ALL_EFFECTS, type CSSEffect } from "@/lib/roycss-effects";
import { formatCss, COPY_FORMATS, type CopyFormat } from "@/lib/copy-formats";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS — must stay in sync with custom-collections.tsx
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "roycss-custom-collections";

interface CustomCollection {
  id: string;
  name: string;
  description: string;
  effectIds: string[];
  createdAt: number;
}

function readCollections(): CustomCollection[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCollections(collections: CustomCollection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  window.dispatchEvent(new CustomEvent("roycss-collections-change"));
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSER — main component
   ═══════════════════════════════════════════════════════════════ */

export interface ComponentComposerProps {
  /** Optional list of effect ids to pre-select (e.g. from a related effect's recommendations). */
  defaultEffectIds?: string[];
  /** When provided, the composer will mount inside a Dialog when `open` is true. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional max number of effects a user can stack. Defaults to 6. */
  maxEffects?: number;
}

export function ComponentComposer({
  defaultEffectIds = [],
  open: controlledOpen,
  onOpenChange,
  maxEffects = 6,
}: ComponentComposerProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(v);
    else setUncontrolledOpen(v);
  };

  // Pre-resolve default effects (skip any missing ids).
  const initialSelected = useMemo<CSSEffect[]>(() => {
    const all = new Map(ALL_EFFECTS.map((e) => [e.id, e] as const));
    const out: CSSEffect[] = [];
    for (const id of defaultEffectIds) {
      const e = all.get(id);
      if (e) out.push(e);
    }
    return out;
  }, [defaultEffectIds]);

  const [selected, setSelected] = useState<CSSEffect[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Reset selection when the composer is opened with default effect ids.
  useEffect(() => {
    if (open) setSelected(initialSelected);
     
  }, [open]);

  const searchResults = useMemo<CSSEffect[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_EFFECTS.slice(0, 12);
    const matches = ALL_EFFECTS.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.id.includes(q),
    );
    return matches.slice(0, 12);
  }, [search]);

  /** Combined CSS of all selected effects — used for preview + copy. */
  const compositeCss = useMemo(() => {
    return selected.map((e) => e.cssCode).join("\n\n");
  }, [selected]);

  /** HTML rendered inside the preview iframe — demo divs for each effect. */
  const previewSrcDoc = useMemo(() => {
    const demoBlocks = selected.length
      ? selected
          .map((e, idx) => {
            const text = e.previewText ?? "RoyCSS";
            const isText = e.previewType === "text";
            const isButton = e.previewType === "button";
            const className = `roycss-${e.id}`;
            if (isText) {
              return `<div class="composer-block"><span class="${className}" data-text="${text}">${text}</span></div>`;
            }
            if (isButton) {
              return `<div class="composer-block"><button class="${className}">${text}</button></div>`;
            }
            return `<div class="composer-block"><div class="${className} composer-box"></div><p class="composer-label">Effect ${idx + 1} · ${e.name}</p></div>`;
          })
          .join("\n")
      : `<div class="composer-empty"><p class="composer-empty-text">Stack 2+ effects to see them composed live.</p></div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root {
    --primary: oklch(0.55 0.2 264);
    --bg: #ffffff;
    --fg: #18181b;
    --muted: #f4f4f5;
    --border: #e4e4e7;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #09090b; --fg: #fafafa; --muted: #18181b; --border: #27272a; }
  }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100%;
  }
  body {
    display: flex; flex-direction: column; gap: 12px;
    padding: 16px;
    align-items: stretch; justify-content: flex-start;
  }
  .composer-block {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 8px;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--muted);
    min-height: 80px;
  }
  .composer-box {
    width: 64px; height: 64px;
    border-radius: 12px;
    background: linear-gradient(135deg, color-mix(in oklch, var(--primary) 24%, transparent), transparent);
    border: 1px solid color-mix(in oklch, var(--primary) 24%, transparent);
  }
  .composer-label {
    margin: 0; font-size: 11px; color: var(--fg); opacity: 0.7;
    text-align: center;
  }
  .composer-empty {
    text-align: center; padding: 48px 16px;
    color: var(--fg); opacity: 0.6;
  }
  .composer-empty-text { margin: 8px 0 0; font-size: 13px; }

  /* Inject every selected effect's CSS — runs in the iframe context. */
${compositeCss}
</style>
</head>
<body>
${demoBlocks}
</body>
</html>`;
  }, [selected, compositeCss]);

  /* ─── Actions ────────────────────────────────────────────── */
  const addEffect = useCallback(
    (effect: CSSEffect) => {
      setSelected((prev) => {
        if (prev.some((e) => e.id === effect.id)) return prev;
        if (prev.length >= maxEffects) {
          toast.info(`Max ${maxEffects} effects — remove one to add more.`);
          return prev;
        }
        return [...prev, effect];
      });
    },
    [maxEffects],
  );

  const removeEffect = useCallback((id: string) => {
    setSelected((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const moveEffect = useCallback((id: string, dir: -1 | 1) => {
    setSelected((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelected([]);
    setSaveName("");
  }, []);

  const handleCopy = useCallback(
    async (format: CopyFormat) => {
      if (selected.length < 2) return;
      const compositeId = "composer-composite";
      const formatted = formatCss(compositeCss, compositeId, format);
      const label =
        COPY_FORMATS.find((f) => f.id === format)?.label ?? format;
      try {
        await navigator.clipboard.writeText(formatted);
        setCopiedFormat(format);
        toast.success(`Copied ${selected.length} effects as ${label}!`);
        setTimeout(() => setCopiedFormat(null), 2000);
      } catch {
        toast.error("Failed to copy — please try again");
      }
    },
    [compositeCss, selected],
  );

  const handleSave = useCallback(async () => {
    if (selected.length < 2 || !saveName.trim()) return;
    setSaving(true);
    try {
      const col: CustomCollection = {
        id: `composer-${Date.now()}`,
        name: saveName.trim(),
        description: `Composite of ${selected.length} effects — ${selected.map((e) => e.name).join(", ")}`,
        effectIds: selected.map((e) => e.id),
        createdAt: Date.now(),
      };
      const updated = [col, ...readCollections()];
      writeCollections(updated);
      setSavedToast(true);
      toast.success(`Saved "${col.name}" to My Collections!`);
      setTimeout(() => {
        setSavedToast(false);
        setSaving(false);
        setSaveName("");
      }, 1500);
    } catch {
      setSaving(false);
      toast.error("Failed to save collection");
    }
  }, [selected, saveName]);

  const canCopy = selected.length >= 2;
  const canSave = selected.length >= 2 && saveName.trim().length > 0;

  /* ─── Composer body (shared between inline + dialog usage) ── */
  const body = (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.4fr)] gap-4">
      {/* LEFT: effect picker */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search effects to stack…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-3 h-10"
            aria-label="Search effects"
          />
        </div>

        <div className="text-xs text-muted-foreground flex items-center justify-between gap-2">
          <span>
            {selected.length}/{maxEffects} effects stacked
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-rose-500 transition-colors inline-flex items-center gap-1"
            >
              <Trash2 className="size-3" /> Clear
            </button>
          )}
        </div>

        {/* Selected chips rail */}
        {selected.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {selected.map((effect, idx) => (
                <motion.div
                  key={effect.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/40"
                >
                  <GripVertical className="size-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs font-mono text-muted-foreground/70 shrink-0 tabular-nums">
                    {idx + 1}.
                  </span>
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {effect.name}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => moveEffect(effect.id, -1)}
                            disabled={idx === 0}
                            className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move up"
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Move up</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => moveEffect(effect.id, 1)}
                            disabled={idx === selected.length - 1}
                            className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move down"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Move down</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <button
                      type="button"
                      onClick={() => removeEffect(effect.id)}
                      className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      aria-label={`Remove ${effect.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Search results */}
        <div className="rounded-xl border border-border/60 bg-background max-h-72 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No effects match &ldquo;{search}&rdquo;
            </p>
          ) : (
            searchResults.map((effect) => {
              const isSelected = selected.some((e) => e.id === effect.id);
              return (
                <button
                  key={effect.id}
                  type="button"
                  onClick={() => (isSelected ? removeEffect(effect.id) : addEffect(effect))}
                  className={`w-full flex items-center gap-3 p-2 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-center size-7 rounded bg-muted/60 border border-border/40 shrink-0">
                    {isSelected ? (
                      <Check className="size-3 text-primary" />
                    ) : (
                      <Plus className="size-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{effect.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {effect.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase shrink-0">
                    {effect.category}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: live preview + actions */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Live composite preview
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {selected.length} effect{selected.length === 1 ? "" : "s"}
            </span>
          </div>
          <iframe
            title="Composite preview"
            srcDoc={previewSrcDoc}
            sandbox="allow-same-origin"
            className="w-full h-72 bg-background"
          />
        </div>

        {/* Copy composite CSS */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              disabled={!canCopy}
              className="w-full"
              variant={canCopy ? "default" : "secondary"}
            >
              {copiedFormat ? (
                <Check className="size-4 text-emerald-300" />
              ) : (
                <Copy className="size-4" />
              )}
              {copiedFormat
                ? "Copied!"
                : `Copy composite CSS (${selected.length} effects)`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Copy as…
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COPY_FORMATS.map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onSelect={() => void handleCopy(opt.id)}
                className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
              >
                <span className="text-sm font-medium text-foreground">
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {!canCopy && (
          <p className="text-[11px] text-muted-foreground text-center">
            Stack at least 2 effects to enable Copy &amp; Save.
          </p>
        )}

        {/* Save composite as a custom collection */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Save className="size-3.5 text-primary" />
            Save as a custom collection
          </div>
          <Input
            type="text"
            placeholder="Collection name (e.g. 'Hero stack')"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="h-9 text-sm"
            disabled={!canCopy}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!canSave || saving}
            onClick={handleSave}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : savedToast ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Layers className="size-4" />
            )}
            {savedToast ? "Saved!" : saving ? "Saving…" : "Save to My Collections"}
          </Button>
        </div>
      </div>
    </div>
  );

  /* ─── If a controlled `open` prop is passed, render in a Dialog ─── */
  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Wand2 className="size-5 text-primary" />
              Component Composer
            </DialogTitle>
            <DialogDescription>
              Compose 2+ RoyCSS effects into a single composite preview, then
              copy the combined CSS or save it as a custom collection.
            </DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  /* ─── Inline (non-dialog) usage — render with a launch button ─── */
  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        <Wand2 className="size-4 text-primary" />
        Open Component Composer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Wand2 className="size-5 text-primary" />
              Component Composer
            </DialogTitle>
            <DialogDescription>
              Compose 2+ RoyCSS effects into a single composite preview, then
              copy the combined CSS or save it as a custom collection.
            </DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ComponentComposer;
