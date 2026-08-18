"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer2,
  Copy,
  Check,
  Search,
  Upload,
  Sparkles,
  ChevronDown,
  Link2,
  ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * CursorPreviewGallery — a CSS `cursor` value gallery with live hover preview,
 * search, category filters, and a custom-image cursor builder.
 *
 * Features:
 *  - Grid of every standard CSS cursor value as a card. Hovering the preview
 *    area renders the ACTUAL cursor via `style={{ cursor: value }}` — this is
 *    the only way to truly see what each value looks like in the current
 *    browser/OS combo (cursors are platform-rendered, not drawn by CSS).
 *  - Copy button per card: copies `cursor: <value>;`.
 *  - Category badge per card: general / link-status / selection / drag-drop /
 *    resize / zoom / not-allowed. (The spec's badge list mentions "text", but
 *    the authoritative cursor-value grouping places `text` and `vertical-text`
 *    under "selection" and gives `not-allowed` its own group — this component
 *    follows the value grouping.)
 *  - Search: filters by cursor name OR category label (case-insensitive).
 *  - Category chips: toggle which categories are visible. Starts with all on.
 *  - Stats line: "N cursors · M categories · showing X".
 *  - Custom cursor builder (collapsible): upload an image (read as a data URL)
 *    OR paste an image URL, set hotspot X/Y (the click point), set a fallback
 *    cursor, and get `cursor: url('…') X Y, <fallback>;` ready to copy.
 *
 * All clipboard writes are best-effort with a 2s "Copied!" confirmation.
 * No console output, no `any`, fully typed, memoized filter pipeline.
 */

// ============================================================
// Types & constants
// ============================================================

type CategoryId =
  | "general"
  | "link-status"
  | "selection"
  | "drag-drop"
  | "resize"
  | "zoom"
  | "not-allowed";

interface CursorEntry {
  value: string;
  category: CategoryId;
}

interface CategoryMeta {
  id: CategoryId;
  label: string;
  /** Tailwind classes for the category badge tint (semantic, no indigo/blue). */
  badgeClass: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "general",
    label: "General",
    badgeClass:
      "border-border bg-muted/50 text-muted-foreground",
  },
  {
    id: "link-status",
    label: "Link / Status",
    badgeClass:
      "border-primary/30 bg-primary/10 text-primary",
  },
  {
    id: "selection",
    label: "Selection",
    badgeClass:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    id: "drag-drop",
    label: "Drag / Drop",
    badgeClass:
      "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  {
    id: "resize",
    label: "Resize",
    badgeClass:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  {
    id: "zoom",
    label: "Zoom",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "not-allowed",
    label: "Not-allowed",
    badgeClass:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
];

const CURSORS: CursorEntry[] = [
  // General
  { value: "default", category: "general" },
  { value: "auto", category: "general" },
  { value: "none", category: "general" },
  { value: "context-menu", category: "general" },
  { value: "help", category: "general" },
  // Link / Status
  { value: "pointer", category: "link-status" },
  { value: "progress", category: "link-status" },
  { value: "wait", category: "link-status" },
  { value: "cell", category: "link-status" },
  // Selection
  { value: "crosshair", category: "selection" },
  { value: "text", category: "selection" },
  { value: "vertical-text", category: "selection" },
  // Drag / Drop
  { value: "copy", category: "drag-drop" },
  { value: "move", category: "drag-drop" },
  { value: "no-drop", category: "drag-drop" },
  { value: "grab", category: "drag-drop" },
  { value: "grabbing", category: "drag-drop" },
  { value: "alias", category: "drag-drop" },
  // Resize (8 directional + 4 bidirectional + col/row + all-scroll)
  { value: "n-resize", category: "resize" },
  { value: "s-resize", category: "resize" },
  { value: "e-resize", category: "resize" },
  { value: "w-resize", category: "resize" },
  { value: "ne-resize", category: "resize" },
  { value: "nw-resize", category: "resize" },
  { value: "se-resize", category: "resize" },
  { value: "sw-resize", category: "resize" },
  { value: "ew-resize", category: "resize" },
  { value: "ns-resize", category: "resize" },
  { value: "nesw-resize", category: "resize" },
  { value: "nwse-resize", category: "resize" },
  { value: "col-resize", category: "resize" },
  { value: "row-resize", category: "resize" },
  { value: "all-scroll", category: "resize" },
  // Zoom
  { value: "zoom-in", category: "zoom" },
  { value: "zoom-out", category: "zoom" },
  // Not-allowed
  { value: "not-allowed", category: "not-allowed" },
];

const FALLBACK_OPTIONS: string[] = [
  "auto",
  "default",
  "pointer",
  "crosshair",
  "text",
  "not-allowed",
];

const COPY_CONFIRM_MS = 2000;

// ============================================================
// Helpers
// ============================================================

function cssFor(value: string): string {
  return `cursor: ${value};`;
}

function categoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

/** Best-effort clipboard write; resolves true on success. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* clipboard unavailable — silent */
  }
  return false;
}

