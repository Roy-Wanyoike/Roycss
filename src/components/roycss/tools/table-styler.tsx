"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  TableProperties,
  Copy,
  Check,
  Sparkles,
  Palette,
  Eye,
  RotateCcw,
  Info,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * TableStyler — a visual styler for HTML `<table>` elements.
 *
 * Generates a single `.roycss-table` class block covering: border collapse
 * / width / color / style, header background + typography + sticky
 * positioning, body row colors + padding + alignment, striped rows via
 * `:nth-child(even|3n)`, hover background with a configurable transition,
 * cell horizontal spacing, table-level border radius, and an optional
 * responsive wrapper (`overflow-x: auto` + `max-width: 100%`).
 *
 * Features:
 *  - Live preview: a real 5-column × 8-row data table (Name, Role,
 *    Department, Status, Salary) rendered against the ACTUAL generated
 *    CSS via an injected `<style>` tag scoped to a stable class.
 *  - Controls grouped by Border / Header / Body / Striped rows / Hover /
 *    Spacing & radius / Responsive — each in a labelled card.
 *  - Presets: Minimal, Striped, Bordered, Dark mode, Material, Clean —
 *    each is a partial config overlaid on the defaults, with active-state
 *    highlight.
 *  - Generated CSS: a clean, copy-ready block. Copy button with a 2s
 *    Check confirmation.
 *  - Sticky-header preview: when the toggle is on, the preview wrapper
 *    becomes scrollable so the sticky behaviour is actually visible.
 *
 * All colors are emitted as `oklch()` to match the RoyCSS design-token
 * system. Hex inputs are converted via a sRGB → OKLCH pipeline.
 *
 * Output is memoised; the `<style>` injection is a direct DOM write per
 * render cycle (no React reconciliation of CSS text).
 */

// ============================================================
// Types
// ============================================================

type BorderCollapse = "collapse" | "separate";
type BorderStyle_ = "solid" | "dashed" | "dotted";
type TextAlign = "left" | "center" | "right";
type StripeFrequency = 2 | 3;

type PresetKey =
  | "default"
  | "minimal"
  | "striped"
  | "bordered"
  | "dark"
  | "material"
  | "clean";

interface TableConfig {
  // ── Border ───────────────────────────────────────────────────────
  /** `border-collapse` value. */
  borderCollapse: BorderCollapse;
  /** Border width in px (0–4). 0 = no border. */
  borderWidth: number;
  /** Border color (hex). */
  borderColor: string;
  /** Border line style. */
  borderStyle: BorderStyle_;

  // ── Header ───────────────────────────────────────────────────────
  /** `<th>` background (hex). */
  headerBg: string;
  /** `<th>` text color (hex). */
  headerColor: string;
  /** `<th>` font-weight (400–800). */
  headerFontWeight: number;
  /** `<th>` text-align. */
  headerTextAlign: TextAlign;
  /** `<th>` vertical padding in px (4–20). */
  headerPadding: number;
  /** When true, `position: sticky; top: 0` on `<th>`. */
  stickyHeader: boolean;

  // ── Body rows ────────────────────────────────────────────────────
  /** `<tbody tr>` background (hex). */
  bodyBg: string;
  /** `<td>` text color (hex). */
  bodyColor: string;
  /** `<td>` vertical padding in px (4–20). */
  bodyPadding: number;
  /** `<td>` text-align. */
  bodyTextAlign: TextAlign;

  // ── Striped rows ─────────────────────────────────────────────────
  /** When true, applies the stripe color to every Nth row. */
  striped: boolean;
  /** Stripe background color (hex). */
  stripeColor: string;
  /** Stripe every Nth row. 2 = even, 3 = every 3rd. */
  stripeFrequency: StripeFrequency;

  // ── Hover ────────────────────────────────────────────────────────
  /** When true, applies a hover background to `<tbody tr>`. */
  hover: boolean;
  /** Hover background color (hex). */
  hoverBg: string;
  /** Hover `transition` duration in ms (0–500). */
  hoverTransition: number;

