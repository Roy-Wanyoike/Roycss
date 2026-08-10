"use client";

/**
 * LightDarkExplorer — explore the CSS `light-dark()` color function.
 *
 * `light-dark(<light>, <dark>)` (Baseline 2024) is a color function that
 * picks its first or second argument based on the inherited
 * `color-scheme` value. It lets authors declare both themes for a
 * property in a single line:
 *
 *     .card { color: light-dark(#111, #eee); }
 *
 * …replacing the older, more verbose pattern of declaring CSS variables
 * for the light theme and overriding them inside a
 * `@media (prefers-color-scheme: dark)` block.
 *
 * Key advantages over the @media approach:
 *   - One declaration per property instead of two rule blocks.
 *   - Works per-element: a descendant with its own `color-scheme`
 *     overrides the page-level preference, so you can embed a "light
 *     island" inside a dark page (or vice-versa) for free.
 *   - No global variable juggling — colors travel with the rule.
 *
 * This tool gives developers a live playground:
 *   1. Toggle `color-scheme` between `light`, `dark`, and `light dark`
 *      (the last enables automatic switching).
 *   2. When automatic, flip the simulated `prefers-color-scheme` to
 *      watch the live preview switch instantly.
 *   3. Edit a palette of five semantic tokens (background, foreground,
 *      primary, muted, border) — each with a light value and a dark
 *      value, picked via native color inputs.
 *   4. Read the generated CSS for both the `light-dark()` approach
 *      and the legacy `@media (prefers-color-scheme: dark)` approach,
 *      side-by-side, to see the boilerplate difference.
 *   5. Load one of four curated palettes.
 *
 * Implementation notes:
 *   - Live preview uses real `light-dark()` calls on inline styles, plus
 *     a wrapper that sets `color-scheme` to the effective value.
 *   - The legacy comparison panel uses CSS variables that swap inside a
 *     wrapper class — simulating what an `@media` rule would do, but
 *     triggerable client-side without OS changes.
 *   - All CSS is injected via a single class-scoped `<style>` block whose
 *     prefix is derived from `useId()`, so the rules cannot leak onto
 *     the host page.
 *   - TypeScript strict, no `any`, no `console.log`. Self-contained (no
 *     props, no external state, no network). Responsive within
 *     `max-w-2xl`.
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
  Sun,
  Moon,
  Palette,
  Copy,
  Check,
  Globe,
  Info,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type ColorSchemeChoice = "light" | "dark" | "light dark";
type EffectiveScheme = "light" | "dark";

interface Token {
  id: string;
  label: string;
  /** Where this token is applied in the generated CSS. */
  usage: string;
  lightHex: string;
  darkHex: string;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  tokens: Token[];
}

interface BrowserSupport {
  label: string;
  versions: { browser: string; version: string }[];
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2024",
  versions: [
    { browser: "Chrome", version: "123+" },
    { browser: "Firefox", version: "120+" },
    { browser: "Safari", version: "17.5+" },
  ],
};

const COLOR_SCHEME_OPTIONS: { value: ColorSchemeChoice; label: string }[] = [
  { value: "light", label: "light" },
  { value: "dark", label: "dark" },
  { value: "light dark", label: "light dark (auto)" },
];

const DEFAULT_TOKENS: Token[] = [
  {
    id: "background",
    label: "background",
    usage: "background",
    lightHex: "#ffffff",
    darkHex: "#1a1a1a",
  },
  {
    id: "foreground",
    label: "foreground",
    usage: "color",
    lightHex: "#1a1a1a",
    darkHex: "#ffffff",
  },
  {
    id: "primary",
    label: "primary",
    usage: "button background",
    lightHex: "#9333ea",
    darkHex: "#c084fc",
  },
  {
    id: "muted",
    label: "muted",
    usage: "muted text color",
    lightHex: "#6b7280",
    darkHex: "#9ca3af",
  },
  {
    id: "border",
    label: "border",
    usage: "border-color",
    lightHex: "#e5e5e5",
    darkHex: "#333333",
  },
];

