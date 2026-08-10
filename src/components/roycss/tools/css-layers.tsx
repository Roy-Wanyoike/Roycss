"use client";

/**
 * CSSLayersVisualizer — a self-contained CSS `@layer` (Cascade Layers)
 * visualizer.
 *
 * Cascade layers (Baseline 2022) let developers group CSS rules into named
 * layers and explicitly order which layer wins. Rules inside later-declared
 * layers override earlier ones, and *unlayered* rules win over ALL layered
 * rules — a deliberate inversion of the usual "specificity wins" model.
 *
 * This tool lets you:
 *   1. Add / rename / remove / reorder layers (e.g. `reset, framework,
 *      components, utilities`).
 *   2. For each layer, add CSS rules (selector + property:value).
 *   3. Add unlayered rules to prove they override every layer.
 *   4. Watch a live demo element resolve the cascade in real time.
 *   5. Read the generated CSS with `@layer name1, name2;` declarations.
 *   6. See a priority diagram (top = lowest priority, bottom = highest).
 *   7. Load one of three presets (Tailwind / Bootstrap / Custom).
 *   8. Copy the generated CSS to the clipboard.
 *
 * Implementation notes:
 *   - The live preview injects a `<style>` element scoped to a unique class
 *     (built from React's `useId`) so the rules cannot leak into the host
 *     page. All selectors are prefixed with `.<scope>` so they only match
 *     inside the preview pane.
 *   - Layer reordering moves the entry in the array — the first array entry
 *     is the lowest-priority layer, the last is the highest among layered.
 *   - TS strict, no `any`, no `console.log`. Self-contained, responsive
 *     within `max-w-2xl`.
 */

