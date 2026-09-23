/**
 * Contact service — persists contact messages via Prisma and
 * acknowledges them by email through the shared mailer seam (issue
 * #209: `.env.example` promised "contact form + auth emails"; the
 * contact half now actually sends — mock transport logs in dev, Resend
 * delivers when RESEND_API_KEY is set).
 *
 * Mirrors the logic in src/app/api/contact/route.ts but throws
 * AppError on failure so the centralized error middleware can format
 * the response consistently.
 */
import { db } from "../../lib/db.js";
import { createLogger } from "../../lib/logger.js";
import { getMailer } from "../email/mailer.js";
import { contactReceivedTemplate } from "../email/templates.js";
import { AppError } from "../../server/middleware/error.js";
import type { ContactInput } from "./schema.js";

const log = createLogger("contact");

/**
 * Persist a contact message and send the one-time confirmation email.
 * Throws:
 *   - AppError(400) if the input is invalid (handled by Zod middleware)
 *   - AppError(503) if the DB write fails — so the client knows to retry
 */
export async function submitContactMessage(
  input: ContactInput,
): Promise<{ id: string }> {
  let record: { id: string };
  try {
    record = await db.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject || "General Inquiry",
        message: input.message,
      },
      select: { id: true },
    });
  } catch (err) {
    log.error("Failed to persist contact message", {
      email: input.email,
      err: err instanceof Error ? err.message : String(err),
    });
    throw AppError.serviceUnavailable(
      "We couldn't save your message right now. Please try again later.",
      { retryable: true },
    );
  }

  log.info("Contact message saved", {
    id: record.id,
    email: input.email,
    subject: input.subject,
  });

  // Confirmation email — best-effort by contract (Mailer.send never
  // throws, but belt-and-braces: an email failure must never fail the
  // HTTP request that already persisted the message).
  try {
    await getMailer().send(
      contactReceivedTemplate({
        to: input.email,
        name: input.name,
        subject: input.subject || "General Inquiry",
      }),
    );
  } catch (err) {
    log.error("Contact confirmation email failed (message was saved)", {
      id: record.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  return { id: record.id };
}
