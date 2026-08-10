"use client";

/**
 * StyleQueryBuilder — CSS `@container style()` query playground.
 *
 * Container style queries (CSS Conditional Rules Module Level 5, Baseline
 * 2023) let a child element react to the *computed value* of a custom
 * property on its nearest container — independent of the container's size.
 * Unlike size queries, this lets you swap theme, density, or layout variant
 * by simply setting `--theme`, `--size`, `--mode` on a parent.
 *
 * This tool gives developers:
 *   1. A live demo container with `container-type: style` and three
 *      user-editable custom properties (`--theme`, `--size`, `--mode`).
 *   2. A query builder: pick a property, a comparison (`=` / `!=`), and a
 *      value → live-generated `@container style(--theme: dark) { ... }` rule.
 *   3. A live preview card whose appearance (background, padding, font-size)
 *      reflects both the container's current custom properties *and* the
 *      matching queries — toggled instantly via the property switches.
 *   4. The full generated CSS in a copyable code block, ready to drop into a
 *      stylesheet.
 *   5. Three presets that demonstrate real-world patterns (theme-switcher,
 *      responsive-card, mode-aware-list).
 *   6. A Baseline 2023 — limited browser-support badge (Chrome 111+,
 *      Firefox 110+, Safari 17.4+; partial support — Firefox requires
 *      `layout.css.container-queries.style-query.enabled`).
 *
 * Implementation notes:
 *   - The child card's appearance is computed in JS by evaluating the rules
 *     against the container's current custom-property values. This makes the
 *     preview work in *every* browser (not just those that implement
 *     style queries), while the generated CSS block shows the real syntax
 *     authors would use.
 *   - The container's custom properties are applied via inline `style`, so
 *     the same code path works whether or not the browser supports style
 *     queries.
 *   - All state lives in this component — no props, no network, no external
 *     state stores.
 *   - TS strict, zero `any`, zero `console.log`. Responsive within
 *     `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Boxes,
  Copy,
  Check,
  Sparkles,
  Globe,
  Plus,
  Trash2,
  Container as ContainerIcon,
  Layers,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type ThemeValue = "light" | "dark";
type SizeValue = "sm" | "md" | "lg";
type ModeValue = "compact" | "spacious";

type CustomPropKey = "--theme" | "--size" | "--mode";

type Comparison = "=" | "!=";

interface ContainerState {
  theme: ThemeValue;
  size: SizeValue;
  mode: ModeValue;
}

interface QueryRule {
  id: string;
  prop: CustomPropKey;
  op: Comparison;
  value: string;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  container: ContainerState;
  rules: QueryRule[];
}

interface BrowserSupport {
  label: string;
  note: string;
  tone: "limited";
  versions: { browser: string; version: string }[];
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 1500;

const THEME_VALUES: ThemeValue[] = ["light", "dark"];
const SIZE_VALUES: SizeValue[] = ["sm", "md", "lg"];
const MODE_VALUES: ModeValue[] = ["compact", "spacious"];

const CUSTOM_PROPS: { key: CustomPropKey; label: string; values: readonly string[] }[] = [
  { key: "--theme", label: "--theme", values: THEME_VALUES },
  { key: "--size", label: "--size", values: SIZE_VALUES },
  { key: "--mode", label: "--mode", values: MODE_VALUES },
];

const COMPARISONS: { value: Comparison; label: string }[] = [
  { value: "=", label: "= (equals)" },
  { value: "!=", label: "!= (not equals)" },
];

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2023 — limited",
  note: "Partial support. Firefox behind a flag; Safari 17.4+ only.",
  tone: "limited",
  versions: [
    { browser: "Chrome", version: "111+" },
    { browser: "Edge", version: "111+" },
    { browser: "Firefox", version: "110+" },
    { browser: "Safari", version: "17.4+" },
    { browser: "Samsung", version: "22+" },
  ],
};

// Visual effect of each (prop, value) combination on the demo child card.
// These are intentionally simple, composable overrides.
interface ChildEffect {
  background?: string;
  color?: string;
  padding?: string;
  fontSize?: string;
  borderRadius?: string;
  border?: string;
  letterSpacing?: string;
}

const THEME_EFFECTS: Record<ThemeValue, ChildEffect> = {
  light: {
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
  },
  dark: {
    background: "#1f2937",
    color: "#f9fafb",
    border: "1px solid #374151",
  },
};

const SIZE_EFFECTS: Record<SizeValue, ChildEffect> = {
  sm: { padding: "0.5rem 0.75rem", fontSize: "0.8125rem" },
  md: { padding: "1rem 1.25rem", fontSize: "0.9375rem" },
  lg: { padding: "1.5rem 1.75rem", fontSize: "1.0625rem" },
};

const MODE_EFFECTS: Record<ModeValue, ChildEffect> = {
  compact: { letterSpacing: "0", borderRadius: "4px" },
  spacious: { letterSpacing: "0.01em", borderRadius: "12px" },
};

const PRESETS: Preset[] = [
  {
    id: "theme-switcher",
    label: "Theme switcher",
    description:
      "A container marks its theme; child card picks dark vs. light styling.",
    container: { theme: "dark", size: "md", mode: "spacious" },
    rules: [
      { id: "r1", prop: "--theme", op: "=", value: "dark" },
      { id: "r2", prop: "--theme", op: "=", value: "light" },
    ],
  },
  {
    id: "responsive-card",
    label: "Responsive card",
    description:
      "Swap padding + font-size based on the container's --size token.",
    container: { theme: "light", size: "lg", mode: "spacious" },
    rules: [
      { id: "r1", prop: "--size", op: "=", value: "sm" },
      { id: "r2", prop: "--size", op: "=", value: "md" },
      { id: "r3", prop: "--size", op: "=", value: "lg" },
    ],
  },
  {
    id: "mode-aware-list",
    label: "Mode-aware list",
    description:
      "Toggle between compact and spacious density with `!=` and `=` queries.",
    container: { theme: "dark", size: "md", mode: "compact" },
    rules: [
      { id: "r1", prop: "--mode", op: "=", value: "compact" },
      { id: "r2", prop: "--mode", op: "!=", value: "compact" },
    ],
  },
];

const DEFAULT_RULES: QueryRule[] = PRESETS[0]!.rules.map((r) => ({ ...r }));
const DEFAULT_CONTAINER: ContainerState = { ...PRESETS[0]!.container };

// ============================================================
// ID generator (stable enough for client-only UI keys)
// ============================================================

let __roycssSqIdCounter = 0;
function makeId(prefix: string): string {
  __roycssSqIdCounter += 1;
  return `${prefix}-${__roycssSqIdCounter.toString(36)}`;
}

// ============================================================
// Pure helpers
// ============================================================

const readContainerValue = (
  state: ContainerState,
  prop: CustomPropKey,
): string => {
  switch (prop) {
    case "--theme":
      return state.theme;
    case "--size":
      return state.size;
    case "--mode":
      return state.mode;
  }
};

/** True if `rule` currently matches `container`. */
const ruleMatches = (rule: QueryRule, container: ContainerState): boolean => {
  const actual = readContainerValue(container, rule.prop);
  return rule.op === "=" ? actual === rule.value : actual !== rule.value;
};

