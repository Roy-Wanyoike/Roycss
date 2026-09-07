/**
 * OpenAPI generator (PF-009 / issue #94 A4).
 *
 * Walks the module route table (the same static walker the API.md
 * tooling uses — scripts/lib/walk-routes.ts) plus the Zod schemas in
 * each module's `schema.ts` and emits a deterministic OpenAPI 3.1
 * document at `api/openapi.json`:
 *
 *   cd backend-node
 *   npm run gen:openapi           # (re)generate + write api/openapi.json
 *   npm run gen:openapi:check     # CI drift gate — fail when committed
 *                                  # file differs from a fresh generation
 *
 * Determinism: paths are emitted in sorted order, operations within a
 * path in a fixed method order, and every object is built with a fixed
 * key order — two runs on identical code produce byte-identical JSON.
 *
 * Zod → JSON Schema is done BY HAND (no new runtime deps): the
 * generator extracts each z.object field's source text and maps the
 * common Zod constructs (string/number/boolean/array/object/enum/
 * literal/date/record + .optional()/.default()/.uuid()/.email()/…) to
 * the closest JSON Schema node. Anything unrecognized degrades to an
 * unconstrained schema (`{}`), which is valid OpenAPI 3.1.
 *
 * The generated document is served at GET /api/v1/openapi.json by
 * src/modules/openapi/routes.ts. This script never imports src/** —
 * it runs in CI without env vars or a database.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  BACKEND_ROOT,
  schemaFields,
  stripComments,
  walkBackendRoutes,
  type BackendRouteInfo,
} from "./lib/walk-routes.js";

// ─── CLI mode ─────────────────────────────────────────────────────────────

const CHECK_MODE = process.argv.includes("--check");
const OUT_PATH = resolve(BACKEND_ROOT, "api", "openapi.json");

// ─── Zod schema → JSON Schema (hand-rolled, summary level) ────────────────

interface FieldShape {
  key: string;
  optional: boolean;
  /** Raw zod expression text (e.g. `z.string().min(1)`). */
  text: string;
}

/** Extract z.object fields WITH their value text from a module's schemas. */
export function schemaShape(
  module: string,
  schemaName: string,
): FieldShape[] | undefined {
  const fields = schemaFields(module, schemaName);
  if (!fields) return undefined;

  // Read the source again to grab each field's expression text.
  let src: string | null = null;
  for (const base of ["schema.ts", "routes.ts"]) {
    const file = join(BACKEND_ROOT, `src/modules/${module}/${base}`);
    if (existsSync(file)) {
      src = stripComments(readFileSync(file, "utf-8"));
      break;
    }
  }
  if (src === null) return fields.map((f) => ({ ...f, text: "" }));

  const out: FieldShape[] = [];
  for (const field of fields) {
    // `key:` or `key?:` at an arbitrary indent, then capture to the
    // next top-level key or end of the object (best-effort, two
    // lookaheads: next `key:` line at any indent, or the closing brace).
    const re = new RegExp(
      `\\b${field.key}\\??:\\s*([\\s\\S]*?)(?=,\\s*[A-Za-z_$][\\w$]*\\??:|^\\s*[})]|$)`,
    );
    const m = re.exec(src);
    let text = m?.[1] ? m[1].replace(/\s+/g, " ").trim() : "";
    // `z\n  .string()` chains collapse to `z .string()` — rejoin.
    text = text.replace(/\bz\s+\./g, "z.");
    // Resolve a named const reference (`EffectCategoryEnum.optional()`)
    // to its `z.enum([...])` / `z.string()` definition in the same file.
    text = resolveNamedConst(text, src);
    out.push({ key: field.key, optional: field.optional, text });
  }
  return out;
}

/**
 * When a field's value is a bare identifier (possibly chained with
 * .optional()/.default()), look the const up in the same module source
 * and substitute its Zod expression text. Unresolvable references are
 * returned unchanged (they degrade to an unconstrained schema).
 */
