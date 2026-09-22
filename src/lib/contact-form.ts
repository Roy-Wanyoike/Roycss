/**
 * Contact form — pure validation + submit logic for the "Get in Touch"
 * sheet (issue #162).
 *
 * Extracted from `components/roycss/contact-form.tsx` so the three
 * submit-handler branches (inline validation, success, API/network
 * failure) can be unit-tested with a mocked fetcher — no DOM needed.
 *
 * Error-message contract (client side only — the API route keeps its
 * own validation as source of truth):
 * - 4xx/5xx  → the server-provided `error` when present, otherwise a
 *              friendly actionable fallback.
 * - network  → `CONTACT_UNREACHABLE_MESSAGE` (fetch throws / rejects).
 * - non-JSON → friendly fallback (never a raw SyntaxError to the user).
 */

export interface ContactFields {
  name: string;
  email: string;
  /** Select value — mapped to the human label by the caller. */
  subject?: string;
  message: string;
}

/** Field-keyed inline errors, rendered with role="alert" by the sheet. */
export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "message", string>
>;

/** Shown when the request never completes (offline / network reset). */
export const CONTACT_UNREACHABLE_MESSAGE =
  "Couldn't reach the service — check your connection and try again.";

/** Shown when the API answers but without a usable error payload. */
export const CONTACT_FAILED_MESSAGE =
  "Couldn't send your message — please try again in a moment.";

/** Mirrors the server-side regex in `src/app/api/contact/route.ts`. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side mirror of the API validations (name ≥ 2, well-formed
 * email, message ≥ 10) so errors render inline + announced instead of
 * relying on native bubbles alone (issue #162).
 */
export function validateContactFields(
  fields: ContactFields,
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  if (fields.name.trim().length < 2) {
    errors.name = "Please enter your name (at least 2 characters).";
  }
  const email = fields.email.trim();
  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address, e.g. you@example.com.";
  }
  if (fields.message.trim().length < 10) {
    errors.message = "Please add a message (at least 10 characters).";
  }
  return errors;
}

/** Minimal fetch surface — `typeof fetch` shape, mockable in tests. */
export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Response | Promise<Response>;

/** Bound wrapper — a detached `window.fetch` throws in browsers. */
const globalFetch: FetchLike = (...args) => fetch(...args);

export interface ContactSubmitSuccess {
  ok: true;
  /** Server-provided confirmation copy, for the success toast. */
  message: string;
}

/**
 * POST the contact payload to `/api/contact` and normalize every
 * outcome into either a success object or a thrown `Error` whose
 * message is safe + actionable for a toast / inline panel.
 */
export async function submitContactMessage(
  fields: ContactFields,
  fetcher: FetchLike = globalFetch,
): Promise<ContactSubmitSuccess> {
  let res: Response;
  try {
    res = await fetcher("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fields.name.trim(),
        email: fields.email.trim(),
        subject: fields.subject?.trim() || "General Inquiry",
        message: fields.message.trim(),
      }),
    });
  } catch {
    // fetch rejects on network failure / offline / aborted request.
    throw new Error(CONTACT_UNREACHABLE_MESSAGE);
  }

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    message?: string;
  } | null;

  if (!res.ok || !data?.ok) {
    throw new Error(
      (typeof data?.error === "string" && data.error) || CONTACT_FAILED_MESSAGE,
    );
  }

  return {
    ok: true,
    message: data.message ?? "Message sent!",
  };
}
