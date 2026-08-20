"use client";

import { LogOut, User as UserIcon, UserPlus, LogIn } from "lucide-react";
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

/** Desktop navbar cluster — Sign in / Create account OR avatar menu. */
export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const { openLogin, openRegister } = useAuthSheetStore();

  if (loading) {
    return <div className="size-9 rounded-full bg-muted animate-pulse" aria-hidden />;
  }
  if (!user) {
    return (
      <div className="hidden xl:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs"
          onClick={openLogin}
        >
          <LogIn className="size-3.5 mr-1.5" />
          Sign in
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs"
          onClick={openRegister}
        >
          <UserPlus className="size-3.5 mr-1.5" />
          Create account
        </Button>
      </div>
    );
  }
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
  return (
    <div className="hidden xl:flex">
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

/** Mobile hamburger menu item — single button that opens LoginSheet or signs out. */
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
    <button
      onClick={async () => { await logout(); toast.success("Signed out"); }}
      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all cursor-pointer min-h-[44px]"
    >
      Sign out ({user.email})
      <LogOut className="size-3.5" />
    </button>
  );
}
