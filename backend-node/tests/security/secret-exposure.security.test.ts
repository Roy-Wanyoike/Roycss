/**
 * SECURITY SUITE (PF-007) — secret exposure.
 *
 * Sweeps a representative sample of the API (public reads + the
 * authenticated surfaces that touch User rows) and deep-scans every JSON
 * response for:
 *
 *   - forbidden KEY names: passwordHash / password (the bcrypt column),
 *     env var names (JWT_SECRET, NPM_TOKEN, DATABASE_URL, …) as fields,
 *   - forbidden VALUES: the literal test JWT secret values, bcrypt hash
 *     prefixes ("$2a$"/"$2b$"), and any current process.env secret value,
 *
 * i.e. a response must never hand a client the ingredients to forge
 * tokens, replay credentials, or read at-rest hashes.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import {
  hit,
  registerUser,
  bearer,
  expectSuccessEnvelope,
} from "../helpers/api-client.js";

const app = createApp();

/** Key names that must never appear as a field in any response. */
const FORBIDDEN_KEYS =
  /^(passwordhash|password|jwt_secret|jwt_refresh_secret|npm_token|database_url|client_secret|privatekey)$/i;

/** Env names whose VALUES must never appear in any response. */
const SECRET_ENV_KEYS = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "NPM_TOKEN",
  "DATABASE_URL",
] as const;

/** Deep-collect every key + string value from a JSON tree. */
function collect(node: unknown, keys: Set<string>, values: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, keys, values);
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      keys.add(k);
      collect(v, keys, values);
    }
    return;
  }
  if (typeof node === "string") values.add(node);
}

function scanForSecrets(body: unknown, context: string): void {
  const keys = new Set<string>();
  const values = new Set<string>();
  collect(body, keys, values);

  for (const key of keys) {
    expect(
      FORBIDDEN_KEYS.test(key),
      `${context}: forbidden key "${key}" leaked`,
    ).toBe(false);
  }
  for (const value of values) {
    // bcrypt hashes at rest must never cross the wire.
    expect(
      /^\$2[aby]\$/.test(value),
      `${context}: a bcrypt hash leaked as a value`,
    ).toBe(false);
    for (const envKey of SECRET_ENV_KEYS) {
      const secret = process.env[envKey];
      if (secret) {
        expect(
          value.includes(secret),
          `${context}: the value of env ${envKey} leaked`,
        ).toBe(false);
      }
    }
  }
}

describe("security/secret-exposure", () => {
  it("auth surfaces (register/login/me/api-keys) never leak hashes or secrets", async () => {
    const user = await registerUser(app, "secrets");

    // /auth/me — the canonical user read.
    const me = await hit(app, "get", "/api/v1/auth/me", {
      headers: bearer(user),
    });
    expect(me.status).toBe(200);
    expectSuccessEnvelope(me);
    scanForSecrets(me.body, "GET /auth/me");
    expect(Object.keys(me.body.data).sort()).toEqual([
      "createdAt",
      "email",
      "id",
      "name",
    ]);

    // API key mint — plaintext key is fine (documented, shown once); the
    // bcrypt hash must NOT appear.
    const mint = await hit(app, "post", "/api/v1/auth/api-keys", {
      body: { name: "secret-probe-key" },
      headers: bearer(user),
    });
    expect(mint.status).toBe(201);
    scanForSecrets(mint.body, "POST /auth/api-keys");
    expect(mint.body.data.key).toMatch(/^rk_live_/);
    expect(JSON.stringify(mint.body)).not.toMatch(/\$2[aby]\$/);

    // API key list — masked keys only.
    const list = await hit(app, "get", "/api/v1/auth/api-keys", {
      headers: bearer(user),
    });
    expect(list.status).toBe(200);
    scanForSecrets(list.body, "GET /auth/api-keys");
    for (const key of list.body.data as Array<Record<string, unknown>>) {
      expect(JSON.stringify(key)).not.toMatch(/\$2[aby]\$/);
    }
  });

  it("a broad sample of public reads never leaks secrets", async () => {
    const sample = [
      "/api/v1/effects?limit=5",
      "/api/v1/recipes?limit=2",
      "/api/v1/patterns?limit=2",
      "/api/v1/themes",
      "/api/v1/icons?limit=2",
      "/api/v1/search?q=neon",
      "/api/v1/search/recent",
      "/api/v1/workspace/team",
      "/api/v1/workspace/resources",
      "/api/v1/analytics/overview",
      "/api/v1/audit-center/projects",
      "/api/v1/registry/packages",
      "/api/v1/devtools/tokens",
      "/api/v1/health/",
      "/api/v1",
    ];

    for (const path of sample) {
      const res = await request(app)
        .get(path)
        .set("X-Forwarded-For", `198.18.0.3${path.length % 10}`);
      expect(res.status, `GET ${path}`).toBeLessThan(500);
      scanForSecrets(res.body, `GET ${path}`);
    }
  });

  it("error responses never leak stack traces or env values (non-prod redaction check)", async () => {
    // A garbage token produces a documented 401 — its body must be tight.
    const res = await hit(app, "get", "/api/v1/auth/me", {
      headers: { Authorization: "Bearer not.a.jwt" },
    });
    expect(res.status).toBe(401);
    scanForSecrets(res.body, "401 body");
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at \w+ \(/);
  });
});
