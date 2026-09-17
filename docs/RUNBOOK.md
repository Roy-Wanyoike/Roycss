# RoyCSS Ops Runbook

Operational procedures for the running production system: database backup
and restore, rollback, secret rotation, and incident response. This is the
**on-call / maintainer** counterpart to [`docs/OWNER-RUNBOOK.md`](OWNER-RUNBOOK.md)
— that document covers one-time **owner-side** actions (GitHub push, npm
publish, Vercel project reclaim, secrets *provisioning*, domain assignment);
this one covers procedures you re-run for as long as the system is live.
Where a step needs an owner-only dashboard action, it cross-links instead of
duplicating.

## 0. System map (read before an incident)

| Piece | Platform | Source of truth in the repo |
|---|---|---|
| Frontend (Next.js, App Router) | Vercel | `src/app/**`, `vercel.json` (framework + `bun install`) |
| Backend (Express + Prisma) | Railway | `backend-node/src/**`, `backend-node/Dockerfile` |
| Database | SQLite file on a Railway volume (prod) / `backend-node/prisma/dev.db` (local) | `backend-node/prisma/schema.prisma`, `backend-node/prisma/migrations/` |
| Deploy pipeline | GitHub Actions: CI green on `main` → `.github/workflows/deploy.yml` | order is **`bunx prisma migrate deploy` BEFORE `railway up`**, then `GET /api/v1/health` + register/login auth smoke, then Vercel `--prod` with `BACKEND_URL` + `API_MODE=proxy` wired into the Vercel project env |
| Frontend↔backend | `/api/auth/*` proxy routes (`src/app/api/auth/**` → `src/lib/auth-client.ts` `BACKEND_URL`) | cookies `ACCESS_COOKIE` / `REFRESH_COOKIE` |

Two standing constraints to keep in mind during any operation:

- **Railway must stay pinned to 1 replica** until the Redis rate-limiter
  adapter ships (issue #118 / PRD-F10): all five rate-limit tiers live
  in-process (`backend-node/src/server/middleware/rateLimit.ts`), so a second
  replica halves every counter and resets them on every deploy.
- **CI/deploys may be blocked** by the Actions billing situation (issue #75,
  owner action tracked as #136). The manual deploy fallback is in §2.3.

---

## 1. Database backup & restore

### 1.1 What "the database" is

Local dev is a single SQLite file: `DATABASE_URL="file:./dev.db"` resolves
**relative to the schema directory**, so the file lives at
`backend-node/prisma/dev.db` (see the note in
`backend-node/prisma/migrations/README.md`). Production today is the same
SQLite engine on a Railway volume: attach the volume and set
`DATABASE_URL=file:/data/roycss.db` (Railway service settings — see
`backend-node/README.md` → "Deploying to Railway" → SQLite persistence
caveat). If/when the Postgres switch happens (README → "Switch to
Postgres"; also `infrastructure/docker/docker-compose.yml` runs a local
PostgreSQL 16 for the Go backend), the same drill below applies with
`pg_dump`/`pg_restore` in place of file copies, and Railway's Postgres
database service takes its own automatic backups.

### 1.2 Backup cadence

| Scope | Mechanism | Cadence | Retention |
|---|---|---|---|
| Production (Railway volume) | Railway automatic volume backups ("snapshots") | daily, plan-dependent | check the Volumes tab — verify the actual window rather than assuming; if it is shorter than your RPO needs, add the logical dump below |
| Production (belt-and-braces) | `railway ssh` into the service, copy `/data/roycss.db` out (see command below) | weekly, before risky changes (migrations, secret rotation) | 4 weeks, stored off-Railway |
| Local dev | plain file copy — SQLite is a single portable file | whenever you care about your test data | ad hoc |

The database is small (user accounts, refresh-token rows, favorites,
collections, contact messages — 49 app tables per
`backend-node/prisma/schema.prisma`); a copy is cheap. Effects catalog data
is NOT in the database — it is read from `EFFECTS_DATA_PATH`
(`../dist/effects.json`) and is fully reproducible from the repo, so backups
only need to cover user-generated rows.

```bash
# Weekly logical dump from the running Railway service (bun:sqlite ships in
# the runtime image; serialize() returns a full consistent DB image):
railway ssh --service "$RAILWAY_SERVICE_ID" --environment production -- \
  bun -e 'import {Database} from "bun:sqlite"; const db = new Database("/data/roycss.db", {readonly: true}); process.stdout.write(Buffer.from(db.serialize()).toString("base64"));' \
  | base64 -d > roycss-$(date +%F).db
```

Simpler and preferred: Railway dashboard → service → **Settings → Volumes →
Backup now** before any risky operation, and rely on the automatic cadence
otherwise. Record every manual backup in the ops log (issue comment on the
change that prompted it).

### 1.3 Restore drill (run quarterly, and after any restore-tooling change)

The drill proves you can rebuild a working database from a backup file onto
a fresh scratch file, then bring it to the committed migration state. Run it
from `backend-node/`:

```bash
cd backend-node

# 1. Restore the backup onto a scratch file (never over dev.db):
cp <backup>/roycss.db prisma/restore-drill.db

# 2. Bring the restored file to the committed migration state.
#    A backup restored from an older deployment may be missing the newest
#    migration rows — deploy applies pending ones, idempotently:
DATABASE_URL="file:./restore-drill.db" bunx prisma migrate deploy

# 3. VERIFY 50 TABLES — 49 app tables from schema.prisma
#    (47 from 20260912214858_init + 2 from 20260913120000_auth_lifecycle)
#    + _prisma_migrations. A count of 49 means a migration did not apply;
#    anything else means the restore itself is wrong:
bun -e 'import {Database} from "bun:sqlite";
const db = new Database("prisma/restore-drill.db", {readonly: true});
const n = db.query("SELECT count(*) c FROM sqlite_master WHERE type=\"table\"").get();
console.log("tables=" + n.c);'   # EXPECT tables=50

# 4. Confirm migration bookkeeping is consistent:
DATABASE_URL="file:./restore-drill.db" bunx prisma migrate status
#   EXPECT: "2 migrations found" / database schema is up to date

# 5. Confirm no drift between the restored schema and the datamodel:
bunx prisma migrate diff \
  --from-url "file:$(pwd)/prisma/restore-drill.db" \
  --to-schema-datamodel prisma/schema.prisma
#   EXPECT: "No difference detected"

# 6. Row-level sanity: the counts you recorded at backup time should survive
bun -e 'import {Database} from "bun:sqlite";
const db = new Database("prisma/restore-drill.db", {readonly: true});
for (const t of ["User","RefreshToken","ContactMessage","EffectFavorite","ApiKey"]) {
  console.log(t, db.query("SELECT count(*) c FROM " + t).get().c);
}'

# 7. Boot the backend against the restored file and smoke auth:
DATABASE_URL="file:./restore-drill.db" PORT=4001 bun run dev
curl -s localhost:4001/api/v1/health

# 8. Clean up:
rm -f prisma/restore-drill.db
```

Restoring **production** means: Railway dashboard → volume → restore the
snapshot onto the volume (or swap in the dumped file via `railway ssh`),
then restart the service, then re-run steps 3–5 above through the service
shell. The frontend needs no action — it only talks to the backend origin.
Expect every logged-in user to re-authenticate: refresh-token rows restored
from the backup carry hashes of JWTs signed by the then-current secrets; if
secrets rotated since the snapshot, those rows are unreachable (fail-closed
by design — `backend-node/src/modules/auth/sessions.ts`).

### 1.4 Prisma command discipline (read once, avoid classic footguns)

- **`bunx prisma migrate deploy`** (npx works identically) — the only
  command production ever runs; applies pending committed migrations in
  order, never resets. This is what `.github/workflows/deploy.yml` executes
  against the Railway `DATABASE_URL` **before** `railway up`.
- **`bunx prisma migrate resolve`** — bookkeeping only, for a migration
  marked failed in `_prisma_migrations` (e.g. a deploy interrupted mid-apply
  where the SQL is actually applied): `bunx prisma migrate resolve --applied
  20260913120000_auth_lifecycle`. It edits the ledger; it does not run or
  revert SQL. If a migration genuinely failed partway on SQLite, the safe
  path is restore-from-snapshot + re-deploy, not resolve.
- **`bunx prisma db push`** — dev/test convenience sync with NO migration
  history (the backend test setup uses it). **Never** run it against
  production: it can silently shape the schema away from the committed
  migrations, and every future `migrate deploy` then disagrees with reality.
  Local `dev.db` files created via `db push` have no `_prisma_migrations`
  rows — that is fine locally, but it is why the drill above uses a fresh
  file.
- **Never edit an applied migration.** New schema change = new migration
  directory + the fresh-file verification recipe in
  `backend-node/prisma/migrations/README.md`.

---

## 2. Rollback

### 2.1 Frontend (Vercel) — promote a previous deployment

1. Vercel dashboard → the RoyCSS project → **Deployments** → filter
   **Production**.
2. Find the last known-good deployment (the one before the incident — check
   its commit SHA and build logs).
3. Its `⋯` menu → **Promote to Production**. Vercel re-routes production
   traffic to that immutable build within seconds; no rebuild happens.
4. CLI equivalent: `npx vercel@latest ls --prod`, then
   `npx vercel@latest promote <deployment-url>`.
5. Verify: fetch the site, confirm the metadata/version, and re-run the
   frontend smoke (homepage renders, an effect page renders).

Caveats: (a) promotion only works if the old deployment **still exists** —
when doing the storage-reclaim cleanup ([`docs/OWNER-RUNBOOK.md`](OWNER-RUNBOOK.md)
§4, issue #135), always keep the last few production deployments. (b) The
promoted build reads the **current** Vercel env (`BACKEND_URL`, `API_MODE`)
at runtime — if the backend URL also changed during the incident, fix the
env first. (c) Preview URLs are unaffected — Next's metadata fallback keeps
them working regardless of `metadataBase`.

### 2.2 Backend (Railway) — roll back the service

1. Railway dashboard → the backend service → **Deployments**.
2. Pick the previous healthy revision (each has the commit + healthcheck
   result) → **Rollback**. Railway redeploys that exact image; no rebuild.
3. Verify: `GET /api/v1/health` answers 200, then the auth round-trip
   (register a throwaway user + login → expect `201`/`200` + an access
   token) — this is the same smoke `.github/workflows/deploy.yml` runs.
4. Remember the order: **migrations applied by the bad deploy stay
   applied.** Railway rollback reverts code, not schema — see §2.4 before
   touching the database.

A Railway rollback does **not** revert environment variables or the volume;
if the incident involved a bad variable change, fix the variables and
redeploy after rolling back.

### 2.3 git revert + full redeploy (the clean path)

When the bad change is identified and a quick promote/rollback is not enough
(a bad migration, a bad env contract, anything that must leave the repo):

```bash
git revert <bad-sha>          # one commit per bad SHA, clean history
git push origin main
```

CI runs (`tsc`, `eslint`, the vitest suites, the API gates); on green,
`deploy.yml` fires automatically (workflow_run trigger) and re-runs the full
ordered pipeline: `migrate deploy` → Railway up → health + auth smoke →
Vercel env wiring → `--prod` deploy. If Actions are blocked (issue #75),
gate locally first — `bunx tsc --noEmit && bunx eslint . && bunx vitest run
tests/unit && bunx vitest run --root backend-node` — then deploy manually:
`railway up` (from `backend-node/`) and `npx vercel@latest --prod` (from the
repo root), and run the two smokes by hand. Promote/rollback (§2.1/§2.2) is
faster than revert+redeploy; prefer it for user-facing breakage and use
revert+redeploy to make the fix durable.

### 2.4 Database rollback decision tree — when NOT to roll back the DB

**Default: never roll back the database.** Both committed migrations
(`20260912214858_init`, `20260913120000_auth_lifecycle`) are pure
`CREATE TABLE` — additive — so old code + new schema is safe, and the right
move for a bad backend deploy is code rollback (§2.2) with the schema left
alone.

Reach for a database restore (snapshot → §1.3) only when the DATA itself is
corrupt, and weigh what a restore destroys:

1. **Is the incident code-only?** (wrong output, 500s, broken UI) → roll
   back code; DB untouched. Stop here — this is ~every incident.
2. **Did a migration lose/damage rows?** (destructive SQL, bad data
   migration) → estimate damage vs. snapshot age. A restore loses
   everything written since the snapshot (signups, contact messages,
   favorites, API keys minted since). A surgical forward-fix (write a
   corrective migration/script) usually loses less than a restore.
3. **Is the schema itself broken?** (migration half-applied, drift from
   `db push` misuse) → try `migrate resolve --applied <name>` only for
   ledger repair; for real half-applied state, restore the snapshot and
   re-run `migrate deploy` (§1.3 steps 2–5).
4. **Secrets compromised?** → that is rotation (§3.1), not a DB restore;
   the fail-closed refresh rows already limit the blast radius.

There is **no `migrate rollback` in production**, ever: the repo's rule
(`backend-node/prisma/migrations/README.md`) is forward-only — revert
schemas by adding a new migration, the same way you revert code by adding a
commit.

---

## 3. Secret rotation

All production secrets live as **Railway service variables** (environment
`production`) — the deployed image reads env only (`backend-node/Dockerfile`
runtime has no `.env`). Changing a variable and redeploying is the
mechanism for every rotation below. Validation happens at boot in
`backend-node/src/config/env.ts`: in production, JWT secrets < 48 chars or
placeholder-looking values **refuse to boot** (`process.exit(1)`), so a bad
rotation fails loudly at the healthcheck, not silently at runtime.

### 3.1 `JWT_SECRET` + `JWT_REFRESH_SECRET` (staged rotation)

Architecture that makes this safe: access tokens live ≤ 15 min
(`JWT_EXPIRES_IN`, HS256, `JWT_SECRET`); refresh tokens live ≤ 7 days
(`JWT_REFRESH_EXPIRES_IN`, HS256, `JWT_REFRESH_SECRET`, distinct secret —
`backend-node/src/lib/jwt.ts`) **and every refresh token has a
`RefreshToken` DB row keyed by SHA-256 of the full JWT**
(`backend-node/src/modules/auth/sessions.ts`). Two consequences: (a) a
verified refresh JWT with no live row is rejected — fail closed; (b) wiping
rows is itself a global session kill-switch, independent of secrets.

Generate fresh secrets (two DIFFERENT values, ≥ 48 chars to pass the prod
gate): `openssl rand -base64 48` twice.

**Scheduled (staged, minimal user impact):**

1. **Stage 1 — rotate `JWT_SECRET` only.** Update the Railway variable,
   redeploy. All access tokens die instantly; clients silently refresh
   (refresh secret unchanged) and get new access tokens. Users notice
   nothing. This validates the new-secret plumbing with zero blast radius.
2. **Stage 2 (next maintenance window) — rotate `JWT_REFRESH_SECRET`.**
   Update the variable, redeploy. Every outstanding refresh JWT now fails
   signature verification → `POST /api/v1/auth/refresh` returns 401 → the
   frontend proxy route clears both cookies (`src/app/api/auth/refresh/route.ts`)
   and the user re-logs in. One-time, global, expected — announce it.
3. **Invalidate the orphaned refresh rows.** After Stage 2 no code path can
   read the old rows (verification happens before the row lookup), but they
   linger. Purge immediately after the redeploy, before users re-login:
   ```bash
   railway ssh --service "$RAILWAY_SERVICE_ID" --environment production -- \
     bun -e 'import {Database} from "bun:sqlite"; const db = new Database("/data/roycss.db"); console.log(db.run("DELETE FROM RefreshToken"));'
   ```
   (On Postgres: `bunx prisma db execute --stdin` with
   `DELETE FROM "RefreshToken";` — same timing rule.) Rows created after
   this point belong to fresh logins and must be left alone.
4. **Verify:** health 200, register+login round-trip, and one real login
   through the frontend.

**Emergency (confirmed or suspected secret compromise):** do Stages 1+2 in
one variable update + single redeploy, then the row purge, then verify.
User impact is the same one forced re-login; passwords are unaffected
(bcrypt hashes in `User.passwordHash` are independent of JWT secrets).

**Do not forget the DB kill-switch:** if you only need to kill sessions
(e.g. a stolen-token report) without rotating secrets, deleting the
affected user's `RefreshToken` rows (or all rows) is sufficient —
fail-closed does the rest. Individual users can also be forced out via the
existing `revokeAllUserSessions` path (password reset / logout-all,
`backend-node/src/modules/auth/service.ts`).

### 3.2 `RESEND_API_KEY`

Lives as an optional Railway variable (documented in
`backend-node/.env.example`); when unset, the mailer falls back to the mock
transport (links logged, nothing sent), so rotation never breaks auth flows
— email verify/reset links still generate.

1. Resend dashboard → API Keys → **create a new key** (do not delete the
   old one yet).
2. Update `RESEND_API_KEY` on the Railway service → redeploy.
3. Verify: register a test user and confirm the verification email arrives
   from the `MAIL_FROM` identity (that sender domain must stay verified in
   Resend). If the backend logs still show mock-transport output, the
   variable did not take effect — check the environment, not the code.
4. Revoke the old key in Resend only after verification.

No session impact; no frontend change. `APP_URL` (the origin embedded in
emailed links) is a related but separate variable — after the canonical
domain is settled (#113), keep `APP_URL=https://roycss.com` consistent with
it.

### 3.3 `SENTRY_DSN`

Validated at boot by `backend-node/src/config/env.ts` but **not yet wired
into an SDK** (issue #119 / PRD-F11 — no Sentry init exists in the code
yet). Today, rotating it is a pure variable swap with no runtime effect:

1. Sentry dashboard → the project → Settings → Client Keys (DSN) → generate
   the new DSN.
2. Update `SENTRY_DSN` on the Railway service → redeploy.
3. After issue #119 wires the SDK: re-verify error ingestion (throw a test
   error, watch it land in Sentry) — the DSN is read at boot, so a
   redeploy is always required.

When #119 lands, also revisit this section: Sentry SDKs may hold a second
auth token (`SENTRY_AUTH_TOKEN` for source-map upload) which follows the
same rotate-on-redeploy procedure.

### 3.4 `DATABASE_URL`

Rotation here means one of two things, both of which touch data:

- **Credential rotation (Postgres deployments):** rotate the password in the
  Railway database service settings, update `DATABASE_URL` on the backend
  service, redeploy, then verify health + auth smoke. Expect a brief window
  of connection errors during the restart — that is the whole outage. No
  data impact.
- **Moving the SQLite file / switching engines:** changing `DATABASE_URL` on
  Railway does **not** carry data over — a new path starts empty (migrations
  create the 50 tables, but zero rows). Sequence: snapshot/backup the old
  database (§1.2) → restore onto the new location (§1.3) → repoint
  `DATABASE_URL` → redeploy → verify. The Postgres engine switch itself
  additionally requires the schema-provider change and a fresh baseline
  migration — follow `backend-node/README.md` → "Switch to Postgres"
  (the committed baseline and `migration_lock.toml` are SQLite-specific).

For any `DATABASE_URL` change, run the §1.3 verification steps (50 tables,
`migrate status`, no drift) against the new target before pointing
production traffic at it.

---

## 4. Incident response

### 4.1 Severity

Use the committed definitions — do not invent new levels mid-incident. For
**operational** incidents (site down, deploy broken, data damage) use
[`docs/SLA.md`](SLA.md) §2: **P0** — production broken for a broad set of
users, data loss or security impact (site hard-down, corrupted artifact);
first response 1 hour, mitigation (which may be a rollback — §2) within 24
hours. **P1** — documented surface broken for a subset (a `/api/v1` route
500s, WCAG failure on a primary surface); 4 hours. **P2** — works but wrong
(docs/code drift, degraded tooling); next business day. **P3** — cosmetic;
best effort within a week. When in doubt, triage high and downgrade.

**Security incidents never route through this table**: reports go private
immediately — GitHub Security Advisories (and `security@roycss.dev` once
that mailbox is provisioned, issue #137) — and follow
[`docs/SECURITY-SLA.md`](SECURITY-SLA.md): 24 h acknowledgement, 72 h
assessment, **72 h fix for confirmed Critical**, coordinated 90-day
disclosure.

### 4.2 Communications channels

- **Detection (current, honest state):** there is no wired alerting yet —
  SENTRY_DSN is validated but unwired (#119) and route-metrics are
  in-memory only. Until #119 and an uptime check on `GET /api/v1/health`
  exist, detection is: Railway/Vercel deploy failure emails, GitHub Actions
  failures, and manual checks. Treat wiring alerting as a P1 follow-up of
  any incident that was detected late.
- **During a P0/P1:** open a GitHub issue titled `[INCIDENT] <one-liner>`
  on `Roy-Wanyoike/Roycss` immediately — it is the timestamped system of
  record (timeline, impact, decisions). Update the README deployment-status
  note (the established operational-honesty pattern, per
  [`docs/SLA.md`](SLA.md) §1) so the site itself does not over-promise.
  Reply on the originating user report if there is one. Do not discuss
  security details publicly.
- **Resolution:** close the loop on every channel you touched — issue
  comment with the fix SHA, README status restored, users who reported
  notified.

### 4.3 Post-mortems

Every P0 (and every security Critical, which additionally follows the
30-day published-postmortem rule in [`docs/SECURITY-SLA.md`](SECURITY-SLA.md)
§5/§8) gets a blameless post-mortem within 5 business days, committed to
`docs/postmortems/` and linked from the incident issue. One paragraph of
policy: post-mortems are blameless toward people and merciless toward
process — the goal is the fix, not the fault; anything the runbook failed to
cover becomes a runbook PR, and anything the runbook covered but was not
followed becomes a conversation about why (usually: the step was wrong, make
it right).

Template (copy under `docs/postmortems/YYYY-MM-DD-<slug>.md`):

```markdown
# Post-mortem: <title> (P0|P1|security-Critical)

- **Incident issue:** #<n>  · **Dates (UTC):** <start–end>  · **Severity:** <P0…>
- **Authors:** <who>  · **Status:** final

## Summary
One paragraph: what broke, for whom, for how long.

## Timeline (UTC)
- <timestamp> — detection, decision, action, resolution (include the
  first-user-impact and full-recovery timestamps explicitly).

## Impact
Users affected, requests failed, data written/lost, uptime delta.

## Root cause
The technical cause AND the process gap that let it reach production.

## What went well / what went wrong
Detection, comms, rollback speed; friction points, missing signals.

## Action items
| Action | Owner | Issue |
|---|---|---|
| <concrete change> | <name> | #<n> |
```

---

*Cross-references: owner-side one-time actions → [`docs/OWNER-RUNBOOK.md`](OWNER-RUNBOOK.md);
support SLA and severity definitions → [`docs/SLA.md`](SLA.md); security
process → [`docs/SECURITY-SLA.md`](SECURITY-SLA.md); migration discipline →
`backend-node/prisma/migrations/README.md`; deploy pipeline order →
`.github/workflows/deploy.yml`.*
