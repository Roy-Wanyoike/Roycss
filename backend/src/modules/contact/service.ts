/**
 * Contact service — persists contact messages via Prisma.
 *
 * Mirrors the logic in src/app/api/contact/route.ts but throws
 * AppError on failure so the centralized error middleware can format
 * the response consistently.
 */
import { db } from "../../lib/db.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type { ContactInput } from "./schema.js";

const log = createLogger("contact");

/**
 * Persist a contact message.
 * Throws:
 *   - AppError(400) if the input is invalid (handled by Zod middleware)
 *   - AppError(503) if the DB write fails — so the client knows to retry
 */
export async function submitContactMessage(
  input: ContactInput,
): Promise<{ id: string }> {
  try {
    const record = await db.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject || "General Inquiry",
        message: input.message,
      },
      select: { id: true },
    });

    log.info("Contact message saved", {
      id: record.id,
      email: input.email,
      subject: input.subject,
    });

    return { id: record.id };
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
}
