/**
 * API-key management UI (issue #122 / PRD-F21) — source-contract tests,
 * following tests/unit/pricing-honesty.test.ts patterns.
 *
 * The components pull heavy client trees (radix, sonner, zustand) that
 * don't belong in a node-env unit test; behavior is covered by the e2e
 * suite. What IS pinned here:
 *   1. the "API Keys" entry point renders only for authenticated sessions,
 *      and the sheet refuses to fetch for anonymous sessions;
 *   2. the create flow POSTs the real payload shape ({ name, scopes }) to
 *      the real endpoint path (auth/api-keys → /api/v1/auth/api-keys, the
 *      route the backend registers) THROUGH the api-client seam;
 *   3. the scope picker mirrors the backend's API_KEY_SCOPES exactly
 *      (drift guard — unknown scopes are a 400);
 *   4. revoke is guarded by an AlertDialog confirmation (favorites
 *      clear-all pattern) and the list only ever shows masked keys;
 *   5. the ONE-TIME reveal carries the "shown only once / cannot be
 *      recovered" warning plus a copy affordance;
 *   6. no direct fetch bypasses the api seam, and the gateway seam
 *      promotes the session cookie to the Bearer credential;
 *   7. the UI copy states the backend's REAL limits (50 active keys,
 *      10/min management actions, 120 requests/min per key in use).
 *
 * Behavioral (not source): the pure cookie→Bearer helpers in
 * src/lib/session-bearer.ts used by the gateway.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  accessCookieValue,
  cookieValue,
  refreshCookieValue,
} from "@/lib/session-bearer";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-client";

const appRoot = resolve(__dirname, "../../src");
const repoRoot = resolve(__dirname, "../..");

function readAppSource(rel: string): string {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

/** Every TS/TSX source file in a component directory. */
function readDirSources(rel: string): Record<string, string> {
  const dir = resolve(appRoot, rel);
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".ts") || f.endsWith(".tsx")) {
      out[f] = readFileSync(resolve(dir, f), "utf8");
    }
  }
  return out;
}