const PRESETS: Preset[] = [
  {
    id: "neutral-gray",
    label: "Neutral gray",
    description: "Pure monochrome — black on white / white on black.",
    tokens: [
      { id: "background", label: "background", usage: "background", lightHex: "#ffffff", darkHex: "#1a1a1a" },
      { id: "foreground", label: "foreground", usage: "color", lightHex: "#1a1a1a", darkHex: "#ffffff" },
      { id: "primary", label: "primary", usage: "button background", lightHex: "#525252", darkHex: "#a3a3a3" },
      { id: "muted", label: "muted", usage: "muted text color", lightHex: "#737373", darkHex: "#a3a3a3" },
      { id: "border", label: "border", usage: "border-color", lightHex: "#e5e5e5", darkHex: "#262626" },
    ],
  },
  {
    id: "warm-paper",
    label: "Warm paper",
    description: "Cream paper in light mode, espresso in dark mode.",
    tokens: [
      { id: "background", label: "background", usage: "background", lightHex: "#faf7f0", darkHex: "#1c1917" },
      { id: "foreground", label: "foreground", usage: "color", lightHex: "#1c1917", darkHex: "#faf7f0" },
      { id: "primary", label: "primary", usage: "button background", lightHex: "#b45309", darkHex: "#fbbf24" },
      { id: "muted", label: "muted", usage: "muted text color", lightHex: "#78716c", darkHex: "#d6d3d1" },
      { id: "border", label: "border", usage: "border-color", lightHex: "#e7e2d8", darkHex: "#44403c" },
    ],
  },
  {
    id: "cool-slate",
    label: "Cool slate",
    description: "Calm slate-blue neutrals with a teal accent.",
    tokens: [
      { id: "background", label: "background", usage: "background", lightHex: "#f8fafc", darkHex: "#0f172a" },
      { id: "foreground", label: "foreground", usage: "color", lightHex: "#0f172a", darkHex: "#f1f5f9" },
      { id: "primary", label: "primary", usage: "button background", lightHex: "#0d9488", darkHex: "#2dd4bf" },
      { id: "muted", label: "muted", usage: "muted text color", lightHex: "#64748b", darkHex: "#94a3b8" },
      { id: "border", label: "border", usage: "border-color", lightHex: "#e2e8f0", darkHex: "#1e293b" },
    ],
  },
  {
    id: "vibrant",
    label: "Vibrant",
    description: "High-contrast white / near-black with a hot pink accent.",
    tokens: [
      { id: "background", label: "background", usage: "background", lightHex: "#ffffff", darkHex: "#0a0a0a" },
      { id: "foreground", label: "foreground", usage: "color", lightHex: "#0a0a0a", darkHex: "#ffffff" },
      { id: "primary", label: "primary", usage: "button background", lightHex: "#db2777", darkHex: "#f472b6" },
      { id: "muted", label: "muted", usage: "muted text color", lightHex: "#737373", darkHex: "#a3a3a3" },
      { id: "border", label: "border", usage: "border-color", lightHex: "#e5e5e5", darkHex: "#262626" },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

function findToken(tokens: Token[], id: string): Token {
  const found = tokens.find((t) => t.id === id);
  if (found) return found;
  const fallback = DEFAULT_TOKENS.find((t) => t.id === id);
  if (fallback) return fallback;
  // Unreachable — every id used below is in DEFAULT_TOKENS.
  return DEFAULT_TOKENS[0];
}

/**
 * Validate that a hex string is a 3- or 6-digit CSS hex color.
 * Returns the cleaned value (with leading `#`) or null if invalid.
 */
function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("#")) return null;
  const hex = trimmed.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(hex) || /^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }
  return null;
}

// ============================================================
// Component
// ============================================================

