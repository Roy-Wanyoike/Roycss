# Review Checklist — RoyCSS VSCode Extension

- **Document owner:** Principal Engineer, VSCode Extension domain
- **Scope:** `/home/z/my-project/vscode-extension/`
- **Related:** `docs/adr/02-vscode-extension.md`, `docs/threat-models/02-vscode-extension.md`, `docs/benchmarks/02-vscode-extension.md`, `docs/plans/02-vscode-extension.md`
- **Use:** Run every item before tagging a release. Each item is binary (✅ / ❌) and includes the exact verification command.

---

## 1. Manifest (`package.json`)

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 1.1 | `name` is `roycss` | `node -e "console.log(require('./package.json').name)"` | `roycss` |
| 1.2 | `displayName` is `RoyCSS` | `node -e "console.log(require('./package.json').displayName)"` | `RoyCSS` |
| 1.3 | `publisher` is `roycss` | `node -e "console.log(require('./package.json').publisher)"` | `roycss` |
| 1.4 | `version` is `1.0.0` (SemVer) | `node -e "console.log(require('./package.json').version)"` | `1.0.0` |
| 1.5 | `engines.vscode` is `^1.85.0` | `node -e "console.log(require('./package.json').engines.vscode)"` | `^1.85.0` |
| 1.6 | `categories` includes `Snippets`, `Programming Languages`, `Other` | `node -e "console.log(require('./package.json').categories.join(','))"` | `Snippets,Programming Languages,Other` (order-insensitive) |
| 1.7 | `activationEvents` lists the six languages | `node -e "console.log(require('./package.json').activationEvents.join('\\n'))"` | `onLanguage:html`, `onLanguage:css`, `onLanguage:javascriptreact`, `onLanguage:typescriptreact`, `onLanguage:vue`, `onLanguage:svelte` |
| 1.8 | `main` is `./out/src/extension.js` | `node -e "console.log(require('./package.json').main)"` | `./out/src/extension.js` |
| 1.9 | `contributes.snippets` maps six languages to `./snippets/roycss.json` | `node -e "const s=require('./package.json').contributes.snippets; console.log(s.length, s[0].path)"` | `6 ./snippets/roycss.json` |
| 1.10 | `contributes.grammars` references `./syntaxes/roycss.tmLanguage.json` | `node -e "console.log(require('./package.json').contributes.grammars[0].path)"` | `./syntaxes/roycss.tmLanguage.json` |
| 1.11 | `contributes.commands` lists 3 commands | `node -e "console.log(require('./package.json').contributes.commands.map(c=>c.command).join(','))"` | `roycss.searchEffects,roycss.insertEffect,roycss.openPlayground` |
| 1.12 | `contributes.configuration` has `roycss.enableHoverPreview` and `roycss.maxCompletionItems` | `node -e "const p=require('./package.json').contributes.configuration.properties; console.log(Object.keys(p).join(','))"` | includes both keys |
| 1.13 | `scripts.vscode:prepublish` is `bun run compile` | `node -e "console.log(require('./package.json').scripts['vscode:prepublish'])"` | `bun run compile` |
| 1.14 | `scripts.compile` is `tsc -p ./` | `node -e "console.log(require('./package.json').scripts.compile)"` | `tsc -p ./` |
| 1.15 | `dependencies` is empty (no runtime deps) | `node -e "console.log(JSON.stringify(require('./package.json').dependencies||{}))"` | `{}` |
| 1.16 | `devDependencies` is exactly `@types/node`, `@types/vscode`, `typescript`, `@vscode/vsce` | `node -e "console.log(Object.keys(require('./package.json').devDependencies).sort().join(','))"` | `@types/node,@types/vscode,@vscode/vsce,typescript` |
| 1.17 | No `postinstall`, `preinstall`, `prepare` scripts | `node -e "const s=require('./package.json').scripts; console.log([s.preinstall,s.install,s.postinstall,s.prepare].filter(Boolean).length)"` | `0` |
| 1.18 | `repository`, `license`, `author`, `description`, `homepage`, `bugs` all present | `node -e "const p=require('./package.json'); console.log(['repository','license','author','description','homepage','bugs'].filter(k=>p[k]).length)"` | `6` |

