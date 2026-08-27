import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VS Code Snippets — RoyCSS Docs",
  description: "Install the RoyCSS VS Code extension for class autocompletion, snippets, and live preview.",
};

export default function VscodeSnippetsPage() {
  return (
    <>
      <h1>VS Code Snippets</h1>
      <p className="text-lg text-muted-foreground">
        The official RoyCSS VS Code extension gives you class
        autocompletion, hover documentation, and 40+ snippets for
        the most common effect combinations.
      </p>

      <h2 id="install-extension">Install the extension</h2>
      <p>
        Search for <code>RoyCSS</code> in the VS Code marketplace, or
        install from the command line:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`code --install-extension roycss.roycss-vscode`}</code>
      </pre>
      <p>
        The extension is ~120 KB and adds zero runtime overhead —
        it only runs in your editor.
      </p>

      <h2 id="features">Features</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Class autocompletion</strong> for all 1,869 effects
          with inline descriptions and OKLCH previews.
        </li>
        <li>
          <strong>Snippets</strong> for common combinations — buttons,
          cards, loaders, hero sections.
        </li>
        <li>
          <strong>Hover docs</strong> — hover a class to see the
          effect’s purpose and custom-property overrides.
        </li>
        <li>
          <strong>Color swatches</strong> next to OKLCH variables so
          you can pick visually.
        </li>
      </ul>

      <h2 id="snippets">Built-in snippets</h2>
      <p>
        Snippets trigger on the prefix <code>r-</code> in HTML, JSX,
        TSX, Vue, Svelte, and Astro files. The most-used ones:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`r-button-glow   → <button class="r-btn-glow-emerald">…</button>
r-card-lift     → <article class="r-card-base r-hover-lift">…</article>
r-loader-ring   → <div class="r-loader-ring" role="status">…</div>
r-text-shimmer  → <h1 class="r-text-shimmer">…</h1>
r-hero-fade     → <section class="r-bg-aurora">…</section>`}</code>
      </pre>

      <h2 id="custom-snippets">Define your own snippets</h2>
      <p>
        The extension reads a <code>roycss.snippets.json</code> file
        from your workspace <code>.vscode</code> directory. Override
        built-ins or add your own:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "CTA Button": {
    "prefix": "r-cta",
    "body": [
      "<a href=\"\${1:#}\" class=\"r-btn-glow-emerald r-hover-lift r-text-shadow-soft\">",
      "  \${2:Click me}",
      "</a>"
    ],
    "description": "Marketing CTA button"
  }
}`}</code>
      </pre>

      <h2 id="css-intellisense">CSS IntelliSense for variables</h2>
      <p>
        The extension also augments VS Code’s CSS language server so
        every <code>--r-*</code> custom property shows its current
        OKLCH value, type (color / length / number), and the effect
        categories that consume it.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`:root {
  /* Hover --r-accent in editor → shows oklch(72% 0.18 165) */
  --r-accent: oklch(72% 0.18 165);
}`}</code>
      </pre>

      <h2 id="other-editors">Other editors</h2>
      <p>
        For editors without an official extension, the RoyCSS CLI can
        generate a Tailwind-compatible <code>classes.json</code> for
        your editor’s class-name completion plugin of choice:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx roycss classes --out .vscode/classes.json`}</code>
      </pre>
      <p>
        Drop that into Neovim’s <code>tailwindcss.nvim</code>, Sublime’s
        <code>tailwind-lsp</code>, or any LSP that consumes class-name
        manifests.
      </p>
    </>
  );
}
