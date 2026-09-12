import type { Metadata } from "next";
import { AuthActionShell } from "@/components/roycss/auth/auth-action-shell";
import { VerifyEmailForm } from "@/components/roycss/auth/verify-email-form";

/**
 * /verify-email — the landing target of the emailed verification link
 * (PF-011 / audit F-02). The single-use 30-minute token arrives as
 * ?token= and is redeemed by POST /api/auth/verify-email/confirm.
 *
 * Server component wrapper: reads the token from searchParams and
 * hands it to the client form (the interactive island).
 */
export const metadata: Metadata = {
  title: "Verify your email — RoyCSS",
  description:
    "Confirm your RoyCSS email address using the single-use link from your inbox. Links expire after 30 minutes.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthActionShell
      title="Verify your email"
      lead="Confirming your address unlocks your full RoyCSS account and lets us reach you for account security."
    >
      <VerifyEmailForm token={token ?? null} />
    </AuthActionShell>
  );
}