## 2. Source code (`src/`)

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 2.1 | `src/extension.ts` exports `activate` and `deactivate` | `node -e "const m=require('./out/src/extension.js'); console.log(typeof m.activate, typeof m.deactivate)"` | `function function` |
| 2.2 | `src/completion-provider.ts` exports a class implementing `vscode.CompletionItemProvider` | `node -e "const m=require('./out/src/completion-provider.js'); console.log(typeof m.RoyCSSCompletionProvider.prototype.provideCompletionItems)"` | `function` |
| 2.3 | `src/hover-provider.ts` exports a class implementing `vscode.HoverProvider` | `node -e "const m=require('./out/src/hover-provider.js'); console.log(typeof m.RoyCSSHoverProvider.prototype.provideHover)"` | `function` |
| 2.4 | `src/commands.ts` exports a `registerCommands` function | `node -e "const m=require('./out/src/commands.js'); console.log(typeof m.registerCommands)"` | `function` |
| 2.5 | `src/search-panel.ts` exports `openPlayground` | `node -e "const m=require('./out/src/search-panel.js'); console.log(typeof m.openPlayground)"` | `function` |
| 2.6 | `src/effects-data.ts` exports `effects` with 1569 entries | `node -e "const m=require('./out/src/effects-data.js'); console.log(m.effects.length)"` | `1569` |
| 2.7 | `src/effects-data.ts` exports `getCssCode` returning a string | `node -e "const m=require('./out/src/effects-data.js'); console.log(typeof m.getCssCode('pulse-glow'))"` | `string` |
| 2.8 | Zero `eval` / `new Function` / `vm` usage in `src/` | `rg -n "\beval\(|new Function\(|require\('vm'\)|vm\.runIn" src/` | 0 matches |
| 2.9 | Zero network imports in `src/` | `rg -n "from\s+['\"](http\|https\|net\|tls\|dns\|axios\|got\|undici\|node-fetch\|ws\|socket\.io)['\"]" src/` | 0 matches |
| 2.10 | Zero `child_process` usage in `src/` | `rg -n "child_process" src/` | 0 matches |
| 2.11 | All `try/catch` blocks log to the `RoyCSS` output channel (no silent swallow) | manual review | all catches log |
| 2.12 | Webview CSP set to `default-src 'none'` | `rg -n "default-src 'none'" src/search-panel.ts` | 1 match |
| 2.13 | Webview uses a `nonce` for inline scripts | `rg -n "nonce" src/search-panel.ts` | ≥2 matches |
| 2.14 | `vscode.env.openExternal` only called with `https://` URLs | `rg -n "openExternal" src/` | all URLs start with `https://` |

## 3. Build & package

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 3.1 | TypeScript compiles cleanly | `tsc -p ./` | exit code 0, no errors |
| 3.2 | `out/` directory exists with `extension.js` | `ls out/src/extension.js` | file exists |
| 3.3 | `out/src/effects-data.js` exists and exports `effects` | `node -e "console.log(require('./out/src/effects-data.js').effects.length)"` | `1569` |
| 3.4 | `data/css-data.json` exists and has 1569 keys | `node -e "console.log(Object.keys(require('./data/css-data.json')).length)"` | `1569` |
| 3.5 | `.vsix` packages cleanly | `bunx vsce package --no-yarn --no-dependencies` | exit code 0, produces `roycss-1.0.0.vsix` |
| 3.6 | `.vsix` size <5 MB | `du -m roycss-1.0.0.vsix \| cut -f1` | ≤5 |
| 3.7 | `.vsix` contains no `node_modules/` | `unzip -l roycss-1.0.0.vsix \| rg node_modules` | 0 matches |
| 3.8 | `.vsix` contains no `.map` files | `unzip -l roycss-1.0.0.vsix \| rg '\.map$'` | 0 matches |
| 3.9 | `.vsix` contains `out/src/extension.js` | `unzip -l roycss-1.0.0.vsix \| rg 'out/src/extension\.js'` | 1 match |
| 3.10 | `.vsix` contains `snippets/roycss.json` | `unzip -l roycss-1.0.0.vsix \| rg 'snippets/roycss\.json'` | 1 match |
| 3.11 | `.vsix` contains `syntaxes/roycss.tmLanguage.json` | `unzip -l roycss-1.0.0.vsix \| rg 'syntaxes/roycss\.tmLanguage\.json'` | 1 match |
| 3.12 | `.vsix` contains `data/css-data.json` | `unzip -l roycss-1.0.0.vsix \| rg 'data/css-data\.json'` | 1 match |
| 3.13 | `.vsix` contains `icons/icon.png` | `unzip -l roycss-1.0.0.vsix \| rg 'icons/icon\.png'` | 1 match |
| 3.14 | `.vsix` contains `README.md`, `CHANGELOG.md`, `LICENSE` | `unzip -l roycss-1.0.0.vsix \| rg -E 'README\.md\|CHANGELOG\.md\|LICENSE$'` | 3 matches |
| 3.15 | Manifest is valid JSON | `node -e "JSON.parse(require('fs').readFileSync('package.json','utf-8'))"` | exit code 0 |

## 4. Tests

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 4.1 | Completion test passes | `node ./out/tests/runTest.js` (or `bun run test`) | exit code 0 |
| 4.2 | Completion test asserts >1000 items | manual review of `tests/completion.test.ts` | assertion present |
| 4.3 | Completion test mocks a `TextDocument` with `class="roycss-"` | manual review | mock present |
| 4.4 | Bench baseline JSON exists | `ls tests/bench.baseline.json` (or `.ts`) | file exists |

