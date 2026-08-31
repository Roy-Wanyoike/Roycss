package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"database/sql"
	_ "github.com/lib/pq"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil { log.Fatalf("Failed to connect: %v", err) }
	defer db.Close()

	// Run migrations from database/sql/
	migrationsDir := os.Getenv("MIGRATIONS_DIR")
	if migrationsDir == "" { migrationsDir = "../../database/sql" }

	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil { log.Fatalf("Failed to read migrations: %v", err) }

	for _, f := range files {
		log.Printf("Running %s...", filepath.Base(f))
		content, err := os.ReadFile(f)
		if err != nil { log.Fatalf("Failed to read %s: %v", f, err) }
		_, err = db.Exec(string(content))
		if err != nil { log.Printf("Warning: %s: %v", filepath.Base(f), err) }
	}

	fmt.Println("Migrations complete")
}
