/**
 * Generator service — Roy Generator code generator.
 *
 * Mock backend (no DB). Seeds 6 generation types (Component, Form,
 * CRUD, Table, Dashboard, API). Each generation type has one or more
 * templates per language. Generation is template-driven — the same
 * inputs always return the same output so the cache is coherent.
 *
 * Reads are LRU-cached; generations are not persisted (one-shot).
 *
 * Future: route to a real template engine (Hygen / Plop) emitting the
 * same shape.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  GeneratorResult,
  GeneratorTemplate,
  GenerationType,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { GenerateCodeInput } from "./schema.js";

const log = createLogger("generator");

const TYPES_KEY = "generator:types";
const typeKey = (id: string): string => `generator:type:${id}`;
const templatesKey = (typeId: string): string =>
  `generator:templates:${typeId}`;

// ─── Seed: 6 generation types ────────────────────────────────────────────
const SEED_TYPES: GenerationType[] = [
  {
    id: "gt-component",
    name: "Component",
    description: "A reusable React component scaffold.",
    inputs: ["name", "props"],
    languages: ["tsx", "jsx"],
    output: "1 .tsx/.jsx file",
  },
  {
    id: "gt-form",
    name: "Form",
    description: "A controlled form with validation scaffold.",
    inputs: ["name", "fields"],
    languages: ["tsx", "jsx"],
    output: "1 form component + 1 schema file",
  },
  {
    id: "gt-crud",
    name: "CRUD",
    description: "A CRUD module: list, detail, create, edit, delete.",
    inputs: ["name", "fields"],
    languages: ["tsx", "jsx", "typescript"],
    output: "5 files",
  },
  {
    id: "gt-table",
    name: "Table",
    description: "A sortable, filterable data table.",
    inputs: ["name", "columns"],
    languages: ["tsx", "jsx"],
    output: "1 table component",
  },
  {
    id: "gt-dashboard",
    name: "Dashboard",
    description: "A dashboard layout with metric cards + chart slots.",
    inputs: ["name", "metrics"],
    languages: ["tsx", "jsx"],
    output: "1 dashboard layout + KPI card component",
  },
  {
    id: "gt-api",
    name: "API",
    description: "An Express route + service + schema triplet.",
    inputs: ["name", "resource"],
    languages: ["typescript", "javascript"],
    output: "3 files: routes, service, schema",
  },
];

// ─── Seed: 1 template per type (tsx for UI, ts for API) ──────────────────
const SEED_TEMPLATES: GeneratorTemplate[] = [
  {
    id: "tpl-component-tsx",
    typeId: "gt-component",
    name: "React Component (TS)",
    language: "tsx",
    framework: "react",
    code: "export function {{Name}}({{props}}) {\n  return <div className=\"roycss-{{name}}\">{{Name}}</div>;\n}\n",
    variables: ["Name", "name", "props"],
  },
  {
    id: "tpl-form-tsx",
    typeId: "gt-form",
    name: "React Form (TS)",
    language: "tsx",
    framework: "react",
    code: "export function {{Name}}Form() {\n  return <form className=\"roycss-form\">{{Name}} form</form>;\n}\n",
    variables: ["Name", "name"],
  },
  {
    id: "tpl-crud-tsx",
    typeId: "gt-crud",
    name: "CRUD Module (TS)",
    language: "tsx",
    framework: "react",
    code: "// {{Name}} list, detail, create, edit, delete\nexport const {{Name}}CRUD = {};\n",
    variables: ["Name", "name"],
  },
  {
    id: "tpl-table-tsx",
    typeId: "gt-table",
    name: "Data Table (TS)",
    language: "tsx",
    framework: "react",
    code: "export function {{Name}}Table({ rows }: { rows: any[] }) {\n  return <table className=\"roycss-table\" />;\n}\n",
    variables: ["Name", "name"],
  },
  {
    id: "tpl-dashboard-tsx",
    typeId: "gt-dashboard",
    name: "Dashboard Layout (TS)",
    language: "tsx",
    framework: "react",
    code: "export function {{Name}}Dashboard() {\n  return <main className=\"roycss-dashboard\">{{Name}}</main>;\n}\n",
    variables: ["Name", "name"],
  },
  {
    id: "tpl-api-ts",
    typeId: "gt-api",
    name: "Express API (TS)",
    language: "typescript",
    framework: "express",
    code: "import { Router } from \"express\";\nexport const {{name}}Router = Router();\n{{name}}Router.get(\"/\", (_req, res) => res.json({ ok: true }));\n",
    variables: ["Name", "name"],
  },
];

const types: GenerationType[] = SEED_TYPES.map((t) => ({ ...t }));
const templates: GeneratorTemplate[] = SEED_TEMPLATES.map((t) => ({ ...t }));

/** List all generation types. Cached. */
export async function listTypes(): Promise<GenerationType[]> {
  return cacheWrap(
    TYPES_KEY,
    () => Promise.resolve(types.map((t) => ({ ...t }))),
    CACHE_TTL.generatorTypes,
  );
}