// ============================================================
// Sub-components
// ============================================================

interface CursorCardProps {
  entry: CursorEntry;
  copied: boolean;
  onCopy: (value: string) => void;
}

function CursorCard({ entry, copied, onCopy }: CursorCardProps) {
  const meta = categoryMeta(entry.category);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
      {/* Preview area — hover to see the REAL cursor */}
      <div
        className="relative flex h-20 items-center justify-center bg-muted/30 transition-colors group-hover:bg-muted/50"
        style={{ cursor: entry.value }}
        aria-label={`Preview area for cursor: ${entry.value}. Hover to see the cursor.`}
        role="img"
      >
        <span className="pointer-events-none select-none text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          hover me
        </span>
        <Badge
          variant="outline"
          className={cn(
            "pointer-events-none absolute left-1.5 top-1.5 px-1.5 py-0 text-[9px] font-medium",
            meta.badgeClass,
          )}
        >
          {meta.label}
        </Badge>
      </div>

      {/* Name + copy */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <code className="truncate font-mono text-xs text-foreground">
          {entry.value}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onCopy(entry.value)}
          className="h-7 shrink-0 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          aria-label={`Copy "cursor: ${entry.value};"`}
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">
                Copied
              </span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface CategoryChipProps {
  meta: CategoryMeta;
  active: boolean;
  count: number;
  onToggle: () => void;
}

function CategoryChip({ meta, active, count, onToggle }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {meta.label}
      <span
        className={cn(
          "rounded-full px-1 text-[9px] tabular-nums",
          active
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ============================================================
// Custom cursor builder
// ============================================================

interface BuilderState {
  /** Active source: 'upload' uses dataUrl, 'url' uses url. */
  source: "upload" | "url";
  /** data: URL from a FileReader read of an uploaded image. */
  dataUrl: string;
  /** Uploaded file name (for display only). */
  fileName: string;
  /** Pasted image URL. */
  url: string;
  hotspotX: number;
  hotspotY: number;
  fallback: string;
}

const DEFAULT_BUILDER: BuilderState = {
  source: "url",
  dataUrl: "",
  fileName: "",
  url: "",
  hotspotX: 0,
  hotspotY: 0,
  fallback: "auto",
};

function CustomCursorBuilder() {
  const [state, setState] = useState<BuilderState>(DEFAULT_BUILDER);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUrl =
    state.source === "upload" ? state.dataUrl : state.url.trim();

  const generatedCss = useMemo(() => {
    if (!activeUrl) return "";
    // Always include hotspot coords (spec format: `url(...) X Y, fallback;`).
    return `cursor: url('${activeUrl}') ${state.hotspotX} ${state.hotspotY}, ${state.fallback};`;
  }, [activeUrl, state.hotspotX, state.hotspotY, state.fallback]);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Read as data URL so the preview + generated CSS work offline.
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setState((s) => ({
          ...s,
          source: "upload",
          dataUrl: result,
          fileName: file.name,
          // Reset hotspot to origin on new image.
          hotspotX: 0,
          hotspotY: 0,
        }));
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!generatedCss) return;
    const ok = await writeClipboard(generatedCss);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    }
  }, [generatedCss]);

  const clearImage = useCallback(() => {
    setState((s) => ({
      ...s,
      source: "url",
      dataUrl: "",
      fileName: "",
      url: "",
      hotspotX: 0,
      hotspotY: 0,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="space-y-4">
      {/* Source tabs: upload | url */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Upload */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Upload image
          </Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.cur,.ani"
              onChange={onFileChange}
              className="hidden"
              id="cursor-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 gap-1.5 text-xs"
            >
              <Upload className="size-3.5" />
              Choose file
            </Button>
            {state.source === "upload" && state.fileName ? (
              <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground">
                <ImageIcon className="size-3 shrink-0" />
                <span className="truncate">{state.fileName}</span>
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                .png, .cur, .ani, .gif…
              </span>
            )}
          </div>
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <Label
            htmlFor="cursor-url-input"
            className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            Or paste image URL
          </Label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cursor-url-input"
              type="url"
              value={state.source === "url" ? state.url : ""}
              placeholder="https://…/cursor.png"
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  source: "url",
                  url: e.target.value,
                }))
              }
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Preview + hotspot */}
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        {/* Live preview */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Live preview
          </Label>
          <div
            className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground"
            style={{
              cursor: activeUrl
                ? `url('${activeUrl}') ${state.hotspotX} ${state.hotspotY}, ${state.fallback}`
                : "default",
            }}
          >
            {activeUrl ? "hover to test" : "add an image first"}
          </div>
          {activeUrl && (
            <div className="flex items-center justify-between">
              <span className="truncate text-[10px] text-muted-foreground">
                {state.source === "upload"
                  ? state.fileName || "uploaded image"
                  : "remote image"}
              </span>
              <button
                type="button"
                onClick={clearImage}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-rose-500"
              >
                <X className="size-3" />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Hotspot + fallback */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hotspot X
              </Label>
              <span className="font-mono text-[10px] tabular-nums text-foreground">
                {state.hotspotX}px
              </span>
            </div>
            <Slider
              min={0}
              max={128}
              step={1}
              value={[state.hotspotX]}
              onValueChange={(v) =>
                setState((s) => ({ ...s, hotspotX: v[0] ?? 0 }))
              }
              className="py-1"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hotspot Y
              </Label>
              <span className="font-mono text-[10px] tabular-nums text-foreground">
                {state.hotspotY}px
              </span>
            </div>
            <Slider
              min={0}
              max={128}
              step={1}
              value={[state.hotspotY]}
              onValueChange={(v) =>
                setState((s) => ({ ...s, hotspotY: v[0] ?? 0 }))
              }
              className="py-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Fallback cursor
            </Label>
            <Select
              value={state.fallback}
              onValueChange={(v) =>
                setState((s) => ({ ...s, fallback: v }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FALLBACK_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Generated CSS */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Generated CSS
        </Label>
        <div className="flex items-stretch gap-2">
          <pre
            className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground"
          >
            {generatedCss || (
              <span className="text-muted-foreground">
                {/* placeholder while empty */}
                cursor: url(&apos;&apos;) 0 0, auto;
              </span>
            )}
          </pre>
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            disabled={!generatedCss}
            className="h-auto gap-1.5 self-stretch px-3 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function CursorPreviewGallery() {
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(
    () => new Set(CATEGORIES.map((c) => c.id)),
  );
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  // Per-category cursor counts (for the chip badges).
  const countsByCat = useMemo(() => {
    const m = new Map<CategoryId, number>();
    for (const c of CURSORS) m.set(c.category, (m.get(c.category) ?? 0) + 1);
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && activeCats.size === CATEGORIES.length) return CURSORS;
    return CURSORS.filter((c) => {
      if (!activeCats.has(c.category)) return false;
      if (!q) return true;
      return (
        c.value.toLowerCase().includes(q) ||
        categoryMeta(c.category).label.toLowerCase().includes(q)
      );
    });
  }, [query, activeCats]);

  const handleCopy = useCallback(async (value: string) => {
    const ok = await writeClipboard(cssFor(value));
    if (ok) {
      setCopiedValue(value);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => {
        setCopiedValue(null);
        copiedTimerRef.current = null;
      }, COPY_CONFIRM_MS);
    }
  }, []);

  // Clear the confirmation timer on unmount.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  const toggleCat = useCallback((id: CategoryId) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allActive = activeCats.size === CATEGORIES.length;
  const toggleAll = useCallback(() => {
    setActiveCats(
      allActive
        ? new Set()
        : new Set(CATEGORIES.map((c) => c.id)),
    );
  }, [allActive]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MousePointer2 className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            CSS Cursor Gallery
            <Sparkles className="size-3.5 text-primary" />
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Hover any card to preview the real cursor.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cursors or categories (pointer, resize, zoom…)"
          className="h-9 pl-9 text-sm"
          aria-label="Search cursors"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={toggleAll}
          aria-pressed={allActive}
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
            allActive
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
        >
          {allActive ? "All on" : "All off"}
        </button>
        {CATEGORIES.map((meta) => (
          <CategoryChip
            key={meta.id}
            meta={meta}
            active={activeCats.has(meta.id)}
            count={countsByCat.get(meta.id) ?? 0}
            onToggle={() => toggleCat(meta.id)}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {CURSORS.length}
        </span>
        <span>cursors</span>
        <span aria-hidden>·</span>
        <span className="font-medium tabular-nums text-foreground">
          {CATEGORIES.length}
        </span>
        <span>categories</span>
        <span aria-hidden>·</span>
        <span>showing</span>
        <span className="font-medium tabular-nums text-primary">
          {filtered.length}
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => (
              <motion.div
                key={entry.value}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <CursorCard
                  entry={entry}
                  copied={copiedValue === entry.value}
                  onCopy={handleCopy}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
          <Search className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No cursors match
          </p>
          <p className="text-[11px] text-muted-foreground">
            Try a different search term or enable more categories.
          </p>
        </div>
      )}

      {/* Custom cursor builder */}
      <Collapsible
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        className="rounded-xl border border-border bg-card"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Custom cursor builder
              </span>
              <Badge
                variant="outline"
                className="border-border bg-muted/50 text-[9px] text-muted-foreground"
              >
                url() + hotspot
              </Badge>
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                builderOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 py-4">
            <CustomCursorBuilder />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default CursorPreviewGallery;
