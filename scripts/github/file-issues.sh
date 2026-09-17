#!/usr/bin/env bash
# =============================================================================
# file-issues.sh — create the Roycss GitHub issue backlog in one shot.
#
# PREREQUISITE (owner): a GitHub token with repo scope, exported as GITHUB_TOKEN
#   export GITHUB_TOKEN="ghp_..."   (or github_pat_...)
#   ./file-issues.sh [--dry-run]
#
# Creates issues under Roy-Wanyoike/Roycss with labels: audit, P0/P1/P2,
# owner-action, feature. Idempotency: greps for an issue by its title marker
# before creating, so re-running is safe.
#
# Issue sources: session-4 UI/UX audit + production-readiness audit (full
# reports preserved in the repo docs history and the session worklog) +
# docs/PENDING-FEATURES.md residuals.
# =============================================================================
set -euo pipefail

REPO_API="https://api.github.com/repos/Roy-Wanyoike/Roycss"
DRY_RUN="${1:-}"

if [ -z "${GITHUB_TOKEN:-}" ] && [ "$DRY_RUN" != "--dry-run" ]; then
  echo "ERROR: export GITHUB_TOKEN first (repo scope needed to create issues)." >&2
  exit 1
fi

auth_header() { [ -n "${GITHUB_TOKEN:-}" ] && echo "-H \"Authorization: Bearer $GITHUB_TOKEN\""; }

issue_exists() {
  local marker="$1"
  # returns 0 if an open issue whose title contains the marker exists;
  # any API problem (no token, rate limit, error payload) => assume NOT existing
  curl -s ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} \
    "$REPO_API/issues?state=open&per_page=100" \
    | python3 -c "
import json, sys
try:
    issues = json.load(sys.stdin)
except Exception:
    sys.exit(1)
if not isinstance(issues, list):
    sys.exit(1)  # API error payload — assume not existing
marker = '''$marker'''
sys.exit(0 if any(marker in i['title'] for i in issues if 'pull_request' not in i) else 1)
"
}

ensure_label() {
  local name="$1" color="$2" desc="$3"
  curl -s -X POST ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} \
    -H "Accept: application/vnd.github+json" \
    "$REPO_API/labels" \
    -d "{\"name\":\"$name\",\"color\":\"$color\",\"description\":\"$desc\"}" > /dev/null || true
}

file_issue() {
  local title="$1" labels="$2" body="$3"
  if issue_exists "${title:0:40}"; then
    echo "SKIP (exists): $title"
    return
  fi
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "DRY-RUN would create [$labels] $title"
    return
  fi
  local payload
  payload=$(python3 - "$title" "$labels" "$body" << 'PY'
import json, sys
print(json.dumps({"title": sys.argv[1], "labels": sys.argv[2].split("+"), "body": sys.argv[3]}))
PY
)
  curl -s -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$REPO_API/issues" -d "$payload" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('CREATED', d.get('number', '?'), d.get('title', d.get('message')))"
}

# ── labels ───────────────────────────────────────────────────────────────────
for l in "audit:d7262e:From a session audit" "P0:b60205:Blocks onboarding" \
         "P1:e3b341:Should fix soon" "P2:c5def5:Polish" \
         "owner-action:5319e7:Requires repo owner" "feature:1d76db:Pending-feature backlog"; do
  IFS=: read -r name color desc <<< "$l"
  [ "$DRY_RUN" = "--dry-run" ] || ensure_label "$name" "$color" "$desc"
done

# ════════════════════════════════════════════════════════════════════════════
# 1. REMAINING AUDIT FINDINGS (not yet fixed — everything else was fixed
#    in session 4 and verified by the 1,268-test gate suite)
# ════════════════════════════════════════════════════════════════════════════

file_issue "UIX-F11 — Consolidate the three docs surfaces into /docs/**" audit+P1 "## Finding (UI/UX audit F-11)
Three documentation surfaces with divergent content, counts, and class conventions: the DocsViewer sheet (compiled from the 800KB docs-data blob), homepage #docs DocCards, and the 36 hand-written /docs route pages.

