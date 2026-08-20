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

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(name: string, email: string, password: string, confirm: string): FieldErrors {
  const errs: FieldErrors = {};
  if (name.trim().length < 2) errs.name = "Name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
  if (password.length < 8) errs.password = "Password must be at least 8 characters";
  if (password !== confirm) errs.confirm = "Passwords do not match";
  return errs;
}

export function RegisterSheet() {
  const { register } = useAuth();
  const { registerOpen, openLogin, closeAll } = useAuthSheetStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(name, email, password, confirm);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const u = await register(name.trim(), email.trim(), password);
      toast.success(`Welcome to RoyCSS, ${u.name ?? u.email}!`);
      closeAll();
      setName(""); setEmail(""); setPassword(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldErr = (k: keyof FieldErrors) =>
    fieldErrors[k] ? <p className="text-xs text-destructive mt-1">{fieldErrors[k]}</p> : null;

  return (
    <Sheet open={registerOpen} onOpenChange={(o) => { if (!o) closeAll(); }}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create your RoyCSS account</SheetTitle>
          <SheetDescription>
            Free forever. Save collections, sync favorites, unlock pro tools.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Name</Label>
            <Input
              id="reg-name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
            {fieldErr("name")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            {fieldErr("email")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            {fieldErr("password")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">Confirm password</Label>
            <Input
              id="reg-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
            />
            {fieldErr("confirm")}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <SheetFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {submitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={openLogin}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                Sign in
              </button>
            </p>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
