import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Server — RoyCSS Docs",
  description: "Connect AI assistants (Claude, Cursor, Copilot) to RoyCSS via the Model Context Protocol server.",
};

export default function McpServerPage() {
  return (
    <>
      <h1>MCP Server</h1>
      <p className="text-lg text-muted-foreground">
        RoyCSS ships a Model Context Protocol (MCP) server so your AI
        coding assistant can look up effect classes, preview OKLCH
        values, and suggest class combinations without leaving the
        chat.
      </p>

      <h2 id="what-is-mcp">What is MCP?</h2>
      <p>
        MCP is an open protocol that lets AI assistants query
        external tools during a conversation. The RoyCSS MCP server
        exposes three read-only tools:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><code>roycss_search_effects</code> — full-text search across all 1,869 effects.</li>
        <li><code>roycss_get_effect</code> — fetch the exact CSS for a single effect.</li>
        <li><code>roycss_get_palette</code> — read the OKLCH palette values.</li>
      </ul>

      <h2 id="install">Install the server</h2>
      <p>
        The MCP server ships in the main <code>roycss</code> package.
        No separate install is needed — just point your client at it.
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`# Already installed if you have the npm package
npm install roycss`}</code>
      </pre>

      <h2 id="claude-desktop">Claude Desktop</h2>
      <p>
        Add an entry to your Claude Desktop config:
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
        Restart Claude Desktop and you’ll see a RoyCSS tool icon in
        the chat composer. Ask “find me a teal button glow effect” and
        Claude will call <code>roycss_search_effects</code> directly.
      </p>

      <h2 id="cursor">Cursor</h2>
      <p>
        Cursor reads MCP config from <code>.cursor/mcp.json</code> in
        your project root:
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

      <h2 id="github-copilot">GitHub Copilot (VS Code)</h2>
      <p>
        With the latest VS Code Insiders, Copilot Chat can use MCP
        servers. Add the same JSON shape to{" "}
        <code>.vscode/mcp.json</code>:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`{
  "servers": {
    "roycss": {
      "command": "npx",
      "args": ["-y", "roycss", "mcp"]
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
"Give me the exact CSS for r-hover-lift and explain how it works."
"What's the OKLCH value of --r-accent-strong?"
"Suggest a card + hover + button combination for a pricing card."`}</code>
      </pre>

      <h2 id="security">Security model</h2>
      <p>
        The RoyCSS MCP server is <strong>read-only</strong> and runs
        entirely on your machine. It executes no shell commands,
        writes no files, and makes no network calls. Your AI client
        is the only thing calling it — the server never initiates
        outbound traffic.
      </p>

      <h2 id="diagnostics">Diagnostics</h2>
      <p>
        If your client says the server failed to start, run it
        manually to see the error:
      </p>
      <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{`npx -y roycss mcp --verbose`}</code>
      </pre>
      <p>
        The server logs every tool call to stderr so you can see what
        your AI client is querying.
      </p>
    </>
  );
}