  // ── Spacing & radius ─────────────────────────────────────────────
  /** Cell horizontal padding in px (0–20), applied to both `<th>` and `<td>`. */
  cellSpacing: number;
  /** Table-level `border-radius` in px (0–16). */
  borderRadius: number;

  // ── Responsive ───────────────────────────────────────────────────
  /** When true, wraps the table in `overflow-x: auto; max-width: 100%`. */
  responsive: boolean;
}

interface Preset {
  key: PresetKey;
  label: string;
  /** Partial config merged onto DEFAULT_CONFIG. */
  patch: Partial<TableConfig>;
}

interface Employee {
  name: string;
  role: string;
  department: string;
  status: "Active" | "On leave" | "Remote";
  salary: string;
}

// ============================================================
// Constants
// ============================================================

const PREVIEW_SCOPE_CLASS = "roycss-table-live";
const SELECTOR = ".roycss-table";

/** Cap for the sticky-header preview scroller. */
const STICKY_PREVIEW_HEIGHT = 280;

const DEFAULT_CONFIG: TableConfig = {
  borderCollapse: "collapse",
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderStyle: "solid",

  headerBg: "#1e293b",
  headerColor: "#f8fafc",
  headerFontWeight: 600,
  headerTextAlign: "left",
  headerPadding: 12,
  stickyHeader: false,

  bodyBg: "#ffffff",
  bodyColor: "#1e293b",
  bodyPadding: 10,
  bodyTextAlign: "left",

  striped: true,
  stripeColor: "#f1f5f9",
  stripeFrequency: 2,

  hover: true,
  hoverBg: "#e2e8f0",
  hoverTransition: 150,

  cellSpacing: 16,
  borderRadius: 8,

  responsive: false,
};

const PRESETS: Preset[] = [
  {
    key: "minimal",
    label: "Minimal",
    patch: {
      borderCollapse: "collapse",
      borderWidth: 0,
      borderColor: "#e2e8f0",
      borderStyle: "solid",
      headerBg: "#ffffff",
      headerColor: "#0f172a",
      headerFontWeight: 600,
      headerTextAlign: "left",
      headerPadding: 12,
      stickyHeader: false,
      bodyBg: "#ffffff",
      bodyColor: "#334155",
      bodyPadding: 10,
      bodyTextAlign: "left",
      striped: false,
      stripeColor: "#f8fafc",
      stripeFrequency: 2,
      hover: false,
      hoverBg: "#f8fafc",
      hoverTransition: 120,
      cellSpacing: 12,
      borderRadius: 0,
      responsive: false,
    },
  },
  {
    key: "striped",
    label: "Striped",
    patch: {
      borderCollapse: "collapse",
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderStyle: "solid",
      headerBg: "#0f172a",
      headerColor: "#f8fafc",
      headerFontWeight: 600,
      headerTextAlign: "left",
      headerPadding: 12,
      stickyHeader: false,
      bodyBg: "#ffffff",
      bodyColor: "#1e293b",
      bodyPadding: 10,
      bodyTextAlign: "left",
      striped: true,
      stripeColor: "#f1f5f9",
      stripeFrequency: 2,
      hover: true,
      hoverBg: "#e2e8f0",
      hoverTransition: 150,
      cellSpacing: 16,
      borderRadius: 8,
      responsive: false,
    },
  },
  {
    key: "bordered",
    label: "Bordered",
    patch: {
      borderCollapse: "collapse",
      borderWidth: 1,
      borderColor: "#94a3b8",
      borderStyle: "solid",
      headerBg: "#f1f5f9",
      headerColor: "#0f172a",
      headerFontWeight: 700,
      headerTextAlign: "left",
      headerPadding: 12,
      stickyHeader: false,
      bodyBg: "#ffffff",
      bodyColor: "#1e293b",
      bodyPadding: 10,
      bodyTextAlign: "left",
      striped: false,
      stripeColor: "#f8fafc",
      stripeFrequency: 2,
      hover: true,
      hoverBg: "#f1f5f9",
      hoverTransition: 120,
      cellSpacing: 14,
      borderRadius: 0,
      responsive: false,
    },
  },
  {
    key: "dark",
    label: "Dark mode",
    patch: {
      borderCollapse: "collapse",
      borderWidth: 1,
      borderColor: "#334155",
      borderStyle: "solid",
      headerBg: "#020617",
      headerColor: "#e2e8f0",
      headerFontWeight: 600,
      headerTextAlign: "left",
      headerPadding: 12,
      stickyHeader: false,
      bodyBg: "#0f172a",
      bodyColor: "#cbd5e1",
      bodyPadding: 10,
      bodyTextAlign: "left",
      striped: true,
      stripeColor: "#1e293b",
      stripeFrequency: 2,
      hover: true,
      hoverBg: "#1e293b",
      hoverTransition: 150,
      cellSpacing: 16,
      borderRadius: 8,
      responsive: false,
    },
  },
  {
    key: "material",
    label: "Material",
    patch: {
      borderCollapse: "collapse",
      borderWidth: 0,
      borderColor: "#e2e8f0",
      borderStyle: "solid",
      headerBg: "#0d9488",
      headerColor: "#ffffff",
      headerFontWeight: 500,
      headerTextAlign: "left",
      headerPadding: 14,
      stickyHeader: true,
      bodyBg: "#ffffff",
      bodyColor: "#1e293b",
      bodyPadding: 12,
      bodyTextAlign: "left",
      striped: false,
      stripeColor: "#f1f5f9",
      stripeFrequency: 2,
      hover: true,
      hoverBg: "#f0fdfa",
      hoverTransition: 200,
      cellSpacing: 16,
      borderRadius: 4,
      responsive: false,
    },
  },
  {
    key: "clean",
    label: "Clean",
    patch: {
      borderCollapse: "collapse",
      borderWidth: 0,
      borderColor: "#e2e8f0",
      borderStyle: "solid",
      headerBg: "#ffffff",
      headerColor: "#0f172a",
      headerFontWeight: 600,
      headerTextAlign: "left",
      headerPadding: 12,
      stickyHeader: false,
      bodyBg: "#ffffff",
      bodyColor: "#334155",
      bodyPadding: 10,
      bodyTextAlign: "left",
      striped: false,
      stripeColor: "#f8fafc",
      stripeFrequency: 2,
      hover: true,
      hoverBg: "#f8fafc",
      hoverTransition: 100,
      cellSpacing: 14,
      borderRadius: 0,
      responsive: false,
    },
  },
];