## Fix
Make /docs/** routes the single source of truth: navbar Docs navigates there; retire the DocsViewer sheet + its blob (also removes ~800KB from the lazy chunk). Related: after retirement, regenerate docs-content.json.

## Effort
M"

file_issue "UIX-F12 + SEO — Pick the canonical domain and unify (roycss.com vs space-z.ai)" owner-action "## Finding (UI/UX audit F-12)
layout.tsx metadataBase says https://roycss.space-z.ai while static-effects.ts SITE_URL, JSON-LD, sitemap, and effect canonicals all use https://roycss.com — split indexing signals at launch.

## Fix (owner decision required first)
1. Decide the production domain.
2. Set metadataBase, SITE_URL, JSON-LD url, and OG tags to the same origin.
3. 301-redirect the other domain at the edge (Vercel domains settings).

## Effort
S (after the decision)"

file_issue "UIX-F14 — Consolidate on one toast system (sonner vs use-toast)" audit+P1 "## Finding (UI/UX audit F-14)
layout.tsx mounts BOTH toasters; 29 components use the radix use-toast and 8 use sonner — two visually distinct toast systems ship to production.

## Fix
Consolidate on Sonner; delete use-toast + its Toaster; migrate the 29 call sites.

## Effort
M"

file_issue "UIX-F17/F18 — Typography + color-token polish" audit+P2 "## Findings (UI/UX audit)
- F-17: text-[9px]/text-[10px] badges and kbd hints (search-overlay.tsx, roycss-page.tsx) render below comfortable legibility on mobile → raise to >=11px.
- F-18: docs pages hardcode text-emerald-700 instead of the primary token (drift risk) → replace with text-primary.

## Effort
S"

file_issue "UIX-F19 — Per-effect OG images (all 1,959 share one og.png)" audit+P2 "## Finding (UI/UX audit F-19)
One static og.png serves every page — effect pages get generic social cards.

## Fix
Per-effect OG via ImageResponse in src/app/api/og/route.ts (or category-level variants as a cheaper first cut).

## Effort
M"

file_issue "UIX-F20 — i18n readiness (defer to a decision)" audit+P2 "## Finding (UI/UX audit F-20)
All UI strings hardcoded EN; marquee is LTR-centric; manifest says dir:ltr. Fine for an English-only launch. If i18n is on the roadmap (PF-031), extract strings BEFORE adding languages. No action until the roadmap decision.

## Effort
L (deferred)"

file_issue "PRD-F10 — Redis rate-limiter adapter behind the existing seam" audit+P1 "## Finding (production-readiness audit F-10)
All 5 rate-limit tiers + per-key limiter are in-process memory: counters reset on every deploy, halve when Railway scales past 1 replica. Acceptable at launch scale ONLY with Railway pinned to 1 replica.

## Fix
Ship the Redis adapter behind the existing setRateLimiter() seam (PF-003/PF-008 hooks already exist). Until then: pin Railway to 1 replica and note the constraint in the runbook.

## Effort
M"

file_issue "PRD-F11 — Wire Sentry (SENTRY_DSN is validated but never used)" audit+P1 "## Finding (production-readiness audit F-11)
env.ts validates SENTRY_DSN but no Sentry init exists anywhere in src/ — no error tracking, no alerting; route-metrics are in-memory only.

## Fix
@sentry/node init guarded by DSN + express error-handler integration; add an uptime check on /api/v1/health/ready (Railway health-check or BetterStack).

## Effort
S"

file_issue "PRD-F12 residual — dependency bumps (morgan, express/qs, prisma/deepmerge-ts, dev chain)" audit+P1 "## Finding (production-readiness audit F-12, residual after session-4 work)
next-auth (critical CVE carrier) was already removed in session 4. Remaining: morgan <1.12 (log forging, moderate), qs via express body-parser (2 moderate), deepmerge-ts via prisma (high), dev-chain updates (vitest/eslint/picomatch/fast-uri).

## Fix
bun update in root + backend-node; run the full gate suite (1,268 tests) after.

## Effort
S"

file_issue "PRD-F14 — Write docs/RUNBOOK.md (backup, rollback, secret rotation)" audit+P1 "## Finding (production-readiness audit F-14)
No backup/restore procedure, no rollback runbook, no secret-rotation procedure anywhere in the repo (only aspirational SLA language).

## Fix
docs/RUNBOOK.md covering: DB backup cadence + restore drill (Railway volume snapshots), Vercel promote-previous-deployment + railway rollback steps, JWT secret rotation (practical now that refresh tokens are DB-backed rows).

## Effort
S"

file_issue "PRD-F21 — API-key management UI (account panel)" audit+P2 "## Finding (production-readiness audit F-21)
No UI to mint/list/revoke API keys (curl-only); /auth/api-keys endpoints exist and are tested.

## Fix
Account panel on top of the existing endpoints: keys list, one-time reveal, revoke. Add a support email in the footer.

## Effort
M"

# ════════════════════════════════════════════════════════════════════════════
# 2. PENDING-FEATURE BACKLOG (sandbox-safe next dispatches)
# ════════════════════════════════════════════════════════════════════════════

file_issue "PF-030 — Token type system emission (tokens.d.ts + tokens.dtcg.json)" feature "## Scope (docs/PENDING-FEATURES.md PF-030)
scripts/emit-tokens.ts emits dist/tokens.d.ts + tokens.dtcg.json from the design-token source; static validator; round-trip CI test.

## Effort
M"

file_issue "PF-021 (content half) — AI conformance artifacts (roycss.rules.md + system prompt + training pairs)" feature "## Scope
dist/roycss.rules.md + system-prompt + grammar + training pairs generated from the catalog; AI conformance scaffold.

## Effort
M"

file_issue "PF-042 — Unified roycss.manifest.json + maturity tags + effect-quality scores" feature "## Scope
Unified manifest; maturity tags; effect-quality score population (src/lib/effect-quality.ts exists, unused); naming-convention gate.

## Effort
M–L"

file_issue "PF-007 — Deep-path tests toward 80% coverage" feature "## Scope
Deep-path tests for ~50 modules to reach the 80% coverage floor; e2e job now wired in CI (session 4), extend as specs stabilize.

## Effort
L (chunkable)"

file_issue "PF-014 residuals — Versioned docs routing /docs/[version]/ + edit-on-GitHub + feedback widget" feature "## Scope
Versioned docs routing, edit-on-GitHub link, docs feedback widget, docs-sample CI.

## Effort
M"

file_issue "PF-035 / PF-036 — !important audit + @layer ordering; roycss lint CLI" feature "## Scope
- PF-035 (V1 slice): !important audit script + @layer ordering for roycss.css.
- PF-036 (V1 slice): roycss lint [--fix] CLI exposing the existing inspector engine.

## Effort
M each"

file_issue "PF-031 — i18n message catalog + RTL marquee + Playwright multi-browser matrix" feature "## Scope
Message catalog extraction, RTL-safe marquee fix, Playwright matrix (chromium/firefox/webkit). Pairs with the UIX-F20 decision.

## Effort
M"

file_issue "PF-045 — /roadmap page + contributor ladder" feature "## Scope
Public /roadmap page fed by PENDING-FEATURES (or a data cut of it) + contributor ladder section in CONTRIBUTING.

## Effort
S"

file_issue "roycss-cli de-bun + publish as its own npm package" feature "## Scope
cli/index.js shebang #!/usr/bin/env bun -> node; 2 Bun.spawn (clipboard) calls -> node:child_process; then publishable as roycss-cli. The CLI bundle embeds the full 1,959-effect catalog already.

## Effort
S"

file_issue "VS Code extension data refresh (css-data.json is 1,569 — catalog is 1,959)" feature "## Scope
vscode-extension/build-data.js rerun against the current catalog + snippets/class-data regeneration; rebuild the .vsix when the publisher identity is registered (publisher 'roycss' is currently unregistered on the marketplace).

## Effort
S–M"

# ════════════════════════════════════════════════════════════════════════════
# 3. OWNER ACTIONS (cannot be delegated to agents)
# ════════════════════════════════════════════════════════════════════════════

file_issue "OWNER — Verify the 2026-09-18 push: main @ 7dfdd5e, slimmed history, single-branch remote" owner-action "## Status
The push EXECUTED on 2026-09-18 by the engineering agent (token provided by owner via upload):

- main force-updated ab667f1 → 7dfdd5e with --force-with-lease (53 session-4 commits on top; tsc 0, eslint 0, 1,268/1,268 tests, api:check + OpenAPI + api-surface gates green, npm tarball empirically verified).
- History rewrite stripped ~600MB of committed zip artifacts; current tree byte-identical; .git 107MB → 34MB.
- All 43 stale remote branches deleted after containment verification; remote now single-branch (main).
- 5 Dependabot PRs (#107–#111) closed with explanation — they will be re-proposed against the new base.
- Fresh-clone measurement: 4.5s, 69MB working copy (previously >143MB history, extremely slow).
- Full pre-rewrite history preserved locally: work/roycss-old-history-backup-2026-09-18.bundle (106MB, 62 refs).

## Verification checklist (close this issue once confirmed)
- [ ] GitHub repo page loads fast; main @ 7dfdd5e
- [ ] CI runs on the new main (watch the Actions tab; missing secrets are tracked in a separate issue)
- [ ] Vercel picks up the deployment (reclaim runbook in docs/OWNER-RUNBOOK.md if the project is detached)"

file_issue "OWNER — npm publish roycss v2.0.0 (blockers all fixed + empirically verified)" owner-action "## What
The package is publish-ready: tarball 969.8 KB / 13 files; consumer install WITHOUT --ignore-scripts proven (exit 0, zero runtime deps, require 1959 / import 1959, all subpaths resolve); release.yml reads the real manifest and test-gates before publishing; changesets operational.

## Steps
1. npmjs.com → create account + 2FA (auth-and-writes) → create the roycss org (namespace unclaimed — first-come-first-served; reserves @roycss/*)
2. Create an Automation token → GitHub secret NPM_TOKEN
3. After pushing main: git tag v2.0.0 && git push origin v2.0.0 → release.yml runs tests then npm publish --access public --provenance
4. Verify: npm view roycss version, then npm install roycss in a fresh project"

file_issue "OWNER — Vercel storage reclaim runbook (~11GB)" owner-action "## Root cause (diagnosed session 3)
~300–500 retained deployments, including 118 deployments (Aug 3–30) that each uploaded a 63MB public/roycss.zip (≈7.4GB) + ~200 × 34MB (≈6.8GB) + build cache layers.

## Runbook (~10 min)
1. vercel.com → team → Usage: confirm Build Cache + deployment storage are the consumers (if the 11GB was Observability → Functions → Memory, that's runtime RAM — the bundle slimming already addressed it; don't raise memory limits)
2. Project → Deployments → filter Preview + old Production → bulk-delete (priority: 2026-08-03 → 2026-08-30 — those carry the 63MB zip)
3. Settings → General → Clear Build Cache (after the .vercelignore merge, so no cache layer retains excluded dirs)
4. Regrowth prevention (already shipped): .vercelignore cuts every future upload by 66% (33.7MB → ~11.5MB)

## Repo-side (already done)
.vercelignore, lazy DocsViewer (first-load JS 4,318 → 3,504 kB), 7 dead components deleted (2,210 lines), render.yaml removed."

file_issue "OWNER — Issue #75 remains: Actions billing + Vercel deploy protection + domain assignment" owner-action "Unchanged from session 3 (issue #75 has the ~15-min runbook): Actions account-level spending-limit fix + Vercel deployment-protection off + domain assignment. The production redeploy is blocked on this."

file_issue "OWNER — security@roycss.dev mailbox + PGP key" owner-action "security/SECURITY-POLICY.md (v1.1) points at security@roycss.dev with GitHub Security Advisories as the interim live channel. Provision the real mailbox and publish the PGP key (SECURITY-POLICY has the TBD slot)."

file_issue "OWNER — Deploy-platform decision: Fly.io launch files archived (fly.toml/Dockerfile/docker-entrypoint)" owner-action "## Context
The branch flyio-new-files (Aug 30 experiment: root Dockerfile + fly.toml + docker-entrypoint.js + .dockerignore, 320 lines) was removed during the 2026-09-18 branch cleanup — its content is archived locally at work/archive/flyio-launch/ (all 5 files + the package.json diff). The Vercel Web Analytics install patch from the early lineage is archived at work/archive/0001-Install-Vercel-Web-Analytics.patch.

## Decision needed
If Fly.io is part of the hosting roadmap, port those files into infrastructure/ (they are trivially re-addable); otherwise Vercel (current) + Railway backend stands. Also decide whether to install Vercel Web Analytics on the new main (one-line layout mount + package entry)."

file_issue "OWNER — PF-004 external half: contract a WCAG 2.2 AA auditor + VPAT 2.4" owner-action "The code half shipped (per-effect a11y tags: 431 motion-safe / 1,692 decorative / 90 aria-noted; tiers documented in docs/EFFECT-A11Y-TIERS.md; 25 drift-gate tests). The external audit + VPAT 2.4 are third-party deliverables — contract an auditor."

file_issue "OWNER — Production infra keys (Resend, Sentry, PostgreSQL/Redis/S3, Stripe when billing lands)" owner-action "Provision when ready: RESEND_API_KEY (email verify/reset are live with mock transport until then), SENTRY_DSN (see PRD-F11 wiring issue), PostgreSQL/Redis/S3 per PF-003, Stripe Connect per PF-010/020. All are env-var toggles — no code changes needed."

echo ""
echo "Done. (Use --dry-run to list without creating.)"
