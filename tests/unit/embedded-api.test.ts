import { describe, it, expect } from "vitest";

import {
  handleEmbeddedApi,
  effectsCount,
  type EmbeddedApiResponse,
} from "@/lib/embedded-api";
import { effects } from "@/lib/roycss-effects";
import { recipes } from "@/lib/roycss-recipes";
import { patterns } from "@/lib/roycss-patterns";

/**
 * Embedded API contract tests — issue #83.
 *
 * Every assertion pins the response envelope documented in API.md
 * (field names, casing, pagination metadata) and the error envelope
 * (`{ error: { code, message, details? }, requestId }`). The handler is
 * exercised directly — no Next.js server involved.
 */

type ErrorBody = {
  error: { code: string; message: string; details?: Array<Record<string, unknown>> };
  requestId: string;
};
type ListBody = {
  data: Array<Record<string, unknown>>;
  meta: { page: number; limit: number; total: number; totalPages: number; query?: string };
};

function get(path: string, query = ""): EmbeddedApiResponse {
  return handleEmbeddedApi({
    method: "GET",
    path,
    search: new URLSearchParams(query),
  });
}

function asError(res: EmbeddedApiResponse): ErrorBody {
  expect(res.status).toBeGreaterThanOrEqual(400);
  return res.body as ErrorBody;
}

function asList(res: EmbeddedApiResponse): ListBody {
  return res.body as ListBody;
}

const ANY_EFFECT_ID = effects[0]!.id;
const LOADERS_COUNT = effects.filter((e) => e.category === "loaders").length;

// ─── Envelope basics ────────────────────────────────────────────────────────

describe("embedded API envelope", () => {
  it("sends JSON with X-Request-Id and no-store on every success", () => {
    const res = get("/effects", "limit=1");
    expect(res.status).toBe(200);
    expect(res.headers["Content-Type"]).toBe("application/json");
    expect(res.headers["X-Request-Id"]).toMatch(/^[a-z0-9]{6,16}$/);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("wraps errors in the documented error envelope with a requestId", () => {
    const err = asError(get("/effects/definitely-not-an-id"));
    expect(err.error.code).toBe("NOT_FOUND");
    expect(typeof err.error.message).toBe("string");
    expect(err.requestId).toMatch(/^[a-z0-9]{6,16}$/);
  });
});

// ─── GET /effects — list ───────────────────────────────────────────────────

describe("GET /api/v1/effects (list)", () => {
  it("returns the API.md collection envelope with default pagination", () => {
    const res = get("/effects");
    const body = asList(res);

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(24); // default limit
    expect(body.meta).toEqual({
      page: 1,
      limit: 24,
      total: effectsCount(),
      totalPages: Math.ceil(effectsCount() / 24),
    });
  });

  it("serves the full embedded catalog (1,959 effects)", () => {
    const body = asList(get("/effects", "limit=200"));
    // 1959 = 9 full pages of 200 + one page of 159
    expect(body.meta.total).toBe(1959);
    expect(body.meta.totalPages).toBe(10);
    expect(get("/effects", "page=10&limit=200").body).toMatchObject({
      meta: { page: 10, total: 1959, totalPages: 10 },
    });
    const lastPage = asList(get("/effects", "page=10&limit=200"));
    expect(lastPage.data.length).toBe(159);
  });

  it("respects limit and echoes it in meta", () => {
    const body = asList(get("/effects", "limit=2"));
    expect(body.data.length).toBe(2);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.page).toBe(1);
  });

  it("returns an empty page (not an error) past the end", () => {
    const body = asList(get("/effects", "page=9999"));
    expect(body.data).toEqual([]);
    expect(body.meta).toMatchObject({ page: 9999, total: effectsCount() });
  });

  it("maps effects to the wire DTO: metadata only, no cssCode, null-normalized optionals", () => {
    const body = asList(get("/effects", `limit=200&page=1`));
    for (const item of body.data) {
      expect(Object.keys(item).sort()).toEqual([
        "category",
        "childCount",
        "description",
        "id",
        "name",
        "previewText",
        "previewType",
        "tags",
      ]);
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
      expect(typeof item.description).toBe("string");
      expect(Array.isArray(item.tags)).toBe(true);
      if (item.childCount !== null) expect(typeof item.childCount).toBe("number");
      if (item.previewText !== null) expect(typeof item.previewText).toBe("string");
    }
  });

  it("filters by category and reports the filtered total", () => {
    const body = asList(get("/effects", "category=loaders"));
    expect(body.meta.total).toBe(LOADERS_COUNT);
    expect(body.data.every((e) => e.category === "loaders")).toBe(true);
  });

  it("filters by tag", () => {
    const tag = effects[0]!.tags[0]!;
    const body = asList(get("/effects", `tag=${encodeURIComponent(tag)}`));
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((e) => (e.tags as string[]).includes(tag))).toBe(true);
  });

  it("filters by previewType", () => {
    const body = asList(get("/effects", "previewType=loader"));
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((e) => e.previewType === "loader")).toBe(true);
  });

  it("sorts by name when sort=name and by id by default", () => {
    const byName = asList(get("/effects", "sort=name&limit=50")).data.map((e) => String(e.name));
    expect([...byName].sort((a, b) => a.localeCompare(b))).toEqual(byName);

    const byId = asList(get("/effects", "limit=50")).data.map((e) => String(e.id));
    expect([...byId].sort((a, b) => a.localeCompare(b))).toEqual(byId);
  });

  it("rejects invalid query params with 400 VALIDATION_ERROR + field details", () => {
    for (const bad of ["category=nope", "limit=201", "limit=0", "page=0", "previewType=nope", "sort=wat"]) {
      const res = get("/effects", bad);
      expect(res.status, `expected 400 for ${bad}`).toBe(400);
      const err = asError(res);
      expect(err.error.code).toBe("VALIDATION_ERROR");
      expect(err.error.message).toBe("Request validation failed");
      const detail = err.error.details![0]!;
      expect(detail.target).toBe("query");
      expect(typeof detail.path).toBe("string");
      expect(typeof detail.message).toBe("string");
      expect(typeof detail.code).toBe("string");
    }
  });
});

