# Threat Model — RoyCSS VSCode Extension

- **Document owner:** Principal Engineer, VSCode Extension domain
- **Scope:** `/home/z/my-project/vscode-extension/` (the installable .vsix)
- **Related:** `docs/adr/02-vscode-extension.md`, `docs/benchmarks/02-vscode-extension.md`
- **Last reviewed:** 2025-01-22

---

## 1. Executive summary

The RoyCSS VSCode extension is a **single-process, zero-runtime-dependency,
zero-network-call** extension. It runs inside the VSCode extension host, reads a
static in-bundle data array, and writes completions, hover content, and a
webview panel to the editor UI. It makes **no outbound network requests**,
**executes no shell commands**, **spawns no child processes**, and **reads no
files outside its own bundle** except when the user explicitly opens the
playground webview (in which case it reads only `data/css-data.json` from its
own install directory).

The threat model below documents the four categories the Marketplace review
team and enterprise security teams care about most: telemetry, code execution,
supply chain, and data exfiltration. Each category is graded **Low / Medium /
High / Critical** and includes explicit verification steps.

---

## 2. Asset inventory

| Asset | Location | Sensitivity | Notes |
|-------|----------|-------------|-------|
| Effect metadata (1569 effects) | `src/effects-data.ts` (compiled into `out/effects-data.js`) | Public | Already published in `dist/effects.json` and on roycss.com |
| Full CSS source | `data/css-data.json` (shipped inside the .vsix) | Public | Already published in `dist/roycss.css` |
| Snippet definitions | `snippets/roycss.json` | Public | Already published in `vscode-support/roycss-snippets.json` |
| Recently-used class state | VSCode workspace state (`context.workspaceState`) | Local-only | Class IDs the user inserted, used to sort completions |
| User source files | Workspace (any file the user opens) | User-owned | The extension reads them via VSCode's `TextDocument` API; it never writes to them and never reads files outside the open document |
| Playground webview HTML | Generated in-process from `search-panel.ts` | Public | Rendered into a VSCode Webview; CSP restricts to `nonce`-tagged inline scripts only |

---

## 3. Threat categories

### 3.1 Telemetry — **ZERO**

**Posture:** The extension collects, transmits, or persists **no telemetry,
analytics, usage metrics, error reports, or session information**.

- No `vscode.env.telemetry` API usage.
- No `appinsights`, `applicationinsights`, `sentry`, `posthog`, `amplitude`,
  `mixpanel`, `segment`, `datadog`, or any other analytics SDK in
  `package.json` `dependencies` or `devDependencies`.
- No `fetch`, `http`, `https`, `axios`, `got`, `node-fetch`, `undici`, `ws`, or
  any other network library imported anywhere in `src/`.
- No `console.log` of user data — only operational logs to the VSCode Output
  channel (`RoyCSS`) when an error is caught.
- No `process.env` reads of user-identifying variables (no `USER`, `HOME`,
  `USERNAME`, `PATH`).
- The recently-used-class list is stored in `context.workspaceState`, which is
  local to the user's machine and never leaves it.

**Verification:**

```bash
# 1. Search the entire src/ for any network-related API
rg -n "fetch\(|http\.|https\.|require\('http'\)|require\('https'\)|axios|got\(|undici|node-fetch" src/
# Expected: 0 matches

# 2. Search package.json dependencies
node -e "const p=require('./package.json'); console.log('deps:', p.dependencies||{}); console.log('devDeps:', p.devDependencies||{})"
# Expected: dependencies = undefined or {} (no runtime deps)

# 3. Search for telemetry / analytics APIs
rg -n "telemetry|appinsights|sentry|posthog|amplitude|mixpanel|segment|datadog" src/ package.json
# Expected: 0 matches
```

### 3.2 Code execution — **Low**

**Posture:** The extension runs in the VSCode extension host (Node.js). It can
execute arbitrary JavaScript in the host process, but it deliberately:

- Spawns **no child processes** (`child_process.exec`, `spawn`, `fork`,
  `execSync` — none imported).
- Executes **no shell commands**.
- Does **not** use the `vscode.tasks` API to run tasks.
- Does **not** use the integrated terminal API.
- Does **not** write to disk anywhere except `context.workspaceState` (a
  VSCode-managed key-value store).
- Reads files **only** from its own install directory
  (`path.join(__dirname, '..', 'data', 'css-data.json')`) and only when the
  user opens the playground webview.

The remaining risk is **the user's workspace files**: the extension reads the
open `TextDocument` (via `vscode.workspace.textDocuments` and the providers'
`document` argument) to extract completion/hover context. It does **not** scan
the filesystem, does **not** read files outside the open document, and does
**not** transmit document content anywhere — the document text is processed
in-memory only to find the `roycss-` token under the cursor.

**Verification:**

```bash
# 1. No child_process anywhere
rg -n "child_process|require\('child_process'\)|spawn\(|execSync\(|exec\(" src/
# Expected: 0 matches

# 2. No tasks / terminal API
rg -n "vscode\.tasks|vscode\.window\.createTerminal|Task\b" src/
# Expected: 0 matches

# 3. No filesystem writes
rg -n "writeFile|fs\.write|createWriteStream" src/
# Expected: 0 matches
```

### 3.3 Supply chain — **Low**

**Posture:** The extension has **zero runtime dependencies** and **four
development dependencies**, all pinned to a major version and audited.

`package.json`:

```json
{
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/vscode": "^1.85.0",
    "@vscode/vsce": "^3.2.0",
    "typescript": "^5.4.0"
  }
}
```

Properties:

- **No `postinstall` script.** No `preinstall`, `prepare`, or any other
  lifecycle hook that runs untrusted code on install.
- **No `bundleDependencies` / `bundledDependencies`.** The .vsix is
  self-contained — `vsce package` includes only the compiled `out/`, the
  `data/`, `snippets/`, `syntaxes/`, `icons/`, and the manifest files.
- **All dev dependencies are type-only or build-only.** They do not appear in
  the .vsix (enforced by `.vscodeignore`).
- **Lockfile committed** (`bun.lock`) — `bun install` is reproducible.
- **No transitive runtime dependencies** — because there are no runtime
  dependencies.
- **No `eval`, no `new Function`, no `vm.runInNewContext`** anywhere in `src/`.
  The webview panel uses an inline `<script nonce="...">` with a hard-coded
  string body (no string interpolation of user input into JS).

**Verification:**

```bash
# 1. Confirm zero runtime dependencies
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.dependencies||{}))"
# Expected: {} or "undefined"

# 2. Confirm no install lifecycle scripts
node -e "const p=require('./package.json'); console.log(JSON.stringify({preinstall:p.scripts.preinstall, install:p.scripts.install, postinstall:p.scripts.postinstall, prepare:p.scripts.prepare}))"
# Expected: all undefined

# 3. Confirm no eval / new Function / vm
rg -n "\beval\(|new Function\(|vm\.runIn|require\('vm'\)" src/
# Expected: 0 matches

# 4. Audit the lockfile
bun audit
# Expected: 0 vulnerabilities
```

### 3.4 Data exfiltration — **ZERO**

**Posture:** The extension makes **zero outbound network calls** of any kind.
This is the most important property of the threat model and is enforced at
three layers:

1. **No network-capable code.** No `http`, `https`, `net`, `tls`, `dns`,
   `fetch`, `axios`, `got`, `undici`, `node-fetch`, `ws`, `socket.io`, or any
   other network library is imported anywhere in `src/`. The
   `search-panel.ts` webview is rendered from a static HTML string — it does
   not load any external resources.
