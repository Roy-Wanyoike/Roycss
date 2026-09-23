/**
 * Unit tests — env schema: blank optional URL vars (issue #208).
 *
 * A copied `.env.example` ships EMPTY values for the optional URL vars
 * (`SUPABASE_URL=`, `SUPABASE_JWKS_URL=`, `REDIS_URL=`). Every one of
 * them must survive `loadEnv()` as `undefined` — before #208 the blank
 * string failed `z.string().url()` and the boot hard-exited (the REDIS_URL
 * preprocess landed earlier, in #118; these tests pin ALL of them so a
 * future `.url().optional()` field can't regress the same way).
 */
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
