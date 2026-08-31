/**
 * Smoke test — boot the app and walk the route table to verify all
 * 8 new modules are wired correctly. Run with:
 *   JWT_SECRET=test-secret-1234567890 \
 *   JWT_REFRESH_SECRET=test-refresh-secret-1234567890 \
 *   npx tsx scripts/smoke-new-modules.ts
 *
 * Exits 0 if all 8 new modules (cloud, devtools, motion, enterprise,
 * inspector, studio, pro-components, mcp) are mounted; exits 1 otherwise.
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
        // Source looks like: ^\/api\/v1\/cloud\/?(?=\/|$)
        // Strip backslashes (regex escape char) so we can match plain slashes.
        const src = layer.regexp.source.replace(/\\/g, "");
        const m = src.match(/^\^?(\/[^?]+)/);
        if (m && m[1]) p = m[1].replace(/\/$/, "");
      }
      walk(layer.handle.stack, prefix + p);
    }
  }
}
walk(app._router.stack);

const newMods = routes.filter((r) =>
  /\/api\/v1\/(cloud|devtools|motion|enterprise|inspector|studio|pro-components|mcp)\b/.test(
    r,
  ),
);

console.log(`NEW MODULE ROUTES (${newMods.length}):`);
newMods.forEach((r) => console.log("  " + r));
console.log(`\nTotal routes registered: ${routes.length}`);

const expected = new Set([
  "/api/v1/cloud",
  "/api/v1/devtools",
  "/api/v1/motion",
  "/api/v1/enterprise",
  "/api/v1/inspector",
  "/api/v1/studio",
  "/api/v1/pro-components",
  "/api/v1/mcp",
]);
const mounted = new Set(
  newMods
    .map((r) => r.split(/\s+/)[1] ?? "")
    .map((p) => p.split("/").slice(0, 4).join("/")),
);
const missing = [...expected].filter((e) => !mounted.has(e));
if (missing.length === 0) {
  console.log("\n✅ All 8 new modules are mounted.");
  process.exit(0);
} else {
  console.log("\n❌ Missing mounts:", missing);
  process.exit(1);
}
