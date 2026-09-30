/**
 * Unit tests — env schema.
 *
 * Two suites live here:
 *
 *   1. Blank optional URL vars (issue #208) — a copied `.env.example`
 *      ships EMPTY values for the optional URL vars (`SUPABASE_URL=`,
 *      `SUPABASE_JWKS_URL=`, `REDIS_URL=`). Every one of them must
 *      survive `loadEnv()` as `undefined` — before #208 the blank string
 *      failed `z.string().url()` and the boot hard-exited (the REDIS_URL
 *      preprocess landed earlier, in #118; these tests pin ALL of them
 *      so a future `.url().optional()` field can't regress the same way).
 *
 *   2. JWT secret inequality (issue #266) — `JWT_REFRESH_SECRET` must
 *      differ from `JWT_SECRET` (backend-node/README.md "Must differ
 *      from JWT_SECRET"); the terraform path wired ONE Secret Manager
 *      secret to both, so the loader now fail-fasts on equality in
 *      EVERY environment. Includes a source-pin on the Go validator,
 *      which this sandbox cannot run natively (no Go toolchain).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _resetEnvCacheForTest, loadEnv } from "../../src/config/env.js";

/** Keys this suite mutates — restored to their originals afterwards. */
const TOUCHED = ["SUPABASE_URL", "SUPABASE_JWKS_URL", "REDIS_URL"] as const;
const ORIGINALS = new Map(
  TOUCHED.map((k) => [k, process.env[k]] as const),
);

describe("env schema — blank optional URL vars (issue #208)", () => {
  beforeEach(() => {
    _resetEnvCacheForTest();
    for (const k of TOUCHED) delete process.env[k];
  });

  afterEach(() => {
    for (const k of TOUCHED) {
      const original = ORIGINALS.get(k);
      if (original === undefined) delete process.env[k];
      else process.env[k] = original;
    }
    _resetEnvCacheForTest();
    vi.restoreAllMocks();
  });

  it("1. blank SUPABASE_URL / SUPABASE_JWKS_URL parse as undefined (no exit)", () => {
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_JWKS_URL = "";

    const env = loadEnv();
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.SUPABASE_JWKS_URL).toBeUndefined();
  });

  it("2. whitespace-only values count as blank too", () => {
    process.env.SUPABASE_URL = "   ";
    process.env.REDIS_URL = "\t";

    const env = loadEnv();
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("3. blank REDIS_URL still parses as undefined (the #118 contract)", () => {
    process.env.REDIS_URL = "";

    const env = loadEnv();
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("4. a present, valid URL is preserved through the preprocess", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.REDIS_URL = "redis://localhost:6379";

    const env = loadEnv();
    expect(env.SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
  });

  it("5. a NON-blank invalid URL still fails fast (process.exit(1))", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.SUPABASE_URL = "not-a-url";
    loadEnv();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SUPABASE_URL"),
    );
  });
});

// ─── JWT secret inequality (issue #266) ─────────────────────────────────
// Follows the same mutate-restore discipline as the #208 suite above.

/** Keys the #266 suite mutates — restored to their originals afterwards. */
const JWT_KEYS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "NODE_ENV"] as const;
const JWT_ORIGINALS = new Map(
  JWT_KEYS.map((k) => [k, process.env[k]] as const),
);

describe("env schema — JWT secret inequality (issue #266)", () => {
  beforeEach(() => {
    _resetEnvCacheForTest();
    for (const k of JWT_KEYS) delete process.env[k];
  });

  afterEach(() => {
    for (const k of JWT_KEYS) {
      const original = JWT_ORIGINALS.get(k);
      if (original === undefined) delete process.env[k];
      else process.env[k] = original;
    }
    _resetEnvCacheForTest();
    vi.restoreAllMocks();
  });

  it("1. distinct secrets load fine (positive control)", () => {
    process.env.JWT_SECRET = "jwt-secret-32-chars-long-aaaaaaaaaa";
    process.env.JWT_REFRESH_SECRET = "refresh-secret-32-chars-bbbbbbbbbb";

    const env = loadEnv();
    expect(env.JWT_SECRET).toBe("jwt-secret-32-chars-long-aaaaaaaaaa");
    expect(env.JWT_REFRESH_SECRET).toBe("refresh-secret-32-chars-bbbbbbbbbb");
  });

  it("2. JWT_SECRET === JWT_REFRESH_SECRET → fail-fast (exit 1) outside production too", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.JWT_SECRET = "same-32-char-secret-used-for-both-000";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;

    loadEnv();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("must differ from JWT_SECRET"),
    );
  });

  it("3. equality still fails in production (48+ chars — not a mere length artifact)", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "x".repeat(48);
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;

    loadEnv();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("must differ from JWT_SECRET"),
    );
  });
});

// ─── Go validator source pin (issue #266) ───────────────────────────
// backend-go/pkg/config/config.go must enforce the SAME inequality — but
// this sandbox has no Go toolchain, so (repo-accepted cross-language
// pattern) a source-level test asserts the fail-fast check exists. If
// this goes red, someone removed the Go check.

// backend-go lives at the repo root: tests/unit → tests → backend-node → root
const GO_CONFIG_PATH = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "backend-go",
  "pkg",
  "config",
  "config.go",
);

describe("backend-go config — JWT secret inequality source pin (issue #266)", () => {
  const goConfigSource = readFileSync(GO_CONFIG_PATH, "utf8");

  it("1. compares JWTRefreshSecret against JWTSecret", () => {
    expect(goConfigSource).toMatch(/c\.JWTRefreshSecret\s*==\s*c\.JWTSecret/);
  });

  it("2. and fail-fasts with a must-differ error", () => {
    expect(goConfigSource).toMatch(
      /JWT_REFRESH_SECRET must differ from JWT_SECRET/,
    );
  });
});
