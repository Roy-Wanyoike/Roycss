# Prisma migrations

Baseline + incremental schema migrations for the RoyCSS backend.

- `20260912214858_init` — recreates the full 47-table schema from
  `prisma/schema.prisma` as of the baseline commit (audit F-03).

## How a deploy applies them

`.github/workflows/deploy.yml` runs `bunx prisma migrate deploy` against the
Railway `DATABASE_URL` **before** the new backend revision starts serving
traffic. `migrate deploy` applies pending migrations in order and never
regenerates or resets anything — safe for production.

## Verifying migrations locally (CI-able)

Every change to `prisma/schema.prisma` must ship with a migration:

```bash
cd backend-node

# NOTE: relative SQLite URLs resolve against the schema directory
# (backend-node/prisma/), so "file:./verify.db" lands at prisma/verify.db.

# 1. Create the migration from your schema change (scratch db, never prod):
DATABASE_URL="file:./dev.db" bunx prisma migrate dev --name <change>

# 2. Prove a FRESH database reaches the full schema via migrate deploy only:
rm -f prisma/verify.db
DATABASE_URL="file:./verify.db" bunx prisma migrate deploy
bun -e 'import { Database } from "bun:sqlite";
const db = new Database("backend-node/prisma/verify.db", { readonly: true });
const tables = db.query("SELECT name FROM sqlite_master WHERE type=\"table\"").all();
console.log(`tables=${tables.length}`);'
# Expected: tables=48 (47 app tables + _prisma_migrations). Fail otherwise.

# 3. Confirm the applied schema matches the datamodel (no drift):
bunx prisma migrate diff \
  --from-url "file:$(pwd)/prisma/verify.db" \
  --to-schema-datamodel prisma/schema.prisma
# Expected: "No difference detected" (exit 0; a drift would print statements).

# 4. Clean up:
rm -f prisma/verify.db
```

## Rules

- **Never edit an applied migration** — add a new one instead.
- Dev/test environments may keep using `prisma db push` (the test setup does);
  production **must** come up through `migrate deploy` only.
- Local `dev.db` files created via `db push` predate this baseline and have no
  `_prisma_migrations` rows — that is fine locally. If you want a local db
  tracked by migrations, delete it and re-run `migrate deploy` against a fresh
  file.
