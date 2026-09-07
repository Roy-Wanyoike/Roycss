/**
 * CONTRACT SUITE (PF-007) — GET single-resource routes.
 *
 * Every GET route whose tail is a ":param" is hit with a sentinel id
 * (`probe-123`). The contract, per issue #93 / API.md:
 *
 *   200 → { data: object }            (single-resource envelope, no meta)
 *   404 → { error: { code, message }, requestId }  (unknown id)
 *   400 → documented error envelope   (param fails Zod, e.g. invalid hex/url)
 *   401 → documented error envelope   (auth-gated singletons)
 *   never 5xx; always JSON + X-Request-Id.
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { listRoutes, isSingleRoute, type RouteEntry } from "../helpers/route-walker.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();
const routes = listRoutes(app).filter((r) => r.method === "get" && isSingleRoute(r));

/** Substitute `:id`-style params with a sentinel that will not exist. */
export function concretize(path: string): string {
  return path.replace(/:(\w+)/g, "probe-123");
}

describe("contract: GET single-resource envelope (registry-driven)", () => {
  for (const route of routes as RouteEntry[]) {
    const url = concretize(route.path);
    it(`GET ${route.path} (sentinel id) honors the single-resource contract`, {
      timeout: 15_000,
    }, async () => {
      const res = await hit(app, "get", url);

      expect(
        res.status,
        `${route.path} must not 5xx — got ${res.status}`,
      ).toBeLessThan(500);

      if (res.status >= 200 && res.status < 300) {
        expectSuccessEnvelope(res);
        expect(
          Array.isArray(res.body.data),
          "single-resource data must be an object, not an array",
        ).toBe(false);
      } else {
        expectErrorEnvelope(res);
      }
    });
  }
});
