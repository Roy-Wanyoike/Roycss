# RoyCSS CLI

Command-line tool for RoyCSS — search, add, and manage 1569+ production-ready CSS effects.

## Installation

```bash
# Use without installing (recommended)
npx roycss-cli init

# Or install globally
npm install -g roycss-cli
```

## Commands

| Command | Description |
|---|---|
| `roycss init` | Initialize RoyCSS in your project |
| `roycss add <effect-id>` | Add a specific effect's CSS file |
| `roycss search <query>` | Search effects by name, tag, or category |
| `roycss list [category]` | List all effects or filter by category |
| `roycss categories` | List all effect categories |
| `roycss info <effect-id>` | Show details about a specific effect |
| `roycss doctor` | Check project health and get recommendations |
| `roycss version` | Show CLI version |
| `roycss help` | Show help |

## Flags

| Flag | Description |
|---|---|
| `--copy` | Copy CSS to clipboard (use with `add`) |
| `--tag <tag>` | Filter by tag (use with `search`/`list`) |
| `--framework <name>` | Show framework usage (use with `info`/`init`) |
| `--json` | Output as JSON (use with `search`/`list`) |
| `--force` | Overwrite existing files (use with `init`) |

## Examples

```bash
# Initialize RoyCSS in your project
roycss init
roycss init --framework react

# Add a specific effect
roycss add pulse-glow
roycss add pulse-glow --copy    # Copy to clipboard instead

# Search for effects
roycss search "glass card"
roycss search loading --tag spinner
roycss search glow --json       # JSON output

# List effects
roycss list                     # All categories
roycss list animations          # Specific category
roycss list --json              # JSON output

# Get detailed info
roycss info btn-shine-sweep
roycss info btn-shine-sweep --framework react

# Check project health
roycss doctor
```

## License

MIT — part of the RoyCSS project.
