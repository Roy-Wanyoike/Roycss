/**
 * Zod schema for the contact form.
 *
 * Mirrors the validation rules in src/app/api/contact/route.ts so the
 * backend accepts the same shape as the existing Next.js API route.
 */
import { z } from "zod";

import { CONTACT_LIMITS } from "../../config/constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(CONTACT_LIMITS.name, `Name must be at most ${CONTACT_LIMITS.name} characters`),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(CONTACT_LIMITS.email, `Email must be at most ${CONTACT_LIMITS.email} characters`)
    .regex(EMAIL_RE, "Please provide a valid email address"),
  subject: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.subject, `Subject must be at most ${CONTACT_LIMITS.subject} characters`)
    .default("General Inquiry"),
  message: z
    .string()
    .trim()
    .min(
      CONTACT_LIMITS.messageMin,
      `Message must be at least ${CONTACT_LIMITS.messageMin} characters long`,
    )
    .max(CONTACT_LIMITS.message, `Message must be at most ${CONTACT_LIMITS.message} characters`),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

/** Response shape returned by POST /contact. */
export interface ContactResponse {
  ok: true;
  message: string;
  id: string;
}
