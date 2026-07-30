#!/usr/bin/env bun
/**
 * RoyCSS CLI v2 — Command-line tool for managing CSS effects
 *
 * Usage:
 *   roycss init                    Initialize RoyCSS in your project
 *   roycss add <effect-id>         Add an effect's CSS to your project
 *   roycss search <query>          Search for effects by name/tag/category
 *   roycss list [category]         List all effects or filter by category
 *   roycss categories              List all categories
 *   roycss info <effect-id>        Show details about a specific effect
 *   roycss doctor                  Check project health and get recommendations
 *   roycss create <name>           Scaffold a new project with RoyCSS pre-installed
 *   roycss upgrade                 Scan for outdated RoyCSS versions and deprecated patterns
 *   roycss stats                   Report project usage analytics for RoyCSS effects
 *   roycss browse [category]       Interactive TUI browser for effects
 *   roycss export <id> [id...]     Export a subset of effects to a CSS file
 *   roycss plugin <action>         List/enable/disable/init plugins in .roycss/plugins/
 *   roycss version                 Show CLI version
 *   roycss help                    Show help
 *
 * Flags:
 *   --copy                         Copy CSS to clipboard instead of creating a file
 *   --tag <tag>                    Filter by tag (use with list/search/export)
 *   --framework <framework>        Show framework-specific usage (use with info/init)
 *   --json                         Output as JSON (use with search/list/stats)
 *   --force                        Overwrite existing files (use with init/create)
 *   --template <t>                 Project template (use with create)
 *   --effect <id>                  Initial effect to include (use with create)
 *   --category <cat>               Export all effects in category (use with export)
 *   --out <file>                   Output file path (use with export)
 *   --name <plugin-name>           Plugin name (use with plugin enable/disable)
 */

import { effects, categoryMeta, categoryOrder } from "../lib/roycss-effects";
import type { CSSEffect, EffectCategory } from "../lib/roycss-effects";
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  renameSync,
} from "fs";
import { join, dirname, resolve, extname, relative } from "path";
import * as readline from "readline";

// ═══════════════════════════════════════════════════════════════
// Terminal colors
// ═══════════════════════════════════════════════════════════════

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  underline: "\x1b[4m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  bg: "\x1b[48;5;22m",
};

function log(msg: string) { console.log(msg); }
function success(msg: string) { console.log(`${c.green}✓${c.reset} ${msg}`); }
function error(msg: string) { console.error(`${c.red}✗${c.reset} ${msg}`); }
function info(msg: string) { console.log(`${c.cyan}ℹ${c.reset} ${msg}`); }
function warn(msg: string) { console.log(`${c.yellow}⚠${c.reset} ${msg}`); }

const VERSION = "2.0.0";

// ═══════════════════════════════════════════════════════════════
// Helper: parse flags from args
// ═══════════════════════════════════════════════════════════════

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

