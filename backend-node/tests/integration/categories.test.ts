/**
 * Integration tests — the `categories` surface (PF-007, issue #93 module 2/15).
 *
 * There is no single `categories` module; the categories surface is a set
 * of `GET /<module>/categories` sub-routes. This file pins the ones beyond
 * the already-covered `effects/categories` (see effects.test.ts #6):
 *
 *   icons/categories, motion/categories, blocks/categories,
 *   plugins/categories, pro-components/categories
 *
 * Two item shapes exist today (pinned honestly):
 *   - icon-style:  { category, count }                  (icons, motion)
 *   - block-style: { id, name, count, icon }            (blocks, plugins,
 *                                                         pro-components)
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope } from "../helpers/api-client.js";

const app = createApp();

const CATEGORY_ROUTES = [
  // icon-style { category, count } items
  { path: "/api/v1/icons/categories", count: 7, style: "icon" as const },
  { path: "/api/v1/motion/categories", count: 5, style: "icon" as const },
  { path: "/api/v1/pro-components/categories", count: 11, style: "icon" as const },
  // block-style { id, name, count, icon } items
  { path: "/api/v1/blocks/categories", count: 8, style: "block" as const },
  { path: "/api/v1/plugins/categories", count: 10, style: "block" as const },
] as const;

describe("GET /api/v1/<module>/categories", () => {
  for (const route of CATEGORY_ROUTES) {
    it(`${route.path} — collection envelope, ${route.style}-style items`, async () => {
      const res = await hit(app, "get", route.path);

      expect(res.status).toBe(200);
      expectSuccessEnvelope(res);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.count).toBe(route.count);

      for (const item of res.body.data as Array<Record<string, unknown>>) {
        expect(typeof item.count).toBe("number");
        if (route.style === "icon") {
          expect(typeof item.category).toBe("string");
        } else {
          expect(typeof item.id).toBe("string");
          expect(typeof item.name).toBe("string");
          expect(typeof item.icon).toBe("string");
        }
      }
    });
  }
});
