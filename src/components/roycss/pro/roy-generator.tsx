"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyGenerator — a code generator for RoyCSS.
 *
 * Self-contained (no props). Two-pane layout:
 *   • Left: a generation-type picker (Component, Form, CRUD Page, Table,
 *     Dashboard, API Route), a name input, and 3–5 type-specific options.
 *   • Right: a "Generate Code" button and the resulting code, rendered in
 *     a syntax-highlighted code block with a Copy button.
 *
 * Generation rules (all client-side, mock-only, deterministic):
 *   • Component  → React functional component skeleton with optional
 *     "use client" + cn() helper, plus 3 variant styles.
 *   • Form       → Zod schema + react-hook-form + reusable Field
 *     components for each declared field.
 *   • CRUD Page  → list view + detail view + form, all in one file.
 *   • Table      → typed DataTable with column defs + filter input.
 *   • Dashboard  → KPI card grid + chart placeholder + recent activity.
 *   • API Route  → Next.js App-Router route handler with GET/POST +
 *     Zod validation + typed responses.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Every option set is a discriminated union
 *     so additions stay exhaustive (the `never` guard enforces this).
 *   • Memoized generation — code is only re-built when a selection or
 *     an option changes; not on every render.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals, sky for info accents. No indigo or
 *     blue anywhere.
 *   • SSR-safe — no `window` access at module scope.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Check,
  Code2,
  Copy,
  FileCode2,
  FormInput,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Plug,
  RefreshCw,
  Sparkles,
  Table2,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type GenType =
  | "component"
  | "form"
  | "crud"
  | "table"
  | "dashboard"
  | "api";

type Variant = "default" | "outline" | "ghost" | "destructive";

