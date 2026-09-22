import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Route-level integration tests for the #159 write-route guard.
 *
 * `POST /api/contact` is exercised against the real handler with Prisma
 * mocked (`@/lib/db`), and `POST /api/ai-playground` with the
 * z-ai-web-dev-sdk mocked — proving the guard runs BEFORE any database
 * write or paid-LLM call, and that denial bodies stay generic.
 */

const dbMock = vi.hoisted(() => ({
  contactMessage: {
    create: vi.fn(),
  },
}));

const zaiMock = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("z-ai-web-dev-sdk", () => ({
  default: { create: zaiMock.create },
}));

const { POST: contactPOST, GET: contactGET } = await import("@/app/api/contact/route");
const { POST: aiPlaygroundPOST } = await import("@/app/api/ai-playground/route");
const { _resetRateLimitStoreForTest } = await import("@/lib/api-security");

const CONTACT_URL = "http://localhost:3000/api/contact";
const AI_URL = "http://localhost:3000/api/ai-playground";
const SAME_ORIGIN = { host: "localhost:3000", origin: "http://localhost:3000" };
const VALID_CONTACT = {
  name: "QA Bot",
  email: "qa@example.com",
  subject: "Integration test",
  message: "Hello there — this message is long enough.",
};

function contactRequest(headers: Record<string, string> = {}, body: unknown = VALID_CONTACT): Request {
  return new Request(CONTACT_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...SAME_ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

function aiRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(AI_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...SAME_ORIGIN, ...headers },
    body: JSON.stringify({ prompt: "a pulsing glow effect" }),
  });
}

beforeEach(() => {
  _resetRateLimitStoreForTest();
  dbMock.contactMessage.create.mockReset().mockResolvedValue({ id: "cm_test" });
  zaiMock.create.mockReset().mockResolvedValue({
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: "/* A pulsing glow effect */\n.roycss-ai-glow {}" } }],
        }),
      },
    },
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── POST /api/contact — origin verification ───────────────────────────────

describe("POST /api/contact — origin verification", () => {
  it("accepts a same-origin submission (200, persisted)", async () => {
    const res = await contactPOST(contactRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(dbMock.contactMessage.create).toHaveBeenCalledTimes(1);
  });

  it("rejects a cross-origin submission with a generic 403 before touching Prisma", async () => {
    const res = await contactPOST(contactRequest({ origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    const body = (await res.json()) as { ok: boolean; error: string; requestId: string };
    expect(body.ok).toBe(false);
    expect(typeof body.error).toBe("string");
    expect(body.requestId).toMatch(/^[a-z0-9]+$/);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    // Generic response — no echo of the rejected origin.
    expect(JSON.stringify(body)).not.toContain("evil.example");
    // Guard runs BEFORE the DB write.
    expect(dbMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("rejects a missing-Origin POST (fail-closed per #159)", async () => {
    const noOrigin = new Request(CONTACT_URL, {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000" },
      body: JSON.stringify(VALID_CONTACT),
    });
    const res = await contactPOST(noOrigin);
    expect(res.status).toBe(403);
    expect(dbMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("rejects an empty-string Origin header (fail-closed per #159)", async () => {
    const res = await contactPOST(contactRequest({ origin: "" }));
    expect(res.status).toBe(403);
    expect(dbMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("still serves its GET status handler (writes-only policy)", async () => {
    // GET /api/contact is not wrapped by the guard — only writes are.
    const res = await contactGET();
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/contact — rate limiting (5/min/IP) ──────────────────────────

describe("POST /api/contact — rate limiting", () => {
  it("returns 429 with Retry-After after 5 submissions/min from one IP", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await contactPOST(contactRequest({}, { ...VALID_CONTACT, email: `qa${i}@example.com` }));
      expect(res.status).toBe(200);
    }
    expect(dbMock.contactMessage.create).toHaveBeenCalledTimes(5);

    const denied = await contactPOST(contactRequest({}, { ...VALID_CONTACT, email: "qa6@example.com" }));
    expect(denied.status).toBe(429);
    expect(denied.headers.get("retry-after")).toBe("60");
    expect(denied.headers.get("x-ratelimit-remaining")).toBe("0");
    const body = (await denied.json()) as { ok: boolean; error: string; requestId: string };
    expect(body.ok).toBe(false);
    expect(body.requestId).toBeTruthy();
    // The 6th request must not reach Prisma.
    expect(dbMock.contactMessage.create).toHaveBeenCalledTimes(5);
  });

  it("keeps the pre-existing DB-failure contract (503) after the guard passes", async () => {
    dbMock.contactMessage.create.mockRejectedValueOnce(new Error("db down"));
    const res = await contactPOST(contactRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false });
  });

  it("lets validation errors (400) flow through for same-origin traffic", async () => {
    const res = await contactPOST(contactRequest({}, { name: "", email: "nope", message: "x" }));
    expect(res.status).toBe(400);
    expect(dbMock.contactMessage.create).not.toHaveBeenCalled();
  });
});

// ─── POST /api/ai-playground — paid-LLM guard ──────────────────────────────

describe("POST /api/ai-playground — origin + rate limit before the SDK", () => {
  it("rejects cross-origin abuse with 403 and never calls the LLM SDK", async () => {
    const res = await aiPlaygroundPOST(aiRequest({ origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(zaiMock.create).not.toHaveBeenCalled();
  });

  it("returns 429 after the 20/min AI tier and stops SDK spend at the threshold", async () => {
    for (let i = 0; i < 20; i++) {
      const res = await aiPlaygroundPOST(aiRequest());
      expect(res.status).toBe(200);
    }
    expect(zaiMock.create).toHaveBeenCalledTimes(20);

    const denied = await aiPlaygroundPOST(aiRequest());
    expect(denied.status).toBe(429);
    expect(denied.headers.get("retry-after")).toBe("60");
    expect(zaiMock.create).toHaveBeenCalledTimes(20);
    const body = (await denied.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
  });
});
