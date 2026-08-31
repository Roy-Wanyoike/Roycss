// cmd/migrate/main.go applies the SQL migration files in database/sql/ to
// PostgreSQL. Migrations are applied in filename order (001_…, 002_…, …)
// and are idempotent (IF NOT EXISTS). A `schema_migrations` table tracks
// applied files so re-runs skip them.
//
// Usage:
//   DATABASE_URL=postgres://user:pass@host:5432/roycss go run ./cmd/migrate
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	migrationsDir := os.Getenv("MIGRATIONS_DIR")
	if migrationsDir == "" {
		migrationsDir = "../database/sql"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	// Ensure the migrations tracking table exists.
	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`); err != nil {
		log.Fatalf("create schema_migrations: %v", err)
	}

	// List migration files in order.
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("read migrations dir %s: %v", migrationsDir, err)
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	applied := 0
	for _, f := range files {
		var exists bool
		if err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE filename=$1)", f).Scan(&exists); err != nil {
			log.Fatalf("check %s: %v", f, err)
		}
		if exists {
			fmt.Printf("  skip %s (already applied)\n", f)
			continue
		}
		raw, err := os.ReadFile(filepath.Join(migrationsDir, f))
		if err != nil {
			log.Fatalf("read %s: %v", f, err)
		}
		if _, err := pool.Exec(ctx, string(raw)); err != nil {
			log.Fatalf("apply %s: %v", f, err)
		}
		if _, err := pool.Exec(ctx, "INSERT INTO schema_migrations (filename) VALUES ($1)", f); err != nil {
			log.Fatalf("record %s: %v", f, err)
		}
		fmt.Printf("  ✓ applied %s\n", f)
		applied++
	}
	fmt.Printf("\nDone. %d migration(s) applied, %d total files.\n", applied, len(files))
}
