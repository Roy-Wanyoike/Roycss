"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-context";
import { useAuthSheetStore } from "./auth-sheet-store";

export function LoginSheet() {
  const { login } = useAuth();
  const { loginOpen, openRegister, closeAll } = useAuthSheetStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            onClick={() => toast.info("Password reset is coming soon — email hi@roycss.com for now.")}
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
    </Sheet>
  );
}
