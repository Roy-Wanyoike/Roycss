"use client";

import { useCallback, useState } from "react";
import { LogOut, MailWarning, User as UserIcon, UserPlus, LogIn, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./auth-context";
import { useAuthSheetStore } from "./auth-sheet-store";
import { toast } from "sonner";

/**
 * sessionStorage key for the dismissible verify-email banner. Keyed by
 * user id so switching accounts re-shows it; session-scoped so it comes
 * back on the next visit (verification still pending, still worth a
 * nudge) instead of being suppressed forever.
 */
const verifyBannerKey = (userId: string) => `roycss-verify-banner:${userId}`;

/**
 * Resend the verification email (PF-011 grace-mode banner action).
 * Same no-enumeration toast for every outcome — the endpoint answers
 * 200 whether or not the address is registered/unverified.
 */
async function resendVerification(email: string): Promise<void> {
  try {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      toast.error("Couldn't send the email right now — please try again later.");
      return;
    }
    toast.info("If that address has an unverified RoyCSS account, a verification link is on its way.");
  } catch {
    toast.error("Couldn't send the email right now — please try again later.");
  }
}

/** Desktop navbar cluster — Sign in / Create account OR avatar menu (+ verify banner). */
export function UserMenu() {
  const { user, loading, logout, refreshUser } = useAuth();
  const { openLogin, openRegister } = useAuthSheetStore();
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const unverified =
    user !== null && user.emailVerified === false && !dismissed &&
    !(typeof window !== "undefined" &&
      window.sessionStorage.getItem(verifyBannerKey(user.id)) === "1");

  const dismissBanner = useCallback(() => {
    if (user) window.sessionStorage.setItem(verifyBannerKey(user.id), "1");
    setDismissed(true);
  }, [user]);

  if (loading) {
    return <div className="size-9 rounded-full bg-muted animate-pulse" aria-hidden />;
  }
  if (!user) {
    return (
      /* Audit F-07: was `hidden xl:flex` — at 1024–1279px the hamburger is
       * gone (lg:) but sign-in was still invisible (xl:) → no way to create
       * an account on common laptops. Render from lg; icon-only under xl. */
      <div className="hidden lg:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs"
          onClick={openLogin}
        >
          <LogIn className="size-3.5" />
          <span className="hidden xl:inline">Sign in</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs"
          onClick={openRegister}
        >
          <UserPlus className="size-3.5" />
          <span className="hidden xl:inline">Create account</span>
        </Button>
      </div>
    );
  }
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
  return (
    <div className="hidden lg:flex items-center gap-2">
      {/* Verify-email banner (PF-011 / audit F-08) — dismissible, with a
          resend action. Only shows while the account is unverified. */}
      {unverified && (
        <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs text-primary">
          <MailWarning className="size-3.5 shrink-0" aria-hidden />
          <span className="whitespace-nowrap font-medium">Verify your email</span>
          <button
            type="button"
            disabled={resending}
            onClick={async () => {
              setResending(true);
              try {
                await resendVerification(user.email);
                await refreshUser().catch(() => null);
              } finally {
                setResending(false);
              }
            }}
            className="font-medium underline underline-offset-2 hover:decoration-2 disabled:opacity-60 cursor-pointer"
          >
            {resending ? "Sending…" : "Resend link"}
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss verify-email reminder"
            className="rounded-full p-0.5 hover:bg-primary/15 transition-colors cursor-pointer"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full size-9 ring-1 ring-border hover:ring-primary/40 transition-all cursor-pointer"
            aria-label="Account menu"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium truncate">{user.name ?? "RoyCSS user"}</span>
            <span className="text-xs text-muted-foreground font-normal truncate">{user.email}</span>
            {user.emailVerified === false && (
              <span className="text-xs font-medium text-primary">
                Email not verified — check your inbox
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={async () => {
              await logout();
              toast.success("Signed out");
            }}
          >
            <LogOut className="size-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Mobile hamburger menu item — single button that opens LoginSheet or signs out (+ verify nudge). */
export function MobileAuthMenuItem() {
  const { user, loading, logout } = useAuth();
  const { openLogin } = useAuthSheetStore();
  if (loading) return null;
  if (!user) {
    return (
      <button
        onClick={openLogin}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer min-h-[44px]"
      >
        Sign in / Create account
        <UserIcon className="size-3.5" />
      </button>
    );
  }
  return (
    <div className="space-y-1">
      {user.emailVerified === false && (
        <button
          onClick={() => void resendVerification(user.email)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[44px]"
        >
          Verify your email — resend link
          <MailWarning className="size-3.5" />
        </button>
      )}
      <button
        onClick={async () => { await logout(); toast.success("Signed out"); }}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all cursor-pointer min-h-[44px]"
      >
        Sign out ({user.email})
        <LogOut className="size-3.5" />
      </button>
    </div>
  );
}
