/**
 * Docs feedback — pure validation + submit logic for the per-page
 * "Was this page helpful?" widget (issue #127 / PF-014 acceptance #5).
 *
 * Extracted from `components/docs/feedback.tsx` so the submit-handler
 * branches (validation, success, API/network failure) can be unit-tested
 * with a mocked fetcher — no DOM needed. Mirrors the pattern of
 * `src/lib/contact-form.ts` (issue #162).
 *
 * Error-message contract (client side only — the API route keeps its
 * own validation as source of truth):
 * - 4xx/5xx  → the server-provided `error` when present, otherwise a
 *              friendly actionable fallback.
 * - network  → `DOCS_FEEDBACK_UNREACHABLE_MESSAGE` (fetch throws/rejects).
 * - non-JSON → friendly fallback (never a raw SyntaxError to the user).
 */

/** Valid doc-page slug — must exist in the docs sitemap (`/docs/<slug>`). */
export type DocsFeedbackFields = {
  slug: string;
  helpful: boolean;
  comment?: string;
};

/** Shown when the request never completes (offline / network reset). */
export const DOCS_FEEDBACK_UNREACHABLE_MESSAGE =
  "Couldn't reach the service — check your connection and try again.";

/** Shown when the API answers but without a usable error payload. */
export const DOCS_FEEDBACK_FAILED_MESSAGE =
  "Couldn't send your feedback — please try again in a moment.";

/** Mirrors the server-side caps in `src/app/api/docs-feedback/route.ts`. */
export const DOCS_FEEDBACK_COMMENT_MAX = 1000;

/** Mirrors the server-side slug rule in the API route. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

/**
 * Client-side mirror of the API validations so obviously-invalid
 * submissions never hit the network. Returns field-keyed errors.
 */
export function validateDocsFeedback(
  fields: DocsFeedbackFields,
): Partial<Record<"slug" | "comment", string>> {
  const errors: Partial<Record<"slug" | "comment", string>> = {};
  const slug = fields.slug.trim().replace(/^\/+|\/+$/g, "");
  if (!slug || slug.length > 200 || !SLUG_RE.test(slug)) {
    errors.slug = "Invalid page reference.";
  }
  if (fields.comment != null && fields.comment.length > DOCS_FEEDBACK_COMMENT_MAX) {
    errors.comment = `Comment is too long (max ${DOCS_FEEDBACK_COMMENT_MAX} characters).`;
  }
  return errors;
}

/** Minimal fetch surface — mockable in tests. */
export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Response | Promise<Response>;

/** Bound wrapper — a detached `window.fetch` throws in browsers. */
const globalFetch: FetchLike = (...args) => fetch(...args);

export interface DocsFeedbackSuccess {
  ok: true;
  /** Server-provided confirmation copy, for the thank-you state. */
  message: string;
}

/**
 * POST the feedback payload to `/api/docs-feedback` and normalize every
 * outcome into either a success object or a thrown `Error` whose message
 * is safe + actionable for inline UI.
 */
export async function submitDocsFeedback(
  fields: DocsFeedbackFields,
  fetcher: FetchLike = globalFetch,
): Promise<DocsFeedbackSuccess> {
  let res: Response;
  try {
    res = await fetcher("/api/docs-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: fields.slug.trim().replace(/^\/+|\/+$/g, ""),
        helpful: fields.helpful,
        comment: fields.comment?.trim() || undefined,
      }),
    });
  } catch {
    throw new Error(DOCS_FEEDBACK_UNREACHABLE_MESSAGE);
  }

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    message?: string;
  } | null;

  if (!res.ok || !data?.ok) {
    throw new Error(
      (typeof data?.error === "string" && data.error) ||
        DOCS_FEEDBACK_FAILED_MESSAGE,
    );
  }

  return {
    ok: true,
    message: data.message ?? "Thanks for your feedback!",
  };
}