// ─── GET /effects/search ───────────────────────────────────────────────────

describe("GET /api/v1/effects/search", () => {
  it("requires q and returns 400 VALIDATION_ERROR when missing", () => {
    const res = get("/effects/search");
    expect(res.status).toBe(400);
    expect(asError(res).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns matches in the collection envelope and echoes q in meta.query", () => {
    const body = asList(get("/effects/search", "q=glow&limit=5"));
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.meta.query).toBe("glow");
    expect(body.meta.limit).toBe(5);
    expect(body.meta.total).toBeGreaterThan(0);
    for (const e of body.data) {
      const haystack = `${e.name} ${e.description} ${e.category} ${(e.tags as string[]).join(" ")}`.toLowerCase();
      expect(haystack.includes("glow") || String(e.id).includes("glow")).toBe(true);
    }
  });

  it("ranks name/id matches above description matches (top hit matches the term strongly)", () => {
    const body = asList(get("/effects/search", "q=neon"));
    const top = body.data[0]!;
    expect(
      String(top.id).includes("neon") || String(top.name).toLowerCase().includes("neon"),
    ).toBe(true);
  });

  it("supports multi-term queries and the category filter", () => {
    const body = asList(get("/effects/search", "q=neon%20glow"));
    expect(body.meta.total).toBeGreaterThan(0);

    const scoped = asList(get("/effects/search", "q=glow&category=animations"));
    expect(scoped.data.every((e) => e.category === "animations")).toBe(true);
  });
});

// ─── GET /effects/categories and /effects/tags ─────────────────────────────

