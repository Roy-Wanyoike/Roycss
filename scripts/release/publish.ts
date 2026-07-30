#!/usr/bin/env bun
/**
 * RoyCSS release — publish orchestrator.
 *
 * Orchestrates the full publish flow:
 *
 *   1. Run `bun run lint`            — must pass (exit 0)
 *   2. Run `bun run scripts/build-package.ts` — must pass (rebuilds dist/)
 *   3. Run `npm publish --dry-run`   — must pass (verifies tarball)
 *   4. If --execute:
 *        - Run `npm publish --provenance --access public`
 *        - On success: create git tag `v<version>`
 *        - Print reminder to push the tag (this triggers CI to publish)
 *      Else:
 *        - Stop. Print the dry-run summary.
 *   5. Print a final summary table.
 *
 * Usage:
 *
 *   bun run scripts/release/publish.ts             # dry-run (default)
 *   bun run scripts/release/publish.ts --execute   # real publish + git tag
 *
 * The --execute flag is the ONLY path to the real registry. CI is the
 * only place it is permitted (CI's publish is the actual npm publish —
 * this script's --execute is for emergency local publishes, which will
 * lack provenance).
 *
 * Exit codes:
 *   0 — lint + build + dry-run all passed (or --execute succeeded)
 *   1 — any step failed
 */

import { execSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  cpSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import {
  MANIFEST_PATH,
  PACKAGE_NAME,
  ACCESS,
  PROVENANCE,
  TARBALL_MAX_KB,
  FILE_COUNT_MAX,
  C,
  banner,
  ok,
  warn,
  fail,
  bytes,
} from "./release.config";

// ── Helpers ─────────────────────────────────────────────────────────
interface StepResult {
  name: string;
  passed: boolean;
  durationMs: number;
  detail?: string;
}

function runStep(name: string, cmd: string, cwd: string): StepResult {
  const start = Date.now();
  try {
    const out = execSync(cmd, { cwd, stdio: "pipe", encoding: "utf-8", env: process.env });
    return { name, passed: true, durationMs: Date.now() - start, detail: out };
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    const detail = (e.stderr || e.stdout || e.message || "").toString();
    return { name, passed: false, durationMs: Date.now() - start, detail };
  }
}

function getCurrentVersion(): string {
  const pkg = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as { version: string };
  return pkg.version;
}

// ── Parse npm publish --dry-run output ─────────────────────────────
interface PackInfo {
  filename: string;
  sizeBytes: number;
  unpackedBytes: number;
  fileCount: number;
  files: { path: string; size: number }[];
}

function parseDryRunOutput(stdout: string, stderr: string): PackInfo | null {
  // `npm publish --dry-run --json` prints JSON to stdout (npm 7+).
  // Without --json, it prints a human-readable summary. We try --json
  // first; fall back to parsing the human output.
  const combined = stdout + "\n" + stderr;

  // Try JSON.
  const jsonMatch = combined.match(/^\[\s*\{[\s\S]*?\}\s*\]/m);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        filename?: string;
        name?: string;
        version?: string;
        size?: number;
        unpackedSize?: number;
        entryCount?: number;
        files?: { path: string; size: number; mode: number }[];
      }>;
      const r = parsed[0];
      if (r) {
        return {
          filename: r.filename ?? `${PACKAGE_NAME}-${r.version ?? "0.0.0"}.tgz`,
          sizeBytes: r.size ?? 0,
          unpackedBytes: r.unpackedSize ?? 0,
          fileCount: r.entryCount ?? r.files?.length ?? 0,
          files: (r.files ?? []).map((f) => ({ path: f.path, size: f.size })),
        };
      }
    } catch {
      // fall through to human-parse
    }
  }

  // Human-readable parse: look for "npm notice" lines.
  const filenameMatch = combined.match(/npm notice\s+(\d+\.\d+\s+[KM]?B)\s+(\S+\.tgz)/);
  const sizeMatch = combined.match(/npm notice\s+package size:\s+([\d.]+)\s+([KM]?B)/i);
  const unpackedMatch = combined.match(/npm notice\s+unpacked size:\s+([\d.]+)\s+([KM]?B)/i);
  const totalFilesMatch = combined.match(/npm notice\s+total files:\s+(\d+)/i);

  if (!sizeMatch && !unpackedMatch) return null;

  const parseSize = (n: string, unit: string): number => {
    const v = parseFloat(n);
    if (/^k/i.test(unit)) return v * 1024;
    if (/^m/i.test(unit)) return v * 1024 * 1024;
    return v;
  };

  return {
    filename: filenameMatch?.[2] ?? `${PACKAGE_NAME}.tgz`,
    sizeBytes: sizeMatch ? parseSize(sizeMatch[1], sizeMatch[2]) : 0,
    unpackedBytes: unpackedMatch ? parseSize(unpackedMatch[1], unpackedMatch[2]) : 0,
    fileCount: totalFilesMatch ? parseInt(totalFilesMatch[1], 10) : 0,
    files: [],
  };
}

