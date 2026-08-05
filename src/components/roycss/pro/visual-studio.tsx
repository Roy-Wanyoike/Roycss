"use client";

/**
 * VisualStudio — a visual drag-and-drop page builder.
 *
 * Self-contained (no props). Three-pane layout:
 *   • Palette   (left)   — 8 draggable component types, each a labeled icon.
 *   • Canvas    (center) — a drop zone with a subtle dot-grid background where
 *     components stack vertically. Drag from the palette to add; click a
 *     component to select it. Drop on a component to insert above/below it
 *     (a primary-colored indicator line shows the insertion point).
 *   • Properties (right) — context-aware editor for the selected component
 *     (text, size, variant, width, alignment, heading level, image src/alt,
 *     input placeholder, card body). Plus per-component actions: delete,
 *     duplicate, move up / move down.
 *
 * Export: an "Export HTML" button opens a Dialog with the generated
 * standalone HTML document (semantic tags + inline styles, no framework
 * dependency) in a scrollable code block with a Copy button.
 *
 * Drag-and-drop uses the native HTML5 DnD API:
 *   • Palette items set `dataTransfer` with a private MIME type on
 *     `dragstart` and clear local drag state on `dragend`.
 *   • The canvas and each component wrapper are drop targets that compute
 *     an insertion index from the pointer's vertical position.
 *   • All listeners are React props on the dragged/dropped elements — no
 *     global `window` listeners to detach (the only global listener is the
 *     keyboard handler, which is added/removed via a `useEffect` cleanup).
 *
 * SSR-safe: no `window`/`document`/`navigator` access during render. The
 * keyboard effect only attaches on the client. Clipboard calls happen
 * exclusively inside event handlers.
 *
 * TS strict, zero `any`. No indigo / blue — emerald / teal accents only.
 */

import * as React from "react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  Code2Icon,
  CopyIcon,
  FilesIcon,
  HeadingIcon,
  ImageIcon,
  LayersIcon,
  MinusIcon,
  MousePointerClickIcon,
  PlusIcon,
  SquareIcon,
  TagIcon,
  TextCursorInputIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type ComponentType =
  | "heading"
  | "paragraph"
  | "button"
  | "card"
  | "image"
  | "input"
  | "badge"
  | "divider";

type SizeOption = "sm" | "md" | "lg";
type VariantOption = "default" | "secondary" | "destructive" | "outline";
type AlignmentOption = "left" | "center" | "right";
type HeadingLevel = 1 | 2 | 3 | 4;

interface CanvasComponent {
  id: string;
  type: ComponentType;
  /** Primary text — used by heading, paragraph, button, badge, card title. */
  text: string;
  /** Secondary text — used by card body. Empty for non-card types. */
  body: string;
  size: SizeOption;
  variant: VariantOption;
  align: AlignmentOption;
  /** CSS width for image / input. Examples: "100%", "320px", "20rem". */
  width: string;
  /** Image src URL. */
  src: string;
  /** Image alt text. */
  alt: string;
  /** Input placeholder. */
  placeholder: string;
  headingLevel: HeadingLevel;
}

interface PaletteEntry {
  type: ComponentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

/** Private MIME type so we only react to our own drags. */
const DRAG_MIME = "application/x-roycss-visual-studio";

const PALETTE: readonly PaletteEntry[] = [
  {
    type: "heading",
    label: "Heading",
    description: "Section title",
    icon: HeadingIcon,
  },
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Body text",
    icon: TypeIcon,
  },
  {
    type: "button",
    label: "Button",
    description: "Call to action",
    icon: MousePointerClickIcon,
  },
  {
    type: "card",
    label: "Card",
    description: "Grouped content",
    icon: SquareIcon,
  },
  {
    type: "image",
    label: "Image",
    description: "Picture or graphic",
    icon: ImageIcon,
  },
  {
    type: "input",
    label: "Input",
    description: "Text field",
    icon: TextCursorInputIcon,
  },
  {
    type: "badge",
    label: "Badge",
    description: "Status pill",
    icon: TagIcon,
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator",
    icon: MinusIcon,
  },
] as const;

const SIZE_OPTIONS: readonly SizeOption[] = ["sm", "md", "lg"] as const;
const VARIANT_OPTIONS: readonly VariantOption[] = [
  "default",
  "secondary",
  "destructive",
  "outline",
] as const;
const ALIGN_OPTIONS: readonly AlignmentOption[] = [
  "left",
  "center",
  "right",
] as const;
const HEADING_LEVELS: readonly HeadingLevel[] = [1, 2, 3, 4] as const;

