/**
 * Shared route-walking library for the API.md tooling.
 *
 * Statically walks the backend Express route table and the Next.js
 * frontend API routes WITHOUT booting the app (no env vars, no DB):
 *
 *   - `walkBackendRoutes()`  parses `src/server/app.ts` (router mounts +
 *     root info endpoint) and every `src/modules/<m>/routes.ts`
 *     (`<router>.get/post/put/patch/delete("...", ...)` calls).
 *   - `walkFrontendRoutes()` walks the `route.ts` files under
 *     `src/app/api` (recursively) and extracts the exported HTTP
 *     method handlers.
 *
 * Used by both:
 *   - `scripts/gen-api-md.ts`     (regenerates the API.md skeleton)
 *   - `scripts/check-api-docs.ts` (CI drift gate — API.md vs code)
 *
 * The parser is intentionally conservative: string literals and comments
 * are handled explicitly so a stray `)` or `//` inside a handler cannot
 * truncate a route call.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // backend-node/scripts/lib
export const BACKEND_ROOT = resolve(SCRIPT_DIR, "../.."); // backend-node
export const REPO_ROOT = resolve(BACKEND_ROOT, ".."); // repo root

export const API_PREFIX = "/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────

export interface BackendRouteInfo {
  /** HTTP method, upper-cased (GET, POST, …). */
  method: string;
  /** Full path incl. prefix, e.g. `/api/v1/effects/:id`. */
  path: string;
  /** Module directory name (mount segment), e.g. `effects`. */
  module: string;
  /** `requireAuth` / `optionalAuth` found in the route's middleware chain. */
  auth: "none" | "required" | "optional";
  /** Zod schema name wired via validateBody(). */
  bodySchema?: string;
  /** Zod schema name wired via validateQuery(). */
  querySchema?: string;
  /** Zod schema name wired via validateParams(). */
  paramsSchema?: string;
  /** Extra limiter (beyond the global one): "auth" | "contact" | undefined. */
  rateLimiter?: string;
  /** Response shape detected from the handler body. */
  envelope: "data" | "data-meta" | "custom" | "empty";
  /** Keys of a custom (non-envelope) res.json({ ... }) body. */
  customKeys: string[];
  /** Success status code(s) used by the handler (200 default). */
  successStatus: number[];
  /** Module persists data via Prisma (imports lib/db.js). */
  persisted: boolean;
}

export interface FrontendRouteInfo {
  method: string;
  /** e.g. `/api/health`, `/api/effects/:id/css`, `/api/v1/*` (catch-all). */
  path: string;
  /** Absolute path of the route.ts file. */
  file: string;
}

// ─── Source helpers ───────────────────────────────────────────────────────

function read(file: string): string {
  return readFileSync(file, "utf8");
}

/**
 * Replace comment regions with spaces (newlines preserved) so line/column
 * numbers stay stable while regexes can no longer match comment text.
 * String contents (incl. URLs containing "//") are preserved.
 */
export function stripComments(src: string): string {
  let out = "";
  let inStr: string | null = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === "\\") {
        out += src[i + 1] ?? "";
        i++;
      } else if (c === inStr) {
        inStr = null;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      out += c;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") {
        out += " ";
        i++;
      }
      out += "\n";
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      out += "  ";
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      out += "  ";
      i++;
      continue;
    }
    out += c;
  }
  return out;
}

/**
 * Slice the balanced `(...)` region that starts at `openIndex` (index of
 * the opening paren). String-aware; assumes comments were already
 * stripped. Returns the region including both parens.
 */
export function sliceCall(src: string, openIndex: number): string {
  let depth = 0;
  let inStr: string | null = null;
  for (let i = openIndex; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === "\\") {
        i++;
      } else if (c === inStr) {
        inStr = null;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return src.slice(openIndex, i + 1);
    }
  }
  return src.slice(openIndex);
}

/** Escape a string for embedding in a RegExp. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Zod schema key extraction ────────────────────────────────────────────

export interface SchemaField {
  key: string;
  optional: boolean;
}

/**
 * Extract the top-level keys of `(export )const <name> = z.object({ ... })`
 * from a module's schema.ts (or routes.ts — some modules define schemas
 * inline). Returns undefined when the schema is not a plain z.object
 * literal (compositions like `.partial()`, extends, …).
 *
 * Extraction is line-based on the formatter's indentation (top-level keys
 * sit at one indent level; nested object keys one deeper), which avoids
 * mis-scanning regex literals that contain quotes/parens.
 */
