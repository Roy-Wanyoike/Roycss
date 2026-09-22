"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authRequest } from "@/lib/auth-request";
import { useAuth } from "./auth-context";
import { useAuthSheetStore } from "./auth-sheet-store";

/**
 * Forgot-password dialog — opened from the login sheet's "Forgot
 * password?" link (audit F-08). Collects an email, POSTs
 * /api/auth/forgot-password, and shows the SAME honest confirmation for
 * any address (no user enumeration): "If that address has a RoyCSS
 * account, a password-reset link is on its way."
 */
function ForgotPasswordDialog({
  open,
  onOpenChange,
  prefillEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillEmail: string;
}) {
  const [email, setEmail] = useState(prefillEmail);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const close = () => {
    onOpenChange(false);
    // Reset for the next open (the confirmation state is one-shot).
    setTimeout(() => setSent(false), 150);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      // Bounded request (issue #163) — rejects with a safe actionable
      // message on timeout / network failure instead of hanging.
      const res = await authRequest("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      // The endpoint answers 200 for ANY address (no enumeration) —
      // only transport errors can make it throw here.
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="w-full sm:max-w-md">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MailCheck className="size-4 text-primary" />
                Check your inbox
              </DialogTitle>
              <DialogDescription>
                If that address has a RoyCSS account, a password-reset link
                is on its way. It expires in 30 minutes and can be used
                only once.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={close} className="w-full">Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>
                Enter the email you signed up with and we&apos;ll send a
                reset link. The link expires in 30 minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={submitting || !email.trim()}>
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LoginSheet() {
  const { login } = useAuth();
  const { loginOpen, openRegister, closeAll } = useAuthSheetStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name ?? u.email}!`);
      closeAll();
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={loginOpen} onOpenChange={(o) => { if (!o) closeAll(); }}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Sign in to RoyCSS</SheetTitle>
          <SheetDescription>
            Sign in to save collections, sync favorites across devices, and unlock pro tools.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
          <SheetFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={openRegister}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                Create one
              </button>
            </p>
          </SheetFooter>
        </form>
      </SheetContent>
      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        prefillEmail={email}
      />
    </Sheet>
  );
}
