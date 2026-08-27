import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Workflow — RoyCSS Docs",
  description: "Use RoyCSS with AI assistants: MCP server, prompts, class discovery, and review workflow.",
};

export default function AiWorkflowPage() {
  return (
    <>
      <h1>AI Workflow</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is designed to be AI-friendly. The MCP server, the
        VS Code extension, and the CLI linter give your AI coding
        assistant the tools it needs to write correct RoyCSS without
        hallucinating class names.
      </p>

      <h2 id="mcp-server">Connect the MCP server</h2>
      <p>
        The Model Context Protocol server exposes RoyCSS’s full
        class catalog to your AI client. See the{" "}
        <a className="text-emerald-700 dark:text-emerald-300 hover:underline" href="/docs/getting-started/mcp-server">
          MCP server guide
        </a>{" "}
        for setup details — quick version:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "mcpServers": {
    "roycss": {
      "command": "npx",
      "args": ["-y", "roycss", "mcp"]
    }
  }
}`}</code>
      </pre>
      <p>
        Once connected, your AI can call{" "}
        <code>roycss_search_effects</code>,{" "}
        <code>roycss_get_effect</code>, and{" "}
        <code>roycss_get_palette</code> directly.
      </p>

      <h2 id="prompts">Effective prompts</h2>
      <p>
        RoyCSS responds well to specific prompts. Three patterns
        that work:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Pattern 1 — describe the goal */
"Add a hover effect to my Save button — it should lift slightly
and glow emerald. Use RoyCSS classes only."

/* Pattern 2 — ask for a combination */
"Build a pricing card with RoyCSS: hover lift, emerald glow
button, gradient border, shine sweep on hover."

/* Pattern 3 — ask for the API */
"What RoyCSS classes are available for full-screen loaders?
Show me the CSS for the ring variant and explain it."`}</code>
      </pre>

      <h2 id="avoid-hallucination">Avoid class hallucination</h2>
      <p>
        The biggest AI pitfall with CSS libraries is inventing
        class names. The MCP server prevents this by giving the
        AI a live catalog. Without MCP, prime the AI with the
        class-name convention:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Prime the AI */
"Use only RoyCSS classes. They follow the pattern:
  r-<category>-<action>-<modifier?>
Categories: hover, text, backgrounds, loaders, buttons, cards, borders.
If you're unsure a class exists, run \`npx roycss inspect <name>\`
before writing it."`}</code>
      </pre>

      <h2 id="review-workflow">Review workflow</h2>
      <p>
        When reviewing AI-generated RoyCSS code, three things to
        check:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Class names are real</strong> — run{" "}
          <code>npx roycss lint {"src/**/*.{tsx,jsx}"}</code> and the
          linter flags typos with closest-match suggestions.
        </li>
        <li>
          <strong>Effects are compositional</strong> — no two
          classes from the same category on one element.
        </li>
        <li>
          <strong>Accessibility is intact</strong> —{" "}
          <code>role="status"</code> on loaders, focus rings on
          interactive elements, color is not the only state cue.
        </li>
      </ul>

      <h2 id="snippet-gen">AI-generated snippets</h2>
      <p>
        Ask the AI to generate reusable snippets from RoyCSS
        primitives. Example:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* AI prompt */
"Generate a VS Code snippet that inserts a RoyCSS pricing card
with three tiers. Use the r-card-base, r-hover-lift,
r-btn-glow-emerald, r-text-gradient, and r-border-shine classes."

/* AI output: a snippet file you can drop into .vscode/ */`}</code>
      </pre>

      <h2 id="cli-lint">Lint the AI’s output</h2>
      <p>
        Always lint AI-generated RoyCSS code. The linter is the
        ground truth:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss lint --a11y src/**/*.tsx

src/SaveButton.tsx:12   error    Unknown class "r-hover-lifft"
                                 did you mean "r-hover-lift"?
src/Loader.tsx:8        warning  r-loader-ring missing role="status"
src/Subscribe.tsx:18    warning  Icon-only button missing .sr-only text

✓ 1 error, 2 warnings`}</code>
      </pre>

      <h2 id="image-gen">Generating effect previews</h2>
      <p>
        For visual previews of effects, the AI can use the RoyCSS
        inspect + bundle CLI commands to produce a single HTML file
        that contains the effect — useful for review:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`$ npx roycss inspect r-hover-lift --html > preview.html
$ open preview.html`}</code>
      </pre>
    </>
  );
}
