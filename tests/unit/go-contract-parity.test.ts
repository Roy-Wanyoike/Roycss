import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const GO_ROOT = join(__dirname, "..", "..", "backend-go");
const NODE_ROOT = join(__dirname, "..", "..", "backend-node");

/** Read a file from the backend-go tree. */
const go = (...p: string[]) => readFileSync(join(GO_ROOT, ...p), "utf8");

/** Every .go file under backend-go, as { rel, src } (excluding nothing — the tree is small). */
function allGoFiles(dir = GO_ROOT, acc: { rel: string; src: string }[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) allGoFiles(full, acc);
    else if (entry.endsWith(".go")) {
      acc.push({ rel: full.slice(GO_ROOT.length + 1), src: readFileSync(full, "utf8") });
    }
  }
  return acc;
}

/**
 * backend-go ⇄ backend-node contract parity — issue #270.
 *
 * backend-go is a deployed failover surface (compose builds it; terraform
 * provisions Cloud Run), so its /api/v1 contract must match backend-node:
 * tokens interoperable in BOTH directions, stable error-code vocabulary +
 * requestId, 501 (never mux-404) for unported modules.
 *
 * The Go toolchain is not installed in this sandbox, so these are
 * SOURCE-level pins over the Go tree (the repo-accepted source-pin
 * pattern, cf. webgl-showcase-boundary.test.ts) plus a REAL YAML parse of
 * the OpenAPI document. When a Go toolchain lands, behavioral `go test`
 * suites (auth verify iss/aud/sub, cross-backend token interop) should be
 * added — keep this file as the drift alarm either way.
 *
 * Node sources of truth pinned here:
 *   - src/config/constants.ts:14,50-51  (issuer = APP_NAME, audience)
 *   - src/lib/jwt.ts:26-30,52-55,120-128 (sub claim, BASE_VERIFY_OPTS, type guard)
 *   - src/server/middleware/error.ts:34-52 (stable ErrorCode enum)
 *   - src/modules/auth/routes.ts:98-446  (auth surface)
 *   - src/config/env.ts:123-124          (storage env names)
 */
