"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResendLinkForm } from "./reset-password-form";
import { useAuth } from "./auth-context";

/**
 * VerifyEmailForm — the /verify-email page body (audit F-08).
 *
 * Redeems the single-use token from the emailed link
 * (?token= via POST /api/auth/verify-email/confirm). On success the
 * user is routed home with a toast; the auth context is refreshed so
 * the user-menu banner clears immediately. A missing/expired token
 * degrades to the resend form (same no-enumeration copy).
 */
export function VerifyEmailForm({ token }: { token: string | null }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [state, setState] = useState<"verifying" | "ok" | "failed">(
    token ? "verifying" : "failed",
  );
  const [message, setMessage] = useState<string | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    if (!token || settled.current) return;
    settled.current = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null;
          setMessage(json?.error ?? "Invalid or expired email verification token");
          setState("failed");
          return;
        }
        setState("ok");
        // Refresh the client-side user so the verify banner clears.
        await refreshUser().catch(() => null);
        toast.success("Email verified — thanks! Your account is fully activated.");
        setTimeout(() => router.push("/"), 900);
      } catch {
        setMessage("Verification failed — please try again.");
        setState("failed");
      }
    })();
  }, [token, refreshUser, router]);

  if (state === "verifying") {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" />
        Verifying your email…
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="flex flex-col items-start gap-3" role="status">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
          <CheckCircle2 className="size-5 text-primary" />
          Email verified
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your email address is confirmed. Taking you back to the site…
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Continue to RoyCSS
        </Button>
      </div>
    );
  }

  return (
    <ResendLinkForm
      variant="verify"
      heading={message ?? "This link is missing its token"}
      body="Verification links are single-use and expire after 30
            minutes. Request a fresh one below and open it from your
            email."
    />
  );
}