describe("GET /api/v1/effects/categories | /tags", () => {
  it("returns distinct categories with a count-only meta", () => {
    const res = get("/effects/categories");
    expect(res.status).toBe(200);
    const body = res.body as { data: string[]; meta: { count: number } };
    expect(new Set(body.data).size).toBe(body.data.length);
    expect(body.meta).toEqual({ count: body.data.length });
    expect(body.data.length).toBe(29);
    expect(body.data).toContain("loaders");
  });

  it("returns distinct, sorted tags with a count-only meta", () => {
    const res = get("/effects/tags");
    const body = res.body as { data: string[]; meta: { count: number } };
    expect([...body.data].sort()).toEqual(body.data);
    expect(new Set(body.data).size).toBe(body.data.length);
    expect(body.meta).toEqual({ count: body.data.length });
    expect(body.data.length).toBe(
      new Set(effects.flatMap((e) => e.tags)).size,
    );
  });
});

// ─── GET /effects/:id ──────────────────────────────────────────────────────

describe("GET /api/v1/effects/:id", () => {
  it("returns a single resource envelope: { data } with no meta", () => {
    const res = get(`/effects/${encodeURIComponent(ANY_EFFECT_ID)}`);
    expect(res.status).toBe(200);
    const body = res.body as { data: Record<string, unknown> };
    expect(body.data.id).toBe(ANY_EFFECT_ID);
    expect(Object.keys(body)).toEqual(["data"]);
    expect("cssCode" in body.data).toBe(false);
  });

  it("returns 404 NOT_FOUND with the backend's message format for unknown ids", () => {
    const res = get("/effects/no-such-effect");
    expect(res.status).toBe(404);
    const err = asError(res);
    expect(err.error.code).toBe("NOT_FOUND");
    expect(err.error.message).toBe("Effect 'no-such-effect' not found");
  });
});

// ─── Recipes + patterns ────────────────────────────────────────────────────