/** Extract a `const NAME = [ "a", "b" ] as const` string array from source. */
function extractConstStringArray(source: string, name: string): string[] {
  const re = new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`);
  const m = re.exec(source);
  expect(m, `marker "${name}" must exist`).not.toBeNull();
  return (m![1]!.match(/"([^"]+)"/g) ?? []).map((s) => s.slice(1, -1));
}

describe("API-key UI: entry point for authenticated sessions only", () => {
  const menuSrc = readAppSource("components/roycss/auth/user-menu.tsx");

  it("exposes “API Keys” from the account menus (desktop + mobile)", () => {
    expect(menuSrc).toContain("API Keys");
    expect(menuSrc).toContain("useApiKeysSheetStore");
    expect(menuSrc).toMatch(/openApiKeysSheet/);
    // Both the desktop dropdown item and the mobile authed menu item exist.
    expect(menuSrc.match(/onClick=\{openApiKeysSheet\}/g)?.length).toBe(2);
  });

  it("renders the entry only AFTER the anonymous early-return (authed-only)", () => {
    // The desktop branch returns sign-in buttons when !user; the API Keys
    // item must live below that guard.
    const anonReturn = menuSrc.indexOf("if (!user)");
    const apiKeysItem = menuSrc.indexOf("API Keys");
    expect(anonReturn).toBeGreaterThan(-1);
    expect(apiKeysItem).toBeGreaterThan(anonReturn);
  });

  it("mounts the sheet once at the page root alongside AuthSheets", () => {
    const pageSrc = readAppSource("components/roycss/roycss-page.tsx");
    expect(pageSrc).toContain("ApiKeysSheet");
    const authIdx = pageSrc.indexOf("<AuthSheets />");
    const keysIdx = pageSrc.indexOf("<ApiKeysSheet />");
    expect(authIdx).toBeGreaterThan(-1);
    expect(keysIdx).toBeGreaterThan(authIdx);
  });

  it("the sheet never fetches for anonymous sessions (defense in depth)", () => {
    const sheetSrc = readAppSource(
      "components/roycss/api-keys/api-keys-sheet.tsx",
    );
    expect(sheetSrc).toContain("open && !!user");
    expect(sheetSrc).toContain("Sign in to manage API keys");
  });
});

describe("API-key UI: create/revoke hit the real endpoints via the seam", () => {
  const hookSrc = readAppSource("components/roycss/api-keys/use-api-keys.ts");

  it("targets the real backend route (auth/api-keys through /api/v1)", () => {
    expect(hookSrc).toContain('API_KEYS_ENDPOINT = "auth/api-keys"');
    // The seam prefixes /api/v1/ — together: /api/v1/auth/api-keys.
    const clientSrc = readAppSource("lib/api-client.ts");
    expect(clientSrc).toContain("`/api/v1/${path}`");
    // …and the backend really registers those routes on the auth router.
    const backendRoutes = readFileSync(
      resolve(repoRoot, "backend-node/src/modules/auth/routes.ts"),
      "utf8",
    );
    expect(backendRoutes).toContain('"/api-keys"');
    expect(backendRoutes).toContain('"/api-keys/:id"');
  });

  it("creates with the real payload shape ({ name, scopes }) via POST", () => {
    expect(hookSrc).toContain("method: \"POST\"");
    expect(hookSrc).toContain("body: JSON.stringify({ name, scopes })");
  });

  it("revokes by id via DELETE on the sub-resource path", () => {
    expect(hookSrc).toContain("`${API_KEYS_ENDPOINT}/${id}`");
    expect(hookSrc).toContain("method: \"DELETE\"");
  });

  it("scope picker mirrors the backend's API_KEY_SCOPES (drift guard)", () => {
    const backend = readFileSync(
      resolve(repoRoot, "backend-node/src/lib/api-key.ts"),
      "utf8",
    );
    const backendScopes = extractConstStringArray(backend, "API_KEY_SCOPES");
    const frontendScopes = extractConstStringArray(
      hookSrc,
      "API_KEY_SCOPES",
    );
    expect(frontendScopes).toEqual(backendScopes);
    // The least-privilege default matches the backend's Zod default.
    expect(hookSrc).toContain('DEFAULT_API_KEY_SCOPES: ApiKeyScope[] = ["effects:read"]');
  });

  it("honors the backend's real limits in code constants", () => {
    expect(hookSrc).toContain("MAX_ACTIVE_KEYS_PER_OWNER = 50");
    expect(hookSrc).toContain("API_KEY_NAME_MAX_LENGTH = 120");
  });
});

describe("API-key UI: revoke confirmation + masked-only listing", () => {
  const sheetSrc = readAppSource(
    "components/roycss/api-keys/api-keys-sheet.tsx",
  );

  it("guards revoke behind an AlertDialog (favorites clear-all pattern)", () => {
    expect(sheetSrc).toContain("AlertDialogTrigger");
    expect(sheetSrc).toContain("AlertDialogAction");
    expect(sheetSrc).toMatch(/Revoke API key/);
    expect(sheetSrc).toMatch(/cannot be undone/i);
    expect(sheetSrc).toMatch(/fail immediately/i);
    expect(sheetSrc).toContain("401");
    expect(sheetSrc).toMatch(/aria-label=\{`Revoke API key /);
  });

  it("lists masked keys only — the plaintext lives solely in the reveal", () => {
    expect(sheetSrc).toMatch(/apiKey\.masked/);
    // The one-time reveal is the only renderer of the plaintext.
    expect(sheetSrc).toContain("{reveal.key}");
    // The masked record type carries no secret material at all.
    const hookSrc = readAppSource("components/roycss/api-keys/use-api-keys.ts");
    expect(hookSrc).toContain("masked: string");
    expect(hookSrc).not.toContain("lookupHash");
    expect(hookSrc).not.toContain("hash:");
  });
});

