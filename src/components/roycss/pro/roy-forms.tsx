"use client";

/**
 * RoyForms — a visual form-building platform.
 *
 * Three-pane layout:
 *   • Left   — palette of field types (Text, Email, Password, Number, Textarea,
 *              Select, Checkbox, Radio, Date, File Upload). Click to add.
 *   • Middle — form canvas. Builder tab to reorder/select/delete fields;
 *              Preview tab to fill the form live, with on-blur validation,
 *              required-field errors on submit, success message, multi-step
 *              mode with progress indicator.
 *   • Right  — properties panel for the selected field (label, placeholder,
 *              required, help text, validation rules, width, conditional show).
 *
 * Top toolbar:
 *   • Multi-step toggle (single-page ⇄ 3 steps).
 *   • Export Form Code — generates a JSX + react-hook-form code string with a
 *     Copy-to-clipboard button inside a dialog.
 *
 * Self-contained: no props, no external state. TS strict, zero `any`.
 * No indigo/blue. Semantic theme tokens throughout.
 */

import * as React from "react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Eye,
  FileCode2,
  FileText,
  GripVertical,
  Hash,
  List,
  Lock,
  Mail,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────

type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file";

type FieldWidth = "full" | "half";

interface FieldOption {
  value: string;
  label: string;
}

interface ConditionalRule {
  fieldId: string;
  value: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  width: FieldWidth;
  /** For select/radio. */
  options: FieldOption[];
  /** Text-type validation. */
  minLength: number | null;
  maxLength: number | null;
  pattern: string;
  /** Number validation. */
  min: number | null;
  max: number | null;
  /** Conditional visibility. */
  showIf: ConditionalRule | null;
}

type FormValue = string | boolean;
type FormValues = Record<string, FormValue>;
type FormErrors = Record<string, string | null>;
type TouchedSet = Record<string, boolean>;

// ─── Constants ─────────────────────────────────────────────────────────

interface FieldTypeMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  /** True if select/radio (need options editor). */
  hasOptions: boolean;
  /** True if length/pattern validation applies. */
  hasTextValidation: boolean;
  /** True if min/max numeric validation applies. */
  hasNumberValidation: boolean;
}

const FIELD_TYPE_META: Record<FieldType, FieldTypeMeta> = {
  text: {
    label: "Text",
    icon: Type,
    hint: "Single-line text",
    hasOptions: false,
    hasTextValidation: true,
    hasNumberValidation: false,
  },
  email: {
    label: "Email",
    icon: Mail,
    hint: "Validated email input",
    hasOptions: false,
    hasTextValidation: true,
    hasNumberValidation: false,
  },
  password: {
    label: "Password",
    icon: Lock,
    hint: "Masked input",
    hasOptions: false,
    hasTextValidation: true,
    hasNumberValidation: false,
  },
  number: {
    label: "Number",
    icon: Hash,
    hint: "Numeric input",
    hasOptions: false,
    hasTextValidation: false,
    hasNumberValidation: true,
  },
  textarea: {
    label: "Textarea",
    icon: FileText,
    hint: "Multi-line text",
    hasOptions: false,
    hasTextValidation: true,
    hasNumberValidation: false,
  },
  select: {
    label: "Select",
    icon: List,
    hint: "Dropdown list",
    hasOptions: true,
    hasTextValidation: false,
    hasNumberValidation: false,
  },
  checkbox: {
    label: "Checkbox",
    icon: CheckSquare,
    hint: "Single boolean",
    hasOptions: false,
    hasTextValidation: false,
    hasNumberValidation: false,
  },
  radio: {
    label: "Radio",
    icon: Circle,
    hint: "Choose one option",
    hasOptions: true,
    hasTextValidation: false,
    hasNumberValidation: false,
  },
  date: {
    label: "Date",
    icon: Calendar,
    hint: "Date picker",
    hasOptions: false,
    hasTextValidation: false,
    hasNumberValidation: false,
  },
  file: {
    label: "File Upload",
    icon: Upload,
    hint: "File picker",
    hasOptions: false,
    hasTextValidation: false,
    hasNumberValidation: false,
  },
};

const FIELD_TYPES: readonly FieldType[] = [
  "text",
  "email",
  "password",
  "number",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "date",
  "file",
] as const;

const STEP_COUNT = 3;

// ─── Helpers ───────────────────────────────────────────────────────────

let fieldIdCounter = 0;
function makeFieldId(): string {
  fieldIdCounter += 1;
  return `f-${Date.now().toString(36)}-${fieldIdCounter}`;
}

function defaultLabelFor(type: FieldType, index: number): string {
  const base = FIELD_TYPE_META[type].label;
  return `${base} ${index}`;
}

function makeField(type: FieldType, index: number): FormField {
  const base: FormField = {
    id: makeFieldId(),
    type,
    label: defaultLabelFor(type, index),
    placeholder: "",
    helpText: "",
    required: false,
    width: "full",
    options: [],
    minLength: null,
    maxLength: null,
    pattern: "",
    min: null,
    max: null,
    showIf: null,
  };
  if (type === "select" || type === "radio") {
    base.options = [
      { value: "opt-1", label: "Option 1" },
      { value: "opt-2", label: "Option 2" },
    ];
  }
  if (type === "email") {
    base.placeholder = "name@example.com";
  }
  if (type === "password") {
    base.placeholder = "••••••••";
  }
  return base;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmptyValue(value: FormValue | undefined, type: FieldType): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  // boolean
  if (type === "checkbox") return value === false;
  return false;
}