describe("GET /api/v1/recipes", () => {
  it("lists the embedded recipe collection with pagination meta", () => {
    const body = asList(get("/recipes"));
    expect(body.meta.total).toBe(recipes.length);
    expect(body.data.length).toBe(Math.min(24, recipes.length));
    for (const r of body.data) {
      expect(r.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
      expect(Array.isArray(r.effectIds)).toBe(true);
      expect(typeof r.html).toBe("string");
    }
  });

  it("filters by category, difficulty and tag", () => {
    const byCat = asList(get("/recipes", "category=hero-sections"));
    expect(byCat.data.every((r) => r.category === "hero-sections")).toBe(true);

    const byDiff = asList(get("/recipes", "difficulty=beginner"));
    expect(byDiff.data.every((r) => r.difficulty === "beginner")).toBe(true);

    const byTag = asList(get("/recipes", "tag=hero"));
    expect(byTag.data.every((r) => (r.tags as string[]).includes("hero"))).toBe(true);
  });

  it("validates category/difficulty against the documented enums (400)", () => {
    expect(get("/recipes", "category=snacks").status).toBe(400);
    expect(get("/recipes", "difficulty=expert").status).toBe(400);
  });

  it("serves a recipe by id and 404s unknown ids", () => {
    const id = recipes[0]!.id;
    const res = get(`/recipes/${id}`);
    expect(res.status).toBe(200);
    expect((res.body as { data: { id: string } }).data.id).toBe(id);

    const missing = get("/recipes/nope");
    expect(missing.status).toBe(404);
    expect(asError(missing).error.message).toBe("Recipe 'nope' not found");
  });
});

describe("GET /api/v1/patterns", () => {
  it("lists the embedded pattern collection with pagination meta", () => {
    const body = asList(get("/patterns"));
    expect(body.meta.total).toBe(patterns.length);
    for (const p of body.data) {
      expect(p.category).toMatch(/^(states|feedback|layouts)$/);
      expect(typeof p.whenToUse).toBe("string");
    }
  });

  it("filters by category and tag, validates the enum (400)", () => {
    const byCat = asList(get("/patterns", "category=states"));
    expect(byCat.data.every((p) => p.category === "states")).toBe(true);

    expect(get("/patterns", "category=emotions").status).toBe(400);
  });

  it("serves a pattern by id and 404s unknown ids", () => {
    const id = patterns[0]!.id;
    expect(get(`/patterns/${id}`).status).toBe(200);
    const missing = get("/patterns/nope");
    expect(missing.status).toBe(404);
    expect(asError(missing).error.message).toBe("Pattern 'nope' not found");
  });
});

// ─── Health + index ────────────────────────────────────────────────────────

describe("GET /api/v1/health (embedded flavor)", () => {
  it("returns the backend health shape with the embedded service marker", () => {
    const res = get("/health");
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.service).toBe("roycss-embedded-api");
    expect(typeof body.version).toBe("string");
    expect(body.uptime).toMatchObject({
      ms: expect.any(Number),
      seconds: expect.any(Number),
      human: expect.any(String),
    });
    expect(new Date(body.time as string).toString()).not.toBe("Invalid Date");
    expect((body.checks as Record<string, unknown>).memory).toMatchObject({
      rssMb: expect.any(Number),
    });
  });

  it("404s unknown health sub-routes like the backend router", () => {
    const res = get("/health/deep");
    expect(res.status).toBe(404);
    expect(asError(res).error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/v1 (index)", () => {
  it("returns { name, version, endpoints } listing every embedded route", () => {
    const res = get("");
    expect(res.status).toBe(200);
    const body = res.body as { name: string; version: string; endpoints: string[] };
    expect(body.name).toBe("roycss-embedded-api");
    expect(Object.keys(body).sort()).toEqual(["endpoints", "name", "version"]);
    expect(body.endpoints).toEqual([
      "GET    /api/v1/health",
      "GET    /api/v1/effects",
      "GET    /api/v1/effects/search",
      "GET    /api/v1/effects/categories",
      "GET    /api/v1/effects/tags",
      "GET    /api/v1/effects/:id",
      "GET    /api/v1/recipes",
      "GET    /api/v1/recipes/:id",
      "GET    /api/v1/patterns",
      "GET    /api/v1/patterns/:id",
    ]);
  });
});

// ─── Unsupported endpoints (proxy-only surface) ─────────────────────────────

describe("endpoints the embedded catalog cannot serve", () => {
  it("answers documented-but-DB-backed modules with 503 EMBEDDED_MODE_UNSUPPORTED", () => {
    for (const path of ["/themes", "/auth/me", "/search", "/os/dashboard", "/registry/packages"]) {
      const res = get(path);
      expect(res.status, `expected 503 for ${path}`).toBe(503);
      const err = asError(res);
      expect(err.error.code).toBe("EMBEDDED_MODE_UNSUPPORTED");
      expect(err.error.message).toContain("embedded API mode");
      expect(err.error.message).toContain(path);
    }
  });

  it("rejects non-GET methods with 503 EMBEDDED_MODE_UNSUPPORTED (read-only surface)", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const res = handleEmbeddedApi({ method, path: "/effects", search: new URLSearchParams() });
      expect(res.status, `expected 503 for ${method}`).toBe(503);
      expect(asError(res).error.code).toBe("EMBEDDED_MODE_UNSUPPORTED");
    }
  });

  it("answers OPTIONS preflights directly with 204", () => {
    const res = handleEmbeddedApi({ method: "OPTIONS", path: "/effects", search: new URLSearchParams() });
    expect(res.status).toBe(204);
    expect(res.headers["Access-Control-Allow-Methods"]).toBe("GET, OPTIONS");
  });

  it("404s unknown sub-routes under known modules (backend notFoundHandler shape)", () => {
    const res = get("/effects/pulse-glow/extra");
    expect(res.status).toBe(404);
    const err = asError(res);
    expect(err.error.code).toBe("NOT_FOUND");
    expect(err.error.message).toBe("Route not found: GET /api/v1/effects/pulse-glow/extra");
  });
});
