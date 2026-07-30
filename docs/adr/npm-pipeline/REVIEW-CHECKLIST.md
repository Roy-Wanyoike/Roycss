# RoyCSS npm Publication Pipeline — Review Checklist

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** npm Publication Pipeline domain
- **Scope:** 15 review items covering version bumping, changelog
  generation, publish flow, provenance, CI, and security. Every item
  must be **verified** before the pipeline is considered shipped.

> Each item has a verification command or manual check. Items marked
> **[BLOCKING]** must pass; items marked **[ADVISORY]** are warnings
> that should be investigated but don't block the release.

---

## Version bumping

### 1. `bump-version.ts` updates all 4 manifests atomically

**Verify:**
```bash
cd /home/z/my-project
bun run scripts/release/bump-version.ts --patch
grep '"version"' package.roycss.json cli/package.json mcp-server/package.json vscode-extension/package.json
# All four should print 1.0.1
git checkout -- package.roycss.json cli/package.json mcp-server/package.json vscode-extension/package.json
# All four restored to 1.0.0
```

**[BLOCKING]** All four manifests must show the new version. If any one
is missing, the script must error before writing any of them.

### 2. `bump-version.ts` rejects conflicting flags

**Verify:**
```bash
bun run scripts/release/bump-version.ts --major --minor
# Should exit 1 with "Error: pass exactly one of --major/--minor/--patch/--version"
```

**[BLOCKING]** Passing two or more bump flags must error.

### 3. `bump-version.ts` validates `--version` semver shape

**Verify:**
```bash
bun run scripts/release/bump-version.ts --version not-a-version
# Should exit 1 with "Error: --version must be X.Y.Z[-pre], got: not-a-version"
bun run scripts/release/bump-version.ts --version 1.2.3-rc.1
# Should succeed; revert afterwards
```

**[BLOCKING]** Invalid version strings must be rejected before any file
is written.

---

## Changelog generation

### 4. `generate-changelog.ts` produces valid Keep a Changelog format

**Verify:**
```bash
# Drop a sample entry
cat > scripts/release/changelog-entries/_test-entry.md <<'EOF'
---
type: added
pr: 999
---
Test entry — should appear under Added in [Unreleased].
EOF

bun run scripts/release/generate-changelog.ts

# Verify the [Unreleased] section appears with the entry
head -30 CHANGELOG.md
# Should contain "## [Unreleased]" and "Test entry" under "### Added"

# Verify the entry file was moved to consumed/
ls scripts/release/changelog-entries/consumed/

# Revert
git checkout -- CHANGELOG.md
rm -rf scripts/release/changelog-entries/consumed/
rm scripts/release/changelog-entries/_test-entry.md
```

**[BLOCKING]** The `[Unreleased]` section must appear above `[1.0.0]`.
The entry file must be moved to `consumed/`.

### 5. `generate-changelog.ts` rejects invalid `type` in frontmatter

**Verify:**
```bash
cat > scripts/release/changelog-entries/_bad-type.md <<'EOF'
---
type: banana
pr: 999
---
Bad type entry.
EOF

bun run scripts/release/generate-changelog.ts
# Should exit 1 with "Error: invalid type 'banana' in _bad-type.md"

rm scripts/release/changelog-entries/_bad-type.md
```

**[BLOCKING]** Only `added`, `changed`, `deprecated`, `removed`,
`fixed`, `security` are accepted.

### 6. `CHANGELOG.md` has the `[Unreleased]` + `[1.0.0]` sections with link definitions

**Verify:**
```bash
grep -E '^\[Unreleased\]|\[1\.0\.0\]:' CHANGELOG.md
# Should match both link definitions at the bottom
```

**[BLOCKING]** Both link definitions must exist and point to valid
GitHub URLs.

---

## Publish flow

### 7. `publish.ts` dry-run completes without errors

**Verify:**
```bash
cd /home/z/my-project
bun run scripts/release/publish.ts
# Should print: lint OK, build OK, npm publish --dry-run OK, tarball size, file count
# Should NOT call npm publish (no --execute)
# Should exit 0
```

