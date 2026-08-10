"use client";

/**
 * PropertyRegistrar — a CSS `@property` (Houdini) playground.
 *
 * The `@property` rule (CSS Properties and Values API, Baseline 2022) lets
 * authors register a custom property with a typed syntax, an inheritance
 * flag, and an initial value:
 *
 *   @property --my-color {
 *     syntax: "<color>";
 *     inherits: false;
 *     initial-value: #00ff00;
 *   }
 *
 * Registering a custom property unlocks three capabilities that plain
 * custom properties (declared with just `--foo: bar`) cannot provide:
 *
 *   1. **Animation & transitions.** The browser knows the value's type, so
 *      it can interpolate between two values. Plain custom properties are
 *      treated as untyped strings and jump discretely at the 50% point of
 *      a transition (you see no smooth animation).
 *   2. **Type checking.** Invalid values are rejected at parse time and
 *      the property falls back to its `initial-value`, instead of silently
 *      breaking the cascade.
 *   3. **Inheritance control.** You can opt a property OUT of inheritance
 *      with `inherits: false` — plain custom properties always inherit.
 *
 * This tool lets developers:
 *   - Define a custom property interactively (name, syntax, inherits,
 *     initial-value, hover-target).
 *   - See a live demo element using the property with a hover-driven
 *     transition.
 *   - Compare "With @property" (smooth interpolation) vs "Without
 *     @property" (instant discrete jump) side-by-side — the clearest
 *     demonstration of why typing matters.
 *   - Maintain a list of registered properties in the session (chips).
 *   - Load one of four presets (animated-color, gradient-angle,
 *     spacing-scale, opacity-fade).
 *   - Copy the generated CSS, ready to paste into a stylesheet.
 *
 * Implementation notes:
 *   - All CSS is injected via a single class-scoped `<style>` block whose
 *     prefix is derived from `useId()`, so the rules cannot leak onto the
 *     host page.
 *   - The "without @property" demo uses a separate unregistered property
 *     (`${name}-raw`) so the registered type cannot leak across.
 *   - TS strict, no `any`, no `console.log`. Self-contained (no props,
 *     no external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Copy,
  Check,
  Sparkles,
  Globe,
  Plus,
  Trash2,
  Zap,
  Type as TypeIcon,
  GitBranch,
  ShieldCheck,
  Wand2,
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

interface PropertyDef {
  name: string;
  syntax: string;
  inherits: boolean;
  initialValue: string;
  hoverValue: string;
}

interface SyntaxOption {
  value: string;
  label: string;
  description: string;
  initial: string;
  hover: string;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  def: PropertyDef;
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const SYNTAX_OPTIONS: SyntaxOption[] = [
  {
    value: "<color>",
    label: "<color>",
    description:
      "A color value — hex, rgb(), hsl(), oklch(), or a named color.",
    initial: "#00ff00",
    hover: "#ff0000",
  },
  {
    value: "<length>",
    label: "<length>",
    description: "A length — px, em, rem, vh, vw, ch, etc.",
    initial: "8px",
    hover: "32px",
  },
  {
    value: "<percentage>",
    label: "<percentage>",
    description: "A percentage value (0% or more).",
    initial: "25%",
    hover: "75%",
  },
  {
    value: "<length-percentage>",
    label: "<length-percentage>",
    description: "Either a length or a percentage.",
    initial: "8px",
    hover: "32px",
  },
  {
    value: "<number>",
    label: "<number>",
    description: "Any real number (decimals allowed).",
    initial: "1",
    hover: "0.2",
  },
  {
    value: "<integer>",
    label: "<integer>",
    description: "A whole number (no decimals).",
    initial: "1",
    hover: "3",
  },
  {
    value: "<angle>",
    label: "<angle>",
    description: "An angle — deg, rad, turn, grad.",
    initial: "0deg",
    hover: "180deg",
  },
  {
    value: "<time>",
    label: "<time>",
    description: "A duration — seconds (s) or milliseconds (ms).",
    initial: "0.3s",
    hover: "1.2s",
  },
  {
    value: "<resolution>",
    label: "<resolution>",
    description: "A resolution — dpi, dpcm, dppx.",
    initial: "96dpi",
    hover: "192dpi",
  },
  {
    value: "<url>",
    label: "<url>",
    description: "A URL reference (url(...)).",
    initial: "url(#)",
    hover: "url(#alt)",
  },
  {
    value: "*",
    label: "* (universal)",
    description:
      "Accepts any valid CSS value. Cannot have an initial-value.",
    initial: "",
    hover: "auto",
  },
];

const PRESETS: Preset[] = [
  {
    id: "animated-color",
    name: "Animated Color",
    description: "Background fades green → red on hover.",
    def: {
      name: "--my-color",
      syntax: "<color>",
      inherits: false,
      initialValue: "#00ff00",
      hoverValue: "#ff0000",
    },
  },
  {
    id: "gradient-angle",
    name: "Gradient Angle",
    description: "Linear-gradient rotates 0deg → 180deg smoothly.",
    def: {
      name: "--grad-angle",
      syntax: "<angle>",
      inherits: false,
      initialValue: "0deg",
      hoverValue: "180deg",
    },
  },
  {
    id: "spacing-scale",
    name: "Spacing Scale",
    description: "Padding animates 8px → 32px for a hover lift.",
    def: {
      name: "--space-md",
      syntax: "<length>",
      inherits: false,
      initialValue: "8px",
      hoverValue: "32px",
    },
  },
  {
    id: "opacity-fade",
    name: "Opacity Fade",
    description: "Opacity interpolates 1 → 0.2 (requires number type).",
    def: {
      name: "--fade",
      syntax: "<number>",
      inherits: false,
      initialValue: "1",
      hoverValue: "0.2",
    },
  },
];

// ============================================================
// Helpers
// ============================================================

function isNameValid(name: string): boolean {
  return /^--[a-zA-Z_][\w-]*$/.test(name.trim());
}

function syntaxOption(value: string): SyntaxOption {
  return SYNTAX_OPTIONS.find((o) => o.value === value) ?? SYNTAX_OPTIONS[0];
}

function isInitialValueValid(syntax: string, value: string): boolean {
  if (syntax === "*") return true; // universal syntax disallows initial-value
  return value.trim().length > 0;
}

function propertyRuleText(def: PropertyDef): string {
  const lines = [`@property ${def.name} {`];
  lines.push(`  syntax: "${def.syntax}";`);
  lines.push(`  inherits: ${def.inherits};`);
  if (def.syntax !== "*") {
    lines.push(`  initial-value: ${def.initialValue};`);
  }
  lines.push("}");
  return lines.join("\n");
}

/**
 * Returns the CSS declaration that uses the custom property in a way
 * appropriate to its syntax (so the demo element visibly reflects the
 * property's current value).
 */
