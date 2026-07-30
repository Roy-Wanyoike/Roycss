# RoyCSS MCP Server

**Model Context Protocol server for RoyCSS** — gives AI assistants (Claude, ChatGPT, Cursor, Windsurf, Codex) access to official RoyCSS effects, documentation, and framework examples.

> No CSS framework owns AI integration well today. RoyCSS MCP Server changes that — every AI produces accurate RoyCSS code.

---

## What It Does

When connected to your AI assistant, the RoyCSS MCP Server provides:

| Tool | What it does |
|---|---|
| `search_effects` | Search 1569+ effects by keyword, category, or tags |
| `get_effect` | Get full CSS code for any effect by ID |
| `list_categories` | List all 20 categories with effect counts |
| `get_install` | Get install commands for npm/pnpm/yarn/bun/deno/CDN |
| `get_framework_usage` | Get React/Vue/Angular/Svelte/Next.js/vanilla code examples |
| `get_design_tokens` | Get OKLCH color system, principles, and tokens |
| `get_recipes` | Get curated effect combinations for common UI patterns |

### Example AI Prompts

Once configured, you can ask your AI assistant:

- *"Give me a glassmorphism card effect in RoyCSS"*
- *"How do I install RoyCSS with pnpm?"*
- *"Show me how to use RoyCSS in a Next.js project"*
- *"Find me a neon text effect"*
- *"Build a hero section using RoyCSS"*
- *"What CSS effects are available for loaders?"*

The AI will query the MCP server and return accurate, official RoyCSS code — no hallucination.

---

## Installation

### Option 1: Use with Bun (recommended)

```bash
# Clone and install
git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss/mcp-server
bun install
```

### Option 2: Use with npx (after npm publish)

```bash
npx @roycss/mcp-server
```

---

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "roycss": {
      "command": "bun",
      "args": ["/path/to/roycss/mcp-server/index.ts"]
    }
  }
}
```

Or with npx:

```json
{
  "mcpServers": {
    "roycss": {
      "command": "npx",
      "args": ["@roycss/mcp-server"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "roycss": {
      "command": "bun",
      "args": ["/path/to/roycss/mcp-server/index.ts"]
    }
  }
}
```

### Windsurf

Add to Windsurf's MCP settings (`Settings > MCP Servers`):

```json
{
  "roycss": {
    "command": "bun",
    "args": ["/path/to/roycss/mcp-server/index.ts"]
  }
}
```

### VS Code (with MCP extension)

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "roycss": {
      "command": "bun",
      "args": ["/path/to/roycss/mcp-server/index.ts"]
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add roycss bun /path/to/roycss/mcp-server/index.ts
```

---

## Available Tools

### 1. `search_effects`

Search effects by keyword, category, or tags.

```json
{
  "query": "glassmorphism",
  "category": "glass-ui",
  "limit": 10
}
```

Returns: `{ totalFound, showing, effects: [{ id, name, category, description, tags, previewType }] }`

### 2. `get_effect`

Get full CSS code for a specific effect.

```json
{
  "id": "btn-shine-sweep"
}
```

Returns: `{ id, name, category, description, tags, cssCode, usage }`

### 3. `list_categories`

List all categories with effect counts.

Returns: `{ totalCategories, totalEffects, categories: [{ id, label, count }] }`

### 4. `get_install`

Get installation instructions.

```json
{
  "manager": "pnpm"
}
```

Returns: `{ manager, install, description, import, usage, allManagers }`

### 5. `get_framework_usage`

Get framework-specific code examples.

```json
{
  "framework": "react",
  "effect_id": "btn-shine-sweep"
}
```

Returns: `{ framework, effectId, install, example, note }`

### 6. `get_design_tokens`

Get OKLCH design tokens and framework principles.

Returns: `{ colors, install, import, principles }`

### 7. `get_recipes`

Get curated UI pattern recipes.

```json
{
  "recipe": "hero-section"
}
```

Returns: `{ recipe, title, description, html, effects: [{ id, name, cssCode }] }`

Available recipes:
- `hero-section` — Hero with gradient text, glass card, shine button
- `loading-state` — Three loading indicators
- `feature-cards` — Feature cards with hover lift + glow
- `notification-badge` — Pulsing notification indicator
- `glass-navigation` — Floating glassmorphism nav bar

---

## Development

```bash
# Install dependencies
cd mcp-server
bun install

# Run in development (auto-restart)
bun run dev

# Run in production
bun start

# Build for distribution
bun run build
```

---

## How It Works

```
┌─────────────────┐     stdio      ┌─────────────────┐
│  AI Assistant   │ ←────────────→ │  RoyCSS MCP     │
│  (Claude, etc.) │                │  Server         │
└─────────────────┘                └────────┬────────┘
                                            │
                                    ┌───────┴───────┐
                                    │ effects.json  │
                                    │ 1569 effects   │
                                    │ 20 categories │
                                    └───────────────┘
```

1. The AI assistant sends a tool call (e.g., `search_effects("neon")`)
2. The MCP server queries the local `effects.json` (1569 effects)
3. The server returns structured JSON with matching effects
4. The AI uses the result to generate accurate RoyCSS code

**No API calls, no rate limits, no network required** — everything runs locally.

---

## License

MIT — part of the RoyCSS project.

## Links

- **RoyCSS**: [github.com/Roy-Wanyoike/roycss](https://github.com/Roy-Wanyoike/roycss)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues**: [github.com/Roy-Wanyoike/roycss/issues](https://github.com/Roy-Wanyoike/roycss/issues)
