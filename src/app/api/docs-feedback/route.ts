import { NextResponse } from "next/server";
import { API_RATE_TIERS, guardApiWrite } from "@/lib/api-security";
import { db } from "@/lib/db";
import { getAllDocPages } from "@/lib/docs-sitemap";

/**
 * POST /api/docs-feedback — per-doc-page "Was this page helpful?" sink
 * (issue #127 / PF-014 acceptance #5).
 *
 * Hardened with the same guard as /api/contact (issue #159): same-origin
 * verification (403) + per-IP rate limit (429, 10/min — feedback bursts
 * are legitimate page-hopping, so a wider tier than contact's 5/min).
 * Fail-closed on both.
 */

const FEEDBACK_COMMENT_MAX = 1000;
const SLUG_MAX = 200;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

// Build the authoritative slug allowlist from the docs sitemap,
// normalized the same way as the client lib (no leading/trailing slashes).
const normalizeSlug = (s: string) => s.trim().replace(/^\/+|\/+$/g, "");
const KNOWN_DOC_SLUGS = new Set(
  getAllDocPages().map((p) => normalizeSlug(p.slug)),
);

export async function POST(req: Request) {
  const denied = guardApiWrite(req, {
    route: "docs-feedback",
    ...API_RATE_TIERS.ai,
  });
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => null)) as {
      slug?: unknown;
      helpful?: unknown;
      comment?: unknown;
    } | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 },
      );
    }

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim().replace(/^\/+|\/+$/g, "")
        : "";
    if (
      !slug ||
      slug.length > SLUG_MAX ||
      !SLUG_RE.test(slug) ||
      !KNOWN_DOC_SLUGS.has(slug)
    ) {
      return NextResponse.json(
        { ok: false, error: "Unknown documentation page." },
        { status: 400 },
      );
    }

    if (typeof body.helpful !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Feedback verdict (helpful) is required." },
        { status: 400 },
      );
    }

    let comment: string | undefined;
    if (body.comment != null) {
      if (typeof body.comment !== "string") {
        return NextResponse.json(
          { ok: false, error: "Comment must be a string." },
          { status: 400 },
        );
      }
      comment = body.comment.trim();
      if (comment.length === 0) {
        comment = undefined;
      } else if (comment.length > FEEDBACK_COMMENT_MAX) {
        return NextResponse.json(
          {
            ok: false,
            error: `Comment is too long (max ${FEEDBACK_COMMENT_MAX} characters).`,
          },
          { status: 400 },
        );
      }
    }

    await db.docsFeedback.create({
      data: { slug, helpful: body.helpful, comment },
    });

    return NextResponse.json({
      ok: true,
      message: "Thanks — your feedback helps us improve the docs.",
    });
  } catch {
    // Generic failure — no internals leak (repo error-handling standard).
    return NextResponse.json(
      { ok: false, error: "Failed to record feedback. Please try again." },
      { status: 500 },
    );
  }
}