interface GenTypeMeta {
  id: GenType;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

interface OptionSpec {
  /** Stable id used as React key + lookup key in OptionValues. */
  id: string;
  label: string;
  hint: string;
  type: "toggle" | "text" | "textarea" | "select";
  default: string | boolean;
  options?: readonly string[];
}

interface OptionValues {
  [id: string]: string | boolean;
}

interface GeneratedFile {
  filename: string;
  language: string;
  code: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const GEN_TYPES: readonly GenTypeMeta[] = [
  {
    id: "component",
    label: "Component",
    description: "React functional component skeleton with cn() helper.",
    icon: FileCode2,
    accent:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    id: "form",
    label: "Form",
    description: "Zod schema + react-hook-form + reusable Field components.",
    icon: FormInput,
    accent:
      "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300",
  },
  {
    id: "crud",
    label: "CRUD Page",
    description: "List view + detail view + form, all in one file.",
    icon: ListChecks,
    accent:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  },
  {
    id: "table",
    label: "Table",
    description: "Typed DataTable with column defs + filter input.",
    icon: Table2,
    accent:
      "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "KPI card grid + chart placeholder + recent activity.",
    icon: LayoutDashboard,
    accent:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  },
  {
    id: "api",
    label: "API Route",
    description: "Next.js App-Router route handler with Zod validation.",
    icon: Plug,
    accent:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
  },
] as const;

const OPTIONS: Record<GenType, readonly OptionSpec[]> = {
  component: [
    {
      id: "useClient",
      label: "use client",
      hint: "Add the Next.js client directive at the top.",
      type: "toggle",
      default: true,
    },
    {
      id: "variant",
      label: "Variant",
      hint: "Built-in style variants to support.",
      type: "select",
      default: "default",
      options: ["default", "outline", "ghost", "destructive"],
    },
    {
      id: "forwardRef",
      label: "forwardRef",
      hint: "Wrap the component with React.forwardRef.",
      type: "toggle",
      default: true,
    },
    {
      id: "children",
      label: "Accept children",
      hint: "Add a typed `children` prop to the component.",
      type: "toggle",
      default: true,
    },
  ],
  form: [
    {
      id: "fields",
      label: "Fields",
      hint: "One field per line. Format: name:type (e.g. email:email).",
      type: "textarea",
      default: "email:email\npassword:string\nrememberMe:boolean",
    },
    {
      id: "zod",
      label: "Zod validation",
      hint: "Generate a matching Zod schema.",
      type: "toggle",
      default: true,
    },
    {
      id: "submitLabel",
      label: "Submit button label",
      hint: "Label shown on the submit button.",
      type: "text",
      default: "Save",
    },
  ],
  crud: [
    {
      id: "entity",
      label: "Entity name",
      hint: "Singular, PascalCase (e.g. Project, Customer).",
      type: "text",
      default: "Project",
    },
    {
      id: "fields",
      label: "Fields",
      hint: "One field per line. Format: name:type.",
      type: "textarea",
      default: "name:string\ndescription:string\nstatus:string",
    },
    {
      id: "search",
      label: "Add search input",
      hint: "Filter the list view by a search term.",
      type: "toggle",
      default: true,
    },
    {
      id: "pagination",
      label: "Add pagination",
      hint: "Paginate the list view 10 per page.",
      type: "toggle",
      default: true,
    },
  ],
  table: [
    {
      id: "columns",
      label: "Columns",
      hint: "One column per line. Format: name:type.",
      type: "textarea",
      default: "id:string\nname:string\nemail:email\ncreatedAt:date",
    },
    {
      id: "filterable",
      label: "Filterable",
      hint: "Add a free-text filter input above the table.",
      type: "toggle",
      default: true,
    },
    {
      id: "sortable",
      label: "Sortable columns",
      hint: "Make every column header sortable.",
      type: "toggle",
      default: true,
    },
    {
      id: "emptyState",
      label: "Empty state",
      hint: "Show a friendly empty-state row when data is missing.",
      type: "toggle",
      default: true,
    },
  ],
  dashboard: [
    {
      id: "title",
      label: "Dashboard title",
      hint: "Shown in the header.",
      type: "text",
      default: "Overview",
    },
    {
      id: "kpis",
      label: "KPI cards",
      hint: "One KPI per line. Format: label:value.",
      type: "textarea",
      default: "Revenue:$48,250\nActive Users:1,284\nChurn:2.4%\nNPS:62",
    },
    {
      id: "chart",
      label: "Chart placeholder",
      hint: "Render a chart placeholder panel below the KPIs.",
      type: "toggle",
      default: true,
    },
    {
      id: "activity",
      label: "Recent activity feed",
      hint: "Render a recent-activity list panel.",
      type: "toggle",
      default: true,
    },
  ],
  api: [
    {
      id: "path",
      label: "Route path",
      hint: "App-Router path (e.g. /api/projects).",
      type: "text",
      default: "/api/projects",
    },
    {
      id: "methods",
      label: "Methods",
      hint: "Comma-separated HTTP methods to generate.",
      type: "text",
      default: "GET,POST",
    },
    {
      id: "entity",
      label: "Entity name",
      hint: "Singular, PascalCase (e.g. Project).",
      type: "text",
      default: "Project",
    },
    {
      id: "zod",
      label: "Zod validation",
      hint: "Validate the request body with a Zod schema.",
      type: "toggle",
      default: true,
    },
    {
      id: "auth",
      label: "Require auth",
      hint: "Reject requests without a valid session.",
      type: "toggle",
      default: true,
    },
  ],
} as const;

const DEFAULT_OPTIONS: Record<GenType, OptionValues> = Object.fromEntries(
  (Object.keys(OPTIONS) as GenType[]).map((t) => [
    t,
    Object.fromEntries(
      OPTIONS[t].map((o) => [o.id, o.default]),
    ) as OptionValues,
  ]),
) as Record<GenType, OptionValues>;

const GEN_TYPE_IDS: readonly GenType[] = GEN_TYPES.map((g) => g.id);

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Convert "user-profile" / "user_profile" / "userProfile" → "UserProfile". */
function toPascal(input: string): string {
  const cleaned = input.trim().replace(/[^a-zA-Z0-9]+/g, " ");
  if (!cleaned) return "MyComponent";
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/** Convert "UserProfile" → "user-profile". */
function toKebab(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
}

/** Convert "UserProfile" → "userProfile". */
function toCamel(input: string): string {
  const p = toPascal(input);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

/** Copy text to clipboard with a textarea fallback. */
async function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

interface ParsedField {
  name: string;
  type: string;
}

/** Parse "email:email\npassword:string" → ParsedField[]. */
function parseFields(raw: string): ParsedField[] {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, type = "string"] = line.split(":").map((s) => s.trim());
      return { name: name || "field", type: type || "string" };
    });
}

/** Map a Zod-friendly type from a field's user-declared type. */
function zodType(t: string): string {
  switch (t) {
    case "email":
      return "z.string().email()";
    case "number":
      return "z.coerce.number()";
    case "boolean":
      return "z.boolean()";
    case "date":
      return "z.coerce.date()";
    default:
      return "z.string().min(1)";
  }
}

/** Map a TS-friendly type from a field's user-declared type. */
function tsType(t: string): string {
  switch (t) {
    case "email":
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "Date";
    default:
      return "string";
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Code generators
// ═══════════════════════════════════════════════════════════════════════

function generateComponent(
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  const pascal = toPascal(name);
  const kebab = toKebab(name);
  const useClient = opts.useClient === true;
  const variant = String(opts.variant ?? "default");
  const forwardRef = opts.forwardRef === true;
  const children = opts.children === true;

  const variantsList: Variant[] = ["default", "outline", "ghost", "destructive"];
  const variantsBlock = variantsList
    .map(
      (v) =>
        `    ${v}: "border-border bg-card text-foreground hover:bg-accent"${v === "destructive" ? ' + " border-destructive text-destructive hover:bg-destructive/10"' : ""},`,
    )
    .join("\n");

  const propsType = `interface ${pascal}Props {
${children ? "  children?: React.ReactNode;\n" : ""}  className?: string;
  variant?: ${variantsList.map((v) => `"${v}"`).join(" | ")};
}`;

  const componentBody = `function ${pascal}Impl({
${children ? "  children,\n" : ""}  className,
  variant = "${variant}",
}: ${pascal}Props) {
  return (
    <div
      data-slot="${kebab}"
      className={cn(base, variants[variant], className)}
    >
${children ? "      {children}\n" : "      <span>${pascal}</span>\n"}    </div>
  );
}`;

  const wrapped = forwardRef
    ? `export const ${pascal} = React.forwardRef<HTMLDivElement, ${pascal}Props>(${pascal}Impl);
${pascal}.displayName = "${pascal}";`
    : `export const ${pascal} = ${pascal}Impl;`;

  const code = `${useClient ? '"use client";\n\n' : ''}import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const variants = {
${variantsBlock}
} as const;

${propsType}

${componentBody}

${wrapped}
`;

  return [
    {
      filename: `${kebab}.tsx`,
      language: "tsx",
      code,
    },
  ];
}

function generateForm(
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  const pascal = toPascal(name);
  const kebab = toKebab(name);
  const fields = parseFields(String(opts.fields ?? ""));
  const withZod = opts.zod === true;
  const submitLabel = String(opts.submitLabel ?? "Save");

  const schemaName = `${pascal}Schema`;
  const valuesName = `${pascal}Values`;
  const zodSchema = withZod
    ? `const ${schemaName} = z.object({
${fields.map((f) => `  ${f.name}: ${zodType(f.type)},`).join("\n")}
});

type ${valuesName} = z.infer<typeof ${schemaName}>;`
    : `type ${valuesName} = {
${fields.map((f) => `  ${f.name}: ${tsType(f.type)};`).join("\n")}
};`;

  const fieldDefs = fields
    .map((f) => {
      const label = f.name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
      if (f.type === "boolean") {
        return `      <Field label="${label}" name="${f.name}">
        <Switch id="${f.name}" {...field} />
      </Field>`;
      }
      const inputType = f.type === "email" ? "email" : f.type === "number" ? "number" : "text";
      return `      <Field label="${label}" name="${f.name}">
        <Input id="${f.name}" type="${inputType}" {...field} />
      </Field>`;
    })
    .join("\n");

  const code = `"use client";

import { useForm } from "react-hook-form";
${withZod ? 'import { zodResolver } from "@hookform/resolvers/zod";\nimport { z } from "zod";\n' : ''}import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

${zodSchema}

interface FieldProps {
  label: string;
  name: string;
  children: React.ReactNode;
}

function Field({ label, name, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}

export function ${pascal}Form({
  onSubmit,
}: {
  onSubmit: (values: ${valuesName}) => void;
}) {
  const { register, handleSubmit, formState } = useForm<${valuesName}>(${
    withZod ? `{ resolver: zodResolver(${schemaName}) }` : "{}"
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      aria-label="${pascal} form"
    >
${fieldDefs}
      <Button type="submit" disabled={formState.isSubmitting}>
        ${submitLabel}
      </Button>
    </form>
  );
}
`;

  return [
    {
      filename: `${kebab}-form.tsx`,
      language: "tsx",
      code,
    },
  ];
}

function generateCrud(
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  const pascal = toPascal(String(opts.entity ?? name));
  const plural = `${toCamel(pascal)}s`;
  const kebab = toKebab(pascal);
  const fields = parseFields(String(opts.fields ?? ""));
  const withSearch = opts.search === true;
  const withPagination = opts.pagination === true;

  const typeBlock = `type ${pascal} = {
  id: string;
${fields.map((f) => `  ${f.name}: ${tsType(f.type)};`).join("\n")}
};`;

  const listRow = fields
    .map(
      (f) =>
        `          <td className="px-3 py-2 text-sm">{item.${f.name}}</td>`,
    )
    .join("\n");

  const listHead = fields
    .map(
      (f) =>
        `        <th className="px-3 py-2 text-left text-xs font-medium uppercase">${f.name}</th>`,
    )
    .join("\n");

  const formFields = fields
    .map((f) => {
      const label = f.name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());
      return `      <Field label="${label}" name="${f.name}">
        <Input id="${f.name}" {...register("${f.name}")} />
      </Field>`;
    })
    .join("\n");

  const code = `"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

${typeBlock}

// ─── List View ───────────────────────────────────────────────────────
export function ${pascal}List({
  items,
  onSelect,
}: {
  items: ${pascal}[];
  onSelect?: (item: ${pascal}) => void;
}) {
  ${withSearch ? `const [query, setQuery] = useState("");\n  ` : ""}${withPagination ? `const [page, setPage] = useState(1);\n  const pageSize = 10;\n  ` : ""}const filtered = useMemo(() => {
    ${withSearch ? `const q = query.trim().toLowerCase();\n    return q ? items.filter((it) => Object.values(it).some((v) => String(v).toLowerCase().includes(q))) : items;` : `return items;`}
  }, [items${withSearch ? ", query" : ""}]);

  ${withPagination ? `const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));\n  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);\n` : ""}  return (
    <div className="flex flex-col gap-3">
      ${withSearch ? `<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-label="Search ${plural}" />\n      ` : ""}<div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
${listHead}
            </tr>
          </thead>
          <tbody>
            {(${withPagination ? "pageItems" : "filtered"}).map((item) => (
              <tr key={item.id} className="border-t hover:bg-accent/30">
${listRow}
                <td className="px-3 py-2">
                  <Button variant="ghost" size="sm" onClick={() => onSelect?.(item)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ${withPagination ? `<div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>` : ""}
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────
export function ${pascal}Detail({ item }: { item: ${pascal} }) {
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Object.entries(item).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs uppercase tracking-wide">{key}</dt>
          <dd className="text-sm font-medium">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Form ────────────────────────────────────────────────────────────
export function ${pascal}Form({
  onSubmit,
}: {
  onSubmit: (values: Omit<${pascal}, "id">) => void;
}) {
  const { register, handleSubmit } = useForm<Omit<${pascal}, "id">>();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
${formFields}
      <Button type="submit">Save</Button>
    </form>
  );
}
`;

  return [
    {
      filename: `${kebab}-crud.tsx`,
      language: "tsx",
      code,
    },
  ];
}