/** Seed canvas so the builder isn't empty on first paint. */
const INITIAL_COMPONENTS: readonly CanvasComponent[] = [
  {
    id: "seed-1",
    type: "badge",
    text: "New",
    body: "",
    size: "sm",
    variant: "default",
    align: "left",
    width: "100%",
    src: "",
    alt: "",
    placeholder: "",
    headingLevel: 2,
  },
  {
    id: "seed-2",
    type: "heading",
    text: "Welcome to Visual Studio",
    body: "",
    size: "md",
    variant: "default",
    align: "left",
    width: "100%",
    src: "",
    alt: "",
    placeholder: "",
    headingLevel: 1,
  },
  {
    id: "seed-3",
    type: "paragraph",
    text: "Drag components from the left palette onto this canvas. Click any element to edit its properties on the right, then export the result as clean HTML.",
    body: "",
    size: "md",
    variant: "default",
    align: "left",
    width: "100%",
    src: "",
    alt: "",
    placeholder: "",
    headingLevel: 2,
  },
  {
    id: "seed-4",
    type: "button",
    text: "Get started",
    body: "",
    size: "md",
    variant: "default",
    align: "left",
    width: "100%",
    src: "",
    alt: "",
    placeholder: "",
    headingLevel: 2,
  },
] as const;