const COLLAPSE_OPTIONS: { value: BorderCollapse; label: string }[] = [
  { value: "collapse", label: "collapse" },
  { value: "separate", label: "separate" },
];

const BORDER_STYLE_OPTIONS: { value: BorderStyle_; label: string }[] = [
  { value: "solid", label: "solid" },
  { value: "dashed", label: "dashed" },
  { value: "dotted", label: "dotted" },
];

const ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "left" },
  { value: "center", label: "center" },
  { value: "right", label: "right" },
];

const FONT_WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 400, label: "400 · regular" },
  { value: 500, label: "500 · medium" },
  { value: 600, label: "600 · semibold" },
  { value: 700, label: "700 · bold" },
  { value: 800, label: "800 · extrabold" },
];

const STRIPE_FREQUENCY_OPTIONS: {
  value: StripeFrequency;
  label: string;
}[] = [
  { value: 2, label: "every 2nd row" },
  { value: 3, label: "every 3rd row" },
];

/** Mock data rendered in the live preview. 5 cols × 8 rows. */
const EMPLOYEES: Employee[] = [
  {
    name: "Amara Okafor",
    role: "Staff Engineer",
    department: "Platform",
    status: "Active",
    salary: "$182,000",
  },
  {
    name: "Liam Chen",
    role: "Product Designer",
    department: "Design",
    status: "Remote",
    salary: "$134,000",
  },
  {
    name: "Sofia Reyes",
    role: "Engineering Manager",
    department: "Growth",
    status: "Active",
    salary: "$210,000",
  },
  {
    name: "Noah Patel",
    role: "Data Scientist",
    department: "Analytics",
    status: "On leave",
    salary: "$168,000",
  },
  {
    name: "Maya Romano",
    role: "Frontend Engineer",
    department: "Web",
    status: "Remote",
    salary: "$156,000",
  },
  {
    name: "Ethan Brooks",
    role: "Security Engineer",
    department: "Infra",
    status: "Active",
    salary: "$194,000",
  },
  {
    name: "Priya Nair",
    role: "UX Researcher",
    department: "Design",
    status: "Remote",
    salary: "$128,000",
  },
  {
    name: "Marcus Adler",
    role: "Backend Engineer",
    department: "Platform",
    status: "Active",
    salary: "$172,000",
  },
];

