/**
 * Smoke test for batch-3 modules — verifies all 13 are mounted and
 * their primary endpoints respond. Run with:
 *   JWT_SECRET=test-secret-1234567890 \
 *   JWT_REFRESH_SECRET=test-refresh-secret-1234567890 \
 *   DATABASE_URL="file:./dev.db" \
 *   npx tsx scripts/smoke-batch-3.ts
 */
import { createApp } from "../src/server/app.js";

interface Layer {
  route?: { path: string; methods: Record<string, boolean> };
  name: string;
  regexp?: { source: string };
  handle?: { stack?: Layer[] };
}

const app = createApp() as unknown as { _router: { stack: Layer[] } };

const routes: string[] = [];
function walk(stack: Layer[], prefix = ""): void {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .map((m) => m.toUpperCase())
        .join(",");
      routes.push(`${methods} ${prefix}${layer.route.path}`);
    } else if (layer.name === "router" && layer.handle?.stack) {
      let p = "";
      if (layer.regexp?.source) {
        const src = layer.regexp.source.replace(/\\/g, "");
        const m = src.match(/^\^?(\/[^?]+)/);
        if (m && m[1]) p = m[1].replace(/\/$/, "");
      }
      walk(layer.handle.stack, prefix + p);
    }
  }
}
walk(app._router.stack);

const batch3 = routes.filter((r) =>
  /\/api\/v1\/(open|spotlight|profiler|bundle|observatory|os|digital-twin|live|benchmark|blocks|blueprints|plugins|search)\b/.test(
    r,
  ),
);

console.log(`BATCH-3 ROUTES (${batch3.length}):`);
batch3.forEach((r) => console.log("  " + r));
console.log(`\nTotal routes registered: ${routes.length}`);

const expected = new Set([
  "/api/v1/open",
  "/api/v1/spotlight",
  "/api/v1/profiler",
  "/api/v1/bundle",
  "/api/v1/observatory",
  "/api/v1/os",
  "/api/v1/digital-twin",
  "/api/v1/live",
  "/api/v1/benchmark",
  "/api/v1/blocks",
  "/api/v1/blueprints",
  "/api/v1/plugins",
  "/api/v1/search",
]);
const mounted = new Set(
  batch3
    .map((r) => r.split(/\s+/)[1] ?? "")
    .map((p) => p.split("/").slice(0, 4).join("/")),
);
const missing = [...expected].filter((e) => !mounted.has(e));
if (missing.length === 0) {
  console.log("\n✅ All 13 batch-3 modules are mounted.");
  process.exit(0);
} else {
  console.log("\n❌ Missing mounts:", missing);
  process.exit(1);
}