/** Default props for each freshly-dropped component type. */
function makeDefaultComponent(type: ComponentType, id: string): CanvasComponent {
  const base: CanvasComponent = {
    id,
    type,
    text: "",
    body: "",
    size: "md",
    variant: "default",
    align: "left",
    width: "100%",
    src: "",
    alt: "",
    placeholder: "",
    headingLevel: 2,
  };

  switch (type) {
    case "heading":
      return { ...base, text: "Section heading", headingLevel: 2 };
    case "paragraph":
      return {
        ...base,
        text: "Write something compelling here. This is a paragraph of body copy that you can edit in the properties panel.",
      };
    case "button":
      return { ...base, text: "Click me", variant: "default", size: "md" };
    case "card":
      return {
        ...base,
        text: "Card title",
        body: "Supporting description for the card goes here. Keep it short and scannable.",
      };
    case "image":
      return {
        ...base,
        src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=960&q=80&auto=format&fit=crop",
        alt: "Descriptive alt text",
        width: "100%",
      };
    case "input":
      return {
        ...base,
        placeholder: "Enter text…",
        width: "100%",
      };
    case "badge":
      return { ...base, text: "Badge", variant: "default", size: "md" };
    case "divider":
      return base;
    default: {
      // Exhaustiveness guard — if a new type is added, this branch fails.
      const _exhaustive: never = type;
      void _exhaustive;
      return base;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `vs-${Date.now().toString(36)}-${idCounter}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  // Same as escapeHtml — attributes are quoted with ".
  return escapeHtml(s);
}

/** Indent every non-empty line by `n` spaces. */
function indentBlock(text: string, n: number): string {
  const pad = " ".repeat(n);
  return text
    .split("\n")
    .map((line) => (line.length === 0 ? line : pad + line))
    .join("\n");
}

// ─── HTML export ─────────────────────────────────────────────────────

/**
 * Export palette — hardcoded hex values so the exported document is fully
 * standalone (no CSS framework, no custom properties). Tuned to match the
 * RoyCSS emerald/teal accent. NO indigo / blue.
 */
const EXPORT_COLORS = {
  primary: "#0d9488", // teal-600
  primaryFg: "#ffffff",
  secondary: "#f1f5f4",
  secondaryFg: "#1c1917",
  destructive: "#dc2626",
  destructiveFg: "#ffffff",
  outlineFg: "#1c1917",
  border: "#e7e5e4",
  background: "#fafaf9",
  foreground: "#1c1917",
  muted: "#f5f5f4",
  mutedFg: "#737373",
  card: "#ffffff",
  cardFg: "#1c1917",
} as const;

function styleString(entries: ReadonlyArray<readonly [string, string]>): string {
  return entries
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

function buttonStyle(variant: VariantOption, size: SizeOption): string {
  const sizeMap: Record<SizeOption, string> = {
    sm: "font-size: 12px; padding: 4px 10px; border-radius: 6px",
    md: "font-size: 14px; padding: 8px 16px; border-radius: 6px",
    lg: "font-size: 16px; padding: 12px 24px; border-radius: 8px",
  };

  const variantMap: Record<VariantOption, string> = {
    default: `background-color: ${EXPORT_COLORS.primary}; color: ${EXPORT_COLORS.primaryFg}; border: 1px solid ${EXPORT_COLORS.primary}`,
    secondary: `background-color: ${EXPORT_COLORS.secondary}; color: ${EXPORT_COLORS.secondaryFg}; border: 1px solid ${EXPORT_COLORS.border}`,
    destructive: `background-color: ${EXPORT_COLORS.destructive}; color: ${EXPORT_COLORS.destructiveFg}; border: 1px solid ${EXPORT_COLORS.destructive}`,
    outline: `background-color: transparent; color: ${EXPORT_COLORS.outlineFg}; border: 1px solid ${EXPORT_COLORS.border}`,
  };

  return styleString([
    ["display", "inline-flex"],
    ["align-items", "center"],
    ["justify-content", "center"],
    ["font-family", "inherit"],
    ["font-weight", "500"],
    ["line-height", "1.5"],
    ["cursor", "pointer"],
    ["transition", "opacity 150ms ease"],
    [sizeMap[size], ""],
    [variantMap[variant], ""],
  ]);
}

function badgeStyle(variant: VariantOption, size: SizeOption): string {
  const sizeMap: Record<SizeOption, string> = {
    sm: "font-size: 11px; padding: 2px 8px; border-radius: 999px",
    md: "font-size: 12px; padding: 4px 10px; border-radius: 999px",
    lg: "font-size: 14px; padding: 6px 12px; border-radius: 999px",
  };

  const variantMap: Record<VariantOption, string> = {
    default: `background-color: ${EXPORT_COLORS.primary}; color: ${EXPORT_COLORS.primaryFg}; border: 1px solid ${EXPORT_COLORS.primary}`,
    secondary: `background-color: ${EXPORT_COLORS.secondary}; color: ${EXPORT_COLORS.secondaryFg}; border: 1px solid ${EXPORT_COLORS.border}`,
    destructive: `background-color: ${EXPORT_COLORS.destructive}; color: ${EXPORT_COLORS.destructiveFg}; border: 1px solid ${EXPORT_COLORS.destructive}`,
    outline: `background-color: transparent; color: ${EXPORT_COLORS.outlineFg}; border: 1px solid ${EXPORT_COLORS.border}`,
  };

  return styleString([
    ["display", "inline-flex"],
    ["align-items", "center"],
    ["font-family", "inherit"],
    ["font-weight", "500"],
    ["line-height", "1.25"],
    ["white-space", "nowrap"],
    [sizeMap[size], ""],
    [variantMap[variant], ""],
  ]);
}

function headingFontSize(level: HeadingLevel): string {
  switch (level) {
    case 1:
      return "30px";
    case 2:
      return "24px";
    case 3:
      return "20px";
    case 4:
      return "16px";
    default: {
      const _exhaustive: never = level;
      void _exhaustive;
      return "20px";
    }
  }
}

function componentToHtml(c: CanvasComponent): string {
  switch (c.type) {
    case "heading": {
      const tag = `h${c.headingLevel}`;
      const style = styleString([
        ["margin", "0"],
        ["font-family", "inherit"],
        ["font-weight", "600"],
        ["line-height", "1.2"],
        ["color", EXPORT_COLORS.foreground],
        ["font-size", headingFontSize(c.headingLevel)],
        ["text-align", c.align],
      ]);
      return `<${tag} style="${style}">${escapeHtml(c.text)}</${tag}>`;
    }
    case "paragraph": {
      const style = styleString([
        ["margin", "0"],
        ["font-family", "inherit"],
        ["font-size", "15px"],
        ["line-height", "1.6"],
        ["color", EXPORT_COLORS.mutedFg],
        ["text-align", c.align],
      ]);
      return `<p style="${style}">${escapeHtml(c.text)}</p>`;
    }
    case "button": {
      const style = buttonStyle(c.variant, c.size);
      return `<button type="button" style="${style}">${escapeHtml(
        c.text,
      )}</button>`;
    }
    case "card": {
      const cardStyle = styleString([
        ["background-color", EXPORT_COLORS.card],
        ["color", EXPORT_COLORS.cardFg],
        ["border", `1px solid ${EXPORT_COLORS.border}`],
        ["border-radius", "12px"],
        ["padding", "20px"],
        ["box-shadow", "0 1px 2px rgba(0,0,0,0.04)"],
      ]);
      const titleStyle = styleString([
        ["margin", "0 0 6px 0"],
        ["font-size", "16px"],
        ["font-weight", "600"],
        ["line-height", "1.3"],
        ["color", EXPORT_COLORS.foreground],
      ]);
      const bodyStyle = styleString([
        ["margin", "0"],
        ["font-size", "14px"],
        ["line-height", "1.55"],
        ["color", EXPORT_COLORS.mutedFg],
      ]);
      const bodyHtml = c.body
        ? `\n      <p style="${bodyStyle}">${escapeHtml(c.body)}</p>`
        : "";
      return (
        `<div style="${cardStyle}">\n` +
        `      <div style="${titleStyle}">${escapeHtml(c.text)}</div>${bodyHtml}\n` +
        `    </div>`
      );
    }
    case "image": {
      const style = styleString([
        ["display", "block"],
        ["max-width", "100%"],
        ["width", c.width],
        ["height", "auto"],
        ["border-radius", "8px"],
        ["border", `1px solid ${EXPORT_COLORS.border}`],
      ]);
      return `<img src="${escapeAttr(c.src)}" alt="${escapeAttr(
        c.alt,
      )}" style="${style}" />`;
    }
    case "input": {
      const style = styleString([
        ["display", "block"],
        ["width", c.width],
        ["height", "36px"],
        ["padding", "0 12px"],
        ["font-family", "inherit"],
        ["font-size", "14px"],
        ["color", EXPORT_COLORS.foreground],
        ["background-color", EXPORT_COLORS.card],
        ["border", `1px solid ${EXPORT_COLORS.border}`],
        ["border-radius", "6px"],
        ["outline", "none"],
      ]);
      return `<input type="text" placeholder="${escapeAttr(
        c.placeholder,
      )}" style="${style}" />`;
    }
    case "badge": {
      const style = badgeStyle(c.variant, c.size);
      return `<span style="${style}">${escapeHtml(c.text)}</span>`;
    }
    case "divider": {
      const style = styleString([
        ["border", "none"],
        ["border-top", `1px solid ${EXPORT_COLORS.border}`],
        ["width", "100%"],
        ["margin", "0"],
      ]);
      return `<hr style="${style}" />`;
    }
    default: {
      const _exhaustive: never = c.type;
      void _exhaustive;
      return "";
    }
  }
}

