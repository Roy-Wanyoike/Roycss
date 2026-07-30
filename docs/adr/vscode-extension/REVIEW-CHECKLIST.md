# RoyCSS VSCode Extension — Review Checklist

> Status: **Accepted** · Version: 1.0.0 · Last updated: 2026-07-31
> Scope: `/home/z/my-project/vscode-extension/` and the installable `.vsix`
> Use: every reviewer (human or agent) signs off each item before a release.

Each item has:
- **What** — the artifact or property being reviewed.
- **How** — the command or manual step to verify it.
- **Pass** — the criterion for sign-off.

---

## 1. Manifest identity fields

- **What:** `package.json` has `name`, `displayName`, `publisher`, `version`, `description`, `license`, `engines.vscode`, `main`, `icon`, `repository`, `bugs`, `homepage`, `categories`, `keywords`.
- **How:** `node -e "const p=require('./vscode-extension/package.json'); ['name','displayName','publisher','version','description','license','engines','main','icon','repository','bugs','homepage','categories','keywords'].forEach(k=>{if(!p[k])throw new Error('missing '+k)}); console.log('OK')"`
- **Pass:** Prints `OK`. `engines.vscode` is `^1.85.0`. `main` is `./extension.js`. `version` is `1.0.0`. `publisher` is `roycss`.

---

## 2. Activation events

- **What:** `activationEvents` includes all 8 `onLanguage:*` entries and both `onCommand:*` entries.
- **How:** `node -e "const p=require('./vscode-extension/package.json'); const a=p.activationEvents||[]; const need=['onLanguage:css','onLanguage:html','onLanguage:javascript','onLanguage:typescript','onLanguage:javascriptreact','onLanguage:typescriptreact','onLanguage:vue','onLanguage:svelte','onCommand:roycss.browseEffects','onCommand:roycss.searchEffect']; const miss=need.filter(x=>!a.includes(x)); if(miss.length)throw new Error('missing '+miss); console.log('OK',a.length,'events')"`
- **Pass:** Prints `OK 10 events`. No missing events.

---

## 3. Contributes — commands

- **What:** `contributes.commands` has exactly 2 entries with `command`, `title`, `category`.
- **How:** `node -e "const p=require('./vscode-extension/package.json'); const c=p.contributes.commands; if(c.length!==2)throw new Error('expected 2 commands, got '+c.length); c.forEach(x=>{if(!x.command||!x.title||!x.category)throw new Error('malformed '+JSON.stringify(x))}); console.log('OK',c.map(x=>x.command).join(', '))"`
- **Pass:** Prints `OK roycss.browseEffects, roycss.searchEffect`.

---

## 4. Contributes — snippets

- **What:** `contributes.snippets` declares `./snippets.json` for all 8 supported languages.
- **How:** `node -e "const p=require('./vscode-extension/package.json'); const s=p.contributes.snippets||[]; if(s.length!==8)throw new Error('expected 8 snippet entries, got '+s.length); s.forEach(x=>{if(x.path!=='./snippets.json')throw new Error('wrong path '+x.path)}); console.log('OK',s.map(x=>x.language).join(', '))"`
- **Pass:** Prints `OK css, html, javascript, typescript, javascriptreact, typescriptreact, vue, svelte` (in any order).

---

## 5. Contributes — configuration

- **What:** `contributes.configuration.properties` declares 6 keys: `roycss.enableCompletion`, `roycss.enableHover`, `roycss.enableDiagnostics`, `roycss.enableCodeActions`, `roycss.maxCompletionItems`, `roycss.diagnosticSeverity`. Each has `type`, `default`, `description`.
- **How:** `node -e "const p=require('./vscode-extension/package.json'); const c=p.contributes.configuration.properties; const need=['roycss.enableCompletion','roycss.enableHover','roycss.enableDiagnostics','roycss.enableCodeActions','roycss.maxCompletionItems','roycss.diagnosticSeverity']; const miss=need.filter(k=>!c[k]); if(miss.length)throw new Error('missing '+miss); Object.values(c).forEach(v=>{if(!v.type||v.default===undefined||!v.description)throw new Error('malformed '+JSON.stringify(v))}); console.log('OK 6 properties')"`
- **Pass:** Prints `OK 6 properties`.

---

## 6. Entry point syntax

- **What:** `extension.js` has no syntax errors.
- **How:** `node -c vscode-extension/extension.js`
- **Pass:** Exits 0. (No output.)

---

## 7. Zero network calls

