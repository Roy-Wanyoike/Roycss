"use client";

/**
 * EffectCombinationStudio — layer multiple RoyCSS effects on a single
 * element and preview the combined result, in real time.
 *
 * Workflow:
 *   1. Search the full 1,869-effect RoyCSS library by name, tag or category.
 *      Filtered results are capped at 80 rows for render perf.
 *   2. Click an effect to push it onto the "Selected layers" stack.
 *   3. Reorder layers with up/down buttons, toggle each layer on/off to see
 *      its impact, or remove a layer entirely.
 *   4. A live preview renders every enabled effect's CSS on a single demo
 *      element. Styles are scoped (each `.roycss-*` selector gains a second
 *      `.scope` class so rules only match the preview element) — host page
 *      cannot be polluted.
 *   5. The generated combined CSS (unscoped, copy-ready) is shown beside the
 *      preview with a Copy button.
 *
 * Implementation notes:
 *   - All data is local. The 1,869-effect import is bundled statically but
 *     search results are sliced to 80 rows to keep React renders cheap.
 *   - Effect ordering matters: later layers override earlier ones for any
 *     shared property (per the standard cascade, with equal specificity).
 *   - Clipboard writes are best-effort. Copy timer tracked via `useRef` and
 *     cleared on unmount.
 *   - TS strict, no `any`, no `console.log`. Self-contained, no props.
 *   - Responsive within `max-w-6xl`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Search,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Layers,
  Eye,
  EyeOff,
  Sparkles,
  Code2,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { effects, type CSSEffect } from "@/lib/roycss-effects";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;
const SEARCH_RESULT_CAP = 80;

const STARTER_IDS: string[] = ["pulse-glow", "fade-in-up"];

// ============================================================
// Types
// ============================================================

interface SelectedLayer {
  /** Stable unique React key for the layer slot. */
  key: string;
  effectId: string;
  enabled: boolean;
}

// ============================================================
// Helpers
// ============================================================

let __ecsCounter = 0;
function makeLayerKey(): string {
  __ecsCounter += 1;
  return `ecs-layer-${__ecsCounter.toString(36)}`;
}

/**
 * Append `.{scope}` to every `.roycss-<name>` selector in the source so the
 * rule only matches elements carrying BOTH classes. `@keyframes` etc. are
 * left alone because they're referenced by name.
 */
function scopeEffectCss(css: string, scope: string): string {
  return css.replace(/\.roycss-[\w-]+/g, (m) => `${m}.${scope}`);
}

/** Extract the first `.roycss-<name>` class from an effect's cssCode. */
function primaryEffectClass(effect: CSSEffect): string {
  const m = effect.cssCode.match(/\.roycss-([\w-]+)/);
  return m ? `roycss-${m[1]}` : "";
}

// ============================================================
// Component
// ============================================================