// ============================================================
// Color math: sRGB (hex) → OKLCH
// ============================================================
//
// Pipeline (Björn Ottosson's OKLab, direct linear-sRGB → LMS form):
//   1. Parse hex → sRGB channels in [0, 1].
//   2. Gamma-decode sRGB → linear sRGB.
//   3. Linear sRGB → LMS (3×3 matrix).
//   4. Apply cube-root non-linearity to L, M, S.
//   5. LMS' → OKLab (3×3 matrix).
//   6. OKLab → OKLCH (cylindrical: C = √(a²+b²), H = atan2(b,a)·180/π).
//
// Alpha: hex #RRGGBBAA is supported; if alpha < 1, an `/ <alpha>` suffix
// is appended to the oklch() call.

/** sRGB channel (0–1) → linear sRGB (gamma decode). */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parse a hex string (#RGB, #RGBA, #RRGGBB, or #RRGGBBAA) into sRGB
 * channels in [0, 1]. Returns null for malformed input.
 */
function hexToRgba(hex: string): Rgba | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;
  let r: number, g: number, b: number, a: number;
  switch (cleaned.length) {
    case 3:
      r = parseInt(cleaned[0]! + cleaned[0]!, 16);
      g = parseInt(cleaned[1]! + cleaned[1]!, 16);
      b = parseInt(cleaned[2]! + cleaned[2]!, 16);
      a = 255;
      break;
    case 4:
      r = parseInt(cleaned[0]! + cleaned[0]!, 16);
      g = parseInt(cleaned[1]! + cleaned[1]!, 16);
      b = parseInt(cleaned[2]! + cleaned[2]!, 16);
      a = parseInt(cleaned[3]! + cleaned[3]!, 16);
      break;
    case 6:
      r = parseInt(cleaned.slice(0, 2), 16);
      g = parseInt(cleaned.slice(2, 4), 16);
      b = parseInt(cleaned.slice(4, 6), 16);
      a = 255;
      break;
    case 8:
      r = parseInt(cleaned.slice(0, 2), 16);
      g = parseInt(cleaned.slice(2, 4), 16);
      b = parseInt(cleaned.slice(4, 6), 16);
      a = parseInt(cleaned.slice(6, 8), 16);
      break;
    default:
      return null;
  }
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
}

/**
 * Convert an sRGB color to its `oklch()` string representation.
 * Returns the original hex string unchanged if it cannot be parsed.
 */
function hexToOklch(hex: string): string {
  const rgba = hexToRgba(hex);
  if (!rgba) return hex;
  const { r, g, b, a } = rgba;
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // Linear sRGB → LMS (Ottosson's direct matrix).
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // Non-linearity (cube root).
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS' → OKLab.
  const okL = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const okA = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const okB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // OKLab → OKLCH.
  const okC = Math.sqrt(okA * okA + okB * okB);
  let okH = okA === 0 && okB === 0 ? 0 : (Math.atan2(okB, okA) * 180) / Math.PI;
  if (okH < 0) okH += 360;

  const lf = Number(okL.toFixed(3));
  const cf = Number(okC.toFixed(3));
  const hf = Number(okH.toFixed(1));
  const base = `oklch(${lf} ${cf} ${hf})`;
  return a < 1 ? `${base} / ${Number(a.toFixed(3))}` : base;
}

// ============================================================
// CSS generator
// ============================================================

/**
 * Build the `.roycss-table` CSS block for a given selector. Pure
 * function; memoised by the caller. When `scopeClass` is supplied, the
 * selector is rewritten to `.<scopeClass>` so the same generator drives
 * both the user-facing output and the live-preview injection.
 */