function validateField(
  field: FormField,
  value: FormValue | undefined,
): string | null {
  const empty = isEmptyValue(value, field.type);

  if (field.required && empty) {
    return `${field.label} is required.`;
  }
  if (empty) return null;

  const str = typeof value === "string" ? value : String(value);

  if (field.type === "email") {
    if (!EMAIL_RE.test(str)) return "Enter a valid email address.";
  }

  if (field.type === "number") {
    const num = Number(str);
    if (Number.isNaN(num)) return "Must be a number.";
    if (field.min !== null && num < field.min)
      return `Must be at least ${field.min}.`;
    if (field.max !== null && num > field.max)
      return `Must be at most ${field.max}.`;
  }

  if (
    field.type === "text" ||
    field.type === "textarea" ||
    field.type === "password" ||
    field.type === "email"
  ) {
    if (field.minLength !== null && str.length < field.minLength)
      return `Must be at least ${field.minLength} characters.`;
    if (field.maxLength !== null && str.length > field.maxLength)
      return `Must be at most ${field.maxLength} characters.`;
    if (field.pattern.trim()) {
      try {
        const re = new RegExp(field.pattern);
        if (!re.test(str)) return "Invalid format.";
      } catch {
        // Invalid regex — skip pattern check.
      }
    }
  }

  return null;
}

function isFieldVisible(field: FormField, values: FormValues): boolean {
  if (!field.showIf) return true;
  const v = values[field.showIf.fieldId];
  return v === field.showIf.value;
}

function getFieldStep(index: number, total: number, multiStep: boolean): number {
  if (!multiStep || total === 0) return 0;
  const perStep = Math.max(1, Math.ceil(total / STEP_COUNT));
  return Math.min(STEP_COUNT - 1, Math.floor(index / perStep));
}

function toFieldValue(value: FormValue | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return value;
}

// ─── Initial fields ────────────────────────────────────────────────────

const INITIAL_FIELDS: FormField[] = [
  {
    id: "seed-name",
    type: "text",
    label: "Full name",
    placeholder: "Jane Doe",
    helpText: "",
    required: true,
    width: "full",
    options: [],
    minLength: 2,
    maxLength: 80,
    pattern: "",
    min: null,
    max: null,
    showIf: null,
  },
  {
    id: "seed-email",
    type: "email",
    label: "Email",
    placeholder: "jane@example.com",
    helpText: "We'll never share your email.",
    required: true,
    width: "full",
    options: [],
    minLength: null,
    maxLength: null,
    pattern: "",
    min: null,
    max: null,
    showIf: null,
  },
  {
    id: "seed-role",
    type: "select",
    label: "Role",
    placeholder: "Select your role",
    helpText: "",
    required: false,
    width: "half",
    options: [
      { value: "dev", label: "Developer" },
      { value: "design", label: "Designer" },
      { value: "pm", label: "Product Manager" },
    ],
    minLength: null,
    maxLength: null,
    pattern: "",
    min: null,
    max: null,
    showIf: null,
  },
  {
    id: "seed-subscribe",
    type: "checkbox",
    label: "Subscribe to newsletter",
    placeholder: "",
    helpText: "Receive product updates. No spam.",
    required: false,
    width: "full",
    options: [],
    minLength: null,
    maxLength: null,
    pattern: "",
    min: null,
    max: null,
    showIf: null,
  },
  {
    id: "seed-message",
    type: "textarea",
    label: "Message",
    placeholder: "How can we help?",
    helpText: "",
    required: false,
    width: "full",
    options: [],
    minLength: null,
    maxLength: 500,
    pattern: "",
    min: null,
    max: null,
    showIf: null,
  },
];

// ─── Field Palette (left) ──────────────────────────────────────────────

interface FieldPaletteProps {
  onAdd: (type: FieldType) => void;
}

