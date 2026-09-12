import type { Metadata } from "next";
import { AuthActionShell } from "@/components/roycss/auth/auth-action-shell";
import { ResetPasswordForm } from "@/components/roycss/auth/reset-password-form";

/**
 * /reset-password — the landing target of the emailed password-reset
 * link (audit F-08). The single-use 30-minute token arrives as ?token=
 * and is redeemed by POST /api/auth/reset-password; on success the
 * user is routed home with the login sheet open (the backend revokes
 * every session on reset, so a fresh sign-in is required).
 *
 * Server component wrapper: reads the token from searchParams and
 * hands it to the client form (the interactive island). Dynamic by
 * nature — no build-time prerender for a token-bearing URL.
 */
export const metadata: Metadata = {
  title: "Reset your password — RoyCSS",
  description:
    "Set a new RoyCSS password using the single-use link from your email. Links expire after 30 minutes.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthActionShell
      title="Reset your password"
      lead="Pick a new password for your RoyCSS account. For your security, reset links work only once and expire after 30 minutes."
    >
      <ResetPasswordForm token={token ?? null} />
    </AuthActionShell>
  );
}
