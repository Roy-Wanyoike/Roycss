import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI — RoyCSS Docs",
  description: "The roycss command-line interface: scaffold projects, generate snippets, lint classes, and inspect effects.",
};

export default function CliPage() {
  return (
    <>
      <h1>CLI</h1>
      <p className="text-lg text-muted-foreground">
        The <code>roycss</code> CLI is bundled with the npm package.
        Use it to scaffold projects, generate editor snippets, lint
        class names, and inspect individual effects offline.
      </p>

      <h2 id="install">Install</h2>
      <p>
        If you already installed RoyCSS, the CLI is already on your
        path via <code>npx</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss --version
# 2.0.0`}</code>
      </pre>
      <p>
        Or install globally for a stable path:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npm install -g roycss
roycss --version`}</code>
      </pre>

      <h2 id="commands">Commands</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`roycss <command> [options]

Commands:
  init [template]     Scaffold a new project with RoyCSS preinstalled
  classes [opts]      Dump all 1,869 class names as JSON (for editors)
  inspect <class>     Show the CSS + custom properties for one effect
  search <query>      Full-text search across all effects
  palette [name]      Print the OKLCH palette for a theme
  mcp                 Start the Model Context Protocol server
  lint [files...]     Lint class names against the known set
  bundle [opts]       Produce a custom bundle of selected effects
  snippets [opts]     Generate editor snippet files (vscode, vim)
  help [command]      Show help for a specific command`}</code>
      </pre>

      <h2 id="init">Scaffolding a project</h2>
      <p>
        The fastest way to a working RoyCSS project is{" "}
        <code>roycss init</code>. It installs the package, drops in a
        global stylesheet import, and adds the VS Code extension
        recommendation to your workspace:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Default template (Next.js + TypeScript)
npx roycss init

# Astro template
npx roycss init astro

# Vite + React template
npx roycss init vite-react`}</code>
      </pre>

      <h2 id="inspect">Inspecting a single effect</h2>
      <p>
        <code>roycss inspect</code> is invaluable when you want to see
        exactly what an effect does — without opening DevTools:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss inspect r-hover-lift

.r-hover-lift {
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 180ms ease-out;
  will-change: transform;
}
.r-hover-lift:hover {
  transform: translateY(var(--r-hover-lift, 4px));
  box-shadow:
    0 8px 24px -8px oklch(72% 0.18 165 / 0.45),
    0 0 0 1px oklch(72% 0.18 165 / 0.15);
}

# Consumes 2 custom properties:
#   --r-hover-lift (length, default 4px)
#   --r-accent     (color,   default oklch(72% 0.18 165))`}</code>
      </pre>

      <h2 id="lint">Linting class names</h2>
      <p>
        Catch typos before your users do. <code>roycss lint</code>{" "}
        scans your source files for class names that look like RoyCSS
        but aren’t:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss lint src/**/*.tsx

src/components/SaveButton.tsx:12:7
  warning  Unknown RoyCSS class "r-hover-lifft"
           did you mean "r-hover-lift"?

✓ 1 warning, 0 errors`}</code>
      </pre>

      <h2 id="bundle">Custom bundles</h2>
      <p>
        If you only want a handful of effects on a CDN, use{" "}
        <code>roycss bundle</code> to compile a single stylesheet:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss bundle \\
  --include r-hover-lift \\
  --include r-btn-glow-emerald \\
  --include r-card-base \\
  --out dist/my-bundle.css \\
  --minify`}</code>
      </pre>

      <h2 id="snippets">Generating editor snippets</h2>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss snippets vscode --out .vscode/roycss.code-snippets
npx roycss snippets vim     --out ~/.config/nvim/snips/roycss.json`}</code>
      </pre>

      <h2 id="help">Help</h2>
      <p>
        Every command has a <code>--help</code> flag:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss help inspect
npx roycss help bundle`}</code>
      </pre>
    </>
  );
}