function exportHtml(components: readonly CanvasComponent[]): string {
  const body = components
    .map((c) => indentBlock(componentToHtml(c), 4))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exported Layout</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem 1rem;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background-color: ${EXPORT_COLORS.background};
      color: ${EXPORT_COLORS.foreground};
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .vs-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 720px;
      margin: 0 auto;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <main class="vs-stack">
${body}
  </main>
</body>
</html>
`;
}

// ─── Clipboard (with fallback) ───────────────────────────────────────

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }

  if (typeof document === "undefined") return false;

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Shared small UI primitives
// ═══════════════════════════════════════════════════════════════════════

const selectClass =
  "border-input dark:bg-input/30 flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-xs font-medium text-muted-foreground"
    >
      {children}
    </Label>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex w-full items-center gap-1 rounded-md border border-border bg-muted/40 p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-3.5" /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Palette
// ═══════════════════════════════════════════════════════════════════════

interface PaletteItemProps {
  entry: PaletteEntry;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, type: ComponentType) => void;
  onDragEnd: (e: React.DragEvent<HTMLButtonElement>) => void;
}

function PaletteItem({ entry, onDragStart, onDragEnd }: PaletteItemProps) {
  const Icon = entry.icon;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, entry.type)}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-all",
        "cursor-grab hover:border-primary/40 hover:shadow-md active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      title={`Drag ${entry.label} onto the canvas`}
      aria-label={`Drag ${entry.label} onto the canvas`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium leading-tight text-foreground">
          {entry.label}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {entry.description}
        </span>
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Canvas component view
// ═══════════════════════════════════════════════════════════════════════

interface CanvasComponentViewProps {
  component: CanvasComponent;
  selected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function CanvasComponentView({
  component,
  selected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: CanvasComponentViewProps) {
  const alignClass =
    component.align === "center"
      ? "text-center"
      : component.align === "right"
        ? "text-right"
        : "text-left";

  // Stop click propagation so the canvas-level "click to deselect" doesn't
  // fire when interacting with the toolbar buttons.
  const stopClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card transition-all",
        selected
          ? "border-primary ring-2 ring-primary/30 shadow-sm"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* Click-to-select surface */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-label={`Select ${component.type} component`}
        className={cn(
          "relative cursor-pointer rounded-lg p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          alignClass,
        )}
      >
        <ComponentPreview component={component} />

        {/* Type tag (top-left) */}
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {component.type}
        </span>
      </div>

      {/* Hover / selected toolbar */}
      <div
        className={cn(
          "absolute right-2 top-2 flex items-center gap-0.5 rounded-md border border-border bg-background/95 p-0.5 shadow-sm backdrop-blur-sm transition-all",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        onClick={stopClick}
      >
        <ToolbarButton
          label="Move up"
          icon={ArrowUpIcon}
          disabled={!canMoveUp}
          onClick={onMoveUp}
        />
        <ToolbarButton
          label="Move down"
          icon={ArrowDownIcon}
          disabled={!canMoveDown}
          onClick={onMoveDown}
        />
        <ToolbarButton
          label="Duplicate"
          icon={FilesIcon}
          onClick={onDuplicate}
        />
        <ToolbarButton
          label="Delete"
          icon={Trash2Icon}
          destructive
          onClick={onDelete}
        />
      </div>
    </div>
  );
}

/** A tiny icon-only button for the canvas toolbar. */
function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        destructive && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// Component preview (what shows on the canvas)
// ═══════════════════════════════════════════════════════════════════════

function ComponentPreview({ component }: { component: CanvasComponent }) {
  switch (component.type) {
    case "heading": {
      const sizeClass =
        component.headingLevel === 1
          ? "text-3xl"
          : component.headingLevel === 2
            ? "text-2xl"
            : component.headingLevel === 3
              ? "text-xl"
              : "text-base";
      const className = cn(
        "m-0 font-semibold leading-tight text-foreground",
        sizeClass,
      );
      // Explicit per-level elements keep the JSX types sound (no dynamic tag
      // name casting) and give each heading its correct semantic element.
      switch (component.headingLevel) {
        case 1:
          return <h1 className={className}>{component.text}</h1>;
        case 2:
          return <h2 className={className}>{component.text}</h2>;
        case 3:
          return <h3 className={className}>{component.text}</h3>;
        case 4:
          return <h4 className={className}>{component.text}</h4>;
        default: {
          const _exhaustive: never = component.headingLevel;
          void _exhaustive;
          return null;
        }
      }
    }
    case "paragraph":
      return (
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {component.text}
        </p>
      );
    case "button":
      return (
        <Button
          variant={component.variant}
          size={component.size === "md" ? "default" : component.size}
          type="button"
        >
          {component.text}
        </Button>
      );
    case "card":
      return (
        <div className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm">
          <div className="text-sm font-semibold text-foreground">
            {component.text}
          </div>
          {component.body ? (
            <p className="mt-1 text-xs text-muted-foreground">{component.body}</p>
          ) : null}
        </div>
      );
    case "image":
      return (
        <img
          src={component.src}
          alt={component.alt}
          className="block max-w-full rounded-md border border-border"
          style={{ width: component.width, height: "auto" }}
          draggable={false}
        />
      );
    case "input":
      return (
        <Input
          type="text"
          placeholder={component.placeholder}
          style={{ width: component.width }}
          readOnly
          aria-label={component.placeholder || "Input preview"}
        />
      );
    case "badge":
      return (
        <Badge variant={component.variant} className={badgeSizeClass(component.size)}>
          {component.text}
        </Badge>
      );
    case "divider":
      return <Separator className="w-full" />;
    default: {
      const _exhaustive: never = component.type;
      void _exhaustive;
      return null;
    }
  }
}

function badgeSizeClass(size: SizeOption): string {
  switch (size) {
    case "sm":
      return "text-[11px] px-2 py-0.5";
    case "lg":
      return "text-sm px-3 py-1";
    case "md":
    default:
      return "text-xs px-2.5 py-0.5";
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Properties panel
// ═══════════════════════════════════════════════════════════════════════

interface PropertiesPanelProps {
  component: CanvasComponent | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (patch: Partial<CanvasComponent>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function PropertiesPanel({
  component,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: PropertiesPanelProps) {
  if (!component) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LayersIcon className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">No selection</p>
        <p className="text-xs text-muted-foreground">
          Click a component on the canvas to edit its properties.
        </p>
      </div>
    );
  }

  const c = component;
  const hasText = c.type === "heading" || c.type === "paragraph" || c.type === "button" || c.type === "badge";
  const hasVariant = c.type === "button" || c.type === "badge";
  const hasSize = c.type === "button" || c.type === "badge";
  const hasAlign = c.type === "heading" || c.type === "paragraph";
  const hasWidth = c.type === "image" || c.type === "input";
  const hasHeadingLevel = c.type === "heading";
  const hasCardBody = c.type === "card";
  const hasImage = c.type === "image";
  const hasPlaceholder = c.type === "input";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <TypeIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize text-foreground">
              {c.type}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {c.id}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {hasText ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-text-${c.id}`}>
              {c.type === "heading" ? "Heading text" : "Text"}
            </FieldLabel>
            {c.type === "paragraph" ? (
              <Textarea
                id={`vs-text-${c.id}`}
                value={c.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                rows={4}
              />
            ) : (
              <Input
                id={`vs-text-${c.id}`}
                value={c.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
              />
            )}
          </div>
        ) : null}

        {hasCardBody ? (
          <>
            <div className="space-y-1.5">
              <FieldLabel htmlFor={`vs-cardtitle-${c.id}`}>Title</FieldLabel>
              <Input
                id={`vs-cardtitle-${c.id}`}
                value={c.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor={`vs-cardbody-${c.id}`}>Body</FieldLabel>
              <Textarea
                id={`vs-cardbody-${c.id}`}
                value={c.body}
                onChange={(e) => onUpdate({ body: e.target.value })}
                rows={4}
              />
            </div>
          </>
        ) : null}

        {hasHeadingLevel ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-level-${c.id}`}>Heading level</FieldLabel>
            <select
              id={`vs-level-${c.id}`}
              className={selectClass}
              value={c.headingLevel}
              onChange={(e) =>
                onUpdate({
                  headingLevel: Number(e.target.value) as HeadingLevel,
                })
              }
            >
              {HEADING_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  H{lvl}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {hasSize ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-size-${c.id}`}>Size</FieldLabel>
            <SegmentedControl
              label="Size"
              value={c.size}
              onChange={(next) => onUpdate({ size: next })}
              options={[
                { value: "sm", label: "SM" },
                { value: "md", label: "MD" },
                { value: "lg", label: "LG" },
              ]}
            />
          </div>
        ) : null}

        {hasVariant ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-variant-${c.id}`}>Variant</FieldLabel>
            <select
              id={`vs-variant-${c.id}`}
              className={selectClass}
              value={c.variant}
              onChange={(e) =>
                onUpdate({ variant: e.target.value as VariantOption })
              }
            >
              {VARIANT_OPTIONS.map((v) => (
                <option key={v} value={v} className="capitalize">
                  {v}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {hasAlign ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-align-${c.id}`}>Alignment</FieldLabel>
            <SegmentedControl
              label="Alignment"
              value={c.align}
              onChange={(next) => onUpdate({ align: next })}
              options={[
                { value: "left", label: "Left", icon: AlignLeftIcon },
                { value: "center", label: "Center", icon: AlignCenterIcon },
                { value: "right", label: "Right", icon: AlignRightIcon },
              ]}
            />
          </div>
        ) : null}

        {hasWidth ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-width-${c.id}`}>Width</FieldLabel>
            <Input
              id={`vs-width-${c.id}`}
              value={c.width}
              onChange={(e) => onUpdate({ width: e.target.value })}
              placeholder="100%, 320px, 20rem…"
            />
            <p className="text-[11px] text-muted-foreground">
              Any CSS width value — e.g. <code className="rounded bg-muted px-1">100%</code>,{" "}
              <code className="rounded bg-muted px-1">320px</code>.
            </p>
          </div>
        ) : null}

        {hasImage ? (
          <>
            <div className="space-y-1.5">
              <FieldLabel htmlFor={`vs-src-${c.id}`}>Image URL</FieldLabel>
              <Input
                id={`vs-src-${c.id}`}
                value={c.src}
                onChange={(e) => onUpdate({ src: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor={`vs-alt-${c.id}`}>Alt text</FieldLabel>
              <Input
                id={`vs-alt-${c.id}`}
                value={c.alt}
                onChange={(e) => onUpdate({ alt: e.target.value })}
                placeholder="Describe the image"
              />
            </div>
          </>
        ) : null}

        {hasPlaceholder ? (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`vs-placeholder-${c.id}`}>Placeholder</FieldLabel>
            <Input
              id={`vs-placeholder-${c.id}`}
              value={c.placeholder}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Enter text…"
            />
          </div>
        ) : null}

        {c.type === "divider" ? (
          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            A divider has no editable properties. Use the actions below to move,
            duplicate, or delete it.
          </p>
        ) : null}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="w-full"
          >
            <ArrowUpIcon className="size-3.5" />
            Move up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="w-full"
          >
            <ArrowDownIcon className="size-3.5" />
            Move down
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="w-full"
          >
            <FilesIcon className="size-3.5" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="w-full"
          >
            <Trash2Icon className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Export dialog
// ═══════════════════════════════════════════════════════════════════════

function ExportDialog({
  open,
  onOpenChange,
  html,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  html: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = React.useCallback(async () => {
    const ok = await copyToClipboard(html);
    if (ok) {
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [html]);

  const byteLength = React.useMemo(
    () => (typeof html === "string" ? new Blob([html]).size : 0),
    [html],
  );
  const lineCount = React.useMemo(
    () => (typeof html === "string" ? html.split("\n").length : 0),
    [html],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2Icon className="size-4 text-primary" />
            Exported HTML
          </DialogTitle>
          <DialogDescription>
            Standalone HTML document with inline styles — no framework
            dependency. {lineCount} lines · {(byteLength / 1024).toFixed(1)} KB.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <pre className="max-h-[55vh] overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed">
            <code className="font-mono text-foreground/90 whitespace-pre">
              {html}
            </code>
          </pre>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Paste into a <code className="rounded bg-muted px-1">.html</code> file
            and open in any browser.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            variant={copied ? "secondary" : "default"}
          >
            {copied ? (
              <>
                <CheckIcon className="size-3.5" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5" />
                Copy HTML
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function VisualStudio(): React.JSX.Element {
  const [components, setComponents] = React.useState<CanvasComponent[]>(
    () => INITIAL_COMPONENTS.map((c) => ({ ...c })),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [exportOpen, setExportOpen] = React.useState<boolean>(false);

  const selected = React.useMemo(
    () => components.find((c) => c.id === selectedId) ?? null,
    [components, selectedId],
  );

  const exportedHtml = React.useMemo(
    () => exportHtml(components),
    [components],
  );

  // ─── Drag from palette ──────────────────────────────────────────────

  const handlePaletteDragStart = React.useCallback(
    (e: React.DragEvent<HTMLButtonElement>, type: ComponentType) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData(DRAG_MIME, type);
        e.dataTransfer.effectAllowed = "copy";
      }
      setIsDragging(true);
      setDropIndex(components.length);
    },
    [components.length],
  );

  const handlePaletteDragEnd = React.useCallback(() => {
    setIsDragging(false);
    setDropIndex(null);
  }, []);

  // ─── Drop on canvas (ref-based insertion index) ─────────────────────
  //
  // A single canvas-level dragOver/drop pair computes the insertion index
  // from the pointer's vertical position relative to each component
  // wrapper's bounding rect. This avoids per-component handlers and the
  // classic "gap between items" blind spot. `itemRefs` holds the wrapper
  // divs indexed by position; stale entries beyond the current length are
  // ignored because `computeDropIndex` only iterates 0..count-1.

  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const computeDropIndex = React.useCallback(
    (clientY: number, count: number): number => {
      const refs = itemRefs.current;
      for (let i = 0; i < count; i++) {
        const el = refs[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Insert before the first component whose vertical midpoint is
        // below the pointer. Otherwise fall through to append at the end.
        if (clientY < rect.top + rect.height / 2) {
          return i;
        }
      }
      return count;
    },
    [],
  );

  const handleCanvasDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
      const idx = computeDropIndex(e.clientY, components.length);
      setDropIndex((prev) => (prev === idx ? prev : idx));
    },
    [isDragging, components.length, computeDropIndex],
  );

  const handleCanvasDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      const type = e.dataTransfer
        ? (e.dataTransfer.getData(DRAG_MIME) as ComponentType)
        : "";
      if (!type) {
        setIsDragging(false);
        setDropIndex(null);
        return;
      }
      const insertAt = computeDropIndex(e.clientY, components.length);
      const newComp = makeDefaultComponent(type, makeId());
      setComponents((prev) => {
        const next = prev.slice();
        next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, newComp);
        return next;
      });
      setSelectedId(newComp.id);
      setIsDragging(false);
      setDropIndex(null);
    },
    [isDragging, components.length, computeDropIndex],
  );

  // ─── Component actions ──────────────────────────────────────────────

  const handleSelect = React.useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleUpdate = React.useCallback(
    (patch: Partial<CanvasComponent>) => {
      if (!selectedId) return;
      setComponents((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, ...patch } : c)),
      );
    },
    [selectedId],
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      setComponents((prev) => prev.filter((c) => c.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [],
  );

  const handleDuplicate = React.useCallback((id: string) => {
    setComponents((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const copy: CanvasComponent = { ...prev[idx], id: makeId() };
      const next = prev.slice();
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const handleMove = React.useCallback((id: string, dir: -1 | 1) => {
    setComponents((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(idx, 1);
      if (!moved) return prev;
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const handleClearCanvas = React.useCallback(() => {
    setComponents([]);
    setSelectedId(null);
  }, []);

  const handleDeselect = React.useCallback(() => {
    setSelectedId(null);
  }, []);

  // ─── Keyboard shortcuts (Delete / Escape) ───────────────────────────
  //
  // Only attached on the client (inside useEffect). The handler reads the
  // latest selectedId / components via refs so the listener itself is
  // registered once and never goes stale.

  const selectedIdRef = React.useRef<string | null>(selectedId);
  React.useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const deleteRef = React.useRef(handleDelete);
  React.useEffect(() => {
    deleteRef.current = handleDelete;
  }, [handleDelete]);

  const deselectRef = React.useRef(handleDeselect);
  React.useEffect(() => {
    deselectRef.current = handleDeselect;
  }, [handleDeselect]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Ignore when typing into a field (so Backspace/Delete work in inputs).
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIdRef.current) {
        e.preventDefault();
        deleteRef.current(selectedIdRef.current);
      } else if (e.key === "Escape") {
        deselectRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────

  const selectedIndex = selected
    ? components.findIndex((c) => c.id === selected.id)
    : -1;

  return (
    <section
      aria-label="Visual Studio"
      className="mx-auto w-full max-w-7xl"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            <LayersIcon className="size-5 text-primary" />
            Visual Studio
          </h2>
          <p className="text-sm text-muted-foreground">
            Drag components onto the canvas, edit their properties, and export
            clean HTML.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <LayersIcon className="size-3.5" />
            {components.length} component{components.length === 1 ? "" : "s"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCanvas}
            disabled={components.length === 0}
          >
            <Trash2Icon className="size-3.5" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => setExportOpen(true)}
            disabled={components.length === 0}
          >
            <Code2Icon className="size-3.5" />
            Export HTML
          </Button>
        </div>
      </div>

      {/* Three-pane layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr_300px]">
        {/* ─── Palette (left) ──────────────────────────────────────── */}
        <aside
          aria-label="Component palette"
          className="flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-2.5"
        >
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <PlusIcon className="size-3" />
            Components
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {PALETTE.map((entry) => (
              <PaletteItem
                key={entry.type}
                entry={entry}
                onDragStart={handlePaletteDragStart}
                onDragEnd={handlePaletteDragEnd}
              />
            ))}
          </div>
          <p className="mt-1 px-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Drag any component onto the canvas. Drop on the top half of an
            existing element to insert above it, or the bottom half to insert
            below.
          </p>
        </aside>

        {/* ─── Canvas (center) ─────────────────────────────────────── */}
        <div
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onClick={handleDeselect}
          role="application"
          aria-label="Canvas — drop components here"
          className={cn(
            "relative flex min-h-[560px] flex-col gap-2.5 rounded-xl border border-border p-4",
            "transition-colors",
            isDragging
              ? "border-primary/60 bg-primary/5"
              : "bg-background",
          )}
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--border) 70%, transparent) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          {components.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PlusIcon className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Empty canvas
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Drag a component from the palette on the left to start
                building your layout.
              </p>
            </div>
          ) : null}

          {/* Drop indicator before each component */}
          {components.map((c, i) => (
            <React.Fragment key={c.id}>
              {isDragging && dropIndex === i ? (
                <div
                  aria-hidden
                  className="h-0.5 w-full animate-pulse rounded-full bg-primary"
                />
              ) : null}
              <div
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <CanvasComponentView
                  component={c}
                  selected={selectedId === c.id}
                  canMoveUp={i > 0}
                  canMoveDown={i < components.length - 1}
                  onSelect={() => handleSelect(c.id)}
                  onDelete={() => handleDelete(c.id)}
                  onDuplicate={() => handleDuplicate(c.id)}
                  onMoveUp={() => handleMove(c.id, -1)}
                  onMoveDown={() => handleMove(c.id, 1)}
                />
              </div>
            </React.Fragment>
          ))}

          {/* Drop indicator at the end */}
          {isDragging &&
          dropIndex !== null &&
          dropIndex >= components.length ? (
            <div
              aria-hidden
              className="h-0.5 w-full animate-pulse rounded-full bg-primary"
            />
          ) : null}
        </div>

        {/* ─── Properties (right) ──────────────────────────────────── */}
        <aside
          aria-label="Properties panel"
          className="flex flex-col rounded-xl border border-border bg-card/50 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]"
        >
          <PropertiesPanel
            component={selected}
            canMoveUp={selectedIndex > 0}
            canMoveDown={
              selectedIndex !== -1 && selectedIndex < components.length - 1
            }
            onUpdate={handleUpdate}
            onDelete={() => selected && handleDelete(selected.id)}
            onDuplicate={() => selected && handleDuplicate(selected.id)}
            onMoveUp={() => selected && handleMove(selected.id, -1)}
            onMoveDown={() => selected && handleMove(selected.id, 1)}
          />
        </aside>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        html={exportedHtml}
      />
    </section>
  );
}
