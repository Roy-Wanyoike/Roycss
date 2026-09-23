/**
 * Unit tests — errorHandler malformed-JSON regression (issue #207).
 *
 * Before #207, a malformed JSON body produced by express.json() escaped
 * the known-error branches of the centralized error handler and surfaced
 * as `500 INTERNAL_ERROR` with the raw body-parser message and — in dev
 * — a full stack trace (absolute paths) in `details.stack`. Client input
 * must never produce a 500 or leak internals:
 *
 *   - body-parser `entity.parse.failed` / status-400 parse errors →
 *     clean `400 BAD_REQUEST` envelope, no `details`, no parser text;
 *   - `details.stack` never crosses a 4xx response, whatever the throw
 *     site attached (server logs keep everything — logAndSend);
 *   - the dev-only 5xx stack diagnostic is preserved (unchanged).
 *
 * The mini express app below mounts the REAL express.json() + the REAL
 * errorHandler so the regression exercises the exact production path
 * (body-parser error shape → handler branch).
 */
import express, { type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, type Mock, vi } from "vitest";

import { AppError, ErrorCode, errorHandler } from "../../src/server/middleware/error.js";

/** Minimal app: body parser + one echo route + the real error handler. */
function makeApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.post("/echo", (req, res) => {
    res.json({ got: req.body });
  });
  app.use(errorHandler);
  return app;
}

/** Fake req/res pair for invoking errorHandler directly. */
function fakeReqRes(requestId?: string): {
  req: Request;
  res: Response;
  status: Mock;
  json: Mock;
} {
  const status = vi.fn() as Mock;
  const json = vi.fn() as Mock;
  status.mockImplementation(() => res);
  const res = {
    status,
    json,
    locals: requestId === undefined ? {} : { requestId },
  } as unknown as Response;
  const req = { headers: {} } as unknown as Request;
  return { req, res, status, json };
}

describe("errorHandler — malformed JSON body (issue #207)", () => {
  it("malformed JSON through express.json() → 400 BAD_REQUEST envelope, no stack, no parser internals", async () => {
    const res = await request(makeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send('{"email":"a@b.c",,}');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.message).toBe(
      "Malformed request body — the payload could not be parsed",
    );
    // No details at all — the parser message must not cross the wire.
    expect(res.body.error.details).toBeUndefined();
    // Belt and braces: neither stack frames nor body-parser wording.
    const bodyText = JSON.stringify(res.body);
    expect(bodyText).not.toMatch(/stack/i);
    expect(bodyText).not.toMatch(/Unexpected token|position \d+|entity\.parse|body-parser/i);
    expect(res.body.error.message).not.toMatch(/Unexpected token/);
  });

  it("truncated JSON and non-JSON content types are also clean 400s", async () => {
    const app = makeApp();

    const truncated = await request(app)
      .post("/echo")
      .set("Content-Type", "application/json")
      .send('{"email":');
    expect(truncated.status).toBe(400);
    expect(truncated.body.error.code).toBe("BAD_REQUEST");

    const wrongType = await request(app)
      .post("/echo")
      .set("Content-Type", "application/json")
      .send("not json at all");
    expect(wrongType.status).toBe(400);
    expect(wrongType.body.error.code).toBe("BAD_REQUEST");
  });

  it("valid JSON still reaches the route (sanity — the fix didn't over-apply)", async () => {
    const res = await request(makeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send({ email: "a@b.c" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ got: { email: "a@b.c" } });
  });
});

describe("errorHandler — direct branch mapping (issue #207)", () => {
  it("maps a body-parser SyntaxError (entity.parse.failed, status 400) to a 400 AppError envelope", () => {
    // Exact shape body-parser produces for malformed JSON.
    const err = Object.assign(
      new SyntaxError('Unexpected token "," in JSON at position 14'),
      {
        status: 400,
        statusCode: 400,
        type: "entity.parse.failed",
        expose: true,
      },
    );
    const { req, res, status, json } = fakeReqRes("req-parse-1");

    errorHandler(err, req, res, vi.fn());

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: ErrorCode.BAD_REQUEST }),
        requestId: "req-parse-1",
      }),
    );
    const body = (json as Mock).mock.calls[0]![0] as { error: { details?: unknown } };
    expect(body.error.details).toBeUndefined();
  });

  it("maps body-parser status-400 errors with a type tag (request.aborted) to 400", () => {
    const err = Object.assign(new Error("request aborted"), {
      status: 400,
      type: "request.aborted",
    });
    const { req, res, status, json } = fakeReqRes();

    errorHandler(err, req, res, vi.fn());

    expect(status).toHaveBeenCalledWith(400);
    expect((json as Mock).mock.calls[0]![0]).toMatchObject({
      error: { code: ErrorCode.BAD_REQUEST },
    });
  });

  it("does NOT remap body-parser errors outside the 400/parse-failure scope (entity.too.large stays out)", () => {
    // Deliberate scope boundary from the issue: 413/415 keep their
    // historical handling — only parse failures become 400s.
    const err = Object.assign(new Error("request entity too large"), {
      status: 413,
      type: "entity.too.large",
    });
    const { req, res, status } = fakeReqRes();

    errorHandler(err, req, res, vi.fn());

    expect(status).not.toHaveBeenCalledWith(400);
  });
});

describe("errorHandler — details.stack invariant (issue #207)", () => {
  it("strips a top-level stack key from 4xx details, whatever the throw site attached", () => {
    const err = new AppError(ErrorCode.BAD_REQUEST, "nope", 400, {
      stack: "STACK-LEAK-CANARY",
      hint: "keep me",
    });
    const { req, res, json } = fakeReqRes();

    errorHandler(err, req, res, vi.fn());

    const body = (json as Mock).mock.calls[0]![0] as {
      error: { details?: Record<string, unknown> };
    };
    expect(JSON.stringify(body)).not.toContain("STACK-LEAK-CANARY");
    expect(body.error.details).toEqual({ hint: "keep me" });
  });

  it("drops details entirely when a 4xx object carried ONLY the stack", () => {
    const err = new AppError(ErrorCode.CONFLICT, "clash", 409, {
      stack: "STACK-LEAK-CANARY",
    });
    const { req, res, json } = fakeReqRes();

    errorHandler(err, req, res, vi.fn());

    const body = (json as Mock).mock.calls[0]![0] as {
      error: { details?: unknown };
    };
    expect(body.error.details).toBeUndefined();
  });

  it("keeps array-shaped 4xx details (zod field errors) untouched", () => {
    const details = [{ path: "email", message: "required" }];
    const err = new AppError(ErrorCode.VALIDATION_ERROR, "Request validation failed", 400, details);
    const { req, res, json } = fakeReqRes();

    errorHandler(err, req, res, vi.fn());

    const body = (json as Mock).mock.calls[0]![0] as {
      error: { details?: unknown };
    };
    expect(body.error.details).toEqual(details);
  });

  it("dev-mode 5xx still carries the stack diagnostic (unchanged behavior)", () => {
    const err = new Error("boom — programmer error");
    const { req, res, json } = fakeReqRes("req-500");

    errorHandler(err, req, res, vi.fn());

    // Tests run with NODE_ENV unset → development → stack attached.
    const body = (json as Mock).mock.calls[0]![0] as {
      error: { details?: { stack?: string } };
    };
    expect(body.error.details?.stack).toBeTruthy();
  });
});