- **What:** `extension.js` makes no network calls.
- **How:** `grep -nE 'fetch\(|http\.|https\.|require\(.http.\)|require\(.https.\)|XMLHttpRequest|axios|got\(' vscode-extension/extension.js || echo OK`
- **Pass:** Prints `OK` (no matches).

---

## 8. Zero child_process

- **What:** `extension.js` never spawns child processes.
- **How:** `grep -nE 'child_process|execSync|execFile|spawn' vscode-extension/extension.js || echo OK`
- **Pass:** Prints `OK` (no matches).

---

## 9. Zero runtime dependencies

- **What:** `package.json` `dependencies` is `{}` and `trustedDependencies` is `[]` (or absent).
- **How:** `node -e "const p=require('./vscode-extension/package.json'); const d=Object.keys(p.dependencies||{}); if(d.length)throw new Error('runtime deps: '+d); console.log('OK zero runtime deps')"`
- **Pass:** Prints `OK zero runtime deps`.

---

## 10. No postinstall scripts

- **What:** `package.json` `scripts` has no `postinstall` key. (It may have `vscode:prepublish`, `build`, `package` for development convenience.)
- **How:** `node -e "const p=require('./vscode-extension/package.json'); if(p.scripts&&p.scripts.postinstall)throw new Error('postinstall present'); console.log('OK no postinstall')"`
- **Pass:** Prints `OK no postinstall`.

---

## 11. class-data.json integrity

- **What:** `class-data.json` is valid JSON with ≥1,569 effects; every effect has `id`, `className`, `name`, `category`, `description`, `tags`, `cssCode`.
- **How:** `node -e "const c=require('./vscode-extension/class-data.json'); const e=c.effects||c; if(e.length<1569)throw new Error('only '+e.length+' effects'); const bad=e.filter(x=>!x.id||!x.className||!x.name||!x.category||!x.description||!Array.isArray(x.tags)||!x.cssCode); if(bad.length)throw new Error('malformed: '+bad.length); console.log('OK',e.length,'effects')"`
- **Pass:** Prints `OK 1569 effects` (or higher).

---

## 12. snippets.json integrity

- **What:** `snippets.json` is valid JSON with exactly 1,569 entries; every entry has `prefix`, `body` (array), `description`, `scope`.
- **How:** `node -e "const s=require('./vscode-extension/snippets.json'); const k=Object.keys(s); if(k.length!==1569)throw new Error('expected 1569, got '+k.length); const bad=k.filter(n=>{const v=s[n];return !v.prefix||!Array.isArray(v.body)||!v.description||!v.scope}); if(bad.length)throw new Error('malformed: '+bad.length); console.log('OK',k.length,'snippets')"`
- **Pass:** Prints `OK 1569 snippets`.

---

## 13. Smoke test passes

- **What:** `test/smoke.test.js` runs without a VSCode instance, mocks the `vscode` module, and asserts the providers register.
- **How:** `cd vscode-extension && node test/smoke.test.js`
- **Pass:** Exits 0; prints `PASS: N assertions` (N ≥ 6).

---

## 14. .vsix packaging succeeds (or fallback documented)

- **What:** `build.sh` produces `roycss-vscode-1.0.0.vsix`. If `vsce` / `npx` is unavailable, `README.md` documents the manual packaging steps.
- **How:** `cd vscode-extension && bash build.sh && ls -la roycss-vscode-1.0.0.vsix`
- **Pass:** Either (a) the `.vsix` exists and `unzip -l` lists `extension/package.json`, `extension/extension.js`, `extension/class-data.json`, `extension/snippets.json`, `extension/icons/icon.png`, `extension/LICENSE`, `extension/README.md`; or (b) build.sh exits non-zero with a clear message and `README.md` §"Manual packaging" exists.

---

## 15. .vsix contents — manifest matches files

- **What:** The `.vsix` (if it exists) contains `extension/package.json` whose `main` field matches a file in the archive.
- **How:** `unzip -p roycss-vscode-1.0.0.vsix extension/package.json | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const p=JSON.parse(s);const fs=require('fs');console.log('main:',p.main,'files:',p.contributes.snippets[0].path,'icon:',p.icon)})"`
- **Pass:** Prints `main: ./extension.js files: ./snippets.json icon: icons/icon.png` — and each referenced path exists in the archive (verify with `unzip -l`).

---

## Sign-off

| Reviewer | Date       | Items passed   | Notes                                  |
| -------- | ---------- | -------------- | -------------------------------------- |
| _agent_  | 2026-07-31 | 15/15          | v1.0.0 release. .vsix builds cleanly.  |

All 15 items must pass before a release is tagged.