function demoDeclaration(syntax: string, propName: string): string {
  switch (syntax) {
    case "<color>":
      return `background: var(${propName})`;
    case "<url>":
      return `background: var(${propName}) transparent`;
    case "<length>":
    case "<length-percentage>":
      return `padding: var(${propName})`;
    case "<percentage>":
      return `width: var(${propName}); height: 24px`;
    case "<angle>":
      return `background: linear-gradient(var(${propName}), #f43f5e, #22c55e)`;
    case "<number>":
    case "<integer>":
      return `opacity: var(${propName}); background: #22c55e`;
    case "<time>":
      return `background: #22c55e`;
    case "<resolution>":
      return `background: #f97316`;
    default:
      return `background: var(${propName})`;
  }
}

// ============================================================
// Component
// ============================================================

export function PropertyRegistrar() {
  const rawId = useId();
  // `useId` returns a string like ":r3:" — strip non-alphanumerics so the
  // result is safe to embed in a CSS class name.
  const scopeId = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const [name, setName] = useState("--my-color");
  const [syntax, setSyntax] = useState("<color>");
  const [inherits, setInherits] = useState(false);
  const [initialValue, setInitialValue] = useState("#00ff00");
  const [hoverValue, setHoverValue] = useState("#ff0000");
  const [registered, setRegistered] = useState<PropertyDef[]>([]);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameValid = isNameValid(name);
  const initialValid = isInitialValueValid(syntax, initialValue);
  const hoverValid = hoverValue.trim().length > 0;
  const formValid = nameValid && initialValid && hoverValid;

  const trimmedName = name.trim() || "--my-prop";
  const safeName = nameValid ? trimmedName : "--my-prop";
  const unregProp = `${safeName}-raw`;
  const currentHover = hoverValue.trim() || "initial";
  const currentInitial = initialValue.trim() || "initial";

  const currentDef: PropertyDef = {
    name: safeName,
    syntax,
    inherits,
    initialValue: currentInitial,
    hoverValue: currentHover,
  };

  // Injected stylesheet: every registered chip's @property rule, the
  // current form's @property rule, and the two demo boxes' CSS.
  const injectedCss = useMemo(() => {
    const blocks: string[] = [];
    for (const r of registered) {
      blocks.push(propertyRuleText(r));
      blocks.push("");
    }
    if (formValid) {
      blocks.push(propertyRuleText(currentDef));
      blocks.push("");
    }
    const withClass = `.pr-${scopeId}-with`;
    const withoutClass = `.pr-${scopeId}-without`;
    const demoDeclWith = demoDeclaration(syntax, safeName);
    const demoDeclWithout = demoDeclaration(syntax, unregProp);
    blocks.push(
      `${withClass} { ${demoDeclWith}; transition: ${safeName} 0.5s ease; border-radius: 8px; height: 96px; border: 1px solid color-mix(in srgb, var(--foreground, #000) 10%, transparent); }`,
    );
    blocks.push(`${withClass}:hover { ${safeName}: ${currentHover}; }`);
    blocks.push(
      `${withoutClass} { ${demoDeclWithout}; transition: ${unregProp} 0.5s ease; border-radius: 8px; height: 96px; border: 1px solid color-mix(in srgb, var(--foreground, #000) 10%, transparent); }`,
    );
    blocks.push(`${withoutClass}:hover { ${unregProp}: ${currentHover}; }`);
    return blocks.join("\n");
  }, [
    registered,
    formValid,
    currentDef,
    scopeId,
    syntax,
    safeName,
    unregProp,
    currentHover,
  ]);

  // Generated CSS for the copy button — clean, ready-to-paste.
  const generatedCss = useMemo(() => {
    const blocks: string[] = [];
    for (const r of registered) {
      blocks.push(propertyRuleText(r));
      blocks.push("");
    }
    if (formValid) {
      blocks.push(propertyRuleText(currentDef));
      blocks.push("");
    }
    const demoDecl = demoDeclaration(syntax, safeName);
    blocks.push(`.box { ${demoDecl}; transition: ${safeName} 0.3s; }`);
    blocks.push(`.box:hover { ${safeName}: ${currentHover}; }`);
    return blocks.join("\n");
  }, [registered, formValid, currentDef, syntax, safeName, currentHover]);

  const handleSyntaxChange = (next: string) => {
    const opt = syntaxOption(next);
    setSyntax(next);
    setInitialValue(opt.initial);
    setHoverValue(opt.hover);
  };

  const handlePreset = (def: PropertyDef) => {
    setName(def.name);
    setSyntax(def.syntax);
    setInherits(def.inherits);
    setInitialValue(def.initialValue);
    setHoverValue(def.hoverValue);
  };

  const handleRegister = () => {
    if (!formValid) return;
    if (registered.some((r) => r.name === safeName)) return;
    setRegistered((prev) => [...prev, currentDef]);
  };

  const handleRemove = (n: string) => {
    setRegistered((prev) => prev.filter((r) => r.name !== n));
  };

  const handleLoadChip = (def: PropertyDef) => {
    setName(def.name);
    setSyntax(def.syntax);
    setInherits(def.inherits);
    setInitialValue(def.initialValue);
    setHoverValue(def.hoverValue);
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }, [generatedCss]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const unregInlineStyle = {
    [unregProp]: currentInitial,
  } as CSSProperties;

  const currentSyntaxOption = syntaxOption(syntax);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <style>{injectedCss}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="size-5 text-primary" />
                Property Registrar
              </CardTitle>
              <CardDescription>
                Register typed custom properties with{" "}
                <code className="font-mono text-xs">@property</code> (Houdini,
                Baseline 2022). Type your custom property, then watch
                transitions animate smoothly — something plain custom
                properties cannot do.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Globe className="size-3" /> Baseline 2022
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ── Form ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Define the property</CardTitle>
          <CardDescription>
            Pick a name, a typed syntax, an inheritance flag, an initial value,
            and the value to transition to on hover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pr-name">Property name</Label>
            <Input
              id="pr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="--my-color"
              className={cn("font-mono", !nameValid && "border-destructive")}
              aria-invalid={!nameValid}
            />
            <p
              className={cn(
                "text-xs",
                nameValid ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {nameValid
                ? "Must start with -- and use letters, digits, - or _."
                : "Names must start with -- followed by a letter or underscore."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Syntax</Label>
            <Select value={syntax} onValueChange={handleSyntaxChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNTAX_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {currentSyntaxOption.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="pr-inherits">Inherits</Label>
              <p className="text-xs text-muted-foreground">
                Whether descendant elements inherit this property&apos;s value.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {inherits ? "true" : "false"}
              </span>
              <Switch
                id="pr-inherits"
                checked={inherits}
                onCheckedChange={setInherits}
                aria-label="Toggle inheritance"
              />
            </div>
          </div>

          {syntax !== "*" && (
            <div className="space-y-2">
              <Label htmlFor="pr-initial">Initial value</Label>
              <Input
                id="pr-initial"
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
                placeholder={currentSyntaxOption.initial}
                className={cn(
                  "font-mono",
                  !initialValid && "border-destructive",
                )}
                aria-invalid={!initialValid}
              />
              <p
                className={cn(
                  "text-xs",
                  initialValid ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {initialValid
                  ? "The fallback value when the property is not explicitly set."
                  : "Initial value cannot be empty."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pr-hover">Hover target value</Label>
            <Input
              id="pr-hover"
              value={hoverValue}
              onChange={(e) => setHoverValue(e.target.value)}
              placeholder={currentSyntaxOption.hover}
              className={cn(
                "font-mono",
                !hoverValid && "border-destructive",
              )}
              aria-invalid={!hoverValid}
            />
            <p className="text-xs text-muted-foreground">
              The value the property transitions to on hover. Demonstrates the
              key benefit of typing.
            </p>
          </div>

          <Button
            onClick={handleRegister}
            disabled={!formValid}
            className="w-full gap-2"
          >
            <Plus className="size-4" /> Register property
          </Button>
        </CardContent>
      </Card>

      {/* ── Preview ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live preview</CardTitle>
          <CardDescription>
            Hover each box. The <strong>With @property</strong> box interpolates
            smoothly. The <strong>Without @property</strong> box jumps instantly
            because the browser does not know the value&apos;s type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge className="gap-1">
                <ShieldCheck className="size-3" /> With @property
              </Badge>
              <div className={`pr-${scopeId}-with`} />
              <p className="text-xs text-muted-foreground">
                Typed → browser interpolates between values.
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="gap-1">
                <Zap className="size-3" /> Without @property
              </Badge>
              <div
                className={`pr-${scopeId}-without`}
                style={unregInlineStyle}
              />
              <p className="text-xs text-muted-foreground">
                Untyped → discrete jump at 50% of the transition.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Registered chips ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered in this session</CardTitle>
          <CardDescription>
            Click a chip to load it back into the form. The injected stylesheet
            includes every registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No properties registered yet. Click{" "}
              <strong>Register property</strong> above to add one.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {registered.map((r) => (
                <li key={r.name}>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 py-1.5 pl-2 pr-1 font-mono text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadChip(r)}
                      className="text-left"
                      title="Load into form"
                    >
                      {r.name}
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{r.syntax}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(r.name)}
                      className="ml-1 rounded p-0.5 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${r.name}`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Presets ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presets</CardTitle>
          <CardDescription>
            One-click starting points demonstrating each syntax type.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset.def)}
              className="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="font-medium">{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Output ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">Generated CSS</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
            <code>{generatedCss}</code>
          </pre>
        </CardContent>
      </Card>

      {/* ── Browser support ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browser support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Globe className="size-3" /> Baseline 2022
            </Badge>
            <Badge variant="outline">Chrome 85+</Badge>
            <Badge variant="outline">Edge 85+</Badge>
            <Badge variant="outline">Safari 16.4+</Badge>
            <Badge variant="outline">Firefox 128+</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Firefox shipped <code className="font-mono">@property</code> in
            version 128 (July 2024). Earlier versions ignored the rule entirely
            — custom properties still worked, but without typing, transitions,
            or initial-value fallback.
          </p>
        </CardContent>
      </Card>

      {/* ── Why @property matters ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why @property matters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Zap className="size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Enables animation &amp; transitions</p>
              <p className="text-sm text-muted-foreground">
                The browser needs to know a value&apos;s type to interpolate
                between two values. Plain{" "}
                <code className="font-mono">--foo: red</code> is treated as an
                untyped string and jumps discretely;{" "}
                <code className="font-mono">@property</code> with{" "}
                <code className="font-mono">syntax: &quot;&lt;color&gt;&quot;</code>{" "}
                makes <code className="font-mono">transition: --foo 0.3s</code>{" "}
                actually animate.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TypeIcon className="size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Type checking</p>
              <p className="text-sm text-muted-foreground">
                Invalid values are rejected at parse time and the property
                falls back to its{" "}
                <code className="font-mono">initial-value</code>, instead of
                silently breaking the cascade with a stray string.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <GitBranch className="size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Inheritance control</p>
              <p className="text-sm text-muted-foreground">
                Plain custom properties always inherit.{" "}
                <code className="font-mono">@property</code> lets you opt out
                with <code className="font-mono">inherits: false</code> —
                essential for component-scoped design tokens that should not
                bleed into descendants.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
