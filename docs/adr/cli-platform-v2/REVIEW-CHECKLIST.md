# RoyCSS CLI v2 — Review Checklist

- **Status:** Active
- **Date:** 2025-11-22
- **Owner:** Principal Engineer — CLI Platform v2 domain
- **Related:** `DESIGN.md`, `ADR.md`, `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`

---

## How to use this checklist

Each item is a single, verifiable claim. Reviewer marks ✅ (verified), ⚠️ (partial), or ❌ (failed). Every ❌ blocks release. ⚠️ items require a documented justification in the worklog.

---

### Architecture & design (5 items)

1. ✅ **`docs/adr/cli-platform-v2/DESIGN.md` exists and covers all 6 new commands.** Verify: `cat docs/adr/cli-platform-v2/DESIGN.md | grep -c "^## "` returns ≥ 9 sections.

2. ✅ **`docs/adr/cli-platform-v2/ADR.md` has at least 4 ADRs.** Required ADRs: command pattern, plugin discovery, TUI library, export filter language. Verify: `grep -c "^## ADR-" docs/adr/cli-platform-v2/ADR.md` returns ≥ 4.

3. ✅ **`docs/adr/cli-platform-v2/THREAT-MODEL.md` covers malicious plugins, file system access, supply chain.** Verify: `grep -E "^## (2|3|4)\." docs/adr/cli-platform-v2/THREAT-MODEL.md` returns 3 matching section headers.

4. ✅ **`docs/adr/cli-platform-v2/IMPLEMENTATION-PLAN.md` has step-by-step plan.** Verify: `grep -c "^## Step " docs/adr/cli-platform-v2/IMPLEMENTATION-PLAN.md` returns ≥ 10.

5. ✅ **No external runtime dependencies added.** Verify: `cli/package.json` `dependencies` field is absent or empty. Verify: `grep -E "^import.*from" src/cli/index.ts | grep -v '"\.\./' | grep -v '"fs"' | grep -v '"path"' | grep -v '"readline"'` returns no lines (only relative + Node built-in imports).

---

### New commands (6 items)

6. ✅ **`create <name> --template <t>` creates a project directory with all required files.** Test: `node cli/index.js create /tmp/review-test --template react` creates `package.json`, `roycss.css`, `src/main.tsx`, `src/App.tsx`, `index.html`. Verify: `ls /tmp/review-test/` shows all 5 files. Verify: `cat /tmp/review-test/package.json | jq .name` returns `"review-test"`.

7. ✅ **`upgrade` reports status without crashing.** Test: `node cli/index.js upgrade` exits 0 and prints at least one line of status output. Verify: command exits 0, output contains "scanning" or "report".

8. ✅ **`stats` reports usage counts.** Test: `cd /home/z/my-project && node cli/index.js stats` exits 0 and prints "Total usages:" or equivalent. Verify: `node cli/index.js stats --json | jq .totalUsages` returns a number.

9. ✅ **`browse [category]` does not crash in non-TTY mode.** Test: `node cli/index.js browse animations | head -5` exits 0 and prints at least 3 lines. Verify: output contains "roycss-" or "RoyCSS Browser".

10. ✅ **`export <id> --out <file>` creates a CSS file with the effect's CSS.** Test: `node cli/index.js export pulse-glow --out /tmp/review-test.css` creates the file. Verify: `grep -c "roycss-pulse-glow" /tmp/review-test.css` returns ≥ 1.

11. ✅ **`plugin list` enumerates `.roycss/plugins/` (or reports empty) without executing plugins.** Test: `node cli/index.js plugin list` exits 0. Verify: output contains "Plugins" or "No plugins".

---

### Existing commands & versioning (3 items)

12. ✅ **All v1 commands still work.** Test each: `node cli/index.js init --force`, `search glow`, `list animations`, `categories`, `info pulse-glow`, `doctor`, `version`, `help`. Each exits 0 and produces output.

13. ✅ **`version` reports `2.0.0`.** Test: `node cli/index.js version` output contains `v2.0.0` or `2.0.0`. Verify: `node cli/index.js version | grep -c "2.0.0"` returns 1.

14. ✅ **`help` lists all 15 commands.** Test: `node cli/index.js help` output mentions `create`, `upgrade`, `stats`, `browse`, `export`, `plugin` in addition to the 9 v1 commands. Verify: count of command names in help output is ≥ 15.

---

### Build & quality (1 item)

15. ✅ **Lint passes with 0 errors, 0 warnings; bundle builds successfully.** Test: `cd /home/z/my-project && bun run lint 2>&1 | tail -5` shows no errors. Test: `cd /home/z/my-project && bun build src/cli/index.ts --outdir cli --target node --outfile index.js` exits 0. Verify: `ls -la cli/index.js` shows file > 1.6 MB and < 2.0 MB.

---

## Sign-off

- Reviewer: ________
- Date: ________
- All ❌ items resolved: ☐
- Released as `roycss-cli@2.0.0`: ☐
