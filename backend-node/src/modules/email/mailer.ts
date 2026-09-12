/**
 * Mailer — transactional email transport (PF-011 / audit F-02).
 *
 * TWO transports behind ONE interface, selected by environment:
 *
 *   - MockMailer (DEFAULT, no env needed): logs the email (subject +
 *     the action link) via the module logger. Keeps every auth flow
 *     fully functional in dev/test — the link is in the logs, no
 *     network, no dependency, no cost.
 *   - ResendMailer (activated by RESEND_API_KEY): plain `fetch` against
 *     https://api.resend.com/emails — NO npm dependency, no SDK. If the
 *     API call fails the error is logged and swallowed: an email
 *     transport outage must never fail the HTTP request that triggered
 *     it (the user can always request another link).
 *
 * The seam mirrors `setRateLimiter()` (server/middleware/rateLimit.ts):
 * `setMailer()` lets tests capture messages without touching global
 * state, and a future SMTP/SES transport can be swapped in without
 * touching call sites.
 *
 * This module is service-only (no routes.ts) — like `modules/api-keys`,
 * it exists to serve the auth module's lifecycle endpoints.
 */
import { env } from "../../config/env.js";
import { createLogger } from "../../lib/logger.js";
import type { EmailMessage } from "./templates.js";

const log = createLogger("email");

export interface Mailer {
  /** Transport name — "mock" | "resend" (diagnostics + tests). */
  readonly transport: "mock" | "resend";
  /** Send one message. MUST NOT throw on transport failure. */
  send(message: EmailMessage): Promise<void>;
}

// ─── Mock transport (default) ──────────────────────────────────────────────

export class MockMailer implements Mailer {
  readonly transport = "mock" as const;

  async send(message: EmailMessage): Promise<void> {
    // The FIRST url in the text body is the action link — surface it
    // unescaped at the top so `bun run dev` users can click it straight
    // from the terminal output.
    const link = /https?:\/\/\S+/.exec(message.text)?.[0];
    log.info("Email sent (mock transport — not delivered)", {
      transport: this.transport,
      to: message.to,
      subject: message.subject,
      link,
    });
  }
}

// ─── Resend transport (RESEND_API_KEY) ────────────────────────────────────

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export class ResendMailer implements Mailer {
  readonly transport = "resend" as const;
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        // Email is best-effort: don't let a slow API stall the request.
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        log.error("Resend API rejected the email", {
          status: res.status,
          to: message.to,
          subject: message.subject,
          body: body.slice(0, 500),
        });
      }
    } catch (err) {
      log.error("Resend transport failure (email dropped, request kept)", {
        to: message.to,
        subject: message.subject,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ─── Selection + test seam ─────────────────────────────────────────────────

let activeMailer: Mailer | null = null;

/**
 * The active mailer: Resend when RESEND_API_KEY is set, mock otherwise.
 * Lazy so the env loader (and its process.exit on bad config) runs at
 * first use, not at import time.
 */
export function getMailer(): Mailer {
  if (activeMailer === null) {
    activeMailer = env.RESEND_API_KEY
      ? new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM)
      : new MockMailer();
  }
  return activeMailer;
}

/** Swap the mailer (tests capture messages here — never in prod code). */
export function setMailer(mailer: Mailer): void {
  activeMailer = mailer;
}

/** Test-only: restore environment-derived selection. */
export function _resetMailerForTest(): void {
  activeMailer = null;
}