export function schemaFields(
  module: string,
  schemaName: string,
): SchemaField[] | undefined {
  for (const base of ["schema.ts", "routes.ts"]) {
    const file = join(BACKEND_ROOT, `src/modules/${module}/${base}`);
    if (!existsSync(file)) continue;
    const src = stripComments(read(file));
    const re = new RegExp(
      `(?:export\\s+)?const\\s+${escapeRe(schemaName)}\\s*=\\s*z\\s*\\.?\\s*object\\(\\s*\\{`,
    );
    const m = re.exec(src);
    if (!m) continue;

    // Object body: line-based brace counting (strings stripped per line —
    // TS strings/regexes never span lines here). Stops at the line that
    // closes the z.object( ... { ... } ), so chained `.refine({ message })`
    // option objects after the close are NOT mistaken for keys.
    const start = m.index + m[0].length;
    const strRe = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
    let depth = 1; // inside the z.object's opening "{"
    const bodyLines: string[] = [];
    for (const line of src.slice(start).split("\n")) {
      const stripped = line.replace(strRe, '""');
      for (const c of stripped) {
        if (c === "{") depth++;
        else if (c === "}") depth--;
      }
      if (depth <= 0) break;
      bodyLines.push(line);
    }
    if (bodyLines.length === 0) continue;

    // Top-level keys: `key:` / `key?:` at the FIRST indent level seen.
    const fields: SchemaField[] = [];
    let keyIndent: number | null = null;
    const keyLineRe = /^(\s+)([A-Za-z_$][\w$]*)(\?)?\s*:/;
    let valueBuf: string[] = [];
    let pending: { key: string; optional: boolean } | null = null;

    const flush = (): void => {
      if (pending) {
        const value = valueBuf
          .join(" ")
          .trim()
          .replace(/,+\s*$/, "")
          .trim();
        const optional =
          pending.optional ||
          /\.optional\(\)\s*$/.test(value) ||
          /\.nullish\(\)\s*$/.test(value) ||
          /\.default\([^)]*\)\s*$/.test(value);
        fields.push({ key: pending.key, optional });
        pending = null;
      }
      valueBuf = [];
    };

    for (const line of bodyLines) {
      const km = keyLineRe.exec(line);
      if (km) {
        const indent = km[1].length;
        if (keyIndent === null) keyIndent = indent;
        if (indent === keyIndent) {
          flush();
          pending = { key: km[2], optional: km[3] === "?" };
          valueBuf.push(line.slice(km[0].length));
          continue;
        }
      }
      if (pending) valueBuf.push(line.trim());
    }
    flush();
    if (fields.length > 0) return fields;
  }
  return undefined;
}

// ─── Backend walk ─────────────────────────────────────────────────────────

/** Mount order + module names parsed from app.ts. */
export interface MountInfo {
  mount: string; // "effects"
  module: string; // "effects" (module dir; differs for plugin-hub → "plugins")
  routerVar: string; // "effectsRouter"
}

export function parseMounts(): MountInfo[] {
  const appSrc = stripComments(read(join(BACKEND_ROOT, "src/server/app.ts")));

  const routerToModule = new Map<string, string>();
  const importRe =
    /import\s*\{\s*(\w+Router)\s*\}\s*from\s*"\.\.\/modules\/([\w-]+)\/routes\.js"/g;
  for (const m of appSrc.matchAll(importRe)) {
    routerToModule.set(m[1], m[2]);
  }

  const mounts: MountInfo[] = [];
  const mountRe = /app\.use\(`\$\{API_PREFIX\}\/([\w-]+)`,\s*(\w+)\)/g;
  for (const m of appSrc.matchAll(mountRe)) {
    const routerVar = m[2];
    const module = routerToModule.get(routerVar);
    if (!module) {
      throw new Error(
        `app.ts mounts router "${routerVar}" at /${m[1]} but no matching ` +
          `import from ../modules/<name>/routes.js was found`,
      );
    }
    mounts.push({ mount: m[1], module, routerVar });
  }
  return mounts;
}

/** True when the module touches Prisma (imports lib/db.js). */
function modulePersisted(module: string): boolean {
  for (const f of ["service.ts", "routes.ts"]) {
    const p = join(BACKEND_ROOT, `src/modules/${module}/${f}`);
    if (existsSync(p) && /from\s*"\.\.\/\.\.\/lib\/db\.js"/.test(read(p))) {
      return true;
    }
  }
  return false;
}