/** Get a single generation type by id. Cached. Throws 404 if missing. */
export async function getTypeById(id: string): Promise<GenerationType> {
  return cacheWrap(
    typeKey(id),
    () => {
      const found = types.find((t) => t.id === id);
      if (!found) throw AppError.notFound(`Generation type '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.generatorTypes,
  );
}

/** List templates for a generation type. Cached. Throws 404 if missing. */
export async function listTemplatesForType(
  typeId: string,
): Promise<GeneratorTemplate[]> {
  // Verify the type exists (throws 404).
  await getTypeById(typeId);

  return cacheWrap(
    templatesKey(typeId),
    () => {
      const list = templates.filter((t) => t.typeId === typeId);
      return Promise.resolve(list.map((t) => ({ ...t })));
    },
    CACHE_TTL.generatorTemplates,
  );
}

/** Capitalize the first letter of a name (for component identifiers). */
function pascal(name: string): string {
  const cleaned = name.replace(/[-_]+(.)/g, (_, c: string) =>
    c.toUpperCase(),
  );
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Substitute {{Var}} placeholders in a template string. */
function substitute(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? vars[key] : `{{${key}}}`,
  );
}

/** Generate code from a template. Mock. */
export async function generateCode(
  input: GenerateCodeInput,
): Promise<GeneratorResult> {
  // Verify the type exists (throws 404).
  await getTypeById(input.typeId);

  // Find a template matching the requested language (fallback to first).
  const tpl =
    templates.find(
      (t) => t.typeId === input.typeId && t.language === input.language,
    ) ?? templates.find((t) => t.typeId === input.typeId);
  if (!tpl) {
    throw AppError.notFound(
      `No template for type '${input.typeId}'`,
    );
  }

  const vars: Record<string, string> = {
    Name: pascal(input.name),
    name: input.name,
    props: "",
    ...input.variables,
  };

  const ext =
    input.language === "typescript"
      ? "ts"
      : input.language === "tsx"
        ? "tsx"
        : input.language === "jsx"
          ? "jsx"
          : "js";
  const path = `src/${input.name}.${ext}`;
  const code = substitute(tpl.code, vars);

  const result: GeneratorResult = {
    id: `gen-${randomUUID()}`,
    typeId: input.typeId,
    name: input.name,
    language: input.language,
    status: "complete",
    files: [{ path, content: code }],
    createdAt: new Date().toISOString(),
  };
  log.info("Code generated", {
    id: result.id,
    type: input.typeId,
    language: input.language,
  });
  return result;
}

/** Number of generation types in the catalog. */
export function typesCount(): number {
  return types.length;
}

/** Test-only: no-op (state is read-only). */
export function _resetGeneratorForTest(): void {
  /* no-op */
}