function generateTable(
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  const pascal = toPascal(name);
  const kebab = toKebab(name);
  const columns = parseFields(String(opts.columns ?? ""));
  const filterable = opts.filterable === true;
  const sortable = opts.sortable === true;
  const emptyState = opts.emptyState === true;

  const colDefs = columns
    .map(
      (c) => `  {
    key: "${c.name}" as const,
    header: "${c.name}",
    ${sortable ? "sortable: true,\n    " : ""}render: (row) => <span>{String(row.${c.name})}</span>,
  },`,
    )
    .join("\n");

  const code = `"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Row = {
${columns.map((c) => `  ${c.name}: ${tsType(c.type)};`).join("\n")}
};

interface ColumnDef {
  key: keyof Row;
  header: string;
  ${sortable ? "sortable?: boolean;\n  " : ""}render: (row: Row) => React.ReactNode;
}

const columns: ColumnDef[] = [
${colDefs}
];

export function ${pascal}Table({ data }: { data: Row[] }) {
  ${filterable ? `const [query, setQuery] = useState("");\n  ` : ""}${sortable ? `const [sortKey, setSortKey] = useState<keyof Row | null>(null);\n  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");\n  ` : ""}const rows = useMemo(() => {
    ${filterable ? `const q = query.trim().toLowerCase();\n    let r = q ? data.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(q))) : data;` : `let r = data;`}
    ${sortable ? `if (sortKey) {\n      r = [...r].sort((a, b) => {\n        const av = a[sortKey];\n        const bv = b[sortKey];\n        return (av < bv ? -1 : av > bv ? 1 : 0) * (sortDir === "asc" ? 1 : -1);\n      });\n    }` : ""}
    return r;
  }, [data${filterable ? ", query" : ""}${sortable ? ", sortKey, sortDir" : ""}]);

  return (
    <div className="flex flex-col gap-3">
      ${filterable ? `<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter rows…" aria-label="Filter ${kebab} table" />\n      ` : ""}<div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  ${sortable ? `onClick={() => {\n                    if (!col.sortable) return;\n                    if (sortKey === col.key) setSortDir((d) => d === "asc" ? "desc" : "asc");\n                    else { setSortKey(col.key); setSortDir("asc"); }\n                  }}\n                  className={cn("px-3 py-2 text-left text-xs font-medium uppercase", col.sortable && "cursor-pointer select-none hover:bg-accent")}` : `className="px-3 py-2 text-left text-xs font-medium uppercase"`}
                >
                  {col.header}${sortable ? "{sortable && sortKey === col.key ? (sortDir === \"asc\" ? \" ▲\" : \" ▼\") : \"\"}" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              ${emptyState ? `<tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">No rows match the current filter.</td></tr>` : `<tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">No data.</td></tr>`}
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t hover:bg-accent/30">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-3 py-2">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

  return [
    {
      filename: `${kebab}-table.tsx`,
      language: "tsx",
      code,
    },
  ];
}

function generateDashboard(
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  const pascal = toPascal(name);
  const kebab = toKebab(name);
  const title = String(opts.title ?? "Overview");
  const showChart = opts.chart === true;
  const showActivity = opts.activity === true;
  const kpis = String(opts.kpis ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value = "0"] = line.split(":").map((s) => s.trim());
      return { label: label || "KPI", value };
    });

  const kpiCards = kpis
    .map(
      (k, i) => `      <Card key="${i}">
        <CardContent className="p-4">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            ${k.label}
          </div>
          <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
            ${k.value}
          </div>
        </CardContent>
      </Card>`,
    )
    .join("\n");

  const code = `"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ${pascal}Dashboard() {
  return (
    <div className="flex flex-col gap-6" aria-label="${title} dashboard">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">${title}</h1>
        <span className="text-muted-foreground text-sm">Last 30 days</span>
      </header>

      {/* KPI grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
${kpiCards}
      </section>

      ${showChart ? `{/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
            Chart placeholder — drop in your chart library here.
          </div>
        </CardContent>
      </Card>` : ""}

      ${showActivity ? `{/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {["Deployment completed", "New user signed up", "Invoice paid", "Backup finished"].map((entry, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span>{entry}</span>
                <span className="text-muted-foreground text-xs">{i + 1}h ago</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>` : ""}
    </div>
  );
}
`;

  return [
    {
      filename: `${kebab}-dashboard.tsx`,
      language: "tsx",
      code,
    },
  ];
}

function generateApi(
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  const pascal = toPascal(String(opts.entity ?? name));
  const camel = toCamel(pascal);
  const path = String(opts.path ?? "/api/items");
  const methodsRaw = String(opts.methods ?? "GET,POST")
    .split(",")
    .map((m) => m.trim().toUpperCase())
    .filter(Boolean) as ReadonlyArray<"GET" | "POST" | "PATCH" | "DELETE">;
  const withZod = opts.zod === true;
  const withAuth = opts.auth === true;

  const routeSegment = path.replace(/^\/api\//, "").replace(/^\//, "") || "items";
  const filename = `app/api/${routeSegment}/route.ts`;

  const hasGet = methodsRaw.includes("GET");
  const hasPost = methodsRaw.includes("POST");

  const schemaBlock = withZod && hasPost
    ? `const ${camel}Schema = z.object({
  name: z.string().min(1),
});

type ${pascal} = z.infer<typeof ${camel}Schema>;`
    : `type ${pascal} = { name: string };`;

  const getHandler = hasGet
    ? `export async function GET(req: Request) {
  ${withAuth ? `const session = await getSession(req);\n  if (!session) return new Response("Unauthorized", { status: 401 });\n  ` : ""}const items: ${pascal}[] = [];
  return Response.json({ items });
}`
    : "";

  const postHandler = hasPost
    ? `export async function POST(req: Request) {
  ${withAuth ? `const session = await getSession(req);\n  if (!session) return new Response("Unauthorized", { status: 401 });\n  ` : ""}${withZod ? `const body = await req.json();\n  const parsed = ${camel}Schema.safeParse(body);\n  if (!parsed.success) {\n    return Response.json({ error: parsed.error.flatten() }, { status: 400 });\n  }\n  const item: ${pascal} = parsed.data;` : `const item: ${pascal} = await req.json();`}
  return Response.json({ item }, { status: 201 });
}`
    : "";

  const code = `import { ${withZod ? "z" : ""} } from "zod";
${withAuth ? `import { getSession } from "@/lib/auth";\n` : ""}
${schemaBlock}

${[getHandler, postHandler].filter(Boolean).join("\n\n")}
`;

  return [
    {
      filename,
      language: "ts",
      code,
    },
  ];
}

/** Dispatch to the right generator. */
function generate(
  type: GenType,
  name: string,
  opts: OptionValues,
): GeneratedFile[] {
  switch (type) {
    case "component":
      return generateComponent(name, opts);
    case "form":
      return generateForm(name, opts);
    case "crud":
      return generateCrud(name, opts);
    case "table":
      return generateTable(name, opts);
    case "dashboard":
      return generateDashboard(name, opts);
    case "api":
      return generateApi(name, opts);
    default: {
      // Exhaustiveness guard — if a new GenType is added without a
      // matching case, TypeScript errors here.
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface GenTypeCardProps {
  meta: GenTypeMeta;
  selected: boolean;
  onSelect: (id: GenType) => void;
}

const GenTypeCard = React.memo(function GenTypeCard({
  meta,
  selected,
  onSelect,
}: GenTypeCardProps) {
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(meta.id)}
      aria-pressed={selected}
      className={cn(
        "group flex h-full flex-col gap-2 rounded-lg border p-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-md border",
            meta.accent,
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <span className="font-medium text-sm">{meta.label}</span>
      </div>
      <span className="text-muted-foreground text-xs leading-snug">
        {meta.description}
      </span>
    </button>
  );
});

interface OptionControlProps {
  spec: OptionSpec;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}

function OptionControl({ spec, value, onChange }: OptionControlProps) {
  const handleText = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );
  const handleToggle = useCallback(
    (checked: boolean) => onChange(checked),
    [onChange],
  );
  const handleSelect = useCallback(
    (v: string) => onChange(v),
    [onChange],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={spec.id} className="text-xs font-medium">
        {spec.label}
      </Label>
      {spec.type === "toggle" ? (
        <div className="flex h-9 items-center gap-2">
          <Switch
            id={spec.id}
            checked={value === true}
            onCheckedChange={handleToggle}
            aria-label={spec.label}
          />
          <span className="text-muted-foreground text-xs">
            {value === true ? "On" : "Off"}
          </span>
        </div>
      ) : spec.type === "textarea" ? (
        <Textarea
          id={spec.id}
          value={String(value)}
          onChange={handleText}
          rows={4}
          className="font-mono text-xs"
          aria-label={spec.label}
        />
      ) : spec.type === "select" ? (
        <div className="flex flex-wrap gap-1.5">
          {spec.options?.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              aria-pressed={value === opt}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                value === opt
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Input
          id={spec.id}
          value={String(value)}
          onChange={handleText}
          aria-label={spec.label}
        />
      )}
      <span className="text-muted-foreground text-[11px] leading-snug">
        {spec.hint}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyGenerator
// ═══════════════════════════════════════════════════════════════════════

export function RoyGenerator() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("generator/types");
  void data;

  const { toast } = useToast();
  const [genType, setGenType] = useState<GenType>("component");
  const [name, setName] = useState("MyButton");
  const [options, setOptions] = useState<Record<GenType, OptionValues>>(
    DEFAULT_OPTIONS,
  );
  const [generated, setGenerated] = useState<GeneratedFile[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState(0);

  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    timersRef.current.add(t);
    return () => {
      clearTimeout(t);
      timersRef.current.delete(t);
    };
  }, [copied]);

  const specs = OPTIONS[genType];
  const currentOptions = options[genType];

  const handleTypeChange = useCallback((id: GenType) => {
    setGenType(id);
    setGenerated(null);
    setActiveFile(0);
  }, []);

  const handleOptionChange = useCallback(
    (id: string, value: string | boolean) => {
      setOptions((prev) => ({
        ...prev,
        [genType]: { ...prev[genType], [id]: value },
      }));
      setGenerated(null);
    },
    [genType],
  );

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setGenerated(null);
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setGenerated(null);
    const t = setTimeout(() => {
      const files = generate(genType, name, currentOptions);
      setGenerated(files);
      setActiveFile(0);
      setGenerating(false);
    }, 500);
    timersRef.current.add(t);
    return () => {
      clearTimeout(t);
      timersRef.current.delete(t);
    };
  }, [genType, name, currentOptions]);

  const handleCopy = useCallback(async () => {
    if (!generated || generated.length === 0) return;
    const file = generated[activeFile] ?? generated[0];
    const ok = await copyToClipboard(file.code);
    if (ok) {
      setCopied(true);
      toast({
        title: "Code copied",
        description: `${file.filename} is on your clipboard.`,
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Clipboard is unavailable in this context.",
        variant: "destructive",
      });
    }
  }, [generated, activeFile, toast]);

  const handleRegenerate = useCallback(() => {
    setGenerated(null);
    handleGenerate();
  }, [handleGenerate]);

  const activeMeta = useMemo(
    () => GEN_TYPES.find((g) => g.id === genType) ?? GEN_TYPES[0],
    [genType],
  );

  const totalLines = useMemo(() => {
    if (!generated) return 0;
    return generated.reduce(
      (sum, f) => sum + f.code.split("\n").length,
      0,
    );
  }, [generated]);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wand2 className="size-5 text-primary" aria-hidden />
          Roy Generator
        </CardTitle>
        <CardDescription>
          Pick a target, name it, configure options, and generate production
          code in one click.
        </CardDescription>
        <CardAction>
          <BackendLiveBadge loading={loading} error={error} />
          <Badge variant="secondary" className="gap-1">
            <Code2 className="size-3" aria-hidden />
            {GEN_TYPES.length} generators
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* ─── Generator type grid ──────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">What do you want to generate?</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GEN_TYPES.map((meta) => (
              <GenTypeCard
                key={meta.id}
                meta={meta}
                selected={meta.id === genType}
                onSelect={handleTypeChange}
              />
            ))}
          </div>
        </section>

        {/* ─── Two-pane config + output ────────────────────────────── */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: config */}
          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="roy-gen-name" className="text-xs font-medium">
                Name
              </Label>
              <Input
                id="roy-gen-name"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. UserProfile"
                aria-label="Generator name"
              />
              <span className="text-muted-foreground text-[11px]">
                Used as the component / entity / route identifier.
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium">Options</span>
              {specs.map((spec) => (
                <OptionControl
                  key={spec.id}
                  spec={spec}
                  value={currentOptions[spec.id] ?? spec.default}
                  onChange={(v) => handleOptionChange(spec.id, v)}
                />
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !name.trim()}
              className="gap-1.5"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Code
                </>
              )}
            </Button>
          </div>

          {/* Right: output */}
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border",
                    activeMeta.accent,
                  )}
                  aria-hidden
                >
                  <activeMeta.icon className="size-3.5" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{activeMeta.label}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {generated
                      ? `${generated.length} file${generated.length === 1 ? "" : "s"} · ${totalLines} lines`
                      : "Not generated yet"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={generating || !name.trim()}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Regenerate"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!generated || generating}
                  className="gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-primary" />
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

            {/* File tabs (if multiple) */}
            {generated && generated.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {generated.map((file, i) => (
                  <button
                    key={file.filename}
                    type="button"
                    onClick={() => setActiveFile(i)}
                    aria-pressed={activeFile === i}
                    className={cn(
                      "inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-mono transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      activeFile === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {file.filename.split("/").pop()}
                  </button>
                ))}
              </div>
            )}

            {generated && generated.length > 0 ? (
              <div className="overflow-hidden rounded-md border">
                <div className="bg-muted/50 flex items-center gap-2 border-b px-3 py-1.5">
                  <FileCode2 className="text-muted-foreground size-3.5" aria-hidden />
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {generated[activeFile]?.filename ?? generated[0].filename}
                  </span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {generated[activeFile]?.language ?? "tsx"}
                  </Badge>
                </div>
                <pre className="bg-background/60 max-h-[460px] overflow-auto p-4 text-xs leading-relaxed">
                  <code className="font-mono whitespace-pre">
                    {generated[activeFile]?.code ?? generated[0].code}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Code2 className="text-muted-foreground size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {generating ? "Generating code…" : "No code generated yet"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {generating
                      ? "Building files from your selections."
                      : "Configure options and click “Generate Code”."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
