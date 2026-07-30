# RoyCSS CLI v2 — Threat Model

- **Status:** Accepted
- **Date:** 2025-11-22
- **Owner:** Principal Engineer — CLI Platform v2 domain
- **Related:** `DESIGN.md` §4 (plugin system), `ADR.md` ADR-002 (plugin discovery), `docs/threat-models/07-security-supply-chain.md`

---

## 1. Scope

This threat model covers the new attack surface introduced by RoyCSS CLI v2:

- **Plugin system** — local Node module loading from `.roycss/plugins/`
- **`create` command** — writes files to user-chosen paths
- **`export` command** — writes CSS files to user-chosen paths
- **`upgrade` command** — reads project files (read-only scan)
- **`stats` command** — reads source files (read-only scan)
- **`browse` TUI** — raw terminal input mode

It does **not** cover:
- The pre-existing v1 surface (`init`, `add`, `search`, `list`, `info`, `doctor`) — those threats are covered in the v1 security review.
- The main `roycss` package supply chain — covered in `docs/threat-models/07-security-supply-chain.md`.

---

## 2. Threat: Malicious plugins

### 2.1 Threat actor

A developer on the user's team (or an attacker who has compromised a teammate's machine or a shared git repo) plants a malicious file at `.roycss/plugins/*.js` in the project. The user runs `roycss plugin list` (or any `roycss` command if plugins auto-load — they don't in v1, see §2.3) and the plugin executes arbitrary code with the user's privileges.

### 2.2 Impact

- **Code execution** as the user. The plugin can `require("child_process").exec(...)` and run any command.
- **File exfiltration** — read `~/.ssh/id_rsa`, `~/.aws/credentials`, `.env` files, send via `fetch()`.
- **Supply-chain pivot** — modify `package.json`, `package-lock.json`, or `.git/hooks/pre-commit` to persist the attack.

### 2.3 v1 mitigation: plugins do NOT auto-load

In v1, **plugins are only executed when explicitly invoked** — never on every CLI run. Specifically:

- `roycss plugin list` — enumerates files but **does not `require()` them**. Only reads filenames.
- `roycss plugin enable/disable` — renames files. Does not execute them.
- `roycss plugin init` — writes a sample plugin file. Does not execute it.
- Other commands (`init`, `add`, `stats`, `doctor`, etc.) **never touch `.roycss/plugins/`**.

This is the single most important mitigation. Even if a malicious plugin is planted in a project, it cannot run unless the user explicitly types `roycss <plugin-name>:<command>` — a sub-command namespace that the v1 loader only registers on explicit demand.

### 2.4 v1 mitigation: project-scoped

Plugins live in `.roycss/plugins/` *inside the current project*, not in `~/.roycss/` or globally. This means:

- A plugin planted in Project A does not affect Project B.
- `cd ~/safe-project && roycss plugin list` shows only safe-project's plugins.
- Reviewing a project's plugin footprint is `ls .roycss/plugins/` — trivially auditable in code review.

### 2.5 v1 mitigation: disabled-by-extension convention

Disabled plugins are renamed `.disabled.js`. The CLI loader skips `*.disabled.js` files. This gives users a way to keep a plugin in source control but turn it off without deleting it.

### 2.6 Future hardening (v2+)

- **Code-signing.** Plugins should be signed; the CLI verifies signatures before execution. Requires a key distribution story — defer to v3.
- **Capability manifest.** Plugins declare required capabilities (`fs.read`, `fs.write`, `net`, `exec`) in a manifest; the CLI enforces them. Requires a sandbox — defer to v3.
- **Sandboxed execution.** Run plugins in a `worker_threads` Worker with a constrained `require` resolver. Adds ~50 ms cold-start — acceptable for plugin commands. Defer to v3.
- **Plugin allowlist.** A `.roycss/config.json` field listing trusted plugin names. Unlisted plugins are loaded but print a warning. Easy to add in v2.1.

### 2.7 Residual risk

If a user *does* invoke a malicious plugin, v1 has no defense. The threat is mitigated by:
1. The user must explicitly invoke the plugin (no auto-load).
2. The plugin is in `.roycss/plugins/`, which should be reviewed in code review.
3. RoyCSS documentation will recommend gitignoring `.roycss/plugins/` or adding a CODEOWNERS rule.

---

## 3. Threat: Supply chain via plugin distribution

### 3.1 Threat actor

An attacker publishes a malicious `roycss-plugin-*` package to npm. A user installs it (in v1 there is no auto-install — but a teammate might manually `npm install` it and copy the file to `.roycss/plugins/`).

### 3.2 Impact

Same as §2.2 — arbitrary code execution when the plugin is invoked.

### 3.3 v1 mitigation: no marketplace, no auto-install

v1 has **no plugin marketplace, no auto-install, no `roycss plugin install <name>`**. The only way to add a plugin is to manually create a file in `.roycss/plugins/`. This pushes the trust decision to the user:

- They must find the plugin themselves (no in-CLI suggestion).
- They must download/copy the source themselves.
- They must place it in `.roycss/plugins/` themselves.

Each step is a checkpoint where a careful user can review the code.

### 3.4 Future hardening (v3+)

When the marketplace arrives:
- **Signed packages.** Plugins must be signed by a RoyCSS-recognized key.
- **Pinned versions.** The CLI refuses to install `latest`; users must pin to a specific version.
- **Audit log.** Every plugin install/enable/disable is logged to `.roycss/plugin-audit.log`.
- **Provenance.** Plugins published from GitHub Actions get a SLSA Level 3 attestation (similar to the main `roycss` package).

---

## 4. Threat: File system access

### 4.1 Threat actor

A bug in the CLI (or a malicious plugin that has been invoked) writes files outside the project root.

### 4.2 Attack vectors

- `roycss create ../../etc/passwd-replacement` — path traversal in `--template` output paths.
- `roycss export pulse-glow --out /etc/cron.d/evil` — arbitrary write via `--out`.
- `roycss create --force` overwriting an existing important directory.
- A plugin using `api.writeFile("../../.ssh/authorized_keys", "...")`.

### 4.3 v1 mitigation: path validation in `create`

The `create <name>` command:
- Resolves `name` to an absolute path with `path.resolve()`.
- Refuses if the resolved path is not under `process.cwd()` *unless* the user passes `--force`.
- Refuses if the target directory already exists, unless `--force`.
- Creates only the following files (whitelist):
  - `<name>/package.json`
  - `<name>/roycss.css`
  - `<name>/index.html` (for vanilla/html)
  - `<name>/src/main.tsx`, `<name>/src/App.tsx` (for react)
  - `<name>/src/main.ts`, `<name>/src/App.vue` (for vue)
  - `<name>/src/main.ts`, `<name>/src/App.svelte` (for svelte)
  - `<name>/src/app/layout.tsx`, `<name>/src/app/page.tsx` (for nextjs)

No `package-lock.json` is written (the user runs `npm install` themselves).

### 4.4 v1 mitigation: `export --out` is unconstrained by design

`export --out /tmp/test.css` must work — users legitimately export outside the project (to `/tmp`, to a sibling project's `src/` folder). The CLI does **not** restrict `--out` paths. Rationale:

- The user explicitly typed the path. It is not derived from any untrusted input.
- Restricting it would break legitimate use cases.
- The threat model assumes the user is trusted at the keyboard. If they type `--out /etc/passwd`, that's their decision.

### 4.5 v1 mitigation: read-only commands

`upgrade`, `stats`, and `doctor` only `readFileSync`. They never `writeFileSync` outside of clearly-scoped operations (e.g., `doctor` doesn't write at all). The `src` directory scan in `stats` and `doctor` follows symlinks but does not traverse into `node_modules`, `.git`, or hidden directories.

### 4.6 v1 mitigation: plugin API sandboxing (partial)

The `api.readFile()` and `api.writeFile()` methods exposed to plugins validate that the path is under the project root. However, a plugin can still call Node's `require("fs")` directly — this is the residual risk in §2.7. The sandboxing is "best effort" not "enforced."

---

## 5. Threat: TUI raw-mode side effects

### 5.1 Threat actor

A terminal emulator bug or a misbehaving `setRawMode(true)` call leaves the terminal in raw mode after the CLI exits. Subsequent shell input is garbled.

### 5.2 Impact

User confusion, lost keystrokes, possibly a frozen terminal session. Not a security threat per se, but a UX threat that erodes trust.

### 5.3 v1 mitigation: cleanup on exit

`browse` registers a `process.on("exit")` handler (and a `process.on("SIGINT")` handler) that:
1. Calls `process.stdin.setRawMode(false)`.
2. Calls `rl.close()`.
3. Calls `process.stdin.resume()` to drain any buffered input.

If the CLI crashes for any reason, the OS reclaims the TTY when the process exits — but explicit cleanup makes the behavior deterministic.

### 5.4 v1 mitigation: non-TTY fallback

When `process.stdin.isTTY === false`, `browse` skips `setRawMode` entirely and dumps a paged list. This prevents crashes in CI pipes and test harnesses.

---

## 6. Threat: Information disclosure via `stats` / `doctor`

### 6.1 Threat actor

A user runs `roycss stats` in a project that contains sensitive files (e.g., a private fork with unreleased feature names in `.tsx` files). The output is piped to a CI log that is publicly visible.

### 6.2 Impact

Low. `stats` reports aggregate counts and effect IDs — it does not echo file paths, source code, or comments. The most sensitive data is "this project uses `roycss-unreleased-feature` 12 times."

### 6.3 v1 mitigation

- `stats` output contains only:
  - Total class usage count
  - Top 10 effect IDs by usage
  - Category breakdown (counts only)
  - List of unused effect IDs (from the catalog, not from the project)
- `stats --json` produces the same data in machine-readable form. No source paths are emitted.

If a user is concerned about even this disclosure, they can run `roycss stats` locally without piping.

---

## 7. Threat: Outdated dependencies in the bundle

### 7.1 Threat actor

A vulnerability in Bun's bundler, or in a transitive dep of `src/lib/roycss-effects.ts`, gets included in the standalone `cli/index.js`.

### 7.2 Impact

The bundle is the entire attack surface — there's no `node_modules` at runtime.

### 7.3 v1 mitigation

- The CLI has **zero runtime dependencies**. The bundle contains only `src/cli/index.ts`, `src/lib/roycss-types.ts`, `src/lib/roycss-effects.ts`, and the 34 `effects-batch-*.ts` files. All of these are first-party RoyCSS code.
- `bun build --target node` bundles for Node's built-in modules. No `require()` of `node_modules` at runtime.
- The `cli/package.json` declares no `dependencies` field — `npm install` of `roycss-cli` produces an empty `node_modules/`.

### 7.4 Verification

- `npm audit roycss-cli` returns zero advisories (trivially, since there are no deps).
- `bun build --target node` produces a single file. Verify with: `ls cli/index.js && wc -c cli/index.js`. No external imports remain.

---

## 8. Threat model summary

| Threat | Likelihood | Impact | Mitigation | Residual risk |
|---|---|---|---|---|
| Malicious plugin auto-executes | Low (no auto-load) | Critical | Plugins only run on explicit invocation | Medium if user invokes |
| Supply-chain via plugin install | Low (no marketplace) | Critical | v1 has no install mechanism | Low |
| Path traversal in `create` | Medium | High | Path validation + `--force` requirement | Low |
| Arbitrary write via `export --out` | Low (user-typed path) | High | None by design — user is trusted | Accepted |
| TTY left in raw mode | Medium | Low (UX only) | Cleanup handlers on exit | Low |
| Info disclosure via `stats` | Low | Low | Aggregate-only output | Accepted |
| Vulnerable deps in bundle | Very Low | Critical | Zero runtime deps | Very Low |

---

## 9. Open questions for v3

1. Should plugins be sandboxed in `worker_threads` with a constrained `require`?
2. Should `roycss plugin install <npm-name>` be added, and if so, with what signing requirement?
3. Should `.roycss/plugins/` be gitignored by default in `roycss create`?
4. Should `roycss doctor` warn when `.roycss/plugins/` contains plugins the user hasn't explicitly approved?
5. Should there be a `roycss plugin audit` command that statically analyzes plugin code for `child_process`, `fs.writeFile`, `fetch`, etc.?
