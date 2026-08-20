"use client";

import { LoginSheet } from "./login-sheet";
import { RegisterSheet } from "./register-sheet";

/**
 * AuthSheets — mounts both LoginSheet and RegisterSheet at the page
 * root so any component can open them via the auth-sheet-store.
 */
export function AuthSheets() {
  return (
    <>
      <LoginSheet />
      <RegisterSheet />
    </>
  );
}
