# RoyCSS Database Architecture

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`. Documents both the
> **running** SQLite/Prisma schema and the **target** PostgreSQL schema.

---

## 1. Running today — SQLite via Prisma

- **File:** `backend/prisma/schema.prisma`
- **Database:** `db/custom.db` (SQLite, file-based)
- **Models:** 45
- **Sync:** `bun run db:push` (additive, non-destructive)

### Design principles enforced
- `@default(cuid())` IDs (UUID-equivalent, collision-safe).
- Foreign keys with `onDelete` rules.
- `@unique` constraints on natural keys (email, slug).
- `@@index` on hot query paths (email, foreign keys).
- `@updatedAt` timestamps.
- Soft deletion via status fields where appropriate (not row deletion).
- Versioning via `version` + `latestVersion` on registry-shaped models.

### Key model groups
- **Identity:** User, Organization, Team, License, EnterpriseAuditLog, GovernancePolicy
- **Content:** Collection, EffectFavorite, ContactMessage
- **Learning:** LearningPath, PathProgress, Challenge, ChallengeSubmission, Certification, CertificationAttempt
- **Platform products:** AuditProject, AuditResult, CloudProject, Deployment, FleetProject, StudioProject, PreviewBranch, WorkspaceResource
- **Marketplace:** Template, TemplateReview, Blueprint, Block
- **Community:** SpotlightItem, ObservatorySite, LiveSession, LiveMessage, GoodFirstIssue, RFC, Roadmap, Contributor
- **Tooling:** BenchmarkResult, BundleResult, ProfilerResult, TwinResult, Theme, OSDashboard, ComplianceStandard, ComplianceScan, SearchIndex

### Why SQLite here
The sandbox only supports SQLite. Prisma abstracts the dialect, so the same
schema runs on PostgreSQL in production with no model changes — only the
`datasource` block's `provider` changes from `sqlite` to `postgresql`.

---

## 2. Production target — PostgreSQL

- **Files:** `database/sql/0*.sql` (14 ordered migrations + seed)
- **Applied by:** `backend/go/cmd/migrate`

### Migration files
```
001_extensions.sql      008_patterns.sql       015_playground.sql
002_users.sql           009_collections.sql   016_favorites.sql
003_organizations.sql   010_recipes.sql        017_marketplace.sql
004_projects.sql        011_design_tokens.sql  018_billing.sql
005_taxonomy.sql        012_themes.sql         019_usage.sql
006_effects.sql         013_icons.sql          020_ai.sql
007_components.sql      014_motion.sql         021_api_keys.sql
                                               022_analytics.sql
                                               023_notifications.sql
                                               024_audit_logs.sql
                                               025_search.sql
                                               026_indexes.sql
                                               999_seed.sql
```

### PostgreSQL design rules
- `UUID` primary keys (`gen_random_uuid()`).
- Foreign keys with explicit `ON DELETE` rules.
- `CHECK` constraints for enum-like columns where an enum type is overkill.
- Indexes on every foreign key and every filtered query column.
- `JSONB` only for genuinely flexible payloads (metadata, tags-as-bag) —
  never for core business entities.
- `timestamptz` for all timestamps.
- Append-only tables for financial/credit-sensitive events (usage ledger,
  audit log) — never `UPDATE` or `DELETE` these rows.
- Optimistic concurrency via `version` columns where contention is possible.

### Migration safety
- Migrations are **additive only**. Never `DROP TABLE` in a migration.
- Every migration is reviewed and tested against a staging database before
  production.
- Backups are verified before any migration touches production.
- `999_seed.sql` is idempotent — safe to re-run.

---

## 3. SQLite → PostgreSQL data move

The Prisma models and the SQL migrations describe the **same relational
shape**. The data move is a row-by-row copy:

```bash
# Per table:
sqlite3 db/custom.db ".mode csv" ".headers on" ".output users.csv" "SELECT * FROM users;"
psql roycss -c "\COPY users FROM 'users.csv' WITH (FORMAT csv, HEADER true);"
```

Effect/component/pattern/theme/token/icon/motion content can also just be
re-seeded from `dist/effects.json` via `999_seed.sql` — they are derived
data, not user data.

See `ROYCSS_MIGRATION_GUIDE.md` §4 for the full procedure.

---

## 4. Redis (target only)

Redis is **never** the source of truth. Every cache entry has:

| Property | Rule |
|---|---|
| TTL | Mandatory, per-cache-key TTL. |
| Invalidation | Write-through: mutating an entity deletes its cache keys. |
| Failure behaviour | Cache miss falls through to PostgreSQL; Redis down ≠ outage. |

### Uses
- **Caching:** registry reads, effect detail, search results, theme presets.
- **Rate limiting:** per-IP, per-route sliding windows.
- **Job queue:** background workers (AI, accessibility, analytics, search).
- **Temporary state:** playground sessions, preview branches.

### Anti-uses
- ❌ Primary database.
- ❌ Long-term session storage (PostgreSQL is the source).
- ❌ Financial/credit state (PostgreSQL append-only ledger only).