function buildCSS(config: TableConfig, selector: string): string {
  const border = hexToOklch(config.borderColor);
  const headerBg = hexToOklch(config.headerBg);
  const headerColor = hexToOklch(config.headerColor);
  const bodyBg = hexToOklch(config.bodyBg);
  const bodyColor = hexToOklch(config.bodyColor);
  const stripeColor = hexToOklch(config.stripeColor);
  const hoverBg = hexToOklch(config.hoverBg);

  const lines: string[] = [];

  // ── Responsive wrapper ──────────────────────────────────────────
  if (config.responsive) {
    lines.push("/* Responsive wrapper — apply to a parent <div> */");
    lines.push(`${selector}-wrap {`);
    lines.push("  overflow-x: auto;");
    lines.push("  max-width: 100%;");
    lines.push("}");
    lines.push("");
  }

  // ── Table ───────────────────────────────────────────────────────
  lines.push(`${selector} {`);
  lines.push(`  border-collapse: ${config.borderCollapse};`);
  lines.push("  width: 100%;");
  if (config.borderCollapse === "separate") {
    lines.push(`  border-spacing: ${config.cellSpacing}px;`);
  }
  if (config.borderWidth > 0) {
    lines.push(
      `  border: ${config.borderWidth}px ${config.borderStyle} ${border};`,
    );
  }
  if (config.borderRadius > 0 && config.borderCollapse === "collapse") {
    lines.push(`  border-radius: ${config.borderRadius}px;`);
    lines.push("  overflow: hidden;");
  } else if (config.borderRadius > 0) {
    lines.push(`  border-radius: ${config.borderRadius}px;`);
  }
  lines.push("}");
  lines.push("");

  // ── Header cells ────────────────────────────────────────────────
  lines.push(`${selector} th {`);
  lines.push(`  background: ${headerBg};`);
  lines.push(`  color: ${headerColor};`);
  lines.push(
    `  padding: ${config.headerPadding}px ${config.cellSpacing}px;`,
  );
  lines.push(`  text-align: ${config.headerTextAlign};`);
  lines.push(`  font-weight: ${config.headerFontWeight};`);
  if (config.stickyHeader) {
    lines.push("  position: sticky;");
    lines.push("  top: 0;");
    lines.push("  z-index: 1;");
  }
  lines.push("}");
  lines.push("");

  // ── Body cells ──────────────────────────────────────────────────
  lines.push(`${selector} td {`);
  lines.push(`  padding: ${config.bodyPadding}px ${config.cellSpacing}px;`);
  lines.push(`  text-align: ${config.bodyTextAlign};`);
  lines.push(`  color: ${bodyColor};`);
  if (config.borderWidth > 0 && config.borderCollapse === "collapse") {
    lines.push(
      `  border-bottom: ${config.borderWidth}px ${config.borderStyle} ${border};`,
    );
  }
  lines.push("}");
  lines.push("");

  // ── Body row background ─────────────────────────────────────────
  lines.push(`${selector} tbody tr {`);
  lines.push(`  background: ${bodyBg};`);
  lines.push("}");
  lines.push("");

  // ── Striped rows ────────────────────────────────────────────────
  if (config.striped) {
    const nthArg = config.stripeFrequency === 2 ? "even" : "3n";
    lines.push(
      `${selector} tbody tr:nth-child(${nthArg}) {`,
    );
    lines.push(`  background: ${stripeColor};`);
    lines.push("}");
    lines.push("");
  }

  // ── Hover ───────────────────────────────────────────────────────
  if (config.hover) {
    lines.push(`${selector} tbody tr:hover {`);
    lines.push(`  background: ${hoverBg};`);
    if (config.hoverTransition > 0) {
      lines.push(`  transition: background ${config.hoverTransition}ms;`);
    }
    lines.push("}");
  }

  return lines.join("\n");
}

/**
 * Check whether the current config matches a given preset (shallow
 * comparison across the preset's patched keys). Used for the active chip
 * highlight.
 */
function matchesPreset(config: TableConfig, preset: Preset): boolean {
  return Object.entries(preset.patch).every(
    ([key, value]) =>
      config[key as keyof TableConfig] ===
      (value as TableConfig[keyof TableConfig]),
  );
}