/**
 * Merge theme/size/mode effects into a single ChildEffect, applying any
 * matching query rules in declaration order. Later active rules win for the
 * same property (mirroring CSS cascade).
 */
const computeChildStyle = (
  container: ContainerState,
  rules: QueryRule[],
): ChildEffect => {
  // Base effect is always the container's own tokens.
  const base: ChildEffect = {
    ...THEME_EFFECTS[container.theme],
    ...SIZE_EFFECTS[container.size],
    ...MODE_EFFECTS[container.mode],
  };

  // Apply effects for each *matching* rule, in order.
  for (const rule of rules) {
    if (!ruleMatches(rule, container)) continue;
    const effect = effectForRule(rule);
    Object.assign(base, effect);
  }
  return base;
};

/** Map a query rule to the visual effect it produces on the demo child. */
const effectForRule = (rule: QueryRule): ChildEffect => {
  if (rule.prop === "--theme" && rule.value === "dark") {
    return THEME_EFFECTS.dark;
  }
  if (rule.prop === "--theme" && rule.value === "light") {
    return THEME_EFFECTS.light;
  }
  if (rule.prop === "--size") {
    return SIZE_EFFECTS[rule.value as SizeValue] ?? {};
  }
  if (rule.prop === "--mode") {
    return MODE_EFFECTS[rule.value as ModeValue] ?? {};
  }
  return {};
};

