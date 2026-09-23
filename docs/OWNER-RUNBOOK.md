# RoyCSS Owner Runbook (push, publish, reclaim, storage)

**Repo `main` @ `5f97c35`** — all gates green (1,964/1,964 tests · `tsc` 0
errors · API/manifest/token/AI drift gates · publish count-drift gate),
**This file is the single handoff.** Everything below needs the repo owner; everything an agent
could do is already done and verified.

---

## 0. The one-line status

| Dimension | State |
|---|---|
| Test suite | **1,964/1,964** (1,015 frontend unit + 949 backend integration/unit/contract/security) |
| Type / lint | `tsc` 0 errors · `eslint` 0 |
| API truth | api:check in sync (289 routes) · OpenAPI in sync (268 paths) · **api-surface gate green** (new) |
| npm package | Tarball **969.8 KB / 13 files** (pre-batch-53/54 snapshot — re-verify with `bun run publish:validate`, which also fails on description/catalog count drift), consumer install **empirically verified** (no `--ignore-scripts`, zero runtime deps, require/import both → 1,983 effects, all subpaths resolve) |
| Repo size | **35 MB total** (was 143 MB) — history rewrite stripped ~600 MB of zip blobs; **tree byte-identical** (`01184c5` both sides) |
| First-load JS (homepage) | 4,318 → **3,504 kB** (−19%) · Vercel upload 33.7 → **~11.5 MB** (−66%) |
| Production readiness | CONDITIONAL-GO → the 4 P0 blockers of the audit are FIXED in code (legal pages, email lifecycle, DB migrations, deploy env wiring + smoke). Remaining conditions are owner-side: push + secrets provisioning. |

## 1. Push (needs a GitHub token with repo scope)

```bash
cd Roycss   # your local clone of the repository
# Authenticate with `gh auth login` (or a git credential helper) —
# never embed the token in the remote URL.
git push --force-with-lease origin main
```

**Why force:** the history was rewritten to strip ~600 MB of committed zips
(`public/RoyCSS.zip` ×37 = 274.9 MB, `public/roycss.zip` ×19 = 213.3 MB, `roycss.zip` ×10 = 98.6 MB,
`public/roycss-source.zip` ×4 = 16.6 MB, `RoyCSS.zip`, 2 × `.vsix`). Current files are
**byte-identical**; only dead history objects were removed. `.git`: 107 MB → 34 MB.

- The pre-rewrite history is preserved in a full pre-rewrite clone (delete it once the push is confirmed).
- After the push: refresh/rebase the open dependabot PRs (divergence is total), and delete the
  38 stale remote branches (Agent A audit: all ancestry-merged or content-identical:
  `Roy-Wanyoike-patch-{1,2,3}`, `version1.0.1`, the vercel bot branch, session-era squashes,
  superseded feature branches).

## 2. File the 28-issue backlog (needs the same token)

```bash
cd Roycss   # your local clone of the repository
./scripts/github/file-issues.sh --dry-run   # preview
./scripts/github/file-issues.sh             # creates 28 issues (idempotent)
```

11 audit residuals · 10 pending-feature dispatches · 7 owner actions (each with its own runbook
inside the issue body). Future work convention: branch per issue → PR linked to the issue.

## 3. npm publish (needs an npm account)

1. npmjs.com → create account + 2FA (auth-and-writes) → **create the `roycss` org**
   (the namespace is unclaimed; creating it reserves `@roycss/*`)
2. Create an **Automation** token → GitHub secret `NPM_TOKEN`
3. `git tag v2.0.0 && git push origin v2.0.0` → `release.yml` runs the test suite, then
   `npm publish --access public --provenance`
4. Verify in a fresh project: `npm install roycss` (no `--ignore-scripts` needed), then
   `node -e "console.log(require('roycss').length)"` → `1983`

## 4. Vercel 11 GB reclaim (~10 min dashboard work)

1. vercel.com → team → **Usage**: confirm Build Cache + deployment storage are the consumers
   (if "11 GB" was under Observability → Functions → Memory, that's runtime RAM — the bundle
   slimming already addressed it; do not raise memory limits)
2. Project → **Deployments** → filter Preview + old Production → bulk-delete
   (priority: **2026-08-03 → 2026-08-30** — those deployments carry the 63 MB zip)
3. Settings → General → **Clear Build Cache** (after main is pushed, so no cache layer retains
   the excluded dirs)
4. Regrowth prevention is already shipped: `.vercelignore` cuts every future upload 66%.

## 5. Production secrets (code is ready, env-var toggles only)

| Key | Unlocks | Until then |
|---|---|---|
| `RESEND_API_KEY` | Real email for verify/reset (backend) | mock transport logs the links; flows fully work in tests |
| `SENTRY_DSN` | Error tracking (wiring issue PRD-F11 is filed) | nothing breaks, just unobserved |
| `POSTGRES_URL` / `REDIS_URL` | Prod DB + multi-replica rate limiting | SQLite + in-memory limiter; **keep Railway at 1 replica** |
| Stripe keys (PF-010/020) | Paid tiers | pricing honestly says "waitlist" |

## 6. Issue #75 (still open, ~15 min)

Actions billing/spending-limit fix + Vercel deployment-protection off + domain assignment.
The production redeploy is blocked on this — everything code-side is merged and verified.

## 7. Domain decision (UIX-F12)

`roycss.com` (used by sitemap/canonicals/JSON-LD) vs `roycss.space-z.ai` (metadataBase).
Pick one, unify, 301 the other. Filed as an owner-action issue.
