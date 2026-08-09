"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import {
  FileCode2,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Sparkles,
  Box,
  Type,
  List,
  Table,
  FormInput,
  Image,
  MousePointerClick,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * ResetBuilder — assemble a custom CSS reset from a curated checklist.
 *
 * A CSS reset (or "normalize") neutralises browser-default styles so
 * your design starts from a known baseline. This tool exposes ~20
 * commonly-needed reset rules grouped by category; toggle any subset
 * and copy the generated CSS.
 *
 * Features
 *  - 7 categories: Box Model, Typography, Lists, Tables, Forms, Media,
 *    Interactivity. Each rule has a name, the CSS snippet, and a short
 *    description.
 *  - Per-rule checkbox + per-category "select all" checkbox.
 *  - Live preview: a before/after comparison rendered inside two
 *    iframes — "Default browser styles" vs "With your reset" — so you
 *    can see exactly what each rule changes.
 *  - Generated CSS: `:root`-free, ready to drop into a `reset.css`
 *    file. Copy button.
 *  - 3 presets: Minimal reset, Modern reset, Complete reset.
 *  - Stats: "N rules selected · ~X bytes".
 *
 * Constraints: TS strict, no `any`, no console.log, memoized,
 * semantic theme tokens, responsive within max-w-2xl.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type CategoryId =
  | "box-model"
  | "typography"
  | "lists"
  | "tables"
  | "forms"
  | "media"
  | "interactivity";

interface RuleDef {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  css: string;
}

