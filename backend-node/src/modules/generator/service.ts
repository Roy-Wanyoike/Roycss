/**
 * Generator service — Roy Generator code generator.
 *
 * The catalog of "what can I generate" is sourced from
 * `dist/pro-components.json` (63 RoyCSS Pro components), so the generator
 * reflects the actual component surface the front-end ships. Each
 * generation type maps to one pro component, with the inputs/languages/
 * output derived from the component's file path.
 *
 * Reads are LRU-cached; generations are not persisted (one-shot).
 *
 * Reference: `dist/pro-components.json` (built by the parent project's
 * build-package step).
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CACHE_TTL, EFFECTS_DATA_PATH } from "../../config/constants.js";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");
// pro-components.json lives at <repo-root>/dist/pro-components.json —
// EFFECTS_DATA_PATH already encodes the `../dist/effects.json` path so we
// derive the pro-components path from it.
const PRO_COMPONENTS_PATH = EFFECTS_DATA_PATH.replace(
  "effects.json",
  "pro-components.json",
);

const TYPES_KEY = "generator:types";
const typeKey = (id: string): string => `generator:type:${id}`;
const templatesKey = (typeId: string): string =>
  `generator:templates:${typeId}`;

// ─── Sourced generation types from dist/pro-components.json ───────────────
interface ProComponent {
  id: string;
  name: string;
  path: string;
}

function deriveDescription(name: string): string {
  return `Generate a ${name} component scaffold from the RoyCSS Pro catalog.`;
}

function deriveInputs(path: string): string[] {
  // Pro components live under src/components/roycss/pro/*.tsx — every one
  // accepts at least a `name` prop, and most also accept `props` for
  // configuration. We conservatively list both.
  if (path.includes("pro/")) return ["name", "props"];
  return ["name"];
}

function deriveLanguages(path: string): string[] {
  return path.endsWith(".tsx")
    ? ["tsx", "jsx"]
    : path.endsWith(".ts")
      ? ["typescript", "javascript"]
      : ["typescript"];
}

function deriveOutput(path: string): string {
  // Strip "src/" prefix; the generator emits one file at the same path.
  const stripped = path.replace(/^src\//, "");
  return `1 file at ${stripped}`;
}

function buildTypesFromProComponents(): GenerationType[] {
  let raw: string;
  try {
    raw = readFileSync(resolve(BACKEND_ROOT, PRO_COMPONENTS_PATH), "utf-8");
  } catch (err) {
    log.warn("Failed to read pro-components.json — falling back to empty catalog", {
      path: PRO_COMPONENTS_PATH,
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log.warn("pro-components.json malformed — falling back to empty catalog", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const out: GenerationType[] = [];
  for (const c of parsed as ProComponent[]) {
    if (!c || typeof c !== "object" || !c.id || !c.name || !c.path) continue;
    out.push({
      id: `gt-${c.id}`,
      name: c.name,
      description: deriveDescription(c.name),
      inputs: deriveInputs(c.path),
      languages: deriveLanguages(c.path),
      output: deriveOutput(c.path),
    });
  }
  log.info("Generator types sourced from pro-components.json", {
    count: out.length,
  });
  return out;
}

const SOURCE_TYPES: GenerationType[] = buildTypesFromProComponents();

// ─── 1 template per type (tsx for UI, ts for API) ───────────────────────
// The template uses the pro component's id as the imported identifier so
// the generated code wires into the existing Pro component directly.
const SOURCE_TEMPLATES: GeneratorTemplate[] = SOURCE_TYPES.map((t) => {
  const isTsx = t.languages.includes("tsx");
  const lang = isTsx ? "tsx" : "typescript";
  const framework = isTsx ? "react" : "roycss-pro";
  // Pull the pro component's id (stripped of the `gt-` prefix) for the import.
  const componentId = t.id.replace(/^gt-/, "");
  const componentName = t.name.replace(/[^a-zA-Z0-9_]/g, "");
  return {
    id: `tpl-${componentId}-${lang}`,
    typeId: t.id,
    name: `${t.name} (${lang.toUpperCase()})`,
    language: lang,
    framework,
    code: isTsx
      ? `import { ${componentName} } from "@/components/roycss/pro/${componentId}";\n\nexport function {{Name}}Wrapper({{props}}) {\n  return <${componentName} {{props}} />;\n}\n`
      : `export const {{name}}Factory = {\n  create: ({{props}}) => ({ component: "${componentId}", ...({{props}} || {}) }),\n};\n`,
    variables: ["Name", "name", "props"],
  };
});

const types: GenerationType[] = SOURCE_TYPES.map((t) => ({ ...t }));
const templates: GeneratorTemplate[] = SOURCE_TEMPLATES.map((t) => ({ ...t }));

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
