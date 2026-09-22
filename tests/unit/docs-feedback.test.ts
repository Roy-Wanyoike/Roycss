import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateDocsFeedback,
  submitDocsFeedback,
  DOCS_FEEDBACK_UNREACHABLE_MESSAGE,
  DOCS_FEEDBACK_FAILED_MESSAGE,
  DOCS_FEEDBACK_COMMENT_MAX,
} from "@/lib/docs-feedback";

/** Resolvable JSON response helper. */
const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

describe("validateDocsFeedback", () => {
  it("accepts a well-formed submission without comment", () => {
    expect(validateDocsFeedback({ slug: "/docs/api", helpful: true })).toEqual(
      {},
    );
  });

  it("accepts an optional comment", () => {
    expect(
      validateDocsFeedback({
        slug: "docs/api/effects",
        helpful: false,
        comment: "Needs more examples",
      }),
    ).toEqual({});
  });

  it("rejects an empty slug", () => {
    const errors = validateDocsFeedback({ slug: "", helpful: true });
    expect(errors.slug).toBeTruthy();
  });

  it("rejects a slug with invalid characters", () => {
    const errors = validateDocsFeedback({
      slug: "../etc/passwd",
      helpful: true,
    });
    expect(errors.slug).toBeTruthy();
  });

  it("rejects an oversized slug", () => {
    const errors = validateDocsFeedback({
      slug: "a".repeat(201),
      helpful: true,
    });
    expect(errors.slug).toBeTruthy();
  });

  it(`rejects a comment over ${DOCS_FEEDBACK_COMMENT_MAX} chars`, () => {
    const errors = validateDocsFeedback({
      slug: "docs/api",
      helpful: true,
      comment: "x".repeat(DOCS_FEEDBACK_COMMENT_MAX + 1),
    });
    expect(errors.comment).toBeTruthy();
  });
});

describe("submitDocsFeedback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success with server message", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ ok: true, message: "Thanks!" }) as Response,
      );
    const result = await submitDocsFeedback(
      { slug: "docs/api", helpful: true },
      fetcher,
    );
    expect(result).toEqual({ ok: true, message: "Thanks!" });
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      slug: "docs/api",
      helpful: true,
    });
  });

  it("normalizes leading/trailing slashes and trims the comment", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true }) as Response);
    await submitDocsFeedback(
      {
        slug: "/docs/api/",
        helpful: false,
        comment: "  spaced  ",
      },
      fetcher,
    );
    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      slug: "docs/api",
      helpful: false,
      comment: "spaced",
    });
  });

  it("throws the server error message on 4xx/5xx", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ ok: false, error: "Unknown documentation page." }, 400),
      );
    await expect(
      submitDocsFeedback({ slug: "docs/nope", helpful: true }, fetcher),
    ).rejects.toThrow("Unknown documentation page.");
  });

  it("falls back to the friendly message on error payloads without copy", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, 500));
    await expect(
      submitDocsFeedback({ slug: "docs/api", helpful: true }, fetcher),
    ).rejects.toThrow(DOCS_FEEDBACK_FAILED_MESSAGE);
  });

  it("maps network failure to the unreachable message", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
    await expect(
      submitDocsFeedback({ slug: "docs/api", helpful: true }, fetcher),
    ).rejects.toThrow(DOCS_FEEDBACK_UNREACHABLE_MESSAGE);
  });
});
