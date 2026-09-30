-- Drop the dead TwinResult table (issue #276, item H).
--
-- The model shipped in the 20260912214858_init baseline but was never
-- wired to a route: the digital-twin module is an in-memory mock
-- (backend-node/src/modules/digital-twin/service.ts builds TwinResult
-- shapes from the hand-written interface in src/types/index.ts, not
-- from Prisma) and `db.twinResult` had zero call sites. The table has
-- no FK dependencies (plain nullable userId + index), so the drop is
-- self-contained. Data loss: none expected — the API never wrote rows.

DROP TABLE IF EXISTS "TwinResult";

-- The table's non-unique indexes die with the table in SQLite and
-- PostgreSQL; drop them defensively first for engines that keep them.
DROP INDEX IF EXISTS "TwinResult_userId_idx";
