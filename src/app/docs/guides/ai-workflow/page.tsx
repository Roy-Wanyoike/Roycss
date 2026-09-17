import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Workflow — RoyCSS Docs",
  description: "Use RoyCSS with AI assistants: MCP server, prompts, class validation, and review workflow.",
};

export default function AiWorkflowPage() {
  return (
    <>
      <h1>AI Workflow</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS is designed to be AI-friendly. The MCP server, the
        CLI&apos;s search/validate commands, and a strict naming
        convention give your AI coding assistant the tools it needs
        to write correct RoyCSS without hallucinating class names.
      </p>

      <h2 id="mcp-server">Connect the MCP server</h2>
      <p>
        The Model Context Protocol server in the RoyCSS repo
        exposes the catalog to your AI client — including{" "}
        <code>search_effects</code>, <code>get_effect</code>, and{" "}
        <code>validate_class_name</code>. See the{" "}
        <a className="text-primary hover:underline" href="/docs/getting-started/mcp-server">
          MCP server guide
        </a>{" "}
        for setup details — quick version:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "mcpServers": {
    "roycss": {
      "command": "bun",
      "args": ["/path/to/roycss/mcp-server/index.ts"]
    }
  }
}`}</code>
      </pre>
      <p>
        Once connected, your AI can search the catalog, fetch exact
        CSS, and validate class names directly.
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
"Build a pricing card with RoyCSS: a glass card, a glow button,
and an animated gradient border."

/* Pattern 3 — ask for the API */
"What RoyCSS classes are available for full-screen loaders?
Show me the CSS for the ring-spin variant and explain it."`}</code>
      </pre>

      <h2 id="avoid-hallucination">Avoid class hallucination</h2>
      <p>
        The biggest AI pitfall with CSS libraries is inventing
        class names. The MCP server prevents this by giving the AI
        a live catalog. Without MCP, prime the AI with the real
        convention — every class is fully prefixed{" "}
        <code>roycss-*</code> and usually category-led — and tell
        it how to verify:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* Prime the AI */
"Use only RoyCSS classes from the shipped stylesheet. Every class
is fully prefixed roycss-* (e.g. roycss-btn-glow,
roycss-hover-push-up, roycss-text-shimmer). There are no r-*
short forms and no --modifier classes. If you're unsure a class
exists, run \`npx roycss info <effect-id>\` before writing it."`}</code>
      </pre>

      <h2 id="review-workflow">Review workflow</h2>
      <p>
        When reviewing AI-generated RoyCSS code, three things to
        check:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Class names are real</strong> — run{" "}
          <code>npx roycss doctor</code>: it scans your source and
          reports unknown <code>roycss-*</code> classes (typos).
        </li>
        <li>
          <strong>Effects are compositional</strong> — one effect
          per element per concern; no two classes fighting over{" "}
          <code>transform</code>.
        </li>
        <li>
          <strong>Accessibility is intact</strong> —{" "}
          <code>role="status"</code> on loaders,{" "}
          <code>.roycss-sr-only</code> text on icon-only controls,
          color is not the only state cue.
        </li>
      </ul>

      <h2 id="snippet-gen">AI-generated snippets</h2>
      <p>
        Ask the AI to generate reusable snippets from real
        classes. Example:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`/* AI prompt */
"Generate a VS Code snippet that inserts a RoyCSS pricing card
with three tiers. Use the roycss-card-glassmorphism, roycss-hover-push-up,
roycss-btn-glow, and roycss-text-gradient classes."

/* AI output: a snippet file you can drop into .vscode/ */`}</code>
      </pre>

      <h2 id="verify">Verify the AI&apos;s output</h2>
      <p>
        Always verify AI-generated RoyCSS code against the
        catalog — the CLI is the ground truth:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Does the class exist? (fuzzy-matches + suggests)
$ npx roycss info text-shimer
Effect "text-shimer" not found.
  Did you mean?
    roycss-text-shimmer — Shimmer Text

# Scan the whole project for unknown classes
$ npx roycss doctor`}</code>
      </pre>
    </>
  );
}
