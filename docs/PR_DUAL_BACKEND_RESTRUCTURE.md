# PR: Dual-backend restructure — backend-node + backend-go with failover

## Summary

Restructures the single `backend/` folder into **two sibling backend folders**
for scaling and failover, per the architecture directive:

- **`backend-node/`** — Express + Prisma + SQLite. The **running source of
  truth**; 68 domain modules, `/api/v1`, registry, graceful shutdown.
- **`backend-go/`** — Go modular monolith. The **production target** (Cloud
  Run + PostgreSQL + Redis). Registers all 68 module route surfaces; modules
  not yet ported return `501` so clients fall back to `backend-node`.

Both backends expose the **identical `/api/v1` contract** (68 modules). The
frontend (`src/components/roycss/_use-backend-data.ts`) is backend-agnostic —
it hits `/api/v1/<module>?XTransformPort=<port>` and the Caddy gateway routes
by port. When the Go backend is fully implemented, traffic can be switched or
split between the two per module.

## Audit: commit history (royportfolio cleanup)

Full audit of all 198 commits for "royportfolio" references:

- `git log --grep -i "royportfolio"` → 0 commits
- `git log -S "royportfolio"` (pickaxe, all blobs) → 0 commits
- `find -iname "*royportfolio*"` (working tree) → 0 files
- ripgrep across `src/`, `docs/`, `backend-node/src/` → 0 matches
- `unzip -l roycss.zip | grep -i royportfolio` → 0 matches
- `git ls-files | grep -i royportfolio` → 0 files

**Result:** the repository has **never contained** any royportfolio
reference — in commits, blobs, working tree, or zip artifacts. Nothing to
clean; the repo is already 100% RoyCSS-focused.

## Changes

### Restructure (rename, history preserved via git rename detection)
- `backend/` → `backend-node/` (Express + Prisma, 68 modules)
- `backend/go/` → `backend-go/` (Go modular monolith, pulled out as sibling)

### Go skeleton mirrored to 68 modules (structural parity for failover)
- Generated 66 Go `handler.go` stubs (one per remaining module; `health` and
  `effects` already had real implementations)
- Each stub returns `501` with a stable JSON envelope:
  `{"error":{"code":"NOT_IMPLEMENTED","message":"Go stub — use backend-node for this module","module":"<name>"}}`
- Rewrote `backend-go/cmd/api/main.go` to import + register all 68 modules
  (aliased `os`→`osmod`, `sync`→`syncmod` to avoid stdlib collisions)
- `backend-go` now has 70 `.go` files (was 4)

### Path references updated
- `.gitignore` — 8 path rules (`backend/` → `backend-node/` + `backend-go/` rules)
- `.github/workflows/ci.yml` — job name `backend` → `backend-node`, working-directory, env comment, install/typecheck step names, coverage artifact name/path
- `.github/workflows/deploy.yml` — job name `deploy-backend` → `deploy-backend-node`, 4 `working-directory` refs, step names
- `backend-node/scripts/start-dev.sh` — `cd` path + log path
- `scripts/generate-effects-json.ts` — comment reference

### README.md (marketing page) updated
- Tech Stack table now lists **Backend (Node)** + **Backend (Go)**
- Project Structure tree shows `backend-node/` + `backend-go/` with a
  **Dual-backend architecture** explainer
- Getting Started, Scripts, Environment Variables sections all reference
  `backend-node`/`backend-go`
- Architecture diagram shows the failover relationship (Next.js →
  backend-node ↔ backend-go → Socket.io)

### Cleanup
- Removed 3 stray dev screenshots (`roycss-3000.png`, `roycss-final.png`,
  `roycss-live.png`) committed by a prior session
- Added `.gitignore` rule `roycss-*.png` for future agent-browser captures

## Verification

| Check | Result |
|---|---|
| `backend-node/` present, 68 modules | ✅ |
| `backend-go/` present, 70 `.go` files (68 modules + cmd/migrate + cmd/api) | ✅ |
| git rename detection (history preserved) | ✅ `R backend/X → backend-node/X` |
| `backend-node` starts on :4000, health ok, DB connected | ✅ |
| `backend-node` serves 1,749 effects via `/api/v1/effects` | ✅ |
| Next.js starts on :3000, `/api/health` reports `backendStatus: ok` | ✅ |
| Live `/` page renders (Agent Browser) — title, 767 KB body, 34 Live badges, 12 h2 | ✅ |
| No regression from restructure | ✅ |
| `go vet` / `go build` | ⛔ cannot run — Go toolchain not in sandbox (target scaffold present) |

## Commits in this PR

```
20bedb2 feat: dual-backend restructure — backend-node + backend-go with failover
bdbef9a 08e58370-c0fe-4fdc-9d1d-d16c0a13163b
0e1657f feat: Go backend — modular monolith with PostgreSQL + Redis + Docker
```

> Note: `0e1657f` (Go backend foundation) and `bdbef9a` were committed by a
> prior session but never pushed to `origin/main`. This PR includes them
> because the dual-backend restructure builds on the `backend/go/` folder
> they created. `20bedb2` is the dual-backend restructure + cleanup.

## How to push + create the PR

The sandbox does not have GitHub credentials, so the push must be run from
an authenticated environment:

```bash
# From the repo root, on the feat/dual-backend-restructure branch:
git push -u origin feat/dual-backend-restructure

# Then create the PR (requires gh CLI):
gh pr create \
  --base main \
  --head feat/dual-backend-restructure \
  --title "feat: dual-backend restructure — backend-node + backend-go with failover" \
  --body-file docs/PR_DUAL_BACKEND_RESTRUCTURE.md
```

Or open https://github.com/Roy-Wanyoike/Roycss/compare/main...feat/dual-backend-restructure
and paste the Summary + Changes sections above.

## Docs

- `docs/ROYCSS_BACKEND_ARCHITECTURE.md` — two-layer architecture (running TS + Go target)
- `docs/ROYCSS_MIGRATION_GUIDE.md` — module-by-module Go port plan
- `docs/ROYCSS_BACKEND_TODO.md` — ordered backlog
- `docs/ROYCSS_DATABASE_ARCHITECTURE.md`, `ROYCSS_API_SPECIFICATION.md`,
  `ROYCSS_SECURITY_REPORT.md`, `ROYCSS_PERFORMANCE_REPORT.md`,
  `ROYCSS_OBSERVABILITY.md`, `ROYCSS_DEPLOYMENT.md`, `ROYCSS_TEST_REPORT.md`
