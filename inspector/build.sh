#!/usr/bin/env bash
# RoyCSS Inspector — build script.
#
# Produces:
#   1. inspector/effects.json  — full 1,569-effect dataset with cssCode,
#                                 generated from src/lib/roycss-effects.ts.
#                                 Fallback: copy dist/effects.json
#                                 (metadata-only, no cssCode).
#   2. roycss-inspector.zip     — zipped extension (excluding
#                                 legacy-sidepanel/, node_modules/, *.zip,
#                                 build.sh itself).
#
# Requirements:
#   - bun (for the effects.json generator)
#   - zip (for the zip step)
#
# Usage:
#   bash inspector/build.sh
#
# Exit codes:
#   0 = success
#   1 = effects.json generation failed (and fallback also failed)
#   2 = manifest.json is invalid JSON
#   3 = zip step failed

set -euo pipefail

# Resolve the repo root (parent of the inspector/ directory).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSPECTOR_DIR="$SCRIPT_DIR"
REPO_ROOT="$(cd "$INSPECTOR_DIR/.." && pwd)"

echo "[build] RoyCSS Inspector build starting"
echo "[build] inspector dir: $INSPECTOR_DIR"
echo "[build] repo root:     $REPO_ROOT"

# ─── Step 1: Generate effects.json ──────────────────────────────

EFFECTS_JSON="$INSPECTOR_DIR/effects.json"
SRC_EFFECTS_TS="$REPO_ROOT/src/lib/roycss-effects.ts"
DIST_EFFECTS_JSON="$REPO_ROOT/dist/effects.json"

# We try the full-data generator first (includes cssCode). If bun or the
# source file is unavailable, we fall back to copying dist/effects.json
# (metadata-only — the panel will show "CSS source not bundled" for each
# effect in that case, but the inspector still works for scanning,
# categorization, and highlighting).

if command -v bun >/dev/null 2>&1 && [ -f "$SRC_EFFECTS_TS" ]; then
  echo "[build] generating effects.json (full, with cssCode) via bun…"
  # Inline Bun script — keeps build.sh self-contained.
  cat > "$INSPECTOR_DIR/.build-effects.mjs" <<'BUN_SCRIPT'
import { effects } from "../src/lib/roycss-effects.ts";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "effects.json");

// Pick the fields the panel needs. cssCode is included verbatim — the
// panel uses textContent (no HTML parsing), so even CSS with special
// characters is safe.
const picked = effects.map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  description: e.description,
  tags: e.tags,
  cssCode: e.cssCode,
  previewType: e.previewType,
}));

const json = JSON.stringify(picked);
const sizeKb = Buffer.byteLength(json, "utf-8") / 1024;
writeFileSync(outPath, json, "utf-8");

console.log(`[build] wrote ${picked.length} effects to ${outPath}`);
console.log(`[build] size: ${sizeKb.toFixed(1)} KB`);
console.log(`[build] categories: ${[...new Set(picked.map((e) => e.category))].length}`);
BUN_SCRIPT
  if bun "$INSPECTOR_DIR/.build-effects.mjs"; then
    rm -f "$INSPECTOR_DIR/.build-effects.mjs"
    echo "[build] effects.json generated successfully"
  else
    echo "[build] WARN: bun generator failed; falling back to dist/effects.json"
    rm -f "$INSPECTOR_DIR/.build-effects.mjs"
    if [ -f "$DIST_EFFECTS_JSON" ]; then
      cp "$DIST_EFFECTS_JSON" "$EFFECTS_JSON"
      echo "[build] copied dist/effects.json (metadata-only, no cssCode)"
    else
      echo "[build] ERROR: dist/effects.json not found either; cannot proceed"
      exit 1
    fi
  fi
else
  echo "[build] bun or src/lib/roycss-effects.ts unavailable; using dist/effects.json"
  if [ -f "$DIST_EFFECTS_JSON" ]; then
    cp "$DIST_EFFECTS_JSON" "$EFFECTS_JSON"
    echo "[build] copied dist/effects.json (metadata-only, no cssCode)"
  else
    echo "[build] ERROR: dist/effects.json not found; cannot proceed"
    exit 1
  fi
fi

# Verify effects.json is valid JSON.
if ! node -e "JSON.parse(require('fs').readFileSync('$EFFECTS_JSON','utf8'))" 2>/dev/null; then
  echo "[build] ERROR: effects.json is not valid JSON"
  exit 1