// ── Argument parsing ────────────────────────────────────────────────
function parseArgs(argv: string[]): { execute: boolean } {
  let execute = false;
  for (const a of argv) {
    if (a === "--execute") execute = true;
    else if (a === "--help" || a === "-h") {
      console.log(`
RoyCSS publish orchestrator — runs lint + build + npm publish --dry-run,
optionally publishing for real with --execute.

Usage:
  bun run scripts/release/publish.ts             # dry-run (default)
  bun run scripts/release/publish.ts --execute   # real publish + git tag

Steps:
  1. bun run lint
  2. bun run scripts/build-package.ts
  3. npm publish --dry-run
  4. (with --execute only) npm publish --provenance --access public
  5. (with --execute only) git tag v<version>

Environment:
  NPM_TOKEN — required for --execute (CI sets this; locals need it for
              emergency publishes). The dry-run does NOT need it.
`.trim());
      process.exit(0);
    } else {
      fail(`unknown argument: ${a} (try --help)`);
      process.exit(1);
    }
  }
  return { execute };
}

// ── Main ────────────────────────────────────────────────────────────
function main(): void {
  const { execute } = parseArgs(process.argv.slice(2));
  const version = getCurrentVersion();
  const cwd = process.cwd();

  banner(`RoyCSS publish — v${version}${execute ? "  [EXECUTE]" : "  [DRY RUN]"}`);

  if (execute && !process.env.NPM_TOKEN) {
    fail("--execute requires NPM_TOKEN in the environment (set in CI secrets, or");
    fail("for an emergency local publish: NPM_TOKEN=xxx bun run scripts/release/publish.ts --execute)");
    process.exit(1);
  }

  const steps: StepResult[] = [];

  // ── Step 1: lint ──────────────────────────────────────────────────
  console.log(`${C.cyan}${C.bold}[1/3]${C.reset} Running \`bun run lint\`…`);
  const lint = runStep("lint", "bun run lint", cwd);
  steps.push(lint);
  if (lint.passed) {
    ok(`lint passed (${lint.durationMs} ms)`);
  } else {
    fail("lint failed — see output below:");
    console.log(lint.detail);
    process.exit(1);
  }

  // ── Step 2: build ─────────────────────────────────────────────────
  console.log(`\n${C.cyan}${C.bold}[2/3]${C.reset} Running \`bun run scripts/build-package.ts\`…`);
  const build = runStep("build", "bun run scripts/build-package.ts", cwd);
  steps.push(build);
  if (build.passed) {
    ok(`build passed (${build.durationMs} ms)`);
  } else {
    fail("build failed — see output below:");
    console.log(build.detail);
    process.exit(1);
  }

  // ── Step 3: npm publish --dry-run ─────────────────────────────────
  // npm reads `package.json` from cwd — but our project root has the
  // Next.js app's package.json, not the publishable package. We mirror
  // the prepare.ts pattern: copy package.roycss.json + the `files`
  // array entries to a temp dir, run `npm publish --dry-run` there.
  console.log(`\n${C.cyan}${C.bold}[3/3]${C.reset} Running \`npm publish --dry-run\`…`);
  console.log(`${C.dim}  (running in an isolated temp dir — npm reads package.roycss.json as package.json)${C.reset}`);

  const pkg = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as {
    files?: string[];
    version: string;
  };
  const filesArray: string[] = Array.isArray(pkg.files) ? pkg.files : [];

  const TMP = join(tmpdir(), `roycss-publish-${Date.now()}`);
  mkdirSync(TMP, { recursive: true });

  let packInfo: PackInfo | null = null;
  try {
    // Copy package.roycss.json → temp/package.json
    writeFileSync(join(TMP, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");

    // Copy every entry in the `files` array from project root → temp dir.
    for (const entry of filesArray) {
      const src = join(cwd, entry);
      const dst = join(TMP, entry);
      if (existsSync(src)) {
        mkdirSync(dirname(dst), { recursive: true });
        cpSync(src, dst, { recursive: true });
      } else {
        fail(`files array entry not found on disk: ${entry}`);
        process.exit(1);
      }
    }

    // Run `npm publish --dry-run --json` in the temp dir.
    // `--ignore-scripts` skips the package's own `prepublishOnly` hook —
    // we already ran `bun run scripts/build-package.ts` in step 2, so
    // there's no need to re-run it (and the temp dir doesn't have the
    // scripts/ source, so it would fail anyway).
    const dryRunStart = Date.now();
    try {
      const out = execSync("npm publish --dry-run --ignore-scripts --json 2>&1", {
        cwd: TMP,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      });
      packInfo = parseDryRunOutput(out, "");
      ok(`dry-run passed (${Date.now() - dryRunStart} ms)`);
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      const combined = (e.stdout || "") + "\n" + (e.stderr || "");
      fail("npm publish --dry-run failed — see output below:");
      console.log(combined);
      packInfo = parseDryRunOutput(e.stdout || "", e.stderr || "");
      process.exit(1);
    }
  } finally {
    // Always clean up the temp dir.
    rmSync(TMP, { recursive: true, force: true });
  }

  if (packInfo) {
    console.log("");
    console.log(`${C.bold}  Tarball summary${C.reset}`);
    console.log(`    filename:    ${C.cyan}${packInfo.filename}${C.reset}`);
    console.log(`    compressed:  ${C.bold}${bytes(packInfo.sizeBytes)}${C.reset}  (${(packInfo.sizeBytes / 1024).toFixed(1)} KB)`);
    console.log(`    unpacked:    ${bytes(packInfo.unpackedBytes)}  (${(packInfo.unpackedBytes / 1024).toFixed(1)} KB)`);
    console.log(`    file count:  ${packInfo.fileCount}`);
    if (packInfo.files.length > 0) {
      console.log(`    ${C.dim}files:${C.reset}`);
      for (const f of packInfo.files) {
        console.log(`      ${f.path.padEnd(40)} ${bytes(f.size).padStart(10)}`);
      }
    }
    console.log("");
    // Benchmark gates (informational — warnings, not failures).
    const compressedKB = packInfo.sizeBytes / 1024;
    if (compressedKB > TARBALL_MAX_KB) {
      warn(`compressed tarball ${compressedKB.toFixed(1)} KB exceeds ${TARBALL_MAX_KB} KB target`);
    } else {
      ok(`compressed tarball ≤ ${TARBALL_MAX_KB} KB target`);
    }
    if (packInfo.fileCount > FILE_COUNT_MAX) {
      warn(`file count ${packInfo.fileCount} exceeds ${FILE_COUNT_MAX} target`);
    } else if (packInfo.fileCount > 0) {
      ok(`file count ≤ ${FILE_COUNT_MAX} target`);
    }
  }

  // ── Step 4 (only with --execute): real publish + git tag ─────────
  if (!execute) {
    console.log("");
    banner("DRY RUN COMPLETE — publish NOT executed");
    console.log(`  ${C.dim}To publish for real, run:${C.reset}`);
    console.log(`  ${C.cyan}${C.bold}bun run scripts/release/publish.ts --execute${C.reset}`);
    console.log(`  ${C.dim}(or push a v${version} git tag to trigger CI)${C.reset}`);
    console.log("");
    process.exit(0);
  }

  // Real publish path. We re-use the temp-dir pattern: npm publish must
  // read package.roycss.json (not the Next.js package.json at the root),
  // so we run it from an isolated temp dir with package.roycss.json copied
  // to package.json. This is the same pattern used by the dry-run step
  // and by scripts/publish/prepare.ts.
  console.log(`\n${C.magenta}${C.bold}═══ EXECUTE: npm publish ═══${C.reset}`);
  console.log(`  ${C.dim}package:  ${PACKAGE_NAME}@${version}${C.reset}`);
  console.log(`  ${C.dim}access:   ${ACCESS}${C.reset}`);
  console.log(`  ${C.dim}provenance: ${PROVENANCE ? "yes (Sigstore)" : "no"}${C.reset}`);
  console.log("");

  // Note: in CI, npm publish is invoked by the GitHub Actions workflow
  // (with --provenance and NODE_AUTH_TOKEN from secrets). This local
  // --execute path is for emergencies only and will NOT have provenance
  // (no GitHub OIDC token locally).
  if (PROVENANCE && !process.env.CI) {
    warn("local publish — Sigstore provenance will NOT be attached");
    warn("(provenance requires GitHub Actions OIDC — CI is the provenance path)");
    console.log("");
  }

  // Rebuild the temp dir (the dry-run temp dir was already cleaned up).
  const PUB_TMP = join(tmpdir(), `roycss-pub-${Date.now()}`);
  mkdirSync(PUB_TMP, { recursive: true });
  try {
    writeFileSync(join(PUB_TMP, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
    for (const entry of filesArray) {
      const src = join(cwd, entry);
      const dst = join(PUB_TMP, entry);
      if (existsSync(src)) {
        mkdirSync(dirname(dst), { recursive: true });
        cpSync(src, dst, { recursive: true });
      }
    }

    // `--ignore-scripts` skips prepublishOnly (we already built in step 2).
    const publishCmd = `npm publish --ignore-scripts --access ${ACCESS}${PROVENANCE ? " --provenance" : ""}`;
    console.log(`${C.dim}  $ ${publishCmd}  (in temp dir)${C.reset}`);
    const pubStart = Date.now();
    try {
      execSync(publishCmd, { cwd: PUB_TMP, stdio: "inherit", env: process.env });
      ok(`npm publish succeeded (${Date.now() - pubStart} ms)`);
    } catch (err) {
      fail(`npm publish failed: ${(err as Error).message}`);
      process.exit(1);
    }
  } finally {
    rmSync(PUB_TMP, { recursive: true, force: true });
  }

  // Step 5: git tag
  console.log(`\n${C.magenta}${C.bold}═══ git tag v${version} ═══${C.reset}`);
  try {
    // Check if tag already exists.
    try {
      execSync(`git rev-parse -q --verify refs/tags/v${version}`, { cwd, stdio: "ignore" });
      warn(`git tag v${version} already exists — skipping creation`);
    } catch {
      execSync(`git tag -a v${version} -m "Release v${version}"`, { cwd, stdio: "inherit" });
      ok(`created git tag v${version}`);
    }
  } catch (err) {
    fail(`git tag creation failed: ${(err as Error).message}`);
    warn("(non-fatal — the npm publish already succeeded)");
  }

  // Final summary.
  console.log("");
  banner(`PUBLISHED ${PACKAGE_NAME}@${version}`);
  console.log(`  ${C.green}✓ npm:      https://www.npmjs.com/package/${PACKAGE_NAME}/v/${version}${C.reset}`);
  console.log(`  ${C.green}✓ git tag:  v${version}${C.reset}`);
  console.log("");
  console.log(`  ${C.bold}Next:${C.reset}`);
  console.log(`    git push origin v${version}`);
  console.log(`    ${C.dim}(triggers .github/workflows/release.yml to verify + re-publish from CI with provenance)${C.reset}`);
  console.log("");
  if (PROVENANCE && !process.env.CI) {
    warn("this publish was local — no Sigstore provenance attached");
    warn(`consider pushing the tag so CI re-publishes with provenance, OR run:`);
    console.log(`    ${C.cyan}npm deprecate ${PACKAGE_NAME}@${version} "superseded by provenance-attested CI publish"${C.reset}`);
    console.log(`    ${C.dim}(after CI publishes the same version, this is a no-op)${C.reset}`);
  }
  process.exit(0);
}

main();