function resolveNamedConst(text: string, src: string): string {
  const ref = /^([A-Za-z_$][\w$]*)((?:\.(?:optional|default)\([^)]*\))*)$/.exec(
    text,
  );
  if (!ref) return text;
  const [, name, chain = ""] = ref;
  const def = new RegExp(
    `(?:export\\s+)?const\\s+${name}\\s*=\\s*([\\s\\S]*?);`,
  ).exec(src);
  if (!def?.[1]) return text;
  const defined = def[1].replace(/\s+/g, " ").trim().replace(/\bz\s+\./g, "z.");
  return `${defined}${chain}`;
}

/** Map a Zod expression's text to a JSON Schema node. */
export function zodTextToJSONSchema(text: string): Record<string, unknown> {
  const t = text.trim();
  if (!t) return {};

  // Literal / enum first (most specific).
  const enumMatch = /z\.enum\(\s*\[(.*?)\]\s*\)/s.exec(t);
  if (enumMatch) {
    const values = [...enumMatch[1]!.matchAll(/["'`]([^"'`]+)["'`]/g)].map(
      (m) => m[1]!,
    );
    return { type: "string", enum: values };
  }
  const literalMatch = /z\.literal\(\s*["'`]([^"'`]+)["'`]\s*\)/.exec(t);
  if (literalMatch) {
    return { type: "string", const: literalMatch[1] };
  }
  if (/z\.literal\(\s*true\s*\)/.test(t)) return { type: "boolean", const: true };
  if (/z\.literal\(\s*false\s*\)/.test(t)) return { type: "boolean", const: false };
  if (/z\.date\(\)/.test(t)) {
    return { type: "string", format: "date-time" };
  }

  // Scalars are anchored at the expression start so nested schemas
  // (z.array(z.string()), z.object({ x: z.string() })) classify by
  // their OUTER construct.
  const isString = /^z\.(?:coerce\.)?string\(\)/.test(t);
  const isNumber =
    /^z\.(?:coerce\.)?number\(\)/.test(t) ||
    /^z\.(?:coerce\.)?bigint\(\)/.test(t);
  const isBoolean = /^z\.(?:coerce\.)?boolean\(\)/.test(t);
  const isArray = /^z\.array\(/.test(t);
  const isRecord = /^z\.record\(/.test(t);
  const isObject = /^z\.object\(/.test(t);

  if (isArray) return { type: "array", items: {} };
  if (isRecord) return { type: "object", additionalProperties: {} };
  if (isObject) return { type: "object" };

  if (isNumber) {
    return /\.int\(\)/.test(t) ? { type: "integer" } : { type: "number" };
  }
  if (isBoolean) return { type: "boolean" };
  if (isString) {
    const node: Record<string, unknown> = { type: "string" };
    if (/\.uuid\(\)/.test(t)) node.format = "uuid";
    else if (/\.email\(\)/.test(t)) node.format = "email";
    else if (/\.url\(\)/.test(t)) node.format = "uri";
    else if (/\.datetime\(\)/.test(t)) node.format = "date-time";
    return node;
  }

  if (/z\.union\(|\.or\(/.test(t)) return {};
  if (/z\.lazy\(|z\.discriminatedUnion\(/.test(t)) return {};
  return {};
}

/** Build an object schema from a z.object's extracted fields. */
export function objectSchema(fields: FieldShape[] | undefined): Record<string, unknown> {
  if (!fields || fields.length === 0) {
    return { type: "object", additionalProperties: true };
  }
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const f of fields) {
    properties[f.key] = zodTextToJSONSchema(f.text);
    if (!f.optional) required.push(f.key);
  }
  const schema: Record<string, unknown> = { type: "object", properties };
  if (required.length > 0) schema.required = required;
  return schema;
}

// ─── OpenAPI construction ─────────────────────────────────────────────────

const METHOD_ORDER = ["get", "post", "put", "patch", "delete"] as const;

/** Express `:param` path → OpenAPI `{param}` path. */
function toOpenAPIPath(path: string): string {
  return path
    .split("/")
    .map((seg) => (seg.startsWith(":") ? `{${seg.slice(1)}}` : seg))
    .join("/");
}

/** Param names embedded in an Express path. */
function pathParams(path: string): string[] {
  return path
    .split("/")
    .filter((seg) => seg.startsWith(":"))
    .map((seg) => seg.slice(1));
}

/** Deterministic operationId. */
function operationId(route: BackendRouteInfo): string {
  const slug = route.path
    .replace(/^\//, "")
    .replace(/[:\/-]+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .replace(/_+/g, "_");
  return `${route.method.toLowerCase()}_${slug}`;
}

function envelopeSchemaRef(route: BackendRouteInfo): string | undefined {
  switch (route.envelope) {
    case "data":
      return "#/components/schemas/EnvelopeData";
    case "data-meta":
      return "#/components/schemas/EnvelopeDataMeta";
    case "custom":
      return "#/components/schemas/EnvelopeCustom";
    case "empty":
      return undefined;
  }
  return "#/components/schemas/EnvelopeCustom";
}

interface Operation {
  summary: string;
  tags: string[];
  operationId: string;
  security?: unknown;
  parameters?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
}

function buildOperation(route: BackendRouteInfo): Operation {
  const responses: Record<string, unknown> = {};
  const statuses = route.successStatus.length > 0 ? route.successStatus : [200];

  for (const status of statuses) {
    const ref = envelopeSchemaRef(route);
    responses[String(status)] = ref
      ? {
          description:
            route.envelope === "empty"
              ? "Success (empty body)"
              : "Success — standard response envelope",
          content:
            route.envelope === "empty"
              ? undefined
              : {
                  "application/json": { schema: { $ref: ref } },
                },
        }
      : { description: "Success (empty body)" };
  }

  // Standard error responses.
  responses["400"] = {
    description: "Validation error",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
  };
  if (route.auth === "required") {
    responses["401"] = {
      description: "Unauthorized",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
    };
  }
  if (pathParams(route.path).length > 0) {
    responses["404"] = {
      description: "Resource not found",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
    };
  }
  responses["429"] = {
    description: "Rate limited (global tier; extra tiers where documented)",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } } },
  };

  // Path parameters.
  const params: {
    name: string;
    in: "path" | "query";
    required: boolean;
    schema: Record<string, unknown>;
  }[] = pathParams(route.path).map((name) => ({
    name,
    in: "path" as const,
    required: true,
    schema: { type: "string" },
  }));

  // Query parameters (from the route's Zod query schema).
  if (route.querySchema) {
    const fields = schemaShape(route.module, route.querySchema);
    for (const field of fields ?? []) {
      params.push({
        name: field.key,
        in: "query",
        required: !field.optional,
        schema: zodTextToJSONSchema(field.text),
      });
    }
  }

  const op: Operation = {
    summary: `${route.method} ${toOpenAPIPath(route.path)}`,
    tags: [route.module],
    operationId: operationId(route),
    responses,
  };
  if (params.length > 0) op.parameters = params;

  // Request body (Zod body schema).
  if (route.bodySchema && METHOD_ORDER.includes(route.method.toLowerCase() as (typeof METHOD_ORDER)[number])) {
    const fields = schemaShape(route.module, route.bodySchema);
    op.requestBody = {
      required: true,
      content: {
        "application/json": { schema: objectSchema(fields) },
      },
    };
  }

  if (route.auth === "required") {
    op.security = [{ bearerAuth: [] }, { apiKeyAuth: [] }];
  }

  return op;
}

/** The full OpenAPI document. */
export function buildDocument(): Record<string, unknown> {
  const routes = walkBackendRoutes();

  const paths: Record<string, Record<string, Operation>> = {};
  for (const route of routes) {
    const p = toOpenAPIPath(route.path);
    paths[p] ??= {};
    paths[p]![route.method.toLowerCase()] = buildOperation(route);
  }

  // The generator's own serving endpoint — its mount segment contains
  // a dot, so the static walker skips it. Add it manually.
  paths[`${"/api/v1"}/openapi.json`] ??= {};
  paths[`${"/api/v1"}/openapi.json`]!["get"] = {
    summary: "GET /api/v1/openapi.json",
    tags: ["openapi"],
    operationId: "get_api_v1_openapi_json",
    responses: {
      "200": {
        description: "The generated OpenAPI 3.1 document for this API",
        content: {
          "application/json": { schema: { type: "object" } },
        },
      },
    },
  };

  // Deterministic ordering: sort paths, then methods in fixed order.
  const sortedPaths: Record<string, Record<string, Operation>> = {};
  for (const p of Object.keys(paths).sort()) {
    const ops: Record<string, Operation> = {};
    for (const method of METHOD_ORDER) {
      const op = paths[p]![method];
      if (op) ops[method] = op;
    }
    sortedPaths[p] = ops;
  }

  const modules = [...new Set(routes.map((r) => r.module))].sort();
  const tags = modules.map((m) => ({ name: m }));
  tags.push({ name: "openapi" });

  return {
    openapi: "3.1.0",
    info: {
      title: "RoyCSS Backend API",
      version: "1.0.0",
      description:
        "REST API for the RoyCSS platform — generated from the module route table + Zod schemas by `npm run gen:openapi`. Response bodies follow the project envelope: `{ data, meta? }` on success, `{ error: { code, message, details? }, requestId }` on failure.",
    },
    servers: [{ url: "/" }],
    tags,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token from POST /api/v1/auth/login",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "RoyCSS API key (rk_live_… / rk_test_…)",
        },
      },
      schemas: {
        Meta: {
          type: "object",
          description:
            "Pagination/collection metadata: page, limit, total, totalPages | count | query-specific fields.",
          additionalProperties: true,
        },
        EnvelopeData: {
          type: "object",
          description: "Single-resource envelope.",
          properties: { data: {} },
          required: ["data"],
        },
        EnvelopeDataMeta: {
          type: "object",
          description: "Collection envelope.",
          properties: { data: {}, meta: { $ref: "#/components/schemas/Meta" } },
          required: ["data"],
        },
        EnvelopeCustom: {
          type: "object",
          description: "Module-specific response shape.",
          additionalProperties: true,
        },
        ErrorBody: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Stable error code (VALIDATION_ERROR, NOT_FOUND, …).",
            },
            message: { type: "string" },
            details: {},
          },
          required: ["code", "message"],
        },
        ErrorEnvelope: {
          type: "object",
          properties: {
            error: { $ref: "#/components/schemas/ErrorBody" },
            requestId: { type: "string", description: "X-Request-Id correlation id" },
          },
          required: ["error"],
        },
      },
    },
    paths: sortedPaths,
  };
}

// ─── Write / check ────────────────────────────────────────────────────────

export function render(doc: Record<string, unknown>): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

function main(): void {
const doc = buildDocument();
const generated = render(doc);
const pathCount = Object.keys((doc as { paths: Record<string, unknown> }).paths).length;

if (CHECK_MODE) {
  if (!existsSync(OUT_PATH)) {
    console.error(
      `✗ api/openapi.json does not exist — run \`npm run gen:openapi\` and commit the file.`,
    );
    process.exit(1);
  }
  const committed = readFileSync(OUT_PATH, "utf-8");
  if (committed === generated) {
    console.log(
      `✓ api/openapi.json is in sync (${pathCount} paths, ${walkBackendRoutes().length} operations).`,
    );
  } else {
    console.error(
      `✗ api/openapi.json is out of sync with the code (${pathCount} paths). Run \`npm run gen:openapi\` and commit the result.`,
    );
    // Show a short, useful diff hint.
    const committedLines = committed.split("\n");
    const generatedLines = generated.split("\n");
    let first = -1;
    for (
      let i = 0;
      i < Math.max(committedLines.length, generatedLines.length);
      i++
    ) {
      if (committedLines[i] !== generatedLines[i]) {
        first = i;
        break;
      }
    }
    if (first >= 0) {
      console.error(`  first difference at line ${first + 1}:`);
      console.error(`  - ${(committedLines[first] ?? "<EOF>").trim()}`);
      console.error(`  + ${(generatedLines[first] ?? "<EOF>").trim()}`);
    }
    process.exit(1);
  }
} else {
  mkdirSync(resolve(BACKEND_ROOT, "api"), { recursive: true });
  writeFileSync(OUT_PATH, generated, "utf-8");
  console.log(
    `✓ wrote api/openapi.json — ${pathCount} paths, ${walkBackendRoutes().length} operations (OpenAPI 3.1).`,
  );
}
}

// Run only when executed directly (importing for tests is side-effect-free).
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href;
if (isMain) main();