describe("API-key UI: one-time reveal warns honestly", () => {
  const sheetSrc = readAppSource(
    "components/roycss/api-keys/api-keys-sheet.tsx",
  );

  it("shows the backend's own warning plus an explicit one-time statement", () => {
    // The 201 body carries `warning` — rendered verbatim, not paraphrased.
    expect(sheetSrc).toContain("{reveal.warning}");
    expect(sheetSrc).toMatch(/only time the full key is shown/i);
    expect(sheetSrc).toMatch(/cannot be recovered/i);
  });

  it("offers a copy affordance and clears the secret on close", () => {
    expect(sheetSrc).toContain("Copy key");
    expect(sheetSrc).toContain("navigator.clipboard.writeText(reveal.key)");
    // reset() drops the plaintext from state when the sheet closes.
    expect(sheetSrc).toMatch(/the one-time key MUST leave memory on close/i);
    expect(sheetSrc).toMatch(/setReveal\(null\)/);
  });

  it("states the backend's real rate limits in the footer copy", () => {
    expect(sheetSrc).toContain("10 requests/min");
    expect(sheetSrc).toContain("120 requests/min");
  });
});

describe("API-key UI: no direct fetch bypassing the api seam", () => {
  it("every api-keys component file goes through apiClient", () => {
    const sources = readDirSources("components/roycss/api-keys");
    const files = Object.keys(sources);
    expect(files.length).toBeGreaterThanOrEqual(3);
    for (const [file, src] of Object.entries(sources)) {
      expect(src, `${file} must not call fetch directly`).not.toContain(
        "fetch(",
      );
      expect(src, `${file} must not import the gateway internals`).not.toMatch(
        /from\s+["']@\/lib\/api-gateway["']/,
      );
    }
    const hookSrc = sources["use-api-keys.ts"];
    expect(hookSrc).toContain('from "@/lib/api-client"');
  });

  it("the gateway seam promotes the session cookie to the Bearer credential", () => {
    const gatewaySrc = readAppSource("lib/api-gateway.ts");
    expect(gatewaySrc).toContain("accessCookieValue(cookie)");
    expect(gatewaySrc).toContain("`Bearer ${sessionToken}`");
    // An explicit Authorization header always wins (CLI/SDK callers).
    expect(gatewaySrc).toMatch(/authHeader \? null : accessCookieValue\(cookie\)/);
    // Expired promoted tokens get exactly ONE refresh+retry (/api/auth/me policy).
    expect(gatewaySrc).toContain("refreshSession(backendUrl, cookie)");
  });
});

describe("session-bearer: cookie → Bearer promotion (gateway seam)", () => {
  it("extracts the access token from a multi-cookie header", () => {
    const header = `theme=dark; ${ACCESS_COOKIE}=jwt-abc; other=1`;
    expect(accessCookieValue(header)).toBe("jwt-abc");
  });

  it("returns null without a usable session cookie", () => {
    expect(accessCookieValue(null)).toBeNull();
    expect(accessCookieValue(undefined)).toBeNull();
    expect(accessCookieValue("")).toBeNull();
    expect(accessCookieValue("theme=dark; other=2")).toBeNull();
    expect(accessCookieValue(`${ACCESS_COOKIE}=`)).toBeNull();
  });

  it("extracts access and refresh tokens independently", () => {
    const header = `${ACCESS_COOKIE}=access-jwt; ${REFRESH_COOKIE}=refresh-jwt`;
    expect(accessCookieValue(header)).toBe("access-jwt");
    expect(refreshCookieValue(header)).toBe("refresh-jwt");
    expect(refreshCookieValue(`${ACCESS_COOKIE}=only-access`)).toBeNull();
  });

  it("cookieValue handles position, whitespace, and malformed parts", () => {
    expect(cookieValue("a=1; b=2", "b")).toBe("2");
    expect(cookieValue("b=2; a=1", "b")).toBe("2");
    expect(cookieValue(" spaced = xyz ;", "spaced")).toBe("xyz");
    expect(cookieValue("novalue", "novalue")).toBeNull();
    expect(cookieValue("=anon", "=anon")).toBeNull();
    expect(cookieValue("a=1; a=2", "a")).toBe("1"); // first occurrence wins
  });
});