## 5. Security (per `docs/threat-models/02-vscode-extension.md`)

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 5.1 | Zero network imports | `rg -n "from\s+['\"](http\|https\|net\|tls\|dns\|axios\|got\|undici\|node-fetch\|ws\|socket\.io)['\"]" src/` | 0 matches |
| 5.2 | Zero `child_process` imports | `rg -n "child_process" src/` | 0 matches |
| 5.3 | Zero `eval` / `new Function` | `rg -n "\beval\(\|new Function\(" src/` | 0 matches |
| 5.4 | Zero `fs.writeFile` / `fs.appendFile` | `rg -n "fs\.write\|writeFile\|appendFile\|createWriteStream" src/` | 0 matches |
| 5.5 | `dependencies` is empty | `node -e "console.log(JSON.stringify(require('./package.json').dependencies\|\|{}))"` | `{}` |
| 5.6 | No install lifecycle scripts | `node -e "const s=require('./package.json').scripts; console.log([s.preinstall,s.install,s.postinstall,s.prepare].filter(Boolean).length)"` | `0` |
| 5.7 | Webview CSP present and strict | `rg -n "default-src 'none'" src/search-panel.ts` | 1 match |
| 5.8 | No `vscode.env.telemetry` API usage | `rg -n "vscode\.env\.telemetry\|telemetry" src/` | 0 matches |
| 5.9 | No `process.env.<USER>` reads (user-identifying) | `rg -n "process\.env\.(USER\|USERNAME\|HOME\|PATH)" src/` | 0 matches |
| 5.10 | `bun audit` clean | `bun audit` | 0 vulnerabilities |

## 6. Performance (per `docs/benchmarks/02-vscode-extension.md`)

| # | Check | Target | Method |
|---|-------|--------|--------|
| 6.1 | Activation time | <100 ms | `performance.now()` bracket around `activate()`; log to `RoyCSS` output channel |
| 6.2 | Completion response time | <50 ms for 1569 items | `performance.now()` bracket around `provideCompletionItems` |
| 6.3 | Memory overhead | <10 MB | `process.memoryUsage().heapUsed` before/after activation |
| 6.4 | Snippet insertion time | <10 ms | `performance.now()` bracket around `editor.insertSnippet` |
| 6.5 | Hover response time | <30 ms | `performance.now()` bracket around `provideHover` |
| 6.6 | `.vsix` size | <5 MB | `du -m roycss-1.0.0.vsix` |

## 7. Marketplace readiness

| # | Check | Notes |
|---|-------|-------|
| 7.1 | `README.md` explains install, features, commands, configuration | required by Marketplace |
| 7.2 | `CHANGELOG.md` has a v1.0.0 entry | required by Marketplace |
| 7.3 | `LICENSE` is MIT | matches the rest of the project |
| 7.4 | `icons/icon.png` is 128×128 or larger | required by Marketplace |
| 7.5 | `icons/icon.svg` exists | optional but nice |
| 7.6 | `repository.url` points to the public GitHub repo | required for "View Repository" link |
| 7.7 | `engines.vscode` matches the lowest VSCode version we test against | `^1.85.0` |
| 7.8 | No `activationEvents: ["*"]` | broad activation is flagged by Marketplace review |
| 7.9 | No `enabledApiProposals` | proposed APIs are rejected by Marketplace |
| 7.10 | Extension has been side-loaded and tested in a clean VSCode window | `code --extensionDevelopmentPath=...` smoke test |

## 8. Site integration

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 8.1 | `platform-ecosystem.tsx` mentions the v1.0 installable extension | `rg -n "v1.0 installable extension" src/components/roycss/platform-ecosystem.tsx` | 1 match |
| 8.2 | `platform-ecosystem.tsx` counter for "Platform products" reflects the new product count | `rg -n "Platform products" src/components/roycss/platform-ecosystem.tsx` | counter matches PRODUCTS length |
| 8.3 | `get-started.tsx` Step 5 mentions installing the `.vsix` from `/vscode-extension/roycss-1.0.0.vsix` | `rg -n "roycss-1.0.0.vsix" src/components/roycss/get-started.tsx` | 1 match |
| 8.4 | `bun run lint` passes after the edits | `bun run lint` | exit code 0 |

## 9. Documentation

| # | Check | Command | Expected |
|---|-------|---------|----------|
| 9.1 | ADR exists | `ls docs/adr/02-vscode-extension.md` | file exists |
| 9.2 | Threat model exists | `ls docs/threat-models/02-vscode-extension.md` | file exists |
| 9.3 | Benchmarks exist | `ls docs/benchmarks/02-vscode-extension.md` | file exists |
| 9.4 | Implementation plan exists | `ls docs/plans/02-vscode-extension.md` | file exists |
| 9.5 | Review checklist exists | `ls docs/checklists/02-vscode-extension.md` | file exists |
| 9.6 | Worklog entry appended | `tail -50 worklog.md` | new "Task ID: 02-vscode-extension" section |
| 9.7 | Extension `README.md` covers install, features, commands, configuration | manual review | all 4 sections present |
| 9.8 | Extension `CHANGELOG.md` has a v1.0.0 entry | `head -20 CHANGELOG.md` | entry present |

## 10. Sign-off

| Reviewer | Role | Date | Result |
|----------|------|------|--------|
| Principal Engineer (VSCode domain) | Author | 2025-01-22 | ✅ all checks pass |
| CI | Automated | on push | ✅ `bun run lint && bun run test` |
| Marketplace review (deferred) | Microsoft | TBD | pending publication |
