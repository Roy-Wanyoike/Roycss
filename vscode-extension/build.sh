#!/usr/bin/env bash
#
# RoyCSS VSCode Extension — build script.
#
# Produces roycss-vscode-1.0.0.vsix by:
#   1. Regenerating class-data.json + snippets.json from ../dist/effects.json
#      + ../dist/roycss.css (idempotent — skips if you pass --no-regen).
#   2. Packaging with vsce (prefers global, falls back to npx).
#
# Usage:
#   bash build.sh              # regenerate data + package
#   bash build.sh --no-regen   # package only (use existing data files)
#
# Exit codes:
#   0  success
#   1  data generation failed
#   2  packaging failed (vsce/npx missing, or package step errored)

set -euo pipefail
cd "$(dirname "$0")"

EXT_NAME="roycss"
EXT_VERSION="1.0.0"
OUT_VSIX="roycss-vscode-${EXT_VERSION}.vsix"
REGEN_DATA=1

if [[ "${1:-}" == "--no-regen" ]]; then
  REGEN_DATA=0
fi

echo "── RoyCSS VSCode Extension build ─────────────────────────────────────"
echo "  extension : ${EXT_NAME}"
echo "  version   : ${EXT_VERSION}"
echo "  output    : ${OUT_VSIX}"
echo "  regen data: $([[ $REGEN_DATA -eq 1 ]] && echo yes || echo no)"
echo ""

# ─── 1. Regenerate data ──────────────────────────────────────────────────
if [[ $REGEN_DATA -eq 1 ]]; then
  echo "[1/3] Regenerating class-data.json + snippets.json..."
  if [[ ! -f "../dist/effects.json" ]]; then
    echo "ERROR: ../dist/effects.json not found." >&2
    echo "       Run 'bun run build' in the project root first." >&2
    exit 1
  fi
  if [[ ! -f "../dist/roycss.css" ]]; then
    echo "ERROR: ../dist/roycss.css not found." >&2
    echo "       Run 'bun run build' in the project root first." >&2
    exit 1
  fi
  if ! node build-data.js; then
    echo "ERROR: build-data.js failed." >&2
    exit 1
  fi
  echo ""
else
  echo "[1/3] Skipping data regeneration (--no-regen)."
  if [[ ! -f "class-data.json" || ! -f "snippets.json" ]]; then
    echo "ERROR: class-data.json or snippets.json missing. Remove --no-regen." >&2
    exit 1
  fi
fi

# ─── 2. Verify pre-package files ─────────────────────────────────────────
echo "[2/3] Verifying pre-package files..."
REQUIRED_FILES=(
  "package.json"
  "extension.js"
  "class-data.json"
  "snippets.json"
  "language-configuration.json"
  "icons/icon.png"
  "LICENSE"
  "README.md"
  "CHANGELOG.md"
  ".vscodeignore"
)
for f in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: missing required file: $f" >&2
    exit 2
  fi
done
echo "  ✓ All ${#REQUIRED_FILES[@]} required files present."

# Verify extension.js syntax
if ! node -c extension.js; then
  echo "ERROR: extension.js has a syntax error." >&2
  exit 2
fi
echo "  ✓ extension.js syntax OK."

# Verify JSON files
for f in package.json class-data.json snippets.json language-configuration.json; do
  if ! node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null; then
    echo "ERROR: $f is not valid JSON." >&2
    exit 2
  fi
done
echo "  ✓ All JSON files valid."

# Verify class-data count
EFFECT_COUNT=$(node -e "console.log(require('./class-data.json').effects.length)")
if [[ $EFFECT_COUNT -lt 1569 ]]; then
  echo "ERROR: class-data.json has only $EFFECT_COUNT effects (expected ≥1569)." >&2
  exit 2
fi
echo "  ✓ class-data.json has $EFFECT_COUNT effects."

# ─── 3. Package with vsce ────────────────────────────────────────────────
echo ""
echo "[3/3] Packaging .vsix..."

# Remove any stale .vsix
rm -f "$OUT_VSIX"

VSCE_ARGS=(
  "--no-yarn"
  "--no-dependencies"
  "--allow-star-activation"
  "--no-git-tag-version"
)

if command -v vsce >/dev/null 2>&1; then
  echo "  Using global vsce: $(command -v vsce)"
  if ! vsce package "${VSCE_ARGS[@]}"; then
    echo "ERROR: 'vsce package' failed." >&2
    exit 2
  fi
elif command -v npx >/dev/null 2>&1; then
  echo "  vsce not installed globally — using npx @vscode/vsce..."
  if ! npx --yes @vscode/vsce@latest package "${VSCE_ARGS[@]}"; then
    echo "ERROR: 'npx @vscode/vsce package' failed." >&2
    echo ""
    echo "Manual packaging steps are documented in README.md §'Manual packaging'." >&2
    exit 2
  fi
else
  echo "ERROR: neither vsce nor npx is available on PATH." >&2
  echo ""
  echo "To install vsce globally:  npm install -g @vscode/vsce" >&2
  echo "To install Node.js (includes npx):  https://nodejs.org/" >&2
  echo ""
  echo "Manual packaging steps are documented in README.md §'Manual packaging'." >&2
  exit 2
fi

# vsce outputs to roycss-1.0.0.vsix by default (from package.json name+version).
# Rename to our preferred filename.
DEFAULT_OUT="${EXT_NAME}-${EXT_VERSION}.vsix"
if [[ -f "$DEFAULT_OUT" && "$DEFAULT_OUT" != "$OUT_VSIX" ]]; then
  mv "$DEFAULT_OUT" "$OUT_VSIX"
fi

if [[ ! -f "$OUT_VSIX" ]]; then
  echo "ERROR: $OUT_VSIX was not produced." >&2
  ls -la *.vsix 2>/dev/null || true
  exit 2
fi

# ─── Done ────────────────────────────────────────────────────────────────
VSIX_SIZE=$(stat -c%s "$OUT_VSIX" 2>/dev/null || stat -f%z "$OUT_VSIX")
echo ""
echo "✅ Built $OUT_VSIX ($(awk "BEGIN{printf \"%.1f\", $VSIX_SIZE/1024}") KB)"
echo ""
echo "Install with:"
echo "  code --install-extension $OUT_VSIX"
echo ""
echo "Or in VSCode: Extensions panel → '…' menu → Install from VSIX… → pick $OUT_VSIX"
