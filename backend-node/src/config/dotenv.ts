/**
 * Minimal `.env` loader for server boot (issue #208).
 *
 * Why this exists: `tsx` does not auto-load `.env` (unlike Next.js or
 * Bun). Before this module, `bun run dev` only worked with every value
 * exported in the shell — the documented `cp .env.example .env` +
 * `bun run dev` quickstart booted straight into
 * "[env] JWT_SECRET: received undefined".
 *
 * `node --env-file=.env` would cover node ≥ 20.6 but (a) hard-fails
 * when the file is absent on node < 22.9 — a fresh clone without `.env`
 * would crash with ENOENT — and (b) is unavailable on node 18, which
 * `engines` still allows. This loader is ~40 dependency-free lines and
 * behaves identically on every supported runtime, so it ships instead.
 *
 * Semantics mirror node's `--env-file`:
 *   - the file is resolved from `process.cwd()` (`backend-node/.env`),
 *   - variables already present in the environment are NOT overridden —
 *     the shell wins, so an ambient `DATABASE_URL` (CI, sandbox) keeps
 *     pointing wherever the operator aimed it,
 *   - a missing `.env` is silently skipped (schema defaults still apply
 *     and required vars still fail fast via the env loader).
 *
 * ─── Import-order contract ────────────────────────────────────────────
 * This module MUST be the FIRST import of the server entrypoint
 * (`src/index.ts`): ESM evaluates imports in declaration order, and
 * `config/constants.ts` reads the validated `env` at module scope. Any
 * other entrypoint that loads `.env` first must follow the same rule.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Parse the contents of a dotenv-style file into key/value pairs.
 *
 * Supported (the intersection of shell-dotenv conventions that a
 * hand-maintained `.env` realistically uses):
 *   - `#` full-line comments and blank lines,
 *   - optional `export ` prefix,
 *   - `KEY=VALUE` with optional surrounding single/double quotes,
 *   - inline `#` comments outside of quotes,
 *   - CRLF line endings.
 *
 * NOT supported (deliberately — the backend `.env` never uses them):
 * multi-line values, variable interpolation, escape sequences. An
 * unexpected line is skipped rather than thrown: a boot that ignores
 * one malformed line and fails fast on the missing required var (with
 * the env loader's precise message) beats a cryptic parser crash.
 */
export function parseDotenv(source: string): Array<[key: string, value: string]> {
  const entries: Array<[string, string]> = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    // Optional `export ` prefix (shell-export pastes).
    const withoutExport = line.startsWith("export ") ? line.slice(7) : line;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) continue; // no `=`, or an empty key — skip

    const key = withoutExport.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = withoutExport.slice(eq + 1).trim();

    // Strip matching surrounding quotes (double quotes keep inner text
    // verbatim, matching node --env-file for our simple values).
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    } else {
      // Inline comment outside quotes: `PORT=4000 # dev`.
      const hash = value.indexOf(" #");
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    entries.push([key, value]);
  }

  return entries;
}

/**
 * Apply parsed entries to a target object (default `process.env`),
 * without overriding variables that are already set.
 */
export function applyDotenv(
  entries: Array<[string, string]>,
  target: Record<string, string | undefined> = process.env,
): void {
  for (const [key, value] of entries) {
    if (target[key] === undefined) {
      target[key] = value;
    }
  }
}

/**
 * Load `.env` from `cwd` (default: `process.cwd()`) if it exists and
 * apply it to `target` (default: `process.env`). Exported for tests;
 * the entrypoint imports this module for the side effect below.
 */
export function loadDotenv(
  cwd: string = process.cwd(),
  target: Record<string, string | undefined> = process.env,
): void {
  const path = join(cwd, ".env");
  let source: string;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    return; // no .env — defaults/schema validation handle it
  }
  applyDotenv(parseDotenv(source), target);
}

// Boot side effect — see "Import-order contract" above.
loadDotenv();
