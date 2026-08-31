/**
 * Smoke test for batch-1 modules — verifies all 12 are mounted.
 * Run with:
 *   JWT_SECRET=test-secret-1234567890 \
 *   JWT_REFRESH_SECRET=test-refresh-secret-1234567890 \
 *   DATABASE_URL="file:./dev.db" \
 *   npx tsx scripts/smoke-batch-1.ts
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

const batch1 = routes.filter((r) =>
  /\/api\/v1\/(accessibility|architect|review|refactor|pair|designer|scaffold|generator|sync|version|registry|governance)\b/.test(
    r,
  ),
);

console.log(`BATCH-1 ROUTES (${batch1.length}):`);
batch1.forEach((r) => console.log("  " + r));
console.log(`\nTotal routes registered: ${routes.length}`);

const expected = new Set([
  "/api/v1/accessibility",
  "/api/v1/architect",
  "/api/v1/review",
  "/api/v1/refactor",
  "/api/v1/pair",
  "/api/v1/designer",
  "/api/v1/scaffold",
  "/api/v1/generator",
  "/api/v1/sync",
  "/api/v1/version",
  "/api/v1/registry",
  "/api/v1/governance",
]);
const mounted = new Set(
  batch1
    .map((r) => r.split(/\s+/)[1] ?? "")
    .map((p) => p.split("/").slice(0, 4).join("/")),
);
const missing = [...expected].filter((e) => !mounted.has(e));
if (missing.length === 0) {
  console.log("\n✅ All 12 batch-1 modules are mounted.");
  process.exit(0);
} else {
  console.log("\n❌ Missing mounts:", missing);
  process.exit(1);
}