fi
EFFECTS_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$EFFECTS_JSON','utf8')).length)")
EFFECTS_SIZE=$(stat -c%s "$EFFECTS_JSON" 2>/dev/null || stat -f%z "$EFFECTS_JSON" 2>/dev/null)
echo "[build] effects.json: $EFFECTS_COUNT effects, $EFFECTS_SIZE bytes"

# ─── Step 2: Validate manifest.json ─────────────────────────────

MANIFEST="$INSPECTOR_DIR/manifest.json"
echo "[build] validating manifest.json…"
if ! node -e "JSON.parse(require('fs').readFileSync('$MANIFEST','utf8'))" 2>/dev/null; then
  echo "[build] ERROR: manifest.json is not valid JSON"
  exit 2
fi
echo "[build] manifest.json: valid JSON"

# ─── Step 3: Verify all required files exist ────────────────────

echo "[build] verifying required files…"
REQUIRED=(
  "$INSPECTOR_DIR/manifest.json"
  "$INSPECTOR_DIR/background.js"
  "$INSPECTOR_DIR/content-script.js"
  "$INSPECTOR_DIR/devtools.html"
  "$INSPECTOR_DIR/devtools.js"
  "$INSPECTOR_DIR/panel.html"
  "$INSPECTOR_DIR/panel.js"
  "$INSPECTOR_DIR/popup.html"
  "$INSPECTOR_DIR/popup.js"
  "$INSPECTOR_DIR/effects.json"
  "$INSPECTOR_DIR/README.md"
  "$INSPECTOR_DIR/icons/icon16.png"
  "$INSPECTOR_DIR/icons/icon48.png"
  "$INSPECTOR_DIR/icons/icon128.png"
)
for f in "${REQUIRED[@]}"; do
  if [ ! -f "$f" ]; then
    echo "[build] ERROR: missing required file: $f"
    exit 4
  fi
done
echo "[build] all 14 required files present"

# ─── Step 4: Zip the extension ──────────────────────────────────

ZIP_OUT="$INSPECTOR_DIR/roycss-inspector.zip"
echo "[build] zipping into $ZIP_OUT …"

# Remove any stale zip.
rm -f "$ZIP_OUT"

# Build the exclude list. zip's -x patterns are relative to the zip
# root, which is the inspector/ directory (because we cd into it).
cd "$INSPECTOR_DIR"

# Use zip if available; fall back to python's zipfile.
if command -v zip >/dev/null 2>&1; then
  zip -r -q "$ZIP_OUT" . \
    -x "legacy-sidepanel/*" \
    -x "node_modules/*" \
    -x "*.zip" \
    -x "build.sh" \
    -x ".build-effects.mjs" \
    -x ".DS_Store" \
    || { echo "[build] ERROR: zip failed"; exit 3; }
else
  echo "[build] zip command not found; using python zipfile"
  python3 -c "
import os, zipfile, sys
exclude_dirs = {'legacy-sidepanel', 'node_modules', '.git'}
exclude_files = {'build.sh', 'roycss-inspector.zip', '.build-effects.mjs', '.DS_Store'}
with zipfile.ZipFile('$ZIP_OUT', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f in exclude_files or f.endswith('.zip'):
                continue
            full = os.path.join(root, f)
            arc = os.path.relpath(full, '.')
            zf.write(full, arc)
" || { echo "[build] ERROR: python zip failed"; exit 3; }
fi

ZIP_SIZE=$(stat -c%s "$ZIP_OUT" 2>/dev/null || stat -f%z "$ZIP_OUT" 2>/dev/null)
echo "[build] zip size: $ZIP_SIZE bytes"

# ─── Done ───────────────────────────────────────────────────────

echo ""
echo "[build] ✅ RoyCSS Inspector build complete"
echo "[build]    effects.json: $EFFECTS_COUNT effects ($EFFECTS_SIZE bytes)"
echo "[build]    zip:          $ZIP_OUT ($ZIP_SIZE bytes)"
echo "[build]"
echo "[build] To load in Chrome:"
echo "[build]   1. Open chrome://extensions"
echo "[build]   2. Toggle 'Developer mode' (top right)"
echo "[build]   3. Click 'Load unpacked'"
echo "[build]   4. Select: $INSPECTOR_DIR"
echo "[build]   5. Open DevTools on any page → find the 'RoyCSS' tab"
