/**
 * Unit tests — email module (PF-011 / audit F-02): transports + templates.
 *
 *   MockMailer   — never throws, transport tag "mock"
 *   ResendMailer — fetch to https://api.resend.com/emails with the Bearer
 *                  key; transport failures are SWALLOWED (an email outage
 *                  must never fail the HTTP request that triggered it)
 *   setMailer    — the injection seam the integration suite relies on
 *   templates    — subject/recipients/action URL + HTML escaping of
 *                  user-controlled names
 */
import { describe, it, expect, vi, afterEach } from "vitest";

import {
  MockMailer,
  ResendMailer,
  getMailer,
  setMailer,
  _resetMailerForTest,
} from "../../src/modules/email/mailer.js";
import {
  resetPasswordTemplate,
  verifyEmailTemplate,
  type EmailMessage,
} from "../../src/modules/email/templates.js";

const MSG: EmailMessage = {
  to: "user@example.com",
  subject: "Test subject",
  text: "Hello\nhttps://example.com/act?token=abc",
  html: "<p>Hello</p>",
};

afterEach(() => {
  _resetMailerForTest();
  vi.unstubAllGlobals();
});

describe("MockMailer", () => {
  it("1. sends without throwing and tags itself as the mock transport", async () => {
    const mailer = new MockMailer();
    expect(mailer.transport).toBe("mock");
    await expect(mailer.send(MSG)).resolves.toBeUndefined();
  });
});

describe("ResendMailer (fetch-based, no SDK)", () => {
  it("2. posts to the Resend API with the Bearer key + message fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{\"id\":\"email-1\"}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const mailer = new ResendMailer("re_test_key", "RoyCSS <test@resend.dev>");
    await mailer.send(MSG);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer re_test_key",
    );
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.from).toBe("RoyCSS <test@resend.dev>");
    expect(body.to).toEqual(["user@example.com"]);
    expect(body.subject).toBe("Test subject");
    expect(body.text).toContain("token=abc");
  });

  it("3. an API error response is swallowed (logged, never thrown)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 422 })),
    );
    const mailer = new ResendMailer("re_test_key", "RoyCSS <test@resend.dev>");
    await expect(mailer.send(MSG)).resolves.toBeUndefined();
  });

  it("4. a network failure is swallowed (logged, never thrown)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const mailer = new ResendMailer("re_test_key", "RoyCSS <test@resend.dev>");
    await expect(mailer.send(MSG)).resolves.toBeUndefined();
  });
});

describe("mailer selection seam", () => {
  it("5. setMailer overrides getMailer (the integration-suite capture path)", async () => {
    const sent: EmailMessage[] = [];
    setMailer({
      transport: "mock",
      async send(m): Promise<void> {
        sent.push(m);
      },
    });
    const active = getMailer();
    expect(active.transport).toBe("mock");
    await active.send(MSG);
    expect(sent).toEqual([MSG]);

    // Reset restores env-derived selection (mock — no RESEND_API_KEY in tests).
    delete process.env.RESEND_API_KEY; // hermetic: ambient key must not leak in
    _resetMailerForTest();
    expect(getMailer().transport).toBe("mock");
  });
});

describe("templates", () => {
  it("6. verifyEmailTemplate — carries the action URL in text + html", () => {
    const msg = verifyEmailTemplate({
      to: "alice@example.com",
      name: "Alice",
      verifyUrl: "http://localhost:3000/verify-email?token=abc123",
      expiresInLabel: "30 minutes",
    });
    expect(msg.to).toBe("alice@example.com");
    expect(msg.subject).toMatch(/verify your roycss email/i);
    expect(msg.text).toContain("http://localhost:3000/verify-email?token=abc123");
    expect(msg.text).toContain("30 minutes");
    expect(msg.html).toContain('href="http://localhost:3000/verify-email?token=abc123"');
    // Greeting uses the display name when present.
    expect(msg.html).toContain("Hi Alice");
  });

  it("7. resetPasswordTemplate — carries the action URL + session-revocation note", () => {
    const msg = resetPasswordTemplate({
      to: "bob@example.com",
      name: null,
      resetUrl: "http://localhost:3000/reset-password?token=def456",
      expiresInLabel: "30 minutes",
    });
    expect(msg.subject).toMatch(/reset your roycss password/i);
    expect(msg.text).toContain("http://localhost:3000/reset-password?token=def456");
    expect(msg.text).toMatch(/signs out all your sessions/i);
    expect(msg.html).toContain("Hi bob"); // falls back to the local part
  });

  it("8. user-controlled names are HTML-escaped before interpolation", () => {
    const msg = verifyEmailTemplate({
      to: "eve@example.com",
      name: 'Eve <img src=x onerror="alert(1)">',
      verifyUrl: "https://roycss.example/verify-email?token=000",
      expiresInLabel: "30 minutes",
    });
    expect(msg.html).not.toContain("<img src=x");
    expect(msg.html).toContain("&lt;img src=x");
  });
});