interface CategoryDef {
  id: CategoryId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

type PresetKey = "minimal" | "modern" | "complete";

// ─── Constants ────────────────────────────────────────────────────────────

const CATEGORIES: CategoryDef[] = [
  { id: "box-model", label: "Box Model", Icon: Box },
  { id: "typography", label: "Typography", Icon: Type },
  { id: "lists", label: "Lists", Icon: List },
  { id: "tables", label: "Tables", Icon: Table },
  { id: "forms", label: "Forms", Icon: FormInput },
  { id: "media", label: "Media", Icon: Image },
  { id: "interactivity", label: "Interactivity", Icon: MousePointerClick },
];

const RULES: RuleDef[] = [
  // ─── Box Model ──────────────────────────────────────────────────────
  {
    id: "box-sizing",
    category: "box-model",
    name: "box-sizing: border-box",
    description:
      "Padding and borders count toward an element's width — no more layout surprises.",
    css: `*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}`,
  },
  {
    id: "margin-reset",
    category: "box-model",
    name: "Margin reset",
    description: "Strip the browser default margin on every element.",
    css: `* {\n  margin: 0;\n}`,
  },
  {
    id: "padding-reset",
    category: "box-model",
    name: "Padding reset",
    description: "Strip the browser default padding on every element.",
    css: `* {\n  padding: 0;\n}`,
  },
  // ─── Typography ─────────────────────────────────────────────────────
  {
    id: "font-family",
    category: "typography",
    name: "Default font-family",
    description: "System UI stack for consistent rendering across OSes.",
    css: `html {\n  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;\n}`,
  },
  {
    id: "font-size",
    category: "typography",
    name: "Root font-size",
    description: "Set a sensible default so 1rem ≈ 16px (or your chosen base).",
    css: `html {\n  font-size: 100%;\n}`,
  },
  {
    id: "line-height",
    category: "typography",
    name: "Line-height",
    description: "A 1.5 line-height improves readability for body copy.",
    css: `body {\n  line-height: 1.5;\n}`,
  },
  {
    id: "text-rendering",
    category: "typography",
    name: "Text rendering",
    description: "Optimize legibility on WebKit / Blink.",
    css: `body {\n  -webkit-font-smoothing: antialiased;\n  text-rendering: optimizeLegibility;\n}`,
  },
  {
    id: "font-weight-headings",
    category: "typography",
    name: "Heading weight reset",
    description: "Headings inherit body weight so you set it explicitly.",
    css: `h1, h2, h3, h4, h5, h6 {\n  font-weight: inherit;\n}`,
  },
  // ─── Lists ──────────────────────────────────────────────────────────
  {
    id: "list-style",
    category: "lists",
    name: "List-style: none",
    description: "Drop bullets / numbers from lists (re-add per-component).",
    css: `ol, ul {\n  list-style: none;\n}`,
  },
  // ─── Tables ─────────────────────────────────────────────────────────
  {
    id: "border-collapse",
    category: "tables",
    name: "Border-collapse",
    description: "Collapse table borders for predictable styling.",
    css: `table {\n  border-collapse: collapse;\n}`,
  },
  // ─── Forms ──────────────────────────────────────────────────────────
  {
    id: "font-inherit",
    category: "forms",
    name: "Font: inherit",
    description: "Form controls inherit the document font by default.",
    css: `input, button, textarea, select {\n  font: inherit;\n}`,
  },
  {
    id: "appearance-none",
    category: "forms",
    name: "Appearance: none",
    description: "Strip native widget chrome — you style the controls.",
    css: `input, button, textarea, select {\n  appearance: none;\n}`,
  },
  {
    id: "color-inherit",
    category: "forms",
    name: "Color: inherit",
    description: "Form text inherits the document color.",
    css: `input, button, textarea, select {\n  color: inherit;\n}`,
  },
  // ─── Media ──────────────────────────────────────────────────────────
  {
    id: "max-width",
    category: "media",
    name: "Media max-width: 100%",
    description: "Responsive images / videos never overflow their container.",
    css: `img, video, svg, canvas {\n  max-width: 100%;\n  height: auto;\n}`,
  },
  {
    id: "vertical-align",
    category: "media",
    name: "Vertical-align: middle",
    description: "Avoid the inline-image descender gap.",
    css: `img, svg, video {\n  vertical-align: middle;\n}`,
  },
  {
    id: "display-block",
    category: "media",
    name: "Display: block (img/svg/video)",
    description: "Treat media as block by default — predictable margins.",
    css: `img, svg, video {\n  display: block;\n}`,
  },
  // ─── Interactivity ──────────────────────────────────────────────────
  {
    id: "touch-action",
    category: "interactivity",
    name: "touch-action: manipulation",
    description: "Remove the 300ms tap delay on touch devices.",
    css: `html {\n  touch-action: manipulation;\n}`,
  },
  {
    id: "tap-highlight",
    category: "interactivity",
    name: "Tap-highlight-color: transparent",
    description: "Remove the gray iOS tap-flash on links/buttons.",
    css: `html {\n  -webkit-tap-highlight-color: transparent;\n}`,
  },
  {
    id: "outline-none",
    category: "interactivity",
    name: "Outline reset (with :focus-visible)",
    description:
      "Drop default outlines, then re-add a clear one for keyboard focus.",
    css: `:focus { outline: none; }\n:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}`,
  },
];

const PRESETS: Record<PresetKey, { label: string; ruleIds: string[] }> = {
  minimal: {
    label: "Minimal",
    ruleIds: ["box-sizing", "margin-reset", "font-family"],
  },
  modern: {
    label: "Modern",
    ruleIds: [
      "box-sizing",
      "margin-reset",
      "padding-reset",
      "font-family",
      "font-size",
      "line-height",
      "text-rendering",
      "list-style",
      "border-collapse",
      "font-inherit",
      "max-width",
      "touch-action",
      "tap-highlight",
    ],
  },
  complete: {
    label: "Complete",
    ruleIds: RULES.map((r) => r.id),
  },
};

const DEFAULT_SELECTED_IDS: string[] = PRESETS.modern.ruleIds;
const COPY_CONFIRM_MS = 1500;

const PREVIEW_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 12px; }
  h1 { font-size: 18px; margin: 8px 0; }
  p { font-size: 13px; margin: 8px 0; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { font-size: 13px; margin: 4px 0; }
  button { padding: 4px 10px; }
  input { padding: 4px; }
  table { border: 1px solid #888; }
  td { border: 1px solid #888; padding: 4px; font-size: 12px; }
  img { width: 60px; }
</style></head>
<body>
  <h1>Heading</h1>
  <p>Paragraph with default browser margin.</p>
  <ul><li>List item</li><li>Another item</li></ul>
  <button>Button</button>
  <input placeholder="Input" />
  <table><tr><td>A</td><td>B</td></tr></table>
  <img src="https://placehold.co/60x40" alt="" />
</body></html>`;

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildResetCss(selectedIds: Set<string>): string {
  const lines: string[] = [];
  lines.push("/* Custom CSS reset — generated by RoyCSS Reset Builder */");
  lines.push("");
  let currentCat: CategoryId | null = null;
  for (const rule of RULES) {
    if (!selectedIds.has(rule.id)) continue;
    if (rule.category !== currentCat) {
      currentCat = rule.category;
      const cat = CATEGORIES.find((c) => c.id === currentCat);
      if (cat) {
        lines.push(`/* ── ${cat.label} ── */`);
      }
    }
    lines.push(rule.css);
    lines.push("");
  }
  // Trim trailing blank line
  if (lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

function byteSize(text: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text).length;
  }
  // Fallback: 1 char ≈ 1 byte (good enough for ASCII CSS)
  return text.length;
}

// ─── Component ────────────────────────────────────────────────────────────

export function ResetBuilder() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_IDS),
  );
  const [activePreset, setActivePreset] = useState<PresetKey | null>("modern");
  const [copied, setCopied] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<CategoryId>>(
    () => new Set(CATEGORIES.map((c) => c.id)),
  );
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Clear copy timer on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  /* ── Toggle a single rule ────────────────────────────────────────── */
  const toggleRule = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setActivePreset(null);
  }, []);

  /* ── Toggle a whole category ─────────────────────────────────────── */
  const toggleCategory = useCallback((catId: CategoryId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const catRules = RULES.filter((r) => r.category === catId);
      const allSelected = catRules.every((r) => next.has(r.id));
      if (allSelected) {
        for (const r of catRules) next.delete(r.id);
      } else {
        for (const r of catRules) next.add(r.id);
      }
      return next;
    });
    setActivePreset(null);
  }, []);

  /* ── Toggle category collapsible ─────────────────────────────────── */
  const toggleCategoryOpen = useCallback((catId: CategoryId) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }, []);

  /* ── Apply a preset ──────────────────────────────────────────────── */
  const applyPreset = useCallback((key: PresetKey) => {
    setSelectedIds(new Set(PRESETS[key].ruleIds));
    setActivePreset(key);
  }, []);

  /* ── Copy ────────────────────────────────────────────────────────── */
  const handleCopy = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  const reset = useCallback(() => {
    applyPreset("modern");
    setOpenCategories(new Set(CATEGORIES.map((c) => c.id)));
  }, [applyPreset]);

  /* ── Generated CSS (memoized) ────────────────────────────────────── */
  const generatedCss = useMemo(
    () => buildResetCss(selectedIds),
    [selectedIds],
  );

  /* ── Stats (memoized) ────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const count = selectedIds.size;
    const bytes = byteSize(generatedCss);
    return { count, bytes };
  }, [selectedIds, generatedCss]);

  /* ── Per-category selection state ────────────────────────────────── */
  const categoryState = useMemo(() => {
    const map = new Map<CategoryId, { total: number; selected: number }>();
    for (const cat of CATEGORIES) {
      const catRules = RULES.filter((r) => r.category === cat.id);
      const selected = catRules.filter((r) => selectedIds.has(r.id)).length;
      map.set(cat.id, { total: catRules.length, selected });
    }
    return map;
  }, [selectedIds]);

  /* ── Preview srcdoc (before & after) ─────────────────────────────── */
  const beforeSrcdoc = useMemo(() => PREVIEW_HTML, []);
  const afterSrcdoc = useMemo(() => {
    // Inject the generated reset CSS into the preview HTML, right after
    // the existing <style> open tag.
    return PREVIEW_HTML.replace(
      "<style>",
      `<style>\n/* === Your reset === */\n${generatedCss}\n/* === End reset === */\n`,
    );
  }, [generatedCss]);

  /* ── Iframe container style ─────────────────────────────────────── */
  const iframeStyle: CSSProperties = {
    width: "100%",
    height: 220,
    border: "none",
    background: "#ffffff",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileCode2 className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          CSS Reset Builder
        </h3>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Presets
        </Label>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={cn(
                "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                activePreset === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={activePreset === key}
            >
              <Layers className="size-3" />
              {PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Rule checklist (collapsible categories) */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Rules ({stats.count} / {RULES.length} selected)
        </Label>
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => {
            const state = categoryState.get(cat.id)!;
            const allSelected = state.selected === state.total;
            const someSelected = state.selected > 0 && !allSelected;
            const isOpen = openCategories.has(cat.id);
            const catRules = RULES.filter((r) => r.category === cat.id);
            return (
              <Collapsible
                key={cat.id}
                open={isOpen}
                onOpenChange={() => toggleCategoryOpen(cat.id)}
                className="rounded-md border border-border bg-card"
              >
                <div className="flex items-center gap-2 p-2">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => toggleCategory(cat.id)}
                    aria-label={`Toggle all ${cat.label} rules`}
                  />
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left"
                      aria-label={`Toggle ${cat.label} category`}
                    >
                      <cat.Icon className="size-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {cat.label}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {state.selected}/{state.total}
                      </Badge>
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="flex flex-col gap-1 border-t border-border p-2">
                    {catRules.map((rule) => (
                      <label
                        key={rule.id}
                        htmlFor={`rb-rule-${rule.id}`}
                        className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-muted/40"
                      >
                        <Checkbox
                          id={`rb-rule-${rule.id}`}
                          checked={selectedIds.has(rule.id)}
                          onCheckedChange={() => toggleRule(rule.id)}
                          className="mt-0.5"
                        />
                        <span className="flex flex-1 flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <code className="font-mono text-[10px] text-primary">
                              {rule.name}
                            </code>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {rule.description}
                          </span>
                          <code className="mt-1 block rounded bg-muted/60 p-1.5 font-mono text-[10px] leading-relaxed text-foreground">
                            {rule.css}
                          </code>
                        </span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3.5" /> Reset
        </Button>
      </div>

      {/* Before/After preview */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3" />
          Before / after preview
        </Label>
        <Tabs defaultValue="after">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="before" className="text-xs">
              Default browser styles
            </TabsTrigger>
            <TabsTrigger value="after" className="text-xs">
              With your reset
            </TabsTrigger>
          </TabsList>
          <TabsContent value="before" className="m-0 mt-2">
            <div className="overflow-hidden rounded-md border border-border">
              <iframe
                title="Default browser styles preview"
                srcDoc={beforeSrcdoc}
                sandbox="allow-same-origin"
                style={iframeStyle}
              />
            </div>
          </TabsContent>
          <TabsContent value="after" className="m-0 mt-2">
            <div className="overflow-hidden rounded-md border border-border">
              <iframe
                title="Reset styles preview"
                srcDoc={afterSrcdoc}
                sandbox="allow-same-origin"
                style={iframeStyle}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="secondary" className="text-[10px]">
          {stats.count} rules
        </Badge>
        <span>·</span>
        <Badge variant="secondary" className="text-[10px]">
          ~{stats.bytes} bytes
        </Badge>
      </div>

      {/* Generated CSS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Code2 className="size-3" />
            Generated CSS
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(generatedCss)}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>
    </div>
  );
}