export function EffectCombinationStudio() {
  const [query, setQuery] = useState<string>("");
  const [layers, setLayers] = useState<SelectedLayer[]>(() =>
    STARTER_IDS.filter((id) => effects.some((e) => e.id === id)).map((id) => ({
      key: makeLayerKey(),
      effectId: id,
      enabled: true,
    })),
  );
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawId = useId();
  const scope = useMemo(
    () => `roycss-ecs-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`,
    [rawId],
  );

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  // Search results — capped for perf.
  const filtered = useMemo<CSSEffect[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return effects.slice(0, SEARCH_RESULT_CAP);
    const out: CSSEffect[] = [];
    for (const e of effects) {
      if (out.length >= SEARCH_RESULT_CAP) break;
      if (
        e.name.toLowerCase().includes(q) ||
        e.id.includes(q) ||
        e.category.includes(q) ||
        e.tags.some((t) => t.includes(q))
      ) {
        out.push(e);
      }
    }
    return out;
  }, [query]);

  // Resolve layers → CSSEffect (in render order).
  const resolvedLayers = useMemo(() => {
    const out: Array<{ layer: SelectedLayer; effect: CSSEffect | undefined }> =
      [];
    for (const layer of layers) {
      const effect = effects.find((e) => e.id === layer.effectId);
      out.push({ layer, effect });
    }
    return out;
  }, [layers]);

  const enabledLayers = useMemo(
    () =>
      resolvedLayers.filter((l) => l.layer.enabled && l.effect !== undefined),
    [resolvedLayers],
  );

  // Generated combined CSS (unscoped, copy-ready).
  const combinedCss = useMemo(() => {
    if (enabledLayers.length === 0) return "";
    return enabledLayers
      .map((l) => l.effect!.cssCode)
      .join("\n\n");
  }, [enabledLayers]);

  // Scoped CSS for the live preview.
  const scopedCss = useMemo(() => {
    if (enabledLayers.length === 0) return "";
    return enabledLayers
      .map((l) => scopeEffectCss(l.effect!.cssCode, scope))
      .join("\n\n");
  }, [enabledLayers, scope]);

  // Preview element class — every enabled effect's primary roycss class
  // plus the scope class so the scoped CSS rules match.
  const previewClassName = useMemo(() => {
    const cls: string[] = [scope];
    for (const l of enabledLayers) {
      const c = primaryEffectClass(l.effect!);
      if (c) cls.push(c);
    }
    return cls.join(" ");
  }, [enabledLayers, scope]);

  // ── Actions ──────────────────────────────────────────────────────────

  const addLayer = useCallback((effectId: string) => {
    setLayers((prev) => {
      if (prev.some((l) => l.effectId === effectId)) return prev;
      return [...prev, { key: makeLayerKey(), effectId, enabled: true }];
    });
  }, []);

  const removeLayer = useCallback((key: string) => {
    setLayers((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const toggleLayer = useCallback((key: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.key === key ? { ...l, enabled: !l.enabled } : l)),
    );
  }, []);

  const moveLayer = useCallback((key: string, dir: -1 | 1) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setLayers([]), []);

  const handleCopy = useCallback(async () => {
    if (!combinedCss) return;
    try {
      await navigator.clipboard.writeText(combinedCss);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [combinedCss]);

  const enabledCount = enabledLayers.length;
  const totalCount = layers.length;

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="size-5 text-violet-600" />
          Effect Combination Studio
        </CardTitle>
        <CardDescription>
          Stack multiple RoyCSS effects on one element, reorder them, toggle
          each layer, and copy the combined CSS — live.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* Search & select */}
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">
                Search{" "}
                <span className="text-muted-foreground">
                  ({effects.length.toLocaleString()} effects)
                </span>
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, tag, or category…"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No effects match &ldquo;{query}&rdquo;.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filtered.map((e) => {
                    const already = layers.some((l) => l.effectId === e.id);
                    return (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {e.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] capitalize"
                            >
                              {e.category}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {e.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={already ? "secondary" : "outline"}
                          disabled={already}
                          onClick={() => addLayer(e.id)}
                          className="h-7 shrink-0 gap-1 px-2 text-xs"
                        >
                          {already ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Plus className="size-3.5" />
                          )}
                          {already ? "Added" : "Add"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {filtered.length === SEARCH_RESULT_CAP && (
              <p className="text-xs text-muted-foreground">
                Showing first {SEARCH_RESULT_CAP} matches — refine your search
                to see more.
              </p>
            )}
          </div>

          {/* Selected layers */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Selected layers{" "}
                <span className="text-muted-foreground">
                  ({enabledCount}/{totalCount} enabled)
                </span>
              </Label>
              {layers.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearAll}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                >
                  <X className="size-3.5" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              {layers.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No layers yet — add effects from the picker.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {resolvedLayers.map(({ layer, effect }, idx) => {
                    if (!effect) {
                      return (
                        <li
                          key={layer.key}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600"
                        >
                          Missing effect {layer.effectId}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLayer(layer.key)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </li>
                      );
                    }
                    return (
                      <li
                        key={layer.key}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2",
                          !layer.enabled && "opacity-50",
                        )}
                      >
                        <div className="flex flex-col">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            disabled={idx === 0}
                            onClick={() => moveLayer(layer.key, -1)}
                            aria-label="Move layer up"
                          >
                            <ChevronUp className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6"
                            disabled={idx === layers.length - 1}
                            onClick={() => moveLayer(layer.key, 1)}
                            aria-label="Move layer down"
                          >
                            <ChevronDown className="size-3.5" />
                          </Button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {effect.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] capitalize"
                            >
                              {effect.category}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {effect.description}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => toggleLayer(layer.key)}
                          aria-label={
                            layer.enabled ? "Disable layer" : "Enable layer"
                          }
                        >
                          {layer.enabled ? (
                            <Eye className="size-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => removeLayer(layer.key)}
                          aria-label="Remove layer"
                        >
                          <Trash2 className="size-3.5 text-red-600" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Preview + Generated CSS */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-xs">
              <Wand2 className="size-3.5 text-violet-600" />
              Live Preview
            </Label>
            <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
              <div
                className={previewClassName}
                style={{
                  padding: "1.5rem 2rem",
                  borderRadius: "0.75rem",
                  background: "#f4f4f5",
                  color: "#18181b",
                  fontFamily:
                    "ui-sans-serif, system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                RoyCSS Combined
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs">
                <Code2 className="size-3.5 text-zinc-500" />
                Generated CSS
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={!combinedCss}
                className="h-7 gap-1.5 text-xs"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
              {combinedCss || "—"}
            </pre>
          </div>
        </div>

        {enabledCount === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <Sparkles className="size-3.5" />
            Add and enable at least one effect to see a live preview and
            generated CSS.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EffectCombinationStudio;