/** Walk every backend route (mounts + root info endpoint). */
export function walkBackendRoutes(): BackendRouteInfo[] {
  const appSrc = stripComments(read(join(BACKEND_ROOT, "src/server/app.ts")));
  const mounts = parseMounts();
  const routes: BackendRouteInfo[] = [];

  // Root info endpoint: app.get(API_PREFIX, asyncHandler(...))
  if (/app\.get\(\s*API_PREFIX\s*,/.test(appSrc)) {
    routes.push({
      method: "GET",
      path: API_PREFIX,
      module: "(root)",
      auth: "none",
      envelope: "custom",
      customKeys: ["name", "version", "endpoints"],
      successStatus: [200],
      persisted: false,
    });
  }

  for (const { mount, module } of mounts) {
    const routesFile = join(BACKEND_ROOT, `src/modules/${module}/routes.ts`);
    const raw = read(routesFile);
    const src = stripComments(raw);
    const persisted = modulePersisted(module);

    const routerVar = /(?:const|let|var)\s+(\w+)\s*=\s*Router\(\s*\)/.exec(
      src,
    )?.[1];
    if (!routerVar) {
      throw new Error(`No Router() declaration found in ${routesFile}`);
    }

    const callRe = new RegExp(
      `\\b${escapeRe(routerVar)}\\.(get|post|put|patch|delete)\\(`,
      "g",
    );
    for (const call of src.matchAll(callRe)) {
      const method = call[1].toUpperCase();
      const openParen = call.index + call[0].length - 1;
      const callText = sliceCall(src, openParen);

      const routePath = callText.match(/^\(\s*"([^"]*)"/)?.[1] ?? "";
      const fullPath =
        routePath === "/" || routePath === ""
          ? `${API_PREFIX}/${mount}`
          : `${API_PREFIX}/${mount}${routePath}`;

      const auth: BackendRouteInfo["auth"] = /\brequireAuth\b/.test(callText)
        ? "required"
        : /\boptionalAuth\b/.test(callText)
          ? "optional"
          : "none";

      const bodySchema = callText.match(/validateBody\(\s*(\w+)/)?.[1];
      const querySchema = callText.match(/validateQuery\(\s*(\w+)/)?.[1];
      const paramsSchema = callText.match(/validateParams\(\s*(\w+)/)?.[1];
      const rateLimiter = callText
        .match(/\b(authRateLimit|contactRateLimit)\b/)?.[1]
        ?.replace("RateLimit", "");

      // Response shape heuristics from the handler body.
      // Handlers may contain several res.json(...) calls (e.g. an early
      // 400 error branch before the success path) — prefer a call whose
      // body is a standard envelope ({ data ... }), else use the last one.
      const jsonRe = /res\.(?:status\((\w+)\)\s*\.\s*)?json\(/g;
      const jsonMatches: RegExpExecArray[] = [];
      let jm: RegExpExecArray | null;
      while ((jm = jsonRe.exec(callText)) !== null) jsonMatches.push(jm);
      const isEnd204 = /res\.status\(204\)\s*\.\s*end\(\)/.test(callText);

      let envelope: BackendRouteInfo["envelope"] = "custom";
      const customKeys: string[] = [];
      const successStatus: number[] = [];

      const windowAfter = (m: RegExpExecArray): string =>
        callText.slice(
          (m.index ?? 0) + m[0].length,
          (m.index ?? 0) + m[0].length + 160,
        );
      const numericStatus = (m: RegExpExecArray): number | undefined => {
        const s = m[1];
        return s && /^\d+$/.test(s) ? Number(s) : undefined;
      };

      if (isEnd204) {
        envelope = "empty";
        successStatus.push(204);
      } else if (jsonMatches.length > 0) {
        const chosen =
          jsonMatches.find((m) => /^\s*\{\s*(?:\.\.\.)?\s*data\b/.test(
            windowAfter(m),
          )) ?? jsonMatches[jsonMatches.length - 1];
        const afterParen = windowAfter(chosen);
        const hasData = /^\s*\{\s*(?:\.\.\.)?\s*data\b/.test(afterParen);
        const hasMeta = /\bmeta\s*:/.test(afterParen);
        if (hasData && hasMeta) envelope = "data-meta";
        else if (hasData) envelope = "data";
        else {
          envelope = "custom";
          for (const k of afterParen.matchAll(
            /(?:^|[,{]\s*)([A-Za-z_$][\w$]*)\s*[:,}]/g,
          )) {
            if (k[1] !== "true" && k[1] !== "false") customKeys.push(k[1]);
            if (customKeys.length >= 6) break;
          }
        }
        const st = numericStatus(chosen);
        if (st !== undefined) successStatus.push(st);
      }
      if (successStatus.length === 0 && jsonMatches.length > 0) {
        successStatus.push(200);
      }

      routes.push({
        method,
        path: fullPath,
        module,
        auth,
        bodySchema,
        querySchema,
        paramsSchema,
        rateLimiter,
        envelope,
        customKeys,
        successStatus,
        persisted,
      });
    }
  }
  return routes;
}

// ─── Frontend walk (Next.js src/app/api/**) ───────────────────────────────

function collectRouteFiles(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectRouteFiles(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
}

/** Walk the Next.js API routes under <repo>/src/app/api. */
export function walkFrontendRoutes(): FrontendRouteInfo[] {
  const apiDir = join(REPO_ROOT, "src/app/api");
  const files: string[] = [];
  collectRouteFiles(apiDir, files);

  const routes: FrontendRouteInfo[] = [];
  for (const file of files) {
    const rel = file.slice(apiDir.length).replace(/\/route\.ts$/, "");
    let path = rel.replace(/\[\.\.\.[\w$]+\]/, "*");
    path = path.replace(/\[([\w$]+)\]/g, ":$1");
    const src = read(file);
    const methodRe =
      /export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
    for (const m of src.matchAll(methodRe)) {
      routes.push({ method: m[1], path: `/api${path}`, file });
    }
  }
  return routes;
}