// ═══════════════════════════════════════════════════════════════
// Helper: copy to clipboard
// ═══════════════════════════════════════════════════════════════

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const proc = Bun.spawn(["xclip", "-selection", "clipboard"], {
      stdin: "pipe",
      stdout: "null",
      stderr: "null",
    });
    proc.stdin.write(text);
    proc.stdin.end();
    await proc.exited;
    return true;
  } catch {
    try {
      const proc = Bun.spawn(["pbcopy"], {
        stdin: "pipe",
        stdout: "null",
        stderr: "null",
      });
      proc.stdin.write(text);
      proc.stdin.end();
      await proc.exited;
      return true;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper: resolve a category arg (id or label) to category id
// ═══════════════════════════════════════════════════════════════

function resolveCategory(arg: string): EffectCategory | undefined {
  return categoryOrder.find(
    (cat) => cat === arg || categoryMeta[cat].label.toLowerCase() === arg.toLowerCase(),
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper: recursively scan a directory for files matching extensions
// ═══════════════════════════════════════════════════════════════

const SOURCE_EXTENSIONS = new Set([".html", ".tsx", ".jsx", ".vue", ".svelte", ".ts", ".js", ".css", ".htm"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache", "coverage", ".turbo"]);

function scanSourceFiles(dirs: string[]): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        if (SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
          results.push(fullPath);
        }
      }
    }
  }

  for (const dir of dirs) {
    if (existsSync(dir)) walk(dir);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// Commands (v1)
// ═══════════════════════════════════════════════════════════════

function cmdInit(flags: Record<string, string | boolean>) {
  const framework = (flags.framework as string) || "vanilla";

  log(`${c.bold}${c.cyan}RoyCSS${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  log(`${c.dim}Initializing RoyCSS in your project...${c.reset}\n`);

  // Check if CSS file already exists
  const cssPath = "roycss.css";
  if (existsSync(cssPath) && !flags.force) {
    info(`roycss.css already exists. Use ${c.cyan}--force${c.reset} to overwrite.`);
  } else {
    // Generate the full CSS file with all effects
    const allCSS = effects.map((e) => e.cssCode).join("\n\n");
    const header = `/* RoyCSS — ${effects.length}+ CSS Effects\n * Generated by: roycss init\n * Framework: ${framework}\n * Learn more: https://github.com/Roy-Wanyoike/roycss\n */\n\n`;
    writeFileSync(cssPath, header + allCSS);
    success(`Created ${c.bold}roycss.css${c.reset} with ${effects.length}+ effects`);
  }

  // Framework-specific instructions
  const frameworkInstructions: Record<string, string[]> = {
    vanilla: [
      `Import the CSS:`,
      `  ${c.cyan}<link rel="stylesheet" href="roycss.css" />${c.reset}`,
    ],
    react: [
      `Import in your entry file (src/main.tsx):`,
      `  ${c.cyan}import "./roycss.css";${c.reset}`,
    ],
    vue: [
      `Import in src/main.ts:`,
      `  ${c.cyan}import "./roycss.css";${c.reset}`,
    ],
    angular: [
      `Add to angular.json styles array:`,
      `  ${c.cyan}"roycss.css"${c.reset}`,
    ],
    svelte: [
      `Import in src/main.ts:`,
      `  ${c.cyan}import "./roycss.css";${c.reset}`,
    ],
    nextjs: [
      `Import in src/app/layout.tsx:`,
      `  ${c.cyan}import "./roycss.css";${c.reset}`,
    ],
  };

  log(`\n${c.bold}Next steps (${framework}):${c.reset}`);
  (frameworkInstructions[framework] || frameworkInstructions.vanilla).forEach((line) =>
    log(`  ${line}`),
  );

  log(`\n  ${c.gray}Use any effect:${c.reset}`);
  log(`  ${c.cyan}<div class="roycss-pulse-glow">Hello</div>${c.reset}`);

  log(`\n  ${c.gray}Search for effects:${c.reset}`);
  log(`  ${c.cyan}roycss search glow${c.reset}`);

  log(`\n  ${c.gray}Add a specific effect only:${c.reset}`);
  log(`  ${c.cyan}roycss add pulse-glow${c.reset}`);

  log(`\n  ${c.gray}Scaffold a full project:${c.reset}`);
  log(`  ${c.cyan}roycss create my-app --template react${c.reset}`);

  log(`\n${c.green}Done!${c.reset} Visit ${c.cyan}https://github.com/Roy-Wanyoike/roycss${c.reset} for docs.`);
}

async function cmdAdd(effectId: string, flags: Record<string, string | boolean>) {
  const effect = effects.find((e) => e.id === effectId);
  if (!effect) {
    // Fuzzy match
    const fuzzy = effects.filter(
      (e) => e.id.includes(effectId) || effectId.includes(e.id),
    );
    error(`Effect "${effectId}" not found.`);
    if (fuzzy.length > 0) {
      log(`\n  ${c.dim}Did you mean?${c.reset}`);
      fuzzy.slice(0, 5).forEach((e) => {
        log(`    ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name}`);
      });
    }
    process.exit(1);
  }

  // --copy flag: copy to clipboard
  if (flags.copy) {
    const copied = await copyToClipboard(effect.cssCode);
    if (copied) {
      success(`Copied ${c.bold}roycss-${effect.id}${c.reset} CSS to clipboard`);
    } else {
      warn(`Could not copy to clipboard. Outputting to stdout:\n`);
      log(effect.cssCode);
    }
    return;
  }

  // Write just this effect's CSS
  const fileName = `roycss-${effectId}.css`;
  writeFileSync(fileName, effect.cssCode);
  success(`Created ${c.bold}${fileName}${c.reset}`);

  log(`\n${c.dim}Usage:${c.reset}`);
  log(`  ${c.gray}// Import in your CSS${c.reset}`);
  log(`  ${c.cyan}@import "roycss-${effectId}.css";${c.reset}`);
  log(`\n  ${c.gray}// HTML${c.reset}`);
  log(`  ${c.cyan}<div class="roycss-${effectId}">${effect.previewText || "Content"}</div>${c.reset}`);

  if (effect.childCount) {
    log(`\n  ${c.yellow}⚠ This effect requires ${effect.childCount} child <span> elements:${c.reset}`);
    log(`  ${c.cyan}<div class="roycss-${effectId}">${c.reset}`);
    for (let i = 0; i < effect.childCount; i++) {
      log(`    ${c.cyan}<span></span>${c.reset}`);
    }
    log(`  ${c.cyan}</div>${c.reset}`);
  }
}

function cmdSearch(query: string, flags: Record<string, string | boolean>) {
  const q = query.toLowerCase();
  let results = effects.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.category.includes(q) ||
      e.id.includes(q),
  );

  // Filter by tag
  if (flags.tag) {
    const tag = (flags.tag as string).toLowerCase();
    results = results.filter((e) => e.tags.some((t) => t.toLowerCase().includes(tag)));
  }

  // JSON output
  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          query,
          tag: flags.tag || null,
          totalFound: results.length,
          effects: results.slice(0, 50).map((e) => ({
            id: e.id,
            name: e.name,
            category: categoryMeta[e.category].label,
            description: e.description,
            tags: e.tags,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (results.length === 0) {
    log(`${c.gray}No effects found for "${query}".${c.reset}`);
    log(`${c.dim}Try: ${categoryOrder.slice(0, 5).join(", ")}...${c.reset}`);
    return;
  }

  log(`${c.bold}Found ${results.length} effect${results.length === 1 ? "" : "s"} for "${query}"${flags.tag ? ` tagged "${flags.tag}"` : ""}:${c.reset}\n`);

  results.slice(0, 20).forEach((e) => {
    const catLabel = categoryMeta[e.category].label;
    log(`  ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name} ${c.dim}(${catLabel})${c.reset}`);
  });

  if (results.length > 20) {
    log(`\n  ${c.dim}...and ${results.length - 20} more. Use ${c.reset}${c.cyan}--json${c.reset}${c.dim} for full results.${c.reset}`);
  }

  log(`\n${c.dim}Add an effect: ${c.reset}${c.cyan}roycss add <effect-id>${c.reset}`);
}

function cmdList(category: string | undefined, flags: Record<string, string | boolean>) {
  // JSON output
  if (flags.json) {
    if (category) {
      const cat = resolveCategory(category);
      if (!cat) {
        error(`Category "${category}" not found.`);
        process.exit(1);
      }
      const items = effects.filter((e) => e.category === cat);
      console.log(JSON.stringify({ category: cat, count: items.length, effects: items.map((e) => ({ id: e.id, name: e.name, description: e.description })) }, null, 2));
    } else {
      console.log(
        JSON.stringify(
          {
            totalEffects: effects.length,
            categories: categoryOrder.map((cat) => ({
              id: cat,
              label: categoryMeta[cat].label,
              count: effects.filter((e) => e.category === cat).length,
            })),
          },
          null,
          2,
        ),
      );
    }
    return;
  }

  if (category) {
    const cat = resolveCategory(category);
    if (!cat) {
      error(`Category "${category}" not found.`);
      log(`  Available: ${categoryOrder.join(", ")}`);
      process.exit(1);
    }
    const items = effects.filter((e) => e.category === cat);
    log(`${c.bold}${categoryMeta[cat].label} (${items.length}):${c.reset}\n`);
    items.forEach((e) => {
      log(`  ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.description.substring(0, 60)}`);
    });
  } else {
    log(`${c.bold}All ${effects.length}+ RoyCSS effects across ${categoryOrder.length} categories:${c.reset}\n`);
    for (const cat of categoryOrder) {
      const items = effects.filter((e) => e.category === cat);
      log(`  ${c.magenta}${categoryMeta[cat].label}${c.reset} ${c.dim}(${items.length})${c.reset}`);
      items.slice(0, 3).forEach((e) => {
        log(`    ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name}`);
      });
      if (items.length > 3) {
        log(`    ${c.dim}...and ${items.length - 3} more${c.reset}`);
      }
      log("");
    }
  }
}

function cmdCategories() {
  log(`${c.bold}RoyCSS Categories (${categoryOrder.length}):${c.reset}\n`);
  for (const cat of categoryOrder) {
    const count = effects.filter((e) => e.category === cat).length;
    log(`  ${c.magenta}${categoryMeta[cat].label}${c.reset} ${c.dim}(${count})${c.reset} — ${categoryMeta[cat].description}`);
  }
  log(`\n${c.dim}Total: ${effects.length}+ effects${c.reset}`);
  log(`${c.dim}Browse: ${c.reset}${c.cyan}roycss list <category>${c.reset}`);
  log(`${c.dim}Interactive: ${c.reset}${c.cyan}roycss browse <category>${c.reset}`);
}

function cmdInfo(effectId: string, flags: Record<string, string | boolean>) {
  const effect = effects.find((e) => e.id === effectId);
  if (!effect) {
    // Fuzzy match
    const fuzzy = effects.filter(
      (e) => e.id.includes(effectId) || effectId.includes(e.id),
    );
    error(`Effect "${effectId}" not found.`);
    if (fuzzy.length > 0) {
      log(`\n  ${c.dim}Did you mean?${c.reset}`);
      fuzzy.slice(0, 5).forEach((e) => {
        log(`    ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name}`);
      });
    }
    process.exit(1);
  }

  log(`${c.bold}${c.cyan}${effect.name}${c.reset} ${c.dim}(roycss-${effect.id})${c.reset}`);
  log(`\n${c.bold}Description:${c.reset} ${effect.description}`);
  log(`${c.bold}Category:${c.reset} ${categoryMeta[effect.category].label}`);
  log(`${c.bold}Tags:${c.reset} ${effect.tags.join(", ")}`);
  log(`${c.bold}Preview Type:${c.reset} ${effect.previewType}`);
  if (effect.childCount) {
    log(`${c.bold}Child Elements:${c.reset} ${effect.childCount} <span> elements required`);
  }

  // Framework usage
  if (flags.framework) {
    const fw = (flags.framework as string).toLowerCase();
    const cls = `roycss-${effect.id}`;
    const examples: Record<string, string> = {
      react: `<button className="${cls}" type="button">${effect.name}</button>`,
      vue: `<button class="${cls}" type="button">${effect.name}</button>`,
      svelte: `<button class="${cls}">${effect.name}</button>`,
      angular: `<button class="${cls}" type="button">${effect.name}</button>`,
      vanilla: `<button class="${cls}">${effect.name}</button>`,
      nextjs: `<button className="${cls}" type="button">${effect.name}</button>`,
    };
    log(`\n${c.bold}${fw} usage:${c.reset}`);
    log(`  ${c.cyan}${examples[fw] || examples.vanilla}${c.reset}`);
  }

  log(`\n${c.bold}CSS:${c.reset}`);
  log(`${c.gray}${effect.cssCode}${c.reset}`);
  log(`\n${c.dim}Add to project: ${c.reset}${c.cyan}roycss add ${effect.id}${c.reset}`);
  log(`${c.dim}Copy to clipboard: ${c.reset}${c.cyan}roycss add ${effect.id} --copy${c.reset}`);
  log(`${c.dim}Export with others: ${c.reset}${c.cyan}roycss export ${effect.id}${c.reset}`);
}

function cmdVersion() {
  log(`RoyCSS CLI v${VERSION}`);
  log(`${c.dim}${effects.length}+ effects across ${categoryOrder.length} categories${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// Enhanced doctor (v2)
// ═══════════════════════════════════════════════════════════════

function cmdDoctor() {
  log(`${c.bold}${c.cyan}RoyCSS Doctor${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  log(`${c.dim}Checking project health...${c.reset}\n`);

  let issues = 0;
  let warnings = 0;

  // ─── Check 1: roycss.css exists? ───
  if (existsSync("roycss.css")) {
    success(`${c.bold}roycss.css${c.reset} found`);
    const stat = readFileSync("roycss.css");
    if (stat.length > 1000) {
      success(`CSS file size: ${(stat.length / 1024).toFixed(1)}KB`);
      if (stat.length > 1024 * 1024) {
        warn(`CSS file > 1MB — consider ${c.cyan}roycss export${c.reset} for tree-shaking`);
        warnings++;
      }
    } else {
      warn(`CSS file seems small (${stat.length} bytes) — may be incomplete`);
      issues++;
    }
  } else {
    if (existsSync("node_modules/roycss")) {
      success(`${c.bold}roycss${c.reset} package found in node_modules`);
    } else {
      warn(`${c.bold}roycss.css${c.reset} not found — run ${c.cyan}roycss init${c.reset} to create it`);
      issues++;
    }
  }

  // ─── Check 2: package.json has roycss? ───
  if (existsSync("package.json")) {
    try {
      const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.roycss) {
        success(`${c.bold}roycss${c.reset} found in package.json (${deps.roycss})`);
      } else {
        info(`${c.bold}roycss${c.reset} not in package.json — using CDN or local file`);
      }
    } catch {
      // ignore
    }
  }

  // ─── Check 3: CSS import in common entry points ───
  const entryPoints = [
    "src/main.tsx",
    "src/main.ts",
    "src/index.ts",
    "src/app/layout.tsx",
    "src/app/globals.css",
    "index.html",
    "angular.json",
  ];
  let foundImport = false;
  for (const ep of entryPoints) {
    if (existsSync(ep)) {
      const content = readFileSync(ep, "utf-8");
      if (content.includes("roycss")) {
        success(`RoyCSS import found in ${c.bold}${ep}${c.reset}`);
        foundImport = true;
        break;
      }
    }
  }
  if (!foundImport && existsSync("roycss.css")) {
    warn(`No RoyCSS import found in common entry points`);
    log(`  ${c.dim}Add to your entry file:${c.reset}`);
    log(`  ${c.cyan}import "./roycss.css";${c.reset}`);
    issues++;
  }

  // ─── Check 4: roycss classes in use? ───
  const usageMap = new Map<string, number>();
  const srcFiles = scanSourceFiles(["src", "app", "pages", "components"]);
  for (const file of srcFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      const matches = content.match(/roycss-[a-z0-9-]+/g);
      if (matches) {
        for (const m of matches) {
          usageMap.set(m, (usageMap.get(m) || 0) + 1);
        }
      }
    } catch {
      // ignore
    }
  }

  const totalUsages = [...usageMap.values()].reduce((a, b) => a + b, 0);
  if (totalUsages > 0) {
    success(`${c.bold}${totalUsages}${c.reset} RoyCSS class usage${totalUsages === 1 ? "" : "es"} found across ${usageMap.size} unique classes in ${srcFiles.length} source files`);
  } else {
    info(`No RoyCSS classes found in source files — start using them!`);
  }

  // ─── Check 5 (v2): unknown roycss-* classes (typos) ───
  const knownIds = new Set(effects.map((e) => `roycss-${e.id}`));
  const unknownClasses: string[] = [];
  for (const cls of usageMap.keys()) {
    if (!knownIds.has(cls)) {
      unknownClasses.push(cls);
    }
  }
  if (unknownClasses.length > 0) {
    warn(`${unknownClasses.length} unknown roycss-* class${unknownClasses.length === 1 ? "" : "es"} (possible typos):`);
    unknownClasses.slice(0, 5).forEach((cls) => {
      log(`    ${c.yellow}${cls}${c.reset}`);
    });
    if (unknownClasses.length > 5) {
      log(`    ${c.dim}...and ${unknownClasses.length - 5} more${c.reset}`);
    }
    warnings++;
  }

  // ─── Check 6 (v2): OKLCH compliance — scan for hex/rgba in user CSS ───
  let oklchViolations = 0;
  const userCssFiles = ["roycss.css", "src/app/globals.css", "src/index.css", "src/styles.css", "styles.css"];
  for (const cssFile of userCssFiles) {
    if (!existsSync(cssFile)) continue;
    try {
      const content = readFileSync(cssFile, "utf-8");
      // Skip the dist/generated roycss.css (already OKLCH) — check user-authored portions only
      if (content.includes("Generated by: roycss init")) continue;
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g);
      const rgbaMatches = content.match(/\brgba?\(/g);
      const total = (hexMatches?.length || 0) + (rgbaMatches?.length || 0);
      if (total > 0) {
        oklchViolations += total;
      }
    } catch {
      // ignore
    }
  }
  if (oklchViolations > 0) {
    warn(`Found ${oklchViolations} hex/rgba color literal${oklchViolations === 1 ? "" : "s"} in user CSS — RoyCSS v2 recommends ${c.cyan}oklch()${c.reset}`);
    log(`  ${c.dim}Run: ${c.reset}${c.cyan}bun run scripts/migrate-colors.ts${c.reset}`);
    warnings++;
  } else {
    success(`OKLCH compliance: no hex/rgba literals in user CSS`);
  }

  // ─── Check 7 (v2): prefers-reduced-motion ───
  let hasReducedMotion = false;
  for (const cssFile of userCssFiles) {
    if (!existsSync(cssFile)) continue;
    try {
      const content = readFileSync(cssFile, "utf-8");
      if (content.includes("prefers-reduced-motion")) {
        hasReducedMotion = true;
        break;
      }
    } catch {
      // ignore
    }
  }
  if (hasReducedMotion) {
    success(`Accessibility: ${c.bold}prefers-reduced-motion${c.reset} media query found`);
  } else {
    warn(`No ${c.bold}prefers-reduced-motion${c.reset} media query in user CSS — add one for accessibility`);
    log(`  ${c.dim}Example:${c.reset}`);
    log(`  ${c.cyan}@media (prefers-reduced-motion: reduce) { *{ animation: none !important; transition: none !important; } }${c.reset}`);
    warnings++;
  }

  // ─── Check 8 (v2): deprecated effects (hook for future migrations) ───
  // No effects are currently deprecated, but the hook exists for future migrations.
  // const deprecatedIds = new Set<string>([]);
  // const deprecatedUsed = [...usageMap.keys()].filter(cls => deprecatedIds.has(cls.replace("roycss-", "")));

  // ─── Summary ───
  log(`\n${c.bold}Summary:${c.reset}`);
  if (issues === 0 && warnings === 0) {
    success(`${c.green}All checks passed!${c.reset} Your project is healthy.`);
  } else {
    if (issues > 0) warn(`${issues} issue${issues === 1 ? "" : "s"} found.`);
    if (warnings > 0) info(`${warnings} warning${warnings === 1 ? "" : "s"} (non-blocking).`);
  }

  log(`\n${c.dim}RoyCSS ${effects.length}+ effects available | ${categoryOrder.length} categories${c.reset}`);
  log(`${c.dim}Docs: https://github.com/Roy-Wanyoike/roycss${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// New v2 commands
// ═══════════════════════════════════════════════════════════════

// ─── create: scaffold a new project ──────────────────────────────

function cmdCreate(projectName: string, flags: Record<string, string | boolean>) {
  const template = (flags.template as string) || "vanilla";
  const validTemplates = ["react", "vue", "svelte", "vanilla", "nextjs", "html"];

  if (!validTemplates.includes(template)) {
    error(`Invalid template "${template}". Valid: ${validTemplates.join(", ")}`);
    process.exit(1);
  }

  // Resolve and validate path
  const projectDir = resolve(projectName);

  // Refuse paths that escape cwd via .. unless --force
  const cwd = process.cwd();
  const rel = relative(cwd, projectDir);
  if (rel.startsWith("..") && !flags.force) {
    error(`Project path "${projectName}" is outside the current directory. Use --force to allow.`);
    process.exit(1);
  }

  if (existsSync(projectDir)) {
    if (!flags.force) {
      error(`Directory "${projectName}" already exists. Use --force to overwrite.`);
      process.exit(1);
    }
    // --force: just proceed, files will be overwritten
  } else {
    mkdirSync(projectDir, { recursive: true });
  }

  // Resolve initial effect
  const initialEffectId = (flags.effect as string) || "pulse-glow";
  const effect = effects.find((e) => e.id === initialEffectId);
  if (!effect) {
    warn(`Initial effect "${initialEffectId}" not found — using pulse-glow as fallback`);
  }
  const initialEffect = effect || effects.find((e) => e.id === "pulse-glow") || effects[0];

  log(`${c.bold}${c.cyan}RoyCSS${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  log(`${c.dim}Scaffolding ${c.bold}${template}${c.reset}${c.dim} project at ${c.bold}${projectName}${c.reset}${c.dim}...${c.reset}\n`);

  // Write roycss.css (just the initial effect; small + tree-shakeable)
  const cssHeader = `/* RoyCSS — initial effect\n * Generated by: roycss create\n * Template: ${template}\n * Add more: roycss add <effect-id> OR roycss export <ids...> --out roycss.css\n */\n\n`;
  writeFileSync(join(projectDir, "roycss.css"), cssHeader + initialEffect.cssCode + "\n");
  success(`Created ${c.bold}roycss.css${c.reset} with initial effect: ${c.cyan}roycss-${initialEffect.id}${c.reset}`);

  // ─── Template-specific files ───

  const templates: Record<string, () => void> = {
    vanilla: () => writeVanillaTemplate(projectDir, initialEffect),
    html: () => writeHtmlTemplate(projectDir, initialEffect),
    react: () => writeReactTemplate(projectDir, initialEffect, projectName),
    vue: () => writeVueTemplate(projectDir, initialEffect, projectName),
    svelte: () => writeSvelteTemplate(projectDir, initialEffect, projectName),
    nextjs: () => writeNextjsTemplate(projectDir, initialEffect, projectName),
  };

  templates[template]();

  // README
  writeFileSync(
    join(projectDir, "README.md"),
    `# ${projectName}\n\nGenerated by \`roycss create\` (RoyCSS CLI v${VERSION}).\n\n## Getting started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## RoyCSS\n\nThis project uses [RoyCSS](https://github.com/Roy-Wanyoike/roycss) — ${effects.length}+ production-ready CSS effects, zero JavaScript runtime.\n\nInitial effect: \`roycss-${initialEffect.id}\`\n\nAdd more effects:\n\n\`\`\`bash\nroycss search glow\nroycss add bounce-in\nroycss export pulse-glow bounce-in --out roycss.css\n\`\`\`\n\n## Commands\n\n- \`roycss stats\` — see which effects you're using\n- \`roycss doctor\` — check project health\n- \`roycss browse\` — interactive TUI browser\n- \`roycss help\` — full command list\n`,
  );

  // Print next steps
  log(`\n${c.green}✓${c.reset} Project created at ${c.bold}${projectDir}${c.reset}`);
  log(`\n${c.bold}Next steps:${c.reset}`);
  log(`  ${c.cyan}cd ${projectName}${c.reset}`);
  if (template !== "html" && template !== "vanilla") {
    log(`  ${c.cyan}npm install${c.reset} ${c.gray}(or: bun install)${c.reset}`);
  }
  log(`  ${c.cyan}npm run dev${c.reset} ${c.gray}(or: bun run dev)${c.reset}`);

  log(`\n${c.bold}RoyCSS commands:${c.reset}`);
  log(`  ${c.gray}Add effects:${c.reset} ${c.cyan}roycss add <effect-id>${c.reset}`);
  log(`  ${c.gray}Search:${c.reset}     ${c.cyan}roycss search <query>${c.reset}`);
  log(`  ${c.gray}Stats:${c.reset}      ${c.cyan}roycss stats${c.reset}`);
  log(`  ${c.gray}Browse:${c.reset}     ${c.cyan}roycss browse${c.reset}`);

  log(`\n${c.dim}Docs: https://github.com/Roy-Wanyoike/roycss${c.reset}`);
}

function writeVanillaTemplate(projectDir: string, effect: CSSEffect) {
  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectDir.split("/").pop() || "roycss-project",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "npx serve .",
          build: "echo 'No build step for vanilla template'",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RoyCSS Project</title>
  <link rel="stylesheet" href="roycss.css" />
</head>
<body>
  <main>
    <h1>Hello, RoyCSS</h1>
    <p>This project was scaffolded with <code>roycss create</code>.</p>
    <div class="roycss-${effect.id}">
      ${effect.previewText || "RoyCSS effect in action"}
    </div>
  </main>
</body>
</html>
`,
  );

  writeFileSync(
    join(projectDir, "main.js"),
    `// Entry point — add your JavaScript here\nconsole.log("RoyCSS project ready");\n`,
  );
  success(`Created ${c.bold}package.json${c.reset}, ${c.bold}index.html${c.reset}, ${c.bold}main.js${c.reset}`);
}

function writeHtmlTemplate(projectDir: string, effect: CSSEffect) {
  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectDir.split("/").pop() || "roycss-html",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "npx serve .",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RoyCSS Project</title>
  <link rel="stylesheet" href="roycss.css" />
</head>
<body>
  <main>
    <h1>Hello, RoyCSS</h1>
    <p>This project was scaffolded with <code>roycss create --template html</code>.</p>
    <div class="roycss-${effect.id}">
      ${effect.previewText || "RoyCSS effect in action"}
    </div>
  </main>
</body>
</html>
`,
  );
  success(`Created ${c.bold}package.json${c.reset}, ${c.bold}index.html${c.reset}`);
}

function writeReactTemplate(projectDir: string, effect: CSSEffect, projectName: string) {
  mkdirSync(join(projectDir, "src"), { recursive: true });

  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          roycss: "^2.0.0",
        },
        devDependencies: {
          "@types/react": "^19",
          "@types/react-dom": "^19",
          "@vitejs/plugin-react": "^4.3.0",
          typescript: "^5",
          vite: "^6.0.0",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  );

  writeFileSync(
    join(projectDir, "src", "main.tsx"),
    `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./roycss.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
  );

  writeFileSync(
    join(projectDir, "src", "App.tsx"),
    `export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Hello, RoyCSS</h1>
      <p>This project was scaffolded with <code>roycss create --template react</code>.</p>
      <div className="roycss-${effect.id}">${effect.previewText || "RoyCSS effect in action"}</div>
    </main>
  );
}
`,
  );

  writeFileSync(
    join(projectDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
        },
        include: ["src"],
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
  );

  success(`Created ${c.bold}package.json${c.reset}, ${c.bold}index.html${c.reset}, ${c.bold}src/main.tsx${c.reset}, ${c.bold}src/App.tsx${c.reset}, ${c.bold}tsconfig.json${c.reset}, ${c.bold}vite.config.ts${c.reset}`);
}

function writeVueTemplate(projectDir: string, effect: CSSEffect, projectName: string) {
  mkdirSync(join(projectDir, "src"), { recursive: true });

  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          vue: "^3.5.0",
          roycss: "^2.0.0",
        },
        devDependencies: {
          "@vitejs/plugin-vue": "^5.1.0",
          typescript: "^5",
          vite: "^6.0.0",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
  );

  writeFileSync(
    join(projectDir, "src", "main.ts"),
    `import { createApp } from "vue";
import App from "./App.vue";
import "./roycss.css";

createApp(App).mount("#app");
`,
  );

  writeFileSync(
    join(projectDir, "src", "App.vue"),
    `<script setup lang="ts"></script>

<template>
  <main style="padding: 2rem; font-family: system-ui, sans-serif;">
    <h1>Hello, RoyCSS</h1>
    <p>This project was scaffolded with <code>roycss create --template vue</code>.</p>
    <div class="roycss-${effect.id}">
      ${effect.previewText || "RoyCSS effect in action"}
    </div>
  </main>
</template>
`,
  );

  writeFileSync(
    join(projectDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
        },
        include: ["src"],
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
`,
  );

  success(`Created ${c.bold}package.json${c.reset}, ${c.bold}index.html${c.reset}, ${c.bold}src/main.ts${c.reset}, ${c.bold}src/App.vue${c.reset}, ${c.bold}tsconfig.json${c.reset}, ${c.bold}vite.config.ts${c.reset}`);
}

function writeSvelteTemplate(projectDir: string, effect: CSSEffect, projectName: string) {
  mkdirSync(join(projectDir, "src"), { recursive: true });

  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          roycss: "^2.0.0",
        },
        devDependencies: {
          "@sveltejs/vite-plugin-svelte": "^4.0.0",
          svelte: "^5.0.0",
          typescript: "^5",
          vite: "^6.0.0",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
  );

  writeFileSync(
    join(projectDir, "src", "main.ts"),
    `import App from "./App.svelte";
import "./roycss.css";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
`,
  );

  writeFileSync(
    join(projectDir, "src", "App.svelte"),
    `<script lang="ts"></script>

<main style="padding: 2rem; font-family: system-ui, sans-serif;">
  <h1>Hello, RoyCSS</h1>
  <p>This project was scaffolded with <code>roycss create --template svelte</code>.</p>
  <div class="roycss-${effect.id}">
    ${effect.previewText || "RoyCSS effect in action"}
  </div>
</main>
`,
  );

  writeFileSync(
    join(projectDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
        },
        include: ["src"],
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
});
`,
  );

  success(`Created ${c.bold}package.json${c.reset}, ${c.bold}index.html${c.reset}, ${c.bold}src/main.ts${c.reset}, ${c.bold}src/App.svelte${c.reset}, ${c.bold}tsconfig.json${c.reset}, ${c.bold}vite.config.ts${c.reset}`);
}

function writeNextjsTemplate(projectDir: string, effect: CSSEffect, projectName: string) {
  mkdirSync(join(projectDir, "src", "app"), { recursive: true });

  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
        },
        dependencies: {
          next: "^16.0.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          roycss: "^2.0.0",
        },
        devDependencies: {
          "@types/node": "^22",
          "@types/react": "^19",
          "@types/react-dom": "^19",
          typescript: "^5",
        },
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "src", "app", "layout.tsx"),
    `import type { Metadata } from "next";
import "../roycss.css";

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Generated by roycss create --template nextjs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  );

  writeFileSync(
    join(projectDir, "src", "app", "page.tsx"),
    `export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Hello, RoyCSS</h1>
      <p>This project was scaffolded with <code>roycss create --template nextjs</code>.</p>
      <div className="roycss-${effect.id}">
        ${effect.previewText || "RoyCSS effect in action"}
      </div>
    </main>
  );
}
`,
  );

  writeFileSync(
    join(projectDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    ) + "\n",
  );

  writeFileSync(
    join(projectDir, "next.config.ts"),
    `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n`,
  );

  success(`Created ${c.bold}package.json${c.reset}, ${c.bold}src/app/layout.tsx${c.reset}, ${c.bold}src/app/page.tsx${c.reset}, ${c.bold}tsconfig.json${c.reset}, ${c.bold}next.config.ts${c.reset}`);
}

// ─── upgrade: report outdated RoyCSS / deprecated patterns ───────

function cmdUpgrade() {
  log(`${c.bold}${c.cyan}RoyCSS Upgrade${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  log(`${c.dim}Scanning for outdated RoyCSS versions and deprecated patterns...${c.reset}\n`);

  let issues = 0;
  let warnings = 0;

  // ─── 1. Check package.json for roycss version ───
  if (existsSync("package.json")) {
    try {
      const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.roycss) {
        const versionSpec = deps.roycss as string;
        const version = versionSpec.replace(/[\^~>=<]/g, "");
        const major = parseInt(version.split(".")[0] || "0", 10);

        if (major < 2) {
          warn(`roycss@${versionSpec} is outdated (v1.x). RoyCSS v2.0.0 is available.`);
          log(`  ${c.dim}Upgrade:${c.reset} ${c.cyan}npm install roycss@latest${c.reset}`);
          issues++;
        } else if (major === 2) {
          success(`roycss@${versionSpec} is up to date (v2.x)`);
        } else {
          info(`roycss@${versionSpec} — newer than v2.0.0 reference`);
        }
      } else {
        info(`roycss is not in package.json dependencies`);
        log(`  ${c.dim}Install:${c.reset} ${c.cyan}npm install roycss@latest${c.reset}`);
      }
    } catch {
      warn(`Could not parse package.json`);
      warnings++;
    }
  } else {
    info(`No package.json found — skipping version check`);
  }

  // ─── 2. Check roycss.css for OKLCH compliance ───
  if (existsSync("roycss.css")) {
    try {
      const css = readFileSync("roycss.css", "utf-8");
      const hexCount = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
      const rgbaCount = (css.match(/\brgba?\(/g) || []).length;
      if (hexCount + rgbaCount > 0) {
        warn(`roycss.css contains ${hexCount} hex + ${rgbaCount} rgba() color literals`);
        log(`  ${c.dim}RoyCSS v2 uses OKLCH. Migrate:${c.reset} ${c.cyan}bun run scripts/migrate-colors.ts${c.reset}`);
        warnings++;
      } else {
        success(`roycss.css is OKLCH-compliant`);
      }
    } catch {
      // ignore
    }
  }

  // ─── 3. Scan source files for unprefixed effect classes ───
  // Old RoyCSS (pre-v1) had unprefixed classes; v1+ uses `roycss-` prefix.
  // We can't easily enumerate "old" class names, but we can look for suspicious patterns.
  const srcFiles = scanSourceFiles(["src", "app", "pages", "components"]);
  let unprefixedFound = 0;
  const knownEffectIds = new Set(effects.map((e) => e.id));

  for (const file of srcFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      // Find class attributes and check for known effect IDs without roycss- prefix
      const classMatches = content.match(/class(?:Name)?=["'`{]([^"'`}]+)/g) || [];
      for (const match of classMatches) {
        const tokens = match.replace(/class(?:Name)?=["'`{]/, "").split(/\s+/);
        for (const tok of tokens) {
          if (knownEffectIds.has(tok) && !content.includes(`roycss-${tok}`)) {
            unprefixedFound++;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (unprefixedFound > 0) {
    warn(`Found ${unprefixedFound} possible unprefixed RoyCSS class${unprefixedFound === 1 ? "" : "es"} in source files`);
    log(`  ${c.dim}All RoyCSS classes should be prefixed with ${c.reset}${c.cyan}roycss-${c.reset}${c.dim} in v2${c.reset}`);
    warnings++;
  } else {
    success(`No unprefixed RoyCSS classes detected`);
  }

  // ─── 4. Check for prefers-reduced-motion ───
  let hasReducedMotion = false;
  const userCssFiles = ["roycss.css", "src/app/globals.css", "src/index.css", "src/styles.css", "styles.css"];
  for (const cssFile of userCssFiles) {
    if (!existsSync(cssFile)) continue;
    try {
      const content = readFileSync(cssFile, "utf-8");
      if (content.includes("prefers-reduced-motion")) {
        hasReducedMotion = true;
        break;
      }
    } catch {
      // ignore
    }
  }
  if (hasReducedMotion) {
    success(`prefers-reduced-motion media query found`);
  } else {
    warn(`No prefers-reduced-motion media query found — RoyCSS v2 recommends adding one`);
    log(`  ${c.dim}Add to your CSS:${c.reset}`);
    log(`  ${c.cyan}@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }${c.reset}`);
    warnings++;
  }

  // ─── Summary ───
  log(`\n${c.bold}Summary:${c.reset}`);
  if (issues === 0 && warnings === 0) {
    success(`Project is up to date with RoyCSS v${VERSION}.`);
  } else {
    if (issues > 0) warn(`${issues} issue${issues === 1 ? "" : "s"} to address.`);
    if (warnings > 0) info(`${warnings} warning${warnings === 1 ? "" : "s"} (non-blocking).`);
  }

  log(`\n${c.dim}v1 scope: report-only. Auto-migration will arrive in v2.1.${c.reset}`);
  log(`${c.dim}Migration scripts: ${c.reset}${c.cyan}scripts/migrate-colors.ts${c.reset}${c.dim}, ${c.reset}${c.cyan}scripts/migrate-logical.ts${c.reset}`);
}

// ─── stats: project usage analytics ──────────────────────────────

function cmdStats(flags: Record<string, string | boolean>) {
  log(`${c.bold}${c.cyan}RoyCSS Stats${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  log(`${c.dim}Analyzing project usage...${c.reset}\n`);

  const srcFiles = scanSourceFiles(["src", "app", "pages", "components", "public"]);
  const usageMap = new Map<string, number>();
  const fileUsage = new Map<string, Set<string>>(); // file → set of effect IDs used

  for (const file of srcFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      const matches = content.match(/roycss-([a-z0-9-]+)/g);
      if (matches) {
        const fileEffects = new Set<string>();
        for (const m of matches) {
          usageMap.set(m, (usageMap.get(m) || 0) + 1);
          fileEffects.add(m);
        }
        fileUsage.set(file, fileEffects);
      }
    } catch {
      // ignore
    }
  }

  const totalUsages = [...usageMap.values()].reduce((a, b) => a + b, 0);
  const uniqueUsed = usageMap.size;

  // Category breakdown
  const categoryUsage = new Map<string, number>();
  for (const [cls, count] of usageMap.entries()) {
    const id = cls.replace("roycss-", "");
    const effect = effects.find((e) => e.id === id);
    if (effect) {
      categoryUsage.set(effect.category, (categoryUsage.get(effect.category) || 0) + count);
    }
  }

  // Top 10 effects
  const top10 = [...usageMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Unused effects
  const usedIds = new Set([...usageMap.keys()].map((k) => k.replace("roycss-", "")));
  const unusedEffects = effects.filter((e) => !usedIds.has(e.id));

  // JSON output
  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          totalUsages,
          uniqueEffectsUsed: uniqueUsed,
          totalEffects: effects.length,
          sourceFilesScanned: srcFiles.length,
          topEffects: top10.map(([cls, count]) => ({ id: cls.replace("roycss-", ""), class: cls, count })),
          categoryBreakdown: categoryOrder
            .filter((cat) => categoryUsage.has(cat))
            .map((cat) => ({ category: cat, label: categoryMeta[cat].label, count: categoryUsage.get(cat) })),
          unusedCount: unusedEffects.length,
          unusedSample: unusedEffects.slice(0, 20).map((e) => e.id),
        },
        null,
        2,
      ),
    );
    return;
  }

  // Pretty output
  log(`${c.bold}Total usages:${c.reset} ${totalUsages} across ${uniqueUsed} unique effect${uniqueUsed === 1 ? "" : "s"} in ${srcFiles.length} source file${srcFiles.length === 1 ? "" : "s"}`);
  log(`${c.bold}Catalog coverage:${c.reset} ${uniqueUsed}/${effects.length} effects (${((uniqueUsed / effects.length) * 100).toFixed(1)}%)`);

  // Top 10
  if (top10.length > 0) {
    log(`\n${c.bold}Top ${top10.length} effect${top10.length === 1 ? "" : "s"}:${c.reset}`);
    top10.forEach(([cls, count], i) => {
      const id = cls.replace("roycss-", "");
      const effect = effects.find((e) => e.id === id);
      const name = effect ? effect.name : "(unknown)";
      log(`  ${c.dim}${(i + 1).toString().padStart(2)}. ${c.reset}${c.cyan}${cls}${c.reset} ${c.gray}×${count}${c.reset} ${c.dim}— ${name}${c.reset}`);
    });
  } else {
    log(`\n${c.yellow}No RoyCSS class usages found in source files.${c.reset}`);
    log(`  ${c.dim}Start using effects: ${c.reset}${c.cyan}<div class="roycss-pulse-glow">Hello</div>${c.reset}`);
    return;
  }

  // Category breakdown
  if (categoryUsage.size > 0) {
    log(`\n${c.bold}Category breakdown:${c.reset}`);
    for (const cat of categoryOrder) {
      const count = categoryUsage.get(cat);
      if (count) {
        const total = effects.filter((e) => e.category === cat).length;
        log(`  ${c.magenta}${categoryMeta[cat].label.padEnd(22)}${c.reset} ${c.gray}${count} usage${count === 1 ? "" : "s"}${c.reset} ${c.dim}(${count > 0 ? Math.round((count / total) * 100) : 0}% of category)${c.reset}`);
      }
    }
  }

  // Unused effects
  if (unusedEffects.length > 0) {
    log(`\n${c.bold}Unused effects:${c.reset} ${c.yellow}${unusedEffects.length}${c.reset} ${c.dim}of ${effects.length} catalog effects are not used in this project${c.reset}`);
    if (unusedEffects.length <= 5) {
      unusedEffects.forEach((e) => {
        log(`  ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name}`);
      });
    } else {
      log(`  ${c.dim}(use ${c.reset}${c.cyan}roycss stats --json${c.reset}${c.dim} for full list)${c.reset}`);
      // Show 3 examples
      unusedEffects.slice(0, 3).forEach((e) => {
        log(`  ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name}`);
      });
      log(`  ${c.dim}...and ${unusedEffects.length - 3} more${c.reset}`);
    }
    log(`\n  ${c.dim}Tip: Use ${c.reset}${c.cyan}roycss export <ids...>${c.reset}${c.dim} to ship only the effects you use.${c.reset}`);
  }

  log(`\n${c.dim}Run ${c.reset}${c.cyan}roycss stats --json${c.reset}${c.dim} for machine-readable output.${c.reset}`);
}

// ─── browse: interactive TUI browser ─────────────────────────────

async function cmdBrowse(categoryArg: string | undefined) {
  // Resolve items
  let items: CSSEffect[];
  let title: string;

  if (categoryArg) {
    const cat = resolveCategory(categoryArg);
    if (!cat) {
      error(`Category "${categoryArg}" not found.`);
      log(`  Available: ${categoryOrder.join(", ")}`);
      process.exit(1);
    }
    items = effects.filter((e) => e.category === cat);
    title = `${categoryMeta[cat].label} (${items.length})`;
  } else {
    items = effects;
    title = `All RoyCSS Effects (${items.length})`;
  }

  // Non-TTY fallback: just print a paged list
  if (process.stdin.isTTY !== true) {
    log(`${c.bold}${c.cyan}RoyCSS Browser${c.reset} ${c.gray}v${VERSION}${c.reset}`);
    log(`${c.dim}Non-interactive mode (no TTY detected). Listing ${title.toLowerCase()}:${c.reset}\n`);
    const PAGE = 30;
    items.slice(0, PAGE).forEach((e, i) => {
      log(`  ${c.dim}${(i + 1).toString().padStart(3)}. ${c.reset}${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name}`);
    });
    if (items.length > PAGE) {
      log(`\n  ${c.dim}...and ${items.length - PAGE} more. Run in a TTY for full interactive mode.${c.reset}`);
    }
    log(`\n${c.dim}Interactive: ${c.reset}${c.cyan}roycss browse ${categoryArg || "[category]"}${c.reset}`);
    log(`${c.dim}View one:    ${c.reset}${c.cyan}roycss info <effect-id>${c.reset}`);
    return;
  }

  // Interactive TUI mode
  let selected = 0;
  let scrollOffset = 0;
  let mode: "list" | "detail" = "list";
  const PAGE_SIZE = Math.min(15, Math.max(5, process.stdout.rows - 8));

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  const cleanup = () => {
    try {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    } catch {
      // ignore
    }
  };

  process.on("SIGINT", () => {
    cleanup();
    console.clear();
    process.exit(0);
  });

  const render = () => {
    console.clear();
    if (mode === "list") {
      log(`${c.bold}${c.cyan}RoyCSS Browser${c.reset} ${c.gray}v${VERSION}${c.reset}`);
      log(`${c.bold}${title}${c.reset} ${c.dim}— ${selected + 1}/${items.length}${c.reset}`);
      log(`${c.dim}↑/↓ navigate · Enter view · c copy · q quit${c.reset}\n`);

      const end = Math.min(scrollOffset + PAGE_SIZE, items.length);
      for (let i = scrollOffset; i < end; i++) {
        const e = items[i];
        const isSelected = i === selected;
        const marker = isSelected ? `${c.cyan}❯${c.reset}` : " ";
        const name = isSelected ? `${c.bold}${c.cyan}roycss-${e.id}${c.reset} — ${e.name}` : `${c.gray}roycss-${e.id} — ${e.name}${c.reset}`;
        log(` ${marker} ${name}`);
      }
      if (items.length > PAGE_SIZE) {
        log(`\n${c.dim}Showing ${scrollOffset + 1}-${end} of ${items.length}${c.reset}`);
      }
    } else {
      const e = items[selected];
      log(`${c.bold}${c.cyan}${e.name}${c.reset} ${c.dim}(roycss-${e.id})${c.reset}`);
      log(`\n${c.bold}Category:${c.reset} ${categoryMeta[e.category].label}`);
      log(`${c.bold}Tags:${c.reset} ${e.tags.join(", ")}`);
      log(`${c.bold}Preview Type:${c.reset} ${e.previewType}`);
      if (e.childCount) {
        log(`${c.bold}Child Elements:${c.reset} ${e.childCount} <span> elements required`);
      }
      log(`\n${c.bold}CSS:${c.reset}`);
      log(`${c.gray}${e.cssCode}${c.reset}`);
      log(`\n${c.dim}Enter/Esc: back to list · c: copy CSS · q: quit${c.reset}`);
    }
  };

  render();

  process.stdin.on("keypress", async (_str, key) => {
    if (!key) return;

    // Global keys
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      cleanup();
      console.clear();
      process.exit(0);
    }

    if (mode === "list") {
      if (key.name === "down" || key.name === "j") {
        selected = Math.min(selected + 1, items.length - 1);
        if (selected >= scrollOffset + PAGE_SIZE) scrollOffset = selected - PAGE_SIZE + 1;
        render();
      } else if (key.name === "up" || key.name === "k") {
        selected = Math.max(selected - 1, 0);
        if (selected < scrollOffset) scrollOffset = selected;
        render();
      } else if (key.name === "return" || key.name === "enter") {
        mode = "detail";
        render();
      } else if (key.name === "c") {
        const e = items[selected];
        const copied = await copyToClipboard(e.cssCode);
        if (copied) {
          log(`\n${c.green}✓${c.reset} Copied ${c.bold}roycss-${e.id}${c.reset} to clipboard`);
          setTimeout(render, 800);
        }
      }
    } else {
      // detail mode
      if (key.name === "return" || key.name === "enter" || key.name === "escape" || key.name === "backspace") {
        mode = "list";
        render();
      } else if (key.name === "c") {
        const e = items[selected];
        const copied = await copyToClipboard(e.cssCode);
        if (copied) {
          log(`\n${c.green}✓${c.reset} Copied ${c.bold}roycss-${e.id}${c.reset} to clipboard`);
          setTimeout(render, 800);
        }
      }
    }
  });

  // Keep the process alive
  return new Promise<void>(() => {
    // intentional: never resolves; TUI runs until user quits
  });
}

// ─── export: subset of effects to a CSS file ─────────────────────

function cmdExport(effectIds: string[], flags: Record<string, string | boolean>) {
  const toExport: CSSEffect[] = [];
  const seen = new Set<string>();
  const missing: string[] = [];

  // 1. Explicit IDs
  for (const id of effectIds) {
    const e = effects.find((eff) => eff.id === id);
    if (!e) {
      missing.push(id);
      continue;
    }
    if (!seen.has(e.id)) {
      seen.add(e.id);
      toExport.push(e);
    }
  }

  if (missing.length > 0) {
    warn(`Effect${missing.length === 1 ? "" : "s"} not found: ${missing.join(", ")}`);
  }

  // 2. --category filter
  if (flags.category) {
    const cat = resolveCategory(flags.category as string);
    if (!cat) {
      error(`Category "${flags.category}" not found.`);
      log(`  Available: ${categoryOrder.join(", ")}`);
      process.exit(1);
    }
    const catEffects = effects.filter((e) => e.category === cat);
    for (const e of catEffects) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        toExport.push(e);
      }
    }
    log(`${c.dim}Including all ${catEffects.length} effects in ${c.reset}${c.magenta}${categoryMeta[cat].label}${c.reset}`);
  }

  // 3. --tag filter
  if (flags.tag) {
    const tag = (flags.tag as string).toLowerCase();
    const tagEffects = effects.filter((e) => e.tags.some((t) => t.toLowerCase() === tag));
    for (const e of tagEffects) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        toExport.push(e);
      }
    }
    log(`${c.dim}Including all ${tagEffects.length} effects tagged "${tag}"${c.reset}`);
  }

  if (toExport.length === 0) {
    error(`No effects to export. Provide effect IDs, --category <cat>, or --tag <tag>.`);
    log(`  ${c.dim}Example:${c.reset} ${c.cyan}roycss export pulse-glow bounce-in --out bundle.css${c.reset}`);
    process.exit(1);
  }

  // Sort by (category, id) for stable output
  toExport.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.id.localeCompare(b.id);
  });

  const outFile = (flags.out as string) || "roycss-custom.css";
  const categories = [...new Set(toExport.map((e) => e.category))].sort();
  const date = new Date().toISOString();

  const header = `/* RoyCSS Custom Export
 * Effects: ${toExport.length}
 * Categories: ${categories.map((c) => categoryMeta[c as EffectCategory].label).join(", ")}
 * Generated by: roycss export (CLI v${VERSION})
 * Date: ${date}
 * Learn more: https://github.com/Roy-Wanyoike/roycss
 */

`;

  const cssBody = toExport.map((e) => e.cssCode).join("\n\n");
  writeFileSync(outFile, header + cssBody + "\n");

  const sizeKB = (statSync(outFile).size / 1024).toFixed(1);
  success(`Exported ${c.bold}${toExport.length}${c.reset} effect${toExport.length === 1 ? "" : "s"} to ${c.bold}${outFile}${c.reset} (${sizeKB}KB)`);

  log(`\n${c.dim}Effects:${c.reset}`);
  for (const e of toExport) {
    log(`  ${c.cyan}roycss-${e.id}${c.reset} ${c.gray}—${c.reset} ${e.name} ${c.dim}(${categoryMeta[e.category].label})${c.reset}`);
  }

  log(`\n${c.dim}Import in your project:${c.reset}`);
  log(`  ${c.cyan}@import "${outFile}";${c.reset}`);
  log(`${c.dim}Or in HTML:${c.reset}`);
  log(`  ${c.cyan}<link rel="stylesheet" href="${outFile}" />${c.reset}`);
}

// ─── plugin: list/enable/disable/init plugins ────────────────────

const PLUGINS_DIR = ".roycss/plugins";

const SAMPLE_PLUGIN_SOURCE = `/* Sample RoyCSS Plugin
 *
 * Plugins live in .roycss/plugins/ and export a register() function.
 * The CLI never auto-executes plugins — they run only when explicitly invoked.
 *
 * Plugin contract:
 *   module.exports = {
 *     name: string,
 *     version: string,
 *     description: string,
 *     register(api) {
 *       api.effects           // CSSEffect[] — read-only catalog
 *       api.categoryMeta      // category metadata map
 *       api.log(msg)          // themed log
 *       api.success(msg)      // themed success
 *       api.warn(msg)         // themed warn
 *       api.error(msg)        // themed error
 *       api.registerCommand(name, handler)  // register a sub-command
 *     }
 *   }
 *
 * Sub-commands are invoked as: roycss <plugin-name>:<command>
 *
 * Safety:
 *   - Plugins do NOT auto-load. They run only on explicit invocation.
 *   - Plugins are project-scoped (.roycss/plugins/ in cwd).
 *   - Disabled plugins are renamed .disabled.js
 *   - The sample plugin is a no-op until you customize it.
 */

module.exports = {
  name: "sample",
  version: "1.0.0",
  description: "Sample RoyCSS plugin — replace this with your own logic.",
  register(api) {
    api.registerCommand("hello", (args) => {
      api.success("Hello from sample plugin!");
      api.log("Args received: " + JSON.stringify(args));
      api.log("RoyCSS catalog has " + api.effects.length + " effects.");
    });

    api.registerCommand("count-by-category", () => {
      const counts = {};
      for (const e of api.effects) {
        counts[e.category] = (counts[e.category] || 0) + 1;
      }
      api.log(JSON.stringify(counts, null, 2));
    });
  },
};
`;

function cmdPlugin(positional: string[], flags: Record<string, string | boolean>) {
  const action = positional[0];
  const nameFromFlag = flags.name as string | undefined;
  log(`${c.bold}${c.cyan}RoyCSS Plugins${c.reset} ${c.gray}v${VERSION}${c.reset}`);

  switch (action) {
    case undefined:
    case "list": {
      log(`${c.dim}Scanning ${PLUGINS_DIR}/...${c.reset}\n`);

      if (!existsSync(PLUGINS_DIR)) {
        info(`No plugins directory found at ${c.cyan}${PLUGINS_DIR}${c.reset}`);
        log(`  ${c.dim}Scaffold a sample plugin:${c.reset} ${c.cyan}roycss plugin init${c.reset}`);
        return;
      }

      let entries: string[] = [];
      try {
        entries = readdirSync(PLUGINS_DIR).filter(
          (f) => f.endsWith(".js") || f.endsWith(".disabled.js"),
        );
      } catch {
        // ignore
      }

      if (entries.length === 0) {
        info(`No plugins found in ${c.cyan}${PLUGINS_DIR}${c.reset}`);
        log(`  ${c.dim}Scaffold a sample plugin:${c.reset} ${c.cyan}roycss plugin init${c.reset}`);
        return;
      }

      log(`${c.bold}Plugins:${c.reset}\n`);
      for (const f of entries.sort()) {
        const isDisabled = f.endsWith(".disabled.js");
        const name = f.replace(/\.disabled\.js$|\.js$/, "");
        const status = isDisabled ? `${c.yellow}[disabled]${c.reset}` : `${c.green}[enabled]${c.reset}`;
        log(`  ${status} ${c.cyan}${name}${c.reset} ${c.gray}${f}${c.reset}`);
      }

      log(`\n${c.dim}Plugins are NOT auto-executed. They run only when explicitly invoked.${c.reset}`);
      log(`${c.dim}Enable:${c.reset}  ${c.cyan}roycss plugin enable --name <plugin>${c.reset}`);
      log(`${c.dim}Disable:${c.reset} ${c.cyan}roycss plugin disable --name <plugin>${c.reset}`);
      log(`${c.dim}Docs:${c.reset}    ${c.cyan}docs/adr/cli-platform-v2/DESIGN.md${c.reset}`);
      break;
    }

    case "enable": {
      const name = nameFromFlag || positional[1];
      if (!name) {
        error(`Usage: roycss plugin enable --name <plugin-name>`);
        process.exit(1);
      }
      const disabledPath = join(PLUGINS_DIR, `${name}.disabled.js`);
      const enabledPath = join(PLUGINS_DIR, `${name}.js`);

      if (!existsSync(disabledPath)) {
        error(`No disabled plugin found at ${c.cyan}${disabledPath}${c.reset}`);
        if (existsSync(enabledPath)) {
          info(`Plugin "${name}" is already enabled.`);
        }
        process.exit(1);
      }

      try {
        renameSync(disabledPath, enabledPath);
        success(`Enabled plugin: ${c.bold}${name}${c.reset}`);
        log(`  ${c.dim}Renamed: ${name}.disabled.js → ${name}.js${c.reset}`);
      } catch (e) {
        error(`Failed to enable plugin: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
      break;
    }

    case "disable": {
      const name = nameFromFlag || positional[1];
      if (!name) {
        error(`Usage: roycss plugin disable --name <plugin-name>`);
        process.exit(1);
      }
      const enabledPath = join(PLUGINS_DIR, `${name}.js`);
      const disabledPath = join(PLUGINS_DIR, `${name}.disabled.js`);

      if (!existsSync(enabledPath)) {
        error(`No enabled plugin found at ${c.cyan}${enabledPath}${c.reset}`);
        if (existsSync(disabledPath)) {
          info(`Plugin "${name}" is already disabled.`);
        }
        process.exit(1);
      }

      try {
        renameSync(enabledPath, disabledPath);
        success(`Disabled plugin: ${c.bold}${name}${c.reset}`);
        log(`  ${c.dim}Renamed: ${name}.js → ${name}.disabled.js${c.reset}`);
      } catch (e) {
        error(`Failed to disable plugin: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
      break;
    }

    case "init": {
      // Create .roycss/plugins/ directory and write sample plugin
      mkdirSync(PLUGINS_DIR, { recursive: true });
      const samplePath = join(PLUGINS_DIR, "sample.js");

      if (existsSync(samplePath) && !flags.force) {
        warn(`${c.bold}sample.js${c.reset} already exists at ${c.cyan}${samplePath}${c.reset}`);
        log(`  ${c.dim}Use ${c.reset}${c.cyan}--force${c.reset}${c.dim} to overwrite.${c.reset}`);
        return;
      }

      writeFileSync(samplePath, SAMPLE_PLUGIN_SOURCE);
      success(`Created sample plugin at ${c.bold}${samplePath}${c.reset}`);
      log(`\n${c.dim}Edit the file to add your custom logic.${c.reset}`);
      log(`${c.dim}Plugins are NOT auto-executed — they run only when explicitly invoked.${c.reset}`);
      log(`\n${c.bold}Next steps:${c.reset}`);
      log(`  ${c.gray}1. Edit:${c.reset}     ${c.cyan}${samplePath}${c.reset}`);
      log(`  ${c.gray}2. List:${c.reset}     ${c.cyan}roycss plugin list${c.reset}`);
      log(`  ${c.gray}3. Disable:${c.reset}  ${c.cyan}roycss plugin disable --name sample${c.reset}`);
      log(`\n${c.dim}Plugin contract & safety: ${c.reset}${c.cyan}docs/adr/cli-platform-v2/THREAT-MODEL.md${c.reset}`);
      break;
    }

    default:
      error(`Unknown plugin action: ${c.bold}${action}${c.reset}`);
      log(`  ${c.dim}Valid actions:${c.reset} ${c.cyan}list${c.reset}, ${c.cyan}enable${c.reset}, ${c.cyan}disable${c.reset}, ${c.cyan}init${c.reset}`);
      process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// Help
// ═══════════════════════════════════════════════════════════════

function cmdHelp() {
  log(`${c.bold}${c.cyan}RoyCSS CLI${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  log(`${c.dim}${effects.length}+ production-ready CSS effects across ${categoryOrder.length} categories${c.reset}\n`);

  log(`${c.bold}Commands:${c.reset}`);
  log(`  ${c.cyan}init${c.reset}                      Initialize RoyCSS in your project`);
  log(`  ${c.cyan}add${c.reset} <effect-id>           Add a specific effect's CSS file`);
  log(`  ${c.cyan}search${c.reset} <query>            Search effects by name, tag, or category`);
  log(`  ${c.cyan}list${c.reset} [category]           List all effects or filter by category`);
  log(`  ${c.cyan}categories${c.reset}                List all effect categories`);
  log(`  ${c.cyan}info${c.reset} <effect-id>          Show details about a specific effect`);
  log(`  ${c.cyan}doctor${c.reset}                    Check project health and get recommendations`);
  log(`  ${c.cyan}create${c.reset} <name>             Scaffold a new project with RoyCSS pre-installed`);
  log(`  ${c.cyan}upgrade${c.reset}                   Scan for outdated RoyCSS versions and deprecated patterns`);
  log(`  ${c.cyan}stats${c.reset}                     Report project usage analytics for RoyCSS effects`);
  log(`  ${c.cyan}browse${c.reset} [category]         Interactive TUI browser for effects`);
  log(`  ${c.cyan}export${c.reset} <id> [id...]       Export a subset of effects to a CSS file`);
  log(`  ${c.cyan}plugin${c.reset} <action>           Manage plugins (list/enable/disable/init)`);
  log(`  ${c.cyan}version${c.reset}                   Show CLI version`);
  log(`  ${c.cyan}help${c.reset}                      Show this help message`);

  log(`\n${c.bold}Flags:${c.reset}`);
  log(`  ${c.cyan}--copy${c.reset}                    Copy CSS to clipboard (use with ${c.dim}add${c.reset})`);
  log(`  ${c.cyan}--tag${c.reset} <tag>               Filter by tag (use with ${c.dim}search/list/export${c.reset})`);
  log(`  ${c.cyan}--framework${c.reset} <name>        Show framework usage (use with ${c.dim}info/init${c.reset})`);
  log(`  ${c.cyan}--json${c.reset}                    Output as JSON (use with ${c.dim}search/list/stats${c.reset})`);
  log(`  ${c.cyan}--force${c.reset}                   Overwrite existing files (use with ${c.dim}init/create/plugin init${c.reset})`);
  log(`  ${c.cyan}--template${c.reset} <t>            Project template: react/vue/svelte/vanilla/nextjs/html (use with ${c.dim}create${c.reset})`);
  log(`  ${c.cyan}--effect${c.reset} <id>             Initial effect to include (use with ${c.dim}create${c.reset})`);
  log(`  ${c.cyan}--category${c.reset} <cat>          Export all effects in category (use with ${c.dim}export${c.reset})`);
  log(`  ${c.cyan}--out${c.reset} <file>              Output file path (use with ${c.dim}export${c.reset})`);
  log(`  ${c.cyan}--name${c.reset} <plugin-name>      Plugin name (use with ${c.dim}plugin enable/disable${c.reset})`);

  log(`\n${c.bold}Examples:${c.reset}`);
  log(`  ${c.gray}roycss init${c.reset}`);
  log(`  ${c.gray}roycss init --framework react${c.reset}`);
  log(`  ${c.gray}roycss add pulse-glow${c.reset}`);
  log(`  ${c.gray}roycss add pulse-glow --copy${c.reset}`);
  log(`  ${c.gray}roycss search "glass card"${c.reset}`);
  log(`  ${c.gray}roycss search loading --tag spinner${c.reset}`);
  log(`  ${c.gray}roycss list animations${c.reset}`);
  log(`  ${c.gray}roycss info btn-shine-sweep --framework react${c.reset}`);
  log(`  ${c.gray}roycss doctor${c.reset}`);
  log(`  ${c.gray}roycss list --json${c.reset}`);
  log(`  ${c.gray}roycss create my-app --template react${c.reset}`);
  log(`  ${c.gray}roycss create my-app --template nextjs --effect bounce-in${c.reset}`);
  log(`  ${c.gray}roycss upgrade${c.reset}`);
  log(`  ${c.gray}roycss stats${c.reset}`);
  log(`  ${c.gray}roycss stats --json${c.reset}`);
  log(`  ${c.gray}roycss browse animations${c.reset}`);
  log(`  ${c.gray}roycss export pulse-glow bounce-in --out bundle.css${c.reset}`);
  log(`  ${c.gray}roycss export --category animations --out animations.css${c.reset}`);
  log(`  ${c.gray}roycss export --tag attention --out attention.css${c.reset}`);
  log(`  ${c.gray}roycss plugin list${c.reset}`);
  log(`  ${c.gray}roycss plugin init${c.reset}`);
  log(`  ${c.gray}roycss plugin enable --name my-plugin${c.reset}`);

  log(`\n${c.dim}Learn more: https://github.com/Roy-Wanyoike/roycss${c.reset}`);
  log(`${c.dim}Docs: docs/adr/cli-platform-v2/${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

const [command, ...rawArgs] = process.argv.slice(2);
const { positional, flags } = parseFlags(rawArgs);

async function main() {
  switch (command) {
    case "init":
      cmdInit(flags);
      break;
    case "add":
      if (!positional[0]) {
        error("Usage: roycss add <effect-id> [--copy]");
        process.exit(1);
      }
      await cmdAdd(positional[0], flags);
      break;
    case "search":
      if (!positional[0]) {
        error("Usage: roycss search <query> [--tag <tag>] [--json]");
        process.exit(1);
      }
      cmdSearch(positional.join(" "), flags);
      break;
    case "list":
      cmdList(positional[0], flags);
      break;
    case "categories":
      cmdCategories();
      break;
    case "info":
      if (!positional[0]) {
        error("Usage: roycss info <effect-id> [--framework <name>]");
        process.exit(1);
      }
      cmdInfo(positional[0], flags);
      break;
    case "doctor":
      cmdDoctor();
      break;
    // ─── v2 commands ───
    case "create":
      if (!positional[0]) {
        error("Usage: roycss create <project-name> [--template <t>] [--effect <id>] [--force]");
        process.exit(1);
      }
      cmdCreate(positional[0], flags);
      break;
    case "upgrade":
      cmdUpgrade();
      break;
    case "stats":
      cmdStats(flags);
      break;
    case "browse":
      await cmdBrowse(positional[0]);
      break;
    case "export":
      if (positional.length === 0 && !flags.category && !flags.tag) {
        error("Usage: roycss export <effect-id> [effect-id...] [--category <cat>] [--tag <tag>] [--out <file>]");
        process.exit(1);
      }
      cmdExport(positional, flags);
      break;
    case "plugin":
      cmdPlugin(positional, flags);
      break;
    case "version":
    case "--version":
    case "-v":
      cmdVersion();
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      cmdHelp();
      break;
    default:
      error(`Unknown command: ${command}`);
      log("");
      cmdHelp();
      process.exit(1);
  }
}

main().catch((e) => {
  error(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