describe("backend-go contract parity (issue #270)", () => {
  // ── (a) JWT issuer / claims / verification ───────────────────────────
  describe("auth: token contract", () => {
    const authSrc = go("pkg", "auth", "auth.go");

    it("issues tokens with the node issuer + audience (constants.ts:14,50-51)", () => {
      expect(authSrc).toContain('Issuer   = "roycss-backend"');
      expect(authSrc).toContain('Audience = "roycss-client"');
      // the pre-parity issuer must be gone from the whole Go tree
      // (it also leaked into the logger service tag and the /health body).
      for (const { rel, src } of allGoFiles()) {
        expect(src, `${rel} still references roycss-go-api`).not.toContain(
          "roycss-go-api",
        );
      }
      // /health reports the same service identity as node (APP_NAME).
      expect(go("internal", "health", "handler.go")).toContain(
        '"service": "roycss-backend"',
      );
    });

    it("carries the user id in `sub`, not `uid` (jwt.ts:26-30)", () => {
      expect(authSrc).not.toContain('json:"uid"');
      expect(authSrc).toContain("jwt.RegisteredClaims");
      expect(authSrc).toMatch(/Subject:\s+userID/);
    });

    it("verify enforces iss + aud + HS256 + token type on BOTH token kinds", () => {
      for (const fn of ["VerifyAccess", "VerifyRefresh"]) {
        const start = authSrc.indexOf(`func ${fn}(`);
        const end = authSrc.indexOf("\nfunc ", start + 1);
        const scope = end === -1 ? authSrc.slice(start) : authSrc.slice(start, end);
        expect(scope, fn).toContain("hmacKeyFunc(secret)");
        expect(scope, fn).toContain('jwt.WithValidMethods([]string{"HS256"})');
        expect(scope, fn).toContain("jwt.WithIssuer(Issuer)");
        expect(scope, fn).toContain("jwt.WithAudience(Audience)");
        expect(scope, fn).toContain("invalid token type");
      }
      expect(authSrc).toContain('TokenTypeAccess  = "access"');
      expect(authSrc).toContain('TokenTypeRefresh = "refresh"');
    });

    it("refresh tokens are jti-stamped (node jwt.ts:87-98 / audit F-05)", () => {
      expect(authSrc).toContain("rand.Read(jti)");
      expect(authSrc).toContain("ID:        hex.EncodeToString(jti)");
    });
  });

  // ── (b) auth route surface ───────────────────────────────────────────
  describe("auth: route surface", () => {
    const handlerSrc = go("internal", "auth", "handler.go");

    it("mounts /auth/register as canonical and keeps /auth/signup as alias", () => {
      expect(handlerSrc).toContain(
        'mux.HandleFunc("/api/v1/auth/register", s.register)',
      );
      expect(handlerSrc).toContain(
        'mux.HandleFunc("/api/v1/auth/signup", s.register)',
      );
    });

    it("mounts 501 stubs (never mux-404) for every unported node auth route", () => {
      for (const p of [
        "/api/v1/auth/logout",
        "/api/v1/auth/logout-all",
        "/api/v1/auth/export",
        "/api/v1/auth/account",
        "/api/v1/auth/verify-email",
        "/api/v1/auth/verify-email/confirm",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/api-keys", // DELETE /api-keys/:id lands on the subtree mount
      ]) {
        expect(handlerSrc).toContain(`mux.HandleFunc("${p}"`);
      }
      expect(handlerSrc).toContain('w.WriteHeader(http.StatusNotImplemented)');
      expect(handlerSrc).toContain('"code":"NOT_IMPLEMENTED"');
    });
  });

  // ── (c) error envelope ───────────────────────────────────────────────
  describe("response: error envelope", () => {
    const responseSrc = go("pkg", "response", "response.go");
    const NODE_ENUM = [
      "VALIDATION_ERROR",
      "BAD_REQUEST",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "SERVICE_UNAVAILABLE",
    ] as const;

    it("declares the full stable node error-code enum (error.ts:34-52)", () => {
      for (const code of NODE_ENUM) {
        expect(responseSrc).toContain(`"${code}"`);
      }
    });

    it("uses NO legacy Go-only error codes anywhere in the tree", () => {
      const LEGACY =
        /"(?:METHOD_NOT_ALLOWED|INVALID_CREDENTIALS|INVALID_TOKEN|UNAUTHENTICATED|DUPLICATE|INTERNAL)"/;
      for (const { rel, src } of allGoFiles()) {
        expect(src, `${rel} uses a legacy error code`).not.toMatch(LEGACY);
      }
      // bare "VALIDATION" (not VALIDATION_ERROR) was the old drift
      expect(responseSrc).not.toMatch(/"VALIDATION"/);
    });

    it("attaches requestId to error envelopes (node error.ts:313-320 shape)", () => {
      expect(responseSrc).toContain('body["requestId"] = id');
      expect(responseSrc).toContain('w.Header().Get("X-Request-Id")');
      // the panic path carries it too, and RequestID seeds the header
      expect(go("pkg", "http", "middleware.go")).toMatch(
        /Recover[\s\S]*X-Request-Id[\s\S]*requestId/,
      );
      expect(go("pkg", "http", "middleware.go")).toContain(
        'w.Header().Set("X-Request-Id", id)',
      );
    });
  });

  // ── (d) module 501 stubs ─────────────────────────────────────────────
  describe("modules: 501 stubs registered", () => {
    const mainSrc = go("cmd", "api", "main.go");

    it("registers the five previously-missing modules from the issue", () => {
      for (const pkg of ["audit", "collections", "favorites", "metrics", "openapi"]) {
        expect(mainSrc).toContain(`${pkg}.RegisterRoutes`);
        const stub = go("internal", pkg, "handler.go");
        expect(stub).toContain("func RegisterRoutes");
        expect(stub).toContain("http.StatusNotImplemented");
        expect(stub).toContain('"code":"NOT_IMPLEMENTED"');
      }
      expect(go("internal", "openapi", "handler.go")).toContain(
        'mux.HandleFunc("/api/v1/openapi.json", notImplemented)',
      );
    });

    it("keeps the stub census honest (comment count == registered count)", () => {
      const block = mainSrc.slice(mainSrc.indexOf("registerStubs(mux,"));
      const registered = (block.match(/\.RegisterRoutes,/g) ?? []).length;
      expect(registered).toBe(70);
      expect(mainSrc).toContain("── 70 stub modules");
      expect(mainSrc).toContain("the other 70 modules return");
    });
  });

  // ── (e) OpenAPI document ─────────────────────────────────────────────
  describe("openapi.yaml", () => {
    const YAML_PATH = ["api", "openapi", "openapi.yaml"];
    const raw = go(...YAML_PATH);

    it("parses as valid YAML / OpenAPI 3.1 with node-canonical auth paths", () => {
      const doc = parseYaml(raw) as {
        openapi: string;
        paths: Record<string, unknown>;
      };
      expect(doc.openapi).toBe("3.1.0");
      expect(Object.keys(doc.paths)).toContain("/auth/register");
      expect(Object.keys(doc.paths)).toContain("/auth/signup");
    });

    it("has no corrupted tag values (issue #270 reported `tags: ealth]`)", () => {
      // NOTE: the issue's evidence was a grep artifact — `[health]`
      // CONTAINS the substring `ealth]`. The real invariant is that every
      // `tags:` line is either block style or a well-formed flow sequence.
      for (const line of raw.split("\n")) {
        if (/^\s*tags:/.test(line)) {
          expect(line.trim(), line).toMatch(
            /^tags:(\s+\[[a-z][a-z0-9-]*\])?$/,
          );
        }
      }
    });
  });

  // ── (f) storage env naming ───────────────────────────────────────────
  describe("config: storage env naming", () => {
    const configSrc = go("pkg", "config", "config.go");
    const nodeEnvSrc = readFileSync(
      join(NODE_ROOT, "src", "config", "env.ts"),
      "utf8",
    );

    it("reads the node env names (env.ts:123-124)", () => {
      expect(configSrc).toContain('env("STORAGE_ACCESS_KEY_ID", "")');
      expect(configSrc).toContain('env("STORAGE_SECRET_ACCESS_KEY", "")');
      for (const name of ["STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"]) {
        expect(nodeEnvSrc).toContain(name);
      }
    });

    it("no longer READS the drifted pre-parity names (comments may document them)", () => {
      // anchored on the env() call sites, with lookaheads: STORAGE_ACCESS_KEY_ID
      // contains STORAGE_ACCESS_KEY as a prefix — only flag the OLD name
      // without its node suffix.
      expect(configSrc).not.toMatch(/env\("STORAGE_ACCESS_KEY(?!_ID)/);
      expect(configSrc).not.toMatch(/env\("STORAGE_SECRET_KEY(?!_ACCESS)/);
    });
  });
});
