"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthSheetStore } from "./auth-sheet-store";

/**
 * ResetPasswordForm — the /reset-password page body (audit F-08).
 *
 * Reads the single-use token from the emailed link (passed in by the
 * server page from ?token=), collects a new password, and POSTs
 * /api/auth/reset-password. On success: a toast, the login sheet is
 * pre-opened, and the user is routed home to sign in (the backend
 * revokes every session on reset — audit F-05 — so a fresh sign-in is
 * REQUIRED, not just polite).
 *
 * A missing/failed token degrades to a "request a new link" resend
 * form — the same honest no-enumeration copy as the forgot-password
 * dialog.
 */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const openLogin = useAuthSheetStore((s) => s.openLogin);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Password reset failed");
      }
      // Success — every existing session was revoked server-side, so a
      // fresh sign-in is required. Route home with the login sheet open.
      toast.success("Password updated — sign in with your new password.");
      openLogin();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <ResendLinkForm
        variant="reset"
        heading="This link is missing its token"
        body="Reset links carry a single-use token in the URL — open the
              link from your email exactly as it was sent, or request a
              new one below."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters, with a letter and a number.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password-confirm">Confirm new password</Label>
        <Input
          id="new-password-confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={submitting}
        />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {error && /invalid or expired/i.test(error) && (
        <ResendLinkForm
          variant="reset"
          compact
          heading="Link not working?"
          body="Reset links expire after 30 minutes and work only once —
                request a fresh one below."
        />
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
        {submitting ? "Updating..." : "Set new password"}
      </Button>
    </form>
  );
}

/**
 * ResendLinkForm — the shared "request a new link" fallback for the
 * reset-password and verify-email pages (variant picks the endpoint +
 * copy). Same no-enumeration confirmation as the dialogs.
 */
export function ResendLinkForm({
  variant,
  heading,
  body,
  compact = false,
}: {
  variant: "reset" | "verify";
  heading: string;
  body: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        variant === "reset" ? "/api/auth/forgot-password" : "/api/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Something went wrong — please try again.");
      }
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={compact ? "mt-2 rounded-xl border border-border/60 p-4" : "space-y-4"}>
      <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {sent ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          If that address has {variant === "reset" ? "a RoyCSS account" : "an unverified RoyCSS account"},
          a {variant === "reset" ? "password-reset" : "verification"} link is on its way.
          It expires in 30 minutes.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
          <Label htmlFor={`resend-${variant}-email`} className="sr-only">
            Email
          </Label>
          <Input
            id={`resend-${variant}-email`}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
          <Button type="submit" variant="outline" disabled={submitting || !email.trim()}>
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {submitting ? "Sending..." : "Send a new link"}
          </Button>
        </form>
      )}
    </div>
  );
}
