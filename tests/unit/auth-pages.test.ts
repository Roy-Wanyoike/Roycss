/**
 * Auth-action pages + flows — source contract (Task 7-b, audit F-08).
 *
 * /reset-password and /verify-email are the landing targets of the
 * emailed links (single-use, 30-minute tokens). This suite pins:
 *   1. both routes export descriptive metadata + noindex (token URLs
 *      must never be indexed), and render a default component;
 *   2. the login sheet's "Forgot password?" opens the REAL flow (no
 *      "coming soon" placeholder) and posts the no-enumeration copy;
 *   3. the user menu carries the dismissible verify-email banner with
 *      a resend action wired to /api/auth/verify-email;
 *   4. the logout proxy forwards the refresh cookie so the backend
 *      REVOKES the row (audit F-05) instead of only clearing cookies;
 *   5. the privacy page tells the truth about export + delete (audit
 *      F-13) — the API routes exist.
 *
 * Wire-ins are asserted at the source level — the components pull heavy
 * client trees (framer-motion, sheets, contexts) that don't belong in
 * a node-env unit test (same pattern as legal-pages.test.ts).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as resetPage from "@/app/reset-password/page";
import * as verifyPage from "@/app/verify-email/page";

const appRoot = resolve(__dirname, "../../src");

function readAppSource(rel: string): string {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

describe("auth-action pages: /reset-password", () => {
  it("exports descriptive metadata and stays out of search indexes", () => {
    const metadata = resetPage.metadata;
    expect(metadata?.title).toBeTruthy();
    expect(metadata?.title).toContain("RoyCSS");
    expect(metadata?.description).toBeTruthy();
    expect(metadata!.description!.length).toBeGreaterThan(40);
    expect(metadata!.robots).toEqual({ index: false, follow: false });
  });

  it("renders a default page component", () => {
    expect(typeof resetPage.default).toBe("function");
  });

  it("redeems the ?token= via POST /api/auth/reset-password", () => {
    const src = readAppSource("components/roycss/auth/reset-password-form.tsx");
    expect(src).toContain("/api/auth/reset-password");
    expect(src).toContain('JSON.stringify({ token, password })');
    // Failed tokens degrade to a resend form (not a dead end).
    expect(src).toContain("ResendLinkForm");
  });
});

describe("auth-action pages: /verify-email", () => {
  it("exports descriptive metadata and stays out of search indexes", () => {
    const metadata = verifyPage.metadata;
    expect(metadata?.title).toBeTruthy();
    expect(metadata?.title).toContain("RoyCSS");
    expect(metadata?.description).toBeTruthy();
    expect(metadata!.description!.length).toBeGreaterThan(40);
    expect(metadata!.robots).toEqual({ index: false, follow: false });
  });

  it("renders a default page component", () => {
    expect(typeof verifyPage.default).toBe("function");
  });

  it("redeems the ?token= via POST /api/auth/verify-email/confirm", () => {
    const src = readAppSource("components/roycss/auth/verify-email-form.tsx");
    expect(src).toContain("/api/auth/verify-email/confirm");
    expect(src).toContain('JSON.stringify({ token })');
  });
});

describe("login sheet: forgot-password flow (audit F-08)", () => {
  it("'Forgot password?' opens the real dialog — the placeholder toast is gone", () => {
    const src = readAppSource("components/roycss/auth/login-sheet.tsx");
    expect(src).not.toMatch(/coming soon/i);
    expect(src).toContain("ForgotPasswordDialog");
    expect(src).toContain('onClick={() => setForgotOpen(true)}');
  });

  it("posts to /api/auth/forgot-password with the no-enumeration confirmation", () => {
    const src = readAppSource("components/roycss/auth/login-sheet.tsx");
    expect(src).toContain('"/api/auth/forgot-password"');
    // Honest copy: conditional on the address having an account.
    expect(src).toMatch(/If that address has a RoyCSS account/i);
  });
});

describe("user menu: verify-email banner (audit F-08)", () => {
  it("shows a dismissible banner with a resend action when unverified", () => {
    const src = readAppSource("components/roycss/auth/user-menu.tsx");
    expect(src).toContain("emailVerified === false");
    expect(src).toContain("Dismiss verify-email reminder");
    expect(src).toContain("Resend link");
    expect(src).toContain("/api/auth/verify-email");
  });

  it("mobile menu carries the verify-email resend item", () => {
    const src = readAppSource("components/roycss/auth/user-menu.tsx");
    expect(src).toMatch(/Verify your email — resend link/);
  });
});

describe("auth proxy: logout revokes the server-side session (audit F-05)", () => {
  it("forwards the refresh cookie to the backend /logout before clearing", () => {
    const src = readAppSource("app/api/auth/logout/route.ts");
    expect(src).toContain("${BACKEND_AUTH_URL}/logout");
    expect(src).toContain("refreshToken");
    expect(src).toContain("c.delete(ACCESS_COOKIE)");
    expect(src).toContain("c.delete(REFRESH_COOKIE)");
  });

  it("the email-lifecycle proxies exist (forgot/reset/verify + confirm)", () => {
    const forgot = readAppSource("app/api/auth/forgot-password/route.ts");
    expect(forgot).toContain("${BACKEND_AUTH_URL}/forgot-password");
    const reset = readAppSource("app/api/auth/reset-password/route.ts");
    expect(reset).toContain("${BACKEND_AUTH_URL}/reset-password");
    const resend = readAppSource("app/api/auth/verify-email/route.ts");
    expect(resend).toContain("${BACKEND_AUTH_URL}/verify-email");
    const confirm = readAppSource("app/api/auth/verify-email/confirm/route.ts");
    expect(confirm).toContain("${BACKEND_AUTH_URL}/verify-email/confirm");
  });
});

describe("privacy page: export + delete truth (audit F-13)", () => {
  it("no longer claims self-serve export/delete are unbuilt", () => {
    const src = readAppSource("app/privacy/page.tsx");
    expect(src).not.toMatch(/not built yet/i);
    expect(src).toContain("GET /api/v1/auth/export");
    expect(src).toContain("DELETE /api/v1/auth/account");
  });
});