// ============================================================
// Component
// ============================================================

export function TableStyler() {
  const [config, setConfig] = useState<TableConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  /** Direct DOM write target for the live-preview <style> tag. */
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  /* ── Generated CSS (user-facing, uses `.roycss-table` selector) ─────── */
  const generatedCSS = useMemo(
    () => buildCSS(config, SELECTOR),
    [config],
  );

  /* ── Preview CSS (scoped to the live preview element) ────────────── */
  const previewCSS = useMemo(
    () => buildCSS(config, `.${PREVIEW_SCOPE_CLASS}`),
    [config],
  );

  /* ── Inject preview CSS via direct DOM write (no React reconcile) ── */
  useEffect(() => {
    if (styleRef.current) styleRef.current.textContent = previewCSS;
  }, [previewCSS]);

  /* ── Cleanup the copy-state timer on unmount ─────────────────────── */
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const updateConfig = useCallback(
    <K extends keyof TableConfig>(key: K, value: TableConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setConfig((prev) => ({ ...prev, ...preset.patch }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCSS]);

  const handleHexChange = useCallback(
    (key: keyof TableConfig, value: string) => {
      // Allow free typing; the color input's picker enforces hex format
      // and will commit a valid value via the same handler.
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ── Derived display values ──────────────────────────────────────── */
  const activePreset = useMemo<PresetKey>(() => {
    const found = PRESETS.find((p) => matchesPreset(config, p));
    return found ? found.key : "default";
  }, [config]);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto max-w-2xl space-y-5"
    >
      {/* Hidden <style> — receives the live-preview CSS via ref. */}
      <style ref={styleRef} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TableProperties className="size-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight">
              CSS Table Styler
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Visual builder for{" "}
              <code className="font-mono text-foreground/70">&lt;table&gt;</code>{" "}
              styles — borders, headers, stripes, hover, sticky. Live preview +
              copy-ready CSS.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Presets ──────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => {
            const active = activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Live preview ─────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Eye className="size-3.5 text-primary" />
            Live preview
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {config.stickyHeader ? (
              <>Scroll the table →</>
            ) : (
              <>Hover rows to test →</>
            )}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card p-3">
          {/* Preview wrapper. When responsive OR stickyHeader is on, the
              wrapper becomes scrollable so the behaviour is visible. */}
          <div
            className={cn(
              config.responsive || config.stickyHeader
                ? "overflow-auto"
                : "overflow-visible",
            )}
            style={
              config.stickyHeader
                ? { maxHeight: STICKY_PREVIEW_HEIGHT }
                : undefined
            }
          >
            <table
              className={cn(
                PREVIEW_SCOPE_CLASS,
                "border-separate border-spacing-0",
              )}
            >
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map((emp) => (
                  <tr key={emp.name}>
                    <td>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td>{emp.status}</td>
                    <td>{emp.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* ── Border section ─────────────────────────────────────── */}
        <SectionLabel icon={<Palette className="size-3.5" />}>
          Border
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ControlBlock label="Border collapse" hint={config.borderCollapse}>
            <Select
              value={config.borderCollapse}
              onValueChange={(v) =>
                updateConfig("borderCollapse", v as BorderCollapse)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLAPSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ControlBlock>

          <ControlBlock label="Border style" hint={config.borderStyle}>
            <Select
              value={config.borderStyle}
              onValueChange={(v) =>
                updateConfig("borderStyle", v as BorderStyle_)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BORDER_STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ControlBlock>

          <ControlBlock label="Border width" hint={`${config.borderWidth}px`}>
            <Slider
              value={[config.borderWidth]}
              min={0}
              max={4}
              step={1}
              onValueChange={(v) =>
                updateConfig("borderWidth", v[0] ?? config.borderWidth)
              }
            />
          </ControlBlock>

          <ColorControl
            label="Border color"
            value={config.borderColor}
            onChange={(v) => handleHexChange("borderColor", v)}
          />
        </div>

        {/* ── Header section ─────────────────────────────────────── */}
        <SectionLabel icon={<TableProperties className="size-3.5" />}>
          Header
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorControl
            label="Header background"
            value={config.headerBg}
            onChange={(v) => handleHexChange("headerBg", v)}
          />

          <ColorControl
            label="Header text color"
            value={config.headerColor}
            onChange={(v) => handleHexChange("headerColor", v)}
          />

          <ControlBlock
            label="Header font weight"
            hint={`${config.headerFontWeight}`}
          >
            <Select
              value={String(config.headerFontWeight)}
              onValueChange={(v) =>
                updateConfig("headerFontWeight", Number(v))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ControlBlock>

          <ControlBlock label="Header text align" hint={config.headerTextAlign}>
            <Select
              value={config.headerTextAlign}
              onValueChange={(v) =>
                updateConfig("headerTextAlign", v as TextAlign)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALIGN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ControlBlock>

          <ControlBlock
            label="Header padding"
            hint={`${config.headerPadding}px`}
          >
            <Slider
              value={[config.headerPadding]}
              min={4}
              max={20}
              step={1}
              onValueChange={(v) =>
                updateConfig("headerPadding", v[0] ?? config.headerPadding)
              }
            />
          </ControlBlock>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Sticky header</Label>
              <Switch
                checked={config.stickyHeader}
                onCheckedChange={(v) => updateConfig("stickyHeader", v)}
                aria-label="Toggle sticky table header"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              <code className="font-mono text-foreground/70">
                position: sticky; top: 0
              </code>{" "}
              on <code className="font-mono text-foreground/70">&lt;th&gt;</code>.
            </p>
          </div>
        </div>

        {/* ── Body section ───────────────────────────────────────── */}
        <SectionLabel icon={<TableProperties className="size-3.5" />}>
          Body rows
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorControl
            label="Row background"
            value={config.bodyBg}
            onChange={(v) => handleHexChange("bodyBg", v)}
          />

          <ColorControl
            label="Body text color"
            value={config.bodyColor}
            onChange={(v) => handleHexChange("bodyColor", v)}
          />

          <ControlBlock label="Body padding" hint={`${config.bodyPadding}px`}>
            <Slider
              value={[config.bodyPadding]}
              min={4}
              max={20}
              step={1}
              onValueChange={(v) =>
                updateConfig("bodyPadding", v[0] ?? config.bodyPadding)
              }
            />
          </ControlBlock>

          <ControlBlock label="Body text align" hint={config.bodyTextAlign}>
            <Select
              value={config.bodyTextAlign}
              onValueChange={(v) =>
                updateConfig("bodyTextAlign", v as TextAlign)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALIGN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ControlBlock>
        </div>

        {/* ── Striped rows section ───────────────────────────────── */}
        <SectionLabel icon={<Sparkles className="size-3.5" />}>
          Striped rows
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Striped rows</Label>
              <Switch
                checked={config.striped}
                onCheckedChange={(v) => updateConfig("striped", v)}
                aria-label="Toggle striped rows"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              <code className="font-mono text-foreground/70">
                tbody tr:nth-child(...)
              </code>{" "}
              background.
            </p>
          </div>

          <ControlBlock
            label="Stripe frequency"
            hint={config.stripeFrequency === 2 ? "every 2nd" : "every 3rd"}
          >
            <Select
              value={String(config.stripeFrequency)}
              onValueChange={(v) =>
                updateConfig("stripeFrequency", Number(v) as StripeFrequency)
              }
              disabled={!config.striped}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRIPE_FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    <span className="font-mono">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ControlBlock>

          <ColorControl
            label="Stripe color"
            value={config.stripeColor}
            onChange={(v) => handleHexChange("stripeColor", v)}
            disabled={!config.striped}
          />
        </div>

        {/* ── Hover section ──────────────────────────────────────── */}
        <SectionLabel icon={<Sparkles className="size-3.5" />}>
          Hover
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Hover effect</Label>
              <Switch
                checked={config.hover}
                onCheckedChange={(v) => updateConfig("hover", v)}
                aria-label="Toggle hover effect"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              <code className="font-mono text-foreground/70">
                tbody tr:hover
              </code>{" "}
              background.
            </p>
          </div>

          <ColorControl
            label="Hover background"
            value={config.hoverBg}
            onChange={(v) => handleHexChange("hoverBg", v)}
            disabled={!config.hover}
          />

          <ControlBlock
            label="Hover transition"
            hint={`${config.hoverTransition}ms`}
          >
            <Slider
              value={[config.hoverTransition]}
              min={0}
              max={500}
              step={10}
              onValueChange={(v) =>
                updateConfig("hoverTransition", v[0] ?? config.hoverTransition)
              }
            />
          </ControlBlock>
        </div>

        {/* ── Spacing & radius section ───────────────────────────── */}
        <SectionLabel icon={<Palette className="size-3.5" />}>
          Spacing & radius
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ControlBlock label="Cell spacing" hint={`${config.cellSpacing}px`}>
            <Slider
              value={[config.cellSpacing]}
              min={0}
              max={20}
              step={1}
              onValueChange={(v) =>
                updateConfig("cellSpacing", v[0] ?? config.cellSpacing)
              }
            />
          </ControlBlock>

          <ControlBlock
            label="Table border radius"
            hint={`${config.borderRadius}px`}
          >
            <Slider
              value={[config.borderRadius]}
              min={0}
              max={16}
              step={1}
              onValueChange={(v) =>
                updateConfig("borderRadius", v[0] ?? config.borderRadius)
              }
            />
          </ControlBlock>
        </div>

        {/* ── Responsive section ─────────────────────────────────── */}
        <SectionLabel icon={<TableProperties className="size-3.5" />}>
          Responsive
        </SectionLabel>
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium">
              Responsive wrapper
            </Label>
            <Switch
              checked={config.responsive}
              onCheckedChange={(v) => updateConfig("responsive", v)}
              aria-label="Toggle responsive table wrapper"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Adds an{" "}
            <code className="font-mono text-foreground/70">
              overflow-x: auto
            </code>{" "}
            +{" "}
            <code className="font-mono text-foreground/70">max-width: 100%</code>{" "}
            wrapper so the table scrolls horizontally on narrow viewports.
          </p>
        </div>
      </div>

      {/* ── Generated CSS ────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TableProperties className="size-3.5 text-primary" />
            Generated CSS
          </div>
          <Button
            type="button"
            size="sm"
            variant={copied ? "secondary" : "default"}
            onClick={handleCopy}
            className="h-7 gap-1.5 px-2.5 text-xs"
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
        <pre className="max-h-80 overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
          <code>{generatedCSS}</code>
        </pre>
      </div>

      {/* ── Implementation note ─────────────────────────────────── */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">How to use</p>
          <p>
            Add the{" "}
            <code className="font-mono text-foreground/70">.roycss-table</code>{" "}
            class to any{" "}
            <code className="font-mono text-foreground/70">&lt;table&gt;</code>{" "}
            element. For sticky headers, wrap the table in a scrollable
            container (e.g.{" "}
            <code className="font-mono text-foreground/70">
              max-height: 300px; overflow-y: auto
            </code>
            ). For responsive behaviour, add the{" "}
            <code className="font-mono text-foreground/70">
              .roycss-table-wrap
            </code>{" "}
            class to a parent{" "}
            <code className="font-mono text-foreground/70">&lt;div&gt;</code>.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Sub-components
// ============================================================

interface SectionLabelProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

/** A small uppercase section heading with a leading icon. */
function SectionLabel({ icon, children }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </div>
  );
}

interface ControlBlockProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

/** A labelled control cell with a right-aligned hint value. */
function ControlBlock({ label, hint, children }: ControlBlockProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}</Label>
        {hint !== undefined && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** A labelled color input with a hex text field, suitable for any color. */
function ColorControl({ label, value, onChange, disabled }: ColorControlProps) {
  // The native color input only accepts #RRGGBB (no alpha). When the value
  // is a longer/shorter hex, fall back to a neutral swatch for the picker
  // while keeping the text field editable to the real value.
  const swatchValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
        disabled && "opacity-50",
      )}
    >
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="size-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5 disabled:cursor-not-allowed"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs uppercase disabled:cursor-not-allowed disabled:opacity-60"
          spellCheck={false}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