import {
  useCallback,
  useId,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Layers as LayersIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowDown,
  Code2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

// ============================================================
// Types
// ============================================================

interface CssRule {
  id: string;
  selector: string;
  property: string;
  value: string;
}

interface CascadeLayer {
  id: string;
  name: string;
  rules: CssRule[];
}

interface Preset {
  id: string;
  label: string;
  description: string;
  layers: CascadeLayer[];
  unlayered: CssRule[];
}

// ============================================================
// ID factory (stable for client-only keys)
// ============================================================

let __roycssLayersCounter = 0;
function makeId(prefix: string): string {
  __roycssLayersCounter += 1;
  return `${prefix}-${__roycssLayersCounter.toString(36)}`;
}

function makeRule(
  selector = ".demo",
  property = "color",
  value = "",
): CssRule {
  return { id: makeId("r"), selector, property, value };
}

function makeLayer(name: string, rules: CssRule[] = []): CascadeLayer {
  return { id: makeId("l"), name, rules };
}

// ============================================================
// Presets
// ============================================================

const PRESETS: Preset[] = [
  {
    id: "tailwind",
    label: "Tailwind-style",
    description: "theme · base · components · utilities",
    layers: [
      makeLayer("theme", [
        makeRule(".demo", "color", "var(--color-base, #111)"),
      ]),
      makeLayer("base", [
        makeRule(".demo", "background", "#f5f5f5"),
        makeRule(".demo", "padding", "8px 12px"),
      ]),
      makeLayer("components", [
        makeRule(".demo", "border-radius", "8px"),
        makeRule(".demo", "color", "#0066cc"),
      ]),
      makeLayer("utilities", [
        makeRule(".demo", "color", "#dc2626"),
        makeRule(".demo", "font-weight", "700"),
      ]),
    ],
    unlayered: [],
  },
  {
    id: "bootstrap",
    label: "Bootstrap-style",
    description: "reboot · base · layout · components · utilities",
    layers: [
      makeLayer("reboot", [
        makeRule(".demo", "margin", "0"),
        makeRule(".demo", "font-family", "system-ui"),
      ]),
      makeLayer("base", [
        makeRule(".demo", "background", "#fff"),
        makeRule(".demo", "color", "#212529"),
      ]),
      makeLayer("layout", [makeRule(".demo", "display", "block")]),
      makeLayer("components", [
        makeRule(".demo", "padding", "12px 16px"),
        makeRule(".demo", "border", "1px solid #dee2e6"),
        makeRule(".demo", "border-radius", "6px"),
      ]),
      makeLayer("utilities", [
        makeRule(".demo", "color", "#0d6efd"),
        makeRule(".demo", "font-weight", "600"),
      ]),
    ],
    unlayered: [],
  },
  {
    id: "custom",
    label: "Custom",
    description: "reset · framework · components · utilities · overrides + unlayered",
    layers: [
      makeLayer("reset", [
        makeRule(".demo", "margin", "0"),
        makeRule(".demo", "padding", "0"),
      ]),
      makeLayer("framework", [
        makeRule(".demo", "background", "#fafafa"),
        makeRule(".demo", "border", "1px solid #e5e7eb"),
      ]),
      makeLayer("components", [
        makeRule(".demo", "padding", "10px 14px"),
        makeRule(".demo", "border-radius", "4px"),
        makeRule(".demo", "color", "#374151"),
      ]),
      makeLayer("utilities", [
        makeRule(".demo", "font-weight", "500"),
        makeRule(".demo", "color", "#059669"),
      ]),
      makeLayer("overrides", [makeRule(".demo", "color", "#7c3aed")]),
    ],
    unlayered: [makeRule(".demo", "outline", "2px solid #ea580c")],
  },
];

// ============================================================
// CSS generation
// ============================================================

/**
 * Build the layered CSS source string. Selectors are prefixed with `.<scope>`
 * so they only apply inside the preview pane. Unlayered rules are appended
 * after all `@layer` blocks so they override layered rules per spec.
 */
function buildCss(
  layers: CascadeLayer[],
  unlayered: CssRule[],
  scope: string,
): string {
  const scopeSelector = (sel: string) => {
    const trimmed = sel.trim();
    if (!trimmed) return "";
    // Split on top-level commas so each sub-selector is scoped independently.
    return trimmed
      .split(",")
      .map((s) => `.${scope} ${s.trim()}`)
      .join(", ");
  };

  const parts: string[] = [];

  // Layer declaration statement (orders the layers).
  if (layers.length > 0) {
    parts.push(`@layer ${layers.map((l) => l.name).join(", ")};`);
    parts.push("");
  }

  // Each layer block.
  for (const layer of layers) {
    if (layer.rules.length === 0) {
      parts.push(`@layer ${layer.name} {}`);
      continue;
    }
    parts.push(`@layer ${layer.name} {`);
    for (const r of layer.rules) {
      const sel = scopeSelector(r.selector);
      const prop = r.property.trim();
      const val = r.value.trim();
      if (!sel || !prop || !val) continue;
      parts.push(`  ${sel} { ${prop}: ${val}; }`);
    }
    parts.push("}");
    parts.push("");
  }

  // Unlayered rules.
  if (unlayered.length > 0) {
    parts.push("/* Unlayered — overrides ALL layers */");
    for (const r of unlayered) {
      const sel = scopeSelector(r.selector);
      const prop = r.property.trim();
      const val = r.value.trim();
      if (!sel || !prop || !val) continue;
      parts.push(`${sel} { ${prop}: ${val}; }`);
    }
  }

  return parts.join("\n").trim();
}

// ============================================================
// Default initial state (Custom preset — most instructive)
// ============================================================

const INITIAL = PRESETS[2]!;

// ============================================================
// Sub-component: Rule row editor
// ============================================================

interface RuleRowProps {
  rule: CssRule;
  onChange: (id: string, patch: Partial<CssRule>) => void;
  onRemove: (id: string) => void;
}

function RuleRow({ rule, onChange, onRemove }: RuleRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Input
        value={rule.selector}
        onChange={(e) => onChange(rule.id, { selector: e.target.value })}
        placeholder=".demo"
        spellCheck={false}
        className="h-7 w-28 min-w-[100px] font-mono text-[11px]"
        aria-label="Selector"
      />
      <span className="text-muted-foreground/50 text-xs font-mono">{"{"}</span>
      <Input
        value={rule.property}
        onChange={(e) => onChange(rule.id, { property: e.target.value })}
        placeholder="color"
        spellCheck={false}
        className="h-7 w-24 min-w-[80px] font-mono text-[11px]"
        aria-label="Property"
      />
      <span className="text-muted-foreground/50 text-xs font-mono">:</span>
      <Input
        value={rule.value}
        onChange={(e) => onChange(rule.id, { value: e.target.value })}
        placeholder="red"
        spellCheck={false}
        className="h-7 flex-1 min-w-[80px] font-mono text-[11px]"
        aria-label="Value"
      />
      <span className="text-muted-foreground/50 text-xs font-mono">{"}"}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(rule.id)}
        aria-label="Remove rule"
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}

// ============================================================
// Sub-component: Layer card
// ============================================================

