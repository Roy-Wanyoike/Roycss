/**
 * Unit tests — OpenAPI generator internals (PF-009 / issue #94 A4).
 *
 *   1. Zod → JSON Schema mapping (strings/formats/numbers/booleans/
 *      enums/arrays/objects/optional vs required) over real module
 *      schemas
 *   2. buildDocument: OpenAPI 3.1.0 skeleton, sorted deterministic
 *      paths, the manually-added /api/v1/openapi.json endpoint,
 *      envelope + error component schemas
 *
 * Serving + drift gate are covered by tests/integration/openapi.test.ts
 * and `npm run gen:openapi:check`.
 */
import { describe, expect, it } from "vitest";

import {
  buildDocument,
  objectSchema,
  schemaShape,
  zodTextToJSONSchema,
} from "../../scripts/gen-openapi.js";

describe("zod → JSON Schema mapping (issue #94 A4)", () => {
  it("1. maps the common Zod constructs to JSON Schema nodes", () => {
    expect(zodTextToJSONSchema("z.string()")).toEqual({ type: "string" });
    expect(zodTextToJSONSchema("z.string().email()")).toEqual({
      type: "string",
      format: "email",
    });
    expect(zodTextToJSONSchema("z.string().uuid()")).toEqual({
      type: "string",
      format: "uuid",
    });
    expect(zodTextToJSONSchema("z.coerce.number().int().min(1)")).toEqual({
      type: "integer",
    });
    expect(zodTextToJSONSchema("z.coerce.number()")).toEqual({ type: "number" });
    expect(zodTextToJSONSchema("z.boolean()")).toEqual({ type: "boolean" });
    expect(zodTextToJSONSchema("z.array(z.string())")).toEqual({
      type: "array",
      items: {},
    });
    expect(zodTextToJSONSchema("z.record(z.string())")).toEqual({
      type: "object",
      additionalProperties: {},
    });
    expect(zodTextToJSONSchema('z.enum(["a", "b"])')).toEqual({
      type: "string",
      enum: ["a", "b"],
    });
    expect(zodTextToJSONSchema('z.literal("yes")')).toEqual({
      type: "string",
      const: "yes",
    });
    expect(zodTextToJSONSchema("z.date()")).toEqual({
      type: "string",
      format: "date-time",
    });
    // Unknown constructs degrade to an unconstrained (valid) schema.
    expect(zodTextToJSONSchema("z.lazy(() => Thing)")).toEqual({});
    expect(zodTextToJSONSchema("")).toEqual({});
  });

  it("2. objectSchema derives required from non-optional fields", () => {
    const schema = objectSchema([
      { key: "email", optional: false, text: "z.string().email()" },
      { key: "tags", optional: true, text: "z.array(z.string())" },
    ]);
    expect(schema).toEqual({
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        tags: { type: "array", items: {} },
      },
      required: ["email"],
    });
  });

  it("3. schemaShape extracts real module schemas incl. named enum consts", () => {
    // effects: ListEffectsQuerySchema references EffectCategoryEnum.
    const fields = schemaShape("effects", "ListEffectsQuerySchema")!;
    const category = fields.find((f) => f.key === "category")!;
    const categorySchema = zodTextToJSONSchema(category.text);
    expect(categorySchema).toMatchObject({ type: "string" });
    expect((categorySchema as { enum?: string[] }).enum).toContain("animations");

    const sort = fields.find((f) => f.key === "sort")!;
    expect(zodTextToJSONSchema(sort.text)).toMatchObject({
      enum: ["name", "name-desc", "category", "id"],
    });
  });
});

describe("buildDocument (issue #94 A4)", () => {
  it("4. emits a valid, sorted OpenAPI 3.1 document with envelope components", () => {
    const doc = buildDocument() as {
      openapi: string;
      paths: Record<string, Record<string, { tags: string[]; responses: Record<string, unknown> }>>;
      components: { schemas: Record<string, unknown> };
    };
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.paths["/api/v1/effects"]).toBeTruthy();
    // Deterministic: path keys are sorted (insertion order == sorted).
    const keys = Object.keys(doc.paths);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
    // The generator's own endpoint is added manually (dot in mount path
    // hides it from the static walker).
    expect(doc.paths["/api/v1/openapi.json"].get).toBeTruthy();
    // Envelope + error schemas exist.
    expect(doc.components.schemas.EnvelopeDataMeta).toBeTruthy();
    expect(doc.components.schemas.ErrorEnvelope).toBeTruthy();
    // Every operation references the error envelope on 429.
    const effectsGet = doc.paths["/api/v1/effects"].get;
    expect(effectsGet.responses["429"]).toBeTruthy();
  });
});
