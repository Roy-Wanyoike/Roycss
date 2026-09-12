import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED, CATEGORY_COUNT, VERSION } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "CLI — RoyCSS Docs",
  description: "The roycss command-line interface: scaffold projects, add and export effects, search the catalog, and check project health.",
};

export default function CliPage() {
  return (
    <>
      <h1>CLI</h1>
      <p className="text-lg text-muted-foreground">
        The <code>roycss</code> CLI ships with the npm package. Use
        it to scaffold projects, add or export effects, search the
        catalog, and check project health — all offline, against
        the same catalog the stylesheet is built from.
      </p>

      <h2 id="install">Install</h2>
      <p>
        If you already installed RoyCSS, the CLI is already on your
        path via <code>npx</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss version
# RoyCSS CLI v${VERSION}`}</code>
      </pre>
      <p>
        Or install globally for a stable path:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npm install -g roycss
roycss version`}</code>
      </pre>

      <h2 id="commands">Commands</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss <command> [options]

Commands:
  init                      Initialize RoyCSS in your project
  add <effect-id>           Add a specific effect's CSS file (--copy)
  search <query>            Search effects by name, tag, or category
  list [category]           List all effects or filter by category
  categories                List all effect categories
  info <effect-id>          Show details + CSS for a specific effect
  doctor                    Check project health and get recommendations
  create <name>             Scaffold a new project with RoyCSS pre-installed
  upgrade                   Scan for outdated versions and deprecated patterns
  stats                     Report project usage analytics for RoyCSS effects
  browse [category]         Interactive TUI browser for effects
  export <id> [id...]       Export a subset of effects to a CSS file
  plugin <action>           Manage plugins (list/enable/disable/init)
  migrate <codemod> <glob>  Run a migration codemod (dry-run by default)
  version                   Show CLI version
  help                      Show this help message`}</code>
      </pre>

      <h2 id="create">Scaffolding a project</h2>
      <p>
        The fastest way to a working RoyCSS project is{" "}
        <code>roycss create</code>. It writes a{" "}
        <code>roycss.css</code> with your chosen initial effect and
        template files for the framework you pick:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# React template, starting with the pulse-glow effect
npx roycss create my-app --template react

# Next.js template, starting with bounce-in
npx roycss create my-app --template nextjs --effect bounce-in

# Templates: react | vue | svelte | vanilla | nextjs | html`}</code>
      </pre>
      <p>
        <code>roycss init</code> does the same for the project you
        are already in — it writes a <code>roycss.css</code> with
        every effect to your project root and prints the exact
        import line for your framework:
      </p>

      <h2 id="info">Inspecting a single effect</h2>
      <p>
        <code>roycss info</code> is invaluable when you want to see
        exactly what an effect does — without opening DevTools:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss info hover-push-up

Push Up (roycss-hover-push-up)

Description: Element lifts up while a shadow grows beneath it like it's floating
Category: Hover Effects
Tags: push, lift, float, hover

CSS:
/* Hover Push Up */
.roycss-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-push-up:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px -10px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}

Add to project: roycss add hover-push-up
Copy to clipboard: roycss add hover-push-up --copy`}</code>
      </pre>
      <p>
        Add <code>--framework react|vue|svelte|angular|nextjs|vanilla</code>{" "}
        for a ready-to-paste markup example in your stack.
      </p>

      <h2 id="doctor">Checking project health</h2>
      <p>
        <code>roycss doctor</code> verifies your install and scans
        your source for <code>roycss-*</code> classes that do not
        exist in the catalog (typos):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss doctor

✓ roycss package found in node_modules
✓ RoyCSS import found in src/app/globals.css
✓ 14 RoyCSS class usages found across 6 unique classes in 12 source files
⚠ 1 unknown roycss-* class (possible typos):
    roycss-hover-lifft`}</code>
      </pre>
      <p>
        <code>roycss stats</code> takes it further — usage counts,
        catalog coverage, and your most-used effects.
      </p>

      <h2 id="add-export">Adding and exporting effects</h2>
      <p>
        If you only want a handful of effects (or a whole category),
        export them to one stylesheet:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Single effect to clipboard
npx roycss add btn-glow --copy

# Hand-picked set → one file
npx roycss export btn-glow hover-push-up text-shimmer --out src/styles/roycss.css

# A whole category
npx roycss export --category buttons --out src/styles/roycss.css

# By tag
npx roycss export --tag attention --out src/styles/roycss.css`}</code>
      </pre>

      <h2 id="search">Searching the catalog</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss search "glass card"
npx roycss search loading --tag spinner
npx roycss list animations      # everything in one category
npx roycss categories           # all ${CATEGORY_COUNT} categories
npx roycss browse               # interactive TUI browser`}</code>
      </pre>

      <h2 id="help">Help</h2>
      <p>
        Every command has a <code>--help</code>-style example in
        the top-level help:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss help`}</code>
      </pre>
      <p>
        The catalog the CLI searches is the same data that builds{" "}
        <code>dist/roycss.css</code> — all {EFFECT_COUNT_FORMATTED}{" "}
        effects, so what you find is exactly what ships.
      </p>
    </>
  );
}