interface LayerCardProps {
  layer: CascadeLayer;
  index: number;
  total: number;
  onRename: (id: string, name: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAddRule: (id: string) => void;
  onChangeRule: (layerId: string, ruleId: string, patch: Partial<CssRule>) => void;
  onRemoveRule: (layerId: string, ruleId: string) => void;
}

function LayerCard({
  layer,
  index,
  total,
  onRename,
  onMove,
  onRemove,
  onAddRule,
  onChangeRule,
  onRemoveRule,
}: LayerCardProps) {
  const priorityLabel =
    index === 0
      ? "lowest priority"
      : index === total - 1
        ? "highest among layers"
        : `priority ${index + 1}`;

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="font-mono text-[10px] tabular-nums"
        >
          #{index + 1}
        </Badge>
        <Input
          value={layer.name}
          onChange={(e) => onRename(layer.id, e.target.value)}
          spellCheck={false}
          className="h-7 flex-1 min-w-[120px] font-mono text-xs"
          aria-label="Layer name"
        />
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onMove(layer.id, -1)}
            disabled={index === 0}
            aria-label="Move layer up (lower priority)"
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onMove(layer.id, 1)}
            disabled={index === total - 1}
            aria-label="Move layer down (higher priority)"
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(layer.id)}
            aria-label="Remove layer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {priorityLabel}
      </div>

      <div className="mt-2 space-y-1.5">
        {layer.rules.length === 0 ? (
          <p className="text-[11px] italic text-muted-foreground">
            No rules — add one below.
          </p>
        ) : (
          layer.rules.map((r) => (
            <RuleRow
              key={r.id}
              rule={r}
              onChange={(ruleId, patch) =>
                onChangeRule(layer.id, ruleId, patch)
              }
              onRemove={(ruleId) => onRemoveRule(layer.id, ruleId)}
            />
          ))
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-2 h-6 gap-1 px-2 text-[11px]"
        onClick={() => onAddRule(layer.id)}
      >
        <Plus className="size-3" />
        Add rule
      </Button>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function CSSLayersVisualizer() {
  const [layers, setLayers] = useState<CascadeLayer[]>(() =>
    INITIAL.layers.map((l) => ({
      ...l,
      id: makeId("l"),
      rules: l.rules.map((r) => ({ ...r, id: makeId("r") })),
    })),
  );
  const [unlayered, setUnlayered] = useState<CssRule[]>(() =>
    INITIAL.unlayered.map((r) => ({ ...r, id: makeId("r") })),
  );
  const [copied, setCopied] = useState(false);

  const rawId = useId();
  const scope = useMemo(
    () => `r${rawId.replace(/[^a-zA-Z0-9]/g, "")}layers`,
    [rawId],
  );

  // ── Layer operations ───────────────────────────────────────────────

  const addLayer = useCallback(() => {
    setLayers((prev) => [
      ...prev,
      makeLayer(`layer-${prev.length + 1}`, [makeRule()]),
    ]);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const renameLayer = useCallback((id: string, name: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l)),
    );
  }, []);

  const moveLayer = useCallback((id: string, dir: -1 | 1) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(idx, 1);
      if (!item) return prev;
      copy.splice(next, 0, item);
      return copy;
    });
  }, []);

  const addRuleToLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, rules: [...l.rules, makeRule()] } : l,
      ),
    );
  }, []);

  const changeRule = useCallback(
    (layerId: string, ruleId: string, patch: Partial<CssRule>) => {
      setLayers((prev) =>
        prev.map((l) =>
          l.id === layerId
            ? {
                ...l,
                rules: l.rules.map((r) =>
                  r.id === ruleId ? { ...r, ...patch } : r,
                ),
              }
            : l,
        ),
      );
    },
    [],
  );

  const removeRule = useCallback((layerId: string, ruleId: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layerId
          ? { ...l, rules: l.rules.filter((r) => r.id !== ruleId) }
          : l,
      ),
    );
  }, []);

  // ── Unlayered rule operations ───────────────────────────────────────

  const addUnlayeredRule = useCallback(() => {
    setUnlayered((prev) => [...prev, makeRule()]);
  }, []);

  const changeUnlayeredRule = useCallback(
    (ruleId: string, patch: Partial<CssRule>) => {
      setUnlayered((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const removeUnlayeredRule = useCallback((ruleId: string) => {
    setUnlayered((prev) => prev.filter((r) => r.id !== ruleId));
  }, []);

  // ── Preset loader ──────────────────────────────────────────────────

  const loadPreset = useCallback((preset: Preset) => {
    setLayers(
      preset.layers.map((l) => ({
        id: makeId("l"),
        name: l.name,
        rules: l.rules.map((r) => ({ ...r, id: makeId("r") })),
      })),
    );
    setUnlayered(
      preset.unlayered.map((r) => ({ ...r, id: makeId("r") })),
    );
  }, []);

  // ── Generated CSS ──────────────────────────────────────────────────

  const generatedCss = useMemo(
    () => buildCss(layers, unlayered, scope),
    [layers, unlayered, scope],
  );

  // ── Copy ───────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [generatedCss]);

  // ── Preview styles ─────────────────────────────────────────────────

  const previewContainerStyle = useMemo<CSSProperties>(
    () => ({
      padding: "16px",
      border: "1px dashed var(--border)",
      borderRadius: "8px",
      background: "var(--background)",
    }),
    [],
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <LayersIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            CSS Cascade Layers
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Visualise how{" "}
            <code className="font-mono text-foreground/80">@layer</code>{" "}
            reorders the cascade — later layers win, unlayered rules win over
            all.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => loadPreset(p)}
              title={p.description}
            >
              <Sparkles className="size-3" />
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Layer priority diagram */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Priority order
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            top = lowest · bottom = highest
          </div>
        </div>
        <div className="space-y-1">
          {layers.map((l, idx) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs"
              style={{
                opacity: 0.55 + (idx / Math.max(1, layers.length - 1)) * 0.45,
              }}
            >
              <span className="font-mono text-foreground">{l.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {l.rules.length} rule{l.rules.length === 1 ? "" : "s"}
              </span>
            </div>
          ))}
          {/* Unlayered row — highest priority */}
          <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs">
            <span className="font-mono text-primary">unlayered</span>
            <span className="text-[10px] uppercase tracking-wider text-primary/80">
              {unlayered.length} rule{unlayered.length === 1 ? "" : "s"} · wins
              over all
            </span>
          </div>
        </div>
      </div>

      {/* Layer cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Layers
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2.5 text-xs"
            onClick={addLayer}
          >
            <Plus className="size-3.5" />
            Add layer
          </Button>
        </div>
        {layers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
            No layers yet. Add one to start.
          </p>
        ) : (
          <div className="space-y-2">
            {layers.map((l, idx) => (
              <LayerCard
                key={l.id}
                layer={l}
                index={idx}
                total={layers.length}
                onRename={renameLayer}
                onMove={moveLayer}
                onRemove={removeLayer}
                onAddRule={addRuleToLayer}
                onChangeRule={changeRule}
                onRemoveRule={removeRule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unlayered rules */}
      <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <ArrowDown className="size-3.5" />
            Unlayered styles
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={addUnlayeredRule}
          >
            <Plus className="size-3" />
            Add rule
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          These rules are not in any layer and override{" "}
          <span className="font-semibold text-foreground">every</span>{" "}
          <code className="font-mono">@layer</code>, no matter the specificity.
        </p>
        {unlayered.length > 0 && (
          <div className="space-y-1.5">
            {unlayered.map((r) => (
              <RuleRow
                key={r.id}
                rule={r}
                onChange={changeUnlayeredRule}
                onRemove={removeUnlayeredRule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </div>
        <div className={scope} style={previewContainerStyle}>
          <style dangerouslySetInnerHTML={{ __html: generatedCss }} />
          <div className="demo rounded-md">Demo element</div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The cascade resolves to the last declared layer&apos;s value, then
          any unlayered rules override that. Watch the demo element change as
          you edit.
        </p>
      </div>

      {/* Generated CSS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Code2 className="size-3.5" />
            Generated CSS
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2.5 text-xs"
            onClick={handleCopy}
            aria-label="Copy generated CSS"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="max-h-[280px] overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground scrollbar-thin">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* Educational note */}
      <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Info className="size-3.5" />
          How cascade layers work
        </div>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">1. Origin:</span>{" "}
            all rules here are author normal — same origin.
          </li>
          <li>
            <span className="font-semibold text-foreground">2. Layer:</span>{" "}
            layered rules lose to unlayered rules; among layered rules, later
            layers win.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              3. Specificity:
            </span>{" "}
            only consulted <em>within</em> the same layer.
          </li>
          <li>
            <span className="font-semibold text-foreground">4. Order:</span>{" "}
            only consulted <em>within</em> the same layer when specificity ties.
          </li>
        </ul>
      </div>
    </div>
  );
}
