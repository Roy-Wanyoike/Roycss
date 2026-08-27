# ADR-001: Single Repository (Non-Monorepo)

## Status

Accepted (2025-01-15)

## Context

RoyCSS started as a single Next.js project. As it grew to include a backend (Express), WebSocket service (socket.io), CLI, MCP server, VS Code extension, Chrome inspector extension, and documentation, the question arose whether to split into a monorepo managed by Turborepo or Nx.

The project comprises:

- `src/` — Next.js 16 frontend (~2,600-line single-page orchestrator + 62 pro components + 64 tools)
- `backend/` — Express API (68 domain modules)
- `mini-services/` — Socket.io WebSocket service (Roy Live)
- `cli/` — RoyCSS CLI (`roycss` command)
- `vscode-extension/` — Published VS Code extension (`.vsix`)
- `inspector/` — Chrome DevTools / side-panel extension
- `docs/` — Architecture documentation + ADRs
- `prisma/` — Frontend database schema
- `scripts/` — Build, release, migration scripts
- `tests/`, `performance/`, `a11y/`, `perf/`, `compat/` — Cross-cutting test/benchmark suites

## Decision

Keep RoyCSS as a **single repository** with clear directory boundaries. Each runtime process (frontend, backend, WebSocket) has its own `package.json` so it can run independently, but all live in the same Git repository. No monorepo tooling (Turborepo, Nx, pnpm workspaces) is introduced.

### Directory Boundaries

| Path               | Runtime         | Port | Package.json       |
| ------------------ | --------------- | ---- | ------------------ |
| `src/` (root)      | Next.js dev     | 3000 | Root `package.json` |
| `backend/`          | Express API     | 4000 | `backend/package.json` |
| `mini-services/live-service/` | Socket.io | 3003 | `mini-services/live-service/package.json` |
| `cli/`              | Node CLI (npx)  | —    | `cli/package.json` |
| `vscode-extension/` | VS Code host    | —    | `vscode-extension/package.json` |
| `inspector/`        | Chrome host     | —    | `inspector/manifest.json` |

## Rationale

- **Simpler CI/CD** — one repo, one pipeline, one set of secrets
- **No monorepo tooling overhead** — Turborepo/Nx would add config, caching, and learning curve for a project that already builds in seconds
- **Clear directory boundaries provide sufficient separation** — each sub-project has its own `package.json`, `tsconfig.json`, and entry point
- **The project is maintained by a small team** (currently one primary author) — coordination overhead of separate repos would exceed the benefit
- **Cross-cutting concerns stay together** — `tests/`, `performance/`, `a11y/`, `docs/` reference both frontend and backend code; splitting would force awkward symlinks or submodule tracking

## Trade-offs

- **Pro**: Simpler setup, faster cold builds, zero tooling overhead, atomic cross-project commits
- **Con**: Harder to independently version packages (e.g., bumping `cli/` without bumping `vscode-extension/`)
- **Con**: Larger repo size — cloning pulls all sub-projects even if a contributor only works on one
- **Con**: No automatic dependency graph (Turborepo would skip unaffected builds) — mitigated by fast incremental `bun` builds

## Alternatives Considered

1. **Turborepo monorepo** — rejected: the overhead (config files, caching server, `turbo.json` per package) outweighs the benefit at current scale. The full `bun run dev` + backend + WebSocket stack boots in under 10 seconds.
2. **Separate repositories per runtime** — rejected: coordinating frontend + backend + WebSocket changes across repos would require version-pinned releases and submodule tracking that a single author cannot maintain.
3. **pnpm workspaces (no Turborepo)** — rejected: introduces a second package manager (the project standardizes on `bun`) and offers little beyond what separate `package.json` files already provide.
