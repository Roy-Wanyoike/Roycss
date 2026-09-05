/**
 * Unit tests — src/lib/api-key.ts (issue #65 / PF-002).
 *
 * Covers the pure key primitives: generation (format, entropy display
 * fields, uniqueness), format validation, lookup hashing, masking, scope
 * matching, and defensive scope-JSON parsing.
 *
 * No DB, no Express — this file can run hermetically.
 */
import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

import {
  API_KEY_PREFIX,
  API_KEY_SECRET_LENGTH,
  generateApiKey,
  hasScope,
  hashApiKey,
  isValidApiKeyFormat,
  lookupHashOf,
  maskApiKey,
  parseApiKeyScopes,
} from "../../src/lib/api-key.js";

describe("generateApiKey", () => {
  it("produces keys matching rk_live_<base62(32)>", () => {
    for (let i = 0; i < 50; i++) {
      const { plaintext, prefix, last4 } = generateApiKey();
      expect(plaintext).toMatch(/^rk_live_[0-9A-Za-z]{32}$/);
      expect(prefix).toBe(API_KEY_PREFIX);
      expect(last4).toBe(plaintext.slice(-4));
      expect(plaintext.length).toBe(
        API_KEY_PREFIX.length + 1 + API_KEY_SECRET_LENGTH,
      );
    }
  });

  it("never generates duplicate keys (200 samples)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(generateApiKey().plaintext);
    expect(seen.size).toBe(200);
  });

  it("hashes to a bcrypt digest that verifies against the plaintext", async () => {
    const { plaintext } = generateApiKey();
    const hash = await hashApiKey(plaintext);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt
    expect(hash).not.toContain(plaintext); // never embeds the key
    expect(await bcrypt.compare(plaintext, hash)).toBe(true);
    expect(await bcrypt.compare("rk_live_" + "0".repeat(32), hash)).toBe(false);
  });
});

describe("isValidApiKeyFormat", () => {
  it("accepts a well-formed key", () => {
    expect(isValidApiKeyFormat("rk_live_" + "Ab1zZ9".repeat(5) + "ab")).toBe(true);
  });

  it("rejects malformed keys without throwing", () => {
    expect(isValidApiKeyFormat("")).toBe(false);
    expect(isValidApiKeyFormat("rk_live_short")).toBe(false); // too short
    expect(isValidApiKeyFormat("rk_live_" + "a".repeat(33))).toBe(false); // too long
    expect(isValidApiKeyFormat("sk_live_" + "a".repeat(32))).toBe(false); // wrong prefix
    expect(isValidApiKeyFormat("rk_live_" + "a".repeat(31) + "-")).toBe(false); // bad charset
    expect(isValidApiKeyFormat("rk_live_" + "a".repeat(31) + "_")).toBe(false); // bad charset
    expect(isValidApiKeyFormat("rk-live-" + "a".repeat(32))).toBe(false); // wrong shape
    expect(isValidApiKeyFormat(" rk_live_" + "a".repeat(32))).toBe(false); // leading space
  });
});

describe("lookupHashOf", () => {
  it("returns a stable 64-char hex digest", () => {
    const key = "rk_live_" + "a".repeat(32);
    const a = lookupHashOf(key);
    const b = lookupHashOf(key);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
  });

  it("differs per key", () => {
    const a = lookupHashOf("rk_live_" + "a".repeat(32));
    const b = lookupHashOf("rk_live_" + "b".repeat(32));
    expect(a).not.toBe(b);
  });
});

describe("maskApiKey", () => {
  it("renders prefix + ellipsis + last4", () => {
    expect(maskApiKey("rk_live", "ab12")).toBe("rk_live_…ab12");
  });
});

describe("hasScope", () => {
  it("wildcard covers every scope", () => {
    expect(hasScope(["*"], "effects:read")).toBe(true);
    expect(hasScope(["*"], "anything:at:all")).toBe(true);
  });

  it("matches exact scopes only", () => {
    expect(hasScope(["effects:read"], "effects:read")).toBe(true);
    expect(hasScope(["effects:read"], "effects:write")).toBe(false);
    expect(hasScope(["effects:read"], "recipes:read")).toBe(false);
  });

  it("empty scope lists grant nothing", () => {
    expect(hasScope([], "effects:read")).toBe(false);
    expect(hasScope([], "*")).toBe(false);
  });
});

describe("parseApiKeyScopes", () => {
  it("round-trips a stored scope array", () => {
    expect(parseApiKeyScopes(JSON.stringify(["effects:read", "*"]))).toEqual([
      "effects:read",
      "*",
    ]);
  });

  it("degrades corrupted rows to no access (never widens)", () => {
    expect(parseApiKeyScopes("not json")).toEqual([]);
    expect(parseApiKeyScopes('{"a":1}')).toEqual([]); // object, not array
    expect(parseApiKeyScopes("[1,\"effects:read\",null]")).toEqual([
      "effects:read",
    ]); // non-strings dropped
  });
});