**[BLOCKING]** Dry-run must complete. No actual publish may occur.

### 8. `publish.ts` does NOT publish without `--execute`

**Verify:** Read `scripts/release/publish.ts` and confirm the
`npm publish` (no `--dry-run`) call is inside an `if (execute)` block.

**[BLOCKING]** The publish command must be unreachable without
`--execute`.

### 9. `publish.ts` reports tarball size + file count

**Verify:**
```bash
bun run scripts/release/publish.ts 2>&1 | grep -E '(tarball|file count|compressed|unpacked)'
# Should print tarball size and file count from npm publish --dry-run output
```

**[BLOCKING]** The summary must include tarball size and file count.

### 10. `publish.ts --execute` fails gracefully without `NPM_TOKEN`

**Verify (manual — don't actually run):** Read the script and confirm
that if `--execute` is passed but `process.env.NPM_TOKEN` is unset, the
script prints a clear error and exits 1 before calling `npm publish`.

**[BLOCKING]** The script must not call `npm publish` if
`NPM_TOKEN` is missing.

---

## Provenance & manifest

### 11. `package.roycss.json` has `publishConfig` with `provenance: true`

**Verify:**
```bash
node -e "const p=require('./package.roycss.json'); console.log(JSON.stringify(p.publishConfig))"
# Should print: {"access":"public","provenance":true}
```

**[BLOCKING]** `publishConfig.access` must be `"public"` and
`publishConfig.provenance` must be `true`.

### 12. The published tarball has no `postinstall` / `preinstall` / `install` scripts

**Verify:**
```bash
bun run scripts/release/publish.ts 2>&1 | grep -i 'scripts'
# Or inspect the dry-run tarball contents
node -e "const p=require('./package.roycss.json'); const s=p.scripts||{}; \
  ['preinstall','install','postinstall','prepublish','prepare'].forEach(k => \
  console.log(k + ':', s[k] || 'absent'))"
# preinstall / install / postinstall must be absent.
# prepublishOnly is OK (runs at publish time, not install time).
```

**[BLOCKING]** No install-time scripts. `prepublishOnly` (runs on the
publisher side, not the consumer side) is allowed.

---

## CI workflow

### 13. `.github/workflows/release.yml` triggers on tag push only

**Verify:**
```bash
node -e "
const yaml = require('yaml');
const fs = require('fs');
const w = yaml.parse(fs.readFileSync('.github/workflows/release.yml','utf8'));
console.log('on:', JSON.stringify(w.on));
console.log('permissions:', JSON.stringify(w.jobs.release.permissions));
"
# on should contain push.tags = ['v*']
# permissions should contain id-token: write (for provenance)
# permissions should contain contents: write (for tag)
```

**[BLOCKING]** Trigger must be `push.tags: ['v*']`. Permissions must
include `id-token: write` (provenance) and `contents: write` (tag
push). No other permissions.

### 14. CI uses `NODE_AUTH_TOKEN` (not `NPM_TOKEN`) for npm publish

**Verify:**
```bash
grep -E 'NODE_AUTH_TOKEN|NPM_TOKEN' .github/workflows/release.yml
# Should see: env: NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
# (The secret is NPM_TOKEN in GitHub; the env var that actions/setup-node
#  reads is NODE_AUTH_TOKEN.)
```

**[BLOCKING]** `actions/setup-node` reads `NODE_AUTH_TOKEN` from the
env. Passing the secret as `NPM_TOKEN` would not authenticate.

### 15. Lint passes after all changes

**Verify:**
```bash
cd /home/z/my-project
bun run lint
# Should exit 0
```

**[BLOCKING]** Lint must pass. The release scripts must not introduce
any lint errors.

---

## Summary

- **[BLOCKING]** items: 14
- **[ADVISORY]** items: 1 (none currently — all items are blocking)

If any **[BLOCKING]** item fails, the pipeline is not shippable. File
an issue, fix the failure, and re-run the checklist before declaring
the pipeline ready.
