import type { Metadata } from "next";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "MCP Server — RoyCSS Docs",
  description: "Connect AI assistants (Claude, Cursor, Copilot) to RoyCSS via the Model Context Protocol server in the RoyCSS monorepo.",
};

export default function McpServerPage() {
  return (
    <>
      <h1>MCP Server</h1>
      <p className="text-lg text-muted-foreground">
        The RoyCSS monorepo ships a Model Context Protocol (MCP)
        server — <code>@roycss/mcp-server</code> — so your AI coding
        assistant can look up effect classes, validate names, and
        suggest combinations without leaving the chat.
      </p>

      <h2 id="what-is-mcp">What is MCP?</h2>
      <p>
        MCP is an open protocol that lets AI assistants query
        external tools during a conversation. The RoyCSS server
        exposes 13 read-only tools, 5 resources, and 3 prompt
        templates:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><code>search_effects</code> — search all {EFFECT_COUNT_FORMATTED} effects by keyword, category, or tags.</li>
        <li><code>get_effect</code> — full metadata + CSS for one effect by ID.</li>
        <li><code>list_categories</code> — categories with labels and effect counts.</li>
        <li><code>get_install</code> — install commands for npm/pnpm/yarn/bun/deno/CDN.</li>
        <li><code>get_framework_usage</code> — React/Vue/Angular/Svelte/Next.js/vanilla examples.</li>
        <li><code>get_design_tokens</code> — the OKLCH color system and tokens.</li>
        <li><code>get_recipes</code> — 12 curated effect combinations.</li>
        <li><code>get_patterns</code> / <code>get_pattern</code> — 10 UI patterns (empty state, loading, error, …) with full HTML.</li>
        <li><code>validate_class_name</code> — check a <code>roycss-*</code> class exists; suggests closest matches.</li>
        <li><code>suggest_for_intent</code> — from a UX intent string to effects + patterns + recipes.</li>
        <li><code>get_accessibility_considerations</code> / <code>get_browser_support</code> — per-effect a11y and support info.</li>
      </ul>

      <h2 id="install">Run the server</h2>
      <p>
        The server lives in the RoyCSS repository under{" "}
        <code>mcp-server/</code>. Clone the repo and start it with
        Bun (it speaks MCP over stdio):
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss/mcp-server
bun install

# start (stdio) — your AI client connects to this process
bun index.ts`}</code>
      </pre>

      <h2 id="claude-desktop">Claude Desktop</h2>
      <p>
        Point your client at the server process. For Claude
        Desktop, add an entry to the config:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "mcpServers": {
    "roycss": {
      "command": "bun",
      "args": ["/absolute/path/to/roycss/mcp-server/index.ts"]
    }
  }
}`}</code>
      </pre>

      <h2 id="cursor">Cursor</h2>
      <p>
        Cursor reads MCP config from{" "}
        <code>.cursor/mcp.json</code> in your project root — same
        JSON shape:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "mcpServers": {
    "roycss": {
      "command": "bun",
      "args": ["/absolute/path/to/roycss/mcp-server/index.ts"]
    }
  }
}`}</code>
      </pre>

      <h2 id="github-copilot">GitHub Copilot (VS Code)</h2>
      <p>
        With the latest VS Code Insiders, Copilot Chat can use MCP
        servers. Add the same server to{" "}
        <code>.vscode/mcp.json</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "servers": {
    "roycss": {
      "command": "bun",
      "args": ["/absolute/path/to/roycss/mcp-server/index.ts"]
    }
  }
}`}</code>
      </pre>

      <h2 id="example-prompts">Example prompts</h2>
      <p>
        Once the server is connected, try these in your AI client:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`"Find me a RoyCSS loader for a full-screen loader, no JS."
"Give me the exact CSS for hover-push-up and explain how it works."
"Suggest a card + hover + button combination for a pricing card."
"Validate that roycss-text-shimmer exists — did I typo it?"`}</code>
      </pre>

      <h2 id="security">Security model</h2>
      <p>
        The RoyCSS MCP server is <strong>read-only</strong> and
        runs entirely on your machine. It executes no shell
        commands, writes no files, and makes no network calls.
        Your AI client is the only thing calling it — the server
        never initiates outbound traffic.
      </p>

      <h2 id="diagnostics">Diagnostics</h2>
      <p>
        If your client says the server failed to start, run it
        manually to see the error:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`cd roycss/mcp-server && bun index.ts`}</code>
      </pre>
      <p>
        The server logs every tool call to stderr so you can see
        what your AI client is querying.
      </p>
    </>
  );
}