2. **Content Security Policy on the webview.** The `search-panel.ts` webview
   sets a strict CSP that forbids all remote sources:
   ```
   default-src 'none';
   img-src ${webview.cspSource} data:;
   style-src ${webview.cspSource} 'unsafe-inline';
   script-src 'nonce-${nonce}';
   ```
   No `connect-src`, no `font-src` for remote fonts, no `frame-src`. Even if a
   future bug tried to call `fetch()` from the webview, the CSP would block
   it.
3. **No external resources in the webview HTML.** The playground webview does
   not load external CSS, JS, fonts, or images. All styling is inlined; all
   script is a single `<script nonce="...">` with a hard-coded body.

**Verification:**

```bash
# 1. Confirm no network imports
rg -n "import.*from\s+['\"](http|https|net|tls|dns|axios|got|undici|node-fetch|fetch|ws|socket\.io)['\"]|require\(['\"](http|https|net|tls|dns|axios|got|undici|node-fetch|ws|socket\.io)['\"]" src/
# Expected: 0 matches

# 2. Confirm CSP in the webview
rg -n "Content-Security-Policy|default-src|cspSource" src/search-panel.ts
# Expected: ≥1 match with a strict default-src 'none' policy

# 3. Confirm no external URLs in the webview HTML
rg -n "https?://[a-z]" src/search-panel.ts
# Expected: 0 matches outside the CSP nonce (no external <link>, <script src>, <img src>)

# 4. Static analysis of the .vsix
unzip -p roycss-1.0.0.vsix extension/out/src/extension.js | rg -n "fetch\(|http\.request|https\.request"
# Expected: 0 matches
```

---

## 4. STRIDE analysis

| Threat (STRIDE) | Surface | Mitigation | Residual risk |
|-----------------|---------|------------|---------------|
| **S**poofing | Extension publisher identity | `publisher: "roycss"` in manifest; user installs from the official Marketplace URL | Low — depends on Marketplace account hygiene |
| **T**ampering | .vsix contents after install | VSCode verifies the .vsix signature on install; `bun.lock` pins build deps | Low |
| **R**epudiation | User actions (insert class, open playground) | No actions are logged; nothing to repudiate | N/A |
| **I**nformation disclosure | User source code | Extension reads only the open `TextDocument` in-memory; no filesystem scan; no network calls | Low — the document text is processed in-process and never leaves the host |
| **D**enial of service | Extension host crash | Defensive `try/catch` around every provider; completion is rate-limited by VSCode's built-in throttle; webview is lazy-loaded | Low |
| **E**levation of privilege | Webview → host bridge | Webview uses `postMessage` with a strict message-shape validator in `search-panel.ts`; only `insertClass` and `copyCss` messages are accepted | Low |

---

## 5. Attack surface reduction

The extension deliberately does **not** use the following VSCode APIs, each of
which would expand the attack surface:

- `vscode.workspace.fs` — no arbitrary filesystem access.
- `vscode.tasks` — no task execution.
- `vscode.debug` — no debugger integration.
- `vscode.window.createTerminal` — no terminal creation.
- `vscode.env.openExternal` for non-`https` URLs — only the official
  `https://roycss.com` and `https://github.com/Roy-Wanyoike/roycss` URLs are
  allowed in hover links.
- `vscode.extensions` API to inspect other installed extensions.

---

## 6. Incident response

If a vulnerability is reported:

1. **Confirm** by reproducing against the pinned version in `bun.lock`.
2. **Patch** in `src/`, add a regression test in `tests/`.
3. **Bump** the extension `version` (SemVer patch).
4. **Re-publish** to the Marketplace with a CHANGELOG entry documenting the
   fix and the reporter (with permission).
5. **Request** a security advisory from GitHub if the issue is CVE-worthy.

---

## 7. Sign-off

| Reviewer | Role | Date | Status |
|----------|------|------|--------|
| Principal Engineer (VSCode domain) | Author | 2025-01-22 | Accepted |
| Marketplace review (deferred) | Microsoft | TBD | Pending publication |