function FieldPalette({ onAdd }: FieldPaletteProps) {
  return (
    <aside
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3"
      aria-label="Field palette"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight">Field types</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Click a field to add it to the canvas.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {FIELD_TYPES.map((type) => {
          const meta = FIELD_TYPE_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type)}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-2 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              aria-label={`Add ${meta.label} field`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Icon className="size-3.5 text-muted-foreground group-hover:text-primary" aria-hidden />
                {meta.label}
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                {meta.hint}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Builder canvas — single field card ────────────────────────────────

interface FieldCardProps {
  field: FormField;
  selected: boolean;
  stepLabel: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function FieldCard({
  field,
  selected,
  stepLabel,
  canMoveUp,
  canMoveDown,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldCardProps) {
  const meta = FIELD_TYPE_META[field.type];
  const Icon = meta.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      aria-label={`Field: ${field.label}. ${selected ? "Selected." : "Click to select."}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border bg-card p-3 text-left shadow-sm transition-all",
        "cursor-pointer hover:border-primary/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary ring-1 ring-inset ring-primary/40"
          : "border-border",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* Drag handle / reorder controls */}
          <span
            className="flex flex-col"
            aria-hidden
          >
            <GripVertical className="size-3.5 text-muted-foreground/40" />
          </span>
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm font-medium">
            {field.label || "Untitled field"}
            {field.required ? (
              <span className="ml-0.5 text-destructive" aria-label="required">
                *
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant="outline"
            className="h-4.5 rounded px-1.5 text-[10px] font-medium"
          >
            {meta.label}
          </Badge>
          {stepLabel ? (
            <Badge variant="secondary" className="h-4.5 rounded px-1.5 text-[10px]">
              {stepLabel}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className="h-4.5 rounded px-1.5 text-[10px] capitalize text-muted-foreground"
          >
            {field.width}
          </Badge>
        </div>
      </div>

      {/* Live input preview (non-interactive in builder) */}
      <FieldPreview field={field} />

      {/* Footer: help text + actions */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0 text-[11px] text-muted-foreground">
          {field.helpText ? (
            <span className="line-clamp-1">{field.helpText}</span>
          ) : (
            <span className="italic opacity-60">No help text</span>
          )}
          {field.showIf ? (
            <span className="mt-0.5 block truncate text-primary/80">
              Conditional: shown when &quot;{field.showIf.fieldId}&quot; =
              &quot;{field.showIf.value}&quot;
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Reorder up/down (the "drag handle" affordance) */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={!canMoveUp}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            aria-label={`Move ${field.label} up`}
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={!canMoveDown}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            aria-label={`Move ${field.label} down`}
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Separator orientation="vertical" className="mx-0.5 h-4" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${field.label}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Field preview (read-only visual of the field) ─────────────────────

function FieldPreview({ field }: { field: FormField }) {
  const selectClass =
    "border-input dark:bg-input/30 flex h-9 w-full items-center rounded-md border bg-transparent px-3 text-sm shadow-xs opacity-70";
  const inputClass =
    "border-input dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs opacity-70";

  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          tabIndex={-1}
          readOnly
          placeholder={field.placeholder || "Multi-line input"}
          className="min-h-16 opacity-70"
          aria-hidden
        />
      );
    case "select":
      return (
        <div className={selectClass}>
          <span className="text-muted-foreground">
            {field.placeholder || "Choose…"}
          </span>
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2 opacity-70" aria-hidden>
          <Checkbox checked={false} disabled aria-hidden />
          <span className="text-sm text-muted-foreground">
            {field.label}
          </span>
        </div>
      );
    case "radio":
      return (
        <div className="flex flex-wrap gap-3 opacity-70" aria-hidden>
          {(field.options.length ? field.options : [{ value: "x", label: "Option A" }]).slice(0, 3).map((opt) => (
            <div key={opt.value} className="flex items-center gap-1.5">
              <RadioGroupItem value={opt.value} disabled aria-hidden />
              <span className="text-sm text-muted-foreground">{opt.label}</span>
            </div>
          ))}
        </div>
      );
    case "date":
      return (
        <Input
          tabIndex={-1}
          readOnly
          type="date"
          placeholder={field.placeholder}
          className={inputClass}
          aria-hidden
        />
      );
    case "file":
      return (
        <div
          className={cn(
            inputClass,
            "flex cursor-pointer items-center gap-2 text-muted-foreground",
          )}
          aria-hidden
        >
          <Upload className="size-3.5" />
          <span className="text-sm">{field.placeholder || "Choose file…"}</span>
        </div>
      );
    default:
      return (
        <Input
          tabIndex={-1}
          readOnly
          type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          className={inputClass}
          aria-hidden
        />
      );
  }
}

// ─── Properties panel (right) ──────────────────────────────────────────

interface PropertiesPanelProps {
  fields: FormField[];
  selected: FormField | null;
  onUpdate: (id: string, patch: Partial<FormField>) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (id: string, index: number, patch: Partial<FieldOption>) => void;
  onRemoveOption: (id: string, index: number) => void;
}

function PropertiesPanel({
  fields,
  selected,
  onUpdate,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: PropertiesPanelProps) {
  if (!selected) {
    return (
      <aside
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
        aria-label="Field properties"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">Properties</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Select a field on the canvas to edit its properties.
        </p>
        <ul className="mt-1 space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
            Edit labels, placeholders, and help text.
          </li>
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
            Toggle required, set width (full/half).
          </li>
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
            Add validation rules (min/max length, pattern, numeric range).
          </li>
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
            Configure conditional visibility (show if).
          </li>
        </ul>
      </aside>
    );
  }

  const meta = FIELD_TYPE_META[selected.type];

  // Possible "show-if" target fields: any other field with a discrete value.
  // For simplicity, all other fields are eligible; we let the user supply a string value.
  const otherFields = fields.filter((f) => f.id !== selected.id);

  return (
    <aside
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      aria-label={`Properties for ${selected.label}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Settings2 className="size-4 text-primary" aria-hidden />
          <h3 className="truncate text-sm font-semibold tracking-tight">
            {selected.label || "Untitled"}
          </h3>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {meta.label}
        </Badge>
      </div>

      <Separator />

      {/* Label */}
      <PropertyRow label="Label" htmlFor={`prop-label-${selected.id}`}>
        <Input
          id={`prop-label-${selected.id}`}
          value={selected.label}
          onChange={(e) => onUpdate(selected.id, { label: e.target.value })}
          placeholder="Field label"
        />
      </PropertyRow>

      {/* Placeholder (not for checkbox) */}
      {selected.type !== "checkbox" ? (
        <PropertyRow label="Placeholder" htmlFor={`prop-ph-${selected.id}`}>
          <Input
            id={`prop-ph-${selected.id}`}
            value={selected.placeholder}
            onChange={(e) => onUpdate(selected.id, { placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </PropertyRow>
      ) : null}

      {/* Help text */}
      <PropertyRow label="Help text" htmlFor={`prop-help-${selected.id}`}>
        <Textarea
          id={`prop-help-${selected.id}`}
          value={selected.helpText}
          onChange={(e) => onUpdate(selected.id, { helpText: e.target.value })}
          placeholder="Shown below the field"
          className="min-h-12"
        />
      </PropertyRow>

      {/* Required + width */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
          <Label htmlFor={`prop-req-${selected.id}`} className="text-xs">
            Required
          </Label>
          <Switch
            id={`prop-req-${selected.id}`}
            checked={selected.required}
            onCheckedChange={(v) => onUpdate(selected.id, { required: v })}
            aria-label="Required field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`prop-width-${selected.id}`} className="text-xs text-muted-foreground">
            Width
          </Label>
          <select
            id={`prop-width-${selected.id}`}
            className={cn(
              "border-input dark:bg-input/30 flex h-9 w-full items-center rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
            value={selected.width}
            onChange={(e) =>
              onUpdate(selected.id, { width: e.target.value as FieldWidth })
            }
          >
            <option value="full">Full width</option>
            <option value="half">Half width</option>
          </select>
        </div>
      </div>

      {/* Validation: text-type */}
      {meta.hasTextValidation ? (
        <>
          <Separator />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Validation
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <PropertyRow label="Min length" htmlFor={`prop-min-${selected.id}`}>
              <Input
                id={`prop-min-${selected.id}`}
                type="number"
                min={0}
                value={selected.minLength ?? ""}
                onChange={(e) =>
                  onUpdate(selected.id, {
                    minLength: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="—"
              />
            </PropertyRow>
            <PropertyRow label="Max length" htmlFor={`prop-max-${selected.id}`}>
              <Input
                id={`prop-max-${selected.id}`}
                type="number"
                min={0}
                value={selected.maxLength ?? ""}
                onChange={(e) =>
                  onUpdate(selected.id, {
                    maxLength: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="—"
              />
            </PropertyRow>
          </div>
          <PropertyRow label="Pattern (regex)" htmlFor={`prop-pat-${selected.id}`}>
            <Input
              id={`prop-pat-${selected.id}`}
              value={selected.pattern}
              onChange={(e) => onUpdate(selected.id, { pattern: e.target.value })}
              placeholder="e.g. ^[A-Z]{2}$"
              className="font-mono text-xs"
            />
          </PropertyRow>
        </>
      ) : null}

      {/* Validation: number */}
      {meta.hasNumberValidation ? (
        <>
          <Separator />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Number validation
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <PropertyRow label="Min value" htmlFor={`prop-nmin-${selected.id}`}>
              <Input
                id={`prop-nmin-${selected.id}`}
                type="number"
                value={selected.min ?? ""}
                onChange={(e) =>
                  onUpdate(selected.id, {
                    min: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="—"
              />
            </PropertyRow>
            <PropertyRow label="Max value" htmlFor={`prop-nmax-${selected.id}`}>
              <Input
                id={`prop-nmax-${selected.id}`}
                type="number"
                value={selected.max ?? ""}
                onChange={(e) =>
                  onUpdate(selected.id, {
                    max: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="—"
              />
            </PropertyRow>
          </div>
        </>
      ) : null}

      {/* Options editor */}
      {meta.hasOptions ? (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Options
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => onAddOption(selected.id)}
            >
              <Plus className="size-3" />
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {selected.options.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-2 text-center text-xs text-muted-foreground">
                No options yet.
              </p>
            ) : null}
            {selected.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  value={opt.value}
                  onChange={(e) =>
                    onUpdateOption(selected.id, i, { value: e.target.value })
                  }
                  placeholder="value"
                  className="h-8 font-mono text-xs"
                  aria-label={`Option ${i + 1} value`}
                />
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    onUpdateOption(selected.id, i, { label: e.target.value })
                  }
                  placeholder="label"
                  className="h-8 text-xs"
                  aria-label={`Option ${i + 1} label`}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onRemoveOption(selected.id, i)}
                  aria-label={`Remove option ${i + 1}`}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Conditional logic */}
      <Separator />
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Show if
        </h4>
        <Switch
          checked={selected.showIf !== null}
          onCheckedChange={(v) =>
            onUpdate(selected.id, {
              showIf: v
                ? {
                    fieldId: otherFields[0]?.id ?? "",
                    value: "",
                  }
                : null,
            })
          }
          aria-label="Enable conditional visibility"
        />
      </div>
      {selected.showIf ? (
        <div className="grid grid-cols-2 gap-2">
          <PropertyRow label="Depends on" htmlFor={`prop-if-field-${selected.id}`}>
            <select
              id={`prop-if-field-${selected.id}`}
              className={cn(
                "border-input dark:bg-input/30 flex h-9 w-full items-center rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
              value={selected.showIf.fieldId}
              onChange={(e) =>
                onUpdate(selected.id, {
                  showIf: { ...selected.showIf!, fieldId: e.target.value },
                })
              }
            >
              <option value="">Select field…</option>
              {otherFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label || f.id}
                </option>
              ))}
            </select>
          </PropertyRow>
          <PropertyRow label="Equals value" htmlFor={`prop-if-val-${selected.id}`}>
            <Input
              id={`prop-if-val-${selected.id}`}
              value={selected.showIf.value}
              onChange={(e) =>
                onUpdate(selected.id, {
                  showIf: { ...selected.showIf!, value: e.target.value },
                })
              }
              placeholder="value"
              className="font-mono text-xs"
            />
          </PropertyRow>
        </div>
      ) : null}
    </aside>
  );
}

function PropertyRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Live preview form (functional) ────────────────────────────────────

interface LivePreviewProps {
  fields: FormField[];
  values: FormValues;
  errors: FormErrors;
  touched: TouchedSet;
  submitted: boolean;
  success: boolean;
  multiStep: boolean;
  onChange: (id: string, value: FormValue) => void;
  onBlur: (id: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

function LivePreview({
  fields,
  values,
  errors,
  touched,
  submitted,
  success,
  multiStep,
  onChange,
  onBlur,
  onSubmit,
  onReset,
}: LivePreviewProps) {
  // Visible fields, respecting conditional logic.
  const visibleFields = useMemo(
    () => fields.filter((f) => isFieldVisible(f, values)),
    [fields, values],
  );

  // Multi-step state. We keep an internal step counter and derive the
  // *effective* step from `multiStep` so toggling the mode never needs a
  // state-reset effect (avoids cascading renders).
  const [step, setStep] = useState(0);

  // The stepOf helper is used for distribution of fields across steps and
  // (when a submit has been attempted) for jumping to the first step that
  // contains an error so the user can see and fix it.
  const stepOf = useCallback(
    (visibleIndex: number): number =>
      getFieldStep(visibleIndex, visibleFields.length, multiStep),
    [visibleFields.length, multiStep],
  );

  // Find the first step containing an error (after a submit attempt).
  // Cheap loop over visible fields — no memo needed.
  let firstErrorStep = -1;
  if (multiStep && submitted) {
    for (let i = 0; i < visibleFields.length; i++) {
      const f = visibleFields[i];
      if (f && validateField(f, values[f.id])) {
        firstErrorStep = stepOf(i);
        break;
      }
    }
  }

  const effectiveStep = firstErrorStep >= 0
    ? firstErrorStep
    : multiStep
      ? Math.min(step, STEP_COUNT - 1)
      : 0;

  if (visibleFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
        <FileText className="size-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Your form is empty. Add fields from the palette to see a live preview.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 py-12 text-center dark:border-emerald-900 dark:bg-emerald-950/40"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div>
          <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
            Form submitted successfully
          </p>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            All {visibleFields.length} field{visibleFields.length === 1 ? "" : "s"} validated.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Reset &amp; edit
        </Button>
      </div>
    );
  }

  // Compute step distribution for visible fields.
  const maxStep = STEP_COUNT - 1;
  const stepFields = multiStep
    ? visibleFields
        .map((f, i) => ({ f, i }))
        .filter(({ i }) => stepOf(i) === effectiveStep)
        .map(({ f }) => f)
    : visibleFields;

  const stepValid = stepFields.every(
    (f) => !validateField(f, values[f.id]),
  );

  const handleNext = () => {
    // Mark all fields in current step as touched so errors show.
    stepFields.forEach((f) => onBlur(f.id));
    if (stepValid) {
      setStep((s) => Math.min(maxStep, s + 1));
    }
  };
  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const progressPct =
    multiStep && visibleFields.length > 0
      ? Math.round(((effectiveStep + 1) / (maxStep + 1)) * 100)
      : 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      {multiStep ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {effectiveStep + 1} of {maxStep + 1}
            </span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
          <div className="flex items-center gap-1 pt-1">
            {Array.from({ length: maxStep + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  i === effectiveStep
                    ? "border-primary bg-primary/10 text-primary"
                    : i < effectiveStep
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-border text-muted-foreground hover:bg-accent",
                )}
                aria-current={i === effectiveStep ? "step" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {stepFields.map((f) => (
          <LiveField
            key={f.id}
            field={f}
            value={values[f.id]}
            error={errors[f.id] ?? null}
            showError={submitted || touched[f.id] === true}
            onChange={(v) => onChange(f.id, v)}
            onBlur={() => onBlur(f.id)}
          />
        ))}
      </div>

      {multiStep ? (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={effectiveStep === 0}
          >
            <ArrowLeft className="size-3.5" />
            Previous
          </Button>
          {effectiveStep < maxStep ? (
            <Button type="button" size="sm" onClick={handleNext}>
              Next
              <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button type="submit" size="sm">
              Submit
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
      )}
    </form>
  );
}

// ─── Live field renderer ───────────────────────────────────────────────

interface LiveFieldProps {
  field: FormField;
  value: FormValue | undefined;
  error: string | null;
  showError: boolean;
  onChange: (value: FormValue) => void;
  onBlur: () => void;
}

function LiveField({
  field,
  value,
  error,
  showError,
  onChange,
  onBlur,
}: LiveFieldProps) {
  const inputId = `live-${field.id}`;
  const describedBy = field.helpText ? `${inputId}-help` : undefined;
  const errorId = `${inputId}-error`;
  const ariaDescribedBy = showError && error
    ? errorId
    : describedBy;
  const hasError = showError && !!error;

  const wrapperClass = cn(
    "flex flex-col gap-1.5",
    field.width === "half" ? "col-span-1" : "col-span-2",
  );

  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={inputId}
            value={toFieldValue(value)}
            placeholder={field.placeholder}
            required={field.required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange(e.target.value)
            }
            onBlur={onBlur}
          />
        );
      case "select":
        return (
          <Select
            value={value === undefined ? undefined : toFieldValue(value)}
            onValueChange={(v: string) => onChange(v)}
          >
            <SelectTrigger
              id={inputId}
              className="w-full"
              aria-invalid={hasError}
              onBlur={onBlur}
            >
              <SelectValue placeholder={field.placeholder || "Choose…"} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={inputId}
              checked={value === true}
              required={field.required}
              aria-invalid={hasError}
              onCheckedChange={(v: boolean | "indeterminate") =>
                onChange(v === true)
              }
              onBlur={onBlur}
            />
            <Label htmlFor={inputId} className="text-sm font-normal">
              {field.placeholder || field.label}
            </Label>
          </div>
        );
      case "radio": {
        const opts = field.options.length
          ? field.options
          : [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
        return (
          <RadioGroup
            value={value === undefined ? undefined : toFieldValue(value)}
            onValueChange={(v: string) => onChange(v)}
            className="flex flex-wrap gap-3"
          >
            {opts.map((opt) => (
              <div key={opt.value} className="flex items-center gap-1.5">
                <RadioGroupItem
                  value={opt.value}
                  id={`${inputId}-${opt.value}`}
                  aria-invalid={hasError}
                />
                <Label
                  htmlFor={`${inputId}-${opt.value}`}
                  className="text-sm font-normal"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      }
      case "date":
        return (
          <Input
            id={inputId}
            type="date"
            value={toFieldValue(value)}
            required={field.required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            onBlur={onBlur}
          />
        );
      case "file":
        return (
          <Input
            id={inputId}
            type="file"
            required={field.required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.files?.[0]?.name ?? "")
            }
            onBlur={onBlur}
          />
        );
      default:
        return (
          <Input
            id={inputId}
            type={
              field.type === "password"
                ? "password"
                : field.type === "number"
                  ? "number"
                  : field.type === "email"
                    ? "email"
                    : "text"
            }
            value={toFieldValue(value)}
            placeholder={field.placeholder}
            required={field.required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            onBlur={onBlur}
          />
        );
    }
  };

  return (
    <div className={wrapperClass}>
      {field.type !== "checkbox" ? (
        <Label htmlFor={inputId} className="text-sm font-medium">
          {field.label}
          {field.required ? (
            <span className="ml-0.5 text-destructive" aria-label="required">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {renderInput()}
      {field.helpText ? (
        <p
          id={`${inputId}-help`}
          className="text-xs text-muted-foreground"
        >
          {field.helpText}
        </p>
      ) : null}
      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── Export dialog ─────────────────────────────────────────────────────

function generateFormCode(
  fields: FormField[],
  multiStep: boolean,
): string {
  const lines: string[] = [];

  lines.push(`"use client";`);
  lines.push(``);
  lines.push(`import * as React from "react";`);
  lines.push(`import { useForm } from "react-hook-form";`);
  lines.push(`import { Input } from "@/components/ui/input";`);
  lines.push(`import { Label } from "@/components/ui/label";`);
  lines.push(`import { Textarea } from "@/components/ui/textarea";`);
  lines.push(`import { Button } from "@/components/ui/button";`);
  lines.push(`import { Checkbox } from "@/components/ui/checkbox";`);
  lines.push(`import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";`);
  lines.push(`import {`);
  lines.push(`  Select,`);
  lines.push(`  SelectContent,`);
  lines.push(`  SelectItem,`);
  lines.push(`  SelectTrigger,`);
  lines.push(`  SelectValue,`);
  lines.push(`} from "@/components/ui/select";`);
  lines.push(``);
  lines.push(`interface FormValues {`);
  for (const f of fields) {
    const ts = fieldToTSType(f);
    const opt = f.required ? "" : "?";
    lines.push(`  ${safeKey(f.id)}${opt}: ${ts};`);
  }
  lines.push(`}`);
  lines.push(``);
  lines.push(`export function GeneratedForm() {`);
  lines.push(`  const {`);
  lines.push(`    register,`);
  lines.push(`    handleSubmit,`);
  lines.push(`    formState: { errors },`);
  if (fields.some((f) => f.type === "select" || f.type === "radio" || f.type === "checkbox")) {
    lines.push(`    setValue,`);
    lines.push(`    watch,`);
  }
  lines.push(`  } = useForm<FormValues>();`);
  lines.push(``);
  lines.push(`  const onSubmit = (data: FormValues) => {`);
  lines.push(`    console.log("Form submitted:", data);`);
  lines.push(`    alert("Form submitted successfully!");`);
  lines.push(`  };`);
  lines.push(``);
  if (multiStep) {
    lines.push(`  const [step, setStep] = React.useState(0);`);
    lines.push(`  const stepCount = 3;`);
    lines.push(``);
  }
  lines.push(`  return (`);
  lines.push(`    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">`);

  fields.forEach((f, i) => {
    lines.push(...renderFieldJsx(f, i, fields.length, multiStep));
  });

  if (multiStep) {
    lines.push(`      <div className="col-span-2 flex items-center justify-between">`);
    lines.push(`        <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>`);
    lines.push(`          Previous`);
    lines.push(`        </Button>`);
    lines.push(`        {step < stepCount - 1 ? (`);
    lines.push(`          <Button type="button" onClick={() => setStep((s) => Math.min(stepCount - 1, s + 1))}>Next</Button>`);
    lines.push(`        ) : (`);
    lines.push(`          <Button type="submit">Submit</Button>`);
    lines.push(`        )}`);
    lines.push(`      </div>`);
  } else {
    lines.push(`      <div className="col-span-2 flex justify-end">`);
    lines.push(`        <Button type="submit">Submit</Button>`);
    lines.push(`      </div>`);
  }

  lines.push(`    </form>`);
  lines.push(`  );`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

function fieldToTSType(f: FormField): string {
  switch (f.type) {
    case "checkbox":
      return "boolean";
    case "number":
      return "number";
    case "select":
    case "radio":
      return f.options.length
        ? f.options.map((o) => `"${o.value}"`).join(" | ")
        : "string";
    default:
      return "string";
  }
}

function safeKey(id: string): string {
  // Use as-is; ids are alnum + dash. Replace dash with underscore for valid TS identifier.
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function renderFieldJsx(
  f: FormField,
  index: number,
  total: number,
  multiStep: boolean,
): string[] {
  const out: string[] = [];
  const id = safeKey(f.id);
  const widthClass = f.width === "half" ? "col-span-1" : "col-span-2";
  const fieldStep = getFieldStep(index, total, multiStep);

  out.push(`      {/* ${f.label} (${f.type}) */}`);

  if (multiStep) {
    out.push(`      {step === ${fieldStep} && (`);
  }

  out.push(`      <div className="${widthClass} flex flex-col gap-1.5">`);

  // Build register options
  const rules: string[] = [];
  if (f.required) rules.push(`required: "${f.label} is required."`);
  if (f.type === "email") rules.push(`pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: "Invalid email." }`);
  if (f.minLength !== null) rules.push(`minLength: { value: ${f.minLength}, message: "Min ${f.minLength} chars." }`);
  if (f.maxLength !== null) rules.push(`maxLength: { value: ${f.maxLength}, message: "Max ${f.maxLength} chars." }`);
  if (f.pattern.trim()) rules.push(`pattern: { value: /${f.pattern}/, message: "Invalid format." }`);
  if (f.type === "number" && f.min !== null) rules.push(`min: { value: ${f.min}, message: "Min ${f.min}." }`);
  if (f.type === "number" && f.max !== null) rules.push(`max: { value: ${f.max}, message: "Max ${f.max}." }`);
  const rulesStr = rules.length ? `{ ${rules.join(", ")} }` : "";

  // Label (skip for checkbox)
  if (f.type !== "checkbox") {
    out.push(`        <Label htmlFor="${id}">${escapeJsx(f.label)}${f.required ? " *" : ""}</Label>`);
  }

  switch (f.type) {
    case "textarea":
      out.push(`        <Textarea id="${id}" placeholder="${escapeJsx(f.placeholder)}" {...register("${id}"${rulesStr ? `, ${rulesStr}` : ""})} />`);
      break;
    case "select":
      out.push(`        <Select onValueChange={(v) => setValue("${id}", v)} defaultValue={watch("${id}")}>`);
      out.push(`          <SelectTrigger id="${id}" className="w-full">`);
      out.push(`            <SelectValue placeholder="${escapeJsx(f.placeholder || "Choose…")}" />`);
      out.push(`          </SelectTrigger>`);
      out.push(`          <SelectContent>`);
      for (const opt of f.options) {
        out.push(`            <SelectItem value="${escapeJsx(opt.value)}">${escapeJsx(opt.label)}</SelectItem>`);
      }
      out.push(`          </SelectContent>`);
      out.push(`        </Select>`);
      break;
    case "checkbox":
      out.push(`        <div className="flex items-center gap-2">`);
      out.push(`          <Checkbox id="${id}" onCheckedChange={(v) => setValue("${id}", v === true)} />`);
      out.push(`          <Label htmlFor="${id}" className="font-normal">${escapeJsx(f.placeholder || f.label)}</Label>`);
      out.push(`        </div>`);
      break;
    case "radio": {
      const opts = f.options.length ? f.options : [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
      out.push(`        <RadioGroup onValueChange={(v) => setValue("${id}", v)} className="flex gap-3">`);
      for (const opt of opts) {
        out.push(`          <div className="flex items-center gap-1.5">`);
        out.push(`            <RadioGroupItem value="${escapeJsx(opt.value)}" id="${id}-${escapeJsx(opt.value)}" />`);
        out.push(`            <Label htmlFor="${id}-${escapeJsx(opt.value)}" className="font-normal">${escapeJsx(opt.label)}</Label>`);
        out.push(`          </div>`);
      }
      out.push(`        </RadioGroup>`);
      break;
    }
    case "date":
      out.push(`        <Input id="${id}" type="date" {...register("${id}"${rulesStr ? `, ${rulesStr}` : ""})} />`);
      break;
    case "file":
      out.push(`        <Input id="${id}" type="file" {...register("${id}"${rulesStr ? `, ${rulesStr}` : ""})} />`);
      break;
    case "number": {
      // For numeric fields we inline the register options so valueAsNumber
      // is always set alongside any rule entries.
      const numRules: string[] = ["valueAsNumber: true"];
      if (f.required) numRules.push(`required: "${f.label} is required."`);
      if (f.min !== null) numRules.push(`min: { value: ${f.min}, message: "Min ${f.min}." }`);
      if (f.max !== null) numRules.push(`max: { value: ${f.max}, message: "Max ${f.max}." }`);
      out.push(`        <Input id="${id}" type="number" placeholder="${escapeJsx(f.placeholder)}" {...register("${id}", { ${numRules.join(", ")} })} />`);
      break;
    }
    default:
      out.push(`        <Input id="${id}" type="${f.type === "email" ? "email" : f.type === "password" ? "password" : "text"}" placeholder="${escapeJsx(f.placeholder)}" {...register("${id}"${rulesStr ? `, ${rulesStr}` : ""})} />`);
      break;
  }

  if (f.helpText) {
    out.push(`        <p className="text-xs text-muted-foreground">${escapeJsx(f.helpText)}</p>`);
  }
  out.push(`        {errors.${id} ? <p className="text-xs text-destructive">{errors.${id}?.message}</p> : null}`);

  out.push(`      </div>`);

  if (multiStep) {
    out.push(`      )}`);
  }

  return out;
}

function escapeJsx(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Export dialog component ───────────────────────────────────────────

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

function ExportDialog({ open, onOpenChange, code }: ExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Form code copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select the textarea content.
      textareaRef.current?.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Form code copied to clipboard");
        setTimeout(() => setCopied(false), 1800);
      } catch {
        toast.error("Copy failed — select the code manually.");
      }
    }
  }, [code]);

  const handleSelect = useCallback(() => {
    textareaRef.current?.select();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <FileCode2 className="size-5 text-primary" aria-hidden />
            Exported form code
          </DialogTitle>
          <DialogDescription>
            React + react-hook-form implementation. Paste into a{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              .tsx
            </code>{" "}
            file inside your Next.js app.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden px-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              readOnly
              value={code}
              onClick={handleSelect}
              onFocus={handleSelect}
              className={cn(
                "h-[55vh] w-full resize-none rounded-md border border-border bg-muted/40 p-3",
                "font-mono text-xs leading-relaxed text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Generated form code"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <div className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Braces className="size-3.5" aria-hidden />
            <span>
              {code.split("\n").length} lines · react-hook-form pattern
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main RoyForms component ───────────────────────────────────────────

export function RoyForms() {
  const [fields, setFields] = useState<FormField[]>(INITIAL_FIELDS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [multiStep, setMultiStep] = useState(false);
  const [tab, setTab] = useState<"builder" | "preview">("builder");
  const [activeBuilderStep, setActiveBuilderStep] = useState(0);

  // Form preview state.
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedSet>({});
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  // Export dialog.
  const [exportOpen, setExportOpen] = useState(false);

  // ── Field CRUD ───────────────────────────────────────────────────
  const handleAddField = useCallback(
    (type: FieldType) => {
      setFields((prev) => {
        const next = [...prev, makeField(type, prev.length + 1)];
        // Select the newly added field.
        const added = next[next.length - 1];
        if (added) setSelectedId(added.id);
        return next;
      });
      setTab("builder");
    },
    [],
  );

  const handleUpdateField = useCallback(
    (id: string, patch: Partial<FormField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  const handleDeleteField = useCallback(
    (id: string) => {
      setFields((prev) => prev.filter((f) => f.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      setValues((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTouched((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [],
  );

  const handleMove = useCallback(
    (index: number, dir: "up" | "down") => {
      setFields((prev) => {
        if (prev.length === 0) return prev;
        const target = dir === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        const tmp = next[index];
        if (!tmp) return prev;
        next[index] = next[target];
        next[target] = tmp;
        return next;
      });
    },
    [],
  );

  // ── Options editor ───────────────────────────────────────────────
  const handleAddOption = useCallback((id: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              options: [
                ...f.options,
                { value: `opt-${f.options.length + 1}`, label: `Option ${f.options.length + 1}` },
              ],
            }
          : f,
      ),
    );
  }, []);

  const handleUpdateOption = useCallback(
    (id: string, index: number, patch: Partial<FieldOption>) => {
      setFields((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                options: f.options.map((opt, i) =>
                  i === index ? { ...opt, ...patch } : opt,
                ),
              }
            : f,
        ),
      );
    },
    [],
  );

  const handleRemoveOption = useCallback((id: string, index: number) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, options: f.options.filter((_, i) => i !== index) }
          : f,
      ),
    );
  }, []);

  // ── Form value handlers ──────────────────────────────────────────
  const handleChange = useCallback((id: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    // Clear error when user starts editing again.
    setErrors((prev) => ({ ...prev, [id]: null }));
  }, []);

  const handleBlur = useCallback(
    (id: string) => {
      setTouched((prev) => ({ ...prev, [id]: true }));
      const field = fields.find((f) => f.id === id);
      if (!field) return;
      // Skip hidden fields.
      if (!isFieldVisible(field, values)) return;
      const err = validateField(field, values[id]);
      setErrors((prev) => ({ ...prev, [id]: err }));
    },
    [fields, values],
  );

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    const nextErrors: FormErrors = {};
    let hasError = false;
    for (const f of fields) {
      if (!isFieldVisible(f, values)) continue;
      const err = validateField(f, values[f.id]);
      nextErrors[f.id] = err;
      if (err) hasError = true;
    }
    setErrors(nextErrors);
    setTouched((prev) => {
      const next = { ...prev };
      for (const f of fields) next[f.id] = true;
      return next;
    });
    if (hasError) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSuccess(true);
    toast.success("Form submitted successfully");
  }, [fields, values]);

  const handleReset = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setSuccess(false);
  }, []);

  // ── Tab switching ────────────────────────────────────────────────
  // Reset preview state when the user switches to the preview tab so
  // stale errors from a previous run don't carry over. Doing this in the
  // change handler (rather than an effect) avoids cascading renders.
  const handleTabChange = useCallback((next: "builder" | "preview") => {
    setTab(next);
    if (next === "preview") {
      setSubmitted(false);
      setSuccess(false);
      setErrors({});
      setTouched({});
    }
  }, []);

  // ── Derived ──────────────────────────────────────────────────────
  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedId) ?? null,
    [fields, selectedId],
  );

  // stepMax is constant (STEP_COUNT - 1 = 2). We clamp the builder step at
  // use-time instead of via an effect.
  const stepMax = STEP_COUNT - 1;
  const effectiveBuilderStep = Math.min(activeBuilderStep, stepMax);

  const builderStepFields = useMemo(() => {
    if (!multiStep) return fields.map((f, i) => ({ field: f, index: i }));
    return fields
      .map((f, i) => ({ field: f, index: i }))
      .filter(({ index }) => getFieldStep(index, fields.length, multiStep) === effectiveBuilderStep);
  }, [fields, multiStep, effectiveBuilderStep]);

  const exportCode = useMemo(
    () => generateFormCode(fields, multiStep),
    [fields, multiStep],
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header / toolbar */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Roy Forms</h2>
          <p className="text-sm text-muted-foreground">
            {fields.length} {fields.length === 1 ? "field" : "fields"}
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            {multiStep ? "Multi-step (3 steps)" : "Single page"}
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            Click a field to edit its properties
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <Label
              htmlFor="multi-step-toggle"
              className="text-xs text-muted-foreground"
            >
              Multi-step
            </Label>
            <Switch
              id="multi-step-toggle"
              checked={multiStep}
              onCheckedChange={setMultiStep}
              aria-label="Toggle multi-step form"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
          >
            <FileCode2 className="size-3.5" />
            Export Form Code
          </Button>
        </div>
      </header>

      {/* Three-pane layout */}
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Left: palette */}
        <FieldPalette onAdd={handleAddField} />

        {/* Middle: canvas */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
          <Tabs value={tab} onValueChange={(v) => handleTabChange(v as "builder" | "preview")}>
            <div className="flex items-center justify-between gap-2">
              <TabsList className="self-start">
                <TabsTrigger value="builder">
                  <Settings2 className="size-3.5" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="size-3.5" />
                  Live preview
                </TabsTrigger>
              </TabsList>

              {multiStep && tab === "builder" ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: STEP_COUNT }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveBuilderStep(i)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        i === effectiveBuilderStep
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                      aria-current={i === effectiveBuilderStep ? "step" : undefined}
                    >
                      Step {i + 1}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <TabsContent value="builder" className="mt-3">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                  <Plus className="size-8 text-muted-foreground/50" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    No fields yet. Add one from the palette on the left.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {builderStepFields.map(({ field, index }) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      selected={selectedId === field.id}
                      stepLabel={
                        multiStep ? `Step ${getFieldStep(index, fields.length, multiStep) + 1}` : null
                      }
                      canMoveUp={index > 0}
                      canMoveDown={index < fields.length - 1}
                      onSelect={() =>
                        setSelectedId((prev) =>
                          prev === field.id ? null : field.id,
                        )
                      }
                      onDelete={() => handleDeleteField(field.id)}
                      onMoveUp={() => handleMove(index, "up")}
                      onMoveDown={() => handleMove(index, "down")}
                    />
                  ))}
                  {multiStep && builderStepFields.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                      No fields in this step. Switch steps above.
                    </div>
                  ) : null}
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <LivePreview
                fields={fields}
                values={values}
                errors={errors}
                touched={touched}
                submitted={submitted}
                success={success}
                multiStep={multiStep}
                onChange={handleChange}
                onBlur={handleBlur}
                onSubmit={handleSubmit}
                onReset={handleReset}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: properties */}
        <PropertiesPanel
          fields={fields}
          selected={selectedField}
          onUpdate={handleUpdateField}
          onAddOption={handleAddOption}
          onUpdateOption={handleUpdateOption}
          onRemoveOption={handleRemoveOption}
        />
      </div>

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        code={exportCode}
      />
    </div>
  );
}