export function LightDarkExplorer() {
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS);
  const [colorScheme, setColorScheme] =
    useState<ColorSchemeChoice>("light dark");
  const [simulatedScheme, setSimulatedScheme] =
    useState<EffectiveScheme>("light");
  const [activePreset, setActivePreset] = useState<string | null>("neutral-gray");
  const [copiedLightDark, setCopiedLightDark] = useState<boolean>(false);
  const [copiedMedia, setCopiedMedia] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutMediaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
      if (copyTimeoutMediaRef.current !== null)
        clearTimeout(copyTimeoutMediaRef.current);
    };
  }, []);

  const effectiveScheme: EffectiveScheme =
    colorScheme === "light dark" ? simulatedScheme : colorScheme;

  const applyPreset = useCallback((preset: Preset): void => {
    // Copy the token array so user edits don't mutate the preset.
    setTokens(preset.tokens.map((t) => ({ ...t })));
    setActivePreset(preset.id);
  }, []);

  const updateTokenColor = useCallback(
    (tokenId: string, side: "light" | "dark", hex: string): void => {
      setTokens((prev) =>
        prev.map((t) =>
          t.id === tokenId
            ? side === "light"
              ? { ...t, lightHex: hex }
              : { ...t, darkHex: hex }
            : t,
        ),
      );
      setActivePreset(null);
    },
    [],
  );

  // ── Derived: scoped class for the injected <style> ─────────────
  const rawId = useId();
  const scopeClass = useMemo(
    () => `ld-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`,
    [rawId],
  );

  // ── Derived: generated CSS using light-dark() ──────────────────
  const lightDarkCss = useMemo<string>(() => {
    const bg = findToken(tokens, "background");
    const fg = findToken(tokens, "foreground");
    const primary = findToken(tokens, "primary");
    const muted = findToken(tokens, "muted");
    const border = findToken(tokens, "border");
    const lines: string[] = [
      ":root {",
      "  color-scheme: light dark;",
      "}",
      "",
      ".card {",
      `  background: light-dark(${bg.lightHex}, ${bg.darkHex});`,
      `  color: light-dark(${fg.lightHex}, ${fg.darkHex});`,
      `  border-color: light-dark(${border.lightHex}, ${border.darkHex});`,
      "}",
      "",
      ".card .btn {",
      `  background: light-dark(${primary.lightHex}, ${primary.darkHex});`,
      `  color: light-dark(${bg.lightHex}, ${bg.darkHex});`,
      "}",
      "",
      ".card .muted {",
      `  color: light-dark(${muted.lightHex}, ${muted.darkHex});`,
      "}",
    ];
    return lines.join("\n");
  }, [tokens]);

  // ── Derived: legacy @media (prefers-color-scheme: dark) CSS ────
  const mediaCss = useMemo<string>(() => {
    const bg = findToken(tokens, "background");
    const fg = findToken(tokens, "foreground");
    const primary = findToken(tokens, "primary");
    const muted = findToken(tokens, "muted");
    const border = findToken(tokens, "border");
    const lines: string[] = [
      ":root {",
      "  color-scheme: light dark;",
      "}",
      "",
      "/* Light is the default */",
      ".card {",
      `  background: ${bg.lightHex};`,
      `  color: ${fg.lightHex};`,
      `  border-color: ${border.lightHex};`,
      "}",
      "",
      ".card .btn {",
      `  background: ${primary.lightHex};`,
      `  color: ${bg.lightHex};`,
      "}",
      "",
      ".card .muted {",
      `  color: ${muted.lightHex};`,
      "}",
      "",
      "@media (prefers-color-scheme: dark) {",
      "  .card {",
      `    background: ${bg.darkHex};`,
      `    color: ${fg.darkHex};`,
      `    border-color: ${border.darkHex};`,
      "  }",
      "",
      "  .card .btn {",
      `    background: ${primary.darkHex};`,
      `    color: ${bg.darkHex};`,
      "  }",
      "",
      "  .card .muted {",
      `    color: ${muted.darkHex};`,
      "  }",
      "}",
    ];
    return lines.join("\n");
  }, [tokens]);

  // ── Derived: injected CSS to power the legacy @media panel ─────
  // Simulates the @media switch with a wrapper class so the comparison
  // panel flips live when the simulated scheme changes.
  const injectedCss = useMemo<string>(() => {
    const bg = findToken(tokens, "background");
    const fg = findToken(tokens, "foreground");
    const primary = findToken(tokens, "primary");
    const muted = findToken(tokens, "muted");
    const border = findToken(tokens, "border");
    const lightVars = [
      `  --${scopeClass}-bg: ${bg.lightHex};`,
      `  --${scopeClass}-fg: ${fg.lightHex};`,
      `  --${scopeClass}-primary: ${primary.lightHex};`,
      `  --${scopeClass}-muted: ${muted.lightHex};`,
      `  --${scopeClass}-border: ${border.lightHex};`,
    ].join("\n");
    const darkVars = [
      `  --${scopeClass}-bg: ${bg.darkHex};`,
      `  --${scopeClass}-fg: ${fg.darkHex};`,
      `  --${scopeClass}-primary: ${primary.darkHex};`,
      `  --${scopeClass}-muted: ${muted.darkHex};`,
      `  --${scopeClass}-border: ${border.darkHex};`,
    ].join("\n");
    const cardRules = [
      `.${scopeClass}-media {`,
      lightVars,
      "}",
      `.${scopeClass}-media[data-sim="dark"] {`,
      darkVars,
      "}",
      `.${scopeClass}-media .ld-card {`,
      `  background: var(--${scopeClass}-bg);`,
      `  color: var(--${scopeClass}-fg);`,
      `  border-color: var(--${scopeClass}-border);`,
      "}",
      `.${scopeClass}-media .ld-btn {`,
      `  background: var(--${scopeClass}-primary);`,
      `  color: var(--${scopeClass}-bg);`,
      "}",
      `.${scopeClass}-media .ld-muted {`,
      `  color: var(--${scopeClass}-muted);`,
      "}",
    ].join("\n");
    return cardRules;
  }, [tokens, scopeClass]);

  // ── Derived: inline styles for the live light-dark() preview ──
  const livePreviewStyle = useMemo<CSSProperties>(() => {
    const bg = findToken(tokens, "background");
    const fg = findToken(tokens, "foreground");
    const border = findToken(tokens, "border");
    return {
      background: `light-dark(${bg.lightHex}, ${bg.darkHex})`,
      color: `light-dark(${fg.lightHex}, ${fg.darkHex})`,
      borderColor: `light-dark(${border.lightHex}, ${border.darkHex})`,
    };
  }, [tokens]);

  const liveButtonStyle = useMemo<CSSProperties>(() => {
    const primary = findToken(tokens, "primary");
    const bg = findToken(tokens, "background");
    return {
      background: `light-dark(${primary.lightHex}, ${primary.darkHex})`,
      color: `light-dark(${bg.lightHex}, ${bg.darkHex})`,
    } as CSSProperties;
  }, [tokens]);

  const liveMutedStyle = useMemo<CSSProperties>(() => {
    const muted = findToken(tokens, "muted");
    return { color: `light-dark(${muted.lightHex}, ${muted.darkHex})` };
  }, [tokens]);

  const handleCopyLightDark = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(lightDarkCss);
      setCopiedLightDark(true);
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedLightDark(false);
        copyTimeoutRef.current = null;
      }, COPY_CONFIRM_MS);
    } catch {
      // Clipboard API may be unavailable — no-op.
    }
  }, [lightDarkCss]);

  const handleCopyMedia = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(mediaCss);
      setCopiedMedia(true);
      if (copyTimeoutMediaRef.current !== null)
        clearTimeout(copyTimeoutMediaRef.current);
      copyTimeoutMediaRef.current = setTimeout(() => {
        setCopiedMedia(false);
        copyTimeoutMediaRef.current = null;
      }, COPY_CONFIRM_MS);
    } catch {
      // Clipboard API may be unavailable — no-op.
    }
  }, [mediaCss]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <style>{injectedCss}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="size-5" />
                <span>light-dark() Explorer</span>
              </CardTitle>
              <CardDescription>
                Pick a color based on the user&apos;s{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  color-scheme
                </code>{" "}
                preference — no more{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  @media (prefers-color-scheme: dark)
                </code>{" "}
                boilerplate.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Globe className="size-3" />
              {BROWSER_SUPPORT.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BROWSER_SUPPORT.versions.map((v) => (
              <Badge key={v.browser} variant="outline" className="gap-1">
                <span className="text-muted-foreground">{v.browser}</span>
                <span>{v.version}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Live preview + color-scheme controls ───────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="size-4" />
            <Moon className="size-4" />
            Live preview
          </CardTitle>
          <CardDescription>
            The card below uses real{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              light-dark()
            </code>{" "}
            calls. When{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              color-scheme: light dark
            </code>{" "}
            is set, flip the simulated OS preference to watch it switch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ld-cs">color-scheme</Label>
              <Select
                value={colorScheme}
                onValueChange={(v) => setColorScheme(v as ColorSchemeChoice)}
              >
                <SelectTrigger id="ld-cs" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Simulated preference</Label>
              <div className="flex h-9 items-center justify-between gap-3 rounded-md border px-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {simulatedScheme === "light" ? (
                    <>
                      <Sun className="size-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="size-4" />
                      Dark
                    </>
                  )}
                </span>
                <Switch
                  checked={simulatedScheme === "dark"}
                  disabled={colorScheme !== "light dark"}
                  onCheckedChange={(v) =>
                    setSimulatedScheme(v ? "dark" : "light")
                  }
                  aria-label="Toggle simulated prefers-color-scheme"
                />
              </div>
              {colorScheme !== "light dark" && (
                <p className="text-xs text-muted-foreground">
                  Enable{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    light dark
                  </code>{" "}
                  to make the simulated toggle take effect.
                </p>
              )}
            </div>
          </div>

          {/* The actual live preview using light-dark() */}
          <div
            className="rounded-lg border border-dashed p-4"
            style={{ colorScheme: effectiveScheme }}
            aria-label="Live preview using light-dark()"
          >
            <div
              className="rounded-md border p-4 shadow-sm"
              style={livePreviewStyle}
            >
              <p className="text-sm font-semibold">Card title</p>
              <p className="mt-1 text-xs" style={liveMutedStyle}>
                Muted description text — auto-switches color.
              </p>
              <button
                type="button"
                className="mt-3 rounded px-3 py-1 text-xs font-medium"
                style={liveButtonStyle}
              >
                Primary button
              </button>
            </div>
          </div>

          {/* The legacy comparison preview using CSS variables */}
          <div
            className={cn("rounded-lg border border-dashed p-4", scopeClass + "-media")}
            data-sim={effectiveScheme}
            aria-label="Live preview using @media (prefers-color-scheme: dark)"
          >
            <div className="ld-card rounded-md border p-4 shadow-sm">
              <p className="text-sm font-semibold">Card title</p>
              <p className="ld-muted mt-1 text-xs">
                Muted description text — switched via CSS variables.
              </p>
              <button
                type="button"
                className="ld-btn mt-3 rounded px-3 py-1 text-xs font-medium"
              >
                Primary button
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Both previews above are showing the{" "}
            <strong>{effectiveScheme}</strong> scheme. The top card uses{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              light-dark()
            </code>
            ; the bottom card uses the legacy CSS-variable +{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">@media</code>{" "}
            approach.
          </p>
        </CardContent>
      </Card>

      {/* ── Palette builder ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4" />
            Palette builder
          </CardTitle>
          <CardDescription>
            Define five semantic tokens — each with a light value and a dark
            value. The live preview and generated CSS update instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tokens.map((token) => (
            <TokenRow
              key={token.id}
              token={token}
              onChange={(side, hex) => updateTokenColor(token.id, side, hex)}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Presets ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presets</CardTitle>
          <CardDescription>
            Load a curated palette — each preset defines all five tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-md border p-3 text-left transition-colors hover:bg-accent",
                    isActive && "ring-2 ring-primary ring-offset-1",
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex -space-x-1">
                      {preset.tokens
                        .filter((t) => t.id === "primary" || t.id === "background")
                        .flatMap((t) => [
                          <span
                            key={`${t.id}-l`}
                            className="size-4 rounded-full border"
                            style={{ background: t.lightHex }}
                          />,
                          <span
                            key={`${t.id}-d`}
                            className="size-4 rounded-full border"
                            style={{ background: t.darkHex }}
                          />,
                        ])}
                    </span>
                    <span className="text-sm font-medium">{preset.label}</span>
                    {isActive && (
                      <Badge variant="secondary" className="px-1.5 py-0">
                        active
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Generated CSS — side-by-side comparison ────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            Generated CSS
          </CardTitle>
          <CardDescription>
            Side-by-side comparison: the same palette expressed two ways.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* With light-dark() */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="gap-1">
                  <Sparkles className="size-3" />
                  With light-dark()
                </Badge>
                <span className="text-xs text-muted-foreground">
                  One declaration per property.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLightDark}
                className="gap-2"
              >
                {copiedLightDark ? (
                  <>
                    <Check className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
              <code>{lightDarkCss}</code>
            </pre>
          </div>

          {/* With @media (prefers-color-scheme: dark) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Layers className="size-3" />
                  With @media (prefers-color-scheme: dark)
                </Badge>
                <span className="text-xs text-muted-foreground">
                  The old verbose way.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMedia}
                className="gap-2"
              >
                {copiedMedia ? (
                  <>
                    <Check className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
              <code>{mediaCss}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* ── Explanation ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" />
            Why light-dark()?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Before{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              light-dark()
            </code>
            , supporting both color schemes meant declaring every theme color
            twice: once as the default (light) value, then again inside a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              @media (prefers-color-scheme: dark)
            </code>{" "}
            block. The CSS doubled in size, the two declarations lived far
            apart in the file, and the override could only target the whole
            document — not a single sub-tree.
          </p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              light-dark()
            </code>{" "}
            reads the inherited{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              color-scheme
            </code>{" "}
            value and returns the matching color in a single declaration. Less
            boilerplate, less duplication, and the same source order.
          </p>
          <p>
            Crucially, because it respects the <em>inherited</em>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              color-scheme
            </code>
            , you can set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              color-scheme: light
            </code>{" "}
            on an individual element to embed a light island inside a dark
            page (or vice-versa). The{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">@media</code>{" "}
            approach cannot do this — media queries are document-global.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

interface TokenRowProps {
  token: Token;
  onChange: (side: "light" | "dark", hex: string) => void;
}

function TokenRow({ token, onChange }: TokenRowProps) {
  const [lightText, setLightText] = useState<string>(token.lightHex);
  const [darkText, setDarkText] = useState<string>(token.darkHex);
  const [lightError, setLightError] = useState<boolean>(false);
  const [darkError, setDarkError] = useState<boolean>(false);

  // React-recommended "adjust state during render" pattern: when the
  // parent token changes (e.g. a preset is loaded), reset the local
  // draft text and clear any validation errors. This avoids the
  // setState-in-effect anti-pattern.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevLight, setPrevLight] = useState<string>(token.lightHex);
  const [prevDark, setPrevDark] = useState<string>(token.darkHex);
  if (token.lightHex !== prevLight) {
    setPrevLight(token.lightHex);
    setLightText(token.lightHex);
    setLightError(false);
  }
  if (token.darkHex !== prevDark) {
    setPrevDark(token.darkHex);
    setDarkText(token.darkHex);
    setDarkError(false);
  }

  const commitLight = useCallback(
    (raw: string): void => {
      const normalized = normalizeHex(raw);
      if (normalized) {
        onChange("light", normalized);
        setLightText(normalized);
        setLightError(false);
      } else {
        setLightError(true);
      }
    },
    [onChange],
  );

  const commitDark = useCallback(
    (raw: string): void => {
      const normalized = normalizeHex(raw);
      if (normalized) {
        onChange("dark", normalized);
        setDarkText(normalized);
        setDarkError(false);
      } else {
        setDarkError(true);
      }
    },
    [onChange],
  );

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-[8rem_1fr_1fr]">
      <div className="flex flex-col justify-center">
        <span className="font-mono text-sm">{token.label}</span>
        <span className="text-xs text-muted-foreground">{token.usage}</span>
      </div>

      {/* Light value */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={token.lightHex}
          onChange={(e) => {
            setLightText(e.target.value);
            onChange("light", e.target.value);
            setLightError(false);
          }}
          aria-label={`${token.label} light value color picker`}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <div className="flex flex-1 flex-col">
          <Input
            value={lightText}
            onChange={(e) => setLightText(e.target.value)}
            onBlur={(e) => commitLight(e.target.value)}
            className={cn("h-8 font-mono text-xs", lightError && "border-destructive")}
            aria-label={`${token.label} light value hex`}
          />
          {lightError && (
            <span className="text-xs text-destructive">Invalid hex</span>
          )}
        </div>
      </div>

      {/* Dark value */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={token.darkHex}
          onChange={(e) => {
            setDarkText(e.target.value);
            onChange("dark", e.target.value);
            setDarkError(false);
          }}
          aria-label={`${token.label} dark value color picker`}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <div className="flex flex-1 flex-col">
          <Input
            value={darkText}
            onChange={(e) => setDarkText(e.target.value)}
            onBlur={(e) => commitDark(e.target.value)}
            className={cn("h-8 font-mono text-xs", darkError && "border-destructive")}
            aria-label={`${token.label} dark value hex`}
          />
          {darkError && (
            <span className="text-xs text-destructive">Invalid hex</span>
          )}
        </div>
      </div>
    </div>
  );
}