const childEffectToCss = (effect: ChildEffect): CSSProperties => ({
  backgroundColor: effect.background,
  color: effect.color,
  padding: effect.padding,
  fontSize: effect.fontSize,
  borderRadius: effect.borderRadius,
  border: effect.border,
  letterSpacing: effect.letterSpacing,
  transition: "all 200ms ease",
});

/** Generated `@container style()` CSS block as it would appear in a stylesheet. */
const buildGeneratedCss = (
  container: ContainerState,
  rules: QueryRule[],
): string => {
  const lines: string[] = [];
  lines.push("/* Container setup */");
  lines.push(".container {");
  lines.push("  container-type: style;");
  lines.push(`  --theme: ${container.theme};`);
  lines.push(`  --size: ${container.size};`);
  lines.push(`  --mode: ${container.mode};`);
  lines.push("}");
  lines.push("");
  lines.push(".child {");
  lines.push("  /* base styles */");
  lines.push("}");
  lines.push("");

  for (const rule of rules) {
    const opStr = rule.op === "=" ? ":" : " !=:";
    const selector = `@container style(${rule.prop}${opStr} ${rule.value})`;
    const effect = effectForRule(rule);
    lines.push(`${selector} {`);
    lines.push("  .child {");
    if (effect.background) lines.push(`    background: ${effect.background};`);
    if (effect.color) lines.push(`    color: ${effect.color};`);
    if (effect.padding) lines.push(`    padding: ${effect.padding};`);
    if (effect.fontSize) lines.push(`    font-size: ${effect.fontSize};`);
    if (effect.borderRadius) lines.push(`    border-radius: ${effect.borderRadius};`);
    if (effect.border) lines.push(`    border: ${effect.border};`);
    if (effect.letterSpacing)
      lines.push(`    letter-spacing: ${effect.letterSpacing};`);
    lines.push("  }");
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n").trimEnd();
};

// ============================================================
// Component
// ============================================================

export function StyleQueryBuilder() {
  const [container, setContainer] = useState<ContainerState>(DEFAULT_CONTAINER);
  const [rules, setRules] = useState<QueryRule[]>(DEFAULT_RULES);
  const [copied, setCopied] = useState<boolean>(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const flashCopied = useCallback(() => {
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  // ----- container mutation -----
  const setTheme = useCallback((theme: ThemeValue) => {
    setContainer((c) => ({ ...c, theme }));
  }, []);
  const setSize = useCallback((size: SizeValue) => {
    setContainer((c) => ({ ...c, size }));
  }, []);
  const setMode = useCallback((mode: ModeValue) => {
    setContainer((c) => ({ ...c, mode }));
  }, []);

  // ----- rule mutation -----
  const addRule = useCallback(() => {
    setRules((rs) => [
      ...rs,
      { id: makeId("r"), prop: "--theme", op: "=", value: "dark" },
    ]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((rs) => rs.filter((r) => r.id !== id));
  }, []);

  const updateRule = useCallback(
    (id: string, patch: Partial<Omit<QueryRule, "id">>) => {
      setRules((rs) =>
        rs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setContainer({ ...preset.container });
    setRules(preset.rules.map((r) => ({ ...r })));
  }, []);

  // ----- derived -----
  const childEffect = useMemo(
    () => computeChildStyle(container, rules),
    [container, rules],
  );
  const childCss = useMemo(
    () => childEffectToCss(childEffect),
    [childEffect],
  );
  const generatedCss = useMemo(
    () => buildGeneratedCss(container, rules),
    [container, rules],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      flashCopied();
    } catch {
      /* clipboard may be unavailable; silently ignore */
    }
  }, [generatedCss, flashCopied]);

  // Container inline style — applies the custom properties to the demo
  // container so a real browser *could* evaluate `@container style()` rules.
  const containerStyle: CSSProperties = {
    containerType: "style",
    // Cast: React doesn't type custom properties on CSSProperties by default.
    ["--theme" as string]: container.theme,
    ["--size" as string]: container.size,
    ["--mode" as string]: container.mode,
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ContainerIcon className="size-5" />
              Style Query Builder
            </CardTitle>
            <CardDescription>
              Build <code className="font-mono text-xs">@container style()</code>{" "}
              queries that react to a container&apos;s custom-property values.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          >
            <Globe className="size-3" />
            {BROWSER_SUPPORT.label}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {BROWSER_SUPPORT.versions.map((v) => (
            <span key={v.browser}>
              {v.browser}{" "}
              <span className="font-mono text-foreground">{v.version}</span>
            </span>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {BROWSER_SUPPORT.note}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Presets
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => applyPreset(p)}
              >
                <Sparkles className="size-3.5" />
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Container controls */}
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <ContainerIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Container custom properties
            </span>
            <code className="font-mono text-[11px] text-muted-foreground">
              container-type: style
            </code>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* --theme */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                --theme
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={container.theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  aria-label="Toggle dark theme"
                />
                <span className="font-mono text-xs text-foreground">
                  {container.theme}
                </span>
              </div>
            </div>
            {/* --size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                --size
              </Label>
              <Select
                value={container.size}
                onValueChange={(v) => setSize(v as SizeValue)}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* --mode */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                --mode
              </Label>
              <Select
                value={container.mode}
                onValueChange={(v) => setMode(v as ModeValue)}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_VALUES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Live preview
          </Label>
          <div
            className="rounded-lg border border-border bg-background p-5"
            style={containerStyle}
          >
            <div
              className="mx-auto max-w-sm shadow-sm"
              style={childCss}
            >
              <div className="font-semibold">Demo child card</div>
              <p className="mt-1 opacity-80">
                This card reacts to the container&apos;s{" "}
                <code className="font-mono">--theme</code>,{" "}
                <code className="font-mono">--size</code> and{" "}
                <code className="font-mono">--mode</code> tokens via the style
                queries you build below.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] opacity-70">
                <span>theme: {container.theme}</span>
                <span>·</span>
                <span>size: {container.size}</span>
                <span>·</span>
                <span>mode: {container.mode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Query rules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Boxes className="size-3.5" />
              Style queries
            </Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={addRule}
            >
              <Plus className="size-3.5" />
              Add query
            </Button>
          </div>
          <div className="space-y-2">
            {rules.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No style queries yet. Click &quot;Add query&quot; to build one.
              </div>
            ) : (
              rules.map((rule) => {
                const matched = ruleMatches(rule, container);
                const propMeta = CUSTOM_PROPS.find((p) => p.key === rule.prop)!;
                return (
                  <div
                    key={rule.id}
                    className={cn(
                      "flex flex-wrap items-center gap-2 rounded-md border p-2.5 transition-colors",
                      matched
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border bg-background",
                    )}
                  >
                    <code className="font-mono text-xs text-muted-foreground">
                      @container style(
                    </code>
                    <Select
                      value={rule.prop}
                      onValueChange={(v) =>
                        updateRule(rule.id, {
                          prop: v as CustomPropKey,
                          value:
                            CUSTOM_PROPS.find((p) => p.key === v)?.values[0] ??
                            "",
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOM_PROPS.map((p) => (
                          <SelectItem key={p.key} value={p.key}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={rule.op}
                      onValueChange={(v) =>
                        updateRule(rule.id, { op: v as Comparison })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPARISONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={rule.value}
                      onValueChange={(v) => updateRule(rule.id, { value: v })}
                    >
                      <SelectTrigger className="h-8 w-24 font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propMeta.values.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <code className="font-mono text-xs text-muted-foreground">
                      )
                    </code>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-auto h-5 px-1.5 text-[10px] font-semibold",
                        matched
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-muted-foreground/30 bg-muted text-muted-foreground",
                      )}
                    >
                      {matched ? "matches" : "no match"}
                    </Badge>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRule(rule.id)}
                      aria-label="Remove query"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Generated CSS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Layers className="size-3.5" />
              Generated CSS
            </Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleCopy}
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
          <pre className="max-h-72 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
            <code>{generatedCss}</code>
          </pre>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="size-3" />
            Drop this into any stylesheet that targets a parent with{" "}
            <code className="font-mono">container-type: style</code>. Browsers
            without style-query support will skip the{" "}
            <code className="font-mono">@container</code> blocks gracefully.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
