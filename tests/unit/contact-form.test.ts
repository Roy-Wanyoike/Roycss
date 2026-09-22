/**
 * Contact submit + validation logic (issue #162).
 *
 * Covers the three branches of the "Get in Touch" submit handler with a
 * mocked fetcher:
 *   1. inline validation (empty / short / invalid email / valid),
 *   2. success (2xx + ok:true → confirmation copy),
 *   3. API failure (4xx/5xx, non-JSON, ok:false) and network failure —
 *      every failure surfaces an actionable Error, never a raw
 *      SyntaxError.
 */
import { describe, it, expect, vi, type Mock } from "vitest";

import {
  validateContactFields,
  submitContactMessage,
  CONTACT_FAILED_MESSAGE,
  CONTACT_UNREACHABLE_MESSAGE,
  type FetchLike,
} from "@/lib/contact-form";

const VALID_FIELDS = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Bug Report",
  message: "The glow effect flickers on Safari.",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type FetchMock = Mock<
  (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Response | Promise<Response>
>;

function fetcherResponding(
  responder: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Response | Promise<Response>,
): FetchMock {
  return vi.fn(responder);
}

describe("validateContactFields", () => {
  it("flags empty name, email and message", () => {
    const errs = validateContactFields({ name: "", email: "", message: "" });
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.message).toBeTruthy();
    expect(Object.keys(errs)).toHaveLength(3);
  });

  it("rejects an invalid email format", () => {
    const errs = validateContactFields({
      ...VALID_FIELDS,
      email: "not-an-email",
    });
    expect(errs.email).toBeTruthy();
    expect(errs.name).toBeUndefined();
    expect(errs.message).toBeUndefined();
  });

  it("requires the minimum message length enforced by the API", () => {
    const errs = validateContactFields({ ...VALID_FIELDS, message: "short" });
    expect(errs.message).toBeTruthy();
    expect(errs.name).toBeUndefined();
    expect(errs.email).toBeUndefined();
  });

  it("accepts whitespace-padded but valid fields", () => {
    expect(
      validateContactFields({
        name: "  Ada Lovelace  ",
        email: " ada@example.com ",
        message: "  This message is definitely long enough.  ",
      }),
    ).toEqual({});
  });
});

describe("submitContactMessage", () => {
  it("POSTs trimmed JSON to /api/contact and resolves the server copy", async () => {
    const fetcher = fetcherResponding(() =>
      jsonResponse({
        ok: true,
        message: "Thanks for reaching out! Your message has been received.",
      }),
    );

    const result = await submitContactMessage(
      { ...VALID_FIELDS, name: "  Ada Lovelace  " },
      fetcher,
    );

    expect(result).toEqual({
      ok: true,
      message: "Thanks for reaching out! Your message has been received.",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = (fetcher as FetchMock).mock.calls[0];
    expect(url).toBe("/api/contact");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Ada Lovelace", // trimmed
      email: "ada@example.com",
      subject: "Bug Report", // passed through — the sheet maps value→label
      message: "The glow effect flickers on Safari.",
    });
  });

  it("passes through the server-provided error on 4xx", async () => {
    const fetcher = fetcherResponding(() =>
      jsonResponse(
        { ok: false, error: "Please provide a valid email address." },
        400,
      ),
    );

    await expect(submitContactMessage(VALID_FIELDS, fetcher)).rejects.toThrow(
      "Please provide a valid email address.",
    );
  });

  it("uses the actionable fallback when a 429/5xx has no error payload", async () => {
    const fetcher = fetcherResponding(() => jsonResponse({ ok: false }, 429));
    await expect(submitContactMessage(VALID_FIELDS, fetcher)).rejects.toThrow(
      CONTACT_FAILED_MESSAGE,
    );
  });

  it("never leaks a SyntaxError when the API answers non-JSON", async () => {
    const fetcher = fetcherResponding(
      () =>
        new Response("<html>502 Bad Gateway</html>", {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }),
    );
    await expect(submitContactMessage(VALID_FIELDS, fetcher)).rejects.toThrow(
      CONTACT_FAILED_MESSAGE,
    );
  });

  it("maps network failure to the reachable-service message", async () => {
    const fetcher = fetcherResponding(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    );
    await expect(submitContactMessage(VALID_FIELDS, fetcher)).rejects.toThrow(
      CONTACT_UNREACHABLE_MESSAGE,
    );
  });

  it("treats a 2xx with ok:false as a failure", async () => {
    const fetcher = fetcherResponding(() =>
      jsonResponse({ ok: false, error: "Nope." }, 200),
    );
    await expect(submitContactMessage(VALID_FIELDS, fetcher)).rejects.toThrow(
      "Nope.",
    );
  });
});
